import db from './connection.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Species shown in the calculator dropdown (MAI cm/yr, wood density g/cm³). */
const CALCULATOR_SPECIES = [
  { name: 'Bamboo', mai: 2.50, wood_density: 0.40 },
  { name: 'Christmas', mai: 1.00, wood_density: 0.45 },
  { name: 'Palm (Bottle Palm)', mai: 1.00, wood_density: 0.40 },
  { name: 'Coconut', mai: 1.10, wood_density: 0.50 },
  { name: 'Ashoka', mai: 1.20, wood_density: 0.67 },
  { name: 'Tej Patta', mai: 0.80, wood_density: 0.60 },
  { name: 'Badam', mai: 1.10, wood_density: 0.55 },
  { name: 'Rain Tree', mai: 1.50, wood_density: 0.50 },
  { name: 'Silver Oak', mai: 1.40, wood_density: 0.55 },
  { name: 'Mango', mai: 1.10, wood_density: 0.65 },
  { name: 'Supari', mai: 1.00, wood_density: 0.45 },
  { name: 'Ad', mai: 1.00, wood_density: 0.55 },
  { name: 'Bel', mai: 0.90, wood_density: 0.70 },
  { name: 'Banyan', mai: 1.30, wood_density: 0.58 },
  { name: 'Neem', mai: 1.15, wood_density: 0.72 },
  { name: 'Peepal', mai: 1.40, wood_density: 0.52 },
  { name: 'Rubber', mai: 1.35, wood_density: 0.60 },
];


