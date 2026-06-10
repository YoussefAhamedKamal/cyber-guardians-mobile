export interface GameSettings {
  bgmVolume: number
  sfxVolume: number
  muted: boolean
  bgmMuted: boolean
  qualityPreset: 'low' | 'medium' | 'high'
  fontSize: number
  fontFamily: string
  fontColor: string
  headingFont: string
  headingFontSize: number
  headingColor: string
  accentColor: string
  mutedColor: string
  mutedFontSize: number
  monoFont: string
  monoFontSize: number
  borderRadius: number
  borderColor: string
  borderWidth: number
  bgColor: string
  bgBrightness: number
  bgAnimationUrl: string
  bgAnimationBrightness: number
  accessibilityMode: boolean
  darkMode: boolean
  customBgUrl: string
  customBoyVideoUrl: string
  customGirlVideoUrl: string
  customZaynVideoUrl: string
  customNoraVideoUrl: string
  customOmarVideoUrl: string
  customLaylaVideoUrl: string
  customTariqVideoUrl: string
  customSystemVideoUrl: string
  customCelebrationVideoUrl: string
  customFontName: string
  customFontUrl: string
  customHeadingFontName: string
  customHeadingFontUrl: string
}

export interface GameMeta {
  gameTitle: string
  gameSubtitle: string
  gameVersion: string
  defaultLanguage: string
  difficulty: 'easy' | 'medium' | 'hard'
  dailyRewardEnabled: boolean
  dailyRewardPoints: number
  adsEnabled: boolean
  iapEnabled: boolean
  platformNotes: string
  layoutWidth: number
  layoutHeight: number
  layoutMode: 'fixed' | 'responsive'
  hudPosition: 'top' | 'bottom' | 'left' | 'right'
  menuStyle: 'grid' | 'list' | 'cards'
  animationSpeed: 'slow' | 'normal' | 'fast'
  bgVolume: number
  sfxVolume: number
  voiceVolume: number
}
