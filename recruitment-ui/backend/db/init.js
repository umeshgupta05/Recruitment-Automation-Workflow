const { getDb } = require("./database");

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

  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      recruiter_email TEXT NOT NULL,
      recruiter_name TEXT,
      requirements TEXT,
      score_threshold INTEGER DEFAULT 70,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'recruiter',
      company TEXT,
      phone TEXT,
      profile_photo TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Add job_id column to candidates if it doesn't exist
  const checkColumn = db.prepare("PRAGMA table_info(candidates)").all();
  if (!checkColumn.some((col) => col.name === "job_id")) {
    db.exec(`ALTER TABLE candidates ADD COLUMN job_id INTEGER`);
  }

  const jobColumns = db.prepare("PRAGMA table_info(jobs)").all();
  if (!jobColumns.some((col) => col.name === "score_threshold")) {
    db.exec(`ALTER TABLE jobs ADD COLUMN score_threshold INTEGER DEFAULT 70`);
  }

  console.log("✅ Database tables initialized");
}

module.exports = { initializeDatabase };
