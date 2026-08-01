# CivilMind AI — Dashboard Visual Redesign & AI-First UX Specification

## Status
Approved product and UI specification.

## Scope
This document defines the visual and UX upgrade for the current CivilMind AI homepage/dashboard shown in the existing implementation. It does not authorize a rewrite from scratch and does not authorize removal of working features.

The current implementation is clean and usable, but it visually behaves more like an internal admin dashboard than the main experience of a premium AI education product. The redesign must preserve the current architecture and functional modules while changing information hierarchy, product storytelling and AI visibility.

## Primary product decision
Use two distinct entry experiences:

1. Guest / new-user landing experience
2. Signed-in personalized dashboard

Do not show the same first screen to both audiences.

---

# 1. Guest and New-User Landing Experience

## Purpose
Within five seconds, a new visitor must understand:

- what CivilMind AI is;
- how it helps with engineering licensing exams;
- why it is different from a document archive;
- what the first action should be.

## Hero requirements

### Main headline
Use concise Persian messaging equivalent to:

> هوش مصنوعی تخصصی آزمون نظام مهندسی

### Supporting copy
Communicate that users can find sources, analyze questions, understand regulations, build a study plan and improve exam readiness with one specialized assistant.

### Primary CTAs

- `شروع رایگان`
- `مشاهده دمو`

### Hero visual
Provide a premium engineering-AI visual or lightweight animation featuring:

- official regulation books;
- construction drawings and blueprints;
- AI analysis panels;
- question analysis;
- data and progress visualization.

The visual must feel professional, technical and modern. Avoid cartoon robots and generic stock illustrations.

## Guest-page order

1. Hero
2. Ask CivilMind AI demo
3. Real sample question analysis
4. Three core value propositions
5. Recent-exam topic heat map
6. Official-content and citation trust section
7. Premium AI capability preview
8. Product demo / short video area
9. Latest official updates
10. Plans, FAQs and conversion CTA

The signed-in dashboard cards must not dominate the guest landing page.

---

# 2. Signed-In Dashboard Experience

## Purpose
The dashboard must answer:

- What should I do today?
- Where am I weak?
- What changed since my last visit?
- What is the fastest next action?
- How can the AI help me now?

## Required page order

1. Personalized compact hero
2. Large `Ask CivilMind AI` interaction
3. Smart daily summary
4. Passing-readiness and progress insight
5. Latest exam and weakness analysis
6. Today's study plan
7. Recent-exam heat map
8. Achievements and study streak
9. Latest official updates
10. Compact recent activity

This hierarchy is mandatory unless technical inspection shows a strong reason to adjust it. Document any deviation.

---

# 3. Personalized Dashboard Hero

The current greeting is useful but the upper area feels empty and does not strongly communicate AI assistance.

## Required content

### Suggested headline

> امروز یک قدم به قبولی نزدیک‌تر شو

### Suggested supporting message

> CivilMind AI عملکردت را تحلیل کرده و بهترین مسیر مطالعه امروز را آماده کرده است.

### Actions

- `ادامه برنامه امروز`
- `از AI بپرس`
- `تحلیل آخرین آزمون`

### Visual behavior
Use a compact premium visual panel showing the assistant analyzing one or more of:

- a question;
- a regulation clause;
- the user's progress;
- today's recommended study topic.

Do not use an oversized decorative hero that pushes actionable content below the fold.

---

# 4. Ask CivilMind AI — Primary Dashboard Action

This must become one of the most visible elements on the page.

## UI elements

- large text input;
- microphone button;
- file attachment button;
- send button;
- example prompt chips.

## Suggested placeholder

> هر سؤالی درباره مقررات ملی ساختمان بپرس...

## Example prompts

- `از مبحث ۹ چه سؤال‌هایی آمده؟`
- `این بند را ساده توضیح بده`
- `از نقاط ضعف من آزمون بساز`
- `این پاسخ را با منبع رسمی بررسی کن`

## Access behavior

