const { Pool } = require("pg");

const ALLOWED_DB_TYPES = Object.freeze(["in-memory", "postgresql"]);
const NODE_ENV = process.env.NODE_ENV?.trim() || "development";
const IS_PRODUCTION = NODE_ENV === "production";

function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function toNumber(value, defaultValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function toString(value, defaultValue = "") {
  if (value === undefined || value === null) return defaultValue;
  return String(value).trim();
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

function validateDbType(type) {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();

  if (!ALLOWED_DB_TYPES.includes(normalizedType)) {
    throw new Error(
      `Invalid DB_TYPE "${type}". Allowed values: ${ALLOWED_DB_TYPES.join(", ")}`
    );
  }

  return normalizedType;
}

const DB_TYPE = validateDbType(process.env.DB_TYPE || "in-memory");
const DB_ENABLED = toBoolean(process.env.DB_ENABLED, DB_TYPE !== "in-memory");

const databaseConfig = Object.freeze({
  enabled: DB_ENABLED,
  type: DB_TYPE,
  env: NODE_ENV,

  postgresql: Object.freeze({
    connectionString: toString(process.env.DATABASE_URL),
    ssl:
      DB_TYPE === "postgresql" && IS_PRODUCTION
        ? {
            rejectUnauthorized: toBoolean(
              process.env.PG_SSL_REJECT_UNAUTHORIZED,
              false
            ),
          }
        : false,
    max: toNumber(process.env.PG_MAX_CONNECTIONS, 20),
    idleTimeoutMillis: toNumber(process.env.PG_IDLE_TIMEOUT, 30000),
    connectionTimeoutMillis: toNumber(process.env.PG_CONNECTION_TIMEOUT, 5000),
    allowExitOnIdle: toBoolean(process.env.PG_ALLOW_EXIT_ON_IDLE, false),
  }),
});

let dbPool = null;
let isConnecting = false;
let connectPromise = null;

let connectionState = {
  connected: false,
  provider: "none",
  mode: DB_ENABLED ? DB_TYPE : "disabled",
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  lastError: null,
};

function setConnectionState(updates = {}) {
  connectionState = {
    ...connectionState,
    ...updates,
  };
}

function validateConfiguration() {
  if (!databaseConfig.enabled) return;

  if (databaseConfig.type === "postgresql") {
    if (IS_PRODUCTION) {
      getRequiredEnv("DATABASE_URL");
    }
  }
}

function createPostgresPool() {
  return new Pool({
    connectionString: databaseConfig.postgresql.connectionString,
    ssl: databaseConfig.postgresql.ssl,
    max: databaseConfig.postgresql.max,
    idleTimeoutMillis: databaseConfig.postgresql.idleTimeoutMillis,
    connectionTimeoutMillis: databaseConfig.postgresql.connectionTimeoutMillis,
    allowExitOnIdle: databaseConfig.postgresql.allowExitOnIdle,
  });
}

async function testPostgresConnection(pool) {
  const client = await pool.connect();
  try {
    await client.query("SELECT NOW()");
  } finally {
    client.release();
  }
}

async function connectDatabase() {
  if (connectionState.connected) {
    return {
      success: true,
      message: `Database already connected (${connectionState.provider}).`,
      type: connectionState.provider,
    };
  }

  if (isConnecting && connectPromise) {
    return connectPromise;
  }

  isConnecting = true;

  connectPromise = (async () => {
    try {
      validateConfiguration();

      if (!databaseConfig.enabled || databaseConfig.type === "in-memory") {
        dbPool = null;

        setConnectionState({
          connected: true,
          provider: "in-memory",
          mode: "in-memory",
          lastConnectedAt: new Date().toISOString(),
          lastError: null,
        });

        return {
          success: true,
          message: "Using in-memory data store. No external database connected.",
          type: "in-memory",
        };
      }

      if (databaseConfig.type === "postgresql") {
        if (!databaseConfig.postgresql.connectionString) {
          setConnectionState({
            connected: false,
            provider: "postgresql",
            mode: "error",
            lastConnectedAt: null,
            lastError: "DATABASE_URL is not configured.",
          });

          return {
            success: false,
            message: "PostgreSQL connection failed: DATABASE_URL is not configured.",
            type: "postgresql",
          };
        }

        const pool = createPostgresPool();

        pool.on("error", (error) => {
          setConnectionState({
            connected: false,
            provider: "postgresql",
            mode: "error",
            lastError: error.message,
          });
          console.error("[database] PostgreSQL pool error:", error.message);
        });

        try {
          await testPostgresConnection(pool);
          dbPool = pool;

          setConnectionState({
            connected: true,
            provider: "postgresql",
            mode: "connected",
            lastConnectedAt: new Date().toISOString(),
            lastError: null,
          });

          return {
            success: true,
            message: "PostgreSQL database connected successfully.",
            type: "postgresql",
          };
        } catch (error) {
          await pool.end().catch(() => {});
          dbPool = null;

          setConnectionState({
            connected: false,
            provider: "postgresql",
            mode: "error",
            lastConnectedAt: null,
            lastError: error.message,
          });

          return {
            success: false,
            message: `PostgreSQL connection failed: ${error.message}`,
            type: "postgresql",
          };
        }
      }

      setConnectionState({
        connected: false,
        provider: "none",
        mode: "invalid",
        lastConnectedAt: null,
        lastError: "Unsupported database type.",
      });

      return {
        success: false,
        message: "Unsupported database type.",
        type: databaseConfig.type,
      };
    } catch (error) {
      dbPool = null;

      setConnectionState({
        connected: false,
        provider: "none",
        mode: "error",
        lastConnectedAt: null,
        lastError: error.message,
      });

      return {
        success: false,
        message: error.message,
        type: databaseConfig.type,
      };
    } finally {
      isConnecting = false;
      connectPromise = null;
    }
  })();

  return connectPromise;
}

async function disconnectDatabase() {
  if (!connectionState.connected) {
    return {
      success: true,
      message: "No active database connection to close.",
    };
  }

  if (dbPool && databaseConfig.type === "postgresql") {
    try {
      await dbPool.end();
    } catch (error) {
      console.warn("[database] Error closing PostgreSQL pool:", error.message);
    }
  }

  dbPool = null;

  setConnectionState({
    connected: false,
    provider: "none",
    mode: "disconnected",
    lastDisconnectedAt: new Date().toISOString(),
    lastError: null,
  });

  return {
    success: true,
    message: "Database connection closed successfully.",
  };
}

function getDatabaseStatus() {
  return {
    enabled: databaseConfig.enabled,
    type: databaseConfig.type,
    env: databaseConfig.env,
    connected: connectionState.connected,
    provider: connectionState.provider,
    mode: connectionState.mode,
    lastConnectedAt: connectionState.lastConnectedAt,
    lastDisconnectedAt: connectionState.lastDisconnectedAt,
    lastError: connectionState.lastError,
  };
}

function getDatabaseClient() {
  if (!connectionState.connected) {
    throw new Error("Database not connected. Call connectDatabase() first.");
  }

  if (databaseConfig.type === "postgresql") {
    if (!dbPool) {
      throw new Error("PostgreSQL pool is not available.");
    }
    return dbPool;
  }

  throw new Error(`No external database client available for type: ${databaseConfig.type}`);
}

async function query(text, params = []) {
  if (databaseConfig.type !== "postgresql") {
    throw new Error("query() is only available when using PostgreSQL.");
  }

  const client = getDatabaseClient();
  return client.query(text, params);
}

module.exports = Object.freeze({
  DB_TYPE,
  databaseConfig,
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  getDatabaseClient,
  query,
});