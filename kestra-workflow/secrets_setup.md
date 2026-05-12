# Secrets Setup Guide

## Kestra OSS — Recruitment Automation System

This guide explains how to add the required secrets in the **Kestra UI** so that
no credentials are ever hard-coded in any flow or script file.

---

## Why Secrets?

Kestra Secrets are encrypted at rest and injected at execution time.
They are **never** visible in execution logs or stored in flow YAML.
All sensitive values in this project (API keys, SMTP credentials) are
referenced with the `{{ secret('KEY_NAME') }}` expression syntax.

---

## Step-by-Step: Adding a Secret in the Kestra UI

1. Open your Kestra UI at **http://localhost:8080**
2. In the left-hand sidebar, click **Settings** (gear icon at the bottom)
3. Navigate to the **Secrets** tab
4. Click **+ Add secret** (top-right button)
5. Enter the **Key** name (exact, case-sensitive — see table below)
6. Enter the **Value**
7. Click **Save**

Repeat for every secret in the table below.

---

## Required Secrets

| Key Name          | Description                                    | Example Value                        |
| ----------------- | ---------------------------------------------- | ------------------------------------ |
| `GEMINI_API_KEY`  | Your Google Gemini API key                     | `AIzaSy-xxxxxxxxxxxxxxxxxxxx`        |
| `SMTP_HOST`       | SMTP server hostname                           | `smtp.gmail.com`                     |
| `SMTP_PORT`       | SMTP port (587 for TLS, 465 for SSL, 25 plain) | `587`                                |
| `SMTP_USER`       | SMTP login username (usually your email)       | `your-address@gmail.com`             |
| `SMTP_PASSWORD`   | SMTP login password or app password            | `abcd efgh ijkl mnop` (Gmail app pw) |
| `RECRUITER_EMAIL` | Email address that receives recruiter alerts   | `recruiter@yourcompany.com`          |

---

## Gmail-Specific Notes

If you are using Gmail SMTP:

1. Enable **2-Step Verification** on your Google account
2. Go to **Google Account → Security → App passwords**
3. Generate an app password for "Mail" + "Other device"
4. Use that 16-character password as `SMTP_PASSWORD`
5. Use `smtp.gmail.com` as `SMTP_HOST` and `587` as `SMTP_PORT`

---

## How Secrets Are Referenced in Flow YAML

Use the Pebble template expression `{{ secret('KEY_NAME') }}` anywhere in your
YAML — in task properties, headers, script strings, etc.

**Examples:**

```yaml
# In a MailSend task
host: "{{ secret('SMTP_HOST') }}"
port: "{{ secret('SMTP_PORT') }}"
username: "{{ secret('SMTP_USER') }}"
password: "{{ secret('SMTP_PASSWORD') }}"
to:
  - "{{ secret('RECRUITER_EMAIL') }}"

# In a Python Script task (passed as string to the script)
script: |
  import google.generativeai as genai
  genai.configure(api_key="{{ secret('GEMINI_API_KEY') }}")
```

---

## Verifying Secrets Are Loaded

After adding secrets, open any flow and click **Execute**. In the execution
**Logs** tab, Kestra will resolve `{{ secret(...) }}` at runtime. If a secret
is missing you will see an error like:

```
Secret 'GEMINI_API_KEY' not found in the secrets store.
```

Fix this by returning to **Settings → Secrets** and verifying the exact key name.

---

## Rotating a Secret

1. Go to **Settings → Secrets**
2. Find the key and click the **edit** (pencil) icon
3. Enter the new value and **Save**
4. All subsequent executions automatically use the new value — no flow changes needed.

---

## Security Checklist

- [ ] Never commit API keys or passwords to git
- [ ] Never hardcode credentials in flow YAML or Python scripts
- [ ] Use the `{{ secret('...') }}` syntax exclusively
- [ ] Rotate `GEMINI_API_KEY` if it is exposed
- [ ] Use a dedicated app password for Gmail — not your main account password
- [ ] Restrict access to the Kestra UI in production (set up authentication)
