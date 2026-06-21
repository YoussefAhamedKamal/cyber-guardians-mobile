import { executeCommand } from '../executor/commandExecutor.js'
import { checkTool } from '../executor/toolChecker.js'
import { installTool } from '../executor/packageInstaller.js'
import { createTempDir, cleanupTempDir } from '../platform/pathResolver.js'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import type { PluginResult, Finding } from './semgrep.js'

export async function runSlither(
  code: string,
  language: string = 'solidity'
): Promise<PluginResult> {
  // Slither requires Python
  let installed = await checkTool('slither')
  if (!installed) {
    installed = await installTool('slither')
  }
  if (!installed) {
    // Try pip install
    const pipResult = await executeCommand({
      type: 'install',
      command: 'pip install slither-analyzer',
    }, { timeout: 120000 })

    if (!pipResult.success) {
      return {
        success: false,
        findings: [],
        raw: '',
        summary: 'Slither is not available. Please install it: pip install slither-analyzer',
        duration: 0,
      }
    }
  }

  const tempDir = createTempDir('slither')
  const filename = 'contract.sol'
  await writeFile(join(tempDir, filename), code)

  try {
    const result = await executeCommand({
      type: 'shell',
      command: `slither ${tempDir} --json -`,
    }, { timeout: 120000 })

    if (result.success || result.stdout) {
      try {
        const output = JSON.parse(result.stdout || result.stderr)
        const findings = parseSlitherFindings(output)

        return {
          success: true,
          findings,
          raw: result.stdout || result.stderr,
          summary: `Found ${findings.length} issues in Solidity contract`,
          duration: result.duration,
        }
      } catch {
        return {
          success: false,
          findings: [],
          raw: result.stdout || result.stderr,
          summary: 'Slither analysis failed: could not parse JSON output',
          duration: result.duration,
        }
      }
    }

    return {
      success: false,
      findings: [],
      raw: result.stderr,
      summary: `Slither analysis failed: ${result.stderr.slice(0, 200)}`,
      duration: result.duration,
    }
  } finally {
    cleanupTempDir(tempDir)
  }
}

function parseSlitherFindings(output: any): Finding[] {
  const findings: Finding[] = []

  if (!output?.results?.detectors) return findings

  for (const detector of output.results.detectors) {
    findings.push({
      severity: mapSlitherSeverity(detector.impact),
      message: detector.description || detector.check,
      file: detector.positions?.[0]?.source_mapping?.filename?.relative,
      line: detector.positions?.[0]?.source_mapping?.lines?.[0],
      rule: detector.check,
      fix: detector.more_info,
    })
  }

  return findings
}

function mapSlitherSeverity(impact: string): Finding['severity'] {
  switch (impact?.toLowerCase()) {
    case 'high': return 'critical'
    case 'medium': return 'high'
    case 'low': return 'medium'
    case 'informational': return 'info'
    default: return 'medium'
  }
}
