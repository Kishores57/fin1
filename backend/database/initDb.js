import db from './connection.js';
import bcrypt from 'bcryptjs';

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
    console.log(
      `Species sync complete: ${inserted} added, ${updated} updated (${CALCULATOR_SPECIES.length} calculator species).`
    );
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}
export default initDb;
