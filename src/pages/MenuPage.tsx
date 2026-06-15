import { useState } from 'react'
import { MenuScreen } from '@/components/ui'
import { DailyMissions } from '@/components/ui/DailyMissions'
import { WeeklyChallengeBanner } from '@/components/ui/WeeklyChallengeBanner'
import { Leaderboard } from '@/components/ui/Leaderboard'
import { ShareModal } from '@/components/ui/ShareModal'
import { BadgeGrid } from '@/components/ui/BadgeGrid'
import { ReferencePage } from '@/pages/ReferencePage'

interface Props { onStart: () => void; onSettings: () => void }

export default function MenuPage({ onStart, onSettings }: Props) {
  const [showMissions, setShowMissions] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showBadges, setShowBadges] = useState(false)
  const [showReference, setShowReference] = useState(false)

  if (showReference) {
    return <ReferencePage onBack={() => setShowReference(false)} />
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MenuScreen onStart={onStart} onSettings={onSettings} />

      {/* Bottom-left: Daily Missions + Weekly Challenge */}
      <div style={{
        position: 'absolute', bottom: 'clamp(80px, 12vw, 120px)',
        left: 'clamp(16px, 3vw, 32px)', zIndex: 30,
        display: 'flex', flexDirection: 'column', gap: '10px',
        maxWidth: '280px', width: '100%',
      }}>
        {/* Daily Missions - clickable */}
        <div
          onClick={() => setShowMissions(!showMissions)}
          style={{ cursor: 'pointer' }}
        >
          {showMissions ? (
            <DailyMissions />
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.borderColor = 'rgba(79,195,247,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
            >
              <span style={{ fontSize: '20px' }}>📋</span>
              <span style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>
                مهام اليوم
              </span>
              <span style={{ fontSize: '12px', color: '#888', marginRight: 'auto' }}>
                ▼
              </span>
            </div>
          )}
        </div>

        {/* Weekly Challenge - clickable */}
        <div
          onClick={() => {
            if (!showMissions) {
              alert('أكمل تحدي الصعب بدون تلميحات للحصول على +200 XP!')
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <WeeklyChallengeBanner />
        </div>
      </div>

      {/* Top-right: Quick action buttons */}
      <div style={{
        position: 'absolute', top: 'clamp(16px,3vw,32px)',
        right: 'clamp(16px,3vw,32px)', zIndex: 30,
        display: 'flex', gap: '10px',
      }}>
        {/* Badges */}
        <button
          onClick={() => setShowBadges(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: '2px solid rgba(255,215,0,0.3)',
            background: 'rgba(255,215,0,0.1)',
            color: '#FFD700', fontSize: '20px',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,215,0,0.2)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,215,0,0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="الشارات"
        >
          🏅
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => setShowLeaderboard(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: '2px solid rgba(255,152,0,0.3)',
            background: 'rgba(255,152,0,0.1)',
            color: '#FF9800', fontSize: '20px',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,152,0,0.2)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,152,0,0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="لوحة الصدارة"
        >
          🏆
        </button>

        {/* Share */}
        <button
          onClick={() => setShowShare(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: '2px solid rgba(76,175,80,0.3)',
            background: 'rgba(76,175,80,0.1)',
            color: '#4CAF50', fontSize: '20px',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(76,175,80,0.2)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(76,175,80,0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="مشاركة"
        >
          📤
        </button>

        {/* Reference */}
        <button
          onClick={() => setShowReference(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: '2px solid rgba(33,150,243,0.3)',
            background: 'rgba(33,150,243,0.1)',
            color: '#2196F3', fontSize: '20px',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(33,150,243,0.2)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(33,150,243,0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="المرجع الأمني"
        >
          📚
        </button>
      </div>

      {/* Modals */}
      {showLeaderboard && <Leaderboard onDone={() => setShowLeaderboard(false)} />}
      {showShare && <ShareModal onDone={() => setShowShare(false)} />}
      {showBadges && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px', padding: '24px',
            width: '90%', maxWidth: '500px', maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px',
            }}>
              <h3 style={{ margin: 0, color: '#FFD700', fontSize: '20px' }}>🏅 شاراتي</h3>
              <button
                onClick={() => setShowBadges(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px', padding: '6px 16px',
                  color: '#fff', cursor: 'pointer', fontSize: '14px',
                }}
              >
                إغلاق
              </button>
            </div>
            <BadgeGrid />
          </div>
        </div>
      )}
    </div>
  )
}
