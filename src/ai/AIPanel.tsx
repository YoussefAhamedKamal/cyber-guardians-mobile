import { useState, useRef, useEffect, useCallback } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAIStore } from '@/store/aiStore'
import { useContentStore } from '@/store/contentStore'
import { streamChatMessage, testConnection } from './api'
import { STUDENT_SYSTEM_PROMPT, FACULTY_SYSTEM_PROMPT } from './prompts'
import { pushContentToGitHub, testGitHubConnection, getGitHubConfig, setGitHubConfig, isGitHubConfigured, forkMainRepo, getGitHubUsername, waitForForkReady, enableGitHubPages, setupForkWithPages, resolveGithubOwner, listRepoContents, createNewRepo, copyEntireRepo, setupDirectEdit } from './github'
import { MAIN_REPO } from './github'
import { loadGIS, initGoogleDrive, loginToDrive, isLoggedIn, logout, uploadContentToDrive, uploadFullRepoToDrive } from './googleDrive'
import type { GitHubConfig } from './github'
import { AI_PROVIDERS } from '@/types/ai'
import type { ChatAttachment } from '@/types/ai'
import { getLevels, getCharacters, getGameMeta } from '@/data/gameData'
import type { AIMessage, LevelData, Character, GameMeta } from '@/types'

const FAB_POS_KEY = 'cg-ai-fab-pos'
const PANEL_STATE_KEY = 'cg-ai-panel-state'

function loadFabPos() {
  try { const s = localStorage.getItem(FAB_POS_KEY); return s ? JSON.parse(s) : null } catch { return null }
}
function saveFabPos(pos: { x: number; y: number }) { localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos)) }
function loadPanelState() {
  try { const s = localStorage.getItem(PANEL_STATE_KEY); return s ? JSON.parse(s) : null } catch { return null }
}
function savePanelState(state: { x: number; y: number; w: number; h: number }) { localStorage.setItem(PANEL_STATE_KEY, JSON.stringify(state)) }

function AIFab({ onClick }: { onClick: () => void }) {
  const saved = loadFabPos()
  const [pos, setPos] = useState<{ x: number; y: number } | null>(saved)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, moved: false })

  const getDefaultPos = () => ({ x: window.innerWidth - 64, y: 16 })
  const currentPos = pos ?? getDefaultPos()

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const p = pos ?? getDefaultPos()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: p.x, origY: p.y, moved: false }
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
    const x = Math.max(8, Math.min(window.innerWidth - 56, dragRef.current.origX + dx))
    const y = Math.max(8, Math.min(window.innerHeight - 56, dragRef.current.origY + dy))
    setPos({ x, y })
  }, [dragging])

  const handlePointerUp = useCallback(() => {
    setDragging(false)
    if (pos) saveFabPos(pos)
    if (!dragRef.current.moved) onClick()
  }, [pos, onClick])

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        position: 'fixed', left: currentPos.x, top: currentPos.y, zIndex: 9998,
        width: '48px', height: '48px', borderRadius: '50%',
        border: `2px solid ${hovered ? 'rgba(206,147,216,0.6)' : 'rgba(206,147,216,0.3)'}`,
        background: hovered
          ? 'linear-gradient(135deg, rgba(79,195,247,0.4), rgba(206,147,216,0.4))'
          : 'linear-gradient(135deg, rgba(79,195,247,0.25), rgba(206,147,216,0.25))',
        backdropFilter: 'blur(10px)',
        color: '#fff', cursor: dragging ? 'grabbing' : 'grab',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hovered
          ? '0 6px 28px rgba(206,147,216,0.45), 0 0 20px rgba(79,195,247,0.25)'
          : '0 4px 16px rgba(0,0,0,0.4)',
        transition: dragging ? 'none' : 'box-shadow 0.25s, border-color 0.25s, background 0.25s, transform 0.2s',
        transform: dragging ? 'scale(1.15)' : hovered ? 'scale(1.08)' : 'scale(1)',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-4 5-2-2-4-3-4-5a4 4 0 0 1 4-4z" />
        <path d="M8 14h8" /><path d="M8 17h5" />
        <path d="M2 22c0-3 2-5 4-5h12c2 0 4 2 4 5" />
      </svg>
      {hovered && !dragging && (
        <div style={{
          position: 'absolute', top: '-6px', left: '-6px', right: '-6px', bottom: '-6px',
          borderRadius: '50%', border: '1px solid rgba(206,147,216,0.2)',
          animation: 'ai-fab-pulse 1.5s ease-in-out infinite', pointerEvents: 'none',
        }} />
      )}
      {hovered && !dragging && (
        <div style={{
          position: 'absolute', right: '56px', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.85)', color: '#E1BEE7', fontSize: '13px',
          padding: '6px 12px', borderRadius: '8px', whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 9999, direction: 'ltr',
          border: '1px solid rgba(206,147,216,0.3)',
        }}>
          AI &amp; Advanced Settings
        </div>
      )}
    </div>
  )
}

function ResizeHandle({ position, onResizeStart }: { position: string; onResizeStart: (e: React.PointerEvent, pos: string) => void }) {
  const cursors: Record<string, string> = {
    'top': 'ns-resize', 'bottom': 'ns-resize', 'left': 'ew-resize', 'right': 'ew-resize',
    'top-left': 'nwse-resize', 'top-right': 'nesw-resize',
    'bottom-left': 'nesw-resize', 'bottom-right': 'nwse-resize',
  }
  const sizes: Record<string, React.CSSProperties> = {
    'top': { top: -3, left: 8, right: 8, height: 6 },
    'bottom': { bottom: -3, left: 8, right: 8, height: 6 },
    'left': { top: 8, bottom: 8, left: -3, width: 6 },
    'right': { top: 8, bottom: 8, right: -3, width: 6 },
    'top-left': { top: -4, left: -4, width: 12, height: 12 },
    'top-right': { top: -4, right: -4, width: 12, height: 12 },
    'bottom-left': { bottom: -4, left: -4, width: 12, height: 12 },
    'bottom-right': { bottom: -4, right: -4, width: 12, height: 12 },
  }

  return (
    <div
      onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, position) }}
      style={{
        position: 'absolute', cursor: cursors[position], zIndex: 10,
        background: 'transparent', ...sizes[position],
      }}
    />
  )
}

