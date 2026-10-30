import React, { useState, useEffect, useRef } from 'react';
import MapDashboard from './components/MapDashboard';
import MapAnalysis from './components/MapAnalysis';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import AdminConsoleModal from './components/AdminConsoleModal';
import TreeCuttingModule from './components/treeCutting/TreeCuttingModule';
import NotificationBell from './components/treeCutting/NotificationBell';
import OverviewTreeLab from './components/OverviewTreeLab';
import CommunityPathModule from './components/path/CommunityPathModule';
import { useAuth } from './context/AuthContext';
import { mapRegisteredTreeToCalculatorResult } from './utils/mapTreeToCalculatorResult';
import {
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
  Sparkles,
  Settings,
  ChevronDown,
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
  const [activeTab, setActiveTab]               = useState('overview');
  const [selectedResult, setSelectedResult]     = useState(null);
  const [mapRefreshKey, setMapRefreshKey]        = useState(0);
  const [error, setError]                       = useState('');
  const [showAuthModal, setShowAuthModal]       = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [pendingTab, setPendingTab]             = useState('overview');
  const [selectedPermitId, setSelectedPermitId] = useState(null);
  const [targetLiveMapTree, setTargetLiveMapTree] = useState(null);
  const [analysisInitialTab, setAnalysisInitialTab] = useState('overview');
  const [profileMenuOpen, setProfileMenuOpen]   = useState(false);
  const profileMenuRef                          = useRef(null);

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  const enterApp = (tab = 'overview', authedUser = null) => {
    const target = tab === 'calculator' || tab === 'register' ? 'overview' : tab;
    const isAuthed = Boolean(authedUser) || isAuthenticated || Boolean(localStorage.getItem('vanjeevan_auth_token'));
    if (!isAuthed && target !== 'permits' && target !== 'map' && target !== 'overview') {
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
    setActiveTab(pendingTab || tab || 'overview');
    setShowLanding(false);
    window.scrollTo(0, 0);
  };

  const handleMapTreeAnalysis = (registeredTree) => {
    const mapped = mapRegisteredTreeToCalculatorResult(registeredTree);
    if (!mapped) return;
    setSelectedResult(mapped);
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLocateTreeOnLiveMap = (tree) => {
    setTargetLiveMapTree(tree);
    setActiveTab('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleError = (msg) => setError(msg);

  const handleProtectedTreeSaved = () => {
    setMapRefreshKey((k) => k + 1);
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
    overview: {
      tag: 'Interactive AI Classification',
      title: 'Species Identification',
      description: 'Upload leaf or bark photographs for neural network classification, then input trunk girth (GBH) to predict species, calculate age, and evaluate tree impact in real-time.',
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
    path: {
      tag: 'Community Tree Inventory & Project Setup',
      title: 'Path · Community Forest Setup & Environmental Analysis',
      description: 'Set up tree inventory projects for your college, community, NGO, or city. Connect Epicollect5 mobile survey or upload existing datasets, display GIS trees at real coordinates, and generate evidence-based climate reports.',
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
              title="Return to Landing Page"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`app-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Species Identification</span>
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
              onClick={() => {
                setSelectedPermitId(null);
                setActiveTab('permits');
              }}
              className={`app-nav-btn ${activeTab === 'permits' ? 'active' : ''}`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Cutting Permits &amp; Voting</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('path')}
              className={`app-nav-btn ${activeTab === 'path' ? 'active' : ''}`}
              title="Community Tree Inventory & Project Setup"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Path</span>
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

            {/* Interactive Profile Capsule with Popover Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-[#f8f6f0] border border-[rgba(20,46,31,0.12)] shadow-sm text-xs cursor-pointer transition-all focus:outline-none select-none"
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
                title="Account options & settings"
              >
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
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#708477] transition-transform duration-200 ${
                    profileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Popover Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#fdfcf9] rounded-2xl shadow-2xl border border-[rgba(20,46,31,0.12)] p-2 z-[9999] animate-fadeIn text-[#142e1f]">
                  {/* User Profile Summary */}
                  <div className="px-3 py-2.5 rounded-xl bg-[#f3efe6]/80 mb-1 border border-[rgba(20,46,31,0.06)]">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                          isAdmin ? 'bg-amber-600 shadow-sm' : 'bg-emerald-700 shadow-sm'
                        }`}
                      >
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-xs text-[#142e1f] truncate leading-tight">
                          {user?.name || 'Researcher'}
                        </div>
                        <div className="text-[11px] text-[#708477] truncate font-mono">
                          {user?.email || 'user@vanjeevan.org'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[rgba(20,46,31,0.06)] text-[10px]">
                      <span className="text-[#708477] font-medium">Role:</span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {isAdmin ? 'Administrator' : 'Field Researcher'}
                      </span>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setShowAdminConsole(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#142e1f] hover:bg-[#f3efe6] transition-colors group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                        <Settings className="w-4 h-4 text-[#2d6a4f]" />
                      </div>
                      <div>
                        <div className="font-bold text-[#142e1f]">Settings</div>
                        <div className="text-[10px] text-[#708477] font-normal">
                          Account profile &amp; system console
                        </div>
                      </div>
                    </button>

                    <div className="h-px bg-[rgba(20,46,31,0.08)] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                        setShowLanding(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <div className="font-bold text-red-700">Log Out</div>
                        <div className="text-[10px] text-red-500 font-normal">
                          Sign out of this session
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
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

        {/* Dashboard Stat Strip for Map tab */}
        {activeTab === 'map' && (
          <DashboardStats />
        )}

        {/* Section Header */}
        {activeTab !== 'overview' && (
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
        )}

        {/* View Component */}
        <div className="mt-4">
          {activeTab === 'overview' ? (
            <OverviewTreeLab onEnterApp={(target) => setActiveTab(target === 'register' ? 'overview' : (target || 'overview'))} />
          ) : activeTab === 'map' ? (
            <MapDashboard
              refreshKey={mapRefreshKey}
              onViewAnalysis={handleMapTreeAnalysis}
              targetTree={targetLiveMapTree}
              onTargetTreeHandled={() => setTargetLiveMapTree(null)}
              onReturnToSurvey={() => {
                setAnalysisInitialTab('epicollect');
                setActiveTab('analysis');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : activeTab === 'analysis' ? (
            <MapAnalysis
              onNavigateToLiveMap={handleLocateTreeOnLiveMap}
              initialTab={analysisInitialTab}
            />
          ) : activeTab === 'path' ? (
            <CommunityPathModule
              onNavigateTab={(target) => setActiveTab(target)}
            />
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
