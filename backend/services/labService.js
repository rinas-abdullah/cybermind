// Server-side lab engine — the authority for the terminal labs.
//
// The browser used to hold every flag, track its own completion in
// localStorage and POST whatever XP it liked to /api/update-score. That made
// the whole progression system client-trusted. This service moves all of it
// server-side: the browser sends commands, and the server decides what the
// output is, whether a flag is correct, whether the adversary is contained,
// how much XP is earned (once per lab per user) and whether a Pressure Mode
// run beat the clock. Every fact the readiness index is later computed from
// (training_runs, lab_behavior_events, pressure_attempts) is therefore
// observed by the server, never asserted by the page.
//
// Attempt state is per-process and transient (same rationale as
// adversaryEngine's sessions) — a single lab run is not data that needs to
// survive a restart. Finished runs ARE persisted, by data/trainingRuns.js.

const crypto = require("crypto");
const {
  getLab,
  publicLab,
  listLabs,
  PRESSURE_TIME_LIMITS_MS,
  PRESSURE_BONUS_RATE,
  LAB_XP,
} = require("../data/labs");
const adversaryEngine = require("./adversaryEngine");
const adversaryProposer = require("./adversaryProposer");
const readinessService = require("./readinessService");
const pointsService = require("./pointsService");
const trainingRuns = require("../data/trainingRuns");
const behaviorEvents = require("../data/behaviorEvents");
const pressureAttempts = require("../data/pressureAttempts");

const DEFAULT_PRESSURE_MS = 6 * 60 * 1000;
const MAX_ATTEMPTS = 5000;

// Defensive commands the trainee can type in the adversary lab, mapped to the
// engine's internal defense ids. This mapping used to live in terminal.html;
// it belongs on the server so the client only ever names a command.
const DEFENSE_COMMANDS = {
  "close-port": "close_port",
  "enable-mfa": "enable_mfa",
  "enable-email-filtering": "email_filtering",
  "enable-av": "enable_av",
  "enable-edr": "edr_behavioral",
  "disable-scheduled-tasks": "disable_scheduled_tasks",
  "disconnect-internet": "disconnect_internet",
  "isolate-host": "isolate_host",
  "segment-network": "network_segmentation",
  "enable-credential-guard": "credential_guard",
  "enable-dns-filtering": "dns_filtering",
  "enable-dlp": "dlp",
};

// attemptId -> attempt state
const attempts = new Map();

function evictOld() {
  while (attempts.size > MAX_ATTEMPTS) {
    const oldest = attempts.keys().next().value;
    attempts.delete(oldest);
  }
}

function pressureLimitFor(lab) {
  return PRESSURE_TIME_LIMITS_MS[lab.difficulty] || DEFAULT_PRESSURE_MS;
}

function getOwnedAttempt(attemptId, userId) {
  const attempt = attempts.get(attemptId);
  if (!attempt) return null;
  if (String(attempt.userId) !== String(userId)) return null;
  return attempt;
}

function newBehavior() {
  return { commandCount: 0, uniqueCommands: new Set(), hintsUsed: 0, wrongAttempts: 0 };
}

// ---- pure helpers (unit-tested directly) ----------------------------------

// XP for finishing a lab. The Pressure bonus is only granted when the run is
// still inside the server-recorded deadline — the browser's own countdown is
// cosmetic and cannot buy the bonus after time is actually up.
function computeAwardXp(baseXp, pressure, now = Date.now()) {
  const beatClock = Boolean(pressure && pressure.deadline && now <= pressure.deadline);
  const bonus = beatClock ? Math.round(baseXp * PRESSURE_BONUS_RATE) : 0;
  return { xp: baseXp + bonus, bonus, beatClock };
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Length of the longest strictly-increasing subsequence — used to reward a
// forensic timeline that is in the right relative order even if a step or two
// is missing.
function longestIncreasingLength(nums) {
  const tails = [];
  for (const n of nums) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < n) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = n;
  }
  return tails.length;
}

