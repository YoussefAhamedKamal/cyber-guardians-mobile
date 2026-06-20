import { useEffect } from 'react'
import { useVoiceStore } from '@/store/voiceStore'

interface VoiceButtonProps {
  onResult: (text: string) => void
  size?: number
}

export function VoiceButton({ onResult, size = 36 }: VoiceButtonProps) {
  const { isListening, isSupported, error, transcript, startListening, stopListening, clearTranscript, clearError } = useVoiceStore()

  useEffect(() => {
    if (transcript) {
      onResult(transcript)
      clearTranscript()
    }
  }, [transcript, onResult, clearTranscript])

  if (!isSupported) return null

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => isListening ? stopListening() : startListening()}
        title={isListening ? 'إيقاف التسجيل' : 'بدء التسجيل الصوتي'}
        style={{
          width: size, height: size, borderRadius: '50%', border: 'none',
          background: isListening
            ? 'linear-gradient(135deg, #EF5350, #E53935)'
            : 'linear-gradient(135deg, #4FC3F7, #29B6F6)',
          color: '#fff', cursor: 'pointer', fontSize: size * 0.45,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
          boxShadow: isListening
            ? '0 0 16px rgba(239,83,80,0.5), 0 0 32px rgba(239,83,80,0.2)'
            : '0 2px 8px rgba(79,195,247,0.3)',
          animation: isListening ? 'cg-mic-pulse 1s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      >
        {isListening ? '⏹' : '🎤'}
      </button>

      {/* Pulse animation */}
      <style>{`
        @keyframes cg-mic-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(239,83,80,0.4); }
          50% { transform: scale(1.08); box-shadow: 0 0 20px rgba(239,83,80,0.6); }
        }
      `}</style>

      {/* Error tooltip */}
      {error && (
        <div
          onClick={clearError}
          style={{
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(239,83,80,0.9)', color: '#fff',
            padding: '6px 10px', borderRadius: '6px', fontSize: '11px',
            whiteSpace: 'nowrap', marginBottom: '6px', cursor: 'pointer',
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,83,80,0.9)', color: '#fff',
          padding: '4px 8px', borderRadius: '4px', fontSize: '10px',
          whiteSpace: 'nowrap', marginBottom: '6px',
        }}>
          🎤 جاري الاستماع...
        </div>
      )}
    </div>
  )
}
