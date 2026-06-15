export interface Rank {
  id: number
  title: string
  titleEn: string
  xpRequired: number
  color: string
  icon: string
}

export const RANKS: Rank[] = [
  { id: 1, title: 'طالب أمن', titleEn: 'Security Student', xpRequired: 0, color: '#888888', icon: '🛡️' },
  { id: 2, title: 'محلل بيانات', titleEn: 'Data Analyst', xpRequired: 100, color: '#4FC3F7', icon: '🔍' },
  { id: 3, title: 'خبير حماية', titleEn: 'Protection Expert', xpRequired: 300, color: '#FFB74D', icon: '🔐' },
  { id: 4, title: 'فارس الشبكة', titleEn: 'Network Knight', xpRequired: 600, color: '#CE93D8', icon: '⚔️' },
  { id: 5, title: 'أسطورة الأمن', titleEn: 'Security Legend', xpRequired: 1000, color: '#FFD700', icon: '👑' },
]

export function getRankByXp(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    const rank = RANKS[i]
    if (rank && xp >= rank.xpRequired) return rank
  }
  return RANKS[0]!
}

export function getNextRank(currentRankId: number): Rank | null {
  const idx = RANKS.findIndex((r) => r.id === currentRankId)
  return idx < RANKS.length - 1 ? RANKS[idx + 1]! : null
}

export function getXpForNextRank(xp: number): number {
  const current = getRankByXp(xp)
  const next = getNextRank(current.id)
  return next ? next.xpRequired : current.xpRequired
}
