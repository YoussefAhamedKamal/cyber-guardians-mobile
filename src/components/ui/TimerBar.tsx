interface Props {
  timeLeft: number
  totalTime: number
  color: string
}

export function TimerBar({ timeLeft, totalTime, color }: Props) {
  const safeTimeLeft = isNaN(timeLeft) || timeLeft < 0 ? 0 : Math.floor(timeLeft)
  const safeTotalTime = isNaN(totalTime) || totalTime <= 0 ? 30 : totalTime
  const progress = safeTotalTime > 0 ? (safeTimeLeft / safeTotalTime) * 100 : 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <span style={{ fontSize: '14px' }}>⏱️</span>
      <div style={{
        width: '100px', height: '8px', borderRadius: '4px',
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.max(0, Math.min(100, progress))}%`, height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 1s linear, background 0.3s ease',
        }} />
      </div>
      <span style={{
        fontSize: '13px', fontWeight: 'bold',
        color: color, minWidth: '30px',
      }}>
        {safeTimeLeft}s
      </span>
    </div>
  )
}
