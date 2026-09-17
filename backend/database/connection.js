import sqlite3 from 'sqlite3';
import { settings } from '../config.js';

let db;

if (settings.IS_SQLITE) {
  db = new sqlite3.Database(settings.SQLITE_PATH, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log('Connected to the SQLite database at:', settings.SQLITE_PATH);
    }
  });
} else {
  // Handle pg if needed, but sqlite is the default
  throw new Error('Only SQLite is supported currently in the Node.js backend. Please verify your DATABASE_URL starts with sqlite:///');
}

// Promise wrapper helper for SQLite operations
export const dbHelper = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  close() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};
export default dbHelper;
