import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  MapPin,
  Trees,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Info,
  Scale,
  Sparkles,
  Building,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { treeCuttingApi, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './treeCutting.css';

export default function ApplicationSubmitForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedApp, setSubmittedApp] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    // Applicant
    applicantType: 'Infrastructure Contractor',
    organization: user?.organization || '',
    contactPhone: '',
    registrationNumber: '',

    // Project Details
    title: '',
    reason: 'Road Widening / Public Infrastructure',
    description: '',
    state: 'Maharashtra',
    district: 'Nashik',
    city: 'Nashik',
    village: '',
    latitude: '20.0131',
    longitude: '73.8213',
    bufferRadiusMeters: 50,
    estimatedTreesAffected: 4,
    speciesKnown: 'Neem, Ashoka, Peepal',
    estimatedAge: '15-25 years',
    proposedCuttingPeriod: 'Winter 2026',
    alternativesConsidered: 'Design modifications evaluated; minimal felling route selected with urban planning division.',
    mitigationPlan: 'Preservation of root zones of adjacent unaffected trees during civil construction.',

    // Compensatory Plan (Maharashtra 1:5 statutory ratio)
    compensatoryLocation: 'Designated Municipal Urban Forest Reserve, Gangapur Road, Nashik',
    compensatorySpecies: 'Neem, Banyan, Jamun, Peepal, Karanj',
    compensatoryMaintenanceYears: 3,

    // Legal undertaking
    legalDeclarationAccepted: false,
  });

  const [files, setFiles] = useState([]);
  const [nearbyTrees, setNearbyTrees] = useState([]);
  const [overlapCount, setOverlapCount] = useState(0);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const registeredLayerRef = useRef(null);

  // Load existing registered trees for live spatial preview
  useEffect(() => {
    async function fetchInventoryTrees() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/registered-trees`);
        if (res.ok) {
          const list = await res.json();
          setNearbyTrees(Array.isArray(list) ? list : []);
        }
      } catch {
        // Quiet fallback
      }
    }
    fetchInventoryTrees();
  }, []);

  // Initialize or update Leaflet map on step 2
  useEffect(() => {
    if (step !== 2) return;
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    const lat = parseFloat(formData.latitude) || 20.0131;
    const lng = parseFloat(formData.longitude) || 73.8213;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 20,
      }).addTo(map);

      // Create registered trees layer
      const regLayer = L.layerGroup().addTo(map);
      registeredLayerRef.current = regLayer;

      // Click to pick location
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setFormData((prev) => ({
          ...prev,
          latitude: clickLat.toFixed(6),
          longitude: clickLng.toFixed(6),
        }));
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 300);
    }

    const map = mapInstanceRef.current;
    if (map) {
      // Update central marker
      if (markerRef.current) markerRef.current.remove();
      if (circleRef.current) circleRef.current.remove();

      const pulseIcon = L.divIcon({
        className: 'custom-tree-pin',
        html: `<div style="background:#e07a27;width:18px;height:18px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 10px rgba(224,122,39,0.8);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      markerRef.current = L.marker([lat, lng], { icon: pulseIcon }).addTo(map);

      // Buffer circle
      circleRef.current = L.circle([lat, lng], {
        radius: Number(formData.bufferRadiusMeters) || 50,
        color: '#dc2626',
        fillColor: '#fee2e2',
        fillOpacity: 0.35,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map);

      map.panTo([lat, lng]);

      // Render registered tree dots
      if (registeredLayerRef.current) {
        registeredLayerRef.current.clearLayers();
        let matches = 0;

        nearbyTrees.forEach((t) => {
          const tLat = parseFloat(t.latitude);
          const tLng = parseFloat(t.longitude);
          if (isNaN(tLat) || isNaN(tLng)) return;

          // Simple Haversine distance in meters
          const R = 6371e3;
          const phi1 = (lat * Math.PI) / 180;
          const phi2 = (tLat * Math.PI) / 180;
          const deltaPhi = ((tLat - lat) * Math.PI) / 180;
          const deltaLambda = ((tLng - lng) * Math.PI) / 180;
          const a =
            Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = R * c;

          const isInside = dist <= (Number(formData.bufferRadiusMeters) || 50);
          if (isInside) matches++;

          const dot = L.circleMarker([tLat, tLng], {
            radius: isInside ? 6 : 4,
            fillColor: isInside ? '#dc2626' : '#2d6a4f',
            color: '#ffffff',
            weight: 1.5,
            fillOpacity: 0.9,
          });

          dot.bindPopup(`
            <div style="font-size:12px;font-family:sans-serif;">
              <strong>${t.treeName || t.species || 'Cataloged Tree'}</strong><br/>
              <em>${t.scientificName || ''}</em><br/>
              Status: ${isInside ? '<span style="color:#dc2626;font-weight:bold;">Within Proposed Impact Zone</span>' : 'Safe'}<br/>
              Distance: ${Math.round(dist)} m
            </div>
          `);

          dot.addTo(registeredLayerRef.current);
        });

        setOverlapCount(matches);
      }
    }
  }, [step, formData.latitude, formData.longitude, formData.bufferRadiusMeters, nearbyTrees]);

  // Clean up map
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.organization && formData.applicantType !== 'Individual') {
        setError('Please specify the Organization or Agency name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.title.trim()) {
        setError('Please provide a descriptive Project Title.');
        return;
      }
      if (!formData.description.trim()) {
        setError('Please describe the project scope and need for tree felling.');
        return;
      }
      if (!formData.estimatedTreesAffected || Number(formData.estimatedTreesAffected) < 1) {
        setError('Please specify at least 1 tree proposed to be affected.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.compensatoryLocation.trim()) {
        setError('Please specify the designated compensatory plantation site.');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.legalDeclarationAccepted) {
      setError('You must accept the statutory legal undertaking to lodge this application.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('reason', formData.reason);
      payload.append('description', formData.description.trim());
      payload.append('applicantType', formData.applicantType);
      payload.append('organization', formData.organization);
      payload.append('contactPhone', formData.contactPhone);
      payload.append('registrationNumber', formData.registrationNumber);

      payload.append('state', formData.state);
      payload.append('district', formData.district);
      payload.append('city', formData.city);
      payload.append('village', formData.village);
      payload.append('latitude', formData.latitude);
      payload.append('longitude', formData.longitude);
      payload.append('estimatedTreesAffected', formData.estimatedTreesAffected);
      payload.append('speciesKnown', formData.speciesKnown);
      payload.append('estimatedAge', formData.estimatedAge);
      payload.append('proposedCuttingPeriod', formData.proposedCuttingPeriod);
      payload.append('alternativesConsidered', formData.alternativesConsidered);
      payload.append('mitigationPlan', formData.mitigationPlan);

      // Compensatory Plan
      const compensatoryObj = {
        ratio: 5,
        proposedSaplings: Number(formData.estimatedTreesAffected) * 5,
        proposedLocation: formData.compensatoryLocation,
        proposedSpecies: formData.compensatorySpecies.split(',').map((s) => s.trim()).filter(Boolean),
        maintenancePledgeYears: formData.compensatoryMaintenanceYears,
      };
      payload.append('compensatoryPlantingPlan', JSON.stringify(compensatoryObj));

      // Append documents
      files.forEach((file) => {
        payload.append('documents', file);
      });

      const response = await treeCuttingApi.submitApplication(payload);
      setSubmittedApp(response);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to lodge application. Please review required fields.'
      );
    } finally {
      setLoading(false);
    }
  };

  // If successfully submitted, show statutory receipt card
  if (submittedApp) {
    const mandatedSaplings = (submittedApp.details?.estimatedTreesAffected || 1) * 5;
    return (
      <div className="tc-app-card max-w-2xl mx-auto text-center py-10 space-y-6">
        <div className="w-16 h-16 bg-[#d8f3dc] text-[#1b4332] rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="tc-badge tc-badge-submitted text-xs">
            Official Lodgement Confirmed
          </span>
          <h3 className="text-2xl font-bold font-['Fraunces'] text-[#142e1f] mt-2">
            Permit Application Lodged Successfully
          </h3>
          <p className="text-sm text-[#708477] max-w-md mx-auto mt-1">
            Application tracking reference has been permanently registered in the VanJeevan civic ledger.
          </p>
        </div>

        <div className="bg-[#f3efe6] rounded-2xl p-5 text-left border border-[rgba(20,46,31,0.1)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(20,46,31,0.08)]">
            <span className="text-xs text-[#708477] font-semibold">Application Reference ID</span>
            <span className="font-mono text-base font-bold text-[#142e1f]">
              {submittedApp.applicationId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#708477]">Trees Proposed for Felling</span>
            <span className="font-semibold text-sm text-[#dc2626]">
              {submittedApp.details?.estimatedTreesAffected} Trees
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#708477]">Mandatory Statutory Compensatory Saplings</span>
            <span className="font-bold text-sm text-[#2d6a4f]">
              {mandatedSaplings} Saplings (1:5 Legal Ratio)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#708477]">Current Review Stage</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {submittedApp.status}
            </span>
          </div>
        </div>

        <div className="text-xs text-[#708477] max-w-lg mx-auto leading-relaxed">
          The public review period will open following initial document verification by the Municipal Tree Authority.
          You can track reviews, vote tallies, and official rulings directly from the Transparency Portal.
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all shadow-md"
            >
              Return to Public Directory
            </button>
          )}
        </div>
      </div>
    );
  }

  const mandatedSaplingsPreview = (Number(formData.estimatedTreesAffected) || 0) * 5;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Wizard Header ── */}
      <div className="tc-app-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(20,46,31,0.08)]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#d8f3dc] text-[#1b4332] mb-1">
              <Scale className="w-3.5 h-3.5" />
              Statutory Tree Felling Application Form
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Fraunces'] text-[#142e1f]">
              Lodge Tree-Cutting Permit &amp; Compensatory Proposal
            </h2>
            <p className="text-xs text-[#708477] mt-0.5">
              Governed under Maharashtra (Urban Areas) Protection &amp; Preservation of Trees Act, 1975
            </p>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-[#708477] hover:text-[#142e1f] underline"
            >
              Cancel &amp; Return
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 pt-4">
          {[
            { num: 1, title: 'Applicant Profile' },
            { num: 2, title: 'Project & GIS Location' },
            { num: 3, title: 'Compensatory Plan' },
            { num: 4, title: 'Statutory Review' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2 rounded-xl text-center border transition-all ${
                step === s.num
                  ? 'bg-[#142e1f] text-white border-[#142e1f] shadow-sm'
                  : step > s.num
                  ? 'bg-[#d8f3dc] text-[#1b4332] border-[#b7e4c7]'
                  : 'bg-[#f8f6f0] text-[#708477] border-transparent'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider">Step 0{s.num}</div>
              <div className="text-xs font-bold truncate">{s.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Form Steps ── */}
      <form onSubmit={handleSubmit} className="tc-app-card space-y-6">
        {/* STEP 1: Applicant Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#142e1f] pb-2 border-b border-[rgba(20,46,31,0.06)]">
              <Building className="w-4 h-4 text-[#2d6a4f]" />
              <span>Section 1: Applicant &amp; Entity Classification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Applicant Entity Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="applicantType"
                  value={formData.applicantType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                >
                  <option value="Infrastructure Contractor">Infrastructure Contractor / EPC Firm</option>
                  <option value="Urban Municipal Body">Urban Municipal Body / Smart City Project</option>
                  <option value="Real Estate Developer">Real Estate / Housing Developer</option>
                  <option value="Public Utility">Public Utility (Power, Water, Telecom)</option>
                  <option value="Educational / Research Campus">Educational / Research Campus</option>
                  <option value="Individual">Individual Landowner / Resident</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Organization / Agency Name
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra State Road Development Corp / L&T Infra"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Authorized Signatory (Pre-filled from Account)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${user?.name || 'Authorized Official'} (${user?.email || ''})`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Tender / Work Order / CIN Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. MSRDC/2026/PROJ-4481 or MH-CIN-U45200MH1998"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Project Scope & GIS Location */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#142e1f] pb-2 border-b border-[rgba(20,46,31,0.06)]">
              <Compass className="w-4 h-4 text-[#2d6a4f]" />
              <span>Section 2: Project Scope &amp; Interactive GIS Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Gangapur Elevated Corridor Road Widening & Stormwater Drain"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Primary Justification / Reason <span className="text-red-500">*</span>
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                >
                  <option value="Road Widening / Public Infrastructure">Road Widening / Public Infrastructure</option>
                  <option value="Metro Rail / Transport Transit">Metro Rail / Transit Project</option>
                  <option value="Hazardous / Diseased / Dead Trees">Hazardous / Diseased / Dead Trees</option>
                  <option value="Civil Building Construction">Civil Building Construction</option>
                  <option value="Stormwater / Underground Utilities">Stormwater / Underground Utilities</option>
                  <option value="Private Property Development">Private Property Development</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Project Description &amp; Technical Need <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Explain why tree felling cannot be avoided, what design alternatives were considered, and engineering constraints..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              {/* Geo inputs */}
              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Latitude (Decimal Degrees)
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Longitude (Decimal Degrees)
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Buffer Radius (Meters)
                </label>
                <select
                  name="bufferRadiusMeters"
                  value={formData.bufferRadiusMeters}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white"
                >
                  <option value={30}>30 meters</option>
                  <option value={50}>50 meters (Standard)</option>
                  <option value={100}>100 meters</option>
                  <option value={200}>200 meters (Corridor)</option>
                </select>
              </div>
            </div>

            {/* Interactive Leaflet Map Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#708477]">
                <span className="flex items-center gap-1.5 font-semibold text-[#142e1f]">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Interactive Geo-Location Picker (Click on map to position impact zone)
                </span>
                {overlapCount > 0 ? (
                  <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    ⚠️ {overlapCount} verified inventory trees in impact zone
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    No cataloged trees detected within immediate buffer
                  </span>
                )}
              </div>
              <div ref={mapContainerRef} className="tc-mini-map" />
              <p className="text-[11px] text-[#708477]">
                * Orange pin represents the center of your project zone. Red circle represents the impact zone. Green dots represent verified trees cataloged in VanJeevan GIS.
              </p>
            </div>

            {/* Tree counts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Estimated Trees Proposed to Cut <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  name="estimatedTreesAffected"
                  value={formData.estimatedTreesAffected}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white font-bold text-red-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Known Species at Site
                </label>
                <input
                  type="text"
                  name="speciesKnown"
                  value={formData.speciesKnown}
                  onChange={handleChange}
                  placeholder="e.g. Neem, Peepal, Banyan, Ashoka, Gulmohar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Compensatory Plan & Supporting Documents */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#142e1f] pb-2 border-b border-[rgba(20,46,31,0.06)]">
              <Trees className="w-4 h-4 text-[#2d6a4f]" />
              <span>Section 3: Statutory Compensatory Plan (Maharashtra 1:5 Mandate) &amp; Documents</span>
            </div>

            {/* Legal 1:5 preview highlight */}
            <div className="p-4 rounded-2xl bg-[#d8f3dc] border border-[#b7e4c7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#1b4332] uppercase tracking-wider">
                  Maharashtra Tree Authority Statutory Mandate
                </div>
                <div className="text-sm font-semibold text-[#142e1f] mt-0.5">
                  1 : 5 Mandatory Compensatory Afforestation Ratio
                </div>
                <div className="text-xs text-[#2d6a4f]">
                  For {formData.estimatedTreesAffected || 0} trees proposed to be felled, you are legally mandated to plant and sustain:
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-['Fraunces'] text-[#1b4332]">
                  {mandatedSaplingsPreview} Saplings
                </div>
                <div className="text-[10px] text-[#2d6a4f] font-semibold">
                  With 3-Year Geo-Tagged Maintenance
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Compensatory Afforestation Site Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="compensatoryLocation"
                  value={formData.compensatoryLocation}
                  onChange={handleChange}
                  placeholder="e.g. Municipal Urban Forest Zone 3, Gangapur Road / Riverfront Buffer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Target Compensatory Native Species
                </label>
                <input
                  type="text"
                  name="compensatorySpecies"
                  value={formData.compensatorySpecies}
                  onChange={handleChange}
                  placeholder="e.g. Neem, Peepal, Banyan, Jamun, Karanj"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142e1f] mb-1">
                  Maintenance &amp; Survival Term (Years)
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  name="compensatoryMaintenanceYears"
                  value={formData.compensatoryMaintenanceYears}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(20,46,31,0.18)] bg-white font-semibold"
                />
              </div>
            </div>

            {/* Document Upload Area */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-[#142e1f]">
                Upload Supporting Verification Documents (EIA, Site Photos, Ownership Title, Work Order)
              </label>
              <div className="border-2 border-dashed border-[rgba(20,46,31,0.2)] rounded-2xl p-6 text-center hover:bg-[#fbf9f4] transition-all">
                <Upload className="w-8 h-8 text-[#2d6a4f] mx-auto mb-2" />
                <div className="text-xs font-bold text-[#142e1f]">
                  Drag &amp; drop or click to attach files
                </div>
                <div className="text-[11px] text-[#708477] mt-1">
                  Supports PDF, JPG, PNG, GeoJSON (up to 10 files, max 25MB each)
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mt-3 text-xs text-[#708477]"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-bold text-[#142e1f]">
                    Attached Documents ({files.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-[#f3efe6] flex items-center justify-between text-xs"
                      >
                        <span className="truncate max-w-[200px] font-semibold">{f.name}</span>
                        <span className="text-[10px] text-[#708477]">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Legal Undertaking */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#142e1f] pb-2 border-b border-[rgba(20,46,31,0.06)]">
              <ShieldCheck className="w-4 h-4 text-[#2d6a4f]" />
              <span>Section 4: Summary Review &amp; Statutory Legal Declaration</span>
            </div>

            {/* Summary Grid */}
            <div className="bg-[#f8f6f0] rounded-2xl p-4 space-y-3 text-xs border border-[rgba(20,46,31,0.09)]">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[rgba(20,46,31,0.06)]">
                <div>
                  <span className="text-[#708477] block text-[10px]">Applicant &amp; Entity:</span>
                  <strong className="text-[#142e1f]">{formData.organization || user?.name} ({formData.applicantType})</strong>
                </div>
                <div>
                  <span className="text-[#708477] block text-[10px]">Project Title:</span>
                  <strong className="text-[#142e1f]">{formData.title}</strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pb-2 border-b border-[rgba(20,46,31,0.06)]">
                <div>
                  <span className="text-[#708477] block text-[10px]">Coordinates:</span>
                  <span className="font-mono">{formData.latitude}, {formData.longitude}</span>
                </div>
                <div>
                  <span className="text-[#708477] block text-[10px]">Trees Proposed:</span>
                  <span className="text-red-700 font-bold">{formData.estimatedTreesAffected} Trees</span>
                </div>
                <div>
                  <span className="text-[#708477] block text-[10px]">Mandated 1:5 Saplings:</span>
                  <span className="text-emerald-700 font-bold">{mandatedSaplingsPreview} Saplings</span>
                </div>
              </div>

              <div>
                <span className="text-[#708477] block text-[10px]">Compensatory Afforestation Site:</span>
                <span className="text-[#142e1f] font-semibold">{formData.compensatoryLocation}</span>
              </div>
            </div>

            {/* Statutory undertaking */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Scale className="w-4 h-4 text-amber-700" />
                Statutory Declaration under Maharashtra Tree Act 1975
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                I hereby declare that the facts and enumeration stated in this application are accurate to the best of my knowledge.
                I acknowledge that this filing is subject to public disclosure, independent geospatial verification, citizen voting,
                and tree authority review. I agree to fulfill the statutory 1:5 compensatory plantation mandate and 3-year survival monitoring.
              </p>
              <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="legalDeclarationAccepted"
                  checked={formData.legalDeclarationAccepted}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span>I affirm the legal undertaking and authorize civic public review</span>
              </label>
            </div>
          </div>
        )}

        {/* ── Wizard Navigation Controls ── */}
        <div className="flex items-center justify-between pt-4 border-t border-[rgba(20,46,31,0.08)]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#708477] hover:text-[#142e1f] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous Section
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all shadow-md flex items-center gap-1.5"
            >
              Continue to Step 0{step + 1}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !formData.legalDeclarationAccepted}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                loading || !formData.legalDeclarationAccepted
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#2d6a4f] text-white hover:bg-[#1b4332] shadow-emerald-900/20'
              }`}
            >
              {loading ? (
                <>Laying Application Ledger...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Formally Submit Tree-Cutting Application
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
