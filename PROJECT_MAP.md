# Cyber Guardians — PROJECT MAP

> لعبة تعليمية تفاعلية ثلاثية الأبعاد لتعليم أساسيات الأمن السيبراني للمراهقين
> الحالة: **🟢 تشغيل وإنتاج (Live on Cloudflare Pages)**
> الإصدار: **2.0.0** — نظام Gamification الشامل + إصلاحات أمنية ووظيفية

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
  ├─→ Daily Reward Check (إن كان هناك مكافأة يومية)
  │     └─→ DailyRewardOverlay (إذا كان اليوم جديد)
  │
  ├─→ Main Menu (video with sound, no BGM) ←──────┐
  │     ├─→ Start Game → Level Select              │
  │     ├─→ Security Reference (مرجع أمني)         │
  │     ├─→ Quiz (اختبارات)                         │
  │     ├─→ Badges (إنجازات)                        │
  │     ├─→ Leaderboard (لوحة صدارة)                │
  │     ├─→ Daily Missions (مهام يومية)              │
  │     └─→ Settings (6 tabs)                      │
  │                                    │
  ├─→ Level Select (BGM starts) ←─────────┐  │
  │     ├─→ Difficulty Select (4 أوضاع)     │  │
  │     │     ├─→ Level[N] (جديد/مكرر)     │  │
  │     │     │     ├─→ Story Dialogue     │  │         ← lazy
  │     │     │     ├─→ Challenge Intro    │  │         ← جديد
  │     │     │     ├─→ Challenge          │  │         ← lazy (ChallengeRenderer)
  │     │     │     │     ├─→ Timer ⏱️     │  │         ← جديد
  │     │     │     │     ├─→ Hearts ❤️    │  │         ← جديد
  │     │     │     │     ├─→ Combo 🔥     │  │         ← جديد
  │     │     │     │     ├─→ Energy ⚡     │  │         ← جديد
  │     │     │     │     ├─→ Hints 💡      │  │         ← جديد
  │     │     │     │     ├─→ Score Popups  │  │         ← جديد
  │     │     │     │     ├─→ Game Over     │  │         ← جديد
  │     │     │     │     └─→ Result        │  │
  │     │     │     │           ├─→ XP Earned │  │       ← جديد
  │     │     │     │           ├─→ Badge Check│ │       ← جديد
  │     │     │     │           ├─→ Summary   │  │       ← جديد
  │     │     │     │           └─→ Continue  │  │
  │     │     │     ├─→ Outro Dialogue       │  │
  │     │     │     └─→ Back to Level Select ┘  │
  │     │     └─→ جميع المستويات قابلة لإعادة   ┘
  │     └─→ Speed Rush Mode (⚡ سرعة البرق)     ┘
  │
  ├─→ Security Reference (مرجع أمني) ←─────────┐
  │     ├─→ 7 مواضيع أساسية                     │
  │     ├─→ نصوص قصيرة + أمثلة عملية           │
  │     └─→ قائمة جانبية للتنقل                │
  │
  ├─→ Quiz (اختبار متعدد) ←──────────────┐
  │     ├─→ Difficulty Selection          │
  │     ├─→ Timer ⏱️                      │
  │     ├─→ Hints 💡                      │
  │     ├─→ Combo 🔥                      │
  │     ├─→ Energy ⚡                      │
  │     ├─→ Hearts ❤️                     │
  │     └─→ Results + Score Breakdown     │
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

## [GAMIFICATION_SYSTEMS] — ★ جديد (v2.0.0)

###نظرة عامة
نظام Gamification شامل يضيف 28 ميزة تفاعلية مُعاد تصميمها لتناسب طبيعة لعبة Cyber Guardians Mobile.

### البنية التحتية

