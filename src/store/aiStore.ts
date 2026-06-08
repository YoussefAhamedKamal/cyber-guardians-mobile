import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AIMessage, AIState } from '@/types/ai'
import { DEFAULT_AI_STATE, AI_PROVIDERS } from '@/types/ai'
import { indexedDBStorage } from '@/utils/indexedDBStorage'

const STORAGE_KEY = 'cg-ai-state'

function loadApiKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem('cg-ai-keys')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveApiKeys(keys: Record<string, string>) {
  localStorage.setItem('cg-ai-keys', JSON.stringify(keys))
}

interface AIStore extends AIState {
  setProvider: (id: string) => void
  setModel: (id: string) => void
  setApiKey: (providerId: string, key: string) => void
  getApiKey: (providerId: string) => string
  setCustomBaseUrl: (url: string) => void
  setFacultyPin: (pin: string) => void
  unlockFaculty: (pin: string) => boolean
  lockFaculty: () => void
  togglePanel: () => void
  setPanelOpen: (v: boolean) => void
  setActiveTab: (tab: 'student' | 'faculty' | 'settings') => void
  addStudentMessage: (msg: AIMessage) => void
  addFacultyMessage: (msg: AIMessage) => void
  clearStudentMessages: () => void
  clearFacultyMessages: () => void
  setLoading: (v: boolean) => void
  resetAll: () => void
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_AI_STATE,
      apiKeys: loadApiKeys(),

      setProvider: (id) => {
        const provider = AI_PROVIDERS.find((p) => p.id === id)
        if (id === 'custom') {
          set({ providerId: id, modelId: '' })
        } else {
          const firstModel = provider?.models[0]
          set({
            providerId: id,
            modelId: firstModel?.id || get().modelId,
          })
        }
      },

      setModel: (id) => set({ modelId: id }),

      setApiKey: (providerId, key) => {
        const keys = { ...get().apiKeys, [providerId]: key }
        set({ apiKeys: keys })
        saveApiKeys(keys)
      },

      getApiKey: (providerId) => get().apiKeys[providerId] || '',

      setCustomBaseUrl: (url) => set({ customBaseUrl: url }),

      setFacultyPin: (pin) => set({ facultyPin: pin }),

      unlockFaculty: (pin) => {
        if (pin === get().facultyPin) {
          set({ facultyUnlocked: true })
          return true
        }
        return false
      },

      lockFaculty: () => set({ facultyUnlocked: false }),

      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

      setPanelOpen: (v) => set({ panelOpen: v }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      addStudentMessage: (msg) =>
        set((s) => ({ studentMessages: [...s.studentMessages, msg] })),

      addFacultyMessage: (msg) =>
        set((s) => ({ facultyMessages: [...s.facultyMessages, msg] })),

      clearStudentMessages: () => set({ studentMessages: [] }),

      clearFacultyMessages: () => set({ facultyMessages: [] }),

      setLoading: (v) => set({ loading: v }),

      resetAll: () =>
        set({ ...DEFAULT_AI_STATE, apiKeys: get().apiKeys }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        providerId: state.providerId,
        modelId: state.modelId,
        customBaseUrl: state.customBaseUrl,
        facultyPin: state.facultyPin,
        facultyUnlocked: state.facultyUnlocked,
        studentMessages: state.studentMessages,
        facultyMessages: state.facultyMessages,
        activeTab: state.activeTab,
      }),
    }
  )
)
