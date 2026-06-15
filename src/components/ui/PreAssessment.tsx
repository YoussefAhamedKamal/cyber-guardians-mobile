import { useState } from 'react'
import { ASSESSMENT_QUESTIONS } from '@/data/assessmentQuestions'
import { useGameStore } from '@/store'

interface Props {
  onDone: () => void
}

export function PreAssessment({ onDone }: Props) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const setPreTestScore = useGameStore((s) => s.setPreTestScore)

  const question = ASSESSMENT_QUESTIONS[current]
  if (!question) return null

  const handleAnswer = (index: number) => {
    const newAnswers = [...answers, index]
    setAnswers(newAnswers)

    if (current < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrent(current + 1)
    } else {
      const correct = newAnswers.filter((a, i) => {
        const q = ASSESSMENT_QUESTIONS[i]
        return q && a === q.correctIndex
      }).length
      const score = Math.round((correct / ASSESSMENT_QUESTIONS.length) * 100)
      setPreTestScore(score)
      setShowResult(true)
    }
  }

  if (showResult) {
    const correct = answers.filter((a, i) => {
      const q = ASSESSMENT_QUESTIONS[i]
      return q && a === q.correctIndex
    }).length
    const score = Math.round((correct / ASSESSMENT_QUESTIONS.length) * 100)

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px', padding: '32px 48px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{
            fontSize: '24px', fontWeight: 'bold',
            color: '#4FC3F7', marginBottom: '8px',
          }}>
            نتيجة التقييم الأولي
          </div>
          <div style={{
            fontSize: '48px', fontWeight: 'bold',
            color: '#FFD700', marginBottom: '24px',
          }}>
            {score}%
          </div>
          <div style={{
            fontSize: '14px', color: '#fff', marginBottom: '24px',
            opacity: 0.8,
          }}>
            {correct} من {ASSESSMENT_QUESTIONS.length} إجابات صحيحة
          </div>
          <button
            onClick={onDone}
            style={{
              background: 'linear-gradient(135deg, #4FC3F7, #2196F3)',
              border: 'none', borderRadius: '12px',
              padding: '12px 48px', fontSize: '16px',
              fontWeight: 'bold', color: '#fff',
              cursor: 'pointer',
            }}
          >
            متابعة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '32px 48px',
        maxWidth: '500px', width: '90%',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <span style={{ fontSize: '14px', color: '#888' }}>
            سؤال {current + 1} / {ASSESSMENT_QUESTIONS.length}
          </span>
          <span style={{ fontSize: '14px', color: '#4FC3F7' }}>
            تقييم أولي
          </span>
        </div>

        <div style={{
          fontSize: '18px', fontWeight: 'bold',
          color: '#fff', marginBottom: '24px',
          lineHeight: 1.6,
        }}>
          {question.question}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px', padding: '14px 16px',
                fontSize: '15px', color: '#fff',
                cursor: 'pointer', textAlign: 'right',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
