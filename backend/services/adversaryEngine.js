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

// Forensic evidence each move leaves behind. Used by the forensics phase
// after containment: the trainee rebuilds the incident timeline from these
// log artifacts, and decoys (moves that did NOT happen) are drawn from the
// same pool so the right answer can't be guessed from the wording.
const EVIDENCE = {
  exposed_port_exploit: {
    en: "web01 proxy log: burst of malformed requests to the service on :8080 from an external address, followed by a new child process under the web user.",
    ar: "سجل الوكيل على web01: دفعة طلبات مشوّهة إلى الخدمة على المنفذ 8080 من عنوان خارجي، تبعها ظهور عملية فرعية جديدة تحت مستخدم الويب.",
  },
  credential_stuffing: {
    en: "SSO audit log: 1,400 failed logins across 380 accounts from rotating addresses in 6 minutes, then one success for j.alharbi.",
    ar: "سجل تدقيق الدخول الموحّد: 1,400 محاولة دخول فاشلة على 380 حسابًا من عناوين متغيّرة خلال 6 دقائق، ثم دخول ناجح لحساب j.alharbi.",
  },
  phishing_email: {
    en: "Mail gateway: message 'Invoice_0925' delivered to finance with a macro-enabled attachment; the attachment was opened 4 minutes later.",
    ar: "بوابة البريد: رسالة «Invoice_0925» وصلت إلى المالية بمرفق يحتوي ماكرو، وفُتح المرفق بعد 4 دقائق.",
  },
  malware_dropper: {
    en: "Endpoint telemetry on FIN-07: an office process spawned a script host that wrote an unsigned binary to a temp folder and ran it.",
    ar: "قياسات الجهاز FIN-07: عملية مكتبية شغّلت مضيف سكربت كتب ملفًا تنفيذيًا غير موقّع في مجلد مؤقت ثم شغّله.",
  },
  av_evasion: {
    en: "Antivirus console: signature scan clean on FIN-07, but the same binary's hash changed three times in ten minutes (packed/re-encoded).",
    ar: "لوحة مضاد الفيروسات: الفحص بالتواقيع نظيف على FIN-07، لكن بصمة الملف نفسه تغيّرت ثلاث مرات خلال عشر دقائق (تشفير وإعادة ترميز).",
  },
  scheduled_task_persistence: {
    en: "Windows event 4698 on FIN-07: new scheduled task 'OneDriveSyncCheck' created to run the temp binary at every logon.",
    ar: "حدث ويندوز 4698 على FIN-07: إنشاء مهمة مجدولة جديدة باسم «OneDriveSyncCheck» لتشغيل الملف المؤقت عند كل تسجيل دخول.",
  },
  internal_pivot: {
    en: "Internal firewall: FIN-07 opened remote-management sessions to three servers it has never contacted before.",
    ar: "الجدار الداخلي: الجهاز FIN-07 فتح جلسات إدارة عن بُعد إلى ثلاثة خوادم لم يتصل بها من قبل.",
  },
  credential_dumping: {
    en: "EDR alert: a process opened a handle to the LSASS memory on FIN-07 and wrote a large file to disk shortly after.",
    ar: "تنبيه EDR: عملية فتحت ذاكرة LSASS على FIN-07 ثم كتبت ملفًا كبيرًا على القرص بعدها بقليل.",
  },
  dns_tunneling_c2: {
    en: "DNS resolver: thousands of long, random-looking subdomain lookups to a single newly registered domain from FIN-07.",
    ar: "خادم DNS: آلاف الاستعلامات عن نطاقات فرعية طويلة وعشوائية الشكل لنطاق واحد مسجّل حديثًا، صادرة من FIN-07.",
  },
  data_exfiltration: {
    en: "Proxy log: 2.3 GB uploaded from the file server to an external storage service outside business hours.",
    ar: "سجل الوكيل: رفع 2.3 جيجابايت من خادم الملفات إلى خدمة تخزين خارجية خارج ساعات العمل.",
  },
};

const CATEGORY_LABELS = {
  "initial-access": { en: "Initial access", ar: "الوصول الأولي" },
  execution: { en: "Execution", ar: "التنفيذ" },
  "defense-evasion": { en: "Defense evasion", ar: "التهرّب من الدفاعات" },
  persistence: { en: "Persistence", ar: "الثبات" },
  "lateral-movement": { en: "Lateral movement", ar: "الحركة الجانبية" },
  "credential-access": { en: "Credential access", ar: "سرقة بيانات الاعتماد" },
  "command-and-control": { en: "Command & control", ar: "التحكّم والسيطرة" },
  exfiltration: { en: "Exfiltration", ar: "التسريب" },
};

