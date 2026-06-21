import { useState } from 'react'
import { useSecurityStore } from '@/store/securityStore'
import type { EncryptionAlgorithm, HashAlgorithm } from '@/types/security'
import { formatTimestamp } from '@/types/security'

type SecurityView = 'settings' | 'activity' | 'encryption' | 'about'

export function SecurityTab() {
  const [view, setView] = useState<SecurityView>('settings')
  const [showLockModal, setShowLockModal] = useState(false)
  const [lockPassword, setLockPassword] = useState('')
  const [showEncryptModal, setShowEncryptModal] = useState(false)
  const [encryptData, setEncryptData] = useState('')
  const [encryptPassword, setEncryptPassword] = useState('')
  const [encryptedResult, setEncryptedResult] = useState('')
  const [showDecryptModal, setShowDecryptModal] = useState(false)
  const [decryptData, setDecryptData] = useState('')
  const [decryptPassword, setDecryptPassword] = useState('')
  const [decryptedResult, setDecryptedResult] = useState('')
  const [showHashModal, setShowHashModal] = useState(false)
  const [hashData, setHashData] = useState('')
  const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgorithm>('SHA-256')
  const [hashResult, setHashResult] = useState('')

  const {
    settings,
    activityLogs,
    isLocked,
    lastActivity,
    failedAttempts,
    updateSettings,
    encrypt,
    decrypt,
    hash,
    logActivity,
    getActivityLogs,
    clearActivityLogs,
    lock,
    unlock,
    updateActivity
  } = useSecurityStore()

  const handleEncrypt = async () => {
    if (!encryptData || !encryptPassword) return
    try {
      const result = await encrypt(encryptData, encryptPassword)
      setEncryptedResult(JSON.stringify(result, null, 2))
      logActivity('encrypt', 'تم تشفير البيانات', true)
    } catch {
      logActivity('encrypt', 'فشل التشفير', false)
    }
  }

  const handleDecrypt = async () => {
    if (!decryptData || !decryptPassword) return
    try {
      const encrypted = JSON.parse(decryptData)
      const result = await decrypt(encrypted, decryptPassword)
      if (!result) {
        setDecryptedResult('خطأ في فك التشفير — تأكد من كلمة المرور')
        logActivity('decrypt', 'فشل فك التشفير — كلمة المرور غير صحيحة', false)
        return
      }
      setDecryptedResult(result)
      logActivity('decrypt', 'تم فك التشفير', true)
    } catch (err: any) {
      const message = err instanceof SyntaxError ? 'البيانات المشفرة غير صالحة (JSON غير صحيح)' : 'فشل فك التشفير'
      alert(message)
      logActivity('decrypt', message, false)
    }
  }

  const handleHash = async () => {
    if (!hashData) return
    try {
      const result = await hash(hashData, hashAlgorithm)
      setHashResult(result)
      logActivity('hash', `تم إنشاء hash بـ ${hashAlgorithm}`, true)
    } catch {
      logActivity('hash', 'فشل إنشاء hash', false)
    }
  }

  const handleLock = () => {
    lock()
    setShowLockModal(false)
  }

  const handleUnlock = async () => {
    const success = await unlock(lockPassword)
    if (success) {
      setShowLockModal(false)
      setLockPassword('')
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
            🔒 الأمان والخصوصية
          </h3>
          <button
            onClick={() => isLocked ? setShowLockModal(true) : lock()}
            style={{
              padding: '8px 12px',
              background: isLocked ? '#4CAF50' : '#f44336',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isLocked ? '🔓 فتح القفل' : '🔒 قفل'}
          </button>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'settings' as const, label: '⚙️ الإعدادات' },
            { id: 'activity' as const, label: '📜 النشاط' },
            { id: 'encryption' as const, label: '🔐 التشفير' },
            { id: 'about' as const, label: 'ℹ️ حول' }
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
        {/* Settings View */}
        {view === 'settings' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Status */}
            <div style={{
              padding: '16px',
              background: isLocked ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)',
              borderRadius: '8px',
              border: `1px solid ${isLocked ? '#f44336' : '#4CAF50'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>{isLocked ? '🔒' : '🔓'}</span>
                <div>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 'bold' }}>
                    {isLocked ? 'النظام مقفل' : 'النظام مفتوح'}
                  </p>
                  <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
                    آخر نشاط: {formatTimestamp(lastActivity)}
                  </p>
                </div>
              </div>
            </div>

            {/* Encryption */}
            <SettingsSection title="🔐 التشفير">
              <ToggleSwitch
                checked={settings.encryptionEnabled}
                onChange={() => updateSettings({ encryptionEnabled: !settings.encryptionEnabled })}
                label="تفعيل التشفير"
              />
              <select
                value={settings.encryptionAlgorithm}
                onChange={(e) => updateSettings({ encryptionAlgorithm: e.target.value as EncryptionAlgorithm })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                <option value="AES-GCM">AES-GCM (موصى به)</option>
                <option value="AES-CBC">AES-CBC</option>
              </select>
            </SettingsSection>

            {/* Lock Settings */}
            <SettingsSection title="🔒 إعدادات القفل">
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0d1117', borderRadius: '6px' }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>القفل التلقائي</span>
                  <select
                    value={settings.autoLockTimeout}
                    onChange={(e) => updateSettings({ autoLockTimeout: parseInt(e.target.value) })}
                    style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value={60000}>دقيقة</option>
                    <option value={300000}>5 دقائق</option>
                    <option value={900000}>15 دقيقة</option>
                    <option value={1800000}>30 دقيقة</option>
                    <option value={3600000}>ساعة</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0d1117', borderRadius: '6px' }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>محاولات الدخول القصوى</span>
                  <select
                    value={settings.maxLoginAttempts}
                    onChange={(e) => updateSettings({ maxLoginAttempts: parseInt(e.target.value) })}
                    style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0d1117', borderRadius: '6px' }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>مدة القفل</span>
                  <select
                    value={settings.lockDuration}
                    onChange={(e) => updateSettings({ lockDuration: parseInt(e.target.value) })}
                    style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value={60000}>دقيقة</option>
                    <option value={300000}>5 دقائق</option>
                    <option value={900000}>15 دقيقة</option>
                    <option value={1800000}>30 دقيقة</option>
                  </select>
                </div>
              </div>
            </SettingsSection>

            {/* Session */}
            <SettingsSection title="⏱️ الجلسة">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0d1117', borderRadius: '6px' }}>
                <span style={{ color: '#fff', fontSize: '13px' }}>مهلة انتهاء الجلسة</span>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSettings({ sessionTimeout: parseInt(e.target.value) })}
                  style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                >
                  <option value={1800000}>30 دقيقة</option>
                  <option value={3600000}>ساعة</option>
                  <option value={7200000}>ساعتان</option>
                  <option value={86400000}>يوم</option>
                </select>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Activity View */}
        {view === 'activity' && (
          <div>
            {activityLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
                <p>لا يوجد نشاط</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button
                    onClick={clearActivityLogs}
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
                    🗑️ مسح السجل
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {getActivityLogs(20).map((log) => (
                    <div key={log.id} style={{
                      padding: '12px',
                      background: '#1a1a2e',
                      borderRadius: '8px',
                      border: `1px solid ${log.success ? '#4CAF50' : '#f44336'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
                          {log.success ? '✅' : '❌'} {log.action}
                        </span>
                        <span style={{ color: '#888', fontSize: '11px' }}>
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
                        {log.details}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Encryption View */}
        {view === 'encryption' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <button
              onClick={() => setShowEncryptModal(true)}
              style={{
                padding: '16px',
                background: '#4CAF50',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🔐 تشفير نص
            </button>

            <button
              onClick={() => setShowDecryptModal(true)}
              style={{
                padding: '16px',
                background: '#2196F3',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🔓 فك تشفير نص
            </button>

            <button
              onClick={() => setShowHashModal(true)}
              style={{
                padding: '16px',
                background: '#FF9800',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              #️⃣ إنشاء hash
            </button>
          </div>
        )}

        {/* About View */}
        {view === 'about' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{
              padding: '16px',
              background: '#1a1a2e',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff' }}>🔐 الأمان</h4>
              <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
                يستخدم التطبيق أحدث تقنيات التشفير لحماية بياناتك:
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: '16px', color: '#888', fontSize: '13px' }}>
                <li>AES-GCM للتشفير</li>
                <li>PBKDF2 لاشتقاق المفاتيح</li>
                <li>SHA-256 للتحقق من السلمية</li>
                <li>تشفير جميع البيانات محلياً</li>
              </ul>
            </div>

            <div style={{
              padding: '16px',
              background: '#1a1a2e',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff' }}>🔒 الخصوصية</h4>
              <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
                نحترم خصوصيتك:
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: '16px', color: '#888', fontSize: '13px' }}>
                <li>جميع البيانات محفوظة محلياً</li>
                <li>لا نجمع أي بيانات شخصية</li>
                <li>لا نرسل بيانات لخوادم خارجية</li>
                <li>تشفير كامل للبيانات</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Lock Modal */}
      {showLockModal && (
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
              🔓 فتح القفل
            </h3>
            <input
              type="password"
              value={lockPassword}
              onChange={(e) => setLockPassword(e.target.value)}
              placeholder="كلمة المرور..."
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
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowLockModal(false)
                  setLockPassword('')
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
                onClick={handleUnlock}
                style={{
                  flex: 1,
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
                فتح
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encrypt Modal */}
      {showEncryptModal && (
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
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', textAlign: 'center' }}>
              🔐 تشفير نص
            </h3>
            <textarea
              value={encryptData}
              onChange={(e) => setEncryptData(e.target.value)}
              placeholder="النص المراد تشفيره..."
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
              type="password"
              value={encryptPassword}
              onChange={(e) => setEncryptPassword(e.target.value)}
              placeholder="كلمة المرور..."
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
            {encryptedResult && (
              <div style={{
                padding: '12px',
                background: '#0d1117',
                borderRadius: '8px',
                marginBottom: '12px',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, color: '#4CAF50', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  {encryptedResult}
                </pre>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowEncryptModal(false)
                  setEncryptData('')
                  setEncryptPassword('')
                  setEncryptedResult('')
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
                onClick={handleEncrypt}
                disabled={!encryptData || !encryptPassword}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: encryptData && encryptPassword ? '#4CAF50' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: encryptData && encryptPassword ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                تشفير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decrypt Modal */}
      {showDecryptModal && (
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
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', textAlign: 'center' }}>
              🔓 فك تشفير نص
            </h3>
            <textarea
              value={decryptData}
              onChange={(e) => setDecryptData(e.target.value)}
              placeholder="البيانات المشفرة (JSON)..."
              style={{
                width: '100%',
                height: '100px',
                padding: '12px',
                background: '#0d1117',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                marginBottom: '12px'
              }}
            />
            <input
              type="password"
              value={decryptPassword}
              onChange={(e) => setDecryptPassword(e.target.value)}
              placeholder="كلمة المرور..."
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
            {decryptedResult && (
              <div style={{
                padding: '12px',
                background: '#0d1117',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <pre style={{ margin: 0, color: '#2196F3', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {decryptedResult}
                </pre>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDecryptModal(false)
                  setDecryptData('')
                  setDecryptPassword('')
                  setDecryptedResult('')
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
                onClick={handleDecrypt}
                disabled={!decryptData || !decryptPassword}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: decryptData && decryptPassword ? '#2196F3' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: decryptData && decryptPassword ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                فك التشفير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hash Modal */}
      {showHashModal && (
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
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', textAlign: 'center' }}>
              #️⃣ إنشاء hash
            </h3>
            <input
              type="text"
              value={hashData}
              onChange={(e) => setHashData(e.target.value)}
              placeholder="النص..."
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
              value={hashAlgorithm}
              onChange={(e) => setHashAlgorithm(e.target.value as HashAlgorithm)}
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
            >
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-512">SHA-512</option>
            </select>
            {hashResult && (
              <div style={{
                padding: '12px',
                background: '#0d1117',
                borderRadius: '8px',
                marginBottom: '12px',
                wordBreak: 'break-all'
              }}>
                <pre style={{ margin: 0, color: '#FF9800', fontSize: '12px' }}>
                  {hashResult}
                </pre>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowHashModal(false)
                  setHashData('')
                  setHashResult('')
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
                onClick={handleHash}
                disabled={!hashData}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: hashData ? '#FF9800' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: hashData ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                إنشاء
              </button>
            </div>
          </div>
        </div>
      )}
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
