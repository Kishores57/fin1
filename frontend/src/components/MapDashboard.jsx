import React, { useState, useEffect, useRef } from 'react';
import '../mapStyles.css';
import { generateEcologicalInsight } from '../services/aiService';
import SidebarMenu from './SidebarMenu';
import { API_BASE_URL, registeredTreeApi } from '../services/api';
import UnifiedTreeReport from './UnifiedTreeReport';
import L, { createTileLayer, BASEMAP_TILES } from '../utils/mapConfig';

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
const FullscreenMap = ({ trees, onSelectAiTree, onViewAnalysis, mapInstanceRef, highlightedTreeId, focusedTree }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapTheme, setMapTheme] = useState('satellite'); // 'satellite' | 'voyager' | 'dark'
  const dotMarkersRef = useRef({});      // CircleMarkers keyed by tree.id
  const highlightRingRef = useRef(null); // extra pulsing ring for highlighted tree
  const hasFittedRef = useRef(false);
  const treesRef = useRef(trees);
  const highlightedRef = useRef(highlightedTreeId);
  const focusedRef = useRef(focusedTree);

  useEffect(() => { treesRef.current = trees; }, [trees]);
  useEffect(() => { highlightedRef.current = highlightedTreeId; }, [highlightedTreeId]);
  useEffect(() => { focusedRef.current = focusedTree; }, [focusedTree]);

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
      const isHighlighted = (highlightedRef.current && String(tree.id) === String(highlightedRef.current)) ||
                            (focusedRef.current && String(tree.id) === String(focusedRef.current.id));

      let dot = dotMarkersRef.current[tree.id];
      if (!dot) {
        // eslint-disable-next-line no-undef
        dot = L.marker([tree.lat, tree.lng], {
          icon: getTreeIcon(tree, zoom, isHighlighted),
          bubblingMouseEvents: false,
        });

        const photoUrl = tree.photo || (tree.leaf_photo || tree.bark_photo || tree.height_photo
          ? `${API_BASE_URL}/api/epicollect/media?type=photo&name=${encodeURIComponent(tree.leaf_photo || tree.bark_photo || tree.height_photo)}`
          : null);
        const color = impactColor(tree.impact);

        const popupContent = `
          <div class="custom-tree-popup-card">
            <div class="custom-tree-popup-header">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background-color: ${color}; box-shadow: 0 0 6px ${color};"></span>
                <strong style="color: #047857; font-size: 13px;">${tree.species || tree.treeName}</strong>
              </div>
              <span class="custom-tree-popup-id">#${tree.id || tree.treeId}</span>
            </div>

            ${tree.scientificName ? `<div style="font-size: 10px; font-style: italic; color: #64748b; margin-top: -3px; margin-bottom: 6px;">${tree.scientificName}</div>` : ''}

            ${photoUrl ? `
              <div style="width: 100%; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; background: #f1f5f9; border: 1px solid #e2e8f0;">
                <img src="${photoUrl}" alt="${tree.species}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
              </div>
            ` : ''}

            <div class="custom-tree-popup-grid">
              <div><span style="color: #64748b;">GBH:</span> <strong>${tree.circumference || tree.gbh || 'N/A'} cm</strong></div>
              <div><span style="color: #64748b;">Height:</span> <strong>${tree.height || 'N/A'} m</strong></div>
              <div><span style="color: #64748b;">Est. Age:</span> <strong>~${tree.age || 1} yrs</strong></div>
              <div><span style="color: #64748b;">CO₂:</span> <strong>${Math.round(tree.co2 || 0).toLocaleString()} kg</strong></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b; margin-bottom: 8px;">
              <span>📍 Lat: ${Number(tree.lat).toFixed(5)}, Lng: ${Number(tree.lng).toFixed(5)}</span>
              <span style="font-weight: 700; color: ${color}; text-transform: uppercase;">${tree.impact || 'Normal'}</span>
            </div>

            <div style="display: flex; gap: 6px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
              <button
                type="button"
                class="popup-report-btn"
                data-tree-id="${tree.id}"
                style="flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 700; background: #047857; color: white; border: none; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s;"
              >
                🌳 Full AI Report
              </button>
            </div>
          </div>
        `;

        dot.bindPopup(popupContent, { maxWidth: 280, className: 'custom-tree-popup-wrapper' });

        dot.on('mouseover', function () {
          const z = mapInstance.current ? mapInstance.current.getZoom() : zoom;
          const activeIcon = getTreeIcon(tree, z, true);
          this.setIcon(activeIcon);
        });

        dot.on('mouseout', function () {
          const z = mapInstance.current ? mapInstance.current.getZoom() : zoom;
          const hl = (highlightedRef.current && String(tree.id) === String(highlightedRef.current)) ||
                     (focusedRef.current && String(tree.id) === String(focusedRef.current.id));
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
    const targetId = highlightedRef.current || (focusedRef.current ? focusedRef.current.id : null);
    if (!targetId || !mapInstance.current) return;

    const tree = treesRef.current.find(
      (t) => String(t.id) === String(targetId)
    ) || (focusedRef.current && String(focusedRef.current.id) === String(targetId) ? focusedRef.current : null);

    if (!tree || !tree.lat || !tree.lng) return;

    // eslint-disable-next-line no-undef
    highlightRingRef.current = L.circleMarker([tree.lat, tree.lng], {
      radius:      26,
      color:       '#10b981',
      weight:      3,
      fillColor:   '#34d399',
      fillOpacity: 0.35,
      className:   'highlight-ring-animated',
      interactive: false,
    }).addTo(mapInstance.current);
  };

  const handleZoom = () => {
    if (!mapInstance.current) return;
    const zoom = mapInstance.current.getZoom();
    Object.entries(dotMarkersRef.current).forEach(([id, dot]) => {
      const tree = treesRef.current.find((t) => String(t.id) === String(id));
      if (tree) {
        const hl = (highlightedRef.current && String(id) === String(highlightedRef.current)) ||
                   (focusedRef.current && String(id) === String(focusedRef.current.id));
        dot.setIcon(getTreeIcon(tree, zoom, hl));
      }
    });
  };

  // Switch basemap tiles dynamically when user clicks Satellite, Light, or Dark Slate
  useEffect(() => {
    if (!mapInstance.current) return;
    if (tileLayerRef.current) {
      mapInstance.current.removeLayer(tileLayerRef.current);
    }
    const cfg = BASEMAP_TILES[mapTheme] || BASEMAP_TILES.satellite;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 22,
      maxNativeZoom: cfg.maxNativeZoom || 18,
    }).addTo(mapInstance.current);
    tileLayerRef.current.bringToBack();
  }, [mapTheme]);

  // Open marker popup when a tree is highlighted or targeted
  useEffect(() => {
    const targetId = highlightedTreeId || (focusedTree ? focusedTree.id : null);
    if (!targetId || !mapInstance.current) return;

    updateHighlightRing();

    const timer = setTimeout(() => {
      const marker = dotMarkersRef.current[targetId];
      if (marker && mapInstance.current) {
        marker.openPopup();
      } else {
        const t = treesRef.current.find((x) => String(x.id) === String(targetId)) || focusedTree;
        if (t && t.lat && t.lng && mapInstance.current) {
          const color = impactColor(t.impact);
          // eslint-disable-next-line no-undef
          L.popup({ maxWidth: 280, className: 'custom-tree-popup-wrapper' })
            .setLatLng([t.lat, t.lng])
            .setContent(`
              <div class="custom-tree-popup-card">
                <div class="custom-tree-popup-header">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background-color: ${color};"></span>
                    <strong style="color: #047857; font-size: 13px;">${t.species || t.treeName}</strong>
                  </div>
                  <span class="custom-tree-popup-id">#${t.id || t.treeId}</span>
                </div>
                <div style="font-size: 11px; margin-top: 4px; color: #334155;">📍 Pointed Specimen at K.K. Wagh Campus</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 2px;">GPS: ${Number(t.lat).toFixed(5)}, ${Number(t.lng).toFixed(5)}</div>
                <div style="display: flex; gap: 6px; border-top: 1px solid #f1f5f9; padding-top: 6px; margin-top: 6px;">
                  <button
                    type="button"
                    class="popup-report-btn"
                    data-tree-id="${t.id || ''}"
                    style="flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 700; background: #047857; color: white; border: none; border-radius: 8px; cursor: pointer; text-align: center;"
                  >
                    🌳 Full AI Report
                  </button>
                </div>
              </div>
            `)
            .openOn(mapInstance.current);
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [highlightedTreeId, focusedTree]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl:      false,
        scrollWheelZoom:  true,
        doubleClickZoom:  true,
        touchZoom:        true,
        boxZoom:          true,
        maxZoom:          22,
        minZoom:          3,
      }).setView([20.013100, 73.821316], 17);

      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

      const cfg = BASEMAP_TILES[mapTheme] || BASEMAP_TILES.satellite;
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: 22,
        maxNativeZoom: cfg.maxNativeZoom || 18,
      }).addTo(mapInstance.current);

      mapInstance.current.on('zoomend', handleZoom);

      // Handle popup action button clicks
      mapInstance.current.on('popupopen', (e) => {
        const el = e.popup.getElement();
        if (!el) return;
        const reportBtn = el.querySelector('.popup-report-btn');
        if (reportBtn) {
          reportBtn.onclick = () => {
            const id = reportBtn.getAttribute('data-tree-id');
            const t = treesRef.current.find((x) => String(x.id) === String(id)) || focusedRef.current;
            if (t && onSelectAiTree) onSelectAiTree(t);
          };
        }
      });
    }

    if (mapInstanceRef) mapInstanceRef.current = mapInstance.current;

    // Force size recalculations to guarantee map tiles render with 0 blank/gray spots
    const handleResize = () => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 400);

    updateDots();
    updateHighlightRing();

    if (trees.length > 0 && !hasFittedRef.current) {
      if (highlightedRef.current || focusedRef.current) {
        hasFittedRef.current = true;
      } else {
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
    }
  }, [trees, highlightedTreeId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '72vh', minHeight: '580px', borderRadius: '24px', overflow: 'hidden' }}>
      {/* Floating Basemap Switcher Pod (Matches Map Analysis exactly) */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 500,
        pointerEvents: 'auto',
      }}>
        <div style={{
          background: 'rgba(11, 25, 38, 0.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '16px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {Object.entries(BASEMAP_TILES).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMapTheme(key)}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mapTheme === key ? '#10b981' : 'transparent',
                color: mapTheme === key ? '#ffffff' : '#94a3b8',
                boxShadow: mapTheme === key ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div ref={mapRef} className="fullscreen-map" style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}></div>
    </div>
  );
};

