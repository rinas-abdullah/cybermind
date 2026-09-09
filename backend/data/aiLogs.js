const crypto = require("crypto");
const db = require("../db");

const MAX_LOGS = 5000;
const MAX_TEXT_LENGTH = 2000;

const aiLogs = [];

function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.trim();
}

function truncate(text) {
  if (!text) return "";
  return text.length > MAX_TEXT_LENGTH
    ? text.slice(0, MAX_TEXT_LENGTH)
    : text;
}

function safeText(text) {
  return truncate(normalizeText(text));
}

function generateId() {
  return crypto.randomUUID();
}

async function logInteraction(
  userId,
  username,
  question,
  response,
  userLevel,
  context = "general"
) {
  const entry = {
    id: generateId(),
    userId: userId ?? null,
    username: safeText(username),
    question: safeText(question),
    response: safeText(response),
    userLevel: userLevel ?? null,
    context: safeText(context),
    timestamp: new Date().toISOString(),
  };

  aiLogs.push(entry);

  if (aiLogs.length > MAX_LOGS) {
    aiLogs.shift();
  }

  if (db && typeof db.query === "function") {
    try {
      await db.query(
        `INSERT INTO ai_logs
          (id, user_id, username, question, response, user_level, context, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          entry.id,
          entry.userId,
          entry.username,
          entry.question,
          entry.response,
          entry.userLevel,
          entry.context,
          entry.timestamp,
        ]
      );
    } catch (error) {
      console.warn("[aiLogs] Database write failed:", error.message);
    }
  }

  return { ...entry };
}

function fromDbRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    question: row.question,
    response: row.response,
    userLevel: row.user_level,
    context: row.context,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
  };
}

// Reads history from PostgreSQL when available so it survives a restart
// (writes already went there — see logInteraction — but reads used to
// always hit the in-memory array only, silently discarding persisted
// history). Falls back to the in-memory array for in-memory mode, or if the
// DB read fails.
async function getUserLogs(userId) {
  if (db?.DB_TYPE === db?.DATABASE_TYPES?.POSTGRESQL) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM ai_logs WHERE user_id = $1 ORDER BY timestamp ASC`,
        [userId]
      );
      return rows.map(fromDbRow);
    } catch (error) {
      console.warn("[aiLogs] Database read failed, falling back to in-memory:", error.message);
    }
  }

  return aiLogs
    .filter((log) => String(log.userId) === String(userId))
    .map((log) => ({ ...log }));
}

function getLogsByContext(context) {
  return aiLogs
    .filter((log) => log.context === context)
    .map((log) => ({ ...log }));
}

function getAllLogs(limit = null) {
  const logs = [...aiLogs];

  if (Number.isInteger(limit) && limit > 0) {
    return logs.slice(-limit);
  }

  return logs;
}

function clearInMemoryLogs() {
  aiLogs.length = 0;
}

module.exports = {
  logInteraction,
  getUserLogs,
  getLogsByContext,
  getAllLogs,
  clearInMemoryLogs,
};