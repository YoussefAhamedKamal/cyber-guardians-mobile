export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface CalendarTask {
  id: string
  title: string
  description: string
  dueDate: string // ISO date string
  dueTime: string // HH:MM
  priority: TaskPriority
  status: TaskStatus
  reminder: boolean
  reminderMinutes: number // minutes before due
  category: string
  tags: string[]
  createdAt: number
  updatedAt: number
  completedAt: number | null
  color: string
}

export interface CalendarState {
  tasks: CalendarTask[]
  selectedDate: string
  viewMode: 'month' | 'week' | 'day'
  filterStatus: TaskStatus | 'all'
  filterPriority: TaskPriority | 'all'

  addTask: (task: Omit<CalendarTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => void
  updateTask: (id: string, updates: Partial<CalendarTask>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  setSelectedDate: (date: string) => void
  setViewMode: (mode: 'month' | 'week' | 'day') => void
  setFilterStatus: (status: TaskStatus | 'all') => void
  setFilterPriority: (priority: TaskPriority | 'all') => void
  getTasksForDate: (date: string) => CalendarTask[]
  getUpcomingTasks: (days: number) => CalendarTask[]
  getTaskStats: () => { total: number; pending: number; completed: number; overdue: number }
}

export const TASK_CATEGORIES = [
  { id: 'learning', label: '📚 تعلم', color: '#4FC3F7' },
  { id: 'quiz', label: '📝 اختبار', color: '#66BB6A' },
  { id: 'project', label: '🛠️ مشروع', color: '#FFA726' },
  { id: 'review', label: '🔄 مراجعة', color: '#AB47BC' },
  { id: 'practice', label: '🎯 تدريب', color: '#EF5350' },
  { id: 'research', label: '🔍 بحث', color: '#26C6DA' },
]

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#66BB6A',
  medium: '#FFA726',
  high: '#EF5350',
}

export function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

export function formatTaskDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export function isTaskOverdue(task: CalendarTask): boolean {
  if (task.status === 'completed' || task.status === 'cancelled') return false
  const now = new Date()
  const due = new Date(`${task.dueDate}T${task.dueTime}`)
  return due < now
}

export function getDaysUntilDue(dateStr: string): number {
  const now = new Date()
  const due = new Date(dateStr)
  const diff = due.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
