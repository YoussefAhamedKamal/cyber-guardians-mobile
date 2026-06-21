import { randomBytes } from 'crypto'

export interface AgentConfig {
  port: number
  token: string
  profile: 'minimal' | 'full' | 'education'
  verbose: boolean
  maxConcurrent: number
  sandboxEnabled: boolean
  dockerFallback: boolean
  cacheTTL: number
}

const PROFILES: Record<string, Partial<AgentConfig>> = {
  minimal: {
    maxConcurrent: 1,
    sandboxEnabled: false,
    dockerFallback: false,
    cacheTTL: 3600000,
  },
  full: {
    maxConcurrent: 3,
    sandboxEnabled: true,
    dockerFallback: true,
    cacheTTL: 7200000,
  },
  education: {
    maxConcurrent: 1,
    sandboxEnabled: true,
    dockerFallback: false,
    cacheTTL: 1800000,
  },
}

export function loadConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  const profile = overrides.profile || 'full'
  const profileConfig = PROFILES[profile] || PROFILES.full

  return {
    port: overrides.port ?? 3001,
    token: overrides.token || randomBytes(32).toString('hex'),
    profile,
    verbose: overrides.verbose || false,
    maxConcurrent: profileConfig.maxConcurrent!,
    sandboxEnabled: profileConfig.sandboxEnabled!,
    dockerFallback: profileConfig.dockerFallback!,
    cacheTTL: profileConfig.cacheTTL!,
  }
}
