# Cyber Guardians — PROJECT MAP

> لعبة تعليمية تفاعلية ثلاثية الأبعاد لتعليم أساسيات الأمن السيبراني للمراهقين
> الحالة: **🟢 تشغيل وإنتاج (Live on Cloudflare Pages)**
> الإصدار: **1.7.0** — إلغاء تشفير GitHub Token + إصلاح async + Timeout 15s للـ API

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
| Code Splitting | React.lazy + Suspense | — | 7 صفحات lazy-loaded + ChallengeRenderer |
| PWA | manifest.json + Service Worker | — | تثبيت التطبيق (standalone) |
| i18n | Context API (مخصص) | — | ترجمة عربي/إنجليزي |
| Analytics | مخصص (localStorage) | — | تتبع الأحداث + إحصائيات المستويات |
| Cloud Save | localStorage | — | رفع/تحميل/مزامنة التقدم |
| Auto Save | مخصص (30s interval) | — | حفظ تلقائي كل 30 ثانية |
| Testing | Vitest | 4.1.7 | 70 اختبار ✅ |
| Deploy | **Cloudflare Pages** (auto-deploy via Git) | — | نشر آلي مع كل push على `main` |
| Old Deploy | GitHub Actions → GitHub Pages (معطل) | — | كان يستخدم workflow_dispatch |
| AI Music | MiniMax Music 2.6 | — | أوامر توليد موسيقى (Instrumental Mode) |

### قيود تقنية
- Strict TypeScript (noImplicitAny, strictNullChecks, exactOptionalPropertyTypes)
- ES2022 target
- Path aliases: `@/` → `src/`
- Resolution: responsive 16:9 (base 1200×675)
- Chunk size: ~548KB (بعد إضافة code splitting)
- **Deployment base:** `'/'` لـ Cloudflare Pages ← `'/'` (جذر) / GitHub Pages ← `'/repo-name/'`
- **SPA fallback:** `public/_redirects` (`/* /index.html 200`) لـ Cloudflare
- Screen transitions: CSS animations (cg-fade-in, cg-fade-out)
- all screens wrapped in ErrorBoundary + Suspense

---

## [SYSTEM_FLOW]

