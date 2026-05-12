# Test Inputs
## Recruitment Kestra Automation — Manual Testing Guide

Use the scenarios below to verify each workflow end-to-end.
All webhook URLs assume Kestra is running on `http://localhost:8080`.

---

## WF1 — ATS Scorer (`wf1_ats_scorer`)

### Webhook URL

```
POST http://localhost:8080/api/v1/executions/webhook/recruitment.workflows/wf1_ats_scorer/ats-scorer-webhook
Content-Type: application/json
```

---

### Scenario A — Strong Candidate (expected score ~85, recruiter notification)

**Description:** Experienced senior engineer — well-matched to the role.
Expected outcome: `passed = true`, recruiter receives shortlist email,
KV store entry created with `stage = "shortlisted"`.

```json
{
  "candidate_name":  "Priya Sharma",
  "candidate_email": "priya.sharma@example.com",
  "job_title":       "Senior Python Engineer",
  "score_threshold": 70,
  "job_description": "We are looking for a Senior Python Engineer with 5+ years of experience building scalable backend systems. Required skills: Python, FastAPI or Django, PostgreSQL, Docker, Kubernetes, CI/CD pipelines (GitHub Actions), REST API design, and strong communication skills. Experience with AWS or GCP is a plus.",
  "resume_text": "Priya Sharma | priya.sharma@example.com | github.com/priyasharma\n\nSUMMARY\nSenior Software Engineer with 7 years specialising in Python backend development. Led teams of 4-6 engineers, delivered high-traffic APIs serving 10M+ requests per day.\n\nEXPERIENCE\nLead Backend Engineer — TechFlow Inc (2019–present)\n- Built FastAPI microservices deployed on Kubernetes (GKE), processing 15M events/day\n- Redesigned PostgreSQL schema reducing query latency by 40%\n- Established CI/CD pipelines using GitHub Actions; reduced deployment time from 2 hours to 12 minutes\n- Mentored 3 junior engineers to senior level\n\nBackend Engineer — DataStream Ltd (2016–2019)\n- Developed Django REST APIs for a SaaS analytics platform\n- Migrated monolith to Docker-based microservices on AWS ECS\n\nSKILLS\nPython, FastAPI, Django, PostgreSQL, Redis, Docker, Kubernetes, GitHub Actions, AWS, GCP, REST APIs, gRPC\n\nEDUCATION\nB.Tech Computer Science, IIT Bombay, 2016"
}
```

**Expected result:**
- `score` ≈ 82–90
- `passed` = `true`
- Recruiter email sent to `RECRUITER_EMAIL`
- KV key `candidate_priya.sharma@example.com` set with `stage = "shortlisted"`

**cURL command:**
```bash
curl -s -X POST \
  "http://localhost:8080/api/v1/executions/webhook/recruitment.workflows/wf1_ats_scorer/ats-scorer-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_name": "Priya Sharma",
    "candidate_email": "priya.sharma@example.com",
    "job_title": "Senior Python Engineer",
    "score_threshold": 70,
    "job_description": "We are looking for a Senior Python Engineer with 5+ years of experience building scalable backend systems. Required skills: Python, FastAPI or Django, PostgreSQL, Docker, Kubernetes, CI/CD pipelines (GitHub Actions), REST API design, and strong communication skills. Experience with AWS or GCP is a plus.",
    "resume_text": "Priya Sharma | priya.sharma@example.com\n\nSenior Software Engineer with 7 years in Python backend development. Led FastAPI microservices on Kubernetes (GKE), 15M events/day. PostgreSQL tuning, GitHub Actions CI/CD, AWS and GCP. Django REST APIs, Docker, Redis."
  }'
```

---

### Scenario B — Weak Candidate (expected score ~45, rejection email)

**Description:** Junior candidate with minimal relevant experience.
Expected outcome: `passed = false`, rejection email sent to candidate,
KV store entry created with `stage = "rejected"`.

