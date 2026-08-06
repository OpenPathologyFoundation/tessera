# SDD-001: Software Detailed Design

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | SDD-001 |
| **Version** | 3.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-08-06 |
| **Status** | **Approved** 2026-08-05 |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 v2.0 Rev M, SRS-001 v3.1, SAD-001 v2.0, DCR-006 to DCR-018 |

---

## 1. Purpose

This document provides the detailed software design for WBC ΔΣ. It specifies the implementation of each module, data structures, algorithms, DOM structure, event handling, and inter-module communication. This document provides sufficient detail for implementation and code review.

## 2. Scope

Covers the single-file vanilla JavaScript application (`mdc-app.js`), HTML structure (`counter.html`), Tailwind CSS styling (CDN), and the configuration file schema (`settings/templates.json`). The application uses no framework dependencies -- all functionality is implemented as a self-contained IIFE (Immediately Invoked Function Expression).

---

## 3. Module Detailed Designs

### 3.1 Namespace and Initialization (mdc-app.js)

#### 3.1.1 IIFE Closure Pattern

All application state and functions are encapsulated in a single IIFE. There is no global namespace pollution.

```javascript
(function () {
    'use strict';
    // --- closure state ---
    let specConfigs = [];    // Loaded from templates.json
    let specConfig = null;   // Active specimen type config
    let counts = {};         // { cellType: count }
    let keydownHandler = null;
    let currentPhase = 'case-entry'; // 'case-entry' | 'counting' | 'results'
    // ... DOM references cached on DOMContentLoaded
})();
```

The `state` object consolidates all mutable application state within the closure:

```javascript
const state = {
    phase: 'case-entry',       // case-entry | counting | results
    caseNumber: '',
    specimenType: 'bm',
    isCountingActive: false,
    commentFieldFocused: false,
    config: null,              // loaded from templates.json
    counts: {},                // { cellType: number }
    sessionHistory: [],        // array of completed sessions
    activeTab: 0,
    theme: 'dark'
};
```

#### 3.1.2 State Transitions

The application uses a three-phase UI model: case-entry, counting, and results. There is no CASE_ENTERED state; Start Count is always enabled (case number is optional).

| From | Event | To | Actions |
|------|-------|----|---------|
| case-entry | Start Count clicked | counting | Attach keydown, render counter table, show counting phase |
| counting | Count Done clicked | results | Detach keydown, finalize, generate output |
| results | Continue Counting clicked | counting | Re-attach keydown, restore counter table |
| results | New Case clicked | case-entry | Clear all data, show case-entry phase |
| Any | Page load | case-entry | Fetch config, render case-entry phase |

Phase transitions are managed by the `showPhase(phase)` function, which toggles visibility of the three phase containers (`phase-case-entry`, `phase-counting`, `phase-results`) and controls the header logo visibility.

---

### 3.2 Data Models

All data is represented as plain JavaScript objects. There are no Backbone models or framework-level data structures.

#### 3.2.1 Counts Object

```javascript
state.counts = {};  // { cellType: integer }
```

Initialized when counting begins by iterating over the active specimen config's `outCodes` values and setting each to zero:

```javascript
state.counts = {};
Object.values(specConfig.outCodes).forEach(function (cellType) {
    state.counts[cellType] = 0;
});
```

#### 3.2.2 Specimen Config

`state.config` holds the parsed array from `templates.json`. The active specimen config is retrieved via:

```javascript
function getSpecConfig() {
    return state.config.find(function (s) {
        return s.specimenType === state.specimenType;
    });
}
```

#### 3.2.3 Session History Entry

Each completed counting session is saved as a plain object:

```javascript
{
    caseNumber: '',           // string
    specimenType: '',         // string ('bm' | 'pb')
    specimenLabel: '',        // string ('Bone Marrow' | 'Peripheral Blood')
    timestamp: '',            // ISO 8601 string
    totalCount: 0,            // integer
    counts: {},               // { cellType: count }
    percentages: {},          // { cellType: float }
    meRatio: '',              // string ('3.2:1' | 'N/A' | null)
    morphologyComments: '',   // string
    outputs: {}               // { tplCode: outputString }
}
```

Session history is stored as a plain array in `state.sessionHistory` and serialized to `sessionStorage` under the key `wbcds_history`.

---

### 3.3 Collections

There are no Backbone collections. Session history is a plain JavaScript array (`state.sessionHistory`). Persistence is handled by two functions:

```javascript
function loadSessionHistory() {
    try {
        const data = sessionStorage.getItem('wbcds_history');
        if (data) state.sessionHistory = JSON.parse(data);
    } catch (e) { /* graceful degradation */ }
}

function saveSessionHistory() {
    try {
        sessionStorage.setItem('wbcds_history', JSON.stringify(state.sessionHistory));
    } catch (e) { /* graceful degradation */ }
}
```

---

### 3.4 Functions (replacing Backbone Views)

All UI rendering and interaction is handled by standalone functions within the IIFE closure. There are no Backbone views.

#### 3.4.1 renderCounterTable()

Builds a two-row counter table using `specConfig.categories.upper` and `.lower`. Creates a reverse map (cellType to key) from `outCodes`. Calls `renderRowGroup()` for each row group. Also renders the grand total display, M:E ratio (if formulas are present), and progress bar toward the target count.

