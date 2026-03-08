# CyberMind v2 - Enterprise-Ready Architecture

A modern cybersecurity training platform built with Node.js, Express, and clean architectural patterns.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
open http://localhost:3001
```

## 📁 Project Structure

```
cybermind/
├── backend/
│   ├── config/
│   │   ├── environment.js      # Environment configuration
│   │   └── database.js         # Database connection (future)
│   ├── constants/
│   │   └── appConstants.js     # Application constants
│   ├── data/
│   │   └── users.js            # Demo user data
│   ├── middleware/
│   │   ├── validation.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── routes/
│   │   └── api.js              # API routes
│   ├── services/               # Business logic (future)
│   ├── utils/
│   │   ├── logger.js           # Logging utility
│   │   ├── responseUtils.js    # Response formatting
│   │   └── userUtils.js        # User utilities
│   └── server.js               # Main server file
├── frontend/
│   └── pages/                  # HTML pages
├── js/
│   └── components/             # Frontend components
├── css/
│   └── style.css               # Styles
├── assets/                     # Static assets
├── .env.example                # Environment template
└── package.json
```

## 🏗️ Architecture Overview

### Clean Architecture Principles

- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Injection**: Services and utilities are injected where needed
- **Middleware Pattern**: Request processing pipeline
- **Error Boundaries**: Centralized error handling
- **Configuration Management**: Environment-based configuration

### Key Components

#### Backend Layers

1. **Routes Layer** (`backend/routes/`)
   - API endpoint definitions
   - Route-specific middleware
   - Request validation

2. **Middleware Layer** (`backend/middleware/`)
   - Authentication & authorization
   - Input validation & sanitization
   - Error handling
   - Request logging

3. **Service Layer** (`backend/services/`)
   - Business logic
   - Database operations
   - External API calls

4. **Data Layer** (`backend/data/`)
   - Data models
   - Repository patterns
   - Database schemas

5. **Utils Layer** (`backend/utils/`)
   - Helper functions
   - Logging utilities
   - Response formatters

#### Configuration

- **Environment Config** (`backend/config/environment.js`)
- **Constants** (`backend/constants/appConstants.js`)
- **Validation Rules** (`backend/middleware/validation.js`)

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/login` | User authentication |
| POST | `/api/update-score` | Update user score |
| GET | `/api/leaderboard` | Get leaderboard |
| GET | `/api/user/:username` | Get user data |

## 🗄️ Database Integration Ready

The application is designed for easy database migration:

### Current State (In-Memory)
- Demo data in `backend/data/users.js`
- No external dependencies
- Perfect for development/testing

### Future Database Support

#### MongoDB Integration
```bash
npm install mongoose
# Set DB_TYPE=mongodb in .env
```

#### MySQL Integration
```bash
npm install mysql2
# Set DB_TYPE=mysql in .env
```

### Migration Steps
1. Install database driver
2. Update `backend/config/database.js`
3. Implement service layer
4. Update API routes to use services
5. Test with database

## 🔒 Security Features

- Input validation and sanitization
- CORS configuration
- Error message sanitization
- Environment-based secrets
- Rate limiting ready

## 📊 Monitoring & Logging

- Structured logging with levels
- Request/response logging
- Error tracking
- Performance monitoring ready

## 🧪 Testing Strategy

- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- Database migration tests

## 🚀 Deployment

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your values
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure database
- [ ] Set secure `JWT_SECRET`
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring

## 🤝 Contributing

1. Follow the established architecture patterns
2. Add tests for new features
3. Update documentation
4. Use meaningful commit messages

## 📝 License

ISC License

---

**Built with ❤️ for cybersecurity education**