```
src/
├── store/
│   ├── gameStore.ts                 # ★ محدث — XP, rank, badges, daily, missions, combo
│   ├── settingsStore.ts            # موجود
│   ├── contentStore.ts             # موجود — level/character overrides + modifiedFiles
│   ├── aiStore.ts                  # موجود — AI sessions + streaming + faculty PIN
│   └── index.ts                    # موجود — exports
│
├── data/
│   ├── ranks.ts                     # ★ جديد — 5 مستويات ranks
│   ├── badges.ts                    # ★ جديد — 15 شارة
│   ├── missions.ts                  # ★ جديد — 5 قوالب مهام يومية
│   ├── quizQuestions.ts             # ★ جديد — بنك أسئلة الاختبار
│   ├── assessmentQuestions.ts       # ★ جديد — أسئلة التقييم
│   ├── referenceContent.ts          # ★ جديد — محتوى المرجع الأمني
│   ├── challengeMeta.ts             # ★ جديد — معلومات التحديات
│   ├── characters.ts               # موجود
│   ├── dialogue.ts                  # موجود
│   ├── gameMeta.ts                  # موجود
│   └── gameData.ts                  # موجود — getLevels, getCharacters, getGameMeta
│
├── components/ui/
│   ├── XPBar.tsx                    # ★ جديد — شريط خبرة
│   ├── RankBadge.tsx                # ★ جديد — شارة الرتبة
│   ├── LevelUpOverlay.tsx           # ★ جديد — نافذة ترقية
│   ├── BadgeGrid.tsx                # ★ جديد — شبكة الشارات
│   ├── BadgeUnlockToast.tsx         # ★ جديد — إشعار فتح شارة
│   ├── Leaderboard.tsx              # ★ جديد — لوحة الصدارة
│   ├── DailyRewardOverlay.tsx       # ★ جديد — مكافأة يومية
│   ├── DailyMissions.tsx            # ★ جديد — مهام يومية
│   ├── WeeklyChallengeBanner.tsx    # ★ جديد — تحدي أسبوعي
│   ├── TimerBar.tsx                 # ★ جديد — شريط مؤقت
│   ├── HeartsDisplay.tsx            # ★ جديد — عرض القلوب
│   ├── ComboDisplay.tsx             # ★ جديد — عرض الكومبو
│   ├── EnergyMeter.tsx              # ★ جديد — عرض الطاقة
│   ├── HintButton.tsx               # ★ جديد — زر التلميح
│   ├── GameOverOverlay.tsx          # ★ جديد — شاشة انتهاء اللعبة
│   ├── ScorePopup.tsx               # ★ جديد — نافذة النقاط العائمة
│   ├── Confetti.tsx                 # ★ جديد — تأثير الاحتفال
│   ├── ShareModal.tsx               # ★ جديد — مشاركة النتائج
│   ├── ResetConfirmModal.tsx        # ★ جديد — تأكيد إعادة التعيين
│   ├── PlayerNameInput.tsx          # ★ جديد — إدخال اسم اللاعب
│   ├── PathMap.tsx                  # ★ جديد — خريطة التعلم
│   ├── LessonRecap.tsx              # ★ جديد — ملخص الدروس
│   ├── EncourageToast.tsx           # ★ جديد — رسائل الحماس
│   ├── DifficultySelect.tsx         # ★ جديد — اختيار الصعوبة
│   ├── PreAssessment.tsx            # ★ جديد — تقييم قبل التعلم
│   ├── PostAssessment.tsx           # ★ جديد — تقييم بعد التعلم
│   └── TeacherReport.tsx           # ★ جديد — تقرير المعلم
│
├── pages/
│   ├── MenuPage.tsx                 # شاشة البداية
│   ├── LevelSelectPage.tsx          # اختيار المستوى
│   ├── DialoguePage.tsx             # الحوارات
│   ├── GameplayPage.tsx             # التحديات
│   ├── SettingsPage.tsx             # الإعدادات
│   ├── CelebrationPage.tsx          # فيديو احتفال
│   ├── VictoryPage.tsx              # شاشة النصر
│   ├── AdminDashboard.tsx           # لوحة تحكم
│   ├── ReferencePage.tsx            # ★ جديد — المرجع الأمني
│   └── shared.ts                    # أنماط مشتركة
│
├── hooks/
│   ├── useTimer.ts                  # ★ جديد — مؤقت التحدي
│   └── useResponsive.ts            # موجود
│
└── utils/
    ├── scoreCalculator.ts           # ★ جديد — حساب النقاط
    └── helpers.ts                   # موجود
```

---

### [PHASE_1] — النظم الأساسية (Critical)

#### 1.1 XP System (نظام النقاط)
**الملف:** `src/store/gameStore.ts` + `src/components/ui/XPBar.tsx`

**التصميم المُعاد:**
- يُضاف `xp: number` و `xpLevel: number` إلى `gameStore`
- XP يُكسب من: التحديات (+20-50)، الدروس (+15)، الاختبارات (+30-80)، المكافآت اليومية (+50+)
- شريط XP مع تقدم متحرك في أعلى الشاشة
- يُخزّن في IndexedDB عبر gameStore

**التكامل:**
- `addXP(amount)` action في gameStore
- يُعرض في `GameplayPage.tsx` و `MenuPage.tsx`
- يُستخدم لحساب الرتبة

#### 1.2 Rank System (نظام الرتب)
**الملف:** `src/data/ranks.ts` + `src/components/ui/RankBadge.tsx`

**التصميم المُعاد:**
5 رتب بأسماء سايبربانك:

| الرتبة | العنوان | XP المطلوب | اللون |
|--------|---------|------------|-------|
| 1 | طالب أمن | 0 | #888888 |
| 2 | محلل بيانات | 100 | #4FC3F7 |
| 3 | خبير حماية | 300 | #FFB74D |
| 4 | فارس الشبكة | 600 | #CE93D8 |
| 5 | أسطورة الأمن | 1000 | #FFD700 |

**التكامل:**
- `rank: number` في gameStore (محسوب من XP)
- `RankBadge` يُعرض في أعلى الشاشة
- `LevelUpOverlay` يظهر عند ترقية الرتبة
- صوت levelUp من ProceduralAudio

#### 1.3 Badge System (نظام الشارات)
**الملف:** `src/data/badges.ts` + `src/components/ui/BadgeGrid.tsx`

**التصميم المُعاد:**
15 شارة بتصميم سايبربانك:

| الشارة | الرمز | الشرط | الوصف |
|--------|-------|-------|-------|
| المبتدئ | 📖 | إكمال درس واحد | أول خطوة في عالم الأمن |
| المتعلم النشيط | 📚 | إكمال 6 دروس | نصف الطريق إلى الخبرة |
| خبير الأمن | 🎓 | إكمال 12 درس | أتقنت أساسيات الأمن |
| المتفوق | 💎 | نتيجة 100% في الاختبار | إجابة مثالية |
| سريع | ⚡ | إجابة صحيحة في 5 ثوانٍ | سرعة البرق |
| ملك السلسلة | 🔥 | 3 إجابات متتالية | سلسلة لا تُقهر |
| المواظب | 📅 | 3 أيام متتالية | ولاء للتعلم |
| بطل النقاط | 🏆 | 500 نقطة إجمالي | صاعد نحو القمة |
| صائد السرعة | 🎯 | 10 إجابات سريعة | ماهر في الضغط على الوقت |
| العلّامة | 🧠 | إكمال اختبار بدون تلميحات | ذكاء خالص |
| الصابر | 🛡️ | إكمال صعب بقلب واحد | صبر وقوة |
| المكافح | 💪 | إعادة الاختبار 3 مرات | لا يستسلم |
| المواظب الأسبوعي | 🟟 | 7 أيام متتالية | التزام استثنائي |
| المحترف الرقمي | 👑 | الوصول لأعلى رتبة | قمة المحترفين |
| المقيّم | 📊 | إكمال تقييم قبل/بعد | قياس التطور |

