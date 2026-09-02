const { calculateLevel } = require("../utils/userUtils");
const db = require("../db");

const MAX_SCORE_PER_UPDATE = 1000;
const MAX_TOTAL_SCORE = 10000000;
const MAX_TIME_SPENT = 24 * 60 * 60;
const MAX_ATTEMPTS = 1000;
const MAX_PROGRESS_ITEMS = 500;
const MAX_USERNAME_LENGTH = 50;
const MAX_SCENARIO_ID_LENGTH = 100;

const ALLOWED_SCENARIO_STATUSES = new Set([
  "not_started",
  "in_progress",
  "completed",
]);

const progressData = [
  {
    username: "admin",
    currentScenario: "network-scanning",
    completedScenarios: ["basic-commands", "file-permissions"],
    totalScore: 1200,
    level: 3,
    streak: 5,
    lastActivity: new Date().toISOString(),
    adaptiveDifficulty: 2,
    achievements: ["first-login", "scenario-master", "speed-demon"],
    progress: {
      "basic-commands": {
        status: "completed",
        score: 150,
        attempts: 1,
        timeSpent: 300,
      },
      "file-permissions": {
        status: "completed",
        score: 200,
        attempts: 2,
        timeSpent: 450,
      },
      "network-scanning": {
        status: "in_progress",
        score: 0,
        attempts: 0,
        timeSpent: 0,
      },
    },
  },
  {
    username: "guest",
    currentScenario: "basic-commands",
    completedScenarios: [],
    totalScore: 300,
    level: 1,
    streak: 1,
    lastActivity: new Date().toISOString(),
    adaptiveDifficulty: 1,
    achievements: ["first-login"],
    progress: {
      "basic-commands": {
        status: "in_progress",
        score: 50,
        attempts: 3,
        timeSpent: 120,
      },
    },
  },
  {
    username: "CyberFox",
    currentScenario: "advanced-exploitation",
    completedScenarios: [
      "basic-commands",
      "file-permissions",
      "network-scanning",
      "web-vulnerabilities",
    ],
    totalScore: 1850,
    level: 4,
    streak: 12,
    lastActivity: new Date().toISOString(),
    adaptiveDifficulty: 3,
    achievements: [
      "first-login",
      "scenario-master",
      "speed-demon",
      "perfectionist",
      "streak-master",
    ],
    progress: {
      "basic-commands": {
        status: "completed",
        score: 150,
        attempts: 1,
        timeSpent: 180,
      },
      "file-permissions": {
        status: "completed",
        score: 200,
        attempts: 1,
        timeSpent: 240,
      },
      "network-scanning": {
        status: "completed",
        score: 250,
        attempts: 2,
        timeSpent: 600,
      },
      "web-vulnerabilities": {
        status: "completed",
        score: 300,
        attempts: 1,
        timeSpent: 480,
      },
      "advanced-exploitation": {
        status: "in_progress",
        score: 100,
        attempts: 1,
        timeSpent: 300,
      },
    },
  },
];

function sanitizeUsername(username) {
  if (typeof username !== "string") return "";
  return username.trim().slice(0, MAX_USERNAME_LENGTH);
}

function sanitizeScenarioId(scenarioId) {
  if (typeof scenarioId !== "string") return "";
  return scenarioId.trim().slice(0, MAX_SCENARIO_ID_LENGTH);
}

function clampNumber(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function sanitizeAchievements(value) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim().slice(0, 50))
        .filter(Boolean)
        .slice(0, 100)
    ),
  ];
}

function sanitizeScenarioProgress(entry = {}) {
  const status = ALLOWED_SCENARIO_STATUSES.has(entry.status)
    ? entry.status
    : "not_started";

  return {
    status,
    score: clampNumber(entry.score, 0, MAX_SCORE_PER_UPDATE, 0),
    attempts: clampNumber(entry.attempts, 0, MAX_ATTEMPTS, 0),
    timeSpent: clampNumber(entry.timeSpent, 0, MAX_TIME_SPENT, 0),
  };
}

