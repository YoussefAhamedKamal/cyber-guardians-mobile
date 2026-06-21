import matter from 'gray-matter'
import type { SkillDefinition, SkillFrontmatter, ExtractedCommand, Workflow, WorkflowStep } from './types.js'

export function parseSkillMd(content: string): SkillDefinition {
  const { data: frontmatter, content: body } = matter(content)

  const parsedFrontmatter: SkillFrontmatter = {
    name: frontmatter.name || 'unknown-skill',
    description: frontmatter.description || '',
    tools: parseTools(frontmatter.tools),
    model: frontmatter.model,
  }

  const commands = extractCommands(body)
  const workflows = extractWorkflows(body)

  return {
    frontmatter: parsedFrontmatter,
    rawBody: body,
    commands,
    workflows,
  }
}

function parseTools(tools: unknown): string[] {
  if (typeof tools === 'string') {
    return tools.split(',').map(t => t.trim()).filter(Boolean)
  }
  if (Array.isArray(tools)) {
    return tools.map(t => String(t).trim()).filter(Boolean)
  }
  return []
}

function extractCommands(body: string): ExtractedCommand[] {
  const commands: ExtractedCommand[] = []

  // Extract from code blocks
  const codeBlockRegex = /```(?:bash|sh|shell|cmd|powershell|python|node|npm|pip|cargo|docker)?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = codeBlockRegex.exec(body)) !== null) {
    const code = match[1].trim()
    if (code) {
      const subCommands = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'))
      for (const cmd of subCommands) {
        commands.push({
          type: detectCommandType(cmd),
          command: cmd.trim(),
          alternatives: findAlternatives(cmd.trim()),
        })
      }
    }
  }

  // Extract inline commands
  const inlinePatterns = [
    /(?:run|execute|install|setup)\s*:\s*`([^`]+)`/gi,
    /(?:npx|npm|pip|apt|brew|cargo|docker)\s+[^\n`]+/gi,
  ]

  for (const pattern of inlinePatterns) {
    while ((match = pattern.exec(body)) !== null) {
      const cmd = match[1] || match[0]
      if (cmd && !commands.some(c => c.command === cmd.trim())) {
        commands.push({
          type: detectCommandType(cmd),
          command: cmd.trim(),
          alternatives: findAlternatives(cmd.trim()),
        })
      }
    }
  }

  return commands
}

function detectCommandType(command: string): ExtractedCommand['type'] {
  const lower = command.toLowerCase()
  if (lower.includes('install') || lower.includes('pip install') || lower.includes('npm install') || lower.includes('apt install') || lower.includes('brew install')) {
    return 'install'
  }
  if (lower.includes('build') || lower.includes('compile') || lower.includes('cmake') || lower.includes('make')) {
    return 'build'
  }
  if (lower.includes('test') || lower.includes('jest') || lower.includes('vitest') || lower.includes('pytest')) {
    return 'test'
  }
  if (lower.includes('config') || lower.includes('setup') || lower.includes('init')) {
    return 'config'
  }
  return 'shell'
}

function findAlternatives(command: string): string[] {
  const alternatives: string[] = []
  const tool = command.split(' ')[0]

  const altMap: Record<string, string[]> = {
    'rg': ['grep -r', 'ag', 'ack'],
    'jq': ['python -m json.tool'],
    'semgrep': ['python -m semgrep'],
    'ag': ['grep -r', 'rg'],
    'brew': ['apt install', 'choco install'],
    'apt': ['yum install', 'pacman -S', 'brew install'],
  }

  if (altMap[tool]) {
    alternatives.push(...altMap[tool])
  }

  return alternatives
}

function extractWorkflows(body: string): Workflow[] {
  const workflows: Workflow[] = []

  // Look for workflow sections
  const workflowRegex = /##\s+(?:Workflow|Steps|Execution Flow|Process)[:\s]*([\s\S]*?)(?=##\s|$)/gi
  let match: RegExpExecArray | null
  while ((match = workflowRegex.exec(body)) !== null) {
    const section = match[1]
    const steps: WorkflowStep[] = []

    const stepRegex = /(?:###?\s+)?(?:Step\s+\d+[:\s]*|(\d+)\.\s+)([\s\S]*?)(?=###?\s+Step|\d+\.\s+##\s|$)/gi
    let stepMatch: RegExpExecArray | null
    while ((stepMatch = stepRegex.exec(section)) !== null) {
      steps.push({
        name: `Step ${stepMatch[1] || steps.length + 1}`,
        description: stepMatch[2].trim().slice(0, 200),
      })
    }

    if (steps.length > 0) {
      workflows.push({
        name: match[0].split('\n')[0].replace(/#+\s*/, '').trim(),
        steps,
      })
    }
  }

  return workflows
}