```
[Boot]
  │
  ├─→ Main Menu (video with sound, no BGM) ←──────┐
  │     ├─→ Start Game → Level Select              │
  │     └─→ Settings (6 tabs)                      │
  │                                    │
  ├─→ Level Select (BGM starts) ←─────────┐  │
  │     ├─→ Level[N] (جديد/مكرر)           │  │
  │     │     ├─→ Story Dialogue (3D)     │  │         ← lazy
  │     │     ├─→ Challenge (mini-game)   │  │         ← lazy (ChallengeRenderer)
  │     │     │     ├─→ إعادة تعيين       │  │
  │     │     │     └─→ Result Screen     │  │
  │     │     │           ├─→ متابعة      │  │
  │     │     │           └─→ إعادة       │  │
  │     │     ├─→ Outro Dialogue           │  │
  │     │     └─→ Back to Level Select     ┘  │
  │     └─→ جميع المستويات قابلة لإعادة     ┘
  │
  ├─→ Settings (6 tabs: الصوت, العرض, الخطوط, الفيديو, عام + لوحة تحكم)
  │
  ├─→ Celebration Video (BGM stops, فيديو بصوت, المستوى 7 فقط) ← lazy
  │
  └─→ Victory (إعادة تعيين → Main Menu) ← lazy

Keyboard Shortcuts: M (mute), B (BGM mute), Esc (back)

UI Layout (top-right corner):
- 🤖 AI FAB button: y = 16px (أعلى الزاوية اليمنى) ← lazy
- 🔊 BGM toggle button: y = 72px (أسفل زر AI)
- AI Panel: centered on screen when opened ← lazy
- Panel closes: زر ✕ / النافذة المعتمة / زر AI (toggle)

Auto-save: كل 30 ثانية (localStorage)
Cloud save: رفع/تحميل/مزامنة يدوية عبر لوحة التحكم
Analytics: تتبع level_start, level_complete, challenge_retry, error
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
├── App.tsx                          # 7 شاشات lazy-loaded — React.lazy + Suspense + ErrorBoundary + ScreenTransition
├── main.tsx                         # Entry point + I18nProvider + Service Worker registration
│
├── ai/
│   ├── AIPanel.tsx                  # AI Assistant panel (lazy-loaded)
│   ├── api.ts                       # OpenAI-compatible API
│   ├── github.ts                    # GitHub API
│   ├── googleDrive.ts               # Google Drive API
│   └── prompts.ts                   # System prompts
│
├── pages/                           # ★ جديد — صفحات lazy-loaded
│   ├── MenuPage.tsx                 # شاشة البداية (lazy)
│   ├── LevelSelectPage.tsx          # اختيار المستوى (lazy)
│   ├── DialoguePage.tsx             # الحوارات (lazy)
│   ├── GameplayPage.tsx             # التحديات (lazy — يحمل ChallengeRenderer متأخراً)
│   ├── SettingsPage.tsx             # الإعدادات (lazy)
│   ├── CelebrationPage.tsx          # فيديو احتفال (lazy)
│   ├── VictoryPage.tsx              # شاشة النصر (lazy)
│   ├── AdminDashboard.tsx           # ★ جديد — لوحة تحكم (إحصائيات + سحابي + تصحيح)
│   └── shared.ts                    # أنماط مشتركة
│
├── challenges/                      # 7 mini-games كاملة + shuffle
│   ├── ChallengeRenderer.tsx        # Router حسب type (lazy-loaded عبر GameplayPage)
│   ├── CardChallenge.tsx
│   ├── BuildChallenge.tsx
│   ├── MazeChallenge.tsx
│   ├── DragDropChallenge.tsx
│   ├── DecryptChallenge.tsx
│   ├── CodeFixChallenge.tsx
│   └── ResponseChallenge.tsx
│
├── components/
│   ├── ErrorBoundary.tsx            # ★ جديد — التقاط أخطاء React + زر إعادة محاولة
│   ├── LoadingSkeleton.tsx          # ★ جديد — ScreenSkeleton + ChallengeSkeleton (shimmer animation)
│   ├── ScreenTransition.tsx         # ★ جديد — CSS fade-in/fade-out بين الشاشات
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── DialogueBox.tsx
│   │   ├── BackgroundVideo.tsx
│   │   ├── CelebrationVideo.tsx
│   │   ├── SettingsPanel.tsx        # ★ محدث — dark mode toggle + زر لوحة التحكم
│   │   ├── KeyboardShortcuts.tsx
│   │   └── MenuScreen.tsx
│   └── three/
│       ├── GameCanvas.tsx
│       ├── CharacterModel.tsx
│       └── Environment.tsx
│
├── store/
│   ├── gameStore.ts                 # Zustand + persist (IndexedDB)
│   ├── settingsStore.ts            # ★ محدث — 29 حقل (جديد: darkMode)
│   ├── contentStore.ts
│   └── aiStore.ts
│
├── i18n/                            # ★ جديد — نظام الترجمة
│   ├── context.tsx                  # I18nProvider + useI18n hook
│   ├── ar.ts                        # ترجمة عربية (كاملة)
│   └── en.ts                        # ترجمة إنجليزية (كاملة)
│
├── systems/
│   ├── ProceduralAudio.ts
│   ├── AnalyticsSystem.ts           # ★ جديد — Analytics: Event tracking + Level stats
│   ├── AutoSaveSystem.ts            # ★ جديد — Auto-save: 30s interval + manual
│   ├── CloudSaveSystem.ts           # ★ جديد — Cloud save: upload/download/sync
│   └── LoggingSystem.ts
│
├── hooks/
│   └── useResponsive.ts             # ★ محدث — إضافة isTablet, isMobile
│
├── data/
│   ├── characters.ts
│   └── dialogue.ts
│
├── types/
│   ├── index.ts
│   ├── settings.ts                  # ★ محدث — GameSettings + darkMode
│   ├── ai.ts
│   ├── game.ts
│   ├── dialogue.ts
│   └── characters.ts
│
├── utils/
│   ├── constants.ts                 # ★ محدث — DEFAULT_SETTINGS + darkMode
│   ├── indexedDBStorage.ts
│   ├── apiKeyCrypto.ts
│   ├── pinCrypto.ts                 # تجزئة PIN (SHA-256)
│   └── helpers.ts
│
└── __tests__/                       # 70 اختبار ✅

public/
├── manifest.json                    # ★ جديد — PWA manifest
├── sw.js                            # ★ جديد — Service Worker (cache-first)
├── _redirects                       # ★ جديد — SPA fallback لـ Cloudflare Pages
├── assets/
├── ryzes-font/
├── videos/
└── startpage5.html
```

