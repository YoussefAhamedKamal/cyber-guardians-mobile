import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type {
  AnalyticsState,
  UsageRecord,
  ChangeType,
  ItemType
} from '@/types/analytics'

type AnalyticsStore = AnalyticsState

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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

export function computeDailyStats(records: UsageRecord[]): AnalyticsState['dailyStats'] {
  const statsMap: Record<string, AnalyticsState['dailyStats'][0] & { _hourCounts: number[]; _durations: number[] }> = {}
  records.forEach(r => {
    const date = formatDate(new Date(r.timestamp))
    if (!statsMap[date]) {
      statsMap[date] = {
        date,
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        byType: { create: 0, update: 0, delete: 0, install: 0, uninstall: 0, toggle: 0, reorder: 0, use: 0, complete: 0 },
        byItemType: { skill: 0, plugin: 0, connector: 0, knowledge: 0, instructions: 0, level: 0, game: 0 },
        peakHour: 0,
        avgDuration: 0,
        _hourCounts: new Array(24).fill(0),
        _durations: []
      }
    }
    const s = statsMap[date]!
    s.totalActions++
    if (r.success) s.successfulActions++; else s.failedActions++
    const hour = new Date(r.timestamp).getHours()
    s._hourCounts[hour] = (s._hourCounts[hour] || 0) + 1
    s.byType[r.action as keyof typeof s.byType] = (s.byType[r.action as keyof typeof s.byType] || 0) + 1
    s.byItemType[r.itemType as keyof typeof s.byItemType] = (s.byItemType[r.itemType as keyof typeof s.byItemType] || 0) + 1
    if (r.duration) s._durations.push(r.duration)
  })
  return Object.values(statsMap).map(s => {
    const peakHour = s._hourCounts.indexOf(Math.max(...s._hourCounts))
    const avgDuration = s._durations.length > 0 ? Math.round(s._durations.reduce((a, b) => a + b, 0) / s._durations.length) : 0
    const { _hourCounts: _, _durations: __, ...clean } = s
    return { ...clean, peakHour: peakHour >= 0 ? peakHour : 0, avgDuration }
  }).slice(0, 30)
}

export function computeWeeklyStats(records: UsageRecord[]): AnalyticsState['weeklyStats'] {
  const statsMap: Record<string, AnalyticsState['weeklyStats'][0] & { _records: UsageRecord[] }> = {}
  records.forEach(r => {
    const date = new Date(r.timestamp)
    const weekStart = getWeekStart(date)
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 6)
    const weekEnd = formatDate(d)
    if (!statsMap[weekStart]) {
      statsMap[weekStart] = {
        weekStart,
        weekEnd,
        totalActions: 0,
        dailyBreakdown: [],
        topItems: [],
        topTypes: [],
        _records: []
      }
    }
    const w = statsMap[weekStart]!
    w.totalActions++
    w._records.push(r)
  })
  return Object.values(statsMap).map(w => {
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const dailyBreakdown: AnalyticsState['dailyStats'][0][] = dayNames.map((day, i) => ({
      date: day,
      totalActions: w._records.filter(r => new Date(r.timestamp).getDay() === i).length,
      successfulActions: w._records.filter(r => new Date(r.timestamp).getDay() === i && r.success).length,
      failedActions: w._records.filter(r => new Date(r.timestamp).getDay() === i && !r.success).length,
      byType: { create: 0, update: 0, delete: 0, install: 0, uninstall: 0, toggle: 0, reorder: 0, use: 0, complete: 0 },
      byItemType: { skill: 0, plugin: 0, connector: 0, knowledge: 0, instructions: 0, level: 0, game: 0 },
      peakHour: 0,
      avgDuration: 0
    }))
    const itemCounts: Record<string, { name: string; count: number }> = {}
    w._records.forEach(r => {
      const key = `${r.itemType}-${r.itemId}`
      if (!itemCounts[key]) itemCounts[key] = { name: r.itemName, count: 0 }
      itemCounts[key].count++
    })
    const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5)
    const typeCounts: Record<string, { type: ChangeType; count: number }> = {}
    w._records.forEach(r => {
      if (!typeCounts[r.action]) typeCounts[r.action] = { type: r.action as ChangeType, count: 0 }
      const tc = typeCounts[r.action]
      if (tc) tc.count++
    })
    const topTypes = Object.values(typeCounts).sort((a, b) => b.count - a.count).slice(0, 5)
    const { _records: _, ...clean } = w
    return { ...clean, dailyBreakdown, topItems, topTypes }
  }).slice(0, 12)
}

