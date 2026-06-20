import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type { ProjectKnowledge, ProjectInstructions, ProjectChat, ProjectState } from '@/types/project'
import { DEFAULT_INSTRUCTIONS } from '@/types/project'
import type { AIMessage } from '@/types/ai'

interface ProjectStoreState extends ProjectState {
  addKnowledge: (file: Omit<ProjectKnowledge, 'id' | 'createdAt' | 'updatedAt'>) => string
  removeKnowledge: (id: string) => void
  updateKnowledge: (id: string, updates: Partial<ProjectKnowledge>) => void
  getKnowledgeById: (id: string) => ProjectKnowledge | undefined
  searchKnowledge: (query: string) => ProjectKnowledge[]

  setInstructions: (instructions: Partial<ProjectInstructions>) => void
  resetInstructions: () => void
  applyTemplate: (templateId: string) => void
  buildProjectSystemPrompt: (basePrompt: string) => string

  createProjectChat: (name: string) => string
  deleteProjectChat: (id: string) => void
  switchProjectChat: (id: string) => void
  renameProjectChat: (id: string, name: string) => void
  addProjectChatMessage: (chatId: string, message: AIMessage) => void
  clearProjectChatMessages: (chatId: string) => void
  togglePinChat: (id: string) => void
  toggleArchiveChat: (id: string) => void
  getActiveProjectChat: () => ProjectChat | undefined
  getPinnedChats: () => ProjectChat[]
  getArchivedChats: () => ProjectChat[]
  getRecentChats: () => ProjectChat[]

  setSharedMemory: (enabled: boolean) => void
  importProjectData: (data: Partial<ProjectState>) => void
  exportProjectData: () => ProjectState
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      knowledge: [],
      instructions: { ...DEFAULT_INSTRUCTIONS },
      chats: [],
      activeChatId: null,
      sharedMemory: true,
      lastSync: 0,

      addKnowledge: (fileData) => {
        const id = `knowledge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const now = Date.now()
        const file: ProjectKnowledge = {
          ...fileData,
          id,
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({ knowledge: [...state.knowledge, file] }))
        return id
      },

      removeKnowledge: (id) => {
        set((state) => ({
          knowledge: state.knowledge.filter((k) => k.id !== id)
        }))
      },

      updateKnowledge: (id, updates) => {
        set((state) => ({
          knowledge: state.knowledge.map((k) =>
            k.id === id ? { ...k, ...updates, updatedAt: Date.now() } : k
          )
        }))
      },

      getKnowledgeById: (id) => {
        return get().knowledge.find((k) => k.id === id)
      },

      searchKnowledge: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().knowledge.filter((k) =>
          k.name.toLowerCase().includes(lowerQuery) ||
          k.content.toLowerCase().includes(lowerQuery) ||
          k.tags.some((t) => t.toLowerCase().includes(lowerQuery))
        )
      },

      setInstructions: (updates) => {
        set((state) => ({
          instructions: {
            ...state.instructions,
            ...updates,
            updatedAt: Date.now()
          }
        }))
      },

      resetInstructions: () => {
        set({ instructions: { ...DEFAULT_INSTRUCTIONS } })
      },

      applyTemplate: (templateId) => {
        const template = DEFAULT_INSTRUCTIONS.templates.find((t) => t.id === templateId)
        if (template) {
          set((state) => ({
            instructions: {
              ...state.instructions,
              role: template.role,
              tone: template.tone,
              responseFormat: template.responseFormat,
              customPrompt: template.customPrompt,
              updatedAt: Date.now()
            }
          }))
        }
      },

      buildProjectSystemPrompt: (basePrompt) => {
        const state = get()
        const { instructions, knowledge } = state

        let prompt = basePrompt

        // Add role instructions
        if (instructions.role) {
          prompt += `\n\nأنت ${instructions.role}.`
        }

        // Add tone instructions
        const toneMap: Record<string, string> = {
          professional: 'رد بأسلوب مهني ومحترف.',
          friendly: 'رد بأسلوب ودي ودقيق.',
          formal: 'رد بأسلوب رسمي ومتقن.',
          casual: 'رد بأسلوب عفوي وبسيط.',
          academic: 'رد بأسلوب أكاديمي وعلمي.',
          creative: 'رد بأسلوب إبداعي ومميز.'
        }
        if (instructions.tone && toneMap[instructions.tone]) {
          prompt += `\n${toneMap[instructions.tone]}`
        }

        // Add response format instructions
        const formatMap: Record<string, string> = {
          markdown: 'استخدم تنسيق Markdown في ردودك.',
          plain: 'اكتب نص عادي بدون تنسيق.',
          code: 'اكتب الكود مع شرح موجز.',
          json: 'اكتب الرد بصيغة JSON.',
          custom: ''
        }
        if (instructions.responseFormat && formatMap[instructions.responseFormat]) {
          prompt += `\n${formatMap[instructions.responseFormat]}`
        }

        // Add custom prompt
        if (instructions.customPrompt) {
          prompt += `\n\nتعليمات إضافية:\n${instructions.customPrompt}`
        }

        // Add knowledge context
        if (knowledge.length > 0) {
          prompt += '\n\n---\nسياق المشروع:\n'
          for (const file of knowledge.slice(0, 10)) {
            const preview = file.content.slice(0, 500)
            prompt += `\n[${file.name}]:\n${preview}\n`
          }
        }

        return prompt
      },

      createProjectChat: (name) => {
        const id = `pchat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const now = Date.now()
        const chat: ProjectChat = {
          id,
          name,
          messages: [],
          tags: [],
          pinned: false,
          archived: false,
          createdAt: now,
          lastActivity: now
        }
        set((state) => ({
          chats: [...state.chats, chat],
          activeChatId: id
        }))
        return id
      },

