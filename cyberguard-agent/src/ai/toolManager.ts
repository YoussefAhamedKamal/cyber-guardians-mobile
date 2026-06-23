import { log } from '../utils/logger.js'
import type { TaskDefinition, TaskResult, TaskStep, ToolName, ToolSettings, ToolStatus } from './types.js'

// Tool interface — each tool implements this
export interface Tool {
  name: ToolName
  isAvailable(): Promise<boolean>
  getVersion(): Promise<string | undefined>
  execute(task: TaskDefinition, settings: ToolSettings): Promise<TaskResult>
}

// Default fallback order
const FALLBACK_ORDER: ToolName[] = ['aider', 'cline', 'custom']

export class ToolManager {
  private tools: Map<ToolName, Tool> = new Map()
  private settings: ToolSettings = {
    selectedTool: null,
    autoFallback: true,
  }

  constructor() {}

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  async getToolStatus(): Promise<{ tools: ToolStatus[], selectedTool: ToolName | null, autoFallback: boolean }> {
    const statuses: ToolStatus[] = []

    for (const name of FALLBACK_ORDER) {
      const tool = this.tools.get(name)
      if (tool) {
        const installed = await tool.isAvailable()
        const version = installed ? await tool.getVersion() : undefined
        statuses.push({ name, available: installed, version, installed })
      }
    }

    return { tools: statuses, selectedTool: this.settings.selectedTool, autoFallback: this.settings.autoFallback }
  }

  updateSettings(settings: Partial<ToolSettings>): void {
    this.settings = { ...this.settings, ...settings }
    log(`Tool settings updated: selected=${this.settings.selectedTool}, fallback=${this.settings.autoFallback}`)
  }

  getSettings(): ToolSettings {
    return { ...this.settings }
  }

  // Get the execution order based on settings
  private getExecutionOrder(): ToolName[] {
    const order: ToolName[] = []

    if (this.settings.selectedTool) {
      order.push(this.settings.selectedTool)
    }

    for (const name of FALLBACK_ORDER) {
      if (!order.includes(name)) {
        order.push(name)
      }
    }

    return order
  }

  async execute(task: TaskDefinition): Promise<TaskResult> {
    const order = this.getExecutionOrder()
    const steps: TaskStep[] = []
    const startTime = Date.now()

    for (const toolName of order) {
      const tool = this.tools.get(toolName)
      if (!tool) continue

      const available = await tool.isAvailable()
      if (!available) {
        log(`Tool ${toolName} not available, skipping`)
        continue
      }

      log(`Executing task with ${toolName}`)
      const stepStart = Date.now()

      try {
        const result = await tool.execute(task, this.settings)
        const stepDuration = Date.now() - stepStart

        steps.push({
          tool: toolName,
          action: `execute:${task.type}`,
          input: task.goal,
          output: result.summary,
          success: result.success,
          duration: stepDuration,
        })

        if (result.success) {
          return {
            success: true,
            summary: result.summary,
            files: result.files,
            steps,
            tool: toolName,
          }
        }

        // If failed and autoFallback is off, don't try next tool
        if (!this.settings.autoFallback) {
          return {
            success: false,
            summary: result.summary || `Task failed with ${toolName}`,
            files: result.files,
            steps,
            tool: toolName,
          }
        }

        log(`Tool ${toolName} failed, trying next tool`)
      } catch (err: any) {
        const stepDuration = Date.now() - stepStart
        steps.push({
          tool: toolName,
          action: `execute:${task.type}`,
          input: task.goal,
          output: err.message,
          success: false,
          duration: stepDuration,
        })

        if (!this.settings.autoFallback) {
          return {
            success: false,
            summary: `Error with ${toolName}: ${err.message}`,
            steps,
            tool: toolName,
          }
        }

        log(`Tool ${toolName} error: ${err.message}, trying next tool`)
      }
    }

    const totalDuration = Date.now() - startTime
    return {
      success: false,
      summary: `All tools failed after ${totalDuration}ms`,
      steps,
      tool: order[0] || 'custom',
    }
  }
}
