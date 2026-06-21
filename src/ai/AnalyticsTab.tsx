import { useState, useMemo } from 'react'
import { useAnalyticsStore } from '@/store/analyticsStore'
import type { DailyStats, ItemType, ChangeType } from '@/types/analytics'

function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type AnalyticsView = 'overview' | 'daily' | 'weekly' | 'monthly' | 'items'

export function AnalyticsTab() {
  const [view, setView] = useState<AnalyticsView>('overview')
  const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date()))
  const [selectedItemType, setSelectedItemType] = useState<ItemType | 'all'>('all')

  const {
    usageRecords,
    dailyStats,
    weeklyStats,
    monthlyStats,
    getTopItems,
    getTopTypes,
    getSuccessRate,
    getAverageDuration,
    getHourlyDistribution,
    getDailyDistribution,
    clearAnalytics,
    exportAnalytics
  } = useAnalyticsStore()

  const filteredTopItems = useMemo(() => {
    const all = getTopItems(50)
    if (selectedItemType === 'all') return all.slice(0, 10)
    return all.filter(item => {
      const key = item.name
      return true // getTopItems returns all, we filter by checking usageRecords
    }).slice(0, 10)
  }, [usageRecords, selectedItemType])
  const topItems = useMemo(() => {
    if (selectedItemType === 'all') return getTopItems(10)
    return usageRecords
      .filter(r => r.itemType === selectedItemType)
      .reduce<{ name: string; count: number }[]>((acc, r) => {
        const existing = acc.find(a => a.name === r.itemName)
        if (existing) existing.count++
        else acc.push({ name: r.itemName, count: 1 })
        return acc
      }, [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [usageRecords, selectedItemType])
  const topTypes = useMemo(() => getTopTypes(10), [usageRecords])
  const successRate = useMemo(() => getSuccessRate(), [usageRecords])
  const avgDuration = useMemo(() => getAverageDuration(), [usageRecords])
  const hourlyDist = useMemo(() => getHourlyDistribution(), [usageRecords])
  const dailyDist = useMemo(() => getDailyDistribution(), [usageRecords])

  const todayStats = dailyStats.find((d) => d.date === selectedDate)

  const handleExport = () => {
    const json = exportAnalytics()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${formatDateLocal(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
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
            📊 Analytics Dashboard
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExport}
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
              📥 Export
            </button>
            {usageRecords.length > 0 && (
              <button
                onClick={clearAnalytics}
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
            { id: 'overview' as const, label: '📊 نظرة عامة' },
            { id: 'daily' as const, label: '📅 يومي' },
            { id: 'weekly' as const, label: '📆 أسبوعي' },
            { id: 'monthly' as const, label: '🗓️ شهري' },
            { id: 'items' as const, label: '🏆 أعلى' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                flex: 1,
                padding: '10px 6px',
                background: view === tab.id ? '#2a2a3e' : '#1a1a2e',
                border: `1px solid ${view === tab.id ? '#4CAF50' : '#333'}`,
                borderRadius: '6px',
                color: view === tab.id ? '#4CAF50' : '#888',
                cursor: 'pointer',
                fontSize: '11px',
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
        {/* Overview */}
        {view === 'overview' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <StatCard
                label="إجمالي الإجراءات"
                value={usageRecords.length}
                icon="📊"
                color="#4CAF50"
              />
              <StatCard
                label="معدل النجاح"
                value={`${successRate.toFixed(1)}%`}
                icon="✅"
                color="#2196F3"
              />
              <StatCard
                label="متوسط المدة"
                value={`${avgDuration.toFixed(0)}ms`}
                icon="⏱️"
                color="#FF9800"
              />
              <StatCard
                label="اليوم"
                value={dailyStats.find((d) => d.date === formatDateLocal(new Date()))?.totalActions || 0}
                icon="📅"
                color="#9C27B0"
              />
            </div>

            {/* Hourly Distribution */}
            <div style={{
              background: '#1a1a2e',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
                ⏰ التوزيع بالساعة
              </h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '80px' }}>
                {hourlyDist.map(({ hour, count }) => {
                  const maxCount = Math.max(...hourlyDist.map((d) => d.count), 1)
                  const height = (count / maxCount) * 100
                  return (
                    <div
                      key={hour}
                      style={{
                        flex: 1,
                        height: `${Math.max(height, 4)}%`,
                        background: count > 0 ? '#4CAF50' : '#333',
                        borderRadius: '2px',
                        transition: 'all 0.2s'
                      }}
                      title={`${hour}:00 - ${count} إجراء`}
                    />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#666', fontSize: '10px' }}>0:00</span>
                <span style={{ color: '#666', fontSize: '10px' }}>12:00</span>
                <span style={{ color: '#666', fontSize: '10px' }}>23:00</span>
              </div>
            </div>

            {/* Daily Distribution */}
            <div style={{
              background: '#1a1a2e',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
                📅 التوزيع بالأيام
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                {dailyDist.map(({ day, count }) => {
                  const maxCount = Math.max(...dailyDist.map((d) => d.count), 1)
                  const height = (count / maxCount) * 100
                  return (
                    <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        height: '60px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center'
                      }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.max(height, 4)}%`,
                            background: count > 0 ? '#2196F3' : '#333',
                            borderRadius: '2px',
                            transition: 'all 0.2s'
                          }}
                        />
                      </div>
                      <p style={{ margin: '4px 0 0', color: '#888', fontSize: '10px' }}>
                        {day}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Types */}
            <div style={{
              background: '#1a1a2e',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
                🏆 أعلى الأنواع
              </h4>
              {topTypes.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center' }}>لا توجد بيانات</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {topTypes.slice(0, 5).map(({ type, count }) => (
                    <div key={type} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      background: '#0d1117',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '16px' }}>{getTypeIcon(type)}</span>
                      <span style={{ flex: 1, color: '#fff', fontSize: '13px' }}>{getTypeLabel(type)}</span>
                      <span style={{ color: '#4CAF50', fontSize: '13px', fontWeight: 'bold' }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily View */}
        {view === 'daily' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '12px',
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px'
              }}
            />

            {todayStats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <StatCard label="إجمالي" value={todayStats.totalActions} icon="📊" color="#4CAF50" />
                  <StatCard label="نجاح" value={todayStats.successfulActions} icon="✅" color="#2196F3" />
                  <StatCard label="فشل" value={todayStats.failedActions} icon="❌" color="#f44336" />
                  <StatCard label="متوسط المدة" value={`${todayStats.avgDuration.toFixed(0)}ms`} icon="⏱️" color="#FF9800" />
                </div>

                {/* By Type */}
                <div style={{
                  background: '#1a1a2e',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ margin: '0 0 12px', color: '#fff' }}> حسب النوع</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {Object.entries(todayStats.byType).filter(([_, count]) => count > 0).map(([type, count]) => (
                      <div key={type} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        background: '#0d1117',
                        borderRadius: '6px'
                      }}>
                        <span>{getTypeIcon(type as ChangeType)}</span>
                        <span style={{ flex: 1, color: '#fff', fontSize: '13px' }}>{getTypeLabel(type as ChangeType)}</span>
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Item Type */}
                <div style={{
                  background: '#1a1a2e',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ margin: '0 0 12px', color: '#fff' }}> حسب العنصر</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {Object.entries(todayStats.byItemType).filter(([_, count]) => count > 0).map(([type, count]) => (
                      <div key={type} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        background: '#0d1117',
                        borderRadius: '6px'
                      }}>
                        <span>{getItemIcon(type as ItemType)}</span>
                        <span style={{ flex: 1, color: '#fff', fontSize: '13px' }}>{getItemLabel(type as ItemType)}</span>
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                <p>لا توجد بيانات لهذا التاريخ</p>
              </div>
            )}
          </div>
        )}

        {/* Weekly View */}
        {view === 'weekly' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {weeklyStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📆</div>
                <p>لا توجد بيانات أسبوعية</p>
              </div>
            ) : (
              weeklyStats.slice(0, 4).map((week) => (
                <div key={week.weekStart} style={{
                  background: '#1a1a2e',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                      {formatDateLocal(new Date(week.weekStart))} - {formatDateLocal(new Date(week.weekEnd))}
                    </span>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {week.totalActions} إجراء
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Monthly View */}
        {view === 'monthly' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {monthlyStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗓️</div>
                <p>لا توجد بيانات شهرية</p>
              </div>
            ) : (
              monthlyStats.slice(0, 6).map((month) => (
                <div key={`${month.month}-${month.year}`} style={{
                  background: '#1a1a2e',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                      {getMonthName(`${month.year}-${month.month}`)}
                    </span>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {month.totalActions} إجراء
                    </span>
                  </div>
                  {month.growth !== 0 && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: month.growth > 0 ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: month.growth > 0 ? '#4CAF50' : '#f44336'
                    }}>
                      {month.growth > 0 ? '📈' : '📉'} {Math.abs(month.growth).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Items View */}
        {view === 'items' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Filter */}
            <select
              value={selectedItemType}
              onChange={(e) => setSelectedItemType(e.target.value as ItemType | 'all')}
              style={{
                padding: '12px',
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px'
              }}
            >
              <option value="all">الكل</option>
              <option value="skill">قدرات</option>
              <option value="plugin">أدوات</option>
              <option value="connector">اتصالات</option>
              <option value="knowledge">معرفة</option>
              <option value="instructions">تعليمات</option>
            </select>

            {/* Top Items */}
            <div style={{
              background: '#1a1a2e',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #333'
            }}>
              <h4 style={{ margin: '0 0 12px', color: '#fff' }}>🏆 أعلى العناصر استخداماً</h4>
              {topItems.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center' }}>لا توجد بيانات</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {topItems.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: '#0d1117',
                      borderRadius: '6px'
                    }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: index < 3 ? '#4CAF50' : '#333',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ flex: 1, color: '#fff', fontSize: '13px' }}>
                        {item.name}
                      </span>
                      <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: '8px',
      padding: '16px',
      border: `1px solid ${color}33`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ color: '#888', fontSize: '12px' }}>{label}</span>
      </div>
      <p style={{ margin: 0, color, fontSize: '24px', fontWeight: 'bold' }}>
        {value}
      </p>
    </div>
  )
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    create: '✨',
    update: '📝',
    delete: '🗑️',
    install: '📦',
    uninstall: '📤',
    toggle: '🔄',
    reorder: '↕️'
  }
  return icons[type] || '❓'
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    create: 'إنشاء',
    update: 'تحديث',
    delete: 'حذف',
    install: 'تثبيت',
    uninstall: 'إلغاء',
    toggle: 'تفعيل',
    reorder: 'ترتيب'
  }
  return labels[type] || type
}

function getItemIcon(type: string): string {
  const icons: Record<string, string> = {
    skill: '📋',
    plugin: '🔌',
    connector: '🔗',
    knowledge: '📚',
    instructions: '📝'
  }
  return icons[type] || '❓'
}

function getItemLabel(type: string): string {
  const labels: Record<string, string> = {
    skill: 'قدرة',
    plugin: 'أداة',
    connector: 'اتصال',
    knowledge: 'معرفة',
    instructions: 'تعليمات'
  }
  return labels[type] || type
}

// formatDateLocal is defined at the top of the file

function getMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  const monthIndex = parseInt(month || '1') - 1
  return `${monthNames[monthIndex] || ''} ${year || ''}`
}
