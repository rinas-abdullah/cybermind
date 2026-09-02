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

function getUserLogs(userId) {
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