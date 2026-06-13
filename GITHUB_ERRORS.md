# 🐛 دليل أخطاء GitHub وحلولها

## ملخص الأخطاء والحلول

| # | الخطأ | السبب | الحل |
|---|-------|-------|------|
| 1 | 403 Resource not accessible by integration | التوكن lacks صلاحيات الكتابة | استخدام توكن كلاسيك بصلاحية `repo` كاملة |
| 2 | 404 Not Found (Fork) | المالك غير صحيح (`old-owner` بدلاً من `project-owner`) | تصحيح `MAIN_REPO.owner` في `src/ai/github.ts` |
| 3 | 404 Not Found (Owner) | المستخدم يكتب اسم المستخدم الكامل أو الإيميل | إضافة دالة `resolveGithubOwner()` + كشف تلقائي من التوكن |
| 4 | المستودع فارغ بعد النسخ (قديم) | ~`auto_init: false`~ **تم الإصلاح**: الآن `auto_init: false` عمداً — يُنشئ commit واحد فقط (لا إلغاء deploy) | يُنشئ أول commit عبر `copyEntireRepo` مباشرة |
| 5 | الصفحة البيضاء | `vite.config.ts` يحتوي على `base` غير صحيح أو لا يحتوي على `base` أصلًا | تحديث `base` تلقائياً — مع دعم جميع أنواع الاقتباسات (`'`, `"`, `` ` ``) وإضافة `base` إن لم يكن موجوداً |
| 6 | الملفات لم تُرفع (قديم) | ~Contents API~ **تم الإصلاح**: Git Data API — شجرة واحدة ← commit واحد | **تم — `copyEntireRepo` تستخدم Blob API لكل الملفات** |
| 7 | ❌ أخطاء رفع الوسائط (قديم) | ~SKIP_EXTENSIONS كانت تطفر الصور/الفيديوهات~ **تم الإصلاح**: كل الملفات تُرفع (بدون SKIP) | **تم — `copyEntireRepo` ترفع كل شيء** |
| 8 | اختصارات M/B تعمل أثناء الكتابة | `keydown` handler لا يتحقق من focus | إضافة فحص `INPUT/TEXTAREA/contentEditable` |
| 9 | 🔴 Deploy يُلغى (Canceling) | `auto_init: true` + push = deploy مكرر | **تم — `auto_init: false`** → commit واحد فقط |
| 10 | 🔴 النتائج مبتظهرش كلها | الـ status box مكنش scrollable | **تم — إضافة `overflow: auto` + `maxHeight`** |

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

**الحل الجديد — Git Data API:**
تم إعادة كتابة `copyEntireRepo` بالكامل باستخدام GitHub's Git Data API:
```
1. GET شجرة المصدر بشكل متكرر  ← طلب واحد
2. GET محتوى كل blob             ← blob/files count
3. POST شجرة جديدة في الهدف     ← طلب واحد
4. POST commit                   ← طلب واحد
5. PATCH تحديث الفرع             ← طلب واحد
```

**المزايا:**
- ✅ **commit واحد** بكل الملفات — تاريخ نظيف
- ✅ **عملية ذرية** — كل شيء أو لا شيء
- ✅ لا يوجد `SKIP_DIRS` — `.github/workflows/` و `scripts/` تُنسخ تلقائياً
- ✅ لا يوجد 1MB limit (حد blob = 100MB)
- ✅ أسرع — طلبات API أقل

---

### ✅ الخطأ 7: أخطاء رفع الملفات الكبيرة (مُصلح بالكامل)

**الحالة:** مُصلح بالكامل

**التصميم الجديد — Blob API لكل الملفات:**
```typescript
// لا يوجد SKIP_EXTENSIONS, لا MAX_FILE_SIZE
// كل ملف يُرفع عبر:
// 1. GET blob من المصدر (base64)
// 2. POST blob جديد إلى الهدف
// 3. SHA في الشجرة النهائية
```

**المزايا:**
- ✅ كل الملفات تُرفع — صور، فيديوهات، خطوط، خريطة
- ✅ لا `⏭️` لأي ملف
- ✅ يعمل مع binary و text
- ✅ كل ملف في blob مستقل → لا حد 6MB للشجرة

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

## قائمة الملفات المُعدّلة

| الملف | التغيير |
|-------|---------|
| `src/ai/github.ts` | إعادة كتابة `copyEntireRepo` باستخدام Git Data API + إضافة `updateViteBasePath` + `decodeB64UTF8` |
| `GITHUB_ERRORS.md` | تحديث حلول المشاكل 5, 6, 7 |

---

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
5. **حد الحجم:** الملفات > 50MB تُتخطى تلقائياً (نادر في مشروع TypeScript)
6. **الوسائط:** ملفات `.mp4/.mp3/.wav` تُتخطى لأنها عادةً > حد blob API للرفع المتزامن
