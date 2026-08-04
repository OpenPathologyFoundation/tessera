# SDD-001: Software Detailed Design

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | SDD-001 |
| **Version** | 2.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-02-24 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 v2.0, SRS-001 v2.0, SAD-001 v2.0 |

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
- `applyTheme(theme)`: Sets `data-theme` attribute on `<body>`, updates toggle button label
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

#### 3.5.2 calcPercent(cellType)

Percentage calculation is performed inline within `updateCounterDisplay()`:

```
percentage = (state.counts[cellType] / total) * 100
```

Rounded to 2 decimal places via `toFixed(2)`. Returns `'0.00%'` when total equals zero.

**Verification Boundary Cases**:
- total = 0 (all zeros): all percentages display `0.00%`
- total = 1 (single cell): that cell shows `100.00%`, rest `0.00%`
- All cells equal: each shows `100/N` percent
- One cell has all counts: shows `100.00%`, rest `0.00%`
- Large counts (e.g., 9999 total): normal floating-point arithmetic

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

```json
[
    {
        "specimenType": "bm",
        "targetCount": 500,
        "upperRowAbnormal": false,
        "categories": {
            "upper": ["nrbc","blasts","pro","myelo","meta","plasma","mast"],
            "lower": ["bands","poly","baso","eos","mono","lymph","other"]
        },
        "outCodes": {
            "R":"nrbc","L":"blasts","O":"pro","M":"myelo","T":"meta","C":"plasma","S":"mast",
            "B":"bands","P":"poly","A":"baso","E":"eos","N":"mono","Y":"lymph","X":"other"
        },
        "formulas": {
            "ME_ratio": {
                "label": "M:E Ratio",
                "numerator": ["blasts","pro","myelo","meta","bands","poly","baso","eos","mono"],
                "denominator": ["nrbc"],
                "precision": 1
            }
        },
        "templates": [
            {
                "tplCode": "ysm",
                "tplName": "Yale SOM",
                "outSentence": "A {{total}}-cell count reveals {{blasts}}% blasts, ..."
            }
        ]
    }
]
```

**Schema Validation Rules**:

1. **Root**: Must be an array with at least 1 element
2. **Each element** must have:
   - `specimenType` (string, unique across array)
   - `outCodes` (object)
   - `templates` (array)
   - `targetCount` (integer, positive; defaults to 500 for BM, 200 for PB if absent)
   - `categories` (object with `upper` and `lower` arrays)
   - `upperRowAbnormal` (boolean)
3. **outCodes**: Keys must be single uppercase letters; values must be non-empty strings matching entries in `categories.upper` or `categories.lower`
4. **No duplicate keys or cell type values** within a single specimen type
5. **formulas** (optional): Object where each formula has:
   - `label` (string, display name)
   - `numerator` (array of cell type strings)
   - `denominator` (array of cell type strings)
   - `precision` (integer, decimal places for `.toFixed()`)
6. **templates**: Each must have:
   - `tplCode` (string, unique identifier)
   - `tplName` (string, display name)
   - `outSentence` (string, must contain `{{total}}` placeholder)

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

## 5. CSS Classes

The application uses **Tailwind CSS** (loaded via CDN) for all styling. There is no custom stylesheet. All visual presentation is achieved through Tailwind utility classes applied directly in HTML and in dynamically generated markup.

**Key Tailwind patterns used**:

| Pattern | Purpose |
|---------|---------|
| `hidden` | Display: none toggle for phase containers and conditional UI elements |
| `flex`, `items-center`, `justify-between` | Flexbox layout for header, badges, rows |
| `grid`, `gap-*` | Grid layout where applicable |
| `bg-slate-*` | Background colors for dark theme (slate palette) |
| `text-slate-*`, `text-accent` | Text colors; `text-accent` is a custom color via CSS variable |
| `font-mono` | Monospace font for counts, percentages, ratios |
| `border`, `border-slate-*` | Borders for table cells and sections |
| `rounded-lg`, `rounded-md` | Border radius for cards and inputs |
| `transition-colors`, `transition-all` | Smooth transitions for hover and state changes |
| `animate-pulse` | Pulsing animation for active counting status indicator |
| `px-*`, `py-*`, `mt-*`, `mb-*` | Spacing utilities |
| `text-xs`, `text-sm`, `text-lg`, `text-2xl` | Font size scale |
| `uppercase`, `tracking-wider` | Text transform for labels |
| `overflow-x-auto` | Horizontal scroll for counter table on small screens |
| `min-h-screen` | Full viewport height for layout |

**Custom CSS classes** (defined in `<style>` within `counter.html`):

| Class | Purpose |
|-------|---------|
| `flash-increment` | Green flash animation on cell increment (250ms) |
| `flash-decrement` | Red flash animation on cell decrement (250ms) |
| `tab-active` | Active tab indicator (border-bottom accent color) |
| `counting-active` | Applied to `<body>` during counting phase |

**Theme system**: `data-theme="light"` or `data-theme="dark"` attribute on `<body>` drives CSS variable overrides for background, text, and accent colors.

---

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
| A | 2026-02-18 | QMS | Initial draft -- detailed design |
| B | 2026-02-19 | QMS | Added session export design notes |
| C | 2026-02-20 | QMS | Added theme toggle design notes |
| D | 2026-02-24 | QMS | v2.0 -- Complete rewrite: replaced Backbone.js MVC with single-file vanilla JS IIFE; replaced 9-cell per-specimen-type tables with unified 14-cell two-row layout; removed Backbone models, collections, views, and router; replaced Handlebars templates with simple string replacement; added three-phase UI model; added M:E ratio computation; added resume counting; updated configuration schema with categories, formulas, and uppercase outCodes keys |

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Software Engineer | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
