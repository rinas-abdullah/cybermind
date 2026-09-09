// Adaptive Adversary Engine
//
// The rest of the codebase's "attacker next move" logic (aiCoreService's
// getAttackerNextMove) is stateless: it keyword-matches the CURRENT action
// text against canned responses with no memory of what it already tried or
// what defenses are already active. Call it twice with the same input and
// it gives the same answer — it can't actually avoid a technique the
// trainee already blocked, escalate over the course of a session, or react
// specifically to a defense (e.g. pivoting internally only once the
// trainee cuts internet access). This module is the real, stateful
// decision engine that does that: each session tracks which moves have
// been attempted and which defenses are active, and picks the next move
// accordingly — so no two trainees (and no single trainee replaying a
// session) see the exact same fixed script.

const crypto = require("crypto");

// Kill-chain tiers escalate roughly with MITRE ATT&CK tactic ordering.
// `counteredBy`: defense ids that neutralize this move outright.
// `requires`: this move only becomes available after ALL listed moves have
//   been attempted (successful or not) — models a loose attack-chain order.
// `triggeredBy`: this move is strongly preferred (jumps the queue) once ANY
//   of these specific defenses go active — models a reactive pivot, e.g.
//   the trainee cutting internet access pushes the adversary to fall back
//   on an internal foothold rather than a network-based technique.
const MOVES = [
  {
    id: "exposed_port_exploit",
    category: "initial-access",
    mitre: "T1190",
    tier: 1,
    counteredBy: ["close_port"],
    narrative: {
      en: "Scanning the perimeter, the adversary finds an exposed service on an open port and attempts to exploit a known vulnerability in it to gain a foothold.",
      ar: "يقوم المهاجم بفحص محيط الشبكة ويجد خدمة مكشوفة على منفذ مفتوح، ويحاول استغلال ثغرة معروفة فيها للحصول على موطئ قدم أولي.",
    },
  },
  {
    id: "credential_stuffing",
    category: "initial-access",
    mitre: "T1110",
    tier: 1,
    counteredBy: ["enable_mfa"],
    narrative: {
      en: "The adversary sprays a list of leaked username/password pairs against your login portal, hoping a reused credential lets them in.",
      ar: "يقوم المهاجم بتجربة قائمة من بيانات الدخول المسرّبة (اسم مستخدم/كلمة مرور) على بوابة الدخول، على أمل أن يكون أحد المستخدمين أعاد استخدام كلمة مرور مسرّبة.",
    },
  },
  {
    id: "phishing_email",
    category: "initial-access",
    mitre: "T1566",
    tier: 1,
    counteredBy: ["email_filtering"],
    narrative: {
      en: "A convincing phishing email lands in an employee's inbox, carrying a malicious attachment disguised as an invoice.",
      ar: "تصل رسالة تصيّد مقنعة إلى بريد أحد الموظفين، تحمل مرفقاً ضاراً متنكراً بشكل فاتورة رسمية.",
    },
  },
  {
    id: "malware_dropper",
    category: "execution",
    mitre: "T1204",
    tier: 2,
    counteredBy: ["enable_av"],
    narrative: {
      en: "Having landed on the host, the adversary executes a dropper to install a persistent implant.",
      ar: "بعد الوصول إلى الجهاز، ينفّذ المهاجم أداة تنزيل (Dropper) لتثبيت برمجية خبيثة دائمة.",
    },
  },
  {
    id: "av_evasion",
    category: "defense-evasion",
    mitre: "T1027",
    tier: 2,
    triggeredBy: ["enable_av"],
    counteredBy: ["edr_behavioral"],
    narrative: {
      en: "Antivirus went active, so the adversary repacks the payload with a custom crypter to slip past signature-based detection.",
      ar: "بعد تفعيل مضاد الفيروسات، يقوم المهاجم بإعادة تغليف الحمولة الخبيثة بأداة تشفير مخصصة لتفادي الاكتشاف المعتمد على التوقيعات.",
    },
  },
  {
    id: "scheduled_task_persistence",
    category: "persistence",
    mitre: "T1053",
    tier: 2,
    counteredBy: ["disable_scheduled_tasks"],
    narrative: {
      en: "The adversary registers a scheduled task so their implant survives a reboot.",
      ar: "يقوم المهاجم بتسجيل مهمة مجدولة ليضمن استمرارية برمجيته الخبيثة بعد إعادة تشغيل الجهاز.",
    },
  },
  {
    id: "internal_pivot",
    category: "lateral-movement",
    mitre: "T1021",
    tier: 3,
    triggeredBy: ["disconnect_internet", "isolate_host"],
    counteredBy: ["network_segmentation"],
    narrative: {
      en: "Cutting internet access didn't help — the adversary already has a foothold inside and pivots to other hosts on the internal network instead of relying on outbound access.",
      ar: "قطع الاتصال بالإنترنت لم يفِد — المهاجم لديه بالفعل موطئ قدم داخل الشبكة وينتقل إلى أجهزة أخرى على الشبكة الداخلية بدلاً من الاعتماد على اتصال خارجي.",
    },
  },
  {
    id: "credential_dumping",
    category: "credential-access",
    mitre: "T1003",
    tier: 3,
    counteredBy: ["credential_guard"],
    narrative: {
      en: "The adversary dumps credentials from memory to move deeper into the environment with legitimate-looking logins.",
      ar: "يقوم المهاجم باستخراج بيانات الاعتماد من ذاكرة الجهاز للتنقل بعمق أكبر داخل الشبكة باستخدام حسابات تبدو شرعية.",
    },
  },
  {
    id: "dns_tunneling_c2",
    category: "command-and-control",
    mitre: "T1071",
    tier: 3,
    counteredBy: ["dns_filtering"],
    narrative: {
      en: "Blocked ports mean nothing here — the adversary tunnels command-and-control traffic inside ordinary-looking DNS queries.",
      ar: "إغلاق المنافذ لا يفيد هنا — يقوم المهاجم بتمرير حركة القيادة والتحكم داخل استعلامات DNS تبدو عادية تماماً.",
    },
  },
  {
    id: "data_exfiltration",
    category: "exfiltration",
    mitre: "T1041",
    tier: 4,
    requires: ["credential_dumping"],
    counteredBy: ["dlp"],
    narrative: {
      en: "With access to sensitive files, the adversary begins staging and exfiltrating data out of the network.",
      ar: "بعد الوصول إلى الملفات الحساسة، يبدأ المهاجم بتجميع البيانات وتسريبها إلى خارج الشبكة.",
    },
  },
];

