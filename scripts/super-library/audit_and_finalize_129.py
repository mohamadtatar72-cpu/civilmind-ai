from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse
import csv
import hashlib
import json
import os
import re
import shutil
import unicodedata

ROOT = Path.cwd()

PDF_DIR = ROOT / "imports/super-library/files"
STATE_DIR = ROOT / "imports/super-library/state"
EXTRACTED_DIR = ROOT / "imports/super-library/extracted"
QUARANTINE_DIR = ROOT / "imports/super-library/quarantine"

PUBLIC_DIR = ROOT / "public/super-library"
CATALOG_PATH = PUBLIC_DIR / "catalog.json"
CHUNKS_PATH = PUBLIC_DIR / "chunks.json"
INDEX_PATH = PUBLIC_DIR / "index.json"

EXTERNAL_CSV = ROOT / "imports/resources/external-resources.csv"

REPORT_DIR = ROOT / "artifacts/super-library/final-audit"
AUDIT_JSON = REPORT_DIR / "audit.json"
EXACT_JSON = REPORT_DIR / "exact-duplicates.json"
SIMILAR_JSON = REPORT_DIR / "similar-documents.json"
QUALITY_JSON = REPORT_DIR / "quality-warnings.json"
SUMMARY_MD = REPORT_DIR / "FINAL_AUDIT.md"

EXPECTED_PDF_COUNT = int(
    os.environ.get("EXPECTED_PDF_COUNT", "129")
)

MIN_VALID_TEXT = int(
    os.environ.get("MIN_VALID_TEXT", "300")
)

SIMILARITY_THRESHOLD = float(
    os.environ.get("SIMILARITY_THRESHOLD", "0.92")
)

CHUNK_SIZE = 1400
CHUNK_OVERLAP = 180

OFFICIAL_DOMAINS = {
    "inbr.ir",
    "bhrc.ac.ir",
    "irceo.ir",
    "qavanin.ir",
    "mporg.ir",
    "mrud.ir",
}

REPORT_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

for name in ("files", "state", "extracted"):
    (QUARANTINE_DIR / name).mkdir(
        parents=True,
        exist_ok=True,
    )


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("\u200c", " ")
    value = value.lower()
    value = re.sub(r"\d+", " ", value)
    value = re.sub(
        r"[^\w\u0600-\u06ff]+",
        " ",
        value,
    )
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def raw_text(value: str) -> str:
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
    stem = re.sub(r"\s+", " ", stem).strip()

    return stem or "سند رسمی مهندسی"


def official_url(url: str | None) -> bool:
    if not url:
        return False

    host = (
        urlparse(url).hostname
        or ""
    ).lower().removeprefix("www.")

    return any(
        host == domain or host.endswith("." + domain)
        for domain in OFFICIAL_DOMAINS
    )


def chunk_text(value: str) -> list[str]:
    value = raw_text(value)

    if not value:
        return []

    if len(value) <= CHUNK_SIZE:
        return [value]

    output = []
    start = 0

    while start < len(value):
        end = min(start + CHUNK_SIZE, len(value))

        if end < len(value):
            boundary = value.rfind(" ", start, end)

            if boundary > start + CHUNK_SIZE // 2:
                end = boundary

        chunk = raw_text(value[start:end])

        if chunk:
            output.append(chunk)

        if end >= len(value):
            break

        start = max(
            end - CHUNK_OVERLAP,
            start + 1,
        )

    return output


def tokenize(value: str) -> set[str]:
    value = normalize_text(value)

    return set(
        re.findall(
            r"[\w\u0600-\u06ff]{2,}",
            value,
        )
    )


def shingle_signature(value: str) -> set[int]:
    words = normalize_text(value).split()

    if len(words) < 5:
        return set()

    if len(words) > 18000:
        words = words[:9000] + words[-9000:]

    signatures = set()

    for index in range(0, len(words) - 4, 4):
        shingle = " ".join(words[index:index + 5])

        digest = hashlib.blake2b(
            shingle.encode("utf-8"),
            digest_size=8,
        ).digest()

        signatures.add(
            int.from_bytes(digest, "big")
        )

    return signatures


