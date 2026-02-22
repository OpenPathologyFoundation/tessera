# SAD-001: System Architecture Design

## Tessera

| Field | Value |
|-------|-------|
| **Document ID** | SAD-001 |
| **Version** | 1.0 |
| **Product** | Tessera |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001, SRS-001 |

---

## 1. Purpose

This document describes the high-level system architecture of the Tessera application. It defines the software architecture, component decomposition, data flows, technology stack, and design rationale.

## 2. Architecture Overview

Tessera is a single-page web application (SPA) implemented as a client-side MVC application using Backbone.js. All business logic, calculation, and rendering execute in the browser. There is no application server, database, or network API. The web server (Java Servlet container) serves static assets only.

### 2.1 Architecture Pattern

**Client-Side MVC (Model-View-Controller) via Backbone.js**

```
+-------------------------------------------------------------------+
|                        BROWSER CLIENT                              |
|                                                                    |
|  +------------------+  +-----------------+  +-------------------+  |
|  |    VIEWS         |  |    MODELS       |  |    UTILITIES      |  |
|  |  (Backbone.View) |  | (Backbone.Model)|  |  (app.tools,     |  |
|  |                  |  |                 |  |   app.utils)      |  |
|  |  - MakeTable     |  |  - CounterTable |  |                   |  |
|  |  - CreateOutput  |  |  - TabbedOutput |  |  - addToCell()    |  |
|  |  - Buttons       |  |                 |  |  - calcPercent()  |  |
|  |                  |  |                 |  |  - mkOutTplJson() |  |
|  +--------+---------+  +-------+---------+  +--------+----------+  |
|           |                    |                      |            |
|           v                    v                      v            |
|  +-------------------------------------------------------------------+
|  |                       DOM (index.jsp)                              |
|  |  - Counter Table  - Output Tabs  - Buttons  - Case Input          |
|  +-------------------------------------------------------------------+
|           |                                                        |
|           v                                                        |
|  +-------------------+                                             |
|  |  CONFIGURATION    |                                             |
|  |  templates.json   |                                             |
|  +-------------------+                                             |
+-------------------------------------------------------------------+
           |
           v (HTTP GET - static assets only)
+-------------------------------------------------------------------+
|                     WEB SERVER (Servlet Container)                  |
|  Serves: index.jsp, *.js, *.css, *.json, images, fonts           |
|  No dynamic server logic                                           |
+-------------------------------------------------------------------+
```

### 2.2 Design Rationale

