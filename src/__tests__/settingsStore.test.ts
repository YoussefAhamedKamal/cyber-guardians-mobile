import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '@/store/settingsStore'
import { DEFAULT_SETTINGS } from '@/utils/constants'

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
  useSettingsStore.getState().resetAll()
})

describe('settingsStore', () => {
  it('starts with defaults', () => {
    const state = useSettingsStore.getState()
    expect(state.bgmVolume).toBe(DEFAULT_SETTINGS.bgmVolume)
    expect(state.sfxVolume).toBe(DEFAULT_SETTINGS.sfxVolume)
    expect(state.muted).toBe(false)
    expect(state.qualityPreset).toBe('high')
  })

  it('setBgmVolume updates volume', () => {
    useSettingsStore.getState().setBgmVolume(0.3)
    expect(useSettingsStore.getState().bgmVolume).toBe(0.3)
  })

  it('setSfxVolume updates volume', () => {
    useSettingsStore.getState().setSfxVolume(0.5)
    expect(useSettingsStore.getState().sfxVolume).toBe(0.5)
  })

  it('toggleMute flips muted', () => {
    useSettingsStore.getState().toggleMute()
    expect(useSettingsStore.getState().muted).toBe(true)
    useSettingsStore.getState().toggleMute()
    expect(useSettingsStore.getState().muted).toBe(false)
  })

  it('setQuality changes quality preset', () => {
    useSettingsStore.getState().setQuality('low')
    expect(useSettingsStore.getState().qualityPreset).toBe('low')
  })

  it('resetAll restores defaults', () => {
    useSettingsStore.getState().setBgmVolume(0.1)
    useSettingsStore.getState().setQuality('low')
    useSettingsStore.getState().toggleMute()
    useSettingsStore.getState().resetAll()
    const state = useSettingsStore.getState()
    expect(state.bgmVolume).toBe(DEFAULT_SETTINGS.bgmVolume)
    expect(state.qualityPreset).toBe(DEFAULT_SETTINGS.qualityPreset)
    expect(state.muted).toBe(false)
  })
})
