import type { Skill } from './skills'
import type { Plugin } from './plugins'
import type { Connector } from './connectors'
import type { ProjectKnowledge, ProjectInstructions } from './project'
import type { Change } from './versionHistory'
import type { UsageRecord } from './analytics'

export type SearchableItemType = 'skill' | 'plugin' | 'connector' | 'knowledge' | 'instructions' | 'change' | 'usage'

export interface SearchResult {
  id: string
  type: SearchableItemType
  title: string
  description: string
  matchScore: number
  matchHighlights: SearchHighlight[]
  data: unknown
  timestamp?: number
}

export interface SearchHighlight {
  field: string
  snippet: string
  start: number
  end: number
}

export interface SearchFilter {
  types: SearchableItemType[]
  dateRange?: { from: number; to: number }
  tags?: string[]
  categories?: string[]
  limit?: number
  offset?: number
}

export interface SearchQuery {
  query: string
  filters: SearchFilter
  operators: SearchOperator[]
}

export interface SearchOperator {
  type: 'exact' | 'prefix' | 'suffix' | 'contains' | 'regex' | 'exclude'
  field: string | null
  value: string
}

export interface SavedSearch {
  id: string
  name: string
  query: SearchQuery
  createdAt: number
  lastUsed: number
  useCount: number
}

export interface SearchSuggestion {
  text: string
  type: 'recent' | 'popular' | 'autocomplete'
  count?: number
}

export interface SearchState {
  results: SearchResult[]
  savedSearches: SavedSearch[]
  recentSearches: string[]
  popularTerms: { term: string; count: number }[]
  isSearching: boolean
  lastQuery: string | null
  totalResults: number
  searchTime: number

  search: (query: string, filters?: Partial<SearchFilter>) => SearchResult[]
  searchWithOperators: (query: SearchQuery) => SearchResult[]

  saveSearch: (name: string, query: SearchQuery) => void
  deleteSavedSearch: (id: string) => void
  getSavedSearches: () => SavedSearch[]
  useSavedSearch: (id: string) => SearchQuery | null

  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  getRecentSearches: () => string[]

  updatePopularTerms: (term: string) => void
  getPopularTerms: (limit?: number) => { term: string; count: number }[]

  getSuggestions: (partial: string) => SearchSuggestion[]

  clearResults: () => void
  exportSearchData: () => string
  importSearchData: (json: string) => boolean
}

export const DEFAULT_SEARCH_STATE: Omit<SearchState, 'search' | 'searchWithOperators' | 'saveSearch' | 'deleteSavedSearch' | 'getSavedSearches' | 'useSavedSearch' | 'addRecentSearch' | 'clearRecentSearches' | 'getRecentSearches' | 'updatePopularTerms' | 'getPopularTerms' | 'getSuggestions' | 'clearResults' | 'exportSearchData' | 'importSearchData'> = {
  results: [],
  savedSearches: [],
  recentSearches: [],
  popularTerms: [],
  isSearching: false,
  lastQuery: null,
  totalResults: 0,
  searchTime: 0
}

export function parseSearchQuery(raw: string): SearchQuery {
  const operators: SearchOperator[] = []
  let cleanQuery = raw

  const operatorPatterns = [
    { regex: /"([^"]+)"/g, type: 'exact' as const },
    { regex: /(\w+):(\w+)/g, type: 'contains' as const },
    { regex: /\-(\w+)/g, type: 'exclude' as const }
  ]

  operatorPatterns.forEach(({ regex, type }) => {
    let match
    while ((match = regex.exec(raw)) !== null) {
      operators.push({
        type,
        field: type === 'contains' ? (match[1] || null) : null,
        value: match[2] || match[1] || ''
      })
      cleanQuery = cleanQuery.replace(match[0], '')
    }
  })

  return {
    query: cleanQuery.trim(),
    filters: {
      types: ['skill', 'plugin', 'connector', 'knowledge', 'instructions', 'change', 'usage']
    },
    operators
  }
}

export function calculateMatchScore(query: string, text: string): number {
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()

  if (lowerText === lowerQuery) return 100
  if (lowerText.startsWith(lowerQuery)) return 90
  if (lowerText.includes(lowerQuery)) return 70

  const queryWords = lowerQuery.split(/\s+/)
  const textWords = lowerText.split(/\s+/)
  let matchCount = 0

  queryWords.forEach((word) => {
    if (textWords.some((tw) => tw.includes(word))) {
      matchCount++
    }
  })

  return (matchCount / queryWords.length) * 60
}

export function findHighlights(text: string, query: string): SearchHighlight[] {
  const highlights: SearchHighlight[] = []
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let startIndex = 0

  while (startIndex < lowerText.length) {
    const index = lowerText.indexOf(lowerQuery, startIndex)
    if (index === -1) break

    highlights.push({
      field: 'text',
      snippet: text.substring(Math.max(0, index - 20), Math.min(text.length, index + lowerQuery.length + 20)),
      start: index,
      end: index + lowerQuery.length
    })

    startIndex = index + lowerQuery.length
  }

  return highlights
}

export function generateSearchId(): string {
  return `search-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] || ''
}
