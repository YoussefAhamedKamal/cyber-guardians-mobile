import { useState, useCallback, useEffect, lazy, Suspense, startTransition } from 'react'
import { useResponsive } from '@/hooks'
import { BackgroundVideo } from '@/components/ui'
import { useGameStore, useSettingsStore, useAIStore } from '@/store'
import { ScreenTransition } from '@/components/ScreenTransition'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ScreenSkeleton } from '@/components/LoadingSkeleton'
import { getLevels } from '@/data/gameData'
import { audio } from '@/systems/ProceduralAudio'
import { analytics } from '@/systems/AnalyticsSystem'
import { autoSave } from '@/systems/AutoSaveSystem'
import { BASE_URL } from '@/utils/constants'
import type { LevelId } from '@/types'

const MenuPage = lazy(() => import('@/pages/MenuPage'))
const LevelSelectPage = lazy(() => import('@/pages/LevelSelectPage'))
const DialoguePage = lazy(() => import('@/pages/DialoguePage'))
const GameplayPage = lazy(() => import('@/pages/GameplayPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const CelebrationPage = lazy(() => import('@/pages/CelebrationPage'))
const VictoryPage = lazy(() => import('@/pages/VictoryPage'))
const AIPanel = lazy(() => import('@/ai/AIPanel').then((m) => ({ default: m.AIPanel })))

const FONT_STYLE_ID = 'cg-custom-fonts'

function injectFont(name: string, url: string) {
  const existing = document.getElementById(FONT_STYLE_ID)
  if (existing) existing.remove()
  const style = document.createElement('style')
  style.id = FONT_STYLE_ID
  style.textContent = `@font-face{font-family:'${name}';src:url('${url}') format('truetype');font-weight:normal;font-style:normal;font-display:swap}`
  document.head.appendChild(style)
}

type Screen = 'menu' | 'levelSelect' | 'dialogue' | 'gameplay' | 'settings' | 'celebration' | 'victory'

function isValidLevel(id: number): id is LevelId {
  return id >= 1 && id <= 7
}

function SuspenseFallback() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ScreenSkeleton />
    </div>
  )
}

