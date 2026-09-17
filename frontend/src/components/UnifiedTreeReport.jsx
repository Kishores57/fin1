import React, { useState } from 'react';
import { PrintReportButton } from './TreeReportPrint';
import { API_BASE_URL } from '../services/api';

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
    leafImage: raw.leaf_image || raw.leafImage || raw.leaf_photo || raw.photo || null,
    barkImage: raw.bark_image || raw.barkImage || raw.bark_photo || null,
    fullImage: raw.height_image || raw.heightImage || raw.height_photo || raw.fullImage || null,
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

function resolveImg(val) {
  if (!val) return null;
  if (val.startsWith('data:') || val.startsWith('http') || val.startsWith('/')) return val;
  return `${API_BASE_URL}/api/epicollect/media?name=${val}`;
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

function TabContent({ tabKey, tree }) {
  const co2Km = ((tree.co2 || 0) / 0.12).toFixed(0);
  const o2Days = ((tree.oxygen || 0) / 0.84).toFixed(0);

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
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.6rem', borderRadius: 6, color: '#fbbf24', fontSize: '0.82rem' }}>
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
          <Section title="Thermal & Microclimate Regulation" color="#fb923c">
            <InfoCards items={[
              { label: 'Canopy Shade', value: `~${Math.round(15 + (tree.age || 10) * 1.5)} m²`, sub: 'Direct shade footprint' },
              { label: 'Cooling Equivalent', value: '~10 Air Conditioners', sub: 'Operating 20 hrs/day' },
              { label: 'Stormwater Intercepted', value: `~${Math.round((tree.age || 10) * 2.4)} L/storm`, sub: 'Reduces surface runoff' },
            ]} />
          </Section>
          <Section title="Urban Heat Island Mitigation" color="#94a3b8">
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              Through <strong style={{ color: '#fb923c' }}>evapotranspiration</strong> and solar radiation interception, mature trees reduce surrounding surface temperatures by 2°C to 8°C.
              Asphalt roads under mature tree canopies measure up to 11°C cooler during Indian summers, directly lowering heat stroke hospitalizations and indoor air-conditioning power bills.
            </p>
          </Section>
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
            ]} />
          </Section>
          <Section title="Keystone Ecosystem Role" color="#94a3b8">
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              This tree functions as a <strong style={{ color: '#2dd4bf' }}>vital biological node</strong> in the urban ecosystem. Its fissured bark provides refuge for beneficial predatory insects, its flowers sustain wild pollinators, its foliage shelters migratory birds, and its organic leaf litter regenerates topsoil microbial communities.
            </p>
          </Section>
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

// ── Photo Card Component: Clean & Blank when missing ───────────────────────
function PhotoSlot({ src, label, accentColor }) {
  const [lightbox, setLightbox] = useState(false);

  // If user does not have added image, keep place clean, blank & understated
  if (!src) {
    return (
      <div style={{
        borderRadius: 14,
        border: '1px dashed rgba(255, 255, 255, 0.09)',
        background: 'rgba(255, 255, 255, 0.015)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 110,
        padding: '0.75rem',
        color: '#475569',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: '0.66rem', color: '#334155', fontStyle: 'italic' }}>
          Not Uploaded
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
          background: 'rgba(255, 255, 255, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: `0 4px 18px ${accentColor}18`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ height: 115, overflow: 'hidden', background: '#020617' }}>
          <img
            src={src}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: accentColor,
          padding: '0.35rem 0.5rem',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.9)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
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
            src={src}
            alt={label}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 14, boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
          />
        </div>
      )}
    </>
  );
}

// ── Main Unified Report Component ──────────────────────────────────────────
export default function UnifiedTreeReport({ tree: rawTree, mode = 'interactive', onPrint }) {
  const tree = normalizeTree(rawTree);
  const [activeTab, setActiveTab] = useState('oxygen');

  if (!tree) return null;

  const isPrint = mode === 'print';
  const leafSrc = resolveImg(tree.leafImage);
  const barkSrc = resolveImg(tree.barkImage);
  const fullSrc = resolveImg(tree.fullImage);
  const activeTabDef = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0', width: '100%' }}>

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
            }}>
              Analytical Arboreal Assessment
            </span>
            <h2 style={{
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
                <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>
                  {m.label}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#34d399' }}>
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

        {/* ── PHOTO ROW: When bark/tree missing, keep spots blank; only leaf shown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          <PhotoSlot src={leafSrc} label="Leaf / Foliage" accentColor="#34d399" />
          <PhotoSlot src={barkSrc} label="Trunk / Bark" accentColor="#fbbf24" />
          <PhotoSlot src={fullSrc} label="Entire Tree" accentColor="#60a5fa" />
        </div>
      </div>

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
                  fontWeight: isActive ? 800 : 500,
                  fontSize: '0.82rem',
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
            }}>
              {activeTabDef.label} Analysis
            </span>
          </div>

          <TabContent tabKey={activeTab} tree={tree} />
        </div>
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
        </div>
      )}
    </div>
  );
}
