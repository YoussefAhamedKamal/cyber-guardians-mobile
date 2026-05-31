import { useRef, useEffect } from 'react'
import { useSettingsStore } from '@/store'
import { BASE_URL } from '@/utils/constants'

interface Props {
  blur?: number
  overlayOpacity?: number
}

export function BackgroundVideo({ blur = 0, overlayOpacity = 0.6 }: Props) {
  const s = useSettingsStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const useCustomAnim = s.bgAnimationUrl.length > 0
  const isImage = useCustomAnim && s.bgAnimationUrl.startsWith('data:image/')

  useEffect(() => {
    const el = videoRef.current
    if (!el || !useCustomAnim || isImage) return
    el.play().catch(() => {})
  }, [useCustomAnim, isImage, s.bgAnimationUrl])

  const brightness = useCustomAnim ? s.bgAnimationBrightness : s.bgBrightness

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {useCustomAnim ? (
        isImage ? (
          <img
            ref={imgRef}
            src={s.bgAnimationUrl}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: `brightness(${brightness})${blur ? ` blur(${blur}px)` : ''}`,
            }}
          />
        ) : (
          <video
            ref={videoRef} muted loop playsInline autoPlay
            src={s.bgAnimationUrl}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: `brightness(${brightness})${blur ? ` blur(${blur}px)` : ''}`,
            }}
          />
        )
      ) : (
          <video
            ref={videoRef} muted loop playsInline autoPlay
            src={`${BASE_URL}videos/background_1.mp4`}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: `brightness(${brightness})${blur ? ` blur(${blur}px)` : ''}`,
          }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: s.bgColor,
        opacity: overlayOpacity,
      }} />
    </div>
  )
}
