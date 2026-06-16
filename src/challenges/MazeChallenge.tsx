import { useState, useCallback } from 'react'
import type { MazeCell } from '@/types'
import { Button } from '@/components/ui'
import { audio } from '@/systems/ProceduralAudio'

interface Props {
  grid: MazeCell[][]
  onComplete: (score: number) => void
  onRequestHint?: (() => void) | undefined
}

const HINTS = [
  'ادفع الملفات الخبيثة إلى النقاط الخضراء فقط',
  'تجنب الجدران — لا يمكن اختراقها',
  'حرك اللاعب أولاً ثم ادفع الملف',
  'كل ملف يحتاج دفعة واحدة على الأقل'
]

export function MazeChallenge({ grid, onComplete, onRequestHint }: Props) {
  const size = grid.length

  const initialMalware = grid
    .flat()
    .filter((c) => c.isMalware)
    .map((c) => ({ x: c.x, y: c.y }))

  const [player, setPlayer] = useState({ x: 0, y: 0 })
  const [malware, setMalware] = useState(initialMalware)
  const totalMalware = initialMalware.length
  const secured = totalMalware - malware.length
  const [done, setDone] = useState(false)
  const [hintText, setHintText] = useState<string | null>(null)
  const [flashColor, setFlashColor] = useState<string | null>(null)

  const reset = () => {
    setPlayer({ x: 0, y: 0 })
    setMalware(initialMalware.map((m) => ({ ...m })))
    setDone(false)
    setHintText(null)
  }

  const handleHint = () => {
    const hint = HINTS[Math.floor(Math.random() * HINTS.length)] ?? 'ادفع الملفات الخبيثة إلى النقاط الخضراء'
    setHintText(hint)
    onRequestHint?.()
    setTimeout(() => setHintText(null), 5000)
  }

  const move = (dx: number, dy: number) => {
    if (done) return
    setPlayer((prev) => {
      const nx = prev.x + dx
      const ny = prev.y + dy
      const target = grid[ny]?.[nx]
      if (!target || target.isWall) return prev

      const hitMalware = malware.find((m) => m.x === nx && m.y === ny)
      if (hitMalware) {
        const pushX = nx + dx
        const pushY = ny + dy
        const pushTarget = grid[pushY]?.[pushX]
        if (!pushTarget || pushTarget.isWall) return prev

        setMalware((prevMal) => {
          const updated = prevMal.map((m) =>
            m.x === hitMalware.x && m.y === hitMalware.y
              ? { x: pushX, y: pushY }
              : m
          )
          if (pushTarget.isEndpoint) {
            audio.playLevelUp()
            setFlashColor('rgba(76,175,80,0.3)')
            setTimeout(() => setFlashColor(null), 400)
            const remaining = updated.filter((m) => !(m.x === pushX && m.y === pushY))
            if (remaining.length === 0) {
              setTimeout(() => setDone(true), 400)
            }
            return remaining
          }
          return updated
        })
        audio.playCorrect()
        return { x: nx, y: ny }
      }

      return { x: nx, y: ny }
    })
  }

  if (done) {
    const score = 100
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#x1F6E1;</div>
        <h3 style={{ fontSize: 'var(--heading-font-size)', marginBottom: '8px', fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>تم تطهير الشبكة!</h3>
        <p style={{ color: '#aaa', marginBottom: '8px' }}>
          جميع الملفات الخبيثة معزولة: {secured} من {totalMalware}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => onComplete(score)}>متابعة</Button>
          <Button variant="secondary" onClick={reset}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  const cellSize = size > 6 ? 48 : 56

  return (
    <div style={{
      padding: '24px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '12px', position: 'relative',
    }}>
      <style>{`
        @keyframes cg-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }
      `}</style>
      {flashColor && (
        <div style={{
          position: 'absolute', inset: 0, background: flashColor,
          borderRadius: '12px', pointerEvents: 'none',
          animation: 'cg-pulse 0.4s ease-out',
        }} />
      )}
      <div style={{ color: '#888', fontSize: '14px' }}>
        &#x1F3AF; ادفع الملفات الخبيثة (<span style={{ color: '#E57373' }}>&#x25CF;</span>) إلى نقطة الأمان (<span style={{ color: '#81C784' }}>&#x25C9;</span>)
      </div>
      <div style={{ color: '#E57373', fontSize: '13px' }}>
        معزول: {secured} / {totalMalware}
      </div>
      {hintText && (
        <div style={{
          background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: '8px', padding: '10px', marginBottom: '12px',
          color: '#FFD700', fontSize: '14px', textAlign: 'center',
        }}>
          💡 {hintText}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="ghost" onClick={reset}>إعادة تعيين</Button>
        <Button variant="ghost" onClick={handleHint}>💡 تلميح</Button>
      </div>
      <div
        style={{
          display: 'grid', gap: '4px', direction: 'ltr',
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        }}
      >
        {grid.map((row, y) =>
          row.map((c, x) => {
            const isPlayer = player.x === x && player.y === y
            const isMalwareHere = malware.some((m) => m.x === x && m.y === y)
            const wall = c.isWall
            const ep = c.isEndpoint

            let bg = 'rgba(255,255,255,0.05)'
            let border = 'var(--custom-border-width) solid transparent'
            let content = ''

            if (wall) {
              bg = '#2a2a3e'
              content = '&#x25A3;'
            } else if (isMalwareHere) {
              bg = 'rgba(229,115,115,0.2)'
              border = 'var(--custom-border-width) solid var(--border-color-error)'
              content = '&#x25CF;'
            } else if (ep) {
              bg = 'rgba(129,199,132,0.15)'
              border = 'var(--custom-border-width) solid var(--border-color-success)'
              content = '&#x25C9;'
            }

            if (isPlayer) {
              bg = 'rgba(79,195,247,0.25)'
              border = 'var(--custom-border-width) solid var(--accent-color)'
              content = '&#x25D8;'
            }

            return (
              <div
                key={`${x}-${y}`}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  background: bg,
                  border,
                  transition: 'all 0.15s',
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )
          })
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
          <button onClick={() => move(0, -1)} style={arrowStyle}>&#x25B2;</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
          <button onClick={() => move(-1, 0)} style={arrowStyle}>&#x25C0;</button>
          <button onClick={() => move(1, 0)} style={arrowStyle}>&#x25B6;</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
          <button onClick={() => move(0, 1)} style={arrowStyle}>&#x25BC;</button>
        </div>
      </div>
    </div>
  )
}

const arrowStyle: React.CSSProperties = {
  width: '56px', height: '56px', borderRadius: 'var(--custom-border-radius)', border: 'var(--custom-border-width) solid var(--border-color-subtle)',
  background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '24px', cursor: 'pointer',
}
