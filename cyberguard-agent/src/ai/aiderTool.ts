import { execFile } from 'child_process'
import { promisify } from 'util'
import { log } from '../utils/logger.js'
import type { Tool } from './toolManager.js'
import type { TaskDefinition, TaskResult, ToolSettings } from './types.js'

const execFileAsync = promisify(execFile)

export class AiderTool implements Tool {
  name = 'aider' as const

  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync('aider', ['--version'], { timeout: 5000 })
      return stdout.trim().length > 0
    } catch {
      return false
    }
  }

  async getVersion(): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync('aider', ['--version'], { timeout: 5000 })
      return stdout.trim() || undefined
    } catch {
      return undefined
    }
  }

  async execute(task: TaskDefinition, settings: ToolSettings): Promise<TaskResult> {
    const startTime = Date.now()
    log(`Aider: executing task — ${task.goal}`)

    const args = this.buildArgs(task, settings)

    try {
      const { stdout, stderr } = await execFileAsync('aider', args, {
        timeout: 300_000, // 5 minutes
        maxBuffer: 10 * 1024 * 1024, // 10MB
        cwd: process.cwd(),
      })

      const output = stdout + (stderr ? '\n' + stderr : '')
      const files = this.extractFiles(output)

      return {
        success: true,
        summary: output.trim() || 'Task completed with Aider',
        files,
        steps: [],
        tool: 'aider',
      }
    } catch (err: any) {
      return {
        success: false,
        summary: `Aider error: ${err.message}`,
        steps: [],
        tool: 'aider',
      }
    }
  }

  private buildArgs(task: TaskDefinition, settings: ToolSettings): string[] {
    const args: string[] = []

    // Model
    if (settings.aiderModel) {
      args.push('--model', settings.aiderModel)
    }

    // Message (goal)
    args.push('--message', task.goal)

    // Files
    if (task.files && task.files.length > 0) {
      args.push(...task.files)
    }

    // Auto-accept
    args.push('--yes-always')

    return args
  }

  private extractFiles(output: string): string[] {
    const files: string[] = []
    const lines = output.split('\n')
    for (const line of lines) {
      const match = line.match(/(?:edited|created|updated)\s+(.+)/i)
      if (match) {
        files.push(match[1].trim())
      }
    }
    return [...new Set(files)]
  }
}
