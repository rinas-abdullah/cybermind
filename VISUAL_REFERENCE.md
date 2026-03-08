# CyberMind Platform: Visual Reference Guide

## 🎯 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CYBERMIND INTELLIGENT TRAINING PLATFORM                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CORE TRAINING ENGINE                            │   │
│  │           (Orchestrates all 6 systems into unified flow)            │   │
│  │                  File: coreTrainingEngine.js                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           ▲           ▲              ▲               ▲          ▲            │
│           │           │              │               │          │            │
│  ┌────────┴───┐  ┌────┴──────┐ ┌──────┴────┐ ┌────┴────┐ ┌──────┴──┐      │
│  │  Adaptive  │  │   Risk    │ │ Explai-   │ │Behavioral│ │Institu- │     │
│  │  Scenario  │  │  Profile  │ │nable AI   │ │ Security │ │ tional  │     │
│  │  Engine    │  │  Service  │ │ Tutor     │ │Analyzer  │ │ Analytics│    │
│  │            │  │           │ │           │ │          │ │         │     │
│  │ "Pick next │  │ "Track    │ │"Explain   │ │"Measure  │ │"Cohort  │     │
│  │ scenario"  │  │ learner   │ │ why       │ │decision  │ │ insights"│    │
│  │            │  │ knowledge,│ │ answers   │ │patterns" │ │         │     │
│  │ Selects by:│  │ skills,   │ │           │ │          │ │ Generates      │
│  │ - Skills   │  │ personas" │ │ Provides: │ │Identifies│ │ - Skill gaps   │
│  │ - Difficulty│ │          │ │ - Why     │ │ - Speed  │ │ - Common       │
│  │ - Progress │  │ Classifies:│ │  wrong  │ │ - Warnings│ │  mistakes      │
│  │           │  │ - Beginner│ │ - Principle│ │ - Pressure│ │ - Recommendations
│  │ Returns:   │  │ - Careful │ │  violated │ │- Consistency
│  │ - Scenario │  │ - Fast    │ │ - Attack │ │           │ │ Returns:       │
│  │ - Context  │  │ - Social  │ │  context │ │ Returns:  │ │ - Heatmaps     │
│  │ - Why sel. │  │ - Recon   │ │ - Advice │ │ - Profile │ │ - Reports      │
│  │ - Coaching │  │ - Responder│ │         │ │ - Persona │ │ - Trends       │
│  │           │  │           │ │Returns:  │ │           │ │ - Risks        │
│  │ File:      │  │ Updates:  │ │ - Feedback│ │ File:      │ │ File:          │
│  │ adaptive   │  │ - Knowledge│ │  object  │ │behavioral │ │institutional   │
│  │ Engine.js  │  │ - Skills  │ │ - Full   │ │Analyzer.js│ │Analysis.js     │
│  │ (180 L)    │  │ - Persona │ │  reason. │ │ (350 L)   │ │ (450 L)        │
│  │           │  │ (300 L)   │ │ (250 L)  │ │           │ │ (450 L)        │
│  └────────────┘  └───────────┘ └──────────┘ └────────────┘ └────────────┘  │
│                                                                               │
│                         ▼ Persistent Skill Memory ▼                         │
│                     (Part of Risk Profile Service)                          │
│            [skill-1] [skill-2] [skill-3] ... [skill-N]                     │
│         Per-skill success/failure tracking + retention                      │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          DATABASE LAYER                              │   │
│  │  Users | Scenarios | Progress | RiskProfiles | Analytics           │   │
│  │    (MongoDB or PostgreSQL)                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Journey Flow

