# CivilMind AI — Access and Premium Model

## 1. Official business rule

All official regulations, exam questions, exam booklets, answer keys and officially published descriptive guides remain accessible to every user.

Premium unlocks AI intelligence and advanced learning tools. Premium must never be required merely to open public official content or filter it by discipline and qualification.

## 2. User tiers

### 2.1 Guest

A guest can:

- browse all supported official regulations and chapters;
- browse all official exam sessions, questions and answer keys;
- open official source documents;
- select discipline and qualification;
- view content filtered for the selected path;
- use basic search and navigation;
- view recent official updates;
- view public exam-topic heat maps;
- view at least one complete AI analysis demo;
- submit a small configurable number of AI trial requests;
- use speech-to-text for trial questions when available;
- preview all Premium feature descriptions.

A guest cannot persist personal study history unless local temporary storage is intentionally supported.

### 2.2 Registered Free

A registered free user receives everything available to guests, plus:

- saved discipline and qualification;
- bookmarks and favorites;
- continue-reading state;
- study history;
- personal notes where supported;
- basic progress tracking;
- standard practice exams using existing official questions;
- limited daily or monthly AI quota;
- limited upload or voice trials according to configured quotas;
- basic dashboard and activity summary;
- achievements generated from non-AI activity.

### 2.3 Premium

A Premium user receives everything above, plus the advanced AI layer:

- extended or unlimited AI chat according to subscription policy;
- contextual AI Copilot across the application;
- full question analysis;
- AI explanations of clauses and concepts;
- AI-generated targeted quizzes and exams;
- personalized study planner and automatic replanning;
- weakness and mistake-cause detection;
- personalized daily recommendations;
- advanced performance analytics;
- readiness or passing-probability estimation with transparent methodology;
- source-grounded PDF and image chat;
- document summarization and comparison;
- edition comparison;
- similar-question discovery and question-pattern analysis;
- exam trend and priority analysis presented as probability, never certainty;
- natural voice output and voice-to-voice assistant;
- oral practice exams;
- audio summaries and regulation reading;
- advanced knowledge graph navigation;
- persistent learning memory under user control.

## 3. Entitlement matrix

| Capability | Guest | Free account | Premium |
|---|---:|---:|---:|
| Official regulations and sources | Full | Full | Full |
| Official questions and answer keys | Full | Full | Full |
| Discipline/qualification filtering | Full | Full | Full |
| Basic source search | Full | Full | Full |
| AI analysis demo | Full demo | Full demo | Full |
| AI chat | Trial quota | Limited quota | Extended/unlimited |
| Bookmarks and history | Temporary/none | Full | Full |
| Standard practice exams | Preview | Full | Full |
| AI-generated exams | Preview | Locked/limited | Full |
| Smart study planner | Preview | Locked/limited | Full |
| Weakness analysis | Preview | Basic summary | Full |
| AI PDF/image chat | Preview | Trial quota | Full |
| Voice input | Trial | Limited | Full |
| Natural voice responses | Preview | Locked/limited | Full |
| Voice-to-voice tutor | Preview | Locked | Full |
| Advanced analytics | Preview | Basic | Full |
| Personalized AI memory | No | Limited | Full with controls |

Quotas must be configuration-driven, not hardcoded in UI components.

## 4. Premium discovery rules

Premium features must remain visible to all users so their value is understandable.

For a locked feature:

1. Display the feature in its natural product context.
2. Add a subtle `Premium` badge.
3. Allow the user to open a real preview, sample output or explanation.
4. Show exactly what Premium adds.
5. Present a clear upgrade action.
6. Preserve the user's current page and context after closing the upgrade dialog.

Do not redirect every locked interaction directly to a pricing page. First show value and context.

## 5. Trial experience

The trial should demonstrate quality without pretending to provide unlimited service.

Required behavior:

- quota status must be visible;
- the user should know whether a request uses a trial allowance;
- exhausted quota must produce a friendly preview/upgrade state, not a generic error;
- trial answers must follow the same citation and safety rules as Premium answers;
- do not intentionally reduce answer correctness for free users.

## 6. Access-control implementation

Create a centralized entitlement system with stable capability keys, for example:

- `official_content.read`
- `content.filter`
- `ai.chat`
- `ai.question_analysis`
- `ai.voice_input`
- `ai.voice_output`
- `ai.document_chat`
- `ai.exam_generate`
- `ai.study_plan`
- `ai.performance_advanced`
- `ai.memory_personalized`

Components must request capabilities through this layer. Avoid scattered checks such as `if (user.premium)` throughout the codebase.

The server must enforce entitlements independently of the client. Client-side locks are presentation only, not security.

## 7. Billing and cancellation principles

- Subscription status must be clear.
- Cancellation must not delete public-content history or user-owned notes.
- After expiration, Premium-generated outputs may remain viewable where policy allows, but generation and advanced interactions become locked.
- Grace periods and quotas must be configuration-driven.
- Never imply a guaranteed exam result as part of purchase messaging.

## 8. Marketing language

Preferred message:

> Official resources stay open. Premium gives you the CivilMind AI assistant that analyzes, explains, plans and personalizes your preparation.

Avoid messaging that suggests users are paying to unlock public PDF files.