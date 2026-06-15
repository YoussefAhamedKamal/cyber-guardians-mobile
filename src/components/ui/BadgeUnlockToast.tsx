import { useEffect, useState } from 'react'
import type { Badge } from '@/data/badges'

interface Props {
  badges: Badge[]
  onDone: () => void
}

export function BadgeUnlockToast({ badges, onDone }: Props) {
  const [visible, setVisible] = useState(true)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (current >= badges.length) {
      setVisible(false)
      onDone()
      return
    }
    const timer = setTimeout(() => {
      setCurrent((c) => c + 1)
    }, 2000)
    return () => clearTimeout(timer)
  }, [current, badges.length, onDone])

  if (!visible || current >= badges.length) return null

  const badge = badges[current]!

  return (
    <div style={{
      position: 'fixed', top: '80px', left: '50%',
      transform: 'translateX(-50%)', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 20px', borderRadius: '12px',
      background: 'rgba(255,215,0,0.15)',
      border: '1px solid rgba(255,215,0,0.4)',
      backdropFilter: 'blur(12px)',
      animation: 'cg-badge-unlock 0.8s ease-out',
    }}>
      <span style={{ fontSize: '28px' }}>{badge.emoji}</span>
      <div>
        <div style={{
          fontSize: '10px', color: '#FFD700',
          textTransform: 'uppercase', letterSpacing: '1px',
        }}>
          شارة جديدة!
        </div>
        <div style={{
          fontSize: '14px', fontWeight: 'bold',
          color: '#fff',
        }}>
          {badge.name}
        </div>
      </div>
      <style>{`
        @keyframes cg-badge-unlock {
          0% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
