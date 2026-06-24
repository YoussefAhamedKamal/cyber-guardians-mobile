import { useSkillStore } from '@/store/skillStore'
import { usePluginStore } from '@/store/pluginStore'
import { useConnectorStore } from '@/store/connectorStore'
import { useProjectStore } from '@/store/projectStore'
import { useLocalAgentStore } from '@/store/localAgentStore'
import { STUDENT_SYSTEM_PROMPT, FACULTY_SYSTEM_PROMPT } from './prompts'

function buildSkillsPluginsPrompt(basePrompt: string): string {
  const skillStore = useSkillStore.getState()
  const pluginStore = usePluginStore.getState()
  const connectorStore = useConnectorStore.getState()
  const projectStore = useProjectStore.getState()
  const agentStore = useLocalAgentStore.getState()

  const activeSkill = skillStore.activeSkillId
    ? skillStore.skills.find(s => s.id === skillStore.activeSkillId && s.enabled)
    : null

  const enabledPlugins = pluginStore.plugins.filter(p => p.enabled)
  const activeConnectors = connectorStore.connectors.filter(c => c.connected)

  let prompt = basePrompt

  // Add project-specific instructions and knowledge
  const projectPrompt = projectStore.buildProjectSystemPrompt(prompt)
  if (projectPrompt !== prompt) {
    prompt = projectPrompt
  }

  // Add Agent capabilities if connected
  if (agentStore.connected) {
    prompt += '\n\n--- LOCAL AGENT CONNECTED ---\n'
    prompt += 'الوكيل المحلي متصل على جهاز المستخدم وينفّذ المهام المعقدة محلياً!\n\n'
    prompt += '🔧 الأدوات المتاحة:\n'
    prompt += '🔍 فحص الكود: اكتب "افحص الكود" أو "scan" مع ذكر اللغة والأداة\n'
    prompt += '📦 بحث عن مهارات: اكتب "ابحث عن مهارة" مع الاستعلام\n'
    prompt += '⚡ تنفيذ أمر: اكتب "نفّذ الأمر" مع الأمر المطلوب\n'
    prompt += '📥 تثبيت مهارة: اكتب "ثبّت مهارة" مع اسم الحزمة\n\n'
    prompt += '📋 فئات المهارات المثبتة (257+):\n'
    prompt += '- أمن سيبراني: semgrep, codeql, slither, libfuzzer\n'
    prompt += '- برمجة: react, nextjs, vue, angular, python, rust, go\n'
    prompt += '- تصميم واجهات: ui-ux, figma, tailwind, css\n'
    prompt += '- DevOps: docker, kubernetes, ci/cd\n'
    prompt += '- ذكاء اصطناعي: langchain, openai, embeddings\n'
    prompt += '- موبايل: react-native, flutter, swift\n'
    prompt += '- وأكثر من 200 مهارة أخرى!\n\n'
    prompt += '💡 متى تستخدم الوكيل:\n'
    prompt += '1. طلب صريح: "استخدم الوكيل" أو "نفّذ محلياً"\n'
    prompt += '2. مهمة معقدة: بناء مشاريع، فحص كود، تنفيذ أوامر\n'
    prompt += '3. استخدام مهارة: "استخدم مهارة [الاسم]"\n'
    if (agentStore.tools.length > 0) {
      prompt += 'الأدوات: ' + agentStore.tools.map(t => t.name).join(', ') + '\n'
    }
    prompt += '--- END LOCAL AGENT ---\n'
  }

  if (activeSkill) {
    prompt += '\n\n--- ACTIVE SKILL ---\n'
    prompt += 'Name: ' + activeSkill.icon + ' ' + activeSkill.name + '\n'
    prompt += 'Description: ' + activeSkill.description + '\n'
    prompt += 'Instructions:\n' + activeSkill.systemPrompt + '\n'
    prompt += '--- END SKILL ---\n'
    prompt += 'Use this skill in your responses. Follow the instructions above.\n'
  }

  // Always tell AI about built-in tools (even if plugins not enabled)
  prompt += '\n\n--- BUILT-IN TOOLS (always available, work automatically) ---\n'
  prompt += '⚠️ IMPORTANT: These tools work AUTOMATICALLY. Do NOT suggest external tools.\n'
  prompt += '🖼️ IMAGE: When user asks for image → it generates automatically. Just say "Generating..." Do NOT suggest Canva/Pixelfox/etc.\n'
  prompt += '🎬 VIDEO: When user asks for video → it generates automatically. Just say "Generating..."\n'
  prompt += '📄 OCR: When user attaches image + asks for text → text appears automatically\n'
  prompt += '🔍 SEARCH: When user asks to search → results appear automatically\n'
  prompt += '🕸️ SCRAPE: When user asks to read a URL → content appears automatically\n'
  prompt += '📊 CHART: When user asks for chart → chart appears automatically\n'
  prompt += '--- END BUILT-IN TOOLS ---\n'

  if (enabledPlugins.length > 0) {
    prompt += '\n\n--- AVAILABLE PLUGINS ---\n'
    for (const plugin of enabledPlugins) {
      prompt += plugin.icon + ' ' + plugin.name + ': ' + plugin.description + '\n'
      for (const ep of plugin.endpoints) {
        prompt += '  - ' + ep.name + ': ' + ep.description + ' (' + ep.method + ' ' + ep.path + ')\n'
      }
    }
    prompt += '--- END PLUGINS ---\n'
  }

  if (activeConnectors.length > 0) {
    prompt += '\n\n--- ACTIVE CONNECTORS ---\n'
    for (const conn of activeConnectors) {
      prompt += conn.icon + ' ' + conn.name + ': ' + conn.description + ' (Connected)\n'
    }
    prompt += '--- END CONNECTORS ---\n'
  }

  return prompt
}

