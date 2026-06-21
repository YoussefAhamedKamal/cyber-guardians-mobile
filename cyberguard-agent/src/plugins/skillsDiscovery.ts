import { executeCommand } from '../executor/commandExecutor.js'
import { checkTool } from '../executor/toolChecker.js'

export interface SkillInfo {
  name: string
  description: string
  source: string
  installs: number
  version?: string
}

// Strip ANSI escape codes from terminal output
function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1B\][^\x07]*\x07/g, '')
}

export async function findSkills(query: string): Promise<SkillInfo[]> {
  // Ensure npx is available
  const npxAvailable = await checkTool('npx')
  if (!npxAvailable) {
    return []
  }

  const result = await executeCommand({
    type: 'shell',
    command: `npx skills find ${query} --json 2>/dev/null`,
  }, { timeout: 30000 })

  if (!result.success) {
    const fallback = await executeCommand({
      type: 'shell',
      command: `npx skills find ${query}`,
    }, { timeout: 30000 })
    if (fallback.success) {
      return parseSkillsOutput(fallback.stdout)
    }
    return []
  }

  return parseSkillsOutput(result.stdout)
}

export async function installSkill(packageName: string): Promise<boolean> {
  // Strip ANSI codes and sanitize
  const cleaned = stripAnsi(packageName)
  const sanitized = cleaned.replace(/[^a-zA-Z0-9._@\/\-:]/g, '')
  if (!sanitized) {
    throw new Error(`Invalid package name: ${packageName}`)
  }

  const npxAvailable = await checkTool('npx')
  if (!npxAvailable) {
    throw new Error('npx is not available')
  }

  const result = await executeCommand({
    type: 'install',
    command: `npx skills add "${sanitized}" -g -y`,
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

  // Strip ANSI codes first
  const clean = stripAnsi(output)

  // Try JSON parse first
  try {
    const json = JSON.parse(clean)
    if (Array.isArray(json)) {
      return json.map((item: any) => ({
        name: stripAnsi(item.name || item.package || ''),
        description: stripAnsi(item.description || ''),
        source: item.source || item.repository || '',
        installs: item.installs || item.downloads || 0,
        version: item.version,
      }))
    }
  } catch {
    // Parse text output
  }

  // Parse line-by-line output
  const lines = clean.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('Name')) continue

    // Try to match patterns like "package-name — description (123 installs)"
    const match = trimmed.match(/^(\S+)\s*[—–-]\s*(.+?)(?:\s*\((\d+)\s*installs?\))?\s*$/)
    if (match) {
      skills.push({
        name: stripAnsi(match[1]),
        description: stripAnsi(match[2].trim()),
        source: '',
        installs: parseInt(match[3] || '0'),
      })
    }
  }

  return skills
}
