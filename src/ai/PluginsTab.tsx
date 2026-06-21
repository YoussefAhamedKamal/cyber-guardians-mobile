import { useState } from 'react'
import { usePluginStore } from '@/store/pluginStore'
import { PLUGIN_TEMPLATES, type PluginCategory } from '@/types/plugins'

const CATEGORY_LABELS: Record<PluginCategory | 'all', string> = {
  all: 'الكل',
  calculator: 'حاسبة',
  database: 'قاعدة بيانات',
  visualization: 'تصور',
  scraping: 'مسح ويب',
  file_system: 'ملفات',
  api: 'API',
  custom: 'مخصص'
}

const CATEGORY_ICONS: Record<PluginCategory | 'all', string> = {
  all: '📋',
  calculator: '🧮',
  database: '🗄️',
  visualization: '📊',
  scraping: '🕸️',
  file_system: '📁',
  api: '🔌',
  custom: '⚙️'
}

export function PluginsTab() {
  const {
    plugins,
    filterCategory,
    searchQuery,
    setFilterCategory,
    setSearchQuery,
    togglePlugin,
    removePlugin,
    addPluginFromTemplate,
    addPlugin,
    getEnabledPlugins
  } = usePluginStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [newPlugin, setNewPlugin] = useState({
    name: '',
    description: '',
    icon: '🔌',
    category: 'custom' as PluginCategory,
    baseUrl: '',
    authType: 'none' as 'none' | 'api_key' | 'oauth'
  })

  const [selectedEndpoint, setSelectedEndpoint] = useState<Record<string, string>>({})
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({})

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesCategory = filterCategory === 'all' || plugin.category === filterCategory
    const matchesSearch = !searchQuery ||
      plugin.name.includes(searchQuery) ||
      plugin.description.includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  const enabledCount = getEnabledPlugins().length

  const handleAddPlugin = () => {
    if (!newPlugin.name) return
    addPlugin({
      name: newPlugin.name,
      description: newPlugin.description,
      icon: newPlugin.icon,
      enabled: true,
      category: newPlugin.category,
      config: { baseUrl: newPlugin.baseUrl },
      endpoints: [],
      auth: { type: newPlugin.authType },
      events: [],
      hooks: []
    })
    setNewPlugin({ name: '', description: '', icon: '🔌', category: 'custom', baseUrl: '', authType: 'none' })
    setShowAddModal(false)
  }

  const handleAddFromTemplate = (templateId: string) => {
    addPluginFromTemplate(templateId)
    setShowTemplates(false)
  }

  return (
    <div style={{ padding: '16px', direction: 'rtl', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--heading-color)' }}>
            🔌 الأدوات ({enabledCount}/{plugins.length})
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
            أدوات خارجية يمكن ربطها بـ AI
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
              fontSize: '12px'
            }}
          >
            📚 القوالب
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '6px 12px',
              background: '#2196F3',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
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
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 12px', color: '#aaa', fontSize: '14px' }}>قوالب جاهزة</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
            {PLUGIN_TEMPLATES.map((template) => (
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
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2196F3'
                  e.currentTarget.style.background = '#2e2e3a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#444'
                  e.currentTarget.style.background = '#2a2a3e'
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
            fontSize: '13px'
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as PluginCategory | 'all')}
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

      {/* Plugins List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredPlugins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔌</div>
            <p>لا توجد أدوات بعد</p>
            <p style={{ fontSize: '12px' }}>اضغط "+ إضافة" لبدء إضافة أدوات</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: plugin.enabled ? '#1a2e1a' : '#1a1a2e',
                  border: `1px solid ${plugin.enabled ? '#2196F3' : '#333'}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px', marginLeft: '12px' }}>{plugin.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#ddd', fontWeight: 'bold' }}>{plugin.name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{plugin.description}</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    {CATEGORY_LABELS[plugin.category]} • استخدام: {plugin.usageHistory.length} مرة
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {plugin.enabled && plugin.config.baseUrl && plugin.endpoints.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <select
                        value={selectedEndpoint[plugin.id] || plugin.endpoints[0]?.id || ''}
                        onChange={(e) => setSelectedEndpoint({ ...selectedEndpoint, [plugin.id]: e.target.value })}
                        style={{
                          padding: '4px 8px',
                          background: '#2a2a3e',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      >
                        {plugin.endpoints.map((ep) => (
                          <option key={ep.id} value={ep.id}>{ep.name || ep.id}</option>
                        ))}
                      </select>
                      {(() => {
                        const epId = selectedEndpoint[plugin.id] || plugin.endpoints[0]?.id
                        const ep = plugin.endpoints.find((e) => e.id === epId)
                        const requiredParams = (ep?.parameters || []).filter((p) => p.required)
                        if (requiredParams.length === 0) return null
                        return requiredParams.map((param) => (
                          <input
                            key={param.name}
                            id={`param-${plugin.id}-${param.name}`}
                            type="text"
                            placeholder={param.name}
                            value={paramValues[plugin.id]?.[param.name] || ''}
                            onChange={(e) => setParamValues({
                              ...paramValues,
                              [plugin.id]: { ...paramValues[plugin.id], [param.name]: e.target.value }
                            })}
                            style={{
                              padding: '4px 8px',
                              background: '#2a2a3e',
                              border: '1px solid #444',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '11px',
                              width: '140px'
                            }}
                          />
                        ))
                      })()}
                      <button
                        onClick={async () => {
                          const epId = selectedEndpoint[plugin.id] || plugin.endpoints[0]?.id
                          const endpoint = plugin.endpoints.find((e) => e.id === epId)
                          if (endpoint) {
                            try {
                              const params: Record<string, string> = {}
                              for (const param of endpoint.parameters || []) {
                                const inputEl = document.getElementById(`param-${plugin.id}-${param.name}`) as HTMLInputElement | null
                                if (inputEl && inputEl.value) {
                                  params[param.name] = inputEl.value
                                } else if (param.defaultValue) {
                                  params[param.name] = String(param.defaultValue)
                                }
                              }
                              const result = await usePluginStore.getState().executePlugin(plugin.id, endpoint.id, params)
                              alert(`✅ نتيجة ${plugin.name}:\n${typeof result === 'string' ? result : JSON.stringify(result, null, 2).slice(0, 500)}`)
                            } catch (err: unknown) {
                              const message = err instanceof Error ? err.message : 'Unknown error'
                              alert(`❌ خطأ: ${message}`)
                            }
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        ▶ تنفيذ
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: plugin.enabled ? '#2196F3' : '#555',
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
                      left: plugin.enabled ? '22px' : '2px',
                      transition: 'all 0.2s'
                    }} />
                  </button>
                  <button
                    onClick={() => removePlugin(plugin.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid #666',
                      borderRadius: '4px',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '12px'
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
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff' }}>➕ إضافة أداة جديدة</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>الاسم</label>
              <input
                type="text"
                value={newPlugin.name}
                onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>الوصف</label>
              <input
                type="text"
                value={newPlugin.description}
                onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
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
                value={newPlugin.icon}
                onChange={(e) => setNewPlugin({ ...newPlugin, icon: e.target.value })}
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
                value={newPlugin.category}
                onChange={(e) => setNewPlugin({ ...newPlugin, category: e.target.value as PluginCategory })}
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

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>Base URL</label>
              <input
                type="text"
                value={newPlugin.baseUrl}
                onChange={(e) => setNewPlugin({ ...newPlugin, baseUrl: e.target.value })}
                placeholder="https://api.example.com"
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>نوع المصادقة</label>
              <select
                value={newPlugin.authType}
                onChange={(e) => setNewPlugin({ ...newPlugin, authType: e.target.value as 'none' | 'api_key' | 'oauth' })}
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
                <option value="none">بدون مصادقة</option>
                <option value="api_key">API Key</option>
                <option value="oauth">OAuth</option>
              </select>
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
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleAddPlugin}
                disabled={!newPlugin.name}
                style={{
                  padding: '8px 16px',
                  background: newPlugin.name ? '#2196F3' : '#555',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: newPlugin.name ? 'pointer' : 'not-allowed'
                }}
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
