const CLOUD_KEY = 'cg-cloud-save'

interface CloudSaveData {
  currentLevel: number
  completedLevels: number[]
  totalScore: number
  timestamp: number
  version: string
}

export const cloudSave = {
  async upload(): Promise<boolean> {
    try {
      const { useGameStore } = await import('@/store')
      const state = useGameStore.getState()
      const data: CloudSaveData = {
        currentLevel: state.currentLevel,
        completedLevels: [...state.completedLevels],
        totalScore: state.totalScore,
        timestamp: Date.now(),
        version: '1.3.0',
      }
      localStorage.setItem(CLOUD_KEY, JSON.stringify(data))
      return true
    } catch {
      return false
    }
  },

  async download(): Promise<CloudSaveData | null> {
    try {
      const raw = localStorage.getItem(CLOUD_KEY)
      if (!raw) return null
      return JSON.parse(raw) as CloudSaveData
    } catch {
      return null
    }
  },

  async sync(): Promise<{ uploaded: boolean; downloaded: boolean }> {
    const localRaw = localStorage.getItem('cyber-guardians-save')
    const cloudRaw = localStorage.getItem(CLOUD_KEY)
    let uploaded = false
    let downloaded = false

    if (localRaw) {
      await this.upload()
      uploaded = true
    }
    if (cloudRaw && !localRaw) {
      const data = JSON.parse(cloudRaw) as CloudSaveData
      localStorage.setItem('cyber-guardians-save', JSON.stringify({
        currentLevel: data.currentLevel,
        completedLevels: data.completedLevels,
        totalScore: data.totalScore,
      }))
      downloaded = true
    }

    return { uploaded, downloaded }
  },

  clear() {
    localStorage.removeItem(CLOUD_KEY)
  },
}
