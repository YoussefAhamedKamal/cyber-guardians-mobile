import { useGameStore } from '@/store'
import { getXpForNextRank } from '@/data/ranks'

export function XPBar() {
  const xp = useGameStore((s) => s.xp)
  const rank = useGameStore((s) => s.rank)
  const nextRankXp = getXpForNextRank(xp)
  const prevRankXp = rank.xpRequired
  const progress = nextRankXp > prevRankXp
    ? ((xp - prevRankXp) / (nextRankXp - prevRankXp)) * 100
    : 100

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '4px 12px', borderRadius: '20px',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{
        fontSize: '14px',
        animation: 'cg-xp-icon-pulse 2s ease-in-out infinite',
      }}>{rank.icon}</span>
      <div style={{
        width: '120px', height: '8px', borderRadius: '4px',
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${Math.min(progress, 100)}%`, height: '100%',
          background: `linear-gradient(90deg, ${rank.color}, ${rank.color}dd)`,
          borderRadius: '4px',
          transition: 'width 0.5s ease-out',
          boxShadow: `0 0 8px ${rank.color}66`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
            animation: 'cg-xp-shimmer 2s ease-in-out infinite',
          }} />
        </div>
      </div>
      <span style={{
        fontSize: '12px', color: rank.color,
        fontWeight: 'bold', minWidth: '60px',
        textShadow: `0 0 6px ${rank.color}44`,
      }}>
        {xp} / {nextRankXp}
      </span>
      <style>{`
        @keyframes cg-xp-icon-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes cg-xp-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
