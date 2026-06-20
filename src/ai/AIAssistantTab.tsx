import { useState } from 'react'
import { useAIAssistantStore } from '@/store/aiAssistantStore'
import type { SummaryResult, SummaryOptions } from '@/types/aiAssistant'

type AssistantView = 'summarize' | 'search' | 'history'

export function AIAssistantTab() {
  const [view, setView] = useState<AssistantView>('summarize')
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [summaryStyle, setSummaryStyle] = useState<SummaryOptions['style']>('key-points')
  const [selectedSummary, setSelectedSummary] = useState<SummaryResult | null>(null)

  const {
    summaries,
    smartSearches,
    recentSuggestions,
    summarize,
    smartSearch,
    getSuggestions,
    clearSummaries,
    clearSmartSearches
  } = useAIAssistantStore()

  const handleSummarize = () => {
    if (!inputText.trim()) return
    const result = summarize(inputText, { style: summaryStyle || 'key-points' })
    setSelectedSummary(result)
  }

  const handleSmartSearch = () => {
    if (!searchQuery.trim()) return
    smartSearch(searchQuery)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    smartSearch(suggestion)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#4CAF50', fontSize: '16px' }}>
          🤖 AI Assistant
        </h3>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'summarize' as const, label: '📝 تلخيص' },
            { id: 'search' as const, label: '🔍 بحث ذكي' },
            { id: 'history' as const, label: '📜 السجل' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                background: view === tab.id ? '#2a2a3e' : '#1a1a2e',
                border: `1px solid ${view === tab.id ? '#4CAF50' : '#333'}`,
                borderRadius: '6px',
                color: view === tab.id ? '#4CAF50' : '#888',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: view === tab.id ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Summarize View */}
        {view === 'summarize' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Input */}
            <div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="الصق النص هنا للتلخيص..."
                style={{
                  width: '100%',
                  height: '150px',
                  padding: '12px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '12px'
                }}
              />

              {/* Style Selection */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[
                  { value: 'bullet' as const, label: '• نقاط' },
                  { value: 'paragraph' as const, label: '📄 فقرة' },
                  { value: 'key-points' as const, label: '🔑 أهم النقاط' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSummaryStyle(option.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: summaryStyle === option.value ? '#4CAF50' : '#333',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSummarize}
                disabled={!inputText.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: inputText.trim() ? '#4CAF50' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                📝 تلخيص النص
              </button>
            </div>

            {/* Summary Result */}
            {selectedSummary && (
              <SummaryCard
                summary={selectedSummary}
                onClick={() => setSelectedSummary(selectedSummary)}
              />
            )}
          </div>
        )}

        {/* Smart Search View */}
        {view === 'search' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
                placeholder="ابحث بذكاء..."
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  background: '#0d1117',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSmartSearch}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '8px',
                  background: '#4CAF50',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔍
              </button>
            </div>

            {/* Suggestions */}
            {recentSuggestions.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>
                  💡 اقتراحات:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {recentSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        padding: '6px 10px',
                        background: '#1a1a2e',
                        border: '1px solid #333',
                        borderRadius: '16px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '11px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4CAF50'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {smartSearches.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>
                  🔍 نتائج البحث:
                </h4>
                {smartSearches.slice(0, 3).map((search) => (
                  <div key={search.id} style={{
                    padding: '12px',
                    background: '#1a1a2e',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    marginBottom: '8px'
                  }}>
                    <p style={{ margin: '0 0 8px', color: '#4CAF50', fontSize: '13px' }}>
                      🔍 {search.query}
                    </p>
                    {search.results.map((result) => (
                      <div key={result.id} style={{
                        padding: '8px',
                        background: '#0d1117',
                        borderRadius: '6px',
                        marginBottom: '4px'
                      }}>
                        <p style={{ margin: '0 0 4px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                          {result.title}
                        </p>
                        <p style={{ margin: 0, color: '#888', fontSize: '11px' }}>
                          {result.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div>
            {summaries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
                <p>لا توجد ملخصات سابقة</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button
                    onClick={clearSummaries}
                    style={{
                      padding: '8px 12px',
                      background: '#f44336',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ مسح السجل
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {summaries.map((summary) => (
                    <SummaryCard
                      key={summary.id}
                      summary={summary}
                      onClick={() => setSelectedSummary(summary)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary Detail Modal */}
      {selectedSummary && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#4CAF50' }}>📝 تفاصيل الملخص</h3>
              <button
                onClick={() => setSelectedSummary(null)}
                style={{
                  padding: '8px',
                  background: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Summary */}
            <div style={{
              padding: '16px',
              background: '#0d1117',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>الملخص:</h4>
              <p style={{ margin: 0, color: '#fff', fontSize: '14px', lineHeight: 1.6 }}>
                {selectedSummary.summary}
              </p>
            </div>

            {/* Keywords */}
            {selectedSummary.keywords.length > 0 && (
              <div style={{
                padding: '16px',
                background: '#0d1117',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>الكلمات المفتاحية:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedSummary.keywords.map((keyword, i) => (
                    <span key={i} style={{
                      padding: '4px 8px',
                      background: '#4CAF50',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '11px'
                    }}>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}>
              <div style={{
                padding: '12px',
                background: '#0d1117',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: '11px' }}>الكلمات الأصلية</p>
                <p style={{ margin: 0, color: '#4CAF50', fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedSummary.wordCount.original}
                </p>
              </div>
              <div style={{
                padding: '12px',
                background: '#0d1117',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: '11px' }}>كلمات الملخص</p>
                <p style={{ margin: 0, color: '#2196F3', fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedSummary.wordCount.summary}
                </p>
              </div>
              <div style={{
                padding: '12px',
                background: '#0d1117',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: '11px' }}>وقت القراءة الأصلي</p>
                <p style={{ margin: 0, color: '#FF9800', fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedSummary.readingTime.original} دقيقة
                </p>
              </div>
              <div style={{
                padding: '12px',
                background: '#0d1117',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: '11px' }}>وقت قراءة الملخص</p>
                <p style={{ margin: 0, color: '#9C27B0', fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedSummary.readingTime.summary} دقيقة
                </p>
              </div>
            </div>

            {/* Sentiment */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#0d1117',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>الشعور:</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>
                  {selectedSummary.sentiment.label === 'positive' ? '😊' :
                    selectedSummary.sentiment.label === 'negative' ? '😞' : '😐'}
                </span>
                <span style={{ color: '#fff', fontSize: '13px' }}>
                  {selectedSummary.sentiment.label === 'positive' ? 'إيجابي' :
                    selectedSummary.sentiment.label === 'negative' ? 'سلبي' : 'محايد'}
                </span>
                <span style={{ color: '#888', fontSize: '11px' }}>
                  ({(selectedSummary.sentiment.confidence * 100).toFixed(0)}% ثقة)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  summary,
  onClick
}: {
  summary: SummaryResult
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px',
        background: '#1a1a2e',
        borderRadius: '8px',
        border: '1px solid #333',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4CAF50'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#333'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <p style={{ margin: '0 0 8px', color: '#fff', fontSize: '13px' }}>
        {summary.summary.substring(0, 100)}...
      </p>
      <div style={{ display: 'flex', gap: '12px', color: '#888', fontSize: '11px' }}>
        <span>📝 {summary.wordCount.original} كلمة</span>
        <span>⏱️ {summary.readingTime.summary} دقيقة</span>
        <span>{summary.sentiment.label === 'positive' ? '😊' : summary.sentiment.label === 'negative' ? '😞' : '😐'}</span>
      </div>
    </div>
  )
}