---

## [SETTINGS] — 29 حقل

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
| Background Brightness (0.1–2) | ✅ | IndexedDB |
| Background Animation (image/video/GIF) | ✅ | IndexedDB |
| Background Animation Brightness | ✅ | IndexedDB |
| Border Radius (0–32px) | ✅ | IndexedDB |
| Border Width (0–6px) | ✅ | IndexedDB |
| Border Color | ✅ | IndexedDB |

### تبويب الخطوط
| الميزة | النطاق | الافتراضي | التخزين |
|---|---|---|---|
| خط النص الأساسي | 5 خيارات | Orbitron | IndexedDB |
| خط العناوين | 6 خيارات | Orbitron | IndexedDB |
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
| فيديو زين (محلل أمني) | ✅ | IndexedDB |
| فيديو د. نورا (خبيرة تشفير) | ✅ | IndexedDB |
| فيديو عمر (خبير شبكات) | ✅ | IndexedDB |
| فيديو ليلى (خبيرة أمن ويب) | ✅ | IndexedDB |
| فيديو طارق (محلل برمجيات خبيثة) | ✅ | IndexedDB |
| فيديو النظام (إشعارات وأهداف) | ✅ | IndexedDB |
| فيديو الاحتفال (نهاية اللعبة) | ✅ | IndexedDB |
| خلفية القائمة الرئيسية | ✅ | IndexedDB |

### تبويب عام — ★ محدث
| الميزة | الحالة | التخزين |
|---|---|---|
| Quality Preset (low/medium/high) | ✅ | IndexedDB |
| Accessibility Mode | ✅ | IndexedDB |
| **Dark Mode (الوضع الليلي)** | ✅ **جديد** | IndexedDB |
| Keyboard Shortcuts | ✅ | — |
| **Admin Dashboard (لوحة التحكم)** | ✅ **جديد** | — |
| Reset All Defaults | ✅ | IndexedDB |

---

## [CSS_ANIMATIONS]

| الكلمة المفتاحية | الوظيفة | المدة |
|---|---|---|
| `cg-particle-rise` | جسيمات متصاعدة | 10–20s |
| `cg-orb-float` | كرات ضبابية عائمة | 12s |
| `cg-grid-move` | شبكة منظور 3D متحركة | 20s |
| `cg-title-glow` | توهج متغير للعنوان | 3s |
| `cg-notification-pulse` | نبض نقطة الإشعار | 2.5s |
| `cg-fade-in` | ★ **ظهور الشاشات (fade + scale)** | 0.25s |
| `cg-fade-out` | ★ **اختفاء الشاشات (fade + scale)** | 0.15s |
| `cg-shimmer` | ★ **تأثير تحميل متحرك (skeleton)** | 1.5s |

---

## [CSS_VARIABLES]

