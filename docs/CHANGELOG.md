## 2026-08-03 — Engineering super library

- Added the public `/resources` CivilMind AI engineering super library.
- Cataloged 16 resources.
- Added 6 official resources.
- Added 16 original-source external resources.
- Added 0 authorized local downloadable files.
- Added Persian search, category filtering and source-type filtering.
- Added official, educational and downloadable resource views.
- Added the super library to the primary application navigation.
- Preserved copyright separation by keeping third-party content link-only.
- Added automated tests for catalog, navigation, search, filtering and copyright behavior.
- No Production deployment or destructive operation was performed.

## 2026-08-02 — Phase 2.3 final verification closure

- Removed the Regulation Explainer React Hook dependency warning.
- Moved the Phase 2.3 tests into the repository test glob path.
- Confirmed that Regulation Explainer tests execute as part of the standard test command.
- Re-ran typecheck, lint, the complete automated test suite and production build.
- Phase 2.3 provider-independent implementation and verification are complete.
- Live model generation remains dependent only on approved server-side AI Provider configuration.
- Production was not modified.

## 2026-08-02 — Phase 2.3 Regulation Explainer

- Added the production-facing `/regulation-explainer` route.
- Added simple, exam-oriented and professional/execution-oriented explanation levels.
- Connected the explainer to Convex public topic retrieval, verified official-question excerpts and the existing server-side AI runtime.
- Enforced retrieval-before-generation and fail-closed behavior when verified source evidence is unavailable.
- Preserved official document title, edition, page, clause and exact-source URL.
- Kept official regulation text visually and semantically separate from CivilMind AI explanation.
- Added truthful loading, no-source, provider-missing, entitlement-required, retryable-error and success states.
- Added automated Phase 2.3 tests.
- Added a real entry point from the topic library.
- No Production deployment or destructive operation was performed.

### Phase result

Phase 2.3 provider-independent implementation is complete. Live model output remains dependent on an approved server-side AI Provider.

### Next continuation point

Continue Phase 2 with the next bounded AI deliverable or begin Phase 3 Learning Engine after reconciling the master plan.

## 2026-08-01 — Citation state handling

## 2026-08-01 — Exact-page official citation links

## 2026-08-01 — Functional topic study actions

- Replaced the four inert «در حال توسعه» topic cards with keyboard-accessible links to the real official PDF, CivilMind AI, topic exam and performance-analysis routes.
- Made the «سؤال‌های آزمون‌های اخیر» control a real expandable interaction with close behavior, loading/empty states and direct exact-page links to verified official question booklets.
- Removed the login and Premium restriction from viewing official recent questions; official-question retrieval is now explicitly enforced as a public capability in Convex.
- Added backward-compatible rendering for the previous Convex response shape so the expandable control fails safely during the frontend/backend deployment transition.
- Added contract coverage for every route, the public-access rule and exact-source navigation.
- TypeScript, ESLint, all 24 automated tests and the production build pass locally.

### Release status

**Code complete / deployment pending:** the updated `examAccess.recentQuestionsForTopic` function must be deployed to Convex before the new expandable question list can work in production. Vercel is still not creating a deployment from the connected Git branch, so browser verification of this pushed build remains queued.

Cloud Browser verified that all four replacement links render and navigate in Preview. Clicking the recent-question control against the legacy Convex response exposed a runtime shape mismatch; the backward-compatible adapter is now included in the latest pushed source and awaits the next Vercel build.

- Updated public PDF citations so the official-source action opens the retrieved PDF at its exact page anchor instead of only opening the document root.
- Added an explicit UI trust label separating extracted official text from any future CivilMind AI explanation.
- Preserved guest access to public citations and kept private/Premium document URLs hidden from guests.
- TypeScript, ESLint, all 22 automated tests and the production build pass locally (the build used a non-secret validation Convex URL because deployment credentials are not present in this runner).

### Next continuation point

**Phase 2.1 code complete / deployment pending:** deploy the updated `pdfLibrary.searchWithCitations` contract to the existing Convex deployment and verify an exact-page public citation in the browser. The Vercel Git integration was reconnected, but the provider has not created a deployment from the latest branch commit. Continue Phase 2.2 implementation independently while those provider-dependent verifications remain queued.

