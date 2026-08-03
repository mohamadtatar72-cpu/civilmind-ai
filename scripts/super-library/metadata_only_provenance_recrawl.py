from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import (
    parse_qsl,
    quote,
    urlencode,
    urljoin,
    urlparse,
    urlunparse,
)
from urllib.request import Request, urlopen

import csv
import hashlib
import http.client
import json
import os
import re
import ssl
import time

ROOT = Path.cwd()

STATE_DIR = ROOT / "imports/super-library/state"
PDF_DIR = ROOT / "imports/super-library/files"
CATALOG_PATH = ROOT / "public/super-library/catalog.json"

WORK_DIR = ROOT / "imports/super-library/provenance-recrawl"
CHECKPOINT_PATH = WORK_DIR / "checkpoint.json"
DISCOVERED_PATH = WORK_DIR / "discovered-urls.csv"
MATCHES_PATH = WORK_DIR / "deterministic-matches.csv"

REPORT_DIR = ROOT / "artifacts/super-library/provenance-recrawl"
REPORT_JSON = REPORT_DIR / "provenance-recrawl.json"
REPORT_MD = REPORT_DIR / "PROVENANCE_RECRAWL.md"

MAX_PAGES_PER_DOMAIN = int(
    os.environ.get("MAX_PAGES_PER_DOMAIN", "600")
)

MAX_DEPTH = int(
    os.environ.get("MAX_DEPTH", "3")
)

REQUEST_DELAY = float(
    os.environ.get("REQUEST_DELAY", "1.2")
)

REQUEST_TIMEOUT = int(
    os.environ.get("REQUEST_TIMEOUT", "20")
)

OFFICIAL_SOURCES = {
    "inbr.ir": {
        "name": "دفتر مقررات ملی و کنترل ساختمان",
        "seeds": [
            "https://inbr.ir/",
        ],
    },
    "bhrc.ac.ir": {
        "name": "مرکز تحقیقات راه، مسکن و شهرسازی",
        "seeds": [
            "https://www.bhrc.ac.ir/",
            "https://bhrc.ac.ir/",
        ],
    },
    "irceo.ir": {
        "name": "سازمان نظام مهندسی ساختمان",
        "seeds": [
            "https://irceo.ir/",
            "https://www.irceo.ir/",
        ],
    },
    "qavanin.ir": {
        "name": "سامانه قوانین و مقررات",
        "seeds": [
            "https://qavanin.ir/",
        ],
    },
    "mporg.ir": {
        "name": "سازمان برنامه و بودجه کشور",
        "seeds": [
            "https://www.mporg.ir/",
            "https://mporg.ir/",
        ],
    },
    "mrud.ir": {
        "name": "وزارت راه و شهرسازی",
        "seeds": [
            "https://www.mrud.ir/",
            "https://mrud.ir/",
        ],
    },
}

PDF_HINTS = (
    ".pdf",
    "/download",
    "download=",
    "attachment",
    "file=",
    "document",
    "pdf",
)

SKIP_EXTENSIONS = (
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".css",
    ".js",
    ".woff",
    ".woff2",
    ".ttf",
    ".mp4",
    ".mp3",
    ".zip",
    ".rar",
)

WORK_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        if tag.lower() not in {"a", "iframe", "embed"}:
            return

        for key, value in attrs:
            if (
                key.lower() in {"href", "src"}
                and value
            ):
                self.links.append(value)


def canonicalize(url: str) -> str:
    """
    Convert every URL to an ASCII-safe deterministic form.

    Persian and other Unicode characters in paths are percent-encoded.
    Unicode hostnames are converted to IDNA/Punycode.
    Existing percent escapes are preserved to avoid double encoding.
    """

    if not isinstance(url, str):
        return ""

    url = url.strip()

    if not url:
        return ""

    try:
        parsed = urlparse(url)
    except ValueError:
        return ""

    if parsed.scheme.lower() not in {"http", "https"}:
        return ""

    raw_host = (
        parsed.hostname
        or ""
    ).strip().lower()

    if not raw_host:
        return ""

    try:
        host = raw_host.encode(
            "idna"
        ).decode("ascii")
    except UnicodeError:
        return ""

    host = host.removeprefix("www.")

    try:
        port = parsed.port
    except ValueError:
        return ""

    netloc = host

    if port and not (
        parsed.scheme.lower() == "http"
        and port == 80
    ) and not (
        parsed.scheme.lower() == "https"
        and port == 443
    ):
        netloc = f"{host}:{port}"

    raw_path = re.sub(
        r"/{2,}",
        "/",
        parsed.path or "/",
    )

    # % داخل safe نگه داشته می‌شود تا URLهای از قبل Encodeشده
    # دوباره Encode نشوند.
    path = quote(
        raw_path,
        safe="/:@!$&'()*+,;=-._~%",
        encoding="utf-8",
        errors="strict",
    )

    try:
        query_pairs = sorted(
            (
                key,
                value,
            )
            for key, value in parse_qsl(
                parsed.query,
                keep_blank_values=True,
                encoding="utf-8",
                errors="replace",
            )
            if not key.lower().startswith(
                (
                    "utm_",
                    "fbclid",
                    "gclid",
                )
            )
        )

        query = urlencode(
            query_pairs,
            doseq=True,
            encoding="utf-8",
            errors="strict",
            safe="/:@!$'()*+,;=-._~%",
        )
    except (UnicodeError, ValueError):
        return ""

    normalized = urlunparse(
        (
            parsed.scheme.lower(),
            netloc,
            path,
            "",
            query,
            "",
        )
    )

    try:
        normalized.encode("ascii")
    except UnicodeEncodeError:
        return ""

    return normalized

