# دليل الجهة المحلية — CyberGuard Agent

> الإصدار: **2.0.0** (آخر تحديث: 2026-06-23)
> نظام الأدوات المتعدد: Aider + Cline + Agent مخصص

---

## 1. مقدمة

### ما هي الجهة المحلية

الجهة المحلية (CyberGuard Agent) هي خادم خفيف يعمل على جهازك المحلي ويتفاعل مع لعبة Cyber Guardians عبر بروتوكول WebSocket. توفر هذه الجهة واجهة برمجية تتيح لمحرك اللعبة تنفيذ عمليات أمنية متقدمة مثل الفحص الساكن، واكتشاف الثغرات، وفحص العقود الذكية، والبحث عن مهارات جديدة.

**القدرات الجديدة في الإصدار 2.0.0:**
- **نظام أداة متعدد** — Aider (أولوية), Cline, Agent مخصص مع تراجع تلقائي
- **مقدمات AI متعددة** — Gemini, Ollama, Groq, HuggingFace, OpenRouter مع تراجع تلقائي
- **عمليات الملفات** — 8 عمليات: قراءة، كتابة، قائمة، حذف، نقل، إنشاء مجلد، فحص، بحث
- **بحث المحتوى (grep)** — بحث في محتوى الملفات باستخدام أنماط regex
- **Docker** — دعم كامل للحاويات مع docker-compose
- **كلتا الذكاءين م 연결تان** — طالب وهيئة تدريس يمكنهما استخدام الوكيل

### لماذا تحتاجها

- **تكامل مباشر:** تربط بين اللعبة وأدوات الأمن السيبراني الحقيقية
- **أداء أفضل:** المعالجة تتم محلياً بدلاً من الخوادم البعيدة
- **خصوصية:** البيانات لا تغادر جهازك إلا عند الضرورة
- **توسعية:** يمكنك إضافة أدوات مخصصة ومهارات جديدة بسهولة
- **تعليمية:** تتيح للمستخدمين تعلم أدوات الأمن الحقيقي أثناء اللعب
- **نظام أداة متعدد:** Aider → Cline → Agent مخصص مع تراجع تلقائي
- **كلتا الذكاءين:** طالب وهيئة تدريس يمكنهما استخدام الوكيل

### كيف تعمل (WebSocket ↔ اللعبة)

```
┌──────────────┐       WebSocket        ┌──────────────────┐
│  لعبة Cyber  │ ◄─────────────────────► │  CyberGuard      │
│  Guardians   │   ws://localhost:3002   │  Agent (محلي)    │
└──────────────┘                         └────────┬─────────┘
                                                   │
                               ┌─────────────────────┼─────────────────────┐
                               │                     │                     │
                     ┌─────────▼─────────┐  ┌───────▼───────┐  ┌─────────▼─────────┐
                     │  أدوات الفحص      │  │  مقدمات AI    │  │  نظام الأدوات     │
                     │  semgrep / codeql │  │  Gemini/Ollama│  │  Aider (أولوية)   │
                     │  slither / fuzzer │  │  Groq/HF      │  │  Cline (بديل)     │
                     │                   │  │               │  │  Agent مخصص       │
                     └───────────────────┘  └───────────────┘  └───────────────────┘
```

تتصل اللعبة بالجهة المحلية عبر WebSocket على المنفذ المحدد. تُرسل اللعبة طلبات بالصيغة المحددة `{id, type, payload}`، وتستجيب الجهة المحلية بالنتائج `{id, status, result/error}`.

---

## 2. المتطلبات

### أساسية

| المتطلب | الحد الأدنى | ملاحظات |
|----------|------------|---------|
| Node.js | >= 18 | يُفضل استخدام الإصدار LTS |
| npm | >= 9 | يأتي مع Node.js |
| نظام التشغيل | Windows / macOS / Linux | أي نظام حديث |

### أدوات اختيارية (للقدرات المتقدمة)

