import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type {
  UIState,
  ThemeMode,
  Language,
  Theme
} from '@/types/ui'
import {
  DEFAULT_UI_STATE,
  DARK_THEME,
  LIGHT_THEME,
  getSystemTheme,
  applyTheme
} from '@/types/ui'

type UIStore = UIState

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_UI_STATE,

      setThemeMode: (mode) => {
        const state = get()
        let resolvedTheme = state.currentTheme

        if (mode === 'system') {
          const systemTheme = getSystemTheme()
          resolvedTheme = systemTheme === 'dark' ? DARK_THEME : LIGHT_THEME
        } else if (mode === 'dark') {
          resolvedTheme = DARK_THEME
        } else {
          resolvedTheme = LIGHT_THEME
        }

        applyTheme(resolvedTheme)
        set({ themeMode: mode, currentTheme: resolvedTheme })
      },

      setLanguage: (lang) => {
        set({ language: lang })
        document.documentElement.lang = lang
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      },

      setFontSize: (size) => {
        set({ fontSize: size })
        document.documentElement.style.fontSize = `${size}px`
      },

      toggleCompactMode: () => {
        set((state) => ({ compactMode: !state.compactMode }))
      },

      toggleAnimations: () => {
        set((state) => ({ animations: !state.animations }))
      },

      toggleSounds: () => {
        set((state) => ({ sounds: !state.sounds }))
      },

      toggleHapticFeedback: () => {
        set((state) => ({ hapticFeedback: !state.hapticFeedback }))
      },

      toggleAutoSave: () => {
        set((state) => ({ autoSave: !state.autoSave }))
      },

      setShowOnboarding: (show) => {
        set({ showOnboarding: show })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setTheme: (theme) => {
        applyTheme(theme)
        set({ currentTheme: theme, themeMode: theme.isDark ? 'dark' : 'light' })
      }
    }),
    {
      name: 'cyber-guardians-ui',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.currentTheme) {
          applyTheme(state.currentTheme)
        }
        if (state?.language) {
          document.documentElement.lang = state.language
          document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr'
        }
        if (state?.fontSize) {
          document.documentElement.style.fontSize = `${state.fontSize}px`
        }
      }
    }
  )
)
