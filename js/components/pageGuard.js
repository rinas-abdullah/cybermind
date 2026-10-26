/**
 * Shared client-side page guard.
 *
 * Protected pages include this script (after auth.js). Before the page is
 * shown it verifies the session against the backend via /api/auth/profile —
 * a stale or forged localStorage token is rejected, not merely trusted — and
 * redirects guests to /auth?mode=login. Pages that require a specific role
 * (admin) are checked too. This is a UX gate; every /api route still enforces
 * auth and roles server-side, which is where the real protection lives.
 */
(function () {
  // path -> required role (null = any authenticated user)
  const PROTECTED = {
    "/dashboard": null,
    "/terminal": null,
    "/training": null,
    "/profile": null,
    "/learner-profile": null,
    "/analytics": null,
    "/ai-insights": null,
    "/readiness": null,
    "/analyze-scenario": null,
    "/admin": "admin",
  };

  const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
  if (!Object.prototype.hasOwnProperty.call(PROTECTED, path)) return;
  const requiredRole = PROTECTED[path];

  // Hide the page until the session is confirmed, to avoid flashing protected
  // content at a guest before the redirect fires.
  const hide = document.createElement("style");
  hide.id = "pg-hide";
  hide.textContent = "body{visibility:hidden!important}";
  (document.head || document.documentElement).appendChild(hide);

  function reveal() {
    const s = document.getElementById("pg-hide");
    if (s) s.remove();
  }

  // Safety net: if the verification request hangs (slow network, cold start),
  // never leave the page blank forever — reveal it after a few seconds. The
  // /api routes still enforce auth, so a hung check can't expose real data.
  const safetyReveal = setTimeout(reveal, 5000);

  function toLogin() {
    try {
      if (window.authService && typeof window.authService.setRedirectAfterLogin === "function") {
        window.authService.setRedirectAfterLogin(window.location.pathname);
      }
    } catch (_) {}
    window.location.replace("/auth?mode=login");
  }

  async function check() {
    const svc = window.authService;
    if (!svc || !svc.isAuthenticated()) {
      toLogin();
      return;
    }

    let user = null;
    try {
      user = await svc.getProfile(); // hits /api/auth/profile, syncs role
    } catch (_) {
      user = null;
    }

    if (!user) {
      try {
        if (typeof svc.clearAuthData === "function") svc.clearAuthData();
      } catch (_) {}
      toLogin();
      return;
    }

    if (requiredRole) {
      const role = String(user.role || svc.userRole || "").toLowerCase();
      if (role !== requiredRole) {
        // Authenticated but lacks the role — send them somewhere they can use.
        window.location.replace("/dashboard");
        return;
      }
    }

    clearTimeout(safetyReveal);
    reveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", check);
  } else {
    check();
  }
})();
