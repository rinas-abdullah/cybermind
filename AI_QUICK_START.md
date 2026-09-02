# CyberMind AI Features - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Start the Server
```bash
cd cybermind
node backend/server.js
```

You should see:
```
[INFO] Server listening on port 3001
[INFO] Database: in-memory
```

### Step 2: Open the Application
Open browser and go to: `http://localhost:3000`

### Step 3: Log In
Use one of the test accounts:
- **Username:** admin
- **Username:** guest
- **Username:** CyberFox

(Default password is same as username or "demo")

---

## 📊 Feature Quick Access

### Feature 1: View Your AI Learner Profile
**Location:** Dashboard Page
1. Log in
2. Look for "AI Analysis" card
3. See your:
   - Knowledge Level (0-100)
   - Risk Persona
   - Scenarios Completed
   - Weakest Skill

### Feature 2: Get Adaptive Next Mission
**Location:** Training Page
1. Click "Training" in navbar
2. See "AI-selected next mission"
3. Difficulty adapts to your level
4. Click "Launch" to start

### Feature 3: Track Your Skills
**Location:** Dashboard → AI Analysis Card
- Displays which skills you're strongest in
- Shows skills needing work
- Tracks improvement over time

### Feature 4: Get AI Explanations
**During a Scenario:**
1. Answer a question incorrectly
2. Click "Show Explanation"
3. See:
   - Why answer was wrong
   - Real-world example
   - Prevention tips
   - Correct approach

### Feature 5: Understand Your Behavior
**Location:** Dashboard → AI Analysis Card
- **Decision Speed:** How quickly you decide
- **Warning Awareness:** How much you heed warnings
- **Thoroughness:** How carefully you check
- **Behavioral Type:** Your security persona

### Feature 6: Use AI Mentor
**Location:** Training Page → "Ask AI" Button
1. Click the AI Mentor card
2. Ask any cybersecurity question
3. Get instant explanation with examples
4. Or use quick question tags

**Example Questions:**
- "What is SQL injection?"
- "How do I detect phishing?"
- "Explain privilege escalation"
- "What is malware?"

### Feature 7: See Your Progress
**Location:** Dashboard
- Progress bar shows knowledge level
- Card shows recommended next mission
- Number of scenarios completed
- Your current level (L1-L10)

### Feature 8: Unlock Harder Levels
Keep completing missions:
- **Level 1-2:** Beginner missions (0-25 knowledge)
- **Level 3-4:** Intermediate missions (26-50 knowledge)
- **Level 5-7:** Advanced missions (51-75 knowledge)
- **Level 8-10:** Expert missions (76-100 knowledge)

---

## 💡 Using the AI Mentor Effectively

### Open the Mentor
1. Go to Training page
2. Click the **"Ask AI"** button on the AI Mentor card
3. Modal opens with chat interface

### Ask Questions
Type your question:
```
"What is the difference between HTTP and HTTPS?"
"How does two-factor authentication work?"
"What is a man-in-the-middle attack?"
```

### Using Quick Tags
Click any quick tag to auto-load a question:
- "What is phishing?" → Instant explanation
- "SQL injection" → Technical deep dive
- "Privilege escalation" → Attack walkthrough
- "What is malware?" → Types and examples

### Understanding Responses
Every mentor response includes:
1. **Explanation** - Clear definition
2. **Real-World Examples** - Actual attack scenarios
3. **Prevention Tips** - How to defend

---

## 📈 Understanding Your Dashboard

### Knowledge Level
```
Knowledge Level: 35/100

What it means:
0-25:   Just starting
26-50:  Building solid foundation
51-75:  Advanced learner
76-100: Expert level
```

### Risk Persona
```
"Careful Defender"

Characteristics:
✓ Thoughtful decision making
✓ High warning awareness
✓ Thorough verification
✓ Cautious but effective
```

### Focus Areas
Skills that need improvement:
```
1. SQL Injection (lowest score)
2. Network Scanning (moderate)
3. Malware Analysis (not started)
```

---

## 🎮 How the System Adapts

### Scenario Selection
The system learns from your performance:

**If you do well (85%+):**
- Next mission is harder
- Knowledge level increases
- New advanced missions unlock

