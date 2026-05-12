const express = require("express");
const router = express.Router();
const { getDb } = require("../db/database");
const kestra = require("../services/kestra");

const DEFAULT_JOB_DESCRIPTION =
  "Full stack developer with 3+ years experience in Node.js and React";

const WORKFLOW_FLOWS = [
  {
    flowId: "wf1_ats_scorer",
    name: "ATS Scorer",
    description: "Scores resumes against job descriptions using AI",
  },
  {
    flowId: "wf2_stage_notifier",
    name: "Stage Notifier",
    description: "Sends notifications on candidate stage changes",
  },
  {
    flowId: "wf3_idle_checker",
    name: "Idle Checker",
    description: "Flags candidates idle for more than 14 days",
  },
  {
    flowId: "wf4_error_handler",
    name: "Error Handler",
    description: "Catches and logs workflow failures",
  },
];

function mapRunToExecution(run) {
  if (!run) return null;
  return {
    id: run.execution_id,
    flowId: run.flow_id,
    state: {
      current: run.status || "UNKNOWN",
      startDate: run.started_at || null,
      endDate: run.finished_at || null,
    },
  };
}

// GET /api/workflows/status — status of all workflows
router.get("/status", async (req, res) => {
  try {
    const results = [];
    const db = getDb();

    for (const flow of WORKFLOW_FLOWS) {
      if (!kestra.hasBasicAuth) {
        const lastRun = db
          .prepare(
            "SELECT * FROM workflow_runs WHERE flow_id = ? ORDER BY started_at DESC LIMIT 1",
          )
          .get(flow.flowId);
        results.push({
          flowId: flow.flowId,
          name: flow.name,
          description: flow.description,
          lastExecution: lastRun ? lastRun.execution_id : null,
          status: lastRun ? lastRun.status || "UNKNOWN" : "IDLE",
          lastRun: lastRun ? lastRun.started_at : null,
        });
        continue;
      }

      try {
        const executions = await kestra.getExecutionsByFlow(
          "recruitment.workflows",
          flow.flowId,
          1,
        );
        const last =
          Array.isArray(executions) && executions.length > 0
            ? executions[0]
            : null;
        results.push({
          flowId: flow.flowId,
          name: flow.name,
          description: flow.description,
          lastExecution: last ? last.id : null,
          status: last ? last.state?.current || "UNKNOWN" : "IDLE",
          lastRun: last ? last.state?.startDate : null,
        });
      } catch {
        const lastRun = db
          .prepare(
            "SELECT * FROM workflow_runs WHERE flow_id = ? ORDER BY started_at DESC LIMIT 1",
          )
          .get(flow.flowId);
        results.push({
          flowId: flow.flowId,
          name: flow.name,
          description: flow.description,
          lastExecution: lastRun ? lastRun.execution_id : null,
          status: lastRun ? lastRun.status || "UNKNOWN" : "IDLE",
          lastRun: lastRun ? lastRun.started_at : null,
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error("GET /workflows/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workflows/health — verify Kestra auth connectivity
router.get("/health", async (req, res) => {
  if (!kestra.hasBasicAuth) {
    return res.status(400).json({
      status: "missing_auth",
      message:
        "Set KESTRA_USERNAME and KESTRA_PASSWORD to enable Kestra API access.",
    });
  }

  try {
    const flows = await kestra.getFlowsList("recruitment.workflows");
    const count = Array.isArray(flows) ? flows.length : 0;
    return res.json({ status: "ok", flows: count });
  } catch (err) {
    return res.status(502).json({ status: "error", message: err.message });
  }
});

// POST /api/workflows/ats-result — sync ATS results into the DB
router.post("/ats-result", (req, res) => {
  try {
    const db = getDb();
    const {
      candidate_email,
      score,
      strengths,
      gaps,
      recommendation,
      stage,
      execution_id,
    } = req.body || {};

    if (!candidate_email) {
      return res.status(400).json({ error: "candidate_email is required" });
    }

    const scoreValue = Number.isFinite(Number(score)) ? Number(score) : null;
    const strengthsValue = Array.isArray(strengths)
      ? JSON.stringify(strengths)
      : typeof strengths === "string"
        ? strengths
        : null;
    const gapsValue = Array.isArray(gaps)
      ? JSON.stringify(gaps)
      : typeof gaps === "string"
        ? gaps
        : null;
    const recommendationValue =
      typeof recommendation === "string" ? recommendation : null;
    const stageValue = typeof stage === "string" && stage ? stage : null;
    const executionIdValue =
      typeof execution_id === "string" && execution_id ? execution_id : null;

    const result = db
      .prepare(
        `UPDATE candidates
         SET score = COALESCE(?, score),
             strengths = COALESCE(?, strengths),
             gaps = COALESCE(?, gaps),
             ai_recommendation = COALESCE(?, ai_recommendation),
             stage = COALESCE(?, stage),
             kestra_execution_id = COALESCE(?, kestra_execution_id),
             last_updated = datetime('now')
         WHERE email = ? AND deleted_at IS NULL`,
      )
      .run(
        scoreValue,
        strengthsValue,
        gapsValue,
        recommendationValue,
        stageValue,
        executionIdValue,
        candidate_email,
      );

    if (executionIdValue) {
      db.prepare(
        "UPDATE workflow_runs SET status = ?, finished_at = datetime('now') WHERE execution_id = ?",
      ).run("SUCCESS", executionIdValue);
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    return res.json({ updated: true, executionId: executionIdValue || null });
  } catch (err) {
    console.error("POST /workflows/ats-result error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/workflows/retry-ats/:candidateId — retry ATS scoring
router.post("/retry-ats/:candidateId", async (req, res) => {
  try {
    const db = getDb();
    const candidate = db
      .prepare("SELECT * FROM candidates WHERE id = ? AND deleted_at IS NULL")
      .get(req.params.candidateId);

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    if (!candidate.resume_text) {
      return res
        .status(400)
        .json({ error: "Candidate resume text is missing" });
    }

    const wfResult = await kestra.triggerWorkflowWebhook(
      "recruitment.workflows",
      "wf1_ats_scorer",
      "ats-scorer-webhook",
      {
        candidate_name: candidate.name,
        candidate_email: candidate.email,
        job_title: candidate.job_title || "Software Engineer",
        resume_text: candidate.resume_text.substring(0, 5000),
        score_threshold: 70,
        job_description: DEFAULT_JOB_DESCRIPTION,
      },
    );

    const executionId = wfResult.executionId;

    db.prepare(
      "UPDATE candidates SET kestra_execution_id = ?, last_updated = datetime('now') WHERE id = ?",
    ).run(executionId, candidate.id);

    db.prepare(
      `INSERT INTO workflow_runs (flow_id, execution_id, candidate_email, status, started_at, trigger_reason)
       VALUES (?, ?, ?, ?, datetime('now'), ?)`,
    ).run(
      "wf1_ats_scorer",
      executionId,
      candidate.email,
      "CREATED",
      "ATS retry",
    );

    return res.json({ executionId });
  } catch (err) {
    console.error("POST /workflows/retry-ats error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/workflows/execution/:executionId
router.get("/execution/:executionId", async (req, res) => {
  try {
    const db = getDb();

    // Find matching candidate
    const candidate = db
      .prepare("SELECT * FROM candidates WHERE kestra_execution_id = ?")
      .get(req.params.executionId);

    if (!kestra.hasBasicAuth) {
      const run = db
        .prepare("SELECT * FROM workflow_runs WHERE execution_id = ?")
        .get(req.params.executionId);
      return res.json({ execution: mapRunToExecution(run), candidate });
    }

    const execution = await kestra.getExecution(req.params.executionId);
    return res.json({ execution, candidate });
  } catch (err) {
    console.error("GET /workflows/execution error:", err);
    try {
      const db = getDb();
      const candidate = db
        .prepare("SELECT * FROM candidates WHERE kestra_execution_id = ?")
        .get(req.params.executionId);
      const run = db
        .prepare("SELECT * FROM workflow_runs WHERE execution_id = ?")
        .get(req.params.executionId);
      return res.json({ execution: mapRunToExecution(run), candidate });
    } catch (fallbackErr) {
      return res.status(500).json({ error: fallbackErr.message });
    }
  }
});

// GET /api/workflows/stats — aggregated stats from DB (all real-time computed)
router.get("/stats", (req, res) => {
  try {
    const db = getDb();
    const base = "FROM candidates WHERE deleted_at IS NULL";

    const total = db.prepare(`SELECT COUNT(*) as c ${base}`).get().c;
    const shortlisted = db
      .prepare(`SELECT COUNT(*) as c ${base} AND stage = 'shortlisted'`)
      .get().c;
    const interviews = db
      .prepare(`SELECT COUNT(*) as c ${base} AND stage = 'interview_scheduled'`)
      .get().c;
    const offers = db
      .prepare(`SELECT COUNT(*) as c ${base} AND stage = 'offer_extended'`)
      .get().c;
    const rejected = db
      .prepare(`SELECT COUNT(*) as c ${base} AND stage = 'rejected'`)
      .get().c;
    const scored = db
      .prepare(`SELECT COUNT(*) as c ${base} AND stage = 'scored'`)
      .get().c;
    const applied = db
      .prepare(`SELECT COUNT(*) as c ${base} AND stage = 'applied'`)
      .get().c;

    // Idle: candidates with no update in 14 days
    const idleCount = db
      .prepare(
        `SELECT COUNT(*) as c ${base} AND stage NOT IN ('rejected', 'offer_extended') AND last_updated < datetime('now', '-14 days')`,
      )
      .get().c;

    const passRate =
      total > 0
        ? Math.round(((shortlisted + interviews + offers) / total) * 100)
        : 0;

    // Real deltas: compute counts from the last 7 days vs the 7 days before that
    const thisWeekTotal = db
      .prepare(
        `SELECT COUNT(*) as c ${base} AND created_at >= datetime('now', '-7 days')`,
      )
      .get().c;
    const lastWeekTotal = db
      .prepare(
        `SELECT COUNT(*) as c ${base} AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')`,
      )
      .get().c;
    const thisWeekInterviews = db
      .prepare(
        `SELECT COUNT(*) as c ${base} AND stage = 'interview_scheduled' AND last_updated >= datetime('now', '-7 days')`,
      )
      .get().c;

    // Weekly application volume (last 6 weeks, computed from real data)
    const weeklyVolume = [];
    for (let i = 5; i >= 0; i--) {
      const weekStart = `-${(i + 1) * 7} days`;
      const weekEnd = `-${i * 7} days`;
      const weekLabel = getWeekLabel(i);
      const count = db
        .prepare(
          `SELECT COUNT(*) as c ${base} AND created_at >= datetime('now', ?) AND created_at < datetime('now', ?)`,
        )
        .get(weekStart, weekEnd).c;
      weeklyVolume.push({ week: weekLabel, count });
    }

    res.json({
      total,
      applied,
      scored,
      shortlisted,
      interviews,
      offers,
      rejected,
      idleCount,
      passRate,
      thisWeekTotal,
      lastWeekTotal,
      thisWeekInterviews,
      weeklyVolume,
    });
  } catch (err) {
    console.error("GET /workflows/stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

function getWeekLabel(weeksAgo) {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const weekOfMonth = Math.ceil(d.getDate() / 7);
  return `W${weekOfMonth} ${monthNames[d.getMonth()]}`;
}

// GET /api/workflows/runs — recent workflow runs from DB
router.get("/runs", (req, res) => {
  try {
    const db = getDb();
    const runs = db
      .prepare("SELECT * FROM workflow_runs ORDER BY started_at DESC LIMIT 20")
      .all();
    res.json(runs);
  } catch (err) {
    console.error("GET /workflows/runs error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
