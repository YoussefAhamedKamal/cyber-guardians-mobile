import { useState, useMemo } from 'react'
import type { CipherChallenge } from '@/types'
import { Button } from '@/components/ui'
import { audio } from '@/systems/ProceduralAudio'
import { useSettingsStore } from '@/store'

interface Props {
  cipher: CipherChallenge
  onComplete: (score: number) => void
  onRequestHint?: (() => void) | undefined
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function caesarShift(text: string, shift: number): string {
  return text.split('').map((ch) => {
    const code = ch.charCodeAt(0)
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65)
    }
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 - shift + 26) % 26) + 97)
    }
    return ch
  }).join('')
}

const HINTS = [
  'جرّب الإزاحة 3 — الأكثر شيوعاً في تشفير Caesar',
  'الحرف H يتحول إلى E عند الإزاحة 3',
  'ابحث عن كلمات معروفة مثل THE أو AND',
  'المسافة بين الحروف في الأبجدية تساعدك'
]

export function DecryptChallenge({ cipher, onComplete, onRequestHint }: Props) {
  const monoFont = useSettingsStore((s) => s.monoFont)
  const [shift, setShift] = useState(1)
  const [correct, setCorrect] = useState(false)
  const [hintText, setHintText] = useState<string | null>(null)
  const [flashColor, setFlashColor] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)

  const decrypted = useMemo(() => caesarShift(cipher.encrypted, shift), [cipher.encrypted, shift])
  const isCorrect = decrypted.trim().toUpperCase() === cipher.solution.trim().toUpperCase()

  const reset = () => {
    setShift(1)
    setCorrect(false)
    setHintText(null)
  }

  const handleHint = () => {
    const hint = HINTS[Math.floor(Math.random() * HINTS.length)] ?? 'جرّب الإزاحة 3'
    setHintText(hint)
    onRequestHint?.()
    setTimeout(() => setHintText(null), 5000)
  }

  const handleShift = (delta: number) => {
    audio.playClick()
    setShift((s) => {
      const next = s + delta
      if (next < 1) return 25
      if (next > 25) return 1
      return next
    })
  }

  const handleSubmit = () => {
    if (isCorrect) {
      audio.playCorrect()
      setFlashColor('rgba(76,175,80,0.3)')
      setTimeout(() => setFlashColor(null), 400)
      setCorrect(true)
    } else {
      audio.playWrong()
      setIsShaking(true)
      setFlashColor('rgba(229,115,115,0.3)')
      setTimeout(() => { setIsShaking(false); setFlashColor(null) }, 400)
    }
  }

  if (correct) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', direction: 'rtl' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔓</div>
        <h3 style={{ fontSize: 'var(--heading-font-size)', marginBottom: '8px', fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>تم فك التشفير!</h3>
        <p style={{ color: '#81C784', marginBottom: '4px' }}>الرسالة: {decrypted}</p>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>الإزاحة الصحيحة: {cipher.shift}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => onComplete(100)}>متابعة</Button>
          <Button variant="secondary" onClick={reset}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '24px', direction: 'rtl', maxWidth: '520px', margin: '0 auto',
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
      {/* Simple explanation */}
      <div style={{
        background: 'rgba(79,195,247,0.1)', borderRadius: '12px',
        padding: '16px', marginBottom: '20px', fontSize: '14px', lineHeight: 1.8,
      }}>
        <div style={{ fontWeight: 700, color: '#4FC3F7', marginBottom: '8px', fontSize: '16px' }}>
          🧩 كيف تلعب؟
        </div>
        <div style={{ color: '#ccc' }}>
          هذي رسالة مشفرة. كل حرف استُبدِل بحرف آخر في الأبجدية.
        </div>
        <div style={{ color: '#ccc' }}>
          استخدم السهمين <span style={{ color: '#4FC3F7' }}>◀ ▶</span> لتحريك الإزاحة (Shift)
          إلى أن تصبح الرسالة مفهومة!
        </div>
      </div>

      {/* Encrypted message */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
        padding: '20px', marginBottom: '20px', textAlign: 'center',
      }}>
        <div style={{ color: '#888', fontSize: '12px', marginBottom: '6px' }}>
          🔐 الرسالة المشفرة
        </div>
        <div style={{
          fontSize: '28px', fontWeight: 700, letterSpacing: '3px',
          fontFamily: `${monoFont}, monospace`, color: '#E57373',
        }}>
          {cipher.encrypted}
        </div>
      </div>

      {/* Hint display */}
      {hintText && (
        <div style={{
          background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: '8px', padding: '10px', marginBottom: '12px',
          color: '#FFD700', fontSize: '14px', textAlign: 'center',
        }}>
          💡 {hintText}
        </div>
      )}

      {/* Shift controller */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
        padding: '20px', marginBottom: '20px', textAlign: 'center',
      }}>
        <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '12px' }}>
          غيّر الإزاحة (Shift) بالفارة ◀ أو ▶
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <button
            onClick={() => handleShift(-1)}
            style={{
              width: '52px', height: '52px', borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '22px',
              cursor: 'pointer',
            }}
          >
            ◀
          </button>
          <div style={{
            width: '72px', height: '72px', borderRadius: '16px',
            background: 'rgba(79,195,247,0.15)', border: 'var(--custom-border-width) solid var(--accent-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 700, color: '#4FC3F7',
          }}>
            {shift}
          </div>
          <button
            onClick={() => handleShift(1)}
            style={{
              width: '52px', height: '52px', borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '22px',
              cursor: 'pointer',
            }}
          >
            ▶
          </button>
        </div>

        {/* Letter mapping */}
        <div style={{ marginTop: '18px', fontSize: '13px', direction: 'ltr' }}>
          <div style={{ color: '#666', marginBottom: '4px', fontSize: '12px' }}>
            كل حرف من الأعلى يُستبدل بالحرف اللي تحته:
          </div>
          <div style={{ fontFamily: `${monoFont}, monospace`, letterSpacing: '2px', color: '#E57373', fontSize: '13px' }}>
            {LETTERS}
          </div>
          <div style={{
            fontFamily: `${monoFont}, monospace`, letterSpacing: '2px', color: '#4FC3F7', fontSize: '13px',
            marginTop: '2px',
          }}>
            {caesarShift(LETTERS, shift)}
          </div>
        </div>
      </div>

      {/* Decrypted result */}
      <div style={{
        borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'center',
        background: isCorrect ? 'rgba(129,199,132,0.15)' : 'rgba(255,255,255,0.03)',
        border: isCorrect ? 'var(--custom-border-width) solid var(--border-color-success)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
          📝 النص بعد فك التشفير (Shift {shift})
        </div>
        <div style={{
          fontSize: '24px', fontFamily: `${monoFont}, monospace`, letterSpacing: '2px',
          color: isCorrect ? '#81C784' : '#fff', minHeight: '30px',
        }}>
          {decrypted}
        </div>
        {isCorrect && (
          <div style={{ color: '#81C784', fontSize: '15px', marginTop: '10px' }}>
            ✅ هذا هو! الإزاحة صحيحة — الرسالة مفهومة الآن.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button variant="secondary" onClick={handleHint}>💡 تلميح</Button>
        <Button onClick={handleSubmit}>
          {isCorrect ? 'فتح الرسالة 🔓' : 'محاولة'}
        </Button>
      </div>
    </div>
  )
}
