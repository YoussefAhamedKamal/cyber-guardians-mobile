import type { AIMessage, AIProviderDef } from '@/types/ai'
import { AI_PROVIDERS } from '@/types/ai'
import { loadWorkerConfig, saveWorkerConfig, AI_WORKER_KEY } from '@/utils/workerCrypto'

const WORKER_CONFIG_KEY = AI_WORKER_KEY

export interface WorkerConfig {
  url: string
  authToken: string
}

let _workerCache: WorkerConfig | null = null
let _workerLoadAttempted = false

async function getWorkerConfig(): Promise<WorkerConfig | null> {
  if (_workerCache !== null) return _workerCache
  if (!_workerLoadAttempted) {
    _workerLoadAttempted = true
    _workerCache = await loadWorkerConfig(WORKER_CONFIG_KEY)
  }
  return _workerCache
}

export async function setWorkerConfig(config: WorkerConfig): Promise<void> {
  _workerCache = config
  _workerLoadAttempted = true
  await saveWorkerConfig(WORKER_CONFIG_KEY, config)
}

export async function getWorkerUrl(): Promise<string | null> {
  return (await getWorkerConfig())?.url || null
}

function getProvider(providerId: string): AIProviderDef | undefined {
  return AI_PROVIDERS.find((p) => p.id === providerId)
}

function validateCustomUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error('رابط مخصص فارغ')
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('رابط مخصص غير صالح')
  }
  if (parsed.protocol !== 'https:') throw new Error('يجب أن يبدأ الرابط بـ https://')
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') throw new Error('يُمنع الروابط المحلية')
  return parsed.origin
}

