import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type { CalendarTask, CalendarState, TaskStatus, TaskPriority } from '@/types/calendar'
import { generateTaskId } from '@/types/calendar'

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      tasks: [],
      selectedDate: new Date().toISOString().split('T')[0]!,
      viewMode: 'month',
      filterStatus: 'all',
      filterPriority: 'all',

      addTask: (task) => {
        const now = Date.now()
        const newTask: CalendarTask = {
          ...task,
          id: generateTaskId(),
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        }
        set((s) => ({ tasks: [...s.tasks, newTask] }))
      },

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      completeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'completed' as TaskStatus, completedAt: Date.now(), updatedAt: Date.now() } : t
          ),
        })),

      setSelectedDate: (date) => set({ selectedDate: date }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterPriority: (priority) => set({ filterPriority: priority }),

      getTasksForDate: (date) => {
        const { tasks, filterStatus, filterPriority } = get()
        return tasks.filter((t) => {
          if (t.dueDate !== date) return false
          if (filterStatus !== 'all' && t.status !== filterStatus) return false
          if (filterPriority !== 'all' && t.priority !== filterPriority) return false
          return true
        }).sort((a, b) => a.dueTime.localeCompare(b.dueTime))
      },

      getUpcomingTasks: (days) => {
        const { tasks } = get()
        const now = new Date()
        const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const nowStr = formatDate(now)
        const endStr = formatDate(end)
        return tasks
          .filter((t) => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate >= nowStr && t.dueDate <= endStr)
          .sort((a, b) => `${a.dueDate}T${a.dueTime}`.localeCompare(`${b.dueDate}T${b.dueTime}`))
      },

      getTaskStats: () => {
        const { tasks } = get()
        const now = new Date()
        return {
          total: tasks.length,
          pending: tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
          completed: tasks.filter((t) => t.status === 'completed').length,
          overdue: tasks.filter((t) => {
            if (t.status === 'completed' || t.status === 'cancelled') return false
            return new Date(`${t.dueDate}T${t.dueTime}`) < now
          }).length,
        }
      },
    }),
    {
      name: 'cg-calendar',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (s) => ({
        tasks: s.tasks,
        selectedDate: s.selectedDate,
        viewMode: s.viewMode,
        filterStatus: s.filterStatus,
        filterPriority: s.filterPriority,
      }),
    }
  )
)
