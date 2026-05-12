"""
score_resume.py
───────────────
Standalone version of the Claude ATS scoring logic used in wf1_ats_scorer.
This file exists for local development, testing, and debugging outside Kestra.

Usage:
    export ANTHROPIC_API_KEY="sk-ant-..."
    python score_resume.py \
        --job "path/to/job_description.txt" \
        --resume "path/to/cleaned_resume.txt" \
        --threshold 70
"""

import os
import sys
import json
import re
import argparse

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)


SYSTEM_PROMPT = (
    "You are a professional ATS (Applicant Tracking System). "
    "Given a job description and a resume, return ONLY valid JSON with this schema:\n"
    '{ "score": integer 0-100, "passed": boolean, "strengths": [string], '
    '"gaps": [string], "recommendation": string }\n'
    "Score honestly. passed = true if score >= {threshold}."
)


def score_resume(job_description: str, cleaned_resume: str, threshold: int = 70) -> dict:
    """
    Calls the Claude API and returns the parsed ATS score dict.

    Args:
        job_description: Full job description text.
        cleaned_resume:  Cleaned candidate resume text (output of extract_resume).
        threshold:       Minimum score to mark passed=True (default 70).

    Returns:
        dict with keys: score, passed, strengths, gaps, recommendation
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise EnvironmentError("ANTHROPIC_API_KEY environment variable not set.")

    client = anthropic.Anthropic(api_key=api_key)

    system = SYSTEM_PROMPT.format(threshold=threshold)
    user_message = f"JOB:\n{job_description}\n\nRESUME:\n{cleaned_resume}"

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": user_message}],
        system=system,
    )

    raw_content = response.content[0].text.strip()

    # Strip markdown code fences if present
    raw_content = re.sub(r"^```(?:json)?\s*", "", raw_content)
    raw_content = re.sub(r"\s*```$", "", raw_content)

    result = json.loads(raw_content)

    # Validate required keys
    required = {"score", "passed", "strengths", "gaps", "recommendation"}
    missing = required - set(result.keys())
    if missing:
        raise ValueError(f"Claude response missing required keys: {missing}")

    return result


def main():
    parser = argparse.ArgumentParser(description="ATS-score a resume against a job description.")
    parser.add_argument("--job",       required=True, help="Path to job description .txt file")
    parser.add_argument("--resume",    required=True, help="Path to cleaned resume .txt file")
    parser.add_argument("--threshold", type=int, default=70, help="Pass score threshold (default 70)")
    args = parser.parse_args()

    with open(args.job,    "r", encoding="utf-8") as f:
        job_desc = f.read()
    with open(args.resume, "r", encoding="utf-8") as f:
        resume   = f.read()

    result = score_resume(job_desc, resume, args.threshold)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
