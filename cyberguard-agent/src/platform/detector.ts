import { execSync } from 'child_process'
import { platform, arch } from 'os'
import { existsSync } from 'fs'

export type OS = 'windows' | 'macos' | 'linux'
export type Arch = 'x64' | 'arm64' | 'x86'
export type Shell = 'bash' | 'powershell' | 'cmd' | 'fish' | 'zsh'

export interface PackageManager {
  name: string
  install: (pkg: string) => string
  check: (pkg: string) => string
  available: boolean
}

export interface PlatformInfo {
  os: OS
  arch: Arch
  shell: Shell
  packageManagers: PackageManager[]
  pathSeparator: '/' | '\\'
  lineEnding: '\n' | '\r\n'
}

function detectOS(): OS {
  switch (platform()) {
    case 'win32': return 'windows'
    case 'darwin': return 'macos'
    default: return 'linux'
  }
}

function detectArch(): Arch {
  switch (arch()) {
    case 'x64': return 'x64'
    case 'arm64': return 'arm64'
    default: return 'x86'
  }
}

function detectShell(): Shell {
  if (platform() === 'win32') {
    const comspec = process.env.COMSPEC || ''
    if (comspec.toLowerCase().includes('powershell')) return 'powershell'
    return 'cmd'
  }
  const shell = process.env.SHELL || '/bin/bash'
  if (shell.includes('fish')) return 'fish'
  if (shell.includes('zsh')) return 'zsh'
  return 'bash'
}

function commandExists(cmd: string): boolean {
  if (!/^[a-zA-Z0-9._-]+$/.test(cmd)) {
    return false
  }
  try {
    execSync(`which ${cmd} 2>/dev/null || where ${cmd} 2>NUL`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function detectPackageManagers(os: OS): PackageManager[] {
  const managers: PackageManager[] = []

  if (os === 'linux') {
    managers.push(
      {
        name: 'apt',
        install: (pkg) => `sudo apt install -y ${pkg}`,
        check: (pkg) => `dpkg -l ${pkg} 2>/dev/null`,
        available: commandExists('apt'),
      },
      {
        name: 'yum',
        install: (pkg) => `sudo yum install -y ${pkg}`,
        check: (pkg) => `rpm -q ${pkg}`,
        available: commandExists('yum'),
      },
      {
        name: 'pacman',
        install: (pkg) => `sudo pacman -S --noconfirm ${pkg}`,
        check: (pkg) => `pacman -Qi ${pkg}`,
        available: commandExists('pacman'),
      },
    )
  } else if (os === 'macos') {
    managers.push({
      name: 'brew',
      install: (pkg) => `brew install ${pkg}`,
      check: (pkg) => `brew list ${pkg}`,
      available: commandExists('brew'),
    })
  } else if (os === 'windows') {
    managers.push(
      {
        name: 'choco',
        install: (pkg) => `choco install -y ${pkg}`,
        check: (pkg) => `choco list --local-only ${pkg}`,
        available: commandExists('choco'),
      },
      {
        name: 'winget',
        install: (pkg) => `winget install ${pkg}`,
        check: (pkg) => `winget list ${pkg}`,
        available: commandExists('winget'),
      },
      {
        name: 'scoop',
        install: (pkg) => `scoop install ${pkg}`,
        check: (pkg) => `scoop list ${pkg}`,
        available: commandExists('scoop'),
      },
    )
  }

  // Cross-platform managers
  managers.push(
    {
      name: 'pip',
      install: (pkg) => `pip install ${pkg}`,
      check: (pkg) => `pip show ${pkg}`,
      available: commandExists('pip'),
    },
    {
      name: 'npm',
      install: (pkg) => `npm install -g ${pkg}`,
      check: (pkg) => `npm list -g ${pkg}`,
      available: commandExists('npm'),
    },
    {
      name: 'cargo',
      install: (pkg) => `cargo install ${pkg}`,
      check: (pkg) => `cargo install --list 2>/dev/null | grep ${pkg}`,
      available: commandExists('cargo'),
    },
  )

  return managers
}

let cachedPlatform: PlatformInfo | null = null

export function detectPlatform(): PlatformInfo {
  if (cachedPlatform) return cachedPlatform

  const os = detectOS()
  const detectedArch = detectArch()
  const shell = detectShell()
  const packageManagers = detectPackageManagers(os)

  cachedPlatform = {
    os,
    arch: detectedArch,
    shell,
    packageManagers,
    pathSeparator: os === 'windows' ? '\\' : '/',
    lineEnding: os === 'windows' ? '\r\n' : '\n',
  }

  return cachedPlatform
}
