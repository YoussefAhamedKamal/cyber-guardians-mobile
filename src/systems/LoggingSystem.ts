type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: number
}

class LoggingSystem {
  private logs: LogEntry[] = []
  private maxEntries = 100

  log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = { level, message, data, timestamp: Date.now() }
    this.logs.push(entry)
    if (this.logs.length > this.maxEntries) {
      this.logs.shift()
    }
    if (level === 'error') {
      console.error(`[CG] ${message}`, data)
    } else if (level === 'warn') {
      console.warn(`[CG] ${message}`, data)
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data)
  }

  getRecent(n = 10): LogEntry[] {
    return this.logs.slice(-n)
  }
}

export const logger = new LoggingSystem()
