import db from '../database/connection.js';
import { resolveSpeciesMeta } from './speciesCatalog.js';

/**
 * Keyword/scoring retrieval from local document_chunks.
 * Works WITHOUT Gemini embeddings — this is the offline RAG backbone.
 */
export async function retrieveSpeciesDocuments(speciesName, nResults = 12) {
  const meta = resolveSpeciesMeta(speciesName);
  const terms = Array.from(
    new Set(
      [
        meta.common,
        meta.scientific,
        meta.family,
        ...(meta.aliases || []),
        ...(meta.scientific || '').split(' '),
      ]
        .filter(Boolean)
        .map((t) => String(t).toLowerCase().trim())
        .filter((t) => t.length > 2)
    )
  );

  const chunks = await db.all('SELECT id, text, source FROM document_chunks');
  if (!chunks.length) {
    return {
      meta,
      terms,
      texts: [],
      combinedText: '',
      hitCount: 0,
    };
  }

  const scored = [];
  for (const chunk of chunks) {
    const hay = `${chunk.source}\n${chunk.text}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (!hay.includes(term)) continue;
      // stronger weight for scientific name / common name hits
      const weight =
        term === String(meta.scientific).toLowerCase()
          ? 8
          : term === String(meta.common).toLowerCase()
            ? 6
            : 2;
      // count rough occurrences
      let idx = 0;
      let occ = 0;
      while ((idx = hay.indexOf(term, idx)) !== -1) {
        occ += 1;
        idx += term.length;
        if (occ > 8) break;
      }
      score += weight * occ;
    }

    // Prefer the dedicated calculator KB file
    if (String(chunk.source).includes('calculator_species_multisource_kb')) {
      score *= 1.5;
    }

    if (score > 0) {
      scored.push({ ...chunk, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, nResults);
  const texts = top.map((c) => `[doc:${c.source}]\n${c.text}`);

  return {
    meta,
    terms,
    texts,
    combinedText: texts.join('\n\n'),
    hitCount: top.length,
  };
}

/** Slice local docs into source-tagged buckets for the pipeline UI */
export function bucketDocsBySource(combinedText) {
  const buckets = {
    FAO: [],
    ICRAF: [],
    USDA: [],
    GBIF: [],
    IBP: [],
    FSI: [],
    GENERAL: [],
  };

  const blocks = String(combinedText || '')
    .split(/\n(?=\[)/)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    if (/\[FAO\]/i.test(block)) buckets.FAO.push(block);
    else if (/\[ICRAF\]/i.test(block)) buckets.ICRAF.push(block);
    else if (/\[USDA\]/i.test(block)) buckets.USDA.push(block);
    else if (/\[GBIF\]/i.test(block)) buckets.GBIF.push(block);
    else if (/\[India Biodiversity Portal\]/i.test(block)) buckets.IBP.push(block);
    else if (/\[FSI\]/i.test(block)) buckets.FSI.push(block);
    else buckets.GENERAL.push(block);
  }

  return buckets;
}
