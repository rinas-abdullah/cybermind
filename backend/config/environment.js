require("dotenv").config();

const ALLOWED_NODE_ENVS = ["development", "test", "production"];
const ALLOWED_DB_TYPES = ["in-memory", "postgresql"];

const DEFAULT_DEV_CORS_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://127.0.0.1:3003",
  "http://localhost:3003",
];

function getString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function normalizeOrigin(origin) {
  return typeof origin === "string" ? origin.replace(/\/+$/, "") : "";
}

function siteUrlToOrigin(siteUrl) {
  if (!siteUrl || typeof siteUrl !== "string") return "";
  try {
    const url = new URL(siteUrl.trim());
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function parseCsv(value) {
  if (!value || !String(value).trim()) return [];

  return [
    ...new Set(
      value
        .split(",")
        .map((item) => normalizeOrigin(item.trim()))
        .filter(Boolean)
    ),
  ];
}

function validateEnum(name, value, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw new Error(
      `Invalid ${name}: "${value}". Allowed values: ${allowedValues.join(", ")}`
    );
  }
  return value;
}

const nodeEnv = validateEnum(
  "NODE_ENV",
  getString(process.env.NODE_ENV, "development"),
  ALLOWED_NODE_ENVS
);

const isProduction = nodeEnv === "production";
const isDevelopment = nodeEnv === "development";

const dbType = validateEnum(
  "DB_TYPE",
  getString(process.env.DB_TYPE, "in-memory"),
  ALLOWED_DB_TYPES
);

const siteUrl = getString(process.env.SITE_URL, "");
const siteOrigin = siteUrlToOrigin(siteUrl);
const localDomain = getString(process.env.LOCAL_DOMAIN, "cybermind.local");
const serverPort = getNumber(process.env.PORT, 3001);

const corsOriginsFromEnv = parseCsv(process.env.CORS_ORIGIN);

let corsOrigins = corsOriginsFromEnv.length
  ? corsOriginsFromEnv.slice()
  : isDevelopment
    ? DEFAULT_DEV_CORS_ORIGINS.slice()
    : [];

const extraOrigins = [];
if (siteOrigin) extraOrigins.push(siteOrigin);
if (isDevelopment && localDomain && Number.isInteger(serverPort)) {
  extraOrigins.push(`http://${localDomain}:${serverPort}`);
}

for (const origin of extraOrigins) {
  if (origin && !corsOrigins.includes(origin)) {
    corsOrigins.push(origin);
  }
}

corsOrigins = [...new Set(corsOrigins)];

const config = Object.freeze({
  server: Object.freeze({
    port: getNumber(process.env.PORT, 3001),
    host: getString(process.env.HOST, isDevelopment ? "127.0.0.1" : "0.0.0.0"),
    nodeEnv,
    isProduction,
    isDevelopment,
    trustProxy: getBoolean(process.env.TRUST_PROXY, false),
  }),

  database: Object.freeze({
    type: dbType,
    enabled: getBoolean(process.env.DB_ENABLED, dbType !== "in-memory"),

    postgresql: Object.freeze({
      connectionString: getString(process.env.DATABASE_URL, ""),
      max: getNumber(process.env.PG_MAX_CONNECTIONS, 20),
      idleTimeoutMillis: getNumber(process.env.PG_IDLE_TIMEOUT, 30000),
      connectionTimeoutMillis: getNumber(process.env.PG_CONNECTION_TIMEOUT, 5000),
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }),
  }),

  security: Object.freeze({
    jwt: Object.freeze({
      secret: getString(
        process.env.JWT_SECRET,
        isDevelopment ? "local-dev-jwt-secret-not-for-production-123456" : ""
      ),
      expiresIn: getString(process.env.JWT_EXPIRES_IN, "24h"),
    }),
  }),

  cors: Object.freeze({
    origins: corsOrigins,
    credentials: getBoolean(process.env.CORS_CREDENTIALS, true),
  }),

  public: Object.freeze({
    siteUrl,
    siteOrigin,
    localDomain,
    suggestedLocalUrl:
      localDomain && Number.isInteger(serverPort)
        ? `http://${localDomain}:${serverPort}`
        : "",
  }),

  logging: Object.freeze({
    level: getString(process.env.LOG_LEVEL, isDevelopment ? "debug" : "info"),
  }),

  rateLimit: Object.freeze({
    windowMs: getNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: getNumber(process.env.RATE_LIMIT_MAX, 100),
  }),
});

function validateConfig() {
  if (!Number.isInteger(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    throw new Error("PORT must be a valid integer between 1 and 65535");
  }

  if (!config.server.host) {
    throw new Error("HOST must not be empty");
  }

  if (!Number.isInteger(config.rateLimit.windowMs) || config.rateLimit.windowMs <= 0) {
    throw new Error("RATE_LIMIT_WINDOW_MS must be a positive integer");
  }

  if (!Number.isInteger(config.rateLimit.max) || config.rateLimit.max <= 0) {
    throw new Error("RATE_LIMIT_MAX must be a positive integer");
  }

  if (config.cors.credentials && config.cors.origins.includes("*")) {
    throw new Error('CORS origin "*" cannot be used when credentials=true');
  }

  if (isProduction) {
    const jwtSecret = getRequiredEnv("JWT_SECRET");
    if (jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }

    if (config.database.enabled && config.database.type === "postgresql") {
      getRequiredEnv("DATABASE_URL");
    }

    if (config.cors.origins.length === 0 && !config.public.siteOrigin) {
      throw new Error("CORS_ORIGIN or SITE_URL must be set in production");
    }
  }
}

module.exports = {
  config,
  validateConfig,
};