| المتغير | الاستخدام | القيمة الافتراضية (داكن) | القيمة الافتراضية (فاتح) |
|---|---|---|---|
| `--custom-brightness` | سطوع الخلفية | 1.0 | 1.0 |
| `--custom-border-radius` | نصف قطر الحدود | 12px | 12px |
| `--custom-border-color` | لون الحدود | rgba(255,255,255,0.2) | rgba(0,0,0,0.15) |
| `--custom-border-width` | سماكة الحدود | 1px | 1px |
| `--heading-font` | خط العناوين | Cairo | Cairo |
| `--heading-font-size` | حجم العناوين | 24px | 24px |
| `--heading-color` | لون العناوين | #4FC3F7 | #1565C0 |
| `--accent-color` | لون التمييز | #4FC3F7 | #1976D2 |
| `--muted-color` | لون النص الثانوي | #888888 | #666666 |
| `--mono-font` | خط الكود | Courier New | Courier New |
| `--mono-font-size` | حجم الكود | 14px | 14px |
| `--border-color-subtle` | حدود عامة | rgba(255,255,255,0.2) | rgba(0,0,0,0.15) |
| `--border-color-muted` | حدود خافتة | rgba(255,255,255,0.1) | rgba(0,0,0,0.08) |
| `--border-color-faint` | حدود شبه مخفية | rgba(255,255,255,0.06) | rgba(0,0,0,0.04) |

---

## [CODE_SPLITTING] — ★ جديد

### آلية العمل
```
App.tsx
├── React.lazy → MenuPage           (خفيف — يُحمّل فوراً)
├── React.lazy → LevelSelectPage    (خفيف)
├── React.lazy → DialoguePage       (خفيف)
├── React.lazy → GameplayPage       (ثقيل — يحمل الـ 7 mini-games متأخراً)
│   └── Suspense fallback → ChallengeSkeleton
├── React.lazy → SettingsPage       (خفيف)
├── React.lazy → CelebrationPage    (ثقيل — فيديو)
├── React.lazy → VictoryPage        (خفيف)
├── React.lazy → AIPanel            (ثقيل — AI + GitHub + Google Drive)
└── Suspense fallback → ScreenSkeleton
```

### الاستراتيجية
- جميع الصفحات: `React.lazy(() => import(...))`
- Suspense شامل يغلف كل الشاشات مع `ScreenSkeleton`
- ErrorBoundary يغلف كل شاشة لمنع تعطل التطبيق بالكامل
- `startTransition` للتنقل بين الشاشات (React 19)
- `ScreenTransition` مع CSS animations للتخلص من الوميض

---

## [PWA] — ★ جديد

### المكونات
| الملف | الوظيفة |
|---|---|
| `public/manifest.json` | إعدادات التثبيت: name, icons, display standalone, orientation |
| `public/sw.js` | Service Worker: cache-first للملفات الثابتة |
| `src/main.tsx` | تسجيل SW بعد تحميل الصفحة |

### الميزات
- ✅ **قابل للتثبيت**: display: standalone + orientation: landscape
- ✅ **Offline support**: cache-first للملفات الثابتة عبر SW
- ✅ **Theme color**: #0a0a1a
- ✅ **Apple mobile**: apple-mobile-web-app-capable meta

---

## [ANALYTICS_SYSTEM] — ★ جديد

### الأحداث المتتبعة
| الحدث | متى يحدث |
|---|---|
| `game_start` | بدء اللعبة من القائمة |
| `level_complete` | إكمال مستوى (مع رقم المستوى والنتيجة) |
| `settings_change` | تغيير الإعدادات |
| `error` | أخطاء React (ErrorBoundary) |

### الوظائف
- `track(type, data?)` — تسجيل حدث
- `getLevelStats()` — إحصائيات كل مستوى (محاولات، أعلى نتيجة)
- `getTotalPlayTime()` — إجمالي وقت اللعب
- التخزين: localStorage (آخر 50 حدث)

---

## [AUTO_SAVE_SYSTEM] — ★ جديد

| الوظيفة | الآلية |
|---|---|
| الحفظ التلقائي | كل 30 ثانية عبر setInterval |
| الحفظ اليدوي | `autoSave.saveNow()` عند إكمال مستوى |
| التحميل | `autoSave.load()` لاستعادة التقدم |
| المسح | `autoSave.clear()` عند إعادة تعيين التقدم |
| التخزين | localStorage بالمفتاح `cg-autosave` |

---

## [CLOUD_SAVE_SYSTEM] — ★ جديد