function AISettings() {
  const ai = useAIStore()
  const contentStore = useContentStore()
  const provider = AI_PROVIDERS.find((p) => p.id === ai.providerId)
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [customModel, setCustomModel] = useState(
    () => provider?.models.find((m) => m.id === ai.modelId) ? '' : ai.modelId
  )
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(() => getGitHubConfig())
  const [ghTestStatus, setGhTestStatus] = useState<string | null>(null)
  const [driveClientId, setDriveClientId] = useState(localStorage.getItem('cg-drive-client-id') || '')
  const [driveStatus, setDriveStatus] = useState<string | null>(null)
  const [driveLoading, setDriveLoading] = useState(false)
  const [ghTesting, setGhTesting] = useState(false)
  const [ghForking, setGhForking] = useState(false)

  useEffect(() => {
    if (provider?.models.some(m => m.id === ai.modelId)) {
      setCustomModel('')
    } else {
      setCustomModel(ai.modelId)
    }
  }, [ai.providerId, ai.modelId, provider])

  const handleTestConnection = async () => {
    setTesting(true); setTestStatus('⏳ جارٍ اختبار الاتصال...')
    try {
      const r = await testConnection(ai.providerId, ai.modelId, ai.apiKeys[ai.providerId] || '', ai.customBaseUrl)
      setTestStatus(r)
    } catch (e: any) { setTestStatus(`⚠️ ${e.message}`) }
    setTesting(false)
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__custom__') {
      ai.setModel('')
      setCustomModel('')
      return
    }
    ai.setModel(e.target.value); setCustomModel('')
  }

  const allModels = provider?.models || []
  const usingCustom = !allModels.some((m) => m.id === ai.modelId)

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', overflow: 'auto', flex: 1 }}>
      <label style={{ color: '#aaa' }}>مزود AI
        <select value={ai.providerId} onChange={(e) => ai.setProvider(e.target.value)} style={inputStyle}>
          {AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      {ai.providerId === 'custom' && (
        <label style={{ color: '#aaa' }}>Base URL
          <input value={ai.customBaseUrl} onChange={(e) => ai.setCustomBaseUrl(e.target.value)} placeholder="https://your-api.com/v1" style={inputStyle} />
        </label>
      )}
      {ai.providerId === 'custom' ? (
        <label style={{ color: '#aaa' }}>اسم النموذج
          <input value={ai.modelId} onChange={(e) => ai.setModel(e.target.value)} placeholder="gpt-4o-mini, ..." style={inputStyle} />
        </label>
      ) : (
        <>
          <label style={{ color: '#aaa' }}>النموذج
            <select value={usingCustom ? '__custom__' : ai.modelId} onChange={handleModelChange} style={inputStyle}>
              {allModels.map((m) => <option key={m.id} value={m.id}>{m.name} {m.free ? '🆓' : ''}</option>)}
              <option value="__custom__">— نموذج مخصص —</option>
            </select>
          </label>
          {usingCustom && (
            <label style={{ color: '#aaa' }}>اسم النموذج المخصص
              <input value={customModel} onChange={(e) => { setCustomModel(e.target.value); ai.setModel(e.target.value.trim()) }} placeholder="..." style={inputStyle} />
            </label>
          )}
        </>
      )}
      <label style={{ color: '#aaa' }}>{provider?.apiKeyLabel || 'API Key'}
        <input type="password" value={ai.apiKeys[ai.providerId] || ''} onChange={(e) => ai.setApiKey(ai.providerId, e.target.value)} placeholder="sk-..." style={inputStyle} />
      </label>
      <button onClick={handleTestConnection} disabled={testing} style={{
        padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
        background: testing ? '#444' : 'linear-gradient(135deg,#4FC3F7,#29B6F6)',
        color: testing ? '#888' : '#0a0a1a', fontWeight: 700, fontSize: '12px', cursor: testing ? 'not-allowed' : 'pointer',
      }}>{testing ? '⏳ جارٍ الاختبار...' : '🔌 اختبار الاتصال'}</button>
      {testStatus && (
        <div style={{
          padding: '8px', borderRadius: '6px', fontSize: '12px', textAlign: 'center',
          background: testStatus.startsWith('✅') ? 'rgba(129,199,132,0.15)' : 'rgba(229,115,115,0.15)',
          border: `1px solid ${testStatus.startsWith('✅') ? 'rgba(129,199,132,0.3)' : 'rgba(229,115,115,0.3)'}`,
          color: testStatus.startsWith('✅') ? '#81C784' : '#E57373',
        }}>{testStatus}</div>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '4px' }}>
        <div style={{ color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>🔐 تغيير رمز هيئة التدريس</div>
        <FacultyPinChanger />
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '4px' }}>
        <div style={{ color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>🔗 إعدادات GitHub</div>

        {/* Instructions */}
        <div style={{ background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '6px', padding: '8px', marginBottom: '8px', fontSize: '10px', lineHeight: 1.6, color: '#aaa' }}>
          <div style={{ color: '#4FC3F7', fontWeight: 700, marginBottom: '4px' }}>📖 خطوات الاستخدام</div>
          <div>1. <b style={{ color: '#fff' }}>Token</b> من GitHub (Settings → Developer settings → Tokens) بصلاحية:</div>
          <div style={{ padding: '3px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', margin: '3px 0', direction: 'ltr', textAlign: 'left', fontSize: '10px' }}>
            ☑️ <b style={{ color: '#fff' }}>repo</b><br/>
            ☑️ <b style={{ color: '#fff' }}>workflow</b> —(Update GitHub Action workflows)
          </div>
          <div>2. اختر أحد الخيارين:</div>
          <div style={{ padding: '3px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', margin: '3px 0', fontSize: '10px' }}>
            <b style={{ color: '#81C784' }}>🟢 التعديل المباشر</b> — يعدّل في مستودعك الموجود<br/>
            <b style={{ color: '#FFB74D' }}>🟡 إنشاء مستودع جديد</b> — ينسخ كل الملفات في commit واحد
          </div>
          <div>3. اضغط <b style={{ color: '#4FC3F7' }}>🔌 اختبار الاتصال</b> للتأكد</div>
          <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#81C784' }}>🟢 <b>مميزات النسخ الجديد:</b></div>
            <div>• <b style={{ color: '#fff' }}>commit واحد</b> لكل الملفات — Git Data API</div>
            <div>• <b style={{ color: '#fff' }}>public/</b> بالكامل — <span style={{ color: '#81C784' }}>index.html</span> وكل الملفات الأساسية</div>
            <div>• <b style={{ color: '#fff' }}>base path</b> يُحدّث تلقائياً — <span style={{ color: '#81C784' }}>vite.config.ts</span></div>
            <div>• <b style={{ color: '#fff' }}>package.json</b> و <b style={{ color: '#fff' }}>README.md</b> يُحدّثان</div>
            <div>• <b style={{ color: '#fff' }}>GitHub Pages</b> يُفعّل تلقائياً</div>
            <div style={{ color: '#888', marginTop: '2px' }}>⏭️ فقط الملفات {'>'} 50MB وملفات الوسائط تُتخطى</div>
          </div>
        </div>

        {/* خيار 1: التعديل المباشر */}
        <div style={{ background: 'rgba(129,199,132,0.1)', border: '1px solid rgba(129,199,132,0.3)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
          <div style={{ color: '#81C784', fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>🟢 الخيار 1: التعديل المباشر في المستودع الرئيسي</div>
          <div style={{ color: '#aaa', fontSize: '10px', marginBottom: '6px' }}>يعدّل الملفات مباشرة في مستودعك الرئيسي بدون إنشاء نسخة جديدة</div>
          <button onClick={async () => {
            if (!ghConfig.token) { setGhTestStatus('❌ أدخل Token أولاً'); return }
            setGhForking(true); setGhTestStatus('⏳ جارٍ إعداد التعديل المباشر...')
            await setGitHubConfig(ghConfig)
            try {
              const username = await getGitHubUsername()
              setGhConfig({ ...ghConfig, owner: username })
              await setGitHubConfig({ ...ghConfig, owner: username })
              const result = await setupDirectEdit()
              setGhConfig({ ...ghConfig, owner: result.owner, repo: result.repo })
              await setGitHubConfig({ ...ghConfig, owner: result.owner, repo: result.repo })
              setGhTestStatus(`✅ جاهز للتعديل المباشر!\n📦 ${result.owner}/${result.repo}\n🌐 ${result.pagesUrl}\n\nيمكنك الآن رفع التعديلات مباشرة`)
            } catch (e: any) { setGhTestStatus(`❌ ${e.message}`) }
            setGhForking(false)
          }} disabled={ghForking || !ghConfig.token} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: ghForking ? '#444' : 'linear-gradient(135deg,#81C784,#4CAF50)', color: ghForking ? '#888' : '#0a0a1a', fontWeight: 700, fontSize: '11px', cursor: ghForking ? 'not-allowed' : 'pointer', opacity: !ghConfig.token ? 0.5 : 1 }}>
            {ghForking ? '⏳ جارٍ الإعداد...' : '🟢 التعديل المباشر'}
          </button>
        </div>

        {/* خيار 2: إنشاء مستودع جديد */}
        <div style={{ background: 'rgba(255,183,77,0.1)', border: '1px solid rgba(255,183,77,0.3)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
          <div style={{ color: '#FFB74D', fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>🟡 الخيار 2: إنشاء مستودع جديد مع كل الملفات</div>
          <div style={{ color: '#aaa', fontSize: '10px', marginBottom: '6px' }}>ينشئ مستودعاً جديداً ويرفع كل ملفات اللعبة إليه في فرع جديد</div>
          <label style={{ color: '#fff', fontSize: '10px', display: 'block', marginBottom: '4px' }}>اسم المستودع الجديد:<input value={ghConfig.repo} onChange={(e) => setGhConfig({ ...ghConfig, repo: e.target.value })} placeholder="my-cyber-guardians" style={{ ...inputStyle, fontSize: '11px' }} /></label>
          <button onClick={async () => {
            if (!ghConfig.token) { setGhTestStatus('❌ أدخل Token أولاً'); return }
            if (!ghConfig.repo) { setGhTestStatus('❌ أدخل اسم المستودع الجديد'); return }
            setGhForking(true); setGhTestStatus('⏳ جارٍ إنشاء المستودع ورفع الملفات...')
            await setGitHubConfig(ghConfig)
            try {
              const username = await getGitHubUsername()
              setGhConfig({ ...ghConfig, owner: username })
              await setGitHubConfig({ ...ghConfig, owner: username })
              setGhTestStatus(`⏳ جارٍ إنشاء مستودع ${ghConfig.repo}...`)
              const newRepo = await createNewRepo(ghConfig.repo, 'Cyber Guardians Mobile — نسخة مخصصة')
              setGhTestStatus(`⏳ جارٍ رفع الملفات إلى ${newRepo.owner}/${newRepo.repo}...`)
              const contentData = {
                gameMeta: contentStore.gameMeta as unknown as Record<string, unknown>,
                levels: (contentStore.newLevels || []) as unknown[],
                characters: contentStore.newCharacters as Record<string, unknown>,
              }
                const results = await copyEntireRepo(MAIN_REPO.owner, MAIN_REPO.repo, newRepo.owner, newRepo.repo, 'main', contentData)
              setGhConfig({ ...ghConfig, owner: newRepo.owner, repo: newRepo.repo })
              await setGitHubConfig({ ...ghConfig, owner: newRepo.owner, repo: newRepo.repo })
              await enableGitHubPages(newRepo.owner, newRepo.repo, 'main')
              const ok = results.filter(r => r.startsWith('✅')).length
              const fail = results.filter(r => r.startsWith('❌')).length
              const warn = results.filter(r => r.startsWith('⚠️')).length
              setGhTestStatus(`✅ تم الإنشاء!\n📦 ${newRepo.owner}/${newRepo.repo}\n🌐 https://${newRepo.owner}.github.io/${newRepo.repo}/\n✅ نجح ${ok} | ❌ فشل ${fail} | ⚠️ تحذير ${warn}\n\n${results.join('\n')}`)
            } catch (e: any) { setGhTestStatus(`❌ ${e.message}`) }
            setGhForking(false)
          }} disabled={ghForking || !ghConfig.token} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: ghForking ? '#444' : 'linear-gradient(135deg,#FFB74D,#FF9800)', color: ghForking ? '#888' : '#0a0a1a', fontWeight: 700, fontSize: '11px', cursor: ghForking ? 'not-allowed' : 'pointer', opacity: !ghConfig.token ? 0.5 : 1 }}>
            {ghForking ? '⏳ جارٍ الإنشاء والرفع...' : '🟡 إنشاء مستودع جديد'}
          </button>
        </div>

        {/* Google Drive رفع إلى */}
        <div style={{ background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.3)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
          <div style={{ color: '#669DF6', fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>🔵 Google Drive: رفع نسخة احتياطية</div>
          <div style={{ color: '#aaa', fontSize: '10px', marginBottom: '6px' }}>يرفع بيانات اللعبة (الشخصيات، المستويات، الإعدادات) أو المشروع كامل إلى Google Drive</div>
          <div style={{ background: 'rgba(66,133,244,0.06)', border: '1px solid rgba(66,133,244,0.15)', borderRadius: '4px', padding: '6px', marginBottom: '6px', fontSize: '10px', lineHeight: 1.6, color: '#aaa' }}>
            <div style={{ color: '#669DF6', fontWeight: 700, marginBottom: '3px' }}>📖 خطوات تفعيل Google Drive</div>
            <div>1. افتح <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style={{ color: '#669DF6' }}>Google Cloud Console</a></div>
            <div>2. اعمل <b style={{ color: '#fff' }}>مشروع جديد</b> ← اسمه مثلاً "Cyber Guardians"</div>
            <div>3. اذهب إلى <b style={{ color: '#fff' }}>APIs & Services → Library</b></div>
            <div>4. دوّر على <b style={{ color: '#fff' }}>Google Drive API</b> وفعّله</div>
            <div>5. اذهب إلى <b style={{ color: '#fff' }}>APIs & Services → Credentials</b></div>
            <div>6. اضغط <b style={{ color: '#fff' }}>Create Credentials → OAuth client ID</b></div>
            <div>7. النوع: <b style={{ color: '#fff' }}>Web application</b></div>
            <div>8. حط <b style={{ color: '#fff' }}>http://localhost:5173</b> ورابط موقعك في <b style={{ color: '#fff' }}>Authorized JavaScript origins</b></div>
            <div>9. انسخ الـ <b style={{ color: '#fff' }}>Client ID</b> (رقم طويل) وحطه في الخانة تحت</div>
          </div>
          <label style={{ color: '#fff', fontSize: '10px', display: 'block', marginBottom: '4px' }}>Google Client ID:<input value={driveClientId} onChange={(e) => { setDriveClientId(e.target.value); localStorage.setItem('cg-drive-client-id', e.target.value) }} placeholder="123456789-xxxxx.apps.googleusercontent.com" style={{ ...inputStyle, fontSize: '11px' }} /></label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={async () => {
              if (isLoggedIn()) { logout(); setDriveStatus('✅ تم تسجيل الخروج'); return }
              if (!driveClientId.trim()) { setDriveStatus('❌ أدخل Google Client ID أولاً'); return }
              setDriveLoading(true); setDriveStatus('⏳ جارٍ تحميل مكتبة Google...')
              try {
                await loadGIS()
                initGoogleDrive(driveClientId.trim())
                setDriveStatus('⏳ جارٍ تسجيل الدخول إلى Google...')
                await loginToDrive()
                setDriveStatus('✅ تم تسجيل الدخول إلى Google Drive')
              } catch (e: any) { setDriveStatus(`❌ ${e.message}`) }
              setDriveLoading(false)
            }} disabled={driveLoading} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: driveLoading ? '#444' : '#4285F4', color: driveLoading ? '#888' : '#fff', fontWeight: 700, fontSize: '11px', cursor: driveLoading ? 'not-allowed' : 'pointer' }}>
              {driveLoading ? '⏳...' : isLoggedIn() ? '🚪 تسجيل خروج' : '🔑 تسجيل الدخول'}
            </button>
            <button onClick={async () => {
              if (!isLoggedIn()) { setDriveStatus('❌ سجل الدخول أولاً'); return }
              setDriveLoading(true); setDriveStatus('⏳ جارٍ رفع المحتوى...')
              try {
                const contentData = {
                  gameMeta: contentStore.gameMeta as unknown as Record<string, unknown>,
                  levels: (contentStore.newLevels || []) as unknown[],
                  characters: contentStore.newCharacters as Record<string, unknown>,
                }
                const results = await uploadContentToDrive(contentData, `Cyber Guardians - ${new Date().toLocaleDateString('ar-EG')}`)
                setDriveStatus(results.join('\n'))
              } catch (e: any) { setDriveStatus(`❌ ${e.message}`) }
              setDriveLoading(false)
            }} disabled={driveLoading || !isLoggedIn()} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: driveLoading || !isLoggedIn() ? '#444' : '#4285F4', color: driveLoading || !isLoggedIn() ? '#888' : '#fff', fontWeight: 700, fontSize: '11px', cursor: driveLoading || !isLoggedIn() ? 'not-allowed' : 'pointer', opacity: isLoggedIn() ? 1 : 0.5 }}>
              {driveLoading ? '⏳...' : '📄 رفع المحتوى فقط'}
            </button>
            <button onClick={async () => {
              if (!isLoggedIn()) { setDriveStatus('❌ سجل الدخول أولاً'); return }
              if (!ghConfig.token) { setDriveStatus('❌ أدخل GitHub Token أولاً'); return }
              setDriveLoading(true); setDriveStatus('⏳ جارٍ رفع المشروع كامل...')
              try {
                const contentData = {
                  gameMeta: contentStore.gameMeta as unknown as Record<string, unknown>,
                  levels: (contentStore.newLevels || []) as unknown[],
                  characters: contentStore.newCharacters as Record<string, unknown>,
                }
                const results = await uploadFullRepoToDrive(
                  MAIN_REPO.owner, MAIN_REPO.repo, ghConfig.token,
                  `Cyber Guardians Full - ${new Date().toLocaleDateString('ar-EG')}`,
                  contentData
                )
                setDriveStatus(results.join('\n'))
              } catch (e: any) { setDriveStatus(`❌ ${e.message}`) }
              setDriveLoading(false)
            }} disabled={driveLoading || !isLoggedIn() || !ghConfig.token} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: driveLoading || !isLoggedIn() || !ghConfig.token ? '#444' : '#34A853', color: driveLoading || !isLoggedIn() || !ghConfig.token ? '#888' : '#fff', fontWeight: 700, fontSize: '11px', cursor: driveLoading || !isLoggedIn() || !ghConfig.token ? 'not-allowed' : 'pointer', opacity: isLoggedIn() && ghConfig.token ? 1 : 0.5 }}>
              {driveLoading ? '⏳ جارٍ رفع المشروع...' : '📦 رفع المشروع كامل'}
            </button>
          </div>
          <div style={{ color: '#aaa', fontSize: '9px', marginTop: '4px' }}>يلزم <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style={{ color: '#669DF6' }}>Google Client ID</a> من Google Cloud Console مع تفعيل Drive API</div>
          {driveStatus && (
            <div style={{
              marginTop: '6px', padding: '6px', borderRadius: '4px', fontSize: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              maxHeight: '200px', overflowY: 'auto', lineHeight: '1.4',
              background: driveStatus.startsWith('✅') ? 'rgba(129,199,132,0.12)' : driveStatus.startsWith('⚠️') ? 'rgba(255,183,77,0.12)' : 'rgba(229,115,115,0.12)',
              border: `1px solid ${driveStatus.startsWith('✅') ? 'rgba(129,199,132,0.25)' : driveStatus.startsWith('⚠️') ? 'rgba(255,183,77,0.25)' : 'rgba(229,115,115,0.25)'}`,
              color: driveStatus.startsWith('✅') ? '#81C784' : driveStatus.startsWith('⚠️') ? '#FFB74D' : '#E57373',
            }}>{driveStatus}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
          <label style={{ color: '#fff', fontWeight: 500 }}>Token<input type="password" value={ghConfig.token} onChange={(e) => setGhConfig({ ...ghConfig, token: e.target.value })} placeholder="ghp_..." style={inputStyle} /></label>
          <label style={{ color: '#fff', fontWeight: 500 }}>Owner (اسم المستخدم أو الإيميل)<input value={ghConfig.owner} onChange={(e) => setGhConfig({ ...ghConfig, owner: e.target.value })} placeholder="your-username أو email@github.com" style={inputStyle} /></label>
          <label style={{ color: '#fff', fontWeight: 500 }}>Repo (اسم المستودع)<input value={ghConfig.repo} onChange={(e) => setGhConfig({ ...ghConfig, repo: e.target.value })} placeholder="cyber-guardians-mobile" style={inputStyle} /></label>
          <label style={{ color: '#fff', fontWeight: 500 }}>Branch (الفرع)<input value={ghConfig.branch} onChange={(e) => setGhConfig({ ...ghConfig, branch: e.target.value })} placeholder="main" style={inputStyle} /></label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={async () => { await setGitHubConfig(ghConfig); setGhTestStatus('✅ تم الحفظ') }} style={{ ...smallBtnStyle, color: '#81C784', fontSize: '11px' }}>💾 حفظ</button>
            <button onClick={async () => { setGhTesting(true); setGhTestStatus('⏳ جارٍ الاختبار...'); await setGitHubConfig(ghConfig); try { let username; try { username = await getGitHubUsername(); setGhConfig({ ...ghConfig, owner: username }); await setGitHubConfig({ ...ghConfig, owner: username }) } catch {}; const r = await testGitHubConnection(); setGhTestStatus(r) } catch (e: any) { setGhTestStatus(`❌ ${e.message}`) } setGhTesting(false) }} disabled={ghTesting} style={{ ...smallBtnStyle, color: '#4FC3F7', fontSize: '11px', opacity: ghTesting ? 0.5 : 1 }}>{ghTesting ? '⏳...' : '🔌 اختبار الاتصال'}</button>
          </div>
          {ghTestStatus && (
              <div style={{
                padding: '8px',
                borderRadius: '6px',
                background: ghTestStatus.startsWith('✅') ? 'rgba(129,199,132,0.15)' : 'rgba(229,115,115,0.15)',
                border: `1px solid ${ghTestStatus.startsWith('✅') ? 'rgba(129,199,132,0.3)' : 'rgba(229,115,115,0.3)'}`,
                color: ghTestStatus.startsWith('✅') ? '#81C784' : '#E57373',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '10px',
                lineHeight: '1.5',
              }}>{ghTestStatus}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder, onMsgClear }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string; onMsgClear: () => void
}) {
  return (
    <label style={{ color: '#fff', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => { onChange(e.target.value); onMsgClear() }} placeholder={placeholder} style={{ ...inputStyle, paddingRight: '32px' }} />
        <button onClick={onToggle} type="button" style={{
          position: 'absolute', right: '6px', background: 'none', border: 'none',
          color: '#888', cursor: 'pointer', fontSize: '14px', padding: '2px',
        }}>
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </label>
  )
}

function FacultyPinChanger() {
  const ai = useAIStore()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [showCurrentPin, setShowCurrentPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  const handleChange = async () => {
    if (currentPin.length > 0) {
      const ok = await ai.unlockFaculty(currentPin)
      if (!ok) {
        setMsg('❌ الرمز الحالي خطأ')
        return
      }
    }
    if (newPin.length < 4) {
      setMsg('❌ الرمز الجديد يجب أن يكون 4 أحرف على الأقل')
      return
    }
    if (newPin !== confirmPin) {
      setMsg('❌ الرمز الجديد غير متطابق')
      return
    }
    await ai.setFacultyPin(newPin)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setMsg('✅ تم تغيير الرمز بنجاح')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
      <PasswordField label="الرمز الحالي" value={currentPin} onChange={setCurrentPin} show={showCurrentPin} onToggle={() => setShowCurrentPin(!showCurrentPin)} placeholder="****" onMsgClear={() => setMsg(null)} />
      <PasswordField label="الرمز الجديد" value={newPin} onChange={setNewPin} show={showNewPin} onToggle={() => setShowNewPin(!showNewPin)} placeholder="4 أحرف على الأقل" onMsgClear={() => setMsg(null)} />
      <PasswordField label="تأكيد الرمز الجديد" value={confirmPin} onChange={setConfirmPin} show={showConfirmPin} onToggle={() => setShowConfirmPin(!showConfirmPin)} placeholder="أعد إدخال الرمز" onMsgClear={() => setMsg(null)} />
      <button onClick={handleChange} style={{
        padding: '8px', borderRadius: '6px', border: 'none',
        background: 'linear-gradient(135deg,#CE93D8,#BA68C8)',
        color: '#0a0a1a', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
      }}>💾 حفظ الرمز</button>
      {msg && (
        <div style={{
          padding: '8px', borderRadius: '6px', fontSize: '12px', textAlign: 'center',
          background: msg.startsWith('✅') ? 'rgba(129,199,132,0.2)' : 'rgba(229,115,115,0.2)',
          border: `1px solid ${msg.startsWith('✅') ? 'rgba(129,199,132,0.4)' : 'rgba(229,115,115,0.4)'}`,
          color: msg.startsWith('✅') ? '#81C784' : '#E57373',
        }}>{msg}</div>
      )}
    </div>
  )
}

function copyToClipboard(text: string) { navigator.clipboard?.writeText(text) }

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadMd(content: string, filename: string) { downloadFile(content, `${filename}.md`, 'text/markdown') }

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function downloadDocx(content: string, filename: string) {
  const escaped = escapeHtml(content).replace(/\n/g, '<br>')
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8}pre{background:#f4f4f4;padding:10px;border-radius:4px}code{background:#f4f4f4;padding:2px 4px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px}</style></head><body>${escaped}</body></html>`
  downloadFile(html, `${filename}.doc`, 'application/msword')
}

function downloadPdf(content: string, filename: string) {
  const escaped = escapeHtml(content).replace(/\n/g, '<br>')
  const html = `<html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;direction:rtl;text-align:right;padding:20px;line-height:1.8;font-size:14px}pre{background:#f4f4f4;padding:10px;border-radius:4px;white-space:pre-wrap}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px}</style></head><body>${escaped}</body></html>`
  downloadFile(html, `${filename}.html`, 'text/html')
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#ddd' }}>
      <Markdown remarkPlugins={[remarkGfm]} components={{
        p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
        h1: ({ children }) => <h1 style={{ fontSize: '18px', margin: '12px 0 8px', color: '#4FC3F7' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: '16px', margin: '10px 0 6px', color: '#4FC3F7' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: '14px', margin: '8px 0 4px', color: '#CE93D8' }}>{children}</h3>,
        strong: ({ children }) => <strong style={{ color: '#fff' }}>{children}</strong>,
        code: ({ className, children }) => {
          const isBlock = className?.includes('language-')
          return isBlock
            ? <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', overflow: 'auto', direction: 'ltr', textAlign: 'left', fontSize: '12px', margin: '8px 0' }}><code>{children}</code></pre>
            : <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px', fontSize: '12px', direction: 'ltr' }}>{children}</code>
        },
        ul: ({ children }) => <ul style={{ margin: '4px 0', paddingRight: '20px' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: '4px 0', paddingRight: '20px' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '2px' }}>{children}</li>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener" style={{ color: '#4FC3F7' }}>{children}</a>,
        blockquote: ({ children }) => <blockquote style={{ borderRight: '3px solid #CE93D8', paddingRight: '12px', margin: '8px 0', color: '#aaa' }}>{children}</blockquote>,
        table: ({ children }) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0', fontSize: '12px' }}>{children}</table>,
        th: ({ children }) => <th style={{ border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', background: 'rgba(79,195,247,0.1)', color: '#4FC3F7', fontWeight: 700 }}>{children}</th>,
        td: ({ children }) => <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px' }}>{children}</td>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }} />,
      }}>{content}</Markdown>
    </div>
  )
}

function Bubble({ msg, index, onEdit, onRegenerate }: { msg: AIMessage; index?: number; onEdit?: (idx: number, content: string) => void; onRegenerate?: (idx: number) => void }) {
  const isUser = msg.role === 'user'
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(msg.content)
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleCopy = () => { copyToClipboard(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  const handleSave = () => { onEdit?.(index!, editContent); setIsEditing(false) }

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
      <div style={{
        maxWidth: '90%', padding: '10px 14px', borderRadius: '12px',
        background: isUser ? 'rgba(79,195,247,0.2)' : 'rgba(255,255,255,0.06)',
        color: '#ddd', border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
      }}>
        {isEditing ? (
          <div>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '13px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <button onClick={handleSave} style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: '#81C784', color: '#0a0a1a', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>حفظ</button>
              <button onClick={() => setIsEditing(false)} style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#aaa', fontSize: '11px', cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        ) : (
          <>
            {isUser ? (
              <div style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.content}
                {msg.attachments?.filter((a) => a.type === 'image').map((att, i) => (
                  <img key={i} src={att.content} alt={att.name} style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', marginTop: '6px', display: 'block' }} />
                ))}
              </div>
            ) : (
              <MarkdownContent content={msg.content} />
            )}
          </>
        )}
        {/* Action buttons */}
        {!isEditing && (
          <div style={{ display: 'flex', gap: '2px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            {isUser && index !== undefined && onEdit && (
              <button onClick={() => setIsEditing(true)} title="تعديل" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px', padding: '2px 6px', borderRadius: '3px' }}>✏️</button>
            )}
            {!isUser && index !== undefined && onRegenerate && (
              <button onClick={() => onRegenerate(index)} title="إعادة التوليد" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px', padding: '2px 6px', borderRadius: '3px' }}>🔄</button>
            )}
            {!isUser && (
              <>
                <button onClick={handleCopy} title="نسخ" style={{ background: 'none', border: 'none', color: copied ? '#81C784' : '#888', cursor: 'pointer', fontSize: '11px', padding: '2px 6px', borderRadius: '3px' }}>{copied ? '✅' : '📋'}</button>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowMenu(!showMenu)} title="تنزيل" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px', padding: '2px 6px', borderRadius: '3px' }}>⬇️</button>
                  {showMenu && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#1a1f3a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '4px', minWidth: '100px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                      <button onClick={() => { downloadMd(msg.content, `ai-response-${Date.now()}`); setShowMenu(false) }} style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', background: 'transparent', color: '#ddd', fontSize: '11px', cursor: 'pointer', textAlign: 'right', borderRadius: '4px' }}>.md Markdown</button>
                      <button onClick={() => { downloadDocx(msg.content, `ai-response-${Date.now()}`); setShowMenu(false) }} style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', background: 'transparent', color: '#ddd', fontSize: '11px', cursor: 'pointer', textAlign: 'right', borderRadius: '4px' }}>.docx Word</button>
                      <button onClick={() => { downloadPdf(msg.content, `ai-response-${Date.now()}`); setShowMenu(false) }} style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', background: 'transparent', color: '#ddd', fontSize: '11px', cursor: 'pointer', textAlign: 'right', borderRadius: '4px' }}>.pdf PDF</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SessionBar({ type }: { type: 'student' | 'faculty' }) {
  const ai = useAIStore()
  const sessions = type === 'student' ? ai.studentSessions : ai.facultySessions
  const activeId = type === 'student' ? ai.activeStudentSessionId : ai.activeFacultySessionId
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const create = () => { type === 'student' ? ai.createStudentSession() : ai.createFacultySession() }
  const switchTo = (id: string) => { type === 'student' ? ai.switchStudentSession(id) : ai.switchFacultySession(id) }
  const deleteSession = (id: string) => { if (confirm('حذف الجلسة؟')) { type === 'student' ? ai.deleteStudentSession(id) : ai.deleteFacultySession(id) } }
  const startRename = (id: string, name: string) => { setEditingId(id); setEditName(name) }
  const saveRename = () => { if (editingId && editName.trim()) { type === 'student' ? ai.renameStudentSession(editingId, editName.trim()) : ai.renameFacultySession(editingId, editName.trim()); setEditingId(null) } }

  return (
    <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', flexShrink: 0 }}>
      {sessions.map((s) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '11px', background: s.id === activeId ? 'rgba(79,195,247,0.15)' : 'rgba(255,255,255,0.04)', color: s.id === activeId ? '#4FC3F7' : '#888', border: `1px solid ${s.id === activeId ? 'rgba(79,195,247,0.3)' : 'transparent'}` }} onClick={() => switchTo(s.id)}>
          {editingId === s.id ? (
            <input value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={saveRename} onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingId(null) }} autoFocus style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', outline: 'none', width: '80px', padding: 0 }} onClick={(e) => e.stopPropagation()} />
          ) : (
            <>
              <span onDoubleClick={() => startRename(s.id, s.name)}>{s.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '10px', padding: '0 2px' }}>✕</button>
            </>
          )}
        </div>
      ))}
      <button onClick={create} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>+ جلسة</button>
    </div>
  )
}

function FileUploadButton({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={inputRef} type="file" multiple accept="text/*,image/*,video/*,audio/*,.json,.txt,.md,.csv" style={{ display: 'none' }} onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) onFiles(files); e.target.value = '' }} />
      <button onClick={() => inputRef.current?.click()} title="رفع ملف" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px', padding: '4px 6px', borderRadius: '4px' }}>📎</button>
    </>
  )
}

function readFiles(files: File[], onStatus?: (idx: number, status: 'success' | 'error', error?: string) => void): Promise<ChatAttachment[]> {
  return Promise.all(files.map((file, idx) => new Promise<ChatAttachment>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      const att: ChatAttachment = file.type.startsWith('image/')
        ? { name: file.name, type: 'image', content, mimeType: file.type, uploadStatus: 'success' }
        : file.type.startsWith('video/')
        ? { name: file.name, type: 'video', content: `[فيديو: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)]`, mimeType: file.type, uploadStatus: 'success' }
        : file.type.startsWith('audio/')
        ? { name: file.name, type: 'audio', content: `[صوت: ${file.name} (${(file.size / 1024).toFixed(0)}KB)]`, mimeType: file.type, uploadStatus: 'success' }
        : { name: file.name, type: 'text', content, mimeType: file.type, uploadStatus: 'success' }
      onStatus?.(idx, 'success')
      resolve(att)
    }
    reader.onerror = () => {
      onStatus?.(idx, 'error', 'فشل قراءة الملف')
      resolve({ name: file.name, type: 'file', content: `[ملف: ${file.name}]`, mimeType: file.type, uploadStatus: 'error', uploadError: 'فشل قراءة الملف' })
    }
    if (file.type.startsWith('image/')) reader.readAsDataURL(file); else reader.readAsText(file)
  })))
}

function StudentChat() {
  const ai = useAIStore()
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const session = ai.getActiveStudentSession()
  const messages = session?.messages || []

  useEffect(() => {
    if (ai.studentSessions.length === 0) ai.createStudentSession('جلسة جديدة')
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  const sendMessage = async (msgs: AIMessage[]) => {
    ai.setLoading(true); setStreaming('')
    try {
      const systemMsg: AIMessage = { role: 'system', content: STUDENT_SYSTEM_PROMPT }
      let full = ''; const gen = streamChatMessage(ai.providerId, ai.modelId, [systemMsg, ...msgs], ai.apiKeys[ai.providerId] || '', ai.customBaseUrl)
      for await (const chunk of gen) { full += chunk; setStreaming(full) }
      ai.addStudentMessage({ role: 'assistant', content: full })
    } catch (err: any) { ai.addStudentMessage({ role: 'assistant', content: `⚠️ ${err.message || 'حدث خطأ'}` }) }
    ai.setLoading(false); setStreaming('')
  }

  const handleSend = async () => {
    const text = input.trim(); if ((!text && pendingAttachments.length === 0) || ai.loading) return
    if (!ai.getActiveStudentSession()) ai.createStudentSession()
    setInput('')
    const userMsg: AIMessage = { role: 'user', content: text || 'ملف مرفق', attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined }
    setPendingAttachments([])
    ai.addStudentMessage(userMsg)
    await sendMessage([...messages, userMsg])
  }

  const handleFiles = async (files: File[]) => {
    const pending = files.map((f) => ({ name: f.name, type: 'file' as const, content: '', mimeType: f.type, uploadStatus: 'uploading' as const }))
    setPendingAttachments((prev) => [...prev, ...pending])
    const attachments = await readFiles(files)
    setPendingAttachments((prev) => {
      const next = [...prev]
      for (let i = 0; i < pending.length; i++) {
        const idx = next.length - pending.length + i
        if (idx >= 0 && idx < next.length) next[idx] = attachments[i]!
      }
      return next
    })
  }
  const removeAttachment = (idx: number) => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))

  const handleEdit = async (idx: number, content: string) => {
    const trimmed = messages.slice(0, idx)
    ai.clearStudentMessages()
    trimmed.forEach((m) => ai.addStudentMessage(m))
    ai.addStudentMessage({ role: 'user', content })
    await sendMessage([...trimmed, { role: 'user', content }])
  }

  const handleRegenerate = async (idx: number) => {
    const trimmed = messages.slice(0, idx)
    ai.clearStudentMessages()
    trimmed.forEach((m) => ai.addStudentMessage(m))
    await sendMessage(trimmed)
  }

  const uploadIcon = (a: ChatAttachment) => {
    if (a.uploadStatus === 'uploading') return '⏳'
    if (a.uploadStatus === 'error') return '❌'
    if (a.uploadStatus === 'success') return a.type === 'image' ? '🖼️' : a.type === 'video' ? '🎬' : a.type === 'audio' ? '🎵' : '📄'
    return a.type === 'image' ? '🖼️' : a.type === 'video' ? '🎬' : a.type === 'audio' ? '🎵' : '📄'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SessionBar type="student" />
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {messages.length === 0 && !streaming && <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '40px' }}>اسأل عن أي مفهوم في الأمن السيبراني</div>}
        {messages.map((msg, i) => <Bubble key={i} msg={msg} index={i} onEdit={handleEdit} onRegenerate={handleRegenerate} />)}
        {streaming && <Bubble msg={{ role: 'assistant', content: streaming }} />}
        <div ref={bottomRef} />
      </div>
      {pendingAttachments.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', padding: '4px 8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {pendingAttachments.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 6px', borderRadius: '4px',
              background: a.uploadStatus === 'error' ? 'rgba(229,115,115,0.1)' : a.uploadStatus === 'success' ? 'rgba(129,199,132,0.1)' : 'rgba(79,195,247,0.1)',
              fontSize: '10px',
              color: a.uploadStatus === 'error' ? '#E57373' : a.uploadStatus === 'success' ? '#81C784' : '#4FC3F7',
            }}>
              {uploadIcon(a)} {a.name}
              {a.uploadStatus === 'success' && <span style={{ fontSize: '8px', color: '#81C784' }}>✓</span>}
              {a.uploadStatus === 'error' && <span title={a.uploadError} style={{ fontSize: '8px', color: '#E57373' }}>!</span>}
              <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '10px' }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '4px', padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <FileUploadButton onFiles={handleFiles} />
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={ai.loading ? '...' : 'اكتب سؤالك أو ارفع ملف...'} disabled={ai.loading}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '13px', outline: 'none' }} />
        <button onClick={handleSend} disabled={ai.loading || (!input.trim() && pendingAttachments.length === 0)} style={{
          padding: '8px 14px', borderRadius: '8px', border: 'none',
          background: ai.loading ? '#444' : 'linear-gradient(135deg,#4FC3F7,#29B6F6)',
          color: '#0a0a1a', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: ai.loading ? 0.5 : 1,
        }}>إرسال</button>
      </div>
    </div>
  )
}

