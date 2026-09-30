// Lab definitions — the single source of truth for the terminal labs.
//
// These used to live in frontend/pages/terminal.html, which meant every flag
// shipped to the browser in plain text and completion was whatever the page
// said it was. They now live only on the server: the browser sends commands,
// the server returns output, validates flags and awards XP.

const LABS = {
  1: {
    name: "Reconnaissance Lab",
    difficulty: "Beginner",
    objective: "Scan target IP <code class='neon-code'>10.0.4.15</code> to identify ports, then extract flag from the target machine's config directory.",
    flag: "FLAG{nmap_recon_specialist_902}",
    hint: "Try typing: `nmap -sS 10.0.4.15` to find open ports, then list files with `ls` or read readme.txt",
    commands: {
      "help": "Available: ls, cat <file>, nmap <ip>, whoami, pwd, clear, hint",
      "whoami": "agent",
      "pwd": "/home/agent/recon_lab",
      "ls": "logs/ &nbsp; documents/ &nbsp; config.ini &nbsp; readme.txt",
      "ls -la": "drwxr-xr-x  2 agent users  4096 May 22 12:00 .\ndrwxr-xr-x 10 agent users  4096 May 22 12:00 ..\n-rw-r--r--  1 agent users   240 May 22 12:00 config.ini\n-rw-r--r--  1 agent users   512 May 22 12:00 readme.txt\ndrwxr-xr-x  2 agent users  4096 May 22 12:00 logs",
      "cat readme.txt": "Target environment configuration. Target IP is 10.0.4.15. Read config.ini to check parameters.",
      "cat config.ini": "[system]\nport = 8080\nenvironment = sandbox\nflag = FLAG{nmap_recon_specialist_902}",
      "nmap 10.0.4.15": "Starting Nmap 7.93...\nNmap scan report for 10.0.4.15\nHost is up (0.0003s latency).\nNot shown: 998 closed ports\nPORT     STATE SERVICE\n8080/tcp open  http-proxy\n\nNmap done: 1 IP address scanned (1 host up) in 0.05 seconds"
    }
  },
  2: {
    name: "SQLi Log Auditing",
    difficulty: "Intermediate",
    objective: "Analyze access logs in the logs folder. Discover a successful SQLi attack pattern and extract the database flag leaking in the request query parameters.",
    flag: "FLAG{sqli_log_detective_810}",
    hint: "Try checking logs: Type `ls logs` or read the webserver access log directly: `cat logs/access.log`.",
    commands: {
      "help": "Available: ls, ls logs, cat <file>, whoami, pwd, clear, hint",
      "whoami": "security_auditor",
      "pwd": "/var/log/apache2",
      "ls": "logs/",
      "ls logs": "access.log &nbsp; error.log",
      "cat logs/access.log": "192.168.1.55 - - [22/May/2026:14:22:01] \"GET /index.php HTTP/1.1\" 200 442\n192.168.1.110 - - [22/May/2026:14:23:05] \"GET /login.php?user=admin' OR '1'='1&pass=123 HTTP/1.1\" 302 0\n192.168.1.110 - - [22/May/2026:14:24:12] \"GET /search.php?q=union+select+null,null,flag+from+secrets-- HTTP/1.1\" 200 850\n192.168.1.110 - - [22/May/2026:14:24:45] \"GET /query_leak.php?dump=FLAG{sqli_log_detective_810} HTTP/1.1\" 200 12",
      "cat logs/error.log": "[warn] RSA server certificate CommonName (CN) mismatch\n[info] Apache/2.4.52 (Ubuntu) configured -- resuming normal operations"
    }
  },
  3: {
    name: "Privilege Escalation",
    difficulty: "Advanced",
    objective: "Escalate privilege inside the machine. Uncover security credentials stored in hidden system backup folders.",
    flag: "FLAG{priv_esc_master_303}",
    hint: "Hidden files and folders start with a dot (.). Try listing hidden files with `ls -la`. Then read credentials inside `.backups/shadow_credentials`.",
    commands: {
      "help": "Available: ls, ls -la, cat <file>, whoami, clear, hint",
      "whoami": "low_priv_user",
      "pwd": "/home/low_priv_user",
      "ls": "documents &nbsp; public &nbsp; downloads",
      "ls -la": "drwxr-xr-x 4 low_priv_user users 4096 May 22 12:00 .\ndrwxr-xr-x 8 root          root  4096 May 22 12:00 ..\ndrwxr-xr-x 2 low_priv_user users 4096 May 22 12:00 documents\ndrwxr-xr-x 2 low_priv_user users 4096 May 22 12:00 .backups",
      "ls .backups": "shadow_credentials &nbsp; system.bak",
      "cat .backups/shadow_credentials": "=== SYSTEM DECRYPTION KEYS ===\nroot_hash = $6$sY92K1$l02Kla\nflag = FLAG{priv_esc_master_303}\n=============================="
    }
  },
  4: {
    name: "Defensive Firewall Block",
    difficulty: "Intermediate",
    objective: "Write a firewall rule to drop all incoming packets from attacking IP <code class='neon-code'>192.168.1.100</code> using standard iptables.",
    flag: "FLAG{firewall_sentinel_771}",
    hint: "Use iptables command format: `iptables -A INPUT -s 192.168.1.100 -j DROP`. Run it to contain the attacker!",
    commands: {
      "help": "Available: iptables <options>, whoami, pwd, clear, hint",
      "whoami": "root",
      "pwd": "/root",
      "ls": "iptables_logs",
      "iptables -A INPUT -s 192.168.1.100 -j DROP": "[sudo] executing firewall rule...\nUpdating netfilter policy rule table...\nRule added: DROP packets from 192.168.1.100 to INPUT chain.\nAttack successfully contained! Flag released: FLAG{firewall_sentinel_771}"
    }
  },
  5: {
    name: "Adaptive Adversary Simulation",
    difficulty: "AI-Adaptive",
    objective: "A live adversary is actively probing your systems. Unlike the other labs, there is no fixed script — the attacker tracks every defense you deploy and picks a genuinely different next move in response. Type <code class='neon-code'>help</code> to see available defensive commands. Contain every avenue of attack to win.",
    isAdversary: true,
  }
};

