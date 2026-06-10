import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { GameSettings } from '@/types'
import { SETTINGS_KEY, DEFAULT_SETTINGS } from '@/utils/constants'
import { indexedDBStorage } from '@/utils/indexedDBStorage'

interface SettingsStore extends GameSettings {
  setBgmVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  toggleMute: () => void
  toggleBgmMute: () => void
  setBgmMuted: (v: boolean) => void
  setQuality: (q: GameSettings['qualityPreset']) => void
  toggleDarkMode: () => void
  setFontSize: (s: number) => void
  setFontFamily: (f: string) => void
  setFontColor: (c: string) => void
  setHeadingFont: (f: string) => void
  setHeadingFontSize: (s: number) => void
  setHeadingColor: (c: string) => void
  setAccentColor: (c: string) => void
  setMutedColor: (c: string) => void
  setMutedFontSize: (s: number) => void
  setMonoFont: (f: string) => void
  setMonoFontSize: (s: number) => void
  setBorderRadius: (r: number) => void
  setBorderColor: (c: string) => void
  setBorderWidth: (w: number) => void
  setBgColor: (c: string) => void
  setBgBrightness: (b: number) => void
  setBgAnimationUrl: (url: string) => void
  setBgAnimationBrightness: (b: number) => void
  toggleAccessibility: () => void
  setCustomBgUrl: (url: string) => void
  setCustomBoyVideoUrl: (url: string) => void
  setCustomGirlVideoUrl: (url: string) => void
  setCustomZaynVideoUrl: (url: string) => void
  setCustomNoraVideoUrl: (url: string) => void
  setCustomOmarVideoUrl: (url: string) => void
  setCustomLaylaVideoUrl: (url: string) => void
  setCustomTariqVideoUrl: (url: string) => void
  setCustomSystemVideoUrl: (url: string) => void
  setCustomCelebrationVideoUrl: (url: string) => void
  setCustomFont: (name: string, url: string) => void
  setCustomHeadingFont: (name: string, url: string) => void
  removeCustomFont: () => void
  removeCustomHeadingFont: () => void
  resetAll: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setBgmVolume: (v) => set({ bgmVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      toggleBgmMute: () => set((s) => ({ bgmMuted: !s.bgmMuted })),
      setBgmMuted: (v) => set({ bgmMuted: v }),
      setQuality: (q) => set({ qualityPreset: q }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setFontSize: (s) => set({ fontSize: s }),
      setFontFamily: (f) => set({ fontFamily: f }),
      setFontColor: (c) => set({ fontColor: c }),
      setHeadingFont: (f) => set({ headingFont: f }),
      setHeadingFontSize: (s) => set({ headingFontSize: s }),
      setHeadingColor: (c) => set({ headingColor: c }),
      setAccentColor: (c) => set({ accentColor: c }),
      setMutedColor: (c) => set({ mutedColor: c }),
      setMutedFontSize: (s) => set({ mutedFontSize: s }),
      setMonoFont: (f) => set({ monoFont: f }),
      setMonoFontSize: (s) => set({ monoFontSize: s }),
      setBorderRadius: (r) => set({ borderRadius: r }),
      setBorderColor: (c) => set({ borderColor: c }),
      setBorderWidth: (w) => set({ borderWidth: w }),
      setBgColor: (c) => set({ bgColor: c }),
      setBgBrightness: (b) => set({ bgBrightness: b }),
      setBgAnimationUrl: (url) => set({ bgAnimationUrl: url }),
      setBgAnimationBrightness: (b) => set({ bgAnimationBrightness: b }),
      toggleAccessibility: () =>
        set((s) => ({ accessibilityMode: !s.accessibilityMode })),
      setCustomBgUrl: (url) => set({ customBgUrl: url }),
      setCustomBoyVideoUrl: (url) => set({ customBoyVideoUrl: url }),
      setCustomGirlVideoUrl: (url) => set({ customGirlVideoUrl: url }),
      setCustomZaynVideoUrl: (url) => set({ customZaynVideoUrl: url }),
      setCustomNoraVideoUrl: (url) => set({ customNoraVideoUrl: url }),
      setCustomOmarVideoUrl: (url) => set({ customOmarVideoUrl: url }),
      setCustomLaylaVideoUrl: (url) => set({ customLaylaVideoUrl: url }),
      setCustomTariqVideoUrl: (url) => set({ customTariqVideoUrl: url }),
      setCustomSystemVideoUrl: (url) => set({ customSystemVideoUrl: url }),
      setCustomCelebrationVideoUrl: (url) => set({ customCelebrationVideoUrl: url }),
      setCustomFont: (name, url) => set({ customFontName: name, customFontUrl: url }),
      setCustomHeadingFont: (name, url) => set({ customHeadingFontName: name, customHeadingFontUrl: url }),
      removeCustomFont: () => set({ customFontName: '', customFontUrl: '' }),
      removeCustomHeadingFont: () => set({ customHeadingFontName: '', customHeadingFontUrl: '' }),
      resetAll: () => set({ ...DEFAULT_SETTINGS }),
    }),
    { name: SETTINGS_KEY, storage: createJSONStorage(() => indexedDBStorage) }
  )
)