function parseAIUpdates(text: string): { updates: any[]; cleanText: string } {
  const updates: any[] = []; let cleanText = text
  const regex = /<<<JSON>>>\s*([\s\S]*?)\s*<<<END_JSON>>>/g; let match
  while ((match = regex.exec(text)) !== null) { try { updates.push(JSON.parse(match[1]!)) } catch {} cleanText = cleanText.replace(match[0], '').trim() }
  return { updates, cleanText }
}

function applyUpdates(updates: any[]): string[] {
  const store = useContentStore.getState(); const results: string[] = []
  for (const u of updates) {
    try {
      if (u.type === 'gameMeta') {
        if (u.action === 'modify' && u.data) { store.setGameMeta(u.data); results.push(`✅ تعديل إعدادات اللعبة`) }
        else if (u.action === 'reset') { store.resetGameMeta(); results.push(`✅ إعادة ضبط إعدادات اللعبة`) }
      } else if (u.type === 'level') {
        if (u.action === 'add' && u.data) { store.addLevel(u.data as LevelData); results.push(`✅ إضافة المستوى "${u.data.title || u.data.id}"`) }
        else if (u.action === 'delete' && typeof u.id === 'number') { store.deleteLevel(u.id); results.push(`✅ حذف المستوى ${u.id}`) }
        else if (u.action === 'modify' && typeof u.id === 'number' && u.data) { store.setLevelOverride(u.id, u.data); results.push(`✅ تعديل المستوى ${u.id}`) }
      } else if (u.type === 'character') {
        if (u.action === 'add' && u.id && u.data) { store.addCharacter(u.id, u.data as Character); results.push(`✅ إضافة الشخصية "${u.data.name || u.id}"`) }
        else if (u.action === 'delete' && u.id) { store.deleteCharacter(u.id); results.push(`✅ حذف الشخصية "${u.id}"`) }
        else if (u.action === 'modify' && u.id && u.data) { store.setCharacterOverride(u.id, u.data); results.push(`✅ تعديل الشخصية "${u.id}"`) }
      } else { results.push('⚠️ تنسيق JSON غير معروف') }
    } catch (e: any) { results.push(`⚠️ خطأ: ${e.message}`) }
  }
  return results
}

