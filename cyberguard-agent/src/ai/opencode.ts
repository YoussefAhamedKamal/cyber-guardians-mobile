import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

export interface OpenCodeConfig {
  binaryPath?: string
  workDir?: string
  model?: string
  provider?: string
}

export interface OpenCodeResult {
  success: boolean
  output: string
  error?: string
  session?: string
}

// Find OpenCode binary
async function findOpenCodeBinary(): Promise<string | null> {
  const possiblePaths = [
    join(process.env.HOME || '', '.opencode/bin/opencode'),
    '/usr/local/bin/opencode',
    '/usr/bin/opencode',
    join(process.env.HOME || '', '.local/bin/opencode'),
  ]

  for (const p of possiblePaths) {
    if (existsSync(p)) return p
  }

  try {
    const result = await execAsync('which opencode')
    if (result.stdout.trim()) return result.stdout.trim()
  } catch {}

  return null
}

// Check if OpenCode Desktop is running
async function isDesktopRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('pgrep -f "opencode.desktop" || true')
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

// Launch OpenCode Desktop
export async function launchDesktop(workDir?: string): Promise<{ success: boolean; error?: string }> {
  const desktopPath = join(process.env.HOME || '', '.opencode/bin/opencode-desktop')

  // Try to launch Desktop app
  try {
    const launchCmd = `nohup ${desktopPath} ${workDir || process.cwd()} > /dev/null 2>&1 &`
    await execAsync(launchCmd)
    return { success: true }
  } catch {}

  // Fallback: try to launch via xdg-open
  try {
    await execAsync(`xdg-open "opencode://open?path=${workDir || process.cwd()}"`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// Run OpenCode via CLI
export async function runOpenCode(
  prompt: string,
  config: OpenCodeConfig = {}
): Promise<OpenCodeResult> {
  const binary = config.binaryPath || await findOpenCodeBinary()
  if (!binary) {
    return { success: false, output: '', error: 'OpenCode binary not found. Install: curl -fsSL https://opencode.ai/install | bash' }
  }

  const workDir = config.workDir || process.cwd()
  const args = [prompt]

  if (config.model && config.provider) {
    args.push('--model', `${config.provider}/${config.model}`)
  } else if (config.model) {
    args.push('--model', config.model)
  }

  args.push('--dangerously-skip-permissions')

  const escapedArgs = args.map(a => {
    const escaped = a.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return `"${escaped}"`
  })
  const cmd = `${binary} run ${escapedArgs.join(' ')}`

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: workDir,
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: '1' }
    })

    const output = stdout || stderr || ''
    return { success: true, output: output.trim() }
  } catch (err: any) {
    const sessions = await listSessions(workDir)
    return {
      success: false,
      output: err.stdout || '',
      error: err.message || 'OpenCode execution failed. Use OpenCode Desktop for better experience.',
      session: sessions.length > 0 ? `${sessions.length} sessions available in Desktop` : undefined
    }
  }
}

// Run OpenCode with file context
export async function runOpenCodeWithFile(
  prompt: string,
  filePath: string,
  config: OpenCodeConfig = {}
): Promise<OpenCodeResult> {
  const binary = config.binaryPath || await findOpenCodeBinary()
  if (!binary) {
    return { success: false, output: '', error: 'OpenCode binary not found' }
  }

  const workDir = config.workDir || process.cwd()
  const fullPrompt = `In file ${filePath}:\n${prompt}`
  const args = [fullPrompt]

  if (config.model && config.provider) {
    args.push('--model', `${config.provider}/${config.model}`)
  } else if (config.model) {
    args.push('--model', config.model)
  }

  args.push('--dangerously-skip-permissions')

  const escapedArgs = args.map(a => {
    const escaped = a.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return `"${escaped}"`
  })
  const cmd = `${binary} run ${escapedArgs.join(' ')}`

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: workDir,
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: '1' }
    })

    return { success: true, output: (stdout || stderr || '').trim() }
  } catch (err: any) {
    return {
      success: false,
      output: err.stdout || '',
      error: err.message || 'OpenCode execution failed. Use OpenCode Desktop for better experience.'
    }
  }
}

// Get OpenCode status
export async function getOpenCodeStatus(): Promise<{
  installed: boolean
  binary: string | null
  version: string | null
  desktopRunning: boolean
  providers: string[]
}> {
  const binary = await findOpenCodeBinary()
  let version = null
  const desktopRunning = await isDesktopRunning()

  if (binary) {
    try {
      const { stdout } = await execAsync(`${binary} --version`)
      version = stdout.trim()
    } catch {}
  }

  return {
    installed: !!binary,
    binary,
    version,
    desktopRunning,
    providers: ['openai', 'anthropic', 'google', 'groq', 'ollama', 'openrouter']
  }
}

// List OpenCode sessions
export async function listSessions(workDir?: string): Promise<string[]> {
  const binary = await findOpenCodeBinary()
  if (!binary) return []

  try {
    const { stdout } = await execAsync(`${binary} session list --format json`, {
      cwd: workDir || process.cwd(),
      timeout: 10000
    })
    const data = JSON.parse(stdout)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
