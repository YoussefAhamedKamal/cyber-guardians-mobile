import { useState, useEffect } from 'react'

interface Props {
  text: string
  characterName: string
  onDone: () => void
}

export function ChallengeIntro({ text, characterName, onDone }: Props) {
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
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        animation: 'cg-fade-in 0.3s ease-out',
      }}
    >
      <div style={{
        background: 'rgba(79,195,247,0.1)',
        border: '1px solid rgba(79,195,247,0.3)',
        borderRadius: '20px', padding: '32px 48px',
        maxWidth: '500px', textAlign: 'center',
      }}>
        <div style={{
          fontSize: '12px', color: '#4FC3F7',
          marginBottom: '12px', textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {characterName}
        </div>
        <div style={{
          fontSize: '18px', color: '#fff',
          lineHeight: 1.8, marginBottom: '16px',
        }}>
          {text}
        </div>
        <div style={{
          fontSize: '12px', color: '#888',
        }}>
          انقر للمتابعة
        </div>
      </div>
    </div>
  )
}