| الأداة | الاستخدام | طريقة التثبيت |
|--------|-----------|---------------|
| **Aider** | أداة CLI للبرمجة بالذكاء الاصطناعي (أولوية) | `pip install aider-chat` |
| **Cline** | أداة CLI بديلة للبرمجة | `npm install -g @anthropic-ai/cline` |
| **Semgrep** | تحليل أمني ساكن | `pip install semgrep` |
| **CodeQL** | تحليل تدفق البيانات | [GitHub CodeQL](https://github.com/github/codeql-cli-binaries) |
| **Slither** | فحص عقود Solidity | `pip install slither-analyzer` |
| **Docker** | عزل التنفيذ | [docker.com](https://www.docker.com/) |
| **Clang/Clang++** | Fuzzing وcompilation | `apt install clang` أو عبر حزم النظام |

### التحقق من المتطلبات

```bash
# التحقق من Node.js
node --version    # يجب أن يكون >= 18

# التحقق من npm
npm --version

# التحقق من Docker (اختياري)
docker --version

# التحقق من Semgrep (اختياري)
semgrep --version

# التحقق من Slither (اختياري)
slither --version
```

---

## 3. التثبيت

### خطوات التثبيت الأساسية

```bash
# الانتقال إلى مجلد الجهة المحلية
cd cyberguard-agent

# تثبيت التبعيات
npm install

# ربط الأمر بالنظام (make it global)
npm link
```

### التحقق من التثبيت

```bash
# يجب أن يعرض رسالة تأكيد
cyberguard-agent --version

# أو
cyberguard-agent --help
```

### إلغاء التثبيت (عند الحاجة)

```bash
cd cyberguard-agent
npm unlink -g
```

---

## 4. التشغيل

> ⚠️ **مهم جداً:** يجب تشغيل جميع الأوامر من مجلد الجهة المحلية فقط!

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📍 أولاً: انتقل إلى مجلد الجهة المحلية
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd cyber-guardians-mobile/cyberguard-agent

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ▶️ ثانياً: شغّل الجهة
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
npm start
```

### الحد الأدنى

```bash
cd cyber-guardians-mobile/cyberguard-agent
npm start
```

يُشغّل الجهة على المنفذ الافتراضي `3001` بدون أي إعدادات إضافية.

### الإعداد الكامل

```bash
cd cyber-guardians-mobile/cyberguard-agent
npm start -- --profile full
```

يُفعّل جميع الأدوات والقدرات مع 3 عمليات متزامنة وذاكرة مؤقتة لمدة ساعتين.

### مخصص

```bash
cd cyber-guardians-mobile/cyberguard-agent
npm start -- --port 3001 --token mytoken --verbose
```

| المعامل | الوصف | القيمة الافتراضية |
|---------|-------|-------------------|
| `--port` | رقم المنفذ | `3001` |
| `--token` | رمز المصادقة | بدون (إذا حُدد، يُطلب عند كل اتصال) |
| `--profile` | ملف الإعداد | `minimal` |
| `--verbose` | وضع تفصيلي | `false` |

### أوامر أخرى

```bash
# من مجلد الجهة المحلية فقط!
cd cyber-guardians-mobile/cyberguard-agent

# عرض حالة الخادم
node bin/cyberguard-agent status

# عرض الإعدادات الحالية
node bin/cyberguard-agent tools

# عرض المساعدة
node bin/cyberguard-agent help
```

---

## 5. الإعدادات (3 ملفات)

### 5.1. minimal — الإعداد الأدنى

| الإعداد | القيمة |
|---------|--------|
| عدد العمليات المتزامنة | 1 |
| Sandbox | غير مفعّل |
| Docker | غير مستخدم |
| الذاكرة المؤقتة | بدون |
| الاستخدام المُوصى به | بيئة التطوير والاختبار السريع |

**مميزاته:**
- أسرع وقت بدء تشغيل
- أقل استهلاك للموارد
- مناسب للأجهزة ذات الموارد المحدودة

**المحددات:**
- لا يدعم العزل الآمن للتنفيذ
- لا يدعم عمليات الفحص المتزامنة

### 5.2. full — الإعداد الكامل

| الإعداد | القيمة |
|---------|--------|
| عدد العمليات المتزامنة | 3 |
| Sandbox | مفعّل |
| Docker | بديل عند توفره |
| الذاكرة المؤقتة | ساعتان (7200 ثانية) |
| الاستخدام المُوصى به | بيئة الإنتاج |

**مميزاته:**
- أداء عالي مع العمليات المتزامنة
- عزل آمن عبر Sandbox وDocker
- ذاكرة مؤقتة لتقليل إعادة الفحص
- دعم كامل لجميع الأدوات

**المحددات:**
- يحتاج موارد نظام أعلى
- وقت بدء تشغيل أطول

### 5.3. education — الإعداد التعليمي

| الإعداد | القيمة |
|---------|--------|
| عدد العمليات المتزامنة | 1 |
| Sandbox | مفعّل |
| Docker | غير مستخدم |
| الذاكرة المؤقتة | 30 دقيقة |
| الاستخدام المُوصى به | التعلم والتعليم |

**مميزاته:**
- عزل آمن للمستخدمين المبتدئين
- ذاكرة مؤقتة قصيرة لعرض النتائج بشكل متكرر
- مناسب للبيئات التعليمية والمعامل

**المحددات:**
- أداء أقل من الإعداد الكامل
- لا يدعم Docker

---

## 6. الأدوات المدمجة

### 6.1. Semgrep — الفحص الساكن

```bash
# الاستخدام المباشر
cyberguard-agent scan --tool semgrep --target ./src

# عبر WebSocket
{ "type": "scan", "payload": { "tool": "semgrep", "target": "./src" } }
```

- **الوظيفة:** فحص Static Analysis للتحقق من أمن الكود
- **اللغات المدعومة:** 30+ لغة برمجة (Python, JavaScript, Java, Go, Ruby, C/C++, و غيرها)
- **الإخراج:** SARIF output — منسق قياسي لنتائج التحليل
- **المميزات:**
  - اكتشاف ثغرات أمنية معروفة
  - قواعد مخصصة قابلة للتخصيص
  - تكامل مع CI/CD
  - دعم تحليل مقارن بين الإصدارات

### 6.2. CodeQL — تحليل تدفق البيانات

```bash
# الاستخدام المباشر
cyberguard-agent scan --tool codeql --target ./src

# عبر WebSocket
{ "type": "scan", "payload": { "tool": "codeql", "target": "./src" } }
```

- **الوظيفة:** تحليل تدفق البيانات لاكتشاف الثغرات المعقدة
- **المصدر:** GitHub CodeQL Queries
- **الموارد المطلوبة:** CodeQL CLI يجب أن يكون مثبتاً
- **المميزات:**
  - تحليل بين الدوال والملفات
  - اكتشاف ثغرات تعتمد على تدفق البيانات
  - قواعد GitHub الرسمية
  - إمكانية كتابة استعلامات مخصصة

### 6.3. Slither — فحص العقود الذكية

```bash
# الاستخدام المباشر
cyberguard-agent scan --tool slither --target ./contracts

# عبر WebSocket
{ "type": "scan", "payload": { "tool": "slither", "target": "./contracts" } }
```

- **الوظيفة:** تحليل عقود Ethereum الذكية المكتوبة بلغة Solidity
- **الموارد المطلوبة:** slither-analyzer (Python) و Solidity compiler
- **المميزات:**
  - اكتشاف ثغرات Reentrancy
  - اكتشاف مشاكل التعامل مع الأرقام
  - فحص أنماط الوصول
  - تحليل التبعيات بين العقود

### 6.4. LibFuzzer — Fuzzing

```bash
# الاستخدام المباشر
cyberguard-agent fuzz --target ./src --duration 60

# عبر WebSocket
{ "type": "execute", "payload": { "tool": "libfuzzer", "target": "./src", "duration": 60 } }
```

- **الوظيفة:** Fuzzing لتوليد مدخلات عشوائية واكتشاف أخطاء التشغيل
- **الموارد المطلوبة:** Clang/Clang++ compiler
- **المميزات:**
  - إنشاء harness تلقائياً
  - كشف crashes و memory leaks
  - تغطية الكود (coverage-guided)
  - دعم جميع اللغات التي تُترجم عبر Clang

### 6.5. Skills Discovery — اكتشاف المهارات

```bash
# البحث عن مهارات متاحة
npx skills search "security"

# تثبيت مهارة
npx skills install skill-name

# عرض المهارات المثبتة
npx skills list
```

- **الوظيفة:** اكتشاف وتثبيت مهارات جديدة لتوسيع قدرات الجهة المحلية
- **المميزات:**
  - بحث في مستودع المهارات
  - تثبيت وتحديث بضغطة واحدة
  - إدارة الإصدارات
  - معاينة المهارات قبل التثبيت

### 6.6. مقدمات AI المتعددة

الجهة المحلية تدعم 5 مقدمات AI مع واجهة موحدة و FALLBACK تلقائي:

| المزود | الميزة الرئيسية | المفتاح | الحد المجاني |
|--------|-----------------|---------|--------------|
| **Gemini** | المزود الافتراضي | `GEMINI_API_KEY` | 1500 طلب/يوم |
| **Ollama** | يعمل محلياً | لا يحتاج مفتاح | غير محدود |
| **Groq** | سرعة عالية | `GROQ_API_KEY` | 30 طلب/دقيقة |
| **HuggingFace** | موديلات متنوعة | `HUGGINGFACE_API_KEY` | 1000 طلب/يوم |
| **OpenRouter** | وصول لموديلات متعددة | `OPENROUTER_API_KEY` | حسب الموديل |

#### إعداد مفاتيح API

> ⚠️ **مهم:** يجب تشغيل هذه الأوامر من مجلد الجهة المحلية فقط!

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📍 أولاً: انتقل إلى مجلد الجهة المحلية
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd cyber-guardians-mobile/cyberguard-agent

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔑 ثانياً: احصل على مفتاح API (اختر واحداً)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# --- Gemini (مجاني - Google AI Studio) ---
# 1. افتح: https://aistudio.google.com/apikey
# 2. اضغط "Create API Key"
# 3. انسخ المفتاح
export GEMINI_API_KEY="AIzaSy..."

# --- Groq (مجاني - سريع جداً) ---
# 1. افتح: https://console.groq.com/keys
# 2. اضغط "Create API Key"
# 3. انسخ المفتاح
export GROQ_API_KEY="gsk_..."

# --- HuggingFace (مجاني) ---
# 1. افتح: https://huggingface.co/settings/tokens
# 2. اضغط "New token"
# 3. انسخ التوكن
export HUGGINGFACE_API_KEY="hf_..."

# --- OpenRouter (مجاني) ---
# 1. افتح: https://openrouter.ai/keys
# 2. اضغط "Create Key"
# 3. انسخ المفتاح
export OPENROUTER_API_KEY="sk-or-..."

# --- Ollama (مجاني - محلي) ---
# لا يحتاج مفتاح! يجب تثبيته أولاً:
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
ollama serve

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ▶️ ثالثاً: شغّل الجهة المحلية
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
npm start
```

> 💡 **نصيحة:** لجعل المفاتيح تدوم بعد إغلاق Terminal، أضفها إلى `~/.bashrc` أو `~/.zshrc`:
> ```bash
> echo 'export GEMINI_API_KEY="your-key"' >> ~/.bashrc
> source ~/.bashrc
> ```

> ⚠️ **لا تضع مفاتيح API في ملف `.env` داخل المشروع!** لأنها قد تُرفع عن طريق الخطأ إلى GitHub.

#### إضافة نماذج جديدة

```bash
# الملف: src/ai/providers.ts

# --- Gemini (سطر 31) ---
models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash']

# --- Groq (سطر 144) ---
models = ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it']

# --- HuggingFace (سطر 197) ---
models = ['meta-llama/Llama-3-70B-Instruct', 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'google/gemma-7b-it']

# --- OpenRouter (سطر 255) ---
models = ['meta-llama/llama-3-70b-instruct', 'mistralai/mixtral-8x7b-instruct', 'google/gemma-7b-it:free']
```

**مثال — إضافة نموذج جديد لـ Groq:**

```typescript
// غيّر سطر 144 من:
models = ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it']

// إلى:
models = ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it', 'llama-3.3-70b-versatile']
```

#### إضافة مزود جديد بالكامل

**الخطوة 1: أضف كلاس في `src/ai/providers.ts`:**

```typescript
export class MyNewProvider implements AIProvider {
  name = 'mynewprovider'
  type = 'cloud' as const
  models = ['model-1', 'model-2']
  private apiKey: string
  private baseUrl = 'https://api.mynewprovider.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`MyNewProvider error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'mynewprovider',
      usage: data.usage
    }
  }
}
```

**الخطوة 2: سجّله في `src/server.ts` (بعد سطر 368):**

```typescript
if (config.mynewproviderKey) {
  aiManager.registerProvider(new MyNewProvider(config.mynewproviderKey))
  log('AI: MyNewProvider provider registered')
}
```

**الخطوة 3: أضف المفتاح في `src/config.ts` (بعد سطر 55):**

```typescript
mynewproviderKey: overrides.mynewproviderKey || process.env.MYNEWPROVIDER_API_KEY || '',
```

**الخطوة 4: عيّن متغير البيئة:**

```bash
export MYNEWPROVIDER_API_KEY="your-key"
```

**الخطوة 5: أعد تشغيل الجهة:**

```bash
npm start
```

#### استخدام AI عبر WebSocket

```javascript
// إرسال رسالة AI
ws.send(JSON.stringify({
  id: 'ai-001',
  type: 'ai-chat',
  payload: {
    message: 'اشرح لي什么是SQL injection',
    provider: 'gemini'  // أو 'ollama', 'groq', 'huggingface', 'openrouter'
  }
}));

