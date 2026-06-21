# Cyber Guardians Mobile — PROJECT MAP

> Educational cybersecurity game for teenagers with AI assistant, faculty editor, GitHub sync, and advanced AI features.
> Status: **🟢 Live on Cloudflare Pages**
> Version: **8.0.0**

---

## [TECH_STACK]

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Build | Vite | 8.x | Bundler / Dev server |
| Language | TypeScript | 6.x | Strict typing |
| UI Framework | React | 19.x | UI / HUD / Menus |
| State | Zustand | 5.x | Game + Settings store (20 stores) |
| Audio | Web Audio API | — | Procedural BGM + 7 SFX types |
| Security | Web Crypto API | — | AES-GCM/AES-CBC encryption, PBKDF2 key derivation, SHA-256 hashing |
| Voice | Web Speech API | — | Voice search (Arabic/English) + audio summaries |
| Persist | IndexedDB (custom) | — | Large file storage (WAV, images) |
| Code Splitting | React.lazy + Suspense | — | Lazy-loaded pages + ChallengeRenderer |
| PWA | manifest.json + Service Worker | — | Standalone app install |
| i18n | Context API (custom) | — | Arabic/English translation |
| Testing | Vitest | — | 70 tests |
| Deploy | **Cloudflare Pages** | — | Auto-deploy via Git push |
| Search Worker | Cloudflare Worker | — | DuckDuckGo search (API + HTML) |
| Local Agent | @cyberguard/agent v1.0.0 | — | npm package, WebSocket |
| AI Music | MiniMax Music 2.6 | — | Music generation (Instrumental Mode) |

### Technical Constraints
- Strict TypeScript (noImplicitAny, strictNullChecks, exactOptionalPropertyTypes)
- ES2022 target
- Path aliases: `@/` → `src/`
- Resolution: responsive 16:9 (base 1200×675)
- Chunk size: ~548KB (after code splitting)
- Deployment base: `'/'` for Cloudflare Pages
- SPA fallback: `public/_redirects` (`/* /index.html 200`)
- Screen transitions: CSS animations (cg-fade-in, cg-fade-out)
- All screens wrapped in ErrorBoundary + Suspense

---

## [SYSTEM_FLOW]

```
[Boot]
  │
  ├─→ Daily Reward Check
  │     └─→ DailyRewardOverlay (if new day)
  │
  ├─→ Main Menu (video with sound, no BGM) ←──────┐
  │     ├─→ Start Game → Level Select              │
  │     ├─→ Security Reference                      │
  │     ├─→ Quiz                                    │
  │     ├─→ Badges                                  │
  │     ├─→ Leaderboard                             │
  │     ├─→ Daily Missions                          │
  │     └─→ Settings (6 tabs)                       │
  │                                    │
  ├─→ Level Select (BGM starts) ←─────────┐  │
  │     ├─→ Difficulty Select (4 modes)     │  │
  │     │     ├─→ Level[N] (new/repeat)     │  │
  │     │     │     ├─→ Story Dialogue     │  │         ← lazy
  │     │     │     ├─→ Challenge Intro    │  │
  │     │     │     ├─→ Challenge          │  │         ← lazy (ChallengeRenderer)
  │     │     │     │     ├─→ Timer        │  │
  │     │     │     │     ├─→ Hearts       │  │
  │     │     │     │     ├─→ Combo        │  │
  │     │     │     │     ├─→ Energy       │  │
  │     │     │     │     ├─→ Hints        │  │
  │     │     │     │     ├─→ Score Popups │  │
  │     │     │     │     ├─→ Game Over    │  │
  │     │     │     │     └─→ Result       │  │
  │     │     │     │           ├─→ XP Earned │  │
  │     │     │     │           ├─→ Badge Check│ │
  │     │     │     │           ├─→ Summary   │  │
  │     │     │     │           └─→ Continue  │  │
  │     │     │     ├─→ Outro Dialogue       │  │
  │     │     │     └─→ Back to Level Select ┘  │
  │     │     └─→ All levels replayable      ┘  │
  │     └─→ Speed Rush Mode                     ┘
  │
  ├─→ Security Reference ←─────────┐
  │     ├─→ 7 core topics          │
  │     ├─→ Short text + examples  │
  │     └─→ Side navigation        │
  │
  ├─→ Quiz (multi-difficulty) ←──────┐
  │     ├─→ Difficulty Selection     │
  │     ├─→ Timer + Hints + Combo   │
  │     ├─→ Energy + Hearts         │
  │     └─→ Results + Score         │
  │
  ├─→ Settings (6 tabs)
  │
  ├─→ Celebration Video (Level 7 only) ← lazy
  │
  └─→ Victory (reset → Main Menu) ← lazy

Keyboard Shortcuts: M (mute), B (BGM mute), Esc (back)

UI Layout (top-right corner):
- AI FAB button: y = 16px ← lazy
- BGM toggle button: y = 72px
- AI Panel: centered, 6 main tabs ← lazy
   - Main tabs: Student, Faculty, Tools, Project, Settings, UI
   - Tools: 13 sub-tabs
   - Project: 4 sub-tabs
   - Skills/Plugins integration with AI chat
   - System prompt injection with project knowledge
   - Usage recording (recordUsage) after every AI reply
- Panel close: ✕ button / backdrop / AI toggle

Auto-save: every 30s (localStorage)
Cloud save: manual upload/download/sync
Analytics: track level_start, level_complete, challenge_retry, error
```

