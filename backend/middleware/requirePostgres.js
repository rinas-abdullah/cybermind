const db = require("../db");

// Guards routes that need real relational tables which only exist when
// DB_TYPE=postgresql with the schema applied (see setup_db.sql / db.js
// createTables()). Without this, such routes would 500 with a raw
// "relation does not exist" error when running in in-memory mode.
function requirePostgres(req, res, next) {
  if (db.DB_TYPE !== db.DATABASE_TYPES.POSTGRESQL) {
    return res.status(503).json({
      success: false,
      message:
        "This feature requires a configured PostgreSQL database (set DATABASE_URL and DB_TYPE=postgresql). Not available in in-memory mode.",
    });
  }
  return next();
}

module.exports = { requirePostgres };
