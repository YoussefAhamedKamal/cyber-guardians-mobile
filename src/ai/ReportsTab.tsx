import { useState } from 'react'
import { useReportsStore } from '@/store/reportsStore'
import { REPORT_TYPES, REPORT_METRICS, PERIOD_LABELS, type ReportType, type ReportFormat, type ReportPeriod } from '@/types/reports'

export function ReportsTab() {
  const store = useReportsStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<ReportType>('usage')
  const [format, setFormat] = useState<ReportFormat>('table')
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [viewingReport, setViewingReport] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]!
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(today)

  function resetForm() {
    setName('')
    setType('usage')
    setFormat('table')
    setPeriod('month')
    setSelectedMetrics([])
    setStartDate(defaultStart)
    setEndDate(today)
  }

  function handleSubmit() {
    if (!name.trim()) return
    store.createConfig({
      name: name.trim(),
      type,
      format,
      period,
      startDate,
      endDate,
      metrics: selectedMetrics,
      groupBy: 'none',
      filters: [],
    })
    resetForm()
    setShowForm(false)
  }

  function handleGenerate(configId: string) {
    try {
      const result = store.generateReport(configId)
      setViewingReport(configId)
    } catch (err: any) {
      alert(`Error generating report: ${err.message}`)
    }
  }

  function toggleMetric(metric: string) {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    )
  }

  const result = viewingReport ? store.getResultById(viewingReport) : null
  const viewingConfig = viewingReport ? store.getReportById(viewingReport) : null

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '20px' }}>📋 التقارير المخصصة</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: showForm ? '#666' : 'linear-gradient(135deg, #AB47BC, #7E57C2)',
            color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
          }}
        >
          {showForm ? '✕ إغلاق' : '+ تقرير جديد'}
        </button>
      </div>

      {/* Report Form */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px',
          marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '16px' }}>➕ تقرير جديد</h3>
          <input
            placeholder="اسم التقرير"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />

          {/* Report Type */}
          <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>نوع التقرير</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.id}
                onClick={() => { setType(rt.id); setSelectedMetrics(REPORT_METRICS[rt.id] || []) }}
                style={{
                  padding: '10px 6px', borderRadius: '8px', border: `1px solid ${type === rt.id ? '#AB47BC' : 'rgba(255,255,255,0.1)'}`,
                  background: type === rt.id ? 'rgba(171,71,188,0.2)' : 'rgba(0,0,0,0.2)',
                  color: type === rt.id ? '#CE93D8' : '#888', cursor: 'pointer',
                  fontSize: '12px', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '20px' }}>{rt.icon}</div>
                <div>{rt.label}</div>
              </button>
            ))}
          </div>

          {/* Period & Format */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>الفترة</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
              >
                {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>التنسيق</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ReportFormat)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="table">جدول</option>
                <option value="chart">رسم بياني</option>
                <option value="summary">ملخص</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>من تاريخ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>إلى تاريخ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Metrics */}
          <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>المؤشرات</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {(REPORT_METRICS[type] || []).map((metric) => (
              <button
                key={metric}
                onClick={() => toggleMetric(metric)}
                style={{
                  padding: '4px 10px', borderRadius: '12px', border: `1px solid ${selectedMetrics.includes(metric) ? '#4FC3F7' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedMetrics.includes(metric) ? 'rgba(79,195,247,0.2)' : 'transparent',
                  color: selectedMetrics.includes(metric) ? '#4FC3F7' : '#888',
                  cursor: 'pointer', fontSize: '11px',
                }}
              >
                {metric}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
              background: name.trim() ? 'linear-gradient(135deg, #AB47BC, #7E57C2)' : '#444',
              color: '#fff', cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px', fontWeight: 'bold',
            }}
          >
            ✅ إنشاء التقرير
          </button>
        </div>
      )}

      {/* View Report */}
      {viewingReport && result && viewingConfig && (
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px',
          marginBottom: '16px', border: '1px solid rgba(171,71,188,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#CE93D8', fontSize: '16px' }}>
              {REPORT_TYPES.find(t => t.id === viewingConfig.type)?.icon} {viewingConfig.name}
            </h3>
            <button
              onClick={() => setViewingReport(null)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px' }}
            >✕</button>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'المتوسط', value: result.summary.average, color: '#4FC3F7' },
              { label: 'الحد الأدنى', value: result.summary.min, color: '#66BB6A' },
              { label: 'الحد الأقصى', value: result.summary.max, color: '#FFA726' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Trend */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
            padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
          }}>
            <span style={{ fontSize: '13px', color: '#888' }}>الاتجاه:</span>
            <span style={{
              fontSize: '13px', fontWeight: 'bold',
              color: result.summary.trend === 'up' ? '#66BB6A' : result.summary.trend === 'down' ? '#EF5350' : '#FFA726',
            }}>
              {result.summary.trend === 'up' ? '↑ صاعد' : result.summary.trend === 'down' ? '↓ هابط' : '→ مستقر'}
            </span>
            <span style={{ fontSize: '12px', color: '#888' }}>
              ({result.summary.changePercent > 0 ? '+' : ''}{result.summary.changePercent}%)
            </span>
          </div>

          {/* Data Table */}
          {viewingConfig.format === 'table' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '8px', textAlign: 'right', color: '#888' }}>المقياس</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: '#888' }}>القيمة</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: '#888' }}>الفئة</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px', color: '#ccc' }}>{d.label}</td>
                      <td style={{ padding: '8px', color: '#4FC3F7', fontWeight: 'bold' }}>{d.value}</td>
                      <td style={{ padding: '8px', color: '#888', fontSize: '11px' }}>{d.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Chart View */}
          {viewingConfig.format === 'chart' && (() => {
            const maxVal = result.data.reduce((max, d) => Math.max(max, d.value), 0)
            return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', padding: '0 8px' }}>
              {result.data.map((d, i) => {
                const height = (Math.max(0, d.value) / Math.max(maxVal, 1)) * 100
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#4FC3F7' }}>{d.value}</span>
                    <div style={{
                      width: '100%', height: `${height}%`, minHeight: '4px',
                      background: 'linear-gradient(to top, #4FC3F7, #CE93D8)',
                      borderRadius: '4px 4px 0 0',
                    }} />
                    <span style={{ fontSize: '9px', color: '#888', textAlign: 'center', lineHeight: '1.2' }}>
                      {d.label.length > 8 ? d.label.substring(0, 8) + '...' : d.label}
                    </span>
                  </div>
                )
              })}
            </div>
            )
          })()}

          {/* Summary View */}
          {viewingConfig.format === 'summary' && (
            <div style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.8' }}>
              <p><strong>التقرير:</strong> {viewingConfig.name}</p>
              <p><strong>الفترة:</strong> {viewingConfig.startDate} إلى {viewingConfig.endDate}</p>
              <p><strong>إجمالي المؤشرات:</strong> {result.summary.totalRecords}</p>
              <p><strong>المتوسط:</strong> {result.summary.average}</p>
              <p><strong>الاتجاه:</strong> {result.summary.trend === 'up' ? 'صاعد' : result.summary.trend === 'down' ? 'هابط' : 'مستقر'}</p>
              <div style={{ marginTop: '8px' }}>
                {result.data.map((d, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#888' }}>{d.label}:</span>{' '}
                    <span style={{ color: '#4FC3F7', fontWeight: 'bold' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '12px', fontSize: '11px', color: '#666' }}>
            تم الإنشاء: {new Date(result.generatedAt).toLocaleString('ar-EG')}
          </div>
        </div>
      )}

      {/* Saved Reports */}
      <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>📁 التقارير المحفوظة</h3>
      {store.configs.length === 0 ? (
        <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
          لا توجد تقارير محفوظة
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {store.configs.map((config) => {
            const rt = REPORT_TYPES.find(t => t.id === config.type)
            return (
              <div
                key={config.id}
                style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px',
                  borderLeft: `4px solid ${viewingReport === config.id ? '#AB47BC' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{rt?.icon}</span>
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{config.name}</span>
                    </div>
                    <div style={{ color: '#888', fontSize: '11px' }}>
                      {rt?.label} | {PERIOD_LABELS[config.period]} | {config.startDate} → {config.endDate}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleGenerate(config.id)}
                      style={{ background: '#AB47BC', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >▶ تشغيل</button>
                    <button
                      onClick={() => store.deleteConfig(config.id)}
                      style={{ background: '#EF5350', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >🗑</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
