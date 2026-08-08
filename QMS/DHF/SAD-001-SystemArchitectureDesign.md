# SAD-001: System Architecture Design

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | SAD-001 |
| **Version** | 3.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-08-06 |
| **Status** | **Approved** 2026-08-05 |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 v2.0 Rev M, SRS-001 v3.1, SDD-001 v3.0, DCR-006 to DCR-020 |

---

## 1. Purpose

This document describes the high-level system architecture of the WBC ΔΣ application. It defines the software architecture, component decomposition, data flows, technology stack, and design rationale.

## 2. Architecture Overview

WBC ΔΣ is a single-page web application (SPA) implemented as a vanilla JavaScript IIFE (Immediately Invoked Function Expression) in a single file (`mdc-app.js`). All business logic, calculation, and rendering execute in the browser. There is no application framework, database, or network API. A Node.js static file server (`serve.js`) serves the HTML, JavaScript, JSON, and font assets.

### 2.1 Architecture Pattern

**Client-Side IIFE with Closure-Based State Management**

```
+-------------------------------------------------------------------+
|                        BROWSER CLIENT                              |
|                                                                    |
|  +-----------------------------------------------------------+    |
|  |                   mdc-app.js (IIFE)                        |    |
|  |                                                            |    |
|  |  +------------------+  +-----------------+                 |    |
|  |  | CLOSURE STATE    |  | EVENT LISTENERS |                 |    |
|  |  | - phase          |  | - keydown       |                 |    |
|  |  | - counts {}      |  | - click         |                 |    |
|  |  | - caseNumber     |  | - focus/blur    |                 |    |
|  |  | - specimenType   |  | - change        |                 |    |
|  |  | - config         |  |                 |                 |    |
|  |  | - sessionHistory |  |                 |                 |    |
|  |  +--------+---------+  +-------+---------+                 |    |
|  |           |                    |                            |    |
|  |           v                    v                            |    |
|  |  +------------------+  +-------------------+               |    |
|  |  | DOM RENDERING    |  | UTILITIES         |               |    |
|  |  | - Native DOM API |  | - calcPercent()   |               |    |
|  |  | - innerHTML      |  | - compileTemplate |               |    |
|  |  | - classList      |  | - computeFormula  |               |    |
|  |  +--------+---------+  +--------+----------+               |    |
|  |           |                      |                          |    |
|  +-----------------------------------------------------------+    |
|              |                                                     |
|              v                                                     |
|  +-------------------------------------------------------------------+
|  |                       DOM (counter.html)                           |
|  |  - Case Entry  - Counting Table  - Results  - History             |
|  +-------------------------------------------------------------------+
|              |                                                     |
|              v                                                     |
|  +-------------------+                                             |
|  |  CONFIGURATION    |                                             |
|  |  templates.json   |                                             |
|  +-------------------+                                             |
+-------------------------------------------------------------------+
           |
           v (HTTP GET — static assets only)
+-------------------------------------------------------------------+
|                     NODE.JS STATIC FILE SERVER                      |
|  serve.js on port 8089                                             |
|  Serves: counter.html, *.js, *.json, fonts, images                |
|  No dynamic server logic                                           |
+-------------------------------------------------------------------+
```

### 2.2 Design Rationale

| Decision | Rationale |
|----------|-----------|
| Client-side only | Eliminates server dependencies, network latency, and data privacy concerns. All patient data remains in the browser. |
| Vanilla JS IIFE | Zero framework overhead, zero dependencies. A single self-contained file is easy to audit, deploy, and maintain. Closure-based state prevents global namespace pollution. |
| JSON configuration | Cell types, key mappings, formulas, and output templates are externalized in `templates.json`, allowing customization without code changes. |
| `{{placeholder}}` templates | Simple string replacement is sufficient for output formatting. No template engine dependency needed. |
| No database | The tool is a counting aid, not a system of record. Session-only data eliminates PHI storage concerns. |
| Keyboard-driven input | Matches clinical workflow where operator's eyes are on the microscope. |
| Tailwind CSS, **vendored** | Utility-first styling with no build step. Served from `web/vendor/tailwind.js` and precached: URS-094 requires counting to work with no internet connection, which a CDN would defeat. |
| Node.js static server | Minimal footprint. No servlet container, no WAR file, no Java dependency. A single `npm start` command launches the server. |

---

## 3. Component Architecture

### 3.1 Component Diagram

The previous diagram drew a flat grid of counter features and omitted every
module added since DCR-006. It is redrawn by **layer**, because the layering is
the architecturally significant fact: the calculation engine sits below both
applications and touches no DOM, which is what allows the verification suite to
execute shipped code rather than a copy of it.

