export function calculateChallengeXp(score: number, difficulty: number): number {
  const base = Math.floor(score / 10)
  const multiplier = 1 + (difficulty - 1) * 0.25
  return Math.floor(base * multiplier)
}

export function calculateQuizXp(correct: number, total: number, difficulty: number): number {
  const accuracy = correct / total
  const base = correct * 10
  const multiplier = 1 + (difficulty - 1) * 0.5
  return Math.floor(base * multiplier * accuracy)
}

export function calculateDailyReward(streakDays: number, baseReward: number): number {
  return baseReward + (streakDays - 1) * 10
}

export function calculateComboBonus(combo: number, difficulty: number): number {
  if (combo < 2) return 0
  return combo * 5 * difficulty
}

export function calculateSpeedBonus(timeRemaining: number, difficulty: number): number {
  return Math.floor(timeRemaining * 0.5 * difficulty)
}
