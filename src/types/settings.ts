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
}
