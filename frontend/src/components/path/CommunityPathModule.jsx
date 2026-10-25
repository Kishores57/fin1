import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Trees,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UploadCloud,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Activity,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Shield,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Printer,
  Info,
  X,
  ChevronDown,
  Database,
  Calendar,
  Mail,
  Building,
  Globe,
  Leaf,
  Sparkles,
  TreePine,
  Scale,
  Award,
} from 'lucide-react';
import { projectApi } from '../../services/api';
import L, { createTileLayer, BASEMAP_TILES, DEFAULT_MAP_CENTER } from '../../utils/mapConfig';
import './CommunityPathModule.css';

// Curated species color palette for GIS markers
const SPECIES_PALETTE = {
  'Rain Tree': '#d97706',
  'Coconut Tree': '#059669',
  'Coconut': '#059669',
  'Palm Tree': '#0d9488',
  'Child Palm': '#0891b2',
  'Chinese Palm': '#0284c7',
  'Ashok Tree': '#15803d',
  'Ashoka': '#15803d',
  'Bamboo Tree': '#84cc16',
  'Bamboo': '#84cc16',
  'Guava Tree': '#ca8a04',
  'Neem': '#16a34a',
  'Banyan': '#14532d',
  'Peepal': '#166534',
  'Mango': '#ea580c',
  default: '#2d6a4f',
};

