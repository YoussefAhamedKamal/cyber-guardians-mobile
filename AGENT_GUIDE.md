# دليل الجهة المحلية — CyberGuard Agent

> الإصدار: **1.2.2** (آخر تحديث: 2026-06-23)
> تقرير التدقيق: `AUDIT_REPORT.md` — 13 مشكلة مكتشفة، 10 تم حلها

---

## 1. مقدمة

### ما هي الجهة المحلية

الجهة المحلية (CyberGuard Agent) هي خادم خفيف يعمل على جهازك المحلي ويتفاعل مع لعبة Cyber Guardians عبر بروتوكول WebSocket. توفر هذه الجهة واجهة برمجية تتيح لمحرك اللعبة تنفيذ عمليات أمنية متقدمة مثل الفحص الساكن، واكتشاف الثغرات، وفحص العقود الذكية، والبحث عن مهارات جديدة.

**القدرات الجديدة في الإصدار 1.2.2:**
- **مقدمات AI متعددة** — Gemini, Ollama, Groq, HuggingFace, OpenRouter مع تراجع تلقائي
- **عمليات الملفات** — 8 عمليات: قراءة، كتابة، قائمة، حذف، نقل، إنشاء مجلد، فحص، بحث
- **بحث المحتوى (grep)** — بحث في محتوى الملفات باستخدام أنماط regex
- **تكامل OpenCode** — تشغيل تطبيق سطح مكتب OpenCode وسرد الجلسات
- **Docker** — دعم كامل للحاويات مع docker-compose
- **إصلاحات الأمان** — إصلاح ثغرات التدقيق (shell injection, race condition, etc.)

### لماذا تحتاجها

- **تكامل مباشر:** تربط بين اللعبة وأدوات الأمن السيبراني الحقيقية
- **أداء أفضل:** المعالجة تتم محلياً بدلاً من الخوادم البعيدة
- **خصوصية:** البيانات لا تغادر جهازك إلا عند الضرورة
- **توسعية:** يمكنك إضافة أدوات مخصصة ومهارات جديدة بسهولة
- **تعليمية:** تتيح للمستخدمين تعلم أدوات الأمن الحقيقي أثناء اللعب
- **مقدمات AI متعددة:** اختر المزود المناسب أو دع النظام يختار تلقائياً

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
                    │  أدوات الفحص      │  │  مقدمات AI    │  │  OpenCode         │
                    │  semgrep / codeql │  │  Gemini/Ollama│  │  سطح مكتب        │
                    │  slither / fuzzer │  │  Groq/HF      │  │  جلسات            │
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

### الحد الأدنى

```bash
cyberguard-agent start
```

يُشغّل الجهة على المنفذ الافتراضي `3001` بدون أي إعدادات إضافية.

### الإعداد الكامل

```bash
cyberguard-agent start --profile full
```

يُفعّل جميع الأدوات والقدرات مع 3 عمليات متزامنة وذاكرة مؤقتة لمدة ساعتين.

### مخصص

```bash
cyberguard-agent start --port 3001 --token mytoken --verbose
```

| المعامل | الوصف | القيمة الافتراضية |
|---------|-------|-------------------|
| `--port` | رقم المنفذ | `3001` |
| `--token` | رمز المصادقة | بدون (إذا حُدد، يُطلب عند كل اتصال) |
| `--profile` | ملف الإعداد | `minimal` |
| `--verbose` | وضع تفصيلي | `false` |

### أوامر أخرى

```bash
# عرض حالة الخادم
cyberguard-agent status

# عرض الإعدادات الحالية
cyberguard-agent config

# إيقاف الخادم
cyberguard-agent stop
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

```bash
# إعداد المفاتيح (اختياري — اتركه فارغاً لاستخدام الافتراضي)
export GEMINI_API_KEY="your-gemini-key"
export GROQ_API_KEY="your-groq-key"
export HUGGINGFACE_API_KEY="your-hf-key"
export OPENROUTER_API_KEY="your-openrouter-key"

# Ollama يعمل محلياً — لا يحتاج مفتاح
# تأكد من تشغيل Ollama أولاً
ollama serve
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

### أنواع الرسائل (16 Message Types)

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
| 13 | `opencode` | تشغيل OpenCode agent | `command` |
| 14 | `opencode-status` | فحص حالة OpenCode Desktop | — (فارغة) |
| 15 | `opencode-sessions` | سرد جلسات OpenCode | — (فارغة) |
| 16 | `opencode-launch` | تشغيل تطبيق سطح مكتب OpenCode | — (فارغة) |
| 17 | `install` | تثبيت حزمة (pip/npm/apt) | `package`, `manager` |

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
# تشغيل كل شيء
docker-compose up -d

# عرض السجلات
docker-compose logs -f

# إيقاف كل شيء
docker-compose down
```

### 10.3. إعدادات Docker

| الإعداد | القيمة | الوصف |
|---------|--------|-------|
| `GEMINI_API_KEY` | optional | مفتاح Gemini API |
| `GROQ_API_KEY` | optional | مفتاح Groq API |
| `HUGGINGFACE_API_KEY` | optional | مفتاح HuggingFace API |
| `OPENROUTER_API_KEY` | optional | مفتاح OpenRouter API |
| `PORT` | 3001 | منفذ الخادم |

### 10.4. ملاحظات Docker

- Agent يعمل على Linux فقط في Docker (OpenCode Desktop غير مدعوم)
- البيانات محفوظة في Docker volumes
- Health check متضمن في Dockerfile
- يُفضل استخدام Docker Compose لإدارة كل الخدمات

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
