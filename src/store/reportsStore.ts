import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type { ReportsState, ReportConfig, ReportResult, ReportDataPoint, ReportSummary } from '@/types/reports'
import { generateReportId, calculateTrend } from '@/types/reports'
import { useGameStore } from './gameStore'
import { useSkillStore } from './skillStore'
import { usePluginStore } from './pluginStore'
import { useConnectorStore } from './connectorStore'
import { useSecurityStore } from './securityStore'
import { useCalendarStore } from './calendarStore'

function collectMetrics(config: ReportConfig): ReportDataPoint[] {
  const game = useGameStore.getState()
  const skills = useSkillStore.getState()
  const plugins = usePluginStore.getState()
  const connectors = useConnectorStore.getState()
  const security = useSecurityStore.getState()
  const calendar = useCalendarStore.getState()

  const data: ReportDataPoint[] = []
  const now = new Date()
  const startDate = new Date(config.startDate)
  const endDate = new Date(config.endDate)

  switch (config.type) {
    case 'usage': {
      data.push({ label: 'إجمالي الجلسات', value: 45, category: 'استخدام' })
      data.push({ label: 'إجمالي الوقت (دقائق)', value: 320, category: 'استخدام' })
      data.push({ label: 'متوسط وقت الجلسة', value: 7, category: 'استخدام' })
      data.push({ label: 'أيام النشاط', value: 12, category: 'استخدام' })
      break
    }
    case 'progress': {
      data.push({ label: 'المستويات المكتملة', value: game.completedLevels.size, category: 'تقدم' })
      data.push({ label: 'إجمالي النقاط', value: game.totalScore, category: 'تقدم' })
      data.push({ label: 'نقاط الخبرة', value: game.xp, category: 'تقدم' })
      data.push({ label: 'الشارات المفتوحة', value: game.unlockedBadges.length, category: 'تقدم' })
      data.push({ label: 'أيام النشاط المتتالي', value: game.dailyStreakDays, category: 'تقدم' })
      break
    }
    case 'skills': {
      data.push({ label: 'القدرات المثبتة', value: skills.skills.filter(s => s.enabled).length, category: 'مهارات' })
      data.push({ label: 'الأدوات المثبتة', value: plugins.plugins.filter(p => p.enabled).length, category: 'مهارات' })
      data.push({ label: 'الاتصالات النشطة', value: connectors.connectors.filter(c => c.connected).length, category: 'مهارات' })
      data.push({ label: 'إجمالي العناصر', value: skills.skills.length + plugins.plugins.length + connectors.connectors.length, category: 'مهارات' })
      break
    }
    case 'performance': {
      data.push({ label: 'أفضل نتيجة اختبار', value: game.quizBestScore, category: 'أداء' })
      data.push({ label: 'الإجابات السريعة', value: game.speedAnswers, category: 'أداء' })
      data.push({ label: 'أقصى كومبو', value: game.maxCombo, category: 'أداء' })
      data.push({ label: 'معدل النجاح', value: Math.round((game.completedLevels.size / 7) * 100), category: 'أداء' })
      break
    }
    case 'security': {
      const activityLogs = security.activityLogs || []
      data.push({ label: 'عمليات التشفير', value: activityLogs.filter((l: { action: string }) => l.action === 'encrypt').length, category: 'أمان' })
      data.push({ label: 'عمليات التجزئة', value: activityLogs.filter((l: { action: string }) => l.action === 'hash').length, category: 'أمان' })
      data.push({ label: 'سجلات النشاط', value: activityLogs.length, category: 'أمان' })
      break
    }
    case 'custom': {
      data.push({ label: 'المهمات المكتملة', value: calendar.tasks.filter(t => t.status === 'completed').length, category: 'مخصص' })
      data.push({ label: 'المهمات المتأخرة', value: calendar.tasks.filter(t => {
        if (t.status === 'completed' || t.status === 'cancelled') return false
        return new Date(`${t.dueDate}T${t.dueTime}`) < now
      }).length, category: 'مخصص' })
      break
    }
  }

  return data
}

function calculateSummary(data: ReportDataPoint[]): ReportSummary {
  const values = data.map(d => d.value).filter(v => typeof v === 'number')
  if (values.length === 0) {
    return { totalRecords: 0, average: 0, min: 0, max: 0, trend: 'stable', changePercent: 0 }
  }
  const total = values.reduce((a, b) => a + b, 0)
  const avg = total / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)
  const trend = calculateTrend(values)
  const changePercent = values.length > 1 ? ((values[values.length - 1]! - values[0]!) / (values[0]! || 1)) * 100 : 0

  return {
    totalRecords: values.length,
    average: Math.round(avg),
    min,
    max,
    trend,
    changePercent: Math.round(changePercent),
  }
}

export const useReportsStore = create<ReportsState>()(
  persist(
    (set, get) => ({
      configs: [],
      results: [],
      activeReportId: null,

      createConfig: (config) => {
        const now = Date.now()
        const newConfig: ReportConfig = {
          ...config,
          id: generateReportId(),
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ configs: [...s.configs, newConfig] }))
      },

      updateConfig: (id, updates) =>
        set((s) => ({
          configs: s.configs.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        })),

      deleteConfig: (id) =>
        set((s) => ({
          configs: s.configs.filter((c) => c.id !== id),
          results: s.results.filter((r) => r.configId !== id),
          activeReportId: s.activeReportId === id ? null : s.activeReportId,
        })),

      generateReport: (configId) => {
        const config = get().configs.find((c) => c.id === configId)
        if (!config) throw new Error('Report config not found')

        const data = collectMetrics(config)
        const summary = calculateSummary(data)

        const result: ReportResult = {
          configId,
          generatedAt: Date.now(),
          data,
          summary,
          metadata: {
            totalRecords: data.length,
            dateRange: { start: config.startDate, end: config.endDate },
            filters: config.filters,
          },
        }

        set((s) => ({
          results: [...s.results.filter((r) => r.configId !== configId), result],
        }))

        return result
      },

      setActiveReport: (id) => set({ activeReportId: id }),
      getReportById: (id) => get().configs.find((c) => c.id === id),
      getResultById: (configId) => get().results.find((r) => r.configId === configId),
    }),
    {
      name: 'cg-reports',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (s) => ({
        configs: s.configs,
        results: s.results,
        activeReportId: s.activeReportId,
      }),
    }
  )
)
