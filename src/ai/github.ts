const GITHUB_CONFIG_KEY = 'cg-github-config-enc'
const GITHUB_KEY_SESSION = 'cg-gh-crypto-key'
const GH_FALLBACK_KEY = 'cg-gh-xor-fallback-key'

export const MAIN_REPO = { owner: 'YoussefAhamedKamal', repo: 'cyber-guardians-mobile' }

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

const EMPTY_CONFIG: GitHubConfig = { token: '', owner: '', repo: '', branch: 'main' }

let _cache: GitHubConfig = { ...EMPTY_CONFIG }

function b64Encode(bytes: Uint8Array): string {
  let b64 = ''
  for (let i = 0; i < bytes.length; i++) {
    b64 += String.fromCharCode(bytes[i]!)
  }
  return btoa(b64)
}

function b64DecodeToBytes(b64: string): Uint8Array {
  const decoded = atob(b64)
  const bytes = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i)
  }
  return bytes
}

function xorEncode(str: string, key: number[]): string {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key[i % key.length]!)
  }
  return btoa(result)
}

function xorDecode(b64Str: string, key: number[]): string {
  const bytes = b64DecodeToBytes(b64Str)
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]! ^ key[i % key.length]!)
  }
  return result
}

function getFallbackKey(): number[] {
  const stored = localStorage.getItem(GH_FALLBACK_KEY)
  if (stored) {
    try {
      const arr = JSON.parse(stored)
      if (Array.isArray(arr) && arr.length === 32) return arr
    } catch {}
  }
  const key: number[] = []
  for (let i = 0; i < 32; i++) {
    key.push(Math.floor(Math.random() * 256))
  }
  localStorage.setItem(GH_FALLBACK_KEY, JSON.stringify(key))
  return key
}

const hasCryptoSubtle = typeof crypto !== 'undefined' && !!crypto.subtle

async function generateAndStoreKey(): Promise<CryptoKey | null> {
  if (!hasCryptoSubtle) return null
  try {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    const exported = new Uint8Array(await crypto.subtle.exportKey('raw', key))
    localStorage.setItem(GITHUB_KEY_SESSION, b64Encode(exported))
    return key
  } catch {
    return null
  }
}

async function getAesKey(): Promise<CryptoKey | null> {
  if (!hasCryptoSubtle) return null
  const stored = localStorage.getItem(GITHUB_KEY_SESSION)
  if (stored) {
    try {
      const raw = b64DecodeToBytes(stored)
      const key = await crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
      return key
    } catch {
      localStorage.removeItem(GITHUB_KEY_SESSION)
    }
  }
  return generateAndStoreKey()
}

async function migrateXorIfNeeded(): Promise<void> {
  const raw = localStorage.getItem(GITHUB_CONFIG_KEY)
  if (!raw) return
  try {
    const bytes = b64DecodeToBytes(raw)
    if (bytes.length < 13) return
    const testKey = JSON.parse(localStorage.getItem('cg-gh-xor-key') || '[]')
    if (!Array.isArray(testKey) || testKey.length !== 32) return
    const json = xorDecode(raw, testKey)
    const config = JSON.parse(json) as GitHubConfig
    if (!config.token && !config.owner) return
    localStorage.removeItem('cg-gh-xor-key')
    await saveConfig(config)
  } catch {}
}

async function loadConfig(): Promise<GitHubConfig> {
  const legacy = localStorage.getItem('cg-github-config')
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as GitHubConfig
      await saveConfig(parsed)
      localStorage.removeItem('cg-github-config')
      return parsed
    } catch {}
  }
  await migrateXorIfNeeded()
  const raw = localStorage.getItem(GITHUB_CONFIG_KEY)
  if (!raw) return { ...EMPTY_CONFIG }
  try {
    const aesKey = await getAesKey()
    if (aesKey) {
      const combined = b64DecodeToBytes(raw)
      const iv = combined.slice(0, 12)
      const data = combined.slice(12)
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, data)
      return JSON.parse(new TextDecoder().decode(decrypted))
    }
    const xorKey = getFallbackKey()
    const json = xorDecode(raw, xorKey)
    return JSON.parse(json)
  } catch {
    localStorage.removeItem(GITHUB_CONFIG_KEY)
    return { ...EMPTY_CONFIG }
  }
}

