import { useState, useRef, lazy, Suspense } from 'react'
import { useSettingsStore, useGameStore } from '@/store'
import { Button } from './Button'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ScreenSkeleton } from '@/components/LoadingSkeleton'
import { FONT_OPTIONS, HEADING_FONT_OPTIONS, MONO_FONT_OPTIONS, MAX_VIDEO_SIZE, MAX_ANIMATION_SIZE } from '@/utils/constants'

const AdminDashboard = lazy(() => import('@/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))

interface Props {
  onBack: () => void
}

const FONT_STYLE_ID = 'cg-custom-fonts'

function injectFontStyle(name: string, url: string) {
  const existing = document.getElementById(FONT_STYLE_ID)
  if (existing) existing.remove()
  const style = document.createElement('style')
  style.id = FONT_STYLE_ID
  const safeName = name.replace(/[';{}]/g, ''); const safeUrl = url.replace(/[';{}]/g, '')
  style.textContent = `@font-face{font-family:'${safeName}';src:url('${safeUrl}') format('truetype');font-weight:normal;font-style:normal;font-display:swap}`
  document.head.appendChild(style)
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px', borderRadius: 'var(--custom-border-radius)',
  background: '#1a1a2e', color: '#fff',
  border: 'var(--custom-border-width) solid var(--custom-border-color)',
}

const labelStyle: React.CSSProperties = { color: '#aaa', fontSize: '13px' }

const removeBtn: React.CSSProperties = {
  background: 'rgba(229,115,115,0.15)', border: 'var(--custom-border-width) solid var(--border-color-error)',
  color: '#E57373', padding: '8px 12px', borderRadius: 'var(--custom-border-radius)',
  cursor: 'pointer', fontSize: '13px',
}

const rowStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 'var(--custom-border-radius)',
  border: 'var(--custom-border-width) solid var(--border-color-faint)',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

function FontUploadRow({
  label, currentName, currentUrl, onUpload, onRemove,
}: {
  label: string
  currentName: string
  currentUrl: string
  onUpload: (name: string, url: string) => void
  onRemove: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const name = file.name.replace(/\.[^/.]+$/, '')
      const url = reader.result as string
      injectFontStyle(name, url)
      onUpload(name, url)
    }
    reader.readAsDataURL(file)
  }
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
        <input ref={ref} type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFile} style={{ display: 'none' }} />
        <Button variant="secondary" onClick={() => ref.current?.click()}>
          {currentUrl ? 'تغيير' : 'رفع خط'}
        </Button>
        {currentUrl && <button onClick={onRemove} style={removeBtn}>إزالة</button>}
      </div>
      {currentName && <div style={{ color: '#81C784', fontSize: '12px', marginTop: '4px' }}>✓ {currentName}</div>}
    </div>
  )
}

