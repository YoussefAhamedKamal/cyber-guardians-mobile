import { describe, it, expect } from 'vitest'
import { logger } from '@/systems/LoggingSystem'

describe('LoggingSystem', () => {
  it('logs info without throwing', () => {
    expect(() => logger.info('test info')).not.toThrow()
  })

  it('logs warn without throwing', () => {
    expect(() => logger.warn('test warn')).not.toThrow()
  })

  it('logs error without throwing', () => {
    expect(() => logger.error('test error')).not.toThrow()
  })

  it('getRecent returns logged entries', () => {
    logger.info('entry 1')
    logger.warn('entry 2')
    const recent = logger.getRecent(2)
    expect(recent.length).toBeGreaterThanOrEqual(2)
    expect(recent[recent.length - 2]?.message).toBe('entry 1')
  })

  it('does not exceed max entries', () => {
    for (let i = 0; i < 200; i++) {
      logger.info(`bulk ${i}`)
    }
    const recent = logger.getRecent(200)
    expect(recent.length).toBeLessThanOrEqual(100)
  })
})
