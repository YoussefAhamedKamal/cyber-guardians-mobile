import { WebSocketServer, WebSocket } from 'ws'
import { createServer as createHttpServer } from 'http'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { AgentConfig } from './config.js'
import { detectPlatform } from './platform/detector.js'
import { parseSkillMd } from './parser/skillParser.js'
import { parsePluginJson } from './parser/pluginParser.js'
import { parseManifest, detectFileType } from './parser/manifestParser.js'
import { executeCommand, executeCommands } from './executor/commandExecutor.js'
import { runSemgrep } from './plugins/semgrep.js'
import { runCodeQL } from './plugins/codeql.js'
import { runSlither } from './plugins/slither.js'
import { runLibFuzzer } from './plugins/libfuzzer.js'
import { findSkills, installSkill } from './plugins/skillsDiscovery.js'
import { SmartCache } from './cache/smartCache.js'
import { log, verbose } from './utils/logger.js'
import { aiManager, GeminiProvider, GroqProvider, HuggingFaceProvider, OpenRouterProvider, OllamaProvider, type AIMessage } from './ai/providers.js'
import { executeFileOp, grepFiles } from './ai/fileOps.js'
import { getTaskExecutor } from './ai/taskExecutor.js'
import type { ToolName } from './ai/types.js'

interface AgentMessage {
  id: string
  type: 'scan' | 'install-skill' | 'execute' | 'find-skills' | 'install' | 'status' | 'tools' | 'parse-file' | 'list-installs' | 'ai-chat' | 'file-op' | 'grep' | 'ai-providers' | 'task' | 'tool-status' | 'tool-settings'
  payload: any
}

interface AgentResponse {
  id: string
  status: 'processing' | 'complete' | 'error'
  progress?: number
  result?: any
  error?: string
}