function FileUploadRow({
  label, accept, currentUrl, onUpload, onRemove, maxSize,
}: {
  label: string
  accept: string
  currentUrl: string
  onUpload: (url: string) => void
  onRemove: () => void
  maxSize: number
}) {
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > maxSize) {
      alert(`حجم الملف كبير جداً. الحد الأقصى: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => onUpload(reader.result as string)
    reader.readAsDataURL(file)
  }
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
        <input ref={ref} type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
        <Button variant="secondary" onClick={() => ref.current?.click()}>
          {currentUrl ? 'تغيير' : 'رفع ملف'}
        </Button>
        {currentUrl && <button onClick={onRemove} style={removeBtn}>إزالة</button>}
      </div>
      {currentUrl && <div style={{ color: '#81C784', fontSize: '12px', marginTop: '4px' }}>✓ تم الرفع</div>}
    </div>
  )
}

const TABS = ['الصوت', 'العرض', 'الخطوط', 'الفيديو', 'عام'] as const
type Tab = (typeof TABS)[number]

export function SettingsPanel({ onBack }: Props) {
  const s = useSettingsStore()
  const [tab, setTab] = useState<Tab>('الصوت')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const tabBar = (
    <div style={{
      display: 'flex', gap: '4px', flexShrink: 0, flexWrap: 'wrap',
      justifyContent: 'center', marginBottom: '8px',
    }}>
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          style={{
            padding: '8px 18px', borderRadius: 'var(--custom-border-radius)', border: 'none',
            background: tab === t ? '#4FC3F7' : 'rgba(255,255,255,0.08)',
            color: tab === t ? '#0a0a1a' : '#aaa',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )

  const content = () => {
    switch (tab) {
      case 'الصوت':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>الموسيقى الخلفية</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>
                  {Math.round(s.bgmVolume * 100)}%
                </span>
              </div>
              <input type="range" min={0} max={2} step={0.05} value={s.bgmVolume}
                onChange={(e) => s.setBgmVolume(+e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => s.toggleBgmMute()}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--custom-border-radius)', border: 'var(--custom-border-width) solid var(--custom-border-color)',
                    background: (s.bgmMuted || s.muted) ? 'rgba(229,115,115,0.2)' : 'rgba(79,195,247,0.15)',
                    color: (s.bgmMuted || s.muted) ? '#E57373' : '#4FC3F7',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                  }}
                >
                  {(s.bgmMuted || s.muted) ? '\u{1F507} كتم' : '\u{1F50A} قيد التشغيل'}
                </button>
                <span style={{ color: '#888', fontSize: '11px' }}>(اختصار: B)</span>
              </div>
            </div>
            <div style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={labelStyle}>المؤثرات الصوتية</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>
                  {Math.round(s.sfxVolume * 100)}%
                </span>
              </div>
              <input type="range" min={0} max={2} step={0.05} value={s.sfxVolume}
                onChange={(e) => s.setSfxVolume(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="موسيقى خلفية مخصصة"
                accept="audio/*"
                currentUrl={s.customBgUrl}
                onUpload={s.setCustomBgUrl}
                onRemove={() => s.setCustomBgUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
          </div>
        )

      case 'العرض':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={rowStyle}>
              <label style={labelStyle}>لون الخلفية</label>
              <input type="color" value={s.bgColor}
                onChange={(e) => s.setBgColor(e.target.value)}
                style={{ ...inputStyle, padding: '4px', height: '40px' }} />
            </div>
            <div style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={labelStyle}>سطوع الخلفية</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>
                  {Math.round(s.bgBrightness * 100)}%
                </span>
              </div>
              <input type="range" min={0.1} max={2} step={0.05} value={s.bgBrightness}
                onChange={(e) => s.setBgBrightness(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="خلفية (صورة أو فيديو متحرك)"
                accept="image/*,video/*"
                currentUrl={s.bgAnimationUrl}
                onUpload={s.setBgAnimationUrl}
                onRemove={() => s.setBgAnimationUrl('')}
                maxSize={MAX_ANIMATION_SIZE}
              />
              {s.bgAnimationUrl && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label style={labelStyle}>سطوع الخلفية المتحركة</label>
                    <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>
                      {Math.round(s.bgAnimationBrightness * 100)}%
                    </span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={s.bgAnimationBrightness}
                    onChange={(e) => s.setBgAnimationBrightness(+e.target.value)} style={{ width: '100%' }} />
                </div>
              )}
            </div>
            <div style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={labelStyle}>نصف قطر الحدود</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>{s.borderRadius}px</span>
              </div>
              <input type="range" min={0} max={32} step={1} value={s.borderRadius}
                onChange={(e) => s.setBorderRadius(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={labelStyle}>سماكة الحدود</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>{s.borderWidth}px</span>
              </div>
              <input type="range" min={0} max={6} step={1} value={s.borderWidth}
                onChange={(e) => s.setBorderWidth(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>لون الحدود</label>
              <input type="color" value={s.borderColor}
                onChange={(e) => s.setBorderColor(e.target.value)}
                style={{ ...inputStyle, padding: '4px', height: '40px' }} />
            </div>
          </div>
        )

      case 'الخطوط':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* ── خط النص الأساسي ── */}
            <div style={rowStyle}>
              <label style={labelStyle}>خط النص الأساسي</label>
              <select value={s.fontFamily}
                onChange={(e) => s.setFontFamily(e.target.value)} style={inputStyle}>
                {FONT_OPTIONS.map((f) => (<option key={f} value={f}>{f}</option>))}
                {s.customFontName && <option key={s.customFontName} value={s.customFontName}>{s.customFontName} (مثبّت)</option>}
                {s.customHeadingFontName && s.customHeadingFontName !== s.customFontName && <option key={s.customHeadingFontName} value={s.customHeadingFontName}>{s.customHeadingFontName} (مثبّت)</option>}
              </select>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>الحجم</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>{s.fontSize}px</span>
              </div>
              <input type="range" min={12} max={28} step={1} value={s.fontSize}
                onChange={(e) => s.setFontSize(+e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>اللون</label>
                <input type="color" value={s.fontColor}
                  onChange={(e) => s.setFontColor(e.target.value)}
                  style={{ ...inputStyle, padding: '4px', height: '36px', width: '60px' }} />
              </div>
            </div>

            {/* ── خط العناوين ── */}
            <div style={rowStyle}>
              <label style={labelStyle}>خط العناوين</label>
              <select value={s.headingFont}
                onChange={(e) => s.setHeadingFont(e.target.value)} style={inputStyle}>
                {HEADING_FONT_OPTIONS.map((f) => (<option key={f} value={f}>{f}</option>))}
                {s.customHeadingFontName && <option key={s.customHeadingFontName} value={s.customHeadingFontName}>{s.customHeadingFontName} (مثبّت)</option>}
                {s.customFontName && s.customFontName !== s.customHeadingFontName && <option key={s.customFontName} value={s.customFontName}>{s.customFontName} (مثبّت)</option>}
              </select>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>الحجم</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>{s.headingFontSize}px</span>
              </div>
              <input type="range" min={14} max={40} step={1} value={s.headingFontSize}
                onChange={(e) => s.setHeadingFontSize(+e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>اللون</label>
                <input type="color" value={s.headingColor}
                  onChange={(e) => s.setHeadingColor(e.target.value)}
                  style={{ ...inputStyle, padding: '4px', height: '36px', width: '60px' }} />
              </div>
            </div>

            {/* ── خط الكود ── */}
            <div style={rowStyle}>
              <label style={labelStyle}>خط الكود</label>
              <select value={s.monoFont}
                onChange={(e) => s.setMonoFont(e.target.value)} style={inputStyle}>
                {MONO_FONT_OPTIONS.map((f) => (<option key={f} value={f}>{f}</option>))}
              </select>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>الحجم</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>{s.monoFontSize}px</span>
              </div>
              <input type="range" min={10} max={24} step={1} value={s.monoFontSize}
                onChange={(e) => s.setMonoFontSize(+e.target.value)} style={{ width: '100%' }} />
            </div>

            {/* ── ألوان إضافية ── */}
            <div style={rowStyle}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>لون التمييز</label>
                  <input type="color" value={s.accentColor}
                    onChange={(e) => s.setAccentColor(e.target.value)}
                    style={{ ...inputStyle, padding: '4px', height: '36px', marginTop: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>لون النص الثانوي</label>
                  <input type="color" value={s.mutedColor}
                    onChange={(e) => s.setMutedColor(e.target.value)}
                    style={{ ...inputStyle, padding: '4px', height: '36px', marginTop: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <label style={labelStyle}>حجم النص الثانوي</label>
                <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 700 }}>{s.mutedFontSize}px</span>
              </div>
              <input type="range" min={10} max={20} step={1} value={s.mutedFontSize}
                onChange={(e) => s.setMutedFontSize(+e.target.value)} style={{ width: '100%' }} />
            </div>

            {/* ── رفع الخطوط المحلية ── */}
            <div style={{ ...rowStyle, borderColor: 'rgba(79,195,247,0.3)', background: 'rgba(79,195,247,0.04)' }}>
              <label style={{ ...labelStyle, color: '#4FC3F7', fontWeight: 700, marginBottom: '8px' }}>تثبيت الخطوط محلياً</label>
              <FontUploadRow
                label="خط للنص الأساسي"
                currentName={s.customFontName}
                currentUrl={s.customFontUrl}
                onUpload={(name, url) => s.setCustomFont(name, url)}
                onRemove={() => s.removeCustomFont()}
              />
              <div style={{ height: '8px' }} />
              <FontUploadRow
                label="خط للعناوين"
                currentName={s.customHeadingFontName}
                currentUrl={s.customHeadingFontUrl}
                onUpload={(name, url) => s.setCustomHeadingFont(name, url)}
                onRemove={() => s.removeCustomHeadingFont()}
              />
              <div style={{ color: '#888', fontSize: '11px', marginTop: '6px' }}>
                الصيغ المدعومة: TTF, OTF, WOFF, WOFF2
              </div>
            </div>

            {/* ── معاينة ── */}
            <div style={rowStyle}>
              <label style={labelStyle}>معاينة</label>
              <div style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px',
                fontFamily: `'${s.fontFamily}', sans-serif`, fontSize: `${s.fontSize}px`, color: s.fontColor,
              }}>
                <div style={{ fontFamily: `'${s.headingFont}', sans-serif`, color: s.headingColor, fontSize: `${s.headingFontSize}px`, fontWeight: 700, marginBottom: '8px' }}>
                  عنوان تجريبي
                </div>
                <div>نص أساسي تجريبي — هذا مثال على الخط المختار.</div>
                <div style={{ color: s.mutedColor, fontSize: `${s.mutedFontSize}px`, marginTop: '4px' }}>نص ثانوي تجريبي.</div>
                <div style={{ color: s.accentColor, fontWeight: 700, marginTop: '4px' }}>نص تمييز تجريبي.</div>
                <div style={{ fontFamily: `'${s.monoFont}', monospace`, color: '#ccc', fontSize: `${s.monoFontSize}px`, marginTop: '8px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', direction: 'ltr', textAlign: 'left' }}>
                  const code = "كود تجريبي";
                </div>
              </div>
            </div>
          </div>
        )

      case 'الفيديو':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ ...rowStyle, borderColor: 'rgba(79,195,247,0.3)', background: 'rgba(79,195,247,0.05)' }}>
              <label style={{ ...labelStyle, color: '#4FC3F7', fontWeight: 700 }}>الشخصيات</label>
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="زين — محلل أمني"
                accept="video/*"
                currentUrl={s.customZaynVideoUrl}
                onUpload={s.setCustomZaynVideoUrl}
                onRemove={() => s.setCustomZaynVideoUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="د. نورا — خبيرة تشفير"
                accept="video/*"
                currentUrl={s.customNoraVideoUrl}
                onUpload={s.setCustomNoraVideoUrl}
                onRemove={() => s.setCustomNoraVideoUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="عمر — خبير شبكات"
                accept="video/*"
                currentUrl={s.customOmarVideoUrl}
                onUpload={s.setCustomOmarVideoUrl}
                onRemove={() => s.setCustomOmarVideoUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="ليلى — خبيرة أمن ويب"
                accept="video/*"
                currentUrl={s.customLaylaVideoUrl}
                onUpload={s.setCustomLaylaVideoUrl}
                onRemove={() => s.setCustomLaylaVideoUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="طارق — محلل برمجيات خبيثة"
                accept="video/*"
                currentUrl={s.customTariqVideoUrl}
                onUpload={s.setCustomTariqVideoUrl}
                onRemove={() => s.setCustomTariqVideoUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="النظام — إشعارات وأهداف"
                accept="video/*"
                currentUrl={s.customSystemVideoUrl}
                onUpload={s.setCustomSystemVideoUrl}
                onRemove={() => s.setCustomSystemVideoUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
            <div style={{ ...rowStyle, borderColor: 'rgba(255,183,77,0.3)', background: 'rgba(255,183,77,0.05)' }}>
              <label style={{ ...labelStyle, color: '#FFB74D', fontWeight: 700 }}>المشاهد</label>
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="فيديو الاحتفال (نهاية اللعبة)"
                accept="video/*"
                currentUrl={s.customCelebrationVideoUrl}
                onUpload={s.setCustomCelebrationVideoUrl}
                onRemove={() => s.setCustomCelebrationVideoUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
            <div style={rowStyle}>
              <FileUploadRow
                label="خلفية القائمة الرئيسية"
                accept="video/*"
                currentUrl={s.customBoyVideoUrl}
                onUpload={s.setCustomBoyVideoUrl}
                onRemove={() => s.setCustomBoyVideoUrl('')}
                maxSize={MAX_VIDEO_SIZE}
              />
            </div>
          </div>
        )

      case 'عام':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={rowStyle}>
              <label style={labelStyle}>جودة الرسوم</label>
              <select value={s.qualityPreset}
                onChange={(e) => s.setQuality(e.target.value as 'low' | 'medium' | 'high')}
                style={inputStyle}>
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
              </select>
            </div>
            <div style={rowStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', cursor: 'pointer' }}>
                <input type="checkbox" checked={s.accessibilityMode}
                  onChange={() => s.toggleAccessibility()} />
                وضع الوصول السهل
              </label>
            </div>
            <div style={rowStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', cursor: 'pointer' }}>
                <input type="checkbox" checked={s.darkMode}
                  onChange={() => s.toggleDarkMode()} />
                الوضع الليلي
              </label>
            </div>
            <div style={rowStyle}>
              <Button onClick={() => setShowShortcuts(true)} style={{ width: '100%', textAlign: 'center' }}>
                اختصارات لوحة المفاتيح
              </Button>
            </div>
            <div style={rowStyle}>
              <Button variant="secondary" onClick={() => setShowAdmin(true)} style={{ width: '100%', textAlign: 'center' }}>
                لوحة التحكم 🛠️
              </Button>
            </div>
            <div style={rowStyle}>
              <Button variant="secondary" onClick={s.resetAll} style={{ width: '100%', textAlign: 'center' }}>
                إعادة الإعدادات الافتراضية
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      height: '100%', padding: '20px 16px',
      position: 'relative', zIndex: 1,
    }}>
      <h2 style={{ fontSize: 'var(--heading-font-size)', margin: '0 0 12px', flexShrink: 0, fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>الإعدادات</h2>
      {tabBar}
      <div style={{ flex: 1, overflow: 'auto', width: '100%', maxWidth: '480px' }}>
        {content()}
      </div>
      <div style={{ marginTop: '12px', flexShrink: 0 }}>
        <Button variant="ghost" onClick={onBack}>الرجوع</Button>
      </div>
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
      {showAdmin && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowAdmin(false)}>
          <div style={{
            width: '90%', maxWidth: '700px', height: '80%',
            background: '#0a0a1a', borderRadius: 'var(--custom-border-radius)',
            border: 'var(--custom-border-width) solid var(--custom-border-color)',
            overflow: 'hidden',
          }} onClick={(e) => e.stopPropagation()}>
            <ErrorBoundary>
              <Suspense fallback={<ScreenSkeleton />}>
                <AdminDashboard onBack={() => setShowAdmin(false)} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  )
}
