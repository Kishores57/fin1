import React, { useState, useEffect, useRef } from 'react';
import '../mapStyles.css';
import { generateEcologicalInsight } from '../services/aiService';
import SidebarMenu from './SidebarMenu';
import { API_BASE_URL } from '../services/api';
import UnifiedTreeReport from './UnifiedTreeReport';

// --- UTILS & CALCULATIONS ---
const GROWTH_FACTORS = {
  'Ashok Tree': 4.1,
  'Palm Tree': 4.2,
  'Child Palm': 4.5,
  'Chinese Palm': 4.3,
  'Rain Tree': 3.8,
  'Coconut Tree': 4.5,
  'Guava Tree': 4.0,
  'Bamboo Tree': 3.0,
  Banyan: 3.5,
  Neem: 3.8,
  Mango: 4.2,
  Peepal: 3.6,
  Oak: 5.0,
};

const MAI_VALUES = {
  'Ashok Tree': 1.20,
  'Palm Tree': 1.00,
  'Child Palm': 1.00,
  'Chinese Palm': 1.00,
  'Rain Tree': 1.50,
  'Coconut Tree': 1.10,
  'Guava Tree': 0.80,
  'Bamboo Tree': 2.50,
  Banyan: 1.00,
  Neem: 0.90,
  Mango: 1.10,
  Peepal: 1.20,
  Oak: 1.00,
};

const MAX_TREE_AGE = 28;
const AGE_MAI_SCALE = 2.05;

/** Age from GBH (cm). Calibrated so Nashik survey trees stay ≤ ~28 years. */
const calculateTreeAge = (circumferenceCm, species) => {
  const mai = MAI_VALUES[species] || 1.0;
  const dbh = (parseFloat(circumferenceCm) || 0) / Math.PI;
  const age = Math.round(dbh / (mai * AGE_MAI_SCALE));
  return Math.max(1, Math.min(MAX_TREE_AGE, age || 1));
};

// --- LUCIDE ICON WRAPPER (utilizing window.lucide from CDN) ---
const Icon = ({ name, size = 22, className = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide && window.lucide.icons && window.lucide.icons[name]) {
      window.lucide.createIcons({
        icons: { [name]: window.lucide.icons[name] },
        nameAttr: 'data-lucide',
        attrs: { class: className, width: size, height: size },
      });
    }
  }, [name, className, size]);
  return <i ref={ref} data-lucide={name}></i>;
};