export function createServer(config: AgentConfig) {
  const platform = detectPlatform()
  const cache = new SmartCache(config.cacheTTL)
  let wss: WebSocketServer | null = null

  function createWSServer() {
    const httpServer = createHttpServer((req, res) => {
      // Health check endpoint
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'ok',
          version: '1.0.0',
          platform: platform.os,
          tools: ['semgrep', 'codeql', 'slither', 'libfuzzer', 'skills-discovery'],
        }))
        return
      }
      res.writeHead(404)
      res.end()
    })

    wss = new WebSocketServer({ server: httpServer })

    wss.on('error', (err) => {
      log(`WebSocket server error: ${err.message}`, 'error')
    })

    wss.on('connection', (ws, req) => {
      // Verify token (optional — skip if config.token is empty)
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      const token = url.searchParams.get('token')
      if (config.token && config.token !== '' && (!token || token !== config.token)) {
        ws.close(1008, 'Invalid token')
        return
      }

      log('Client connected')

      ws.on('message', async (data) => {
        try {
          const msg: AgentMessage = JSON.parse(data.toString())
          await handleMessage(ws, msg)
        } catch (err: any) {
          log(`Error handling message: ${err.message}`, 'error')
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              id: '',
              status: 'error',
              error: err.message,
            }))
          }
        }
      })

      ws.on('error', (err) => {
        log(`WebSocket error: ${err.message}`, 'error')
      })

      ws.on('close', () => {
        log('Client disconnected')
      })

      // Send welcome message
      ws.send(JSON.stringify({
        id: 'welcome',
        status: 'complete',
        result: {
          message: 'CyberGuard Agent connected',
          version: '1.0.0',
          platform: platform.os,
        },
      }))
    })

    return { httpServer, wss }
  }

  async function handleMessage(ws: WebSocket, msg: AgentMessage) {
    verbose(`Received: ${msg.type}`, config.verbose)

    const sendResponse = (response: AgentResponse) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(response))
      }
    }

    switch (msg.type) {
      case 'status':
        sendResponse({
          id: msg.id,
          status: 'complete',
          result: {
            platform: platform.os,
            arch: platform.arch,
            shell: platform.shell,
            packageManagers: platform.packageManagers.filter(m => m.available).map(m => m.name),
          },
        })
        break

      case 'tools':
        sendResponse({
          id: msg.id,
          status: 'complete',
          result: {
            tools: [
              { name: 'semgrep', description: 'Static analysis' },
              { name: 'codeql', description: 'Code analysis' },
              { name: 'slither', description: 'Solidity analysis' },
              { name: 'libfuzzer', description: 'Fuzzing' },
              { name: 'skills-discovery', description: 'Find and install skills' },
            ],
          },
        })
        break

      case 'scan': {
        const { tool, code, language, options } = msg.payload
        sendResponse({ id: msg.id, status: 'processing', progress: 0 })

        let result
        switch (tool) {
          case 'semgrep':
            result = await runSemgrep(code, language, options?.mode)
            break
          case 'codeql':
            result = await runCodeQL(code, language, options?.querySuite)
            break
          case 'slither':
            result = await runSlither(code, language)
            break
          case 'libfuzzer':
            result = await runLibFuzzer(code, language, options?.duration)
            break
          default:
            sendResponse({ id: msg.id, status: 'error', error: `Unknown tool: ${tool}` })
            return
        }

        sendResponse({ id: msg.id, status: 'complete', result })
        break
      }

      case 'parse-file': {
        const { content, filename } = msg.payload
        const fileType = detectFileType(filename)
        let definition

        switch (fileType) {
          case 'skill':
            definition = parseSkillMd(content)
            break
          case 'plugin':
            definition = parsePluginJson(content)
            break
          case 'manifest':
            definition = parseManifest(content, filename)
            break
          default:
            sendResponse({ id: msg.id, status: 'error', error: `Unknown file type: ${filename}` })
            return
        }

        sendResponse({ id: msg.id, status: 'complete', result: { type: fileType, definition } })
        break
      }

      case 'execute': {
        const { command, alternatives, timeout, cwd } = msg.payload
        sendResponse({ id: msg.id, status: 'processing', progress: 0 })

        const result = await executeCommand(
          { type: 'shell', command, alternatives },
          { timeout, cwd, verbose: config.verbose }
        )

        sendResponse({ id: msg.id, status: 'complete', result })
        break
      }

      case 'find-skills': {
        const { query } = msg.payload
        try {
          const skills = await findSkills(query)
          sendResponse({ id: msg.id, status: 'complete', result: skills })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'complete', result: [] })
        }
        break
      }

      case 'list-installs': {
        log('list-installs: Starting exec...')
        try {
          const execAsync = promisify(exec)
          log('list-installs: Running npx skills list -g...')
          const { stdout, stderr } = await execAsync('npx skills list -g', { timeout: 60000, encoding: 'utf-8' })
          log(`list-installs: Got ${stdout.length} bytes, stderr: ${stderr?.length || 0}`)
          const ansiRegex = /\x1B\[[0-9;]*[a-zA-Z]/g
          const lines = stdout.replace(ansiRegex, '').split('\n').filter(l => l.trim() && !l.includes('Global Skills'))
          const skills = lines.map(l => {
            const parts = l.trim().split(/\s+/)
            return { name: parts[0] || '', path: parts[1] || '', agents: parts.slice(2).join(' ') }
          }).filter(s => s.name)
          log(`list-installs: Parsed ${skills.length} skills, sending response...`)
          sendResponse({ id: msg.id, status: 'complete', result: skills })
          log('list-installs: Response sent')
        } catch (err: any) {
          log(`list-installs error: ${err.message}`, 'error')
          sendResponse({ id: msg.id, status: 'complete', result: [] })
        }
        break
      }

      case 'install-skill':
      case 'install': {
        const { packageName } = msg.payload
        try {
          const success = await installSkill(packageName)
          sendResponse({ id: msg.id, status: 'complete', result: { success } })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'complete', result: { success: false, error: err.message } })
        }
        break
      }

      case 'ai-chat': {
        const { messages, provider, model, temperature, maxTokens } = msg.payload
        try {
          if (provider && model) aiManager.setActive(provider, model)
          const result = await aiManager.chat(messages, { temperature, maxTokens })
          sendResponse({ id: msg.id, status: 'complete', result })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'error', error: err.message })
        }
        break
      }

      case 'file-op': {
        const { operation, path, content, pattern, recursive } = msg.payload
        try {
          const result = await executeFileOp({ type: operation, path, content, pattern, recursive })
          sendResponse({ id: msg.id, status: 'complete', result })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'error', error: err.message })
        }
        break
      }

      case 'grep': {
        const { dir, query, include } = msg.payload
        try {
          const results = await grepFiles(dir, query, include)
          sendResponse({ id: msg.id, status: 'complete', result: results })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'error', error: err.message })
        }
        break
      }

      case 'ai-providers': {
        try {
          const providers = await aiManager.getAvailableProviders()
          const active = aiManager.getActive()
          sendResponse({ id: msg.id, status: 'complete', result: { providers, active } })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'error', error: err.message })
        }
        break
      }

      case 'task': {
        const { task, settings } = msg.payload
        sendResponse({ id: msg.id, status: 'processing', result: { message: 'Executing task...' } })
        try {
          const executor = getTaskExecutor()
          if (settings) executor.updateSettings(settings)
          const result = await executor.executeTask(task)
          sendResponse({ id: msg.id, status: 'complete', result })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'error', error: err.message })
        }
        break
      }

      case 'tool-status': {
        try {
          const executor = getTaskExecutor()
          const status = await executor.getToolStatus()
          sendResponse({ id: msg.id, status: 'complete', result: status })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'error', error: err.message })
        }
        break
      }

      case 'tool-settings': {
        const { settings } = msg.payload
        try {
          const executor = getTaskExecutor()
          executor.updateSettings(settings)
          const current = executor.getSettings()
          sendResponse({ id: msg.id, status: 'complete', result: current })
        } catch (err: any) {
          sendResponse({ id: msg.id, status: 'error', error: err.message })
        }
        break
      }

      default:
        sendResponse({ id: msg.id, status: 'error', error: `Unknown message type: ${msg.type}` })
    }
  }

  async function start() {
    // Register AI providers
    if (config.geminiKey) {
      aiManager.registerProvider(new GeminiProvider(config.geminiKey))
      log('AI: Gemini provider registered')
    }
    if (config.groqKey) {
      aiManager.registerProvider(new GroqProvider(config.groqKey))
      log('AI: Groq provider registered')
    }
    if (config.huggingfaceKey) {
      aiManager.registerProvider(new HuggingFaceProvider(config.huggingfaceKey))
      log('AI: HuggingFace provider registered')
    }
    if (config.openrouterKey) {
      aiManager.registerProvider(new OpenRouterProvider(config.openrouterKey))
      log('AI: OpenRouter provider registered')
    }
    // Ollama is always available (local)
    const ollama = new OllamaProvider()
    if (await ollama.isAvailable()) {
      aiManager.registerProvider(ollama)
      log('AI: Ollama provider registered (local)')
    }

    const { httpServer } = createWSServer()

    httpServer.listen(config.port, '0.0.0.0', () => {
      log(`╔══════════════════════════════════════════════════════════════╗`)
      log(`║  @cyberguard/agent v1.1.0                                   ║`)
      log(`║  Universal Skill/Plugin Executor + AI Providers             ║`)
      log(`╚══════════════════════════════════════════════════════════════╝`)
      log(`Server running on ws://localhost:${config.port}`)
      log(`Platform: ${platform.os} (${platform.arch})`)
      log(`Shell: ${platform.shell}`)
      log(`Profile: ${config.profile}`)
      log(`Token: ${config.token ? config.token.slice(0, 8) + '...' : 'none'}`)
    })
  }

  return { start }
}
