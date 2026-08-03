from __future__ import annotations

from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess
import unicodedata

ROOT = Path.cwd()

PDF_DIR = ROOT / "imports/super-library/files"
QUARANTINE_DIR = (
    ROOT / "imports/super-library/quarantine/files"
)

STATE_DIR = ROOT / "imports/super-library/state"
EXTRACTED_DIR = ROOT / "imports/super-library/extracted"

QUALITY_REPORT = (
    ROOT
    / "artifacts/super-library/final-audit/"
    / "quality-warnings.json"
)

OCR_MAX_PAGES = int(
    os.environ.get("OCR_MAX_PAGES", "20")
)

OCR_DPI = int(
    os.environ.get("OCR_DPI", "140")
)

MIN_VALID_TEXT = int(
    os.environ.get("MIN_VALID_TEXT", "300")
)


def run(command: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("\u200c", " ")
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def find_pdf(filename: str, digest: str) -> Path | None:
    direct = PDF_DIR / filename

    if direct.exists():
        return direct

    quarantine = QUARANTINE_DIR / filename

    if quarantine.exists():
        return quarantine

    for directory in (PDF_DIR, QUARANTINE_DIR):
        for path in directory.glob("*.pdf"):
            try:
                current = hashlib.sha256(
                    path.read_bytes()
                ).hexdigest()
            except OSError:
                continue

            if current == digest:
                return path

    return None


def digital_extract(pdf: Path, output: Path) -> str:
    result = run(
        [
            "pdftotext",
            "-layout",
            str(pdf),
            str(output),
        ]
    )

    if result.returncode != 0 or not output.exists():
        return ""

    text = output.read_text(
        encoding="utf-8",
        errors="ignore",
    )

    output.unlink(missing_ok=True)

    return normalize(text)


def ocr_extract(pdf: Path, work_dir: Path) -> str:
    shutil.rmtree(work_dir, ignore_errors=True)
    work_dir.mkdir(parents=True, exist_ok=True)

    result = run(
        [
            "pdftoppm",
            "-f",
            "1",
            "-l",
            str(OCR_MAX_PAGES),
            "-jpeg",
            "-r",
            str(OCR_DPI),
            str(pdf),
            str(work_dir / "page"),
        ]
    )

    if result.returncode != 0:
        shutil.rmtree(work_dir, ignore_errors=True)
        return ""

    pages = []

    for image in sorted(work_dir.glob("page-*.jpg")):
        result = run(
            [
                "tesseract",
                str(image),
                "stdout",
                "-l",
                "fas+eng",
                "--psm",
                "6",
            ]
        )

        if result.returncode == 0:
            text = normalize(result.stdout)

            if text:
                pages.append(text)

        image.unlink(missing_ok=True)

    shutil.rmtree(work_dir, ignore_errors=True)

    return "\f".join(pages)


warnings = json.loads(
    QUALITY_REPORT.read_text(encoding="utf-8")
)

results = []

for number, warning in enumerate(warnings, start=1):
    filename = warning.get("filename") or ""
    digest = warning.get("sha256") or ""

    print(
        f"[{number}/{len(warnings)}] {filename}",
        flush=True,
    )

    pdf = find_pdf(filename, digest)

    if pdf is None:
        results.append(
            {
                "filename": filename,
                "sha256": digest,
                "status": "pdf-not-found",
            }
        )

        print("  PDF not found.", flush=True)
        continue

    actual_digest = hashlib.sha256(
        pdf.read_bytes()
    ).hexdigest()

    state_path = STATE_DIR / f"{actual_digest}.json"
    text_path = EXTRACTED_DIR / f"{actual_digest}.txt"

    previous_text = ""

    if text_path.exists():
        previous_text = text_path.read_text(
            encoding="utf-8",
            errors="ignore",
        )

    digital_temp = (
        EXTRACTED_DIR
        / f"{actual_digest}.repair-digital.tmp.txt"
    )

    digital_text = digital_extract(
        pdf,
        digital_temp,
    )

    candidates = [
        ("previous", normalize(previous_text)),
        ("digital", digital_text),
    ]

    need_ocr = max(
        len(
            re.sub(
                r"\s+",
                "",
                candidate,
            )
        )
        for _, candidate in candidates
    ) < MIN_VALID_TEXT

    ocr_text = ""

    if need_ocr:
        print(
            f"  Running OCR for first "
            f"{OCR_MAX_PAGES} pages...",
            flush=True,
        )

        ocr_text = ocr_extract(
            pdf,
            EXTRACTED_DIR / f".repair-ocr-{actual_digest}",
        )

        candidates.append(
            ("ocr", ocr_text)
        )

    source, best_text = max(
        candidates,
        key=lambda item: len(
            re.sub(r"\s+", "", item[1])
        ),
    )

    text_path.write_text(
        best_text,
        encoding="utf-8",
    )

    state = {}

    if state_path.exists():
        try:
            state = json.loads(
                state_path.read_text(encoding="utf-8")
            )
        except Exception:
            state = {}

    state.update(
        {
            "sha256": actual_digest,
            "filename": filename,
            "textLength": len(best_text),
            "searchable": (
                len(
                    re.sub(
                        r"\s+",
                        "",
                        best_text,
                    )
                )
                >= MIN_VALID_TEXT
            ),
            "ocrUsed": (
                source == "ocr"
                or bool(
                    state.get("ocrUsed", False)
                )
            ),
            "qualityRepairSource": source,
        }
    )

    state_path.write_text(
        json.dumps(
            state,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    results.append(
        {
            "filename": filename,
            "sha256": actual_digest,
            "status": "repaired",
            "selectedSource": source,
            "previousLength": len(previous_text),
            "digitalLength": len(digital_text),
            "ocrLength": len(ocr_text),
            "finalLength": len(best_text),
            "searchable": state["searchable"],
        }
    )

    print(
        f"  selected={source}; "
        f"finalLength={len(best_text)}; "
        f"searchable={state['searchable']}",
        flush=True,
    )


output = (
    ROOT
    / "artifacts/super-library/live-verification/"
    / "quality-repair-results.json"
)

output.parent.mkdir(parents=True, exist_ok=True)

output.write_text(
    json.dumps(
        results,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

print(
    "SUMMARY="
    + json.dumps(
        {
            "warningsReceived": len(warnings),
            "repaired": sum(
                1
                for item in results
                if item["status"] == "repaired"
            ),
            "pdfNotFound": sum(
                1
                for item in results
                if item["status"] == "pdf-not-found"
            ),
            "searchableAfterRepair": sum(
                1
                for item in results
                if item.get("searchable") is True
            ),
        },
        ensure_ascii=False,
    )
)
