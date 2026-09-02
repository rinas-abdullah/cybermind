# Theme Customization & Integration Guide

## Overview

The CyberMind application now includes a comprehensive theme system with:
- ✅ **Dark Mode** (default) - Professional cybersecurity aesthetic
- ✅ **Light Mode** - Clean, professional design
- ✅ **Hacker Mode** - Terminal-style green text interface
- ✅ **Ocean Blue** - Cool blue themed interface
- ✅ **Neon Cyberpunk** - Vibrant neon aesthetic
- ✅ **Custom Themes** - Create your own color schemes

## File Structure

```
cybermind/
├── js/
│   ├── theme.js                 # Core theme manager (NEW)
│   └── components/
│       └── themeCustomizer.js   # Theme UI component (NEW)
├── css/
│   ├── style.css               # Main styles
│   └── theme-customizer.css    # Theme customizer styles (NEW)
└── config/
    └── themes.json             # Theme definitions (NEW)
```

## Installation Steps

### 1. Add Script References to HTML Files

Add these scripts to the `<head>` section of all HTML pages:

```html
<!-- Theme system -->
<link rel="stylesheet" href="/css/theme-customizer.css">
<script src="/js/theme.js"></script>
<script src="/js/components/themeCustomizer.js"></script>
```

**Apply to these files:**
- `frontend/pages/dashboard.html`
- `frontend/pages/auth.html`
- `frontend/pages/admin.html`
- `frontend/pages/learn.html`
- `frontend/pages/practice.html`
- `frontend/pages/training.html`
- `frontend/pages/leaderboard.html`
- `frontend/pages/terminal.html`

### 2. Update HTML Body Tag (Optional)

Add data attribute for theme awareness (optional):

```html
<body data-theme="dark">
    <!-- Your content -->
</body>
```

## Usage

### Basic Theme Toggle

The theme toggle button appears automatically in the navbar. Users can:
1. Click the toggle button (☀️ Light / 🌙 Dark)
2. Theme preference saves to localStorage
3. Automatically loads on next visit

### Programmatic Theme Changes

```javascript
// Access the theme manager
if (window.themeManager) {
  // Get current theme
  const current = window.themeManager.getCurrent(); // "dark" or "light"

  // Toggle theme
  window.themeManager.toggle();

  // Set specific theme
  window.themeManager.applyTheme('dark');

  // Get all colors for current theme
  const colors = window.themeManager.getAllColors();
  console.log(colors['accent-primary']); // "#00e5b0"

  // Get single color
  const accentColor = window.themeManager.getColor('accent-primary');

  // Set custom color
  window.themeManager.setCustomColor('dark', 'accent-primary', '#ff00ff');
}
```

### Listen for Theme Changes

```javascript
// Event listener for theme changes
window.addEventListener('theme-changed', (event) => {
  console.log('Theme changed to:', event.detail.theme);
  // Re-render components here if needed
});
```

## Theme Configuration

### Available CSS Variables

All themes use these CSS variables (set automatically):

```css
/* Background Colors */
--bg-primary        /* Main background */
--bg-secondary      /* Secondary background */
--bg-tertiary       /* Tertiary background */

/* Text Colors */
--text-primary      /* Main text */
--text-secondary    /* Secondary text */
--text-light        /* Light text */
--text-muted        /* Muted text */

/* Accent Colors */
--accent-primary    /* Primary accent (buttons, highlights) */
--accent-secondary  /* Secondary accent */
--accent-tertiary   /* Tertiary accent */
--accent-danger     /* Danger/error accent */
--accent-success    /* Success accent */
--accent-warning    /* Warning accent */

/* Border Colors */
--border-color      /* Default border */
--border-light      /* Light border */
--border-primary    /* Primary border */

/* Status Colors */
--status-success    /* Success status */
--status-warning    /* Warning status */
--status-error      /* Error status */
--status-info       /* Info status */
```

### Using CSS Variables

In your CSS files:

```css
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 2px solid var(--border-primary);
}

.my-button {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.my-alert {
  background: var(--status-warning);
  color: var(--text-primary);
}
```

## Theme Customizer Modal

### Opening the Customizer

```javascript
// Open theme customizer
if (window.themeCustomizer) {
  window.themeCustomizer.showCustomizer();
}
```

### Customizer Features

The modal provides:
1. **Theme Selection** - Switch between pre-defined themes
2. **Color Picker** - Modify individual colors
3. **Live Preview** - See changes immediately
4. **Reset to Default** - Restore original colors
5. **Export CSS** - Download custom theme as CSS file

## Pre-defined Themes

