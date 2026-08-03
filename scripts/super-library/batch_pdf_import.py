from __future__ import annotations

from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
import unicodedata

ROOT = Path.cwd()

PDF_DIR = ROOT / "imports/super-library/files"
STATE_DIR = ROOT / "imports/super-library/state"
EXTRACTED_DIR = ROOT / "imports/super-library/extracted"

PUBLIC_DIR = ROOT / "public/super-library"
CATALOG_PATH = PUBLIC_DIR / "catalog.json"
CHUNKS_PATH = PUBLIC_DIR / "chunks.json"
INDEX_PATH = PUBLIC_DIR / "index.json"

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "5"))
OCR_MAX_PAGES = int(os.environ.get("OCR_MAX_PAGES", "8"))
OCR_DPI = int(os.environ.get("OCR_DPI", "110"))
CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", "1400"))
CHUNK_OVERLAP = int(os.environ.get("CHUNK_OVERLAP", "180"))

STATE_DIR.mkdir(parents=True, exist_ok=True)
EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)


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


def clean_title(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(
        r"^official-[a-f0-9]{18}-",
        "",
        stem,
        flags=re.IGNORECASE,
    )
    stem = re.sub(r"[_\-]+", " ", stem)
    return re.sub(r"\s+", " ", stem).strip() or "سند رسمی"


def page_count(path: Path) -> int:
    result = run(["pdfinfo", str(path)])

    for line in result.stdout.splitlines():
        if line.lower().startswith("pages:"):
            try:
                return int(line.split(":", 1)[1].strip())
            except ValueError:
                return 0

    return 0


def digital_extract(path: Path, destination: Path) -> str:
    result = run([
        "pdftotext",
        "-layout",
        str(path),
        str(destination),
    ])

    if result.returncode != 0 or not destination.exists():
        return ""

    return normalize(
        destination.read_text(
            encoding="utf-8",
            errors="ignore",
        )
    )


def limited_ocr(path: Path, work_dir: Path) -> str:
    work_dir.mkdir(parents=True, exist_ok=True)

    result = run([
        "pdftoppm",
        "-f", "1",
        "-l", str(OCR_MAX_PAGES),
        "-jpeg",
        "-r", str(OCR_DPI),
        str(path),
        str(work_dir / "page"),
    ])

    if result.returncode != 0:
        shutil.rmtree(work_dir, ignore_errors=True)
        return ""

    pages = []

    for image in sorted(work_dir.glob("page-*.jpg")):
        result = run([
            "tesseract",
            str(image),
            "stdout",
            "-l",
            "fas+eng",
            "--psm",
            "6",
        ])

        if result.returncode == 0:
            text = normalize(result.stdout)

            if text:
                pages.append(text)

        image.unlink(missing_ok=True)

    shutil.rmtree(work_dir, ignore_errors=True)

    return "\f".join(pages)


def chunk_text(text: str) -> list[str]:
    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))

        if end < len(text):
            boundary = text.rfind(" ", start, end)

            if boundary > start + CHUNK_SIZE // 2:
                end = boundary

        chunk = normalize(text[start:end])

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(end - CHUNK_OVERLAP, start + 1)

    return chunks


def tokens(value: str) -> set[str]:
    value = unicodedata.normalize("NFKC", value).lower()

    return set(
        re.findall(
            r"[\w\u0600-\u06ff]{2,}",
            value,
        )
    )


pdfs = sorted(PDF_DIR.glob("*.pdf"))

pending = []

for pdf in pdfs:
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
    state_path = STATE_DIR / f"{digest}.json"

    if not state_path.exists():
        pending.append((pdf, digest))

selected = pending[:BATCH_SIZE]

print(f"Total PDFs: {len(pdfs)}")
print(f"Previously processed: {len(pdfs) - len(pending)}")
print(f"Pending: {len(pending)}")
print(f"Current batch: {len(selected)}")

