/**
 * Legacy NavBar compatibility wrapper
 * Keeps old NavBar calls working by delegating to ModernNavBar.
 * Use this only for backward compatibility with older pages.
 */

class NavBar {
  constructor(currentPage = "dashboard") {
    this.currentPage = currentPage;
    this.instance = null;
  }

  render() {
    if (typeof ModernNavBar === "undefined") {
      console.error("ModernNavBar is not loaded.");
      return null;
    }

    // Reuse existing global instance if present
    if (window.navBar && window.navBar instanceof ModernNavBar) {
      this.instance = window.navBar;
    } else {
      this.instance = new ModernNavBar();
      window.navBar = this.instance;
    }

    return this.instance.render();
  }

  updateUserStats() {
    if (this.instance && typeof this.instance.updateUserStats === "function") {
      this.instance.updateUserStats();
    }
  }

  refresh() {
    if (this.instance && typeof this.instance.render === "function") {
      return this.instance.render();
    }
    return this.render();
  }
}

// expose globally for old pages
window.NavBar = NavBar;

// Common helper for older pages that expect auto-init
window.initLegacyNavBar = function initLegacyNavBar(currentPage = "dashboard") {
  const nav = new NavBar(currentPage);
  nav.render();
  return nav;
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = NavBar;
}