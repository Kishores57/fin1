import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import { generateEcologicalInsight } from './services/aiService';
import SidebarMenu from './components/SidebarMenu';

// --- UTILS & CALCULATIONS ---
// Species list used by the add-tree form
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

// Mean annual increment (cm DBH / year) — same basis as backend Epicollect pipeline
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

const calculateClimateImpact = (age) => {
  const co2Absorbed = age * 22;
  return {
    co2: co2Absorbed,
    lossImpact: age >= 22 ? 'Critical' : age >= 14 ? 'High' : 'Moderate',
  };
};

// --- LUCIDE ICON WRAPPER ---
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

// --- CONVEX HULL UTILITY ---
// Returns convex hull of points [[lat, lng], ...] using Graham scan
const convexHull = (points) => {
  if (points.length < 3) return points;
  // Find bottom-most point
  let pivot = points.reduce((a, b) => (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? a : b));
  const angle = (o, a) => Math.atan2(a[0] - o[0], a[1] - o[1]);
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const cross = (O, A, B) => (A[1] - O[1]) * (B[0] - O[0]) - (A[0] - O[0]) * (B[1] - O[1]);

  const sorted = [...points].filter((p) => p !== pivot).sort((a, b) => {
    const da = angle(pivot, a);
    const db = angle(pivot, b);
    return da !== db ? da - db : dist(pivot, a) - dist(pivot, b);
  });

  const hull = [pivot];
  for (const p of sorted) {
    while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
      hull.pop();
    }
    hull.push(p);
  }
  return hull;
};

// --- FULLSCREEN MAP COMPONENT ---
// Dots are always tiny & tappable; polygon boundary is always visible at every zoom.