```
+---------------------------------------------------------------------------+
|  PAGES (static, no build step)                                            |
|                                                                            |
|   counter.html      editor.html      methods.html                          |
|                                      calculation-reference.html            |
|                                      help.html                             |
+-------------------+--------------------+----------------------------------+
                    |                    |
                    v                    v
+---------------------------+  +------------------------------------------+
|  COUNTER  (mdc-app.js)    |  |  EDITOR  (config-editor.js)              |
|                           |  |                                          |
|  Phase machine            |  |  Layout: drag and drop                   |
|   case-entry -> counting  |  |  Key capture + ergonomic zones           |
|   -> results              |  |  Report templates                        |
|                           |  |  COUNTING POLICY panel:                  |
|  Keyboard handler         |  |    denominator / per-100                 |
|   repeat + IME rejected   |  |    rounding, precision                   |
|   dialog owns the keys    |  |    confidence level                      |
|   printed key, then       |  |    thresholds                            |
|     physical position     |  |    derived figures                       |
|                           |  |                                          |
|  Rendering + autosave     |  |  Merges into the loaded profile;         |
|                           |  |  never rebuilds it  (HA-099)             |
+------------+--------------+  +--------------------+---------------------+
             |                                      |
             |        +-----------------------------+
             |        |
             v        v
+---------------------------------------------------------------------------+
|  SHARED (no DOM below this line, except the dialog which owns one)         |
|                                                                            |
|  +--------------------------------+   +--------------------------------+   |
|  |  wbc-core.js   CALCULATION     |   |  wbc-dialog.js   DIALOG        |   |
|  |  wbc-tones.js  TONE MAPPING    |   |                                |   |
|  |                                |   |                                |   |
|  |  denominator policy            |   |  alert / confirm / form        |   |
|  |  rounding (3 policies)         |   |  focus trapped and restored    |   |
|  |  Wilson intervals              |   |  owns the keyboard while open  |   |
|  |  diagnostic thresholds         |   |  Escape, except where both     |   |
|  |  derived figures               |   |    branches are consequential  |   |
|  |  template render + sanitise    |   +--------------------------------+   |
|  |  method provenance             |                                        |
|  |  validateConfig  <- the ONE    |   Shared by BOTH applications, so       |
|  |    gate every profile passes   |   they cannot diverge in appearance     |
|  |                                |   or behaviour.                        |
|  |  UMD, DOM-free: the same file  |                                        |
|  |  is require()d by the Node     |                                        |
|  |  suites and <script>-loaded    |                                        |
|  |  by the browser.               |                                        |
|  +----------------+---------------+                                        |
+-------------------+--------------------------------------------------------+
                    |
                    v
+---------------------------------------------------------------------------+
|  CONFIGURATION AND STORAGE                                                 |
|                                                                            |
|   settings/templates.json  -----+                                          |
|   settings/presets/*.json  -----+---> validateConfig ---> active profile    |
|   localStorage wbcds_config ----+          ^                               |
|                                            |                               |
|   supersede: shipped beats cached at the same profileId, higher version     |
|                                                                            |
|   localStorage  wbcds_autosave   crash recovery — HOLDS PATIENT DATA,       |
|                                  discarded after 12 h (§7.1)               |
|   sessionStorage wbcds_history   session list, theme, audio choice          |
+---------------------------------------------------------------------------+
                    |
                    v
+---------------------------------------------------------------------------+
|  DELIVERY                                                                  |
|   sw.js   shell cache-first  |  profiles network-first  |  CACHE_VERSION    |
|   vendor/tailwind.js, styles/theme.css — nothing render-blocking is remote  |
+---------------------------------------------------------------------------+
```

**What the layering buys.** The engine has no DOM, so it is testable directly
and cannot acquire hidden dependencies on the page. Both applications share it
and the dialog, so a fix reaches both. `validateConfig` is the single entry gate,
so a profile cannot arrive by one route that another would refuse. Everything
below the pages is a static file, so the shipped artefact and the verified
artefact are the same bytes.

### 3.2 Component Descriptions

#### 3.2.1 Case Identification Component
- **Responsibility**: Manages the case/accession number input. Case number is optional; "Start Count" is always enabled regardless of whether a case number is provided.
- **Inputs**: User keyboard input in the case number text field
- **Outputs**: Case number string (may be empty); transition to counting phase
- **SRS Trace**: SYS-001 through SYS-008

#### 3.2.2 Specimen Type Controller
- **Responsibility**: Manages BM/PB selection. Both specimen types use an identical 14-cell layout with the same key mappings. Locked once counting begins.
- **Inputs**: Radio button or selector change event
- **Outputs**: Active specimen type identifier (`bm` or `pb`); configuration selection including target count, formula availability, and `upperRowAbnormal` flag
- **SRS Trace**: SYS-010 through SYS-017

