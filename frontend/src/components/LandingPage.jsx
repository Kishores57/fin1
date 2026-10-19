import React, { useEffect, useRef, useState } from 'react';
import {
  Trees,
  MapPin,
  ChevronDown,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Map,
  Leaf,
  BarChart3,
  Layers,
  Thermometer,
  TreePine,
  Globe,
  Shield,
  X,
  Compass,
  CheckCircle2,
  Users,
  Award,
  Calendar,
  Activity,
  HeartHandshake,
  FileCheck,
  Crown,
  LogOut,
  LogIn,
  UserCheck,
  Scale,
  Heart,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import heroVideo from '../assets/hero.mp4';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import AdminConsoleModal from './AdminConsoleModal';
import L, { createTileLayer } from '../utils/mapConfig';
import './LandingPage.css';

/* ─── AUTHENTIC VERIFIED PHOTOGRAPHY ASSETS ────────────────────────── */
const PHOTO_FOREST_HERO   = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000&q=85'; // Deep misty forest canopy
const PHOTO_CANOPY_SUN    = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1600&q=80'; // Lush green canopy with sunlight
const PHOTO_AERIAL_FOREST = 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1600&q=80'; // High-angle forest cover
const PHOTO_MAJESTIC_TREE = 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1600&q=80'; // Grand standalone tree in meadow
const PHOTO_PLANTING_HANDS= '/stewardship_farmer_planting.jpg'; // Real farmer & field steward planting native sapling
const PHOTO_NURSERY_SPROUT= 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1400&q=80'; // Fresh green sprout emerging
const PHOTO_WOODLAND_PATH = 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=80'; // Sunlit woodland path
const PHOTO_MISTY_HILLS   = 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1600&q=80'; // Misty mountain pine forest
const PHOTO_SOIL_HOLDING  = '/campus_tree_plantation.jpg'; // Indian student planting native sapling on college campus

/* ─── DATA SECTIONS ────────────────────────────────────────────── */

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Field Survey & GPS Capture',
    desc: 'Surveys capture tree species, girth at breast height (GBH), and tree height with meter-level GPS accuracy on campus grounds.',
  },
  {
    step: '02',
    title: 'Earth Observation Integration',
    desc: 'Copernicus Sentinel-2 and USGS Landsat-9 imagery calibrate canopy density and surface thermal conditions around inventoried sites.',
  },
  {
    step: '03',
    title: 'Biomass & Carbon Quantification',
    desc: 'Validated allometric equations compute aboveground biomass, belowground root mass, carbon storage, and annual CO₂ sequestration.',
  },
  {
    step: '04',
    title: 'Multi-Criteria Spatial Scoring',
    desc: 'Geospatial algorithms evaluate open pervious land, tree density deficits, and clearance safety to rank optimal planting locations.',
  },
  {
    step: '05',
    title: 'Evidence-Based Conservation',
    desc: 'Automated conservation briefs present legal protection mandates, oxygen values, and ecological reasons before any tree removal is permitted.',
  },
];

const SCIENTIFIC_SOURCES = [
  {
    title: 'Copernicus Sentinel-2 MSI',
    agency: 'European Space Agency (ESA)',
    spec: '10m Spatial Resolution · 13 Bands',
    purpose: 'Measures live vegetation vigor via Normalized Difference Vegetation Index (NDVI) calibrated from Band 4 (Red) and Band 8 (Near-Infrared).',
    link: 'https://dataspace.copernicus.eu/',
  },
  {
    title: 'USGS Landsat 9 TIRS-2',
    agency: 'NASA / USGS',
    spec: '30m Thermal Resolution · Split Window',
    purpose: 'Quantifies Land Surface Temperature (LST) in Celsius to track microclimatic heat islands and evaluate urban forest cooling.',
    link: 'https://earthexplorer.usgs.gov/',
  },
  {
    title: 'NRSC Bhuvan LULC',
    agency: 'ISRO National Remote Sensing Centre',
    spec: '1:50,000 Land Use Classification',
    purpose: 'Identifies pervious open ground suitable for sapling pit excavation vs. paved roads and impervious built structures.',
    link: 'https://bhuvan.nrsc.gov.in/',
  },
  {
    title: 'ERA5 Climate Reanalysis',
    agency: 'ECMWF / Open-Meteo API',
    spec: 'Hourly Atmospheric Records',
    purpose: 'Supplies baseline air temperature, relative humidity, and solar radiation to contextualize local microclimate conditions.',
    link: 'https://open-meteo.com/',
  },
];

const LEGAL_FRAMEWORKS = [
  {
    title: 'Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975',
    jurisdiction: 'State of Maharashtra (Nashik, Mumbai, Pune)',
    purpose: 'Mandates prior written permission from the designated municipal Tree Authority before felling or trimming any urban tree.',
    mandate: 'Prescribes mandatory compensatory plantation (1:3 to 1:5 ratio) for any authorized tree removal.',
    link: 'https://www.maharashtra.gov.in/',
  },
  {
    title: 'Environment (Protection) Act, 1986',
    jurisdiction: 'Union of India (Central Legislation)',
    purpose: 'Provides comprehensive framework to protect ecological balance, maintain air quality, and regulate activities causing environmental degradation.',
    mandate: 'Empowers statutory bodies to halt development activities that eliminate critical urban green corridors without environmental clearance.',
    link: 'https://www.moef.gov.in/',
  },
  {
    title: 'Biological Diversity Act, 2002',
    jurisdiction: 'National & State Biodiversity Boards',
    purpose: 'Conservation of biological diversity, sustainable use of its components, and fair equitable sharing of benefits.',
    mandate: 'Protects native keystone tree species (Neem, Banyan, Peepal) that provide critical nesting habitats for urban biodiversity.',
    link: 'http://nbaindia.org/',
  },
];

