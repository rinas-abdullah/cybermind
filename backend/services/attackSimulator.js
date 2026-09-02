// ===== AI ATTACK SIMULATOR =====

/**
 * Generates realistic cybersecurity attack scenarios
 * Users must identify threats and take appropriate defensive actions
 */

class AttackSimulator {
  constructor() {
    this.attackDatabase = this.initializeAttacks();
    this.attackHistory = new Map();
    this.allowedDifficulties = new Set([
      "beginner",
      "intermediate",
      "advanced",
      "expert",
      "all",
    ]);
  }

  // ==================================================
  // HELPERS
  // ==================================================

  normalizeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  normalizeDifficulty(value) {
    const difficulty = this.normalizeText(value, "beginner").toLowerCase();

    if (["easy", "basic", "1"].includes(difficulty)) return "beginner";
    if (["medium", "2", "3"].includes(difficulty)) return "intermediate";
    if (["hard", "4"].includes(difficulty)) return "advanced";
    if (["5"].includes(difficulty)) return "expert";

    return this.allowedDifficulties.has(difficulty) ? difficulty : "beginner";
  }

  normalizeCategory(value) {
    return this.normalizeText(value).toLowerCase();
  }

  randomItem(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  getDatabaseCategories() {
    return Object.keys(this.attackDatabase || {});
  }

  flattenDatabase() {
    const scenarios = [];
    for (const category of this.getDatabaseCategories()) {
      scenarios.push(...(this.attackDatabase[category] || []));
    }
    return scenarios;
  }

  // ==================================================
  // INITIALIZATION
  // ==================================================

  initializeAttacks() {
    return {
      phishing: [
        {
          id: "phishing-1",
          title: "Suspicious Banking Email",
          description: "You received an email from what appears to be your bank.",
          category: "phishing",
          difficulty: "beginner",
          skillTags: ["phishing-detection", "email-security", "verification"],
          scenario: {
            text:
              "Email received:\nFrom: security@yourbank.com\nSubject: Verify your account immediately\nBody: Click here to verify your account details. Your bank account is at risk!",
            imageUrl: "/images/phishing-email.png",
          },
          decisions: [
            {
              id: "decision-1",
              text: "Click the link immediately to verify account",
              score: 0,
              consequence: "You fell for phishing and exposed your credentials.",
              explanation:
                "Never trust urgent account-verification links in unexpected emails. Navigate independently to the official site instead.",
            },
            {
              id: "decision-2",
              text: "Call the bank using the number on your card",
              score: 100,
              consequence: "Correct. The bank confirms it was a phishing attempt.",
              explanation:
                "Excellent response. Independent verification is a strong defensive habit.",
            },
            {
              id: "decision-3",
              text: "Inspect the sender carefully and verify the real domain",
              score: 75,
              consequence: "Good catch. The sender details reveal spoofing signs.",
              explanation:
                "Checking sender identity is useful, but independent verification is even stronger.",
            },
            {
              id: "decision-4",
              text: "Ignore and delete the email",
              score: 85,
              consequence: "Safe choice. The immediate risk is avoided.",
              explanation:
                "Deleting is safer than interacting, though reporting it would help protect others too.",
            },
          ],
          realWorldContext:
            "Phishing remains one of the most common entry points for account compromise and broader data breaches.",
          defensivePrinciples: [
            "Zero Trust",
            "Independent Verification",
            "Domain Verification",
            "Report Suspicious Activity",
          ],
          estimatedTime: 120,
        },
        {
          id: "phishing-2",
          title: "IT Support Credential Request",
          description: "An internal chat message appears to come from IT support.",
          category: "phishing",
          difficulty: "beginner",
          skillTags: ["social-engineering", "credential-protection", "verification"],
          scenario: {
            text:
              "Chat message from 'IT Support':\n'Hi! We're performing urgent security updates. Please confirm your username and password for verification.'\n\nSender: IT_Support (Team Chat)",
          },
          decisions: [
            {
              id: "decision-1",
              text: "Provide username and password immediately",
              score: 0,
              consequence: "Credentials are stolen and attacker access is established.",
              explanation:
                "Legitimate support teams do not ask for passwords through chat. Credentials should never be shared.",
            },
            {
              id: "decision-2",
              text: "Ignore the message and contact IT through official channels",
              score: 100,
              consequence: "Correct. The request is confirmed as malicious.",
              explanation:
                "Perfect response. Verify identity through official support channels.",
            },
            {
              id: "decision-3",
              text: "Ask the sender to prove they are really IT",
              score: 60,
              consequence: "Better than sharing credentials, but still risky.",
              explanation:
                "Attackers can fake convincing replies. Official channels remain the safest verification method.",
            },
          ],
          realWorldContext:
            "Internal-looking messages are often used to exploit trust and steal credentials.",
          defensivePrinciples: [
            "Credential Protection",
            "Social Engineering Awareness",
            "Official Verification Channels",
          ],
          estimatedTime: 90,
        },
      ],

      reconnaissance: [
        {
          id: "recon-1",
          title: "Suspicious Port Scan Activity",
          description: "IDS alerts on unusual network scanning activity.",
          category: "reconnaissance",
          difficulty: "intermediate",
          skillTags: ["network-security", "incident-detection", "analysis"],
          scenario: {
            text:
              "Security alert:\nSource: 192.168.1.100 (Unknown device)\nActivity: Port scan detected on 192.168.1.0/24\nPorts scanned: 22, 80, 443, 3306, 5432\nScan rate: 1000 ports/min\nTime: 2 minutes",
          },
          decisions: [
            {
              id: "decision-1",
              text: "Ignore it because it is probably internal testing",
              score: 0,
              consequence: "Reconnaissance continues and the attacker maps your environment.",
              explanation:
                "Port scans should not be ignored. Investigation and verification are necessary.",
            },
            {
              id: "decision-2",
              text: "Immediately isolate the source IP",
              score: 70,
              consequence: "The activity stops, but investigation is incomplete.",
              explanation:
                "Containment is useful, but documentation and validation are also needed.",
            },
            {
              id: "decision-3",
              text: "Document the activity, investigate the source, and verify exposure",
              score: 100,
              consequence: "Correct. The threat is investigated and contained properly.",
              explanation:
                "Strong response. Investigate, document, assess exposure, and contain the risk.",
            },
            {
              id: "decision-4",
              text: "Block the IP permanently without investigating",
              score: 80,
              consequence: "The immediate scan stops, but context is missing.",
              explanation:
                "Blocking can help, but you still need analysis to understand whether the source is malicious or misconfigured.",
            },
          ],
          realWorldContext:
            "Reconnaissance is often the first step before exploitation. Early detection reduces breach risk.",
          defensivePrinciples: [
            "Monitoring",
            "Incident Response",
            "Investigation",
            "Containment",
          ],
          estimatedTime: 300,
        },
      ],

      "sql-injection": [
        {
          id: "sqli-1",
          title: "Suspicious Database Query Behavior",
          description: "A web application shows unusual SQL query behavior.",
          category: "sql-injection",
          difficulty: "intermediate",
          skillTags: ["sql-injection", "web-security", "input-validation"],
          scenario: {
            text:
              "Database logs show:\nQuery: SELECT * FROM users WHERE username='admin' OR '1'='1'\nSource: Web application login form\nAttempt count: 15 in last 5 minutes\nResult: Returned entire user table including password hashes",
          },
          decisions: [
            {
              id: "decision-1",
              text: "Make passwords more complex",
              score: 10,
              consequence: "The root issue remains exploitable.",
              explanation:
                "Password strength is important, but this problem is unsafe query construction.",
            },
            {
              id: "decision-2",
              text: "Implement parameterized queries or prepared statements",
              score: 100,
              consequence: "Correct. The SQL injection path is removed.",
              explanation:
                "Prepared statements separate data from code and are a core defense against SQL injection.",
            },
            {
              id: "decision-3",
              text: "Add WAF rules only",
              score: 75,
              consequence: "Some attacks may be blocked, but the application is still vulnerable.",
              explanation:
                "A WAF can help as defense in depth, but the application code still needs fixing.",
            },
            {
              id: "decision-4",
              text: "Block the attacker IP address only",
              score: 20,
              consequence: "This attempt stops, but the vulnerability remains for others.",
              explanation:
                "Blocking the source does not fix the underlying injection flaw.",
            },
          ],
          realWorldContext:
            "SQL injection continues to cause severe data exposure when secure coding practices are missing.",
          defensivePrinciples: [
            "Input Validation",
            "Parameterized Queries",
            "Secure Coding",
            "Defense in Depth",
          ],
          estimatedTime: 300,
        },
      ],

      "privilege-escalation": [
        {
          id: "privesc-1",
          title: "SUID Binary with Vulnerability",
          description: "A Linux audit reveals a vulnerable SUID binary.",
          category: "privilege-escalation",
          difficulty: "advanced",
          skillTags: ["privilege-escalation", "linux-security", "system-hardening"],
          scenario: {
            text:
              "Linux system audit findings:\nFile: /usr/local/bin/backup (SUID bit set, owned by root)\nOwner: root\nPermissions: -rwsr-xr-x\nVulnerability: Buffer overflow in backup utility\nExploit available: Yes",
          },
          decisions: [
            {
              id: "decision-1",
              text: "Remove the SUID bit completely",
              score: 80,
              consequence: "The escalation path is reduced, but functionality may break.",
              explanation:
                "This is a strong hardening measure, though patching and testing are still important.",
            },
            {
              id: "decision-2",
              text: "Update or patch the vulnerable binary",
              score: 100,
              consequence: "Correct. The underlying vulnerability is fixed while functionality is preserved.",
              explanation:
                "Patching the vulnerable component addresses the root cause.",
            },
            {
              id: "decision-3",
              text: "Restrict access with permissions and SELinux",
              score: 90,
              consequence: "Defense improves, though the vulnerable software still exists.",
              explanation:
                "This is strong defense in depth, but patching is still the clean fix.",
            },
            {
              id: "decision-4",
              text: "Enable monitoring only",
              score: 40,
              consequence: "You may detect exploitation, but the vulnerability remains active.",
              explanation:
                "Monitoring helps detection, not remediation.",
            },
          ],
          realWorldContext:
            "Privilege escalation is often used after initial compromise to gain broader control over systems.",
          defensivePrinciples: [
            "Least Privilege",
            "Patch Management",
            "System Hardening",
            "Monitoring",
          ],
          estimatedTime: 420,
        },
      ],

      malware: [
        {
          id: "malware-1",
          title: "Suspicious Executable Detected",
          description: "An antivirus product quarantines a suspicious executable.",
          category: "malware",
          difficulty: "advanced",
          skillTags: ["malware-analysis", "incident-response", "threat-detection"],
          scenario: {
            text:
              "Antivirus Alert:\nFile: invoice_2024.exe\nSource: Email attachment from unknown sender\nHash: 5d41402abc4b2a76b9719d911017c592\nSignature: Not signed\nBehavior: Attempts network connection and writes to registry\nStatus: Quarantined",
          },
          decisions: [
            {
              id: "decision-1",
              text: "Execute it in a controlled sandbox for analysis",
              score: 70,
              consequence: "Behavior is observed safely in isolation.",
              explanation:
                "Sandboxing can be valid for controlled analysis, but confirm procedures and containment first.",
            },
            {
              id: "decision-2",
              text: "Check the hash with threat intelligence sources and remove it safely",
              score: 100,
              consequence: "Correct. The threat is confirmed and handled safely.",
              explanation:
                "Threat intelligence plus safe containment is a strong and practical response.",
            },
            {
              id: "decision-3",
              text: "Leave it in quarantine and wait",
              score: 30,
              consequence: "The threat may not be fully investigated or eradicated.",
              explanation:
                "Passive handling is not enough. Suspicious files should be evaluated and resolved deliberately.",
            },
            {
              id: "decision-4",
              text: "Restore from backup immediately",
              score: 40,
              consequence: "Recovery may be premature and risks restoring unverified state.",
              explanation:
                "Backup recovery is useful only after the situation is understood and integrity is verified.",
            },
          ],
          realWorldContext:
            "Malware delivered by email attachments remains one of the most frequent organizational threats.",
          defensivePrinciples: [
            "Threat Intelligence",
            "Isolation",
            "Incident Response",
            "Threat Validation",
          ],
          estimatedTime: 480,
        },
      ],

      "incident-response": [
        {
          id: "incident-1",
          title: "Data Breach Incident Begins",
          description: "A possible data exfiltration event is detected in progress.",
          category: "incident-response",
          difficulty: "expert",
          skillTags: ["incident-response", "forensics", "communication"],
          scenario: {
            text:
              "Alert Summary:\nTime: 14:32 UTC\nAlert: Large data transfer detected\nSource: Server DB-01\nDestination: 203.0.113.50 (External - Unknown)\nData: Database backup file (5.2 GB)\nTransfer rate: 100 MB/s\nStatus: Transfer in progress",
          },
          decisions: [
            {
              id: "decision-1",
              text: "Immediately cut the network connection",
              score: 85,
              consequence: "The transfer is disrupted, reducing ongoing damage.",
              explanation:
                "Containment is important, but broader incident coordination is also needed.",
            },
            {
              id: "decision-2",
              text: "Activate the incident response plan: contain, investigate, and communicate",
              score: 100,
              consequence: "Correct. The incident is handled in a coordinated and defensible way.",
              explanation:
                "This is the strongest response because it combines containment with investigation and communication.",
            },
            {
              id: "decision-3",
              text: "Start forensics before containment",
              score: 70,
              consequence: "Useful evidence may be gathered, but damage continues during analysis.",
              explanation:
                "Forensics matters, but active harm often needs containment first.",
            },
            {
              id: "decision-4",
              text: "Notify executives first before technical action",
              score: 60,
              consequence: "Stakeholders are informed, but the technical threat remains active.",
              explanation:
                "Communication is necessary, but immediate technical containment should not be delayed.",
            },
          ],
          realWorldContext:
            "Fast and structured incident response can greatly reduce breach impact and recovery cost.",
          defensivePrinciples: [
            "Incident Response",
            "Containment",
            "Investigation",
            "Communication",
          ],
          estimatedTime: 600,
        },
      ],
    };
  }

  // ==================================================
  // CORE ACCESSORS
  // ==================================================

  /**
   * Get attack scenario by ID
   */
  getScenario(scenarioId) {
    const id = this.normalizeText(scenarioId);
    if (!id) return null;

    for (const category of this.getDatabaseCategories()) {
      const scenario = (this.attackDatabase[category] || []).find(
        (s) => s.id === id
      );
      if (scenario) return scenario;
    }

    return null;
  }

  /**
   * Get random scenario by difficulty and category
   */
  getRandomScenario(difficulty = "beginner", category = null) {
    const normalizedDifficulty = this.normalizeDifficulty(difficulty);
    const normalizedCategory = this.normalizeCategory(category);

    let scenarios = [];

    if (
      normalizedCategory &&
      this.attackDatabase[normalizedCategory] &&
      Array.isArray(this.attackDatabase[normalizedCategory])
    ) {
      scenarios = this.attackDatabase[normalizedCategory].filter(
        (s) =>
          normalizedDifficulty === "all" ||
          this.normalizeDifficulty(s.difficulty) === normalizedDifficulty
      );
    } else {
      scenarios = this.flattenDatabase().filter(
        (s) =>
          normalizedDifficulty === "all" ||
          this.normalizeDifficulty(s.difficulty) === normalizedDifficulty
      );
    }

    return this.randomItem(scenarios);
  }

  /**
   * Get scenarios by difficulty
   */
  getScenariosByDifficulty(difficulty) {
    const normalizedDifficulty = this.normalizeDifficulty(difficulty);

    if (normalizedDifficulty === "all") {
      return this.getAllScenarios();
    }

    return this.flattenDatabase().filter(
      (s) => this.normalizeDifficulty(s.difficulty) === normalizedDifficulty
    );
  }

  /**
   * Get scenarios by category
   */
  getScenariosByCategory(category) {
    const normalizedCategory = this.normalizeCategory(category);
    return Array.isArray(this.attackDatabase[normalizedCategory])
      ? [...this.attackDatabase[normalizedCategory]]
      : [];
  }

  /**
   * Get all scenarios
   */
  getAllScenarios() {
    return this.flattenDatabase();
  }

  // ==================================================
  // DECISION PROCESSING
  // ==================================================

  /**
   * Process user decision in scenario
   */
  processDecision(scenarioId, decisionId, options = {}) {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) return null;

    const decision = Array.isArray(scenario.decisions)
      ? scenario.decisions.find((d) => d.id === decisionId)
      : null;

    if (!decision) return null;

    const username = this.normalizeText(options.username);
    if (username) {
      if (!this.attackHistory.has(username)) {
        this.attackHistory.set(username, []);
      }

      this.attackHistory.get(username).push({
        scenarioId: scenario.id,
        decisionId: decision.id,
        score: Number(decision.score) || 0,
        timestamp: new Date().toISOString(),
      });
    }

    const numericScore = Number(decision.score) || 0;

    return {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      category: scenario.category,
      decision: {
        id: decision.id,
        text: decision.text,
      },
      result: {
        correct: numericScore >= 100,
        score: numericScore,
        feedback: decision.explanation,
        consequence: decision.consequence,
        realWorldContext: scenario.realWorldContext,
        defensivePrinciples: Array.isArray(scenario.defensivePrinciples)
          ? scenario.defensivePrinciples
          : [],
        skillsImproved: Array.isArray(scenario.skillTags)
          ? scenario.skillTags
          : [],
      },
    };
  }

