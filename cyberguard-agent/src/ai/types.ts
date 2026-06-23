// Re-export types for internal use
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

export interface ToolSettings {
  selectedTool: ToolName | null
  autoFallback: boolean
  aiderPath?: string
  clinePath?: string
  aiderModel?: string
  clineModel?: string
  customProvider?: string
}

export interface ToolStatus {
  name: ToolName
  available: boolean
  version?: string
  installed: boolean
}
