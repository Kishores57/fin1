import { resolveSpeciesMeta } from './speciesCatalog.js';
import { retrieveSpeciesDocuments, bucketDocsBySource } from './localRag.js';

/** Ordered research pipeline requested by product flow */
export const RESEARCH_PIPELINE = [
  {
    id: 'FAO',
    name: 'FAO',
    fullName: 'Food and Agriculture Organization (FAO)',
    focus:
      'agroforestry role, food/fodder/timber uses, silviculture guidance, climate resilience, and plantation notes',
  },
  {
    id: 'ICRAF',
    name: 'ICRAF',
    fullName: 'ICRAF (World Agroforestry)',
    focus:
      'multipurpose tree uses, agroforestry systems, soil improvement, shade, and farmer livelihood value',
  },
  {
    id: 'USDA',
    name: 'USDA',
    fullName: 'USDA Plants / GRIN knowledge',
    focus:
      'plant profile, taxonomy, hardiness/climate notes, growth habit, and documented uses',
  },
  {
    id: 'GBIF',
    name: 'GBIF',
    fullName: 'Global Biodiversity Information Facility (GBIF)',
    focus:
      'accepted scientific name, taxonomic hierarchy, occurrence geography, and biodiversity records',
  },
  {
    id: 'IBP',
    name: 'India Biodiversity Portal',
    fullName: 'India Biodiversity Portal',
    focus:
      'India distribution, local/common names, ecology, habitat associations, and regional observations',
  },
  {
    id: 'FSI',
    name: 'Forest Survey of India',
    fullName: 'Forest Survey of India (FSI)',
    focus:
      'Indian forest context, canopy/carbon relevance, plantation importance, and inventory-style forestry value',
  },
];

async function fetchGbifNotes(scientificName, commonName) {
  try {
    const matchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`;
    const matchRes = await fetch(matchUrl, { signal: AbortSignal.timeout(12000) });
    if (!matchRes.ok) {
      return `GBIF lookup failed for ${commonName} (${scientificName}).`;
    }
    const match = await matchRes.json();
    if (!match || match.matchType === 'NONE' || !match.usageKey) {
      const retryUrl = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(commonName)}&limit=1`;
      const retryRes = await fetch(retryUrl, { signal: AbortSignal.timeout(12000) });
      const retryData = await retryRes.json();
      const first = retryData?.results?.[0];
      if (!first) {
        return `No confident GBIF taxonomic match found for ${commonName} (${scientificName}).`;
      }
      return [
        `GBIF search hit for ${commonName}:`,
        `- Scientific name: ${first.scientificName || 'n/a'}`,
        `- Canonical: ${first.canonicalName || 'n/a'}`,
        `- Rank: ${first.rank || 'n/a'}`,
        `- Family/Genus: ${[first.family, first.genus].filter(Boolean).join(' / ')}`,
        `- GBIF key: ${first.key}`,
      ].join('\n');
    }

    const speciesUrl = `https://api.gbif.org/v1/species/${match.usageKey}`;
    const speciesRes = await fetch(speciesUrl, { signal: AbortSignal.timeout(12000) });
    const sp = speciesRes.ok ? await speciesRes.json() : {};

    const occUrl = `https://api.gbif.org/v1/occurrence/search?taxonKey=${match.usageKey}&limit=0`;
    const occRes = await fetch(occUrl, { signal: AbortSignal.timeout(12000) });
    const occ = occRes.ok ? await occRes.json() : {};

    return [
      `GBIF taxonomic match for ${commonName}:`,
      `- Match type: ${match.matchType}`,
      `- Scientific name: ${match.scientificName || sp.scientificName || scientificName}`,
      `- Canonical: ${match.canonicalName || sp.canonicalName || 'n/a'}`,
      `- Status: ${match.status || sp.taxonomicStatus || 'n/a'}`,
      `- Family: ${match.family || sp.family || 'n/a'}`,
      `- Genus: ${match.genus || sp.genus || 'n/a'}`,
      `- GBIF usageKey: ${match.usageKey}`,
      `- Indexed occurrence records: ${typeof occ.count === 'number' ? occ.count : 'n/a'}`,
    ].join('\n');
  } catch (err) {
    console.error('GBIF fetch error:', err.message);
    return `GBIF request error for ${commonName}: ${err.message}`;
  }
}