- Added explicit loading, empty-source and retrieval-error states to the source-grounded AI entry point.
- The UI now states that no sourced answer is produced when official citations are unavailable.
- TypeScript, ESLint and all 19 automated tests pass locally.

## 2026-08-01 — Real personal data synchronization

- Added a server-side data synchronization flow that reads the signed-in user's study sessions, attempts, topic progress and planner tasks from Convex.
- Persists a per-user synchronization result and timestamp; the Settings action now performs this backend flow instead of changing a display label.
- TypeScript, ESLint and all 19 automated tests pass locally.

## 2026-08-01 — Connected settings data status

- Replaced the static local-demo synchronization message with live Convex account and entitlement status.
- Signed-in users now see that their profile and authorization are connected to the backend; guests receive an accurate sign-in requirement.
- TypeScript, ESLint and all 19 automated tests pass locally.

## 2026-08-01 — Guest source citation lookup

- Enabled guest retrieval of citations from public, ready official PDFs in the CivilMind AI entry point.
- Kept Premium and private PDFs behind their existing visibility rules; only public source excerpts can be returned to guests.
- Added guest-mode messaging that distinguishes cited source lookup from authenticated AI chat.
- TypeScript, ESLint and all 19 automated tests pass locally.

## 2026-08-01 — AI citation retrieval flow

- Connected the CivilMind AI question flow to the existing secure PDF retrieval endpoint.
- The interface now shows document, page/citation label and excerpt for retrieved sources, each linked to the corresponding library document.
- The UI explicitly avoids presenting generated AI output as sourced when no verified citation was returned.
- TypeScript, ESLint and all 17 automated tests pass locally.

## 2026-08-01 — Authentication rendering fix

- Fixed the sign-in gate: the Clerk sign-in UI now correctly relies on the public Clerk publishable key instead of incorrectly requiring the server-only secret during page rendering.
- Improved the missing-auth configuration message to state the exact required setting and preserve server-side admin authorization.
- Verified locally with TypeScript, ESLint and the complete test suite (17 passing).

## 2026-08-01 — Mandatory 14-phase execution framework

- Added `docs/MASTER_EXECUTION_PLAN.md` as the binding execution framework for all workers.
- Consolidated the Guest, Free and Premium access model in one mandatory source.
- Locked the permanent rule that official resources, official exams, official keys, official descriptive guides and discipline/qualification filtering remain free.
- Registered the complete 14-phase roadmap and ordered sprint catalogue.
- Preserved the approved AI-first homepage, personalized dashboard, visual design and truthful-conversion requirements.
- Registered the sprint Definition of Done, continuous-delivery behavior and persistent Persian command `توسعه`.
- Required every future worker to resume from the exact incomplete sprint by reading the master plan, Changelog and latest pushed commits.

## 2026-08-01 — Phase 1.2: Centralized entitlement enforcement

- Added one canonical capability vocabulary for Guest, Free, Premium and Admin tiers on both the client and Convex server.
- Added the public `access.current` contract so UI capability states are derived from the server-authoritative entitlement tier rather than scattered role checks.
- Enforced AI gateway capabilities on the server: basic `study-coach` maps to the Free AI chat allowance, while exam analysis, study planning and PDF intelligence map to their Premium capabilities.
- Explicitly asserted that official archive reading and discipline/qualification filtering are public capabilities; no official archive path was moved behind Premium.
- Added entitlement contract tests and verified typecheck, tests, lint and a production build using the production Convex URL.

### Next continuation point

**Sprint status: implementation complete, release verification pending.** Convex production deployment succeeded. Vercel production deployment is currently blocked by the account limit `api-deployments-free-per-day` (try again in 24 hours), so this sprint must not yet be marked fully released or browser-verified. Once the deployment limit resets, deploy the current `develop/civilmind-v2`, open `/ai` in Cloud Browser, verify the access query and Free chat flow, then continue to Phase 1.3 and Phase 1.4.

