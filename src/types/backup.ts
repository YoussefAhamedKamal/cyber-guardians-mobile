import type { Skill } from './skills'
import type { Plugin } from './plugins'
import type { Connector } from './connectors'
import type { ProjectKnowledge, ProjectInstructions, ProjectChat } from './project'
import type { Change } from './versionHistory'
import type { UsageRecord } from './analytics'
import type { CalendarTask } from './calendar'
import type { ReportConfig, ReportResult } from './reports'
import type { SecuritySettings, ActivityLog } from './security'
import type { Language } from './ui'

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
  game: {
    completedLevels: string[]
    totalScore: number
    xp: number
    rankId: number
    playerName: string
    unlockedBadges: string[]
    dailyStreakDays: number
    quizBestScore: number
    speedAnswers: number
    maxCombo: number
  }
  calendar: {
    tasks: CalendarTask[]
  }
  reports: {
    configs: ReportConfig[]
    results: ReportResult[]
  }
  security: {
    settings: SecuritySettings
    activityLogs: ActivityLog[]
  }
  ui: {
    themeMode: 'dark' | 'light' | 'system'
    language: Language
    fontSize: number
  }
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
  githubToken?: string
  githubRepo?: string
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
  syncToGitHub: (token: string, repo: string) => Promise<boolean>
  syncFromGitHub: (token: string, repo: string) => Promise<boolean>
  startAutoSync: () => void
  stopAutoSync: () => void

  exportBackup: (backupId: string) => string
  importBackup: (json: string) => boolean

  clearBackups: () => void
  clearSyncConfig: () => void
  _autoSyncTimer: ReturnType<typeof setInterval> | null
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

export const DEFAULT_BACKUP_STATE: Omit<BackupState, 'createBackup' | 'restoreBackup' | 'deleteBackup' | 'getBackupById' | 'getBackupsByDateRange' | 'getBackupsBySource' | 'setSyncConfig' | 'enableAutoSync' | 'disableAutoSync' | 'syncToGitHub' | 'syncFromGitHub' | 'startAutoSync' | 'stopAutoSync' | 'exportBackup' | 'importBackup' | 'clearBackups' | 'clearSyncConfig'> = {
  backups: [],
  syncConfig: DEFAULT_SYNC_CONFIG,
  maxBackups: 10,
  isBackingUp: false,
  isRestoring: false,
  lastBackupTime: null,
  lastRestoreTime: null,
  _autoSyncTimer: null
}

export function generateBackupId(): string {
  return `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export async function calculateChecksum(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback for environments without crypto.subtle
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
