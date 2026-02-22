# SDD-001: Software Detailed Design

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | SDD-001 |
| **Version** | 1.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001, SRS-001, SAD-001 |

---

## 1. Purpose

This document provides the detailed software design for WBC ΔΣ. It specifies the implementation of each module, data structures, algorithms, DOM structure, event handling, and inter-module communication. This document provides sufficient detail for implementation and code review.

## 2. Scope

Covers all application-level JavaScript modules, HTML/template structure, CSS classes, and the configuration file schema.

---

## 3. Module Detailed Designs

### 3.1 Namespace and Initialization (defines.js)

#### 3.1.1 Global Namespace

```javascript
var app = {
    v: {},      // Views (Backbone.View instances)
    r: {},      // Routers (Backbone.Router instances)
    c: {},      // Collections (Backbone.Collection instances)
    m: {},      // Models (Backbone.Model instances)
    tools: {},  // Application tools (reset, instructions, toggle)
    utils: {},  // Calculation utilities
    state: {    // NEW: Application state manager
        currentCase: null,
        specimenType: 'bm',
        isCountingActive: false,
        isCountComplete: false,
        sessionHistory: []
    },
    config: {   // NEW: Configuration defaults
        minCellCount: { bm: 200, pb: 100 },
        maxCaseNumberLength: 30
    },
    TPLJSON: null  // Loaded template configuration
};
```

#### 3.1.2 State Transitions

| From State | Event | To State | Actions |
|-----------|-------|----------|---------|
| IDLE | Case number entered | CASE_ENTERED | Enable Start Count |
| CASE_ENTERED | Start Count clicked | COUNTING | Attach keydown listener, disable specimen selector, disable Start Count |
| COUNTING | Count Done clicked | COUNT_REVIEW | Check minimum threshold |
| COUNT_REVIEW | Threshold met or override confirmed | COMPLETED | Detach listener, lock inputs, generate output, save history |
| COUNT_REVIEW | Threshold warning cancelled | COUNTING | Resume counting |
| COMPLETED | Reset clicked (confirmed) | IDLE | Clear all data, focus case input |
| COMPLETED | New case entered (confirmed) | CASE_ENTERED | Clear all data, set new case |
| COUNTING | Reset clicked (confirmed) | IDLE | Clear all data, focus case input |
| Any | Page load | IDLE | Fetch config, render empty tables |

---

### 3.2 Data Models (models.js)

#### 3.2.1 CounterTable Model

```javascript
app.m.CounterTable = Backbone.Model.extend({
    url: 'settings/templates.json',
    defaults: {
        specimenType: '',
        outCodes: {},
        templates: []
    }
});
```

**Purpose**: Fetches and holds the template configuration JSON.

#### 3.2.2 CellCount Model (NEW)

```javascript
app.m.CellCount = Backbone.Model.extend({
    defaults: {
        key: '',          // Keyboard key (e.g., 'a')
        cellType: '',     // Cell type name (e.g., 'blast')
        count: 0,         // Current count (integer >= 0)
        percentage: 0.00  // Calculated percentage
    },
    increment: function() {
        this.set('count', this.get('count') + 1);
    },
    decrement: function() {
        var current = this.get('count');
        if (current > 0) {
            this.set('count', current - 1);
        }
    }
});
```

**Purpose**: Represents a single cell type's count within a counting session.

#### 3.2.3 CountSession Model (NEW)

```javascript
app.m.CountSession = Backbone.Model.extend({
    defaults: {
        caseNumber: '',
        specimenType: '',
        timestamp: null,
        totalCount: 0,
        cellCounts: {},      // { cellType: count }
        percentages: {},     // { cellType: percentage }
        morphologyComments: '',
        outputText: {},      // { templateName: outputString }
        isComplete: false
    }
});
```

**Purpose**: Represents a complete counting session for session history.

#### 3.2.4 TabbedOutput Model

```javascript
app.m.TabbedOutput = Backbone.Model.extend({
    defaults: {
        templateName: '',
        institutionName: '',
        favicon: '',
        outputHtml: ''
    }
});
```

---

### 3.3 Collections (collections.js)

#### 3.3.1 CellCountCollection (NEW)

```javascript
app.c.CellCounts = Backbone.Collection.extend({
    model: app.m.CellCount,
    totalCount: function() {
        return this.reduce(function(sum, model) {
            return sum + model.get('count');
        }, 0);
    },
    recalculatePercentages: function() {
        var total = this.totalCount();
        this.each(function(model) {
            if (total === 0) {
                model.set('percentage', 0.00);
            } else {
                var pct = (model.get('count') / total) * 100;
                model.set('percentage', Math.round(pct * 100) / 100);
            }
        });
    }
});
```

