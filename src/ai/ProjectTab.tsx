import { useState, useRef } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { detectKnowledgeFileType, getFileIcon, type InstructionTone, type ResponseFormat, DEFAULT_INSTRUCTIONS } from '@/types/project'

const TONE_OPTIONS: { value: InstructionTone; label: string; icon: string }[] = [
  { value: 'professional', label: 'مهني', icon: '💼' },
  { value: 'friendly', label: 'ودي', icon: '😊' },
  { value: 'formal', label: 'رسمي', icon: '🎩' },
  { value: 'casual', label: 'عفوي', icon: '👋' },
  { value: 'academic', label: 'أكاديمي', icon: '🎓' },
  { value: 'creative', label: 'إبداعي', icon: '🎨' }
]

const FORMAT_OPTIONS: { value: ResponseFormat; label: string; icon: string }[] = [
  { value: 'markdown', label: 'Markdown', icon: '📝' },
  { value: 'plain', label: 'نص عادي', icon: '📄' },
  { value: 'code', label: 'كود', icon: '💻' },
  { value: 'json', label: 'JSON', icon: '📊' }
]

export function KnowledgeTab() {
  const { knowledge, addKnowledge, removeKnowledge, searchKnowledge } = useProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredKnowledge = searchQuery
    ? searchKnowledge(searchQuery)
    : knowledge

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      try {
        const content = await file.text()
        const fileType = detectKnowledgeFileType(file.type)
        addKnowledge({
          name: file.name,
          path: file.name,
          type: fileType,
          content,
          mimeType: file.type,
          size: file.size,
          source: 'local',
          tags: [],
          indexed: false
        })
      } catch (error) {
        console.error('Failed to read file:', error)
      }
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileUpload(e.dataTransfer.files)
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const totalSize = knowledge.reduce((sum, k) => sum + (k.size || 0), 0)

  return (
    <div style={{ padding: '16px', direction: 'rtl', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--heading-color)' }}>
          📚 المعرفة ({knowledge.length} ملف)
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
          ارفع ملفاتك ومستنداتك كمرجع دائم لـ AI
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '12px',
        padding: '8px 12px',
        background: '#1a1a2e',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#888'
      }}>
        <span>📊 الحجم: {formatSize(totalSize)}</span>
        <span>📄 الملفات: {knowledge.length}</span>
        <span>🔄 آخر تحديث: {knowledge.length > 0 ? new Date(Math.max(...knowledge.map(k => k.updatedAt))).toLocaleDateString('ar') : '-'}</span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 بحث في المعرفة..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#1a1a2e',
          border: '1px solid #333',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '13px',
          marginBottom: '12px'
        }}
      />

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: '2px dashed #444',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#4CAF50'
          e.currentTarget.style.background = '#1a2e1a'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#444'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{uploading ? '⏳' : '📎'}</div>
        <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>
          {uploading ? 'جاري الرفع...' : 'اسحب الملفات هنا أو انقر للاختيار'}
        </p>
        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '11px' }}>
          يدعم: النصوص، الكود، الصور، المستندات
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py,.java,.c,.cpp,.go,.rs,.sh,.html,.css,.xml,.png,.jpg,.gif,.svg,.pdf,.doc,.docx"
          onChange={(e) => handleFileUpload(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {/* Knowledge List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredKnowledge.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <p>{searchQuery ? 'لا توجد نتائج' : 'لا توجد ملفات بعد'}</p>
            <p style={{ fontSize: '12px' }}>ارفع ملفاتك لتبدأ</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredKnowledge.map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px', marginLeft: '12px' }}>{getFileIcon(file.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#ddd', fontWeight: 'bold' }}>{file.name}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    {formatSize(file.size)} • {file.source} • {new Date(file.updatedAt).toLocaleDateString('ar')}
                  </div>
                  {file.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {file.tags.map((tag) => (
                        <span key={tag} style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: '#2a2a3e',
                          borderRadius: '4px',
                          color: '#aaa'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeKnowledge(file.id)}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: '1px solid #666',
                    borderRadius: '4px',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function InstructionsTab() {
  const { instructions, setInstructions, resetInstructions, applyTemplate } = useProjectStore()
  const [role, setRole] = useState(instructions.role)
  const [tone, setTone] = useState<InstructionTone>(instructions.tone)
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>(instructions.responseFormat)
  const [customPrompt, setCustomPrompt] = useState(instructions.customPrompt)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setInstructions({ role, tone, responseFormat, customPrompt })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    resetInstructions()
    setRole('')
    setTone('professional')
    setResponseFormat('markdown')
    setCustomPrompt('')
  }

  const handleApplyTemplate = (templateId: string) => {
    applyTemplate(templateId)
    const template = DEFAULT_INSTRUCTIONS.templates.find((t) => t.id === templateId)
    if (template) {
      setRole(template.role)
      setTone(template.tone)
      setResponseFormat(template.responseFormat)
      setCustomPrompt(template.customPrompt)
    }
  }

  return (
    <div style={{ padding: '16px', direction: 'rtl', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--heading-color)' }}>
          📝 تعليمات مخصصة
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
          حدد دور AI ونبرة الصوت وصيغة الرد
        </p>
      </div>

      {/* Templates */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '12px' }}>📦 القوالب الجاهزة</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {DEFAULT_INSTRUCTIONS.templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleApplyTemplate(template.id)}
              style={{
                padding: '6px 12px',
                background: '#2a2a3e',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#aaa',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4CAF50'
                e.currentTarget.style.background = '#2d3a2e'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#444'
                e.currentTarget.style.background = '#2a2a3e'
              }}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Role */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>🎭 الدور</label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="مثال: مبرمج Python خبير"
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px'
          }}
        />
      </div>

      {/* Tone */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '12px' }}>🎨 نبرة الصوت</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setTone(option.value)}
              style={{
                padding: '8px 12px',
                background: tone === option.value ? '#4CAF50' : '#2a2a3e',
                border: `1px solid ${tone === option.value ? '#4CAF50' : '#444'}`,
                borderRadius: '6px',
                color: tone === option.value ? 'white' : '#aaa',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Response Format */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '12px' }}>📋 صيغة الرد</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FORMAT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setResponseFormat(option.value)}
              style={{
                padding: '8px 12px',
                background: responseFormat === option.value ? '#2196F3' : '#2a2a3e',
                border: `1px solid ${responseFormat === option.value ? '#2196F3' : '#444'}`,
                borderRadius: '6px',
                color: responseFormat === option.value ? 'white' : '#aaa',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div style={{ flex: 1, marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>✏️ تعليمات إضافية</label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="أضف تعليمات مخصصة هنا..."
          style={{
            width: '100%',
            height: '120px',
            padding: '8px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 16px',
            background: '#333',
            border: 'none',
            borderRadius: '6px',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🔄 إعادة تعيين
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            background: saved ? '#4CAF50' : '#2196F3',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s'
          }}
        >
          {saved ? '✓ تم الحفظ' : '💾 حفظ'}
        </button>
      </div>
    </div>
  )
}

export function ProjectChatsTab() {
  const {
    chats,
    activeChatId,
    createProjectChat,
    deleteProjectChat,
    switchProjectChat,
    renameProjectChat,
    togglePinChat,
    toggleArchiveChat,
    getPinnedChats,
    getRecentChats,
    getArchivedChats,
    sharedMemory,
    setSharedMemory
  } = useProjectStore()

  const [newChatName, setNewChatName] = useState('')
  const [showNewChatInput, setShowNewChatInput] = useState(false)

  const pinnedChats = getPinnedChats()
  const recentChats = getRecentChats().filter((c) => !c.pinned)
  const archivedChats = getArchivedChats()

  const handleCreateChat = () => {
    if (!newChatName.trim()) return
    createProjectChat(newChatName.trim())
    setNewChatName('')
    setShowNewChatInput(false)
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    if (diff < 60000) return 'الآن'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} دقيقة`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعة`
    return new Date(timestamp).toLocaleDateString('ar')
  }

  return (
    <div style={{ padding: '16px', direction: 'rtl', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--heading-color)' }}>
            💬 المحادثات ({chats.length})
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
            محادثات المشروع المشتركة
          </p>
        </div>
        <button
          onClick={() => setShowNewChatInput(true)}
          style={{
            padding: '6px 12px',
            background: '#9C27B0',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          + جلسة جديدة
        </button>
      </div>

      {/* Shared Memory Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        background: '#1a1a2e',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ fontSize: '13px', color: '#ddd' }}>ذاكرة مشتركة</div>
          <div style={{ fontSize: '11px', color: '#888' }}>جميع المحادثات تتذكر الملفات والتعليمات</div>
        </div>
        <button
          onClick={() => setSharedMemory(!sharedMemory)}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            background: sharedMemory ? '#4CAF50' : '#555',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: '2px',
            left: sharedMemory ? '22px' : '2px',
            transition: 'all 0.2s'
          }} />
        </button>
      </div>

      {/* New Chat Input */}
      {showNewChatInput && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          padding: '12px',
          background: '#1a1a2e',
          borderRadius: '8px'
        }}>
          <input
            type="text"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            placeholder="اسم الجلسة..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#2a2a3e',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
          <button
            onClick={handleCreateChat}
            disabled={!newChatName.trim()}
            style={{
              padding: '8px 12px',
              background: newChatName.trim() ? '#4CAF50' : '#555',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: newChatName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            إنشاء
          </button>
          <button
            onClick={() => setShowNewChatInput(false)}
            style={{
              padding: '8px 12px',
              background: '#333',
              border: 'none',
              borderRadius: '6px',
              color: '#aaa',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            إلغاء
          </button>
        </div>
      )}

      {/* Chat List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {pinnedChats.length === 0 && recentChats.length === 0 && archivedChats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p>لا توجد محادثات بعد</p>
            <p style={{ fontSize: '12px' }}>اضغط "+ جلسة جديدة" للبدء</p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinnedChats.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>📌 مثبتة</h4>
                {pinnedChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    onSwitch={() => switchProjectChat(chat.id)}
                    onRename={(name) => renameProjectChat(chat.id, name)}
                    onTogglePin={() => togglePinChat(chat.id)}
                    onToggleArchive={() => toggleArchiveChat(chat.id)}
                    onDelete={() => deleteProjectChat(chat.id)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Recent */}
            {recentChats.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>📂 حديثة</h4>
                {recentChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    onSwitch={() => switchProjectChat(chat.id)}
                    onRename={(name) => renameProjectChat(chat.id, name)}
                    onTogglePin={() => togglePinChat(chat.id)}
                    onToggleArchive={() => toggleArchiveChat(chat.id)}
                    onDelete={() => deleteProjectChat(chat.id)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Archived */}
            {archivedChats.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>🗄️ أرشيف</h4>
                {archivedChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    onSwitch={() => switchProjectChat(chat.id)}
                    onRename={(name) => renameProjectChat(chat.id, name)}
                    onTogglePin={() => togglePinChat(chat.id)}
                    onToggleArchive={() => toggleArchiveChat(chat.id)}
                    onDelete={() => deleteProjectChat(chat.id)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface ChatItemProps {
  chat: { id: string; name: string; messages: unknown[]; pinned: boolean; archived: boolean; lastActivity: number }
  isActive: boolean
  onSwitch: () => void
  onRename: (name: string) => void
  onTogglePin: () => void
  onToggleArchive: () => void
  onDelete: () => void
  formatTime: (timestamp: number) => string
}

function ChatItem({ chat, isActive, onSwitch, onRename, onTogglePin, onToggleArchive, onDelete, formatTime }: ChatItemProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(chat.name)

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim())
    }
    setEditing(false)
  }

  return (
    <div
      onClick={onSwitch}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        background: isActive ? '#2a2a3e' : '#1a1a2e',
        border: `1px solid ${isActive ? '#9C27B0' : '#333'}`,
        borderRadius: '8px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ fontSize: '20px', marginLeft: '12px' }}>💬</div>
      <div style={{ flex: 1 }}>
        {editing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '4px 8px',
              background: '#2a2a3e',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        ) : (
          <div style={{ fontSize: '14px', color: '#ddd', fontWeight: 'bold' }}>{chat.name}</div>
        )}
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
          {chat.messages.length} رسالة • {formatTime(chat.lastActivity)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✏️
        </button>
        <button
          onClick={onTogglePin}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            color: chat.pinned ? '#FF9800' : '#888',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📌
        </button>
        <button
          onClick={onToggleArchive}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🗄️
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            color: '#f44336',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
