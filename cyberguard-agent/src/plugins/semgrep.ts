import { executeCommand } from '../executor/commandExecutor.js'
import { checkTool } from '../executor/toolChecker.js'
import { installTool } from '../executor/packageInstaller.js'
import { createTempDir, cleanupTempDir } from '../platform/pathResolver.js'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export interface PluginResult {
  success: boolean
  findings: Finding[]
  raw: string
  summary: string
  duration: number
}

export interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  file?: string
  line?: number
  rule?: string
  fix?: string
}

export async function runSemgrep(
  code: string,
  language: string,
  mode: 'all' | 'important' = 'all'
): Promise<PluginResult> {
  // Ensure semgrep is installed
  let installed = await checkTool('semgrep')
  if (!installed) {
    installed = await installTool('semgrep')
  }
  if (!installed) {
    return {
      success: false,
      findings: [],
      raw: '',
      summary: 'Semgrep is not available. Please install it manually: pip install semgrep',
      duration: 0,
    }
  }

  // Create temp directory and write code
  const tempDir = createTempDir('semgrep')
  const ext = getExtension(language)
  const filename = `scan${ext}`
  await writeFile(join(tempDir, filename), code)

  try {
    const configFlag = mode === 'important'
      ? '--config auto --error --quiet'
      : '--config auto'

    const result = await executeCommand({
      type: 'shell',
      command: `semgrep scan ${configFlag} --sarif --json ${tempDir}`,
      alternatives: [`python -m semgrep scan ${configFlag} --sarif --json ${tempDir}`],
    }, { timeout: 120000 })

    if (result.success) {
      const sarif = JSON.parse(result.stdout)
      const findings = parseSarifFindings(sarif)
      return {
        success: true,
        findings,
        raw: result.stdout,
        summary: `Found ${findings.length} issues (${findings.filter(f => f.severity === 'critical').length} critical, ${findings.filter(f => f.severity === 'high').length} high)`,
        duration: result.duration,
      }
    }

    return {
      success: false,
      findings: [],
      raw: result.stderr,
      summary: `Semgrep scan failed: ${result.stderr.slice(0, 200)}`,
      duration: result.duration,
    }
  } finally {
    cleanupTempDir(tempDir)
  }
}

function parseSarifFindings(sarif: any): Finding[] {
  const findings: Finding[] = []

  if (!sarif?.runs) return findings

  for (const run of sarif.runs) {
    if (!run.results) continue

    for (const result of run.results) {
      const rule = run.tool?.driver?.rules?.find((r: any) => r.id === result.ruleId)
      findings.push({
        severity: mapSeverity(result.level),
        message: result.message?.text || 'Unknown issue',
        file: result.locations?.[0]?.physicalLocation?.artifactLocation?.uri,
        line: result.locations?.[0]?.physicalLocation?.region?.startLine,
        rule: result.ruleId,
        fix: rule?.help?.text,
      })
    }
  }

  return findings
}

function mapSeverity(level: string): Finding['severity'] {
  switch (level?.toLowerCase()) {
    case 'error': return 'critical'
    case 'warning': return 'high'
    case 'note': return 'medium'
    case 'info': return 'info'
    default: return 'medium'
  }
}

function getExtension(language: string): string {
  const extMap: Record<string, string> = {
    python: '.py',
    javascript: '.js',
    typescript: '.ts',
    java: '.java',
    go: '.go',
    ruby: '.rb',
    php: '.php',
    c: '.c',
    cpp: '.cpp',
    'c++': '.cpp',
    rust: '.rs',
  }
  return extMap[language.toLowerCase()] || '.txt'
}