class AdversaryEngine {
  constructor() {
    // sessionId -> { userId, attemptedMoveIds: Set, activeDefenses: Set,
    //                currentMoveId, contained, focus: [], log: [] }
    this.sessions = new Map();
    this.MAX_SESSIONS = 5000;
  }

  isAvailable(session, move) {
    return (
      !session.attemptedMoveIds.has(move.id) &&
      !(move.counteredBy || []).some((d) => session.activeDefenses.has(d)) &&
      !isBlanketBlocked(move, session.activeDefenses) &&
      (move.requires || []).every((r) => session.attemptedMoveIds.has(r))
    );
  }

  // Every move the adversary could legally make next, in the guardian's
  // preference order. The first entry is what the deterministic engine
  // plays; an LLM proposer may pick any entry, never anything outside it.
  candidateMoves(session, justAppliedDefense) {
    const available = MOVES.filter((m) => this.isAvailable(session, m));
    const focus = new Set(session.focus || []);
    const reactive = justAppliedDefense
      ? available.filter((m) => (m.triggeredBy || []).includes(justAppliedDefense))
      : [];
    // Weak-point targeting: moves in the trainee's weakest stages jump one
    // tier ahead, so the adversary reaches them sooner than it otherwise would.
    const rank = (m) => m.tier - (focus.has(m.category) ? 1 : 0);
    const rest = available
      .filter((m) => !reactive.includes(m))
      .sort((a, b) => rank(a) - rank(b) || a.tier - b.tier);
    return [...reactive, ...rest];
  }

  // Picks the next move. Prefers a move specifically triggered by the most
  // recently applied defense (a reactive pivot); otherwise the lowest-rank
  // available move, where the trainee's weak stages rank earlier.
  selectNextMove(session, justAppliedDefense) {
    return this.candidateMoves(session, justAppliedDefense)[0] || null;
  }

  // Plain-language reason for a move, generated from the engine's own state
  // so it is always true to what actually happened.
  explainMove(session, move, justAppliedDefense) {
    if (!move) return null;
    const lastDefense = justAppliedDefense ? DEFENSE_LABELS[justAppliedDefense] : null;
    const focus = (session.focus || []).includes(move.category);
    const cat = CATEGORY_LABELS[move.category] || { en: move.category, ar: move.category };
    if (lastDefense && (move.triggeredBy || []).includes(justAppliedDefense)) {
      return {
        en: `Reactive pivot: "${lastDefense.en}" closed the previous route, and this technique does not depend on it.`,
        ar: `التفاف مباشر: «${lastDefense.ar}» أغلق المسار السابق، وهذه التقنية لا تعتمد عليه.`,
      };
    }
    if (focus) {
      return {
        en: `Targeted: your past sessions show ${cat.en.toLowerCase()} is your weakest stage, so the adversary reaches it early.`,
        ar: `استهداف: جلساتك السابقة تُظهر أن «${cat.ar}» أضعف مرحلة لديك، فيصل إليها الخصم مبكرًا.`,
      };
    }
    if (lastDefense) {
      return {
        en: `"${lastDefense.en}" blocked the last move. This is the next viable ${cat.en.toLowerCase()} technique still open.`,
        ar: `«${lastDefense.ar}» أوقف الحركة السابقة. وهذه أقرب تقنية متاحة في مرحلة «${cat.ar}».`,
      };
    }
    return {
      en: `Opening move: the lowest-effort ${cat.en.toLowerCase()} technique available.`,
      ar: `حركة افتتاحية: أسهل تقنية متاحة في مرحلة «${cat.ar}».`,
    };
  }

  startSession(userId, options = {}) {
    const sessionId = crypto.randomUUID();
    const session = {
      userId: userId == null ? null : String(userId),
      attemptedMoveIds: new Set(),
      activeDefenses: new Set(),
      currentMoveId: null,
      contained: false,
      focus: Array.isArray(options.focus) ? options.focus.filter((c) => CATEGORY_LABELS[c]) : [],
      moves: [],
      log: [],
      startedAt: new Date().toISOString(),
      containedAt: null,
    };

    const firstMove = this.selectNextMove(session, null);
    this.recordMove(session, firstMove, this.explainMove(session, firstMove, null), "engine");
    this.sessions.set(sessionId, session);
    this.evictOld();

    return {
      sessionId,
      move: firstMove ? this.publicMove(firstMove) : null,
      rationale: session.moves[0]?.rationale || null,
      focus: session.focus,
      contained: false,
    };
  }

