import { useSkillStore } from '@/store/skillStore'
import { usePluginStore } from '@/store/pluginStore'
import { useConnectorStore } from '@/store/connectorStore'
import { useProjectStore } from '@/store/projectStore'
import { STUDENT_SYSTEM_PROMPT, FACULTY_SYSTEM_PROMPT } from './prompts'

function buildSkillsPluginsPrompt(basePrompt: string): string {
  const skillStore = useSkillStore.getState()
  const pluginStore = usePluginStore.getState()
  const connectorStore = useConnectorStore.getState()
  const projectStore = useProjectStore.getState()

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

  if (activeSkill) {
    prompt += '\n\n--- ACTIVE SKILL ---\n'
    prompt += 'Name: ' + activeSkill.icon + ' ' + activeSkill.name + '\n'
    prompt += 'Description: ' + activeSkill.description + '\n'
    prompt += 'Instructions:\n' + activeSkill.systemPrompt + '\n'
    prompt += '--- END SKILL ---\n'
    prompt += 'Use this skill in your responses. Follow the instructions above.\n'
  }

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
    'image_generator': ['generate image', 'create image', 'draw', 'picture', 'image', 'صور'],
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
      keywords: ['رسم بياني', 'رسم بيانية', 'رسوم بيانية', 'chart', 'graph'],
      endpoint: 'create_chart',
      paramExtractors: {
        data: (): string => '{}',
        type: (msg): string => msg.includes('خطي') || msg.includes('line') ? 'line' : msg.includes('عمودي') || msg.includes('bar') ? 'bar' : 'pie'
      }
    },
    'web_scraper': {
      keywords: ['استخراج', 'جلب صفحة', 'محتوى موقع', 'scrape', 'fetch'],
      endpoint: 'scrape',
      paramExtractors: {
        url: (msg): string | null => {
          const urlMatch = msg.match(/(https?:\/\/[^\s]+)/)
          return urlMatch?.[1] ?? null
        }
      }
    },
    'search_engine': {
      keywords: ['ابحث عن', 'بحث', 'search', 'find'],
      endpoint: 'search',
      paramExtractors: {
        q: (msg): string => msg.replace(/^(ابحث عن|بحث|search|find)\s*/i, '') || msg
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
