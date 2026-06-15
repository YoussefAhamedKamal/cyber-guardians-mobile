export interface Mission {
  id: string
  icon: string
  text: string
  target: number
  xp: number
  type: 'lessons' | 'correct' | 'quiz' | 'speed' | 'questions'
}

export const MISSION_TEMPLATES: Mission[] = [
  { id: 'daily_lessons', icon: '📖', text: 'إكمال درسين', target: 2, xp: 50, type: 'lessons' },
  { id: 'daily_correct', icon: '✅', text: '5 إجابات صحيحة', target: 5, xp: 60, type: 'correct' },
  { id: 'daily_quiz', icon: '🎯', text: 'إكمال اختبار', target: 1, xp: 80, type: 'quiz' },
  { id: 'daily_speed', icon: '⚡', text: '3 إجابات سريعة', target: 3, xp: 70, type: 'speed' },
  { id: 'daily_questions', icon: '🧠', text: 'الإجابة على 8 أسئلة', target: 8, xp: 45, type: 'questions' },
]

export function generateDailyMissions(date: string): Mission[] {
  const seed = hashString(date)
  const shuffled = [...MISSION_TEMPLATES].sort((a, b) => {
    const sa = hashString(a.id + date)
    const sb = hashString(b.id + date)
    return sa - sb
  })
  return shuffled.slice(0, 3)
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export interface MissionProgress {
  lessons: number
  correct: number
  quiz: number
  speed: number
  questions: number
}

export function getMissionProgress(
  missions: Mission[],
  progress: MissionProgress
): { mission: Mission; current: number; completed: boolean }[] {
  return missions.map((m) => ({
    mission: m,
    current: Math.min(progress[m.type], m.target),
    completed: progress[m.type] >= m.target,
  }))
}
