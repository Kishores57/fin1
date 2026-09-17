import React, { useState, useMemo } from 'react';
import { LiquidGlassCard } from './LiquidGlassCard';

const Icon = ({ name, size = 18, className = '', color }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide?.icons?.[name]) {
      window.lucide.createIcons({
        icons: { [name]: window.lucide.icons[name] },
        nameAttr: 'data-lucide',
        attrs: { class: className, width: size, height: size, ...(color ? { stroke: color } : {}) },
      });
    }
  }, [name, size, className, color]);
  return <i ref={ref} data-lucide={name} style={{ display: 'flex', alignItems: 'center' }} />;
};

// ── Panel: HOME ─────────────────────────────────────────────────────────────
const HomePanel = ({ onOpenAddModal }) => (
  <nav className="sidebar-nav">
    <button className="sidebar-menu-btn action-btn" onClick={onOpenAddModal}>
      <Icon name="PlusCircle" size={17} />
      <span>Map & Register Tree</span>
    </button>
  </nav>
);

// ── Panel: OVERVIEW ─────────────────────────────────────────────────────────
const OverviewPanel = ({ trees }) => {
  const [activeInsight, setActiveInsight] = useState(0);

  const validTrees = trees.filter((t) => t.lat && t.lng);
  const totalCo2 = Math.round(trees.reduce((a, t) => a + (t.co2 || 0), 0));
  const avgAge = Math.round(trees.reduce((a, t) => a + (t.age || 0), 0) / Math.max(trees.length, 1));
  const criticalCt = trees.filter((t) => t.impact === 'Critical').length;
  const highCt = trees.filter((t) => t.impact === 'High').length;
  const moderateCt = trees.filter((t) => t.impact === 'Moderate').length;

  // Mini Chart Path
  const trendPoints = [[5, 35], [25, 30], [45, 25], [65, 28], [85, 20], [105, 15], [125, 18], [145, 5]];
  const svgPath = `M ${trendPoints.map(p => p.join(',')).join(' L ')}`;
  const svgFill = `${svgPath} L 145,40 L 5,40 Z`;

  const aiInsights = [
    { title: 'Critical Risk', text: `${criticalCt} critical trees need hydration.`, color: '#ef4444', icon: '🔥' },
    { title: 'CO₂ Boost', text: '+18% carbon capture expected.', color: '#10b981', icon: '📈' },
    { title: 'Plantation', text: 'Ideal sapling zone identified in North grid.', color: '#3b82f6', icon: '💡' }
  ];

  return (
    <div className="sidebar-panel">
      <div className="overview-mini-kpi">
        <div className="mini-kpi-box">
          <Icon name="Trees" size={14} color="#10b981" />
          <div>
            <strong>{trees.length}</strong>
            <span>Mapped</span>
          </div>
        </div>
        <div className="mini-kpi-box">
          <Icon name="CloudRain" size={14} color="#6366f1" />
          <div>
            <strong>{totalCo2}kg</strong>
            <span>CO₂ Cap</span>
          </div>
        </div>
        <div className="mini-kpi-box">
          <Icon name="AlertTriangle" size={14} color="#ef4444" />
          <div>
            <strong>{criticalCt}</strong>
            <span>Critical</span>
          </div>
        </div>
        <div className="mini-kpi-box">
          <Icon name="Leaf" size={14} color="#f59e0b" />
          <div>
            <strong>{avgAge}y</strong>
            <span>Avg Age</span>
          </div>
        </div>
      </div>

      <div className="overview-mini-chart">
        <div className="mini-chart-header">
          <span>CO₂ Trend</span>
          <span className="mini-badge">+18%</span>
        </div>
        <svg viewBox="0 0 150 40" className="mini-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mini-co2grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={svgFill} fill="url(#mini-co2grad)" />
          <path d={svgPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="overview-mini-ai">
        <div className="mini-ai-header">
          <Icon name="Bot" size={14} color="#6366f1" /> AI Insights
        </div>
        <div className="mini-ai-tabs">
          {aiInsights.map((ins, i) => (
            <button key={i} className={`mini-ai-tab ${activeInsight === i ? 'active' : ''}`} onClick={() => setActiveInsight(i)}>
              {ins.icon}
            </button>
          ))}
        </div>
        <div className="mini-ai-body" style={{ borderColor: aiInsights[activeInsight].color }}>
          <strong>{aiInsights[activeInsight].title}</strong>
          <p>{aiInsights[activeInsight].text}</p>
        </div>
      </div>
    </div>
  );
};

// ── Panel: SEARCH SPECIES ────────────────────────────────────────────────────
const SearchPanel = ({ trees, onFocusTree }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return trees.filter(
      (t) =>
        t.species?.toLowerCase().includes(q) ||
        t.habitat?.toLowerCase().includes(q) ||
        String(t.id).includes(q)
    ).slice(0, 8);
  }, [query, trees]);

  const impactColor = (impact) => {
    if (impact === 'Critical') return '#EF4444';
    if (impact === 'High') return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="sidebar-panel">
      <div className="sidebar-search-box">
        <svg
          className="sidebar-search-icon-inner"
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search species, habitat…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sidebar-search-input"
          autoFocus
        />
        {query && (
          <button className="sidebar-search-clear" onClick={() => setQuery('')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {query.trim() === '' && (
        <div className="sidebar-hint">
          <p>Type a species name, habitat, or tree ID.</p>
          <div className="sidebar-hint-chips">
            {['Neem', 'Banyan', 'Mango', 'Rain Tree'].map((s) => (
              <button key={s} className="hint-chip" onClick={() => setQuery(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {query.trim() !== '' && results.length === 0 && (
        <div className="sidebar-empty">
          <Icon name="Leaf" size={28} />
          <p>No trees matched "<strong>{query}</strong>"</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="sidebar-results">
          <div className="sidebar-results-count">{results.length} tree{results.length > 1 ? 's' : ''} found</div>
          {results.map((tree) => (
            <button
              key={tree.id}
              className="sidebar-result-item"
              onClick={() => onFocusTree && onFocusTree(tree)}
            >
              <div className="sidebar-result-main">
                <span className="sidebar-result-species">{tree.species}</span>
                <span
                  className="sidebar-result-badge"
                  style={{ background: impactColor(tree.impact) + '22', color: impactColor(tree.impact), borderColor: impactColor(tree.impact) + '44' }}
                >
                  {tree.impact}
                </span>
              </div>
              <div className="sidebar-result-sub">
                ID #{tree.id} · {tree.age} yrs · {tree.co2?.toLocaleString()} kg CO₂
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Panel: ACCOUNT & SETTINGS ────────────────────────────────────────────────
const AccountPanel = () => {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    appName: 'UniqueVan',
    location: 'Nashik, Maharashtra',
    email: '',
    notifications: true,
    autoZoom: true,
    mapStyle: 'voyager',
  });

  const update = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="sidebar-panel">
      <div className="sidebar-panel-header">
        <Icon name="Settings" size={15} />
        <span>Settings</span>
      </div>

      <div className="account-scroll-area">
        <div className="account-fields">
          <div className="account-field">
            <label>App / Team Name</label>
            <input
              type="text"
              value={settings.appName}
              onChange={(e) => update('appName', e.target.value)}
              className="account-input"
            />
          </div>

          <div className="account-field">
            <label>Map Style</label>
            <select
              value={settings.mapStyle}
              onChange={(e) => update('mapStyle', e.target.value)}
              className="account-input"
            >
              <option value="voyager">Voyager (Default)</option>
              <option value="satellite">Satellite</option>
              <option value="terrain">Terrain</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>

          <div className="account-toggles">
            <div className="account-toggle-row">
              <div>
                <div className="toggle-label">Push Notifications</div>
                <div className="toggle-sub">Alerts for critical habitats</div>
              </div>
              <button
                className={`toggle-pill ${settings.notifications ? 'on' : ''}`}
                onClick={() => update('notifications', !settings.notifications)}
                aria-label="Toggle notifications"
              >
                <div className="toggle-thumb" />
              </button>
            </div>
            <div className="account-toggle-row">
              <div>
                <div className="toggle-label">Auto-zoom to Trees</div>
                <div className="toggle-sub">Fit map on load</div>
              </div>
              <button
                className={`toggle-pill ${settings.autoZoom ? 'on' : ''}`}
                onClick={() => update('autoZoom', !settings.autoZoom)}
                aria-label="Toggle auto-zoom"
              >
                <div className="toggle-thumb" />
              </button>
            </div>
          </div>
        </div>

        <button
          className={`account-save-btn ${saved ? 'saved' : ''}`}
          onClick={handleSave}
        >
          {saved ? <><Icon name="Check" size={15} /> Saved!</> : <><Icon name="Save" size={15} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
};

// ── Main SidebarMenu ─────────────────────────────────────────────────────────
export const SidebarMenu = ({
  onOpenAddModal,
  trees = [],
  onFocusTree,
  className = '',
}) => {
  const [view, setView] = useState('home'); // 'home' | 'overview' | 'search' | 'settings'

  return (
    <div className={`liquid-glass-sidebar-container ${className}`}>
      <LiquidGlassCard
        glowIntensity="sm"
        shadowIntensity="sm"
        borderRadius="20px"
        blurIntensity="sm"
        draggable
        style={{ width: '320px', padding: '0.75rem 0.9rem' }}
      >
        {/* ── Brand Header ── */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Icon name="Trees" size={17} />
          </div>
          <div className="sidebar-brand-text">
            <strong>uniquevan</strong>
            <span>Tree Network · Nashik</span>
          </div>
          <div className="sidebar-brand-dot" />
        </div>

        {/* ── Tab Bar ── */}
        <div className="sidebar-tab-bar">
          <button
            className={`sidebar-tab ${view === 'home' ? 'active' : ''}`}
            onClick={() => setView('home')}
            title="Navigation"
          >
            <Icon name="Home" size={15} />
            <span>Home</span>
          </button>
          <button
            className={`sidebar-tab ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
            title="Overview"
          >
            <Icon name="BarChart3" size={15} />
            <span>Overview</span>
          </button>
          <button
            className={`sidebar-tab ${view === 'search' ? 'active' : ''}`}
            onClick={() => setView('search')}
            title="Search Species"
          >
            <Icon name="Search" size={15} />
            <span>Search</span>
          </button>
          <button
            className={`sidebar-tab ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
            title="Settings"
          >
            <Icon name="Settings" size={15} />
            <span>Settings</span>
          </button>
        </div>

        {/* ── Panel Content ── */}
        <div className="sidebar-content">
          {view === 'home' && (
            <HomePanel
              onOpenAddModal={onOpenAddModal}
            />
          )}
          {view === 'overview' && (
            <OverviewPanel trees={trees} />
          )}
          {view === 'search' && (
            <SearchPanel trees={trees} onFocusTree={(tree) => {
              onFocusTree && onFocusTree(tree);
              setView('home');
            }} />
          )}
          {view === 'settings' && <AccountPanel />}
        </div>
      </LiquidGlassCard>
    </div>
  );
};

export default SidebarMenu;