const FullscreenMap = ({ trees, onSelectAiTree, mapInstanceRef, highlightedTreeId }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const dotMarkersRef = useRef({});      // CircleMarkers keyed by tree.id
  const polygonLayerRef = useRef(null);  // convex hull boundary polygon
  const highlightRingRef = useRef(null); // extra pulsing ring for highlighted tree
  const hasFittedRef = useRef(false);
  const treesRef = useRef(trees);
  const highlightedRef = useRef(highlightedTreeId);

  // Keep refs in sync (avoid stale closures inside Leaflet events)
  useEffect(() => { treesRef.current = trees; }, [trees]);
  useEffect(() => { highlightedRef.current = highlightedTreeId; }, [highlightedTreeId]);

  // Color per impact — Moderate stays green tree icon
  const impactColor = (impact) => {
    if (impact === 'Critical') return '#EF4444';
    if (impact === 'High')     return '#F59E0B';
    return '#22c55e';
  };

  const getIconSize = (zoom, isHighlighted) => {
    const base = Math.max(18, Math.min(36, 14 + (zoom - 12) * 2.2));
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
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // ── Draw / update the permanent convex-hull boundary polygon ────────────
  const updatePolygon = () => {
    if (!mapInstance.current) return;
    const pts = treesRef.current
      .filter((t) => t.lat && t.lng)
      .map((t) => [t.lat, t.lng]);
    if (pts.length < 3) return;

    const hull = convexHull(pts);

    if (polygonLayerRef.current) {
      polygonLayerRef.current.setLatLngs(hull);
    } else {
      // eslint-disable-next-line no-undef
      polygonLayerRef.current = L.polygon(hull, {
        color:       '#22c55e',
        fillColor:   '#22c55e',
        fillOpacity: 0.10,
        weight:      2.5,
        dashArray:   '7 5',
        opacity:     0.80,
        className:   'tree-coverage-polygon',
        interactive: false,
      }).addTo(mapInstance.current);
    }
  };

  // ── Draw tree icons at Epicollect lat/lng ────────────────────────────────
  const updateDots = () => {
    if (!mapInstance.current) return;
    const zoom = mapInstance.current.getZoom();
    const validTrees = treesRef.current.filter((t) => t.lat && t.lng);
    const existingIds = new Set(Object.keys(dotMarkersRef.current).map(Number));

    validTrees.forEach((tree) => {
      existingIds.delete(tree.id);
      const isHighlighted = highlightedRef.current && String(tree.id) === String(highlightedRef.current);

      let marker = dotMarkersRef.current[tree.id];
      if (!marker) {
        // eslint-disable-next-line no-undef
        marker = L.marker([tree.lat, tree.lng], {
          icon: getTreeIcon(tree, zoom, isHighlighted),
          bubblingMouseEvents: false,
        });

        marker.on('click', () => { if (onSelectAiTree) onSelectAiTree(tree); });

        marker.on('mouseover', function () {
          const z = mapInstance.current ? mapInstance.current.getZoom() : zoom;
          this.setIcon(getTreeIcon(tree, z, true));
        });

        marker.on('mouseout', function () {
          const z = mapInstance.current ? mapInstance.current.getZoom() : zoom;
          const hl = highlightedRef.current && String(tree.id) === String(highlightedRef.current);
          this.setIcon(getTreeIcon(tree, z, hl));
        });

        marker.addTo(mapInstance.current);
        dotMarkersRef.current[tree.id] = marker;
      } else {
        marker.setIcon(getTreeIcon(tree, zoom, isHighlighted));
        marker.setLatLng([tree.lat, tree.lng]);
      }
    });

    existingIds.forEach((id) => {
      mapInstance.current.removeLayer(dotMarkersRef.current[id]);
      delete dotMarkersRef.current[id];
    });
  };

  // ── Pulsing highlight ring around the focused tree ───────────────────────
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

  // ── Refresh icon sizes when zoom changes ─────────────────────────────────
  const handleZoom = () => {
    if (!mapInstance.current) return;
    const zoom = mapInstance.current.getZoom();
    Object.entries(dotMarkersRef.current).forEach(([id, marker]) => {
      const tree = treesRef.current.find((t) => String(t.id) === String(id));
      if (!tree) return;
      const hl = highlightedRef.current && String(id) === String(highlightedRef.current);
      marker.setIcon(getTreeIcon(tree, zoom, hl));
    });
  };

  // ── Main effect — runs on mount and whenever trees / highlight change ────
  useEffect(() => {
    if (!mapRef.current) return;

    // Init map once
    if (!mapInstance.current) {
      // eslint-disable-next-line no-undef
      mapInstance.current = L.map(mapRef.current, {
        zoomControl:      false,
        dragging:         true,
        scrollWheelZoom:  true,
        doubleClickZoom:  true,
        touchZoom:        true,
        boxZoom:          true,
        keyboard:         true,
        inertia:          true,
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

      // Ensure pan / scroll-wheel zoom handlers are active
      mapInstance.current.dragging.enable();
      mapInstance.current.scrollWheelZoom.enable();
      mapInstance.current.touchZoom.enable();
    }

    // Expose map instance to parent
    if (mapInstanceRef) mapInstanceRef.current = mapInstance.current;

    // Recalc size so Leaflet captures drag + wheel correctly
    const sizeTimer = setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
        mapInstance.current.dragging.enable();
        mapInstance.current.scrollWheelZoom.enable();
      }
    }, 100);

    // 1️⃣ Draw / update the boundary polygon (always visible)
    updatePolygon();

    // 2️⃣ Draw / update individual dots (always visible)
    updateDots();

    // 3️⃣ Draw / update highlight ring
    updateHighlightRing();

    // Fit to all trees once on first load
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

    return () => clearTimeout(sizeTimer);
  }, [trees, highlightedTreeId]);

  return <div ref={mapRef} className="fullscreen-map"></div>;
};

