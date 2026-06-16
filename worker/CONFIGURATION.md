# 📋 Worker Configuration Templates

> نماذج إعداد Worker للteachers — عدّل القيم حسب حسابك

---

## AI Worker Template

### wrangler.toml

```toml
name = "my-cyber-guardians-ai-proxy"  # ← غيّر الاسم كما تشاء
main = "index.js"
compatibility_date = "2024-01-01"
# account_id يُملأ تلقائياً عند `wrangler login`

[vars]
ALLOWED_ORIGINS = "http://localhost:3001,http://localhost:3002,http://localhost:5173,https://YOUR-USERNAME.github.io"
# ↑ استبدل YOUR-USERNAME باسم المستخدم الخاص بك على GitHub
```

### Environment Variables (من واجهة Cloudflare)

| المتغير | القيمة | ملاحظات |
|---------|--------|---------|
| `AUTH_TOKEN` | أي نص سري | مثلاً: `my-ai-secret-123` |
| `ALLOWED_ORIGINS` | روابط مسموحة | فاصلة بين كل رابط |
| `OPENAI_API_KEY` | مفتاح OpenAI | اختياري |
| `GEMINI_API_KEY` | مفتاح Gemini | اختياري |

---

## GitHub Worker Template

### wrangler.toml

```toml
name = "my-cyber-guardians-github-proxy"  # ← غيّر الاسم كما تشاء
main = "index.js"
compatibility_date = "2024-01-01"
# account_id يُملأ تلقائياً عند `wrangler login`

[vars]
ALLOWED_ORIGINS = "http://localhost:3001,http://localhost:3002,http://localhost:5173,https://YOUR-USERNAME.github.io"
# ↑ استبدل YOUR-USERNAME باسم المستخدم الخاص بك على GitHub
```

### Environment Variables (من واجهة Cloudflare)

| المتغير | القيمة | ملاحظات |
|---------|--------|---------|
| `AUTH_TOKEN` | أي نص سري | مثلاً: `my-gh-secret-456` |
| `ALLOWED_ORIGINS` | روابط مسموحة | فاصلة بين كل رابط |
| `GITHUB_TOKEN` | توكن GitHub | يبدأ بـ `ghp_` |

---

## 📝 خطوات الإعداد

### 1. تسجيل الدخول إلى Cloudflare
```bash
npx wrangler login
```

### 2. إنشاء Worker
```bash
# للأول (AI)
cd worker
npx wrangler deploy

# للثاني (GitHub)
cd worker-github
npx wrangler deploy
```

### 3. إعداد المتغيرات من واجهة Cloudflare
1. اذهب إلى: https://dash.cloudflare.com
2. Workers & Pages → اختر Worker → Settings → Variables
3. أضف المتغيرات المطلوبة

---

## ⚠️ ملاحظات مهمة

1. **لا ترفع `wrangler.toml` إلى GitHub** — يحتوي على معلومات حسابك
2. **استخدم Environment Variables** من واجهة Cloudflare بدلاً من `wrangler.toml`
3. **ALLOWED_ORIGINS** يجب أن يحتوي على رابط اللعبة + `localhost`

---

> **آخر تحديث:** 2026-06-16