function sanitizeProgressMap(progress = {}) {
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
    return {};
  }

  const result = {};
  const entries = Object.entries(progress).slice(0, MAX_PROGRESS_ITEMS);

  for (const [scenarioId, value] of entries) {
    const safeScenarioId = sanitizeScenarioId(scenarioId);
    if (!safeScenarioId) continue;

    result[safeScenarioId] = sanitizeScenarioProgress(value);
  }

  return result;
}

function recalculateCompletedScenarios(progressMap) {
  return Object.entries(progressMap)
    .filter(([, value]) => value?.status === "completed")
    .map(([scenarioId]) => scenarioId);
}

function createDefaultProgress(username) {
  return {
    username: sanitizeUsername(username),
    currentScenario: "basic-commands",
    completedScenarios: [],
    totalScore: 0,
    level: 1,
    streak: 0,
    lastActivity: new Date().toISOString(),
    adaptiveDifficulty: 1,
    achievements: ["first-login"],
    progress: {},
  };
}

function cloneProgressRecord(record) {
  if (!record) return null;
  return JSON.parse(JSON.stringify(record));
}

function getAllProgress() {
  return progressData.map((item) => cloneProgressRecord(item));
}

function findUserProgress(username) {
  const safeUsername = sanitizeUsername(username);
  if (!safeUsername) return null;

  return (
    progressData.find(
      (item) => item.username.toLowerCase() === safeUsername.toLowerCase()
    ) || null
  );
}

function getUserProgress(username) {
  return cloneProgressRecord(findUserProgress(username));
}

function ensureUserProgress(username) {
  const safeUsername = sanitizeUsername(username);
  if (!safeUsername) return null;

  let userProgress = findUserProgress(safeUsername);

  if (!userProgress) {
    userProgress = createDefaultProgress(safeUsername);
    progressData.push(userProgress);
  }

  return userProgress;
}

function normalizeProgressState(userProgress) {
  userProgress.totalScore = clampNumber(
    userProgress.totalScore,
    0,
    MAX_TOTAL_SCORE,
    0
  );
  userProgress.level = calculateLevel(userProgress.totalScore);
  userProgress.adaptiveDifficulty = clampNumber(
    userProgress.adaptiveDifficulty,
    1,
    5,
    1
  );
  userProgress.streak = clampNumber(userProgress.streak, 0, 3650, 0);
  userProgress.progress = sanitizeProgressMap(userProgress.progress);
  userProgress.completedScenarios = recalculateCompletedScenarios(
    userProgress.progress
  );
  userProgress.achievements = sanitizeAchievements(userProgress.achievements);
  userProgress.lastActivity = new Date().toISOString();
}

async function persistLearnerState(username, userProgress) {
  if (!db || typeof db.query !== "function" || !userProgress) return;

  try {
    await db.query(
      `INSERT INTO learner_states (user_id, scenario_id, progress, updated_at)
       VALUES (
         (SELECT id FROM users WHERE username = $1),
         $2,
         $3,
         NOW()
       )
       ON CONFLICT (user_id, scenario_id) DO UPDATE
         SET progress = EXCLUDED.progress,
             updated_at = EXCLUDED.updated_at`,
      [
        username,
        userProgress.currentScenario || null,
        JSON.stringify(userProgress.progress),
      ]
    );
  } catch (err) {
    console.warn("Failed to persist learner state:", err.message);
  }
}

function updateAchievements(userProgress) {
  const achievements = new Set(
    Array.isArray(userProgress.achievements) ? userProgress.achievements : []
  );

  if (userProgress.totalScore >= 100) {
    achievements.add("first-points");
  }

  if (userProgress.completedScenarios.length >= 3) {
    achievements.add("scenario-master");
  }

  if (userProgress.streak >= 7) {
    achievements.add("streak-master");
  }

  if (userProgress.level >= 3) {
    achievements.add("level-up");
  }

  userProgress.achievements = [...achievements];
}

