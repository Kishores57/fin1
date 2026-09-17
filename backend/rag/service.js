import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import db from '../database/connection.js';
import { settings } from '../config.js';
import { gatherSpeciesKnowledge } from './multiSourceResearch.js';
import {
  buildLocalClimateSummary,
  buildLocalMedicinalSummary,
  buildLocalHabitatSummary,
} from './localSpeciesPacks.js';

let ai = null;
if (settings.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: settings.GEMINI_API_KEY });
} else {
  console.warn('GEMINI_API_KEY not configured. RAG summaries will run in mock fallback mode.');
}

/**
 * Creates document_chunks table and populates it if empty
 */
export async function ingestDocuments() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        source TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        embedding TEXT
      )
    `);

    const row = await db.get('SELECT COUNT(*) as count FROM document_chunks');
    const count = row ? row.count : 0;
    const newFileRow = await db.get(
      "SELECT COUNT(*) as count FROM document_chunks WHERE id LIKE 'calculator_species_multisource_kb.txt%'"
    );
    const isNewIngested = newFileRow ? newFileRow.count : 0;
    if (count > 0 && isNewIngested > 0) {
      console.log(`Document chunk collection already contains ${count} chunks.`);
      return;
    } else if (count > 0 && isNewIngested === 0) {
      console.log('New calculator species KB detected. Clearing and re-ingesting document chunks...');
      await db.run('DELETE FROM document_chunks');
    }

    console.log('Document chunk collection is empty. Ingesting documents...');
    const docDir = settings.RAG_DOCUMENT_DIR;
    if (!fs.existsSync(docDir)) {
      console.warn(`Document directory ${docDir} does not exist. Creating it.`);
      fs.mkdirSync(docDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(docDir).filter((f) => f.endsWith('.txt'));
    if (files.length === 0) {
      console.warn(`No document files (*.txt) found in ${docDir} for RAG ingestion.`);
      return;
    }

    let chunkCount = 0;
    for (const filename of files) {
      const filePath = path.join(docDir, filename);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const paragraphs = content
          .split('\n\n')
          .map((p) => p.trim())
          .filter(Boolean);

        for (let idx = 0; idx < paragraphs.length; idx++) {
          const paraText = paragraphs[idx];
          const id = `${filename}_chunk_${idx}`;
          let embeddingStr = null;

          if (ai) {
            try {
              const embedResponse = await ai.models.embedContent({
                model: 'text-embedding-004',
                contents: paraText,
              });
              if (
                embedResponse &&
                embedResponse.embedding &&
                embedResponse.embedding.values
              ) {
                embeddingStr = JSON.stringify(embedResponse.embedding.values);
              }
            } catch (embedError) {
              console.error(`Error generating embedding for chunk ${id}:`, embedError);
            }
          }

          if (!embeddingStr) {
            // Fallback zero vector
            const zeroVector = new Array(768).fill(0.0);
            embeddingStr = JSON.stringify(zeroVector);
          }

          await db.run(
            'INSERT INTO document_chunks (id, text, source, chunk_index, embedding) VALUES (?, ?, ?, ?, ?)',
            [id, paraText, filename, idx, embeddingStr]
          );
          chunkCount++;
        }
      } catch (err) {
        console.error(`Failed to read/process file ${filename}:`, err);
      }
    }

    console.log(`Successfully ingested ${chunkCount} chunks into SQLite document cache.`);
  } catch (error) {
    console.error('Error during document ingestion:', error);
  }
}

/**
 * Computes cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Performs semantic search and retrieves top N matching chunks
 */
async function retrieveContext(query, nResults = 3) {
  if (!ai) {
    return '';
  }
  try {
    const embedResponse = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: query,
    });
    if (
      !embedResponse ||
      !embedResponse.embedding ||
      !embedResponse.embedding.values
    ) {
      return '';
    }
    const queryVector = embedResponse.embedding.values;

    const chunks = await db.all('SELECT text, embedding FROM document_chunks');
    const scoredChunks = [];

    for (const chunk of chunks) {
      let chunkVector;
      try {
        chunkVector = JSON.parse(chunk.embedding);
      } catch (e) {
        continue;
      }
      if (!chunkVector || chunkVector.length !== queryVector.length) {
        continue;
      }
      const similarity = cosineSimilarity(queryVector, chunkVector);
      scoredChunks.push({ text: chunk.text, similarity });
    }

    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    return scoredChunks
      .slice(0, nResults)
      .map((c) => c.text)
      .join('\n\n');
  } catch (err) {
    console.error('Error retrieving context from document cache:', err);
    return '';
  }
}

function extractLabeled(context, label) {
  if (!context) return '';
  const re = new RegExp(`${label}:\\s*([^\\n]+(?:\\n(?![A-Z][A-Z_/ ]+:)[^\\n]+)*)`, 'i');
  const m = context.match(re);
  return m ? m[1].trim() : '';
}

function firstSourceLine(context, tag) {
  const m = String(context || '').match(new RegExp(`\\[${tag}\\]([^\\n]+)`, 'i'));
  return m ? m[1].trim() : '';
}

function clip(text, max = 320) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function buildSpeciesFallbackSummary(meta, age, biomass, carbon, co2, pipeline = [], context = '') {
  const name = meta.common;
  const sci = meta.scientific;
  const fam = meta.family;
  const ctx = String(context || '');
  const hasCtx = ctx.length > 80;

  const taxonomyLine =
    extractLabeled(ctx, 'TAXONOMY') ||
    `Common: ${name}; Scientific: ${sci}; Family: ${fam}.`;
  const habitatLine =
    extractLabeled(ctx, 'HABITAT') ||
    `Typical growing sites and soil/moisture needs of ${name} (${sci}).`;
  const medicinalLine =
    extractLabeled(ctx, 'MEDICINAL') ||
    `Traditional medicinal associations reported for ${name} (${sci}).`;
  const culturalLine =
    extractLabeled(ctx, 'CULTURAL') ||
    `Cultural and social roles of ${name} in South Asian landscapes.`;
  const pestsLine =
    extractLabeled(ctx, 'PESTS') ||
    `Common pests/diseases to monitor on ${name}.`;
  const carbonLine =
    extractLabeled(ctx, 'CARBON/CLIMATE') ||
    `For this measured ${name}: age ${Number(age).toFixed(1)} yr, biomass ${Number(biomass).toFixed(2)} kg, carbon ${Number(carbon).toFixed(2)} kg, CO₂ ${Number(co2).toFixed(2)} kg.`;
  const bioLine =
    extractLabeled(ctx, 'BIODIVERSITY') ||
    `Wildlife and pollinator associations linked to ${name}.`;

  const fao = firstSourceLine(ctx, 'FAO');
  const icraf = firstSourceLine(ctx, 'ICRAF');
  const usda = firstSourceLine(ctx, 'USDA');
  const gbif = firstSourceLine(ctx, 'GBIF');
  const ibp = firstSourceLine(ctx, 'India Biodiversity Portal');
  const fsi = firstSourceLine(ctx, 'FSI');

  const section = (title, icon, fields) => ({
    title,
    icon,
    short_description: fields.short,
    scientific_explanation: fields.sci,
    importance: fields.importance,
    real_world_example: fields.example,
    interesting_fact: fields.fact,
    conservation_message: fields.conserve,
    confidence: fields.confidence || (hasCtx ? 'High (local RAG retrieval)' : 'Low (no RAG hits)'),
  });

  return {
    identification: section('Tree Identification', 'Trees', {
      short: `How to recognize ${name} (${sci}).`,
      sci: clip(`${taxonomyLine} ${usda || fao}`.trim()),
      importance: `Correct ID of ${name} prevents mixing it with look-alike trees and keeps carbon, medicinal, and habitat claims species-accurate.`,
      example: clip(usda || fao || `Nursery and avenue planting lists register ${name} under ${sci}.`),
      fact: clip(`Accepted scientific name used in this report: ${sci} (family ${fam}).`),
      conserve: `Misidentifying or casually replacing mature ${name} erases a verified species entry from the local canopy inventory.`,
    }),
    taxonomy: section('Taxonomy', 'Compass', {
      short: `Classification of ${name}.`,
      sci: clip(taxonomyLine),
      importance: `Taxonomy anchors every later claim (habitat, pests, carbon) to ${sci}, not a generic “tropical tree”.`,
      example: clip(gbif || `GBIF / USDA-style checklists list ${name} as ${sci}, family ${fam}.`),
      fact: clip(`Aliases used in retrieval: ${(meta.aliases || []).join(', ') || name}.`),
      conserve: `Protecting named ${name} genotypes keeps traceable botanical identity in urban and farm plantings.`,
    }),
    description: section('Botanical Description', 'BookOpen', {
      short: `Physical form of ${name}.`,
      sci: clip(usda || fao || `${name} (${sci}) is documented as a ${fam} species with species-specific canopy and leaf traits.`),
      importance: `Botanical traits of ${name} drive shade quality, biomass equations, and wildlife use of its canopy.`,
      example: clip(`Field crews use leaf, bark, and crown form to confirm ${name} during GBH/height surveys.`),
      fact: clip(usda || `Growth habit notes for ${name} come from USDA/FAO-style plant profiles in the RAG pack.`),
      conserve: `Felling a mature ${name} removes decades of species-specific architecture that saplings cannot instantly replace.`,
    }),
    habitat: section('Habitat', 'Compass', {
      short: `Where ${name} grows best.`,
      sci: clip(habitatLine),
      importance: `Matching ${name} to the right moisture, soil, and climate zone raises survival and long-term carbon performance.`,
      example: clip(ibp || icraf || `India Biodiversity Portal / agroforestry notes place ${name} in homestead, farm, or urban niches.`),
      fact: clip(habitatLine),
      conserve: `Planting ${name} outside its preferred habitat wastes stock and weakens local greening outcomes.`,
    }),
    distribution: section('Geographic Distribution', 'Globe', {
      short: `Where ${name} is recorded.`,
      sci: clip(gbif || ibp || `Occurrence framing for ${name} (${sci}) from GBIF / India Biodiversity Portal notes.`),
      importance: `Knowing the native vs cultivated range of ${name} guides whether it is a local conservation priority or an introduced amenity tree.`,
      example: clip(gbif || `GBIF occurrence summaries are used to map cultivated and wild records of ${name}.`),
      fact: clip(ibp || `Regional Indian observations help localize ${name} beyond global averages.`),
      conserve: `Local provenances of ${name} are more valuable than random nursery stock for resilience.`,
    }),
    climate_preference: section('Climate Preference', 'Thermometer', {
      short: `Climate niche of ${name}.`,
      sci: clip(fao || habitatLine || `${name} prefers climates consistent with its tropical/subtropical profile.`),
      importance: `Climate fit determines whether this ${name} will keep sequestering carbon or fail under heat, frost, or drought stress.`,
      example: clip(fao || `FAO agroforestry guidance uses climate envelopes when recommending ${name} for farms and towns.`),
      fact: clip(`Measured tree age for this ${name}: ${Number(age).toFixed(1)} years — climate stress compounds with age/size.`),
      conserve: `Losing climate-suited mature ${name} increases heat and irrigation burdens nearby.`,
    }),
    soil: section('Soil Requirements', 'Leaf', {
      short: `Soil needs of ${name}.`,
      sci: clip(habitatLine),
      importance: `Soil drainage and texture control root health of ${name}, which in turn controls canopy cooling and biomass gain.`,
      example: clip(icraf || `ICRAF-style farm planting of ${name} succeeds on suitable, non-waterlogged soils.`),
      fact: clip(`Poor drainage is a frequent failure cause for tropical trees like ${name} in compacted urban pits.`),
      conserve: `Soil sealing around ${name} roots cuts water infiltration and shortens tree lifespan.`,
    }),
    ecological_importance: section('Ecological Importance', 'Activity', {
      short: `Ecosystem role of ${name}.`,
      sci: clip(icraf || fsi || bioLine || fao),
      importance: `${name} contributes shade, litter, and structure that support farm/urban microclimates beyond a single ornamental role.`,
      example: clip(icraf || fsi || `Agroforestry and TOF programs count ${name} toward livelihood and canopy goals.`),
      fact: clip(bioLine),
      conserve: `Removing ${name} collapses local shade and habitat services tied specifically to this species’ canopy.`,
    }),
    biodiversity_associations: section('Biodiversity Associations', 'Bird', {
      short: `Wildlife links to ${name}.`,
      sci: clip(bioLine),
      importance: `${name} flowers, fruit, or foliage can feed or shelter species that do not use every other street tree the same way.`,
      example: clip(ibp || `Biodiversity notes for ${name} inform park planting for birds and insects.`),
      fact: clip(bioLine),
      conserve: `Cutting ${name} during flowering/fruiting removes a seasonal food pulse for dependent fauna.`,
    }),
    pollinators: section('Pollinators', 'Bug', {
      short: `Pollinator value of ${name}.`,
      sci: clip(bioLine || `Flowering ${name} supports bees and other insects where nectar/pollen are available.`),
      importance: `Pollinator visits to ${name} support fruit set (for fruiting species) and neighborhood bee forage diversity.`,
      example: clip(`Homestead and orchard plantings of ${name} are often timed around flowering for pollinator benefit.`),
      fact: clip(`Protecting bloom periods of ${name} matters more for pollinators than keeping only non-flowering ornamentals.`),
      conserve: `Pesticide spray on flowering ${name} can wipe out local bee forage in a single week.`,
    }),
    carbon_sequestration: section('Carbon Sequestration', 'Leaf', {
      short: `Carbon stored by this ${name}.`,
      sci: clip(`${carbonLine} ${fsi}`.trim()),
      importance: `This ${name}’s measured biomass (${Number(biomass).toFixed(1)} kg) and carbon (${Number(carbon).toFixed(1)} kg) are tree-specific, not a generic average.`,
      example: clip(fsi || `FSI/TOF-style accounting uses species plantings like ${name} in tree-cover and carbon narratives.`),
      fact: clip(`Estimated lifetime CO₂ equivalent for this ${name}: ${Number(co2).toFixed(1)} kg.`),
      conserve: `Felling this ${name} risks releasing stored carbon and ending further annual sequestration.`,
    }),
    climate_impact: section('Climate Impact & Shading', 'Zap', {
      short: `Cooling and climate services of ${name}.`,
      sci: clip(carbonLine || fao),
      importance: `Canopy shade from ${name} lowers local surface temperatures and can reduce cooling energy demand nearby.`,
      example: clip(`Urban designers place ${name} on heat-exposed edges for species-appropriate shade form.`),
      fact: clip(`At ${Number(age).toFixed(1)} years, this ${name} already provides measurable shade biomass (${Number(biomass).toFixed(1)} kg).`),
      conserve: `Replacing mature ${name} with saplings creates a multi-year shade gap and heat spike.`,
    }),
    medicinal_uses: section('Medicinal Uses', 'Syringe', {
      short: `Medicinal profile of ${name}.`,
      sci: clip(medicinalLine),
      importance: `Medicinal claims must stay tied to ${name} (${sci}) — other trees have different phytochemistry.`,
      example: clip(`Traditional preparations, if used, should cite ${name} parts specifically (leaf/bark/fruit) and clinical caution.`),
      fact: clip(medicinalLine),
      conserve: `Over-harvesting bark/leaves of wild ${name} can threaten local populations even if the species is cultivated elsewhere.`,
    }),
    cultural_spirituality: section('Cultural & Spiritual Significance', 'Heart', {
      short: `Cultural role of ${name}.`,
      sci: clip(culturalLine),
      importance: `Cultural protection often keeps ${name} standing when purely economic trees are cut.`,
      example: clip(culturalLine || `Temple, festival, or homestead traditions may center on ${name}.`),
      fact: clip(culturalLine),
      conserve: `Ignoring cultural status of ${name} can trigger community conflict and loss of sacred canopy patches.`,
    }),
    diseases_pests: section('Diseases & Pests', 'ShieldAlert', {
      short: `Health risks for ${name}.`,
      sci: clip(pestsLine),
      importance: `Pest pressure on ${name} reduces growth, fruiting, and carbon gain if unmanaged.`,
      example: clip(`IPM schedules for ${name} should target the pests named in local extension notes, not generic sprays.`),
      fact: clip(pestsLine),
      conserve: `Severe untreated outbreaks can kill mature ${name} and erase stored carbon quickly.`,
    }),
    conservation_status: section('Conservation Status', 'ShieldCheck', {
      short: `Stewardship priority for ${name}.`,
      sci: clip(fsi || ibp || `Retain mature ${name} in farms, temples, and urban TOF for canopy continuity.`),
      importance: `Even common cultivated ${name} is worth protecting at site scale for shade, carbon, and culture.`,
      example: clip(fsi || `Municipal tree policies can list ${name} among priority retain/replace species.`),
      fact: clip(ibp || `Local occurrence notes help decide if ${name} is abundant or scarce in your district.`),
      conserve: `“Common species” is not a reason to clear healthy mature ${name} without replacement planning.`,
    }),
    interesting_facts: section('Interesting Facts', 'Sparkles', {
      short: `Notable points about ${name}.`,
      sci: clip(fao || icraf || usda || `${name} (${sci}) multi-source RAG profile.`),
      importance: `Memorable, species-true facts help communities advocate for keeping ${name}.`,
      example: clip(icraf || fao || `Extension stories about ${name} work better than generic “trees are good” messaging.`),
      fact: clip(bioLine || medicinalLine || culturalLine || `${sci} is the scientific handle for ${name}.`),
      conserve: `Share species-specific value of ${name} when opposing unnecessary felling.`,
    }),
    references: section('References and Sources Used', 'Info', {
      short: `Pipeline: ${(pipeline || []).join(' → ') || 'FAO → ICRAF → USDA → GBIF → India Biodiversity Portal → Forest Survey of India'} → Gemini/local RAG`,
      sci: `Evidence for ${name} assembled from local RAG tags [FAO], [ICRAF], [USDA], [GBIF], [India Biodiversity Portal], [FSI], plus live GBIF where available.`,
      importance: `Transparent sources show each claim is about ${name}, not a recycled Neem/Ashoka template.`,
      example: `Re-run Calculate after updating documents to refresh ${name} retrieval.`,
      fact: hasCtx
        ? `Local RAG returned substantial context for ${name} (${ctx.length} characters).`
        : `Local RAG context was thin for ${name}; add documents or enable Gemini.`,
      conserve: `Keep source-backed stewardship guidance attached to ${name} inventories.`,
      confidence: hasCtx ? 'High (retrieved context present)' : 'Low',
    }),
    research_pipeline: pipeline,
  };
}

function isGenericSectionText(text, speciesName) {
  const t = String(text || '').toLowerCase();
  if (!t || t.length < 20) return true;
  const generics = [
    'this field is mapped specifically',
    'field and inventory use-cases',
    'has traits distinct from other calculator',
    'species-specific notes for',
    'information not available',
  ];
  if (generics.some((g) => t.includes(g))) return true;
  // identical tiny template that only swaps the species name
  if (t === `this field is mapped specifically to selected species ${String(speciesName || '').toLowerCase()}.`) {
    return true;
  }
  return false;
}

/** Prefer Gemini text, but replace empty/generic fields with RAG-built unique fallbacks */
function mergeSummaryWithFallback(geminiObj, fallbackObj, speciesName) {
  if (!geminiObj || typeof geminiObj !== 'object') return fallbackObj;
  const out = { ...fallbackObj, ...geminiObj, research_pipeline: geminiObj.research_pipeline || fallbackObj.research_pipeline };
  for (const key of Object.keys(fallbackObj)) {
    if (key === 'research_pipeline') continue;
    const g = geminiObj[key];
    const f = fallbackObj[key];
    if (!g || typeof g !== 'object') {
      out[key] = f;
      continue;
    }
    out[key] = { ...f, ...g };
    for (const field of [
      'short_description',
      'scientific_explanation',
      'importance',
      'real_world_example',
      'interesting_fact',
      'conservation_message',
      'confidence',
      'title',
      'icon',
    ]) {
      if (isGenericSectionText(out[key][field], speciesName) && f[field]) {
        out[key][field] = f[field];
      }
    }
  }
  return out;
}

export const ragService = {
  async generateSummary(species, age, biomass, carbon, co2, latitude, longitude, prefetchedResearch = null) {
    // Offline-first local species packs for reliable project demos (no Gemini required)
    const localPack = buildLocalClimateSummary(species, age, biomass, carbon, co2);
    if (localPack) {
      console.log(`Using LOCAL species pack for climatic summary: ${species}`);
      // Optional Gemini enrichment if key works; never block demo on API failure
      if (ai && process.env.USE_GEMINI_ENRICHMENT === 'true') {
        try {
          const research = prefetchedResearch || (await gatherSpeciesKnowledge(ai, species));
          const promptBoost = `Improve this JSON for species ${species} using context, keep structure identical, keep all fields unique:\n${JSON.stringify(localPack)}\n\nContext:\n${research.combinedText.slice(0, 12000)}`;
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: promptBoost,
            config: { responseMimeType: 'application/json' },
          });
          if (response?.text) {
            const parsed = JSON.parse(response.text.trim());
            return JSON.stringify(mergeSummaryWithFallback(parsed, localPack, species));
          }
        } catch (err) {
          console.warn('Gemini enrichment skipped, using local pack:', err.message);
        }
      }
      return JSON.stringify(localPack);
    }

    const research = prefetchedResearch || (await gatherSpeciesKnowledge(ai, species));
    const meta = research.meta;
    const context = research.combinedText;

    const oxygen = carbon * 2.67;
    const oxygenDaysPerson = (oxygen / 0.84).toFixed(0);
    const co2EquivalentKm = (co2 / 0.12).toFixed(0);
    const locationContext = (latitude !== null && longitude !== null)
      ? `Tree Location: Latitude ${latitude}, Longitude ${longitude}. Use this geographical location to provide localized details in the analysis if relevant.`
      : 'Tree Location: Location coordinates not provided.';

    const prompt = `
