# CivilMind AI — Master Product Specification

## 1. Status and authority

This document is the primary product reference for CivilMind AI. All implementation decisions must also comply with:

- `docs/PREMIUM_MODEL.md`
- `docs/AI_ARCHITECTURE.md`
- `docs/UI_GUIDELINES.md`
- `docs/FEATURES.md`
- `docs/ROADMAP.md`
- `docs/CHANGELOG.md`

When code and documentation conflict, do not silently guess. Preserve working behavior, document the conflict, and implement the smallest change consistent with these specifications.

## 2. Product vision

CivilMind AI is an AI-first engineering education and exam-preparation platform for Iran's National Building Regulations and professional engineering licensing exams.

The product must not feel like a PDF archive. It must feel like a professional engineering mentor available throughout the user's study journey.

CivilMind AI helps users:

- find official regulations, exam booklets, questions and answer keys;
- filter all content by discipline and qualification;
- understand clauses and exam questions;
- discover which clauses have appeared in previous exams;
- build personalized study plans;
- generate targeted practice exams;
- detect weaknesses and recurring mistakes;
- study through text, uploaded files and voice;
- receive source-grounded answers with exact references.

## 3. Core business rule

Official content remains open to all users.

The following must not be placed behind a Premium paywall:

- official National Building Regulations;
- official exam booklets;
- official questions;
- official answer keys;
- official descriptive answer guides when available;
- disciplines and qualifications;
- filtering content by discipline and qualification;
- basic browsing and source navigation.

Premium sells intelligence, personalization, automation and advanced AI assistance—not access to public documents.

## 4. Target users

Primary users are Iranian engineers and exam candidates across disciplines and qualifications, including civil, architecture, mechanical, electrical, surveying, traffic and urban planning where supported by the verified dataset.

The interface must support RTL Persian as the primary experience. Architecture must remain ready for additional locales.

## 5. Product experience principles

1. **AI-first, source-first:** AI is prominent, but official sources remain the authority.
2. **Value before payment:** users must see and try limited AI value before upgrading.
3. **Progressive personalization:** after discipline and qualification selection, relevant content is prioritized without hiding other public content.
4. **No dead ends:** every page should suggest a meaningful next action.
5. **Transparent uncertainty:** predictions and inferred insights must never be presented as guaranteed facts.
6. **Preserve context:** source, chapter, clause, question, exam and user progress must remain connected.
7. **Mobile-quality experience:** mobile is a first-class product, not a compressed desktop layout.

## 6. Required user tiers

- **Guest:** public archive, filtering, search, AI demo and limited trial interactions.
- **Registered Free:** guest access plus profile, bookmarks, history, progress and limited AI quota.
- **Premium:** all public content plus advanced AI, voice, personalization, analytics and generation features.

Detailed entitlements are defined in `PREMIUM_MODEL.md`.

## 7. Main product areas

### 7.1 Homepage

The homepage must communicate within five seconds:

- what CivilMind AI is;
- why it is different;
- what value the AI provides;
- what the user should do next.

Required homepage modules:

- strong AI-focused Hero;
- `Start Free` and `Watch Demo` actions;
- `Ask CivilMind AI` input with voice, file and send controls;
- a real AI analysis demo;
- recent official updates;
- exam-topic heat map;
- smart daily recommendation for authenticated users;
- passing-readiness visualization based on available data;
- achievements and study streaks;
- Premium capability showcase with previews;
- compact recent activity instead of an oversized activity panel.

### 7.2 Public source library

Users can browse and search official sources, exams and answer materials. Source pages must clearly separate:

- official source files;
- official answer keys;
- official descriptive guides;
- CivilMind AI analysis;
- user-generated notes.

Opening `View official source` must navigate directly to the relevant document, page, clause or item where technically possible—not to a generic resource list.

### 7.3 Discipline and qualification filtering

Selecting a discipline and qualification is free. The selection controls prioritization and filtering across:

- relevant regulations;
- relevant exam sessions;
- questions and answer keys;
- study tools;
- recent questions by topic.

The user may change this selection at any time.

### 7.4 AI Copilot

A persistent CivilMind AI Copilot must be accessible throughout the application. It should understand the current page context and support:

- explaining the current clause;
- analyzing the current question;
- finding previous questions from the topic;
- generating a quiz;
- summarizing a document;
- comparing editions;
- building or adjusting a study plan.

### 7.5 Study and examination system

The platform should support practice exams, official-mode simulations, targeted quizzes, history, bookmarks, progress, weaknesses, achievements and personalized recommendations.

## 8. Homepage positioning and marketing

CivilMind AI should be marketed as:

> An intelligent engineering mentor for understanding regulations, analyzing real exam questions and building a personalized path to exam readiness.

Marketing must demonstrate product behavior rather than rely on unsupported claims. Use real demos, cited analyses and measured product activity. Do not display fabricated user counts, pass rates, live activity or success percentages.

## 9. Visual direction

The product should feel like a modern premium AI SaaS platform while retaining a credible engineering identity. Use subtle technical grids, diagrams, blueprints, calm glass surfaces and purposeful motion. Avoid excessive glow, game-like visuals and generic educational templates.

Detailed visual rules are defined in `UI_GUIDELINES.md`.

## 10. Engineering constraints

- Preserve existing routes and working features unless a documented migration requires change.
- Build reusable, typed and accessible components.
- Separate business rules from presentation.
- Use API-ready data contracts even when mock data is temporarily required.
- Do not hardcode entitlement checks across components; use a centralized access-control layer.
- Do not hardcode fake analytics as real user data.
- Implement responsive behavior deliberately for desktop, tablet and mobile.
- Add tests for access control, source citation, critical navigation and core AI states.

## 11. Definition of success

The product succeeds when a new visitor can access official materials freely, understand the AI value without payment, select a relevant engineering path, receive a trustworthy source-grounded demonstration and clearly understand why Premium improves learning without restricting public knowledge.