const KEY_SESSION_KEY = 'cg-crypto-key'
const KEYS_LOCAL_KEY = 'cg-ai-keys-enc'

const FALLBACK_KEY = 'cg-fallback-xor-key'

function b64Encode(bytes: Uint8Array): string {
  let b64 = ''
  for (let i = 0; i < bytes.length; i++) {
    b64 += String.fromCharCode(bytes[i]!)
  }
  return btoa(b64)
}

function b64DecodeToBytes(b64: string): Uint8Array {
  const decoded = atob(b64)
  const bytes = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i)
  }
  return bytes
}

function xorEncode(str: string, key: number[]): string {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key[i % key.length]!)
  }
  return btoa(result)
}

function xorDecode(b64Str: string, key: number[]): string {
  const bytes = b64DecodeToBytes(b64Str)
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]! ^ key[i % key.length]!)
  }
  return result
}

function getFallbackKey(): number[] {
  const stored = localStorage.getItem(FALLBACK_KEY)
  if (stored) {
    try {
      const arr = JSON.parse(stored)
      if (Array.isArray(arr) && arr.length === 32) return arr
    } catch {}
  }
  const key: number[] = []
  for (let i = 0; i < 32; i++) {
    key.push(Math.floor(Math.random() * 256))
  }
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(key))
  return key
}

const hasCryptoSubtle = typeof crypto !== 'undefined' && !!crypto.subtle

async function generateAndStoreKey(): Promise<CryptoKey | null> {
  if (!hasCryptoSubtle) return null
  try {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    const exported = new Uint8Array(await crypto.subtle.exportKey('raw', key))
    localStorage.setItem(KEY_SESSION_KEY, b64Encode(exported))
    return key
  } catch {
    return null
  }
}

async function getAesKey(): Promise<CryptoKey | null> {
  if (!hasCryptoSubtle) return null
  const stored = localStorage.getItem(KEY_SESSION_KEY)
  if (stored) {
    try {
      const raw = b64DecodeToBytes(stored)
      const key = await crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
      return key
    } catch {
      localStorage.removeItem(KEY_SESSION_KEY)
    }
  }
  return generateAndStoreKey()
}

async function migrateXorIfNeeded(): Promise<void> {
  const raw = localStorage.getItem(KEYS_LOCAL_KEY)
  if (!raw) return
  try {
    const testKey = JSON.parse(localStorage.getItem('cg-xor-key') || '[]')
    if (!Array.isArray(testKey) || testKey.length !== 32) return
    const json = xorDecode(raw, testKey)
    const keys = JSON.parse(json) as Record<string, string>
    if (Object.keys(keys).length === 0) return
    localStorage.removeItem('cg-xor-key')
    await saveEncryptedKeys(keys)
  } catch {}
}

export async function loadEncryptedKeys(): Promise<Record<string, string>> {
  localStorage.removeItem('cg-ai-keys')
  await migrateXorIfNeeded()
  const raw = localStorage.getItem(KEYS_LOCAL_KEY)
  if (!raw) return {}
  try {
    const aesKey = await getAesKey()
    if (aesKey) {
      const combined = b64DecodeToBytes(raw)
      const iv = combined.slice(0, 12)
      const data = combined.slice(12)
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, data)
      return JSON.parse(new TextDecoder().decode(decrypted))
    }
    const xorKey = getFallbackKey()
    const json = xorDecode(raw, xorKey)
    return JSON.parse(json)
  } catch {
    localStorage.removeItem(KEYS_LOCAL_KEY)
    return {}
  }
}

export async function saveEncryptedKeys(keys: Record<string, string>): Promise<void> {
  if (Object.keys(keys).length === 0) {
    localStorage.removeItem(KEYS_LOCAL_KEY)
    return
  }
  const json = JSON.stringify(keys)
  const aesKey = await getAesKey()
  if (aesKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(json)
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded)
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    localStorage.setItem(KEYS_LOCAL_KEY, b64Encode(combined))
  } else {
    const xorKey = getFallbackKey()
    localStorage.setItem(KEYS_LOCAL_KEY, xorEncode(json, xorKey))
  }
}
