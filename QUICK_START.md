// ===== CYBERMIND QUICK START GUIDE =====

/**
 * QUICK START: Getting CyberMind's AI Systems Running
 * 
 * This is a condensed guide for developers who want to get up and running
 * with CyberMind's intelligent training systems quickly.
 * 
 * Time estimate: 2-3 hours for basic integration
 * Time estimate: 8-10 hours for full production deployment
 */

// ============================================================================
// PHASE 1: UNDERSTAND THE 6 SYSTEMS (15 min)
// ============================================================================

/*
The 6 intelligent systems are already coded. Here's what they do:

1. AdaptiveScenarioEngine (adaptiveEngine.js)
   When: Before each training session
   Does: Picks the perfect next scenario for this learner
   Example output: "Privilege escalation scenario (intermediate) - targets your weakest skill"

2. RiskProfileService (riskProfileService.js)
   When: After each scenario attempt
   Does: Updates learner's profile with knowledge level, skills, persona
   Example output: "Knowledge: 42→54, Persona: Fast&Risky→CarefulDefender"

3. ExplainableAITutor (aiTutor.js)
   When: When showing feedback
   Does: Explains WHY they got it wrong with context
   Example output: "This is Zero Trust violation. Real attack: [context]. Better way: [advice]"

4. BehavioralSecurityAnalyzer (behavioralAnalyzer.js)
   When: Analyzing how they made decisions
   Does: Tracks speed, warning acknowledgment, verification, pressure response
   Example output: "Fast decision (3s) but ignored warning - risky pattern"

5. InstitutionalAnalyticsEngine (institutionalAnalytics.js)
   When: Admin views cohort dashboard
   Does: Shows group-wide skill gaps, common mistakes, recommendations
   Example output: "80% of cohort struggles with phishing - add 3 more scenarios"

6. CoreTrainingEngine (coreTrainingEngine.js)
   When: Orchestrating entire learning session
   Does: Coordinates all 5 systems above
   Example: User starts → Engine picks scenario → User completes → All 5 systems run
*/

// ============================================================================
// PHASE 2: SET UP DATABASE (30 min)
// ============================================================================

/*
CyberMind services are database-agnostic. Choose one:

Option A: MongoDB (RECOMMENDED - what the schema was designed for)
Option B: PostgreSQL
Option C: Keep in-memory for testing only

For MongoDB, install mongoose:
$ npm install mongoose

Then create models in backend/models/:
- User.js (profile, skills, history)
- Scenario.js (questions, metadata)
- Progress.js (individual attempts)

See ARCHITECTURE.md for detailed schema.
*/

// ============================================================================
// PHASE 3: CREATE ROUTES (30 min)
// ============================================================================

/**
 * File: backend/routes/training.js
 * 
 * Copy this minimal integration:
 */

const express = require('express');
const router = express.Router();
const CoreTrainingEngine = require('../services/coreTrainingEngine');

// Single engine instance (or use database)
const engine = new CoreTrainingEngine();

// Route 1: Initialize user (call after signup)
router.post('/api/training/init/:userId', (req, res) => {
  const profile = engine.initializeUser(req.params.userId, req.body.username);
  res.json({ success: true, profile });
});

// Route 2: Get next scenario (call before training)
router.get('/api/training/next-scenario/:userId', (req, res) => {
  // Get available scenarios from database
  const scenarios = [
    {
      id: 'scenario-1',
      title: 'Phishing Detection',
      type: 'phishing',
      difficulty: 'beginner',
      skillTags: ['email-security', 'phishing']
    }
    // ... more scenarios
  ];

  const scenario = engine.selectNextScenario(req.params.userId, scenarios);
  res.json({
    success: true,
    scenario,
    // Add context for user
    message: `Based on your ${scenario.adaptiveMetadata.personalContext.persona} approach, we selected this.`
  });
});