async function updateUserProgress(username, updates = {}) {
  const userProgress = ensureUserProgress(username);
  if (!userProgress) return null;

  if (updates.currentScenario !== undefined) {
    userProgress.currentScenario = sanitizeScenarioId(updates.currentScenario);
  }

  if (updates.adaptiveDifficulty !== undefined) {
    userProgress.adaptiveDifficulty = clampNumber(
      updates.adaptiveDifficulty,
      1,
      5,
      userProgress.adaptiveDifficulty
    );
  }

  if (updates.streak !== undefined) {
    userProgress.streak = clampNumber(
      updates.streak,
      0,
      3650,
      userProgress.streak
    );
  }

  if (updates.achievements !== undefined) {
    userProgress.achievements = sanitizeAchievements(updates.achievements);
  }

  if (updates.progress !== undefined) {
    const safeProgressUpdates = sanitizeProgressMap(updates.progress);

    userProgress.progress = {
      ...userProgress.progress,
      ...safeProgressUpdates,
    };

    userProgress.completedScenarios = recalculateCompletedScenarios(
      userProgress.progress
    );
  }

  if (updates.totalScore !== undefined) {
    userProgress.totalScore = clampNumber(
      updates.totalScore,
      0,
      MAX_TOTAL_SCORE,
      userProgress.totalScore
    );
  }

  normalizeProgressState(userProgress);
  updateAchievements(userProgress);

  await persistLearnerState(userProgress.username, userProgress);
  return cloneProgressRecord(userProgress);
}

async function completeScenario(username, scenarioId, score = 0, timeSpent = 0) {
  const userProgress = ensureUserProgress(username);
  if (!userProgress) return null;

  const safeScenarioId = sanitizeScenarioId(scenarioId);
  if (!safeScenarioId) return cloneProgressRecord(userProgress);

  const safeScore = clampNumber(score, 0, MAX_SCORE_PER_UPDATE, 0);
  const safeTimeSpent = clampNumber(timeSpent, 0, MAX_TIME_SPENT, 0);

  if (!userProgress.progress[safeScenarioId]) {
    userProgress.progress[safeScenarioId] = {
      status: "not_started",
      score: 0,
      attempts: 0,
      timeSpent: 0,
    };
  }

  const scenarioProgress = userProgress.progress[safeScenarioId];
  const wasCompletedAlready = scenarioProgress.status === "completed";

  scenarioProgress.status = "completed";
  scenarioProgress.score = Math.max(scenarioProgress.score, safeScore);
  scenarioProgress.timeSpent = clampNumber(
    scenarioProgress.timeSpent + safeTimeSpent,
    0,
    MAX_TIME_SPENT,
    scenarioProgress.timeSpent
  );
  scenarioProgress.attempts = clampNumber(
    scenarioProgress.attempts + 1,
    0,
    MAX_ATTEMPTS,
    scenarioProgress.attempts
  );

  if (!userProgress.completedScenarios.includes(safeScenarioId)) {
    userProgress.completedScenarios.push(safeScenarioId);
  }

  if (!wasCompletedAlready) {
    userProgress.totalScore = clampNumber(
      userProgress.totalScore + safeScore,
      0,
      MAX_TOTAL_SCORE,
      userProgress.totalScore
    );
    userProgress.streak = clampNumber(
      userProgress.streak + 1,
      0,
      3650,
      userProgress.streak
    );
  }

  if (safeScore >= 80) {
    userProgress.adaptiveDifficulty = clampNumber(
      userProgress.adaptiveDifficulty + 1,
      1,
      5,
      userProgress.adaptiveDifficulty
    );
  }

  userProgress.currentScenario = safeScenarioId;

  normalizeProgressState(userProgress);
  updateAchievements(userProgress);

  await persistLearnerState(userProgress.username, userProgress);
  return cloneProgressRecord(userProgress);
}

module.exports = {
  progressData,
  getAllProgress,
  createDefaultProgress,
  getUserProgress,
  ensureUserProgress,
  updateUserProgress,
  completeScenario,
};