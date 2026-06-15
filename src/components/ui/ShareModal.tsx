import { useGameStore } from '@/store'

interface Props {
  onDone: () => void
}

export function ShareModal({ onDone }: Props) {
  const playerName = useGameStore((s) => s.playerName)
  const totalScore = useGameStore((s) => s.totalScore)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const unlockedBadges = useGameStore((s) => s.unlockedBadges)

  const shareText = `🎮 ${playerName} في Cyber Guardians!\n` +
    `📊 النقاط: ${totalScore} | المستوى: ${currentLevel}\n` +
    `🏆 الشارات: ${unlockedBadges.length}\n` +
    `🛡️ حراص الأمن السيبراني - انضم إلينا!`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cyber Guardians',
          text: shareText,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      await navigator.clipboard.writeText(shareText)
    }
    onDone()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      animation: 'cg-fade-in 0.3s ease-out',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '20px', padding: '32px 48px',
        textAlign: 'center', maxWidth: '400px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
        <div style={{
          fontSize: '24px', fontWeight: 'bold',
          color: '#fff', marginBottom: '16px',
        }}>
          مشاركة التقدم
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '16px',
          marginBottom: '24px', textAlign: 'right',
          fontSize: '14px', color: '#ccc',
          lineHeight: '1.8',
        }}>
          <div>🎮 {playerName}</div>
          <div>📊 النقاط: {totalScore}</div>
          <div>🏆 المستوى: {currentLevel}</div>
          <div>🎖️ الشارات: {unlockedBadges.length}</div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleShare}
            style={{
              background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
              border: 'none', borderRadius: '12px',
              padding: '12px 32px', fontSize: '16px',
              fontWeight: 'bold', color: '#fff',
              cursor: 'pointer',
            }}
          >
            مشاركة
          </button>
          <button
            onClick={onDone}
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
