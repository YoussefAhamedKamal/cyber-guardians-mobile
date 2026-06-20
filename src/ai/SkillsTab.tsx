import { useState, useRef, useCallback } from 'react'
import { useSkillStore } from '@/store/skillStore'
import { SKILL_TEMPLATES, type SkillCategory, type Skill } from '@/types/skills'

const CATEGORY_LABELS: Record<SkillCategory | 'all', string> = {
  all: 'الكل',
  translation: 'ترجمة',
  analysis: 'تحليل',
  writing: 'كتابة',
  math: 'رياضيات',
  coding: 'برمجة',
  research: 'بحث',
  creative: 'إبداع',
  custom: 'مخصص'
}

const CATEGORY_ICONS: Record<SkillCategory | 'all', string> = {
  all: '📋',
  translation: '🌐',
  analysis: '🔍',
  writing: '📝',
  math: '🧮',
  coding: '💻',
  research: '🔬',
  creative: '🎨',
  custom: '⚙️'
}

export function SkillsTab() {
  const {
    skills,
    filterCategory,
    searchQuery,
    setFilterCategory,
    setSearchQuery,
    toggleSkill,
    removeSkill,
    addSkillFromTemplate,
    addSkill,
    getEnabledSkills,
    setActiveSkill
  } = useSkillStore()
  const activeSkillId = useSkillStore((s) => s.activeSkillId)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    icon: '⚡',
    systemPrompt: '',
    category: 'custom' as SkillCategory
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredSkills = skills.filter((skill) => {
    const matchesCategory = filterCategory === 'all' || skill.category === filterCategory
    const matchesSearch = !searchQuery ||
      skill.name.includes(searchQuery) ||
      skill.description.includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  const enabledCount = getEnabledSkills().length

  const handleAddSkill = () => {
    if (!newSkill.name || !newSkill.systemPrompt) return
    addSkill({
      ...newSkill,
      enabled: true,
      config: {}
    })
    setNewSkill({ name: '', description: '', icon: '⚡', systemPrompt: '', category: 'custom' })
    setShowAddModal(false)
  }

  const handleAddFromTemplate = (templateId: string) => {
    addSkillFromTemplate(templateId)
    setShowTemplates(false)
  }

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const filteredSkills = skills
      .filter(s => filterCategory === 'all' || s.category === filterCategory)
      .filter(s => !searchQuery || s.name.includes(searchQuery) || s.description.includes(searchQuery))
    const draggedSkill = filteredSkills[draggedIndex]
    const targetSkill = filteredSkills[index]
    if (!draggedSkill || !targetSkill) return
    const allSkills = [...skills]
    const draggedIdx = allSkills.findIndex(s => s.id === draggedSkill.id)
    const targetIdx = allSkills.findIndex(s => s.id === targetSkill.id)
    if (draggedIdx === -1 || targetIdx === -1) return
    const [removed] = allSkills.splice(draggedIdx, 1)
    if (removed) allSkills.splice(targetIdx, 0, removed)
    useSkillStore.setState({ skills: allSkills })
    setDraggedIndex(index)
  }, [draggedIndex, skills, filterCategory, searchQuery])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  return (
    <div style={{ padding: '16px', direction: 'rtl', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--heading-color)' }}>
            📋 القدرات ({enabledCount}/{skills.length})
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
            قدرات مخصصة يمكن تفعيلها لتحسين محادثات AI
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              padding: '6px 12px',
              background: '#2a2a3e',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#aaa',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3a3a4e'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2a2a3e'
              e.currentTarget.style.color = '#aaa'
            }}
          >
            📚 القوالب
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)'
            }}
          >
            + إضافة
          </button>
        </div>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div style={{
          background: '#1a1a2e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          maxHeight: '200px',
          overflowY: 'auto',
          animation: 'slideDown 0.2s ease-out'
        }}>
          <h4 style={{ margin: '0 0 12px', color: '#aaa', fontSize: '14px' }}>قوالب جاهزة</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
            {SKILL_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleAddFromTemplate(template.id)}
                style={{
                  padding: '12px',
                  background: '#2a2a3e',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.2s',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4CAF50'
                  e.currentTarget.style.background = '#2d3a2e'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#444'
                  e.currentTarget.style.background = '#2a2a3e'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{template.icon}</div>
                <div style={{ fontSize: '13px', color: '#ddd', fontWeight: 'bold' }}>{template.name}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="🔍 بحث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#4CAF50'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.2)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as SkillCategory | 'all')}
          style={{
            padding: '8px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px'
          }}
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]} {label}</option>
          ))}
        </select>
      </div>

      {/* Skills List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredSkills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'bounce 1s infinite' }}>📋</div>
            <p>لا توجد قدرات بعد</p>
            <p style={{ fontSize: '12px' }}>اضغط "+ إضافة" لبدء إضافة قدرات</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredSkills.map((skill, index) => (
              <div
                key={skill.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: skill.enabled
                    ? hoveredIndex === index
                      ? '#1e3a1e'
                      : '#1a2e1a'
                    : hoveredIndex === index
                      ? '#1e1e2e'
                      : '#1a1a2e',
                  border: `1px solid ${skill.enabled ? '#4CAF50' : '#333'}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  cursor: 'grab',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  transform: hoveredIndex === index ? 'translateX(-2px)' : 'none'
                }}
              >
                <div style={{ fontSize: '24px', marginLeft: '12px' }}>{skill.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#ddd', fontWeight: 'bold' }}>{skill.name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{skill.description}</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    {CATEGORY_LABELS[skill.category]} • استخدام: {skill.usageHistory.length} مرة
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {skill.enabled && (
                    <button
                      onClick={() => setActiveSkill(skill.id === activeSkillId ? null : skill.id)}
                      style={{
                        padding: '4px 10px',
                        background: skill.id === activeSkillId
                          ? 'linear-gradient(135deg, #4CAF50, #45a049)'
                          : 'transparent',
                        border: `1px solid ${skill.id === activeSkillId ? '#4CAF50' : '#666'}`,
                        borderRadius: '4px',
                        color: skill.id === activeSkillId ? 'white' : '#888',
                        cursor: 'pointer',
                        fontSize: '11px',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {skill.id === activeSkillId ? '⚡ نشط' : 'تفعيل'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleSkill(skill.id)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: skill.enabled ? '#4CAF50' : '#555',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: skill.enabled ? '22px' : '2px',
                      transition: 'all 0.2s'
                    }} />
                  </button>
                  <button
                    onClick={() => removeSkill(skill.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid #666',
                      borderRadius: '4px',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f44336'
                      e.currentTarget.style.color = 'white'
                      e.currentTarget.style.borderColor = '#f44336'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#888'
                      e.currentTarget.style.borderColor = '#666'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxHeight: '80vh',
            overflowY: 'auto',
            animation: 'slideUp 0.2s ease-out'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff' }}>➕ إضافة قدرة جديدة</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>الاسم</label>
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#2a2a3e',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4CAF50'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#444'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>الوصف</label>
              <input
                type="text"
                value={newSkill.description}
                onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#2a2a3e',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>الأيقونة</label>
              <input
                type="text"
                value={newSkill.icon}
                onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#2a2a3e',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>الفئة</label>
              <select
                value={newSkill.category}
                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as SkillCategory })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#2a2a3e',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              >
                {Object.entries(CATEGORY_LABELS).filter(([key]) => key !== 'all').map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>System Prompt</label>
              <textarea
                value={newSkill.systemPrompt}
                onChange={(e) => setNewSkill({ ...newSkill, systemPrompt: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#2a2a3e',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#aaa',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#444'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#333'
                  e.currentTarget.style.color = '#aaa'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleAddSkill}
                disabled={!newSkill.name || !newSkill.systemPrompt}
                style={{
                  padding: '8px 16px',
                  background: newSkill.name && newSkill.systemPrompt
                    ? 'linear-gradient(135deg, #4CAF50, #45a049)'
                    : '#555',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: newSkill.name && newSkill.systemPrompt ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: newSkill.name && newSkill.systemPrompt
                    ? '0 2px 8px rgba(76, 175, 80, 0.3)'
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (newSkill.name && newSkill.systemPrompt) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = newSkill.name && newSkill.systemPrompt
                    ? '0 2px 8px rgba(76, 175, 80, 0.3)'
                    : 'none'
                }}
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