```
FUNCTION renderCounterTable()
    specConfig = getSpecConfig()
    outCodes = specConfig.outCodes
    categories = specConfig.categories

    // Build reverse map: cellType -> key
    cellToKey = {}
    FOR EACH key IN outCodes
        cellToKey[outCodes[key]] = key
    END FOR

    // Render upper row group (Precursors)
    html += renderRowGroup('Precursors', categories.upper, cellToKey, specConfig.upperRowAbnormal)

    // Render lower row group (Mature)
    html += renderRowGroup('Mature', categories.lower, cellToKey, false)

    // Render grand total, M:E ratio (if applicable), progress bar
    el('counter-table-area').innerHTML = html
END FUNCTION
```

#### 3.4.2 renderRowGroup(label, cells, cellToKey, flagAbnormal)

Renders one row group with a header label, per-cell columns (key, name, count, percentage), and a subtotal column. If `flagAbnormal` is true, adds an amber dashed border around the group to indicate abnormality in peripheral blood specimens.

```
FUNCTION renderRowGroup(label, cells, cellToKey, flagAbnormal)
    INPUT: label (string, 'Precursors' or 'Mature')
           cells (array of cell type names)
           cellToKey (object, cellType -> keyboard key)
           flagAbnormal (boolean)
    OUTPUT: HTML string

    IF flagAbnormal THEN
        Apply 'border border-dashed border-amber-500/50' class
        Show 'Abnormal in PB' label
    END IF

    Render <table> with 4 rows:
        Row 1 (thead): Cell type names (uppercase) + 'Sub' header
        Row 2 (tbody): Count values (id="val-{cellType}"), initialized to 0
                       Subtotal column (id="val-sub-{label}")
        Row 3 (tbody): Percentage values (id="pct-{cellType}"), initialized to '0.00%'
                       Subtotal percentage (id="pct-sub-{label}")
        Row 4 (tbody): Keyboard key labels in <kbd> elements

    RETURN html
END FUNCTION
```

**DOM ID Convention for Counter Elements**:
- Cell count value: `val-{cellType}` (e.g., `val-blasts`)
- Cell percentage: `pct-{cellType}` (e.g., `pct-blasts`)
- Row subtotal: `val-sub-{rowLabel}` (e.g., `val-sub-precursors`)
- Row subtotal percentage: `pct-sub-{rowLabel}` (e.g., `pct-sub-precursors`)
- Cell wrapper (for flash): `cell-{cellType}` (e.g., `cell-blasts`)

#### 3.4.3 updateCounterDisplay()

Updates all count values, percentages, subtotals, grand total, M:E ratio (if formulas are present), and the progress bar. Called after every increment or decrement.

```
FUNCTION updateCounterDisplay()
    specConfig = getSpecConfig()
    total = getTotal()

    // Update each cell value and percentage
    FOR EACH cellType IN outCodes values
        count = state.counts[cellType]
        el('val-' + cellType).textContent = count
        IF total == 0 THEN
            el('pct-' + cellType).textContent = '0.00%'
        ELSE
            pct = (count / total) * 100
            el('pct-' + cellType).textContent = pct.toFixed(2) + '%'
        END IF
    END FOR

    // Calculate and display subtotals for upper and lower rows
    upperSub = SUM(state.counts[ct] for ct in categories.upper)
    lowerSub = SUM(state.counts[ct] for ct in categories.lower)
    el('val-sub-precursors').textContent = upperSub
    el('val-sub-mature').textContent = lowerSub

    // Subtotal percentages (show em-dash when total is 0)
    el('pct-sub-precursors').textContent = total > 0 ? (upperSub/total*100).toFixed(2)+'%' : '—'
    el('pct-sub-mature').textContent = total > 0 ? (lowerSub/total*100).toFixed(2)+'%' : '—'

    // Grand total
    el('val-grand-total').textContent = total

    // M:E ratio
    IF specConfig has ME_ratio formula THEN
        el('val-me-ratio').textContent = computeMERatio(specConfig) || 'N/A'
    END IF

    // Progress bar
    pctProgress = MIN((total / specConfig.targetCount) * 100, 100)
    el('progress-bar').style.width = pctProgress + '%'
    IF total >= targetCount THEN bar color = emerald ELSE bar color = blue
    el('progress-label').textContent = total + ' / ' + targetCount + ' (target)'
END FUNCTION
```

#### 3.4.4 computeMERatio(specConfig)

Computes the M:E ratio from `specConfig.formulas.ME_ratio`. Returns a string like `"3.2:1"` or `"N/A"` when the denominator is zero. Returns `null` if no ME_ratio formula is defined.

```
FUNCTION computeMERatio(specConfig)
    INPUT: specConfig (object with optional formulas.ME_ratio)
    OUTPUT: string ("X.X:1") or "N/A" or null

    IF no formulas or no ME_ratio THEN RETURN null

    formula = specConfig.formulas.ME_ratio
    numSum = SUM(state.counts[ct] for ct in formula.numerator)
    denSum = SUM(state.counts[ct] for ct in formula.denominator)

    IF denSum == 0 THEN RETURN 'N/A'

    ratio = numSum / denSum
    RETURN ratio.toFixed(formula.precision) + ':1'
END FUNCTION
```

#### 3.4.5 finalizeCount()

Generates output text for all templates. Substitutes `{{cellType}}`, `{{total}}`, `{{ME_ratio}}`, `{{comments}}`, and `{{caseNumber}}` placeholders. Saves session to history. Transitions to results phase.

