const { getDb } = require('./database');

function initializeDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      job_title TEXT,
      resume_text TEXT,
      resume_filename TEXT,
      score INTEGER DEFAULT 0,
      stage TEXT DEFAULT 'applied',
      strengths TEXT,
      gaps TEXT,
      ai_recommendation TEXT,
      kestra_execution_id TEXT,
      notes TEXT,
      last_updated TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flow_id TEXT,
      execution_id TEXT,
      candidate_email TEXT,
      status TEXT,
      started_at TEXT,
      finished_at TEXT,
      trigger_reason TEXT
    )
  `);

  console.log('✅ Database tables initialized');
}

module.exports = { initializeDatabase };
