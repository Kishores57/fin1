import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  MapPin,
  Trees,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Scale,
  Vote,
  Download,
  Upload,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  MessageSquare,
  History,
  Check,
  Eye,
  Building,
  Flag,
  Share2,
  Sparkles,
  RefreshCw,
  Send,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { treeCuttingApi, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './treeCutting.css';

export default function ApplicationDetailsView({ applicationId, onBack, onStatusUpdated }) {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [app, setApp] = useState(null);
  const [votesData, setVotesData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, documents, voting, decision, audit

  // Voting form state
  const [voteType, setVoteType] = useState('approve');
  const [voteJustification, setVoteJustification] = useState('');
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');

  // Admin status transition state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [votingDays, setVotingDays] = useState(14);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Admin decision form state
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionChoice, setDecisionChoice] = useState('Approved');
  const [officialReasoning, setOfficialReasoning] = useState('');
  const [divergenceJustification, setDivergenceJustification] = useState('');
  const [compensatoryRatio, setCompensatoryRatio] = useState(5);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // Civic report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('Undercounted Tree Census');
  const [reportDetails, setReportDetails] = useState('');
  const [reportEvidence, setReportEvidence] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Document upload state
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Site Photographs');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Load application, votes, and audit trail
  const loadFullDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [appData, vData, logs] = await Promise.all([
        treeCuttingApi.getApplication(applicationId),
        treeCuttingApi.getVotes(applicationId).catch(() => null),
        treeCuttingApi.getAuditTrail(applicationId).catch(() => []),
      ]);
      setApp(appData);
      setVotesData(vData);
      setAuditLogs(Array.isArray(logs) ? logs : []);

      if (vData?.userVote) {
        setVoteType(vData.userVote.voteType);
        setVoteJustification(vData.userVote.justification || '');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      loadFullDetails();
    }
  }, [applicationId]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!app || loading || activeSubTab !== 'overview') return;
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    const lat = app.location?.coordinates?.[1] || 20.0131;
    const lng = app.location?.coordinates?.[0] || 73.8213;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 20,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (map) {
      // Clear previous layers
      map.eachLayer((layer) => {
        if (!layer._url) map.removeLayer(layer);
      });

      // Impact center pin
      const pulseIcon = L.divIcon({
        className: 'custom-tree-pin',
        html: `<div style="background:#dc2626;width:20px;height:20px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 12px rgba(220,38,38,0.9);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">!</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([lat, lng], { icon: pulseIcon })
        .addTo(map)
        .bindPopup(`<strong>${app.details?.title}</strong><br/>Proposed Felling Center`);

      // Buffer zone circle
      const radius = app.gisVerifiedImpact?.bufferRadiusMeters || 50;
      L.circle([lat, lng], {
        radius,
        color: '#dc2626',
        fillColor: '#fee2e2',
        fillOpacity: 0.35,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map);

      // Render overlapping trees if any
      const nearbyTrees = app.gisVerifiedImpact?.trees || [];
      nearbyTrees.forEach((t) => {
        if (!t.latitude || !t.longitude) return;
        const dot = L.circleMarker([t.latitude, t.longitude], {
          radius: 6,
          fillColor: '#e07a27',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9,
        }).addTo(map);

        dot.bindPopup(`
          <div style="font-size:12px;">
            <strong>${t.treeName || 'Verified Cataloged Tree'}</strong><br/>
            ${t.scientificName || ''}<br/>
            <span style="color:#dc2626;font-weight:bold;">Within Proposed Cutting Zone</span>
          </div>
        `);
      });

      map.setView([lat, lng], 16);
      setTimeout(() => map.invalidateSize(), 250);
    }
  }, [app, loading, activeSubTab]);

  // Clean up map
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle voting submission
  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (!voteJustification.trim()) {
      setVoteMessage('Please provide a brief rationale explaining your vote.');
      return;
    }

    setVoteSubmitting(true);
    setVoteMessage('');
    try {
      const res = await treeCuttingApi.castVote(app.applicationId, {
        voteType,
        justification: voteJustification.trim(),
      });
      setVoteMessage(res.message || 'Vote recorded successfully!');
      // Reload votes
      const vData = await treeCuttingApi.getVotes(app.applicationId);
      setVotesData(vData);
    } catch (err) {
      setVoteMessage(err.response?.data?.detail || 'Failed to submit vote.');
    } finally {
      setVoteSubmitting(false);
    }
  };

  // Handle Admin Status Transition
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setStatusUpdating(true);
    try {
      const updated = await treeCuttingApi.updateStatus(app.applicationId, {
        status: newStatus,
        votingDays: Number(votingDays) || 14,
      });
      setApp(updated);
      setShowStatusModal(false);
      loadFullDetails();
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      alert(err.response?.data?.detail || 'Status transition failed.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle Admin Decision Recording
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!officialReasoning || officialReasoning.trim().length < 20) {
      alert('A comprehensive legal reasoning (minimum 20 characters) is required.');
      return;
    }

    setDecisionSubmitting(true);
    try {
      await treeCuttingApi.recordDecision(app.applicationId, {
        decision: decisionChoice,
        officialReasoning: officialReasoning.trim(),
        divergenceJustification: divergenceJustification.trim(),
        compensatoryRatio: Number(compensatoryRatio) || 5,
        requiredSaplings: (app.details?.estimatedTreesAffected || 1) * Number(compensatoryRatio || 5),
      });
      setShowDecisionModal(false);
      loadFullDetails();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record decision.');
    } finally {
      setDecisionSubmitting(false);
    }
  };

  // Handle Document Verification Toggle (Admin)
  const handleVerifyDocument = async (docId, status, notes = '') => {
    try {
      await treeCuttingApi.verifyDocument(app.applicationId, docId, { status, notes });
      loadFullDetails();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update document verification.');
    }
  };

  // Handle Document Upload
  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('category', uploadCategory);
      fd.append('title', uploadTitle || uploadFile.name);
      await treeCuttingApi.uploadDocument(app.applicationId, fd);
      setShowDocUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      loadFullDetails();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setDocUploading(false);
    }
  };

  // Handle Civic Fraud / Violation Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportDetails.trim()) return;
    setReportSubmitting(true);
    setReportSuccess('');
    try {
      const res = await treeCuttingApi.reportConcern(app.applicationId, {
        concernType: reportType,
        details: reportDetails.trim(),
        evidenceNotes: reportEvidence.trim(),
      });
      setReportSuccess(res.message || 'Concern lodged successfully.');
      setReportDetails('');
      setReportEvidence('');
      setTimeout(() => setShowReportModal(false), 2000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to file report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tc-app-card text-center py-20">
        <RefreshCw className="w-8 h-8 text-[#2d6a4f] animate-spin mx-auto mb-3" />
        <div className="text-sm font-semibold text-[#142e1f]">Retrieving Application Ledger...</div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="tc-app-card text-center py-16 space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <div className="text-base font-bold text-red-800">{error || 'Application not found.'}</div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-full text-xs font-bold bg-[#142e1f] text-white"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  // Lifecycle steps calculation
  const LIFECYCLE_STAGES = [
    { key: 'Submitted', label: 'Submitted' },
    { key: 'Documents Under Review', label: 'Docs Review' },
    { key: 'Public Review', label: 'Public Review' },
    { key: 'Voting Open', label: 'Voting Open' },
    { key: 'Voting Closed', label: 'Voting Closed' },
    { key: 'Decision Issued', label: 'Ruling Issued' },
  ];

  const currentStageIndex = (() => {
    if (app.decision || app.status === 'Approved' || app.status === 'Rejected') return 5;
    if (app.status === 'Voting Closed' || app.status === 'Awaiting Administrative Decision') return 4;
    if (app.status === 'Voting Open') return 3;
    if (app.status === 'Public Review') return 2;
    if (app.status === 'Documents Under Review' || app.status === 'Initial Review') return 1;
    return 0;
  })();

  const pubVotes = votesData?.publicStats || { total: 0, approve: 0, reject: 0, abstain: 0, approvePercent: 0, rejectPercent: 0, abstainPercent: 0 };
  const admVotes = votesData?.adminStats || { total: 0, approve: 0, reject: 0, abstain: 0, approvePercent: 0, rejectPercent: 0, abstainPercent: 0 };
  const mandatedSaplings = (app.details?.estimatedTreesAffected || 1) * 5;

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Back & Quick Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#708477] hover:text-[#142e1f] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Directory</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Civic Fraud Report Button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5 text-purple-600" />
              <span>Report Concern / Fraud</span>
            </button>
          )}

          {/* Admin Status Transition Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setNewStatus(app.status);
                setShowStatusModal(true);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span>Manage Lifecycle</span>
            </button>
          )}

          {/* Admin Issue Decision Button */}
          {isAdmin && !app.decision && (
            <button
              type="button"
              onClick={() => setShowDecisionModal(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#142e1f] hover:bg-[#1b3d2b] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Scale className="w-3.5 h-3.5 text-[#95d5b2]" />
              <span>Issue Official Ruling</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Header Card ── */}
      <div className="tc-app-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#f3efe6] text-[#142e1f] border border-[rgba(20,46,31,0.12)]">
                {app.applicationId}
              </span>
              <span className="text-xs text-[#708477]">
                Lodged {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-xs text-[#708477]">&middot;</span>
              <span className="text-xs text-[#708477] font-semibold">
                {app.details?.district || 'Nashik'}, {app.details?.state || 'Maharashtra'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-[#142e1f]">
              {app.details?.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#708477] pt-1">
              <span className="flex items-center gap-1 font-semibold text-[#142e1f]">
                <Building className="w-3.5 h-3.5 text-[#2d6a4f]" />
                {app.applicant?.organization || app.applicant?.name} ({app.applicant?.applicantType})
              </span>
              <span>&middot;</span>
              <span>Category: <strong>{app.details?.reason}</strong></span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="text-right">
              <div className="text-[10px] text-[#708477] uppercase font-bold tracking-wider">Status</div>
              <span className={`tc-badge ${
                app.status === 'Voting Open'
                  ? 'tc-badge-voting'
                  : app.status === 'Approved'
                  ? 'tc-badge-approved'
                  : app.status === 'Rejected'
                  ? 'tc-badge-rejected'
                  : app.status === 'Under Investigation'
                  ? 'tc-badge-investigation'
                  : 'tc-badge-review'
              } text-xs px-3 py-1 mt-0.5`}>
                {app.status}
              </span>
            </div>
          </div>
        </div>

        {/* ── Visual Lifecycle Tracker ── */}
        <div className="pt-4 pb-2 border-t border-[rgba(20,46,31,0.06)]">
          <div className="flex items-center justify-between relative">
            {LIFECYCLE_STAGES.map((st, idx) => {
              const isDone = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;
              return (
                <div key={st.key} className="flex-1 flex flex-col items-center relative text-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
                      isDone
                        ? 'bg-[#2d6a4f] text-white shadow-sm'
                        : isActive
                        ? 'bg-[#e07a27] text-white shadow-md ring-4 ring-amber-100'
                        : 'bg-[#e6dfd1] text-[#708477]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 truncate max-w-[80px] ${
                    isActive ? 'text-[#e07a27]' : isDone ? 'text-[#2d6a4f]' : 'text-[#708477]'
                  }`}>
                    {st.label}
                  </span>
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <div
                      className={`absolute top-3.5 left-1/2 w-full h-[2px] -z-0 ${
                        idx < currentStageIndex ? 'bg-[#2d6a4f]' : 'bg-[#e6dfd1]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 pt-3 border-t border-[rgba(20,46,31,0.06)] overflow-x-auto">
          {[
            { key: 'overview', label: 'GIS & Overview', icon: <MapPin className="w-3.5 h-3.5" /> },
            { key: 'documents', label: `Documents (${app.documents?.length || 0})`, icon: <FileText className="w-3.5 h-3.5" /> },
            { key: 'voting', label: `Voting Room (${pubVotes.total + admVotes.total})`, icon: <Vote className="w-3.5 h-3.5" /> },
            { key: 'decision', label: 'Tree Authority Ruling', icon: <Scale className="w-3.5 h-3.5" /> },
            { key: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: <History className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeSubTab === tab.key
                  ? 'bg-[#142e1f] text-white shadow-sm'
                  : 'text-[#708477] hover:text-[#142e1f] hover:bg-[#f3efe6]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SUB-TAB 1: GIS IMPACT & OVERVIEW ── */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Statutory Ecological Matrix Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="tc-app-card p-4 bg-gradient-to-br from-red-50 to-white border-red-200">
              <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1">
                <Trees className="w-3.5 h-3.5" />
                Trees Proposed to Cut
              </div>
              <div className="text-2xl font-bold font-['Fraunces'] text-red-700 mt-1">
                {app.details?.estimatedTreesAffected} Trees
              </div>
              <div className="text-[10px] text-red-600 mt-0.5">
                {app.details?.speciesKnown || 'Native Canopy'}
              </div>
            </div>

            <div className="tc-app-card p-4 bg-gradient-to-br from-amber-50 to-white border-amber-200">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Verified Trees at Risk
              </div>
              <div className="text-2xl font-bold font-['Fraunces'] text-amber-700 mt-1">
                {app.gisVerifiedImpact?.treesInZone ?? app.gisVerifiedImpact?.verifiedTreeCount ?? 0} Trees
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                In {app.gisVerifiedImpact?.bufferRadiusMeters || 50}m GIS Impact Zone
              </div>
            </div>

            <div className="tc-app-card p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                Statutory 1:5 Mandate
              </div>
              <div className="text-2xl font-bold font-['Fraunces'] text-emerald-800 mt-1">
                {mandatedSaplings} Saplings
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                Maharashtra Tree Act 1975
              </div>
            </div>

            <div className="tc-app-card p-4 bg-gradient-to-br from-teal-50 to-white border-teal-200">
              <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Carbon Storage at Risk
              </div>
              <div className="text-2xl font-bold font-['Fraunces'] text-teal-800 mt-1">
                {(app.gisVerifiedImpact?.carbonStorageKg || app.gisVerifiedImpact?.estimatedCarbonLossKg || (app.details?.estimatedTreesAffected || 1) * 220).toLocaleString()} kg
              </div>
              <div className="text-[10px] text-teal-700 mt-0.5">
                CO2e biomass sequestered
              </div>
            </div>
          </div>

          {/* Embedded Leaflet Map & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 tc-app-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2d6a4f]" />
                  <span className="text-sm font-bold text-[#142e1f]">
                    Geospatial Location &amp; Verified Inventory Overlap
                  </span>
                </div>
                <span className="text-xs font-mono text-[#708477]">
                  {app.location?.coordinates?.[1]?.toFixed(5)}, {app.location?.coordinates?.[0]?.toFixed(5)}
                </span>
              </div>

              <div ref={mapContainerRef} className="tc-mini-map" style={{ height: '360px' }} />

              <div className="flex items-center justify-between text-[11px] text-[#708477] pt-1">
                <span>🔴 Red Dot &amp; Circle: Proposed Felling Zone ({app.gisVerifiedImpact?.bufferRadiusMeters || 50}m Buffer)</span>
                <span>🟠 Orange Dots: Verified Field Trees in Catalog</span>
              </div>
            </div>

            {/* Project Scope Sidebar */}
            <div className="tc-app-card space-y-4">
              <div className="text-xs font-bold text-[#142e1f] uppercase tracking-wider pb-2 border-b border-[rgba(20,46,31,0.08)]">
                Project Scope &amp; Alternatives
              </div>

              <div>
                <span className="text-[10px] text-[#708477] uppercase font-bold block">Need &amp; Justification</span>
                <p className="text-xs text-[#142e1f] leading-relaxed mt-0.5">
                  {app.details?.description}
                </p>
              </div>

              {app.details?.alternativesConsidered && (
                <div>
                  <span className="text-[10px] text-[#708477] uppercase font-bold block">Alternatives Evaluated</span>
                  <p className="text-xs text-[#142e1f] leading-relaxed mt-0.5">
                    {app.details?.alternativesConsidered}
                  </p>
                </div>
              )}

              {app.details?.compensatoryPlantingPlan && (
                <div className="p-3 rounded-xl bg-[#d8f3dc] border border-[#b7e4c7] space-y-1">
                  <span className="text-[10px] text-[#1b4332] uppercase font-bold block">
                    Compensatory Plantation Plan
                  </span>
                  <div className="text-xs font-semibold text-[#142e1f]">
                    Site: {app.details.compensatoryPlantingPlan.proposedLocation}
                  </div>
                  <div className="text-[11px] text-[#2d6a4f]">
                    Target Species: {Array.isArray(app.details.compensatoryPlantingPlan.proposedSpecies) ? app.details.compensatoryPlantingPlan.proposedSpecies.join(', ') : 'Native species'}
                  </div>
                  <div className="text-[10px] text-[#1b4332] font-semibold pt-1">
                    Statutory Ratio: 1:{app.details.compensatoryPlantingPlan.ratio || 5} &middot; 3-Year Care
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: DOCUMENT VERIFICATION MATRIX ── */}
      {activeSubTab === 'documents' && (
        <div className="space-y-4">
          <div className="tc-app-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(20,46,31,0.08)]">
              <div>
                <h3 className="text-base font-bold text-[#142e1f]">
                  Statutory Document Verification Matrix
                </h3>
                <p className="text-xs text-[#708477]">
                  Public inspection repository for environmental impact assessments, work orders, and tree census sheets.
                </p>
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setShowDocUploadModal(true)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Addendum Document</span>
                </button>
              )}
            </div>

            {(!app.documents || app.documents.length === 0) ? (
              <div className="text-center py-12 text-xs text-[#708477]">
                No supporting documents attached yet.
              </div>
            ) : (
              <div className="divide-y divide-[rgba(20,46,31,0.06)] pt-2">
                {app.documents.map((doc) => {
                  const downloadUrl = treeCuttingApi.getDocumentDownloadUrl(app.applicationId, doc._id);
                  return (
                    <div key={doc._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#142e1f]">
                            {doc.title || doc.originalName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-[#f3efe6] text-[#708477]">
                            {doc.category}
                          </span>
                          {doc.isConfidential && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                              Confidential
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#708477] flex items-center gap-2">
                          <span>{(doc.sizeBytes / 1024).toFixed(0)} KB</span>
                          <span>&middot;</span>
                          <span>Uploaded by {doc.uploadedBy || 'Applicant'}</span>
                          {doc.verifiedBy && (
                            <>
                              <span>&middot;</span>
                              <span className="text-emerald-700 font-semibold">Reviewed by {doc.verifiedBy}</span>
                            </>
                          )}
                        </div>
                        {doc.verificationNotes && (
                          <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-100 mt-1">
                            Note: {doc.verificationNotes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          doc.verificationStatus === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : doc.verificationStatus === 'Rejected'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {doc.verificationStatus || 'Pending Review'}
                        </span>

                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#708477] hover:text-[#142e1f] hover:bg-[#f3efe6] transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Admin verification controls */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 pl-2 border-l border-[rgba(20,46,31,0.1)]">
                            <button
                              type="button"
                              onClick={() => handleVerifyDocument(doc._id, 'Verified', 'Verified by Municipal Authority')}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Mark Verified"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const reason = prompt('Please specify rejection reason for this document:');
                                if (reason) handleVerifyDocument(doc._id, 'Rejected', reason);
                              }}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Reject Document"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: DUAL-LEDGER VOTING ROOM ── */}
      {activeSubTab === 'voting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Voting Tallies & Cast Vote Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Public Community Vote Summary */}
            <div className="tc-app-card space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(20,46,31,0.08)]">
                <div>
                  <h3 className="text-base font-bold text-[#142e1f]">Public Community Voting Ledger</h3>
                  <p className="text-xs text-[#708477]">Verified votes from registered citizen reviewers.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#f3efe6] text-[#142e1f]">
                  {pubVotes.total} Total Citizen Votes
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="tc-vote-bar-bg h-3 rounded-full">
                  <div
                    className="tc-vote-bar-approve"
                    style={{ width: `${pubVotes.approvePercent}%` }}
                    title={`Approve: ${pubVotes.approvePercent}%`}
                  />
                  <div
                    className="tc-vote-bar-reject"
                    style={{ width: `${pubVotes.rejectPercent}%` }}
                    title={`Reject: ${pubVotes.rejectPercent}%`}
                  />
                  <div
                    className="tc-vote-bar-abstain"
                    style={{ width: `${pubVotes.abstainPercent}%` }}
                    title={`Abstain: ${pubVotes.abstainPercent}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold pt-1">
                  <span className="text-[#2d6a4f] flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2d6a4f] inline-block" />
                    Approve: {pubVotes.approve} ({pubVotes.approvePercent}%)
                  </span>
                  <span className="text-[#dc2626] flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block" />
                    Reject: {pubVotes.reject} ({pubVotes.rejectPercent}%)
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
                    Abstain: {pubVotes.abstain} ({pubVotes.abstainPercent}%)
                  </span>
                </div>
              </div>

              {/* Administrator Separate Review Tallies */}
              <div className="p-3.5 rounded-2xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.08)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#142e1f] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2d6a4f]" />
                    Official Tree Authority Reviewer Tallies (Separate Ledger)
                  </span>
                  <span className="text-[11px] font-bold text-[#708477]">
                    {admVotes.total} Official Reviews
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-emerald-700">Approve: {admVotes.approve}</span>
                  <span className="text-red-700">Reject: {admVotes.reject}</span>
                  <span className="text-gray-600">Abstain: {admVotes.abstain}</span>
                </div>
              </div>
            </div>

            {/* Voting Submission Form */}
            <div className="tc-app-card space-y-4">
              <div className="pb-2 border-b border-[rgba(20,46,31,0.08)]">
                <h4 className="text-sm font-bold text-[#142e1f]">Cast or Modify Your Vote</h4>
                <p className="text-xs text-[#708477]">
                  {app.status === 'Voting Open'
                    ? 'Voting is active. One vote per registered user is enforced by cryptographically signed identity.'
                    : `Voting is currently ${app.status} for this application.`}
                </p>
              </div>

              {voteMessage && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold">
                  {voteMessage}
                </div>
              )}

              {isAuthenticated ? (
                <form onSubmit={handleVoteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#142e1f] mb-1.5">
                      Your Stance
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setVoteType('approve')}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                          voteType === 'approve'
                            ? 'bg-[#d8f3dc] text-[#1b4332] border-[#2d6a4f] shadow-sm ring-2 ring-emerald-200'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Approve (With 1:5 Plan)
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoteType('reject')}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                          voteType === 'reject'
                            ? 'bg-red-50 text-red-800 border-red-600 shadow-sm ring-2 ring-red-200'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Reject (Ecological Harm)
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoteType('abstain')}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                          voteType === 'abstain'
                            ? 'bg-gray-200 text-gray-800 border-gray-400 shadow-sm ring-2 ring-gray-300'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Abstain / Inquire
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#142e1f] mb-1">
                      Vote Rationale &amp; Civic Justification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={voteJustification}
                      onChange={(e) => setVoteJustification(e.target.value)}
                      placeholder="Explain your reasoning based on tree species, carbon loss, compensatory adequacy, or alternative alignments..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#708477]">
                      Voting as: <strong>{user?.name}</strong> ({isAdmin ? 'Administrator' : 'Citizen Reviewer'})
                    </span>
                    <button
                      type="submit"
                      disabled={voteSubmitting || app.status !== 'Voting Open'}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                        app.status !== 'Voting Open'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#142e1f] text-white hover:bg-[#1b3d2b]'
                      }`}
                    >
                      <Vote className="w-3.5 h-3.5" />
                      <span>{votesData?.userVote ? 'Update Vote Rationale' : 'Cast Official Vote'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-600">
                  Please log in with your registered account to participate in public voting.
                </div>
              )}
            </div>
          </div>

          {/* Right: Public Rationale Stream */}
          <div className="tc-app-card space-y-4">
            <div className="pb-2 border-b border-[rgba(20,46,31,0.08)]">
              <h4 className="text-sm font-bold text-[#142e1f]">Community Discussion &amp; Rationales</h4>
              <p className="text-[11px] text-[#708477]">Recent evidence-based perspectives.</p>
            </div>

            {(!votesData?.recentRationales || votesData.recentRationales.length === 0) ? (
              <div className="text-center py-8 text-xs text-[#708477]">
                No public rationales recorded yet. Be the first to cast a vote!
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {votesData.recentRationales.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.06)] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#142e1f]">{r.userName || 'Citizen'}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        r.voteType === 'approve'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.voteType === 'reject'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {r.voteType.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#142e1f] leading-relaxed italic">
                      &ldquo;{r.justification}&rdquo;
                    </p>
                    <div className="text-[10px] text-[#708477] text-right">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: OFFICIAL TREE AUTHORITY RULING ── */}
      {activeSubTab === 'decision' && (
        <div className="space-y-6">
          {app.decision ? (
            <div className="tc-app-card space-y-6 border-l-4 border-l-[#2d6a4f]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(20,46,31,0.08)]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2d6a4f]">
                    Maharashtra Urban Areas Tree Authority Order
                  </span>
                  <h3 className="text-2xl font-bold font-['Fraunces'] text-[#142e1f] mt-0.5">
                    Official Regulatory Ruling: {app.decision.decision}
                  </h3>
                  <div className="text-xs text-[#708477] mt-0.5">
                    Order Ref: #{app.decision._id} &middot; Issued by {app.decision.decidedBy?.name || 'Tree Officer'} ({app.decision.decidedBy?.title || 'Tree Authority'})
                  </div>
                </div>

                <span className={`tc-badge ${
                  app.decision.decision === 'Approved' ? 'tc-badge-approved' : 'tc-badge-rejected'
                } text-sm px-4 py-1.5`}>
                  {app.decision.decision}
                </span>
              </div>

              {/* Statutory Legal Reasoning */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#142e1f] uppercase tracking-wider block">
                  Legal Statutory Reasoning &amp; Order
                </span>
                <p className="text-sm text-[#142e1f] leading-relaxed bg-[#f8f6f0] p-4 rounded-2xl border border-[rgba(20,46,31,0.08)]">
                  {app.decision.officialReasoning}
                </p>
              </div>

              {/* Divergence alert if ruling diverged from public vote */}
              {app.decision.divergenceJustification && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Scale className="w-4 h-4 text-amber-700" />
                    Statutory Divergence Justification (Differs from Majority Public Sentiment)
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {app.decision.divergenceJustification}
                  </p>
                </div>
              )}

              {/* Mandatory Replanting Mandate */}
              <div className="p-5 rounded-2xl bg-[#d8f3dc] border border-[#b7e4c7] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trees className="w-5 h-5 text-[#1b4332]" />
                    <span className="text-sm font-bold text-[#1b4332]">
                      Statutory Compensatory Replanting Mandate
                    </span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1b4332] text-white">
                    1 : {app.decision.compensatoryPlantingMandate?.ratio || 5} Ratio
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[#2d6a4f] block text-[10px]">Mandatory Saplings:</span>
                    <strong className="text-lg font-bold text-[#142e1f]">
                      {app.decision.compensatoryPlantingMandate?.requiredSaplings} Saplings
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#2d6a4f] block text-[10px]">Maintenance Term:</span>
                    <strong className="text-lg font-bold text-[#142e1f]">
                      {app.decision.compensatoryPlantingMandate?.maintenanceTermYears || 3} Years
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#2d6a4f] block text-[10px]">Monitoring Authority:</span>
                    <strong className="text-sm font-bold text-[#142e1f]">
                      {app.decision.compensatoryPlantingMandate?.monitoringOfficer || 'Municipal Tree Officer'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="tc-app-card text-center py-16 space-y-4">
              <Scale className="w-12 h-12 text-[#708477] mx-auto opacity-60" />
              <div>
                <h4 className="text-lg font-bold text-[#142e1f]">Ruling Pending</h4>
                <p className="text-xs text-[#708477] max-w-md mx-auto mt-1">
                  The Municipal Tree Authority has not issued the formal regulatory ruling yet.
                  Public review, document verification, and voting are actively ongoing.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(true)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all shadow-md inline-flex items-center gap-2"
                >
                  <Scale className="w-4 h-4 text-[#95d5b2]" />
                  <span>Issue Official Regulatory Ruling Now</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 5: IMMUTABLE AUDIT TRAIL ── */}
      {activeSubTab === 'audit' && (
        <div className="tc-app-card space-y-4">
          <div className="pb-2 border-b border-[rgba(20,46,31,0.08)]">
            <h3 className="text-base font-bold text-[#142e1f]">Immutable Civic Audit Trail Ledger</h3>
            <p className="text-xs text-[#708477]">
              Append-only tamper-evident event log of all lodgements, reviews, votes, and administrative orders.
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#708477]">
              No audit records generated yet.
            </div>
          ) : (
            <div className="divide-y divide-[rgba(20,46,31,0.06)]">
              {auditLogs.map((log) => (
                <div key={log._id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#2d6a4f] bg-[#d8f3dc] px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="font-semibold text-[#142e1f]">
                        {log.actor?.name || 'System'} ({log.actor?.role || 'Service'})
                      </span>
                    </div>
                    <p className="text-[#142e1f] text-xs pt-0.5">
                      {log.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#708477] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Admin Status Transition ── */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[rgba(20,46,31,0.12)]">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-bold text-[#142e1f]">Manage Permit Lifecycle</h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Transition Status To
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white"
                >
                  <option value="Documents Under Review">Documents Under Review</option>
                  <option value="Public Review">Public Review (Open for Inspection)</option>
                  <option value="Voting Open">Voting Open (Accepting Public Votes)</option>
                  <option value="Voting Closed">Voting Closed (Review Tallies)</option>
                  <option value="Under Investigation">Under Investigation / Inquiry</option>
                </select>
              </div>

              {newStatus === 'Voting Open' && (
                <div>
                  <label className="block text-xs font-bold text-[#142e1f] mb-1">
                    Voting Window Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={votingDays}
                    onChange={(e) => setVotingDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusUpdating}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b]"
                >
                  {statusUpdating ? 'Updating...' : 'Confirm Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Admin Decision Ruling ── */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[rgba(20,46,31,0.12)] my-8">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-base font-bold text-[#142e1f]">Issue Official Tree Authority Ruling</h3>
                <p className="text-xs text-[#708477]">Statutory Order under Maharashtra Tree Act 1975</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDecisionModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#142e1f] mb-1">Formal Decision</label>
                <select
                  value={decisionChoice}
                  onChange={(e) => setDecisionChoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="Approved">Approved (Subject to Compensatory Plantation)</option>
                  <option value="Rejected">Rejected (Severe Ecological Harm)</option>
                  <option value="Returned for Revision">Returned for Revision</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#142e1f] mb-1">
                  Official Legal Reasoning (Min 20 characters) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={officialReasoning}
                  onChange={(e) => setOfficialReasoning(e.target.value)}
                  placeholder="Record formal statutory findings regarding public interest, environmental impact, canopy loss, and legal conditions..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142e1f] mb-1">
                  Divergence Justification (Mandatory if ruling differs from majority public vote)
                </label>
                <textarea
                  rows={2}
                  value={divergenceJustification}
                  onChange={(e) => setDivergenceJustification(e.target.value)}
                  placeholder="Explain why the regulatory decision deviates from public majority sentiment..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#142e1f] mb-1">Compensatory Ratio</label>
                  <input
                    type="number"
                    min="5"
                    max="15"
                    value={compensatoryRatio}
                    onChange={(e) => setCompensatoryRatio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#142e1f] mb-1">Calculated Saplings Mandated</label>
                  <input
                    type="text"
                    disabled
                    value={`${(app.details?.estimatedTreesAffected || 1) * Number(compensatoryRatio || 5)} Saplings`}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 font-bold text-[#2d6a4f]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-4 py-2 rounded-full font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={decisionSubmitting}
                  className="px-5 py-2 rounded-full font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b]"
                >
                  {decisionSubmitting ? 'Recording...' : 'Render Official Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Civic Fraud / Violation Report ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[rgba(20,46,31,0.12)]">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-[#142e1f]">Report Concern or Violation</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#142e1f] mb-1">Violation Category</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="Undercounted Tree Census">Undercounted Tree Census / False Count</option>
                    <option value="Misrepresented Land Ownership">Misrepresented Land Ownership / Title</option>
                    <option value="Illegal Felling Prior to Permit">Illegal Felling Prior to Permit</option>
                    <option value="Inadequate Compensatory Site">Inadequate Compensatory Site</option>
                    <option value="Heritage Tree at Risk">Heritage Tree (Over 50 yrs) Not Disclosed</option>
                    <option value="Other Regulatory Non-Compliance">Other Regulatory Non-Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#142e1f] mb-1">Factual Details &amp; Concerns <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe specific observations, discrepancies with field reality, or violations..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#142e1f] mb-1">Evidence / Witness Notes</label>
                  <textarea
                    rows={2}
                    value={reportEvidence}
                    onChange={(e) => setReportEvidence(e.target.value)}
                    placeholder="Geo-tagged photographs, survey markers, or references..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-full font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting || !reportDetails.trim()}
                    className="px-5 py-2 rounded-full font-bold bg-purple-700 text-white hover:bg-purple-800"
                  >
                    {reportSubmitting ? 'Lodging...' : 'Lodge Concern for Inquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Upload Addendum Document ── */}
      {showDocUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[rgba(20,46,31,0.12)]">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-bold text-[#142e1f]">Upload Supporting Document</h3>
              <button
                type="button"
                onClick={() => setShowDocUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDocUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#142e1f] mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="Site Photographs">Site Photographs</option>
                  <option value="Tree Enumeration Sheet">Tree Enumeration Sheet</option>
                  <option value="Environmental Impact Assessment">Environmental Impact Assessment</option>
                  <option value="Compensatory Plantation Blueprint">Compensatory Plantation Blueprint</option>
                  <option value="Project Approval">Project Approval / Municipal Order</option>
                  <option value="Other">Other Addendum</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#142e1f] mb-1">Document Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Ward 12 EIA Survey Addendum"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142e1f] mb-1">Choose File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="text-xs text-gray-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowDocUploadModal(false)}
                  className="px-4 py-2 rounded-full font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docUploading || !uploadFile}
                  className="px-5 py-2 rounded-full font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b]"
                >
                  {docUploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