// Route 3: Submit scenario (call when user completes)
router.post('/api/training/submit/:scenarioId', (req, res) => {
  const feedback = engine.processScenarioAttempt(
    req.body.userId,
    req.params.scenarioId,
    {
      score: req.body.score,
      decisionTimeMs: req.body.decisionTimeMs,
      warningsPresented: req.body.warningsPresented,
      warningsAcknowledged: req.body.warningsAcknowledged,
      verificationsPerformed: req.body.verificationsPerformed,
      questionsAnswered: req.body.questionsAnswered,
      timeLimited: req.body.timeLimited,
      skillsInvolved: req.body.skillsInvolved,
      incorrectAnswers: req.body.incorrectAnswers,
      decisions: req.body.decisions,
      difficulty: req.body.difficulty
    }
  );

  res.json({
    success: true,
    feedback,
    // Highlight key feedback
    score: feedback.score,
    explanations: feedback.explanations.length > 0 ? 'Incorrect answers explained' : 'Perfect!',
    nextFocus: feedback.userProgressUpdate.skillsNeedingWork[0] || 'Great job!'
  });
});

// Route 4: Get dashboard (call on dashboard page load)
router.get('/api/training/dashboard/:userId', (req, res) => {
  const dashboard = engine.getUserDashboard(req.params.userId);
  res.json({ success: true, dashboard });
});

module.exports = router;

// ============================================================================
// PHASE 4: WIRE INTO EXPRESS (10 min)
// ============================================================================

/*
In backend/server.js, add:

const trainingRoutes = require('./routes/training');
app.use(trainingRoutes);

Now your routes are live at:
- POST /api/training/init/:userId
- GET /api/training/next-scenario/:userId
- POST /api/training/submit/:scenarioId
- GET /api/training/dashboard/:userId
*/

// ============================================================================
// PHASE 5: CREATE FRONTEND CLIENT (20 min)
// ============================================================================

/**
 * File: js/trainingClient.js
 * 
 * Simple client to call the backend:
 */

class TrainingClient {
  async initializeUser(userId, username) {
    const res = await fetch(`/api/training/init/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return res.json();
  }

  async getNextScenario(userId) {
    const res = await fetch(`/api/training/next-scenario/${userId}`);
    return res.json();
  }

  async submitScenario(userId, scenarioId, metrics) {
    const res = await fetch(`/api/training/submit/${scenarioId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...metrics })
    });
    return res.json();
  }

  async getDashboard(userId) {
    const res = await fetch(`/api/training/dashboard/${userId}`);
    return res.json();
  }
}

// Usage in HTML:
/*
<script src="js/trainingClient.js"></script>
<script>
  const client = new TrainingClient();
  
  // On page load
  client.getDashboard(userId).then(data => {
    document.getElementById('knowledge').textContent = data.dashboard.profile.knowledgeLevel;
    document.getElementById('nextFocus').textContent = data.dashboard.recommendations.focusAreas[0];
  });
  
  // When "Start Training" clicked
  document.getElementById('startBtn').onclick = async () => {
    const result = await client.getNextScenario(userId);
    displayScenario(result.scenario);
  };
  
  // When user submits answers
  document.getElementById('submitBtn').onclick = async () => {
    const metrics = {
      score: calculateScore(),
      decisionTimeMs: Date.now() - startTime,
      warningsPresented: 3,
      warningsAcknowledged: userAcknowledgedWarnings ? 3 : 1,
      verificationsPerformed: verificationCount,
      questionsAnswered: 4,
      timeLimited: false,
      skillsInvolved: ['phishing-detection'],
      incorrectAnswers: getIncorrectAnswers(),
      decisions: decisionLog,
      difficulty: 'beginner'
    };
    
    const feedback = await client.submitScenario(userId, scenarioId, metrics);
    displayFeedback(feedback.feedback);
  };
</script>
*/

// ============================================================================
// PHASE 6: TEST END-TO-END (30 min)
// ============================================================================

