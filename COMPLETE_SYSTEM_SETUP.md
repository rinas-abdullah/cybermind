# Complete System Setup Guide: Database + OpenAI + Theme

## 📋 Overview

You now have a **complete, production-ready CyberMind system** with:

✅ **Database System** - PostgreSQL, MongoDB, or In-Memory  
✅ **AI Intelligence** - OpenAI GPT Integration  
✅ **Theme System** - 5 pre-built themes + customization  

This guide walks you through setting everything up.

---

## Phase 1: Database Configuration

### 1. Create `.env` File

Create a file named `.env` in the root directory with:

```env
# Database Settings
DB_TYPE=in-memory              # Options: in-memory, postgresql, mongodb, mysql
DATABASE_URL=                  # For PostgreSQL: postgresql://user:pass@localhost:5432/cybermind

# Server Settings
PORT=3001
NODE_ENV=development

# JWT Settings
JWT_SECRET=your-secret-key-here-min-32-chars-required-for-production
JWT_EXPIRY=7d

# OpenAI Settings
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo      # or gpt-4-turbo for advanced features

# CORS Settings
CORS_ORIGIN=http://localhost:3001
```

### 2. Database Setup

**For Development (In-Memory):**
- No additional setup needed
- Data resets on server restart
- Perfect for testing

**For PostgreSQL:**

```bash
# 1. Install PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# 2. Create database
createdb cybermind

# 3. Update .env
DB_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/cybermind

# 4. Install driver
npm install pg
```

**For MongoDB:**

```bash
# 1. Install MongoDB
# https://www.mongodb.com/try/download/community

# 2. Update .env
DB_TYPE=mongodb
DATABASE_URL=mongodb://localhost:27017/cybermind

# 3. Install driver
npm install mongodb
```

### 3. Test Database Connection

```bash
# Run test script
npm run test-db
```

Expected output:
```
Database Configuration Test
✓ Environment variables loaded
✓ Database connection successful
✓ In-Memory database initialized
```

---

## Phase 2: OpenAI Integration

### 1. Get OpenAI API Key

1. Go to: https://platform.openai.com/account/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (format: `sk-proj-...`)
5. **DON'T SHARE** this key publicly

### 2. Add Key to `.env`

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

### 3. Integration Points

The system uses OpenAI in these locations:

**File: `backend/services/aiMentorEngine.js`**
```javascript
// Automatic initialization
this.openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
```

**File: `backend/services/adaptiveEngine.js`**
```javascript
// Uses AI for personalized learning paths
if (this.openai) {
  const response = await this.openai.chat.completions.create({...});
}
```

**File: `backend/services/behavioralAnalyzer.js`**
```javascript
// Analyzes user behavior patterns using AI
```

### 4. Test OpenAI Connection

```bash
# Add test endpoint to backend/routes/api.js
router.get('/api/test-openai', (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(400).json({ 
      error: 'OPENAI_API_KEY not configured' 
    });
  }
  res.json({ 
    success: true, 
    model: process.env.OPENAI_MODEL 
  });
});

# Test with curl
curl http://localhost:3001/api/test-openai
```

### 5. Cost Optimization

```javascript
// Use gpt-3.5-turbo (cheaper, faster) by default
OPENAI_MODEL=gpt-3.5-turbo

// Use gpt-4-turbo only when needed
// In code:
const model = advancedFeature ? 'gpt-4-turbo' : 'gpt-3.5-turbo';

// Implement caching
const cache = new Map();
if (cache.has(prompt)) return cache.get(prompt);
```

---

## Phase 3: Theme System Setup

### 1. Add Theme Scripts to HTML

Add to `<head>` of each HTML file:

```html
<link rel="stylesheet" href="/css/theme-customizer.css">
<script src="/js/theme.js"></script>
<script src="/js/components/themeCustomizer.js"></script>
```

**Apply to:**
- `frontend/pages/dashboard.html`
- `frontend/pages/auth.html`
- `frontend/pages/admin.html`
- `frontend/pages/learn.html`
- `frontend/pages/practice.html`
- `frontend/pages/training.html`
- `frontend/pages/leaderboard.html`
- `frontend/pages/terminal.html`

### 2. Use CSS Variables

Update your CSS:

```css
/* Convert hardcoded colors to variables */

/* Before */
.button {
  background: #00e5b0;
  color: #030810;
}

/* After */
.button {
  background: var(--accent-primary);
  color: var(--bg-primary);
}
```

### 3. Available Themes

| Theme | Primary Color | Best For |
|-------|---------------|----------|
| Dark (Default) | #00e5b0 (Teal) | Night operations |
| Light | #2563eb (Blue) | Daytime use |
| Hacker | #00ff00 (Green) | Terminal aesthetics |
| Ocean | #06b6d4 (Cyan) | Calming interface |
| Neon | #e94560 (Red) | Modern design |

### 4. Test Themes

1. Click theme toggle button (☀️ Light / 🌙 Dark)
2. Try other themes in customizer modal
3. Verify colors change across all pages

---

## Complete Setup Checklist

### Prerequisites
- [ ] Node.js installed (v14+)
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

### Database Setup
- [ ] `.env` file created
- [ ] DB_TYPE selected (in-memory/postgresql/mongodb)
- [ ] Database URL configured (if using postgresql/mongodb)
- [ ] Database dependencies installed
- [ ] `npm run test-db` passes

