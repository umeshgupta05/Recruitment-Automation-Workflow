# Recruitment Automation System — Kestra OSS

A complete AI-powered recruitment pipeline built on **Kestra OSS** (self-hosted)
with **Claude AI** (Anthropic) for intelligent resume scoring, rejection writing,
and candidate coaching nudges.

---

## Architecture Overview

```
Resume Upload (Webhook)
        │
        ▼
┌───────────────────┐
│  WF1: ATS Scorer  │  ← Claude scores resume 0–100
│                   │
│  score ≥ threshold│──→ Email recruiter + KV: shortlisted
│  score < threshold│──→ AI rejection email + KV: rejected
└───────────────────┘

Recruiter action (Webhook / API)
        │
        ▼
┌─────────────────────────┐
│  WF2: Stage Notifier    │  ← Sends stage-change email to candidate
│                         │     Updates KV store
└─────────────────────────┘

Daily cron 09:00 UTC
        │
        ▼
┌─────────────────────────┐
│  WF3: Idle Checker      │  ← Scans all KV profiles
│                         │     Sends AI coaching email if idle ≥ N days
└─────────────────────────┘

Any workflow failure
        │
        ▼
┌─────────────────────────┐
│  WF4: Error Handler     │  ← Logs error, emails ops team
└─────────────────────────┘
```

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Docker + Docker Compose | [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/) |
| Kestra OSS running on port 8080 | See quick-start below |
| Anthropic API key | [https://console.anthropic.com](https://console.anthropic.com) |
| SMTP access | Gmail app password or any SMTP provider |
| Python 3.9+ | Only needed for running `scripts/` locally — not for Kestra |

### Quick-start Kestra with Docker Compose

```bash
# Download the official Kestra docker-compose
curl -o docker-compose.yml \
  https://raw.githubusercontent.com/kestra-io/kestra/develop/docker-compose.yml

# Start Kestra (Postgres + Kestra server)
docker compose up -d

# Open the UI
open http://localhost:8080
```

---

## 2. Adding Secrets

All credentials are stored as **Kestra Secrets** — never hard-coded.

Detailed instructions: [`secrets/secrets_setup.md`](secrets/secrets_setup.md)

**Quick summary:**

1. Open **http://localhost:8080**
2. Click **Settings** (bottom of left sidebar) → **Secrets** tab
3. Click **+ Add secret** for each of the following:

| Secret Key | What to put here |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` from Anthropic Console |
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | e.g. `587` |
| `SMTP_USER` | Your email address |
| `SMTP_PASSWORD` | Gmail app password or SMTP password |
| `RECRUITER_EMAIL` | Email that receives recruiter alerts |

---

## 3. Importing the Flows

Each `.yaml` file in `flows/` is a complete Kestra flow definition.

**Method A — UI (recommended for first-time setup):**

1. In the Kestra UI, click **Flows** in the left sidebar
2. Click **+ Create** (top-right)
3. Paste the contents of `flows/wf4_error_handler.yaml` first (it is a dependency)
4. Click **Save**
5. Repeat for `wf1_ats_scorer.yaml`, `wf2_stage_notifier.yaml`, `wf3_idle_checker.yaml`

**Method B — CLI / curl:**

```bash
# Import all flows in dependency order
for flow in wf4_error_handler wf1_ats_scorer wf2_stage_notifier wf3_idle_checker; do
  curl -s -X POST \
    "http://localhost:8080/api/v1/flows" \
    -H "Content-Type: application/x-yaml" \
    --data-binary @flows/${flow}.yaml
  echo "Imported: ${flow}"
done
```

**Verify:** All four flows appear under **Flows → recruitment.workflows** namespace.

---

## 4. Manual Testing — WF1 via cURL

### Fire a webhook with a strong candidate (expect recruiter notification)

```bash
curl -s -X POST \
  "http://localhost:8080/api/v1/executions/webhook/recruitment.workflows/wf1_ats_scorer/ats-scorer-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_name": "Priya Sharma",
    "candidate_email": "priya.sharma@example.com",
    "job_title": "Senior Python Engineer",
    "score_threshold": 70,
    "job_description": "Senior Python Engineer: 5+ yrs Python, FastAPI/Django, PostgreSQL, Docker, Kubernetes, GitHub Actions CI/CD, AWS or GCP.",
    "resume_text": "Priya Sharma. 7 years Python backend. FastAPI microservices on Kubernetes GKE. PostgreSQL, GitHub Actions, Docker, AWS, GCP. Led team of 5 engineers. B.Tech IIT Bombay 2016."
  }'
```

The response returns an `executionId`. Copy it and open:

```
http://localhost:8080/ui/executions/<executionId>
```

### Fire a webhook with a weak candidate (expect rejection email)

```bash
curl -s -X POST \
  "http://localhost:8080/api/v1/executions/webhook/recruitment.workflows/wf1_ats_scorer/ats-scorer-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_name": "Kevin OBrien",
    "candidate_email": "kevin.obrien@example.com",
    "job_title": "Senior Python Engineer",
    "score_threshold": 70,
    "job_description": "Senior Python Engineer: 5+ yrs Python, FastAPI/Django, PostgreSQL, Docker, Kubernetes.",
    "resume_text": "Kevin OBrien. IT support technician 2021-present. WordPress websites. HTML CSS JavaScript. Udemy Python beginner course 2023."
  }'
