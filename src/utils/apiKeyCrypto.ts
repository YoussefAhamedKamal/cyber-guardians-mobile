const KEY_SESSION_KEY = 'cg-crypto-key'
const KEYS_LOCAL_KEY = 'cg-ai-keys-enc'

async function getKey(): Promise<CryptoKey> {
  const stored = sessionStorage.getItem(KEY_SESSION_KEY)
  if (stored) {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const exported = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  sessionStorage.setItem(KEY_SESSION_KEY, btoa(String.fromCharCode(...exported)))
  return key
}

export async function loadEncryptedKeys(): Promise<Record<string, string>> {
  localStorage.removeItem('cg-ai-keys')
  const raw = localStorage.getItem(KEYS_LOCAL_KEY)
  if (!raw) return {}
  try {
    const key = await getKey()
    const combined = Uint8Array.from(atob(raw), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    localStorage.removeItem(KEYS_LOCAL_KEY)
    sessionStorage.removeItem(KEY_SESSION_KEY)
    return {}
  }
}

export async function saveEncryptedKeys(keys: Record<string, string>): Promise<void> {
  if (Object.keys(keys).length === 0) {
    localStorage.removeItem(KEYS_LOCAL_KEY)
    return
  }
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(keys))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  localStorage.setItem(KEYS_LOCAL_KEY, btoa(String.fromCharCode(...combined)))
}