// Scores a trainee's investigation on a 0-100 scale from three parts:
//   detection  (50) — did they identify the techniques that actually happened
//   order      (30) — did they reconstruct the sequence correctly
//   entryPoint (20) — did they name the real initial-access technique
// Pure and side-effect free so it can be unit-tested directly.
function scoreForensics(realOrder, selected, entryPoint) {
  const realSet = new Set(realOrder);
  const sel = [...new Set((selected || []).filter(Boolean))];
  const truePos = sel.filter((id) => realSet.has(id));

  const precision = sel.length ? truePos.length / sel.length : 0;
  const recall = realOrder.length ? truePos.length / realOrder.length : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const detection = 50 * f1;

  const ranks = truePos.map((id) => realOrder.indexOf(id));
  const lis = realOrder.length ? longestIncreasingLength(ranks) : 0;
  const order = realOrder.length ? 30 * (lis / realOrder.length) : 0;

  const entry = entryPoint && realOrder.length && entryPoint === realOrder[0] ? 20 : 0;

  return {
    score: Math.round(Math.min(100, detection + order + entry)),
    detection: Math.round(detection),
    order: Math.round(order),
    entryPoint: entry,
    precision: Number(precision.toFixed(2)),
    recall: Number(recall.toFixed(2)),
  };
}

// ---- lab listing ----------------------------------------------------------

async function listForUser(userId, lang = "en") {
  return {
    labs: listLabs(lang),
    completed: await trainingRuns.getCompletedLabIds(userId),
  };
}

// ---- starting an attempt --------------------------------------------------

async function startAttempt(user, labId, options = {}) {
  const lab = getLab(labId);
  if (!lab) return null;

  const lang = options.lang === "ar" ? "ar" : "en";
  const usePressure = Boolean(options.pressureMode);
  const timeLimitMs = pressureLimitFor(lab);

  const attemptId = crypto.randomUUID();
  const attempt = {
    attemptId,
    userId: String(user.userId),
    username: user.username,
    labId: Number(labId),
    difficulty: lab.difficulty,
    startedAt: Date.now(),
    pressure: usePressure ? { timeLimitMs, deadline: Date.now() + timeLimitMs } : null,
    behavior: newBehavior(),
    adversarySessionId: null,
    adversaryContained: false,
    lastRunId: null,
  };

  const result = {
    attemptId,
    lab: publicLab(labId, lang),
    pressure: usePressure ? { timeLimitMs } : null,
    adversary: null,
  };

  if (lab.isAdversary) {
    // Weak-point targeting: the adversary reaches this trainee's weakest
    // attack stages earlier (readinessService derives them from past runs).
    const focus = await readinessService.getWeakStages(user.userId);
    const session = adversaryEngine.startSession(user.userId, { focus });
    attempt.adversarySessionId = session.sessionId;
    result.adversary = { move: session.move, rationale: session.rationale, focus: session.focus };
  }

  attempts.set(attemptId, attempt);
  evictOld();
  return result;
}

// ---- running a command ----------------------------------------------------

function splitLines(text) {
  return String(text).replace(/&nbsp;/g, " ").split("\n");
}

function asLines(text, kind) {
  return splitLines(text).map((t) => ({ text: t, kind }));
}

function interpretLabCommand(lab, clean, lower) {
  const cmds = lab.commands || {};

  if (lower.startsWith("nmap")) {
    const parts = lower.split(/\s+/);
    const ip = parts[1] || "";
    if (ip === "10.0.4.15" && cmds["nmap 10.0.4.15"]) return asLines(cmds["nmap 10.0.4.15"], "success");
    if (!ip) return [{ text: "nmap: missing host parameter. Try: nmap 10.0.4.15", kind: "error" }];
    return [
      { text: "Starting Nmap scan...", kind: "error" },
      { text: `Nmap scan report for ${parts[1]}`, kind: "error" },
      { text: "Host is up, but all 1000 scanned ports are filtered/closed.", kind: "error" },
    ];
  }

  if (lower.startsWith("cat ")) {
    const file = clean.slice(4).trim();
    if (cmds[`cat ${file}`]) return asLines(cmds[`cat ${file}`], "data");
    return [{ text: `cat: ${file}: No such file or directory`, kind: "error" }];
  }

  if (cmds[lower]) return asLines(cmds[lower], "data");
  if (cmds[clean]) return asLines(cmds[clean], "data");

  return [
    {
      text: `bash: ${clean.split(" ")[0]}: command or options not supported in this lab scenario. Type 'help' to review scope.`,
      kind: "error",
    },
  ];
}

