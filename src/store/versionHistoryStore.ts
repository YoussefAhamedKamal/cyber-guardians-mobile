import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/utils/indexedDBStorage'
import type {
  VersionHistoryState,
  Change,
  VersionSnapshot,
  ChangeType,
  ItemType,
  VersionDiff
} from '@/types/versionHistory'
import { generateId, DEFAULT_VERSION_HISTORY_STATE } from '@/types/versionHistory'
import { useSkillStore } from './skillStore'
import { usePluginStore } from './pluginStore'
import { useConnectorStore } from './connectorStore'
import { useProjectStore } from './projectStore'

type VersionHistoryStore = VersionHistoryState

export const useVersionHistoryStore = create<VersionHistoryStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_VERSION_HISTORY_STATE,

      recordChange: (type, itemType, itemId, itemName, snapshot, metadata) => {
        const change: Change = {
          id: generateId(),
          timestamp: Date.now(),
          type,
          itemType,
          itemId,
          itemName,
          snapshot,
          metadata: metadata || null
        }

        set((state) => {
          const changes = [change, ...state.changes].slice(0, state.maxChanges)
          return { changes }
        })
      },

      createSnapshot: () => {
        const snapshot: VersionSnapshot = {
          id: generateId(),
          timestamp: Date.now(),
          skills: useSkillStore.getState().skills,
          plugins: usePluginStore.getState().plugins,
          connectors: useConnectorStore.getState().connectors,
          knowledge: useProjectStore.getState().knowledge,
          instructions: useProjectStore.getState().instructions
        }

        set((state) => {
          const snapshots = [snapshot, ...state.snapshots].slice(0, state.maxSnapshots)
          return { snapshots }
        })

        return snapshot
      },

      restoreSnapshot: (snapshotId) => {
        const state = get()
        const snapshot = state.snapshots.find((s) => s.id === snapshotId)
        if (!snapshot) return null

        useSkillStore.setState({ skills: snapshot.skills })
        usePluginStore.setState({ plugins: snapshot.plugins })
        useConnectorStore.setState({ connectors: snapshot.connectors })
        useProjectStore.setState({
          knowledge: snapshot.knowledge,
          instructions: snapshot.instructions
        })

        return snapshot
      },

      getItemHistory: (itemType, itemId) => {
        return get().changes.filter(
          (c) => c.itemType === itemType && c.itemId === itemId
        )
      },

      getRecentChanges: (limit = 20) => {
        return get().changes.slice(0, limit)
      },

      getChangesByType: (type) => {
        return get().changes.filter((c) => c.type === type)
      },

      getChangesByItemType: (itemType) => {
        return get().changes.filter((c) => c.itemType === itemType)
      },

      getChangesByDateRange: (from, to) => {
        return get().changes.filter(
          (c) => c.timestamp >= from && c.timestamp <= to
        )
      },

      compareSnapshots: (snapshotId1, snapshotId2) => {
        const state = get()
        const snap1 = state.snapshots.find((s) => s.id === snapshotId1)
        const snap2 = state.snapshots.find((s) => s.id === snapshotId2)

        if (!snap1 || !snap2) return []

        const diffs: VersionDiff[] = []

        // Compare skills
        snap1.skills.forEach((s1) => {
          const s2 = snap2.skills.find((s) => s.id === s1.id)
          if (!s2) {
            diffs.push({
              type: 'delete',
              itemType: 'skill',
              itemId: s1.id,
              itemName: s1.name,
              oldState: s1,
              newState: null,
              timestamp: snap2.timestamp
            })
          } else if (JSON.stringify(s1) !== JSON.stringify(s2)) {
            diffs.push({
              type: 'update',
              itemType: 'skill',
              itemId: s1.id,
              itemName: s1.name,
              oldState: s1,
              newState: s2,
              timestamp: snap2.timestamp
            })
          }
        })

        snap2.skills.forEach((s2) => {
          const s1 = snap1.skills.find((s) => s.id === s2.id)
          if (!s1) {
            diffs.push({
              type: 'create',
              itemType: 'skill',
              itemId: s2.id,
              itemName: s2.name,
              oldState: null,
              newState: s2,
              timestamp: snap2.timestamp
            })
          }
        })

        // Compare plugins
        snap1.plugins.forEach((p1) => {
          const p2 = snap2.plugins.find((p) => p.id === p1.id)
          if (!p2) {
            diffs.push({
              type: 'delete',
              itemType: 'plugin',
              itemId: p1.id,
              itemName: p1.name,
              oldState: p1,
              newState: null,
              timestamp: snap2.timestamp
            })
          } else if (JSON.stringify(p1) !== JSON.stringify(p2)) {
            diffs.push({
              type: 'update',
              itemType: 'plugin',
              itemId: p1.id,
              itemName: p1.name,
              oldState: p1,
              newState: p2,
              timestamp: snap2.timestamp
            })
          }
        })

        snap2.plugins.forEach((p2) => {
          const p1 = snap1.plugins.find((p) => p.id === p2.id)
          if (!p1) {
            diffs.push({
              type: 'create',
              itemType: 'plugin',
              itemId: p2.id,
              itemName: p2.name,
              oldState: null,
              newState: p2,
              timestamp: snap2.timestamp
            })
          }
        })

        // Compare connectors
        snap1.connectors.forEach((c1) => {
          const c2 = snap2.connectors.find((c) => c.id === c1.id)
          if (!c2) {
            diffs.push({
              type: 'delete',
              itemType: 'connector',
              itemId: c1.id,
              itemName: c1.name,
              oldState: c1,
              newState: null,
              timestamp: snap2.timestamp
            })
          } else if (JSON.stringify(c1) !== JSON.stringify(c2)) {
            diffs.push({
              type: 'update',
              itemType: 'connector',
              itemId: c1.id,
              itemName: c1.name,
              oldState: c1,
              newState: c2,
              timestamp: snap2.timestamp
            })
          }
        })

        snap2.connectors.forEach((c2) => {
          const c1 = snap1.connectors.find((c) => c.id === c2.id)
          if (!c1) {
            diffs.push({
              type: 'create',
              itemType: 'connector',
              itemId: c2.id,
              itemName: c2.name,
              oldState: null,
              newState: c2,
              timestamp: snap2.timestamp
            })
          }
        })

        // Compare knowledge
        if (JSON.stringify(snap1.knowledge) !== JSON.stringify(snap2.knowledge)) {
          diffs.push({
            type: 'update',
            itemType: 'knowledge',
            itemId: 'knowledge',
            itemName: 'Project Knowledge',
            oldState: snap1.knowledge,
            newState: snap2.knowledge,
            timestamp: snap2.timestamp
          })
        }

        // Compare instructions
        if (JSON.stringify(snap1.instructions) !== JSON.stringify(snap2.instructions)) {
          diffs.push({
            type: 'update',
            itemType: 'instructions',
            itemId: 'instructions',
            itemName: 'Project Instructions',
            oldState: snap1.instructions,
            newState: snap2.instructions,
            timestamp: snap2.timestamp
          })
        }

        return diffs
      },

      getSnapshotById: (snapshotId) => {
        return get().snapshots.find((s) => s.id === snapshotId)
      },

      clearHistory: () => set({ changes: [] }),
      clearSnapshots: () => set({ snapshots: [] }),

      exportHistory: () => {
        const state = get()
        return JSON.stringify({
          changes: state.changes,
          snapshots: state.snapshots
        }, null, 2)
      },

      importHistory: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.changes && Array.isArray(data.changes)) {
            const validChanges = data.changes.filter(
              (item: any) =>
                item &&
                typeof item.id === 'string' &&
                typeof item.timestamp === 'number' &&
                typeof item.type === 'string' &&
                typeof item.itemType === 'string' &&
                typeof item.itemId === 'string' &&
                typeof item.itemName === 'string'
            )
            set({ changes: validChanges })
          }
          if (data.snapshots && Array.isArray(data.snapshots)) {
            set({ snapshots: data.snapshots })
          }
          return true
        } catch {
          return false
        }
      }
    }),
    {
      name: 'cyber-guardians-version-history',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
)
