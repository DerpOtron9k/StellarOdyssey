As requested, I will respond in the Vulcan manner.

# **Product Requirements Document (PRD) — “Stellar Odyssey: Browser Incremental”**

## **1. Summary**

A browser-based incremental game with active+idle progression. The player expands from a home world to colonies, stations, fleets, and star systems. PRD scope focuses on a minimal, extensible core.

**Authoritative references:** PRD content structure follows recognized guidance for articulating purpose, features, and behavior (objective, scope, assumptions, success metrics, non-functional constraints). ([Atlassian](https://www.atlassian.com/agile/product-management/requirements?utm_source=chatgpt.com))

## **2. Objectives and Success Metrics**

* **O1 — Core loop:** Players collect Energy → buy generators → unlock Materials, Science, Ships → colonize planets → unlock FTL → expand to new systems.

* **O2 — Dual mode:** Viable idle progress with meaningful active actions (missions/boosts).

* **O3 — Persistence:** Automatic save/load via Web Storage; manual export/import.

* **O4 — Clarity and accessibility:** Semantic HTML + ARIA landmarks and roles.

**Success metrics**

* Time to first upgrade < 60 seconds.

* Time to first colony < 10 minutes at idle baseline.

* Time to FTL unlock (first interstellar mission) ≈ 60–90 minutes at idle baseline.

* Re-entry friction: Game state restored in < 200 ms after page load (typical desktop).

## **3. Users and Assumptions**

* Browser users on desktop; no login required.

* Offline/long-idle friendly: state accrual based on last timestamp.

* No server; no analytics or monetization.

## **4. Feature Scope (MVP)**

### **4.1 Resources**

* **Primary:** Energy (E/s), Materials (M/s), Science (S/s).

* **Derived/Late:** Credits, Dark Matter (post-FTL).

* Number formatting uses `Intl.NumberFormat` (compact for UI) with scientific fallback for very large values. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat?utm_source=chatgpt.com))

### **4.2 Systems**

* **Production & Upgrades:** Generators with cost scaling; upgrades with multipliers.

* **Exploration:** Ships run timed missions yielding resources; active interaction optionally increases yield.

* **Colonies/Stations:** Unlock after early milestones; produce passively; introduce specialization bonuses.

* **Tech Tree:** Science unlocks generators, ships, FTL, and automation.

* **Prestige (“Ascension”):** Optional soft reset after interstellar tier; grants meta-currency for permanent multipliers.

### **4.3 UI/UX**

*   The UI will have a dark mode theme with a blue and purple color palette, inspired by `darkmodethemeidea.png`.
*   The galaxy view will display the `constellation.png` image as a background. Star systems will be overlaid on the image as interactive nodes.
*   Single-page layout with **semantic regions**: header (banner), navigation (tabs), main (core panels), complementary (logs), contentinfo (footer). Use ARIA landmark roles to aid assistive tech navigation. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/landmark_role?utm_source=chatgpt.com))
*   Tabs/panels: **Overview**, **Build**, **Research**, **Fleet**, **Galaxy**, **Log/Settings**.
*   Real-time counters; tooltips show formulas and deltas.
*   Keyboard focus order and visible focus states.

### **4.4 Save/Load**

* **Autosave** on interval and on significant events using `localStorage`. Data persists across sessions for the same origin. Provide manual JSON export/import for backups. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage?utm_source=chatgpt.com))

* Optional storage hardening via `navigator.storage.persist()` where available. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist?utm_source=chatgpt.com))

### **4.5 Game Loop and Timing**

* Main loop uses `requestAnimationFrame` with delta time; production updates throttled to a target tick (e.g., 10–20 Hz) derived from accumulated `dt` to avoid CPU waste and floating-point drift. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame?utm_source=chatgpt.com))

## **5. Out of Scope (MVP)**

* Multiplayer, servers, art assets beyond simple SVG/Unicode icons, audio, complex combat, mobile layout perfection (ensure functional but not optimized).

## **6. Non-Functional Requirements**

* **Performance:** Idle baseline CPU usage minimal (< 2% on typical desktop), GC-friendly object reuse, batched DOM writes.