```
START: User Registration
    │
    ▼
[1] CoreTrainingEngine.initializeUser()
    ├─ Creates RiskProfile(knowledgeLevel=0)
    ├─ Sets Persona = "Beginner"
    ├─ Initializes empty SkillMemory[]
    └─ Ready for training
    │
    ▼
LEARNER CLICKS "START TRAINING"
    │
    ▼
[2] CoreTrainingEngine.selectNextScenario()
    │
    ├─ AdaptiveEngine.identifySkillGaps()
    │  └─ "Phishing-detection: 30% skill"
    │
    ├─ AdaptiveEngine.getWeakestSkills()
    │  └─ Returns [phishing, privilege-escalation, etc]
    │
    ├─ AdaptiveEngine.calculateAppropriateDifficulty()
    │  └─ "Knowledge: 0-40 → difficulty: beginner"
    │
    ├─ AdaptiveEngine.rankAndSelect()
    │  └─ Selects best-fit scenario from candidates
    │
    └─ ExplainableAITutor.explainScenarioSelection()
       └─ "Why we picked this for you..."
    │
    ▼
SCENARIO DISPLAYED
[FRONTEND TRACKING STARTS]
    ├─ TrainingMetrics.startTracking()
    ├─ Record: decision time, warnings, verifications
    └─ Collect: decision log
    │
    ▼
LEARNER COMPLETES SCENARIO
    │ Decision velocity: 8.5 seconds
    │ Warnings acknowledged: 3/3
    │ Verifications performed: 2
    │ Score: 85/100
    │
    ▼
[3] CoreTrainingEngine.processScenarioAttempt()
    │   (This is the major orchestration)
    │
    ├─ BehavioralSecurityAnalyzer.analyzeDecisionVelocity()
    │  ├─ Classifies: "8.5s = thoughtful pace"
    │  ├─ Appropriate for beginner
    │  └─ Updates behavior profile
    │
    ├─ RiskProfileService.updateProfileAfterScenario()
    │  ├─ Recalculates knowledge: 0 → 52
    │  ├─ Updates behavioral metrics:
    │  │  ├─ decisionVelocity: 8500ms
    │  │  ├─ warningAcknowledgment: 100%
    │  │  ├─ verificationBehavior: 50%
    │  │  └─ pressurePerformance: 0.85
    │  ├─ Updates skill memory:
    │  │  ├─ phishing-detection:
    │  │  │  ├─ successCount: 1
    │  │  │  ├─ retentionConfidence: 62
    │  │  │  └─ lastPassed: now
    │  ├─ Reclassifies persona
    │  │  └─ "Careful Defender"
    │  └─ Predicts next weakness
    │
    ├─ ExplainableAITutor.explainWrongAnswer() - FOR EACH WRONG ANSWER
    │  ├─ Wrong answer #1 explanation:
    │  │  ├─ "Why wrong: Clicked suspicious link"
    │  │  ├─ "Principle: Zero Trust - never trust unsolicited"
    │  │  ├─ "Real-world: Phishing costs $1.7M average"
    │  │  ├─ "Defensive: Always verify through independent channel"
    │  │  └─ "Key takeaway: Phishing exploits urgency and authority"
    │  │
    │  └─ Wrong answer #2 explanation:
    │     └─ (similar structure)
    │
    ├─ BehavioralSecurityAnalyzer.generateBehavioralProfile()
    │  ├─ Summary: "Careful, thorough, excellent awareness"
    │  ├─ Strengths: ["Warning acknowledgment high", "Good verification"]
    │  ├─ Improvements: ["Pressure scenarios for confidence"]
    │  ├─ Readiness: "Mostly ready" (75/100)
    │  └─ Real-world: "Would catch most attacks"
    │
    └─ Prepare feedback object:
       ├─ Score: 85
       ├─ Explanations: [array of explanations]
       ├─ Behavioral insights
       ├─ Progress updates
       └─ Next actions
    │
    ▼
FEEDBACK DISPLAYED TO LEARNER
    ├─ "Score: 85/100 ✓"
    │
    ├─ "AI TUTOR EXPLAINS (2 incorrect):"
    │  ├─ "Q1: You selected 'Click link' but should 'Verify first'"
    │  │     "Reason: Zero Trust principle..."
    │  │     "Real-world: Attackers use urgency and authority..."
    │  │     "Better: Always verify independently"
    │  │
    │  └─ "Q2: Similar explanation..."
    │
    ├─ "YOUR PROGRESS:"
    │  ├─ "Knowledge: 0 → 52"
    │  ├─ "Phishing-detection: 30% → 62%"
    │  └─ "Persona: Beginner → Careful Defender"
    │
    ├─ "BEHAVIORAL INSIGHT:"
    │  └─ "Your deliberate approach and warning awareness are strengths!"
    │
    └─ "NEXT STEPS:"
       └─ "You're ready for: Privilege Escalation (intermediate)"
    │
    ▼
BACKEND PERSISTS
    ├─ User.knowledgeLevel: 0 → 52
    ├─ User.riskPersona: "Careful Defender"
    ├─ Skill.phishing-detection: success+=1, confidence=62
    ├─ Progress entry logged (for decision replay)
    └─ Ready for next session
    │
    ▼
[FOR INSTRUCTORS/INSTITUTIONS]
    │
    └─ InstitutionalAnalytics.generateCohortReport()
       ├─ Cohort size: 150 users
       ├─ Avg knowledge: 48
       ├─ Skill gaps identified:
       │  ├─ Phishing: 80% of cohort weak
       │  ├─ Privilege escalation: 70% weak
       │  └─ Social engineering: 75% weak
       ├─ Persona distribution:
       │  ├─ Fast but Risky: 65% (TOO HIGH - concerning)
       │  └─ Careful Defender: 20%
       ├─ Behavioral risks:
       │  └─ "Cohort ignores warnings - critical vulnerability"
       ├─ Recommendations:
       │  ├─ "Add 5 phishing scenarios (80% struggling)"
       │  ├─ "Add warning-focused training"
       │  └─ "Implement differentiated tracks"
       └─ Generated heatmap data for visualization
    │
    ▼
NEXT SESSION
    │
    └─ Process repeats with adaptive selection
       └─ "Based on progress, next is: Privilege Escalation"
          (AdaptiveEngine already picked it!)
```