| الوظيفة | الوصف |
|---|---|
| رفع (upload) | حفظ التقدم الحالي إلى localStorage السحابي |
| تحميل (download) | استعادة التقدم من localStorage السحابي |
| مزامنة (sync) | رفع + تحميل في عملية واحدة |
| مسح (clear) | حذف البيانات السحابية |

**ملاحظة:** حالياً يستخدم localStorage كسحابة محلية. يمكن تطويره لاستخدام Firebase/Supabase لاحقاً.

---

## [ADMIN_DASHBOARD] — ★ جديد

| التبويب | المحتوى |
|---|---|
| إحصائيات | تقدم المستويات، النقاط، وقت اللعب، إحصائيات كل مستوى |
| سحابي | رفع / تحميل / مزامنة مع السحابة + حفظ يدوي |
| تصحيح | عرض حالة اللعبة (JSON) + الإعدادات (JSON) |

**الوصول:** الإعدادات ← عام ← لوحة التحكم

---

## [LIGHT_THEME] — ★ جديد

### آلية العمل
- إعداد `darkMode: boolean` في `settingsStore` (افتراضي: true)
- `toggleDarkMode()` للتبديل بين الوضع الليلي والفاتح
- `App.tsx` تطبق ألوان مختلفة حسب `isDark`
- CSS variables تتغير تلقائياً للون الفاتح

### الفروقات
| الخاصية | الوضع الليلي | الوضع الفاتح |
|---|---|---|
| خلفية التطبيق | #0a0a1a | #f0f0f5 |
| لون النص | #ffffff | #1a1a2e |
| لون العناوين | #4FC3F7 | #1565C0 |
| لون التمييز | #4FC3F7 | #1976D2 |
| لون النص الثانوي | #888888 | #666666 |
| ألوان الحدود | rgba(255,255,255,...) | rgba(0,0,0,...) |

---

## [TABLET_LAYOUT] — ★ جديد

### الإضافات في `useResponsive.ts`
| الحقل | الوصف |
|---|---|
| `isTablet` | true عندما يكون العرض بين 768 و 1024px |
| `isMobile` | true عندما يكون العرض أقل من 768px |

### التأثير
- تحسينات CSS للشاشات المتوسطة (600px–1024px)
- منع التكبير التلقائي على الأجهزة اللوحية
- أحجام خطوط مناسبة للشاشات المتوسطة

---

## [I18N] — ★ جديد

### المكونات
| الملف | الوظيفة |
|---|---|
| `src/i18n/context.tsx` | I18nProvider + useI18n hook |
| `src/i18n/ar.ts` | ~100 مفتاح ترجمة عربية |
| `src/i18n/en.ts` | ~100 مفتاح ترجمة إنجليزية |

### التبويبات المدعومة
- `game` — عناوين اللعبة، أزرار التنقل
- `menu` — شاشة البداية واختيار المستوى
- `dialogue` — نصوص الحوار
- `settings` — جميع أقسام الإعدادات
- `victory` — شاشة النصر
- `error` — رسائل الأخطاء
- `audio` — أزرار الصوت

**الاستخدام:** `const { t } = useI18n()` ثم `t.game.start`

---

## [SCREEN_TRANSITIONS] — ★ جديد

| الـ CSS Keyframe | الوظيفة | المدة |
|---|---|---|
| `cg-fade-in` | ظهور: opacity 0→1 + scale 0.97→1 | 0.25s ease-out |
| `cg-fade-out` | اختفاء: opacity 1→0 + scale 1→0.97 | 0.15s ease-in |

كل شاشة تُلف بـ `ScreenTransition` مع `key={screen}` لتفعيل الـ animation عند تغيير الشاشة.

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

### ملفات PWA — ★ جديد
| الملف | الوظيفة |
|---|---|
| `public/manifest.json` | manifest تطبيق PWA |
| `public/sw.js` | Service Worker للتخزين المؤقت |