#### 3.3.2 SessionHistory Collection (NEW)

```javascript
app.c.SessionHistory = Backbone.Collection.extend({
    model: app.m.CountSession,
    saveToStorage: function() {
        sessionStorage.setItem('wbcds_history', JSON.stringify(this.toJSON()));
    },
    loadFromStorage: function() {
        var data = sessionStorage.getItem('wbcds_history');
        if (data) {
            this.reset(JSON.parse(data));
        }
    }
});
```

---

### 3.4 Views (views.js)

#### 3.4.1 CaseInputView (NEW)

```javascript
app.v.CaseInput = Backbone.View.extend({
    el: '#case-input-container',
    events: {
        'input #caseNumber':  'onCaseInput',
        'change #caseNumber': 'onCaseChange'
    },
    // Validates case number format
    // Enables/disables Start Count button
    // Triggers data clear on case change during active session
});
```

**DOM Target**: `#case-input-container`

**Template**:
```html
<div id="case-input-container">
    <label for="caseNumber">Case / Accession #:</label>
    <input type="text" id="caseNumber" maxlength="30"
           pattern="[A-Za-z0-9\-\/]+" placeholder="Enter case number" />
    <span id="active-case-display" class="case-display"></span>
</div>
```

**Validation Rules**:
- Not empty and not whitespace-only
- Alphanumeric + hyphens + forward slashes
- Maximum 30 characters
- Leading/trailing whitespace trimmed

#### 3.4.2 MakeTable View (EXISTING - Enhanced)

```javascript
app.v.MakeTable = Backbone.View.extend({
    tagName: 'table',
    id: 'counter',
    initialize: function(options) {
        this.specimenType = options.specimenType;
        this.outCodes = options.outCodes;
        this.render();
    },
    render: function() {
        // Row 1: Cell type header names
        this.mkTitleRow();
        // Row 2: Numeric input spinners (initialized to 0)
        this.mkSpinnerRow();
        // Row 3: Percentage display cells
        this.mkPercentRow();
        // Row 4: Keyboard key labels
        this.mkKeyRow();
        // Append to #counter-tbl
    },
    lockInputs: function() {
        this.$('.cellAmount').prop('readonly', true);
    },
    unlockInputs: function() {
        this.$('.cellAmount').prop('readonly', false).val(0);
    }
});
```

**DOM Structure Generated**:
```html
<table id="counter" class="table bm">
    <tr class="title-row">
        <td class="namecell">blast</td>
        <td class="namecell">pro</td>
        <!-- ... one per cell type ... -->
        <td class="namecell">tot</td>
    </tr>
    <tr class="spinner-row">
        <td class="datacell">
            <input type="number" class="cellAmount" id="bm-blast" value="0" />
        </td>
        <!-- ... one per cell type ... -->
        <td class="datacell">
            <input type="number" class="totalAmount" id="bm-tot" value="0" readonly />
        </td>
    </tr>
    <tr class="percent-row">
        <td class="percentrow" id="bm-blast-pct">0.00</td>
        <!-- ... one per cell type ... -->
        <td class="percentrow" id="bm-tot-pct">100.00</td>
    </tr>
    <tr class="key-row">
        <td class="keys">A</td>
        <td class="keys">S</td>
        <!-- ... one per cell type ... -->
        <td class="keys"></td>
    </tr>
</table>
```

**CSS ID Convention**: `{specimenType}-{cellType}` (e.g., `bm-blast`, `pb-poly`)

#### 3.4.3 CreateOutputField View (EXISTING - Enhanced)

```javascript
app.v.CreateOutputField = Backbone.View.extend({
    tagName: 'div',
    id: 'tabs',
    className: 'output',
    render: function() {
        // Tab navigation bar with favicons
        // Content divs for each template
        // Copy-to-clipboard buttons per tab
    }
});
```

**DOM Structure Generated**:
```html
<div id="tabs" class="output bm">
    <ul class="tabs">
        <li class="tab-link current" data-tab="bm-ysm">
            <img class="favicon" src="images/ysm-favicon.png" /> Yale SOM
        </li>
        <li class="tab-link" data-tab="bm-pdx">
            <img class="favicon" src="images/pdx-favicon.png" /> Precipio DX
        </li>
        <li class="tab-link" data-tab="bm-mgh">
            <img class="favicon" src="images/mgh-favicon.png" /> MGH
        </li>
    </ul>
    <div id="bm-ysm" class="tab-content current">
        <div class="output-sentence"></div>
        <button class="copy-btn" data-target="bm-ysm">Copy to Clipboard</button>
    </div>
    <!-- ... one per template ... -->
</div>
```

