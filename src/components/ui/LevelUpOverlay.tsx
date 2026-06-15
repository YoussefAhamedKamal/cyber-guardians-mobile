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
    }, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)',
      animation: 'cg-fade-in 0.3s ease-out',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', width: '300px', height: '300px',
        background: `radial-gradient(circle, ${rank.color}33 0%, transparent 70%)`,
        animation: 'cg-glow-pulse 2s ease-in-out infinite',
      }} />

      <div style={{
        fontSize: '72px', marginBottom: '20px',
        animation: 'cg-level-up 3s ease-out',
        filter: `drop-shadow(0 0 20px ${rank.color})`,
        position: 'relative', zIndex: 1,
      }}>
        {rank.icon}
      </div>

      <div style={{
        fontSize: '16px', color: '#888',
        textTransform: 'uppercase', letterSpacing: '3px',
        marginBottom: '8px', position: 'relative', zIndex: 1,
      }}>
        تهانينا!
      </div>

      <div style={{
        fontSize: '32px', fontWeight: 'bold',
        color: rank.color, marginBottom: '8px',
        textShadow: `0 0 30px ${rank.color}88`,
        position: 'relative', zIndex: 1,
      }}>
        ارتقيت لمستوى جديد!
      </div>

      <div style={{
        fontSize: '24px', color: rank.color,
        opacity: 0.9, position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '28px' }}>{rank.icon}</span>
        <span>{rank.title}</span>
      </div>

      <style>{`
        @keyframes cg-level-up {
          0% { transform: scale(0.3) rotate(-20deg); opacity: 0; }
          30% { transform: scale(1.3) rotate(10deg); opacity: 1; }
          50% { transform: scale(1) rotate(0deg); }
          85% { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(1.2) rotate(0deg); opacity: 0; }
        }
        @keyframes cg-glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
