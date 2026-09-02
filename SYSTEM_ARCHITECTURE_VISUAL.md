# CyberMind System Architecture & Visual Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CyberMind Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Frontend (Browser)                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ • Dashboard          • Learning Modules                  │   │
│  │ • Terminal Sim       • Leaderboard                       │   │
│  │ • Admin Panel        • Training Tools                    │   │
│  │ • Auth Pages         • Theme System                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Backend (Node.js/Express)                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ • API Routes         • Middleware                        │   │
│  │ • Services           • Error Handling                    │   │
│  │ • Authentication     • Data Validation                   │   │
│  │ • Business Logic     • Response Management               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Services & Integrations                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ • AI Mentor Engine        • Behavioral Analyzer          │   │
│  │ • Adaptive Learning       • Progress Tracking            │   │
│  │ • Risk Assessment         • Leaderboard Service          │   │
│  │ • Attack Simulator        • Auth Service                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Database & External Services                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ • PostgreSQL         • MongoDB        • MySQL            │   │
│  │ • In-Memory (Dev)    • OpenAI API     • Cache            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Request Flow

```
┌──────────────┐
│  User Action │
│  (Click, etc)│
└──────┬───────┘
       │
       ↓
┌─────────────────────
│  Browser Event Handler
└──────┬──────────────
       │
       ↓
┌──────────────────────────┐
│ JavaScript (app.js)      │
│ • Validate input         │
│ • Prepare data           │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ API Call (utils/api.js)              │
│ • Fetch request                      │
│ • Error handling                     │
│ • Response parsing                   │
└──────┬───────────────────────────────┘
       │
       ↓ HTTPS
┌──────────────────────────────────┐
│ Backend (Node.js/Express)        │
│ • Route matching                 │
│ • Middleware execution           │
│ • Authentication check           │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Service Layer                    │
│ • Business logic                 │
│ • Data processing                │
│ • AI integration (if needed)     │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Database Operation               │
│ • Query execution                │
│ • Data retrieval/storage         │
│ • Transaction management         │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Response Assembly                │
│ • Data formatting                │
│ • Error wrapping                 │
│ • Status codes                   │
└──────┬───────────────────────────┘
       │
       ↓ JSON Response
┌──────────────────────────────────┐
│ Frontend Processing              │
│ • Response parsing               │
│ • DOM updates                    │
│ • UI refresh                     │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ User Sees Result                 │
└──────────────────────────────────┘
```

---

## 🎨 Theme System Architecture

```
Theme Manager (theme.js)
│
├── COLORS Object
│   ├── dark: { bg-primary, text-primary, accent-primary, ... }
│   ├── light: { bg-primary, text-primary, accent-primary, ... }
│   ├── hacker: { ... }
│   ├── ocean: { ... }
│   └── neon: { ... }
│
├── Methods
│   ├── loadSavedTheme()        → Check localStorage
│   ├── applyTheme(theme)        → Set CSS variables
│   ├── toggle()                 → Switch theme
│   ├── getCurrent()             → Get active theme
│   ├── getColor(key)            → Get single color
│   └── exportAsCSS()            → Export as file
│
└── Events
    └── 'theme-changed'          → Components listen

        ↓
        
Theme Customizer (themeCustomizer.js)
│
├── addThemeToggleButton()       → UI button in navbar
├── toggleTheme()                → Click handler
├── showCustomizer()             → Modal dialog
└── attachCustomizerListeners()  → Color pickers

        ↓

User Interface
│
├── Theme Toggle Button (☀️ Light / 🌙 Dark)
├── Customizer Modal
│   ├── Theme Selection
│   ├── Color Picker Grid
│   ├── Reset Button
│   └── Export Button
└── Real-time Preview
```

---

## 📁 File Organization