function getSpeciesColor(speciesName) {
  if (!speciesName) return SPECIES_PALETTE.default;
  for (const [key, color] of Object.entries(SPECIES_PALETTE)) {
    if (speciesName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return SPECIES_PALETTE.default;
}

export default function CommunityPathModule({ onNavigateTab }) {
  // Master state
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('kkwagh-campus');
  const [currentStep, setCurrentStep] = useState(1);
  const [activeProject, setActiveProject] = useState(null);
  const [projectTrees, setProjectTrees] = useState([]);
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Load project list on mount
  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await projectApi.getProjects();
      const list = data.projects || [];
      setProjects(list);
      if (list.length > 0 && !activeProjectId) {
        setActiveProjectId(list[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tree inventory projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // When activeProjectId changes, load details, trees, and stats
  useEffect(() => {
    if (!activeProjectId) return;
    let cancelled = false;

    async function loadCurrentProjectData() {
      setActionLoading(true);
      setError('');
      try {
        const [projRes, treesRes, statsRes] = await Promise.allSettled([
          projectApi.getProject(activeProjectId),
          projectApi.getTrees(activeProjectId, { limit: 1000 }),
          projectApi.getStats(activeProjectId),
        ]);

        if (cancelled) return;

        if (projRes.status === 'fulfilled' && projRes.value?.project) {
          setActiveProject(projRes.value.project);
        }
        if (treesRes.status === 'fulfilled' && treesRes.value?.trees) {
          setProjectTrees(treesRes.value.trees);
        }
        if (statsRes.status === 'fulfilled') {
          setProjectStats(statsRes.value);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to synchronize project data.');
      } finally {
        if (!cancelled) setActionLoading(false);
      }
    }

    loadCurrentProjectData();
    return () => {
      cancelled = true;
    };
  }, [activeProjectId]);

  const handleProjectSwitch = (newId) => {
    setActiveProjectId(newId);
    setSuccess('');
    setError('');
  };

  const handleOpenReport = async () => {
    try {
      setActionLoading(true);
      const data = await projectApi.getReport(activeProjectId);
      setReportData(data?.report);
      setShowReportModal(true);
    } catch {
      setError('Failed to generate full project report.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="path-container">
      {/* ─── Hero Header & Overview ─── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#142e1f] via-[#1b3d2b] to-[#2d6a4f] text-white shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Path · Community Tree Inventory &amp; Project Setup
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90">
              <Globe className="w-3 h-3 text-emerald-300" />
              Multi-Campus &amp; Community Framework
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold font-['Fraunces'] tracking-tight">
            Empower Your Community with GIS Tree Stewardship
          </h1>
          <p className="text-sm sm:text-base text-white/85 mt-2 leading-relaxed">
            Expand beyond our baseline K.K. Wagh campus survey. Set up dedicated tree inventory projects for other colleges,
            urban neighborhoods, municipal parks, or conservation NGOs. Collect field observations with Epicollect5 or file uploads,
            plot trees at real GPS coordinates, and compute verified allometric carbon storage audits.
          </p>

          {/* Active Project Capsule / Switcher */}
          <div className="mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-bold text-amber-300">
                <Trees className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                  Active Project Scope
                </div>
                <div className="font-bold text-base text-white flex items-center gap-2">
                  <span>{activeProject?.name || 'Loading Project...'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-mono">
                    {projectTrees.length} Trees
                  </span>
                </div>
              </div>
            </div>

            {/* Switch Project Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={activeProjectId}
                onChange={(e) => handleProjectSwitch(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-[#142e1f] border border-white/20 focus:outline-none cursor-pointer shadow-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.totalTrees || 0} trees)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#e2b342] text-stone-900 hover:bg-[#d4a332] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Notification Alerts ─── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button type="button" onClick={() => setSuccess('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── 4-Step Stepper Navigation ─── */}
      <div className="path-stepper">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`path-step-card ${currentStep === 1 ? 'active' : ''}`}
        >
          <div className="path-step-badge">1</div>
          <div>
            <div className="path-step-text-title">Create Project</div>
            <div className="path-step-text-sub">Metadata &amp; study area</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`path-step-card ${currentStep === 2 ? 'active' : ''}`}
        >
          <div className="path-step-badge">2</div>
          <div>
            <div className="path-step-text-title">Collect or Upload Data</div>
            <div className="path-step-text-sub">Epicollect5, CSV, Excel, GeoJSON</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className={`path-step-card ${currentStep === 3 ? 'active' : ''}`}
        >
          <div className="path-step-badge">3</div>
          <div>
            <div className="path-step-text-title">Map &amp; Analyze Trees</div>
            <div className="path-step-text-sub">Interactive GIS cartography</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(4)}
          className={`path-step-card ${currentStep === 4 ? 'active' : ''}`}
        >
          <div className="path-step-badge">4</div>
          <div>
            <div className="path-step-text-title">Generate Report</div>
            <div className="path-step-text-sub">Carbon &amp; climate audit</div>
          </div>
        </button>
      </div>

      {/* ─── Step Content Rendering ─── */}
      <div className="mt-2">
        {currentStep === 1 && (
          <Step1CreateProject
            onProjectCreated={(newProject) => {
              loadProjects();
              setActiveProjectId(newProject.id);
              setActiveProject(newProject);
              setSuccess(`Project "${newProject.name}" created successfully! Now connect your data source.`);
              setCurrentStep(2);
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2DataImport
            activeProject={activeProject}
            onImportSuccess={() => {
              loadProjects();
              // Reload project data
              projectApi.getTrees(activeProjectId, { limit: 1000 }).then((res) => {
                setProjectTrees(res.trees || []);
              });
              projectApi.getStats(activeProjectId).then((s) => setProjectStats(s));
              setSuccess('Tree observations imported and allometric parameters calculated successfully!');
              setCurrentStep(3);
            }}
          />
        )}

        {currentStep === 3 && (
          <Step3ProjectMap
            activeProject={activeProject}
            trees={projectTrees}
            onNextStep={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4AnalysisReport
            activeProject={activeProject}
            stats={projectStats}
            trees={projectTrees}
            onOpenFullReport={handleOpenReport}
          />
        )}
      </div>

      {/* ─── Printable / Downloadable Full Project Report Modal ─── */}
      {showReportModal && reportData && (
        <ProjectReportModal
          report={reportData}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STEP 1: CREATE A TREE INVENTORY PROJECT
   ══════════════════════════════════════════════════════════════════════════════ */
function Step1CreateProject({ onProjectCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    description: '',
    country: 'India',
    state: 'Maharashtra',
    city: 'Nashik',
    study_area: 'College Campus / Community Grove',
    coordinator: '',
    contact_email: '',
    center_lat: 20.0135,
    center_lng: 73.8213,
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Preset location quick selection
  const LOCATION_PRESETS = [
    { name: 'Nashik (KK Wagh Campus)', lat: 20.0135, lng: 73.8213, city: 'Nashik', state: 'Maharashtra' },
    { name: 'Pune (University Campus)', lat: 18.5529, lng: 73.8262, city: 'Pune', state: 'Maharashtra' },
    { name: 'Mumbai (IIT Powai Lake)', lat: 19.1334, lng: 72.9133, city: 'Mumbai', state: 'Maharashtra' },
    { name: 'Nagpur (Seminary Hills)', lat: 21.1612, lng: 79.0625, city: 'Nagpur', state: 'Maharashtra' },
    { name: 'Bangalore (Cubbon Park)', lat: 12.9763, lng: 77.5929, city: 'Bengaluru', state: 'Karnataka' },
  ];

  // Initialize interactive Leaflet map for location selection
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [formData.center_lat, formData.center_lng],
      zoom: 15,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    createTileLayer({ maxZoom: 19 }).addTo(map);

    // Center pin marker
    const marker = L.marker([formData.center_lat, formData.center_lng], {
      draggable: true,
      title: 'Study Area Center',
    }).addTo(map);
    markerRef.current = marker;

    marker.bindPopup('<b>Study Area Center</b><br/>Drag pin or click on map to reposition.').openPopup();

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setFormData((prev) => ({
        ...prev,
        center_lat: parseFloat(pos.lat.toFixed(6)),
        center_lng: parseFloat(pos.lng.toFixed(6)),
      }));
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setFormData((prev) => ({
        ...prev,
        center_lat: parseFloat(e.latlng.lat.toFixed(6)),
        center_lng: parseFloat(e.latlng.lng.toFixed(6)),
      }));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      city: preset.city,
      state: preset.state,
      center_lat: preset.lat,
      center_lng: preset.lng,
    }));
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([preset.lat, preset.lng], 16);
      markerRef.current.setLatLng([preset.lat, preset.lng]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.organization.trim() || !formData.coordinator.trim() || !formData.contact_email.trim()) {
      setFormError('Please fill in all required fields: Project Name, Organization, Coordinator, and Contact Email.');
      return;
    }

    // Build standard polygon boundary around center point (+/- 0.003 degrees buffer ~ 300m)
    const lat = formData.center_lat;
    const lng = formData.center_lng;
    const offset = 0.003;
    const boundaryPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [lng - offset, lat - offset],
          [lng + offset, lat - offset],
          [lng + offset, lat + offset],
          [lng - offset, lat + offset],
          [lng - offset, lat - offset],
        ],
      ],
    };

    setSaving(true);
    try {
      const res = await projectApi.createProject({
        ...formData,
        boundary: boundaryPolygon,
      });
      if (res?.project) {
        onProjectCreated(res.project);
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create project. Please verify inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="path-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[rgba(20,46,31,0.08)]">
        <div>
          <span className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider">
            Step 1: Project Initiation &amp; Study Area
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
            Create a Community Tree Inventory Project
          </h2>
          <p className="text-xs text-[#708477] mt-0.5">
            Configure your organization profile, survey bounds, and environmental monitoring metadata.
          </p>
        </div>

        {/* Quick location presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#708477]">Presets:</span>
          {LOCATION_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#f3efe6] hover:bg-[#e8e2d5] text-[#142e1f] transition-colors"
            >
              {p.city}
            </button>
          ))}
        </div>
      </div>

      {formError && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-[#142e1f] mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Pune University Botanical Tree Census 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Organization Name */}
          <div>
            <label className="block text-xs font-bold text-[#142e1f] mb-1">
              Organization or Community Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="e.g. Savitribai Phule Pune University / Green Earth NGO"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Project Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#142e1f] mb-1">Project Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain the scope, purpose, and stakeholders of your tree inventory study..."
              className="w-full px-3.5 py-2 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Location Fields: Country, State, City, Study Area */}
          <div>
            <label className="block text-xs font-bold text-[#142e1f] mb-1">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142e1f] mb-1">State / Province</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142e1f] mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Pune"
              className="w-full px-3.5 py-2 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142e1f] mb-1">Study Area Extent</label>
            <input
              type="text"
              value={formData.study_area}
              onChange={(e) => setFormData({ ...formData, study_area: e.target.value })}
              placeholder="e.g. North Campus Quadrant, 45 Hectares"
              className="w-full px-3.5 py-2 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f]"
            />
          </div>

          {/* Project Coordinator & Email */}
          <div>
            <label className="block text-xs font-bold text-[#142e1f] mb-1">
              Project Coordinator Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.coordinator}
              onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
              placeholder="e.g. Prof. Ananya Joshi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142e1f] mb-1">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="e.g. contact@greenearth.org"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-medium text-[#142e1f]"
            />
          </div>
        </div>

        {/* ─── Interactive Map Picker ─── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-xs font-bold text-[#142e1f]">
                Geographic Study Area &amp; Center Point
              </label>
              <p className="text-[11px] text-[#708477]">
                Click on the map or drag the pin to set the center coordinates of your study area.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-[#2d6a4f] bg-[#f3efe6] px-2.5 py-1 rounded-lg">
              Lat: {formData.center_lat}, Lng: {formData.center_lng}
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-72 sm:h-80 rounded-2xl border border-[rgba(20,46,31,0.15)] shadow-inner z-0"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-[rgba(20,46,31,0.08)]">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold text-xs bg-[#142e1f] text-white hover:bg-[#1f452f] transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save Project &amp; Proceed to Data Collection (Step 2)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STEP 2: COLLECT OR UPLOAD TREE DATA
   ══════════════════════════════════════════════════════════════════════════════ */
function Step2DataImport({ activeProject, onImportSuccess }) {
  const [importMode, setImportMode] = useState('epicollect'); // 'epicollect' | 'upload'

  // Epicollect form state
  const [epicollectSlug, setEpicollectSlug] = useState('vanjeevan');
  const [epicollectClientId, setEpicollectClientId] = useState('');
  const [epicollectClientSecret, setEpicollectClientSecret] = useState('');
  const [epicollectUrl, setEpicollectUrl] = useState('');
  const [fetchingEpicollect, setFetchingEpicollect] = useState(false);
  const [epicollectData, setEpicollectData] = useState(null);
  const [epicollectMapping, setEpicollectMapping] = useState({});

  // File upload state
  const [filePreview, setFilePreview] = useState(null);
  const [fileMapping, setFileMapping] = useState({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [excludeInvalid, setExcludeInvalid] = useState(true);
  const [clearExisting, setClearExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  // Fetch Epicollect data from backend proxy
  const handleFetchEpicollect = async (e) => {
    e?.preventDefault();
    setImportError('');
    setFetchingEpicollect(true);
    try {
      const data = await projectApi.fetchEpicollect({
        projectSlug: epicollectSlug,
        clientId: epicollectClientId,
        clientSecret: epicollectClientSecret,
        url: epicollectUrl,
      });
      setEpicollectData(data);
      setEpicollectMapping(data?.detectedMapping || {});
    } catch (err) {
      setImportError(err.response?.data?.error || 'Failed to retrieve Epicollect5 entries.');
    } finally {
      setFetchingEpicollect(false);
    }
  };

  // Upload file preview
  const handleFileUpload = async (file) => {
    if (!file) return;
    setImportError('');
    setUploadingFile(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await projectApi.previewFile(fd);
      setFilePreview(res);
      setFileMapping(res?.detectedMapping || {});
    } catch (err) {
      setImportError(err.response?.data?.error || 'File preview failed. Ensure valid CSV, Excel, or GeoJSON.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit Epicollect import
  const handleConfirmEpicollectImport = async () => {
    if (!epicollectData?.sampleEntries || epicollectData.sampleEntries.length === 0) return;
    setImporting(true);
    setImportError('');
    try {
      await projectApi.importTrees(activeProject.id, {
        rows: epicollectData.sampleEntries,
        mapping: epicollectMapping,
        excludeInvalid,
        clearExisting,
        dataSource: 'epicollect',
      });
      onImportSuccess();
    } catch (err) {
      setImportError(err.response?.data?.error || 'Import failed. Check field mapping.');
    } finally {
      setImporting(false);
    }
  };

  // Submit File import
  const handleConfirmFileImport = async () => {
    if (!filePreview?.sampleRows || filePreview.sampleRows.length === 0) return;
    setImporting(true);
    setImportError('');
    try {
      await projectApi.importTrees(activeProject.id, {
        rows: filePreview.sampleRows,
        mapping: fileMapping,
        excludeInvalid,
        clearExisting,
        dataSource: filePreview.fileType || 'upload',
      });
      onImportSuccess();
    } catch (err) {
      setImportError(err.response?.data?.error || 'Dataset import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="path-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(20,46,31,0.08)]">
        <div>
          <span className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider">
            Step 2: Field Data Synchronization
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
            Collect or Upload Tree Observations
          </h2>
          <p className="text-xs text-[#708477] mt-0.5">
            Target Project:{' '}
            <span className="font-bold text-[#142e1f]">{activeProject?.name || 'Default Campus'}</span>
          </p>
        </div>

        {/* Source Toggle Pills */}
        <div className="flex items-center p-1 bg-[#f3efe6] rounded-2xl border border-[rgba(20,46,31,0.08)]">
          <button
            type="button"
            onClick={() => setImportMode('epicollect')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              importMode === 'epicollect'
                ? 'bg-[#142e1f] text-white shadow-sm'
                : 'text-[#142e1f] hover:bg-white/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>Option A: Epicollect5</span>
          </button>
          <button
            type="button"
            onClick={() => setImportMode('upload')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              importMode === 'upload'
                ? 'bg-[#142e1f] text-white shadow-sm'
                : 'text-[#142e1f] hover:bg-white/50'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Option B: Upload Dataset</span>
          </button>
        </div>
      </div>

      {importError && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* ─── OPTION A: EPICOLLECT5 INTEGRATION ─── */}
      {importMode === 'epicollect' && (
        <div className="mt-6 space-y-6">
          {/* Explanation Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.08)] text-xs text-[#142e1f]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#2d6a4f] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#142e1f] mb-1">
                  Epicollect5 Mobile Handheld Integration
                </h4>
                <p className="text-[#44594c] leading-relaxed">
                  Epicollect5 is a mobile data collection platform developed by Oxford University and Wellcome Trust that allows
                  field teams to record tree species, trunk girth (GBH), canopy height, and precise GPS coordinates directly in the field.
                  Once data collection is complete, connect your project below to visualize and analyze the collected trees on our GIS map.
                </p>
              </div>
            </div>

            {/* 8-Step Guidance Cards */}
            <div className="mt-4 pt-4 border-t border-[rgba(20,46,31,0.08)] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
                <span className="font-bold text-[#2d6a4f]">1. Install App</span>
                <p className="text-[#708477] mt-0.5">Download Epicollect5 on Android / iOS.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
                <span className="font-bold text-[#2d6a4f]">2. Select Project</span>
                <p className="text-[#708477] mt-0.5">Load or create your tree inventory project.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
                <span className="font-bold text-[#2d6a4f]">3. Configure Form</span>
                <p className="text-[#708477] mt-0.5">Add Species, GBH, Height, and GPS fields.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
                <span className="font-bold text-[#2d6a4f]">4. Field Survey</span>
                <p className="text-[#708477] mt-0.5">Record individual trees across the study area.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
                <span className="font-bold text-[#2d6a4f]">5. Capture GPS</span>
                <p className="text-[#708477] mt-0.5">Ensure location precision is under 5 meters.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
                <span className="font-bold text-[#2d6a4f]">6. Sync Entries</span>
                <p className="text-[#708477] mt-0.5">Upload all observations to Epicollect cloud.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
                <span className="font-bold text-[#2d6a4f]">7. Connect Slug</span>
                <p className="text-[#708477] mt-0.5">Input your project slug below and fetch data.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
                <span className="font-bold text-[#2d6a4f]">8. Map &amp; Analyze</span>
                <p className="text-[#708477] mt-0.5">Confirm mapping to run Chave allometry.</p>
              </div>
            </div>
          </div>

          {/* Connect Form */}
          <form onSubmit={handleFetchEpicollect} className="p-5 rounded-2xl bg-white border border-[rgba(20,46,31,0.1)] space-y-4">
            <h4 className="text-sm font-bold text-[#142e1f] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#2d6a4f]" />
              <span>Connect Epicollect5 Project</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Epicollect5 Project Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={epicollectSlug}
                  onChange={(e) => setEpicollectSlug(e.target.value)}
                  placeholder="e.g. vanjeevan"
                  className="w-full px-3.5 py-2 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs font-mono font-bold text-[#142e1f]"
                />
                <span className="text-[10px] text-[#708477] mt-1 block">
                  Find the slug in your URL: five.epicollect.net/project/<b>slug</b>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Client ID <span className="text-[#708477] font-normal">(Private projects only)</span>
                </label>
                <input
                  type="text"
                  value={epicollectClientId}
                  onChange={(e) => setEpicollectClientId(e.target.value)}
                  placeholder="Optional OAuth Client ID"
                  className="w-full px-3.5 py-2 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs text-[#142e1f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Client Secret <span className="text-[#708477] font-normal">(Private projects only)</span>
                </label>
                <input
                  type="password"
                  value={epicollectClientSecret}
                  onChange={(e) => setEpicollectClientSecret(e.target.value)}
                  placeholder="Optional OAuth Secret"
                  className="w-full px-3.5 py-2 rounded-xl border border-[rgba(20,46,31,0.15)] bg-[#fdfcf9] text-xs text-[#142e1f]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={fetchingEpicollect}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#2d6a4f] text-white hover:bg-[#24543f] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {fetchingEpicollect ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Fetch Project Data</span>
              </button>
            </div>
          </form>

          {/* Epicollect Preview & Field Mapping */}
          {epicollectData && (
            <div className="p-5 rounded-2xl bg-white border border-[rgba(20,46,31,0.12)] space-y-5 animate-fadeIn">
              {/* Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#f3efe6]/80 border border-[rgba(20,46,31,0.06)]">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-[#142e1f]">
                    Found: <b className="text-emerald-800">{epicollectData.totalRecords}</b> records
                  </span>
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {epicollectData.summary?.validCoords} with valid GPS
                  </span>
                  {epicollectData.summary?.missingCoords > 0 && (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {epicollectData.summary?.missingCoords} missing GPS
                    </span>
                  )}
                  <span className="text-[#708477]">
                    Species Detected: <b>{epicollectData.summary?.speciesCount}</b>
                  </span>
                </div>
              </div>

              {/* Column Mapping Section */}
              <div>
                <h4 className="text-xs font-bold text-[#142e1f] uppercase tracking-wider mb-2">
                  Map Epicollect5 Form Fields to Standard Parameters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Tree Species Field</label>
                    <select
                      value={epicollectMapping.species || ''}
                      onChange={(e) => setEpicollectMapping({ ...epicollectMapping, species: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Field --</option>
                      {epicollectData.detectedFields?.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Girth (GBH in cm)</label>
                    <select
                      value={epicollectMapping.gbh || ''}
                      onChange={(e) => setEpicollectMapping({ ...epicollectMapping, gbh: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Field --</option>
                      {epicollectData.detectedFields?.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Height (meters)</label>
                    <select
                      value={epicollectMapping.height || ''}
                      onChange={(e) => setEpicollectMapping({ ...epicollectMapping, height: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Field --</option>
                      {epicollectData.detectedFields?.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Tree ID / Number</label>
                    <select
                      value={epicollectMapping.treeId || ''}
                      onChange={(e) => setEpicollectMapping({ ...epicollectMapping, treeId: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Field --</option>
                      {epicollectData.detectedFields?.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[rgba(20,46,31,0.08)]">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeInvalid}
                      onChange={(e) => setExcludeInvalid(e.target.checked)}
                      className="rounded text-[#2d6a4f]"
                    />
                    <span>Exclude observations without GPS</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="rounded text-[#2d6a4f]"
                    />
                    <span>Replace existing project records</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmEpicollectImport}
                  disabled={importing}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm &amp; Import Epicollect5 Trees</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── OPTION B: FILE DATASET UPLOAD ─── */}
      {importMode === 'upload' && (
        <div className="mt-6 space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="path-dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls, .geojson, .json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#2d6a4f] mx-auto flex items-center justify-center mb-3">
              {uploadingFile ? <RefreshCw className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            <h4 className="text-base font-bold text-[#142e1f]">
              Drop your tree dataset here, or click to browse
            </h4>
            <p className="text-xs text-[#708477] mt-1 max-w-md mx-auto">
              Supported formats: <b>CSV (.csv)</b>, <b>Excel (.xlsx, .xls)</b>, and <b>GeoJSON (.geojson, .json)</b>.
              Column headers will be automatically detected and mapped.
            </p>
          </div>

          {/* Uploaded File Preview & Mapping */}
          {filePreview && (
            <div className="p-5 rounded-2xl bg-white border border-[rgba(20,46,31,0.12)] space-y-5 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#f3efe6]/80 border border-[rgba(20,46,31,0.06)]">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-[#142e1f]">File: {filePreview.fileName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {filePreview.totalRows} Records
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    ✓ {filePreview.validation?.validCount} Valid
                  </span>
                  {filePreview.validation?.missingCoords > 0 && (
                    <span className="text-amber-700 font-semibold">
                      ⚠ {filePreview.validation.missingCoords} Missing Coords
                    </span>
                  )}
                  {filePreview.validation?.duplicates > 0 && (
                    <span className="text-[#708477]">
                      {filePreview.validation.duplicates} Duplicates
                    </span>
                  )}
                </div>
              </div>

              {/* Column Mapping Grid */}
              <div>
                <h4 className="text-xs font-bold text-[#142e1f] uppercase tracking-wider mb-2">
                  Map Uploaded Columns to System Standard Fields
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Tree Species</label>
                    <select
                      value={fileMapping.species || ''}
                      onChange={(e) => setFileMapping({ ...fileMapping, species: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {filePreview.headers?.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Latitude</label>
                    <select
                      value={fileMapping.latitude || ''}
                      onChange={(e) => setFileMapping({ ...fileMapping, latitude: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {filePreview.headers?.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Longitude</label>
                    <select
                      value={fileMapping.longitude || ''}
                      onChange={(e) => setFileMapping({ ...fileMapping, longitude: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {filePreview.headers?.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Girth (GBH in cm)</label>
                    <select
                      value={fileMapping.gbh || ''}
                      onChange={(e) => setFileMapping({ ...fileMapping, gbh: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {filePreview.headers?.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Height (meters)</label>
                    <select
                      value={fileMapping.height || ''}
                      onChange={(e) => setFileMapping({ ...fileMapping, height: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {filePreview.headers?.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Tree ID / Tag</label>
                    <select
                      value={fileMapping.treeId || ''}
                      onChange={(e) => setFileMapping({ ...fileMapping, treeId: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {filePreview.headers?.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#708477] mb-1">Condition / Health</label>
                    <select
                      value={fileMapping.condition || ''}
                      onChange={(e) => setFileMapping({ ...fileMapping, condition: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {filePreview.headers?.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[rgba(20,46,31,0.08)]">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeInvalid}
                      onChange={(e) => setExcludeInvalid(e.target.checked)}
                      className="rounded text-[#2d6a4f]"
                    />
                    <span>Exclude records missing coordinates</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="rounded text-[#2d6a4f]"
                    />
                    <span>Replace existing project records</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmFileImport}
                  disabled={importing}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm &amp; Import Dataset</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STEP 3: DISPLAY TREES ON THE INTERACTIVE GIS MAP
   ══════════════════════════════════════════════════════════════════════════════ */
function Step3ProjectMap({ activeProject, trees = [], onNextStep }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const boundaryLayerRef = useRef(null);

  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTileKey, setActiveTileKey] = useState('satellite');

  // Species options with counts
  const speciesStats = useMemo(() => {
    const map = {};
    trees.forEach((t) => {
      const sp = t.species || 'Unknown';
      map[sp] = (map[sp] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [trees]);

  // Filtered tree observations
  const filteredTrees = useMemo(() => {
    return trees.filter((t) => {
      if (selectedSpecies !== 'all' && t.species !== selectedSpecies) return false;
      if (selectedCondition !== 'all' && t.condition !== selectedCondition) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const spMatch = t.species?.toLowerCase().includes(query);
        const idMatch = t.tree_id?.toLowerCase().includes(query);
        if (!spMatch && !idMatch) return false;
      }
      return true;
    });
  }, [trees, selectedSpecies, selectedCondition, searchTerm]);

  // Mapped vs unmapped counts
  const mappedCount = useMemo(() => {
    return trees.filter((t) => Number.isFinite(t.latitude) && Number.isFinite(t.longitude)).length;
  }, [trees]);
  const unmappedCount = trees.length - mappedCount;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const centerLat = activeProject?.center_lat || DEFAULT_MAP_CENTER[0];
    const centerLng = activeProject?.center_lng || DEFAULT_MAP_CENTER[1];
    const zoom = activeProject?.zoom_level || 16;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Base tile layer
    const tileConfig = BASEMAP_TILES[activeTileKey] || BASEMAP_TILES.satellite;
    createTileLayer({ tileUrl: tileConfig.url, maxZoom: tileConfig.maxNativeZoom || 19 }).addTo(map);

    // Feature groups
    const boundaryGroup = L.featureGroup().addTo(map);
    const markersGroup = L.featureGroup().addTo(map);
    boundaryLayerRef.current = boundaryGroup;
    markersLayerRef.current = markersGroup;

    // Render boundary if available
    if (activeProject?.boundary) {
      try {
        const poly = L.geoJSON(activeProject.boundary, {
          style: {
            color: '#10b981',
            weight: 2.5,
            dashArray: '5, 5',
            fillColor: '#10b981',
            fillOpacity: 0.12,
          },
        }).addTo(boundaryGroup);
        map.fitBounds(poly.getBounds(), { padding: [30, 30] });
      } catch (polyErr) {
        console.warn('Could not render study area polygon:', polyErr);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeProject, activeTileKey]);

  // Re-render markers when filteredTrees change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const group = markersLayerRef.current;
    group.clearLayers();

    const validPoints = [];

    filteredTrees.forEach((t) => {
      if (!Number.isFinite(t.latitude) || !Number.isFinite(t.longitude)) return;
      validPoints.push([t.latitude, t.longitude]);

      const color = getSpeciesColor(t.species);

      // Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-tree-pin',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 9999px;
            background: ${color};
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: 800;
          ">
            ${t.species?.charAt(0) || 'T'}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; min-width: 180px; padding: 2px;">
          <div style="font-weight: 800; color: #142e1f; font-size: 13px; margin-bottom: 2px;">
            ${t.species || 'Native Tree'}
          </div>
          <div style="color: #708477; font-size: 11px; margin-bottom: 6px; font-family: monospace;">
            ID: ${t.tree_id || '—'} · Cond: ${t.condition || 'Healthy'}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="color: #708477; padding: 2px 0;">Height:</td>
              <td style="font-weight: bold; text-align: right;">${t.height || '—'} m</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="color: #708477; padding: 2px 0;">Trunk GBH:</td>
              <td style="font-weight: bold; text-align: right;">${t.gbh || '—'} cm</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="color: #708477; padding: 2px 0;">Calculated DBH:</td>
              <td style="font-weight: bold; text-align: right;">${t.dbh || '—'} cm</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="color: #708477; padding: 2px 0;">Estimated Age:</td>
              <td style="font-weight: bold; text-align: right;">${t.age || '—'} yrs</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="color: #708477; padding: 2px 0;">Biomass (AGB):</td>
              <td style="font-weight: bold; text-align: right; color: #2d6a4f;">${t.biomass || '—'} kg</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="color: #708477; padding: 2px 0;">Stored Carbon:</td>
              <td style="font-weight: bold; text-align: right; color: #2d6a4f;">${t.carbon_storage || '—'} kg</td>
            </tr>
            <tr>
              <td style="color: #708477; padding: 2px 0;">Lifetime CO₂:</td>
              <td style="font-weight: bold; text-align: right; color: #d97706;">${t.co2_estimate || '—'} kg</td>
            </tr>
          </table>
          <div style="font-size: 10px; color: #708477; font-family: monospace;">
            GPS: ${t.latitude?.toFixed(5)}, ${t.longitude?.toFixed(5)}
          </div>
        </div>
      `;

      L.marker([t.latitude, t.longitude], { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(group);
    });

    // Auto-fit bounds to trees if present
    if (validPoints.length > 0 && mapInstanceRef.current) {
      try {
        const bounds = L.latLngBounds(validPoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
      } catch (_) {}
    }
  }, [filteredTrees]);

  return (
    <div className="path-card space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[rgba(20,46,31,0.08)]">
        <div>
          <span className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider">
            Step 3: GIS Cartography &amp; Spatial Inventory
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
            Interactive Project Tree Map
          </h2>
          <p className="text-xs text-[#708477] mt-0.5">
            Every surveyed tree plotted at its actual coordinates within {activeProject?.name}. Click any pin to inspect allometry.
          </p>
        </div>

        {/* Status Pill Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {mappedCount} Mapped Trees
          </span>
          {unmappedCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {unmappedCount} Missing GPS
            </span>
          )}
          <button
            type="button"
            onClick={onNextStep}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Proceed to Analysis &amp; Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.08)]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#708477]" />
            <input
              type="text"
              placeholder="Search species or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-[rgba(20,46,31,0.15)] bg-white text-xs font-medium text-[#142e1f] focus:outline-none w-44"
            />
          </div>

          {/* Species Filter */}
          <select
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[rgba(20,46,31,0.15)] bg-white text-xs font-bold text-[#142e1f] focus:outline-none cursor-pointer"
          >
            <option value="all">All Species ({trees.length})</option>
            {speciesStats.map(([sp, count]) => (
              <option key={sp} value={sp}>
                {sp} ({count})
              </option>
            ))}
          </select>

          {/* Condition Filter */}
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[rgba(20,46,31,0.15)] bg-white text-xs font-bold text-[#142e1f] focus:outline-none cursor-pointer"
          >
            <option value="all">All Health Conditions</option>
            <option value="Healthy">Healthy</option>
            <option value="Attention Needed">Attention Needed</option>
            <option value="Mature">Mature</option>
          </select>
        </div>

        {/* Basemap Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[rgba(20,46,31,0.1)]">
          <button
            type="button"
            onClick={() => setActiveTileKey('satellite')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              activeTileKey === 'satellite' ? 'bg-[#142e1f] text-white' : 'text-[#708477] hover:text-[#142e1f]'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setActiveTileKey('voyager')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              activeTileKey === 'voyager' ? 'bg-[#142e1f] text-white' : 'text-[#708477] hover:text-[#142e1f]'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setActiveTileKey('dark')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              activeTileKey === 'dark' ? 'bg-[#142e1f] text-white' : 'text-[#708477] hover:text-[#142e1f]'
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="path-map-frame" ref={mapContainerRef} />

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#f3efe6]/70 border border-[rgba(20,46,31,0.06)] text-xs">
        <div className="flex items-center gap-2 text-[#708477]">
          <span className="font-bold text-[#142e1f]">Map Legend:</span>
          <span>Dashed Green: Study Area Boundary</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {speciesStats.slice(0, 6).map(([sp, cnt]) => (
            <div key={sp} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#142e1f]">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getSpeciesColor(sp) }}
              />
              <span>
                {sp} ({cnt})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STEP 4: GENERATE PROJECT-SPECIFIC ENVIRONMENTAL ANALYSIS & REPORT
   ══════════════════════════════════════════════════════════════════════════════ */
function Step4AnalysisReport({ activeProject, stats, trees = [], onOpenFullReport }) {
  const env = stats?.environmental;
  const inv = stats?.inventory;
  const speciesList = stats?.speciesDistribution || [];
  const recommendations = stats?.recommendations || [];

  return (
    <div className="path-card space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(20,46,31,0.08)]">
        <div>
          <span className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider">
            Step 4: Ecological Impact &amp; Sustainability Audit
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
            Environmental Analysis &amp; Project Report
          </h2>
          <p className="text-xs text-[#708477] mt-0.5">
            Peer-reviewed Chave allometry and climate mitigation indicators calculated for {activeProject?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenFullReport}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
        >
          <FileText className="w-4 h-4 text-amber-300" />
          <span>View &amp; Print Full Report</span>
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── 4 Primary Impact KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trees */}
        <div className="p-4 rounded-2xl bg-white border border-[rgba(20,46,31,0.1)] shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[#708477] mb-1">
            <span>SURVEYED TREES</span>
            <Trees className="w-4 h-4 text-[#2d6a4f]" />
          </div>
          <div className="text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
            {inv?.totalTrees || trees.length || 0}
          </div>
          <div className="text-[11px] text-[#708477] mt-0.5">
            {inv?.speciesCount || 0} distinct botanical species
          </div>
        </div>

        {/* Biomass */}
        <div className="p-4 rounded-2xl bg-white border border-[rgba(20,46,31,0.1)] shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[#708477] mb-1">
            <span>ABOVEGROUND BIOMASS</span>
            <Scale className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
            {env?.totalBiomassTonnes || 0} <span className="text-sm font-normal text-[#708477]">Tonnes</span>
          </div>
          <div className="text-[11px] text-[#708477] mt-0.5">
            {env?.totalBiomassKg?.toLocaleString() || 0} kg dry weight
          </div>
        </div>

        {/* Carbon Storage */}
        <div className="p-4 rounded-2xl bg-white border border-[rgba(20,46,31,0.1)] shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[#708477] mb-1">
            <span>STORED CARBON</span>
            <Leaf className="w-4 h-4 text-[#2d6a4f]" />
          </div>
          <div className="text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
            {env?.totalCarbonTonnes || 0} <span className="text-sm font-normal text-[#708477]">Tonnes</span>
          </div>
          <div className="text-[11px] text-[#708477] mt-0.5">
            {env?.totalCarbonKg?.toLocaleString() || 0} kg elemental carbon
          </div>
        </div>

        {/* CO2 Equivalent */}
        <div className="p-4 rounded-2xl bg-white border border-[rgba(20,46,31,0.1)] shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[#708477] mb-1">
            <span>LIFETIME CO₂ MITIGATION</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
            {env?.totalCo2Tonnes || 0} <span className="text-sm font-normal text-[#708477]">Tonnes</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            ~{env?.annualCo2Kg?.toLocaleString() || 0} kg/yr annual absorption
          </div>
        </div>
      </div>

      {/* ─── Species Distribution & Carbon Contribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-[rgba(20,46,31,0.1)]">
          <h4 className="text-sm font-bold text-[#142e1f] mb-3 flex items-center justify-between">
            <span>Species Population &amp; Relative Abundance</span>
            <span className="text-xs font-normal text-[#708477]">{speciesList.length} species</span>
          </h4>

          <div className="space-y-3">
            {speciesList.slice(0, 7).map((s) => (
              <div key={s.species}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#142e1f] flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getSpeciesColor(s.species) }}
                    />
                    {s.species}
                  </span>
                  <span className="font-semibold text-[#708477]">
                    {s.count} trees ({s.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#f3efe6] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${s.percentage}%`,
                      backgroundColor: getSpeciesColor(s.species),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Allometry Equations Reference Card */}
        <div className="p-5 rounded-2xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.08)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2d6a4f] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Calculation Engine &amp; Methodology</span>
          </div>
          <h4 className="text-base font-bold font-['Fraunces'] text-[#142e1f]">
            Verified Allometric Formulas
          </h4>
          <p className="text-xs text-[#708477] leading-relaxed">
            All environmental figures are computed directly from measured trunk girth (GBH) and height parameters using
            standardized pantropical forestry equations.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
              <span className="font-bold text-[#142e1f]">Diameter at Breast Height:</span>{' '}
              <code className="text-[#2d6a4f] font-mono">DBH = GBH / π</code>
              <p className="text-[11px] text-[#708477] mt-0.5">Calculated standard diameter at 1.3 meters height.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
              <span className="font-bold text-[#142e1f]">Chave Allometric Aboveground Biomass:</span>{' '}
              <code className="text-[#2d6a4f] font-mono">AGB = 0.0673 × (ρ × DBH² × H)^0.976</code>
              <p className="text-[11px] text-[#708477] mt-0.5">Incorporates species wood density (ρ in g/cm³), DBH, and height.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[rgba(20,46,31,0.06)]">
              <span className="font-bold text-[#142e1f]">Elemental Carbon &amp; CO₂ Equivalence:</span>{' '}
              <code className="text-[#2d6a4f] font-mono">Carbon = AGB × 0.47 | CO₂ = Carbon × 3.67</code>
              <p className="text-[11px] text-[#708477] mt-0.5">Distinguishes elemental carbon mass from atmospheric CO₂ gas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Evidence-Based Planting Recommendations ─── */}
      <div className="p-5 rounded-2xl bg-white border border-[rgba(20,46,31,0.1)]">
        <h4 className="text-sm font-bold text-[#142e1f] mb-3 flex items-center gap-2">
          <TreePine className="w-4 h-4 text-[#2d6a4f]" />
          <span>Site-Specific Afforestation &amp; Canopy Recommendations</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {recommendations.map((rec, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.06)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-[#142e1f]">{rec.title}</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    rec.priority === 'High'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {rec.priority} Priority
                </span>
              </div>
              <p className="text-xs text-[#44594c] leading-relaxed">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FULL REPORT MODAL & PRINTABLE REPORT
   ══════════════════════════════════════════════════════════════════════════════ */
function ProjectReportModal({ report, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.project.name.toLowerCase().replace(/\s+/g, '-')}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#fdfcf9] rounded-3xl shadow-2xl border border-[rgba(20,46,31,0.15)] flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Controls Header */}
        <div className="p-4 sm:p-5 bg-[#142e1f] text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-300" />
            <span className="font-bold text-sm">Comprehensive Project Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON Archive</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#e2b342] hover:bg-[#d4a332] text-stone-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="path-printable-report" className="p-6 sm:p-10 overflow-y-auto flex-1 space-y-6 text-[#142e1f]">
          {/* Document Header */}
          <div className="border-b-2 border-[#142e1f] pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#2d6a4f] font-bold">
                VanJeevan Ecological Network · GIS Tree Stewardship Report
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-[#142e1f] mt-1">
                {report.project.name}
              </h1>
              <div className="text-xs text-[#708477] mt-1">
                Organization: <b>{report.project.organization}</b> · Location: <b>{report.project.location}</b>
              </div>
            </div>
            <div className="text-right text-xs text-[#708477]">
              <div>Date: {new Date(report.generatedAt).toLocaleDateString()}</div>
              <div>Coordinator: <b>{report.project.coordinator}</b></div>
              <div>Email: {report.project.contactEmail}</div>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h3 className="text-sm font-bold text-[#142e1f] uppercase tracking-wider mb-2">
              Executive Summary &amp; Scope
            </h3>
            <p className="text-xs text-[#44594c] leading-relaxed">
              This inventory encompasses <b>{report.summary.totalRecords}</b> surveyed tree specimens across{' '}
              <b>{report.project.studyArea || 'the project bounds'}</b>, recorded using {report.project.dataSource} field methodology.
              A total of <b>{report.summary.mappedTrees}</b> trees are georeferenced with GPS coordinates.
              The total standing aboveground biomass is calculated at <b>{report.summary.totalBiomassTonnes} Tonnes</b>,
              representing an accumulated stored carbon stock of <b>{report.summary.totalCarbonTonnes} Tonnes</b> (equivalent to{' '}
              <b>{report.summary.totalCo2Tonnes} Tonnes of atmospheric CO₂ sequestered</b>).
            </p>
          </div>

          {/* Key Metrics Table */}
          <div>
            <h3 className="text-sm font-bold text-[#142e1f] uppercase tracking-wider mb-2">
              Inventory &amp; Carbon Audit Summary
            </h3>
            <table className="w-full text-xs text-left border border-[rgba(20,46,31,0.15)] rounded-xl overflow-hidden">
              <thead className="bg-[#f3efe6] font-bold text-[#142e1f]">
                <tr>
                  <th className="p-2.5">Indicator Parameter</th>
                  <th className="p-2.5">Quantified Value</th>
                  <th className="p-2.5">Measurement Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(20,46,31,0.08)]">
                <tr>
                  <td className="p-2.5 font-semibold">Total Trees Surveyed</td>
                  <td className="p-2.5 font-bold text-[#142e1f]">{report.summary.totalRecords}</td>
                  <td className="p-2.5 text-[#708477]">Field observation count</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Georeferenced Trees</td>
                  <td className="p-2.5 font-bold text-emerald-800">{report.summary.mappedTrees}</td>
                  <td className="p-2.5 text-[#708477]">Valid GPS Coordinates mapped</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Distinct Botanical Species</td>
                  <td className="p-2.5 font-bold">{report.summary.speciesCount}</td>
                  <td className="p-2.5 text-[#708477]">Taxonomic classification</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Mean Tree Age</td>
                  <td className="p-2.5 font-bold">{report.summary.averageAge} Years</td>
                  <td className="p-2.5 text-[#708477]">Calibrated allometric age model</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Mean Diameter at Breast Height (DBH)</td>
                  <td className="p-2.5 font-bold">{report.summary.averageDbh} cm</td>
                  <td className="p-2.5 text-[#708477]">Trunk girth measurement (GBH / π)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Aboveground Biomass (AGB)</td>
                  <td className="p-2.5 font-bold text-[#2d6a4f]">{report.summary.totalBiomassTonnes} Tonnes</td>
                  <td className="p-2.5 text-[#708477]">Chave Pantropical Model (2014)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Total Carbon Stored</td>
                  <td className="p-2.5 font-bold text-[#2d6a4f]">{report.summary.totalCarbonTonnes} Tonnes</td>
                  <td className="p-2.5 text-[#708477]">Biomass × 0.47 (IPCC standard)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Equivalent CO₂ Sequestered</td>
                  <td className="p-2.5 font-bold text-amber-800">{report.summary.totalCo2Tonnes} Tonnes</td>
                  <td className="p-2.5 text-[#708477]">Carbon × 3.67 stoichiometric factor</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Top Species Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-[#142e1f] uppercase tracking-wider mb-2">
              Predominant Species Composition
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {report.topSpecies?.map((s) => (
                <div key={s.species} className="p-2.5 rounded-lg bg-[#f8f6f0] border border-[rgba(20,46,31,0.06)]">
                  <div className="font-bold text-[#142e1f]">{s.species}</div>
                  <div className="text-[#708477] text-[11px] mt-0.5">
                    Count: <b>{s.count}</b> · Carbon: <b>{(s.carbonKg / 1000).toFixed(1)} T</b>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Methodology */}
          <div>
            <h3 className="text-sm font-bold text-[#142e1f] uppercase tracking-wider mb-2">
              Scientific Methodology &amp; Mathematical Principles
            </h3>
            <div className="space-y-1.5 text-xs text-[#44594c]">
              {report.scientificFormulas?.map((f) => (
                <div key={f.name} className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="font-bold text-[#142e1f]">{f.name}:</span>{' '}
                  <code className="text-[#2d6a4f] font-mono font-bold">{f.formula}</code> — {f.description}
                </div>
              ))}
            </div>
          </div>

          {/* Signoff Footer */}
          <div className="pt-6 border-t border-[rgba(20,46,31,0.15)] flex justify-between items-end text-xs text-[#708477]">
            <div>
              <p>Certified by VanJeevan Ecological Network</p>
              <p className="text-[10px]">Under the Framework of Maharashtra (Urban Areas) Protection &amp; Preservation of Trees Act 1975</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#142e1f]">{report.project.coordinator}</p>
              <p className="text-[10px]">Project Coordinator Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