function summarizeFileContent(content: string, name: string, mimeType: string): string {
  const len = content.length
  if (len <= 4000) return content

  const lines = content.split('\n')
  const totalLines = lines.length

  if (mimeType.includes('json') || name.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content)
      const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : []
      const isArray = Array.isArray(parsed)
      const sample = JSON.stringify(isArray ? parsed.slice(0, 3) : parsed, null, 2).slice(0, 2000)
      const stats = isArray ? `مصفوفة (${parsed.length} عنصر)` : `كائن (${keys.length} حقل)`
      return `${stats}\nحقول: ${keys.slice(0, 20).join(', ')}\n\n--- عيّنة ---\n${sample}\n--- نهاية ---\n\n[الملف الأصلي: ${len.toLocaleString()} حرف / ${totalLines} سطر]`
    } catch {}
  }

  if (mimeType.includes('javascript') || mimeType.includes('typescript') || name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|rs|go)$/)) {
    const fns = lines.filter((l) => /^(function |const \w+ = |def |fn |func |class |interface |type |export )/.test(l.trim())).slice(0, 30)
    const imports = lines.filter((l) => /^(import |from |#include|use )/.test(l.trim())).slice(0, 15)
    const comments = lines.filter((l) => /^\s*(\/\/|#|\/\*|\*|""")/.test(l)).length
    const first = lines.slice(0, 20).join('\n')
    return `📦 بنية الملف (${totalLines} سطر):\n\nاستيراد:\n${imports.join('\n')}\n\nوظائف/كلاسات:\n${fns.join('\n')}\n\nملاحظات: ${comments} سطر\n\n--- بداية الملف ---\n${first}\n--- نهاية ---\n\n[الملف: ${len.toLocaleString()} حرف]`
  }

  if (mimeType.includes('csv') || name.endsWith('.csv')) {
    const headers = lines[0] || ''
    const sample = lines.slice(1, 6).join('\n')
    const numericCols = headers.split(',').length
    return `جدول (${totalLines - 1} صف / ${numericCols} عمود)\n\nالأعمدة: ${headers}\n\n--- عيّنة (أول 5 صفوف) ---\n${sample}\n--- نهاية ---\n\n[الملف: ${len.toLocaleString()} حرف]`
  }

  if (mimeType.includes('log') || name.endsWith('.log')) {
    const errors = lines.filter((l) => /error|fail|exception|critical/i.test(l)).slice(0, 20)
    const warnings = lines.filter((l) => /warn|warning/i.test(l)).slice(0, 10)
    const first = lines.slice(0, 10).join('\n')
    const last = lines.slice(-10).join('\n')
    return `📋 سجل (${totalLines} سطر)\n\nأخطاء (${errors.length}):\n${errors.join('\n') || 'لا توجد'}\n\nتحذيرات (${warnings.length}):\n${warnings.join('\n') || 'لا توجد'}\n\n--- بداية ---\n${first}\n--- نهاية ---\n\n--- آخر 10 أسطر ---\n${last}\n--- نهاية ---`
  }

  if (mimeType.includes('markdown') || name.endsWith('.md')) {
    const headings = lines.filter((l) => /^#{1,4}\s/.test(l)).slice(0, 30)
    const first = lines.slice(0, 30).join('\n')
    return `📝 Markdown (${totalLines} سطر)\n\nعناوين:\n${headings.join('\n')}\n\n--- بداية ---\n${first}\n--- نهاية ---\n\n[الملف: ${len.toLocaleString()} حرف]`
  }

  const first = lines.slice(0, 30).join('\n')
  const last = lines.slice(-15).join('\n')
  const middle = lines.slice(Math.floor(totalLines / 2) - 5, Math.floor(totalLines / 2) + 5).join('\n')
  return `📄 نص (${totalLines} سطر / ${len.toLocaleString()} حرف)\n\n--- بداية ---\n${first}\n--- نهاية ---\n\n--- منتصف ---\n${middle}\n--- نهاية ---\n\n--- آخر الأسطر ---\n${last}\n--- نهاية ---`
}

function buildMessageContent(m: AIMessage): string | Array<{ type: string; text?: string; image_url?: { url: string } }> {
  const atts = m.attachments?.filter((a) => a.content && a.uploadStatus === 'success')
  if (!atts || atts.length === 0) return m.content

  const hasVisual = atts.some((a) => a.type === 'image' || a.type === 'video')
  if (!hasVisual) {
    const textParts = atts.filter((a) => a.type === 'text' || a.type === 'file' || a.type === 'audio')
    if (textParts.length === 0) return m.content
    let text = m.content || ''
    for (const att of textParts) {
      if (att.type === 'audio') {
        text += `\n\n--- تحليل صوتي: ${att.name} ---\n${att.content}\n--- نهاية ---`
      } else {
        const summarized = summarizeFileContent(att.content, att.name, att.mimeType)
        text += `\n\n--- ملف: ${att.name} (${att.content.length.toLocaleString()} حرف) ---\n${summarized}\n--- نهاية الملف ---`
      }
    }
    return text
  }

  const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = []
  if (m.content) parts.push({ type: 'text', text: m.content })
  for (const att of atts) {
    if (att.type === 'image') {
      parts.push({ type: 'image_url', image_url: { url: att.content } })
    } else if (att.type === 'video') {
      const frames = att.content.split('|||').filter(Boolean)
      if (frames.length > 0) {
        parts.push({ type: 'text', text: `📋 إطارات من فيديو: ${att.name} (${frames.length} إطارات)` })
        for (const frame of frames) {
          parts.push({ type: 'image_url', image_url: { url: frame } })
        }
      }
    } else if (att.type === 'audio') {
      parts.push({ type: 'text', text: `\n--- تحليل صوتي: ${att.name} ---\n${att.content}` })
    } else if (att.type === 'text' || att.type === 'file') {
      const summarized = summarizeFileContent(att.content, att.name, att.mimeType)
      parts.push({ type: 'text', text: `\n--- ملف: ${att.name} (${att.content.length.toLocaleString()} حرف) ---\n${summarized}\n--- نهاية الملف ---` })
    }
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

async function proxyFetch(targetUrl: string, init: RequestInit, useDirectApi = false): Promise<Response> {
  const worker = await getWorkerConfig()
  if (!worker || !worker.url) {
    if (useDirectApi) {
      return fetch(targetUrl, init)
    }
    throw new Error('⚠️ Worker Proxy غير مُعد — افتح الإعدادات وأضف رابط Worker')
  }

  const proxyUrl = `${worker.url.replace(/\/+$/, '')}?target=${encodeURIComponent(targetUrl)}`
  const headers = new Headers(init.headers)
  headers.set('X-Auth-Token', worker.authToken)

  return fetch(proxyUrl, { ...init, headers })
}

export async function sendChatMessage(
  providerId: string,
  modelId: string,
  messages: AIMessage[],
  apiKey: string,
  customBaseUrl: string,
  signal?: AbortSignal,
  useDirectApi = false
): Promise<string> {
  const provider = getProvider(providerId)
  if (!provider) throw new Error('مزود AI غير معروف')

  let baseUrl = provider.baseUrl
  if (providerId === 'custom' && customBaseUrl) {
    baseUrl = validateCustomUrl(customBaseUrl)
  }

  const targetUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
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

  const res = await proxyFetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: signal ?? null,
  }, useDirectApi)

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
  maxTokens?: number,
  useDirectApi = false
): AsyncGenerator<string> {
  const provider = getProvider(providerId)
  if (!provider) throw new Error('مزود AI غير معروف')

  let baseUrl = provider.baseUrl
  if (providerId === 'custom' && customBaseUrl) {
    baseUrl = validateCustomUrl(customBaseUrl)
  }

  const targetUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
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

  const res = await proxyFetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: signal ?? null,
  }, useDirectApi)

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
  useDirectApi = false
): Promise<string> {
  const provider = getProvider(providerId)
  if (!provider) return '⚠️ مزود AI غير معروف'

  let baseUrl = provider.baseUrl
  if (providerId === 'custom' && customBaseUrl) {
    baseUrl = validateCustomUrl(customBaseUrl)
  }

  const targetUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`

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
    const res = await proxyFetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }, useDirectApi)

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
