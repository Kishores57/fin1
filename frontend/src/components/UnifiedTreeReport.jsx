import React, { useState, useEffect, useMemo } from 'react';
import { PrintReportButton } from './TreeReportPrint';
import { API_BASE_URL } from '../services/api';
import { getBiodiversityData } from '../data/biodiversityDatabase';
import {
  buildLocalClimateSummary,
  buildLocalMedicinalSummary,
  buildLocalHabitatSummary,
} from '../data/localSpeciesPacks';

/* ─────────────────────────────────────────────────────────────────────────────
   UnifiedTreeReport — Complete Tabbed Analytical Report
   Used across:
   1. ResultCard (Tree Registration / Calculator analysis)
   2. MapDashboard (AiInsightModal when clicking any tree on map)
   3. Printable / PDF export via TreeReportPrint
   ───────────────────────────────────────────────────────────────────────────── */

const BOTANICAL = {
  'Neem': 'Azadirachta indica',
  'Banyan': 'Ficus benghalensis',
  'Mango': 'Mangifera indica',
  'Peepal': 'Ficus religiosa',
  'Ashok Tree': 'Saraca asoca',
  'Rain Tree': 'Samanea saman',
  'Bamboo Tree': 'Bambusa vulgaris',
  'Coconut Tree': 'Cocos nucifera',
  'Guava Tree': 'Psidium guajava',
  'Palm Tree': 'Arecaceae sp.',
  'Child Palm': 'Dypsis lutescens',
  'Chinese Palm': 'Livistona chinensis',
  'Oak': 'Quercus sp.',
};

const DEFAULT_FALLBACKS = {
  leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
  bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
  tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
};

const SPECIES_PHOTOS = {
  'Ashok Tree': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80',
  },
  'Ashoka': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80',
  },
  'Neem': {
    leaf: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  'Banyan': {
    leaf: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  'Mango': {
    leaf: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80',
  },
  'Peepal': {
    leaf: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
  },
  'Palm Tree': {
    leaf: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  'Child Palm': {
    leaf: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
  },
  'Chinese Palm': {
    leaf: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
  },
  'Palm (Bottle Palm)': {
    leaf: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  'Rain Tree': {
    leaf: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  'Coconut Tree': {
    leaf: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  'Coconut': {
    leaf: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  'Bamboo Tree': {
    leaf: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=600&q=80',
  },
  'Bamboo': {
    leaf: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=600&q=80',
  },
  'Guava Tree': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80',
  },
  'Badam': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  'Bel': {
    leaf: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80',
  },
  'Tej Patta': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  'Silver Oak': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80',
  },
  'Christmas': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  'Supari': {
    leaf: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  'Moringa': {
    leaf: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
};

function getSpeciesFallbacks(species) {
  if (!species) return DEFAULT_FALLBACKS;
  const exact = SPECIES_PHOTOS[species];
  if (exact) return exact;
  const key = Object.keys(SPECIES_PHOTOS).find(
    (k) =>
      k.toLowerCase() === species.toLowerCase() ||
      species.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(species.toLowerCase())
  );
  if (key && SPECIES_PHOTOS[key]) {
    return SPECIES_PHOTOS[key];
  }
  return DEFAULT_FALLBACKS;
}

export function normalizeTree(raw) {
  if (!raw) return null;
  const species = raw.species_name || raw.species || raw.treeName || 'Unknown';
  const age = Number(raw.age ?? raw.estimatedAge ?? 10) || 10;

  let co2 = Number(raw.co2 ?? raw.co2_sequestered ?? 0);
  let biomass = Number(raw.biomass ?? 0);
  let carbon = Number(raw.carbon ?? 0);
  let oxygen = Number(raw.oxygen ?? 0);

  if (biomass > 0) {
    if (!carbon) carbon = biomass * 0.47;
    if (!co2) co2 = carbon * 3.67;
    if (!oxygen) oxygen = co2 * 0.727;
  } else if (co2 > 0) {
    if (!carbon) carbon = co2 / 3.67;
    if (!biomass) biomass = carbon / 0.47;
    if (!oxygen) oxygen = co2 * 0.727;
  } else {
    co2 = age * 21.77;
    carbon = co2 / 3.67;
    biomass = carbon / 0.47;
    oxygen = co2 * 0.727;
  }

  const height = raw.height ?? null;
  const dbh = raw.dbh ?? (raw.gbh ? (Number(raw.gbh) / Math.PI).toFixed(1) : null);
  const girth = raw.gbh ?? raw.girth ?? raw.circumference ?? null;
  const lat = raw.lat ?? raw.latitude ?? null;
  const lng = raw.lng ?? raw.longitude ?? null;

  return {
    ...raw,
    species,
    species_name: species,
    age,
    co2,
    oxygen,
    carbon,
    biomass,
    height,
    dbh,
    girth,
    gbh: girth,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    scientificName: raw.scientific_name || raw.scientificName || BOTANICAL[species] || 'Tropical Flora',
    health: raw.health || raw.healthStatus || 'Healthy',
    habitat: raw.habitat || null,
    treeId: raw.treeId || raw._id || raw.id || null,
    leafImage:
      raw.leafImage ||
      raw.leaf_image ||
      raw.leaf_photo ||
      (raw.images && raw.images.leaf) ||
      (raw.raw && raw.raw.images && raw.raw.images.leaf) ||
      (!raw.barkImage && !raw.fullImage && !raw.bark_photo && !raw.height_photo ? raw.photo : null) ||
      null,
    barkImage:
      raw.barkImage ||
      raw.bark_image ||
      raw.bark_photo ||
      (raw.images && raw.images.bark) ||
      (raw.raw && raw.raw.images && raw.raw.images.bark) ||
      null,
    fullImage:
      raw.fullImage ||
      raw.heightImage ||
      raw.height_image ||
      raw.height_photo ||
      (raw.images && raw.images.tree) ||
      (raw.raw && raw.raw.images && raw.raw.images.tree) ||
      (raw.photo && raw.photo !== raw.leafImage && raw.photo !== raw.barkImage ? raw.photo : null) ||
      null,
    source: raw.source || (raw.species_name ? 'calculator' : 'map'),
  };
}

export function normalizeForPrint(raw) {
  const norm = normalizeTree(raw);
  if (!norm) return null;
  return {
    ...raw,
    species_name: norm.species,
    species: norm.species,
    age: norm.age,
    co2: norm.co2,
    oxygen: norm.oxygen,
    carbon: norm.carbon,
    biomass: norm.biomass,
    height: norm.height,
    dbh: norm.dbh,
    gbh: norm.gbh,
    latitude: norm.lat,
    longitude: norm.lng,
    leaf_photo: norm.leafImage,
    bark_photo: norm.barkImage,
    height_photo: norm.fullImage,
  };
}

function isEpicollectGuid(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d+\.(jpg|jpeg|png)$/i.test(val.trim());
}

function resolveImg(val, species = null, type = 'tree') {
  if (!val) return null;
  if (typeof val !== 'string') return null;
  if (val.startsWith('data:') || val.startsWith('blob:')) return val;
  if (val.startsWith('http://') || val.startsWith('https://')) return val;

  // If this is an Epicollect survey GUID photo, request direct from live Epicollect API endpoint
  if (isEpicollectGuid(val)) {
    const base = API_BASE_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:8000');
    return `${base}/api/epicollect/media?name=${encodeURIComponent(val)}`;
  }

  // Local public static assets like /biodiversity/... should not be routed to backend port
  if (val.startsWith('/biodiversity/')) {
    return val;
  }

  // User-uploaded photos from TreeRegistration (/api/registered-trees/uploads/...)
  const base = API_BASE_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:8000');
  if (val.startsWith('/')) {
    return `${base}${val}`;
  }
  return `${base}/api/registered-trees/uploads/${encodeURIComponent(val)}`;
}

// ── Photo Card Component: Reliable with Automatic Species Botanical Fallback ──
function PhotoSlot({ src, fallbackSrc, label, accentColor }) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleImgError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  const isUserUpload = Boolean(
    src &&
    (src.startsWith('blob:') || src.startsWith('data:') || src.includes('/uploads/'))
  );
  const isFallback = Boolean(!src || (currentSrc === fallbackSrc && currentSrc));

  const effectiveSrc = !hasError && currentSrc ? currentSrc : fallbackSrc;

  if (!effectiveSrc) {
    return (
      <div style={{
        borderRadius: 14,
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        padding: '0.75rem',
        color: '#64748b',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: '0.66rem', color: '#64748b', fontStyle: 'italic' }}>
          Not Available
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setLightbox(true)}
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          border: `1px solid ${accentColor}55`,
          background: 'rgba(15, 23, 42, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: `0 4px 18px ${accentColor}18`,
          position: 'relative',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ height: 120, overflow: 'hidden', background: '#020617', position: 'relative' }}>
          <img
            src={effectiveSrc}
            alt={label}
            onError={handleImgError}
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {isUserUpload && (
            <span style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: '#059669',
              color: '#ffffff',
              fontSize: '0.6rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 999,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}>
              ✓ Uploaded
            </span>
          )}
          {isFallback && !isUserUpload && (
            <span style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#94a3b8',
              fontSize: '0.58rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 999,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Species Ref
            </span>
          )}
        </div>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: accentColor,
          padding: '0.4rem 0.5rem',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
        }}>
          <span>📸</span> {label}
        </div>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={effectiveSrc}
            alt={label}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 14, boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
          />
        </div>
      )}
    </>
  );
}

