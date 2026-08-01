# CivilMind AI — UI/UX Guidelines

## Product feeling

CivilMind AI must feel like a premium, trustworthy AI SaaS product with a clear engineering identity. It should be modern and calm, not decorative, noisy or game-like.

## Homepage structure

1. AI-first Hero with clear headline, supporting copy, `Start Free` and `Watch Demo`.
2. Large `Ask CivilMind AI` box with text, microphone, file and send actions.
3. Real AI analysis demonstration with visible citations.
4. Three concise value pillars: analyze, personalize, prepare.
5. Recent updates card.
6. Exam-topic heat map.
7. Personalized daily recommendation for authenticated users.
8. Readiness/progress visualization.
9. Achievements and streaks.
10. Premium AI showcase with previews.
11. Trust, FAQ and final CTA.

Do not place every dashboard widget above the fold. The first screen must stay focused.

## Hero requirements

- Use a strong Persian RTL headline explaining the AI engineering assistant.
- Add a concise supporting sentence, not a paragraph.
- Show an original engineering/AI visual: regulations, plans, structural diagrams and analysis panels.
- Use subtle technical-grid motion and layered depth.
- Do not use a cartoon robot.
- Primary CTA starts the free flow; secondary CTA opens an in-page demo.

## Ask AI component

The input must be the visual center of the homepage. Include example prompts, quota state and clear loading/error behavior. Voice and upload controls need labels/tooltips and accessible focus states.

## Premium presentation

Premium tools remain visible. Use a subtle badge and preview state. Avoid aggressive lock overlays. Clicking should open a contextual explanation before the upgrade action.

## Visual system

- RTL-first Persian typography with readable body sizes.
- Consistent spacing scale and card radii.
- Limited accent palette with accessible contrast.
- Glass effects only where they improve hierarchy.
- Soft shadows and restrained glow.
- Light and dark modes with equivalent readability.
- Technical diagrams and grids should remain background elements, not compete with content.

## Motion

Use motion to clarify state:

- short scroll reveals;
- card hover elevation;
- AI typing/streaming;
- source retrieval steps;
- chart transitions;
- upload and voice recording feedback.

Respect `prefers-reduced-motion`. Avoid continuous heavy particle animations and mouse-following effects on mobile.

## AI thinking state

Replace generic spinners with meaningful stages when accurate:

- retrieving official sources;
- checking clauses;
- comparing exam questions;
- preparing cited answer.

Do not display fake progress percentages.

## Responsive behavior

Mobile layouts must be intentionally composed. Hero actions should remain visible, AI input should not overflow, charts need simplified views, bottom navigation must not cover Copilot, and touch targets must be at least 44px.

## Accessibility

- Semantic headings and landmarks.
- Keyboard-accessible dialogs, menus and chat.
- Visible focus states.
- Screen-reader labels for icon-only controls.
- Captions/transcripts for voice output.
- Do not communicate heat-map importance by color alone.

## Trust and advertising

Demonstrate real product output. Do not show fabricated pass rates, fake live-user counters, false urgency or unsupported claims. Testimonials and statistics require verified data.

## Empty, loading and error states

Every module must have designed states for loading, no data, partial data, offline/error and locked entitlement. Never leave blank cards or raw technical errors.

## Component architecture

Build reusable components with data passed through typed props or hooks. Keep mock datasets isolated from presentation and clearly mark them as demo data. Preserve existing design tokens where possible and evolve them centrally.