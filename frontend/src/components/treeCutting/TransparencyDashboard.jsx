import React, { useState, useEffect } from 'react';
import {
  FileText,
  Vote,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  MapPin,
  Trees,
  Scale,
  ArrowRight,
  Shield,
  Layers,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Eye,
  Plus,
} from 'lucide-react';
import { treeCuttingApi } from '../../services/api';
import './treeCutting.css';

export default function TransparencyDashboard({ onSelectApplication, onNewApplication, mineOnly = false }) {
  const [kpis, setKpis] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [kpiData, appData] = await Promise.all([
        treeCuttingApi.getKpi().catch(() => null),
        treeCuttingApi.listApplications({
          status: statusFilter,
          applicantType: applicantTypeFilter,
          district: districtFilter,
          search: search,
          mine: mineOnly ? 'true' : undefined,
        }),
      ]);
      setKpis(kpiData);
      setApplications(Array.isArray(appData) ? appData : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tree-cutting public records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, applicantTypeFilter, districtFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Voting Open':
        return <span className="tc-badge tc-badge-voting"><Vote className="w-3 h-3" /> Voting Open</span>;
      case 'Approved':
        return <span className="tc-badge tc-badge-approved"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case 'Rejected':
        return <span className="tc-badge tc-badge-rejected"><XCircle className="w-3 h-3" /> Rejected</span>;
      case 'Under Investigation':
        return <span className="tc-badge tc-badge-investigation"><AlertTriangle className="w-3 h-3" /> Under Inquiry</span>;
      default:
        return <span className="tc-badge tc-badge-review"><Clock className="w-3 h-3" /> {status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Atmospheric Banner & Public KPIs ── */}
      <div className="tc-header-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-[#95d5b2] mb-2 backdrop-blur-sm">
              <Scale className="w-3.5 h-3.5" />
              Civic Transparency &middot; Maharashtra Tree Authority Mandate
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-white">
              Public Tree-Cutting Transparency &amp; Voting Portal
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-2xl mt-1 leading-relaxed">
              Every tree-felling application is publicly traceable with GIS spatial impact verification,
              independent public review, dual-ledger public/administrative voting, and mandatory compensatory plantation oversight.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNewApplication}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all flex items-center gap-2 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Lodge New Permit Request</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="tc-kpi-grid">
          <div className="tc-kpi-card">
            <div className="tc-kpi-num">{kpis ? kpis.totalApplications : '—'}</div>
            <div className="tc-kpi-label">Total Permit Requests</div>
          </div>
          <div className="tc-kpi-card border-amber-400/30">
            <div className="tc-kpi-num text-amber-300">{kpis ? kpis.votingOpenApplications : '—'}</div>
            <div className="tc-kpi-label text-amber-200">Active Public Voting</div>
          </div>
          <div className="tc-kpi-card">
            <div className="tc-kpi-num">{kpis ? kpis.totalVotesCast : '—'}</div>
            <div className="tc-kpi-label">Civic Votes Cast</div>
          </div>
          <div className="tc-kpi-card">
            <div className="tc-kpi-num text-emerald-300">{kpis ? kpis.approvedApplications : '—'}</div>
            <div className="tc-kpi-label">Legally Approved</div>
          </div>
          <div className="tc-kpi-card">
            <div className="tc-kpi-num text-red-300">{kpis ? kpis.rejectedApplications : '—'}</div>
            <div className="tc-kpi-label">Requests Rejected</div>
          </div>
          <div className="tc-kpi-card">
            <div className="tc-kpi-num text-emerald-300">
              {kpis ? `${kpis.totalCompensatoryMandated.toLocaleString()} saplings` : '—'}
            </div>
            <div className="tc-kpi-label">1:5 Replanting Mandate</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-[#ffffff] p-4 rounded-2xl border border-[rgba(20,46,31,0.08)] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#708477] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Application ID (e.g. TCA-2026-6997), project title, locality, or applicant..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[rgba(20,46,31,0.14)] bg-[#fdfcf9] text-xs text-[#142e1f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#142e1f] hover:bg-[#1b3d2b] transition-all shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-[#708477] flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter Status:
          </span>

          {[
            { key: 'all', label: 'All Statuses' },
            { key: 'Voting Open', label: 'Voting Open' },
            { key: 'Submitted', label: 'Submitted' },
            { key: 'Documents Under Review', label: 'Under Review' },
            { key: 'Approved', label: 'Approved' },
            { key: 'Rejected', label: 'Rejected' },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setStatusFilter(pill.key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === pill.key
                  ? 'bg-[#142e1f] text-white shadow-xs'
                  : 'bg-[#f3efe6] text-[#44594c] hover:bg-[#e6dfd1]'
              }`}
            >
              {pill.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <select
              value={applicantTypeFilter}
              onChange={(e) => setApplicantTypeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-[rgba(20,46,31,0.12)] bg-[#fdfcf9] text-xs text-[#44594c]"
            >
              <option value="all">All Applicant Types</option>
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
              <option value="Government Department">Government Dept</option>
              <option value="NGO">NGO</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Application Records Grid ── */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#708477] bg-white rounded-2xl border border-[rgba(20,46,31,0.08)]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#2d6a4f] mx-auto mb-2" />
          <span>Retrieving verified permit records and public votes...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-[rgba(20,46,31,0.15)] p-6">
          <FileText className="w-12 h-12 text-[#a68a64] mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-base text-[#142e1f]">No permit requests match your criteria</h3>
          <p className="text-xs text-[#708477] mt-1 max-w-md mx-auto">
            Try adjusting your search query or status filter, or lodge the first transparent tree-cutting request.
          </p>
          <button
            type="button"
            onClick={onNewApplication}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b] inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit First Tree-Cutting Request</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map((app) => (
            <div key={app._id} className="tc-app-card flex flex-col justify-between">
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#2d6a4f] bg-[#d8f3dc] px-2 py-0.5 rounded-md">
                      #{app.applicationId}
                    </span>
                    <span className="text-[11px] text-[#708477] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {/* Title & Reason */}
                <h3 className="font-bold text-base text-[#142e1f] line-clamp-1 mb-1">
                  {app.details.title}
                </h3>
                <p className="text-xs text-[#44594c] line-clamp-2 leading-relaxed mb-3">
                  {app.details.reason}
                </p>

                {/* Location & Impact Stats */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#fbf9f4] border border-[rgba(20,46,31,0.06)] mb-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#708477] uppercase block">Location</span>
                    <span className="font-semibold text-[#142e1f] flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-[#2d6a4f] shrink-0" />
                      {app.details.regionName || `${app.details.city}, ${app.details.district}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#708477] uppercase block">Proposed Removal</span>
                    <span className="font-bold text-red-700 flex items-center gap-1">
                      <Trees className="w-3 h-3 shrink-0" />
                      {app.details.estimatedTreesAffected} Trees
                      {app.gisVerifiedImpact?.verifiedTreeCount > 0 && (
                        <span className="text-[10px] text-[#708477] font-normal">
                          ({app.gisVerifiedImpact.verifiedTreeCount} GIS verified)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Compensatory Replanting Obligation */}
                <div className="text-[11px] text-[#2d6a4f] bg-emerald-50/60 border border-emerald-200/50 rounded-lg p-2 mb-3 flex items-center justify-between">
                  <span>Mandatory Replanting (1:5):</span>
                  <span className="font-bold font-mono">
                    {app.details.estimatedTreesAffected * 5} Native Saplings
                  </span>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-3 border-t border-[rgba(20,46,31,0.08)] flex items-center justify-between gap-3">
                <div className="text-[11px] text-[#708477]">
                  By: <strong className="text-[#142e1f]">{app.applicant.name}</strong> ({app.applicant.applicantType})
                </div>

                <button
                  type="button"
                  onClick={() => onSelectApplication(app.applicationId)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#142e1f] hover:bg-[#1b3d2b] text-white transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Inspect &amp; Vote</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
