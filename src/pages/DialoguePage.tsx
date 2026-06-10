import { DialogueBox } from '@/components/ui'
import type { LevelData } from '@/types'

interface Props {
  level: LevelData
  dialogueIndex: number
  onComplete: () => void
}

export default function DialoguePage({ level, dialogueIndex, onComplete }: Props) {
  return (
    <div style={{
      height: '100%', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.1,
        background: 'radial-gradient(ellipse at 20% 50%, #4FC3F7 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, #CE93D8 0%, transparent 60%)',
      }} />
      <DialogueBox
        lines={dialogueIndex === 0 ? level.intro : level.outro}
        onComplete={onComplete}
      />
    </div>
  )
}
