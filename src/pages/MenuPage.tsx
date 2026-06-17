import { useState } from 'react'
import { MenuScreen } from '@/components/ui'
import { DailyMissions } from '@/components/ui/DailyMissions'
import { WeeklyChallengeBanner } from '@/components/ui/WeeklyChallengeBanner'
import { Leaderboard } from '@/components/ui/Leaderboard'
import { ShareModal } from '@/components/ui/ShareModal'
import { BadgeGrid } from '@/components/ui/BadgeGrid'
import { PlayerNameInput } from '@/components/ui/PlayerNameInput'
import { Shop } from '@/components/ui/Shop'
import { ReferencePage } from '@/pages/ReferencePage'
import { useGameStore } from '@/store'

interface Props { onStart: () => void; onSettings: () => void }

export default function MenuPage({ onStart, onSettings }: Props) {
  const game = useGameStore()
  const [showMissions, setShowMissions] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showBadges, setShowBadges] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [showName, setShowName] = useState(false)
  const [tooltip, setTooltip] = useState<string | null>(null)

  if (showReference) {
    return <ReferencePage onBack={() => setShowReference(false)} />
  }

  const iconBtnStyle = (color: string, border: string): React.CSSProperties => ({
    width: '52px', height: '52px', borderRadius: '14px',
    border: `2px solid ${border}`,
    background: `${color}15`,
    color: color, fontSize: '22px',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
    position: 'relative',
  })

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MenuScreen onStart={onStart} onSettings={onSettings} />

      {/* ===== BOTTOM BAR: Stats + Quick Actions ===== */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 30, padding: '16px 24px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', maxWidth: '1200px', margin: '0 auto',
        }}>
          {/* Left: Stats */}
          <div style={{
            display: 'flex', gap: '20px', alignItems: 'center',
          }}>
            <StatItem icon="⭐" label="النقاط" value={game.totalScore.toLocaleString()} color="#FFD700" />
            <StatItem icon="📈" label="المستوى" value={`${game.currentLevel}/7`} color="#4FC3F7" />
            <StatItem icon="🏅" label="الشارات" value={`${game.unlockedBadges.length}`} color="#FF9800" />
          </div>

          {/* Right: Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <TooltipButton
              icon="🛒"
              tooltip="المتجر"
              color="#FFD700"
              border="rgba(255,215,0,0.3)"
              onClick={() => setShowShop(true)}
              setTooltip={setTooltip}
            />
            <TooltipButton
              icon="✏️"
              tooltip="تعديل الاسم"
              color="#4FC3F7"
              border="rgba(79,195,247,0.3)"
              onClick={() => setShowName(true)}
              setTooltip={setTooltip}
            />
            <TooltipButton
              icon="📋"
              tooltip="المهام اليومية"
              color="#4FC3F7"
              border="rgba(79,195,247,0.3)"
              onClick={() => setShowMissions(!showMissions)}
              active={showMissions}
              setTooltip={setTooltip}
            />
            <TooltipButton
              icon="🏅"
              tooltip="الشارات"
              color="#FFD700"
              border="rgba(255,215,0,0.3)"
              onClick={() => setShowBadges(true)}
              setTooltip={setTooltip}
            />
            <TooltipButton
              icon="🏆"
              tooltip="لوحة الصدارة"
              color="#FF9800"
              border="rgba(255,152,0,0.3)"
              onClick={() => setShowLeaderboard(true)}
              setTooltip={setTooltip}
            />
            <TooltipButton
              icon="📤"
              tooltip="مشاركة"
              color="#4CAF50"
              border="rgba(76,175,80,0.3)"
              onClick={() => setShowShare(true)}
              setTooltip={setTooltip}
            />
            <TooltipButton
              icon="📚"
              tooltip="المرجع الأمني"
              color="#2196F3"
              border="rgba(33,150,243,0.3)"
              onClick={() => setShowReference(true)}
              setTooltip={setTooltip}
            />
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', bottom: '90px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 99999,
          background: 'rgba(0,0,0,0.85)', color: '#fff',
          padding: '8px 16px', borderRadius: '8px',
          fontSize: '13px', whiteSpace: 'nowrap',
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {tooltip}
        </div>
      )}

      {/* ===== DAILY MISSIONS PANEL ===== */}
      {showMissions && (
        <div style={{
          position: 'absolute', bottom: '100px', left: '24px',
          zIndex: 35, width: '320px',
        }}>
          <DailyMissions />
        </div>
      )}

      {/* ===== WEEKLY CHALLENGE PANEL ===== */}
      <div style={{
        position: 'absolute', top: '72px', right: '24px',
        zIndex: 30, width: '260px',
      }}>
        <WeeklyChallengeBanner onStartChallenge={onStart} />
      </div>

      {/* ===== MODALS ===== */}
      {showLeaderboard && <Leaderboard onDone={() => setShowLeaderboard(false)} />}
      {showShare && <ShareModal onDone={() => setShowShare(false)} />}
      {showShop && <Shop onDone={() => setShowShop(false)} />}

      {/* Player Name Modal */}
      {showName && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            background: 'rgba(20,20,40,0.95)',
            border: '1px solid rgba(79,195,247,0.3)',
            borderRadius: '20px', padding: '24px',
            width: '90%', maxWidth: '360px',
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#4FC3F7', fontSize: '18px' }}>✏️ تعديل اسم اللاعب</h3>
            <PlayerNameInput />
            <button
              onClick={() => setShowName(false)}
              style={{
                marginTop: '16px', width: '100%', padding: '10px',
                borderRadius: '10px', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                fontSize: '14px', cursor: 'pointer',
              }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

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

function StatItem({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 14px', borderRadius: '12px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '11px', color: '#888' }}>{label}</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color }}>{value}</div>
      </div>
    </div>
  )
}

function TooltipButton({
  icon, tooltip, color, border, onClick, active, setTooltip,
}: {
  icon: string; tooltip: string; color: string; border: string;
  onClick: () => void; active?: boolean; setTooltip: (t: string | null) => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setTooltip(tooltip)}
        onMouseLeave={() => setTooltip(null)}
        onTouchStart={() => setTooltip(tooltip)}
        onTouchEnd={() => setTimeout(() => setTooltip(null), 1500)}
        style={{
          width: '52px', height: '52px', borderRadius: '14px',
          border: `2px solid ${active ? color : border}`,
          background: active ? `${color}30` : `${color}15`,
          color: color, fontSize: '22px',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
        }}
      >
        {icon}
      </button>
    </div>
  )
}
