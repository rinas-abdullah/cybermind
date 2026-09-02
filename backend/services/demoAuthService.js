// In-memory user store, used when DB_TYPE=in-memory (no PostgreSQL configured).
// Backs real registration/login for that mode, plus two seeded demo accounts
// for quick exploration. When DB_TYPE=postgresql, authController talks to the
// real `users` table instead and this module is not used for credentials.
const bcrypt = require("bcrypt");

const ALLOWED_SKILL_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const SEEDED_DEMO_PASSWORD = "Risaq@Demo123!";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email) {
  return normalizeString(email).toLowerCase();
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function createDefaultProfile() {
  return {
    knowledgeLevel: 0,
    riskPersona: "Unclassified",
    completedScenarios: 0,
    totalScore: 0,
    level: 0,
    weakSkills: [],
    strongSkills: [],
    streak: 0,
    skillLevel: "beginner",
    interests: [],
    behaviors: {
      decisionVelocity: 0,
      warningAcknowledgment: 50,
      verificationBehavior: 50,
      pressurePerformance: 50,
      consistencyScore: 50,
    },
  };
}

function sanitizeProfileUpdates(updates = {}) {
  const safe = {};
  const allowedBehaviorFields = new Set([
    "decisionVelocity",
    "warningAcknowledgment",
    "verificationBehavior",
    "pressurePerformance",
    "consistencyScore",
  ]);

  for (const [key, value] of Object.entries(updates)) {
    if (key === "weakSkills" || key === "strongSkills" || key === "interests") {
      safe[key] = sanitizeStringArray(value);
      continue;
    }

    if (key === "behaviors" && value && typeof value === "object" && !Array.isArray(value)) {
      const safeBehaviors = {};

      for (const [bKey, bValue] of Object.entries(value)) {
        if (!allowedBehaviorFields.has(bKey)) continue;
        if (typeof bValue !== "number" || !Number.isFinite(bValue)) continue;

        if (bKey === "decisionVelocity") {
          safeBehaviors[bKey] = clampNumber(bValue, 0, 60000);
        } else {
          safeBehaviors[bKey] = clampNumber(bValue, 0, 100);
        }
      }

      safe[key] = safeBehaviors;
      continue;
    }

    if (
      key === "knowledgeLevel" ||
      key === "completedScenarios" ||
      key === "totalScore" ||
      key === "level" ||
      key === "streak"
    ) {
      if (typeof value === "number" && Number.isFinite(value)) {
        const clamps = {
          knowledgeLevel: [0, 100],
          completedScenarios: [0, 100000],
          totalScore: [0, 10000000],
          level: [0, 1000],
          streak: [0, 3650],
        };
        const [min, max] = clamps[key];
        safe[key] = clampNumber(value, min, max);
      }
      continue;
    }

    if (key === "skillLevel" && typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (ALLOWED_SKILL_LEVELS.has(normalized)) {
        safe[key] = normalized;
      }
      continue;
    }

    if (typeof value === "string") {
      safe[key] = value.trim().slice(0, 100);
    }
  }

  return safe;
}

function toSafeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    profile: user.profile,
  };
}

function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    level: user.profile?.level || 0,
    points: user.profile?.totalScore || 0,
    completedScenarios: user.profile?.completedScenarios || 0,
    riskPersona: user.profile?.riskPersona || "Unclassified",
  };
}

let demoUsers = [];
let nextId = 3;

function seedDemoUsers() {
  if (demoUsers.length > 0) return;

  const demoPasswordHash = bcrypt.hashSync(SEEDED_DEMO_PASSWORD, 12);

  demoUsers = [
    {
      id: 1,
      username: "admin",
      email: "admin@risaq.local",
      passwordHash: demoPasswordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      profile: {
        ...createDefaultProfile(),
        knowledgeLevel: 100,
        riskPersona: "Incident Responder",
        completedScenarios: 15,
        totalScore: 5000,
        level: 5,
        skillLevel: "advanced",
        interests: ["soc", "incident-response", "threat-hunting"],
        strongSkills: ["all"],
        streak: 30,
      },
    },
    {
      id: 2,
      username: "demo",
      email: "demo@risaq.local",
      passwordHash: demoPasswordHash,
      role: "learner",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      profile: {
        ...createDefaultProfile(),
        knowledgeLevel: 45,
        riskPersona: "Careful Defender",
        completedScenarios: 8,
        totalScore: 1200,
        level: 2,
        skillLevel: "intermediate",
        interests: ["web-security", "phishing", "email-security"],
        weakSkills: ["sql-injection", "privilege-escalation"],
        strongSkills: ["phishing-detection", "email-security"],
        streak: 5,
      },
    },
  ];
}

function ensureSeeded() {
  if (demoUsers.length === 0) {
    seedDemoUsers();
  }
}

function findUserByUsername(username) {
  ensureSeeded();
  const normalized = normalizeString(username).toLowerCase();
  return demoUsers.find((user) => user.username.toLowerCase() === normalized) || null;
}

function findUserByEmail(email) {
  ensureSeeded();
  const normalized = normalizeEmail(email);
  return demoUsers.find((user) => user.email.toLowerCase() === normalized) || null;
}

function findUserById(id) {
  ensureSeeded();
  return demoUsers.find((user) => user.id === Number(id)) || null;
}

// Registers a real user against the in-memory store — used when DB_TYPE is
// in-memory, so registration/login work with zero external setup.
function createUser({ username, email, passwordHash, role = "learner" }) {
  ensureSeeded();

  const user = {
    id: nextId++,
    username: normalizeString(username),
    email: normalizeEmail(email),
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    profile: createDefaultProfile(),
  };

  demoUsers.push(user);
  return user;
}

function getAllUsers() {
  ensureSeeded();
  return demoUsers.map((u) => toPublicUser(u)).sort((a, b) => b.points - a.points);
}

function getLeaderboard() {
  return getAllUsers().map((user, index) => ({ ...user, rank: index + 1 }));
}

function getUserProfile(username) {
  const user = findUserByUsername(username);
  return toSafeUser(user);
}

function updateUserProfile(userId, updates) {
  ensureSeeded();
  const user = demoUsers.find((u) => u.id === Number(userId));
  if (!user) return null;

  const safeUpdates = sanitizeProfileUpdates(updates);

  user.profile = {
    ...user.profile,
    ...safeUpdates,
    behaviors: {
      ...user.profile.behaviors,
      ...(safeUpdates.behaviors || {}),
    },
  };

  return toSafeUser(user);
}

function findDemoUserByUsername(username) {
  return findUserByUsername(username);
}

function getDemoUserProfile(username) {
  return getUserProfile(username);
}

function updateDemoUserProfile(userId, updates) {
  return updateUserProfile(userId, updates);
}

function getDemoLeaderboard() {
  return getLeaderboard();
}

module.exports = {
  SEEDED_DEMO_PASSWORD,
  ALLOWED_SKILL_LEVELS,
  createDefaultProfile,
  sanitizeStringArray,
  clampNumber,
  sanitizeProfileUpdates,
  toSafeUser,
  toPublicUser,
  seedDemoUsers,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  getAllUsers,
  getLeaderboard,
  getUserProfile,
  updateUserProfile,
  findDemoUserByUsername,
  getDemoUserProfile,
  updateDemoUserProfile,
  getDemoLeaderboard,
};