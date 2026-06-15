import { useGameStore } from '@/store'
import { BADGES } from '@/data/badges'

export function BadgeGrid() {
  const unlockedBadges = useGameStore((s) => s.unlockedBadges)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '12px',
      padding: '16px',
    }}>
      {BADGES.map((badge) => {
        const isUnlocked = unlockedBadges.includes(badge.id)
        return (
          <div
            key={badge.id}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '16px 8px',
              borderRadius: '12px',
              background: isUnlocked
                ? 'rgba(255,215,0,0.15)'
                : 'rgba(255,255,255,0.05)',
              border: isUnlocked
                ? '2px solid rgba(255,215,0,0.4)'
                : '2px solid rgba(255,255,255,0.1)',
              opacity: isUnlocked ? 1 : 0.5,
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{
              fontSize: '32px', marginBottom: '8px',
              filter: isUnlocked ? 'none' : 'grayscale(100%)',
            }}>
              {badge.emoji}
            </span>
            <span style={{
              fontSize: '12px', fontWeight: 'bold',
              color: isUnlocked ? '#FFD700' : '#888',
              textAlign: 'center', marginBottom: '4px',
            }}>
              {badge.name}
            </span>
            <span style={{
              fontSize: '10px', color: '#888',
              textAlign: 'center',
            }}>
              {badge.description}
            </span>
          </div>
        )
      })}
    </div>
  )
}
