import { useContentStore } from '@/store/contentStore'
import { levels as defaultLevels } from './dialogue'
import { characters as defaultCharacters } from './characters'
import type { LevelData, Character, GameMeta } from '@/types'

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
}

export function getGameMeta(): GameMeta {
  const store = useContentStore.getState()
  return store.gameMeta || DEFAULT_GAME_META
}

export function getLevels(): LevelData[] {
  const store = useContentStore.getState()
  const { levelOverrides, newLevels, deletedLevels } = store

  const merged = defaultLevels
    .filter((level) => !deletedLevels.includes(level.id))
    .map((level) => {
      const override = levelOverrides[level.id]
      if (!override) return level
      return { ...level, ...override } as LevelData
    })

  return [...merged, ...newLevels]
}

export function getCharacters(): Record<string, Character> {
  const store = useContentStore.getState()
  const { characterOverrides, newCharacters, deletedCharacters } = store

  const result: Record<string, Character> = { ...defaultCharacters }

  for (const id of deletedCharacters) {
    delete result[id]
  }

  for (const [id, override] of Object.entries(characterOverrides)) {
    if (result[id]) {
      result[id] = { ...result[id], ...override } as Character
    }
  }

  for (const [id, char] of Object.entries(newCharacters)) {
    result[id] = char
  }

  return result
}

export function getDefaultLevels(): LevelData[] {
  return defaultLevels
}

export function getDefaultCharacters(): Record<string, Character> {
  return defaultCharacters
}
