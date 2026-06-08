import { useState, useEffect, useCallback, useRef } from 'react'
import type { DialogueLine } from '@/types'
import { getCharacters } from '@/data/gameData'
import { audio } from '@/systems/ProceduralAudio'
import { useSettingsStore } from '@/store'
import { BASE_URL } from '@/utils/constants'

interface DialogueBoxProps {
  lines: DialogueLine[]
  onComplete: () => void
}

function VideoBackground({ speakerId }: { speakerId: string }) {
  const settings = useSettingsStore()
  const characters = getCharacters()
  const char = characters[speakerId]

  const customMap: Record<string, string> = {
    zayn: settings.customZaynVideoUrl,
    nora: settings.customNoraVideoUrl,
    omar: settings.customOmarVideoUrl,
    layla: settings.customLaylaVideoUrl,
    tariq: settings.customTariqVideoUrl,
    system: settings.customSystemVideoUrl,
  }

  const custom = customMap[speakerId] || ''
  const src = custom || `${BASE_URL}videos/${speakerId}.mp4`
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.pause()
    el.src = src
    el.load()
    el.play().catch(() => {})
    return () => { el.pause(); el.src = '' }
  }, [src])

  return (
    <div style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      background: char?.color ?? '#1a1a2e',
    }}>
      <video
        ref={ref} muted loop playsInline preload="auto"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  )
}

const preloaded = new Set<string>()

export function DialogueBox({ lines, onComplete }: DialogueBoxProps) {
  const [index, setIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const characters = getCharacters()

  useEffect(() => {
    for (const id of Object.keys(characters)) {
      if (preloaded.has(id)) continue
      preloaded.add(id)
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'video'
      link.href = `${BASE_URL}videos/${id}.mp4`
      document.head.appendChild(link)
    }
  }, [])

  const current = lines[index]
  const char = current ? characters[current.speakerId] : null
  const fullText = current?.text ?? ''
  const displayed = fullText.slice(0, charIndex)

  useEffect(() => {
    if (charIndex < fullText.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 2), 30)
      return () => clearTimeout(t)
    }
  }, [charIndex, fullText.length])

  const advance = useCallback(() => {
    audio.playClick()
    if (charIndex < fullText.length) {
      setCharIndex(fullText.length)
      return
    }
    if (index < lines.length - 1) {
      setIndex((i) => i + 1)
      setCharIndex(0)
    } else {
      onComplete()
    }
  }, [charIndex, fullText.length, index, lines.length, onComplete])

  return (
    <div
      onClick={advance}
      style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
    >
      {current && <VideoBackground speakerId={current.speakerId} />}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '24px 32px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85) 30%)',
      }}>
        {char && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: char.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '18px', fontWeight: 700,
            }}>
              {char.name[0]}
            </div>
            <div>
              <div style={{ color: char.color, fontWeight: 700, fontSize: '16px' }}>{char.name}</div>
              {char.role && <div style={{ color: '#888', fontSize: '12px' }}>{char.role}</div>}
            </div>
          </div>
        )}
        <div style={{
          color: '#fff', fontSize: '18px', lineHeight: 1.6,
          minHeight: '58px', direction: 'rtl', textAlign: 'right',
        }}>
          {displayed}
          {charIndex < fullText.length && <span style={{ opacity: 0.5 }}>|</span>}
        </div>
        <div style={{ color: '#666', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
          اضغط للمتابعة
        </div>
      </div>
    </div>
  )
}
