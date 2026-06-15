import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChallengeState, LevelId } from '@/types'
import { STORAGE_KEY } from '@/utils/constants'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import { getRankByXp, type Rank } from '@/data/ranks'
import { checkBadges, type BadgeCheckState } from '@/data/badges'
import { logger } from '@/utils/logger'

interface MissionProgress {
  lessons: number
  correct: number
  quiz: number
  speed: number
  questions: number
}

interface GameStore {
  currentLevel: LevelId
  completedLevels: Set<LevelId>
  totalScore: number
  isPlaying: boolean
  isPaused: boolean

  // Gamification
  xp: number
  rank: Rank
  playerName: string
  unlockedBadges: string[]
  dailyStreakDays: number
  lastLoginDate: string | null
  lastDailyClaimDate: string | null
  quizBestScore: number
  speedAnswers: number
  maxCombo: number
  currentCombo: number
  hearts: number
  maxHearts: number
  hintsUsedThisQuiz: number
  quizRetries: number
  preTestScore: number
  postTestScore: number

  // Daily missions
  missionsDate: string | null
  missionProgress: MissionProgress

  // Weekly challenge
  weeklyChallengeDone: boolean
  weeklyChallengeWeek: string | null

  // Difficulty
  selectedDifficulty: string

  // Actions
  setLevel: (level: LevelId) => void
  completeLevel: (level: LevelId, score: number) => void
  togglePause: () => void
  startGame: () => void
  resetProgress: () => void
  getProgress: () => number

  // Gamification actions
  addXp: (amount: number) => void
  setPlayerName: (name: string) => void
  setQuizBestScore: (score: number) => void
  addSpeedAnswer: () => void
  setMaxCombo: (combo: number) => void
  setCurrentCombo: (combo: number) => void
  loseHeart: () => void
  resetHearts: () => void
  setHintsUsedThisQuiz: (hints: number) => void
  addQuizRetry: () => void
  setPreTestScore: (score: number) => void
  setPostTestScore: (score: number) => void
  updateDailyStreak: () => void
  checkAndUnlockBadges: () => string[]
  claimDailyReward: () => void

  // Mission actions
  updateMissionProgress: (type: keyof MissionProgress, amount: number) => void
  resetMissionsIfNewDay: () => void

  // Weekly challenge actions
  completeWeeklyChallenge: () => void

  // Difficulty actions
  setSelectedDifficulty: (id: string) => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentLevel: 1 as LevelId,
      completedLevels: new Set(),
      totalScore: 0,
      isPlaying: false,
      isPaused: false,

      // Gamification defaults
      xp: 0,
      rank: getRankByXp(0),
      playerName: 'لاعب',
      unlockedBadges: [],
      dailyStreakDays: 0,
      lastLoginDate: null,
      lastDailyClaimDate: null,
      quizBestScore: 0,
      speedAnswers: 0,
      maxCombo: 0,
      currentCombo: 0,
      hearts: 5,
      maxHearts: 5,
      hintsUsedThisQuiz: 0,
      quizRetries: 0,
      preTestScore: 0,
      postTestScore: 0,

      // Daily missions defaults
      missionsDate: null,
      missionProgress: { lessons: 0, correct: 0, quiz: 0, speed: 0, questions: 0 },

      // Weekly challenge defaults
      weeklyChallengeDone: false,
      weeklyChallengeWeek: null,

      // Difficulty defaults
      selectedDifficulty: 'medium',

      setLevel: (level) => set({ currentLevel: level }),

      completeLevel: (level, score) => {
        const prev = get()
        const next = new Set(prev.completedLevels)
        next.add(level)
        const xpGain = Math.floor(score / 5)
        const newTotalXp = prev.xp + xpGain
        const newRank = getRankByXp(newTotalXp)
        if (newRank.id > prev.rank.id) {
          logger.info('rank_up', { oldRank: prev.rank.id, newRank: newRank.id })
        }
        const newBadges = checkBadges({
          completedLevels: next,
          totalScore: prev.totalScore + score,
          xp: newTotalXp,
          rankId: newRank.id,
          playerName: prev.playerName,
          dailyStreakDays: prev.dailyStreakDays,
          quizBestScore: prev.quizBestScore,
          speedAnswers: prev.speedAnswers,
          maxCombo: prev.maxCombo,
          hintsUsedThisQuiz: prev.hintsUsedThisQuiz,
          quizRetries: prev.quizRetries,
          preTestScore: prev.preTestScore,
          postTestScore: prev.postTestScore,
        }).filter((id) => !prev.unlockedBadges.includes(id))
        if (newBadges.length > 0) {
          logger.info('badge_unlocked', { badges: newBadges })
        }
        set({
          completedLevels: next,
          totalScore: prev.totalScore + score,
          xp: newTotalXp,
          rank: newRank,
          unlockedBadges: [...prev.unlockedBadges, ...newBadges],
        })
      },

      togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

      startGame: () => set({ isPlaying: true, isPaused: false }),

