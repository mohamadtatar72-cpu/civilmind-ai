from pathlib import Path
from urllib.parse import urlparse
import csv
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path.cwd()

IMPORT_DIR = ROOT / "imports/super-library"
IMPORT_FILES = IMPORT_DIR / "files"
MANIFEST = IMPORT_DIR / "manifest.csv"
EXISTING_EXTERNAL = ROOT / "imports/resources/external-resources.csv"

PUBLIC_DIR = ROOT / "public/super-library"
PUBLIC_FILES = PUBLIC_DIR / "files"
PUBLIC_TEXT = PUBLIC_DIR / "text"

CATALOG_PATH = PUBLIC_DIR / "catalog.json"
CHUNKS_PATH = PUBLIC_DIR / "chunks.json"
INDEX_PATH = PUBLIC_DIR / "index.json"

MAX_FILE_BYTES = int(os.environ.get("MAX_LOCAL_FILE_MB", "80")) * 1024 * 1024
MAX_OCR_PAGES = int(os.environ.get("MAX_OCR_PAGES", "500"))
CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", "1400"))
CHUNK_OVERLAP = int(os.environ.get("CHUNK_OVERLAP", "180"))

ALLOWED_LICENSES = {
    "official-public",
    "public-domain",
    "owned",
    "permission",
    "link-only",
}

OFFICIAL_DOMAINS = {
    "inbr.ir",
    "bhrc.ac.ir",
    "irceo.ir",
    "qavanin.ir",
    "mporg.ir",
    "mrud.ir",
}

SUPPORTED_LOCAL = {
    ".pdf",
    ".txt",
    ".md",
    ".csv",
    ".docx",
}

PUBLIC_FILES.mkdir(parents=True, exist_ok=True)
PUBLIC_TEXT.mkdir(parents=True, exist_ok=True)

shutil.rmtree(PUBLIC_FILES, ignore_errors=True)
shutil.rmtree(PUBLIC_TEXT, ignore_errors=True)

PUBLIC_FILES.mkdir(parents=True, exist_ok=True)
PUBLIC_TEXT.mkdir(parents=True, exist_ok=True)


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("\u200c", " ")
    value = re.sub(r"\r\n?", "\n", value)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).lower().strip()
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"[^\w\u0600-\u06ff-]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "resource"


def is_official_url(url: str) -> bool:
    try:
        host = urlparse(url).hostname or ""
    except Exception:
        return False

    host = host.lower().removeprefix("www.")
    return any(host == domain or host.endswith("." + domain) for domain in OFFICIAL_DOMAINS)


def command_exists(name: str) -> bool:
    return shutil.which(name) is not None


