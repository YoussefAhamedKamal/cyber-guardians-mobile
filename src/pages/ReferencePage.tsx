import { useState } from 'react'
import { REFERENCE_TOPICS } from '@/data/referenceContent'
import { getCharacters } from '@/data/gameData'

interface Props {
  onBack: () => void
}

export function ReferencePage({ onBack }: Props) {
  const [selected, setSelected] = useState(REFERENCE_TOPICS[0]!.id)
  const characters = getCharacters()
  const topic = REFERENCE_TOPICS.find((t) => t.id === selected) || REFERENCE_TOPICS[0]!
  const character = characters[topic.characterId]

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px', padding: '8px 16px',
            color: '#fff', fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          رجوع
        </button>
        <span style={{
          fontSize: '20px', fontWeight: 'bold', color: '#fff',
        }}>
          🛡️ المرجع الأمني
        </span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <div style={{
          width: '200px', borderLeft: '1px solid rgba(255,255,255,0.1)',
          padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px',
          overflowY: 'auto',
        }}>
          {REFERENCE_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelected(topic.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '8px',
                background: selected === topic.id
                  ? 'rgba(79,195,247,0.2)'
                  : 'transparent',
                border: selected === topic.id
                  ? '1px solid rgba(79,195,247,0.4)'
                  : '1px solid transparent',
                color: '#fff', fontSize: '13px',
                cursor: 'pointer', textAlign: 'right',
              }}
            >
              <span>{topic.icon}</span>
              <span>{topic.title}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1, padding: '24px', overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '32px' }}>{topic.icon}</span>
            <div>
              <div style={{
                fontSize: '20px', fontWeight: 'bold', color: '#fff',
              }}>
                {topic.title}
              </div>
              {character && (
                <div style={{
                  fontSize: '13px', color: character.color,
                }}>
                  {character.name} — {character.role}
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {topic.content.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '15px', color: '#fff',
                  lineHeight: 1.8,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
