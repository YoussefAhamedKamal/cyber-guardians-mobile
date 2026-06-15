import { useState } from 'react'
import { useGameStore } from '@/store'

export function PlayerNameInput() {
  const playerName = useGameStore((s) => s.playerName)
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(playerName)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) {
      setPlayerName(trimmed)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
            if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
          maxLength={20}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(79,195,247,0.5)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            width: '150px',
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            background: 'rgba(79,195,247,0.2)',
            border: '1px solid rgba(79,195,247,0.4)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#4FC3F7',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          حفظ
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        setValue(playerName)
        setEditing(true)
      }}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '6px 12px',
        color: '#fff',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span style={{ opacity: 0.6 }}>👤</span>
      {playerName}
    </button>
  )
}
