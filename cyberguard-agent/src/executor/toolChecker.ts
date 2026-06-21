import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

function sanitizeToolName(tool: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(tool)) {
    throw new Error(`Invalid tool name: ${tool}`)
  }
  return tool
}

export async function checkTool(tool: string): Promise<boolean> {
  try {
    const safeTool = sanitizeToolName(tool)
    const cmd = process.platform === 'win32'
      ? `where ${safeTool} 2>NUL`
      : `which ${safeTool} 2>/dev/null`
    await execAsync(cmd)
    return true
  } catch {
    return false
  }
}

export async function getToolVersion(tool: string): Promise<string | null> {
  try {
    const safeTool = sanitizeToolName(tool)
    const result = await execAsync(`${safeTool} --version`, { timeout: 5000 })
    return result.stdout.trim().split('\n')[0]
  } catch {
    return null
  }
}
