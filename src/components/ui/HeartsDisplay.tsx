interface Props {
  current: number
  max: number
}

export function HeartsDisplay({ current, max }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '4px 8px', borderRadius: '20px',
      background: 'rgba(229,115,115,0.1)',
      border: '1px solid rgba(229,115,115,0.2)',
    }}>
      {Array.from({ length: max }, (_, i) => {
        const isActive = i < current
        const isLast = i === current - 1
        return (
          <span
            key={i}
            style={{
              fontSize: '18px',
              opacity: isActive ? 1 : 0.2,
              transform: isActive ? 'scale(1)' : 'scale(0.8)',
              transition: 'all 0.3s ease',
              animation: isLast ? 'cg-heart-pulse 1.5s ease-in-out infinite' : isActive ? 'cg-heart-glow 2s ease-in-out infinite' : 'none',
              filter: isActive ? 'drop-shadow(0 0 4px rgba(229,115,115,0.5))' : 'none',
            }}
          >
            {isActive ? '❤️' : '🤍'}
          </span>
        )
      })}
      <style>{`
        @keyframes cg-heart-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes cg-heart-glow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(229,115,115,0.5)); }
          50% { filter: drop-shadow(0 0 8px rgba(229,115,115,0.8)); }
        }
      `}</style>
    </div>
  )
}
