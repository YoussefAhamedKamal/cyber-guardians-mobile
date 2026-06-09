const GITHUB_CONFIG_KEY = 'cg-github-config'

export const MAIN_REPO = { owner: 'ykamal-1', repo: 'cyber-guardians-mobile' }

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

function loadConfig(): GitHubConfig {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY)
    return raw ? JSON.parse(raw) : { token: '', owner: '', repo: '', branch: 'main' }
  } catch {
    return { token: '', owner: '', repo: '', branch: 'main' }
  }
}

export function getGitHubConfig(): GitHubConfig {
  return loadConfig()
}

export function setGitHubConfig(config: GitHubConfig): void {
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config))
}

export function isGitHubConfigured(): boolean {
  const c = loadConfig()
  return !!(c.token && c.owner && c.repo)
}

interface GitHubFileContent {
  sha: string
  content: string
}

async function apiFetch(path: string, method: string, body?: unknown): Promise<any> {
  const config = loadConfig()
  if (!config.token) throw new Error('GitHub token غير مُعد')

  const url = `https://api.github.com${path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  const opts: RequestInit = { method, headers }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  const res = await fetch(url, opts)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as any).message || res.statusText
    throw new Error(`GitHub API خطأ ${res.status}: ${msg}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export async function testGitHubConnection(): Promise<string> {
  try {
    const config = loadConfig()
    const data = await apiFetch(`/repos/${config.owner}/${config.repo}`, 'GET')
    return `✅ متصل — ${data.full_name} (${data.private ? 'خاص' : 'عام'})`
  } catch (e: any) {
    return `⚠️ ${e.message}`
  }
}

export async function getFileContent(filePath: string): Promise<GitHubFileContent> {
  const config = loadConfig()
  const data = await apiFetch(`/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath)}?ref=${config.branch}`, 'GET')
  return { sha: data.sha, content: atob(data.content) }
}

export async function createOrUpdateFile(
  filePath: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const config = loadConfig()
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: config.branch,
  }
  if (sha) body.sha = sha
  await apiFetch(`/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath)}`, 'PUT', body)
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

function generateCharactersTS(characters: Record<string, any>): string {
  const lines: string[] = [
    "import type { Character } from '@/types'\n",
    "export const characters: Record<string, Character> = {",
  ]

  for (const [id, ch] of Object.entries(characters)) {
    lines.push(`  ${id}: {`)
    lines.push(`    id: '${escapeStr(ch.id || id)}',`)
    lines.push(`    name: '${escapeStr(ch.name || '')}',`)
    lines.push(`    role: '${escapeStr(ch.role || '')}',`)
    lines.push(`    color: '${escapeStr(ch.color || '#FFFFFF')}',`)
    lines.push(`    personality: '${escapeStr(ch.personality || '')}',`)
    lines.push(`    gender: '${escapeStr(ch.gender || 'male')}' as const,`)
    if (ch.avatarUrl) lines.push(`    avatarUrl: '${escapeStr(ch.avatarUrl)}',`)
    if (ch.voiceUrl) lines.push(`    voiceUrl: '${escapeStr(ch.voiceUrl)}',`)
    lines.push('  },')
  }

  lines.push('}')
  return lines.join('\n') + '\n'
}

function generateDialogueTS(levels: any[]): string {
  const lines: string[] = [
    "import type { LevelData } from '@/types'\n",
    "export const levels: LevelData[] = [",
  ]

  for (const level of levels) {
    lines.push('  {')
    lines.push(`    id: ${level.id},`)
    lines.push(`    title: '${escapeStr(level.title || '')}',`)
    lines.push(`    subtitle: '${escapeStr(level.subtitle || '')}',`)
    lines.push(`    threat: '${escapeStr(level.threat || '')}',`)
    lines.push(`    challengeType: '${escapeStr(level.challengeType || '')}',`)
    lines.push(`    focusCharacterId: '${escapeStr(level.focusCharacterId || '')}',`)
    if (level.difficulty) lines.push(`    difficulty: '${escapeStr(level.difficulty)}' as const,`)
    if (level.points !== undefined) lines.push(`    points: ${level.points},`)
    if (level.timeLimit !== undefined) lines.push(`    timeLimit: ${level.timeLimit},`)
    if (level.unlockRequirement !== undefined) lines.push(`    unlockRequirement: ${level.unlockRequirement},`)
    if (level.backgroundImage) lines.push(`    backgroundImage: '${escapeStr(level.backgroundImage)}',`)
    if (level.backgroundMusic) lines.push(`    backgroundMusic: '${escapeStr(level.backgroundMusic)}',`)
    if (level.soundEffects && level.soundEffects.length > 0) {
      lines.push(`    soundEffects: [${level.soundEffects.map((s: string) => `'${escapeStr(s)}'`).join(', ')}],`)
    }
    if (level.hints && level.hints.length > 0) {
      lines.push(`    hints: [${level.hints.map((h: string) => `'${escapeStr(h)}'`).join(', ')}],`)
    }
    if (level.intro && level.intro.length > 0) {
      lines.push('    intro: [')
      for (const line of level.intro) {
        lines.push(`      { speakerId: '${escapeStr(line.speakerId)}', text: '${escapeStr(line.text)}' },`)
      }
      lines.push('    ],')
    }
    if (level.outro && level.outro.length > 0) {
      lines.push('    outro: [')
      for (const line of level.outro) {
        lines.push(`      { speakerId: '${escapeStr(line.speakerId)}', text: '${escapeStr(line.text)}' },`)
      }
      lines.push('    ],')
    }
    if (level.challengeData) {
      lines.push(`    challengeData: ${JSON.stringify(level.challengeData, null, 6).replace(/\n/g, '\n      ')},`)
    }
    lines.push('  },')
  }

  lines.push(']')
  return lines.join('\n') + '\n'
}

function generateGameMetaTS(meta: Record<string, unknown>): string {
  const lines: string[] = [
    "import type { GameMeta } from '@/types'\n",
    "export const gameMeta: GameMeta = ",
    JSON.stringify(meta, null, 2),
    '',
  ]
  return lines.join('\n')
}

export async function pushContentToGitHub(
  contentData: {
    gameMeta: Record<string, unknown>
    levels: unknown[]
    characters: Record<string, unknown>
  },
  commitMessage?: string
): Promise<string[]> {
  const results: string[] = []
  const msg = commitMessage || '🎮 تحديث محتوى اللعبة عبر هيئة التدريس'

  try {
    const ts = generateCharactersTS(contentData.characters)
    let existing: GitHubFileContent | null = null
    try { existing = await getFileContent('src/data/characters.ts') } catch {}
    await createOrUpdateFile('src/data/characters.ts', ts, `${msg} — الشخصيات`, existing?.sha)
    results.push('✅ characters.ts')
  } catch (e: any) {
    results.push(`❌ characters.ts: ${e.message}`)
  }

  try {
    const ts = generateDialogueTS(contentData.levels)
    let existing: GitHubFileContent | null = null
    try { existing = await getFileContent('src/data/dialogue.ts') } catch {}
    await createOrUpdateFile('src/data/dialogue.ts', ts, `${msg} — المستويات`, existing?.sha)
    results.push('✅ dialogue.ts')
  } catch (e: any) {
    results.push(`❌ dialogue.ts: ${e.message}`)
  }

  try {
    const ts = generateGameMetaTS(contentData.gameMeta)
    let existing: GitHubFileContent | null = null
    try { existing = await getFileContent('src/data/gameMeta.ts') } catch {}
    await createOrUpdateFile('src/data/gameMeta.ts', ts, `${msg} — الإعدادات`, existing?.sha)
    results.push('✅ gameMeta.ts')
  } catch (e: any) {
    results.push(`❌ gameMeta.ts: ${e.message}`)
  }

  try {
    let existingPkg: GitHubFileContent | null = null
    try { existingPkg = await getFileContent('package.json') } catch {}
    const pkgTs = `// هذا الملف يتم تحديثه تلقائياً عبر GitHub API\n// آخر تحديث: ${new Date().toISOString()}\n`
    await createOrUpdateFile('src/data/LAST_SYNC.txt', pkgTs, `${msg} — آخر مزامنة`, existingPkg?.sha)
    results.push('✅ LAST_SYNC.txt')
  } catch (e: any) {
    results.push(`❌ LAST_SYNC.txt: ${e.message}`)
  }

  return results
}

export async function pushCustomFile(
  filePath: string,
  content: string,
  commitMessage: string
): Promise<string> {
  let existing: GitHubFileContent | null = null
  try { existing = await getFileContent(filePath) } catch {}
  await createOrUpdateFile(filePath, content, commitMessage, existing?.sha)
  return `✅ ${filePath}`
}

export async function getGitHubUsername(): Promise<string> {
  const data = await apiFetch('/user', 'GET')
  return data.login
}

export async function forkMainRepo(): Promise<{ owner: string; repo: string; url: string }> {
  const data = await apiFetch(`/repos/${MAIN_REPO.owner}/${MAIN_REPO.repo}/forks`, 'POST')
  return {
    owner: data.owner.login,
    repo: data.name,
    url: data.html_url,
  }
}

export async function waitForForkReady(owner: string, repo: string, maxWait = 30000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    try {
      const data = await apiFetch(`/repos/${owner}/${repo}`, 'GET')
      if (data && !data.message) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 2000))
  }
  return false
}

export async function enableGitHubPages(owner: string, repo: string, branch = 'main'): Promise<string> {
  try {
    await apiFetch(`/repos/${owner}/${repo}/pages`, 'POST', {
      source: { branch, path: '/' },
    })
    return `✅ GitHub Pages مفعّل —他会 يعمل على: https://${owner}.github.io/${repo}/`
  } catch (e: any) {
    if (e.message.includes('422') || e.message.includes('already')) {
      return `✅ GitHub Pages مفعّل مسبقاً — https://${owner}.github.io/${repo}/`
    }
    return `⚠️ Pages: ${e.message}`
  }
}

export async function setupForkWithPages(): Promise<{ owner: string; repo: string; url: string; pagesUrl: string }> {
  const result = await forkMainRepo()
  await waitForForkReady(result.owner, result.repo)
  const pagesMsg = await enableGitHubPages(result.owner, result.repo)
  return {
    ...result,
    pagesUrl: `https://${result.owner}.github.io/${result.repo}/`,
  }
}
