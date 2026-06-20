export interface Connector {
  id: string
  name: string
  description: string
  icon: string
  provider: ConnectorProvider
  authType: AuthType
  connected: boolean
  credentials: Record<string, string>
  config: ConnectorConfig
  capabilities: ConnectorCapability[]
  lastSync: number | null
  lastError: string | null
  createdAt: number
  updatedAt: number
}

export type ConnectorProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'meta'
  | 'mistral'
  | 'github_copilot'
  | 'cursor'
  | 'codeium'
  | 'aws_bedrock'
  | 'azure_openai'
  | 'google_cloud'
  | 'ollama'
  | 'lmstudio'
  | 'custom'

export type AuthType = 'none' | 'api_key' | 'oauth' | 'basic' | 'bearer' | 'token'

export interface ConnectorConfig {
  baseUrl: string
  models: string[]
  defaultModel?: string
  maxTokens?: number
  temperature?: number
  customHeaders?: Record<string, string>
  customParams?: Record<string, unknown>
}

export interface ConnectorCapability {
  id: string
  name: string
  supported: boolean
  description: string
}

export interface ConnectorTemplate {
  id: string
  name: string
  description: string
  icon: string
  provider: ConnectorProvider
  authType: AuthType
  config: ConnectorConfig
  capabilities: ConnectorCapability[]
}

export const CONNECTOR_TEMPLATES: ConnectorTemplate[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-4-Turbo, GPT-3.5-Turbo',
    icon: '🤖',
    provider: 'openai',
    authType: 'api_key',
    config: {
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI تفاعلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' },
      { id: 'embedding', name: 'تمثيل', supported: true, description: 'تمثيل النصوص' },
      { id: 'image', name: 'صور', supported: true, description: 'توليد الصور' },
      { id: 'vision', name: 'رؤية', supported: true, description: 'تحليل الصور' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5, Claude 3',
    icon: '🧠',
    provider: 'anthropic',
    authType: 'api_key',
    config: {
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI تفاعلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' },
      { id: 'analysis', name: 'تحليل', supported: true, description: 'تحليل النصوص' }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Gemini Pro, Gemini Flash',
    icon: '✨',
    provider: 'google',
    authType: 'api_key',
    config: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      models: ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI تفاعلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' },
      { id: 'image', name: 'صور', supported: true, description: 'توليد الصور' },
      { id: 'vision', name: 'رؤية', supported: true, description: 'تحليل الصور' }
    ]
  },
  {
    id: 'meta',
    name: 'Meta',
    description: 'Llama 3.2, CodeLlama',
    icon: '🦙',
    provider: 'meta',
    authType: 'api_key',
    config: {
      baseUrl: 'https://api.meta.com/v1',
      models: ['llama-3.2', 'codellama'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI تفاعلية' },
      { id: 'code', name: 'كود', supported: true, description: 'توليد الكود' }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mixtral, Mistral Large',
    icon: '🌊',
    provider: 'mistral',
    authType: 'api_key',
    config: {
      baseUrl: 'https://api.mistral.ai/v1',
      models: ['mixtral-8x7b', 'mistral-large'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI تفاعلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' }
    ]
  },
  {
    id: 'github_copilot',
    name: 'GitHub Copilot',
    description: 'مساعد البرمجة الذكي',
    icon: '🐙',
    provider: 'github_copilot',
    authType: 'token',
    config: {
      baseUrl: 'https://api.githubcopilot.com',
      models: ['copilot-chat'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'code_completion', name: 'إكمال الكود', supported: true, description: 'إكمال الأكواد تلقائياً' },
      { id: 'code_chat', name: 'محادثة كود', supported: true, description: 'محادثة حول الكود' },
      { id: 'code_explanation', name: 'شرح الكود', supported: true, description: 'شرح الأكواد' }
    ]
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'محرر كود ذكي',
    icon: '🖱️',
    provider: 'cursor',
    authType: 'api_key',
    config: {
      baseUrl: 'https://api.cursor.sh/v1',
      models: ['cursor-small', 'cursor-large'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'code_completion', name: 'إكمال الكود', supported: true, description: 'إكمال الأكواد' },
      { id: 'code_chat', name: 'محادثة كود', supported: true, description: 'محادثة حول الكود' }
    ]
  },
  {
    id: 'codeium',
    name: 'Codeium',
    description: 'مساعد برمجة مجاني',
    icon: '⚡',
    provider: 'codeium',
    authType: 'api_key',
    config: {
      baseUrl: 'https://api.codeium.com/v1',
      models: ['codeium'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'code_completion', name: 'إكمال الكود', supported: true, description: 'إكمال الأكواد' }
    ]
  },
  {
    id: 'aws_bedrock',
    name: 'AWS Bedrock',
    description: 'خدمات AI سحابية من Amazon',
    icon: '☁️',
    provider: 'aws_bedrock',
    authType: 'api_key',
    config: {
      baseUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com',
      models: ['anthropic.claude-3-sonnet', 'meta.llama-3-70b'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI تفاعلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' }
    ]
  },
  {
    id: 'azure_openai',
    name: 'Azure OpenAI',
    description: 'خدمات OpenAI على Azure',
    icon: '🔷',
    provider: 'azure_openai',
    authType: 'api_key',
    config: {
      baseUrl: 'https://your-resource.openai.azure.com',
      models: ['gpt-4', 'gpt-3.5-turbo'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI تفاعلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' }
    ]
  },
  {
    id: 'google_cloud',
    name: 'Google Cloud AI',
    description: 'خدمات AI من Google Cloud',
    icon: '🌐',
    provider: 'google_cloud',
    authType: 'api_key',
    config: {
      baseUrl: 'https://us-central1-aiplatform.googleapis.com',
      models: ['text-bison', 'chat-bison'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI تفاعلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' }
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'نماذج AI محلية',
    icon: '🏠',
    provider: 'ollama',
    authType: 'none',
    config: {
      baseUrl: 'http://localhost:11434',
      models: ['llama3.2', 'codellama', 'mistral'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI محلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' },
      { id: 'code', name: 'كود', supported: true, description: 'توليد الكود' }
    ]
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'منصة النماذج المحلية',
    icon: '🖥️',
    provider: 'lmstudio',
    authType: 'none',
    config: {
      baseUrl: 'http://localhost:1234',
      models: ['local-model'],
      maxTokens: 4096
    },
    capabilities: [
      { id: 'chat', name: 'محادثة', supported: true, description: 'محادثة AI محلية' },
      { id: 'completion', name: 'إكمال', supported: true, description: 'إكمال النصوص' }
    ]
  }
]