export function buildActiveSkillPrompt(): string {
  return buildSkillsPluginsPrompt(STUDENT_SYSTEM_PROMPT)
}

export function buildFacultySystemPrompt(): string {
  return buildSkillsPluginsPrompt(FACULTY_SYSTEM_PROMPT)
}

export function detectSkillRequest(message: string): string | null {
  const skillStore = useSkillStore.getState()
  const lowerMsg = message.toLowerCase()

  const skillKeywords: Record<string, string[]> = {
    'translator': ['translate', 'translation', 'ترجم'],
    'code_analyzer': ['analyze code', 'code analysis', 'review code', 'تحليل كود'],
    'summarizer': ['summarize', 'summary', 'tldr', 'لخص', 'ملخص'],
    'math_solver': ['calculate', 'math', 'solve', 'equation', 'احسب', 'رياضيات'],
    'email_writer': ['write email', 'compose email', 'draft email', 'اكتب بريد'],
    'researcher': ['research', 'investigate', 'study', 'ابحث', 'دراسة'],
    'creative_writer': ['write story', 'creative writing', 'poem', 'fiction', 'اكتب قصة', 'شعر'],
    'data_analyst': ['data analysis', 'analyze data', 'statistics', 'تحليل بيانات'],
    'cybersecurity_expert': ['vulnerability', 'security audit', 'penetration', 'hack', 'exploit', 'ثغرة', 'اختراق'],
    'teacher': ['explain', 'teach', 'learn', 'understand', 'tutorial', 'اشرح', 'تعلم'],
    'content_writer': ['write article', 'blog post', 'content writing', 'اكتب مقال'],
    'software_engineer': ['develop', 'build app', 'create software', 'programming', 'code', 'برمج', 'طور'],
    'image_generator': ['generate image', 'create image', 'draw', 'picture', 'image', 'صور', 'صورة'],
  }

  for (const skill of skillStore.skills) {
    if (!skill.enabled) continue

    // Try template ID first
    const keywords = skillKeywords[skill.id] || []

    // Also try matching by skill name for custom skills
    const nameLower = skill.name.toLowerCase()
    const descLower = skill.description.toLowerCase()

    const hasKeyword = keywords.some(kw => lowerMsg.includes(kw)) ||
      lowerMsg.includes(nameLower) ||
      lowerMsg.includes(descLower)

    if (hasKeyword) {
      return skill.id
    }
  }

  return null
}

