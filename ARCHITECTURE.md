# CyberMind Platform Architecture

## Core Mission
CyberMind is an intelligent cybersecurity training platform featuring adaptive learning, behavioral analysis, and explainable AI tutoring.

---

## Core Systems

### 1. Adaptive Scenario Engine
- Analyzes learner performance, response times, error patterns
- Generates next scenario based on skill gaps
- Dynamically adjusts difficulty (beginner → intermediate → advanced)
- Recommends learning paths
- Factors: score, time, mistakes, behavioral patterns

**Output**: Next scenario with appropriate difficulty and type

### 2. Learner Cognitive Risk Profile
Each user has a persistent deep profile:
- **Knowledge Level**: 0-100 (calculated from scores)
- **Skill Memory**: Array of repeated failures (phishing, privilege escalation, etc.)
- **Risk Decision Patterns**: Categories (careful, reckless, overthinking, etc.)
- **Response Time Behavior**: Fast/slow, consistent/erratic
- **Vulnerability Tendencies**: Areas repeatedly failed
- **Learning Retention**: Confidence in past skills
- **Behavioral Classification**: Persona (Careful Defender, Fast but Risky, etc.)

**Updated live** during each scenario completion.

### 3. Behavioral Security Analysis
Tracks non-score metrics:
- Decision velocity (rushed vs deliberate)
- Warning acknowledgment (ignored warnings)
- Verification patterns (verification skipping)
- Pressure responses (performance under time)
- Risk tolerance (aggressive vs conservative choices)

**Output**: Behavioral persona that influences scenario selection.

### 4. Persistent Skill Memory
System remembers weaknesses and reintroduces them:
- Failed skills logged with timestamp
- Reintroduced at escalating difficulty
- Measures retention confidence
- Tracks multi-visit skill recovery
- Creates long-term adaptive paths

**Example**: User fails phishing detection twice → reintroduced in 10 scenarios as social engineering variants.

### 5. Explainable AI Tutor
After each scenario:
- Explains why answer was incorrect
- References security principle violated
- Describes real-world attack vector
- Suggests defensive mindset
- Explains why scenario was selected
- Shows skill improvement areas

**Output**: Educational feedback that teaches, not just scores.

### 6. Institutional Analytics Layer
For instructors/organizations:
- Cohort skill gap heatmaps
- Common vulnerability patterns
- Training effectiveness metrics
- Recommended curriculum adjustments
- Learner comparison (anonymized)
- Challenge difficulty trending

---

## Technical Stack

### Frontend
- HTML5
- CSS3 (dark theme, component system)
- Vanilla JavaScript (modular)
- Chart.js (analytics)

### Backend
- Node.js + Express
- RESTful API
- Modular route structure
- Middleware for auth, validation, logging

### Database
- **MongoDB** (recommended) or PostgreSQL
- Collections: Users, Scenarios, Progress, RiskProfiles, Analytics

### Authentication
- JWT tokens
- Session management
- Secure password hashing (bcrypt)

---

## Database Schema

### User Collection
```
{
  _id: ObjectId
  username: String (unique)
  email: String (unique)
  passwordHash: String
  role: String (learner, instructor, admin)
  
  profile: {
    displayName: String
    avatar: String
    joinDate: Date
    lastActive: Date
  }
  
  stats: {
    totalScore: Number
    completedScenarios: Number
    successRate: Number
    averageTime: Number
    currentRank: Number
  }
  
  riskProfile: {
    knowledgeLevel: Number (0-100)
    riskPersona: String (Careful Defender, Fast but Risky, etc.)
    responseTimePattern: String
    decisionVelocity: String
    riskTolerance: String
    learningRetention: Number (0-100)
    lastUpdated: Date
  }
  
  skillMemory: [
    {
      skillName: String
      failureCount: Number
      lastFailed: Date
      retentionConfidence: Number
      reintroductionCount: Number
    }
  ]
  
  scenarioHistory: [
    {
      scenarioId: ObjectId
      completedDate: Date
      score: Number
      timeTaken: Number
      decisions: [Object]
      performanceMetrics: Object
    }
  ]
}
```

### Scenario Collection
```
{
  _id: ObjectId
  title: String
  description: String
  type: String (phishing, privilege-escalation, network-recon, etc.)
  difficulty: String (beginner, intermediate, advanced, expert)
  skillTags: [String]
  
  content: {
    briefing: String
    pressureLevel: String (low, medium, high)
    timeLimit: Number (seconds)
    alerts: [String]
  }
  
  questions: [
    {
      id: String
      text: String
      type: String (multiple-choice, scenario-decision, code-review)
      options: [Object]
      correctAnswer: String
      explanation: String
      securityPrinciple: String
      realWorldContext: String
    }
  ]
  
  adaptiveMetadata: {
    averageScore: Number
    recommendedAfterScenarios: [String]
    skillsTeaught: [String]
    commonMistakes: [String]
  }
}
```

### RiskProfile Collection
```
{
  userId: ObjectId
  timestamp: Date
  
  behavioralMetrics: {
    decisionVelocity: Number (ms - how fast decisions made)
    warningAcknowledgment: Number (0-100)
    verificationBehavior: Number (0-100)
    pressurePerformance: Number (0-100)
    consistencyScore: Number
  }
  
  personaScore: {
    carefulDefender: Number
    fastButRisky: Number
    socialEngTolerant: Number
    reconSpecialist: Number
    incidentResponder: Number
  }
  
  predictedNextWeakness: String
  recommendedScenarioType: String
  adaptiveDifficultyLevel: String
}
```

