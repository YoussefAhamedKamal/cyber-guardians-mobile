import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type { Plugin, PluginCategory } from '@/types/plugins'
import { PLUGIN_TEMPLATES } from '@/types/plugins'
import { useAnalyticsStore } from './analyticsStore'
import { useVersionHistoryStore } from './versionHistoryStore'

interface PluginState {
  plugins: Plugin[]
  activePluginId: string | null
  filterCategory: PluginCategory | 'all'
  searchQuery: string

  addPlugin: (plugin: Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'usageHistory'>) => string
  removePlugin: (id: string) => void
  togglePlugin: (id: string) => void
  updatePlugin: (id: string, updates: Partial<Plugin>) => void
  setActivePlugin: (id: string | null) => void
  setFilterCategory: (category: PluginCategory | 'all') => void
  setSearchQuery: (query: string) => void

  getEnabledPlugins: () => Plugin[]
  getPluginById: (id: string) => Plugin | undefined
  getPluginsByCategory: (category: PluginCategory) => Plugin[]

  addPluginFromTemplate: (templateId: string) => string
  importPlugins: (plugins: Plugin[]) => void
  exportPlugins: () => Plugin[]

  recordUsage: (pluginId: string, endpoint: string, input: string, output: string, duration: number, success: boolean, error?: string) => void

  executePlugin: (pluginId: string, endpointId: string, params: Record<string, unknown>) => Promise<unknown>
}

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      plugins: [],
      activePluginId: null,
      filterCategory: 'all',
      searchQuery: '',

      addPlugin: (pluginData) => {
        const id = `plugin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const now = Date.now()
        const plugin: Plugin = {
          ...pluginData,
          id,
          usageHistory: [],
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({ plugins: [...state.plugins, plugin] }))
        useVersionHistoryStore.getState().recordChange('create', 'plugin', id, plugin.name, JSON.stringify(plugin))
        return id
      },

      removePlugin: (id) => {
        const plugin = get().plugins.find(p => p.id === id)
        set((state) => ({
          plugins: state.plugins.filter((p) => p.id !== id),
          activePluginId: state.activePluginId === id ? null : state.activePluginId
        }))
        if (plugin) {
          useVersionHistoryStore.getState().recordChange('delete', 'plugin', id, plugin.name, null)
        }
      },

      togglePlugin: (id) => {
        const plugin = get().plugins.find(p => p.id === id)
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.id === id ? { ...p, enabled: !p.enabled, updatedAt: Date.now() } : p
          )
        }))
        if (plugin) {
          useVersionHistoryStore.getState().recordChange('toggle', 'plugin', id, plugin.name, JSON.stringify({ enabled: !plugin.enabled }))
        }
      },

      updatePlugin: (id, updates) => {
        const plugin = get().plugins.find(p => p.id === id)
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          )
        }))
        if (plugin) {
          useVersionHistoryStore.getState().recordChange('update', 'plugin', id, plugin.name, JSON.stringify({ ...plugin, ...updates }))
        }
      },

      setActivePlugin: (id) => {
        set({ activePluginId: id })
      },

      setFilterCategory: (category) => {
        set({ filterCategory: category })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      getEnabledPlugins: () => {
        return get().plugins.filter((p) => p.enabled)
      },

      getPluginById: (id) => {
        return get().plugins.find((p) => p.id === id)
      },

      getPluginsByCategory: (category) => {
        return get().plugins.filter((p) => p.category === category)
      },

      addPluginFromTemplate: (templateId) => {
        const template = PLUGIN_TEMPLATES.find((t) => t.id === templateId)
        if (!template) return ''
        return get().addPlugin({
          name: template.name,
          description: template.description,
          icon: template.icon,
          enabled: true,
          category: template.category,
          config: { ...template.config },
          endpoints: [...template.endpoints],
          auth: { ...template.auth },
          events: [],
          hooks: []
        })
      },

      importPlugins: (plugins) => {
        set((state) => {
          const existingIds = new Set(state.plugins.map((p) => p.id))
          const newPlugins = plugins.filter((p) => !existingIds.has(p.id))
          return { plugins: [...state.plugins, ...newPlugins] }
        })
      },

      exportPlugins: () => {
        return get().plugins
      },

      recordUsage: (pluginId, endpoint, input, output, duration, success, error) => {
        const record = {
          timestamp: Date.now(),
          endpoint,
          input: input.slice(0, 100),
          output: output.slice(0, 100),
          duration,
          success,
          error: error || null
        }
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.id === pluginId
              ? { ...p, usageHistory: [...p.usageHistory.slice(-49), record] }
              : p
          )
        }))
        const plugin = get().plugins.find(p => p.id === pluginId)
        useAnalyticsStore.getState().recordUsage(
          'use',
          'plugin',
          pluginId,
          `${plugin?.name || pluginId}/${endpoint}`,
          success,
          duration,
          success ? undefined : (error || output.slice(0, 200))
        )
      },

      executePlugin: async (pluginId, endpointId, params) => {
        const plugin = get().getPluginById(pluginId)
        if (!plugin) throw new Error('Plugin not found')

        const endpoint = plugin.endpoints.find((e) => e.id === endpointId)
        if (!endpoint) throw new Error('Endpoint not found')

        const startTime = Date.now()

        try {
          let url = `${plugin.config.baseUrl || ''}${endpoint.path}`

          // Replace path parameters
          for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, String(value))
          }

          // Add query string for GET requests
          if (endpoint.method === 'GET' && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams()
            for (const [key, value] of Object.entries(params)) {
              if (value !== null && value !== undefined) {
                searchParams.set(key, String(value))
              }
            }
            const queryString = searchParams.toString()
            if (queryString) {
              url += (url.includes('?') ? '&' : '?') + queryString
            }
          }

          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          }

          // Add auth headers
          if (plugin.auth.type === 'api_key' && plugin.auth.credentials?.apiKey) {
            headers['Authorization'] = `Bearer ${plugin.auth.credentials.apiKey}`
          } else if (plugin.auth.type === 'bearer' && plugin.auth.credentials?.token) {
            headers['Authorization'] = `Bearer ${plugin.auth.credentials.token}`
          }

          const response = await fetch(url, {
            method: endpoint.method,
            headers,
            body: endpoint.method !== 'GET' ? JSON.stringify(params) : null
          })

          const duration = Date.now() - startTime

          if (!response.ok) {
            const errorMsg = `HTTP ${response.status}: ${response.statusText}`
            get().recordUsage(pluginId, endpointId, JSON.stringify(params), '', duration, false, errorMsg)
            throw new Error(errorMsg)
          }

          let result: any
          try {
            result = await response.json()
          } catch {
            result = { raw: await response.text() }
          }
          get().recordUsage(pluginId, endpointId, JSON.stringify(params), JSON.stringify(result), duration, true)

          return result
        } catch (error) {
          const duration = Date.now() - startTime
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          get().recordUsage(pluginId, endpointId, JSON.stringify(params), '', duration, false, errorMsg)
          throw error
        }
      }
    }),
    {
      name: 'cg-plugin-store',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        plugins: state.plugins,
        activePluginId: state.activePluginId
      })
    }
  )
)