## 2026-08-01 — Phase 1.4: Guest exam preference and public archive

- Added a guest-side discipline and qualification picker directly in the public exam archive flow.
- Stored the guest selection locally in the browser; it does not require an account, subscription or Premium entitlement.
- Connected the selected preference to the server-enforced `examAccess.listPublicArchive` query, keeping official archive reading and filtering explicitly public.
- Kept the sign-in path only for personal exam attempts, saved history and performance analytics; official booklets and official answer materials remain accessible without it.
- Added a focused automated contract test for local persistence and public entitlement enforcement.

### Next continuation point

**Verification pending:** Vercel publication for Phase 1.2 remains queued because of the recorded daily deployment limit. A Codespaces preview was launched for this Phase 1.4 flow; Cloud Browser navigation timed out during the verification attempt, so browser/screenshot verification remains queued rather than being claimed as complete. **Next implementation sprint:** Phase 1.5 — public official regulation library search and filtering, starting with the existing library data model and guest filter flow.

## 2026-08-01 — Phase 1.5: Public regulation library filtering

- Added a free, accessible qualification filter to the public regulation library alongside Persian search.
- Kept the live public topic query and direct official-source navigation intact; filtering is presentation-side prioritization and never a Premium gate.
- Persisted the selected public-library qualification locally for guest continuity without creating an account.
- Added contract coverage for free filtering and direct official-source navigation.

### Next continuation point

**Verification pending:** Vercel publication and Cloud Browser screenshot verification remain queued as recorded above. **Next implementation sprint:** Phase 1.6 — separately model and present official exam booklets, initial/final answer keys, published descriptive guides and distinct CivilMind AI analysis.

## 2026-08-01 — Phase 1.6: Separated official exam materials

- Changed the exam archive presentation to group each session into official question booklets, official answer keys and officially published descriptive guides.
- Added honest empty states for source categories that have not yet been verified; no answer key or guide is fabricated.
- Added an explicit separation notice: CivilMind AI analysis is never an official answer or a substitute for official source material.

### Next continuation point

Phase 1.7 — verified knowledge ingestion, provenance, editions and page/clause extraction.

## 2026-08-01 — Phase 1.7: Source provenance visibility

- Exposed verified-source provenance in the public source center: verification status, last verified date and version-tracking state when available.
- Preserved direct official-source navigation and made no claim when a timestamp or sync record is absent.
- Added a provenance contract test against the public source data contract.

### Next continuation point

Phase 2.1 — source-grounded AI chat with document/page/clause citations.

## 2026-08-01 — Phase 1: Free official archive access

- Removed the Premium gate from the official archive UI and backend scoped archive query.
- Official archive access now depends only on selecting a free discipline/qualification preference.
- Added an explicit free-path message and direct profile link when no preference is selected.

### Next continuation point

Continue Phase 1 by adding guest-side temporary discipline/qualification selection and a public scoped archive query, then register verified descriptive guides as separate archive documents.


## 2026-08-01 — Phase 0 / Dashboard Stage A

- Added a centralized typed capability registry at `lib/access/capabilities.ts` to distinguish public official-content access from AI intelligence entitlements.
- Added `docs/PHASE_0_AUDIT.md` documenting dashboard, sidebar, AI-entry and source-access gaps against the approved specifications.
- Recorded the critical Phase 1 correction: official archive retrieval must not depend on Premium access.
- No working routes or visible dashboard features were removed in Stage A.


# CivilMind AI — Changelog

All notable product, access, AI and UX decisions must be recorded here. This file tracks specification changes, not every code commit.

## 2026-08-01 — Phase 2.2: First verified official question ingestion

