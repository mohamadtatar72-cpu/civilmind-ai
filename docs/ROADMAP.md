# CivilMind AI — Implementation Roadmap

## Delivery rules

- Implement incrementally; do not attempt the entire specification in one uncontrolled change.
- Preserve current functionality and routing.
- Complete and verify each phase before starting the next.
- Use feature flags for incomplete or risky capabilities.
- Mock data is allowed only when isolated, labeled and replaceable through typed service interfaces.

## Phase 0 — Repository and documentation alignment

- Treat all files in `docs/` as the source of truth.
- Audit current implementation against the access model.
- Record conflicts and missing features.
- Establish centralized design tokens, capability keys and data contracts.
- Add or update tests for critical existing behavior.

**Exit criteria:** documentation is referenced from contributor/agent instructions and no implementation begins from assumptions alone.

## Phase 1 — Public official-content foundation

- Complete verified regulations, exam booklets, questions and answer-key inventory.
- Keep descriptive guides separate from answer keys.
- Improve source metadata: edition, exam, discipline, qualification, page, clause and question.
- Make `View official source` open the exact source location.
- Add free discipline/qualification filtering everywhere relevant.
- Add `recent questions from this topic` mappings.

**Exit criteria:** a guest can find and open relevant official materials without Premium.

## Phase 2 — Access-control foundation

- Implement centralized capability/entitlement service.
- Define Guest, Free and Premium quotas through configuration.
- Enforce access on server and client.
- Add contextual Premium preview dialogs.
- Ensure no public source is accidentally paywalled.

**Exit criteria:** automated entitlement tests pass for every critical capability.

## Phase 3 — Homepage AI-first experience

- Upgrade Hero, CTAs and engineering/AI visual.
- Add Ask CivilMind AI box.
- Add real cited AI-analysis demo.
- Add latest updates and topic heat map.
- Add Premium showcase, trust and FAQ.
- Compact recent activity.
- Complete responsive, dark/light and accessibility states.

**Exit criteria:** a new visitor understands the product and can experience AI value within five seconds.

## Phase 4 — Grounded AI core

- Implement retrieval-first AI pipeline.
- Add source citations and exact-source navigation.
- Implement question analysis and clause explanation.
- Add no-source and conflicting-source behavior.
- Store provenance and feedback.
- Protect uploaded content from prompt injection and cross-user access.

**Exit criteria:** representative AI answers are verified against official sources and citation tests pass.

## Phase 5 — Copilot and document intelligence

- Add persistent contextual Copilot.
- Connect current route, source, clause and question context.
- Add PDF/image upload and chat.
- Support summaries, comparisons and source extraction.
- Add conversation history with privacy controls.

**Exit criteria:** Copilot works across source, question and study pages without losing context.

## Phase 6 — Study and examination system

- Complete bookmarks, history, notes and progress.
- Add standard and official-mode practice exams.
- Add targeted and AI-generated quizzes.
- Implement post-exam analysis and mistake classification.
- Add personalized study planner and automatic replanning.
- Add daily recommendation, achievements and streaks.

**Exit criteria:** users can complete a full study-plan → practice → analysis → next-action loop.

## Phase 7 — Voice assistant

- Add reliable Persian speech-to-text.
- Add natural text-to-speech with transcript.
- Add voice-to-voice Copilot.
- Add regulation reading, audio summaries and oral quizzes.
- Add playback, speed, resume and accessibility controls.

**Exit criteria:** voice interactions follow the same citation, entitlement and privacy rules as text.

## Phase 8 — Advanced analytics and knowledge graph

- Build topic/source/question graph.
- Add similar-question and related-clause discovery.
- Add advanced weakness and readiness analytics.
- Add transparent trend and priority estimation.
- Expose methodology and uncertainty.

**Exit criteria:** analytics are explainable, data-backed and never presented as guarantees.

## Phase 9 — Conversion, marketing and polish

- Create product demo flow and promotional landing page.
- Add verified testimonials and metrics only when real data exists.
- Optimize onboarding and upgrade journey.
- Improve performance, motion and mobile composition.
- Run accessibility, security and regression review.

**Exit criteria:** marketing demonstrates real capability without unsupported claims.

## Priority order

1. Official data integrity and source navigation.
2. Free filtering and correct access rules.
3. Grounded AI and citations.
4. Homepage demonstration and Copilot.
5. Study/exam personalization.
6. Voice.
7. Advanced predictions and marketing polish.

## Release discipline

For each phase:

- create a dedicated issue or milestone;
- document acceptance criteria;
- implement in reviewable changes;
- test desktop and mobile;
- update `CHANGELOG.md`;
- do not mark complete while key screens use unlabeled fake data.