export function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const panelMaximized = useAIStore((s) => s.panelMaximized)
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [bgmHovered, setBgmHovered] = useState(false)
  const responsive = useResponsive()
  const game = useGameStore()
  const settings = useSettingsStore()
  const levels = getLevels()

  const level = levels.find((l) => l.id === game.currentLevel)
  if (!level) return null

  useEffect(() => {
    audio.setSfxVolume(settings.sfxVolume)
  }, [settings.sfxVolume])

  useEffect(() => {
    autoSave.start()
    return () => autoSave.stop()
  }, [])

  useEffect(() => {
    if (settings.customFontUrl) injectFont(settings.customFontName || 'CustomFont', settings.customFontUrl)
    if (settings.customHeadingFontUrl) injectFont(settings.customHeadingFontName || 'CustomHeadingFont', settings.customHeadingFontUrl)
  }, [settings.customFontUrl, settings.customFontName, settings.customHeadingFontUrl, settings.customHeadingFontName])

  useEffect(() => {
    if (screen === 'menu' || screen === 'celebration' || screen === 'victory') {
      audio.stopBg()
      return
    }
    const vol = settings.muted || settings.bgmMuted ? 0 : settings.bgmVolume
    const bgSrc = settings.customBgUrl || `${BASE_URL}videos/output(new).wav`
    const stop = audio.playFileBg(bgSrc, vol)
    return () => stop()
  }, [screen, settings.bgmVolume, settings.bgmMuted, settings.muted, settings.customBgUrl])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        settings.toggleMute()
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        settings.toggleBgmMute()
      }
      if (e.key === 'Escape') {
        if (screen !== 'menu') {
          e.preventDefault()
          setScreen('menu')
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [settings, screen])

  const navigate = useCallback((next: Screen) => {
    startTransition(() => setScreen(next))
  }, [])

  const handleStart = useCallback(() => {
    audio.playClick()
    game.startGame()
    analytics.track('game_start')
    navigate('levelSelect')
  }, [game, navigate])

  const handleLevelSelect = useCallback((id: number) => {
    audio.playClick()
    game.setLevel(isValidLevel(id) ? id : 1)
    setDialogueIndex(0)
    navigate('dialogue')
  }, [game, navigate])

  const handleDialogueComplete = useCallback(() => {
    if (dialogueIndex === 0) {
      setDialogueIndex(1)
      navigate('gameplay')
    } else {
      if (game.currentLevel === 7 && game.completedLevels.has(7)) {
        navigate('celebration')
      } else {
        navigate('levelSelect')
      }
      setDialogueIndex(0)
    }
  }, [dialogueIndex, game, navigate])

  const handleChallengeComplete = useCallback((score: number) => {
    audio.playLevelUp()
    game.completeLevel(game.currentLevel, score)
    analytics.track('level_complete', { level: game.currentLevel, score })
    autoSave.saveNow()
    setDialogueIndex(1)
    navigate('dialogue')
  }, [game, navigate])

  const isDark = settings.darkMode
  const themeBorder = isDark
    ? { subtle: 'rgba(255,255,255,0.2)', muted: 'rgba(255,255,255,0.1)', faint: 'rgba(255,255,255,0.06)' }
    : { subtle: 'rgba(0,0,0,0.15)', muted: 'rgba(0,0,0,0.08)', faint: 'rgba(0,0,0,0.04)' }

  const containerStyle: React.CSSProperties = {
    width: responsive.width,
    height: responsive.height,
    position: 'relative',
    overflow: 'hidden',
    background: isDark ? settings.bgColor : '#f0f0f5',
    color: isDark ? settings.fontColor : '#1a1a2e',
    fontFamily: `'${settings.fontFamily}', 'Segoe UI', sans-serif`,
    fontSize: `${settings.fontSize}px`,
    direction: 'rtl',
    '--custom-brightness': settings.bgBrightness,
    '--custom-border-radius': `${settings.borderRadius}px`,
    '--custom-border-color': settings.borderColor,
    '--custom-border-width': `${settings.borderWidth}px`,
    '--heading-font': `'${settings.headingFont}', sans-serif`,
    '--heading-font-size': `${settings.headingFontSize}px`,
    '--heading-color': isDark ? settings.headingColor : '#1565C0',
    '--accent-color': isDark ? settings.accentColor : '#1976D2',
    '--muted-color': isDark ? settings.mutedColor : '#666666',
    '--mono-font': `'${settings.monoFont}', monospace`,
    '--mono-font-size': `${settings.monoFontSize}px`,
    '--border-color-subtle': themeBorder.subtle,
    '--border-color-muted': themeBorder.muted,
    '--border-color-faint': themeBorder.faint,
    '--border-color-success': '#81C784',
    '--border-color-error': '#E57373',
    '--border-color-warning': '#FFB74D',
  } as React.CSSProperties & Record<string, string | number>

  return (
    <div style={containerStyle}>
      <BackgroundVideo
        blur={screen === 'menu' ? 0 : 2}
        overlayOpacity={screen === 'menu' ? 0 : 0.7}
        muted={screen !== 'menu'}
      />
      <Suspense fallback={<SuspenseFallback />}>
        <ScreenTransition screenKey={screen}>
          <ErrorBoundary>
            {screen === 'menu' && <MenuPage onStart={handleStart} onSettings={() => navigate('settings')} />}
            {screen === 'levelSelect' && <LevelSelectPage onSelectLevel={handleLevelSelect} onBack={() => navigate('menu')} />}
            {screen === 'dialogue' && <DialoguePage level={level} dialogueIndex={dialogueIndex} onComplete={handleDialogueComplete} />}
            {screen === 'gameplay' && <GameplayPage level={level} onComplete={handleChallengeComplete} />}
            {screen === 'settings' && <SettingsPage onBack={() => navigate('menu')} />}
            {screen === 'celebration' && <CelebrationPage onEnd={() => navigate('victory')} />}
            {screen === 'victory' && <VictoryPage onRestart={() => navigate('menu')} />}
          </ErrorBoundary>
        </ScreenTransition>
      </Suspense>

      <Suspense fallback={null}>
        <AIPanel />
      </Suspense>

      {/* Version */}
      <div style={{
        position: 'fixed', bottom: '16px', left: '16px', zIndex: 9999,
        color: 'rgba(255,255,255,0.15)', fontSize: '11px', fontFamily: 'monospace', direction: 'ltr',
      }}>
        v1.3.0
      </div>

      {/* BGM toggle button */}
      <div
        style={{ position: 'fixed', top: '72px', right: '16px', zIndex: 9999 }}
        onPointerEnter={() => setBgmHovered(true)}
        onPointerLeave={() => setBgmHovered(false)}
      >
      <button
        onClick={() => settings.toggleBgmMute()}
        title={settings.bgmMuted || settings.muted ? 'تشغيل الموسيقى الخلفية' : 'كتم الموسيقى الخلفية'}
        style={{
          display: panelMaximized ? 'none' : 'inline-flex',
          width: '44px', height: '44px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)',
          background: (settings.bgmMuted || settings.muted) ? 'rgba(255,82,82,0.2)' : 'rgba(79,195,247,0.2)',
          color: '#fff', fontSize: '20px', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}
      >
        {(settings.bgmMuted || settings.muted) ? '\u{1F507}' : '\u{1F50A}'}
      </button>
      {bgmHovered && (
        <div style={{
          position: 'absolute', right: '52px', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.85)', color: '#E1BEE7', fontSize: '13px',
          padding: '6px 12px', borderRadius: '8px', whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 9999,
          border: '1px solid rgba(206,147,216,0.3)',
        }}>
          {settings.bgmMuted || settings.muted ? 'تشغيل الموسيقى' : 'كتم الموسيقى'}
        </div>
      )}
      </div>
    </div>
  )
}