const PRESSURE_TIME_LIMITS_MS = {
  Beginner: 4 * 60 * 1000,
  Intermediate: 6 * 60 * 1000,
  Advanced: 8 * 60 * 1000,
  "AI-Adaptive": 10 * 60 * 1000,
};
const PRESSURE_BONUS_RATE = 0.4;

const LAB_XP = { default: 50, adversary: 100 };

// Arabic names/objectives for the lab list (command output stays as the
// simulated system prints it, which is English on a real host too).
const LAB_AR = {
  1: { name: "مختبر الاستطلاع", objective: "افحص العنوان <code class='neon-code'>10.0.4.15</code> لمعرفة المنافذ المفتوحة، ثم استخرج العلم من مجلد إعدادات الجهاز المستهدف." },
  2: { name: "تدقيق سجلات حقن SQL", objective: "حلّل سجلات الوصول في مجلد logs، واكتشف نمط هجوم حقن SQL ناجح، واستخرج العلم المسرّب في معاملات الطلب." },
  3: { name: "تصعيد الصلاحيات", objective: "صعّد صلاحياتك داخل الجهاز، واكشف بيانات الاعتماد المخزّنة في مجلدات النسخ الاحتياطي المخفية." },
  4: { name: "حظر بجدار الحماية", objective: "اكتب قاعدة جدار حماية تُسقط كل الحزم الواردة من العنوان المهاجم <code class='neon-code'>192.168.1.100</code> باستخدام iptables." },
  5: { name: "الخصم المتكيّف", objective: "خصم حيّ يفحص أنظمتك الآن. لا يوجد سيناريو ثابت: يتتبّع المهاجم كل دفاع تنشره ويختار حركة مختلفة فعلًا. اكتب <code class='neon-code'>help</code> لرؤية أوامر الدفاع. أغلق كل مسارات الهجوم لتفوز." },
};

function getLab(labId) {
  return LABS[Number(labId)] || null;
}

function publicLab(labId, lang = "en") {
  const id = Number(labId);
  const lab = LABS[id];
  if (!lab) return null;
  const ar = lang === "ar" ? LAB_AR[id] || {} : {};
  return {
    id,
    name: ar.name || lab.name,
    difficulty: lab.difficulty,
    objective: ar.objective || lab.objective,
    isAdversary: Boolean(lab.isAdversary),
    xp: lab.isAdversary ? LAB_XP.adversary : LAB_XP.default,
    pressureTimeLimitMs: PRESSURE_TIME_LIMITS_MS[lab.difficulty] || 6 * 60 * 1000,
  };
}

function listLabs(lang = "en") {
  return Object.keys(LABS).map((id) => publicLab(id, lang));
}

module.exports = { LABS, PRESSURE_TIME_LIMITS_MS, PRESSURE_BONUS_RATE, LAB_XP, getLab, publicLab, listLabs };
