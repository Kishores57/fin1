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

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const registeredLayer = useRef(null);

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

  const placeMarker = useCallback((lat, lng) => {
    // eslint-disable-next-line no-undef
    const L = window.L;
    if (!mapInstance.current || !L) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstance.current);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng();
        setForm((f) => ({ ...f, latitude: String(p.lat.toFixed(6)), longitude: String(p.lng.toFixed(6)) }));
        setGpsHint('');
      });
    }
    mapInstance.current.setView([lat, lng], Math.max(mapInstance.current.getZoom(), 16));
  }, []);

  const renderRegisteredMarkers = useCallback(() => {
    // eslint-disable-next-line no-undef
    const L = window.L;
    if (!mapInstance.current || !L) return;
    if (registeredLayer.current) {
      registeredLayer.current.clearLayers();
    } else {
      registeredLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    trees.forEach((tree) => {
      if (!hasValidGps(tree.latitude, tree.longitude)) return;
      const m = L.marker([tree.latitude, tree.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid #ecfdf5;box-shadow:0 0 0 3px rgba(16,185,129,.35)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      });
      const dateAdded = tree.createdAt ? new Date(tree.createdAt).toLocaleDateString() : '—';
      m.bindPopup(`
        <div style="min-width:200px;font-family:system-ui;font-size:12px">
          <strong>${tree.treeName || tree.species}</strong><br/>
          Species: ${tree.species}<br/>
          Scientific: ${tree.scientificName || '—'}<br/>
          Age: ${tree.age ?? '—'} yr<br/>
          Height: ${tree.height ?? '—'} m<br/>
          DBH: ${tree.dbh ?? '—'} cm<br/>
          Lat: ${tree.latitude}<br/>
          Lng: ${tree.longitude}<br/>
          Health: ${tree.healthStatus || '—'}<br/>
          Date Added: ${dateAdded}<br/>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <button data-act="details" data-id="${tree._id}" style="padding:4px 8px;border-radius:6px;border:0;background:#0f766e;color:#fff;cursor:pointer">View Details</button>
            <button data-act="analysis" data-id="${tree._id}" style="padding:4px 8px;border-radius:6px;border:0;background:#4f46e5;color:#fff;cursor:pointer">Analysis</button>
            <button data-act="delete" data-id="${tree._id}" style="padding:4px 8px;border-radius:6px;border:0;background:#b91c1c;color:#fff;cursor:pointer">Delete</button>
          </div>
        </div>
      `);
      m.on('popupopen', () => {
        const el = m.getPopup().getElement();
        if (!el) return;
        el.querySelectorAll('button[data-act]').forEach((btn) => {
          btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            const act = btn.getAttribute('data-act');
            const found = trees.find((t) => String(t._id) === String(id));
            if (!found) return;
            if (act === 'delete') {
              if (!window.confirm('Are you sure you want to delete this tree?')) return;
              try {
                await registeredTreeApi.remove(id);
                setTrees((prev) => prev.filter((t) => String(t._id) !== String(id)));
                m.closePopup();
              } catch (e) {
                alert(e.response?.data?.detail || e.message);
              }
              return;
            }
            setFocusAnalysis(act === 'analysis');
            setDetailsTree(found);
          };
        });
      });
      m.addTo(registeredLayer.current);
    });
  }, [trees]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const L = window.L;
    if (!mapRef.current || !L || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [20.0131, 73.8213],
      zoom: 14,
      scrollWheelZoom: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20,
    }).addTo(mapInstance.current);

    mapInstance.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setForm((f) => ({
        ...f,
        latitude: String(lat.toFixed(6)),
        longitude: String(lng.toFixed(6)),
      }));
      setGpsHint('');
      placeMarker(lat, lng);
    });

    setTimeout(() => mapInstance.current?.invalidateSize(), 200);
  }, [placeMarker]);

  useEffect(() => {
    renderRegisteredMarkers();
  }, [renderRegisteredMarkers]);

  useEffect(() => {
    if (gpsValid) placeMarker(Number(form.latitude), Number(form.longitude));
  }, [form.latitude, form.longitude, gpsValid, placeMarker]);

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
        placeMarker(Number(lat), Number(lng));
      },
      () => setGpsHint('Unable to read device location. Click the map or enter coordinates.'),
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
      placeMarker(saved.latitude, saved.longitude);
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
        <div className="glass-panel border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-panel p-6 border-slate-800/50 space-y-5">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <TreePine className="w-5 h-5 text-emerald-400" />
              Tree Registration Form
            </h2>
            <p className="text-xs text-slate-500 mt-1">GPS is mandatory. Calculate first, then Add Tree to MongoDB.</p>
          </div>

          {/* ===== SPECIES DETECTION SECTION ===== */}
          <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Species Detection
                {detectionServerUp === true && (
                  <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </span>
                )}
                {detectionServerUp === false && (
                  <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Offline
                  </span>
                )}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">Upload a tree photo or use your camera — AI will detect the species automatically.</p>

            {/* Camera view */}
            {cameraOpen && (
              <div className="relative rounded-xl overflow-hidden border border-purple-500/30">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover bg-black" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <button type="button" onClick={capturePhoto} className="px-4 py-2 rounded-xl text-sm font-bold bg-purple-600 text-white flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-colors">
                    <Camera className="w-4 h-4" /> Capture
                  </button>
                  <button type="button" onClick={closeCamera} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 text-slate-300 flex items-center gap-2 hover:bg-slate-700 transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />

            {/* Preview image */}
            {detectionPreview && !cameraOpen && (
              <div className="relative rounded-xl overflow-hidden border border-slate-800/50">
                <img src={detectionPreview} alt="Detection preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setDetectionImage(null); setDetectionPreview(null); setDetectionResult(null); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Buttons */}
            {!cameraOpen && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={openCamera} className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25 flex items-center gap-1.5 hover:bg-purple-500/25 transition-colors">
                  <Camera className="w-3.5 h-3.5" /> Open Camera
                </button>
                <label className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/60 text-slate-300 border border-slate-700/50 flex items-center gap-1.5 cursor-pointer hover:bg-slate-700/60 transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleDetectionImageUpload} />
                </label>
                <button
                  type="button"
                  disabled={!detectionImage || detecting}
                  onClick={handleDetectSpecies}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                >
                  {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                  {detecting ? 'Detecting...' : 'Detect Species'}
                </button>
              </div>
            )}

            {/* Detection Results */}
            {detectionResult && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-2 animate-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">
                    {detectionResult.display_name}
                  </span>
                  <span className="text-xs text-emerald-400/70 italic">{detectionResult.scientific_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-16">Confidence</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${detectionResult.confidence}%`,
                        background: detectionResult.confidence > 70
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : detectionResult.confidence > 40
                          ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          : 'linear-gradient(90deg, #ef4444, #f87171)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300 w-14 text-right">{detectionResult.confidence}%</span>
                </div>
                {detectionResult.all_predictions && (
                  <details className="mt-1">
                    <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-400">All predictions</summary>
                    <div className="mt-1 space-y-1">
                      {detectionResult.all_predictions.map((p) => (
                        <div key={p.class} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-20 truncate">{p.display_name}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
                            <div className="h-full rounded-full bg-purple-500/60 transition-all duration-700" style={{ width: `${p.confidence}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-12 text-right">{p.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
          {/* ===== END SPECIES DETECTION ===== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs text-slate-400 space-y-1">
              <span>Tree ID (auto)</span>
              <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-300" value={form.treeId} readOnly />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Tree Name</span>
              <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.treeName} onChange={(e) => setField('treeName', e.target.value)} />
            </label>
            <label className="text-xs text-slate-400 space-y-1 md:col-span-2">
              <span>Species *</span>
              <select
                className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200"
                value={form.species}
                onChange={(e) => setField('species', e.target.value)}
              >
                <option value="">Select species</option>
                {speciesList.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Scientific Name</span>
              <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.scientificName} onChange={(e) => setField('scientificName', e.target.value)} />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Family</span>
              <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.family} onChange={(e) => setField('family', e.target.value)} />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Common Name</span>
              <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.commonName} onChange={(e) => setField('commonName', e.target.value)} />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Health Status</span>
              <select className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.healthStatus} onChange={(e) => setField('healthStatus', e.target.value)}>
                {HEALTH_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>GBH (cm) *</span>
              <input type="number" min="0" step="0.1" className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.gbh} onChange={(e) => setField('gbh', e.target.value)} />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Height (m) *</span>
              <input type="number" min="0" step="0.1" className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.height} onChange={(e) => setField('height', e.target.value)} />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>DBH (auto after calc)</span>
              <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-400" value={form.dbh} readOnly />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Age (optional override)</span>
              <input type="number" min="0" step="0.1" className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.age} onChange={(e) => setField('age', e.target.value)} />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Crown Diameter (m)</span>
              <input type="number" min="0" step="0.1" className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.crownDiameter} onChange={(e) => setField('crownDiameter', e.target.value)} />
            </label>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location (Mandatory GPS)
              </h3>
              <button type="button" onClick={handleDeviceGps} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/30 flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" /> Current location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-400 space-y-1">
                <span>Latitude *</span>
                <input
                  className={`w-full rounded-xl bg-slate-950/60 border px-3 py-2 text-slate-200 ${gpsValid ? 'border-slate-800' : 'border-red-500/50'}`}
                  value={form.latitude}
                  onChange={(e) => { setField('latitude', e.target.value); setGpsHint(''); }}
                  placeholder="Click map or enter"
                />
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Longitude *</span>
                <input
                  className={`w-full rounded-xl bg-slate-950/60 border px-3 py-2 text-slate-200 ${gpsValid ? 'border-slate-800' : 'border-red-500/50'}`}
                  value={form.longitude}
                  onChange={(e) => { setField('longitude', e.target.value); setGpsHint(''); }}
                  placeholder="Click map or enter"
                />
              </label>
            </div>
            {(gpsHint || !gpsValid) && (
              <p className="text-xs text-red-400">Please capture the tree location before saving.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-xs text-slate-400 space-y-1 md:col-span-1">
                <span>Address</span>
                <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.address} onChange={(e) => setField('address', e.target.value)} />
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Ward</span>
                <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.ward} onChange={(e) => setField('ward', e.target.value)} />
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Zone</span>
                <input className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200" value={form.zone} onChange={(e) => setField('zone', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              ['Tree Image', treeImage, setTreeImage],
              ['Bark Image', barkImage, setBarkImage],
              ['Leaf Image', leafImage, setLeafImage],
            ].map(([label, file, setter]) => (
              <label key={label} className="text-xs text-slate-400 space-y-1">
                <span className="flex items-center gap-1"><Upload className="w-3 h-3" /> {label} (optional)</span>
                <input type="file" accept="image/*" className="w-full text-xs text-slate-400" onChange={(e) => setter(e.target.files?.[0] || null)} />
                {file && <span className="text-[10px] text-emerald-400">{file.name}</span>}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={!canCalculate || busy}
              onClick={handleCalculate}
              className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Calculate Analysis
            </button>
            <button
              type="button"
              disabled={!canAddTree || busy}
              onClick={handleAddTree}
              className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              title={!gpsValid ? 'Please capture the tree location before saving.' : undefined}
            >
              <Save className="w-4 h-4" />
              Add Tree
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-3 border-slate-800/50">
            <p className="text-xs text-slate-400 mb-2 px-1">Click map to set GPS · Registered trees appear as green markers</p>
            <div ref={mapRef} className="w-full h-[360px] rounded-xl overflow-hidden border border-slate-800/60" />
          </div>

          {previewCalcs && (
            <div className="glass-panel p-5 border-slate-800/50">
              <h3 className="text-sm font-bold text-slate-200 mb-3">Calculation Preview</h3>
              <div className="grid grid-cols-2 gap-2">
                {CALC_LABELS.slice(0, 8).map(([key, label, unit]) => (
                  <div key={key} className="rounded-lg bg-slate-950/50 border border-slate-800/40 p-2">
                    <div className="text-[10px] text-slate-500">{label}</div>
                    <div className="text-xs text-slate-200 font-semibold">{previewCalcs[key]} {unit}</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3">RAG analysis ready — click Add Tree to store permanently in MongoDB.</p>
            </div>
          )}
        </div>
      </div>

      {/* FULL CALCULATOR RESULTS SECTION */}
      {calculatedResult && (
        <div ref={calculatorRef} className="glass-panel p-6 md:p-8 border-slate-800/60 space-y-6 scroll-mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Calculated Results
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {calculatedResult.species_name}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-1">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Ecological Impact & Allometric Analysis
              </h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowConservation(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all"
              >
                Why not to cut this tree
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!canAddTree || busy}
                onClick={handleAddTree}
                className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title={!gpsValid ? 'Please capture the tree location on the map before saving.' : undefined}
              >
                <Save className="w-4 h-4" />
                Save to Map & Inventory
              </button>
            </div>
          </div>

          <ResultCard result={calculatedResult} />

          <div className="pt-4 border-t border-slate-800/60 flex flex-wrap justify-between items-center gap-4">
            <p className="text-xs text-slate-400">
              {!gpsValid
                ? '⚠️ Capture GPS on the map above to permanently save this tree record to MongoDB and the live map.'
                : '✅ Location verified. Ready to register tree.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConservation(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all"
              >
                Why not to cut this tree
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!canAddTree || busy}
                onClick={handleAddTree}
                className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                Save Tree to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-5 border-slate-800/50">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Registered Trees ({trees.length})</h3>
        {trees.length === 0 ? (
          <p className="text-xs text-slate-500">No MongoDB trees yet. Complete the workflow above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Species</th>
                  <th className="py-2 pr-3">GPS</th>
                  <th className="py-2 pr-3">Health</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trees.map((t) => (
                  <tr key={t._id} className="border-b border-slate-900/80 text-slate-300">
                    <td className="py-2 pr-3 font-mono">{t.treeId}</td>
                    <td className="py-2 pr-3">{t.treeName}</td>
                    <td className="py-2 pr-3">{t.species}</td>
                    <td className="py-2 pr-3">{t.latitude}, {t.longitude}</td>
                    <td className="py-2 pr-3">{t.healthStatus}</td>
                    <td className="py-2 flex gap-2">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-800 text-teal-400" title="View Details" onClick={() => { setFocusAnalysis(false); setDetailsTree(t); }}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-800 text-indigo-400" title="Analysis" onClick={() => { setFocusAnalysis(true); setDetailsTree(t); }}>
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-red-400"
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
