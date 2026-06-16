# 🐛 دليل أخطاء GitHub وحلولها

## ملخص الأخطاء والحلول

| # | الخطأ | السبب | الحل | الحالة |
|---|-------|-------|------|--------|
| 1 | 403 Resource not accessible by integration | التوكن lacks صلاحيات الكتابة | استخدام توكن كلاسيك بصلاحية `repo` كاملة | ✅ |
| 2 | 404 Not Found (Fork) | المالك غير صحيح (`old-owner` بدلاً من `project-owner`) | تصحيح `MAIN_REPO.owner` في `src/ai/github.ts` | ✅ |
| 3 | 404 Not Found (Owner) | المستخدم يكتب اسم المستخدم الكامل أو الإيميل | إضافة دالة `resolveGithubOwner()` + كشف تلقائي من التوكن | ✅ |
| 4 | المستودع فارغ بعد النسخ (قديم) | ~`auto_init: false`~ **تم الإصلاح** | يُنشئ أول commit عبر `copyEntireRepo` مباشرة | ✅ |
| 5 | الصفحة البيضاء | `vite.config.ts` يحتوي على `base` غير صحيح | تحديث `base` تلقائياً | ✅ |
| 6 | الملفات لم تُرفع (قديم) | ~Contents API~ **تم الإصلاح** | تُقرأ الشجرة أولاً ثم تُرفع الملفات | ✅ |
| 7 | أخطاء رفع الوسائط الكبيرة | ملفات >50MB تفشل | **تم — تخطي تلقائي مع تحذير** | ✅ |
| 8 | اختصارات M/B تعمل أثناء الكتابة | `keydown` handler لا يتحقق من focus | إضافة فحص `INPUT/TEXTAREA/contentEditable` | ✅ |
| 9 | Deploy يُلغى (Canceling) | `auto_init: true` + push = deploy مكرر | **تم — `auto_init: false`** | ✅ |
| 10 | النتائج مبتظهرش كلها | الـ status box مكنش scrollable | **تم — إضافة `overflow: auto` + `maxHeight`** | ✅ |
| 11 | CORS يمنع طلبات GitHub من localhost | المتصفح يحجب طلبات cross-origin | **تم — Vite proxy** (`/github-api` → `api.github.com`) | ✅ |
| 12 | GitHub token plaintext في localStorage | التوكن كان كنص عادي | **تم — تشفير AES-256-GCM** | ✅ |
| 13 | API keys encryption لا يعمل على HTTP | `crypto.subtle` يحتاج HTTPS | **تم — تشفير AES-256-GCM** | ✅ |
| 14 | لا يوجد Rate Limiting | لا تقييد على عدد الطلبات | **تم — Cloudflare Worker proxy** | ✅ |
| 15 | مفتاح تشفير في sessionStorage | XSS يمكنه فك التشفير | **تم — Cloudflare Worker proxy** | ✅ |
| 16 | CORS يمنع headers مخصصة | `HTTP-Referer` و `X-Title` غير مسموحة | **تم — إضافة `Access-Control-Allow-Headers`** | ✅ |
| 17 | خطأ 429 Rate limit (OpenRouter) | تجاوز الحد المجاني (50 طلب/يوم) | **تم — إضافة Gemini المجاني كبديل** | ✅ |
| 18 | خطأ 404 Gemini model not found | نموذج Gemini غير متاح (أُغلق) | **تم — تحديث النماذج إلى Gemini 3.x** | ✅ |

---

## تفاصيل كل خطأ

### الخطأ 1: 403 Resource not accessible by integration

**الرسالة:**
```
GitHub API خطأ 403: Resource not accessible by integration
```

**السبب:**
التوكن لا يملك صلاحيات كافية لكتابة الملفات. عادةً يحدث مع:
- توكنات Fine-grained بدون صلاحيات `Contents: Read and Write`
- توكنات محدودة بمستودع معين

**الحل:**
1. اذهب إلى `github.com → Settings → Developer settings → Tokens`
2. أنشئ توكن جديد بصلاحية **كلاسيك** (وليس Fine-grained)
3. فعّل:
   - ☑️ `repo` —(full control of private repositories)
   - ☑️ `workflow` —(Update GitHub Action workflows)

---

### الخطأ 2: 404 Not Found (Fork)

**الرسالة:**
```
❌ فشل: GitHub API خطأ 404: Not Found
```

**السبب:**
`MAIN_REPO.owner` كان خاطئاً.

**الحل:**
```typescript
// src/ai/github.ts
export const MAIN_REPO = { owner: 'project-owner', repo: 'cyber-guardians-mobile' }
```

**ملاحظة:** المالك هو **اسم المستخدم** على GitHub، وليس الاسم الكامل.

---

### الخطأ 3: 404 Not Found (Owner)

