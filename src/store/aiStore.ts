import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AIMessage, AIState, ChatSession } from '@/types/ai'
import { DEFAULT_AI_STATE, AI_PROVIDERS } from '@/types/ai'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import { loadEncryptedKeys, saveEncryptedKeys } from '@/utils/apiKeyCrypto'
import { hashPin } from '@/utils/pinCrypto'

const STORAGE_KEY = 'cg-ai-state'

function createSession(name?: string): ChatSession {
  return { id: crypto.randomUUID(), name: name || 'جلسة جديدة', messages: [], createdAt: Date.now() }
}

interface AIStore extends AIState {
  setProvider: (id: string) => void
  setModel: (id: string) => void
  setApiKey: (providerId: string, key: string) => void
  setApiKeys: (keys: Record<string, string>) => void
  getApiKey: (providerId: string) => string
  setCustomBaseUrl: (url: string) => void
  setFacultyPin: (pin: string) => Promise<void>
  unlockFaculty: (pin: string) => Promise<boolean>
  lockFaculty: () => void
  togglePanel: () => void
  setPanelOpen: (v: boolean) => void
  setPanelMaximized: (v: boolean) => void
  setActiveTab: (tab: 'student' | 'faculty' | 'settings') => void
  setLoading: (v: boolean) => void
  resetAll: () => void

  createStudentSession: (name?: string) => string
  switchStudentSession: (id: string) => void
  deleteStudentSession: (id: string) => void
  renameStudentSession: (id: string, name: string) => void
  addStudentMessage: (msg: AIMessage) => void
  clearStudentMessages: () => void
  getActiveStudentSession: () => ChatSession | undefined

  createFacultySession: (name?: string) => string
  switchFacultySession: (id: string) => void
  deleteFacultySession: (id: string) => void
  renameFacultySession: (id: string, name: string) => void
  addFacultyMessage: (msg: AIMessage) => void
  clearFacultyMessages: () => void
  getActiveFacultySession: () => ChatSession | undefined
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_AI_STATE,
      apiKeys: {},

      setProvider: (id) => {
        const provider = AI_PROVIDERS.find((p) => p.id === id)
        if (id === 'custom') { set({ providerId: id, modelId: '' }) }
        else { const firstModel = provider?.models[0]; set({ providerId: id, modelId: firstModel?.id || get().modelId }) }
      },
      setModel: (id) => set({ modelId: id }),
      setApiKey: (providerId, key) => {
        const keys = { ...get().apiKeys, [providerId]: key }
        set({ apiKeys: keys })
        saveEncryptedKeys(keys)
      },
      setApiKeys: (keys) => set({ apiKeys: keys }),
      getApiKey: (providerId) => get().apiKeys[providerId] || '',
      setCustomBaseUrl: (url) => set({ customBaseUrl: url }),
      setFacultyPin: async (pin) => {
        const hashed = await hashPin(pin)
        set({ facultyPinHash: hashed })
      },
      unlockFaculty: async (pin) => {
        const now = Date.now()
        const state = get()
        if (state.pinLockedUntil > now) return false
        const hashed = await hashPin(pin)
        if (hashed === state.facultyPinHash) {
          set({ facultyUnlocked: true, pinAttempts: 0 })
          return true
        }
        const attempts = state.pinAttempts + 1
        if (attempts >= 5) {
          set({ pinAttempts: attempts, pinLockedUntil: now + 30000 })
        } else {
          set({ pinAttempts: attempts })
        }
        return false
      },
      lockFaculty: () => set({ facultyUnlocked: false }),

      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen, panelMaximized: false })),
      setPanelOpen: (v) => set({ panelOpen: v, panelMaximized: false }),
      setPanelMaximized: (v) => set({ panelMaximized: v }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setLoading: (v) => set({ loading: v }),

      // Student sessions
      createStudentSession: (name) => {
        const session = createSession(name)
        set((s) => ({ studentSessions: [...s.studentSessions, session], activeStudentSessionId: session.id }))
        return session.id
      },
      switchStudentSession: (id) => set({ activeStudentSessionId: id }),
      deleteStudentSession: (id) => set((s) => {
        const sessions = s.studentSessions.filter((x) => x.id !== id)
        let activeId = s.activeStudentSessionId === id ? (sessions[0]?.id || '') : s.activeStudentSessionId
        if (sessions.length === 0) { const fresh = createSession(); sessions.push(fresh); activeId = fresh.id }
        return { studentSessions: sessions, activeStudentSessionId: activeId }
      }),
      renameStudentSession: (id, name) => set((s) => ({ studentSessions: s.studentSessions.map((x) => x.id === id ? { ...x, name } : x) })),
      addStudentMessage: (msg) => set((s) => {
        const sessions = s.studentSessions.map((x) => x.id === s.activeStudentSessionId ? { ...x, messages: [...x.messages, msg] } : x)
        return { studentSessions: sessions }
      }),
      clearStudentMessages: () => set((s) => ({
        studentSessions: s.studentSessions.map((x) => x.id === s.activeStudentSessionId ? { ...x, messages: [] } : x)
      })),
      getActiveStudentSession: () => { const s = get(); return s.studentSessions.find((x) => x.id === s.activeStudentSessionId) },

      // Faculty sessions
      createFacultySession: (name) => {
        const session = createSession(name)
        set((s) => ({ facultySessions: [...s.facultySessions, session], activeFacultySessionId: session.id }))
        return session.id
      },
      switchFacultySession: (id) => set({ activeFacultySessionId: id }),
      deleteFacultySession: (id) => set((s) => {
        const sessions = s.facultySessions.filter((x) => x.id !== id)
        let activeId = s.activeFacultySessionId === id ? (sessions[0]?.id || '') : s.activeFacultySessionId
        if (sessions.length === 0) { const fresh = createSession(); sessions.push(fresh); activeId = fresh.id }
        return { facultySessions: sessions, activeFacultySessionId: activeId }
      }),
      renameFacultySession: (id, name) => set((s) => ({ facultySessions: s.facultySessions.map((x) => x.id === id ? { ...x, name } : x) })),
      addFacultyMessage: (msg) => set((s) => {
        const sessions = s.facultySessions.map((x) => x.id === s.activeFacultySessionId ? { ...x, messages: [...x.messages, msg] } : x)
        return { facultySessions: sessions }
      }),
      clearFacultyMessages: () => set((s) => ({
        facultySessions: s.facultySessions.map((x) => x.id === s.activeFacultySessionId ? { ...x, messages: [] } : x)
      })),
      getActiveFacultySession: () => { const s = get(); return s.facultySessions.find((x) => x.id === s.activeFacultySessionId) },

      resetAll: () => set({ ...DEFAULT_AI_STATE, apiKeys: get().apiKeys }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        providerId: state.providerId,
        modelId: state.modelId,
        customBaseUrl: state.customBaseUrl,
        facultyPinHash: state.facultyPinHash,
        facultyUnlocked: state.facultyUnlocked,
        studentSessions: state.studentSessions,
        activeStudentSessionId: state.activeStudentSessionId,
        facultySessions: state.facultySessions,
        activeFacultySessionId: state.activeFacultySessionId,
        activeTab: state.activeTab,
      }),
    }
  )
)

loadEncryptedKeys().then((keys) => {
  if (Object.keys(keys).length > 0) {
    useAIStore.getState().setApiKeys(keys)
  }
})
