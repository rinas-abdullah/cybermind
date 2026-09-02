const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
// ===== CONFIGURATION & UTILITIES =====
const envModule = require("./config/environment");
const config = envModule.config || envModule;
const validateConfig =
  typeof envModule.validateConfig === "function"
    ? envModule.validateConfig
    : null;

const logger = require("./utils/logger");
const { ROUTES } = require("./config/constants");
const db = require("./db");

// ===== MIDDLEWARE =====
const { sanitizeRequest } = require("./middleware/validation");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler");

// ===== ROUTES =====
const apiRoutes = require("./routes/api");

const app = express();

// ===== PATH CONFIGURATION =====
const rootPath = path.resolve(__dirname, "..");
const pagesPath = path.join(rootPath, "frontend", "pages");

// ===== EXPRESS SETTINGS =====
if (config.server?.trustProxy) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

// ===== HELPERS =====
function getSafeCorsOrigin(originConfig) {
  if (!originConfig || originConfig.length === 0) {
    return false;
  }
  return originConfig;
}

function sendPage(res, pageFileName, next) {
  const filePath = path.join(pagesPath, pageFileName);

  res.sendFile(filePath, (err) => {
    if (err && typeof next === "function") {
      next(err);
    }
  });
}

// ===== VALIDATE CONFIG =====
if (validateConfig) {
  validateConfig();
}

// ===== GLOBAL MIDDLEWARE =====
app.use(
  cors({
    origin: getSafeCorsOrigin(config.cors?.origins),
    credentials: config.cors?.credentials,
  })
);
app.use(helmet());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeRequest);
app.use(logger.requestLogger.bind(logger));

// ===== STATIC FILE SERVING =====
app.use(express.static(rootPath));
app.use("/css", express.static(path.join(rootPath, "css")));
app.use("/js", express.static(path.join(rootPath, "js")));
app.use("/frontend", express.static(path.join(rootPath, "frontend")));

// ===== API ROUTES =====
app.use(ROUTES.API.PREFIX, apiRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    requestId: req.requestId || null,
  });
});

app.get("/status", (req, res) => {
  res.status(200).json({
    success: true,
    environment: config.server?.nodeEnv || "development",
    database: config.database?.type || "in-memory",
    requestId: req.requestId || null,
  });
});

// ===== PAGE ROUTES =====

// Home page -> always public
app.get(ROUTES.PAGES.HOME, (req, res, next) => {
  res.sendFile(path.join(rootPath, "index.html"), (err) => {
    if (err) next(err);
  });
});

// Auth page -> public
app.get(["/login", "/auth", "/auth.html"], (req, res, next) => {
  sendPage(res, "auth.html", next);
});

// Dashboard — HTML shell is public; auth is enforced client-side + on /api routes
app.get(ROUTES.PAGES.DASHBOARD, (req, res, next) => {
  sendPage(res, "dashboard.html", next);
});

// Learn -> public preview page
app.get(ROUTES.PAGES.LEARNING, (req, res, next) => {
  sendPage(res, "learn.html", next);
});

// Practice -> public preview page
app.get(ROUTES.PAGES.PRACTICE, (req, res, next) => {
  sendPage(res, "practice.html", next);
});

// Training -> public page for now
app.get(ROUTES.PAGES.TRAINING, (req, res, next) => {
  sendPage(res, "training.html", next);
});

// Terminal -> public preview page
app.get(ROUTES.PAGES.TERMINAL, (req, res, next) => {
  sendPage(res, "terminal.html", next);
});

// Leaderboard -> public
app.get(ROUTES.PAGES.LEADERBOARD, (req, res, next) => {
  sendPage(res, "leaderboard.html", next);
});

// Analyze Scenario -> public
app.get(ROUTES.PAGES.ANALYZE_SCENARIO, (req, res, next) => {
  sendPage(res, "analyze-scenario.html", next);
});

// Learner Profile -> public
app.get(ROUTES.PAGES.LEARNER_PROFILE, (req, res, next) => {
  sendPage(res, "learner-profile.html", next);
});

// AI Insights -> public
app.get(ROUTES.PAGES.AI_INSIGHTS, (req, res, next) => {
  sendPage(res, "ai-insights.html", next);
});

// Analytics -> public
app.get(ROUTES.PAGES.ANALYTICS, (req, res, next) => {
  sendPage(res, "analytics.html", next);
});

// Admin — same pattern as dashboard (client-side + API auth)
app.get(ROUTES.PAGES.ADMIN, (req, res, next) => {
  sendPage(res, "admin.html", next);
});

// Profile page uses learner profile UI (no standalone profile.html in repo)
app.get(ROUTES.PAGES.PROFILE || "/profile", (req, res, next) => {
  sendPage(res, "learner-profile.html", next);
});

// ===== LEGACY ROUTES =====
app.get("/index", (req, res) => {
  res.redirect(ROUTES.PAGES.HOME);
});

app.get("/index.html", (req, res) => {
  res.redirect(ROUTES.PAGES.HOME);
});

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== SERVER STARTUP =====
async function startServer() {
  try {
    if (db.DB_TYPE === "postgresql") {
      await db.createTables();
    }

    const preferredPort = config.server?.port || 3001;
    const host = config.server?.host || "127.0.0.1";
    const portRetries = config.server?.isDevelopment ? 15 : 0;

    const server = http.createServer(app);

    const listenOn = (tryPort, retriesLeft) => {
      const onError = (error) => {
        server.removeListener("error", onError);
        if (error.code === "EADDRINUSE" && retriesLeft > 0) {
          const nextPort = tryPort + 1;
          console.warn(`Port ${tryPort} is in use, trying ${nextPort}...`);
          listenOn(nextPort, retriesLeft - 1);
          return;
        }
        logger.error("Server startup failed", { error: error.message });
        logger.error("Server failed to start", {
          error: error.message,
          code: error.code,
        });
        if (error.code === "EADDRINUSE") {
          console.error(
            "Free that port, stop the other Node process, or set PORT in .env to a free port."
          );
        }
        process.exit(1);
      };

      server.once("error", onError);
      server.listen(tryPort, host, () => {
        server.removeListener("error", onError);
        if (tryPort !== preferredPort && config.server?.isDevelopment) {
          console.warn(
            `\n⚠️  Using port ${tryPort} because ${preferredPort} was busy. Set PORT=${tryPort} in .env to make this explicit.\n`
          );
        }
        logger.info("CyberMind server started successfully", {
          port: tryPort,
          host,
          environment: config.server?.nodeEnv || "development",
          database: config.database?.type || "in-memory",
          corsOrigins: config.cors?.origins || [],
        });

        console.log(`🔥 Server running on http://${host}:${tryPort}`);
        console.log(`🌍 Environment: ${config.server?.nodeEnv || "development"}`);
        console.log(`🗄️ Database mode: ${config.database?.type || "in-memory"}`);
      });
    };

    listenOn(preferredPort, portRetries);

    return server;
  } catch (error) {
    logger.error("Failed to initialize database", {
      error: error.message,
      stack: error.stack,
    });
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  }
}

startServer();

module.exports = {
  app,
  startServer,
};