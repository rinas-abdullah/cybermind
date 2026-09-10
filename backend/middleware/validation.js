const { z } = require("zod");
const { VALIDATION_RULES } = require("../config/constants");
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function createValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
    timestamp: new Date().toISOString(),
  });
}

function normalizeString(value, maxLength = 200) {
  if (typeof value !== "string") return value;
  return value.trim().slice(0, maxLength);
}

function sanitizeValue(value, depth = 0) {
  if (depth > 10) return null;

  if (typeof value === "string") {
    return normalizeString(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitizeValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const sanitized = {};

    for (const [key, val] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key)) continue;
      sanitized[key] = sanitizeValue(val, depth + 1);
    }

    return sanitized;
  }

  return value;
}

function sanitizeInterests(interests) {
  if (!Array.isArray(interests)) return [];

  return [
    ...new Set(
      interests
        .filter((item) => typeof item === "string")
        .map((item) => normalizeString(item, 40))
        .filter(Boolean)
        .slice(0, 20)
    ),
  ];
}

function createSchemaValidator(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (!result.success) {
      const errors = result.error.issues.map((error) => {
        const path = error.path.length ? error.path.join(".") : "body";
        return `${path}: ${error.message}`;
      });
      return createValidationError(res, errors);
    }

    req.body = result.data;
    next();
  };
}

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(VALIDATION_RULES.EMAIL.MAX_LENGTH, "Email is too long")
    .email("Email must be valid"),
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
});

const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(VALIDATION_RULES.USERNAME.MIN_LENGTH, `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`)
      .max(VALIDATION_RULES.USERNAME.MAX_LENGTH, `Username must be at most ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`)
      .regex(VALIDATION_RULES.USERNAME.PATTERN, "Username may only contain letters, numbers, or underscores"),
    email: z
      .string()
      .trim()
      .max(VALIDATION_RULES.EMAIL.MAX_LENGTH, "Email is too long")
      .email("Email must be valid"),
    password: z
      .string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`)
      .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH, `Password must be at most ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`)
      .refine((value) => /[A-Z]/.test(value), "Password must include at least one uppercase letter")
      .refine((value) => /[a-z]/.test(value), "Password must include at least one lowercase letter")
      .refine((value) => /[0-9]/.test(value), "Password must include at least one number")
      .refine((value) => /[^A-Za-z0-9]/.test(value), "Password must include at least one special character"),
    skillLevel: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) =>
          !value || ["beginner", "intermediate", "advanced"].includes(value.toLowerCase()),
        "Skill level must be beginner, intermediate, or advanced"
      ),
    interests: z.array(z.string().trim().max(40)).optional(),
  })
  .strict();

const profileUpdateSchema = z
  .object({
    institution_id: z
      .union([z.string().trim(), z.number()])
      .optional()
      .transform((value) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : undefined;
      }),
    bio: z.string().trim().max(VALIDATION_RULES.BIO.MAX_LENGTH).optional(),
    interests: z.array(z.string().trim().max(40)).optional(),
    skillLevel: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) =>
          !value || ["beginner", "intermediate", "advanced"].includes(value.toLowerCase()),
        "Skill level must be beginner, intermediate, or advanced"
      ),
  })
  .strict();

const scoreUpdateSchema = z.object({
  amount: z.number().int().min(-1000).max(1000),
});

const aiMentorSchema = z
  .object({
    question: z.string().trim().min(1, "Question is required").max(3000),
    context: z.string().trim().max(100).optional(),
  })
  .strict();

const aiQuerySchema = z
  .object({
    prompt: z.string().trim().min(1, "Prompt is required").max(4000),
    model: z.string().trim().optional(),
  })
  .strict();

const processAttemptSchema = z
  .object({
    scenarioId: z.string().trim().min(1).max(100),
    score: z.number().int().min(0).max(1000).optional(),
    timeSpent: z.number().int().min(0).max(86400).optional(),
    incorrectAnswers: z.array(z.string().trim().max(200)).optional(),
    behavioralData: z.record(z.any()).optional(),
  })
  .strict();

const progressCompletionSchema = z
  .object({
    scenarioId: z.string().trim().min(1).max(100),
    score: z.number().int().min(0).max(1000).optional(),
    timeSpent: z.number().int().min(0).max(86400).optional(),
  })
  .strict();

const scenarioGenerateSchema = z
  .object({
    scenarioId: z.string().trim().min(1).max(100),
    basePrompt: z.string().trim().min(1).max(1000),
  })
  .strict();

const scenarioAttemptSchema = z
  .object({
    sessionId: z.string().trim().min(1).max(100),
    scenarioId: z.string().trim().min(1).max(100),
    userResponse: z.string().trim().min(1).max(2000),
    isCorrect: z.boolean(),
    responseTime: z.number().int().min(0).max(86400),
  })
  .strict();

const labBehaviorEventSchema = z
  .object({
    labId: z.union([z.string().trim().min(1).max(100), z.number().int()]),
    durationMs: z.number().int().min(0).max(4 * 60 * 60 * 1000),
    hintsUsed: z.number().int().min(0).max(1000),
    wrongAttempts: z.number().int().min(0).max(1000),
    commandCount: z.number().int().min(0).max(1000),
    uniqueCommandCount: z.number().int().min(0).max(1000),
  })
  .strict();

const adversaryDefendSchema = z
  .object({
    sessionId: z.string().trim().min(1).max(100),
    defenseId: z.string().trim().min(1).max(100),
  })
  .strict();

const pressureAttemptSchema = z
  .object({
    labId: z.union([z.string().trim().min(1).max(100), z.number().int()]),
    timeLimitMs: z.number().int().min(1).max(60 * 60 * 1000),
    completed: z.boolean(),
    remainingMs: z.number().int().min(0).max(60 * 60 * 1000).nullable().optional(),
  })
  .strict();

/**
 * General request normalization middleware
 * Trims strings, limits nesting, removes dangerous keys.
 */
function sanitizeRequest(req, res, next) {
  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  next();
}

module.exports = {
  sanitizeRequest,
  validateScoreUpdate: createSchemaValidator(scoreUpdateSchema),
  validateLogin: createSchemaValidator(loginSchema),
  validateRegister: createSchemaValidator(registerSchema),
  validateProfileUpdate: createSchemaValidator(profileUpdateSchema),
  validateAiMentorRequest: createSchemaValidator(aiMentorSchema),
  validateAiQuery: createSchemaValidator(aiQuerySchema),
  validateProcessAttempt: createSchemaValidator(processAttemptSchema),
  validateProgressCompletion: createSchemaValidator(progressCompletionSchema),
  validateScenarioGenerate: createSchemaValidator(scenarioGenerateSchema),
  validateScenarioAttempt: createSchemaValidator(scenarioAttemptSchema),
  validateLabBehaviorEvent: createSchemaValidator(labBehaviorEventSchema),
  validateAdversaryDefend: createSchemaValidator(adversaryDefendSchema),
  validatePressureAttempt: createSchemaValidator(pressureAttemptSchema),
};
