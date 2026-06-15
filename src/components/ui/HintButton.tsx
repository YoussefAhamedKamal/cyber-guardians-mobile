interface Props {
  hintsLeft: number
  onUse: () => void
}

export function HintButton({ hintsLeft, onUse }: Props) {
  return (
    <button
      onClick={onUse}
      disabled={hintsLeft <= 0}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: '8px',
        background: hintsLeft > 0
          ? 'rgba(255,235,59,0.15)'
          : 'rgba(255,255,255,0.05)',
        border: hintsLeft > 0
          ? '1px solid rgba(255,235,59,0.3)'
          : '1px solid rgba(255,255,255,0.1)',
        color: hintsLeft > 0 ? '#FFEB3B' : '#888',
        fontSize: '13px', fontWeight: 'bold',
        cursor: hintsLeft > 0 ? 'pointer' : 'not-allowed',
        opacity: hintsLeft > 0 ? 1 : 0.5,
      }}
    >
      <span>💡</span>
      <span>{hintsLeft}</span>
    </button>
  )
}
