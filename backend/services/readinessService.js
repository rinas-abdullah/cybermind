// Rasd Readiness Index
//
// Turns what the server actually observed in training runs into one 0-100
// score per person, plus a per-attack-stage breakdown and the weak stages
// the adversary should target next. Every input comes from server-side
// records (data/trainingRuns.js, data/behaviorEvents.js) — nothing here is
// taken from a request body.
//
// Components (weights are re-normalised over the components a user has
// data for, and each component reports whether it was available):
//   defenseAccuracy  35  effective defenses / all defenses in adversary runs
//   containment      15  adversary runs contained / adversary runs finished
//   pressure         15  beating the clock, scaled by time left
//   forensics        20  investigation accuracy after containment
//   behavior         15  mean of the four behavioral-fingerprint axes

const { getUserRuns, getAllRuns } = require("../data/trainingRuns");
const { getUserEvents } = require("../data/behaviorEvents");
const { computeFingerprint } = require("./behavioralFingerprintEngine");
const adversaryEngine = require("./adversaryEngine");

const WEIGHTS = { defenseAccuracy: 35, containment: 15, pressure: 15, forensics: 20, behavior: 15 };
const RECENT_ADVERSARY_RUNS = 5;
const WEAK_STAGE_THRESHOLD = 75;
const MAX_FOCUS_STAGES = 2;

const round = (n) => Math.round(n);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

function adversaryRuns(runs) {
  return runs.filter((r) => r.adversary && Array.isArray(r.adversary.defenses));
}

// Per attack stage: of the defenses a trainee deployed while the adversary
// was using a technique in that stage, how many actually stopped it.
function stageBreakdown(runs) {
  const stats = {};
  for (const run of adversaryRuns(runs)) {
    for (const d of run.adversary.defenses) {
      if (!d.againstCategory) continue;
      const s = (stats[d.againstCategory] ||= { effective: 0, ineffective: 0 });
      if (d.neutralized) s.effective += 1;
      else s.ineffective += 1;
    }
  }
  return Object.entries(stats)
    .map(([category, s]) => {
      const total = s.effective + s.ineffective;
      return {
        category,
        label: adversaryEngine.getCategoryLabel(category),
        score: total ? round((100 * s.effective) / total) : null,
        effective: s.effective,
        ineffective: s.ineffective,
      };
    })
    .sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
}

function weakStagesFromRuns(runs) {
  return stageBreakdown(runs)
    .filter((s) => s.score !== null && s.score < WEAK_STAGE_THRESHOLD)
    .slice(0, MAX_FOCUS_STAGES)
    .map((s) => s.category);
}

async function getWeakStages(userId) {
  return weakStagesFromRuns(await getUserRuns(userId));
}

function runAccuracy(run) {
  const ds = run.adversary?.defenses || [];
  if (!ds.length) return null;
  return (100 * ds.filter((d) => d.neutralized).length) / ds.length;
}

function computeFromData(runs, behaviorEvents) {
  const adv = adversaryRuns(runs);
  const recentAdv = adv.slice(-RECENT_ADVERSARY_RUNS);

  const components = {};

  const allDefs = recentAdv.flatMap((r) => r.adversary.defenses);
  components.defenseAccuracy = allDefs.length
    ? { value: round((100 * allDefs.filter((d) => d.neutralized).length) / allDefs.length), sample: recentAdv.length }
    : null;

  components.containment = recentAdv.length
    ? { value: round((100 * recentAdv.filter((r) => r.adversary.contained).length) / recentAdv.length), sample: recentAdv.length }
    : null;

  const pressured = runs.filter((r) => r.pressure && r.pressure.timeLimitMs);
  components.pressure = pressured.length
    ? {
        value: round(
          avg(
            pressured.map((r) =>
              r.pressure.beatClock ? 50 + 50 * Math.min(1, (r.pressure.remainingMs || 0) / r.pressure.timeLimitMs) : 0
            )
          )
        ),
        sample: pressured.length,
      }
    : null;

  const investigated = runs.filter((r) => r.forensics && Number.isFinite(r.forensics.score));
  components.forensics = investigated.length
    ? { value: round(avg(investigated.map((r) => r.forensics.score))), sample: investigated.length }
    : null;

  const fp = computeFingerprint(behaviorEvents || []);
  components.behavior =
    fp && !fp.insufficientData ? { value: round(avg(fp.axes.map((a) => a.value))), sample: fp.sampleSize } : null;

  let weighted = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    if (components[key]) {
      weighted += components[key].value * weight;
      weightSum += weight;
    }
  }

  const stages = stageBreakdown(runs);
  const weakStages = weakStagesFromRuns(runs);
  const nextTarget = weakStages.length
    ? adversaryEngine.getAllMoves().find((m) => m.category === weakStages[0]) || null
    : null;

  return {
    index: weightSum ? round(weighted / weightSum) : null,
    insufficientData: weightSum === 0,
    components: Object.fromEntries(
      Object.keys(WEIGHTS).map((k) => [k, components[k] ? { ...components[k], weight: WEIGHTS[k] } : { value: null, weight: WEIGHTS[k] }])
    ),
    coverage: round((100 * weightSum) / Object.values(WEIGHTS).reduce((a, b) => a + b, 0)),
    stages,
    weakStages,
    nextTarget: nextTarget
      ? { moveId: nextTarget.id, mitre: nextTarget.mitre, category: nextTarget.category, label: adversaryEngine.getCategoryLabel(nextTarget.category) }
      : null,
    trend: adv.slice(-10).map((r) => ({ at: r.createdAt, accuracy: round(runAccuracy(r) ?? 0), contained: r.adversary.contained })),
    runs: { total: runs.length, adversary: adv.length, completed: runs.filter((r) => r.completed).length },
  };
}

async function computeReadiness(userId) {
  const [runs, events] = await Promise.all([getUserRuns(userId), getUserEvents(userId)]);
  return computeFromData(runs, events);
}

// Team view for instructors/admins: one row per trainee who has any runs,
// plus the team average and the stage the team loses most often.
async function computeTeamReadiness(resolveUsername) {
  const all = await getAllRuns();
  const byUser = new Map();
  for (const r of all) {
    if (!r.userId) continue;
    if (!byUser.has(r.userId)) byUser.set(r.userId, []);
    byUser.get(r.userId).push(r);
  }

  const members = [];
  for (const [userId, runs] of byUser) {
    const events = await getUserEvents(userId);
    const r = computeFromData(runs, events);
    members.push({
      userId,
      username: (await resolveUsername(userId)) || `user-${userId}`,
      index: r.index,
      weakest: r.stages.find((s) => s.score !== null) || null,
      adversaryRuns: r.runs.adversary,
    });
  }
  members.sort((a, b) => (a.index ?? -1) - (b.index ?? -1));

  const teamStages = stageBreakdown(all);
  const scored = members.filter((m) => m.index !== null);
  return {
    members,
    teamIndex: scored.length ? round(avg(scored.map((m) => m.index))) : null,
    stages: teamStages,
    weakestStage: teamStages.find((s) => s.score !== null) || null,
  };
}

module.exports = { computeReadiness, computeTeamReadiness, getWeakStages, computeFromData, stageBreakdown, WEIGHTS };
