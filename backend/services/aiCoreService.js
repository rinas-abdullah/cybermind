const { getAiClient } = require("./ai/aiProvider");
const db = require("../db");

class AICoreService {
  constructor() {
    this.openai = getAiClient();
  }

  async recordAudit(userId, action, details) {
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, details, timestamp)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [userId, action, JSON.stringify(details || {})]
      );
    } catch (error) {
      console.error("AICoreService.audit error:", error);
    }
  }

  async calculateAdaptiveResilienceScore(systemResponseTime, userReactionTime) {
    const syst = Number(systemResponseTime);
    const user = Number(userReactionTime);

    if (!Number.isFinite(syst) || !Number.isFinite(user) || user <= 0) {
      return 0;
    }

    const ratio = Math.min(5, Math.max(0.1, user / (syst + 0.0001)));
    const score = Math.round(
      Math.max(0, Math.min(100, ratio * 20 * (user > syst ? 1.2 : 0.8)))
    );

    return Number(score.toFixed(2));
  }

  async storeAdaptiveResilienceMetric({
    userId,
    scenarioId,
    sessionId,
    score,
    contextText,
  }) {
    try {
      await db.query(
        `INSERT INTO performance_metrics
         (user_id, scenario_id, session_id, adaptive_resilience_score, ai_analysis, timestamp)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [userId, scenarioId || null, sessionId || null, score, contextText || null]
      );
    } catch (error) {
      console.error("AICoreService.storeAdaptiveResilienceMetric error:", error);
    }
  }

  async getLatestTechnicalResume(userId) {
    const { rows } = await db.query(
      `SELECT content, generated_at
       FROM ai_technical_resumes
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [userId]
    );

    return rows[0] || null;
  }

  async generateTechnicalResume(userId, pathId) {
    const user = await this._getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const auditLogs = await db.query(
      `SELECT action, details, timestamp
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 150`,
      [userId]
    );

    const perfMetrics = await db.query(
      `SELECT *
       FROM performance_metrics
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 150`,
      [userId]
    );

    const prompt =
      `You are an experienced cybersecurity hiring manager writing a professional technical resume/skills summary. ` +
      `Based on the user context below, write a concise but detailed paragraph (4-6 sentences) emphasizing technical strengths, security competencies, problem-solving, and operational effectiveness. ` +
      `Do not reveal raw logs. Keep tone expert, specific, and applicable to security teams.\n\n` +
      `User: ${user.username} (${user.email})\n` +
      `Path completion reference: ${pathId ? "path_id=" + pathId : "N/A"}\n` +
      `Audit logs: ${JSON.stringify(auditLogs.rows.slice(0, 20))}\n` +
      `Performance metrics summary: ${JSON.stringify(perfMetrics.rows.slice(0, 20))}`;

    let generatedResume =
      "Cybersecurity practitioner with measurable training outcomes. Has completed targeted hands-on modules and demonstrates strong analytical thinking.";

    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 280,
        });

        const text = response?.choices?.[0]?.message?.content?.trim();
        if (text) {
          generatedResume = text;
        }
      } catch (err) {
        console.warn(
          "AICoreService.generateTechnicalResume AI fallback:",
          err.message
        );
      }
    }

    try {
      await db.query(
        `INSERT INTO ai_technical_resumes (user_id, path_id, content, source, generated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [userId, pathId || null, generatedResume, "AI_TECHNICAL_RESUME"]
      );
    } catch (error) {
      console.error(
        "AICoreService.generateTechnicalResume persist error:",
        error
      );
    }

    await this.recordAudit(userId, "AI_TECHNICAL_RESUME_GENERATION", {
      pathId,
      generatedAt: new Date().toISOString(),
      length: generatedResume.length,
    });

    return { technicalResume: generatedResume };
  }

  async generateDynamicScenario(userId) {
    const user = await this._getUserById(userId);
    const difficulty = await this._getUserDifficulty(userId);

    const prompt =
      `You are an elite cybersecurity curriculum designer and purple team threat architect.\n` +
      `Design an immersive, operational cybersecurity training scenario tailored for a learner at the ${difficulty} difficulty tier.\n\n` +
      `The scenario must simulate a realistic, multi-phase threat campaign matching the MITRE ATT&CK matrix. It should begin with a specific Initial Access vector (e.g., highly targeted spear-phishing utilizing SPF/DKIM validation failures, or exploitation of an edge-facing service vulnerability) and progress dynamically through subsequent operational phases (e.g., Persistence, Lateral Movement, Credential Access, or Exfiltration).\n\n` +
      `Instructions for Phases:\n` +
      `- Phase 1: Initial Investigation (e.g., examining mail transfer agent (MTA) headers, checking system execution logs, or analyzing firewall event logs).\n` +
      `- Phase 2: Threat Containment (e.g., executing network-level isolation commands like iptables, ending compromised user sessions, or disabling API endpoints).\n` +
      `- Phase 3: Root-Cause Remediation (e.g., establishing parameterized query configurations, building robust Content Security Policies (CSP), or implementing DMARC 'reject' policies).\n` +
      `- Phase 4: Verification and Incident Recovery.\n\n` +
      `Provide a deeply technical, highly professional overview. If the user context or name contains Arabic characters, output the scenario details in a cybersecurity-native Arabic style.\n\n` +
      `You MUST output ONLY a valid JSON object matching the following structure:\n` +
      `{\n` +
      `  "title": "Immersive and technically precise scenario title",\n` +
      `  "description": "Comprehensive, high-fidelity operational overview setting the scene of the incident",\n` +
      `  "phases": [\n` +
      `    "Detailed description of Phase 1 milestone including exact tools/commands (nmap, grep, iptables) to use",\n` +
      `    "Detailed description of Phase 2 milestone mapping out tactical containment actions",\n` +
      `    "Detailed description of Phase 3 milestone covering secure engineering practices and code mitigation"\n` +
      `  ],\n` +
      `  "expected_flag": "FLAG{precise-mitre-technique-identifier}"\n` +
      `}`;

    let aiResponse = {
      title: "Incident Auditing: Web Shell Detection & Containment",
      description:
        "A threat actor has successfully uploaded a PHP-based web shell through an unrestricted file upload endpoint in a public-facing web server. You must locate the web shell script in the public directories, audit Apache access logs to isolate the attacker's source IP, and deploy firewall rules to block the threat source.",
      phases: [
        "Audit public server directories (e.g., /var/www/uploads/) for anomalous files and inspect script hashes.",
        "Inspect Apache access.log for high-frequency anomalous POST requests directed at suspicious uploaded files.",
        "Deploy iptables packet filter rules to drop all connections originating from the attacker's isolated source IP.",
        "Modify application parameters to sanitize upload inputs, enforcing file-type validation and disabling script execution permissions in upload directories."
      ],
      expected_flag: "FLAG{webshell_hunted_and_contained_4492}",
    };

    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 450,
        });

        const text = completion?.choices?.[0]?.message?.content || "";
        const candidate = this._safeParseJson(text);
        if (candidate) {
          aiResponse = candidate;
        }
      } catch (err) {
        console.warn(
          "AICoreService.generateDynamicScenario AI fallback:",
          err.message
        );
      }
    }

    await this.recordAudit(userId, "AI_SCENARIO_GENERATION", {
      userId,
      difficulty,
      result: aiResponse,
      generatedAt: new Date().toISOString(),
    });

    const saved = await this._saveGeneratedScenario(userId, aiResponse);
    return { scenario: aiResponse, savedScenarioId: saved?.id || null };
  }

  async validateTaskSubmission(userId, taskId, submission) {
    const task = await this._getTaskById(taskId);
    if (!task) {
      return { isCorrect: false, message: "Task not found", severity: "error" };
    }

    const prompt =
      `You are an elite cybersecurity scoring engine and threat analysis specialist.\n` +
      `Your role is to strictly validate and grade a user's task submission in a sandboxed cyber range, ensuring technical depth, parameter correctness, and defense awareness.\n\n` +
      `Task Name: ${task.name}\n` +
      `Task Description: ${task.description}\n` +
      `Expected Output/Flag: ${task.expected_output || "(not specified)"}\n` +
      `User's Submission: ${submission}\n\n` +
      `Instructions:\n` +
      `1. Perform a deep, structural analysis of the user's submission. Check for command correctness, secure parameter configuration (e.g., nmap stealth and version flags, iptables chain target rules, secure prepared statements vs raw strings).\n` +
      `2. Explain exactly WHY the answer is correct or incorrect. If incorrect, explain the security implications (e.g., missing -sV exposes banner identification failures, noisy scans trigger IDS alarms, unparameterized SQL queries alter the lexical parsing tree).\n` +
      `3. Reference MITRE ATT&CK techniques, pedagogical guidance, and next steps for learning reinforcement.\n` +
      `4. Determine language dynamically: If the task, description, or submission uses Arabic, or you detect Arabic characters (e.g., /[\u0600-\u06FF]/), provide the response in a highly professional, cybersecurity-native Arabic style. Otherwise, respond in elite English.\n` +
      `5. Return ONLY a valid JSON object matching this schema:\n` +
      `{\n` +
      `  "isCorrect": true|false,\n` +
      `  "confidence": 0-100,\n` +
      `  "feedback": "Deep technical analysis and Socratic remediation here"\n` +
      `}`;

    let result = {
      isCorrect: false,
      confidence: 0,
      feedback: "Unable to validate at the moment.",
    };

    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 350,
        });

        const text = completion?.choices?.[0]?.message?.content || "";
        const parsed = this._safeParseJson(text);

        if (parsed && typeof parsed.isCorrect === "boolean") {
          result.isCorrect = parsed.isCorrect;
          result.confidence = Number(parsed.confidence || 0);
          result.feedback =
            parsed.feedback || (parsed.isCorrect ? "Correct" : "Incorrect");
        } else {
          result.feedback = `Could not parse AI response, got: ${text}`;
        }
      } catch (err) {
        console.warn("AICoreService.validateTaskSubmission AI fallback:", err.message);
        result.feedback = "AI validation service unavailable";
      }
    }

    // Always provide a highly rich, cybersecurity-native fallback if the result is still unsuccessful or OpenAI failed
    if (!result.isCorrect || result.feedback === "AI validation service unavailable") {
      const normalizedSubmission = String(submission || "").trim().toLowerCase();
      const normalizedExpected = String(task.expected_output || "")
        .trim()
        .toLowerCase();
      
      const isCorrectMatch = normalizedExpected && (normalizedSubmission === normalizedExpected || normalizedSubmission.includes(normalizedExpected.replace(/flag\{|\}/g, "")));
      
      if (isCorrectMatch) {
        result.isCorrect = true;
        result.confidence = 98;
        result.feedback = `[Elite Local Validation] Access Granted. Verified cryptographic flag for task '${task.name}'. Objective successfully accomplished via compliant SANS threat hunting metrics.`;
      } else {
        let fallbackFeedback = "";
        if (normalizedSubmission.includes("nmap")) {
          if (!normalizedSubmission.includes("-ss") && !normalizedSubmission.includes("-st")) {
            fallbackFeedback = "Tactical failure: Nmap command execution initiated, but crucial active scanning flags are absent. To bypass detection systems (IDS) and avoid triggering stateful alerts, utilize TCP SYN stealth scanning (-sS) or connection limiting.";
          } else if (!normalizedSubmission.includes("-sv")) {
            fallbackFeedback = "Tactical failure: Stealth flags are correct, but version detection (-sV) is missing. Without interrogating active application banners for version signatures, you cannot map CVE exposures effectively.";
          } else {
            fallbackFeedback = "Command syntax verified, but the target server banner has not been successfully parsed. Ensure you extract the precise system flag and submit it.";
          }
        } else if (normalizedSubmission.includes("iptables")) {
          if (!normalizedSubmission.includes("-a") && !normalizedSubmission.includes("-i")) {
            fallbackFeedback = "Tactical failure: Firewall manipulation command issued, but configuration chain rules are invalid. Enforce packet filtering on the inbound traffic chain by appending to INPUT (-A INPUT).";
          } else if (!normalizedSubmission.includes("drop") && !normalizedSubmission.includes("reject")) {
            fallbackFeedback = "Tactical failure: Rules targets designated INPUT chain, but the target action (DROP/REJECT) is undefined. Without dropping unmatched packets, the malicious routing will still persist.";
          } else {
            fallbackFeedback = "iptables containment syntax verified, but target execution confirmation is required. Submit the generated target hash or flag.";
          }
        } else if (normalizedSubmission.includes("select") || normalizedSubmission.includes("union") || normalizedSubmission.includes("insert") || normalizedSubmission.includes("or")) {
          fallbackFeedback = "Vulnerability failure: SQL syntax fragment detected. The injection failed to escape lexical data boundaries. Ensure database syntax characters (e.g., single quotes, SQL comments '--') are placed precisely to hijack the parser syntax tree.";
        } else if (normalizedSubmission.includes("<script>") || normalizedSubmission.includes("javascript:") || normalizedSubmission.includes("onerror")) {
          fallbackFeedback = "Remediation failure: Exploit string detected, but XSS injection has been trapped by DOM boundary controls. Verify the target context sink (Attribute, HTML body, DOM-source) to exploit the context transition.";
        } else {
          fallbackFeedback = `Goal unmet: Submission does not match target vector '${task.expected_output || "unspecified"}'. Verify protocol analysis parameters, audit access logs, or re-run active scanning tools to identify anomalous indicators.`;
        }
        
        result.isCorrect = false;
        result.confidence = 35;
        result.feedback = fallbackFeedback;
      }
    }

    await this.recordAudit(userId, "AI_TASK_VALIDATION", {
      taskId,
      submission,
      result,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async getSmartHint(userId, taskId) {
    const task = await this._getTaskById(taskId);
    if (!task) {
      return { hint: "Task not found" };
    }

    const prompt =
      `You are a SANS-certified Socratic Incident Commander and Threat Hunter.\n` +
      `Provide a smart, strategic hint for the following training task to guide the learner without giving away the direct flag or solution:\n` +
      `Task Name: ${task.name}\n` +
      `Task Description: ${task.description}\n\n` +
      `Instructions:\n` +
      `- Adopt a highly technical, tactical Socratic tutoring tone.\n` +
      `- Do not provide the exact answer, code, command, or flag.\n` +
      `- Ask a guiding question about protocol internals (e.g., SMTP header authentication status, TCP handshake sequences, or DBMS parsing boundaries) or system directories.\n` +
      `- Help the user think like an elite incident handler or penetration tester.\n` +
      `- Keep your response to 2-3 concise, high-impact sentences. If the task details contain Arabic characters, output the hint in a professional, cybersecurity-native Arabic style.`;

    let hint = "";

    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 180,
        });

        hint = completion?.choices?.[0]?.message?.content?.trim() || "";
      } catch (err) {
        console.warn("AICoreService.getSmartHint AI fallback:", err.message);
      }
    }

    if (!hint) {
      // High-fidelity local Socratic hints based on keywords
      const lowerName = String(task.name || "").toLowerCase();
      const lowerDesc = String(task.description || "").toLowerCase();
      const isArabic = /[\u0600-\u06FF]/.test(lowerName + lowerDesc);

      if (isArabic) {
        if (lowerName.includes("nmap") || lowerDesc.includes("فحص") || lowerDesc.includes("منفذ")) {
          hint = "💡 تلميح سقراطي: عند فحص الشبكة، فكر في حزمة TCP المصافحة الثلاثية. كيف يمكنك إرسال إشارة استكشاف دون إكمال الاتصال الكامل وتجنب لفت انتباه أنظمة كشف التسلل؟ وما هو الخيار الذي يجلب لك إصدار الخدمة بدقة؟";
        } else if (lowerName.includes("sql") || lowerDesc.includes("حقن")) {
          hint = "💡 تلميح سقراطي: ما هو الحد الفاصل بين البيانات والأوامر في قواعد البيانات؟ إذا تم تجميع هيكل الاستعلام مسبقاً قبل إدخال بيانات المستخدم، فهل يمكن لبياناتك تخريب البنية المنطقية للاستعلام؟ تفحص مفهوم prepared statements.";
        } else if (lowerName.includes("xss") || lowerDesc.includes("حقن نص") || lowerDesc.includes("cross")) {
          hint = "💡 تلميح سقراطي: أين تُكتب مدخلاتك في الصفحة؟ إذا كانت المتصفحات تعامل مدخلاتك كأكواد برمجية، فكيف نجعلها تعاملها كنصوص مجردة؟ ابحث في الفروقات بين innerHTML و textContent وسياسات CSP.";
        } else if (lowerName.includes("iptables") || lowerDesc.includes("جدار") || lowerDesc.includes("حظر")) {
          hint = "💡 تلميح سقراطي: انظر إلى مسار الحزم الواردة. في أي سلسلة تصفية (chain) يجب أن نضع القاعدة لحظر الاتصال الوارد من المهاجم؟ وما هو الإجراء الفعلي (DROP أو REJECT) الذي يعزل المنفذ تماماً؟";
        } else {
          hint = "💡 تلميح سقراطي: لا تبحث عن الإجابة النهائية مباشرة. ما هو البروتوكول أو المكون الذي تتعامل معه الآن؟ ابدأ بفحصه خطوة بخطوة وحلل سجلات النظام أو الترويسات للوصول للمؤشرات Anomalous Indicators.";
        }
      } else {
        if (lowerName.includes("nmap") || lowerDesc.includes("scan") || lowerDesc.includes("port")) {
          hint = "💡 Socratic Hint: Focus on the TCP Three-Way Handshake. How can you query a port to verify if it is open without completing the full connection stream and triggering high-frequency alerts? What flag explicitly requests service daemon banners?";
        } else if (lowerName.includes("sql") || lowerDesc.includes("injection")) {
          hint = "💡 Socratic Hint: Examine the logical boundary between command code and input data. If the SQL query syntax tree is pre-compiled before your input is attached, how does that change the parser boundaries?";
        } else if (lowerName.includes("xss") || lowerDesc.includes("cross") || lowerDesc.includes("script")) {
          hint = "💡 Socratic Hint: Consider context-aware transitions. If your input is injected into an HTML tag body vs an attribute, how does the client engine render it? Why is HttpOnly a powerful control against session hijacking?";
        } else if (lowerName.includes("iptables") || lowerDesc.includes("firewall") || lowerDesc.includes("block")) {
          hint = "💡 Socratic Hint: Track the packet inbound vector. To drop connections before they reach the web server daemon, which default iptables filter chain must you append the drop rule to?";
        } else {
          hint = "💡 Socratic Hint: Break the challenge down. Do not rush for the flag. What protocols, system logs, or configuration directories are active? Investigate their state step-by-step.";
        }
      }
    }

    await this.recordAudit(userId, "AI_SMART_HINT", {
      taskId,
      hint,
      timestamp: new Date().toISOString(),
    });

    return { hint };
  }

  async assignSecurityPersona(userId) {
    const metrics = await this._getUserMetrics(userId);
    const score = Number(metrics.average_accuracy || 0);
    const speed = Number(metrics.average_response_time || 0);

    let persona = "Security Practitioner";

    if (score >= 85 && speed <= 45) persona = "Threat Hunter";
    else if (score >= 70 && speed <= 60) persona = "Network Guardian";
    else if (score >= 50) persona = "Incident Responder";
    else persona = "Security Analyst";

    await this.recordAudit(userId, "AI_PERSONA_ASSIGNMENT", {
      userId,
      persona,
      metrics,
    });

    return { persona, metrics };
  }

  async getLeaderboard(institutionId) {
    const query = `
      SELECT
        u.id AS user_id,
        u.username,
        COALESCE(ROUND(AVG(pm.accuracy)::numeric, 2), 0) AS average_accuracy,
        COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM pm.avg_response_time))::numeric, 2), 0) AS avg_response_time,
        COALESCE(SUM(CASE WHEN tp.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_tasks,
        COALESCE(AVG(t.difficulty_level), 0) AS average_difficulty
      FROM users u
      LEFT JOIN performance_metrics pm ON pm.user_id = u.id
      LEFT JOIN task_progress tp ON tp.user_id = u.id
      LEFT JOIN tasks t ON t.id = tp.task_id
      WHERE u.institution_id = $1
      GROUP BY u.id, u.username
      ORDER BY average_accuracy DESC, completed_tasks DESC, avg_response_time ASC
      LIMIT 50
    `;

    const { rows } = await db.query(query, [institutionId]);

    const leaderBoard = await Promise.all(
      rows.map(async (row) => {
        const persona = (await this.assignSecurityPersona(row.user_id)).persona;
        return {
          username: row.username,
          averageAccuracy: Number(row.average_accuracy),
          avgResponseTime: Number(row.avg_response_time),
          completedTasks: Number(row.completed_tasks),
          averageDifficulty: Number(row.average_difficulty),
          persona,
        };
      })
    );

    await this.recordAudit(null, "AI_LEADERBOARD_VIEW", {
      institutionId,
      count: leaderBoard.length,
      timestamp: new Date().toISOString(),
    });

    return leaderBoard;
  }

  async getAttackerNextMove(userId, taskId, userAction) {
    const task = await this._getTaskById(taskId);
    const base =
      `You are an elite purple team threat modeler and strategic attack path analyst.\n` +
      `Analyze the user's latest defensive action and predict the adversary's tactical response in the cyber attack lifecycle.\n\n` +
      `User Action: ${userAction}\n` +
      `Target Task: ${task ? task.name : "Active Incident Investigation"}\n\n` +
      `Instructions:\n` +
      `- Determine the logical next step the adversary will take to bypass the defense, execute persistence, or pivot laterally.\n` +
      `- Frame your response as a threat modeling projection mapped to the MITRE ATT&CK framework (e.g., Lateral Movement via T1021, Credential Access via T1003, or Defense Evasion via T1562).\n` +
      `- Keep it concise. Provide the prediction name as the first line, followed by 2 sentences of expert tactical reasoning.`;

    let prediction = {
      nextMove: "Lateral Movement (MITRE T1021)",
      reasoning: "The defender has patched the exposed front-end vulnerability. The adversary will pivot laterally within the internal subnet using pre-compromised service tokens.",
    };

    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: base }],
          max_tokens: 180,
        });

        const content = completion?.choices?.[0]?.message?.content || "";
        const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
        prediction.nextMove = lines[0] || prediction.nextMove;
        prediction.reasoning = lines.slice(1).join(" ") || content;
      } catch (err) {
        console.warn("AICoreService.getAttackerNextMove fallback error:", err.message);
      }
    }

    // High-fidelity fallback heuristic based on threat modeling analysis
    const actionLower = String(userAction).toLowerCase();
    if (actionLower.includes("password") || actionLower.includes("credential") || actionLower.includes("login")) {
      prediction = {
        nextMove: "Credential Dumping (MITRE T1003)",
        reasoning: "The user updated credentials or initiated login tracking. In response, the threat actor will deploy memory scraping tools to dump credentials or harvest active active directory tokens from memory caches.",
      };
    } else if (actionLower.includes("nmap") || actionLower.includes("scan") || actionLower.includes("recon")) {
      prediction = {
        nextMove: "Active Directory Reconnaissance (MITRE T1087)",
        reasoning: "Defenders are auditing external access ports. The attacker will pivot internal scans to discover local accounts, active service principal names (SPNs), and domain trust hierarchies.",
      };
    } else if (actionLower.includes("iptables") || actionLower.includes("firewall") || actionLower.includes("block")) {
      prediction = {
        nextMove: "Defense Evasion: Protocol Tunneling (MITRE T1572)",
        reasoning: "Defenders placed IP dropping filters. The adversary will encapsulate Command and Control traffic inside permitted non-standard protocols like DNS or ICMP to tunnel past firewall filters.",
      };
    }

    await this.recordAudit(userId, "AI_ATTACK_CHAIN_NEXT_MOVE", {
      taskId,
      userAction,
      prediction,
      timestamp: new Date().toISOString(),
    });

    return prediction;
  }

  async getAdminGroupReport(institutionId) {
    const topResults = await this.getLeaderboard(institutionId);
    const overallAccuracy = topResults.length
      ? Number(
          (
            topResults.reduce((sum, x) => sum + x.averageAccuracy, 0) /
            topResults.length
          ).toFixed(2)
        )
      : 0;

    const report = {
      institutionId,
      generatedAt: new Date().toISOString(),
      summary: {
        overallAccuracy,
        totalStudents: topResults.length,
        topPersona: topResults.length ? topResults[0].persona : null,
      },
      topPerformers: topResults.slice(0, 10),
      insights: {
        strength:
          overallAccuracy >= 80
            ? "Strong threat detection"
            : "Needs work on consistent accuracy",
        risk: overallAccuracy < 60 ? "High risk" : "Moderate risk",
      },
    };

    await this.recordAudit(null, "AI_GRCREPORT_GENERATION", report);
    return report;
  }

  async _getUserById(userId) {
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    return rows[0] || null;
  }

  async _getTaskById(taskId) {
    const { rows } = await db.query("SELECT * FROM tasks WHERE id = $1", [taskId]);
    return rows[0] || null;
  }

  async _getUserDifficulty(userId) {
    const { rows } = await db.query(
      `SELECT AVG(accuracy) AS average_accuracy
       FROM performance_metrics
       WHERE user_id = $1`,
      [userId]
    );

    const avg = Number(rows[0]?.average_accuracy || 0);
    if (avg > 85) return "expert";
    if (avg > 65) return "advanced";
    if (avg > 45) return "intermediate";
    return "beginner";
  }

  async _getUserMetrics(userId) {
    const [perfRes, taskRes] = await Promise.all([
      db.query(
        `SELECT
           AVG(accuracy) AS average_accuracy,
           AVG(EXTRACT(EPOCH FROM avg_response_time)) AS average_response_time
         FROM performance_metrics
         WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*) AS completed_tasks
         FROM task_progress
         WHERE user_id = $1 AND status = 'completed'`,
        [userId]
      ),
    ]);

    return {
      average_accuracy: Number(perfRes.rows[0]?.average_accuracy || 0),
      average_response_time: Number(perfRes.rows[0]?.average_response_time || 0),
      completed_tasks: Number(taskRes.rows[0]?.completed_tasks || 0),
    };
  }

  async _saveGeneratedScenario(userId, scenarioPayload) {
    try {
      const { rows } = await db.query(
        `INSERT INTO scenarios (name, description, ai_prompt, category, difficulty_level, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          scenarioPayload.title || "AI Dynamic Scenario",
          scenarioPayload.description || "",
          JSON.stringify(scenarioPayload),
          "ai-dynamic",
          5,
          userId,
        ]
      );

      return rows[0] || null;
    } catch (error) {
      console.error("AICoreService._saveGeneratedScenario error:", error);
      return null;
    }
  }

  _safeParseJson(text) {
    if (!text || typeof text !== "string") return null;

    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1 && end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1));
        } catch {
          return null;
        }
      }

      return null;
    }
  }
}

module.exports = new AICoreService();