---

## 📊 Service Dependency Diagram

```
                    ┌─────────────────────┐
                    │   FRONTEND/USER     │
                    │ (HTML pages + JS)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   EXPRESS SERVER    │
                    │  (API Routes)       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │ CoreTrainingEngine              │
                    │ (Single orchestrator point)     │
                    └────┬─────┬────┬────┬────────────┘
                         │     │    │    │
           ┌─────────────┬┘    │    │    │
           │             │     │    │    │
    ┌──────▼─────┐ ┌────┴──┐ ┌┴───┴──┐ │
    │ Adaptive   │ │ Risk  │ │ AI    │ │
    │ Scenario   │ │Profile│ │Tutor  │ │
    │ Engine     │ │Service│ └───────┘ │
    └────────────┘ └───┬───┘           │
                       │               │
              ┌────────▼──────┐        │
              │ Skill Memory  │        │
              │ (per skill    │        │
              │  tracking)    │        │
              └───────────────┘        │
                                       │
                ┌──────────────────────▼────┐
                │ Behavioral Analyzer        │
                │                           │
                └──────────────────────┬────┘
                                       │
                ┌──────────────────────▼────────────┐
                │ Institutional Analytics Engine    │
                │ (reads from all above services)   │
                └─────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   DATABASE          │
                    │  (MongoDB/PostgreSQL│
                    │   5 collections)    │
                    └─────────────────────┘
```

---

## 📈 Data Flow: One Complete Scenario

```
USER SUBMITS SCENARIO
     │
     ├─ userId: "user123"
     ├─ scenarioId: "phishing-01"
     ├─ score: 85
     ├─ decisionTimeMs: 8500
     ├─ warningsPresented: 3
     ├─ warningsAcknowledged: 3
     ├─ verificationsPerformed: 2
     ├─ skillsInvolved: ["email-security", "phishing-detection"]
     ├─ incorrectAnswers: [
     │   { questionIndex: 1, userAnswer: "Click link", correctAnswer: "Call IT" },
     │   { questionIndex: 3, userAnswer: "Reply with password", correctAnswer: "Never share" }
     │ ]
     └─ decisions: [ { q:1, a:"Click", t:3500 }, ... ]
            │
            ▼
    [CoreTrainingEngine.processScenarioAttempt()]
            │
     ┌──────┴──────┬──────────┬──────────┬──────────┐
     │             │          │          │          │
     ▼             ▼          ▼          ▼          ▼
    [BAnalyzer]  [RiskProf] [AITutor] [BAnalyzer][Analytics]
    Velocity:    Updates:   Explains: Profile:   [Prepares
    8.5s =       Knowl:0→52 Wrong#1  Persona:   next]
    Thoughtful   Skills:    "Why...", Careful
               +1 success  "Principle Defender
               Phishing    violated:
               30%→62%    Zero Trust"
                          
                          Wrong#2
                          "Similar..."
            │
            ▼
    CONSTRUCT FEEDBACK RESPONSE
    {
      score: 85,
      passed: true,
      explanations: [
        {
          summary: "You selected X, correct is Y",
          whyWrong: "...",
          principleViolated: { principle: "zero-trust", description: "..." },
          realWorldContext: { vector: "phishing", description: "..." },
          defensiveMindset: { strategies: [...] },
          keyTakeaway: { lesson: "..." }
        },
        ... (for wrong#2)
      ],
      tutorFeedback: {
        wrongAnswers: 2,
        keyTakeaways: [...],
        motivationalMessage: { message: "Great job..." }
      },
      behavioralInsights: {
        decisionVelocity: { classification: "thoughtful", ... },
        behavioralProfile: { summary: {...}, strengths: [...], ... },
        riskIdentified: [...]
      },
      userProgressUpdate: {
        newKnowledgeLevel: 52,
        newPersona: "Careful Defender",
        skillsImproved: ["phishing-detection"],
        skillsNeedingWork: []
      },
      nextActions: {
        nextScenario: "Privilege Escalation scenario recommendations...",
        focusArea: "privilege-escalation",
        readyForAdvanced: false
      }
    }
            │
            ▼
    [SEND TO FRONTEND]
    [PERSIST TO DATABASE]
    ✓ Scenario attempt logged
    ✓ User profile updated
    ✓ Skill memory updated
    ✓ Behavioral metrics stored
    ✓ Decision history saved
```

