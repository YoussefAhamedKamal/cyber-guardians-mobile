import { exec } from 'child_process'
import { promisify } from 'util'
import { detectPlatform } from '../platform/detector.js'

const execAsync = promisify(exec)

const TOOL_INSTALL_MAP: Record<string, Record<string, string>> = {
  semgrep: {
    pip: 'pip install semgrep',
    brew: 'brew install semgrep',
    npm: 'npm install -g semgrep',
  },
  rg: {
    apt: 'sudo apt install -y ripgrep',
    brew: 'brew install ripgrep',
    choco: 'choco install ripgrep',
    cargo: 'cargo install ripgrep',
  },
  jq: {
    apt: 'sudo apt install -y jq',
    brew: 'brew install jq',
    choco: 'choco install jq',
  },
  gcc: {
    apt: 'sudo apt install -y gcc',
    brew: 'brew install gcc',
    choco: 'choco install gcc',
  },
  clang: {
    apt: 'sudo apt install -y clang',
    brew: 'brew install llvm',
    choco: 'choco install llvm',
  },
  python: {
    apt: 'sudo apt install -y python3',
    brew: 'brew install python3',
    choco: 'choco install python3',
  },
  node: {
    apt: 'sudo apt install -y nodejs',
    brew: 'brew install node',
    choco: 'choco install nodejs',
  },
  docker: {
    apt: 'sudo apt install -y docker.io',
    brew: 'brew install --cask docker',
    choco: 'choco install docker-desktop',
  },
  glob: {
    npm: 'npm install -g glob-cli',
    pip: 'pip install glob3',
  },
  grep: {
    apt: 'sudo apt install -y grep',
    brew: 'brew install grep',
  },
}

export async function installTool(tool: string): Promise<boolean> {
  const platform = detectPlatform()
  const installCmds = TOOL_INSTALL_MAP[tool]

  if (!installCmds) {
    // Try generic install methods
    const managers = platform.packageManagers.filter(m => m.available)
    for (const manager of managers) {
      try {
        await execAsync(manager.install(tool), { timeout: 120000 })
        return true
      } catch {
        continue
      }
    }
    return false
  }

  // Try platform-specific installers first
  const preferredManagers = platform.os === 'windows'
    ? ['choco', 'winget', 'scoop', 'npm', 'pip']
    : platform.os === 'macos'
    ? ['brew', 'pip', 'npm']
    : ['apt', 'pip', 'npm', 'cargo']

  for (const mgr of preferredManagers) {
    if (installCmds[mgr]) {
      try {
        await execAsync(installCmds[mgr], { timeout: 120000 })
        return true
      } catch {
        continue
      }
    }
  }

  // Try any available installer
  for (const [mgr, cmd] of Object.entries(installCmds)) {
    const manager = platform.packageManagers.find(m => m.name === mgr && m.available)
    if (manager) {
      try {
        await execAsync(cmd, { timeout: 120000 })
        return true
      } catch {
        continue
      }
    }
  }

  return false
}
