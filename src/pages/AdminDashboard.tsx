import { useState, useEffect, lazy, Suspense } from 'react'
import { useGameStore, useSettingsStore } from '@/store'
import { Button } from '@/components/ui'
import { analytics } from '@/systems/AnalyticsSystem'
import { autoSave } from '@/systems/AutoSaveSystem'
import { cloudSave } from '@/systems/CloudSaveSystem'
import { ChallengeSkeleton } from '@/components/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const AIPanel = lazy(() => import('@/ai/AIPanel').then((m) => ({ default: m.AIPanel })))

interface Props { onBack: () => void }

export function AdminDashboard({ onBack }: Props) {
  const game = useGameStore()
  const settings = useSettingsStore()
  const [tab, setTab] = useState<'stats' | 'cloud' | 'debug'>('stats')
  const [cloudStatus, setCloudStatus] = useState<string>('')
  const levelStats = analytics.getLevelStats()

  useEffect(() => {
    analytics.track('game_start', { action: 'admin_dashboard_open' })
  }, [])

  const handleCloudUpload = async () => {
    setCloudStatus('جاري الرفع...')
    const ok = await cloudSave.upload()
    setCloudStatus(ok ? '✅ تم الرفع' : '❌ فشل الرفع')
  }

  const handleCloudDownload = async () => {
    setCloudStatus('جاري التحميل...')
    const data = await cloudSave.download()
    if (data) {
      setCloudStatus(`✅ تم التحميل (آخر حفظ: ${new Date(data.timestamp).toLocaleString('ar-EG')})`)
    } else {
      setCloudStatus('❌ لا توجد بيانات سحابية')
    }
  }

  const handleCloudSync = async () => {
    setCloudStatus('جاري المزامنة...')
    const result = await cloudSave.sync()
    setCloudStatus(`✅ تم: رفع ${result.uploaded ? '✅' : '❌'} / تحميل ${result.downloaded ? '✅' : '❌'}`)
  }

  const handleSaveNow = () => {
    autoSave.saveNow()
    setCloudStatus('✅ تم الحفظ')
  }

  const row: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--custom-border-radius)',
    border: 'var(--custom-border-width) solid var(--border-color-faint)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '20px', position: 'relative', zIndex: 1,
    }}>
      <h2 style={{
        fontSize: 'var(--heading-font-size)', margin: '0 0 12px',
        fontFamily: 'var(--heading-font)', color: 'var(--heading-color)',
        textAlign: 'center',
      }}>
        لوحة التحكم
      </h2>

      <div style={{
        display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap',
      }}>
        {(['stats', 'cloud', 'debug'] as const).map((t) => (
          <button key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', borderRadius: 'var(--custom-border-radius)', border: 'none',
              background: tab === t ? '#4FC3F7' : 'rgba(255,255,255,0.08)',
              color: tab === t ? '#0a0a1a' : '#aaa',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t === 'stats' ? 'إحصائيات' : t === 'cloud' ? 'سحابي' : 'تصحيح'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        {tab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={row}>
              <span style={{ color: '#aaa' }}>التقدم: {game.completedLevels.size}/7 مستويات</span>
              <span style={{ color: '#aaa' }}>النقاط: {game.totalScore}</span>
              <span style={{ color: '#aaa' }}>وقت اللعب: {Math.round(analytics.getTotalPlayTime() / 60000)} دقيقة</span>
            </div>
            <div style={row}>
              <span style={{ color: '#4FC3F7', fontWeight: 700 }}>المستويات المكتملة</span>
              {[1, 2, 3, 4, 5, 6, 7].map((l) => {
                const s = levelStats[l]
                return (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                    <span>المستوى {l}</span>
                    <span>{s ? `${s.attempts} محاولات، أعلى: ${Math.max(...s.scores)}` : 'لم يكتمل'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'cloud' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={row}>
              <span style={{ color: '#aaa' }}>{cloudStatus || 'البيانات السحابية'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button onClick={handleCloudUpload}>رفع إلى السحابة</Button>
              <Button onClick={handleCloudDownload}>تحميل من السحابة</Button>
              <Button variant="secondary" onClick={handleCloudSync}>مزامنة</Button>
              <Button variant="secondary" onClick={handleSaveNow}>حفظ الآن</Button>
            </div>
          </div>
        )}

        {tab === 'debug' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={row}>
              <span style={{ color: '#aaa', marginBottom: '8px' }}>حالة اللعبة</span>
              <pre style={{
                background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px',
                fontSize: '11px', color: '#81C784', direction: 'ltr', textAlign: 'left',
                overflow: 'auto', maxHeight: '200px',
              }}>
{JSON.stringify({
  currentLevel: game.currentLevel,
  completedLevels: [...game.completedLevels],
  totalScore: game.totalScore,
  isPlaying: game.isPlaying,
  getProgress: game.getProgress(),
  darkMode: settings.darkMode,
}, null, 2)}
              </pre>
            </div>
            <div style={row}>
              <span style={{ color: '#aaa', marginBottom: '8px' }}>الإعدادات</span>
              <pre style={{
                background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px',
                fontSize: '11px', color: '#CE93D8', direction: 'ltr', textAlign: 'left',
                overflow: 'auto', maxHeight: '200px',
              }}>
{JSON.stringify({
  fontSize: settings.fontSize,
  fontFamily: settings.fontFamily,
  bgColor: settings.bgColor,
  darkMode: settings.darkMode,
  bgmVolume: settings.bgmVolume,
  sfxVolume: settings.sfxVolume,
  qualityPreset: settings.qualityPreset,
}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <Button variant="ghost" onClick={onBack}>الرجوع</Button>
      </div>
    </div>
  )
}
