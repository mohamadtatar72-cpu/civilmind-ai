from __future__ import annotations

from pathlib import Path
from urllib.parse import (
    urljoin,
    urlparse,
    urldefrag,
    unquote,
)
from urllib.robotparser import RobotFileParser

import csv
import hashlib
import mimetypes
import os
import re
import time

import requests
from bs4 import BeautifulSoup

ROOT = Path.cwd()

IMPORT_DIR = ROOT / "imports/super-library"
FILES_DIR = IMPORT_DIR / "files"
MANIFEST = IMPORT_DIR / "manifest.csv"
REPORT = IMPORT_DIR / "crawl-report.csv"

MAX_PDFS_PER_DOMAIN = int(
    os.environ.get("MAX_PDFS_PER_DOMAIN", "250")
)

MAX_FILE_BYTES = (
    int(os.environ.get("MAX_FILE_MB", "40"))
    * 1024
    * 1024
)

MAX_TOTAL_BYTES = (
    int(os.environ.get("MAX_TOTAL_MB", "900"))
    * 1024
    * 1024
)

MAX_DEPTH = int(
    os.environ.get("MAX_DEPTH", "4")
)

REQUEST_DELAY = float(
    os.environ.get("REQUEST_DELAY", "1.0")
)

USER_AGENT = (
    "CivilMindAI-OfficialResourceIndexer/1.0 "
    "(public official documents only)"
)

SOURCES = [
    {
        "name": "دفتر مقررات ملی و کنترل ساختمان",
        "base": "https://inbr.ir/",
        "category": "مقررات ملی ساختمان",
    },
    {
        "name": "مرکز تحقیقات راه، مسکن و شهرسازی",
        "base": "https://www.bhrc.ac.ir/",
        "category": "آیین‌نامه و پژوهش رسمی",
    },
    {
        "name": "شورای مرکزی نظام مهندسی ساختمان",
        "base": "https://irceo.ir/",
        "category": "نظام مهندسی",
    },
    {
        "name": "سامانه ملی قوانین و مقررات",
        "base": "https://qavanin.ir/",
        "category": "قوانین و مقررات",
    },
    {
        "name": "سازمان برنامه و بودجه",
        "base": "https://www.mporg.ir/",
        "category": "نشریات و فهارس بها",
    },
    {
        "name": "وزارت راه و شهرسازی",
        "base": "https://www.mrud.ir/",
        "category": "اسناد رسمی راه و شهرسازی",
    },
]

FILES_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

session = requests.Session()

session.headers.update(
    {
        "User-Agent": USER_AGENT,
        "Accept": (
            "text/html,application/xhtml+xml,"
            "application/pdf;q=0.9,*/*;q=0.7"
        ),
    }
)


def normalize_url(url: str) -> str:
    clean, _ = urldefrag(url)
    return clean.strip()


def host_of(url: str) -> str:
    return (
        urlparse(url).hostname
        or ""
    ).lower().removeprefix("www.")


def same_domain(url: str, base: str) -> bool:
    host = host_of(url)
    base_host = host_of(base)

    return (
        host == base_host
        or host.endswith("." + base_host)
    )


def sanitize_filename(value: str) -> str:
    value = unquote(value)
    value = value.split("?")[0]
    value = Path(value).name
    value = re.sub(
        r"[^\w\u0600-\u06ff.\-]+",
        "-",
        value,
    )
    value = re.sub(
        r"-+",
        "-",
        value,
    ).strip("-")

    return value or "official-resource.pdf"


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(
        r"\s+",
        "-",
        value,
    )
    value = re.sub(
        r"[^\w\u0600-\u06ff-]+",
        "-",
        value,
    )
    value = re.sub(
        r"-+",
        "-",
        value,
    ).strip("-")

    return value or "official-resource"


def robots_for(base: str) -> RobotFileParser:
    robots_url = urljoin(
        base,
        "/robots.txt",
    )

    robot = RobotFileParser()
    robot.set_url(robots_url)

    try:
        robot.read()
    except Exception:
        pass

    return robot


def is_pdf_response(
    response: requests.Response,
    url: str,
) -> bool:
    content_type = (
        response.headers
        .get("Content-Type", "")
        .lower()
    )

    return (
        "application/pdf" in content_type
        or urlparse(url).path.lower().endswith(".pdf")
    )


def title_from_pdf_url(
    url: str,
    link_text: str,
) -> str:
    text = " ".join(
        link_text.split()
    ).strip()

    if text and len(text) > 3:
        return text[:240]

    name = sanitize_filename(
        urlparse(url).path
    )

    stem = Path(name).stem
    stem = re.sub(
        r"[_\-]+",
        " ",
        stem,
    )

    return stem.strip() or "منبع رسمی"


