import { exec } from 'child_process'
import { promisify } from 'util'
import { checkTool } from '../executor/toolChecker.js'

const execAsync = promisify(exec)

const TOOL_IMAGES: Record<string, string> = {
  semgrep: 'returntocorp/semgrep:latest',
  codeql: 'ghcr.io/github/codeql-cli:latest',
  slither: 'trailofbits/slither:latest',
  clang: 'silkeh/clang:latest',
  python: 'python:3.12-slim',
  node: 'node:20-slim',
}

export async function isDockerAvailable(): Promise<boolean> {
  return checkTool('docker')
}

export async function pullImage(image: string): Promise<void> {
  try {
    await execAsync(`docker image inspect ${image}`, { timeout: 10000 })
  } catch {
    await execAsync(`docker pull ${image}`, { timeout: 300000 })
  }
}

export async function executeInDocker(
  tool: string,
  command: string,
  options: {
    input?: string
    timeout?: number
    memory?: string
    cpu?: string
  } = {}
): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number }> {
  const image = TOOL_IMAGES[tool]
  if (!image) {
    throw new Error(`No Docker image available for tool: ${tool}`)
  }

  const available = await isDockerAvailable()
  if (!available) {
    throw new Error('Docker is not available')
  }

  await pullImage(image)

  const containerName = `cyberguard-${tool}-${Date.now()}`
  const timeout = options.timeout || 120000

  const escapedCommand = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`')
  const dockerArgs = [
    'docker run --rm',
    `--name ${containerName}`,
    `--memory=${options.memory || '1g'}`,
    `--cpus=${options.cpu || '1'}`,
    '--network none',
    '-v /tmp/cyberguard-input:/input:ro',
    '-v /tmp/cyberguard-output:/output',
    image,
    `bash -c "${escapedCommand}"`,
  ].join(' ')

  try {
    const result = await execAsync(dockerArgs, {
      timeout,
      maxBuffer: 50 * 1024 * 1024,
    })

    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
    }
  } catch (err: any) {
    return {
      success: false,
      stdout: '',
      stderr: err.stderr || err.message,
      exitCode: err.code || 1,
    }
  }
}
