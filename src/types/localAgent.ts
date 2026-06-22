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

export type AgentMessageType = 'scan' | 'install-skill' | 'execute' | 'find-skills' | 'install' | 'status' | 'tools' | 'parse-file'

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
