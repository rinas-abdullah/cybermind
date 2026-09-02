# ⚙️ DATABASE SETUP GUIDE - CyberMind

## 📋 نظرة عامة

تدعم CyberMind عدة خيارات لقاعدة البيانات:

1. **In-Memory** (الافتراضي للتطوير)
2. **PostgreSQL** (الموصى به للإنتاج)
3. **MongoDB** (اختياري)
4. **MySQL** (اختياري)

---

## 🚀 البدء السريع

### 1️⃣ In-Memory (للتطوير المحلي - افتراضي)

```bash
# لا تحتاج إلى أي إعدادات، فقط استفده المتغيرات الافتراضية
PORT=3001
NODE_ENV=development
DB_TYPE=in-memory
```

**المميزات:**
- ✅ لا تحتاج تثبيت قاعدة بيانات
- ✅ سريعة للاختبار والتطوير
- ⚠️ البيانات تُفقد عند إغلاق الخادم

---

### 2️⃣ PostgreSQL (الموصى به)

#### ✅ التثبيت

**Windows:**
```bash
# تحميل PostgreSQL من:
# https://www.postgresql.org/download/windows/

# أو استخدام Chocolatey
choco install postgresql14
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### ⚙️ الإعدادات

**1. إنشاء قاعدة البيانات:**

```bash
# اتصل بـ PostgreSQL
psql -U postgres

# أنشئ قاعدة البيانات
CREATE DATABASE cybermind;

# تحقق من الإنشاء
\l
\q
```

**2. إعدادات البيئة (.env):**

```env
NODE_ENV=development
PORT=3001
DB_TYPE=postgresql
DATABASE_URL=postgresql://postgres:password@localhost:5432/cybermind
```

**3. اختبار الاتصال:**

```bash
psql -U postgres -d cybermind -c "SELECT 1;"
```

#### 📊 إنشاء الجداول (اختياري)

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress table
CREATE TABLE progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  scenario_id VARCHAR(100),
  score INTEGER,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Logs table
CREATE TABLE ai_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  question TEXT,
  response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_ai_logs_user_id ON ai_logs(user_id);
```

---

### 3️⃣ MongoDB

#### ✅ التثبيت

**استخدام MongoDB Atlas (السحابة - موصى به):**

```
1. اذهب إلى: https://www.mongodb.com/cloud/atlas
2. أنشئ حساب مجاني
3. أنشئ cluster
4. احصل على Connection String
```

**أو تثبيت محلي:**

```bash
# Windows - استخدم MongoDB Community Edition
# https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/

# macOS
brew tap mongodb/brew
brew install mongodb-community

# Linux
sudo apt-get install -y mongodb
```

#### ⚙️ الإعدادات

```env
NODE_ENV=development
PORT=3001
DB_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/cybermind
```

---

### 4️⃣ MySQL

#### ✅ التثبيت

**Windows:**
```bash
# تحميل MySQL Community Server
# https://dev.mysql.com/downloads/mysql/

# أو Chocolatey
choco install mysql
```

#### ⚙️ الإعدادات

```bash
# تسجيل الدخول
mysql -u root -p

# إنشاء قاعدة البيانات
CREATE DATABASE cybermind;
USE cybermind;
```

```env
NODE_ENV=development
PORT=3001
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cybermind
```

---

## ⚡ أوامر مفيدة

### PostgreSQL

```bash
# اتصال سريع
psql -U postgres -d cybermind

# نسخ احتياطي
pg_dump -U postgres -d cybermind > backup.sql

# استرجاع من النسخة
psql -U postgres -d cybermind < backup.sql

# حذف قاعدة البيانات
DROP DATABASE cybermind;
```

### MongoDB

```bash
# اتصال سريع
mongosh mongodb://localhost:27017/cybermind

# نسخ احتياطي
mongodump --db cybermind --out ./backup

# استرجاع من النسخة
mongorestore ./backup
```

