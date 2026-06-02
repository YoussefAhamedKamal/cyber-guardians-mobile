let ctx: AudioContext | null = null
let _sfxVolume = 1.0

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime)
  gain.gain.setValueAtTime(volume * _sfxVolume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + duration)
}

let bgAudio: HTMLAudioElement | null = null
let _bgmVolume = 1

export const audio = {
  setSfxVolume(v: number) { _sfxVolume = v },

  playCorrect() {
    playTone(523.25, 0.1, 'sine', 0.3)
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.3), 100)
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.3), 200)
  },

  playWrong() {
    playTone(200, 0.2, 'square', 0.2)
    setTimeout(() => playTone(150, 0.3, 'square', 0.2), 150)
  },

  playClick() {
    playTone(800, 0.05, 'sine', 0.1)
  },

  playLevelUp() {
    const notes = [523.25, 587.33, 659.25, 783.99]
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.15, 'sine', 0.3), i * 120)
    })
  },

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'triangle', 0.3), i * 150)
    })
  },

  playBgLoop(volume = 0.05) {
    if (volume <= 0) return () => {}
    const notes = [261.63, 329.63, 392.00, 329.63]
    let i = 0
    const interval = setInterval(() => {
      playTone(notes[i]! * 0.5, 0.8, 'sine', volume * 0.15)
      i = (i + 1) % notes.length
    }, 1800)
    return () => clearInterval(interval)
  },

  stopBg() {
    if (bgAudio) {
      bgAudio.pause()
      bgAudio.remove()
      bgAudio = null
    }
  },

  setBgVolume(v: number) {
    _bgmVolume = v
    if (bgAudio) bgAudio.volume = Math.min(v, 1)
  },

  playFileBg(src: string, volume: number) {
    this.stopBg()
    if (volume <= 0 || !src) return () => {}
    const el = document.createElement('audio')
    el.src = src
    el.loop = true
    el.preload = 'auto'
    el.volume = Math.min(volume, 1)
    bgAudio = el
    _bgmVolume = volume
    el.play().catch(() => {
      const resume = () => { el.play().catch(() => {}) ; document.removeEventListener('click', resume) }
      document.addEventListener('click', resume, { once: true })
    })
    return () => { el.pause(); el.remove(); bgAudio = null }
  },
}