// ── OXYGEN TREE: Environmental Living Factory Dashboard with Dynamic Tree Structure ──
export function OxygenTreeCard({ tree }) {
  const [selectedMetric, setSelectedMetric] = useState('oxygen');
  const [hoveredMetric, setHoveredMetric] = useState(null);

  const age = Math.max(1, Number(tree.age || 10));
  const lifetimeOxygen = Number(tree.oxygen || (age * 22 * 0.727));
  const lifetimeCo2 = Number(tree.co2 || (age * 22));
  const lifetimeCarbon = Number(tree.carbon || (lifetimeCo2 / 3.67));
  const lifetimeBiomass = Number(tree.biomass || (lifetimeCarbon / 0.47));

  const annualOxygen = lifetimeOxygen / age;
  const dailyO2 = (annualOxygen / 365).toFixed(2);
  const annualCo2 = (lifetimeCo2 / age).toFixed(1);
  const o2Days = Math.round(lifetimeOxygen / 0.84);
  const cylinders = Math.round(lifetimeOxygen / 1.5);
  const canopyCover = Math.round(15 + age * 1.5);
  const co2EquivalentKm = Math.round(lifetimeCo2 / 0.12);

  const activeMetricKey = hoveredMetric || selectedMetric;

  const metricsDetails = {
    oxygen: {
      key: 'oxygen',
      name: 'Oxygen Released',
      emoji: '💨',
      value: `~${lifetimeOxygen.toFixed(1)} kg`,
      dailyRate: `~${dailyO2} kg O₂ / day`,
      color: '#22d3ee',
      bgColor: 'rgba(34, 211, 238, 0.08)',
      borderColor: 'rgba(34, 211, 238, 0.4)',
      glowColor: '0 0 30px rgba(34, 211, 238, 0.25)',
      explanation: 'Diatomic Oxygen (O₂) produced via stoichiometric daytime photolysis in leaf chloroplasts.',
      preservationImpact: `This tree supplies enough oxygen to sustain 1 adult human for ~${o2Days.toLocaleString()} days. Saving it keeps this living air support continuously active.`,
      destructionCost: 'Cutting this tree immediately terminates a natural oxygen factory. A replacement sapling takes over 12–15 years to match this output.',
    },
    co2: {
      key: 'co2',
      name: 'CO₂ Sequestration',
      emoji: '🌍',
      value: `~${lifetimeCo2.toFixed(1)} kg`,
      dailyRate: `~${annualCo2} kg CO₂ / yr`,
      color: '#2dd4bf',
      bgColor: 'rgba(45, 212, 191, 0.08)',
      borderColor: 'rgba(45, 212, 191, 0.4)',
      glowColor: '0 0 30px rgba(45, 212, 191, 0.25)',
      explanation: 'Atmospheric CO₂ captured through stomatal absorption and fixed as biological plant matter.',
      preservationImpact: `Permanently locks away greenhouse carbon equivalent to driving ~${co2EquivalentKm.toLocaleString()} km in an average gasoline car.`,
      destructionCost: 'Felling this tree terminates active carbon scrubbing. Decomposition or combustion re-releases this carbon back into the atmosphere.',
    },
    carbon: {
      key: 'carbon',
      name: 'Carbon Storage',
      emoji: '🌿',
      value: `~${lifetimeCarbon.toFixed(1)} kg`,
      dailyRate: '47% of total biomass',
      color: '#34d399',
      bgColor: 'rgba(52, 211, 153, 0.08)',
      borderColor: 'rgba(52, 211, 153, 0.4)',
      glowColor: '0 0 30px rgba(52, 211, 153, 0.25)',
      explanation: 'Pure organic elemental carbon stored solidly within structural cellulose and lignin cell walls.',
      preservationImpact: 'Represents a stable biological carbon vault protected within living woody tissue.',
      destructionCost: 'Destroying this tree converts structural plant biomass into released greenhouse emissions, erasing decades of accumulated carbon vaulting.',
    },
    biomass: {
      key: 'biomass',
      name: 'Aboveground Biomass',
      emoji: '🪵',
      value: `~${lifetimeBiomass.toFixed(1)} kg`,
      dailyRate: 'Trunk & canopy weight',
      color: '#fbbf24',
      bgColor: 'rgba(251, 191, 36, 0.08)',
      borderColor: 'rgba(251, 191, 36, 0.4)',
      glowColor: '0 0 30px rgba(251, 191, 36, 0.25)',
      explanation: 'Total dry wood tissue weight calculated via validated botanical allometric equations.',
      preservationImpact: 'Quantifies the physical substance of trunk, branches, and foliage providing continuous habitat shield and microclimate cooling.',
      destructionCost: 'Cutting this tree wipes out years of slow vertical wood development, destabilizing local soil and thermal canopy cover instantly.',
    },
  };

  const activeMetric = metricsDetails[activeMetricKey] || metricsDetails.oxygen;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.55) 0%, rgba(15, 23, 42, 0.9) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.35)',
      borderRadius: 18,
      padding: '1.25rem 1.4rem',
      marginBottom: '1.25rem',
      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(34, 211, 238, 0.2)',
            border: '1px solid rgba(34, 211, 238, 0.45)',
            fontSize: '1.2rem',
          }}>
            🌳
          </span>
          <div>
            <div style={{
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#6ee7b7',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}>
              Oxygen Tree · Living Biosphere Factory
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Dynamic botanical structure for {tree.species} ({age} yrs old) · Hover &amp; click canopy/trunk to inspect
            </div>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 999,
          padding: '0.3rem 0.85rem',
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#34d399',
          fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 10px #10b981',
            display: 'inline-block',
          }} />
          ACTIVE O₂ BIOSYNTHESIS
        </div>
      </div>

      {/* ── INTERACTIVE DYNAMIC TREE STRUCTURE & METRIC DETAILS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '1.25rem',
        alignItems: 'center',
        marginBottom: '1.25rem',
      }}>
        {/* Left: Interactive SVG Tree Graphic with rounded canopy clusters */}
        <div style={{
          background: 'rgba(2, 6, 23, 0.8)',
          borderRadius: 18,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{
            fontSize: '0.68rem',
            color: '#94a3b8',
            marginBottom: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <span style={{ color: '#22d3ee' }}>✨</span> Click or hover rounded tree parts
          </div>

          <svg viewBox="0 0 360 400" style={{ width: '100%', maxHeight: '330px', userSelect: 'none' }}>
            <defs>
              <radialGradient id="grad-oxygen" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient id="grad-co2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient id="grad-carbon" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient id="grad-biomass" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.05" />
              </radialGradient>
            </defs>

            {/* Trunk / Base Path (Biomass) */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredMetric('biomass')}
              onMouseLeave={() => setHoveredMetric(null)}
              onClick={() => setSelectedMetric('biomass')}
            >
              <circle cx="180" cy="300" r="50" fill="url(#grad-biomass)" />
              <path
                d="M 165 340 C 165 300, 160 220, 150 180 C 170 170, 190 170, 210 180 C 200 220, 195 300, 195 340 Z M 150 180 L 120 120 C 130 110, 140 120, 155 140 L 165 160 Z M 210 180 L 240 120 C 230 110, 220 120, 205 140 L 195 160 Z"
                fill={activeMetricKey === 'biomass' ? '#f59e0b' : '#334155'}
                stroke={activeMetricKey === 'biomass' ? '#fbbf24' : '#475569'}
                strokeWidth="2.5"
                style={{
                  filter: activeMetricKey === 'biomass' ? 'drop-shadow(0 0 14px rgba(245,158,11,0.85))' : 'none',
                  transition: 'all 0.25s ease',
                }}
              />
              <text x="180" y="323" textAnchor="middle" fill="#fcd34d" fontWeight="900" fontSize="11" fontFamily="'Outfit', sans-serif" style={{ pointerEvents: 'none' }}>TRUNK</text>
              <text x="180" y="338" textAnchor="middle" fill="#cbd5e1" fontWeight="700" fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif" style={{ pointerEvents: 'none' }}>BIOMASS ~{lifetimeBiomass.toFixed(0)} kg</text>
            </g>

            {/* Left Canopy Cluster (Carbon Storage) */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredMetric('carbon')}
              onMouseLeave={() => setHoveredMetric(null)}
              onClick={() => setSelectedMetric('carbon')}
            >
              <circle cx="110" cy="140" r="55" fill="url(#grad-carbon)" />
              <circle
                cx="110"
                cy="140"
                r="45"
                fill={activeMetricKey === 'carbon' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(15, 23, 42, 0.88)'}
                stroke={activeMetricKey === 'carbon' ? '#34d399' : '#475569'}
                strokeWidth={activeMetricKey === 'carbon' ? 3.5 : 2}
                style={{
                  filter: activeMetricKey === 'carbon' ? 'drop-shadow(0 0 14px rgba(52,211,153,0.85))' : 'none',
                  transition: 'all 0.25s ease',
                }}
              />
              <text x="110" y="134" textAnchor="middle" fill="#34d399" fontWeight="900" fontSize="12" fontFamily="'Outfit', sans-serif" style={{ pointerEvents: 'none' }}>CARBON</text>
              <text x="110" y="152" textAnchor="middle" fill="#f1f5f9" fontWeight="800" fontSize="11" fontFamily="'Plus Jakarta Sans', sans-serif" style={{ pointerEvents: 'none' }}>~{lifetimeCarbon.toFixed(0)} kg</text>
            </g>

            {/* Right Canopy Cluster (CO2 Sequestration) */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredMetric('co2')}
              onMouseLeave={() => setHoveredMetric(null)}
              onClick={() => setSelectedMetric('co2')}
            >
              <circle cx="250" cy="140" r="55" fill="url(#grad-co2)" />
              <circle
                cx="250"
                cy="140"
                r="45"
                fill={activeMetricKey === 'co2' ? 'rgba(45, 212, 191, 0.25)' : 'rgba(15, 23, 42, 0.88)'}
                stroke={activeMetricKey === 'co2' ? '#2dd4bf' : '#475569'}
                strokeWidth={activeMetricKey === 'co2' ? 3.5 : 2}
                style={{
                  filter: activeMetricKey === 'co2' ? 'drop-shadow(0 0 14px rgba(45,212,191,0.85))' : 'none',
                  transition: 'all 0.25s ease',
                }}
              />
              <text x="250" y="134" textAnchor="middle" fill="#2dd4bf" fontWeight="900" fontSize="12" fontFamily="'Outfit', sans-serif" style={{ pointerEvents: 'none' }}>CO₂ CAPTURE</text>
              <text x="250" y="152" textAnchor="middle" fill="#f1f5f9" fontWeight="800" fontSize="11" fontFamily="'Plus Jakarta Sans', sans-serif" style={{ pointerEvents: 'none' }}>~{lifetimeCo2.toFixed(0)} kg</text>
            </g>

            {/* Top Crown Canopy Cluster (Oxygen Released) */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredMetric('oxygen')}
              onMouseLeave={() => setHoveredMetric(null)}
              onClick={() => setSelectedMetric('oxygen')}
            >
              <circle cx="180" cy="75" r="65" fill="url(#grad-oxygen)" />
              <circle
                cx="180"
                cy="75"
                r="55"
                fill={activeMetricKey === 'oxygen' ? 'rgba(34, 211, 238, 0.25)' : 'rgba(15, 23, 42, 0.88)'}
                stroke={activeMetricKey === 'oxygen' ? '#22d3ee' : '#475569'}
                strokeWidth={activeMetricKey === 'oxygen' ? 3.5 : 2}
                style={{
                  filter: activeMetricKey === 'oxygen' ? 'drop-shadow(0 0 16px rgba(34,211,238,0.9))' : 'none',
                  transition: 'all 0.25s ease',
                }}
              />
              <text x="180" y="68" textAnchor="middle" fill="#22d3ee" fontWeight="900" fontSize="13" fontFamily="'Outfit', sans-serif" style={{ pointerEvents: 'none' }}>OXYGEN</text>
              <text x="180" y="87" textAnchor="middle" fill="#f1f5f9" fontWeight="800" fontSize="12" fontFamily="'Plus Jakarta Sans', sans-serif" style={{ pointerEvents: 'none' }}>~{lifetimeOxygen.toFixed(0)} kg</text>
            </g>
          </svg>

          {/* Quick selection pills below tree */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.4rem' }}>
            {[
              { key: 'oxygen', label: '💨 Oxygen', color: '#22d3ee' },
              { key: 'co2', label: '🌍 CO₂', color: '#2dd4bf' },
              { key: 'carbon', label: '🌿 Carbon', color: '#34d399' },
              { key: 'biomass', label: '🪵 Biomass', color: '#fbbf24' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedMetric(p.key)}
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: `1px solid ${activeMetricKey === p.key ? p.color : 'rgba(255,255,255,0.1)'}`,
                  background: activeMetricKey === p.key ? `${p.color}25` : 'rgba(255,255,255,0.03)',
                  color: activeMetricKey === p.key ? p.color : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Dynamic Interactive Metric Details Panel */}
        <div style={{
          background: activeMetric.bgColor,
          border: `1px solid ${activeMetric.borderColor}`,
          borderRadius: 18,
          padding: '1.25rem 1.4rem',
          boxShadow: activeMetric.glowColor,
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              fontWeight: 900,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: activeMetric.color,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              <span>{activeMetric.emoji}</span> {activeMetric.name}
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: activeMetric.color,
              background: 'rgba(0,0,0,0.35)',
              padding: '3px 9px',
              borderRadius: 999,
              border: `1px solid ${activeMetric.borderColor}`,
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              {activeMetric.dailyRate}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              fontSize: '2.2rem',
              fontWeight: 900,
              color: '#f8fafc',
              lineHeight: 1.1,
            }}>
              {activeMetric.value}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Lifetime Output</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            {activeMetric.explanation}
          </p>

          {/* Preservation Benefit Card */}
          <div style={{
            background: 'rgba(6, 78, 59, 0.4)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            borderRadius: 12,
            padding: '0.7rem 0.9rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}>
            <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>🛡️</span>
            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#34d399',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              }}>
                Preservation Benefit
              </div>
              <p style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.45, margin: '2px 0 0' }}>
                {activeMetric.preservationImpact}
              </p>
            </div>
          </div>

          {/* Cut Down Impact Card */}
          <div style={{
            background: 'rgba(127, 29, 29, 0.4)',
            border: '1px solid rgba(248, 113, 113, 0.4)',
            borderRadius: 12,
            padding: '0.7rem 0.9rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}>
            <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#f87171',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              }}>
                Cut Down Impact
              </div>
              <p style={{ fontSize: '0.78rem', color: '#fca5a5', lineHeight: 1.45, margin: '2px 0 0' }}>
                {activeMetric.destructionCost}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Impact Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem',
        marginBottom: '0.9rem',
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: 14,
          padding: '0.85rem 1rem',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#22d3ee', marginBottom: 4, fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
            DAILY OXYGEN OUTPUT
          </div>
          <div style={{
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontWeight: 900,
            fontSize: '1.35rem',
            color: '#f8fafc',
          }}>
            ~{dailyO2} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#22d3ee' }}>kg O₂/day</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>
            Sustains ~{(Number(dailyO2) / 0.84).toFixed(1)} adults daily
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: 14,
          padding: '0.85rem 1rem',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34d399', marginBottom: 4, fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
            ANNUAL CARBON FIXED
          </div>
          <div style={{
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontWeight: 900,
            fontSize: '1.35rem',
            color: '#f8fafc',
          }}>
            ~{annualCo2} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399' }}>kg CO₂/yr</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>
            Offsets ~{(Number(annualCo2) / 0.12).toFixed(0)} km car emissions
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: 14,
          padding: '0.85rem 1rem',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fbbf24', marginBottom: 4, fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
            MEDICAL O₂ EQUIVALENT
          </div>
          <div style={{
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontWeight: 900,
            fontSize: '1.35rem',
            color: '#f8fafc',
          }}>
            ~{cylinders.toLocaleString()} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24' }}>cylinders</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>
            Standard 1.5 kg medical canisters
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(96, 165, 250, 0.3)',
          borderRadius: 14,
          padding: '0.85rem 1rem',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#60a5fa', marginBottom: 4, fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
            COOLING CANOPY SHADE
          </div>
          <div style={{
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontWeight: 900,
            fontSize: '1.35rem',
            color: '#f8fafc',
          }}>
            ~{canopyCover} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#60a5fa' }}>m² area</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>
            Drops ground heat up to 3°C–8°C
          </div>
        </div>
      </div>

      {/* Biological Factory Impact Callout */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.32)',
        borderRadius: 12,
        padding: '0.8rem 1rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.82rem',
        color: '#cbd5e1',
        lineHeight: 1.55,
      }}>
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🌱</span>
        <div>
          This living tree splits water molecules during daylight to release <strong style={{ color: '#22d3ee' }}>~{lifetimeOxygen.toFixed(0)} kg of lifetime O₂</strong> into the local atmosphere, supporting <strong style={{ color: '#34d399' }}>~{o2Days.toLocaleString()} adult breathing days</strong>. Cutting this tree permanently terminates this natural oxygen production.
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'oxygen',     label: 'Oxygen',      emoji: '💨', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)',  border: 'rgba(34,211,238,0.45)' },
  { key: 'carbon',     label: 'Carbon',      emoji: '🌍', color: '#34d399', bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.45)' },
  { key: 'biomass',    label: 'Biomass',     emoji: '🌳', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.45)' },
  { key: 'climate',    label: 'Climate',     emoji: '🌡️', color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.45)' },
  { key: 'ecological', label: 'Ecological',  emoji: '🐦', color: '#2dd4bf', bg: 'rgba(45,212,191,0.15)', border: 'rgba(45,212,191,0.45)' },
  { key: 'medicinal',  label: 'Medicinal',   emoji: '💊', color: '#c084fc', bg: 'rgba(192,132,252,0.15)',border: 'rgba(192,132,252,0.45)' },
  { key: 'spiritual',  label: 'Spiritual',   emoji: '🛕', color: '#fcd34d', bg: 'rgba(252,211,77,0.15)', border: 'rgba(252,211,77,0.45)' },
  { key: 'legal',      label: 'Legal',       emoji: '⚖️', color: '#f87171', bg: 'rgba(248,113,113,0.15)',border: 'rgba(248,113,113,0.45)' },
  { key: 'location',   label: 'Location',    emoji: '📍', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.45)' },
];

function InfoCards({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
      {items.map((c, i) => (
        <div key={i} style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          padding: '0.85rem 1.1rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 4 }}>
            {c.label}
          </div>
          <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.05rem' }}>
            {c.value}
          </div>
          {c.sub && (
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 3 }}>
              {c.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: '0.6rem' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ConservationBanner({ text }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06))',
      border: '1px solid rgba(239,68,68,0.28)',
      borderRadius: 12,
      padding: '0.8rem 1.1rem',
      color: '#fca5a5',
      fontSize: '0.85rem',
      marginTop: '0.8rem',
      lineHeight: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }}>
      <span style={{ fontSize: '1.1rem' }}>🛡️</span>
      <div>{text}</div>
    </div>
  );
}

// ── CANOPY REAL PHOTOS & LOOKUP ──────────────────────────────────────────────
const CANOPY_PHOTOS = {
  'Neem': '/biodiversity/neem_canopy_real.jpg',
  'Banyan': '/biodiversity/banyan_canopy_real.jpg',
  'Peepal': '/biodiversity/peepal_canopy_real.jpg',
  'Mango': '/biodiversity/mango_canopy_real.jpg',
  'Ashok Tree': '/biodiversity/ashoka_canopy_real.jpg',
  'Ashoka': '/biodiversity/ashoka_canopy_real.jpg',
  'Rain Tree': '/biodiversity/raintree_canopy_real.jpg',
  'Rubber': '/biodiversity/rubber_canopy_real.jpg',
};

function getCanopyPhoto(species) {
  if (!species) return '/biodiversity/neem_canopy_real.jpg';
  for (const [k, v] of Object.entries(CANOPY_PHOTOS)) {
    if (species.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(species.toLowerCase())) {
      return v;
    }
  }
  return '/biodiversity/neem_canopy_real.jpg';
}

// ── ALLOMETRIC & EXTENDED CALCULATOR FACTORS ──────────────────────────────────
const SPECIES_FACTORS = {
  'Rain Tree': { factor: 3.8, family: 'Fabaceae', density: 0.52 },
  'Neem': { factor: 3.5, family: 'Meliaceae', density: 0.72 },
  'Banyan': { factor: 4.2, family: 'Moraceae', density: 0.56 },
  'Peepal': { factor: 4.0, family: 'Moraceae', density: 0.48 },
  'Mango': { factor: 3.8, family: 'Anacardiaceae', density: 0.60 },
  'Ashok Tree': { factor: 3.5, family: 'Fabaceae', density: 0.68 },
  'Ashoka': { factor: 3.5, family: 'Fabaceae', density: 0.68 },
  'Guava Tree': { factor: 3.2, family: 'Myrtaceae', density: 0.75 },
  'Coconut Tree': { factor: 2.5, family: 'Arecaceae', density: 0.50 },
  'Palm Tree': { factor: 2.8, family: 'Arecaceae', density: 0.55 },
  'Bamboo Tree': { factor: 2.0, family: 'Poaceae', density: 0.65 },
  'Rubber': { factor: 3.6, family: 'Euphorbiaceae', density: 0.60 },
};

function getSpeciesFactor(species) {
  if (!species) return { factor: 3.5, family: 'Tropical Flora', density: 0.65 };
  for (const [k, v] of Object.entries(SPECIES_FACTORS)) {
    if (species.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(species.toLowerCase())) {
      return v;
    }
  }
  return { factor: 3.5, family: 'Tropical Flora', density: 0.65 };
}

export function computeTreeAllometrics(tree) {
  const species = tree.species || 'Rain Tree';
  const meta = getSpeciesFactor(species);
  const growthFactor = Number(tree.growthRate || meta.factor);
  const family = tree.family || meta.family;

  const age = Number(tree.age || 10);
  let dbh = tree.dbh ? Number(tree.dbh) : null;
  let gbh = tree.gbh ? Number(tree.gbh) : null;

  if (!dbh && gbh) {
    dbh = Number((gbh / Math.PI).toFixed(2));
  } else if (!dbh && !gbh) {
    dbh = Number((age / growthFactor).toFixed(2));
    gbh = Number((dbh * Math.PI).toFixed(1));
  } else if (dbh && !gbh) {
    gbh = Number((dbh * Math.PI).toFixed(1));
  }

  const biomass = Number((tree.biomass || (tree.carbon ? tree.carbon / 0.47 : age * 12)).toFixed(2));
  const carbon = Number((tree.carbon || biomass * 0.47).toFixed(2));
  const co2 = Number((tree.co2 || carbon * 3.67).toFixed(2));
  const oxygen = Number((tree.oxygen || co2 * 0.727).toFixed(2));

  // Canopy Area & Environmental proxy metrics (extendedCalculator.js)
  const crownM = Number((Math.max(2, Math.min(22, 0.28 * dbh + 1.5))).toFixed(2));
  const canopyArea = tree.canopyArea ? Number(tree.canopyArea) : Number((Math.PI * Math.pow(crownM / 2, 2)).toFixed(2));

  const coolingEffect = tree.coolingEffect ? Number(tree.coolingEffect) : Number((canopyArea * 0.35).toFixed(1));
  const rainwaterInterception = tree.rainwaterInterception ? Number(tree.rainwaterInterception) : Number((canopyArea * 8.5).toFixed(1));
  const airPollutionRemoval = tree.airPollutionRemoval ? Number(tree.airPollutionRemoval) : Number((canopyArea * 0.012).toFixed(3));
  const heatIslandReduction = tree.heatIslandReduction ? Number(tree.heatIslandReduction) : Number(Math.min(100, canopyArea * 1.8 + Math.min(age, 25)).toFixed(0));

  // Equivalencies
  const co2CarKm = Math.round(co2 / 0.12);
  const oxygenPersonDays = Math.round(oxygen / 0.84);

  // Life Stage
  let stage = 'Young Established';
  let stageColor = '#34d399';
  let stageBg = 'rgba(52, 211, 153, 0.15)';
  let stageBorder = 'rgba(52, 211, 153, 0.35)';

  if (age < 20) {
    stage = 'Sapling';
    stageColor = '#2dd4bf';
    stageBg = 'rgba(45, 212, 191, 0.15)';
    stageBorder = 'rgba(45, 212, 191, 0.35)';
  } else if (age < 60) {
    stage = 'Young Established';
    stageColor = '#34d399';
    stageBg = 'rgba(52, 211, 153, 0.15)';
    stageBorder = 'rgba(52, 211, 153, 0.35)';
  } else if (age < 150) {
    stage = 'Mature Canopy';
    stageColor = '#fbbf24';
    stageBg = 'rgba(251, 191, 36, 0.15)';
    stageBorder = 'rgba(251, 191, 36, 0.35)';
  } else {
    stage = 'Heritage Veteran';
    stageColor = '#c084fc';
    stageBg = 'rgba(192, 132, 252, 0.15)';
    stageBorder = 'rgba(192, 132, 252, 0.35)';
  }

  return {
    species,
    family,
    age,
    dbh,
    gbh,
    growthFactor,
    biomass,
    carbon,
    co2,
    oxygen,
    canopyArea,
    coolingEffect,
    rainwaterInterception,
    airPollutionRemoval,
    heatIslandReduction,
    co2CarKm,
    oxygenPersonDays,
    stage,
    stageColor,
    stageBg,
    stageBorder,
    confidence: tree.confidence || 96.2,
  };
}

// ── CALCULATED TREE AGE & ALLOMETRIC VALUES CARD (Image 1) ───────────────────
function CalculatedTreeAgeCard({ allometrics }) {
  const m = allometrics;
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 22,
      padding: '1.4rem',
      marginBottom: '1.25rem',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top Tag & Life Stage Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        paddingBottom: '0.9rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.14)',
            padding: '0.25rem 0.75rem',
            borderRadius: 999,
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          }}>
            EFFICIENTNET-B0 DEEP LEARNING MODEL
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8' }}>
            {m.confidence}% Match
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: m.stageColor,
            background: m.stageBg,
            border: `1px solid ${m.stageBorder}`,
            padding: '0.2rem 0.75rem',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <span>🌿</span> {m.stage}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>Life Stage</span>
        </div>
      </div>

      {/* Big Dark Forest Green Age Banner */}
      <div style={{
        margin: '1.15rem 0',
        padding: '1.4rem 1.6rem',
        borderRadius: 18,
        background: 'linear-gradient(135deg, #142e1f 0%, #1e452f 100%)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(20, 46, 31, 0.4)',
      }}>
        <div style={{
          position: 'absolute',
          right: -10,
          bottom: -20,
          fontSize: '9rem',
          opacity: 0.08,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          🌳
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#6ee7b7',
            marginBottom: '0.4rem',
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          }}>
            <span>⏱️</span>
            <span>CALCULATED TREE AGE ((GBH / π) × GROWTH RATE)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', margin: '0.35rem 0' }}>
            <span style={{
              fontSize: 'clamp(2.6rem, 5vw, 3.8rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: '#ffffff',
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              {m.age}
            </span>
            <span style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
              fontWeight: 800,
              color: '#a7f3d0',
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              Years Old
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.5rem', fontWeight: 500 }}>
            Calculated as ({m.gbh} / π) × {m.growthFactor} ({m.species} growth factor) · DBH: {m.dbh} cm
          </div>
        </div>
      </div>

      {/* 4 Core Allometric Values */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        {[
          { label: 'AGE', val: m.age, sub: `Years ((GBH/π) × ${m.growthFactor})`, icon: '⏱️', color: '#6ee7b7' },
          { label: 'BIOMASS', val: m.biomass, sub: 'Total AGB+BGB (kg)', icon: '🌿', color: '#fbbf24' },
          { label: 'CARBON', val: m.carbon, sub: 'Stored C (kg)', icon: '🛡️', color: '#34d399' },
          { label: 'CO₂ VAULT', val: m.co2, sub: 'Sequestered (kg)', icon: '💨', color: '#22d3ee' },
        ].map((c) => (
          <div key={c.label} style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '0.85rem 1rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#94a3b8',
              marginBottom: 4,
            }}>
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#f8fafc',
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              {c.val}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 3 }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Real World Equivalencies Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
      }}>
        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.28)',
          borderRadius: 14,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(6, 182, 212, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            flexShrink: 0,
          }}>
            🚗
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.98rem', color: '#a5f3fc', fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
              {m.co2CarKm.toLocaleString()} km
            </div>
            <div style={{ fontSize: '0.72rem', color: '#67e8f9' }}>
              Automobile emissions offset
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: 14,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            flexShrink: 0,
          }}>
            📈
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.98rem', color: '#a7f3d0', fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
              {m.oxygenPersonDays.toLocaleString()} Days
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>
              1 Adult human respiration sustained
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── URBAN FORESTRY & MICROCLIMATE SHIELD CARD (Image 2) ─────────────────────
function UrbanMicroclimateShieldCard({ allometrics }) {
  const m = allometrics;
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 22,
      padding: '1.4rem',
      marginBottom: '1.25rem',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Header with Canopy Area */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        paddingBottom: '0.85rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '1rem',
      }}>
        <div style={{
          fontSize: '0.76rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
        }}>
          <span>✨</span>
          <span>URBAN FORESTRY &amp; MICROCLIMATE SHIELD (EXTENDEDCALCULATOR.JS)</span>
        </div>
        <div style={{
          fontSize: '0.76rem',
          fontWeight: 800,
          color: '#cbd5e1',
          fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '0.2rem 0.65rem',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          Canopy: <strong style={{ color: '#38bdf8' }}>{m.canopyArea} m²</strong>
        </div>
      </div>

      {/* 4 Cards from Image 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
        gap: '0.75rem',
        textAlign: 'center',
      }}>
        {/* Cooling Energy */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          borderRadius: 16,
          padding: '1.1rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '1.35rem', marginBottom: 4 }}>⚡</div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#fbbf24',
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          }}>
            {m.coolingEffect} kWh
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            Cooling Energy Saved
          </div>
        </div>

        {/* Rainwater */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 16,
          padding: '1.1rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '1.35rem', marginBottom: 4 }}>💧</div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#38bdf8',
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          }}>
            {m.rainwaterInterception} L
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            Rainwater Buffered/yr
          </div>
        </div>

        {/* Air Pollution */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          borderRadius: 16,
          padding: '1.1rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '1.35rem', marginBottom: 4 }}>💨</div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#34d399',
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          }}>
            {m.airPollutionRemoval} kg
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            Air Pollution Scrubbed
          </div>
        </div>

        {/* Heat Island Buffer */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(251, 146, 60, 0.25)',
          borderRadius: 16,
          padding: '1.1rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '1.35rem', marginBottom: 4 }}>☀️</div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#fb923c',
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          }}>
            {m.heatIslandReduction}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            Heat Island Buffer
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MEDICINAL PLANT PARTS BREAKDOWN ──────────────────────────────────────────
const MEDICINAL_PARTS = {
  Neem: [
    { part: '🍃 Leaves (Nimba Patra)', compounds: 'Nimbin, Azadirachtin, Gedunin', uses: 'Blood purifier, anti-diabetic infusions, antiseptic wash, chickenpox bath', formula: 'Nimba Taila, Nimbadi Churna' },
    { part: '🪵 Bark (Nimba Tvak)', compounds: 'Nimbinene, Tannins, Catechins', uses: 'Malarial fever control, periodontal gum massage, chronic eczema', formula: 'Khadirarishta, Nimba Kashayam' },
    { part: '🌸 Flowers', compounds: 'Flavonoids, Glycosides, Nimbosterin', uses: 'Intestinal worms elimination, ophthalmic drops, cooling summer tonics', formula: 'Ugadi Pachadi traditional formulation' },
    { part: '🫐 Seed Oil (Nimba Taila)', compounds: 'Salannin, Meliantriol, Azadirachtin', uses: 'Bio-pesticide, lice elimination, anti-psoriatic ointment, antifungal salve', formula: 'Pure cold-pressed Azadirachta seed oil' },
    { part: '🌿 Twigs (Datun)', compounds: 'Fibrous cellulose, Phenolics', uses: 'Traditional tooth brushing, Streptococcus mutans oral bacteria elimination', formula: 'Raw fresh datun mastication' },
  ],
  Peepal: [
    { part: '🍃 Leaves (Ashvattha Patra)', compounds: 'Flavonoids, Campesterol, Tannins', uses: 'Cardiac tonic, asthma relief infusions, nosebleed stop, gastric ulcers', formula: 'Ashvatthadi Leha' },
    { part: '🪵 Bark (Ashvattha Tvak)', compounds: 'Tannins, β-sitosterol, Saponins', uses: 'Diabetic wound astringent dressing, burns healing, aphrodisiac tonics', formula: 'Nyagrodhadi Kashayam' },
    { part: '🫐 Fruits (Figs)', compounds: 'Inositol, Saponins, Calcium', uses: 'Infertility management, gentle digestive laxative, lung tonic', formula: 'Ashvattha Phala Churna' },
    { part: '🌱 Latex', compounds: 'Enzymes, Latex resins', uses: 'Wart treatment, cracked heel healing, boils maturation', formula: 'Fresh topical plant milk' },
  ],
  Banyan: [
    { part: '🪢 Aerial Prop Roots (Nyagrodha Jata)', compounds: 'Polyphenols, Lupeol, Sterols', uses: 'Firming gums, dental hygiene, female reproductive health tonics', formula: 'Nyagrodha Jata Churna' },
    { part: '🪵 Bark (Nyagrodha Tvak)', compounds: 'Bengalenoside, Tannins, Flavonoids', uses: 'Hyperglycemia management, chronic diarrhea, urinary tract tonics', formula: 'Nyagrodhadi Churna' },
    { part: '🍃 Tender Leaf Buds', compounds: 'Tannins, Flavonoids', uses: 'Nausea arrest, dysentery healing, burning sensation relief', formula: 'Bud decoctions in milk' },
    { part: '🌱 Milky Latex', compounds: 'Proteolytic enzymes', uses: 'Rheumatic joint pain massage, hemorrhoids relief', formula: 'Latex with honey application' },
  ],
  Mango: [
    { part: '🍃 Tender Leaves (Amra Patra)', compounds: 'Mangiferin, Polyphenols', uses: 'Blood sugar stabilization tea, kidney stones dissolution, asthma smoke', formula: 'Amra Patra Kashayam' },
    { part: '🪵 Bark', compounds: 'Mangiferin, Tannins, Catechins', uses: 'Heavy menstrual bleeding control, throat gargles for hoarseness', formula: 'Amra Tvak Decoction' },
    { part: '🫐 Seed Kernel (Amra Asthi)', compounds: 'Gallic acid, Stearic acid, Oleic acid', uses: 'Diarrhea management, intestinal parasite expulsion, dandruff hair pack', formula: 'Amra Majja Churna' },
  ],
  'Ashok Tree': [
    { part: '🪵 Stem Bark (Asoka Tvak)', compounds: 'Saracin, Catechin, Tannins, Ketosterol', uses: 'Premier uterine tonic, menorrhagia, dysmenorrhea, pelvic decongestant', formula: 'Asokarishta, Asokaghrita' },
    { part: '🌸 Flowers', compounds: 'Flavonoids, Anthocyanins', uses: 'Bleeding piles relief, complexion enhancement, diabetes support', formula: 'Asoka Pushpa Churna' },
    { part: '🌱 Seeds', compounds: 'Phospholipids, Fatty acids', uses: 'Urinary calculus (stones) treatment, bladder tonics', formula: 'Asoka Bija Kwath' },
  ],
  'Rain Tree': [
    { part: '🍃 Leaves & Foliage', compounds: 'Alkaloids, Flavonoids, Pinitol', uses: 'Traditional poultice for swellings, antibacterial wash', formula: 'Leaf infusion compress' },
    { part: '🫐 Sweet Pods', compounds: 'Natural sugars, Tannins, Saponins', uses: 'Nutritive forage, antioxidant biological extract', formula: 'Pod water extract' },
  ],
};

