export type ReportType = 'usage' | 'progress' | 'skills' | 'performance' | 'security' | 'custom'
export type ReportFormat = 'table' | 'chart' | 'summary'
export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'

export interface ReportConfig {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  period: ReportPeriod
  startDate: string
  endDate: string
  metrics: string[]
  groupBy: 'none' | 'day' | 'week' | 'month' | 'type' | 'category'
  filters: ReportFilter[]
  createdAt: number
  updatedAt: number
}

export interface ReportFilter {
  field: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number
  value2?: string | number
}

export interface ReportResult {
  configId: string
  generatedAt: number
  data: ReportDataPoint[]
  summary: ReportSummary
  metadata: {
    totalRecords: number
    dateRange: { start: string; end: string }
    filters: ReportFilter[]
  }
}

export interface ReportDataPoint {
  label: string
  value: number
  category?: string
  date?: string
  breakdown?: Record<string, number>
}

export interface ReportSummary {
  totalRecords: number
  average: number
  min: number
  max: number
  trend: 'up' | 'down' | 'stable'
  changePercent: number
}

export interface ReportsState {
  configs: ReportConfig[]
  results: ReportResult[]
  activeReportId: string | null

  createConfig: (config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateConfig: (id: string, updates: Partial<ReportConfig>) => void
  deleteConfig: (id: string) => void
  generateReport: (configId: string) => ReportResult
  setActiveReport: (id: string | null) => void
  getReportById: (id: string) => ReportConfig | undefined
  getResultById: (configId: string) => ReportResult | undefined
}

export const REPORT_TYPES: { id: ReportType; label: string; icon: string; description: string }[] = [
  { id: 'usage', label: 'الاستخدام', icon: '📊', description: 'تقرير عن أنماط الاستخدام' },
  { id: 'progress', label: 'التقدم', icon: '📈', description: 'تقرير عن التقدم والإنجازات' },
  { id: 'skills', label: 'المهارات', icon: '🧠', description: 'تقرير عن المهارات المكتسبة' },
  { id: 'performance', label: 'الأداء', icon: '⚡', description: 'تقرير عن الأداء والنتائج' },
  { id: 'security', label: 'الأمان', icon: '🔒', description: 'تقرير عن أنشطة الأمان' },
  { id: 'custom', label: 'مخصص', icon: '🛠️', description: 'تقرير مخصص بالمعايير الخاصة' },
]

export const REPORT_METRICS: Record<ReportType, string[]> = {
  usage: ['totalSessions', 'totalTime', 'avgSessionTime', 'activeDays', 'featuresUsed'],
  progress: ['levelsCompleted', 'totalScore', 'xpEarned', 'badgesUnlocked', 'streakDays'],
  skills: ['skillsInstalled', 'pluginsInstalled', 'connectorsActive', 'marketplaceItems'],
  performance: ['quizScores', 'challengeCompletion', 'accuracyRate', 'responseTime'],
  security: ['encryptionOperations', 'hashOperations', 'activityLogs', 'securityEvents'],
  custom: ['customMetric1', 'customMetric2', 'customMetric3'],
}

export const PERIOD_LABELS: Record<ReportPeriod, string> = {
  day: 'اليوم',
  week: 'الأسبوع',
  month: 'الشهر',
  quarter: 'الربع',
  year: 'السنة',
  all: 'الكل',
}

export function generateReportId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

export function calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable'
  const recent = data.slice(-5)
  const older = data.slice(0, -5)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg
  const diff = recentAvg - olderAvg
  if (Math.abs(diff) < 0.05) return 'stable'
  return diff > 0 ? 'up' : 'down'
}

export function formatReportDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