const MOVES_BY_ID = new Map(MOVES.map((m) => [m.id, m]));

// Some defenses don't counter one specific technique — they shut down an
// entire category of them. Cutting internet access or isolating the host
// doesn't just block whatever the adversary happens to be doing right now;
// it removes every move that depends on external network reachability
// (initial access, C2) from the table entirely, which is exactly what
// forces the "internal_pivot" reactive move to become the only option left.
const BLANKET_DEFENSES = {
  disconnect_internet: ["initial-access", "command-and-control"],
  isolate_host: ["initial-access", "command-and-control", "lateral-movement"],
};

function isBlanketBlocked(move, activeDefenses) {
  return Object.entries(BLANKET_DEFENSES).some(
    ([defenseId, categories]) => activeDefenses.has(defenseId) && categories.includes(move.category)
  );
}

const DEFENSE_LABELS = {
  close_port: { en: "Closed the exposed port", ar: "إغلاق المنفذ المكشوف" },
  enable_mfa: { en: "Enabled multi-factor authentication", ar: "تفعيل المصادقة الثنائية" },
  email_filtering: { en: "Enabled email attachment filtering", ar: "تفعيل تصفية مرفقات البريد" },
  enable_av: { en: "Enabled antivirus/endpoint protection", ar: "تفعيل مضاد الفيروسات وحماية الأطراف" },
  edr_behavioral: { en: "Enabled EDR behavioral detection", ar: "تفعيل الكشف السلوكي عبر EDR" },
  disable_scheduled_tasks: { en: "Audited and disabled unauthorized scheduled tasks", ar: "مراجعة وتعطيل المهام المجدولة غير المصرح بها" },
  disconnect_internet: { en: "Disconnected the host from the internet", ar: "قطع اتصال الجهاز بالإنترنت" },
  isolate_host: { en: "Isolated the host from the network", ar: "عزل الجهاز عن الشبكة" },
  network_segmentation: { en: "Applied internal network segmentation", ar: "تطبيق تقسيم الشبكة الداخلية" },
  credential_guard: { en: "Enabled credential protection (Credential Guard)", ar: "تفعيل حماية بيانات الاعتماد (Credential Guard)" },
  dns_filtering: { en: "Enabled DNS filtering/monitoring", ar: "تفعيل تصفية ومراقبة DNS" },
  dlp: { en: "Enabled data loss prevention controls", ar: "تفعيل ضوابط منع تسرب البيانات (DLP)" },
};