---

## [ARCHITECTURE]

```
src/
├── App.tsx                          # 7 lazy-loaded screens — React.lazy + Suspense + ErrorBoundary
├── main.tsx                         # Entry point + I18nProvider + Service Worker
│
├── ai/
│   ├── AIPanel.tsx                  # AI Assistant panel — 6 main tabs
│   ├── api.ts                       # OpenAI-compatible API + URL validation + direct mode
│   ├── search.ts                    # Web search (DuckDuckGo API + HTML + Worker)
│   ├── deepthink.ts                 # Multi-step reasoning (think → review → answer)
│   ├── skillIntegration.ts          # Auto-detect skill/plugin requests + system prompt injection
│   ├── github.ts                    # GitHub API + token encryption + Vite proxy + sync
│   ├── googleDrive.ts               # Google Drive API + proxy
│   ├── prompts.ts                   # System prompts (Student, Faculty, Search, Deepthink)
│   ├── SkillsTab.tsx                # CRUD skills + drag-drop + effects
│   ├── PluginsTab.tsx               # CRUD plugins + execute
│   ├── ConnectorsTab.tsx            # CRUD connectors + test + clear on disconnect
│   ├── MarketplacePanel.tsx         # Marketplace (35 templates) + filter + search
│   ├── AnalyticsTab.tsx             # Usage stats + charts + local timezone
│   ├── BackupTab.tsx                # Backup + sync + SHA-256 checksum
│   ├── AdvancedSearchTab.tsx        # Smart search + save + history + instructions search
│   ├── AIAssistantTab.tsx           # Summarize + sentiment + search
│   ├── CollaborationTab.tsx         # Share + export + shared links
│   ├── SecurityTab.tsx              # Encryption + hashing + activity log
│   ├── SettingsTab.tsx              # Themes + UI settings
│   ├── CalendarTab.tsx              # Calendar + tasks + reminders
│   ├── ReportsTab.tsx               # Custom reports + analytics + zero-division guard
│   ├── ToolsTab.tsx                 # 13 sub-tabs
│   ├── ProjectTab.tsx               # Knowledge + instructions + shared chats
│   └── LocalAgentTab.tsx            # Local Agent UI (Scan + Skills + Execute)
│
├── pages/
│   ├── MenuPage.tsx                 # Home screen (lazy)
│   ├── LevelSelectPage.tsx          # Level selection (lazy)
│   ├── DialoguePage.tsx             # Dialogues (lazy)
│   ├── GameplayPage.tsx             # Challenges (lazy — ChallengeRenderer loaded separately)
│   ├── SettingsPage.tsx             # Settings (lazy)
│   ├── CelebrationPage.tsx          # Celebration video (lazy)
│   ├── VictoryPage.tsx              # Victory screen (lazy)
│   ├── AdminDashboard.tsx           # Dashboard (stats + cloud + debug)
│   ├── ReferencePage.tsx            # Security reference
│   └── shared.ts                    # Shared styles
│
├── challenges/                      # 7 mini-games + shuffle
│   ├── ChallengeRenderer.tsx        # Route by type (lazy via GameplayPage)
│   ├── CardChallenge.tsx
│   ├── BuildChallenge.tsx
│   ├── MazeChallenge.tsx
│   ├── DragDropChallenge.tsx
│   ├── DecryptChallenge.tsx
│   ├── CodeFixChallenge.tsx
│   └── ResponseChallenge.tsx
│
├── components/
│   ├── ErrorBoundary.tsx            # React error capture + retry button
│   ├── LoadingSkeleton.tsx          # ScreenSkeleton + ChallengeSkeleton (shimmer)
│   ├── ScreenTransition.tsx         # CSS fade-in/fade-out between screens
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
│   │   ├── XPBar.tsx
│   │   ├── RankBadge.tsx
│   │   ├── LevelUpOverlay.tsx
│   │   ├── BadgeGrid.tsx
│   │   ├── BadgeUnlockToast.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── DailyRewardOverlay.tsx
│   │   ├── DailyMissions.tsx
│   │   ├── WeeklyChallengeBanner.tsx
│   │   ├── TimerBar.tsx
│   │   ├── HeartsDisplay.tsx
│   │   ├── ComboDisplay.tsx
│   │   ├── EnergyMeter.tsx
│   │   ├── HintButton.tsx
│   │   ├── GameOverOverlay.tsx
│   │   ├── ScorePopup.tsx
│   │   ├── Confetti.tsx
│   │   ├── ShareModal.tsx
│   │   ├── ResetConfirmModal.tsx
│   │   ├── PlayerNameInput.tsx
│   │   ├── Shop.tsx
│   │   ├── ChallengeIntro.tsx
│   │   ├── ChallengeSummary.tsx
│   │   ├── EncourageToast.tsx
│   │   ├── DifficultySelect.tsx
│   │   ├── PreAssessment.tsx
│   │   ├── PostAssessment.tsx
│   │   ├── TeacherReport.tsx
│   │   └── VoiceButton.tsx          # Voice search + Web Speech API
│   └── three/
│       ├── GameCanvas.tsx
│       ├── CharacterModel.tsx
│       └── Environment.tsx
│
├── store/                           # 20 Zustand stores
│   ├── gameStore.ts                 # XP, rank, badges, daily, missions, combo + NaN guards
│   ├── settingsStore.ts
│   ├── contentStore.ts              # Level/character overrides + modifiedFiles
│   ├── aiStore.ts                   # AI sessions + streaming + faculty PIN
│   ├── skillStore.ts                # CRUD skills + IndexedDB
│   ├── pluginStore.ts               # CRUD plugins + execute + IndexedDB
│   ├── connectorStore.ts            # CRUD connectors + test + IndexedDB
│   ├── projectStore.ts              # Knowledge + instructions + shared chats
│   ├── versionHistoryStore.ts       # Change history + snapshots + restore
│   ├── analyticsStore.ts            # Usage log + stats
│   ├── backupStore.ts               # Backup + sync + IndexedDB
│   ├── advancedSearchStore.ts       # Smart search + operations + save
│   ├── aiAssistantStore.ts          # Summarize + sentiment + smart search
│   ├── collaborationStore.ts        # Share + export + shared links
│   ├── securityStore.ts             # AES-GCM encryption + hashing + activity log
│   ├── uiStore.ts                   # Themes + modes + language + font size
│   ├── calendarStore.ts             # Calendar + tasks + reminders
│   ├── reportsStore.ts              # Custom reports + analytics
│   ├── voiceStore.ts                # Voice search + Web Speech API
│   ├── localAgentStore.ts           # WebSocket client + Agent integration
│   └── index.ts                     # Exports
│
├── i18n/
│   ├── context.tsx
│   ├── ar.ts
│   └── en.ts
│
├── systems/
│   ├── ProceduralAudio.ts
│   ├── AnalyticsSystem.ts
│   ├── AutoSaveSystem.ts            # Pauses when tab hidden
│   ├── CloudSaveSystem.ts
│   └── LoggingSystem.ts
│
├── hooks/
│   ├── useResponsive.ts
│   └── useTimer.ts
│
├── data/
│   ├── characters.ts
│   ├── dialogue.ts                  # Intro + summary per level
│   ├── ranks.ts                     # 5 rank levels
│   ├── badges.ts                    # 15 badges
│   ├── missions.ts                  # 5 daily mission templates
│   ├── quizQuestions.ts             # Quiz question bank
│   ├── assessmentQuestions.ts       # Pre/post assessment questions
│   ├── referenceContent.ts          # Security reference content
│   ├── challengeMeta.ts             # Challenge metadata
│   └── gameData.ts                  # getLevels, getCharacters, getGameMeta
│
├── types/
│   ├── index.ts
│   ├── settings.ts
│   ├── ai.ts                        # 12 tools sub-tabs + 6 project sub-tabs
│   ├── game.ts                      # Gamification types
│   ├── quiz.ts
│   ├── learning.ts
│   ├── skills.ts                    # 12 skill templates
│   ├── plugins.ts                   # 10 plugin templates
│   ├── connectors.ts                # 13 connector templates
│   ├── project.ts
│   ├── versionHistory.ts
│   ├── analytics.ts
│   ├── backup.ts
│   ├── search.ts
│   ├── aiAssistant.ts
│   ├── collaboration.ts
│   ├── security.ts
│   ├── ui.ts
│   ├── calendar.ts
│   ├── reports.ts
│   ├── voice.ts
│   └── localAgent.ts               # Agent types (Tool, Skill, ScanResult, Finding)
│
├── utils/
│   ├── constants.ts
│   ├── indexedDBStorage.ts
│   ├── apiKeyCrypto.ts              # XOR encryption (works over HTTP)
│   ├── pinCrypto.ts                 # SHA-256 pure JS
│   ├── helpers.ts
│   ├── scoreCalculator.ts
│   └── missionGenerator.ts
│
└── __tests__/                       # 70 tests
```

