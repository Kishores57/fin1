import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Building,
  Vote,
  Scale,
  Sparkles,
  Layers,
  History,
  ShieldAlert,
} from 'lucide-react';
import TransparencyDashboard from './TransparencyDashboard';
import ApplicationSubmitForm from './ApplicationSubmitForm';
import ApplicationDetailsView from './ApplicationDetailsView';
import { useAuth } from '../../context/AuthContext';
import './treeCutting.css';

export default function TreeCuttingModule({ initialAppId, onOpenAuth }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [view, setView] = useState(initialAppId ? 'details' : 'directory'); // 'directory' | 'apply' | 'details' | 'mine'
  const [selectedAppId, setSelectedAppId] = useState(initialAppId || null);

  useEffect(() => {
    if (initialAppId) {
      setSelectedAppId(initialAppId);
      setView('details');
    }
  }, [initialAppId]);

  const handleSelectApplication = (appId) => {
    setSelectedAppId(appId);
    setView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewApplication = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setView('apply');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDirectory = () => {
    setView('directory');
    setSelectedAppId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="tc-root space-y-6">
      {/* ── Sub-navigation Control Strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white/70 backdrop-blur-md rounded-2xl border border-[rgba(20,46,31,0.08)] shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setView('directory');
              setSelectedAppId(null);
            }}
            className={`tc-subnav-btn ${view === 'directory' ? 'active' : ''}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Public Directory &amp; KPIs</span>
          </button>

          <button
            type="button"
            onClick={handleNewApplication}
            className={`tc-subnav-btn ${view === 'apply' ? 'active' : ''}`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Lodge Tree-Cutting Permit</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setView('mine');
                setSelectedAppId(null);
              }}
              className={`tc-subnav-btn ${view === 'mine' ? 'active' : ''}`}
            >
              <Building className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>My Lodged Applications</span>
            </button>
          )}
        </div>

        {selectedAppId && view === 'details' && (
          <div className="flex items-center gap-2 pr-2">
            <span className="text-[11px] font-bold text-[#708477]">Viewing:</span>
            <span className="font-mono text-xs font-bold text-[#142e1f] bg-[#f3efe6] px-2 py-0.5 rounded border border-[rgba(20,46,31,0.1)]">
              {selectedAppId}
            </span>
          </div>
        )}
      </div>

      {/* ── Content View Switcher ── */}
      {view === 'apply' && (
        <ApplicationSubmitForm
          onSuccess={(newApp) => {
            setSelectedAppId(newApp.applicationId);
            setView('details');
          }}
          onCancel={handleBackToDirectory}
        />
      )}

      {view === 'details' && selectedAppId && (
        <ApplicationDetailsView
          applicationId={selectedAppId}
          onBack={handleBackToDirectory}
          onStatusUpdated={() => {}}
        />
      )}

      {view === 'mine' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#d8f3dc] border border-[#b7e4c7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#1b4332]" />
              <span className="text-xs font-bold text-[#1b4332]">
                Filtered by Applications Lodged by Your Account: {user?.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setView('directory')}
              className="text-xs font-bold text-[#1b4332] underline hover:text-[#142e1f]"
            >
              Show All Applications
            </button>
          </div>
          <TransparencyDashboard
            onSelectApplication={handleSelectApplication}
            onNewApplication={handleNewApplication}
            mineOnly={true}
          />
        </div>
      )}

      {view === 'directory' && (
        <TransparencyDashboard
          onSelectApplication={handleSelectApplication}
          onNewApplication={handleNewApplication}
        />
      )}
    </div>
  );
}
