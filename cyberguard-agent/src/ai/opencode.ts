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

// Find OpenCode Desktop binary (supports AppImage)
async function findDesktopBinary(): Promise<string | null> {
  const possiblePaths = [
    // AppImage locations
    join(process.env.HOME || '', 'Downloads/opencode-desktop-linux-x86_64.AppImage'),
    join(process.env.HOME || '', '.cache/@opencode-aidesktop-updater/pending/opencode-desktop-linux-x86_64.AppImage'),
    join(process.env.HOME || '', '.local/bin/opencode-desktop.AppImage'),
    // Binary locations
    join(process.env.HOME || '', '.opencode/bin/opencode-desktop'),
    '/usr/local/bin/opencode-desktop',
    '/usr/bin/opencode-desktop',
    join(process.env.HOME || '', '.local/bin/opencode-desktop'),
  ]

  for (const p of possiblePaths) {
    if (existsSync(p)) return p
  }

  // Search for any AppImage file
  try {
    const { stdout } = await execAsync('find ~/Downloads ~/.cache ~/.local -name "opencode-desktop*.AppImage" -type f 2>/dev/null | head -1')
    if (stdout.trim()) return stdout.trim()
  } catch {}

  return null
}

// Check if OpenCode Desktop is running
async function isDesktopRunning(): Promise<boolean> {
  try {
    // Check for ai.opencode.desktop process (AppImage process name)
    const { stdout } = await execAsync('pgrep -f "ai.opencode.desktop|opencode-desktop" || true')
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

// Launch OpenCode Desktop
export async function launchDesktop(workDir?: string): Promise<{ success: boolean; error?: string; message?: string }> {
  const desktopPath = await findDesktopBinary()
  
  if (!desktopPath) {
    return { 
      success: false, 
      error: 'OpenCode Desktop not found',
      message: 'OpenCode Desktop is not installed. Install it from https://opencode.ai or download the AppImage.'
    }
  }

  // Check if already running
  const alreadyRunning = await isDesktopRunning()
  if (alreadyRunning) {
    return { 
      success: true, 
      message: 'OpenCode Desktop is already running!'
    }
  }

  // Try to launch Desktop app
  try {
    // Handle AppImage files
    let launchCmd: string
    if (desktopPath.endsWith('.AppImage')) {
      launchCmd = `nohup "${desktopPath}" --no-sandbox > /dev/null 2>&1 &`
    } else {
      launchCmd = `nohup "${desktopPath}" "${workDir || process.cwd()}" > /dev/null 2>&1 &`
    }
    
    await execAsync(launchCmd)
    
    // Wait a moment and check if it started
    await new Promise(resolve => setTimeout(resolve, 2000))
    const isRunning = await isDesktopRunning()
    
    if (isRunning) {
      return { success: true, message: 'OpenCode Desktop launched successfully!' }
    } else {
      return { 
        success: false, 
        error: 'Desktop app started but may have closed',
        message: 'OpenCode Desktop was launched but may have closed immediately. Try running it manually from your Applications menu.'
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// Run OpenCode via CLI using 'web' command (more reliable than 'run')
export async function runOpenCode(
  prompt: string,
  config: OpenCodeConfig = {}
): Promise<OpenCodeResult> {
  const binary = config.binaryPath || await findOpenCodeBinary()
  if (!binary) {
    return { success: false, output: '', error: 'OpenCode binary not found. Install: curl -fsSL https://opencode.ai/install | bash' }
  }

  const workDir = config.workDir || process.cwd()

  // Build the command - use 'run' with proper escaping
  const args: string[] = []
  
  if (config.model && config.provider) {
    args.push('--model', `${config.provider}/${config.model}`)
  } else if (config.model) {
    args.push('--model', config.model)
  }

  // Escape the prompt properly for shell
  const escapedPrompt = prompt.replace(/'/g, "'\\''")
  args.push('--dangerously-skip-permissions')
  
  const argsStr = args.join(' ')
  const cmd = `${binary} run ${argsStr} '${escapedPrompt}'`

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: workDir,
      timeout: 300000, // 5 minutes
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: '1' }
    })

    const output = stdout || stderr || ''
    return { success: true, output: output.trim() }
  } catch (err: any) {
    // If 'run' fails, suggest alternatives
    const errorMsg = err.message || ''
    
    if (errorMsg.includes('Session not found') || errorMsg.includes('not found')) {
      return {
        success: false,
        output: err.stdout || '',
        error: 'OpenCode CLI "run" command has issues in v1.15.10. Use "opencode web" or OpenCode Desktop instead.',
        session: 'Try: opencode web (opens web interface)'
      }
    }
    
    return {
      success: false,
      output: err.stdout || '',
      error: errorMsg || 'OpenCode execution failed. Try "opencode web" for a working alternative.'
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
  
  const args: string[] = []
  
  if (config.model && config.provider) {
    args.push('--model', `${config.provider}/${config.model}`)
  } else if (config.model) {
    args.push('--model', config.model)
  }

  const escapedPrompt = fullPrompt.replace(/'/g, "'\\''")
  args.push('--dangerously-skip-permissions')
  
  const argsStr = args.join(' ')
  const cmd = `${binary} run ${argsStr} '${escapedPrompt}'`

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
      error: err.message || 'OpenCode execution failed. Try "opencode web" for a working alternative.'
    }
  }
}

// Get OpenCode status
export async function getOpenCodeStatus(): Promise<{
  installed: boolean
  binary: string | null
  version: string | null
  desktopInstalled: boolean
  desktopRunning: boolean
  desktopPath: string | null
  providers: string[]
  recommendation: string
}> {
  const binary = await findOpenCodeBinary()
  const desktopBinary = await findDesktopBinary()
  let version = null
  const desktopRunning = await isDesktopRunning()

  if (binary) {
    try {
      const { stdout } = await execAsync(`${binary} --version`)
      version = stdout.trim()
    } catch {}
  }

  // Determine recommendation
  let recommendation = ''
  if (!binary) {
    recommendation = 'Install OpenCode: curl -fsSL https://opencode.ai/install | bash'
  } else if (!desktopBinary) {
    recommendation = 'OpenCode Desktop not installed. Use "opencode web" for web interface.'
  } else if (!desktopRunning) {
    recommendation = 'OpenCode Desktop is installed. Click "Launch OpenCode Desktop" to start it.'
  } else {
    recommendation = 'OpenCode is ready! You can use the Desktop app or CLI.'
  }

  return {
    installed: !!binary,
    binary,
    version,
    desktopInstalled: !!desktopBinary,
    desktopRunning,
    desktopPath: desktopBinary,
    providers: ['openai', 'anthropic', 'google', 'groq', 'ollama', 'openrouter'],
    recommendation
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
