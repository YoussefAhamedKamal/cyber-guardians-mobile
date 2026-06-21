import { create } from 'zustand'
import type { VoiceSearchState } from '@/types/voice'
import { isSpeechRecognitionSupported, VOICE_LANGUAGES } from '@/types/voice'

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionAny = any
let recognition: SpeechRecognitionAny = null

function getRecognition(): SpeechRecognitionAny {
  if (recognition) return recognition
  if (!isSpeechRecognitionSupported()) return null
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) return null
  recognition = new SR()
  return recognition
}

export const useVoiceStore = create<VoiceSearchState>()((set, get) => ({
  isListening: false,
  transcript: '',
  confidence: 0,
  isSupported: isSpeechRecognitionSupported(),
  language: VOICE_LANGUAGES[0]!.code,
  error: null,
  lastResult: '',

  startListening: () => {
    if (get().isListening) return

    const rec = getRecognition()
    if (!rec) {
      set({ error: 'التعرف على الصوت غير مدعوم في هذا المتصفح' })
      return
    }

    const state = get()
    rec.lang = state.language
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      set({ isListening: true, error: null, transcript: '' })
    }

    rec.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result) continue
        const transcript = result[0]?.transcript || ''
        const confidence = result[0]?.confidence || 0

        if (result.isFinal) {
          finalTranscript += transcript
          set({ confidence })
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        set({ transcript: finalTranscript, lastResult: finalTranscript })
      } else if (interimTranscript) {
        set({ transcript: interimTranscript })
      }
    }

    rec.onerror = (event: any) => {
      let errorMsg = 'خطأ في التعرف على الصوت'
      switch (event.error) {
        case 'no-speech':
          errorMsg = 'لم يتم التقاط أي صوت'
          break
        case 'audio-capture':
          errorMsg = 'لا يمكن الوصول إلى الميكروفون'
          break
        case 'not-allowed':
          errorMsg = 'تم رفض إذن الميكروفون'
          break
        case 'network':
          errorMsg = 'خطأ في الشبكة'
          break
        case 'aborted':
          errorMsg = 'تم إلغاء التعرف'
          break
      }
      set({ error: errorMsg, isListening: false })
    }

    rec.onend = () => {
      set({ isListening: false })
    }

    try {
      rec.start()
    } catch {
      set({ error: 'لا يمكن بدء التعرف على الصوت', isListening: false })
    }
  },

  stopListening: () => {
    if (recognition) {
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    }
    set({ isListening: false })
  },

  setLanguage: (lang) => set({ language: lang }),
  clearTranscript: () => set({ transcript: '' }),
  clearError: () => set({ error: null }),
}))
