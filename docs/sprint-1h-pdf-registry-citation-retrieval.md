# Sprint 1H — PDF Registry, Processing Ledger & Citation Retrieval

## Goal

Implement the persistent, authorization-aware PDF knowledge layer on top of the fail-closed ingestion policy delivered in Sprint 1G.

## Scope

- PDF document registry with immutable checksum lineage and lifecycle status.
- Processing ledger with bounded retries and sanitized failure codes.
- Page and chunk persistence with document and page provenance.
- SHA-256 deduplication before processing.
- Owner, premium, public, and admin access boundaries enforced in Convex.
- Quarantine review actions restricted to admins.
- Citation-only retrieval results containing document id, title, page number, checksum, and chunk metadata.
- Audit events for registration, duplicate detection, quarantine, approval, processing, failure, and deletion requests.

## Safety boundaries

- No paid OCR or vector provider.
- No external API key or billing activation.
- No client-supplied arbitrary URL ingestion.
- No automatic publication.
- No destructive production deletion.
- Raw file bytes never enter logs or audit metadata.

## Quality gate

The sprint is mergeable only after Convex validation/codegen, generated API consistency, ESLint, TypeScript, and production build all pass.