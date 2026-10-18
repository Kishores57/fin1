import React, { useState, useEffect } from 'react';
import HistoryLog from './components/HistoryLog';
import MapDashboard from './components/MapDashboard';
import TreeRegistration from './components/TreeRegistration';
import MapAnalysis from './components/MapAnalysis';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import AdminConsoleModal from './components/AdminConsoleModal';
import TreeCuttingModule from './components/treeCutting/TreeCuttingModule';
import NotificationBell from './components/treeCutting/NotificationBell';
import { useAuth } from './context/AuthContext';
import { mapRegisteredTreeToCalculatorResult } from './utils/mapTreeToCalculatorResult';
import {
  Database,
  AlertTriangle,
  X,
  Map,
  TreePine,
  Home,
  Trees,
  Layers,
  Leaf,
  Globe,
  Compass,
  Crown,
  Shield,
  LogOut,
  LogIn,
  Scale,
} from 'lucide-react';
import { API_BASE_URL } from './services/api';
import './App.css';

// Real photographic banner for app inner shell
const SHELL_BANNER_PHOTO = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1800&q=80';

/* ── Dashboard summary cards with real verified data ── */
function DashboardStats() {
  const [stats, setStats] = useState({
    totalTrees: null,
    species: null,
    zones: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const [epicRes, mongoRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/epicollect/trees`).then((r) => r.ok ? r.json() : []),
          fetch(`${API_BASE_URL}/api/registered-trees`).then((r) => r.ok ? r.json() : []),
        ]);
        if (cancelled) return;
        const epic  = epicRes.status  === 'fulfilled' ? (epicRes.value  || []) : [];
        const mongo = mongoRes.status === 'fulfilled' ? (mongoRes.value || []) : [];
        const all   = [...epic, ...mongo];
        const speciesSet = new Set(all.map((t) => t.species || t.treeName).filter(Boolean));
        setStats({ totalTrees: all.length, species: speciesSet.size, zones: 4, loading: false });
      } catch {
        if (!cancelled) setStats((s) => ({ ...s, loading: false }));
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  if (stats.loading || stats.totalTrees === null) return null;

  const cards = [
    { label: 'Registered Trees',  value: stats.totalTrees.toLocaleString(), sub: 'Verified field & inventory database', icon: <TreePine className="w-4 h-4 text-emerald-700" />,   color: '#1b3d2b' },
    { label: 'Tree Species',       value: stats.species,                      sub: 'Unique species cataloged in study',  icon: <Leaf className="w-4 h-4 text-emerald-600" />,        color: '#2d6a4f' },
    { label: 'Monitored Zones',    value: stats.zones,                        sub: 'Predefined GIS study areas',         icon: <Compass className="w-4 h-4 text-amber-700" />,     color: '#582f0e' },
    { label: 'Data Sources',       value: '4 Scientific',                    sub: 'Sentinel-2, Landsat-9, LULC, Survey',icon: <Globe className="w-4 h-4 text-emerald-700" />,      color: '#24523a' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="app-stat-card">
          <div className="app-stat-label flex items-center gap-1.5" style={{ color: card.color }}>
            {card.icon}
            <span>{card.label}</span>
          </div>
          <div className="app-stat-value" style={{ color: card.color }}>{card.value}</div>
          <div className="app-stat-sub">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const [showLanding, setShowLanding]           = useState(true);
  const [activeTab, setActiveTab]               = useState('register');
  const [selectedResult, setSelectedResult]     = useState(null);
  const [mapRefreshKey, setMapRefreshKey]        = useState(0);
  const [error, setError]                       = useState('');
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [showAuthModal, setShowAuthModal]       = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [pendingTab, setPendingTab]             = useState('register');
  const [selectedPermitId, setSelectedPermitId] = useState(null);

  const enterApp = (tab = 'register', authedUser = null) => {
    const target = tab === 'calculator' ? 'register' : tab;
    const isAuthed = Boolean(authedUser) || isAuthenticated || Boolean(localStorage.getItem('vanjeevan_auth_token'));
    if (!isAuthed && target !== 'permits' && target !== 'map') {
      setPendingTab(target);
      setShowAuthModal(true);
      return;
    }
    setActiveTab(target);
    setShowLanding(false);
    window.scrollTo(0, 0);
  };

  const handleAuthDone = (_authedUser, tab) => {
    setShowAuthModal(false);
    setActiveTab(pendingTab || tab || 'register');
    setShowLanding(false);
    window.scrollTo(0, 0);
  };

  const handleSelectHistoryTree = (tree) => {
    setSelectedResult(tree);
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMapTreeAnalysis = (registeredTree) => {
    const mapped = mapRegisteredTreeToCalculatorResult(registeredTree);
    if (!mapped) return;
    setSelectedResult(mapped);
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleError = (msg) => setError(msg);

  const handleProtectedTreeSaved = () => {
    setMapRefreshKey((k) => k + 1);
    setHistoryRefreshTrigger((prev) => prev + 1);
  };

  if (showLanding) {
    return (
      <>
        <LandingPage onEnterApp={enterApp} />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthDone}
          initialTab="login"
        />
        <AdminConsoleModal
          isOpen={showAdminConsole}
          onClose={() => setShowAdminConsole(false)}
        />
      </>
    );
  }

  const TAB_INFO = {
    register: {
      tag: 'Tree Inventory & AI Evaluation',
      title: 'Tree Registration & Carbon Calculator',
      description: 'Accurately register individual trees with mandatory GPS coordinates, GBH, height, and health condition. Calculate biomass, carbon sequestration, and generate ecological conservation reasons.',
    },
    history: {
      tag: 'Verified Records Archive',
      title: 'Tree Inventory Logs',
      description: 'Explore the centralized catalog of registered trees, cumulative carbon storage metrics, and detailed species records across monitored zones.',
    },
    map: {
      tag: 'Interactive Cartography',
      title: 'Live GIS Campus Map',
      description: 'Inspect registered trees with spatial accuracy, explore species distributions, and examine field data markers on high-resolution GIS layers.',
    },
    analysis: {
      tag: 'Geospatial Intelligence',
      title: 'Map-Based Tree Plantation & Vegetation Analysis',
      description: 'Analyze Sentinel-2 NDVI canopy cover, Landsat-9 surface heat islands, and inspect ranked candidate plantation locations computed with multi-criteria environmental algorithms.',
    },
    permits: {
      tag: 'Transparent Civic Governance',
      title: 'Tree-Cutting Permits, Verification & Public Voting Portal',
      description: 'Inspect public felling applications with GIS impact zones, verify mandatory environmental documentation, cast verified community votes, and monitor statutory 1:5 compensatory afforestation compliance under Maharashtra Tree Act 1975.',
    },
  };

  return (
    <div className="app-shell">
      {/* ── Top Atmospheric Photo Banner ── */}
      <div
        className="app-top-banner"
        style={{ backgroundImage: `url(${SHELL_BANNER_PHOTO})` }}
      >
        <div className="app-top-banner-content">
          <span className="app-top-badge">
            <Trees className="w-3.5 h-3.5" />
            VanJeevan · GIS Tree Conservation Platform
          </span>
          <h1 className="app-top-title">
            Evidence-Based Urban Forest Stewardship
          </h1>
          <p className="app-top-sub">
            Bridging satellite Earth observation with local tree preservation &amp; sustainable planning.
          </p>
        </div>
      </div>

      {/* ── Sticky Nature Navigation Bar ── */}
      <header className="app-header-nav">
        <div className="app-nav-container">
          {/* Brand */}
          <div className="app-brand" onClick={() => setShowLanding(true)}>
            <div className="app-brand-icon">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <div className="app-brand-name">VanJeevan</div>
              <div className="app-brand-tagline">GIS Tree Inventory &amp; Climate Intelligence</div>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="app-nav-tabs">
            <button
              type="button"
              onClick={() => setShowLanding(true)}
              className="app-nav-btn"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`app-nav-btn ${activeTab === 'register' ? 'active' : ''}`}
            >
              <TreePine className="w-3.5 h-3.5" />
              <span>Tree Registration</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`app-nav-btn ${activeTab === 'map' ? 'active' : ''}`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Live GIS Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`app-nav-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Map Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`app-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Inventory Logs</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPermitId(null);
                setActiveTab('permits');
              }}
              className={`app-nav-btn ${activeTab === 'permits' ? 'active' : ''}`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Cutting Permits &amp; Voting</span>
            </button>
          </nav>

          {/* User Profile & Role Controls */}
          <div className="flex items-center gap-2">
            <NotificationBell
              onSelectApplication={(appId) => {
                setSelectedPermitId(appId);
                setActiveTab('permits');
                setShowLanding(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminConsole(true)}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
                title="Open Administrative Governance Console"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Admin Console</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[rgba(20,46,31,0.12)] shadow-sm text-xs">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  isAdmin
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-emerald-700 text-white shadow-sm'
                }`}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-bold text-[#142e1f] leading-tight truncate max-w-[120px]">
                  {user?.name || 'Researcher'}
                </div>
                <div className="text-[10px] text-[#708477] uppercase tracking-wider font-semibold">
                  {user?.role === 'admin' ? 'Administrator' : 'Field Researcher'}
                </div>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isAdmin ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isAdmin ? 'ADMIN' : 'USER'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                setShowLanding(true);
              }}
              title="Sign Out"
              className="p-2 rounded-full text-[#708477] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Application Content ── */}
      <main className={`${activeTab === 'analysis' ? 'max-w-[1720px]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
        {/* Error Alert */}
        {error && (
          <div className="app-error-banner p-4 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="p-1 rounded-lg text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Stat Strip for Map & History tabs */}
        {(activeTab === 'map' || activeTab === 'history') && (
          <DashboardStats />
        )}

        {/* Section Header */}
        <div className="app-page-header">
          <div className="flex items-center gap-2 mb-1">
            <span className="nature-chip nature-chip-forest">
              {TAB_INFO[activeTab]?.tag}
            </span>
          </div>
          <h2 className="app-page-heading">
            {TAB_INFO[activeTab]?.title}
          </h2>
          <p className="app-page-description">
            {TAB_INFO[activeTab]?.description}
          </p>
        </div>

        {/* View Component */}
        <div className="mt-4">
          {activeTab === 'register' ? (
            <TreeRegistration
              onError={handleError}
              initialResult={selectedResult}
              onTreeSaved={handleProtectedTreeSaved}
            />
          ) : activeTab === 'history' ? (
            <HistoryLog refreshTrigger={historyRefreshTrigger} onSelectTree={handleSelectHistoryTree} />
          ) : activeTab === 'map' ? (
            <MapDashboard refreshKey={mapRefreshKey} onViewAnalysis={handleMapTreeAnalysis} />
          ) : activeTab === 'analysis' ? (
            <MapAnalysis />
          ) : (
            <TreeCuttingModule
              initialAppId={selectedPermitId}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )}
        </div>
      </main>

      {/* ── Clean Editorial Footer ── */}
      <footer className="mt-20 border-t border-[rgba(20,46,31,0.08)] bg-[#f3efe6] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#708477]">
          <div className="flex items-center gap-2">
            <Trees className="w-4 h-4 text-[#2d6a4f]" />
            <span className="font-bold text-[#142e1f]">VanJeevan GIS Tree Inventory System</span>
            <span>·</span>
            <span>KK Wagh Institute of Engineering Education &amp; Research</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Copernicus Sentinel-2 MSI</span>
            <span>·</span>
            <span>USGS Landsat 9 TIRS-2</span>
            <span>·</span>
            <span>NRSC LULC Classification</span>
          </div>
        </div>
      </footer>

      {/* Admin Governance Console */}
      <AdminConsoleModal
        isOpen={showAdminConsole}
        onClose={() => setShowAdminConsole(false)}
      />

      {/* Role-Based Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthDone}
        initialTab="login"
      />
    </div>
  );
}