#### 3.4.4 Buttons View (EXISTING - Enhanced)

```javascript
app.v.Buttons = Backbone.View.extend({
    el: '#buttons',
    events: {
        'change #specimenType':   'toggleSpecType',
        'click #btnStartCount':   'startCount',
        'click #btnCountDone':    'countDone',
        'click #btnCountReset':   'countReset'
    },
    startCount: function() {
        // 1. Validate case number is present (SYS-003)
        // 2. Disable Start Count button
        // 3. Disable specimen type selector (SYS-016)
        // 4. Set app.state.isCountingActive = true
        // 5. Attach document keydown listener
        // 6. Display counting instructions
    },
    countDone: function() {
        // 1. Check total >= minimum threshold (SYS-052, SYS-053)
        // 2. If below minimum, show warning dialog with override option
        // 3. Detach keydown listener (SYS-054)
        // 4. Lock all count inputs to readonly (SYS-055)
        // 5. Generate output for all templates (SYS-056)
        // 6. Save to session history
        // 7. Set app.state.isCountComplete = true
    },
    countReset: function() {
        // 1. Check if any count data exists
        // 2. If data exists, show confirmation dialog (SYS-081)
        // 3. On confirm: clear all state (SYS-082)
        // 4. Focus case number input (SYS-084)
    }
});
```

#### 3.4.5 MorphologyCommentsView (NEW)

```javascript
app.v.MorphologyComments = Backbone.View.extend({
    el: '#morphology-container',
    events: {
        'focus #morphComments':  'onFocus',
        'blur #morphComments':   'onBlur'
    },
    onFocus: function() {
        // Temporarily detach counting keydown listener
        // Prevents keypresses in textarea from triggering counts
        app.state.commentFieldFocused = true;
    },
    onBlur: function() {
        // Reattach counting keydown listener if counting active
        app.state.commentFieldFocused = false;
    },
    getValue: function() {
        return this.$('#morphComments').val().trim();
    },
    clear: function() {
        this.$('#morphComments').val('');
    }
});
```

**DOM Template**:
```html
<div id="morphology-container">
    <label for="morphComments">Morphology Comments:</label>
    <textarea id="morphComments" rows="3" maxlength="500"
              placeholder="Optional: Note morphology findings..."></textarea>
    <span class="char-count">0 / 500</span>
</div>
```

#### 3.4.6 SessionHistoryView (NEW)

```javascript
app.v.SessionHistory = Backbone.View.extend({
    el: '#session-history',
    events: {
        'click .history-toggle': 'togglePanel',
        'click .history-entry':  'viewEntry',
        'click #btnExportCsv':   'exportCsv',
        'click #btnExportJson':  'exportJson'
    },
    render: function() {
        // Render list of completed sessions
        // Each entry shows: case number, specimen type, timestamp, total count
    },
    viewEntry: function(e) {
        // Display read-only overlay with full session data
        // No editing capability
    },
    exportCsv: function() {
        // Build CSV from session history and trigger local download
    },
    exportJson: function() {
        // Serialize session history to JSON and trigger local download
    }
});
```

**Notes**:
- Session history view includes "Export CSV" and "Export JSON" controls to save a local record.

#### 3.4.7 ThemeToggle (NEW)

**Purpose**: Provides Light/Dark presentation modes for ergonomic use under varying ambient lighting.

**DOM Targets**:
- `#btnToggleTheme` (toggle button)
- `#themeLabel` (dynamic label)

**Behavior**:
- Applies `data-theme="light|dark"` on `<body>` to switch CSS overrides.
- Persists the selected theme for the current browser session using `sessionStorage` key `wbcds_theme`.
- Keyboard shortcut: `Ctrl/Cmd + Shift + L` toggles theme without affecting counting.

---

### 3.5 Business Logic Utilities (app.js)

#### 3.5.1 app.utils.addToCell(whichCell, isDecrement)