#### 3.2.3 Counting Engine
- **Responsibility**: Captures keyboard input and dispatches count changes. The key mapping comes from the active profile's `outCodes` and is **not fixed in code** — the literal mapping previously given here was withdrawn at v2.0. A key is resolved from the character produced, then from the physical key position, so Shift-decrement works for punctuation mappings (HA-104). Auto-repeat is rejected (HA-103). Derived figures recalculate on every keypress.
- **Inputs**: Document-level keydown events
- **Outputs**: Increment/decrement signals to specific cell types; updated M:E ratio
- **SRS Trace**: SYS-030 through SYS-039

#### 3.2.4 Counting Table Renderer
- **Responsibility**: Renders and updates the visual counting table in a two-row layout. Upper row contains 7 precursor cell types plus a subtotal; lower row contains 7 mature cell types plus a subtotal. A grand total is displayed below. When the active specimen type has `upperRowAbnormal: true` (PB mode), the upper row is flagged with an amber border to highlight abnormal precursor presence.
- **Inputs**: Cell type definitions from configuration; count values from Counting Engine
- **Outputs**: Rendered HTML table with counts, percentages, key labels, subtotals, and grand total
- **SRS Trace**: SYS-020 through SYS-026

#### 3.2.5 Calculation Engine
- **Responsibility**: Computes differential percentages from raw counts and M:E ratio from configuration formulas
- **Inputs**: Cell count values (integers), total count, formula definitions from configuration
- **Outputs**: Percentage values (2 decimal places); M:E ratio (1 decimal place, from config formula `numerator` / `denominator` cell groups)
- **Algorithm**: `percentage = (cell_count / total_count) * 100`, rounded to 2 decimal places. M:E ratio computed as `sum(numerator cells) / sum(denominator cells)`.
- **Edge Cases**: Division by zero returns 0.00 for percentages, "N/A" for M:E ratio
- **SRS Trace**: SYS-040 through SYS-045

#### 3.2.6 Morphology Comments Component
- **Responsibility**: Captures and manages free-text morphology observations. Implemented as a collapsible text area. When focused, keyboard counting is suspended (keyboard isolation). Comments are preserved across resume counting cycles.
- **Inputs**: User text input in comment textarea; focus/blur events
- **Outputs**: Comment text for inclusion in output
- **SRS Trace**: SYS-070 through SYS-073

#### 3.2.7 Count Completion Controller
- **Responsibility**: Manages the transition from counting to results phase. Direct finalization without a blocking modal. If the total count is below the advisory target (BM=500, PB=200), a non-blocking informational note is displayed but does not prevent completion.
- **Inputs**: "Count Done" button click
- **Outputs**: Phase transition to COMPLETED; output generation trigger; detach keydown listener
- **SRS Trace**: SYS-050 through SYS-056

#### 3.2.8 Count Resumption Controller
- **Responsibility**: Allows the user to return from the results phase to the counting phase. Preserves all existing tallies, case number, specimen type, and morphology comments. Re-attaches the document keydown listener so counting can continue from where it left off.
- **Inputs**: "Continue Counting" button click from the results phase
- **Outputs**: Phase transition from COMPLETED back to COUNTING with preserved state
- **SRS Trace**: SYS-055 through SYS-056

#### 3.2.9 Output Generator
- **Responsibility**: Compiles output templates with count data using `{{placeholder}}` string replacement syntax, including `{{ME_ratio}}` for the M:E ratio. Renders output in tabbed panels (one tab per template defined in configuration).
- **Inputs**: Template definitions from configuration, count data, case number, morphology comments, computed M:E ratio
- **Outputs**: Rendered HTML in tabbed panels; clipboard-ready text
- **SRS Trace**: SYS-060 through SYS-067

#### 3.2.10 Reset Controller
- **Responsibility**: Manages the reset workflow including confirmation and state clearing
- **Inputs**: "Reset" button click
- **Outputs**: Clear signal to all state; phase transition to IDLE; focus management
- **SRS Trace**: SYS-080 through SYS-084

#### 3.2.11 Session History Manager
- **Responsibility**: Stores completed count sessions in sessionStorage and provides CSV/JSON export
- **Inputs**: Completed count data from Count Completion Controller
- **Outputs**: Read-only session data for review; downloadable CSV and JSON files
- **SRS Trace**: SYS-090 through SYS-095

#### 3.2.12 Configuration Loader
- **Responsibility**: Fetches and validates the `templates.json` configuration via `fetch()`. Configuration schema includes `categories` (upper/lower cell groups), `outCodes` (key mappings), `formulas` (M:E ratio definition), `targetCount`, `upperRowAbnormal` flag, and `templates` (output format definitions).
- **Inputs**: HTTP GET to `settings/templates.json`
- **Outputs**: Parsed configuration objects; error state if load fails (full-page error message displayed)
- **SRS Trace**: SYS-100 through SYS-103