/* ─── HOOK: SCROLL REVEAL ────────────────────────────────────────── */
function useReveal(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.classList.add('js-reveal');
    const nodes = el.querySelectorAll('.lp-reveal');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.04, rootMargin: '0px 0px 120px 0px' }
    );
    nodes.forEach((n) => io.observe(n));

    const revealNear = () => {
      nodes.forEach((n) => {
        const rect = n.getBoundingClientRect();
        if (rect.top < window.innerHeight + 150) {
          n.classList.add('lp-in');
          io.unobserve(n);
        }
      });
    };
    revealNear();
    const t1 = setTimeout(revealNear, 100);
    const t2 = setTimeout(revealNear, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/* ─── GIS MAP PREVIEW (Embedded Leaflet with Real Data) ──────────── */
function GisMapPreview() {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      attributionControl: false,
    }).setView([20.0131, 73.8213], 16);

    createTileLayer({ maxZoom: 22, maxNativeZoom: 19 }).addTo(map);

    // Fetch verified trees
    fetch(`${API_BASE_URL}/api/epicollect/trees`)
      .then((r) => (r.ok ? r.json() : []))
      .then((trees) => {
        (trees || []).slice(0, 80).forEach((t) => {
          if (!t.lat || !t.lng) return;
          L.circleMarker([t.lat, t.lng], {
            radius: 6.5,
            fillColor: '#2d6a4f',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.9,
          })
            .addTo(map)
            .bindPopup(
              `<strong style="font-family:'Plus Jakarta Sans',sans-serif;color:#142e1f;">${t.species || 'Inventoried Tree'}</strong><br/><span style="font-size:11px;color:#708477;">KK Wagh Campus Survey</span>`
            );
        });
      })
      .catch(() => {});

    instanceRef.current = map;
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 150);
    setTimeout(handleResize, 450);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={mapRef} className="w-full h-[460px] rounded-2xl overflow-hidden shadow-inner border border-[rgba(20,46,31,0.12)]" />;
}

/* ─── BENTO INTERACTIVE MINI-MAP (Matching Image 3 Style) ────────── */
function BentoInteractiveMap({ onOpenMap }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;
    const Leaflet = window.L || L;
    if (!Leaflet) return;

    const map = Leaflet.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      dragging: false,
      attributionControl: false,
    }).setView([20.0135, 73.8213], 16);

    createTileLayer({ maxZoom: 22, maxNativeZoom: 18 }).addTo(map);

    // Campus boundary outline
    const campusBoundary = [
      [20.0123, 73.8198],
      [20.0123, 73.8228],
      [20.0147, 73.8228],
      [20.0147, 73.8198],
    ];
    Leaflet.polygon(campusBoundary, {
      color: '#0f172a',
      weight: 2,
      dashArray: '4, 4',
      fillColor: '#047857',
      fillOpacity: 0.15,
    }).addTo(map);

    // Three distinct colored glowing beacons matching image 3 (orange, red/coral, blue)
    const beacons = [
      { coords: [20.0138, 73.8212], color: '#f59e0b', ringRadius: 55 },
      { coords: [20.0143, 73.8219], color: '#ef4444', ringRadius: 40 },
      { coords: [20.0128, 73.8214], color: '#3b82f6', ringRadius: 46 },
    ];

    beacons.forEach((b) => {
      // Outer translucent glow ring
      Leaflet.circle(b.coords, {
        radius: b.ringRadius,
        color: b.color,
        fillColor: b.color,
        fillOpacity: 0.45,
        weight: 1.5,
      }).addTo(map);

      // Core solid dot
      Leaflet.circleMarker(b.coords, {
        radius: 7,
        color: '#ffffff',
        fillColor: b.color,
        fillOpacity: 1,
        weight: 2.5,
      }).addTo(map);
    });

    instanceRef.current = map;
    const handleResize = () => map.invalidateSize();
    setTimeout(handleResize, 150);
    setTimeout(handleResize, 450);

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[260px] pointer-events-none"
    />
  );
}

