// Tests for the server-side lab engine: flag validation + one-time XP,
// the Pressure Mode bonus window, session ownership and forensics scoring.
// Runs in in-memory mode with no external services.

process.env.DB_TYPE = process.env.DB_TYPE || "in-memory";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-at-least-32-characters-long";

const test = require("node:test");
const assert = require("node:assert/strict");

const labService = require("../backend/services/labService");
const trainingRuns = require("../backend/data/trainingRuns");
const behaviorEvents = require("../backend/data/behaviorEvents");
const pressureAttempts = require("../backend/data/pressureAttempts");
const demoAuthService = require("../backend/services/demoAuthService");
const adversaryEngine = require("../backend/services/adversaryEngine");

const USER = { userId: 2, username: "demo" }; // seeded learner
const LAB1_FLAG = "FLAG{nmap_recon_specialist_902}";

function resetState() {
  labService.clearAttempts();
  trainingRuns.clearInMemoryRuns();
  behaviorEvents.clearInMemoryEvents();
  pressureAttempts.clearInMemoryAttempts();
  demoAuthService.seedDemoUsers();
}

test("flag validation: wrong flag rejected, correct flag awards XP once", async () => {
  resetState();

  const attempt = await labService.startAttempt(USER, 1, {});
  assert.ok(attempt.attemptId);
  assert.equal("flag" in attempt.lab, false, "public lab must not expose the flag");

  const wrong = await labService.submitFlag(USER, attempt.attemptId, "FLAG{nope}");
  assert.equal(wrong.correct, false);

  const right = await labService.submitFlag(USER, attempt.attemptId, LAB1_FLAG);
  assert.equal(right.correct, true);
  assert.equal(right.alreadyCompleted, false);
  assert.equal(right.xpAwarded, 50);

  const completed = await trainingRuns.getCompletedLabIds(USER.userId);
  assert.deepEqual(completed, [1]);
});

test("one-time XP: re-solving a completed lab awards nothing", async () => {
  resetState();

  let a = await labService.startAttempt(USER, 1, {});
  await labService.submitFlag(USER, a.attemptId, LAB1_FLAG);

  a = await labService.startAttempt(USER, 1, {});
  const second = await labService.submitFlag(USER, a.attemptId, LAB1_FLAG);
  assert.equal(second.correct, true);
  assert.equal(second.alreadyCompleted, true);
  assert.equal(second.xpAwarded, 0);
});

test("pressure bonus is granted only before the server deadline", () => {
  const now = 1_000_000;

  const within = labService.computeAwardXp(100, { deadline: now + 5000 }, now);
  assert.equal(within.beatClock, true);
  assert.equal(within.bonus, 40);
  assert.equal(within.xp, 140);

  const after = labService.computeAwardXp(100, { deadline: now - 1 }, now);
  assert.equal(after.beatClock, false);
  assert.equal(after.bonus, 0);
  assert.equal(after.xp, 100);

  const noPressure = labService.computeAwardXp(50, null, now);
  assert.equal(noPressure.bonus, 0);
  assert.equal(noPressure.xp, 50);
});

test("session ownership: a user cannot act on another user's session", async () => {
  resetState();

  const defenseId = adversaryEngine.getDefenseCatalog()[0].id;
  const started = adversaryEngine.startSession("7");
  assert.equal(adversaryEngine.applyDefense(started.sessionId, defenseId, "8"), null, "wrong user is refused");
  assert.notEqual(adversaryEngine.applyDefense(started.sessionId, defenseId, "7"), null, "owner is allowed");

  const attempt = await labService.startAttempt({ userId: 7, username: "u7" }, 5, {});
  const asOther = await labService.runCommand({ userId: 8, username: "u8" }, attempt.attemptId, "close-port", "en");
  assert.equal(asOther, null, "runCommand refuses a non-owner");
});

test("forensics scoring rewards detection, order and entry point", () => {
  const real = ["a", "b", "c"];

  const perfect = labService.scoreForensics(real, ["a", "b", "c"], "a");
  assert.equal(perfect.score, 100);
  assert.equal(perfect.detection, 50);
  assert.equal(perfect.order, 30);
  assert.equal(perfect.entryPoint, 20);

  const wrongEntry = labService.scoreForensics(real, ["a", "b", "c"], "b");
  assert.equal(wrongEntry.entryPoint, 0);
  assert.equal(wrongEntry.score, 80);

  const withDecoy = labService.scoreForensics(real, ["a", "b", "c", "decoy"], "a");
  assert.ok(withDecoy.score < 100, "a false positive lowers the score");
  assert.ok(withDecoy.detection < 50);

  const empty = labService.scoreForensics(real, [], null);
  assert.equal(empty.score, 0);
});
