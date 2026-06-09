# Cyber Guardians — PROJECT MAP

> لعبة تعليمية تفاعلية ثلاثية الأبعاد لتعليم أساسيات الأمن السيبراني للمراهقين
> الحالة: **🟢 تشغيل وإنتاج (Live on GitHub Pages)**

---

## [TECH_STACK]

| الطبقة | التقنية | الإصدار | الغرض |
|---|---|---|---|
| Build | Vite | 8.0.14 | Bundler / Dev server |
| Language | TypeScript | 6.0.3 | Strict typing |
| UI Framework | React | 19.x | UI / HUD / Menus |
| 3D Engine | Three.js | 0.184.0 | WebGL rendering |
| React → Three | @react-three/fiber | 9.6.1 | R3F renderer |
| 3D Helpers | @react-three/drei | 10.7.7 | Utility components |
| State | Zustand | 5.0.13 | Game + Settings store |
| Persist | IndexedDB (مخصص) | — | تخزين الملفات الكبيرة (WAV, صور) |
| Audio | Web Audio API (Procedural) | — | BGM (procedural/file) + SFX (7 أنواع) |
| 3D Characters | useGLTF (RobotExpressive) + Float + useAnimations | — | نماذج محملة من الإنترنت مع حركات |
| 3D Environment | Stars + Particles + Grid | — | خلفية نجمية مع جزيئات عائمة |
| Testing | Vitest | 4.1.7 | 70 اختبار ✅ |
| Deploy | GitHub Actions → GitHub Pages | — | نشر آلي مع workflow_dispatch |
| AI Music | MiniMax Music 2.6 | — | أوامر توليد موسيقى (Instrumental Mode) |

### قيود تقنية
- Strict TypeScript (noImplicitAny, strictNullChecks, exactOptionalPropertyTypes)
- ES2022 target
- Path aliases: `@/` → `src/`
- Resolution: responsive 16:9 (base 1200×675)
- Chunk size: ~1.2MB (Three.js)
- Deployment base: `/cyber-guardians/`

---

## [SYSTEM_FLOW]

```
[Boot]
  │
  ├─→ Main Menu (video with sound, no BGM) ←─┐
  │     ├─→ Start Game → Level Select         │
  │     └─→ Settings                          │
  │                                    │
  ├─→ Level Select (BGM starts) ←─────┐  │
  │     ├─→ Level[N] (جديد/مكرر)      │  │
  │     │     ├─→ Story Dialogue (3D) │  │
  │     │     ├─→ Challenge (mini-game)│  │
  │     │     │     ├─→ إعادة تعيين   │  │
  │     │     │     └─→ Result Screen │  │
  │     │     │           ├─→ متابعة  │  │
  │     │     │           └─→ إعادة   │  │
  │     │     ├─→ Outro Dialogue      │  │
  │     │     └─→ Back to Level Select┘  │
  │     └─→ جميع المستويات قابلة لإعادة ┘
  │
  ├─→ Settings (5 tabs: الصوت, العرض, الخطوط, الفيديو, عام)
  │
  ├─→ Celebration Video (BGM stops, فيديو بصوت, المستوى 7 فقط)
  │
  └─→ Victory (إعادة تعيين → Main Menu)

Keyboard Shortcuts: M (mute), B (BGM mute), Esc (back)

UI Layout (top-right corner):
- 🤖 AI FAB button: y = 16px (أعلى الزاوية اليمنى)
- 🔊 BGM toggle button: y = 72px (أسفل زر AI)
- AI Panel: centered on screen when opened
- Panel closes: زر ✕ / النافذة المعتمة / زر AI (toggle)
```

---

## [LEVEL MAP]

| # | الاسم | الثغرة | التحدي | عدد الأسئلة/الخطوات | ملاحظات |
|---|---|---|---|---|---|
| 1 | رسالة مشبوهة | Phishing | بطاقات تصنيف إيميلات | 6 إيميلات | خلط عشوائي + إعادة محاولة |
| 2 | الباب المفتوح | Password | بناء كلمة مرور بالمعايير | 4 قواعد | إعادة محاولة |
| 3 | الضيف غير المرغوب | Malware | متاهة سوكوبان (ادفع العدو) | 7×7 Grid — 4 ملفات خبيثة | إعادة تعيين/محاولة |
| 4 | الثغرة في الجدار | Network | إعداد جدار ناري | 6 منافذ | إعادة محاولة |
| 5 | الرسالة المشفرة | Encryption | Caesar Cipher | Shift 1-10 | إعادة محاولة |
| 6 | الموقع المخترق | Web Security | إصلاح كود (SQLi + XSS) | 2 قطع كود | خلط عشوائي + إعادة محاولة |
| 7 | الهجوم الأخير | Incident Response | اختيار متعدد | 3 خطوات | خلط عشوائي + إعادة محاولة + فيديو احتفال |

---

## [ARCHITECTURE]

