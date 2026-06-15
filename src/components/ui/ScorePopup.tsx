import { useEffect, useState } from 'react'

interface Props {
  text: string
  color?: string
  onDone: () => void
}

export function ScorePopup({ text, color = '#FFD700', onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone()
    }, 1500)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', zIndex: 9999,
      fontSize: '24px', fontWeight: 'bold',
      color, textShadow: `0 0 20px ${color}66`,
      pointerEvents: 'none',
      animation: 'cg-score-float 1.5s ease-out forwards',
    }}>
      {text}
      <style>{`
        @keyframes cg-score-float {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          80% { transform: translate(-50%, -70%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -90%) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
