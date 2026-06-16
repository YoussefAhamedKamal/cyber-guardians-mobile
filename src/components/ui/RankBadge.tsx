import { useGameStore } from '@/store'

export function RankBadge() {
  const rank = useGameStore((s) => s.rank)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '20px',
      background: `linear-gradient(135deg, ${rank.color}22, ${rank.color}11)`,
      border: `1px solid ${rank.color}44`,
      backdropFilter: 'blur(8px)',
      boxShadow: `0 0 12px ${rank.color}33`,
      animation: 'cg-rank-glow 3s ease-in-out infinite',
    }}>
      <span style={{
        fontSize: '16px',
        animation: 'cg-rank-spin 4s linear infinite',
      }}>{rank.icon}</span>
      <span style={{
        fontSize: '12px', color: rank.color,
        fontWeight: 'bold',
        textShadow: `0 0 8px ${rank.color}66`,
      }}>
        {rank.title}
      </span>
      <style>{`
        @keyframes cg-rank-glow {
          0%, 100% { box-shadow: 0 0 12px ${rank.color}33; }
          50% { box-shadow: 0 0 20px ${rank.color}55; }
        }
        @keyframes cg-rank-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
