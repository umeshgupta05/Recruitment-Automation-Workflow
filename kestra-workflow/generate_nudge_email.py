"""
generate_nudge_email.py
───────────────────────
Standalone version of the Claude nudge email generation logic used in
wf3_idle_checker (the daily idle-profile scan).

Usage:
    export ANTHROPIC_API_KEY="sk-ant-..."
    python generate_nudge_email.py \
        --name "John Smith" \
        --role "Data Engineer" \
        --score 62 \
        --stage "shortlisted" \
        --idle-days 21
"""

import os
import sys
import argparse

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)


SYSTEM_PROMPT = (
    "You are a helpful recruitment coach. A candidate has been idle in our ATS system. "
    "Write a warm, encouraging email (under 150 words) giving 2-3 specific tips to "
    "improve their shortlisting chances for their target role. "
    "Be concrete and actionable. Do not use bullet points — write in flowing prose."
)


def generate_nudge_email(
    candidate_name: str,
    role: str,
    score: int,
    stage: str,
    days_idle: int,
) -> str:
    """
    Calls the Claude API and returns a coaching nudge email body.

    Args:
        candidate_name: Full name of the candidate.
        role:           Target job title.
        score:          ATS score on file (0–100).
        stage:          Current pipeline stage (e.g. shortlisted).
        days_idle:      Number of days the profile has been untouched.

    Returns:
        str — the nudge email body text.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise EnvironmentError("ANTHROPIC_API_KEY environment variable not set.")

    client = anthropic.Anthropic(api_key=api_key)

    user_message = (
        f"Candidate: {candidate_name}, "
        f"Role: {role}, "
        f"Score: {score}/100, "
        f"Stage: {stage}, "
        f"Idle days: {days_idle}"
    )

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=512,
        messages=[{"role": "user", "content": user_message}],
        system=SYSTEM_PROMPT,
    )

    return response.content[0].text.strip()


def main():
    parser = argparse.ArgumentParser(description="Generate a recruitment nudge email via Claude.")
    parser.add_argument("--name",      required=True,           help="Candidate full name")
    parser.add_argument("--role",      required=True,           help="Target job title")
    parser.add_argument("--score",     required=True, type=int, help="ATS score 0-100")
    parser.add_argument("--stage",     required=True,           help="Current pipeline stage")
    parser.add_argument("--idle-days", required=True, type=int, help="Days since last update")
    args = parser.parse_args()

    body = generate_nudge_email(
        args.name, args.role, args.score, args.stage, args.idle_days
    )
    print(body)


if __name__ == "__main__":
    main()