export async function generateImageWithPollinations(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Date.now()}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Pollinations API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function generateImagePuter(prompt: string): Promise<string> {
  // @ts-ignore — Puter.js loaded dynamically
  if (typeof puter === 'undefined' || !puter.ai?.txt2img) {
    throw new Error('Puter.js not loaded — ضع <script src="https://js.puter.com/v2/"></script> في HTML')
  }
  // @ts-ignore
  const blob = await puter.ai.txt2img(prompt)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function generateImageStableDiffusion(prompt: string): Promise<string> {
  // Use Pollinations as proxy for Stable Diffusion models
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Stable Diffusion API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export type ImageProvider = 'pollinations' | 'puter' | 'stable_diffusion'

export async function generateImage(prompt: string, provider: ImageProvider = 'pollinations'): Promise<string> {
  switch (provider) {
    case 'puter': return generateImagePuter(prompt)
    case 'stable_diffusion': return generateImageStableDiffusion(prompt)
    case 'pollinations':
    default: return generateImageWithPollinations(prompt)
  }
}

// ==================== VIDEO GENERATION ====================

async function generateVideoPollinations(prompt: string, model = 'veo', duration = 4): Promise<string> {
  const encoded = encodeURIComponent(prompt)
  const url = `https://gen.pollinations.ai/video/${encoded}?model=${model}&duration=${duration}&nologo=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Pollinations Video API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function generateVideoStableDiffusion(prompt: string): Promise<string> {
  // Use Pollinations with SVD/AnimateDiff models
  const encoded = encodeURIComponent(prompt)
  const url = `https://gen.pollinations.ai/video/${encoded}?model=wan-fast&duration=4&nologo=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Stable Video API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function generateVideoLoreMotion(prompt: string): Promise<string> {
  // LoreMotion uses LTX-Video — route through Pollinations ltx-2 model
  const encoded = encodeURIComponent(prompt)
  const url = `https://gen.pollinations.ai/video/${encoded}?model=ltx-2&duration=4&nologo=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`LoreMotion API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export type VideoProvider = 'pollinations' | 'stable_diffusion' | 'loremotion'
export const VIDEO_MODELS: Record<VideoProvider, string[]> = {
  pollinations: ['veo', 'seedance-pro', 'seedance-2.0', 'wan', 'wan-fast', 'wan-pro', 'ltx-2', 'grok-video-pro', 'nova-reel'],
  stable_diffusion: ['wan-fast', 'wan', 'ltx-2'],
  loremotion: ['ltx-2'],
}

export async function generateVideo(
  prompt: string,
  provider: VideoProvider = 'pollinations',
  model?: string,
  duration = 4
): Promise<string> {
  const resolvedModel = model || (provider === 'pollinations' ? 'veo' : 'ltx-2')
  switch (provider) {
    case 'stable_diffusion': return generateVideoStableDiffusion(prompt)
    case 'loremotion': return generateVideoLoreMotion(prompt)
    case 'pollinations':
    default: return generateVideoPollinations(prompt, resolvedModel, duration)
  }
}

// ==================== OCR TEXT EXTRACTION ====================

export async function extractTextOCR(dataUrlOrUrl: string): Promise<string> {
  const isDataUrl = dataUrlOrUrl.startsWith('data:')
  const body: Record<string, unknown> = {
    isOverlayRequired: false,
    language: 'eng+ara',
  }

  if (isDataUrl) {
    body.base64Image = dataUrlOrUrl
  } else {
    body.url = dataUrlOrUrl
  }

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'K85589610388957', // Free tier key (public, rate-limited)
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error(`OCR API error: ${response.status}`)

  const data = await response.json()
  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || 'OCR processing failed')
  }

  const parsedResults = data.ParsedResults
  if (!parsedResults || parsedResults.length === 0) {
    return 'لم يتم التعرف على أي نص في الصورة'
  }

  return parsedResults
    .map((r: { ParsedText: string }) => r.ParsedText)
    .join('\n\n')
    .trim()
}

// ==================== WEB SEARCH ====================

export interface SearchResult {
  title: string
  snippet: string
  url: string
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  // DuckDuckGo Instant Answer API
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  )
  if (!response.ok) throw new Error(`Search API error: ${response.status}`)
  const data = await response.json()

  const results: SearchResult[] = []

  // Abstract (main result)
  if (data.Abstract) {
    results.push({
      title: data.Heading || query,
      snippet: data.Abstract,
      url: data.AbstractURL || '',
    })
  }

  // Related topics
  if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics.slice(0, 8)) {
      if (topic.Text) {
        results.push({
          title: topic.Text.slice(0, 80),
          snippet: topic.Text,
          url: topic.FirstURL || '',
        })
      }
      // Sub-topics
      if (topic.Topics && Array.isArray(topic.Topics)) {
        for (const sub of topic.Topics.slice(0, 3)) {
          if (sub.Text) {
            results.push({
              title: sub.Text.slice(0, 80),
              snippet: sub.Text,
              url: sub.FirstURL || '',
            })
          }
        }
      }
    }
  }

  if (results.length === 0) {
    results.push({
      title: query,
      snippet: data.AbstractText || `لا توجد نتائج مباشرة لـ "${query}". جرب بحثاً أكثر تفصيلاً.`,
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    })
  }

  return results.slice(0, 10)
}

