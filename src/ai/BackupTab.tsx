import { useState } from 'react'
import { useBackupStore } from '@/store/backupStore'
import type { BackupData, SyncConfig } from '@/types/backup'
import { formatBackupDate, formatBackupSize } from '@/types/backup'

type BackupView = 'list' | 'create' | 'settings'

export function BackupTab() {
  const [view, setView] = useState<BackupView>('list')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'restore' | 'delete' | null>(null)
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null)
  const [importJson, setImportJson] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)

  const {
    backups,
    syncConfig,
    isBackingUp,
    isRestoring,
    lastBackupTime,
    lastRestoreTime,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportBackup,
    importBackup,
    setSyncConfig,
    syncToGitHub,
    syncFromGitHub,
    clearBackups
  } = useBackupStore()

  const [githubToken, setGithubToken] = useState(syncConfig.githubToken || '')
  const [githubRepo, setGithubRepo] = useState(syncConfig.githubRepo || '')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  const handleCreateBackup = async (source: 'local' | 'github' | 'google-drive' = 'local') => {
    try {
      if (source === 'github') {
        if (!githubToken || !githubRepo) {
          alert('يرجى إدخال GitHub Token واسم المستخدم/المستودع')
          return
        }
        setSyncStatus('syncing')
        setSyncConfig({ githubToken, githubRepo, provider: 'github' })
        const success = await syncToGitHub(githubToken, githubRepo)
        setSyncStatus(success ? 'success' : 'error')
        if (success) setView('list')
      } else {
        await createBackup(source)
        setView('list')
      }
    } catch (error) {
      console.error('Backup failed:', error)
      setSyncStatus('error')
    }
  }

  const handleSyncFromGitHub = async () => {
    if (!githubToken || !githubRepo) {
      alert('يرجى إدخال GitHub Token واسم المستخدم/المستودع')
      return
    }
    setSyncStatus('syncing')
    setSyncConfig({ githubToken, githubRepo, provider: 'github' })
    const success = await syncFromGitHub(githubToken, githubRepo)
    setSyncStatus(success ? 'success' : 'error')
  }

  const handleRestore = (backupId: string) => {
    setSelectedBackupId(backupId)
    setPendingAction('restore')
    setShowConfirmModal(true)
  }

  const handleDelete = (backupId: string) => {
    setSelectedBackupId(backupId)
    setPendingAction('delete')
    setShowConfirmModal(true)
  }

  const handleConfirm = async () => {
    if (pendingAction === 'restore' && selectedBackupId) {
      await restoreBackup(selectedBackupId)
    } else if (pendingAction === 'delete' && selectedBackupId) {
      deleteBackup(selectedBackupId)
    }
    setShowConfirmModal(false)
    setPendingAction(null)
    setSelectedBackupId(null)
  }

  const handleExport = (backupId: string) => {
    const json = exportBackup(backupId)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${backupId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (importJson.trim()) {
      const success = importBackup(importJson)
      if (success) {
        setShowImportModal(false)
        setImportJson('')
      }
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#4CAF50', fontSize: '16px' }}>
            💾 Backup & Sync
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowImportModal(true)}
              style={{
                padding: '8px 12px',
                background: '#2196F3',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📥 Import
            </button>
            {backups.length > 0 && (
              <button
                onClick={clearBackups}
                style={{
                  padding: '8px 12px',
                  background: '#f44336',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗑️ Clear
              </button>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'list' as const, label: '📋 Backups' },
            { id: 'create' as const, label: '➕ Create' },
            { id: 'settings' as const, label: '⚙️ Settings' }
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
        {/* Backup List */}
        {view === 'list' && (
          <div>
            {/* Status */}
            {(lastBackupTime || lastRestoreTime) && (
              <div style={{
                padding: '12px',
                background: '#1a1a2e',
                borderRadius: '8px',
                border: '1px solid #333',
                marginBottom: '16px'
              }}>
                {lastBackupTime && (
                  <p style={{ margin: '0 0 4px', color: '#888', fontSize: '12px' }}>
                    آخر نسخ احتياطي: {formatBackupDate(lastBackupTime)}
                  </p>
                )}
                {lastRestoreTime && (
                  <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
                    آخر استعادة: {formatBackupDate(lastRestoreTime)}
                  </p>
                )}
              </div>
            )}

            {/* Backups */}
            {backups.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💾</div>
                <p style={{ margin: 0 }}>لا توجد نسخ احتياطية</p>
                <p style={{ margin: '8px 0 0', fontSize: '12px' }}>
                  أنشئ نسخة احتياطية للحفاظ على بياناتك
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {backups.map((backup) => (
                  <BackupCard
                    key={backup.timestamp}
                    backup={backup}
                    onRestore={() => handleRestore(backup.timestamp.toString())}
                    onDelete={() => handleDelete(backup.timestamp.toString())}
                    onExport={() => handleExport(backup.timestamp.toString())}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Backup */}
        {view === 'create' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{
              padding: '20px',
              background: '#1a1a2e',
              borderRadius: '8px',
              border: '1px solid #333',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💾</div>
              <h4 style={{ margin: '0 0 8px', color: '#fff' }}>إنشاء نسخة احتياطية</h4>
              <p style={{ margin: '0 0 20px', color: '#888', fontSize: '13px' }}>
                اختر مصدر النسخ الاحتياطي
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  onClick={() => handleCreateBackup('local')}
                  disabled={isBackingUp}
                  style={{
                    padding: '16px',
                    background: isBackingUp ? '#333' : '#4CAF50',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: isBackingUp ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                >
                  {isBackingUp ? '⏳ جاري النسخ...' : '💾 نسخ محلي'}
                </button>

                {/* GitHub Config */}
                <div style={{ padding: '12px', background: '#0d1117', borderRadius: '8px', border: '1px solid #333', textAlign: 'right' }}>
                  <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>إعدادات GitHub:</p>
                  <input
                    type="text"
                    placeholder="GitHub Token (ghp_...)"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '13px', marginBottom: '8px', direction: 'ltr', textAlign: 'left' }}
                  />
                  <input
                    type="text"
                    placeholder="username/repo (e.g. user/cyber-guardians-backup)"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '13px', direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleCreateBackup('github')}
                    disabled={isBackingUp || syncStatus === 'syncing'}
                    style={{
                      padding: '16px',
                      background: isBackingUp ? '#333' : '#333',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: isBackingUp ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {syncStatus === 'syncing' ? '⏳ جاري...' : '⬆️ رفع للـ GitHub'}
                  </button>

                  <button
                    onClick={handleSyncFromGitHub}
                    disabled={isBackingUp || syncStatus === 'syncing'}
                    style={{
                      padding: '16px',
                      background: isBackingUp ? '#333' : '#2196F3',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: isBackingUp ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {syncStatus === 'syncing' ? '⏳ جاري...' : '⬇️ استيراد من GitHub'}
                  </button>
                </div>

                {syncStatus === 'success' && <p style={{ color: '#4CAF50', fontSize: '13px', margin: 0 }}>✅ تمت المزامنة بنجاح</p>}
                {syncStatus === 'error' && <p style={{ color: '#f44336', fontSize: '13px', margin: 0 }}>❌ فشلت المزامنة</p>}
              </div>
            </div>

            {/* Info */}
            <div style={{
              padding: '16px',
              background: '#1a1a2e',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
                ℹ️ ما الذي يتم نسخه؟
              </h4>
              <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#888', fontSize: '13px' }}>
                <li>📋 القدرات المخصصة</li>
                <li>🔌 الأدوات</li>
                <li>🔗 الاتصالات</li>
                <li>📚 ملفات المشروع</li>
                <li>📝 تعليمات المشروع</li>
                <li>💬 المحادثات</li>
                <li>📜 سجل التغييرات</li>
                <li>📊 الإحصائيات</li>
              </ul>
            </div>
          </div>
        )}

        {/* Settings */}
        {view === 'settings' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Auto Sync */}
            <div style={{
              padding: '16px',
              background: '#1a1a2e',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
                🔄 Auto Sync
              </h4>

              <div style={{ display: 'grid', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#0d1117',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>تفعيل المزامنة التلقائية</span>
                  <input
                    type="checkbox"
                    checked={syncConfig.autoSync}
                    onChange={(e) => setSyncConfig({ autoSync: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#0d1117',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>المزامنة عند بدء التشغيل</span>
                  <input
                    type="checkbox"
                    checked={syncConfig.syncOnStart}
                    onChange={(e) => setSyncConfig({ syncOnStart: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#0d1117',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>المزامنة عند الإغلاق</span>
                  <input
                    type="checkbox"
                    checked={syncConfig.syncOnExit}
                    onChange={(e) => setSyncConfig({ syncOnExit: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                </label>
              </div>
            </div>

            {/* Sync Provider */}
            <div style={{
              padding: '16px',
              background: '#1a1a2e',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
                ☁️ مزود الخدمة
              </h4>

              <select
                value={syncConfig.provider}
                onChange={(e) => setSyncConfig({ provider: e.target.value as SyncConfig['provider'] })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="local">💾 محلي</option>
                <option value="github">🐙 GitHub</option>
                <option value="google-drive">📁 Google Drive</option>
              </select>
            </div>

            {/* Sync Interval */}
            <div style={{
              padding: '16px',
              background: '#1a1a2e',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
                ⏱️ فترة المزامنة
              </h4>

              <select
                value={syncConfig.syncInterval}
                onChange={(e) => setSyncConfig({ syncInterval: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value={300000}>كل 5 دقائق</option>
                <option value={900000}>كل 15 دقيقة</option>
                <option value={1800000}>كل 30 دقيقة</option>
                <option value={3600000}>كل ساعة</option>
                <option value={7200000}>كل ساعتين</option>
                <option value={21600000}>كل 6 ساعات</option>
                <option value={43200000}>كل 12 ساعة</option>
                <option value={86400000}>يومياً</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
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
              {pendingAction === 'restore' ? '🔄 استعادة' : '🗑️ حذف'}
            </h3>
            <p style={{ color: '#888', textAlign: 'center', marginBottom: '24px' }}>
              {pendingAction === 'restore'
                ? 'هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.'
                : 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ لا يمكن التراجع عن هذا الإجراء.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setPendingAction(null)
                  setSelectedBackupId(null)
                }}
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
                onClick={handleConfirm}
                disabled={isRestoring}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: pendingAction === 'restore' ? '#4CAF50' : '#f44336',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: isRestoring ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {isRestoring ? '⏳ جاري...' : 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
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
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #333'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', textAlign: 'center' }}>
              📥 استيراد نسخة احتياطية
            </h3>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='الصق بيانات النسخة الاحتياطية هنا...'
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                background: '#0d1117',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportJson('')
                }}
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
                onClick={handleImport}
                disabled={!importJson.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: importJson.trim() ? '#4CAF50' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: importJson.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                استيراد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BackupCard({
  backup,
  onRestore,
  onDelete,
  onExport
}: {
  backup: BackupData
  onRestore: () => void
  onDelete: () => void
  onExport: () => void
}) {
  const sourceIcons: Record<string, string> = {
    'local': '💾',
    'github': '🐙',
    'google-drive': '📁'
  }

  const sourceLabels: Record<string, string> = {
    'local': 'محلي',
    'github': 'GitHub',
    'google-drive': 'Google Drive'
  }

  const dataSize = JSON.stringify(backup).length

  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #333',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{sourceIcons[backup.source] || '💾'}</span>
          <div>
            <p style={{ margin: 0, color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
              نسخة احتياطية
            </p>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
              {sourceLabels[backup.source] || backup.source}
            </p>
          </div>
        </div>
        <span style={{ color: '#666', fontSize: '11px' }}>
          {formatBackupDate(backup.timestamp)}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <StatBadge label="القدرات" value={backup.skills?.length || 0} icon="📋" />
        <StatBadge label="الأدوات" value={backup.plugins?.length || 0} icon="🔌" />
        <StatBadge label="الاتصالات" value={backup.connectors?.length || 0} icon="🔗" />
        <StatBadge label="الحجم" value={formatBackupSize(dataSize)} icon="📊" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onRestore}
          style={{
            flex: 1,
            padding: '10px',
            background: '#4CAF50',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🔄 استعادة
        </button>
        <button
          onClick={onExport}
          style={{
            flex: 1,
            padding: '10px',
            background: '#2196F3',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📥 تصدير
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '10px 16px',
            background: '#f44336',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
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

function StatBadge({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      background: '#0d1117',
      borderRadius: '4px',
      fontSize: '11px'
    }}>
      <span>{icon}</span>
      <span style={{ color: '#888' }}>{value}</span>
    </div>
  )
}
