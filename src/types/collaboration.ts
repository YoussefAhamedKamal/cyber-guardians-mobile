export type SharePlatform = 'whatsapp' | 'telegram' | 'twitter' | 'facebook' | 'email' | 'copy' | 'qr-code'
export type ExportFormat = 'json' | 'markdown' | 'pdf' | 'html' | 'csv'

export interface ShareOptions {
  platform: SharePlatform
  title?: string
  message?: string
  url?: string
  imageUrl?: string
}

export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean
  includeImages?: boolean
  pageSize?: 'A4' | 'A5' | 'letter'
  orientation?: 'portrait' | 'landscape'
}

export interface ShareResult {
  id: string
  timestamp: number
  platform: SharePlatform
  success: boolean
  url: string | null
  error?: string
}

export interface ExportResult {
  id: string
  timestamp: number
  format: ExportFormat
  filename: string
  size: number
  success: boolean
  downloadUrl?: string
  error?: string
}

export interface CollaborationState {
  shareHistory: ShareResult[]
  exportHistory: ExportResult[]
  sharedLinks: SharedLink[]
  collaborators: Collaborator[]

  share: (options: ShareOptions) => ShareResult
  export: (data: unknown, filename: string, options: ExportOptions) => ExportResult
  createShareLink: (data: unknown, expiry?: number) => SharedLink
  deleteShareLink: (id: string) => void
  getSharedLinks: () => SharedLink[]
  addCollaborator: (collaborator: Omit<Collaborator, 'id' | 'addedAt'>) => void
  removeCollaborator: (id: string) => void
  getCollaborators: () => Collaborator[]
  clearHistory: () => void
}

export interface SharedLink {
  id: string
  createdAt: number
  expiresAt: number | null
  url: string
  data: unknown
  accessCount: number
}

export interface Collaborator {
  id: string
  name: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  addedAt: number
  lastActive: number | null
}

export const DEFAULT_COLLABORATION_STATE: Omit<CollaborationState, 'share' | 'export' | 'createShareLink' | 'deleteShareLink' | 'getSharedLinks' | 'addCollaborator' | 'removeCollaborator' | 'getCollaborators' | 'clearHistory'> = {
  shareHistory: [],
  exportHistory: [],
  sharedLinks: [],
  collaborators: []
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function getShareUrl(platform: SharePlatform, options: ShareOptions): string {
  const encodedText = encodeURIComponent(options.message || options.title || '')
  const encodedUrl = encodeURIComponent(options.url || window.location.href)

  const urls: Record<SharePlatform, string> = {
    'whatsapp': `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    'telegram': `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    'twitter': `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    'facebook': `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    'email': `mailto:?subject=${encodeURIComponent(options.title || '')}&body=${encodedText}%0A%0A${encodedUrl}`,
    'copy': '',
    'qr-code': ''
  }

  return urls[platform]
}

export function generateQRCode(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
