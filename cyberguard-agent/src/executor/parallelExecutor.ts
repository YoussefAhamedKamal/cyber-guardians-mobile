import type { ExtractedCommand } from '../parser/types.js'
import { executeCommand, type CommandResult } from './commandExecutor.js'

export async function executeParallel(
  commands: ExtractedCommand[],
  maxConcurrency: number = 3,
  options: { timeout?: number; cwd?: string; verbose?: boolean } = {}
): Promise<CommandResult[]> {
  const results: CommandResult[] = []

  // Split into chunks
  const chunks: ExtractedCommand[][] = []
  for (let i = 0; i < commands.length; i += maxConcurrency) {
    chunks.push(commands.slice(i, i + maxConcurrency))
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(cmd => executeCommand(cmd, options))
    )

    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          success: false,
          command: '',
          stdout: '',
          stderr: result.reason?.message || 'Unknown error',
          exitCode: 1,
          duration: 0,
        })
      }
    }
  }

  return results
}
