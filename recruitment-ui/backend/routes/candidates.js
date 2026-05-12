const express = require("express");
const router = express.Router();
const { getDb } = require("../db/database");
const kestra = require("../services/kestra");

// GET /api/candidates — paginated list with filters
router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { stage, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = "WHERE deleted_at IS NULL";
    const params = [];

    if (stage && stage !== "all") {
      where += " AND stage = ?";
      params.push(stage);
    }

    if (search) {
      where += " AND (name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM candidates ${where}`)
      .get(...params);
    const total = countRow.total;

    const candidates = db
      .prepare(
        `SELECT * FROM candidates ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, parseInt(limit), offset);

    res.json({
      candidates,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("GET /candidates error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates/:id — full candidate record
router.get("/:id", (req, res) => {
  try {
    const db = getDb();
    const candidate = db
      .prepare("SELECT * FROM candidates WHERE id = ? AND deleted_at IS NULL")
      .get(req.params.id);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });
    res.json(candidate);
  } catch (err) {
    console.error("GET /candidates/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/candidates/:id/stage — update stage
router.patch("/:id/stage", async (req, res) => {
  try {
    const db = getDb();
    const { new_stage, notes } = req.body;

    if (!new_stage)
      return res.status(400).json({ error: "new_stage is required" });

    const candidate = db
      .prepare("SELECT * FROM candidates WHERE id = ? AND deleted_at IS NULL")
      .get(req.params.id);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });

    db.prepare(
      `UPDATE candidates SET stage = ?, notes = COALESCE(?, notes), last_updated = datetime('now') WHERE id = ?`,
    ).run(new_stage, notes || null, req.params.id);

    // Try to trigger Kestra stage notifier workflow
    let executionId = null;
    try {
      const result = await kestra.triggerWorkflowWebhook(
        "recruitment.workflows",
        "wf2_stage_notifier",
        "stage-update-webhook",
        {
          candidate_name: candidate.name,
          candidate_email: candidate.email,
          job_title: candidate.job_title || "Software Engineer",
          new_stage,
          extra_notes: notes || "",
        },
      );
      executionId = result.executionId;

      db.prepare(
        "UPDATE candidates SET kestra_execution_id = ? WHERE id = ?",
      ).run(executionId, req.params.id);

      db.prepare(
        `INSERT INTO workflow_runs (flow_id, execution_id, candidate_email, status, started_at, trigger_reason)
         VALUES (?, ?, ?, ?, datetime('now'), ?)`,
      ).run(
        "wf2_stage_notifier",
        executionId,
        candidate.email,
        "CREATED",
        `Stage change: ${candidate.stage} → ${new_stage}`,
      );
    } catch (kestraErr) {
      console.warn(
        "Kestra stage notifier trigger failed (non-blocking):",
        kestraErr.message,
      );
    }

    const updated = db
      .prepare("SELECT * FROM candidates WHERE id = ?")
      .get(req.params.id);
    res.json({ candidate: updated, executionId });
  } catch (err) {
    console.error("PATCH /candidates/:id/stage error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/candidates/:id/notes — update notes
router.patch("/:id/notes", (req, res) => {
  try {
    const db = getDb();
    const { notes } = req.body;
    db.prepare(
      `UPDATE candidates SET notes = ?, last_updated = datetime('now') WHERE id = ?`,
    ).run(notes, req.params.id);
    const updated = db
      .prepare("SELECT * FROM candidates WHERE id = ?")
      .get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error("PATCH /candidates/:id/notes error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/candidates/:id — soft delete
router.delete("/:id", (req, res) => {
  try {
    const db = getDb();
    db.prepare(
      `UPDATE candidates SET deleted_at = datetime('now') WHERE id = ?`,
    ).run(req.params.id);
    res.json({ message: "Candidate deleted" });
  } catch (err) {
    console.error("DELETE /candidates/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