async function runCommand(user, attemptId, rawCommand, lang = "en") {
  const attempt = getOwnedAttempt(attemptId, user.userId);
  if (!attempt) return null;

  const lab = getLab(attempt.labId);
  const clean = String(rawCommand || "").trim();
  const lower = clean.toLowerCase();
  if (!clean) return { lines: [] };

  attempt.behavior.commandCount += 1;
  attempt.behavior.uniqueCommands.add(lower);

  if (lower === "clear") return { lines: [], action: "clear" };

  if (lab.isAdversary) return runAdversaryCommand(user, attempt, clean, lower, lang);

  if (lower.startsWith("submit ")) {
    const flag = clean.slice(7).trim();
    const res = await submitFlagInternal(user, attempt, flag);
    return { lines: res.lines, submit: res };
  }

  if (lower === "hint") {
    attempt.behavior.hintsUsed += 1;
    return { lines: [{ text: `💡 ${lab.hint}`, kind: "hint" }] };
  }

  return { lines: interpretLabCommand(lab, clean, lower) };
}

function adversaryHelpLines(lang) {
  const list = Object.keys(DEFENSE_COMMANDS).map((c) => ({ text: `  ${c}`, kind: "data" }));
  const header =
    lang === "ar"
      ? "أوامر الدفاع المتاحة:"
      : "Available defensive commands:";
  const footer =
    lang === "ar"
      ? "اكتب 'status' لرؤية حركة الخصم الحالية مجددًا."
      : "Type 'status' to see the adversary's current move again.";
  return [{ text: header, kind: "data" }, ...list, { text: "", kind: "data" }, { text: footer, kind: "data" }];
}

function moveLines(move, lang) {
  const narrative = lang === "ar" ? move.narrative.ar : move.narrative.en;
  return [
    { text: `[INCOMING] ${move.category.toUpperCase()} — ${move.mitre}`, kind: "incoming" },
    { text: narrative, kind: "data" },
  ];
}

