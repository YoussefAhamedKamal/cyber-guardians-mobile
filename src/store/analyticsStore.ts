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
          return { usageRecords: records }
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
            set({ usageRecords: data.usageRecords })
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
