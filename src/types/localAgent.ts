export interface Tool {
  name: string
  description: string
}

export interface Skill {
  name: string
  description: string
  source: string
  installs: number
  path?: string
}

export interface ScanResult {
  success: boolean
  findings: Finding[]
  raw: string
  summary: string
  duration: number
}

export interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  file?: string
  line?: number
  rule?: string
  fix?: string
}

export interface CommandResult {
  success: boolean
  command: string
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export interface FileParseResult {
  type: 'skill' | 'plugin' | 'manifest' | 'unknown'
  definition: any
}

export interface AgentStatus {
  platform: string
  arch: string
  shell: string
  packageManagers: string[]
}

export interface AIProviderInfo {
  name: string
  type: 'cloud' | 'local'
  models: string[]
  available: boolean
}

export interface AIProvidersResult {
  providers: AIProviderInfo[]
  active: { provider: string; model: string }
}

export interface AIChatResult {
  content: string
  model: string
  provider: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

export interface FileOperationResult {
  success: boolean
  operation: string
  path: string
  content?: string
  files?: string[]
  error?: string
}

export interface GrepResult {
  file: string
  line: number
  content: string
}

export interface OpenCodeStatus {
  installed: boolean
  binary: string | null
  version: string | null
  desktopInstalled: boolean
  desktopRunning: boolean
  desktopPath: string | null
  providers: string[]
  recommendation: string
}

export interface OpenCodeResult {
  success: boolean
  output: string
  error?: string
  session?: string
}

export type AgentMessageType = 'scan' | 'install-skill' | 'execute' | 'find-skills' | 'install' | 'status' | 'tools' | 'parse-file' | 'list-installs' | 'ai-chat' | 'file-op' | 'grep' | 'ai-providers' | 'task' | 'tool-status' | 'tool-settings'

export interface AgentMessage {
  id: string
  type: AgentMessageType
  payload: any
}

export interface AgentResponse {
  id: string
  status: 'processing' | 'complete' | 'error'
  progress?: number
  result?: any
  error?: string
}

// ─── Multi-Tool System Types ───────────────────────────────────────

export type ToolName = 'aider' | 'cline' | 'custom'

export interface TaskDefinition {
  goal: string
  context?: string
  type: string
  files?: string[]
}

export interface TaskStep {
  tool: ToolName
  action: string
  input?: string
  output?: string
  success: boolean
  duration: number
}

export interface TaskResult {
  success: boolean
  summary: string
  files?: string[]
  steps: TaskStep[]
  tool: ToolName
}

export interface ToolStatus {
  name: ToolName
  available: boolean
  version?: string
  installed: boolean
}

export interface ToolSettings {
  selectedTool: ToolName | null
  autoFallback: boolean
  aiderPath?: string
  clinePath?: string
  aiderModel?: string
  clineModel?: string
  customProvider?: string
}

export interface ToolStatusResult {
  tools: ToolStatus[]
  selectedTool: ToolName | null
  autoFallback: boolean
}
