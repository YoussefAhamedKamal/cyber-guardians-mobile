import { useSkillStore } from '@/store/skillStore'
import { usePluginStore } from '@/store/pluginStore'
import { useConnectorStore } from '@/store/connectorStore'
import { STUDENT_SYSTEM_PROMPT } from './prompts'

export function buildActiveSkillPrompt(): string {
  const skillStore = useSkillStore.getState()
  const pluginStore = usePluginStore.getState()
  const connectorStore = useConnectorStore.getState()

  const activeSkill = skillStore.activeSkillId
    ? skillStore.skills.find(s => s.id === skillStore.activeSkillId && s.enabled)
    : null

  const enabledPlugins = pluginStore.plugins.filter(p => p.enabled)
  const activeConnectors = connectorStore.connectors.filter(c => c.connected)

  let prompt = STUDENT_SYSTEM_PROMPT

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

export function detectSkillRequest(message: string): string | null {
  const skillStore = useSkillStore.getState()
  const lowerMsg = message.toLowerCase()

  const skillKeywords: Record<string, string[]> = {
    'translator': ['translate', 'translation'],
    'code_analyzer': ['analyze code', 'code analysis', 'review code'],
    'summarizer': ['summarize', 'summary', 'tldr'],
    'math_solver': ['calculate', 'math', 'solve', 'equation'],
    'email_writer': ['write email', 'compose email', 'draft email'],
    'researcher': ['research', 'investigate', 'study'],
    'creative_writer': ['write story', 'creative writing', 'poem', 'fiction'],
    'data_analyst': ['data analysis', 'analyze data', 'statistics'],
    'cybersecurity_expert': ['vulnerability', 'security audit', 'penetration', 'hack', 'exploit'],
    'teacher': ['explain', 'teach', 'learn', 'understand', 'tutorial'],
    'content_writer': ['write article', 'blog post', 'content writing'],
    'software_engineer': ['develop', 'build app', 'create software', 'programming', 'code'],
    'image_generator': ['generate image', 'create image', 'draw', 'picture', 'image'],
  }

  for (const skill of skillStore.skills) {
    if (!skill.enabled) continue
    const keywords = skillKeywords[skill.id] || []
    if (keywords.some(kw => lowerMsg.includes(kw))) {
      return skill.id
    }
  }

  return null
}

export function detectPluginRequest(message: string): { pluginId: string; endpointId: string; params: Record<string, string> } | null {
  const pluginStore = usePluginStore.getState()
  const lowerMsg = message.toLowerCase()

  const pluginKeywords: Record<string, { endpoint: string; paramExtractors: Record<string, (msg: string) => string | null> }> = {
    'calculator': {
      endpoint: 'calculate',
      paramExtractors: {
        expression: (msg): string | null => {
          const mathMatch = msg.match(/(\d+[\s]*[\+\-\*\/\^][\s]*\d+(?:[\s]*[\+\-\*\/\^][\s]*\d+)*)/)
          return mathMatch?.[1] ?? null
        }
      }
    },
    'image_generator': {
      endpoint: 'generate',
      paramExtractors: {
        prompt: (msg): string | null => {
          const promptMatch = msg.match(/(?:generate|create|draw|image|picture)\s+(.+)/i)
          return promptMatch?.[1] ?? msg
        }
      }
    },
    'chart_generator': {
      endpoint: 'create_chart',
      paramExtractors: {
        data: (): string => '{}',
        type: (msg): string => msg.includes('line') ? 'line' : msg.includes('bar') ? 'bar' : 'pie'
      }
    },
    'web_scraper': {
      endpoint: 'scrape',
      paramExtractors: {
        url: (msg): string | null => {
          const urlMatch = msg.match(/(https?:\/\/[^\s]+)/)
          return urlMatch?.[1] ?? null
        }
      }
    },
    'search_engine': {
      endpoint: 'search',
      paramExtractors: {
        query: (msg): string => msg.replace(/^(search|find|look)\s*/i, '') || msg
      }
    }
  }

  for (const plugin of pluginStore.plugins) {
    if (!plugin.enabled) continue
    const config = pluginKeywords[plugin.id]
    if (!config) continue

    const hasKeyword = lowerMsg.includes(plugin.name.toLowerCase()) ||
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