/* ─── SUBPAGE: WHO WE ARE (Inspired by Trees.org) ────────────────── */
function WhoWeArePage({ onBack, onEnterApp }) {
  return (
    <div className="lp-subpage">
      {/* Editorial Hero */}
      <section
        className="lp-subpage-hero"
        style={{ backgroundImage: `url(${PHOTO_CANOPY_SUN})` }}
      >
        <div className="lp-subpage-hero-overlay" />
        <div className="lp-container relative z-10">
          <button type="button" onClick={onBack} className="lp-subpage-back">
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Back to Home</span>
          </button>
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 mb-3 backdrop-blur-sm">
              About Our Mission
            </span>
          </div>
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold max-w-3xl leading-tight font-['Fraunces'] drop-shadow-md">
            Restoring Urban Canopy Through Geographic Truth.
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl mt-4 font-medium leading-relaxed drop-shadow-sm">
            We unite field botanical inventory with European and American Earth observation satellites
            to protect every standing tree and guide intelligent campus afforestation.
          </p>
        </div>
      </section>

      {/* Editorial Body */}
      <section className="lp-subpage-body">
        <div className="lp-container space-y-16">
          {/* Approach Grid */}
          <div className="lp-editorial-grid">
            <div>
              <span className="lp-section-kicker">Our Approach</span>
              <h2 className="lp-section-title">Evidence-Based Environmental Stewardship</h2>
              <p className="text-base text-[#44594c] leading-relaxed mb-6">
                Tree conservation cannot rely on guesswork. Every development proposal, road widening, or infrastructure project
                demands empirical data: the biomass of the trees at risk, the metric tons of carbon stored in their wood,
                and the microclimate cooling loss that their felling would cause.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#d8f3dc] text-[#2d6a4f] shrink-0 mt-0.5">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#142e1f] text-base">Verified Field Inventories</h4>
                    <p className="text-sm text-[#44594c]">Every specimen cataloged with DBH, height, and coordinates verified on the ground.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#d8f3dc] text-[#2d6a4f] shrink-0 mt-0.5">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#142e1f] text-base">Multi-Sensor Space Intelligence</h4>
                    <p className="text-sm text-[#44594c]">Copernicus Sentinel-2 MSI and USGS Landsat-9 radiometric sensors continuously calibrate canopy health.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#d8f3dc] text-[#2d6a4f] shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#142e1f] text-base">Legal Protection Integration</h4>
                    <p className="text-sm text-[#44594c]">Direct statutory alignment with the Maharashtra Urban Tree Act to defend trees against unlawful removal.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-photo-frame h-[440px]">
              <img src={PHOTO_SOIL_HOLDING} alt="Campus tree plantation and field environmental stewardship at KK Wagh Institute" />
              <div className="lp-photo-caption">Field survey teams and student stewards actively planting and monitoring native campus trees with permanent GPS coordinates.</div>
            </div>
          </div>

          {/* Impact Metrics Banner */}
          <div className="bg-gradient-to-br from-[#e8f5e9] via-[#f7f4ee] to-[#edf6ed] border-2 border-[#b7e4c7] rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-md">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-block text-xs uppercase tracking-wider text-[#1b4332] font-extrabold bg-[#d8f3dc] px-3.5 py-1 rounded-full border border-[#95d5b2]">
                Institutional Impact
              </span>
              <h3 className="text-3xl sm:text-4xl font-bold text-[#0a2316] mt-3 mb-4 font-['Fraunces']">
                Built at K.K. Wagh Institute of Engineering Education &amp; Research
              </h3>
              <p className="text-[#264434] text-base leading-relaxed mb-8 font-medium">
                Created to pioneer a reproducible blueprint for university campuses and urban municipalities
                across India. Turning environmental science from academic theory into live operational GIS decision-making.
              </p>
              <button
                type="button"
                onClick={() => onEnterApp('map')}
                className="btn-forest-primary shadow-sm"
              >
                <span>Explore Live Campus Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── SUBPAGE: CONSERVATION & WHY TREES (Inspired by Why Farmers) ── */
function ConservationStoryPage({ onBack, onEnterApp }) {
  return (
    <div className="lp-subpage">
      <section
        className="lp-subpage-hero"
        style={{ backgroundImage: `url(${PHOTO_WOODLAND_PATH})` }}
      >
        <div className="lp-subpage-hero-overlay" />
        <div className="lp-container relative z-10">
          <button type="button" onClick={onBack} className="lp-subpage-back">
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Back to Home</span>
          </button>
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 mb-3 backdrop-blur-sm">
              Conservation Narrative
            </span>
          </div>
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold max-w-3xl leading-tight font-['Fraunces'] drop-shadow-md">
            Why Every Single Tree Demands Our Protection.
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl mt-4 font-medium leading-relaxed drop-shadow-sm">
            Trees are not decorative landscaping; they are living infrastructure that purifies the air we breathe,
            intercepts stormwater, and cools our warming cities.
          </p>
        </div>
      </section>

      <section className="lp-subpage-body">
        <div className="lp-container space-y-16">
          {/* Narrative Section 1 */}
          <div className="lp-editorial-grid">
            <div className="lp-photo-frame h-[420px]">
              <img src={PHOTO_NURSERY_SPROUT} alt="Young seedling growing in nursery" />
              <div className="lp-photo-caption">A newly planted sapling takes 15–20 years to match the canopy and cooling of one mature tree.</div>
            </div>
            <div>
              <span className="lp-section-kicker">The Time Equation</span>
              <h2 className="lp-section-title">A 30-Year Tree Cannot Be Replaced by a Sapling Tomorrow</h2>
              <p className="text-base text-[#44594c] leading-relaxed mb-4">
                When a mature tree is felled for construction with a promise to "plant five new saplings," the immediate result is an ecological void.
                A mature 25-year-old Rain Tree or Neem provides over 200 m² of shade canopy and absorbs tens of kilograms of atmospheric carbon annually.
              </p>
              <p className="text-base text-[#44594c] leading-relaxed">
                By maintaining a comprehensive GIS inventory, our platform equips campus authorities with the exact numerical justification
                needed to modify building blueprints, route pathways around root protection zones, and preserve living giants.
              </p>
            </div>
          </div>

          {/* Legal Framework Cards */}
          <div>
            <span className="lp-section-kicker">Statutory Shields</span>
            <h2 className="lp-section-title mb-6">Tree Protection Acts &amp; Legal Mandates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LEGAL_FRAMEWORKS.map((law) => (
                <div key={law.title} className="nature-card p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">{law.jurisdiction}</span>
                    <h3 className="text-lg font-bold text-[#142e1f] mt-2 mb-3">{law.title}</h3>
                    <p className="text-sm text-[#44594c] mb-3">{law.purpose}</p>
                    <p className="text-xs text-[#708477] bg-[#f3efe6] p-3 rounded-lg border border-[rgba(20,46,31,0.06)]">
                      <strong>Mandate:</strong> {law.mandate}
                    </p>
                  </div>
                  <a
                    href={law.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2d6a4f] hover:text-[#142e1f] mt-4"
                  >
                    <span>Read Statutory Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Real Open-Source Biodiversity Showcase */}
          <div className="bg-[#fcfaf5] border border-[#e8e2d5] rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="max-w-2xl mb-8">
              <span className="lp-section-kicker">Living Ecosystems</span>
              <h2 className="lp-section-title">The Biodiversity Supported by Urban Trees</h2>
              <p className="text-base text-[#44594c]">
                A single mature native tree forms a biodiverse micro-habitat sustaining avian fauna, pollinators, native flora, and soil microbiomes.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="group rounded-2xl overflow-hidden border border-[#d8e2dc] bg-white shadow-xs">
                <div className="h-44 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80"
                    alt="Fresh garden fruits nourished by organic canopy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-[#142e1f]">Fresh Fruits &amp; Berries</h4>
                  <p className="text-[11px] text-[#52796f]">Canopy shade protects orchards &amp; fruit yields</p>
                </div>
              </div>

              <div className="group rounded-2xl overflow-hidden border border-[#d8e2dc] bg-white shadow-xs">
                <div className="h-44 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"
                    alt="Fresh vegetables in organic living soil"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-[#142e1f]">Living Soil &amp; Vegetables</h4>
                  <p className="text-[11px] text-[#52796f]">Micro-nutrients and humus enriched by leaf litter</p>
                </div>
              </div>

              <div className="group rounded-2xl overflow-hidden border border-[#d8e2dc] bg-white shadow-xs">
                <div className="h-44 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80"
                    alt="Urban wildlife and animal species in canopy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-[#142e1f]">Fauna &amp; Wildlife</h4>
                  <p className="text-[11px] text-[#52796f]">Shelter and nesting for over 40 native bird &amp; mammal species</p>
                </div>
              </div>

              <div className="group rounded-2xl overflow-hidden border border-[#d8e2dc] bg-white shadow-xs">
                <div className="h-44 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80"
                    alt="Honey bees and pollinators on blooming tree blossoms"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-[#142e1f]">Bees &amp; Pollinators</h4>
                  <p className="text-[11px] text-[#52796f]">Essential pollination for local urban agricultural cycles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="bg-[#f3efe6] border border-[#e6dfd1] rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-[#142e1f]">Evaluate a Tree Under Threat</h3>
              <p className="text-sm text-[#44594c] mt-1">Run an AI conservation analysis to generate an official printable Do-Not-Cut report.</p>
            </div>
            <button
              type="button"
              onClick={() => onEnterApp('register')}
              className="btn-forest-primary shrink-0"
            >
              <span>Launch Conservation Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── SUBPAGE: CARBON & SATELLITE INTELLIGENCE (Inspired by Carbon Markets) ── */
function CarbonIntelligencePage({ onBack, onEnterApp }) {
  return (
    <div className="lp-subpage">
      <section
        className="lp-subpage-hero"
        style={{ backgroundImage: `url(${PHOTO_AERIAL_FOREST})` }}
      >
        <div className="lp-subpage-hero-overlay" />
        <div className="lp-container relative z-10">
          <button type="button" onClick={onBack} className="lp-subpage-back">
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Back to Home</span>
          </button>
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 mb-3 backdrop-blur-sm">
              Data-Driven Carbon Analytics
            </span>
          </div>
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold max-w-3xl leading-tight font-['Fraunces'] drop-shadow-md">
            Scientific Carbon Accounting &amp; Earth Observation.
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl mt-4 font-medium leading-relaxed drop-shadow-sm">
            Transparent biomass allometry, multi-spectral satellite reflectance, and thermal infrared tracking
            for verifiable urban environmental accounting.
          </p>
        </div>
      </section>

      <section className="lp-subpage-body">
        <div className="lp-container space-y-16">
          {/* Process Timeline */}
          <div>
            <span className="lp-section-kicker">Methodological Workflow</span>
            <h2 className="lp-section-title mb-8">How We Measure, Map, and Verify Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {WORKFLOW_STEPS.map((ws) => (
                <div key={ws.step} className="lp-timeline-card">
                  <div className="lp-timeline-step">Step {ws.step}</div>
                  <h4>{ws.title}</h4>
                  <p>{ws.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Earth Observation Providers */}
          <div>
            <span className="lp-section-kicker">Open Earth Observation</span>
            <h2 className="lp-section-title mb-6">Scientific Data Sources Integrated</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SCIENTIFIC_SOURCES.map((src) => (
                <div key={src.title} className="nature-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider">{src.agency}</span>
                      <span className="text-[11px] font-semibold text-[#708477] bg-[#f3efe6] px-2 py-0.5 rounded-full">{src.spec}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#142e1f] mb-2">{src.title}</h3>
                    <p className="text-sm text-[#44594c]">{src.purpose}</p>
                  </div>
                  <a
                    href={src.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2d6a4f] hover:text-[#142e1f] mt-4"
                  >
                    <span>View Data Provider</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Allometric Science Banner */}
          <div className="bg-gradient-to-br from-[#e8f5e9] via-[#f7f4ee] to-[#edf6ed] border-2 border-[#b7e4c7] rounded-3xl p-8 sm:p-10 shadow-md text-[#142e1f]">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0a2316] mb-3 font-['Fraunces']">
              Allometric Biomass Equations
            </h3>
            <p className="text-base text-[#264434] max-w-2xl leading-relaxed mb-6 font-medium">
              Our backend calculates dry weight biomass from measured diameter at breast height (DBH) and total height
              using published forestry formulas calibrated per species wood density (Chave et al.). Carbon storage is modeled
              at 47.5% of total dry biomass, converted to CO₂ equivalents by multiplying by 3.67.
            </p>
            <button
              type="button"
              onClick={() => onEnterApp('analysis')}
              className="btn-forest-primary shadow-sm"
            >
              <span>Explore Spatial Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── MAIN LANDING PAGE COMPONENT ────────────────────────────────── */
export default function LandingPage({ onEnterApp }) {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const [view, setView]               = useState('home'); // home, who_we_are, conservation, carbon
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [stats, setStats]             = useState({ trees: null, species: null });
  const [showAuthModal, setShowAuthModal]         = useState(false);
  const [showAdminConsole, setShowAdminConsole]   = useState(false);
  const [authMode, setAuthMode]                   = useState('login');
  const [pendingTargetTab, setPendingTargetTab]   = useState('register');
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const [showDonateModal, setShowDonateModal]     = useState(false);
  const [donateTier, setDonateTier]               = useState(25);
  const [customDonation, setCustomDonation]       = useState('');
  const [donationSuccess, setDonationSuccess]     = useState(false);
  const [showVideoModal, setShowVideoModal]       = useState(false);
  const [isVideoPlaying, setIsVideoPlaying]       = useState(true);
  const [isVideoMuted, setIsVideoMuted]           = useState(true);
  const heroVideoRef                              = useRef(null);
  const dropdownRef                               = useRef(null);
  const rootRef = useReveal([view]);

  const toggleVideoPlay = () => {
    if (!heroVideoRef.current) return;
    if (heroVideoRef.current.paused) {
      heroVideoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    } else {
      heroVideoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleVideoMute = () => {
    if (!heroVideoRef.current) return;
    const nextMuted = !heroVideoRef.current.muted;
    heroVideoRef.current.muted = nextMuted;
    setIsVideoMuted(nextMuted);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSupportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track window scroll for transparent-to-solid nav transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch verified stats from backend
  useEffect(() => {
    Promise.allSettled([
      fetch(`${API_BASE_URL}/api/epicollect/trees`).then((r) => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/api/registered-trees`).then((r) => r.ok ? r.json() : []),
    ]).then(([epicRes, mongoRes]) => {
      const epic  = epicRes.status  === 'fulfilled' ? (epicRes.value  || []) : [];
      const mongo = mongoRes.status === 'fulfilled' ? (mongoRes.value || []) : [];
      const all   = [...epic, ...mongo];
      if (all.length > 0) {
        const speciesSet = new Set(all.map((t) => t.species || t.treeName).filter(Boolean));
        setStats({ trees: all.length, species: speciesSet.size });
      }
    });
  }, []);

  const goTab = (tab = 'register') => {
    if (isAuthenticated) {
      onEnterApp?.(tab);
    } else {
      setPendingTargetTab(tab);
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  const handleAuthDone = (authedUser, tab) => {
    setShowAuthModal(false);
    onEnterApp?.(pendingTargetTab || tab || 'register', authedUser);
  };

  const navTo = (targetView) => {
    setView(targetView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="lp-root" ref={rootRef}>
      {/* ─── FLOATING PILL NAVIGATION BAR (Exact Trees for the Future match) ─── */}
      <header className={`lp-nav-wrapper ${scrolled ? 'scrolled' : ''}`}>
        <nav className="lp-pill-bar" role="navigation" aria-label="Main Navigation">
          {/* LEFT: New Emblem Logo (Trees for the Future) */}
          <button
            type="button"
            className="lp-pill-brand"
            onClick={() => navTo('home')}
            aria-label="Trees for the Future · VanJeevan"
          >
            <div className="lp-pill-emblem">
              <svg viewBox="0 0 38 38" fill="none" className="w-9 h-9" aria-hidden="true">
                <circle cx="19" cy="19" r="17.5" stroke="#142e1f" strokeWidth="2.2" />
                {/* Cupped hand cradling seedling */}
                <path
                  d="M9.5 24.2c2.2 4.2 6.5 5.8 11.2 5.5 4.8-.3 8.2-2.1 11.8-5.2-1.8-.8-3.4-.9-4.8-.4-2.1.8-4.5.7-6.5-.4-2.2-1.2-4.2-1-6 .3l-2.8 1.2c-1.1.4-2.1.2-2.9-1z"
                  fill="#142e1f"
                />
                <path
                  d="M19 25.5c0-4.2 1.6-7.8 4.2-11-2.6 1.1-4.2 3.6-4.2 6.8v4.2z"
                  fill="#142e1f"
                />
                <path
                  d="M19.8 14.5c2.4-3.8 6.4-5.8 10.6-6.2-1.2 3.8-3.9 6.4-7.8 7.9l-2.8-1.7z"
                  fill="#142e1f"
                />
                <path
                  d="M13.5 16.2c3.2-1.6 6.5-1 8.5 1.7-2.1 1.6-4.8 1.9-7.5.5l-1-2.2z"
                  fill="#142e1f"
                />
              </svg>
            </div>
            <div className="lp-pill-brand-text">
              <span className="lp-brand-line-trees">TREES</span>
              <span className="lp-brand-line-future">FOR THE FUTURE</span>
            </div>
          </button>

          {/* CENTER: Previous Navigation Links in Pill Style */}
          <div className="lp-pill-links">
            <button
              type="button"
              className={`lp-pill-link ${view === 'home' ? 'active' : ''}`}
              onClick={() => navTo('home')}
            >
              Home
            </button>

            <button
              type="button"
              className={`lp-pill-link ${view === 'who_we_are' ? 'active' : ''}`}
              onClick={() => navTo('who_we_are')}
            >
              Who We Are
            </button>

            <button
              type="button"
              className={`lp-pill-link ${view === 'conservation' ? 'active' : ''}`}
              onClick={() => navTo('conservation')}
            >
              Why Trees Matter
            </button>

            <button
              type="button"
              className={`lp-pill-link ${view === 'carbon' ? 'active' : ''}`}
              onClick={() => navTo('carbon')}
            >
              Carbon &amp; Satellites
            </button>

            <button
              type="button"
              className="lp-pill-link"
              onClick={() => goTab('map')}
            >
              GIS Live Map
            </button>

            <button
              type="button"
              className="lp-pill-link lp-pill-link-accent"
              onClick={() => goTab('permits')}
            >
              Cutting Permits &amp; Voting
            </button>
          </div>

          {/* RIGHT: Previous Actions (Sign In & Enter Platform CTA) */}
          <div className="lp-pill-actions">
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="lp-pill-signin"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  className="lp-pill-cta"
                  onClick={() => goTab('register')}
                >
                  <span>Enter Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAdminConsole(true)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden xl:inline">Admin Console</span>
                  </button>
                )}
                {/* User capsule */}
                <div className="lp-pill-user">
                  <div className={`lp-user-avatar ${isAdmin ? 'admin' : ''}`}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="lp-user-name hidden sm:inline">{user?.name}</span>
                  <span className="lp-user-badge">{isAdmin ? 'ADMIN' : 'USER'}</span>
                </div>
                <button
                  type="button"
                  className="lp-pill-cta"
                  onClick={() => goTab('register')}
                >
                  <span>Enter Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="lp-user-logout"
                  title="Sign out of VanJeevan"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              className="lp-pill-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lp-mobile-menu">
          <button
            type="button"
            className="lp-mobile-close"
            onClick={() => setMenuOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>

          {/* User Status in mobile drawer */}
          {isAuthenticated ? (
            <div className="mb-4 p-4 rounded-2xl bg-white/10 border border-white/15 text-white">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{user?.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAdmin ? 'bg-amber-400 text-stone-900' : 'bg-emerald-400 text-stone-900'
                  }`}
                >
                  {isAdmin ? 'ADMINISTRATOR' : 'FIELD RESEARCHER'}
                </span>
              </div>
              <p className="text-xs text-white/70">{user?.email}</p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowAdminConsole(true);
                  }}
                  className="mt-3 w-full py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Open Admin Console</span>
                </button>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-white text-[#142e1f] flex items-center justify-center gap-2 mb-2"
              >
                <LogIn className="w-4 h-4 text-[#2d6a4f]" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}

          <button type="button" onClick={() => navTo('home')}>Home</button>
          <button type="button" onClick={() => navTo('who_we_are')}>Who We Are</button>
          <button type="button" onClick={() => navTo('conservation')}>Why Trees Matter</button>
          <button type="button" onClick={() => navTo('carbon')}>Carbon &amp; Satellites</button>
          <button type="button" onClick={() => { setMenuOpen(false); goTab('map'); }}>GIS Live Map</button>
          <button type="button" onClick={() => { setMenuOpen(false); goTab('permits'); }}>Cutting Permits &amp; Voting</button>

          <button
            type="button"
            className="btn-harvest-gold mt-4 w-full"
            onClick={() => { setMenuOpen(false); goTab('register'); }}
          >
            Enter Platform →
          </button>

          <button
            type="button"
            className="btn-harvest-gold mt-2 w-full"
            onClick={() => { setMenuOpen(false); goTab('register'); }}
          >
            Enter Platform →
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="mt-3 text-xs text-red-300 hover:text-red-200 flex items-center justify-center gap-1.5 py-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      )}

      {/* ─── SUBPAGE ROUTING ─── */}
      {view === 'who_we_are' && (
        <WhoWeArePage onBack={() => navTo('home')} onEnterApp={goTab} />
      )}
      {view === 'conservation' && (
        <ConservationStoryPage onBack={() => navTo('home')} onEnterApp={goTab} />
      )}
      {view === 'carbon' && (
        <CarbonIntelligencePage onBack={() => navTo('home')} onEnterApp={goTab} />
      )}

      {/* ─── HOMEPAGE VIEW (Full Trees for the Future structure) ─── */}
      {view === 'home' && (
        <>
          {/* ════ HERO: Fullscreen Cinematic Video Background ════ */}
          <header
            className="lp-hero"
            style={{ backgroundImage: `url(${PHOTO_FOREST_HERO})` }}
          >
            {/* Background HTML5 Video */}
            <video
              ref={heroVideoRef}
              className="lp-hero-video"
              autoPlay
              loop
              muted={isVideoMuted}
              playsInline
              poster={PHOTO_FOREST_HERO}
            >
              <source src={heroVideo} type="video/mp4" />
              <source src="/hero.mp4" type="video/mp4" />
            </video>

            {/* Cinematic Gradient & Vignette Overlay */}
            <div className="lp-hero-overlay" />

            {/* Hero Main Content */}
            <div className="lp-container lp-hero-content lp-reveal">
              <span className="lp-hero-kicker">
                <Trees className="w-4 h-4" />
                VanJeevan · GIS Tree Conservation Platform
              </span>
              <h1 className="lp-hero-title">
                Mapping Every Tree.
                <br />
                <em>Preserving Every Leaf.</em>
              </h1>
              <p className="lp-hero-sub">
                An intelligent geospatial platform combining field tree inventories with Copernicus Sentinel-2
                and USGS Landsat-9 satellite observations for sustainable infrastructure and urban forest stewardship.
              </p>
              <div className="lp-hero-ctas">
                <button
                  type="button"
                  className="btn-forest-primary"
                  onClick={() => goTab('map')}
                >
                  <Map className="w-4 h-4" />
                  <span>Explore Interactive GIS Map</span>
                </button>
                <button
                  type="button"
                  className="btn-forest-secondary text-white border-white/60 hover:bg-white/10 hover:text-white"
                  onClick={() => goTab('analysis')}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Plantation Analysis</span>
                </button>
                <button
                  type="button"
                  className="lp-hero-watch-btn"
                  onClick={() => setShowVideoModal(true)}
                  aria-label="Watch the video story"
                >
                  <div className="lp-hero-watch-circle">
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  </div>
                  <span>Watch the video</span>
                </button>
              </div>

              {/* Verified Stat Strip */}
              {stats.trees !== null && (
                <div className="lp-hero-stats">
                  <div className="lp-hero-stat">
                    <strong>{stats.trees.toLocaleString()}</strong>
                    <span>Registered Trees</span>
                  </div>
                  <div className="lp-hero-stat">
                    <strong>{stats.species}</strong>
                    <span>Unique Species</span>
                  </div>
                  <div className="lp-hero-stat">
                    <strong>10m MSI</strong>
                    <span>Sentinel-2 NDVI</span>
                  </div>
                  <div className="lp-hero-stat">
                    <strong>30m TIRS</strong>
                    <span>Landsat Thermal</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sleek Floating Video Micro-Controls */}
            <div className="lp-hero-video-controls" aria-label="Hero background video controls">
              <button
                type="button"
                onClick={toggleVideoPlay}
                className="lp-hero-video-btn"
                title={isVideoPlaying ? 'Pause background video' : 'Play background video'}
                aria-label={isVideoPlaying ? 'Pause background video' : 'Play background video'}
              >
                {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={toggleVideoMute}
                className="lp-hero-video-btn"
                title={isVideoMuted ? 'Unmute video sound' : 'Mute video sound'}
                aria-label={isVideoMuted ? 'Unmute video sound' : 'Mute video sound'}
              >
                {isVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <span className="lp-hero-video-badge">
                <span className="lp-hero-video-dot" />
                Live Canopy Video
              </span>
            </div>

            {/* Elegant Downward Scroll Prompt */}
            <a
              href="#overview-story"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('overview-story')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="lp-hero-scroll-indicator"
              aria-label="Scroll to explore platform overview"
            >
              <span className="lp-hero-scroll-text">Explore</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </header>

          {/* ════ SECTION 1: EDITORIAL PHOTOGRAPHIC STORYTELLING ════ */}
          <section id="overview-story" className="py-24 bg-[#fbf9f4]">
            <div className="lp-container">
              <div className="lp-editorial-grid">
                <div className="lp-reveal">
                  <span className="lp-section-kicker">Our Mission &amp; Purpose</span>
                  <h2 className="lp-section-title">
                    Technology &amp; Nature Working as One.
                  </h2>
                  <p className="text-base text-[#44594c] leading-relaxed mb-6">
                    Rapid urban expansion often views mature trees as obstacles rather than irreplaceable ecological assets.
                    VanJeevan provides planners, researchers, and campus administrators with geographic truth:
                    pinpointing where trees stand, quantifying their carbon vaults, and identifying the most suitable locations to plant new ones.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navTo('who_we_are')}
                      className="btn-forest-primary"
                    >
                      <span>Read Who We Are</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navTo('conservation')}
                      className="btn-forest-secondary"
                    >
                      <span>Why Trees Matter</span>
                    </button>
                  </div>
                </div>
                <div className="lp-photo-frame h-[460px] lp-reveal">
                  <img src={PHOTO_CANOPY_SUN} alt="Lush green tree canopy with sunlight filtering through" />
                  <div className="lp-photo-caption">
                    Overhead canopy cools ambient air by up to 3.5°C through shade and evapotranspiration.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ════ SECTION 2: BENTO GRID PLATFORM ARCHITECTURE (Exact Match to 3rd Image) ════ */}
          <section className="py-20 md:py-28 bg-[#131f2d] text-white">
            <div className="lp-container">
              {/* Header */}
              <div className="lp-section-head text-center max-w-3xl mx-auto mb-12 lp-reveal">
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
                  GIS Platform Capabilities &amp; Field Science
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-['Fraunces'] text-white leading-tight">
                  Engineered for Urban Forest Stewardship
                </h2>
                <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl mx-auto leading-relaxed">
                  Click any module below to launch live tree identification, allometric age finding, carbon impact analysis, campus suitability planning, or interactive cartography.
                </p>
              </div>

              {/* Bento Grid Container matching Image 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5">
                
                {/* ── CARD 1: LEFT TALL CARD (Interactive GIS Map & Program Area - Soft Slate Blue #b0c7d1) ── */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => goTab('map')}
                  onKeyDown={(e) => e.key === 'Enter' && goTab('map')}
                  className="lg:col-span-4 lg:row-span-2 group cursor-pointer rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-950/40 bg-[#b0c7d1] text-[#0f172a] focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
                  style={{ minHeight: '540px' }}
                >
                  {/* Top Map Graphic with Concentric Beacons */}
                  <div className="relative w-full h-[270px] sm:h-[300px] overflow-hidden bg-[#9eb3be]">
                    <BentoInteractiveMap onOpenMap={() => goTab('map')} />
                    <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f172a]/85 backdrop-blur-md text-white text-[11px] font-bold shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Live GIS Cartography</span>
                    </div>
                    <div className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md text-[#0f172a] text-[10px] font-mono font-bold shadow-sm">
                      20.013°N, 73.821°E
                    </div>
                  </div>

                  {/* Bottom Text Area matching Image 3 style */}
                  <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 bg-[#b0c7d1]">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#233f4d] block">
                        Program area
                      </span>
                      <h3 className="text-3xl sm:text-4xl font-normal font-['Fraunces'] text-[#0a1f29] mt-1.5 leading-tight">
                        KK Wagh Campus
                        <br />
                        <span className="text-2xl sm:text-3xl font-light text-[#233f4d]">Nashik</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-[#2c4c5c] font-medium mt-3 leading-relaxed">
                        291 verified trees surveyed in field. Complete high-resolution satellite imagery, multi-spectral NDVI layers, and canopy thermal buffers.
                      </p>
                    </div>

                    <div className="pt-4 mt-6 border-t border-[#0a1f29]/15 flex items-center justify-between text-xs font-bold text-[#0a1f29]">
                      <span>Interactive Live Map</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform text-emerald-900 font-extrabold">
                        <span>Launch Full Map</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── CARD 2: TOP-MIDDLE CARD (Tree Identification & Age Finding - Golden Amber #f59e0b) ── */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => goTab('register')}
                  onKeyDown={(e) => e.key === 'Enter' && goTab('register')}
                  className="lg:col-span-4 group cursor-pointer rounded-3xl p-6 sm:p-7 bg-[#f59e0b] text-white shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-500/30 focus:outline-none focus:ring-4 focus:ring-amber-300/50"
                  style={{ minHeight: '260px' }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/15 text-white text-[11px] font-extrabold uppercase tracking-wider">
                        AI Vision &amp; Allometry
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                    </div>
                    <div className="text-5xl sm:text-6xl font-light font-['Plus_Jakarta_Sans'] tracking-tight text-white">
                      291+
                    </div>
                    <div className="text-sm font-bold text-white/95 uppercase tracking-wide">
                      tree identification &amp; age finding
                    </div>
                    <p className="text-xs text-white/85 leading-relaxed pt-1">
                      Automated botanical species detection with leaf &amp; bark classification, GBH trunk circumference allometry, and calibrated MAI growth rates.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                    <span>AI Classifier &amp; Calculator</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                      <span>Open Tool</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* ── CARD 4: TOP-RIGHT CARD (Campus Tree Suitability Photo Block) ── */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => goTab('analysis')}
                  onKeyDown={(e) => e.key === 'Enter' && goTab('analysis')}
                  className="lg:col-span-4 group cursor-pointer rounded-3xl overflow-hidden relative shadow-xl flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-950/40 focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
                  style={{ minHeight: '260px' }}
                >
                  <img
                    src="/campus_tree_plantation.jpg"
                    alt="Campus Tree Plantation & Stewardship"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  
                  <div className="relative z-10 p-6 sm:p-7 text-white space-y-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/30 backdrop-blur-md text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-400/30">
                      Afforestation Planning
                    </span>
                    <h4 className="text-2xl font-bold font-['Fraunces'] text-white">
                      Campus Tree Suitability
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed line-clamp-2">
                      Multi-criteria spatial scoring evaluating open pervious soil, 6m root clearance, and native drought-tolerant species pairing.
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-300">
                      <span>Inspect Candidate Spots</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* ── CARD 3: BOTTOM-MIDDLE CARD (Flora & Canopy Biodiversity Photo Block) ── */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => goTab('analysis')}
                  onKeyDown={(e) => e.key === 'Enter' && goTab('analysis')}
                  className="lg:col-span-4 group cursor-pointer rounded-3xl overflow-hidden relative shadow-xl flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-950/40 focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
                  style={{ minHeight: '260px' }}
                >
                  <img
                    src={PHOTO_CANOPY_SUN}
                    alt="Canopy & Biodiversity Health"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  
                  <div className="relative z-10 p-6 sm:p-7 text-white space-y-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/30 backdrop-blur-md text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-400/30">
                      Sentinel-2 10m MSI
                    </span>
                    <h4 className="text-2xl font-bold font-['Fraunces'] text-white">
                      Map &amp; Canopy Analysis
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed line-clamp-2">
                      Normalized Difference Vegetation Index (NDVI) quantifying photosynthetic vigor, canopy cover percentage, and Landsat surface heat cooling.
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-300">
                      <span>Explore Canopy Metrics</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* ── CARD 5: BOTTOM-RIGHT CARD (Impact Analysis & Carbon - Coral Red #ea580c) ── */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => goTab('analysis')}
                  onKeyDown={(e) => e.key === 'Enter' && goTab('analysis')}
                  className="lg:col-span-4 group cursor-pointer rounded-3xl p-6 sm:p-7 bg-[#ea580c] text-white shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-orange-500/30 focus:outline-none focus:ring-4 focus:ring-orange-300/50"
                  style={{ minHeight: '260px' }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/15 text-white text-[11px] font-extrabold uppercase tracking-wider">
                        Climate Science &amp; Law
                      </span>
                      <Scale className="w-4 h-4 text-orange-200" />
                    </div>
                    <div className="text-5xl sm:text-6xl font-light font-['Plus_Jakarta_Sans'] tracking-tight text-white">
                      18.5 t
                    </div>
                    <div className="text-sm font-bold text-white/95 uppercase tracking-wide">
                      impact analysis &amp; carbon accounting
                    </div>
                    <p className="text-xs text-white/85 leading-relaxed pt-1">
                      Validated Chave allometric biomass, locked CO₂ wood reservoirs, daily oxygen generation, and statutory 1:5 compensatory afforestation compliance.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                    <span>Calculate Ecological Impact</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                      <span>View Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ════ SECTION 3: INTERACTIVE GIS CARTOGRAPHY PREVIEW ════ */}
          <section className="py-24 bg-[#fbf9f4]">
            <div className="lp-container">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 lp-reveal">
                <div>
                  <span className="lp-section-kicker">Interactive Geospatial Map</span>
                  <h2 className="lp-section-title">Live Campus Tree Inventory</h2>
                  <p className="lp-section-desc">
                    Explore registered specimens mapped in real-time across the K.K. Wagh Engineering campus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goTab('map')}
                  className="btn-forest-primary shrink-0"
                >
                  <Map className="w-4 h-4" />
                  <span>Launch Full GIS Workspace</span>
                </button>
              </div>

              <div className="lp-reveal">
                <GisMapPreview />
              </div>
            </div>
          </section>

          {/* ════ SECTION 4: PLANTATION RECOMMENDATIONS HIGHLIGHT ════ */}
          <section className="py-24 bg-gradient-to-b from-[#f7f4ee] via-[#eef6ef] to-[#fbf9f4] border-y border-[#d0e4d0] text-[#142e1f]">
            <div className="lp-container">
              <div className="lp-editorial-grid items-center">
                <div className="lp-photo-frame h-[440px] lp-reveal shadow-md">
                  <img src={PHOTO_PLANTING_HANDS} alt="Field steward planting native tree sapling in fertile soil" />
                  <div className="lp-photo-caption">
                    Field stewards planting native drought-tolerant saplings in optimal candidate sites calculated from tree distances, open soil, and heat deficits.
                  </div>
                </div>
                <div className="lp-reveal">
                  <span className="inline-block text-xs uppercase font-extrabold text-[#1b4332] tracking-wider bg-[#d8f3dc] px-3.5 py-1 rounded-full border border-[#95d5b2]">
                    New Geospatial Feature
                  </span>
                  <h2 className="text-[#0a2316] text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4 leading-tight font-['Fraunces']">
                    Map-Based Tree Plantation Recommendations
                  </h2>
                  <p className="text-[#264434] text-base leading-relaxed mb-6 font-medium">
                    Our multi-criteria spatial algorithm screens study zones for open pervious soil (NRSC LULC),
                    checks tree-to-tree root clearance (minimum 6m spacing), calculates Sentinel-2 NDVI canopy deficit,
                    and pairs optimal spots with native drought-tolerant species (Neem, Rain Tree, Ashoka, Banyan).
                  </p>
                  <div className="space-y-3 mb-8 text-sm text-[#142e1f]">
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444] shadow-xs shrink-0" />
                      <span><strong className="text-[#0a2316]">Red Markers:</strong> High-priority investigation sites with high cooling need &amp; open soil</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b] shadow-xs shrink-0" />
                      <span><strong className="text-[#0a2316]">Orange Markers:</strong> Moderate priority infill opportunities</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] shadow-xs shrink-0" />
                      <span><strong className="text-[#0a2316]">Green Markers:</strong> Potential candidate spots</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTab('analysis')}
                    className="btn-forest-primary shadow-sm"
                  >
                    <span>View Plantation Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ════ SECTION 5: CALL TO ACTION FOOTER ════ */}
          <footer className="lp-footer">
            <div className="lp-container">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                {/* Brand Col */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Trees className="w-6 h-6 text-[#74c69d]" />
                    <span className="font-bold text-xl font-['Fraunces'] text-white">VanJeevan</span>
                  </div>
                  <p className="text-sm text-white/70 max-w-sm leading-relaxed mb-4">
                    AI-Powered GIS Tree Inventory &amp; Climate Impact System.
                    Evidence-based tree protection, biomass allometry, and sustainable campus planning.
                  </p>
                  <p className="text-xs text-[#74c69d]">
                    🌿 Every registered tree is a living landmark protected for future generations.
                  </p>
                </div>

                {/* Explore Links */}
                <div>
                  <h4>Platform Workspace</h4>
                  <button type="button" onClick={() => goTab('register')}>Tree Registration</button>
                  <button type="button" onClick={() => goTab('map')}>Live GIS Map</button>
                  <button type="button" onClick={() => goTab('analysis')}>Plantation Dashboard</button>
                  <button type="button" onClick={() => goTab('permits')}>Cutting Permits &amp; Voting</button>
                  <button type="button" onClick={() => goTab('history')}>Inventory Records</button>
                </div>

                {/* Editorial Pages */}
                <div>
                  <h4>Editorial Stories</h4>
                  <button type="button" onClick={() => navTo('who_we_are')}>Who We Are</button>
                  <button type="button" onClick={() => navTo('conservation')}>Why Trees Matter</button>
                  <button type="button" onClick={() => navTo('carbon')}>Carbon &amp; Satellites</button>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
                <span>© 2025 VanJeevan · K.K. Wagh Institute of Engineering Education &amp; Research, Nashik</span>
                <span>Satellite Data: Copernicus EU · USGS · ISRO NRSC</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Role-Based Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthDone}
        initialTab={authMode}
      />

      {/* Administrator Governance Console */}
      <AdminConsoleModal
        isOpen={showAdminConsole}
        onClose={() => setShowAdminConsole(false)}
      />

      {/* ─── DONATION MODAL (Support Agroforestry & Tree Planting) ─── */}
      {showDonateModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#fbf9f4] border border-stone-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-900 overflow-hidden">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setShowDonateModal(false);
                setDonationSuccess(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {!donationSuccess ? (
              <>
                {/* Header Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <Heart className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                  <span>Restore Degraded Land</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
                  Plant Trees with Farmers.
                  <br />
                  <span className="text-[#2d6a4f] italic font-serif">Restore Degraded Earth.</span>
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed">
                  Every $1 plants one agroforestry tree with verified GPS coordinates recorded in VanJeevan GIS. 
                  Farming families receive tree seedlings, regenerative agriculture training, and permanent food security.
                </p>

                {/* Tier Selection */}
                <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    { amount: 10, label: '10 Trees', desc: 'Family Garden' },
                    { amount: 25, label: '25 Trees', desc: 'Most Popular' },
                    { amount: 50, label: '50 Trees', desc: 'Half Acre' },
                    { amount: 100, label: '100 Trees', desc: 'Forest Plot' },
                  ].map((tier) => (
                    <button
                      key={tier.amount}
                      type="button"
                      onClick={() => {
                        setDonateTier(tier.amount);
                        setCustomDonation('');
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                        donateTier === tier.amount && !customDonation
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <span className="text-lg font-black font-sans">${tier.amount}</span>
                      <span className="text-[11px] font-bold mt-0.5">{tier.label}</span>
                      <span className="text-[9px] text-stone-500">{tier.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Or Enter Custom Amount ($USD):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={customDonation}
                      onChange={(e) => {
                        setCustomDonation(e.target.value);
                        if (e.target.value) setDonateTier(Number(e.target.value));
                      }}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Impact Summary */}
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs text-emerald-950 font-medium">
                  <div className="flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Your gift plants <strong>{customDonation ? Number(customDonation) || 0 : donateTier} trees</strong> with GIS telemetry</span>
                  </div>
                  <span className="font-bold text-emerald-800 shrink-0">~{(customDonation ? Number(customDonation) || 0 : donateTier) * 22} kg CO₂/yr</span>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={() => {
                    setDonationSuccess(true);
                    setStats((prev) => ({
                      ...prev,
                      trees: (prev.trees || 0) + (customDonation ? Number(customDonation) || 0 : donateTier),
                    }));
                  }}
                  className="mt-5 w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Donate ${customDonation ? customDonation : donateTier} &amp; Plant Trees</span>
                </button>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold font-serif text-stone-900">Thank You For Your Support!</h4>
                <p className="text-stone-600 text-sm mt-2 max-w-sm mx-auto">
                  Your donation has sponsored <strong>{customDonation ? customDonation : donateTier} agroforestry trees</strong>.
                  The seedling batch has been dispatched to community nurseries and registered in the VanJeevan GIS system.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDonateModal(false);
                      setDonationSuccess(false);
                      goTab('map');
                    }}
                    className="py-2.5 px-5 rounded-full bg-[#2d6a4f] hover:bg-[#1b3d2b] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    View Interactive GIS Map
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDonateModal(false);
                      setDonationSuccess(false);
                    }}
                    className="py-2.5 px-5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VIDEO STORY MODAL ─── */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all cursor-pointer"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/fW8amMC4rq8?autoplay=1"
                title="Trees for the Future - Regenerative Agroforestry & Forest Gardens"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-stone-900 text-stone-200 flex items-center justify-between text-xs">
              <span>VanJeevan &amp; Trees for the Future · Forest Garden Regenerative Approach</span>
              <button
                type="button"
                onClick={() => {
                  setShowVideoModal(false);
                  setShowDonateModal(true);
                }}
                className="text-blue-400 font-bold hover:underline cursor-pointer"
              >
                Donate Trees Now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
