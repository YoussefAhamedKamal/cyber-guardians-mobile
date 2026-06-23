import { log } from '../utils/logger.js'
import { ToolManager, type Tool } from './toolManager.js'
import { AiderTool } from './aiderTool.js'
import { ClineTool } from './clineTool.js'
import { CustomAgent } from './customAgent.js'
import type { TaskDefinition, TaskResult, ToolName, ToolSettings } from './types.js'

// Singleton instance
let taskExecutor: TaskExecutor | null = null

export class TaskExecutor {
  private toolManager: ToolManager

  constructor() {
    this.toolManager = new ToolManager()
    this.registerTools()
  }

  private registerTools(): void {
    const tools: Tool[] = [
      new AiderTool(),
      new ClineTool(),
      new CustomAgent(),
    ]

    for (const tool of tools) {
      this.toolManager.registerTool(tool)
      log(`Registered tool: ${tool.name}`)
    }
  }

  async getToolStatus() {
    return this.toolManager.getToolStatus()
  }

  updateSettings(settings: Partial<ToolSettings>): void {
    this.toolManager.updateSettings(settings)
  }

  getSettings(): ToolSettings {
    return this.toolManager.getSettings()
  }

  async executeTask(task: TaskDefinition): Promise<TaskResult> {
    log(`Executing task: ${task.goal} (type: ${task.type})`)
    const result = await this.toolManager.execute(task)
    log(`Task result: success=${result.success}, tool=${result.tool}, files=${result.files?.length || 0}`)
    return result
  }
}

export function getTaskExecutor(): TaskExecutor {
  if (!taskExecutor) {
    taskExecutor = new TaskExecutor()
  }
  return taskExecutor
}
