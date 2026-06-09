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
| Testing | Vitest | 4.1.7 | 35 اختبار ✅ |
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
│   ├── AIPanel.tsx                  # AI Assistant panel: StudentChat + FacultyEditor + Settings
│   ├── api.ts                       # OpenAI-compatible API (stream + non-stream) + OpenRouter/Ollama
│   └── prompts.ts                   # System prompts: طالب + هيئة تدريس
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
│   └── aiStore.ts                  # AI state: provider, model, API keys, messages, faculty PIN
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
│   ├── settings.ts                  # 28 حقل
│   ├── dialogue.ts
│   └── characters.ts
│
├── utils/
│   ├── constants.ts                 # قيم افتراضية + FONT_OPTIONS + HEADING_FONT_OPTIONS + MONO_FONT_OPTIONS
│   ├── indexedDBStorage.ts          # تخزين Zustand في IndexedDB + تثاقل من localStorage
│   └── helpers.ts
│
└── __tests__/                       # 35 اختبار ✅
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
| **Markdown Rendering** | نعم | عرض ردود AI بصيغة Markdown مع جداول وقوائم وأكواد |
| **Edit User Message** | نعم | تعديل الرسالة وإعادة إرسالها |
| **Regenerate Response** | نعم | إعادة توليد رد AI من نفس السياق |
| **Copy Response** | نعم | نسخ رد AI إلى الحافظة |
| **Download Response** | نعم | تنزيل رد AI بصيغة .md / .docx / .pdf |
| **API Keys** | localStorage | مشفرة وغير مشاركة مع الـ persist (IndexedDB) |
| **زر AI FAB** | أعلى اليمين (y: 16px) | زر دائري مع pulse animation عند التحويم |
| **زر الصوت** | أسفل زر AI (y: 72px) | كتم/تشغيل الموسيقى الخلفية |
| **لوحة AI** | منتصف الشاشة | تظهر عند الضغط على زر AI، تختفي عند الإغلاق |
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
| `public/videos/output.wav` | 1.4MB | موسيقى خلفية مخصصة |
| `public/videos/output(new).wav` | 1.4MB | موسيقى خلفية محدثة |
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
- [x] **شاشة بداية عصرية (Game Menu)** — تم: تصميم Fortnite/Free Fire style — عنوان top-left بتدرج + توهج، كرات ضبابية عائمة، شبكة منظور 3D، جسيمات متصاعدة، أزرار دائرية بحواف زجاجية ونصوص تظهر عند التحويم
- [x] **AI Assistant مدمج** — تم: Student Chat + Faculty Editor + دعم OpenAI/OpenRouter/Ollama/API مخصص + تخزين API Keys محلياً

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
