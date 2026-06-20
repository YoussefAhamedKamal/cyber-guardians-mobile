import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type {
  AIAssistantState,
  SummaryResult,
  SmartSearchResult,
  SummaryOptions
} from '@/types/aiAssistant'
import {
  DEFAULT_AI_ASSISTANT_STATE,
  generateId,
  createSummary,
  extractKeywords
} from '@/types/aiAssistant'
import { useSkillStore } from './skillStore'
import { usePluginStore } from './pluginStore'
import { useProjectStore } from './projectStore'

type AIAssistantStore = AIAssistantState

export const useAIAssistantStore = create<AIAssistantStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_AI_ASSISTANT_STATE,

      summarize: (text, options = {}) => {
        const state = get()
        const mergedOptions: SummaryOptions = {
          maxLength: options.maxLength || 200,
          minLength: options.minLength || 100,
          language: options.language || state.userPreferences.language,
          style: options.style || state.userPreferences.summaryStyle || 'key-points',
          includeKeywords: options.includeKeywords ?? true,
          includeSentiment: options.includeSentiment ?? true
        }

        const summary = createSummary(text, mergedOptions)

        set((state) => ({
          summaries: [summary, ...state.summaries].slice(0, 50)
        }))

        return summary
      },

      smartSearch: (query) => {
        const keywords = extractKeywords(query, 3)
        const suggestions = get().getSuggestions(query)

        // Search across all stores for real results
        const results: SmartSearchResult['results'] = []

        // Search skills
        try {
          const skills = useSkillStore.getState().skills || []
          skills.forEach((skill: { id: string; name: string; description: string }) => {
            const text = `${skill.name} ${skill.description}`.toLowerCase()
            if (keywords.some(k => text.includes(k.toLowerCase())) || text.includes(query.toLowerCase())) {
              const matchCount = keywords.filter(k => text.includes(k.toLowerCase())).length
              const relevance = 0.7 + (matchCount / Math.max(keywords.length, 1)) * 0.3
              results.push({
                id: skill.id,
                title: skill.name,
                snippet: skill.description.substring(0, 150),
                relevance,
                source: 'القدرات'
              })
            }
          })
        } catch {}

        // Search plugins
        try {
          const plugins = usePluginStore.getState().plugins || []
          plugins.forEach((plugin: { id: string; name: string; description: string }) => {
            const text = `${plugin.name} ${plugin.description}`.toLowerCase()
            if (keywords.some(k => text.includes(k.toLowerCase())) || text.includes(query.toLowerCase())) {
              const matchCount = keywords.filter(k => text.includes(k.toLowerCase())).length
              const relevance = 0.6 + (matchCount / Math.max(keywords.length, 1)) * 0.3
              results.push({
                id: plugin.id,
                title: plugin.name,
                snippet: plugin.description.substring(0, 150),
                relevance,
                source: 'الأدوات'
              })
            }
          })
        } catch {}

        // Search knowledge
        try {
          const knowledge = useProjectStore.getState().knowledge || []
          knowledge.forEach((k: { id: string; name: string; content: string }) => {
            const text = `${k.name} ${k.content}`.toLowerCase()
            if (keywords.some(kw => text.includes(kw.toLowerCase())) || text.includes(query.toLowerCase())) {
              const matchCount = keywords.filter(kw => text.includes(kw.toLowerCase())).length
              const relevance = 0.5 + (matchCount / Math.max(keywords.length, 1)) * 0.3
              results.push({
                id: k.id,
                title: k.name,
                snippet: k.content.substring(0, 150),
                relevance,
                source: 'المعرفة'
              })
            }
          })
        } catch {}

        // If no results found, generate suggestion-based results
        if (results.length === 0) {
          results.push({
            id: generateId(),
            title: `نتائج لـ "${query}"`,
            snippet: `لم يتم العثور على نتائج مباشرة. جرب كلمات مفتاحية مختلفة.`,
            relevance: 0.5,
            source: 'AI Assistant'
          })
        }

        results.sort((a, b) => b.relevance - a.relevance)

        const result: SmartSearchResult = {
          id: generateId(),
          query,
          results: results.slice(0, 10),
          suggestions,
          relatedTopics: keywords,
          timestamp: Date.now()
        }

        set((state) => ({
          smartSearches: [result, ...state.smartSearches].slice(0, 20)
        }))

        return result
      },

      getSuggestions: (context) => {
        const state = get()
        const suggestions: string[] = []

        const contextKeywords = extractKeywords(context, 3)
        contextKeywords.forEach((keyword) => {
          suggestions.push(`ما هو ${keyword}؟`)
          suggestions.push(`كيف أستخدم ${keyword}؟`)
          suggestions.push(`أمثلة على ${keyword}`)
        })

        const topicSuggestions = [
          'شرح مبسط',
          'أمثلة عملية',
          'نصائح متقدمة',
          'مقارنة مع alternatives',
          'أفضل الممارسات'
        ]

        suggestions.push(...topicSuggestions)

        const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8)

        set({ recentSuggestions: uniqueSuggestions })

        return uniqueSuggestions
      },

      getRecentSummaries: (limit = 10) => {
        return get().summaries.slice(0, limit)
      },

      clearSummaries: () => set({ summaries: [] }),
      clearSmartSearches: () => set({ smartSearches: [] }),

      setSummaryStyle: (style) => {
        set((state) => ({
          userPreferences: { ...state.userPreferences, summaryStyle: style }
        }))
      },

      setLanguage: (lang) => {
        set((state) => ({
          userPreferences: { ...state.userPreferences, language: lang }
        }))
      },

      toggleAutoSummarize: () => {
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            autoSummarize: !state.userPreferences.autoSummarize
          }
        }))
      }
    }),
    {
      name: 'cyber-guardians-ai-assistant',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
)