```
cybermind/
│
├── 📄 Configuration Files
│   ├── .env                          ← Environment variables
│   ├── .env.example                  ← Template
│   ├── package.json                  ← Dependencies
│   └── build.js                      ← Build script
│
├── 🖥️  Backend
│   └── backend/
│       ├── server.js                 ← Express server
│       ├── db.js                     ← Database connection
│       ├── config/
│       │   ├── database.js
│       │   └── environment.js
│       ├── routes/
│       │   └── api.js               ← API endpoints
│       ├── services/                ← Business logic
│       │   ├── aiMentorEngine.js
│       │   ├── adaptiveEngine.js
│       │   ├── authService.js
│       │   └── ... (more services)
│       ├── middleware/
│       │   ├── auth.js
│       │   └── validation.js
│       ├── data/                    ← Data models
│       └── utils/
│           ├── logger.js
│           └── analytics.js
│
├── 🎨 Frontend
│   ├── frontend/pages/              ← HTML pages
│   │   ├── dashboard.html
│   │   ├── auth.html
│   │   └── ... (more pages)
│   │
│   ├── js/
│   │   ├── app.js                   ← Main logic
│   │   ├── theme.js                 ← NEW: Theme manager
│   │   ├── i18n.js                  ← Internationalization
│   │   ├── components/
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   ├── themeCustomizer.js   ← NEW: Theme UI
│   │   │   └── ... (more components)
│   │   └── utils/
│   │       └── api.js               ← API wrapper
│   │
│   └── css/
│       ├── style.css                ← Main styles
│       └── theme-customizer.css     ← NEW: Theme styles
│
├── ⚙️  Configuration
│   └── config/
│       └── themes.json              ← NEW: Theme definitions
│
└── 📚 Documentation
    ├── QUICK_START.md
    ├── COMPLETE_SYSTEM_SETUP.md
    ├── THEME_QUICK_START.md
    ├── THEME_INTEGRATION_GUIDE.md
    ├── DATABASE_SETUP.md
    ├── GPT_THEME_SETUP.md
    ├── ARCHITECTURE.md
    ├── DOCUMENTATION_SUMMARY.md
    ├── PROJECT_COMPLETION_SUMMARY.md
    └── ... (more documentation)
```

---

## 🔄 Data Flow: Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Flow                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Login Page   │
│ (auth.html)  │
└──────┬───────┘
       │ User enters credentials
       ↓
┌──────────────────────────────────────┐
│ Frontend: auth.js                    │
│ • Validate input                     │
│ • Prepare request                    │
└──────┬───────────────────────────────┘
       │ POST /api/auth/login
       ↓
┌──────────────────────────────────────┐
│ Backend: authService.js              │
│ • Check credentials                  │
│ • Hash comparison                    │
└──────┬───────────────────────────────┘
       │
    ┌──┴──┐
    │YES  │NO
    ↓     ↓
 ✅    ❌
 │      │
 │      └─→ Return error 401
 │
 ↓
┌──────────────────────────────────────┐
│ Generate JWT Token                   │
│ {                                    │
│   uid: user_id,                      │
│   email: user@example.com,          │
│   exp: timestamp                      │
│ }                                    │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ Send to Frontend                     │
│ { token, user,... }                 │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ Frontend: app.js                     │
│ • Save token in localStorage         │
│ • Set Authorization header           │
│ • Redirect to dashboard              │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Dashboard (protected route)      │
│ Token sent with every request    │
└──────────────────────────────────┘
```

---

## 🤖 AI Integration Flow

```
┌─────────────────────────────────────────────────────────┐
│         AI Mentor Request Flow                           │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐
│ User Message     │
│ "Explain XSS"    │
└────────┬─────────┘
         │
         ↓
┌────────────────────────────────┐
│ Frontend: terminal.js          │
│ • Capture user input           │
│ • Send to backend              │
└────────┬───────────────────────┘
         │ POST /api/ai-mentor
         ↓
┌────────────────────────────────┐
│ Backend: aiMentorEngine.js     │
│ • Receive message              │
│ • Check for API key            │
└────────┬───────────────────────┘
         │
      ┌──┴─────────────┐
      │ API Key Set?   │
      └──┬──┬─────────┘
         │  │
         │  └─NO→ Use offline knowledge base
         │
      YES
         │
         ↓
