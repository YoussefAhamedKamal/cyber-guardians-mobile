import { useState } from 'react'
import { useVersionHistoryStore } from '@/store/versionHistoryStore'
import type { Change, VersionSnapshot, ChangeType, ItemType, VersionDiff } from '@/types/versionHistory'
import {
  formatTimestamp,
  formatRelativeTime,
  getChangeTypeLabel,
  getItemTypeLabel,
  getChangeTypeIcon,
  getItemTypeIcon
} from '@/types/versionHistory'

type HistoryView = 'timeline' | 'snapshots' | 'diff'

export function VersionHistoryTab() {
  const [view, setView] = useState<HistoryView>('timeline')
  const [selectedSnapshot, setSelectedSnapshot] = useState<VersionSnapshot | null>(null)
  const [compareSnapshot, setCompareSnapshot] = useState<VersionSnapshot | null>(null)
  const [filterType, setFilterType] = useState<ChangeType | 'all'>('all')
  const [filterItemType, setFilterItemType] = useState<ItemType | 'all'>('all')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'restore' | 'clear' | null>(null)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null)

  const {
    changes,
    snapshots,
    recordChange,
    createSnapshot,
    restoreSnapshot,
    getRecentChanges,
    compareSnapshots,
    clearHistory,
    clearSnapshots
  } = useVersionHistoryStore()

  const filteredChanges = changes.filter((c) => {
    if (filterType !== 'all' && c.type !== filterType) return false
    if (filterItemType !== 'all' && c.itemType !== filterItemType) return false
    return true
  })

  const handleCreateSnapshot = () => {
    const snap = createSnapshot()
    setSelectedSnapshot(snap)
  }

  const handleRestore = (snapshotId: string) => {
    setSelectedSnapshotId(snapshotId)
    setPendingAction('restore')
    setShowConfirmModal(true)
  }

  const handleClearHistory = () => {
    setPendingAction('clear')
    setShowConfirmModal(true)
  }

  const handleConfirm = () => {
    if (pendingAction === 'restore' && selectedSnapshotId) {
      const restored = restoreSnapshot(selectedSnapshotId)
      if (restored) {
        setSelectedSnapshot(restored)
        setCompareSnapshot(null)
        setView('snapshots')
      }
    } else if (pendingAction === 'clear') {
      clearHistory()
    }
    setShowConfirmModal(false)
    setPendingAction(null)
    setSelectedSnapshotId(null)
  }

  const handleCompare = (snap1: VersionSnapshot, snap2: VersionSnapshot) => {
    setSelectedSnapshot(snap1)
    setCompareSnapshot(snap2)
    setView('diff')
  }

  const diffs = selectedSnapshot && compareSnapshot
    ? compareSnapshots(selectedSnapshot.id, compareSnapshot.id)
    : []

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
            📜 Version History
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateSnapshot}
              style={{
                padding: '8px 12px',
                background: '#4CAF50',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              📸 Snapshot
            </button>
            {changes.length > 0 && (
              <button
                onClick={handleClearHistory}
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
            { id: 'timeline' as const, label: '📊 Timeline' },
            { id: 'snapshots' as const, label: '📸 Snapshots' },
            { id: 'diff' as const, label: '🔍 Compare' }
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
        {/* Timeline View */}
        {view === 'timeline' && (
          <div>
            {/* Filters */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ChangeType | 'all')}
                style={{
                  padding: '8px',
                  background: '#2a2a3e',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              >
                <option value="all">الكل</option>
                <option value="create">إنشاء</option>
                <option value="update">تحديث</option>
                <option value="delete">حذف</option>
                <option value="install">تثبيت</option>
                <option value="uninstall">إلغاء</option>
                <option value="toggle">تفعيل</option>
                <option value="reorder">ترتيب</option>
              </select>

              <select
                value={filterItemType}
                onChange={(e) => setFilterItemType(e.target.value as ItemType | 'all')}
                style={{
                  padding: '8px',
                  background: '#2a2a3e',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              >
                <option value="all">الكل</option>
                <option value="skill">قدرات</option>
                <option value="plugin">أدوات</option>
                <option value="connector">اتصالات</option>
                <option value="knowledge">معرفة</option>
                <option value="instructions">تعليمات</option>
              </select>
            </div>

            {/* Changes List */}
            {filteredChanges.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
                <p style={{ margin: 0 }}>لا يوجد تغييرات بعد</p>
                <p style={{ margin: '8px 0 0', fontSize: '12px' }}>
                  ابدأ باستخدام النظام لتسجيل التغييرات
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Timeline Line */}
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#333'
                }} />

                {/* Changes */}
                {filteredChanges.map((change, index) => (
                  <ChangeItem key={change.id} change={change} index={index} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Snapshots View */}
        {view === 'snapshots' && (
          <div>
            {snapshots.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
                <p style={{ margin: 0 }}>لا يوجد Snapshots</p>
                <p style={{ margin: '8px 0 0', fontSize: '12px' }}>
                  أنشئ Snapshot لحفظ الحالة الحالية
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {snapshots.map((snapshot) => (
                  <SnapshotCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    isSelected={selectedSnapshot?.id === snapshot.id}
                    onSelect={() => setSelectedSnapshot(snapshot)}
                    onRestore={() => handleRestore(snapshot.id)}
                    onCompare={(other) => handleCompare(snapshot, other)}
                    snapshots={snapshots}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Diff View */}
        {view === 'diff' && (
          <div>
            {!selectedSnapshot || !compareSnapshot ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <p style={{ margin: 0 }}>اختر Snapshot للاختلاف</p>
                <p style={{ margin: '8px 0 0', fontSize: '12px' }}>
                  اختر Snapshotان من تبويب Snapshots للمقارنة
                </p>
              </div>
            ) : diffs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p style={{ margin: 0 }}>لا يوجد اختلافات</p>
                <p style={{ margin: '8px 0 0', fontSize: '12px' }}>
                  الحالتان متماثلتان
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  background: '#1a1a2e',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  marginBottom: '8px'
                }}>
                  <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
                    مقارنة: {formatTimestamp(selectedSnapshot.timestamp)} ↔ {formatTimestamp(compareSnapshot.timestamp)}
                  </p>
                </div>

                {diffs.map((diff, index) => (
                  <DiffItem key={index} diff={diff} />
                ))}
              </div>
            )}
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
              {pendingAction === 'restore' ? '🔄 استعادة Snapshot' : '🗑️ مسح التاريخ'}
            </h3>
            <p style={{ color: '#888', textAlign: 'center', marginBottom: '24px' }}>
              {pendingAction === 'restore'
                ? 'هل أنت متأكد من استعادة هذه الحالة؟ سيتم استبدال الحالة الحالية.'
                : 'هل أنت متأكد من مسح جميع التغييرات؟ لا يمكن التراجع عن هذا الإجراء.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setPendingAction(null)
                  setSelectedSnapshotId(null)
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
                style={{
                  flex: 1,
                  padding: '12px',
                  background: pendingAction === 'restore' ? '#4CAF50' : '#f44336',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChangeItem({ change, index }: { change: Change; index: number }) {
  return (
    <div style={{
      position: 'relative',
      paddingLeft: '40px',
      paddingBottom: '20px'
    }}>
      {/* Timeline Dot */}
      <div style={{
        position: 'absolute',
        left: '12px',
        top: '4px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#4CAF50',
        border: '2px solid #1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px'
      }}>
        {getChangeTypeIcon(change.type)}
      </div>

      {/* Change Card */}
      <div style={{
        background: '#1a1a2e',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid #333',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4CAF50'
        e.currentTarget.style.transform = 'translateX(4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#333'
        e.currentTarget.style.transform = 'translateX(0)'
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>{getItemTypeIcon(change.itemType)}</span>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
              {change.itemName}
            </span>
          </div>
          <span style={{ color: '#888', fontSize: '11px' }}>
            {formatRelativeTime(change.timestamp)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '4px 8px',
            background: change.type === 'create' ? '#4CAF50' :
              change.type === 'delete' ? '#f44336' :
                change.type === 'install' ? '#2196F3' :
                  change.type === 'uninstall' ? '#FF9800' :
                    '#607D8B',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#fff'
          }}>
            {getChangeTypeLabel(change.type)}
          </span>
          <span style={{
            padding: '4px 8px',
            background: '#333',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#888'
          }}>
            {getItemTypeLabel(change.itemType)}
          </span>
        </div>

        {change.metadata?.reason && (
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '12px' }}>
            {change.metadata.reason}
          </p>
        )}
      </div>
    </div>
  )
}

function SnapshotCard({
  snapshot,
  isSelected,
  onSelect,
  onRestore,
  onCompare,
  snapshots
}: {
  snapshot: VersionSnapshot
  isSelected: boolean
  onSelect: () => void
  onRestore: () => void
  onCompare: (other: VersionSnapshot) => void
  snapshots: VersionSnapshot[]
}) {
  const [showCompare, setShowCompare] = useState(false)

  const stats = {
    skills: snapshot.skills.length,
    plugins: snapshot.plugins.length,
    connectors: snapshot.connectors.length,
    knowledge: snapshot.knowledge.length
  }

  return (
    <div style={{
      background: isSelected ? '#2a2a3e' : '#1a1a2e',
      borderRadius: '8px',
      padding: '16px',
      border: `1px solid ${isSelected ? '#4CAF50' : '#333'}`,
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onClick={onSelect}
    onMouseEnter={(e) => {
      if (!isSelected) e.currentTarget.style.borderColor = '#4CAF50'
    }}
    onMouseLeave={(e) => {
      if (!isSelected) e.currentTarget.style.borderColor = '#333'
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📸</span>
          <div>
            <p style={{ margin: 0, color: '#fff', fontWeight: 'bold' }}>
              Snapshot
            </p>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
              {formatTimestamp(snapshot.timestamp)}
            </p>
          </div>
        </div>
        <span style={{ color: '#666', fontSize: '11px' }}>
          {formatRelativeTime(snapshot.timestamp)}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <StatBadge label="قدرات" value={stats.skills} icon="📋" />
        <StatBadge label="أدوات" value={stats.plugins} icon="🔌" />
        <StatBadge label="اتصالات" value={stats.connectors} icon="🔗" />
        <StatBadge label="معرفة" value={stats.knowledge} icon="📚" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRestore()
          }}
          style={{
            flex: 1,
            padding: '8px',
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
          onClick={(e) => {
            e.stopPropagation()
            setShowCompare(!showCompare)
          }}
          style={{
            flex: 1,
            padding: '8px',
            background: '#333',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🔍 مقارنة
        </button>
      </div>

      {/* Compare Dropdown */}
      {showCompare && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#0d1117',
          borderRadius: '6px',
          border: '1px solid #333'
        }}>
          <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>
            قارن مع:
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {snapshots
              .filter((s) => s.id !== snapshot.id)
              .slice(0, 5)
              .map((other) => (
                <button
                  key={other.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCompare(other)
                    setShowCompare(false)
                  }}
                  style={{
                    padding: '8px',
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textAlign: 'left'
                  }}
                >
                  📅 {formatTimestamp(other.timestamp)}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBadge({ label, value, icon }: { label: string; value: number; icon: string }) {
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

function DiffItem({ diff }: { diff: VersionDiff }) {
  const isCreate = diff.type === 'create'
  const isDelete = diff.type === 'delete'

  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: '8px',
      padding: '12px',
      border: `1px solid ${isCreate ? '#4CAF50' : isDelete ? '#f44336' : '#FF9800'}`,
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateX(4px)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateX(0)'
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>{getChangeTypeIcon(diff.type)}</span>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
          {diff.itemName}
        </span>
        <span style={{
          padding: '2px 8px',
          background: isCreate ? '#4CAF50' : isDelete ? '#f44336' : '#FF9800',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#fff'
        }}>
          {getChangeTypeLabel(diff.type)}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isCreate || isDelete ? '1fr' : '1fr 1fr',
        gap: '8px',
        fontSize: '12px'
      }}>
        {!isCreate && (
          <div style={{
            padding: '8px',
            background: '#0d1117',
            borderRadius: '4px',
            border: '1px solid #333'
          }}>
            <p style={{ margin: '0 0 4px', color: '#888', fontSize: '10px' }}>الحالة القديمة:</p>
            <pre style={{ margin: 0, color: '#f44336', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
              {JSON.stringify(diff.oldState, null, 2)?.slice(0, 200)}
            </pre>
          </div>
        )}
        {!isDelete && (
          <div style={{
            padding: '8px',
            background: '#0d1117',
            borderRadius: '4px',
            border: '1px solid #333'
          }}>
            <p style={{ margin: '0 0 4px', color: '#888', fontSize: '10px' }}>الحالة الجديدة:</p>
            <pre style={{ margin: 0, color: '#4CAF50', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
              {JSON.stringify(diff.newState, null, 2)?.slice(0, 200)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
