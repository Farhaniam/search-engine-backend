const db = require('./db');

const domains = {
  "Data Structures & Algorithms": [
    { name: "Arrays", tags: ["array", "memory", "contiguous", "pointers"] },
    { name: "Linked List", tags: ["linked list", "nodes", "pointers", "singly", "doubly"] },
    { name: "Stack", tags: ["stack", "lifo", "push", "pop"] },
    { name: "Queue", tags: ["queue", "fifo", "enqueue", "dequeue"] },
    { name: "Heap", tags: ["heap", "priority queue", "min-heap", "max-heap", "tree"] },
    { name: "Trie", tags: ["trie", "prefix tree", "string matching", "search"] },
    { name: "Graph", tags: ["graph", "nodes", "edges", "bfs", "dfs", "dijkstra"] },
    { name: "Hash Table", tags: ["hash table", "hash map", "collisions", "O(1)"] },
    { name: "Searching & Sorting Algorithms", tags: ["binary search", "merge sort", "quick sort", "bubble sort"] },
    { name: "Dynamic Programming", tags: ["dynamic programming", "memoization", "tabulation", "optimization"] }
  ],
  "Cybersecurity": [
    { name: "Firewall", tags: ["firewall", "network security", "rules", "traffic"] },
    { name: "IDS/IPS", tags: ["ids", "ips", "intrusion detection", "prevention"] },
    { name: "VPN", tags: ["vpn", "tunneling", "encryption", "privacy"] },
    { name: "Encryption", tags: ["encryption", "aes", "rsa", "public key", "private key"] },
    { name: "SSL/TLS", tags: ["ssl", "tls", "https", "certificates", "handshake"] },
    { name: "Zero Trust", tags: ["zero trust", "security model", "verification", "access"] },
    { name: "SQL Injection", tags: ["sqli", "injection", "vulnerability", "database"] },
    { name: "XSS", tags: ["xss", "cross-site scripting", "vulnerability", "javascript"] },
    { name: "CSRF", tags: ["csrf", "forgery", "tokens", "vulnerability"] },
    { name: "Authentication vs Authorization", tags: ["authentication", "authorization", "iam", "access control"] }
  ],
  "Blockchain & Web3": [
    { name: "Smart Contracts", tags: ["smart contracts", "solidity", "ethereum", "dapps"] },
    { name: "Consensus Algorithms", tags: ["consensus", "pow", "pos", "mining", "validation"] },
    { name: "Ethereum", tags: ["ethereum", "evm", "gas", "smart contracts", "crypto"] },
    { name: "Bitcoin basics", tags: ["bitcoin", "nakamoto", "utxo", "digital gold"] },
    { name: "Hashing in blockchain", tags: ["hashing", "sha256", "cryptography", "immutability"] }
  ],
  "Computer Networks": [
    { name: "TCP/IP Model", tags: ["tcp/ip", "layers", "osi model", "protocols"] },
    { name: "DNS", tags: ["dns", "domain name system", "resolution", "udp"] },
    { name: "HTTP/HTTPS", tags: ["http", "https", "web", "methods", "status codes"] },
    { name: "Routing & Switching", tags: ["routing", "switching", "routers", "bgp", "ospf"] },
    { name: "Load Balancing", tags: ["load balancing", "nginx", "haproxy", "traffic distribution"] }
  ],
  "Cloud Computing": [
    { name: "AWS basics", tags: ["aws", "cloud", "iam", "vpc"] },
    { name: "EC2", tags: ["ec2", "compute", "instances", "virtual machines"] },
    { name: "S3", tags: ["s3", "storage", "buckets", "object storage"] },
    { name: "Serverless computing", tags: ["serverless", "lambda", "functions", "cold starts"] },
    { name: "Microservices", tags: ["microservices", "architecture", "decoupling", "apis"] }
  ],
  "Databases": [
    { name: "SQL vs NoSQL", tags: ["sql", "nosql", "relational", "document", "schema"] },
    { name: "Indexing", tags: ["indexing", "b-tree", "performance", "query optimization"] },
    { name: "Transactions (ACID)", tags: ["transactions", "acid", "atomicity", "consistency", "isolation"] }
  ],
  "System Design": [
    { name: "Scalability", tags: ["scalability", "horizontal", "vertical", "growth"] },
    { name: "Caching", tags: ["caching", "redis", "memcached", "latency", "eviction"] },
    { name: "Load balancing", tags: ["load balancing", "availability", "throughput", "round-robin"] },
    { name: "CAP theorem", tags: ["cap theorem", "consistency", "availability", "partition tolerance"] }
  ],
  "Operating Systems": [
    { name: "Processes and Threads", tags: ["process", "thread", "concurrency", "multithreading"] },
    { name: "Memory Management", tags: ["memory", "paging", "segmentation", "virtual memory"] },
    { name: "File Systems", tags: ["file system", "inodes", "fat32", "ntfs", "ext4"] }
  ],
  "Software Engineering": [
    { name: "Agile Methodologies", tags: ["agile", "scrum", "kanban", "sprints"] },
    { name: "CI/CD", tags: ["ci/cd", "continuous integration", "deployment", "pipelines"] },
    { name: "Design Patterns", tags: ["design patterns", "singleton", "factory", "observer", "solid"] }
  ],
  "Web Development": [
    { name: "React Internals", tags: ["react", "virtual dom", "reconciliation", "fiber"] },
    { name: "CSS Architecture", tags: ["css", "bem", "tailwind", "styling", "modules"] },
    { name: "Web Accessibility", tags: ["accessibility", "a11y", "aria", "wcag", "screen readers"] }
  ],
  "DevOps": [
    { name: "Containerization", tags: ["containers", "docker", "images", "namespaces", "cgroups"] },
    { name: "Infrastructure as Code", tags: ["iac", "terraform", "cloudformation", "automation"] },
    { name: "Monitoring and Observability", tags: ["monitoring", "prometheus", "grafana", "logs", "metrics"] }
  ],
  "Programming Languages": [
    { name: "JavaScript Event Loop", tags: ["javascript", "event loop", "asynchronous", "callbacks", "promises"] },
    { name: "Python GIL", tags: ["python", "gil", "threading", "cpython", "performance"] },
    { name: "Rust Ownership", tags: ["rust", "ownership", "borrowing", "lifetimes", "memory safety"] }
  ]
};

