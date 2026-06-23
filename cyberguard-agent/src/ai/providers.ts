export interface AIProvider {
  name: string
  type: 'cloud' | 'local'
  models: string[]
  isAvailable: () => Promise<boolean>
  chat: (model: string, messages: AIMessage[], options?: ChatOptions) => Promise<AIResponse>
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AIResponse {
  content: string
  model: string
  provider: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

// ==================== GEMINI ====================
export class GeminiProvider implements AIProvider {
  name = 'gemini'
  type = 'cloud' as const
  models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash']
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`)
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    // Gemini requires at least one content item
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello' }] })
    }

    const systemInstruction = messages.find(m => m.role === 'system')
    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
      }
    }
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction.content }] }
    }

    const res = await fetch(
      `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return { content, model, provider: 'gemini', usage: data.usageMetadata }
  }
}

// ==================== OLLAMA ====================
export class OllamaProvider implements AIProvider {
  name = 'ollama'
  type = 'local' as const
  models: string[] = []
  private baseUrl: string

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`)
      if (res.ok) {
        const data = await res.json() as any
        this.models = data.models?.map((m: any) => m.name) || []
      }
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
        }
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Ollama error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.message?.content || '',
      model,
      provider: 'ollama',
      usage: data.eval_count ? { promptTokens: data.prompt_eval_count || 0, completionTokens: data.eval_count, totalTokens: (data.prompt_eval_count || 0) + data.eval_count } : undefined
    }
  }
}

// ==================== GROQ ====================
export class GroqProvider implements AIProvider {
  name = 'groq'
  type = 'cloud' as const
  models = ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it']
  private apiKey: string
  private baseUrl = 'https://api.groq.com/openai/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'groq',
      usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens } : undefined
    }
  }
}

// ==================== HUGGINGFACE ====================
export class HuggingFaceProvider implements AIProvider {
  name = 'huggingface'
  type = 'cloud' as const
  models = ['meta-llama/Llama-3-70B-Instruct', 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'google/gemma-7b-it']
  private apiKey: string
  private baseUrl = 'https://api-inference.huggingface.co/models'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/${this.models[0]}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({ inputs: 'test' })
      })
      return res.ok || res.status === 503
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const prompt = messages.map(m => {
      if (m.role === 'system') return `<|system|>\n${m.content}\n`
      if (m.role === 'assistant') return `<|assistant|>\n${m.content}\n`
      return `<|user|>\n${m.content}\n`
    }).join('') + '<|assistant|>\n'

    const res = await fetch(`${this.baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
        }
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`HuggingFace error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    const content = Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || ''
    return { content, model, provider: 'huggingface' }
  }
}

// ==================== OPENROUTER ====================
export class OpenRouterProvider implements AIProvider {
  name = 'openrouter'
  type = 'cloud' as const
  models = ['meta-llama/llama-3-70b-instruct', 'mistralai/mixtral-8x7b-instruct', 'google/gemma-7b-it:free', 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free']
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://cyberguard.app',
        'X-Title': 'CyberGuard Agent'
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenRouter error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'openrouter',
      usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens } : undefined
    }
  }
}

// ==================== NVIDIA NIM ====================
export class NvidiaProvider implements AIProvider {
  name = 'nvidia'
  type = 'cloud' as const
  models = ['nvidia/nemotron-3-ultra-50b-a50b', 'nvidia/llama-3.1-nemotron-70b-instruct', 'meta/llama-3.1-405b-instruct']
  private apiKey: string
  private baseUrl = 'https://integrate.api.nvidia.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`NVIDIA error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'nvidia',
      usage: data.usage
    }
  }
}

// ==================== MISTRAL ====================
export class MistralProvider implements AIProvider {
  name = 'mistral'
  type = 'cloud' as const
  models = ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest', 'open-mistral-nemo']
  private apiKey: string
  private baseUrl = 'https://api.mistral.ai/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Mistral error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'mistral',
      usage: data.usage
    }
  }
}

// ==================== CEREBRAS ====================
export class CerebrasProvider implements AIProvider {
  name = 'cerebras'
  type = 'cloud' as const
  models = ['llama-3.3-70b', 'llama-3.1-8b', 'llama-3.1-70b']
  private apiKey: string
  private baseUrl = 'https://api.cerebras.ai/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cerebras error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'cerebras',
      usage: data.usage
    }
  }
}

