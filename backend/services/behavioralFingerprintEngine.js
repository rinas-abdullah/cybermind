// Turns raw per-lab interaction signals (backend/data/behaviorEvents.js) into
// a "behavioral fingerprint": four independent 0-100 axes plus an archetype
// derived from the trainee's two strongest axes. Each axis reads a single,
// non-overlapping signal so the four don't just restate one underlying number:
//   - speed:        how fast they finish relative to a per-lab par time
//   - precision:    how few wrong flag submissions it took
//   - autonomy:     how little they leaned on the 'hint' command
//   - thoroughness: how many distinct commands they explored before solving
const MIN_EVENTS_FOR_FINGERPRINT = 1;

// Rough par time per known lab id (ms); unknown lab ids fall back to a
// generic mid-difficulty par so the formula still produces a sane score.
const PAR_TIME_MS = {
  1: 5 * 60 * 1000, // Reconnaissance Lab — beginner
  2: 8 * 60 * 1000, // SQLi Log Auditing — intermediate
  3: 12 * 60 * 1000, // Privilege Escalation — advanced
  4: 6 * 60 * 1000, // Defensive Firewall Block — intermediate
};
const DEFAULT_PAR_TIME_MS = 8 * 60 * 1000;

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parTimeFor(labId) {
  return PAR_TIME_MS[labId] ?? PAR_TIME_MS[String(labId)] ?? DEFAULT_PAR_TIME_MS;
}

function speedScore(event) {
  const par = parTimeFor(event.labId);
  const duration = Math.max(event.durationMs, 1);
  return clampScore((par / duration) * 50);
}

function precisionScore(event) {
  return clampScore(100 - event.wrongAttempts * 20);
}

function autonomyScore(event) {
  return clampScore(100 - event.hintsUsed * 30);
}

function thoroughnessScore(event) {
  return clampScore((event.uniqueCommandCount / 5) * 100);
}

function average(numbers) {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
}

const AXIS_LABELS = {
  speed: { en: "Speed", ar: "السرعة" },
  precision: { en: "Precision", ar: "الدقة" },
  autonomy: { en: "Autonomy", ar: "الاستقلالية" },
  thoroughness: { en: "Thoroughness", ar: "الشمولية" },
};

// Archetypes keyed by the two strongest axes, sorted alphabetically and
// joined with "|" so the lookup is order-independent.
const ARCHETYPES = {
  "precision|speed": {
    en: {
      name: "The Swift Precisionist",
      narrative:
        "You move fast and rarely miss — {speed}/100 speed with {precision}/100 precision. You trust your first read of a system and it usually pays off.",
    },
    ar: {
      name: "الدقيق السريع",
      narrative:
        "تتحرك بسرعة ونادرًا ما تخطئ — سرعة {speed}/100 مع دقة {precision}/100. تثق بقراءتك الأولى للنظام وغالبًا ما تكون صحيحة.",
    },
  },
  "autonomy|thoroughness": {
    en: {
      name: "The Independent Analyst",
      narrative:
        "You explore a system in depth ({thoroughness}/100 thoroughness) and rarely reach for a hint ({autonomy}/100 autonomy). You'd rather map the terrain yourself than be told where to look.",
    },
    ar: {
      name: "المحلل المستقل",
      narrative:
        "تستكشف النظام بعمق (شمولية {thoroughness}/100) ونادرًا ما تلجأ للتلميحات (استقلالية {autonomy}/100). تفضل رسم الطريق بنفسك على أن يُقال لك أين تنظر.",
    },
  },
  "precision|thoroughness": {
    en: {
      name: "The Meticulous Investigator",
      narrative:
        "Thoroughness of {thoroughness}/100 paired with precision of {precision}/100 — you check every corner before committing to an answer, and it shows in how rarely you're wrong.",
    },
    ar: {
      name: "المحقق الدقيق",
      narrative:
        "شمولية {thoroughness}/100 مع دقة {precision}/100 — تتفحص كل زاوية قبل أن تلتزم بإجابة، وهذا يظهر في ندرة أخطائك.",
    },
  },
  "autonomy|speed": {
    en: {
      name: "The Confident Responder",
      narrative:
        "Speed of {speed}/100 with autonomy of {autonomy}/100 — you act on your own judgment quickly, closer to how a real incident actually feels.",
    },
    ar: {
      name: "المستجيب الواثق",
      narrative:
        "سرعة {speed}/100 مع استقلالية {autonomy}/100 — تتصرف بحكمك الخاص وبسرعة، وهو أقرب لما يشعر به حادث أمني حقيقي.",
    },
  },
  "speed|thoroughness": {
    en: {
      name: "The Comprehensive Responder",
      narrative:
        "You cover a lot of ground ({thoroughness}/100 thoroughness) without slowing down ({speed}/100 speed) — a wide, fast sweep rather than a narrow guess.",
    },
    ar: {
      name: "المستجيب الشامل",
      narrative:
        "تغطي مساحة واسعة (شمولية {thoroughness}/100) دون أن تتباطأ (سرعة {speed}/100) — مسح واسع وسريع بدل التخمين الضيق.",
    },
  },
  "autonomy|precision": {
    en: {
      name: "The Methodical Analyst",
      narrative:
        "Precision of {precision}/100 built on autonomy of {autonomy}/100 — you work through a problem carefully and independently rather than iterating on hints.",
    },
    ar: {
      name: "المحلل المنهجي",
      narrative:
        "دقة {precision}/100 مبنية على استقلالية {autonomy}/100 — تعمل على المشكلة بعناية واستقلالية بدل التكرار بالاعتماد على التلميحات.",
    },
  },
};

