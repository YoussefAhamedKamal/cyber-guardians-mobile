import { describe, it, expect } from 'vitest'

describe('ProceduralAudio', () => {
  it('exports an audio object with expected methods', async () => {
    const { audio } = await import('@/systems/ProceduralAudio')
    expect(audio).toBeDefined()
    expect(typeof audio.playCorrect).toBe('function')
    expect(typeof audio.playWrong).toBe('function')
    expect(typeof audio.playClick).toBe('function')
    expect(typeof audio.playLevelUp).toBe('function')
    expect(typeof audio.playVictory).toBe('function')
    expect(typeof audio.playBgLoop).toBe('function')
    expect(typeof audio.stopBg).toBe('function')
    expect(typeof audio.setBgVolume).toBe('function')
    expect(typeof audio.setSfxVolume).toBe('function')
  })
})
