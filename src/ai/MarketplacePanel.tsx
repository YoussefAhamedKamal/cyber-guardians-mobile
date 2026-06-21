import { useState } from 'react'
import { useSkillStore } from '@/store/skillStore'
import { usePluginStore } from '@/store/pluginStore'
import { useConnectorStore } from '@/store/connectorStore'
import { SKILL_TEMPLATES, type SkillTemplate } from '@/types/skills'
import { PLUGIN_TEMPLATES, type PluginTemplate } from '@/types/plugins'
import { CONNECTOR_TEMPLATES, type ConnectorTemplate } from '@/types/connectors'

type MarketplaceTab = 'skills' | 'plugins' | 'connectors'

interface MarketplaceItem {
  id: string
  name: string
  description: string
  icon: string
  category: string
  type: 'skill' | 'plugin' | 'connector'
  installed: boolean
  template: SkillTemplate | PluginTemplate | ConnectorTemplate
}

export function MarketplacePanel() {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('skills')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'category'>('name')

  const skillStore = useSkillStore()
  const pluginStore = usePluginStore()
  const connectorStore = useConnectorStore()

  // Convert templates to marketplace items
  const allItems: MarketplaceItem[] = [
    ...SKILL_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      category: t.category,
      type: 'skill' as const,
      installed: skillStore.skills.some((s) => s.name === t.name),
      template: t
    })),
    ...PLUGIN_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      category: t.category,
      type: 'plugin' as const,
      installed: pluginStore.plugins.some((p) => p.name === t.name),
      template: t
    })),
    ...CONNECTOR_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      category: t.provider,
      type: 'connector' as const,
      installed: connectorStore.connectors.some((c) => c.name === t.name),
      template: t
    }))
  ]

  // Filter items
  const singularTab = activeTab === 'skills' ? 'skill' : activeTab === 'plugins' ? 'plugin' : 'connector'
  const filteredItems = allItems.filter((item) => {
    const matchesType = singularTab === item.type
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesType && matchesSearch && matchesCategory
  })

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar')
    return a.category.localeCompare(b.category)
  })

  // Get categories for current tab
  const categories = [...new Set(allItems.filter((i) => i.type === singularTab).map((i) => i.category))]

  // Install item
  const handleInstall = (item: MarketplaceItem) => {
    switch (item.type) {
      case 'skill':
        skillStore.addSkillFromTemplate(item.id)
        break
      case 'plugin':
        pluginStore.addPluginFromTemplate(item.id)
        break
      case 'connector':
        connectorStore.addConnectorFromTemplate(item.id)
        break
    }
    setSelectedItem(null)
  }

  // Uninstall item
  const handleUninstall = (item: MarketplaceItem) => {
    switch (item.type) {
      case 'skill': {
        const skill = skillStore.skills.find((s) => s.name === item.name)
        if (skill) skillStore.removeSkill(skill.id)
        break
      }
      case 'plugin': {
        const plugin = pluginStore.plugins.find((p) => p.name === item.name)
        if (plugin) pluginStore.removePlugin(plugin.id)
        break
      }
      case 'connector': {
        const connector = connectorStore.connectors.find((c) => c.name === item.name)
        if (connector) connectorStore.removeConnector(connector.id)
        break
      }
    }
  }

  // Get category label
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      translation: 'ترجمة',
      analysis: 'تحليل',
      writing: 'كتابة',
      math: 'رياضيات',
      coding: 'برمجة',
      research: 'بحث',
      creative: 'إبداع',
      custom: 'مخصص',
      calculator: 'حاسبة',
      database: 'قاعدة بيانات',
      visualization: 'تصور',
      scraping: 'مسح ويب',
      file_system: 'ملفات',
      api: 'API',
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      meta: 'Meta',
      mistral: 'Mistral',
      github_copilot: 'GitHub Copilot',
      cursor: 'Cursor',
      codeium: 'Codeium',
      aws_bedrock: 'AWS Bedrock',
      azure_openai: 'Azure OpenAI',
      google_cloud: 'Google Cloud',
      ollama: 'Ollama',
      lmstudio: 'LM Studio'
    }
    return labels[category] || category
  }

  return (
    <div style={{ padding: '16px', direction: 'rtl', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>🛒 سوق القوالب</h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
          اكتشف وثبّت قوالب جديدة لتحسين قدرات AI
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {([
          { id: 'skills' as const, label: '📋 قدرات', count: SKILL_TEMPLATES.length },
          { id: 'plugins' as const, label: '🔌 أدوات', count: PLUGIN_TEMPLATES.length },
          { id: 'connectors' as const, label: '🔗 اتصالات', count: CONNECTOR_TEMPLATES.length }
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === tab.id ? '#4CAF50' : '#2a2a3e',
              border: `1px solid ${activeTab === tab.id ? '#4CAF50' : '#444'}`,
              borderRadius: '8px',
              color: activeTab === tab.id ? 'white' : '#aaa',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="🔍 بحث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px'
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '10px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px'
          }}
        >
          <option value="all">الكل</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'category')}
          style={{
            padding: '10px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px'
          }}
        >
          <option value="name">ترتيب بالاسم</option>
          <option value="category">ترتيب بالفئة</option>
        </select>
      </div>

      {/* Items Grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sortedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
            <p>لا توجد نتائج</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {sortedItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: '16px',
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4CAF50'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {item.installed && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    padding: '2px 6px',
                    background: '#4CAF50',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: 'white'
                  }}>
                    مثبت ✓
                  </div>
                )}
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#fff' }}>{item.name}</h4>
                <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
                  {item.description}
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  background: '#2a2a3e',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: '#aaa'
                }}>
                  {getCategoryLabel(item.category)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: '16px',
              padding: '24px',
              width: '400px',
              maxHeight: '80vh',
              overflowY: 'auto',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '48px' }}>{selectedItem.icon}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>{selectedItem.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
                    {selectedItem.type === 'skill' ? 'قدرة' : selectedItem.type === 'plugin' ? 'أداة' : 'اتصال'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.6', marginBottom: '16px' }}>
              {selectedItem.description}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>الفئة</div>
              <div style={{
                display: 'inline-block',
                padding: '4px 8px',
                background: '#2a2a3e',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#aaa'
              }}>
                {getCategoryLabel(selectedItem.category)}
              </div>
            </div>

            {selectedItem.type === 'connector' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>النماذج المتاحة</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(selectedItem.template as ConnectorTemplate).config.models.map((model) => (
                    <span key={model} style={{
                      padding: '2px 6px',
                      background: '#2a2a3e',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#aaa'
                    }}>
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.type === 'skill' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>System Prompt</div>
                <div style={{
                  padding: '8px 12px',
                  background: '#0d1128',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#aaa',
                  lineHeight: '1.5',
                  maxHeight: '100px',
                  overflowY: 'auto'
                }}>
                  {(selectedItem.template as SkillTemplate).systemPrompt}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {selectedItem.installed ? (
                <button
                  onClick={() => handleUninstall(selectedItem)}
                  style={{
                    padding: '10px 20px',
                    background: '#f44336',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  إلغاء التثبيت
                </button>
              ) : (
                <button
                  onClick={() => handleInstall(selectedItem)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                  }}
                >
                  تثبيت
                </button>
              )}
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
      `}</style>
    </div>
  )
}
