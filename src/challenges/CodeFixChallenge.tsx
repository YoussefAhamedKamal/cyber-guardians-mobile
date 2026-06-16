import { useState } from 'react'
import type { VulnCode } from '@/types'
import { Button } from '@/components/ui'
import { audio } from '@/systems/ProceduralAudio'
import { useSettingsStore } from '@/store'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = a[i] as T
    a[i] = a[j] as T
    a[j] = temp
  }
  return a
}

function shuffleCodeOptions(codes: VulnCode[]): VulnCode[] {
  return shuffle(codes).map((c) => {
    const correctOption = c.options[c.correctIndex] as string
    const shuffledOptions = shuffle(c.options)
    const newCorrectIndex = shuffledOptions.indexOf(correctOption)
    return { ...c, options: shuffledOptions, correctIndex: newCorrectIndex }
  })
}

interface Props {
  codes: VulnCode[]
  onComplete: (score: number) => void
  onRequestHint?: (() => void) | undefined
}

const HINTS = [
  'افحص التعامل مع المدخلات — هل يتم التحقق منها؟',
  'ابحث عن ثغرات SQL Injection أو XSS',
  'تحقق من تعامل الكود مع الأخطاء',
  'هل الكود يتحقق من الصلاحيات قبل التنفيذ؟'
]

export function CodeFixChallenge({ codes, onComplete, onRequestHint }: Props) {
  const monoFont = useSettingsStore((s) => s.monoFont)
  const [shuffledCodes] = useState(() => shuffleCodeOptions(codes))
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [hintText, setHintText] = useState<string | null>(null)
  const [flashColor, setFlashColor] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)

  const code = shuffledCodes[index]
  if (!code) {
    const score = Math.round((correct / shuffledCodes.length) * 100)
    const reset = () => {
      setIndex(0)
      setCorrect(0)
      setSelected(null)
      setShowResult(false)
      setHintText(null)
    }
    return (
      <div style={{ textAlign: 'center', padding: '32px', direction: 'rtl' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💻</div>
        <h3 style={{ fontSize: 'var(--heading-font-size)', marginBottom: '8px', fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>تم إصلاح الثغرات!</h3>
        <p style={{ color: '#aaa', marginBottom: '16px' }}>أصلحت {correct} من {shuffledCodes.length} ثغرات</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => onComplete(score)}>متابعة</Button>
          <Button variant="secondary" onClick={reset}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  const handleHint = () => {
    const hint = HINTS[Math.floor(Math.random() * HINTS.length)] ?? 'افحص التعامل مع المدخلات'
    setHintText(hint)
    onRequestHint?.()
    setTimeout(() => setHintText(null), 5000)
  }

  const handleSelect = (idx: number) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)
    if (idx === code.correctIndex) {
      setCorrect((c) => c + 1)
      audio.playCorrect()
      setFlashColor('rgba(76,175,80,0.3)')
      setTimeout(() => setFlashColor(null), 400)
    } else {
      audio.playWrong()
      setIsShaking(true)
      setFlashColor('rgba(229,115,115,0.3)')
      setTimeout(() => { setIsShaking(false); setFlashColor(null) }, 400)
    }
  }

  const handleNext = () => {
    setSelected(null)
    setShowResult(false)
    setHintText(null)
    setIndex((i) => i + 1)
  }

  return (
    <div style={{
      padding: '24px', direction: 'rtl', maxWidth: '550px', margin: '0 auto',
      position: 'relative',
      animation: isShaking ? 'cg-shake 0.3s ease-in-out' : undefined,
    }}>
      <style>{`
        @keyframes cg-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }
      `}</style>
      {flashColor && (
        <div style={{
          position: 'absolute', inset: 0, background: flashColor,
          borderRadius: '12px', pointerEvents: 'none',
        }} />
      )}
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
        ثغرة {index + 1} من {shuffledCodes.length}: {code.vulnerability}
      </div>
      <div style={{
        background: '#1a1a2e', borderRadius: '12px', padding: '16px',
        marginBottom: '20px', direction: 'ltr', fontFamily: `${monoFont}, monospace`,
        fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflow: 'auto',
      }}>
        <div style={{ color: '#4FC3F7', fontSize: '12px', marginBottom: '8px' }}>{code.language}</div>
        {code.code}
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
      <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '12px' }}>
        أي قطعة الكود التالية هي الإصلاح الصحيح؟
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {code.options.map((opt, idx) => {
          let bg = 'rgba(255,255,255,0.03)'
          let border = 'var(--border-color-muted)'
          if (showResult && idx === code.correctIndex) {
            bg = 'rgba(129,199,132,0.15)'
            border = 'var(--border-color-success)'
          } else if (showResult && idx === selected) {
            bg = 'rgba(229,115,115,0.15)'
            border = 'var(--border-color-error)'
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
              style={{
                padding: '12px 16px', borderRadius: 'var(--custom-border-radius)', border: `var(--custom-border-width) solid ${border}`,
                background: bg, color: '#fff', cursor: showResult ? 'default' : 'pointer',
                fontSize: '13px', fontFamily: `${monoFont}, monospace`, direction: 'ltr', textAlign: 'left',
                lineHeight: 1.4, transition: 'all 0.2s ease',
              }}
            >
              {showResult && idx === code.correctIndex && '✅ '}
              {showResult && idx === selected && idx !== code.correctIndex && '❌ '}
              {opt}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button variant="secondary" onClick={handleHint}>💡 تلميح</Button>
        {showResult && (
          <Button onClick={handleNext}>
            {index < codes.length - 1 ? 'الثغرة التالية' : 'إظهار النتيجة'}
          </Button>
        )}
      </div>
    </div>
  )
}
