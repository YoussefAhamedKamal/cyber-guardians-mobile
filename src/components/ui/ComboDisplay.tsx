interface Props {
  combo: number
}

export function ComboDisplay({ combo }: Props) {
  if (combo < 2) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '20px',
      background: 'rgba(255,107,53,0.2)',
      border: '1px solid rgba(255,107,53,0.4)',
      animation: 'cg-combo-pop 0.3s ease-out',
    }}>
      <span style={{ fontSize: '16px' }}>🔥</span>
      <span style={{
        fontSize: '14px', fontWeight: 'bold',
        color: '#FF6B35',
      }}>
        {combo}x
      </span>
      <style>{`
        @keyframes cg-combo-pop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
