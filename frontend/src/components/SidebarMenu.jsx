import React, { useState, useMemo } from 'react';

export const SidebarMenu = ({
  trees = [],
  onFocusTree,
  onSelectTree,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return trees.filter((t) => {
      const species = (t.species || t.treeName || '').toLowerCase();
      const sci = (t.scientificName || '').toLowerCase();
      const habitat = (t.habitat || '').toLowerCase();
      const id = String(t.id || t.treeId || '');
      return species.includes(q) || sci.includes(q) || habitat.includes(q) || id.includes(q);
    }).slice(0, 8); // top 8 results
  }, [trees, query]);

  const impactColor = (impact) => {
    if (impact === 'Critical') return '#ef4444';
    if (impact === 'High') return '#f59e0b';
    return '#10b981';
  };

  const handleSelectResult = (tree) => {
    if (onFocusTree) onFocusTree(tree);
    if (onSelectTree) onSelectTree(tree);
    setIsExpanded(false);
  };

  return (
    <div
      className={`map-search-container ${className}`}
      style={{
        position: 'absolute',
        top: '1.25rem',
        left: '1.25rem',
        zIndex: 1000,
        width: 'min(90vw, 360px)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── SEARCH INPUT BOX ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45), 0 0 20px rgba(52, 211, 153, 0.1)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Search Icon */}
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* Input */}
        <input
          type="text"
          placeholder="Search species, habitat, ID..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isExpanded) setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            fontSize: '0.88rem',
            fontWeight: 500,
          }}
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '999px',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.7rem',
            }}
          >
            ✕
          </button>
        )}

        {/* Toggle Expand / Results Indicator */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* ── EXPANDED SEARCH PANEL ── */}
      {isExpanded && (
        <div
          style={{
            marginTop: '0.5rem',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
            padding: '0.85rem',
            maxHeight: '380px',
            overflowY: 'auto',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Quick Species Filter Chips */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '0.4rem' }}>
              Quick Filters
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {['Neem', 'Banyan', 'Mango', 'Peepal', 'Rain Tree', 'Ashok Tree'].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setQuery(name);
                    setIsExpanded(true);
                  }}
                  style={{
                    background: query.toLowerCase() === name.toLowerCase() ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${query.toLowerCase() === name.toLowerCase() ? 'rgba(52, 211, 153, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: query.toLowerCase() === name.toLowerCase() ? '#34d399' : '#cbd5e1',
                    borderRadius: '999px',
                    padding: '0.22rem 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {query.trim() !== '' && results.length > 0 && (
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {results.length} Tree{results.length > 1 ? 's' : ''} Found
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {results.map((tree) => (
                  <button
                    key={tree.id}
                    type="button"
                    onClick={() => handleSelectResult(tree)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      padding: '0.55rem 0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#f1f5f9' }}>
                          {tree.species || tree.treeName}
                        </span>
                        {tree.impact && (
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            color: impactColor(tree.impact),
                            background: impactColor(tree.impact) + '22',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '999px',
                            border: `1px solid ${impactColor(tree.impact)}44`,
                          }}>
                            {tree.impact}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        ID #{tree.id || tree.treeId} · {tree.age ? `${tree.age} yrs` : 'Age measured'} · {tree.co2 ? `${Math.round(tree.co2)} kg CO₂` : 'Live survey'}
                      </div>
                    </div>
                    <span style={{ color: '#34d399', fontSize: '0.85rem' }}>➔</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results state */}
          {query.trim() !== '' && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1rem 0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
              No trees found matching "{query}"
            </div>
          )}

          {/* Total Tree Count Footer */}
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.6rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.7rem',
            color: '#64748b',
          }}>
            <span>Total Mapped: <strong style={{ color: '#94a3b8' }}>{trees.length} trees</strong></span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#34d399',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarMenu;
