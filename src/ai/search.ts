import { getLevels, getCharacters, getGameMeta } from '@/data/gameData'
import type { AIMessage } from '@/types/ai'

export interface SearchResult {
  title: string
  snippet: string
  source: 'game' | 'web'
  url?: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  summary: string
}

function searchGameContent(query: string): SearchResult[] {
  const results: SearchResult[] = []
  const q = query.toLowerCase()

  const chars = getCharacters()
  for (const [id, char] of Object.entries(chars)) {
    const name = (char as any).name || id
    const role = (char as any).role || ''
    const personality = (char as any).personality || ''
    if (q.includes(name.toLowerCase()) || q.includes(role.toLowerCase()) || q.includes(id)) {
      results.push({
        title: `شخصية: ${name}`,
        snippet: `${role} — ${personality}`,
        source: 'game',
      })
    }
  }

  const levels = getLevels()
  for (const level of levels) {
    const title = (level as any).title || ''
    const subtitle = (level as any).subtitle || ''
    const threat = (level as any).threat || ''
    const intro = Array.isArray((level as any).intro)
      ? (level as any).intro.map((i: any) => i.text).join(' ')
      : ''
    const combined = `${title} ${subtitle} ${threat} ${intro}`.toLowerCase()
    if (q.split(' ').some((w: string) => w.length > 2 && combined.includes(w))) {
      results.push({
        title: `مستوى ${level.id}: ${title}`,
        snippet: `${subtitle} — التهديد: ${threat}`,
        source: 'game',
      })
    }
  }

  const meta = getGameMeta() as any
  const metaText = `${meta.gameTitle || ''} ${meta.gameSubtitle || ''} ${meta.difficulty || ''}`.toLowerCase()
  if (q.split(' ').some((w: string) => w.length > 2 && metaText.includes(w))) {
    results.push({
      title: `اللعبة: ${meta.gameTitle || 'Cyber Guardians'}`,
      snippet: `${meta.gameSubtitle || ''} — الإصدار: ${meta.gameVersion || ''}`,
      source: 'game',
    })
  }

  return results.slice(0, 5)
}

async function searchWebDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`)
    if (!res.ok) return []
    const data = await res.json()
    const results: SearchResult[] = []

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText.slice(0, 500),
        source: 'web',
        url: data.AbstractURL,
      })
    }

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.slice(0, 100),
            snippet: topic.Text.slice(0, 500),
            source: 'web',
            url: topic.FirstURL,
          })
        }
      }
    }

    if (data.Answer) {
      results.unshift({
        title: data.Heading || 'إجابة DuckDuckGo',
        snippet: data.Answer,
        source: 'web',
        url: data.AnswerURL,
      })
    }

    if (results.length === 0 && data.AbstractURL) {
      results.push({
        title: query,
        snippet: `لم يتم العثور على نتائج مباشرة. جرّب البحث في: ${data.AbstractURL || 'Google'}`,
        source: 'web',
        url: data.AbstractURL,
      })
    }

    return results.slice(0, 6)
  } catch {
    return []
  }
}

export async function search(query: string): Promise<SearchResponse> {
  const gameResults = searchGameContent(query)
  const webResults = await searchWebDuckDuckGo(query)
  const allResults = [...gameResults, ...webResults]

  const summary = allResults.length > 0
    ? `تم العثور على ${allResults.length} نتيجة:`
    : `لم يتم العثور على نتائج لـ "${query}"`

  return { query, results: allResults, summary }
}

export async function advancedSearch(query: string): Promise<SearchResponse> {
  const r1 = await search(query)

  if (r1.results.length >= 2) {
    return r1
  }

  const keywords = query.split(' ').filter((w: string) => w.length > 3)
  const refinedQuery = keywords.length > 1 ? keywords.join(' ') : query
  const r2 = await search(refinedQuery)

  const seen = new Set<string>()
  const merged: SearchResult[] = []
  for (const r of [...r1.results, ...r2.results]) {
    const key = r.title + r.snippet
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(r)
    }
  }

  return {
    query,
    results: merged.slice(0, 8),
    summary: `بحث متقدم: تم العثور على ${merged.length} نتيجة من جولتين`,
  }
}

export function buildSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return ''

  const lines = results.map((r, i) => {
    const source = r.source === 'game' ? '[لعبة]' : '[ويب]'
    const url = r.url ? ` (${r.url})` : ''
    return `${i + 1}. ${source} ${r.title}: ${r.snippet}${url}`
  })

  return `\n\nنتائج البحث المتوفرة:\n${lines.join('\n')}\n`
}

export function buildSearchAugmentedMessages(
  originalMessages: AIMessage[],
  searchResults: SearchResult[]
): AIMessage[] {
  if (searchResults.length === 0) return originalMessages

  const searchContext = buildSearchContext(searchResults)
  const systemMsg = originalMessages.find((m) => m.role === 'system')
  const otherMsgs = originalMessages.filter((m) => m.role !== 'system')

  if (systemMsg) {
    return [
      { ...systemMsg, content: systemMsg.content + searchContext },
      ...otherMsgs,
    ]
  }

  return [
    { role: 'system', content: `استخدم نتائج البحث التالية للإجابة:${searchContext}` },
    ...originalMessages,
  ]
}