existing_rows: dict[str, dict[str, str]] = {}

if MANIFEST.exists():
    with MANIFEST.open(
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        reader = csv.DictReader(handle)

        for row in reader:
            source_url = (
                row.get("sourceUrl")
                or ""
            ).strip()

            if source_url:
                existing_rows[
                    normalize_url(source_url)
                ] = row

manifest_fields = [
    "id",
    "title",
    "category",
    "sourceName",
    "sourceUrl",
    "edition",
    "publishedAt",
    "documentType",
    "license",
    "fileName",
    "tags",
    "description",
]

report_rows = []
new_rows = []
total_downloaded = 0

for source in SOURCES:
    base = source["base"]
    robot = robots_for(base)

    queue: list[tuple[str, int]] = [
        (base, 0)
    ]

    visited_pages: set[str] = set()
    discovered_pdfs: dict[str, str] = {}

    while queue:
        page_url, depth = queue.pop(0)
        page_url = normalize_url(page_url)

        if page_url in visited_pages:
            continue

        if depth > MAX_DEPTH:
            continue

        if not same_domain(page_url, base):
            continue

        if not robot.can_fetch(
            USER_AGENT,
            page_url,
        ):
            report_rows.append(
                {
                    "source": source["name"],
                    "url": page_url,
                    "status": "robots-denied",
                    "detail": "",
                }
            )
            continue

        visited_pages.add(page_url)

        try:
            response = session.get(
                page_url,
                timeout=25,
                allow_redirects=True,
            )

            time.sleep(REQUEST_DELAY)

        except Exception as exc:
            report_rows.append(
                {
                    "source": source["name"],
                    "url": page_url,
                    "status": "page-error",
                    "detail": str(exc),
                }
            )
            continue

        if response.status_code != 200:
            report_rows.append(
                {
                    "source": source["name"],
                    "url": page_url,
                    "status": (
                        f"page-http-{response.status_code}"
                    ),
                    "detail": "",
                }
            )
            continue

        if is_pdf_response(
            response,
            response.url,
        ):
            discovered_pdfs.setdefault(
                normalize_url(response.url),
                "",
            )
            continue

        content_type = (
            response.headers
            .get("Content-Type", "")
            .lower()
        )

        if "text/html" not in content_type:
            continue

        soup = BeautifulSoup(
            response.text,
            "lxml",
        )

        for anchor in soup.select("a[href]"):
            href = (
                anchor.get("href")
                or ""
            ).strip()

            if not href:
                continue

            absolute = normalize_url(
                urljoin(
                    response.url,
                    href,
                )
            )

            if not absolute.startswith(
                ("http://", "https://")
            ):
                continue

            link_text = anchor.get_text(
                " ",
                strip=True,
            )

            lower_path = (
                urlparse(absolute)
                .path
                .lower()
            )

            if lower_path.endswith(".pdf"):
                discovered_pdfs.setdefault(
                    absolute,
                    link_text,
                )
                continue

            if (
                same_domain(absolute, base)
                and depth < MAX_DEPTH
            ):
                queue.append(
                    (absolute, depth + 1)
                )

        if (
            len(discovered_pdfs)
            >= MAX_PDFS_PER_DOMAIN
        ):
            break

    pdf_items = list(
        discovered_pdfs.items()
    )[:MAX_PDFS_PER_DOMAIN]

    for pdf_url, link_text in pdf_items:
        pdf_url = normalize_url(pdf_url)

        if pdf_url in existing_rows:
            continue

        if not robot.can_fetch(
            USER_AGENT,
            pdf_url,
        ):
            report_rows.append(
                {
                    "source": source["name"],
                    "url": pdf_url,
                    "status": "robots-denied",
                    "detail": "",
                }
            )
            continue

        try:
            response = session.get(
                pdf_url,
                timeout=60,
                stream=True,
                allow_redirects=True,
            )

            time.sleep(REQUEST_DELAY)

        except Exception as exc:
            report_rows.append(
                {
                    "source": source["name"],
                    "url": pdf_url,
                    "status": "download-error",
                    "detail": str(exc),
                }
            )
            continue

        if response.status_code != 200:
            report_rows.append(
                {
                    "source": source["name"],
                    "url": pdf_url,
                    "status": (
                        f"download-http-{response.status_code}"
                    ),
                    "detail": "",
                }
            )
            continue

        if not is_pdf_response(
            response,
            response.url,
        ):
            report_rows.append(
                {
                    "source": source["name"],
                    "url": pdf_url,
                    "status": "not-pdf",
                    "detail": (
                        response.headers
                        .get("Content-Type", "")
                    ),
                }
            )
            continue

        length_header = (
            response.headers
            .get("Content-Length")
        )

        if length_header:
            try:
                declared_size = int(
                    length_header
                )
            except ValueError:
                declared_size = 0

            if declared_size > MAX_FILE_BYTES:
                report_rows.append(
                    {
                        "source": source["name"],
                        "url": pdf_url,
                        "status": "file-too-large",
                        "detail": str(
                            declared_size
                        ),
                    }
                )
                continue

            if (
                total_downloaded
                + declared_size
                > MAX_TOTAL_BYTES
            ):
                report_rows.append(
                    {
                        "source": source["name"],
                        "url": pdf_url,
                        "status": "total-limit",
                        "detail": str(
                            declared_size
                        ),
                    }
                )
                continue

        title = title_from_pdf_url(
            pdf_url,
            link_text,
        )

        digest = hashlib.sha256(
            pdf_url.encode("utf-8")
        ).hexdigest()

        resource_id = (
            "official-"
            + digest[:18]
        )

        filename = sanitize_filename(
            urlparse(pdf_url).path
        )

        if not filename.lower().endswith(
            ".pdf"
        ):
            filename += ".pdf"

        filename = (
            f"{slugify(resource_id)}-"
            f"{filename}"
        )

        destination = (
            FILES_DIR
            / filename
        )

        temporary = destination.with_suffix(
            ".pdf.part"
        )

        written = 0
        sha = hashlib.sha256()

        try:
            with temporary.open("wb") as output:
                for block in response.iter_content(
                    chunk_size=1024 * 256
                ):
                    if not block:
                        continue

                    written += len(block)

                    if written > MAX_FILE_BYTES:
                        raise RuntimeError(
                            "file exceeds limit"
                        )

                    if (
                        total_downloaded
                        + written
                        > MAX_TOTAL_BYTES
                    ):
                        raise RuntimeError(
                            "total download limit exceeded"
                        )

                    sha.update(block)
                    output.write(block)

            with temporary.open("rb") as check:
                header = check.read(5)

            if header != b"%PDF-":
                raise RuntimeError(
                    "invalid PDF signature"
                )

            temporary.replace(destination)
            total_downloaded += written

        except Exception as exc:
            temporary.unlink(
                missing_ok=True
            )

            report_rows.append(
                {
                    "source": source["name"],
                    "url": pdf_url,
                    "status": "rejected",
                    "detail": str(exc),
                }
            )
            continue

        row = {
            "id": resource_id,
            "title": title,
            "category": source["category"],
            "sourceName": source["name"],
            "sourceUrl": pdf_url,
            "edition": "",
            "publishedAt": "",
            "documentType": "official-pdf",
            "license": "official-public",
            "fileName": filename,
            "tags": (
                "رسمی|PDF|مهندسی عمران|"
                + source["category"]
            ),
            "description": (
                "سند عمومی بازیابی‌شده از "
                f"وب‌سایت رسمی {source['name']}."
            ),
        }

        existing_rows[pdf_url] = row
        new_rows.append(row)

        report_rows.append(
            {
                "source": source["name"],
                "url": pdf_url,
                "status": "downloaded",
                "detail": (
                    f"{written} bytes;"
                    f"sha256={sha.hexdigest()}"
                ),
            }
        )

all_rows = list(
    existing_rows.values()
)

all_rows.sort(
    key=lambda row: (
        row.get("category", ""),
        row.get("title", ""),
    )
)

with MANIFEST.open(
    "w",
    encoding="utf-8",
    newline="",
) as handle:
    writer = csv.DictWriter(
        handle,
        fieldnames=manifest_fields,
    )

    writer.writeheader()
    writer.writerows(all_rows)

with REPORT.open(
    "w",
    encoding="utf-8",
    newline="",
) as handle:
    writer = csv.DictWriter(
        handle,
        fieldnames=[
            "source",
            "url",
            "status",
            "detail",
        ],
    )

    writer.writeheader()
    writer.writerows(report_rows)

print(
    f"New official PDFs: {len(new_rows)}"
)

print(
    f"Manifest total: {len(all_rows)}"
)

print(
    "Downloaded size: "
    f"{total_downloaded / 1024 / 1024:.2f} MB"
)
