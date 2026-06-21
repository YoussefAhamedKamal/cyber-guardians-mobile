import { executeCommand } from '../executor/commandExecutor.js'
import { checkTool } from '../executor/toolChecker.js'

export interface SkillInfo {
  name: string
  description: string
  source: string
  installs: number
  version?: string
}

export async function findSkills(query: string): Promise<SkillInfo[]> {
  // Ensure npx is available
  const npxAvailable = await checkTool('npx')
  if (!npxAvailable) {
    return []
  }

  const result = await executeCommand({
    type: 'shell',
    command: `npx skills find ${query} --json 2>/dev/null || npx skills find ${query}`,
  }, { timeout: 30000 })

  if (result.success) {
    return parseSkillsOutput(result.stdout)
  }

  return []
}

export async function installSkill(packageName: string): Promise<boolean> {
  const npxAvailable = await checkTool('npx')
  if (!npxAvailable) {
    return false
  }

  const result = await executeCommand({
    type: 'install',
    command: `npx skills add ${packageName} -g -y`,
  }, { timeout: 120000 })

  return result.success
}

export async function updateSkills(): Promise<boolean> {
  const npxAvailable = await checkTool('npx')
  if (!npxAvailable) {
    return false
  }

  const result = await executeCommand({
    type: 'shell',
    command: 'npx skills update',
  }, { timeout: 120000 })

  return result.success
}

export async function listInstalledSkills(): Promise<SkillInfo[]> {
  const npxAvailable = await checkTool('npx')
  if (!npxAvailable) {
    return []
  }

  const result = await executeCommand({
    type: 'shell',
    command: 'npx skills list --json 2>/dev/null || npx skills list',
  }, { timeout: 30000 })

  if (result.success) {
    return parseSkillsOutput(result.stdout)
  }

  return []
}

function parseSkillsOutput(output: string): SkillInfo[] {
  const skills: SkillInfo[] = []

  // Try JSON parse first
  try {
    const json = JSON.parse(output)
    if (Array.isArray(json)) {
      return json.map((item: any) => ({
        name: item.name || item.package || '',
        description: item.description || '',
        source: item.source || item.repository || '',
        installs: item.installs || item.downloads || 0,
        version: item.version,
      }))
    }
  } catch {
    // Parse text output
  }

  // Parse line-by-line output
  const lines = output.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('Name')) continue

    // Try to match patterns like "package-name — description (123 installs)"
    const match = trimmed.match(/^(\S+)\s*[—–-]\s*(.+?)(?:\s*\((\d+)\s*installs?\))?\s*$/)
    if (match) {
      skills.push({
        name: match[1],
        description: match[2].trim(),
        source: '',
        installs: parseInt(match[3] || '0'),
      })
    }
  }

  return skills
}
