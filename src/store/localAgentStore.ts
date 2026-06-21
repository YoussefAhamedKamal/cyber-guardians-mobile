import { create } from 'zustand'
import {
  connectToAgent,
  disconnectFromAgent,
  isAgentConnected,
  getAgentStatus,
  getAgentTools,
  scanWithTool,
  findSkills as findSkillsFromAgent,
  installSkillAgent,
  executeCommand,
  parseSkillFile,
  setOnDisconnect,
} from '../ai/localAgent'
import type { Tool, Skill, ScanResult, AgentStatus, CommandResult, FileParseResult } from '../types/localAgent'

interface LocalAgentState {
  connected: boolean
  url: string
  token: string
  status: AgentStatus | null
  tools: Tool[]
  skills: Skill[]
  lastScanResult: ScanResult | null
  scanning: boolean
  error: string | null
  connect: (url: string, token?: string) => Promise<void>
  disconnect: () => void
  refreshStatus: () => Promise<void>
  refreshTools: () => Promise<void>
  scan: (tool: string, code: string, language: string, options?: Record<string, any>) => Promise<ScanResult>
  findSkills: (query: string) => Promise<Skill[]>
  installSkill: (packageName: string) => Promise<boolean>
  execute: (command: string, alternatives?: string[]) => Promise<CommandResult>
  parseFile: (content: string, filename: string) => Promise<FileParseResult>
  setError: (error: string | null) => void
}

export const useLocalAgentStore = create<LocalAgentState>((set, get) => ({
  connected: false,
    url: 'ws://localhost:3002',
  token: '',
  status: null,
  tools: [],
  skills: [],
  lastScanResult: null,
  scanning: false,
  error: null,

  connect: async (url: string, token?: string) => {
    try {
      setOnDisconnect(() => {
        set({ connected: false, status: null, tools: [], skills: [], error: 'Connection lost' })
      })
      await connectToAgent(url, token)

      let status: AgentStatus | null = null
      try {
        status = await getAgentStatus()
      } catch {
        // getAgentStatus failed — connection may still be usable
      }

      let tools: Tool[] = []
      try {
        tools = await getAgentTools()
      } catch {
        // getAgentTools failed — continue without tools
      }

      set({ connected: true, url, token: token || '', error: null, status, tools })
    } catch (err: any) {
      set({ connected: false, error: err.message })
      throw err
    }
  },

  disconnect: () => {
    setOnDisconnect(null)
    disconnectFromAgent()
    set({ connected: false, status: null, tools: [], skills: [] })
  },

  refreshStatus: async () => {
    if (!isAgentConnected()) return
    try {
      const status = await getAgentStatus()
      set({ status })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  refreshTools: async () => {
    if (!isAgentConnected()) return
    try {
      const tools = await getAgentTools()
      set({ tools })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  scan: async (tool: string, code: string, language: string, options?: Record<string, any>) => {
    set({ scanning: true, error: null })
    try {
      const result = await scanWithTool(tool, code, language, options)
      set({ lastScanResult: result, scanning: false })
      return result
    } catch (err: any) {
      set({ scanning: false, error: err.message })
      throw err
    }
  },

  findSkills: async (query: string) => {
    try {
      const skills = await findSkillsFromAgent(query)
      set({ skills })
      return skills
    } catch (err: any) {
      set({ error: err.message })
      return []
    }
  },

  installSkill: async (packageName: string) => {
    try {
      const success = await installSkillAgent(packageName)
      return success
    } catch (err: any) {
      set({ error: err.message })
      return false
    }
  },

  execute: async (command: string, alternatives?: string[]) => {
    try {
      return await executeCommand(command, alternatives)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  parseFile: async (content: string, filename: string) => {
    try {
      return await parseSkillFile(content, filename)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  setError: (error: string | null) => set({ error }),
}))