---

## [FEATURES]

### AI System

| Feature | Details |
|---|---|
| Providers | OpenAI, OpenRouter, Google Gemini (default), Ollama, Custom |
| Models | ~16 models total |
| Default Model | Gemini 3.5 Flash (free, 1500 req/day) |
| Deepthink | 3-step reasoning with streaming (think → review → answer) |
| Image Generation | Pollinations.ai integration |
| Faculty Mode | PIN-protected, file editor, content management |

### Main Tabs (6)

| Tab | Arabic | Purpose |
|---|---|---|
| Student | طالب | Student interaction |
| Faculty | هيئة تدريس | Faculty editor + admin |
| Tools | 🛠️ أدوات | Skills, plugins, connectors, marketplace, analytics, etc. |
| Project | 📁 مشروع | Knowledge, instructions, shared chats, history |
| Settings | ⚙ | Sound, display, fonts, video, general |
| UI | 🎨 | Themes, language, font size, compact mode |

### Tools Sub-tabs (13)

| # | Tab | Arabic | Purpose |
|---|---|---|---|
| 1 | Skills | قدرات | CRUD + drag-drop + import/export |
| 2 | Plugins | أدوات | CRUD + execute + endpoint selector + params |
| 3 | Connectors | اتصالات | CRUD + provider-specific auth + test |
| 4 | Marketplace | سوق | 35 templates (12 skills + 10 plugins + 13 connectors) |
| 5 | Local Agent | وكيل | WebSocket agent interface |
| 6 | Analytics | إحصائيات | Daily/weekly/monthly stats + charts |
| 7 | Version History | نسخ | Snapshots + comparison + restore |
| 8 | Advanced Search | بحث | Search across 7 stores + instructions |
| 9 | AI Assistant | مساعد | Summarize + sentiment + smart search |
| 10 | Collaboration | تعاون | Share links + export JSON/MD/HTML/CSV |
| 11 | Security | أمان | AES-GCM/AES-CBC + PBKDF2 + activity log |
| 12 | Calendar | تقويم | Local dates + priorities + categories + reminders |
| 13 | Reports | تقارير | 6 report types + 3 formats + trend analysis |

