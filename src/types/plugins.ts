export interface Plugin {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  category: PluginCategory
  config: PluginConfig
  endpoints: PluginEndpoint[]
  auth: PluginAuth
  events: PluginEvent[]
  hooks: PluginHook[]
  usageHistory: PluginUsageRecord[]
  createdAt: number
  updatedAt: number
}

export type PluginCategory =
  | 'calculator'
  | 'database'
  | 'visualization'
  | 'scraping'
  | 'file_system'
  | 'api'
  | 'custom'

export interface PluginConfig {
  baseUrl?: string
  timeout?: number
  retries?: number
  customParams?: Record<string, unknown>
}

export interface PluginEndpoint {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  parameters?: PluginParameter[]
  responseSchema?: Record<string, unknown>
}

export interface PluginParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description: string
  defaultValue?: unknown
}

export interface PluginAuth {
  type: 'none' | 'api_key' | 'oauth' | 'basic' | 'bearer'
  credentials?: Record<string, string>
  tokenUrl?: string
}

export interface PluginEvent {
  id: string
  name: string
  trigger: 'on_message' | 'on_command' | 'on_schedule' | 'manual'
  handler: string
}

export interface PluginHook {
  id: string
  name: string
  position: 'before_ai' | 'after_ai' | 'before_response' | 'after_response'
  handler: string
}

export interface PluginUsageRecord {
  timestamp: number
  endpoint: string
  input: string
  output: string
  duration: number
  success: boolean
  error: string | null
}

export interface PluginTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: PluginCategory
  config: PluginConfig
  endpoints: PluginEndpoint[]
  auth: PluginAuth
}

export const PLUGIN_TEMPLATES: PluginTemplate[] = [
  {
    id: 'calculator',
    name: 'حاسبة',
    description: 'إجراء عمليات حسابية معقدة بدقة',
    icon: '🧮',
    category: 'calculator',
    config: {},
    endpoints: [
      {
        id: 'calculate',
        name: 'حساب',
        method: 'POST',
        path: '/calculate',
        description: 'إجراء عملية حسابية',
        parameters: [
          { name: 'expression', type: 'string', required: true, description: 'التعبير الرياضي' }
        ]
      }
    ],
    auth: { type: 'none' }
  },
  {
    id: 'database',
    name: 'قاعدة بيانات',
    description: 'البحث والاستعلام من قواعد البيانات',
    icon: '🗄️',
    category: 'database',
    config: {},
    endpoints: [
      {
        id: 'query',
        name: 'استعلام',
        method: 'POST',
        path: '/query',
        description: 'تنفيذ استعلام',
        parameters: [
          { name: 'sql', type: 'string', required: true, description: 'عبارة SQL' }
        ]
      }
    ],
    auth: { type: 'api_key' }
  },
  {
    id: 'chart_generator',
    name: 'مولّد رسوم بيانية',
    description: 'إنشاء رسوم بيانية من البيانات',
    icon: '📊',
    category: 'visualization',
    config: {},
    endpoints: [
      {
        id: 'create_chart',
        name: 'إنشاء رسم بياني',
        method: 'POST',
        path: '/chart',
        description: 'إنشاء رسم بياني',
        parameters: [
          { name: 'data', type: 'object', required: true, description: 'البيانات' },
          { name: 'type', type: 'string', required: true, description: 'نوع الرسم' }
        ]
      }
    ],
    auth: { type: 'none' }
  },
  {
    id: 'web_scraper',
    name: 'ماسح ويب',
    description: 'استخراج البيانات من صفحات الويب',
    icon: '🕸️',
    category: 'scraping',
    config: { timeout: 30000 },
    endpoints: [
      {
        id: 'scrape',
        name: 'مسح صفحة',
        method: 'POST',
        path: '/scrape',
        description: 'مسح صفحة ويب واستخراج المحتوى',
        parameters: [
          { name: 'url', type: 'string', required: true, description: 'رابط الصفحة' },
          { name: 'selector', type: 'string', required: false, description: 'CSS selector' }
        ]
      }
    ],
    auth: { type: 'none' }
  },
  {
    id: 'file_manager',
    name: 'مدير ملفات',
    description: 'إدارة الملفات والمجلدات',
    icon: '📁',
    category: 'file_system',
    config: {},
    endpoints: [
      {
        id: 'list_files',
        name: 'قائمة الملفات',
        method: 'GET',
        path: '/files',
        description: 'عرض الملفات'
      },
      {
        id: 'read_file',
        name: 'قراءة ملف',
        method: 'GET',
        path: '/files/:id',
        description: 'قراءة محتوى ملف'
      }
    ],
    auth: { type: 'none' }
  },
  {
    id: 'api_caller',
    name: 'م вызыв API',
    description: 'استدعاء APIs خارجية',
    icon: '🔌',
    category: 'api',
    config: {},
    endpoints: [
      {
        id: 'call_api',
        name: 'استدعاء API',
        method: 'POST',
        path: '/call',
        description: 'استدعاء API خارجي',
        parameters: [
          { name: 'url', type: 'string', required: true, description: 'رابط API' },
          { name: 'method', type: 'string', required: true, description: 'طريقة الاستدعاء' },
          { name: 'body', type: 'object', required: false, description: 'البيانات' }
        ]
      }
    ],
    auth: { type: 'api_key' }
  },
  {
    id: 'stats_analyzer',
    name: 'محلل إحصائي',
    description: 'تحليل البيانات الإحصائية',
    icon: '📈',
    category: 'visualization',
    config: {},
    endpoints: [
      {
        id: 'analyze',
        name: 'تحليل إحصائي',
        method: 'POST',
        path: '/analyze',
        description: 'إجراء تحليل إحصائي',
        parameters: [
          { name: 'data', type: 'array', required: true, description: 'البيانات' },
          { name: 'metrics', type: 'array', required: true, description: 'المؤشرات' }
        ]
      }
    ],
    auth: { type: 'none' }
  },
  {
    id: 'image_generator',
    name: 'مولّد صور',
    description: 'توليد صور من النصوص',
    icon: '🎨',
    category: 'custom',
    config: {},
    endpoints: [
      {
        id: 'generate',
        name: 'توليد صورة',
        method: 'POST',
        path: '/generate',
        description: 'توليد صورة من نص',
        parameters: [
          { name: 'prompt', type: 'string', required: true, description: 'الوصف' },
          { name: 'style', type: 'string', required: false, description: 'النمط' }
        ]
      }
    ],
    auth: { type: 'api_key' }
  },
  {
    id: 'text_editor',
    name: 'محرر نصوص',
    description: 'تحرير وتنسيق النصوص',
    icon: '📝',
    category: 'custom',
    config: {},
    endpoints: [
      {
        id: 'format',
        name: 'تنسيق',
        method: 'POST',
        path: '/format',
        description: 'تنسيق نص',
        parameters: [
          { name: 'text', type: 'string', required: true, description: 'النص' },
          { name: 'format', type: 'string', required: true, description: 'التنسيق' }
        ]
      }
    ],
    auth: { type: 'none' }
  },
  {
    id: 'search_engine',
    name: 'محرك بحث',
    description: 'البحث في الإنترنت واستخراج النتائج',
    icon: '🔍',
    category: 'api',
    config: {},
    endpoints: [
      {
        id: 'search',
        name: 'بحث',
        method: 'GET',
        path: '/search',
        description: 'بحث في الإنترنت',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'عبارة البحث' },
          { name: 'limit', type: 'number', required: false, description: 'عدد النتائج' }
        ]
      }
    ],
    auth: { type: 'api_key' }
  }
]