  recordMove(session, move, rationale, decidedBy) {
    session.currentMoveId = move?.id || null;
    if (!move) return;
    session.attemptedMoveIds.add(move.id);
    session.moves.push({
      moveId: move.id,
      category: move.category,
      mitre: move.mitre,
      at: new Date().toISOString(),
      rationale,
      decidedBy,
    });
  }

  evictOld() {
    while (this.sessions.size > this.MAX_SESSIONS) {
      const oldest = this.sessions.keys().next().value;
      this.sessions.delete(oldest);
    }
  }

  // A session is only visible to the user who started it.
  getOwnedSession(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.userId !== null && String(userId) !== session.userId) return null;
    return session;
  }

  // Records a defensive action, checks whether it neutralizes the
  // adversary's current move, and — if so — picks a pivot. If the defense
  // doesn't touch the current move, the adversary simply continues.
  // `chooseNext` (optional) lets a proposer pick among the guardian-approved
  // candidates; anything it returns outside that list is ignored.
  applyDefense(sessionId, defenseId, userId, chooseNext) {
    const session = userId === undefined ? this.sessions.get(sessionId) : this.getOwnedSession(sessionId, userId);
    if (!session) return null;
    if (!DEFENSE_LABELS[defenseId]) {
      return { sessionId, contained: session.contained, neutralized: false, invalidDefense: true, move: null };
    }
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
      againstMoveId: currentMove?.id || null,
      againstCategory: currentMove?.category || null,
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

    const candidates = this.candidateMoves(session, defenseId);
    let nextMove = candidates[0] || null;
    let decidedBy = "engine";
    let rationale = null;

    if (nextMove && typeof chooseNext === "function") {
      const proposal = chooseNext(candidates, session, defenseId);
      if (proposal && candidates.some((m) => m.id === proposal.moveId)) {
        nextMove = MOVES_BY_ID.get(proposal.moveId);
        decidedBy = "model";
        rationale = proposal.rationale || null;
      }
    }

    if (!nextMove) {
      session.contained = true;
      session.currentMoveId = null;
      session.containedAt = new Date().toISOString();
      return { sessionId, contained: true, neutralized: true, move: null };
    }

    rationale = rationale || this.explainMove(session, nextMove, defenseId);
    this.recordMove(session, nextMove, rationale, decidedBy);

    return {
      sessionId,
      contained: false,
      neutralized: true,
      move: this.publicMove(nextMove),
      rationale,
      decidedBy,
    };
  }

  getState(sessionId, userId) {
    const session = userId === undefined ? this.sessions.get(sessionId) : this.getOwnedSession(sessionId, userId);
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

  // Full factual record of a session, used for forensics scoring, the
  // after-action report and readiness measurement.
  getSessionRecord(sessionId, userId) {
    const session = this.getOwnedSession(sessionId, userId);
    if (!session) return null;
    return {
      sessionId,
      userId: session.userId,
      contained: session.contained,
      startedAt: session.startedAt,
      containedAt: session.containedAt,
      focus: [...(session.focus || [])],
      moves: session.moves.map((m) => ({ ...m })),
      defenses: session.log.filter((l) => l.type === "defense").map((l) => ({ ...l })),
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

  getMove(moveId) {
    return MOVES_BY_ID.get(moveId) || null;
  }

  getAllMoves() {
    return MOVES.map((m) => ({ ...m }));
  }

  getEvidence(moveId) {
    return EVIDENCE[moveId] || null;
  }

  getDefenseLabel(defenseId) {
    return DEFENSE_LABELS[defenseId] || null;
  }

  getCategoryLabel(category) {
    return CATEGORY_LABELS[category] || { en: category, ar: category };
  }

  getDefenseCatalog() {
    return Object.entries(DEFENSE_LABELS).map(([id, label]) => ({ id, ...label }));
  }
}

// Singleton, matching the rest of the codebase's per-process in-memory
// services (data/progress.js, data/aiLogs.js) — deliberately not persisted
// to a DB: an adversary session is a single training run, not data that
// needs to survive a restart. Completed runs are persisted separately by
// backend/data/trainingRuns.js.
module.exports = new AdversaryEngine();