export async function initDb() {
  console.log('Initializing database schema...');
  try {
    // Create species table
    await db.run(`
      CREATE TABLE IF NOT EXISTS species (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        mai REAL NOT NULL,
        wood_density REAL NOT NULL
      )
    `);

    // Create trees table
    await db.run(`
      CREATE TABLE IF NOT EXISTS trees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        species_id INTEGER NOT NULL,
        gbh REAL NOT NULL,
        height REAL NOT NULL,
        dbh REAL NOT NULL,
        age REAL NOT NULL,
        biomass REAL NOT NULL,
        carbon REAL NOT NULL,
        co2 REAL NOT NULL,
        oxygen REAL NOT NULL,
        summary TEXT,
        medicinal_impact TEXT,
        habitat_support TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(species_id) REFERENCES species(id) ON DELETE RESTRICT
      )
    `);

    // Create users table for role-based authentication
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        organization TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Create projects table for multi-organization community inventories
    await db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        organization TEXT NOT NULL,
        description TEXT,
        country TEXT NOT NULL DEFAULT 'India',
        state TEXT NOT NULL DEFAULT 'Maharashtra',
        city TEXT NOT NULL DEFAULT 'Nashik',
        study_area TEXT,
        center_lat REAL DEFAULT 20.0145,
        center_lng REAL DEFAULT 73.8225,
        zoom_level INTEGER DEFAULT 16,
        boundary_geojson TEXT,
        coordinator TEXT,
        contact_email TEXT,
        data_source TEXT DEFAULT 'epicollect',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create project_trees table for isolated multi-project tree records
    await db.run(`
      CREATE TABLE IF NOT EXISTS project_trees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        tree_id TEXT,
        species TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        height REAL,
        gbh REAL,
        dbh REAL,
        age REAL,
        biomass REAL,
        carbon_storage REAL,
        co2_estimate REAL,
        oxygen_production REAL,
        condition TEXT DEFAULT 'Healthy',
        additional_attributes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    await db.run(`CREATE INDEX IF NOT EXISTS idx_project_trees_project_id ON project_trees(project_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_project_trees_species ON project_trees(species)`);

    console.log('Database tables verified/created successfully.');

    // Seed default admin and researcher accounts if they do not exist
    const defaultAccounts = [
      {
        name: 'Dr. Ramesh Kulkarni (Administrator)',
        email: 'admin@vanjeevan.org',
        password: 'admin123',
        role: 'admin',
        organization: 'VanJeevan Forestry Board & Tree Authority',
      },
      {
        name: 'Pooja Sharma (Field Researcher)',
        email: 'user@vanjeevan.org',
        password: 'user123',
        role: 'user',
        organization: 'KKWIEER Campus Ecological Survey',
      },
    ];

    for (const acc of defaultAccounts) {
      const existing = await db.get('SELECT id FROM users WHERE email = ? COLLATE NOCASE', [acc.email]);
      if (!existing) {
        const hashedPassword = await bcrypt.hash(acc.password, 10);
        await db.run(
          'INSERT INTO users (name, email, password, role, organization) VALUES (?, ?, ?, ?, ?)',
          [acc.name, acc.email, hashedPassword, acc.role, acc.organization]
        );
        console.log(`Seeded default ${acc.role} account: ${acc.email}`);
      }
    }

    // Upsert calculator species so the dropdown always has the full list
    let inserted = 0;
    let updated = 0;
    for (const sp of CALCULATOR_SPECIES) {
      const existing = await db.get(
        'SELECT id FROM species WHERE name = ? COLLATE NOCASE',
        [sp.name]
      );
      if (existing) {
        await db.run(
          'UPDATE species SET name = ?, mai = ?, wood_density = ? WHERE id = ?',
          [sp.name, sp.mai, sp.wood_density, existing.id]
        );
        updated += 1;
      } else {
        await db.run(
          'INSERT INTO species (name, mai, wood_density) VALUES (?, ?, ?)',
          [sp.name, sp.mai, sp.wood_density]
        );
        inserted += 1;
      }
    }
    // Seed default baseline project: K. K. Wagh College Campus Tree Inventory
    const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', ['kkwagh-campus']);
    const campusBoundary = {
      type: 'Polygon',
      coordinates: [
        [
          [73.8198, 20.0123],
          [73.8228, 20.0123],
          [73.8228, 20.0147],
          [73.8198, 20.0147],
          [73.8198, 20.0123],
        ],
      ],
    };

    if (!existingProject) {
      await db.run(
        `INSERT INTO projects (
          id, name, organization, description, country, state, city, study_area,
          center_lat, center_lng, zoom_level, boundary_geojson, coordinator, contact_email, data_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'kkwagh-campus',
          'K. K. Wagh College Campus Tree Inventory',
          'K. K. Wagh Institute of Engineering Education & Research',
          'Comprehensive campus forest inventory encompassing academic avenues, central gardens, and hostels under statutory Tree Authority monitoring.',
          'India',
          'Maharashtra',
          'Nashik',
          'College campus boundary (Saraswati Nagar, Panchavati)',
          20.0135,
          73.8213,
          17,
          JSON.stringify(campusBoundary),
          'Dr. Ramesh Kulkarni',
          'admin@vanjeevan.org',
          'epicollect',
        ]
      );
      console.log('Seeded default project: K. K. Wagh College Campus Tree Inventory');
    }

    // Seed trees for kkwagh-campus if empty
    const treeRow = await db.get('SELECT COUNT(*) as count FROM project_trees WHERE project_id = ?', ['kkwagh-campus']);
    if (treeRow && treeRow.count === 0) {
      const parsedPath = path.resolve(__dirname, '../data/parsed_trees.json');
      if (fs.existsSync(parsedPath)) {
        try {
          const parsedTrees = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));
          for (const t of parsedTrees) {
            const gbh = parseFloat(t.circumference) || 80;
            const dbh = parseFloat((gbh / Math.PI).toFixed(2));
            const height = Math.round(Math.max(4, Math.min(22, 1.2 * Math.pow(dbh, 0.65))) * 10) / 10;
            const age = t.age || 20;
            const woodDensity = 0.55;
            const val = woodDensity * Math.pow(dbh, 2) * height;
            const biomass = parseFloat((0.0673 * Math.pow(val, 0.976)).toFixed(2));
            const carbon = parseFloat((biomass * 0.47).toFixed(2));
            const co2 = parseFloat((carbon * 3.67).toFixed(2));
            const oxygen = parseFloat((carbon * 2.67).toFixed(2));

            await db.run(
              `INSERT INTO project_trees (
                project_id, tree_id, species, latitude, longitude, height, gbh, dbh, age,
                biomass, carbon_storage, co2_estimate, oxygen_production, condition, additional_attributes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                'kkwagh-campus',
                `KKW-${t.id || 1}`,
                t.species || 'Ashok Tree',
                t.lat,
                t.lng,
                height,
                gbh,
                dbh,
                age,
                biomass,
                carbon,
                co2,
                oxygen,
                t.impact === 'Critical' ? 'Attention Needed' : 'Healthy',
                JSON.stringify({ habitat: t.habitat || 'Campus flora', date: t.date || '2024-02-11' }),
              ]
            );
          }
          console.log(`Seeded ${parsedTrees.length} tree records for kkwagh-campus project.`);
        } catch (seedErr) {
          console.warn('Failed to seed default trees:', seedErr.message);
        }
      }
    }

    console.log(
      `Species sync complete: ${inserted} added, ${updated} updated (${CALCULATOR_SPECIES.length} calculator species).`
    );
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}
export default initDb;