// ==================== COHERE ====================
export class CohereProvider implements AIProvider {
  name = 'cohere'
  type = 'cloud' as const
  models = ['command-r-plus', 'command-r', 'command-light']
  private apiKey: string
  private baseUrl = 'https://api.cohere.ai/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cohere error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.message?.content?.[0]?.text || data.text || '',
      model,
      provider: 'cohere',
      usage: data.meta?.billed_units
    }
  }
}

// ==================== GITHUB MODELS ====================
export class GitHubModelsProvider implements AIProvider {
  name = 'github'
  type = 'cloud' as const
  models = ['microsoft/Phi-3-mini-4k-instruct', 'microsoft/Phi-3-medium-4k-instruct', 'meta/llama-3.1-8b-instruct']
  private apiKey: string
  private baseUrl = 'https://models.inference.ai.azure.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`GitHub Models error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'github',
      usage: data.usage
    }
  }
}

// ==================== CLOUDFLARE WORKERS AI ====================
export class CloudflareProvider implements AIProvider {
  name = 'cloudflare'
  type = 'cloud' as const
  models = ['@cf/meta/llama-3.1-8b-instruct', '@cf/mistral/mistral-7b-instruct-v0.2', '@cf/qwen/qwen1.5-14b-chat-awq']
  private apiKey: string
  private accountId: string
  private baseUrl = 'https://api.cloudflare.com/client/v4'

  constructor(apiKey: string, accountId?: string) {
    this.apiKey = apiKey
    this.accountId = accountId || ''
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/accounts/${this.accountId}/ai/models/search`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/accounts/${this.accountId}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cloudflare error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.result?.response || '',
      model,
      provider: 'cloudflare',
      usage: data.result?.usage
    }
  }
}

// ==================== VERCEL AI GATEWAY ====================
export class VercelProvider implements AIProvider {
  name = 'vercel'
  type = 'cloud' as const
  models = ['openai:gpt-4o', 'openai:gpt-4o-mini', 'anthropic:claude-3-5-sonnet']
  private apiKey: string
  private baseUrl = 'https://api.vercel.ai/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Vercel error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'vercel',
      usage: data.usage
    }
  }
}

// ==================== OPENCODE ZEN ====================
export class OpenCodeZenProvider implements AIProvider {
  name = 'opencodezen'
  type = 'cloud' as const
  models = ['zen-1', 'zen-2', 'zen-code']
  private apiKey: string
  private baseUrl = 'https://api.opencodezen.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenCode Zen error: ${res.status} - ${err}`)
    }

    const data = await res.json() as any
    return {
      content: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'opencodezen',
      usage: data.usage
    }
  }
}

// ==================== PROVIDER MANAGER ====================
export class AIManager {
  private providers: Map<string, AIProvider> = new Map()
  private activeProvider: string = 'gemini'
  private activeModel: string = 'gemini-3.5-flash'

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.name, provider)
  }

  setActive(provider: string, model: string) {
    this.activeProvider = provider
    this.activeModel = model
  }

  getActive(): { provider: string; model: string } {
    return { provider: this.activeProvider, model: this.activeModel }
  }

  async getAvailableProviders(): Promise<{ name: string; type: string; models: string[]; available: boolean }[]> {
    const results = []
    for (const [name, provider] of this.providers) {
      const available = await provider.isAvailable()
      results.push({ name, type: provider.type, models: provider.models, available })
    }
    return results
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const provider = this.providers.get(this.activeProvider)
    if (!provider) throw new Error(`Provider not found: ${this.activeProvider}`)

    // Try active provider first, fallback to others
    // Use local variables to avoid race condition with concurrent requests
    let lastError: Error | null = null
    try {
      return await provider.chat(this.activeModel, messages, options)
    } catch (err) {
      lastError = err as Error
      console.log(`Primary provider (${this.activeProvider}) failed, trying fallback...`)
    }

    // Fallback: try other providers without mutating global state
    for (const [name, fallback] of this.providers) {
      if (name === this.activeProvider) continue
      try {
        if (await fallback.isAvailable()) {
          const model = fallback.models[0]
          if (model) {
            console.log(`Fallback to ${name}/${model}`)
            return await fallback.chat(model, messages, options)
          }
        }
      } catch { continue }
    }
    throw lastError || new Error('All providers failed')
  }
}

// Singleton
export const aiManager = new AIManager()