**التكامل:**
- `unlockedBadges: string[]` في gameStore
- `checkBadges()` تُنفّذ بعد كل פעולה
- `BadgeGrid` في `MenuPage.tsx` (نافذة منبثقة)
- `BadgeUnlockToast` يظهر عند فتح شارة جديدة

---

### [PHASE_2] — أنظمة التفاعل (High)

#### 2.1 Daily Reward (مكافأة يومية)
**الملف:** `src/components/ui/DailyRewardOverlay.tsx`

**التصميم:**
- يُفحص عند بدء التطبيق
- مكافأة أساسية: 50 XP + 10 XP لكل يوم متتالي
- 7 أيام تتبع بصري (✅/أرقام)
- `lastLoginDate` و `dailyStreakDays` في gameStore
- يربط بـ `GameMeta.dailyRewardEnabled` و `dailyRewardPoints` الموجودة مسبقاً

#### 2.2 Daily Missions (مهام يومية)
**الملف:** `src/data/missions.ts` + `src/components/ui/DailyMissions.tsx`

**التصميم:**
5 قوالب مهام، 3 تُختار عشوائياً كل يوم:

| المهمة | الشرط | المكافأة |
|--------|-------|---------|
| 📖 إكمال درسين | lessonsCompleted >= 2 | +50 XP |
| ✅ 5 إجابات صحيحة | correctAnswers >= 5 | +60 XP |
| 🎯 إكمال اختبار | quizCompleted | +80 XP |
| ⚡ 3 إجابات سريعة | speedAnswers >= 3 | +70 XP |
| 🧠 الإجابة على 8 أسئلة | questionsAnswered >= 8 | +45 XP |

**التكامل:**
- `missions` و `missionsDate` و `missionsProgress` في gameStore
- `useMissionProgress` hook
- `DailyMissions` widget في MenuPage
- `updateMissionProgress()` في challenge completion

#### 2.3 Weekly Challenge (تحدي أسبوعي)
**الملف:** `src/components/ui/WeeklyChallengeBanner.tsx`

**التصميم:**
- تحدي: إكمال التحدي الصعب بدون تلميحات
- مكافأة: +200 XP
- تتبع by ISO week string
- يُعرض في MenuPage كبانر

#### 2.4 Combo System (نظام الكومبو)
**الملف:** `src/components/ui/ComboDisplay.tsx`

**التصميم:**
- `combo: number` و `maxCombo: number` في quizStore
- زيادة عند إجابة صحيحة، إعادة تعيين عند خاطئة
- مكافأة الكومبو: `combo * 5 * multiplier`
- عرض بصري: "🔥 3x streak!"
- يُستخدم في حساب النقاط

#### 2.5 Hearts/Lives (القلوب/الأرواح)
**الملف:** `src/components/ui/HeartsDisplay.tsx`

**التصميم:**
- 3 قلوب (مبتدئ/متوسط)، 2 قلوب (صعب)، ∞ (سرعة البرق)
- فقدان القلب عند إجابة خاطئة أو انتهاء الوقت
- Game Over عند 0 قلوب
- عرض: ❤️❤️❤️

#### 2.6 Per-Question Timer (مؤقت لكل سؤال)
**الملف:** `src/hooks/useTimer.ts` + `src/components/ui/TimerBar.tsx`

**التصميم:**
- عد تنازلي: 45s (مبتدئ)، 30s (متوسط)، 20s (صعب)، 10s (سرعة البرق)
- شريط بصري: أخضر → برتقالي → أحمر
- انتهاء الوقت = إجابة خاطئة + فقدان قلب

#### 2.7 Pre/Post Assessment (تقييم قبل/بعد)
**الملف:** `src/data/assessmentQuestions.ts` + `src/components/ui/PreAssessment.tsx`

**التصميم:**
- 8 أسئلة ثابتة (مختلفة عن بنك الاختبار)
- تقييم قبل التعلم + تقييم بعد 12 درس
- حساب نسبة التحسن
- يُعرض في MenuPage كبانر

---

### [PHASE_3] — أنظمة التعلم والاختبار (High)

#### 3.1 Challenge Intros (مقدمات التحديات)
**الملف:** `src/components/ui/ChallengeIntro.tsx`

**التصميم:**
- نص قصير (30 ثانية قراءة) يظهر قبل كل تحدي
- يشرح المفهوم الأساسي الذي يتعلمه اللاعب
- مثال: "اليوم ستتعلم كيف تكشف الرسائل المشبوهة..."
- مدمج في `DialoguePage.tsx` كجزء من الحوار introductions
- يُخزّن في `dialogue.ts` كسطر إضافي لكل مستوى

**التكامل:**
- يظهر تلقائياً قبل بدء التحدي
- يمكن تخطيه مثل الحوار العادي
- يُعطي سياق بدون كسر تدفق اللعب

#### 3.2 Post-Challenge Summary (ملخص بعد التحدي)
**الملف:** `src/components/ui/ChallengeSummary.tsx`

**التصميم:**
- يظهر بعد إكمال كل تحدي (في صفحة النتائج)
- معلومة إضافية تُثّبت التعلم
- مثال: "تذكّر: الرسائل المشبوهة غالبًا ما تحتوي على روابط مزيفة..."
- تصميم: بطاقة ملونة مع أيقونة + نص مختصر
- يُختفي بعد 5 ثوانٍ أو بالنقر

**التكامل:**
- يظهر في `GameplayPage.tsx` بعد Result
- يُخزّن في `dialogue.ts` كـ `summary` لكل مستوى
- مكافأة +5 XP للمشاهدة

#### 3.3 Security Reference (مرجع الأمن)
**الملف:** `src/pages/ReferencePage.tsx` + `src/data/referenceContent.ts`

**التصميم:**
- صفحة مرجعية واحدة تغطي 7 مواضيع أساسية
- محتوى: نصوص قصيرة + أمثلة عملية + نصائح
- قائمة جانبية للتنقل بين المواضيع
- تصميم: بطاقة لكل موضوع مع أيقونة الشخصية المناسبة

