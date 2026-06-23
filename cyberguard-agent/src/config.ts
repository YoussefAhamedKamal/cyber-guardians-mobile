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
  geminiKey: string
  groqKey: string
  huggingfaceKey: string
  openrouterKey: string
  nvidiaKey: string
  mistralKey: string
  cerebrasKey: string
  cohereKey: string
  githubKey: string
  cloudflareKey: string
  cloudflareAccountId: string
  vercelKey: string
  opencodezenKey: string
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
    port: overrides.port ?? 3002,
    token: overrides.token || '',
    profile,
    verbose: overrides.verbose || false,
    maxConcurrent: profileConfig.maxConcurrent!,
    sandboxEnabled: profileConfig.sandboxEnabled!,
    dockerFallback: profileConfig.dockerFallback!,
    cacheTTL: profileConfig.cacheTTL!,
    geminiKey: overrides.geminiKey || process.env.GEMINI_API_KEY || '',
    groqKey: overrides.groqKey || process.env.GROQ_API_KEY || '',
    huggingfaceKey: overrides.huggingfaceKey || process.env.HUGGINGFACE_API_KEY || '',
    openrouterKey: overrides.openrouterKey || process.env.OPENROUTER_API_KEY || '',
    nvidiaKey: overrides.nvidiaKey || process.env.NVIDIA_API_KEY || '',
    mistralKey: overrides.mistralKey || process.env.MISTRAL_API_KEY || '',
    cerebrasKey: overrides.cerebrasKey || process.env.CEREBRAS_API_KEY || '',
    cohereKey: overrides.cohereKey || process.env.COHERE_API_KEY || '',
    githubKey: overrides.githubKey || process.env.GITHUB_API_KEY || '',
    cloudflareKey: overrides.cloudflareKey || process.env.CLOUDFLARE_API_KEY || '',
    cloudflareAccountId: overrides.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID || '',
    vercelKey: overrides.vercelKey || process.env.VERCEL_API_KEY || '',
    opencodezenKey: overrides.opencodezenKey || process.env.OPENCODEZEN_API_KEY || '',
  }
}
