import { createHash } from 'crypto'

interface CacheEntry {
  key: string
  value: any
  timestamp: number
  ttl: number
  hits: number
}

export class SmartCache {
  private cache: Map<string, CacheEntry> = new Map()
  private defaultTTL: number

  constructor(defaultTTL: number = 3600000) {
    this.defaultTTL = defaultTTL
  }

  generateKey(tool: string, input: string): string {
    const hash = createHash('sha256').update(input).digest('hex').slice(0, 16)
    return `${tool}:${hash}`
  }

  set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    entry.hits++
    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  getStats(): { totalEntries: number; totalHits: number; hitRate: number } {
    let totalHits = 0
    for (const entry of this.cache.values()) {
      totalHits += entry.hits
    }
    return {
      totalEntries: this.cache.size,
      totalHits,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    }
  }
}
