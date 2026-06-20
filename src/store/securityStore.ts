import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type {
  SecurityState,
  SecuritySettings,
  EncryptedData,
  ActivityLog,
  HashAlgorithm
} from '@/types/security'
import {
  DEFAULT_SECURITY_STATE,
  DEFAULT_SECURITY_SETTINGS,
  generateId,
  arrayBufferToBase64,
  base64ToArrayBuffer
} from '@/types/security'

type SecurityStore = SecurityState

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export const useSecurityStore = create<SecurityStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SECURITY_STATE,

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      encrypt: async (data, password) => {
        const state = get()
        const algorithm = state.settings.encryptionAlgorithm
        const encoder = new TextEncoder()
        const salt = crypto.getRandomValues(new Uint8Array(16))
        const iv = crypto.getRandomValues(new Uint8Array(algorithm === 'AES-GCM' ? 12 : 16))

        const key = await deriveKey(password, salt)

        const encryptParams = algorithm === 'AES-GCM'
          ? { name: 'AES-GCM', iv }
          : { name: 'AES-CBC', iv }

        const encrypted = await crypto.subtle.encrypt(
          encryptParams,
          key,
          encoder.encode(data)
        )

        return {
          data: arrayBufferToBase64(encrypted),
          iv: arrayBufferToBase64(iv.buffer),
          salt: arrayBufferToBase64(salt.buffer),
          algorithm,
          timestamp: Date.now()
        }
      },

      decrypt: async (encrypted, password) => {
        const salt = new Uint8Array(base64ToArrayBuffer(encrypted.salt))
        const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv))
        const data = base64ToArrayBuffer(encrypted.data)

        const key = await deriveKey(password, salt)

        const decryptParams = encrypted.algorithm === 'AES-GCM'
          ? { name: 'AES-GCM', iv }
          : { name: 'AES-CBC', iv }

        const decrypted = await crypto.subtle.decrypt(
          decryptParams,
          key,
          data
        )

        const decoder = new TextDecoder()
        return decoder.decode(decrypted)
      },

      hash: async (data, algorithm = 'SHA-256') => {
        const encoder = new TextEncoder()
        const hashBuffer = await crypto.subtle.digest(algorithm, encoder.encode(data))
        return arrayBufferToBase64(hashBuffer)
      },

      verify: async (data, hash, algorithm = 'SHA-256') => {
        const dataHash = await get().hash(data, algorithm)
        return dataHash === hash
      },

      logActivity: (action, details, success) => {
        const log: ActivityLog = {
          id: generateId(),
          timestamp: Date.now(),
          action,
          details,
          success,
          userAgent: navigator.userAgent
        }

        set((state) => ({
          activityLogs: [log, ...state.activityLogs].slice(0, 1000)
        }))
      },

      getActivityLogs: (limit = 50) => {
        return get().activityLogs.slice(0, limit)
      },

      clearActivityLogs: () => set({ activityLogs: [] }),

      lock: () => {
        set({
          isLocked: true,
          lockedUntil: Date.now() + get().settings.lockDuration
        })
        get().logActivity('lock', 'النظام مقفل', true)
      },

      setPassword: async (password) => {
        const encoder = new TextEncoder()
        const salt = crypto.getRandomValues(new Uint8Array(16))
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          encoder.encode(password),
          'PBKDF2',
          false,
          ['deriveBits']
        )
        const derivedBits = await crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100000, hash: 'SHA-256' },
          keyMaterial,
          256
        )
        const hashArray = Array.from(new Uint8Array(derivedBits))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
        set({ passwordHash: hashHex, passwordSalt: saltHex })
      },

      unlock: async (password) => {
        const state = get()

        if (state.lockedUntil && state.lockedUntil > Date.now()) {
          get().logActivity('unlock', 'محاولة فتح أثناء القفل', false)
          return false
        }

        let success = false

        if (!state.passwordHash || !state.passwordSalt) {
          success = password.length > 0
        } else {
          const encoder = new TextEncoder()
          const salt = new Uint8Array(state.passwordSalt.match(/.{2}/g)!.map(h => parseInt(h, 16)))
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
          )
          const derivedBits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            256
          )
          const hashArray = Array.from(new Uint8Array(derivedBits))
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
          success = hashHex === state.passwordHash
        }

        if (success) {
          set({
            isLocked: false,
            lockedUntil: null,
            failedAttempts: 0
          })
          get().logActivity('unlock', 'تم فتح القفل بنجاح', true)
        } else {
          const attempts = state.failedAttempts + 1
          set({ failedAttempts: attempts })

          if (attempts >= state.settings.maxLoginAttempts) {
            get().lock()
          }

          get().logActivity('unlock', `محاولة فتح فاشلة (${attempts})`, false)
        }

        return success
      },

      checkLock: () => {
        const state = get()
        if (!state.isLocked) return false
        if (state.lockedUntil && state.lockedUntil <= Date.now()) {
          set({ isLocked: false, lockedUntil: null })
          return false
        }
        return true
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() })
      },

      exportSecurityData: () => {
        const state = get()
        return JSON.stringify({
          settings: state.settings,
          activityLogs: state.activityLogs.slice(0, 100)
        }, null, 2)
      },

      importSecurityData: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.settings) {
            set({ settings: { ...DEFAULT_SECURITY_SETTINGS, ...data.settings } })
          }
          if (data.activityLogs && Array.isArray(data.activityLogs)) {
            set({ activityLogs: data.activityLogs })
          }
          return true
        } catch {
          return false
        }
      }
    }),
    {
      name: 'cyber-guardians-security',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
)