---

## 🎓 The 5 Behavioral Personas

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BEHAVIORAL PERSONAS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1️⃣  CAREFUL DEFENDER                                              │
│     ├─ High warning acknowledgment (>70%)                           │
│     ├─ High verification behavior (>60%)                            │
│     └─ Coaching: "Your thoroughness is your strength"              │
│                                                                       │
│  2️⃣  FAST BUT RISKY                                               │
│     ├─ Low decision time (<3s)                                      │
│     ├─ Low warning acknowledgment (<50%)                            │
│     └─ Coaching: "Slow down slightly; quality over speed"          │
│                                                                       │
│  3️⃣  SOCIAL ENGINEERING SENSITIVE                                 │
│     ├─ High warning acknowledgment (>60%)                           │
│     ├─ High consistency score (>0.7)                                │
│     └─ Coaching: "Vulnerable to social engineering; verify always" │
│                                                                       │
│  4️⃣  RECON SPECIALIST                                             │
│     ├─ Low decision time (<3s)                                      │
│     ├─ High verification behavior (>60%)                            │
│     └─ Coaching: "Great speed and verification; scale this up"    │
│                                                                       │
│  5️⃣  INCIDENT RESPONDER                                           │
│     ├─ High pressure performance (>0.7)                             │
│     ├─ High consistency score                                       │
│     └─ Coaching: "You excel under pressure; ready for real-world"  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoint Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                  21 API ENDPOINTS (DESIGNED)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AUTHENTICATION (4)                                              │
│  ├─ POST /api/auth/register ...................... New user     │
│  ├─ POST /api/auth/login .......................... Login        │
│  ├─ POST /api/auth/logout ......................... Logout       │
│  └─ GET /api/auth/me ............................. Current user │
│                                                                   │
│  USERS (4)                                                       │
│  ├─ GET /api/users/profile ...................... User profile  │
│  ├─ GET /api/users/stats ......................... Stats        │
│  ├─ GET /api/users/risk-profile ................. Risk data    │
│  └─ GET /api/users/history ...................... Scenario hist │
│                                                                   │
│  SCENARIOS (4)                                                   │
│  ├─ GET /api/scenarios ....................... List scenarios  │
│  ├─ GET /api/scenarios/:id ................... Get one         │
│  ├─ POST /api/scenarios/:id/submit ........... Complete       │
│  └─ GET /api/scenarios/adaptive/next ........ Next (adaptive) │
│                                                                   │
│  ANALYTICS (4)                                                   │
│  ├─ GET /api/analytics/dashboard ............ User dashboard  │
│  ├─ GET /api/analytics/progress ............ User progress   │
│  ├─ GET /api/analytics/skills ............. Skill memory    │
│  └─ GET /api/analytics/behavior .......... Behavioral data  │
│                                                                   │
│  ADMIN (3)                                                       │
│  ├─ GET /api/admin/users ................... All users (admin) │
│  ├─ GET /api/admin/analytics ............. Cohort analytics   │
│  └─ POST /api/admin/scenarios/update ..... Manage scenarios   │
│                                                                   │
│  PLATFORM (2)                                                    │
│  ├─ GET /api/health ........................ Health check      │
│  └─ GET /api/info .......................... Platform info     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Dashboard Metrics

