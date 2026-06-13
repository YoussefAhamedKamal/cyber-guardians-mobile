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
  const [needsTap, setNeedsTap] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = Math.min(s.bgmVolume, 1)
    if (s.muted) v.volume = 0
    v.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true))
  }, [s.bgmVolume, s.muted])

  const handleTap = () => {
    const v = videoRef.current
    if (!v) return
    v.volume = Math.min(s.bgmVolume, 1)
    if (s.muted) v.volume = 0
    v.play().catch(() => {})
    setNeedsTap(false)
  }

  const videoSrc = s.customCelebrationVideoUrl || `${BASE_URL}videos/celebration.mp4`

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000', cursor: needsTap ? 'pointer' : 'default',
    }} onClick={needsTap ? handleTap : undefined}>
      <video
        ref={videoRef}
        src={videoSrc}
        onEnded={onEnd}
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {needsTap && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ fontSize: '48px' }}>🔊</div>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>اضغط لتشغيل الفيديو بصوت</div>
        </div>
      )}
      {showSkip && (
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <Button variant="ghost" onClick={onEnd} style={{ fontSize: '14px', opacity: 0.7 }}>
           تخطي ▶▶
          </Button>
        </div>
      )}
    </div>
  )
}
