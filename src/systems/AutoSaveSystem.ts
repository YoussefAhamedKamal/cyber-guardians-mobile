import { useGameStore } from '@/store'
import type { LevelId } from '@/types'

const AUTO_SAVE_KEY = 'cg-autosave'
const SAVE_INTERVAL = 30000

interface AutoSaveData {
  currentLevel: LevelId
  completedLevels: LevelId[]
  totalScore: number
  timestamp: number
}

let intervalId: ReturnType<typeof setInterval> | null = null

function tick() {
  if (typeof document !== 'undefined' && document.hidden) return
  const state = useGameStore.getState()
  const data: AutoSaveData = {
    currentLevel: state.currentLevel,
    completedLevels: [...state.completedLevels],
    totalScore: state.totalScore,
    timestamp: Date.now(),
  }
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data))
  } catch {}
}

export const autoSave = {
  start() {
    if (intervalId) return
    intervalId = setInterval(tick, SAVE_INTERVAL)
  },

  stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  },

  saveNow() {
    tick()
  },

  load(): AutoSaveData | null {
    try {
      const raw = localStorage.getItem(AUTO_SAVE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as AutoSaveData
    } catch {
      return null
    }
  },

  clear() {
    localStorage.removeItem(AUTO_SAVE_KEY)
  },
}
