export function parseSarif(content: string): any {
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

export function extractFindings(sarif: any): any[] {
  const findings: any[] = []

  if (!sarif?.runs) return findings

  for (const run of sarif.runs) {
    if (!run.results) continue

    for (const result of run.results) {
      findings.push({
        rule: result.ruleId,
        message: result.message?.text,
        severity: result.level,
        file: result.locations?.[0]?.physicalLocation?.artifactLocation?.uri,
        line: result.locations?.[0]?.physicalLocation?.region?.startLine,
      })
    }
  }

  return findings
}
