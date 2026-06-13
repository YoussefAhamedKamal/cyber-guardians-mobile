export const BASE_URL = import.meta.env.BASE_URL
export const GAME_TITLE = 'Cyber Guardians'
export const GAME_SUBTITLE = 'حراس الأمن السيبراني'
export const DESIGN_WIDTH = 1200
export const DESIGN_HEIGHT = 675
export const ASPECT_RATIO = 16 / 9
export const STORAGE_KEY = 'cyber-guardians-save'
export const SETTINGS_KEY = 'cyber-guardians-settings'

export const GAMING_FONT_OPTIONS = ['Ryzes', 'Press Start 2P', 'VT323', 'Orbitron', 'Russo One', 'Rajdhani', 'Audiowide', 'Monoton', 'Teko'] as const

export const DEFAULT_SETTINGS = {
  bgmVolume: 0.7,
  sfxVolume: 1.0,
  muted: false,
  bgmMuted: false,
  qualityPreset: 'high' as const,
  fontSize: 16,
  fontFamily: 'Orbitron',
  fontColor: '#ffffff',
  headingFont: 'Orbitron',
  headingFontSize: 24,
  headingColor: '#4FC3F7',
  accentColor: '#4FC3F7',
  mutedColor: '#888888',
  mutedFontSize: 13,
  monoFont: 'Courier New',
  monoFontSize: 14,
  borderRadius: 12,
  borderColor: 'rgba(255,255,255,0.2)',
  borderWidth: 1,
  bgColor: '#0a0a1a',
  bgBrightness: 1.0,
  bgAnimationUrl: '',
  bgAnimationBrightness: 0.6,
  accessibilityMode: false,
  darkMode: true,
  customBgUrl: '',
  customBoyVideoUrl: '',
  customGirlVideoUrl: '',
  customZaynVideoUrl: '',
  customNoraVideoUrl: '',
  customOmarVideoUrl: '',
  customLaylaVideoUrl: '',
  customTariqVideoUrl: '',
  customSystemVideoUrl: '',
  customCelebrationVideoUrl: '',
  customFontName: '',
  customFontUrl: '',
  customHeadingFontName: '',
  customHeadingFontUrl: '',
}

export const QUALITY_PRESETS = {
  low: { pixelRatio: 0.5, shadows: false, antialias: false },
  medium: { pixelRatio: 0.75, shadows: true, antialias: true },
  high: { pixelRatio: 1.0, shadows: true, antialias: true },
} as const

export const FONT_OPTIONS = ['Cairo', 'Amiri', 'Noto Naskh Arabic', 'Segoe UI', 'Traditional Arabic', ...GAMING_FONT_OPTIONS] as const

export const HEADING_FONT_OPTIONS = ['Cairo', 'Amiri', 'Noto Naskh Arabic', 'Traditional Arabic', 'Arial Black', 'Impact', ...GAMING_FONT_OPTIONS] as const

export const MONO_FONT_OPTIONS = ['Courier New', 'Consolas', 'Fira Code', 'Source Code Pro', 'monospace'] as const

export const SHORTCUTS = [
  { key: 'Enter', desc: 'متابعة الحوار / تأكيد' },
  { key: 'Escape', desc: 'العودة / إغلاق' },
  { key: '← → ↑ ↓', desc: 'التنقل في الألعاب' },
  { key: 'M', desc: 'كتم / إلغاء كتم الصوت العام' },
  { key: 'B', desc: 'كتم / إلغاء كتم الموسيقى الخلفية' },
  { key: 'Space', desc: 'تخطي النص' },
] as const

export const MAX_VIDEO_SIZE = 50 * 1024 * 1024
export const MAX_ANIMATION_SIZE = 20 * 1024 * 1024