// ==================== WEB SCRAPER ====================

export async function scrapeWebPage(targetUrl: string): Promise<string> {
  // Use CORS proxy to fetch external pages
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
  ]

  let lastError: Error | null = null

  for (const proxyUrl of proxyUrls) {
    try {
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) })
      if (!response.ok) continue

      const html = await response.text()
      return extractContentFromHtml(html, targetUrl)
    } catch (err: any) {
      lastError = err
      continue
    }
  }

  throw new Error(`فشل جلب الصفحة: ${lastError?.message || 'جميع proxies غير متاحة'}`)
}

function extractContentFromHtml(html: string, sourceUrl: string): string {
  // Simple HTML content extraction
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Remove scripts, styles, nav, footer
  doc.querySelectorAll('script, style, nav, footer, header, aside, iframe').forEach(el => el.remove())

  // Extract title
  const title = doc.querySelector('title')?.textContent?.trim() || ''

  // Extract meta description
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || ''

  // Extract main content
  const article = doc.querySelector('article, main, .content, .post-content, .entry-content')
  const body = article || doc.body

  let text = ''
  if (body) {
    text = (body as HTMLElement).innerText || body.textContent || ''
  }

  // Clean up
  text = text.replace(/\s+/g, ' ').trim()

  // Truncate if too long
  if (text.length > 5000) {
    text = text.slice(0, 5000) + '\n\n[... مقتطع — المحتوى الأصلي أطول]'
  }

  let result = ''
  if (title) result += `**${title}**\n\n`
  if (metaDesc) result += `${metaDesc}\n\n`
  result += text || 'لم يتم استخراج محتوى من الصفحة.'

  return result
}

// ==================== CHART GENERATION ====================

export interface ChartData {
  labels: string[]
  datasets: { label: string; data: number[] }[]
}

export async function generateChart(
  data: ChartData,
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' = 'bar',
  title = ''
): Promise<string> {
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  // Create offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 500
  canvas.style.display = 'none'
  document.body.appendChild(canvas)

  const colors = [
    'rgba(79, 195, 247, 0.8)',
    'rgba(206, 147, 216, 0.8)',
    'rgba(129, 199, 132, 0.8)',
    'rgba(255, 183, 77, 0.8)',
    'rgba(229, 115, 115, 0.8)',
    'rgba(149, 117, 205, 0.8)',
    'rgba(255, 213, 79, 0.8)',
    'rgba(77, 182, 172, 0.8)',
  ]

  const getColor = (i: number): string => {
    const idx = i % colors.length
    const val = (colors as (string | undefined)[])[idx]
    return val !== undefined ? val : colors[0]!
  }
  const isPie = chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea'
  const datasets = data.datasets.map((ds, i) => ({
    ...ds,
    backgroundColor: isPie
      ? data.labels.map((_, j) => getColor(j))
      : getColor(i),
    borderColor: getColor(i).replace('0.8', '1'),
    borderWidth: 2,
  }))

  new Chart(canvas, {
    type: chartType,
    data: { labels: data.labels, datasets },
    options: {
      responsive: false,
      plugins: {
        title: { display: !!title, text: title, color: '#333', font: { size: 16 } },
        legend: { labels: { color: '#333' } },
      },
      scales: chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea' ? {} : {
        x: { ticks: { color: '#666' } },
        y: { ticks: { color: '#666' }, beginAtZero: true },
      },
    },
  })

  // Wait for render
  await new Promise(r => setTimeout(r, 500))

  const dataUrl = canvas.toDataURL('image/png')
  document.body.removeChild(canvas)

  return dataUrl
}