| الموضوع | الشخصية | المحتوى |
|---------|---------|---------|
| احتيال البريد الإلكتروني | زين | أنواع الاحتيال + علامات التعرف |
| كلمات المرور | نورا | قواعد كلمة المرور القوية |
| البرمجيات الخبيثة | طارق | أنواع الفيروسات + الحماية |
| أمن الشبكات | عمر | الجدران النارية + VPN |
| التشفير | نورا | مفاهيم التشفير الأساسية |
| أمن الويب | ليلى | SQLi + XSS + HTTPS |
| الاستجابة للحوادث | زين | خطوات التعامل مع الاختراق |

**التكامل:**
- يُعرض من `MenuPage.tsx` كزر "مرجع أمني"
- يُخزّن المحتوى في `referenceContent.ts`
- يُتابع قراءة المستخدم (اختياري)

#### 3.4 Quiz System (نظام الاختبار)
**الملف:** `src/data/quizQuestions.ts` + `src/components/ui/DifficultySelect.tsx`

**التصميم:**
- بنك أسئلة متعدد (20+ سؤال)
- 4 أوضاع صعوبة (مبتدئ/متوسط/صعب/سرعة البرق)
- نظام توقيت + تلميحات + كومبو + طاقة
- صفحة نتائج مع تفاصيل النقاط

#### 3.5 Hints System (نظام التلميحات)
**الملف:** `src/components/ui/HintButton.tsx`

**التصميم:**
- 3 تلميحات لكل اختبار (0 في وضع السرعة)
- كل تلميح يحذف خيارين خاطئين
- يكلف 5 نقاط
- عداد التلميحات المتبقي

#### 3.6 Energy Meter (مقياس الطاقة)
**الملف:** `src/components/ui/EnergyMeter.tsx`

**التصميم:**
- 0-100% أثناء الاختبار
- صحيح: +12 (أو +20 إذا كومبو >= 2)
- خاطئ/منتهي الوقت: -15
- عند 100%: +30 XP مكافأة + إعادة تعيين

---

### [PHASE_4] — مكونات الواجهة (Medium)

#### 4.1 Difficulty Selection (اختيار الصعوبة)
**الملف:** `src/components/ui/DifficultySelect.tsx`

| الوضع | الأسئلة | الوقت/سؤال | القلوب | المضاعف |
|--------|---------|------------|--------|---------|
| 🟢 مبتدئ | 5 | 45s | 3 | x1 |
| 🟡 متوسط | 7 | 30s | 3 | x1.5 |
| 🔴 محترف | 10 | 20s | 2 | x2 |
| ⚡ سرعة البرق | 10 | 10s | ∞ | x3 |

#### 4.2 Game Over Overlay (شاشة انتهاء اللعبة)
**الملف:** `src/components/ui/GameOverOverlay.tsx`

- نافذة كاملة عند 0 قلوب
- خيار إعادة المحاولة أو العودة للقائمة

#### 4.3 Score Breakdown Popups (نافذة النقاط)
**الملف:** `src/components/ui/ScorePopup.tsx`

- نقاط أساسية: `20 * multiplier`
- مكافأة السرعة: `timeRemaining * 0.5 * multiplier`
- مكافأة الكومبو: `combo * 5 * multiplier`
- نوافذ عائمة متحركة

#### 4.4 Player Name (اسم اللاعب)
**الملف:** `src/components/ui/PlayerNameInput.tsx`

- إدخال نصي في الصفحة الرئيسية
- يُخزّن في gameStore
- يُستخدم في لوحة الصدارة

---

### [PHASE_5] — الاجتماعي والتجهيز (Low)

#### 5.1 Share System (نظام المشاركة)
**الملف:** `src/components/ui/ShareModal.tsx`

- مشاركة عبر Twitter, Facebook, WhatsApp
- نسخ إلى الحافظة
- نص مُنسّق مع emojis و hashtags

#### 5.2 Confetti (تأثير الاحتفال)
**الملف:** `src/components/ui/Confetti.tsx`

- Canvas-based: 120 جسيم، 6 ألوان
- يظهر عند نتيجة 80%+ في الاختبار

#### 5.3 Teacher Report (تقرير المعلم)
**الملف:** `src/components/ui/TeacherReport.tsx`

- تصدير CSV: اسم اللاعب، أفضل نتيجة، إجمالي النقاط، الدروس المكتملة، عدد الشارات، تقييم قبل/بعد، نسبة التحسن

#### 5.4 Encouragement Toast (رسائل الحماس)
**الملف:** `src/components/ui/EncourageToast.tsx`

- رسائل سياقية أثناء اللعب:
  - كومبو 3: "🔥 ثلاثية رائعة! استمر!"
  - كومبو 5: "⚡ خمسة متتالية! أنت خارق!"
  - سؤال أخير: "💎 سؤال أخير للكمال!"
  - آخر قلب: "⚠️ آخر قلب! تمسّك!"

#### 5.5 Reset Confirmation (تأكيد إعادة التعيين)
**الملف:** `src/components/ui/ResetConfirmModal.tsx`

- تحذير: "ستفقد جميع بياناتك"
- خيار تأكيد/إلغاء

---