#### 3.2.13 Progress Indicator
- **Responsibility**: Displays live counting progress in "N / target (target)" format. Updates on every keypress to show how close the operator is to the advisory target count for the active specimen type.
- **Inputs**: Current total count; target count from configuration
- **Outputs**: Rendered progress text in the counting UI
- **SRS Trace**: SYS-040

---

#### 3.2.9 Calculation Engine (`wbc-core.js`)

- **Responsibility**: Every reported number. Denominator policy, rounding,
  confidence intervals, thresholds, derived figures, template rendering,
  serialisation, configuration validation and the method statement.
- **Architectural significance**: it is a **UMD module with no DOM access**.
  Nothing in it touches `document`, `window` or storage. That boundary is why
  the unit layer executes the shipped calculation rather than a reimplementation
  of it — the same file is `require`d by Node and loaded by a `<script>` tag.
- **Inputs**: raw counts, a specimen configuration
- **Outputs**: percentages, intervals, ratios, rendered templates, validation errors
- **Design detail**: SDD-001 §3.10
- **SRS Trace**: SYS-040 to SYS-045, SYS-180 to SYS-185

#### 3.2.10 Configuration Lifecycle

- **Responsibility**: Resolve the active profile from the shipped file and the
  `localStorage` cache, validate both, apply the supersede rule, and support
  import and export.
- **Architectural significance**: `validateConfig` is the **single gate**. Load,
  import and editor-save all pass through it, so a profile cannot enter by one
  route that another would refuse.
- **Design detail**: SDD-001 §3.11
- **SRS Trace**: SYS-100 to SYS-103

#### 3.2.11 Dialog (`wbc-dialog.js`)

- **Responsibility**: Acknowledgement, confirmation and short forms, for both
  the counter and the editor.
- **Architectural significance**: one widget, shared. It replaced the browser's
  `prompt()`, which ignores the theme, cannot state a rule and suspends the
  page. It also owns the keyboard while open — counting keys do not reach the
  tally (HA-102).
- **Design detail**: SDD-001 §3.18

#### 3.2.12 Tonal Feedback Mapping (`wbc-tones.js`)

- **Responsibility**: the category-to-pitch mapping, envelope parameters and
  per-press humanisation. Pure functions; no AudioContext, no DOM.
- **Architectural significance**: the mapping is **derived from the profile's
  category order and cannot be configured**. There is no tone field in the
  schema, so no tone can disagree with the profile it belongs to — the same
  rule as the keyboard grid in `wbc-core.js`. Being DOM-free, the mapping is
  unit-tested through `require`, which is what allows the discrimination
  guarantee (≥2 semitones between adjacent categories, at every profile size)
  to be asserted rather than assumed.
- **Design detail**: SDD-001 §3.19
- **SRS Trace**: SYS-254 to SYS-258

#### 3.2.13 Configuration Editor (`config-editor.js`)

- **Responsibility**: Drag-and-drop layout, key capture, report templates, the
  morphology checklist, and the Counting Policy panel.
- **Architectural significance**: it **merges into the loaded profile rather
  than rebuilding it**. Rebuilding from its own form fields destroyed every
  field it did not model — the denominator policy, the thresholds, the M:E
  formula — while reporting success (HA-099).
- **Design detail**: SDD-001 §3.17
- **SRS Trace**: SYS-177 to SYS-179, SYS-240 to SYS-243

#### 3.2.13 Offline Shell (`sw.js`)

- **Responsibility**: Precache the application shell; serve profiles
  network-first.
- **Architectural significance**: it is what makes URS-094 true rather than
  aspirational, and it is also why a stale `CACHE_VERSION` can hide a fix from
  every installed browser.
- **Design detail**: SDD-001 §3.15, §5.4 below

---

## 4. Data Flow

These flows previously stopped at "recalculate percentages" and "compile the
template". Everything DCR-006 onward added — the denominator policy, the
rounding policy, the confidence intervals, the threshold advisory, the method
statement, autosave, and the guards on the keyboard — was absent, and §4.4
described a reset that clears the specimen type and re-enables a locked
selector. Neither happens.

### 4.1 Primary Counting Data Flow

