import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type { Skill, SkillCategory } from '@/types/skills'
import { SKILL_TEMPLATES } from '@/types/skills'

interface SkillState {
  skills: Skill[]
  activeSkillId: string | null
  filterCategory: SkillCategory | 'all'
  searchQuery: string

  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'usageHistory'>) => string
  removeSkill: (id: string) => void
  toggleSkill: (id: string) => void
  updateSkill: (id: string, updates: Partial<Skill>) => void
  setActiveSkill: (id: string | null) => void
  setFilterCategory: (category: SkillCategory | 'all') => void
  setSearchQuery: (query: string) => void

  getEnabledSkills: () => Skill[]
  getSkillById: (id: string) => Skill | undefined
  getSkillsByCategory: (category: SkillCategory) => Skill[]

  addSkillFromTemplate: (templateId: string) => string
  importSkills: (skills: Skill[]) => void
  exportSkills: () => Skill[]

  recordUsage: (skillId: string, input: string, output: string, duration: number, success: boolean) => void
}

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      skills: [],
      activeSkillId: null,
      filterCategory: 'all',
      searchQuery: '',

      addSkill: (skillData) => {
        const id = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const now = Date.now()
        const skill: Skill = {
          ...skillData,
          id,
          usageHistory: [],
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({ skills: [...state.skills, skill] }))
        return id
      },

      removeSkill: (id) => {
        set((state) => ({
          skills: state.skills.filter((s) => s.id !== id),
          activeSkillId: state.activeSkillId === id ? null : state.activeSkillId
        }))
      },

      toggleSkill: (id) => {
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled, updatedAt: Date.now() } : s
          )
        }))
      },

      updateSkill: (id, updates) => {
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          )
        }))
      },

      setActiveSkill: (id) => {
        set({ activeSkillId: id })
      },

      setFilterCategory: (category) => {
        set({ filterCategory: category })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      getEnabledSkills: () => {
        return get().skills.filter((s) => s.enabled)
      },

      getSkillById: (id) => {
        return get().skills.find((s) => s.id === id)
      },

      getSkillsByCategory: (category) => {
        return get().skills.filter((s) => s.category === category)
      },

      addSkillFromTemplate: (templateId) => {
        const template = SKILL_TEMPLATES.find((t) => t.id === templateId)
        if (!template) return ''
        return get().addSkill({
          name: template.name,
          description: template.description,
          icon: template.icon,
          systemPrompt: template.systemPrompt,
          enabled: true,
          category: template.category,
          config: { ...template.config }
        })
      },

      importSkills: (skills) => {
        set((state) => {
          const existingIds = new Set(state.skills.map((s) => s.id))
          const newSkills = skills.filter((s) => !existingIds.has(s.id))
          return { skills: [...state.skills, ...newSkills] }
        })
      },

      exportSkills: () => {
        return get().skills
      },

      recordUsage: (skillId, input, output, duration, success) => {
        const record = {
          timestamp: Date.now(),
          inputPreview: input.slice(0, 100),
          outputPreview: output.slice(0, 100),
          duration,
          success
        }
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === skillId
              ? { ...s, usageHistory: [...s.usageHistory.slice(-49), record] }
              : s
          )
        }))
      }
    }),
    {
      name: 'cg-skill-store',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        skills: state.skills,
        activeSkillId: state.activeSkillId
      })
    }
  )
)
