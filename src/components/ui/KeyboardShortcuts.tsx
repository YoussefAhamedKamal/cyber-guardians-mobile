import { SHORTCUTS } from '@/utils/constants'

interface Props {
  onClose: () => void
}

export function KeyboardShortcuts({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a2e', padding: '32px', borderRadius: 'var(--custom-border-radius)',
          maxWidth: '450px', width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '22px', margin: '0 0 16px', color: '#4FC3F7' }}>اختصارات لوحة المفاتيح</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SHORTCUTS.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <kbd style={{
                background: 'rgba(255,255,255,0.1)', padding: '4px 12px',
                borderRadius: 'var(--custom-border-radius)', fontSize: '14px', minWidth: '80px',
                textAlign: 'center', border: 'var(--custom-border-width) solid var(--border-color-subtle)',
              }}>
                {s.key}
              </kbd>
              <span style={{ color: '#ccc', fontSize: '14px' }}>{s.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px', color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
          <strong style={{ color: '#aaa' }}>كيفية اللعب:</strong><br />
          1. ابدأ اللعبة من القائمة الرئيسية<br />
          2. اختر مستوى من شاشة المستويات<br />
          3. شاهد الحوار مع الشخصيات<br />
          4. أكمل التحدي لكل مستوى<br />
          5. اجمع النقاط وانتقل للمستوى التالي<br />
          6. أنهِ جميع المستويات لتفوز باللعبة
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '20px', width: '100%', padding: '10px',
            borderRadius: 'var(--custom-border-radius)', border: 'none', background: 'var(--accent-color)',
            color: '#0a0a1a', fontSize: '16px', cursor: 'pointer', fontWeight: 700,
          }}
        >
          إغلاق
        </button>
      </div>
    </div>
  )
}
