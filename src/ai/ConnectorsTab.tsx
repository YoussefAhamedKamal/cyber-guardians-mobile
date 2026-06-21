import { useState } from 'react'
import { useConnectorStore } from '@/store/connectorStore'
import { CONNECTOR_TEMPLATES, type ConnectorProvider } from '@/types/connectors'

const PROVIDER_LABELS: Record<ConnectorProvider | 'all', string> = {
  all: 'الكل',
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
  lmstudio: 'LM Studio',
  custom: 'مخصص'
}

const PROVIDER_ICONS: Record<ConnectorProvider | 'all', string> = {
  all: '📋',
  openai: '🤖',
  anthropic: '🧠',
  google: '✨',
  meta: '🦙',
  mistral: '🌊',
  github_copilot: '🐙',
  cursor: '🖱️',
  codeium: '⚡',
  aws_bedrock: '☁️',
  azure_openai: '🔷',
  google_cloud: '🌐',
  ollama: '🏠',
  lmstudio: '🖥️',
  custom: '⚙️'
}

export function ConnectorsTab() {
  const {
    connectors,
    filterProvider,
    searchQuery,
    setFilterProvider,
    setSearchQuery,
    toggleConnector,
    removeConnector,
    addConnectorFromTemplate,
    addConnector,
    connectConnector,
    disconnectConnector,
    testConnection,
    getConnectedConnectors
  } = useConnectorStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [newConnector, setNewConnector] = useState({
    name: '',
    description: '',
    icon: '🔗',
    provider: 'custom' as ConnectorProvider,
    baseUrl: '',
    apiKey: '',
    models: ''
  })
  const [testingId, setTestingId] = useState<string | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')

  const filteredConnectors = connectors.filter((connector) => {
    const matchesProvider = filterProvider === 'all' || connector.provider === filterProvider
    const matchesSearch = !searchQuery ||
      connector.name.includes(searchQuery) ||
      connector.description.includes(searchQuery)
    return matchesProvider && matchesSearch
  })

  const connectedCount = getConnectedConnectors().length

  const handleAddConnector = () => {
    if (!newConnector.name || !newConnector.baseUrl) return
    addConnector({
      name: newConnector.name,
      description: newConnector.description,
      icon: newConnector.icon,
      provider: newConnector.provider,
      authType: newConnector.apiKey ? 'api_key' : 'none',
      connected: false,
      credentials: newConnector.apiKey ? { apiKey: newConnector.apiKey } : {},
      config: {
        baseUrl: newConnector.baseUrl,
        models: newConnector.models.split(',').map((m) => m.trim()).filter(Boolean)
      },
      capabilities: [],
      lastSync: null,
      lastError: null
    })
    setNewConnector({ name: '', description: '', icon: '🔗', provider: 'custom', baseUrl: '', apiKey: '', models: '' })
    setShowAddModal(false)
  }

  const handleAddFromTemplate = (templateId: string) => {
    addConnectorFromTemplate(templateId)
    setShowTemplates(false)
  }

  const handleConnect = async (id: string, apiKey: string) => {
    connectConnector(id, { apiKey })
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    await testConnection(id)
    setTestingId(null)
  }

  return (
    <div style={{ padding: '16px', direction: 'rtl', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--heading-color)' }}>
            🔗 الاتصالات ({connectedCount}/{connectors.length})
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
            اتصالات بخدمات AI خارجية
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
              background: '#FF9800',
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
            {CONNECTOR_TEMPLATES.map((template) => (
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
                  e.currentTarget.style.borderColor = '#FF9800'
                  e.currentTarget.style.background = '#3a2e1a'
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
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value as ConnectorProvider | 'all')}
          style={{
            padding: '8px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px'
          }}
        >
          {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{PROVIDER_ICONS[key as keyof typeof PROVIDER_ICONS]} {label}</option>
          ))}
        </select>
      </div>

      {/* Connectors List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredConnectors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
            <p>لا توجد اتصالات بعد</p>
            <p style={{ fontSize: '12px' }}>اضغط "+ إضافة" لبدء إضافة اتصالات</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredConnectors.map((connector) => (
              <div
                key={connector.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: connector.connected ? '#1a2e1a' : '#1a1a2e',
                  border: `1px solid ${connector.connected ? '#4CAF50' : '#333'}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px', marginLeft: '12px' }}>{connector.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#ddd', fontWeight: 'bold' }}>{connector.name}</span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: connector.connected ? '#4CAF50' : '#666',
                      color: 'white'
                    }}>
                      {connector.connected ? 'متصل' : 'غير متصل'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{connector.description}</div>
                  {connector.lastError && (
                    <div style={{ fontSize: '11px', color: '#f44336', marginTop: '4px' }}>⚠️ {connector.lastError}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {connector.connected ? (
                    <>
                      <button
                        onClick={() => handleTest(connector.id)}
                        disabled={testingId === connector.id}
                        style={{
                          padding: '4px 8px',
                          background: testingId === connector.id ? '#555' : '#2196F3',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: testingId === connector.id ? 'wait' : 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        {testingId === connector.id ? '⏳' : '🔍 اختبار'}
                      </button>
                      <button
                        onClick={() => disconnectConnector(connector.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#f44336',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        🔌 قطع
                      </button>
                    </>
                  ) : connectingId === connector.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="API Key"
                        style={{
                          width: '120px',
                          padding: '4px 8px',
                          background: '#2a2a3e',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      />
                      <button
                        onClick={() => {
                          if (apiKeyInput) {
                            handleConnect(connector.id, apiKeyInput)
                            setConnectingId(null)
                            setApiKeyInput('')
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#4CAF50',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => { setConnectingId(null); setApiKeyInput('') }}
                        style={{
                          padding: '4px 8px',
                          background: '#555',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConnectingId(connector.id); setApiKeyInput('') }}
                      style={{
                        padding: '4px 8px',
                        background: '#4CAF50',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      🔌 اتصال
                    </button>
                  )}
                  <button
                    onClick={() => removeConnector(connector.id)}
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
            <h3 style={{ margin: '0 0 16px', color: '#fff' }}>➕ إضافة اتصال جديد</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>الاسم</label>
              <input
                type="text"
                value={newConnector.name}
                onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })}
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
                value={newConnector.description}
                onChange={(e) => setNewConnector({ ...newConnector, description: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>المزود</label>
              <select
                value={newConnector.provider}
                onChange={(e) => setNewConnector({ ...newConnector, provider: e.target.value as ConnectorProvider })}
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
                {Object.entries(PROVIDER_LABELS).filter(([key]) => key !== 'all').map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>Base URL</label>
              <input
                type="text"
                value={newConnector.baseUrl}
                onChange={(e) => setNewConnector({ ...newConnector, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
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
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>API Key (اختياري)</label>
              <input
                type="password"
                value={newConnector.apiKey}
                onChange={(e) => setNewConnector({ ...newConnector, apiKey: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '12px' }}>النماذج (مفصولة بفواصل)</label>
              <input
                type="text"
                value={newConnector.models}
                onChange={(e) => setNewConnector({ ...newConnector, models: e.target.value })}
                placeholder="gpt-4, gpt-3.5-turbo"
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
                onClick={handleAddConnector}
                disabled={!newConnector.name || !newConnector.baseUrl}
                style={{
                  padding: '8px 16px',
                  background: newConnector.name && newConnector.baseUrl ? '#FF9800' : '#555',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: newConnector.name && newConnector.baseUrl ? 'pointer' : 'not-allowed'
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
