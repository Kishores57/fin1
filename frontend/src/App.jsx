import React, { useState } from 'react';
import HistoryLog from './components/HistoryLog';
import MapDashboard from './components/MapDashboard';
import TreeRegistration from './components/TreeRegistration';
import LandingPage from './components/LandingPage';
import { mapRegisteredTreeToCalculatorResult } from './utils/mapTreeToCalculatorResult';
import { Database, AlertTriangle, X, ShieldCheck, Map, TreePine, Home, Trees } from 'lucide-react';
import treeHero from './assets/tree.jpg';
import './App.css';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('register');
  const [selectedResult, setSelectedResult] = useState(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const enterApp = (tab = 'register') => {
    setActiveTab(tab === 'calculator' ? 'register' : tab);
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
    return <LandingPage onEnterApp={enterApp} />;
  }

  return (
    <>
      {/* Fixed forest background */}
      <div
        className="app-forest-bg"
        style={{ '--app-bg-image': `url(${treeHero})` }}
      />

      {/* Floating glow orbs */}
      <div
        className="app-orb"
        style={{
          width: 420, height: 420,
          background: 'radial-gradient(circle, rgba(61,139,99,0.18) 0%, transparent 70%)',
          top: '-8%', left: '-8%',
        }}
      />
      <div
        className="app-orb"
        style={{
          width: 520, height: 520,
          background: 'radial-gradient(circle, rgba(167,201,87,0.10) 0%, transparent 70%)',
          bottom: '-12%', right: '-10%',
          animationDelay: '-5s',
        }}
      />

      <div className="app-shell">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-16 app-content-wrap">

          {/* ── Header ── */}
          <header className="app-header flex flex-col md:flex-row justify-between items-start md:items-center p-5 mb-8 gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(167,201,87,0.15)', border: '1px solid rgba(167,201,87,0.3)' }}>
                <Trees className="w-5 h-5" style={{ color: '#a7c957' }} />
              </div>
              <div>
                <h1
                  className="text-lg md:text-xl font-black"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    background: 'linear-gradient(90deg, #a7c957, #3d8b63, #a7c957)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  VanJeevan · AI GIS Tree Inventory
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(167,201,87,0.7)', fontFamily: "'Sora', sans-serif" }}>
                  Climate Impact Analysis &amp; RAG System
                </p>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowLanding(true)}
                className="app-tab-btn"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`app-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              >
                <TreePine className="w-3.5 h-3.5" />
                Register &amp; Calculate
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`app-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              >
                <Database className="w-3.5 h-3.5" />
                Inventory Logs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`app-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              >
                <Map className="w-3.5 h-3.5" />
                Live Map
              </button>
            </nav>
          </header>

          {/* ── Error banner ── */}
          {error && (
            <div className="app-error-banner p-4 mb-8 flex justify-between items-center">
              <div className="flex items-center gap-3 text-red-300 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="p-1 rounded-lg transition-all"
                style={{ color: 'rgba(240,247,236,0.5)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Tab content ── */}
          {activeTab === 'register' ? (
            <TreeRegistration
              onError={handleError}
              initialResult={selectedResult}
              onTreeSaved={handleProtectedTreeSaved}
            />
          ) : activeTab === 'history' ? (
            <div className="glass-panel p-8">
              <HistoryLog refreshTrigger={historyRefreshTrigger} onSelectTree={handleSelectHistoryTree} />
            </div>
          ) : (
            <div className="app-map-wrap">
              <MapDashboard refreshKey={mapRefreshKey} onViewAnalysis={handleMapTreeAnalysis} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