### Project Sub-tabs (4)

| # | Tab | Arabic | Purpose |
|---|---|---|---|
| 1 | Knowledge | معرفة | File upload + project context |
| 2 | Instructions | تعليمات | Custom instructions for AI |
| 3 | Shared Chats | محادثات | Shared conversation history |
| 4 | History | تاريخ | Change log + version tracking |

### Skill Templates (12)

translator, code_analyzer, summarizer, math_solver, email_writer, researcher, creative_writer, data_analyst, cybersecurity_expert, teacher, content_writer, software_engineer

### Plugin Templates (10)

calculator, database, chart_generator, web_scraper, file_manager, api_caller, stats_analyzer, image_generator, text_editor, search_engine

### Connector Templates (13)

OpenAI, Anthropic, Google, Meta, Mistral, GitHub Copilot, Cursor, Codeium, AWS Bedrock, Azure OpenAI, Google Cloud AI, Ollama, LM Studio

### Gamification System

| System | Details |
|---|---|
| XP | Earn from challenges (+20-50), lessons (+15), quizzes (+30-80), daily rewards (+50+) |
| Ranks | 5 cyberpunk ranks (0 → 1000+ XP) |
| Badges | 15 unlockable achievements |
| Daily Rewards | Base 50 XP + 10 XP per consecutive day |
| Daily Missions | 5 templates, 3 random per day |
| Weekly Challenge | Complete hard challenge without hints (+200 XP) |
| Combo | Streak multiplier (combo × 5 × multiplier) |
| Hearts | 3 (beginner), 2 (hard), ∞ (speed rush) |
| Timer | 45s/30s/20s/10s per difficulty |
| Hints | 3 per quiz, eliminates 2 wrong answers, costs 5 pts |
| Energy | 0-100%, bonus XP at 100% |
| Pre/Post Assessment | 8 fixed questions, improvement percentage |

