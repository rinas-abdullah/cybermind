# CyberMind v2 - Database Integration Preparation

## Overview
CyberMind is a cybersecurity training platform with a Node.js/Express backend and HTML/CSS/JS frontend. The current implementation uses in-memory data storage and is prepared for database integration.

## Current Status
✅ **Completed:**
- Express server with proper routing
- Static file serving from project root
- RESTful API endpoints (login, scores, leaderboard, users)
- Modular frontend components
- Service layer architecture prepared

⏳ **Prepared for Future Implementation:**
- Database configuration structure
- Service layer placeholders
- Migration path documented
- Schema design completed

## Database Integration Plan

### 1. Choose Database
**Option A: MongoDB (Recommended for flexibility)**
- Document-based storage
- Easy scaling
- Native JSON support

**Option B: MySQL (Recommended for complex queries)**
- Relational data integrity
- Advanced querying capabilities
- ACID compliance

### 2. Implementation Steps

#### Step 2.1: Install Dependencies
```bash
# For MongoDB:
npm install mongoose

# For MySQL:
npm install mysql2

# Optional: Redis for caching
npm install redis
```

#### Step 2.2: Environment Variables
Create `.env` file:
```env
# Database Configuration
DB_TYPE=mongodb  # or mysql
MONGODB_URI=mongodb://localhost:27017/cybermind
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cybermind

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Step 2.3: Database Schema

**Users Collection/Table:**
```javascript
{
  _id: ObjectId,           // or auto-increment id
  username: String,       // unique, indexed
  password_hash: String,  // bcrypt hashed
  points: Number,         // default 0
  level: Number,          // calculated from points
  created_at: Date,
  last_login: Date
}
```

**TrainingProgress Collection/Table:**
```javascript
{
  _id: ObjectId,           // or auto-increment id
  user_id: ObjectId,       // reference to users
  scenario_id: String,     // indexed
  status: String,          // 'completed', 'failed', 'in_progress'
  score_awarded: Number,
  time_spent: Number,      // seconds
  completed_at: Date,
  attempts: Number         // retry tracking
}
```

#### Step 2.4: Service Implementation
Update each service file in `backend/services/`:
- `authService.js`: User authentication and management
- `scoreService.js`: Score updates and calculations
- `leaderboardService.js`: Leaderboard generation and caching
- `trainingProgressService.js`: Progress tracking

#### Step 2.5: Update Server.js
1. Uncomment service imports
2. Replace in-memory operations with service calls
3. Add database connection initialization
4. Update error handling

### 3. Migration Strategy

#### Data Migration
1. Export current in-memory data to JSON
2. Create database migration script
3. Import data with proper relationships
4. Validate data integrity

#### Zero-Downtime Deployment
1. Deploy database alongside current system
2. Implement feature flags for database operations
3. Gradually migrate users/features
4. Remove in-memory data after full migration

### 4. Performance Considerations

#### Caching Strategy
- Redis for leaderboard caching
- Database query result caching
- Static asset caching headers

#### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization
- Database read replicas for high traffic

## File Structure After Integration
```
backend/
├── config/
│   └── database.js          # Database connection config
├── services/
│   ├── authService.js       # User authentication
│   ├── scoreService.js      # Score management
│   ├── leaderboardService.js # Leaderboard operations
│   └── trainingProgressService.js # Training tracking
└── server.js                # Main server (updated)
```

## Testing Strategy
1. Unit tests for each service
2. Integration tests for API endpoints
3. Database migration tests
4. Performance/load testing
5. Data consistency validation

## Rollback Plan
- Keep in-memory data as fallback
- Database connection timeouts
- Graceful degradation to cached data
- Easy switching between storage types

## Next Steps
1. Choose database type (MongoDB/MySQL)
2. Set up local database instance
3. Implement database configuration
4. Start with authService implementation
5. Gradually migrate other services
6. Update frontend if needed for new features

---
*This document outlines the database integration preparation. The codebase is production-ready for the current in-memory implementation and fully prepared for database migration.*