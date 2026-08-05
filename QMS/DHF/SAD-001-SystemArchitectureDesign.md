# SAD-001: System Architecture Design

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | SAD-001 |
| **Version** | 2.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-02-24 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 v2.0, SRS-001 v2.0 |

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
| Tailwind CSS via CDN | Utility-first styling eliminates custom CSS maintenance. CDN delivery avoids local build steps. |
| Node.js static server | Minimal footprint. No servlet container, no WAR file, no Java dependency. A single `npm start` command launches the server. |

---

## 3. Component Architecture

### 3.1 Component Diagram

```
+-------------------------------------------------------------------+
|                     APPLICATION COMPONENTS                         |
|                                                                    |
|  +-----------------------+     +------------------------------+    |
|  | CASE IDENTIFICATION   |     | SPECIMEN TYPE CONTROLLER     |    |
|  | - Case number input   |     | - BM/PB selector            |    |
|  | - Optional (not       |     | - Both use identical         |    |
|  |   mandatory)          |     |   14-cell layout             |    |
|  | - Start Count always  |     | - Lock after start           |    |
|  |   enabled             |     |                              |    |
|  +-----------+-----------+     +-------------+----------------+    |
|              |                               |                     |
|              v                               v                     |
|  +-----------------------+     +------------------------------+    |
|  | COUNTING ENGINE       |     | COUNTING TABLE RENDERER      |    |
|  | - Document keydown    |     | - Upper row (7 precursors    |    |
|  |   listener            |     |   + subtotal)                |    |
|  | - Unified 14-key map  |     | - Lower row (7 mature       |    |
|  | - Increment/Decrement |     |   + subtotal)                |    |
|  | - Visual feedback     |     | - Grand total                |    |
|  | - M:E ratio update    |     | - Amber border on upper row  |    |
|  |   on every keypress   |     |   when upperRowAbnormal=true |    |
|  +-----------+-----------+     +-------------+----------------+    |
|              |                               |                     |
|              v                               v                     |
|  +-----------------------+     +------------------------------+    |
|  | CALCULATION ENGINE    |     | MORPHOLOGY COMMENTS          |    |
|  | - Percentage calc     |     | - Collapsible text area      |    |
|  | - Division by zero    |     | - Keyboard isolation         |    |
|  | - Rounding            |     | - Preserved across resume    |    |
|  | - M:E ratio from      |     |   cycles                     |    |
|  |   config formulas     |     | - Output integration         |    |
|  +-----------+-----------+     +------------------------------+    |
|              |                                                     |
|              v                                                     |
|  +-----------------------+     +------------------------------+    |
|  | COUNT COMPLETION      |     | OUTPUT GENERATOR             |    |
|  | - Direct finalization |     | - {{placeholder}} template   |    |
|  |   (no blocking modal) |     |   compilation                |    |
|  | - Non-blocking note   |     | - {{ME_ratio}} support       |    |
|  |   if below target     |     | - Tabbed display             |    |
|  | - Detach keydown      |     | - Copy to clipboard          |    |
|  +-----------+-----------+     +------------------------------+    |
|              |                                                     |
|              v                                                     |
|  +-----------------------+     +------------------------------+    |
|  | COUNT RESUMPTION      |     | SESSION HISTORY MANAGER      |    |
|  | - Continue Counting   |     | - sessionStorage-based       |    |
|  |   from results phase  |     | - CSV/JSON export            |    |
|  | - Preserve all tallies|     | - Read-only review           |    |
|  | - Re-attach keydown   |     +------------------------------+    |
|  +-----------+-----------+                                         |
|              |                                                     |
|              v                                                     |
|  +-----------------------+     +------------------------------+    |
|  | RESET CONTROLLER      |     | PROGRESS INDICATOR           |    |
|  | - Confirmation dialog |     | - "N / target" format        |    |
|  | - State clearing      |     | - Updates live on each       |    |
|  | - Focus management    |     |   keypress                   |    |
|  +-----------------------+     +------------------------------+    |
|                                                                    |
|  +-----------------------+                                         |
|  | CONFIGURATION LOADER  |                                         |
|  | - fetch() to          |                                         |
|  |   templates.json      |                                         |
|  | - Schema: categories, |                                         |
|  |   formulas, targetCount,                                        |
|  |   upperRowAbnormal    |                                         |
|  | - Error handling      |                                         |
|  +-----------------------+                                         |
+-------------------------------------------------------------------+
```

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
- **Responsibility**: Captures keyboard input and dispatches count changes. Uses a unified 14-key mapping: R=nrbc, L=blasts, O=pro, M=myelo, T=meta, C=plasma, S=mast, B=bands, P=poly, A=baso, E=eos, N=mono, Y=lymph, X=other. Triggers M:E ratio recalculation on every keypress.
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