def run(command: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(
        command,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=check,
    )


def extract_docx(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("word/document.xml")

    root = ET.fromstring(xml)
    parts = []

    for node in root.iter():
        if node.tag.endswith("}t") and node.text:
            parts.append(node.text)

    return normalize_text("\n".join(parts))


def extract_pdf_text(path: Path, work_dir: Path) -> tuple[str, bool]:
    text_path = work_dir / "pdftotext.txt"

    if command_exists("pdftotext"):
        result = run(
            ["pdftotext", "-layout", str(path), str(text_path)],
            check=False,
        )

        if result.returncode == 0 and text_path.exists():
            text = normalize_text(text_path.read_text(errors="ignore"))

            if len(re.sub(r"\s+", "", text)) >= 200:
                return text, False

    if not (
        command_exists("pdftoppm")
        and command_exists("tesseract")
    ):
        return "", False

    info = run(["pdfinfo", str(path)], check=False)
    pages = 0

    for line in info.stdout.splitlines():
        if line.lower().startswith("pages:"):
            try:
                pages = int(line.split(":", 1)[1].strip())
            except ValueError:
                pages = 0

    if pages <= 0:
        pages = MAX_OCR_PAGES

    pages = min(pages, MAX_OCR_PAGES)

    image_prefix = work_dir / "page"

    result = run(
        [
            "pdftoppm",
            "-f",
            "1",
            "-l",
            str(pages),
            "-jpeg",
            "-r",
            "170",
            str(path),
            str(image_prefix),
        ],
        check=False,
    )

    if result.returncode != 0:
        return "", False

    page_texts = []

    for image in sorted(work_dir.glob("page-*.jpg")):
        ocr = run(
            [
                "tesseract",
                str(image),
                "stdout",
                "-l",
                "fas+eng",
                "--psm",
                "6",
            ],
            check=False,
        )

        page_texts.append(normalize_text(ocr.stdout))

    return "\f".join(page_texts), True


def extract_text(path: Path, work_dir: Path) -> tuple[str, bool]:
    suffix = path.suffix.lower()

    if suffix in {".txt", ".md", ".csv"}:
        return normalize_text(path.read_text(errors="ignore")), False

    if suffix == ".docx":
        return extract_docx(path), False

    if suffix == ".pdf":
        return extract_pdf_text(path, work_dir)

    return "", False


def split_pages(text: str) -> list[str]:
    pages = [normalize_text(page) for page in text.split("\f")]
    pages = [page for page in pages if page]

    if not pages and text:
        pages = [normalize_text(text)]

    return pages


def chunk_page(text: str) -> list[str]:
    if len(text) <= CHUNK_SIZE:
        return [text] if text else []

    chunks = []
    start = 0

    while start < len(text):
        end = min(len(text), start + CHUNK_SIZE)

        if end < len(text):
            boundary = text.rfind("\n", start, end)

            if boundary <= start + CHUNK_SIZE // 2:
                boundary = text.rfind(" ", start, end)

            if boundary > start:
                end = boundary

        chunk = normalize_text(text[start:end])

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(end - CHUNK_OVERLAP, start + 1)

    return chunks


def tokenize(value: str) -> list[str]:
    value = unicodedata.normalize("NFKC", value).lower()
    tokens = re.findall(r"[\w\u0600-\u06ff]{2,}", value)
    return sorted(set(tokens))


catalog = []
chunks = []
used_slugs = set()

if not MANIFEST.exists():
    raise SystemExit("manifest.csv not found")

with MANIFEST.open(encoding="utf-8-sig", newline="") as handle:
    reader = csv.DictReader(handle)

    for row_number, row in enumerate(reader, start=2):
        resource_id = (row.get("id") or "").strip()
        title = (row.get("title") or "").strip()
        source_url = (row.get("sourceUrl") or "").strip()
        license_name = (row.get("license") or "").strip()
        file_name = (row.get("fileName") or "").strip()

        if not resource_id and not title:
            continue

        if not resource_id or not title:
            raise SystemExit(f"manifest row {row_number}: id/title required")

        if license_name not in ALLOWED_LICENSES:
            raise SystemExit(
                f"manifest row {row_number}: invalid license {license_name}"
            )

        slug = slugify(resource_id)

        if slug in used_slugs:
            raise SystemExit(f"duplicate slug/id: {slug}")

        used_slugs.add(slug)

        local_allowed = license_name != "link-only"
        local_path = IMPORT_FILES / file_name if file_name else None

        if license_name == "link-only" and file_name:
            raise SystemExit(
                f"manifest row {row_number}: link-only cannot include fileName"
            )

        file_url = None
        extracted_text = ""
        ocr_used = False
        page_count = 0
        sha256 = None
        size_bytes = None

        if file_name:
            if not local_allowed:
                raise SystemExit(
                    f"manifest row {row_number}: local file not permitted"
                )

            if local_path is None or not local_path.exists():
                raise SystemExit(
                    f"manifest row {row_number}: missing file {file_name}"
                )

            if local_path.suffix.lower() not in SUPPORTED_LOCAL:
                raise SystemExit(
                    f"manifest row {row_number}: unsupported local type"
                )

            size_bytes = local_path.stat().st_size

            if size_bytes > MAX_FILE_BYTES:
                raise SystemExit(
                    f"manifest row {row_number}: file larger than limit"
                )

            sha256 = hashlib.sha256(local_path.read_bytes()).hexdigest()

            safe_name = f"{slug}{local_path.suffix.lower()}"
            target = PUBLIC_FILES / safe_name
            shutil.copy2(local_path, target)
            file_url = f"/super-library/files/{safe_name}"

            work_dir = PUBLIC_TEXT / f".work-{slug}"
            work_dir.mkdir(parents=True, exist_ok=True)

            extracted_text, ocr_used = extract_text(local_path, work_dir)
            shutil.rmtree(work_dir, ignore_errors=True)

            pages = split_pages(extracted_text)
            page_count = len(pages)

            text_file = PUBLIC_TEXT / f"{slug}.txt"
            text_file.write_text(extracted_text, encoding="utf-8")

            for page_number, page_text in enumerate(pages, start=1):
                for chunk_number, chunk_text in enumerate(
                    chunk_page(page_text),
                    start=1,
                ):
                    chunk_id = f"{slug}-p{page_number}-c{chunk_number}"

                    chunks.append(
                        {
                            "id": chunk_id,
                            "resourceId": resource_id,
                            "resourceSlug": slug,
                            "title": title,
                            "page": page_number,
                            "chunk": chunk_number,
                            "text": chunk_text,
                            "sourceUrl": source_url or file_url,
                            "edition": (row.get("edition") or "").strip() or None,
                        }
                    )

        tags = [
            tag.strip()
            for tag in (row.get("tags") or "").split("|")
            if tag.strip()
        ]

        catalog.append(
            {
                "id": resource_id,
                "slug": slug,
                "title": title,
                "category": (row.get("category") or "سایر").strip(),
                "sourceName": (
                    row.get("sourceName") or "منبع اصلی"
                ).strip(),
                "sourceUrl": source_url or None,
                "fileUrl": file_url,
                "edition": (row.get("edition") or "").strip() or None,
                "publishedAt": (
                    row.get("publishedAt") or ""
                ).strip() or None,
                "documentType": (
                    row.get("documentType") or "resource"
                ).strip(),
                "license": license_name,
                "tags": tags,
                "description": (
                    row.get("description") or ""
                ).strip(),
                "official": is_official_url(source_url),
                "downloadable": bool(file_url),
                "searchable": bool(extracted_text),
                "ocrUsed": ocr_used,
                "pageCount": page_count,
                "sizeBytes": size_bytes,
                "sha256": sha256,
            }
        )


if EXISTING_EXTERNAL.exists():
    with EXISTING_EXTERNAL.open(
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        reader = csv.DictReader(handle)

        for number, row in enumerate(reader, start=1):
            title = (row.get("title") or "").strip()
            source_url = (row.get("sourceUrl") or "").strip()

            if not title or not source_url:
                continue

            resource_id = (
                "external-"
                + hashlib.sha256(source_url.encode()).hexdigest()[:16]
            )
            slug = slugify(resource_id)

            if slug in used_slugs:
                continue

            used_slugs.add(slug)

            catalog.append(
                {
                    "id": resource_id,
                    "slug": slug,
                    "title": title,
                    "category": (
                        row.get("category") or "منابع آنلاین"
                    ).strip(),
                    "sourceName": (
                        row.get("sourceName") or "منبع اصلی"
                    ).strip(),
                    "sourceUrl": source_url,
                    "fileUrl": None,
                    "edition": (
                        row.get("edition") or ""
                    ).strip() or None,
                    "publishedAt": None,
                    "documentType": "external",
                    "license": "link-only",
                    "tags": [
                        tag.strip()
                        for tag in (row.get("tags") or "").split("|")
                        if tag.strip()
                    ],
                    "description": (
                        row.get("description") or ""
                    ).strip(),
                    "official": is_official_url(source_url),
                    "downloadable": False,
                    "searchable": False,
                    "ocrUsed": False,
                    "pageCount": 0,
                    "sizeBytes": None,
                    "sha256": None,
                }
            )


catalog.sort(key=lambda item: (item["category"], item["title"]))

inverted_index: dict[str, list[str]] = {}

for chunk in chunks:
    searchable = " ".join(
        [
            chunk["title"],
            chunk["text"],
            chunk.get("edition") or "",
        ]
    )

    for token in tokenize(searchable):
        inverted_index.setdefault(token, []).append(chunk["id"])

for token in inverted_index:
    inverted_index[token] = sorted(set(inverted_index[token]))

PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

CATALOG_PATH.write_text(
    json.dumps(catalog, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

CHUNKS_PATH.write_text(
    json.dumps(chunks, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

INDEX_PATH.write_text(
    json.dumps(inverted_index, ensure_ascii=False),
    encoding="utf-8",
)

print(
    json.dumps(
        {
            "resources": len(catalog),
            "localResources": sum(
                1 for item in catalog if item["downloadable"]
            ),
            "searchableResources": sum(
                1 for item in catalog if item["searchable"]
            ),
            "chunks": len(chunks),
            "tokens": len(inverted_index),
        },
        ensure_ascii=False,
    )
)
