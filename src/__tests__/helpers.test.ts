import { describe, it, expect } from 'vitest'
import { clamp, generateId } from '@/utils/helpers'

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps below minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps above maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('handles edge values', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('generateId', () => {
  it('generates a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
