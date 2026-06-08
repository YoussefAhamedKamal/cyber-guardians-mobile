import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LevelData, Character } from '@/types'
import { indexedDBStorage } from '@/utils/indexedDBStorage'

interface ContentStore {
  levelOverrides: Record<number, Partial<LevelData>>
  characterOverrides: Record<string, Partial<Character>>
  newLevels: LevelData[]
  deletedLevels: number[]
  newCharacters: Record<string, Character>
  deletedCharacters: string[]

  setLevelOverride: (id: number, data: Partial<LevelData>) => void
  setCharacterOverride: (id: string, data: Partial<Character>) => void
  addLevel: (level: LevelData) => void
  deleteLevel: (id: number) => void
  addCharacter: (id: string, character: Character) => void
  deleteCharacter: (id: string) => void
  resetLevel: (id: number) => void
  resetCharacter: (id: string) => void
  resetAll: () => void
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set) => ({
      levelOverrides: {},
      characterOverrides: {},
      newLevels: [],
      deletedLevels: [],
      newCharacters: {},
      deletedCharacters: [],

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

      resetAll: () => set({
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
