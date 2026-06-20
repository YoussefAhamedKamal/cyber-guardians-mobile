import type { Skill } from './skills'
import type { Plugin } from './plugins'
import type { Connector } from './connectors'
import type { ProjectKnowledge, ProjectInstructions } from './project'

export type ChangeType = 'create' | 'update' | 'delete' | 'install' | 'uninstall' | 'toggle' | 'reorder'

export type ItemType = 'skill' | 'plugin' | 'connector' | 'knowledge' | 'instructions'

export interface Change {
  id: string
  timestamp: number
  type: ChangeType
  itemType: ItemType
  itemId: string
  itemName: string
  snapshot: unknown
  metadata: {
    oldState?: unknown
    newState?: unknown
    reason?: string
  } | null
}

export interface VersionSnapshot {
  id: string
  timestamp: number
  skills: Skill[]
  plugins: Plugin[]
  connectors: Connector[]
  knowledge: ProjectKnowledge[]
  instructions: ProjectInstructions
}

export interface VersionDiff {
  type: ChangeType
  itemType: ItemType
  itemId: string
  itemName: string
  oldState: unknown
  newState: unknown
  timestamp: number
}

export interface VersionHistoryState {
  changes: Change[]
  snapshots: VersionSnapshot[]
  maxChanges: number
  maxSnapshots: number

  recordChange: (type: ChangeType, itemType: ItemType, itemId: string, itemName: string, snapshot: unknown, metadata?: Change['metadata']) => void
  createSnapshot: () => VersionSnapshot
  restoreSnapshot: (snapshotId: string) => VersionSnapshot | null

  getItemHistory: (itemType: ItemType, itemId: string) => Change[]
  getRecentChanges: (limit?: number) => Change[]
  getChangesByType: (type: ChangeType) => Change[]
  getChangesByItemType: (itemType: ItemType) => Change[]
  getChangesByDateRange: (from: number, to: number) => Change[]

  compareSnapshots: (snapshotId1: string, snapshotId2: string) => VersionDiff[]
  getSnapshotById: (snapshotId: string) => VersionSnapshot | undefined

  clearHistory: () => void
  clearSnapshots: () => void
  exportHistory: () => string
  importHistory: (json: string) => boolean
}

export const DEFAULT_VERSION_HISTORY_STATE: Omit<VersionHistoryState, 'recordChange' | 'createSnapshot' | 'restoreSnapshot' | 'getItemHistory' | 'getRecentChanges' | 'getChangesByType' | 'getChangesByItemType' | 'getChangesByDateRange' | 'compareSnapshots' | 'getSnapshotById' | 'clearHistory' | 'clearSnapshots' | 'exportHistory' | 'importHistory'> = {
  changes: [],
  snapshots: [],
  maxChanges: 500,
  maxSnapshots: 10
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `منذ ${days} يوم`
  if (hours > 0) return `منذ ${hours} ساعة`
  if (minutes > 0) return `منذ ${minutes} دقيقة`
  return 'الآن'
}

export function getChangeTypeLabel(type: ChangeType): string {
  const labels: Record<ChangeType, string> = {
    create: 'إنشاء',
    update: 'تحديث',
    delete: 'حذف',
    install: 'تثبيت',
    uninstall: 'إلغاء التثبيت',
    toggle: 'تفعيل/تعطيل',
    reorder: 'إعادة ترتيب'
  }
  return labels[type]
}

export function getItemTypeLabel(itemType: ItemType): string {
  const labels: Record<ItemType, string> = {
    skill: 'قدرة',
    plugin: 'أداة',
    connector: 'اتصال',
    knowledge: 'معرفة',
    instructions: 'تعليمات'
  }
  return labels[itemType]
}

export function getChangeTypeIcon(type: ChangeType): string {
  const icons: Record<ChangeType, string> = {
    create: '✨',
    update: '📝',
    delete: '🗑️',
    install: '📦',
    uninstall: '📤',
    toggle: '🔄',
    reorder: '↕️'
  }
  return icons[type]
}

export function getItemTypeIcon(itemType: ItemType): string {
  const icons: Record<ItemType, string> = {
    skill: '📋',
    plugin: '🔌',
    connector: '🔗',
    knowledge: '📚',
    instructions: '📝'
  }
  return icons[itemType]
}