function getDisplayText(fullText: string): string {
  return fullText.replace(/<<<JSON>>>\s*[\s\S]*?\s*<<<END_JSON>>>/g, '').trim()
}

function FacultyAIChat() {
  const ai = useAIStore()
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [applyStatus, setApplyStatus] = useState<string[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const session = ai.getActiveFacultySession()
  const msgHistory = session?.messages || []

  useEffect(() => {
    if (ai.facultySessions.length === 0) ai.createFacultySession('جلسة هيئة التدريس')
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgHistory, streaming])

  const sendMessage = async (msgs: AIMessage[]) => {
    ai.setLoading(true); setStreaming('')
    const levels = getLevels(); const chars = getCharacters(); const meta = getGameMeta()
    const levelsJson = levels.map((l) => `المستوى ${l.id}: ${l.title} (${l.difficulty || 'medium'}, ${l.points || 0} نقطة)`).join('\n')
    const charsJson = JSON.stringify(Object.entries(chars).map(([id, c]) => ({ id, name: c.name, role: c.role, gender: c.gender })), null, 2)
    const metaJson = JSON.stringify(meta, null, 2)
    const lastUser = msgs.filter((m) => m.role === 'user').pop()
    const attachmentInfo = lastUser?.attachments?.map((a) => `[مرفق: ${a.name} (${a.type}) — ${a.content.slice(0, 200)}]`).join('\n') || ''
    const contextMsg: AIMessage = { role: 'user', content: `البيانات الحالية:\n\nإعدادات اللعبة:\n${metaJson}\n\nالمستويات (${levels.length}):\n${levelsJson}\n\nالشخصيات:\n${charsJson}\n\n${attachmentInfo ? 'المرفقات:\n' + attachmentInfo + '\n\n' : ''}${lastUser?.content || ''}` }
    try {
      const systemMsg: AIMessage = { role: 'system', content: FACULTY_SYSTEM_PROMPT }
      const chatMsgs = msgs.filter((m) => m !== contextMsg)
      let full = ''; const gen = streamChatMessage(ai.providerId, ai.modelId, [systemMsg, ...chatMsgs, contextMsg], ai.apiKeys[ai.providerId] || '', ai.customBaseUrl)
      for await (const chunk of gen) { full += chunk; setStreaming(full) }
      const { updates, cleanText } = parseAIUpdates(full)
      ai.addFacultyMessage({ role: 'assistant', content: cleanText || full })
      if (updates.length > 0) { setApplyStatus(applyUpdates(updates)) }
    } catch (err: any) { ai.addFacultyMessage({ role: 'assistant', content: `⚠️ ${err.message || 'خطأ'}` }) }
    ai.setLoading(false); setStreaming('')
  }

  const handleSend = async () => {
    const text = input.trim(); if ((!text && pendingAttachments.length === 0) || ai.loading) return
    if (!ai.getActiveFacultySession()) ai.createFacultySession()
    setInput(''); setApplyStatus([])
    const userMsg: AIMessage = { role: 'user', content: text || 'ملف مرفق', attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined }
    setPendingAttachments([])
    ai.addFacultyMessage(userMsg)
    await sendMessage([...msgHistory, userMsg])
  }

  const handleFiles = async (files: File[]) => {
    const pending = files.map((f) => ({ name: f.name, type: 'file' as const, content: '', mimeType: f.type, uploadStatus: 'uploading' as const }))
    setPendingAttachments((prev) => [...prev, ...pending])
    const attachments = await readFiles(files)
    setPendingAttachments((prev) => {
      const next = [...prev]
      for (let i = 0; i < pending.length; i++) {
        const idx = next.length - pending.length + i
        if (idx >= 0 && idx < next.length) next[idx] = attachments[i]!
      }
      return next
    })
  }
  const removeAttachment = (idx: number) => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))

  const handleEdit = async (idx: number, content: string) => {
    const trimmed = msgHistory.slice(0, idx)
    ai.clearFacultyMessages()
    trimmed.forEach((m) => ai.addFacultyMessage(m))
    ai.addFacultyMessage({ role: 'user', content })
    setApplyStatus([])
    await sendMessage([...trimmed, { role: 'user', content }])
  }

  const handleRegenerate = async (idx: number) => {
    const trimmed = msgHistory.slice(0, idx)
    ai.clearFacultyMessages()
    trimmed.forEach((m) => ai.addFacultyMessage(m))
    setApplyStatus([])
    await sendMessage(trimmed)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SessionBar type="faculty" />
      {applyStatus.length > 0 && (
        <div style={{ padding: '6px 8px', background: 'rgba(129,199,132,0.1)', borderBottom: '1px solid rgba(129,199,132,0.2)', flexShrink: 0 }}>
          {applyStatus.map((s, i) => <div key={i} style={{ fontSize: '11px', color: '#81C784' }}>{s}</div>)}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
        {msgHistory.length === 0 && !streaming && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎓</div>
            اسأل عن أي تعديل في اللعبة<br/>
            <span style={{ fontSize: '11px', color: '#555' }}>مثال: غيّر عنوان المستوى الأول، أضف شخصية جديدة، احذف مستوى 7</span>
          </div>
        )}
        {msgHistory.map((m, i) => <Bubble key={i} msg={m} index={i} onEdit={handleEdit} onRegenerate={handleRegenerate} />)}
        {streaming && <Bubble msg={{ role: 'assistant', content: getDisplayText(streaming) }} />}
        <div ref={bottomRef} />
      </div>
      {pendingAttachments.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', padding: '4px 8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {pendingAttachments.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 6px', borderRadius: '4px',
              background: a.uploadStatus === 'error' ? 'rgba(229,115,115,0.1)' : a.uploadStatus === 'success' ? 'rgba(129,199,132,0.1)' : 'rgba(206,147,216,0.1)',
              fontSize: '10px',
              color: a.uploadStatus === 'error' ? '#E57373' : a.uploadStatus === 'success' ? '#81C784' : '#CE93D8',
            }}>
              {a.uploadStatus === 'uploading' ? '⏳' : a.uploadStatus === 'error' ? '❌' : a.type === 'image' ? '🖼️' : a.type === 'video' ? '🎬' : a.type === 'audio' ? '🎵' : '📄'} {a.name}
              {a.uploadStatus === 'success' && <span style={{ fontSize: '8px', color: '#81C784' }}>✓</span>}
              {a.uploadStatus === 'error' && <span title={a.uploadError} style={{ fontSize: '8px', color: '#E57373' }}>!</span>}
              <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '10px' }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '4px', padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <FileUploadButton onFiles={handleFiles} />
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={ai.loading ? '...' : 'اكتب طلبك أو ارفع ملف...'} disabled={ai.loading} rows={2}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
        <button onClick={handleSend} disabled={ai.loading || (!input.trim() && pendingAttachments.length === 0)} style={{
          padding: '8px 14px', borderRadius: '8px', border: 'none', alignSelf: 'flex-end',
          background: ai.loading ? '#444' : 'linear-gradient(135deg,#CE93D8,#BA68C8)',
          color: '#0a0a1a', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: ai.loading ? 0.5 : 1,
        }}>إرسال</button>
      </div>
    </div>
  )
}

