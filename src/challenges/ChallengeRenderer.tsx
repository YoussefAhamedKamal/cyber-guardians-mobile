import type { LevelData } from '@/types'
import { CardChallenge } from './CardChallenge'
import { BuildChallenge } from './BuildChallenge'
import { MazeChallenge } from './MazeChallenge'
import { DragDropChallenge } from './DragDropChallenge'
import { DecryptChallenge } from './DecryptChallenge'
import { CodeFixChallenge } from './CodeFixChallenge'
import { ResponseChallenge } from './ResponseChallenge'

interface Props {
  level: LevelData
  onComplete: (score: number) => void
}

export function ChallengeRenderer({ level, onComplete }: Props) {
  switch (level.challengeType) {
    case 'cards':
      return <CardChallenge emails={level.challengeData.phishingEmails ?? []} onComplete={onComplete} />
    case 'build':
      return <BuildChallenge rules={level.challengeData.passwordRules ?? []} onComplete={onComplete} />
    case 'maze':
      return <MazeChallenge grid={level.challengeData.mazeGrid ?? []} onComplete={onComplete} />
    case 'dragdrop':
      return <DragDropChallenge ports={level.challengeData.firewallPorts ?? []} onComplete={onComplete} />
    case 'decrypt':
      return <DecryptChallenge cipher={level.challengeData.cipher!} onComplete={onComplete} />
    case 'codefix':
      return <CodeFixChallenge codes={level.challengeData.vulnCodes ?? []} onComplete={onComplete} />
    case 'response':
      return <ResponseChallenge steps={level.challengeData.incidentSteps ?? []} onComplete={onComplete} />
  }
}