```json
{
  "candidate_name":  "Kevin O'Brien",
  "candidate_email": "kevin.obrien@example.com",
  "job_title":       "Senior Python Engineer",
  "score_threshold": 70,
  "job_description": "We are looking for a Senior Python Engineer with 5+ years of experience building scalable backend systems. Required skills: Python, FastAPI or Django, PostgreSQL, Docker, Kubernetes, CI/CD pipelines (GitHub Actions), REST API design, and strong communication skills. Experience with AWS or GCP is a plus.",
  "resume_text": "Kevin O'Brien | kevin.obrien@example.com\n\nOBJECTIVE\nLooking to start a career in software development.\n\nEXPERIENCE\nIT Support Technician — LocalCo (2021–present)\n- Installed and maintained PCs, set up printers, troubleshot network issues\n\nFreelance Web Designer (2020–2021)\n- Built simple WordPress websites for local businesses\n\nSKILLS\nHTML, CSS, basic JavaScript, WordPress, Microsoft Office\n\nEDUCATION\nHigh School Diploma, 2019\nOnline Python Beginner course (Udemy), completed 2023"
}
```

**Expected result:**
- `score` ≈ 30–50
- `passed` = `false`
- Personalised rejection email sent to `kevin.obrien@example.com`
- KV key `candidate_kevin.obrien@example.com` set with `stage = "rejected"`

**cURL command:**
```bash
curl -s -X POST \
  "http://localhost:8080/api/v1/executions/webhook/recruitment.workflows/wf1_ats_scorer/ats-scorer-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_name": "Kevin O'\''Brien",
    "candidate_email": "kevin.obrien@example.com",
    "job_title": "Senior Python Engineer",
    "score_threshold": 70,
    "job_description": "Senior Python Engineer: 5+ yrs Python, FastAPI/Django, PostgreSQL, Docker, Kubernetes, GitHub Actions, AWS or GCP.",
    "resume_text": "Kevin O'\''Brien. IT Support Technician at LocalCo 2021-present. Installed PCs, troubleshot networks. HTML, CSS, basic JavaScript, WordPress. Udemy Python beginner course 2023."
  }'
```

---

### Scenario C — Edge Case at Threshold (score ~70, tests both routing branches)

**Description:** Mid-level candidate whose score may land exactly at or
one point either side of the threshold. Useful for verifying the boundary.
Run twice — once with `score_threshold: 70`, once with `score_threshold: 75`
to observe both branches.

```json
{
  "candidate_name":  "Mei Lin",
  "candidate_email": "mei.lin@example.com",
  "job_title":       "Senior Python Engineer",
  "score_threshold": 70,
  "job_description": "We are looking for a Senior Python Engineer with 5+ years of experience building scalable backend systems. Required skills: Python, FastAPI or Django, PostgreSQL, Docker, Kubernetes, CI/CD pipelines (GitHub Actions), REST API design, and strong communication skills. Experience with AWS or GCP is a plus.",
  "resume_text": "Mei Lin | mei.lin@example.com\n\nSUMMARY\nPython developer with 4 years of commercial experience.\n\nEXPERIENCE\nSoftware Engineer — MidCo Ltd (2020–present)\n- Developed REST APIs using Flask and PostgreSQL\n- Containerised services with Docker; limited Kubernetes exposure\n- Wrote GitHub Actions pipelines for basic CI\n\nJunior Developer — StartupX (2019–2020)\n- Maintained Django codebase; fixed bugs and wrote unit tests\n\nSKILLS\nPython, Flask, Django, PostgreSQL, Docker, GitHub Actions, REST APIs\n\nEDUCATION\nBSc Computer Science, University of Manchester, 2019"
}
```

**Expected result (threshold=70):** Score ≈ 65–75 — outcome depends on exact AI scoring.
**Expected result (threshold=75):** Same score but now `passed = false` → rejection branch.