// استجابة
{
  "id": "ai-001",
  "status": "complete",
  "result": {
    "response": "SQL injection هو...",
    "provider": "gemini",
    "model": "gemini-3.5-flash"
  }
}
```

#### الفصل التلقائي (Fallback)

إذا فشل المزود الحالي، يحاول المزود التالي تلقائياً:
1. المزود النشط (Gemini افتراضياً)
2. المزودات الأخرى حسب التوفر

### 6.7. عمليات الملفات

```javascript
// قراءة ملف
{ "type": "file-op", "payload": { "operation": "read", "path": "/path/to/file.ts" } }

// كتابة ملف
{ "type": "file-op", "payload": { "operation": "write", "path": "/path/to/file.ts", "content": "..." } }

// سرد ملفات
{ "type": "file-op", "payload": { "operation": "list", "path": "/path/to/dir" } }

// حذف ملف
{ "type": "file-op", "payload": { "operation": "delete", "path": "/path/to/file.ts" } }

// نقل/إعادة تسمية
{ "type": "file-op", "payload": { "operation": "move", "source": "/old/path", "destination": "/new/path" } }

// إنشاء مجلد
{ "type": "file-op", "payload": { "operation": "mkdir", "path": "/path/to/new/dir" } }

// فحص وجود ملف
{ "type": "file-op", "payload": { "operation": "exists", "path": "/path/to/file.ts" } }

