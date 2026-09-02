const { URL } = require("url");

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

function sanitizeScenarioId(value) {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

function sanitizeQuestion(value) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

function sanitizeContext(value) {
  const context = typeof value === "string" ? value.trim().slice(0, 100) : "";
  return context || "training";
}

function clampNumber(value, min, max, fallback = min) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function parseJsonString(value, fallback = {}) {
  if (typeof value !== "string" || value.trim() === "") return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

function normalizeOrigin(origin) {
  if (!origin || typeof origin !== "string") return "";
  try {
    const url = new URL(origin.trim());
    return `${url.protocol}//${url.host}`;
  } catch {
    return origin.trim().replace(/\/\/*$/, "");
  }
}

module.exports = {
  normalizeUsername,
  sanitizeScenarioId,
  sanitizeQuestion,
  sanitizeContext,
  clampNumber,
  parseJsonString,
  normalizeOrigin,
};