## [LEVEL_MAP]

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
│   ├── api.ts                       # OpenAI-compatible API + URL validation
│   ├── github.ts                    # GitHub API + token encryption + Vite proxy
│   ├── googleDrive.ts               # Google Drive API + proxy support
│   └── prompts.ts                   # System prompts
│
├── pages/                           # ★ محدث — صفحات lazy-loaded
│   ├── MenuPage.tsx                 # شاشة البداية (lazy)
│   ├── LevelSelectPage.tsx          # اختيار المستوى (lazy)
│   ├── DialoguePage.tsx             # الحوارات (lazy)
│   ├── GameplayPage.tsx             # التحديات (lazy — يحمل ChallengeRenderer متأخراً)
│   ├── SettingsPage.tsx             # الإعدادات (lazy)
│   ├── CelebrationPage.tsx          # فيديو احتفال (lazy)
│   ├── VictoryPage.tsx              # شاشة النصر (lazy)
│   ├── AdminDashboard.tsx           # لوحة تحكم (إحصائيات + سحابي + تصحيح)
│   ├── ReferencePage.tsx            # ★ جديد — المرجع الأمني
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
│   ├── ErrorBoundary.tsx            # التقاط أخطاء React + زر إعادة محاولة
│   ├── LoadingSkeleton.tsx          # ScreenSkeleton + ChallengeSkeleton (shimmer animation)
│   ├── ScreenTransition.tsx         # CSS fade-in/fade-out بين الشاشات
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── DialogueBox.tsx
│   │   ├── BackgroundVideo.tsx
│   │   ├── CelebrationVideo.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── KeyboardShortcuts.tsx
│   │   ├── MenuScreen.tsx
│   │   ├── XPBar.tsx                # ★ جديد
│   │   ├── RankBadge.tsx            # ★ جديد
│   │   ├── LevelUpOverlay.tsx       # ★ جديد
│   │   ├── BadgeGrid.tsx            # ★ جديد
│   │   ├── BadgeUnlockToast.tsx     # ★ جديد
│   │   ├── Leaderboard.tsx          # ★ جديد
│   │   ├── DailyRewardOverlay.tsx   # ★ جديد
│   │   ├── DailyMissions.tsx        # ★ جديد
│   │   ├── WeeklyChallengeBanner.tsx# ★ جديد
│   │   ├── TimerBar.tsx             # ★ جديد
│   │   ├── HeartsDisplay.tsx        # ★ جديد
│   │   ├── ComboDisplay.tsx         # ★ جديد
│   │   ├── EnergyMeter.tsx          # ★ جديد
│   │   ├── HintButton.tsx           # ★ جديد
│   │   ├── GameOverOverlay.tsx      # ★ جديد
│   │   ├── ScorePopup.tsx           # ★ جديد
│   │   ├── Confetti.tsx             # ★ جديد
│   │   ├── ShareModal.tsx           # ★ جديد
│   │   ├── ResetConfirmModal.tsx    # ★ جديد
│   │   ├── PlayerNameInput.tsx      # ★ جديد
│   │   ├── Shop.tsx                 # ★ جديد — نظام المتجر
│   │   ├── ChallengeIntro.tsx       # ★ جديد — مقدمة التحدي
│   │   ├── ChallengeSummary.tsx     # ★ جديد — ملخص بعد التحدي
│   │   ├── EncourageToast.tsx       # ★ جديد
│   │   ├── DifficultySelect.tsx     # ★ جديد
│   │   ├── PreAssessment.tsx        # ★ جديد
│   │   ├── PostAssessment.tsx       # ★ جديد
│   │   └── TeacherReport.tsx        # ★ جديد
│   └── three/
│       ├── GameCanvas.tsx
│       ├── CharacterModel.tsx
│       └── Environment.tsx
│
├── store/
│   ├── gameStore.ts                 # ★ محدث — XP, rank, badges, daily, missions, combo
│   ├── settingsStore.ts            # موجود
│   ├── contentStore.ts             # موجود — level/character overrides + modifiedFiles
│   ├── aiStore.ts                  # موجود — AI sessions + streaming + faculty PIN
│   └── index.ts                    # موجود — exports
│
├── i18n/
│   ├── context.tsx
│   ├── ar.ts                        # ★ محدث — ترجمات Gamification
│   └── en.ts
│
├── systems/
│   ├── ProceduralAudio.ts         # ✅ مُصلح — cleanup leak
│   ├── AnalyticsSystem.ts
│   ├── AutoSaveSystem.ts          # ✅ مُحدّث — يتوقف عند إخفاء التبويب
│   ├── CloudSaveSystem.ts         # ✅ مُصلح — this binding + try/catch
│   └── LoggingSystem.ts
│
├── hooks/
│   ├── useResponsive.ts
│   └── useTimer.ts                  # ★ جديد
│
├── data/
│   ├── characters.ts
│   ├── dialogue.ts                  # ★ محدث — إضافة intro + summary لكل مستوى
│   ├── ranks.ts                     # ★ جديد
│   ├── badges.ts                    # ★ جديد
│   ├── missions.ts                  # ★ جديد
│   ├── quizQuestions.ts             # ★ جديد
│   ├── assessmentQuestions.ts       # ★ جديد
│   └── referenceContent.ts          # ★ جديد — محتوى المرجع الأمني
│
├── types/
│   ├── index.ts
│   ├── settings.ts
│   ├── ai.ts
│   ├── game.ts                      # ★ محدث — إضافة أنواع Gamification
│   ├── quiz.ts                      # ★ جديد
│   └── learning.ts                  # ★ جديد
│
├── utils/
│   ├── constants.ts
│   ├── indexedDBStorage.ts
│   ├── apiKeyCrypto.ts              # ✅ مُحدّث — تشفير XOR (يعمل على HTTP)
│   ├── pinCrypto.ts                 # ✅ مُحدّث — SHA-256 pure JS (بدلاً من crypto.subtle)
│   ├── helpers.ts
│   ├── scoreCalculator.ts           # ★ جديد
│   └── missionGenerator.ts          # ★ جديد
│
└── __tests__/                       # 70 اختبار ✅
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
| **Dark Mode (الوضع الليلي)** | ✅ | IndexedDB |
| Keyboard Shortcuts | ✅ | — |
| **Admin Dashboard (لوحة التحكم)** | ✅ | — |
| Reset All Defaults | ✅ | IndexedDB |

---

## [CSS_ANIMATIONS] — ★ محدث

