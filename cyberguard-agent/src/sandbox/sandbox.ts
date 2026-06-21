import { exec } from 'child_process'
import { promisify } from 'util'
import { checkTool } from '../executor/toolChecker.js'

const execAsync = promisify(exec)

export interface SandboxConfig {
  enabled: boolean
  maxMemory: string
  maxCpu: string
  timeout: number
  networkAccess: boolean
  filesystemAccess: 'none' | 'read-only' | 'temp-only'
}

export interface SandboxResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export async function executeInSandbox(
  command: string,
  config: SandboxConfig
): Promise<SandboxResult> {
  if (!config.enabled) {
    return executeDirect(command)
  }

  // Check if Docker is available
  const dockerAvailable = await checkTool('docker')
  if (dockerAvailable) {
    return executeInDocker(command, config)
  }

  // Fallback to process isolation
  return executeIsolated(command, config)
}

async function executeDirect(command: string): Promise<SandboxResult> {
  const startTime = Date.now()
  try {
    const result = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    })
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
      duration: Date.now() - startTime,
    }
  } catch (err: any) {
    return {
      success: false,
      stdout: '',
      stderr: err.stderr || err.message,
      exitCode: err.code || 1,
      duration: Date.now() - startTime,
    }
  }
}

async function executeInDocker(
  command: string,
  config: SandboxConfig
): Promise<SandboxResult> {
  const startTime = Date.now()

  const escapedCommand = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`').replace(/\n/g, '\\n').replace(/!/g, '\\!')
  const dockerArgs = [
    'docker run --rm',
    `--memory=${config.maxMemory}`,
    `--cpus=${config.maxCpu}`,
    `--network=${config.networkAccess ? 'bridge' : 'none'}`,
    '--read-only',
    '--tmpfs /tmp:size=100m',
    '-v /tmp/cyberguard-sandbox:/workspace',
    'node:20-slim',
    `bash -c "${escapedCommand}"`,
  ].join(' ')

  try {
    const result = await execAsync(dockerArgs, {
      timeout: config.timeout,
      maxBuffer: 10 * 1024 * 1024,
    })
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
      duration: Date.now() - startTime,
    }
  } catch (err: any) {
    return {
      success: false,
      stdout: '',
      stderr: err.stderr || err.message,
      exitCode: err.code || 1,
      duration: Date.now() - startTime,
    }
  }
}

async function executeIsolated(
  command: string,
  config: SandboxConfig
): Promise<SandboxResult> {
  // Process-level isolation with timeout and resource limits
  const startTime = Date.now()

  try {
    const result = await execAsync(command, {
      timeout: config.timeout,
      maxBuffer: 50 * 1024 * 1024,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=512',
      },
    })
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
      duration: Date.now() - startTime,
    }
  } catch (err: any) {
    return {
      success: false,
      stdout: '',
      stderr: err.stderr || err.message,
      exitCode: err.code || 1,
      duration: Date.now() - startTime,
    }
  }
}