/*
Manual testing checklist:

1. Start server:
   $ npm start
   
2. Test initialization:
   curl -X POST http://localhost:3001/api/training/init/user123 \
     -H "Content-Type: application/json" \
     -d '{"username":"alice"}'
   
   Expected: { success: true, profile: { knowledgeLevel: 0, riskPersona: "Beginner", ... } }

3. Test scenario selection:
   curl http://localhost:3001/api/training/next-scenario/user123
   
   Expected: scenario object with adaptive metadata explaining why selected

4. Test submission:
   curl -X POST http://localhost:3001/api/training/submit/scenario-1 \
     -H "Content-Type: application/json" \
     -d '{"userId":"user123","score":85,"decisionTimeMs":7500,...}'
   
   Expected: feedback object with explanations, behavioral insights, next scenario

5. Test dashboard:
   curl http://localhost:3001/api/training/dashboard/user123
   
   Expected: dashboard with updated knowledge level, skill memory, recommendations

If all respond with success: true, you're ready for frontend!
*/

// ============================================================================
// PHASE 7: COLLECT BEHAVIORAL METRICS (30 min)
// ============================================================================

/**
 * Create js/trainingMetrics.js for full metric collection:
 */

class TrainingMetrics {
  constructor() {
    this.startTime = null;
    this.decisions = [];
    this.warnings = { presented: 0, acknowledged: 0 };
    this.verifications = 0;
    this.incorrectAnswers = [];
  }

  start() {
    this.startTime = Date.now();
  }

  recordDecision(questionIndex, answer) {
    this.decisions.push({
      questionIndex,
      answer,
      timeMs: Date.now() - this.startTime
    });
  }

  recordWarning(acknowledged) {
    this.warnings.presented += 1;
    if (acknowledged) this.warnings.acknowledged += 1;
  }

  recordVerification() {
    this.verifications += 1;
  }

  recordIncorrectAnswer(questionIndex, userAnswer, correctAnswer) {
    this.incorrectAnswers.push({ questionIndex, userAnswer, correctAnswer });
  }

  getMetrics() {
    const totalQuestions = this.decisions.length;
    const correctAnswers = totalQuestions - this.incorrectAnswers.length;
    return {
      score: Math.round((correctAnswers / totalQuestions) * 100),
      decisionTimeMs: Date.now() - this.startTime,
      warningsPresented: this.warnings.presented,
      warningsAcknowledged: this.warnings.acknowledged,
      verificationsPerformed: this.verifications,
      questionsAnswered: totalQuestions,
      incorrectAnswers: this.incorrectAnswers,
      decisions: this.decisions
    };
  }
}

// Usage:
/*
const metrics = new TrainingMetrics();
metrics.start();

// During scenario...
metrics.recordWarning(true);          // User saw warning
metrics.recordVerification();          // User double-checked
metrics.recordDecision(0, userAnswer); // Track each decision

document.getElementById('submit').onclick = () => {
  const data = metrics.getMetrics();
  client.submitScenario(userId, scenarioId, data);
};
*/

// ============================================================================
// PRODUCTION DEPLOYMENT CHECKLIST
// ============================================================================

/*
Before deploying to production:

CODE
☐ All 6 service files created (check backend/services/)
☐ CoreTrainingEngine can import all 5 services
☐ Routes created and mounted in server.js
☐ Frontend client created (js/trainingClient.js)
☐ Metrics collector created (js/trainingMetrics.js)

DATABASE
☐ MongoDB/PostgreSQL set up locally for testing
☐ User collection created and seeded with test data
☐ Scenario collection created with sample scenarios
☐ CoreTrainingEngine updated to use database instead of in-memory

TESTING
☐ All 4 routes tested with curl or Postman
☐ User initialization works
☐ Scenario selection returns different scenarios for different users
☐ Submission processes and returns feedback
☐ Dashboard shows updated profile
☐ Frontend loads without errors

FRONTEND
☐ Dashboard page connects to /api/training/dashboard
☐ Training page shows adaptive scenarios
☐ Feedback displays properly after submission
☐ Metrics collection working
☐ No console errors

DEPLOYMENT
☐ Set environment variables (DB connection string, etc.)
☐ Run migrations if using SQL
☐ Configure production database
☐ Set up error logging/monitoring
☐ Test under load (100+ concurrent users)
☐ Deploy backend
☐ Deploy frontend
☐ Monitor for errors
*/

// ============================================================================
// HELPFUL COMMANDS
// ============================================================================

