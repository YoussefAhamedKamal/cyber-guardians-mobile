const AVAILABLE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash',
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet',
  'claude-3-haiku',
  'deepseek-chat',
  'qwen-2.5-72b',
]

const MODEL_ALIASES: Record<string, string> = {
  'opencode/big-pickle': 'gemini-3.5-flash',
  'big-pickle': 'gemini-3.5-flash',
  'sonnet': 'claude-3-5-sonnet',
  'haiku': 'claude-3-haiku',
  'gpt4': 'gpt-4o',
  'gpt4o': 'gpt-4o',
  'gemini-flash': 'gemini-3.5-flash',
  'deepseek': 'deepseek-chat',
}

export function resolveModel(preferredModel?: string, availableModels?: string[]): string {
  const available = availableModels || AVAILABLE_MODELS

  if (preferredModel) {
    // Check aliases
    const alias = MODEL_ALIASES[preferredModel.toLowerCase()]
    const resolved = alias || preferredModel

    // Check if available
    if (available.includes(resolved)) {
      return resolved
    }

    // Check partial match
    const partial = available.find(m => m.toLowerCase().includes(resolved.toLowerCase()))
    if (partial) return partial
  }

  // Return first available model
  return available[0] || 'unknown'
}

export function listModels(): string[] {
  return [...AVAILABLE_MODELS]
}
