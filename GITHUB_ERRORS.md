# 🐛 دليل أخطاء GitHub وحلولها

## ملخص الأخطاء والحلول

| # | الخطأ | السبب | الحل |
|---|-------|-------|------|
| 1 | 403 Resource not accessible by integration | التوكن lacks صلاحيات الكتابة | استخدام توكن كلاسيك بصلاحية `repo` كاملة |
| 2 | 404 Not Found (Fork) | المالك غير صحيح (`ykamal-1` بدلاً من `YoussefAhamedKamal`) | تصحيح `MAIN_REPO.owner` في `github.ts` |
| 3 | 404 Not Found (Owner) | المستخدم يكتب اسم المستخدم الكامل أو الإيميل | إضافة دالة `resolveGithubOwner()` + كشف تلقائي من التوكن |
| 4 | المستودع فارغ بعد النسخ | `auto_init: false` — لا يوجد فرع `main` | تغيير إلى `auto_init: true` |
| 5 | الصفحة البيضاء | `vite.config.ts` يحتوي على `base: '/cyber-guardians-mobile/'` | تحديث `base` تلقائياً لاسم المستودع الجديد |
| 6 | الملفات لم تُرفع | `.github/workflows` و `scripts` كانت مستبعدة | إزالة它们 من قائمة الاستبعاد |
| 7 | أخطاء رفع الملفات الكبيرة | فيديوهات/صوت/خطوط لا يمكن رفعها عبر API | تجاهل `public/` وملفات `.mp4/.mp3/.wav/.ttf` |
| 8 | اختصارات M/B تعمل أثناء الكتابة | `keydown` handler لا يتحقق من focus | إضافة فحص `INPUT/TEXTAREA/contentEditable` |

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
`MAIN_REPO.owner` كان `ykamal-1` لكن المالك الحقيقي هو `YoussefAhamedKamal`.

**الحل:**
```typescript
// github.ts
export const MAIN_REPO = { owner: 'YoussefAhamedKamal', repo: 'cyber-guardians-mobile' }
```

**ملاحظة:** المالك هو **اسم المستخدم** على GitHub، وليس الاسم الكامل.

---

### الخطأ 3: 404 Not Found (Owner)

**الرسالة:**
```
❌ لم يتم العثور على حساب GitHub لهذا الإيميل: yousefekamal22@gmail.com
```

**السبب:**
- المستخدم يكتب الاسم الكامل (`Youssef Ahmed Kamal`) بدلاً من اسم المستخدم (`YoussefAhamedKamal`)
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

### الخطأ 4: المستودع فارغ بعد النسخ

**الرسالة:**
- المستودع أُنشئ بنجاح
- لكن لا يوجد ملفات (فقط README افتراضي)

**السبب:**
```typescript
// كان:
auto_init: false  // لا يوجد فرع main → الملفات لا تُرفع
```

**الحل:**
```typescript
// أصبح:
auto_init: true  // يُنشئ فرع main جاهز → الملفات تُرفع
```

---

### الخطأ 5: الصفحة البيضاء

**الرسالة:**
- الصفحة زرقاء فقط (الـ CSS يعمل)
- لكن المحتوى لا يظهر (الـ JS لا يعمل)

**السبب:**
`vite.config.ts` يحتوي على:
```typescript
base: '/cyber-guardians-mobile/'
```
لكن المستودع الجديد اسمه `test_Edu_Game_AI_v2`، فيجب أن يكون:
```typescript
base: '/test_Edu_Game_AI_v2/'
```

**الحل:**
تحديث `base` تلقائياً أثناء النسخ:
```typescript
} else if (itemPath === 'vite.config.ts') {
  const decoded = decodeURIComponent(escape(atob(content)))
  const updated = decoded.replace(/base:\s*['"]\/[^'"]*['"]/, `base: '/${targetRepo}/'`)
  finalContent = btoa(unescape(encodeURIComponent(updated)))
}
```

---

### الخطأ 6: الملفات لم تُرفع

**الرسالة:**
- المستودع يحتوي فقط على `README.md`
- لا يوجد `src/`, `.github/workflows/`, `scripts/`

**السبب:**
```typescript
// كان:
const SKIP_DIRS = ['node_modules', '.git', 'dist', '.github', 'scripts']
```

**الحل:**
```typescript
// أصبح:
const SKIP_DIRS = ['node_modules', '.git', 'dist']
```

**ملاحظة:** `.github/workflows/` ضرورية للنشر التلقائي عبر GitHub Pages.

---

### الخطأ 7: أخطاء رفع الملفات الكبيرة

**الرسالة:**
- كثير من الملفات لها ❌ (فشل)
- بعض الملفات نجحت ✅

**السبب:**
ملفات الفيديو والصوت والخطوط كبيرة جداً ولا يمكن رفعها عبر GitHub API.

**الحل:**
تجاهل الملفات الثنائية:
```typescript
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'public']
const SKIP_EXTENSIONS = ['.mp4', '.mp3', '.wav', '.webp', '.png', '.jpg', 
  '.jpeg', '.gif', '.svg', '.ttf', '.woff', '.woff2', '.eot', '.map', '.lock']
```

**ملاحظة:** الملفات في `public/` ستأخذ من المستودع الأصلي تلقائياً أثناء التشغيل.

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
| `src/ai/github.ts` | إضافة الدوال الجديدة + تحديث copyEntireRepo |
| `src/ai/AIPanel.tsx` | واجهة الخيارين + كشف تلقائي |
| `src/App.tsx` | إصلاح اختصارات M/B |

---

## اختبار التكامل

1. **اختبار الاتصال:** يجلب اسم المستخدم تلقائياً ✅
2. **التعديل المباشر:** يعدّل في المستودع الرئيسي ✅
3. **إنشاء مستودع جديد:** ينسخ كل الملفات + يحدث base path ✅
4. **رفع التعديلات:** يرفع characters.ts + dialogue.ts + gameMeta.ts ✅

---

## ملاحظات مهمة

1. **التوكن:** استخدم توكن كلاسيك (وليس Fine-grained) لضمان الصلاحيات
2. **المالك:** هو اسم المستخدم على GitHub (وليس الاسم الكامل أو الإيميل)
3. **الاسم:** لا يحتوي على مسافات أو أحرف خاصة (استخدم `-` بدلاً من `_`)
4. **الوقت:** النسخ يستغرق ~30 ثانية (ينسخ ملفات نصية فقط)
5. **الفيديوهات:** ستأخذ من المستودع الأصلي تلقائياً
