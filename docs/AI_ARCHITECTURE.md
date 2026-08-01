# CivilMind AI — AI Architecture and Source-Grounding Rules

## 1. Purpose

CivilMind AI must answer as a source-grounded engineering assistant. It may explain, summarize, compare, teach, generate practice and personalize learning, but it must never replace official documents or invent authority.

## 2. Source hierarchy

Use sources in this order:

1. Official regulation editions and amendments.
2. Official exam booklets and questions.
3. Official answer keys.
4. Official descriptive answer guides, when separately published.
5. Verified internal metadata and curated mappings.
6. AI inference, clearly labeled as inference.

Never merge an unofficial explanation into an official answer key. Store and display each content type separately.

## 3. Retrieval-first response pipeline

For factual questions about regulations or past exams:

1. Resolve user context: discipline, qualification, exam session, regulation edition and current page.
2. Retrieve relevant verified chunks before generating an answer.
3. Rank chunks by source authority, edition relevance and semantic match.
4. Generate an answer only from retrieved evidence plus clearly identified reasoning.
5. Attach citations to the exact source, document, page, chapter, clause or question when available.
6. Return uncertainty when evidence is incomplete or conflicting.

The system must not rely on model memory when an official source exists in the platform.

## 4. Citation requirements

Every source-grounded answer should include the best available reference fields:

- source title;
- source type;
- edition or exam date;
- chapter and clause;
- page number;
- question number;
- direct source link or internal document anchor.

`View official source` must open the exact referenced location where technically possible.

If exact page or clause metadata is unavailable, say so and cite the nearest verified source. Never fabricate page numbers.

## 5. Answer-type labeling

AI outputs must visually distinguish:

- **Official text** — verbatim or faithfully extracted official content;
- **Official answer** — answer provided by the official answer key;
- **CivilMind explanation** — AI-generated explanation;
- **Inference** — reasoned conclusion not explicitly stated in the source;
- **Prediction** — probabilistic trend estimate;
- **Generated practice** — newly generated non-official question.

Generated questions must never be displayed as official past-exam questions.

## 6. Question analysis contract

A full AI question analysis may include:

- official answer;
- concise solution path;
- why the correct option is correct;
- why other options are incorrect;
- relevant clauses and pages;
- common traps and mistakes;
- similar official questions;
- difficulty and concept classification;
- whether the question is textual, conceptual, computational or combined;
- edition sensitivity;
- a generated follow-up practice question.

If the official key is disputed or inconsistent with source text, display the conflict rather than silently choosing one side.

## 7. Topic history and trend analysis

For requests such as “Which questions have appeared from this topic?” return a structured list grouped by:

- exam session;
- discipline;
- qualification;
- question number;
- source clause;
- official answer;
- link to the separated descriptive explanation.

Trend and future-priority features must use language such as `higher historical frequency`, `estimated priority` or `probability`. Never claim certainty about future exam questions.

## 8. AI Copilot context

The Copilot should receive structured context, not only visible text:

- current route;
- selected discipline and qualification;
- current source/document ID;
- page, chapter and clause;
- current question and answer state;
- user progress and permitted memory;
- active entitlement and remaining quota.

The Copilot must avoid leaking content from inaccessible private uploads or other users.

## 9. Voice architecture

Voice features include:

- speech-to-text input;
- text-to-speech output;
- voice-to-voice conversation;
- regulation reading;
- oral quiz mode;
- audio summaries;
- playback speed and resume state.

Always show the transcript. Users must be able to pause, stop, replay and correct speech recognition. Voice responses follow the same citation rules as text and should expose citations in the visual transcript.

## 10. Document intelligence

Supported initial inputs:

- PDF;
- common image formats.

Future-ready inputs:

- CAD-related exports;
- spreadsheets.

Uploaded documents must be isolated per user and processed with explicit lifecycle controls. AI may summarize, explain, compare, extract clauses and answer questions, but must state whether the result comes from an official platform source or a user-uploaded file.

## 11. Personal learning memory

Permitted memory may include:

- selected discipline and qualification;
- weak and strong topics;
- solved questions;
- recurring mistake categories;
- study time;
- preferred explanation depth;
- plan progress.

Users must be able to inspect, reset or disable personalized memory. Do not infer sensitive personal traits.

## 12. Readiness and weakness analysis

Readiness is an estimate, not a guaranteed probability of passing. The UI must disclose major inputs, such as:

- coverage of relevant topics;
- official and practice exam performance;
- recency and consistency;
- answer confidence;
- time management.

Weakness classification may include conceptual gap, source-navigation issue, calculation error, time pressure and likely carelessness. Do not state a cause as fact when evidence is weak.

## 13. Failure and uncertainty behavior

When evidence is unavailable:

- do not hallucinate;
- state what is missing;
- suggest the closest verified source or next action;
- allow the user to report an incorrect mapping;
- log retrievable diagnostics without exposing private content.

## 14. Data model guidance

Keep stable entities for `Source`, `SourceEdition`, `SourceChunk`, `Exam`, `Question`, `OfficialAnswer`, `DescriptiveGuide`, `Citation`, `Topic`, `Discipline`, `Qualification`, `UserProgress`, `AIInteraction` and `GeneratedContent`.

Every generated output should retain provenance, model metadata, retrieval references, entitlement context and creation time.

## 15. Quality gates

Before enabling a new AI feature in production:

- test citation correctness;
- test edition and qualification filtering;
- test no-source behavior;
- test conflicting sources;
- test guest/free/Premium enforcement;
- test Persian RTL rendering;
- test prompt-injection resistance for uploaded documents;
- test that generated content is clearly labeled.