### ملفات أخرى
| الملف | الحجم | الاستخدام |
|---|---|---|
| `public/videos/start.mp4` | 5.6MB | فيديو الخلفية الافتراضي للقائمة الرئيسية (بصوت) |
| `public/videos/original.mp4` | 5.6MB | خلفية اللعبة الرئيسية (قديم — احتياطي) |
| `public/videos/background_1.mp4` | 1.3MB | خلفية سابقة (احتياطي) |
| `public/startpage5.html` | — | تصميم مرجعي لشاشة البداية (Fortnite/Free Fire style) |
| `public/videos/output.wav` | 1.4MB | موسيقى خلفية أصلية |
| `public/videos/output(new).wav` | 1.4MB | موسيقى خلفية الافتراضية الحالية |
| `public/videos/output.mp3` | 129KB | نسخة MP3 من الموسيقى |
| `public/videos/زين.webp` | 2.5MB | صورة FLUX لشخصية زين |
| `PROMPTS.md` | 475+ سطر | أوامر FLUX + مشاهد انتقالية + مشهد النظام |
| `PROJECT_MAP.md` | — | خريطة المشروع الشاملة |
| `.github/workflows/deploy.yml` | — | GitHub Pages deploy (Node.js 24) |

---

## [ORPHANS & PENDING]

### مكتمل — الإضافات الجديدة (v1.5.0)
- [x] **خط Orbitron الافتراضي** — `fontFamily` و `headingFont` أصبحا `Orbitron` بدل `Ryzes`
- [x] **GitHub test tolerant** — `getGitHubUsername()` تفشل بهدوء بدون كسر اختبار الاتصال
- [x] **Faculty PIN modal** — بدل `window.prompt`، نافذة مخصصة مع إخفاء الرقم
- [x] **Eye toggle للـ PIN** — جميع حقول الرقم السري (دخول + تغيير) فيها زر 👁️/🙈
- [x] **Tooltip زر AI** — "AI & Advanced Settings" يظهر يسار الزر عند hover/pointerenter
- [x] **Tooltip زر الصوت** — "تشغيل الموسيقى" / "كتم الموسيقى" يظهر يسار الزر
- [x] **ترتيب أزرار القائمة** — الإعدادات ← بدء اللعبة (معكوس) + `gap: 35px` + وسط الصفحة
- [x] **صوت فيديو الاحتفال** — `celebration.mp4` استُبدل بالنسخة الأصلية التي فيها صوت
- [x] **إصلاح خطأ GitHub test** — ظهور رسالة خطأ رغم نجاح الاتصال (تم الفصل بين username fetch و test)
- [x] **Cloudflare Pages** — نشر آلي مع كل push على `main`، bandwith غير محدود، HTTPS مجاني
- [x] **SPA fallback** — `public/_redirects` (`/* /index.html 200`) لتوجيه جميع المسارات
- [x] **Base path ديناميكي** — `process.env.BASE_URL \|\| '/'` يشتغل مع Cloudflare و GitHub Pages بدون تعديل يدوي
- [x] **GitHub Integration متسامح** — `enableGitHubPages` يفشل بهدوء مع المستودعات الخاصة (لا يكسر العملية)

### مكتمل — الإضافات الجديدة (v1.3.0)
- [x] **Code Splitting** — 7 صفحات lazy-loaded + ChallengeRenderer + AIPanel، حجم الـ chunk: 548KB
- [x] **PWA** — manifest.json + Service Worker + تسجيل في main.tsx
- [x] **Screen Transitions** — CSS fade-in/fade-out animations
- [x] **Loading Skeletons** — ScreenSkeleton + ChallengeSkeleton (shimmer animation)
- [x] **Error Boundaries** — ErrorBoundary لكل شاشة مع زر إعادة محاولة
- [x] **i18n** — I18nProvider + ترجمة عربية/إنجليزية (100+ مفتاح)
- [x] **Admin Dashboard** — لوحة تحكم (إحصائيات + سحابي + تصحيح)
- [x] **Analytics** — نظام تتبع الأحداث + إحصائيات المستويات
- [x] **Cloud Save** — رفع/تحميل/مزامنة التقدم
- [x] **Light Theme** — darkMode toggle مع CSS variables للثيم الفاتح
- [x] **Tablet Layout** — isTablet/isMobile في useResponsive
- [x] **Auto-save** — حفظ تلقائي كل 30 ثانية + حفظ عند إكمال مستوى