      resetProgress: () =>
        set({
          currentLevel: 1 as LevelId,
          completedLevels: new Set(),
          totalScore: 0,
          isPlaying: false,
          isPaused: false,
          xp: 0,
          rank: getRankByXp(0),
          unlockedBadges: [],
          dailyStreakDays: 0,
          lastLoginDate: null,
          lastDailyClaimDate: null,
          quizBestScore: 0,
          speedAnswers: 0,
          maxCombo: 0,
          hintsUsedThisQuiz: 0,
          quizRetries: 0,
          preTestScore: 0,
          postTestScore: 0,
          missionsDate: null,
          missionProgress: { lessons: 0, correct: 0, quiz: 0, speed: 0, questions: 0 },
          weeklyChallengeDone: false,
          weeklyChallengeWeek: null,
        }),

      getProgress: () => {
        return (get().completedLevels.size / 7) * 100
      },

      // Gamification actions
      addXp: (amount) => {
        const prev = get()
        const newXp = prev.xp + amount
        const newRank = getRankByXp(newXp)
        if (newRank.id > prev.rank.id) {
          logger.info('rank_up', { oldRank: prev.rank.id, newRank: newRank.id })
        }
        const newBadges = checkBadges({
          completedLevels: prev.completedLevels,
          totalScore: prev.totalScore,
          xp: newXp,
          rankId: newRank.id,
          playerName: prev.playerName,
          dailyStreakDays: prev.dailyStreakDays,
          quizBestScore: prev.quizBestScore,
          speedAnswers: prev.speedAnswers,
          maxCombo: prev.maxCombo,
          hintsUsedThisQuiz: prev.hintsUsedThisQuiz,
          quizRetries: prev.quizRetries,
          preTestScore: prev.preTestScore,
          postTestScore: prev.postTestScore,
        }).filter((id) => !prev.unlockedBadges.includes(id))
        if (newBadges.length > 0) {
          logger.info('badge_unlocked', { badges: newBadges })
        }
        set({
          xp: newXp,
          rank: newRank,
          unlockedBadges: [...prev.unlockedBadges, ...newBadges],
        })
      },

      setPlayerName: (name) => {
        logger.info('player_name_set', { name })
        set({ playerName: name })
      },

      setQuizBestScore: (score) =>
        set((s) => ({
          quizBestScore: Math.max(s.quizBestScore, score),
        })),

      addSpeedAnswer: () =>
        set((s) => ({ speedAnswers: s.speedAnswers + 1 })),

      setMaxCombo: (combo) =>
        set((s) => ({
          maxCombo: Math.max(s.maxCombo, combo),
        })),

      setCurrentCombo: (combo) =>
        set({ currentCombo: combo }),

      loseHeart: () =>
        set((s) => ({
          hearts: Math.max(0, s.hearts - 1),
        })),

      resetHearts: () =>
        set((s) => ({
          hearts: s.maxHearts,
        })),

      setHintsUsedThisQuiz: (hints) =>
        set({ hintsUsedThisQuiz: hints }),

      addQuizRetry: () =>
        set((s) => ({ quizRetries: s.quizRetries + 1 })),

      setPreTestScore: (score) =>
        set({ preTestScore: score }),

      setPostTestScore: (score) =>
        set({ postTestScore: score }),

      updateDailyStreak: () =>
        set((s) => {
          const today = new Date().toDateString()
          if (s.lastLoginDate === today) return s

          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const isConsecutive = s.lastLoginDate === yesterday.toDateString()

          const newStreak = isConsecutive ? s.dailyStreakDays + 1 : 1
          logger.info('daily_streak', { streak: newStreak, date: today })
          return {
            dailyStreakDays: newStreak,
            lastLoginDate: today,
          }
        }),

      checkAndUnlockBadges: () => {
        const s = get()
        const state: BadgeCheckState = {
          completedLevels: s.completedLevels,
          totalScore: s.totalScore,
          xp: s.xp,
          rankId: s.rank.id,
          playerName: s.playerName,
          dailyStreakDays: s.dailyStreakDays,
          quizBestScore: s.quizBestScore,
          speedAnswers: s.speedAnswers,
          maxCombo: s.maxCombo,
          hintsUsedThisQuiz: s.hintsUsedThisQuiz,
          quizRetries: s.quizRetries,
          preTestScore: s.preTestScore,
          postTestScore: s.postTestScore,
        }
        const newBadges = checkBadges(state).filter((id) => !s.unlockedBadges.includes(id))
        if (newBadges.length > 0) {
          logger.info('badge_unlocked', { badges: newBadges })
          set({ unlockedBadges: [...s.unlockedBadges, ...newBadges] })
        }
        return newBadges
      },

      claimDailyReward: () =>
        set((s) => {
          const today = new Date().toDateString()
          return { lastDailyClaimDate: today }
        }),

      // Mission actions
      updateMissionProgress: (type, amount) =>
        set((s) => ({
          missionProgress: {
            ...s.missionProgress,
            [type]: s.missionProgress[type] + amount,
          },
        })),

