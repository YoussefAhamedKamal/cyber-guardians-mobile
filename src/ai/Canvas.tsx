import { useState, useRef, useEffect, useCallback } from 'react'

interface CanvasProps {
  onClose: () => void
}

interface CanvasBlock {
  id: string
  type: 'html' | 'text' | 'chart' | 'code'
  content: string
  title: string
  createdAt: number
}

let blockIdCounter = 0
function nextBlockId(): string {
  return `canvas-block-${Date.now()}-${++blockIdCounter}`
}

export function Canvas({ onClose }: CanvasProps) {
  const [blocks, setBlocks] = useState<CanvasBlock[]>([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'render' | 'code'>('render')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [blocks])

  const addBlock = useCallback((type: CanvasBlock['type'], content: string, title = '') => {
    setBlocks(prev => [...prev, {
      id: nextBlockId(),
      type,
      content,
      title: title || `${type.toUpperCase()} Block`,
      createdAt: Date.now(),
    }])
  }, [])

  const updateBlock = useCallback((id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
  }, [])

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }, [])

  const handleSubmit = () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')

    // Auto-detect type based on content
    if (text.startsWith('<') || text.includes('<div') || text.includes('<html')) {
      addBlock('html', text, 'HTML')
    } else if (text.includes('function') || text.includes('const ') || text.includes('import ') || text.includes('def ') || text.includes('class ')) {
      addBlock('code', text, 'Code')
    } else {
      addBlock('text', text, 'Note')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0d1117', color: '#e6edf3',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid #30363d',
        background: '#161b22',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🎨</span>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Canvas</span>
          <span style={{ fontSize: '11px', color: '#8b949e' }}>
            {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setMode(mode === 'render' ? 'code' : 'render')}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: '1px solid #30363d',
              background: '#21262d', color: '#8b949e', fontSize: '11px', cursor: 'pointer',
            }}>
            {mode === 'render' ? '📝 كود' : '👁️ عرض'}
          </button>
          <button onClick={() => { setBlocks([]) }}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: '1px solid #30363d',
              background: '#21262d', color: '#f85149', fontSize: '11px', cursor: 'pointer',
            }}>
            🗑️ مسح
          </button>
          <button onClick={onClose}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: '1px solid #30363d',
              background: '#21262d', color: '#8b949e', fontSize: '11px', cursor: 'pointer',
            }}>
            ✕
          </button>
        </div>
      </div>

      {/* Blocks area */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {blocks.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px', color: '#484f58',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎨</div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Canvas فارغ</div>
            <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
              اكتب كود HTML، أو نص، أو ملاحظات أدناه<br />
              أو اطلب من الـ AI إنشاء محتوى هنا
            </div>
          </div>
        )}

        {blocks.map(block => (
          <div key={block.id} style={{
            marginBottom: '12px', border: '1px solid #30363d',
            borderRadius: '8px', overflow: 'hidden', background: '#161b22',
          }}>
            {/* Block header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 12px', borderBottom: '1px solid #30363d',
              background: '#0d1117', fontSize: '11px',
            }}>
              <span style={{ color: '#8b949e' }}>
                {block.type === 'html' ? '🌐 HTML' :
                 block.type === 'code' ? '💻 Code' :
                 block.type === 'chart' ? '📊 Chart' : '📝 Text'}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => navigator.clipboard.writeText(block.content)}
                  style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '11px' }}>
                  📋
                </button>
                <button onClick={() => removeBlock(block.id)}
                  style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '11px' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Block content */}
            {mode === 'render' ? (
              <div style={{ padding: '12px' }}>
                {block.type === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: block.content }}
                    style={{ background: '#fff', borderRadius: '6px', padding: '12px', color: '#333', minHeight: '40px' }} />
                ) : block.type === 'code' ? (
                  <pre style={{
                    margin: 0, padding: '12px', background: '#0d1117',
                    borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace',
                    overflow: 'auto', color: '#e6edf3', direction: 'ltr', textAlign: 'left',
                  }}>
                    <code>{block.content}</code>
                  </pre>
                ) : (
                  <div style={{ fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {block.content}
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                style={{
                  width: '100%', minHeight: '80px', padding: '12px',
                  background: '#0d1117', color: '#e6edf3', border: 'none',
                  fontFamily: 'monospace', fontSize: '12px', resize: 'vertical',
                  outline: 'none', direction: 'ltr',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div style={{
        padding: '12px', borderTop: '1px solid #30363d',
        background: '#161b22',
      }}>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب HTML، كود، أو ملاحظات... (Enter للإرسال)"
            rows={2}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              border: '1px solid #30363d', background: '#0d1117',
              color: '#e6edf3', fontSize: '13px', resize: 'none',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button onClick={handleSubmit}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #4FC3F7, #29B6F6)',
              color: '#0a0a1a', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            ➕
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== CANVAS INTEGRATION ====================

/**
 * Detect if user message is a Canvas request
 * Returns: 'open' | 'add-html' | 'add-code' | 'add-text' | null
 */
export function detectCanvasRequest(message: string): { action: string; content?: string } | null {
  const lower = message.toLowerCase()

  // Open canvas
  if (/(?:افتح|افتحي|أفتح|open)\s+(?:canvas|كانفاس|لوحة|اللوحة)/i.test(message)) {
    return { action: 'open' }
  }

  // Add HTML to canvas
  const htmlMatch = message.match(/(?:أضف|ضع|حط|add)\s+(?:في\s+)?(?:canvas|كانفاس|اللوحة)\s*[:：]?\s*(<[\s\S]+)/i)
  if (htmlMatch?.[1]) {
    return { action: 'add-html', content: htmlMatch[1].trim() }
  }

  // Add code to canvas
  const codeMatch = message.match(/(?:أضف|ضع|حط|add)\s+(?:كود|code)\s+(?:في\s+)?(?:canvas|كانفاس|اللوحة)\s*[:：]?\s*([\s\S]+)/i)
  if (codeMatch?.[1]) {
    return { action: 'add-code', content: codeMatch[1].trim() }
  }

  // Add text/notes
  const textMatch = message.match(/(?:أضف|ضع|حط|add)\s+(?:ملاحظة|note|نص|text)\s+(?:في\s+)?(?:canvas|كانفاس|اللوحة)\s*[:：]?\s*([\s\S]+)/i)
  if (textMatch?.[1]) {
    return { action: 'add-text', content: textMatch[1].trim() }
  }

  return null
}
