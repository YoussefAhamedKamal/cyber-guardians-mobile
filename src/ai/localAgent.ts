import type {
  AgentMessage,
  AgentResponse,
  ScanResult,
  Skill,
  CommandResult,
  FileParseResult,
  AgentStatus,
  AIProvidersResult,
  AIChatResult,
  FileOperationResult,
  GrepResult,
  OpenCodeStatus,
  OpenCodeResult
} from '../types/localAgent'

let ws: WebSocket | null = null
let messageId = 0
const pendingMessages: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map()
let onDisconnect: (() => void) | null = null

export function setOnDisconnect(cb: (() => void) | null) {
  onDisconnect = cb
}

export async function connectToAgent(url: string, token?: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const wsUrl = token ? `${url}?token=${token}` : url

    if (ws) {
      ws.onclose = null
      ws.onerror = null
      ws.onmessage = null
      ws.close()
      ws = null
    }

    pendingMessages.forEach((pending) => {
      pending.reject(new Error('Connection reset'))
    })
    pendingMessages.clear()

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('Connected to CyberGuard Agent')
      resolve(true)
    }

    ws.onerror = (err) => {
      console.error('Agent connection error:', err)
      reject(err)
    }

    ws.onclose = () => {
      console.log('Agent disconnected')
      ws = null
      pendingMessages.forEach((pending) => {
        pending.reject(new Error('Connection closed'))
      })
      pendingMessages.clear()
      onDisconnect?.()
    }

    ws.onmessage = (event) => {
      try {
        const response: AgentResponse = JSON.parse(event.data)
        const pending = pendingMessages.get(response.id)
        if (pending) {
          if (response.status === 'error') {
            pendingMessages.delete(response.id)
            pending.reject(new Error(response.error || 'Unknown error'))
          } else if (response.status === 'complete') {
            pendingMessages.delete(response.id)
            pending.resolve(response.result)
          }
          // 'processing' status — keep waiting
        }
      } catch (err) {
        console.error('Failed to parse agent response:', err)
      }
    }
  })
}

export function disconnectFromAgent(): void {
  if (ws) {
    ws.close()
    ws = null
  }
}

export function isAgentConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN
}

const VALID_MESSAGE_TYPES = new Set([
  'status', 'tools', 'scan', 'parse-file', 'execute', 'find-skills', 'install-skill', 'list-installs',
  'ai-chat', 'ai-providers', 'file-op', 'grep', 'opencode', 'opencode-status', 'opencode-sessions', 'opencode-launch'
])

async function sendMessage(type: string, payload: any, timeout: number = 60000): Promise<any> {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    if (isAgentConnected()) {
      // ws exists and is open per check, retry after brief delay
      await new Promise(r => setTimeout(r, 100))
    }
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('Agent not connected')
    }
  }

  if (!VALID_MESSAGE_TYPES.has(type)) {
    throw new Error(`Invalid message type: ${type}`)
  }

  const id = `msg-${++messageId}`
  const message: AgentMessage = { id, type: type as any, payload }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingMessages.delete(id)
      reject(new Error('Request timeout'))
    }, timeout)

    pendingMessages.set(id, {
      resolve: (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      reject: (err) => {
        clearTimeout(timer)
        reject(err)
      },
    })

    ws!.send(JSON.stringify(message))
  })
}

export async function getAgentStatus(): Promise<AgentStatus> {
  return sendMessage('status', {})
}

export async function getAgentTools(): Promise<{ name: string; description: string }[]> {
  const result = await sendMessage('tools', {})
  return result?.tools || []
}

export async function scanWithTool(
  tool: string,
  code: string,
  language: string,
  options?: Record<string, any>
): Promise<ScanResult> {
  return sendMessage('scan', { tool, code, language, options })
}

export async function parseSkillFile(content: string, filename: string): Promise<FileParseResult> {
  return sendMessage('parse-file', { content, filename })
}

export async function executeCommand(command: string, alternatives?: string[]): Promise<CommandResult> {
  return sendMessage('execute', { command, alternatives })
}

export async function findSkills(query: string): Promise<Skill[]> {
  return sendMessage('find-skills', { query })
}

export async function installSkillAgent(packageName: string): Promise<boolean> {
  const result = await sendMessage('install-skill', { packageName }, 180000)
  if (!result) return false
  return result.success
}

export async function listInstalledSkills(): Promise<Skill[]> {
  return sendMessage('list-installs', {})
}

export async function aiChat(messages: { role: string; content: string }[], options?: { provider?: string; model?: string; temperature?: number; maxTokens?: number }): Promise<AIChatResult> {
  return sendMessage('ai-chat', { messages, ...options })
}

export async function getAIProviders(): Promise<AIProvidersResult> {
  return sendMessage('ai-providers', {})
}

export async function fileOp(operation: string, path: string, content?: string, pattern?: string, recursive?: boolean): Promise<FileOperationResult> {
  return sendMessage('file-op', { operation, path, content, pattern, recursive })
}

export async function grepSearch(dir: string, query: string, include?: string): Promise<GrepResult[]> {
  return sendMessage('grep', { dir, query, include })
}

// OpenCode functions
export async function runOpenCodeAgent(prompt: string, options?: { model?: string; provider?: string; filePath?: string }): Promise<OpenCodeResult> {
  return sendMessage('opencode', { prompt, ...options }, 300000) // 5 minutes for OpenCode
}

export async function getOpenCodeStatus(): Promise<OpenCodeStatus> {
  return sendMessage('opencode-status', {})
}

export async function listOpenCodeSessions(): Promise<string[]> {
  return sendMessage('opencode-sessions', {})
}

export async function launchOpenCodeDesktop(workDir?: string): Promise<{ success: boolean; error?: string; message?: string }> {
  return sendMessage('opencode-launch', { workDir })
}