// بحث في أسماء الملفات
{ "type": "file-op", "payload": { "operation": "search", "path": "/path/to/dir", "pattern": "*.ts" } }
```

### 6.8. بحث المحتوى (grep)

```javascript
// بحث في محتوى الملفات باستخدام regex
{ "type": "grep", "payload": { "pattern": "function\\s+\\w+", "path": "./src", "include": "*.ts" } }

// استجابة
{
  "id": "grep-001",
  "status": "complete",
  "result": {
    "matches": [
      { "file": "src/app.ts", "line": 10, "content": "function main() {" },
      { "file": "src/utils.ts", "line": 25, "content": "function helper() {" }
    ],
    "total": 2
  }
}
```

### 6.9. تكامل OpenCode

OpenCode هو أداة AI لكتابة الكود. الجهة المحلية تتكامل معها:

```javascript
// فحص حالة OpenCode Desktop
{ "type": "opencode-status", "payload": {} }

// سرد جلسات OpenCode
{ "type": "opencode-sessions", "payload": {} }

// تشغيل OpenCode agent
{ "type": "opencode", "payload": { "command": "اكتب دالة لحساب المضروب" } }

// تشغيل تطبيق سطح مكتب OpenCode
{ "type": "opencode-launch", "payload": {} }
```

**ملاحظات:**
- OpenCode CLI قد يواجه مشاكل في بعض الإصدارات — تطبيق سطح المكتب يعمل بشكل أفضل
- مهلة التنفيذ: 300 ثانية (5 دقائق)
- النموذج: `provider/model` (مثل: `google/gemini-2.0-flash`)

---

## 7. البروتوكول (WebSocket)

### الاتصال

```
ws://localhost:3002
```

### هيكل الرسائل

#### الطلب (من اللعبة إلى الجهة المحلية)

```json
{
  "id": "unique-request-id-123",
  "type": "scan",
  "payload": {
    "tool": "semgrep",
    "target": "./src",
    "options": {}
  }
}
```

#### الاستجابة (من الجهة المحلية إلى اللعبة)

```json
{
  "id": "unique-request-id-123",
  "status": "success",
  "result": {
    "findings": [],
    "summary": { "total": 0, "critical": 0 }
  }
}
```

#### رسالة خطأ

```json
{
  "id": "unique-request-id-123",
  "status": "error",
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "semgrep is not installed"
  }
}
```

### أنواع الرسائل (19 Message Types)

| # | النوع | الوصف | الحمولة المطلوبة |
|---|-------|-------|------------------|
| 1 | `scan` | فحص أمني ساكن | `tool`, `target`, `options` |
| 2 | `execute` | تنفيذ أداة محددة | `tool`, `target`, `duration` |
| 3 | `find-skills` | البحث عن مهارات | `query` |
| 4 | `install-skill` | تثبيت مهارة | `skillName`, `version` |
| 5 | `status` | الحالة الحالية | — (فارغة) |
| 6 | `tools` | عرض الأدوات المتاحة | — (فارغة) |
| 7 | `parse-file` | تحليل ملف محدد | `filePath`, `language` |
| 8 | `list-installs` | سرد المهارات المثبتة عالمياً | — (فارغة) |
| 9 | `ai-chat` | إرسال رسالة AI | `message`, `provider` |
| 10 | `file-op` | عمليات الملفات | `operation`, `path`, `content` |
| 11 | `grep` | بحث المحتوى | `pattern`, `path`, `include` |
| 12 | `ai-providers` | سرد مقدمات AI المتاحة | — (فارغة) |
| 13 | `task` | تنفيذ مهمة معقدة | `task`, `settings` |
| 14 | `tool-status` | فحص حالة الأدوات | — (فارغة) |
| 15 | `tool-settings` | حفظ/تحميل إعدادات الأدوات | `settings` |
| 16 | `install` | تثبيت حزمة (pip/npm/apt) | `package`, `manager` |

### مثال عملي على الاتصال

```javascript
// JavaScript — الاتصال بالجهة المحلية
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3002');

