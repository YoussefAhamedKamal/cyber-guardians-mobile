import { useState } from 'react'
import type { IncidentStep } from '@/types'
import { Button } from '@/components/ui'
import { audio } from '@/systems/ProceduralAudio'

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

function shuffleStepOptions(steps: IncidentStep[]): IncidentStep[] {
  return shuffle(steps).map((s) => {
    const correctOption = s.options[s.correctIndex] as string
    const shuffledOptions = shuffle(s.options)
    const newCorrectIndex = shuffledOptions.indexOf(correctOption)
    return { ...s, options: shuffledOptions, correctIndex: newCorrectIndex }
  })
}

interface Props {
  steps: IncidentStep[]
  onComplete: (score: number) => void
  onRequestHint?: (() => void) | undefined
}

const HINTS = [
  'افصل النظام المتضرر فوراً عن الشبكة',
  'لا تحذف الأدلة — احفظها للتحليل',
  'أبلغ فريق الأمن والجهات المختصة',
  'غيّر كلمات المرور للمستخدمين المتأثرين'
]

export function ResponseChallenge({ steps, onComplete, onRequestHint }: Props) {
  const [shuffledSteps] = useState(() => shuffleStepOptions(steps))
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [hintText, setHintText] = useState<string | null>(null)
  const [flashColor, setFlashColor] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)

  const step = shuffledSteps[index]
  if (!step) {
    const score = Math.round((correct / shuffledSteps.length) * 100)
    const reset = () => {
      setIndex(0)
      setCorrect(0)
      setSelected(null)
      setShowResult(false)
      setHintText(null)
    }
    return (
      <div style={{ textAlign: 'center', padding: '32px', direction: 'rtl' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
        <h3 style={{ fontSize: 'var(--heading-font-size)', marginBottom: '8px', fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>تمت الاستجابة للاختراق!</h3>
        <p style={{ color: '#aaa', marginBottom: '16px' }}>إجابات صحيحة: {correct} من {shuffledSteps.length}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => onComplete(score)}>متابعة</Button>
          <Button variant="secondary" onClick={reset}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  const handleHint = () => {
    const hint = HINTS[Math.floor(Math.random() * HINTS.length)] ?? 'افصل النظام المتضرر فوراً'
    setHintText(hint)
    onRequestHint?.()
    setTimeout(() => setHintText(null), 5000)
  }

  const handleSelect = (idx: number) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)
    if (idx === step.correctIndex) {
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
      padding: '24px', direction: 'rtl', maxWidth: '500px', margin: '0 auto',
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
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px', textAlign: 'center' }}>
        خطوة {index + 1} من {shuffledSteps.length}
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
        padding: '20px', marginBottom: '20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '18px', lineHeight: 1.6 }}>{step.question}</div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {step.options.map((opt, idx) => {
          let bg = 'rgba(255,255,255,0.03)'
          let border = 'var(--border-color-muted)'
          if (showResult && idx === step.correctIndex) {
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
                padding: '14px 18px', borderRadius: 'var(--custom-border-radius)', border: `var(--custom-border-width) solid ${border}`,
                background: bg, color: '#fff', cursor: showResult ? 'default' : 'pointer',
                fontSize: '15px', textAlign: 'right', lineHeight: 1.4,
                transition: 'all 0.2s ease',
              }}
            >
              {showResult && idx === step.correctIndex && '✅ '}
              {showResult && idx === selected && idx !== step.correctIndex && '❌ '}
              {opt}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button variant="secondary" onClick={handleHint}>💡 تلميح</Button>
        {showResult && (
          <>
            <div style={{
              background: 'rgba(79,195,247,0.1)', borderRadius: '8px',
              padding: '12px', marginBottom: '12px', fontSize: '14px', color: '#4FC3F7',
              width: '100%',
            }}>
              {step.explanation}
            </div>
            <Button onClick={handleNext}>
              {index < steps.length - 1 ? 'الخطوة التالية' : 'إظهار النتيجة'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
