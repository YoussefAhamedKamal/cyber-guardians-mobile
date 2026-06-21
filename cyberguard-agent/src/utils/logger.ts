export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  switch (level) {
    case 'error':
      console.error(`${prefix} ${message}`)
      break
    case 'warn':
      console.warn(`${prefix} ${message}`)
      break
    default:
      console.log(`${prefix} ${message}`)
  }
}

export function verbose(message: string, enabled: boolean): void {
  if (enabled) {
    log(message, 'info')
  }
}