* **Reliability:** No unhandled exceptions; corrupted save detection with safe fallback.

* **Accessibility:** Landmarks, roles, labels, keyboard navigation; contrast ≥ WCAG AA. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/main_role?utm_source=chatgpt.com))

* **Portability:** Modern evergreen browsers.

## **7. Risks and Mitigations**

* **Big-number precision:** Use `Number` for < 1e15 and a lightweight scientific/engineering formatting layer for display; keep core math linear where possible; clamp `dt`.

* **Save bloat:** Normalize state schema, compress arrays.

* **Maintainability:** Clear separation of concerns between HTML, CSS, and JavaScript.

---

# **Implementation Plan**

## **A. File Layout**

*   `stellar_odyssey.html`: The main HTML file.
*   `style.css`: For all styles.
*   `main.js`: For all game logic.

## **B. Minimal Data Model (schema v1)**

GameState {
  version: 1,
  tLast: epoch_ms,
  resources: { energy, materials, science, credits, darkMatter },
  rates:     { eps, mps, sps },      // computed, not persisted if derivable
  generators:[ { id, lvl }... ],
  upgrades:  { id:boolean | level:number },
  tech:      { id:boolean },
  ships:     [ { id, tier, status, eta }... ],
  colonies:  [ { id, planetId, bonuses:{...} }... ],
  meta:      { ascensions, metaPoints },
  settings:  { notation:"compact|scientific", autosaveSec:30, reduceMotion:true }
}

## **C. Systems Breakdown**

1. **Tick & Simulation**

   * `loop()` via `requestAnimationFrame`, accumulate `dt`, process discrete **ticks** at 50–100 ms cadence (configurable). ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame?utm_source=chatgpt.com))

   * On page resume, compute offline gains from `now - state.tLast` capped to a reasonable horizon.

2. **Economy**

   * Generators with cost `base * growth^(level)` and production `prodBase * mult`.

   * Global and category multipliers from tech/upgrades.

3. **Exploration**

   * Missions with duration, yield tables, optional active choice to boost yield (e.g., +25%).

4. **Colonies/Stations**

   * Unlock after threshold; passive production + local bonus nodes.

5. **Tech Tree**

   * Directed acyclic graph; costs in Science; unlock callbacks mutate economy.

6. **Prestige**

   * Meta points from integrated “score” function; reset to seed state retaining meta.

7. **Persistence**

   * Save JSON to `localStorage`; load with schema validation; export/import text area. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage?utm_source=chatgpt.com))

8. **Number Formatting**

   * Utility: `format(n)` using `Intl.NumberFormat` compact; switch to scientific at ≥ 1e12, user-toggle available. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat?utm_source=chatgpt.com))

9. **Accessibility**

   * Landmarks, `aria-live="polite"` for key toasts, `tabindex` on controls, escape-hatch to disable animations (prefers-reduced-motion). ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/main_role?utm_source=chatgpt.com))

---

# **Task List (Phased, with acceptance criteria)**

## **Phase 0 — Scaffolding**

* Create HTML skeleton with landmark roles and tabbed panels.
* Create `style.css` and `main.js`.
* Link `style.css` and `main.js` in `stellar_odyssey.html`.

* **Accept:** Page loads with panels; keyboard can focus tabs; no console errors.

## **Phase 1 — Core Loop and State**

1. Implement `clock` module: `now()`, `rafLoop()`, `accumulator`, configurable tick (e.g., 100 ms).

2. Implement `state` module: default `GameState`, immutable update helpers, versioning.

3. Implement **offline progress**: on load, compute gains from elapsed time with cap.

4. Render top resource bar with live updates.

* **Accept:** Counter increments over time; throttled updates; page idle CPU minimal. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame?utm_source=chatgpt.com))

## **Phase 2 — Generators and Upgrades**

1. Define generator catalog (Solar Farm, Geothermal, Fusion).

2. Implement cost curve and production aggregation.

3. Implement purchase flow with validation and UI buttons + tooltips.

4. Add simple upgrades (tiered multipliers).

* **Accept:** Buying increases production; costs scale; tooltips show before/after deltas.