// --- FULLSCREEN MAP COMPONENT ---
const FullscreenMap = ({ trees, onSelectAiTree, mapInstanceRef, highlightedTreeId }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const dotMarkersRef = useRef({});      // CircleMarkers keyed by tree.id
  const highlightRingRef = useRef(null); // extra pulsing ring for highlighted tree
  const hasFittedRef = useRef(false);
  const treesRef = useRef(trees);
  const highlightedRef = useRef(highlightedTreeId);

  useEffect(() => { treesRef.current = trees; }, [trees]);
  useEffect(() => { highlightedRef.current = highlightedTreeId; }, [highlightedTreeId]);

  const impactColor = (impact) => {
    if (impact === 'Critical') return '#EF4444';
    if (impact === 'High')     return '#F59E0B';
    return '#22c55e';
  };

  const getIconSize = (zoom, isHighlighted) => {
    const base = Math.max(16, Math.min(38, 12 + (zoom - 12) * 2.5));
    return isHighlighted ? base * 1.55 : base;
  };

  const getTreeIcon = (tree, zoom, isHighlighted) => {
    const size = getIconSize(zoom, isHighlighted);
    const color = impactColor(tree.impact);

    const isPalm = ['Palm Tree', 'Child Palm', 'Chinese Palm', 'Coconut Tree'].includes(tree.species);
    const svgContent = isPalm 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22C11.5 17 11 12 12 9" />
          <path d="M12 9c-2.5-1.5-5-1-7 1" />
          <path d="M12 9c2.5-1.5 5-1 7 1" />
          <path d="M12 9c-3-2.5-4-5.5-2-7.5" />
          <path d="M12 9c3-2.5 4-5.5 2-7.5" />
         </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22v-8" />
          <path d="M9 14H8a4 4 0 0 1-4-4 6 6 0 0 1 12 0 4 4 0 0 1-4 4h-1z" />
          <path d="M12 2v2" />
         </svg>`;

    const html = `
      <div class="tree-marker-container ${isHighlighted ? 'highlighted' : ''}" style="width: ${size}px; height: ${size}px; color: ${color};">
        <div class="tree-marker-icon" style="background-color: ${color};">
          ${svgContent}
        </div>
        ${isHighlighted ? '<div class="marker-pulse-ring"></div>' : ''}
      </div>
    `;

    // eslint-disable-next-line no-undef
    return L.divIcon({
      className: 'custom-tree-icon-wrapper',
      html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const updateDots = () => {
    if (!mapInstance.current) return;
    const zoom = mapInstance.current.getZoom();
    const validTrees = treesRef.current.filter((t) => t.lat && t.lng);
    const existingIds = new Set(Object.keys(dotMarkersRef.current).map(Number));

    validTrees.forEach((tree) => {
      existingIds.delete(tree.id);
      const isHighlighted = highlightedRef.current && String(tree.id) === String(highlightedRef.current);

      let dot = dotMarkersRef.current[tree.id];
      if (!dot) {
        // eslint-disable-next-line no-undef
        dot = L.marker([tree.lat, tree.lng], {
          icon: getTreeIcon(tree, zoom, isHighlighted),
          bubblingMouseEvents: false,
        });

        dot.on('click', () => { if (onSelectAiTree) onSelectAiTree(tree); });

        dot.on('mouseover', function () {
          const z = mapInstance.current ? mapInstance.current.getZoom() : zoom;
          const activeIcon = getTreeIcon(tree, z, true);
          this.setIcon(activeIcon);
        });

        dot.on('mouseout', function () {
          const z = mapInstance.current ? mapInstance.current.getZoom() : zoom;
          const hl = highlightedRef.current && String(tree.id) === String(highlightedRef.current);
          const normalIcon = getTreeIcon(tree, z, hl);
          this.setIcon(normalIcon);
        });

        dot.addTo(mapInstance.current);
        dotMarkersRef.current[tree.id] = dot;
      } else {
        dot.setIcon(getTreeIcon(tree, zoom, isHighlighted));
      }
    });

    existingIds.forEach((id) => {
      mapInstance.current.removeLayer(dotMarkersRef.current[id]);
      delete dotMarkersRef.current[id];
    });
  };

  const updateHighlightRing = () => {
    if (highlightRingRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(highlightRingRef.current);
      highlightRingRef.current = null;
    }
    if (!highlightedRef.current || !mapInstance.current) return;

    const tree = treesRef.current.find(
      (t) => String(t.id) === String(highlightedRef.current)
    );
    if (!tree || !tree.lat || !tree.lng) return;

    // eslint-disable-next-line no-undef
    highlightRingRef.current = L.circleMarker([tree.lat, tree.lng], {
      radius:      22,
      color:       impactColor(tree.impact),
      weight:      2,
      fill:        false,
      opacity:     0.7,
      className:   'highlight-ring',
      interactive: false,
    }).addTo(mapInstance.current);
  };

  const handleZoom = () => {
    if (!mapInstance.current) return;
    const zoom = mapInstance.current.getZoom();
    Object.entries(dotMarkersRef.current).forEach(([id, dot]) => {
      const tree = treesRef.current.find((t) => String(t.id) === String(id));
      if (tree) {
        const hl = highlightedRef.current && String(id) === String(highlightedRef.current);
        dot.setIcon(getTreeIcon(tree, zoom, hl));
      }
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      // eslint-disable-next-line no-undef
      mapInstance.current = L.map(mapRef.current, {
        zoomControl:      false,
        scrollWheelZoom:  true,
        doubleClickZoom:  true,
        touchZoom:        true,
        boxZoom:          true,
        maxZoom:          22,
        minZoom:          3,
      }).setView([20.013100, 73.821316], 17);

      // eslint-disable-next-line no-undef
      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

      // eslint-disable-next-line no-undef
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 22, maxNativeZoom: 19 }
      ).addTo(mapInstance.current);

      mapInstance.current.on('zoomend', handleZoom);
    }

    if (mapInstanceRef) mapInstanceRef.current = mapInstance.current;

    // Force size recalculation to ensure map is fully loaded and scrollable/interactive
    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 100);
    updateDots();
    updateHighlightRing();

    if (trees.length > 0 && !hasFittedRef.current) {
      const validTrees = trees.filter((t) => t.lat && t.lng);
      if (validTrees.length > 0) {
        // eslint-disable-next-line no-undef
        const bounds = L.latLngBounds(validTrees.map((t) => [t.lat, t.lng]));
        if (bounds.isValid()) {
          mapInstance.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
          hasFittedRef.current = true;
        }
      }
    }
  }, [trees, highlightedTreeId]);

  return <div ref={mapRef} className="fullscreen-map" style={{ height: 'calc(100vh - 120px)', width: '100%', position: 'relative', zIndex: 1, borderRadius: '24px' }}></div>;
};

// --- MAP TREE FORM MODAL ---
const MapTreeModal = ({ onClose, onAddTree }) => {
  const [formData, setFormData] = useState({
    species: 'Rain Tree',
    circumference: '',
    habitat: '',
  });
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };

  const takePhoto = (e) => {
    e.preventDefault();
    if (!cameraActive) {
      startCamera();
      return;
    }
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/jpeg');
      setPhoto(photoData);

      // Stop camera stream
      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.circumference) return;

    // Estimate coordinates randomly close to Nashik center
    const lat = 20.013100 + (Math.random() - 0.5) * 0.003;
    const lng = 73.821316 + (Math.random() - 0.5) * 0.003;

    const age = calculateTreeAge(formData.circumference, formData.species);
    const co2 = age * 22;
    const impact = age >= 22 ? 'Critical' : age >= 14 ? 'High' : 'Moderate';

    onAddTree({
      id: Date.now(),
      species: formData.species,
      circumference: parseFloat(formData.circumference),
      lat,
      lng,
      age,
      co2,
      impact,
      habitat: formData.habitat || 'Local fauna, pollinators',
      date: new Date().toISOString().slice(0, 10),
      photo: photo,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="modal-glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <Icon name="X" size={20} />
        </button>
        <div className="modal-header">
          <Icon name="PlusCircle" size={22} />
          <h2>Register Survey Tree</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Tree Species</label>
              <select
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                className="form-select"
              >
                {Object.keys(GROWTH_FACTORS).map((sp) => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Girth (GBH in cm)</label>
              <input
                type="number"
                placeholder="e.g. 120"
                value={formData.circumference}
                onChange={(e) => setFormData({ ...formData, circumference: e.target.value })}
                className="form-input-box"
                required
              />
            </div>
            <div className="form-group full-width">
              <label>Habitat Notes</label>
              <textarea
                placeholder="Nesting birds, insect shield, etc."
                value={formData.habitat}
                onChange={(e) => setFormData({ ...formData, habitat: e.target.value })}
                className="form-textarea"
                rows="2"
              />
              {formData.circumference && (
                <div className="mt-4" style={{ padding: '1rem', background: 'rgba(255,255,255,0.7)', borderRadius: '14px' }}>
                  <div className="flex-between mb-1" style={{ fontSize: '0.9rem' }}>
                    <span>Estimated Age:</span>
                    <strong>{calculateTreeAge(formData.circumference, formData.species)} years</strong>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                    <span>CO₂ Absorbed:</span>
                    <strong>{(calculateTreeAge(formData.circumference, formData.species) * 22).toLocaleString()} kg</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon name="PlusCircle" size={18} /> Add Tree to Map
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BOTANICAL_NAMES = {
  'Ashok Tree': 'Polyalthia longifolia',
  'Palm Tree': 'Arecaceae',
  'Child Palm': 'Phoenix roebelenii',
  'Chinese Palm': 'Livistona chinensis',
  'Rain Tree': 'Samanea saman',
  'Coconut Tree': 'Cocos nucifera',
  'Guava Tree': 'Psidium guajava',
  'Bamboo Tree': 'Bambusoideae',
  Banyan: 'Ficus benghalensis',
  Neem: 'Azadirachta indica',
  Mango: 'Mangifera indica',
  Peepal: 'Ficus religiosa',
};

// --- AI INSIGHT MODAL (UNIFIED REPORT) ---
const AiInsightModal = ({ tree, onClose, onDeleteMongoTree }) => {
  if (!tree) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        className="modal-glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98))',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(52, 211, 153, 0.12)',
          borderRadius: '24px',
          padding: '1.75rem',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            borderRadius: '999px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          ✕
        </button>

        <UnifiedTreeReport tree={tree} mode="interactive" />

        {/* Delete option for MongoDB registered trees */}
        {tree.mongoId && onDeleteMongoTree && (
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                padding: '0.45rem 1rem',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={() => onDeleteMongoTree(tree)}
            >
              Delete Registered Tree
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN INTEGRATED MAP DASHBOARD TAB ---
export const MapDashboard = ({ refreshKey = 0, onViewAnalysis }) => {
  const [trees, setTrees] = useState([]);
  const [loadingTrees, setLoadingTrees] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAiTree, setSelectedAiTree] = useState(null);
  const [selectedMongoTree, setSelectedMongoTree] = useState(null);
  const mapInstanceRef = useRef(null);
  const [highlightedTreeId, setHighlightedTreeId] = useState(null);

  useEffect(() => {
    async function loadLiveTrees() {
      try {
        setLoadingTrees(true);
        const res = await fetch(`${API_BASE_URL}/api/epicollect/trees`);
        let epic = [];
        if (res.ok) {
          epic = await res.json();
        }

        // Additive: merge MongoDB registered / calculator-saved trees
        let mongoMapped = [];
        try {
          const mRes = await fetch(`${API_BASE_URL}/api/registered-trees`);
          if (mRes.ok) {
            const mongoTrees = await mRes.json();
            mongoMapped = (mongoTrees || []).map((t, i) => ({
              id: 900000 + i,
              mongoId: t._id,
              treeId: t.treeId,
              uuid: t.treeId,
              species: t.species,
              treeName: t.treeName || t.species,
              scientificName: t.scientificName,
              age: t.age,
              height: t.height,
              dbh: t.dbh,
              gbh: t.gbh,
              healthStatus: t.healthStatus,
              impact: 'High',
              lat: t.latitude,
              lng: t.longitude,
              source: 'mongo',
              createdAt: t.createdAt,
              raw: t,
            }));
          }
        } catch (mongoErr) {
          console.warn('Mongo registered trees unavailable:', mongoErr);
        }

        setTrees([...mongoMapped, ...epic]);
      } catch (error) {
        console.error('Failed to load Epicollect trees:', error);
      } finally {
        setLoadingTrees(false);
      }
    }
    loadLiveTrees();
  }, [refreshKey]);

  const handleFocusTree = (tree) => {
    if (!tree.lat || !tree.lng) return;
    setHighlightedTreeId(tree.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([tree.lat, tree.lng], 19, { duration: 1.2 });
    }
    setTimeout(() => setHighlightedTreeId(null), 4000);
  };

  const handleAddTree = (newTree) => {
    setTrees([newTree, ...trees]);
  };

  const handleSelectTree = (tree) => {
    setSelectedAiTree(tree);
  };

  return (
    <div className="relative w-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Map loading spinner */}
      {loadingTrees && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex flex-col items-center justify-center text-center">
          <div className="spinner mb-4"></div>
          <p className="text-slate-200 font-bold text-lg">Syncing with Epicollect5 Live Survey Database...</p>
          <p className="text-slate-400 text-xs mt-1">Retrieving entries, mapping coordinates & calculating tree age metrics</p>
        </div>
      )}

      {/* Main Fullscreen Map */}
      <FullscreenMap
        trees={trees}
        onSelectAiTree={handleSelectTree}
        mapInstanceRef={mapInstanceRef}
        highlightedTreeId={highlightedTreeId}
      />

      {/* Floating Map Search Bar */}
      <SidebarMenu
        trees={trees}
        onFocusTree={handleFocusTree}
        onSelectTree={handleSelectTree}
      />

      {/* AI Insight Report Modal */}
      {selectedAiTree && (
        <AiInsightModal
          tree={selectedAiTree}
          onClose={() => setSelectedAiTree(null)}
          onDeleteMongoTree={async (treeToDelete) => {
            if (!window.confirm('Are you sure you want to delete this registered tree?')) return;
            try {
              await fetch(`${API_BASE_URL}/api/registered-trees/${treeToDelete.mongoId}`, {
                method: 'DELETE',
              });
              setTrees((prev) => prev.filter((t) => t.id !== treeToDelete.id));
              setSelectedAiTree(null);
            } catch (e) {
              alert(e.message || 'Delete failed');
            }
          }}
        />
      )}
    </div>
  );
};

export default MapDashboard;