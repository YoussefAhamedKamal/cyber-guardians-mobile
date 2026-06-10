import { CelebrationVideo } from '@/components/ui'

interface Props { onEnd: () => void }

export default function CelebrationPage({ onEnd }: Props) {
  return <CelebrationVideo onEnd={onEnd} />
}
