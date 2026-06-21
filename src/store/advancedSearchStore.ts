import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type {
  SearchState,
  SearchResult,
  SearchQuery,
  SearchFilter,
  SavedSearch,
  SearchSuggestion,
  SearchableItemType
} from '@/types/search'
import {
  DEFAULT_SEARCH_STATE,
  parseSearchQuery,
  calculateMatchScore,
  findHighlights,
  generateSearchId
} from '@/types/search'
import { useSkillStore } from './skillStore'
import { usePluginStore } from './pluginStore'
import { useConnectorStore } from './connectorStore'
import { useProjectStore } from './projectStore'
import { useVersionHistoryStore } from './versionHistoryStore'
import { useAnalyticsStore } from './analyticsStore'

type AdvancedSearchStore = SearchState

export const useAdvancedSearchStore = create<AdvancedSearchStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SEARCH_STATE,

      search: (query, filters = {}) => {
        if (!query || !query.trim()) {
          set({ results: [], totalResults: 0, isSearching: false, lastQuery: query, searchTime: 0 })
          return []
        }
        const startTime = performance.now()
        set({ isSearching: true })

        try {
          const searchQuery = parseSearchQuery(query)
          const mergedFilters: SearchFilter = {
            types: filters.types || searchQuery.filters.types,
            limit: filters.limit || 50,
            offset: filters.offset || 0
          }

          const results: SearchResult[] = []

          if (mergedFilters.types.includes('skill')) {
            const skills = useSkillStore.getState().skills
            skills.forEach((skill) => {
              const score = calculateMatchScore(query, `${skill.name} ${skill.description}`)
              if (score > 0) {
                results.push({
                  id: skill.id,
                  type: 'skill',
                  title: skill.name,
                  description: skill.description,
                  matchScore: score,
                  matchHighlights: findHighlights(skill.name, query),
                  data: skill
                })
              }
            })
          }

          if (mergedFilters.types.includes('plugin')) {
            const plugins = usePluginStore.getState().plugins
            plugins.forEach((plugin) => {
              const score = calculateMatchScore(query, `${plugin.name} ${plugin.description}`)
              if (score > 0) {
                results.push({
                  id: plugin.id,
                  type: 'plugin',
                  title: plugin.name,
                  description: plugin.description,
                  matchScore: score,
                  matchHighlights: findHighlights(plugin.name, query),
                  data: plugin
                })
              }
            })
          }

          if (mergedFilters.types.includes('connector')) {
            const connectors = useConnectorStore.getState().connectors
            connectors.forEach((connector) => {
              const score = calculateMatchScore(query, `${connector.name} ${connector.description}`)
              if (score > 0) {
                results.push({
                  id: connector.id,
                  type: 'connector',
                  title: connector.name,
                  description: connector.description,
                  matchScore: score,
                  matchHighlights: findHighlights(connector.name, query),
                  data: connector
                })
              }
            })
          }

          if (mergedFilters.types.includes('knowledge')) {
            const knowledge = useProjectStore.getState().knowledge
            knowledge.forEach((k) => {
              const score = calculateMatchScore(query, `${k.name} ${k.content}`)
              if (score > 0) {
                results.push({
                  id: k.id,
                  type: 'knowledge',
                  title: k.name,
                  description: k.content.substring(0, 200),
                  matchScore: score,
                  matchHighlights: findHighlights(k.name, query),
                  data: k
                })
              }
            })
          }

          if (mergedFilters.types.includes('instructions')) {
            const instructions = useProjectStore.getState().instructions
            if (instructions) {
              const instrText = `${instructions.role || ''} ${instructions.customPrompt || ''} ${instructions.tone || ''} ${instructions.responseFormat || ''}`
              const score = calculateMatchScore(query, instrText)
              if (score > 0) {
                results.push({
                  id: 'project-instructions',
                  type: 'instructions' as SearchableItemType,
                  title: 'تعليمات المشروع',
                  description: instructions.customPrompt?.substring(0, 200) || instructions.role || '',
                  matchScore: score,
                  matchHighlights: findHighlights('تعليمات المشروع', query),
                  data: instructions
                })
              }
            }
          }

          if (mergedFilters.types.includes('change')) {
            const changes = useVersionHistoryStore.getState().changes
            changes.forEach((change) => {
              const score = calculateMatchScore(query, `${change.itemName} ${change.type}`)
              if (score > 0) {
                results.push({
                  id: change.id,
                  type: 'change',
                  title: change.itemName,
                  description: `${change.type} ${change.itemType}`,
                  matchScore: score,
                  matchHighlights: findHighlights(change.itemName, query),
                  data: change,
                  timestamp: change.timestamp
                })
              }
            })
          }

          if (mergedFilters.types.includes('usage')) {
            const usages = useAnalyticsStore.getState().usageRecords
            usages.forEach((usage) => {
              const score = calculateMatchScore(query, `${usage.itemName} ${usage.action}`)
              if (score > 0) {
                results.push({
                  id: usage.id,
                  type: 'usage',
                  title: usage.itemName,
                  description: `${usage.action} ${usage.itemType}`,
                  matchScore: score,
                  matchHighlights: findHighlights(usage.itemName, query),
                  data: usage,
                  timestamp: usage.timestamp
                })
              }
            })
          }

          results.sort((a, b) => b.matchScore - a.matchScore)

          const limit = mergedFilters.limit || 50
          const offset = mergedFilters.offset || 0
          const limitedResults = results.slice(offset, offset + limit)

          const searchTime = performance.now() - startTime

          set({
            results: limitedResults,
            totalResults: results.length,
            isSearching: false,
            lastQuery: query,
            searchTime
          })

          get().addRecentSearch(query)

          return limitedResults
        } catch {
          const searchTime = performance.now() - startTime
          set({ results: [], totalResults: 0, isSearching: false, lastQuery: query, searchTime })
          return []
        }
      },

      searchWithOperators: (query) => {
        return get().search(query.query, query.filters)
      },

      saveSearch: (name, query) => {
        const savedSearch: SavedSearch = {
          id: generateSearchId(),
          name,
          query,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          useCount: 0
        }

        set((state) => ({
          savedSearches: [savedSearch, ...state.savedSearches].slice(0, 20)
        }))
      },

      deleteSavedSearch: (id) => {
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== id)
        }))
      },

      getSavedSearches: () => {
        return get().savedSearches
      },

      useSavedSearch: (id) => {
        const savedSearch = get().savedSearches.find((s) => s.id === id)
        if (!savedSearch) return null

        set((state) => ({
          savedSearches: state.savedSearches.map((s) =>
            s.id === id
              ? { ...s, lastUsed: Date.now(), useCount: s.useCount + 1 }
              : s
          )
        }))

        return savedSearch.query
      },

      addRecentSearch: (query) => {
        if (!query.trim()) return

        set((state) => {
          const recentSearches = [query, ...state.recentSearches.filter((q) => q !== query)].slice(0, 10)
          return { recentSearches }
        })
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      getRecentSearches: () => {
        return get().recentSearches
      },

      updatePopularTerms: (term) => {
        if (!term.trim()) return

        set((state) => {
          const existing = state.popularTerms.find((t) => t.term === term)
          if (existing) {
            return {
              popularTerms: state.popularTerms.map((t) =>
                t.term === term ? { ...t, count: t.count + 1 } : t
              )
            }
          } else {
            return {
              popularTerms: [...state.popularTerms, { term, count: 1 }].slice(0, 20)
            }
          }
        })
      },

      getPopularTerms: (limit = 10) => {
        return [...get().popularTerms]
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
      },

      getSuggestions: (partial) => {
        const suggestions: SearchSuggestion[] = []
        const lowerPartial = partial.toLowerCase()

        const recentMatches = get().recentSearches
          .filter((q) => q.toLowerCase().includes(lowerPartial))
          .slice(0, 3)
          .map((text) => ({ text, type: 'recent' as const }))

        const popularMatches = get().popularTerms
          .filter((t) => t.term.toLowerCase().includes(lowerPartial))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map((t) => ({ text: t.term, type: 'popular' as const, count: t.count }))

        suggestions.push(...recentMatches, ...popularMatches)

        return suggestions.slice(0, 5)
      },

      clearResults: () => set({ results: [], totalResults: 0, searchTime: 0 }),

      exportSearchData: () => {
        const state = get()
        return JSON.stringify({
          savedSearches: state.savedSearches,
          recentSearches: state.recentSearches,
          popularTerms: state.popularTerms.slice(0, 20)
        }, null, 2)
      },

      importSearchData: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.savedSearches && Array.isArray(data.savedSearches)) {
            set({ savedSearches: data.savedSearches })
          }
          if (data.recentSearches && Array.isArray(data.recentSearches)) {
            set({ recentSearches: data.recentSearches })
          }
          if (data.popularTerms && Array.isArray(data.popularTerms)) {
            set({ popularTerms: data.popularTerms })
          }
          return true
        } catch {
          return false
        }
      }
    }),
    {
      name: 'cyber-guardians-search',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
)
