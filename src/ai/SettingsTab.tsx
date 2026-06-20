import { useState, useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import type { Theme, ThemeMode, Language } from '@/types/ui'
import { AVAILABLE_THEMES, getResponsiveBreakpoint, isTouchDevice } from '@/types/ui'

type SettingsView = 'appearance' | 'accessibility' | 'language' | 'advanced'

export function SettingsTab() {
  const [view, setView] = useState<SettingsView>('appearance')
  const ui = useUIStore()
  const [diskUsage, setDiskUsage] = useState<string>('جاري الحساب...')

  const [breakpoint, setBreakpoint] = useState(getResponsiveBreakpoint())
  const [isTouch, setIsTouch] = useState(isTouchDevice())

  useEffect(() => {
    const estimateDiskUsage = async () => {
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate()
          const usedBytes = estimate.usage || 0
          const usedMB = (usedBytes / (1024 * 1024)).toFixed(2)
          setDiskUsage(`${usedMB} MB`)
        } else {
          setDiskUsage('غير متاح')
        }
      } catch {
        setDiskUsage('غير متاح')
      }
    }
    estimateDiskUsage()
  }, [])

  useEffect(() => {
    const handleResize = () => setBreakpoint(getResponsiveBreakpoint())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setIsTouch(isTouchDevice())
  }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#4CAF50', fontSize: '16px' }}>
          ⚙️ الإعدادات
        </h3>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'appearance' as const, label: '🎨 المظهر' },
            { id: 'accessibility' as const, label: '♿ إمكانية الوصول' },
            { id: 'language' as const, label: '🌐 اللغة' },
            { id: 'advanced' as const, label: '🔧 متقدم' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                background: view === tab.id ? '#2a2a3e' : '#1a1a2e',
                border: `1px solid ${view === tab.id ? '#4CAF50' : '#333'}`,
                borderRadius: '6px',
                color: view === tab.id ? '#4CAF50' : '#888',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: view === tab.id ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Appearance */}
        {view === 'appearance' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Theme Mode */}
            <SettingsSection title="🌙 الوضع">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { mode: 'light' as ThemeMode, label: '☀️ فاتح', icon: '☀️' },
                  { mode: 'dark' as ThemeMode, label: '🌙 داكن', icon: '🌙' },
                  { mode: 'system' as ThemeMode, label: '💻 النظام', icon: '💻' }
                ].map((option) => (
                  <button
                    key={option.mode}
                    onClick={() => ui.setThemeMode(option.mode)}
                    style={{
                      padding: '12px',
                      background: ui.themeMode === option.mode ? '#4CAF50' : '#0d1117',
                      border: `1px solid ${ui.themeMode === option.mode ? '#4CAF50' : '#333'}`,
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: ui.themeMode === option.mode ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </SettingsSection>

            {/* Theme Selection */}
            <SettingsSection title="🎨 السمة">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {AVAILABLE_THEMES.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isSelected={ui.currentTheme.id === theme.id}
                    onSelect={() => ui.setTheme(theme)}
                  />
                ))}
              </div>
            </SettingsSection>

            {/* Font Size */}
            <SettingsSection title="📏 حجم الخط">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>صغير</span>
                <input
                  type="range"
                  min="12"
                  max="18"
                  value={ui.fontSize}
                  onChange={(e) => ui.setFontSize(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ color: '#888', fontSize: '12px' }}>كبير</span>
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{ui.fontSize}px</span>
              </div>
            </SettingsSection>

            {/* Compact Mode */}
            <SettingsSection title="📦 الوضع المضغوط">
              <ToggleSwitch
                checked={ui.compactMode}
                onChange={ui.toggleCompactMode}
                label="تفعيل الوضع المضغوط"
              />
            </SettingsSection>
          </div>
        )}

        {/* Accessibility */}
        {view === 'accessibility' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <SettingsSection title="✨ التأثيرات">
              <div style={{ display: 'grid', gap: '8px' }}>
                <ToggleSwitch
                  checked={ui.animations}
                  onChange={ui.toggleAnimations}
                  label="التأثيرات الحركية"
                />
                <ToggleSwitch
                  checked={ui.sounds}
                  onChange={ui.toggleSounds}
                  label="الأصوات"
                />
                <ToggleSwitch
                  checked={ui.hapticFeedback}
                  onChange={ui.toggleHapticFeedback}
                  label="الاهتزاز"
                />
              </div>
            </SettingsSection>

            <SettingsSection title="📱 الجهاز">
              <div style={{ display: 'grid', gap: '8px' }}>
                <InfoItem label="نوع الجهاز" value={isTouch ? 'جهاز لمسي' : 'جهاز غير لمسي'} />
                <InfoItem label="حجم الشاشة" value={breakpoint === 'mobile' ? 'جوال' : breakpoint === 'tablet' ? 'لوحي' : 'كمبيوتر'} />
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Language */}
        {view === 'language' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <SettingsSection title="🌐 اللغة">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { lang: 'ar' as Language, label: '🇸🇦 العربية', dir: 'rtl' },
                  { lang: 'en' as Language, label: '🇺🇸 English', dir: 'ltr' }
                ].map((option) => (
                  <button
                    key={option.lang}
                    onClick={() => ui.setLanguage(option.lang)}
                    style={{
                      padding: '16px',
                      background: ui.language === option.lang ? '#4CAF50' : '#0d1117',
                      border: `1px solid ${ui.language === option.lang ? '#4CAF50' : '#333'}`,
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: ui.language === option.lang ? 'bold' : 'normal',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Advanced */}
        {view === 'advanced' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <SettingsSection title="💾 الحفظ">
              <ToggleSwitch
                checked={ui.autoSave}
                onChange={ui.toggleAutoSave}
                label="الحفظ التلقائي"
              />
            </SettingsSection>

            <SettingsSection title="👋 الترحيب">
              <ToggleSwitch
                checked={ui.showOnboarding}
                onChange={() => ui.setShowOnboarding(!ui.showOnboarding)}
                label="عرض شاشة الترحيب"
              />
            </SettingsSection>

            <SettingsSection title="📊 معلومات">
              <div style={{ display: 'grid', gap: '8px' }}>
                <InfoItem label="الإصدار" value="2.0.0" />
                <InfoItem label="آخر تحديث" value={new Date().toLocaleDateString('ar-SA')} />
                <InfoItem label="المساحة المستخدمة" value={diskUsage} />
              </div>
            </SettingsSection>
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #333'
    }}>
      <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  label
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      background: '#0d1117',
      borderRadius: '6px',
      cursor: 'pointer'
    }}>
      <span style={{ color: '#fff', fontSize: '13px' }}>{label}</span>
      <div
        onClick={onChange}
        style={{
          width: '44px',
          height: '24px',
          background: checked ? '#4CAF50' : '#333',
          borderRadius: '12px',
          position: 'relative',
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'all 0.2s'
        }} />
      </div>
    </label>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      background: '#0d1117',
      borderRadius: '6px'
    }}>
      <span style={{ color: '#888', fontSize: '13px' }}>{label}</span>
      <span style={{ color: '#fff', fontSize: '13px' }}>{value}</span>
    </div>
  )
}

function ThemeCard({
  theme,
  isSelected,
  onSelect
}: {
  theme: Theme
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '12px',
        background: isSelected ? theme.colors.surface : '#0d1117',
        border: `2px solid ${isSelected ? theme.colors.primary : '#333'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = theme.colors.primary
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = '#333'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
        }} />
        <span style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: '13px' }}>
          {theme.nameAr}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {Object.values(theme.colors).slice(0, 5).map((color, i) => (
          <div
            key={i}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: color
            }}
          />
        ))}
      </div>
    </div>
  )
}