```
FUNCTION finalizeCount()
    state.isCountingActive = false
    DETACH keydown listener

    specConfig = getSpecConfig()
    total = getTotal()

    // Calculate percentages for each cell type
    percentages = {}
    FOR EACH cellType IN outCodes values
        percentages[cellType] = total > 0 ? (state.counts[cellType] / total * 100) : 0
    END FOR

    // Compute M:E ratio
    meRatio = computeMERatio(specConfig)

    // Build output for each template
    outputs = {}
    FOR EACH template IN specConfig.templates
        text = template.outSentence
        REPLACE {{caseNumber}} with state.caseNumber
        REPLACE {{total}} with total
        REPLACE {{comments}} with morphology comments
        REPLACE {{ME_ratio}} with meRatio or 'N/A'
        FOR EACH cellType
            REPLACE {{cellType}} with Math.round(percentages[cellType])
        END FOR
        outputs[template.tplCode] = text
    END FOR

    // Build session object and save to history
    session = { caseNumber, specimenType, specimenLabel, timestamp, totalCount,
                counts, percentages, meRatio, morphologyComments, outputs }
    addToHistory(session)

    // Transition to results phase
    showPhase('results')
    renderResults(session)
END FUNCTION
```

#### 3.4.6 resumeCounting()

Re-enters the counting phase with existing counts preserved. Re-attaches the keydown listener. Calls `renderCounterTable()` and `updateCounterDisplay()`.

```
FUNCTION resumeCounting()
    state.isCountingActive = true

    showPhase('counting')
    renderCounterTable()
    updateCounterDisplay()
    updateCaseBadge()

    // Re-lock specimen selector and case input
    el('specimenType').disabled = true
    el('caseNumber').readOnly = true

    // Re-attach keyboard listener
    ATTACH keydown listener
END FUNCTION
```

#### 3.4.7 startCount() (via btnStartCount click handler)

Transitions from case-entry to counting. Builds the initial counts object (all zeros), renders the counter table, and attaches the keydown handler. Case number is optional; Start Count is always enabled.

```
FUNCTION startCount()
    clearClipboard()

    state.caseNumber = caseInput.value.trim()
    state.specimenType = specSelect.value
    state.isCountingActive = true

    // Initialize counts to zero for this specimen type
    specConfig = getSpecConfig()
    state.counts = {}
    FOR EACH cellType IN specConfig.outCodes values
        state.counts[cellType] = 0
    END FOR

    // Update UI
    showPhase('counting')
    renderCounterTable()
    updateCaseBadge()

    // Lock specimen selector and case input
    specSelect.disabled = true
    caseInput.readOnly = true

    // Attach keyboard listener
    ATTACH keydown listener
END FUNCTION
```

#### 3.4.8 renderResults(session)

Renders the results phase with a summary table (case number, specimen label, total count, per-cell percentages, M:E ratio, morphology comments) and tabbed output panels for each template. Tab switching is handled by click event delegation.

#### 3.4.9 renderHistoryList()

Renders the session history list in reverse chronological order. Each entry shows case number, specimen label, total count, and timestamp. Clicking an entry opens a modal with full session details.

#### 3.4.10 showPhase(phase)

Manages phase transitions by toggling visibility of the three phase containers. Controls header logo visibility (hidden during case-entry, visible during counting and results). Adds `counting-active` class to `<body>` during the counting phase.

#### 3.4.11 Theme Management

Four functions manage the light/dark theme:
- `getPreferredTheme()`: Checks sessionStorage, falls back to `prefers-color-scheme` media query, defaults to `'dark'`
- `applyTheme(theme)`: Sets the `data-theme` attribute on `<html>` (`document.documentElement`), updates toggle button label
- `setTheme(theme, persist)`: Applies theme and optionally persists to sessionStorage (key: `wbcds_theme`)
- `toggleTheme()`: Switches between light and dark

#### 3.4.12 Export Functions

- `exportSessionJson()`: Serializes `state.sessionHistory` to pretty-printed JSON, triggers download as `wbcds-session-{timestamp}.json`
- `exportSessionCsv()`: Builds CSV with headers (caseNumber, specimenType, specimenLabel, timestamp, totalCount, morphologyComments, counts, percentages, outputs), triggers download as `wbcds-session-{timestamp}.csv`
- `buildExportFilename(ext)`: Generates filename with ISO timestamp prefix `wbcds-session-`

---

### 3.5 Business Logic

#### 3.5.1 addToCell(cellType, isDecrement)

Handles cell count increment and decrement via the keydown handler. This is not a separate named function; the logic is inline within `onKeyDown()`.

```
FUNCTION onKeyDown(ev) -- increment/decrement logic:
    IF isDecrement AND state.counts[cellType] <= 0 THEN
        RETURN  // Floor at zero, no negative counts
    END IF

    IF isDecrement THEN
        state.counts[cellType]--
        flashCell(cellType, 'decrement')
    ELSE
        state.counts[cellType]++
        flashCell(cellType, 'increment')
    END IF

    CALL updateCounterDisplay()
END
```

Visual flash feedback is provided by `flashCell(cellType, direction)`, which briefly applies CSS class `flash-increment` (green) or `flash-decrement` (red) for 250ms.

#### 3.5.2 Percentage computation

**Superseded by §3.10.2.** This section previously described the computation as

```
percentage = (state.counts[cellType] / total) * 100      // then toFixed(2)
```

That has not been the implementation since DCR-006. It is wrong in three ways
that each change a reported number:

1. the denominator is not the total — categories may be excluded from it
   (§3.10.1);
2. rounding is a selectable policy, not `toFixed` (§3.10.2);
3. display precision and report precision are separate and configurable.