for position, (pdf, digest) in enumerate(selected, start=1):
    print(
        f"[{position}/{len(selected)}] Processing: {pdf.name}",
        flush=True,
    )

    text_path = EXTRACTED_DIR / f"{digest}.txt"
    temporary = EXTRACTED_DIR / f"{digest}.tmp.txt"

    text = digital_extract(pdf, temporary)
    temporary.unlink(missing_ok=True)

    ocr_used = False

    if len(re.sub(r"\s+", "", text)) < 300:
        print(
            f"  Digital text insufficient; OCR first "
            f"{OCR_MAX_PAGES} pages.",
            flush=True,
        )

        text = limited_ocr(
            pdf,
            EXTRACTED_DIR / f".ocr-{digest}",
        )

        ocr_used = bool(text)

    text_path.write_text(text, encoding="utf-8")

    state = {
        "id": f"official-{digest[:18]}",
        "slug": f"official-{digest[:18]}",
        "filename": pdf.name,
        "title": clean_title(pdf.name),
        "sha256": digest,
        "sizeBytes": pdf.stat().st_size,
        "pageCount": page_count(pdf),
        "textLength": len(text),
        "searchable": bool(text),
        "ocrUsed": ocr_used,
        "processedAt": int(time.time()),
    }

    state_path = STATE_DIR / f"{digest}.json"

    state_path.write_text(
        json.dumps(
            state,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    time.sleep(2)


states = []

for state_path in sorted(STATE_DIR.glob("*.json")):
    try:
        states.append(
            json.loads(
                state_path.read_text(encoding="utf-8")
            )
        )
    except Exception:
        continue


existing_external = []

if CATALOG_PATH.exists():
    try:
        old_catalog = json.loads(
            CATALOG_PATH.read_text(encoding="utf-8")
        )

        existing_external = [
            item
            for item in old_catalog
            if item.get("license") == "link-only"
        ]
    except Exception:
        existing_external = []


local_catalog = []
all_chunks = []

for state in states:
    local_catalog.append({
        "id": state["id"],
        "slug": state["slug"],
        "title": state["title"],
        "category": "اسناد رسمی مهندسی",
        "sourceName": "منبع رسمی عمومی",
        "sourceUrl": None,
        "fileUrl": None,
        "edition": None,
        "publishedAt": None,
        "documentType": "official-pdf",
        "license": "official-public",
        "tags": ["رسمی", "PDF", "مهندسی عمران"],
        "description": (
            "متن استخراج‌شده از سند رسمی برای "
            "جست‌وجو و Citation داخلی."
        ),
        "official": True,
        "downloadable": False,
        "searchable": state["searchable"],
        "ocrUsed": state["ocrUsed"],
        "pageCount": state["pageCount"],
        "sizeBytes": state["sizeBytes"],
        "sha256": state["sha256"],
    })

    text_path = EXTRACTED_DIR / f"{state['sha256']}.txt"

    if not text_path.exists():
        continue

    text = text_path.read_text(
        encoding="utf-8",
        errors="ignore",
    )

    pages = [
        normalize(page)
        for page in text.split("\f")
    ]

    pages = [page for page in pages if page]

    if not pages and text:
        pages = [normalize(text)]

    for page_number, page in enumerate(pages, start=1):
        for chunk_number, chunk in enumerate(
            chunk_text(page),
            start=1,
        ):
            all_chunks.append({
                "id": (
                    f"{state['slug']}-"
                    f"p{page_number}-"
                    f"c{chunk_number}"
                ),
                "resourceId": state["id"],
                "resourceSlug": state["slug"],
                "title": state["title"],
                "page": page_number,
                "chunk": chunk_number,
                "text": chunk,
                "sourceUrl": None,
                "edition": None,
            })


catalog = existing_external + local_catalog

catalog.sort(
    key=lambda item: (
        item.get("category", ""),
        item.get("title", ""),
    )
)

inverted_index: dict[str, list[str]] = {}

for chunk in all_chunks:
    searchable = f"{chunk['title']} {chunk['text']}"

    for token in tokens(searchable):
        inverted_index.setdefault(token, []).append(chunk["id"])

for token in inverted_index:
    inverted_index[token] = sorted(
        set(inverted_index[token])
    )


CATALOG_PATH.write_text(
    json.dumps(
        catalog,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

CHUNKS_PATH.write_text(
    json.dumps(
        all_chunks,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

INDEX_PATH.write_text(
    json.dumps(
        inverted_index,
        ensure_ascii=False,
    ),
    encoding="utf-8",
)

summary = {
    "totalPdfs": len(pdfs),
    "processedPdfs": len(states),
    "remainingPdfs": max(len(pdfs) - len(states), 0),
    "batchProcessed": len(selected),
    "searchableDocuments": sum(
        1 for item in states
        if item.get("searchable")
    ),
    "ocrDocuments": sum(
        1 for item in states
        if item.get("ocrUsed")
    ),
    "citationChunks": len(all_chunks),
    "indexTokens": len(inverted_index),
}

print(
    "SUMMARY="
    + json.dumps(
        summary,
        ensure_ascii=False,
    ),
    flush=True,
)
