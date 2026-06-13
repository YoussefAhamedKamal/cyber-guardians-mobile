export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: ChatAttachment[] | undefined
}

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface ChatAttachment {
  name: string
  type: 'text' | 'image' | 'video' | 'audio' | 'file'
  content: string
  mimeType: string
  uploadStatus?: UploadStatus
  uploadError?: string
}

export interface ChatSession {
  id: string
  name: string
  messages: AIMessage[]
  createdAt: number
}

export interface AIProviderDef {
  id: string
  name: string
  baseUrl: string
  models: AIModelDef[]
  apiKeyLabel: string
  docUrl?: string
}

export interface AIModelDef {
  id: string
  name: string
  providerId: string
  free?: boolean
}

export const AI_PROVIDERS: AIProviderDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyLabel: 'OpenAI API Key',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', providerId: 'openai', free: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', providerId: 'openai' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyLabel: 'OpenRouter API Key',
    docUrl: 'https://openrouter.ai/docs',
    models: [
      { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', providerId: 'openrouter', free: true },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', providerId: 'openrouter', free: true },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', providerId: 'openrouter', free: true },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', providerId: 'openrouter' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', providerId: 'openrouter' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', providerId: 'openrouter' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', providerId: 'openrouter' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (محلي)',
    baseUrl: 'http://localhost:11434/v1',
    apiKeyLabel: 'أي قيمة (مطلوب تقنياً)',
    docUrl: 'https://ollama.ai',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2', providerId: 'ollama', free: true },
      { id: 'mistral', name: 'Mistral', providerId: 'ollama', free: true },
      { id: 'qwen2.5', name: 'Qwen 2.5', providerId: 'ollama', free: true },
    ],
  },
  {
    id: 'custom',
    name: 'API مخصص (OpenAI-compatible)',
    baseUrl: '',
    apiKeyLabel: 'API Key',
    models: [
      { id: 'custom-model', name: 'نموذج مخصص', providerId: 'custom', free: true },
    ],
  },
]

export interface AIState {
  providerId: string
  modelId: string
  apiKeys: Record<string, string>
  customBaseUrl: string
  facultyPinHash: string
  facultyUnlocked: boolean
  pinAttempts: number
  pinLockedUntil: number
  studentSessions: ChatSession[]
  activeStudentSessionId: string
  facultySessions: ChatSession[]
  activeFacultySessionId: string
  panelOpen: boolean
  panelMaximized: boolean
  activeTab: 'student' | 'faculty' | 'settings'
  loading: boolean
}

export const DEFAULT_AI_STATE: Omit<AIState, 'apiKeys'> = {
  providerId: 'openrouter',
  modelId: 'meta-llama/llama-3.2-3b-instruct:free',
  customBaseUrl: '',
  facultyPinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  facultyUnlocked: false,
  pinAttempts: 0,
  pinLockedUntil: 0,
  studentSessions: [],
  activeStudentSessionId: '',
  facultySessions: [],
  activeFacultySessionId: '',
  panelOpen: false,
  panelMaximized: false,
  activeTab: 'student',
  loading: false,
}