The description is retained rather than deleted so that a reader of an earlier
revision can see what changed.

#### 3.5.3 generateOutput(specConfig, counts, caseNumber, comments)

Output generation is performed within `finalizeCount()`. For each template in `specConfig.templates`, placeholders are replaced using simple string replacement (regex-based):

- `{{caseNumber}}` -- replaced with `state.caseNumber`
- `{{total}}` -- replaced with total count (integer)
- `{{comments}}` -- replaced with morphology comments (trimmed)
- `{{ME_ratio}}` -- replaced with computed M:E ratio or `'N/A'`
- `{{cellType}}` -- replaced with `Math.round(percentage)` for each cell type

No Handlebars or template engine is used. All substitution is via `String.replace()` with regex patterns.

#### 3.5.4 getTotal()

```javascript
function getTotal() {
    var sum = 0;
    Object.values(state.counts).forEach(function (v) { sum += v; });
    return sum;
}
```

---

### 3.6 Application Bootstrap

There is no Backbone Router. Initialization is performed by the IIFE calling `loadConfig()` at the bottom of the closure:

```javascript
async function loadConfig() {
    try {
        const resp = await fetch('settings/templates.json');
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        state.config = await resp.json();
        // Add targetCount defaults if missing
        state.config.forEach(function (spec) {
            if (!spec.targetCount) {
                spec.targetCount = DEFAULT_TARGET[spec.specimenType] || 200;
            }
        });
        loadSessionHistory();
        init();
    } catch (e) {
        // Display full-page error message; disable all controls
        document.body.innerHTML = '<div>Configuration Error: ' + e.message + '</div>';
    }
}

// BOOT
loadConfig();
```

**Bootstrap Sequence**:
1. IIFE executes immediately; applies saved theme via `applyTheme(getPreferredTheme())`
2. `loadConfig()` fetches `settings/templates.json`
3. On success: parses JSON, applies default target counts, loads session history from sessionStorage, calls `init()`
4. `init()` caches DOM references, attaches event listeners (Start Count, Count Done, Reset, Copy, Resume, New Case, Theme Toggle, Export), renders initial history list, focuses case number input
5. On fetch failure: displays full-page error message, all controls disabled

---

### 3.7 Keydown Event Handler

```javascript
function onKeyDown(ev) {
    if (!state.isCountingActive) return;
    if (state.commentFieldFocused) return;

    // Ignore modifier combos except Shift
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;

    var key = ev.key.toUpperCase();
    var specConfig = getSpecConfig();
    var outCodes = specConfig.outCodes;

    if (!outCodes.hasOwnProperty(key)) return;

    ev.preventDefault();

    var cellType = outCodes[key];
    var isDecrement = ev.shiftKey;

    if (isDecrement) {
        if (state.counts[cellType] > 0) {
            state.counts[cellType]--;
            flashCell(cellType, 'decrement');
        }
    } else {
        state.counts[cellType]++;
        flashCell(cellType, 'increment');
    }

    updateCounterDisplay();
}
```

**Key Design Notes**:
- Uses `ev.key.toUpperCase()` (not `String.fromCharCode(event.which)`) for modern key event handling
- Checks `outCodes` with UPPERCASE keys (configuration stores keys as uppercase)
- Ignores keypress when `state.commentFieldFocused` is true (textarea or input has focus)
- Ignores keypress when any modifier key other than Shift is held
- Shift + key triggers decrement; plain key triggers increment
- The handler is attached via `document.addEventListener('keydown', onKeyDown)` during `startCount()` and `resumeCounting()`, and detached via `document.removeEventListener('keydown', onKeyDown)` during `finalizeCount()` and `resetToStart()`

**Keyboard Isolation for Morphology Comments**:

The morphology comments textarea detaches counting behavior by setting `state.commentFieldFocused`:

```javascript
morphField.addEventListener('focus', function () {
    state.commentFieldFocused = true;
});
morphField.addEventListener('blur', function () {
    state.commentFieldFocused = false;
});
```

This prevents keypresses in the textarea from triggering cell counts without physically detaching and reattaching the keydown listener.

---

### 3.8 Configuration File Schema (templates.json)

The schema below is the **v2 profile**, validated by `WBCCore.validateConfig`
(§3.10.6). The earlier revision of this section documented a nine-category
layout with key mappings (`L` for blasts, `A` for basophils) that the product
has not shipped since v2.0, and omitted every field added by DCR-006 onward.

