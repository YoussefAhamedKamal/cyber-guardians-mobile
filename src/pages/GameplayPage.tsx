import { lazy, Suspense } from 'react'
import { ChallengeSkeleton } from '@/components/LoadingSkeleton'
import { useGameStore } from '@/store'
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
      <div style={{
        textAlign: 'center', padding: '12px',
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <h2 style={{ fontSize: 'var(--heading-font-size)', margin: 0, ...titleGradient, fontFamily: 'var(--heading-font)' }}>
          {level.title}
        </h2>
        <div style={{ color: '#888', fontSize: '13px' }}>{level.subtitle}</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Suspense fallback={<ChallengeSkeleton />}>
          <ChallengeRenderer level={level} onComplete={onComplete} />
        </Suspense>
      </div>
    </div>
  )
}
