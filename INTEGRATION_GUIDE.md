// ===== CYBERMIND TRAINING SYSTEM INTEGRATION GUIDE =====

/**
 * COMPLETE GUIDE TO INTEGRATING CYBERMIND'S 6 CORE SYSTEMS
 * 
 * This file demonstrates how to wire the intelligent training services
 * into your Express backend routes and frontend.
 * 
 * SERVICES AVAILABLE:
 * 1. AdaptiveScenarioEngine - Intelligent scenario selection
 * 2. RiskProfileService - Learner profiling and behavioral tracking
 * 3. ExplainableAITutor - Post-attempt feedback and explanations
 * 4. BehavioralSecurityAnalyzer - Behavioral metrics and risk analysis
 * 5. InstitutionalAnalyticsEngine - Cohort-wide insights
 * 6. CoreTrainingEngine - Orchestrator that ties all services together
 */

// ============================================================================
// PART 1: BACKEND ROUTE INTEGRATION
// ============================================================================

/**
 * Place this code in: backend/routes/training.js
 */

const express = require('express');
const router = express.Router();
const CoreTrainingEngine = require('../services/coreTrainingEngine');

// Initialize the training engine (ideally singleton across app)
const trainingEngine = new CoreTrainingEngine();

/**
 * POST /api/training/user/:userId/initialize
 * Called: User registration completion
 * Initializes a new learner profile in the training system
 */
