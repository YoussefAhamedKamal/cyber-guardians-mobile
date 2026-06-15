const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

const H = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]

function sha256(message: string): string {
  const msgBytes = new TextEncoder().encode(message)
  const bitLen = msgBytes.length * 8
  const padLen = (56 - ((msgBytes.length + 1) % 64) + 64) % 64
  const padded = new Uint8Array(msgBytes.length + 1 + padLen + 8)
  padded.set(msgBytes)
  padded[msgBytes.length] = 0x80
  const dv = new DataView(padded.buffer)
  dv.setUint32(padded.length - 4, bitLen, false)

  const w = new Uint32Array(64)
  let h0 = H[0]!, h1 = H[1]!, h2 = H[2]!, h3 = H[3]!, h4 = H[4]!, h5 = H[5]!, h6 = H[6]!, h7 = H[7]!

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = dv.getUint32(offset + j * 4, false)
    }
    for (let j = 16; j < 64; j++) {
      const s0 = ((w[j - 15]! >>> 7) | (w[j - 15]! << 25)) ^ ((w[j - 15]! >>> 18) | (w[j - 15]! << 14)) ^ (w[j - 15]! >>> 3)
      const s1 = ((w[j - 2]! >>> 17) | (w[j - 2]! << 15)) ^ ((w[j - 2]! >>> 19) | (w[j - 2]! << 13)) ^ (w[j - 2]! >>> 10)
      w[j] = (w[j - 16]! + s0 + w[j - 7]! + s1) | 0
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, hh = h7
    for (let j = 0; j < 64; j++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const ch = (e & f) ^ (~e & g)
      const t1 = (hh + S1 + ch + K[j]! + w[j]!) | 0
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) | 0
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + hh) | 0
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map(v => (v >>> 0).toString(16).padStart(8, '0')).join('')
}

export const DEFAULT_PIN_HASH = sha256('1234')

function generateSalt(): string {
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0')
  }
  return hex
}

export async function hashPin(pin: string, salt?: string): Promise<string> {
  const actualSalt = salt ?? generateSalt()
  return `${actualSalt}:${sha256(actualSalt + pin)}`
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (storedHash.includes(':')) {
    const [salt] = storedHash.split(':')
    const newHash = await hashPin(pin, salt)
    return newHash === storedHash
  }
  return sha256(pin) === storedHash
}
