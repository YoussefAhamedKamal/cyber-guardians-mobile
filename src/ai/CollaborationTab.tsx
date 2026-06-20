import { useState } from 'react'
import { useCollaborationStore } from '@/store/collaborationStore'
import type { SharePlatform, ExportFormat, Collaborator } from '@/types/collaboration'
import { formatTimestamp, formatFileSize } from '@/types/collaboration'

type CollaborationView = 'share' | 'export' | 'links' | 'collaborators'

const SHARE_PLATFORMS: { id: SharePlatform; name: string; icon: string; color: string }[] = [
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#0088cc' },
  { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
  { id: 'email', name: 'Email', icon: '📧', color: '#EA4335' },
  { id: 'copy', name: 'Copy', icon: '📋', color: '#607D8B' },
  { id: 'qr-code', name: 'QR Code', icon: '📱', color: '#9C27B0' }
]

const EXPORT_FORMATS: { id: ExportFormat; name: string; icon: string; ext: string }[] = [
  { id: 'json', name: 'JSON', icon: '📊', ext: '.json' },
  { id: 'markdown', name: 'Markdown', icon: '📝', ext: '.md' },
  { id: 'html', name: 'HTML', icon: '🌐', ext: '.html' },
  { id: 'csv', name: 'CSV', icon: '📈', ext: '.csv' }
]

export function CollaborationTab() {
  const [view, setView] = useState<CollaborationView>('share')
  const [shareMessage, setShareMessage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [exportData, setExportData] = useState('')
  const [exportFilename, setExportFilename] = useState('export')
  const [showAddCollaborator, setShowAddCollaborator] = useState(false)
  const [newCollaborator, setNewCollaborator] = useState({ name: '', email: '', role: 'viewer' as Collaborator['role'] })

  const {
    shareHistory,
    exportHistory,
    sharedLinks,
    collaborators,
    share,
    export: exportDataFn,
    createShareLink,
    deleteShareLink,
    addCollaborator,
    removeCollaborator
  } = useCollaborationStore()

  const handleShare = (platform: SharePlatform) => {
    share({
      platform,
      message: shareMessage,
      url: shareUrl || window.location.href
    })
  }

  const handleExport = (format: ExportFormat) => {
    let data: unknown
    try {
      data = JSON.parse(exportData)
    } catch {
      data = exportData
    }
    exportDataFn(data, exportFilename, { format, includeMetadata: true })
  }

  const handleCreateLink = () => {
    let data: unknown
    try {
      data = JSON.parse(exportData)
    } catch {
      data = exportData
    }
    createShareLink(data, 86400000)
  }

  const handleAddCollaborator = () => {
    if (newCollaborator.name && newCollaborator.email) {
      addCollaborator({
        name: newCollaborator.name,
        email: newCollaborator.email,
        role: newCollaborator.role,
        lastActive: null
      })
      setNewCollaborator({ name: '', email: '', role: 'viewer' })
      setShowAddCollaborator(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#4CAF50', fontSize: '16px' }}>
          🤝 مشاركة وتعاون
        </h3>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'share' as const, label: '📤 مشاركة' },
            { id: 'export' as const, label: '📥 تصدير' },
            { id: 'links' as const, label: '🔗 روابط' },
            { id: 'collaborators' as const, label: '👥 أعضاء' }
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
        {/* Share View */}
        {view === 'share' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="الرسالة المراد مشاركتها..."
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '12px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '12px'
                }}
              />
              <input
                type="url"
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                placeholder="رابط اختياري..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {SHARE_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleShare(platform.id)}
                  style={{
                    padding: '16px',
                    background: platform.color,
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${platform.color}66`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{platform.icon}</span>
                  {platform.name}
                </button>
              ))}
            </div>

            {/* Share History */}
            {shareHistory.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>
                  📜 سجل المشاركة:
                </h4>
                {shareHistory.slice(0, 5).map((item) => (
                  <div key={item.id} style={{
                    padding: '8px',
                    background: '#0d1117',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    fontSize: '11px',
                    color: '#888'
                  }}>
                    {item.success ? '✅' : '❌'} {item.platform} - {formatTimestamp(item.timestamp)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export View */}
        {view === 'export' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <input
                type="text"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder="اسم الملف..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              />
              <textarea
                value={exportData}
                onChange={(e) => setExportData(e.target.value)}
                placeholder="البيانات المراد تصديرها (JSON)..."
                style={{
                  width: '100%',
                  height: '150px',
                  padding: '12px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleExport(format.id)}
                  style={{
                    padding: '16px',
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4CAF50'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{format.icon}</span>
                  {format.name}
                </button>
              ))}
            </div>

            {/* Export History */}
            {exportHistory.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>
                  📜 سجل التصدير:
                </h4>
                {exportHistory.slice(0, 5).map((item) => (
                  <div key={item.id} style={{
                    padding: '8px',
                    background: '#0d1117',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#888'
                  }}>
                    <span>{item.success ? '✅' : '❌'} {item.filename}</span>
                    <span>{formatFileSize(item.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links View */}
        {view === 'links' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <button
              onClick={handleCreateLink}
              style={{
                padding: '12px',
                background: '#4CAF50',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🔗 إنشاء رابط مشاركة
            </button>

            {sharedLinks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
                <p>لا توجد روابط مشاركة</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {sharedLinks.map((link) => (
                  <div key={link.id} style={{
                    padding: '12px',
                    background: '#1a1a2e',
                    borderRadius: '8px',
                    border: '1px solid #333'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#4CAF50', fontSize: '12px', wordBreak: 'break-all' }}>
                        {link.url}
                      </span>
                      <button
                        onClick={() => deleteShareLink(link.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#f44336',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', color: '#888', fontSize: '11px' }}>
                      <span>📅 {formatTimestamp(link.createdAt)}</span>
                      <span>👁️ {link.accessCount} مشاهدة</span>
                      {link.expiresAt && (
                        <span>⏰ {link.expiresAt > Date.now() ? 'صالح' : 'منتهي'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collaborators View */}
        {view === 'collaborators' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <button
              onClick={() => setShowAddCollaborator(true)}
              style={{
                padding: '12px',
                background: '#4CAF50',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              👥 إضافة عضو
            </button>

            {collaborators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                <p>لا يوجد أعضاء</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {collaborators.map((collab) => (
                  <div key={collab.id} style={{
                    padding: '12px',
                    background: '#1a1a2e',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: collab.role === 'admin' ? '#f44336' :
                        collab.role === 'editor' ? '#FF9800' : '#4CAF50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      color: '#fff',
                      fontWeight: 'bold'
                    }}>
                      {collab.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                        {collab.name}
                      </p>
                      <p style={{ margin: '4px 0 0', color: '#888', fontSize: '11px' }}>
                        {collab.email}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      background: collab.role === 'admin' ? '#f44336' :
                        collab.role === 'editor' ? '#FF9800' : '#4CAF50',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '10px'
                    }}>
                      {collab.role === 'admin' ? 'مدير' : collab.role === 'editor' ? 'محرر' : 'مشاهد'}
                    </span>
                    <button
                      onClick={() => removeCollaborator(collab.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#f44336',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Collaborator Modal */}
      {showAddCollaborator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            border: '1px solid #333'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', textAlign: 'center' }}>
              👥 إضافة عضو
            </h3>
            <input
              type="text"
              value={newCollaborator.name}
              onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
              placeholder="الاسم..."
              style={{
                width: '100%',
                padding: '12px',
                background: '#0d1117',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />
            <input
              type="email"
              value={newCollaborator.email}
              onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
              placeholder="البريد الإلكتروني..."
              style={{
                width: '100%',
                padding: '12px',
                background: '#0d1117',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />
            <select
              value={newCollaborator.role}
              onChange={(e) => setNewCollaborator({ ...newCollaborator, role: e.target.value as Collaborator['role'] })}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0d1117',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '16px'
              }}
            >
              <option value="viewer">مشاهد</option>
              <option value="editor">محرر</option>
              <option value="admin">مدير</option>
            </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddCollaborator(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCollaborator}
                disabled={!newCollaborator.name || !newCollaborator.email}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: newCollaborator.name && newCollaborator.email ? '#4CAF50' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: newCollaborator.name && newCollaborator.email ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