```
[User presses a key]
       |
       v
[Document keydown]
       |
       +--> [Counting not active?] ------------------> ignore
       +--> [Comment field focused?] ----------------> key goes to the textarea
       +--> [A dialog is open?] --------------------->  the dialog owns the
       |                                                keyboard  (HA-102)
       +--> [Ctrl / Alt / Meta held?] ---------------> ignore
       +--> [ev.repeat] ----------------------------->  auto-repeat is not a
       |                                                deliberate act (HA-103)
       +--> [ev.isComposing] ------------------------>  belongs to the input
       |                                                method editor
       +--> [target is INPUT / TEXTAREA / SELECT] ---> ignore
       |
       v
[Resolve the key against the profile's outCodes]
   printed character first  (AZERTY / QWERTZ keep their labels)
   then the physical key position, which Shift does not change  (HA-104)
       |
       +--> no match ---------------------------------> ignore
       |
       v
[Shift held?] -- yes --> [Decrement, floored at zero]
       |
       no
       v
[Increment]
       |
       v
[AudioEngine: click, or undo — profile default, session override]
       |
       v
+---------------- wbc-core.js, per keystroke -------------------------+
|  getDenominator(counts, denominatorExcludes)                        |
|  percentagesSummingTo100(counts, precision.display, {exclude,       |
|                          method})        <- rounding policy         |
|  computePer100 for each excluded category                           |
|  computeFormula for each derived figure                             |
+---------------------------------------------------------------------+
       |
       v
[Render: cell counts, percentages, per-100 values, subtotals,
         grand total split as "N cells (+M outside differential)",
         derived figures, progress "N / target"]
       |
       v
[Flash the affected cell]
       |
       v
[saveAutosaveState() -> localStorage wbcds_autosave]
   case number, specimen, counts, comments, checklist, timestamp
```

### 4.2 Count Completion Data Flow

```
[User clicks "Count Done"]
       |
       v
[Detach the keydown listener — keystrokes can no longer alter the tally]
       |
       v
[Set phase to RESULTS]
       |
       v
+---------------- wbc-core.js, once -----------------------------------+
|  percentagesSummingTo100(counts, precision.report, {exclude,        |
|                          method})                                    |
|  wilsonInterval(count, denominator, level) for each category         |
|  evaluateThresholds  -> which thresholds the intervals SPAN          |
|  buildLowCountNote   -> sub-target advisory, quantified              |
|  computeFormula      -> ratios and subset percentages                |
|  buildMethodStatement-> profile, denominator, rounding, precision,   |
|                         interval level, M:E composition, citations   |
|  renderTemplate + sanitizeTemplateHtml for each output template      |
+----------------------------------------------------------------------+
       |
       v
[Render the results screen]
   percentages with intervals
   NEAR A DIAGNOSTIC THRESHOLD advisory, if any interval spans one
   sub-target advisory, if below target        <- both ADVISORY, never blocking
   method statement (disclosure)
   tabbed output, each carrying "[profileId vX.Y · timestamp]"  (URS-052)
       |
       v
[Append to session history -> sessionStorage]
       |
       v
[Discard the autosave snapshot — the count is no longer interrupted]
       |
       v
[Operator may enter an analyser WBC]
       |
       v
[nrbc per 100 > 0 and not declared already corrected?]
       |                              |
      yes                            no
       |                              |
       v                              v
[correctWbcForNrbc]              [use as entered]
   WBC x 100 / (100 + nrbc/100)
       |                              |
       +--------------+---------------+
                      |
                      v
[Show the arithmetic, then computeAbsolute per category]
[If absoluteCountsInReport: re-render the templates with {{*_abs}}]
```

### 4.3 Resume Counting Data Flow

```
[User clicks "Continue Counting" from the results screen]
       |
       v
[Set phase to COUNTING; re-attach the keydown listener]
       |
       v
[Preserve every tally, the case number, the specimen type,
 the comments and the morphology checklist]
       |
       v
[Re-render the counting grid; autosave resumes on the next keystroke]
```

`Continue Counting` is why URS-043 (locking the table after completion) was
withdrawn: a near-threshold advisory is only useful if the operator can act on
it, and acting on it means counting more cells into the same tally.

### 4.4 Reset / New Case Data Flow

```
[User clicks "Reset"]
       |
       v
[Any cells counted?] -- no --> [reset immediately]
       |
      yes
       v
[Confirmation dialog — Cancel is ALWAYS offered]
       |
[Confirmed?] -- no --> [abort, nothing changes]
       |
      yes
       v
[Detach the keydown listener]
[Clear counts, case number, comments, morphology checklist]
[Discard the autosave snapshot]
[PRESERVE the specimen type — the next case on a bench is usually the same]
[Set phase to case-entry; focus the case field]
```

Two corrections to the previous revision: reset **preserves** the specimen type
(URS-063), and there is no selector to re-enable — the specimen type can be
changed during counting, which saves the count in progress to history first
(URS-013).

### 4.5 Configuration Resolution Data Flow

Absent from the previous revision entirely.

