"""
extract_resume.py
─────────────────
Standalone version of the resume text extraction logic used in wf1_ats_scorer.
This file exists for local development and unit testing.
The actual task in Kestra embeds this logic directly inside a Script task.

Usage (standalone):
    python extract_resume.py "path/to/resume.txt"
    python extract_resume.py --text "<raw resume text>"
"""

import re
import sys
import argparse

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False


def extract_and_clean(raw_text: str) -> str:
    """
    Clean and normalise raw resume text:
    1. Strip HTML tags (if any)
    2. Normalise whitespace
    3. Remove non-printable control characters
    Returns the cleaned text string.
    """
    text = raw_text

    # Step 1: Strip HTML if BeautifulSoup is available
    if BS4_AVAILABLE:
        soup = BeautifulSoup(text, "html.parser")
        text = soup.get_text(separator=" ")
    else:
        # Fallback: simple regex HTML strip
        text = re.sub(r"<[^>]+>", " ", text)

    # Step 2: Normalise all whitespace (tabs, multiple spaces, newlines) to single space
    text = re.sub(r"\s+", " ", text).strip()

    # Step 3: Remove null bytes and ASCII control characters (keep printable + standard whitespace)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    return text


def main():
    parser = argparse.ArgumentParser(description="Clean and normalise resume text.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--text", type=str, help="Raw resume text string")
    group.add_argument("--file", type=str, help="Path to a text file containing the resume")
    args = parser.parse_args()

    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = args.text

    cleaned = extract_and_clean(raw)
    print(cleaned)


if __name__ == "__main__":
    main()
