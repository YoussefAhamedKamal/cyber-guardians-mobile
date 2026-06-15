import { useGameStore } from '@/store'
import { RANKS } from '@/data/ranks'

interface Props {
  onDone: () => void
}

export function Leaderboard({ onDone }: Props) {
  const totalScore = useGameStore((s) => s.totalScore)
  const playerName = useGameStore((s) => s.playerName)
  const rank = useGameStore((s) => s.rank)

  const currentRank = RANKS.find((r) => r.id === rank.id) || RANKS[0]!

  const mockLeaderboard = [
    { name: 'أحمد', score: 2500, rank: 'خبير أمني' },
    { name: 'سارة', score: 2200, rank: 'محلل تهديدات' },
    { name: playerName, score: totalScore, rank: currentRank.title },
    { name: 'محمد', score: 1800, rank: 'طالب أمن' },
    { name: 'فاطمة', score: 1500, rank: 'طالب أمن' },
  ]

  const sorted = mockLeaderboard.sort((a, b) => b.score - a.score)
  const playerRank = sorted.findIndex((p) => p.name === playerName) + 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      animation: 'cg-fade-in 0.3s ease-out',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '20px', padding: '32px 48px',
        textAlign: 'center', width: '90%', maxWidth: '400px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
        <div style={{
          fontSize: '24px', fontWeight: 'bold',
          color: '#FFD700', marginBottom: '24px',
        }}>
          لوحة الصدارة
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          marginBottom: '24px',
        }}>
          {sorted.map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px',
                background: entry.name === playerName
                  ? 'rgba(255,215,0,0.15)'
                  : 'rgba(255,255,255,0.05)',
                border: entry.name === playerName
                  ? '1px solid rgba(255,215,0,0.4)'
                  : '1px solid transparent',
              }}
            >
              <span style={{
                fontSize: '18px', fontWeight: 'bold',
                color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#888',
                minWidth: '24px',
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '16px' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}
              </span>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{
                  fontSize: '14px', fontWeight: 'bold',
                  color: entry.name === playerName ? '#FFD700' : '#fff',
                }}>
                  {entry.name}
                </div>
                <div style={{ fontSize: '10px', color: '#888' }}>
                  {entry.rank}
                </div>
              </div>
              <span style={{
                fontSize: '14px', fontWeight: 'bold',
                color: '#FFD700',
              }}>
                {entry.score.toLocaleString()} XP
              </span>
            </div>
          ))}
        </div>

        <div style={{
          fontSize: '14px', color: '#888', marginBottom: '16px',
        }}>
          ترتيبك: #{playerRank}
        </div>

        <button
          onClick={onDone}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '12px', padding: '12px 32px',
            fontSize: '16px', color: '#fff',
            cursor: 'pointer',
          }}
        >
          إغلاق
        </button>
      </div>
    </div>
  )
}
