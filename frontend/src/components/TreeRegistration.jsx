import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Crosshair,
  Calculator,
  TreePine,
  Upload,
  Save,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  ImageOff,
  Camera,
  ScanLine,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { treeApi, registeredTreeApi, mediaBaseUrl, speciesDetectionApi } from '../services/api';
import ResultCard from './ResultCard';
import ConserveTreePage from './ConserveTreePage';
import { mapRegisteredTreeToCalculatorResult } from '../utils/mapTreeToCalculatorResult';

const HEALTH_OPTIONS = ['Healthy', 'Fair', 'Stressed', 'Damaged', 'Dead'];

const CALC_LABELS = [
  ['aboveGroundBiomass', 'Above Ground Biomass', 'kg'],
  ['belowGroundBiomass', 'Below Ground Biomass', 'kg'],
  ['totalBiomass', 'Total Biomass', 'kg'],
  ['carbonStorage', 'Carbon Storage', 'kg'],
  ['co2Sequestration', 'CO₂ Sequestration', 'kg'],
  ['annualCo2Absorption', 'Annual CO₂ Absorption', 'kg/yr'],
  ['oxygenReleased', 'Oxygen Released', 'kg'],
  ['canopyArea', 'Canopy Area', 'm²'],
  ['canopyCoverage', 'Canopy Coverage', '%'],
  ['shadeArea', 'Shade Area', 'm²'],
  ['airPollutionRemoval', 'Air Pollution Removal', 'kg/yr'],
  ['pm25Reduction', 'PM2.5 Reduction', 'kg/yr'],
  ['rainwaterInterception', 'Rainwater Interception', 'L/yr'],
  ['coolingEffect', 'Cooling Effect', 'kWh eq.'],
  ['heatIslandReduction', 'Heat Island Reduction', 'score'],
  ['soilStabilizationScore', 'Soil Stabilization Score', 'score'],
];