### Progress Collection
```
{
  userId: ObjectId
  scenarioId: ObjectId
  attemptNumber: Number
  score: Number
  timeTaken: Number
  decisions: [
    {
      questionId: String
      selectedAnswer: String
      isCorrect: Boolean
      timeToAnswer: Number
      riskLevel: String (low, medium, high)
    }
  ]
  
  aiExplanation: {
    explanation: String
    principleViolated: String
    realWorldContext: String
    suggestedMindset: String
    whySelected: String
  }
  
  completedAt: Date
}
```

---

## API Structure

### Authentication Routes
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login
POST   /api/auth/logout            Logout
GET    /api/auth/me                Get current user
```

### User Routes
```
GET    /api/users/:id              Get user profile
PUT    /api/users/:id              Update profile
GET    /api/users/:id/stats        Get user stats
GET    /api/users/:id/profile      Get risk profile
GET    /api/users/:id/history      Get scenario history
```

### Scenario Routes
```
GET    /api/scenarios              List available scenarios
GET    /api/scenarios/:id          Get scenario details
POST   /api/scenarios/:id/submit   Submit scenario attempt
GET    /api/scenarios/adaptive/next Get next recommended scenario
```

### Analytics Routes
```
GET    /api/analytics/dashboard    Get dashboard data
GET    /api/analytics/progress     Get progress metrics
GET    /api/analytics/skills       Get skill analysis
GET    /api/analytics/behavior     Get behavioral profile
```

### Admin Routes
```
GET    /api/admin/users            List all users
GET    /api/admin/analytics        Institutional analytics
PUT    /api/admin/scenarios/:id    Update scenario
POST   /api/admin/reports          Generate reports
```

---

## Adaptive Engine Algorithm

### Scenario Selection Logic
```
1. Get user's risk profile
2. Identify skill gaps from skill memory
3. Check learning retention
4. Consider behavioral patterns
5. Calculate difficulty progression
6. Select scenario that:
   - Targets weakest skill
   - Matches adaptive difficulty
   - Introduces new variant of known weakness
   - Respects pressure simulation schedule
7. Return scenario with AI context
```

### Difficulty Calculation
```
baseScore = (completedScenarios / totalAttempts) * 100
knowledgeLevel = baseScore + learningRetention
difficulty = calculateDifficulty(knowledgeLevel, skillGaps, behavioralType)
```

### Skill Memory Update
```
On scenario completion:
1. Identify which skills were tested
2. Update success/failure for each skill
3. If failed: add to skill memory with timestamp
4. If passed multiple times: increase retention confidence
5. Schedule reintroduction if needed
```

---

## Frontend Architecture

### Page Structure
- **Dashboard**: Hero, stats, recommendations, leaderboard preview
- **Training**: Scenario interface, decisions, explanation, progress
- **Terminal**: Lab simulation, command input, system responses
- **Leaderboard**: Rankings, badges, achievements
- **Admin**: Analytics, user management, scenario tuning
- **Profile**: Skill memory, behavioral analysis, learning path

### Component Reuse
- `.panel` - Base card component
- `.btn` - Button variants (primary, secondary, ghost)
- `.stat-card` - Statistics display
- `.skill-badge` - Skill/badge display
- `.progress-bar` - Progress indicator
- `.modal` - Explanation/feedback display

### Data Flow
User → Authentication → Dashboard (load profile) → Training (get adaptive scenario) → Submit → Explanation → Next Scenario

---

## Key Differentiators from TryHackMe

1. **Explainable AI Tutor**: Explains not just corrections but security principles and real-world context
2. **Behavioral Analysis**: Tracks how users make decisions, not just if they're correct
3. **Persistent Skill Memory**: Dynamically reintroduces weaknesses across future scenarios
4. **Pressure Simulation**: Optional timed challenges and alert scenarios
5. **Decision Replay**: Interactive forensic analysis of choices made
6. **Institutional Intelligence**: Deep cohort analytics for curricula adjustments
7. **Risk Persona Classification**: Dynamic behavioral categorization affecting recommendations

---

## Implementation Priorities

### Phase 1 (Foundation)
- [ ] Database schema implementation
- [ ] User authentication system
- [ ] Basic CRUD for scenarios and progress
- [ ] Frontend auth pages

### Phase 2 (Adaptive Core)
- [ ] Risk profile calculation algorithm
- [ ] Adaptive scenario selection engine
- [ ] Behavioral analysis metrics
- [ ] Skill memory system

### Phase 3 (Intelligence)
- [ ] Explainable AI tutor responses
- [ ] Decision replay system
- [ ] Pressure simulation scenarios
- [ ] Institutional analytics

### Phase 4 (Scaling)
- [ ] Advanced analytics dashboard
- [ ] Admin panel for scenario management
- [ ] Cohort comparison analytics
- [ ] Reports and export functionality

---

## Security Considerations

- JWT token rotation
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention (use parameterized queries)
- XSS protection
- CSRF tokens for state-changing operations
- Password hashing with bcrypt
- HTTPS enforcement in production
- Admin role verification on sensitive endpoints

---

## Future Enhancements

- Real-time multiplayer scenarios
- AI scenario generation from attack trees
- Browser extension for real-world phishing detection
- Mobile app support
- API keys for institutional integrations
- Custom scenario builder
- Certification tracking
- Automated penetration testing based on skill level