```jsonc
{
  "version": "2.5",                    // supersede comparison, §3.11.3
  "profileId": "consensus-14",         // identity; appears in every report
  "profileName": "Full 14-Part Consensus",
  "provenance": { ... },               // free-form origin record
  "specimenTypes": [
    {
      "specimenType": "bm",
      "specimenLabel": "Bone Marrow",
      "targetCount": 500,              // advisory, never enforced (URS-041)
      "targetCountBasis": "ICSH 2008 §2.6: at least 500 cells when …",

      "categories": {                  // display order; two rows
        "upper": [ … ], "lower": [ … ]
      },
      "outCodes": { "X": "blasts", "F": "poly", … },   // key -> category

      // ---- counting policy: these decide the reported numbers ----
      "denominatorExcludes": ["nrbc"],          // §3.10.1  (pb only)
      "per100Reporting": {                      // §3.10.1
        "nrbc": { "label": "NRBC per 100 WBC", "precision": 1 }
      },
      "rounding": "largest-remainder",          // §3.10.2
      "precision": { "display": 2, "report": 0 },
      "confidenceIntervals": { "enabled": true, "level": 0.95 },   // §3.10.3
      "thresholds": [                                              // §3.10.4
        { "target": "blasts", "value": 20, "label": "AML blast threshold",
          "basis": "WHO 2022 / ICC 2022 — 20% blasts of all nucleated cells." }
      ],
      "formulas": {                                                // §3.10.5
        "ME_ratio": { "label": "M:E Ratio", "type": "ratio",
                      "numerator": [ … ], "denominator": ["nrbc"],
                      "precision": 1, "basis": "ICSH 2008 §2.6: …" }
      },
      "absoluteCountsInReport": false,          // §3.13

      // ---- presentation and workflow ----
      "templates": [ { "tplCode": "…", "tplName": "…", "outSentence": "…" } ],
      "constituents": { },             // aggregated-category membership
      "categoryNotes": { },            // operator-facing notes per category
      "morphologyChecklist": [ … ],
      "handedness": "left",
      "absoluteCounts": "optional",    // optional | always | disabled
      "audio": { "enabled": true, … }, // §3.12
      "autosave": true,                // §3.14
      "requireCaseNumber": false,
      "upperRowAbnormal": false
    }
  ]
}
```

**Which fields change a number.** `denominatorExcludes`, `per100Reporting`,
`rounding`, `precision`, `confidenceIntervals`, `thresholds` and `formulas`
alter what is reported, not merely how it looks. They are edited in the
Counting Policy panel (§3.17) and every one is stated in the method statement
(§3.10.7) so a reader can tell which convention produced a figure.

### 3.9 Reset and State Lifecycle (URS-003, URS-060, URS-063)

`resetToStart()` returns the application to case entry. It clears `state.counts`,
the case number, the morphology comments and the checklist, and discards the
autosave snapshot (§3.14). It **preserves the specimen type**, because the next
case on a bench is usually the same specimen, and focuses the case field.

Reset is confirmed through the shared dialog (§3.18) whenever a count is in
progress; with an empty tally it proceeds without asking. The confirmation
always offers Cancel — a destructive action with no escape route was a defect
recorded and closed under DCR-004.

Changing the case number mid-count takes the same path. Changing the specimen
type does not: it saves the count in progress to session history first and
starts a fresh tally (URS-013), so work is never silently discarded.

---

### 3.10 Calculation Engine (`web/scripts/wbc-core.js`)

The engine is a **UMD module with no DOM access**. That boundary is the reason
the unit layer can execute the shipped calculation rather than a copy of it: the
same file is `require`d by the Node suites and loaded by a `<script>` tag in the
browser. Nothing in it reads `document`, `window` or storage.

`mdc-app.js` holds state and renders; every number it displays comes from here.

#### 3.10.1 Denominator policy (DCR-006)

A category may be **counted but held outside the percentage denominator**, and
then reported per 100 of it instead.

```
getDenominator(counts, exclude) = Σ counts[ct] for ct ∉ exclude
percentage(ct)   = counts[ct] / denominator × 100        for ct ∉ exclude
per100(ct)       = counts[ct] / denominator × 100        for ct ∈ exclude
```

The two expressions are identical; only the reporting label differs. This is
the convention for nucleated red cells in peripheral blood: they are not
leucocytes, and leaving them in the denominator dilutes every leucocyte
percentage. On 180 leucocytes and 20 NRBC, segmented neutrophils read 66.7%
rather than 60.0%.

A category outside the denominator has **no percentage**, and the engine returns
`null` rather than zero. `null` renders as `N/A` or as the per-100 form; a zero
would read as a measured absence.

Bone marrow is deliberately the opposite: ICSH 2008 §2.6 places erythroblasts
inside the nucleated differential count, so a marrow profile excludes nothing.

#### 3.10.2 Rounding (DCR-010)

`percentagesSummingTo100(counts, decimals, { exclude, method })` implements
three selectable policies:

| `method` | Behaviour | Total |
|----------|-----------|-------|
| `largest-remainder` (default) | Hare quota: floor every value, then give the residual units to the largest fractional remainders | Exactly 100 |
| `largest-count` | Give the whole residual to the largest category | Exactly 100 |
| `independent` | Round each value alone | May be 99 or 101 |

Largest remainder is the default because it reaches 100% with the least
distortion of any single figure. Fourteen categories of ten cells each — every
one truly 7.14% — give twelve at 7% and two at 8% under largest remainder, and
one at **9%** under largest count.

Boundary values within 1e-9 of a whole number are snapped before flooring, so
accumulated floating-point error cannot turn 100 into 99.99999999999999.

Display precision and report precision are separate fields: the screen may carry
two decimals while the report carries none.

#### 3.10.3 Confidence intervals (DCR-007)

A differential count is a **sample**. `wilsonInterval(count, n, level)` returns
the Wilson score interval for the observed proportion.

The Wald interval was rejected: at 2 of 200 it returns a **negative** lower
bound, which is not a possible percentage. Wilson is bounded, behaves at zero
and at saturation, and is the interval Brown, Cai & DasGupta (2001) recommend at
these counts. `Z_SCORES` holds 0.90, 0.95 and 0.99; any other level is rejected
by validation.

Intervals are computed over the **differential denominator**, not the total, so
they are consistent with the percentages beside them.

#### 3.10.4 Diagnostic thresholds (DCR-008)

`evaluateThresholds` marks a threshold as *spanned* when the confidence interval
for its target crosses the configured value. The results screen then states that
the count does not resolve the question.