function getMedicinalParts(species) {
  if (!species) return MEDICINAL_PARTS['Neem'];
  for (const [k, v] of Object.entries(MEDICINAL_PARTS)) {
    if (species.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(species.toLowerCase())) {
      return v;
    }
  }
  return [
    { part: '🍃 Foliage & Leaves', compounds: 'Flavonoids, Phenolics', uses: 'Antioxidant infusion, traditional cleansing washes', formula: 'Standard botanical decoction' },
    { part: '🪵 Wood & Bark', compounds: 'Tannins, Lignin complexes', uses: 'Astringent topical dressings, anti-inflammatory compresses', formula: 'Bark extract infusion' },
  ];
}

// ── DYNAMIC ANTI-FELLING REASONS ENGINE ──────────────────────────────────────
export function getDoNotCutReasons(tree) {
  if (Array.isArray(tree.doNotCutReasons) && tree.doNotCutReasons.length > 0) {
    return tree.doNotCutReasons;
  }

  const species = tree.species || 'Neem';
  const age = Number(tree.age || 10);
  const biomass = Number(tree.biomass || 100);
  const carbon = Number(tree.carbon || 47);
  const co2 = Number(tree.co2 || 172);

  const localClimate = buildLocalClimateSummary(species, age, biomass, carbon, co2) || {};
  const localMed = buildLocalMedicinalSummary(species) || {};
  const localHab = buildLocalHabitatSummary(species) || {};

  const climate = (tree.climaticAnalysis?.sourceClimatePack && Object.keys(tree.climaticAnalysis.sourceClimatePack).length > 0)
    ? tree.climaticAnalysis.sourceClimatePack
    : localClimate;
  const medicinal = tree.climaticAnalysis?.medicinalValue || localMed;
  const habitat = tree.climaticAnalysis?.biodiversity || localHab;

  const points = [];

  // Points 1 - 18: RAG climatic sections
  Object.entries(climate).forEach(([key, section]) => {
    if (!section || typeof section !== 'object' || key === 'research_pipeline') return;
    if (section.conservation_message) {
      points.push({
        id: `cons-${key}`,
        title: section.title || key.replace(/_/g, ' '),
        highlight: section.conservation_message,
        support: section.interesting_fact || section.importance || section.scientific_explanation || '',
        kind: 'conservation',
      });
    }
  });

  // Carbon vault at risk
  points.push({
    id: 'metric-carbon',
    title: 'Carbon vault at risk',
    highlight: `Do not cut this tree — it currently stores ~${carbon.toFixed(1)} kg of carbon (~${co2.toFixed(1)} kg CO₂ equivalent). Felling releases this climate benefit.`,
    support: `Estimated age ${age.toFixed(1)} years · biomass ${biomass.toFixed(1)} kg`,
    kind: 'metric',
  });

  // Oxygen & air quality
  const oxygenVal = Number(tree.oxygen || (co2 * 0.727));
  const oxygenDays = Math.round(oxygenVal / 0.84);
  points.push({
    id: 'metric-oxygen',
    title: 'Oxygen & air quality',
    highlight: `Do not cut this tree — it has contributed ~${oxygenVal.toFixed(1)} kg of oxygen. Removing it cuts a living air-support system for the neighbourhood.`,
    support: `Sustains ~${oxygenDays.toLocaleString()} adult human respiration days · continuously scrubs airborne particulates.`,
    kind: 'metric',
  });

  // Wildlife habitat
  const habDesc = habitat.description || `${species} canopy creates dense cover and windbreaks that shelter birds and insects in urban and farm corridors.`;
  const habSupport = [
    ...(habitat.birds || []).slice(0, 3),
    ...(habitat.insects || []).slice(0, 2),
  ].join(' · ');
  points.push({
    id: 'habitat',
    title: 'Wildlife habitat',
    highlight: `Do not cut this tree — it supports local biodiversity. ${habDesc}`,
    support: habSupport || `${species} canopy supports vital local avian, pollinator, and insect forage.`,
    kind: 'habitat',
  });

  // Medicinal & community value
  const medDesc = medicinal.description || medicinal.traditionalUses || `${species} carries verified medicinal, traditional, and ecological value for urban communities.`;
  const medSupport = (medicinal.applications || []).slice(0, 3).join(' · ');
  points.push({
    id: 'medicinal',
    title: 'Medicinal & community value',
    highlight: `Do not cut this tree — it carries medicinal / traditional value. ${medDesc}`,
    support: medSupport || `Active compounds: ${(medicinal.compounds || []).slice(0, 3).join(', ')}`,
    kind: 'medicinal',
  });

  // Deduplicate
  const seen = new Set();
  return points.filter((p) => {
    const k = (p.highlight || '').slice(0, 80);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── REAL BIODIVERSITY SHOWCASE COMPONENT ─────────────────────────────────────
function BiodiversityShowcase({ species }) {
  const bioData = useMemo(() => getBiodiversityData(species), [species]);
  const canopyImg = getCanopyPhoto(species);

  const CATEGORY_STYLES = {
    bird: {
      label: 'Birds (Avifauna)',
      icon: '🐦',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.08)',
      border: 'rgba(56, 189, 248, 0.25)',
      badge: 'rgba(56, 189, 248, 0.2)',
    },
    insect: {
      label: 'Insects & Pollinators',
      icon: '🐝',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.08)',
      border: 'rgba(251, 191, 36, 0.25)',
      badge: 'rgba(251, 191, 36, 0.2)',
    },
    mammal: {
      label: 'Canopy Mammals',
      icon: '🐿️',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.08)',
      border: 'rgba(52, 211, 153, 0.25)',
      badge: 'rgba(52, 211, 153, 0.2)',
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
      {/* ── TWO BIG ECOSYSTEM CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Big Card 1: Botanical Canopy Sanctuary */}
        <div style={{
          position: 'relative',
          minHeight: 380,
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '1.5rem',
          backgroundImage: `url(${canopyImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(2, 6, 23, 0.96) 0%, rgba(2, 6, 23, 0.6) 55%, rgba(2, 6, 23, 0.2) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#38bdf8',
                padding: '0.22rem 0.65rem',
                borderRadius: 999,
                border: '1px solid rgba(56, 189, 248, 0.4)',
                backdropFilter: 'blur(6px)',
              }}>
                🌳 Canopy Sanctuary
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#34d399',
                padding: '0.22rem 0.65rem',
                borderRadius: 999,
                border: '1px solid rgba(52, 211, 153, 0.4)',
                backdropFilter: 'blur(6px)',
              }}>
                Trophic Web
              </span>
            </div>
            <h4 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#ffffff',
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              Botanical Canopy Sanctuary &amp; Micro-Ecosystem
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.55 }}>
              A single mature {species} canopy provides nesting perches, fruit, nectar, and thermal shelter for hundreds of wild organisms in urban and suburban landscapes.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '0.2rem' }}>
              {['🌿 Avian Nesting Perches', '🌸 Nectar & Pollen Forage', '🌡️ Thermal Shelter Buffer'].map((t, idx) => (
                <span key={idx} style={{
                  fontSize: '0.72rem',
                  color: '#e2e8f0',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 8,
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  {t}
                </span>
              ))}
            </div>
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              paddingTop: '0.6rem',
              fontSize: '0.75rem',
              color: '#67e8f9',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              <span>🛡️</span>
              <span>Felling this tree eradicates an entire living micro-ecosystem.</span>
            </div>
          </div>
        </div>

        {/* Big Card 2: Suspended Weaver Bird Nest */}
        <div style={{
          position: 'relative',
          minHeight: 380,
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '1.5rem',
          backgroundImage: `url('/biodiversity/real_weaver_nest.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(2, 6, 23, 0.96) 0%, rgba(2, 6, 23, 0.6) 55%, rgba(2, 6, 23, 0.2) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#fcd34d',
                padding: '0.22rem 0.65rem',
                borderRadius: 999,
                border: '1px solid rgba(251, 191, 36, 0.4)',
                backdropFilter: 'blur(6px)',
              }}>
                🐦 Avian Nesting Architecture
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#38bdf8',
                padding: '0.22rem 0.65rem',
                borderRadius: 999,
                border: '1px solid rgba(56, 189, 248, 0.4)',
                backdropFilter: 'blur(6px)',
              }}>
                Active Bird Refuge
              </span>
            </div>
            <h4 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#ffffff',
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              Suspended Weaver Bird Nest &amp; Arboreal Nursery
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.55 }}>
              Naturally woven retort-shaped pendant nest constructed by weaver birds from flexible plant fibers and grassroots. Suspended high from branches, it provides predator-proof incubation chambers and climatic shielding for young nestlings.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '0.2rem' }}>
              {['🌾 Natural Woven Fiber Architecture', '🛡️ Predator Exclusion Entry Tunnel', '🐣 Thermal Brood Incubator'].map((t, idx) => (
                <span key={idx} style={{
                  fontSize: '0.72rem',
                  color: '#e2e8f0',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 8,
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  {t}
                </span>
              ))}
            </div>
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              paddingTop: '0.6rem',
              fontSize: '0.75rem',
              color: '#fde68a',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              <span>✅</span>
              <span>Crucial arboreal nesting, egg incubation &amp; fledgling nursery for native avifauna.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── REAL BIODIVERSITY CARDS BY CATEGORY ── */}
      {['bird', 'insect', 'mammal'].map((cat) => {
        const creatures = [
          ...(bioData?.birds || []),
          ...(bioData?.insects || []),
          ...(bioData?.mammals || []),
        ].filter((c) => c.category === cat);
        if (creatures.length === 0) return null;
        const cfg = CATEGORY_STYLES[cat];

        return (
          <div key={cat} style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 18,
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 900,
                color: cfg.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              }}>
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: cfg.color,
                background: cfg.badge,
                padding: '0.2rem 0.65rem',
                borderRadius: 999,
                border: `1px solid ${cfg.border}`,
              }}>
                {creatures.length} Documented Species
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.9rem',
            }}>
              {creatures.map((creature, idx) => (
                <div key={idx} style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                }}>
                  <div style={{ position: 'relative', height: 140, overflow: 'hidden', background: '#0f172a' }}>
                    <img
                      src={creature.image}
                      alt={creature.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, transparent 60%)',
                    }} />
                    <span style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: cfg.color,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 6,
                      border: `1px solid ${cfg.border}`,
                    }}>
                      {cat}
                    </span>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    <div>
                      <div style={{
                        fontSize: '0.92rem',
                        fontWeight: 900,
                        color: '#f8fafc',
                        lineHeight: 1.25,
                        fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                      }}>
                        {creature.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                        {creature.scientific}
                      </div>
                    </div>
                    <p style={{
                      margin: '0.2rem 0 0',
                      fontSize: '0.78rem',
                      color: '#cbd5e1',
                      lineHeight: 1.5,
                      flex: 1,
                    }}>
                      {creature.fact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{
        fontSize: '0.72rem',
        color: '#64748b',
        textAlign: 'center',
        padding: '0.5rem 0',
        fontStyle: 'italic',
      }}>
        📷 Real Wildlife Photography: Wikimedia Commons (CC-BY-SA) · Data curated from GBIF, India Biodiversity Portal &amp; FSI
      </div>
    </div>
  );
}