/*
# Test the adaptive engine locally (Node REPL)
$ node
> const AdaptiveEngine = require('./backend/services/adaptiveEngine');
> const engine = new AdaptiveEngine();
> const scenario = engine.selectNextScenario(userProfile, skillMemory, availableScenarios);
> console.log(scenario.id); // Should print selected scenario

# Test the core training engine
> const CoreEngine = require('./backend/services/coreTrainingEngine');
> const trainer = new CoreEngine();
> const profile = trainer.initializeUser('user1', 'Alice');
> console.log(profile.knowledgeLevel); // Should be 0

# Monitor your API
$ npm install -g nodemon
$ nodemon backend/server.js

# Test routes
$ curl -X POST http://localhost:3001/api/training/init/test-user \
  -H "Content-Type: application/json" \
  -d '{"username":"Test User"}'
*/

// ============================================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================================

/*
Issue: "Cannot find module AdaptiveScenarioEngine"
Solution: Make sure file is at backend/services/adaptiveEngine.js
          Check case sensitivity (Linux/Mac are case-sensitive)

Issue: "undefined is not a function" when calling engine methods
Solution: Make sure you instantiated the engine: new CoreTrainingEngine()
          Not: const engine = CoreTrainingEngine

Issue: Routes not responding
Solution: Check that routes are mounted in server.js: app.use(trainingRoutes)
          Try curl http://localhost:3001/api/training after checking logs

Issue: Metrics not being collected
Solution: Make sure TrainingMetrics.start() is called BEFORE scenario
          Make sure recordDecision() called for each question
          Make sure getMetrics() called AFTER scenario complete

Issue: Same scenario selected for all users
Solution: Check that user profile is being loaded from database
          Verify profiles are different for different users
          Check AdaptiveEngine identifySkillGaps() is finding gaps
*/

// ============================================================================
// NEXT STEPS AFTER BASIC INTEGRATION
// ============================================================================

/*
PHASE 1 (Done): Basic integration
- 6 service classes created
- Routes working
- Metrics collected
- Dashboard shows adaptive recommendations

PHASE 2: Advanced Features
- [ ] Decision replay system (visualize user's choices over time)
- [ ] Personalized coaching messages based on persona
- [ ] Multi-user cohort analytics
- [ ] Skill gap heatmaps with Chart.js
- [ ] Learning retention calculations

PHASE 3: Enterprise Features
- [ ] User authentication (JWT)
- [ ] Role-based access control (admin, instructor, student)
- [ ] Batch scenario imports
- [ ] Cohort management
- [ ] CSV export for institutional reporting
- [ ] PDF certificates on completion

PHASE 4: Advanced Analytics
- [ ] Predictive analytics (which users will struggle?)
- [ ] Machine learning for scenario difficulty tuning
- [ ] A/B testing different explanations
- [ ] Long-term retention tracking (6 months post-training)
- [ ] Skill decay patterns

PHASE 5: Monetization (Optional)
- [ ] Subscription plans per user
- [ ] Institutional licensing
- [ ] API access for partners
- [ ] Certification exams
- [ ] Benchmark industry reports
*/

// ============================================================================
// ESTIMATED TIME BREAKDOWN
// ============================================================================

/*
Time Estimate for Full Production Deployment:

Project Management       1 hour
- Understand architecture
- Plan integration sequence

Database Setup          2 hours
- Install MongoDB/PostgreSQL
- Create schemas
- Seed sample data

Backend Integration     3 hours
- Create 4 routes
- Wire CoreTrainingEngine
- Test with Postman

Frontend Integration    2 hours
- Create TrainingClient
- Create MetricsCollector
- Wire dashboard/training pages

Testing & Debugging     2 hours
- End-to-end testing
- Fix edge cases
- Performance testing

Documentation           1 hour
- Update README
- Create deployment guide
- Document configuration

TOTAL: 11 hours for production-ready system

QUICK VERSION (Testing only, in-memory):
- Skip database setup (30 min saved)
- Use in-memory storage
- Basic testing only
TOTAL: 5 hours
*/

module.exports = {
  info: 'CyberMind Quick Start Guide - See code comments above'
};