It is **advisory and never blocks** — a paucicellular aspirate may make an
extended count impossible, and the operator is the one who knows that. A
threshold may target a displayed category still inside the denominator, or a
percentage formula; validation rejects a threshold on a category that has no
percentage to test.

#### 3.10.5 Derived figures (DCR-008, DCR-010)

`computeRatio` and `computeSubsetPercentage` evaluate `formulas`. A `ratio`
(M:E) has no denominator count and therefore carries no interval; a
`percentage` of a subset does, and validation requires its numerator to be
contained in its denominator so the result cannot exceed 100%.

Both M:E conventions are expressible — ICSH 2008 §2.6 includes monocytes in the
numerator, a widely taught alternative excludes them, and the same counts give
2.3:1 or 1.7:1 accordingly. The composition is a configuration field, and the
convention in force appears in the method statement.

#### 3.10.6 Configuration validation

`validateConfig` is the single gate. It rejects a profile that would count
wrongly rather than merely one that is malformed: a key mapped to a category
that is never displayed, `denominatorExcludes` naming an undisplayed category or
emptying the denominator, `per100Reporting` for a category still inside it, a
threshold with nothing to test, a percentage formula that can exceed 100%, a
precision outside 0–4, a confidence level with no z-score, and a formula named
after a reserved placeholder.

The **same function** validates on import, on editor save and on load, so a
profile cannot enter by one route that another would refuse.

#### 3.10.7 Method provenance (DCR-009)

`buildMethodStatement` returns the conventions that produced a result — profile
and version, denominator policy, rounding, precision, interval level, M:E
composition and the citation for each. `formatMethodStatement` renders it for
`{{methodNotes}}`.

The argument is that a differential percentage is not self-explanatory: the same
counts give a materially different M:E ratio and a materially different blast
percentage depending on conventions that are all in current use. A figure
without its convention cannot be compared against another laboratory's, or
against the same laboratory's earlier result.

---

### 3.11 Configuration Lifecycle (URS-103, URS-106)

#### 3.11.1 Resolution order

On load the application fetches `settings/templates.json` and reads any cached
profile from `localStorage.wbcds_config`. Both are validated. The cached profile
wins, **except** when superseded (§3.11.3). If neither validates the application
refuses to start and says why, rather than counting with an unknown
configuration.

#### 3.11.2 Import and export

`exportConfig` writes the **raw** cached profile, so a round trip through export
and import is lossless. `importConfig` validates before adopting and reports the
reasons on rejection, keeping the previous profile active.

#### 3.11.3 Supersede

`isCacheSuperseded(cached, shipped)` returns true when the two share a
`profileId` and the shipped `version` is higher. This is what allows a corrected
default profile to reach a browser that already cached the old one. The operator
is told, and the cache is replaced.

The editor increments the version of any profile it saves (§3.17), so a local
edit is a newer revision of its parent and is not discarded by the profile it
came from — a defect recorded as HA-100.

---

### 3.12 Audio Feedback (URS-027, URS-097)

`AudioEngine` synthesises short tones with the Web Audio API; no audio files are
shipped. Distinct sounds mark a count, an undo, reaching the target, and typing
in the comments field — the last so the operator can hear that keystrokes are
going to text rather than to the tally, which is the failure the sound exists to
prevent.

The context is created on first user gesture, as browsers require, and the
enabled state is held in `sessionStorage`.

---

### 3.13 Absolute Counts and the Analyser WBC (URS-036, DCR-016)

Absolute counts are derived on the results screen from an operator-entered
analyser WBC.

**The entered value is corrected for nucleated red cells before use.** Impedance
analysers count NRBC as leucocytes — they resist the lysing reagent — so the
reported WBC is inflated whenever they circulate:

```
correctWbcForNrbc(reported, nrbcPer100) = reported × 100 ÷ (100 + nrbcPer100)
```

At 20 NRBC per 100 WBC every absolute count derived from an uncorrected value is
overstated by 20%. The absolute neutrophil count drives neutropenia grading, and
that error moves values across the 1.5 and 0.5 ×10⁹/L boundaries.

**The correction is displayed, never applied silently.** The entered value, the
arithmetic and the result are all shown, and a checkbox declares a value the
analyser already corrected, which is then used unchanged. Only the operator
knows the provenance of the number; correcting a corrected value introduces the
error in the opposite direction.

The control is offered only where a category is both counted and excluded from
the denominator — the condition under which the correction applies. Marrow
profiles are therefore unaffected.

`absoluteCountsInReport` (default **off**) adds `{{<cell>_abs}}`, `{{wbcUsed}}`
and `{{wbcBasis}}` to the templates and re-renders the report once a WBC is
entered. Before that the tokens resolve to *"not provided"* — never blank, never
zero, because a zero absolute neutrophil count reads as a measured absence.

---

### 3.14 Autosave and Crash Recovery (URS-085)

`saveAutosaveState()` writes the case number, specimen, counts, morphology
comments and checklist to `localStorage.wbcds_autosave` after every keystroke.
On load, a snapshot triggers a Restore-or-Discard prompt.

Two properties matter:

- The snapshot **contains patient data** — the accession number and free-text
  comments — and therefore persists on the workstation across browser restarts.
  It is discarded on completion, on reset, and on load if **older than 12
  hours**. The residual data-at-rest exposure is recorded in RA-001.
- The recovery prompt is opened **non-dismissible** (§3.18): its Cancel action is
  *Discard*, and a stray Escape must not throw away a recovered count.

