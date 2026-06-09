import { useState, useRef, useEffect, useCallback } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAIStore } from '@/store/aiStore'
import { useContentStore } from '@/store/contentStore'
import { streamChatMessage, testConnection } from './api'
import { STUDENT_SYSTEM_PROMPT, FACULTY_SYSTEM_PROMPT } from './prompts'
import { AI_PROVIDERS } from '@/types/ai'
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
  const provider = AI_PROVIDERS.find((p) => p.id === ai.providerId)
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [customModel, setCustomModel] = useState(
    () => provider?.models.find((m) => m.id === ai.modelId) ? '' : ai.modelId
  )

  useEffect(() => {
    if (provider?.models.some(m => m.id === ai.modelId)) {
      setCustomModel('')
    } else {
      setCustomModel(ai.modelId)
    }
  }, [ai.providerId, ai.modelId, provider])

  const handleTestConnection = async () => {
    const model = ai.modelId.trim()
    if (!model) { setTestStatus('⚠️ أدخل اسم النموذج أولاً'); return }
    setTesting(true)
    setTestStatus('⏳ جارٍ الاتصال...')
    const result = await testConnection(ai.providerId, model, ai.apiKeys[ai.providerId] || '', ai.customBaseUrl)
    setTestStatus(result)
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
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
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
    </div>
  )
}

