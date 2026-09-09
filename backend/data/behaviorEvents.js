const db = require("../db");

const MAX_EVENTS = 5000;
const MAX_LAB_ID_LENGTH = 100;
const MAX_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours — generous ceiling for a single lab attempt
const MAX_COUNT = 1000;

const behaviorEvents = [];

function clampInt(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function sanitizeLabId(labId) {
  return String(labId ?? "").trim().slice(0, MAX_LAB_ID_LENGTH);
}

function sanitizeEvent(rawEvent = {}) {
  return {
    labId: sanitizeLabId(rawEvent.labId),
    durationMs: clampInt(rawEvent.durationMs, 0, MAX_DURATION_MS, 0),
    hintsUsed: clampInt(rawEvent.hintsUsed, 0, MAX_COUNT, 0),
    wrongAttempts: clampInt(rawEvent.wrongAttempts, 0, MAX_COUNT, 0),
    commandCount: clampInt(rawEvent.commandCount, 0, MAX_COUNT, 0),
    uniqueCommandCount: clampInt(rawEvent.uniqueCommandCount, 0, MAX_COUNT, 0),
  };
}

async function recordLabAttempt(userId, rawEvent) {
  const sanitized = sanitizeEvent(rawEvent);
  if (!sanitized.labId) return null;

  const entry = {
    userId: userId ?? null,
    ...sanitized,
    createdAt: new Date().toISOString(),
  };

  behaviorEvents.push(entry);
  if (behaviorEvents.length > MAX_EVENTS) {
    behaviorEvents.shift();
  }

  if (db?.DB_TYPE === db?.DATABASE_TYPES?.POSTGRESQL) {
    try {
      await db.query(
        `INSERT INTO lab_behavior_events
          (user_id, lab_id, duration_ms, hints_used, wrong_attempts, command_count, unique_command_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entry.userId,
          entry.labId,
          entry.durationMs,
          entry.hintsUsed,
          entry.wrongAttempts,
          entry.commandCount,
          entry.uniqueCommandCount,
        ]
      );
    } catch (error) {
      console.warn("[behaviorEvents] Database write failed:", error.message);
    }
  }

  return { ...entry };
}

function fromDbRow(row) {
  return {
    userId: row.user_id,
    labId: row.lab_id,
    durationMs: row.duration_ms,
    hintsUsed: row.hints_used,
    wrongAttempts: row.wrong_attempts,
    commandCount: row.command_count,
    uniqueCommandCount: row.unique_command_count,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

// Postgres-first read (survives a restart), falls back to the in-memory
// array for in-memory mode or if the DB read fails — same pattern as
// backend/data/aiLogs.js's getUserLogs().
async function getUserEvents(userId) {
  if (db?.DB_TYPE === db?.DATABASE_TYPES?.POSTGRESQL) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM lab_behavior_events WHERE user_id = $1 ORDER BY created_at ASC`,
        [userId]
      );
      return rows.map(fromDbRow);
    } catch (error) {
      console.warn("[behaviorEvents] Database read failed, falling back to in-memory:", error.message);
    }
  }

  return behaviorEvents
    .filter((event) => String(event.userId) === String(userId))
    .map((event) => ({ ...event }));
}

function clearInMemoryEvents() {
  behaviorEvents.length = 0;
}

module.exports = {
  recordLabAttempt,
  getUserEvents,
  clearInMemoryEvents,
};