// --- MAP TREE FORM MODAL ---
const MapTreeModal = ({ onClose, onAddTree }) => {
  const [formData, setFormData] = useState({
    species: 'Rain Tree',
    circumference: '',
    habitat: '',
  });
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [photo, setPhoto] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const getLocation = (e) => {
    e.preventDefault();
    setIsGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsGettingLocation(false);
        },
        (error) => {
          // eslint-disable-next-line no-alert
          alert('Error acquiring location: ' + error.message);
          setIsGettingLocation(false);
        }
      );
    } else {
      // eslint-disable-next-line no-alert
      alert('Geolocation is not supported by your browser.');
      setIsGettingLocation(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error accessing camera: ' + err.message);
    }
  };

  const takePhoto = (e) => {
    e.preventDefault();
    if (!cameraActive) {
      startCamera();
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg');
      setPhoto(photoData);

      const tracks = video.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.circumference) {
      // eslint-disable-next-line no-alert
      alert('Please enter tree circumference.');
      return;
    }

    const defaultLat = location ? location.lat : 20.013100 + (Math.random() - 0.5) * 0.001;
    const defaultLng = location ? location.lng : 73.821316 + (Math.random() - 0.5) * 0.001;

    const age = calculateTreeAge(formData.circumference, formData.species);
    const impactValues = calculateClimateImpact(age);

    const newTree = {
      id: Date.now(),
      ...formData,
      circumference: parseFloat(formData.circumference),
      lat: defaultLat,
      lng: defaultLng,
      age,
      co2: impactValues.co2,
      impact: impactValues.lossImpact,
      date: new Date().toISOString().split('T')[0],
      photo,
    };

    onAddTree(newTree);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-glass-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <Icon name="X" size={20} />
        </button>

        <h2 className="mb-2" style={{ fontSize: '1.75rem' }}>
          Map & Register Tree
        </h2>
        <p className="mb-6">
          Record tree dimensions and GPS location to track ecological impact.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid mb-6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Tree Species</label>
                <select
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                >
                  {Object.keys(GROWTH_FACTORS).map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Circumference (cm) <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(at 1.4m)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 140"
                  value={formData.circumference}
                  onChange={(e) => setFormData({ ...formData, circumference: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Habitat Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Birds nesting, specific fauna"
                  value={formData.habitat}
                  onChange={(e) => setFormData({ ...formData, habitat: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>GPS Location</label>
                {location ? (
                  <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                      🍃 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </span>
                  </div>
                ) : (
                  <button className="btn btn-outline" onClick={getLocation} disabled={isGettingLocation}>
                    <Icon name="MapPin" size={18} />
                    {isGettingLocation ? 'Locating...' : 'Get Current Location'}
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="form-group">
                <label>Tree Photo</label>
                {!photo ? (
                  <div className="photo-capture-area" onClick={takePhoto}>
                    <video ref={videoRef} autoPlay playsInline style={{ display: cameraActive ? 'block' : 'none' }}></video>
                    {!cameraActive && (
                      <div className="text-center">
                        <Icon name="Camera" size={40} className="mb-2" style={{ color: 'var(--color-primary)' }} />
                        <p style={{ fontSize: '0.9rem' }}>Tap to capture tree photo</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="photo-capture-area">
                    <img src={photo} alt="Tree Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

                {cameraActive && !photo && (
                  <button className="btn btn-primary mt-4" style={{ width: '100%' }} onClick={takePhoto}>
                    <Icon name="Camera" size={18} /> Snap Photo
                  </button>
                )}
              </div>

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
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

// --- AI INSIGHT MODAL (ARBOREAL AGE ANALYTICS REPORT) ---
const AiInsightModal = ({ tree, onClose }) => {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (tree) {
      setLoading(true);
      generateEcologicalInsight(tree)
        .then((res) => {
          if (isMounted) {
            setInsight(res || '');
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Error generating AI insight:', err);
          if (isMounted) {
            setInsight('');
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [tree]);

  if (!tree) return null;

  const displayLat = typeof tree.lat === 'number' ? tree.lat.toFixed(6) : (tree.lat || '20.013100');
  const displayLng = typeof tree.lng === 'number' ? tree.lng.toFixed(6) : (tree.lng || '73.821316');
  const scientificName = BOTANICAL_NAMES[tree.species] || 'Tropical Flora';

  const annualCo2 = ((tree.co2 || 400) / Math.max(1, tree.age || 1)).toFixed(1);
  const dailyO2 = ((tree.age * 22) / 365 * 0.05).toFixed(1);
  const canopyCover = Math.round(15 + (tree.age || 20) * 1.5);
  const reportId = `NSK-2026-${String(tree.id).padStart(3, '0')}`;
  const hash = Math.abs((tree.id * 2654435761) % 4294967295).toString(16).slice(0, 8);

  const mediaUrl = (name) => `http://localhost:8000/api/epicollect/media?name=${name}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-glass-card aaa-report-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <Icon name="X" size={20} />
        </button>

        {/* HEADER BOX */}
        <div className="aaa-header-box">
          <div className="aaa-title">Arboreal Age Analytics (AAA)</div>
          <div className="aaa-subtitle">ECOLOGICAL ASSESSMENT REPORT</div>
          <div className="aaa-meta-bar">
            <span>REPORT ID: {reportId}</span>
            <span>DATE: August 01, 2026</span>
            <span>LOCATION: Nashik, Maharashtra, India</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p style={{ fontWeight: 600, color: 'var(--color-primary-dark)', marginTop: '0.75rem' }}>
              Computing Arboreal Analytics & Ecological Metrics...
            </p>
          </div>
        ) : (
          <>
            {/* SECTION 1: BOTANICAL PROFILE */}
            <div className="mb-6">
              <div className="aaa-section-title">
                <Icon name="Leaf" size={16} /> 1. TREE IDENTIFICATION & BOTANICAL PROFILE
              </div>
              <div className="aaa-profile-grid">
                <div className="aaa-profile-card">
                  <div className="aaa-profile-label">Common Name</div>
                  <div className="aaa-profile-val">{tree.species}</div>
                </div>
                <div className="aaa-profile-card">
                  <div className="aaa-profile-label">Scientific Name</div>
                  <div className="aaa-profile-val"><em>{scientificName}</em></div>
                </div>
                <div className="aaa-profile-card">
                  <div className="aaa-profile-label">Estimated Age</div>
                  <div className="aaa-profile-val">{tree.age} Years</div>
                </div>
                <div className="aaa-profile-card">
                  <div className="aaa-profile-label">Canopy Cover</div>
                  <div className="aaa-profile-val">~{canopyCover} sq. meters</div>
                </div>
                <div className="aaa-profile-card">
                  <div className="aaa-profile-label">Health Status</div>
                  <div className="aaa-profile-val" style={{ color: 'var(--color-primary-dark)' }}>Optimal / Prime Growth</div>
                </div>
                <div className="aaa-profile-card">
                  <div className="aaa-profile-label">Coordinates</div>
                  <div className="aaa-profile-val" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{displayLat}, {displayLng}</div>
                </div>
              </div>
            </div>

            {/* SECTION 1.5: FIELD PHOTOGRAPHS */}
            {(tree.bark_photo || tree.leaf_photo || tree.height_photo) && (
              <div className="mb-6">
                <div className="aaa-section-title">
                  <Icon name="Camera" size={16} /> 1.5. FIELD SURVEY PHOTOGRAPHS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                  {tree.bark_photo && (
                    <button
                      type="button"
                      className="photo-thumb-btn"
                      onClick={() => setLightboxSrc(mediaUrl(tree.bark_photo))}
                      style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.4)', padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'zoom-in', width: '100%' }}
                    >
                      <img
                        src={mediaUrl(tree.bark_photo)}
                        alt="Bark"
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-dark)', marginTop: '0.35rem' }}>Trunk / Bark Photo</div>
                    </button>
                  )}
                  {tree.leaf_photo && (
                    <button
                      type="button"
                      className="photo-thumb-btn"
                      onClick={() => setLightboxSrc(mediaUrl(tree.leaf_photo))}
                      style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.4)', padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'zoom-in', width: '100%' }}
                    >
                      <img
                        src={mediaUrl(tree.leaf_photo)}
                        alt="Leaf"
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-dark)', marginTop: '0.35rem' }}>Leaf / Foliage Photo</div>
                    </button>
                  )}
                  {tree.height_photo && (
                    <button
                      type="button"
                      className="photo-thumb-btn"
                      onClick={() => setLightboxSrc(mediaUrl(tree.height_photo))}
                      style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.4)', padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'zoom-in', width: '100%' }}
                    >
                      <img
                        src={mediaUrl(tree.height_photo)}
                        alt="Full Tree"
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-dark)', marginTop: '0.35rem' }}>Height / Full Canopy</div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: ENVIRONMENTAL IMPACT DASHBOARD */}
            <div className="mb-6">
              <div className="aaa-section-title">
                <Icon name="Activity" size={16} /> 2. ENVIRONMENTAL IMPACT DASHBOARD
              </div>
              <div className="aaa-impact-grid">
                <div className="aaa-impact-card">
                  <div className="metric-header">ANNUAL CARBON SEQUESTRATION</div>
                  <div className="metric-value">~{annualCo2} kg CO₂ / yr</div>
                </div>
                <div className="aaa-impact-card">
                  <div className="metric-header">DAILY OXYGEN PRODUCTION</div>
                  <div className="metric-value">~{dailyO2} kg O₂ / day</div>
                </div>
                <div className="aaa-impact-card">
                  <div className="metric-header">LIFETIME CARBON CAPTURE</div>
                  <div className="metric-value">~{tree.co2.toLocaleString()} kg CO₂</div>
                </div>
                <div className="aaa-impact-card">
                  <div className="metric-header">POLLUTANT ABSORPTION RATING</div>
                  <div className="metric-value" style={{ fontSize: '1.15rem' }}>High (PM2.5, PM10, SO₂)</div>
                </div>
              </div>
            </div>

            {/* SECTION 3: LOCAL ECOLOGICAL SIGNIFICANCE */}
            <div className="mb-6">
              <div className="aaa-section-title">
                <Icon name="Globe" size={16} /> 3. LOCAL ECOLOGICAL SIGNIFICANCE (NASHIK REGION)
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.75)', padding: '1rem', borderRadius: '12px', marginBottom: '0.85rem', lineHeight: 1.6, fontSize: '0.92rem' }}>
                At {tree.age} years old, this {tree.species} tree acts as an efficient natural air purifier in Nashik's climate zone. Its canopy provides crucial thermal comfort during hot months.
              </div>

              <div className="aaa-feature-list">
                <div className="aaa-feature-item">
                  <strong style={{ color: 'var(--color-primary-dark)', minWidth: '30px' }}>[✔]</strong>
                  <div>
                    <strong>Urban Cooling:</strong> Drops ambient ground temperatures by up to 3°C beneath its canopy.
                  </div>
                </div>
                <div className="aaa-feature-item">
                  <strong style={{ color: 'var(--color-primary-dark)', minWidth: '30px' }}>[✔]</strong>
                  <div>
                    <strong>Natural Microbe & Habitat Shield:</strong> Fosters essential nesting grounds for {tree.habitat || 'local avian species and beneficial pollinators'}.
                  </div>
                </div>
                <div className="aaa-feature-item">
                  <strong style={{ color: 'var(--color-primary-dark)', minWidth: '30px' }}>[✔]</strong>
                  <div>
                    <strong>Soil & Monsoon Protection:</strong> Deep root structures stabilize soil during heavy monsoons and aid local groundwater recharge.
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: RECOMMENDED CONSERVATION STATUS */}
            <div className="mb-6">
              <div className="aaa-section-title">
                <Icon name="ShieldCheck" size={16} /> 4. RECOMMENDED CONSERVATION STATUS
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <span className="aaa-badge-action">ACTION REQUIRED: Preserve & Protect</span>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text)', lineHeight: 1.6, marginTop: '0.4rem' }}>
                  This {tree.species} is currently operating at peak ecological output. Maintain an unpaved root perimeter radius of at least 1.5 meters to ensure continued carbon sequestration for another 30–50 years.
                </p>
              </div>
            </div>

            {/* FOOTER BAR */}
            <div className="aaa-footer-bar">
              <span>Generated via Arboreal Analytics Platform</span>
              <span>Verification Hash: {hash}</span>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Icon name="Printer" size={16} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close Assessment
          </button>
        </div>
      </div>

      {lightboxSrc && (
        <div
          className="image-lightbox-backdrop"
          onClick={(e) => { e.stopPropagation(); setLightboxSrc(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Full size photo"
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightboxSrc(null); }}
            aria-label="Close photo"
          >
            <Icon name="X" size={22} />
          </button>
          <img
            src={lightboxSrc}
            alt="Full size field photo"
            className="image-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};


// --- MAIN APP COMPONENT ---
const App = () => {
  const [trees, setTrees] = useState([]);
  const [loadingTrees, setLoadingTrees] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAiTree, setSelectedAiTree] = useState(null);
  const mapInstanceRef = useRef(null);
  const [highlightedTreeId, setHighlightedTreeId] = useState(null);

  useEffect(() => {
    async function loadLiveTrees() {
      try {
        setLoadingTrees(true);
        const res = await fetch('http://localhost:8000/api/epicollect/trees');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setTrees(data);
      } catch (error) {
        console.error('Failed to load Epicollect trees:', error);
      } finally {
        setLoadingTrees(false);
      }
    }
    loadLiveTrees();
  }, []);


  const handleFocusTree = (tree) => {
    if (!tree.lat || !tree.lng) return;
    // Highlight this pin on the map
    setHighlightedTreeId(tree.id);
    // Fly to it
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([tree.lat, tree.lng], 19, { duration: 1.2 });
    }
    // Clear highlight after 4 seconds
    setTimeout(() => setHighlightedTreeId(null), 4000);
  };

  const handleAddTree = (newTree) => {
    setTrees([newTree, ...trees]);
  };

  return (
    <div className="app-container">
      {/* Top Floating Brand Badge */}
      <header className="top-brand-header">
        <div className="brand-logo">
          <Icon name="Trees" size={26} />
          <h1>uniquevan</h1>
        </div>
        <span className="brand-badge">{loadingTrees ? 'Loading...' : `${trees.length} Trees Mapped`}</span>
      </header>

      {/* Main Fullscreen Map */}
      <FullscreenMap
        trees={trees}
        onSelectAiTree={(tree) => setSelectedAiTree(tree)}
        mapInstanceRef={mapInstanceRef}
        highlightedTreeId={highlightedTreeId}
      />

      {/* Liquid Glass Sidebar Menu */}
      <SidebarMenu
        onOpenAddModal={() => setShowAddModal(true)}
        trees={trees}
        onFocusTree={handleFocusTree}
      />




      {/* Add Tree Liquid Glass Modal */}
      {showAddModal && (
        <MapTreeModal onClose={() => setShowAddModal(false)} onAddTree={handleAddTree} />
      )}

      {/* AI Insight Glass Modal */}
      {selectedAiTree && (
        <AiInsightModal tree={selectedAiTree} onClose={() => setSelectedAiTree(null)} />
      )}
    </div>
  );
};

export default App;
