import type { PluginDefinition, InstallConfig, ExecuteConfig } from './types.js'

interface PluginJson {
  name?: string
  description?: string
  type?: string
  install?: {
    method?: string
    packages?: string[]
    commands?: string[]
  }
  execute?: {
    command?: string
    args?: string[]
    input?: string
    output?: string
  }
}

export function parsePluginJson(content: string): PluginDefinition {
  const json: PluginJson = JSON.parse(content)

  const install: InstallConfig = {
    method: (json.install?.method as InstallConfig['method']) || 'npm',
    packages: json.install?.packages || [],
    commands: json.install?.commands || [],
  }

  const execute: ExecuteConfig = {
    command: json.execute?.command || '',
    args: json.execute?.args || [],
    input: (json.execute?.input as ExecuteConfig['input']) || 'args',
    output: (json.execute?.output as ExecuteConfig['output']) || 'stdout',
  }

  return {
    name: json.name || 'unknown-plugin',
    description: json.description || '',
    type: (json.type as PluginDefinition['type']) || 'cli',
    install,
    execute,
  }
}
