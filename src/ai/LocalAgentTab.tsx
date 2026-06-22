import { useState, useEffect } from 'react'
import { useLocalAgentStore } from '../store/localAgentStore'
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

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const [inputUrl, setInputUrl] = useState(url || 'ws://localhost:3002')
  const [inputToken, setInputToken] = useState(token || '')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [selectedTool, setSelectedTool] = useState('semgrep')
  const [skillQuery, setSkillQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'scan' | 'skills' | 'installed' | 'execute'>('scan')
  const [executeCommand, setExecuteCommand] = useState('')
  const [executeResult, setExecuteResult] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [installingPkg, setInstallingPkg] = useState<string | null>(null)

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
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {(['scan', 'skills', 'installed', 'execute'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '6px', borderRadius: '4px', border: 'none',
              background: activeTab === tab ? '#4FC3F7' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#000' : '#888',
              fontWeight: 700, cursor: 'pointer', fontSize: '11px'
            }}
          >
            {tab === 'scan' ? '🔍 Scan' : tab === 'skills' ? '📦 Search' : tab === 'installed' ? '✅ Installed' : '⚡ Execute'}
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
          <div style={{ marginBottom: '8px', fontSize: '11px', color: '#888' }}>
            All skills installed globally on your system
          </div>
          {skills.length === 0 && (
            <button
              onClick={handleListInstalled}
              disabled={!connected}
              style={{
                width: '100%', padding: '8px', borderRadius: '4px', border: 'none',
                background: connected ? '#4CAF50' : '#444',
                color: '#fff', fontWeight: 700, cursor: connected ? 'pointer' : 'not-allowed', fontSize: '11px'
              }}
            >
              📦 Load Installed Skills
            </button>
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
