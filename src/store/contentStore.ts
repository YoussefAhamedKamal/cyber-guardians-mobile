import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LevelData, Character, GameMeta } from '@/types'
import { indexedDBStorage } from '@/utils/indexedDBStorage'

const DEFAULT_GAME_META: GameMeta = {
  gameTitle: 'Cyber Guardians',
  gameSubtitle: 'حراس الأمن السيبراني',
  gameVersion: '1.0.0',
  defaultLanguage: 'ar',
  difficulty: 'medium',
  dailyRewardEnabled: true,
  dailyRewardPoints: 100,
  adsEnabled: false,
  iapEnabled: false,
  platformNotes: '',
  layoutWidth: 1200,
  layoutHeight: 675,
  layoutMode: 'responsive',
  hudPosition: 'top',
  menuStyle: 'cards',
  animationSpeed: 'normal',
  bgVolume: 0.7,
  sfxVolume: 1.0,
  voiceVolume: 1.0,
}

interface ContentStore {
  gameMeta: GameMeta
  levelOverrides: Record<number, Partial<LevelData>>
  characterOverrides: Record<string, Partial<Character>>
  newLevels: LevelData[]
  deletedLevels: number[]
  newCharacters: Record<string, Character>
  deletedCharacters: string[]

  setGameMeta: (data: Partial<GameMeta>) => void
  setLevelOverride: (id: number, data: Partial<LevelData>) => void
  setCharacterOverride: (id: string, data: Partial<Character>) => void
  addLevel: (level: LevelData) => void
  deleteLevel: (id: number) => void
  addCharacter: (id: string, character: Character) => void
  deleteCharacter: (id: string) => void
  resetLevel: (id: number) => void
  resetCharacter: (id: string) => void
  resetGameMeta: () => void
  resetAll: () => void
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set) => ({
      gameMeta: { ...DEFAULT_GAME_META },
      levelOverrides: {},
      characterOverrides: {},
      newLevels: [],
      deletedLevels: [],
      newCharacters: {},
      deletedCharacters: [],

      setGameMeta: (data) =>
        set((s) => ({
          gameMeta: { ...s.gameMeta, ...data },
        })),

      setLevelOverride: (id, data) =>
        set((s) => ({
          levelOverrides: { ...s.levelOverrides, [id]: { ...s.levelOverrides[id], ...data } },
        })),

      setCharacterOverride: (id, data) =>
        set((s) => ({
          characterOverrides: { ...s.characterOverrides, [id]: { ...s.characterOverrides[id], ...data } },
        })),

      addLevel: (level) =>
        set((s) => ({
          newLevels: [...s.newLevels, level],
        })),

      deleteLevel: (id) =>
        set((s) => ({
          deletedLevels: s.deletedLevels.includes(id) ? s.deletedLevels : [...s.deletedLevels, id],
          newLevels: s.newLevels.filter((l) => l.id !== id),
        })),

      addCharacter: (id, character) =>
        set((s) => ({
          newCharacters: { ...s.newCharacters, [id]: character },
          deletedCharacters: s.deletedCharacters.filter((d) => d !== id),
        })),

      deleteCharacter: (id) =>
        set((s) => ({
          deletedCharacters: s.deletedCharacters.includes(id) ? s.deletedCharacters : [...s.deletedCharacters, id],
          newCharacters: (() => { const n = { ...s.newCharacters }; delete n[id]; return n })(),
          characterOverrides: (() => { const n = { ...s.characterOverrides }; delete n[id]; return n })(),
        })),

      resetLevel: (id) =>
        set((s) => {
          const next = { ...s.levelOverrides }
          delete next[id]
          return {
            levelOverrides: next,
            deletedLevels: s.deletedLevels.filter((d) => d !== id),
            newLevels: s.newLevels.filter((l) => l.id !== id),
          }
        }),

      resetCharacter: (id) =>
        set((s) => {
          const next = { ...s.characterOverrides }
          delete next[id]
          return {
            characterOverrides: next,
            deletedCharacters: s.deletedCharacters.filter((d) => d !== id),
            newCharacters: (() => { const n = { ...s.newCharacters }; delete n[id]; return n })(),
          }
        }),

      resetGameMeta: () => set({ gameMeta: { ...DEFAULT_GAME_META } }),

      resetAll: () => set({
        gameMeta: { ...DEFAULT_GAME_META },
        levelOverrides: {},
        characterOverrides: {},
        newLevels: [],
        deletedLevels: [],
        newCharacters: {},
        deletedCharacters: [],
      }),
    }),
    {
      name: 'cg-content-overrides',
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
)