┌────────────────────────────────┐
│ OpenAI API Call                │
│ • Model: gpt-3.5-turbo         │
│ • Messages: [...]              │
│ • Max tokens: 500              │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ OpenAI Response                │
│ "XSS is a security..."         │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Cache Response                 │
│ (for future use)               │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Send to Frontend               │
│ { response, cached: false }    │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Display in Terminal            │
│ "XSS is a security..."         │
└────────────────────────────────┘
```

---

## 💾 Database Schema Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Database Tables                       │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐
│ users            │
├──────────────────┤
│ id (PK)          │
│ email            │
│ password_hash    │
│ name             │
│ role             │
│ created_at       │
│ preferred_theme  ← NEW
└──────────────────┘
       │
       ├──→ has many ───┐
       │                │
       ├──→ has many ───┤
       │                ├──→ ┌──────────────────┐
       │                │    │ progress         │
       │                │    ├──────────────────┤
       │                │    │ id (PK)          │
       │                └───→│ user_id (FK)     │
       │                     │ module_id (FK)   │
       │                     │ score            │
       │                     │ completed_at     │
       │                     └──────────────────┘
       │
       └──→ has many ───┬────→ ┌──────────────────┐
                        │      │ ai_logs          │
                        │      ├──────────────────┤
                        │      │ id (PK)          │
                        │      │ user_id (FK)     │
                        │      │ message          │
                        │      │ response         │
                        │      │ created_at       │
                        │      └──────────────────┘
                        │
                        └────→ ┌──────────────────┐
                               │ courses          │
                               ├──────────────────┤
                               │ id (PK)          │
                               │ title            │
                               │ description      │
                               │ difficulty_level │
                               └──────────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Security Layers                             │
└─────────────────────────────────────────────────────────┘

Layer 1: Protocol Level
├── HTTPS (TLS/SSL)         ← Encrypt in transit
├── HSTS                    ← Force HTTPS
└── Certificate pinning     ← Trust validation

Layer 2: Application Level
├── CORS                    ← Cross-origin control
├── CSRF tokens            ← Request forgery prevention
├── Rate limiting          ← DDoS protection
└── Input validation       ← Injection prevention

Layer 3: Authentication
├── JWT tokens             ← Stateless auth
├── Password hashing       ← bcrypt
├── MFA support           ← Multi-factor (optional)
└── Session timeout       ← Auto logout

Layer 4: Authorization
├── Role-based access control (RBAC)
├── Middleware checks
└── Route protection

Layer 5: Data Level
├── Prepared statements    ← SQL injection prevention
├── Parameterized queries  ← Type safety
├── Encryption at rest     ← Data protection
└── Audit logging         ← Compliance

Layer 6: External Services
├── API key management
├── Secure storage
├── Rotation policy
└── Access logging
```

---

## 🎯 Theme Color Palette

```
┌─────────────────────────────────────────────────────────┐
│            Dark Mode Color Palette                       │
└─────────────────────────────────────────────────────────┘

Background Colors          │ Text Colors
─────────────────────────  ├  ──────────────────────
 ████ --bg-primary         │   ████ --text-primary
     #030810               │       #e5e7eb
                           │
 ████ --bg-secondary       │   ████ --text-secondary
     #0a1420               │       #d1d5db
                           │
 ████ --bg-tertiary        │   ████ --text-light
     #111827               │       #9ca3af
                           │
                           │   ████ --text-muted
                           │       #6b7280

Accent Colors              │ Status Colors
─────────────────────────  ├  ──────────────────────
 ████ --accent-primary     │   ████ --status-success
     #00e5b0 (Neon Teal)   │       #10b981 (Green)
                           │
 ████ --accent-secondary   │   ████ --status-warning
     #3b82f6 (Blue)        │       #f59e0b (Amber)
                           │
 ████ --accent-tertiary    │   ████ --status-error
     #8b5cf6 (Purple)      │       #ef4444 (Red)
                           │
 ████ --accent-danger      │   ████ --status-info
     #ef4444 (Red)         │       #3b82f6 (Blue)
                           │
 ████ --accent-success     │ Border Colors
     #10b981 (Green)       │  ──────────────────────
                           │   ████ --border-color
 ████ --accent-warning     │       #1f2937
     #f59e0b (Amber)       │
                           │   ████ --border-primary
                           │       #00e5b0
```

---

## 📈 Performance Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Performance Optimization Layers                │
└─────────────────────────────────────────────────────────┘

Browser Level
├── Caching
│   ├── Browser cache (HTTP headers)
│   ├── Service worker (offline support)
│   └── localStorage (preferences)
├── Compression
│   ├── gzip compression
│   └── Minified assets
└── Loading
    ├── Lazy loading images
    ├── Code splitting
    └── Progressive enhancement

Network Level
├── HTTP/2
├── Connection pooling
├── CDN for static files
└── Request batching

Backend Level
├── Database optimization
│   ├── Query optimization
│   ├── Indexing
│   └── Connection pooling
├── Caching
│   ├── Redis/Memcached
│   ├── Response caching
│   └── API response cache
└── Load balancing

AI Service Level
├── Response caching
├── Prompt optimization
├── Model selection
│   ├── gpt-3.5-turbo (fast, cheap)
│   └── gpt-4-turbo (accurate, slower)
└── Rate limiting
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│          Production Deployment Setup                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Load Balancer (nginx)           │
│    - HTTPS termination                  │
│    - Request routing                    │
│    - Static file serving                │
└──────────┬────────────────────────────┬─┘
           │                            │
      ┌────┴──────────┐          ┌──────┴───────┐
      │              │          │              │
      ↓              ↓          ↓              ↓
