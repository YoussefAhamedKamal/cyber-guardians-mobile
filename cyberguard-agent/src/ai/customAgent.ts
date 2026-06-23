import { log } from '../utils/logger.js'
import { aiManager, type AIMessage } from './providers.js'
import { executeFileOp } from './fileOps.js'
import type { Tool } from './toolManager.js'
import type { TaskDefinition, TaskResult, ToolSettings } from './types.js'

// Custom agent: uses AI providers directly (no external CLI)
// Always available — acts as final fallback
export class CustomAgent implements Tool {
  name = 'custom' as const

  async isAvailable(): Promise<boolean> {
    return true // Always available
  }

  async getVersion(): Promise<string | undefined> {
    return '1.0.0'
  }

  async execute(task: TaskDefinition, settings: ToolSettings): Promise<TaskResult> {
    const startTime = Date.now()
    log(`Custom Agent: executing task — ${task.goal}`)

    try {
      // Build system prompt for the task
      const systemPrompt = this.buildSystemPrompt(task)
      const userMessage = this.buildUserMessage(task)

      // Send to AI provider
      const aiResponse = await aiManager.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ])

      // Parse the AI response to extract actions
      const actions = this.parseActions(aiResponse.content, task)

      // Execute file operations if needed
      const files: string[] = []
      for (const action of actions) {
        try {
          const result = await executeFileOp({ type: action.operation as any, path: action.path || '', content: action.content })
          if (result.success && action.path) {
            files.push(action.path)
          }
        } catch (err: any) {
          log(`File operation failed: ${err.message}`)
        }
      }

      return {
        success: true,
        summary: aiResponse.content,
        files,
        steps: [],
        tool: 'custom',
      }
    } catch (err: any) {
      return {
        success: false,
        summary: `Custom Agent error: ${err.message}`,
        steps: [],
        tool: 'custom',
      }
    }
  }

  private buildSystemPrompt(task: TaskDefinition): string {
    return `You are a helpful coding assistant. You help users accomplish software engineering tasks.

Task type: ${task.type}
${task.context ? `Context: ${task.context}` : ''}

When the task involves creating or modifying files, output JSON actions in this format:
[{"operation": "write|mkdir", "path": "/path/to/file", "content": "file content"}]

When the task is analytical (explanation, review, analysis), just provide a clear response in Arabic.

Always respond in Arabic unless the task is specifically about English content.`
  }

  private buildUserMessage(task: TaskDefinition): string {
    let message = task.goal
    if (task.files && task.files.length > 0) {
      message += `\n\nFiles involved: ${task.files.join(', ')}`
    }
    return message
  }

  private parseActions(content: string, task: TaskDefinition): Array<{ operation: string; path?: string; content?: string }> {
    const actions: Array<{ operation: string; path?: string; content?: string }> = []

    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\[[\s\S]*?\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.operation && item.path) {
              actions.push({
                operation: item.operation,
                path: item.path,
                content: item.content,
              })
            }
          }
        }
      }
    } catch {
      // No valid JSON found — that's fine for analytical tasks
    }

    return actions
  }
}