const prefixes = [
  { p: "Comprehensive Guide to", d: "A detailed exploration of the core concepts, mechanisms, and best practices surrounding" },
  { p: "Interview Prep:", d: "Essential questions, answers, and deep dives needed to master" },
  { p: "Understanding", d: "Break down the complexities and learn the fundamental principles behind" },
  { p: "Advanced Techniques in", d: "Take your skills to the next level by exploring advanced edge cases and architectures related to" },
  { p: "Getting Started with", d: "A beginner-friendly introduction covering the basics, setup, and core philosophy of" },
  { p: "Demystifying", d: "Clear up common misconceptions and gain a crystal-clear understanding of" },
  { p: "Best Practices for", d: "Industry-standard methodologies and architectural guidelines for implementing" },
  { p: "Deep Dive into", d: "An exhaustive technical breakdown of the internal workings and implementation details of" }
];

const generateRecords = () => {
  const records = [];
  
  for (const [category, topics] of Object.entries(domains)) {
    for (const topic of topics) {
      // Generate 8 variations for each topic
      for (const prefixObj of prefixes) {
        const title = `${prefixObj.p} ${topic.name}`;
        const description = `${prefixObj.d} ${topic.name.toLowerCase()} in modern software engineering. This guide is perfect for developers preparing for technical interviews or building robust systems.`;
        
        // Popularity between 40.0 and 100.0 (high quality topics)
        const popularity = (Math.random() * 60 + 40).toFixed(2);
        
        // Random date within the last 1 year
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 365));
        const updated_at = pastDate.toISOString();

        // Standardize category and tags
        const categoryStandardized = category;
        const tags = [category.toLowerCase().replace(/[^a-z0-9]/g, ''), ...topic.tags];

        records.push({
          title,
          description,
          tags: JSON.stringify(tags),
          category: categoryStandardized,
          popularity_score: popularity,
          updated_at
        });
      }
    }
  }
  
  return records;
};

const extendDatabase = () => {
  console.log('Generating structured records based on specific IT domains...');
  const records = generateRecords();
  console.log(`Generated ${records.length} new records.`);
  
  const insertStmt = db.prepare(`
    INSERT INTO documents (title, description, tags, category, popularity_score, updated_at)
    VALUES (@title, @description, @tags, @category, @popularity_score, @updated_at)
  `);
  
  const insertMany = db.transaction((docs) => {
    for (const doc of docs) insertStmt.run(doc);
  });
  
  insertMany(records);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  console.log(`Database successfully extended! Total records in DB: ${total}`);
};

extendDatabase();
