const OpenAI = require("openai");
const { config } = require("../../config/environment");
const MockOpenAI = require("./mockAiService");

const DEFAULT_AI_MODEL = "gpt-4o-mini";
const ALLOWED_AI_MODELS = new Set(["gpt-4.1-mini", "gpt-4o-mini"]);

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  const isPlaceholder = !apiKey || apiKey.trim() === "" || apiKey.includes("your-openai-api-key") || apiKey === "sk-your-openai-api-key-here";

  if (isPlaceholder) {
    console.log("[aiProvider] Enforcing MockOpenAI fallback due to placeholder or missing API key.");
    return new MockOpenAI();
  }

  try {
    return new OpenAI({ apiKey });
  } catch (err) {
    console.warn("[aiProvider] Failed to initialize OpenAI SDK client, falling back to MockOpenAI:", err.message);
    return new MockOpenAI();
  }
}

function getAllowedAiModel(requestedModel) {
  const model = typeof requestedModel === "string" ? requestedModel.trim() : DEFAULT_AI_MODEL;
  const targetModel = ALLOWED_AI_MODELS.has(model) ? model : DEFAULT_AI_MODEL;
  if (targetModel === "gpt-4.1-mini") {
    return "gpt-4o-mini";
  }
  return targetModel;
}

module.exports = {
  getOpenAIClient,
  getAllowedAiModel,
  getAiClient: getOpenAIClient,
  selectModel: getAllowedAiModel,
};

