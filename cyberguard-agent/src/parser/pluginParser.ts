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
  let json: PluginJson
  try {
    json = JSON.parse(content)
  } catch (e) {
    throw new Error(`Failed to parse plugin JSON: ${e instanceof Error ? e.message : String(e)}`)
  }

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
