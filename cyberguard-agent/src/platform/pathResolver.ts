import { join, resolve, sep } from 'path'
import { tmpdir } from 'os'
import { mkdirSync, rmSync, existsSync } from 'fs'
import { detectPlatform } from './detector.js'

let tempCounter = 0

export function createTempDir(prefix: string = 'cyberguard'): string {
  const platform = detectPlatform()
  const base = platform.os === 'windows' ? process.env.TEMP || tmpdir() : tmpdir()
  const dir = join(base, `${prefix}-${Date.now()}-${++tempCounter}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

export function cleanupTempDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true })
  }
}

export function toPlatformPath(path: string): string {
  const platform = detectPlatform()
  if (platform.os === 'windows') {
    return path.replace(/\//g, sep)
  }
  return path.replace(/\\/g, sep)
}

export function getWorkspaceDir(): string {
  const platform = detectPlatform()
  if (platform.os === 'windows') {
    return join(process.env.USERPROFILE || '~', '.cyberguard', 'workspace')
  }
  return join(process.env.HOME || '~', '.cyberguard', 'workspace')
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}
