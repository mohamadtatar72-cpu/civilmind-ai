# Sprint 1G — Secure PDF Knowledge Ingestion Foundation

## Goal

Build the fail-closed foundation for registering, validating, processing, and retrieving PDF knowledge with citation-ready provenance.

## Scope

- PDF document registry with owner, source, checksum, lifecycle status, and immutable provenance.
- File validation policy for MIME type, extension, declared size, actual size, and safe filename normalization.
- SHA-256 deduplication before processing.
- Quarantine state for malformed, suspicious, oversized, encrypted, or unsupported files.
- Processing job registry with bounded retries and sanitized failure codes.
- Page and chunk metadata that preserve page number, source document, and character offsets.
- Citation-ready retrieval contract that never returns unattributed text.
- User and admin authorization boundaries enforced in Convex.
- Audit events for registration, quarantine, approval, processing, failure, and deletion requests.

## Non-goals

- No paid vector database.
- No production OCR provider.
- No automatic publication of newly ingested content.
- No remote URL ingestion supplied by arbitrary clients.
- No API keys, billing activation, or external account changes.
- No destructive deletion of production documents.

## Security invariants

1. Every chunk must reference an existing document and page.
2. Retrieval results must include document id, title, page number, and checksum lineage.
3. Quarantined documents cannot enter the retrieval index.
4. Client-provided role, ownership, processing state, and checksum are not trusted.
5. Raw file bytes are handled only through controlled storage references; logs contain metadata and sanitized error codes only.
6. Retry counts, chunk counts, page counts, and extracted text sizes are bounded.
7. Deletion is modeled as a reviewable request until a later production operations sprint.

## Planned implementation areas

- `convex/schema.ts`
- `convex/pdfDocuments.ts`
- `convex/pdfIngestion.ts`
- `convex/lib/pdfSecurity.ts`
- `convex/lib/pdfRetrievalPolicy.ts`
- PDF library UI and admin review surface
- Architecture and threat-model documentation

## Quality gate

The sprint is mergeable only after:

- Convex validation/codegen
- Generated API consistency
- ESLint
- TypeScript
- Production build