| الكلمة المفتاحية | الوظيفة | المدة |
|---|---|---|
| `cg-particle-rise` | جسيمات متصاعدة | 10–20s |
| `cg-orb-float` | كرات ضبابية عائمة | 12s |
| `cg-grid-move` | شبكة منظور 3D متحركة | 20s |
| `cg-title-glow` | توهج متغير للعنوان | 3s |
| `cg-notification-pulse` | نبض نقطة الإشعار | 2.5s |
| `cg-fade-in` | ظهور الشاشات (fade + scale) | 0.25s |
| `cg-fade-out` | اختفاء الشاشات (fade + scale) | 0.15s |
| `cg-shimmer` | تأثير تحميل متحرك (skeleton) | 1.5s |
| `cg-xp-fill` | تعبئة شريط XP | 0.5s |
| `cg-badge-unlock` | فتح شارة | 0.8s |
| `cg-level-up` | ترقية رتبة | 2.5s |
| `cg-combo-pop` | ظهور الكومبو | 0.3s |
| `cg-confetti-fall` | سقوط الاحتفال | 3s |
| `cg-float-up` | صعود النقاط العائمة | 1.5s |
| `cg-heart-beat` | نبض القلب | 1s |
| `cg-heart-pulse` | **★ جديد** — نبض القلب الأخير | 1.5s |
| `cg-heart-glow` | **★ جديد** — توهج القلب | 2s |
| `cg-rank-glow` | **★ جديد** — توهج الرتبة | 3s |
| `cg-rank-spin` | **★ جديد** — دوران أيقونة الرتبة | 4s |
| `cg-xp-icon-pulse` | **★ جديد** — نبض أيقونة الخبرة | 2s |
| `cg-xp-shimmer` | **★ جديد** — تأثير لمعان شريط الخبرة | 2s |
| `cg-shake` | **★ جديد** — اهتزاز عند إجابة خاطئة | 0.3s |

---

## [CSS_VARIABLES] — ★ محدث

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
| `--xp-color` | **★ جديد** — لون شريط XP | #FFD700 | #F57F17 |
| `--rank-color` | **★ جديد** — لون الرتبة | #4FC3F7 | #1565C0 |
| `--combo-color` | **★ جديد** — لون الكومبو | #FF6B35 | #E65100 |
| `--energy-color` | **★ جديد** — لون الطاقة | #76FF03 | #33691E |
| `--heart-color` | **★ جديد** — لون القلوب | #FF1744 | #C62828 |

---

## [IMPLEMENTATION_PLAN] — ★ جديد

### المرحلة 1: النظم الأساسية (Critical) — 3-5 أيام
| الميزة | الملفات | التعقيد | الحالة |
|--------|---------|---------|--------|
| XP System | gameStore, XPBar, scoreCalculator | متوسط | ✅ مكتمل |
| Rank System | ranks.ts, RankBadge, LevelUpOverlay | متوسط | ✅ مكتمل |
| Badge System | badges.ts, BadgeGrid, BadgeUnlockToast | عالي | ✅ مكتمل |
| Player Name | PlayerNameInput, gameStore | سهل | ✅ مكتمل |

### المرحلة 2: أنظمة التفاعل (High) — 4-6 أيام
| الميزة | الملفات | التعقيد | الحالة |
|--------|---------|---------|--------|
| Daily Reward | DailyRewardOverlay, gameStore | متوسط | ✅ مكتمل |
| Daily Missions | missions.ts, DailyMissions | عالي | ✅ مكتمل |
| Weekly Challenge | WeeklyChallengeBanner, gameStore | متوسط | ✅ مكتمل |
| Combo System | ComboDisplay, gameStore, scoreCalculator | متوسط | ✅ مكتمل |
| Hearts System | HeartsDisplay, GameOverOverlay, gameStore | متوسط | ✅ مكتمل |
| Timer | TimerBar, useTimer, gameStore | متوسط | ✅ مكتمل |
| Pre/Post Assessment | assessmentQuestions, PreAssessment, PostAssessment | عالي | ✅ مكتمل |

### المرحلة 3: أنظمة التعلم والاختبار (High) — 4-6 أيام
| الميزة | الملفات | التعقيد | الحالة |
|--------|---------|---------|--------|
| Challenge Intros | ChallengeIntro, challengeMeta | سهل | ✅ مكتمل |
| Challenge Summary | ChallengeSummary, challengeMeta | سهل | ✅ مكتمل |
| Security Reference | ReferencePage, referenceContent | متوسط | ✅ مكتمل |
| Quiz System | quizQuestions, DifficultySelect | عالي | ✅ مكتمل |
| Score Popup | ScorePopup | سهل | ✅ مكتمل |
| Confetti | Confetti | سهل | ✅ مكتمل |

### المرحلة 4: مكونات الواجهة (Medium) — 3-4 أيام
| الميزة | الملفات | التعقيد |
|--------|---------|---------|
| Difficulty Selection | DifficultySelect, gameStore | متوسط |
| Game Over Screen | GameOverOverlay, quizStore | سهل |
| Score Breakdown | ScorePopup, scoreCalculator | سهل |
| Encouragement Toast | EncourageToast, useEncouragement | سهل |

### المرحلة 5: الاجتماعي والتجهيز (Low) — 2-3 أيام
| الميزة | الملفات | التعقيد |
|--------|---------|---------|
| Share System | ShareModal | سهل |
| Confetti | Confetti | سهل |
| Teacher Report | TeacherReport, exportReport | سهل |
| Reset Confirmation | ResetConfirmModal | سهل |

### إجمالي الوقت المقدر: 16-23 يوم عمل

---

## [ORPHANS & PENDING]

