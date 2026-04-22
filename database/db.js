const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath = path.resolve(__dirname, 'search_engine.db');

// Vercel Serverless Functions have a read-only filesystem except for /tmp
if (process.env.VERCEL === '1') {
  const tmpPath = '/tmp/search_engine.db';
  if (!fs.existsSync(tmpPath)) {
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, tmpPath);
    }
  }
  dbPath = tmpPath;
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT NOT NULL, -- Stored as JSON array string
    category TEXT NOT NULL,
    popularity_score REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS failed_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    last_searched DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
