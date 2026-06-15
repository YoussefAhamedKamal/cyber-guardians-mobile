import { useGameStore } from '@/store'

export function WeeklyChallengeBanner() {
  const weeklyChallengeDone = useGameStore((s) => s.weeklyChallengeDone)
  const weeklyChallengeWeek = useGameStore((s) => s.weeklyChallengeWeek)

  const currentWeek = getWeekString()
  const isActive = weeklyChallengeWeek === currentWeek && weeklyChallengeDone

  return (
    <div style={{
      background: isActive
        ? 'rgba(76,175,80,0.15)'
        : 'rgba(255,152,0,0.15)',
      border: isActive
        ? '1px solid rgba(76,175,80,0.3)'
        : '1px solid rgba(255,152,0,0.3)',
      borderRadius: '12px', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <span style={{ fontSize: '24px' }}>
        {isActive ? '✅' : '🏆'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px', fontWeight: 'bold',
          color: isActive ? '#4CAF50' : '#FF9800',
          marginBottom: '2px',
        }}>
          تحدي الأسبوع
        </div>
        <div style={{
          fontSize: '12px', color: '#fff', opacity: 0.8,
        }}>
          {isActive
            ? 'أكملت تحدي هذا الأسبوع!'
            : 'أكمل التحدي الصعب بدون تلميحات'}
        </div>
      </div>
      <div style={{
        fontSize: '14px', fontWeight: 'bold',
        color: '#FFD700',
      }}>
        +200 XP
      </div>
    </div>
  )
}

function getWeekString(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
  const weekNumber = Math.ceil(days / 7)
  return `${now.getFullYear()}W${weekNumber}`
}