- Guests receive a limited demo.
- Registered free users receive a limited quota.
- Premium users receive full AI capability according to `PREMIUM_MODEL.md`.
- Premium-only actions remain visible and previewable.

Do not route the user away from the product for standard AI interaction. The assistant should open and respond inside CivilMind AI.

---

# 5. Passing Readiness Card

The existing wide static probability card must be redesigned into a useful decision card.

## Display

- circular or radial readiness visualization;
- current readiness score;
- change compared with the previous period;
- reason for increase or decrease;
- actions that can improve readiness.

## Example structure

> آمادگی فعلی: ۷۱٪
>
> این هفته ۶٪ رشد داشته‌اید.
>
> با تکمیل مبحث ۱۰ و انجام یک آزمون جامع، آمادگی شما افزایش پیدا می‌کند.

## Data integrity rule

Never display fabricated or arbitrary probabilities.

If a real model is not yet available:

- label the value as demo data;
- use a readiness score rather than a scientific pass probability;
- document the calculation inputs;
- do not make guaranteed claims.

The future model may use:

- completed topics;
- official practice-exam results;
- correct-answer ratio;
- study consistency;
- time management;
- topic coverage;
- recent performance trend.

---

# 6. Replace Low-Value Summary Cards

The current top cards emphasize platform inventory such as total questions and registered sources. These metrics are useful for marketing or an admin view, but are not the best personal dashboard metrics.

## Replace or deprioritize them with

- مسیر مطالعه: overall personal progress;
- سؤال‌های امروز: completed versus target;
- زمان مطالعه این هفته;
- نقطه ضعف اصلی;
- current study streak, when useful.

Platform-wide metrics may remain in a separate trust or marketing section but should not displace personal actions.

---

# 7. Smart Daily Summary

Create a prominent AI-generated summary for signed-in users.

## Required content

- recommended topic;
- reason for recommendation;
- expected study time;
- primary action;
- optional secondary action.

## Example

> امروز مبحث ۸ را مرور کنید.
>
> دلیل: در دو آزمون اخیر این بخش بیشترین پاسخ اشتباه را داشته و شش روز از آخرین مرور شما گذشته است.
>
> زمان پیشنهادی: ۲۵ دقیقه

The explanation must be based on actual available user data. If data is insufficient, state that clearly and provide a generic onboarding recommendation.

---

# 8. Today's Study Plan

The current progress bars should become reason-driven tasks.

Each item must show:

- topic and subsection;
- priority;
- progress;
- estimated duration;
- AI reason;
- start or continue action.

## Example

> مبحث ۹ — اولویت بالا
>
> دلیل: در دو آزمون اخیر پنج پاسخ اشتباه داشته‌اید.

> مبحث ۱۰ — مرور کوتاه
>
> دلیل: شش روز از آخرین مرور گذشته است.

---

# 9. Latest Exam Widget

Add a dedicated latest-exam card.

## Display

- score or correct-answer ratio;
- completion date;
- time spent;
- strongest topic;
- weakest topics;
- AI analysis CTA;
- recommended next practice.

This card should connect directly to performance analysis and the study plan.

---

# 10. Recent-Exam Topic Heat Map

Display which topics have appeared most frequently in recent official exams.

## Requirements

- filter by discipline;
- filter by qualification;
- filter by exam range;
- show source count and time range;
- link each topic to its related official questions;
- never represent frequency as guaranteed future appearance.

Prefer a professional heat map or compact horizontal visualization over emoji-only fire ratings.

---

# 11. Achievements and Study Streak

Add a small, mature gamification section.

Examples:

- first practice exam completed;
- 100 questions solved;
- seven-day study streak;
- topic mastery;
- successful revision milestone.

Avoid childish game styling. Use subtle badges and meaningful progress feedback.

---

# 12. Recent Activity

The existing Recent Activity card occupies too much space relative to its value.

## Required change

- reduce card height;
- show only the three most relevant events;
- add `مشاهده همه`;
- move secondary details to an activity page or expandable drawer;
- use the released space for AI, latest exam or daily recommendation content.

