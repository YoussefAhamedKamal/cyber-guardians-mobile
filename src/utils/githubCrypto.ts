const GH_ENC_KEY_SESSION = 'cg-github-enc-key'

async function getGhKey(): Promise<CryptoKey> {
  const stored = sessionStorage.getItem(GH_ENC_KEY_SESSION)
  if (stored) {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const exported = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  sessionStorage.setItem(GH_ENC_KEY_SESSION, btoa(String.fromCharCode(...exported)))
  return key
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getGhKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptToken(ciphertext: string): Promise<string> {
  const key = await getGhKey()
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(decrypted)
}
