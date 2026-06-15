import { useEffect, useState } from 'react'
import type { Rank } from '@/data/ranks'

interface Props {
  rank: Rank
  onDone: () => void
}

export function LevelUpOverlay({ rank, onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone()
    }, 2500)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

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
        animation: 'cg-level-up 2.5s ease-out',
      }}>
        {rank.icon}
      </div>
      <div style={{
        fontSize: '28px', fontWeight: 'bold',
        color: rank.color, marginBottom: '8px',
        textShadow: `0 0 20px ${rank.color}66`,
      }}>
        ارتقيت لمستوى جديد!
      </div>
      <div style={{
        fontSize: '20px', color: rank.color,
        opacity: 0.9,
      }}>
        {rank.title}
      </div>
      <style>{`
        @keyframes cg-level-up {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          20% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          40% { transform: scale(1) rotate(0deg); }
          80% { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(1.1) rotate(0deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
