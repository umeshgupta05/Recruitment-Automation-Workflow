"""
generate_rejection_email.py
───────────────────────────
Standalone version of the Claude rejection email generation logic used in
wf1_ats_scorer (the ELSE branch after a failed ATS score).

Usage:
    export ANTHROPIC_API_KEY="sk-ant-..."
    python generate_rejection_email.py \
        --name "Jane Doe" \
        --role "Senior Python Engineer" \
        --score 45 \
        --gaps '["No cloud experience", "Missing CI/CD skills"]'
"""

import os
import sys
import json
import argparse

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)


SYSTEM_PROMPT = (
    "You are a kind, professional recruiter writing a rejection email. "
    "Be specific about why the candidate did not pass and give 2-3 actionable "
    "improvement tips. Keep it under 200 words. "
    "Do not say 'unfortunately' or 'regret'."
)


def generate_rejection_email(
    candidate_name: str,
    job_title: str,
    score: int,
    gaps: list[str],
) -> str:
    """
    Calls the Claude API and returns a personalised rejection email body (plain text).

    Args:
        candidate_name: Full name of the candidate.
        job_title:      Job title they applied for.
        score:          Their ATS score out of 100.
        gaps:           List of skill/experience gaps identified by the ATS.

    Returns:
        str — the email body text ready to be inserted into the MailSend task.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise EnvironmentError("ANTHROPIC_API_KEY environment variable not set.")

    client = anthropic.Anthropic(api_key=api_key)

    gaps_str = ", ".join(gaps) if gaps else "Not specified"
    user_message = (
        f"Candidate: {candidate_name}, "
        f"Role: {job_title}, "
        f"Score: {score}/100, "
        f"Gaps: {gaps_str}"
    )

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=512,
        messages=[{"role": "user", "content": user_message}],
        system=SYSTEM_PROMPT,
    )

    return response.content[0].text.strip()


def main():
    parser = argparse.ArgumentParser(description="Generate a personalised rejection email via Claude.")
    parser.add_argument("--name",  required=True,             help="Candidate full name")
    parser.add_argument("--role",  required=True,             help="Job title applied for")
    parser.add_argument("--score", required=True, type=int,   help="ATS score 0-100")
    parser.add_argument("--gaps",  required=False, default="[]", help='JSON array of gap strings')
    args = parser.parse_args()

    gaps = json.loads(args.gaps)
    body = generate_rejection_email(args.name, args.role, args.score, gaps)
    print(body)


if __name__ == "__main__":
    main()
