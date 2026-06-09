import type { AIMessage, AIProviderDef } from '@/types/ai'
import { AI_PROVIDERS } from '@/types/ai'

function getProvider(providerId: string): AIProviderDef | undefined {
  return AI_PROVIDERS.find((p) => p.id === providerId)
}

function buildMessageContent(m: AIMessage): string | Array<{ type: string; text?: string; image_url?: { url: string } }> {
  const imageAtts = m.attachments?.filter((a) => a.type === 'image' && a.content)
  if (!imageAtts || imageAtts.length === 0) return m.content

  const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = []
  if (m.content) parts.push({ type: 'text', text: m.content })
  for (const att of imageAtts) {
    parts.push({ type: 'image_url', image_url: { url: att.content } })
  }
  return parts
}

function buildBody(modelId: string, messages: AIMessage[], _customBaseUrl: string, maxTokens?: number) {
  const body: Record<string, any> = {
    model: modelId,
    messages: messages.map((m) => ({ role: m.role, content: buildMessageContent(m) })),
    temperature: 0.7,
  }
  if (maxTokens && maxTokens > 0) {
    body.max_tokens = maxTokens
  }
  return body
}

export async function sendChatMessage(
  providerId: string,
  modelId: string,
  messages: AIMessage[],
  apiKey: string,
  customBaseUrl: string,
  signal?: AbortSignal
): Promise<string> {
  const provider = getProvider(providerId)
  if (!provider) throw new Error('مزود AI غير معروف')

  let baseUrl = provider.baseUrl
  if (providerId === 'custom' && customBaseUrl) {
    baseUrl = customBaseUrl
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
  const body = buildBody(modelId, messages, customBaseUrl)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'Cyber Guardians'
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: signal ?? null,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`خطأ ${res.status}: ${errText || res.statusText}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('لم يتم استلام رد من النموذج')
  return content
}

export async function* streamChatMessage(
  providerId: string,
  modelId: string,
  messages: AIMessage[],
  apiKey: string,
  customBaseUrl: string,
  signal?: AbortSignal,
  maxTokens?: number
): AsyncGenerator<string> {
  const provider = getProvider(providerId)
  if (!provider) throw new Error('مزود AI غير معروف')

  let baseUrl = provider.baseUrl
  if (providerId === 'custom' && customBaseUrl) {
    baseUrl = customBaseUrl
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
  const body = { ...buildBody(modelId, messages, customBaseUrl, maxTokens ?? 4096), stream: true }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'Cyber Guardians'
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: signal ?? null,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`خطأ ${res.status}: ${errText || res.statusText}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('لا يدعم المتصفح التدفق')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === 'data: [DONE]') continue
      if (!trimmed.startsWith('data: ')) continue

      try {
        const json = JSON.parse(trimmed.slice(6))
        const content = json.choices?.[0]?.delta?.content || ''
        if (content) yield content
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export async function testConnection(
  providerId: string,
  modelId: string,
  apiKey: string,
  customBaseUrl: string,
): Promise<string> {
  const provider = getProvider(providerId)
  if (!provider) return '⚠️ مزود AI غير معروف'

  let baseUrl = provider.baseUrl
  if (providerId === 'custom' && customBaseUrl) {
    baseUrl = customBaseUrl
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'Cyber Guardians'
  }

  const body = {
    model: modelId,
    messages: [{ role: 'user', content: 'hi' }],
    max_tokens: 3,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return `⚠️ خطأ ${res.status}: ${errText.slice(0, 200) || res.statusText}`
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (content) return '✅ متصل — تم الاستجابة بنجاح'
    return '✅ متصل (استجابة غير متوقعة)'
  } catch (err: any) {
    return `⚠️ فشل الاتصال: ${err?.message || 'خطأ غير معروف'}`
  }
}

export const AI_KEY_STORAGE_KEY = 'cg-ai-keys'