**cURL to force failure branch (raise threshold above likely score):**
```bash
curl -s -X POST \
  "http://localhost:8080/api/v1/executions/webhook/recruitment.workflows/wf1_ats_scorer/ats-scorer-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_name": "Mei Lin",
    "candidate_email": "mei.lin@example.com",
    "job_title": "Senior Python Engineer",
    "score_threshold": 75,
    "job_description": "Senior Python Engineer: 5+ yrs Python, FastAPI/Django, PostgreSQL, Docker, Kubernetes, GitHub Actions, AWS or GCP.",
    "resume_text": "Mei Lin. 4 years Python development. Flask and PostgreSQL REST APIs. Docker, basic Kubernetes, GitHub Actions CI. Django maintenance. BSc Computer Science Manchester 2019."
  }'
```

---

## WF2 — Stage Change Notifier (`wf2_stage_notifier`)

### Webhook URL

```
POST http://localhost:8080/api/v1/executions/webhook/recruitment.workflows/wf2_stage_notifier/stage-update-webhook
Content-Type: application/json
```

### Scenario D — Move Candidate to Interview Stage

**Description:** Recruiter moves Priya Sharma (from Scenario A) to interview_scheduled.
Expected: professional interview invitation email sent; KV updated.

```json
{
  "candidate_name":  "Priya Sharma",
  "candidate_email": "priya.sharma@example.com",
  "job_title":       "Senior Python Engineer",
  "new_stage":       "interview_scheduled",
  "extra_notes":     "Your technical interview is on Thursday at 14:00 BST via Google Meet. Please prepare a 10-minute walkthrough of a recent project."
}
```

**cURL command:**
```bash
curl -s -X POST \
  "http://localhost:8080/api/v1/executions/webhook/recruitment.workflows/wf2_stage_notifier/stage-update-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_name": "Priya Sharma",
    "candidate_email": "priya.sharma@example.com",
    "job_title": "Senior Python Engineer",
    "new_stage": "interview_scheduled",
    "extra_notes": "Your technical interview is on Thursday at 14:00 BST via Google Meet. Please prepare a 10-minute walkthrough of a recent project."
  }'
```

**Expected result:**
- Interview invitation email delivered to `priya.sharma@example.com`
- KV key updated: `stage = "interview_scheduled"`

---

## WF3 — Idle Profile Checker (`wf3_idle_checker`)

### Trigger: Schedule (daily 09:00 UTC) — Manual Trigger for Testing

To test without waiting for the cron, trigger it via the Kestra UI:

1. Open **Flows → wf3_idle_checker**
2. Click **Execute** (top-right)
3. Set `idle_days = 0` to force ALL existing profiles to be treated as idle
4. Check execution logs to see which candidates were processed

Or via API:

```bash
curl -s -X POST \
  "http://localhost:8080/api/v1/executions/recruitment.workflows/wf3_idle_checker" \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"idle_days": 0}}'
```

### Scenario E — Mock Idle Profile Test

**Setup:** First run WF1 (Scenario A) to create a profile. Then immediately run WF3
with `idle_days = 0` so the profile is treated as idle regardless of age.

**Expected result:**
- `should_nudge = true` for all existing non-rejected profiles
- AI nudge email sent to each idle candidate
- KV profile updated with `last_nudged` timestamp

**To test only rejected profiles are skipped:**
1. Run WF1 Scenario B (Kevin O'Brien → rejected)
2. Run WF3 with `idle_days = 0`
3. Verify Kevin does NOT receive a nudge email (rejected profiles are skipped)

---

## Verifying Test Results

After each test, check:

1. **Executions tab** → find your execution → click to open
2. **Gantt view** → confirms task order and duration
3. **Logs view** → full output from each task including Python print statements
4. **KV Store** → Settings → KV Store → filter by `candidate_` prefix
5. **Email inbox** — check the relevant inboxes for received emails

### Execution Status Colours

| Colour | Meaning |
|--------|---------|
| 🟢 Green  | SUCCESS — all tasks completed normally |
| 🟡 Yellow | RUNNING — execution in progress |
| 🔴 Red    | FAILED — at least one task errored; check logs |
| 🔵 Blue   | PAUSED / WAITING — awaiting input or trigger |
