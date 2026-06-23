import React, { useEffect, useState } from 'react'
import { useLocalAgentStore } from '../store/localAgentStore'
import type { ToolName } from '../types/localAgent'

const TOOL_DESCRIPTIONS: Record<ToolName, { name: string; description: string; icon: string }> = {
  aider: { name: 'Aider', description: 'أداة CLI للبرمجة بالذكاء الاصطناعي — الأفضل والأسرع', icon: '🤖' },
  cline: { name: 'Cline', description: 'أداة CLI بديلة — تعمل عبر VS Code', icon: '⚡' },
  custom: { name: 'Agent مخصص', description: 'وكيل مخصص يستخدم مزودي الذكاء الاصطناعي مباشرة — متاح دائماً', icon: '🧠' },
}

export default function ToolSettingsPanel() {
  const {
    toolStatus,
    toolSettings,
    connected,
    refreshToolStatus,
    updateToolSettings,
    setToolSettingsLocal,
  } = useLocalAgentStore()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (connected) {
      setLoading(true)
      refreshToolStatus().finally(() => setLoading(false))
    }
  }, [connected])

  const handleSelectTool = async (tool: ToolName | null) => {
    setSaving(true)
    await updateToolSettings({ selectedTool: tool })
    setSaving(false)
  }

  const handleToggleFallback = async (enabled: boolean) => {
    setSaving(true)
    await updateToolSettings({ autoFallback: enabled })
    setSaving(false)
  }

  return (
    <div className="tool-settings-panel">
      <h3>⚙ إعدادات الأدوات</h3>

      {/* Tool Status */}
      <div className="tool-status-section">
        <h4>حالة الأدوات</h4>
        {loading ? (
          <p>جاري التحقق من الأدوات...</p>
        ) : toolStatus ? (
          <div className="tool-list">
            {toolStatus.tools.map((tool) => (
              <div key={tool.name} className={`tool-item ${tool.installed ? 'available' : 'unavailable'}`}>
                <div className="tool-info">
                  <span className="tool-icon">{TOOL_DESCRIPTIONS[tool.name].icon}</span>
                  <div>
                    <strong>{TOOL_DESCRIPTIONS[tool.name].name}</strong>
                    <span className={`status-badge ${tool.installed ? 'green' : 'red'}`}>
                      {tool.installed ? 'مثبت' : 'غير مثبت'}
                    </span>
                    {tool.version && <span className="version">v{tool.version}</span>}
                  </div>
                </div>
                <p className="tool-desc">{TOOL_DESCRIPTIONS[tool.name].description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>غير متصل بالوكيل</p>
        )}
      </div>

      {/* Tool Selection */}
      <div className="tool-selection-section">
        <h4>اختيار الأداة</h4>
        <div className="tool-options">
          <button
            className={`tool-option ${toolSettings.selectedTool === null ? 'active' : ''}`}
            onClick={() => handleSelectTool(null)}
            disabled={saving}
          >
            🔄 تلقائي (الأفضل أولاً)
          </button>
          {toolStatus?.tools.map((tool) => (
            <button
              key={tool.name}
              className={`tool-option ${toolSettings.selectedTool === tool.name ? 'active' : ''} ${!tool.installed ? 'disabled' : ''}`}
              onClick={() => handleSelectTool(tool.name)}
              disabled={saving || !tool.installed}
            >
              {TOOL_DESCRIPTIONS[tool.name].icon} {TOOL_DESCRIPTIONS[tool.name].name}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Fallback Toggle */}
      <div className="fallback-section">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={toolSettings.autoFallback}
            onChange={(e) => handleToggleFallback(e.target.checked)}
            disabled={saving}
          />
          <span>تفعيل التحويل التلقائي عند الفشل</span>
        </label>
        <p className="help-text">
          عند التفعيل: Aider ← Cline ← Agent مخصص
        </p>
      </div>

      {/* Fallback Order */}
      <div className="fallback-order-section">
        <h4>ترتيب الأولوية</h4>
        <div className="fallback-flow">
          <span className="flow-item">1. Aider</span>
          <span className="flow-arrow">→</span>
          <span className="flow-item">2. Cline</span>
          <span className="flow-arrow">→</span>
          <span className="flow-item">3. Agent مخصص</span>
        </div>
      </div>
    </div>
  )
}
