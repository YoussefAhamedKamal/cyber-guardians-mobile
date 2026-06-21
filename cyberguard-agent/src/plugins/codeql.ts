import { executeCommand } from '../executor/commandExecutor.js'
import { checkTool } from '../executor/toolChecker.js'
import { createTempDir, cleanupTempDir } from '../platform/pathResolver.js'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import type { PluginResult, Finding } from './semgrep.js'

export async function runCodeQL(
  code: string,
  language: string,
  querySuite: string = 'security-and-quality'
): Promise<PluginResult> {
  const installed = await checkTool('codeql')
  if (!installed) {
    return {
      success: false,
      findings: [],
      raw: '',
      summary: 'CodeQL is not available. Please install it from: https://github.com/github/codeql-cli-binaries',
      duration: 0,
    }
  }

  const tempDir = createTempDir('codeql')
  const dbPath = join(tempDir, 'codeql.db')
  const resultsPath = join(tempDir, 'results.sarif')
  const ext = getExtension(language)
  const filename = `scan${ext}`

  try {
    // Create database
    await writeFile(join(tempDir, filename), code)

    const createResult = await executeCommand({
      type: 'shell',
      command: `codeql database create ${dbPath} --language=${mapLanguage(language)} --source-root=${tempDir}`,
    }, { timeout: 300000 })

    if (!createResult.success) {
      return {
        success: false,
        findings: [],
        raw: createResult.stderr,
        summary: `CodeQL database creation failed: ${createResult.stderr.slice(0, 200)}`,
        duration: createResult.duration,
      }
    }

    // Analyze
    const analyzeResult = await executeCommand({
      type: 'shell',
      command: `codeql database analyze ${dbPath} --format=sarif-latest --output=${resultsPath} codeql/${mapLanguage(language)}-queries@${querySuite}`,
    }, { timeout: 300000 })

    if (analyzeResult.success) {
      const { readFileSync } = await import('fs')
      const sarifContent = readFileSync(resultsPath, 'utf-8')
      const sarif = JSON.parse(sarifContent)
      const findings = parseCodeQLFindings(sarif)

      return {
        success: true,
        findings,
        raw: sarifContent,
        summary: `Found ${findings.length} issues`,
        duration: createResult.duration + analyzeResult.duration,
      }
    }

    return {
      success: false,
      findings: [],
      raw: analyzeResult.stderr,
      summary: `CodeQL analysis failed: ${analyzeResult.stderr.slice(0, 200)}`,
      duration: createResult.duration + analyzeResult.duration,
    }
  } finally {
    cleanupTempDir(tempDir)
  }
}

function parseCodeQLFindings(sarif: any): Finding[] {
  const findings: Finding[] = []

  if (!sarif?.runs) return findings

  for (const run of sarif.runs) {
    if (!run.results) continue

    for (const result of run.results) {
      findings.push({
        severity: mapCodeQLSeverity(result.level),
        message: result.message?.text || 'Unknown issue',
        file: result.locations?.[0]?.physicalLocation?.artifactLocation?.uri,
        line: result.locations?.[0]?.physicalLocation?.region?.startLine,
        rule: result.ruleId,
      })
    }
  }

  return findings
}

function mapCodeQLSeverity(level: string): Finding['severity'] {
  switch (level?.toLowerCase()) {
    case 'error': return 'critical'
    case 'warning': return 'high'
    case 'note': return 'medium'
    default: return 'info'
  }
}

function mapLanguage(lang: string): string {
  const map: Record<string, string> = {
    javascript: 'javascript-typescript',
    typescript: 'javascript-typescript',
    python: 'python',
    java: 'java',
    go: 'go',
    'c++': 'cpp',
    csharp: 'csharp',
    ruby: 'ruby',
    swift: 'swift',
  }
  return map[lang.toLowerCase()] || 'javascript-typescript'
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
    rust: '.rs',
  }
  return extMap[language.toLowerCase()] || '.txt'
}
