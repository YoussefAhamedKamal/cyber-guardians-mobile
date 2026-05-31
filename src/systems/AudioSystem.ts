export class AudioSystem {
  private bgm: HTMLAudioElement | null = null
  private sfxCache = new Map<string, HTMLAudioElement>()

  init(): void {
    this.bgm = new Audio()
    this.bgm.loop = true
  }

  playBGM(url: string, volume: number): void {
    if (!this.bgm) return
    this.bgm.src = url
    this.bgm.volume = volume
    this.bgm.play().catch(() => {})
  }

  setBgmVolume(v: number): void {
    if (this.bgm) this.bgm.volume = v
  }

  playSFX(url: string, volume: number): void {
    let sfx = this.sfxCache.get(url)
    if (!sfx) {
      sfx = new Audio(url)
      this.sfxCache.set(url, sfx)
    }
    sfx.volume = volume
    sfx.currentTime = 0
    sfx.play().catch(() => {})
  }

  muteAll(): void {
    if (this.bgm) this.bgm.volume = 0
    this.sfxCache.forEach((a) => (a.volume = 0))
  }

  destroy(): void {
    this.bgm?.pause()
    this.bgm = null
    this.sfxCache.forEach((a) => a.pause())
    this.sfxCache.clear()
  }
}

export const audioSystem = new AudioSystem()
