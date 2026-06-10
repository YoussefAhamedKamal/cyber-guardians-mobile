import { Button } from '@/components/ui'
import { useGameStore } from '@/store'

interface Props { onRestart: () => void }

export default function VictoryPage({ onRestart }: Props) {
  const game = useGameStore()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '24px',
      position: 'relative', zIndex: 1,
    }}>
      <div style={{ fontSize: '64px' }}>🏆</div>
      <h1 style={{ fontSize: 'var(--heading-font-size)', margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--heading-color)' }}>
        تهانينا!
      </h1>
      <p style={{ color: '#aaa', fontSize: '18px', maxWidth: '400px', textAlign: 'center' }}>
        لقد أتممت جميع المستويات. أنت الآن حارس أمن سيبراني حقيقي!
      </p>
      <p style={{ fontSize: '24px', color: '#4FC3F7' }}>النقاط: {game.totalScore}</p>
      <Button onClick={() => { game.resetProgress(); onRestart() }}>
        لعب مرة أخرى
      </Button>
    </div>
  )
}