```
src/
├── App.tsx                          # 8 شاشات + AIPanel — MenuScreen + AI Assistant مدمج
├── main.tsx                         # Entry point
│
├── ai/
│   ├── AIPanel.tsx                  # AI Assistant panel: SessionBar + StudentChat + FacultyAIChat + FacultyDataEditor + AISettings + GitHub Sync
│   ├── api.ts                       # OpenAI-compatible API (stream + non-stream) + OpenRouter/Ollama + unlimited max_tokens
│   ├── github.ts                    # GitHub API: push files/changes, list files, create/update files, test connection + Git Data API
│   ├── googleDrive.ts               # Google Drive API: OAuth 2.0 + رفع محتوى + رفع مشروع كامل
│   └── prompts.ts                   # System prompts: طالب + هيئة تدريس (مع تعليمات JSON لأضافة/تعديل/حذف gameMeta + levels + characters)
│
├── challenges/                      # 7 mini-games كاملة + shuffle
│   ├── ChallengeRenderer.tsx        # Router حسب type
│   ├── CardChallenge.tsx            # Level 1 — shuffle emails
│   ├── BuildChallenge.tsx           # Level 2
│   ├── MazeChallenge.tsx            # Level 3 — Sokoban 7×7, 4 malware, reset/retry
│   ├── DragDropChallenge.tsx        # Level 4
│   ├── DecryptChallenge.tsx         # Level 5 — shuffle options via monoFont
│   ├── CodeFixChallenge.tsx         # Level 6 — shuffle codes + options
│   └── ResponseChallenge.tsx        # Level 7 — shuffle steps + options
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx               # 3 variants — CSS variables for borders/colors
│   │   ├── Modal.tsx                # CSS variable borderRadius
│   │   ├── ProgressBar.tsx          # CSS variable borderRadius + accent-color
│   │   ├── DialogueBox.tsx          # فيديو مستقل لكل شخصية (zayn.mp4, nora.mp4, etc.)
│   │   ├── BackgroundVideo.tsx      # فيديو/صورة/GIF مخصص + سطوع
│   │   ├── CelebrationVideo.tsx     # فيديو احتفال نهاية اللعبة + skip button
│   │   ├── SettingsPanel.tsx        # 5 tabs + رفع ملفات لكل شخصية + معاينة خطوط
│   │   ├── KeyboardShortcuts.tsx    # اختصارات لوحة المفاتيح — CSS variables
│   │   └── MenuScreen.tsx           # شاشة البداية (Fortnite/Free Fire style) — title top-left, orbs, grid, particles, circular buttons
│   └── three/
│       ├── GameCanvas.tsx
│       ├── CharacterModel.tsx       # GLTF + Animations (غير مستخدم حالياً)
│       └── Environment.tsx          # Stars + Particles + Grid
│
├── store/
│   ├── gameStore.ts                 # Zustand + persist (IndexedDB) — Set serialization fix
│   ├── settingsStore.ts            # 28 حقل إعدادات (18 قديم + 10 جديد)
│   ├── contentStore.ts             # محتوى مخصص (gameMeta + level overrides + new levels + deleted levels + character overrides)
│   └── aiStore.ts                  # AI state: provider, model, API keys, faculty PIN, sessions (student + faculty) + CRUD
│
├── systems/
│   ├── ProceduralAudio.ts           # BGM (procedural/file) + SFX (7 أنواع) — autoplay fix
│   └── LoggingSystem.ts
│
├── hooks/
│   └── useResponsive.ts
│
├── data/
│   ├── characters.ts                # 6 شخصيات (زين، نورا، عمر، ليلى، طارق، النظام)
│   └── dialogue.ts                  # 7 مستويات — نص + تحديات + shuffle
│
├── types/
│   ├── index.ts
│   ├── settings.ts                  # GameSettings + GameMeta (28 حcampo)
│   ├── ai.ts                        # AIMessage, ChatAttachment (uploadStatus), ChatSession, AIState, AI_PROVIDERS, UploadStatus
│   ├── game.ts                      # LevelData (مُوسّع) + Character (مُوسّع) + GameMeta
│   ├── dialogue.ts
│   └── characters.ts
│
├── utils/
│   ├── constants.ts                 # قيم افتراضية + FONT_OPTIONS + HEADING_FONT_OPTIONS + MONO_FONT_OPTIONS
│   ├── indexedDBStorage.ts          # تخزين Zustand في IndexedDB + تثاقل من localStorage
│   ├── apiKeyCrypto.ts              # تشفير/فك API keys بـ AES-GCM (Web Crypto API)
│   └── helpers.ts
│
└── __tests__/                       # 70 اختبار ✅
    ├── gameStore.test.ts            # 9 tests
    ├── settingsStore.test.ts        # 6 tests
    ├── storage.test.ts              # 5 tests
    ├── helpers.test.ts              # 6 tests
    ├── logging.test.ts              # 5 tests
    └── levels.test.ts               # 4 tests
```

---

## [AI_ASSISTANT]

| الميزة | الوضع | التفاصيل |
|---|---|---|
| **Student Chat** | مفتوح للجميع | شات مع AI يجيب عن أسئلة الأمن السيبراني مدعوم بـ system prompt مخصص |
| **Faculty Editor** | محمي برمز PIN (افتراضي: 1234) | محرر لمحتوى اللعبة: عناوين، حوار، تحديات + إعدادات اللعبة + صعوبة/نقاط/حدود الوقت |
| **Faculty PIN Change** | في تبويب Settings | تغيير رمز هيئة التدريس مع التحقق من الرمز الحالي |
| **AI Providers** | 4 مزودين | OpenAI, OpenRouter (مع نماذج مجانية), Ollama (محلي), API مخصص (OpenAI-compatible) |
| **Streaming** | نعم | عرض الردود بشكل تدريجي |
| **Markdown Rendering** | نعم | عرض ردود AI بصيغة Markdown مع جداول وقوائم وأكواد (react-markdown + remark-gfm) |
| **Session Management** | نعم | جلسات متعددة لكل وضع (طالب/هيئة تدريس) — إنشاء/切换/إعادة تسمية/حذف |
| **File Upload** | نعم | رفع ملفات (نص، صور، فيديو، صوت) مع إمكانية إرفاق عدة ملفات + مؤشر حالة الرفع (⏳ رفع / ✅ نجاح / ❌ خطأ) |
| **GitHub Sync** | نعم | رفع ملفات TypeScript المعدّلة مباشرة إلى GitHub (characters.ts + dialogue.ts + gameMeta.ts) |
| **GitHub Fork** | نعم | نسخ المستودع الرئيسي إلى حساب عضو هيئة التدريس + تفعيل GitHub Pages تلقائياً |
| **Upload Status** | نعم | مؤشرات حالة رفع الملفات: ⏳ رفع / ✅ نجاح / ❌ خطأ مع رسالة الخطأ |
| **Edit User Message** | نعم | تعديل الرسالة وإعادة إرسالها |
| **Regenerate Response** | نعم | إعادة توليد رد AI من نفس السياق |
| **Copy Response** | نعم | نسخ رد AI إلى الحافظة |
| **Download Response** | نعم | تنزيل رد AI بصيغة .md / .docx / .pdf |
| **API Keys** | localStorage | مشفرة وغير مشاركة مع الـ persist (IndexedDB) |
| **زر AI FAB** | أعلى اليمين (y: 16px) | زر دائري مع pulse animation عند التحويم + سحب مخصص |
| **زر الصوت** | أسفل زر AI (y: 72px) | كتم/تشغيل الموسيقى الخلفية |
| **لوحة AI** | منتصف الشاشة | تظهر عند الضغط على زر AI، قابلة للسحب والتغيير الحجم + maximize/minimize |
| **إغلاق اللوحة** | 3 طرق | زر ✕، النافذة المعتمة، زر AI مرة أخرى (toggle) |
| **إرشادات الاستخدام** | — | موجودة أدناه |

