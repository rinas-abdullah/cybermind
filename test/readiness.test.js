// Tests for the readiness index math (readinessService.computeFromData) — a
// pure function over server-observed runs and behaviour events.

process.env.DB_TYPE = process.env.DB_TYPE || "in-memory";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-at-least-32-characters-long";

const test = require("node:test");
const assert = require("node:assert/strict");

const readinessService = require("../backend/services/readinessService");

test("computeFromData blends components and re-normalises over available data", () => {
  const runs = [
    {
      completed: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      adversary: {
        contained: true,
        defenses: [
          { againstCategory: "initial-access", neutralized: true },
          { againstCategory: "execution", neutralized: false },
          { againstCategory: "execution", neutralized: true },
        ],
      },
      pressure: { timeLimitMs: 1000, remainingMs: 500, beatClock: true },
      forensics: { score: 80 },
    },
  ];

  // No behaviour events -> the behaviour component is unavailable and dropped
  // from the weighting (coverage < 100).
  const r = readinessService.computeFromData(runs, []);

  assert.equal(r.components.defenseAccuracy.value, 67); // 2 of 3 effective
  assert.equal(r.components.containment.value, 100); // 1 of 1 contained
  assert.equal(r.components.pressure.value, 75); // beat clock with half the time left
  assert.equal(r.components.forensics.value, 80);
  assert.equal(r.components.behavior.value, null); // no data

  // Weighted mean over the 85 available weight points (of 100).
  assert.equal(r.coverage, 85);
  assert.equal(r.index, 77);

  // Execution stage (1 of 2) is below the weak threshold and flagged.
  assert.ok(r.weakStages.includes("execution"));
  assert.ok(r.nextTarget && r.nextTarget.category === "execution");
});

test("computeFromData reports insufficient data when there is nothing to score", () => {
  const r = readinessService.computeFromData([], []);
  assert.equal(r.insufficientData, true);
  assert.equal(r.index, null);
  assert.equal(r.coverage, 0);
});