// Below this, no axis is a genuine strength yet — picking the two
// "least weak" scores and presenting them as an archetype would be
// misleading (e.g. someone slow, hint-heavy, and error-prone would still
// get told they're "comprehensive and fast" for having the least-bad
// scores among four weak ones).
const STRENGTH_THRESHOLD = 50;

const EMERGING_ARCHETYPE = {
  en: {
    name: "The Emerging Trainee",
    narrative:
      "Still early days — no single trait stands out yet. Keep completing labs without leaning on hints or guessing at flags, and a clearer profile will form.",
  },
  ar: {
    name: "المتدرب الناشئ",
    narrative:
      "لا زلت في البداية — ما فيه سمة بارزة بعد. استمر بإكمال المختبرات دون الاعتماد الكثير على التلميحات أو تخمين الأعلام، وراح تتضح بصمتك أكثر.",
  },
};

function topTwoAxes(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([axis]) => axis)
    .sort();
}

function buildArchetype(scores) {
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore < STRENGTH_THRESHOLD) {
    return EMERGING_ARCHETYPE;
  }

  const key = topTwoAxes(scores).join("|");
  const archetype = ARCHETYPES[key];

  const interpolate = (template) =>
    template.replace(/\{(\w+)\}/g, (_, axis) => String(scores[axis] ?? 0));

  return {
    en: {
      name: archetype.en.name,
      narrative: interpolate(archetype.en.narrative),
    },
    ar: {
      name: archetype.ar.name,
      narrative: interpolate(archetype.ar.narrative),
    },
  };
}

function computeFingerprint(events) {
  if (!Array.isArray(events) || events.length < MIN_EVENTS_FOR_FINGERPRINT) {
    return {
      insufficientData: true,
      sampleSize: events?.length ?? 0,
      message: "Complete at least one lab to generate your behavioral fingerprint.",
    };
  }

  const scores = {
    speed: average(events.map(speedScore)),
    precision: average(events.map(precisionScore)),
    autonomy: average(events.map(autonomyScore)),
    thoroughness: average(events.map(thoroughnessScore)),
  };

  return {
    insufficientData: false,
    sampleSize: events.length,
    axes: Object.entries(scores).map(([axis, value]) => ({
      axis,
      value,
      label: AXIS_LABELS[axis],
    })),
    archetype: buildArchetype(scores),
  };
}

module.exports = {
  computeFingerprint,
};