### Security

| Feature | Implementation |
|---|---|
| Encryption | AES-GCM + AES-CBC (Web Crypto API) |
| Key Derivation | PBKDF2 with salt |
| Hashing | SHA-256 |
| Password Check | Constant-time comparison |
| Activity Log | Encrypted audit trail |

### Collaboration

| Feature | Details |
|---|---|
| Share | Shareable links, export to JSON/MD/HTML/CSV |
| Backup | GitHub sync with SHA-256 checksum, auto-sync |
| Cloud | Upload/download/sync via localStorage + IndexedDB |

### UI

| Feature | Details |
|---|---|
| Themes | 5 UI themes |
| Language | Arabic/English |
| Font Size | Configurable |
| Compact Mode | Toggle |
| Voice Search | Web Speech API (Arabic/English) |

### Level Map (7 Levels)

| # | Name | Vulnerability | Challenge | Notes |
|---|---|---|---|---|
| 1 | Suspicious Message | Phishing | Email classification cards | Shuffle + retry |
| 2 | Open Door | Password | Build password to standard | Retry |
| 3 | Unwanted Guest | Malware | Sokoban maze (push enemies) | 7×7 grid, 4 malware files |
| 4 | Wall Vulnerability | Network | Configure firewall | 6 ports, retry |
| 5 | Encrypted Message | Encryption | Caesar Cipher | Shift 1-10, retry |
| 6 | Compromised Site | Web Security | Fix code (SQLi + XSS) | Shuffle + retry |
| 7 | Final Attack | Incident Response | Multiple choice | 3 steps, celebration video |

---

## [STORES]

| # | Store | Purpose | Persistence |
|---|---|---|---|
| 1 | gameStore | XP, rank, badges, daily, missions, combo + NaN guards | IndexedDB |
| 2 | settingsStore | Audio, display, fonts, video, general settings | IndexedDB |
| 3 | contentStore | Level/character overrides + modifiedFiles | IndexedDB |
| 4 | aiStore | AI sessions + streaming + faculty PIN | IndexedDB |
| 5 | skillStore | CRUD skills + IndexedDB | IndexedDB |
| 6 | pluginStore | CRUD plugins + execute + IndexedDB | IndexedDB |
| 7 | connectorStore | CRUD connectors + test + IndexedDB | IndexedDB |
| 8 | projectStore | Knowledge + instructions + shared chats | IndexedDB |
| 9 | versionHistoryStore | Change history + snapshots + restore | IndexedDB |
| 10 | analyticsStore | Usage log + stats | IndexedDB |
| 11 | backupStore | Backup + sync + IndexedDB | IndexedDB |
| 12 | advancedSearchStore | Smart search + operations + save | IndexedDB |
| 13 | aiAssistantStore | Summarize + sentiment + smart search | IndexedDB |
| 14 | collaborationStore | Share + export + shared links | IndexedDB |
| 15 | securityStore | AES-GCM encryption + hashing + activity log | IndexedDB |
| 16 | uiStore | Themes + modes + language + font size | IndexedDB |
| 17 | calendarStore | Calendar + tasks + reminders | IndexedDB |
| 18 | reportsStore | Custom reports + analytics | IndexedDB |
| 19 | voiceStore | Voice search + Web Speech API | IndexedDB |
| 20 | localAgentStore | WebSocket client + Agent integration | IndexedDB |

---

## [LOCAL_AGENT]

### Overview
Local Agent = a server running on the user's machine that connects the browser to external tools.

### Compatibility

| OS | Shell | Package Managers |
|----|-------|------------------|
| Windows | cmd, powershell | choco, winget, scoop, npm, pip |
| macOS | bash, zsh | brew, pip, npm |
| Linux | bash, fish | apt, yum, pacman, pip, npm, cargo |

