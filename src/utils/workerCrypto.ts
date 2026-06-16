const WORKER_CRYPTO_KEY = 'cg-worker-crypto-key'
const AI_WORKER_KEY = 'cg-worker-config-enc'
const GH_WORKER_KEY = 'cg-github-worker-config-enc'

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

async function generateAndStoreKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const exported = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  localStorage.setItem(WORKER_CRYPTO_KEY, b64Encode(exported))
  return key
}

async function getAesKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(WORKER_CRYPTO_KEY)
  if (stored) {
    try {
      const raw = b64DecodeToBytes(stored)
      const key = await crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
      return key
    } catch {
      localStorage.removeItem(WORKER_CRYPTO_KEY)
    }
  }
  return generateAndStoreKey()
}

export interface EncryptedConfig {
  url: string
  authToken: string
}

export async function loadWorkerConfig(storageKey: string): Promise<EncryptedConfig | null> {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    const key = await getAesKey()
    const combined = b64DecodeToBytes(raw)
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    localStorage.removeItem(storageKey)
    return null
  }
}

export async function saveWorkerConfig(storageKey: string, config: EncryptedConfig): Promise<void> {
  if (!config.url) {
    localStorage.removeItem(storageKey)
    return
  }
  const key = await getAesKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(config))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  localStorage.setItem(storageKey, b64Encode(combined))
}

export { AI_WORKER_KEY, GH_WORKER_KEY }
