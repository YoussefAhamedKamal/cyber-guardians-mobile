import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/store/gameStore'

const store = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => { store.set(key, val) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => store.clear(),
    get length() { return store.size },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  writable: true,
  configurable: true,
})

beforeEach(() => {
  store.clear()
  useGameStore.getState().resetProgress()
})

describe('gameStore', () => {
  it('starts at level 1 with no progress', () => {
    const state = useGameStore.getState()
    expect(state.currentLevel).toBe(1)
    expect(state.completedLevels.size).toBe(0)
    expect(state.totalScore).toBe(0)
    expect(state.isPlaying).toBe(false)
  })

  it('setLevel changes current level', () => {
    useGameStore.getState().setLevel(3)
    expect(useGameStore.getState().currentLevel).toBe(3)
  })

  it('startGame sets isPlaying to true', () => {
    useGameStore.getState().startGame()
    expect(useGameStore.getState().isPlaying).toBe(true)
  })

  it('completeLevel adds to completed set and score', () => {
    useGameStore.getState().completeLevel(1, 85)
    const state = useGameStore.getState()
    expect(state.completedLevels.has(1)).toBe(true)
    expect(state.totalScore).toBe(85)
  })

  it('completeLevel accumulates score across levels', () => {
    useGameStore.getState().completeLevel(1, 80)
    useGameStore.getState().completeLevel(2, 90)
    expect(useGameStore.getState().totalScore).toBe(170)
  })

  it('getProgress returns 0% initially', () => {
    expect(useGameStore.getState().getProgress()).toBe(0)
  })

  it('getProgress returns 100% when all 7 levels done', () => {
    for (let i = 1; i <= 7; i++) {
      useGameStore.getState().completeLevel(i as 1 | 2 | 3 | 4 | 5 | 6 | 7, 100)
    }
    expect(useGameStore.getState().getProgress()).toBe(100)
  })

  it('togglePause flips isPaused', () => {
    expect(useGameStore.getState().isPaused).toBe(false)
    useGameStore.getState().togglePause()
    expect(useGameStore.getState().isPaused).toBe(true)
    useGameStore.getState().togglePause()
    expect(useGameStore.getState().isPaused).toBe(false)
  })

  it('resetProgress clears everything', () => {
    useGameStore.getState().completeLevel(1, 100)
    useGameStore.getState().setLevel(5)
    useGameStore.getState().startGame()
    useGameStore.getState().resetProgress()

    const state = useGameStore.getState()
    expect(state.currentLevel).toBe(1)
    expect(state.completedLevels.size).toBe(0)
    expect(state.totalScore).toBe(0)
    expect(state.isPlaying).toBe(false)
  })
})
