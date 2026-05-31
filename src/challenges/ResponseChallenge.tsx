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
}

export function ResponseChallenge({ steps, onComplete }: Props) {
  const [shuffledSteps] = useState(() => shuffleStepOptions(steps))
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const step = shuffledSteps[index]
  if (!step) {
    const score = Math.round((correct / shuffledSteps.length) * 100)
    const reset = () => {
      setIndex(0)
      setCorrect(0)
      setSelected(null)
      setShowResult(false)
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

  const handleSelect = (idx: number) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)
    if (idx === step.correctIndex) { setCorrect((c) => c + 1); audio.playCorrect() } else { audio.playWrong() }
  }

  const handleNext = () => {
    setSelected(null)
    setShowResult(false)
    setIndex((i) => i + 1)
  }

  return (
    <div style={{ padding: '24px', direction: 'rtl', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px', textAlign: 'center' }}>
        خطوة {index + 1} من {shuffledSteps.length}
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
        padding: '20px', marginBottom: '20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '18px', lineHeight: 1.6 }}>{step.question}</div>
      </div>
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
              }}
            >
              {showResult && idx === step.correctIndex && '✅ '}
              {showResult && idx === selected && idx !== step.correctIndex && '❌ '}
              {opt}
            </button>
          )
        })}
      </div>
      {showResult && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'rgba(79,195,247,0.1)', borderRadius: '8px',
            padding: '12px', marginBottom: '12px', fontSize: '14px', color: '#4FC3F7',
          }}>
            {step.explanation}
          </div>
          <Button onClick={handleNext}>
            {index < steps.length - 1 ? 'الخطوة التالية' : 'إظهار النتيجة'}
          </Button>
        </div>
      )}
    </div>
  )
}