export function computeMonthlyStats(records: UsageRecord[]): AnalyticsState['monthlyStats'] {
  const statsMap: Record<string, AnalyticsState['monthlyStats'][0] & { _records: UsageRecord[] }> = {}
  records.forEach(r => {
    const date = new Date(r.timestamp)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const key = `${year}-${month}`
    if (!statsMap[key]) {
      statsMap[key] = {
        month,
        year,
        totalActions: 0,
        weeklyBreakdown: [],
        growth: 0,
        mostActiveDay: '',
        mostActiveHour: 0,
        _records: []
      }
    }
    const m = statsMap[key]!
    m.totalActions++
    m._records.push(r)
  })
  const sortedKeys = Object.keys(statsMap).sort()
  return Object.values(statsMap).map((m, idx) => {
    // Growth: compare with previous month
    const prevKey = sortedKeys[idx - 1]
    const prevTotal = prevKey ? statsMap[prevKey]?.totalActions || 0 : 0
    const growth = prevTotal > 0 ? Math.round(((m.totalActions - prevTotal) / prevTotal) * 100) : 0

    // Most active day
    const dayCounts: Record<string, number> = {}
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    m._records.forEach(r => {
      const dayIdx = new Date(r.timestamp).getDay()
      const day = dayNames[dayIdx] || 'غير معروف'
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    // Most active hour
    const hourCounts: number[] = new Array(24).fill(0)
    m._records.forEach(r => {
      const h = new Date(r.timestamp).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
    })
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))

    // Weekly breakdown
    const weeklyBreakdown = computeWeeklyStats(m._records)

    const { _records: _, ...clean } = m
    return { ...clean, growth, mostActiveDay, mostActiveHour: mostActiveHour >= 0 ? mostActiveHour : 0, weeklyBreakdown }
  }).slice(0, 12)
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      usageRecords: [],
      dailyStats: [],
      weeklyStats: [],
      monthlyStats: [],
      maxRecords: 10000,

      recordUsage: (action, itemType, itemId, itemName, success, duration, error) => {
        const record: UsageRecord = {
          id: generateId(),
          timestamp: Date.now(),
          action,
          itemType,
          itemId,
          itemName,
          duration: duration || null,
          success,
          error: error || null
        }

        set((state) => {
          const records = [record, ...state.usageRecords].slice(0, state.maxRecords)
          // Auto-aggregate stats
          const allRecords = records
          const dailyStats = computeDailyStats(allRecords)
          const weeklyStats = computeWeeklyStats(allRecords)
          const monthlyStats = computeMonthlyStats(allRecords)
          return { usageRecords: records, dailyStats, weeklyStats, monthlyStats }
        })
      },

      getDailyStats: (date) => {
        const targetDate = date || formatDate(new Date())
        return get().dailyStats.find((d) => d.date === targetDate)
      },

      getWeeklyStats: (weekStart) => {
        const targetWeek = weekStart || getWeekStart(new Date())
        return get().weeklyStats.find((w) => w.weekStart === targetWeek)
      },

      getMonthlyStats: (month, year) => {
        const now = new Date()
        const targetMonth = month || String(now.getMonth() + 1).padStart(2, '0')
        const targetYear = year || now.getFullYear()
        return get().monthlyStats.find((m) => m.month === targetMonth && m.year === targetYear)
      },

      getUsageByItem: (itemType, itemId) => {
        return get().usageRecords.filter(
          (r) => r.itemType === itemType && r.itemId === itemId
        )
      },

      getUsageByAction: (action) => {
        return get().usageRecords.filter((r) => r.action === action)
      },

      getUsageByDateRange: (from, to) => {
        return get().usageRecords.filter(
          (r) => r.timestamp >= from && r.timestamp <= to
        )
      },

      getTopItems: (limit = 10) => {
        const records = get().usageRecords
        const itemCounts: Record<string, { name: string; count: number }> = {}

        records.forEach((r) => {
          const key = `${r.itemType}-${r.itemId}`
          if (!itemCounts[key]) {
            itemCounts[key] = { name: r.itemName, count: 0 }
          }
          itemCounts[key].count++
        })

        return Object.values(itemCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
      },

      getTopTypes: (limit = 10) => {
        const records = get().usageRecords
        const typeCounts: Record<string, { type: ChangeType; count: number }> = {}

        records.forEach((r) => {
          if (!typeCounts[r.action]) {
            typeCounts[r.action] = { type: r.action as ChangeType, count: 0 }
          }
          const item = typeCounts[r.action]
          if (item) item.count++
        })

        return Object.values(typeCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
      },

      getSuccessRate: () => {
        const records = get().usageRecords
        if (records.length === 0) return 100
        const successful = records.filter((r) => r.success).length
        return (successful / records.length) * 100
      },

      getAverageDuration: () => {
        const records = get().usageRecords
        const durations = records.filter((r) => r.duration).map((r) => r.duration || 0)
        if (durations.length === 0) return 0
        return durations.reduce((a, b) => a + b, 0) / durations.length
      },

      getHourlyDistribution: () => {
        const records = get().usageRecords
        const hourlyCounts: { hour: number; count: number }[] = []

        for (let i = 0; i < 24; i++) {
          const count = records.filter((r) => new Date(r.timestamp).getHours() === i).length
          hourlyCounts.push({ hour: i, count })
        }

        return hourlyCounts
      },

      getDailyDistribution: () => {
        const records = get().usageRecords
        const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
        const dailyCounts: { day: string; count: number }[] = []

        dayNames.forEach((day, index) => {
          const count = records.filter((r) => new Date(r.timestamp).getDay() === index).length
          dailyCounts.push({ day, count })
        })

        return dailyCounts
      },

      clearAnalytics: () => set({
        usageRecords: [],
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: []
      }),

      exportAnalytics: () => {
        const state = get()
        return JSON.stringify({
          usageRecords: state.usageRecords.slice(0, 1000)
        }, null, 2)
      },

      importAnalytics: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.usageRecords && Array.isArray(data.usageRecords)) {
            const allRecords = data.usageRecords
            const dailyStats = computeDailyStats(allRecords)
            const weeklyStats = computeWeeklyStats(allRecords)
            const monthlyStats = computeMonthlyStats(allRecords)
            set({ usageRecords: allRecords, dailyStats, weeklyStats, monthlyStats })
          }
          return true
        } catch {
          return false
        }
      }
    }),
    {
      name: 'cyber-guardians-analytics',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
)