## 4. Data Flow

### 4.1 Primary Counting Data Flow

```
[User presses key]
       |
       v
[Document keydown event]
       |
       v
[Comment field focused?] --Yes--> [Key goes to textarea; counting suspended]
       |
       No
       |
       v
[Counting Engine: map key to cell type via outCodes]
       |
       +---> [Is Shift held?]
       |         |
       |    Yes  |  No
       |         |
       v         v
  [Decrement] [Increment]
       |         |
       +----+----+
            |
            v
  [Update cell count in closure state]
            |
            v
  [Update total count + subtotals]
            |
            v
  [Calculation Engine: recalculate all percentages]
            |
            v
  [Calculation Engine: recalculate M:E ratio from formula]
            |
            v
  [Update DOM: cell counts, percentages, subtotals, grand total, M:E ratio]
            |
            v
  [Update progress indicator: "N / target"]
            |
            v
  [Visual feedback flash on affected cell]
```

### 4.2 Count Completion Data Flow

```
[User clicks "Count Done"]
       |
       v
[Total below advisory target?]
       |
  Yes  |  No
       |
       v         |
[Display non-blocking   |
 informational note]    |
       |                |
       +-------+--------+
               |
               v
  [Detach keydown listener]
               |
               v
  [Set phase to COMPLETED]
               |
               v
  [For each output template:]
  [  Compile {{placeholder}} template with:]
  [    - case number                       ]
  [    - total count                       ]
  [    - per-cell percentages              ]
  [    - morphology comments               ]
  [    - M:E ratio                         ]
               |
               v
  [Render tabbed output display]
               |
               v
  [Save to session history (sessionStorage)]
```

### 4.3 Resume Counting Data Flow

```
[User clicks "Continue Counting" from results phase]
       |
       v
[Set phase to COUNTING]
       |
       v
[Preserve all existing state:]
[  - cell counts (unchanged)  ]
[  - case number (unchanged)  ]
[  - specimen type (unchanged)]
[  - morphology comments      ]
       |
       v
[Re-attach document keydown listener]
       |
       v
[Re-render counting table with current data]
       |
       v
[User resumes keyboard counting]
```

### 4.4 Reset / New Case Data Flow

```
[User clicks "Reset"]
       |
       v
[Any count data > 0?]
       |
  Yes  |  No
       |
       v         |
[Confirmation dialog]  |
       |               |
[User confirms?]       |
       |               |
  No:  |  Yes:         |
[Abort] |              |
       +--------+------+
                |
                v
  [Clear all cell counts to 0]
  [Clear all percentages to 0.00%]
  [Clear total to 0]
  [Clear output text]
  [Clear morphology comments]
  [Clear case number]
  [Set phase to IDLE (case-entry)]
  [Enable specimen type selector]
  [Focus case number input]
```

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
| Styling | Tailwind CSS via CDN + inline styles | Utility-first responsive styling |
| Fonts | Google Fonts (Inter, JetBrains Mono, Libre Franklin) | Typography |

### 5.2 File Organization

```
web/
├── counter.html              # Main SPA entry point
├── help.html                 # Quick start guide
├── logo-showcase.html        # Logo showcase
├── settings/
│   └── templates.json        # Configuration (14 cell types, unified keys, formulas, templates)
└── scripts/
    └── mdc-app.js            # Complete application logic (single IIFE)
```