function absImage(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${mediaBaseUrl}${url}`;
}

function hasValidGps(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= -90 && a <= 90 && b >= -180 && b <= 180;
}

function AnalysisBlock({ title, data }) {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data).filter(
    ([k, v]) => !['birds', 'insects', 'mammals', 'compounds', 'applications', 'diseases'].includes(k) && typeof v === 'string' && v
  );
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
      <h4 className="text-sm font-bold text-emerald-400 mb-2">{title}</h4>
      <dl className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] uppercase tracking-wider text-slate-500">{k.replace(/([A-Z])/g, ' $1')}</dt>
            <dd className="text-xs text-slate-300 leading-relaxed">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TreeDetailsModal({ tree, onClose, onDeleted, focusAnalysis }) {
  const analysisRef = useRef(null);

  useEffect(() => {
    if (focusAnalysis && analysisRef.current) {
      analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusAnalysis, tree]);

  if (!tree) return null;
  const calc = tree.calculations || {};
  const images = tree.images || {};

  const Img = ({ src, label }) => (
    <div className="rounded-xl border border-slate-800/50 overflow-hidden bg-slate-950/50">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 px-3 py-2 border-b border-slate-800/50">{label}</div>
      {src ? (
        <img src={absImage(src)} alt={label} className="w-full h-40 object-cover" />
      ) : (
        <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
          <ImageOff className="w-6 h-6" />
          <span className="text-xs">Image not available</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-4xl glass-panel border-slate-800/60 my-6">
        <div className="flex items-start justify-between p-5 border-b border-slate-800/60">
          <div>
            <h3 className="text-lg font-bold text-slate-100">{tree.treeName || tree.commonName || tree.species}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {tree.treeId} · {tree.scientificName} · {tree.species}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          <section>
            <h4 className="text-sm font-bold text-slate-200 mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                ['Family', tree.family],
                ['Common Name', tree.commonName],
                ['Age', tree.age != null ? `${tree.age} yr` : '—'],
                ['Height', `${tree.height} m`],
                ['DBH', `${tree.dbh} cm`],
                ['GBH', `${tree.gbh} cm`],
                ['Crown Diameter', `${tree.crownDiameter ?? '—'} m`],
                ['Health', tree.healthStatus],
                ['Latitude', tree.latitude],
                ['Longitude', tree.longitude],
                ['Address', tree.address || '—'],
                ['Ward', tree.ward || '—'],
                ['Zone', tree.zone || '—'],
                ['Added', tree.createdAt ? new Date(tree.createdAt).toLocaleString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-950/50 border border-slate-800/40 p-3">
                  <div className="text-[10px] uppercase text-slate-500">{k}</div>
                  <div className="text-slate-200 mt-1 font-medium break-words">{String(v)}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-slate-200 mb-3">Images</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Img src={images.tree} label="Tree image" />
              <Img src={images.bark} label="Bark image" />
              <Img src={images.leaf} label="Leaf image" />
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-slate-200 mb-3">Calculations</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CALC_LABELS.map(([key, label, unit]) => (
                <div key={key} className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                  <div className="text-[10px] uppercase text-emerald-500/80">{label}</div>
                  <div className="text-slate-100 font-bold mt-1">
                    {calc[key] != null ? calc[key] : '—'} <span className="text-[10px] text-slate-500 font-normal">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section ref={analysisRef} className="scroll-mt-4">
            <h4 className="text-sm font-bold text-slate-200 mb-1">AI Analysis (stored)</h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Loaded from MongoDB — generated once at registration
              {tree.analysisGeneratedAt ? ` (${new Date(tree.analysisGeneratedAt).toLocaleString()})` : ''}.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnalysisBlock title="General Description" data={tree.climaticAnalysis?.generalDescription} />
              <AnalysisBlock title="Climatic Impact" data={tree.climaticAnalysis?.climaticImpact} />
              <AnalysisBlock title="Biodiversity" data={tree.biodiversity || tree.climaticAnalysis?.biodiversity} />
              <AnalysisBlock title="Canopy Analysis" data={tree.canopyAnalysis || tree.climaticAnalysis?.canopyAnalysis} />
              <AnalysisBlock title="Medicinal Value" data={tree.medicinalValue || tree.climaticAnalysis?.medicinalValue} />
              <AnalysisBlock title="Spiritual & Cultural" data={tree.culturalImportance || tree.climaticAnalysis?.culturalImportance} />
              <AnalysisBlock title="Pollution Control" data={tree.pollutionControl || tree.climaticAnalysis?.pollutionControl} />
              <AnalysisBlock title="Climate Resilience" data={tree.climateResilience || tree.climaticAnalysis?.climateResilience} />
              <AnalysisBlock title="Conservation Status" data={tree.conservationStatus || tree.climaticAnalysis?.conservationStatus} />
              <AnalysisBlock title="Maintenance" data={tree.maintenance || tree.climaticAnalysis?.maintenance} />
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-800/60 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10"
            onClick={async () => {
              if (!window.confirm('Are you sure you want to delete this tree?')) return;
              try {
                await registeredTreeApi.remove(tree._id || tree.id);
                onDeleted?.(tree);
                onClose();
              } catch (e) {
                alert(e.response?.data?.detail || e.message);
              }
            }}
          >
            Delete
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 text-slate-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TreeRegistration({ onError, initialResult, onTreeSaved }) {
  const [speciesList, setSpeciesList] = useState([]);
  const [trees, setTrees] = useState([]);
  const [form, setForm] = useState({
    treeId: `TR-DRAFT-${Date.now().toString().slice(-6)}`,
    treeName: '',
    scientificName: '',
    species: '',
    family: '',
    commonName: '',
    age: '',
    height: '',
    gbh: '',
    dbh: '',
    crownDiameter: '',
    healthStatus: 'Healthy',
    latitude: '',
    longitude: '',
    address: '',
    ward: '',
    zone: '',
  });
  const [treeImage, setTreeImage] = useState(null);
  const [barkImage, setBarkImage] = useState(null);
  const [leafImage, setLeafImage] = useState(null);
  const [analysisPreview, setAnalysisPreview] = useState(null);
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [showConservation, setShowConservation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [gpsHint, setGpsHint] = useState('');
  const [detailsTree, setDetailsTree] = useState(null);
  const [focusAnalysis, setFocusAnalysis] = useState(false);
  const calculatorRef = useRef(null);

  // Species detection state
  const [detectionImage, setDetectionImage] = useState(null);
  const [detectionPreview, setDetectionPreview] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [detectionServerUp, setDetectionServerUp] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const gpsValid = hasValidGps(form.latitude, form.longitude);
  const canCalculate = Boolean(form.species && Number(form.gbh) > 0 && Number(form.height) > 0);
  const canAddTree = Boolean(canCalculate && analysisPreview && gpsValid);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const loadTrees = useCallback(async () => {
    try {
      const list = await registeredTreeApi.list();
      setTrees(list);
    } catch (e) {
      console.warn(e);
      onError?.(e.response?.data?.detail || e.message);
    }
  }, [onError]);

  useEffect(() => {
    treeApi.getSpecies().then(setSpeciesList).catch((e) => onError?.(e.message));
    loadTrees();
    // Check if species detection server is up
    speciesDetectionApi.health().then((r) => setDetectionServerUp(r.model_loaded)).catch(() => setDetectionServerUp(false));
  }, [loadTrees, onError]);

  useEffect(() => {
    if (initialResult) {
      setCalculatedResult(initialResult);
      setForm((f) => ({
        ...f,
        species: initialResult.species_name || f.species,
        gbh: initialResult.gbh != null && initialResult.gbh > 0 ? String(initialResult.gbh) : f.gbh,
        height: initialResult.height != null && initialResult.height > 0 ? String(initialResult.height) : f.height,
        dbh: initialResult.dbh != null && initialResult.dbh > 0 ? String(initialResult.dbh) : f.dbh,
        age: initialResult.age != null && initialResult.age > 0 ? String(initialResult.age) : f.age,
        latitude: initialResult.latitude != null ? String(initialResult.latitude) : f.latitude,
        longitude: initialResult.longitude != null ? String(initialResult.longitude) : f.longitude,
      }));
      setTimeout(() => {
        calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [initialResult]);

  // --- Species Detection Handlers ---
  const handleDetectionImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDetectionImage(file);
    setDetectionPreview(URL.createObjectURL(file));
    setDetectionResult(null);
  };

  const openCamera = async () => {
    setCameraOpen(true);
    setDetectionResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      onError?.('Camera access denied or not available.');
      setCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
        setDetectionImage(file);
        setDetectionPreview(URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.9);
    closeCamera();
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const handleDetectSpecies = async () => {
    if (!detectionImage) {
      onError?.('Please upload or capture an image first.');
      return;
    }
    setDetecting(true);
    try {
      const result = await speciesDetectionApi.predict(detectionImage);
      if (result.error) {
        onError?.(result.error);
        setDetecting(false);
        return;
      }
      setDetectionResult(result);
      // Auto-fill species in the form — map model class to species list
      const modelToSpecies = {
        ashoka: 'Ashoka', banyan: 'Banyan', mango: 'Mango',
        neem: 'Neem', peepal: 'Peepal', raintree: 'Rain Tree', rubber: 'Rubber',
      };
      const matchedName = modelToSpecies[result.prediction] || result.display_name;
      const found = speciesList.find(
        (s) => s.name.toLowerCase() === matchedName.toLowerCase()
      );
      if (found) {
        setField('species', found.name);
        setField('scientificName', result.scientific_name || '');
        setField('family', result.family || '');
        setField('commonName', found.name);
        setField('treeName', found.name);
      } else {
        // Species not in calculator dropdown, fill what we can
        setField('scientificName', result.scientific_name || '');
        setField('family', result.family || '');
        setField('commonName', result.display_name || '');
        setField('treeName', result.display_name || '');
      }
      // Also set the detection image as the tree image
      setTreeImage(detectionImage);
    } catch (e) {
      onError?.('Species detection server not reachable. Is it running on port 5000?');
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (!form.species) return;
    const sp = speciesList.find((s) => s.name === form.species);
    // scientific/family filled after analyze from catalog; keep species name as common default
    if (!form.commonName) setField('commonName', form.species);
    if (!form.treeName) setField('treeName', form.species);
    void sp;
  }, [form.species]);

  const handleDeviceGps = () => {
    if (!navigator.geolocation) {
      setGpsHint('Geolocation is not supported on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
        setGpsHint('');
      },
      () => setGpsHint('Unable to read device location. Please manually enter coordinates.'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleCalculate = async () => {
    if (!canCalculate) {
      onError?.('Please select a species and enter valid GBH and height before calculating.');
      return;
    }
    setBusy(true);
    setSuccessMsg('');
    try {
      const data = await registeredTreeApi.analyze({
        species: form.species,
        gbh: Number(form.gbh),
        height: Number(form.height),
        crownDiameter: form.crownDiameter ? Number(form.crownDiameter) : null,
        age: form.age ? Number(form.age) : null,
        latitude: gpsValid ? Number(form.latitude) : null,
        longitude: gpsValid ? Number(form.longitude) : null,
      });
      setAnalysisPreview(data);
      const mapped = mapRegisteredTreeToCalculatorResult(data);
      setCalculatedResult(mapped);
      setForm((f) => ({
        ...f,
        scientificName: data.scientificName || f.scientificName,
        family: data.family || f.family,
        commonName: data.commonName || f.commonName,
        dbh: data.calculations?.dbh != null ? String(data.calculations.dbh) : f.dbh,
        age: data.calculations?.age != null ? String(data.calculations.age) : f.age,
      }));
      setTimeout(() => {
        calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (e) {
      onError?.(e.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddTree = async () => {
    if (!gpsValid) {
      setGpsHint('Please capture the tree location before saving.');
      return;
    }
    if (!canAddTree) {
      onError?.('Run Calculate Analysis first, and ensure GPS is set.');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries({
        treeId: form.treeId.startsWith('TR-DRAFT') ? '' : form.treeId,
        treeName: form.treeName,
        scientificName: form.scientificName || analysisPreview.scientificName,
        species: form.species,
        family: form.family || analysisPreview.family,
        commonName: form.commonName,
        age: form.age,
        height: form.height,
        gbh: form.gbh,
        crownDiameter: form.crownDiameter,
        healthStatus: form.healthStatus,
        latitude: form.latitude,
        longitude: form.longitude,
        address: form.address,
        ward: form.ward,
        zone: form.zone,
        calculationsJson: JSON.stringify(analysisPreview.calculations),
        climaticAnalysisJson: JSON.stringify(analysisPreview.climaticAnalysis),
        analysisSource: analysisPreview.analysisSource || 'local-rag',
      }).forEach(([k, v]) => {
        if (v !== '' && v != null) fd.append(k, v);
      });
      if (treeImage) fd.append('treeImage', treeImage);
      if (barkImage) fd.append('barkImage', barkImage);
      if (leafImage) fd.append('leafImage', leafImage);

      const saved = await registeredTreeApi.create(fd);
      setTrees((prev) => [saved, ...prev]);
      setSuccessMsg(`Tree ${saved.treeId} saved to MongoDB and added to the map.`);
      setAnalysisPreview(null);
      setCalculatedResult(null);
      onTreeSaved?.();
      setTreeImage(null);
      setBarkImage(null);
      setLeafImage(null);
      setForm((f) => ({
        ...f,
        treeId: `TR-DRAFT-${Date.now().toString().slice(-6)}`,
        treeName: '',
        age: '',
        height: '',
        gbh: '',
        dbh: '',
        crownDiameter: '',
        address: '',
        ward: '',
        zone: '',
      }));
    } catch (e) {
      onError?.(e.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  if (showConservation && calculatedResult) {
    return (
      <ConserveTreePage
        result={calculatedResult}
        onBack={() => setShowConservation(false)}
        onError={onError}
        onSaved={() => {
          setShowConservation(false);
          onTreeSaved?.();
          loadTrees();
        }}
      />
    );
  }

  const previewCalcs = analysisPreview?.calculations;

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#d8f3dc] border border-[rgba(45,106,79,0.25)] flex items-center gap-3 text-[#142e1f] text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2d6a4f]" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT COLUMN: Botanical Identification, Biometrics & Visual Evidence
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: Botanical Identification & Biometrics */}
          <div className="nature-card p-6 md:p-7 space-y-5 bg-white border-2 border-slate-200 shadow-sm rounded-2xl">
            <div className="border-b border-slate-200 pb-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-['Fraunces'] text-[#022c17] flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-[#059669]" />
                  Tree Identification &amp; Biometrics
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">Record botanical taxonomy and allometric measurements</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-[#022c17] border border-emerald-300 shadow-xs">
                {form.treeId}
              </span>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                <span>Tree Identification / Nickname</span>
                <input
                  className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                  value={form.treeName}
                  onChange={(e) => setField('treeName', e.target.value)}
                  placeholder="e.g. Heritage Banyan North Gate"
                />
              </label>

              <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                <span>Botanical Species *</span>
                <select
                  className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold text-[#022c17] transition-all outline-none shadow-xs cursor-pointer"
                  value={form.species}
                  onChange={(e) => setField('species', e.target.value)}
                >
                  <option value="" className="text-slate-500">Select botanical species</option>
                  {speciesList.map((s) => (
                    <option key={s.id} value={s.name} className="text-[#022c17] font-semibold">{s.name}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                  <span>Common Name</span>
                  <input
                    className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-3.5 py-3 text-sm font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                    value={form.commonName}
                    onChange={(e) => setField('commonName', e.target.value)}
                    placeholder="e.g. Indian Banyan"
                  />
                </label>
                <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                  <span>Scientific Name</span>
                  <input
                    className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-3.5 py-3 text-sm font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs italic"
                    value={form.scientificName}
                    onChange={(e) => setField('scientificName', e.target.value)}
                    placeholder="e.g. Ficus benghalensis"
                  />
                </label>
                <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                  <span>Botanical Family</span>
                  <input
                    className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-3.5 py-3 text-sm font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                    value={form.family}
                    onChange={(e) => setField('family', e.target.value)}
                    placeholder="e.g. Moraceae"
                  />
                </label>
              </div>

              <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                <span>Health &amp; Vitality Status</span>
                <select
                  className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold text-[#022c17] transition-all outline-none shadow-xs cursor-pointer"
                  value={form.healthStatus}
                  onChange={(e) => setField('healthStatus', e.target.value)}
                >
                  {HEALTH_OPTIONS.map((h) => <option key={h} value={h} className="text-[#022c17] font-semibold">{h}</option>)}
                </select>
              </label>

              {/* Allometric Dimensions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                  <span>GBH Girth (cm) *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                    value={form.gbh}
                    onChange={(e) => setField('gbh', e.target.value)}
                    placeholder="e.g. 110"
                  />
                </label>
                <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                  <span>Height (m) *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                    value={form.height}
                    onChange={(e) => setField('height', e.target.value)}
                    placeholder="e.g. 14.5"
                  />
                </label>
                <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                  <span>DBH (auto-computed)</span>
                  <input
                    className="w-full rounded-2xl bg-slate-100 border-2 border-slate-300 px-4 py-3 text-[15px] font-bold text-slate-800 outline-none shadow-xs cursor-not-allowed"
                    value={form.dbh ? `${form.dbh} cm` : '—'}
                    readOnly
                  />
                </label>
                <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                  <span>Estimated Age (yr)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                    value={form.age}
                    onChange={(e) => setField('age', e.target.value)}
                    placeholder="e.g. 35"
                  />
                </label>
                <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide sm:col-span-2">
                  <span>Crown Diameter (m)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                    value={form.crownDiameter}
                    onChange={(e) => setField('crownDiameter', e.target.value)}
                    placeholder="e.g. 8.2"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Field Visual Evidence & Photos */}
          <div className="nature-card p-6 md:p-7 space-y-4 bg-white border-2 border-slate-200 shadow-sm rounded-2xl">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-['Fraunces'] text-[#022c17] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#059669]" />
                  Field Photography &amp; Visual Evidence
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">Upload field images for verified botanical documentation</p>
              </div>
              <span className="text-xs font-bold text-slate-500">Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                { label: 'Tree Habit / Full View', file: treeImage, setter: setTreeImage },
                { label: 'Bark Texture & Trunk', file: barkImage, setter: setBarkImage },
                { label: 'Leaf & Foliage', file: leafImage, setter: setLeafImage },
              ].map(({ label, file, setter }) => (
                <div key={label} className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 transition-all space-y-2">
                  <div className="text-xs font-extrabold text-[#022c17] truncate">{label}</div>
                  {file ? (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden h-28 border border-emerald-300">
                        <img src={URL.createObjectURL(file)} alt={label} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setter(null)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800 truncate">{file.name}</div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 cursor-pointer transition-all p-2 text-center">
                      <Upload className="w-5 h-5 text-[#059669] mb-1" />
                      <span className="text-xs font-bold text-slate-700">Choose File</span>
                      <span className="text-[10px] text-slate-500">PNG, JPG, WEBP</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setter(e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT COLUMN: AI Species Detection, Geospatial Geolocation & Actions
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 3: AI Species Detection Scanner */}
          <div className="nature-card p-6 md:p-7 space-y-4 bg-white border-2 border-slate-200 shadow-sm rounded-2xl">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-['Fraunces'] text-[#022c17] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Computer Vision Species Detection
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">Automatic species recognition powered by deep neural networks</p>
              </div>
              {detectionServerUp === true && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> AI Online
                </span>
              )}
              {detectionServerUp === false && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-100 border border-red-300 px-3 py-1 rounded-full shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> AI Offline
                </span>
              )}
            </div>

            {/* Camera view */}
            {cameraOpen && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500 shadow-md">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover bg-black" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <button type="button" onClick={capturePhoto} className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white flex items-center gap-2 shadow-lg hover:bg-purple-600 transition-colors">
                    <Camera className="w-4 h-4" /> Capture Photo
                  </button>
                  <button type="button" onClick={closeCamera} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white flex items-center gap-2 hover:bg-slate-700 transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />

            {/* Preview image */}
            {detectionPreview && !cameraOpen && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xs">
                <img src={detectionPreview} alt="Detection preview" className="w-full h-44 object-cover" />
                <button
                  type="button"
                  onClick={() => { setDetectionImage(null); setDetectionPreview(null); setDetectionResult(null); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Camera / Upload Action Bar */}
            {!cameraOpen && (
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={openCamera}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border-2 border-purple-200 hover:bg-purple-100 flex items-center gap-2 transition-all shadow-xs"
                >
                  <Camera className="w-4 h-4 text-purple-700" /> Open Camera
                </button>
                <label className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border-2 border-slate-200 hover:bg-slate-200 flex items-center gap-2 cursor-pointer transition-all shadow-xs">
                  <Upload className="w-4 h-4 text-slate-700" /> Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleDetectionImageUpload} />
                </label>
                <button
                  type="button"
                  disabled={!detectionImage || detecting}
                  onClick={handleDetectSpecies}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#047857] hover:bg-[#065f46] text-white flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all ml-auto"
                >
                  {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  {detecting ? 'Analyzing Image...' : 'Detect Species with AI'}
                </button>
              </div>
            )}

            {/* Detection Results Card */}
            {detectionResult && (
              <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                    <div>
                      <span className="text-sm font-black text-[#022c17]">
                        {detectionResult.display_name}
                      </span>
                      <span className="text-xs text-slate-600 italic ml-2">
                        ({detectionResult.scientific_name})
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-200 text-[#022c17]">
                    Confidence: {detectionResult.confidence}%
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  Identified species has been automatically synchronized to the botanical biometrics form.
                </p>
              </div>
            )}
          </div>

          {/* Card 4: Mandatory Geospatial Location & Administrative Ward */}
          <div className="nature-card p-6 md:p-7 space-y-5 bg-white border-2 border-slate-200 shadow-sm rounded-2xl">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-['Fraunces'] text-[#022c17] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#059669]" />
                  Geospatial Location &amp; Administration
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">Mandatory WGS-84 coordinates &amp; administrative sector</p>
              </div>
              <button
                type="button"
                onClick={handleDeviceGps}
                className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white flex items-center gap-2 text-xs font-bold shadow-md transition-all"
              >
                <Crosshair className="w-4 h-4 text-emerald-200" /> Capture Device GPS
              </button>
            </div>

            {/* GPS Verification Status Banner */}
            <div className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 text-xs font-bold ${
              gpsValid
                ? 'bg-emerald-50 border-emerald-300 text-[#022c17]'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-2">
                {gpsValid ? <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" /> : <MapPin className="w-4 h-4 text-amber-600 shrink-0" />}
                <span>
                  {gpsValid
                    ? `GPS Verified: [${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}]`
                    : 'GPS coordinates required before registering tree record.'}
                </span>
              </div>
              {gpsValid && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-[#022c17] text-[11px] font-black">
                  Locked
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                <span>Latitude *</span>
                <input
                  className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold font-mono text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                  value={form.latitude}
                  onChange={(e) => { setField('latitude', e.target.value); setGpsHint(''); }}
                  placeholder="e.g. 20.013500"
                />
              </label>
              <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                <span>Longitude *</span>
                <input
                  className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-4 py-3 text-[15px] font-bold font-mono text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                  value={form.longitude}
                  onChange={(e) => { setField('longitude', e.target.value); setGpsHint(''); }}
                  placeholder="e.g. 73.821300"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide sm:col-span-1">
                <span>Street Address</span>
                <input
                  className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-3.5 py-3 text-sm font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Campus / Street address"
                />
              </label>
              <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                <span>Municipal Ward</span>
                <input
                  className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-3.5 py-3 text-sm font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                  value={form.ward}
                  onChange={(e) => setField('ward', e.target.value)}
                  placeholder="e.g. Ward 12 (Panchavati)"
                />
              </label>
              <label className="text-xs font-extrabold text-[#022c17] space-y-1.5 block tracking-wide">
                <span>Environmental Zone</span>
                <input
                  className="w-full rounded-2xl bg-white border-2 border-[#059669] hover:border-[#047857] focus:border-[#047857] focus:ring-4 focus:ring-emerald-500/25 px-3.5 py-3 text-sm font-bold text-[#022c17] placeholder:text-slate-500 transition-all outline-none shadow-xs"
                  value={form.zone}
                  onChange={(e) => setField('zone', e.target.value)}
                  placeholder="e.g. North Sector"
                />
              </label>
            </div>
          </div>

          {/* Card 5: Allometric Calculation & Field Action Operations */}
          <div className="nature-card p-6 md:p-7 space-y-5 bg-white border-2 border-slate-200 shadow-sm rounded-2xl">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-['Fraunces'] text-[#022c17] flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#059669]" />
                  Allometric Analysis &amp; Field Actions
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">Compute carbon sequestration and register into MongoDB live inventory</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canCalculate || busy}
                onClick={handleCalculate}
                className="px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 bg-indigo-50 text-indigo-900 border-2 border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4 text-indigo-600" />}
                Calculate Allometric Metrics
              </button>
              <button
                type="button"
                disabled={!canAddTree || busy}
                onClick={handleAddTree}
                className="px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 bg-[#047857] hover:bg-[#065f46] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all ml-auto"
                title={!gpsValid ? 'Please capture the tree location before saving.' : undefined}
              >
                <Save className="w-4 h-4" />
                Save Tree to Inventory
              </button>
            </div>

            {/* Quick Metrics Live Preview */}
            {previewCalcs ? (
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                <div className="text-xs font-black text-[#022c17] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                  Calculation Preview
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CALC_LABELS.slice(0, 8).map(([key, label, unit]) => (
                    <div key={key} className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-xs">
                      <div className="text-[10px] text-slate-600 uppercase font-bold truncate">{label}</div>
                      <div className="text-xs text-[#022c17] font-black mt-0.5">{previewCalcs[key]} <span className="text-[10px] text-slate-500 font-semibold">{unit}</span></div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 font-medium pt-1 border-t border-slate-200">
                  RAG allometric analysis ready — click 'Save Tree to Inventory' to record permanently in MongoDB.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center py-6 text-slate-600 text-xs space-y-1">
                <Calculator className="w-6 h-6 text-[#059669] mx-auto opacity-70" />
                <p className="font-bold text-slate-800">Enter Species, GBH and Height</p>
                <p className="text-[11px]">Click 'Calculate Allometric Metrics' to preview carbon and ecological telemetry.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL CALCULATOR RESULTS SECTION */}
      {calculatedResult && (
        <div ref={calculatorRef} className="nature-card p-6 md:p-8 space-y-6 scroll-mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[rgba(20,46,31,0.08)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="nature-chip nature-chip-forest">
                  Calculated Results
                </span>
                <span className="text-xs text-[#708477] font-semibold">
                  {calculatedResult.species_name}
                </span>
              </div>
              <h3 className="text-xl font-bold font-['Fraunces'] text-[#142e1f] flex items-center gap-2 mt-1">
                <Sparkles className="w-5 h-5 text-[#2d6a4f]" />
                Ecological Impact &amp; Allometric Analysis
              </h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowConservation(true)}
                className="px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
              >
                Why not to cut this tree
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!canAddTree || busy}
                onClick={handleAddTree}
                className="btn-forest-primary text-xs !py-2.5 !px-4"
                title={!gpsValid ? 'Please capture the tree location using GPS or coordinates above before saving.' : undefined}
              >
                <Save className="w-4 h-4" />
                Save Tree to Inventory
              </button>
            </div>
          </div>

          <ResultCard result={calculatedResult} />

          <div className="pt-4 border-t border-[rgba(20,46,31,0.08)] flex flex-wrap justify-between items-center gap-4">
            <p className="text-xs font-semibold text-slate-700">
              {!gpsValid
                ? '⚠️ Capture GPS using the button or coordinates above to permanently save this tree record to MongoDB.'
                : '✅ Location verified. Ready to register tree.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConservation(true)}
                className="px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
              >
                Why not to cut this tree
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!canAddTree || busy}
                onClick={handleAddTree}
                className="btn-harvest-gold text-xs !py-2.5 !px-5"
              >
                <Save className="w-4 h-4" />
                Save Tree to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nature-card p-6">
        <h3 className="text-base font-bold font-['Fraunces'] text-[#142e1f] mb-3">Registered Trees ({trees.length})</h3>
        {trees.length === 0 ? (
          <p className="text-xs text-[#708477]">No MongoDB trees yet. Complete the workflow above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[#24523a] bg-[#f3efe6] border-b border-[rgba(20,46,31,0.08)] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Record ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Species</th>
                  <th className="py-2.5 px-3">GPS Coordinates</th>
                  <th className="py-2.5 px-3">Health</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(20,46,31,0.06)]">
                {trees.map((t) => (
                  <tr key={t._id} className="text-[#142e1f] hover:bg-[#fbf9f4]">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#708477]">{t.treeId}</td>
                    <td className="py-2.5 px-3 font-bold">{t.treeName}</td>
                    <td className="py-2.5 px-3">{t.species}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#24523a]">{t.latitude}, {t.longitude}</td>
                    <td className="py-2.5 px-3">
                      <span className="nature-chip nature-chip-forest !text-[10px] !py-0.5 !px-2">{t.healthStatus}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex gap-1.5 justify-end">
                        <button type="button" className="p-1 rounded-lg bg-[#d8f3dc] text-[#2d6a4f] hover:bg-[#b7e4c7]" title="View Details" onClick={() => { setFocusAnalysis(false); setDetailsTree(t); }}>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 rounded-lg bg-[#f3efe6] text-[#7f4f24] hover:bg-[#ede0d4]" title="Analysis" onClick={() => { setFocusAnalysis(true); setDetailsTree(t); }}>
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          title="Delete"
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this tree?')) return;
                            try {
                              await registeredTreeApi.remove(t._id);
                              setTrees((prev) => prev.filter((x) => x._id !== t._id));
                            } catch (e) {
                              onError?.(e.response?.data?.detail || e.message);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailsTree && (
        <TreeDetailsModal
          tree={detailsTree}
          focusAnalysis={focusAnalysis}
          onClose={() => setDetailsTree(null)}
          onDeleted={(deleted) => setTrees((prev) => prev.filter((t) => t._id !== deleted._id))}
        />
      )}
    </div>
  );
}