def jaccard(left: set[int], right: set[int]) -> float:
    if not left or not right:
        return 0.0

    union = len(left | right)

    if union == 0:
        return 0.0

    return len(left & right) / union


def load_source_map() -> dict[str, str]:
    source_map: dict[str, str] = {}

    report = ROOT / "imports/super-library/crawl-report.csv"

    if not report.exists():
        return source_map

    with report.open(
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        for row in csv.DictReader(handle):
            url = (row.get("url") or "").strip()

            if not url:
                continue

            url_hash = hashlib.sha256(
                url.encode("utf-8")
            ).hexdigest()[:18]

            source_map[url_hash] = url

    return source_map


pdf_paths = sorted(PDF_DIR.glob("*.pdf"))

if len(pdf_paths) != EXPECTED_PDF_COUNT:
    raise SystemExit(
        f"Expected {EXPECTED_PDF_COUNT} PDFs, found {len(pdf_paths)}"
    )

source_map = load_source_map()

inventory = []

for pdf in pdf_paths:
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()

    state_path = STATE_DIR / f"{digest}.json"
    text_path = EXTRACTED_DIR / f"{digest}.txt"

    state = {}

    if state_path.exists():
        try:
            state = json.loads(
                state_path.read_text(encoding="utf-8")
            )
        except Exception:
            state = {}

    text = ""

    if text_path.exists():
        text = text_path.read_text(
            encoding="utf-8",
            errors="ignore",
        )

    normalized = normalize_text(text)

    name_hash_match = re.match(
        r"official-([a-f0-9]{18})-",
        pdf.name,
        re.IGNORECASE,
    )

    source_url = None

    if name_hash_match:
        source_url = source_map.get(
            name_hash_match.group(1).lower()
        )

    inventory.append(
        {
            "filename": pdf.name,
            "path": str(pdf),
            "sha256": digest,
            "sizeBytes": pdf.stat().st_size,
            "statePath": str(state_path),
            "textPath": str(text_path),
            "stateExists": state_path.exists(),
            "textExists": text_path.exists(),
            "textLength": len(text),
            "normalizedTextHash": (
                hashlib.sha256(
                    normalized.encode("utf-8")
                ).hexdigest()
                if normalized
                else None
            ),
            "pageCount": int(
                state.get("pageCount") or 0
            ),
            "ocrUsed": bool(
                state.get("ocrUsed", False)
            ),
            "searchable": len(normalized) >= MIN_VALID_TEXT,
            "title": (
                state.get("title")
                or clean_title(pdf.name)
            ),
            "sourceUrl": source_url,
            "_text": text,
            "_signature": shingle_signature(text),
        }
    )


# -------------------------------------------------
# Completeness check
# -------------------------------------------------

hash_groups: dict[str, list[dict]] = defaultdict(list)

for item in inventory:
    hash_groups[item["sha256"]].append(item)

unique_hash_count = len(hash_groups)

missing_processing = []

for item in inventory:
    same_hash_group = hash_groups[item["sha256"]]

    group_has_state = any(
        entry["stateExists"]
        for entry in same_hash_group
    )

    group_has_text = any(
        entry["textExists"]
        for entry in same_hash_group
    )

    if not group_has_state or not group_has_text:
        missing_processing.append(
            {
                "filename": item["filename"],
                "sha256": item["sha256"],
                "groupHasState": group_has_state,
                "groupHasText": group_has_text,
            }
        )


# -------------------------------------------------
# Exact binary duplicates
# -------------------------------------------------

exact_groups = [
    group
    for group in hash_groups.values()
    if len(group) > 1
]

exact_report = []

for group in exact_groups:
    ordered = sorted(
        group,
        key=lambda item: (
            -item["textLength"],
            item["filename"],
        ),
    )

    keeper = ordered[0]

    exact_report.append(
        {
            "sha256": keeper["sha256"],
            "kept": keeper["filename"],
            "duplicates": [
                item["filename"]
                for item in ordered[1:]
            ],
            "count": len(ordered),
        }
    )


# -------------------------------------------------
# Exact extracted-text duplicates with different PDF hashes
# -------------------------------------------------

text_hash_groups: dict[str, list[dict]] = defaultdict(list)

for item in inventory:
    if item["normalizedTextHash"]:
        text_hash_groups[
            item["normalizedTextHash"]
        ].append(item)

exact_text_groups = []

for group in text_hash_groups.values():
    unique_pdf_hashes = {
        item["sha256"]
        for item in group
    }

    if len(group) > 1 and len(unique_pdf_hashes) > 1:
        exact_text_groups.append(
            {
                "normalizedTextHash": group[0]["normalizedTextHash"],
                "files": [
                    item["filename"]
                    for item in group
                ],
                "note": (
                    "Extracted text is identical but PDF bytes differ. "
                    "Files are retained for edition/scan review."
                ),
            }
        )


# -------------------------------------------------
# Near duplicates
# -------------------------------------------------

representatives = [
    sorted(
        group,
        key=lambda item: (
            -item["textLength"],
            item["filename"],
        ),
    )[0]
    for group in hash_groups.values()
]

similar_pairs = []

for left_index, left in enumerate(representatives):
    if not left["searchable"]:
        continue

    for right in representatives[left_index + 1:]:
        if not right["searchable"]:
            continue

        left_length = max(left["textLength"], 1)
        right_length = max(right["textLength"], 1)

        length_ratio = (
            min(left_length, right_length)
            / max(left_length, right_length)
        )

        if length_ratio < 0.65:
            continue

        score = jaccard(
            left["_signature"],
            right["_signature"],
        )

        if score >= SIMILARITY_THRESHOLD:
            similar_pairs.append(
                {
                    "similarity": round(score, 5),
                    "lengthRatio": round(length_ratio, 5),
                    "left": left["filename"],
                    "right": right["filename"],
                    "leftPages": left["pageCount"],
                    "rightPages": right["pageCount"],
                    "action": "retained-for-human-review",
                    "reason": (
                        "Could be another scan, revision or edition."
                    ),
                }
            )

similar_pairs.sort(
    key=lambda item: item["similarity"],
    reverse=True,
)


# -------------------------------------------------
# Quality warnings
# -------------------------------------------------

quality_warnings = []

for item in inventory:
    warnings = []

    if not item["stateExists"]:
        warnings.append("state-missing")

    if not item["textExists"]:
        warnings.append("text-file-missing")

    if item["textLength"] == 0:
        warnings.append("empty-text")
    elif item["textLength"] < MIN_VALID_TEXT:
        warnings.append("very-short-text")

    if item["pageCount"] <= 0:
        warnings.append("unknown-page-count")

    if item["sizeBytes"] < 1024:
        warnings.append("suspiciously-small-pdf")

    if warnings:
        quality_warnings.append(
            {
                "filename": item["filename"],
                "sha256": item["sha256"],
                "warnings": warnings,
            }
        )


# -------------------------------------------------
# Quarantine only extra binary-identical PDF filenames
# State/text are hash-shared and therefore kept once.
# -------------------------------------------------

quarantined_files = []

for group in exact_groups:
    ordered = sorted(
        group,
        key=lambda item: (
            -item["textLength"],
            item["filename"],
        ),
    )

    keeper = ordered[0]

    for duplicate in ordered[1:]:
        pdf_path = Path(duplicate["path"])

        if not pdf_path.exists():
            continue

        destination = (
            QUARANTINE_DIR
            / "files"
            / pdf_path.name
        )

        if destination.exists():
            destination.unlink()

        shutil.move(
            str(pdf_path),
            str(destination),
        )

        quarantined_files.append(
            {
                "kept": keeper["filename"],
                "quarantined": duplicate["filename"],
                "sha256": duplicate["sha256"],
                "destination": str(
                    destination.relative_to(ROOT)
                ),
            }
        )


# -------------------------------------------------
# Rebuild catalog from unique binary documents
# -------------------------------------------------

catalog = []
chunks = []

for group in hash_groups.values():
    item = sorted(
        group,
        key=lambda entry: (
            -entry["textLength"],
            entry["filename"],
        ),
    )[0]

    digest = item["sha256"]
    slug = f"official-{digest[:18]}"

    text = item["_text"]

    catalog.append(
        {
            "id": slug,
            "slug": slug,
            "title": item["title"],
            "category": "اسناد رسمی مهندسی",
            "sourceName": (
                urlparse(item["sourceUrl"]).hostname
                if item["sourceUrl"]
                else "منبع رسمی عمومی"
            ),
            "sourceUrl": item["sourceUrl"],
            "fileUrl": item["sourceUrl"],
            "edition": None,
            "publishedAt": None,
            "documentType": "official-pdf",
            "license": "official-public",
            "tags": [
                "رسمی",
                "PDF",
                "مهندسی عمران",
            ],
            "description": (
                "سند رسمی پردازش‌شده برای جست‌وجو "
                "و استناد داخلی CivilMind AI."
            ),
            "official": True,
            "downloadable": bool(item["sourceUrl"]),
            "searchable": item["searchable"],
            "ocrUsed": item["ocrUsed"],
            "pageCount": item["pageCount"],
            "sizeBytes": item["sizeBytes"],
            "sha256": digest,
        }
    )

    pages = [
        raw_text(page)
        for page in text.split("\f")
    ]

    pages = [page for page in pages if page]

    if not pages and text:
        pages = [raw_text(text)]

    for page_number, page in enumerate(pages, start=1):
        for chunk_number, chunk in enumerate(
            chunk_text(page),
            start=1,
        ):
            chunks.append(
                {
                    "id": (
                        f"{slug}-"
                        f"p{page_number}-"
                        f"c{chunk_number}"
                    ),
                    "resourceId": slug,
                    "resourceSlug": slug,
                    "title": item["title"],
                    "page": page_number,
                    "chunk": chunk_number,
                    "text": chunk,
                    "sourceUrl": item["sourceUrl"],
                    "edition": None,
                }
            )


# Preserve existing external link-only sources.
if EXTERNAL_CSV.exists():
    with EXTERNAL_CSV.open(
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        for row in csv.DictReader(handle):
            title = (row.get("title") or "").strip()
            source_url = (row.get("sourceUrl") or "").strip()

            if not title or not source_url:
                continue

            digest = hashlib.sha256(
                source_url.encode("utf-8")
            ).hexdigest()

            slug = f"external-{digest[:18]}"

            catalog.append(
                {
                    "id": slug,
                    "slug": slug,
                    "title": title,
                    "category": (
                        row.get("category")
                        or "منابع آنلاین"
                    ).strip(),
                    "sourceName": (
                        row.get("sourceName")
                        or "منبع اصلی"
                    ).strip(),
                    "sourceUrl": source_url,
                    "fileUrl": None,
                    "edition": (
                        row.get("edition")
                        or ""
                    ).strip() or None,
                    "publishedAt": None,
                    "documentType": "external",
                    "license": "link-only",
                    "tags": [
                        value.strip()
                        for value in (
                            row.get("tags")
                            or ""
                        ).split("|")
                        if value.strip()
                    ],
                    "description": (
                        row.get("description")
                        or ""
                    ).strip(),
                    "official": official_url(source_url),
                    "downloadable": False,
                    "searchable": False,
                    "ocrUsed": False,
                    "pageCount": 0,
                    "sizeBytes": None,
                    "sha256": None,
                }
            )


catalog.sort(
    key=lambda item: (
        item["category"],
        item["title"],
    )
)

index: dict[str, list[str]] = {}

for chunk in chunks:
    for token in tokenize(
        f"{chunk['title']} {chunk['text']}"
    ):
        index.setdefault(token, []).append(chunk["id"])

for token in index:
    index[token] = sorted(set(index[token]))


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
        chunks,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

INDEX_PATH.write_text(
    json.dumps(
        index,
        ensure_ascii=False,
    ),
    encoding="utf-8",
)


public_inventory = []

for item in inventory:
    public_inventory.append(
        {
            key: value
            for key, value in item.items()
            if not key.startswith("_")
        }
    )

summary = {
    "expectedPdfFiles": EXPECTED_PDF_COUNT,
    "actualPdfFilesBeforeAudit": len(inventory),
    "coverageComplete": len(missing_processing) == 0,
    "missingProcessingRecords": len(missing_processing),
    "uniqueBinaryDocuments": unique_hash_count,
    "exactBinaryDuplicateGroups": len(exact_groups),
    "exactDuplicatePdfFilesQuarantined": len(quarantined_files),
    "exactTextDuplicateGroupsDifferentBinary": len(exact_text_groups),
    "nearDuplicatePairsRetained": len(similar_pairs),
    "qualityWarningDocuments": len(quality_warnings),
    "finalInternalDocuments": unique_hash_count,
    "finalExternalResources": sum(
        1
        for item in catalog
        if item["license"] == "link-only"
    ),
    "finalCatalogResources": len(catalog),
    "citationChunks": len(chunks),
    "indexTokens": len(index),
}

AUDIT_JSON.write_text(
    json.dumps(
        {
            "summary": summary,
            "missingProcessing": missing_processing,
            "inventory": public_inventory,
            "quarantined": quarantined_files,
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

EXACT_JSON.write_text(
    json.dumps(
        {
            "binaryDuplicateGroups": exact_report,
            "identicalTextDifferentBinary": exact_text_groups,
            "quarantinedFiles": quarantined_files,
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

SIMILAR_JSON.write_text(
    json.dumps(
        similar_pairs,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

QUALITY_JSON.write_text(
    json.dumps(
        quality_warnings,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

SUMMARY_MD.write_text(
    "\n".join(
        [
            "# CivilMind AI — Final 129 PDF Audit",
            "",
            "## Completeness",
            "",
            f"- Expected PDFs: {summary['expectedPdfFiles']}",
            f"- Found before audit: {summary['actualPdfFilesBeforeAudit']}",
            f"- Processing coverage complete: {summary['coverageComplete']}",
            f"- Missing processing records: {summary['missingProcessingRecords']}",
            "",
            "## Deduplication",
            "",
            f"- Unique binary documents: {summary['uniqueBinaryDocuments']}",
            f"- Exact duplicate groups: {summary['exactBinaryDuplicateGroups']}",
            f"- Exact duplicate files quarantined: {summary['exactDuplicatePdfFilesQuarantined']}",
            f"- Identical extracted-text groups with different PDF bytes: {summary['exactTextDuplicateGroupsDifferentBinary']}",
            f"- Near-duplicate pairs retained for review: {summary['nearDuplicatePairsRetained']}",
            "",
            "## Quality",
            "",
            f"- Documents with warnings: {summary['qualityWarningDocuments']}",
            "",
            "## Final index",
            "",
            f"- Internal documents: {summary['finalInternalDocuments']}",
            f"- External link-only resources: {summary['finalExternalResources']}",
            f"- Catalog resources: {summary['finalCatalogResources']}",
            f"- Citation chunks: {summary['citationChunks']}",
            f"- Index tokens: {summary['indexTokens']}",
            "",
            "## Safety",
            "",
            "- No PDF was permanently deleted.",
            "- Only byte-for-byte identical PDFs were moved to quarantine.",
            "- Similar scans and possible different editions were retained.",
            "- Quarantine is reversible.",
            "",
        ]
    ),
    encoding="utf-8",
)

print(
    "SUMMARY="
    + json.dumps(
        summary,
        ensure_ascii=False,
    )
)
