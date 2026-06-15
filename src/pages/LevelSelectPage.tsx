import { useCallback, useState, startTransition } from 'react'
import { Button, ProgressBar } from '@/components/ui'
import { useGameStore } from '@/store'
import { getLevels } from '@/data/gameData'
import { DifficultySelect, type DifficultyConfig } from '@/components/ui/DifficultySelect'
import { audio } from '@/systems/ProceduralAudio'
import type { LevelId } from '@/types'

interface Props {
  onSelectLevel: (id: number) => void
  onBack: () => void
}

export default function LevelSelectPage({ onSelectLevel, onBack }: Props) {
  const game = useGameStore()
  const levels = getLevels()
  const [showDifficulty, setShowDifficulty] = useState(false)
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<string | null>(null)

  const handleSelect = useCallback((id: number) => {
    audio.playClick()
    setSelectedLevelId(id)
    setShowDifficulty(true)
  }, [])

  const handleDifficultySelect = useCallback((difficulty: DifficultyConfig) => {
    startTransition(() => {
      audio.playClick()
      game.setSelectedDifficulty(difficulty.id)
      game.resetHearts()
      if (selectedLevelId !== null) {
        onSelectLevel(selectedLevelId)
      }
    })
  }, [selectedLevelId, onSelectLevel, game])

  const handleBackFromDifficulty = useCallback(() => {
    setShowDifficulty(false)
    setSelectedLevelId(null)
  }, [])

  if (showDifficulty && selectedLevelId !== null) {
    const level = levels.find((l) => l.id === selectedLevelId)
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: '20px', padding: '32px',
        position: 'relative', zIndex: 1,
      }}>
        <h2 style={{ fontSize: 'var(--heading-font-size)', margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>
          {level?.title || 'اختر الصعوبة'}
        </h2>
        <DifficultySelect onSelect={handleDifficultySelect} />
        <Button variant="ghost" onClick={handleBackFromDifficulty}>الرجوع</Button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '20px', padding: '32px',
      position: 'relative', zIndex: 1,
    }}>
      <h2 style={{ fontSize: 'var(--heading-font-size)', margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>
        اختر المستوى
      </h2>
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
              onClick={() => canPlay && handleSelect(l.id)}
              onMouseEnter={() => setTooltip(done ? 'اضغط لإعادة المستوى' : unlocked ? 'اضغط لبدء المستوى' : 'أكمل المستوى السابق لفتحه')}
              onMouseLeave={() => setTooltip(null)}
              onTouchStart={() => setTooltip(done ? 'اضغط لإعادة المستوى' : unlocked ? 'اضغط لبدء المستوى' : 'أكمل المستوى السابق لفتحه')}
              onTouchEnd={() => setTimeout(() => setTooltip(null), 1500)}
              style={{
                padding: '20px', borderRadius: 'var(--custom-border-radius)', border: 'var(--custom-border-width) solid',
                borderColor: done ? 'var(--accent-color)' : unlocked ? 'var(--border-color-subtle)' : 'var(--border-color-faint)',
                background: done ? 'rgba(79,195,247,0.1)' : unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                color: canPlay ? '#fff' : '#444',
                cursor: canPlay ? 'pointer' : 'not-allowed',
                fontSize: '14px', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                {done ? <span style={{ color: '#81C784' }}>&#x2713;</span> : unlocked ? `0${l.id}` : <span style={{ color: '#666' }}>&#x1F512;</span>}
              </div>
              <div style={{ fontWeight: 700 }}>{l.title}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{l.subtitle}</div>
              {done && <div style={{ fontSize: '10px', color: '#4FC3F7', marginTop: '4px' }}>اضغط لإعادة</div>}
            </button>
          )
        })}
      </div>
      <Button variant="ghost" onClick={onBack}>الرجوع</Button>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 99999,
          background: 'rgba(0,0,0,0.85)', color: '#fff',
          padding: '8px 16px', borderRadius: '8px',
          fontSize: '13px', whiteSpace: 'nowrap',
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}
