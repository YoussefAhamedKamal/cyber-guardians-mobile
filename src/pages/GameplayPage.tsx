import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { ChallengeSkeleton } from '@/components/LoadingSkeleton'
import { useGameStore } from '@/store'
import { TimerBar } from '@/components/ui/TimerBar'
import { HintButton } from '@/components/ui/HintButton'
import { EnergyMeter } from '@/components/ui/EnergyMeter'
import { type DifficultyConfig, DIFFICULTIES } from '@/components/ui/DifficultySelect'
import type { LevelData } from '@/types'

const ChallengeRenderer = lazy(() =>
  import('@/challenges').then((m) => ({ default: m.ChallengeRenderer }))
)

interface Props {
  level: LevelData
  onComplete: (score: number) => void
}

export default function GameplayPage({ level, onComplete }: Props) {
  const game = useGameStore()
  const selectedId = (game as unknown as { selectedDifficulty: string }).selectedDifficulty
  const difficulty = DIFFICULTIES.find((d) => d.id === selectedId) || DIFFICULTIES[1]!
  const [timeLeft, setTimeLeft] = useState(difficulty.timePerQuestion)
  const totalTime = difficulty.timePerQuestion
  const [energy, setEnergy] = useState(50)
  const [hintsLeft, setHintsLeft] = useState(3)
  const completedRef = useRef(false)
  const [tooltip, setTooltip] = useState<string | null>(null)

  // Lose one heart on entering challenge
  useEffect(() => {
    game.loseHeart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Game over when hearts reach 0
  useEffect(() => {
    if (game.hearts <= 0 && !completedRef.current) {
      completedRef.current = true
      onComplete(0)
    }
  }, [game.hearts, onComplete])

  // Timer effect — end game when time runs out
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!completedRef.current) {
        completedRef.current = true
        onComplete(0)
      }
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, onComplete])

  // Energy regeneration
  useEffect(() => {
    const timer = setInterval(() => {
      setEnergy((e) => Math.min(100, e + 2))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleUseHint = useCallback(() => {
    if (hintsLeft > 0 && energy >= 20) {
      setHintsLeft((h) => h - 1)
      setEnergy((e) => Math.max(0, e - 20))
    }
  }, [hintsLeft, energy])

  const timerColor = timeLeft > totalTime * 0.66 ? '#4CAF50' : timeLeft > totalTime * 0.33 ? '#FFC107' : '#F44336'

  const titleGradient: React.CSSProperties = {
    background: 'linear-gradient(135deg, #4FC3F7, #CE93D8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto',
      position: 'relative', zIndex: 1,
    }}>
      {/* Timer Bar */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'center',
      }}
        onMouseEnter={() => setTooltip('الوقت المتبقي للإجابة')}
        onMouseLeave={() => setTooltip(null)}
      >
        <TimerBar timeLeft={timeLeft} totalTime={totalTime} color={timerColor} />
      </div>

      <div style={{
        textAlign: 'center', padding: '12px',
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <h2 style={{ fontSize: 'var(--heading-font-size)', margin: 0, ...titleGradient, fontFamily: 'var(--heading-font)' }}>
          {level.title}
        </h2>
        <div style={{ color: '#888', fontSize: '13px' }}>{level.subtitle}</div>
      </div>

      {/* Energy Meter */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <EnergyMeter energy={energy} />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Suspense fallback={<ChallengeSkeleton />}>
          <ChallengeRenderer level={level} onComplete={onComplete} />
        </Suspense>
      </div>

      {/* Hint Button */}
      <div style={{
        position: 'fixed', bottom: '16px', right: '16px', zIndex: 100,
      }}>
        <div
          onMouseEnter={() => setTooltip('استخدم تلميحاً لمساعدتك')}
          onMouseLeave={() => setTooltip(null)}
        >
          <HintButton hintsLeft={hintsLeft} onUse={handleUseHint} />
        </div>
      </div>

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