You are an Environmental Scientist, Forest Ecologist, and Botanical Research Expert.

RESEARCH PIPELINE USED (in order):
${research.pipeline.join(' → ')} → Gemini summarize

SELECTED SPECIES (dropdown selection — use ONLY this tree):
- Common name: ${meta.common}
- Scientific name: ${meta.scientific}
- Family: ${meta.family}
- Aliases: ${(meta.aliases || []).join(', ')}

Field measurements / computed metrics for THIS ${meta.common} tree:
Estimated Age: ${age.toFixed(1)} years
Aboveground Biomass: ${biomass.toFixed(2)} kg
Carbon Stored: ${carbon.toFixed(2)} kg
CO2 Sequestered: ${co2.toFixed(2)} kg
Oxygen Released: ${oxygen.toFixed(2)} kg
(For context: ~${oxygenDaysPerson} person-days of O₂; ~${co2EquivalentKm} km car-equivalent CO₂)
${locationContext}

Retrieved multi-source knowledge (FAO, ICRAF, USDA, GBIF, India Biodiversity Portal, Forest Survey of India):
---
${context}
---

Your Task:
Summarize the retrieved source notes into a Climatic Impact Analysis JSON for the UI.
Every sentence and field MUST be specifically about ${meta.common} (${meta.scientific}) only.
Do NOT mention Neem, Ashoka, Rubber, or any other species unless it is the selected species.