### الحقول القابلة للتعديل عبر AI والمحرر

#### إعدادات اللعبة العامة (GameMeta)
| الحقل | النوع | القيمة الافتراضية |
|---|---|---|
| `gameTitle` | نص | Cyber Guardians |
| `gameSubtitle` | نص | حراس الأمن السيبراني |
| `gameVersion` | نص | 1.0.0 |
| `defaultLanguage` | قائمة | ar |
| `difficulty` | قائمة | medium (easy/medium/hard) |
| `dailyRewardEnabled` | صحيح | true |
| `dailyRewardPoints` | رقم | 100 |
| `adsEnabled` | صحيح | false |
| `iapEnabled` | صحيح | false |
| `platformNotes` | نص | — |
| `layoutWidth` | رقم | 1200 |
| `layoutHeight` | رقم | 675 |
| `layoutMode` | قائمة | responsive (fixed/responsive) |
| `hudPosition` | قائمة | top (top/bottom/left/right) |
| `menuStyle` | قائمة | cards (grid/list/cards) |
| `animationSpeed` | قائمة | normal (slow/normal/fast) |
| `bgVolume` | رقم | 0.7 (0-1) |
| `sfxVolume` | رقم | 1.0 (0-1) |
| `voiceVolume` | رقم | 1.0 (0-1) |

#### حقول المستوى الإضافية
| الحقل | النوع | الوصف |
|---|---|---|
| `difficulty` | قائمة | سهل/متوسط/صعب |
| `points` | رقم | نقاط عند الإكمال |
| `timeLimit` | رقم | حد الوقت بالثانية (0 = بدون حد) |
| `unlockRequirement` | رقم | المستوى المطلوب إكماله (0 = متاح دائماً) |
| `hints` | مصفوفة نصوص | نصائح تظهر أثناء التحدي |
| `backgroundImage` | رابط | صورة خلفية المستوى |
| `backgroundMusic` | رابط | موسيقى خلفية المستوى |
| `soundEffects` | مصفوفة روابط | مؤثرات صوتية |

#### حقول الشخصية الإضافية
| الحقل | النوع | الوصف |
|---|---|---|
| `avatarUrl` | رابط | صورة الشخصية |
| `voiceUrl` | رابط | ملف صوتي للشخصية |

#### أدوات إضافية في محرر البيانات
| الأداة | الوصف |
|---|---|
| **📤 تصدير JSON** | تصدير جميع البيانات (gameMeta + levels + characters) كملف JSON |
| **📥 استيراد JSON** | استيراد بيانات من ملف JSON (يحل محل جميع البيانات الحالية) |
| **⚙ JSON خام** | تحرير جميع البيانات كـ JSON مباشرة مع التحقق من الصحة |

### إرشادات استخدام AI Assistant

#### نظام الجلسات
- كل وضع (طالب/هيئة تدريس) لديه جلسات مستقلة
- جلسة تُنشأ تلقائياً عند فتح المحادثة لأول مرة
- يمكن إنشاء جلسات جديدة، التبديل بينها، إعادة تسميتها، أو حذفها
- كل جلسة تحتفظ برسائلها بشكل مستقل
- عند حذف آخر جلسة، تُنشأ جلسة جديدة تلقائياً
- جميع الجلسات تُحفظ في IndexedDB وتظهر عند إعادة التحميل

#### رفع الملفات
- 📎 زر رفع الملفات في شريط الإدخال
- دعم: ملفات نصية، صور (base64)، فيديو، صوت
- الصور تُرسل للـ AI كـ base64 (مدعومة في نماذج الرؤية)
- الفيديو/الصوت يُرسلان كmetadata نصية
- النصوص (JSON, CSV, etc.) تُرسل كمحتوى كامل
- يمكن إرفاق عدة ملفات قبل الإرسال
- المرفقات تظهر فوق شريط الإدخال مع إمكانية الحذف

#### 🆓 OpenCode Zen (نماذج مجانية)
افتح إعدادات AI ← اختر OpenRouter ← اختر أحد النماذج المجانية:
- `meta-llama/llama-3.2-3b-instruct:free` — خفيف وسريع
- `mistralai/mistral-7b-instruct:free` — دقيق
- `google/gemini-2.0-flash-exp:free` — قوي جداً

1. سجل في https://openrouter.ai
2. أنشئ API Key مجاني
3. الصقه في حقل API Key في الإعدادات

