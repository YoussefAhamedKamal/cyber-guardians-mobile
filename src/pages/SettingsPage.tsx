import { SettingsPanel } from '@/components/ui'

interface Props { onBack: () => void }

export default function SettingsPage({ onBack }: Props) {
  return <SettingsPanel onBack={onBack} />
}
