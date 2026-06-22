import { useState, useEffect } from 'react'
import { useLocalAgentStore } from '../store/localAgentStore'
import { aiChat, getAIProviders, fileOp, grepSearch, runOpenCodeAgent, getOpenCodeStatus, launchOpenCodeDesktop } from './localAgent'
import type { ScanResult, Finding } from '../types/localAgent'

const TOOLS = [
  { id: 'semgrep', name: 'Semgrep', icon: '🔍', desc: 'Static analysis for many languages' },
  { id: 'codeql', name: 'CodeQL', icon: '🛡️', desc: 'Deep code analysis' },
  { id: 'slither', name: 'Slither', icon: '🐍', desc: 'Solidity smart contract analysis' },
  { id: 'libfuzzer', name: 'libFuzzer', icon: '🐛', desc: 'Coverage-guided fuzzing' },
]

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'go', 'ruby', 'php', 'c', 'cpp', 'rust', 'solidity'
]

export function LocalAgentTab() {
  const {
    connected, url, token, status, tools, skills, lastScanResult, scanning, error,
    connect, disconnect, scan, findSkills, listInstalled, installSkill, execute, parseFile
  } = useLocalAgentStore()

  // Note: Connection persists across tab switches via Zustand store
  // Do NOT disconnect on unmount

  const [inputUrl, setInputUrl] = useState(url || 'ws://localhost:3002')
  const [inputToken, setInputToken] = useState(token || '')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [selectedTool, setSelectedTool] = useState('semgrep')
  const [skillQuery, setSkillQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'scan' | 'skills' | 'installed' | 'execute' | 'ai' | 'files' | 'search' | 'opencode'>('scan')
  const [executeCommand, setExecuteCommand] = useState('')
  const [executeResult, setExecuteResult] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [installingPkg, setInstallingPkg] = useState<string | null>(null)

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProviders, setAiProviders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash')

  // File manager state
  const [filePath, setFilePath] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [fileList, setFileList] = useState<string[]>([])
  const [fileLoading, setFileLoading] = useState(false)

  // Search state
  const [searchDir, setSearchDir] = useState('.')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // OpenCode state
  const [opencodeInput, setOpencodeInput] = useState('')
  const [opencodeOutput, setOpencodeOutput] = useState('')
  const [opencodeLoading, setOpencodeLoading] = useState(false)
  const [opencodeStatus, setOpencodeStatus] = useState<any>(null)
  const [opencodeModel, setOpencodeModel] = useState('')
  const [opencodeFile, setOpencodeFile] = useState('')

  useEffect(() => {
    if (url) setInputUrl(url)
    if (token) setInputToken(token)
  }, [url, token])

  const handleConnect = async () => {
    try {
      const tokenVal = inputToken.trim() || undefined
      await connect(inputUrl, tokenVal)
    } catch (err: unknown) {
      alert(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleScan = async () => {
    if (!code.trim()) return
    try {
      await scan(selectedTool, code, language)
    } catch (err: unknown) {
      console.error('Scan failed:', err)
    }
  }

  const handleFindSkills = async () => {
    if (!skillQuery.trim()) return
    try {
      await findSkills(skillQuery)
    } catch (err: unknown) {
      console.error('Find skills failed:', err)
    }
  }

  const handleListInstalled = async () => {
    try {
      await listInstalled()
    } catch (err: unknown) {
      console.error('List installed failed:', err)
    }
  }

  const handleInstallSkill = async (pkg: string) => {
    setInstallingPkg(pkg)
    try {
      // pkg is full name like "owner/repo@skill" — extract owner/repo for install
      const repoName = pkg.replace(/@[^@/]+$/, '').replace(/\/+$/, '')
      const success = await installSkill(repoName)
      if (success) {
        alert(`✅ Installed all skills from:\n${repoName}\n\nFind them in the "Installed" tab.`)
      } else {
        alert(`❌ Failed to install:\n${repoName}\n\nCheck terminal for details.`)
      }
    } catch (err: unknown) {
      alert(`❌ Install error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setInstallingPkg(null)
    }
  }

  const handleExecute = async () => {
    if (!executeCommand.trim()) return
    setExecuting(true)
    try {
      const result = await execute(executeCommand)
      setExecuteResult(JSON.stringify(result, null, 2))
    } catch (err: unknown) {
      setExecuteResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setExecuting(false)
    }
  }

  // AI Chat
  const handleAiChat = async () => {
    if (!aiInput.trim() || aiLoading) return
    const userMsg = { role: 'user', content: aiInput }
    const newMessages = [...aiMessages, userMsg]
    setAiMessages(newMessages)
    setAiInput('')
    setAiLoading(true)
    try {
      const result = await aiChat(newMessages, { provider: selectedProvider, model: selectedModel })
      setAiMessages([...newMessages, { role: 'assistant', content: result.content }])
    } catch (err: any) {
      setAiMessages([...newMessages, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setAiLoading(false)
    }
  }

  const loadProviders = async () => {
    try {
      const result = await getAIProviders()
      setAiProviders(result.providers || [])
      if (result.active) {
        setSelectedProvider(result.active.provider)
        setSelectedModel(result.active.model)
      }
    } catch (err) {
      console.error('Failed to load providers:', err)
    }
  }

  // File operations
  const handleFileRead = async () => {
    if (!filePath.trim()) return
    setFileLoading(true)
    try {
      const result = await fileOp('read', filePath)
      if (result.success) {
        setFileContent(result.content || '')
      } else {
        setFileContent(`Error: ${result.error}`)
      }
    } catch (err: any) {
      setFileContent(`Error: ${err.message}`)
    } finally {
      setFileLoading(false)
    }
  }

  const handleFileList = async () => {
    const dir = filePath.trim() || '.'
    setFileLoading(true)
    try {
      const result = await fileOp('list', dir)
      if (result.success) {
        setFileList(result.files || [])
      } else {
        setFileList([`Error: ${result.error}`])
      }
    } catch (err: any) {
      setFileList([`Error: ${err.message}`])
    } finally {
      setFileLoading(false)
    }
  }

  const handleFileWrite = async () => {
    if (!filePath.trim()) return
    setFileLoading(true)
    try {
      const result = await fileOp('write', filePath, fileContent)
      alert(result.success ? 'File saved!' : `Error: ${result.error}`)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setFileLoading(false)
    }
  }

  // Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    try {
      const results = await grepSearch(searchDir || '.', searchQuery)
      setSearchResults(results || [])
    } catch (err: any) {
      setSearchResults([{ file: 'Error', line: 0, content: err.message }])
    } finally {
      setSearchLoading(false)
    }
  }

  // OpenCode
  const handleOpenCode = async () => {
    if (!opencodeInput.trim() || opencodeLoading) return
    setOpencodeLoading(true)
    setOpencodeOutput('')
    try {
      const options: any = {}
      if (opencodeModel) options.model = opencodeModel
      if (opencodeFile) options.filePath = opencodeFile
      const result = await runOpenCodeAgent(opencodeInput, options)
      setOpencodeOutput(result.output || result.error || 'No output')
    } catch (err: any) {
      setOpencodeOutput(`Error: ${err.message}`)
    } finally {
      setOpencodeLoading(false)
    }
  }

  const loadOpenCodeStatus = async () => {
    try {
      const status = await getOpenCodeStatus()
      setOpencodeStatus(status)
    } catch (err) {
      console.error('Failed to load OpenCode status:', err)
    }
  }

  const handleLaunchDesktop = async () => {
    try {
      const result = await launchOpenCodeDesktop()
      if (result.success) {
        alert('OpenCode Desktop launched!')
      } else {
        alert(`Failed to launch: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4444'
      case 'high': return '#ff8800'
      case 'medium': return '#ffbb00'
      case 'low': return '#44bb44'
      case 'info': return '#4488ff'
      default: return '#888'
    }
  }

  return (
    <div style={{ padding: '12px', color: '#fff', fontSize: '12px', height: '100%', overflow: 'auto' }}>
      {/* Connection */}
      <div style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
        <div style={{ fontWeight: 700, marginBottom: '8px', color: connected ? '#4CAF50' : '#ff4444' }}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <input
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Agent URL (ws://localhost:3002)"
          style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px', marginBottom: '6px', boxSizing: 'border-box' }}
        />
        <input
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          placeholder="Token (optional)"
          type="password"
          style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px', marginBottom: '6px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleConnect}
            disabled={connected}
            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: connected ? '#444' : '#4CAF50', color: '#fff', fontWeight: 700, cursor: connected ? 'not-allowed' : 'pointer' }}
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={!connected}
            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: !connected ? '#444' : '#f44336', color: '#fff', fontWeight: 700, cursor: !connected ? 'not-allowed' : 'pointer' }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div style={{ marginBottom: '12px', background: 'rgba(79,195,247,0.1)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ fontWeight: 700, color: '#4FC3F7', marginBottom: '4px' }}>Platform</div>
          <div>{status.platform} ({status.arch}) — {status.shell}</div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
            Tools: {status.packageManagers.join(', ')}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {(['scan', 'skills', 'installed', 'execute', 'ai', 'files', 'search', 'opencode'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, minWidth: '60px', padding: '6px', borderRadius: '4px', border: 'none',
              background: activeTab === tab ? '#4FC3F7' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#000' : '#888',
              fontWeight: 700, cursor: 'pointer', fontSize: '11px'
            }}
          >
            {tab === 'scan' ? '🔍 Scan' : tab === 'skills' ? '📦 Search' : tab === 'installed' ? '✅ Installed' : tab === 'execute' ? '⚡ Execute' : tab === 'ai' ? '🤖 AI' : tab === 'files' ? '📁 Files' : tab === 'search' ? '🔎 Grep' : '💻 Code'}
          </button>
        ))}
      </div>

      {/* Scan Tab */}
      {activeTab === 'scan' && (
        <div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                style={{
                  padding: '6px 10px', borderRadius: '4px', border: 'none',
                  background: selectedTool === tool.id ? '#4FC3F7' : 'rgba(255,255,255,0.05)',
                  color: selectedTool === tool.id ? '#000' : '#888',
                  cursor: 'pointer', fontSize: '11px'
                }}
                title={tool.desc}
              >
                {tool.icon} {tool.name}
              </button>
            ))}
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px', marginBottom: '8px' }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            style={{ width: '100%', height: '120px', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', boxSizing: 'border-box' }}
          />

          <button
            onClick={handleScan}
            disabled={!connected || scanning || !code.trim()}
            style={{
              width: '100%', padding: '8px', marginTop: '8px', borderRadius: '4px', border: 'none',
              background: !connected || scanning ? '#444' : 'linear-gradient(135deg,#4FC3F7,#29B6F6)',
              color: '#000', fontWeight: 700, cursor: !connected || scanning ? 'not-allowed' : 'pointer'
            }}
          >
            {scanning ? '⏳ Scanning...' : '🔍 Scan'}
          </button>

          {/* Results */}
          {lastScanResult && (
            <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                {lastScanResult.success ? '✅' : '❌'} {lastScanResult.summary}
              </div>
              {lastScanResult.findings.map((f: Finding, i: number) => (
                <div key={i} style={{ padding: '6px', marginBottom: '4px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', borderLeft: `3px solid ${severityColor(f.severity)}` }}>
                  <div style={{ fontWeight: 700, color: severityColor(f.severity) }}>{f.severity.toUpperCase()}</div>
                  <div>{f.message}</div>
                  {f.file && <div style={{ fontSize: '10px', color: '#888' }}>{f.file}:{f.line}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <input
              value={skillQuery}
              onChange={(e) => setSkillQuery(e.target.value)}
              placeholder="Search: ui-ux, react, landing..."
              onKeyDown={(e) => e.key === 'Enter' && handleFindSkills()}
              style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px' }}
            />
            <button
              onClick={handleFindSkills}
              disabled={!connected}
              style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#4FC3F7', color: '#000', fontWeight: 700, cursor: 'pointer' }}
            >
              Search
            </button>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {['ui-ux', 'react', 'nextjs', 'landing-page', 'figma', 'css', 'tailwind', 'animation', 'accessibility', 'python', 'api', 'database'].map(tag => (
              <button
                key={tag}
                onClick={() => { setSkillQuery(tag); findSkills(tag) }}
                disabled={!connected}
                style={{
                  padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(79,195,247,0.3)',
                  background: skillQuery === tag ? 'rgba(79,195,247,0.2)' : 'transparent',
                  color: skillQuery === tag ? '#4FC3F7' : '#888',
                  fontSize: '10px', cursor: connected ? 'pointer' : 'not-allowed'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
            💡 Install adds ALL skills from the repo
          </div>

          {skills.map((skill, i) => (
            <div key={i} style={{ padding: '8px', marginBottom: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontWeight: 700, color: '#4FC3F7' }}>{skill.name}</div>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>{skill.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#666' }}>{skill.source}</span>
                <button
                  onClick={() => handleInstallSkill(skill.name)}
                  disabled={installingPkg === skill.name}
                  style={{
                    padding: '4px 8px', borderRadius: '4px', border: 'none',
                    background: installingPkg === skill.name ? '#666' : '#4CAF50',
                    color: '#fff', fontSize: '10px',
                    cursor: installingPkg === skill.name ? 'not-allowed' : 'pointer'
                  }}
                >
                  {installingPkg === skill.name ? '⏳ Installing...' : '📦 Install'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Installed Skills Tab */}
      {activeTab === 'installed' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, fontSize: '11px', color: '#888' }}>
              All skills installed globally on your system
            </div>
            <button
              onClick={handleListInstalled}
              disabled={!connected}
              style={{
                padding: '6px 12px', borderRadius: '4px', border: 'none',
                background: connected ? '#4CAF50' : '#444',
                color: '#fff', fontWeight: 700, cursor: connected ? 'pointer' : 'not-allowed', fontSize: '11px'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          {skills.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '11px' }}>
              No skills loaded. Click Refresh to load.
            </div>
          )}
          {skills.map((skill, i) => (
            <div key={i} style={{
              padding: '8px', marginBottom: '6px', borderRadius: '4px',
              background: 'rgba(255,255,255,0.05)', borderLeft: '3px solid #4CAF50'
            }}>
              <div style={{ fontWeight: 700, color: '#4CAF50' }}>{skill.name}</div>
              <div style={{ fontSize: '10px', color: '#888' }}>{skill.description}</div>
              {skill.path && (
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  📁 {skill.path}
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#4CAF50', marginTop: '4px' }}>
                ✅ Installed
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execute Tab */}
      {activeTab === 'execute' && (
        <div>
          <textarea
            value={executeCommand}
            onChange={(e) => setExecuteCommand(e.target.value)}
            placeholder="Enter command to execute..."
            style={{ width: '100%', height: '80px', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button
            onClick={handleExecute}
            disabled={!connected || !executeCommand.trim() || executing}
            style={{
              width: '100%', padding: '8px', marginTop: '8px', borderRadius: '4px', border: 'none',
              background: !connected || !executeCommand.trim() || executing ? '#444' : 'linear-gradient(135deg,#4CAF50,#66BB6A)',
              color: '#fff', fontWeight: 700, cursor: !connected || !executeCommand.trim() || executing ? 'not-allowed' : 'pointer'
            }}
          >
            {executing ? '⏳ Executing...' : '⚡ Execute'}
          </button>
          {executeResult && (
            <pre style={{ marginTop: '8px', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: '#4CAF50', fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
              {executeResult}
            </pre>
          )}
        </div>
      )}

      {/* AI Chat Tab */}
      {activeTab === 'ai' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px' }}
            >
              <option value="gemini">Gemini (Cloud)</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="groq">Groq (Cloud)</option>
              <option value="huggingface">HuggingFace</option>
              <option value="openrouter">OpenRouter</option>
            </select>
            <button
              onClick={loadProviders}
              disabled={!connected}
              style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#4FC3F7', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}
            >
              🔄 Load
            </button>
          </div>

          {/* Provider status */}
          {aiProviders.length > 0 && (
            <div style={{ marginBottom: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {aiProviders.map((p: any) => (
                <span key={p.name} style={{
                  padding: '3px 8px', borderRadius: '12px', fontSize: '10px',
                  background: p.available ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                  color: p.available ? '#4CAF50' : '#f44336'
                }}>
                  {p.type === 'local' ? '🏠' : '☁️'} {p.name} ({p.models.length})
                </span>
              ))}
            </div>
          )}

          {/* Chat messages */}
          <div style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '8px', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)' }}>
            {aiMessages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', fontSize: '11px', padding: '20px' }}>
                AI Chat — powered by local agent
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} style={{
                marginBottom: '8px', padding: '8px', borderRadius: '4px',
                background: msg.role === 'user' ? 'rgba(79,195,247,0.1)' : 'rgba(76,175,80,0.1)',
                borderLeft: msg.role === 'user' ? '3px solid #4FC3F7' : '3px solid #4CAF50'
              }}>
                <div style={{ fontSize: '10px', color: msg.role === 'user' ? '#4FC3F7' : '#4CAF50', marginBottom: '4px', fontWeight: 700 }}>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>
                <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ textAlign: 'center', color: '#888', fontSize: '11px' }}>AI is thinking...</div>
            )}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
              placeholder="Ask AI..."
              disabled={!connected || aiLoading}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px' }}
            />
            <button
              onClick={handleAiChat}
              disabled={!connected || !aiInput.trim() || aiLoading}
              style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#4CAF50', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* File Manager Tab */}
      {activeTab === 'files' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <input
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="File or directory path"
              style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px' }}
            />
            <button onClick={handleFileRead} disabled={!connected || fileLoading} style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#4FC3F7', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}>Read</button>
            <button onClick={handleFileList} disabled={!connected || fileLoading} style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#4CAF50', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}>List</button>
            <button onClick={handleFileWrite} disabled={!connected || fileLoading} style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#ff9800', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}>Write</button>
          </div>

          {/* File content */}
          {fileContent && (
            <div>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Content:</div>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                style={{ width: '100%', height: '150px', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* File list */}
          {fileList.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Files ({fileList.length}):</div>
              <div style={{ maxHeight: '200px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '8px' }}>
                {fileList.map((f, i) => (
                  <div key={i} onClick={() => setFilePath(f)} style={{ padding: '4px', cursor: 'pointer', fontSize: '11px', color: '#4FC3F7', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search (Grep) Tab */}
      {activeTab === 'search' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <input
              value={searchDir}
              onChange={(e) => setSearchDir(e.target.value)}
              placeholder="Directory (.)"
              style={{ width: '80px', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px' }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search query..."
              style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px' }}
            />
            <button
              onClick={handleSearch}
              disabled={!connected || !searchQuery.trim() || searchLoading}
              style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#4CAF50', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              {searchLoading ? '...' : '🔎'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ maxHeight: '300px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '8px' }}>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>
                {searchResults.length} matches found
              </div>
              {searchResults.map((r, i) => (
                <div key={i} style={{ marginBottom: '6px', padding: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '10px', color: '#4FC3F7' }}>{r.file}:{r.line}</div>
                  <div style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>{r.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OpenCode Tab */}
      {activeTab === 'opencode' && (
        <div>
          {/* Status */}
          <div style={{ marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={loadOpenCodeStatus}
              disabled={!connected}
              style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#4FC3F7', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}
            >
              🔄 Status
            </button>
            {opencodeStatus && (
              <>
                <span style={{ fontSize: '10px', color: opencodeStatus.installed ? '#4CAF50' : '#f44336' }}>
                  {opencodeStatus.installed ? `✅ v${opencodeStatus.version}` : '❌ Not installed'}
                </span>
                <span style={{ fontSize: '10px', color: opencodeStatus.desktopRunning ? '#4CAF50' : '#888' }}>
                  {opencodeStatus.desktopRunning ? '🖥️ Desktop Running' : '🖥️ Desktop Stopped'}
                </span>
              </>
            )}
          </div>

          {/* Launch Desktop Button */}
          {opencodeStatus?.installed && !opencodeStatus.desktopRunning && (
            <button
              onClick={handleLaunchDesktop}
              style={{
                width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: 'none',
                background: 'linear-gradient(135deg,#9C27B0,#7B1FA2)',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px'
              }}
            >
              🚀 Launch OpenCode Desktop
            </button>
          )}

          {/* Provider info */}
          {opencodeStatus?.installed && (
            <div style={{ marginBottom: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {opencodeStatus.providers?.map((p: string) => (
                <span key={p} style={{
                  padding: '2px 6px', borderRadius: '8px', fontSize: '9px',
                  background: 'rgba(156,39,176,0.15)', color: '#CE93D8'
                }}>
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Model & File inputs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input
              value={opencodeModel}
              onChange={(e) => setOpencodeModel(e.target.value)}
              placeholder="Model (optional)"
              style={{ flex: 1, minWidth: '100px', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px' }}
            />
            <input
              value={opencodeFile}
              onChange={(e) => setOpencodeFile(e.target.value)}
              placeholder="File path (optional)"
              style={{ flex: 1, minWidth: '100px', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px' }}
            />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <textarea
              value={opencodeInput}
              onChange={(e) => setOpencodeInput(e.target.value)}
              placeholder="Ask OpenCode to write code, fix bugs, explain code..."
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleOpenCode() }}
              style={{ flex: 1, height: '60px', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={handleOpenCode}
            disabled={!connected || !opencodeInput.trim() || opencodeLoading}
            style={{
              width: '100%', padding: '8px', borderRadius: '4px', border: 'none',
              background: !connected || !opencodeInput.trim() || opencodeLoading ? '#444' : 'linear-gradient(135deg,#9C27B0,#7B1FA2)',
              color: '#fff', fontWeight: 700, cursor: !connected || !opencodeInput.trim() || opencodeLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {opencodeLoading ? '⏳ Running...' : '💻 Run OpenCode CLI'}
          </button>

          {/* Output */}
          {opencodeOutput && (
            <pre style={{
              marginTop: '8px', padding: '8px', borderRadius: '4px',
              background: 'rgba(0,0,0,0.3)', color: '#CE93D8',
              fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'pre-wrap',
              maxHeight: '300px', overflow: 'auto'
            }}>
              {opencodeOutput}
            </pre>
          )}

          {/* Tip */}
          <div style={{ marginTop: '10px', padding: '8px', borderRadius: '4px', background: 'rgba(156,39,176,0.1)', border: '1px solid rgba(156,39,176,0.3)', fontSize: '10px', color: '#CE93D8' }}>
            💡 For best experience, use OpenCode Desktop App for coding tasks. Click "Launch" above to open it.
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: '10px', padding: '8px', borderRadius: '4px', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', color: '#f44336' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Install Instructions */}
      {!connected && (
        <div style={{ marginTop: '16px', padding: '10px', borderRadius: '8px', background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.3)' }}>
          <div style={{ fontWeight: 700, color: '#4FC3F7', marginBottom: '6px' }}>📦 Install Agent</div>
          <code style={{ fontSize: '10px', color: '#aaa' }}>
            npm install -g @cyberguard/agent<br/>
            cyberguard-agent start --port 3002
          </code>
        </div>
      )}
    </div>
  )
}
