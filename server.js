const express = require('express');
const cors = require('cors');
const AdvancedSearchEngine = require('./algorithm/tfidf');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Search Engine with corpus from SQLite
let searchEngine;
const loadCorpus = () => {
  const corpus = db.prepare('SELECT * FROM documents').all();
  searchEngine = new AdvancedSearchEngine(corpus);
};

// Initial load
loadCorpus();

// Log failed search
const logFailedSearch = (query) => {
  const stmt = db.prepare('SELECT id, count FROM failed_searches WHERE query = ?');
  const existing = stmt.get(query);
  
  if (existing) {
    db.prepare('UPDATE failed_searches SET count = count + 1, last_searched = CURRENT_TIMESTAMP WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO failed_searches (query) VALUES (?)').run(query);
  }
};

// API: Search Endpoint (with pagination and sorting)
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  const category = req.query.category || null;
  const sort = req.query.sort || 'relevance'; // 'relevance', 'newest', 'popular'
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const { results, suggestion } = searchEngine.search(query, category);

    // If no results, log the missing search
    if (results.length === 0) {
      logFailedSearch(query);
    }

    // Apply Sorting
    if (sort === 'newest') {
      results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else if (sort === 'popular') {
      results.sort((a, b) => b.popularity_score - a.popularity_score);
    } // default is relevance (finalScore) which is already sorted in searchEngine

    // Pagination
    const totalResults = results.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    res.json({
      query,
      totalResults,
      totalPages,
      currentPage: page,
      suggestion,
      results: paginatedResults
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error during search.' });
  }
});

// API: Get Stats
app.get('/api/stats', (req, res) => {
  const totalDocs = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  const categories = db.prepare('SELECT category, COUNT(*) as count FROM documents GROUP BY category ORDER BY count DESC').all();
  const trendingMissing = db.prepare('SELECT query, count FROM failed_searches ORDER BY count DESC LIMIT 5').all();
  
  res.json({
    totalIndexed: totalDocs,
    categories,
    trendingMissing
  });
});

// --- ADMIN ENDPOINTS (CRUD) ---

// Add a new document
app.post('/api/documents', (req, res) => {
  const { title, description, tags, category, popularity_score } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stmt = db.prepare(`
    INSERT INTO documents (title, description, tags, category, popularity_score)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const info = stmt.run(title, description, JSON.stringify(tags || []), category, popularity_score || 0);
  loadCorpus(); // Reload search engine
  res.status(201).json({ id: info.lastInsertRowid, message: 'Document added' });
});

// Update a document
app.put('/api/documents/:id', (req, res) => {
  const { title, description, tags, category, popularity_score } = req.body;
  const { id } = req.params;

  const stmt = db.prepare(`
    UPDATE documents 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        tags = COALESCE(?, tags),
        category = COALESCE(?, category),
        popularity_score = COALESCE(?, popularity_score),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(title, description, tags ? JSON.stringify(tags) : null, category, popularity_score, id);
  loadCorpus(); // Reload search engine
  res.json({ message: 'Document updated' });
});

// Delete a document
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  loadCorpus(); // Reload search engine
  res.json({ message: 'Document deleted' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Production-Grade Server is running on port ${PORT}`);
  });
}

module.exports = app;