def host_of(url: str) -> str:
    return (
        urlparse(url).hostname
        or ""
    ).lower().removeprefix("www.")


def allowed_domain(url: str, domain: str) -> bool:
    host = host_of(url)

    return host == domain or host.endswith("." + domain)


def sha_prefix(url: str) -> str:
    return hashlib.sha256(
        url.encode("utf-8")
    ).hexdigest()[:18]


def request_url(url: str) -> tuple[
    int,
    str,
    bytes,
    str,
]:
    url = canonicalize(url)

    if not url:
        raise ValueError(
            "URL is empty or cannot be converted to an ASCII-safe form."
        )

    request = Request(
        url,
        headers={
            "User-Agent": (
                "CivilMindAI-ProvenanceBot/1.0 "
                "(metadata-only; no PDF download)"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,"
                "application/pdf;q=0.1,*/*;q=0.01"
            ),
        },
        method="GET",
    )

    context = ssl.create_default_context()

    with urlopen(
        request,
        timeout=REQUEST_TIMEOUT,
        context=context,
    ) as response:
        status = getattr(response, "status", 200)
        content_type = (
            response.headers.get("Content-Type", "")
            .split(";", 1)[0]
            .strip()
            .lower()
        )

        final_url = canonicalize(
            response.geturl()
        )

        # برای PDF فقط Header و ابتدای بسیار کوچک خوانده می‌شود.
        if content_type == "application/pdf":
            body = response.read(64)
        else:
            body = response.read(2_000_000)

        return status, content_type, body, final_url


def looks_like_pdf_url(
    url: str,
    content_type: str = "",
) -> bool:
    lowered = url.lower()

    if content_type == "application/pdf":
        return True

    return any(
        hint in lowered
        for hint in PDF_HINTS
    )


def load_known_prefixes() -> dict[str, list[dict]]:
    state_by_sha: dict[str, dict] = {}

    for state_path in STATE_DIR.glob("*.json"):
        try:
            state = json.loads(
                state_path.read_text(encoding="utf-8")
            )
        except Exception:
            continue

        digest = (
            state.get("sha256")
            or state_path.stem
        )

        state_by_sha[digest] = state

    catalog = json.loads(
        CATALOG_PATH.read_text(encoding="utf-8")
    )

    output: dict[str, list[dict]] = defaultdict(list)

    for resource in catalog:
        is_internal = (
            resource.get("resourceKind")
            == "internal-document"
            or resource.get("license")
            == "official-public"
        )

        if not is_internal:
            continue

        state = state_by_sha.get(
            resource.get("sha256") or "",
            {},
        )

        filename = state.get("filename") or ""

        match = re.match(
            r"^official-([a-f0-9]{18})-",
            filename,
            flags=re.IGNORECASE,
        )

        if not match:
            continue

        output[match.group(1).lower()].append(
            {
                "slug": resource.get("slug"),
                "title": (
                    resource.get("displayTitle")
                    or resource.get("title")
                ),
                "filename": filename,
                "sha256": resource.get("sha256"),
            }
        )

    return output


known_prefixes = load_known_prefixes()

if not known_prefixes:
    raise SystemExit(
        "No URL prefixes were found in existing filenames."
    )

checkpoint = {
    "visited": [],
    "queues": {},
}

if CHECKPOINT_PATH.exists():
    try:
        checkpoint = json.loads(
            CHECKPOINT_PATH.read_text(encoding="utf-8")
        )
    except Exception:
        pass

visited = set(checkpoint.get("visited", []))
queues: dict[str, deque[tuple[str, int]]] = {}

for domain, config in OFFICIAL_SOURCES.items():
    saved = checkpoint.get("queues", {}).get(domain)

    if saved:
        queues[domain] = deque(
            (item["url"], int(item["depth"]))
            for item in saved
        )
    else:
        queues[domain] = deque(
            (canonicalize(seed), 0)
            for seed in config["seeds"]
        )