### MySQL

```bash
# اتصال سريع
mysql -u root -p cybermind

# نسخ احتياطي
mysqldump -u root -p cybermind > backup.sql

# استرجاع من النسخة
mysql -u root -p cybermind < backup.sql
```

---

## 🔐 إعدادات الأمان

### ✅ للإنتاج (Production)

```env
# 1. استبدل قيم افتراضية
JWT_SECRET=your-super-secret-256-bit-key-here-at-least-32-chars
DATABASE_URL=postgresql://user:secure_pass@production-host:5432/cybermind

# 2. تفعيل SSL
DATABASE_URL=postgresql://user:pass@host:5432/cybermind?sslmode=require

# 3. CORS محدود
CORS_ORIGIN=https://yourdomain.com

# 4. تعطيل Debug Mode
LOG_LEVEL=info
NODE_ENV=production
```

### ⚠️ تجنب هذه الأخطاء

```bash
# ❌ لا تضع كلمات المرور في Git
DB_PASSWORD=actual_password  # خطير!

# ❌ لا تستخدم كلمات مرور افتراضية
DB_PASSWORD=password  # خطير!

# ✅ استخدم متغيرات البيئة
# ✅ استخدم .gitignore للـ .env
# ✅ استخدم كلمات مرور قوية في الإنتاج
```

---

## 🧪 اختبار قاعدة البيانات

```bash
# بدء الخادم
npm start

# اختبر الاتصال
curl http://localhost:3001/api/health

# يجب أن تحصل على:
# { "success": true, "message": "Database connection verified" }
```

---

## 📈 ترقية من In-Memory إلى PostgreSQL

```javascript
// في server.js
const { testConnection } = require('./db');

// بدء الخادم بعد اختبار الاتصال
const server = app.listen(PORT, async () => {
  const dbTest = await testConnection();
  if (dbTest.success) {
    console.log("✅ Database ready");
  } else {
    console.error("❌ Database connection failed:", dbTest.message);
    process.exit(1);
  }
});
```

---

## 🆘 حل المشاكل الشائعة

### خطأ: "ECONNREFUSED"
```
المشكلة: قاعدة البيانات غير مشغلة
الحل:
  PostgreSQL: pg_ctl -D /path/to/data start
  MongoDB: mongod
  MySQL: mysql.server start
```

### خطأ: "Authentication failed"
```
المشكلة: كلمة المرور خاطئة
الحل:
  تحقق من DATABASE_URL
  تحقق من DB_HOST, DB_USER, DB_PASSWORD
```

### خطأ: "Database does not exist"
```
المشكلة: قاعدة البيانات غير موجودة
الحل:
  PostgreSQL: CREATE DATABASE cybermind;
  MongoDB: سيتم الإنشاء تلقائياً
```

---

## 📞 المرجع السريع

| المتغير | المتطلب | مثال |
|--------|--------|------|
| `DB_TYPE` |✅ | `postgresql` |
| `DATABASE_URL` | ✅ (PostgreSQL) | `postgresql://user:pass@localhost:5432/cybermind` |
| `DB_HOST` | ✅ (MySQL) | `localhost` |
| `DB_PORT` | ✅ (MySQL) | `3306` |
| `DB_USER` | ✅ (MySQL) | `root` |
| `DB_PASSWORD` | ✅ (MySQL) | `password123` |
| `DB_NAME` | ✅ (MySQL) | `cybermind` |
| `MONGODB_URI` | ✅ (MongoDB) | `mongodb://localhost:27017/cybermind` |

---

## ✅ الخطوات إلى الإنتاج

1. ✅ اختبر مع In-Memory أولاً
2. ✅ انقل إلى PostgreSQL محلي
3. ✅ قم بإعداد نسخة احتياطية يومية
4. ✅ راقب الأداء والاتصالات
5. ✅ استخدم connection pooling
6. ✅ فعّل SSL للإتصالات البعيدة
