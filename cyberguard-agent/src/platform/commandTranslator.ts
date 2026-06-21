import { detectPlatform, type OS } from './detector.js'

const UNIX_TO_WINDOWS: Record<string, string> = {
  'ls': 'dir',
  'cat': 'type',
  'cp': 'copy',
  'mv': 'move',
  'rm': 'del',
  'mkdir -p': 'mkdir',
  'chmod': 'icacls',
  'grep': 'findstr',
  'which': 'where',
  '&&': '&',
}

const WINDOWS_TO_UNIX: Record<string, string> = {
  'dir': 'ls',
  'type': 'cat',
  'copy': 'cp',
  'move': 'mv',
  'del': 'rm',
  'where': 'which',
  'findstr': 'grep',
}

export function translateCommand(command: string, targetOS?: OS): string {
  const os = targetOS || detectPlatform().os
  let translated = command

  if (os === 'windows') {
    for (const [unix, win] of Object.entries(UNIX_TO_WINDOWS)) {
      const regex = new RegExp(`^${unix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      translated = translated.replace(regex, win)
    }
  } else {
    for (const [win, unix] of Object.entries(WINDOWS_TO_UNIX)) {
      const regex = new RegExp(`^${win.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      translated = translated.replace(regex, unix)
    }
  }

  return translated
}

export function translatePath(path: string, targetOS?: OS): string {
  const os = targetOS || detectPlatform().os
  if (os === 'windows') {
    return path.replace(/\//g, '\\')
  }
  return path.replace(/\\/g, '/')
}

export function getShellCommand(command: string, shell?: string): string {
  const s = shell || detectPlatform().shell
  switch (s) {
    case 'powershell':
      return `powershell -Command "${command}"`
    case 'cmd':
      return `cmd /c "${command}"`
    case 'fish':
    case 'zsh':
    case 'bash':
    default:
      return `bash -c "${command}"`
  }
}
