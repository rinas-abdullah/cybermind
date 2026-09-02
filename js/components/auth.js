/**
 * Frontend Authentication Service
 * Handles user authentication, token management, session persistence,
 * protected actions, and redirect-after-login flow.
 */

class AuthService {
  constructor() {
    this.syncFromStorage();
  }

  /**
   * Sync current auth state from localStorage
   */
  syncFromStorage() {
    this.token = localStorage.getItem("authToken");
    this.userId = localStorage.getItem("userId");
    this.username = localStorage.getItem("username");
    this.userRole = localStorage.getItem("userRole");
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    this.syncFromStorage();
    return Boolean(this.token && this.username);
  }

  /**
   * Get current user info
   */
  getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }

    return {
      token: this.token,
      userId: this.userId,
      username: this.username,
      role: this.userRole || "user",
      institution_id: localStorage.getItem("institution_id"),
    };
  }

  /**
   * Set authentication data after login/signup
   */
  setAuthData(token, userId, username, role = "user") {
    this.token = token;
    this.userId = userId;
    this.username = username;
    this.userRole = role;

    localStorage.setItem("authToken", token);
    localStorage.setItem("userId", String(userId));
    localStorage.setItem("username", username);
    localStorage.setItem("userRole", role);
  }

  /**
   * Clear authentication data on logout
   */
  clearAuthData() {
    this.token = null;
    this.userId = null;
    this.username = null;
    this.userRole = null;

    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    localStorage.removeItem("institution_id");
  }

  /**
   * Get authorization header for API calls
   */
  getAuthHeader() {
    this.syncFromStorage();

    if (!this.token) {
      return {};
    }

    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  /**
   * Verify token with backend
   */
  async verifyToken() {
    this.syncFromStorage();

    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch("/api/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return Boolean(data && data.success && data.data && data.data.user);
    } catch (error) {
      console.error("Token verification error:", error);
      return false;
    }
  }

  /**
   * Logout and clear session
   */
  async logout(redirectTo = "/") {
    this.syncFromStorage();

    try {
      if (this.token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearAuthData();
      this.clearRedirectAfterLogin();

      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
  }

  /**
   * Check authentication and redirect if not logged in
   * Use this ONLY for fully protected pages like dashboard/admin
   */
  requireAuth(redirectTo = "/auth") {
    if (!this.isAuthenticated()) {
      this.setRedirectAfterLogin(window.location.pathname);
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  /**
   * Require auth only for protected actions, not whole pages
   * Example: Start mission, save progress, run full lab
   */
  requireAuthForAction(options = {}) {
    const {
      redirectTo = "/auth",
      message = "Please log in to continue.",
      rememberCurrentPage = true,
      currentPath = window.location.pathname,
    } = options;

    if (!this.isAuthenticated()) {
      if (rememberCurrentPage && currentPath) {
        this.setRedirectAfterLogin(currentPath);
      }

      alert(message);
      window.location.href = redirectTo;
      return false;
    }

    return true;
  }

  /**
   * Save redirect target after login
   */
  setRedirectAfterLogin(path) {
    if (!path || typeof path !== "string") return;
    localStorage.setItem("redirectAfterLogin", path);
  }

  /**
   * Get redirect target after login
   */
  getRedirectAfterLogin() {
    return localStorage.getItem("redirectAfterLogin");
  }

  /**
   * Clear redirect target
   */
  clearRedirectAfterLogin() {
    localStorage.removeItem("redirectAfterLogin");
  }

  /**
   * Redirect after successful login/signup
   */
  redirectAfterLogin(defaultPath = "/dashboard") {
    const savedPath = this.getRedirectAfterLogin();

    if (savedPath && savedPath.trim()) {
      this.clearRedirectAfterLogin();
      window.location.href = savedPath;
      return;
    }

    window.location.href = defaultPath;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    this.syncFromStorage();
    return this.userRole === "admin";
  }

  /**
   * Check if user is instructor
   */
  isInstructor() {
    this.syncFromStorage();
    return this.userRole === "instructor";
  }

  /**
   * Check if user has one of the allowed roles
   */
  hasRole(...roles) {
    this.syncFromStorage();
    return roles.includes(this.userRole);
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        return { success: false, message: data.message || "Login failed" };
      }

      const { user, token } = data.data;
      this.setAuthData(token, user.id, user.username, user.role);

      // Store institution_id if available
      if (user.institution_id) {
        localStorage.setItem("institution_id", user.institution_id);
      }

      return { success: true, user, token };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Network error during login" };
    }
  }

  /**
   * Register new user
   */
  async register(username, email, password, institution_id = null) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, institution_id }),
      });

      const data = await response.json();

      if (!data.success) {
        return { success: false, message: data.message || "Registration failed" };
      }

      const { user, token } = data.data;
      this.setAuthData(token, user.id, user.username, user.role);

      // Store institution_id if available
      if (user.institution_id) {
        localStorage.setItem("institution_id", user.institution_id);
      }

      return { success: true, user, token };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, message: "Network error during registration" };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    this.syncFromStorage();

    if (!this.token || !this.username) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const response = await fetch(`/api/auth/profile/${this.username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(updates || {}),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Profile update error:", error);
      return { success: false, message: "Profile update failed" };
    }
  }

  /**
   * Get user profile from backend
   */
  async getProfile() {
    this.syncFromStorage();

    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch("/api/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.success && data.data && data.data.user) {
        const u = data.data.user;

        if (u.username && u.username !== this.username) {
          this.username = u.username;
          localStorage.setItem("username", u.username);
        }

        if (u.id && String(u.id) !== String(this.userId)) {
          this.userId = u.id;
          localStorage.setItem("userId", String(u.id));
        }

        if (u.role && u.role !== this.userRole) {
          this.userRole = u.role;
          localStorage.setItem("userRole", u.role);
        }

        return u;
      }

      return null;
    } catch (error) {
      console.error("Profile fetch error:", error);
      return null;
    }
  }

  /**
   * Optional helper:
   * returns true if page should stay public even for guests
   */
  isPublicPage(path = window.location.pathname) {
    const publicPaths = [
      "/",
      "/home",
      "/learn",
      "/practice",
      "/terminal",
      "/leaderboard",
      "/auth",
    ];

    return publicPaths.includes(path);
  }
}

// Create global authService instance
const authService = new AuthService();
window.authService = authService;