import { getLocalSpeciesPack } from '../rag/localSpeciesPacks.js';
import { retrieveSpeciesDocuments } from '../rag/localRag.js';
import { SPECIES_CATALOG } from '../rag/speciesCatalog.js';

async function run() {
  console.log('Testing 18 species RAG retrieval & knowledge packs:\n');
  let totalDocs = 0;
  let passed = 0;
  const speciesList = Object.keys(SPECIES_CATALOG);

  for (const name of speciesList) {
    const res = await retrieveSpeciesDocuments(name, 5);
    const pack = getLocalSpeciesPack(name);
    const docCount = res.texts ? res.texts.length : 0;
    const hasDocs = docCount > 0;
    const sci = pack?.meta?.scientific;
    const family = pack?.meta?.family;
    const hasSci = sci && sci !== 'Unknown';

    console.log(
      (hasDocs && hasSci ? '✓ ' : '✗ ') +
      name.padEnd(20) +
      ' | chunks=' + docCount +
      ' | sci=' + sci +
      ' | family=' + family
    );

    totalDocs += docCount;
    if (hasDocs && hasSci) passed++;
  }

  console.log('\nResults: ' + passed + '/' + speciesList.length + ' species passed with full scientific packs and retrieved docs.');
  console.log('Total document chunks retrieved across species: ' + totalDocs);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
