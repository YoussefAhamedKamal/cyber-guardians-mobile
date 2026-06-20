export interface SummaryOptions {
  maxLength?: number
  minLength?: number
  language?: 'ar' | 'en'
  style?: 'bullet' | 'paragraph' | 'key-points'
  includeKeywords?: boolean
  includeSentiment?: boolean
}

export interface SummaryResult {
  id: string
  timestamp: number
  originalText: string
  summary: string
  keywords: string[]
  sentiment: SentimentResult
  keyPoints: string[]
  wordCount: {
    original: number
    summary: number
  }
  readingTime: {
    original: number
    summary: number
  }
}

export interface SentimentResult {
  score: number
  label: 'positive' | 'negative' | 'neutral'
  confidence: number
}

export interface SmartSearchResult {
  id: string
  query: string
  results: SearchResult[]
  suggestions: string[]
  relatedTopics: string[]
  timestamp: number
}

export interface SearchResult {
  id: string
  title: string
  snippet: string
  relevance: number
  source: string
  url?: string
}

export interface AIAssistantState {
  summaries: SummaryResult[]
  smartSearches: SmartSearchResult[]
  recentSuggestions: string[]
  userPreferences: {
    summaryStyle: SummaryOptions['style']
    language: 'ar' | 'en'
    autoSummarize: boolean
  }

  summarize: (text: string, options?: SummaryOptions) => SummaryResult
  smartSearch: (query: string) => SmartSearchResult
  getSuggestions: (context: string) => string[]
  getRecentSummaries: (limit?: number) => SummaryResult[]
  clearSummaries: () => void
  clearSmartSearches: () => void
  setSummaryStyle: (style: SummaryOptions['style']) => void
  setLanguage: (lang: 'ar' | 'en') => void
  toggleAutoSummarize: () => void
}

export const DEFAULT_AI_ASSISTANT_STATE: Omit<AIAssistantState, 'summarize' | 'smartSearch' | 'getSuggestions' | 'getRecentSummaries' | 'clearSummaries' | 'clearSmartSearches' | 'setSummaryStyle' | 'setLanguage' | 'toggleAutoSummarize'> = {
  summaries: [],
  smartSearches: [],
  recentSuggestions: [],
  userPreferences: {
    summaryStyle: 'key-points',
    language: 'ar',
    autoSummarize: false
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export function extractKeywords(text: string, limit = 5): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
    'the', 'في', 'من', 'على', 'إلى', 'عن', 'مع', 'بين', 'هذا', 'هذه',
    'التي', 'الذي', 'أن', 'إن', 'لا', 'ما', 'هل', 'كيف', 'ماذا', 'أين'
  ])

  const words = text.toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))

  const wordCounts: Record<string, number> = {}
  words.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word)
}

export function analyzeSentiment(text: string): SentimentResult {
  const positiveWords = new Set([
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
    'happy', 'joy', 'success', 'beautiful', 'perfect', 'best', 'awesome',
    'ممتاز', 'جيد', 'رائع', 'جميل', 'سعيد', 'نجاح', 'أفضل', 'مذهل'
  ])

  const negativeWords = new Set([
    'bad', 'terrible', 'horrible', 'awful', 'hate', 'sad', 'failure',
    'ugly', 'worst', 'poor', 'disappointing', 'wrong', 'error', 'bug',
    'سيء', 'فظيع', 'محزن', 'فشل', 'خطأ', 'مشكلة', 'أخبر', ' worst'
  ])

  const words = text.toLowerCase().split(/\s+/)
  let positiveCount = 0
  let negativeCount = 0

  words.forEach((word) => {
    if (positiveWords.has(word)) positiveCount++
    if (negativeWords.has(word)) negativeCount++
  })

  const total = positiveCount + negativeCount
  const score = total === 0 ? 0 : (positiveCount - negativeCount) / total

  let label: SentimentResult['label'] = 'neutral'
  if (score > 0.2) label = 'positive'
  else if (score < -0.2) label = 'negative'

  const confidence = total === 0 ? 0.5 : Math.min(total / words.length * 10, 1)

  return { score, label, confidence }
}

export function createSummary(
  text: string,
  options: SummaryOptions = {}
): SummaryResult {
  const {
    maxLength = 200,
    language = 'ar',
    style = 'key-points',
    includeKeywords = true,
    includeSentiment = true
  } = options

  const sentences = text.split(/[.!?。！？]+/).filter((s) => s.trim().length > 0)
  const words = text.split(/\s+/)
  const originalWordCount = words.length

  let summary = ''

  if (style === 'bullet') {
    const selectedSentences = sentences.slice(0, Math.min(3, sentences.length))
    summary = selectedSentences.map((s) => `• ${s.trim()}`).join('\n')
  } else if (style === 'paragraph') {
    const selectedSentences = sentences.slice(0, Math.min(2, sentences.length))
    summary = selectedSentences.join('. ').trim()
  } else {
    const selectedSentences = sentences.slice(0, Math.min(4, sentences.length))
    summary = selectedSentences.map((s) => `• ${s.trim()}`).join('\n')
  }

  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...'
  }

  const keywords = includeKeywords ? extractKeywords(text) : []
  const sentiment = includeSentiment ? analyzeSentiment(text) : { score: 0, label: 'neutral' as const, confidence: 0 }
  const keyPoints = sentences.slice(0, 3).map((s) => s.trim())

  const summaryWordCount = summary.split(/\s+/).length

  return {
    id: generateId(),
    timestamp: Date.now(),
    originalText: text,
    summary,
    keywords,
    sentiment,
    keyPoints,
    wordCount: {
      original: originalWordCount,
      summary: summaryWordCount
    },
    readingTime: {
      original: calculateReadingTime(text),
      summary: calculateReadingTime(summary)
    }
  }
}
