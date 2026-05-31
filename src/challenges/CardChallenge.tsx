import { useState } from 'react'
import type { PhishingEmail } from '@/types'
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

interface Props {
  emails: PhishingEmail[]
  onComplete: (score: number) => void
}

export function CardChallenge({ emails, onComplete }: Props) {
  const [shuffledEmails] = useState(() => shuffle(emails))
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const email = shuffledEmails[index]
  if (!email) return null

  const reset = () => {
    setIndex(0)
    setCorrect(0)
    setWrong([])
    setDone(false)
  }

  const handleChoice = (isPhishing: boolean) => {
    if (done) return
    if (isPhishing === email.isPhishing) {
      setCorrect((c) => c + 1)
      audio.playCorrect()
    } else {
      setWrong((w) => [...w, email.id])
      audio.playWrong()
    }
    const next = index + 1
    if (next >= shuffledEmails.length) {
      setDone(true)
      return
    }
    setIndex(next)
  }

  if (done) {
    const score = Math.round((correct / shuffledEmails.length) * 100)
    return (
      <div style={{ textAlign: 'center', padding: '32px', direction: 'rtl' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: score >= 80 ? '#81C784' : '#FFB74D' }}>
          {score >= 80 ? '✓' : '?'}
        </div>
        <h3 style={{ fontSize: 'var(--heading-font-size)', marginBottom: '8px', fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>{score >= 80 ? 'أحسنت!' : 'حاول مرة أخرى'}</h3>
        <p style={{ color: '#aaa', marginBottom: '8px' }}>صحيح: {correct} من {shuffledEmails.length}</p>
        {wrong.length > 0 && (
          <div style={{ color: '#E57373', fontSize: '14px', marginBottom: '16px' }}>
            أخطأت في {wrong.length} إيميل{wrong.length > 1 ? 'ات' : ''}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => onComplete(score)}>
            {score >= 80 ? 'متابعة' : 'المتابعة على أي حال'}
          </Button>
          <Button variant="secondary" onClick={reset}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', direction: 'rtl', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
        إيميل {index + 1} من {emails.length}
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
        padding: '20px', marginBottom: '20px',
      }}>
        <div style={{ color: '#4FC3F7', fontSize: '14px', marginBottom: '4px' }}>المرسل: {email.from}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{email.subject}</div>
        <div style={{ color: '#ccc', lineHeight: 1.6 }}>{email.body}</div>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button onClick={() => handleChoice(false)} variant="secondary">آمن <span style={{color:'#81C784', fontWeight:700}}>✓</span></Button>
        <Button onClick={() => handleChoice(true)}>تصيد <span style={{color:'#E57373', fontWeight:700}}>✗</span></Button>
      </div>
      {wrong.includes(email.id) && (
        <div style={{ color: '#E57373', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
          {email.reason}
        </div>
      )}
    </div>
  )
}
