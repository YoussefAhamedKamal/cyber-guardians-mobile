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
import { useAnalyticsStore } from './analyticsStore'

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
            metadata: {
              deviceInfo: navigator.userAgent,
              appVersion: '2.0.0',
              checksum: ''
            }
          }

          const dataString = JSON.stringify(backupData)
          backupData.metadata.checksum = calculateChecksum(dataString)

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
            const id = `backup-${b.timestamp}-${b.metadata.checksum}`
            return id === backupId
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
          const expectedChecksum = calculateChecksum(dataString)

          if (backup.metadata.checksum && backup.metadata.checksum !== expectedChecksum) {
            console.warn('Backup checksum mismatch, restoring anyway')
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
          backups: state.backups.filter((b) => b.timestamp.toString() !== backupId)
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
      },

      disableAutoSync: () => {
        set((state) => ({
          syncConfig: { ...state.syncConfig, autoSync: false }
        }))
      },

      exportBackup: (backupId) => {
        const backup = get().backups.find((b) => b.timestamp.toString() === backupId)
        if (!backup) return ''
        return JSON.stringify(backup, null, 2)
      },

      importBackup: (json) => {
        try {
          const backup = JSON.parse(json) as BackupData
          if (!backup.timestamp || !backup.skills) {
            return false
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