async function runAdversaryCommand(user, attempt, clean, lower, lang) {
  const sessionId = attempt.adversarySessionId;

  if (lower === "help") return { lines: adversaryHelpLines(lang) };

  if (lower === "status") {
    if (attempt.adversaryContained) {
      return {
        lines: [
          {
            text:
              lang === "ar"
                ? "[محتوى] لا يوجد خصم نشط — أُغلقت كل مسارات الهجوم."
                : "[CONTAINED] No active adversary — every avenue of attack has been closed off.",
            kind: "success",
          },
        ],
      };
    }
    const state = adversaryEngine.getState(sessionId, user.userId);
    if (state && state.move) return { lines: moveLines(state.move, lang) };
    return {
      lines: [
        {
          text:
            lang === "ar"
              ? "لا توجد جلسة نشطة. ابدأ المختبر من جديد."
              : "No active session. Restart this lab to begin again.",
          kind: "error",
        },
      ],
    };
  }

  if (attempt.adversaryContained) {
    return {
      lines: [
        {
          text:
            lang === "ar"
              ? "تم احتواء الخصم بالكامل في هذه الجلسة."
              : "The adversary has already been fully contained in this session.",
          kind: "hint",
        },
      ],
    };
  }

  const defenseId = DEFENSE_COMMANDS[lower];
  if (!defenseId) {
    return {
      lines: [
        {
          text:
            lang === "ar"
              ? `أمر غير معروف: ${clean}. اكتب 'help' لعرض أوامر الدفاع.`
              : `Unknown command: ${clean}. Type 'help' for the list of defensive commands.`,
          kind: "error",
        },
      ],
    };
  }

  // Optional LLM proposer (Part 5). The proposal is precomputed here — the
  // engine's chooser hook is synchronous — and the guardian (applyDefense)
  // re-validates it against the same candidate list, so a bad or slow model
  // cannot make the adversary do anything outside its own move catalog. With
  // no API key configured, isEnabled() is false and this whole block is
  // skipped, leaving the engine's own choice, exactly as before.
  let chooser;
  if (adversaryProposer.isEnabled()) {
    const preview = adversaryEngine.previewNextCandidates(sessionId, defenseId, user.userId);
    if (preview && preview.wouldNeutralize && preview.candidates.length >= 2) {
      const state = adversaryEngine.getState(sessionId, user.userId);
      const record = adversaryEngine.getSessionRecord(sessionId, user.userId);
      const proposal = await adversaryProposer.proposeNextMove(preview.candidates, {
        defensesActive: state?.defensesActive || [],
        lastDefense: defenseId,
        focus: record?.focus || [],
        movesSoFar: (record?.moves || []).map((m) => m.moveId),
      });
      if (proposal) chooser = () => proposal;
    }
  }

  const result = adversaryEngine.applyDefense(sessionId, defenseId, user.userId, chooser);
  if (!result) return null; // session not owned / missing

  if (!result.neutralized) {
    return {
      lines: [
        {
          text:
            lang === "ar"
              ? "نُشر الدفاع، لكنه لا يوقف أسلوب الخصم الحالي."
              : "Defense deployed, but it doesn't stop the adversary's current approach.",
          kind: "hint",
        },
      ],
      neutralized: false,
    };
  }

  if (result.contained) {
    attempt.adversaryContained = true;
    const record = adversaryEngine.getSessionRecord(sessionId, user.userId);
    const completion = await finalizeCompletion(user, attempt, {
      base: LAB_XP.adversary,
      adversaryRecord: record,
    });
    // Forensics step (Part 3): the trainee now reconstructs what happened.
    const challenge = buildForensicsChallenge(record);
    attempt.forensics = {
      realOrder: challenge.realOrder,
      entryPoint: challenge.entryPoint,
      runId: completion.runId,
    };
    const lines = [
      {
        text:
          lang === "ar"
            ? "[محتوى] كانت تلك آخر حركة ممكنة للخصم — أُغلقت كل مسارات الهجوم!"
            : "[CONTAINED] That was the adversary's last viable move — every avenue of attack is now blocked!",
        kind: "success",
      },
    ];
    return {
      lines,
      contained: true,
      completion,
      runId: attempt.lastRunId,
      forensics: { items: challenge.items },
    };
  }

  const rationale = result.rationale;
  const lines = [
    {
      text:
        lang === "ar"
          ? "نجح الدفاع — يتحوّل الخصم إلى أسلوب جديد."
          : "Defense successful — the adversary pivots to a new approach.",
      kind: "success",
    },
    ...moveLines(result.move, lang),
  ];
  if (rationale) {
    lines.push({ text: `↳ ${lang === "ar" ? rationale.ar : rationale.en}`, kind: "rationale" });
  }
  return { lines, neutralized: true, move: result.move, rationale, decidedBy: result.decidedBy };
}

// ---- flag submission ------------------------------------------------------

async function submitFlagInternal(user, attempt, flag) {
  const lab = getLab(attempt.labId);
  if (!lab || lab.isAdversary) {
    return { correct: false, lines: [{ text: "This lab has no flag to submit.", kind: "error" }] };
  }

  if (flag !== lab.flag) {
    attempt.behavior.wrongAttempts += 1;
    return {
      correct: false,
      lines: [
        {
          text: "[FAILED] Invalid flag value submitted. Check capitalization or review command audit output!",
          kind: "error",
        },
      ],
    };
  }

  const alreadyCompleted = (await trainingRuns.getCompletedLabIds(user.userId)).includes(Number(attempt.labId));
  const completion = await finalizeCompletion(user, attempt, { base: LAB_XP.default, adversaryRecord: null });

  const lines = [
    {
      text: alreadyCompleted
        ? "[OK] Flag is correct — but you already completed this lab, so no additional XP was awarded."
        : `[SUCCESS] Correct flag! +${completion.xpAwarded} XP has been added to your profile.`,
      kind: alreadyCompleted ? "hint" : "success",
    },
  ];

  return { correct: true, alreadyCompleted, ...completion, lines };
}

async function submitFlag(user, attemptId, flag) {
  const attempt = getOwnedAttempt(attemptId, user.userId);
  if (!attempt) return null;
  return submitFlagInternal(user, attempt, String(flag || "").trim());
}

// ---- shared completion bookkeeping ---------------------------------------

