import { execFile } from 'child_process'
import { promisify } from 'util'
import { log } from '../utils/logger.js'
import type { Tool } from './toolManager.js'
import type { TaskDefinition, TaskResult, ToolSettings } from './types.js'

const execFileAsync = promisify(execFile)

export class ClineTool implements Tool {
  name = 'cline' as const

  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync('npx', ['cline', '--version'], {
        timeout: 15000,
        env: { ...process.env },
      })
      return stdout.trim().length > 0
    } catch {
      return false
    }
  }

  async getVersion(): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync('npx', ['cline', '--version'], {
        timeout: 15000,
        env: { ...process.env },
      })
      return stdout.trim() || undefined
    } catch {
      return undefined
    }
  }

  async execute(task: TaskDefinition, settings: ToolSettings): Promise<TaskResult> {
    const startTime = Date.now()
    log(`Cline: executing task — ${task.goal}`)

    const args = this.buildArgs(task, settings)

    try {
      const { stdout, stderr } = await execFileAsync('npx', ['cline', ...args], {
        timeout: 300_000, // 5 minutes
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd(),
        env: { ...process.env },
      })

      const output = stdout + (stderr ? '\n' + stderr : '')
      const files = this.extractFiles(output)

      return {
        success: true,
        summary: output.trim() || 'Task completed with Cline',
        files,
        steps: [],
        tool: 'cline',
      }
    } catch (err: any) {
      return {
        success: false,
        summary: `Cline error: ${err.message}`,
        steps: [],
        tool: 'cline',
      }
    }
  }

  private buildArgs(task: TaskDefinition, settings: ToolSettings): string[] {
    const args: string[] = []

    // Message
    args.push('--message', task.goal)

    // Model
    if (settings.clineModel) {
      args.push('--model', settings.clineModel)
    }

    // Auto-approve
    args.push('--auto-approve')

    // Files as context
    if (task.files && task.files.length > 0) {
      args.push('--files', task.files.join(','))
    }

    return args
  }

  private extractFiles(output: string): string[] {
    const files: string[] = []
    const lines = output.split('\n')
    for (const line of lines) {
      const match = line.match(/(?:created|modified|updated)\s+(.+)/i)
      if (match) {
        files.push(match[1].trim())
      }
    }
    return [...new Set(files)]
  }
}