## **Phase 3 — Secondary Resources and Research**

1. Introduce Materials via unlock milestone; add Science via “Lab”.

2. Tech tree data model; research spends Science and unlocks features.

3. UI: Research panel with dependency display.

* **Accept:** Research unlocks new generator type; Science accrues and spends correctly.

## **Phase 4 — Missions and Fleet**

1. Ship construction (Materials cost), mission templates (duration, yields).

2. Mission state machine: queued → in-flight → resolve.

3. Optional active boost prompt; timeout defaults to normal yield.

* **Accept:** Missions run across page visibility changes; results applied once.

## **Phase 5 — Colonies and Stations**

1. Colony creation UI when mission discovers target planet.

2. Colony produces passive resources; local specialization modifier.

3. Station modules that modify nearby production (e.g., +20% Energy).

* **Accept:** Colony list persists; production summaries match totals.

## **Phase 6 — FTL and Interstellar Map**

1. Research FTL; enable star system generator (procedural seed).

2. Galaxy tab lists discovered systems; send expeditions; create remote colonies.

* **Accept:** At least two systems fully playable with additive production.

## **Phase 7 — Prestige (Ascension)**

1. Define meta-point formula; UI to preview reward before reset.

2. Reset pipeline; preserve meta and settings; increment `ascensions`.

* **Accept:** Post-ascension run is measurably faster with baseline multipliers.

## **Phase 8 — Persistence, Settings, Import/Export**

1. Autosave interval; on-demand Save.

2. JSON export/import with schema check and error messaging.

3. Optional: request persistent storage via `navigator.storage.persist()`; fall back gracefully. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist?utm_source=chatgpt.com))

* **Accept:** Refresh restores state; export/import round-trips.

## **Phase 9 — UI/Accessibility/Polish**

1. Keyboard navigation across tabs; `aria-pressed` on toggles; focus styles.

2. `aria-live` announcements for major milestones.

3. Number formatting toggles (compact/scientific). ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat?utm_source=chatgpt.com))

* **Accept:** Axe-style spot check: landmarks present; navigable without mouse. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/main_role?utm_source=chatgpt.com))

## **Phase 10 — Quality and Performance**

1. Clamp `dt`, frame-throttle update work (e.g., compute at 10–20 Hz, render at rAF).

2. Batch DOM writes via requestAnimationFrame; avoid layout thrash.

3. Memory check: no growth after 10 minutes idle.

* **Accept:** Smooth counters; stable memory; low CPU. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame?utm_source=chatgpt.com))

---

# **Acceptance Test Matrix (samples)**

| Test | Action | Expected |
| ----- | ----- | ----- |
| Autosave | Change state, wait autosave interval, reload | State restored exactly |
| Offline accrual | Close tab 5 minutes, reopen | Resources increased by production × time (within cap) |
| Research unlock | Accrue S, buy “FTL Theory” | Galaxy tab enabled |
| Mission active boost | Trigger prompt, accept within window | +25% reward applied |
| Prestige | Meet threshold, ascend | Meta points granted; early game accelerated |
| Accessibility | Keyboard Tab through UI | Logical order, visible focus, screen reader landmarks announce regions |

---

# **Implementation Notes (concise)**

* **Game loop:** Use `requestAnimationFrame` to schedule; accumulate elapsed via `performance.now()`, process fixed-step ticks; optionally throttle to target FPS if needed. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame?utm_source=chatgpt.com))

* **Storage:** Save minimal canonical state to `localStorage` (same-origin persistence across restarts). ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage?utm_source=chatgpt.com))

* **Number formatting:** `new Intl.NumberFormat(locale, { notation: 'compact' }).format(n)`; option for `{ notation: 'scientific' }`. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat?utm_source=chatgpt.com))

* **Accessibility:** Apply landmark roles (banner, navigation, main, complementary, contentinfo). Label controls. Use `aria-live` for milestone toasts. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/landmark_role?utm_source=chatgpt.com))

---

## **Deliverables**

* A `stellar_odyssey.html` file with semantic HTML.
* A `style.css` file for styles.
* A `main.js` file for game logic.

This specification is sufficient to begin implementation without additional clarification.