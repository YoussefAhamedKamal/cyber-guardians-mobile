export interface DifficultyConfig {
  id: string
  icon: string
  name: string
  nameEn: string
  questions: number
  timePerQuestion: number
  hearts: number
  multiplier: number
  color: string
}

export const DIFFICULTIES: DifficultyConfig[] = [
  { id: 'easy', icon: '🟢', name: 'مبتدئ', nameEn: 'Easy', questions: 5, timePerQuestion: 45, hearts: 3, multiplier: 1, color: '#4CAF50' },
  { id: 'medium', icon: '🟡', name: 'متوسط', nameEn: 'Medium', questions: 7, timePerQuestion: 30, hearts: 3, multiplier: 1.5, color: '#FF9800' },
  { id: 'hard', icon: '🔴', name: 'محترف', nameEn: 'Hard', questions: 10, timePerQuestion: 20, hearts: 2, multiplier: 2, color: '#F44336' },
  { id: 'rush', icon: '⚡', name: 'سرعة البرق', nameEn: 'Speed Rush', questions: 10, timePerQuestion: 10, hearts: 99, multiplier: 3, color: '#9C27B0' },
]

interface Props {
  onSelect: (difficulty: DifficultyConfig) => void
}

export function DifficultySelect({ onSelect }: Props) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px', padding: '16px',
    }}>
      {DIFFICULTIES.map((diff) => (
        <button
          key={diff.id}
          onClick={() => onSelect(diff)}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '20px 16px',
            borderRadius: '16px',
            background: `${diff.color}15`,
            border: `2px solid ${diff.color}44`,
            color: '#fff', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '32px', marginBottom: '8px' }}>{diff.icon}</span>
          <span style={{
            fontSize: '16px', fontWeight: 'bold',
            color: diff.color, marginBottom: '4px',
          }}>
            {diff.name}
          </span>
          <span style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
            {diff.questions} أسئلة • {diff.timePerQuestion}s
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#F44336' }}>
              ❤️ {diff.hearts === 99 ? '∞' : diff.hearts}
            </span>
            <span style={{ fontSize: '12px', color: '#FFD700' }}>
              ×{diff.multiplier}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
