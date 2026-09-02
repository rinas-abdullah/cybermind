const bcrypt = require("bcrypt");
const db = require("../db");
const { issueToken } = require("../middleware/auth");
const { VALIDATION_RULES, USER_ROLES } = require("../config/constants");

const SALT_ROUNDS = 12;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return VALIDATION_RULES.USERNAME.PATTERN.test(username);
}

function validateRegistrationInput({ username, email, password }) {
  const errors = [];

  if (!username || !email || !password) {
    errors.push("Username, email, and password are required");
    return errors;
  }

  if (
    username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH ||
    username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH
  ) {
    errors.push(
      `Username must be between ${VALIDATION_RULES.USERNAME.MIN_LENGTH} and ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`
    );
  }

  if (!isValidUsername(username)) {
    errors.push("Username may only contain letters, numbers, and underscores");
  }

  if (!isValidEmail(email)) {
    errors.push("Email format is invalid");
  }

  if (
    password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH ||
    password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH
  ) {
    errors.push(
      `Password must be between ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} and ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`
    );
  }

  if (VALIDATION_RULES.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter");
  }

  if (VALIDATION_RULES.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter");
  }

  if (VALIDATION_RULES.PASSWORD.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push("Password must include at least one number");
  }

  return errors;
}

async function register(req, res) {
  try {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const institutionId = req.body.institution_id || null;

    const validationErrors = validateRegistrationInput({
      username,
      email,
      password,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0],
        errors: validationErrors,
      });
    }

    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const roleResult = await db.query(
      "SELECT id, name FROM roles WHERE name = $1 LIMIT 1",
      [USER_ROLES.LEARNER]
    );

    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Default role not found",
      });
    }

    const role = roleResult.rows[0];

    const newUser = await db.query(
      `INSERT INTO users (username, email, password_hash, role_id, institution_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, institution_id`,
      [username, email, passwordHash, role.id, institutionId]
    );

    const user = newUser.rows[0];

    const token = issueToken({
      userId: user.id,
      username: user.username,
      role: role.name,
      institution_id: user.institution_id,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          institution_id: user.institution_id,
        },
        token,
      },
    });
  } catch (error) {
    console.error("[auth.register] Error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const userResult = await db.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.password_hash,
         u.institution_id,
         r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1 AND u.is_active = true
       LIMIT 1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = issueToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      institution_id: user.institution_id,
    });

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          institution_id: user.institution_id,
        },
        token,
      },
    });
  } catch (error) {
    console.error("[auth.login] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function logout(req, res) {
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}

async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    let userResult;

    try {
      userResult = await db.query(
        `SELECT
           u.id,
           u.username,
           u.email,
           u.institution_id,
           r.name AS role,
           i.name AS institution_name,
           tr.content AS technical_resume
         FROM users u
         JOIN roles r ON u.role_id = r.id
         LEFT JOIN institutions i ON u.institution_id = i.id
         LEFT JOIN LATERAL (
           SELECT content
           FROM ai_technical_resumes
           WHERE user_id = u.id
           ORDER BY generated_at DESC
           LIMIT 1
         ) tr ON TRUE
         WHERE u.id = $1
         LIMIT 1`,
        [userId]
      );
    } catch (error) {
      console.warn(
        "[auth.getProfile] Optional tables not available, using basic profile query:",
        error.message
      );

      userResult = await db.query(
        `SELECT
           u.id,
           u.username,
           u.email,
           u.institution_id,
           r.name AS role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1
         LIMIT 1`,
        [userId]
      );
    }

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          institution_id: user.institution_id || null,
          institution_name: user.institution_name || null,
          technical_resume: user.technical_resume || null,
        },
      },
    });
  } catch (error) {
    console.error("[auth.getProfile] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function updateProfile(req, res) {
  try {
    const { username } = req.params;
    if (req.user.username !== username && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own profile",
      });
    }

    const { institution_id, bio, interests, skillLevel } = req.body;

    if (institution_id !== undefined) {
      await db.query(
        "UPDATE users SET institution_id = $1, updated_at = NOW() WHERE id = $2",
        [institution_id, req.user.userId]
      );
    }

    const LearnerProfileService = require("../services/ai/learnerProfileService");
    const learnerProfileService = new LearnerProfileService();
    const profile = await learnerProfileService.getLearnerProfile(String(req.user.userId));

    if (profile) {
      if (bio !== undefined) profile.bio = bio;
      if (interests !== undefined) profile.interests = interests;
      if (skillLevel !== undefined) profile.skillLevel = skillLevel;
      
      await learnerProfileService.updateLearnerProfile(String(req.user.userId), profile);
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: req.user.userId,
          username,
          institution_id: institution_id !== undefined ? institution_id : req.user.institution_id,
          bio,
          interests,
          skillLevel,
        }
      }
    });
  } catch (error) {
    console.error("[auth.updateProfile] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
};