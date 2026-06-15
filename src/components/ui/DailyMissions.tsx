import { useGameStore } from '@/store'
import { generateDailyMissions, getMissionProgress, type MissionProgress } from '@/data/missions'

interface Props {
  compact?: boolean
}

export function DailyMissions({ compact = false }: Props) {
  const missionsDate = useGameStore((s) => s.missionsDate)
  const missionProgress = useGameStore((s) => s.missionProgress)

  const today = new Date().toDateString()
  const missions = generateDailyMissions(today)
  const progressList = getMissionProgress(missions, missionProgress)

  if (compact) {
    const completedCount = progressList.filter((p) => p.completed).length
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 12px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ fontSize: '14px' }}>📋</span>
        <span style={{ fontSize: '12px', color: '#fff' }}>
          {completedCount}/{missions.length} مهام
        </span>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '16px', padding: '16px',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '20px' }}>📋</span>
        <span style={{
          fontSize: '16px', fontWeight: 'bold', color: '#fff',
        }}>
          مهام اليوم
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {progressList.map(({ mission, current, completed }) => (
          <div
            key={mission.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '10px',
              background: completed
                ? 'rgba(76,175,80,0.15)'
                : 'rgba(255,255,255,0.05)',
              border: completed
                ? '1px solid rgba(76,175,80,0.3)'
                : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '20px' }}>{mission.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px', color: '#fff', marginBottom: '4px',
              }}>
                {mission.text}
              </div>
              <div style={{
                height: '4px', borderRadius: '2px',
                background: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(current / mission.target) * 100}%`,
                  height: '100%', borderRadius: '2px',
                  background: completed ? '#4CAF50' : '#4FC3F7',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
            <div style={{
              fontSize: '12px', color: completed ? '#4CAF50' : '#888',
              fontWeight: 'bold', minWidth: '40px', textAlign: 'center',
            }}>
              {completed ? '✓' : `${current}/${mission.target}`}
            </div>
            <div style={{
              fontSize: '11px', color: '#FFD700',
            }}>
              +{mission.xp} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