**If you struggle (below 60%):**
- System recommends reviewing basics
- Next mission focuses on weak skills
- Similar difficulty with new context

**If you're new:**
- Start with easiest beginner scenario
- Builds confidence gradually
- Automatically detects your level

### Skill Memory
Every scenario completion:
1. ✅ Scores recorded
2. 📊 Skill performance updated
3. 🎯 Success/failure tracked
4. 🔄 Weak skills reinforced

**Example:**
After 3 phishing scenarios:
- You've seen phishing patterns
- System tracks your success rate
- If you struggle, recommends more phishing
- If you excel, moves you to harder variants

---

## 🏆 Gaming the System Doesn't Work

The AI learns your true abilities:
- **Can't fake intelligence** - Multiple assessment methods
- **Can't skip hard topics** - They reinforcement loop back
- **Can't rush through** - Time spent analyzed
- **Real learning required** - That's the whole point!

---

## 📝 Example User Journey

### Day 1: First Login

```
1. Log in → Dashboard loads
   - Knowledge Level: 0
   - Risk Persona: "Unclassified"
   - Scenarios: 0/5

2. Ask AI Mentor
   - Question: "What is phishing?"
   - Get instant explanation with real examples

3. Start Training
   - System recommends "Phishing Email Analysis" (beginner)
   - Complete scenario: 80% score
   - Knowledge Level: → 20

4. Check Dashboard
   - Updated with new metrics
   - Shows "Phishing Detection" skill tracked
   - Recommends next mission
```

### Day 2: Building Skills

```
1. Dashboard shows
   - Knowledge Level: 20
   - Last mission: Phishing (80%)
   - Recommendation: Network Scanning

2. Complete 2 More Missions
   - Network Scanning: 75%
   - Privilege Escalation: 60%
   - Knowledge Level increases

3. AI Mentor Help
   - Ask about privilege escalation (weak area)
   - Get detailed explanation
   - Return to practice that skill

4. End of Day
   - Knowledge Level: 35
   - New mission unlocks
   - Getting closer to Intermediate level
```

### After 1 Week

```
Current Status:
- Knowledge Level: 52 (Intermediate!)
- Level 3 Unlocked: Advanced missions available
- 7 Scenarios Completed
- Risk Persona: "Fast But Risky"
   → System notes: Accept reasonable risks, but verify before actions

Behavioral Insights:
- Decision Time: 3.2 seconds (balanced)
- Warning Awareness: 92% (excellent)
- Thoroughness: 78% (good)

Real-World Readiness: 75/100 (Ready for many real scenarios)

Next Focus: Improve at malware analysis (lowest skill)
```

---

## ⚙️ Settings & Customization

### No Explicit Settings Needed
The AI system works automatically:
- Auto-learns your pace
- Auto-adjusts difficulty
- Auto-selects missions
- Auto-analyzes behavior

### To Reset Your Profile
Contact admin - profiles can be reset if needed.

### To Change Username
Currently not supported (in-memory mode).

---

## 🐛 Troubleshooting

### "User not found" Error
**Solution:** Use one of the existing test accounts:
- admin
- guest
- CyberFox
- NetRunner

### "Adaptive scenario failed"
**Solution:** Refresh the page, then try again

### Dashboard not showing AI data
**Solution:** 
1. Log in (not as Guest)
2. Wait 1 second for data to load
3. Refresh if needed

### AI Mentor not responding
**Solution:**
1. Check internet connection
2. Try asking simpler question
3. Refresh the modal

### Knowledge level not increasing
**Solution:**
1. Complete more scenarios
2. Score 70%+ to increase level
3. Each scenario gives progress

---

## 🔗 API Information (For Developers)

### Quick API Test
```bash
# Check if server is running
curl http://localhost:3001/api/health

# Initialize user
curl -X POST http://localhost:3001/api/ai/initialize-user \
  -H "Content-Type: application/json" \
  -d '{"username":"guest"}'

# Get next scenario
curl http://localhost:3001/api/ai/next-scenario/guest

# Ask mentor
curl -X POST http://localhost:3001/api/ai/mentor \
  -H "Content-Type: application/json" \
  -d '{"question":"What is phishing?","context":"test"}'

# Get dashboard data
curl http://localhost:3001/api/ai/dashboard/guest
```

