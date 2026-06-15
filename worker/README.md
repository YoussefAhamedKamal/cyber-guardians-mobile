# Cloudflare Worker — AI API Proxy

## لماذا؟
يُمرّر طلبات AI عبر Cloudflare Worker بدلاً من إرسالها مباشرة من المتصفح.
هذا يمنع XSS من سرقة API keys.

## الإعداد (مرة واحدة)

### 1. تفعيل Workers
1. افتح [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اذهب إلى `Workers & Pages`
3. أنشئ تطبيق جديد → `Create Worker`
4. اختر اسم مثل `cyber-guardians-proxy`

### 2. إعداد GitHub Actions (الرفع التلقائي)
```bash
# 1. احصل على Cloudflare API Token
#    Cloudflare Dashboard → My Profile → API Tokens → Create Token
#    الصلاحيات المطلوبة: Workers Scripts (Edit)

# 2. احصل على Account ID
#    Cloudflare Dashboard →Workers & Pages →Overview → يمين الصفحة

# 3. أضف Secrets في GitHub
#    Repository → Settings → Secrets and variables → Actions → New repository secret
#    أضف:
#      CLOUDFLARE_API_TOKEN = your-api-token
```

### 3. تعديل Account ID في wrangler.toml
```toml
# worker/wrangler.toml
account_id = "your-account-id"  # أضفه يدوياً أو عبر GitHub Secret
```

### 4. في التطبيق
اذهب إلى Settings → AI → Worker Proxy:
- حدّث رابط Worker: `https://cyber-guardians-proxy.your-subdomain.workers.dev`
- حدّث AUTH_TOKEN: `cg-proxy-xxxxxxxx`

## كيف يعمل
```
المتصفح → Worker (يضيف API key) → OpenAI/Gemini/etc
              ↑
         API key مخزنة كـ environment variable
         لا تصل أبداً للمتصفح
```

## الرفع التلقائي
- عند تعديل أي ملف في `worker/` → GitHub Actions يرفع Worker تلقائياً
- لا يحتاج أمر يدوي بعد الإعداد الأولي

## ملاحظات
- Worker مجاني حتى 100,000 طلب/يوم
- لا يحتاج Cloudflare paid plan
- AUTH_TOKEN يُخبّأ في Worker — لا يظهر في الكود