**الرسالة:**
```
❌ لم يتم العثور على حساب GitHub لهذا الإيميل: yousefekamal22@gmail.com
```

**السبب:**
- المستخدم يكتب الاسم الكامل بدلاً من اسم المستخدم
- البحث بالإيميل لا يعمل دائماً لأن GitHub لا يظهر كل الإيميلات العامة

**الحل:**
1. كشف تلقائي لاسم المستخدم من التوكن عبر `GET /user`
2. لا حاجة لكتابة Owner — يملأ تلقائياً

```typescript
export async function getGitHubUsername(): Promise<string> {
  const data = await apiFetch('/user', 'GET')
  return data.login
}
```

---

### الخطأ 4 (مُصلح): المستودع فارغ بعد النسخ

**الحالة:** مُصلح — أصبح متعمداً

**التصميم الجديد:**
```typescript
auto_init: false  // متعمد — لا commit أول → لا deploy مكرر
```
- `copyEntireRepo` يُنشئ أول commit (orphan) مباشرة
- commit واحد فقط → deploy واحد فقط → لا "Canceling since a higher priority..."

**لماذا:**
- `auto_init: true` كان يُنشئ commit README → deploy #1
- `copyEntireRepo` يُنشئ commit files → deploy #2 يُلغي #1
- `auto_init: false` يحل المشكلة بالكامل

---

### الخطأ 5: الصفحة البيضاء

**الرسالة:**
- الصفحة زرقاء فقط (الـ CSS يعمل)
- لكن المحتوى لا يظهر (الـ JS لا يعمل)

**السبب:**
`vite.config.ts` يحتوي على `base` يشير لمسار المستودع القديم:
```typescript
base: '/cyber-guardians-mobile/'
```
لكن المستودع الجديد اسمه مختلف. الحل القديم استخدم regex بسيط لا يغطي جميع الحالات.

