# 📚 دليل المعلم — إعداد اللعبة على مستودعك الخاص

> دليل شامل للمعلم غير التقني: كيف تنسخ لعبة Cyber Guardians على حسابك الشخصي وتعملها بشكل صحيح

---

## ⚠️ تنبيه مهم قبل البدء

> **أنت ستنشئ حسابات وخدمات خاصة بك — لاستخدام حسابات المطور الأصلي!**

- ✅ أنت تنشئ **Worker Proxy خاص بك** على Cloudflare
- ✅ أنت تحصل على **API Key خاص بك** من OpenAI/Google
- ✅ أنت تحصل على **GitHub Token خاص بك**
- ✅ أنت تنشئ **مستودع GitHub خاص بك**
- ❌ لا تعدّل أي ملفات في المستودع الأصلي
- ❌ لا تستخدم حسابات أو مفاتيح المطور الأصلي

---

## 📋 جدول المحتويات

1. [نظرة عامة — ماذا ستفعل؟](#overview)
2. [القسم الأول: إعداد AI (مزود الذكاء الاصطناعي)](#ai-setup)
3. [القسم الثاني: إعداد GitHub (استضافة المشروع)](#github-setup)
4. [القسم الثالث: نسخ اللعبة وتشغيلها](#clone-game)
5. [القسم الرابع: تعديل المحتوى التعليمي](#customize)
6. [القسم الخامس: حل المشاكل الشائعة](#troubleshooting)

---

## 1. نظرة عامة — ماذا ستفعل؟ {#overview}

### الهدف
ستقوم بنسخ لعبة Cyber Guardians على حسابك الشخصي بحيث:
1. ✅ اللعبة تعمل على رابط خاص بك (مثل: `your-username.github.io/cyber-guardians-mobile`)
2. ✅ AI Assistant يعمل ويساعدك في تعديل المحتوى
3. ✅ يمكنك تعديل الرسائل والشخصيات والمستويات
4. ✅ التغييرات تظهر فوراً على اللعبة

### المطلوب منك
- حساب GitHub مجاني
- حساب Cloudflare مجاني
- معرفة 기본ية بالحاسوب (لا تحتاج خبرة برمجية)

---

## 2. القسم الأول: إعداد AI (مزود الذكاء الاصطناعي) {#ai-setup}

### ما هو AI في هذه اللعبة؟

AI Assistant هو مساعد ذكي مدمج في اللعبة يساعدك على:
- تعديل الرسائل التعليمية (مثل: غيّر رسالة المستوى 3)
- إضافة شخصيات جديدة
- تعديل أي محتوى في اللعبة

### لماذا نحتاج Worker Proxy؟

#### المشكلة:
عندما تستخدم AI Assistant في اللعبة، المتصفح يرسل طلب إلى خادم OpenAI أو Google مباشرة. لكن هناك مشكلتان:
1. **المفتاح السري (API Key)** سيظهر في المتصفح → أي شخص يستطيع سرقته
2. **CORS** — المتصفح يحجب الطلبات من مواقع مختلفة لأسباب أمنية

#### الحل: Worker Proxy
```
بدون Worker Proxy:
اللعبة ──→ المتصفح ──→ OpenAI (المفتاح ظاهر! ⚠️)

مع Worker Proxy:
اللعبة ──→ Worker (خادمك على Cloudflare) ──→ OpenAI
              ↑
         المفتاح مخفي هنا 🔒
```

**Worker** هو برنامج صغير يعمل على خوادم Cloudflare (شركة مشهورة وموثوقة). إنه مثل "شباك تذاكر" — اللعبة تطلب من Worker، وWorker يمرّر الطلب للـ AI ويعيد النتيجة.

### خيار بديل: الاتصال المباشر (بدون Worker Proxy)

> ⚠️ **تحذير:** هذا الخيار أقل أماناً — استخدمه على مسؤوليتك الخاصة!

بمجرد ضبط إعدادات الـ AI، يمكنك اختيار **الاتصال المباشر** بدلاً من Worker Proxy. هذا يعني:
- ✅ **لا تحتاج حساب Cloudflare** أو إعداد Worker
- ✅ **أسرع في الإعداد** — فقط أضف API Key واختر "الاتصال المباشر"
- ❌ **مفتاح API يظهر في المتصفح** — أي شخص يستطيع رؤيته في DevTools
- ❌ **CORS** — بعض مزودي AI قد يحجبون الطلبات من المتصفح

#### كيف تفعّل الاتصال المباشر:

1. افتح اللعبة
2. اضغط على الزر العائم **🤖**
3. اذهب إلى تبويب **"🤖 AI Settings"**
4. ابحث عن خيار **"الاتصال المباشر (بدون Worker Proxy)"**
5. فعّل الخيار ✅
6. أضف API Key الخاص بك
7. اضغط **"🔌 اختبار الاتصال"** للتأكد

#### متى تستخدم الاتصال المباشر؟

| الحالة | الاستخدام الموصى به |
|--------|---------------------|
| أنت معلم وتريد تجربة اللعبة فقط | ✅ الاتصال المباشر مناسب |
| أنت معلم وتريد استخدام اللعبة مع طلابك | ⚠️ الاتصال المباشر مقبول مع تحفظات |
| أنت تدير مسابقة رسمية | ❌ استخدم Worker Proxy |

#### ملاحظات مهمة:

1. **OpenRouter** — يعمل بشكل جيد مع الاتصال المباشر (يدعم CORS)
2. **OpenAI** — قد لا يعمل مع الاتصال المباشر (لا يدعم CORS من المتصفح)
3. **Google Gemini** — قد لا يعمل مع الاتصال المباشر (لا يدعم CORS من المتصفح)
4. **Ollama** — يعمل فقط إذا كنت تشغل الـ AI محلياً على جهازك

### الخطوة 1: إنشاء حساب Cloudflare مجاني

1. اذهب إلى: **https://dash.cloudflare.com/sign-up**
2. أدخل إيميلك وكلمة مرور
3. فعّل حسابك من الإيميل
4. ستدخل لوحة التحكم الرئيسية

### الخطوة 2: إنشاء Worker Proxy خاص بك

> ⚠️ **مهم:** أنت تنشئ Worker **جديد** خاص بك — لا تعدّل Worker المطور الأصلي!

#### الخطوة 2.1: فتح لوحة تحكم Cloudflare

1. اذهب إلى: **https://dash.cloudflare.com**
2. سجّل الدخول بحسابك
3. سترى لوحة التحكم الرئيسية

#### الخطوة 2.2: الانتقال إلى Workers

1. في القائمة左侧 (على اليسار)، ابحث عن **"Workers & Pages"**
2. اضغط عليه
3. سترى صفحة Workers

#### الخطوة 2.3: إنشاء Worker جديد

1. اضغط على زر **"Create"** (أزرق اللون في الأعلى)
2. سترى صفحة **"Ship something new"** مع عدة خيارات:
   - Continue with GitHub
   - Connect GitLab
   - **Start with Hello World!** ✅ ← اختر هذا
   - Select a template
   - Upload your static files

3. اضغط على **"Start with Hello World!"**

4. الآن سترى صفحة تسمية Worker:
   - **"Worker Name"**: اكتب اسم الـ Worker
     - مثال: `my-ai-proxy`
     - ملاحظة: الاسم يجب أن يكون بالإنجليزية، بدون مسافات، يمكن استخدام `-`
   - اضغط **"Deploy"**

5. الآن سترى صفحة الكود (Editeur):
   - هناك كود جاهز (Hello World)
   - **لا تقلق** — ستمسحه وتحط الكود الخاص بك

#### الخطوة 2.4: وضع الكود الجديد

1. في صفحة Editeur، سترى مربع كود
2. **امسح كل الكود الموجود** (Ctrl+A ثم Delete)
3. **انسخ الكود التالي والصقه**:

```javascript
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim())
    const corsHeaders = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, HTTP-Referer, X-Title',
      'Access-Control-Max-Age': '86400',
    }
    if (allowed.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const url = new URL(request.url)
    if (url.pathname === '/health') {
      return new Response('ok', { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } })
    }

    const authToken = env.AUTH_TOKEN
    if (authToken) {
      const provided = request.headers.get('X-Auth-Token')
      if (provided !== authToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const target = url.searchParams.get('target')
    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing ?target= parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let targetUrl
    try {
      targetUrl = new URL(target)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid target URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const allowedHosts = ['api.openai.com', 'generativelanguage.googleapis.com', 'api.anthropic.com', 'openrouter.ai']
    if (!allowedHosts.includes(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Host not allowed: ' + targetUrl.hostname }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const headers = new Headers(request.headers)
    headers.delete('Origin')
    headers.delete('Referer')
    headers.delete('X-Auth-Token')
    headers.set('Host', targetUrl.host)

    const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined

    const resp = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
    })

    const respHeaders = new Response(resp.headers)
    Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v))
    respHeaders.delete('Content-Security-Policy')

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    })
  },
}
```

4. اضغط **"Deploy"** (زر أزرق في الأسفل)

#### الخطوة 2.5: نسخ رابط Worker

1. بعد الضغط على Deploy، سترى صفحة **"Completed deployment"**
2. في الأعلى، سترى رابط الـ Worker مثل:
   ```
   https://my-ai-proxy.your-username.workers.dev
   ```
3. **انسخ هذا الرابط** واحفظه — ستحتاجه لاحقاً

> ✅ **الآن لديك AI Worker خاص بك!**

### الخطوة 3: إعداد المتغيرات (Environment Variables)

> هذه الخطوة مهمة جداً — بدونها لن يعمل Worker!

#### الخطوة 3.1: الوصول إلى إعدادات المتغيرات

1. من صفحة الـ Worker، اضغط على تبويب **"Settings"** (في الأعلى)
2. ثم اضغط على **"Variables and Secrets"** (في القائمة左侧)

#### الخطوة 3.2: إضافة المتغير الأول (AUTH_TOKEN)

1. اضغط **"Add variable"**
2. املأ:

| الحقل | القيمة |
|-------|--------|
| **Variable name** | `AUTH_TOKEN` |
| **Value** | اكتب نصاً سرياً تختاره (مثل: `my-ai-secret-123`) |
| **Encrypt** | ✅ فعّل هذا الخيار |

3. اضغط **"Save"**

> **ما هو AUTH_TOKEN؟**
> هذا مفتاح حماية — اللعبة سترسله مع كل طلب للتأكد أنه منك.

#### الخطوة 3.3: إضافة المتغير الثاني (ALLOWED_ORIGINS)

1. اضغط **"Add variable"** مرة أخرى
2. املأ:

| الحقل | القيمة |
|-------|--------|
| **Variable name** | `ALLOWED_ORIGINS` |
| **Value** | `http://localhost:3001,http://localhost:3002,http://localhost:5173,https://YOUR-USERNAME.github.io` |
| **Encrypt** | ❌ لا تفعّل |

3. اضغط **"Save"**

> **مهم:** استبدل `YOUR-USERNAME` باسم المستخدم الخاص بك على GitHub!

#### الخطوة 3.4: إضافة المتغير الثالث (API Key)

1. اضغط **"Add variable"** مرة أخرى
2. املأ:

| الحقل | القيمة |
|-------|--------|
| **Variable name** | `GEMINI_API_KEY` (إذا تستخدم Gemini) أو `OPENAI_API_KEY` (إذا تستخدم OpenAI) |
| **Value** | المفتاح الذي حصلت عليه من Google أو OpenAI |
| **Encrypt** | ✅ فعّل هذا الخيار |

3. اضغط **"Save"**

#### الخطوة 3.5: تأكيد الحفظ

1. تأكد من أن لديك 3 متغيرات على الأقل:
   - ✅ `AUTH_TOKEN`
   - ✅ `ALLOWED_ORIGINS`
   - ✅ `GEMINI_API_KEY` أو `OPENAI_API_KEY`

2. اضغط **"Deploy"** مرة أخرى (في الأعلى) لتطبيق التغييرات

### الخطوة 4: الحصول على مفتاح AI (API Key)

#### خيار A: Google Gemini (مجاني ✅) — مُوصى به

1. اذهب إلى: **https://aistudio.google.com/app/apikey**
2. سجّل الدخول بحساب Google الخاص بك
3. اضغط **"Create API Key"**
4. اختر مشروع (أو أنشئ مشروع جديد)
5. انسخ المفتاح (يبدأ بـ `AIza...`)
6. أضفه في Cloudflare Worker كمتغير: `GEMINI_API_KEY`

#### خيار B: OpenAI (مدفوع 💰)

1. اذهب إلى: **https://platform.openai.com/api-keys**
2. سجّل الدخول أو أنشئ حساباً
3. اضغط **"Create new secret key"**
4. انسخ المفتاح (يبدأ بـ `sk-...`)
5. أضفه في Cloudflare Worker كمتغير: `OPENAI_API_KEY`

### الخطوة 5: إعداد اللعبة للاتصال بالـ Worker

1. افتح اللعبة
2. اضغط على الزر العائم **🤖** (أسفل اليسار)
3. اذهب إلى تبويب **"⚙ GitHub Settings"** أو **"🤖 AI Settings"**
4. ابحث عن قسم **"AI Provider"** أو **"مزود الـ AI"**
5. املأ الحقول:

| الحقل | القيمة | مثال |
|-------|--------|------|
| **Base URL** | رابط Worker الخاص بك | `https://my-ai-proxy.your-username.workers.dev` |
| **Model** | اسم النموذج | `gemini-2.0-flash` (لـ Gemini) أو `gpt-4o-mini` (لـ OpenAI) |
| **API Key** | المفتاح الذي حصلت عليه | `AIza...` أو `sk-...` |
| **AUTH Token** | الـ Token الذي أنشأته في Worker | `my-secret-token-123` |

6. اضغط **"💾 حفظ"**
7. اضغط **"🔍 اختبار الاتصال"** للتأكد من أن كل شيء يعمل

### شرح الحقول بالتفصيل

#### Base URL — ما هو؟
هذا هو رابط Worker الخاص بك. إنه "العنوان" الذي سترسل إليه الطلبات.

**كيف تحصل عليه:**
- بعد إنشاء Worker في Cloudflare، ستحصل على رابط مثل:
  `https://my-ai-proxy.your-username.workers.dev`
- انسخ هذا الرابط وضعه في حقل Base URL

**ملاحظة مهمة:**
- إذا كنت تشغل اللعبة محلياً (`localhost`)، يمكنك استخدام:
  `http://localhost:8787` (منافذ Worker المحلية)
- أو استخدم الرابط العام كما هو

#### Model (النموذج) — ما هو؟
هذا هو "الذكاء" الذي ستستخدمه. كل نموذج له ميزاته:

| النموذج | الشركة | السعر | ملاحظات |
|---------|--------|-------|---------|
| `gemini-2.0-flash` | Google | مجاني ✅ | الأفضل للمبتدئين |
| `gemini-1.5-pro` | Google | مجاني ✅ | أقوى قليلاً |
| `gpt-4o-mini` | OpenAI | مدفوع | أسرع وأرخص |
| `gpt-4o` | OpenAI | مدفوع | الأقوى |
| `claude-3-haiku` | Anthropic | مدفوع | بديل جيد |

#### API Key — ما هو؟
هذا هو "المفتاح السري" الذي يثبت أن لديك صلاحية استخدام الـ AI.

**تحذير أمني:**
- لا تشارك API Key مع أحد أبداً
- لا ترفعه إلى GitHub أو أي موقع عام
- Worker Proxy يخفيه تلقائياً — لهذا نستخدمه

---

## 3. القسم الثاني: إعداد GitHub {#github-setup}

### ما هو GitHub؟
GitHub هو موقع لتخزين ومشاركة الملفات البرمجية. مثل "جوجل درايف" لكن للبرامج. سنستخدمه لنشر اللعبة على الإنترنت.

### لماذا نحتاج GitHub Worker Proxy؟

#### المشكلة:
عندما ترفع ملفات إلى GitHub، التوكن (المفتاح) يظهر في المتصفح.

#### الحل:
```
بدون Worker Proxy:
اللعبة ──→ المتصفح ──→ GitHub (التوكن ظاهر! ⚠️)

مع Worker Proxy:
اللعبة ──→ Worker (خادمك على Cloudflare) ──→ GitHub
              ↑
         التوكن مخفي هنا 🔒
```

### خيار بديل: الاتصال المباشر (بدون Worker Proxy)

> ⚠️ **تحذير:** هذا الخيار أقل أماناً — استخدمه على مسؤوليتك الخاصة!

بمجرد الحصول على GitHub Token، يمكنك استخدامه مباشرة بدون Worker Proxy. هذا يعني:
- ✅ **لا تحتاج حساب Cloudflare** أو إعداد Worker
- ✅ **أسرع في الإعداد** — فقط أضف GitHub Token
- ❌ **التوكن يظهر في المتصفح** — أي شخص يستطيع رؤيته في DevTools
- ❌ **CORS** — GitHub API قد يحجب الطلبات من المتصفح

#### كيف تفعّل الاتصال المباشر لـ GitHub:

1. احصل على GitHub Token (كما في الخطوة 2 أعلاه)
2. افتح اللعبة
3. اضغط على الزر العائم **🤖**
4. اذهب إلى تبويب **"⚙ GitHub Settings"**
5. أضف GitHub Token في حقل **"GitHub Token"**
6. اضغط **"💾 حفظ"**
7. اضغط **"🔍 اختبار الاتصال"** للتأكد

#### متى تستخدم الاتصال المباشر لـ GitHub؟

| الحالة | الاستخدام الموصى به |
|--------|---------------------|
| أنت معلم وتريد تجربة اللعبة فقط | ✅ الاتصال المباشر مناسب |
| أنت معلم وتريد استخدام اللعبة مع طلابك | ⚠️ الاتصال المباشر مقبول مع تحفظات |
| أنت تدير مسابقة رسمية | ❌ استخدم Worker Proxy |

### الخطوة 1: إنشاء حساب GitHub مجاني

1. اذهب إلى: **https://github.com/signup**
2. أدخل إيميلك وكلمة المرور
3. أكمل التحقق
4. اختر الباقة المجانية (Free)

### الخطوة 2: الحصول على GitHub Token

1. اذهب إلى: **https://github.com/settings/tokens**
2. اضغط **"Generate new token"** ثم **"Generate new token (classic)"**
3. اكتب ملاحظة (مثل: `cyber-guardians-token`)
4. حدد **تاريخ الانتهاء** (30 يوم أو 90 يوم)
5. فعّل الصلاحيات التالية:

| الصلاحية | لماذا تحتاجها |
|----------|---------------|
| ☑️ `repo` | إنشاء وتعديل المستودعات |
| ☑️ `workflow` | تحديث GitHub Actions |

6. اضغط **"Generate token"**
7. انسخ التوكن فوراً (يبدأ بـ `ghp_...`) — لن تراه مرة أخرى!

### الخطوة 3: إنشاء Worker Proxy لـ GitHub

> ⚠️ **مهم:** أنت تنشئ Worker **جديد** خاص بك — لا تعدّل Worker المطور الأصلي!

#### الخطوة 3.1: فتح لوحة تحكم Cloudflare

1. اذهب إلى: **https://dash.cloudflare.com**
2. سجّل الدخول بحسابك
3. سترى لوحة التحكم الرئيسية

#### الخطوة 3.2: الانتقال إلى Workers

1. في القائمة左侧 (على اليسار)، ابحث عن **"Workers & Pages"**
2. اضغط عليه
3. سترى صفحة Workers

#### الخطوة 3.3: إنشاء Worker جديد

1. اضغط على زر **"Create"** (أزرق اللون في الأعلى)
2. سترى صفحة **"Ship something new"** مع عدة خيارات:
   - Continue with GitHub
   - Connect GitLab
   - **Start with Hello World!** ✅ ← اختر هذا
   - Select a template
   - Upload your static files

3. اضغط على **"Start with Hello World!"**

4. الآن سترى صفحة تسمية Worker:
   - **"Worker Name"**: اكتب اسم الـ Worker
     - مثال: `my-github-proxy`
     - ملاحظة: الاسم يجب أن يكون بالإنجليزية، بدون مسافات، يمكن استخدام `-`
   - اضغط **"Deploy"**

5. الآن سترى صفحة الكود (Editeur):
   - هناك كود جاهز (Hello World)
   - **لا تقلق** — ستمسحه وتحط الكود الخاص بك

#### الخطوة 3.4: وضع الكود الجديد

1. في صفحة Editeur، سترى مربع كود
2. **امسح كل الكود الموجود** (Ctrl+A ثم Delete)
3. **انسخ الكود التالي والصقه**:

```javascript
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim())
    const corsHeaders = {
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-GitHub-Api-Version, HTTP-Referer, X-Title',
      'Access-Control-Max-Age': '86400',
    }
    if (allowed.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const url = new URL(request.url)
    if (url.pathname === '/health') {
      return new Response('ok', { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } })
    }

    const authToken = env.AUTH_TOKEN
    if (authToken) {
      const provided = request.headers.get('X-Auth-Token')
      if (provided !== authToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const githubToken = env.GITHUB_TOKEN
    if (!githubToken) {
      return new Response(JSON.stringify({ error: 'GITHUB_TOKEN not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const target = url.searchParams.get('target')
    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing ?target= parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let targetUrl
    try {
      targetUrl = new URL(target)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid target URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const allowedHosts = ['api.github.com', 'raw.githubusercontent.com']
    if (!allowedHosts.includes(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Host not allowed: ' + targetUrl.hostname }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const headers = new Headers(request.headers)
    headers.delete('Origin')
    headers.delete('Referer')
    headers.delete('X-Auth-Token')
    headers.delete('Host')
    headers.set('Authorization', `Bearer ${githubToken}`)
    headers.set('Accept', headers.get('Accept') || 'application/vnd.github+json')
    headers.set('X-GitHub-Api-Version', '2022-11-28')

    const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined

    const resp = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
    })

    const respHeaders = new Response(resp.headers)
    Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v))
    respHeaders.delete('Content-Security-Policy')

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    })
  },
}
```

4. اضغط **"Deploy"** (زر أزرق في الأسفل)

#### الخطوة 3.5: نسخ رابط Worker

1. بعد الضغط على Deploy، سترى صفحة **"Completed deployment"**
2. في الأعلى، سترى رابط الـ Worker مثل:
   ```
   https://my-github-proxy.your-username.workers.dev
   ```
3. **انسخ هذا الرابط** واحفظه — ستحتاجه لاحقاً

> ✅ **الآن لديك GitHub Worker خاص بك!**

---

### الخطوة 4: إعداد المتغيرات (Environment Variables)

> هذه الخطوة مهمة جداً — بدونها لن يعمل Worker!

#### الخطوة 4.1: الوصول إلى إعدادات المتغيرات

1. من صفحة الـ Worker، اضغط على تبويب **"Settings"** (في الأعلى)
2. ثم اضغط على **"Variables and Secrets"** (في القائمة左侧)

#### الخطوة 4.2: إضافة المتغير الأول (AUTH_TOKEN)

1. اضغط **"Add variable"**
2. املأ:

| الحقل | القيمة |
|-------|--------|
| **Variable name** | `AUTH_TOKEN` |
| **Value** | اكتب نصاً سرياً تختاره (مثل: `my-gh-secret-123`) |
| **Encrypt** | ✅ فعّل هذا الخيار |

3. اضغط **"Save"**

> **ما هو AUTH_TOKEN؟**
> هذا مفتاح حماية — اللعبة سترسله مع كل طلب للتأكد أنه منك.

#### الخطوة 4.3: إضافة المتغير الثاني (ALLOWED_ORIGINS)

1. اضغط **"Add variable"** مرة أخرى
2. املأ:

| الحقل | القيمة |
|-------|--------|
| **Variable name** | `ALLOWED_ORIGINS` |
| **Value** | `http://localhost:3001,http://localhost:3002,http://localhost:5173,https://YOUR-USERNAME.github.io` |
| **Encrypt** | ❌ لا تفعّل |

3. اضغط **"Save"**

> **مهم:** استبدل `YOUR-USERNAME` باسم المستخدم الخاص بك على GitHub!

#### الخطوة 4.4: إضافة المتغير الثالث (GITHUB_TOKEN)

1. اضغط **"Add variable"** مرة أخرى
2. املأ:

| الحقل | القيمة |
|-------|--------|
| **Variable name** | `GITHUB_TOKEN` |
| **Value** | التوكن الذي حصلت عليه من GitHub (`ghp_...`) |
| **Encrypt** | ✅ فعّل هذا الخيار |

3. اضغط **"Save"**

#### الخطوة 4.5: تأكيد الحفظ

1. تأكد من أن لديك 3 متغيرات:
   - ✅ `AUTH_TOKEN`
   - ✅ `ALLOWED_ORIGINS`
   - ✅ `GITHUB_TOKEN`

2. اضغط **"Deploy"** مرة أخرى (في الأعلى) لتطبيق التغييرات

### الخطوة 5: إعداد اللعبة للاتصال بـ GitHub Worker

1. افتح اللعبة
2. اضغط على الزر العائم **🤖**
3. اذهب إلى تبويب **"⚙ GitHub Settings"**
4. املأ الحقول:

| الحقل | القيمة |
|-------|--------|
| **GitHub Worker URL** | رابط Worker الخاص بك (مثل: `https://my-github-proxy.your-username.workers.dev`) |
| **AUTH Token** | الـ Token الذي أنشأته (`gh-my-secret-123`) |
| **GitHub Token** | التوكن الأصلي (`ghp_...`) — اختياري إذا كنت تستخدم Worker |

5. اضغط **"💾 حفظ"**

---

## 4. القسم الثالث: نسخ اللعبة وتشغيلها {#clone-game}

### الخطوة 1: إنشاء مستودع جديد من داخل اللعبة

1. افتح اللعبة
2. اضغط على الزر العائم **🤖**
3. اذهب إلى تبويب **"⚙ GitHub Settings"**
4. اضغط على زر **"📦 إنشاء مستودع جديد"** أو **"Create New Repository"**
5. اكتب اسم المستودع (مثل: `my-cyber-guardians`)
6. اضغط **"إنشاء"**

**ماذا يحدث في الخلفية؟**
- اللعبة تنسخ جميع الملفات من المستودع الأصلي إلى مستودعك الجديد
- يحدث `vite.config.ts` تلقائياً ليعمل على رابطك الجديد
- يُنشأ ملف `README.md` جديد
- تفعّل GitHub Pages تلقائياً

### الخطوة 2: انتظار النشر (Deploy)

1. اذهب إلى: `https://github.com/YOUR-USERNAME/my-cyber-guardians`
2. اذهب إلى تبويب **"Actions"**
3. سترى workflow قيد التشغيل ⏳
4. انتظر حتى يصبح أخضر ✅ (عادة 2-5 دقائق)

### الخطوة 3: فتح اللعبة على الرابط الجديد

1. اذهب إلى: `https://YOUR-USERNAME.github.io/my-cyber-guardians/`
2. يجب أن تعمل اللعبة! 🎉

### الخطوة 4: تعديل الإعدادات للعمل على المستودع الجديد

1. افتح اللعبة على الرابط الجديد
2. اضغط على **🤖**
3. اذهب إلى **"⚙ GitHub Settings"**
4. حدّث:

| الحقل | القيمة الجديدة |
|-------|----------------|
| **Owner** | اسم المستخدم الخاص بك (يملأ تلقائياً) |
| **Repo** | `my-cyber-guardians` (أو ما أنشأته) |

5. اضغط **"💾 حفظ"**
6. اضغط **"🔍 اختبار الاتصال"** للتأكد

### الخطوة 5: مزامنة مع مستودع موجود (جديد ✅)

> إذا كان لديك **مستودع موجود بالفعل** على GitHub و تريد تحديثه:

1. اضغط على **🤖**
2. اذهب إلى **"⚙ GitHub Settings"**
3. أضف **Token** + **Owner** + **Repo** (اسم المستودع الموجود)
4. اضغط **"🔄 مزامنة مع مستودع موجود"**

**ماذا يحدث؟**
- إذا كان المستودع **فارغاً** → ينسخ كل ملفات اللعبة
- إذا كان المستودع **يحتوي ملفات** → يُحدّث الملفات الموجودة ويضيف الناقصة

**النتيجة:**
- 🔄 ملفات موجودة ← تُحدّث لأحدث إصدار
- ✅ ملفات ناقصة ← تُضاف
- ⏭️ ملفات كبيرة (>90MB) ← تُتخطى

### الخطوة 6: الرفع التلقائي عند التعديل (جديد ✅)

> يمكنك تفعيل الرفع التلقائي لرفع التعديلات فوراً:

1. اضغط على **🤖**
2. اذهب إلى **"🛠️ Faculty Editor"**
3. اذهب إلى تبويب **"📁 ملفات"**
4. فعّل خيار **"🔄 رفع تلقائي عند التعديل"**

**ماذا يُرفع تلقائياً؟**
- ✅ الشخصيات (characters)
- ✅ المستويات (dialogue)
- ✅ الإعدادات (gameMeta)
- ✅ الملفات المعدّلة يدوياً

**ملاحظة:** الرفع التلقائي يعمل فقط عند تعديل الملفات في محرر البيانات.

---

## 5. القسم الرابع: تعديل المحتوى التعليمي {#customize}

### الطريقة 1: عبر AI Assistant (الأسهل ✅)

1. اضغط على **🤖**
2. اضغط **"💬 AI Chat"**
3. اكتب أمر بالعربي، مثلاً:
   - "غيّر رسالة المستوى 1 لتكون عن فيروسات الفدية"
   - "أضف شخصية جديدة اسمها سارة تشرح التشفير"
   - "أضف 3 أسئلة جديدة للاختبار"
4. AI سيعمل التعديل تلقائياً
5. اضغط **"🔄 رفع إلى GitHub"** لحفظ التغييرات

### الطريقة 2: يدوياً (للمتقدمين)

1. اضغط على **🤖**
2. اذهب إلى **"🛠️ Faculty Editor"**
3. اختر القسم الذي تريد تعديله:
   - **المستويات** — رسائل وتحديات
   - **الشخصيات** — أسماء وأوصاف
   - **الإعدادات العامة** — عنوان اللعبة وألوانها
4. عدّل واضغط **"💾 حفظ"**
5. اضغط **"🔄 رفع إلى GitHub"**

### الطريقة 3: تعديل الملفات مباشرة (للمبرمجين)

1. اذهب إلى مستودعك على GitHub
2. افتح الملف الذي تريد تعديله (مثل: `src/data/dialogue.ts`)
3. اضغط على زر **✏️ Edit**
4. عدّل الكود واضغط **"Commit changes"**
5. سينشر تلقائياً خلال دقائق

---

## 6. القسم الخامس: حل المشاكل الشائعة {#troubleshooting}

### ❌ المشكلة: "GitHub token غير مُعد"

**السبب:** لم تدخل التوكن أو أنه انتهت صلاحيته.

**الحل:**
1. تحقق من أن التوكن صحيح (يبدأ بـ `ghp_`)
2. تحقق من الصلاحيات: `repo` + `workflow`
3. أنشئ توكن جديد إذا لزم الأمر

---

### ❌ المشكلة: "GitHub API خطأ 404"

**السبب:** اسم المستخدم أو المستودع غير صحيح.

**الحل:**
1. اكتب اسم المستخدم فقط (وليس الإيميل)
2. تأكد من اسم المستودع (بدون مسافات)
3. اضغط **"🔍 اختبار الاتصال"** للتأكد

---

### ❌ المشكلة: "CORS error" أو "blocked by CORS policy"

**السبب:** Worker Proxy غير مُعد أو رابطه خاطئ.

**الحل:**
1. تأكد من أن Worker يعمل: افتح رابط Worker في المتصفح → يجب أن يظهر `ok`
2. تأكد من `ALLOWED_ORIGINS` يحتوي على رابط اللعبة
3. تأكد من Base URL صحيح في إعدادات اللعبة

---

### ❌ المشكلة: "Unauthorized" أو "401"

**السبب:** AUTH_TOKEN غير متطابق.

**الحل:**
1. تأكد من AUTH_TOKEN في Worker مطابق لما في اللعبة
2. لا تضع مسافات زائدة
3. أعد نسخ الـ Token من Cloudflare

---

### ❌ المشكلة: الصفحة البيضاء بعد النسخ

**السبب:** `base` في `vite.config.ts` غير صحيح.

**الحل:**
1. اذهب إلى مستودعك على GitHub
2. افتح `vite.config.ts`
3. تأكد من أن `base` يشير لمسار صحيح:
   ```typescript
   base: '/my-cyber-guardians/',  // اسم المستودع
   ```
4. احفظ واضغط **"Commit"**

---

### ❌ المشكلة: AI لا يرد أو يظهر خطأ

**السبب:** مشكلة في الاتصال بـ Worker أو API Key.

**الحل:**
1. تحقق من API Key صحيح
2. تحقق من Worker يعمل (اضفتح رابطه + `/health`)
3. تحقق من Base URL صحيح
4. تحقق من Model مدعوم من مزود الـ AI

---

## 📞 الدعم

- **المستند الأصلي:** `PROJECT_MAP.md`
- **دليل AI:** `AI_ADVANCED_SETTINGS_GUIDE.md`
- **أخطاء GitHub:** `GITHUB_ERRORS.md`
- **GitHub Issues:** https://github.com/YoussefAhamedKamal/cyber-guardians-mobile/issues

---

## ✅ قائمة التحقق النهائية

### إعداد AI
- [ ] حساب Cloudflare مجاني
- [ ] Worker Proxy منشئ ويعمل
- [ ] AUTH_TOKEN مضبوط في Worker
- [ ] ALLOWED_ORIGINS يحتوي على رابط اللعبة
- [ ] API Key مضبوط (Gemini أو OpenAI)
- [ ] Base URL مضبوط في اللعبة
- [ ] Model مضبوط في اللعبة
- [ ] اختبار الاتصال ناجح ✅

### إعداد GitHub
- [ ] حساب GitHub مجاني
- [ ] GitHub Token منشئ بصلاحيات `repo` + `workflow`
- [ ] GitHub Worker Proxy منشئ ويعمل
- [ ] AUTH_TOKEN مضبوط في GitHub Worker
- [ ] GITHUB_TOKEN مضبوط في GitHub Worker
- [ ] GitHub Worker URL مضبوط في اللعبة
- [ ] اختبار الاتصال ناجح ✅

### النسخ والنشر
- [ ] مستودع جديد منشئ من داخل اللعبة
- [ ] جميع الملفات منقولة بنجاح
- [ ] GitHub Pages مفعّل
- [ ] اللعبة تعمل على الرابط الجديد ✅

### التعديل
- [ ] AI Assistant يعمل ويعدّل المحتوى
- [ ] التعديلات تُرفع إلى GitHub بنجاح
- [ ] التغييرات تظهر على اللعبة ✅

---

## 🔍 إعداد Worker البحث (اختياري — لتحسين نتائج البحث)

> **ملاحظة:** البحث يعمل بدون Worker (باستخدام DuckDuckGo مباشرة)، لكن Worker يُحسّن النتائج بشكل كبير.

### ما الذي يفعله Worker البحث؟
- يتجاوز مشاكل CORS في المتصفح
- يُعطي نتائج بحث أدق وأكثر
- يدعم البحث بطرق متعددة (DuckDuckGo API + HTML)
- مجاني تماماً — 100,000 طلب/يوم

### مقارنة: بدون Worker vs مع Worker

| | بدون Worker | مع Worker |
|---|---|---|
| **النتائج** | محدودة (DuckDuckGo Instant فقط) | كاملة (API + HTML) |
| **CORS** | قد يفشل | يعمل دائماً |
| **السرعة** | بطيء | سريع (Cloudflare edge) |
| **التكلفة** | مجاني | مجاني |

---

### الخطوة 1: إنشاء Worker البحث

#### الخطوة 1.1: تسجيل الدخول إلى Cloudflare
1. اذهب إلى: **https://dash.cloudflare.com**
2. سجّل الدخول بحسابك (أو أنشئ حساباً جديداً مجاناً)

#### الخطوة 1.2: الوصول إلى Workers & Pages
1. في القائمة左侧، اضغط على **"Workers & Pages"**
2. سترى صفحة Overview — اضغط على **"Create"** (زر أزرق في الأعلى)

#### الخطوة 1.3: اختيار نوع الإنشاء
1. سترى صفحة **"Ship something new"** مع عدة خيارات:
   - Continue with GitHub
   - Connect GitLab
   - **Start with Hello World!** ✅ ← اختر هذا
   - Select a template
   - Upload your static files

2. اضغط على **"Start with Hello World!"**

#### الخطوة 1.4: تسمية Worker
1. في حقل **"Worker Name"**، اكتب: `cyber-guardians-search-proxy`
   (أو أي اسم تريده — استخدم أحرف إنجليزية وشرطات فقط)
2. سترى رابط الـ Worker يتغير تلقائياً:
   ```
   https://cyber-guardians-search-proxy.your-username.workers.dev
   ```
3. اضغط على **"Deploy"** (زر أزرق في الأسفل)

### الخطوة 2: نسخ الكود

#### الخطوة 2.1: فتح محرر الكود
1. بعد الضغط على Deploy، سترى صفحة **"Completed deployment"**
2. اضغط على **"Edit code"** (زر رمادي في الأعلى)

#### الخطوة 2.2: حذف الكود الموجود
1. سترى محرر كود على اليمين (كود Hello World الافتراضي)
2. اضغط على `Ctrl+A` (أو `Cmd+A` على Mac) لتحديد كل الكود
3. اضغط على `Delete` لحذفه

#### الخطوة 2.3: نسخ الكود الجديد
1. انسخ الكود التالي بالكامل وضعه في المحرر:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    if (url.pathname === '/search') {
      return handleSearch(request, corsHeaders)
    }

    if (url.pathname === '/search/html') {
      return handleSearchHTML(request, corsHeaders)
    }

    return new Response(JSON.stringify({ 
      error: 'Not found',
      usage: {
        '/search?q=query': 'Search using DuckDuckGo API',
        '/search/html?q=query': 'Search using DuckDuckGo HTML (more results)',
      }
    }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

async function handleSearch(request, corsHeaders) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter ?q=' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`)
    
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Search failed', status: res.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    const results = []

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText.slice(0, 500),
        url: data.AbstractURL,
        source: 'duckduckgo',
      })
    }

    if (data.Answer) {
      results.unshift({
        title: data.Heading || 'Answer',
        snippet: data.Answer,
        url: data.AnswerURL,
        source: 'duckduckgo',
      })
    }

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.slice(0, 100),
            snippet: topic.Text.slice(0, 500),
            url: topic.FirstURL,
            source: 'duckduckgo',
          })
        }
      }
    }

    return new Response(JSON.stringify({
      query,
      results: results.slice(0, 8),
      total: results.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Search error', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function handleSearchHTML(request, corsHeaders) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter ?q=' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'HTML search failed', status: res.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const html = await res.text()
    const results = []

    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g

    let match
    const urls = []
    const titles = []
    const snippets = []

    while ((match = resultRegex.exec(html)) !== null) {
      urls.push(match[1])
      titles.push(match[2].replace(/<[^>]*>/g, '').trim())
    }

    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').trim())
    }

    for (let i = 0; i < Math.min(urls.length, 8); i++) {
      results.push({
        title: titles[i] || '',
        snippet: (snippets[i] || '').slice(0, 500),
        url: urls[i] || '',
        source: 'duckduckgo-html',
      })
    }

    return new Response(JSON.stringify({
      query,
      results,
      total: results.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'HTML search error', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
```

#### الخطوة 2.4: حفظ الكود
1. اضغط على `Ctrl+S` (أو `Cmd+S` على Mac) لحفظ الكود
2. أو اضغط على **"Save"** (زر أزرق في الأعلى)

#### الخطوة 2.5: نشر الكود
1. اضغط على **"Deploy"** (زر أزرق في الأعلى)
2. انتظر حتى ترى رسالة **"Successfully deployed"**

---

### الخطوة 3: نسخ رابط Worker

#### الخطوة 3.1: العثور على الرابط
1. في الأعلى من صفحة الـ Worker، سترى رابطاً مثل:
   ```
   https://cyber-guardians-search-proxy.your-username.workers.dev
   ```
2. **انسخ هذا الرابط** واحفظه — ستحتاجه لاحقاً

#### الخطوة 3.2: التحقق من الرابط
1. تأكد من أن الرابط ينتهي بـ `.workers.dev`
2. تأكد من أن الاسم يطابق ما كتبته في الخطوة 1.4

---

### الخطوة 4: اختبار Worker

#### الخطوة 4.1: اختبار البحث الأساسي
1. افتح الرابط في المتصفح وأضف `?q=hello` في النهاية:
   ```
   https://cyber-guardians-search-proxy.your-username.workers.dev/search?q=hello
   ```
2. يجب أن ترى نتائج JSON مثل:
   ```json
   {
     "query": "hello",
     "results": [...],
     "total": 5
   }
   ```

#### الخطوة 4.2: اختبار البحث المتقدم
1. جرّب البحث عن شيء محدد:
   ```
   https://cyber-guardians-search-proxy.your-username.workers.dev/search?q=GPT-5
   ```
2. يجب أن ترى نتائج关于 GPT-5

#### الخطوة 4.3: اختبار البحث HTML
1. جرّب الـ HTML search:
   ```
   https://cyber-guardians-search-proxy.your-username.workers.dev/search/html?q=cybersecurity
   ```
2. يجب أن ترى نتائج أكثر تفصيلاً

---

### أخطاء شائعة وكيفية حلها

#### الخطأ: "Worker not found"
- **السبب:** الرابط غير صحيح أو الـ Worker لم يُنشر بعد
- **الحل:** تأكد من نسخ الرابط بشكل صحيح، أو أعد النشر

#### الخطأ: "CORS error"
- **السبب:** الكود غير مكتمل
- **الحل:** تأكد من نسخ الكود بالكامل (لا ت deix任何 سطر)

#### الخطأ: "No results"
- **السبب:** DuckDuckGo لا يُرجع نتائج لهذا الاستعلام
- **الحل:** جرّب استعلاماً مختلفاً

---

### Checklist: تأكد من إتمام كل خطوة

- [ ] Cloudflare Account منشئ
- [ ] Worker منشئ باسم `cyber-guardians-search-proxy`
- [ ] الكود منسخ بالكامل
- [ ] الكود محفوظ ومنشور
- [ ] رابط Worker منسخ
- [ ] اختبار `/search?q=hello` ناجح ✅
- [ ] اختبار `/search?q=GPT-5` ناجح ✅
- [ ] رابط Worker مضبوط في اللعبة (اختياري)

---

### ملاحظات مهمة:
- **مجاني تماماً** — 100,000 طلب/يوم مجاناً
- **لا يحتاج مفاتيح API** — يستخدم DuckDuckGo المجاني
- **يتجاوز CORS** — لا مشاكل مع المتصفح
- **اختياري** — اللعبة تعمل بدونه (باستخدام DuckDuckGo مباشرة)
- **لا يحتاج Environment Variables** — لا حاجة لمتغيرات AUTH_TOKEN

---

## 📁 ملاحظة عن ملفات wrangler.toml

> ⚠️ **مهم جداً:** ملفات `wrangler.toml` في المشروع مُعدّة للمطور الأصلي فقط!

### ما هي wrangler.toml؟
هي ملف إعدادات لـ Cloudflare Workers. تحتوي على:
- `account_id` — رقم حسابك على Cloudflare
- `ALLOWED_ORIGINS` — المواقع المسموح لها بالاتصال بالـ Worker

### لماذا لا تستخدمها؟
لأنها تحتوي على معلومات حساب المطور الأصلي:
```toml
# ❌ هذا خاص بالمطور الأصلي — لا تستخدمه!
account_id = "43dcf5575f6f6f59439c0e28a17d3e1a"
ALLOWED_ORIGINS = "...,https://youssefahamedkamal.github.io,..."
```

### ماذا تفعل بدلاً من ذلك؟
1. **أنشئ Worker من واجهة Cloudflare** (كما في الدليل أعلاه)
2. **استخدم Environment Variables** من واجهة Cloudflare
3. **لا تعدّل ملفات wrangler.toml** في المشروع

### إذا أردت استخدام Wrangler CLI (اختياري — للمتقدمين فقط)
1. سجّل الدخول: `npx wrangler login`
2. أنشئ ملف `wrangler.toml` جديد في مجلد منفصل:
   ```toml
   name = "my-worker"
   main = "index.js"
   compatibility_date = "2024-01-01"
   # account_id يُملأ تلقائياً

   [vars]
   ALLOWED_ORIGINS = "http://localhost:3001,https://YOUR-USERNAME.github.io"
   ```
3. ارفع: `npx wrangler deploy`

---

> **آخر تحديث:** 2026-06-16
> **الإصدار:** 2.1.0
> **المطور:** YoussefAhamedKamal
