const express = require("express");
const cors = require("cors");
const path = require("path");

// ===== CONFIGURATION & UTILITIES =====
const config = require("./config/environment");
const logger = require("./utils/logger");
const { ROUTES } = require("./constants/appConstants");

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

// ===== MIDDLEWARE =====
app.use(cors(config.cors));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeRequest);
app.use(logger.requestLogger.bind(logger));

// ===== STATIC FILE SERVING =====
app.use(express.static(rootPath));

// ===== API ROUTES =====
app.use("/api", apiRoutes);

// ===== PAGE ROUTES =====

// Home page -> Dashboard
app.get(ROUTES.HOME, (req, res) => {
  res.sendFile(path.join(rootPath, "frontend/pages/dashboard.html"));
});

// Dashboard page
app.get(ROUTES.DASHBOARD, (req, res) => {
  res.sendFile(path.join(rootPath, "frontend/pages/dashboard.html"));
});

// Training page
app.get(ROUTES.TRAINING, (req, res) => {
  res.sendFile(path.join(rootPath, "frontend/pages/training.html"));
});

// Terminal page
app.get(ROUTES.TERMINAL, (req, res) => {
  res.sendFile(path.join(rootPath, "frontend/pages/terminal.html"));
});

// Leaderboard page
app.get(ROUTES.LEADERBOARD, (req, res) => {
  res.sendFile(path.join(rootPath, "frontend/pages/leaderboard.html"));
});

// Optional admin page
app.get(ROUTES.ADMIN, (req, res, next) => {
  const adminPage = path.join(rootPath, "frontend/pages/admin.html");
  res.sendFile(adminPage, (err) => {
    if (err) next();
  });
});

// ===== LEGACY ROUTES =====

app.get("/index", (req, res) => {
  res.redirect(ROUTES.DASHBOARD);
});

app.get("/index.html", (req, res) => {
  res.redirect(ROUTES.DASHBOARD);
});

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== SERVER STARTUP =====
const server = app.listen(config.port, () => {
  logger.info("CyberMind server started successfully", {
    port: config.port,
    environment: config.nodeEnv,
    database: config.database?.type || "in-memory",
  });

  console.log(`🔥 Server running on http://localhost:${config.port}`);
  console.log("📊 Using in-memory data (temporary)");
  console.log("🗄️ Ready for database integration");
});

server.on("error", (error) => {
  logger.error("Server startup failed", { error: error.message });
  console.error("Server failed to start:", error.message);
});