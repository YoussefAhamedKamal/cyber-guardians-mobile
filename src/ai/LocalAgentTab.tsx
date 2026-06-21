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
    connect, disconnect, scan, findSkills, installSkill, execute, parseFile
  } = useLocalAgentStore()

  const [inputUrl, setInputUrl] = useState('ws://localhost:3001')
  const [inputToken, setInputToken] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [selectedTool, setSelectedTool] = useState('semgrep')
  const [skillQuery, setSkillQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'scan' | 'skills' | 'execute'>('scan')

  const handleConnect = async () => {
    try {
      await connect(inputUrl, inputToken || undefined)
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`)
    }
  }

  const handleScan = async () => {
    if (!code.trim()) return
    await scan(selectedTool, code, language)
  }

  const handleFindSkills = async () => {
    if (!skillQuery.trim()) return
    await findSkills(skillQuery)
  }

  const handleInstallSkill = async (pkg: string) => {
    const success = await installSkill(pkg)
    if (success) alert(`Installed: ${pkg}`)
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
          placeholder="Agent URL (ws://localhost:3001)"
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
        {(['scan', 'skills', 'execute'] as const).map(tab => (
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
            {tab === 'scan' ? '🔍 Scan' : tab === 'skills' ? '📦 Skills' : '⚡ Execute'}
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
              placeholder="Search skills..."
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

          {skills.map((skill, i) => (
            <div key={i} style={{ padding: '8px', marginBottom: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontWeight: 700 }}>{skill.name}</div>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>{skill.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#888' }}>{skill.installs} installs</span>
                <button
                  onClick={() => handleInstallSkill(skill.name)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#4CAF50', color: '#fff', fontSize: '10px', cursor: 'pointer' }}
                >
                  Install
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execute Tab */}
      {activeTab === 'execute' && (
        <div>
          <textarea
            placeholder="Enter command to execute..."
            style={{ width: '100%', height: '80px', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button
            disabled={!connected}
            style={{
              width: '100%', padding: '8px', marginTop: '8px', borderRadius: '4px', border: 'none',
              background: !connected ? '#444' : 'linear-gradient(135deg,#4CAF50,#66BB6A)',
              color: '#fff', fontWeight: 700, cursor: !connected ? 'not-allowed' : 'pointer'
            }}
          >
            ⚡ Execute
          </button>
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
            cyberguard-agent start --port 3001
          </code>
        </div>
      )}
    </div>
  )
}
