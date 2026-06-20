export type ChangeType = 'create' | 'update' | 'delete' | 'install' | 'uninstall' | 'toggle' | 'reorder' | 'use' | 'complete'
export type ItemType = 'skill' | 'plugin' | 'connector' | 'knowledge' | 'instructions' | 'level' | 'game'

export interface UsageRecord {
  id: string
  timestamp: number
  action: string
  itemType: ItemType
  itemId: string
  itemName: string
  duration: number | null
  success: boolean
  error: string | null
}

export interface DailyStats {
  date: string
  totalActions: number
  successfulActions: number
  failedActions: number
  byType: Record<ChangeType, number>
  byItemType: Record<ItemType, number>
  peakHour: number
  avgDuration: number
}

export interface WeeklyStats {
  weekStart: string
  weekEnd: string
  totalActions: number
  dailyBreakdown: DailyStats[]
  topItems: { name: string; count: number }[]
  topTypes: { type: ChangeType; count: number }[]
}

export interface MonthlyStats {
  month: string
  year: number
  totalActions: number
  weeklyBreakdown: WeeklyStats[]
  growth: number
  mostActiveDay: string
  mostActiveHour: number
}

export interface AnalyticsState {
  usageRecords: UsageRecord[]
  dailyStats: DailyStats[]
  weeklyStats: WeeklyStats[]
  monthlyStats: MonthlyStats[]
  maxRecords: number

  recordUsage: (action: string, itemType: ItemType, itemId: string, itemName: string, success: boolean, duration?: number, error?: string) => void
  getDailyStats: (date?: string) => DailyStats | undefined
  getWeeklyStats: (weekStart?: string) => WeeklyStats | undefined
  getMonthlyStats: (month?: string, year?: number) => MonthlyStats | undefined

  getUsageByItem: (itemType: ItemType, itemId: string) => UsageRecord[]
  getUsageByAction: (action: string) => UsageRecord[]
  getUsageByDateRange: (from: number, to: number) => UsageRecord[]

  getTopItems: (limit?: number) => { name: string; count: number }[]
  getTopTypes: (limit?: number) => { type: ChangeType; count: number }[]
  getSuccessRate: () => number
  getAverageDuration: () => number

  getHourlyDistribution: () => { hour: number; count: number }[]
  getDailyDistribution: () => { day: string; count: number }[]

  clearAnalytics: () => void
  exportAnalytics: () => string
  importAnalytics: (json: string) => boolean
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] || ''
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  d.setDate(diff)
  return formatDate(d)
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const DEFAULT_ANALYTICS_STATE: Omit<AnalyticsState, 'recordUsage' | 'getDailyStats' | 'getWeeklyStats' | 'getMonthlyStats' | 'getUsageByItem' | 'getUsageByAction' | 'getUsageByDateRange' | 'getTopItems' | 'getTopTypes' | 'getSuccessRate' | 'getAverageDuration' | 'getHourlyDistribution' | 'getDailyDistribution' | 'clearAnalytics' | 'exportAnalytics' | 'importAnalytics'> = {
  usageRecords: [],
  dailyStats: [],
  weeklyStats: [],
  monthlyStats: [],
  maxRecords: 10000
}

export function createEmptyDailyStats(date: string): DailyStats {
  return {
    date,
    totalActions: 0,
    successfulActions: 0,
    failedActions: 0,
    byType: { create: 0, update: 0, delete: 0, install: 0, uninstall: 0, toggle: 0, reorder: 0, use: 0, complete: 0 },
    byItemType: { skill: 0, plugin: 0, connector: 0, knowledge: 0, instructions: 0, level: 0, game: 0 },
    peakHour: 0,
    avgDuration: 0
  }
}

export function createEmptyWeeklyStats(weekStart: string): WeeklyStats {
  const weekEndDate = new Date(weekStart)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  return {
    weekStart,
    weekEnd: formatDate(weekEndDate),
    totalActions: 0,
    dailyBreakdown: [],
    topItems: [],
    topTypes: []
  }
}

export function createEmptyMonthlyStats(month: string, year: number): MonthlyStats {
  return {
    month,
    year,
    totalActions: 0,
    weeklyBreakdown: [],
    growth: 0,
    mostActiveDay: '',
    mostActiveHour: 0
  }
}
