import { useCallback, startTransition } from 'react'
import { Button, ProgressBar } from '@/components/ui'
import { useGameStore } from '@/store'
import { getLevels } from '@/data/gameData'
import { audio } from '@/systems/ProceduralAudio'
import type { LevelId } from '@/types'

interface Props {
  onSelectLevel: (id: number) => void
  onBack: () => void
}

export default function LevelSelectPage({ onSelectLevel, onBack }: Props) {
  const game = useGameStore()
  const levels = getLevels()

  const handleSelect = useCallback((id: number) => {
    startTransition(() => {
      audio.playClick()
      onSelectLevel(id)
    })
  }, [onSelectLevel])

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
    </div>
  )
}