discovered: dict[str, dict] = {}

if DISCOVERED_PATH.exists():
    with DISCOVERED_PATH.open(
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        for row in csv.DictReader(handle):
            url = (row.get("url") or "").strip()

            if url:
                discovered[url] = row


def save_state() -> None:
    CHECKPOINT_PATH.write_text(
        json.dumps(
            {
                "visited": sorted(visited),
                "queues": {
                    domain: [
                        {
                            "url": url,
                            "depth": depth,
                        }
                        for url, depth in queue
                    ]
                    for domain, queue in queues.items()
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    with DISCOVERED_PATH.open(
        "w",
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        fields = [
            "url",
            "domain",
            "source_name",
            "content_type",
            "status",
            "final_url",
            "sha_prefix",
            "matched_prefix",
            "discovered_from",
        ]

        writer = csv.DictWriter(
            handle,
            fieldnames=fields,
        )

        writer.writeheader()

        for row in sorted(
            discovered.values(),
            key=lambda item: item["url"],
        ):
            writer.writerow(row)


for domain, config in OFFICIAL_SOURCES.items():
    processed_for_domain = 0
    queue = queues[domain]

    while (
        queue
        and processed_for_domain
        < MAX_PAGES_PER_DOMAIN
    ):
        url, depth = queue.popleft()
        url = canonicalize(url)

        if not url:
            continue

        if url in visited:
            continue

        if not allowed_domain(url, domain):
            continue

        if url.lower().endswith(SKIP_EXTENSIONS):
            continue

        visited.add(url)
        processed_for_domain += 1

        try:
            status, content_type, body, final_url = (
                request_url(url)
            )
        except (
            HTTPError,
            URLError,
            TimeoutError,
            OSError,
            ValueError,
            UnicodeError,
            http.client.BadStatusLine,
            http.client.RemoteDisconnected,
            http.client.IncompleteRead,
            ConnectionResetError,
            ConnectionAbortedError,
            BrokenPipeError,
            ssl.SSLError,
        ) as exc:
            discovered[url] = {
                "url": url,
                "domain": domain,
                "source_name": config["name"],
                "content_type": "",
                "status": (
                    f"error:{type(exc).__name__}"
                ),
                "final_url": "",
                "sha_prefix": sha_prefix(url),
                "matched_prefix": (
                    "yes"
                    if sha_prefix(url) in known_prefixes
                    else "no"
                ),
                "discovered_from": "crawl",
            }

            save_state()
            time.sleep(REQUEST_DELAY)
            continue

        candidate_urls = {
            url,
            final_url,
        }

        if content_type in {
            "text/html",
            "application/xhtml+xml",
        }:
            parser = LinkParser()

            try:
                parser.feed(
                    body.decode(
                        "utf-8",
                        errors="ignore",
                    )
                )
            except Exception:
                pass

            for raw_link in parser.links:
                absolute = canonicalize(
                    urljoin(final_url or url, raw_link)
                )

                if not absolute:
                    continue

                if allowed_domain(absolute, domain):
                    candidate_urls.add(absolute)

                    if depth < MAX_DEPTH:
                        queue.append(
                            (absolute, depth + 1)
                        )

        for candidate in candidate_urls:
            candidate = canonicalize(candidate)

            if not candidate:
                continue

            candidate_prefix = sha_prefix(candidate)

            if (
                looks_like_pdf_url(
                    candidate,
                    content_type
                    if candidate == final_url
                    else "",
                )
                or candidate_prefix in known_prefixes
            ):
                discovered[candidate] = {
                    "url": candidate,
                    "domain": domain,
                    "source_name": config["name"],
                    "content_type": (
                        content_type
                        if candidate == final_url
                        else ""
                    ),
                    "status": str(status),
                    "final_url": final_url,
                    "sha_prefix": candidate_prefix,
                    "matched_prefix": (
                        "yes"
                        if candidate_prefix
                        in known_prefixes
                        else "no"
                    ),
                    "discovered_from": url,
                }

        save_state()
        time.sleep(REQUEST_DELAY)


matches_by_prefix: dict[str, list[dict]] = defaultdict(list)

for row in discovered.values():
    prefix = row.get("sha_prefix") or ""

    if prefix in known_prefixes:
        matches_by_prefix[prefix].append(row)

match_rows = []
ambiguous_rows = []

for prefix, resources in known_prefixes.items():
    urls = sorted(
        {
            item["url"]
            for item in matches_by_prefix.get(prefix, [])
        }
    )

    if len(urls) == 1:
        row = matches_by_prefix[prefix][0]

        for resource in resources:
            match_rows.append(
                {
                    **resource,
                    "prefix": prefix,
                    "source_url": urls[0],
                    "source_name": row["source_name"],
                    "domain": row["domain"],
                    "match_status": "exact-unique",
                }
            )

    elif len(urls) > 1:
        ambiguous_rows.append(
            {
                "prefix": prefix,
                "resources": resources,
                "urls": urls,
            }
        )

with MATCHES_PATH.open(
    "w",
    encoding="utf-8-sig",
    newline="",
) as handle:
    fields = [
        "slug",
        "title",
        "filename",
        "sha256",
        "prefix",
        "source_url",
        "source_name",
        "domain",
        "match_status",
    ]

    writer = csv.DictWriter(
        handle,
        fieldnames=fields,
    )

    writer.writeheader()
    writer.writerows(match_rows)


catalog = json.loads(
    CATALOG_PATH.read_text(encoding="utf-8")
)

matches_by_slug = {
    row["slug"]: row
    for row in match_rows
}

newly_published = []

for resource in catalog:
    match = matches_by_slug.get(
        resource.get("slug")
    )

    if not match:
        continue

    resource["sourceUrl"] = match["source_url"]
    resource["fileUrl"] = match["source_url"]
    resource["sourceName"] = match["source_name"]
    resource["official"] = True
    resource["provenanceStatus"] = (
        "verified-metadata-recrawl"
    )

    reasons = [
        reason
        for reason in (
            resource.get("reviewReasons")
            or []
        )
        if reason != "missing-source-url"
    ]

    resource["reviewReasons"] = reasons

    title = str(
        resource.get("displayTitle")
        or resource.get("title")
        or ""
    ).strip()

    valid_title = bool(title) and not bool(
        re.fullmatch(
            r"[0-9۰-۹\s._-]+",
            title,
        )
    ) and title != "سند نیازمند بررسی عنوان"

    can_publish = (
        bool(resource.get("searchable"))
        and valid_title
        and (
            resource.get("metadataConfidence")
            is None
            or resource.get("metadataConfidence", 0)
            >= 45
        )
    )

    if can_publish:
        resource["publicationStatus"] = "published"
        newly_published.append(
            resource.get("slug")
        )
    else:
        resource["publicationStatus"] = "needs-review"


CATALOG_PATH.write_text(
    json.dumps(
        catalog,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

published = [
    item
    for item in catalog
    if item.get("publicationStatus")
    != "needs-review"
]

published_internal = [
    item
    for item in published
    if (
        item.get("resourceKind")
        == "internal-document"
        or item.get("license")
        == "official-public"
    )
]

invalid_published = [
    item
    for item in published_internal
    if (
        not item.get("sourceUrl")
        or item.get("provenanceStatus")
        != "verified-metadata-recrawl"
        or item.get("official") is not True
    )
]

if invalid_published:
    raise SystemExit(
        "Unverified internal resources were published."
    )

summary = {
    "knownDocumentPrefixes": len(known_prefixes),
    "visitedPages": len(visited),
    "discoveredCandidateUrls": len(discovered),
    "exactUniqueMatches": len(match_rows),
    "ambiguousPrefixGroups": len(ambiguous_rows),
    "newlyPublishedInternal": len(newly_published),
    "publishedInternalTotal": len(
        published_internal
    ),
    "totalPublicResources": len(published),
    "stillNeedsReview": sum(
        1
        for item in catalog
        if item.get("publicationStatus")
        == "needs-review"
    ),
}

REPORT_JSON.write_text(
    json.dumps(
        {
            "summary": summary,
            "matches": match_rows,
            "ambiguous": ambiguous_rows,
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

REPORT_MD.write_text(
    "\n".join(
        [
            "# CivilMind AI — Metadata-only Provenance Recrawl",
            "",
            "## Summary",
            "",
            f"- Known document URL prefixes: {summary['knownDocumentPrefixes']}",
            f"- Visited official pages: {summary['visitedPages']}",
            f"- Discovered candidate URLs: {summary['discoveredCandidateUrls']}",
            f"- Exact unique URL matches: {summary['exactUniqueMatches']}",
            f"- Ambiguous prefix groups: {summary['ambiguousPrefixGroups']}",
            f"- Newly published internal documents: {summary['newlyPublishedInternal']}",
            f"- Published internal documents total: {summary['publishedInternalTotal']}",
            f"- Total public resources: {summary['totalPublicResources']}",
            f"- Resources still requiring review: {summary['stillNeedsReview']}",
            "",
            "## Safety",
            "",
            "- No PDF was downloaded.",
            "- No OCR was executed.",
            "- No URL was guessed.",
            "- Only exact SHA-256 URL-prefix matches were accepted.",
            "- Ambiguous and unmatched documents remain hidden.",
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