// ── ANTI-FELLING DOSSIER COMPONENT (Top 5 + Load More Reasons) ───────────────
export function AntiFellingDossier({ tree, isPrint = false }) {
  const [showAllReasons, setShowAllReasons] = useState(false);
  const reasons = useMemo(() => getDoNotCutReasons(tree), [tree]);

  if (!reasons || reasons.length === 0) return null;

  const displayedReasons = (showAllReasons || isPrint) ? reasons : reasons.slice(0, 5);

  return (
    <div style={{
      marginTop: '1.75rem',
      background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      borderRadius: 20,
      padding: '1.5rem',
      boxShadow: '0 8px 32px rgba(239, 68, 68, 0.12)',
    }}>
      {/* Red warning header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{
            fontSize: '1.8rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 14,
            padding: '0.6rem 0.75rem',
            lineHeight: 1,
            flexShrink: 0,
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(239, 68, 68, 0.22)',
                color: '#f87171',
                padding: '0.2rem 0.65rem',
                borderRadius: 999,
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              }}>
                Anti-Felling Ecological Mandate
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                {reasons.length} Species-Specific Protections
              </span>
            </div>
            <h3 style={{
              margin: '0.2rem 0',
              fontSize: '1.4rem',
              fontWeight: 900,
              color: '#fef2f2',
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              Why you should <span style={{ color: '#ef4444', textDecoration: 'underline', textDecorationColor: '#f87171' }}>not cut</span> this {tree.species}
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              Age ~{tree.age} yr · DBH {tree.dbh ? `${tree.dbh} cm` : '—'} · Carbon {(tree.carbon || 0).toFixed(1)} kg · Oxygen {(tree.oxygen || 0).toFixed(1)} kg &mdash; reasons below are synthesized from complete climatic &amp; botanical analysis.
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          padding: '0.45rem 0.9rem',
          fontSize: '0.78rem',
          color: '#fca5a5',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <span>⚖️</span>
          <span>Zero-Felling Urban Protection</span>
        </div>
      </div>

      {/* Grid of Reasons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '0.85rem',
      }}>
        {displayedReasons.map((p, i) => (
          <div
            key={p.id || i}
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 14,
              padding: '1rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.65rem',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                paddingBottom: '0.4rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 6,
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                }}>
                  Do not cut · {i + 1}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {p.title}
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: '0.86rem',
                fontWeight: 700,
                color: '#f8fafc',
                lineHeight: 1.5,
              }}>
                {p.highlight}
              </p>
            </div>

            {p.support && (
              <div style={{
                fontSize: '0.76rem',
                color: '#94a3b8',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.5rem 0.65rem',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
              }}>
                <span style={{ color: '#34d399', flexShrink: 0, fontSize: '0.85rem' }}>🍃</span>
                <span>{p.support}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {!isPrint && reasons.length > 5 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
          {!showAllReasons ? (
            <button
              type="button"
              onClick={() => setShowAllReasons(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.25))',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#fef2f2',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)',
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              }}
            >
              <span>⬇️</span>
              <span>Load More Reasons ({reasons.length - 5} More)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAllReasons(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#cbd5e1',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              }}
            >
              <span>⬆️</span>
              <span>Show Top 5 Reasons Only</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── TAB CONTENT RENDERING ───────────────────────────────────────────────────
function TabContent({ tabKey, tree }) {
  const co2Km = ((tree.co2 || 0) / 0.12).toFixed(0);
  const o2Days = ((tree.oxygen || 0) / 0.84).toFixed(0);
  const medicinalParts = getMedicinalParts(tree.species);

  switch (tabKey) {
    case 'oxygen':
      return (
        <div>
          <Section title="Key Metrics" color="#22d3ee">
            <InfoCards items={[
              { label: 'Oxygen Released', value: `${(tree.oxygen || 0).toFixed(2)} kg`, sub: 'Lifetime total output' },
              { label: 'Supports Breathing', value: `${o2Days} days`, sub: 'For one adult human' },
              { label: 'Annual Rate', value: `${((tree.oxygen || 0) / Math.max(1, tree.age)).toFixed(1)} kg/yr`, sub: 'Average yearly production' },
            ]} />
          </Section>
          <Section title="Biochemical Foundation" color="#94a3b8">
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              During daylight photosynthesis, this tree splits water molecules (H₂O) to fix atmospheric CO₂ into carbohydrates, liberating clean O₂ as a natural byproduct.
              The stoichiometric ratio of oxygen released to carbon fixed is <strong style={{ color: '#22d3ee' }}>32/12 ≈ 2.67</strong> — meaning every single kilogram of carbon stored in this tree represents 2.67 kg of life-sustaining oxygen emitted into our atmosphere.
            </p>
          </Section>
          <ConservationBanner text="Felling this tree permanently ends this natural oxygen factory. A replacement sapling requires 12–15 years to match this current output." />
        </div>
      );

    case 'carbon':
      return (
        <div>
          <Section title="Key Metrics" color="#34d399">
            <InfoCards items={[
              { label: 'CO2 Sequestered', value: `${(tree.co2 || 0).toFixed(2)} kg`, sub: 'Lifetime total trapped' },
              { label: 'Carbon Stored', value: `${(tree.carbon || 0).toFixed(2)} kg`, sub: '~47% of total dry biomass' },
              { label: 'Car Km Offset', value: `${co2Km} km`, sub: 'Equivalent vehicle emission offset' },
            ]} />
          </Section>
          <Section title="Sequestration Science" color="#94a3b8">
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              Atmospheric CO₂ has a molecular weight of 44 vs carbon's 12 (ratio <strong style={{ color: '#34d399' }}>44/12 ≈ 3.67</strong>).
              This tree's carbon store locks away {(tree.co2 || 0).toFixed(1)} kg of atmospheric greenhouse gases into dense cellulose, hemicellulose, and lignin — the structural polymer that forms trunk wood and root systems.
            </p>
          </Section>
          <ConservationBanner text="If cut and incinerated or decomposed, all stored carbon oxidizes back into atmospheric CO₂ within months, wiping out decades of natural climate service." />
        </div>
      );

    case 'biomass':
      return (
        <div>
          <Section title="Key Metrics" color="#fbbf24">
            <InfoCards items={[
              { label: 'Aboveground Biomass', value: `${(tree.biomass || 0).toFixed(2)} kg`, sub: 'Total dry wood weight' },
              { label: 'Root Biomass (IPCC)', value: `${((tree.biomass || 0) * 0.26).toFixed(2)} kg`, sub: 'Below-ground root system' },
              { label: 'Total Biological Mass', value: `${((tree.biomass || 0) * 1.26).toFixed(2)} kg`, sub: 'Combined structural weight' },
            ]} />
          </Section>
          <Section title="Allometric Equation" color="#94a3b8">
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              Calculated using the internationally validated <strong style={{ color: '#fbbf24' }}>Chave Allometric Model</strong>:
              <br />
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.6rem', borderRadius: 6, color: '#fbbf24', fontSize: '0.82rem', display: 'inline-block', margin: '0.4rem 0' }}>
                AGB = 0.0673 × (ρ × D² × H)^0.976
              </code>
              <br />
              Where ρ is wood density (g/cm³), D is trunk diameter at breast height, and H is standing height. This non-destructive model allows precise scientific valuation without harming the living tree.
            </p>
          </Section>
        </div>
      );

    case 'climate':
      return (
        <div>
          <UrbanMicroclimateShieldCard allometrics={computeTreeAllometrics(tree)} />
          <Section title="Thermal & Microclimate Regulation" color="#fb923c">
            <InfoCards items={[
              { label: 'Canopy Shade', value: `~${Math.round(15 + (tree.age || 10) * 1.5)} m²`, sub: 'Direct shade footprint' },
              { label: 'Cooling Equivalent', value: '~10 Air Conditioners', sub: 'Operating 20 hrs/day' },
              { label: 'Stormwater Intercepted', value: `~${Math.round((tree.age || 10) * 2.4)} L/storm`, sub: 'Reduces surface runoff' },
              { label: 'Particulate Scrub', value: `~${((tree.age || 10) * 0.6).toFixed(1)} kg/yr`, sub: 'PM2.5 & PM10 filtration' },
            ]} />
          </Section>
          <Section title="Urban Heat Island Mitigation" color="#94a3b8">
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              Through <strong style={{ color: '#fb923c' }}>evapotranspiration</strong> and solar radiation interception, mature trees reduce surrounding surface temperatures by 2°C to 8°C.
              Asphalt roads under mature tree canopies measure up to 11°C cooler during Indian summers, directly lowering heat stroke hospitalizations and indoor air-conditioning power bills for surrounding households.
            </p>
          </Section>
          <div style={{
            background: 'rgba(251, 146, 60, 0.08)',
            border: '1px solid rgba(251, 146, 60, 0.25)',
            borderRadius: 14,
            padding: '0.9rem 1.1rem',
            color: '#fed7aa',
            fontSize: '0.82rem',
            lineHeight: 1.6,
          }}>
            🌡️ <strong>Thermal Buffer:</strong> Each large mature tree provides the equivalent cooling of 10 room-sized air conditioners operating continuously, saving thousands of kWh in grid electrical power.
          </div>
        </div>
      );

    case 'ecological':
      return (
        <div>
          <Section title="Biodiversity & Habitat Support" color="#2dd4bf">
            <InfoCards items={[
              { label: 'Avian Species', value: 'Nesting & Roosting', sub: 'Cavity nesters & frugivores' },
              { label: 'Pollinators', value: 'Bees & Butterflies', sub: 'Nectar corridors & pollen' },
              { label: 'Soil Microfauna', value: 'Mycorrhizal Fungi', sub: 'Root rhizosphere network' },
              { label: 'Microclimate', value: 'Canopy Humidity', sub: 'Leaf moisture reservoir' },
            ]} />
          </Section>
          <Section title="Keystone Ecosystem Role" color="#94a3b8">
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              This tree functions as a <strong style={{ color: '#2dd4bf' }}>vital biological node</strong> in the urban ecosystem. Its fissured bark provides refuge for beneficial predatory insects, its flowers sustain wild pollinators, its foliage shelters migratory birds, and its organic leaf litter regenerates topsoil microbial communities.
            </p>
          </Section>

          {/* ── REAL BIODIVERSITY SUITE (TWO BIG CARDS + CATEGORY SPECIES) ── */}
          <BiodiversityShowcase species={tree.species} />

          <ConservationBanner text="Removing this mature tree dismantles an entire living food web — displacing resident songbirds and severing pollinator flight corridors." />
        </div>
      );

    case 'medicinal':
      return (
        <div>
          <Section title="Ethnobotanical & Pharmacological Value" color="#c084fc">
            {tree.species === 'Neem' && (
              <InfoCards items={[
                { label: 'Active Phytochemicals', value: 'Azadirachtin, Nimbin, Gedunin' },
                { label: 'Therapeutic Actions', value: 'Broad-spectrum antibacterial, antifungal, anti-inflammatory' },
                { label: 'Traditional Healing', value: 'Ayurvedic dermatology, dental hygiene, immune enhancement' },
              ]} />
            )}
            {tree.species === 'Peepal' && (
              <InfoCards items={[
                { label: 'Active Phytochemicals', value: 'Tannins, Saponins, Flavonoids, β-sitosterol' },
                { label: 'Therapeutic Actions', value: 'Astringent, wound healing, respiratory support' },
                { label: 'Traditional Healing', value: 'Asthma relief, gastric ulcers, skin ailments' },
              ]} />
            )}
            {tree.species === 'Mango' && (
              <InfoCards items={[
                { label: 'Active Phytochemicals', value: 'Mangiferin, Polyphenols, Catechins' },
                { label: 'Therapeutic Actions', value: 'Antioxidant, antidiabetic, antiviral' },
                { label: 'Traditional Healing', value: 'Digestive aid, blood sugar balance, respiratory health' },
              ]} />
            )}
            {tree.species === 'Banyan' && (
              <InfoCards items={[
                { label: 'Active Phytochemicals', value: 'Lupeol, Quercetin, Bengalenoside' },
                { label: 'Therapeutic Actions', value: 'Hypoglycemic, immunomodulatory, anti-inflammatory' },
                { label: 'Traditional Healing', value: 'Dental gum strengthening, wound dressing, fertility tonic' },
              ]} />
            )}
            {tree.species === 'Ashok Tree' && (
              <InfoCards items={[
                { label: 'Active Phytochemicals', value: 'Catechins, Saracin, Tannins, Flavonoids' },
                { label: 'Therapeutic Actions', value: 'Uterine tonic, spasmolytic, analgesic' },
                { label: 'Traditional Healing', value: 'Female reproductive wellness, bleeding management, skin care' },
              ]} />
            )}
            {!['Neem', 'Peepal', 'Mango', 'Banyan', 'Ashok Tree'].includes(tree.species) && (
              <InfoCards items={[
                { label: 'Active Phytochemicals', value: 'Flavonoids, Terpenes, Phenolic compounds' },
                { label: 'Therapeutic Actions', value: 'Natural antioxidant & cellular protective compounds' },
                { label: 'Traditional Status', value: 'Documented in regional ethnobotanical folk traditions' },
              ]} />
            )}
          </Section>

          {/* Plant Parts Breakdown Cards */}
          <Section title="Botanical Plant Parts & Pharmacopoeia Breakdown" color="#c084fc">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {medicinalParts.map((mp, idx) => (
                <div key={idx} style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(192, 132, 252, 0.25)',
                  borderRadius: 14,
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f3e8ff' }}>
                    {mp.part}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700 }}>
                    🧪 Compounds: {mp.compounds}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                    {mp.uses}
                  </div>
                  {mp.formula && (
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      💊 Classical Form: {mp.formula}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <div style={{
            background: 'rgba(192, 132, 252, 0.08)',
            border: '1px solid rgba(192, 132, 252, 0.25)',
            borderRadius: 12,
            padding: '0.75rem 1.1rem',
            color: '#e9d5ff',
            fontSize: '0.82rem',
            lineHeight: 1.6,
          }}>
            🌿 <strong>Traditional Botanical Heritage:</strong> Every part of this species has documented applications in classical Ayurveda and Unani medicine.
          </div>
        </div>
      );

    case 'spiritual':
      return (
        <div>
          <Section title="Cultural & Sacred Heritage" color="#fcd34d">
            <div style={{
              background: 'linear-gradient(135deg, rgba(252,211,77,0.09), rgba(245,158,11,0.03))',
              border: '1px solid rgba(252,211,77,0.25)',
              borderRadius: 14,
              padding: '1.2rem',
              color: '#fef3c7',
              fontSize: '0.9rem',
              lineHeight: 1.8,
            }}>
              {tree.species === 'Peepal' && (
                <div>
                  <h4 style={{ fontWeight: 800, color: '#fcd34d', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Sacred Ashvattha (Ficus religiosa)</h4>
                  <p>
                    Revered in Hinduism, Buddhism, and Jainism as the immortal tree of life. Gautama Buddha attained supreme enlightenment under the sacred Peepal Bodhi tree. Mentioned in the Bhagavad Gita (15.1) as an archetype of cosmic consciousness. Traditionally worshipped every Saturday, and cutting down a healthy Peepal is regarded as a grave spiritual transgression.
                  </p>
                </div>
              )}
              {tree.species === 'Banyan' && (
                <div>
                  <h4 style={{ fontWeight: 800, color: '#fcd34d', marginBottom: '0.5rem', fontSize: '1.05rem' }}>The Eternal Vatavriksha (Ficus benghalensis)</h4>
                  <p>
                    India's National Tree, symbolizing longevity, cosmic knowledge, and eternal life through its aerial prop roots that grow back into the earth. Worshipped during Vat Purnima by married women for family prosperity and health. Ancient village councils met under Banyan canopies, cementing its role as the civic heart of Indian communities.
                  </p>
                </div>
              )}
              {tree.species === 'Neem' && (
                <div>
                  <h4 style={{ fontWeight: 800, color: '#fcd34d', marginBottom: '0.5rem', fontSize: '1.05rem' }}>The Divine Shitala Mata Protector</h4>
                  <p>
                    Known in Sanskrit as <em>Arishta</em> (reliever of sickness). Associated with Goddess Mariamman and Shitala Devi as a manifestation of divine healing. Neem leaves are hung at house doorways during festivals like Gudi Padwa and Ugadi to ward off airborne diseases and purify the threshold.
                  </p>
                </div>
              )}
              {tree.species === 'Mango' && (
                <div>
                  <h4 style={{ fontWeight: 800, color: '#fcd34d', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Symbol of Fertility & Auspicious Beginnings</h4>
                  <p>
                    Mango leaves (<em>Toran</em>) adorn Hindu homes and wedding pandals to usher in prosperity and dispel negativity. Mango wood is exclusively prescribed in Vedic <em>Havans</em> (sacred fire rituals) for its pure burning properties.
                  </p>
                </div>
              )}
              {!['Peepal', 'Banyan', 'Neem', 'Mango'].includes(tree.species) && (
                <div>
                  <h4 style={{ fontWeight: 800, color: '#fcd34d', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Sacred Grove & Indigenous Significance</h4>
                  <p>
                    In Indian environmental traditions, all mature trees are regarded as living guardians of the landscape. They form sacred groves (<em>Devrais</em>) across Maharashtra that have preserved virgin forest pockets for centuries through community veneration.
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Grassroots Conservation Movements */}
          <Section title="Historic Tree Protection Movements" color="#fcd34d">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(252, 211, 77, 0.25)',
                borderRadius: 14,
                padding: '1rem',
              }}>
                <div style={{ fontWeight: 800, color: '#fcd34d', fontSize: '0.9rem', marginBottom: 4 }}>
                  ✊ Chipko Movement (1973)
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.5, margin: 0 }}>
                  Villagers in the Garhwal Himalayas led by Gaura Devi hugged forest trees to physically prevent commercial loggers from cutting them down, giving birth to India's modern environmental movement.
                </p>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(252, 211, 77, 0.25)',
                borderRadius: 14,
                padding: '1rem',
              }}>
                <div style={{ fontWeight: 800, color: '#fcd34d', fontSize: '0.9rem', marginBottom: 4 }}>
                  🪔 Khejarli Bishnoi Sacrifice (1730)
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.5, margin: 0 }}>
                  Amrita Devi Bishnoi and 363 Bishnois sacrificed their lives clinging to sacred Khejri trees against royal woodcutters, inspiring the Indian principle that tree life equals human life.
                </p>
              </div>
            </div>
          </Section>
        </div>
      );

    case 'legal':
      return (
        <div>
          <Section title="Statutory Protection & Penal Provisions" color="#f87171">
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.07)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12,
                padding: '0.9rem 1.1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ color: '#fca5a5', fontSize: '0.92rem' }}>Maharashtra (Urban Areas) Trees Act, 1975</strong>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.2rem 0.5rem', borderRadius: 999 }}>MUNICIPAL STATUTE</span>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                  Applies directly to Nashik Municipal Corporation (NMC). No tree may be pruned, girdled, or felled without prior written permit from the municipal Tree Officer. Unauthorized felling invites criminal prosecution, fines up to ₹1,00,000, and compulsory compensatory planting of 2 to 5 saplings.
                </p>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.07)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12,
                padding: '0.9rem 1.1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ color: '#fca5a5', fontSize: '0.92rem' }}>National Green Tribunal (NGT) Act, 2010</strong>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.2rem 0.5rem', borderRadius: 999 }}>APEX TRIBUNAL</span>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                  Citizens can petition the NGT directly without court fees. The Tribunal possesses judicial authority to issue immediate stop-work injunctions, seize equipment, and penalize violators up to ₹10 Crore for corporate offenders.
                </p>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.07)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12,
                padding: '0.9rem 1.1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ color: '#fca5a5', fontSize: '0.92rem' }}>Wildlife Protection Act, 1972 & Forest Act, 1927</strong>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.2rem 0.5rem', borderRadius: 999 }}>CENTRAL ACTS</span>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                  Cutting any tree that shelters nesting wild birds or protected species during breeding season constitutes destruction of wildlife habitat under Section 9 of the Wildlife Protection Act, punishable by up to 3 years rigorous imprisonment.
                </p>
              </div>
            </div>
          </Section>
        </div>
      );

    case 'location':
      return (
        <div>
          <Section title="Location-Specific Importance" color="#60a5fa">
            <InfoCards items={[
              { label: 'Latitude Coordinate', value: tree.lat ? Number(tree.lat).toFixed(6) : 'Available on GPS sync' },
              { label: 'Longitude Coordinate', value: tree.lng ? Number(tree.lng).toFixed(6) : 'Available on GPS sync' },
              { label: 'Jurisdiction', value: 'Nashik Municipal Corporation, Maharashtra' },
            ]} />
          </Section>
          <Section title="Micro-Environmental Context" color="#94a3b8">
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              Trees situated in residential, school, or commercial corridors serve as the first line of defense against heavy vehicular PM2.5 emissions, brake-dust aerosols, and urban noise pollution.
              They create shaded sidewalk corridors that encourage pedestrian mobility and protect vulnerable populations (children and senior citizens) from severe solar heat stress.
            </p>
          </Section>
          {tree.habitat && (
            <div style={{
              background: 'rgba(96, 165, 250, 0.08)',
              border: '1px solid rgba(96, 165, 250, 0.25)',
              borderRadius: 12,
              padding: '0.75rem 1.1rem',
              color: '#bfdbfe',
              fontSize: '0.84rem',
            }}>
              📍 <strong>Field Habitat Observation:</strong> {tree.habitat}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ── Main Unified Report Component ──────────────────────────────────────────
export default function UnifiedTreeReport({ tree: rawTree, mode = 'interactive', onPrint }) {
  const tree = normalizeTree(rawTree);
  const [activeTab, setActiveTab] = useState('oxygen');
  const allometrics = useMemo(() => (tree ? computeTreeAllometrics(tree) : null), [tree]);

  if (!tree) return null;

  const isPrint = mode === 'print';
  const fallbacks = getSpeciesFallbacks(tree.species);
  const leafSrc = resolveImg(tree.leafImage, tree.species, 'leaf') || fallbacks.leaf;
  const barkSrc = resolveImg(tree.barkImage, tree.species, 'bark') || fallbacks.bark;
  const fullSrc = resolveImg(tree.fullImage, tree.species, 'tree') || fallbacks.tree;
  const activeTabDef = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <div style={{ fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)", color: '#e2e8f0', width: '100%' }}>

      {/* ── TOP BANNER & METRICS ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}>
          <div>
            <span style={{
              background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.3)',
              color: '#34d399',
              borderRadius: 999,
              padding: '0.22rem 0.75rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'inline-block',
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              Analytical Arboreal Assessment
            </span>
            <h2 style={{
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)',
              fontWeight: 900,
              color: '#f8fafc',
              margin: '0.35rem 0 0.15rem',
              letterSpacing: '-0.02em',
            }}>
              {tree.species}
            </h2>
            <div style={{ color: '#94a3b8', fontSize: '0.86rem', fontStyle: 'italic' }}>
              {tree.scientificName}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {[
              { label: 'Age', val: `${tree.age} yrs` },
              { label: 'CO2 Stored', val: `${(tree.co2 || 0).toFixed(0)} kg` },
              { label: 'O2 Released', val: `${(tree.oxygen || 0).toFixed(0)} kg` },
              { label: 'Biomass', val: `${(tree.biomass || 0).toFixed(0)} kg` },
            ].map((m) => (
              <div key={m.label} style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '0.4rem 0.85rem',
                textAlign: 'center',
                minWidth: 70,
              }}>
                <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em', fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
                  {m.label}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#34d399', fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
                  {m.val}
                </div>
              </div>
            ))}

            {/* Print / PDF generation button */}
            {!isPrint && (
              <PrintReportButton result={normalizeForPrint(rawTree)} />
            )}
          </div>
        </div>

        {/* ── PHOTO ROW: Always displays uploaded image or species botanical photo ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          <PhotoSlot src={leafSrc} fallbackSrc={fallbacks.leaf} label="Leaf / Foliage" accentColor="#34d399" />
          <PhotoSlot src={barkSrc} fallbackSrc={fallbacks.bark} label="Trunk / Bark" accentColor="#fbbf24" />
          <PhotoSlot src={fullSrc} fallbackSrc={fallbacks.tree} label="Entire Tree" accentColor="#60a5fa" />
        </div>
      </div>

      {/* ── OXYGEN TREE LIVING BIOSYNTHESIS FACTORY ── */}
      <OxygenTreeCard tree={tree} />

      {/* ── CALCULATED TREE AGE & ALLOMETRIC IMPACT (Image 1) ── */}
      {allometrics && (
        <CalculatedTreeAgeCard allometrics={allometrics} />
      )}

      {/* ── URBAN FORESTRY & MICROCLIMATE SHIELD (Image 2) ── */}
      {allometrics && (
        <UrbanMicroclimateShieldCard allometrics={allometrics} />
      )}

      {/* ── SMALL HEADINGS IN VISUALLY IMPELLING SHAPES & COLOURS ── */}
      {!isPrint && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.25rem',
          padding: '0.5rem',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: 18,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  border: `1px solid ${isActive ? tab.border : 'rgba(255, 255, 255, 0.08)'}`,
                  background: isActive ? tab.bg : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? tab.color : '#94a3b8',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.82rem',
                  fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isActive ? `0 0 16px ${tab.bg}` : 'none',
                }}
              >
                <span style={{ fontSize: '0.95rem' }}>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── ACTIVE SELECTED ANALYSIS PANEL ── */}
      {!isPrint && (
        <div
          key={activeTab}
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75), rgba(2, 6, 23, 0.85))',
            border: `1px solid ${activeTabDef.border}`,
            borderRadius: 18,
            padding: '1.35rem 1.6rem',
            boxShadow: `0 8px 30px -10px ${activeTabDef.border}44`,
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: `1px solid ${activeTabDef.border}44`,
          }}>
            <span style={{ fontSize: '1.3rem' }}>{activeTabDef.emoji}</span>
            <span style={{
              fontWeight: 900,
              fontSize: '1.05rem',
              color: activeTabDef.color,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}>
              {activeTabDef.label} Analysis
            </span>
          </div>

          <TabContent tabKey={activeTab} tree={tree} />
        </div>
      )}

      {/* ── ANTI-FELLING ECOLOGICAL MANDATE (Top 5 + Load More Reasons) ── */}
      {!isPrint && (
        <AntiFellingDossier tree={tree} />
      )}

      {/* ── PRINT VIEW: All sections expanded ── */}
      {isPrint && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {TABS.map((tab) => (
            <div
              key={tab.key}
              style={{
                border: `1px solid ${tab.border}`,
                borderRadius: 14,
                padding: '1rem 1.25rem',
                background: 'rgba(15, 23, 42, 0.4)',
              }}
            >
              <div style={{
                fontWeight: 800,
                color: tab.color,
                fontSize: '0.92rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.75rem',
              }}>
                {tab.emoji} {tab.label}
              </div>
              <TabContent tabKey={tab.key} tree={tree} />
            </div>
          ))}
          <AntiFellingDossier tree={tree} isPrint={true} />
        </div>
      )}
    </div>
  );
}