// --- MAP TREE FORM MODAL ---
const MapTreeModal = ({ onClose, onAddTree }) => {
  const [formData, setFormData] = useState({
    species: 'Rain Tree',
    circumference: '',
    habitat: '',
    latitude: '',
    longitude: '',
  });
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
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

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by device');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('Acquiring precise satellite GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const acc = Math.round(pos.coords.accuracy || 10);
        setFormData((f) => ({ ...f, latitude: lat, longitude: lng }));
        setGpsStatus(`GPS Locked: [${lat}, ${lng}] (±${acc}m)`);
        setGpsLoading(false);
      },
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            const acc = Math.round(pos.coords.accuracy || 150);
            setFormData((f) => ({ ...f, latitude: lat, longitude: lng }));
            setGpsStatus(`Network location: [${lat}, ${lng}] (±${acc}m)`);
            setGpsLoading(false);
          },
          () => {
            setGpsStatus('GPS failed. Enter coordinates manually.');
            setGpsLoading(false);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.circumference) return;

    const lat = parseFloat(formData.latitude) || 20.013100;
    const lng = parseFloat(formData.longitude) || 73.821316;

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

            {/* GPS Coordinates & Capture */}
            <div className="form-group full-width">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>Coordinates (Lat, Lng)</label>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={gpsLoading}
                  style={{
                    background: '#047857',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Icon name="Crosshair" size={13} />
                  {gpsLoading ? 'Locating...' : 'Capture GPS'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Latitude (e.g. 20.0131)"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="form-input-box"
                />
                <input
                  type="text"
                  placeholder="Longitude (e.g. 73.8213)"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="form-input-box"
                />
              </div>
              {gpsStatus && (
                <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px', fontWeight: 600 }}>
                  {gpsStatus}
                </div>
              )}
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

// --- ERROR BOUNDARY FOR REPORT RENDERING ---
class ReportErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ReportErrorBoundary caught rendering error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#f87171' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>🌳</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.5rem' }}>
            Unable to Display Tree Report
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '1.25rem', maxWidth: '460px', margin: '0 auto 1.25rem' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred while generating this tree report.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: 'rgba(52, 211, 153, 0.2)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              color: '#34d399',
              padding: '0.5rem 1.25rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            Retry Report
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

        <ReportErrorBoundary>
          <UnifiedTreeReport tree={tree} mode="interactive" />
        </ReportErrorBoundary>

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
export const MapDashboard = ({
  refreshKey = 0,
  onViewAnalysis,
  targetTree = null,
  onTargetTreeHandled,
  onReturnToSurvey,
}) => {
  const [trees, setTrees] = useState([]);
  const [loadingTrees, setLoadingTrees] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAiTree, setSelectedAiTree] = useState(null);
  const [selectedMongoTree, setSelectedMongoTree] = useState(null);
  const mapInstanceRef = useRef(null);
  const [highlightedTreeId, setHighlightedTreeId] = useState(null);
  const [focusedTree, setFocusedTree] = useState(null);

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
              lat: Number(t.latitude),
              lng: Number(t.longitude),
              leaf_photo: t.images?.leaf || null,
              bark_photo: t.images?.bark || null,
              height_photo: t.images?.tree || null,
              leafImage: t.images?.leaf || null,
              barkImage: t.images?.bark || null,
              fullImage: t.images?.tree || null,
              photo: t.images?.leaf || t.images?.tree || t.images?.bark || null,
              images: t.images,
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

  // Live real-time update when tree is registered in OverviewTreeLab or TreeRegistration
  useEffect(() => {
    const handleTreeRegistered = (e) => {
      const t = e.detail;
      if (!t || !t.latitude || !t.longitude) return;
      const mapped = {
        id: 950000 + (Date.now() % 100000),
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
        healthStatus: t.healthStatus || 'Healthy',
        impact: 'High',
        lat: Number(t.latitude),
        lng: Number(t.longitude),
        leaf_photo: t.images?.leaf || null,
        bark_photo: t.images?.bark || null,
        height_photo: t.images?.tree || null,
        photo: t.images?.leaf || t.images?.tree || t.images?.bark || null,
        source: 'mongo',
        createdAt: t.createdAt || new Date().toISOString(),
        raw: t,
      };
      setTrees((prev) => [mapped, ...prev]);
      if (mapInstanceRef.current && Number.isFinite(mapped.lat) && Number.isFinite(mapped.lng)) {
        mapInstanceRef.current.flyTo([mapped.lat, mapped.lng], 18, { duration: 1.0 });
      }
    };
    window.addEventListener('tree-registered', handleTreeRegistered);
    return () => window.removeEventListener('tree-registered', handleTreeRegistered);
  }, []);

  // Handle incoming targetTree from Epicollect Survey or external navigations
  useEffect(() => {
    if (!targetTree || !targetTree.lat || !targetTree.lng) return;

    setFocusedTree(targetTree);
    setHighlightedTreeId(targetTree.id);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetTree.lat, targetTree.lng], 19, { duration: 1.2 });
    }

    if (onTargetTreeHandled) {
      onTargetTreeHandled();
    }
  }, [targetTree]);

  // When trees finish loading, if a tree was targeted, match with full details from trees list
  useEffect(() => {
    if (focusedTree && trees.length > 0) {
      const match = trees.find((t) =>
        (focusedTree.id && String(t.id) === String(focusedTree.id)) ||
        (focusedTree.uuid && String(t.uuid) === String(focusedTree.uuid)) ||
        (Math.abs(t.lat - focusedTree.lat) < 0.00008 && Math.abs(t.lng - focusedTree.lng) < 0.00008)
      );
      if (match) {
        setFocusedTree(match);
        setHighlightedTreeId(match.id);
      }
    }
  }, [trees]);

  const handleFocusTree = (tree) => {
    if (!tree || !tree.lat || !tree.lng) return;
    setFocusedTree(tree);
    setHighlightedTreeId(tree.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([tree.lat, tree.lng], 19, { duration: 1.2 });
    }
  };

  const handleAddTree = (newTree) => {
    setTrees([newTree, ...trees]);
  };

  const handleSelectTree = (tree) => {
    setSelectedAiTree(tree);
  };

  return (
    <div className="relative w-full">
      {/* Map loading spinner */}
      {loadingTrees && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex flex-col items-center justify-center text-center">
          <div className="spinner mb-4"></div>
          <p className="text-slate-200 font-bold text-lg">Syncing with Epicollect5 Live Survey Database...</p>
          <p className="text-slate-400 text-xs mt-1">Retrieving entries, mapping coordinates & calculating tree age metrics</p>
        </div>
      )}

      {/* Floating Focus HUD pill when a tree is pointed */}
      {focusedTree && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 600,
          background: 'rgba(11, 25, 38, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(52, 211, 153, 0.5)',
          borderRadius: '18px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.45), 0 0 25px rgba(52, 211, 153, 0.25)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#ffffff',
          maxWidth: 'min(92vw, 560px)',
          pointerEvents: 'auto',
          animation: 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#6ee7b7' }} className="truncate">
                {focusedTree.species || focusedTree.treeName}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                background: 'rgba(16, 185, 129, 0.25)',
                color: '#a7f3d0',
                padding: '1px 6px',
                borderRadius: '6px',
                border: '1px solid rgba(52, 211, 153, 0.35)',
              }}>
                EPIC-{focusedTree.id || focusedTree.treeId}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
              GPS: {Number(focusedTree.lat).toFixed(5)}, {Number(focusedTree.lng).toFixed(5)} · {focusedTree.age ? `~${focusedTree.age} yrs` : 'Live Specimen'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setSelectedAiTree(focusedTree)}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              AI Report
            </button>
            {onReturnToSurvey && (
              <button
                type="button"
                onClick={onReturnToSurvey}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="Return to Epicollect Survey list"
              >
                Survey ➔
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setFocusedTree(null);
                setHighlightedTreeId(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                padding: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
              }}
              title="Close indicator"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Fullscreen Map */}
      <FullscreenMap
        trees={trees}
        onSelectAiTree={handleSelectTree}
        onViewAnalysis={onViewAnalysis}
        mapInstanceRef={mapInstanceRef}
        highlightedTreeId={highlightedTreeId}
        focusedTree={focusedTree}
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
            const targetId = treeToDelete.mongoId || treeToDelete.treeId || treeToDelete.id;
            // Optimistic UI update: instantly remove from map and close modal
            setTrees((prev) => prev.filter((t) => t.id !== treeToDelete.id && t.mongoId !== treeToDelete.mongoId && t.treeId !== treeToDelete.treeId));
            setSelectedAiTree(null);
            try {
              await registeredTreeApi.remove(targetId);
            } catch (e) {
              console.error('Failed to delete tree from database:', e);
              alert(e.response?.data?.detail || e.message || 'Delete failed');
            }
          }}
        />
      )}
    </div>
  );
};

export default MapDashboard;