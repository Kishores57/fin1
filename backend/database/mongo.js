import dns from 'dns';
import mongoose from 'mongoose';
import { settings } from '../config.js';

let connected = false;
let connecting = null;

export function isMongoReady() {
  return connected && mongoose.connection.readyState === 1;
}

/**
 * Connect (or reconnect) to Atlas using Mongoose.
 * Database name comes from MONGODB_URI path → tree_analysis
 * Collection is set on RegisteredTree model → tree
 */
export async function connectMongo() {
  const uri = settings.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set — registered-tree endpoints will return 503.');
    return false;
  }

  if (isMongoReady()) return true;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      // Some ISPs block MongoDB SRV lookups — use public DNS for mongodb+srv
      if (uri.startsWith('mongodb+srv://')) {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      }
      mongoose.set('strictQuery', true);

      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 15000,
          dbName: 'tree_analysis',
        });
      }

      connected = mongoose.connection.readyState === 1;
      if (connected) {
        console.log(
          `MongoDB connected → database "${mongoose.connection.name}" (collection: tree)`
        );
      }
      return connected;
    } catch (err) {
      connected = false;
      console.error('MongoDB connection failed (SQLite calculator still works):', err.message);
      return false;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

/** Ensure Mongo is up before create/list/delete — retries connect if needed. */
export async function ensureMongo() {
  if (isMongoReady()) return true;
  return connectMongo();
}

mongoose.connection.on('disconnected', () => {
  connected = false;
  console.warn('MongoDB disconnected');
});
mongoose.connection.on('connected', () => {
  connected = true;
});

export default { connectMongo, ensureMongo, isMongoReady };
