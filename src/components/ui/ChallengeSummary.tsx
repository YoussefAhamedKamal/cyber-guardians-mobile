import { useEffect, useState } from 'react'

interface Props {
  summary: string
  xpEarned: number
  onDone: () => void
}

export function ChallengeSummary({ summary, xpEarned, onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

  return (
    <div
      onClick={() => {
        setVisible(false)
        onDone()
      }}
      style={{
        position: 'fixed', bottom: '80px', left: '50%',
        transform: 'translateX(-50%)', zIndex: 9999,
        background: 'rgba(76,175,80,0.15)',
        border: '1px solid rgba(76,175,80,0.3)',
        borderRadius: '16px', padding: '16px 24px',
        maxWidth: '400px', cursor: 'pointer',
        animation: 'cg-float-up 0.5s ease-out',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '20px' }}>💡</span>
        <span style={{
          fontSize: '12px', color: '#4CAF50',
          fontWeight: 'bold', textTransform: 'uppercase',
        }}>
          معلومة أمنية
        </span>
      </div>
      <div style={{
        fontSize: '14px', color: '#fff',
        lineHeight: 1.6, marginBottom: '8px',
      }}>
        {summary}
      </div>
      <div style={{
        fontSize: '12px', color: '#FFD700',
      }}>
        +{xpEarned} XP
      </div>
      <style>{`
        @keyframes cg-float-up {
          0% { transform: translateX(-50%) translateY(20px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
