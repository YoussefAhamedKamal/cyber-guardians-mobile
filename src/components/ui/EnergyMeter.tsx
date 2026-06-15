interface Props {
  energy: number
}

export function EnergyMeter({ energy }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <span style={{ fontSize: '14px' }}>⚡</span>
      <div style={{
        width: '80px', height: '8px', borderRadius: '4px',
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(energy, 100)}%`, height: '100%',
          background: energy >= 100
            ? 'linear-gradient(90deg, #76FF03, #FFD700)'
            : '#76FF03',
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        fontSize: '12px', fontWeight: 'bold',
        color: '#76FF03', minWidth: '35px',
      }}>
        {Math.floor(energy)}%
      </span>
    </div>
  )
}