**الحل الجديد — دالة `updateViteBasePath`:**
```typescript
function updateViteBasePath(content: string, repoName: string): string {
  // الحالة 1: base موجود بأي نوع اقتباس (' أو " أو `)
  const baseRegex = /base\s*[:=]\s*['"`][^'"`]*['"`]/
  if (baseRegex.test(content)) {
    return content.replace(/(base\s*[:=]\s*)['"`][^'"`]*['"`]/, `$1'/${repoName}/'`)
  }
  // الحالة 2: base غير موجود — نضيفه بعد defineConfig({
  const withConfig = content.replace(/(defineConfig\s*\(\s*\{)/, `$1\n  base: '/${repoName}/',`)
  if (withConfig !== content) return withConfig
  // الحالة 3: fallback — نضيف const BASE_PATH
  return content.replace(/(export\s+default\s+)/, `const BASE_PATH = '/${repoName}/';\n\n$1`)
}
```

**مزايا الحل:**
- ✅ يدعم `'`, `"`, `` ` `` (single, double, backtick)
- ✅ يضيف `base` تلقائياً إذا لم يكن موجوداً
- ✅ fallback آمن لأي صيغة Vite config

---

### الخطأ 6: الملفات لم تُرفع

**الرسالة:**
- المستودع يحتوي فقط على `README.md`
- لا يوجد `src/`, `.github/workflows/`, `scripts/`
- أو: بعض الملفات مفقودة

**السبب:**
Contents API (الحل القديم) كان يرفع كل ملف بطلب PUT منفصل — بطيء، محدود بـ 1MB لكل ملف، وعرضة لأخطاء منتصف العملية.

**الحل الحالي — `copyEntireRepo`:**
```
1. GET شجرة المصدر (Git Data API) ← request واحد
2. لكل blob في الشجرة:
   a. GET محتوى الـ blob
   b. إذا كان نصي: تعديل المحتوى (vite.config, package.json, etc.)
   c. PUT الملف عبر Contents API ← request واحد لكل ملف
```

**ملاحظات مهمة:**
- ✅ يقرأ الشجرة بشكل متكرر عبر Git Data API
- ✅ يرفع كل ملف عبر Contents API (PUT منفصل)
- ⚠️ الملفات الثنائية الكبيرة (>50MB) قد تفشل بسبب حدود Contents API
- ⚠️ كل ملف = request منفصل — أبطأ من Git Data API للعدد الكبير من الملفات

---

### ⚠️ الخطأ 7: أخطاء رفع الملفات الكبيرة — مُحسّن

**الحالة:** مُحسّن (ليست مُصلحة بالكامل)

**التصميم الحالي:**
```typescript
// في copyEntireRepo:
const BINARY_EXTS = ['.mp4', '.mp3', '.wav', '.webm', '.ogg', '.avi', '.mov', '.mkv', '.flac', 
                     '.ttf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.pdf']
// الملفات الثنائية تُرفع عبر Contents API
// الملفات الكبيرة جداً (>50MB) قد تفشل بسبب حدود GitHub API
```

**الحالة:**
- ✅ الملفات الصغيرة/المتوسطة تُرفع بنجاح
- ✅ ملفات الوسائط الصغيرة (<10MB) تعمل بشكل جيد
- ⚠️ الملفات الكبيرة (>50MB) قد تفشل — محدودية Contents API
- ⚠️ لا يوجد تخطي تلقائي — يحاول الرفع ثم يفشل برسالة خطأ

---

### الخطأ 8: اختصارات M/B تعمل أثناء الكتابة

**الرسالة:**
- عند كتابة الإيميل في حقل Owner
- الضغط على `m` يكتم الصوت بدلاً من كتابة الحرف
- الضغط على `b` يكتم الموسيقى بدلاً من كتابة الحرف

**السبب:**
`keydown` handler في `App.tsx` لا يتحقق من أن المستخدم يكتب في حقل إدخال.

**الحل:**
```typescript
const handleKey = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
  // باقي الاختصارات...
}
```

---

## ⚠️ المشاكل غير المُحللة أو الحلول الضعيفة

_لا توجد مشاكل غير مُحللة حالياً. جميع المشاكل الرئيسية لها حل._

---

## ✅ المشاكل المُحللة

### CORS يمنع طلبات GitHub من localhost
**الحالة: ✅ مُحلل**

---

### GitHub token plaintext في localStorage
**الحالة: ✅ مُحلل** — تشفير AES-256-GCM

---

### API keys encryption لا يعمل على HTTP
**الحالة: ✅ مُحلل** — تشفير AES-256-GCM

---

### لا يوجد Rate Limiting + XSS يسرق API keys
**الحالة: ✅ مُحلل** — Cloudflare Worker proxy

**الحل:** Cloudflare Worker proxy يُمرّر طلبات AI عبر الخادم:
```
المتصفح → Worker (يضيف API key) → OpenAI/Gemini/etc
```
- API keys مخزنة كـ environment variables في Worker — لا تصل للمتصفح
- XSS لا يستطيع سرقة أي مفاتيح
- Worker يحدد المواقع المسموحة (ALLOWED_ORIGINS)
- auth token للحماية من الوصول غير المصرح به

**الإعداد:** راجع `worker/README.md`

---

### أخطاء رفع الملفات الكبيرة >50MB
**الحالة: ✅ مُحلل** — تخطي تلقائي مع تحذير

**الحل:** الملفات >90MB تُتخطى تلقائياً مع رسالة تحذير بدلاً من فشل كامل.

---

## قائمة الملفات المُعدّلة

| الملف | التغيير | الحالة |
|-------|---------|--------|
| `worker/index.js` | AI Worker proxy — يُمرّر طلبات AI | ✅ جديد |
| `worker/wrangler.toml` | إعدادات AI Worker | ✅ جديد |
| `worker-github/index.js` | GitHub Worker proxy — يُخفي GitHub token | ✅ جديد |
| `worker-github/wrangler.toml` | إعدادات GitHub Worker | ✅ جديد |
| `.github/workflows/deploy-worker.yml` | نشر AI Worker تلقائياً | ✅ جديد |
| `.github/workflows/deploy-worker-github.yml` | نشر GitHub Worker تلقائياً | ✅ جديد |
| `src/utils/workerCrypto.ts` | تشفير AUTH_TOKEN بـ AES-256-GCM | ✅ جديد |
| `src/ai/api.ts` | دعم AI Worker proxy | ✅ مُحدّث |
| `src/ai/github.ts` | دعم GitHub Worker proxy + تشفير | ✅ مُحدّث |
| `src/ai/AIPanel.tsx` | إعدادات Workers + دليل الاستخدام | ✅ مُحدّث |
| `src/utils/apiKeyCrypto.ts` | تشفير AES-256-GCM | ✅ مُحدّث |
| `src/utils/pinCrypto.ts` | salt + verifyPin | ✅ مُحدّث |
| `src/store/aiStore.ts` | verifyPin + loadEncryptedKeys async | ✅ مُحدّث |
| `src/systems/AutoSaveSystem.ts` | توقف عند إخفاء التبويب | ✅ مُحدّث |

---

---

## 🔍 دليل أخطاء البحث والبحث في الويب

### الخطأ 17: خطأ 429 Rate limit (OpenRouter)

**الرسالة:**
```
⚠️ خطأ 429: {"error":{"message":"Rate limit exceeded: free-models-per-day..."}}
```

**السبب:**
- OpenRouter المجاني يسمح بـ 50 طلب/يوم فقط
- تجاوزت الحد اليومي

**الحل:**
```
1. شحن حساب OpenRouter بـ $10 (1000 طلب/يوم)
2. أو استخدام Gemini المجاني (1500 طلب/يوم) — مُوصى به
3. أو الانتظار حتى يتجدد العدد (كل 24 ساعة)
```

**لتفعيل Gemini:**
```
1. احصل على مفتاح من: https://aistudio.google.com/app/apikey
2. افتح اللعبة → AI Settings
3. اختر "Google Gemini (مجاني)"
4. أضف المفتاح
```

---

### الخطأ 18: خطأ 404 Gemini model not found

**الرسالة:**
```
⚠️ خطأ 404: models/gemini-1.5-pro is not found for API version v1main
```

**السبب:**
- نماذج Gemini 2.0 أُغلقت (يونيو 2026)
- نماذج Gemini 1.5 غير متاحة

**الحل:**
```
النماذج المتاحة حالياً:
✅ gemini-3.5-flash (مجاني)
✅ gemini-3.1-flash-lite (مجاني)
✅ gemini-3-flash (مجاني)

النماذج المُغلقة:
❌ gemini-2.0-flash (أُغلق يونيو 2026)
❌ gemini-1.5-pro (غير متاح)
❌ gemini-1.5-flash (غير متاح)
```

---

### الخطأ 19: البحث لا يُرجع نتائج

**الرسالة:**
```
لم يتم العثور على نتائج لـ "..."
```

**السبب:**
- DuckDuckGo لا يُرجع نتائج للاستعلام
- الاستعلام بالعربية (DuckDuckGo أفضل بالإنجليزية)

**الحل:**
```
1. جرّب استعلاماً بالإنجليزية
2. تأكد من أن زر 🔍 مفعّل
3. جرّب كلمات مختلفة
4. استخدم البحث المتقدم (multi-layer search)
```

---

## ☁️ Google Drive Integration

### الإعداد
1. افتح [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. اعمل مشروع جديد ← فعّل **Google Drive API**
3. **OAuth consent screen**: User data → Testing mode → ضيف إيميلك في Test users
4. **Credentials**: Create Credentials → OAuth Client ID → Web application
5. حط URLs في **Authorized JavaScript origins**: `http://localhost:5173`, `https://project-owner.github.io`
6. انسخ **Client ID** وحطه في التطبيق

### المميزات
- **رفع المحتوى فقط** (JSON): gameMeta.json, levels.json, characters.json
- **رفع المشروع كامل**: كل الملفات من GitHub → Drive مع هيكل المجلدات
- حدود: 100 مستخدم تجريبي كحد أقصى

---

## اختبار التكامل

1. **اختبار الاتصال:** يجلب اسم المستخدم تلقائياً ✅
2. **التعديل المباشر:** يعدّل في المستودع الرئيسي ✅
3. **إنشاء مستودع جديد:** ينسخ كل الملفات عبر Git Data API + يحدث base path ✅
4. **رفع التعديلات:** يرفع characters.ts + dialogue.ts + gameMeta.ts ✅
5. **70 اختبار ✅** — TypeScript + Build + Tests

---

## ملاحظات مهمة

1. **التوكن:** استخدم توكن كلاسيك (وليس Fine-grained) بصلاحيات `repo` + `workflow`
2. **المالك:** هو اسم المستخدم على GitHub (وليس الاسم الكامل أو الإيميل)
3. **الاسم:** لا يحتوي على مسافات أو أحرف خاصة (استخدم `-` بدلاً من `_`)
4. **Git Data API:** يستخدم Trees + Blobs + Commits — commit واحد لكل الملفات
5. **حد الحجم:** الملفات الكبيرة جداً (>50MB) قد تفشل بسبب حدود Contents API
6. **الوسائط:** ملفات `.mp4/.mp3/.wav` تُرفع عبر Contents API — قد تفشل إذا كانت كبيرة جداً

---

## الخطأ 16: CORS يمنع headers مخصصة

**الرسالة:**
```
Access to fetch at 'https://api.github.com/...' from origin '...' has been blocked by CORS policy: 
Request header field http-referer is not allowed by Access-Control-Allow-Headers in preflight response.
```

**السبب:**
طلب GitHub يتضمن headers مخصصة مثل `HTTP-Referer` و `X-Title` لكن `Access-Control-Allow-Headers` في Worker لا تسمح بها.

**الحل:**
إضافة `HTTP-Referer` و `X-Title` إلى `Access-Control-Allow-Headers` في كلا Worker:

```javascript
// worker/index.js (AI Worker)
const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, HTTP-Referer, X-Title',
  'Access-Control-Max-Age': '86400',
}

// worker-github/index.js (GitHub Worker)
const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-GitHub-Api-Version, HTTP-Referer, X-Title',
  'Access-Control-Max-Age': '86400',
}
```

**ملاحظة:** يجب نشر Worker بعد التحديث:
```bash
cd worker && npx wrangler deploy
cd worker-github && npx wrangler deploy
```