async function saveConfig(config: GitHubConfig): Promise<void> {
  const json = JSON.stringify(config)
  const aesKey = await getAesKey()
  if (aesKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(json)
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded)
    const combined = new Uint8Array(12 + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), 12)
    localStorage.setItem(GITHUB_CONFIG_KEY, b64Encode(combined))
  } else {
    const xorKey = getFallbackKey()
    localStorage.setItem(GITHUB_CONFIG_KEY, xorEncode(json, xorKey))
  }
}

loadConfig().then(c => { _cache = c })

export function getGitHubConfig(): GitHubConfig {
  return _cache
}

export async function setGitHubConfig(config: GitHubConfig): Promise<void> {
  _cache = config
  await saveConfig(config)
}

export function isGitHubConfigured(): boolean {
  return !!(_cache.token && _cache.owner && _cache.repo)
}

interface GitHubFileContent {
  sha: string
  content: string
}

import { loadWorkerConfig, saveWorkerConfig, GH_WORKER_KEY } from '@/utils/workerCrypto'

export interface GitHubWorkerConfig {
  url: string
  authToken: string
}

let _ghWorkerCache: GitHubWorkerConfig | null = null
let _ghWorkerLoaded = false

async function loadGhWorkerConfig(): Promise<GitHubWorkerConfig | null> {
  if (_ghWorkerLoaded) return _ghWorkerCache
  _ghWorkerCache = await loadWorkerConfig(GH_WORKER_KEY) as GitHubWorkerConfig | null
  _ghWorkerLoaded = true
  return _ghWorkerCache
}

export async function setGitHubWorkerConfig(config: GitHubWorkerConfig): Promise<void> {
  _ghWorkerCache = config
  _ghWorkerLoaded = true
  await saveWorkerConfig(GH_WORKER_KEY, config)
}

export async function getGitHubWorkerUrl(): Promise<string | null> {
  return (await loadGhWorkerConfig())?.url || null
}

async function isGitHubWorkerEnabled(): Promise<boolean> {
  return (await loadGhWorkerConfig()) !== null
}

const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const API_BASE = isDev ? '/github-api' : 'https://api.github.com'
const RAW_BASE = isDev ? '/github-raw' : 'https://raw.githubusercontent.com'

