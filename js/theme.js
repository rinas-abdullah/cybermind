/**
 * Theme Settings for CyberMind
 * Manages dark/light theme switching and color customization
 */

const THEMES = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
  AUTO: 'auto'
});

const COLORS = Object.freeze({
  dark: {
    // Background
    'bg-primary': '#060913',
    'bg-secondary': '#0b0f1d',
    'bg-tertiary': '#121729',
    
    // Text
    'text-primary': '#f4f7fa',
    'text-secondary': '#c8d2e6',
    'text-light': '#9bb0cf',
    'text-muted': '#627b9c',
    
    // Accent
    'accent-primary': '#00F59B',    // Vibrant mint green (Success/Explore)
    'accent-secondary': '#00D9FF',   // Tactical tech cyan (Info/Secondary)
    'accent-tertiary': '#8b5cf6',    // Cyber purple
    'accent-danger': '#FF3B69',      // Ruby cyber red
    'accent-success': '#00F59B',     // Emerald digital green
    'accent-warning': '#FF9F00',     // Amber alert orange
    
    // Borders
    'border-color': 'rgba(255, 255, 255, 0.06)',
    'border-light': 'rgba(255, 255, 255, 0.12)',
    'border-primary': '#00D9FF',
    
    // Status
    'status-success': '#00F59B',
    'status-warning': '#FF9F00',
    'status-error': '#FF3B69',
    'status-info': '#00D9FF'
  },
  
  light: {
    // Background
    'bg-primary': '#f8fafc',
    'bg-secondary': '#f1f5f9',
    'bg-tertiary': '#e2e8f0',
    
    // Text
    'text-primary': '#0f172a',
    'text-secondary': '#334155',
    'text-light': '#64748b',
    'text-muted': '#94a3b8',
    
    // Accent
    'accent-primary': '#0f172a',
    'accent-secondary': '#0f172a',
    'accent-tertiary': '#0284c7',
    'accent-danger': '#e11d48',
    'accent-success': '#15803d',
    'accent-warning': '#b45309',
    
    // Borders
    'border-color': '#cbd5e1',
    'border-light': '#e2e8f0',
    'border-primary': '#0f172a',
    
    // Status
    'status-success': '#16a34a',
    'status-warning': '#d97706',
    'status-error': '#dc2626',
    'status-info': '#2563eb'
  }
});


class ThemeManager {
  constructor() {
    this.loadCustomColors();
    this.currentTheme = this.loadSavedTheme();
    this.applyTheme(this.currentTheme);
    this.setupListeners();
  }

  /**
   * Load custom colors from localStorage
   */
  loadCustomColors() {
    try {
      const savedDark = localStorage.getItem('cybermind-custom-colors-dark');
      if (savedDark) {
        const parsed = JSON.parse(savedDark);
        Object.assign(COLORS.dark, parsed);
      }
      const savedLight = localStorage.getItem('cybermind-custom-colors-light');
      if (savedLight) {
        const parsed = JSON.parse(savedLight);
        Object.assign(COLORS.light, parsed);
      }
    } catch (e) {
      console.error('Error loading custom colors:', e);
    }
  }

  /**
   * Save custom colors to localStorage
   */
  saveCustomColors(theme) {
    try {
      localStorage.setItem(`cybermind-custom-colors-${theme}`, JSON.stringify(COLORS[theme]));
    } catch (e) {
      console.error('Error saving custom colors:', e);
    }
  }

  /**
   * Load saved theme from localStorage
   */
  loadSavedTheme() {
    const saved = localStorage.getItem('cybermind-theme');
    if (saved && (saved === 'dark' || saved === 'light')) {
      return saved;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'dark'; // Default to dark
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    if (!COLORS[theme]) return;

    const root = document.documentElement;
    const colors = COLORS[theme];

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    this.currentTheme = theme;
    localStorage.setItem('cybermind-theme', theme);
    this.notifyThemeChange(theme);
  }

  /**
   * Toggle between dark and light
   */
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  /**
   * Get current theme
   */
  getCurrent() {
    return this.currentTheme;
  }

  /**
   * Get color for current theme
   */
  getColor(colorKey) {
    return COLORS[this.currentTheme][colorKey];
  }

  /**
   * Set custom colors for a theme
   */
  setCustomColor(theme, colorKey, value) {
    if (!COLORS[theme]) return;
    if (!value.match(/^#[0-9A-Fa-f]{6}$/)) {
      console.error('Invalid color format. Use #RRGGBB');
      return;
    }

    COLORS[theme][colorKey] = value;
    this.saveCustomColors(theme);

    if (theme === this.currentTheme) {
      this.applyTheme(theme);
    }
  }

  /**
   * Get all colors for current theme
   */
  getAllColors() {
    return COLORS[this.currentTheme];
  }

  /**
   * Setup system preference listener
   */
  setupListeners() {
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('cybermind-theme') === null) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /**
   * Notify components about theme change
   */
  notifyThemeChange(theme) {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  }

  /**
   * Export all colors as CSS
   */
  exportAsCSS() {
    const colors = COLORS[this.currentTheme];
    let css = ':root {\n';

    Object.entries(colors).forEach(([key, value]) => {
      css += `  --${key}: ${value};\n`;
    });

    css += '}\n';
    return css;
  }
}

// Initialize theme manager immediately so that theme styles apply before DOM rendering, avoiding any flash of light or unstyled layout.
window.themeManager = new ThemeManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeManager, THEMES, COLORS };
}
