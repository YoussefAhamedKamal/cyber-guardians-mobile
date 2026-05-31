import { describe, it, expect } from 'vitest'
import { levels } from '@/data/dialogue'

describe('levels data', () => {
  it('has 7 levels', () => {
    expect(levels.length).toBe(7)
  })

  it('each level has required fields', () => {
    for (const l of levels) {
      expect(l.id).toBeGreaterThanOrEqual(1)
      expect(l.id).toBeLessThanOrEqual(7)
      expect(l.title).toBeTruthy()
      expect(l.subtitle).toBeTruthy()
      expect(l.threat).toBeTruthy()
      expect(l.challengeType).toBeTruthy()
      expect(l.intro.length).toBeGreaterThan(0)
      expect(l.outro.length).toBeGreaterThan(0)
      expect(l.focusCharacterId).toBeTruthy()
    }
  })

  it('each level has challenge data matching its type', () => {
    for (const l of levels) {
      switch (l.challengeType) {
        case 'cards':
          expect(l.challengeData.phishingEmails?.length).toBeGreaterThan(0)
          break
        case 'build':
          expect(l.challengeData.passwordRules?.length).toBeGreaterThan(0)
          break
        case 'maze':
          expect(l.challengeData.mazeGrid?.length).toBeGreaterThan(0)
          break
        case 'dragdrop':
          expect(l.challengeData.firewallPorts?.length).toBeGreaterThan(0)
          break
        case 'decrypt':
          expect(l.challengeData.cipher).toBeDefined()
          break
        case 'codefix':
          expect(l.challengeData.vulnCodes?.length).toBeGreaterThan(0)
          break
        case 'response':
          expect(l.challengeData.incidentSteps?.length).toBeGreaterThan(0)
          break
      }
    }
  })
})
