export type EncryptionAlgorithm = 'AES-GCM' | 'AES-CBC' | 'RSA-OAEP'
export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

export interface EncryptionConfig {
  algorithm: EncryptionAlgorithm
  keyLength: number
  ivLength: number
  tagLength: number
}

export interface EncryptedData {
  data: string
  iv: string
  salt: string
  algorithm: EncryptionAlgorithm
  timestamp: number
}

export interface SecuritySettings {
  encryptionEnabled: boolean
  encryptionAlgorithm: EncryptionAlgorithm
  autoLockTimeout: number
  maxLoginAttempts: number
  lockDuration: number
  biometricEnabled: boolean
  twoFactorEnabled: boolean
  sessionTimeout: number
  dataRetentionDays: number
}

export interface ActivityLog {
  id: string
  timestamp: number
  action: string
  details: string
  ipAddress?: string
  userAgent?: string
  success: boolean
}

export interface SecurityState {
  settings: SecuritySettings
  activityLogs: ActivityLog[]
  isLocked: boolean
  lastActivity: number
  failedAttempts: number
  lockedUntil: number | null

  updateSettings: (settings: Partial<SecuritySettings>) => void
  encrypt: (data: string, password: string) => Promise<EncryptedData>
  decrypt: (encrypted: EncryptedData, password: string) => Promise<string>
  hash: (data: string, algorithm?: HashAlgorithm) => Promise<string>
  verify: (data: string, hash: string, algorithm?: HashAlgorithm) => Promise<boolean>

  logActivity: (action: string, details: string, success: boolean) => void
  getActivityLogs: (limit?: number) => ActivityLog[]
  clearActivityLogs: () => void

  lock: () => void
  unlock: (password: string) => Promise<boolean>
  checkLock: () => boolean
  updateActivity: () => void

  exportSecurityData: () => string
  importSecurityData: (json: string) => boolean
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  encryptionEnabled: true,
  encryptionAlgorithm: 'AES-GCM',
  autoLockTimeout: 300000,
  maxLoginAttempts: 5,
  lockDuration: 300000,
  biometricEnabled: false,
  twoFactorEnabled: false,
  sessionTimeout: 3600000,
  dataRetentionDays: 90
}

export const DEFAULT_SECURITY_STATE: Omit<SecurityState, 'updateSettings' | 'encrypt' | 'decrypt' | 'hash' | 'verify' | 'logActivity' | 'getActivityLogs' | 'clearActivityLogs' | 'lock' | 'unlock' | 'checkLock' | 'updateActivity' | 'exportSecurityData' | 'importSecurityData'> = {
  settings: DEFAULT_SECURITY_SETTINGS,
  activityLogs: [],
  isLocked: false,
  lastActivity: Date.now(),
  failedAttempts: 0,
  lockedUntil: null
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
