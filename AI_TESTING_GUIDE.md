# CyberMind AI Features - Testing Guide

## Prerequisites
- Backend server running on `http://localhost:3001`
- Frontend accessible on `http://localhost:3000` (or use npm start)
- All services and dependencies installed

## Quick Start
```bash
# Terminal 1: Start backend server
cd backend
node server.js

# Terminal 2: Start frontend (if using npm)
npm start
```

---

## TEST 1: AI Learner Profile Creation

### Test Case: Initialize User Profile
```bash
curl -X POST http://localhost:3001/api/ai/initialize-user \
  -H "Content-Type: application/json" \
  -d '{"username":"guest"}'
```

### Expected Response
```json
{
  "success": true,
  "message": "User profile initialized for AI training",
  "data": {
    "profile": {
      "userId": 2,
      "username": "guest",
      "knowledgeLevel": 0,
      "riskPersona": "Unclassified",
      "successRate": 0,
      "skillMemory": [],
      "behavioralMetrics": {
        "decisionVelocity": 0,
        "warningAcknowledgment": 100,
        "verificationBehavior": 100,
        "pressurePerformance": 50,
        "consistencyScore": 50
      }
    }
  }
}
```

### ✅ Pass Criteria
- [x] Profile created with userId
- [x] Knowledge level initialized to 0
- [x] Risk persona set to "Unclassified"
- [x] Skill memory is empty array
- [x] Behavioral metrics initialized

---

## TEST 2: Adaptive Scenario Selection

### Test Case: Get Next Adaptive Scenario
```bash
curl -X GET http://localhost:3001/api/ai/next-scenario/guest
```

### Expected Response
```json
{
  "success": true,
  "message": "Next adaptive scenario selected",
  "data": {
    "id": "phishing-basic",
    "title": "Phishing Email Analysis",
    "description": "Analyze a suspicious email for phishing indicators",
    "difficulty": "beginner",
    "skillTags": ["phishing", "email-security"],
    "estimatedTime": 5,
    "adaptiveContext": {
      "whySelected": "First mission - Starting with cybersecurity fundamentals",
      "expectedLearning": "You'll strengthen your understanding of phishing, email-security",
      "estimatedDifficulty": "beginner",
      "suggestedApproach": "Think carefully about each decision."
    }
  }
}
```

### ✅ Pass Criteria
- [x] Returns a scenario object
- [x] Includes difficulty level
- [x] Has skill tags
- [x] Provides adaptive context/reasoning
- [x] Suggests appropriate difficulty

---

## TEST 3: Skill Memory & Scenario Processing

### Test Case: Process Scenario Attempt with AI Feedback
```bash
curl -X POST http://localhost:3001/api/ai/process-attempt \
  -H "Content-Type: application/json" \
  -d '{
    "username": "guest",
    "scenarioId": "phishing-basic",
    "score": 85,
    "timeSpent": 300,
    "incorrectAnswers": [],
    "behavioralData": {
      "decisionTimeMs": 4500,
      "skillsInvolved": ["phishing", "email-security"],
      "warningsPresented": 1,
      "warningsAcknowledged": 1,
      "verificationsPerformed": 2,
      "questionsAnswered": 5,
      "timeLimited": false,
      "decisions": ["marked-as-phishing", "reported-to-admin"]
    }
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Scenario attempt processed with AI feedback",
  "data": {
    "attemptId": "2-phishing-basic-1234567890",
    "score": 85,
    "passed": true,
    "tutorFeedback": {
      "wrongAnswers": 0,
      "keyTakeaways": [...],
      "motivationalMessage": {
        "message": "Great progress! You're 1 scenarios into your training.",
        "persona": "Your Unclassified approach is helping you learn effectively",
        "nextMilestone": "Keep going! Your next milestone is challenging..."
      }
    },
    "behavioralInsights": {
      "decisionVelocity": {
        "timeMs": 4500,
        "classification": "moderate",
        "appropriateness": true
      },
      "behavioralProfile": {...}
    }
  }
}
```

### ✅ Pass Criteria
- [x] Returns attempt ID and score
- [x] Includes tutor feedback
- [x] Provides motivational message
- [x] Analyzes behavioral patterns
- [x] Updates skill memory

---

## TEST 4: AI Tutor Explanations

### Test Case: Incorrect Answer Generates Explanation
When a user provides a wrong answer in a scenario:

```javascript
// In browser console or scenario completion
const response = await fetch('/api/ai/process-attempt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: "guest",
    scenarioId: "phishing-basic",
    score: 45,  // Lower score indicates wrong answers
    incorrectAnswers: ["clicked_suspicious_link"],
    ...
  })
});

const data = await response.json();
console.log(data.data.tutorFeedback.keyTakeaways);
```

### Expected Explanation Format
```
WRONG ANSWER DETECTED

❌ Incorrect: Clicking suspicious links
✅ Correct: Verify sender and analyze URL before clicking

⚠️ Security Principle: Zero Trust
Never trust emails without verification

Real-World Example:
Attackers impersonate internal IT support to steal credentials

Correct Approach:
1. Check sender domain carefully
2. Hover over links to see actual URL
3. Verify with IT before clicking
4. Report to security team

Prevention Tips:
- Enable email authentication (SPF, DKIM, DMARC)
- Use browser extensions to detect phishing
- Train employees regularly
```