async function apiFetch(path: string, method: string, body?: unknown, timeoutMs = 15000): Promise<any> {
  const config = _cache
  const worker = await loadGhWorkerConfig()

  if (worker) {
    const targetUrl = `https://api.github.com${path}`
    const proxyUrl = `${worker.url.replace(/\/+$/, '')}?target=${encodeURIComponent(targetUrl)}`
    const headers: Record<string, string> = {
      'X-Auth-Token': worker.authToken,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), timeoutMs)
    const opts: RequestInit = { method, headers, signal: ac.signal }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }

    let res: Response
    try {
      res = await fetch(proxyUrl, opts)
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('طلب GitHub لم يكتمل — انتهت المهلة')
      throw new Error('طلب GitHub فشل — تحقق من اتصالك بالإنترنت')
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = (err as any).message || res.statusText
      throw new Error(`GitHub API خطأ ${res.status}: ${msg}`)
    }

    if (res.status === 204) return null
    return res.json()
  }

  if (!config.token) throw new Error('GitHub token غير مُعد')

  const url = `${API_BASE}${path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  const opts: RequestInit = { method, headers, signal: ac.signal }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(url, opts)
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('طلب GitHub لم يكتمل — انتهت المهلة (15 ثانية)')
    throw new Error('طلب GitHub فشل — تحقق من اتصالك بالإنترنت')
  } finally {
    clearTimeout(timer)
  }

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
    const config = _cache
    const data = await apiFetch(`/repos/${config.owner}/${config.repo}`, 'GET')
    return `✅ متصل — ${data.full_name} (${data.private ? 'خاص' : 'عام'})`
  } catch (e: any) {
    return `⚠️ ${e.message}`
  }
}

export async function getFileContent(filePath: string): Promise<GitHubFileContent> {
  const config = _cache
  if (config.token) {
    try {
      const data = await apiFetch(`/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath)}?ref=${config.branch}`, 'GET')
      const decoded = decodeURIComponent(escape(atob(data.content)))
      return { sha: data.sha, content: decoded }
    } catch (e: any) {
      console.warn('GitHub API failed, trying raw fallback:', e.message)
    }
  }
  const rawUrl = `${RAW_BASE}/${config.token ? config.owner : MAIN_REPO.owner}/${config.token ? config.repo : MAIN_REPO.repo}/${config.token ? config.branch : 'main'}/${filePath}`
  const res = await fetch(rawUrl)
  if (!res.ok) throw new Error(`فشل تحميل الملف: ${res.status}`)
  return { sha: '', content: await res.text() }
}

export async function createOrUpdateFile(
  filePath: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const config = _cache
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: config.branch,
  }
  if (sha) body.sha = sha
  await apiFetch(`/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath)}`, 'PUT', body)
}

function escapeStr(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

export function generateCharactersTS(characters: Record<string, any>): string {
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

export function generateDialogueTS(levels: any[]): string {
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

export function generateGameMetaTS(meta: Record<string, unknown>): string {
  const lines: string[] = [
    "import type { GameMeta } from '@/types'\n",
    "export const gameMeta: GameMeta = ",
    JSON.stringify(meta, null, 2),
    '',
  ]
  return lines.join('\n')
}

function updateViteBasePath(content: string, repoName: string): string {
  const baseRegex = /base\s*[:=]\s*['"`][^'"`]*['"`]/
  if (baseRegex.test(content)) {
    return content.replace(/(base\s*[:=]\s*)['"`][^'"`]*['"`]/, `$1'/${repoName}/'`)
  }
  const withConfig = content.replace(/(defineConfig\s*\(\s*\{)/, `$1\n  base: '/${repoName}/',`)
  if (withConfig !== content) return withConfig
  return content.replace(/(export\s+default\s+)/, `const BASE_PATH = '/${repoName}/';\n\n$1`)
}

function decodeB64UTF8(b64: string): string {
  try { return decodeURIComponent(escape(atob(b64))) } catch { try { return atob(b64) } catch { return b64 } }
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

  const config = _cache
  try {
    await apiFetch(`/repos/${config.owner}/${config.repo}`, 'GET')
  } catch {
    throw new Error(`المستودع ${config.owner}/${config.repo} غير موجود. أنشئ مستودعاً جديداً أولاً.`)
  }

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
    const pkgTs = `// هذا الملف يتم تحديثه تلقائياً عبر GitHub API\n// آخر تحديث: ${new Date().toISOString()}\n`
    let existing: GitHubFileContent | null = null
    try { existing = await getFileContent('src/data/LAST_SYNC.txt') } catch {}
    await createOrUpdateFile('src/data/LAST_SYNC.txt', pkgTs, `${msg} — آخر مزامنة`, existing?.sha)
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

export async function pushSourceFilesToGitHub(
  files: Record<string, string>,
  commitMessage: string
): Promise<string[]> {
  const results: string[] = []
  const config = _cache

  try {
    await apiFetch(`/repos/${config.owner}/${config.repo}`, 'GET')
  } catch {
    throw new Error(`المستودع ${config.owner}/${config.repo} غير موجود. أنشئ مستودعاً جديداً أولاً.`)
  }

  for (const [filePath, content] of Object.entries(files)) {
    try {
      let existing: GitHubFileContent | null = null
      try { existing = await getFileContent(filePath) } catch {}
      await createOrUpdateFile(filePath, content, `${commitMessage} — ${filePath}`, existing?.sha)
      results.push(`✅ ${filePath}`)
    } catch (e: any) {
      results.push(`❌ ${filePath}: ${e.message}`)
    }
  }

  return results
}

export async function getGitHubUsername(): Promise<string> {
  const data = await apiFetch('/user', 'GET')
  return data.login
}

export async function resolveGithubOwner(input: string): Promise<string> {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('أدخل اسم المستخدم أو الإيميل')

  if (!trimmed.includes('@')) {
    try {
      await apiFetch(`/users/${trimmed}`, 'GET')
      return trimmed
    } catch {
      throw new Error(`المستخدم "${trimmed}" غير موجود على GitHub`)
    }
  }

  try {
    const data = await apiFetch(`/search/users?q=${encodeURIComponent(trimmed)}+in:email`, 'GET')
    if (data.items && data.items.length > 0) {
      return data.items[0].login
    }
    throw new Error(`لم يتم العثور على حساب GitHub لهذا الإيميل: ${trimmed}`)
  } catch (e: any) {
    if (e.message.includes('لم يتم العثور')) throw e
    throw new Error(`خطأ في البحث: ${e.message}`)
  }
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
    return `✅ GitHub Pages مفعّل — https://${owner}.github.io/${repo}/`
  } catch (e: any) {
    if (e.message.includes('422') || e.message.includes('already')) {
      return `✅ GitHub Pages مفعّل مسبقاً — https://${owner}.github.io/${repo}/`
    }
    return `⚠️ Pages: ${e.message}`
  }
}

export async function listRepoContents(owner: string, repo: string, path = ''): Promise<string[]> {
  const data = await apiFetch(`/repos/${owner}/${repo}/contents/${path}`, 'GET')
  if (Array.isArray(data)) {
    return data.map((f: any) => `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`)
  }
  return []
}

export async function createNewRepo(name: string, description: string): Promise<{ owner: string; repo: string; url: string }> {
  const data = await apiFetch('/user/repos', 'POST', {
    name,
    description,
    auto_init: false,
    private: false,
  })
  return { owner: data.owner.login, repo: data.name, url: data.html_url }
}

export async function createNewBranch(owner: string, repo: string, branchName: string, baseSha: string): Promise<void> {
  const baseRef = await apiFetch(`/repos/${owner}/${repo}/git/refs/heads/main`, 'GET')
  await apiFetch(`/repos/${owner}/${repo}/git/refs`, 'POST', {
    ref: `refs/heads/${branchName}`,
    sha: baseRef.object.sha,
  })
}

export async function pushAllContentToNewRepo(
  newOwner: string,
  newRepo: string,
  branchName: string,
  contentData: {
    gameMeta: Record<string, unknown>
    levels: unknown[]
    characters: Record<string, unknown>
  }
): Promise<string[]> {
  const results: string[] = []
  const msg = '🎮 إعداد اللعبة — رفع أولي للمحتوى'

  const tsCharacters = generateCharactersTS(contentData.characters)
  try {
    await apiFetch(`/repos/${newOwner}/${newRepo}/contents/src/data/characters.ts`, 'PUT', {
      message: `${msg} — الشخصيات`,
      content: btoa(unescape(encodeURIComponent(tsCharacters))),
      branch: branchName,
    })
    results.push('✅ characters.ts')
  } catch (e: any) { results.push(`❌ characters.ts: ${e.message}`) }

  const tsDialogue = generateDialogueTS(contentData.levels)
  try {
    await apiFetch(`/repos/${newOwner}/${newRepo}/contents/src/data/dialogue.ts`, 'PUT', {
      message: `${msg} — المستويات`,
      content: btoa(unescape(encodeURIComponent(tsDialogue))),
      branch: branchName,
    })
    results.push('✅ dialogue.ts')
  } catch (e: any) { results.push(`❌ dialogue.ts: ${e.message}`) }

  const tsMeta = generateGameMetaTS(contentData.gameMeta)
  try {
    await apiFetch(`/repos/${newOwner}/${newRepo}/contents/src/data/gameMeta.ts`, 'PUT', {
      message: `${msg} — الإعدادات`,
      content: btoa(unescape(encodeURIComponent(tsMeta))),
      branch: branchName,
    })
    results.push('✅ gameMeta.ts')
  } catch (e: any) { results.push(`❌ gameMeta.ts: ${e.message}`) }

  return results
}

export async function copyEntireRepo(
  sourceOwner: string,
  sourceRepo: string,
  targetOwner: string,
  targetRepo: string,
  targetBranch: string,
  contentData: {
    gameMeta: Record<string, unknown>
    levels: unknown[]
    characters: Record<string, unknown>
  }
): Promise<string[]> {
  const results: string[] = []
  const isFromMain = sourceOwner === MAIN_REPO.owner && sourceRepo === MAIN_REPO.repo

  let sourceTree: Array<{ path: string; mode: string; type: string; sha: string; size: number }>
  try {
    const refData = await apiFetch(`/repos/${sourceOwner}/${sourceRepo}/git/refs/heads/main`, 'GET')
    const commitData = await apiFetch(`/repos/${sourceOwner}/${sourceRepo}/git/commits/${refData.object.sha}`, 'GET')
    const treeData = await apiFetch(`/repos/${sourceOwner}/${sourceRepo}/git/trees/${commitData.tree.sha}?recursive=1`, 'GET')
    sourceTree = treeData.tree
  } catch (e: any) {
    results.push(`❌ فشل قراءة شجرة المصدر: ${e.message}`)
    return results
  }

  const LARGE_FILE_THRESHOLD = 90 * 1024 * 1024
  const skippedLarge: string[] = []

  for (const item of sourceTree) {
    if (item.type !== 'blob') continue

    const BINARY_EXTS = ['.mp4', '.mp3', '.wav', '.webm', '.ogg', '.avi', '.mov', '.mkv', '.flac', '.ttf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.pdf']
    const ext = '.' + item.path.split('.').pop()?.toLowerCase()
    const isBinary = BINARY_EXTS.includes(ext)

    if (item.size && item.size > LARGE_FILE_THRESHOLD) {
      skippedLarge.push(`${item.path} (${(item.size / 1024 / 1024).toFixed(1)}MB)`)
      results.push(`⏭️ ${item.path}: تخطي — ملف كبير جداً (${(item.size / 1024 / 1024).toFixed(1)}MB > 90MB)`)
      continue
    }

    let contentBase64: string
    try {
      const blobData = await apiFetch(`/repos/${sourceOwner}/${sourceRepo}/git/blobs/${item.sha}`, 'GET', undefined, isBinary ? 120000 : 15000)
      if (isBinary) {
        contentBase64 = blobData.content
      } else {
        contentBase64 = btoa(unescape(encodeURIComponent(decodeURIComponent(escape(atob(blobData.content))))))
      }
    } catch (e: any) {
      results.push(`⚠️ ${item.path}: فشل تحميل (${e.message})`)
      continue
    }

    try {
      if (!isBinary) {
        let contentStr = decodeURIComponent(escape(atob(contentBase64)))
        if (item.path === 'src/data/characters.ts') {
          contentStr = generateCharactersTS(contentData.characters)
        } else if (item.path === 'src/data/dialogue.ts') {
          contentStr = generateDialogueTS(contentData.levels)
        } else if (item.path === 'src/data/gameMeta.ts') {
          contentStr = generateGameMetaTS(contentData.gameMeta)
        } else if (item.path === 'vite.config.ts') {
          contentStr = updateViteBasePath(contentStr, targetRepo)
        } else if (item.path === 'package.json') {
          contentStr = contentStr.replace(/"name":\s*"[^"]*"/, `"name": "${targetRepo}"`)
        } else if (item.path === 'package-lock.json') {
          contentStr = contentStr.replace(/"name":\s*"[^"]*"/g, `"name": "${targetRepo}"`)
        } else if (item.path === 'README.md' && isFromMain) {
          contentStr = contentStr.replace(/YoussefAhamedKamal/g, targetOwner).replace(/cyber-guardians-mobile/g, targetRepo)
        }
        contentBase64 = btoa(unescape(encodeURIComponent(contentStr)))
      }

      const timeoutMs = isBinary ? 120000 : 30000
      await apiFetch(`/repos/${targetOwner}/${targetRepo}/contents/${encodeURIComponent(item.path)}`, 'PUT', {
        message: `🎮 إضافة ${item.path}`,
        content: contentBase64,
        branch: targetBranch,
      }, timeoutMs)
      results.push(`✅ ${item.path}`)
    } catch (e: any) {
      results.push(`❌ ${item.path}: ${e.message}`)
    }
  }

  if (results.filter(r => r.startsWith('✅')).length === 0) {
    results.push('❌ لا توجد ملفات لنسخها')
  }

  if (skippedLarge.length > 0) {
    results.push(`⚠️ تخطي ${skippedLarge.length} ملف كبير (>90MB): ${skippedLarge.join(', ')}`)
  }

  return results
}

export async function setupDirectEdit(): Promise<{ owner: string; repo: string; pagesUrl: string }> {
  const config = _cache
  try { await enableGitHubPages(config.owner, config.repo, config.branch) } catch {}
  return {
    owner: config.owner,
    repo: config.repo,
    pagesUrl: `https://${config.owner}.github.io/${config.repo}/`,
  }
}

export async function setupForkWithPages(): Promise<{ owner: string; repo: string; url: string; pagesUrl: string }> {
  const result = await forkMainRepo()
  await waitForForkReady(result.owner, result.repo)
  try { await enableGitHubPages(result.owner, result.repo) } catch {}
  return {
    ...result,
    pagesUrl: `https://${result.owner}.github.io/${result.repo}/`,
  }
}
