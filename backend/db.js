const { Pool } = require("pg");
const { config } = require("./config/environment");

const DATABASE_TYPES = Object.freeze({
  IN_MEMORY: "in-memory",
  POSTGRESQL: "postgresql",
});

const DB_TYPE = config?.database?.type || DATABASE_TYPES.IN_MEMORY;
const IS_PRODUCTION = config?.server?.isProduction || false;

let pool = null;

let connectionState = {
  connected: false,
  type: DB_TYPE,
  provider: "none",
  mode: DB_TYPE === DATABASE_TYPES.POSTGRESQL ? "pending" : "in-memory",
  lastConnectedAt: null,
  lastError: null,
};

function getDatabaseClient() {
  if (DB_TYPE === DATABASE_TYPES.IN_MEMORY) {
    throw new Error(
      "In-memory database has no client. Use in-memory logic or switch DB_TYPE to postgresql."
    );
  }

  if (!pool) {
    throw new Error("PostgreSQL pool is not initialized. Call connectDatabase() first.");
  }

  return pool;
}

function getDatabaseStatus() {
  return {
    enabled: config?.database?.enabled ?? DB_TYPE !== DATABASE_TYPES.IN_MEMORY,
    type: DB_TYPE,
    connected: connectionState.connected,
    provider: connectionState.provider,
    mode: connectionState.mode,
    lastConnectedAt: connectionState.lastConnectedAt,
    lastError: connectionState.lastError,
  };
}

async function connectDatabase() {
  if (DB_TYPE === DATABASE_TYPES.IN_MEMORY) {
    connectionState = {
      ...connectionState,
      connected: true,
      provider: "in-memory",
      mode: "in-memory",
      lastConnectedAt: new Date().toISOString(),
      lastError: null,
    };

    return {
      success: true,
      message: "Using in-memory database (no external connection).",
      type: DB_TYPE,
    };
  }

  if (pool) {
    return {
      success: true,
      message: "PostgreSQL already connected",
      type: DB_TYPE,
    };
  }

  const connectionString = config?.database?.postgresql?.connectionString;

  if (!connectionString) {
    connectionState = {
      ...connectionState,
      connected: false,
      provider: "postgresql",
      mode: "error",
      lastError: "DATABASE_URL is not set",
    };

    return {
      success: false,
      message: "PostgreSQL configuration missing DATABASE_URL",
      type: DB_TYPE,
    };
  }

  try {
    const newPool = new Pool({
      connectionString,
      ssl: config?.database?.postgresql?.ssl || false,
      max: config?.database?.postgresql?.max || 20,
      idleTimeoutMillis: config?.database?.postgresql?.idleTimeoutMillis || 30000,
      connectionTimeoutMillis:
        config?.database?.postgresql?.connectionTimeoutMillis || 5000,
    });

    const client = await newPool.connect();
    await client.query("SELECT 1");
    client.release();

    pool = newPool;

    connectionState = {
      ...connectionState,
      connected: true,
      provider: "postgresql",
      mode: "connected",
      lastConnectedAt: new Date().toISOString(),
      lastError: null,
    };

    return {
      success: true,
      message: "PostgreSQL connected successfully",
      type: DB_TYPE,
    };
  } catch (error) {
    if (pool) {
      try {
        await pool.end();
      } catch (_) {}
    }

    pool = null;

    connectionState = {
      ...connectionState,
      connected: false,
      provider: "postgresql",
      mode: "error",
      lastError: error.message,
    };

    return {
      success: false,
      message: `PostgreSQL connection failed: ${error.message}`,
      type: DB_TYPE,
    };
  }
}

async function disconnectDatabase() {
  if (DB_TYPE === DATABASE_TYPES.IN_MEMORY) {
    connectionState = {
      ...connectionState,
      connected: false,
      provider: "none",
      mode: "disconnected",
      lastConnectedAt: null,
      lastError: null,
    };

    return {
      success: true,
      message: "In-memory database closed",
    };
  }

  if (!pool) {
    return {
      success: true,
      message: "No PostgreSQL pool exists",
    };
  }

  try {
    await pool.end();
    pool = null;

    connectionState = {
      ...connectionState,
      connected: false,
      provider: "none",
      mode: "disconnected",
      lastConnectedAt: null,
      lastError: null,
    };

    return {
      success: true,
      message: "PostgreSQL pool closed",
    };
  } catch (error) {
    return {
      success: false,
      message: `Error disconnecting PostgreSQL: ${error.message}`,
    };
  }
}

async function query(text, params = []) {
  if (DB_TYPE === DATABASE_TYPES.IN_MEMORY) {
    throw new Error("Query not supported for in-memory mode");
  }

  if (!pool) {
    const result = await connectDatabase();
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  return pool.query(text, params);
}

async function testConnection() {
  if (DB_TYPE === DATABASE_TYPES.IN_MEMORY) {
    return { success: true, message: "In-memory mode active" };
  }

  try {
    const result = await query("SELECT 1");
    return { success: true, message: "Database connection is healthy", result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function createTables() {
  if (DB_TYPE !== DATABASE_TYPES.POSTGRESQL) {
    return { success: true, message: "Skipped table creation in in-memory mode" };
  }

  if (!pool) {
    const result = await connectDatabase();
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        permissions JSONB
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
        institution_id INTEGER NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS learner_profiles (
        user_id VARCHAR(100) PRIMARY KEY,
        profile_data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS learner_states (
        user_id INTEGER,
        scenario_id VARCHAR(100),
        progress JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, scenario_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_logs (
        id UUID PRIMARY KEY,
        user_id INTEGER NULL,
        username VARCHAR(100),
        question TEXT,
        response TEXT,
        user_level INTEGER,
        context VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      INSERT INTO roles (name, permissions) VALUES
      ('admin', '{"read":true,"write":true,"delete":true,"manage_users":true}'),
      ('instructor', '{"read":true,"write":true,"manage_students":true}'),
      ('learner', '{"read":true,"write":false}'),
      ('student', '{"read":true,"write":false}')
      ON CONFLICT (name) DO NOTHING;
    `);

    await client.query("COMMIT");
    return { success: true, message: "Tables created" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function verifyRequiredTables() {
  if (DB_TYPE !== DATABASE_TYPES.POSTGRESQL) {
    return {
      success: true,
      missingTables: [],
      message: "In-memory mode, no tables required",
    };
  }

  if (!pool) {
    const result = await connectDatabase();
    if (!result.success) {
      return { success: false, missingTables: [], message: result.message };
    }
  }

  const requiredTables = ["roles", "users", "learner_profiles", "ai_logs", "learner_states"];
  const result = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [requiredTables]
  );

  const presentTables = result.rows.map((row) => row.table_name);
  const missingTables = requiredTables.filter((table) => !presentTables.includes(table));

  return {
    success: missingTables.length === 0,
    missingTables,
    message: missingTables.length > 0 ? "Missing required tables" : "All required tables present",
  };
}

async function ensureSchema() {
  if (DB_TYPE !== DATABASE_TYPES.POSTGRESQL) {
    return { success: true, message: "In-memory mode active" };
  }

  const existing = await verifyRequiredTables();
  if (!existing.success) {
    return createTables();
  }

  return { success: true, message: "Database schema already initialized" };
}

async function shutdown() {
  return disconnectDatabase();
}

module.exports = {
  DATABASE_TYPES,
  DB_TYPE,
  IS_PRODUCTION,
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  getDatabaseClient,
  query,
  testConnection,
  createTables,
  verifyRequiredTables,
  ensureSchema,
  shutdown,
  get pool() {
    return pool;
  },
};