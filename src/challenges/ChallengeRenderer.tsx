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
  onRequestHint?: (() => void) | undefined
}

export function ChallengeRenderer({ level, onComplete, onRequestHint }: Props) {
  switch (level.challengeType) {
    case 'cards':
      return <CardChallenge emails={level.challengeData.phishingEmails ?? []} onComplete={onComplete} onRequestHint={onRequestHint} />
    case 'build':
      return <BuildChallenge rules={level.challengeData.passwordRules ?? []} onComplete={onComplete} onRequestHint={onRequestHint} />
    case 'maze':
      return <MazeChallenge grid={level.challengeData.mazeGrid ?? []} onComplete={onComplete} onRequestHint={onRequestHint} />
    case 'dragdrop':
      return <DragDropChallenge ports={level.challengeData.firewallPorts ?? []} onComplete={onComplete} onRequestHint={onRequestHint} />
    case 'decrypt':
      return <DecryptChallenge cipher={level.challengeData.cipher!} onComplete={onComplete} onRequestHint={onRequestHint} />
    case 'codefix':
      return <CodeFixChallenge codes={level.challengeData.vulnCodes ?? []} onComplete={onComplete} onRequestHint={onRequestHint} />
    case 'response':
      return <ResponseChallenge steps={level.challengeData.incidentSteps ?? []} onComplete={onComplete} onRequestHint={onRequestHint} />
  }
}
