interface Props {
  current: number
  max: number
}

export function HeartsDisplay({ current, max }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
    }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize: '18px',
            opacity: i < current ? 1 : 0.3,
            transition: 'opacity 0.3s ease',
            animation: i < current ? 'cg-heart-beat 1s ease-in-out infinite' : 'none',
          }}
        >
          ❤️
        </span>
      ))}
      <style>{`
        @keyframes cg-heart-beat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