### Dark Mode (Default)
- **Purpose**: Professional cybersecurity interface
- **Primary Accent**: Neon Teal (#00e5b0)
- **Best For**: Night mode, cybersecurity operations

### Light Mode
- **Purpose**: Professional, readable design
- **Primary Accent**: Blue (#2563eb)
- **Best For**: Daytime use, presentations

### Hacker Mode
- **Purpose**: Terminal-style interface
- **Primary Accent**: Green (#00ff00)
- **Best For**: Immersive cybersecurity training

### Ocean Blue
- **Purpose**: Cool, calming interface
- **Primary Accent**: Cyan (#06b6d4)
- **Best For**: Professional settings, readability

### Neon Cyberpunk
- **Purpose**: Vibrant, futuristic aesthetic
- **Primary Accent**: Neon Red (#e94560)
- **Best For**: Engaging, modern design

## Creating Custom Themes

### Method 1: Edit themes.json

1. Open `config/themes.json`
2. Add new theme object:

```json
{
  "themes": {
    "myTheme": {
      "name": "My Custom Theme",
      "description": "My custom color scheme",
      "colors": {
        "bg-primary": "#ffffff",
        "bg-secondary": "#f5f5f5",
        "text-primary": "#000000",
        "accent-primary": "#3498db"
        /* ... other colors */
      }
    }
  }
}
```

2. Load and apply:

```javascript
// Fetch and apply custom theme
fetch('/config/themes.json')
  .then(r => r.json())
  .then(data => {
    const customTheme = data.themes.myTheme;
    Object.entries(customTheme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  });
```

### Method 2: Runtime Customization

```javascript
// Programmatically set colors
window.themeManager?.setCustomColor('dark', 'accent-primary', '#ff00ff');
window.themeManager?.setCustomColor('dark', 'bg-primary', '#1a1a1a');
window.themeManager?.applyTheme('dark'); // Apply changes
```

### Method 3: CSS Override

```css
:root {
  --accent-primary: #ff00ff;
  --bg-primary: #1a1a1a;
  /* Override any variable */
}
```

## Backend Integration (Optional)

Save user theme preference to database:

```javascript
// In backend/routes/api.js
router.post('/api/user/theme', authenticate, (req, res) => {
  const { userId } = req.user;
  const { theme } = req.body;

  // Validate theme
  const validThemes = ['dark', 'light', 'hacker', 'ocean', 'neon'];
  if (!validThemes.includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme' });
  }

  // Save to database
  db.run(
    'UPDATE users SET preferred_theme = ? WHERE id = ?',
    [theme, userId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, theme });
    }
  );
});
```

Load saved theme on page load:

```javascript
// In js/app.js
fetch('/api/user/profile')
  .then(r => r.json())
  .then(data => {
    if (data.preferred_theme && window.themeManager) {
      window.themeManager.applyTheme(data.preferred_theme);
    }
  });
```

## Styling Components

### Example: Custom Button with Theme Support

```css
.custom-button {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: 2px solid var(--accent-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.custom-button:hover {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
  transform: translateY(-2px);
}

.custom-button:active {
  transform: translateY(0);
}
```

### Example: Custom Alert with Theme Support

```css
.alert {
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid;
}

.alert-success {
  background: var(--bg-secondary);
  border-color: var(--status-success);
  color: var(--text-primary);
}

.alert-error {
  background: var(--bg-secondary);
  border-color: var(--status-error);
  color: var(--text-primary);
}

.alert-warning {
  background: var(--bg-secondary);
  border-color: var(--status-warning);
  color: var(--text-primary);
}
```

## Troubleshooting

### Theme Not Loading

**Problem**: Theme colors not applying
**Solution**: 
- Verify `theme.js` is loaded before other scripts
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Reload page

### Toggle Button Not Appearing

**Problem**: Theme toggle button missing from navbar
**Solution**:
- Ensure `themeCustomizer.js` is loaded
- Check that `.navbar` or `nav` element exists
- Verify DOM is fully loaded before script execution

### Colors Not Correct

**Problem**: Wrong colors displaying
**Solution**:
- Check CSS variable values: `getComputedStyle(document.documentElement).getPropertyValue('--accent-primary')`
- Verify theme JSON color format (must be valid hex codes)
- Check for conflicting CSS rules overriding variables

### LocalStorage Issues

**Problem**: Theme preference not persisting
**Solution**:
- Check browser localStorage permissions
- Verify localStorage key matches: `cybermind-theme`
- Try: `localStorage.setItem('cybermind-theme', 'dark')`

## Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Test all themes** with your components
3. **Ensure contrast** meets accessibility standards (WCAG AA)
4. **Use semantic color names** (accent-primary, status-error, etc.)
5. **Provide fallbacks** for older browsers
6. **Document custom colors** in your code
7. **Test on multiple devices** to ensure readability

## Performance Tips

1. **Minimize reflows** when changing themes
2. **Cache color values** if used frequently
3. **Use CSS transitions** for smooth theme switching
4. **Lazy load customizer modal** only when needed
5. **Compress theme JSON** in production

## Accessibility

### WCAG Compliance

Ensure contrast ratios meet standards:

```javascript
// Check contrast ratio between two colors
function getContrastRatio(color1, color2) {
  // Implementation for contrast calculation
  // Should meet WCAG AA: 4.5:1 for normal text, 3:1 for large text
}
```

### Color Blindness

Consider adding colorblind-friendly themes:

```json
{
  "deuteranopia": {
    "name": "Colorblind (Deuteranopia)",
    "colors": {
      "accent-primary": "#0173b2",
      "accent-secondary": "#de8f05",
      "accent-danger": "#ca0020"
    }
  }
}
```

## Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Verify all files are properly referenced
4. Test in an incognito/private window

---

**Last Updated**: 2024
**Compatibility**: All modern browsers (Chrome, Firefox, Safari, Edge)
**License**: MIT