async function researchSourceWithGemini(ai, source, meta, localSnippet) {
  if (!ai) return '';
  const prompt = `You are a botanical research assistant.

Task: Enrich knowledge for ${source.fullName} about ONE species only.

Species common name: ${meta.common}
Scientific name: ${meta.scientific}
Family: ${meta.family}
Also known as: ${(meta.aliases || []).join(', ')}

Focus areas for this source: ${source.focus}

Local RAG evidence already retrieved for this species:
---
${localSnippet || 'No local snippet.'}
---

Rules:
1. Write 6-10 concise bullet points specifically about ${meta.common} (${meta.scientific}).
2. Prefer facts consistent with the local RAG evidence and ${source.fullName}.
3. Never discuss unrelated trees.
4. Plain text bullets only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response?.text?.trim() || '';
  } catch (err) {
    console.error(`Gemini ${source.id} research failed:`, err.message);
    return '';
  }
}

function pickLocalForSource(buckets, sourceId) {
  if (sourceId === 'FAO') return buckets.FAO.join('\n');
  if (sourceId === 'ICRAF') return buckets.ICRAF.join('\n');
  if (sourceId === 'USDA') return buckets.USDA.join('\n');
  if (sourceId === 'GBIF') return buckets.GBIF.join('\n');
  if (sourceId === 'IBP') return buckets.IBP.join('\n');
  if (sourceId === 'FSI') return buckets.FSI.join('\n');
  return '';
}

/**
 * Research flow:
 * 1) Local RAG retrieve for selected species (always)
 * 2) FAO → ICRAF → USDA → GBIF → IBP → FSI source notes
 * 3) Live GBIF API
 * 4) Optional Gemini enrichment if GEMINI_API_KEY is set
 */
export async function gatherSpeciesKnowledge(ai, speciesName) {
  const meta = resolveSpeciesMeta(speciesName);
  console.log(
    `Multi-source research start: ${meta.common} (${meta.scientific}) → local RAG → FAO → ICRAF → USDA → GBIF → IBP → FSI`
  );

  const local = await retrieveSpeciesDocuments(speciesName, 14);
  console.log(
    `  Local RAG hits for ${meta.common}: ${local.hitCount} chunks (terms: ${local.terms.join(', ')})`
  );

  const buckets = bucketDocsBySource(local.combinedText);
  const sourceNotes = [];

  for (const source of RESEARCH_PIPELINE) {
    console.log(`  Searching ${source.name} for ${meta.common}...`);
    const localSnippet =
      pickLocalForSource(buckets, source.id) ||
      local.texts.slice(0, 2).join('\n\n');

    let text = '';
    if (source.id === 'GBIF') {
      const gbifLive = await fetchGbifNotes(meta.scientific, meta.common);
      const gbifGemini = await researchSourceWithGemini(ai, source, meta, localSnippet);
      text = [localSnippet, gbifLive, gbifGemini].filter(Boolean).join('\n\n');
    } else {
      const geminiBits = await researchSourceWithGemini(ai, source, meta, localSnippet);
      text = [localSnippet, geminiBits].filter(Boolean).join('\n\n');
      if (!text) {
        text = `${source.fullName}: no retrieved notes yet for ${meta.common} (${meta.scientific}).`;
      }
    }

    sourceNotes.push({
      id: source.id,
      name: source.name,
      fullName: source.fullName,
      text,
    });
  }

  const combinedText = [
    `### LOCAL RAG RETRIEVAL FOR ${meta.common} (${meta.scientific})\nHits: ${local.hitCount}\n\n${local.combinedText}`,
    ...sourceNotes.map((s) => `### SOURCE: ${s.fullName}\n${s.text}`),
  ]
    .filter(Boolean)
    .join('\n\n');

  console.log(
    `Multi-source research complete for ${meta.common}. context_chars=${combinedText.length}`
  );

  return {
    meta,
    pipeline: RESEARCH_PIPELINE.map((s) => s.name),
    sourceNotes,
    localHitCount: local.hitCount,
    combinedText,
  };
}