```
[Page load]
       |
       +--> fetch settings/templates.json  (network-first via sw.js)
       +--> read localStorage wbcds_config
       |
       v
[validateConfig on BOTH]
       |
       +--> neither valid --> [full-page error; refuse to count]
       |
       v
[cached valid, and shipped has the same profileId at a HIGHER version?]
       |                          |
      yes                        no
       |                          |
       v                          v
[use shipped, tell the       [use cached, else shipped]
 operator, replace cache]
       |                          |
       +------------+-------------+
                    v
             [active profile]
```

Import, editor-save and load all pass through the same `validateConfig`, so a
profile cannot enter by one route that another would refuse.

---

## 5. Technology Stack

### 5.1 Runtime Environment

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Server | Node.js static file server (`serve.js`) | Static asset serving on port 8089 |
| Page Engine | Plain HTML (`counter.html`) | SPA entry point |
| Framework | None — vanilla JavaScript IIFE (`mdc-app.js`) | Complete application logic |
| DOM Manipulation | Native DOM API | Element creation, updates, event handling |
| Templating | `{{placeholder}}` string replacement | Output template rendering |
| Styling | Vendored Tailwind + `web/styles/theme.css` | Utility-first styling; one shared stylesheet carries the light theme, the muted-tone corrections and the print rules |
| Fonts | Google Fonts (Inter, JetBrains Mono, Libre Franklin) | Typography |

### 5.2 File Organization

```
web/
├── counter.html                  # The counting application
├── editor.html                   # Configuration editor
├── methods.html                  # Methods and Limitations (MAL-001)
├── calculation-reference.html    # Calculation Reference (CAL-001)
├── help.html                     # Quick start guide
├── sw.js                         # Service worker — offline shell (§5.4)
├── styles/
│   └── theme.css                 # One shared stylesheet: themes, print, primitives
├── vendor/
│   └── tailwind.js               # Vendored, not fetched from a CDN
├── scripts/
│   ├── wbc-core.js               # Calculation engine — DOM-free (§3.2.9)
│   ├── wbc-dialog.js             # Shared dialog widget (§3.2.11)
│   ├── wbc-tones.js              # Category-to-pitch mapping (§3.2.12)
│   ├── mdc-app.js                # Counter: state and rendering
│   └── config-editor.js          # Editor: layout, keys, counting policy
└── settings/
    ├── templates.json            # The built-in configuration profile
    └── presets/                  # Catalogue of alternative profiles + index.json
```

The earlier revision of this section listed `logo-showcase.html`, **which does
not exist**, and omitted the editor, both documentation pages, the service
worker, the stylesheet, the vendored bundle, the preset catalogue and three of
the four scripts.

### 5.3 Script Loading

Load order matters and is fixed:

```
wbc-core.js      →   wbc-dialog.js   →   mdc-app.js        (counter.html)
wbc-core.js      →   wbc-dialog.js   →   config-editor.js  (editor.html)
```

`wbc-core.js` first because both consumers call it; `wbc-dialog.js` before the
application so `showModal` has something to delegate to. No bundler, no module
loader, no dependency resolution — the tags are the dependency graph.

The earlier revision described "a single `<script>` tag" loading `mdc-app.js`.

**Nothing render-blocking is fetched from a third party.** Google Fonts are
requested and are a progressive enhancement: absent, the local font stack
applies and nothing else changes. This is verified, not asserted — VV-SYS-091
and VV-SYS-155 fail if any third-party script is requested.

### 5.4 Offline Delivery

`sw.js` precaches the shell — every page, all four scripts, the stylesheet and
the vendored Tailwind — **cache-first**. Configuration profiles are
**network-first with a cache fallback**, so a corrected profile is seen when the
network is available and the application still boots when it is not.

`CACHE_VERSION` is the release lever: an installed browser keeps serving the old
shell until it changes. It has been forgotten twice, which is why every change
record now states the bump.

---

## 6. State Management

### 6.1 Application States

```
                        (Continue Counting — tally intact)
                    +---------------------------------------+
                    |                                       |
                    v                                       |
  [IDLE] --(Start Count)--> [COUNTING] --(Count Done)--> [RESULTS]
    ^  ^                     |     ^                        |
    |  |                     |     |                        |
    |  |    (Switch specimen:|     |                        |
    |  |     save to history,+-----+                        |
    |  |     fresh tally)                                   |
    |  |                                                    |
    |  +--(Restore an interrupted count, on load)-----------+
    |                                                       |
    +---------------------(Reset / New Case)----------------+
```

| State | `phase` | What is live | Controls |
|-------|---------|--------------|----------|
| IDLE | `case-entry` | Nothing counted. Case number optional; Start Count always enabled | Case field, specimen selector, Start Count, configuration controls |
| COUNTING | `counting` | Document keydown listener attached; autosave written on every keystroke | Counting keys, specimen switcher, Count Done, Reset, morphology comments |
| RESULTS | `results` | Keydown detached — keystrokes can no longer alter the tally | Output tabs, Copy, Print, analyser WBC, Continue Counting, New Case, history |

