import type { ManifestFile, ExtractedCommand } from './types.js'

export function parseManifest(content: string, filename: string): ManifestFile {
  const lower = filename.toLowerCase()

  if (lower === 'makefile' || lower.startsWith('makefile.')) {
    return parseMakefile(content, filename)
  }
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) {
    return parseDockerfile(content, filename)
  }
  if (lower === 'requirements.txt' || lower.startsWith('requirements.')) {
    return parseRequirements(content, filename)
  }
  if (lower === 'package.json') {
    return parsePackageJson(content, filename)
  }
  if (lower === 'cargo.toml') {
    return parseCargoToml(content, filename)
  }
  if (lower.endsWith('.sh')) {
    return parseShellScript(content, filename)
  }

  return { name: filename, type: 'unknown', commands: [] }
}

function parseMakefile(content: string, filename: string): ManifestFile {
  const commands: ExtractedCommand[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && !trimmed.includes(':') && !trimmed.includes('=')) {
      commands.push({
        type: 'build',
        command: trimmed,
      })
    }
  }

  return { name: filename, type: 'makefile', commands }
}

function parseDockerfile(content: string, filename: string): ManifestFile {
  const commands: ExtractedCommand[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('RUN ')) {
      commands.push({
        type: 'shell',
        command: trimmed.slice(4),
      })
    } else if (trimmed.startsWith('COPY ') || trimmed.startsWith('ADD ')) {
      commands.push({
        type: 'config',
        command: trimmed,
      })
    }
  }

  return { name: filename, type: 'dockerfile', commands }
}

function parseRequirements(content: string, filename: string): ManifestFile {
  const packages = content.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.startsWith('-'))

  const commands: ExtractedCommand[] = packages.map(pkg => ({
    type: 'install' as const,
    command: `pip install ${pkg}`,
    alternatives: [`python -m pip install ${pkg}`],
  }))

  return { name: filename, type: 'requirements', commands }
}

function parsePackageJson(content: string, filename: string): ManifestFile {
  const json = JSON.parse(content)
  const commands: ExtractedCommand[] = []

  // Add dependencies as install commands
  if (json.dependencies) {
    for (const [pkg, _version] of Object.entries(json.dependencies)) {
      commands.push({
        type: 'install',
        command: `npm install ${pkg}`,
      })
    }
  }

  // Add scripts
  if (json.scripts) {
    for (const [name, script] of Object.entries(json.scripts)) {
      commands.push({
        type: name === 'test' ? 'test' : name === 'build' ? 'build' : 'shell',
        command: `npm run ${name}`,
        description: String(script),
      })
    }
  }

  return { name: filename, type: 'packagejson', commands }
}

function parseCargoToml(content: string, filename: string): ManifestFile {
  const commands: ExtractedCommand[] = []

  // Basic cargo commands
  commands.push(
    { type: 'build', command: 'cargo build' },
    { type: 'test', command: 'cargo test' },
    { type: 'shell', command: 'cargo run' },
  )

  return { name: filename, type: 'cargotoml', commands }
}

function parseShellScript(content: string, filename: string): ManifestFile {
  const commands: ExtractedCommand[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('!')) {
      commands.push({
        type: 'shell',
        command: trimmed,
      })
    }
  }

  return { name: filename, type: 'shell', commands }
}

export function detectFileType(filename: string): 'skill' | 'plugin' | 'manifest' | 'unknown' {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.md') && (lower.includes('skill') || lower.startsWith('readme'))) {
    return 'skill'
  }
  if (lower === 'plugin.json' || lower.endsWith('.plugin.json')) {
    return 'plugin'
  }

  const manifestFiles = [
    'makefile', 'dockerfile', 'requirements.txt', 'package.json',
    'cargo.toml', '.sh', '.bash',
  ]

  if (manifestFiles.some(f => lower.endsWith(f) || lower === f)) {
    return 'manifest'
  }

  return 'unknown'
}
