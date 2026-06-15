interface Props {
  onConfirm: () => void
  onCancel: () => void
}

export function ResetConfirmModal({ onConfirm, onCancel }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      animation: 'cg-fade-in 0.3s ease-out',
    }}>
      <div style={{
        background: 'rgba(255,0,0,0.05)',
        border: '1px solid rgba(255,100,100,0.3)',
        borderRadius: '20px', padding: '32px 48px',
        textAlign: 'center', maxWidth: '400px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{
          fontSize: '24px', fontWeight: 'bold',
          color: '#ff6b6b', marginBottom: '16px',
        }}>
          إعادة التعيين
        </div>
        <div style={{
          fontSize: '16px', color: '#ccc', marginBottom: '24px',
          lineHeight: '1.6',
        }}>
          هل أنت متأكد من إعادة تعيين التقدم؟
          <br />
          <span style={{ color: '#ff6b6b', fontSize: '14px' }}>
            هذا الإجراء لا يمكن التراجع عنه
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onConfirm}
            style={{
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              border: 'none', borderRadius: '12px',
              padding: '12px 32px', fontSize: '16px',
              fontWeight: 'bold', color: '#fff',
              cursor: 'pointer',
            }}
          >
            نعم، أعد التعيين
          </button>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '12px', padding: '12px 32px',
              fontSize: '16px', color: '#fff',
              cursor: 'pointer',
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}