```
FUNCTION addToCell(whichCell, isDecrement)
    INPUT: whichCell (string, single character key)
           isDecrement (boolean, true if Shift was held)

    IF app.state.commentFieldFocused THEN
        RETURN  // Do not count while typing in comments

    specimenType = app.state.specimenType
    cellId = specimenType + '-' + outCodes[whichCell]
    cellInput = DOM.find('#' + cellId)

    IF cellInput does not exist THEN
        RETURN  // Key not mapped to any cell

    currentValue = parseInt(cellInput.value)

    IF isDecrement THEN
        IF currentValue > 0 THEN
            cellInput.value = currentValue - 1
        END IF
    ELSE
        cellInput.value = currentValue + 1
    END IF

    // Update total
    totalInput = DOM.find('#' + specimenType + '-tot')
    totalInput.value = SUM(all cellAmount inputs in active table)

    // Visual feedback
    FLASH(cellInput, color='#90EE90', duration=150ms)

    // Recalculate percentages
    CALL calcPercent(specimenType)
END FUNCTION
```

#### 3.5.2 app.utils.calcPercent(whichTable)

```
FUNCTION calcPercent(whichTable)
    INPUT: whichTable (string, 'bm' or 'pb')

    table = DOM.find('table.' + whichTable)
    cellInputs = table.findAll('.cellAmount')
    total = parseInt(DOM.find('#' + whichTable + '-tot').value)

    FOR EACH cellInput IN cellInputs
        cellType = cellInput.id.replace(whichTable + '-', '')
        IF cellType == 'tot' THEN CONTINUE

        count = parseInt(cellInput.value)

        IF total == 0 THEN
            percentage = 0.00
        ELSE
            percentage = (count / total) * 100
            percentage = ROUND(percentage, 2)  // Round to 2 decimal places
        END IF

        percentCell = DOM.find('#' + whichTable + '-' + cellType + '-pct')
        percentCell.textContent = percentage.toFixed(2)
    END FOR

    // Update total percentage display
    IF total > 0 THEN
        sumPct = SUM(all displayed percentages)
        DOM.find('#' + whichTable + '-tot-pct').textContent = sumPct.toFixed(2)
    ELSE
        DOM.find('#' + whichTable + '-tot-pct').textContent = '0.00'
    END IF
END FUNCTION
```

**Verification Note**: The percentage calculation is the single most critical algorithm in the application. It must be verified with boundary cases:
- total = 0 (all zeros)
- total = 1 (single cell)
- All cells equal (should each show `100/N`)
- One cell has all counts (should show 100.00, rest 0.00)
- Large counts (9999 total)

#### 3.5.3 app.utils.mkOutTplJson(outCodes, context, caseNumber, comments)

```
FUNCTION mkOutTplJson(outCodes, context, caseNumber, comments)
    INPUT: outCodes (object, key-to-cellType mapping)
           context (DOM element, the counting table)
           caseNumber (string)
           comments (string)
    OUTPUT: JSON object for Handlebars template

    result = {}
    result.caseNumber = caseNumber
    result.comments = comments
    total = context.find('.totalAmount').value

    result.total = parseInt(total)

    FOR EACH key, cellType IN outCodes
        count = context.find('#' + specimenType + '-' + cellType).value
        IF total > 0 THEN
            result[cellType] = ROUND((count / total) * 100)
        ELSE
            result[cellType] = 0
        END IF
    END FOR

    RETURN result
END FUNCTION
```

#### 3.5.4 app.tools.resetCounter(specimenType)

```
FUNCTION resetCounter(specimenType)
    INPUT: specimenType (string, 'bm' or 'pb')

    table = DOM.find('table.' + specimenType)
    FOR EACH input IN table.findAll('.cellAmount')
        input.value = 0
        input.readonly = false
    END FOR
    table.find('.totalAmount').value = 0

    FOR EACH cell IN table.findAll('.percentrow')
        cell.textContent = '0.00'
    END FOR
    table.find('#' + specimenType + '-tot-pct').textContent = '0.00'
END FUNCTION
```

---

### 3.6 Router and Initialization (routes.js)

#### 3.6.1 Application Bootstrap Sequence

```
ON document.ready:
    1. Initialize Backbone Router
    2. Fetch settings/templates.json
    3. ON fetch success:
        a. Store parsed JSON in app.TPLJSON
        b. FOR EACH specimen type config:
            i.   Create MakeTable view
            ii.  Create CreateOutputField view
            iii. Initialize tab click handlers
        c. Create Buttons view
        d. Create CaseInput view          (NEW)
        e. Create MorphologyComments view (NEW)
        f. Create SessionHistory view     (NEW)
        g. Load session history from sessionStorage
        h. Set initial state to IDLE
        i.  Focus case number input
    4. ON fetch failure:
        a. Display error: "Configuration could not be loaded."
        b. Disable all controls
    5. Start Backbone.history
```

