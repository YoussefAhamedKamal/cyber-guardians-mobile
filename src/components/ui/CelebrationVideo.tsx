import { useRef, useEffect, useState } from 'react'
import { useSettingsStore } from '@/store'
import { Button } from './Button'
import { BASE_URL } from '@/utils/constants'

interface Props {
  onEnd: () => void
}

export function CelebrationVideo({ onEnd }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const s = useSettingsStore()
  const [showSkip, setShowSkip] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = Math.min(s.bgmVolume, 1)
    if (s.muted) v.volume = 0
    v.play().catch(() => {})
  }, [s.bgmVolume, s.muted])

  const videoSrc = s.customCelebrationVideoUrl || `${BASE_URL}videos/celebration.mp4`

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000',
    }}>
      <video
        ref={videoRef}
        src={videoSrc}
        onEnded={onEnd}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {showSkip && (
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)' }}>
          <Button variant="ghost" onClick={onEnd} style={{ fontSize: '14px', opacity: 0.7 }}>
           تخطي ▶▶
          </Button>
        </div>
      )}
    </div>
  )
}
