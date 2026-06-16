import { useState } from 'react'
import type { FirewallPort } from '@/types'
import { Button } from '@/components/ui'
import { audio } from '@/systems/ProceduralAudio'

interface Props {
  ports: FirewallPort[]
  onComplete: (score: number) => void
  onRequestHint?: (() => void) | undefined
}

const HINTS = [
  'المنافذ الأساسية (◆) يجب أن تبقى مفتوحة دائماً',
  'أغلق المنافذ غير الضرورية لتقليل الهجوم',
  'افحص كل منفذ وتحقق من وظيفته',
  'المنافذ المفتوحة هي نقاط الدخول المحتملة'
]

export function DragDropChallenge({ ports, onComplete, onRequestHint }: Props) {
  const [portList, setPortList] = useState(
    ports.map((p) => ({ ...p }))
  )
  const [done, setDone] = useState(false)
  const [hintText, setHintText] = useState<string | null>(null)
  const [flashColor, setFlashColor] = useState<string | null>(null)

  const reset = () => {
    setPortList(ports.map((p) => ({ ...p })))
    setDone(false)
    setHintText(null)
  }

  const handleHint = () => {
    const hint = HINTS[Math.floor(Math.random() * HINTS.length)] ?? 'المنافذ الأساسية يجب أن تبقى مفتوحة'
    setHintText(hint)
    onRequestHint?.()
    setTimeout(() => setHintText(null), 5000)
  }

  const togglePort = (id: string) => {
    if (done) return
    audio.playClick()
    setPortList((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: p.status === 'open' ? 'closed' as const : 'open' as const } : p)
    )
  }

  const handleSubmit = () => {
    const openCritical = portList.filter((p) => p.isCritical && p.status === 'open').length
    const closedNonCritical = portList.filter((p) => !p.isCritical && p.status === 'closed').length
    const total = portList.length
    const score = Math.round(((openCritical + closedNonCritical) / total) * 100)

    if (score >= 80) {
      audio.playLevelUp()
      setFlashColor('rgba(76,175,80,0.3)')
    } else {
      audio.playWrong()
      setFlashColor('rgba(229,115,115,0.3)')
    }
    setTimeout(() => setFlashColor(null), 400)
    setDone(true)
    onComplete(score)
  }

  if (done) {
    const openCritical = portList.filter((p) => p.isCritical && p.status === 'open').length
    const closedNonCritical = portList.filter((p) => !p.isCritical && p.status === 'closed').length
    const total = portList.length
    const score = Math.round(((openCritical + closedNonCritical) / total) * 100)
    return (
      <div style={{ textAlign: 'center', padding: '32px', direction: 'rtl' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: '#4FC3F7' }}>◈</div>
        <h3 style={{ fontSize: 'var(--heading-font-size)', marginBottom: '8px', fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>تم إعداد الجدار الناري!</h3>
        <p style={{ color: '#aaa', marginBottom: '4px' }}>منافذ أساسية مفتوحة: {openCritical}</p>
        <p style={{ color: '#aaa', marginBottom: '16px' }}>منافذ غير ضرورية مغلقة: {closedNonCritical}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => onComplete(score)}>متابعة</Button>
          <Button variant="secondary" onClick={reset}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '24px', direction: 'rtl', maxWidth: '500px', margin: '0 auto',
      position: 'relative',
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
      <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
        ↑ اضغط على المنفذ لتغيير حالته (افتح/أغلق). المنافذ الأساسية (<span style={{color:'#4FC3F7'}}>◆</span>) يجب أن تبقى مفتوحة.
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {portList.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePort(p.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 'var(--custom-border-radius)', border: 'var(--custom-border-width) solid',
              borderColor: p.isCritical ? 'var(--accent-color)' : 'var(--border-color-muted)',
              background: p.status === 'open'
                ? `rgba(79,195,247,${p.isCritical ? 0.15 : 0.05})`
                : 'rgba(229,115,115,0.1)',
              color: '#fff', cursor: 'pointer', fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: p.isCritical ? '#4FC3F7' : '#888' }}>
                {p.isCritical ? '◆' : '⚡'}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div>{p.name}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>Port {p.port}</div>
              </div>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 'var(--custom-border-radius)', fontSize: '12px', fontWeight: 700,
              background: p.status === 'open' ? 'rgba(79,195,247,0.2)' : 'rgba(229,115,115,0.2)',
              color: p.status === 'open' ? '#4FC3F7' : '#E57373',
            }}>
              <span style={{ color: p.status === 'open' ? '#81C784' : '#E57373', marginLeft: '4px' }}>●</span>
              {p.status === 'open' ? 'مفتوح' : 'مغلق'}
            </div>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button variant="secondary" onClick={handleHint}>💡 تلميح</Button>
        <Button onClick={handleSubmit}>تطبيق الجدار الناري</Button>
      </div>
    </div>
  )
}