### مكتمل — الإضافات الجديدة (v2.0.0)
- [x] **XP System** — نظام النقاط
- [x] **Rank System** — نظام الرتب (5 رتب)
- [x] **Badge System** — نظام الشارات (15 شارة) — مُصلح: checkAndUnlockBadges الآن يُنفّذ بعد completeLevel و addXp
- [x] **Player Name** — اسم اللاعب — مُصلح: زر تعديل الاسم في القائمة الرئيسية
- [x] **Daily Reward** — مكافأة يومية
- [x] **Daily Missions** — مهام يومية
- [x] **Weekly Challenge** — تحدي أسبوعي — مُصلح: زر "ابدأ التحدي" الآن يعمل
- [x] **Combo System** — نظام الكومبو
- [x] **Hearts System** — نظام القلوب
- [x] **Timer** — مؤقت لكل سؤال — مُصلح: لا يعرض NaN بعد الآن
- [x] **Hints System** — نظام التلميحات — مُصلح: يعرض محتوى التلميح الفعلي الآن
- [x] **Energy Meter** — مقياس الطاقة
- [x] **Pre/Post Assessment** — تقييم قبل/بعد
- [x] **Challenge Intros** — مقدمات التحديات
- [x] **Challenge Summary** — ملخص بعد التحدي
- [x] **Security Reference** — المرجع الأمني
- [x] **Quiz System** — نظام الاختبارات
- [x] **Difficulty Selection** — اختيار الصعوبة
- [x] **Score Popup** — نافذة النقاط العائمة
- [x] **Confetti** — تأثير الاحتفال
- [x] **Game Over Screen** — شاشة انتهاء اللعبة
- [x] **Share System** — نظام المشاركة
- [x] **Teacher Report** — تقرير المعلم
- [x] **Encouragement Toast** — رسائل الحماس
- [x] **Reset Confirmation** — تأكيد إعادة التعيين
- [x] **Badge Grid** — شبكة الشارات
- [x] **Leaderboard** — لوحة الصدارة
- [x] **Level-Up Overlay** — نافذة الترقية
- [x] **Notification Badge** — شارة الإشعارات
- [x] **Shop System** — نظام المتجر لشراء القلوب والتلميحات والسمات — مُصلح: استخدام xp بدل totalScore
- [x] **Visual Effects** — تأثيرات بصرية للإجابات الصحيحة/الخاطئة (وميض + اهتزاز)
- [x] **Audio Effects** — تأثيرات صوتية محسّنة في جميع التحديات
- [x] **Hearts UI** — تأثيرات نبض وتوهج للقلوب
- [x] **Rank UI** — تأثيرات دوران وتوهج للرتبة
- [x] **XP Bar UI** — تأثير shimmer لشريط الخبرة

### مكتمل — الدمج في اللعبة
- [x] **App.tsx** — دمج DailyRewardOverlay, DailyMissions, WeeklyChallengeBanner, HeartsDisplay, ComboDisplay, Leaderboard, ShareModal, EncourageToast
- [x] **GameplayPage.tsx** — دمج TimerBar, HintButton, EnergyMeter
- [x] **LevelSelectPage.tsx** — دمج DifficultySelect
- [x] **DialoguePage.tsx** — دمج ChallengeIntro, ChallengeSummary
- [x] **gameStore.ts** — إضافة hearts, currentCombo, lastDailyClaimDate
- [x] **contentStore.ts** — إضافة modifiedFiles لتخزين التعديلات على أي ملف
- [x] **github.ts** — إضافة pushSourceFilesToGitHub() لرفع أي ملف إلى GitHub
- [x] **googleDrive.ts** — تعديل uploadContentToDrive() لرفع ملفات .ts بدلاً من JSON
- [x] **AIPanel.tsx** — تعديل زري "رفع إلى GitHub" و"رفع المحتوى فقط" لدعم جميع الملفات
- [x] **contentStore.ts** — إضافة getModifiedFiles() لاسترجاع التعديلات المحفوظة
- [x] **prompts.ts** — إضافة قسم "ط — تعديل ملف مصدر" مع JSON type "file"
- [x] **AIPanel.tsx** — تبويب "📁 ملفات" في FacultyDataEditor لتعديل أي ملف يدوياً
- [x] **AIPanel.tsx** — زر AI "نوع: file" يدعم تعديل الملفات عبر المحادثة
- [x] **AIPanel.tsx** — خيار "🔄 رفع تلقائي عند التعديل" مع subscriber على contentStore

### مكتمل — الإضافات السابقة (v1.8.1)
- [x] **فحص وجود المستودع** — `pushContentToGitHub` يتحقق من وجود المستودع قبل الرفع
- [x] **رسالة خطأ واضحة** — `المستودع X/Y غير موجود. أنشئ مستودعاً جديداً أولاً.`
- [x] **إصلاح GitHub Integration** — `copyEntireRepo` يستخدم Contents API
- [x] **ملفات ثنائية** — دعم رفع .mp4, .mp3, .wav, .ttf
- [x] **ملفات كبيرة** — مهلة 120 ثانية للوسائط
- [x] **تشغيل محلي** — إضافة قسم تشغيل اللعبة على Windows/macOS/Linux
- [x] **مؤشر حالة GitHub** — شريط دائم أثناء الرفع/الإنشاء
- [x] **PIN Changer** — يستخدم `hashPin()` مباشرة
- [x] **اختبار الاتصال** — رسائل خطأ أوضح
- [x] **Throttle التدفق** — تحديث store كل 80ms أثناء streaming AI

### مكتمل (سابق)
- [x] **Code Splitting** — 7 صفحات lazy-loaded
- [x] **PWA** — manifest.json + Service Worker
- [x] **Screen Transitions** — CSS fade-in/fade-out
- [x] **Loading Skeletons** — ScreenSkeleton + ChallengeSkeleton
- [x] **Error Boundaries** — ErrorBoundary لكل شاشة
- [x] **i18n** — I18nProvider + ترجمة عربية/إنجليزية
- [x] **Admin Dashboard** — لوحة تحكم
- [x] **Analytics** — نظام تتبع الأحداث

