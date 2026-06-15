const isDev = import.meta.env.DEV

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => {
    if (isDev) console.log(`[CG] ${event}`, data)
  },
  error: (event: string, data?: Record<string, unknown>) => {
    console.error(`[CG ERROR] ${event}`, data)
  },
}
