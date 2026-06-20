export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'ar' | 'en'

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
}

export interface Theme {
  id: string
  name: string
  nameAr: string
  colors: ThemeColors
  isDark: boolean
}

export interface UIState {
  themeMode: ThemeMode
  language: Language
  fontSize: number
  compactMode: boolean
  animations: boolean
  sounds: boolean
  hapticFeedback: boolean
  autoSave: boolean
  showOnboarding: boolean
  sidebarCollapsed: boolean
  currentTheme: Theme

  setThemeMode: (mode: ThemeMode) => void
  setLanguage: (lang: Language) => void
  setFontSize: (size: number) => void
  toggleCompactMode: () => void
  toggleAnimations: () => void
  toggleSounds: () => void
  toggleHapticFeedback: () => void
  toggleAutoSave: () => void
  setShowOnboarding: (show: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
}

export const DARK_THEME: Theme = {
  id: 'dark',
  name: 'Dark',
  nameAr: 'داكن',
  colors: {
    primary: '#4CAF50',
    secondary: '#2196F3',
    background: '#0d1117',
    surface: '#161b22',
    text: '#ffffff',
    textSecondary: '#8b949e',
    border: '#30363d',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
    info: '#2196F3'
  },
  isDark: true
}

export const LIGHT_THEME: Theme = {
  id: 'light',
  name: 'Light',
  nameAr: 'فاتح',
  colors: {
    primary: '#4CAF50',
    secondary: '#2196F3',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#1a1a1a',
    textSecondary: '#666666',
    border: '#e0e0e0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
    info: '#2196F3'
  },
  isDark: false
}

export const CYBERPUNK_THEME: Theme = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  nameAr: 'سايبربنك',
  colors: {
    primary: '#00ff88',
    secondary: '#ff00ff',
    background: '#0a0a0f',
    surface: '#12121a',
    text: '#00ff88',
    textSecondary: '#8888aa',
    border: '#1a1a2e',
    success: '#00ff88',
    warning: '#ffff00',
    error: '#ff0044',
    info: '#00ffff'
  },
  isDark: true
}

export const OCEAN_THEME: Theme = {
  id: 'ocean',
  name: 'Ocean',
  nameAr: 'محيط',
  colors: {
    primary: '#0077b6',
    secondary: '#00b4d8',
    background: '#023e8a',
    surface: '#0353a4',
    text: '#ffffff',
    textSecondary: '#90e0ef',
    border: '#0096c7',
    success: '#48cae4',
    warning: '#ffd166',
    error: '#ef476f',
    info: '#00b4d8'
  },
  isDark: true
}

export const SUNSET_THEME: Theme = {
  id: 'sunset',
  name: 'Sunset',
  nameAr: 'غروب',
  colors: {
    primary: '#ff6b6b',
    secondary: '#feca57',
    background: '#1a1a2e',
    surface: '#16213e',
    text: '#ffffff',
    textSecondary: '#a0a0b0',
    border: '#2a2a4a',
    success: '#00d2d3',
    warning: '#feca57',
    error: '#ff6b6b',
    info: '#54a0ff'
  },
  isDark: true
}

export const AVAILABLE_THEMES: Theme[] = [
  DARK_THEME,
  LIGHT_THEME,
  CYBERPUNK_THEME,
  OCEAN_THEME,
  SUNSET_THEME
]

export const DEFAULT_UI_STATE: Omit<UIState, 'setThemeMode' | 'setLanguage' | 'setFontSize' | 'toggleCompactMode' | 'toggleAnimations' | 'toggleSounds' | 'toggleHapticFeedback' | 'toggleAutoSave' | 'setShowOnboarding' | 'toggleSidebar' | 'setTheme'> = {
  themeMode: 'dark',
  language: 'ar',
  fontSize: 14,
  compactMode: false,
  animations: true,
  sounds: true,
  hapticFeedback: true,
  autoSave: true,
  showOnboarding: true,
  sidebarCollapsed: false,
  currentTheme: DARK_THEME
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value)
  })
  root.style.setProperty('--bg-primary', theme.colors.background)
  root.style.setProperty('--bg-secondary', theme.colors.surface)
  root.style.setProperty('--text-primary', theme.colors.text)
  root.style.setProperty('--text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--border-color', theme.colors.border)
}

export function getResponsiveBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
