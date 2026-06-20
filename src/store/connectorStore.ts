import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type { Connector, ConnectorProvider } from '@/types/connectors'
import { CONNECTOR_TEMPLATES } from '@/types/connectors'
import { useVersionHistoryStore } from './versionHistoryStore'
import { useAnalyticsStore } from './analyticsStore'

interface ConnectorState {
  connectors: Connector[]
  activeConnectorId: string | null
  filterProvider: ConnectorProvider | 'all'
  searchQuery: string

  addConnector: (connector: Omit<Connector, 'id' | 'createdAt' | 'updatedAt'>) => string
  removeConnector: (id: string) => void
  toggleConnector: (id: string) => void
  updateConnector: (id: string, updates: Partial<Connector>) => void
  setActiveConnector: (id: string | null) => void
  setFilterProvider: (provider: ConnectorProvider | 'all') => void
  setSearchQuery: (query: string) => void

  connectConnector: (id: string, credentials: Record<string, string>) => void
  disconnectConnector: (id: string) => void
  testConnection: (id: string) => Promise<boolean>

  getConnectedConnectors: () => Connector[]
  getConnectorById: (id: string) => Connector | undefined
  getConnectorsByProvider: (provider: ConnectorProvider) => Connector[]

  addConnectorFromTemplate: (templateId: string) => string
  importConnectors: (connectors: Connector[]) => void
  exportConnectors: () => Connector[]

  getDefaultConnector: () => Connector | undefined
}

export const useConnectorStore = create<ConnectorState>()(
  persist(
    (set, get) => ({
      connectors: [],
      activeConnectorId: null,
      filterProvider: 'all',
      searchQuery: '',

      addConnector: (connectorData) => {
        const id = `connector-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const now = Date.now()
        const connector: Connector = {
          ...connectorData,
          id,
          lastSync: null,
          lastError: null,
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({ connectors: [...state.connectors, connector] }))
        useVersionHistoryStore.getState().recordChange('create', 'connector', id, connector.name, JSON.stringify(connector))
        return id
      },

      removeConnector: (id) => {
        const connector = get().connectors.find(c => c.id === id)
        set((state) => ({
          connectors: state.connectors.filter((c) => c.id !== id),
          activeConnectorId: state.activeConnectorId === id ? null : state.activeConnectorId
        }))
        if (connector) {
          useVersionHistoryStore.getState().recordChange('delete', 'connector', id, connector.name, null)
        }
      },

      toggleConnector: (id) => {
        const connector = get().connectors.find(c => c.id === id)
        if (!connector) return
        const newConnected = !connector.connected
        set((state) => ({
          connectors: state.connectors.map((c) =>
            c.id === id
              ? { ...c, connected: newConnected, credentials: newConnected ? c.credentials : {}, updatedAt: Date.now() }
              : c
          )
        }))
        useVersionHistoryStore.getState().recordChange('toggle', 'connector', id, connector.name, JSON.stringify({ connected: newConnected }))
      },

      updateConnector: (id, updates) => {
        const connector = get().connectors.find(c => c.id === id)
        set((state) => ({
          connectors: state.connectors.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          )
        }))
        if (connector) {
          useVersionHistoryStore.getState().recordChange('update', 'connector', id, connector.name, JSON.stringify({ ...connector, ...updates }))
        }
      },

      setActiveConnector: (id) => {
        set({ activeConnectorId: id })
      },

      setFilterProvider: (provider) => {
        set({ filterProvider: provider })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      connectConnector: (id, credentials) => {
        const connector = get().connectors.find(c => c.id === id)
        set((state) => ({
          connectors: state.connectors.map((c) =>
            c.id === id
              ? { ...c, connected: true, credentials, lastSync: Date.now(), updatedAt: Date.now() }
              : c
          )
        }))
        useAnalyticsStore.getState().recordUsage('connect', 'connector', id, connector?.name || id, true)
      },

      disconnectConnector: (id) => {
        const connector = get().connectors.find(c => c.id === id)
        set((state) => ({
          connectors: state.connectors.map((c) =>
            c.id === id
              ? { ...c, connected: false, credentials: {}, updatedAt: Date.now() }
              : c
          )
        }))
        useAnalyticsStore.getState().recordUsage('disconnect', 'connector', id, connector?.name || id, true)
      },

      testConnection: async (id) => {
        const connector = get().getConnectorById(id)
        if (!connector) return false
        const startTime = Date.now()

        try {
          const response = await fetch(`${connector.config.baseUrl}/models`, {
            headers: {
              'Authorization': `Bearer ${connector.credentials.apiKey || ''}`,
              'Content-Type': 'application/json'
            }
          })

          const success = response.ok
          const duration = Date.now() - startTime
          set((state) => ({
            connectors: state.connectors.map((c) =>
              c.id === id
                ? { ...c, lastError: success ? null : `HTTP ${response.status}`, updatedAt: Date.now() }
                : c
            )
          }))
          useAnalyticsStore.getState().recordUsage('test', 'connector', id, connector.name, success, duration, success ? undefined : `HTTP ${response.status}`)
          return success
        } catch (error) {
          const duration = Date.now() - startTime
          const errorMsg = error instanceof Error ? error.message : 'Connection failed'
          set((state) => ({
            connectors: state.connectors.map((c) =>
              c.id === id
                ? { ...c, lastError: errorMsg, updatedAt: Date.now() }
                : c
            )
          }))
          useAnalyticsStore.getState().recordUsage('test', 'connector', id, connector.name, false, duration, errorMsg)
          return false
        }
      },

      getConnectedConnectors: () => {
        return get().connectors.filter((c) => c.connected)
      },

      getConnectorById: (id) => {
        return get().connectors.find((c) => c.id === id)
      },

      getConnectorsByProvider: (provider) => {
        return get().connectors.filter((c) => c.provider === provider)
      },

      addConnectorFromTemplate: (templateId) => {
        const template = CONNECTOR_TEMPLATES.find((t) => t.id === templateId)
        if (!template) return ''
        return get().addConnector({
          name: template.name,
          description: template.description,
          icon: template.icon,
          provider: template.provider,
          authType: template.authType,
          connected: false,
          credentials: {},
          config: { ...template.config },
          capabilities: [...template.capabilities],
          lastSync: null,
          lastError: null
        })
      },

      importConnectors: (connectors) => {
        set((state) => {
          const existingIds = new Set(state.connectors.map((c) => c.id))
          const newConnectors = connectors.filter((c) => !existingIds.has(c.id))
          return { connectors: [...state.connectors, ...newConnectors] }
        })
      },

      exportConnectors: () => {
        return get().connectors
      },

      getDefaultConnector: () => {
        const connected = get().getConnectedConnectors()
        return connected[0]
      }
    }),
    {
      name: 'cg-connector-store',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        connectors: state.connectors,
        activeConnectorId: state.activeConnectorId
      })
    }
  )
)
