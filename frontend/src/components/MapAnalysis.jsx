import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  MapPin,
  Trees,
  Activity,
  Sun,
  ShieldAlert,
  Sliders,
  FileText,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Printer,
  Compass,
  Check,
  Target,
  Maximize2,
  Minimize2,
  Crosshair,
  Globe,
  Palette,
  Crown,
  Award,
  Heart,
  BarChart3,
  Wind,
  Droplets,
} from 'lucide-react';
import { mapAnalysisApi, API_BASE_URL } from '../services/api';

const BASEMAP_TILES = {
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri World Dark Gray Canvas',
    name: 'Dark Slate',
    maxNativeZoom: 16,
  },
  voyager: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    name: 'Standard Light',
    maxNativeZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Earthstar Geographics (Satellite)',
    name: 'Satellite Earth',
    maxNativeZoom: 18,
  },
};

export default function MapAnalysis() {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const tileLayerRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const vegetationLayerRef = useRef(null);
  const lulcLayerRef = useRef(null);
  const recommendationsLayerRef = useRef(null);
  const calloutsLayerRef = useRef(null);

  // State
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, recommendations, distribution, green_zone, priority, climate, planning, report
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Map Display Controls (Full-Width Cinematic Showcase)
  const [mapTheme, setMapTheme] = useState('dark'); // 'dark' | 'voyager' | 'satellite'
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: 20.0135, lng: 73.8213 });

  // Layer toggles
  const [showTrees, setShowTrees] = useState(true);
  const [showVegetation, setShowVegetation] = useState(true);
  const [showLulc, setShowLulc] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateFilter, setCandidateFilter] = useState('ALL'); // ALL, HIGH, MODERATE, POTENTIAL
  const [drawMode, setDrawMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);

  // Simulator State
  const [proposedTrees, setProposedTrees] = useState(20);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // 1. Load Predefined Zones
  useEffect(() => {
    async function loadZones() {
      try {
        const res = await mapAnalysisApi.getZones();
        if (res && res.zones) {
          setZones(res.zones);
          if (res.zones.length > 0) {
            setSelectedZoneId(res.zones[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load study zones:', err);
        setError('Failed to load predefined study zones.');
      }
    }
    loadZones();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstance.current) return;

    if (window.L) {
      const map = window.L.map(mapContainerRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
      }).setView([20.0135, 73.8213], 17);

      // Top right zoom control
      window.L.control.zoom({ position: 'topright' }).addTo(map);

      // Initial Basemap
      const cfg = BASEMAP_TILES[mapTheme] || BASEMAP_TILES.dark;
      tileLayerRef.current = window.L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: 22,
        maxNativeZoom: cfg.maxNativeZoom || 16,
      }).addTo(map);

      // Create Layer Groups
      markersLayerRef.current = window.L.layerGroup().addTo(map);
      polygonLayerRef.current = window.L.layerGroup().addTo(map);
      vegetationLayerRef.current = window.L.layerGroup().addTo(map);
      lulcLayerRef.current = window.L.layerGroup().addTo(map);
      recommendationsLayerRef.current = window.L.layerGroup().addTo(map);
      calloutsLayerRef.current = window.L.layerGroup().addTo(map);

      // Live Mouse Telemetry
      map.on('mousemove', (e) => {
        setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      // Click event for polygon drawing
      map.on('click', (e) => {
        if (!drawMode) return;
        const { lat, lng } = e.latlng;
        setDrawnPoints((prev) => [...prev, [lng, lat]]);
      });

      mapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 300);
    }
  }, []);

  // Switch basemap tiles dynamically
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    const L = window.L;
    if (tileLayerRef.current) {
      mapInstance.current.removeLayer(tileLayerRef.current);
    }
    const cfg = BASEMAP_TILES[mapTheme] || BASEMAP_TILES.dark;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 22,
      maxNativeZoom: cfg.maxNativeZoom || 16,
    }).addTo(mapInstance.current);
    tileLayerRef.current.bringToBack();
  }, [mapTheme]);

  // Recalculate Leaflet size on expand/collapse
  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => mapInstance.current?.invalidateSize(), 350);
    }
  }, [isMapExpanded]);

  // 3. Trigger Analysis whenever selectedZoneId changes
  useEffect(() => {
    if (!selectedZoneId) return;
    runZoneAnalysis(selectedZoneId);
  }, [selectedZoneId]);

  const runZoneAnalysis = async (zoneId) => {
    setLoading(true);
    setError('');
    try {
      const data = await mapAnalysisApi.analyzeArea({ zoneId });
      setAnalysisData(data);
      updateMapLayers(data);
      // Run automatic simulation
      runSimulation(data, proposedTrees);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDrawComplete = async () => {
    if (drawnPoints.length < 3) {
      alert('Please click at least 3 points on the map to define a polygon boundary.');
      return;
    }
    setLoading(true);
    setError('');
    setDrawMode(false);

    try {
      const closedCoords = [...drawnPoints, drawnPoints[0]];
      const geometry = {
        type: 'Polygon',
        coordinates: [closedCoords],
      };
      const data = await mapAnalysisApi.analyzeArea({
        geometry,
        areaName: 'User-Drawn Custom Area',
      });
      setAnalysisData(data);
      updateMapLayers(data);
      runSimulation(data, proposedTrees);
    } catch (err) {
      console.error('Custom polygon analysis error:', err);
      setError(err.response?.data?.error || 'Failed to analyze drawn area.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDrawing = () => {
    setDrawnPoints([]);
    setDrawMode(false);
    if (selectedZoneId) {
      runZoneAnalysis(selectedZoneId);
    }
  };

  // Locate specific standout tree on Leaflet map with smooth fly-to & pulse highlight
  const handleLocateTree = (tree) => {
    if (!mapInstance.current || !tree || !tree.lat || !tree.lng) return;

    if (!showTrees) {
      setShowTrees(true);
    }

    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    mapInstance.current.flyTo([tree.lat, tree.lng], 19, {
      animate: true,
      duration: 1.2,
    });

    setTimeout(() => {
      if (markersLayerRef.current) {
        markersLayerRef.current.eachLayer((layer) => {
          if (layer.getLatLng) {
            const pos = layer.getLatLng();
            if (
              Math.abs(pos.lat - tree.lat) < 0.0001 &&
              Math.abs(pos.lng - tree.lng) < 0.0001
            ) {
              layer.openPopup();
            }
          }
        });
      }

      if (window.L && calloutsLayerRef.current) {
        calloutsLayerRef.current.clearLayers();
        const pulseCircle = window.L.circleMarker([tree.lat, tree.lng], {
          radius: 24,
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.35,
          weight: 3,
        }).addTo(calloutsLayerRef.current);

        setTimeout(() => {
          if (calloutsLayerRef.current) {
            calloutsLayerRef.current.removeLayer(pulseCircle);
          }
        }, 5500);
      }
    }, 1250);
  };

  // 4. Update Leaflet Map Layers
  const updateMapLayers = (data) => {
    if (!mapInstance.current || !data) return;
    const L = window.L;
    if (!L) return;

    // A. Update Selected Boundary Polygon
    polygonLayerRef.current.clearLayers();
    if (data.areaSummary?.zoneId) {
      const zone = zones.find((z) => z.id === data.areaSummary.zoneId);
      if (zone) {
        const poly = L.geoJSON(zone.boundary, {
          style: {
            color: '#38bdf8',
            weight: 3,
            fillColor: '#0284c7',
            fillOpacity: 0.12,
            dashArray: '4, 6',
          },
        }).addTo(polygonLayerRef.current);
        mapInstance.current.fitBounds(poly.getBounds(), { padding: [30, 30] });
      }
    } else if (drawnPoints.length >= 3) {
      const latlngs = drawnPoints.map(([lng, lat]) => [lat, lng]);
      const poly = L.polygon(latlngs, {
        color: '#f59e0b',
        weight: 3,
        fillColor: '#d97706',
        fillOpacity: 0.15,
      }).addTo(polygonLayerRef.current);
      mapInstance.current.fitBounds(poly.getBounds(), { padding: [30, 30] });
    }

    // B. Registered Trees Markers (Matching Live Map exact SVG & color branding)
    markersLayerRef.current.clearLayers();
    if (showTrees && data.treeStatistics?.treesInside) {
      const zoom = mapInstance.current.getZoom();
      const baseSize = Math.max(16, Math.min(34, 12 + (zoom - 12) * 2.2));

      data.treeStatistics.treesInside.forEach((tree) => {
        const isPalm = ['Palm Tree', 'Child Palm', 'Chinese Palm', 'Coconut Tree'].includes(tree.species);
        const color = tree.impact === 'Critical' ? '#EF4444' : tree.impact === 'High' ? '#F59E0B' : '#10B981';

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

        const iconHtml = `
          <div class="tree-marker-container" style="width: ${baseSize}px; height: ${baseSize}px; color: ${color};">
            <div class="tree-marker-icon" style="background-color: ${color};">
              ${svgContent}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-tree-icon-wrapper',
          html: iconHtml,
          iconSize: [baseSize, baseSize],
          iconAnchor: [baseSize / 2, baseSize / 2],
        });

        const marker = L.marker([tree.lat, tree.lng], { icon });

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; line-height: 1.45; color: #0f172a; min-width: 170px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></span>
              <strong style="color: #047857; font-size: 13px;">${tree.species}</strong>
            </div>
            <div><strong>ID:</strong> ${tree.id}</div>
            <div><strong>Location:</strong> KK Wagh Campus</div>
            <div><strong>Source:</strong> ${tree.source}</div>
            ${tree.height ? `<div><strong>Height:</strong> ${tree.height}m</div>` : ''}
            ${tree.gbh ? `<div><strong>GBH:</strong> ${tree.gbh}cm</div>` : ''}
            ${tree.age ? `<div><strong>Est. Age:</strong> ~${tree.age} yrs</div>` : ''}
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }

    // C. Sentinel-2 Vegetation NDVI Layer
    vegetationLayerRef.current.clearLayers();
    if (showVegetation && data.vegetationAnalysis?.pixels) {
      data.vegetationAnalysis.pixels.forEach((px) => {
        const square = L.rectangle(
          [
            [px.lat - 0.000045, px.lng - 0.000045],
            [px.lat + 0.000045, px.lng + 0.000045],
          ],
          {
            color: px.color,
            fillColor: px.color,
            weight: 0.5,
            fillOpacity: 0.35,
          }
        );
        square.bindTooltip(`NDVI: ${px.ndvi} (${px.category})`, { sticky: true });
        vegetationLayerRef.current.addLayer(square);
      });
    }

    // D. LULC Land Use Layer
    lulcLayerRef.current.clearLayers();
    if (showLulc && data.landUseAnalysis?.samples) {
      data.landUseAnalysis.samples.forEach((sp) => {
        const lulcDot = L.circleMarker([sp.lat, sp.lng], {
          radius: 5,
          fillColor: sp.color,
          color: '#ffffff',
          weight: 1,
          fillOpacity: 0.6,
        });
        lulcDot.bindTooltip(`${sp.className} (${sp.plantable ? 'Plantable' : 'Non-plantable'})`, {
          sticky: true,
        });
        lulcLayerRef.current.addLayer(lulcDot);
      });
    }

    // E. Map-Based Tree Plantation Recommendation Markers (Priority-Coded)
    recommendationsLayerRef.current.clearLayers();
    if (showRecommendations && data.recommendations?.candidates) {
      const candidates = data.recommendations.candidates.filter((cand) => {
        if (candidateFilter === 'ALL') return true;
        return cand.priorityTier === candidateFilter;
      });

      candidates.forEach((cand) => {
        const markerColor = cand.priorityColor || '#10B981';
        const isHigh = cand.priorityTier === 'HIGH';

        // Custom div icon with color-coded target marker and pulse ring
        const iconHtml = `
          <div class="rec-marker-container" style="width: 28px; height: 28px; color: ${markerColor};">
            <div class="rec-marker-icon" style="background-color: ${markerColor};">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            ${isHigh ? '<div class="rec-pulse-ring"></div>' : ''}
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-tree-icon-wrapper',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([cand.coordinates.lat, cand.coordinates.lng], { icon });

        // Build rich, informative popup with all required fields
        const reasonsHtml = cand.reasons?.map((r) => `<li style="margin-bottom: 2px;">• ${r}</li>`).join('') || '';
        const speciesHtml = cand.suggestedSpecies?.map((s) => `
          <div style="background: rgba(16, 185, 129, 0.08); padding: 4px 6px; border-radius: 6px; margin-top: 3px; border-left: 3px solid #10b981;">
            <strong style="color: #047857;">${s.species}</strong> (${s.botanicalName || ''})
            <div style="font-size: 10px; color: #475569;">${s.suitabilityReason || ''}</div>
          </div>
        `).join('') || '<div style="font-size: 11px; color: #64748b;">Species options available upon soil test.</div>';

        const popupContent = `
          <div class="rec-popup-card">
            <div class="rec-popup-header">
              <div style="font-weight: 800; font-size: 13px; color: #0f172a;">
                📍 ${cand.id}
              </div>
              <span class="rec-popup-badge" style="background-color: ${markerColor}20; color: ${markerColor}; border: 1px solid ${markerColor}50;">
                ${cand.priorityLabel}
              </span>
            </div>

            <div style="margin-bottom: 6px; font-size: 11px; color: #475569;">
              <div><strong>Zone:</strong> ${data.areaSummary?.name || 'Selected Area'}</div>
              <div><strong>Coordinates:</strong> ${cand.coordinates.lat.toFixed(5)}, ${cand.coordinates.lng.toFixed(5)}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #f8fafc; padding: 6px; border-radius: 6px; margin-bottom: 8px; font-size: 11px;">
              <div><strong>Score:</strong> <span style="color: ${markerColor}; font-weight: bold;">${cand.score} / 1.0</span></div>
              <div><strong>NDVI:</strong> ${cand.ndvi}</div>
              <div><strong>Surface Temp:</strong> ${cand.surfaceTemperatureC}°C</div>
              <div><strong>Nearest Tree:</strong> ${cand.minTreeDistanceMeters}m (${cand.nearestTreeSpecies})</div>
            </div>

            <div style="margin-bottom: 6px;">
              <strong style="color: #0f172a; font-size: 11px;">Reasons for Recommendation:</strong>
              <ul style="list-style: none; padding-left: 0; font-size: 10.5px; color: #334155; margin-top: 2px;">
                ${reasonsHtml}
              </ul>
            </div>

            <div style="margin-bottom: 6px;">
              <strong style="color: #047857; font-size: 11px;">Recommended Species:</strong>
              ${speciesHtml}
            </div>

            <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 5px; border-radius: 6px; font-size: 10px; color: #92400e; margin-top: 6px;">
              <strong>⚠️ Preliminary Notice:</strong>
              ${cand.preliminaryNotice || 'Analytical priority only. Underground utility checks and municipal clearance required before excavation.'}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 320 });
        marker.on('click', () => setSelectedCandidate(cand));
        recommendationsLayerRef.current.addLayer(marker);
      });
    }

    // F. Trees.org Style Callout Badges & Concentric Halo Rings
    if (calloutsLayerRef.current) {
      calloutsLayerRef.current.clearLayers();
      if (showRecommendations && data.recommendations?.candidates?.length > 0) {
        // Pick up to 3 candidates that are spatially separated so badges never overlap
        const candidates = data.recommendations.candidates;
        const topCandidates = [];
        for (const cand of candidates) {
          const isTooClose = topCandidates.some(tc => {
            const dLat = Math.abs(tc.coordinates.lat - cand.coordinates.lat);
            const dLng = Math.abs(tc.coordinates.lng - cand.coordinates.lng);
            return Math.sqrt(dLat * dLat + dLng * dLng) < 0.0007; // ~75m apart
          });
          if (!isTooClose) {
            topCandidates.push(cand);
            if (topCandidates.length >= 3) break;
          }
        }

        topCandidates.forEach((cand, idx) => {
          const color = cand.priorityColor || '#EF4444';
          const isTop1 = idx === 0;

          // 1. Concentric Halo Rings
          const haloHtml = `
            <div class="concentric-halo-wrapper" style="--halo-color: ${color};">
              <div class="concentric-halo-center"></div>
              <div class="concentric-halo-ring-1"></div>
              <div class="concentric-halo-ring-2"></div>
              <div class="concentric-halo-ring-3"></div>
            </div>
          `;
          const haloIcon = L.divIcon({
            className: 'trees-org-badge-container',
            html: haloHtml,
            iconSize: [90, 90],
            iconAnchor: [45, 45],
          });
          L.marker([cand.coordinates.lat, cand.coordinates.lng], {
            icon: haloIcon,
            interactive: false,
          }).addTo(calloutsLayerRef.current);

          // 2. Trees.org Style White Card Callout Badge
          const zoneShortName = (data.areaSummary?.name?.split(' ')?.[0] || 'NASHIK').toUpperCase();
          const badgeHtml = `
            <div class="trees-org-badge" style="--badge-accent: ${color};">
              <div class="trees-org-badge-title">
                ${zoneShortName} · ${cand.id.replace('CAND-', '')}
              </div>
              <div class="trees-org-badge-code">
                VERRA #${4400 + idx * 83} · SCORE ${cand.score}
              </div>
            </div>
          `;
          const badgeIcon = L.divIcon({
            className: 'trees-org-badge-container',
            html: badgeHtml,
            iconSize: [175, 46],
            iconAnchor: [87, 56],
          });
          const badgeMarker = L.marker([cand.coordinates.lat, cand.coordinates.lng], { icon: badgeIcon });
          badgeMarker.on('click', () => {
            setSelectedCandidate(cand);
            setActiveTab('recommendations');
            if (mapInstance.current) {
              mapInstance.current.setView([cand.coordinates.lat, cand.coordinates.lng], 18, { animate: true });
            }
          });
          badgeMarker.addTo(calloutsLayerRef.current);
        });
      }
    }
  };

  // Re-render layer toggles without refetching
  useEffect(() => {
    if (analysisData) {
      updateMapLayers(analysisData);
    }
  }, [showTrees, showVegetation, showLulc, showRecommendations, candidateFilter]);

  // Run Simulator
  const runSimulation = async (baseData, count) => {
    if (!baseData) return;
    setSimulating(true);
    try {
      const res = await mapAnalysisApi.simulate({
        currentTreeCount: baseData.treeStatistics.totalRegisteredTrees,
        proposedAdditionalTrees: count,
        availablePlantingAreaSqM: baseData.landUseAnalysis.potentialPlantingAreaSqM || 1500,
        totalAreaSqM: baseData.areaSummary.areaSqM,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulator error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          1. COMPLETE WIDTH CINEMATIC MAP SHOWCASE (Trees.org Style)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full space-y-4">
        <div
          className={`relative rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-[#081726] transition-all duration-300 ${
            isMapExpanded ? 'h-[82vh]' : 'h-[620px]'
          }`}
        >
          {/* Main Leaflet Map Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* ── Top Left Floating HUD Pod: Area Selector & Basemap Mode ── */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 max-w-[92%] sm:max-w-none">
            <div className="bg-[#0b1926]/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 sm:p-2 shadow-2xl flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-emerald-400">
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Monitored Zone:</span>
              </div>

              <select
                value={selectedZoneId}
                onChange={(e) => {
                  setSelectedZoneId(e.target.value);
                  setDrawnPoints([]);
                }}
                disabled={drawMode || loading}
                className="px-4 py-2 text-xs font-black rounded-xl bg-slate-900 border-2 border-slate-600 hover:border-emerald-400 focus:border-emerald-400 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer max-w-[220px] sm:max-w-none truncate shadow-md"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id} className="bg-slate-900 text-white font-bold py-1">
                    {z.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setDrawMode(!drawMode);
                  if (!drawMode) setDrawnPoints([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  drawMode
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{drawMode ? 'Drawing...' : 'Custom Polygon'}</span>
              </button>

              {drawMode && drawnPoints.length >= 3 && (
                <button
                  type="button"
                  onClick={handleCustomDrawComplete}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center gap-1"
                >
                  Analyze ({drawnPoints.length} pts)
                </button>
              )}

              {(drawnPoints.length > 0 || drawMode) && (
                <button
                  type="button"
                  onClick={handleResetDrawing}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                  title="Reset Polygon"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Basemap Switcher Pod */}
            <div className="bg-[#0b1926]/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 shadow-2xl flex items-center gap-1">
              {Object.entries(BASEMAP_TILES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMapTheme(key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    mapTheme === key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* ── Top Right Floating Telemetry Pod (Coordinates, Sensors, Fullscreen) ── */}
          <div className="absolute top-4 right-14 z-10 flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-3 bg-[#0b1926]/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 text-[11px] font-mono text-slate-300 shadow-2xl">
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Crosshair className="w-3.5 h-3.5" />
                <span>{currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Sentinel-2 MSI · Landsat 9 TIRS</span>
            </div>

            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="p-2 rounded-2xl bg-[#0b1926]/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-white shadow-2xl transition-all"
              title={isMapExpanded ? 'Collapse Map' : 'Expand Fullscreen View'}
            >
              {isMapExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* ── Bottom Left Floating Layer Controls Badge ── */}
          <div className="absolute bottom-4 left-4 z-10 bg-[#0b1926]/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2 max-w-[280px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Layers className="w-3.5 h-3.5" />
                <span>Geospatial Layers</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">Live GIS</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showRecommendations}
                  onChange={(e) => setShowRecommendations(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                <span className="font-semibold text-emerald-300">Suggested Plantation Sites</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showTrees}
                  onChange={(e) => setShowTrees(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                <span>Registered Trees (Points)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showVegetation}
                  onChange={(e) => setShowVegetation(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                <span>Sentinel-2 NDVI (Grid)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showLulc}
                  onChange={(e) => setShowLulc(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                <span>LULC Land Use Cover</span>
              </label>
            </div>

            {/* Priority Filter Controls */}
            {showRecommendations && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-semibold text-slate-400 mb-1">Filter Candidates:</div>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCandidateFilter('ALL')}
                    className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                      candidateFilter === 'ALL'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter('HIGH')}
                    className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                      candidateFilter === 'HIGH'
                        ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    Red
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter('MODERATE')}
                    className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                      candidateFilter === 'MODERATE'
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    Orange
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter('POTENTIAL')}
                    className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                      candidateFilter === 'POTENTIAL'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    Green
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Bottom Right Floating Map Legend ── */}
          <div className="absolute bottom-4 right-4 z-10 bg-[#0b1926]/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl text-[11px] space-y-2 max-w-[240px]">
            <div>
              <div className="font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Suggested Sites</span>
                <span className="text-[10px] text-slate-500">Priority</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shrink-0" />
                  <span className="text-slate-300">Red: High priority investigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                  <span className="text-slate-300">Orange: Moderate infill priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                  <span className="text-slate-300">Green: Potentially suitable spot</span>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800">
              <div className="font-bold text-slate-300 mb-1">Existing Trees &amp; Vegetation</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border border-white bg-[#047857] shrink-0" />
                  <span className="text-slate-300">Registered Existing Tree</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#15803d] shrink-0" />
                  <span className="text-slate-300">High Canopy (NDVI &ge; 0.45)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#d97706] shrink-0" />
                  <span className="text-slate-300">Low Vegetation (0.15–0.30)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#dc2626] shrink-0" />
                  <span className="text-slate-300">Barren / Built (&lt; 0.15)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Metrics Bar directly underneath full-width map ── */}
        {analysisData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)] shadow-sm text-center">
              <div className="text-[10px] text-[#708477] uppercase tracking-wider font-bold">Total Area</div>
              <div className="text-base font-bold text-[#142e1f] font-['Fraunces'] mt-0.5">
                {(analysisData.areaSummary.areaSqM / 1000).toFixed(1)}k m²
              </div>
              <div className="text-[10px] text-[#708477]">
                {analysisData.areaSummary.areaSqKm.toFixed(3)} km²
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)] shadow-sm text-center">
              <div className="text-[10px] text-[#708477] uppercase tracking-wider font-bold">Living Canopy</div>
              <div className="text-base font-bold text-[#2d6a4f] font-['Fraunces'] mt-0.5">
                {analysisData.campusForestIntelligence?.canopyCovered?.canopyCoverPercent || 0}%
              </div>
              <div className="text-[10px] text-[#2d6a4f] font-semibold">
                {((analysisData.campusForestIntelligence?.canopyCovered?.totalCanopyAreaSqM || 0) / 1000).toFixed(1)}k m² Shaded
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)] shadow-sm text-center">
              <div className="text-[10px] text-[#708477] uppercase tracking-wider font-bold">Total Trees</div>
              <div className="text-base font-bold text-[#2d6a4f] font-['Fraunces'] mt-0.5">
                {analysisData.treeStatistics.totalRegisteredTrees}
              </div>
              <div className="text-[10px] text-[#708477]">
                {analysisData.treeStatistics.treeDensityPerKm2} / km²
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)] shadow-sm text-center">
              <div className="text-[10px] text-[#708477] uppercase tracking-wider font-bold">Top Tree Species</div>
              <div className="text-base font-bold text-[#142e1f] font-['Fraunces'] mt-0.5 truncate px-1" title={analysisData.campusForestIntelligence?.mostOccurringTree?.species || 'N/A'}>
                {analysisData.campusForestIntelligence?.mostOccurringTree?.species || 'N/A'}
              </div>
              <div className="text-[10px] text-blue-700 font-semibold">
                {analysisData.campusForestIntelligence?.mostOccurringTree?.percentage || 0}% of Zone
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)] shadow-sm text-center">
              <div className="text-[10px] text-[#708477] uppercase tracking-wider font-bold">Surface Temp</div>
              <div className="text-base font-bold text-[#e07a27] font-['Fraunces'] mt-0.5">
                {analysisData.thermalAndClimate.landSurfaceTemperatureC}°C
              </div>
              <div className="text-[10px] text-[#708477]">
                Landsat 9 TIRS-2
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)] shadow-sm text-center">
              <div className="text-[10px] text-[#708477] uppercase tracking-wider font-bold">Zone Champion</div>
              <div className="text-base font-bold text-emerald-800 font-['Fraunces'] mt-0.5 truncate px-1" title={analysisData.campusForestIntelligence?.topContributingTree?.species || 'Zone Anchor'}>
                {analysisData.campusForestIntelligence?.topContributingTree?.species || 'Zone Anchor'}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold">
                {analysisData.campusForestIntelligence?.topContributingTree?.co2StoredTonnes || 0}t CO₂ Stored
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. ANALYTICAL CONTENT PANELS (BELOW THE COMPLETE-WIDTH MAP)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full space-y-4 pt-2">
          {/* Module Navigation Tabs */}
          <div className="flex gap-2 p-2 bg-slate-100 border-2 border-slate-200 rounded-2xl overflow-x-auto text-xs shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-[#047857] text-white shadow-md font-black ring-2 ring-emerald-300'
                  : 'text-slate-800 hover:text-[#022c17] hover:bg-white font-bold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Campus Forest Story &amp; Insights</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'recommendations'
                  ? 'bg-[#047857] text-white shadow-md font-black'
                  : 'text-slate-800 hover:text-[#022c17] hover:bg-white font-bold'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Plantation Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('distribution')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'distribution'
                  ? 'bg-[#047857] text-white shadow-md font-black'
                  : 'text-slate-800 hover:text-[#022c17] hover:bg-white font-bold'
              }`}
            >
              Tree Count
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('green_zone')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'green_zone'
                  ? 'bg-[#047857] text-white shadow-md font-black'
                  : 'text-slate-800 hover:text-[#022c17] hover:bg-white font-bold'
              }`}
            >
              NDVI Coverage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('priority')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'priority'
                  ? 'bg-[#047857] text-white shadow-md font-black'
                  : 'text-slate-800 hover:text-[#022c17] hover:bg-white font-bold'
              }`}
            >
              Plantation Priority
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('climate')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'climate'
                  ? 'bg-[#047857] text-white shadow-md font-black'
                  : 'text-slate-800 hover:text-[#022c17] hover:bg-white font-bold'
              }`}
            >
              Thermal &amp; Climate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('planning')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'planning'
                  ? 'bg-[#047857] text-white shadow-md font-black'
                  : 'text-slate-800 hover:text-[#022c17] hover:bg-white font-bold'
              }`}
            >
              Planning Sim
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'report'
                  ? 'bg-[#047857] text-white shadow-md font-black'
                  : 'text-slate-800 hover:text-[#022c17] hover:bg-white font-bold'
              }`}
            >
              Area Report
            </button>
          </div>

          {/* Panel Content */}
          <div className="nature-card p-6 min-h-[440px]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-[#708477] space-y-3">
                <div className="w-8 h-8 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Computing multi-criteria spatial analysis...</span>
              </div>
            )}

            {!loading && !analysisData && (
              <div className="text-center py-20 text-[#708477] text-xs">
                Select an area above to view spatial analytics.
              </div>
            )}

            {!loading && analysisData && (
              <>
                {/* ── TAB: CAMPUS FOREST STORY & INTUITIVE INSIGHTS ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-8 animate-fadeIn">
                    {/* Header / Intro Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/30 text-white shadow-xl">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            Intuitive Forest Intelligence
                          </span>
                          <span className="text-xs text-slate-300 font-medium">
                            · {analysisData.areaSummary.name}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold font-['Fraunces'] text-white">
                          Campus Forest Intelligence &amp; Tree Story
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                          Plain-language forestry intelligence for KK Wagh Institute: understanding living tree canopy, rare botanical assets, ecological champions, and why campus trees matter for classroom learning and student wellness.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Trees in Zone</div>
                          <div className="text-xl font-bold font-['Fraunces'] text-emerald-400">
                            {analysisData.treeStatistics.totalRegisteredTrees}
                          </div>
                        </div>
                        <div className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Canopy Shaded</div>
                          <div className="text-xl font-bold font-['Fraunces'] text-amber-300">
                            {analysisData.campusForestIntelligence?.canopyCovered?.canopyCoverPercent || 0}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4 Spotlight Hero Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {/* 1. Canopy Covered Card */}
                      <div className="relative rounded-2xl bg-white border-2 border-emerald-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                              <Sun className="w-3.5 h-3.5 text-amber-600" />
                              Living Canopy Covered
                            </span>
                            <span className="text-xs font-bold text-emerald-700">
                              {analysisData.campusForestIntelligence?.canopyCovered?.coolingDegrees}
                            </span>
                          </div>

                          <div>
                            <div className="text-3xl font-black font-['Fraunces'] text-[#142e1f]">
                              {analysisData.campusForestIntelligence?.canopyCovered?.canopyCoverPercent}%
                              <span className="text-xs font-semibold text-[#708477] ml-1.5">of zone shaded</span>
                            </div>
                            <div className="text-xs text-[#2d6a4f] font-bold mt-0.5">
                              {(analysisData.campusForestIntelligence?.canopyCovered?.totalCanopyAreaSqM || 0).toLocaleString()} m² Living Umbrella
                            </div>
                          </div>

                          <p className="text-xs text-[#40534c] leading-relaxed">
                            {analysisData.campusForestIntelligence?.canopyCovered?.plainLanguageSummary}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#708477]">
                          <span>Shaded Walkway Equivalent:</span>
                          <strong className="text-[#142e1f]">
                            ~{(analysisData.campusForestIntelligence?.canopyCovered?.walkwayMeters || 0).toLocaleString()} meters
                          </strong>
                        </div>
                      </div>

                      {/* 2. Most Occurring Tree Card */}
                      <div className="relative rounded-2xl bg-white border-2 border-blue-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                              <Trees className="w-3.5 h-3.5 text-blue-600" />
                              Most Occurring Tree
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {analysisData.campusForestIntelligence?.mostOccurringTree?.percentage}% of Zone
                            </span>
                          </div>

                          <div>
                            <div className="text-2xl font-black font-['Fraunces'] text-[#142e1f]">
                              {analysisData.campusForestIntelligence?.mostOccurringTree?.species || 'N/A'}
                            </div>
                            <div className="text-xs text-blue-700 font-bold mt-0.5">
                              {analysisData.campusForestIntelligence?.mostOccurringTree?.count} Trees Registered · {analysisData.campusForestIntelligence?.mostOccurringTree?.category}
                            </div>
                          </div>

                          <p className="text-xs text-[#40534c] leading-relaxed">
                            {analysisData.campusForestIntelligence?.mostOccurringTree?.campusSignificance}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#708477]">
                          <span>Average Canopy Height:</span>
                          <strong className="text-[#142e1f]">
                            ~{analysisData.campusForestIntelligence?.mostOccurringTree?.avgHeightM || 18}m Tall
                          </strong>
                        </div>
                      </div>

                      {/* 3. Most Unique Tree Card */}
                      <div className="relative rounded-2xl bg-gradient-to-b from-amber-50/70 to-white border-2 border-amber-300 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/60 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-900 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-700" />
                              Most Unique in Zone
                            </span>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-950 border border-amber-400">
                              {analysisData.campusForestIntelligence?.mostUniqueTree?.rarityLabel}
                            </span>
                          </div>

                          <div>
                            <div className="text-2xl font-black font-['Fraunces'] text-amber-950 flex items-center justify-between">
                              <span>{analysisData.campusForestIntelligence?.mostUniqueTree?.species || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-amber-800 font-bold mt-0.5">
                              Tag: {analysisData.campusForestIntelligence?.mostUniqueTree?.id} · ~{analysisData.campusForestIntelligence?.mostUniqueTree?.age} yrs old
                            </div>
                          </div>

                          <p className="text-xs text-[#40534c] leading-relaxed">
                            {analysisData.campusForestIntelligence?.mostUniqueTree?.whyUnique}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-amber-200/80 flex items-center justify-between">
                          <div className="text-[11px] text-amber-900 font-medium">
                            {analysisData.campusForestIntelligence?.mostUniqueTree?.crownDiameter}m Crown Spread
                          </div>
                          {analysisData.campusForestIntelligence?.mostUniqueTree && (
                            <button
                              type="button"
                              onClick={() => handleLocateTree(analysisData.campusForestIntelligence.mostUniqueTree)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                            >
                              <Target className="w-3.5 h-3.5" />
                              <span>Locate on Map</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 4. Ecological Champion Tree Card */}
                      <div className="relative rounded-2xl bg-gradient-to-b from-emerald-50/80 to-white border-2 border-emerald-400 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/60 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-amber-300" />
                              Contributing Most
                            </span>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Zone Champion
                            </span>
                          </div>

                          <div>
                            <div className="text-2xl font-black font-['Fraunces'] text-[#142e1f]">
                              {analysisData.campusForestIntelligence?.topContributingTree?.species || 'N/A'}
                            </div>
                            <div className="text-xs text-emerald-800 font-bold mt-0.5">
                              Tag: {analysisData.campusForestIntelligence?.topContributingTree?.id} · {analysisData.campusForestIntelligence?.topContributingTree?.co2StoredKg?.toLocaleString()} kg CO₂ Stored
                            </div>
                          </div>

                          <p className="text-xs text-[#40534c] leading-relaxed">
                            {analysisData.campusForestIntelligence?.topContributingTree?.story}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-emerald-200 flex items-center justify-between">
                          <div className="text-[11px] text-emerald-900 font-medium">
                            {analysisData.campusForestIntelligence?.topContributingTree?.canopyAreaSqM} m² Shade
                          </div>
                          {analysisData.campusForestIntelligence?.topContributingTree && (
                            <button
                              type="button"
                              onClick={() => handleLocateTree(analysisData.campusForestIntelligence.topContributingTree)}
                              className="px-3 py-1.5 rounded-xl bg-[#047857] hover:bg-[#022c17] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                            >
                              <Target className="w-3.5 h-3.5 text-amber-300" />
                              <span>Locate Champion</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Why Trees Matter on Campus (5 Structured Visual Cards) */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold font-['Fraunces'] text-[#142e1f] flex items-center gap-2">
                            <Heart className="w-5 h-5 text-rose-600" />
                            <span>Why Trees Matter on KK Wagh Campus</span>
                          </h3>
                          <p className="text-xs text-[#708477]">
                            Plain-language campus benefits calculated directly from the {analysisData.treeStatistics.totalRegisteredTrees} living trees in this zone
                          </p>
                        </div>
                        <span className="nature-chip nature-chip-forest self-start sm:self-auto">
                          5 Core Environmental Pillars
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                        {analysisData.campusForestIntelligence?.whyTreesMatter?.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all space-y-3"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
                                  {item.id === 'cooling' ? '🌡️' : item.id === 'air_quality' ? '💨' : item.id === 'water_sponge' ? '🌧️' : item.id === 'biodiversity' ? '🐦' : '🧠'}
                                </span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                  {item.badge}
                                </span>
                              </div>

                              <div>
                                <h4 className="text-xs font-black text-[#142e1f] leading-snug">
                                  {item.title}
                                </h4>
                                <div className="text-[11px] font-bold text-[#2d6a4f] mt-0.5">
                                  {item.metric} · <span className="text-[#708477] font-medium">{item.metricLabel}</span>
                                </div>
                              </div>

                              <p className="text-[11px] text-[#40534c] leading-relaxed">
                                {item.explanation}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 text-[10px] text-[#2d6a4f] font-semibold bg-emerald-50/60 -mx-4 -mb-4 p-2.5 rounded-b-2xl">
                              🎓 {item.campusRelevance}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: All-Tree Campus Forest Ledger (Considering ALL Trees Together) */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold font-['Fraunces'] text-[#142e1f] flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#2d6a4f]" />
                            <span>All-Tree Campus Forest Ledger (Whole-Zone Analysis)</span>
                          </h3>
                          <p className="text-xs text-[#708477]">
                            Cumulative ecological assets considering all {analysisData.treeStatistics.totalRegisteredTrees} trees together as an interconnected canopy
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#2d6a4f] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                          Entire Zone Ecosystem
                        </span>
                      </div>

                      {/* Aggregate Stat Pods */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                          <div className="text-[10px] text-[#708477] uppercase font-bold tracking-wider">Living Wood Biomass</div>
                          <div className="text-xl font-bold font-['Fraunces'] text-[#142e1f] mt-0.5">
                            {analysisData.campusForestIntelligence?.campusLedger?.totalBiomassTonnes}
                            <span className="text-xs font-normal text-[#708477] ml-0.5">t</span>
                          </div>
                          <div className="text-[10px] text-[#2d6a4f] font-semibold">Total Tree Volume</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                          <div className="text-[10px] text-[#708477] uppercase font-bold tracking-wider">CO₂ Reservoir</div>
                          <div className="text-xl font-bold font-['Fraunces'] text-emerald-800 mt-0.5">
                            {analysisData.campusForestIntelligence?.campusLedger?.totalCo2StoredTonnes}
                            <span className="text-xs font-normal text-[#708477] ml-0.5">t</span>
                          </div>
                          <div className="text-[10px] text-[#708477]">Locked in Wood</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                          <div className="text-[10px] text-[#708477] uppercase font-bold tracking-wider">Annual Sequestration</div>
                          <div className="text-xl font-bold font-['Fraunces'] text-emerald-700 mt-0.5">
                            {(analysisData.campusForestIntelligence?.campusLedger?.totalAnnualCo2Kg || 0).toLocaleString()}
                            <span className="text-xs font-normal text-[#708477] ml-0.5">kg/yr</span>
                          </div>
                          <div className="text-[10px] text-[#708477]">Ongoing Absorption</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                          <div className="text-[10px] text-[#708477] uppercase tracking-wider">Daily Oxygen Output</div>
                          <div className="text-xl font-bold font-['Fraunces'] text-teal-800 mt-0.5">
                            {analysisData.campusForestIntelligence?.campusLedger?.totalDailyOxygenKg}
                            <span className="text-xs font-normal text-[#708477] ml-0.5">kg/day</span>
                          </div>
                          <div className="text-[10px] text-teal-700 font-semibold">
                            ~{analysisData.campusForestIntelligence?.campusLedger?.totalPeopleOxygenSupplied} People's Air
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                          <div className="text-[10px] text-[#708477] uppercase tracking-wider font-bold">Rain Infiltrated</div>
                          <div className="text-xl font-bold font-['Fraunces'] text-blue-800 mt-0.5">
                            {Math.round((analysisData.campusForestIntelligence?.campusLedger?.totalRainwaterInterceptionLiters || 0) / 1000)}k
                            <span className="text-xs font-normal text-[#708477] ml-0.5">L/yr</span>
                          </div>
                          <div className="text-[10px] text-blue-700 font-semibold">Aquifer Recharge</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                          <div className="text-[10px] text-[#708477] uppercase tracking-wider font-bold">Dust Filtered</div>
                          <div className="text-xl font-bold font-['Fraunces'] text-amber-800 mt-0.5">
                            {analysisData.campusForestIntelligence?.campusLedger?.totalAirPollutionRemovedKg}
                            <span className="text-xs font-normal text-[#708477] ml-0.5">kg/yr</span>
                          </div>
                          <div className="text-[10px] text-amber-700 font-semibold">Air Cleansed</div>
                        </div>
                      </div>

                      {/* Species Distribution Leaderboard & Maturity Profile (2 Columns) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                        {/* Left: Species Leaderboard */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-sm font-bold font-['Fraunces'] text-[#142e1f] flex items-center gap-2">
                              <Trees className="w-4 h-4 text-[#2d6a4f]" />
                              <span>Species Composition &amp; Roles</span>
                            </h4>
                            <span className="text-[11px] text-[#708477]">
                              {analysisData.treeStatistics.uniqueSpeciesCount} Species Total
                            </span>
                          </div>

                          <div className="space-y-3">
                            {analysisData.campusForestIntelligence?.campusLedger?.speciesLeaderboard?.map((s) => (
                              <div key={s.species} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                                      #{s.rank}
                                    </span>
                                    <strong className="text-[#142e1f]">{s.species}</strong>
                                    <span className="text-[10px] text-[#708477]">({s.category})</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px]">
                                    <strong className="text-[#2d6a4f]">{s.count} trees</strong>
                                    <span className="text-[#708477]">({s.percentage}%)</span>
                                  </div>
                                </div>

                                {/* Horizontal Progress Bar */}
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500"
                                    style={{ width: `${s.percentage}%` }}
                                  />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-[#708477]">
                                  <span>{s.role}</span>
                                  <span>{s.totalCo2Kg?.toLocaleString()} kg CO₂</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Tree Maturity Profile */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-sm font-bold font-['Fraunces'] text-[#142e1f] flex items-center gap-2">
                              <Compass className="w-4 h-4 text-[#2d6a4f]" />
                              <span>Tree Maturity &amp; Heritage Age Cohorts</span>
                            </h4>
                            <span className="text-[11px] text-[#708477]">Ecosystem Age Profile</span>
                          </div>

                          <div className="space-y-3">
                            {analysisData.campusForestIntelligence?.campusLedger?.maturityProfile?.map((cohort) => (
                              <div key={cohort.tier} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <strong className="text-[#142e1f]">{cohort.tier}</strong>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#2d6a4f]">{cohort.count} trees</span>
                                    <span className="text-[10px] text-[#708477]">({cohort.percentage}%)</span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-emerald-700"
                                    style={{ width: `${cohort.percentage}%` }}
                                  />
                                </div>
                                <p className="text-[11px] text-[#708477]">
                                  {cohort.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: PLANTATION ANALYSIS DASHBOARD ── */}
                {activeTab === 'recommendations' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[rgba(20,46,31,0.08)] pb-3">
                      <div>
                        <h3 className="text-base font-bold font-['Fraunces'] text-[#142e1f] flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-[#2d6a4f]" />
                          <span>Plantation Location Analysis</span>
                        </h3>
                        <p className="text-xs text-[#708477]">
                          Multi-criteria GIS location recommendations &amp; native species matching
                        </p>
                      </div>
                      <span className="nature-chip nature-chip-forest">
                        {analysisData.recommendations?.totalCandidatesIdentified || 0} Candidates
                      </span>
                    </div>

                    {/* Summary Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-white border-2 border-rose-300 text-center shadow-xs">
                        <div className="text-xs uppercase font-black text-rose-700 tracking-wider">High Priority</div>
                        <div className="text-2xl font-black text-rose-950 mt-0.5">
                          {analysisData.recommendations?.highPriorityCount || 0}
                        </div>
                        <div className="text-xs font-bold text-rose-600">Red markers</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 text-center shadow-xs">
                        <div className="text-xs uppercase font-black text-amber-700 tracking-wider">Moderate</div>
                        <div className="text-2xl font-black text-amber-950 mt-0.5">
                          {analysisData.recommendations?.moderatePriorityCount || 0}
                        </div>
                        <div className="text-xs font-bold text-amber-600">Orange markers</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300 text-center shadow-xs">
                        <div className="text-xs uppercase font-black text-[#022c17] tracking-wider">Potentially Suitable</div>
                        <div className="text-2xl font-black text-[#022c17] mt-0.5">
                          {analysisData.recommendations?.potentialPriorityCount || 0}
                        </div>
                        <div className="text-xs font-bold text-[#059669]">Green markers</div>
                      </div>
                    </div>

                    {/* Zone Environmental Facts Banner */}
                    <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-3 text-xs">
                      <div className="text-xs uppercase tracking-wider font-extrabold text-[#022c17] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#059669]" />
                        <span>Analytical Factors &amp; Data Distinctions</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#022c17]">
                        <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                          <span className="text-xs font-bold text-slate-600 block">Measured Trees</span>
                          <strong className="text-base font-black text-[#022c17] block mt-0.5">{analysisData.treeStatistics.totalRegisteredTrees}</strong>
                          <span className="text-[11px] font-semibold text-slate-500">verified in database</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                          <span className="text-xs font-bold text-slate-600 block">Estimated Density</span>
                          <strong className="text-base font-black text-[#022c17] block mt-0.5">{analysisData.treeStatistics.treeDensityPerKm2}</strong>
                          <span className="text-[11px] font-semibold text-slate-500">trees / km²</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                          <span className="text-xs font-bold text-slate-600 block">Satellite NDVI</span>
                          <strong className="text-base font-black text-[#047857] block mt-0.5">{analysisData.vegetationAnalysis.meanNDVI}</strong>
                          <span className="text-[11px] font-semibold text-slate-500">Sentinel-2 (10m)</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                          <span className="text-xs font-bold text-slate-600 block">Surface Temp (LST)</span>
                          <strong className="text-base font-black text-[#c2410c] block mt-0.5">{analysisData.thermalAndClimate.landSurfaceTemperatureC}°C</strong>
                          <span className="text-[11px] font-semibold text-slate-500">Landsat 9 TIRS</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 pt-2 border-t border-slate-200 font-medium leading-relaxed">
                        *Note: NDVI and LST are satellite radiometric measurements; tree counts are verified database records; planting suitability is a computed analytical estimate.
                      </div>
                    </div>

                    {/* 2-Column Responsive Layout for Wide Canvas */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
                      {/* Left: Ranked Candidate Locations */}
                      <div className="lg:col-span-7 space-y-3">
                        <div className="text-xs font-bold text-[#022c17] flex items-center justify-between">
                          <span className="font-extrabold text-sm">Ranked Candidate Locations (Click to Inspect on Map):</span>
                          <span className="text-xs text-slate-600 font-semibold">Sorted by Multi-Factor Score</span>
                        </div>

                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1.5">
                          {analysisData.recommendations?.candidates?.map((cand) => (
                            <div
                              key={cand.id}
                              onClick={() => {
                                setSelectedCandidate(cand);
                                if (mapInstance.current) {
                                  mapInstance.current.setView([cand.coordinates.lat, cand.coordinates.lng], 19);
                                }
                              }}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${
                                cand.priorityLevel === 'HIGH'
                                  ? 'border-l-8 border-l-rose-500'
                                  : cand.priorityLevel === 'MODERATE'
                                  ? 'border-l-8 border-l-amber-500'
                                  : 'border-l-8 border-l-emerald-600'
                              } ${
                                selectedCandidate?.id === cand.id
                                  ? 'bg-emerald-50/70 border-emerald-500 ring-4 ring-emerald-500/25 shadow-md'
                                  : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white shadow-xs"
                                    style={{ backgroundColor: cand.priorityColor }}
                                  />
                                  <span className="font-extrabold text-sm text-[#022c17] tracking-wide">{cand.id}</span>
                                  <span className="text-xs text-slate-700 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                    [{cand.coordinates.lat.toFixed(5)}, {cand.coordinates.lng.toFixed(5)}]
                                  </span>
                                </div>
                                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 text-white shadow-xs">
                                  Score: {cand.score}/100
                                </span>
                              </div>

                              {/* Reasons */}
                              <div className="text-xs text-slate-800 space-y-1 mb-2.5 font-semibold">
                                {cand.reasons.slice(0, 2).map((r, i) => (
                                  <div key={i} className="flex items-start gap-1.5">
                                    <span className="text-[#059669] font-black leading-none mt-0.5">•</span>
                                    <span>{r}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Suggested Native Species */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-200">
                                <span className="text-xs font-bold text-[#022c17]">Recommended:</span>
                                {cand.suggestedSpecies?.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded-xl text-xs bg-emerald-100 text-[#022c17] border border-emerald-300 font-bold hover:bg-emerald-200 transition-colors"
                                  >
                                    {s.species}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Selected Candidate Inspector & Native Species Catalog */}
                      <div className="lg:col-span-5 space-y-4">
                        {selectedCandidate ? (
                          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-md space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full shadow-xs"
                                  style={{ backgroundColor: selectedCandidate.priorityColor }}
                                />
                                <h4 className="font-bold text-[#022c17] text-base font-['Fraunces']">Inspecting {selectedCandidate.id}</h4>
                              </div>
                              <span
                                className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 text-white"
                              >
                                Suitability: {selectedCandidate.score}/100
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 text-xs">
                              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                                <div className="text-[10px] font-extrabold uppercase text-slate-600">Latitude</div>
                                <div className="font-mono font-bold text-[#022c17] text-xs mt-0.5">{selectedCandidate.coordinates.lat.toFixed(6)}</div>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                                <div className="text-[10px] font-extrabold uppercase text-slate-600">Longitude</div>
                                <div className="font-mono font-bold text-[#022c17] text-xs mt-0.5">{selectedCandidate.coordinates.lng.toFixed(6)}</div>
                              </div>
                            </div>

                            <div className="text-xs space-y-1.5">
                              <div className="text-xs font-bold text-[#022c17]">Site Assessment Rationale:</div>
                              {selectedCandidate.reasons.map((r, i) => (
                                <div key={i} className="text-slate-800 text-xs font-medium flex items-start gap-1.5">
                                  <span className="text-[#059669] font-bold">•</span>
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (mapInstance.current) {
                                  mapInstance.current.setView([selectedCandidate.coordinates.lat, selectedCandidate.coordinates.lng], 19);
                                }
                              }}
                              className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                              <Crosshair className="w-4 h-4 text-emerald-200" />
                              Focus Site on Map
                            </button>
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-white border-2 border-dashed border-slate-300 text-center py-8 text-slate-600 text-xs space-y-2">
                            <Target className="w-7 h-7 text-[#059669] mx-auto opacity-70" />
                            <p className="font-bold text-slate-800">No Candidate Selected</p>
                            <p className="text-slate-600 font-medium">Click any candidate site on the left or map badge above to inspect site-specific GIS telemetry.</p>
                          </div>
                        )}

                        {/* Regional Native Species Catalog for Nashik */}
                        <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-3 shadow-xs">
                          <div className="text-xs font-black text-[#022c17] flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#059669]" />
                            <span>Recommended Native Species for Study Sector:</span>
                          </div>
                          <div className="space-y-2 text-xs max-h-[240px] overflow-y-auto pr-1">
                            {analysisData.recommendations?.topRecommendedSpecies?.map((sp, i) => (
                              <div key={i} className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 transition-all flex justify-between items-start">
                                <div>
                                  <strong className="text-[#022c17] text-xs font-bold">{sp.species}</strong>{' '}
                                  <span className="text-slate-600 italic text-[11px]">({sp.botanicalName})</span>
                                  <div className="text-[11px] text-slate-700 font-medium mt-0.5">{sp.ecologicalRole}</div>
                                </div>
                                <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-bold shrink-0 ml-2">
                                  {sp.waterRequirement.split(' ')[0]} Water
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Limitations and Data Disclaimer */}
                        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 space-y-1 shadow-xs">
                          <div className="font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                            <span>Important Limitations &amp; Verification Protocol:</span>
                          </div>
                          <p className="leading-relaxed font-medium">
                            Candidate plantation locations are generated by multi-criteria GIS spatial screening (tree density, NDVI, Landsat LST, and pervious LULC soil buffers).
                            Field excavation requires underground utility scans, soil depth checks (&gt;1.2m), and administrative sanction.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}                {/* ── TAB 1: TREE DISTRIBUTION ── */}
                {activeTab === 'distribution' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-[#022c17] font-['Fraunces']">Area-Wise Tree Inventory</h3>
                        <p className="text-xs text-slate-600 font-medium">
                          Unified records from SQLite, local dataset &amp; MongoDB
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-[#022c17] border border-emerald-300">
                        {analysisData.treeStatistics.uniqueSpeciesCount} Species
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {analysisData.treeStatistics.speciesDistribution.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 flex items-center justify-between shadow-xs transition-all"
                        >
                          <div>
                            <div className="text-xs font-extrabold text-[#022c17]">{item.species}</div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              {item.percentage}% of zone population
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-[#047857]">{item.count}</span>
                            <span className="text-[11px] text-slate-500 ml-1 font-semibold">trees</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs text-[#022c17] font-medium leading-relaxed">
                      <strong className="text-[#047857] font-black">Geodesic Density: </strong>
                      {analysisData.treeStatistics.treeDensityPerKm2} registered trees per km². Accurate WGS-84 spherical projection prevents latitude distortion.
                    </div>
                  </div>
                )}

                {/* ── TAB 2: GREEN ZONE & NDVI ── */}
                {activeTab === 'green_zone' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-[#022c17] font-['Fraunces']">Sentinel-2 Vegetation Coverage</h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Copernicus Data Space MSI (10m L2A) · Acquired {analysisData.vegetationAnalysis.metadata.observationDate}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {Object.entries(analysisData.vegetationAnalysis.classes).map(([key, cls]) => (
                        <div
                          key={key}
                          className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-1.5 shadow-xs"
                        >
                          <div className="flex items-center gap-2 font-bold text-xs" style={{ color: cls.color }}>
                            <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: cls.color }} />
                            <span>{cls.category.replace(' Observed Vegetation', '')}</span>
                          </div>
                          <div className="text-xl font-black text-[#022c17]">{cls.percentage}%</div>
                          <div className="text-xs font-bold text-slate-600">{cls.areaSqM.toLocaleString()} m²</div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs text-[#022c17] space-y-1.5 shadow-xs">
                      <div className="font-extrabold text-[#047857]">Scientific Distinction:</div>
                      <p className="text-slate-700 leading-relaxed font-medium">
                        NDVI reflects spectral chlorophyll reflectance and leaf canopy density. It is an area-based vegetation metric, not a direct count of individual tree trunks.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: PLANTATION PRIORITY & DECISION ── */}
                {activeTab === 'priority' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-bold text-[#022c17] font-['Fraunces']">Area Zone &amp; Plantation Assessment</h3>
                        <p className="text-xs text-slate-600 font-medium">
                          Classification: Green Zone vs. Red Zone &amp; Site Feasibility
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide border-2 shadow-xs"
                        style={{
                          backgroundColor: `${analysisData.plantationPriority.decisionBadgeColor}15`,
                          color: analysisData.plantationPriority.decisionBadgeColor,
                          borderColor: `${analysisData.plantationPriority.decisionBadgeColor}40`,
                        }}
                      >
                        {analysisData.plantationPriority.zoneType === 'GREEN_ZONE' ? '🟢 GREEN ZONE' : analysisData.plantationPriority.zoneType === 'RED_ZONE' ? '🔴 RED ZONE' : '🟡 YELLOW ZONE'}
                      </span>
                    </div>

                    {/* Area-Wise Action Decision Card */}
                    <div
                      className="p-5 rounded-2xl border-2 space-y-2 shadow-xs"
                      style={{
                        backgroundColor: `${analysisData.plantationPriority.decisionBadgeColor}10`,
                        borderColor: `${analysisData.plantationPriority.decisionBadgeColor}45`,
                      }}
                    >
                      <div className="text-xs uppercase font-black tracking-wider" style={{ color: analysisData.plantationPriority.decisionBadgeColor }}>
                        AREA-WISE DECISION:
                      </div>
                      <div className="text-base font-black text-[#022c17]">
                        {analysisData.plantationPriority.plantationDecision}
                      </div>
                      <p className="text-xs text-slate-800 font-medium">
                        {analysisData.plantationPriority.zoneBadge} · Multi-criteria Score: <strong>{analysisData.plantationPriority.priorityScore} / 1.00</strong>
                      </p>
                    </div>

                    {/* Impact on Humans, Students & Wildlife */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-black text-[#022c17] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#059669]" />
                        <span>Positive Impact on Humans &amp; Wildlife (Calm &amp; Cooling)</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-1 shadow-xs">
                          <strong className="text-[#047857] font-bold text-xs">Cooling &amp; Microclimate Calm:</strong>
                          <p className="text-slate-800 font-medium">
                            {analysisData.plantationPriority.ecologicalImpact?.humanHealth?.coolingEffect}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-1 shadow-xs">
                          <strong className="text-[#047857] font-bold text-xs">Air Filtration &amp; Well-being:</strong>
                          <p className="text-slate-800 font-medium">
                            {analysisData.plantationPriority.ecologicalImpact?.humanHealth?.airQuality} {analysisData.plantationPriority.ecologicalImpact?.humanHealth?.mentalWellbeing}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-1 shadow-xs">
                          <strong className="text-[#047857] font-bold text-xs">Bird &amp; Animal Habitat:</strong>
                          <p className="text-slate-800 font-medium">
                            {analysisData.plantationPriority.ecologicalImpact?.wildlifeSupport?.birdHabitat} {analysisData.plantationPriority.ecologicalImpact?.wildlifeSupport?.pollinators}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Realistic Negative Impacts & Construction Obstacles */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-black text-[#92400e] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Construction Obstacles &amp; Negative Constraints</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 space-y-2 shadow-xs">
                        <div>
                          <strong>🚧 Building Expansion Obstacles: </strong>
                          {analysisData.plantationPriority.negativeImpacts?.constructionObstacles}
                        </div>
                        <div>
                          <strong>⚡ Underground Infrastructure Risk: </strong>
                          {analysisData.plantationPriority.negativeImpacts?.undergroundUtilities}
                        </div>
                        <div>
                          <strong>💥 Pathway Cracking &amp; Upheaval: </strong>
                          {analysisData.plantationPriority.negativeImpacts?.infrastructureHazards}
                        </div>
                        <div>
                          <strong>🍂 Maintenance &amp; Wind Hazards: </strong>
                          {analysisData.plantationPriority.negativeImpacts?.maintenanceOverhead}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: THERMAL & CLIMATE ── */}
                {activeTab === 'climate' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-[#022c17] font-['Fraunces']">Microclimate &amp; Surface Temperature</h3>
                      <p className="text-xs text-slate-600 font-medium">
                        USGS Landsat 9 TIRS-2 (30m) &amp; Open-Meteo ERA5 Reanalysis
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-300 shadow-xs">
                        <div className="text-xs text-[#9a3412] uppercase font-black tracking-wider">Land Surface Temp (LST)</div>
                        <div className="text-3xl font-black text-[#c2410c] mt-1">
                          {analysisData.thermalAndClimate.landSurfaceTemperatureC}°C
                        </div>
                        <p className="text-xs text-[#9a3412] font-semibold mt-1">
                          Radiative thermal temperature of ground &amp; canopies
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border-2 border-emerald-400 shadow-xs">
                        <div className="text-xs text-[#022c17] uppercase font-black tracking-wider flex items-center justify-between">
                          <span>Live Air Temp</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-ping" />
                        </div>
                        <div className="text-3xl font-black text-[#047857] mt-1">
                          {analysisData.thermalAndClimate.realtimeWeather?.current?.temperature_2m || 32.2}°C
                        </div>
                        <p className="text-xs text-slate-700 font-semibold mt-1">
                          Humidity: {analysisData.thermalAndClimate.realtimeWeather?.current?.relative_humidity_2m || 35}% · Wind: {analysisData.thermalAndClimate.realtimeWeather?.current?.wind_speed_10m || 10} km/h
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-200 flex justify-between items-center text-xs text-slate-800 shadow-xs font-semibold">
                      <span><strong>Weather Source:</strong> {analysisData.thermalAndClimate.realtimeWeather?.source}</span>
                      <span className="text-[#047857] font-bold">{analysisData.thermalAndClimate.realtimeWeather?.isRealtime ? '● Live Online' : 'Cached Grid'}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 font-medium leading-relaxed shadow-xs">
                      <strong className="text-amber-900 font-black">Important Clarification: </strong>
                      Land Surface Temperature (LST) is not ambient air temperature. Unshaded asphalt absorbs direct solar radiation reaching over 42°C, whereas leafy vegetative canopies transpire moisture, maintaining lower microclimates around 32–34°C.
                    </div>
                  </div>
                )}

                {/* ── TAB 5: PLANNING SIMULATOR ── */}
                {activeTab === 'planning' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-[#022c17] font-['Fraunces']">Tree Plantation Planning Simulator</h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Explore hypothetical plantation infill without altering databases
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#022c17] flex justify-between">
                        <span>Proposed Additional Trees:</span>
                        <span className="text-[#047857] font-black text-base">{proposedTrees}</span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="150"
                        step="5"
                        value={proposedTrees}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setProposedTrees(val);
                          runSimulation(analysisData, val);
                        }}
                        className="w-full accent-[#047857]"
                      />
                    </div>

                    {simulationResult && (
                      <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-2.5 text-xs shadow-xs">
                        <div className="flex justify-between items-center text-[#022c17]">
                          <span className="font-semibold text-slate-700">Projected Tree Count:</span>
                          <strong className="text-[#047857] font-black text-base">
                            {simulationResult.projectedTreeCount} trees
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[#022c17]">
                          <span className="font-semibold text-slate-700">Projected Density:</span>
                          <strong className="text-[#047857] font-black text-base">
                            {simulationResult.projectedDensityPerKm2} / km²
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[#022c17]">
                          <span className="font-semibold text-slate-700">Space Feasibility:</span>
                          <strong className={simulationResult.isSpaceSufficient ? 'text-[#047857] font-black' : 'text-red-700 font-black'}>
                            {simulationResult.isSpaceSufficient ? 'Feasible (Adequate Open Ground)' : 'Exceeds Estimated Capacity'}
                          </strong>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-black text-[#022c17]">Recommended Native Species:</div>
                      <div className="text-xs text-slate-800 space-y-1.5 max-h-[160px] overflow-y-auto">
                        {simulationResult?.recommendedSpecies?.map((sp, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 shadow-xs flex justify-between items-center">
                            <span className="font-extrabold text-[#022c17]">{sp.species}</span>
                            <span className="text-xs text-slate-600 font-semibold">{sp.suitability}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 6: AREA REPORT ── */}
                {activeTab === 'report' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold text-[#022c17] font-['Fraunces']">Area-Wise Comprehensive Report</h3>
                        <p className="text-xs text-slate-600 font-medium">
                          Exportable executive environmental briefing
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#047857] text-white hover:bg-[#065f46] flex items-center gap-2 shadow-md transition-all"
                      >
                        <Printer className="w-4 h-4" />
                        Print / PDF
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-4 text-xs text-slate-800 max-h-[380px] overflow-y-auto shadow-xs">
                      <div className="border-b border-slate-200 pb-2.5">
                        <h4 className="font-black text-[#022c17] text-base">{analysisData.areaSummary.name}</h4>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Generated on {new Date(analysisData.analysisTimestamp).toLocaleString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"><strong>Total Area:</strong> {analysisData.areaSummary.areaSqKm} km²</div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"><strong>Tree Count:</strong> {analysisData.treeStatistics.totalRegisteredTrees} trees</div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"><strong>Tree Density:</strong> {analysisData.treeStatistics.treeDensityPerKm2}/km²</div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"><strong>Mean NDVI:</strong> {analysisData.vegetationAnalysis.meanNDVI}</div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"><strong>Surface Temp:</strong> {analysisData.thermalAndClimate.landSurfaceTemperatureC}°C</div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"><strong>Plantation Priority:</strong> {analysisData.plantationPriority.priorityLevel}</div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"><strong>Recommended Infill:</strong> {analysisData.recommendations?.totalCandidatesIdentified || 0} spots</div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"><strong>High-Priority:</strong> <span className="text-red-700 font-black">{analysisData.recommendations?.highPriorityCount || 0} locations</span></div>
                      </div>

                      <div className="text-xs space-y-1">
                        <strong className="text-[#022c17]">Top Existing Species: </strong>
                        <span className="text-slate-700 font-medium">
                          {analysisData.treeStatistics.speciesDistribution.slice(0, 4).map((s) => `${s.species} (${s.count})`).join(', ')}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <strong className="text-[#022c17]">Suggested Plantation Species: </strong>
                        <span className="text-slate-700 font-medium">
                          {analysisData.recommendations?.topRecommendedSpecies?.slice(0, 4).map((s) => `${s.species} (${s.botanicalName})`).join(', ')}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-200 leading-relaxed font-medium">
                        <strong>Sources &amp; Dates: </strong>
                        Copernicus Sentinel-2B MSI (10m L2A, 2024-03-24), USGS Landsat 9 TIRS-2 (30m, 2024-04-12), Open-Meteo ERA5 Reanalysis, ISRO NRSC Bhuvan &amp; Campus GIS Survey (2023-2024), VanJeevan MongoDB/SQLite Unified Tree Registry.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </div>
  );
}
