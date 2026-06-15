interface Props {
  onRetry: () => void
  onGoHome: () => void
}

export function GameOverOverlay({ onRetry, onGoHome }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      animation: 'cg-fade-in 0.3s ease-out',
    }}>
      <div style={{
        fontSize: '64px', marginBottom: '16px',
      }}>
        💔
      </div>
      <div style={{
        fontSize: '28px', fontWeight: 'bold',
        color: '#F44336', marginBottom: '8px',
      }}>
        نفدت القلوب!
      </div>
      <div style={{
        fontSize: '16px', color: '#fff', marginBottom: '32px',
        opacity: 0.8,
      }}>
        لا تقلق، يمكنك المحاولة مرة أخرى
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={onRetry}
          style={{
            background: 'linear-gradient(135deg, #4FC3F7, #2196F3)',
            border: 'none', borderRadius: '12px',
            padding: '12px 32px', fontSize: '16px',
            fontWeight: 'bold', color: '#fff',
            cursor: 'pointer',
          }}
        >
          إعادة المحاولة
        </button>
        <button
          onClick={onGoHome}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px 32px', fontSize: '16px',
            fontWeight: 'bold', color: '#fff',
            cursor: 'pointer',
          }}
        >
          العودة للقائمة
        </button>
      </div>
    </div>
  )
}