  // ==================================================
  // ADAPTIVE SELECTION
  // ==================================================

  /**
   * Generate adaptive scenario for user
   */
  generateAdaptiveScenario(userProfile = {}) {
    const knowledgeLevel = Number(userProfile.knowledgeLevel) || 0;

    if (knowledgeLevel < 20) {
      return this.getRandomScenario("beginner");
    }

    if (knowledgeLevel < 50) {
      return this.getRandomScenario(Math.random() > 0.3 ? "beginner" : "intermediate");
    }

    if (knowledgeLevel < 75) {
      return this.getRandomScenario(Math.random() > 0.5 ? "intermediate" : "advanced");
    }

    return this.getRandomScenario(Math.random() > 0.4 ? "advanced" : "expert");
  }

  /**
   * Focus on weak skills
   */
  getScenarioForWeakSkill(weakSkill, preferredDifficulty = "all") {
    const skill = this.normalizeText(weakSkill);
    if (!skill) return null;

    const normalizedDifficulty = this.normalizeDifficulty(preferredDifficulty);

    const matching = this.getAllScenarios().filter((scenario) => {
      const skillMatch =
        Array.isArray(scenario.skillTags) && scenario.skillTags.includes(skill);

      const difficultyMatch =
        normalizedDifficulty === "all" ||
        this.normalizeDifficulty(scenario.difficulty) === normalizedDifficulty;

      return skillMatch && difficultyMatch;
    });

    return this.randomItem(matching);
  }

  /**
   * Get user history
   */
  getUserAttackHistory(username) {
    const user = this.normalizeText(username);
    if (!user || !this.attackHistory.has(user)) return [];
    return [...this.attackHistory.get(user)];
  }

  /**
   * Reset user history
   */
  clearUserAttackHistory(username) {
    const user = this.normalizeText(username);
    if (!user) return false;
    return this.attackHistory.delete(user);
  }
}

module.exports = AttackSimulator;