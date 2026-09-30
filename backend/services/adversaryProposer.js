// Language-model layer over the guardian engine.
//
// The model never executes anything and never sees anything outside the
// simulator's own move catalog. It receives the guardian-approved candidate
// moves (ids, MITRE ids, stage names) plus a summary of the trainee's
// defenses, and may pick ONE id from that list with a short rationale. The
// guardian (adversaryEngine.applyDefense) discards any answer that is not in
// the candidate list, and the engine plays its own choice whenever the model
// is disabled, slow, unavailable or wrong.
//
// Enabled only when a real OPENAI_API_KEY is configured and
// ADVERSARY_LLM is not "off".

const OpenAI = require("openai");

const TIMEOUT_MS = Number(process.env.ADVERSARY_LLM_TIMEOUT_MS) || 3000;
const MODEL = process.env.ADVERSARY_LLM_MODEL || "gpt-4o-mini";

function isPlaceholderKey(key) {
  return !key || !key.trim() || key.includes("your-openai-api-key") || key === "sk-your-openai-api-key-here";
}

let client = null;
function getClient() {
  if (process.env.ADVERSARY_LLM === "off") return null;
  if (isPlaceholderKey(process.env.OPENAI_API_KEY)) return null;
  if (!client) {
    try {
      client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } catch {
      client = null;
    }
  }
  return client;
}

function isEnabled() {
  return Boolean(getClient());
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);
}

/**
 * @param {Array<{id:string,category:string,mitre:string,tier:number}>} candidates guardian-approved moves
 * @param {{defensesActive:string[], lastDefense:string, focus:string[], movesSoFar:string[]}} context
 * @returns {Promise<{moveId:string, rationale:{en:string,ar:string}}|null>}
 */
async function proposeNextMove(candidates, context) {
  const ai = getClient();
  if (!ai || !Array.isArray(candidates) || candidates.length < 2) return null;

  const system =
    "You are the scenario-planning module of a defensive cybersecurity TRAINING SIMULATOR used to train SOC analysts. " +
    "You choose which pre-defined, fictional exercise step the simulated opponent plays next, so the trainee practises the right skills. " +
    "You must pick exactly one id from the provided list, prefer steps in the trainee's weak stages, and keep a plausible attack-stage order. " +
    'Reply with JSON only: {"moveId": "...", "rationale_en": "one sentence", "rationale_ar": "جملة واحدة"}. ' +
    "Never provide operational attack instructions; rationales describe training intent only.";

  const user = JSON.stringify({
    candidates: candidates.map((m) => ({ id: m.id, stage: m.category, mitre: m.mitre, tier: m.tier })),
    trainee: {
      defensesDeployed: context.defensesActive,
      lastDefense: context.lastDefense,
      weakStages: context.focus,
      stepsSoFar: context.movesSoFar,
    },
  });

  try {
    const res = await withTimeout(
      ai.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 160,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      TIMEOUT_MS
    );
    const text = res?.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!candidates.some((m) => m.id === parsed.moveId)) return null; // guardian check #1 (engine re-checks)
    const clip = (s) => String(s || "").slice(0, 240);
    return {
      moveId: parsed.moveId,
      rationale: { en: clip(parsed.rationale_en), ar: clip(parsed.rationale_ar) || clip(parsed.rationale_en) },
    };
  } catch (err) {
    console.warn("[adversaryProposer] falling back to guardian engine:", err.message);
    return null;
  }
}

module.exports = { proposeNextMove, isEnabled };