### تحديثات UI الأخيرة (v2.1.0)
- [x] **شريط عنوان Windows-style** — أزرار ─ □ ✕ مثل نظام Windows
- [x] **أحجام نوافذ ثلاثية** — صغير (30%) | متوسط (50%) | ملء (100%)
- [x] **قائمة زر أيمن** — التحكم في السمة، حجم الخط، الصوت، حجم النافذة
- [x] **Resize يدوي** — سحب الحواف لتغيير حجم النافذة
- [x] **Move** — سحب الشريط العلوي لتحريك النافذة
- [x] **Minimize** — إخفاء النافذة (تظهر فقط زر AI العائم)
- [x] **ContextMenuProvider** — قائمة سياق شاملة للتحكم في الصفحة
- [x] **Custom Events** — `panel-size-change` لتغيير حجم النافذة

### التوثيق والمخططات
- [x] **cyber-guardians-diagram.excalidraw** — مخطط شامل مع Gamification + File Editor
- [x] **خريطة اللعبة الشامة محدثة.excalidraw.png** — تصدير PNG للمخطط
- [x] **AI_ADVANCED_SETTINGS_DIAGRAM.excalidraw** — مخطط AI & Advanced Settings (64 عنصر)
- [x] **🤖 AI & Advanced Settings — الدليل التفصيلي الشامل.png** — تصدير PNG للمخطط
- [x] **AI_ADVANCED_SETTINGS_GUIDE.md** — دليل تفصيلي لـ AI & Advanced Settings (9 أقسام)
- [x] **Cloud Save** — رفع/تحميل/مزامنة
- [x] **Light Theme** — darkMode toggle
- [x] **Tablet Layout** — isTablet/isMobile
- [x] **Auto-save** — حفظ تلقائي كل 30 ثانية
- [x] **إعادة المحاولة في كل التحديات** — تم
- [x] **خلط الأسئلة عشوائياً** — تم
- [x] **فيديو احتفال نهاية اللعبة** — تم
- [x] **فيديو مستقل لكل شخصية** — تم
- [x] **إعدادات خطوط شاملة** — تم
- [x] **توحيد الحدود** — تم
- [x] **AI Assistant مدمج** — تم
- [x] **GitHub Integration** — تم
- [x] **Google Drive Backup** — تم
- [x] **Security Scans** — تم

---

## [GITHUB_INTEGRATION]

### المكونات
| الملف | الوظيفة |
|---|---|
| `src/ai/github.ts` | خدمة GitHub API: Fork + Pages + Push + Test connection + Contents API |
| `src/ai/googleDrive.ts` | Google Drive API: OAuth 2.0 + رفع محتوى JSON + رفع مشروع كامل |
| `src/ai/AIPanel.tsx` | واجهة المستخدم: إعدادات GitHub + Google Drive |

### المستودع الرئيسي
- **Owner**: `YoussefAhamedKamal`
- **Repo**: `cyber-guardians-mobile`

### طريقة العمل
| الزر | الوظيفة | API المستخدم |
|---|---|---|
| **🔄 رفع إلى GitHub** | رفع جميع الملفات المعدّلة (characters, dialogue, gameMeta + أي ملفات أخرى من modifiedFiles) | Contents API |
| **📄 رفع المحتوى فقط** | رفع الملفات الأصلية .ts إلى Google Drive (وليس JSON) | Google Drive API |
| **📦 رفع المشروع كامل** | نسخ المشروع الكامل من GitHub الرئيسي إلى Google Drive | GitHub + Drive API |
| **🟡 إنشاء مستودع جديد** | نسخ كل الملفات في مستودع جديد | Contents API |

### مهلات الطلبات
| نوع الملف | المهلة |
|---|---|
| ملفات نصية (.ts, .tsx, .json) | 30 ثانية |
| ملفات وسائط (.mp4, .mp3, .wav, .ttf) | 120 ثانية |

---

## [HOSTING]

### المنصة الحالية: Cloudflare Pages
| الخاصية | الوصف |
|---------|-------|
| **الرابط** | `https://cyber-guardians-mobile.pages.dev` |
| **طريقة النشر** | Auto-deploy via Git (كل push على `main`) |
| **Bandwidth** | غير محدود |
| **HTTPS** | مجاني وتلقائي |
| **Build** | `npm run build` ← مجلد `dist` |
| **SPA support** | `public/_redirects` (`/* /index.html 200`) |

### ملاحظة مهمة: base path + proxy (ديناميكي)
```ts
// vite.config.ts
base: process.env.BASE_URL || '/',
server: {
  port: 3001,
  proxy: {
    '/github-api': { target: 'https://api.github.com', changeOrigin: true, rewrite: (path) => path.replace(/^\/github-api/, '') },
    '/github-raw': { target: 'https://raw.githubusercontent.com', changeOrigin: true, rewrite: (path) => path.replace(/^\/github-raw/, '') },
  },
}
```
- **Cloudflare Pages**: BASE_URL غير مضبوط ← `base: '/'` ✅
- **GitHub Actions**: BASE_URL = `/cyber-guardians-mobile/` ✅
- **محلياً (npm run dev)**: base = '/' + proxy يحل مشكلة CORS ✅

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

### فحص يدوي — ✅ جميعها مُغلقة
| # | التصنيف | Severity | الحالة | الإجراء |
|---|---|---|---|---|
| 1 | **GitHub Token plaintext** | LOW | 🔄 مُعاد فتحه | التشفير تسبب في مشاكل |
| 2 | **Faculty PIN plaintext** | LOW | ✅ مُصلح | تجزئة SHA-256 |
| 3 | **MFA/2FA** | INFO | ✅ مُطبق | قفل مؤقت 30 ثانية |
| 4 | **Rate limiting** | INFO | ✅ مُطبق | حد 5 محاولات |

### الاختبارات
| النوع | الحالة |
|---|---|
| 70 اختبار وحدة | ✅ 70/70 نجاح |
| TypeScript compilation | ✅ بدون أخطاء |
| Vite build | ✅ بدون أخطاء |
