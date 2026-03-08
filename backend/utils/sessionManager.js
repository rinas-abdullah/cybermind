// Session Management - User continuity and state persistence
// TODO: Replace with Redis/database sessions when upgrading
// Future implementation: Redis for session storage, JWT for auth tokens

const sessions = new Map(); // In production, this would be Redis

// Session structure:
// {
//   sessionId: "uuid",
//   username: "user",
//   createdAt: "timestamp",
//   lastActivity: "timestamp",
//   userAgent: "browser info",
//   ipAddress: "ip",
//   currentScenario: "scenario_id",
//   progressState: { ... },
//   preferences: { ... }
// }

function createSession(username, metadata = {}) {
  const sessionId = generateSessionId();
  const now = new Date().toISOString();

  const session = {
    sessionId,
    username,
    createdAt: now,
    lastActivity: now,
    userAgent: metadata.userAgent || 'unknown',
    ipAddress: metadata.ipAddress || 'unknown',
    currentScenario: null,
    progressState: {},
    preferences: {
      theme: 'dark',
      difficulty: 'adaptive',
      notifications: true
    },
    ...metadata
  };

  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function updateSession(sessionId, updates) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  Object.assign(session, updates, { lastActivity: new Date().toISOString() });
  return session;
}

function destroySession(sessionId) {
  return sessions.delete(sessionId);
}

function getUserSessions(username) {
  const userSessions = [];
  for (const [sessionId, session] of sessions) {
    if (session.username === username) {
      userSessions.push(session);
    }
  }
  return userSessions;
}

function cleanupExpiredSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
  const now = Date.now();
  const expired = [];

  for (const [sessionId, session] of sessions) {
    const lastActivity = new Date(session.lastActivity).getTime();
    if (now - lastActivity > maxAge) {
      expired.push(sessionId);
    }
  }

  expired.forEach(sessionId => sessions.delete(sessionId));
  return expired.length;
}

function saveSessionState(sessionId, scenarioId, state) {
  const session = sessions.get(sessionId);
  if (!session) return false;

  session.currentScenario = scenarioId;
  session.progressState = { ...session.progressState, [scenarioId]: state };
  session.lastActivity = new Date().toISOString();

  return true;
}

function getSessionState(sessionId, scenarioId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  return session.progressState[scenarioId] || null;
}

function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Session middleware for Express
function sessionMiddleware(req, res, next) {
  // Get session ID from cookie or header
  let sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

  if (!sessionId) {
    // Create anonymous session for continuity
    const session = createSession('anonymous', {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });
    sessionId = session.sessionId;

    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  req.sessionId = sessionId;
  req.session = getSession(sessionId);

  // Update last activity
  if (req.session) {
    updateSession(sessionId, {});
  }

  next();
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  destroySession,
  getUserSessions,
  cleanupExpiredSessions,
  saveSessionState,
  getSessionState,
  sessionMiddleware
};