const DB_NAME = 'cyber-guardians'
const STORE_NAME = 'zustand'
const VERSION = 1

function isAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isAvailable()) return reject(new Error('indexedDB not available'))
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function migrateFromLocalStorage() {
  if (!isAvailable()) return
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith('cyber-guardians-')) continue
    const val = localStorage.getItem(key)
    if (!val) continue
    try {
      const parsed = JSON.parse(val)
      if (parsed && typeof parsed === 'object' && 'completedLevels' in parsed) {
        const raw = (parsed as Record<string, unknown>).completedLevels
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          ;(parsed as Record<string, unknown>).completedLevels = []
        }
      }
      openDB().then((db) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put(JSON.stringify(parsed), key)
        tx.oncomplete = () => db.close()
      }).catch((e) => { console.error('indexedDB migration (parsed) failed:', e) })
    } catch {
      openDB().then((db) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put(val, key)
        tx.oncomplete = () => db.close()
      }).catch((e) => { console.error('indexedDB migration (raw) failed:', e) })
    }
    localStorage.removeItem(key)
  }
}

export const indexedDBStorage = {
  async getItem(name: string): Promise<string | null> {
    if (!isAvailable()) return null
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(name)
      req.onsuccess = () => { resolve(req.result ?? null); db.close() }
      req.onerror = () => { reject(req.error); db.close() }
    })
  },
  async setItem(name: string, value: string): Promise<void> {
    if (!isAvailable()) return
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, name)
      tx.oncomplete = () => { resolve(); db.close() }
      tx.onerror = () => { reject(tx.error); db.close() }
    })
  },
  async removeItem(name: string): Promise<void> {
    if (!isAvailable()) return
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(name)
      tx.oncomplete = () => { resolve(); db.close() }
      tx.onerror = () => { reject(tx.error); db.close() }
    })
  },
}

migrateFromLocalStorage()
