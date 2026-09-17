import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, Loader2 } from 'lucide-react';

/* ──────────────────────────────────────────────────────
   DATA: Indian Tree Protection Laws
   ────────────────────────────────────────────────────── */
const TREE_LAWS = [
  {
    title: 'Indian Forest Act, 1927',
    badge: 'Central Law',
    purpose: 'Consolidates all laws relating to forests and the transit of forest-produce. Empowers state governments to constitute Reserved Forests, Protected Forests, and Village Forests.',
    rules: 'In a Reserved Forest, no person may cut, fell, or girdle trees, or remove any forest produce without lawful authority. Trespassing with cattle is also prohibited.',
    penalties: 'Imprisonment up to 6 months and/or fine up to ₹500 (enhanced to ₹10,000+ by many states). Cognizable and non-bailable offences.',
    link: 'https://www.indiacode.nic.in/handle/123456789/2252',
  },
  {
    title: 'Forest (Conservation) Act, 1980',
    badge: 'Central Law',
    purpose: 'Restricts the use of forest land for any non-forest purpose (mining, roads, industry, settlements) without prior approval of the Central Government.',
    rules: 'No state government can de-reserve or divert forest land without Central Government approval. Compensatory afforestation on equivalent non-forest land is mandatory.',
    penalties: 'Simple imprisonment up to 15 days (Section 3A). Illegal activity must be stopped and land restored. Officers are personally liable.',
    link: 'https://forestsclearance.nic.in/',
  },
  {
    title: 'Wildlife Protection Act, 1972',
    badge: 'Central Law',
    purpose: 'Provides comprehensive protection to wild animals, birds, and plants. Establishes National Parks, Wildlife Sanctuaries, and Conservation Reserves.',
    rules: 'No tree, grass, leaf, or other vegetation shall be cut inside Protected Areas without written permission of the Chief Wildlife Warden. Disturbing habitat by burning or felling is expressly prohibited.',
    penalties: 'Imprisonment up to 3 years and/or fine up to ₹25,000 for general offences. For Tiger Reserves: 3–7 years imprisonment. Vehicles used in the offence can be seized.',
    link: 'https://www.moef.gov.in/division/wildlife-division/wildlife-protection-act-1972/',
  },
  {
    title: 'Environment (Protection) Act, 1986',
    badge: 'Central Law',
    purpose: 'Umbrella framework to protect the environment covering air, water, land, and living beings. Enables Ecologically Sensitive Zone (ESZ) notifications restricting tree felling around forests.',
    rules: 'Government can prohibit or restrict industries in ecologically fragile areas. Compensatory afforestation and Environmental Impact Assessments are mandated for forest-clearing projects.',
    penalties: 'Imprisonment up to 5 years and/or fine up to ₹1 lakh per offence. Additional ₹5,000/day for continued violations. After 1 year, imprisonment may extend to 7 years.',
    link: 'https://www.moef.gov.in/',
  },
  {
    title: 'Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975',
    badge: 'State Law — Maharashtra',
    purpose: 'Protects trees in urban areas of Mumbai, Pune, Nashik, Nagpur, and all municipal corporation areas in Maharashtra — one of India\'s most comprehensive urban tree protection statutes.',
    rules: 'No tree may be cut, felled, lopped, or girdled without prior written permission from the Tree Authority. Compensatory plantation of 2–5 trees per tree felled is mandatory.',
    penalties: 'Fine up to ₹1 lakh+ (municipal by-laws). Imprisonment up to 1 year for continued violations after notice. Heritage trees in Mumbai: fines up to ₹5 lakh.',
    link: 'https://www.maharashtra.gov.in/',
  },
  {
    title: 'National Green Tribunal Act, 2010',
    badge: 'Central Law',
    purpose: 'Establishes the NGT for expeditious disposal of environmental cases. Citizens can petition directly against illegal felling or failure to enforce tree protection laws — without paying court fees.',
    rules: 'NGT can grant interim injunctions to stop ongoing felling immediately. Can order mandatory replantation, restoration, and award compensation. Any person can file a petition.',
    penalties: 'Up to ₹10 crore on individuals, ₹25 crore on companies per violation. Imprisonment up to 3 years for non-compliance. NGT can direct project closure until compliance is achieved.',
    link: 'https://www.greentribunal.gov.in/',
  },
];

/* ──────────────────────────────────────────────────────
   DATA: Location Context Rules
   ────────────────────────────────────────────────────── */
