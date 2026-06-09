export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type ThreatType =
  | 'phishing'
  | 'passwords'
  | 'malware'
  | 'network'
  | 'encryption'
  | 'websec'
  | 'incident'

export type ChallengeType =
  | 'cards'
  | 'build'
  | 'maze'
  | 'dragdrop'
  | 'decrypt'
  | 'codefix'
  | 'response'

export interface Character {
  id: string
  name: string
  role: string
  color: string
  personality: string
  gender: 'male' | 'female'
  avatarUrl?: string
  voiceUrl?: string
}

export interface DialogueLine {
  speakerId: string
  text: string
}

export interface PhishingEmail {
  id: string
  from: string
  subject: string
  body: string
  isPhishing: boolean
  reason: string
}

export interface PasswordRule {
  type: 'length' | 'uppercase' | 'number' | 'symbol'
  label: string
  satisfied: boolean
}

export interface MazeCell {
  x: number
  y: number
  isMalware: boolean
  isWall: boolean
  isEndpoint: boolean
}

export interface FirewallPort {
  id: string
  name: string
  port: number
  status: 'open' | 'closed'
  isCritical: boolean
}

export interface CipherChallenge {
  encrypted: string
  hint: string
  shift: number
  solution: string
}

export interface VulnCode {
  id: string
  language: string
  code: string
  vulnerability: string
  fix: string
  options: string[]
  correctIndex: number
}

export interface IncidentStep {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface ChallengeData {
  phishingEmails?: PhishingEmail[]
  passwordRules?: PasswordRule[]
  mazeGrid?: MazeCell[][]
  firewallPorts?: FirewallPort[]
  cipher?: CipherChallenge
  vulnCodes?: VulnCode[]
  incidentSteps?: IncidentStep[]
}

export interface LevelData {
  id: LevelId
  title: string
  subtitle: string
  threat: ThreatType
  challengeType: ChallengeType
  intro: DialogueLine[]
  outro: DialogueLine[]
  focusCharacterId: string
  challengeData: ChallengeData
  difficulty?: 'easy' | 'medium' | 'hard'
  points?: number
  timeLimit?: number
  unlockRequirement?: number
  hints?: string[]
  backgroundImage?: string
  backgroundMusic?: string
  soundEffects?: string[]
}

export type ChallengeResult = 'success' | 'fail'

export interface ChallengeState {
  levelId: LevelId
  isComplete: boolean
  result: ChallengeResult | null
  score: number
}
