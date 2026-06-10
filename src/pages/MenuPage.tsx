import { MenuScreen } from '@/components/ui'

interface Props { onStart: () => void; onSettings: () => void }

export default function MenuPage({ onStart, onSettings }: Props) {
  return <MenuScreen onStart={onStart} onSettings={onSettings} />
}
