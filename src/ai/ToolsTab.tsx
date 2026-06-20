import { useAIStore } from '@/store/aiStore'
import { SkillsTab } from './SkillsTab'
import { PluginsTab } from './PluginsTab'
import { ConnectorsTab } from './ConnectorsTab'
import { MarketplacePanel } from './MarketplacePanel'
import { AnalyticsTab } from './AnalyticsTab'
import { BackupTab } from './BackupTab'
import { AdvancedSearchTab } from './AdvancedSearchTab'
import { AIAssistantTab } from './AIAssistantTab'
import { CollaborationTab } from './CollaborationTab'
import { SecurityTab } from './SecurityTab'

const SUB_TABS = [
  { id: 'skills' as const, label: '📋 القدرات' },
  { id: 'plugins' as const, label: '🔌 الأدوات' },
  { id: 'connectors' as const, label: '🔗 الاتصالات' },
  { id: 'marketplace' as const, label: '🛒 السوق' },
  { id: 'analytics' as const, label: '📊 الإحصائيات' },
  { id: 'backup' as const, label: '💾 النسخ' },
  { id: 'search' as const, label: '🔍 بحث' },
  { id: 'ai-assistant' as const, label: '🤖 مساعد' },
  { id: 'collaboration' as const, label: '🤝 تعاون' },
  { id: 'security' as const, label: '🔒 أمان' }
]

export function ToolsTab() {
  const ai = useAIStore()
  const activeSubTab = ai.toolsActiveSubTab

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub Tab Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
        background: '#1a1a2e',
        overflowX: 'auto'
      }}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => ai.setToolsActiveSubTab(tab.id)}
            style={{
              flex: '0 0 auto',
              padding: '12px 10px',
              background: activeSubTab === tab.id ? '#2a2a3e' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeSubTab === tab.id ? '#4CAF50' : 'transparent'}`,
              color: activeSubTab === tab.id ? '#4CAF50' : '#888',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeSubTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeSubTab === 'skills' && <SkillsTab />}
        {activeSubTab === 'plugins' && <PluginsTab />}
        {activeSubTab === 'connectors' && <ConnectorsTab />}
        {activeSubTab === 'marketplace' && <MarketplacePanel />}
        {activeSubTab === 'analytics' && <AnalyticsTab />}
        {activeSubTab === 'backup' && <BackupTab />}
        {activeSubTab === 'search' && <AdvancedSearchTab />}
        {activeSubTab === 'ai-assistant' && <AIAssistantTab />}
        {activeSubTab === 'collaboration' && <CollaborationTab />}
        {activeSubTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}
