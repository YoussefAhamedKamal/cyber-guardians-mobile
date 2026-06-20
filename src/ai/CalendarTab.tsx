import { useState, useMemo } from 'react'
import { useCalendarStore } from '@/store/calendarStore'
import { TASK_CATEGORIES, PRIORITY_COLORS, isTaskOverdue, getDaysUntilDue, formatTaskDate, type CalendarTask } from '@/types/calendar'

const WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function CalendarTab() {
  const store = useCalendarStore()
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(store.selectedDate)
  const [dueTime, setDueTime] = useState('12:00')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [category, setCategory] = useState('learning')
  const [reminder, setReminder] = useState(true)
  const [reminderMinutes, setReminderMinutes] = useState(30)

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const stats = store.getTaskStats()

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [firstDay, daysInMonth])

  const selectedTasks = store.getTasksForDate(store.selectedDate)
  const upcomingTasks = store.getUpcomingTasks(7)

  function resetForm() {
    setTitle('')
    setDescription('')
    setDueDate(store.selectedDate)
    setDueTime('12:00')
    setPriority('medium')
    setCategory('learning')
    setReminder(true)
    setReminderMinutes(30)
    setEditingTask(null)
  }

  function handleSubmit() {
    if (!title.trim()) return
    if (editingTask) {
      store.updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime,
        priority,
        category,
        reminder,
        reminderMinutes,
        color: PRIORITY_COLORS[priority],
      })
    } else {
      store.addTask({
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime,
        priority,
        status: 'pending',
        reminder,
        reminderMinutes,
        category,
        tags: [],
        color: PRIORITY_COLORS[priority],
      })
    }
    resetForm()
    setShowForm(false)
  }

  function handleEdit(task: CalendarTask) {
    setEditingTask(task)
    setTitle(task.title)
    setDescription(task.description)
    setDueDate(task.dueDate)
    setDueTime(task.dueTime)
    setPriority(task.priority)
    setCategory(task.category)
    setReminder(task.reminder)
    setReminderMinutes(task.reminderMinutes)
    setShowForm(true)
  }

  function getTasksCountForDay(day: number): number {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return store.tasks.filter((t) => t.dueDate === dateStr).length
  }

  const isToday = (day: number) => {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
  }

  const isSelected = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dateStr === store.selectedDate
  }

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto', fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '20px' }}>📅 التقويم</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: showForm ? '#666' : 'linear-gradient(135deg, #4FC3F7, #29B6F6)',
            color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
          }}
        >
          {showForm ? '✕ إغلاق' : '+ مهمة جديدة'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'الكل', value: stats.total, color: '#4FC3F7' },
          { label: 'قيد الانتظار', value: stats.pending, color: '#FFA726' },
          { label: 'مكتمل', value: stats.completed, color: '#66BB6A' },
          { label: 'متأخر', value: stats.overdue, color: '#EF5350' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px',
            textAlign: 'center', border: `1px solid ${s.color}30`,
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Task Form */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px',
          marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '16px' }}>
            {editingTask ? '✏️ تعديل المهمة' : '➕ مهمة جديدة'}
          </h3>
          <input
            placeholder="عنوان المهمة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <textarea
            placeholder="الوصف (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>التاريخ</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>الوقت</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="low">منخفضة 🟢</option>
                <option value="medium">متوسطة 🟡</option>
                <option value="high">عالية 🔴</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>الفئة</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#ccc', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={reminder}
                onChange={(e) => setReminder(e.target.checked)}
                style={{ accentColor: '#4FC3F7' }}
              />
              تذكير
            </label>
            {reminder && (
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '12px' }}
              >
                <option value={5}>5 دقائق</option>
                <option value={15}>15 دقيقة</option>
                <option value={30}>30 دقيقة</option>
                <option value={60}>ساعة</option>
                <option value={120}>ساعتان</option>
                <option value={1440}>يوم</option>
              </select>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
              background: title.trim() ? 'linear-gradient(135deg, #4FC3F7, #29B6F6)' : '#444',
              color: '#fff', cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px', fontWeight: 'bold',
            }}
          >
            {editingTask ? '💾 حفظ التعديلات' : '✅ إضافة المهمة'}
          </button>
        </div>
      )}

      {/* Calendar Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) } else { setViewMonth(viewMonth - 1) } }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>◀</button>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) } else { setViewMonth(viewMonth + 1) } }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>▶</button>
      </div>

      {/* Calendar Grid */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', color: '#888', fontSize: '11px', padding: '4px' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const count = getTasksCountForDay(day)
            return (
              <div
                key={day}
                onClick={() => {
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  store.setSelectedDate(dateStr)
                }}
                style={{
                  textAlign: 'center', padding: '6px 2px', borderRadius: '6px', cursor: 'pointer',
                  background: isSelected(day) ? '#4FC3F7' : isToday(day) ? 'rgba(79,195,247,0.2)' : 'transparent',
                  color: isSelected(day) ? '#000' : '#ccc',
                  fontWeight: isToday(day) || isSelected(day) ? 'bold' : 'normal',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                {day}
                {count > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: isSelected(day) ? '#000' : '#4FC3F7',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>
          📋 مهمات {formatTaskDate(store.selectedDate)}
        </h3>
        {selectedTasks.length === 0 ? (
          <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            لا توجد مهمات في هذا التاريخ
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedTasks.map((task) => {
              const cat = TASK_CATEGORIES.find((c) => c.id === task.category)
              const overdue = isTaskOverdue(task)
              return (
                <div
                  key={task.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px',
                    borderLeft: `4px solid ${task.color}`,
                    opacity: task.status === 'completed' ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                          background: `${PRIORITY_COLORS[task.priority]}30`, color: PRIORITY_COLORS[task.priority],
                        }}>
                          {task.priority === 'high' ? '🔴 عالية' : task.priority === 'medium' ? '🟡 متوسطة' : '🟢 منخفضة'}
                        </span>
                        {cat && <span style={{ fontSize: '11px', color: cat.color }}>{cat.label}</span>}
                        {overdue && <span style={{ fontSize: '11px', color: '#EF5350' }}>⏰ متأخر</span>}
                        {task.reminder && <span style={{ fontSize: '11px' }}>🔔</span>}
                      </div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{task.description}</div>
                      )}
                      <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                        🕐 {task.dueTime} | ⏳ {getDaysUntilDue(task.dueDate) === 0 ? 'اليوم' : `${getDaysUntilDue(task.dueDate)} أيام`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '8px' }}>
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => store.completeTask(task.id)}
                          style={{ background: '#66BB6A', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >✓</button>
                      )}
                      <button
                        onClick={() => handleEdit(task)}
                        style={{ background: '#4FC3F7', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >✏</button>
                      <button
                        onClick={() => store.deleteTask(task.id)}
                        style={{ background: '#EF5350', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>📆 المهمات القادمة (7 أيام)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {upcomingTasks.slice(0, 10).map((task) => {
              const days = getDaysUntilDue(task.dueDate)
              return (
                <div
                  key={task.id}
                  onClick={() => store.setSelectedDate(task.dueDate)}
                  style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 12px',
                    borderLeft: `3px solid ${task.color}`, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ color: '#fff', fontSize: '13px' }}>{task.title}</span>
                    <span style={{ color: '#666', fontSize: '11px', marginRight: '8px' }}>
                      {days === 0 ? 'اليوم' : days === 1 ? 'غداً' : `بعد ${days} أيام`}
                    </span>
                  </div>
                  <span style={{ color: '#888', fontSize: '12px' }}>{task.dueTime}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