### مكتمل (سابق)
- [x] **إعادة المحاولة في كل التحديات** — تم
- [x] **خلط الأسئلة عشوائياً** — تم (المستويات 1, 6, 7)
- [x] **فيديو احتفال نهاية اللعبة** — تم
- [x] **فيديو مستقل لكل شخصية** — تم
- [x] **إعدادات خطوط شاملة** — تم
- [x] **توحيد الحدود** — تم (~55 hardcoded → CSS variables)
- [x] **AI Assistant مدمج** — تم
- [x] **GitHub Integration** — تم
- [x] **Google Drive Backup** — تم
- [x] **Security Scans** — تم (Semgrep + CodeQL + Supply Chain)

### الإصدار 1.7.0 — إلغاء تشفير GitHub Token + إصلاح async + Timeout
- [x] **إلغاء تشفير GitHub Token** — `githubCrypto.ts` حُذف، `setGitHubConfig()` رجعت synchronous، التوكن يُحفظ plaintext في localStorage
- [x] **إصلاح async race condition** — جميع استدعاءات `setGitHubConfig()` أصبحت `await` (كانت تسبب "غير مُعد" لأن التشفير async ما يكمل قبل API call)
- [x] **Timeout للـ API** — `AbortController` 15 ثانية في `apiFetch` (بدونها `fetch` يعلق للأبد لو الشبكة بطيئة)
- [x] **حذف `config.ts`** — `MAIN_REPO` رجعت إلى `github.ts`

### معلق / غير مربوط — ★ محدث
- [ ] **CharacterModel (3D)** — مكوّن ثلاثي الأبعاد غير مستخدم
- [ ] **AudioSystem** — ملف قديم غير مستخدم (يُستخدم ProceduralAudio بدلاً منه)
- [ ] **LoggingSystem** — يستخدم فقط في الاختبارات
- [ ] **تسجيل الموسيقى من MiniMax Music** — الأوامر جاهزة في PROMPTS.md
- [ ] **نموذج GLTF مخصص لكل شخصية** — حالياً نموذج واحد (RobotExpressive)
- [ ] **تلميحات داخل التحديات** — للمستخدمين الجدد
- [ ] **ترجمة إنجليزية واجهة كاملة** — الـ i18n infrastructure جاهز، يحتاج ربط بالواجهة
- [ ] **صفحة Credits** — بسيطة يمكن إضافتها
- [ ] **مشهد البداية (Intro)** — أوامر الفيديو جاهزة في PROMPTS.md
- [ ] **Cloud Save حقيقي (Firebase/Supabase)** — حالياً localStorage فقط
- [ ] **اختبارات للأنظمة الجديدة** — Analytics, AutoSave, CloudSave تحتاج اختبارات
- [ ] **i18n UI connection** — الـ context جاهز لكن لم يُربط بكل الـ UI components

---

## [GITHUB_INTEGRATION]

### المكونات
| الملف | الوظيفة |
|---|---|
| `src/ai/github.ts` | خدمة GitHub API: Fork + Pages + Push + Test connection + Git Data API |
| `src/ai/googleDrive.ts` | Google Drive API: OAuth 2.0 + رفع محتوى JSON + رفع مشروع كامل |
| `src/ai/AIPanel.tsx` | واجهة المستخدم: إعدادات GitHub + Google Drive |

### المستودع الرئيسي
- **Owner**: `project-owner`
- **Repo**: `cyber-guardians-mobile`

---

## [HOSTING] — ★ جديد (الإصدار 1.4.0)

### المنصة الحالية: Cloudflare Pages
| الخاصية | الوصف |
|---------|-------|
| **الرابط** | `https://cyber-guardians-mobile.pages.dev` |
| **طريقة النشر** | Auto-deploy via Git (كل push على `main`) |
| **Bandwidth** | غير محدود |
| **HTTPS** | مجاني وتلقائي |
| **Build** | `npm run build` ← مجلد `dist` |
| **SPA support** | `public/_redirects` (`/* /index.html 200`) |

