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

        const mockResults: SmartSearchResult['results'] = [
          {
            id: generateId(),
            title: `نتيجة لـ "${query}"`,
            snippet: `معلومات حول ${query}...`,
            relevance: 0.95,
            source: 'AI Assistant'
          }
        ]

        const result: SmartSearchResult = {
          id: generateId(),
          query,
          results: mockResults,
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
