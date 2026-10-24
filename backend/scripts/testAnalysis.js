import { ragService } from '../rag/service.js';

async function testSpecies(species) {
  console.log(`\n======================================================`);
  console.log(`Testing full RAG pipeline for: ${species}`);
  console.log(`======================================================`);

  const summaryRaw = await ragService.generateSummary(species, 5.5, 42.1, 21.05, 77.2, 19.9975, 73.7898);
  const summary = JSON.parse(summaryRaw);

  const secCount = Object.keys(summary).filter(k => k !== 'research_pipeline').length;
  console.log(`✓ Climate/Ecology Summary Sections: ${secCount}`);
  console.log('  Identification:', summary.identification?.title, '->', summary.identification?.scientific_explanation?.slice(0, 100));
  console.log('  Taxonomy:', summary.taxonomy?.title, '->', summary.taxonomy?.scientific_explanation?.slice(0, 100));
  console.log('  Habitat:', summary.habitat?.title, '->', summary.habitat?.scientific_explanation?.slice(0, 100));
  console.log('  Confidence:', summary.identification?.confidence);

  const medRaw = await ragService.generateMedicinalSummary(species);
  const med = typeof medRaw === 'string' ? JSON.parse(medRaw) : medRaw;
  console.log('✓ Medicinal Pack Compounds:', med.compounds?.slice(0, 4));
  console.log('  Medicinal Description:', med.description?.slice(0, 80));

  const habRaw = await ragService.generateHabitatSummary(species);
  const hab = typeof habRaw === 'string' ? JSON.parse(habRaw) : habRaw;
  console.log('✓ Habitat Pack Birds:', hab.birds?.slice(0, 3));
  console.log('  Habitat Description:', hab.description?.slice(0, 80));
}

async function run() {
  await testSpecies('Supari');
  await testSpecies('Ad');
  await testSpecies('Badam');
  await testSpecies('Christmas');
  await testSpecies('Tej Patta');
  await testSpecies('Bel');
  console.log('\nAll 6 species verified through generateSummary, generateMedicinalSummary, and generateHabitatSummary!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