// ==================== PLUGIN REQUEST DETECTION ====================

export function detectPluginRequest(message: string): { pluginId: string; endpointId: string; params: Record<string, string> } | null {
  const pluginStore = usePluginStore.getState()
  const lowerMsg = message.toLowerCase()

  // Arabic + English keywords for each plugin
  const pluginKeywords: Record<string, { keywords: string[]; endpoint: string; paramExtractors: Record<string, (msg: string) => string | null> }> = {
    'calculator': {
      keywords: ['حاسبة', 'احسب', 'حساب', 'calculate', 'math', 'solve'],
      endpoint: 'calculate',
      paramExtractors: {
        expr: (msg): string | null => {
          const mathMatch = msg.match(/(\d+[\s]*[\+\-\*\/\^][\s]*\d+(?:[\s]*[\+\-\*\/\^][\s]*\d+)*)/)
          return mathMatch?.[1] ?? null
        }
      }
    },
    'image_generator': {
      keywords: ['صورة', 'صور', 'توليد صورة', 'ارسم', 'تخيّل', 'اخلق صورة', 'صمم صورة', 'image', 'picture', 'generate image', 'draw'],
      endpoint: 'generate',
      paramExtractors: {
        prompt: (msg): string | null => {
          // Try English pattern first
          const enMatch = msg.match(/(?:generate|create|draw|image|picture)\s+(.+)/i)
          if (enMatch?.[1]) return enMatch[1]
          // Try Arabic patterns: "صورة لـ X" or "ارسم X" or "تخيّل X" or "اخلق صورة X"
          const arMatch = msg.match(/(?:صورة|صور|توليد صورة|ارسم|تخيّل|اخلق صورة|صمم صورة)\s+(?:لـ|ل|لل|عن|من)\s*(.+)/i)
          if (arMatch?.[1]) return arMatch[1]
          // Try without preposition: "صورة بتراء"
          const arMatch2 = msg.match(/(?:صورة|صور|توليد صورة|ارسم|تخيّل|اخلق صورة|صمم صورة)\s+(.+)/i)
          if (arMatch2?.[1]) return arMatch2[1]
          // Fallback: use the whole message as prompt
          return msg
        }
      }
    },
    'chart_generator': {
      keywords: ['رسم بياني', 'رسم بيانية', 'رسوم بيانية', 'chart', 'graph', ' bar chart', 'pie chart'],
      endpoint: 'create_chart',
      paramExtractors: {
        data: (msg): string => {
          const numMatch = msg.match(/(\d+(?:\s*,\s*\d+)*)/)
          return numMatch?.[1] ? JSON.stringify({ labels: numMatch[1].split(',').map((_, i) => `#${i + 1}`), datasets: [{ label: 'بيانات', data: numMatch[1].split(',').map(Number) }] }) : '{}'
        },
        type: (msg): string => {
          const lower = msg.toLowerCase()
          if (lower.includes('خطي') || lower.includes('line')) return 'line'
          if (lower.includes('عمودي') || lower.includes('bar')) return 'bar'
          if (lower.includes('دائري') || lower.includes('pie') || lower.includes('cake')) return 'pie'
          if (lower.includes('doughnut') || lower.includes('donut')) return 'doughnut'
          return 'bar'
        },
        title: (msg): string => {
          const titleMatch = msg.match(/(?:عنوان|title|اسم)[:\s]*(.+)/i)
          return titleMatch?.[1]?.trim() || ''
        }
      }
    },
    'web_scraper': {
      keywords: ['استخراج', 'جلب صفحة', 'محتوى موقع', 'scrape', 'fetch', 'اقرأ الصفحة', 'افتح الموقع'],
      endpoint: 'scrape',
      paramExtractors: {
        url: (msg): string | null => {
          const urlMatch = msg.match(/(https?:\/\/[^\s]+)/)
          return urlMatch?.[1] ?? null
        }
      }
    },
    'search_engine': {
      keywords: ['ابحث عن', 'بحث', 'search', 'find', 'وشو', 'إيش هو', 'من هو', 'ما هو'],
      endpoint: 'search',
      paramExtractors: {
        q: (msg): string => msg.replace(/^(ابحث عن|بحث عن|search|find|وشو|إيش هو|من هو|ما هو)\s*/i, '') || msg
      }
    },
    'stats_analyzer': {
      keywords: ['إحصائيات', 'تحليل بيانات', 'statistics', 'analyze data'],
      endpoint: 'analyze',
      paramExtractors: {
        expr: (msg): string | null => {
          const numMatch = msg.match(/(\d+(?:\s*,\s*\d+)*)/)
          return numMatch?.[1] ? `mean([${numMatch[1]}])` : null
        }
      }
    },
    'api_caller': {
      keywords: ['استدعاء api', 'طلب http', 'api call', 'fetch'],
      endpoint: 'call_api',
      paramExtractors: {
        url: (msg): string | null => {
          const urlMatch = msg.match(/(https?:\/\/[^\s]+)/)
          return urlMatch?.[1] ?? null
        }
      }
    },
    'video_generator': {
      keywords: ['فيديو', 'فيديو لـ', 'حرّك', '-animate', 'video', 'animate', 'movie', 'คลิป'],
      endpoint: 'generate',
      paramExtractors: {
        prompt: (msg): string | null => {
          // English: "video of X" or "animate X"
          const enMatch = msg.match(/(?:video|animate|movie)\s+(?:of\s+)?(.+)/i)
          if (enMatch?.[1]) return enMatch[1]
          // Arabic: "فيديو لـ X" or "حرّك X"
          const arMatch = msg.match(/(?:فيديو|فيديو لـ|حرّك|-animate)\s+(?:لـ|ل|لل|عن|من)?\s*(.+)/i)
          if (arMatch?.[1]) return arMatch[1]
          return msg
        },
        provider: (msg): string | null => {
          const lower = msg.toLowerCase()
          if (lower.includes('loremotion') || lower.includes('لور موشن')) return 'loremotion'
          if (lower.includes('stable') || lower.includes('ستايبل')) return 'stable_diffusion'
          return 'pollinations'
        },
        model: (msg): string | null => {
          const lower = msg.toLowerCase()
          if (lower.includes('veo')) return 'veo'
          if (lower.includes('seedance')) return 'seedance-pro'
          if (lower.includes('wan')) return 'wan'
          if (lower.includes('ltx')) return 'ltx-2'
          if (lower.includes('grok')) return 'grok-video-pro'
          if (lower.includes('nova')) return 'nova-reel'
          return null
        }
      }
    },
    'ocr_extractor': {
      keywords: ['استخرج النص', 'اقرأ الصورة', 'ocr', 'استخرج النص من', 'اقرأ النص', 'extract text', 'read text', 'read image'],
      endpoint: 'extract',
      paramExtractors: {
        image: (msg): string | null => {
          // Check for URL
          const urlMatch = msg.match(/(https?:\/\/[^\s]+)/)
          if (urlMatch?.[1]) return urlMatch[1]
          // Will be filled from attachment in AIPanel
          return null
        }
      }
    }
  }

  for (const plugin of pluginStore.plugins) {
    if (!plugin.enabled) continue
    const config = pluginKeywords[plugin.id]
    if (!config) continue

    // Check if any keyword matches
    const hasKeyword = config.keywords.some(kw => lowerMsg.includes(kw.toLowerCase())) ||
      lowerMsg.includes(plugin.name.toLowerCase()) ||
      lowerMsg.includes(plugin.description.toLowerCase())

    if (hasKeyword) {
      const params: Record<string, string> = {}
      for (const [key, extractor] of Object.entries(config.paramExtractors)) {
        const value = extractor(message)
        if (value) params[key] = value
      }
      return { pluginId: plugin.id, endpointId: config.endpoint, params }
    }
  }

  return null
}

