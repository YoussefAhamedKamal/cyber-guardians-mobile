import { useGameStore } from '@/store'
import { calculateDailyReward } from '@/utils/scoreCalculator'

interface Props {
  onDone: () => void
}

export function DailyRewardOverlay({ onDone }: Props) {
  const dailyStreakDays = useGameStore((s) => s.dailyStreakDays)
  const addXp = useGameStore((s) => s.addXp)

  const reward = calculateDailyReward(dailyStreakDays, 50)

  const handleClaim = () => {
    addXp(reward)
    onDone()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      animation: 'cg-fade-in 0.3s ease-out',
    }}>
      <div style={{
        background: 'rgba(255,215,0,0.1)',
        border: '2px solid rgba(255,215,0,0.3)',
        borderRadius: '20px', padding: '32px 48px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎁</div>
        <div style={{
          fontSize: '24px', fontWeight: 'bold',
          color: '#FFD700', marginBottom: '8px',
        }}>
          مكافأة يومية!
        </div>
        <div style={{
          fontSize: '16px', color: '#fff', marginBottom: '24px',
        }}>
          يوم {dailyStreakDays} من التزامك
        </div>

        {/* Streak Days */}
        <div style={{
          display: 'flex', gap: '8px', justifyContent: 'center',
          marginBottom: '24px',
        }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 'bold',
                background: i < dailyStreakDays
                  ? 'rgba(255,215,0,0.3)'
                  : 'rgba(255,255,255,0.1)',
                border: i < dailyStreakDays
                  ? '2px solid #FFD700'
                  : '2px solid rgba(255,255,255,0.2)',
                color: i < dailyStreakDays ? '#FFD700' : '#888',
              }}
            >
              {i < dailyStreakDays ? '✓' : i + 1}
            </div>
          ))}
        </div>

        <div style={{
          fontSize: '32px', fontWeight: 'bold',
          color: '#FFD700', marginBottom: '24px',
        }}>
          +{reward} XP
        </div>

        <button
          onClick={handleClaim}
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA000)',
            border: 'none', borderRadius: '12px',
            padding: '12px 48px', fontSize: '18px',
            fontWeight: 'bold', color: '#000',
            cursor: 'pointer',
          }}
        >
          احصل على المكافأة
        </button>
      </div>
    </div>
  )
}