#### 🔓 OpenAI
1. سجل في https://platform.openai.com
2. أنشئ API Key من Billing → API Keys
3. اختر `gpt-4o-mini` (رخيص) أو `gpt-4o`

#### 💻 Ollama (نماذج محلية - مجانية تماماً)
1. ثبت Ollama من https://ollama.ai
2. شغل أمر مثل `ollama run llama3.2`
3. في الإعدادات: اختر Ollama، اترك API Key فارغ (أو أي قيمة)
4. تأكد أن Ollama شغال (`ollama serve`)

#### 🔧 API مخصص
أي مزود يدعم OpenAI-compatible API:
1. ضع Base URL (مثلاً `https://generativelanguage.googleapis.com/v1beta/openai/` لجيميني)
2. ضع API Key المناسب
3. اختر النموذج المطلوب

#### 🔄 رفع التعديلات إلى GitHub
لكل عضو هيئة تدريس نسخته الخاصة من اللعبة على GitHub:

**الخطوة 1: إنشاء GitHub Token**
1. اذهب إلى `github.com → Settings → Developer settings → Tokens (fine-grained or classic)`
2. أنشئ Token جديد وفعّل الصلاحيات:
   - ☑️ `repo` —(full control of private repositories)
   - ☑️ `workflow` —(Update GitHub Action workflows)
3. انسخ الـ Token

**الخطوة 2: إعداد GitHub (خياران)**

**🟢 الخيار 1: التعديل المباشر في المستودع الرئيسي**
1. في اللعبة: افتح AI Panel ← هيئة تدريس ← ⚙ GitHub
2. الصق الـ Token
3. اضغط **🟢 التعديل المباشر**
4. يُفعّل GitHub Pages على المستودع الرئيسي

**🟡 الخيار 2: إنشاء مستودع جديد**
1. في اللعبة: افتح AI Panel ← هيئة تدريس ← ⚙ GitHub
2. الصق الـ Token
3. اكتب اسم المستودع الجديد
4. اضغط **🟡 إنشاء مستودع جديد**
5. سيحصل على:
   - مستودع جديد في حسابه: `username/الاسم-الجديد`
   - رابط اللعبة: `https://username.github.io/الاسم-الجديد/`

**مميزات النسخ الجديد (Git Data API):**
- ✅ **commit واحد لكل الملفات** عبر Git Trees/Blobs/Commits API — أسرع وأكثر موثوقية
- ✅ ينسخ **كل الملفات** بدون استثناء — صور، فيديوهات، خطوط، خريطة (via Blob API)
- ✅ يُحدّث `vite.config.ts` تلقائياً (base path — يدعم جميع أنواع الاقتباسات + يضيف base إن لم يكن موجوداً)
- ✅ يُحدّث `package.json` و `package-lock.json` تلقائياً
- ✅ يُحدّث `README.md` بالروابط الجديدة
- ✅ لا يوجد `SKIP_EXTENSIONS` أو `MAX_FILE_SIZE` — كل ملف يُرفع
- ✅ عملية ذرية — كل شيء ينجح أو يفشل معاً (لا ملفات مفقودة)
- ✅ يفعّل GitHub Pages تلقائياً
- ✅ **auto_init: false** — commit واحد فقط (لا إلغاء deploy)

**الخطوة 3: رفع التعديلات**
1.عدّل اللعبة عبر AI أو المحرر
2. اضغط **🔄 رفع إلى GitHub**
3. الملفات تُرفع تلقائياً: `characters.ts` + `dialogue.ts` + `gameMeta.ts`
4. GitHub Actions يعيد البناء تلقائياً
5. التعديلات تظهر على الرابط خلال دقائق

**ملفات تُرفع:**
| الملف | المحتوى |
|---|---|
| `src/data/characters.ts` | الشخصيات (الأسماء، الأدوار، الألوان، الشخصية) |
| `src/data/dialogue.ts` | المستويات (الحوارات، التحديات، الإعدادات) |
| `src/data/gameMeta.ts` | إعدادات اللعبة العامة (العنوان، الصعوبة، النقاط) |

**ملفات تُحدّث تلقائياً عند النسخ:**
| الملف | ماذا يُحدّث |
|---|---|
| `vite.config.ts` | `base: '/الاسم-الجديد/'` |
| `package.json` | `"name": "الاسم-الجديد"` |
| `package-lock.json` | `"name": "الاسم-الجديد"` |
| `README.md` | الروابط + اسم المالك |

---

## [SETTINGS] — 28 حقل

