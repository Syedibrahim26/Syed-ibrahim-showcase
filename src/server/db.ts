import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = path.resolve(process.cwd(), 'portfolio.sqlite');
const DEFAULT_EDUCATION = [{
  degree: 'B.S. in Computer Science',
  institution: 'Faculty of Engineering & Computer Science',
  period: 'Expected Graduation: 2026',
  details: "Dean's Honor List"
}];
const DEFAULT_CERTIFICATES = [
  { title: 'Full Stack Development', issuer: '', year: '', description: '', credential_url: '' },
  { title: 'Web Development', issuer: '', year: '', description: '', credential_url: '' },
  { title: 'Naan Mudhalvan skill Development', issuer: '', year: '', description: '', credential_url: '' }
];

let dbInstance: SqlJsDatabase | null = null;

// Helper to persist database buffer to disk
function persistToDisk() {
  if (dbInstance) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Get or initialize DB instance
async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to load existing SQLite file, creating fresh database:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  return dbInstance;
}

// Helper promisified DB methods
export async function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  const db = await getDb();
  
  if (params && params.length > 0) {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
  } else {
    db.run(sql);
  }

  // Retrieve last insert ID and changes
  let lastID = 0;
  let changes = 0;
  try {
    const res = db.exec('SELECT last_insert_rowid() AS lastID, changes() AS changes');
    if (res.length > 0 && res[0].values.length > 0) {
      lastID = Number(res[0].values[0][0]) || 0;
      changes = Number(res[0].values[0][1]) || 0;
    }
  } catch (err) {
    // Ignore if not applicable
  }

  persistToDisk();
  return { lastID, changes };
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  
  let row: T | undefined = undefined;
  if (stmt.step()) {
    row = stmt.getAsObject() as unknown as T;
  }
  stmt.free();
  return row;
}

export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }

  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

/**
 * Initialize tables & seed default data
 */