### Components

| File | Function |
|---|---|
| `cyberguard-agent/src/server.ts` | WebSocket + HTTP server |
| `cyberguard-agent/src/platform/detector.ts` | OS + package manager detection |
| `cyberguard-agent/src/platform/commandTranslator.ts` | Cross-platform command translation |
| `cyberguard-agent/src/platform/pathResolver.ts` | Path + temp dir resolution |
| `cyberguard-agent/src/parser/skillParser.ts` | SKILL.md parser (frontmatter + commands) |
| `cyberguard-agent/src/parser/pluginParser.ts` | plugin.json parser |
| `cyberguard-agent/src/parser/manifestParser.ts` | Makefile, Dockerfile, requirements.txt |
| `cyberguard-agent/src/executor/commandExecutor.ts` | Command execution with alternatives |
| `cyberguard-agent/src/executor/toolChecker.ts` | Tool availability checker |
| `cyberguard-agent/src/executor/packageInstaller.ts` | Auto-install (pip, npm, apt, brew, choco) |
| `cyberguard-agent/src/executor/alternativesResolver.ts` | Find missing tool alternatives |
| `cyberguard-agent/src/executor/modelResolver.ts` | Model resolution (unrestricted) |
| `cyberguard-agent/src/sandbox/sandbox.ts` | Code isolation (Docker + process) |
| `cyberguard-agent/src/docker/dockerFallback.ts` | Docker fallback for heavy tools |
| `cyberguard-agent/src/cache/smartCache.ts` | Smart caching |
| `cyberguard-agent/src/marketplace/marketplace.ts` | Skills marketplace |
| `cyberguard-agent/src/plugins/semgrep.ts` | Semgrep integration |
| `cyberguard-agent/src/plugins/codeql.ts` | CodeQL integration |
| `cyberguard-agent/src/plugins/slither.ts` | Slither (Solidity) integration |
| `cyberguard-agent/src/plugins/libfuzzer.ts` | libFuzzer (C/C++) integration |
| `cyberguard-agent/src/plugins/skillsDiscovery.ts` | npx skills find/add |
| `src/types/localAgent.ts` | Types |
| `src/ai/localAgent.ts` | WebSocket client |
| `src/store/localAgentStore.ts` | Zustand store |
| `src/ai/LocalAgentTab.tsx` | UI |

### Supported Plugins

| Plugin | Tool | Inputs | Outputs |
|---|---|---|---|
| semgrep | Semgrep CLI | code + language | SARIF findings |
| codeql | CodeQL CLI | code + language | SARIF findings |
| slither | Slither (Python) | Solidity code | Vulnerability report |
| libfuzzer | Clang + LLVM | C/C++ code | Crashes + coverage |
| skills-discovery | npx skills | query | Skill list |

### Features
- **Universal Executor** — reads any instruction file (SKILL.md, plugin.json, Makefile, Dockerfile) and executes everything
- **Cross-platform** — Windows / macOS / Linux
- **Auto-install** — installs missing libraries automatically
- **Alternatives** — finds alternatives for missing tools
- **Model flexibility** — no model restrictions, uses whatever is available
- **Sandboxing** — isolates untrusted code
- **Docker fallback** — runs in isolated container
- **Smart caching** — caches results
- **Skills marketplace** — search + install from the internet

### Installation

```bash
npm install -g @cyberguard/agent
cyberguard-agent start --port 3001 --profile full
```

### Profiles

| Profile | Description |
|---|---|
| minimal | Basic scanning only |
| full | All tools and plugins |
| education | Education-focused configuration |

### Protocol

Game ↔ Agent via WebSocket (`ws://localhost:3001`)

```typescript
// Game → Agent
{ id: "1", type: "scan", payload: { tool: "semgrep", code: "...", language: "python" } }

// Agent → Game
{ id: "1", status: "complete", result: { findings: [...], summary: "Found 3 issues" } }
```

---

## [ORPHANS & PENDING]

### Completed — v8.0.0
- [ ] (current release — no new orphans listed)

