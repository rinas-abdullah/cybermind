# CyberMind AI Mentor Integration Guide

## Overview

The AI Mentor is an adaptive cybersecurity tutor integrated into the CyberMind training platform. It provides personalized guidance based on the user's skill level, using the **Feynman Technique** (hints, not direct answers) to encourage critical thinking.

## Architecture

### Frontend Components
- **training.html**: Contains the AI Mentor modal with chat interface
- **modernNavBar.js**: Provides navbar context across all pages
- **auth.js**: Manages authentication tokens and user sessions

### Backend Components
- **aiMentorEngine.js**: Core AI service that generates contextual responses
- **aiLogs.js**: In-memory database for logging conversations
- **api.js** (`/api/ai/mentor` route): Main API endpoint

### Database
- **ai_logs**: Stores all mentoring interactions (in-memory for now)

## How It Works

### 1. User Asks a Question

When a user opens the AI Mentor modal and asks a question:

```javascript
// training.html sends:
{
  question: "What is SQL injection?",
  context: "training-page",
  username: "demo"
}
```

### 2. Backend Fetches User Level

The `/api/ai/mentor` endpoint:

```javascript
// api.js
const user = findUser(username);
const userLevel = user.level || 1;  // Gets user's current level from data/users.js
```

**User Levels:**
- **Level 1-2**: Beginner (basic concepts, simple examples)
- **Level 3-5**: Intermediate (advanced techniques, bypass methods)
- **Level 6-8**: Advanced (race conditions, exploits, architecture)

### 3. AI Generates a Personalized Response

The AIMentorEngine adapts its response based on difficulty:

```javascript
// services/aiMentorEngine.js
const mentorResponse = aiMentorEngine.generateResponse(
  question,    // "What is SQL injection?"
  userLevel,   // 3 (levels 3-5 = intermediate)
  context      // "training-page"
);

// Returns:
{
  explanation: "SQL Injection involves understanding database structure...",
  examples: [
    "UNION attacks to extract data",
    "Error-based SQLi using database errors",
    "Time-based blind SQLi: SELECT SLEEP(5) IF condition is true"
  ],
  prevention: [...], 
  hint: "🔎 **Hint:** In a blind SQLi scenario...",
  difficulty: "intermediate",
  topic: "sqlInjection"
}
```

### 4. Response is Logged

The interaction is saved to `ai_logs` for analytics:

```javascript
// data/aiLogs.js
const logEntry = logInteraction(
  userId,        // 2
  username,      // "demo"
  question,      // "What is SQL injection?"
  responseText,  // Markdown formatted response
  userLevel,     // 3
  context        // "training-page"
);

// Creates entry like:
{
  id: 1,
  userId: 2,
  username: "demo",
  question: "What is SQL injection?",
  response: "<!-- markdown formatted response -->",
  userLevel: 3,
  context: "training-page",
  timestamp: "2026-03-09T15:23:45.123Z"
}
```

### 5. Response is Displayed in Chat

The response is formatted with Markdown and displayed with:
- User level indicator
- Topic classification
- Examples
- Prevention tips
- Hints for continued learning

## Knowledge Base Structure

The AI Mentor has a curated knowledge base for four main topics:

### 1. **Phishing**
- **Beginner**: What is phishing? Common red flags
- **Intermediate**: Spear phishing, BEC, credential harvesting
- **Advanced**: AITM attacks, polymorphic emails, OAuth token theft

### 2. **SQL Injection**
- **Beginner**: Basic SQLi concepts, input validation
- **Intermediate**: UNION attacks, error-based, blind SQLi
- **Advanced**: Second-order injection, stacked queries, OS command execution

### 3. **Privilege Escalation**
- **Beginner**: SUID binaries, sudo misconfiguration
- **Intermediate**: Kernel exploits, PATH hijacking, capability attacks
- **Advanced**: Race conditions, container escapes, seccomp bypass

### 4. **Network Reconnaissance**
- **Beginner**: ping, nslookup, basic nmap scans
- **Intermediate**: OS fingerprinting, service version detection, Shodan
- **Advanced**: OSINT aggregation, traffic analysis, side-channel attacks

## API Endpoints

### 1. Send Question to AI Mentor

**POST** `/api/ai/mentor`

**Request:**
```json
{
  "question": "What is phishing?",
  "context": "training-page",
  "username": "demo"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What is phishing?",
    "explanation": "Phishing is a social engineering attack...",
    "examples": ["Fake bank emails...", "..."],
    "prevention": ["Check sender email...", "..."],
    "hint": "📌 **Hint:** Real banks never ask for passwords via email...",
    "topic": "phishing",
    "difficulty": "beginner",
    "userLevel": 1,
    "context": "training-page",
    "logId": 1,
    "timestamp": "2026-03-09T15:23:45.123Z"
  },
  "message": "AI mentor response generated for demo (Level 1)"
}
```

### 2. Get Conversation History

