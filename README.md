# Recruitment Automation Dashboard

A modern recruitment pipeline dashboard built with React + Express, powered by [Kestra](https://kestra.io) workflow orchestration.

![Stack](https://img.shields.io/badge/React_18-blue) ![Stack](https://img.shields.io/badge/Express.js-black) ![Stack](https://img.shields.io/badge/Kestra-purple) ![Stack](https://img.shields.io/badge/SQLite-green)

## Screenshots

### Dashboard Overview
![Dashboard Overview](dashboard.png)
The main **Recruitment Hub** dashboard displays real-time pipeline metrics — total applicants, shortlisted count, scheduled interviews, and candidates idle for more than 14 days. The bottom section shows a live candidate table with AI scores and pipeline stages, alongside a live feed of Kestra workflow run statuses.

---

### Kestra Workflow Executions
![Kestra Workflow Executions](kestra-executions.png)
The Kestra UI showing execution history for the `wf1_ats_scorer` workflow. Each resume upload triggers a new execution; the timeline chart and table surface duration, status (SUCCESS / WARNING / FAILED), and timestamps — making it easy to debug or rerun failed scoring jobs.

---

### Candidate Detail — Profile & Workflow Steps
![Candidate Detail - Profile and Workflow](candidate-detail-overview.png)
The **Candidate Detail** page shows the candidate's profile card, an AI-generated score (0–100 gauge), identified strengths, and a step-by-step breakdown of the Kestra workflow execution (text extraction → AI scoring → routing → rejection or advancement).

---

### Candidate Detail — AI Analysis & Notes
![Candidate Detail - AI Analysis](candidate-detail-analysis.png)
The lower section of the Candidate Detail page displays the AI-generated strengths, skill gaps, and a plain-English **AI Recommendation** summarising fit for the role. Recruiters can also add and save private notes against each candidate directly from this view.

---

## Prerequisites

- **Node.js 18+** and **pnpm** installed
- **Docker** (for running Kestra OSS)

## 1. Start Kestra

```bash
docker run --pull=always --rm -it -p 8080:8080 --user=root \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp:/tmp \
  kestra/kestra:latest server local
```

Kestra UI will be available at [http://localhost:8080](http://localhost:8080)

## 2. Backend Setup

```bash
cd recruitment-ui/backend
pnpm install
node server.js
```

The API server starts on [http://localhost:3001](http://localhost:3001)

## 3. Frontend Setup

```bash
cd recruitment-ui/frontend
pnpm install
pnpm dev
```

The dashboard opens at [http://localhost:5173](http://localhost:5173)

## 4. Environment Variables

Create `backend/.env`:

```env
KESTRA_BASE=http://localhost:8080/api/v1
PORT=3001
```

## 5. How to Test

1. Open [http://localhost:5173](http://localhost:5173)
2. Navigate to **Upload** → upload a resume PDF
3. Watch the **Dashboard** update with the new candidate
4. Check the **Workflows** page for execution status
5. Click a candidate to view AI scoring results and advance pipeline stages

## Architecture

```
Browser (React :5173)
   │
   ├─ /api/* ──→ Vite proxy ──→ Express (:3001)
   │                                │
   │                                ├─ SQLite (local candidate DB)
   │                                │
   │                                └─ Kestra REST API (:8080)
   │                                      │
   │                                      └─ Workflow executions
```

## Tech Stack

| Layer    | Tech                                      |
| -------- | ----------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS 3, Recharts  |
| Backend  | Express.js, better-sqlite3, Multer, Axios |
| Orchestr | Kestra OSS                                |
| Icons    | Lucide React                              |
