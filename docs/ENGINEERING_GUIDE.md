# LingoPop Architecture & Engineering Guide

This guide distills the system design practices that actually matter for an **offline-first, high-performance React Native (Expo) language learning app**, filtering out web-only and enterprise bloat.

---

## 1. Architecture & Separation of Concerns

* **Route vs. Logic Boundary:** Keep `src/app/` strictly for Expo Router screens and layouts. All domain engines, UI components, storage layers, and lesson data live outside `src/app/`:
  * `src/curriculum/` — Structured JSON/TS lesson definitions (Stage 0–3, HSK 1–9).
  * `src/engines/` — Pure TypeScript logic: FSRS spaced repetition, Pinyin/tone sandhi parser, Hanzi stroke evaluator, lesson state machine.
  * `src/storage/` — MMKV synchronous state and SQLite FTS5 persistence.
  * `src/components/` — Reusable UI primitives and interactive exercise renderers.
  * `src/theme/` — Design tokens, spacing, typography, and semantic tone colors.
* **Config-Driven Exercises:** Every exercise type (tone discrimination, Hanzi stroke tracing, sentence scramble, cloze fill-in-the-blank, speaking drill) must render from a typed JSON schema. Never hardcode individual screens per lesson.
* **Design System & Semantic Tone Colors:** Use a consistent design system with dedicated Mandarin tone colors as a visual memory aid:
  * **Tone 1 (High flat):** Coral Red (`#E63946`)
  * **Tone 2 (Rising):** Warm Amber (`#F4A261`)
  * **Tone 3 (Dipping):** Emerald Green (`#2A9D8F`)
  * **Tone 4 (Falling):** Royal Blue (`#3A86FF`)
  * **Neutral Tone:** Slate Gray (`#6C757D`)

---

## 2. State Management

* **Two-Tier Persistence Boundary:**
  * **MMKV (`src/storage/mmkv.ts`):** Synchronous app preferences, streaks, XP, current course/lesson pointer, audio speed setting.
  * **SQLite (`src/storage/database.ts`):** Normalized relational data (vocabulary, Hanzi stroke vectors, FSRS card states, lesson completion logs).
* **Deterministic Lesson State Machine:** Active lesson sessions (`intro -> prompt -> answer_checked -> retry_queue -> summary`) must run as an explicit state machine or reducer. Never rely on loose boolean flags (`isLoading`, `isCorrect`, `isFinished`) that can get out of sync and double-award XP or overlap audio.
* **Derived State Over Redundant Storage:** Calculate percentages, HSK mastery progress, and due review counts dynamically from SQLite/MMKV rather than storing duplicated counters that can drift.

---

## 3. Mobile Performance & Rendering

* **Virtualized Lists for Large Datasets:** HSK 1–9 and CC-CEDICT contain 10,000+ vocabulary entries and thousands of characters. Always use virtualized lists (`FlatList` or `@shopify/flash-list`) with stable `keyExtractor` and memoized row components—never `.map()` inside a `ScrollView`.
* **60/120fps Gesture & Canvas Isolation:** Hanzi stroke tracing (`@shopify/react-native-skia` + `react-native-gesture-handler` + `react-native-reanimated`) must update brush paths on the UI/worklet thread without triggering React re-renders on every finger move event.
* **Audio Preloading & Lifecycle Cleanup:** Preload the next exercise's audio clip while the learner is reading the current prompt, and always release or pause `expo-audio` players when leaving a screen to prevent overlapping sounds.
* **Font & Vector Memoization:** Load Chinese display/calligraphy fonts once at startup (`expo-font`) and memoize parsed SVG/Skia stroke path strings.

---

## 4. Offline-First & Safe Data Evolution

* **Offline-First by Default:** Every core lesson, dictionary lookup (via SQLite FTS5), stroke practice, and FSRS review must work seamlessly in Airplane Mode.
* **Schema Migrations (Never Wipe User Progress):** Use SQLite `PRAGMA user_version` (or a migrations table) whenever adding columns or tables so app updates preserve all user streaks, XP, and FSRS review history.
* **Data Portability:** Keep user learning data easy to export/import as JSON so learners truly own their progress.

---

## 5. Security & Data Integrity

* **Parameterized SQL Only:** Always pass `?` bind parameters to `expo-sqlite` queries (`db.getAllAsync('SELECT ... WHERE hsk_level = ?', [level])`)—never string-interpolate user input into SQL.
* **Zero Hidden Trackers / No Secrets in Bundle:** LingoPop is open source and privacy-first. Never embed telemetry SDKs or hardcode private API keys in the app bundle (if optional AI conversation features are added later, support user-supplied keys stored securely or local endpoints).

---

## 6. Accessibility & Learner Ergonomics

* **Never Rely on Color Alone:** Always pair semantic tone colors with explicit tone diacritics (`mā`, `má`, `mǎ`, `mà`) and pitch contour icons so colorblind learners get the exact same cues.
* **Audio Flexibility:** Provide both **1.0x natural speed** and **0.7x slow clarity playback** for every Mandarin clip, plus a **"Can't listen right now"** toggle for silent environments.
* **Tactile & Motion Respect:** Respect reduced-motion system preferences and provide an easy settings toggle for haptics (`expo-haptics`) and sound effects.

---

## 7. Reliability, Testing & Verification

* **Unit Test the Core Engines:** Write automated tests for deterministic logic—especially the **FSRS spaced repetition math**, **Pinyin tone sandhi rules** (e.g., 3rd + 3rd tone shifts, `不` and `一` tone changes), and **Hanzi stroke accuracy scoring**.
* **Pre-Commit Checks:** Run `npx expo lint`, `npx tsc --noEmit`, and `npx expo-doctor` before considering any feature complete.