---

# 13. Sidebar Redesign

The current sidebar is organized but visually gives too many items equal weight and does not make AI the central product.

## Recommended information architecture

### Main

- خانه / مرکز مأموریت
- مربی هوشمند
- مرکز مطالعه
- مرکز آزمون
- تحلیل عملکرد

### Sources

- کتابخانه مقررات
- بانک سؤال
- پاسخ‌نامه‌ها و راهنماهای تشریحی
- نقشه دانش

### Tools

- برنامه‌ریز
- جستجوی هوشمند
- تنظیمات

## AI Copilot entry

Add a visually distinct persistent entry:

> CivilMind AI Copilot

It may be a sidebar item plus a floating launcher where appropriate.

## Sidebar behavior

- reduce unnecessary width where possible;
- support collapsed desktop state;
- use tooltips in collapsed state;
- create a mobile bottom navigation or drawer rather than shrinking the desktop sidebar;
- keep primary destinations visually stronger than utilities.

---

# 14. Color and Visual System

Preserve the current dark identity but establish a deliberate semantic color system.

## Recommended roles

- Brand blue: primary CTA and navigation emphasis
- Cyan / turquoise: AI, analysis and active progress
- Gold: Premium only, used sparingly
- Green: verified, correct, successful and complete states
- Purple: knowledge relationships and advanced analysis
- Red / amber: warnings, weak performance and attention states

Do not apply multiple accent colors decoratively without semantic meaning.

## Surfaces

- maintain deep dark background;
- distinguish page background, primary card and elevated card levels;
- improve borders and contrast;
- avoid excessive glassmorphism;
- use glow only around flagship AI interactions and Premium previews.

---

# 15. Typography and RTL

- Persian is the primary interface language.
- All layouts must be RTL-first, not LTR layouts mirrored as an afterthought.
- Use a readable Persian font already compatible with the project or an approved project font.
- Establish a consistent type scale for page title, section title, card title, body, metadata and labels.
- Improve line height and spacing in long regulation text.
- Keep English product labels secondary and optional.

---

# 16. Motion and Micro-Interactions

Use motion to clarify state, not to decorate every element.

## Required motion patterns

- soft card entrance animation;
- subtle hover elevation;
- animated progress updates;
- AI response typing or streaming;
- skeleton loading;
- dedicated AI analysis sequence;
- smooth state transitions;
- clear microphone recording state;
- file-upload progress;
- reduced-motion support.

## AI thinking states

Do not use only a generic spinner. Show staged status such as:

- `در حال بررسی سؤال...`
- `در حال جست‌وجو در منابع رسمی...`
- `در حال تطبیق بندهای مرتبط...`
- `در حال آماده‌سازی پاسخ مستند...`

Do not fake long processing stages. Status text must reflect the actual process where possible.

---

# 17. Loading, Empty and Error States

Every new component must include:

- loading state;
- empty state;
- partial-data state;
- error state;
- retry action where relevant;
- no-personal-data onboarding state.

Never display invented personal recommendations when the user has no performance history.

---

# 18. Responsive Strategy

Do not treat mobile as a smaller desktop.

## Mobile priorities

1. daily recommendation;
2. Ask AI;
3. continue study;
4. latest exam;
5. core progress;
6. remaining sections.

Requirements:

- thumb-friendly controls;
- sticky primary action where useful;
- no horizontal overflow;
- cards stack in meaningful order;
- charts remain readable;
- sidebar becomes drawer or bottom navigation;
- voice interaction must be easy to access.

---

# 19. Guest, Free and Premium Visual Behavior

Follow `PREMIUM_MODEL.md`.

## Public and free

- official regulations;
- official exam booklets;
- official questions;
- official answer keys;
- officially published descriptive guides;
- filtering by discipline and qualification;
- official-source navigation;
- basic search and browsing.

## Premium