### 5.3 Script Loading

A single `<script>` tag loads `mdc-app.js`. The IIFE executes immediately, calling `fetch()` to load `settings/templates.json` asynchronously before initializing the application. There are no framework libraries to load, no dependency ordering concerns, and no module bundler.

External resources loaded via CDN:
1. Tailwind CSS (`cdn.tailwindcss.com`) — utility-first CSS framework
2. Google Fonts (Inter, JetBrains Mono, Libre Franklin) — typography

---

## 6. State Management

### 6.1 Application States

```
                                  +---(Continue Counting)---+
                                  |                         |
                                  v                         |
[IDLE] ──(Start Count)──> [COUNTING] ──(Count Done)──> [COMPLETED]
  ^                                                         |
  |                                                         |
  +──────────────────(Reset)────────────────────────────────+
```

| State | Phase Value | Description | Active Controls |
|-------|-------------|-------------|-----------------|
| IDLE | `case-entry` | Welcome screen; case number input (optional), specimen type selector | Case number input, specimen type selector, Start Count button |
| COUNTING | `counting` | Active keydown listener; counting in progress | Keyboard input, Count Done, Reset, Morphology Comments |
| COMPLETED | `results` | Count finalized; output displayed | Output tabs, Copy to Clipboard, Continue Counting, Reset, Session History |

Note: There is no separate CASE_ENTERED state. The case number is optional, and Start Count is always enabled. The COMPLETED state allows transition back to COUNTING via the "Continue Counting" button.

### 6.2 Data in Memory

| Data Item | Type | Scope | Persistence |
|-----------|------|-------|-------------|
| Cell counts | Object `{ cellType: number }` | Per counting session | Closure state, lost on page close |
| Percentages | Computed on the fly | Per counting session | Calculated from counts, not stored independently |
| Case number | String | Per counting session | Closure state |
| Specimen type | String (`bm` or `pb`) | Per counting session | Closure state |
| Morphology comments | String | Per counting session | Closure state; preserved across resume cycles |
| Application phase | String (`case-entry`, `counting`, `results`) | Application lifetime | Closure state |
| Template configuration | JSON array | Application lifetime | Loaded from file via `fetch()` on page load |
| Session history | Array of objects | Browser session | sessionStorage (`wbcds_history`) |
| Theme preference | String (`dark` or `light`) | Browser session | sessionStorage (`wbcds_theme`) |

---

## 7. Security Architecture

### 7.1 Data Privacy

| Concern | Mitigation |
|---------|-----------|
| Patient data transmission | No network transmission of patient data. All processing is client-side. The server serves static assets only. |
| Data at rest | sessionStorage only; cleared on tab/window close. No localStorage, no cookies, no IndexedDB. |
| Cross-site scripting (XSS) | Output templates use string replacement without `innerHTML` injection of user input. Case number and comment inputs are escaped on output. |
| Server-side data exposure | No server-side processing of patient data. Node.js server serves static files only with path traversal protection. |

### 7.2 Input Validation

| Input | Validation Rule |
|-------|----------------|
| Case number | Free text, optional. Trimmed before use. |
| Keyboard input | Only mapped keys (R, L, O, M, T, C, S, B, P, A, E, N, Y, X) are processed; all others ignored. Shift modifier triggers decrement. |
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
| A | 2026-02-18 | QMS | Initial draft — architecture defined |
| B | 2026-02-19 | QMS | Component descriptions refined |
| C | 2026-02-20 | QMS | Data flow diagrams updated |
| D | 2026-02-24 | QMS | v2.0 — Complete rewrite for vanilla JS IIFE architecture. Removed Backbone.js, jQuery, Handlebars, Underscore, JSP, Tomcat. Added Node.js static server, Tailwind CSS, closure-based state, Continue Counting flow, M:E ratio, Progress Indicator, two-row table layout with upper-row abnormal flagging. |

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Software Architect | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
