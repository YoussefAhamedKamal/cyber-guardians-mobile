import { useState, useMemo, useCallback } from 'react'
import { useAdvancedSearchStore } from '@/store/advancedSearchStore'
import type { SearchResult, SearchableItemType, SearchQuery } from '@/types/search'

type SearchView = 'search' | 'saved' | 'history'

const TYPE_CONFIG: Record<SearchableItemType, { label: string; icon: string; color: string }> = {
  skill: { label: 'قدرة', icon: '📋', color: '#4CAF50' },
  plugin: { label: 'أداة', icon: '🔌', color: '#2196F3' },
  connector: { label: 'اتصال', icon: '🔗', color: '#FF9800' },
  knowledge: { label: 'معرفة', icon: '📚', color: '#9C27B0' },
  instructions: { label: 'تعليمات', icon: '📝', color: '#00BCD4' },
  change: { label: 'تغيير', icon: '🔄', color: '#E91E63' },
  usage: { label: 'استخدام', icon: '📊', color: '#607D8B' }
}

export function AdvancedSearchTab() {
  const [view, setView] = useState<SearchView>('search')
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<SearchableItemType[]>(Object.keys(TYPE_CONFIG) as SearchableItemType[])
  const [showFilters, setShowFilters] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  const {
    results,
    savedSearches,
    recentSearches,
    isSearching,
    totalResults,
    searchTime,
    search,
    saveSearch,
    deleteSavedSearch,
    useSavedSearch,
    clearRecentSearches,
    getSuggestions,
    updatePopularTerms
  } = useAdvancedSearchStore()

  const suggestions = useMemo(() => {
    if (query.length < 2) return []
    return getSuggestions(query)
  }, [query, getSuggestions])

  const handleSearch = useCallback(() => {
    if (!query.trim()) return
    updatePopularTerms(query)
    search(query, { types: selectedTypes })
  }, [query, selectedTypes, search, updatePopularTerms])

  const handleSaveSearch = () => {
    if (saveName.trim() && query.trim()) {
      saveSearch(saveName, {
        query,
        filters: { types: selectedTypes },
        operators: []
      })
      setShowSaveModal(false)
      setSaveName('')
    }
  }

  const handleUseSavedSearch = (id: string) => {
    const savedQuery = useSavedSearch(id)
    if (savedQuery) {
      setQuery(savedQuery.query)
      setSelectedTypes(savedQuery.filters.types)
      search(savedQuery.query, savedQuery.filters)
    }
  }

  const toggleType = (type: SearchableItemType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#4CAF50', fontSize: '16px' }}>
            🔍 Advanced Search
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {query.trim() && (
              <button
                onClick={() => setShowSaveModal(true)}
                style={{
                  padding: '8px 12px',
                  background: '#4CAF50',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                💾 Save
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="ابحث عن أي شيء..."
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
            onClick={handleSearch}
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

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: '0 0 8px 8px',
              zIndex: 10,
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(s.text)
                    setShowFilters(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #333',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{s.type === 'recent' ? '🕐' : '🔥'}</span>
                  <span>{s.text}</span>
                  {s.count && (
                    <span style={{ color: '#888', fontSize: '11px', marginLeft: 'auto' }}>
                      {s.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'search' as const, label: '🔍 بحث' },
            { id: 'saved' as const, label: '💾 محفوظ' },
            { id: 'history' as const, label: '📜 سجل' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                flex: 1,
                padding: '8px',
                background: view === tab.id ? '#2a2a3e' : '#1a1a2e',
                border: `1px solid ${view === tab.id ? '#4CAF50' : '#333'}`,
                borderRadius: '6px',
                color: view === tab.id ? '#4CAF50' : '#888',
                cursor: 'pointer',
                fontSize: '11px',
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
        {/* Search View */}
        {view === 'search' && (
          <>
            {/* Filters */}
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '8px 12px',
                  background: showFilters ? '#4CAF50' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}
              >
                🎛️ Filters {showFilters ? '▲' : '▼'}
              </button>

              {showFilters && (
                <div style={{
                  padding: '12px',
                  background: '#1a1a2e',
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}>
                  <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>النوع:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() => toggleType(type as SearchableItemType)}
                        style={{
                          padding: '6px 10px',
                          background: selectedTypes.includes(type as SearchableItemType) ? config.color : '#333',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '11px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {config.icon} {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {isSearching ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                <p style={{ color: '#888' }}>جاري البحث...</p>
              </div>
            ) : results.length > 0 ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  color: '#888',
                  fontSize: '12px'
                }}>
                  <span>{totalResults} نتيجة</span>
                  <span>{searchTime.toFixed(0)}ms</span>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  {results.map((result) => (
                    <ResultCard
                      key={result.id}
                      result={result}
                      onClick={() => setSelectedResult(result)}
                    />
                  ))}
                </div>
              </div>
            ) : query.trim() ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <p>لا توجد نتائج لـ "{query}"</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <p>ابدأ بالبحث عن أي شيء</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  يمكنك البحث في القدرات، الأدوات، الاتصالات، الملفات، السجل
                </p>
              </div>
            )}
          </>
        )}

        {/* Saved View */}
        {view === 'saved' && (
          <div>
            {savedSearches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💾</div>
                <p>لا توجد بحوث محفوظة</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {savedSearches.map((saved) => (
                  <div
                    key={saved.id}
                    style={{
                      padding: '12px',
                      background: '#1a1a2e',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleUseSavedSearch(saved.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4CAF50'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{saved.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSavedSearch(saved.id)
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#f44336',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
                      {saved.query.query}
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '10px' }}>
                      استُخدم {saved.useCount} مرة
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div>
            {recentSearches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
                <p>لا يوجد سجل بحث</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button
                    onClick={clearRecentSearches}
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
                  {recentSearches.map((term, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setQuery(term)
                        handleSearch()
                      }}
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
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333'
                      }}
                    >
                      <span style={{ color: '#fff' }}>🔍 {term}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{TYPE_CONFIG[selectedResult.type]?.icon}</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedResult.title}</span>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
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

            <div style={{
              padding: '12px',
              background: '#0d1117',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>النوع:</p>
              <span style={{
                padding: '4px 8px',
                background: TYPE_CONFIG[selectedResult.type]?.color || '#333',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '12px'
              }}>
                {TYPE_CONFIG[selectedResult.type]?.label}
              </span>
            </div>

            <div style={{
              padding: '12px',
              background: '#0d1117',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>الوصف:</p>
              <p style={{ margin: 0, color: '#fff', fontSize: '13px' }}>
                {selectedResult.description}
              </p>
            </div>

            <div style={{
              padding: '12px',
              background: '#0d1117',
              borderRadius: '8px'
            }}>
              <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>التطابق:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  flex: 1,
                  height: '8px',
                  background: '#333',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${selectedResult.matchScore}%`,
                    height: '100%',
                    background: selectedResult.matchScore > 70 ? '#4CAF50' :
                      selectedResult.matchScore > 40 ? '#FF9800' : '#f44336',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <span style={{ color: '#fff', fontSize: '12px' }}>
                  {selectedResult.matchScore.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
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
            maxWidth: '400px',
            width: '90%',
            border: '1px solid #333'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', textAlign: 'center' }}>
              💾 حفظ البحث
            </h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="اسم البحث..."
              style={{
                width: '100%',
                padding: '12px',
                background: '#0d1117',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowSaveModal(false)
                  setSaveName('')
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveName.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: saveName.trim() ? '#4CAF50' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: saveName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultCard({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const config = TYPE_CONFIG[result.type]

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
        e.currentTarget.style.borderColor = config?.color || '#4CAF50'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#333'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>{config?.icon}</span>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
          {result.title}
        </span>
        <span style={{
          padding: '2px 6px',
          background: config?.color || '#333',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '10px',
          marginLeft: 'auto'
        }}>
          {config?.label}
        </span>
      </div>
      <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>
        {result.description.substring(0, 100)}...
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          flex: 1,
          height: '4px',
          background: '#333',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${result.matchScore}%`,
            height: '100%',
            background: result.matchScore > 70 ? '#4CAF50' :
              result.matchScore > 40 ? '#FF9800' : '#f44336'
          }} />
        </div>
        <span style={{ color: '#888', fontSize: '10px' }}>
          {result.matchScore.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