| Decision | Rationale |
|----------|-----------|
| Client-side only | Eliminates server dependencies, network latency, and data privacy concerns. All patient data remains in the browser. |
| Backbone.js MVC | Provides structured code organization without heavy framework overhead. Appropriate for a focused single-purpose application. |
| JSON configuration | Cell types, key mappings, and templates are externalized, allowing customization without code changes. |
| Handlebars templates | Separates output format from logic. New institutional templates can be added to the JSON file. |
| No database | The tool is a counting aid, not a system of record. Session-only data eliminates PHI storage concerns. |
| Keyboard-driven input | Matches clinical workflow where operator's eyes are on the microscope. |

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
|  | - Validation          |     | - Table toggle               |    |
|  | - Auto-clear trigger  |     | - Lock after start           |    |
|  +-----------+-----------+     +-------------+----------------+    |
|              |                               |                     |
|              v                               v                     |
|  +-----------------------+     +------------------------------+    |
|  | COUNTING ENGINE       |     | COUNTING TABLE RENDERER      |    |
|  | - Keydown listener    |     | - Header row (cell names)    |    |
|  | - Key-to-cell mapping |     | - Count row (inputs)         |    |
|  | - Increment/Decrement |     | - Percentage row             |    |
|  | - Total calculation   |     | - Key mapping row            |    |
|  | - Visual feedback     |     | - Total column               |    |
|  +-----------+-----------+     +-------------+----------------+    |
|              |                               |                     |
|              v                               v                     |
|  +-----------------------+     +------------------------------+    |
|  | CALCULATION ENGINE    |     | MORPHOLOGY COMMENTS          |    |
|  | - Percentage calc     |     | - Free-text input            |    |
|  | - Division by zero    |     | - Keyboard isolation         |    |
|  | - Rounding            |     | - Output integration         |    |
|  | - Sum validation      |     +------------------------------+    |
|  +-----------+-----------+                                         |
|              |                                                     |
|              v                                                     |
|  +-----------------------+     +------------------------------+    |
|  | COUNT COMPLETION      |     | OUTPUT GENERATOR             |    |
|  | - Min count check     |     | - Template compilation       |    |
|  | - Lock controls       |     | - Tabbed display             |    |
|  | - Trigger output      |     | - Copy to clipboard          |    |
|  +-----------+-----------+     +------------------------------+    |
|              |                                                     |
|              v                                                     |
|  +-----------------------+     +------------------------------+    |
|  | RESET CONTROLLER      |     | SESSION HISTORY              |    |
|  | - Confirmation dialog |     | - In-memory store            |    |
|  | - State clearing      |     | - sessionStorage backup      |    |
|  | - Focus management    |     | - Read-only review           |    |
|  +-----------------------+     +------------------------------+    |
|                                                                    |
|  +-----------------------+                                         |
|  | CONFIGURATION LOADER  |                                         |
|  | - Fetch templates.json|                                         |
|  | - Parse & validate    |                                         |
|  | - Error handling      |                                         |
|  +-----------------------+                                         |
+-------------------------------------------------------------------+
```

### 3.2 Component Descriptions

#### 3.2.1 Case Identification Component
- **Responsibility**: Manages the case/accession number lifecycle
- **Inputs**: User keyboard input in the case number text field
- **Outputs**: Validated case number string; clear-data trigger signal
- **SRS Trace**: SYS-001 through SYS-008

#### 3.2.2 Specimen Type Controller
- **Responsibility**: Manages BM/PB selection and table visibility toggling
- **Inputs**: Dropdown selection change event
- **Outputs**: Active specimen type identifier; show/hide signals to table and output components
- **SRS Trace**: SYS-010 through SYS-017

#### 3.2.3 Counting Engine
- **Responsibility**: Captures keyboard input and dispatches count changes
- **Inputs**: Document-level keydown events
- **Outputs**: Increment/decrement signals to specific cell types
- **SRS Trace**: SYS-030 through SYS-039

#### 3.2.4 Counting Table Renderer
- **Responsibility**: Renders and updates the visual counting table
- **Inputs**: Cell type definitions from configuration; count values from Counting Engine
- **Outputs**: Rendered HTML table with counts, percentages, and key labels
- **SRS Trace**: SYS-020 through SYS-026

#### 3.2.5 Calculation Engine
- **Responsibility**: Computes differential percentages from raw counts
- **Inputs**: Cell count values (integers), total count
- **Outputs**: Percentage values (2 decimal places)
- **Algorithm**: `percentage = (cell_count / total_count) * 100`, rounded to 2 decimal places
- **Edge Cases**: Division by zero returns 0.00
- **SRS Trace**: SYS-040 through SYS-045

#### 3.2.6 Morphology Comments Component
- **Responsibility**: Captures and manages free-text morphology observations
- **Inputs**: User text input in comment textarea
- **Outputs**: Comment text for inclusion in output
- **SRS Trace**: SYS-070 through SYS-073

#### 3.2.7 Count Completion Controller
- **Responsibility**: Manages the transition from counting to result output
- **Inputs**: "Count Done" button click
- **Outputs**: Lock signal; output generation trigger
- **SRS Trace**: SYS-050 through SYS-056

#### 3.2.8 Output Generator
- **Responsibility**: Compiles templates with count data and renders tabbed output
- **Inputs**: Template definitions, count data, case number, morphology comments
- **Outputs**: Rendered HTML in tabbed panels; clipboard-ready text
- **SRS Trace**: SYS-060 through SYS-067

#### 3.2.9 Reset Controller
- **Responsibility**: Manages the reset workflow including confirmation and state clearing
- **Inputs**: "Reset" button click; new case number entry
- **Outputs**: Clear signal to all components; focus management
- **SRS Trace**: SYS-080 through SYS-084

#### 3.2.10 Session History Manager
- **Responsibility**: Stores and retrieves completed count sessions
- **Inputs**: Completed count data from Count Completion Controller
- **Outputs**: Read-only session data for review
- **SRS Trace**: SYS-090 through SYS-095

#### 3.2.11 Configuration Loader
- **Responsibility**: Fetches and validates the templates.json configuration
- **Inputs**: HTTP GET to settings/templates.json
- **Outputs**: Parsed configuration objects; error state if load fails
- **SRS Trace**: SYS-100 through SYS-103

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
[Counting Engine: map key to cell type]
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
  [Update cell count in DOM]
            |
            v
  [Update total count]
            |
            v
  [Calculation Engine: recalculate all percentages]
            |
            v
  [Update percentage display cells]
            |
            v
  [Visual feedback flash on affected cell]
```

### 4.2 Count Completion Data Flow

```
[User clicks "Count Done"]
       |
       v
[Check total >= minimum threshold]
       |
       +---> [Below minimum?]
       |         |
       |    Yes  |  No
       |         |
       v         |
  [Warning dialog] |
       |         |
  [User confirms?] |
       |         |
  No:  |  Yes:   |
  [Abort] |      |
       +----+----+
            |
            v
  [Detach keydown listener]
            |
            v
  [Set inputs to read-only]
            |
            v
  [For each output template:]
  [  Compile Handlebars template with:]
  [    - case number                  ]
  [    - total count                  ]
  [    - per-cell percentages         ]
  [    - morphology comments          ]
            |
            v
  [Render tabbed output display]
            |
            v
  [Save to session history]
```

### 4.3 Reset / New Case Data Flow

```
[User clicks "Reset" OR enters new case number]
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
[Abort/Restore] |      |
       +--------+------+
                |
                v
  [Clear all cell counts to 0]
  [Clear all percentages to 0.00%]
  [Clear total to 0]
  [Clear output text]
  [Clear morphology comments]
  [Clear case number (if reset)]
  [Disable Start Count]
  [Enable specimen type selector]
  [Focus case number input]
```

