import { describe, it, expect, beforeEach } from 'vitest'
import { loadFromStorage, saveToStorage, removeFromStorage } from '@/utils/storage'

const store = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => { store.set(key, val) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => store.clear(),
    get length() { return store.size },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  writable: true,
  configurable: true,
})

beforeEach(() => {
  store.clear()
})

describe('loadFromStorage', () => {
  it('returns fallback when key does not exist', () => {
    expect(loadFromStorage('nonexistent', 'default')).toBe('default')
  })

  it('returns parsed value when key exists', () => {
    store.set('test', JSON.stringify({ a: 1 }))
    expect(loadFromStorage('test', {})).toEqual({ a: 1 })
  })

  it('returns fallback on corrupt data', () => {
    store.set('corrupt', 'not-json{')
    expect(loadFromStorage('corrupt', 'fallback')).toBe('fallback')
  })
})

describe('saveToStorage', () => {
  it('saves serialized value', () => {
    saveToStorage('key', { data: 42 })
    expect(store.get('key')).toBe(JSON.stringify({ data: 42 }))
  })
})

describe('removeFromStorage', () => {
  it('removes key', () => {
    store.set('temp', 'value')
    removeFromStorage('temp')
    expect(store.get('temp')).toBeUndefined()
  })
})
