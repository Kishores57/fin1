import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Parse database URL to get absolute SQLite path or PostgreSQL connection
const rawDbUrl = process.env.DATABASE_URL || 'sqlite:///./tree_analysis.db';

let sqlitePath = null;
let isSqlite = true;

if (rawDbUrl.startsWith('sqlite:')) {
  // Extract SQLite path. e.g., sqlite:///./tree_analysis.db
  let cleanUrl = rawDbUrl.replace(/^sqlite:\/\/\/?/, '');
  if (cleanUrl.startsWith('./')) {
    cleanUrl = cleanUrl.slice(2);
  }
  sqlitePath = path.resolve(projectRoot, cleanUrl);
} else {
  isSqlite = false;
}

export const settings = {
  PORT: process.env.PORT || 8000,
  DATABASE_URL: rawDbUrl,
  IS_SQLITE: isSqlite,
  SQLITE_PATH: sqlitePath,
  MONGODB_URI:
    process.env.MONGODB_URI ||
    '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  RAG_DOCUMENT_DIR: path.resolve(projectRoot, process.env.RAG_DOCUMENT_DIR || 'backend/documents'),
  CHROMADB_DIR: path.resolve(projectRoot, process.env.CHROMADB_DIR || 'backend/chroma_db'),
  EPICOLLECT_CLIENT_ID: process.env.EPICOLLECT_CLIENT_ID || '',
  EPICOLLECT_CLIENT_SECRET: process.env.EPICOLLECT_CLIENT_SECRET || '',
  EPICOLLECT_PROJECT_SLUG: process.env.EPICOLLECT_PROJECT_SLUG || 'vanjeevan',
};
