-- SQL Schema for Tree Inventory and Climate Impact Analysis System

-- Create species lookup table
CREATE TABLE IF NOT EXISTS species (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    mai DOUBLE PRECISION NOT NULL,
    wood_density DOUBLE PRECISION NOT NULL
);

-- Seed initial species data if they do not exist
INSERT INTO species (name, mai, wood_density)
VALUES 
    ('Neem', 0.90, 0.82),
    ('Ashoka', 1.20, 0.67),
    ('Rubber', 2.00, 0.56)
ON CONFLICT (name) DO NOTHING;

-- Create trees inventory table
CREATE TABLE IF NOT EXISTS trees (
    id SERIAL PRIMARY KEY,
    species_id INTEGER REFERENCES species(id) ON DELETE RESTRICT,
    gbh DOUBLE PRECISION NOT NULL,
    height DOUBLE PRECISION NOT NULL,
    dbh DOUBLE PRECISION NOT NULL,
    age DOUBLE PRECISION NOT NULL,
    biomass DOUBLE PRECISION NOT NULL,
    carbon DOUBLE PRECISION NOT NULL,
    co2 DOUBLE PRECISION NOT NULL,
    oxygen DOUBLE PRECISION NOT NULL,
    summary TEXT,
    medicinal_impact TEXT,
    habitat_support TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
