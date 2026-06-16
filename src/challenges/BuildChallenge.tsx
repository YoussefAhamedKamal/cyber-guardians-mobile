import { useState, useMemo, useCallback } from 'react'
import type { PasswordRule } from '@/types'
import { Button } from '@/components/ui'
import { audio } from '@/systems/ProceduralAudio'

interface Props {
  rules: PasswordRule[]
  onComplete: (score: number) => void
  onRequestHint?: (() => void) | undefined
}

function evaluatePassword(pw: string, rules: PasswordRule[]): PasswordRule[] {
  return rules.map((r) => {
    switch (r.type) {
      case 'length': return { ...r, satisfied: pw.length >= 8 }
      case 'uppercase': return { ...r, satisfied: /[A-Z]/.test(pw) }
      case 'number': return { ...r, satisfied: /[0-9]/.test(pw) }
      case 'symbol': return { ...r, satisfied: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) }
      default: return r
    }
  })
}

const HINTS = [
  'كلمة المرور القوية تحتوي على 8 أحرف على الأقل',
  'أضف أرقاماً ورموزاً خاصة لتعزيز القوة',
  'لا تستخدم كلمات معروفة أو أسماء',
  'استخدم خليطاً من الأحرف الكبيرة والصغيرة'
]

export function BuildChallenge({ rules, onComplete, onRequestHint }: Props) {
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [hintText, setHintText] = useState<string | null>(null)
  const [flashColor, setFlashColor] = useState<string | null>(null)

  const evaluated = useMemo(() => evaluatePassword(password, rules), [password, rules])
  const satisfied = evaluated.filter((r) => r.satisfied).length
  const allSatisfied = satisfied === rules.length

  const reset = () => {
    setPassword('')
    setDone(false)
    setHintText(null)
  }

  const strength = allSatisfied ? 'قوية' : satisfied >= 2 ? 'متوسطة' : 'ضعيفة'
  const strengthColor = allSatisfied ? '#81C784' : satisfied >= 2 ? '#FFB74D' : '#E57373'

  const handleHint = () => {
    const hint = HINTS[Math.floor(Math.random() * HINTS.length)] ?? 'استخدم خليطاً من الأحرف والأرقام'
    setHintText(hint)
    onRequestHint?.()
    setTimeout(() => setHintText(null), 5000)
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', direction: 'rtl' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: '#81C784' }}>🗝</div>
        <h3 style={{ fontSize: 'var(--heading-font-size)', marginBottom: '8px', fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>تم بناء كلمة المرور!</h3>
        <p style={{ color: '#aaa', marginBottom: '16px' }}>القوة: {satisfied}/{rules.length} معايير</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => onComplete(Math.round((satisfied / rules.length) * 100))}>متابعة</Button>
          <Button variant="secondary" onClick={reset}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '24px', direction: 'rtl', maxWidth: '450px', margin: '0 auto',
      position: 'relative',
    }}>
      <style>{`
        @keyframes cg-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }
      `}</style>
      {flashColor && (
        <div style={{
          position: 'absolute', inset: 0, background: flashColor,
          borderRadius: '12px', pointerEvents: 'none',
          animation: 'cg-fade 0.4s ease-out',
        }} />
      )}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: strengthColor, fontWeight: 700 }}>القوة: {strength}</div>
      </div>
      <input
        type="text"
        dir="ltr"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="اكتب كلمة مرور قوية..."
        style={{
          width: '100%', padding: '14px', borderRadius: 'var(--custom-border-radius)', border: 'var(--custom-border-width) solid var(--border-color-subtle)',
          background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '18px', textAlign: 'center',
          direction: 'ltr', marginBottom: '20px',
        }}
      />
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
        {evaluated.map((r) => (
          <div key={r.type} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            borderRadius: 'var(--custom-border-radius)', background: r.satisfied ? 'rgba(129,199,132,0.1)' : 'rgba(255,255,255,0.03)',
            border: `var(--custom-border-width) solid ${r.satisfied ? 'var(--border-color-success)' : 'var(--border-color-faint)'}`,
            transition: 'all 0.3s ease',
          }}>
            <span style={{ fontSize: '18px', color: r.satisfied ? '#81C784' : '#E57373' }}>
              {r.satisfied ? '✓' : '✗'}
            </span>
            <span style={{ color: r.satisfied ? '#81C784' : '#888' }}>{r.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button onClick={() => { setPassword(''); setDone(false) }} variant="ghost">مسح</Button>
        <Button onClick={() => { audio.playLevelUp(); setDone(true); }} disabled={!allSatisfied}
          style={{ opacity: allSatisfied ? 1 : 0.5 }}>
          {allSatisfied ? 'تأكيد كلمة المرور' : 'حقق كل المعايير أولاً'}
        </Button>
      </div>
    </div>
  )
}
