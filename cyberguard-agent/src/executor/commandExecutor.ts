import { exec } from 'child_process'
import { promisify } from 'util'
import type { ExtractedCommand } from '../parser/types.js'
import { translateCommand } from '../platform/commandTranslator.js'
import { createTempDir, cleanupTempDir } from '../platform/pathResolver.js'
import { checkTool } from './toolChecker.js'
import { installTool } from './packageInstaller.js'
import { resolveAlternative } from './alternativesResolver.js'

const execAsync = promisify(exec)

export interface CommandResult {
  success: boolean
  command: string
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export async function executeCommand(
  cmd: ExtractedCommand,
  options: { timeout?: number; cwd?: string; verbose?: boolean } = {}
): Promise<CommandResult> {
  const { timeout = 60000, cwd, verbose = false } = options
  const startTime = Date.now()

  // Ensure required tools are installed
  const toolMatch = cmd.command.match(/^(\S+)/)
  const tool = toolMatch ? toolMatch[1].split('/').pop()! : cmd.command
  const installed = await checkTool(tool)
  if (!installed) {
    if (verbose) console.log(`Tool not found: ${tool}, attempting to install...`)
    const installedNow = await installTool(tool)
    if (!installedNow) {
      return {
        success: false,
        command: cmd.command,
        stdout: '',
        stderr: `Tool not available: ${tool}`,
        exitCode: 1,
        duration: Date.now() - startTime,
      }
    }
  }

  // Try executing the command
  try {
    const translated = translateCommand(cmd.command)
    const result = await execAsync(translated, {
      timeout,
      cwd,
      maxBuffer: 10 * 1024 * 1024,
    })

    return {
      success: true,
      command: cmd.command,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
      duration: Date.now() - startTime,
    }
  } catch (err: any) {
    if (verbose) console.log(`Command failed: ${cmd.command}, trying alternatives...`)

    // Try alternatives
    if (cmd.alternatives?.length) {
      for (const alt of cmd.alternatives) {
        try {
          const translated = translateCommand(alt)
          const result = await execAsync(translated, {
            timeout,
            cwd,
            maxBuffer: 10 * 1024 * 1024,
          })

          return {
            success: true,
            command: alt,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: 0,
            duration: Date.now() - startTime,
          }
        } catch {
          continue
        }
      }
    }

    // Try auto-resolved alternative
    const autoAlt = resolveAlternative(cmd.command)
    if (autoAlt) {
      try {
        const translated = translateCommand(autoAlt)
        const result = await execAsync(translated, {
          timeout,
          cwd,
          maxBuffer: 10 * 1024 * 1024,
        })

        return {
          success: true,
          command: autoAlt,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: 0,
          duration: Date.now() - startTime,
        }
      } catch {
        // Fall through
      }
    }

    return {
      success: false,
      command: cmd.command,
      stdout: '',
      stderr: err.stderr || err.message || 'Unknown error',
      exitCode: err.code || 1,
      duration: Date.now() - startTime,
    }
  }
}

export async function executeCommands(
  commands: ExtractedCommand[],
  options: { timeout?: number; cwd?: string; verbose?: boolean; parallel?: boolean } = {}
): Promise<CommandResult[]> {
  const { parallel = false, ...execOptions } = options

  if (parallel) {
    const results = await Promise.allSettled(
      commands.map(cmd => executeCommand(cmd, execOptions))
    )
    return results.map(r => r.status === 'fulfilled' ? r.value : {
      success: false,
      command: '',
      stdout: '',
      stderr: r.reason?.message || 'Unknown error',
      exitCode: 1,
      duration: 0,
    })
  }

  const results: CommandResult[] = []
  for (const cmd of commands) {
    const result = await executeCommand(cmd, execOptions)
    results.push(result)
    if (!result.success) break
  }

  return results
}