ws.on('open', () => {
  // إرسال طلب فحص
  ws.send(JSON.stringify({
    id: 'req-001',
    type: 'scan',
    payload: {
      tool: 'semgrep',
      target: './src',
      options: { severity: 'high' }
    }
  }));

  // إرسال رسالة AI
  ws.send(JSON.stringify({
    id: 'ai-001',
    type: 'ai-chat',
    payload: {
      message: 'اشرح لي什么是SQL injection',
      provider: 'gemini'
    }
  }));

  // قراءة ملف
  ws.send(JSON.stringify({
    id: 'file-001',
    type: 'file-op',
    payload: {
      operation: 'read',
      path: './src/app.ts'
    }
  }));

  // بحث في محتوى الملفات
  ws.send(JSON.stringify({
    id: 'grep-001',
    type: 'grep',
    payload: {
      pattern: 'function\\s+\\w+',
      path: './src',
      include: '*.ts'
    }
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  if (response.status === 'success' || response.status === 'complete') {
    console.log('النتيجة:', response.result);
  } else {
    console.error('خطأ:', response.error);
  }
});
```

---

## 8. الأمان

### 8.1. مصادقة Token

عند تمرير معامل `--token` عند التشغيل، يُطلب رمز المصادقة في كل اتصال WebSocket:

```bash
# تشغيل مع مصادقة
cyberguard-agent start --token my-secret-token

# الاتصال يتطلب الرمز
ws://localhost:3002?token=my-secret-token
```

**القواعد:**
- الرمز يُخزّن بشكل آمن في الذاكرة
- لا يُسجل في ملفات السجل
- يُرسل عبر WebSocket فقط (ليس عبر HTTP)
- يمكن تغييره عند إعادة التشغيل
- **ملاحظة:** الرمز اختياري — إذا لم يُحدد، لا تُطلب مصادقة

### 8.2. عزل Sandbox

عند تفعيل Sandbox (في إعدادات `full` أو `education`):

- تُنفذ الأدوات في بيئة معزولة
- لا يمكن للأدوات الوصول للملفات خارج مجلد الهدف
- تقييد الوصول للشبكة حسب الإعدادات
- مراقبة استهلاك الموارد (الذاكرة، المعالج، الوقت)

### 8.3. عزل Docker

عند توفر Docker وفي الإعداد الكامل:

```bash
# يُشغّل الأدوات في حاويات Docker معزولة
cyberguard-agent start --profile full
```

- كل أداة تُنفذ في حاوية منفصلة
- حماية الملفات النظامية
- تقييد الموارد عبر Docker limits
- تنظيف تلقائي بعد الانتهاء

### 8.4. تنظيف الأوامر (Command Sanitization)

الجهة المحلية تقوم بـ:

- **التحقق من صحة مسارات الملفات:** منع الوصول للملفات خارج المجلدات المسموح بها
- **تنقية المدخلات:** إزالة الأحرف الخبيثة من مسارات الملفات والأسماء
- **التحقق من الأدوات:** التأكد من أن الأداة المطلوبة مثبتة وآمنة
- **تحديد المهل الزمنية:** منع التنفيذ اللانهائي
- **تسجيل العمليات:** تسجيل جميع الطلبات للأغراض الأمنية

---

## 9. استكشاف الأخطاء

### 9.1. ملفات السجلات

```bash
# عرض السجلات المباشرة
cyberguard-agent logs

# عرض آخر 100 سطر
cyberguard-agent logs --tail 100

# مراقبة السجلات بشكل مباشر
cyberguard-agent logs --follow
```

**موقع ملفات السجلات:**

| النظام | المسار |
|--------|--------|
| Linux | `~/.cyberguard-agent/logs/agent.log` |
| macOS | `~/Library/Logs/CyberGuardAgent/agent.log` |
| Windows | `%USERPROFILE%\.cyberguard-agent\logs\agent.log` |

### 9.2. أخطاء شائعة وحلولها

#### ❌ `EADDRINUSE: port already in use`

**السبب:** المنفذ المحدد مستخدم من تطبيق آخر.

**الحل:**
```bash
# اكتشاف العملية المشغّلة للمنفذ
lsof -i :3002          # Linux/macOS
netstat -ano | findstr :3002  # Windows

# إيقاف العملية
kill -9 <PID>

# أو استخدم منفذاً مختلفاً
cyberguard-agent start --port 3003
```

#### ❌ `MODULE_NOT_FOUND`

**السبب:** التبعيات غير مثبتة بشكل صحيح.

**الحل:**
```bash
cd cyberguard-agent
rm -rf node_modules
npm install
npm link
```

#### ❌ `WebSocket connection refused`

**السبب:** الخادم غير مشغّل أو العنوان خاطئ.

**الحل:**
```bash
# تأكد من تشغيل الخادم
cyberguard-agent start

# تأكد من العنوان والمنفذ
cyberguard-agent status
```

#### ❌ `Tool not found: semgrep`

**السبب:** الأداة المطلوبة غير مثبتة.

**الحل:**
```bash
# تثبيت Semgrep
pip install semgrep

# أو تثبيت عبر pip3
pip3 install semgrep

# التحقق من التثبيت
semgrep --version
```

#### ❌ `Sandbox permission denied`

**السبب:** الصلاحيات غير كافية لإنشاء بيئة معزولة.

**الحل:**
```bash
# تأكد من صلاحيات التنفيذ
chmod +x cyberguard-agent

# أو شغّل بدون sandbox
cyberguard-agent start --profile minimal
```

#### ❌ `Docker daemon not running`

**السبب:** خدمة Docker غير مشغّلة.

**الحل:**
```bash
# Linux
sudo systemctl start docker

# macOS — افتح تطبيق Docker Desktop

# Windows — افتح Docker Desktop

# أو شغّل بدون Docker
cyberguard-agent start --profile minimal
```

### 9.3. وضع استكشاف الأخطاء التفصيلي

```bash
# تشغيل مع تفاصيل إضافية
cyberguard-agent start --verbose

# أو
DEBUG=cyberguard:* cyberguard-agent start
```

---

## 10. مشاكل معروفة (Known Bugs)

> آخر تدقيق: 2026-06-23 — التقرير الكامل في `AUDIT_REPORT.md`

### حرج (Must Fix)

|المشكلة | الملف | التأثير |
|--------|-------|---------|
| **HuggingFace استجابة خاطئة** | `providers.ts:246,255` | مزود HuggingFace غير وظيفي — يسترجع `generated_text` من نص |
| **حالة AI Fallback** | `providers.ts:349-350` | التراجع التلقائي يغير حالة عامة — الطلبات المتزامنة تتداخل |
| **حقن أوامر Shell** | `opencode.ts:154-158` | هروب الأسطر المفردة فقط — مدخلات خبيثة قد تنفذ أوامر عشوائية |

### متوسط (Should Fix)

|المشكلة | الملف | التأثير |
|--------|-------|---------|
| **grep include غير متصل** | `localAgent.ts:179` | فلتر include في واجهة Grep وهمي |
| **OpenCode أزرار المزود** | `LocalAgentTab.tsx:786` | أزرار المزود تغير الموديل فقط — لا تحدد المزود فعلياً |
| **رمز فارغ** | `LocalAgentTab.tsx:80` | الرمز الفارغ يُعامل كعدم وجود رمز |

### منخفض (Nice to Have)

|المشكلة | الوصف |
|--------|-------|
| `any` types في LocalAgentTab | 12+ حالة lacks type safety |
| إرجاع `Promise<any>` | جميع دوال الجهة تُرجع أي |
| ابتلاع أخطاء صامتة في fileOps | كتل catch فارغة تُخفي أخطاء الصلاحيات |
| `nohup` عبر المنصات | لا يعمل على Windows |

### حلول مقترحة

#### BUG-001/002: إصلاح HuggingFace

```typescript
// الملف: cyberguard-agent/src/ai/providers.ts
// سطر 246: استبدال
const text = (response as any).generated_text || response.choices?.[0]
return text || 'Empty response'
```

#### BUG-003: إصلاح حالة Fallback

```typescript
// الملف: cyberguard-agent/src/ai/providers.ts
// سطر 349-350: استخدام متغير محلي بدلاً من حالة عامة
const fallbackProvider = AIManager.getProviders().find(p => p.available && p.name !== currentProvider?.name)
if (fallbackProvider) {
  // استخدام fallbackProvider محلياً فقط
}
```

#### BUG-004: إصلاح حقن الأوامر

```typescript
// الملف: cyberguard-agent/src/ai/opencode.ts
// استخدام execFile بدلاً من exec لتجنب تفسير Shell
import { execFile } from 'child_process'
const execFileAsync = promisify(execFile)
```

---

## 11. دعم الأنظمة

### 11.1. Windows

#### التشغيل عبر Command Prompt (cmd)

```cmd
cd cyberguard-agent
npm install
npm link
cyberguard-agent start
```

#### التشغيل عبر PowerShell

```powershell
cd cyberguard-agent
npm install
npm link
cyberguard-agent start
```

#### إدارة الحزم

**Chocolatey:**
```powershell
# تثبيت Node.js عبر Chocolatey
choco install nodejs-lts

# تثبيت Docker
choco install docker-desktop
```

**WinGet:**
```powershell
# تثبيت Node.js عبر WinGet
winget install OpenJS.NodeJS.LTS

# تثبيت Docker
winget install Docker.DockerDesktop
```

#### ملاحظات خاصة بـ Windows

- استخدم `start /B` لتشغيل الخادم في الخلفية
- تأكد من أن Windows Defender لا يحجب المنفذ
- استخدم PowerShell 5.1+ أو PowerShell Core 7+

---

### 11.2. macOS

#### التشغيل عبر Bash/Zsh

```bash
cd cyberguard-agent
npm install
npm link
cyberguard-agent start
```

#### إدارة الحزم عبر Homebrew

```bash
# تثبيت Node.js
brew install node

# تثبيت Docker
brew install --cask docker

# تثبيت Python (لـ Semgrep و Slither)
brew install python

# تثبيت Semgrep
pip3 install semgrep
```

#### ملاحظات خاصة بـ macOS

- يُنصح باستخدام Homebrew لإدارة الحزم
- على Apple Silicon (M1/M2)، تأكد من استخدام Node.js المتوافق مع ARM
- قد تحتاج لإذن `chmod +x` للملفات التنفيذية

---

### 11.3. Linux

#### Debian/Ubuntu (apt)

```bash
# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت Docker
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
sudo usermod -aG docker $USER

# تثبيت Python و Semgrep
sudo apt-get install python3 python3-pip
pip3 install semgrep

# تشغيل الجهة المحلية
cd cyberguard-agent
npm install
npm link
cyberguard-agent start
```

#### RHEL/CentOS/Fedora (yum)

```bash
# تثبيت Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# تثبيت Docker
sudo yum install docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# تثبيت Python و Semgrep
sudo yum install python3 python3-pip
pip3 install semgrep

# تشغيل الجهة المحلية
cd cyberguard-agent
npm install
npm link
cyberguard-agent start
```

#### Arch Linux (pacman)

```bash
# تثبيت Node.js
sudo pacman -S nodejs npm

# تثبيت Docker
sudo pacman -S docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# تثبيت Python و Semgrep
sudo pacman -S python python-pip
pip install semgrep

# تشغيل الجهة المحلية
cd cyberguard-agent
npm install
npm link
cyberguard-agent start
```

#### ملاحظات خاصة بـ Linux

- تأكد من إضافة مستخدمك لمجموعة `docker` لتشغيل Docker بدون `sudo`
- على بعض التوزيعات، قد تحتاج لتثبيت `build-essential` ل-compilation
- استخدم `systemd` لإعداد الجهة المحلية كخدمة تبدأ مع النظام:

```bash
# إنشاء ملف systemd service
sudo tee /etc/systemd/system/cyberguard-agent.service > /dev/null <<EOF
[Unit]
Description=CyberGuard Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/cyberguard-agent
ExecStart=$(which cyberguard-agent) start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# تفعيل وتشغيل الخدمة
sudo systemctl daemon-reload
sudo systemctl enable cyberguard-agent
sudo systemctl start cyberguard-agent

# عرض الحالة
sudo systemctl status cyberguard-agent
```

---

## 10. Docker Support

### 10.1. تشغيل Agent بـ Docker

```bash
# بناء صورة Docker
cd cyberguard-agent
docker build -t cyberguard-agent .

# تشغيل Agent
docker run -d \
  --name cyberguard-agent \
  -p 3001:3001 \
  -v agent-data:/data \
  -e GEMINI_API_KEY=your-api-key \
  cyberguard-agent

# عرض السجلات
docker logs -f cyberguard-agent

# إيقاف وحذف
docker stop cyberguard-agent
docker rm cyberguard-agent
```

### 10.2. تشغيل مع Frontend (Docker Compose)

```bash
# إعداد ملف .env
cp .env.example .env
nano .env  # أدخل مفاتيح AI

# تشغيل كل شيء
docker-compose up -d

# عرض السجلات
docker-compose logs -f

# عرض سجلات Agent فقط
docker-compose logs -f agent

# عرض سجلات Frontend فقط
docker-compose logs -f frontend

# إعادة تشغيل Agent
docker-compose restart agent

# إيقاف كل شيء
docker-compose down

# حذف كل شيء (بما في ذلك البيانات)
docker-compose down -v
```

### 10.3. إعداد مفاتيح AI

```bash
# الطريقة 1: عبر ملف .env
echo 'GEMINI_API_KEY=your-key-here' >> .env

# الطريقة 2: عبر environment variables
export GEMINI_API_KEY=your-key-here
docker-compose up -d

# الطريقة 3: عبر docker run
docker run -d \
  -e GEMINI_API_KEY=your-key-here \
  -e GROQ_API_KEY=your-key-here \
  -p 3001:3001 \
  cyberguard-agent
```

### 10.4. إعدادات Docker

| الإعداد | القيمة | الوصف |
|---------|--------|-------|
| `GEMINI_API_KEY` | optional | مفتاح Gemini API (المزود الافتراضي) |
| `GROQ_API_KEY` | optional | مفتاح Groq API (سريع جداً) |
| `HUGGINGFACE_API_KEY` | optional | مفتاح HuggingFace API |
| `OPENROUTER_API_KEY` | optional | مفتاح OpenRouter API |
| `AGENT_PORT` | 3001 | منفذ الخادم |
| `AGENT_TOKEN` | optional | مفتاح المصادقة |
| `AGENT_PROFILE` | full | الإعدادات: minimal/full/education |
| `AGENT_VERBOSE` | false | السجلات التفصيلية |

### 10.5. مزايا Docker

| الميزة | الوصف |
|--------|-------|
| **عزل بيئي** | كل خدمة في حاوية منفصلة |
| **سهولة النشر** | أمر واحد لتشغيل كل شيء |
| **تكرار الإنتاج** | نفس البيئة على كل الأجهزة |
| **الصيانة** | تحديث وتطبيق بسهولة |
| **البيانات** | محفوظة في Docker volumes |
| **Health Check** | مراقبة صحة الخدمات تلقائياً |
| **Auto-restart** | إعادة تشغيل تلقائية عند التعطل |

### 10.6. توافق Docker مع نظام الأدوات المتعدد

| المكون | الحالة | ملاحظات |
|--------|--------|---------|
| **Agent Core** | ✅ مدعوم بالكامل | جميع الوظائف تعمل |
| **AI Providers** | ✅ مدعوم بالكامل | Gemini, Groq, HuggingFace, OpenRouter |
| **File Operations** | ✅ مدعوم بالكامل | 8 عمليات ملفات |
| **Grep Search** | ✅ مدعوم بالكامل | بحث في محتوى الملفات |
| **Multi-Tool System** | ✅ مدعوم بالكامل | Aider, Cline, Agent مخصص |
| **Skills Discovery** | ✅ مدعوم بالكامل | npx skills |
| **Security Tools** | ✅ مدعوم بالكامل | Semgrep, CodeQL, Slither |

### 10.7. مقارنة Docker vs npm

| الميزة | Docker | npm |
|--------|--------|-----|
| **التثبيت** | `docker-compose up -d` | `npm install -g` |
| **العزل** | ✅ حاوية منفصلة | ❌ يتشارك النظام |
| **الصيانة** | سهلة (docker pull) | متوسطة (npm update) |
| **الأداء** | أبطأ قليلاً | أسرع |
| **الذاكرة** | يستخدم المزيد | يستخدم أقل |
| **التوافق** | Linux فقط | جميع الأنظمة |
| **OpenCode Desktop** | ❌ | ✅ |
| **الإنتاج** | ✅ مُوصى به | ⚠️ للتطوير فقط |

### 10.8. استكشاف الأخطاء

```bash
# فحص حالة الحاويات
docker-compose ps

# عرض السجلات
docker-compose logs agent

# الدخول إلى حاوية Agent
docker-compose exec agent sh

# فحص الاتصال بالـ API
curl http://localhost:3001/health

# إعادة بناء الصور
docker-compose build --no-cache

# مسح الصور القديمة
docker image prune -a
```

---

## مرجع سريع

| الأمر | الوصف |
|-------|-------|
| `cyberguard-agent start` | تشغيل الجهة المحلية |
| `cyberguard-agent start --profile full` | تشغيل بالإعداد الكامل |
| `cyberguard-agent start --port 3002` | تشغيل على منفذ محدد |
| `cyberguard-agent stop` | إيقاف الجهة المحلية |
| `cyberguard-agent status` | عرض الحالة الحالية |
| `cyberguard-agent config` | عرض الإعدادات |
| `cyberguard-agent logs` | عرض السجلات |
| `cyberguard-agent logs --follow` | مراقبة السجلات مباشرة |
| `npx skills search "term"` | البحث عن مهارات |
| `npx skills install name` | تثبيت مهارة |
| `npx skills list -g` | سرد المهارات المثبتة عالمياً |

---

> **تُحديث آخر:** يونيو 2026
> **الإصدار:** 1.2.2
> **المطور:** Cyber Guardians Team