---

## 5. Technology Stack

### 5.1 Runtime Environment

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Server | Java Servlet Container (Tomcat/Jetty) | 3.1+ | Static asset serving |
| Page Engine | JSP | 2.3 | Initial HTML rendering |
| MVC Framework | Backbone.js | 1.2.0 | Client-side MVC structure |
| DOM Manipulation | jQuery | 2.1.4 | Cross-browser DOM API |
| Templating | Handlebars.js | 3.0.3 | Output template rendering |
| Utilities | Underscore.js | 1.8.3 | Collection/array utilities |
| UI Components | jQuery UI | 1.11.4 | CSS only (spinner styling) |

### 5.2 File Organization

```
web/
├── index.jsp                    # Main SPA entry point
├── backbone-min.js              # Backbone.js library
├── settings/
│   └── templates.json           # Configuration (cell types, templates)
├── scripts/
│   ├── defines.js               # Namespace initialization
│   ├── models.js                # Backbone models
│   ├── collections.js           # Backbone collections
│   ├── views.js                 # Backbone views (UI components)
│   ├── app.js                   # Business logic utilities
│   └── routes.js                # Backbone router (page init)
├── styles/
│   ├── counter.css              # Counter table and output styles
│   └── landing-style.css        # Page layout and header styles
├── fonts/                       # Custom fonts
├── images/                      # Favicons, textures, backgrounds
├── libraries/                   # jQuery UI CSS
└── library/                     # Handlebars.js
```

### 5.3 Script Loading Order

The following load order is mandatory due to dependencies:

1. jQuery (CDN) - DOM foundation
2. Handlebars.js (local) - Template engine
3. Underscore.js (CDN) - Backbone dependency
4. Backbone.js (local) - MVC framework
5. defines.js - Namespace setup (depends on nothing)
6. collections.js - Collection definitions (depends on Backbone)
7. models.js - Model definitions (depends on Backbone)
8. views.js - View definitions (depends on Backbone, jQuery, Handlebars)
9. app.js - Business logic (depends on jQuery)
10. routes.js - Router initialization (depends on all above)

---

## 6. State Management

### 6.1 Application States

```
[IDLE] ──(enter case #)──> [CASE_ENTERED] ──(Start Count)──> [COUNTING]
                                                                  |
                                                          (Count Done)
                                                                  |
                                                                  v
[IDLE] <──(Reset)───────── [COMPLETED] <──(confirm)──── [COUNT_REVIEW]
```

| State | Description | Active Controls |
|-------|-------------|-----------------|
| IDLE | No case loaded; waiting for input | Case number input, specimen type selector |
| CASE_ENTERED | Case number provided; ready to count | Start Count button, specimen type selector |
| COUNTING | Active keydown listener; counting in progress | Keyboard input, Count Done, Reset |
| COUNT_REVIEW | Minimum count check; confirmation | Warning dialog (if below threshold) |
| COMPLETED | Count locked; output displayed | Output tabs, Copy to Clipboard, Reset, New Case |

### 6.2 Data in Memory

| Data Item | Type | Scope | Persistence |
|-----------|------|-------|-------------|
| Cell counts | Integer array | Per counting session | In-memory, lost on page close |
| Percentages | Float array | Per counting session | Calculated, not stored independently |
| Case number | String | Per counting session | In-memory |
| Morphology comments | String | Per counting session | In-memory |
| Template configuration | JSON object | Application lifetime | Loaded from file on page load |
| Session history | Array of objects | Browser session | sessionStorage |

---

## 7. Security Architecture

### 7.1 Data Privacy

| Concern | Mitigation |
|---------|-----------|
| Patient data transmission | No network transmission of patient data. All processing is client-side. |
| Data at rest | sessionStorage only; cleared on tab/window close. No localStorage, no cookies. |
| Cross-site scripting (XSS) | Handlebars auto-escapes HTML entities. Case number and comment inputs are sanitized. |
| Server-side data exposure | No server-side processing of patient data. Server serves static assets only. |

### 7.2 Input Validation

| Input | Validation Rule |
|-------|----------------|
| Case number | Alphanumeric + hyphens + slashes, max 30 characters, trimmed |
| Keyboard input | Only mapped keys processed; all others ignored |
| Morphology comments | Free text, HTML entities escaped on output |
| Configuration JSON | Schema validated on load; malformed data prevents application start |

---

## 8. Deployment Architecture

```
+-------------------+          +----------------------------+
|  Lab Workstation   |  HTTP    |  Application Server        |
|  (Browser)         | <------> |  (Tomcat/Jetty)            |
|                    |          |                            |
|  - Chrome/FF/Edge  |          |  /web/                     |
|  - All logic runs  |          |    index.jsp               |
|    client-side     |          |    scripts/*.js            |
|                    |          |    styles/*.css             |
|                    |          |    settings/templates.json  |
+-------------------+          +----------------------------+
```

- No external service dependencies
- No database
- No API endpoints
- Single deployment artifact (WAR file)

---

## 9. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - architecture defined |

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Software Architect | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