Return a JSON object with this structure:
{
  "identification": {
    "title": "Tree Identification",
    "icon": "Trees",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "taxonomy": {
    "title": "Taxonomy",
    "icon": "Compass",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "description": {
    "title": "Botanical Description",
    "icon": "BookOpen",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "habitat": {
    "title": "Habitat",
    "icon": "Compass",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "distribution": {
    "title": "Geographic Distribution",
    "icon": "Globe",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "climate_preference": {
    "title": "Climate Preference",
    "icon": "Thermometer",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "soil": {
    "title": "Soil Requirements",
    "icon": "Leaf",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "ecological_importance": {
    "title": "Ecological Importance",
    "icon": "Activity",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "biodiversity_associations": {
    "title": "Biodiversity Associations",
    "icon": "Bird",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "pollinators": {
    "title": "Pollinators",
    "icon": "Bug",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "carbon_sequestration": {
    "title": "Carbon Sequestration",
    "icon": "Leaf",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "climate_impact": {
    "title": "Climate Impact & Shading",
    "icon": "Zap",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "medicinal_uses": {
    "title": "Medicinal Uses",
    "icon": "Syringe",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "cultural_spirituality": {
    "title": "Cultural & Spiritual Significance",
    "icon": "Heart",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "diseases_pests": {
    "title": "Diseases & Pests",
    "icon": "ShieldAlert",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "conservation_status": {
    "title": "Conservation Status",
    "icon": "ShieldCheck",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "interesting_facts": {
    "title": "Interesting Facts",
    "icon": "Sparkles",
    "short_description": "...",
    "scientific_explanation": "...",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "...",
    "confidence": "..."
  },
  "references": {
    "title": "References and Sources Used",
    "icon": "Info",
    "short_description": "Research pipeline: ${research.pipeline.join(' → ')} → Gemini",
    "scientific_explanation": "List each source and what it contributed for ${meta.common}.",
    "importance": "...",
    "real_world_example": "...",
    "interesting_fact": "...",
    "conservation_message": "Preserve ${meta.common} using source-backed stewardship guidance.",
    "confidence": "..."
  },
  "research_pipeline": ${JSON.stringify(research.pipeline)}
}

Rules:
1. Valid JSON only. Every section needs all fields (title, icon, short_description, scientific_explanation, importance, real_world_example, interesting_fact, conservation_message, confidence).
2. Ground explanations in the retrieved multi-source notes. If a detail is missing, say "Information not available for ${meta.common}" — never invent another species.
3. Taxonomy must include scientific name ${meta.scientific}, family ${meta.family}, and common name ${meta.common}.
4. Carbon/climate sections must reference the computed metrics for THIS tree and FSI/FAO-style framing where relevant.
5. Medicinal/cultural/pest sections must be unique to ${meta.common}.
6. references.short_description must mention the pipeline: FAO → ICRAF → USDA → GBIF → India Biodiversity Portal → Forest Survey of India → Gemini.
7. CRITICAL UI RULE: For every section, importance, real_world_example, and interesting_fact MUST be unique sentences about THAT section's topic for ${meta.common}. Do NOT reuse the same sentence across sections. Never write placeholder lines like "This field is mapped specifically..." or "Field and inventory use-cases...".
`;

    const fallbackObj = buildSpeciesFallbackSummary(
      meta,
      age,
      biomass,
      carbon,
      co2,
      research.pipeline,
      research.combinedText
    );

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });
        if (response && response.text) {
          try {
            const parsed = JSON.parse(response.text.trim());
            const merged = mergeSummaryWithFallback(parsed, fallbackObj, meta.common);
            return JSON.stringify(merged);
          } catch (parseErr) {
            console.error('Gemini JSON parse failed, using RAG fallback summary:', parseErr.message);
          }
        }
      } catch (err) {
        console.error('Error calling Gemini API for multi-source summary:', err);
      }
    }

    return JSON.stringify(fallbackObj);
  },

  async generateMedicinalSummary(species, prefetchedResearch = null) {
    const local = buildLocalMedicinalSummary(species);
    if (local) {
      console.log(`Using LOCAL medicinal pack for: ${species}`);
      return JSON.stringify(local);
    }

    const research = prefetchedResearch || (await gatherSpeciesKnowledge(ai, species));
    const meta = research.meta;
    const context = research.combinedText;

    const prompt = `
You are a scientific AI assistant specializing in ethnobotany and pharmacology.
Analyze ONLY this dropdown species:
- Common: ${meta.common}
- Scientific: ${meta.scientific}
- Family: ${meta.family}

Multi-source research notes (FAO → ICRAF → USDA → GBIF → India Biodiversity Portal → FSI):
---
${context}
---

Return JSON:
{
  "compounds": ["..."],
  "applications": ["..."],
  "diseases": ["..."],
  "description": "2-4 sentence paragraph about medicinal value of ${meta.common} only."
}

Rules:
1. Every item must be about ${meta.common} (${meta.scientific}) only — never another tree.
2. Valid JSON only.
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        if (response?.text) return response.text.trim();
      } catch (err) {
        console.error('Error calling Gemini API for medicinal summary:', err);
      }
    }

    return JSON.stringify({
      compounds: medicinalFromContext(research.combinedText, meta),
      applications: [`Traditional preparations associated with ${meta.common}`],
      diseases: diseasesFromContext(research.combinedText, meta),
      description:
        extractLabeled(research.combinedText, 'MEDICINAL') ||
        `Medicinal notes for ${meta.common} (${meta.scientific}) retrieved from local multi-source RAG documents for this selected species.`,
    });
  },

  async generateHabitatSummary(species, prefetchedResearch = null) {
    const local = buildLocalHabitatSummary(species);
    if (local) {
      console.log(`Using LOCAL habitat pack for: ${species}`);
      return JSON.stringify(local);
    }

    const research = prefetchedResearch || (await gatherSpeciesKnowledge(ai, species));
    const meta = research.meta;
    const context = research.combinedText;

    const prompt = `
You are an urban ecology and wildlife biology assistant.
Analyze ONLY this dropdown species:
- Common: ${meta.common}
- Scientific: ${meta.scientific}
- Family: ${meta.family}

Multi-source research notes (FAO → ICRAF → USDA → GBIF → India Biodiversity Portal → FSI):
---
${context}
---

Return JSON:
{
  "birds": ["Common name (Scientific name)", "..."],
  "insects": ["...", "..."],
  "mammals": ["...", "..."],
  "description": "2-4 sentence paragraph on how ${meta.common} supports biodiversity."
}

Rules:
1. Associations must be plausible for ${meta.common} only.
2. Do not list wildlife for unrelated trees.
3. Valid JSON only.
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        if (response?.text) return response.text.trim();
      } catch (err) {
        console.error('Error calling Gemini API for habitat summary:', err);
      }
    }

    const bio =
      extractLabeled(research.combinedText, 'BIODIVERSITY') ||
      `Habitat support for ${meta.common} (${meta.scientific}) from local RAG retrieval.`;

    return JSON.stringify({
      birds: [`Birds associated with ${meta.common} canopy`],
      insects: [`Pollinators visiting ${meta.common}`],
      mammals: [`Small mammals using ${meta.common} habitat`],
      description: bio,
    });
  },
};

function medicinalFromContext(context, meta) {
  const line = extractLabeled(context, 'MEDICINAL');
  if (line && line.toLowerCase().includes('mangiferin')) return ['Mangiferin', 'Polyphenols'];
  if (line && line.toLowerCase().includes('tannin')) return ['Tannins', 'Flavonoids'];
  if (line && line.toLowerCase().includes('arecoline')) return ['Arecoline', 'Tannins'];
  return [`Secondary metabolites of ${meta.common}`];
}

function diseasesFromContext(context, meta) {
  const pests = extractLabeled(context, 'PESTS');
  if (pests) return [pests.slice(0, 80)];
  return ['Species-specific traditional indications (verify clinically)'];
}

export default ragService;
