const db = require("../db");

const MAX_ATTEMPTS = 5000;
const MAX_LAB_ID_LENGTH = 100;
const MAX_TIME_LIMIT_MS = 60 * 60 * 1000; // 1 hour ceiling — generous for any lab

const pressureAttempts = [];

function clampInt(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function sanitizeLabId(labId) {
  return String(labId ?? "").trim().slice(0, MAX_LAB_ID_LENGTH);
}

async function recordAttempt(userId, rawAttempt = {}) {
  const labId = sanitizeLabId(rawAttempt.labId);
  if (!labId) return null;

  const timeLimitMs = clampInt(rawAttempt.timeLimitMs, 1, MAX_TIME_LIMIT_MS, MAX_TIME_LIMIT_MS);
  const completed = Boolean(rawAttempt.completed);
  const remainingMs = completed
    ? clampInt(rawAttempt.remainingMs, 0, timeLimitMs, 0)
    : null;

  const entry = {
    userId: userId ?? null,
    labId,
    timeLimitMs,
    completed,
    remainingMs,
    createdAt: new Date().toISOString(),
  };

  pressureAttempts.push(entry);
  if (pressureAttempts.length > MAX_ATTEMPTS) {
    pressureAttempts.shift();
  }

  if (db?.DB_TYPE === db?.DATABASE_TYPES?.POSTGRESQL) {
    try {
      await db.query(
        `INSERT INTO pressure_attempts
          (user_id, lab_id, time_limit_ms, completed, remaining_ms)
         VALUES ($1, $2, $3, $4, $5)`,
        [entry.userId, entry.labId, entry.timeLimitMs, entry.completed, entry.remainingMs]
      );
    } catch (error) {
      console.warn("[pressureAttempts] Database write failed:", error.message);
    }
  }

  return { ...entry };
}

function fromDbRow(row) {
  return {
    userId: row.user_id,
    labId: row.lab_id,
    timeLimitMs: row.time_limit_ms,
    completed: row.completed,
    remainingMs: row.remaining_ms,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

async function getUserAttempts(userId) {
  if (db?.DB_TYPE === db?.DATABASE_TYPES?.POSTGRESQL) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM pressure_attempts WHERE user_id = $1 ORDER BY created_at ASC`,
        [userId]
      );
      return rows.map(fromDbRow);
    } catch (error) {
      console.warn("[pressureAttempts] Database read failed, falling back to in-memory:", error.message);
    }
  }

  return pressureAttempts
    .filter((attempt) => String(attempt.userId) === String(userId))
    .map((attempt) => ({ ...attempt }));
}

function clearInMemoryAttempts() {
  pressureAttempts.length = 0;
}

module.exports = {
  recordAttempt,
  getUserAttempts,
  clearInMemoryAttempts,
};
