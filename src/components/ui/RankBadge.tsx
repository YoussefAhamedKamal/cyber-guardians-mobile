import { useGameStore } from '@/store'

export function RankBadge() {
  const rank = useGameStore((s) => s.rank)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '20px',
      background: `${rank.color}22`, border: `1px solid ${rank.color}44`,
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: '16px' }}>{rank.icon}</span>
      <span style={{
        fontSize: '12px', color: rank.color,
        fontWeight: 'bold',
      }}>
        {rank.title}
      </span>
    </div>
  )
}
