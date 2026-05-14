const express = require("express");
const router = express.Router();
const { getDb } = require("../db/database");

// GET /api/jobs - List all active jobs
router.get("/", (req, res) => {
  try {
    const db = getDb();
    const jobs = db
      .prepare(
        "SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC",
      )
      .all();

    res.json(jobs);
  } catch (err) {
    console.error("GET /api/jobs error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs - Create new job (recruiter only)
router.post("/", (req, res) => {
  try {
    const {
      title,
      description,
      recruiter_email,
      recruiter_name,
      requirements,
      score_threshold,
    } = req.body;

    if (!title || !description || !recruiter_email) {
      return res.status(400).json({
        error: "Title, description, and recruiter_email are required",
      });
    }

    const parsedThreshold = Number.parseInt(score_threshold, 10);
    const finalThreshold = Number.isFinite(parsedThreshold)
      ? Math.min(100, Math.max(0, parsedThreshold))
      : 70;

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO jobs (title, description, recruiter_email, recruiter_name, requirements, score_threshold, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      )
      .run(
        title,
        description,
        recruiter_email,
        recruiter_name || null,
        requirements || null,
        finalThreshold,
      );

    const job = db
      .prepare("SELECT * FROM jobs WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(job);
  } catch (err) {
    console.error("POST /api/jobs error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id - Update job (recruiter only)
router.patch("/:id", (req, res) => {
  try {
    const { title, description, requirements, status, score_threshold } =
      req.body;
    const db = getDb();

    const job = db
      .prepare("SELECT * FROM jobs WHERE id = ?")
      .get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const updates = {
      title: title !== undefined ? title : job.title,
      description: description !== undefined ? description : job.description,
      requirements:
        requirements !== undefined ? requirements : job.requirements,
      score_threshold:
        score_threshold !== undefined
          ? Math.min(
              100,
              Math.max(0, Number.parseInt(score_threshold, 10) || 70),
            )
          : job.score_threshold || 70,
      status: status !== undefined ? status : job.status,
    };

    db.prepare(
      `UPDATE jobs SET title = ?, description = ?, requirements = ?, score_threshold = ?, status = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      updates.title,
      updates.description,
      updates.requirements,
      updates.score_threshold,
      updates.status,
      req.params.id,
    );

    const updatedJob = db
      .prepare("SELECT * FROM jobs WHERE id = ?")
      .get(req.params.id);
    res.json(updatedJob);
  } catch (err) {
    console.error("PATCH /api/jobs/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/recruiter/:email - Get all jobs posted by recruiter
router.get("/recruiter/:email", (req, res) => {
  try {
    const db = getDb();
    const jobs = db
      .prepare(
        "SELECT * FROM jobs WHERE recruiter_email = ? ORDER BY created_at DESC",
      )
      .all(req.params.email);

    res.json(jobs);
  } catch (err) {
    console.error("GET /api/jobs/recruiter/:email error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id - Get single job
router.get("/:id", (req, res) => {
  try {
    const db = getDb();
    const job = db
      .prepare("SELECT * FROM jobs WHERE id = ?")
      .get(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    console.error("GET /api/jobs/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id - Delete job (recruiter only)
router.delete("/:id", (req, res) => {
  try {
    const db = getDb();
    const job = db
      .prepare("SELECT * FROM jobs WHERE id = ?")
      .get(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    db.prepare(
      "UPDATE jobs SET status = 'deleted', updated_at = datetime('now') WHERE id = ?",
    ).run(req.params.id);

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/jobs/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
