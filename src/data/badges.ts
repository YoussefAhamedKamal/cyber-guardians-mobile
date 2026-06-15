export interface Badge {
  id: string
  emoji: string
  name: string
  description: string
  condition: (state: BadgeCheckState) => boolean
}

export interface BadgeCheckState {
  completedLevels: Set<number>
  totalScore: number
  xp: number
  rankId: number
  playerName: string
  dailyStreakDays: number
  quizBestScore: number
  speedAnswers: number
  maxCombo: number
  hintsUsedThisQuiz: number
  quizRetries: number
  preTestScore: number
  postTestScore: number
}

export const BADGES: Badge[] = [
  {
    id: 'first_level',
    emoji: '📖',
    name: 'المبتدئ',
    description: 'أول خطوة في عالم الأمن',
    condition: (s) => s.completedLevels.size >= 1,
  },
  {
    id: 'half_levels',
    emoji: '📚',
    name: 'المتعلم النشيط',
    description: 'نصف الطريق إلى الخبرة',
    condition: (s) => s.completedLevels.size >= 4,
  },
  {
    id: 'all_levels',
    emoji: '🎓',
    name: 'خبير الأمن',
    description: 'أتقنت أساسيات الأمن',
    condition: (s) => s.completedLevels.size >= 7,
  },
  {
    id: 'perfect_score',
    emoji: '💎',
    name: 'المتفوق',
    description: 'نتيجة مثالية في التحدي',
    condition: (s) => s.quizBestScore === 100,
  },
  {
    id: 'speed_demon',
    emoji: '⚡',
    name: 'سريع',
    description: 'إجابة في أقل من 5 ثوانٍ',
    condition: (s) => s.speedAnswers >= 1,
  },
  {
    id: 'combo_master',
    emoji: '🔥',
    name: 'ملك السلسلة',
    description: '3 إجابات متتالية',
    condition: (s) => s.maxCombo >= 3,
  },
  {
    id: 'daily_streak',
    emoji: '📅',
    name: 'المواظب',
    description: '3 أيام متتالية',
    condition: (s) => s.dailyStreakDays >= 3,
  },
  {
    id: 'high_score',
    emoji: '🏆',
    name: 'بطل النقاط',
    description: '500 نقطة إجمالي',
    condition: (s) => s.totalScore >= 500,
  },
  {
    id: 'speed_hunter',
    emoji: '🎯',
    name: 'صائد السرعة',
    description: '10 إجابات سريعة',
    condition: (s) => s.speedAnswers >= 10,
  },
  {
    id: 'no_hint',
    emoji: '🧠',
    name: 'العلّامة',
    description: 'إكمال اختبار بدون تلميحات',
    condition: (s) => s.hintsUsedThisQuiz === 0 && s.quizBestScore > 0,
  },
  {
    id: 'survivor',
    emoji: '🛡️',
    name: 'الصابر',
    description: 'إكمال صعب بقلب واحد',
    condition: (s) => s.completedLevels.size >= 7,
  },
  {
    id: 'comeback',
    emoji: '💪',
    name: 'المكافح',
    description: 'إعادة الاختبار 3 مرات',
    condition: (s) => s.quizRetries >= 3,
  },
  {
    id: 'weekly_streak',
    emoji: '🌟',
    name: 'المواظب الأسبوعي',
    description: '7 أيام متتالية',
    condition: (s) => s.dailyStreakDays >= 7,
  },
  {
    id: 'max_rank',
    emoji: '👑',
    name: 'المحترف الرقمي',
    description: 'الوصول لأعلى رتبة',
    condition: (s) => s.rankId >= 5,
  },
  {
    id: 'assessor',
    emoji: '📊',
    name: 'المقيّم',
    description: 'إكمال تقييم قبل/بعد',
    condition: (s) => s.preTestScore > 0 && s.postTestScore > 0,
  },
]

export function checkBadges(state: BadgeCheckState): string[] {
  return BADGES.filter((b) => b.condition(state)).map((b) => b.id)
}

export function getNewBadges(unlockedIds: string[], state: BadgeCheckState): Badge[] {
  const newIds = checkBadges(state).filter((id) => !unlockedIds.includes(id))
  return BADGES.filter((b) => newIds.includes(b.id))
}
