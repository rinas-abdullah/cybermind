// Unified project constants for CyberMind

const API_PREFIX = "/api";

const SERVER_CONFIG = Object.freeze({
  DEFAULT_PORT: 3001,
  DEFAULT_NODE_ENV: "development",
  API_PREFIX,
});

const LEVELS = Object.freeze([
  Object.freeze({ id: 0, key: "RECRUIT", name: "Recruit", minScore: 0 }),
  Object.freeze({ id: 1, key: "ANALYST", name: "Analyst", minScore: 300 }),
  Object.freeze({ id: 2, key: "DEFENDER", name: "Defender", minScore: 600 }),
  Object.freeze({ id: 3, key: "HUNTER", name: "Hunter", minScore: 900 }),
  Object.freeze({ id: 4, key: "OPERATOR", name: "Operator", minScore: 1300 }),
  Object.freeze({ id: 5, key: "ELITE", name: "Elite", minScore: 1700 }),
]);

const ROUTES = Object.freeze({
  PAGES: Object.freeze({
    HOME: "/",
    AUTH: "/auth",
    DASHBOARD: "/dashboard",
    LEARNING: "/learn",
    TRAINING: "/training",
    PRACTICE: "/practice",
    TERMINAL: "/terminal",
    LEADERBOARD: "/leaderboard",
    ADMIN: "/admin",
    PROFILE: "/profile",

    ANALYZE_SCENARIO: "/analyze-scenario",
    LEARNER_PROFILE: "/learner-profile",
    AI_INSIGHTS: "/ai-insights",
    ANALYTICS: "/analytics",
  }),

  API: Object.freeze({
    PREFIX: API_PREFIX,
    HEALTH: `${API_PREFIX}/health`,

    AUTH_LOGIN: `${API_PREFIX}/auth/login`,
    AUTH_REGISTER: `${API_PREFIX}/auth/register`,
    AUTH_LOGOUT: `${API_PREFIX}/auth/logout`,

    USER_ME: `${API_PREFIX}/users/me`,
    USER_PROGRESS: `${API_PREFIX}/users/progress`,
    USER_SCORE: `${API_PREFIX}/users/score`,

    LEADERBOARD: `${API_PREFIX}/leaderboard`,
  }),

  REDIRECTS: Object.freeze({
    PRACTICE_TO_TRAINING: "/training",
  }),
});

const VALIDATION_RULES = Object.freeze({
  USERNAME: Object.freeze({
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  }),

  PASSWORD: Object.freeze({
    MIN_LENGTH: 10,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: false,
  }),

  SCORE_UPDATE: Object.freeze({
    MIN_AMOUNT: -100,
    MAX_AMOUNT: 100,
  }),
});

const DATABASE_TYPES = Object.freeze({
  IN_MEMORY: "in-memory",
  POSTGRESQL: "postgresql",
});

const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  LEARNER: "learner",
  INSTRUCTOR: "instructor",
});

module.exports = Object.freeze({
  SERVER_CONFIG,
  LEVELS,
  ROUTES,
  VALIDATION_RULES,
  DATABASE_TYPES,
  USER_ROLES,
});