const LOCATION_CONTEXT = {
  school: {
    label: 'School / Educational Institution Nearby',
    importance: (name, species) =>
      `This ${species} is located near ${name || 'a school'}. Children spend several hours daily at schools where clean air directly impacts cognitive development and health. This tree produces oxygen, filters PM2.5 particulates, and reduces CO₂ in the school's microclimate. Research shows trees near schools reduce children's pollutant exposure by up to 30%, improving attendance and academic performance. Removing this tree would degrade air quality at a location where children — especially vulnerable to respiratory impacts — spend their formative years.`,
  },
  college: {
    label: 'College / University Campus Nearby',
    importance: (name, species) =>
      `This ${species} is situated near ${name || 'a college or university'}. Dense campus populations create concentrated CO₂ and heat islands. This tree actively sequesters carbon, produces oxygen for students and staff, provides cooling shade that reduces air-conditioning load by 15–30%, and supports student mental well-being — urban greenery is scientifically linked to reduced academic stress and improved focus. The tree also intercepts rainwater, protecting campus infrastructure from flooding.`,
  },
  university: {
    label: 'University Campus Nearby',
    importance: (name, species) =>
      `Adjacent to ${name || 'a university'}, this ${species} provides an irreplaceable ecological service. Research institutions benefit from proximate greenery in biodiversity studies, ecological research, and student wellness programs. Beyond oxygen production and carbon sequestration, this tree supports the campus's natural scientific and ecological capital — an outdoor laboratory that cannot be recreated once lost.`,
  },
  hospital: {
    label: 'Hospital / Healthcare Facility Nearby',
    importance: (name, species) =>
      `This ${species} stands near ${name || 'a hospital'}. Medical facilities house patients with compromised immune and respiratory systems who are extremely sensitive to air quality. This tree removes harmful PM2.5, NO₂, and ozone from surrounding air, and its canopy reduces heat-island effects that worsen respiratory distress. Clinical studies demonstrate that patients in rooms overlooking trees recover faster and require less pain medication. Felling this tree would reduce air quality at a critical healthcare location.`,
  },
  park: {
    label: 'Public Park / Green Space Nearby',
    importance: (name, species) =>
      `Adjacent to ${name || 'a public park'}, this ${species} contributes to an important ecological corridor sustaining urban wildlife, pollinators, and community recreation. It amplifies the park's biodiversity value by providing additional nesting habitat, nectar sources, and canopy cover. Removing it would fragment the green corridor and reduce the park's ecological productivity and community value.`,
  },
  playground: {
    label: "Children's Playground Nearby",
    importance: (name, species) =>
      `Situated near ${name || 'a playground'}, this ${species} provides critical shade that keeps surfaces and air cool enough for safe outdoor play during hot months. It produces oxygen and filters pollutants in an area where children engage in physical activity and breathe deeply. Loss of this tree would expose children to increased heat, UV radiation, and poorer air quality during outdoor play.`,
  },
  market: {
    label: 'Market / Commercial Area Nearby',
    importance: (name, species) =>
      `Located near ${name || 'a market or commercial zone'}, this ${species} counteracts elevated pollution, noise, and heat generated by vehicle traffic. Market areas have significantly higher PM2.5 and exhaust emissions — this tree acts as a biological filter and also reduces noise by 6–10 dB and prevents heat build-up that makes outdoor commercial spaces uncomfortable.`,
  },
  place_of_worship: {
    label: 'Temple / Place of Worship Nearby',
    importance: (name, species) =>
      `This ${species} grows near ${name || 'a place of worship'}. In Indian tradition, trees near temples are considered sacred guardians. Beyond spiritual significance, they provide oxygen-rich, cool, and peaceful environments that enhance sanctity and devotees' mental well-being. Many such trees are protected under customary law as heritage trees — their felling would constitute both an ecological and cultural loss.`,
  },
  residential: {
    label: 'Residential Area Nearby',
    importance: (name, species) =>
      `This ${species} stands within a residential neighbourhood. For local residents, it provides daily benefits: fresh oxygen, shade reducing indoor temperatures by 3–5°C, natural noise buffering, and greenery proven to reduce property crime and improve mental health. It also intercepts rainwater, protecting local drainage infrastructure. The community directly depends on this tree for everyday quality of life.`,
  },
};

