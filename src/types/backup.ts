import type { Skill } from './skills'
import type { Plugin } from './plugins'
import type { Connector } from './connectors'
import type { ProjectKnowledge, ProjectInstructions, ProjectChat } from './project'
import type { Change } from './versionHistory'
import type { UsageRecord } from './analytics'

export interface BackupData {
  version: string
  timestamp: number
  source: 'local' | 'github' | 'google-drive'
  skills: Skill[]
  plugins: Plugin[]
  connectors: Connector[]
  project: {
    knowledge: ProjectKnowledge[]
    instructions: ProjectInstructions
    chats: ProjectChat[]
  }
  history: Change[]
  analytics: UsageRecord[]
  metadata: {
    deviceInfo: string
    appVersion: string
    checksum: string
  }
}

export interface SyncConfig {
  enabled: boolean
  provider: 'github' | 'google-drive' | 'local'
  autoSync: boolean
  syncInterval: number
  lastSync: number
  syncOnStart: boolean
  syncOnExit: boolean
}

export interface BackupState {
  backups: BackupData[]
  syncConfig: SyncConfig
  maxBackups: number
  isBackingUp: boolean
  isRestoring: boolean
  lastBackupTime: number | null
  lastRestoreTime: number | null

  createBackup: (source?: BackupData['source']) => Promise<BackupData>
  restoreBackup: (backupId: string) => Promise<boolean>
  deleteBackup: (backupId: string) => void

  getBackupById: (id: string) => BackupData | undefined
  getBackupsByDateRange: (from: number, to: number) => BackupData[]
  getBackupsBySource: (source: BackupData['source']) => BackupData[]

  setSyncConfig: (config: Partial<SyncConfig>) => void
  enableAutoSync: () => void
  disableAutoSync: () => void

  exportBackup: (backupId: string) => string
  importBackup: (json: string) => boolean

  clearBackups: () => void
  clearSyncConfig: () => void
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: false,
  provider: 'local',
  autoSync: false,
  syncInterval: 3600000,
  lastSync: 0,
  syncOnStart: false,
  syncOnExit: false
}

export const DEFAULT_BACKUP_STATE: Omit<BackupState, 'createBackup' | 'restoreBackup' | 'deleteBackup' | 'getBackupById' | 'getBackupsByDateRange' | 'getBackupsBySource' | 'setSyncConfig' | 'enableAutoSync' | 'disableAutoSync' | 'exportBackup' | 'importBackup' | 'clearBackups' | 'clearSyncConfig'> = {
  backups: [],
  syncConfig: DEFAULT_SYNC_CONFIG,
  maxBackups: 10,
  isBackingUp: false,
  isRestoring: false,
  lastBackupTime: null,
  lastRestoreTime: null
}

export function generateBackupId(): string {
  return `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function calculateChecksum(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

export function formatBackupDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