```
┌──────────────────────────────────────┐
│  USER DASHBOARD                      │
├──────────────────────────────────────┤
│                                       │
│  Knowledge Level: 52/100 ▓▓▓░░░░░░░  │
│  (Updated per scenario)              │
│                                       │
│  Completed Scenarios: 8/50            │
│                                       │
│  SKILL BREAKDOWN:                    │
│  ├─ Phishing-detection: 62% (master) │
│  ├─ Privilege-escalation: 35% (devel)│
│  ├─ Social-engineering: 28% (needs)  │
│  └─ Network-recon: 71% (master)      │
│                                       │
│  BEHAVIORAL PERSONA:                 │
│  Careful Defender                    │
│  ├─ Decision Speed: 8.5s (thoughtful)│
│  ├─ Warning Awareness: 95% (excellent)│
│  ├─ Verification Rate: 65% (good)    │
│  └─ Pressure Response: 0.78 (stable) │
│                                       │
│  NEXT FOCUS:                         │
│  Privilege Escalation (intermediate) │
│  Why: Your weakest skill gap         │
│                                       │
│  STRENGTHS:                          │
│  ✓ Warning acknowledgment            │
│  ✓ Thorough verification             │
│  ✓ Consistent decisions              │
│                                       │
│  AREAS TO IMPROVE:                   │
│  ✗ Privilege escalation (28% left)   │
│  ✗ Speed (may be over-thinking)      │
│                                       │
└──────────────────────────────────────┘
```

---

## 🏫 Institutional Analytics Dashboard

```
┌─────────────────────────────────────────────────────┐
│  COHORT ANALYTICS DASHBOARD (Admin View)            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  COHORT OVERVIEW:                                  │
│  ├─ Total Users: 150                               │
│  ├─ Avg Knowledge Level: 48                        │
│  ├─ Completed Scenarios: 1,200 (avg: 8 per user)  │
│  └─ Training Effectiveness: ↑ 12% (week-over-week)│
│                                                      │
│  SKILL GAP HEATMAP:                               │
│  ┌─────────────────────────────────────────────┐  │
│  │ Skill              | Beginner | Inter | Adv │  │
│  ├─────────────────────┼──────────┼───────┼────┤  │
│  │ Phishing Detection  │    █████ │ ██    │    │  │
│  │ Privilege Escal.    │   ██████ │ █     │    │  │
│  │ Social Eng.         │  ███████ │       │    │  │
│  │ Network Recon       │    █████ │ ███   │ ██ │  │
│  │ Incident Response   │   ██████ │ ██    │    │  │
│  └─────────────────────┴──────────┴───────┴────┘  │
│  (Red = Many struggling, Green = Most mastered)   │
│                                                      │
│  COMMON MISTAKES:                                  │
│  │ 1. Clicking phishing links (80% make error)   │
│  │ 2. Ignoring security warnings (75%)           │
│  │ 3. Not verifying sender (68%)                 │
│  │ 4. Over-trusting authority (60%)              │
│                                                      │
│  PERSONA DISTRIBUTION:                            │
│  ├─ Fast but Risky: 65% ⚠️ (CONCERN)             │
│  ├─ Careful Defender: 20% ✓                       │
│  ├─ Incident Responder: 10% ✓                     │
│  ├─ Social Eng Sensitive: 3%                      │
│  └─ Recon Specialist: 2%                          │
│                                                      │
│  RECOMMENDATIONS:                                  │
│  │ ⚠️  Add 5 MORE phishing scenarios             │
│  │     (80% of cohort struggling)                │
│  │                                                │
│  │ ⚠️  Warning-focused training needed           │
│  │     (75% ignore warnings - critical!)         │
│  │                                                │
│  │ ⚠️  Too many "Fast but Risky" users           │
│  │     (Should be <30%, now 65%)                 │
│  │     → Slow them down with timed scenarios    │
│  │                                                │
│  │ ✓   Network recon skills strong              │
│  │     → Advance to advanced recon scenarios    │
│                                                      │
│  PROGRESS TREND:                                   │
│  Week 1: Avg 42.1 ↗                              │
│  Week 2: Avg 45.3 ↗                              │
│  Week 3: Avg 48.7 ↗ (excellent improvement!)   │
│                                                      │
│  COHORT RISKS:                                     │
│  ⚠️  Low warning acknowledgment: HIGH RISK        │
│  ⚠️  Performance variance (20-80): Address gaps   │
│  ✓   Improving trend is positive                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Skill Memory Lifecycle

```
SKILL: Phishing Detection
│
├─ INITIAL STATE (never attempted)
│  ├─ successCount: 0
│  ├─ failureCount: 0
│  └─ retentionConfidence: 0
│
├─ FIRST ATTEMPT (incorrect)
│  ├─ failureCount: 1
│  └─ retentionConfidence: 0 (penalty -15 cap)
│
│  🔄 ADAPTIVE ENGINE: "Reintroduce soon"
│
├─ SECOND SESSION (still weak)
│  ├─ Scenario: Phishing-Detection (beginner)
│  ├─ Result: Correct ✓
│  ├─ Updates:
│  │  ├─ successCount: 1
│  │  ├─ retentionConfidence: 5 (reward +5)
│  │  └─ lastPassed: now
│
├─ THIRD SESSION (improving)
│  ├─ Scenario: Phishing-Detection (intermediate)
│  ├─ Result: Correct ✓
│  ├─ Updates:
│  │  ├─ successCount: 2
│  │  ├─ retentionConfidence: 30
│  │  └─ lastPassed: now
│
├─ FOURTH SESSION (mastery approach)
│  ├─ Scenario: Phishing-Detection (advanced)
│  ├─ Result: Correct ✓
│  ├─ Updates:
│  │  ├─ successCount: 3
│  │  ├─ retentionConfidence: 72 (mastery)
│  │  ├─ lastPassed: now
│  │  └─ reintroductionCount: 0 (mastered)
│
├─ MAINTENANCE (long-term)
│  └─ Reintroduced every 2 weeks (adaptive schedule)
│     to maintain retention above 70%
│
└─ Retention stays healthy through:
   ├─ Periodic reinforcement
   ├─ Progressive difficulty
   └─ Adaptive reintroduction schedule
