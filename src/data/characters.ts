import type { Character } from '@/types'

export const characters: Record<string, Character> = {
  zayn: {
    id: 'zayn',
    name: 'زين',
    role: 'محلل أمني',
    color: '#4FC3F7',
    personality: 'شجاع، فضولي، عبقري شاب. دايم يسأل "وش هذا؟"',
    gender: 'male' as const,
  },
  nora: {
    id: 'nora',
    name: 'د. نورا',
    role: 'خبيرة تشفير',
    color: '#CE93D8',
    personality: 'هادئة، دقيقة، منطقية. تستخدم理论和 قبل أي خطوة.',
    gender: 'female' as const,
  },
  omar: {
    id: 'omar',
    name: 'عمر',
    role: 'خبير شبكات',
    color: '#FFB74D',
    personality: 'نشيط، فكاهي، دايم معاه سناك. يضحك في أصعب المواقف.',
    gender: 'male' as const,
  },
  layla: {
    id: 'layla',
    name: 'ليلى',
    role: 'خبيرة أمن ويب',
    color: '#81C784',
    personality: 'مبدعة، تحل المشاكل من زوايا غريبة. تحب التحديات.',
    gender: 'female' as const,
  },
  tariq: {
    id: 'tariq',
    name: 'طارق',
    role: 'محلل برمجيات خبيثة',
    color: '#E57373',
    personality: 'مخضرم، جاد، نادر الضحك. لكن خبرته لا تُقدّر بثمن.',
    gender: 'male' as const,
  },
  system: {
    id: 'system',
    name: 'النظام',
    role: '',
    color: '#FFFFFF',
    personality: '',
    gender: 'male' as const,
  },
}