// Records the finished run (XP, pressure result, behaviour, adversary record)
// on the server. XP is granted at most once per lab per user; re-running a
// solved lab still records the run (useful adversary/behaviour data for the
// readiness index) but awards nothing.
async function finalizeCompletion(user, attempt, { base, adversaryRecord }) {
  const now = Date.now();
  const alreadyCompleted = (await trainingRuns.getCompletedLabIds(user.userId)).includes(Number(attempt.labId));

  const award = computeAwardXp(base, attempt.pressure, now);
  const xpAwarded = alreadyCompleted ? 0 : award.xp;
  const pressureBonus = alreadyCompleted ? 0 : award.bonus;

  const behavior = {
    hintsUsed: attempt.behavior.hintsUsed,
    wrongAttempts: attempt.behavior.wrongAttempts,
    commandCount: attempt.behavior.commandCount,
    uniqueCommandCount: attempt.behavior.uniqueCommands.size,
  };
  const durationMs = now - attempt.startedAt;

  const runId = crypto.randomUUID();
  attempt.lastRunId = runId;

  await trainingRuns.recordRun({
    runId,
    userId: user.userId,
    labId: attempt.labId,
    completed: true,
    durationMs,
    xpAwarded,
    pressure: attempt.pressure
      ? { timeLimitMs: attempt.pressure.timeLimitMs, remainingMs: Math.max(0, attempt.pressure.deadline - now), beatClock: award.beatClock }
      : null,
    adversary: adversaryRecord,
    behavior,
  });

  // Feeds the behavioural fingerprint (and, through it, the readiness index).
  await behaviorEvents.recordLabAttempt(user.userId, {
    labId: attempt.labId,
    durationMs,
    hintsUsed: behavior.hintsUsed,
    wrongAttempts: behavior.wrongAttempts,
    commandCount: behavior.commandCount,
    uniqueCommandCount: behavior.uniqueCommandCount,
  });

  if (attempt.pressure) {
    await pressureAttempts.recordAttempt(user.userId, {
      labId: attempt.labId,
      timeLimitMs: attempt.pressure.timeLimitMs,
      completed: true,
      remainingMs: Math.max(0, attempt.pressure.deadline - now),
    });
  }

  let points = null;
  let level = null;
  if (xpAwarded > 0) {
    const res = await pointsService.awardPoints(user.username, xpAwarded);
    if (res) {
      points = res.points;
      level = res.level;
    }
  }

  // Remember the pressure outcome as it stood at completion, so the
  // after-action report shows the real result rather than re-evaluating the
  // deadline later (when the trainee opens forensics).
  attempt.pressureResult = attempt.pressure
    ? { timeLimitMs: attempt.pressure.timeLimitMs, remainingMs: Math.max(0, attempt.pressure.deadline - now), beatClock: award.beatClock }
    : null;

  return { xpAwarded, pressureBonus, beatClock: award.beatClock, alreadyCompleted, points, level, runId };
}

// ---- forensics + after-action report (Part 3) ----------------------------

// Real techniques (in order) plus two plausible decoys drawn from the rest of
// the move catalog, shuffled. Items are labelled only by their evidence text —
// the payload never says which are real, so the trainee has to reason.
function buildForensicsChallenge(record) {
  const realOrder = record.moves.map((m) => m.moveId);
  const realSet = new Set(realOrder);
  const decoyPool = adversaryEngine.getAllMoves().map((m) => m.id).filter((id) => !realSet.has(id));
  const decoys = shuffle(decoyPool).slice(0, 2);

  const items = shuffle([...realOrder, ...decoys]).map((id) => {
    const ev = adversaryEngine.getEvidence(id) || { en: id, ar: id };
    return { id, en: ev.en, ar: ev.ar };
  });

  return { items, realOrder, entryPoint: realOrder[0] || null };
}