### OpenAI Setup
- [ ] Account created at platform.openai.com
- [ ] API key generated
- [ ] OPENAI_API_KEY added to `.env`
- [ ] OPENAI_MODEL selected (gpt-3.5-turbo or gpt-4-turbo)

### Theme Setup
- [ ] Theme scripts added to all HTML files
- [ ] CSS variables used instead of hardcoded colors
- [ ] Theme toggle button visible
- [ ] Theme switching works correctly
- [ ] Preferences persist on reload

### Final Testing
- [ ] Start server: `npm start`
- [ ] Open http://localhost:3001
- [ ] Log in with credentials
- [ ] Test database functionality
- [ ] Test AI features (if configured)
- [ ] Test all themes
- [ ] Test responsive design (mobile)

---

## Quick Commands

```bash
# Install dependencies
npm install

# Start server
npm start

# Test database
npm run test-db

# Run in production mode
NODE_ENV=production npm start

# View logs
tail -f logs/debug.log
```

---

## File Reference

### New Files Created

```
js/
├── theme.js                    # Core theme manager
└── components/
    └── themeCustomizer.js     # Theme customizer UI

css/
└── theme-customizer.css       # Customizer styles

config/
└── themes.json                # Theme definitions

Documentation/
├── THEME_QUICK_START.md           # Theme setup guide
├── THEME_INTEGRATION_GUIDE.md      # Detailed theme docs
├── DATABASE_SETUP.md              # Database setup guide
├── DATABASE_CONFIG_SUMMARY.md      # Database reference
├── GPT_THEME_SETUP.md             # AI setup guide
└── COMPLETE_SYSTEM_SETUP.md       # This file
```

### Modified Files

- `backend/db.js` - Added In-Memory & PostgreSQL support
- `backend/config/environment.js` - PostgreSQL configuration
- `.env.example` - Added template

---

## Environment Comparison

### Development
```env
DB_TYPE=in-memory
NODE_ENV=development
OPENAI_API_KEY=sk-your-test-key
OPENAI_MODEL=gpt-3.5-turbo
```

### Production
```env
DB_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@prod-server:5432/cybermind
NODE_ENV=production
JWT_SECRET=very-long-secure-random-string-min-32-characters
OPENAI_API_KEY=sk-your-production-key
OPENAI_MODEL=gpt-4-turbo
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│       CyberMind Application              │
├─────────────────────────────────────────┤
│                                          │
│  Frontend (JavaScript)                   │
│  ├── Dashboard, Training, Terminal       │
│  ├── Theme System (Customization)        │
│  └── Real-time Updates                   │
│                                          │
│  Backend (Node.js/Express)               │
│  ├── Authentication (JWT)                │
│  ├── OpenAI Integration                  │
│  ├── Database Management                 │
│  └── APIs (/api/*)                       │
│                                          │
│  Database                                │
│  ├── In-Memory (Dev)                     │
│  ├── PostgreSQL (Prod)                   │
│  └── MongoDB (Optional)                  │
│                                          │
│  External Services                       │
│  └── OpenAI GPT (Optional)               │
│                                          │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### Database Issues
- **Error**: "Cannot connect to database"
  - **Solution**: Check DATABASE_URL in .env, verify database is running

- **Error**: "In-memory database initialized, not using PostgreSQL"
  - **Solution**: Set `DB_TYPE=postgresql` in .env

### OpenAI Issues
- **Error**: "OpenAI API key not configured"
  - **Solution**: Add OPENAI_API_KEY to .env and restart server

- **Error**: "Invalid API key"
  - **Solution**: Get new key from https://platform.openai.com/account/api-keys

### Theme Issues
- **Problem**: Theme not changing
  - **Solution**: Clear localStorage: `localStorage.clear()`, reload page

- **Problem**: Theme button not showing
  - **Solution**: Verify theme scripts are loaded before other scripts

---

## Security Best Practices

✅ **Do:**
- Keep `.env` file in `.gitignore`
- Use strong JWT_SECRET (32+ characters)
- Regenerate API keys regularly
- Use HTTPS in production
- Validate all user inputs
- Keep dependencies updated

❌ **Don't:**
- Commit `.env` to git
- Share API keys publicly
- Use weak passwords
- Skip input validation
- Run production with debug mode

---

## Performance Optimization

### Database
- Enable connection pooling (PostgreSQL)
- Index frequently queried fields
- Use query optimization

### OpenAI
- Cache API responses
- Use gpt-3.5-turbo for basic tasks (cheaper)
- Implement rate limiting
- Monitor API usage

### Frontend
- Minify CSS and JavaScript
- Enable gzip compression
- Use CDN for static files
- Implement lazy loading

---

## Next Steps

1. **Complete Setup**: Follow all checklist items above
2. **Customization**: Adjust colors/themes to match brand
3. **Testing**: Test all features thoroughly
4. **Documentation**: Update README with your setup
5. **Deployment**: Deploy to production (see guides)
6. **Monitoring**: Set up logging and error tracking

---

## Support Files

- `THEME_QUICK_START.md` - Quick theme setup
- `THEME_INTEGRATION_GUIDE.md` - Detailed theme guide
- `GPT_THEME_SETUP.md` - OpenAI integration guide
- `DATABASE_SETUP.md` - Database configuration
- `ERRORS_FIXED.md` - Issues fixed in this codebase

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅
