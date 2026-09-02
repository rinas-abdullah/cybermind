# المرحلة 2 — البيئات والأسرار وCI

> مكمّل لـ [01-product-and-boundaries.md](./01-product-and-boundaries.md)

---

## 1. البيئات الموصى بها

| البيئة | الغرض | `NODE_ENV` نموذجي |
|--------|--------|-------------------|
| **development** | تطوير محلي | `development` |
| **staging** | اختبار قبل الإنتاج، يشبه الإنتاج | `production` أو `staging` حسب دعم التطبيق |
| **production** | المستخدمون الحقيقيون | `production` |

**قاعدة:** لا تستخدم نفس `JWT_SECRET` أو `DATABASE_URL` بين staging و production.

---

## 2. الملفات والأسرار

| الملف | في Git؟ | ملاحظة |
|--------|---------|--------|
| `.env` | **لا** | نسخة محلية/سيرفر فقط |
| `.env.example` | **نعم** | قالب بدون أسرار حقيقية |
| `.env.staging` / `.env.production` | حسب السياسة | غالباً **لا** في Git؛ تُرفع عبر منصة النشر |

**JWT في الإنتاج:** يجب أن يكون عشوائياً طويلاً (≥ 32 حرفاً) — يفرضه `environment.js` عند `NODE_ENV=production`.

**OpenAI وغيره:** مفاتيح API فقط في متغيرات البيئة أو مدير أسرار (Vault، AWS Secrets Manager، إلخ).

---

## 3. CI (GitHub Actions)

الملف: `.github/workflows/ci.yml`

**ما يفعله حالياً:**

- `npm ci`
- فحص صياغة Node لملفات رئيسية (`backend/server.js`, `environment.js`, `db.js`, `build.js`)
- تشغيل `node build.js` مع `NODE_ENV=production`
- `npm audit` على مستوى high (لا يفشل الـ job إن فشل — معلوماتي فقط)

**لاحقاً:** أضف `npm test` عندما تُعرّف اختبارات في `package.json`.

---

## 4. تشغيل نفس التحقق محلياً

```bash
npm ci
node --check backend/server.js
node --check backend/config/environment.js
node --check backend/db.js
node --check build.js
NODE_ENV=production node build.js
```

على Windows (PowerShell):

```powershell
$env:NODE_ENV="production"; node build.js
```

أو استخدم:

```bash
npm run ci:verify
```

(يُعرّف في `package.json`.)

---

## 5. CORS وعناوين الموقع

- في **الإنتاج** يجب ضبط `CORS_ORIGIN` (أو `SITE_URL`) لعناوين الواجهة الفعلية فقط.
- راجع `backend/config/environment.js` لدمج `SITE_URL` و `LOCAL_DOMAIN`.

---

## 6. قاعدة البيانات

- **in-memory:** مناسب للتطوير السريع فقط؛ البيانات تُفقد عند إعادة التشغيل.
- **postgresql:** للتشغيل الجاد؛ خطط لنسخ احتياطي واسترجاع (خارج نطاق هذا الملف — سياسة تشغيل).

---

## معايير إغلاق جزء «المرحلة 2 — الأساس»

- [ ] workflow يمرّ على الفرع الرئيسي  
- [ ] الفريق يملك `.env` محلياً من `.env.example`  
- [ ] أسرار الإنتاج غير موجودة في المستودع  

*آخر تحديث: 2026-04-06*