export async function initDatabase(): Promise<void> {
  // Ensure DB instance is active
  await getDb();

  // 1. Users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Profile table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      bio TEXT NOT NULL,
      avatar_url TEXT,
      email TEXT,
      github_url TEXT,
      linkedin_url TEXT,
      twitter_url TEXT,
      website_url TEXT,
      resume_url TEXT,
      skills TEXT,
      education TEXT NOT NULL DEFAULT '[]',
      certificates TEXT NOT NULL DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Projects table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      short_description TEXT NOT NULL,
      detailed_description TEXT,
      tech_stack TEXT NOT NULL,
      image_url TEXT,
      live_demo_url TEXT,
      github_url TEXT,
      is_published INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Messages table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      sender_phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0
    )
  `);

  const profileColumns = await dbAll<{ name: string }>('PRAGMA table_info(profile)');
  const needsEducationMigration = !profileColumns.some((column) => column.name === 'education');
  const needsCertificateMigration = !profileColumns.some((column) => column.name === 'certificates');
  if (needsEducationMigration) {
    await dbRun("ALTER TABLE profile ADD COLUMN education TEXT NOT NULL DEFAULT '[]'");
  }
  if (needsCertificateMigration) {
    await dbRun("ALTER TABLE profile ADD COLUMN certificates TEXT NOT NULL DEFAULT '[]'");
  }

  const messageColumns = await dbAll<{ name: string }>('PRAGMA table_info(messages)');
  if (!messageColumns.some((column) => column.name === 'sender_phone')) {
    await dbRun('ALTER TABLE messages ADD COLUMN sender_phone TEXT');
  }

  await dbRun(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const portfolioContentMigration = await dbGet<{ migration: string }>(
    'SELECT migration FROM schema_migrations WHERE migration = ?',
    ['portfolio_content_defaults_v1']
  );
  if (!portfolioContentMigration) {
    await dbRun('UPDATE profile SET education = ? WHERE education IS NULL OR education = ?', [
      JSON.stringify(DEFAULT_EDUCATION),
      '[]'
    ]);
    await dbRun('UPDATE profile SET certificates = ? WHERE certificates IS NULL OR certificates = ?', [
      JSON.stringify(DEFAULT_CERTIFICATES),
      '[]'
    ]);
    await dbRun('INSERT INTO schema_migrations (migration) VALUES (?)', ['portfolio_content_defaults_v1']);
  }

  // 5. Automated Seeding
  await seedInitialData();
}

async function seedInitialData() {
  // Check if admin user exists
  const existingAdmin = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@admin.com']);
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await dbRun(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin@admin.com', hashedPassword, 'Portfolio Admin', 'admin']
    );
    console.log('✅ [DB Seed] Default admin seeded: admin@admin.com / password123');
  }

  // Check if student profile exists
  const existingProfile = await dbGet('SELECT * FROM profile LIMIT 1');
  if (!existingProfile) {
    const defaultSkills = JSON.stringify([
      'TypeScript',
      'React',
      'Node.js',
      'Express',
      'Tailwind CSS',
      'PostgreSQL',
      'SQLite',
      'Python',
      'Git',
      'REST APIs'
    ]);

    await dbRun(
      `INSERT INTO profile (name, title, bio, avatar_url, email, github_url, linkedin_url, twitter_url, website_url, resume_url, skills, education, certificates)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Alex Rivera',
        'Senior CS Student & Full-Stack Engineer',
        'Computer Science undergraduate passionate about building high-performance web systems, distributed architectures, and intuitive developer tools. Experienced in modern JavaScript/TypeScript, cloud-native deployments, and database optimization.',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        'alex.rivera@university.edu',
        'https://github.com/alexrivera-dev',
        'https://linkedin.com/in/alexrivera-student',
        'https://twitter.com/alexrivera_dev',
        'https://alexrivera.dev',
        '#',
        defaultSkills,
        JSON.stringify(DEFAULT_EDUCATION),
        JSON.stringify(DEFAULT_CERTIFICATES)
      ]
    );
    console.log('✅ [DB Seed] Default student profile seeded');
  }

  // Check if projects exist
  const existingProjects = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM projects');
  if (!existingProjects || existingProjects.count === 0) {
    const sampleProjects = [
      {
        title: 'AlgoCraft - Interactive Algorithm Visualizer',
        short_description: 'Interactive web platform visualizing graph traversal, dynamic programming, and sorting algorithms in real-time.',
        detailed_description: `## Overview\nAlgoCraft is an educational web application developed to help computer science students comprehend complex algorithms through dynamic, step-by-step visual transitions.\n\n### Key Features\n- **Graph Algorithms**: BFS, DFS, Dijkstra's shortest path, and A* pathfinding on custom grids.\n- **Sorting Visualizer**: QuickSort, MergeSort, HeapSort with adjustable playback speeds.\n- **Execution Timeline**: Pause, rewind, and step forwards through algorithmic states.\n- **Custom Input Support**: Create custom weighted graphs and weighted matrices.\n\n### Architectural Highlights\nBuilt with React, WebGL rendering canvas, and custom state machines to maintain zero-lag 60fps animations during heavy computation.`,
        tech_stack: JSON.stringify(['React', 'TypeScript', 'Canvas API', 'Tailwind CSS', 'Vite']),
        image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        live_demo_url: 'https://algocraft-demo.example.com',
        github_url: 'https://github.com/alexrivera-dev/algocraft-visualizer',
        is_published: 1,
        is_featured: 1,
        display_order: 1
      },
      {
        title: 'CampusPulse - Student Collaboration Hub',
        short_description: 'Full-stack peer-to-peer study group coordinator, assignment deadline tracker, and campus resource finder.',
        detailed_description: `## Overview\nCampusPulse connects over 1,500 students across 6 departments to find study partners, share course materials, and synchronize group schedules.\n\n### Highlights\n- **Real-Time Study Rooms**: WebSocket-powered chat and collaborative markdown scratchpads.\n- **Automated Reminders**: Push alerts for upcoming assignment milestones.\n- **Course Review Aggregator**: Student-vetted reviews of electives and professors.\n\n### Tech Stack & Performance\n- Backend implemented with Express.js, SQLite / PostgreSQL data caching.\n- JWT authentication with role-based permissions (Student, TA, Moderator).`,
        tech_stack: JSON.stringify(['Node.js', 'Express', 'SQLite', 'React', 'Tailwind CSS', 'JWT']),
        image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
        live_demo_url: 'https://campuspulse.example.com',
        github_url: 'https://github.com/alexrivera-dev/campuspulse-hub',
        is_published: 1,
        is_featured: 1,
        display_order: 2
      },
      {
        title: 'NeuralSketch - Edge AI Doodle Classifier',
        short_description: 'Client-side deep learning web app that recognizes hand-drawn sketches with 94% accuracy in real-time.',
        detailed_description: `## Overview\nNeuralSketch allows users to draw sketches on a digital canvas and predicts what is being drawn using a custom lightweight Convolutional Neural Network (CNN) trained on the QuickDraw dataset.\n\n### Technical Details\n- **Model**: Custom quantized MobileNet trained using PyTorch, converted for in-browser inference.\n- **Performance**: Zero server round-trips; inferences execute in < 18ms on low-power mobile devices.\n- **Game Mode**: Competitive quick-draw challenge with leaderboards.`,
        tech_stack: JSON.stringify(['Python', 'PyTorch', 'TypeScript', 'Web Workers', 'Tailwind CSS']),
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        live_demo_url: 'https://neuralsketch.example.com',
        github_url: 'https://github.com/alexrivera-dev/neural-sketch-app',
        is_published: 1,
        is_featured: 0,
        display_order: 3
      },
      {
        title: 'DevMetrics - GitHub Activity Analytics Dashboard',
        short_description: 'Developer productivity tool analyzing Git commit rhythms, code reviews, and repo velocity with rich visualizations.',
        detailed_description: `## Overview\nDevMetrics ingests GitHub API webhooks and provides engineering students with insights into their coding consistency, language breakdown, and collaborative habits.\n\n### Features\n- Heatmaps of commit frequency and peak productivity hours.\n- Language distribution radar charts.\n- Pull request lifecycle analytics.`,
        tech_stack: JSON.stringify(['React', 'Recharts', 'Express', 'REST API', 'Tailwind CSS']),
        image_url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80',
        live_demo_url: 'https://devmetrics.example.com',
        github_url: 'https://github.com/alexrivera-dev/devmetrics-dashboard',
        is_published: 0, // Draft project to demonstrate draft/published feature!
        is_featured: 0,
        display_order: 4
      }
    ];

    for (const p of sampleProjects) {
      await dbRun(
        `INSERT INTO projects (title, short_description, detailed_description, tech_stack, image_url, live_demo_url, github_url, is_published, is_featured, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.title,
          p.short_description,
          p.detailed_description,
          p.tech_stack,
          p.image_url,
          p.live_demo_url,
          p.github_url,
          p.is_published,
          p.is_featured,
          p.display_order
        ]
      );
    }
    console.log('✅ [DB Seed] Default projects seeded (including published and draft)');
  }
}