**GET** `/api/ai/mentor/history/:username`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 2,
      "username": "demo",
      "question": "What is phishing?",
      "response": "Phishing is a social engineering attack...",
      "userLevel": 1,
      "context": "training-page",
      "timestamp": "2026-03-09T15:23:45.123Z"
    },
    // ... more logs
  ]
}
```

## Frontend Implementation

### Updating the Chat Modal

When a user opens the AI Mentor:

```javascript
// 1. Modal header shows current user level
updateAIMentorHeader() => {
  // Fetches /api/auth/me
  // Updates: "Your current level: 3 | Responses tailored to your skill"
}

// 2. User sends question
sendQuestion() => {
  // Gets username from authService
  // Sends: { question, context, username }
  // Displays formatted response in chat
}

// 3. Response is formatted as Markdown
responseHTML = `
  📊 Response for Level 3 (intermediate) | Topic: sqlInjection
  
  SQL Injection involves understanding database structure...
  
  📝 Examples:
  - UNION attacks to extract data
  - Error-based SQLi using database errors
  
  ✅ Prevention & Best Practices:
  - Implement comprehensive input validation
  - Use database activity monitoring (DAM)
  
  🔎 **Hint:** In a blind SQLi scenario...
`
```

## Testing the Feature

### Test Case 1: Beginner User Question
```bash
curl -X POST http://localhost:3001/api/ai/mentor \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is phishing?",
    "username": "guest",
    "context": "training-page"
  }'
```

Expected: Beginner-level explanation with simple examples

### Test Case 2: Advanced User Question
```bash
# First, promote user to level 6
# Then send same question

curl -X POST http://localhost:3001/api/ai/mentor \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is phishing?",
    "username": "CyberFox",
    "context": "training-page"
  }'
```

Expected: Advanced-level explanation with sophisticated attack patterns

## Cyberpunk UI Integration

The AI Mentor modal features:
- **Neon-teal (#00ff88)** accent colors
- **Dark background** (#030810)
- **Smooth animations** on modal open/close
- **User avatar** (👤) and AI avatar (🤖)
- **Typing indicator** during response generation
- **Markdown formatted text** with headers, lists, hints

## Future Enhancements

### 1. OpenAI Integration
Replace mock responses with actual GPT-4 API:

```javascript
const response = await axios.post('https://api.openai.com/v1/chat/completions', {
  model: "gpt-4",
  messages: [
    { role: "system", content: "You are the CyberMind Mentor. Feynman Technique..." },
    { role: "user", content: question }
  ]
}, {
  headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
});
```

### 2. PostgreSQL Logging
Store ai_logs in a real database for analytics:

```sql
CREATE TABLE ai_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username VARCHAR(255),
  question TEXT NOT NULL,
  response TEXT,
  user_level INTEGER,
  context VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Adaptive Learning
Track which topics users struggle with and adjust response difficulty:

```javascript
// Analyze user's question patterns
// If user asks same topic multiple times, escalate difficulty
// If user gets answers wrong, decrease difficulty
```

### 4. Conversation Context
Maintain multi-turn conversation state:

```javascript
// Remember previous questions in conversation
// Build context: "Earlier you asked about SQL injection, 
// now let me explain UNION attacks..."
```

### 5. Real-time Feedback
Grade user's understanding and track progress:

```javascript
// After user's response to hints:
// "Great! You understood the concept. 
//  +50 XP awarded for learning this topic"
```

## Troubleshooting

### AI Mentor Modal Won't Open
- Check browser console for errors
- Verify `modernNavBar.js` is loaded
- Ensure auth token is valid

### Response Takes Too Long
- Current implementation uses local knowledge base (instant)
- If adding OpenAI, add timeout handling

### Responses Not Showing User Level
- Verify `/api/auth/me` endpoint returns user level
- Check localStorage for `userId` and `authToken`

### Logs Not Appearing
- Check `ai_logs.js` is imported in api.js
- Verify logInteraction() is called
- Add console.log() statements for debugging

## Code References

### Key Files
- `backend/services/aiMentorEngine.js` - AI response generation
- `backend/data/aiLogs.js` - Conversation logging
- `backend/routes/api.js` - `/api/ai/mentor` endpoint
- `frontend/pages/training.html` - Chat UI and integration

### Key Functions
- `aiMentorEngine.generateResponse(question, userLevel, context)`
- `aiMentorEngine.formatAsMarkdown(response)`
- `logInteraction(userId, username, question, response, userLevel, context)`
- `sendQuestion()` - Frontend handler

## Performance Metrics

- **Response Generation**: ~10-50ms (local knowledge base)
- **Database Logging**: ~5ms (in-memory)
- **Modal Open/Close**: ~200ms (smooth animation)
- **Chat Rendering**: <100ms per message

---

**CyberMind AI Mentor** • Powered by Feynman Technique • Level-Adaptive Responses • Cyberpunk UI
