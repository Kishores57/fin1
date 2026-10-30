/**
 * Download all biodiversity images to /public/biodiversity/
 * Run once: node scripts/downloadBiodiversityImages.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'biodiversity');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const IMAGES = [
  // Neem
  { file: 'common_myna.jpg',           url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Acridotheres_tristis00.jpg/320px-Acridotheres_tristis00.jpg' },
  { file: 'purple_sunbird.jpg',        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Purple_sunbird_male_-_Oman.jpg/320px-Purple_sunbird_male_-_Oman.jpg' },
  { file: 'asian_koel.jpg',            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Asian_Koel_I3-Arnav.jpg/320px-Asian_Koel_I3-Arnav.jpg' },
  { file: 'apis_cerana.jpg',           url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Apis_cerana_indica_-_honey_bee_-_LifeAndYouth.jpg/320px-Apis_cerana_indica_-_honey_bee_-_LifeAndYouth.jpg' },
  { file: 'lime_butterfly.jpg',        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Papilio_demoleus_ssp_demoleus-20131127.jpg/320px-Papilio_demoleus_ssp_demoleus-20131127.jpg' },
  { file: 'palm_squirrel.jpg',         url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/FunambuluspalmaurumDRC.jpg/320px-FunambuluspalmaurumDRC.jpg' },
  // Banyan
  { file: 'coppersmith_barbet.jpg',    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Coppersmith_Barbet_I_IMG_7661.jpg/320px-Coppersmith_Barbet_I_IMG_7661.jpg' },
  { file: 'rose_ringed_parakeet.jpg',  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Rose-ringed_Parakeet_%28Psittacula_krameri%29_in_Kolkata_I_IMG_5358.jpg/320px-Rose-ringed_Parakeet_%28Psittacula_krameri%29_in_Kolkata_I_IMG_5358.jpg' },
  { file: 'grey_hornbill.jpg',         url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Indian_Grey_Hornbill_Ocyceros_birostris.jpg/320px-Indian_Grey_Hornbill_Ocyceros_birostris.jpg' },
  { file: 'fig_wasp.jpg',              url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ficus_sycomorus_fruit_with_fig_wasp_emerging.jpg/320px-Ficus_sycomorus_fruit_with_fig_wasp_emerging.jpg' },
  { file: 'carpenter_bee.jpg',         url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Xylocopa_latipes_male.jpg/320px-Xylocopa_latipes_male.jpg' },
  { file: 'bonnet_macaque.jpg',        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Bonnet_macaque_%28Macaca_radiata%29_in_Karantaka_Luc_Viatour.jpg/320px-Bonnet_macaque_%28Macaca_radiata%29_in_Karantaka_Luc_Viatour.jpg' },
  { file: 'flying_fox.jpg',            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Pteropus_giganteus_in_flight.jpg/320px-Pteropus_giganteus_in_flight.jpg' },
  // Peepal
  { file: 'red_vented_bulbul.jpg',     url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Red-vented_Bulbul_%28Pycnonotus_cafer%29_in_Kolkata_I2_IMG_5145.jpg/320px-Red-vented_Bulbul_%28Pycnonotus_cafer%29_in_Kolkata_I2_IMG_5145.jpg' },
  { file: 'indian_white_eye.jpg',      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Zosterops_palpebrosus_-_Indian_White-eye.jpg/320px-Zosterops_palpebrosus_-_Indian_White-eye.jpg' },
  { file: 'fruit_bat.jpg',             url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Short-nosed_fruit_bat_%28Cynopterus_sphinx%29.jpg/320px-Short-nosed_fruit_bat_%28Cynopterus_sphinx%29.jpg' },
  // Mango
  { file: 'alexandrine_parakeet.jpg',  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Alexandrine-Parakeet-%28Psittacula-eupatria%29---Male.jpg/320px-Alexandrine-Parakeet-%28Psittacula-eupatria%29---Male.jpg' },
  { file: 'apis_florea.jpg',           url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Apis_florea_on_flower.jpg/320px-Apis_florea_on_flower.jpg' },
  { file: 'blue_tiger_butterfly.jpg',  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Tirumala_limniace_at_Kanhirode_during_Feb_2013.jpg/320px-Tirumala_limniace_at_Kanhirode_during_Feb_2013.jpg' },
  { file: 'palm_civet.jpg',            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Common_Palm_Civet.jpg/320px-Common_Palm_Civet.jpg' },
  // Rain Tree
  { file: 'black_drongo.jpg',          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Black_Drongo_%28Dicrurus_macrocercus%29_in_Hyderabad%2C_AP_W_IMG_2358.jpg/320px-Black_Drongo_%28Dicrurus_macrocercus%29_in_Hyderabad%2C_AP_W_IMG_2358.jpg' },
  { file: 'tailorbird.jpg',            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Common_Tailorbird_I2_IMG_2873.jpg/320px-Common_Tailorbird_I2_IMG_2873.jpg' },
  { file: 'apis_dorsata.jpg',          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Apis_dorsata_onsunflower.jpg/320px-Apis_dorsata_onsunflower.jpg' },
  { file: 'grass_jewel_butterfly.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Chilades_trochylus_male.jpg/320px-Chilades_trochylus_male.jpg' },
  // Ashoka
  { file: 'pale_billed_flowerpecker.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Pale-billed_Flowerpecker_Dicaeum_erythrorhynchos.jpg/320px-Pale-billed_Flowerpecker_Dicaeum_erythrorhynchos.jpg' },
  { file: 'common_jezebel.jpg',        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Common_Jezebel_Butterfly_%28Delias_eucharis%29_underside_in_Kolkata_I_IMG_3724.jpg/320px-Common_Jezebel_Butterfly_%28Delias_eucharis%29_underside_in_Kolkata_I_IMG_3724.jpg' },
  { file: 'hoverfly.jpg',              url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Syrphid_fly.jpg/320px-Syrphid_fly.jpg' },
  // Rubber
  { file: 'spotted_dove.jpg',          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Spotted_Dove_at_Kolkata_I_IMG_1988.jpg/320px-Spotted_Dove_at_Kolkata_I_IMG_1988.jpg' },
  { file: 'magpie_robin.jpg',          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Copsychus_saularis_male_-_Kolkata_2011-03-27_1855.jpg/320px-Copsychus_saularis_male_-_Kolkata_2011-03-27_1855.jpg' },
  { file: 'bark_mantis.jpg',           url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Bark_mantis_Liturgusa_sp.jpg/320px-Bark_mantis_Liturgusa_sp.jpg' },
  { file: 'tree_shrew.jpg',            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Tupaia_glis_-_Mus%C3%A9um_national_d%27Histoire_naturelle_-_26_Oct_2012.jpg/320px-Tupaia_glis_-_Mus%C3%A9um_national_d%27Histoire_naturelle_-_26_Oct_2012.jpg' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  ✔ Already exists: ${path.basename(dest)}`);
      resolve();
      return;
    }
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'VanJeevan-BiodiversityBot/1.0 (educational; contact: vanjeevan@kk-wagh.edu.in)',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(`\nDownloading ${IMAGES.length} biodiversity images to ${OUTPUT_DIR}\n`);
  let ok = 0, fail = 0;
  for (const img of IMAGES) {
    const dest = path.join(OUTPUT_DIR, img.file);
    try {
      await download(img.url, dest);
      console.log(`  ✔ ${img.file}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${img.file}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} downloaded, ${fail} failed.\n`);
}

main();
