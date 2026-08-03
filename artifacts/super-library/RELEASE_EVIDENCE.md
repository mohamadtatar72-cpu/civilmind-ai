# Super Library — Four-Phase Release Evidence

## Identity

- Branch: `develop/civilmind-v2`
- Commit SHA: `7d9f04d9ba209191fdcdf85ea3f302c2d18ea45d`
- Preview: https://civilmind-ai-v2-preview-ihxgfh8vf-mohamadtatar72-cpus-projects.vercel.app
- Production: not modified

## Quality Gate

- Typecheck: passed
- Lint: passed
- Tests: 48 passed
- Failures: 0
- Production build: passed

## Routes

- `/resources`: HTTP 200
- `/api/resources/search`: HTTP 200
- `/api/resources/ask`: HTTP 401

## Ask API state

`blocked-by-vercel-deployment-protection`

The Ask API implementation exists and passed local typecheck, lint, tests and production build.

The Preview deployment is protected by Vercel Authentication. Anonymous POST verification returned HTTP 401 with the explicit `Protected deployment` response. This is an environment-access restriction, not an application build or route failure.

## Four-phase completion

- Metadata and versioning foundation: complete
- License-aware ingestion: complete
- PDF extraction foundation: complete
- Persian/English OCR fallback: complete
- Page-aware chunks: complete
- Internal indexed search: complete
- Resource detail pages: complete
- Citation-first retrieval API: complete
- No-source fail-closed behavior: complete
- Provider-missing behavior: complete

## Current data state

- External resources: 16
- Local internal resources: 0
- Searchable internal resources: 0
- Citation chunks: 0

Internal searchable content will increase after authorized official files are added to:

`imports/super-library/files/`

and registered in:

`imports/super-library/manifest.csv`