┌──────────────┐ ┌──────────────┐
│    App       │ │    App       │ ← Horizontal Scaling
│  Instance 1  │ │  Instance 2  │
└──┬───────┬──┘ └──┬───────┬──┘
   │       │      │       │
   │       └──┬───┘       │
   │          │           │
   ├─────────┬┴────┬──────┤
   ↓         ↓     ↓      ↓
┌────────────────────────┐
│   Database             │
│  (PostgreSQL Cluster)  │
│  - Master replication  │
│  - Read replicas       │
│  - Backup              │
└────────────────────────┘

   External Services
   - OpenAI API
   - Monitoring (Datadog, etc)
   - Logging (ELK, etc)
   - Email service
```

---

## 📊 API Endpoints Overview

```
Authentication
├── POST   /api/auth/register
├── POST   /api/auth/login
├── POST   /api/auth/logout
└── POST   /api/auth/refresh

User Management
├── GET    /api/user/profile
├── GET    /api/user/settings
├── PUT    /api/user/settings
├── PUT    /api/user/theme
└── DELETE /api/user/account

Learning
├── GET    /api/courses
├── GET    /api/courses/:id
├── POST   /api/courses/:id/start
├── POST   /api/courses/:id/complete
└── GET    /api/progress

AI Services
├── POST   /api/ai-mentor         ← Chat with AI
├── POST   /api/ai-analyze        ← Behavioral analysis
└── POST   /api/ai-recommend      ← Recommendations

Analytics
├── GET    /api/analytics/user
├── GET    /api/analytics/courses
└── GET    /api/leaderboard

Admin
├── GET    /api/admin/users
├── PUT    /api/admin/users/:id
├── DELETE /api/admin/users/:id
└── GET    /api/admin/statistics
```

---

## 🔄 Service Communication

```
┌─────────────────────────────────────────────────────────┐
│          Inter-Service Communication                     │
└─────────────────────────────────────────────────────────┘

Frontend (Browser)
    │ HTTPS/REST
    ↓
API Routes (api.js)
    │ Internal Function Calls
    ├──→ authService       (Login, registration, JWT)
    ├──→ aiMentorEngine    (AI responses)
    ├──→ adaptiveEngine    (Learning paths)
    ├──→ behavioralAnalyzer (User patterns)
    ├──→ progressService   (Tracking)
    ├──→ leaderboardService (Rankings)
    ├──→ scoreService      (Points, badges)
    └──→ analyticsService  (Metrics)
         │
         └──→ Database Access
              ├── PostgreSQL
              ├── MongoDB
              └── In-Memory

External APIs
    ├─→ OpenAI API        (GPT responses)
    ├─→ Email Service     (Notifications)
    └─→ Analytics         (Tracking)
```

---

## ✅ Verification Checklist

```
System Component Checklist
════════════════════════════════

[ ] Frontend
    [ ] All HTML pages load
    [ ] JavaScript executes without errors
    [ ] CSS applies correctly
    [ ] Theme system works
    [ ] Responsive design functional

[ ] Backend
    [ ] Server starts without errors
    [ ] API endpoints respond
    [ ] Database connection established
    [ ] Authentication works
    [ ] Error handling functional

[ ] Database
    [ ] Connection pool created
    [ ] Tables initialized
    [ ] Data persists
    [ ] Queries optimize
    [ ] Backups configured

[ ] AI Integration
    [ ] API key configured
    [ ] Requests processed
    [ ] Responses cached
    [ ] Fallback works
    [ ] Cost tracking enabled

[ ] Security
    [ ] HTTPS enabled
    [ ] CORS configured
    [ ] Input validation works
    [ ] JWT tokens valid
    [ ] Passwords hashed

[ ] Performance
    [ ] Load time < 2s
    [ ] API response < 200ms
    [ ] Database query < 100ms
    [ ] Memory usage stable
    [ ] CPU usage normal

[ ] Monitoring
    [ ] Logging functional
    [ ] Error tracking enabled
    [ ] Analytics working
    [ ] Alerts configured
    [ ] Dashboard accessible
```

---

## 📞 Support Architecture

```
Support Tiers
═════════════════════════════════════════

Tier 1: Self-Service
├── Documentation (this file & others)
├── FAQ & Guides
├── Video tutorials
└── Code examples

Tier 2: Automated
├── Error logging
├── Monitoring alerts
├── Automated recovery
└── Health checks

Tier 3: Community
├── GitHub issues
├── Discussion forums
└── Community guides

Tier 4: Professional
├── Email support
├── Phone support
└── Dedicated account manager
```

---

**Last Updated**: 2024  
**Version**: 2.0  
**Status**: Production Ready ✅