### Completed — v7.0.0 (Local Agent)
- [x] **@cyberguard/agent** — npm package with WebSocket server
- [x] **Cross-platform** — Windows, macOS, Linux support
- [x] **Tool plugins** — semgrep, codeql, slither, libfuzzer, skills-discovery
- [x] **Universal executor** — reads SKILL.md, plugin.json, Makefile, Dockerfile
- [x] **Auto-install** — pip, npm, apt, brew, choco
- [x] **Alternatives resolver** — finds substitute tools
- [x] **Model resolver** — unrestricted model selection
- [x] **Docker fallback** — isolated container execution
- [x] **Smart caching** — result caching
- [x] **Skills marketplace** — search and install

### Completed — v6.0.0
- [x] **computeDailyStats** — peakHour + avgDuration
- [x] **computeWeeklyStats** — dailyBreakdown + topItems + topTypes
- [x] **computeMonthlyStats** — growth + mostActiveDay + weeklyBreakdown
- [x] **AnalyticsTab selectedItemType filter**
- [x] **recordChange** — updateSkill/updatePlugin/updateConnector
- [x] **connectorStore recordUsage** — connect/disconnect/testConnection
- [x] **smartSearch** — deterministic scoring
- [x] **SkillsTab drag-and-drop** — real reorder logic
- [x] **Backup GitHub sync** — syncToGitHub/syncFromGitHub via GitHub API
- [x] **Auto-sync** — startAutoSync/stopAutoSync with setInterval
- [x] **SettingsTab disk usage** — navigator.storage.estimate()

### Completed — v5.0.0
- [x] **Remove RSA-OAEP** — removed from security UI (was causing runtime error)
- [x] **Fix Analytics** — computeDailyStats/WeeklyStats/MonthlyStats
- [x] **Fix AI Smart Search** — real search in Skills/Plugins/Knowledge
- [x] **Fix Advanced Search** — instructions branch
- [x] **Fix Connector toggle** — clear credentials on disconnect
- [x] **Fix recordUsage** — Deepthink + Faculty chat
- [x] **Fix downloadPdf** — renamed downloadHtml for UI
- [x] **Fix Backup checksum** — SHA-256 via crypto.subtle
- [x] **Fix AnalyticsTab timezone** — local dates instead of UTC
- [x] **Fix reportsStore trend** — prevent division by zero

### Completed — v4.0.0
- [x] **Plugin executePlugin** — GET query string with URLSearchParams
- [x] **Version History wiring** — recordChange for skillStore, pluginStore, connectorStore
- [x] **Project System Prompt** — buildProjectSystemPrompt via skillIntegration
- [x] **Skill recordUsage** — call after AI reply completion
- [x] **detectSkillRequest fix** — match by name + description
- [x] **detectPluginRequest fix** — match by name + description + stats_analyzer, api_caller
- [x] **Backup expansion** — gameStore, calendarStore, reportsStore, securityStore, uiStore
- [x] **Security algorithm** — AES-GCM/AES-CBC in encrypt/decrypt
- [x] **Reports date filtering** — applied to all report types
- [x] **Plugin execute button** — added to plugin UI
- [x] **AnalyticsTab labels** — fixed truncated Arabic text
- [x] **Plugin template text** — fixed corrupted Arabic
- [x] **Security password hashing** — PBKDF2 with salt
- [x] **Analytics aggregation** — gameStore, skillStore, pluginStore recordUsage
- [x] **BackupData expansion** — game, calendar, reports, security, ui
- [x] **BackupType Language** — type from ui.ts instead of string

### Completed — v3.0.0
- [x] **Security Tab** — AES-GCM + SHA hashing + activity log + auto-lock
- [x] **XP/Score NaN Fix** — Number.isFinite guards
- [x] **Task Calendar** — create/edit/delete + priorities + categories + reminders
- [x] **Custom Reports** — 6 types + tables/charts/summaries + trend analysis
- [x] **Voice Search** — Web Speech API + Arabic/English + pulse effect
- [x] **Web Search** — DuckDuckGo (API + HTML)
- [x] **Search Worker** — Cloudflare Worker (CORS bypass)
- [x] **Multi-layer Search** — Worker → HTML → Direct API
- [x] **Search by Default** — searchEnabled: true
- [x] **Deepthink** — multi-step reasoning (think → review → answer)
- [x] **Direct API Mode** — no Worker
- [x] **Google Gemini Provider** — free 1500 req/day
- [x] **Gemini 3.x Models** — 3.5 Flash / 3.1 Flash Lite / 3 Flash
- [x] **Sync to Existing Repo** — not just new repos
- [x] **Improved Auto-upload** — all modified files
- [x] **compatibility_date 2026-06-01** — Cloudflare API v4 + Workflows API
- [x] **Expanded AI Knowledge** — all subjects, not just cybersecurity
- [x] **Search Worker Setup Guide** — teacher setup guide

