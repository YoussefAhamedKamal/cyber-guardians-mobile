import { useGameStore } from '@/store'
import { calculateDailyReward } from '@/utils/scoreCalculator'

interface Props {
  onDone: () => void
}

export function DailyRewardOverlay({ onDone }: Props) {
  const dailyStreakDays = useGameStore((s) => s.dailyStreakDays)
  const addXp = useGameStore((s) => s.addXp)

  const baseReward = 50
  const reward = calculateDailyReward(dailyStreakDays, baseReward)
  const multiplier = 1 + (dailyStreakDays - 1) * 0.1

  const handleClaim = () => {
    addXp(reward)
    onDone()
  }

  const dayLabels = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج']

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
        textAlign: 'center', maxWidth: '400px',
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
          display: 'flex', gap: '6px', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 'bold',
                background: i < dailyStreakDays
                  ? 'linear-gradient(135deg, #FFD700, #FFA000)'
                  : 'rgba(255,255,255,0.1)',
                border: i < dailyStreakDays
                  ? '2px solid #FFD700'
                  : '2px solid rgba(255,255,255,0.2)',
                color: i < dailyStreakDays ? '#000' : '#888',
                boxShadow: i < dailyStreakDays ? '0 0 12px rgba(255,215,0,0.4)' : 'none',
              }}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>{dayLabels[i]}</span>
              <span style={{ fontSize: '8px' }}>{i < dailyStreakDays ? '✓' : ''}</span>
            </div>
          ))}
        </div>

        {/* Multiplier */}
        {dailyStreakDays > 1 && (
          <div style={{
            fontSize: '14px', color: '#FFD700',
            marginBottom: '8px',
          }}>
            ضربة: x{multiplier.toFixed(1)}
          </div>
        )}

        {/* Reward */}
        <div style={{
          fontSize: '36px', fontWeight: 'bold',
          color: '#FFD700', marginBottom: '24px',
          textShadow: '0 0 20px rgba(255,215,0,0.5)',
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
            cursor: 'pointer', transition: 'transform 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          احصل على المكافأة
        </button>
      </div>
    </div>
  )
}
