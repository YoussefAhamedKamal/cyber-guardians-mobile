export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
  enabled: boolean
  category: SkillCategory
  config: SkillConfig
  parentSkillId?: string
  composedSkillIds?: string[]
  activationCondition?: SkillActivationCondition
  usageHistory: SkillUsageRecord[]
  createdAt: number
  updatedAt: number
}

export type SkillCategory =
  | 'translation'
  | 'analysis'
  | 'writing'
  | 'math'
  | 'coding'
  | 'research'
  | 'creative'
  | 'custom'

export interface SkillConfig {
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
  customParams?: Record<string, unknown>
}

export interface SkillActivationCondition {
  type: 'keyword' | 'context' | 'time' | 'user_role'
  value: string | string[]
  operator?: 'contains' | 'equals' | 'regex' | 'in'
}

export interface SkillUsageRecord {
  timestamp: number
  inputPreview: string
  outputPreview: string
  duration: number
  success: boolean
}

export interface SkillTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: SkillCategory
  systemPrompt: string
  config: SkillConfig
}

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: 'translator',
    name: 'مترجم لغات',
    description: 'ترجمة النصوص بين اللغات المختلفة بدقة',
    icon: '🌐',
    category: 'translation',
    systemPrompt: 'أنت مترجم محترف. ترجم النصوص بدقة عالية مع الحفاظ على المعنى والأسلوب. حافظ على السياق الثقافي واللغوي.',
    config: { temperature: 0.3 }
  },
  {
    id: 'code_analyzer',
    name: 'محلل أكواد',
    description: 'تحليل وشرح الأكواد البرمجية واكتشاف الأخطاء',
    icon: '🔍',
    category: 'analysis',
    systemPrompt: 'أنت محلل أكواد خبير. حلل الكود واشرحه بشكل واضح. اكتشف الأخطاء واقترح تحسينات. استخدم أمثلة توضيحية.',
    config: { temperature: 0.2 }
  },
  {
    id: 'summarizer',
    name: 'ملخص نصوص',
    description: 'تلخيص المستندات والنصوص الطويلة بشكل موجز',
    icon: '📝',
    category: 'writing',
    systemPrompt: 'أنت متخصص في تلخيص النصوص. لخّص المحتوى بشكل موجز ودقيق مع الحفاظ على النقاط الرئيسية. استخدم نقاط مختصرة.',
    config: { temperature: 0.4 }
  },
  {
    id: 'math_solver',
    name: 'حاسب رياضيات',
    description: 'حل المسائل الرياضية مع شرح خطوات الحل',
    icon: '🧮',
    category: 'math',
    systemPrompt: 'أنت خبير رياضيات. حل المسائل خطوة بخطوة مع شرح تفصيلي لكل خطوة. استخدم الصيغ الرياضية واضحة.',
    config: { temperature: 0.1 }
  },
  {
    id: 'email_writer',
    name: 'كاتب إيميلات',
    description: 'كتابة إيميلات احترافية بأسلوب مناسب',
    icon: '✉️',
    category: 'writing',
    systemPrompt: 'أنت متخصص في كتابة الإيميلات الاحترافية. اكتب إيميلات واضحة وموجبة مع مراعاة الأسلوب المناسب للسياق.',
    config: { temperature: 0.5 }
  },
  {
    id: 'researcher',
    name: 'باحث',
    description: 'إجراء أبحاث شاملة وتحليل المعلومات',
    icon: '🔬',
    category: 'research',
    systemPrompt: 'أنت باحث محترف. جمع المعلومات وحللها بشكل موضوعي. اقتصر المصادر وقدم استنتاجات مدعومة بالأدلة.',
    config: { temperature: 0.3 }
  },
  {
    id: 'creative_writer',
    name: 'كاتب إبداعي',
    description: 'كتابة محتوى إبداعي وقصص ومقالات',
    icon: '🎨',
    category: 'creative',
    systemPrompt: 'أنت كاتب إبداعي. اكتب محتوى إبداعي وجذاب مع استخدام لغة غنية وصور بلاغية.',
    config: { temperature: 0.7 }
  },
  {
    id: 'data_analyst',
    name: 'محلل بيانات',
    description: 'تحليل البيانات واستخراج الرؤى',
    icon: '📊',
    category: 'analysis',
    systemPrompt: 'أنت محلل بيانات خبير. حلل البيانات واستخرج رؤى قيّمة. استخدم رسوم بيانية وإحصائيات.',
    config: { temperature: 0.2 }
  },
  {
    id: 'cybersecurity_expert',
    name: 'خبير أمن سيبراني',
    description: 'تحليل الثغرات الأمنية وتقديم حلول',
    icon: '🛡️',
    category: 'analysis',
    systemPrompt: 'أنت خبير أمن سيبراني. حلل الثغرات الأمنية وقدم حلول مفصلة. اشرح المخاطر وطرق الحماية.',
    config: { temperature: 0.2 }
  },
  {
    id: 'teacher',
    name: 'معلم',
    description: 'شرح المفاهيم التعليمية بطريقة مبسطة',
    icon: '📚',
    category: 'writing',
    systemPrompt: 'أنت معلم صبور. اشرح المفاهيم ببساطة مع أمثلة توضيحية. تأكد من فهم الطالب.',
    config: { temperature: 0.4 }
  },
  {
    id: 'content_writer',
    name: 'كاتب محتوى',
    description: 'كتابة محتوى تسويقي ومقالات',
    icon: '💬',
    category: 'writing',
    systemPrompt: 'أنت كاتب محتوى محترف. اكتب محتوى جذاب ومفيد مع مراعاة الجمهور المستهدف.',
    config: { temperature: 0.5 }
  },
  {
    id: 'software_engineer',
    name: 'مهندس برمجيات',
    description: 'تصميم وتطوير الحلول البرمجية',
    icon: '🔧',
    category: 'coding',
    systemPrompt: 'أنت مهندس برمجيات خبير. صمم وطور حلول برمجية فعّالة مع مراعاة الجودة والأداء.',
    config: { temperature: 0.3 }
  }
]