      deleteProjectChat: (id) => {
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== id),
          activeChatId: state.activeChatId === id
            ? (state.chats.find((c) => c.id !== id)?.id || null)
            : state.activeChatId
        }))
      },

      switchProjectChat: (id) => {
        set({ activeChatId: id })
      },

      renameProjectChat: (id, name) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, name } : c
          )
        }))
      },

      addProjectChatMessage: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  lastActivity: Date.now()
                }
              : c
          )
        }))
      },

      clearProjectChatMessages: (chatId) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, messages: [] } : c
          )
        }))
      },

      togglePinChat: (id) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          )
        }))
      },

      toggleArchiveChat: (id) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, archived: !c.archived } : c
          )
        }))
      },

      getActiveProjectChat: () => {
        const state = get()
        return state.chats.find((c) => c.id === state.activeChatId)
      },

      getPinnedChats: () => {
        return get().chats.filter((c) => c.pinned && !c.archived)
      },

      getArchivedChats: () => {
        return get().chats.filter((c) => c.archived)
      },

      getRecentChats: () => {
        return get().chats
          .filter((c) => !c.archived)
          .sort((a, b) => b.lastActivity - a.lastActivity)
      },

      setSharedMemory: (enabled) => {
        set({ sharedMemory: enabled })
      },

      importProjectData: (data) => {
        set((state) => ({
          ...state,
          ...data,
          lastSync: Date.now()
        }))
      },

      exportProjectData: () => {
        const state = get()
        return {
          knowledge: state.knowledge,
          instructions: state.instructions,
          chats: state.chats,
          activeChatId: state.activeChatId,
          sharedMemory: state.sharedMemory,
          lastSync: state.lastSync
        }
      }
    }),
    {
      name: 'cg-project-store',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        knowledge: state.knowledge,
        instructions: state.instructions,
        chats: state.chats,
        activeChatId: state.activeChatId,
        sharedMemory: state.sharedMemory
      })
    }
  )
)
