# نشر رصد سايبر (Deploying Rasd Cyber)

رصد سايبر تطبيق Node/Express يخدم الواجهة من نفس الخادم، ويعمل افتراضيًا في وضع
الذاكرة (in-memory) بلا قاعدة بيانات خارجية. لذلك يكفي خدمة ويب واحدة.

في وضع الإنتاج يربط الخادم نفسه تلقائيًا على `0.0.0.0` ويقرأ `PORT` من المنصة،
والسرّ الوحيد المطلوب هو `JWT_SECRET` (٣٢ حرفًا فأكثر).

> ملاحظة: العمل الأحدث على فرع `rename-to-rasd`. اختر هذا الفرع عند النشر (أو
> ادمجه في الفرع الافتراضي أولًا).

---

## الخيار الأول: Render (الأسهل، مجاني)

ملف `render.yaml` في جذر المستودع يعرّف الخدمة بالكامل.

1. أنشئ حسابًا على https://render.com (مجاني) واربط GitHub.
2. من اللوحة: **New → Blueprint**.
3. اختر مستودع `rinas-abdullah/cybermind` والفرع `rename-to-rasd`.
4. سيقرأ Render ملف `render.yaml`، ويولّد `JWT_SECRET` تلقائيًا. اضغط **Apply**.
5. بعد دقيقتين تقريبًا يعطيك رابطًا عامًا مثل `https://rasd-cyber.onrender.com`.

الفحص الصحي على `/health`. للدخول السريع: `demo@risaq.local / Risaq@Demo123!`
أو المشرف `admin@risaq.local / Risaq@Demo123!`.

## الخيار الثاني: Railway

1. https://railway.app → **New Project → Deploy from GitHub repo**.
2. اختر المستودع والفرع `rename-to-rasd`. يكتشف Railway إطار Node تلقائيًا
   (أو يستخدم `Dockerfile`).
3. في **Variables** أضف:
   - `NODE_ENV=production`
   - `JWT_SECRET=` سرّ عشوائي ٣٢ حرفًا فأكثر
   - `SITE_URL=` رابطك العام على Railway (مثل `https://xxxx.up.railway.app`)
   - (اختياري) `TRUST_PROXY=true`
4. Railway يوفّر `PORT` تلقائيًا، ويعطيك رابطًا عامًا بعد النشر.

## الخيار الثالث: أي مستضيف حاويات (Docker)

```bash
docker build -t rasd-cyber .
docker run -p 3001:3001 \
  -e JWT_SECRET="$(openssl rand -hex 24)" \
  -e SITE_URL="http://localhost:3001" \
  rasd-cyber
# ثم افتح http://localhost:3001
```
الصورة نفسها تعمل على Fly.io و Google Cloud Run وأي VPS (اضبط `SITE_URL`
على رابطك العام هناك).

---

## متغيرات البيئة

| المتغير | مطلوب؟ | القيمة |
|---|---|---|
| `JWT_SECRET` | نعم (إنتاج) | ٣٢ حرفًا فأكثر |
| `SITE_URL` | نعم (إنتاج) | رابطك العام، مثل `https://rasd-cyber.onrender.com` (على Render يُشتق تلقائيًا من `RENDER_EXTERNAL_URL`) |
| `NODE_ENV` | موصى به | `production` |
| `PORT` | تضبطه المنصة | يقرؤه الخادم تلقائيًا |
| `HOST` | لا | يصبح `0.0.0.0` تلقائيًا في الإنتاج |
| `DB_TYPE` | لا | `in-memory` (الافتراضي) أو `postgresql` |
| `TRUST_PROXY` | خلف بروكسي | `true` |

> للتشغيل مع PostgreSQL بدل الذاكرة: اضبط `DB_TYPE=postgresql` و`DATABASE_URL`،
> وسيُنشئ الخادم الجداول تلقائيًا عند الإقلاع.
