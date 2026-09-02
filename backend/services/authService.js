// Auth Service - Demo authentication helpers
// Uses demoAuthService (in-memory) for local/dev demonstration only.
// Real auth flow is handled by controllers/authController.js with PostgreSQL + JWT.

const authUsers = require("../data/authUsers");
const { issueToken } = require("../middleware/auth");

class AuthService {
  normalizeString(value, maxLength = 150) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
  }

  normalizeEmail(email) {
    return this.normalizeString(email, 150).toLowerCase();
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }

  isStrongPassword(password) {
    if (typeof password !== "string") return false;
    if (password.length < 10 || password.length > 128) return false;

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    return hasLower && hasUpper && hasNumber;
  }

  buildAuthResponse(user) {
    const token = issueToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      user,
      token,
    };
  }

  /**
   * Authenticate user with username or email + password
   */
  async authenticateUser(identifier, password) {
    const cleanIdentifier = this.normalizeString(identifier, 150);

    if (!cleanIdentifier || typeof password !== "string" || !password) {
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    const result = await authUsers.authenticateUser(cleanIdentifier, password);

    if (!result || !result.success) {
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    return {
      success: true,
      ...this.buildAuthResponse(result.user),
    };
  }

  /**
   * Register new user
   */
  async registerUser(userData = {}) {
    const username = this.normalizeString(userData.username, 50);
    const email = this.normalizeEmail(userData.email);
    const password =
      typeof userData.password === "string" ? userData.password : "";
    const skillLevel = this.normalizeString(userData.skillLevel, 30);
    const interests = Array.isArray(userData.interests)
      ? userData.interests
          .filter((item) => typeof item === "string")
          .map((item) => this.normalizeString(item, 40))
          .filter(Boolean)
          .slice(0, 20)
      : [];

    if (!username || !email || !password) {
      return {
        success: false,
        error: "Username, email, and password are required",
      };
    }

    if (!this.isValidUsername(username)) {
      return {
        success: false,
        error:
          "Username must be 3-20 characters and contain only letters, numbers, or underscores",
      };
    }

    if (!this.isValidEmail(email)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    if (!this.isStrongPassword(password)) {
      return {
        success: false,
        error:
          "Password must be 10-128 characters and include uppercase, lowercase, and a number",
      };
    }

    const options = {};
    if (skillLevel) options.skillLevel = skillLevel;
    if (interests.length > 0) options.interests = interests;

    const created = await authUsers.createUser(
      username,
      email,
      password,
      options
    );

    if (!created || !created.success) {
      return {
        success: false,
        error: created?.error || "Registration failed",
      };
    }

    const createdUser = authUsers.findUserByUsername(username);
    if (!createdUser) {
      return {
        success: false,
        error: "User created but retrieval failed",
      };
    }

    return {
      success: true,
      ...this.buildAuthResponse(authUsers.getUserProfile(createdUser.username)),
    };
  }

  /**
   * Logout hook
   * If you're using stateless JWT only, client logout is enough.
   * If session-backed auth exists, revoke token/session here.
   */
  async logoutUser(token) {
    if (typeof token === "string" && token.trim()) {
      try {
        authUsers.logoutUser(token.trim());
      } catch (_) {
        // ignore logout storage issues for now
      }
    }

    return {
      success: true,
    };
  }

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser(username) {
    const cleanUsername = this.normalizeString(username, 50);
    if (!cleanUsername) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    const user = authUsers.getUserProfile(cleanUsername);
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      user,
    };
  }
}

module.exports = new AuthService();