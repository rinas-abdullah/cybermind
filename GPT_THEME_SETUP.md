# 🤖 دليل ربط OpenAI API وضبط الموضوع

## 1️⃣ ربط OpenAI API (GPT)

### الخطوة 1: الحصول على API Key

```
1. اذهب إلى: https://platform.openai.com/account/api-keys
2. سجّل دخول أو أنشئ حساب OpenAI
3. انقر "Create new secret key"
4. انسخ المفتاح (سيبدأ بـ sk-)
```

### الخطوة 2: تحديث متغير البيئة

في ملف `.env`:

```env
# قم بتغيير هذا:
OPENAI_API_KEY=sk-your-openai-api-key-here

# إلى:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### الخطوة 3: فحص الاتصال

```bash
# اختبر الاتصال
npm run test-db

# أو ابدأ الخادم
npm start
```

---

## 2️⃣ المكونات المتصلة بـ OpenAI

### ✅ من يستخدم OpenAI:

1. **AI Mentor Engine** (`backend/services/aiMentorEngine.js`)
   - الإجابة على أسئلة المستخدمين
   - تقديم شرح للمفاهيم

2. **Adaptive Engine** (`backend/services/adaptiveEngine.js`)
   - تقييم مستوى المستخدم
   - تخصيص المحتوى

3. **API Routes** (`backend/routes/api.js`)
   - `/api/ai/mentor` - الأسئلة والأجوبة
   - `/api/ai/dashboard` - البيانات الذكية

---

## 3️⃣ اختبار ربط OpenAI

### اختبار سريع:

```bash
# في terminal، انقل إلى المجلد الرئيسي
cd cybermind

# ابدأ الخادم
npm start

# في terminal آخر، اختبر API
curl -X POST http://localhost:3001/api/ai/mentor \
  -H "Content-Type: application/json" \
  -d '{"question":"What is phishing?","context":"training"}'
```

### النتيجة المتوقعة:
```json
{
  "success": true,
  "data": {
    "explanation": "...",
    "hint": "...",
    "examples": [...]
  }
}
```

---

## 4️⃣ ضبط الموضوع (Theme)

### الموضوع الحالي: Dark Theme

**الألوان الأساسية:**
```css
/* Background */
--bg-primary: #030810
--bg-secondary: #0a1420

/* Text */
--text-primary: #e5e7eb
--text-light: #9ca3af
--text-muted: #6b7280

/* Accent */
--accent-primary: #00e5b0 (Neon Teal)
--accent-secondary: #3b82f6 (Blue)
--accent-danger: #ef4444 (Red)

/* Borders */
--border-color: #1f2937
--border-light: #374151
```

### تعديل الموضوع:

**في CSS** (`css/style.css`):

```css
:root {
  /* تغيير الألوان هنا */
  --bg-primary: #030810;
  --accent-primary: #00e5b0;
  
  /* أو للموضوع الفاتح: */
  --bg-primary: #ffffff;
  --accent-primary: #2563eb;
}
```

### تبديل الموضوع ديناميكياً:

```javascript
// في JavaScript، يمكنك تبديل الموضوع:
function toggleTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'light') {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--text-primary', '#000000');
    localStorage.setItem('theme', 'light');
  } else {
    root.style.setProperty('--bg-primary', '#030810');
    root.style.setProperty('--text-primary', '#e5e7eb');
    localStorage.setItem('theme', 'dark');
  }
}

// تطبيق الموضوع المحفوظ
const savedTheme = localStorage.getItem('theme') || 'dark';
toggleTheme(savedTheme);
```

---

## 5️⃣ إعدادات OpenAI المتقدمة

### تخصيص نموذج GPT:

في `backend/services/aiMentorEngine.js`:

```javascript
const response = await this.openai.chat.completions.create({
  model: "gpt-4-turbo", // أو gpt-3.5-turbo (أسرع وأرخص)
  messages: [...],
  temperature: 0.7,      // 0 = دقيق، 1 = إبداعي
  max_tokens: 2000,      // طول الإجابة
  top_p: 0.9,           // التنوع
});
```

### الخيارات:
- `gpt-4-turbo` - الأفضل والأقوى (أغلى)
- `gpt-3.5-turbo` - سريع وجيد (أرخص)

---

## 6️⃣ معالجة الأخطاء

### إذا كانت OpenAI غير متاحة:

```javascript
// سيعود النظام إلى المعرفة المحلية تلقائياً
if (!this.openai) {
  console.log("⚠️ OpenAI not configured, using offline knowledge base");
  // استخدم this.knowledgeBase
}
```

---

## 7️⃣ أفضل الممارسات

### ✅ افعل:
```env
# استخدم متغيرات البيئة
OPENAI_API_KEY=sk-...

# استخدم نماذج مناسبة
model=gpt-3.5-turbo  # للتطوير
model=gpt-4-turbo    # للإنتاج
```

### ❌ لا تفعل:
```javascript
// لا تحرق المفتاح في الكود
const apiKey = "sk-..."; // ❌ خطير!

// لا تطلب مرات كثيرة بدون داعي
for (let i = 0; i < 100; i++) {
  await openai.chat.completions.create(...);
}
```

---

## 8️⃣ مراقبة الاستخدام

### فحص رصيد OpenAI:

```bash
# عن طريق لوحة التحكم:
# https://platform.openai.com/account/billing/overview
```

### تقليل التكاليف:

```javascript
// استخدم caching للأسئلة المتكررة
const cache = new Map();

async function getAnswer(question) {
  if (cache.has(question)) {
    return cache.get(question);
  }
  
  const answer = await openai.chat.completions.create(...);
  cache.set(question, answer);
  return answer;
}
```

---

## 9️⃣ الوضع بدون OpenAI

إذا لم تكن لديك API key، سيعمل النظام بـ Knowledge Base المحلية:

```javascript
// في aiMentorEngine.js
this.openai = null; // لا توجد API key

// سيستخدم تلقائياً:
this.knowledgeBase = {
  phishing: { ... },
  "sql injection": { ... },
  // ... المزيد
}
```

---

## 🔟 الملخص السريع

| الخطوة | الأمر |
|-------|------|
| 1. احصل على API Key | https://platform.openai.com |
| 2. حدّث .env | `OPENAI_API_KEY=sk-...` |
| 3. ابدأ الخادم | `npm start` |
| 4. اختبر | `curl http://localhost:3001/api/ai/mentor` |
| 5. غيّر الموضوع | عدّل `css/style.css` |

---

## 📞 الدعم

إذا حدثت مشكلة:

1. تحقق من API key صحيح
2. تحقق من رصيد حسابك
3. تحقق من اتصال الإنترنت
4. راجع logs في terminal

```bash
# عرض التفاصيل
npm start 2>&1 | tee server.log
```
