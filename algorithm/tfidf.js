const levenshtein = require('fast-levenshtein');

// Tokenize and lowercase text
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0);
};

// Calculate Term Frequency (TF)
const calculateTF = (tokens) => {
  const tf = {};
  const totalTerms = tokens.length;

  tokens.forEach((token) => {
    tf[token] = (tf[token] || 0) + 1;
  });

  for (const term in tf) {
    tf[term] = tf[term] / totalTerms;
  }

  return tf;
};

// Calculate Inverse Document Frequency (IDF)
const calculateIDF = (documentsTokens) => {
  const idf = {};
  const totalDocuments = documentsTokens.length;

  documentsTokens.forEach((tokens) => {
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach((token) => {
      idf[token] = (idf[token] || 0) + 1;
    });
  });

  for (const term in idf) {
    idf[term] = Math.log(totalDocuments / (idf[term] || 1)) + 1;
  }

  return idf;
};

// Calculate TF-IDF
const calculateTFIDF = (tf, idf) => {
  const tfidf = {};
  for (const term in tf) {
    tfidf[term] = tf[term] * (idf[term] || 0);
  }
  return tfidf;
};

// Calculate Cosine Similarity
const cosineSimilarity = (vec1, vec2) => {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

  allTerms.forEach((term) => {
    const val1 = vec1[term] || 0;
    const val2 = vec2[term] || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
};

class AdvancedSearchEngine {
  constructor(corpus) {
    this.corpus = corpus;
    this.documentsTokens = [];
    this.idf = {};
    this.documentsTFIDF = [];
    this.vocabulary = new Set();
    
    // Weights for the ranking formula
    this.weights = {
      relevance: 0.5,
      popularity: 0.2,
      recency: 0.2,
      tagMatch: 0.1
    };

    this._initialize();
  }

  _initialize() {
    this.documentsTokens = this.corpus.map((doc) => {
      const tokens = tokenize(doc.title + ' ' + doc.description);
      tokens.forEach(t => this.vocabulary.add(t));
      return tokens;
    });

    this.idf = calculateIDF(this.documentsTokens);

    this.documentsTFIDF = this.documentsTokens.map((tokens) => {
      const tf = calculateTF(tokens);
      return calculateTFIDF(tf, this.idf);
    });
  }

  _calculateRecencyScore(updatedAt) {
    const now = new Date();
    const docDate = new Date(updatedAt);
    const ageInDays = (now - docDate) / (1000 * 60 * 60 * 24);
    
    // Normalize: 0 days old = 1.0, 730 days old = 0.0
    const maxDays = 730; 
    let score = 1 - (ageInDays / maxDays);
    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
  }

  _calculateTagMatch(queryTokens, docTags) {
    if (!docTags || docTags.length === 0) return 0;
    let matches = 0;
    queryTokens.forEach(token => {
      if (docTags.includes(token)) matches++;
    });
    return Math.min(1, matches / queryTokens.length);
  }

  getSuggestion(query) {
    const queryTokens = tokenize(query);
    const suggestions = [];

    queryTokens.forEach(token => {
      let bestMatch = token;
      let minDistance = Infinity;

      this.vocabulary.forEach(vocabWord => {
        const dist = levenshtein.get(token, vocabWord);
        if (dist < minDistance && dist <= 2) { // Max distance of 2 for typo correction
          minDistance = dist;
          bestMatch = vocabWord;
        }
      });
      suggestions.push(bestMatch);
    });

    const suggestedQuery = suggestions.join(' ');
    return suggestedQuery !== queryTokens.join(' ') ? suggestedQuery : null;
  }

  search(query, categoryFilter = null) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return { results: [], suggestion: null };

    const queryTF = calculateTF(queryTokens);
    const queryTFIDF = calculateTFIDF(queryTF, this.idf);

    let results = this.corpus.map((doc, index) => {
      // 1. TF-IDF Relevance (0 to 1)
      const docTFIDF = this.documentsTFIDF[index];
      const relevanceScore = cosineSimilarity(queryTFIDF, docTFIDF);
      
      // 2. Popularity (Normalize 0-100 to 0-1)
      const popScore = (doc.popularity_score || 0) / 100;

      // 3. Recency (0 to 1)
      const recencyScore = this._calculateRecencyScore(doc.updated_at);

      // 4. Tag Match (0 to 1)
      const docTags = JSON.parse(doc.tags || '[]');
      const tagScore = this._calculateTagMatch(queryTokens, docTags);

      // 5. Category Boost
      // If the query contains the category name, give a massive boost
      let categoryBoost = 0;
      if (doc.category) {
        const catTokens = tokenize(doc.category);
        const matchCount = catTokens.filter(t => queryTokens.includes(t)).length;
        if (matchCount > 0) {
          categoryBoost = (matchCount / catTokens.length) * 1.5; // Up to 1.5 extra points
        }
      }

      // Final Formula
      const finalScore = 
        (this.weights.relevance * relevanceScore) +
        (this.weights.popularity * popScore) +
        (this.weights.recency * recencyScore) +
        (this.weights.tagMatch * tagScore) +
        categoryBoost;
      
      return {
        ...doc,
        tags: docTags, // Parsed tags
        relevanceScore,
        categoryBoost,
        finalScore
      };
    });

    // Filter out items with 0 relevance score (must have at least some word match)
    results = results.filter((result) => result.relevanceScore > 0);

    // Apply category filter if provided
    if (categoryFilter) {
      results = results.filter(r => r.category === categoryFilter);
    }

    results.sort((a, b) => b.finalScore - a.finalScore);

    // If no results, get suggestions
    let suggestion = null;
    if (results.length === 0) {
      suggestion = this.getSuggestion(query);
    }

    return { results, suggestion };
  }
}

module.exports = AdvancedSearchEngine;
