import { generateCharactersTS, generateDialogueTS, generateGameMetaTS } from './github'
import { MAIN_REPO } from './github'

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GIS_URL = 'https://accounts.google.com/gsi/client'

let accessToken: string | null = null
let tokenClient: any = null
let gisLoaded = false

export function loadGIS(): Promise<void> {
  if (gisLoaded) return Promise.resolve()
  if ((window as any).google?.accounts) { gisLoaded = true; return Promise.resolve() }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_URL
    s.async = true
    s.onload = () => { gisLoaded = true; resolve() }
    s.onerror = () => reject(new Error('فشل تحميل مكتبة Google Identity Services'))
    document.head.appendChild(s)
  })
}

export function initGoogleDrive(clientId: string): void {
  if (!(window as any).google?.accounts) throw new Error('GIS غير محمل')
  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPE,
  })
}

export function loginToDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error('لم يتم تهيئة Google Drive بعد')); return }
    tokenClient.callback = (resp: any) => {
      if (resp.access_token) {
        accessToken = resp.access_token
        resolve(resp.access_token)
      } else reject(new Error(resp.error_description || 'فشل تسجيل الدخول'))
    }
    tokenClient.requestAccessToken()
  })
}

export function isLoggedIn(): boolean {
  return accessToken !== null
}

export function isInitialized(): boolean {
  return tokenClient !== null
}

export function logout(): void {
  accessToken = null
}

function getAuthHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` }
}

async function driveFetch(url: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Google Drive API خطأ ${res.status}`)
  }
  return res.json()
}

export async function createFolder(name: string, parentId?: string): Promise<string> {
  const body: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) body.parents = [parentId]

  const data = await driveFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return data.id
}

