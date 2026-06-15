import { useState, useCallback } from 'react'
import { DialogueBox } from '@/components/ui'
import { ChallengeIntro } from '@/components/ui/ChallengeIntro'
import { ChallengeSummary } from '@/components/ui/ChallengeSummary'
import { getChallengeMeta } from '@/data/challengeMeta'
import type { LevelData } from '@/types'

interface Props {
  level: LevelData
  dialogueIndex: number
  onComplete: () => void
}

export default function DialoguePage({ level, dialogueIndex, onComplete }: Props) {
  const [showIntro, setShowIntro] = useState(true)
  const [introDone, setIntroDone] = useState(false)
  const [summaryDone, setSummaryDone] = useState(false)
  const challengeMeta = getChallengeMeta(level.id)

  const handleIntroDone = useCallback(() => {
    setIntroDone(true)
  }, [])

  const handleSummaryDone = useCallback(() => {
    setSummaryDone(true)
    onComplete()
  }, [onComplete])

  // Show ChallengeIntro before first dialogue (intro)
  if (dialogueIndex === 0 && showIntro && challengeMeta && !introDone) {
    return (
      <ChallengeIntro
        text={challengeMeta.introText}
        characterName={challengeMeta.introCharacterName}
        onDone={handleIntroDone}
      />
    )
  }

  // Show ChallengeSummary after second dialogue (outro) - replaces the dialogue
  if (dialogueIndex === 1 && challengeMeta && !summaryDone) {
    return (
      <ChallengeSummary
        summary={challengeMeta.summary}
        xpEarned={Math.floor(level.id * 10)}
        onDone={handleSummaryDone}
      />
    )
  }

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