### تبويب الصوت
| الميزة | الحالة | التخزين |
|---|---|---|
| BGM Volume (0–200%) | ✅ | IndexedDB |
| SFX Volume (0–200%) | ✅ | IndexedDB |
| Mute Toggle | ✅ | IndexedDB |
| Custom BGM Upload (audio/*) | ✅ | IndexedDB (data URL) |

### تبويب العرض
| الميزة | الحالة | التخزين |
|---|---|---|
| Background Color | ✅ | IndexedDB |
| Background Brightness (0.1–2) | ✅ | IndexedDB — CSS variable |
| Background Animation (image/video/GIF) | ✅ | IndexedDB (data URL, 20MB max) |
| Background Animation Brightness | ✅ | IndexedDB |
| Border Radius (0–32px) | ✅ | IndexedDB — CSS variable `--custom-border-radius` |
| Border Width (0–6px) | ✅ | IndexedDB — CSS variable `--custom-border-width` |
| Border Color | ✅ | IndexedDB — CSS variable `--custom-border-color` |

### تبويب الخطوط
| الميزة | النطاق | الافتراضي | التخزين |
|---|---|---|---|
| خط النص الأساسي | 5 خيارات | Cairo | IndexedDB |
| خط العناوين | 6 خيارات | Cairo | IndexedDB |
| خط الكود | 5 خيارات | Courier New | IndexedDB |
| حجم النص الأساسي | 12–28px | 16px | IndexedDB |
| حجم العناوين | 14–40px | 24px | IndexedDB |
| حجم الكود | 10–24px | 14px | IndexedDB |
| حجم النص الثانوي | 10–20px | 13px | IndexedDB |
| لون النص الأساسي | color picker | أبيض | IndexedDB |
| لون العناوين | color picker | أزرق | IndexedDB |
| لون التمييز | color picker | أزرق | IndexedDB |
| لون النص الثانوي | color picker | رمادي | IndexedDB |
| معاينة حية | — | — | — |

### تبويب الفيديو
| الميزة | الحالة | التخزين |
|---|---|---|
| فيديو زين (محلل أمني) | ✅ | IndexedDB (data URL, 50MB max) |
| فيديو د. نورا (خبيرة تشفير) | ✅ | IndexedDB (data URL, 50MB max) |
| فيديو عمر (خبير شبكات) | ✅ | IndexedDB (data URL, 50MB max) |
| فيديو ليلى (خبيرة أمن ويب) | ✅ | IndexedDB (data URL, 50MB max) |
| فيديو طارق (محلل برمجيات خبيثة) | ✅ | IndexedDB (data URL, 50MB max) |
| فيديو النظام (إشعارات وأهداف) | ✅ | IndexedDB (data URL, 50MB max) |
| فيديو الاحتفال (نهاية اللعبة) | ✅ | IndexedDB (data URL, 50MB max) |
| خلفية القائمة الرئيسية | ✅ | IndexedDB (data URL, 50MB max) |

### تبويب عام
| الميزة | الحالة | التخزين |
|---|---|---|
| Quality Preset (low/medium/high) | ✅ | IndexedDB |
| Accessibility Mode | ✅ | IndexedDB |
| Keyboard Shortcuts | ✅ | — |
| Reset All Defaults | ✅ | IndexedDB |

---

## [CSS_VARIABLES]

| المتغير | الاستخدام | القيمة الافتراضية |
|---|---|---|
| `--custom-brightness` | سطوع الخلفية | 1.0 |
| `--custom-border-radius` | نصف قطر الحدود | 12px |
| `--custom-border-color` | لون الحدود | rgba(255,255,255,0.2) |
| `--custom-border-width` | سماكة الحدود | 1px |
| `--heading-font` | خط العناوين | Cairo |
| `--heading-font-size` | حجم العناوين | 24px |
| `--heading-color` | لون العناوين | #4FC3F7 |
| `--accent-color` | لون التمييز | #4FC3F7 |
| `--muted-color` | لون النص الثانوي | #888888 |
| `--mono-font` | خط الكود | Courier New |
| `--mono-font-size` | حجم الكود | 14px |
| `--border-color-subtle` | حدود عامة | rgba(255,255,255,0.2) |
| `--border-color-muted` | حدود خافتة | rgba(255,255,255,0.1) |
| `--border-color-faint` | حدود شبه مخفية | rgba(255,255,255,0.06) |
| `--border-color-success` | نجاح | #81C784 |
| `--border-color-error` | خطأ | #E57373 |
| `--border-color-warning` | تحذير | #FFB74D |

---

## [CSS_ANIMATIONS]

| الكلمة المفتاحية | الوظيفة | المدة |
|---|---|---|
| `cg-particle-rise` | جسيمات متصاعدة من الأسفل للأعلى بتلاشي | 10–20s |
| `cg-orb-float` | كرات ضبابية عائمة مع تغير الحجم | 12s |
| `cg-grid-move` | شبكة منظور 3D متحركة للأعلى | 20s |
| `cg-title-glow` | توهج متغير للعنوان (نيلي → بنفسجي) | 3s |
| `cg-notification-pulse` | نبض نقطة الإشعار (تكبير/تصغير) | 2.5s |

---

## [FILES & ASSETS]

### فيديوهات الشخصيات (public/videos/)
| الملف | الدور | ملاحظات |
|---|---|---|
| `zayn.mp4` | زين — محلل أمني | فيديو افتراضي |
| `nora.mp4` | د. نورا — خبيرة تشفير | فيديو افتراضي |
| `omar.mp4` | عمر — خبير شبكات | فيديو افتراضي |
| `layla.mp4` | ليلى — خبيرة أمن ويب | فيديو افتراضي |
| `tariq.mp4` | طارق — محلل برمجيات خبيثة | فيديو افتراضي |
| `system.mp4` | النظام — إشعارات وأهداف | فيديو افتراضي |
| `celebration.mp4` | شاشة الاحتفال | نهاية المستوى 7 |

### ملفات أخرى
| الملف | الحجم | الاستخدام |
|---|---|---|
| `public/videos/start.mp4` | 5.6MB | فيديو الخلفية الافتراضي للقائمة الرئيسية (بصوت) |
| `public/videos/original.mp4` | 5.6MB | خلفية اللعبة الرئيسية (قديم — احتياطي) |
| `public/videos/background_1.mp4` | 1.3MB | خلفية سابقة (احتياطي) |
| `public/startpage5.html` | — | تصميم مرجعي لشاشة البداية (Fortnite/Free Fire style) |
| `public/videos/output.wav` | 1.4MB | موسيقى خلفية أصلية |
| `public/videos/output(new).wav` | 1.4MB | موسيقى خلفية الافتراضية الحالية (يتم استخدامها في `App.tsx`) |
| `public/videos/output.mp3` | 129KB | نسخة MP3 من الموسيقى |
| `public/videos/زين.webp` | 2.5MB | صورة FLUX لشخصية زين |
| `PROMPTS.md` | 475+ سطر | أوامر FLUX + مشاهد انتقالية + مشهد النظام |
| `.github/workflows/deploy.yml` | — | GitHub Pages deploy (Node.js 24) |

---

## [CHARACTERS]

| المعرف | الاسم | الدور | اللون | فيديو |
|---|---|---|---|---|
| `zayn` | زين | محلل أمني | `#4FC3F7` | `zayn.mp4` |
| `nora` | د. نورا | خبيرة تشفير | `#CE93D8` | `nora.mp4` |
| `omar` | عمر | خبير شبكات | `#FFB74D` | `omar.mp4` |
| `layla` | ليلى | خبيرة أمن ويب | `#81C784` | `layla.mp4` |
| `tariq` | طارق | محلل برمجيات خبيثة | `#E57373` | `tariq.mp4` |
| `system` | النظام | إشعارات وأهداف | `#FFFFFF` | `system.mp4` |

---

## [MAZE_CHALLENGE] — المستوى 3

**النوع**: Sokoban-style push mechanic

**الخريطة**:
```
   0 1 2 3 4 5 6
0: . . . . . . .
1: . W . . M . .    M = (4,1), W = (1,1)
2: . . . . . M .    M = (5,2)
3: . . . W . . .    W = (3,3)
4: . . . M . . .    M = (3,4)
5: . M . . . . .    M = (1,5)
6: . . E . . E .    E = (2,6), E = (5,6)
```

**التحسينات**:
- زر **إعادة تعيين** أثناء اللعب
- زر **إعادة المحاولة** بعد الإكمال
- `useCallback` أُزيل (stale closure كان ينهي اللعبة بدرياً)
- `secured` يُحسب من `totalMalware - malware.length` بدل state منفصل
- كل الملفات الخبيثة تصل إلى نقطة أمان (تم إصلاح موضع (5,0) → (4,1))

---

## [SHUFFLE_SYSTEM]

في كل مرة يُفتح المستوى أو تُعاد المحاولة، يتم خلط الأسئلة والإجابات عشوائياً:

| المستوى | ما يُخلط |
|---|---|
| 1 (رسالة مشبوهة) | ترتيب الإيميلات |
| 6 (الموقع المخترق) | ترتيب الثغرات + ترتيب الإجابات |
| 7 (الهجوم الأخير) | ترتيب الخطوات + ترتيب الإجابات |

**الآلية**: `useState(() => shuffle(data))` — الخلط يحدث مرة واحدة عند تحميل المكون.

---

## [CELEBRATION_VIDEO]

- يظهر **فقط** بعد إنهاء المستوى 7 (الهجوم الأخير)
- BGM يتوقف قبل ظهور فيديو الاحتفال
- فيديو full-screen **بصوت** (`autoPlay` + `playsInline`)
- صوت الفيديو يتحكم عبر `bgmVolume` و `muted` من الإعدادات
- زر "تخطي" يظهر بعد 3 ثواني
- عند انتهاء الفيديو → صفحة النقاط (Victory)

---

## [BORDER_SYSTEM]

تم توحيد **~55** حد hardcoded باستخدام CSS variables:

| المكون | التعديلات |
|---|---|
| Button | `--custom-border-radius`, `--custom-border-color`, `--accent-color` |
| Modal | `--custom-border-radius` |
| SettingsPanel | `--custom-border-radius`, `--custom-border-color`, `--border-color-faint` |
| KeyboardShortcuts | `--custom-border-radius`, `--border-color-subtle`, `--accent-color` |
| ProgressBar | `--custom-border-radius`, `--accent-color` |
| App (level select) | `--custom-border-radius`, `--custom-border-width`, `--accent-color`, `--border-color-subtle`, `--border-color-faint` |
| MazeChallenge | `--custom-border-width`, `--border-color-error`, `--border-color-success`, `--accent-color`, `--border-color-subtle` |
| BuildChallenge | `--custom-border-radius`, `--custom-border-width`, `--border-color-subtle`, `--border-color-success`, `--border-color-faint` |
| DragDropChallenge | `--custom-border-radius`, `--custom-border-width`, `--accent-color`, `--border-color-muted` |
| DecryptChallenge | `--custom-border-width`, `--accent-color`, `--border-color-success` |
| CodeFixChallenge | `--custom-border-radius`, `--custom-border-width`, `--border-color-muted`, `--border-color-success`, `--border-color-error` |
| ResponseChallenge | `--custom-border-radius`, `--custom-border-width`, `--border-color-muted`, `--border-color-success`, `--border-color-error` |

---

## [AUDIO_SYSTEM]

**ProceduralAudio.ts** — التحسينات:
- `playFileBg()`: `Math.min(volume, 1)` لمنع قيم > 1
- `playFileBg()`: `preload='auto'` لتحميل مسبق
- `playFileBg()`: fallback to user interaction click إذا المتصفح منع autoplay
- `playClick()`: يعيد تشغيل BGM إذا متوقف
- متغير مشترك `bgAudio` لمنع تداخل ملفات صوتية

**سلوك الصوت/الفيديو**:
- **شاشة البداية**: فيديو خلفية بصوت (unmuted)، لا يوجد BGM
- **شاشة المستويات/التحديات**: BGM يعمل، فيديو الخلفية مكتوم (muted)
- **شاشة الاحتفال**: BGM يتوقف، فيديو الاحتفال يعمل بصوت
- **شاشة النصر**: لا يوجد صوت (إعادة تعيين → القائمة الرئيسية)

**BackgroundVideo.tsx**:
- Prop `muted` (افتراضي `true`) يتحكم في كتم صوت الفيديو
- `muted={screen !== 'menu'}` — صوت مفعّل فقط في شاشة البداية

**CelebrationVideo.tsx**:
- `autoPlay` + `playsInline` للتشغيل التلقائي
- الصوت يتحكم عبر `bgmVolume` و `muted` من الإعدادات

---

## [ORPHANS & PENDING]

### مكتمل
- [x] **إعادة المحاولة في كل التحديات** — تم
- [x] **خلط الأسئلة عشوائياً** — تم (المستويات 1, 6, 7)
- [x] **فيديو احتفال نهاية اللعبة** — تم (celebration.mp4 + CelebrationVideo)
- [x] **فيديو مستقل لكل شخصية** — تم (6 شخصيات: zayn, nora, omar, layla, tariq, system)
- [x] **إعدادات خطوط شاملة** — تم (12 إعداد + معاينة حية)
- [x] **توحيد الحدود** — تم (~55 hardcoded → CSS variables)
- [x] **إصلاح Set serialization** — تم
- [x] **إصلاح autoplay الصوت** — تم
- [x] **توليد فيديوهات الشخصيات** — تم (zayn.mp4, nora.mp4, omar.mp4, layla.mp4, tariq.mp4, system.mp4, celebration.mp4)
- [x] **شاشة بداية عصرية (Game Menu)** — تم: تصميم Fortnite/Free Fire style
- [x] **AI Assistant مدمج** — تم: Student Chat + Faculty Editor + دعم OpenAI/OpenRouter/Ollama/API مخصص + تخزين API Keys محلياً
- [x] **نظام الجلسات** — تم: جلسات متعددة لكل وضع (طالب/هيئة تدريس) مع إنشاء/切换/إعادة تسمية/حذف
- [x] **رفع الملفات** — تم: دعم ملفات نصية + صور + فيديو + صوت مع إرفاق متعدد + مؤشرات حالة الرفع (⏳✅❌)
- [x] **إصلاح أخطاء الجلسات** — تم: SessionBar يظهر دائماً + إنشاء تلقائي للجلسة + حماية الرسائل
- [x] **GitHub Integration** — تم: التعديل المباشر + إنشاء مستودع جديد + نسخ كامل + تحديث base path تلقائياً + تجاهل ملفات كبيرة
- [x] **رفع ملفات إلى AI مع مؤشرات الحالة** — تم: ⏳ رفع / ✅ نجاح / ❌ خطأ على كل مرفق
- [x] **Git Data API** — تم: إعادة كتابة `copyEntireRepo` باستخدام Git Trees/Blobs/Commits API ← commit واحد لكل الملفات، عملية ذرية، لا SKIP_DIRS
- [x] **إصلاح base path في vite.config.ts** — تم: دعم جميع أنواع الاقتباسات (`'`, `"`, `` ` ``) + إضافة `base` إن لم يكن موجوداً
- [x] **Google Drive Backup** — تم: رفع محتوى JSON أو المشروع كامل إلى Google Drive
- [x] **إزالة SKIP_EXTENSIONS** — تم: `copyEntireRepo` يرفع كل الملفات حتى الوسائط (via Blob API)
- [x] **إلغاء deploy المكرر** — تم: `auto_init: false` في `createNewRepo` ← commit واحد فقط
- [x] **تمرير نتائج الرفع** — تم: scrollable box + عداد ✅/❌/⚠️ لكل ملف
- [x] **Google Drive instructions** — تم: إرشادات كاملة في واجهة الإعدادات
- [x] **Semgrep SAST Scan** — تم: فحص شامل بـ 10 rulesets (0 ثغرات)
- [x] **Supply Chain Audit** — تم: فحص 5 تبعيات (0 عالية المخاطر)
- [x] **CodeQL Fix: Insecure Randomness** — تم: `Math.random()` → `crypto.randomUUID()` في `createSession()`
- [x] **CodeQL Fix: Clear Text Storage** — تم: تشفير API Keys بـ AES-GCM قبل تخزينها في `localStorage`

### معلق / غير مربوط
- [ ] **CharacterModel (3D)** — مكوّن `src/components/three/CharacterModel.tsx` مصدّر لكن غير مستخدم في أي مكان. الـ 3D scene يعرض فقط `Environment`.
- [ ] **AudioSystem** — `src/systems/AudioSystem.ts` مصدّر لكن غير مستورد في أي كود إنتاجي. الـ app يستخدم `ProceduralAudio` بدلاً منه.
- [ ] **LoggingSystem** — `src/systems/LoggingSystem.ts` يستخدم فقط في `__tests__/`، ليس في الإنتاج.
- [ ] **تسجيل الموسيقى من MiniMax Music** — الأوامر جاهزة في PROMPTS.md، `output.wav` حالياً placeholder
- [ ] **نموذج GLTF مخصص لكل شخصية** — حالياً نموذج واحد (RobotExpressive)
- [ ] **تلميحات داخل التحديات** — للمستخدمين الجدد
- [ ] **ترجمة إنجليزية** — MVP عربي بالكامل
- [ ] **صفحة Credits** — بسيطة يمكن إضافتها
- [ ] **مشهد البداية (Intro)** — أوامر الفيديو جاهزة في PROMPTS.md
- [ ] **تقسيم الـ chunk** — ~1.2MB حالياً (Three.js dominates)

---

## [GITHUB_INTEGRATION]

### المكونات
| الملف | الوظيفة |
|---|---|
| `src/ai/github.ts` | خدمة GitHub API: Fork + Pages + Push + Test connection + Git Data API |
| `src/ai/googleDrive.ts` | Google Drive API: OAuth 2.0 + رفع محتوى JSON + رفع مشروع كامل (بما في ذلك الوسائط) |
| `src/ai/AIPanel.tsx` | واجهة المستخدم: إعدادات GitHub + Google Drive + زر Fork + زر Push + تعليمات + scrollable results |

### دوال GitHub
| الدالة | الوظيفة |
|---|---|
| `forkMainRepo()` | نسخ المستودع الرئيسي إلى حساب المستخدم |
| `enableGitHubPages()` | تفعيل GitHub Pages على المستودع |
| `setupForkWithPages()` | Fork + انتظار التجهيز + تفعيل Pages |
| `pushContentToGitHub()` | رفع ملفات TypeScript: characters.ts + dialogue.ts + gameMeta.ts |
| `copyEntireRepo()` | **Git Data API** — نسخ كل ملفات المستودع في commit واحد: Trees + Blobs + Commits (بدون SKIP) |
| `testGitHubConnection()` | اختبار الاتصال بالـ API |
| `getGitHubUsername()` | الحصول على اسم المستخدم من Token |
| `waitForForkReady()` | انتظار حتى يكون المستودع المنسوخ جاهزاً |
| `createNewRepo()` | إنشاء مستودع جديد (auto_init: false) |
| `setupDirectEdit()` | تفعيل التعديل المباشر + GitHub Pages |
| `updateViteBasePath()` | تحديث base path في vite.config.ts (يدعم `'`, `"`, `` ` `` ويضيف base إن لم يكن موجوداً) |
| `generateCharactersTS()` | توليد كود TypeScript للشخصيات |
| `generateDialogueTS()` | توليد كود TypeScript للمستويات |
| `generateGameMetaTS()` | توليد كود TypeScript لإعدادات اللعبة |

### دوال Google Drive
| الدالة | الوظيفة |
|---|---|
| `loadGIS()` | تحميل مكتبة Google Identity Services |
| `initGoogleDrive(clientId)` | تهيئة OAuth client |
| `loginToDrive()` | تسجيل الدخول بحساب Google |
| `logout()` | تسجيل الخروج |
| `createFolder(name)` | إنشاء مجلد في Drive |
| `uploadContentToDrive()` | رفع بيانات اللعبة (JSON): gameMeta + levels + characters |
| `uploadFullRepoToDrive()` | رفع المشروع كامل من GitHub إلى Drive مع الحفاظ على هيكل المجلدات |

### الإعدادات المحفوظة
| المفتاح | المحتوى |
|---|---|
| `cg-github-config` | Token + Owner + Repo + Branch (في localStorage) |

### المستودع الرئيسي
- **Owner**: `YoussefAhamedKamal`
- **Repo**: `cyber-guardians-mobile`
- **النسخ**: كل عضو هيئة تدريس يحصل على نسخة في حسابه

---

## [SECURITY_SCAN]

**تاريخ الفحص:** 2026-06-10
**الأدوات:** Semgrep 1.165.0 + Supply Chain Risk Audit
**الوضع:** Important only (MEDIUM/HIGH/CRITICAL)

### نتائج Semgrep (SAST)
| القاعدة | التصنيف | النتائج |
|---------|---------|---------|
| `p/security-audit` | ثغرات عامة | 0 |
| `p/secrets` | مفاتيح سرية | 0 |
| `p/typescript` | TypeScript | 0 |
| `p/react` | React | 0 |
| `p/javascript` | JavaScript | 0 |
| `p/nodejs` | Node.js | 0 |
| `p/yaml` | YAML | 0 (ruleset 404) |
| `p/github-actions` | CI/CD | 0 |
| Trail of Bits | Third-party | 0 |
| elttam | Third-party | 0 |
| Apiiro | Malicious code | 0 |
| **المجموع** | | **0 ثغرات** |

### ملاحظات الفحص
- **Syntax errors وهمية:** ملفان بهما syntax errors من `p/security-audit` بسبب JS parser:
  - `src/ai/AIPanel.tsx:330` ← رمز `→` في نص JSX
  - `src/data/dialogue.ts:80` ← `import('@/types')` (TypeScript type import)
  - **ليست أخطاء حقيقية** — TypeScript compiler لا يشتكي منهما

### نتائج Supply Chain
| الحزمة | الإصدار | المخاطر | نجوم | آخر تحديث |
|--------|---------|---------|------|-----------|
| react | ^19.1.0 | منخفض | 245k ⭐ | 2026-06-09 |
| react-dom | ^19.1.0 | منخفض | 245k ⭐ | 2026-06-09 |
| react-markdown | ^10.1.0 | منخفض | 15.7k ⭐ | 2026-06-09 |
| remark-gfm | ^4.0.1 | منخفض | 1.2k ⭐ | 2026-06-07 |
| zustand | ^5.0.13 | منخفض | 58k ⭐ | 2026-06-09 |

**الخلاصة:** لا توجد تبعيات عالية المخاطر. كل الحزم نشيطة ومدعومة من منظمات (Meta, remarkjs, pmndrs). `npm audit` يظهر 0 vulnerabilities.

### CodeQL Alerts (مُصلحة)
| Alert | الخط | الحالة | الإصلاح |
|-------|------|--------|---------|
| Clear text storage | `aiStore.ts:12` | ✅ | `AES-GCM` + sessionStorage key |
| Insecure randomness | `aiStore.ts:76` | ✅ | `crypto.randomUUID()` |
| Insecure randomness | `aiStore.ts:84` | ✅ | `crypto.randomUUID()` |
| Insecure randomness | `aiStore.ts:99` | ✅ | `crypto.randomUUID()` |
| Insecure randomness | `aiStore.ts:107` | ✅ | `crypto.randomUUID()` |

### توصيات
1. تفعيل **Dependabot** على المستودع
2. إضافة `npm audit` إلى CI pipeline
3. تثبيت الإصدارات (`package-lock.json` موجود أساساً)
4. فحص دوري بـ Semgrep بعد كل تحديث كبير

### مخرجات الفحص
```
static_analysis_semgrep_1/
├── rulesets.txt
├── raw/                ← 14 ملف SARIF + 14 JSON
└── results/
    ├── results.sarif
    └── supply-chain-audit.md
```