class AdversaryEngine {
  constructor() {
    // sessionId -> { userId, attemptedMoveIds: Set, activeDefenses: Set,
    //                currentMoveId, contained: bool, log: [] }
    this.sessions = new Map();
  }

  // Picks the next move given the moves already attempted and defenses
  // already active this session. Prefers a move specifically triggered by
  // the most recently applied defense (a reactive pivot); otherwise picks
  // the lowest-tier move that isn't blocked, hasn't been tried, and whose
  // prerequisites (if any) are satisfied.
  selectNextMove(session, justAppliedDefense) {
    const isAvailable = (move) =>
      !session.attemptedMoveIds.has(move.id) &&
      !(move.counteredBy || []).some((d) => session.activeDefenses.has(d)) &&
      !isBlanketBlocked(move, session.activeDefenses) &&
      (move.requires || []).every((r) => session.attemptedMoveIds.has(r));

    if (justAppliedDefense) {
      const reactive = MOVES.find(
        (m) => (m.triggeredBy || []).includes(justAppliedDefense) && isAvailable(m)
      );
      if (reactive) return reactive;
    }

    const candidates = MOVES.filter(isAvailable).sort((a, b) => a.tier - b.tier);
    return candidates[0] || null;
  }

  startSession(userId) {
    const sessionId = crypto.randomUUID();
    const session = {
      userId,
      attemptedMoveIds: new Set(),
      activeDefenses: new Set(),
      currentMoveId: null,
      contained: false,
      log: [],
      startedAt: new Date().toISOString(),
    };

    const firstMove = this.selectNextMove(session, null);
    session.currentMoveId = firstMove?.id || null;
    if (firstMove) session.attemptedMoveIds.add(firstMove.id);

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      move: firstMove ? this.publicMove(firstMove) : null,
      contained: false,
    };
  }

  // Records a defensive action, checks whether it neutralizes the
  // adversary's current move, and — if so — picks a pivot. If the
  // defense doesn't touch the current move, the adversary simply
  // continues (no free win from an irrelevant action).
  applyDefense(sessionId, defenseId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.contained) {
      return { sessionId, contained: true, move: null, neutralized: false };
    }

    session.activeDefenses.add(defenseId);

    const currentMove = MOVES_BY_ID.get(session.currentMoveId);
    const neutralized = Boolean(
      currentMove &&
        ((currentMove.counteredBy || []).includes(defenseId) ||
          (BLANKET_DEFENSES[defenseId] || []).includes(currentMove.category))
    );

    session.log.push({
      type: "defense",
      defenseId,
      neutralized,
      timestamp: new Date().toISOString(),
    });

    if (!neutralized) {
      return {
        sessionId,
        contained: false,
        neutralized: false,
        move: currentMove ? this.publicMove(currentMove) : null,
      };
    }

    const nextMove = this.selectNextMove(session, defenseId);

    if (!nextMove) {
      session.contained = true;
      session.currentMoveId = null;
      return { sessionId, contained: true, neutralized: true, move: null };
    }

    session.attemptedMoveIds.add(nextMove.id);
    session.currentMoveId = nextMove.id;

    return {
      sessionId,
      contained: false,
      neutralized: true,
      move: this.publicMove(nextMove),
    };
  }

  getState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const currentMove = MOVES_BY_ID.get(session.currentMoveId);
    return {
      sessionId,
      contained: session.contained,
      move: currentMove ? this.publicMove(currentMove) : null,
      movesAttempted: session.attemptedMoveIds.size,
      defensesActive: [...session.activeDefenses],
      log: session.log,
    };
  }

  publicMove(move) {
    return {
      id: move.id,
      category: move.category,
      mitre: move.mitre,
      tier: move.tier,
      narrative: move.narrative,
      // Deliberately not exposing `counteredBy` — the trainee should have
      // to reason about the right defense, not read it off the wire.
    };
  }

  getDefenseCatalog() {
    return Object.entries(DEFENSE_LABELS).map(([id, label]) => ({ id, ...label }));
  }
}

// Singleton, matching the rest of the codebase's per-process in-memory
// services (data/progress.js, data/aiLogs.js) — deliberately not persisted
// to a DB: an adversary session is a single training run, not data that
// needs to survive a restart.
module.exports = new AdversaryEngine();