---

### 3.7 Keydown Event Handler

```javascript
// Attached by startCount(), detached by countDone() and countReset()
function onKeyDown(event) {
    // Ignore if comment field is focused
    if (app.state.commentFieldFocused) return;

    // Ignore modifier keys (except Shift)
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    var key = String.fromCharCode(event.which).toLowerCase();
    var isDecrement = event.shiftKey;

    // Check if key is mapped for current specimen type
    var outCodes = app.TPLJSON[currentSpecIndex].outCodes;
    if (outCodes.hasOwnProperty(key)) {
        event.preventDefault();
        app.utils.addToCell(key, isDecrement);
    }
}
```

---

### 3.8 Configuration File Schema (templates.json)

```json
[
    {
        "specimenType": "bm | pb",
        "minCellCount": 200,
        "outCodes": {
            "a": "cellTypeName",
            "s": "cellTypeName"
        },
        "templates": [
            {
                "name": "templateDisplayName",
                "shortName": "abbrev",
                "favicon": "images/favicon.png",
                "template": "Handlebars template string with {{caseNumber}} {{total}} {{cellType}} {{comments}}"
            }
        ]
    }
]
```

**Schema Validation Rules**:
1. Root must be an array with at least 1 element
2. Each element must have `specimenType` (string, unique), `outCodes` (object), `templates` (array)
3. `outCodes` keys must be single lowercase letters
4. `outCodes` values must be non-empty strings
5. Each template must have `name` (string) and `template` (string)
6. Template strings must contain `{{total}}`
7. `minCellCount` is optional; defaults to 200 (BM) or 100 (PB) if absent

---

## 4. DOM Element ID Reference

| Element ID | Type | Purpose |
|-----------|------|---------|
| `caseNumber` | input[text] | Case/accession number entry |
| `active-case-display` | span | Persistent case number display |
| `specimenType` | select | BM/PB dropdown selector |
| `counter-tbl` | div | Container for counting table(s) |
| `counter` | table | The counting table |
| `{spec}-{cellType}` | input[number] | Individual cell count (e.g., `bm-blast`) |
| `{spec}-tot` | input[number] | Total count display |
| `{spec}-{cellType}-pct` | td | Percentage display cell |
| `{spec}-tot-pct` | td | Total percentage display |
| `morphComments` | textarea | Morphology comments |
| `btnStartCount` | button | Start Count button |
| `btnCountDone` | button | Count Done button |
| `btnCountReset` | button | Reset button |
| `tabs` | div | Output tabbed container |
| `session-history` | div | Session history panel |
| `output-here` | div | Master output container |

---

## 5. CSS Class Reference

| Class | Applied To | Purpose |
|-------|-----------|---------|
| `hidden` | div, table | Display: none toggle |
| `bm` | table, div.output | Bone marrow elements |
| `pb` | table, div.output | Peripheral blood elements |
| `cellAmount` | input | Cell count input styling and selection |
| `totalAmount` | input | Total count input (read-only) |
| `namecell` | td | Header row cell type label |
| `datacell` | td | Count row input container |
| `percentrow` | td | Percentage display cell |
| `keys` | td | Key mapping display cell |
| `tab-link` | li | Tab navigation item |
| `tab-content` | div | Tab content panel |
| `current` | li, div | Active tab indicator |
| `output` | div | Output container |
| `copy-btn` | button | Copy to clipboard button |
| `case-display` | span | Persistent case number badge |
| `flash` | td | Keypress visual feedback (150ms) |

---

## 6. Error Handling

| Error Condition | Detection | Response |
|----------------|-----------|----------|
| templates.json load failure | Backbone fetch error callback | Display error message; disable all controls |
| Invalid JSON in templates.json | JSON.parse exception | Display error message; disable all controls |
| Division by zero (total = 0) | Check in calcPercent() | Return 0.00 for all percentages |
| NaN from parseInt | isNaN() check | Treat as 0 |
| Clipboard API unavailable | navigator.clipboard check | Fallback to document.execCommand('copy') or show manual copy instructions |
| sessionStorage unavailable | try/catch on setItem | Graceful degradation: session history disabled, warning displayed |
| Key not in outCodes mapping | hasOwnProperty check | Ignore keypress silently |

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - detailed design |
| B | 2026-02-19 | QMS | Added session export design notes |
| C | 2026-02-20 | QMS | Added theme toggle design notes |

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Software Engineer | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