Three transitions the previous revision omitted:

- **Specimen switch during counting.** The selector is *not* locked. Switching
  saves the count in progress to session history and starts a fresh tally
  (URS-013), so work is never silently discarded.
- **Crash recovery into COUNTING.** A surviving autosave snapshot offers Restore
  on load, which re-enters COUNTING with the tally intact. That dialog is
  non-dismissible: its Cancel is *Discard* (§7.1, HA-102).
- **Continue Counting** is why URS-043 (locking after completion) was withdrawn.
  A near-threshold advisory is only useful if the operator can act on it.

There is still no separate CASE_ENTERED state: the case number is optional.

### 6.2 State in Memory

The single closure-scoped `state` object in `mdc-app.js`:

| Field | Type | Notes |
|-------|------|-------|
| `phase` | string | `case-entry` \| `counting` \| `results` |
| `caseNumber` | string | Optional; **patient-identifying** |
| `specimenType` | string | Profile-defined, not a fixed `bm`/`pb` pair |
| `isCountingActive` | boolean | Gates the keydown handler |
| `commentFieldFocused` | boolean | Keeps counting keys out of the textarea |
| `config` | array | The **normalised, validated** specimenTypes of the active profile |
| `configMeta` | object | `{ profileId, profileName, version }` — stamped into every report (URS-052) |
| `counts` | object | `{ cellType: number }` — the tally |
| `morphChecked` | array | Morphology checklist selections (URS-073) |
| `sessionHistory` | array | Completed sessions this browser session |
| `activeTab`, `theme`, `audioEnabled`, `autosaveEnabled`, `targetReachedNotified` | — | Presentation and one-shot flags |

Percentages, intervals, per-100 values, derived figures and the method statement
are **not stored in `state`**. They are computed from `counts` by `wbc-core.js`
on demand, so there is no second copy to fall out of step with the tally. They
are materialised once, into the immutable session object, at Count Done.

### 6.3 State at Rest

| Key | Store | Holds | Lifetime | Patient data |
|-----|-------|-------|----------|--------------|
| `wbcds_history` | sessionStorage | Completed sessions, for review and export | Until the tab closes | **Yes** — case numbers, comments |
| `wbcds_theme` | sessionStorage | Presentation theme | Until the tab closes | No |
| `wbcds_audio` | sessionStorage | Operator's audio choice, overriding the profile default | Until the tab closes | No |
| `wbcds_config` | **localStorage** | The active configuration profile | Until replaced or reset | No |
| `wbcds_autosave` | **localStorage** | Crash-recovery snapshot: case number, specimen, counts, comments, checklist, timestamp | Discarded on completion, on reset, and on load if older than **12 hours** | **Yes** |

The previous revision recorded the tally as *"closure state, lost on page
close"*. That has not been true since autosave: an interrupted count survives a
browser restart on that workstation, which is the point of the feature and also
the residual exposure recorded in §7.1 and RA-001.

**Why two stores.** sessionStorage is the right home for anything whose lifetime
should be the sitting — the history list, the theme. localStorage is required
for the two things that must outlive a crash or a restart: the configuration a
laboratory has adopted, and a count that was interrupted. The second is the only
patient data the product deliberately persists beyond the tab, and it is bounded
in time for that reason.

### 6.4 Configuration State

`state.config` is the **normalised** profile, not the file. Normalisation and
validation happen once, at resolution (§4.5), so no consumer re-parses or
re-checks. `state.configMeta` carries the identity into every report, which is
what makes a figure traceable to the conventions that produced it (URS-052).

Neither is mutated during counting. A specimen switch selects a different entry
within the same profile; changing the profile itself returns to IDLE.

---

## 7. Security Architecture

### 7.1 Data Privacy

| Concern | Mitigation |
|---------|-----------|
| Patient data transmission | No network transmission of patient data. All processing is client-side. The server serves static assets only. |
| **Data at rest — sessionStorage** | Session history and the theme. Cleared when the tab closes. |
| **Data at rest — localStorage** | Two things. The active configuration profile (`wbcds_config`), which holds no patient data. And, while a count is in progress, a crash-recovery snapshot (`wbcds_autosave`) which **does**: the accession number and the free-text morphology comments. It survives a browser restart, is discarded on completion, on reset, and on load if older than 12 hours. On a shared workstation this is residual data at rest; the control is local policy — a per-user profile, or clearing browsing data between operators. Recorded in RA-001. |
| Cookies, IndexedDB | Not used. |
| Cross-site scripting (XSS) | Rendered output **is** inserted with `innerHTML`, so the control is sanitisation rather than avoidance: `WBCCore.sanitizeTemplateHtml` escapes the rendered template before insertion, and `escapeHtml` / `escapeAttr` escape every interpolated value. Profiles are shared between institutions as JSON files, which is the delivery path this defends against. |
| Server-side data exposure | No server-side processing of patient data. Node.js server serves static files only with path traversal protection. |