- Transcribed and registered question ۱ from the official Civil execution exam booklet 215A, Khordad 1404: the window-shading question for a building in Khorramshahr.
- Verified all four options on PDF page 2 and official answer option ۲ on the official key at PDF page 13; the record retains the exact INBR booklet and key anchors.
- Added an idempotent admin ingestion mutation that creates missing archive/booklet metadata and creates or updates this reviewed `examQuestionReferences` record without duplicating it.
- Tightened analysis readiness so a record must be reviewed, have a non-empty stem and options, and contain an in-range official key before CivilMind AI can analyze it.
- Updated the public topic UI to show the official question, all options, free official key, verified source metadata and exact source actions separately from the non-official Premium AI analysis.
- Added shared contract coverage proving the complete reviewed record is analysis-ready while pending, option-incomplete and key-incomplete records are blocked.
- TypeScript, ESLint, all 29 automated tests and the production build pass locally.

### Release state

**Code Complete / Deployment Pending:** deploy `examArchives.seedVerifiedKhordad1404Question` and the updated `examAccess.recentQuestionsForTopic` contract to Convex, execute the idempotent admin ingestion once, then publish the matching frontend build and verify topic 19 in the browser. Vercel and Convex publication remain the only queued provider-dependent tasks; no production deployment is claimed here.

### Next continuation point

Phase 2.2 continues with the next manager-assigned verified official-question ingestion or, when the provider queue clears, deployment and live verification of this exact record.

## 2026-08-01 — Phase 2.2: Verified official-question analysis readiness

- Extended official-question provenance with backward-compatible optional fields for stem, options, official key, clause, edition and official answer source URL.
- Added a server-derived `analysisReady` flag; AI analysis cannot start until the verified stem, options and official key are all present and internally consistent.
- Connected ready official questions in each topic to the real Premium `exam-analysis` runtime.
- Added explicit states for extraction-incomplete, AI loading, provider/Premium blocked, successful non-official analysis and retryable failure.
- Kept the official question and key free while clearly labeling CivilMind output as non-official analysis.
- Added contract coverage preventing invented citations and accidental analysis of incomplete official records.

### Next continuation point

Ingest verified stems, options and official keys into `examQuestionReferences` from the official booklets/key documents, then deploy the widened schema/functions to Convex. Provider-backed generation remains dependent on a configured server-side API key and adapter; Vercel verification remains subject to the account build limit.

## 2026-08-01 — Phase 2.2: Structured question-analysis flow

- Connected completed sample-exam questions to the real `aiRuntime.submitAndExecute` action with the `exam-analysis` capability.
- Added per-question loading, ready, Premium/provider-blocked and retryable error states.
- The analysis prompt requires a concise solution path, correct-option reasoning, wrong-option reasoning, common trap, difficulty/type classification and next review action.
- Explicitly forbids invented official clauses, pages or citations and requires an uncertainty statement when no official reference exists.
- Separately labels the stored educational answer, the non-official CivilMind AI analysis and the absence of an official exam key for generated sample questions.
- Preserved free access to educational answers and all official sources; only advanced AI analysis uses the Premium entitlement.

### Next continuation point

Connect the same structured analysis contract to verified official-question records once stems/options/official keys are ingested, including exact booklet page and clause citations. Vercel verification remains queued until the account build-rate limit clears; provider execution requires one configured server-side API adapter.

## 2026-08-01 — Phase 2.1: Executed source-grounded AI answers

- Replaced the frontend-only AI request intent with the real `aiRuntime.submitAndExecute` action.
- Enforced retrieval-first behavior in the user flow: AI execution is skipped when no verified citation is available.
- Passed the retrieved document title, edition, page/citation label and excerpt into the server-side AI prompt envelope.
- Added an explicit CivilMind AI analysis panel that remains visually separate from extracted official text and displays an uncertainty/safety notice.
- Kept truthful blocked and failure states: when no model adapter is configured, verified sources remain visible and no generated answer is fabricated.
- Added contract coverage for execution wiring, source gating, official-source tool policy and AI/official-content separation.

### Next continuation point

Deploy the current Convex functions and Vercel Preview, then verify a signed-in sourced question with an active provider adapter. Phase 2.2 begins with structured question analysis (official answer, option-by-option reasoning, source citations, traps and uncertainty) without presenting generated content as official.

### Release state

