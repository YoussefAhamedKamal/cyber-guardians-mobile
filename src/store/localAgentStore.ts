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
  listInstalledSkills,
  executeTask,
  getToolStatus,
  saveToolSettings,
} from '../ai/localAgent'
import type {
  Tool,
  Skill,
  ScanResult,
  AgentStatus,
  CommandResult,
  FileParseResult,
  TaskDefinition,
  TaskResult,
  ToolSettings,
  ToolStatusResult,
} from '../types/localAgent'

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
  // Multi-tool state
  toolSettings: ToolSettings
  toolStatus: ToolStatusResult | null
  lastTaskResult: TaskResult | null
  executingTask: boolean
  connect: (url: string, token?: string) => Promise<void>
  disconnect: () => void
  refreshStatus: () => Promise<void>
  refreshTools: () => Promise<void>
  scan: (tool: string, code: string, language: string, options?: Record<string, any>) => Promise<ScanResult>
  findSkills: (query: string) => Promise<Skill[]>
  listInstalled: () => Promise<Skill[]>
  installSkill: (packageName: string) => Promise<boolean>
  execute: (command: string, alternatives?: string[]) => Promise<CommandResult>
  parseFile: (content: string, filename: string) => Promise<FileParseResult>
  setError: (error: string | null) => void
  // Multi-tool actions
  executeTaskAction: (task: TaskDefinition) => Promise<TaskResult>
  refreshToolStatus: () => Promise<void>
  updateToolSettings: (settings: Partial<ToolSettings>) => Promise<void>
  setToolSettingsLocal: (settings: Partial<ToolSettings>) => void
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
  // Multi-tool defaults
  toolSettings: {
    selectedTool: null,
    autoFallback: true,
  },
  toolStatus: null,
  lastTaskResult: null,
  executingTask: false,

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

      // Auto-load installed skills in background
      listInstalledSkills().then(installedSkills => {
        set({ skills: installedSkills })
      }).catch(() => {
        // Ignore errors — skills will be loaded manually
      })

      // Auto-load tool status in background
      getToolStatus().then(ts => {
        set({ toolStatus: ts, toolSettings: { selectedTool: ts.selectedTool, autoFallback: ts.autoFallback } })
      }).catch(() => {
        // Ignore errors — tool status will be loaded manually
      })
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

  listInstalled: async () => {
    try {
      const skills = await listInstalledSkills()
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

  // ─── Multi-Tool Actions ──────────────────────────────────────────

  executeTaskAction: async (task: TaskDefinition) => {
    set({ executingTask: true, error: null })
    try {
      const { toolSettings } = get()
      const result = await executeTask(task, toolSettings)
      set({ lastTaskResult: result, executingTask: false })
      return result
    } catch (err: any) {
      set({ executingTask: false, error: err.message })
      throw err
    }
  },

  refreshToolStatus: async () => {
    if (!isAgentConnected()) return
    try {
      const ts = await getToolStatus()
      set({ toolStatus: ts, toolSettings: { selectedTool: ts.selectedTool, autoFallback: ts.autoFallback } })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  updateToolSettings: async (settings: Partial<ToolSettings>) => {
    if (!isAgentConnected()) {
      // Save locally only
      set((state) => ({ toolSettings: { ...state.toolSettings, ...settings } }))
      return
    }
    try {
      const result = await saveToolSettings(settings)
      set({ toolSettings: result })
    } catch (err: any) {
      // Fallback: save locally
      set((state) => ({ toolSettings: { ...state.toolSettings, ...settings } }))
    }
  },

  setToolSettingsLocal: (settings: Partial<ToolSettings>) => {
    set((state) => ({ toolSettings: { ...state.toolSettings, ...settings } }))
  },
}))