---

### 3.15 Offline Operation (URS-094)

`sw.js` caches the application shell — every page, `wbc-core.js`,
`wbc-dialog.js`, `mdc-app.js`, `config-editor.js`, `styles/theme.css` and the
vendored Tailwind build — **cache-first**. Configuration profiles are
**network-first with a cache fallback**, so a corrected profile is seen when the
network is available and the application still boots when it is not.

Nothing render-blocking is fetched from a third party. Webfonts are a
progressive enhancement; their absence changes only the typeface.

`CACHE_VERSION` must be bumped whenever a shell asset changes, or an installed
browser keeps serving the old one. This has been forgotten before and is the
reason each change record states the bump explicitly.

---

### 3.16 Preset Catalogue (URS-101)

`settings/presets/index.json` lists the shipped profiles; each entry names a
file loaded on demand. Selecting one replaces the active configuration and
clears any count in progress, which the catalogue states before it happens.

A preset changes **layout, keys and wording — not the counting convention**.
Every preset that counts NRBC in a non-marrow specimen excludes them from the
leucocyte denominator, as the built-in profile does. That was not true before
DCR-012: choosing a preset silently re-introduced HA-092, and suite 09 now fails
if any preset omits the policy.

---

### 3.17 Configuration Editor (`web/scripts/config-editor.js`, URS-102, URS-104)

Drag-and-drop layout, key capture, template editing, the morphology checklist,
and a **Counting Policy** panel exposing the fields of §3.10 per specimen type.

Two design rules, both established by defect:

- **Merge, never rebuild.** The editor retains the loaded profile and overrides
  only what it edits. Rebuilding from its own form fields destroyed every field
  it did not model — the denominator policy, the thresholds, the M:E formula —
  while reporting success (HA-099).
- **Constrain the controls, do not rely on validation.** The last category
  cannot be removed from the denominator; excluding a category creates its
  per-100 entry and deletes any threshold on it; threshold targets are drawn
  only from categories that have a percentage to test. The panel cannot compose
  a profile `validateConfig` would reject.

Saving increments the profile version (§3.11.3) and validates before activating;
an invalid draft is downloaded but never made active, and the message says which
happened.

---

### 3.18 Dialogs (`web/scripts/wbc-dialog.js`)

One widget for acknowledgement, confirmation and short forms, shared by the
counter and the editor. It replaced the browser's `prompt()`, which cannot state
a rule, cannot show which identifiers are taken, cannot refuse input except by
discarding it, and ignores the selected theme.

- Focus moves into the dialog, is confined to it, and returns to the element
  that opened it. The tab cycle is driven explicitly, because WebKit omits
  buttons from the tab order.
- **A dialog owns the keyboard**: counting keys do not reach the tally while one
  is open. The Reset confirmation opens during counting with focus on a button,
  where the "ignore form controls" guard did not apply.
- Escape cancels, **except** where both branches are consequential; such a
  dialog is opened `dismissible: false`.
- An acknowledgement's callback runs on **both** paths, since an alert has one
  outcome. Escape once skipped a continuation that offered count recovery.

---

## 4. DOM Element ID Reference

| Element ID | Type | Purpose |
|-----------|------|---------|
| `caseNumber` | input[text] | Case/accession number entry |
| `specimenType` | select | BM/PB dropdown selector |
| `btnStartCount` | button | Start Count button (always enabled, NOT disabled by default) |
| `btnCountDone` | button | Count Done button |
| `btnCountReset` | button | Reset button (counting phase) |
| `btnNewCase` | button | New Case button (results phase, resets to case-entry) |
| `btnResumeCounting` | button | Continue Counting button (results phase, returns to counting) |
| `btnCopyOutput` | button | Copy to Clipboard button (results phase) |
| `btnToggleTheme` | button | Theme toggle button (light/dark) |
| `btnExportCsv` | button | Export session history as CSV |
| `btnExportJson` | button | Export session history as JSON |
| `morphComments` | textarea | Morphology comments entry |
| `commentCharCount` | span | Character count display for morphology comments |
| `counter-table-area` | div | Container for dynamically rendered counter table |
| `phase-case-entry` | div | Case-entry phase container |
| `phase-counting` | div | Counting phase container |
| `phase-results` | div | Results phase container |
| `header-logo` | element | Header logo (hidden during case-entry, visible during counting/results) |
| `val-{cellType}` | span | Cell count value display (e.g., `val-blasts`) |
| `pct-{cellType}` | span | Cell percentage display (e.g., `pct-blasts`) |
| `cell-{cellType}` | td | Cell wrapper for flash feedback (e.g., `cell-blasts`) |
| `val-sub-precursors` | span | Upper row subtotal |
| `val-sub-mature` | span | Lower row subtotal |
| `pct-sub-precursors` | span | Upper row subtotal percentage |
| `pct-sub-mature` | span | Lower row subtotal percentage |
| `val-grand-total` | span | Grand total count display |
| `val-me-ratio` | span | M:E ratio display |
| `progress-bar` | div | Progress bar fill element |
| `progress-label` | span | Progress label text (e.g., "42 / 500 (target)") |
| `results-summary` | div | Results phase summary display |
| `tab-nav` | div | Output template tab navigation |
| `tab-panels` | div | Output template tab content panels |
| `case-badge` | div | Case number badge (counting/results header) |
| `case-badge-number` | span | Case number text within badge |
| `case-badge-spec` | span | Specimen label text within badge |
| `state-label` | span | State indicator text ("Ready", "Counting", "Complete") |
| `session-history-section` | div | Session history panel container |
| `history-list` | div | Session history entry list |
| `history-count` | span | Session history count badge |
| `history-modal` | div | Session history detail modal overlay |
| `history-modal-title` | element | History modal title |
| `history-modal-content` | div | History modal content area |
| `history-modal-close` | button | History modal close button |
| `modal-overlay` | div | Confirmation modal overlay |
| `modal-title` | element | Confirmation modal title |
| `modal-message` | element | Confirmation modal message |
| `modal-confirm` | button | Confirmation modal confirm button |
| `modal-cancel` | button | Confirmation modal cancel button |
| `themeLabel` | span | Theme toggle button label text |

