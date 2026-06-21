export type CommandType = 'shell' | 'install' | 'config' | 'build' | 'test'

export interface ExtractedCommand {
  type: CommandType
  command: string
  description?: string
  alternatives?: string[]
  cwd?: string
}

export interface WorkflowStep {
  name: string
  command?: string
  tool?: string
  description: string
}

export interface Workflow {
  name: string
  steps: WorkflowStep[]
}

export interface SkillFrontmatter {
  name: string
  description: string
  tools: string[]
  model?: string
}

export interface SkillDefinition {
  frontmatter: SkillFrontmatter
  rawBody: string
  commands: ExtractedCommand[]
  workflows: Workflow[]
}

export interface InstallConfig {
  method: 'npm' | 'pip' | 'apt' | 'brew' | 'manual'
  packages: string[]
  commands: string[]
}

export interface ExecuteConfig {
  command: string
  args: string[]
  input: 'stdin' | 'file' | 'args'
  output: 'stdout' | 'file' | 'sarif'
}

export interface PluginDefinition {
  name: string
  description: string
  type: 'cli' | 'api' | 'hybrid'
  install: InstallConfig
  execute: ExecuteConfig
}

export interface ManifestFile {
  name: string
  type: 'makefile' | 'dockerfile' | 'requirements' | 'packagejson' | 'cargotoml' | 'shell' | 'unknown'
  commands: ExtractedCommand[]
}

export type FileType = 'skill' | 'plugin' | 'manifest' | 'unknown'

export interface ParseResult {
  type: FileType
  definition: SkillDefinition | PluginDefinition | ManifestFile
}