export interface AgentRequest {
  type: 'scan' | 'find-skills' | 'execute' | 'install-skill'
  params: Record<string, string>
}

export function detectAgentRequest(message: string): AgentRequest | null {
  const agentStore = useLocalAgentStore.getState()
  if (!agentStore.connected) return null

  const lowerMsg = message.toLowerCase()

  // 1. Explicit agent requests
  const explicitPatterns = [
    /(?:استخدم|运用|excecute|execute|نفّذ|نفذ)\s+(?:الوكيل|agent|محلي|local)/i,
    /(?:عبر|خالص|من خلال|through|via)\s+(?:الوكيل|agent|محلي|local)/i,
    /(?:الوكيل|agent|محلي|local)\s+(?:ينفّذ|يقوم|يعمل|does)/i,
  ]
  for (const pattern of explicitPatterns) {
    if (pattern.test(message)) {
      return { type: 'execute', params: { command: message } }
    }
  }

  // 2. Use specific skill
  const skillUsePatterns = [
    /(?:استخدم|use|运用)\s+(?:مهارة|skill|قدرة)\s+(.+)/i,
    /(?:activate|فعّل|شغّل)\s+(?:مهارة|skill|قدرة)\s+(.+)/i,
    /(?:تشغيل|run|شغّل)\s+(?:مهارة|skill)\s+(.+)/i,
  ]
  for (const pattern of skillUsePatterns) {
    const match = message.match(pattern)
    if (match?.[1]) {
      return { type: 'find-skills', params: { query: match[1].trim() } }
    }
  }

  // 3. Scan detection
  const scanPatterns = [
    /(?:افحص|فحص|scan|analyze)\s+(?:الكود|كود|code)?\s*(?:بـ|ب|باستخدام|with|using)?\s*(semgrep|codeql|slither|libfuzzer)?/i,
    /(?:semgrep|codeql|slither|libfuzzer)\s+(?:scan|افحص|فحص)/i,
  ]
  for (const pattern of scanPatterns) {
    const match = message.match(pattern)
    if (match) {
      const tool = match[1] || 'semgrep'
      return { type: 'scan', params: { tool, code: '', language: 'javascript' } }
    }
  }

  // 4. Find skills detection
  const skillPatterns = [
    /(?:ابحث عن|بحث عن|find|search)\s+(?:مهارة|skill|قدرات?)\s+(.+)/i,
    /(?:مهارات|skills)\s+(?:عن|about|for)\s+(.+)/i,
  ]
  for (const pattern of skillPatterns) {
    const match = message.match(pattern)
    if (match?.[1]) {
      return { type: 'find-skills', params: { query: match[1].trim() } }
    }
  }

  // 5. Execute detection
  const execPatterns = [
    /(?:نفّذ|نفذ|execute|run|تشغيل)\s+(?:الأمر|command)?\s*:?\s*(.+)/i,
    /(?:command|أمر)\s*:?\s*(.+)/i,
  ]
  for (const pattern of execPatterns) {
    const match = message.match(pattern)
    if (match?.[1]) {
      return { type: 'execute', params: { command: match[1].trim() } }
    }
  }

  // 6. Install skill detection
  const installPatterns = [
    /(?:ثبّت|ثبت|install|add)\s+(?:مهارة|skill|حزمة|package)\s+(.+)/i,
    /(?:npm|pip|apt)\s+(?:install|add)\s+(.+)/i,
  ]
  for (const pattern of installPatterns) {
    const match = message.match(pattern)
    if (match?.[1]) {
      return { type: 'install-skill', params: { packageName: match[1].trim() } }
    }
  }

  return null
}