      resetMissionsIfNewDay: () =>
        set((s) => {
          const today = new Date().toDateString()
          if (s.missionsDate === today) return s
          return {
            missionsDate: today,
            missionProgress: { lessons: 0, correct: 0, quiz: 0, speed: 0, questions: 0 },
          }
        }),

      // Weekly challenge actions
      completeWeeklyChallenge: () =>
        set((s) => {
          const now = new Date()
          const startOfYear = new Date(now.getFullYear(), 0, 1)
          const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
          const weekNumber = Math.ceil(days / 7)
          const weekStr = `${now.getFullYear()}W${weekNumber}`
          if (s.weeklyChallengeWeek === weekStr && s.weeklyChallengeDone) return s
          logger.info('weekly_challenge_completed', { week: weekStr })
          return {
            weeklyChallengeDone: true,
            weeklyChallengeWeek: weekStr,
          }
        }),

      // Difficulty actions
      setSelectedDifficulty: (id) => set({ selectedDifficulty: id }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (s) => ({
        currentLevel: s.currentLevel,
        completedLevels: [...s.completedLevels],
        totalScore: s.totalScore,
        xp: s.xp,
        rankId: s.rank.id,
        playerName: s.playerName,
        unlockedBadges: s.unlockedBadges,
        dailyStreakDays: s.dailyStreakDays,
        lastLoginDate: s.lastLoginDate,
        lastDailyClaimDate: s.lastDailyClaimDate,
        quizBestScore: s.quizBestScore,
        speedAnswers: s.speedAnswers,
        maxCombo: s.maxCombo,
        currentCombo: s.currentCombo,
        hearts: s.hearts,
        maxHearts: s.maxHearts,
        hintsUsedThisQuiz: s.hintsUsedThisQuiz,
        quizRetries: s.quizRetries,
        preTestScore: s.preTestScore,
        postTestScore: s.postTestScore,
        missionsDate: s.missionsDate,
        missionProgress: s.missionProgress,
        weeklyChallengeDone: s.weeklyChallengeDone,
        weeklyChallengeWeek: s.weeklyChallengeWeek,
        selectedDifficulty: s.selectedDifficulty,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | undefined
        if (!p) return current
        const raw = p.completedLevels
        const levels: LevelId[] = Array.isArray(raw)
          ? (raw as LevelId[])
          : typeof raw === 'object' && raw !== null
            ? Object.keys(raw).map(Number).filter((n) => (raw as Record<string, unknown>)[String(n)] === true) as LevelId[]
            : []
        return {
          ...current,
          currentLevel: (typeof p.currentLevel === 'number' ? p.currentLevel : 1) as LevelId,
          completedLevels: new Set(levels),
          totalScore: typeof p.totalScore === 'number' ? p.totalScore : 0,
          xp: typeof p.xp === 'number' ? p.xp : 0,
          rank: getRankByXp(typeof p.xp === 'number' ? p.xp : 0),
          playerName: typeof p.playerName === 'string' ? p.playerName : 'لاعب',
          unlockedBadges: Array.isArray(p.unlockedBadges) ? p.unlockedBadges : [],
          dailyStreakDays: typeof p.dailyStreakDays === 'number' ? p.dailyStreakDays : 0,
          lastLoginDate: typeof p.lastLoginDate === 'string' ? p.lastLoginDate : null,
          lastDailyClaimDate: typeof p.lastDailyClaimDate === 'string' ? p.lastDailyClaimDate : null,
          quizBestScore: typeof p.quizBestScore === 'number' ? p.quizBestScore : 0,
          speedAnswers: typeof p.speedAnswers === 'number' ? p.speedAnswers : 0,
          maxCombo: typeof p.maxCombo === 'number' ? p.maxCombo : 0,
          currentCombo: typeof p.currentCombo === 'number' ? p.currentCombo : 0,
          hearts: typeof p.hearts === 'number' ? p.hearts : 5,
          maxHearts: typeof p.maxHearts === 'number' ? p.maxHearts : 5,
          hintsUsedThisQuiz: typeof p.hintsUsedThisQuiz === 'number' ? p.hintsUsedThisQuiz : 0,
          quizRetries: typeof p.quizRetries === 'number' ? p.quizRetries : 0,
          preTestScore: typeof p.preTestScore === 'number' ? p.preTestScore : 0,
          postTestScore: typeof p.postTestScore === 'number' ? p.postTestScore : 0,
          missionsDate: typeof p.missionsDate === 'string' ? p.missionsDate : null,
          missionProgress: (p.missionProgress && typeof p.missionProgress === 'object')
            ? p.missionProgress as MissionProgress
            : { lessons: 0, correct: 0, quiz: 0, speed: 0, questions: 0 },
          weeklyChallengeDone: typeof p.weeklyChallengeDone === 'boolean' ? p.weeklyChallengeDone : false,
          weeklyChallengeWeek: typeof p.weeklyChallengeWeek === 'string' ? p.weeklyChallengeWeek : null,
          selectedDifficulty: typeof p.selectedDifficulty === 'string' ? p.selectedDifficulty : 'medium',
        }
      },
    }
  )
)