function buildAfterAction(record, attempt) {
  const catLabel = (c) => adversaryEngine.getCategoryLabel(c);

  const timeline = record.moves.map((m, i) => {
    const next = record.moves[i + 1];
    const endAt = next ? next.at : record.containedAt || m.at;
    return {
      moveId: m.moveId,
      category: m.category,
      categoryLabel: catLabel(m.category),
      mitre: m.mitre,
      at: m.at,
      rationale: m.rationale,
      decidedBy: m.decidedBy,
      durationMs: Math.max(0, new Date(endAt).getTime() - new Date(m.at).getTime()),
    };
  });

  const defenses = record.defenses.map((d) => ({
    defenseId: d.defenseId,
    label: adversaryEngine.getDefenseLabel(d.defenseId) || { en: d.defenseId, ar: d.defenseId },
    neutralized: d.neutralized,
    againstCategory: d.againstCategory,
    categoryLabel: d.againstCategory ? catLabel(d.againstCategory) : null,
    at: d.timestamp,
  }));

  // Which of the trainee's defenses failed, and — for each technique the
  // adversary actually ran — which defenses WOULD have stopped it.
  const failedDefenses = defenses.filter((d) => !d.neutralized);
  const wouldHaveWorked = record.moves.map((m) => {
    const full = adversaryEngine.getMove(m.moveId);
    return {
      moveId: m.moveId,
      category: m.category,
      categoryLabel: catLabel(m.category),
      counters: (full?.counteredBy || []).map((id) => ({
        id,
        label: adversaryEngine.getDefenseLabel(id) || { en: id, ar: id },
      })),
    };
  });

  const stageMs = {};
  for (const t of timeline) stageMs[t.category] = (stageMs[t.category] || 0) + t.durationMs;
  const timePerStage = Object.entries(stageMs).map(([category, ms]) => ({
    category,
    label: catLabel(category),
    ms,
  }));

  return {
    contained: record.contained,
    startedAt: record.startedAt,
    containedAt: record.containedAt,
    timeline,
    defenses,
    failedDefenses,
    wouldHaveWorked,
    timePerStage,
    pressure: attempt.pressureResult || null,
  };
}

async function submitForensics(user, attemptId, submission = {}) {
  const attempt = getOwnedAttempt(attemptId, user.userId);
  if (!attempt || !attempt.forensics) return null;

  const { realOrder, entryPoint, runId } = attempt.forensics;
  const scored = scoreForensics(realOrder, submission.selected || [], submission.entryPoint || null);

  const forensicsData = {
    score: scored.score,
    detection: scored.detection,
    order: scored.order,
    entryPoint: scored.entryPoint,
    precision: scored.precision,
    recall: scored.recall,
    submittedAt: new Date().toISOString(),
  };
  await trainingRuns.attachForensics(runId, user.userId, forensicsData);

  const record = adversaryEngine.getSessionRecord(attempt.adversarySessionId, user.userId);
  const report = record ? buildAfterAction(record, attempt) : null;

  return { score: scored, entryPointCorrect: entryPoint, report };
}

// ---- pressure timeout -----------------------------------------------------

// Called when the client's countdown reaches zero. The server records the
// failed pressure run, then clears the deadline so a later completion is
// treated as an ordinary (bonus-free) finish rather than double-counted.
async function timeout(user, attemptId) {
  const attempt = getOwnedAttempt(attemptId, user.userId);
  if (!attempt) return null;
  if (!attempt.pressure) return { ok: true, alreadyClear: true };

  const now = Date.now();
  await pressureAttempts.recordAttempt(user.userId, {
    labId: attempt.labId,
    timeLimitMs: attempt.pressure.timeLimitMs,
    completed: false,
  });
  await trainingRuns.recordRun({
    runId: crypto.randomUUID(),
    userId: user.userId,
    labId: attempt.labId,
    completed: false,
    durationMs: now - attempt.startedAt,
    xpAwarded: 0,
    pressure: { timeLimitMs: attempt.pressure.timeLimitMs, remainingMs: 0, beatClock: false },
    adversary: attempt.adversarySessionId
      ? adversaryEngine.getSessionRecord(attempt.adversarySessionId, user.userId)
      : null,
    behavior: {
      hintsUsed: attempt.behavior.hintsUsed,
      wrongAttempts: attempt.behavior.wrongAttempts,
      commandCount: attempt.behavior.commandCount,
      uniqueCommandCount: attempt.behavior.uniqueCommands.size,
    },
  });

  attempt.pressure = null; // no bonus after this; don't re-record on completion
  return { ok: true };
}

function clearAttempts() {
  attempts.clear();
}

module.exports = {
  DEFENSE_COMMANDS,
  listForUser,
  startAttempt,
  runCommand,
  submitFlag,
  timeout,
  submitForensics,
  // exposed for unit tests
  computeAwardXp,
  scoreForensics,
  getOwnedAttempt,
  clearAttempts,
  _attempts: attempts,
};
