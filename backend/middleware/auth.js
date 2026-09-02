const jwt = require("jsonwebtoken");
const { config } = require("../config/environment");
const { USER_ROLES } = require("../config/constants");

const DEFAULT_ROLE = USER_ROLES.LEARNER;
const JWT_ALGORITHM = "HS256";
const MIN_SECRET_LENGTH = 32;

function getJwtConfig() {
  const secret =
    config?.security?.jwt?.secret ||
    process.env.JWT_SECRET ||
    "";

  const expiresIn =
    config?.security?.jwt?.expiresIn ||
    process.env.JWT_EXPIRES_IN ||
    "24h";

  if (
    !secret ||
    typeof secret !== "string" ||
    secret.trim().length < MIN_SECRET_LENGTH
  ) {
    throw new Error("JWT secret is missing or too weak");
  }

  return {
    secret: secret.trim(),
    expiresIn,
    algorithm: JWT_ALGORITHM,
  };
}

function normalizeRole(role) {
  if (typeof role !== "string") return DEFAULT_ROLE;

  const normalized = role.trim().toLowerCase();

  if (!normalized) return DEFAULT_ROLE;
  if (!Object.values(USER_ROLES).includes(normalized)) {
    return DEFAULT_ROLE;
  }

  return normalized;
}

function extractBearerToken(req) {
  const authHeader = req?.headers?.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token || null;
}

function mapDecodedUser(decoded) {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }

  return {
    userId: decoded.userId ?? decoded.id ?? null,
    username: decoded.username ?? null,
    role: normalizeRole(decoded.role),
    institution_id: decoded.institution_id ?? null,
  };
}

function verifyToken(token) {
  const jwtConfig = getJwtConfig();

  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Token is required");
  }

  const decoded = jwt.verify(token.trim(), jwtConfig.secret, {
    algorithms: [jwtConfig.algorithm],
  });

  const user = mapDecodedUser(decoded);

  if (!user || !user.userId || !user.username) {
    throw new Error("Invalid token payload");
  }

  return user;
}

function decodeTokenSafely(token) {
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = verifyToken(token);
    req.user = user;

    return next();
  } catch (error) {
    const isConfigError =
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("jwt secret");

    if (isConfigError) {
      console.error("JWT configuration error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Authentication system misconfigured",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

function optionalAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    req.user = decodeTokenSafely(token);
    return next();
  } catch {
    req.user = null;
    return next();
  }
}

function requireRole(...allowedRoles) {
  const normalizedRoles = allowedRoles
    .map((role) => normalizeRole(role))
    .filter(Boolean);

  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    return next();
  };
}

function issueToken(payload = {}) {
  const jwtConfig = getJwtConfig();

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Token payload must be an object");
  }

  const safePayload = {
    userId: payload.userId ?? payload.id ?? null,
    username:
      typeof payload.username === "string"
        ? payload.username.trim()
        : null,
    role: normalizeRole(payload.role),
    institution_id: payload.institution_id ?? null,
  };

  if (!safePayload.userId || !safePayload.username) {
    throw new Error("Token payload must include userId and username");
  }

  return jwt.sign(safePayload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm,
  });
}

module.exports = {
  extractBearerToken,
  verifyToken,
  decodeTokenSafely,
  requireAuth,
  optionalAuth,
  requireRole,
  issueToken,
};