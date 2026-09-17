import React, { useMemo, useState } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  Save,
  MapPin,
  Crosshair,
  Loader2,
  CheckCircle2,
  Leaf,
} from 'lucide-react';
import { registeredTreeApi } from '../services/api';
import { PrintReportButton } from './TreeReportPrint';

function parseJson(raw, fallback = {}) {
  try {
    if (raw && typeof raw === 'string' && raw.trim().startsWith('{')) {
      return JSON.parse(raw);
    }
    if (raw && typeof raw === 'object') return raw;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Pull every “do not cut” / conservation reason from calculator RAG analysis. */
export function extractDoNotCutPoints(result) {
  const climate = parseJson(result?.summary, {});
  const medicinal = parseJson(result?.medicinal_impact, {});
  const habitat = parseJson(result?.habitat_support, {});
  const points = [];

  Object.entries(climate).forEach(([key, section]) => {
    if (!section || typeof section !== 'object' || key === 'research_pipeline') return;
    if (section.conservation_message) {
      points.push({
        id: `cons-${key}`,
        title: section.title || key.replace(/_/g, ' '),
        highlight: section.conservation_message,
        support: section.interesting_fact || section.importance || '',
        kind: 'conservation',
      });
    }
  });

  if (result?.carbon != null) {
    points.push({
      id: 'metric-carbon',
      title: 'Carbon vault at risk',
      highlight: `Do not cut this tree — it currently stores ~${Number(result.carbon).toFixed(1)} kg of carbon (~${Number(result.co2).toFixed(1)} kg CO₂ equivalent). Felling releases this climate benefit.`,
      support: `Estimated age ${Number(result.age).toFixed(1)} years · biomass ${Number(result.biomass).toFixed(1)} kg`,
      kind: 'metric',
    });
  }
  if (result?.oxygen != null) {
    points.push({
      id: 'metric-oxygen',
      title: 'Oxygen & air quality',
      highlight: `Do not cut this tree — it has contributed ~${Number(result.oxygen).toFixed(1)} kg of oxygen. Removing it cuts a living air-support system for the neighbourhood.`,
      support: '',
      kind: 'metric',
    });
  }
  if (habitat?.description) {
    points.push({
      id: 'habitat',
      title: 'Wildlife habitat',
      highlight: `Do not cut this tree — it supports local biodiversity. ${habitat.description}`,
      support: [
        ...(habitat.birds || []).slice(0, 3),
        ...(habitat.insects || []).slice(0, 2),
      ].join(' · '),
      kind: 'habitat',
    });
  }
  if (medicinal?.description) {
    points.push({
      id: 'medicinal',
      title: 'Medicinal & community value',
      highlight: `Do not cut this tree — it carries medicinal / traditional value. ${medicinal.description}`,
      support: (medicinal.applications || []).slice(0, 3).join(' · '),
      kind: 'medicinal',
    });
  }

  // Deduplicate near-identical highlights
  const seen = new Set();
  return points.filter((p) => {
    const k = p.highlight.slice(0, 80);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildCalculationsFromResult(result) {
  const agb = Number(result.biomass) || 0;
  const bgb = agb * 0.26;
  const total = agb + bgb;
  const carbon = Number(result.carbon) || total * 0.47;
  const co2 = Number(result.co2) || carbon * 3.67;
  const oxygen = Number(result.oxygen) || carbon * 2.67;
  const age = Number(result.age) || 1;
  const crown = Math.max(1.2, Math.min(Number(result.height) * 0.55, (Number(result.dbh) || 10) / 10 + 2));
  const canopyArea = Math.PI * (crown / 2) ** 2;
  return {
    aboveGroundBiomass: Number(agb.toFixed(2)),
    belowGroundBiomass: Number(bgb.toFixed(2)),
    totalBiomass: Number(total.toFixed(2)),
    carbonStorage: Number(carbon.toFixed(2)),
    co2Sequestration: Number(co2.toFixed(2)),
    annualCo2Absorption: Number((co2 / Math.max(age, 0.1)).toFixed(2)),
    oxygenReleased: Number(oxygen.toFixed(2)),
    canopyArea: Number(canopyArea.toFixed(2)),
    canopyCoverage: Number(Math.min(100, canopyArea).toFixed(2)),
    shadeArea: Number((canopyArea * 0.85).toFixed(2)),
    airPollutionRemoval: Number((canopyArea * 0.012).toFixed(2)),
    pm25Reduction: Number((canopyArea * 0.012 * 0.18).toFixed(2)),
    rainwaterInterception: Number((canopyArea * 8.5).toFixed(2)),
    coolingEffect: Number((canopyArea * 0.35).toFixed(2)),
    heatIslandReduction: Number(Math.min(100, canopyArea * 1.8 + Math.min(age, 25)).toFixed(2)),
    soilStabilizationScore: Number(Math.min(100, 35 + Math.min(Number(result.dbh) || 0, 80) * 0.4 + Math.min(age, 30)).toFixed(2)),
    dbh: Number(result.dbh),
    age: Number(age.toFixed(1)),
    gbh: Number(result.gbh),
    height: Number(result.height),
    crownDiameter: Number(crown.toFixed(2)),
  };
}

function buildClimaticAnalysisFromResult(result, points) {
  const climate = parseJson(result.summary, {});
  const medicinal = parseJson(result.medicinal_impact, {});
  const habitat = parseJson(result.habitat_support, {});
  return {
    generalDescription: {
      speciesOverview: climate.identification?.scientific_explanation || `${result.species_name} inventory record`,
      habitat: climate.habitat?.scientific_explanation || habitat.description || '',
      nativeRegion: climate.distribution?.scientific_explanation || '',
      growthCharacteristics: climate.description?.scientific_explanation || '',
    },
    climaticImpact: {
      carbonSequestration: `Carbon ≈ ${result.carbon} kg · CO₂ ≈ ${result.co2} kg`,
      oxygenProduction: `Oxygen ≈ ${result.oxygen} kg`,
      coolingEffect: climate.climate_impact?.scientific_explanation || '',
      urbanClimateBenefits: climate.ecological_importance?.importance || '',
      heatIslandReduction: climate.climate_impact?.conservation_message || '',
    },
    biodiversity: {
      birdNestingSuitability: (habitat.birds || []).join(', '),
      pollinatorSupport: climate.pollinators?.scientific_explanation || '',
      butterflyHabitat: '',
      beeAttraction: '',
      foodSource: habitat.description || '',
      wildlifeSupport: (habitat.mammals || []).join(', '),
      birds: habitat.birds || [],
      insects: habitat.insects || [],
      mammals: habitat.mammals || [],
      description: habitat.description || '',
    },
    canopyAnalysis: {
      shadeQuality: climate.climate_impact?.scientific_explanation || '',
      leafDensity: climate.description?.short_description || '',
      canopySpread: `Height ${result.height} m · DBH ${Number(result.dbh).toFixed(1)} cm`,
      rainInterception: climate.ecological_importance?.interesting_fact || '',
      microclimateImprovement: climate.climate_impact?.importance || '',
    },
    medicinalValue: {
      leaves: '',
      bark: '',
      flowers: '',
      fruits: '',
      roots: '',
      seeds: '',
      traditionalUses: medicinal.description || '',
      compounds: medicinal.compounds || [],
      applications: medicinal.applications || [],
      diseases: medicinal.diseases || [],
    },
    culturalImportance: {
      religiousSignificance: climate.cultural_spirituality?.scientific_explanation || '',
      sacredValue: climate.cultural_spirituality?.interesting_fact || '',
      culturalImportance: climate.cultural_spirituality?.importance || '',
      traditionalPlantingPractices: climate.cultural_spirituality?.real_world_example || '',
    },
    pollutionControl: {
      dustTrapping: '',
      airPurification: '',
      carbonCapture: `CO₂ sequestered ≈ ${result.co2} kg`,
      noiseReduction: '',
    },
    climateResilience: {
      heatTolerance: climate.climate_preference?.scientific_explanation || '',
      droughtResistance: climate.soil?.scientific_explanation || '',
      floodTolerance: '',
      windResistance: '',
    },
    conservationStatus: {
      nativeOrExotic: climate.distribution?.short_description || '',
      invasivePotential: '',
      conservationImportance: climate.conservation_status?.scientific_explanation || '',
    },
    maintenance: {
      waterRequirement: climate.climate_preference?.importance || '',
      fertilizerRecommendation: climate.soil?.importance || '',
      pruningSchedule: 'Inspect and prune dead wood seasonally.',
      diseaseMonitoring: climate.diseases_pests?.scientific_explanation || '',
    },
    doNotCutReasons: points,
    sourceClimatePack: climate,
    researchPipeline: climate.research_pipeline || [],
  };
}

export default function ConserveTreePage({ result, onBack, onSaved, onError }) {
  const points = useMemo(() => extractDoNotCutPoints(result), [result]);
  const [latitude, setLatitude] = useState(
    result?.latitude != null ? String(result.latitude) : ''
  );
  const [longitude, setLongitude] = useState(
    result?.longitude != null ? String(result.longitude) : ''
  );
  const [treeName, setTreeName] = useState(result?.species_name || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const gpsOk =
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 &&
    Number(latitude) <= 90 &&
    Number(longitude) >= -180 &&
    Number(longitude) <= 180;

  const captureGps = () => {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      () => onError?.('Unable to get GPS. Enter coordinates manually.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!gpsOk) {
      onError?.('Please capture the tree location before saving.');
      return;
    }
    setSaving(true);
    setSavedMsg('');
    try {
      const calculations = buildCalculationsFromResult(result);
      const climaticAnalysis = buildClimaticAnalysisFromResult(result, points);
      const fd = new FormData();
      fd.append('species', result.species_name);
      fd.append('treeName', treeName || result.species_name);
      fd.append('commonName', result.species_name);
      fd.append('gbh', String(result.gbh));
      fd.append('height', String(result.height));
      fd.append('age', String(result.age));
      fd.append('latitude', String(latitude));
      fd.append('longitude', String(longitude));
      fd.append('healthStatus', 'Healthy');
      fd.append('calculationsJson', JSON.stringify(calculations));
      fd.append('climaticAnalysisJson', JSON.stringify(climaticAnalysis));
      fd.append('analysisSource', 'calculator-rag');

      const saved = await registeredTreeApi.create(fd);
      setSavedMsg(`Saved ${saved.treeId} to MongoDB. Opening map…`);
      onSaved?.(saved);
    } catch (e) {
      onError?.(e.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!result) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6 border-amber-500/30 bg-amber-950/10">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to analysis
        </button>
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100">
              Why you should <span className="text-red-400">not cut</span> this {result.species_name}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Age ~{Number(result.age).toFixed(1)} yr · DBH {Number(result.dbh).toFixed(1)} cm · Carbon{' '}
              {Number(result.carbon).toFixed(1)} kg — reasons below are taken from this tree’s climatic analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {points.map((p, i) => (
          <div
            key={p.id}
            className="glass-panel p-5 border-l-4 border-l-red-500 border-red-500/20 bg-gradient-to-r from-red-950/25 to-transparent"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-red-500/20 text-red-300">
                Do not cut · {i + 1}
              </span>
              <span className="text-xs font-bold text-slate-300 capitalize">{p.title}</span>
            </div>
            <p className="text-sm text-red-100 font-semibold leading-relaxed highlight-protect">
              {p.highlight}
            </p>
            {p.support && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed flex gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                {p.support}
              </p>
            )}
          </div>
        ))}
        {points.length === 0 && (
          <p className="text-sm text-slate-400">No conservation messages found in analysis.</p>
        )}
      </div>

      <div className="glass-panel p-6 border-slate-800/50 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          Confirm GPS then save to MongoDB
        </h3>
        <label className="text-xs text-slate-400 block space-y-1">
          <span>Tree name</span>
          <input
            className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-slate-200"
            value={treeName}
            onChange={(e) => setTreeName(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-slate-400 space-y-1">
            <span>Latitude *</span>
            <input
              className={`w-full rounded-xl bg-slate-950/60 border px-3 py-2 text-slate-200 ${gpsOk ? 'border-slate-800' : 'border-red-500/50'}`}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Longitude *</span>
            <input
              className={`w-full rounded-xl bg-slate-950/60 border px-3 py-2 text-slate-200 ${gpsOk ? 'border-slate-800' : 'border-red-500/50'}`}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </label>
        </div>
        {!gpsOk && (
          <p className="text-xs text-red-400">Please capture the tree location before saving.</p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={captureGps}
            className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-amber-500/15 text-amber-200 border border-amber-500/30"
          >
            <Crosshair className="w-4 h-4" />
            Use current location
          </button>
          <button
            type="button"
            disabled={!gpsOk || saving}
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save tree to MongoDB
          </button>
          <PrintReportButton
            result={{ ...result, latitude: gpsOk ? Number(latitude) : result.latitude, longitude: gpsOk ? Number(longitude) : result.longitude }}
            doNotCutPoints={points}
          />
        </div>
        {savedMsg && (
          <p className="text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {savedMsg}
          </p>
        )}
      </div>
    </div>
  );
}
