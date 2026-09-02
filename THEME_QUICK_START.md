# Theme System - Quick Setup Guide

## 🎨 What's New

Your CyberMind application now has a **complete theme system** with:

- ✅ Dark Mode (default)
- ✅ Light Mode  
- ✅ Hacker Mode
- ✅ Ocean Blue Theme
- ✅ Neon Cyberpunk Theme
- ✅ Theme Customizer Modal
- ✅ Live Color Preview
- ✅ Export Custom Themes

## 📁 New Files Created

```
js/
├── theme.js                          # Core theme manager
└── components/
    └── themeCustomizer.js           # Theme customizer UI

css/
└── theme-customizer.css             # Customizer styles

config/
└── themes.json                      # Theme definitions
```

## 🚀 Installation (3 Steps)

### Step 1: Add Script Tags to HTML

Add these lines to the `<head>` section of **EVERY HTML page**:

```html
<head>
    <!-- ... existing styles ... -->
    
    <!-- Theme System -->
    <link rel="stylesheet" href="/css/theme-customizer.css">
    <script src="/js/theme.js"></script>
    <script src="/js/components/themeCustomizer.js"></script>
    
    <!-- ... rest of scripts ... -->
</head>
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

### Step 2: Update CSS in style.css

Make sure your CSS uses variables instead of hardcoded colors:

```css
/* Good - Uses variables */
.card {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 2px solid var(--border-primary);
}

/* Bad - Hardcoded colors won't change with theme */
.card {
    background: #0a1420;
    color: #e5e7eb;
}
```

### Step 3: Test It!

Run your application and:
1. Look for the **theme toggle button** in the navbar (☀️ Light / 🌙 Dark)
2. Click it to switch themes
3. Verify colors change across the page

## 🎯 How It Works

### User Clicks Theme Toggle
```
Button Click
    ↓
ThemeManager.toggle()
    ↓
Apply Colors to Document
    ↓
Save Preference to localStorage
    ↓
Dispatch 'theme-changed' Event
```

### On Page Load
```
Check localStorage for saved theme
    ↓
If not found, check system preference
    ↓
Default to 'dark'
    ↓
Apply theme colors
```

## 💡 Usage Examples

### 1. Switch Theme Programmatically

```javascript
// In your code
if (window.themeManager) {
    window.themeManager.applyTheme('dark');
    // or 'light', 'hacker', 'ocean', 'neon'
}
```

### 2. React to Theme Changes

```javascript
window.addEventListener('theme-changed', (e) => {
    console.log('New theme:', e.detail.theme);
    // Update charts, graphs, etc here
});
```

### 3. Get Current Color

```javascript
const accentColor = window.themeManager?.getColor('accent-primary');
console.log(accentColor); // '#00e5b0' for dark mode
```

### 4. Open Theme Customizer

```javascript
// Add a button that opens the customizer
button.addEventListener('click', () => {
    window.themeCustomizer?.showCustomizer();
});
```

## 🎨 Available Themes

### Dark Mode (Default)
- Professional cybersecurity aesthetic
- Neon teal accent: `#00e5b0`
- Perfect for night operations

### Light Mode
- Clean, readable design
- Blue accent: `#2563eb`
- Great for daytime use

### Hacker Mode
- Terminal-style interface
- Green text: `#00ff00`
- Immersive cybersecurity ambiance

### Ocean Blue
- Cool, calming design
- Cyan accent: `#06b6d4`
- Professional appearance

### Neon Cyberpunk
- Vibrant, futuristic
- Neon red: `#e94560`
- Modern, engaging design

## 🛠️ CSS Variables Reference

```css
:root {
    /* Background */
    --bg-primary: #030810;          /* Main background */
    --bg-secondary: #0a1420;        /* Secondary background */
    --bg-tertiary: #111827;         /* Cards, modals */
    
    /* Text */
    --text-primary: #e5e7eb;        /* Main text */
    --text-secondary: #d1d5db;      /* Secondary text */
    --text-light: #9ca3af;          /* Light text */
    --text-muted: #6b7280;          /* Disabled text */
    
    /* Accents */
    --accent-primary: #00e5b0;      /* Buttons, highlights */
    --accent-secondary: #3b82f6;    /* Alternative accent */
    --accent-danger: #ef4444;       /* Errors, alerts */
    --accent-success: #10b981;      /* Success messages */
    --accent-warning: #f59e0b;      /* Warnings */
    
    /* Borders */
    --border-color: #1f2937;        /* Default border */
    --border-primary: #00e5b0;      /* Accent border */
    
    /* Status */
    --status-success: #10b981;
    --status-warning: #f59e0b;
    --status-error: #ef4444;
    --status-info: #3b82f6;
}
```

## 📝 Example: Using Theme Colors

```html
<!-- HTML -->
<button class="btn-primary">Click me</button>
<div class="alert alert-success">Success!</div>
```

```css
/* CSS */
.btn-primary {
    background: var(--accent-primary);
    color: var(--bg-primary);
    border: 2px solid var(--accent-primary);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
}

.alert {
    padding: 1rem;
    border-radius: 8px;
    color: var(--text-primary);
}

.alert-success {
    background: var(--bg-secondary);
    border: 2px solid var(--status-success);
}
```

## 🔧 Advanced: Custom Themes

### Add a Custom Theme to themes.json

```json
{
    "themes": {
        "myTheme": {
            "name": "My Custom Theme",
            "description": "My personal color scheme",
            "colors": {
                "bg-primary": "#1a1a1a",
                "accent-primary": "#ff00ff",
                "text-primary": "#ffffff"
                // ... other colors
            }
        }
    }
}
```

### Save User Preference (Backend)

```javascript
// In your backend (optional)
router.post('/api/user/theme', (req, res) => {
    // Save theme preference to database
    db.run('UPDATE users SET theme = ? WHERE id = ?', 
        [req.body.theme, req.user.id]);
    res.json({ success: true });
});

// Load on app start
fetch('/api/user/profile')
    .then(r => r.json())
    .then(data => {
        if (data.theme) {
            window.themeManager?.applyTheme(data.theme);
        }
    });
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Theme not changing | Clear localStorage: `localStorage.clear()`, reload page |
| Button not visible | Check if `navbar` or `nav` element exists in HTML |
| Colors not correct | Verify CSS uses `var(--name)` instead of hardcoded colors |
| Script errors | Ensure theme.js loads before themeCustomizer.js |
| Preference not saving | Check if localStorage is enabled in browser |

## 📚 Full Documentation

For detailed information, see: `THEME_INTEGRATION_GUIDE.md`

## ✅ Checklist

- [ ] Add script tags to all HTML pages
- [ ] Update CSS to use variables instead of hardcoded colors
- [ ] Test theme toggle in navbar
- [ ] Verify all themes work correctly
- [ ] Test on multiple browsers
- [ ] (Optional) Add custom theme to themes.json
- [ ] (Optional) Save preferences to backend

## 🎉 That's It!

Your theme system is now ready to use. Users can:
- ✅ Toggle between themes with navbar button
- ✅ Customize colors with modal
- ✅ Export custom themes
- ✅ Preferences auto-save and persist

For more details: `THEME_INTEGRATION_GUIDE.md`

---

**Need Help?** Check THEME_INTEGRATION_GUIDE.md for advanced usage and troubleshooting.
