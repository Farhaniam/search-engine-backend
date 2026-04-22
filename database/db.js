const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'search_engine.db');
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