---

## 5. Presentation and Delivery

### 5.1 Browser Support and Delivery (URS-093, URS-094)

Chrome, Firefox and Edge without plugins or installation. Edge shares the
Chromium engine; verification runs on Chromium, Firefox and WebKit, the last as
additional assurance rather than a stated target.

**Nothing render-blocking is fetched from a third party.** Tailwind is vendored
at `web/vendor/tailwind.js` and precached by the service worker; the earlier
revision of this section described it as loaded from a CDN, which would have
made the application unusable on a workstation with restricted internet — the
condition URS-094 exists for. Webfonts remain a progressive enhancement.

Delivery is static files over HTTP. There is no build step: the shipped sources
are the sources under verification, which is what allows the unit layer to
execute the calculation engine directly (§3.10).

### 5.2 Theming and Styling (URS-095)

Tailwind utility classes, plus **one shared stylesheet**, `web/styles/theme.css`,
carrying the light-theme overrides, the muted-tone corrections, the shared
animation and the print rules.

One stylesheet, not one block per page. Each page previously kept its own
overrides — 39, 22, 20, 12 and, for the quick-start guide, none — and they
drifted. The drift was clinical rather than cosmetic: advisories rendered at
1.28:1 against their panel in the light theme, and keyboard-map labels at
1.93:1 (HA-098).

Colour values are computed against the surfaces they are actually used on, and
against the **lightest** such surface rather than the darkest, since the same
utility class appears over several. Interaction states count: every primary
button darkens on hover, because the Tailwind default lightens it to 3.68:1
against white text — below AA at exactly the moment the pointer is on it.

The theme attribute lives on `<html>` and is applied by an inline script in
`<head>`, before first paint. Applied at the end of `<body>` the page painted in
one theme and transitioned to the other, which is both a visible flash and, with
`transition-colors`, a window in which text is genuinely below AA.

Contrast is verified on the rendered page, in both themes, across every page and
phase and in the hover state (VV-SYS-160 to 178).

## 6. Error Handling

| Error Condition | Detection | Response |
|----------------|-----------|----------|
| templates.json load failure | `fetch()` response not ok or network error in `loadConfig()` | Display full-page error message with error details; all controls disabled |
| Invalid JSON in templates.json | `response.json()` parse exception | Caught by `loadConfig()` try/catch; display error message; disable all controls |
| Division by zero (total = 0) | Check in `updateCounterDisplay()` | Return `'0.00%'` for all percentages; subtotal percentages show em-dash |
| M:E ratio denominator zero | Check in `computeMERatio()` | Return `'N/A'` string |
| M:E ratio formula absent | Null check in `computeMERatio()` | Return `null`; M:E ratio row not rendered |
| Decrement below zero | Check `state.counts[cellType] > 0` in `onKeyDown()` | Silently ignore; count floors at zero |
| Clipboard API unavailable | `navigator.clipboard.writeText()` promise rejection | Fallback to `document.createRange()` + `document.execCommand('copy')` |
| sessionStorage unavailable | try/catch on `getItem`/`setItem` | Graceful degradation: session history and theme persistence disabled; no error shown |
| Key not in outCodes mapping | `hasOwnProperty` check in `onKeyDown()` | Ignore keypress silently |
| Unmapped cell type in template | Regex replacement finds no match | Placeholder remains in output (no crash) |

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| 3.0 | 2026-08-06 | QMS | **Revised for everything built since DCR-006.** §3.9 to §3.18 added: reset lifecycle, the calculation engine (denominator policy, rounding, Wilson intervals, thresholds, derived figures, validation, method provenance), configuration lifecycle, audio, absolute counts and the NRBC correction, autosave, offline operation, the preset catalogue, the configuration editor and the shared dialog. §3.5.2 marked superseded — it described a percentage computation the product has not used since DCR-006. §3.8 schema replaced; it documented a nine-category layout and key mappings that have not shipped since v2.0. §5 rewritten: it stated that Tailwind loads from a CDN, which would defeat URS-094. Closes the RTM-001 citations of §3.9, §3.11 to §3.17 and §5.1, which pointed at sections that did not exist. See DCR-019. |
| A | 2026-02-18 | QMS | Initial draft -- detailed design |
| B | 2026-02-19 | QMS | Added session export design notes |
| C | 2026-02-20 | QMS | Added theme toggle design notes |
| D | 2026-02-24 | QMS | v2.0 -- Complete rewrite: replaced Backbone.js MVC with single-file vanilla JS IIFE; replaced 9-cell per-specimen-type tables with unified 14-cell two-row layout; removed Backbone models, collections, views, and router; replaced Handlebars templates with simple string replacement; added three-phase UI model; added M:E ratio computation; added resume counting; updated configuration schema with categories, formulas, and uppercase outCodes keys |

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Software Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