function FacultyDataEditor() {
  const contentStore = useContentStore()
  const levels = getLevels(); const chars = getCharacters(); const gameMeta = getGameMeta()
  const [selectedLevel, setSelectedLevel] = useState<number>(levels[0]?.id ?? 1)
  const [editable, setEditable] = useState<LevelData>(() => structuredClone(levels[0]!))
  const [showExport, setShowExport] = useState(false)
  const [editorTab, setEditorTab] = useState<'levels' | 'characters' | 'fullgame' | 'game' | 'raw'>('levels')
  const [metaEditable, setMetaEditable] = useState<GameMeta>(() => structuredClone(gameMeta))
  const [rawJson, setRawJson] = useState('')
  const [rawError, setRawError] = useState('')
  const [githubSyncing, setGithubSyncing] = useState(false)
  const [githubStatus, setGithubStatus] = useState<string | null>(null)
  const [showGitHubSettings, setShowGitHubSettings] = useState(false)
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(() => getGitHubConfig())
  const [forking, setForking] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => { const level = levels.find((l) => l.id === selectedLevel); if (level) setEditable(structuredClone(level)) }, [selectedLevel, contentStore.levelOverrides, contentStore.newLevels, contentStore.deletedLevels])
  useEffect(() => { setMetaEditable(structuredClone(gameMeta)) }, [contentStore.gameMeta])

  const levelDataStr = () => JSON.stringify(editable, null, 2)
  const fullGameDataStr = () => JSON.stringify({ gameMeta, levels, characters: chars }, null, 2)
  const updateField = (path: string[], value: any) => { setEditable((prev) => { const next = structuredClone(prev); let obj: any = next; for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]!]; obj[path[path.length - 1]!] = value; return next }) }

  const handleRawSave = () => {
    try {
      const parsed = JSON.parse(rawJson)
      if (parsed.gameMeta) contentStore.setGameMeta(parsed.gameMeta)
      if (parsed.levels) {
        contentStore.resetAll()
        for (const l of parsed.levels) contentStore.addLevel(l)
      }
      if (parsed.characters) {
        for (const [id, c] of Object.entries(parsed.characters)) contentStore.addCharacter(id, c as Character)
      }
      setRawError('')
      alert('✅ تم حفظ البيانات بنجاح')
    } catch (e: any) { setRawError('❌ خطأ في JSON: ' + e.message) }
  }

  const handleExport = () => {
    const data = JSON.stringify({ gameMeta, levels, characters: chars }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `cyber-guardians-backup-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      const text = await file.text()
      try {
        const parsed = JSON.parse(text)
        if (parsed.gameMeta) contentStore.setGameMeta(parsed.gameMeta)
        if (parsed.levels) {
          contentStore.resetAll()
          for (const l of parsed.levels) contentStore.addLevel(l)
        }
        if (parsed.characters) {
          for (const [id, c] of Object.entries(parsed.characters)) contentStore.addCharacter(id, c as Character)
        }
        alert('✅ تم الاستيراد بنجاح')
      } catch { alert('❌ ملف JSON غير صالح') }
    }
    input.click()
  }

  const handleGitHubSync = async () => {
    if (!isGitHubConfigured()) { setShowGitHubSettings(true); return }
    setGithubSyncing(true); setGithubStatus('⏳ جارٍ رفع الملفات إلى GitHub...')
    try {
      const results = await pushContentToGitHub({ gameMeta: gameMeta as unknown as Record<string, unknown>, levels, characters: chars })
      const allOk = results.every((r) => r.startsWith('✅'))
      setGithubStatus(allOk
        ? `✅ تم الرفع بنجاح — الملفات المعدّلة:\n${results.join('\n')}\n\n💡 أعد بناء المشروع لتطبيق التغييرات`
        : `⚠️ بعض الملفات فشلت:\n${results.join('\n')}`)
    } catch (e: any) {
      setGithubStatus(`❌ ${e.message}`)
    }
    setGithubSyncing(false)
  }

  const handleSaveGitHubConfig = async () => {
    await setGitHubConfig(ghConfig)
    setShowGitHubSettings(false)
    setGithubStatus('✅ تم حفظ إعدادات GitHub')
  }

  const handleFork = async () => {
    if (!ghConfig.token) { setGithubStatus('❌ أدخل GitHub Token أولاً'); return }
    setForking(true); setGithubStatus('⏳ جارٍ التحقق من الحساب...')
    await setGitHubConfig(ghConfig)
    try {
      const username = await getGitHubUsername()
      setGhConfig({ ...ghConfig, owner: username })
      await setGitHubConfig({ ...ghConfig, owner: username })
      setGithubStatus(`⏳ جارٍ نسخ المستودع من ${MAIN_REPO.owner}/${MAIN_REPO.repo} إلى ${username}...`)
      const result = await setupForkWithPages()
      setGhConfig({ ...ghConfig, owner: result.owner, repo: result.repo })
      await setGitHubConfig({ ...ghConfig, owner: result.owner, repo: result.repo })
      setGithubStatus(`✅ جاهز!\n📦 المستودع: ${result.owner}/${result.repo}\n🌐 اللعبة: ${result.pagesUrl}\n\nيمكنك الآن رفع التعديلات`)
    } catch (e: any) {
      setGithubStatus(`❌ ${e.message}`)
    }
    setForking(false)
  }

  const tabs = [
    { id: 'game', label: '🎮 اللعبة' },
    { id: 'levels', label: 'المستويات' },
    { id: 'characters', label: 'الشخصيات' },
    { id: 'raw', label: '⚙ JSON' },
    { id: 'fullgame', label: 'الكل' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '12px' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => {
            setEditorTab(tab.id)
            if (tab.id === 'raw') setRawJson(JSON.stringify({ gameMeta, levels, characters: chars }, null, 2))
          }} style={{ flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', background: editorTab === tab.id ? 'rgba(79,195,247,0.1)' : 'transparent', color: editorTab === tab.id ? '#4FC3F7' : '#777', fontWeight: editorTab === tab.id ? 700 : 400, borderBottom: editorTab === tab.id ? '2px solid #4FC3F7' : '2px solid transparent', fontSize: '11px' }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={handleExport} style={{ ...smallBtnStyle, color: '#4FC3F7', fontSize: '10px' }}>📤 تصدير JSON</button>
        <button onClick={handleImport} style={{ ...smallBtnStyle, color: '#CE93D8', fontSize: '10px' }}>📥 استيراد JSON</button>
        <button onClick={handleGitHubSync} disabled={githubSyncing} style={{ ...smallBtnStyle, color: githubSyncing ? '#666' : '#81C784', fontSize: '10px', opacity: githubSyncing ? 0.5 : 1 }}>
          {githubSyncing ? '⏳ جارٍ...' : '🔄 رفع إلى GitHub'}
        </button>
        <button onClick={() => setShowGitHubSettings(!showGitHubSettings)} style={{ ...smallBtnStyle, color: '#FFB74D', fontSize: '10px' }}>⚙ GitHub</button>
      </div>
      {showGitHubSettings && (
        <div style={{ padding: '8px', background: 'rgba(255,183,77,0.06)', borderBottom: '1px solid rgba(255,183,77,0.15)', flexShrink: 0, fontSize: '11px', maxHeight: '400px', overflow: 'auto' }}>
          <div style={{ color: '#FFB74D', fontWeight: 700, marginBottom: '6px', fontSize: '10px' }}>⚙ إعدادات GitHub</div>

          {/* Instructions */}
          <div style={{ background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '6px', padding: '8px', marginBottom: '8px', fontSize: '10px', lineHeight: 1.6, color: '#aaa' }}>
            <div style={{ color: '#4FC3F7', fontWeight: 700, marginBottom: '4px', fontSize: '11px' }}>📖 كيف تستخدم GitHub؟</div>
            <div style={{ color: '#81C784', fontWeight: 600, marginBottom: '4px' }}>الخطوة 1: احصل على Token</div>
            <div>1. اذهب إلى <span style={{ color: '#4FC3F7' }}>github.com → Settings → Developer settings → Tokens</span></div>
            <div>2. أنشئ Token جديد بصلاحية:</div>
            <div style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', margin: '4px 0', direction: 'ltr', textAlign: 'left' }}>
              ☑️ <b style={{ color: '#fff' }}>repo</b><br/>
              ☑️ <b style={{ color: '#fff' }}>workflow</b>
            </div>
            <div style={{ marginTop: '6px', marginBottom: '6px', padding: '4px 6px', background: 'rgba(76,175,80,0.1)', borderRadius: '4px', color: '#81C784' }}>
              💡 المالك يُكتشف تلقائياً من التوكن
            </div>
            <div style={{ color: '#FFB74D', fontWeight: 600, marginBottom: '4px' }}>🟡 إنشاء مستودع جديد (Git Data API)</div>
            <div style={{ padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', margin: '4px 0' }}>
              • <b style={{ color: '#fff' }}>commit واحد</b> بكل الملفات (أسرع وأكثر موثوقية)<br/>
              • <b style={{ color: '#fff' }}>public/</b> تُنسخ بالكامل (<span style={{ color: '#81C784' }}>index.html</span> + كل شيء)<br/>
              • <b style={{ color: '#fff' }}>vite.config.ts</b> — base path يُحدّث تلقائياً<br/>
              • <b style={{ color: '#fff' }}>package.json</b> + <b style={{ color: '#fff' }}>README.md</b> يُحدّثان<br/>
              • <b style={{ color: '#fff' }}>GitHub Pages</b> يُفعّل تلقائياً<br/>
              <span style={{ color: '#888' }}>⏭️ يتجاهل الوسائط {'>'} 50MB فقط</span>
            </div>
            <div style={{ color: '#81C784', fontWeight: 600, marginBottom: '4px' }}>🔄 رفع التعديلات</div>
            <div>بعد التعديل عبر AI أو المحرر:</div>
            <div style={{ padding: '3px 6px', margin: '3px 0' }}>اضغط <b style={{ color: '#81C784' }}>🔄 رفع إلى GitHub</b> ← يرفع ملفات البيانات فقط</div>
          </div>

          {/* خيار 1: التعديل المباشر */}
          <div style={{ background: 'rgba(129,199,132,0.1)', border: '1px solid rgba(129,199,132,0.3)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
            <div style={{ color: '#81C784', fontWeight: 700, fontSize: '11px', marginBottom: '4px' }}>🟢 التعديل المباشر في المستودع الرئيسي</div>
            <div style={{ color: '#aaa', fontSize: '10px', marginBottom: '6px' }}>يعدّل الملفات مباشرة في مستودعك الرئيسي</div>
            <button onClick={async () => {
              if (!ghConfig.token) { setGithubStatus('❌ أدخل Token أولاً'); return }
              setForking(true); setGithubStatus('⏳ جارٍ إعداد التعديل المباشر...')
              await setGitHubConfig(ghConfig)
              try {
                const username = await getGitHubUsername()
                setGhConfig({ ...ghConfig, owner: username })
                await setGitHubConfig({ ...ghConfig, owner: username })
                const result = await setupDirectEdit()
                setGhConfig({ ...ghConfig, owner: result.owner, repo: result.repo })
                await setGitHubConfig({ ...ghConfig, owner: result.owner, repo: result.repo })
                setGithubStatus(`✅ جاهز للتعديل المباشر!\n📦 ${result.owner}/${result.repo}\n🌐 ${result.pagesUrl}`)
              } catch (e: any) { setGithubStatus(`❌ ${e.message}`) }
              setForking(false)
            }} disabled={forking || !ghConfig.token} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: forking ? '#444' : 'linear-gradient(135deg,#81C784,#4CAF50)', color: forking ? '#888' : '#0a0a1a', fontWeight: 700, fontSize: '11px', cursor: forking ? 'not-allowed' : 'pointer', opacity: !ghConfig.token ? 0.5 : 1 }}>
              {forking ? '⏳...' : '🟢 التعديل المباشر'}
            </button>
          </div>

          {/* خيار 2: إنشاء مستودع جديد */}
          <div style={{ background: 'rgba(255,183,77,0.1)', border: '1px solid rgba(255,183,77,0.3)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
            <div style={{ color: '#FFB74D', fontWeight: 700, fontSize: '11px', marginBottom: '4px' }}>🟡 إنشاء مستودع جديد مع كل الملفات</div>
            <div style={{ color: '#aaa', fontSize: '10px', marginBottom: '6px' }}>ينشئ مستودعاً جديداً ويرفع كل ملفات اللعبة</div>
            <label style={{ color: '#fff', fontSize: '10px', display: 'block', marginBottom: '4px' }}>اسم المستودع الجديد:<input value={ghConfig.repo} onChange={(e) => setGhConfig({ ...ghConfig, repo: e.target.value })} placeholder="my-cyber-guardians" style={{ ...inputStyle, fontSize: '11px' }} /></label>
            <button onClick={async () => {
              if (!ghConfig.token) { setGithubStatus('❌ أدخل Token أولاً'); return }
              if (!ghConfig.repo) { setGithubStatus('❌ أدخل اسم المستودع الجديد'); return }
              setForking(true); setGithubStatus('⏳ جارٍ إنشاء المستودع ورفع الملفات...')
              await setGitHubConfig(ghConfig)
              try {
                const username = await getGitHubUsername()
                setGhConfig({ ...ghConfig, owner: username })
                await setGitHubConfig({ ...ghConfig, owner: username })
                setGithubStatus(`⏳ جارٍ إنشاء مستودع ${ghConfig.repo}...`)
                const newRepo = await createNewRepo(ghConfig.repo, 'Cyber Guardians Mobile — نسخة مخصصة')
                setGithubStatus(`⏳ جارٍ رفع الملفات...`)
                const contentData = {
                  gameMeta: contentStore.gameMeta as unknown as Record<string, unknown>,
                  levels: (contentStore.newLevels || []) as unknown[],
                  characters: contentStore.newCharacters as Record<string, unknown>,
                }
                const results = await copyEntireRepo(MAIN_REPO.owner, MAIN_REPO.repo, newRepo.owner, newRepo.repo, 'main', contentData)
                try { await enableGitHubPages(newRepo.owner, newRepo.repo, 'main') } catch {}
                setGhConfig({ ...ghConfig, owner: newRepo.owner, repo: newRepo.repo })
                await setGitHubConfig({ ...ghConfig, owner: newRepo.owner, repo: newRepo.repo })
                const ok = results.filter(r => r.startsWith('✅')).length
                const fail = results.filter(r => r.startsWith('❌')).length
                const warn = results.filter(r => r.startsWith('⚠️')).length
                setGithubStatus(`✅ تم الإنشاء!\n📦 ${newRepo.owner}/${newRepo.repo}\n🌐 https://${newRepo.owner}.github.io/${newRepo.repo}/\n✅ نجح ${ok} | ❌ فشل ${fail} | ⚠️ تحذير ${warn}\n\n${results.join('\n')}`)
              } catch (e: any) { setGithubStatus(`❌ ${e.message}`) }
              setForking(false)
            }} disabled={forking || !ghConfig.token} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: forking ? '#444' : 'linear-gradient(135deg,#FFB74D,#FF9800)', color: forking ? '#888' : '#0a0a1a', fontWeight: 700, fontSize: '11px', cursor: forking ? 'not-allowed' : 'pointer', opacity: !ghConfig.token ? 0.5 : 1 }}>
              {forking ? '⏳ جارٍ الإنشاء والرفع...' : '🟡 إنشاء مستودع جديد'}
            </button>
          </div>

          <label style={{ color: '#aaa', display: 'block', marginBottom: '4px' }}>GitHub Token<input type="password" value={ghConfig.token} onChange={(e) => setGhConfig({ ...ghConfig, token: e.target.value })} placeholder="ghp_..." style={inputStyle} /></label>
          <label style={{ color: '#aaa', display: 'block', marginBottom: '4px' }}>Owner (اسم المستخدم أو الإيميل)<input value={ghConfig.owner} onChange={(e) => setGhConfig({ ...ghConfig, owner: e.target.value })} placeholder="your-username أو email@github.com" style={inputStyle} /></label>
          <label style={{ color: '#aaa', display: 'block', marginBottom: '4px' }}>Repo (اسم المستودع)<input value={ghConfig.repo} onChange={(e) => setGhConfig({ ...ghConfig, repo: e.target.value })} placeholder="cyber-guardians-mobile" style={inputStyle} /></label>
          <label style={{ color: '#aaa', display: 'block', marginBottom: '4px' }}>Branch (الفرع)<input value={ghConfig.branch} onChange={(e) => setGhConfig({ ...ghConfig, branch: e.target.value })} placeholder="main" style={inputStyle} /></label>
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
            <button onClick={handleSaveGitHubConfig} style={{ ...smallBtnStyle, color: '#81C784' }}>💾 حفظ</button>
            <button onClick={async () => {
              await setGitHubConfig(ghConfig)
              try {
                try { const username = await getGitHubUsername(); setGhConfig({ ...ghConfig, owner: username }); await setGitHubConfig({ ...ghConfig, owner: username }) } catch {}
                const r = await testGitHubConnection()
                setGithubStatus(r)
              } catch (e: any) { setGithubStatus(`❌ ${e.message}`) }
            }} style={{ ...smallBtnStyle, color: '#4FC3F7' }}>🔌 اختبار الاتصال</button>
          </div>
        </div>
      )}
      {githubStatus && (
        <div style={{
          padding: '6px 8px', fontSize: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          background: githubStatus.startsWith('✅') ? 'rgba(129,199,132,0.08)' : 'rgba(229,115,115,0.08)',
          borderBottom: `1px solid ${githubStatus.startsWith('✅') ? 'rgba(129,199,132,0.15)' : 'rgba(229,115,115,0.15)'}`,
          color: githubStatus.startsWith('✅') ? '#81C784' : githubStatus.startsWith('⚠️') ? '#FFB74D' : '#E57373',
          flexShrink: 0, cursor: 'pointer', maxHeight: '300px', overflowY: 'auto', lineHeight: '1.5',
        }} onClick={() => setGithubStatus(null)}>{githubStatus}</div>
      )}
      {editorTab === 'game' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: '#4FC3F7', fontWeight: 700, fontSize: '11px', marginTop: '4px' }}>عام</div>
          <label style={{ color: '#aaa' }}>عنوان اللعبة<input value={metaEditable.gameTitle} onChange={(e) => setMetaEditable({ ...metaEditable, gameTitle: e.target.value })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>العنوان الفرعي<input value={metaEditable.gameSubtitle} onChange={(e) => setMetaEditable({ ...metaEditable, gameSubtitle: e.target.value })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>الإصدار<input value={metaEditable.gameVersion} onChange={(e) => setMetaEditable({ ...metaEditable, gameVersion: e.target.value })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>اللغة الافتراضية
            <select value={metaEditable.defaultLanguage} onChange={(e) => setMetaEditable({ ...metaEditable, defaultLanguage: e.target.value })} style={inputStyle}>
              <option value="ar">العربية</option><option value="en">English</option>
            </select>
          </label>
          <label style={{ color: '#aaa' }}>الصعوبة العامة
            <select value={metaEditable.difficulty} onChange={(e) => setMetaEditable({ ...metaEditable, difficulty: e.target.value as any })} style={inputStyle}>
              <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
            </select>
          </label>
          <div style={{ color: '#4FC3F7', fontWeight: 700, fontSize: '11px', marginTop: '8px' }}>المكافآت والإعلانات</div>
          <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={metaEditable.dailyRewardEnabled} onChange={(e) => setMetaEditable({ ...metaEditable, dailyRewardEnabled: e.target.checked })} /> مكافأة يومية</label>
          {metaEditable.dailyRewardEnabled && <label style={{ color: '#aaa' }}>نقاط المكافأة<input type="number" value={metaEditable.dailyRewardPoints} onChange={(e) => setMetaEditable({ ...metaEditable, dailyRewardPoints: Number(e.target.value) })} style={inputStyle} /></label>}
          <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={metaEditable.adsEnabled} onChange={(e) => setMetaEditable({ ...metaEditable, adsEnabled: e.target.checked })} /> إعلانات</label>
          <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={metaEditable.iapEnabled} onChange={(e) => setMetaEditable({ ...metaEditable, iapEnabled: e.target.checked })} /> شراء داخل التطبيق</label>
          <div style={{ color: '#4FC3F7', fontWeight: 700, fontSize: '11px', marginTop: '8px' }}>التخطيط والواجهة</div>
          <label style={{ color: '#aaa' }}>عرض الشاشة<input type="number" value={metaEditable.layoutWidth} onChange={(e) => setMetaEditable({ ...metaEditable, layoutWidth: Number(e.target.value) })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>ارتفاع الشاشة<input type="number" value={metaEditable.layoutHeight} onChange={(e) => setMetaEditable({ ...metaEditable, layoutHeight: Number(e.target.value) })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>نمط التخطيط
            <select value={metaEditable.layoutMode} onChange={(e) => setMetaEditable({ ...metaEditable, layoutMode: e.target.value as any })} style={inputStyle}>
              <option value="fixed">ثابت</option><option value="responsive">متجاوب</option>
            </select>
          </label>
          <label style={{ color: '#aaa' }}>موضع عناصر التحكم
            <select value={metaEditable.hudPosition} onChange={(e) => setMetaEditable({ ...metaEditable, hudPosition: e.target.value as any })} style={inputStyle}>
              <option value="top">أعلى</option><option value="bottom">أسفل</option><option value="left">يسار</option><option value="right">يمين</option>
            </select>
          </label>
          <label style={{ color: '#aaa' }}>نمط القائمة
            <select value={metaEditable.menuStyle} onChange={(e) => setMetaEditable({ ...metaEditable, menuStyle: e.target.value as any })} style={inputStyle}>
              <option value="grid">شبكة</option><option value="list">قائمة</option><option value="cards">بطاقات</option>
            </select>
          </label>
          <label style={{ color: '#aaa' }}>سرعة الرسوم المتحركة
            <select value={metaEditable.animationSpeed} onChange={(e) => setMetaEditable({ ...metaEditable, animationSpeed: e.target.value as any })} style={inputStyle}>
              <option value="slow">بطيء</option><option value="normal">عادي</option><option value="fast">سريع</option>
            </select>
          </label>
          <div style={{ color: '#4FC3F7', fontWeight: 700, fontSize: '11px', marginTop: '8px' }}>الصوت</div>
          <label style={{ color: '#aaa' }}>صوت الموسيقى<input type="range" min="0" max="1" step="0.1" value={metaEditable.bgVolume} onChange={(e) => setMetaEditable({ ...metaEditable, bgVolume: Number(e.target.value) })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>صوت المؤثرات<input type="range" min="0" max="1" step="0.1" value={metaEditable.sfxVolume} onChange={(e) => setMetaEditable({ ...metaEditable, sfxVolume: Number(e.target.value) })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>صوت الأصوات<input type="range" min="0" max="1" step="0.1" value={metaEditable.voiceVolume} onChange={(e) => setMetaEditable({ ...metaEditable, voiceVolume: Number(e.target.value) })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>ملاحظات المنصة<textarea value={metaEditable.platformNotes} onChange={(e) => setMetaEditable({ ...metaEditable, platformNotes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => contentStore.setGameMeta(metaEditable)} style={{ ...smallBtnStyle, color: '#81C784' }}>حفظ</button>
            <button onClick={() => { contentStore.resetGameMeta(); setMetaEditable(structuredClone(getGameMeta())) }} style={{ ...smallBtnStyle, color: '#FFB74D' }}>إعادة ضبط</button>
          </div>
        </div>
      )}
      {editorTab === 'characters' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(chars).map(([id, ch]) => (
              <div key={id} style={{ padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ color: ch.color, fontWeight: 700 }}>{ch.name} ({id})</div>
                  <button onClick={() => contentStore.resetCharacter(id)} style={{ ...smallBtnStyle, color: '#FFB74D', padding: '2px 6px', fontSize: '10px' }}>إعادة ضبط</button>
                </div>
                <label style={{ color: '#aaa', fontSize: '11px' }}>الاسم<input value={ch.name} onChange={(e) => contentStore.setCharacterOverride(id, { name: e.target.value })} style={inputStyle} /></label>
                <label style={{ color: '#aaa', fontSize: '11px' }}>الدور<input value={ch.role} onChange={(e) => contentStore.setCharacterOverride(id, { role: e.target.value })} style={inputStyle} /></label>
                <label style={{ color: '#aaa', fontSize: '11px' }}>اللون<input value={ch.color} onChange={(e) => contentStore.setCharacterOverride(id, { color: e.target.value })} style={inputStyle} /></label>
                <label style={{ color: '#aaa', fontSize: '11px' }}>الشخصية<textarea value={ch.personality} onChange={(e) => contentStore.setCharacterOverride(id, { personality: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                <label style={{ color: '#aaa', fontSize: '11px' }}>الجنس
                  <select value={ch.gender} onChange={(e) => contentStore.setCharacterOverride(id, { gender: e.target.value as any })} style={inputStyle}>
                    <option value="male">ذكر</option><option value="female">أنثى</option>
                  </select>
                </label>
                <div style={{ color: '#4FC3F7', fontWeight: 700, fontSize: '10px', marginTop: '6px' }}>الأصول</div>
                <label style={{ color: '#aaa', fontSize: '11px' }}>رابط الصورة (Avatar)<input value={ch.avatarUrl || ''} onChange={(e) => contentStore.setCharacterOverride(id, e.target.value ? { avatarUrl: e.target.value } : { avatarUrl: '' } as any)} placeholder="https://..." style={inputStyle} /></label>
                <label style={{ color: '#aaa', fontSize: '11px' }}>رابط الصوت (Voice)<input value={ch.voiceUrl || ''} onChange={(e) => contentStore.setCharacterOverride(id, e.target.value ? { voiceUrl: e.target.value } : { voiceUrl: '' } as any)} placeholder="https://..." style={inputStyle} /></label>
              </div>
            ))}
          </div>
        </div>
      )}
      {editorTab === 'raw' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '6px 8px', background: 'rgba(255,200,50,0.08)', borderBottom: '1px solid rgba(255,200,50,0.15)', fontSize: '10px', color: '#FFB74D', flexShrink: 0 }}>
            ⚠️ تحرير JSON مباشرة — تأكد من صحة البيانات قبل الحفظ
          </div>
          <textarea value={rawJson} onChange={(e) => setRawJson(e.target.value)} style={{ flex: 1, padding: '8px', margin: 0, border: 'none', background: 'rgba(0,0,0,0.3)', color: '#888', fontSize: '10px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left', resize: 'none', outline: 'none' }} />
          {rawError && <div style={{ padding: '4px 8px', color: '#E57373', fontSize: '11px', flexShrink: 0 }}>{rawError}</div>}
          <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <button onClick={handleRawSave} style={{ ...smallBtnStyle, color: '#81C784' }}>💾 حفظ JSON</button>
            <button onClick={() => setRawJson(JSON.stringify({ gameMeta, levels, characters: chars }, null, 2))} style={{ ...smallBtnStyle, color: '#4FC3F7' }}>🔄 إعادة تحميل</button>
          </div>
        </div>
      )}
      {editorTab === 'fullgame' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: 'rgba(0,0,0,0.3)' }}>
          <pre style={{ margin: 0, fontSize: '10px', color: '#888', direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap' }}>{fullGameDataStr()}</pre>
        </div>
      )}
      {editorTab === 'levels' && (
        <>
          <div style={{ display: 'flex', gap: '6px', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            <select value={selectedLevel} onChange={(e) => setSelectedLevel(Number(e.target.value))} style={{ ...inputStyle, flex: 1, minWidth: '80px' }}>
              {levels.map((l) => <option key={l.id} value={l.id}>المستوى {l.id}: {l.title}</option>)}
            </select>
            <button onClick={() => { contentStore.setLevelOverride(selectedLevel, editable) }} style={{ ...smallBtnStyle, color: '#81C784' }}>حفظ</button>
            <button onClick={() => { contentStore.resetLevel(selectedLevel); const l = getLevels().find((x) => x.id === selectedLevel); if (l) setEditable(structuredClone(l)) }} style={{ ...smallBtnStyle, color: '#FFB74D' }}>إعادة ضبط</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: '#aaa' }}>العنوان<input value={editable.title} onChange={(e) => updateField(['title'], e.target.value)} style={inputStyle} /></label>
            <label style={{ color: '#aaa' }}>العنوان الفرعي<input value={editable.subtitle} onChange={(e) => updateField(['subtitle'], e.target.value)} style={inputStyle} /></label>
            <label style={{ color: '#aaa' }}>الصعوبة
              <select value={editable.difficulty || 'medium'} onChange={(e) => updateField(['difficulty'], e.target.value)} style={inputStyle}>
                <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
              </select>
            </label>
            <label style={{ color: '#aaa' }}>النقاط<input type="number" value={editable.points || 0} onChange={(e) => updateField(['points'], Number(e.target.value))} style={inputStyle} /></label>
            <label style={{ color: '#aaa' }}>حد الوقت (ثانية)<input type="number" value={editable.timeLimit || 0} onChange={(e) => updateField(['timeLimit'], Number(e.target.value))} placeholder="0 = بدون حد" style={inputStyle} /></label>
            <label style={{ color: '#aaa' }}>يتطلب إكمال المستوى<input type="number" value={editable.unlockRequirement || 0} onChange={(e) => updateField(['unlockRequirement'], Number(e.target.value))} placeholder="0 = متاح دائماً" style={inputStyle} /></label>
            <div style={{ color: '#4FC3F7', fontWeight: 700, fontSize: '10px', marginTop: '4px' }}>الأصول البصرية والصوتية</div>
            <label style={{ color: '#aaa', fontSize: '11px' }}>خلفية المستوى (رابط صورة)<input value={editable.backgroundImage || ''} onChange={(e) => updateField(['backgroundImage'], e.target.value || undefined)} placeholder="https://..." style={inputStyle} /></label>
            <label style={{ color: '#aaa', fontSize: '11px' }}>موسيقى الخلفية (رابط)<input value={editable.backgroundMusic || ''} onChange={(e) => updateField(['backgroundMusic'], e.target.value || undefined)} placeholder="https://..." style={inputStyle} /></label>
            <label style={{ color: '#aaa', fontSize: '11px' }}>مؤثرات صوتية (روابط مفصولة بسطر)<textarea value={(editable.soundEffects || []).join('\n')} onChange={(e) => updateField(['soundEffects'], e.target.value.split('\n').filter(Boolean))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="https://sound1.mp3&#10;https://sound2.mp3" /></label>
            <div style={{ color: '#4FC3F7', fontWeight: 700, fontSize: '10px', marginTop: '4px' }}>الحوارات</div>
            <div style={{ color: '#aaa' }}>حوار المقدمة</div>
            {editable.intro.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: '4px' }}>
                <input value={line.speakerId} onChange={(e) => { const next = [...editable.intro]; next[i] = { speakerId: e.target.value, text: line.text }; updateField(['intro'], next) }} style={{ ...inputStyle, width: '70px', flexShrink: 0 }} />
                <input value={line.text} onChange={(e) => { const next = [...editable.intro]; next[i] = { speakerId: line.speakerId, text: e.target.value }; updateField(['intro'], next) }} style={{ ...inputStyle, flex: 1 }} />
              </div>
            ))}
            <div style={{ color: '#aaa' }}>حوار الختام</div>
            {editable.outro.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: '4px' }}>
                <input value={line.speakerId} onChange={(e) => { const next = [...editable.outro]; next[i] = { speakerId: e.target.value, text: line.text }; updateField(['outro'], next) }} style={{ ...inputStyle, width: '70px', flexShrink: 0 }} />
                <input value={line.text} onChange={(e) => { const next = [...editable.outro]; next[i] = { speakerId: line.speakerId, text: e.target.value }; updateField(['outro'], next) }} style={{ ...inputStyle, flex: 1 }} />
              </div>
            ))}
            <label style={{ color: '#aaa' }}>نصائح (مفصولة بسطر جديد)
              <textarea value={(editable.hints || []).join('\n')} onChange={(e) => updateField(['hints'], e.target.value.split('\n').filter(Boolean))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="hint 1&#10;hint 2" />
            </label>
          </div>
        </>
      )}
    </div>
  )
}

