type EventType = 'game_start' | 'level_start' | 'level_complete' | 'challenge_retry' | 'challenge_hint' | 'settings_change' | 'error' | 'app_install'

interface AnalyticsEvent {
  type: EventType
  data?: Record<string, string | number | boolean>
  timestamp: number
}

const events: AnalyticsEvent[] = []

export const analytics = {
  track(type: EventType, data?: Record<string, string | number | boolean>) {
    const event: AnalyticsEvent = data ? { type, data, timestamp: Date.now() } : { type, timestamp: Date.now() }
    events.push(event)
    if (events.length > 200) events.shift()
    try {
      localStorage.setItem('cg-analytics', JSON.stringify(events.slice(-50)))
    } catch {}
  },

  getEvents(): AnalyticsEvent[] {
    return [...events]
  },

  getLevelStats() {
    const levelEvents = events.filter((e) => e.type === 'level_complete')
    const stats: Record<number, { attempts: number; scores: number[] }> = {}
    for (const e of levelEvents) {
      const level = e.data?.level as number | undefined
      const score = e.data?.score as number | undefined
      if (level == null) continue
      if (!stats[level]) stats[level] = { attempts: 0, scores: [] }
      stats[level].attempts++
      if (score != null) stats[level].scores.push(score)
    }
    return stats
  },

  getTotalPlayTime(): number {
    let total = 0
    for (const e of events) {
      if (e.data?.playTimeMs) total += Number(e.data.playTimeMs)
    }
    return total
  },
}
