# دليل أخطاء GitHub وحلولها

دليل شامل لجميع الأخطاء المتعلقة بـ GitHub والـ Workers والـ API وحلولها.

---

## جدول المحتويات

1. [أخطاء إعداد Worker](#أخطاء-إعداد-worker)
2. [أخطاء مزامنة GitHub](#أخطاء-مزامنة-github)
3. [أخطاء النسخ الاحتياطي](#أخطاء-النسخ-الاحتياطي)
4. [أخطاء API](#أخطاء-api)
5. [أخطاء وضع API المباشر](#أخطاء-وضع-api-المباشر)
6. [إعداد Worker Proxy](#إعداد-worker-proxy)
7. [خطوات استكشاف الأخطاء وإصلاحها](#خطوات-استكشاف-الأخطاء-وإصلاحها)

---

## أخطاء إعداد Worker

### 1. Worker URL غير مُعد

**الرسالة:**
```
Worker URL not configured. Please set the Worker URL in Settings.
```

**السبب:**
لم يتم إدخال رابط الـ Worker في إعدادات التطبيق.

**الحل:**
1. افتح `Settings` → `Worker Configuration`
2. أدخل رابط Worker الصحيح (مثال: `https://my-worker.username.workers.dev`)
3. احفظ الإعدادات

---

### 2. Worker URL غير صالح

**الرسالة:**
```
Invalid Worker URL format. Expected: https://*.workers.dev
```

**السبب:**
الرابط المُدخل لا يتوافق مع الصيغة المطلوبة.

**الحل:**
- تأكد من أن الرابط يبدأ بـ `https://`
- تأكد من أن الرابط يحتوي على `.workers.dev`
- مثال صحيح: `https://my-worker.username.workers.dev`
- مثال خاطئ: `http://my-worker.workers.dev` (بدون s)

---

### 3. Worker غير مُنشر

**الرسالة:**
```
Worker not found. The Worker may not be deployed yet.
```

**السبب:**
الـ Worker غير مُنشر على Cloudflare أو تم حذفه.

**الحل:**
1. تحقق من نشر الـ Worker:
   ```bash
   cd worker && npx wrangler deploy
   ```
2. تحقق من حالة النشر:
   ```bash
   npx wrangler tail
   ```
3. راجع [قسم إعداد Worker Proxy](#إعداد-worker-proxy) للتفاصيل

---

### 4. فشل المصادقة

**الرسالة:**
```
Authentication failed. Invalid or missing auth token.
```

**السبب:**
ـ Auth Token غير مُتطابق أو غير موجود.

**الحل:**
1. تأكد من تطابق `AUTH_TOKEN` في الـ Worker مع التطبيق
2. أعد توليد التوكن:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. حدّث المتغير في `wrangler.toml`:
   ```toml
   AUTH_TOKEN = "التوكن-الجديد"
   ```

---

## أخطاء مزامنة GitHub

### 1. انتهاء صلاحية التوكن

**الرسالة:**
```
401 Unauthorized: Bad credentials
```

**السبب:**
توكن GitHub انتهت صلاحيته أو تم إلغاؤه.

**الحل:**
1. اذهب إلى `github.com → Settings → Developer settings → Tokens`
2. أنشئ توكن جديد بصلاحيات `repo` + `workflow`
3. حدّث التوكن في التطبيق

---

### 2. توكن غير صالح

**الرسالة:**
```
401 Unauthorized: Must include at least one email or organization
```

**السبب:**
التوكن المُدخل غير صالح أو بهرو.

**الحل:**
- تأكد من نسخ التوكن بالكامل
- تأكد من استخدام **توكن كلاسيك** (وليس Fine-grained)
- لا تضع مسافات أو أسطر جديدة في التوكن

---

### 3. المستودع غير موجود

**الرسالة:**
```
404 Not Found: Not Found
```

**السبب:**
اسم المستودع أو المالك غير صحيح.

**الحل:**
- تأكد من أن `owner` هو **اسم المستخدم** على GitHub (وليس الاسم الكامل)
- تأكد من أن اسم المستودع صحيح ولا يحتوي على مسافات
- مثال: `project-owner/cyber-guardians-mobile`

---

### 4. تجاوز حد الطلبات

**الرسالة:**
```
403 Rate limit exceeded for user with ID: 12345678
```

**السبب:**
تجاوزت الحد المسموح به من طلبات GitHub API (5000 طلب/ساعة).

**الحل:**
1. انتظر حتى يتجدد العدد (كل ساعة)
2. استخدم Worker proxy لتقليل الطلبات المباشرة
3. تحقق من العدد المتبقي:
   ```bash
   curl -I https://api.github.com/rate_limit -H "Authorization: token YOUR_TOKEN"
   ```

---

### 5. ملف كبير جداً

**الرسالة:**
```
413 Payload Too Large: Must push a file under 100 MB
```

**السبب:**
حجم الملف يتجاوز 100 ميجا.

**الحل:**
- استخدم Git بدلاً من Contents API للملفات الكبيرة
- قسّم الملفات الكبيرة إلى أجزاء أصغر
- استخدم `.gitignore` لاستبعاد الملفات الكبيرة غير الضرورية

---

## أخطاء النسخ الاحتياطي

### 1. عدم تطابق Checksum (ملف تالف)

**الرسالة:**
```
Checksum mismatch: backup file may be corrupted. Expected: abc123, Got: def456
```

**السبب:**
الملف تالف أثناء النقل أو الحفظ.

**الحل:**
1. أعد تصدير النسخة الاحتياطية
2. تأكد من اكتمال التنزيل (لا يُقطع الاتصال أثناء التنزيل)
3. جرّب متصفح آخر

---

### 2. صيغة JSON غير صالحة

**الرسالة:**
```
Invalid JSON format: unexpected token at position 1234
```

**السبب:**
الملف تالف أو غير متوافق مع الصيغة المطلوبة.

**الحل:**
- تأكد من أن الملف من تصدير التطبيق
- لا تعدّل يدوياً في الملف
- جرّب تصدير نسخة جديدة

---

### 3. تجاوز حجم التخزين

**الرسالة:**
```
Storage quota exceeded. Maximum backup size: 50 MB
```

**السبب:**
حجم النسخة الاحتياطية يتجاوز الحد المسموح.

**الحل:**
1. حذف نسخ احتياطية قديمة
2. تصدير فقط البيانات الأساسية (وليس الوسائط)
3. استخدام Google Drive للمساحة الإضافية

---

### 4. فشل الاستيراد

**الرسالة:**
```
Import failed: Invalid backup version. Expected v2+, Got v1
```

**السبب:**
نسخة احتياطية من إصدار قديم لا تتوافق.

**الحل:**
- تأكد من استخدام أحدث إصدار من التطبيق
- أعد التصدير من التطبيق القديم قبل التحديث

---

## أخطاء API

### 1. 429 Too Many Requests (حد الطلبات)

**الرسالة:**
```
429: Rate limit exceeded. Please wait before making another request.
```

**السبب:**
تجاوزت الحد المسموح به من الطلبات.

**الحل:**
1. انتظر 30-60 ثانية ثم أعد المحاولة
2. استخدم Worker proxy لتوزيع الطلبات
3. للـ OpenRouter المجاني: 50 طلب/يوم فقط — انتظر التجديد أو اشحن الحساب

---

### 2. 401 Unauthorized (غير مصرح)

**الرسالة:**
```
401 Unauthorized: Invalid authentication credentials
```

**السبب:**
المصادقة فشلت.

**الحل:**
- تحقق من صحة التوكن أو مفتاح API
- تأكد من إرسال الـ Header بشكل صحيح:
  ```
  Authorization: Bearer YOUR_TOKEN
  ```

---

### 3. 403 Forbidden (ممنوع)

**الرسالة:**
```
403 Forbidden: Resource not accessible by integration
```

**السبب:**
التوكن لا يملك صلاحيات كافية.

**الحل:**
- استخدم توكن **كلاسيك** (وليس Fine-grained)
- فعّل صلاحيات:
  - ☑️ `repo` — تحكم كامل بالمستودعات الخاصة
  - ☑️ `workflow` — تحديث GitHub Actions

---

### 4. 404 Not Found (غير موجود)

**الرسالة:**
```
404 Not Found: The requested resource does not exist
```

**السبب:**
المورد المطلوب غير موجود.

**الحل:**
- تحقق من صحة الرابط
- تأكد من أن المستودع/الملف موجود فعلاً
- تحقق من صلاحيات الوصول

---

### 5. 500 Server Error (خطأ في الخادم)

**الرسالة:**
```
500 Internal Server Error: An unexpected error occurred
```

**السبب:**
خطأ من جهه الخادم (GitHub أو Worker).

**الحل:**
1. أعد المحاولة بعد بضع ثوانٍ
2. تحقق من حالة GitHub: https://www.githubstatus.com
3. تحقق من حالة Cloudflare Worker: `npx wrangler tail`

---

## أخطاء وضع API المباشر

### 1. أخطاء CORS

**الرسالة:**
```
Access to fetch at 'https://api.github.com/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**السبب:**
المتصفح يحجب طلبات cross-origin مباشرة من localhost.

**الحل:**
- استخدم Worker proxy بدلاً من الاتصال المباشر
- أو استخدم Vite proxy في وضع التطوير:
  ```typescript
  // vite.config.ts
  proxy: {
    '/github-api': {
      target: 'https://api.github.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/github-api/, '')
    }
  }
  ```

---

### 2. أخطاء الشبكة

**الرسالة:**
```
Network Error: Failed to fetch
```

**السبب:**
انقطاع الاتصال أو الـ Worker غير متاح.

**الحل:**
1. تحقق من اتصال الإنترنت
2. تحقق من حالة Worker:
   ```bash
   curl https://my-worker.username.workers.dev/health
   ```
3. تحقق من إعدادات الـ Proxy

---

### 3. مفتاح API غير صالح

**الرسالة:**
```
Invalid API key: Please check your API key configuration
```

**السبب:**
مفتاح API غير صحيح أو منتهي الصلاحية.

**الحل:**
1. تحقق من صحة المفتاح في صفحة المزود
2. تأكد من عدم وجود مسافات أو أحرف إضافية
3. أعد توليد المفتاح إذا لزم الأمر

---

## إعداد Worker Proxy

### إنشاء Cloudflare Worker

#### الخطوة 1: إنشاء حساب Cloudflare

1. اذهب إلى https://dash.cloudflare.com
2. أنشئ حساب مجاني

#### الخطوة 2: تثبيت Wrangler

```bash
npm install -g wrangler
```

#### الخطوة 3: تسجيل الدخول

```bash
npx wrangler login
```

#### الخطوة 4: إنشاء Worker جديد

```bash
# Worker للـ AI
mkdir worker && cd worker
npx wrangler init

# Worker لـ GitHub
mkdir worker-github && cd worker-github
npx wrangler init
```

---

### المتغيرات البيئية

#### Worker (AI):

```toml
# worker/wrangler.toml
name = "ai-proxy"
main = "index.js"
compatibility_date = "2024-01-01"

[vars]
ALLOWED_ORIGINS = "http://localhost:5173,https://project-owner.github.io"
```

```bash
# متغيرات سرية (أضفها عبر Wrangler)
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put AUTH_TOKEN
```

#### Worker (GitHub):

```toml
# worker-github/wrangler.toml
name = "github-proxy"
main = "index.js"
compatibility_date = "2024-01-01"

[vars]
ALLOWED_ORIGINS = "http://localhost:5173,https://project-owner.github.io"
```

```bash
# متغيرات سرية
npx wrangler secret put AUTH_TOKEN
```

---

### خطوات النشر

#### نشر Worker واحد:

```bash
cd worker
npx wrangler deploy
```

#### نشر كلا الـ Workers:

```bash
cd worker && npx wrangler deploy
cd ../worker-github && npx wrangler deploy
```

#### نشر عبر GitHub Actions:

يتم تلقائياً عند الدفع إلى `main`:
- `.github/workflows/deploy-worker.yml` — نشر AI Worker
- `.github/workflows/deploy-worker-github.yml` — نشر GitHub Worker

---

### اختبار Worker

```bash
# اختبار الاتصال
curl https://my-worker.username.workers.dev/health

# اختبار مع Auth Token
curl -H "X-Auth-Token: YOUR_TOKEN" https://my-worker.username.workers.dev/health
```

---

## خطوات استكشاف الأخطاء وإصلاحها

### 1. التحقق من حالة Worker

```bash
# عرض السجلات المباشرة
npx wrangler tail

# عرض الـ Workers المُنشرة
npx wrangler list
```

### 2. التحقق من صحة مفتاح API

```bash
# اختبار GitHub token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# اختبار OpenRouter
curl -H "Authorization: Bearer YOUR_KEY" https://openrouter.ai/api/v1/models
```

### 3. اختبار الاتصال

```bash
# اختبار Worker
curl -I https://my-worker.username.workers.dev

# اختبار GitHub API مباشرة
curl -I https://api.github.com
```

### 4. التحقق من وحدة تحكم المتصفح

1. افتح المتصفح → `F12` → `Console`
2. ابحث عن أخطاء حمراء
3. راجع تبويب `Network` ل查看详情 الطلبات
4. تحقق من:
   - هل الطلب يذهب للـ Worker أم مباشرة لـ GitHub؟
   - ما هو كود الحالة (200, 401, 403, 404, 500)؟
   - هل يوجد خطأ CORS؟

### 5. فحص إعدادات التطبيق

1. افتح `Settings` → `Worker Configuration`
2. تأكد من صحة:
   - Worker URL
   - Auth Token
   - GitHub Token
3. احفظ وأعد تحميل الصفحة

### 6. إعادة تعيين الإعدادات

إذا استمرت المشكلة:
1. امسح بيانات التخزين المحلي:
   - افتح `F12` → `Application` → `Local Storage`
   - احذف المفاتيح المتعلقة بالـ Workers
2. أعد إدخال الإعدادات يدوياً
3. أعد تحميل الصفحة

---

## ملاحظات مهمة

1. **التوكن:** استخدم توكن **كلاسيك** (وليس Fine-grained) بصلاحيات `repo` + `workflow`
2. **المالك:** هو **اسم المستخدم** على GitHub (وليس الاسم الكامل أو الإيميل)
3. **حد الحجم:** الملفات فوق 100MB قد تفشل عبر Contents API
4. **CORS:** لا تعمل الطلبات المباشرة من localhost — استخدم Worker proxy
5. **التوقيع:** انتظر 30-60 ثانية قبل إعادة المحاولة عند أخطاء 429
6. **التخزين:** المفاتيح السرية مخزنة في Worker (وليس في المتصفح) — آمنة من XSS

---

## الملفات الرئيسية

| الملف | الوظيفة |
|-------|---------|
| `worker/index.js` | AI Worker proxy — يُمرّر طلبات AI عبر الخادم |
| `worker/wrangler.toml` | إعدادات AI Worker |
| `worker-github/index.js` | GitHub Worker proxy — يُخفي GitHub token |
| `worker-github/wrangler.toml` | إعدادات GitHub Worker |
| `.github/workflows/deploy-worker.yml` | نشر AI Worker تلقائياً |
| `.github/workflows/deploy-worker-github.yml` | نشر GitHub Worker تلقائياً |
| `src/ai/api.ts` | دعم AI Worker proxy |
| `src/ai/github.ts` | دعم GitHub Worker proxy + تشفير |
| `src/ai/AIPanel.tsx` | إعدادات Workers + دليل الاستخدام |

---

> آخر تحديث: يونيو 2026
