interface ProgressBarProps {
  value: number
  max?: number
  label?: string
}

export function ProgressBar({ value, max = 100, label }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '6px' }}>{label}</div>
      )}
      <div style={{
        height: '12px', background: 'rgba(255,255,255,0.1)',
        borderRadius: 'var(--custom-border-radius)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, var(--accent-color), #CE93D8)',
          borderRadius: 'var(--custom-border-radius)', transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ color: '#888', fontSize: '12px', marginTop: '4px', textAlign: 'left' }}>
        {Math.round(pct)}%
      </div>
    </div>
  )
}
