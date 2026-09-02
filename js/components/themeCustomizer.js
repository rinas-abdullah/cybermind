/**
 * Theme Customizer Component
 * Provides UI controls for theme switching and customization
 */

class ThemeCustomizer {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create theme toggle button if needed
    this.addThemeToggleButton();
    this.setupEventListeners();
  }

  /**
   * Add theme toggle button to navbar
   */
  addThemeToggleButton() {
    // Check if theme button already exists
    if (document.getElementById('theme-toggle-btn')) {
      return;
    }

    const navbar = document.querySelector('.navbar') || document.querySelector('nav');
    if (!navbar) return;

    const button = document.createElement('button');
    button.id = 'theme-toggle-btn';
    button.className = 'theme-toggle-btn';
    button.setAttribute('aria-label', 'Toggle theme');
    button.innerHTML = window.themeManager?.getCurrent() === 'dark' 
      ? '☀️ Light' 
      : '🌙 Dark';

    button.addEventListener('click', () => this.toggleTheme());

    // Add button to navbar
    const navRight = navbar.querySelector('.nav-right') || navbar;
    navRight.appendChild(button);
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    if (!window.themeManager) return;

    window.themeManager.toggle();
    this.updateToggleButton();
  }

  /**
   * Update toggle button text
   */
  updateToggleButton() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    const isDark = window.themeManager?.getCurrent() === 'dark';
    btn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
  }

  /**
   * Listen for theme changes
   */
  setupEventListeners() {
    window.addEventListener('theme-changed', (e) => {
      this.updateToggleButton();
      this.notifyApp(e.detail.theme);
    });
  }

  /**
   * Notify app of theme change
   */
  notifyApp(theme) {
    // Re-render charts if they exist
    if (window.renderScoreChart) {
      window.renderScoreChart();
    }

    // Update any theme-dependent components
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme === 'light');
  }

  /**
   * Show theme customizer modal
   */
  showCustomizer() {
    const modal = this.createCustomizerModal();
    document.body.appendChild(modal);
    modal.style.display = 'block';
  }

  /**
   * Create customizer modal HTML
   */
  createCustomizerModal() {
    const modal = document.createElement('div');
    modal.id = 'theme-customizer-modal';
    modal.className = 'modal';

    const currentTheme = window.themeManager?.getCurrent() || 'dark';
    const colors = COLORS[currentTheme];

    let html = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Theme Customizer</h2>
        
        <div class="theme-selector">
          <h3>Select Theme</h3>
          <button class="theme-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
            🌙 Dark Mode
          </button>
          <button class="theme-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme="light">
            ☀️ Light Mode
          </button>
        </div>

        <div class="color-customizer">
          <h3>Customize Colors</h3>
          <div class="color-grid">
    `;

    Object.entries(colors).forEach(([key, value]) => {
      html += `
        <div class="color-item">
          <label>${key}</label>
          <div class="color-input-group">
            <input type="color" data-color-key="${key}" value="${value}" class="color-input">
            <span class="color-value">${value}</span>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>

        <div class="customizer-actions">
          <button id="reset-colors" class="btn btn-secondary">Reset to Default</button>
          <button id="export-css" class="btn btn-primary">Export CSS</button>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    this.attachCustomizerListeners(modal);
    return modal;
  }

  /**
   * Attach listeners to customizer modal
   */
  attachCustomizerListeners(modal) {
    // Close button
    modal.querySelector('.close').addEventListener('click', () => {
      modal.style.display = 'none';
      modal.remove();
    });

    // Theme selection
    modal.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.target.dataset.theme;
        window.themeManager?.applyTheme(theme);

        // Update active state
        modal.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Color input
    modal.querySelectorAll('.color-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const colorKey = e.target.dataset.colorKey;
        const value = e.target.value;
        const currentTheme = window.themeManager?.getCurrent() || 'dark';

        window.themeManager?.setCustomColor(currentTheme, colorKey, value);

        // Update display value
        e.target.parentElement.querySelector('.color-value').textContent = value;
      });
    });

    // Reset button
    const resetBtn = modal.querySelector('#reset-colors');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Reload to reset
        localStorage.removeItem('cybermind-theme');
        localStorage.removeItem('cybermind-custom-colors-dark');
        localStorage.removeItem('cybermind-custom-colors-light');
        location.reload();
      });
    }

    // Export button
    const exportBtn = modal.querySelector('#export-css');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const css = window.themeManager?.exportAsCSS();
        const blob = new Blob([css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `raqeem-theme-${window.themeManager?.getCurrent() || 'dark'}.css`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }
}

// Initialize customizer when theme manager is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.themeManager) {
      window.themeCustomizer = new ThemeCustomizer();
    }
  });
} else {
  if (window.themeManager) {
    window.themeCustomizer = new ThemeCustomizer();
  }
}
