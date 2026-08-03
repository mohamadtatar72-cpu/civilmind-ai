# CivilMind AI — Crawl Report Recovery Blocker

## Status

The original crawl report required for deterministic provenance recovery
was not found.

## Verified checks

- Repository current files checked.
- Git history checked.
- Temporary files and prior execution logs checked.
- Home and Codespaces files checked.
- CSV, JSON and text manifests checked.

## Safety decision

The 127 internal documents remain hidden.

No guessed URL, inferred source or approximate provenance was accepted.

## Required next action

Rebuild the URL-to-file mapping by re-running the official crawler in
metadata-only mode, without downloading or OCR processing the PDFs again.