```

---

## 📋 Implementation Checklist

```
┌──────────────────────────────────────────────────────┐
│ IMPLEMENTATION PHASE CHECKLIST                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│ PHASE 1: DATABASE SETUP (1-2 hours)                 │
│ ☐ Install MongoDB or PostgreSQL                     │
│ ☐ Create 5 collections/tables                       │
│ ☐ Seed sample scenario data                         │
│ ☐ Verify connection works                           │
│                                                       │
│ PHASE 2: BACKEND INTEGRATION (3-4 hours)            │
│ ☐ Create backend/routes/training.js                 │
│ ☐ Copy 4 routes from INTEGRATION_GUIDE.md           │
│ ☐ Wire CoreTrainingEngine in routes                 │
│ ☐ Mount routes in server.js                         │
│ ☐ Test all 4 routes with Postman                    │
│                                                       │
│ PHASE 3: FRONTEND CLIENT (2-3 hours)                │
│ ☐ Create js/trainingClient.js                       │
│ ☐ Create js/trainingMetrics.js                      │
│ ☐ Copy code from INTEGRATION_GUIDE.md               │
│ ☐ Test client functions                             │
│                                                       │
│ PHASE 4: PAGE INTEGRATION (2-3 hours)               │
│ ☐ Connect dashboard.html to API                     │
│ ☐ Connect training.html to adaptive API             │
│ ☐ Update navigation links                           │
│ ☐ Test page transitions                             │
│                                                       │
│ PHASE 5: TESTING (2-3 hours)                        │
│ ☐ Register new user                                 │
│ ☐ Start scenario (receives adaptive selection)      │
│ ☐ Complete scenario                                 │
│ ☐ See explanations in feedback                      │
│ ☐ Check dashboard for updates                       │
│ ☐ Verify profile persistence                        │
│                                                       │
│ PHASE 6: PRODUCTION PREP (2 hours)                  │
│ ☐ Add user authentication (JWT)                     │
│ ☐ Set environment variables                         │
│ ☐ Deploy database                                   │
│ ☐ Configure secrets                                 │
│ ☐ Set up monitoring/logging                         │
│                                                       │
│ TOTAL TIME: 12-17 hours for full production system  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference: What Each System Does

| System | Input | Process | Output |
|--------|-------|---------|--------|
| **Adaptive Engine** | User profile, skills, scenarios | Analyze gaps, rank scenarios | Next scenario + context |
| **Risk Profile** | Scenario scores, metrics | Weight + aggregate data | Knowledge level, persona |
| **AI Tutor** | Wrong answers, questions | Explain violations | Feedback object |
| **Behavior Analyzer** | Decision time, warnings, etc | Analyze patterns | Persona, readiness |
| **Skill Memory** | Success/failure, timestamp | Track + reintroduce | Retention scores |
| **Institutional Analytics** | All user data | Cohort analysis | Gap heatmap, recommendations |

---

This visual guide complements the detailed documentation. Use it to:
- ✅ Understand system architecture at a glance
- ✅ See how data flows through the platform
- ✅ Track implementation progress
- ✅ Understand user journeys
- ✅ Reference API endpoints and personas
