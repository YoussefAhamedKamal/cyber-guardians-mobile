import { useState, useCallback, useEffect } from 'react'
import { useResponsive } from '@/hooks'
import { Button, ProgressBar, DialogueBox, BackgroundVideo, SettingsPanel, CelebrationVideo, MenuScreen } from '@/components/ui'
import { useGameStore, useSettingsStore } from '@/store'
import { AIPanel } from '@/ai/AIPanel'
import { getLevels } from '@/data/gameData'
import { ChallengeRenderer } from '@/challenges'
import { audio } from '@/systems/ProceduralAudio'
import { BASE_URL } from '@/utils/constants'
import type { LevelId } from '@/types'

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

export function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [dialogueIndex, setDialogueIndex] = useState(0)
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
    if (settings.customFontUrl) injectFont(settings.customFontName || 'CustomFont', settings.customFontUrl)
    if (settings.customHeadingFontUrl) injectFont(settings.customHeadingFontName || 'CustomHeadingFont', settings.customHeadingFontUrl)
  }, [settings.customFontUrl, settings.customFontName, settings.customHeadingFontUrl, settings.customHeadingFontName])

  useEffect(() => {
    const vol = settings.muted || settings.bgmMuted ? 0 : settings.bgmVolume
    const bgSrc = settings.customBgUrl || `${BASE_URL}videos/output.wav`
    const stop = audio.playFileBg(bgSrc, vol)
    return () => stop()
  }, [settings.bgmVolume, settings.bgmMuted, settings.muted, settings.customBgUrl])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
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

  const handleStart = useCallback(() => {
    audio.playClick()
    game.startGame()
    setScreen('levelSelect')
  }, [game])

  const handleLevelSelect = useCallback((id: number) => {
    audio.playClick()
    game.setLevel(isValidLevel(id) ? id : 1)
    setDialogueIndex(0)
    setScreen('dialogue')
  }, [game])

  const handleDialogueComplete = useCallback(() => {
    if (dialogueIndex === 0) {
      setDialogueIndex(1)
      setScreen('gameplay')
    } else {
      if (game.currentLevel === 7 && game.completedLevels.has(7)) {
        setScreen('celebration')
      } else {
        setScreen('levelSelect')
      }
      setDialogueIndex(0)
    }
  }, [dialogueIndex, game])

  const handleChallengeComplete = useCallback((score: number) => {
    audio.playLevelUp()
    game.completeLevel(game.currentLevel, score)
    setDialogueIndex(1)
    setScreen('dialogue')
  }, [game])

  const containerStyle: React.CSSProperties = {
    width: responsive.width,
    height: responsive.height,
    position: 'relative',
    overflow: 'hidden',
    background: settings.bgColor,
    color: settings.fontColor,
    fontFamily: `'${settings.fontFamily}', 'Segoe UI', sans-serif`,
    fontSize: `${settings.fontSize}px`,
    direction: 'rtl',
    '--custom-brightness': settings.bgBrightness,
    '--custom-border-radius': `${settings.borderRadius}px`,
    '--custom-border-color': settings.borderColor,
    '--custom-border-width': `${settings.borderWidth}px`,
    '--heading-font': `'${settings.headingFont}', sans-serif`,
    '--heading-font-size': `${settings.headingFontSize}px`,
    '--heading-color': settings.headingColor,
    '--accent-color': settings.accentColor,
    '--muted-color': settings.mutedColor,
    '--mono-font': `'${settings.monoFont}', monospace`,
    '--mono-font-size': `${settings.monoFontSize}px`,
    '--border-color-subtle': 'rgba(255,255,255,0.2)',
    '--border-color-muted': 'rgba(255,255,255,0.1)',
    '--border-color-faint': 'rgba(255,255,255,0.06)',
    '--border-color-success': '#81C784',
    '--border-color-error': '#E57373',
    '--border-color-warning': '#FFB74D',
  } as React.CSSProperties & Record<string, string | number>

  const titleGradient: React.CSSProperties = {
    background: 'linear-gradient(135deg, #4FC3F7, #CE93D8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }

  return (
    <div style={containerStyle}>
      <BackgroundVideo
        blur={screen === 'menu' ? 0 : 2}
        overlayOpacity={screen === 'menu' ? 0 : 0.7}
      />
      {screen === 'menu' && (
        <MenuScreen
          onStart={handleStart}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'levelSelect' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '20px', padding: '32px',
          position: 'relative', zIndex: 1,
        }}>
          <h2 style={{ fontSize: 'var(--heading-font-size)', margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>اختر المستوى</h2>
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <ProgressBar value={game.getProgress()} label="التقدم العام" />
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
            width: '100%', maxWidth: '600px',
          }}>
            {levels.map((l) => {
              const unlocked = l.id === 1 || game.completedLevels.has((l.id - 1) as 1 | 2 | 3 | 4 | 5 | 6)
              const done = game.completedLevels.has(l.id)
              const canPlay = unlocked || done
              return (
                <button
                  key={l.id}
                  disabled={!canPlay}
                  onClick={() => canPlay && handleLevelSelect(l.id)}
                  style={{
                    padding: '20px', borderRadius: 'var(--custom-border-radius)', border: 'var(--custom-border-width) solid',
                    borderColor: done ? 'var(--accent-color)' : unlocked ? 'var(--border-color-subtle)' : 'var(--border-color-faint)',
                    background: done ? 'rgba(79,195,247,0.1)' : unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    color: canPlay ? '#fff' : '#444',
                    cursor: canPlay ? 'pointer' : 'not-allowed',
                    fontSize: '14px', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{done ? <span style={{color:'#81C784'}}>&#x2713;</span> : unlocked ? `0${l.id}` : <span style={{color:'#666'}}>&#x1F512;</span>}</div>
                  <div style={{ fontWeight: 700 }}>{l.title}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{l.subtitle}</div>
                  {done && <div style={{ fontSize: '10px', color: '#4FC3F7', marginTop: '4px' }}>اضغط لإعادة</div>}
                </button>
              )
            })}
          </div>
          <Button variant="ghost" onClick={() => setScreen('menu')}>الرجوع</Button>
        </div>
      )}

      {screen === 'dialogue' && (
        <div style={{
          height: '100%', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.1,
            background: 'radial-gradient(ellipse at 20% 50%, #4FC3F7 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, #CE93D8 0%, transparent 60%)',
          }} />
          <DialogueBox
            lines={dialogueIndex === 0 ? level.intro : level.outro}
            onComplete={handleDialogueComplete}
          />
        </div>
      )}

      {screen === 'gameplay' && (
        <div style={{
          display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            textAlign: 'center', padding: '12px',
            background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <h2 style={{ fontSize: 'var(--heading-font-size)', margin: 0, ...titleGradient, fontFamily: 'var(--heading-font)' }}>{level.title}</h2>
            <div style={{ color: '#888', fontSize: '13px' }}>{level.subtitle}</div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <ChallengeRenderer level={level} onComplete={handleChallengeComplete} />
          </div>
        </div>
      )}

      {screen === 'settings' && (
        <SettingsPanel onBack={() => setScreen('menu')} />
      )}

      {screen === 'celebration' && (
        <CelebrationVideo onEnd={() => setScreen('victory')} />
      )}

      {screen === 'victory' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '24px',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ fontSize: '64px' }}>🏆</div>
          <h1 style={{ fontSize: 'var(--heading-font-size)', margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>تهانينا!</h1>
          <p style={{ color: '#aaa', fontSize: '18px', maxWidth: '400px', textAlign: 'center' }}>
            لقد أتممت جميع المستويات. أنت الآن حارس أمن سيبراني حقيقي!
          </p>
          <p style={{ fontSize: '24px', color: '#4FC3F7' }}>النقاط: {game.totalScore}</p>
          <Button onClick={() => { game.resetProgress(); setScreen('menu') }}>
            لعب مرة أخرى
          </Button>
        </div>
      )}

      {/* Version */}
      <div style={{
        position: 'fixed', bottom: '16px', left: '16px', zIndex: 9999,
        color: 'rgba(255,255,255,0.15)', fontSize: '11px', fontFamily: 'monospace', direction: 'ltr',
      }}>
        v1.1.0
      </div>

      <AIPanel />

      {/* BGM toggle button */}
      <button
        onClick={() => settings.toggleBgmMute()}
        title={settings.bgmMuted || settings.muted ? 'تشغيل الموسيقى الخلفية' : 'كتم الموسيقى الخلفية'}
        style={{
          position: 'fixed', top: '72px', right: '16px', zIndex: 9999,
          width: '44px', height: '44px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)',
          background: (settings.bgmMuted || settings.muted) ? 'rgba(255,82,82,0.2)' : 'rgba(79,195,247,0.2)',
          color: '#fff', fontSize: '20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}
      >
        {(settings.bgmMuted || settings.muted) ? '\u{1F507}' : '\u{1F50A}'}
      </button>
    </div>
  )
}
