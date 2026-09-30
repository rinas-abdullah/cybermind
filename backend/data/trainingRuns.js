// Training runs — one record per finished lab attempt (solved, contained,
// or timed out under Pressure Mode). Written only by the server-side lab
// service, never from request bodies, so everything the readiness index is
// computed from is data the server observed itself.
//
// Same storage pattern as data/behaviorEvents.js: in-memory array always,
// plus a Postgres row when running against a real database.

const db = require("../db");

const MAX_RUNS = 10000;
const runs = [];

const isPg = () => db?.DB_TYPE === db?.DATABASE_TYPES?.POSTGRESQL;

function clone(run) {
  return JSON.parse(JSON.stringify(run));
}

async function recordRun(run) {
  const entry = {
    runId: String(run.runId),
    userId: run.userId == null ? null : String(run.userId),
    labId: String(run.labId),
    completed: Boolean(run.completed),
    durationMs: Math.max(0, Math.round(run.durationMs || 0)),
    xpAwarded: Math.max(0, Math.round(run.xpAwarded || 0)),
    pressure: run.pressure || null, // { timeLimitMs, remainingMs, beatClock }
    adversary: run.adversary || null, // session record from adversaryEngine
    behavior: run.behavior || null, // { hintsUsed, wrongAttempts, commandCount, uniqueCommandCount }
    forensics: null,
    createdAt: new Date().toISOString(),
  };

  runs.push(entry);
  if (runs.length > MAX_RUNS) runs.shift();

  if (isPg()) {
    try {
      await db.query(
        `INSERT INTO training_runs
          (run_id, user_id, lab_id, completed, duration_ms, xp_awarded, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entry.runId,
          entry.userId,
          entry.labId,
          entry.completed,
          entry.durationMs,
          entry.xpAwarded,
          JSON.stringify({ pressure: entry.pressure, adversary: entry.adversary, behavior: entry.behavior }),
        ]
      );
    } catch (error) {
      console.warn("[trainingRuns] Database write failed:", error.message);
    }
  }

  return clone(entry);
}

async function attachForensics(runId, userId, forensics) {
  const run = runs.find((r) => r.runId === String(runId) && r.userId === String(userId));
  if (run) run.forensics = forensics;

  if (isPg()) {
    try {
      await db.query(`UPDATE training_runs SET forensics = $1 WHERE run_id = $2 AND user_id = $3`, [
        JSON.stringify(forensics),
        String(runId),
        String(userId),
      ]);
    } catch (error) {
      console.warn("[trainingRuns] Database update failed:", error.message);
    }
  }
  return run ? clone(run) : null;
}

function fromDbRow(row) {
  const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details || {};
  const forensics = typeof row.forensics === "string" ? JSON.parse(row.forensics) : row.forensics || null;
  return {
    runId: row.run_id,
    userId: row.user_id == null ? null : String(row.user_id),
    labId: String(row.lab_id),
    completed: row.completed,
    durationMs: row.duration_ms,
    xpAwarded: row.xp_awarded,
    pressure: details.pressure || null,
    adversary: details.adversary || null,
    behavior: details.behavior || null,
    forensics,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

async function getUserRuns(userId) {
  if (isPg()) {
    try {
      const { rows } = await db.query(`SELECT * FROM training_runs WHERE user_id = $1 ORDER BY created_at ASC`, [
        userId,
      ]);
      return rows.map(fromDbRow);
    } catch (error) {
      console.warn("[trainingRuns] Database read failed, falling back to in-memory:", error.message);
    }
  }
  return runs.filter((r) => r.userId === String(userId)).map(clone);
}

async function getAllRuns() {
  if (isPg()) {
    try {
      const { rows } = await db.query(`SELECT * FROM training_runs ORDER BY created_at ASC`);
      return rows.map(fromDbRow);
    } catch (error) {
      console.warn("[trainingRuns] Database read failed, falling back to in-memory:", error.message);
    }
  }
  return runs.map(clone);
}

async function getRun(runId, userId) {
  const list = await getUserRuns(userId);
  return list.find((r) => r.runId === String(runId)) || null;
}

async function getCompletedLabIds(userId) {
  const list = await getUserRuns(userId);
  return [...new Set(list.filter((r) => r.completed).map((r) => Number(r.labId)))].sort((a, b) => a - b);
}

function clearInMemoryRuns() {
  runs.length = 0;
}

module.exports = { recordRun, attachForensics, getUserRuns, getAllRuns, getRun, getCompletedLabIds, clearInMemoryRuns };
