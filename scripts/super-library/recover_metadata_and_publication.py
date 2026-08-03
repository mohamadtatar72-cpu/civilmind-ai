from __future__ import annotations

from collections import Counter
from pathlib import Path
import json
import re
import unicodedata

ROOT = Path.cwd()

CATALOG_PATH = ROOT / "public/super-library/catalog.json"
CHUNKS_PATH = ROOT / "public/super-library/chunks.json"

REPORT_PATH = (
    ROOT
    / "artifacts/super-library/content-qa/"
    / "CONTENT_QA_REPORT.md"
)

QA_JSON_PATH = (
    ROOT
    / "artifacts/super-library/content-qa/"
    / "content-qa.json"
)

REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)


GENERIC_TITLES = {
    "binder",
    "binder1",
    "binder2",
    "document",
    "documents",
    "report",
    "report 9501",
    "scan",
    "scanned document",
    "file",
    "pdf",
    "book",
    "untitled",
    "unknown",
    "test",
    "sample",
}

PERSIAN_GENERIC_TITLES = {
    "سند",
    "مدرک",
    "فایل",
    "گزارش",
    "بدون عنوان",
    "نامشخص",
    "نمونه",
    "تست",
}

CATEGORY_RULES = [
    (
        "مقررات ملی ساختمان",
        [
            "مبحث اول",
            "مبحث دوم",
            "مبحث سوم",
            "مبحث چهارم",
            "مبحث پنجم",
            "مبحث ششم",
            "مبحث هفتم",
            "مبحث هشتم",
            "مبحث نهم",
            "مبحث دهم",
            "مبحث یازدهم",
            "مبحث دوازدهم",
            "مبحث سیزدهم",
            "مبحث چهاردهم",
            "مبحث پانزدهم",
            "مبحث شانزدهم",
            "مبحث هفدهم",
            "مبحث هجدهم",
            "مبحث نوزدهم",
            "مبحث بیستم",
            "مبحث بیست و یکم",
            "مبحث بیست و دوم",
            "مقررات ملی ساختمان",
        ],
    ),
    (
        "قوانین و نظام مهندسی",
        [
            "قانون نظام مهندسی",
            "نظام مهندسی و کنترل ساختمان",
            "آیین نامه اجرایی قانون",
            "شورای مرکزی نظام مهندسی",
            "سازمان نظام مهندسی",
        ],
    ),
    (
        "راهنماهای طراحی و اجرا",
        [
            "راهنمای طراحی",
            "راهنمای اجرا",
            "ضوابط طراحی",
            "دستورالعمل طراحی",
            "دستورالعمل اجرایی",
            "اجزای غیر سازه ای",
            "اجزای غیرسازه ای",
        ],
    ),
    (
        "آزمون نظام مهندسی",
        [
            "آزمون ورود به حرفه",
            "آزمون نظام مهندسی",
            "دفترچه سوالات",
            "کلید سوالات",
            "پاسخنامه",
            "نتایج آزمون",
        ],
    ),
    (
        "نشریات و دستورالعمل‌ها",
        [
            "نشریه",
            "دستورالعمل",
            "بخشنامه",
            "ضابطه",
            "آیین نامه",
            "آیین‌نامه",
        ],
    ),
    (
        "سازه و زلزله",
        [
            "زلزله",
            "استاندارد 2800",
            "استاندارد ۲۸۰۰",
            "سازه",
            "فولاد",
            "بتن",
            "بارگذاری",
        ],
    ),
    (
        "راه، خاک و ژئوتکنیک",
        [
            "ژئوتکنیک",
            "خاک",
            "پی سازی",
            "پی‌سازی",
            "راهسازی",
            "راه سازی",
            "روسازی",
        ],
    ),
]


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "")
    value = value.replace("\u200c", " ")
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def compact(value: str) -> str:
    value = normalize(value).lower()
    value = re.sub(r"[^\w\u0600-\u06ff]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def is_numeric_title(title: str) -> bool:
    cleaned = re.sub(r"[\s\-_.]+", "", title)

    if not cleaned:
        return True

    return bool(
        re.fullmatch(
            r"[0-9۰-۹]+",
            cleaned,
        )
    )


def is_low_quality_title(title: str) -> bool:
    value = compact(title)

    if not value:
        return True

    if is_numeric_title(value):
        return True

    if value in GENERIC_TITLES:
        return True

    if value in PERSIAN_GENERIC_TITLES:
        return True

    if re.fullmatch(
        r"(report|binder|document|scan|file|pdf)\s*[0-9۰-۹_-]*",
        value,
    ):
        return True

    if len(value) <= 2:
        return True

    if re.fullmatch(
        r"[a-z]\s*[0-9۰-۹_-]+",
        value,
    ):
        return True

    return False


def clean_candidate(value: str) -> str:
    value = normalize(value)

    value = re.sub(
        r"^\s*(بسم الله الرحمن الرحیم|بسمه تعالی)\s*$",
        "",
        value,
        flags=re.IGNORECASE,
    ).strip()

    value = re.sub(
        r"\s+",
        " ",
        value,
    ).strip(" -–—_|")

    return value


def candidate_score(value: str) -> int:
    value = clean_candidate(value)

    if not value:
        return -100

    if is_low_quality_title(value):
        return -80

    score = 0

    if 12 <= len(value) <= 130:
        score += 35
    elif 6 <= len(value) <= 180:
        score += 15
    else:
        score -= 20

    keywords = [
        "مبحث",
        "قانون",
        "آیین نامه",
        "آیین‌نامه",
        "راهنما",
        "ضوابط",
        "دستورالعمل",
        "استاندارد",
        "نشریه",
        "آزمون",
        "طراحی",
        "اجرا",
        "ساختمان",
        "مهندسی",
        "سازه",
        "زلزله",
    ]

    for keyword in keywords:
        if keyword in value:
            score += 12

    if re.search(
        r"[آ-ی]",
        value,
    ):
        score += 12

    if re.search(
        r"(صفحه|شماره صفحه|فهرست مطالب)",
        value,
    ):
        score -= 25

    if value.count(" ") < 1:
        score -= 12

    if len(set(value)) < 5:
        score -= 25

    return score


def recover_title(
    current_title: str,
    text: str,
) -> tuple[str, int, str]:
    current = clean_candidate(current_title)

    if not is_low_quality_title(current):
        return current, 90, "existing-title"

    candidates = []

    first_text = normalize(text)[:8000]

    for line in first_text.splitlines()[:80]:
        candidate = clean_candidate(line)

        if not candidate:
            continue

        if len(candidate) > 180:
            continue

        candidates.append(candidate)

    candidates = list(dict.fromkeys(candidates))

    ranked = sorted(
        (
            (candidate_score(item), item)
            for item in candidates
        ),
        reverse=True,
    )

    if ranked and ranked[0][0] >= 20:
        return ranked[0][1], min(ranked[0][0], 85), "extracted-text"

    return (
        "سند نیازمند بررسی عنوان",
        10,
        "unresolved",
    )


def detect_category(title: str, text: str) -> str:
    haystack = compact(
        f"{title} {text[:10000]}"
    )

    for category, terms in CATEGORY_RULES:
        if any(
            compact(term) in haystack
            for term in terms
        ):
            return category

    return "سایر اسناد مهندسی"


def create_summary(
    title: str,
    category: str,
    text: str,
    source_name: str,
) -> str:
    if category == "وب‌سایت‌های مرجع":
        return (
            f"دسترسی مستقیم به {source_name or title}. "
            "محتوا در وب‌سایت اصلی منتشر می‌شود."
        )

    paragraphs = [
        normalize(item)
        for item in normalize(text).split("\n")
        if len(normalize(item)) >= 80
    ]

    for paragraph in paragraphs[:20]:
        if (
            "فهرست مطالب" in paragraph
            or "تمام حقوق محفوظ" in paragraph
        ):
            continue

        excerpt = paragraph[:260].strip()

        if len(excerpt) >= 80:
            return excerpt + (
                "…" if len(paragraph) > 260 else ""
            )

    return (
        f"{title} در دسته «{category}». "
        "متن سند برای جست‌وجو و استناد داخلی پردازش شده است."
    )


catalog = json.loads(
    CATALOG_PATH.read_text(encoding="utf-8")
)

chunks = json.loads(
    CHUNKS_PATH.read_text(encoding="utf-8")
)

chunks_by_slug: dict[str, list[dict]] = {}

for chunk in chunks:
    chunks_by_slug.setdefault(
        chunk.get("resourceSlug", ""),
        [],
    ).append(chunk)

qa_records = []
updated_catalog = []

for resource in catalog:
    slug = resource.get("slug", "")
    license_name = resource.get("license")

    related_chunks = sorted(
        chunks_by_slug.get(slug, []),
        key=lambda item: (
            item.get("page", 0),
            item.get("chunk", 0),
        ),
    )

    text = "\n".join(
        item.get("text", "")
        for item in related_chunks[:15]
    )

    if license_name == "link-only":
        display_title = clean_candidate(
            resource.get("title", "")
        )

        updated = {
            **resource,
            "title": display_title,
            "displayTitle": display_title,
            "category": "وب‌سایت‌های مرجع",
            "summary": create_summary(
                display_title,
                "وب‌سایت‌های مرجع",
                "",
                resource.get("sourceName", ""),
            ),
            "publicationStatus": "published",
            "metadataConfidence": 100,
            "reviewReasons": [],
            "resourceKind": "external-website",
        }

        updated_catalog.append(updated)

        qa_records.append(
            {
                "slug": slug,
                "originalTitle": resource.get("title"),
                "finalTitle": display_title,
                "status": "published",
                "confidence": 100,
                "reasons": [],
            }
        )

        continue

    recovered_title, confidence, title_source = recover_title(
        resource.get("title", ""),
        text,
    )

    category = detect_category(
        recovered_title,
        text,
    )

    review_reasons = []

    if confidence < 45:
        review_reasons.append("low-title-confidence")

    if recovered_title == "سند نیازمند بررسی عنوان":
        review_reasons.append("unresolved-title")

    if not resource.get("sourceUrl"):
        review_reasons.append("missing-source-url")

    if not resource.get("searchable"):
        review_reasons.append("not-searchable")

    if resource.get("pageCount", 0) <= 0:
        review_reasons.append("missing-page-count")

    publication_status = (
        "published"
        if confidence >= 45
        and resource.get("searchable")
        and recovered_title
        != "سند نیازمند بررسی عنوان"
        else "needs-review"
    )

    summary = create_summary(
        recovered_title,
        category,
        text,
        resource.get("sourceName", ""),
    )

    updated = {
        **resource,
        "title": recovered_title,
        "displayTitle": recovered_title,
        "category": category,
        "summary": summary,
        "description": summary,
        "publicationStatus": publication_status,
        "metadataConfidence": confidence,
        "reviewReasons": sorted(set(review_reasons)),
        "resourceKind": "internal-document",
        "titleSource": title_source,
    }

    updated_catalog.append(updated)

    qa_records.append(
        {
            "slug": slug,
            "originalTitle": resource.get("title"),
            "finalTitle": recovered_title,
            "status": publication_status,
            "confidence": confidence,
            "category": category,
            "reasons": sorted(set(review_reasons)),
            "titleSource": title_source,
        }
    )


updated_catalog.sort(
    key=lambda item: (
        item.get("publicationStatus") != "published",
        item.get("category", ""),
        item.get("displayTitle", ""),
    )
)

CATALOG_PATH.write_text(
    json.dumps(
        updated_catalog,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

status_counts = Counter(
    item["status"]
    for item in qa_records
)

category_counts = Counter(
    item.get("category", "بدون دسته")
    for item in qa_records
    if item["status"] == "published"
)

low_quality_after = [
    item
    for item in qa_records
    if (
        item["status"] == "published"
        and is_low_quality_title(
            item["finalTitle"]
        )
    )
]

qa_output = {
    "totalResources": len(updated_catalog),
    "published": status_counts["published"],
    "needsReview": status_counts["needs-review"],
    "publishedCategories": dict(category_counts),
    "invalidPublishedTitles": len(low_quality_after),
    "records": qa_records,
}

QA_JSON_PATH.write_text(
    json.dumps(
        qa_output,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

report_lines = [
    "# CivilMind AI — Content QA Report",
    "",
    "## Summary",
    "",
    f"- Total resources: {qa_output['totalResources']}",
    f"- Published resources: {qa_output['published']}",
    f"- Hidden pending review: {qa_output['needsReview']}",
    f"- Invalid titles still published: {qa_output['invalidPublishedTitles']}",
    "",
    "## Published categories",
    "",
]

for category, count in sorted(
    category_counts.items()
):
    report_lines.append(
        f"- {category}: {count}"
    )

report_lines.extend(
    [
        "",
        "## Publication policy",
        "",
        "- External websites are published as direct links.",
        "- Internal documents with unresolved or low-confidence titles are hidden from the public catalog.",
        "- Missing source URLs are recorded as review warnings.",
        "- No PDF or extracted text was deleted.",
        "",
        "## Documents requiring review",
        "",
    ]
)

review_items = [
    item
    for item in qa_records
    if item["status"] == "needs-review"
]

for item in review_items:
    report_lines.append(
        f"- `{item['slug']}` — "
        f"{item['originalTitle']} → "
        f"{item['finalTitle']} — "
        f"{', '.join(item['reasons'])}"
    )

REPORT_PATH.write_text(
    "\n".join(report_lines) + "\n",
    encoding="utf-8",
)

print(
    "SUMMARY="
    + json.dumps(
        {
            key: value
            for key, value in qa_output.items()
            if key != "records"
        },
        ensure_ascii=False,
    )
)
