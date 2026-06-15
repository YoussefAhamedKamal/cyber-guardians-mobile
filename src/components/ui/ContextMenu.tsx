import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettingsStore } from '@/store'
import { useAIStore } from '@/store/aiStore'

interface MenuItem {
  label: string
  icon: string
  action?: () => void
  submenu?: MenuItem[]
  divider?: boolean
  checked?: boolean
}

const PANEL_SIZE_KEY = 'cg-panel-size-preset'

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const s = useSettingsStore()
  const ai = useAIStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault()
      setMenu({ x: e.clientX, y: e.clientY })
      setOpenSubmenu(null)
    }
    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [])

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
        setOpenSubmenu(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  const close = () => { setMenu(null); setOpenSubmenu(null) }

  const setPanelSizePreset = (size: 'small' | 'medium' | 'full') => {
    localStorage.setItem(PANEL_SIZE_KEY, size)
    window.dispatchEvent(new CustomEvent('panel-size-change', { detail: size }))
    close()
  }

  const currentSizePreset = localStorage.getItem(PANEL_SIZE_KEY) || 'medium'

  const fontSizes = [
    { label: 'صغير (12px)', value: 12 },
    { label: 'متوسط (14px)', value: 14 },
    { label: 'كبير (16px)', value: 16 },
    { label: 'كبير جداً (18px)', value: 18 },
  ]

  const themes = [
    { label: 'داكن (افتراضي)', value: true },
    { label: 'فاتح', value: false },
  ]

  const windowSizes: { label: string; value: 'small' | 'medium' | 'full'; desc: string }[] = [
    { label: '🔴 صغير', value: 'small', desc: '30% من الشاشة' },
    { label: '🟡 متوسط', value: 'medium', desc: '50% من الشاشة' },
    { label: '🟢 ملء الشاشة', value: 'full', desc: '100% من الشاشة' },
  ]

  const menuItems: MenuItem[] = [
    {
      label: '🤖 حجم النافذة', icon: '📐', submenu: windowSizes.map(ws => ({
        label: `${ws.label} — ${ws.desc}`,
        icon: currentSizePreset === ws.value ? '✅' : '  ',
        action: () => setPanelSizePreset(ws.value),
        checked: currentSizePreset === ws.value,
      }))
    },
    { divider: true, label: '', icon: '' },
    {
      label: '🎨 السمة', icon: '🎨', submenu: [
        ...themes.map(t => ({
          label: t.label,
          icon: s.darkMode === t.value ? '✅' : '  ',
          action: () => { s.toggleDarkMode(); close() },
          checked: s.darkMode === t.value,
        })),
      ]
    },
    { divider: true, label: '', icon: '' },
    {
      label: '📝 حجم الخط', icon: '📝', submenu: fontSizes.map(f => ({
        label: f.label,
        icon: s.fontSize === f.value ? '✅' : '  ',
        action: () => { s.setFontSize(f.value); close() },
        checked: s.fontSize === f.value,
      }))
    },
    {
      label: '🔊 مستوى الصوت', icon: '🔊', submenu: [
        { label: 'صامت', icon: s.muted ? '✅' : '  ', action: () => { s.toggleMute(); close() } },
        { label: `الموسيقى: ${Math.round(s.bgmVolume * 100)}%`, icon: '🎵', action: () => {} },
        { label: `المؤثرات: ${Math.round(s.sfxVolume * 100)}%`, icon: '🔊', action: () => {} },
      ]
    },
    { divider: true, label: '', icon: '' },
    {
      label: '🤖 AI Panel', icon: '🤖', submenu: [
        {
          label: ai.panelOpen ? '🔒 إغلاق AI' : '🔓 فتح AI',
          icon: ai.panelOpen ? '🔒' : '🔓',
          action: () => { ai.setPanelOpen(!ai.panelOpen); close() }
        },
        {
          label: '📐 تكبير/تصغير',
          icon: ai.panelMaximized ? '◻' : '□',
          action: () => { if (ai.panelOpen) ai.setPanelMaximized(!ai.panelMaximized); close() }
        },
      ]
    },
    { divider: true, label: '', icon: '' },
    {
      label: '⚡ الإعدادات', icon: '⚡',
      action: () => { window.location.hash = '#settings'; close() }
    },
  ]

  if (!menu) return <>{children}</>

  return (
    <>
      {children}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: Math.max(10, Math.min(menu.x, window.innerWidth - 230)),
          top: Math.max(10, Math.min(menu.y, window.innerHeight - 320)),
          zIndex: 99999,
          background: 'rgba(15,15,35,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          padding: '6px',
          minWidth: '210px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 20px rgba(79,195,247,0.1)',
          animation: 'ctx-menu-in 0.15s ease-out',
        }}
      >
        <style>{`
          @keyframes ctx-menu-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .ctx-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; color: #ccc; transition: all 0.15s; white-space: nowrap; }
          .ctx-item:hover { background: rgba(79,195,247,0.15); color: #fff; }
          .ctx-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 8px; }
          .ctx-submenu { position: relative; }
          .ctx-submenu-content { position: absolute; right: 100%; top: -6px; background: rgba(15,15,35,0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 6px; min-width: 220px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); opacity: 0; visibility: hidden; transition: opacity 0.15s, visibility 0.15s; }
          .ctx-submenu:hover .ctx-submenu-content,
          .ctx-submenu.open .ctx-submenu-content { opacity: 1; visibility: visible; }
        `}</style>
        {menuItems.map((item, i) => {
          if (item.divider) return <div key={i} className="ctx-divider" />
          if (item.submenu) {
            const isOpen = openSubmenu === i
            return (
              <div
                key={i}
                className={`ctx-submenu ${isOpen ? 'open' : ''}`}
                onMouseEnter={() => setOpenSubmenu(i)}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <div
                  className="ctx-item"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => setOpenSubmenu(isOpen ? null : i)}
                >
                  <span>{item.label}</span>
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>◀</span>
                </div>
                <div className="ctx-submenu-content">
                  {item.submenu.map((sub, j) => (
                    <div key={j} className="ctx-item" onClick={sub.action}>
                      <span style={{ width: '16px', textAlign: 'center' }}>{sub.icon}</span>
                      <span>{sub.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
          return (
            <div key={i} className="ctx-item" onClick={item.action}>
              <span style={{ width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
