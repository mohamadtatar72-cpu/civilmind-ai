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
