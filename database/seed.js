const db = require('./db');

const categories = ['Frontend', 'Backend', 'DevOps', 'Data Science', 'Security', 'Cloud', 'Mobile', 'AI/ML'];
const subjects = [
  'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'Go', 
  'Rust', 'C++', 'C#', '.NET', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux', 
  'Bash', 'Terraform', 'Ansible', 'Jenkins', 'Git', 'GitHub Actions', 'MongoDB', 'PostgreSQL', 
  'MySQL', 'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'GraphQL', 'REST API', 'WebSockets',
  'Machine Learning', 'Deep Learning', 'Neural Networks', 'NLP', 'Computer Vision', 'TensorFlow',
  'PyTorch', 'Data Analysis', 'Pandas', 'NumPy', 'Cybersecurity', 'Penetration Testing', 'Cryptography',
  'OAuth', 'JWT', 'Microservices', 'Serverless', 'Agile', 'Scrum', 'System Design'
];
const prefixes = ['Introduction to', 'Advanced', 'Mastering', 'Getting Started with', 'Understanding', 'The Complete Guide to', 'Best Practices for', 'Scaling', 'Securing', 'Building Apps with'];

const generateRecords = (count) => {
  const records = [];
  
  for (let i = 0; i < count; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const title = `${prefix} ${subject}`;
    const description = `This comprehensive guide covers everything you need to know about ${subject} in the context of ${category}. Learn the fundamental concepts, advanced techniques, and industry best practices. Perfect for developers looking to enhance their skills.`;
    
    // Pick 3-5 random tags
    const numTags = Math.floor(Math.random() * 3) + 3;
    const tags = new Set([subject.toLowerCase()]);
    while (tags.size < numTags) {
      tags.add(subjects[Math.floor(Math.random() * subjects.length)].toLowerCase());
    }
    
    // Popularity between 0.0 and 100.0
    const popularity = (Math.random() * 100).toFixed(2);
    
    // Random date within the last 2 years
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 730));
    const updated_at = pastDate.toISOString();

    records.push({
      title,
      description,
      tags: JSON.stringify(Array.from(tags)),
      category,
      popularity_score: popularity,
      updated_at
    });
  }
  
  return records;
};

const seedDatabase = () => {
  console.log('Clearing existing documents...');
  db.exec('DELETE FROM documents');
  db.exec('DELETE FROM failed_searches');
  
  console.log('Generating 600 records...');
  const records = generateRecords(600);
  
  const insertStmt = db.prepare(`
    INSERT INTO documents (title, description, tags, category, popularity_score, updated_at)
    VALUES (@title, @description, @tags, @category, @popularity_score, @updated_at)
  `);
  
  const insertMany = db.transaction((docs) => {
    for (const doc of docs) insertStmt.run(doc);
  });
  
  insertMany(records);
  console.log('Database seeded successfully with 600 IT/Tech records!');
};

seedDatabase();
