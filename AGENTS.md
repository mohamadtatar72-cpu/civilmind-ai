# CivilMind AI — Binding Agent Instructions

This file is the highest-priority repository instruction for every coding agent, GitHub Worker, Copilot agent, Codex worker, browser agent, and automation acting on this repository.

## Command hierarchy

1. Preserve user data, secrets, authentication, and working production behavior.
2. Read and obey `docs/EXECUTION_LAWS.md`.
3. Read and obey `docs/MASTER_EXECUTION_PLAN.md`.
4. Read `docs/CHANGELOG.md` and the latest pushed commits.
5. Execute the first genuinely incomplete roadmap item from the exact current state.

## Execution, not narration

Do not answer with planning, audit-only text, “started”, “continuing”, browser status, or repeated blocker descriptions while safe work remains.

For every run, produce the maximum safe, testable project progress possible. A response is allowed only after one of these outcomes:

- meaningful code or repository work was completed and pushed;
- a real user authorization screen is waiting for approval;
- no safe independent work remains because of a genuinely external blocker.

## End-to-end requirement

A query, schema, helper, component, mock, or backend function alone is not complete. Connect the real user flow wherever possible. Run the relevant typecheck, lint, tests, and production build. Fix failures caused by the work. Commit and push completed work. Update `docs/CHANGELOG.md` with the exact continuation point.

## Zero-idle fallback

Failure, quota exhaustion, or disconnection of one tool blocks only the exact dependent task. Queue that task and continue with other frontend, backend, AI, tests, documentation, security, accessibility, performance, or architecture work. When the tool returns, complete queued verification/deployment work automatically.

## Safe Git recovery

Never discard unknown local work. Before reconciling a dirty or outdated workspace, inspect changes and preserve them with a safety branch, commit, patch, or stash. Then fetch and rebase/merge safely. Do not use destructive reset unless explicitly authorized by the owner.

## Authorization

When OAuth, login, project selection, or permission is required, open the supported authorization flow and stop only at the exact approval screen. State only the service requiring approval. Resume from the same task after approval.

## Product invariants

- Official regulations, exam booklets, official questions, initial/final keys, official descriptive answers, and discipline/qualification filtering remain free.
- Premium unlocks AI intelligence, personalization, generation, voice, document intelligence, and advanced analytics—not public official files.
- Official content, official answers, CivilMind AI analysis, inference, prediction, and AI-generated questions must be visibly distinct.
- Never fabricate citations, pages, clauses, success rates, passing probabilities, user counts, or live data.

## Persistent command

When the owner sends only `توسعه`, immediately resume from the exact incomplete point after reading this file, `docs/EXECUTION_LAWS.md`, `docs/MASTER_EXECUTION_PLAN.md`, and `docs/CHANGELOG.md`. Do not repeat completed work or ask whether to continue.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses Convex as its backend.

When working on Convex code, always read `convex/_generated/ai/guidelines.md` first. Its rules override assumptions from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->
