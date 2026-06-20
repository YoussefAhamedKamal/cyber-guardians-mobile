import type { AIMessage } from './ai'

export interface ProjectKnowledge {
  id: string
  name: string
  path: string
  type: KnowledgeFileType
  content: string
  mimeType?: string
  size?: number
  source: KnowledgeSource
  sourceUrl?: string
  tags: string[]
  indexed: boolean
  createdAt: number
  updatedAt: number
}

export type KnowledgeFileType = 'text' | 'code' | 'image' | 'document' | 'data' | 'other'

export type KnowledgeSource = 'local' | 'github' | 'gdrive' | 'url'

export interface ProjectInstructions {
  role: string
  tone: InstructionTone
  responseFormat: ResponseFormat
  customPrompt: string
  templates: InstructionTemplate[]
  updatedAt: number
}

export type InstructionTone = 'professional' | 'friendly' | 'formal' | 'casual' | 'academic' | 'creative'

export type ResponseFormat = 'markdown' | 'plain' | 'code' | 'json' | 'custom'

export interface InstructionTemplate {
  id: string
  name: string
  description: string
  role: string
  tone: InstructionTone
  responseFormat: ResponseFormat
  customPrompt: string
}

export interface ProjectChat {
  id: string
  name: string
  messages: AIMessage[]
  tags: string[]
  pinned: boolean
  archived: boolean
  createdAt: number
  lastActivity: number
}

export interface ProjectState {
  knowledge: ProjectKnowledge[]
  instructions: ProjectInstructions
  chats: ProjectChat[]
  activeChatId: string | null
  sharedMemory: boolean
  lastSync: number
}

export interface KnowledgeIndex {
  id: string
  knowledgeId: string
  chunks: KnowledgeChunk[]
  lastIndexed: number
}

export interface KnowledgeChunk {
  id: string
  content: string
  startLine: number
  endLine: number
  tokens: number
  metadata: Record<string, unknown>
}

export interface ProjectSyncStatus {
  github: {
    connected: boolean
    repo?: string
    lastSync?: number
    pendingChanges: number
  }
  gdrive: {
    connected: boolean
    folderId?: string
    lastSync?: number
    pendingChanges: number
  }
}

export const DEFAULT_INSTRUCTIONS: ProjectInstructions = {
  role: '',
  tone: 'professional',
  responseFormat: 'markdown',
  customPrompt: '',
  templates: [
    {
      id: 'programmer',
      name: 'مبرمج',
      description: 'مساعد برمجي متخصص',
      role: 'مبرمج خبير',
      tone: 'professional',
      responseFormat: 'code',
      customPrompt: 'أنت مبرمج خبير. اكتب كود نظيف وموثق. اشرح الحلول بشكل واضح.'
    },
    {
      id: 'marketer',
      name: 'مسوّق',
      description: 'خبير تسويق رقمي',
      role: 'خبير تسويق رقمي',
      tone: 'friendly',
      responseFormat: 'markdown',
      customPrompt: 'أنت خبير تسويق رقمي. اقترح استراتيجيات إبداعية وتحليلات مفصلة.'
    },
    {
      id: 'teacher',
      name: 'معلم',
      description: 'معلّم شرح',
      role: 'معلّم صبور',
      tone: 'friendly',
      responseFormat: 'markdown',
      customPrompt: 'أنت معلّم صبور. اشرح المفاهيم ببساطة مع أمثلة توضيحية.'
    },
    {
      id: 'writer',
      name: 'كاتب',
      description: 'كاتب محتوى إبداعي',
      role: 'كاتب إبداعي',
      tone: 'creative',
      responseFormat: 'markdown',
      customPrompt: 'أنت كاتب إبداعي. اكتب محتوى جذاب ومؤثر.'
    }
  ],
  updatedAt: Date.now()
}

export const KNOWLEDGE_FILE_TYPES: Record<string, KnowledgeFileType> = {
  'text/plain': 'text',
  'text/markdown': 'text',
  'text/csv': 'data',
  'application/json': 'data',
  'application/x-yaml': 'data',
  'text/typescript': 'code',
  'text/javascript': 'code',
  'text/python': 'code',
  'text/java': 'code',
  'text/x-c': 'code',
  'text/x-c++': 'code',
  'text/x-go': 'code',
  'text/x-rust': 'code',
  'text/x-sh': 'code',
  'text/html': 'code',
  'text/css': 'code',
  'text/xml': 'code',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/svg+xml': 'image',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document'
}

export function detectKnowledgeFileType(mimeType: string): KnowledgeFileType {
  return KNOWLEDGE_FILE_TYPES[mimeType] || 'other'
}

export function getFileIcon(type: KnowledgeFileType): string {
  switch (type) {
    case 'text': return '📄'
    case 'code': return '💻'
    case 'image': return '🖼️'
    case 'document': return '📚'
    case 'data': return '📊'
    default: return '📁'
  }
}