### ✅ Pass Criteria
- [x] Identifies wrong answer
- [x] Explains security principle violated
- [x] Provides real-world example
- [x] Shows correct approach
- [x] Includes prevention tips

---

## TEST 5: Behavioral Security Analysis

### Test Case: Classify Behavioral Type
After a few scenario attempts, the system analyzes behavior:

```bash
curl -X GET http://localhost:3001/api/ai/learning-report/guest
```

### Expected Behavioral Classification
```json
{
  "data": {
    "behavioralAnalysis": {
      "decisionSpeed": "Thoughtful",
      "warningAwareness": "High",
      "thoroughness": "Thorough",
      "underPressure": "Stable",
      "reliability": "Variable",
      "realWorldReadiness": {
        "readinessScore": 1080,
        "readinessLevel": "Highly Ready",
        "summary": "Your behavioral patterns suggest readiness for real security scenarios",
        "nextFocus": "pressure-scenarios"
      }
    }
  }
}
```

### Expected Personas
- **Careful Defender**: Thorough, cautious, high verification (90+ verification behavior)
- **Fast but Risky**: Quick decisions, lower verification (high decision velocity)
- **Social Eng Sensitive**: Falls for social engineering tactics
- **Recon Specialist**: Gathers information before deciding
- **Incident Responder**: Fast, urgent-focused decisions

### ✅ Pass Criteria
- [x] Behavioral metrics calculated
- [x] Persona classified
- [x] Real-world readiness assessed
- [x] Recommendations provided based on behavior

---

## TEST 6: AI Cyber Mentor

### Test Case 1: Question via API
```bash
curl -X POST http://localhost:3001/api/ai/mentor \
  -H "Content-Type: application/json" \
  -d '{"question":"What is phishing?","context":"training-page"}'
```

### Expected Response
```json
{
  "success": true,
  "message": "AI mentor response generated",
  "data": {
    "question": "What is phishing?",
    "explanation": "Phishing is a cyber attack where attackers impersonate trustworthy entities...",
    "examples": [
      "Fake bank emails asking you to 'verify' your account",
      "Messages claiming you've won a prize",
      "Urgent requests to update payment information"
    ],
    "prevention": [
      "Never click links in unexpected emails",
      "Verify sender addresses carefully",
      "Use multi-factor authentication",
      "Report suspicious messages to IT/security"
    ]
  }
}
```

### Test Case 2: Chat Modal Interface
1. Navigate to Training page
2. Click "Ask AI" button (AI Mentor card)
3. Type question: "Explain SQL injection"
4. Press Enter or click Send
5. Verify AI response appears with explanation, examples, and prevention

### ✅ Pass Criteria
- [x] API returns relevant explanation
- [x] Examples provided for context
- [x] Prevention tips included
- [x] Modal UI updates with response
- [x] Typing indicator shows while loading
- [x] Quick questions work

---

## TEST 7: Smart Dashboard Data

### Test Case: Load Dashboard with AI Insights
```bash
curl -X GET http://localhost:3001/api/ai/dashboard/guest
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "profile": {
      "knowledgeLevel": 25,
      "riskPersona": "Careful Defender",
      "completedScenarios": 3
    },
    "stats": {
      "overallScore": 250,
      "scenariosCompleted": 3,
      "skillsMastered": 1,
      "skillsInProgress": 2,
      "skillsNeedingWork": 3
    },
    "skillMemory": [
      {
        "skillName": "phishing-detection",
        "failureCount": 2,
        "successCount": 3,
        "retentionConfidence": 65
      }
    ],
    "recommendations": {
      "nextScenario": "Focus on SQL injection",
      "focusAreas": ["sql-injection", "web-security"],
      "strengthAreas": ["phishing-detection"]
    }
  }
}
```

### Frontend Display Check
1. Log in and go to Dashboard
2. Verify AI Insights card shows:
   - [x] Knowledge Level (0-100 bar)
   - [x] Risk Persona label
   - [x] Scenarios Completed count
   - [x] Weakest Skill highlighted
3. Check recommendation card shows:
   - [x] Next recommended mission
   - [x] Why it's recommended
4. See focus areas with skill tags

### ✅ Pass Criteria
- [x] Dashboard loads AI data on page load
- [x] Knowledge level displays with progress bar
- [x] Risk persona shows correct classification
- [x] Recommendations are personalized
- [x] Skill memory shows actual data
- [x] UI blends with existing design

---

## TEST 8: Training Progression System

### Test Case: Knowledge Level Progression
```javascript
// Initial: Knowledge Level = 0 → Beginner

// After completing 3 phishing scenarios with >80% avg score:
// Knowledge Level increases to ~25

// After completing intermediate missions:
// Knowledge Level increases to 50+

// Expected unlock progression:
// KL 0-25:   Beginner missions only
// KL 26-50:  + Intermediate available
// KL 51-75:  + Advanced available
// KL 76-100: Expert missions available
```

