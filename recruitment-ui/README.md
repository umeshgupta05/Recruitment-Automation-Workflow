# Recruitment Automation Dashboard

A modern recruitment pipeline dashboard built with React + Express, powered by [Kestra](https://kestra.io) workflow orchestration.

![Stack](https://img.shields.io/badge/React_18-blue) ![Stack](https://img.shields.io/badge/Express.js-black) ![Stack](https://img.shields.io/badge/Kestra-purple) ![Stack](https://img.shields.io/badge/SQLite-green)

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
