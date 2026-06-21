const ALTERNATIVE_MAP: Record<string, string[]> = {
  // Search tools
  'rg': ['grep -r', 'ag', 'ack'],
  'ag': ['grep -r', 'rg'],
  'ack': ['grep -r', 'rg'],

  // JSON tools
  'jq': ['python -m json.tool', 'node -e "console.log(JSON.stringify(JSON.parse(require(\"fs\").readFileSync(0)),null,2))"'],

  // Python tools
  'semgrep': ['python -m semgrep'],

  // Package managers
  'brew': ['apt install', 'choco install', 'winget install'],
  'apt': ['yum install', 'pacman -S', 'brew install', 'choco install'],
  'yum': ['apt install', 'dnf install'],
  'pacman': ['apt install', 'yum install'],
  'choco': ['winget install', 'scoop install', 'brew install'],
  'winget': ['choco install', 'scoop install'],
  'scoop': ['choco install', 'winget install'],

  // Build tools
  'make': ['cmake --build .', 'ninja'],
  'cmake': ['meson', 'autotools'],

  // Version control
  'git': [],

  // Containers
  'podman': ['docker'],

  // Compilers
  'gcc': ['clang', 'g++'],
  'clang': ['gcc', 'g++'],

  // Node.js tools
  'npx': ['npm exec', 'yarn dlx'],
  'yarn': ['npm', 'pnpm'],
  'pnpm': ['npm', 'yarn'],
}

export function resolveAlternative(command: string): string | null {
  const tool = command.split(' ')[0]
  const args = command.slice(tool.length).trim()

  const alternatives = ALTERNATIVE_MAP[tool]
  if (!alternatives || alternatives.length === 0) return null

  // Return first alternative with same args
  for (const alt of alternatives) {
    if (alt.includes(' ')) {
      // Complex alternative - return as-is
      return alt
    }
    // Simple tool replacement
    return args ? `${alt} ${args}` : alt
  }

  return null
}

export function getAlternatives(tool: string): string[] {
  return ALTERNATIVE_MAP[tool] || []
}
