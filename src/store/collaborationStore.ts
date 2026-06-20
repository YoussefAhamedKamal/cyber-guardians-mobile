import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type {
  CollaborationState,
  ShareResult,
  ExportResult,
  SharedLink,
  Collaborator,
  ShareOptions,
  ExportOptions
} from '@/types/collaboration'
import {
  DEFAULT_COLLABORATION_STATE,
  generateId,
  getShareUrl,
  generateQRCode
} from '@/types/collaboration'

type CollaborationStore = CollaborationState

export const useCollaborationStore = create<CollaborationStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_COLLABORATION_STATE,

      share: (options) => {
        const result: ShareResult = {
          id: generateId(),
          timestamp: Date.now(),
          platform: options.platform,
          success: true,
          url: options.url || null
        }

        if (options.platform === 'copy') {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(options.message || options.url || '')
          }
        } else if (options.platform === 'qr-code') {
          const qrUrl = generateQRCode(options.url || window.location.href)
          result.url = qrUrl
        } else {
          const shareUrl = getShareUrl(options.platform, options)
          if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400')
          }
        }

        set((state) => ({
          shareHistory: [result, ...state.shareHistory].slice(0, 50)
        }))

        return result
      },

      export: (data, filename, options) => {
        const result: ExportResult = {
          id: generateId(),
          timestamp: Date.now(),
          format: options.format,
          filename: `${filename}.${options.format}`,
          size: 0,
          success: true
        }

        try {
          let content = ''
          let mimeType = 'text/plain'

          switch (options.format) {
            case 'json':
              content = JSON.stringify(data, null, 2)
              mimeType = 'application/json'
              break
            case 'markdown':
              content = convertToMarkdown(data)
              mimeType = 'text/markdown'
              break
            case 'html':
              content = convertToHTML(data)
              mimeType = 'text/html'
              break
            case 'csv':
              content = convertToCSV(data)
              mimeType = 'text/csv'
              break
            default:
              content = JSON.stringify(data, null, 2)
              mimeType = 'application/json'
          }

          result.size = new Blob([content]).size

          const blob = new Blob([content], { type: mimeType })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = result.filename
          a.click()
          URL.revokeObjectURL(url)

          result.downloadUrl = url
        } catch (error) {
          result.success = false
          result.error = error instanceof Error ? error.message : 'Export failed'
        }

        set((state) => ({
          exportHistory: [result, ...state.exportHistory].slice(0, 50)
        }))

        return result
      },

      createShareLink: (data, expiry = 3600000) => {
        const link: SharedLink = {
          id: generateId(),
          createdAt: Date.now(),
          expiresAt: expiry ? Date.now() + expiry : null,
          url: `https://share.cyber-guardians.app/${generateId()}`,
          data,
          accessCount: 0
        }

        set((state) => ({
          sharedLinks: [link, ...state.sharedLinks].slice(0, 20)
        }))

        return link
      },

      deleteShareLink: (id) => {
        set((state) => ({
          sharedLinks: state.sharedLinks.filter((l) => l.id !== id)
        }))
      },

      getSharedLinks: () => {
        return get().sharedLinks.filter(
          (l) => !l.expiresAt || l.expiresAt > Date.now()
        )
      },

      addCollaborator: (collaboratorData) => {
        const collaborator: Collaborator = {
          ...collaboratorData,
          id: generateId(),
          addedAt: Date.now(),
          lastActive: null
        }

        set((state) => ({
          collaborators: [collaborator, ...state.collaborators].slice(0, 20)
        }))
      },

      removeCollaborator: (id) => {
        set((state) => ({
          collaborators: state.collaborators.filter((c) => c.id !== id)
        }))
      },

      getCollaborators: () => {
        return get().collaborators
      },

      clearHistory: () => set({
        shareHistory: [],
        exportHistory: [],
        sharedLinks: [],
        collaborators: []
      })
    }),
    {
      name: 'cyber-guardians-collaboration',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
)

function convertToMarkdown(data: unknown): string {
  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    return Object.entries(obj)
      .map(([key, value]) => `## ${key}\n\n${typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}`)
      .join('\n\n')
  }
  return String(data)
}

function convertToHTML(data: unknown): string {
  if (typeof data === 'string') return `<html><body>${data}</body></html>`
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    const rows = Object.entries(obj)
      .map(([key, value]) => `<tr><td><strong>${key}</strong></td><td>${typeof value === 'object' ? JSON.stringify(value) : String(value)}</td></tr>`)
      .join('\n')
    return `<html><body><table border="1">${rows}</table></body></html>`
  }
  return `<html><body>${String(data)}</body></html>`
}

function convertToCSV(data: unknown): string {
  if (typeof data === 'string') return `"${data}"`
  if (Array.isArray(data)) {
    if (data.length === 0) return ''
    const headers = Object.keys(data[0] || {})
    const rows = data.map((row) =>
      headers.map((h) => `"${String((row as Record<string, unknown>)[h] || '')}"`).join(',')
    )
    return [headers.join(','), ...rows].join('\n')
  }
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    const headers = Object.keys(obj)
    const values = Object.values(obj).map((v) => `"${String(v)}"`)
    return [headers.join(','), values.join(',')].join('\n')
  }
  return `"${String(data)}"`
}
