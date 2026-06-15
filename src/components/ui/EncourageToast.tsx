import { useEffect, useState } from 'react'

const MESSAGES = [
  { text: 'ممتاز! 🎯', color: '#4CAF50' },
  { text: 'رائع! 🌟', color: '#FFD700' },
  { text: 'مذهل! 🚀', color: '#2196F3' },
  { text: 'بطل! 🏆', color: '#FF5722' },
  { text: 'احترافي! 💪', color: '#9C27B0' },
  { text: 'ذكي جداً! 🧠', color: '#00BCD4' },
  { text: 'مبدع! ✨', color: '#E91E63' },
]

interface Props {
  message?: string
  duration?: number
  onDone: () => void
}

export function EncourageToast({ message, duration = 2000, onDone }: Props) {
  const [visible, setVisible] = useState(true)
  const msg = message || MESSAGES[Math.floor(Math.random() * MESSAGES.length)]!.text

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: '100px', left: '50%',
      transform: 'translateX(-50%)', zIndex: 9999,
      padding: '10px 24px', borderRadius: '20px',
      background: 'rgba(255,255,255,0.15)',
      border: '1px solid rgba(255,255,255,0.3)',
      backdropFilter: 'blur(12px)',
      fontSize: '18px', fontWeight: 'bold',
      color: '#fff',
      animation: 'cg-encourage 0.4s ease-out',
    }}>
      {msg}
      <style>{`
        @keyframes cg-encourage {
          0% { transform: translateX(-50%) translateY(20px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