### Verify in Frontend
1. Dashboard shows current level (L1, L2, etc.)
2. Training page shows available missions per level
3. Locked missions show "Unlock at Level X"
4. Completing scenarios shows progress toward next level

### ✅ Pass Criteria
- [x] Knowledge level increases with successful attempts
- [x] Difficulty automatically increases
- [x] Level progression shows on dashboard
- [x] Missions unlock based on knowledge level
- [x] Progress bar shows next milestone
- [x] Level displayed with visual indicator (L1-L10)

---

## FULL INTEGRATION TEST

### Test Scenario: Complete User Journey

1. **Day 1 - First Login**
   ```
   ✓ User logs in
   ✓ Profile initialized automatically
   ✓ Dashboard shows Knowledge Level: 0
   ✓ Training page recommends "Network Recon" (beginner)
   ✓ AI mentor available for questions
   ```

2. **Day 1 - Complete First Mission**
   ```
   ✓ User attempts phishing scenario
   ✓ Gets wrong answer explanation
   ✓ AI tutor explains Zero Trust principle
   ✓ Provides real-world examples
   ✓ Gives defensive approach
   ✓ Receives motivational feedback
   ```

3. **Day 1 - End**
   ```
   ✓ Dashboard updates with metrics
   ✓ Knowledge level: 15
   ✓ Risk persona: "Careful Defender"
   ✓ Shows phishing in weak skills
   ✓ Recommends SQL injection focus
   ✓ Shows "Moderately Ready" for real scenarios
   ```

4. **Day 2 - Continue Training**
   ```
   ✓ AI recommends SQL injection scenario (weakness reinforcement)
   ✓ Difficulty still beginner (KL < 25)
   ✓ Different behavioral feedback based on pattern
   ✓ Skill memory tracks improvement
   ```

5. **After 5+ Completed Missions**
   ```
   ✓ Knowledge Level reaches 26+
   ✓ Intermediate missions unlock
   ✓ Dashboard shows multiple skills tracked
   ✓ Persona classification becomes specific
   ✓ AI insights show clear patterns
   ```

### ✅ Integration Pass Criteria
- [x] All tests pass individually
- [x] User journey flows naturally
- [x] Data persists across sessions
- [x] Adaptive selection improves over time
- [x] UI remains unchanged and intuitive
- [x] No errors in console
- [x] Response times reasonable (<2s)

---

## TROUBLESHOOTING

### Issue: "User profile not found"
**Solution:** Make sure to call `PUT /api/ai/initialize-user` before calling other AI endpoints

### Issue: Adaptive scenario returns "undefined" fields
**Solution:** User may have empty skill memory. System should fall back to beginner scenarios

### Issue: AI mentor not responding
**Solution:** Check backend logs for errors. Verify `/api/ai/mentor` endpoint exists

### Issue: Dashboard doesn't show AI insights
**Solution:** 
1. Verify user is logged in (not "Guest")
2. Check browser console for fetch errors
3. Ensure backend is running

### Issue: Behavioral analysis shows wrong persona
**Solution:** More data needed. Complete 3+ scenarios for accurate classification

---

## API ENDPOINT REFERENCE

### All AI Endpoints

| Endpoint | Method | Purpose | Example |
|----------|--------|---------|---------|
| `/api/ai/initialize-user` | POST | Create learner profile | `{"username":"admin"}` |
| `/api/ai/next-scenario/:username` | GET | Get adaptive mission | `/api/ai/next-scenario/guest` |
| `/api/ai/process-attempt` | POST | Process scenario attempt | See Test 3 |
| `/api/ai/dashboard/:username` | GET | Load dashboard metrics | `/api/ai/dashboard/guest` |
| `/api/ai/mentor` | POST | Ask AI questions | `{"question":".."}` |
| `/api/ai/learning-report/:username` | GET | Generate learning report | `/api/ai/learning-report/guest` |

---

## Performance Expectations

- **Dashboard Load:** < 500ms
- **Scenario Selection:** < 300ms
- **AI Mentor Response:** < 2 seconds
- **Feedback Processing:** < 500ms
- **Dashboard Refresh:** < 1 second

---

## Test Results Template

Copy and fill out this template when testing:

```
CyberMind AI Features - Test Results
Date: _______________
Tester: ______________

AI Learner Profile: ☐ PASS ☐ FAIL
Adaptive Selection: ☐ PASS ☐ FAIL
Skill Memory: ☐ PASS ☐ FAIL
AI Tutor: ☐ PASS ☐ FAIL
Behavioral Analysis: ☐ PASS ☐ FAIL
AI Mentor: ☐ PASS ☐ FAIL
Dashboard: ☐ PASS ☐ FAIL
Progression: ☐ PASS ☐ FAIL
Integration: ☐ PASS ☐ FAIL

Overall: ☐ PASS ☐ FAIL

Notes:
_______________________________
_______________________________
```

---

## Contact & Issue Reporting

For issues or questions about AI features, check:
1. Browser console for JavaScript errors
2. Backend logs for server errors
3. Network tab for API failures
4. This testing guide for expected behavior

All AI features are designed to enhance learning without changing the UI design.