- Branch: `develop/civilmind-v2`
- Source commit: `a96ac19c16ac7914a0f751556aff06b028402c3e`
- Checks: typecheck, ESLint, 25 tests and production build passed.
- Vercel Preview: publication pending because all three connected Vercel projects returned `build-rate-limit`; the previous live URL remains `https://civilmind-ai-v2-preview.vercel.app` and does not yet contain this change.
- Exact incomplete verification: deploy the source commit on Vercel, verify `/ai` against the real Convex deployment and capture desktop/mobile evidence of the sourced AI answer state.

## 2026-08-01

### Product model

- Established `docs/PROJECT_SPEC.md` as the primary product reference.
- Officially confirmed the core business rule: all official regulations, exam questions, exam booklets, answer keys and official descriptive guides remain open to all users.
- Confirmed that filtering by discipline and qualification is free.
- Defined Premium as the intelligent layer: AI analysis, personalization, generation, advanced analytics, document intelligence and voice.

### Access model

- Defined Guest, Registered Free and Premium tiers.
- Required centralized entitlement capability keys and server-side enforcement.
- Required Premium features to remain visible through contextual previews instead of being hidden.
- Prohibited reducing answer correctness for free-tier AI trials.

### AI architecture

- Adopted retrieval-first, source-grounded AI behavior.
- Required exact citations to source, edition, page, clause and question when available.
- Required separate labeling for official text, official answers, CivilMind explanations, inference, prediction and generated practice.
- Prohibited fabricated citations, page numbers, exam questions and guaranteed predictions.
- Defined contextual Copilot, voice, document intelligence and personal-learning-memory rules.

### Homepage and visual experience

- Approved an AI-first homepage structure with a stronger Hero, Ask-AI box, live cited analysis demo, updates, heat map, daily recommendation, readiness visualization, achievements and Premium showcase.
- Required modern premium SaaS styling with a credible engineering identity.
- Required restrained motion, RTL-first Persian, responsive composition, dark/light mode and accessibility.
- Prohibited fake live-user counters, unsupported pass rates and fabricated success claims.

### Feature scope

- Added AI Copilot, question intelligence, regulation intelligence, study planner, exam center, weakness detection, voice assistant, document intelligence, knowledge graph and advanced analytics to the approved feature catalogue.
- Added free bookmarks, history, progress, standard practice exams, achievements and limited AI trials for registered users.

### Roadmap

- Defined phased delivery beginning with official data integrity, source navigation and access-control correctness.
- Prioritized grounded AI and citations before advanced predictions.
- Required each phase to include acceptance criteria, tests, mobile review and changelog updates.
## 2026-08-01 — Citation provenance actions

- Added the source document edition to every retrieved citation shown in CivilMind AI.
- Added a direct `منبع رسمی` action only when a public document has a verified official URL; private and Premium documents do not expose a source URL to guests.
- Preserved the internal library route and the existing rule that missing citations never become an AI-sourced answer.
- TypeScript, ESLint, all 19 automated tests and the production build pass locally.

### Next continuation point

**Phase 2.1 remains in progress:** deploy the updated Convex citation response contract, then verify a real public PDF retrieval that displays edition, page/label, library route and official-source action in production. After that, begin Phase 2.2 — complete AI question analysis.
## 2026-08-01 — Public-flow resilience and truthful readiness

- Replaced the root redirect with a dedicated guest AI landing page while retaining the signed-in dashboard route.
- Prevented the public exam archive from blocking on an unresolved authentication check; guests can now reach the free archive flow immediately.
- Made the unauthenticated analytics state explicit and distinct from the exam center, with safe links to sign-in and the public archive.
- Removed the unsupported fixed pass-probability display and replaced it with an honest insufficient-data readiness state.
- Reordered the sidebar so the primary learning journey is prominent and source/archive utilities are grouped separately.
- TypeScript, ESLint, all automated tests and the production build pass locally.

### Next continuation point

**Production configuration required:** replace the Clerk development publishable key in Vercel with the production key for the CivilMind Clerk instance. After Vercel creates a deployment from the latest `develop/civilmind-v2` commit, verify the guest landing, public exam archive, analytics sign-in state and production authentication in Cloud Browser.
