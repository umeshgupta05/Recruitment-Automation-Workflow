const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getDb } = require("../db/database");
const kestra = require("../services/kestra");

// Ensure upload dir exists
const uploadDir = path.join(__dirname, "..", "tmp", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// POST /api/apply - Candidate applies to a job
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const { name, email, phone, job_id } = req.body;

    if (!name || !email || !job_id) {
      return res
        .status(400)
        .json({ error: "Name, email, and job_id are required" });
    }

    // Fetch job details
    const db = getDb();
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(job_id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Extract text from PDF
    let resumeText = "";
    try {
      const pdfParse = require("pdf-parse");
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(pdfBuffer);
      resumeText = pdfData.text || "";
    } catch (pdfErr) {
      console.warn("PDF text extraction failed:", pdfErr.message);
      resumeText = "[PDF text extraction failed]";
    }

    // Check for duplicate application to same job
    const existing = db
      .prepare(
        "SELECT id FROM candidates WHERE email = ? AND job_id = ? AND deleted_at IS NULL",
      )
      .get(email, job_id);

    if (existing) {
      return res
        .status(409)
        .json({ error: "You have already applied to this job" });
    }

    // Insert candidate application
    const result = db
      .prepare(
        `INSERT INTO candidates (name, email, phone, job_title, resume_text, resume_filename, stage, job_id)
       VALUES (?, ?, ?, ?, ?, ?, 'applied', ?)`,
      )
      .run(
        name,
        email,
        phone || null,
        job.title,
        resumeText,
        req.file.filename,
        job_id,
      );

    const candidateId = result.lastInsertRowid;

    // Trigger Kestra ATS scorer workflow
    let executionId = null;
    try {
      const scoreThreshold = Number.isFinite(Number(job.score_threshold))
        ? Number(job.score_threshold)
        : 70;
      const wfResult = await kestra.triggerWorkflowWebhook(
        "recruitment.workflows",
        "wf1_ats_scorer",
        "ats-scorer-webhook",
        {
          candidate_name: name,
          candidate_email: email,
          job_title: job.title,
          resume_text: resumeText.substring(0, 5000), // Limit text length
          score_threshold: scoreThreshold,
          job_description: job.description,
        },
      );
      executionId = wfResult.executionId;

      // Update candidate with execution id
      db.prepare(
        "UPDATE candidates SET kestra_execution_id = ? WHERE id = ?",
      ).run(executionId, candidateId);

      // Log workflow run
      db.prepare(
        `INSERT INTO workflow_runs (flow_id, execution_id, candidate_email, status, started_at, trigger_reason)
         VALUES (?, ?, ?, ?, datetime('now'), ?)`,
      ).run("wf1_ats_scorer", executionId, email, "CREATED", "Job application");
    } catch (kestraErr) {
      console.warn(
        "Kestra ATS scorer trigger failed (non-blocking):",
        kestraErr.message,
      );
    }

    res.status(201).json({
      candidateId,
      executionId,
      jobId: job_id,
      message: "Application submitted successfully",
    });
  } catch (err) {
    console.error("POST /api/apply error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