/* ──────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────── */
function safeParse(raw, fallback = {}) {
  try {
    if (raw && typeof raw === 'string' && raw.trim().startsWith('{')) return JSON.parse(raw);
    if (raw && typeof raw === 'object') return raw;
  } catch { /* ignore */ }
  return fallback;
}

function reportId(result) {
  const ts = Date.now().toString(36).toUpperCase();
  const sp = (result?.species_name || 'TREE').replace(/\s+/g, '').slice(0, 6).toUpperCase();
  return `VJ-${sp}-${ts}`;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    return data.display_name || null;
  } catch { return null; }
}

async function fetchNearbyPlaces(lat, lng) {
  const radius = 600;
  const query = `[out:json][timeout:15];(node["amenity"~"school|college|university|hospital|clinic|marketplace|place_of_worship|playground"](around:${radius},${lat},${lng});node["leisure"~"park|garden|playground"](around:${radius},${lat},${lng});way["amenity"~"school|college|university|hospital|clinic|marketplace|place_of_worship|playground"](around:${radius},${lat},${lng});way["leisure"~"park|garden|playground"](around:${radius},${lat},${lng}););out center 12;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: query, signal: AbortSignal.timeout(12000),
    });
    return (await res.json()).elements || [];
  } catch { return []; }
}

function buildLocationImportance(places, species) {
  const seen = new Set();
  const results = [];
  for (const el of places) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || '';
    const amenity = tags.amenity || tags.leisure || tags.landuse || '';
    let key = null;
    if (/school/i.test(amenity)) key = 'school';
    else if (/college/i.test(amenity)) key = 'college';
    else if (/university/i.test(amenity)) key = 'university';
    else if (/hospital|clinic/i.test(amenity)) key = 'hospital';
    else if (/park|garden/i.test(amenity)) key = 'park';
    else if (/playground/i.test(amenity)) key = 'playground';
    else if (/market/i.test(amenity)) key = 'market';
    else if (/worship/i.test(amenity)) key = 'place_of_worship';
    else if (/residential/i.test(amenity)) key = 'residential';
    if (key && !seen.has(key) && LOCATION_CONTEXT[key]) {
      seen.add(key);
      const ctx = LOCATION_CONTEXT[key];
      results.push({ label: ctx.label, placeName: name, importance: ctx.importance(name, species) });
      if (results.length >= 4) break;
    }
  }
  return results;
}

/* ──────────────────────────────────────────────────────
   PRINT HTML GENERATOR
   Builds a complete standalone HTML page as a string
   ────────────────────────────────────────────────────── */
function buildPrintHTML({ result, reportID, address, locationCards, doNotCutPoints }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const climate = safeParse(result.summary, {});
  const medicinal = safeParse(result.medicinal_impact, {});
  const habitat = safeParse(result.habitat_support, {});

  const co2 = Number(result.co2 || 0);
  const oxygen = Number(result.oxygen || 0);
  const biomass = Number(result.biomass || 0);
  const carbon = Number(result.carbon || 0);
  const age = Number(result.age || 0);
  const co2Km = (co2 / 0.12).toFixed(0);
  const o2Days = (oxygen / 0.84).toFixed(0);

  const metrics = [
    ['Above Ground Biomass', biomass.toFixed(2), 'kg', 'Woody trunk, branch, and foliage mass'],
    ['Below Ground Biomass', (biomass * 0.26).toFixed(2), 'kg', 'Root system — IPCC 26% AGB factor'],
    ['Total Biomass', (biomass * 1.26).toFixed(2), 'kg', 'Combined above and below ground'],
    ['Carbon Stored', carbon.toFixed(2), 'kg', '47% of dry biomass is pure carbon'],
    ['CO₂ Sequestered (Lifetime)', co2.toFixed(2), 'kg', `Equivalent to ${co2Km} km driven by car`],
    ['Annual CO₂ Absorption', age > 0 ? (co2 / age).toFixed(2) : '—', 'kg/yr', 'Lifetime average per year'],
    ['Oxygen Released', oxygen.toFixed(2), 'kg', `Supports one person for ${o2Days} days`],
    ['Height', Number(result.height || 0).toFixed(1), 'm', 'Measured standing height'],
    ['Girth (GBH)', Number(result.gbh || 0).toFixed(1), 'cm', 'Girth at breast height (130 cm)'],
    ['Diameter (DBH)', Number(result.dbh || 0).toFixed(2), 'cm', 'Derived from GBH ÷ π'],
    ['Estimated Age', age.toFixed(1), 'years', 'Computed from GBH growth rate model'],
  ];

  // Build location section HTML
  const locationHTML = locationCards.length > 0
    ? locationCards.map(card => `
      <div class="location-box">
        <div class="location-type">📍 ${card.label}${card.placeName ? ` — "${card.placeName}"` : ''}</div>
        <p class="location-text">${card.importance}</p>
      </div>`).join('')
    : `<div class="no-location">
        ${result.latitude && result.longitude
          ? 'No major public amenities (schools, hospitals, parks, markets) were detected within 600m via OpenStreetMap. The tree still provides essential environmental services to the surrounding neighbourhood including oxygen production, carbon sequestration, rainwater interception, wildlife habitat, and urban cooling.'
          : 'GPS coordinates were not provided for this tree. To generate a location-specific importance analysis, capture the GPS coordinates using the "Use Current Location" button and regenerate the report.'
        }
       </div>`;

  // Build laws section HTML
  const lawsHTML = TREE_LAWS.map(law => `
    <div class="law-item">
      <span class="law-badge">${law.badge}</span>
      <div class="law-title">${law.title}</div>
      <p class="law-row"><strong>Purpose:</strong> ${law.purpose}</p>
      <p class="law-row"><strong>Key Rules:</strong> ${law.rules}</p>
      <div class="law-penalty">⚖️ <strong>Penalties:</strong> ${law.penalties}</div>
    </div>`).join('');

  // Build conservation section HTML
  const conserveHTML = doNotCutPoints && doNotCutPoints.length > 0
    ? doNotCutPoints.map((p, i) => `
      <div class="conserve-item">
        <div class="conserve-badge">🛡 Conservation Reason ${i + 1} — ${p.title || ''}</div>
        <p class="conserve-text">${p.highlight || p.conservation_message || ''}</p>
        ${p.support ? `<p class="conserve-support">${p.support}</p>` : ''}
      </div>`).join('')
    : '';

  // Build climate analysis HTML
  const climateEntries = Object.entries(climate).filter(([k]) => !['research_pipeline', 'identification'].includes(k));
  const climateHTML = climateEntries.map(([key, section]) => {
    if (!section || typeof section !== 'object') return '';
    const text = section.scientific_explanation || section.importance || section.short_description || '';
    const fact = section.interesting_fact || '';
    const conservation = section.conservation_message || '';
    if (!text) return '';
    return `
      <div class="analysis-item">
        <div class="analysis-heading">${section.title || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
        <p class="analysis-text">${text}</p>
        ${fact ? `<div class="fact-box">💡 ${fact}</div>` : ''}
        ${conservation ? `<div class="conserve-note">🛡 ${conservation}</div>` : ''}
      </div>`;
  }).join('');

  // Build habitat HTML
  const birds = habitat.birds || [];
  const insects = habitat.insects || [];
  const mammals = habitat.mammals || [];
  const habitatHTML = (birds.length || insects.length || mammals.length) ? `
    ${habitat.description ? `<p class="analysis-text" style="margin-bottom:10px">${habitat.description}</p>` : ''}
    <div class="fauna-grid">
      ${birds.length ? `<div><div class="fauna-title">🐦 Birds</div>${birds.map(x => `<div>• ${x}</div>`).join('')}</div>` : ''}
      ${insects.length ? `<div><div class="fauna-title">🐛 Insects</div>${insects.map(x => `<div>• ${x}</div>`).join('')}</div>` : ''}
      ${mammals.length ? `<div><div class="fauna-title">🦎 Mammals</div>${mammals.map(x => `<div>• ${x}</div>`).join('')}</div>` : ''}
    </div>` : '';

  // Build medicinal HTML
  const medHTML = (medicinal.description || (medicinal.applications && medicinal.applications.length > 0)) ? `
    ${medicinal.description ? `<p class="analysis-text">${medicinal.description}</p>` : ''}
    ${medicinal.applications && medicinal.applications.length ? `<p class="analysis-text"><strong>Applications:</strong> ${medicinal.applications.join(' · ')}</p>` : ''}
    ${medicinal.compounds && medicinal.compounds.length ? `<p class="analysis-text"><strong>Active Compounds:</strong> ${medicinal.compounds.join(' · ')}</p>` : ''}
    ${medicinal.diseases && medicinal.diseases.length ? `<p class="analysis-text"><strong>Traditionally Used For:</strong> ${medicinal.diseases.join(' · ')}</p>` : ''}` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>VanJeevan Tree Report — ${result.species_name || 'Tree'}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 15mm 14mm 15mm 14mm; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 10.5pt; color: #111; background: #fff; line-height: 1.58; }

  /* Header */
  .header { border-bottom: 3px solid #1b5e38; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-icon { width: 40px; height: 40px; background: #1b5e38; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .brand-name { font-size: 15pt; font-weight: bold; color: #1b5e38; }
  .brand-sub { font-size: 8pt; color: #666; letter-spacing: 0.03em; font-family: Arial, sans-serif; }
  .header-meta { text-align: right; font-size: 8pt; color: #555; line-height: 1.7; font-family: Arial, sans-serif; }
  .report-id { font-weight: bold; color: #1b5e38; font-family: 'Courier New', monospace; font-size: 9pt; }

  /* Species block */
  .species-block { background: #f0f7f0; border-left: 5px solid #1b5e38; border-radius: 4px; padding: 12px 16px; margin-bottom: 18px; }
  .species-name { font-size: 17pt; font-weight: bold; color: #1b3022; margin-bottom: 2px; }
  .species-sub { font-size: 9.5pt; color: #3d6b52; font-style: italic; margin-bottom: 8px; font-family: Arial, sans-serif; }
  .tags { display: flex; gap: 8px; flex-wrap: wrap; }
  .tag { font-size: 7.5pt; font-family: Arial, sans-serif; font-weight: bold; padding: 2px 9px; border-radius: 99px; border: 1px solid; letter-spacing: 0.04em; text-transform: uppercase; }
  .tag-g { background: #e8f5e9; color: #1b5e38; border-color: #a5d6a7; }
  .tag-b { background: #e3f2fd; color: #1565c0; border-color: #90caf9; }
  .tag-a { background: #fff8e1; color: #e65100; border-color: #ffcc80; }
  .tag-r { background: #fce4ec; color: #b71c1c; border-color: #f48fb1; }
  .address { font-size: 8.5pt; color: #555; margin-top: 7px; font-family: Arial, sans-serif; }

  /* Section titles */
  .section-title { font-size: 10.5pt; font-weight: bold; color: #1b5e38; border-bottom: 1.5px solid #c8e6c9; padding-bottom: 4px; margin: 22px 0 10px; text-transform: uppercase; letter-spacing: 0.06em; font-family: Arial, sans-serif; }

  /* Metrics table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-family: Arial, sans-serif; font-size: 9pt; }
  th { background: #1b5e38; color: #fff; padding: 6px 10px; text-align: left; font-size: 8.5pt; letter-spacing: 0.03em; }
  td { padding: 5px 10px; border-bottom: 1px solid #e8f5e9; color: #222; }
  tr:nth-child(even) td { background: #f9fffe; }
  .val { font-weight: bold; color: #1b5e38; font-family: 'Courier New', monospace; font-size: 9.5pt; }
  .note { font-size: 8pt; color: #666; }

  /* Location */
  .location-box { background: #fffde7; border: 1px solid #f9a825; border-left: 4px solid #f9a825; border-radius: 4px; padding: 10px 14px; margin-bottom: 8px; page-break-inside: avoid; }
  .location-type { font-size: 8pt; font-weight: bold; color: #e65100; text-transform: uppercase; letter-spacing: 0.05em; font-family: Arial, sans-serif; margin-bottom: 4px; }
  .location-text { font-size: 9.5pt; color: #333; line-height: 1.5; }
  .no-location { background: #f3f4f6; border: 1px dashed #9ca3af; border-radius: 4px; padding: 10px 14px; font-size: 9.5pt; color: #555; font-style: italic; font-family: Arial, sans-serif; }

  /* Laws */
  .law-item { border: 1px solid #c8e6c9; border-left: 4px solid #1b5e38; border-radius: 4px; padding: 10px 13px; margin-bottom: 8px; page-break-inside: avoid; }
  .law-badge { display: inline-block; font-size: 7pt; font-weight: bold; padding: 1px 7px; border-radius: 99px; background: #e8f5e9; border: 1px solid #a5d6a7; color: #1b5e38; margin-bottom: 4px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.04em; }
  .law-title { font-size: 10pt; font-weight: bold; color: #1b3022; margin-bottom: 4px; font-family: Arial, sans-serif; }
  .law-row { font-size: 9pt; color: #333; margin: 3px 0; line-height: 1.45; font-family: Arial, sans-serif; }
  .law-penalty { background: #fff3e0; border-left: 3px solid #e65100; padding: 4px 9px; margin-top: 5px; font-size: 9pt; color: #bf360c; border-radius: 0 3px 3px 0; font-family: Arial, sans-serif; }

  /* Conservation */
  .conserve-item { border: 1px solid #ffcdd2; border-left: 4px solid #c62828; border-radius: 4px; padding: 9px 13px; margin-bottom: 7px; page-break-inside: avoid; }
  .conserve-badge { font-size: 7.5pt; font-weight: bold; color: #c62828; text-transform: uppercase; letter-spacing: 0.05em; font-family: Arial, sans-serif; margin-bottom: 3px; }
  .conserve-text { font-size: 9.5pt; color: #333; line-height: 1.45; font-family: Arial, sans-serif; }
  .conserve-support { font-size: 8.5pt; color: #555; margin-top: 4px; font-family: Arial, sans-serif; }

  /* Analysis */
  .analysis-item { margin-bottom: 12px; page-break-inside: avoid; }
  .analysis-heading { font-size: 10pt; font-weight: bold; color: #1b3022; font-family: Arial, sans-serif; margin-bottom: 3px; }
  .analysis-text { font-size: 9.5pt; color: #333; line-height: 1.52; font-family: Arial, sans-serif; }
  .fact-box { background: #e8f5e9; border-left: 3px solid #43a047; padding: 5px 10px; margin-top: 5px; font-size: 9pt; color: #2e7d32; font-style: italic; border-radius: 0 3px 3px 0; font-family: Arial, sans-serif; }
  .conserve-note { background: #fce4ec; border-left: 3px solid #c62828; padding: 5px 10px; margin-top: 4px; font-size: 9pt; color: #b71c1c; border-radius: 0 3px 3px 0; font-family: Arial, sans-serif; }

  /* Fauna */
  .fauna-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 16px; font-size: 9pt; color: #333; font-family: Arial, sans-serif; }
  .fauna-title { font-weight: bold; color: #1b5e38; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }

  /* Footer */
  .footer { border-top: 2px solid #1b5e38; margin-top: 24px; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-start; font-size: 8pt; color: #777; font-family: Arial, sans-serif; }
  .disclaimer { max-width: 65%; line-height: 1.5; }
  .footer-right { text-align: right; line-height: 1.65; }
  .footer-brand { color: #1b5e38; font-weight: bold; font-size: 9pt; }

  /* Page breaks */
  .pb { page-break-before: always; break-before: page; }
  .no-break { page-break-inside: avoid; break-inside: avoid; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="brand">
    <div class="brand-icon">🌳</div>
    <div>
      <div class="brand-name">VanJeevan</div>
      <div class="brand-sub">AI-Powered GIS Tree Inventory &amp; Climatic Impact Analysis</div>
    </div>
  </div>
  <div class="header-meta">
    <div class="report-id">Report ID: ${reportID}</div>
    <div>Date: ${dateStr} at ${timeStr}</div>
    <div>Generated by: VanJeevan Platform</div>
    ${result.latitude && result.longitude ? `<div>GPS: ${Number(result.latitude).toFixed(5)}°N, ${Number(result.longitude).toFixed(5)}°E</div>` : ''}
  </div>
</div>

<!-- SPECIES BLOCK -->
<div class="species-block no-break">
  <div class="species-name">${result.species_name || 'Unknown Species'}</div>
  <div class="species-sub">Tree Species — VanJeevan Climatic &amp; Ecological Analysis Report</div>
  <div class="tags">
    <span class="tag tag-g">🌿 Age: ${age.toFixed(1)} yrs</span>
    <span class="tag tag-b">📏 Height: ${Number(result.height || 0).toFixed(1)} m</span>
    <span class="tag tag-b">🌀 GBH: ${Number(result.gbh || 0).toFixed(1)} cm</span>
    <span class="tag tag-a">🌍 CO₂: ${co2.toFixed(1)} kg</span>
    <span class="tag tag-g">💨 O₂: ${oxygen.toFixed(1)} kg</span>
    ${result.latitude && result.longitude ? '<span class="tag tag-r">📍 GPS Verified</span>' : ''}
  </div>
  ${address ? `<div class="address">📍 Location: ${address}</div>` : ''}
</div>

<!-- ENVIRONMENTAL METRICS -->
<div class="section-title">Environmental Impact Metrics</div>
<table>
  <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th><th>Scientific Note</th></tr></thead>
  <tbody>
    ${metrics.map(([label, val, unit, note]) => `
    <tr>
      <td>${label}</td>
      <td class="val">${val}</td>
      <td>${unit}</td>
      <td class="note">${note}</td>
    </tr>`).join('')}
  </tbody>
</table>

<!-- LOCATION IMPORTANCE -->
<div class="section-title pb">Importance to Local Surroundings</div>
${locationCards.length > 0 ? `<p class="analysis-text" style="margin-bottom:10px">Based on GPS coordinates, the following key locations were identified within 600m of this tree via OpenStreetMap. Each section explains this tree's specific ecological and social importance to that nearby environment.</p>` : ''}
${locationHTML}

<!-- LEGAL PROTECTION -->
<div class="section-title pb">Legal Protection Framework</div>
<p class="analysis-text" style="margin-bottom:10px">The following Indian laws provide legal protection to this tree. Any act of felling, girdling, lopping, or damaging this tree without lawful authority may constitute a criminal offence under one or more of these statutes.</p>
${lawsHTML}

<!-- CONSERVATION MANDATE -->
${conserveHTML ? `
<div class="section-title pb">Conservation Mandate — Why Not to Cut</div>
<p class="analysis-text" style="margin-bottom:10px">The following reasons, derived from this tree's climatic and ecological analysis, constitute scientific grounds for preservation:</p>
${conserveHTML}` : ''}

<!-- CLIMATIC ANALYSIS -->
${climateHTML ? `
<div class="section-title pb">Climatic &amp; Ecological Analysis</div>
${climateHTML}` : ''}

<!-- HABITAT -->
${habitatHTML ? `
<div class="section-title">Habitat &amp; Biodiversity Support</div>
${habitatHTML}` : ''}

<!-- MEDICINAL -->
${medHTML ? `
<div class="section-title">Medicinal &amp; Traditional Value</div>
${medHTML}` : ''}

<!-- FOOTER -->
<div class="footer">
  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated by the VanJeevan AI GIS Tree Inventory System. Climatic metrics are estimated using standard allometric equations (Chave et al.) and IPCC carbon constants. Location context is derived from OpenStreetMap data (Overpass API). This report may be used as supporting evidence in conservation petitions, municipal tree authority applications, and NGT filings.
  </div>
  <div class="footer-right">
    <div><strong>Report ID:</strong> ${reportID}</div>
    <div>Generated: ${dateStr}</div>
    <div>Platform: VanJeevan v1.0</div>
    <div class="footer-brand">🌳 VanJeevan</div>
  </div>
</div>

<script>
  // Auto print when the window loads
  window.onload = function() {
    setTimeout(function() { window.print(); }, 600);
  };
<\/script>
</body>
</html>`;
}

/* ──────────────────────────────────────────────────────
   MODAL PREVIEW (screen only)
   ────────────────────────────────────────────────────── */
function ReportModal({ result, onClose }) {
  const [address, setAddress] = useState(null);
  const [locationCards, setLocationCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doNotCutPoints] = useState(result._doNotCutPoints || []);
  const id = React.useMemo(() => reportId(result), [result]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const lat = result?.latitude;
      const lng = result?.longitude;
      if (lat && lng) {
        const [addr, places] = await Promise.all([
          reverseGeocode(lat, lng),
          fetchNearbyPlaces(lat, lng),
        ]);
        if (!cancelled) {
          setAddress(addr);
          setLocationCards(buildLocationImportance(places, result.species_name || 'tree'));
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [result]);

  const handlePrint = useCallback(() => {
    const html = buildPrintHTML({
      result,
      reportID: id,
      address,
      locationCards,
      doNotCutPoints,
    });
    const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (!win) {
      alert('Please allow pop-ups for this site to generate the PDF report.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }, [result, id, address, locationCards, doNotCutPoints]);

  const climate = safeParse(result.summary, {});
  const co2 = Number(result.co2 || 0);
  const oxygen = Number(result.oxygen || 0);
  const age = Number(result.age || 0);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#0f1a12', border: '1px solid rgba(167,201,87,0.2)', borderRadius: '16px',
        width: '100%', maxWidth: '760px', overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Toolbar */}
        <div style={{
          background: 'rgba(27,94,56,0.6)', backdropFilter: 'blur(12px)',
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderBottom: '1px solid rgba(167,201,87,0.2)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#a7c957" />
            <span style={{ color: '#e8f5e9', fontWeight: 700, fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>
              Tree Report — {result.species_name}
            </span>
            {loading && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Fetching location…
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#a7c957', color: '#1a2d0a', border: 'none', borderRadius: '9px',
                padding: '8px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Arial, sans-serif',
              }}
            >
              <Printer size={14} /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)', color: '#ccc', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '9px', padding: '8px 12px', fontWeight: 600, fontSize: '13px',
                cursor: 'pointer', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>

        {/* Hint */}
        <div style={{
          background: 'rgba(249,168,37,0.1)', borderBottom: '1px solid rgba(249,168,37,0.25)',
          padding: '9px 20px', fontSize: '12px', color: '#f59e0b', fontFamily: 'Arial, sans-serif', textAlign: 'center',
        }}>
          💡 Click <strong>"Print / Save as PDF"</strong> → In the print dialog, select <strong>"Save as PDF"</strong> as the destination.
          Use <strong>A4 paper</strong> and enable <strong>"Background graphics"</strong>.
        </div>

        {/* Quick summary preview */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '65vh' }}>
          <div style={{
            background: 'rgba(27,94,56,0.15)', border: '1px solid rgba(167,201,87,0.2)',
            borderLeft: '4px solid #a7c957', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#e8f5e9', marginBottom: '4px' }}>{result.species_name}</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              {[
                ['🌿', 'Age', `${age.toFixed(1)} yrs`],
                ['📏', 'Height', `${Number(result.height || 0).toFixed(1)} m`],
                ['🌍', 'CO₂', `${co2.toFixed(1)} kg`],
                ['💨', 'O₂', `${oxygen.toFixed(1)} kg`],
              ].map(([icon, label, val]) => (
                <div key={label} style={{
                  background: 'rgba(167,201,87,0.1)', border: '1px solid rgba(167,201,87,0.2)',
                  borderRadius: '8px', padding: '6px 12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '10px', color: '#a7c957', fontWeight: 700, fontFamily: 'Arial', textTransform: 'uppercase' }}>{icon} {label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#e8f5e9', fontFamily: 'monospace' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Report sections preview */}
          {[
            ['📊 Environmental Metrics', '11 calculated parameters including biomass, carbon, CO₂, oxygen, height, age'],
            ['📍 Location Importance', loading ? 'Fetching nearby schools, hospitals, parks via OpenStreetMap…' : locationCards.length > 0 ? `${locationCards.length} nearby location(s) identified: ${locationCards.map(c => c.label).join(', ')}` : 'No specific amenities found within 600m — general neighbourhood context included'],
            ['⚖️ Legal Framework', `${TREE_LAWS.length} applicable Indian laws with exact penalties — Indian Forest Act 1927, Wildlife Protection Act 1972, NGT Act 2010, and more`],
            doNotCutPoints.length > 0 ? ['🛡 Conservation Mandate', `${doNotCutPoints.length} AI-generated conservation reasons for this tree`] : null,
            Object.keys(climate).length > 0 ? ['🌡 Climatic Analysis', `${Object.keys(climate).filter(k => !['research_pipeline','identification'].includes(k)).length} scientific sections from RAG analysis`] : null,
          ].filter(Boolean).map(([title, desc]) => (
            <div key={title} style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '10px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <div style={{ color: '#a7c957', fontWeight: 700, fontSize: '13px', fontFamily: 'Arial', minWidth: '220px' }}>{title}</div>
              <div style={{ color: '#9ca3af', fontSize: '12px', fontFamily: 'Arial', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   EXPORTS
   ────────────────────────────────────────────────────── */
export default function TreeReportPrint({ result, doNotCutPoints = [], onClose }) {
  const enrichedResult = { ...result, _doNotCutPoints: doNotCutPoints };
  return createPortal(
    <ReportModal result={enrichedResult} onClose={onClose} />,
    document.body
  );
}

export function PrintReportButton({ result, doNotCutPoints = [], className = '' }) {
  const [open, setOpen] = useState(false);
  if (!result) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
          background: 'rgba(27,94,56,0.25)', border: '1px solid rgba(167,201,87,0.35)',
          color: '#a7c957', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Arial, sans-serif',
        }}
        title="Generate a formatted PDF report for this tree"
      >
        <FileText size={15} />
        Download PDF Report
      </button>
      {open && (
        <TreeReportPrint
          result={result}
          doNotCutPoints={doNotCutPoints}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