```

For more test scenarios (WF2, WF3, edge cases) see [`tests/test_inputs.md`](tests/test_inputs.md).

---

## 5. Monitoring Executions

### Executions Tab

Navigate to **Executions** in the left sidebar to see all runs.

| Status Colour | Meaning |
|---|---|
| 🟢 **GREEN** — SUCCESS | All tasks completed without errors |
| 🟡 **YELLOW** — RUNNING | Execution is in progress |
| 🔴 **RED** — FAILED | One or more tasks errored; the `errors:` block was triggered |
| ⚪ **GREY** — KILLED | Execution was manually cancelled |

### Gantt View

Click any execution → **Gantt** tab.
Shows each task as a horizontal bar with start time and duration.
Useful for spotting which task is slow (e.g. AI API call timeout).

### Logs View

Click any execution → **Logs** tab.
Shows the `stdout` and `stderr` of every task in real time.
Python `print()` calls appear here.
The `log_error` task in WF4 writes a structured error block visible here.

### KV Store

Go to **Settings → KV Store** and filter by prefix `candidate_` to inspect all
stored candidate profiles.

---

## 6. Enabling Real Emails (SMTP)

The flows use Kestra's `io.kestra.plugin.notifications.mail.MailSend` plugin.
It reads SMTP credentials from secrets at runtime.

**To activate real email delivery:**

1. Add the six secrets listed in Section 2 above
2. Ensure your SMTP provider allows the connection:
   - Gmail: port `587` with STARTTLS, app password required
   - SendGrid: port `587`, API key as password
   - Mailgun: port `587`, SMTP credentials from Mailgun dashboard
3. Execute any workflow — emails send immediately

**To test without sending real emails (dry run):**
Temporarily set `SMTP_HOST` to a fake value — the MailSend task will fail,
triggering the `errors:` block and logging the failure, but no real emails go out.
Or use [Mailtrap.io](https://mailtrap.io) (free fake inbox) as your SMTP server.

---

## 7. Swapping Mock AI for Real Claude API

All AI calls already target the real Claude API (`claude-opus-4-5`).
The only thing needed is a valid `ANTHROPIC_API_KEY` secret.

**If you want to swap to a different Claude model** (e.g. claude-haiku for speed/cost):

Find these lines in each flow and update the model string:

| File | Task ID | Line to change |
|---|---|---|
| `wf1_ats_scorer.yaml` | `ai_ats_score` | `model="claude-opus-4-5"` |
| `wf1_ats_scorer.yaml` | `generate_rejection` | `model="claude-opus-4-5"` |
| `wf3_idle_checker.yaml` | `generate_nudge_email` | `model="claude-opus-4-5"` |

**Available models (as of this writing):**

| Model | Use case |
|---|---|
| `claude-opus-4-5` | Highest quality (default in this project) |
| `claude-sonnet-4-5` | Balanced speed + quality |
| `claude-haiku-4-5` | Fastest, lowest cost |

Update the model string in the Python script inside each `Script` task block.

---

## Folder Structure

```
recruitment-kestra/
├── flows/
│   ├── wf1_ats_scorer.yaml        ← Webhook → AI score → route
│   ├── wf2_stage_notifier.yaml    ← Stage change → email candidate
│   ├── wf3_idle_checker.yaml      ← Daily cron → nudge idle profiles
│   └── wf4_error_handler.yaml     ← Reusable error subflow
├── scripts/
│   ├── extract_resume.py          ← Standalone resume cleaner
│   ├── score_resume.py            ← Standalone ATS scorer
│   ├── generate_rejection_email.py← Standalone rejection writer
│   └── generate_nudge_email.py    ← Standalone nudge writer
├── secrets/
│   └── secrets_setup.md           ← How to add secrets in Kestra UI
├── tests/
│   └── test_inputs.md             ← Sample JSON bodies for webhook testing
└── README.md                      ← This file
```

---

## Troubleshooting

**`Secret 'X' not found`** — Add the missing secret in Settings → Secrets.

**`ModuleNotFoundError: anthropic`** — The `beforeCommands` installs it automatically.
If it fails, check that the Kestra worker container has internet access.

**MailSend task fails with connection error** — Verify `SMTP_HOST`, `SMTP_PORT`,
and that your SMTP provider allows the connection from your server's IP.

**Claude returns invalid JSON** — The script strips markdown fences and uses
`json.loads`. If Claude returns prose instead of JSON, check that the system
prompt is being passed correctly (not truncated). Add a `print(raw_content)` line
before `json.loads` to see what Claude actually returned in the Logs view.

**KV store returns 404 on `get_profile`** — The profile does not exist yet.
WF3 handles this gracefully by creating a minimal profile stub.