### All Endpoints
- `POST /api/ai/initialize-user` - Create profile
- `GET /api/ai/next-scenario/:username` - Get next mission
- `POST /api/ai/process-attempt` - Submit scenario attempt
- `GET /api/ai/dashboard/:username` - Get dashboard data
- `POST /api/ai/mentor` - Ask AI question
- `GET /api/ai/learning-report/:username` - Get full report

---

## 📚 Learning Tips

### Get Maximum Benefit

1. **Complete Scenarios Regularly**
   - One per day for steady progress
   - Builds skill memory
   - Unlocks harder content

2. **Read AI Explanations**
   - Don't skip the feedback
   - Real learning from mistakes
   - Internalize the principles

3. **Ask the Mentor Proactively**
   - Don't wait until stuck
   - Question new concepts
   - Deepen understanding

4. **Review Your Dashboard Weekly**
   - Track your progress
   - See which skills improved
   - Notice behavioral patterns

5. **Push to Harder Levels**
   - Don't stay in comfort zone
   - Aim for 80%+ on missions
   - Expert level is achievable

---

## 🎯 Success Metrics

### Track Your Progress
```
Week 1:     Knowledge 0→25   (Beginner)
Week 2:     Knowledge 25→35  (Learning)
Week 3:     Knowledge 35→50  (Building)
Week 4:     Knowledge 50→65  (Advanced)
Month 2:    Knowledge 65→85  (Expert candidate)
Month 3:    Knowledge 85→95  (Real-world ready)
```

### Skills to Master
- [ ] Phishing Detection
- [ ] SQL Injection
- [ ] Privilege Escalation
- [ ] Malware Analysis
- [ ] Network Security
- [ ] Incident Response

---

## 🤖 AI Mentor Topics

The AI Mentor can answer questions about:

**Attacks & Threats:**
- Phishing attacks
- SQL injection
- Cross-site scripting (XSS)
- Man-in-the-middle attacks
- Malware types
- Ransomware

**Defense:**
- Password security
- Multi-factor authentication
- Encryption
- Network security
- Firewall configuration
- Security auditing

**Concepts:**
- Zero Trust principle
- Defense in depth
- Attack surface
- Vulnerability management
- Incident response
- Security compliance

**Real-World:**
- How attacks happen
- Real incident examples
- Best practices
- Industry standards
- Career paths in security

---

## 💬 Example Q&A Sessions

### Session 1: Learning Phishing Detection
```
User: "What is phishing?"
AI: [Comprehensive explanation with real examples]

User: "How do I detect a phishing email?"
AI: [Step-by-step detection techniques]

User: "What should I do if I receive one?"
AI: [Proper response procedures]
```

### Session 2: Deep Diving into SQL Injection
```
User: "What is SQL injection?"
AI: [Technical explanation]

User: "How does it work?"
AI: [Detailed attack demonstration]

User: "How do I prevent it?"
AI: [Defense mechanisms and best practices]
```

---

## 🎓 Next Steps

1. ✅ Log in to CyberMind
2. ✅ Complete your first scenario
3. ✅ Try the AI Mentor
4. ✅ Check your dashboard
5. ✅ Complete more scenarios
6. ✅ Track your progress
7. ✅ Reach Expert level!

---

## 📞 Getting Help

- **Feature Documentation:** See [AI_IMPLEMENTATION_STATUS.md](./AI_IMPLEMENTATION_STATUS.md)
- **Testing Guide:** See [AI_TESTING_GUIDE.md](./AI_TESTING_GUIDE.md)
- **Verification Report:** See [AI_VERIFICATION_REPORT.md](./AI_VERIFICATION_REPORT.md)
- **Backend Issues:** Check server logs
- **Frontend Issues:** Check browser console (F12)

---

## ✨ Enjoy Learning!

You're now using one of the most advanced cybersecurity training platforms with:
- AI-powered adaptive learning
- Personalized feedback
- Behavioral analysis
- Expert mentoring
- Progressive skill building

**Good luck on your cybersecurity journey!** 🛡️