> **Corrected 2026-08-06 (DCR-021).** This table previously stated
> *"sessionStorage only … No localStorage, no cookies, no IndexedDB"* and that
> output avoided `innerHTML`. Neither was true. The same false privacy claim was
> found in `README.md` by independent review and corrected under DCR-015; it was
> not propagated here, which is the `HA-097` failure mode applied to a document
> a privacy officer reads.

### 7.2 Input Validation

| Input | Validation Rule |
|-------|----------------|
| Case number | Free text, optional. Trimmed before use. |
| Keyboard input | Only keys mapped by the **active profile** are processed; all others are ignored. The key set is configuration, not a constant — the literal list previously given here (`R, L, O, M, …`) was withdrawn at v2.0. Shift decrements. Auto-repeat and input-method composition are rejected (HA-103), and no keystroke reaches the tally while a dialog is open (HA-102). |
| Morphology comments | Free text. Keyboard isolation prevents counting keypresses from being captured while textarea is focused. |
| Configuration JSON | Loaded via `fetch()`. Application displays a full-page error if the configuration fails to load. |

---

## 8. Deployment Architecture

```
+-------------------+          +----------------------------+
|  Lab Workstation   |  HTTP    |  Node.js Server            |
|  (Browser)         | <------> |  (serve.js on port 8089)   |
|                    |          |                            |
|  - Chrome/FF/Edge  |          |  /web/                     |
|  - All logic runs  |          |    counter.html            |
|    client-side     |          |    scripts/mdc-app.js      |
|                    |          |    settings/templates.json  |
+-------------------+          +----------------------------+
```

- No external service dependencies
- No database
- No API endpoints
- No WAR file, no servlet container
- Deployment: `npm start` launches `serve.js` on port 8089
- Single static file directory (`web/`) contains all application assets

---

## 9. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| 3.0 | 2026-08-06 | QMS | **Revised for drift.** §7.1 stated "sessionStorage only … no localStorage" and that output avoided `innerHTML`; both false, and the same privacy claim corrected in README.md under DCR-015 had not been propagated. §3.2.3 and §7.2 carried the key mapping withdrawn at v2.0. Tailwind was described as CDN-delivered in three places, which would defeat URS-094. §5.2 listed a file that does not exist and omitted three of four scripts, the service worker, the stylesheet, the vendored bundle and the preset catalogue; §5.3 described a single script tag. §3.2.9 to §3.2.13 added for the calculation engine, configuration lifecycle, dialog, editor and offline shell — five components previously absent. See DCR-021. |
| 3.1 | 2026-08-06 | QMS | §3.1 redrawn by layer — the previous diagram was a flat grid of counter features that omitted every module added since DCR-006, including the engine that computes every number in it. §4 flows rewritten: they stopped at "recalculate percentages" and "compile the template", omitting the denominator policy, rounding, confidence intervals, the threshold advisory, the method statement, autosave and every keyboard guard. §4.4 claimed reset clears the specimen type and re-enables a locked selector; it preserves the type and nothing is ever locked. §4.5 (configuration resolution) added, previously absent. UD-075 to UD-078. |
| 3.2 | 2026-08-06 | QMS | §6 rewritten. §6.1 omitted three transitions that exist — the mid-count specimen switch, crash recovery back into COUNTING, and the reason URS-043 was withdrawn — and implied the specimen selector locks. §6.2 documented nine of fifteen state fields and recorded the tally as "closure state, lost on page close", which autosave made false. §6.3 (state at rest) and §6.4 (configuration state) added: both localStorage keys were undocumented, including the recovery snapshot that holds patient data. UD-079 to UD-081 extract the state fields and storage keys from the source, so an undocumented field fails the build. |
| A | 2026-02-18 | QMS | Initial draft — architecture defined |
| B | 2026-02-19 | QMS | Component descriptions refined |
| C | 2026-02-20 | QMS | Data flow diagrams updated |
| D | 2026-02-24 | QMS | v2.0 — Complete rewrite for vanilla JS IIFE architecture. Removed Backbone.js, jQuery, Handlebars, Underscore, JSP, Tomcat. Added Node.js static server, Tailwind CSS, closure-based state, Continue Counting flow, M:E ratio, Progress Indicator, two-row table layout with upper-row abnormal flagging. |

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Software Architect | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