- advanced AI analysis;
- voice-to-voice assistant;
- personalized tutor;
- adaptive study planning;
- weakness detection;
- AI exam generation;
- document intelligence;
- knowledge graph and advanced analytics;
- personalized predictions and recommendations.

## Locked-feature UX

- keep feature visible;
- use a small Premium indicator;
- allow preview;
- explain benefit;
- provide a clear upgrade CTA;
- never make the whole product feel unusable without Premium.

---

# 20. Marketing and Conversion Elements

The product must communicate value through evidence, not exaggerated claims.

## Approved conversion patterns

- live or recorded AI demo;
- before/after workflow comparison without unsupported percentages;
- sample question analysis;
- official source citations;
- user success stories only when genuine and approved;
- latest official updates;
- feature previews;
- limited free AI trial;
- contextual Premium prompts after value is demonstrated.

## Prohibited patterns

- fabricated active-user counts;
- fabricated pass rates;
- guaranteed acceptance or passing;
- fake countdowns;
- fake scarcity;
- unsupported claims such as 100% win/pass rate;
- visual pressure that blocks public documents.

---

# 21. Component Architecture

Implement as reusable typed components. Suggested boundaries:

- `GuestHero`
- `DashboardHero`
- `AskCivilMindCard`
- `SmartDailySummary`
- `ReadinessCard`
- `PersonalMetricGrid`
- `LatestExamCard`
- `StudyPlanCard`
- `ExamHeatMap`
- `AchievementStrip`
- `LatestUpdatesCard`
- `CompactActivityCard`
- `AICopilotLauncher`
- `PremiumPreviewDialog`

Do not hardcode business rules inside visual components. Use centralized entitlements and typed data contracts.

---

# 22. Implementation Rules

1. Inspect the current dashboard components before changing code.
2. Preserve current routes and working behavior.
3. Do not delete existing features without documenting where they moved.
4. Separate guest landing and signed-in dashboard behavior.
5. Implement incrementally.
6. Use real data where available.
7. Mark isolated mock data clearly.
8. Ensure all UI is API-ready.
9. Follow the AI citation and uncertainty rules in `AI_ARCHITECTURE.md`.
10. Update `CHANGELOG.md` after implementation.
11. Provide before/after screenshots for desktop and mobile.
12. Test dark mode, light mode if supported, RTL, keyboard navigation and reduced motion.

---

# 23. Recommended Delivery Sequence

## Stage A — Audit

- locate the current homepage and dashboard route;
- list all current components;
- identify guest versus authenticated rendering;
- identify current entitlement checks;
- document reusable versus legacy components.

## Stage B — Information Architecture

- introduce separate guest and authenticated layouts;
- reorganize sidebar;
- compress Recent Activity;
- define new dashboard section order.

## Stage C — AI-First Core

- implement dashboard hero;
- implement Ask AI card;
- implement Smart Daily Summary;
- implement AI Copilot launcher.

## Stage D — Decision Cards

- readiness card;
- latest exam;
- personalized metrics;
- reason-driven study plan;
- heat map.

## Stage E — Product Polish

- achievements;
- updates;
- loading and empty states;
- motion;
- mobile-specific layout;
- accessibility and performance.

## Stage F — Validation

- visual regression review;
- RTL and mobile testing;
- entitlement tests;
- verify no public content became Premium-gated;
- verify no unsupported statistics or claims are shown.

---

# 24. Acceptance Criteria

The task is complete only when:

- guests see a clear AI product landing experience;
- signed-in users see a personalized action-oriented dashboard;
- Ask CivilMind AI is visually prominent;
- AI Copilot is accessible throughout the product;
- Recent Activity no longer dominates the page;
- the sidebar clearly prioritizes core journeys and AI;
- personal metrics replace or outrank inventory metrics;
- study recommendations explain why they were selected;
- pass/readiness data is transparent and not fabricated;
- Premium features are visible and previewable without hiding public content;
- desktop and mobile screenshots are provided;
- existing working functionality remains intact;
- documentation and changelog are updated.