### Completed — Earlier (v1.8.1-v2.1.0)
- [x] GitHub repo existence check before push
- [x] Clear error messages for missing repos
- [x] GitHub Integration fix — copyEntireRepo uses Contents API
- [x] Binary file support — .mp4, .mp3, .wav, .ttf
- [x] Large file timeout — 120s for media
- [x] Local playback instructions — Windows/macOS/Linux
- [x] GitHub status indicator — persistent bar during upload
- [x] PIN Changer — uses hashPin()
- [x] Connection test — clearer error messages
- [x] Throttle streaming — 80ms store updates
- [x] Code Splitting — 7 lazy-loaded pages
- [x] PWA — manifest.json + Service Worker
- [x] Screen Transitions — CSS fade-in/fade-out
- [x] Loading Skeletons — ScreenSkeleton + ChallengeSkeleton
- [x] Error Boundaries — per screen
- [x] i18n — Arabic/English
- [x] Admin Dashboard
- [x] Analytics — event tracking
- [x] Windows-style title bar — ─ □ ✕ buttons
- [x] Three window sizes — small (30%) | medium (50%) | full (100%)
- [x] Right-click context menu — theme, font, sound, size
- [x] Manual resize — drag edges
- [x] Drag move — drag title bar
- [x] Minimize — hide window (AI FAB only)
- [x] ContextMenuProvider — full page context menu
- [x] Custom Events — panel-size-change

### Documentation & Diagrams
- [x] cyber-guardians-diagram.excalidraw — full architecture diagram
- [x] AI_ADVANCED_SETTINGS_DIAGRAM.excalidraw — AI & settings (64 elements)
- [x] AI_ADVANCED_SETTINGS_GUIDE.md — detailed guide (9 sections)
- [x] Cloud Save — upload/download/sync
- [x] Light Theme — darkMode toggle
- [x] Tablet Layout — isTablet/isMobile
- [x] Auto-save — every 30 seconds
- [x] Retry in all challenges
- [x] Random question shuffle
- [x] Celebration video — end of game
- [x] Per-character video
- [x] Comprehensive font settings
- [x] Unified borders
- [x] AI Assistant built-in
- [x] GitHub Integration
- [x] Google Drive Backup
- [x] Security Scans

---

## [HOSTING]

| Property | Value |
|---|---|
| Platform | Cloudflare Pages |
| URL | `https://cyber-guardians-mobile.pages.dev` |
| Deploy | Auto-deploy via Git push to `main` |
| Bandwidth | Unlimited |
| HTTPS | Free + automatic |
| Build | `npm run build` → `dist/` |
| SPA | `public/_redirects` (`/* /index.html 200`) |

### Base Path + Proxy (Dynamic)

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
- Cloudflare Pages: BASE_URL unset → `base: '/'`
- GitHub Actions: BASE_URL = `/cyber-guardians-mobile/`
- Local (npm run dev): base = '/' + proxy handles CORS

---

## [SECURITY_SCAN]

**Scan date:** 2026-06-13
**Tools:** Semgrep 1.166.0 (OSS) + Supply Chain Risk Audit

### Semgrep Results (SAST) — 0 vulnerabilities

| Rule Set | Category | Results |
|---|---|---|
| p/security-audit | General | 0 |
| p/secrets | Secrets | 0 |
| p/typescript | TypeScript | 0 |
| p/javascript | JavaScript | 0 |
| p/react | React | 0 |
| p/github-actions | CI/CD | 0 |
| Trail of Bits | Third-party | 0 |
| elttam | Third-party | 0 |
| Apiiro | Malicious code | 7 INFO (general guidance, not vulnerabilities) |

### Manual Review — ✅ All closed

| # | Category | Severity | Status | Action |
|---|---|---|---|---|
| 1 | GitHub Token plaintext | LOW | 🔄 Reopened | Encryption caused issues |
| 2 | Faculty PIN plaintext | LOW | ✅ Fixed | SHA-256 hashing |
| 3 | MFA/2FA | INFO | ✅ Implemented | 30s lockout |
| 4 | Rate limiting | INFO | ✅ Implemented | 5 attempt limit |

### Tests

| Type | Status |
|---|---|
| 70 unit tests | ✅ 70/70 pass |
| TypeScript compilation | ✅ No errors |
| Vite build | ✅ No errors |