export function AIPanel() {
  const ai = useAIStore()
  const [facultyTab, setFacultyTab] = useState<'chat' | 'editor'>('chat')

  const saved = loadPanelState()
  const panelW = Math.min(420, window.innerWidth * 0.9)
  const panelH = Math.min(window.innerHeight * 0.8, 600)
  const [panelState, setPanelState] = useState({
    x: saved?.x ?? (window.innerWidth - panelW) / 2,
    y: saved?.y ?? (window.innerHeight - panelH) / 2,
    w: saved?.w ?? panelW,
    h: saved?.h ?? panelH,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isMaximized, setIsMaximized] = useState(!saved)
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 })
  const resizeRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0, handle: '' })

  const handleFacultyAuth = () => {
    setShowFacultyPinModal(true)
  }

  const [showFacultyPinModal, setShowFacultyPinModal] = useState(false)
  const [facultyPinInput, setFacultyPinInput] = useState('')
  const [showFacultyPin, setShowFacultyPin] = useState(false)

  const [pinLockedMsg, setPinLockedMsg] = useState<string | null>(null)

  const handleFacultyPinSubmit = async () => {
    const now = Date.now()
    if (ai.pinLockedUntil > now) {
      const remaining = Math.ceil((ai.pinLockedUntil - now) / 1000)
      setPinLockedMsg(`🔒 انتظر ${remaining} ثانية`)
      return
    }
    if (facultyPinInput) {
      const ok = await ai.unlockFaculty(facultyPinInput)
      if (!ok) {
        setFacultyPinInput('')
        setShowFacultyPin(false)
        if (ai.pinLockedUntil > Date.now()) {
          setPinLockedMsg('🔒 تم القفل مؤقتاً — انتظر 30 ثانية')
        }
        alert('رمز خطأ')
      } else {
        setShowFacultyPinModal(false)
        setFacultyPinInput('')
        setShowFacultyPin(false)
        setPinLockedMsg(null)
      }
    }
  }

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMaximized) return
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: panelState.x, origY: panelState.y }
    setIsDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [isMaximized, panelState.x, panelState.y])

  const handleHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPanelState((prev) => ({ ...prev, x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }))
  }, [isDragging])

  const handleHeaderPointerUp = useCallback(() => {
    setIsDragging(false)
    setPanelState((prev) => { savePanelState(prev); return prev })
  }, [])

  const handleResizeStart = useCallback((e: React.PointerEvent, handle: string) => {
    e.preventDefault(); e.stopPropagation()
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origX: panelState.x, origY: panelState.y, origW: panelState.w, origH: panelState.h, handle }
    setIsResizing(true)
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - resizeRef.current.startX
      const dy = ev.clientY - resizeRef.current.startY
      const { origX: ox, origY: oy, origW: ow, origH: oh, handle: h } = resizeRef.current
      let x = ox, y = oy, w = ow, h2 = oh
      const MIN_W = 300, MIN_H = 200
      if (h.includes('right')) w = Math.max(MIN_W, ow + dx)
      if (h.includes('left')) { w = Math.max(MIN_W, ow - dx); x = ox + (ow - w) }
      if (h.includes('bottom')) h2 = Math.max(MIN_H, oh + dy)
      if (h.includes('top')) { h2 = Math.max(MIN_H, oh - dy); y = oy + (oh - h2) }
      setPanelState({ x, y, w, h: h2 })
    }
    const onUp = () => { setIsResizing(false); setPanelState((prev) => { savePanelState(prev); return prev }); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [panelState])

  const toggleMaximize = () => {
    if (isMaximized) {
      const s = loadPanelState()
      const w = Math.min(420, window.innerWidth * 0.9)
      const h = Math.min(window.innerHeight * 0.8, 600)
      setPanelState(s ?? { x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2, w, h })
      setIsMaximized(false)
      ai.setPanelMaximized(false)
    } else {
      savePanelState(panelState)
      setIsMaximized(true)
      ai.setPanelMaximized(true)
    }
  }

  const panelStyle: React.CSSProperties = isMaximized
    ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }
    : { position: 'fixed', left: panelState.x, top: panelState.y, width: panelState.w, height: panelState.h, zIndex: 9999 }

  return (
    <>
      <style>{`@keyframes ai-fab-pulse{0%{transform:scale(1);opacity:.6}50%{transform:scale(1.3);opacity:0}100%{transform:scale(1);opacity:.6}}`}</style>
      <AIFab onClick={() => ai.setPanelOpen(!ai.panelOpen)} />
      {ai.panelOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} onClick={() => { ai.setPanelOpen(false) }} />
          <div style={{
            ...panelStyle,
            background: 'linear-gradient(180deg, #0d1128 0%, #1a1f3a 100%)',
            border: isMaximized ? 'none' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: isMaximized ? 0 : '12px',
            boxShadow: isMaximized ? 'none' : '0 8px 40px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', direction: 'rtl',
            transition: isDragging || isResizing ? 'none' : 'border-radius 0.2s',
          }}>
        {!isMaximized && ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
          <ResizeHandle key={pos} position={pos} onResizeStart={handleResizeStart} />
        ))}
        {/* Header */}
        <div onPointerDown={handleHeaderPointerDown} onPointerMove={handleHeaderPointerMove} onPointerUp={handleHeaderPointerUp}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.25)', cursor: isMaximized ? 'default' : 'grab',
            flexShrink: 0, borderRadius: isMaximized ? 0 : '12px 12px 0 0',
            userSelect: 'none',
          }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontFamily: 'var(--heading-font)', color: '#CE93D8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CE93D8" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-4 5-2-2-4-3-4-5a4 4 0 0 1 4-4z"/><path d="M8 14h8"/><path d="M8 17h5"/><path d="M2 22c0-3 2-5 4-5h12c2 0 4 2 4 5"/></svg>
            AI Assistant
          </h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={toggleMaximize} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', borderRadius: '4px' }} title={isMaximized ? 'تصغير' : 'تكبير'}>
              {isMaximized ? '◻' : '□'}
            </button>
            <button onClick={() => ai.setPanelOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px', padding: '2px 6px', borderRadius: '4px' }}>✕</button>
          </div>
        </div>
        {/* Main tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {([{ id: 'student', label: '🎓 طالب' }, { id: 'faculty', label: '👩‍🏫 هيئة تدريس' }, { id: 'settings', label: '⚙' }]).map((tab) => (
            <button key={tab.id} onClick={() => { ai.setActiveTab(tab.id as any); if (tab.id === 'faculty' && !ai.facultyUnlocked) handleFacultyAuth() }} style={{
              flex: tab.id === 'settings' ? '0 0 40px' : 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
              background: ai.activeTab === tab.id ? 'rgba(206,147,216,0.1)' : 'transparent',
              color: ai.activeTab === tab.id ? '#CE93D8' : '#777',
              fontWeight: ai.activeTab === tab.id ? 700 : 400,
              borderBottom: ai.activeTab === tab.id ? '2px solid #CE93D8' : '2px solid transparent',
              fontFamily: 'var(--heading-font)', fontSize: '13px',
            }}>{tab.label}</button>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {ai.activeTab === 'student' && <StudentChat />}
          {ai.activeTab === 'faculty' && !ai.facultyUnlocked && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#888', fontSize: '14px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
              <p>هذه الميزة مخصصة لهيئة التدريس فقط</p>
              <button onClick={handleFacultyAuth} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#CE93D8,#BA68C8)', color: '#0a0a1a', fontWeight: 700, cursor: 'pointer' }}>أدخل رمز الدخول</button>
              <p style={{ marginTop: '12px', fontSize: '11px', color: '#555' }}>أدخل الرمز السري للدخول</p>
            </div>
          )}
          {ai.activeTab === 'faculty' && ai.facultyUnlocked && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <button onClick={() => setFacultyTab('chat')} style={{ flex: 1, padding: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', background: facultyTab === 'chat' ? 'rgba(206,147,216,0.1)' : 'transparent', color: facultyTab === 'chat' ? '#CE93D8' : '#777', fontWeight: facultyTab === 'chat' ? 700 : 400, borderBottom: facultyTab === 'chat' ? '2px solid #CE93D8' : '2px solid transparent' }}>💬 محادثة AI</button>
                <button onClick={() => setFacultyTab('editor')} style={{ flex: 1, padding: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', background: facultyTab === 'editor' ? 'rgba(79,195,247,0.1)' : 'transparent', color: facultyTab === 'editor' ? '#4FC3F7' : '#777', fontWeight: facultyTab === 'editor' ? 700 : 400, borderBottom: facultyTab === 'editor' ? '2px solid #4FC3F7' : '2px solid transparent' }}>📝 محرر البيانات</button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, display: facultyTab === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}><FacultyAIChat /></div>
                <div style={{ position: 'absolute', inset: 0, display: facultyTab === 'editor' ? 'flex' : 'none', flexDirection: 'column' }}><FacultyDataEditor /></div>
              </div>
            </div>
          )}
          {ai.activeTab === 'settings' && <AISettings />}
        </div>
      </div>
        </>
      )}
      {showFacultyPinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}
          onClick={() => { setShowFacultyPinModal(false); setFacultyPinInput(''); setShowFacultyPin(false) }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#0d1128', border: '1px solid rgba(206,147,216,0.3)', borderRadius: '12px',
            padding: '24px', width: '280px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
            <p style={{ color: '#CE93D8', fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>أدخل رمز هيئة التدريس</p>
            {pinLockedMsg && <p style={{ color: '#FF5252', fontSize: '12px', marginBottom: '8px' }}>{pinLockedMsg}</p>}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showFacultyPin ? 'text' : 'password'}
                value={facultyPinInput}
                onChange={(e) => setFacultyPinInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFacultyPinSubmit() }}
                placeholder="****"
                autoFocus
                style={{
                  ...inputStyle, paddingRight: '36px', textAlign: 'center',
                  fontSize: '18px', letterSpacing: '8px',
                }}
              />
              <button onClick={() => setShowFacultyPin(!showFacultyPin)}
                style={{
                  position: 'absolute', right: '8px', background: 'none', border: 'none',
                  color: '#888', cursor: 'pointer', fontSize: '16px', padding: '4px',
                }}>
                {showFacultyPin ? '🙈' : '👁️'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
              <button onClick={handleFacultyPinSubmit} style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg,#CE93D8,#BA68C8)',
                color: '#0a0a1a', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
              }}>دخول</button>
              <button onClick={() => { setShowFacultyPinModal(false); setFacultyPinInput(''); setShowFacultyPin(false) }} style={{
                padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '13px',
              }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      </>
  )
}

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: '4px',
  padding: '6px 8px', borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)', color: '#fff',
  fontSize: '12px', outline: 'none', fontFamily: 'inherit',
}

const smallBtnStyle: React.CSSProperties = {
  padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)', color: '#ccc',
  cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap',
}