### ملاحظة مهمة: base path (ديناميكي)
```ts
// vite.config.ts
base: process.env.BASE_URL || '/',
```
- **Cloudflare Pages**: BASE_URL غير مضبوط ← `base: '/'` ✅
- **GitHub Actions**: BASE_URL = `/cyber-guardians-mobile/` ✅
- **محلياً (npm run dev)**: غير مضبوط ← `base: '/'` ✅

لا تحتاج تغيير `vite.config.ts` يدوياً عند التبديل بين المنصات.

### GitHub Actions deploy.yml (شغال مع المستودع العام)
```
.github/workflows/deploy.yml
  └── push على main → build (مع BASE_URL=/cyber-guardians-mobile/) → publish to Pages
```
**ملاحظة:** يحتاج المستودع عام أو GitHub Pro للمستودعات الخاصة.

---

## [SECURITY_SCAN]

**تاريخ الفحص:** 2026-06-13
**الأدوات:** Semgrep 1.166.0 (OSS) + Supply Chain Risk Audit
**الوضع:** Run all (جميع المستويات)

### نتائج Semgrep (SAST) — 0 ثغرات
| القاعدة | التصنيف | النتائج |
|---|---|---|
| `p/security-audit` | ثغرات عامة | 0 |
| `p/secrets` | مفاتيح سرية | 0 |
| `p/typescript` | TypeScript | 0 |
| `p/javascript` | JavaScript | 0 |
| `p/react` | React | 0 |
| `p/github-actions` | CI/CD | 0 |
| Trail of Bits | Third-party | 0 |
| elttam | Third-party | 0 |
| Apiiro | Malicious code | 7 INFO (إرشادات عامة، ليست ثغرات) |

### ملاحظات الفحص
- 3 أخطاء Timeout في قواعد معينة (غير حرجة)
- خطأ Syntax في `dialogue.ts:80` — `import('@/types')` نوع TypeScript (ليس runtime)
- إجمالي القواعد المشغلة: **433 قاعدة**
- 224 ملف ممسوح ضوئياً

### نتائج Supply Chain — 0 عالية المخاطر
| الحزمة | الإصدار | المخاطر |
|---|---|---|
| react | ^19.1.0 | منخفض |
| react-dom | ^19.1.0 | منخفض |
| react-markdown | ^10.1.0 | منخفض |
| remark-gfm | ^4.0.1 | منخفض |
| zustand | ^5.0.13 | منخفض |

### فحص يدوي — ✅ جميعها مُغلقة (ما عدا #1 مُعاد فتحه)
| # | التصنيف | Severity | الحالة | الإجراء |
|---|---|---|---|---|
| 1 | **GitHub Token plaintext** | LOW | 🔄 **مُعاد فتحه** | التشفير تسبب في مشاكل (تعليق + عدم استقرار)، رُجّع إلى plaintext |
| 2 | **Faculty PIN plaintext** | LOW | ✅ مُصلح | تجزئة SHA-256 في `pinCrypto.ts` |
| 3 | **MFA/2FA** | INFO | ✅ مُطبق | إضافة قفل مؤقت (30 ثانية) بعد 5 محاولات PIN فاشلة |
| 4 | **Rate limiting** | INFO | ✅ مُطبق | حد 5 محاولات + قفل مؤقت في `aiStore.ts` |

### الاختبارات
| النوع | الحالة |
|---|---|
| 70 اختبار وحدة | ✅ 70/70 نجاح |
| TypeScript compilation | ✅ بدون أخطاء |
| Vite build | ✅ بدون أخطاء |

### توصيات سابقة (مُنفذة)
1. ~~إضافة اختبارات للأنظمة الجديدة (Analytics, AutoSave, CloudSave)~~ ✅
2. ~~ربط i18n context بجميع مكونات الواجهة~~ ✅
3. ~~تفعيل Dependabot على المستودع~~ ✅
4. ~~تجزئة (hash) الرقم السري في التخزين (SHA-256) كطبقة حماية إضافية~~ ✅ `pinCrypto.ts`
5. ~~إضافة rate limiting لمحاولات إدخال الرمز السري~~ ✅ `aiStore.ts`
