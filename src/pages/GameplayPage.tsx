import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
import { ChallengeSkeleton } from '@/components/LoadingSkeleton'
import { useGameStore } from '@/store'
import { TimerBar } from '@/components/ui/TimerBar'
import { HintButton } from '@/components/ui/HintButton'
import { EnergyMeter } from '@/components/ui/EnergyMeter'
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
  const [timeLeft, setTimeLeft] = useState(30)
  const [energy, setEnergy] = useState(50)
  const [hintsLeft, setHintsLeft] = useState(3)

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

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

  const timerColor = timeLeft > 20 ? '#4CAF50' : timeLeft > 10 ? '#FFC107' : '#F44336'

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
      }}>
        <TimerBar timeLeft={timeLeft} totalTime={30} color={timerColor} />
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
        <HintButton hintsLeft={hintsLeft} onUse={handleUseHint} />
      </div>
    </div>
  )
}