function FacultyPinChanger() {
  const ai = useAIStore()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const handleChange = () => {
    if (currentPin !== ai.facultyPin) {
      setMsg('❌ الرمز الحالي خطأ')
      return
    }
    if (newPin.length < 4) {
      setMsg('❌ الرمز الجديد يجب أن يكون 4 أحرف على الأقل')
      return
    }
    if (newPin !== confirmPin) {
      setMsg('❌ الرمز الجديد غير متطابق')
      return
    }
    ai.setFacultyPin(newPin)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setMsg('✅ تم تغيير الرمز بنجاح')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
      <label style={{ color: '#fff', fontWeight: 500 }}>الرمز الحالي
        <input type="password" value={currentPin} onChange={(e) => { setCurrentPin(e.target.value); setMsg(null) }} placeholder="****" style={inputStyle} />
      </label>
      <label style={{ color: '#fff', fontWeight: 500 }}>الرمز الجديد
        <input type="password" value={newPin} onChange={(e) => { setNewPin(e.target.value); setMsg(null) }} placeholder="4 أحرف على الأقل" style={inputStyle} />
      </label>
      <label style={{ color: '#fff', fontWeight: 500 }}>تأكيد الرمز الجديد
        <input type="password" value={confirmPin} onChange={(e) => { setConfirmPin(e.target.value); setMsg(null) }} placeholder="أعد إدخال الرمز" style={inputStyle} />
      </label>
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

function downloadDocx(content: string, filename: string) {
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8}pre{background:#f4f4f4;padding:10px;border-radius:4px}code{background:#f4f4f4;padding:2px 4px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px}</style></head><body>${content.replace(/\n/g, '<br>')}</body></html>`
  downloadFile(html, `${filename}.doc`, 'application/msword')
}

function downloadPdf(content: string, filename: string) {
  const html = `<html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;direction:rtl;text-align:right;padding:20px;line-height:1.8;font-size:14px}pre{background:#f4f4f4;padding:10px;border-radius:4px;white-space:pre-wrap}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px}</style></head><body>${content.replace(/\n/g, '<br>')}</body></html>`
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
              <div style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
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

function StudentChat() {
  const ai = useAIStore()
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ai.studentMessages, streaming])

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
    const text = input.trim(); if (!text || ai.loading) return
    setInput('')
    const userMsg: AIMessage = { role: 'user', content: text }
    ai.addStudentMessage(userMsg)
    await sendMessage([...ai.studentMessages, userMsg])
  }

  const handleEdit = async (idx: number, content: string) => {
    const trimmed = ai.studentMessages.slice(0, idx)
    ai.clearStudentMessages()
    trimmed.forEach((m) => ai.addStudentMessage(m))
    ai.addStudentMessage({ role: 'user', content })
    await sendMessage([...trimmed, { role: 'user', content }])
  }

  const handleRegenerate = async (idx: number) => {
    const trimmed = ai.studentMessages.slice(0, idx)
    ai.clearStudentMessages()
    trimmed.forEach((m) => ai.addStudentMessage(m))
    await sendMessage(trimmed)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {ai.studentMessages.length === 0 && !streaming && <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '40px' }}>اسأل عن أي مفهوم في الأمن السيبراني</div>}
        {ai.studentMessages.map((msg, i) => <Bubble key={i} msg={msg} index={i} onEdit={handleEdit} onRegenerate={handleRegenerate} />)}
        {streaming && <Bubble msg={{ role: 'assistant', content: streaming }} />}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: '6px', padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={ai.loading ? '...' : 'اكتب سؤالك...'} disabled={ai.loading}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '13px', outline: 'none' }} />
        <button onClick={handleSend} disabled={ai.loading || !input.trim()} style={{
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ai.facultyMessages, streaming])

  const sendMessage = async (msgs: AIMessage[]) => {
    ai.setLoading(true); setStreaming('')
    const levels = getLevels(); const chars = getCharacters(); const meta = getGameMeta()
    const levelsJson = levels.map((l) => `المستوى ${l.id}: ${l.title} (${l.difficulty || 'medium'}, ${l.points || 0} نقطة)`).join('\n')
    const charsJson = JSON.stringify(Object.entries(chars).map(([id, c]) => ({ id, name: c.name, role: c.role, gender: c.gender })), null, 2)
    const metaJson = JSON.stringify(meta, null, 2)
    const lastUser = msgs.filter((m) => m.role === 'user').pop()
    const contextMsg: AIMessage = { role: 'user', content: `البيانات الحالية:\n\nإعدادات اللعبة:\n${metaJson}\n\nالمستويات (${levels.length}):\n${levelsJson}\n\nالشخصيات:\n${charsJson}\n\n${lastUser?.content || ''}` }
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
    const text = input.trim(); if (!text || ai.loading) return
    setInput(''); setApplyStatus([])
    const userMsg: AIMessage = { role: 'user', content: text }
    ai.addFacultyMessage(userMsg)
    await sendMessage([...ai.facultyMessages, userMsg])
  }

  const handleEdit = async (idx: number, content: string) => {
    const trimmed = ai.facultyMessages.slice(0, idx)
    ai.clearFacultyMessages()
    trimmed.forEach((m) => ai.addFacultyMessage(m))
    ai.addFacultyMessage({ role: 'user', content })
    setApplyStatus([])
    await sendMessage([...trimmed, { role: 'user', content }])
  }

  const handleRegenerate = async (idx: number) => {
    const trimmed = ai.facultyMessages.slice(0, idx)
    ai.clearFacultyMessages()
    trimmed.forEach((m) => ai.addFacultyMessage(m))
    setApplyStatus([])
    await sendMessage(trimmed)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {applyStatus.length > 0 && (
        <div style={{ padding: '6px 8px', background: 'rgba(129,199,132,0.1)', borderBottom: '1px solid rgba(129,199,132,0.2)', flexShrink: 0 }}>
          {applyStatus.map((s, i) => <div key={i} style={{ fontSize: '11px', color: '#81C784' }}>{s}</div>)}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
        {ai.facultyMessages.length === 0 && !streaming && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎓</div>
            اسأل عن أي تعديل في اللعبة<br/>
            <span style={{ fontSize: '11px', color: '#555' }}>مثال: غيّر عنوان المستوى الأول، أضف شخصية جديدة، احذف مستوى 7</span>
          </div>
        )}
        {ai.facultyMessages.map((m, i) => <Bubble key={i} msg={m} index={i} onEdit={handleEdit} onRegenerate={handleRegenerate} />)}
        {streaming && <Bubble msg={{ role: 'assistant', content: getDisplayText(streaming) }} />}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: '6px', padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={ai.loading ? '...' : 'اكتب طلبك هنا...'} disabled={ai.loading} rows={2}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
        <button onClick={handleSend} disabled={ai.loading || !input.trim()} style={{
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
  const [editorTab, setEditorTab] = useState<'levels' | 'characters' | 'fullgame' | 'game'>('levels')
  const [metaEditable, setMetaEditable] = useState<GameMeta>(() => structuredClone(gameMeta))

  useEffect(() => { const level = levels.find((l) => l.id === selectedLevel); if (level) setEditable(structuredClone(level)) }, [selectedLevel, contentStore.levelOverrides, contentStore.newLevels, contentStore.deletedLevels])
  useEffect(() => { setMetaEditable(structuredClone(gameMeta)) }, [contentStore.gameMeta])

  const levelDataStr = () => JSON.stringify(editable, null, 2)
  const fullGameDataStr = () => JSON.stringify({ gameMeta, levels, characters: chars }, null, 2)
  const updateField = (path: string[], value: any) => { setEditable((prev) => { const next = structuredClone(prev); let obj: any = next; for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]!]; obj[path[path.length - 1]!] = value; return next }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '12px' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {([{ id: 'game', label: '🎮 اللعبة' }, { id: 'levels', label: 'المستويات' }, { id: 'characters', label: 'الشخصيات' }, { id: 'fullgame', label: 'الكل' }] as const).map((tab) => (
          <button key={tab.id} onClick={() => setEditorTab(tab.id)} style={{ flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', background: editorTab === tab.id ? 'rgba(79,195,247,0.1)' : 'transparent', color: editorTab === tab.id ? '#4FC3F7' : '#777', fontWeight: editorTab === tab.id ? 700 : 400, borderBottom: editorTab === tab.id ? '2px solid #4FC3F7' : '2px solid transparent', fontSize: '11px' }}>{tab.label}</button>
        ))}
      </div>
      {editorTab === 'game' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: '#aaa' }}>عنوان اللعبة<input value={metaEditable.gameTitle} onChange={(e) => setMetaEditable({ ...metaEditable, gameTitle: e.target.value })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>العنوان الفرعي<input value={metaEditable.gameSubtitle} onChange={(e) => setMetaEditable({ ...metaEditable, gameSubtitle: e.target.value })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>الإصدار<input value={metaEditable.gameVersion} onChange={(e) => setMetaEditable({ ...metaEditable, gameVersion: e.target.value })} style={inputStyle} /></label>
          <label style={{ color: '#aaa' }}>اللغة الافتراضية
            <select value={metaEditable.defaultLanguage} onChange={(e) => setMetaEditable({ ...metaEditable, defaultLanguage: e.target.value })} style={inputStyle}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
          <label style={{ color: '#aaa' }}>الصعوبة العامة
            <select value={metaEditable.difficulty} onChange={(e) => setMetaEditable({ ...metaEditable, difficulty: e.target.value as any })} style={inputStyle}>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </label>
          <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={metaEditable.dailyRewardEnabled} onChange={(e) => setMetaEditable({ ...metaEditable, dailyRewardEnabled: e.target.checked })} />
            مكافأة يومية
          </label>
          {metaEditable.dailyRewardEnabled && (
            <label style={{ color: '#aaa' }}>نقاط المكافأة اليومية<input type="number" value={metaEditable.dailyRewardPoints} onChange={(e) => setMetaEditable({ ...metaEditable, dailyRewardPoints: Number(e.target.value) })} style={inputStyle} /></label>
          )}
          <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={metaEditable.adsEnabled} onChange={(e) => setMetaEditable({ ...metaEditable, adsEnabled: e.target.checked })} />
            إعلانات
          </label>
          <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={metaEditable.iapEnabled} onChange={(e) => setMetaEditable({ ...metaEditable, iapEnabled: e.target.checked })} />
            شراء داخل التطبيق
          </label>
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
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </label>
                <label style={{ color: '#aaa', fontSize: '11px' }}>رابط الصورة (Avatar)<input value={ch.avatarUrl || ''} onChange={(e) => contentStore.setCharacterOverride(id, e.target.value ? { avatarUrl: e.target.value } : { avatarUrl: '' } as any)} placeholder="https://..." style={inputStyle} /></label>
                <label style={{ color: '#aaa', fontSize: '11px' }}>رابط الصوت (Voice)<input value={ch.voiceUrl || ''} onChange={(e) => contentStore.setCharacterOverride(id, e.target.value ? { voiceUrl: e.target.value } : { voiceUrl: '' } as any)} placeholder="https://..." style={inputStyle} /></label>
              </div>
            ))}
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
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب</option>
              </select>
            </label>
            <label style={{ color: '#aaa' }}>النقاط<input type="number" value={editable.points || 0} onChange={(e) => updateField(['points'], Number(e.target.value))} style={inputStyle} /></label>
            <label style={{ color: '#aaa' }}>حد الوقت (ثانية)<input type="number" value={editable.timeLimit || 0} onChange={(e) => updateField(['timeLimit'], Number(e.target.value))} placeholder="0 = بدون حد" style={inputStyle} /></label>
            <label style={{ color: '#aaa' }}>يتطلب إكمال المستوى<input type="number" value={editable.unlockRequirement || 0} onChange={(e) => updateField(['unlockRequirement'], Number(e.target.value))} placeholder="0 = متاح دائماً" style={inputStyle} /></label>
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
    const pin = window.prompt('أدخل رمز هيئة التدريس:')
    if (pin && !ai.unlockFaculty(pin)) alert('رمز خطأ')
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
    } else {
      savePanelState(panelState)
      setIsMaximized(true)
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} onClick={() => ai.setPanelOpen(false)} />
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
              <p style={{ marginTop: '12px', fontSize: '11px', color: '#555' }}>الرمز الافتراضي: {ai.facultyPin}</p>
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
