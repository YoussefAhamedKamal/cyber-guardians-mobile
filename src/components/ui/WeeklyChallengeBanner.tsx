import { useState } from 'react'
import { useGameStore } from '@/store'

interface Props {
  onStartChallenge?: () => void
}

export function WeeklyChallengeBanner({ onStartChallenge }: Props) {
  const weeklyChallengeDone = useGameStore((s) => s.weeklyChallengeDone)
  const weeklyChallengeWeek = useGameStore((s) => s.weeklyChallengeWeek)
  const [showDetails, setShowDetails] = useState(false)

  const currentWeek = getWeekString()
  const isDone = weeklyChallengeWeek === currentWeek && weeklyChallengeDone

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setShowDetails(!showDetails)}
        style={{
          background: isDone
            ? 'rgba(76,175,80,0.15)'
            : 'rgba(255,152,0,0.15)',
          border: isDone
            ? '1px solid rgba(76,175,80,0.3)'
            : '1px solid rgba(255,152,0,0.3)',
          borderRadius: '14px', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '28px' }}>
          {isDone ? '✅' : '🏆'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px', fontWeight: 'bold',
            color: isDone ? '#4CAF50' : '#FF9800',
            marginBottom: '2px',
          }}>
            تحدي الأسبوع
          </div>
          <div style={{
            fontSize: '12px', color: '#fff', opacity: 0.8,
          }}>
            {isDone ? 'أكملت تحدي هذا الأسبوع!' : 'اضغط للمعرفة'}
          </div>
        </div>
        <div style={{
          fontSize: '14px', fontWeight: 'bold',
          color: '#FFD700',
        }}>
          +200 XP
        </div>
      </div>

      {/* Challenge Details Panel */}
      {showDetails && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          marginTop: '8px', width: '280px',
          background: 'rgba(20,20,40,0.95)',
          border: '1px solid rgba(255,152,0,0.3)',
          borderRadius: '16px', padding: '20px',
          backdropFilter: 'blur(20px)',
          zIndex: 100,
        }}>
          <h4 style={{ margin: '0 0 12px', color: '#FF9800', fontSize: '16px' }}>
            🏆 التحدي الأسبوعي
          </h4>
          <p style={{ margin: '0 0 12px', color: '#ccc', fontSize: '13px', lineHeight: '1.6' }}>
            أكمل أي مستوى بصعوبة <strong style={{ color: '#FF9800' }}>محترف</strong> أو <strong style={{ color: '#F44336' }}>سرعة البرق</strong> بدون استخدام تلميحات.
          </p>
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '12px',
          }}>
            <span style={{
              padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(244,67,54,0.15)', border: '1px solid rgba(244,67,54,0.3)',
              color: '#F44336', fontSize: '11px', fontWeight: 'bold',
            }}>
              🔴 محترف
            </span>
            <span style={{
              padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(156,39,176,0.15)', border: '1px solid rgba(156,39,176,0.3)',
              color: '#9C27B0', fontSize: '11px', fontWeight: 'bold',
            }}>
              ⚡ سرعة البرق
            </span>
          </div>
          <div style={{
            padding: '10px', borderRadius: '10px',
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid rgba(255,215,0,0.2)',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '12px', color: '#FFD700', fontWeight: 'bold' }}>
              🎁 المكافأة: +200 XP
            </div>
          </div>
          {isDone ? (
            <div style={{
              textAlign: 'center', color: '#4CAF50',
              fontSize: '14px', fontWeight: 'bold',
            }}>
              ✅ أكملت التحدي هذا الأسبوع!
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDetails(false)
                if (onStartChallenge) onStartChallenge()
              }}
              style={{
                width: '100%', padding: '10px',
                background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontWeight: 'bold',
                fontSize: '14px', cursor: 'pointer',
              }}
            >
              ابدأ التحدي
            </button>
          )}
        </div>
      )}
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
