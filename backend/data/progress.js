// Progress Data - In-memory storage for user training progress
// NOTE: This is temporary demo storage.
// In production, replace with MongoDB/MySQL.
//
// Future schema suggestion:
// TrainingProgress:
// - id
// - user_id
// - scenario_id
// - status
// - score_awarded
// - time_spent
// - attempts
// - completed_at
// - current_challenge
// - difficulty_level

const { calculateLevel } = require("../utils/userUtils");

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

// Create default progress structure for new users
function createDefaultProgress(username) {
  return {
    username,
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

// Get user progress
function getUserProgress(username) {
  if (!username) return null;

  return (
    progressData.find(
      (p) => p.username.toLowerCase() === String(username).toLowerCase()
    ) || null
  );
}

// Create progress if missing
function ensureUserProgress(username) {
  let userProgress = getUserProgress(username);

  if (!userProgress) {
    userProgress = createDefaultProgress(username);
    progressData.push(userProgress);
  }

  return userProgress;
}

// Update general user progress
function updateUserProgress(username, updates = {}) {
  const userProgress = ensureUserProgress(username);

  // Merge nested progress safely if provided
  if (updates.progress && typeof updates.progress === "object") {
    userProgress.progress = {
      ...userProgress.progress,
      ...updates.progress,
    };
  }

  // Assign other fields except progress
  const { progress, ...restUpdates } = updates;
  Object.assign(userProgress, restUpdates);

  userProgress.lastActivity = new Date().toISOString();

  return userProgress;
}

// Mark a scenario as completed
function completeScenario(username, scenarioId, score = 0, timeSpent = 0) {
  const userProgress = ensureUserProgress(username);

  if (!scenarioId) return userProgress;

  if (!userProgress.progress[scenarioId]) {
    userProgress.progress[scenarioId] = {
      status: "not_started",
      score: 0,
      attempts: 0,
      timeSpent: 0,
    };
  }

  const scenarioProgress = userProgress.progress[scenarioId];

  scenarioProgress.status = "completed";
  scenarioProgress.score = Math.max(scenarioProgress.score, Number(score) || 0);
  scenarioProgress.timeSpent += Number(timeSpent) || 0;
  scenarioProgress.attempts += 1;

  if (!userProgress.completedScenarios.includes(scenarioId)) {
    userProgress.completedScenarios.push(scenarioId);
  }

  userProgress.totalScore += Number(score) || 0;
  userProgress.level = calculateLevel(userProgress.totalScore);
  userProgress.currentScenario = scenarioId;
  userProgress.lastActivity = new Date().toISOString();
  userProgress.streak += 1;

  // Adaptive difficulty
  if ((Number(score) || 0) >= 80) {
    userProgress.adaptiveDifficulty = Math.min(
      userProgress.adaptiveDifficulty + 1,
      5
    );
  }

  updateAchievements(userProgress);

  return userProgress;
}

// Achievement updater
function updateAchievements(userProgress) {
  if (!Array.isArray(userProgress.achievements)) {
    userProgress.achievements = [];
  }

  const achievements = userProgress.achievements;

  if (userProgress.totalScore >= 100 && !achievements.includes("first-points")) {
    achievements.push("first-points");
  }

  if (
    userProgress.completedScenarios.length >= 3 &&
    !achievements.includes("scenario-master")
  ) {
    achievements.push("scenario-master");
  }

  if (userProgress.streak >= 7 && !achievements.includes("streak-master")) {
    achievements.push("streak-master");
  }

  if (userProgress.level >= 3 && !achievements.includes("level-up")) {
    achievements.push("level-up");
  }

  userProgress.achievements = achievements;
}

module.exports = {
  progressData,
  createDefaultProgress,
  getUserProgress,
  ensureUserProgress,
  updateUserProgress,
  completeScenario,
};