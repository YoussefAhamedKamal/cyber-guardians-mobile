export interface VoiceSearchState {
  isListening: boolean
  transcript: string
  confidence: number
  isSupported: boolean
  language: string
  error: string | null
  lastResult: string

  startListening: () => void
  stopListening: () => void
  setLanguage: (lang: string) => void
  clearTranscript: () => void
  clearError: () => void
}

export const VOICE_LANGUAGES = [
  { code: 'ar-SA', label: 'العربية (السعودية)' },
  { code: 'ar-EG', label: 'العربية (مصر)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
]

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  )
}