router.post('/api/training/user/:userId/initialize', (req, res) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;

    const profile = trainingEngine.initializeUser(userId, username);

    res.json({
      success: true,
      message: 'User initialized in training system',
      profile: {
        knowledgeLevel: profile.knowledgeLevel,
        riskPersona: profile.riskPersona,
        completedScenarios: profile.completedScenarios
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/training/scenarios/next?userId=:userId
 * Called: User starting a training session, clicks "Start Scenario"
 * Returns the adaptively selected next scenario with explanations
 * 
 * This is where ADAPTIVE LEARNING happens
 */
router.get('/api/training/scenarios/next', (req, res) => {
  try {
    const { userId } = req.query;

    // Get available scenarios from database (replace with DB query)
    const availableScenarios = [
      {
        id: 'scenario-001',
        title: 'Phishing Email Detection',
        type: 'phishing',
        difficulty: 'beginner',
        skillTags: ['email-security', 'phishing-detection'],
        adaptiveMetadata: {}
      },
      {
        id: 'scenario-002',
        title: 'Privilege Escalation Attempt',
        type: 'privilege-escalation',
        difficulty: 'intermediate',
        skillTags: ['access-control', 'privilege-escalation'],
        adaptiveMetadata: {}
      },
      {
        id: 'scenario-003',
        title: 'Advanced Social Engineering',
        type: 'social-engineering',
        difficulty: 'advanced',
        skillTags: ['social-engineering', 'advanced-threats'],
        adaptiveMetadata: {}
      }
    ];

    // Get adaptively selected scenario
    const selectedScenario = trainingEngine.selectNextScenario(userId, availableScenarios);

    res.json({
      success: true,
      scenario: selectedScenario,
      metadata: {
        whySelected: selectedScenario.adaptiveMetadata.whySelected,
        personalContext: selectedScenario.adaptiveMetadata.personalContext,
        expectedLearning: `You'll strengthen your ${selectedScenario.adaptiveMetadata.personalContext.skillFocus[0]} skills`
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/training/scenarios/:scenarioId/submit
 * Called: User submits scenario answers
 * Processes attempt through all 6 systems and returns comprehensive feedback
 * 
 * This is where ALL LEARNING INTELLIGENCE happens
 */
router.post('/api/training/scenarios/:scenarioId/submit', (req, res) => {
  try {
    const { scenarioId } = req.params;
    const { userId, score, decisionTimeMs, warningsPresented, warningsAcknowledged,
            verificationsPerformed, questionsAnswered, timeLimited, skillsInvolved,
            incorrectAnswers, decisions, difficulty } = req.body;

    // Process through all systems
    const feedback = trainingEngine.processScenarioAttempt(userId, scenarioId, {
      score,
      decisionTimeMs,
      warningsPresented,
      warningsAcknowledged,
      verificationsPerformed,
      questionsAnswered,
      timeLimited,
      skillsInvolved,
      incorrectAnswers,
      decisions,
      difficulty,
      questions: req.body.questions // For AI tutor explanations
    });

    res.json({
      success: true,
      feedback,
      nextActions: {
        recommendedScenario: feedback.nextActions.nextScenario,
        focusArea: feedback.nextActions.focusArea,
        readyForAdvanced: feedback.nextActions.readyForAdvanced
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/training/dashboard?userId=:userId
 * Called: User views dashboard
 * Returns personalized dashboard with recommendations
 */
router.get('/api/training/dashboard', (req, res) => {
  try {
    const { userId } = req.query;
    const dashboard = trainingEngine.getUserDashboard(userId);

    res.json({
      success: true,
      dashboard,
      message: `Welcome! Your knowledge level is ${dashboard.profile.knowledgeLevel}. Next focus: ${dashboard.recommendations.nextScenario}`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/training/learning-report?userId=:userId
 * Called: User views detailed progress report
 * Returns comprehensive learning analysis
 */
router.get('/api/training/learning-report', (req, res) => {
  try {
    const { userId } = req.query;
    const report = trainingEngine.getLearningReport(userId);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/cohort-analytics?cohortIds=:ids
 * Called: Admin views institutional analytics
 * Returns cohort-wide insights and recommendations
 */
router.get('/api/admin/cohort-analytics', (req, res) => {
  try {
    const { cohortIds } = req.query;
    const ids = cohortIds.split(',');
    const analytics = trainingEngine.getCohortAnalytics(ids);

    res.json({
      success: true,
      analytics,
      summary: {
        cohortSize: analytics.cohortReport?.cohortSize,
        skillGaps: analytics.cohortReport?.skillGaps?.allGaps?.slice(0, 5),
        recommendations: analytics.cohortReport?.recommendations?.slice(0, 3)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

// ============================================================================
// PART 2: FRONTEND INTEGRATION
// ============================================================================

/**
 * Place this code in: js/trainingIntegration.js
 * Handles communication with the intelligent training backend
 */

class TrainingClient {
  constructor(apiBaseUrl = '/api/training') {
    this.apiBaseUrl = apiBaseUrl;
    this.adminBaseUrl = '/api/admin';
    this.currentUserId = null;
  }

  /**
   * Initialize user in training system (call on login completion)
   */
  async initializeUser(userId, username) {
    const response = await fetch(`${this.apiBaseUrl}/user/${userId}/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return response.json();
  }

  /**
   * Get next adaptive scenario (call before training starts)
   */
  async getNextScenario(userId) {
    const response = await fetch(`${this.apiBaseUrl}/scenarios/next?userId=${userId}`);
    const data = await response.json();

    if (data.success) {
      // Display adaptive explanations to user
      console.log('Why this scenario:', data.metadata.whySelected);
      console.log('Personal context:', data.metadata.personalContext);
    }

    return data;
  }

  /**
   * Submit scenario attempt (call when user completes scenario)
   * Collects all behavioral metrics for intelligent analysis
   */
  async submitScenarioAttempt(userId, scenarioId, scenarioData) {
    const scenarioResult = {
      userId,
      score: scenarioData.score,
      decisionTimeMs: scenarioData.decisionTimeMs,
      warningsPresented: scenarioData.warningsPresented,
      warningsAcknowledged: scenarioData.warningsAcknowledged,
      verificationsPerformed: scenarioData.verificationsPerformed,
      questionsAnswered: scenarioData.questions?.length || 0,
      timeLimited: scenarioData.timeLimited,
      skillsInvolved: scenarioData.skillTags,
      incorrectAnswers: scenarioData.incorrectAnswers,
      decisions: scenarioData.decisionLog, // Time-series of user decisions
      difficulty: scenarioData.difficulty,
      questions: scenarioData.questions
    };

    const response = await fetch(`${this.apiBaseUrl}/scenarios/${scenarioId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenarioResult)
    });

    const data = await response.json();

    if (data.success) {
      this.displayFeedback(data.feedback);
    }

    return data;
  }

  /**
   * Display AI tutor feedback to user
   */
  displayFeedback(feedback) {
    // Show score
    console.log(`Score: ${feedback.score}`);

    // Show explanations for wrong answers
    if (feedback.explanations.length > 0) {
      console.log('\n=== AI TUTOR EXPLAINS YOUR MISTAKES ===\n');
      feedback.explanations.forEach((explanation, i) => {
        console.log(`Question ${i + 1}:`);
        console.log(`- Why wrong: ${explanation.whyWrong}`);
        console.log(`- Principle: ${explanation.principleViolated.principle}`);
        console.log(`- Real-world: ${explanation.realWorldContext.description}`);
        console.log(`- Key takeaway: ${explanation.keyTakeaway.lesson}\n`);
      });
    }

    // Show behavioral insights
    if (feedback.behavioralInsights) {
      console.log('=== BEHAVIORAL INSIGHTS ===');
      console.log(`Decision speed: ${feedback.behavioralInsights.decisionVelocity.classification}`);
      console.log(`Behavioral pattern: ${feedback.behavioralInsights.behavioralProfile.summary.reliability}`);
      if (feedback.behavioralInsights.riskIdentified.length > 0) {
        console.log('Risks identified:', feedback.behavioralInsights.riskIdentified);
      }
    }

    // Show motivational message
    console.log('\n=== MOTIVATION ===');
    console.log(feedback.tutorFeedback.motivationalMessage.message);
  }

  /**
   * Get dashboard (call on dashboard page load)
   */
  async getDashboard(userId) {
    const response = await fetch(`${this.apiBaseUrl}/dashboard?userId=${userId}`);
    return response.json();
  }

  /**
   * Get learning report (call when user requests full analysis)
   */
  async getLearningReport(userId) {
    const response = await fetch(`${this.apiBaseUrl}/learning-report?userId=${userId}`);
    return response.json();
  }

  /**
   * Get cohort analytics (ADMIN ONLY)
   */
  async getCohortAnalytics(cohortUserIds) {
    const ids = cohortUserIds.join(',');
    const response = await fetch(`${this.adminBaseUrl}/cohort-analytics?cohortIds=${ids}`);
    return response.json();
  }
}

// Usage in HTML pages:
/*
// In training.html when "Start Scenario" is clicked:
const trainingClient = new TrainingClient();
const scenario = await trainingClient.getNextScenario(userId);
displayScenario(scenario);

// When user submits answers:
const feedback = await trainingClient.submitScenarioAttempt(userId, scenarioId, userResponses);
showAdaptiveFeedback(feedback);

// On dashboard page:
const dashboard = await trainingClient.getDashboard(userId);
renderDashboard(dashboard);
*/

// ============================================================================
// PART 3: DATA COLLECTION HELPERS
// ============================================================================

/**
 * Place in: js/trainingMetrics.js
 * Collect behavioral metrics during scenario execution
 */

class TrainingMetricsCollector {
  constructor() {
    this.startTime = null;
    this.decisions = [];
    this.warnings = { presented: 0, acknowledged: 0, heeded: 0 };
    this.verifications = 0;
    this.incorrectAnswers = [];
    this.questions = [];
  }

  startTracking() {
    this.startTime = Date.now();
  }

  recordDecision(questionIndex, answer, timeToDecide) {
    this.decisions.push({
      questionIndex,
      answer,
      timeMs: timeToDecide,
      timestamp: new Date()
    });
  }

  recordWarning(acknowledged, heeded = false) {
    this.warnings.presented += 1;
    if (acknowledged) this.warnings.acknowledged += 1;
    if (heeded) this.warnings.heeded += 1;
  }

  recordVerification() {
    this.verifications += 1;
  }

  recordIncorrectAnswer(questionIndex, userAnswer, correctAnswer) {
    this.incorrectAnswers.push({
      questionIndex,
      userAnswer,
      correctAnswer
    });
  }

  storeQuestion(index, question) {
    this.questions.push({
      index,
      text: question.text,
      type: question.type,
      options: question.options
    });
  }

  getMetrics() {
    const totalTime = Date.now() - this.startTime;
    const totalQuestions = this.questions.length;
    const score = Math.round(((totalQuestions - this.incorrectAnswers.length) / totalQuestions) * 100);

    return {
      score,
      decisionTimeMs: totalTime,
      warningsPresented: this.warnings.presented,
      warningsAcknowledged: this.warnings.acknowledged,
      verificationsPerformed: this.verifications,
      incorrectAnswers: this.incorrectAnswers,
      decisions: this.decisions,
      questions: this.questions
    };
  }
}

// ============================================================================
// PART 4: REAL SCENARIO EXAMPLE
// ============================================================================

/**
 * Complete example of a scenario execution lifecycle
 */

/*
// Example: User starts phishing detection scenario

// 1. Frontend requests next scenario
const scenario = await trainingClient.getNextScenario(userId);
// Returns: Phishing Email Detection scenario with adaptive metadata

// 2. Frontend displays scenario with metrics tracking
const metricsCollector = new TrainingMetricsCollector();
metricsCollector.startTracking();

// Questions displayed to user:
const question1 = {
  text: "An email arrives claiming to be from IT Support asking to 'verify your account'. What's your response?",
  type: "phishing",
  options: [
    "Click the link to verify immediately",
    "Reply with your password",
    "Call IT directly using the number from the company directory",
    "Forward to security team"
  ]
};

// 3. User takes time to read, sees a subtle warning indicator
metricsCollector.recordWarning(true); // User saw the warning
metricsCollector.recordVerification(); // User verified the sender

// 4. User makes decision after thinking
const userAnswer = "Call IT directly using the number from the company directory";
const timeToDecide = 8500; // 8.5 seconds
metricsCollector.recordDecision(0, userAnswer, timeToDecide);
metricsCollector.storeQuestion(0, question1);

// ... more questions ...

// 5. User completes scenario and we collect metrics
const metrics = metricsCollector.getMetrics();
// {
//   score: 85,
//   decisionTimeMs: 45000,
//   warningsPresented: 3,
//   warningsAcknowledged: 3,
//   verificationsPerformed: 2,
//   ...
// }

// 6. Submit to backend for intelligent analysis
const feedback = await trainingClient.submitScenarioAttempt(userId, scenario.id, metrics);
// Backend processes through:
// - AdaptiveScenarioEngine (prepares next scenario)
// - RiskProfileService (updates learner profile)
// - ExplainableAITutor (generates explanations)
// - BehavioralSecurityAnalyzer (analyzes metrics)
// - Reports back with comprehensive feedback

// 7. Frontend displays feedback
// "Great job recognizing the phishing indicator!
//  You followed the Zero Trust principle: Never trust, always verify.
//  Your deliberate decision-making is a strength.
//  Next, let's work on privilege escalation scenarios."

// 8. Backend has now updated the user's profile:
// - Knowledge: 62 → 65
// - Persona: "Careful Defender" (high warning acknowledgment + verification)
// - Skill memory: phishing-detection confidence 72 → 78
// - Recommended next: privilege-escalation scenario
*/

// ============================================================================
// PART 5: MIGRATION CHECKLIST
// ============================================================================

/**
 * Steps to fully integrate intelligent training into your backend:
 * 
 * DATABASE INTEGRATION:
 * ☐ Replace in-memory Map storage with MongoDB collections
 * ☐ Create User model with riskProfile, skillMemory, scenarioHistory
 * ☐ Create Scenario model with adaptiveMetadata
 * ☐ Create Progress model for detailed attempt logging
 * ☐ Implement database connection in CoreTrainingEngine
 * 
 * API ROUTES:
 * ☐ Copy router.post/get code above into backend/routes/training.js
 * ☐ Import CoreTrainingEngine in server.js
 * ☐ Mount training routes: app.use(require('./routes/training'))
 * ☐ Test all endpoints with Postman or similar
 * 
 * FRONTEND INTEGRATION:
 * ☐ Create js/trainingClient.js with TrainingClient class
 * ☐ Create js/trainingMetrics.js with MetricsCollector class
 * ☐ Update training.html to use adaptive scenario API
 * ☐ Update dashboard.html to use dashboard API
 * ☐ Create profile.html for learning report display
 * 
 * ADMIN DASHBOARD:
 * ☐ Create admin/cohort.html for institutional analytics
 * ☐ Implement charts using Chart.js for skill heatmaps
 * ☐ Display cohort recommendations and risk summary
 * 
 * DEPLOYMENT:
 * ☐ Test end-to-end (register → complete scenario → see adaptive feedback)
 * ☐ Verify database persistence
 * ☐ Test cohort analytics with sample data
 * ☐ Performance test with 100+ concurrent users
 * 
 * POST-LAUNCH:
 * ☐ Monitor error logs for metrics collection issues
 * ☐ Verify adaptive engine making good recommendations
 * ☐ Gather feedback on explanation quality
 * ☐ Iterate on scenario selection algorithm based on user data
 */

module.exports = { TrainingClient, TrainingMetricsCollector };