async function uploadFile(
  name: string,
  blob: Blob,
  parentId: string,
  mimeType: string
): Promise<string> {
  const metadata = JSON.stringify({ name, parents: [parentId], mimeType })
  const form = new FormData()
  form.append('metadata', new Blob([metadata], { type: 'application/json' }))
  form.append('file', blob)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    { method: 'POST', headers: getAuthHeaders(), body: form }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Google Drive رفع خطأ ${res.status}`)
  }
  const data = await res.json()
  return data.id
}

export async function uploadTextFile(
  name: string,
  content: string,
  parentId: string,
  mimeType = 'text/plain'
): Promise<string> {
  return uploadFile(name, new Blob([content], { type: mimeType }), parentId, mimeType)
}

export async function uploadJSONFile(
  name: string,
  data: unknown,
  parentId: string
): Promise<string> {
  const json = JSON.stringify(data, null, 2)
  return uploadFile(name.endsWith('.json') ? name : `${name}.json`, new Blob([json], { type: 'application/json' }), parentId, 'application/json')
}

function base64ToBlob(b64: string, mime: string): Blob {
  const binary = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function decodeB64UTF8(b64: string): string {
  try { return decodeURIComponent(escape(atob(b64))) } catch { try { return atob(b64) } catch { return b64 } }
}

function mimeFromPath(path: string): string {
  const ext = path.match(/\.[^.]+$/)?.[0]?.toLowerCase() || ''
  const map: Record<string, string> = {
    '.html': 'text/html', '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript', '.mjs': 'application/javascript',
    '.ts': 'application/x-typescript', '.tsx': 'application/x-typescript',
    '.json': 'application/json',
    '.xml': 'application/xml', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
    '.mp4': 'video/mp4', '.webm': 'video/webm',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.map': 'application/json',
    '.md': 'text/markdown',
    '.yaml': 'text/yaml', '.yml': 'text/yaml',
    '.sh': 'text/x-shellscript',
    '.txt': 'text/plain',
  }
  return map[ext] || 'application/octet-stream'
}

export async function uploadContentToDrive(
  contentData: {
    gameMeta: Record<string, unknown>
    levels: unknown[]
    characters: Record<string, unknown>
  },
  folderName = 'Cyber Guardians - Content Backup'
): Promise<string[]> {
  const results: string[] = []

  const folderId = await createFolder(folderName)
  results.push(`✅ "${folderName}" تم إنشاء المجلد`)

  await uploadJSONFile('gameMeta', contentData.gameMeta, folderId)
  results.push('✅ gameMeta.json')

  await uploadJSONFile('levels', contentData.levels, folderId)
  results.push('✅ levels.json')

  await uploadJSONFile('characters', contentData.characters, folderId)
  results.push('✅ characters.json')

  const now = new Date().toISOString().replace(/[:.]/g, '-')
  await uploadTextFile('backup-info.txt', `تاريخ النسخ: ${now}\nالمشروع: Cyber Guardians\nعدد المستويات: ${contentData.levels.length}\nعدد الشخصيات: ${Object.keys(contentData.characters).length}\n`, folderId)
  results.push('✅ backup-info.txt')

  return results
}

// Folder cache to avoid recreating folders
const folderCache = new Map<string, string>()

function clearFolderCache(): void {
  folderCache.clear()
}

async function ensureFolder(dirPath: string, rootId: string): Promise<string> {
  if (!dirPath || dirPath === '.' || dirPath === '/') return rootId
  const key = dirPath.replace(/^\/+|\/+$/g, '')
  if (folderCache.has(key)) return folderCache.get(key)!

  const parts = key.split('/')
  let parentId = rootId

  for (let i = 0; i < parts.length; i++) {
    const subPath = parts.slice(0, i + 1).join('/')
    if (folderCache.has(subPath)) {
      parentId = folderCache.get(subPath)!
      continue
    }
    const partName = parts[i]
    if (!partName) continue
    const folderId = await createFolder(partName, parentId)
    folderCache.set(subPath, folderId)
    parentId = folderId
  }

  return parentId
}

export async function uploadFullRepoToDrive(
  sourceOwner: string,
  sourceRepo: string,
  ghToken: string,
  rootFolderName: string,
  contentData?: {
    gameMeta: Record<string, unknown>
    levels: unknown[]
    characters: Record<string, unknown>
  }
): Promise<string[]> {
  const results: string[] = []
  const GH_BASE = 'https://api.github.com'
  const ghHeaders: Record<string, string> = {
    Authorization: `Bearer ${ghToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  async function ghFetch(path: string): Promise<any> {
    const res = await fetch(`${GH_BASE}${path}`, { headers: ghHeaders })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `GitHub API خطأ ${res.status}`)
    }
    return res.json()
  }

  clearFolderCache()
  const isFromMain = sourceOwner === MAIN_REPO.owner && sourceRepo === MAIN_REPO.repo

  // === Step 1: Get source tree ===
  let sourceTree: Array<{ path: string; mode: string; type: string; sha: string }>
  try {
    const refData = await ghFetch(`/repos/${sourceOwner}/${sourceRepo}/git/refs/heads/main`)
    const commitData = await ghFetch(`/repos/${sourceOwner}/${sourceRepo}/git/commits/${refData.object.sha}`)
    const treeData = await ghFetch(`/repos/${sourceOwner}/${sourceRepo}/git/trees/${commitData.tree.sha}?recursive=1`)
    sourceTree = treeData.tree
  } catch (e: any) {
    results.push(`❌ فشل قراءة المصدر: ${e.message}`)
    return results
  }

  // === Step 2: Create root folder ===
  let rootId: string
  try {
    rootId = await createFolder(rootFolderName)
    results.push(`✅ "${rootFolderName}" تم إنشاء المجلد`)
  } catch (e: any) {
    results.push(`❌ فشل إنشاء المجلد الرئيسي: ${e.message}`)
    return results
  }

  // === Step 3: Upload each file ===
  for (const item of sourceTree) {
    if (item.type !== 'blob') continue

    let contentBase64: string
    try {
      const blobData = await ghFetch(`/repos/${sourceOwner}/${sourceRepo}/git/blobs/${item.sha}`)
      contentBase64 = blobData.content
    } catch (e: any) {
      results.push(`⚠️ ${item.path}: فشل تحميل (${e.message})`)
      continue
    }

    try {
      if (item.path === 'src/data/characters.ts' && contentData) {
        const ts = generateCharactersTS(contentData.characters)
        contentBase64 = btoa(unescape(encodeURIComponent(ts)))
      } else if (item.path === 'src/data/dialogue.ts' && contentData) {
        const ts = generateDialogueTS(contentData.levels)
        contentBase64 = btoa(unescape(encodeURIComponent(ts)))
      } else if (item.path === 'src/data/gameMeta.ts' && contentData) {
        const ts = generateGameMetaTS(contentData.gameMeta)
        contentBase64 = btoa(unescape(encodeURIComponent(ts)))
      }

      // Determine parent folder and file name
      const dirPath = item.path.includes('/') ? item.path.substring(0, item.path.lastIndexOf('/')) : ''
      const fileName = item.path.includes('/') ? item.path.substring(item.path.lastIndexOf('/') + 1) : item.path

      const parentId = await ensureFolder(dirPath, rootId)
      const mime = mimeFromPath(item.path)

      // Check if it's likely text or binary
      const isText = !['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.wav', '.ogg', '.pdf', '.zip'].includes(item.path.match(/\.[^.]+$/)?.[0]?.toLowerCase() || '')

      if (isText) {
        const text = decodeB64UTF8(contentBase64)
        await uploadTextFile(fileName, text, parentId, mime)
      } else {
        const blob = base64ToBlob(contentBase64, mime)
        await uploadFile(fileName, blob, parentId, mime)
      }

      results.push(`✅ ${item.path}`)
    } catch (e: any) {
      results.push(`❌ ${item.path}: ${e.message}`)
    }
  }

  return results
}
