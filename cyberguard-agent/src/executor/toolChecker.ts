import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function checkTool(tool: string): Promise<boolean> {
  try {
    const cmd = process.platform === 'win32'
      ? `where ${tool} 2>NUL`
      : `which ${tool} 2>/dev/null`
    await execAsync(cmd)
    return true
  } catch {
    return false
  }
}

export async function getToolVersion(tool: string): Promise<string | null> {
  try {
    const result = await execAsync(`${tool} --version`, { timeout: 5000 })
    return result.stdout.trim().split('\n')[0]
  } catch {
    return null
  }
}
