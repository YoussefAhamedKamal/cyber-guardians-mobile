import { readFile, writeFile, readdir, mkdir, rm, rename } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'

export interface FileOperation {
  type: 'read' | 'write' | 'list' | 'delete' | 'move' | 'mkdir' | 'exists' | 'search'
  path: string
  content?: string
  pattern?: string
  recursive?: boolean
}

export interface FileResult {
  success: boolean
  operation: string
  path: string
  content?: string
  files?: string[]
  error?: string
}

export async function executeFileOp(op: FileOperation): Promise<FileResult> {
  try {
    switch (op.type) {
      case 'read': {
        const content = await readFile(op.path, 'utf-8')
        return { success: true, operation: 'read', path: op.path, content }
      }

      case 'write': {
        const dir = dirname(op.path)
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true })
        }
        await writeFile(op.path, op.content || '', 'utf-8')
        return { success: true, operation: 'write', path: op.path }
      }

      case 'list': {
        const entries = await readdir(op.path, { recursive: op.recursive })
        return { success: true, operation: 'list', path: op.path, files: entries }
      }

      case 'delete': {
        if (!existsSync(op.path)) {
          return { success: false, operation: 'delete', path: op.path, error: 'File not found' }
        }
        await rm(op.path, { recursive: op.recursive })
        return { success: true, operation: 'delete', path: op.path }
      }

      case 'move': {
        if (!existsSync(op.path)) {
          return { success: false, operation: 'move', path: op.path, error: 'Source not found' }
        }
        const dest = op.content || ''
        await rename(op.path, dest)
        return { success: true, operation: 'move', path: op.path, content: dest }
      }

      case 'mkdir': {
        await mkdir(op.path, { recursive: true })
        return { success: true, operation: 'mkdir', path: op.path }
      }

      case 'exists': {
        const exists = existsSync(op.path)
        return { success: true, operation: 'exists', path: op.path, content: exists.toString() }
      }

      case 'search': {
        const results = await searchFiles(op.path, op.pattern || '')
        return { success: true, operation: 'search', path: op.path, files: results }
      }

      default:
        return { success: false, operation: 'unknown', path: op.path, error: 'Unknown operation' }
    }
  } catch (err: any) {
    return { success: false, operation: op.type, path: op.path, error: err.message }
  }
}

async function searchFiles(dir: string, pattern: string): Promise<string[]> {
  const results: string[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          results.push(...await searchFiles(fullPath, pattern))
        }
      } else if (entry.name.includes(pattern)) {
        results.push(fullPath)
      }
    }
  } catch (err: any) {
    // Skip directories we can't read
    if (err.code !== 'EACCES') {
      console.warn(`searchFiles: Cannot read directory ${dir}: ${err.message}`)
    }
  }
  return results
}

// Search file contents (grep-like)
export async function grepFiles(dir: string, query: string, include?: string): Promise<{ file: string; line: number; content: string }[]> {
  const results: { file: string; line: number; content: string }[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
          results.push(...await grepFiles(fullPath, query, include))
        }
      } else if (include && !entry.name.endsWith(include)) {
        continue
      } else {
        try {
          const content = await readFile(fullPath, 'utf-8')
          const lines = content.split('\n')
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({ file: fullPath, line: idx + 1, content: line.trim() })
            }
          })
        } catch (err: any) {
          // Skip files we can't read (permissions, binary, etc.)
          if (err.code !== 'EACCES' && err.code !== 'EISDIR') {
            console.warn(`grepFiles: Cannot read ${fullPath}: ${err.message}`)
          }
        }
      }
    }
  } catch (err: any) {
    console.warn(`grepFiles: Cannot read directory ${dir}: ${err.message}`)
  }
  return results
}
