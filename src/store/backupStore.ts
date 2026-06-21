import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type {
  BackupState,
  BackupData,
  SyncConfig
} from '@/types/backup'
import {
  DEFAULT_BACKUP_STATE,
  DEFAULT_SYNC_CONFIG,
  generateBackupId,
  calculateChecksum
} from '@/types/backup'
import { useSkillStore } from './skillStore'
import { usePluginStore } from './pluginStore'
import { useConnectorStore } from './connectorStore'
import { useProjectStore } from './projectStore'
import { useVersionHistoryStore } from './versionHistoryStore'
import { useAnalyticsStore, computeDailyStats, computeWeeklyStats, computeMonthlyStats } from './analyticsStore'
import { useGameStore } from './gameStore'
import { useCalendarStore } from './calendarStore'
import { useReportsStore } from './reportsStore'
import { useSecurityStore } from './securityStore'
import { useUIStore } from './uiStore'

type BackupStore = BackupState

export const useBackupStore = create<BackupStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_BACKUP_STATE,

      createBackup: async (source = 'local') => {
        set({ isBackingUp: true })

        try {
          const skills = useSkillStore.getState().skills
          const plugins = usePluginStore.getState().plugins
          const connectors = useConnectorStore.getState().connectors
          const projectKnowledge = useProjectStore.getState().knowledge
          const projectInstructions = useProjectStore.getState().instructions
          const projectChats = useProjectStore.getState().chats
          const history = useVersionHistoryStore.getState().changes
          const analytics = useAnalyticsStore.getState().usageRecords
          const game = useGameStore.getState()
          const calendar = useCalendarStore.getState()
          const reports = useReportsStore.getState()
          const security = useSecurityStore.getState()
          const ui = useUIStore.getState()

          const backupData: BackupData = {
            version: '1.0.0',
            timestamp: Date.now(),
            source,
            skills,
            plugins,
            connectors,
            project: {
              knowledge: projectKnowledge,
              instructions: projectInstructions,
              chats: projectChats
            },
            history: history.slice(0, 500),
            analytics: analytics.slice(0, 1000),
            game: {
              completedLevels: Array.from(game.completedLevels).map(String),
              totalScore: game.totalScore,
              xp: game.xp,
              rankId: game.rank.id,
              playerName: game.playerName,
              unlockedBadges: game.unlockedBadges,
              dailyStreakDays: game.dailyStreakDays,
              quizBestScore: game.quizBestScore,
              speedAnswers: game.speedAnswers,
              maxCombo: game.maxCombo
            },
            calendar: {
              tasks: calendar.tasks
            },
            reports: {
              configs: reports.configs,
              results: reports.results
            },
            security: {
              settings: security.settings,
              activityLogs: security.activityLogs.slice(0, 200)
            },
            ui: {
              themeMode: ui.themeMode,
              language: ui.language,
              fontSize: ui.fontSize
            },
            metadata: {
              deviceInfo: navigator.userAgent,
              appVersion: '2.0.0',
              checksum: ''
            }
          }

          const dataString = JSON.stringify(backupData)
          backupData.metadata.checksum = await calculateChecksum(dataString)

          set((state) => {
            const backups = [backupData, ...state.backups].slice(0, state.maxBackups)
            return {
              backups,
              isBackingUp: false,
              lastBackupTime: Date.now()
            }
          })

          return backupData
        } catch {
          set({ isBackingUp: false })
          throw new Error('Failed to create backup')
        }
      },

      restoreBackup: async (backupId) => {
        const state = get()
        const backup = state.backups.find((b) => b.metadata.checksum && b.timestamp.toString() === backupId)

        if (!backup) {
          const backupById = state.backups.find((b) => {
            return b.timestamp.toString() === backupId
          })
          if (!backupById) return false
          return get().restoreBackup(backupById.timestamp.toString())
        }

        set({ isRestoring: true })

        try {
          const dataString = JSON.stringify({
            ...backup,
            metadata: { ...backup.metadata, checksum: '' }
          })
          const expectedChecksum = await calculateChecksum(dataString)

          if (backup.metadata.checksum && backup.metadata.checksum !== expectedChecksum) {
            set({ isRestoring: false })
            return false
          }

          useSkillStore.setState({ skills: backup.skills || [] })
          usePluginStore.setState({ plugins: backup.plugins || [] })
          useConnectorStore.setState({ connectors: backup.connectors || [] })

          if (backup.project) {
            useProjectStore.setState({
              knowledge: backup.project.knowledge || [],
              instructions: backup.project.instructions || useProjectStore.getState().instructions,
              chats: backup.project.chats || []
            })
          }

          if (backup.history) {
            useVersionHistoryStore.setState({ changes: backup.history })
          }

          if (backup.analytics) {
            useAnalyticsStore.setState({ usageRecords: backup.analytics })
          }

          if (backup.game) {
            const { getRankByXp } = await import('@/data/ranks')
            useGameStore.setState({
              completedLevels: new Set(backup.game.completedLevels || []) as unknown as Set<import('@/types').LevelId>,
              totalScore: backup.game.totalScore || 0,
              xp: backup.game.xp || 0,
              rank: getRankByXp(backup.game.xp || 0),
              playerName: backup.game.playerName || '',
              unlockedBadges: backup.game.unlockedBadges || [],
              dailyStreakDays: backup.game.dailyStreakDays || 0,
              quizBestScore: backup.game.quizBestScore || 0,
              speedAnswers: backup.game.speedAnswers || 0,
              maxCombo: backup.game.maxCombo || 0
            })
          }

          if (backup.calendar) {
            useCalendarStore.setState({ tasks: backup.calendar.tasks || [] })
          }

          if (backup.reports) {
            useReportsStore.setState({
              configs: backup.reports.configs || [],
              results: backup.reports.results || []
            })
          }

          if (backup.security) {
            useSecurityStore.setState({
              settings: backup.security.settings || useSecurityStore.getState().settings,
              activityLogs: backup.security.activityLogs || []
            })
          }

          if (backup.ui) {
            useUIStore.setState({
              themeMode: backup.ui.themeMode || 'dark',
              language: backup.ui.language || 'ar',
              fontSize: backup.ui.fontSize || 14
            })
          }

          set({
            isRestoring: false,
            lastRestoreTime: Date.now()
          })

          return true
        } catch {
          set({ isRestoring: false })
          return false
        }
      },

      deleteBackup: (backupId) => {
        set((state) => ({
          backups: state.backups.filter((b) => {
            const id = `backup-${b.timestamp}-${b.metadata.checksum}`
            return id !== backupId && b.timestamp.toString() !== backupId
          })
        }))
      },

      getBackupById: (id) => {
        return get().backups.find((b) => b.timestamp.toString() === id)
      },

      getBackupsByDateRange: (from, to) => {
        return get().backups.filter(
          (b) => b.timestamp >= from && b.timestamp <= to
        )
      },

      getBackupsBySource: (source) => {
        return get().backups.filter((b) => b.source === source)
      },

      setSyncConfig: (config) => {
        set((state) => ({
          syncConfig: { ...state.syncConfig, ...config }
        }))
      },

      enableAutoSync: () => {
        set((state) => ({
          syncConfig: { ...state.syncConfig, autoSync: true }
        }))
        get().startAutoSync()
      },

      disableAutoSync: () => {
        set((state) => ({
          syncConfig: { ...state.syncConfig, autoSync: false }
        }))
        get().stopAutoSync()
      },

      syncToGitHub: async (token, repo) => {
        try {
          const backup = await get().createBackup('github')
          const content = btoa(unescape(encodeURIComponent(JSON.stringify(backup, null, 2))))
          const filename = `cyber-guardians-backup-${backup.timestamp}.json`

          // Check if file exists
          const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/backups/${filename}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
          })

          let sha: string | undefined
          if (checkRes.ok) {
            const existing = await checkRes.json()
            sha = existing.sha
          }

          const body: Record<string, unknown> = {
            message: `Backup update: ${filename}`,
            content,
            branch: 'main'
          }
          if (sha) body.sha = sha

          const res = await fetch(`https://api.github.com/repos/${repo}/contents/backups/${filename}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
          })

          if (res.ok) {
            set((state) => ({ syncConfig: { ...state.syncConfig, lastSync: Date.now() } }))
            return true
          }
          return false
        } catch {
          return false
        }
      },

      syncFromGitHub: async (token, repo) => {
        try {
          const res = await fetch(`https://api.github.com/repos/${repo}/contents/backups`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
          })

          if (!res.ok) return false
          const files = await res.json()
          if (!Array.isArray(files)) return false

          const backupFiles = files.filter((f: { name: string }) => f.name.endsWith('.json')).sort((a: { name: string }, b: { name: string }) => b.name.localeCompare(a.name))
          if (backupFiles.length === 0) return false

          const latest = backupFiles[0]
          if (!latest) return false
          const fileRes = await fetch(latest.url, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
          })

          if (!fileRes.ok) return false
          const fileData = await fileRes.json()
          const content = decodeURIComponent(escape(atob(fileData.content)))

          const parsed = JSON.parse(content)
          if (parsed.skills) useSkillStore.setState({ skills: parsed.skills })
          if (parsed.plugins) usePluginStore.setState({ plugins: parsed.plugins })
          if (parsed.connectors) useConnectorStore.setState({ connectors: parsed.connectors })
          if (parsed.project) {
            useProjectStore.setState({
              knowledge: parsed.project.knowledge || [],
              instructions: parsed.project.instructions || useProjectStore.getState().instructions,
              chats: parsed.project.chats || []
            })
          }
          if (parsed.history) useVersionHistoryStore.setState({ changes: parsed.history })
          if (parsed.analytics) {
            const allRecords = parsed.analytics
            const dailyStats = computeDailyStats(allRecords)
            const weeklyStats = computeWeeklyStats(allRecords)
            const monthlyStats = computeMonthlyStats(allRecords)
            useAnalyticsStore.setState({ usageRecords: allRecords, dailyStats, weeklyStats, monthlyStats })
          }
          if (parsed.game) {
            const { getRankByXp } = await import('@/data/ranks')
            useGameStore.setState({
              completedLevels: new Set(parsed.game.completedLevels || []) as unknown as Set<import('@/types').LevelId>,
              totalScore: parsed.game.totalScore || 0,
              xp: parsed.game.xp || 0,
              rank: getRankByXp(parsed.game.xp || 0),
              playerName: parsed.game.playerName || '',
              unlockedBadges: parsed.game.unlockedBadges || [],
              dailyStreakDays: parsed.game.dailyStreakDays || 0,
              quizBestScore: parsed.game.quizBestScore || 0,
              speedAnswers: parsed.game.speedAnswers || 0,
              maxCombo: parsed.game.maxCombo || 0
            })
          }

          await get().importBackup(content)
          return true
        } catch {
          return false
        }
      },

      _autoSyncTimer: null as ReturnType<typeof setInterval> | null,

      startAutoSync: () => {
        const state = get()
        if (state._autoSyncTimer) clearInterval(state._autoSyncTimer)
        if (!state.syncConfig.autoSync) return

        const timer = setInterval(async () => {
          const s = get()
          if (!s.syncConfig.autoSync) { get().stopAutoSync(); return }
          if (s.syncConfig.provider === 'github' && s.syncConfig.githubToken && s.syncConfig.githubRepo) {
            await s.syncToGitHub(s.syncConfig.githubToken, s.syncConfig.githubRepo)
          }
        }, state.syncConfig.syncInterval)

        set({ _autoSyncTimer: timer })
      },

      stopAutoSync: () => {
        const state = get()
        if (state._autoSyncTimer) {
          clearInterval(state._autoSyncTimer)
          set({ _autoSyncTimer: null })
        }
      },

      exportBackup: (backupId) => {
        const backup = get().backups.find((b) => b.timestamp.toString() === backupId)
        if (!backup) return ''
        return JSON.stringify(backup, null, 2)
      },

      importBackup: async (json) => {
        try {
          const backup = JSON.parse(json) as BackupData
          if (!backup.timestamp || !backup.skills) {
            return false
          }

          if (backup.metadata?.checksum) {
            const dataString = JSON.stringify({
              ...backup,
              metadata: { ...backup.metadata, checksum: '' }
            })
            const expectedChecksum = await calculateChecksum(dataString)
            if (backup.metadata.checksum !== expectedChecksum) {
              return false
            }
          }

          set((state) => {
            const backups = [backup, ...state.backups].slice(0, state.maxBackups)
            return { backups }
          })

          return true
        } catch {
          return false
        }
      },

      clearBackups: () => set({ backups: [] }),
      clearSyncConfig: () => set({ syncConfig: DEFAULT_SYNC_CONFIG })
    }),
    {
      name: 'cyber-guardians-backup',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
)
