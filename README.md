# Manual Differential Counter (MDC)

A keyboard-driven manual differential white blood cell counting tool for hematology laboratory personnel. Built for speed, accuracy, and clinical safety.

## Overview

The MDC enables medical technologists and pathologists to perform manual differential WBC counts while looking through the microscope. Each cell type is assigned a single keyboard key. Press the key, the count increments. Real-time percentages update automatically. When done, formatted output is ready to copy into your LIS/EMR.

**Key design principles**: Bauhaus-inspired (form follows function), keyboard-first operation, zero server-side patient data, clinically-validated calculation engine.

---

## Features

| Feature | Description |
|---------|-------------|
| **Case Identification** | Mandatory case/accession number before counting can begin. Displayed persistently. |
| **Two Specimen Types** | Bone Marrow (9 cell types) and Peripheral Blood (9 cell types) |
| **Keyboard Counting** | Single-key increment: A, S, D, F, Z, X, C, V, B |
| **Undo/Correction** | Shift + key decrements by 1 (cannot go below zero) |
| **Real-Time Percentages** | Auto-calculated with 2 decimal precision as you count |
| **Visual Feedback** | Green flash on increment, amber flash on decrement |
| **Progress Bar** | Tracks count toward minimum threshold (200 BM / 100 PB) |
| **Minimum Count Enforcement** | Warning dialog when completing below threshold with explicit override |
| **Morphology Comments** | Free-text field, keyboard-isolated (typing doesn't trigger counts) |
| **Institutional Templates** | Yale SOM, Precipio DX, MGH for BM; MGH for PB |
| **Copy to Clipboard** | One-click copy of formatted output for LIS/EMR |
| **Session History** | Completed counts stored in browser session for review |
| **Reset Protection** | Confirmation dialog prevents accidental data loss |
| **Data Privacy** | All data stays in the browser. Nothing transmitted to any server. |

---

## Keyboard Mappings

### Bone Marrow

| Key | Cell Type | Description |
|-----|-----------|-------------|
| A | blast | Myeloblasts |
| S | pro | Promyelocytes / Myelocytes |
| D | gran | Maturing granulocytes |
| F | eryth | Erythroid precursors |
| Z | baso | Basophils / Mast cells |
| X | eos | Eosinophils |
| C | plasma | Plasma cells |
| V | lymph | Lymphocytes |
| B | mono | Monocytes |

### Peripheral Blood

| Key | Cell Type | Description |
|-----|-----------|-------------|
| A | poly | Segmented neutrophils |
| S | band | Band neutrophils |
| D | lymph | Lymphocytes |
| F | mono | Monocytes |
| Z | eos | Eosinophils |
| X | baso | Basophils |
| C | pro | Immature granulocytic precursors |
| V | blast | Blasts |
| B | other | Other cells |

**Shift + key** = undo (decrement by 1)

---

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Vanilla JavaScript (ES5+) | Zero framework dependencies |
| Styling | Tailwind CSS (CDN) | Utility-first, Bauhaus-minimal design |
| Fonts | Inter + JetBrains Mono | Google Fonts (CDN) |
| Server | Any static file server | No backend logic required |
| Config | `settings/templates.json` | Cell types, keys, templates are all configurable |
| Tests | Node.js built-in test runner | Zero npm dependencies for testing |

---

## Deployment

### Option 1: Static File Server (Simplest)

The application is entirely client-side. Any web server that can serve static files will work.

#### Using npm (recommended — zero dependencies)

```bash
npm run serve
# Open http://localhost:8089/
```

The built-in `serve.js` uses Node's native `http` module — no extra packages needed. To change the port: `PORT=3000 npm run serve`

#### Using Nginx

```nginx
server {
    listen 80;
    server_name mdc.yourlab.org;
    root /var/www/mdc/web;
    index counter.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(js|css|json|png|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Copy files to server
scp -r web/ user@server:/var/www/mdc/web/
sudo systemctl restart nginx
```

#### Using Apache

```apache
<VirtualHost *:80>
    ServerName mdc.yourlab.org
    DocumentRoot /var/www/mdc/web
    DirectoryIndex counter.html

    <Directory /var/www/mdc/web>
        AllowOverride None
        Require all granted
    </Directory>

    # Cache static assets
    <FilesMatch "\.(js|css|json|png|woff2)$">
        ExpiresActive On
        ExpiresDefault "access plus 7 days"
    </FilesMatch>
</VirtualHost>
```

### Option 2: Java Servlet Container (Existing Infrastructure)

If you already run Tomcat / Jetty for the legacy app:

```bash
# 1. Build the WAR (the web/ directory IS the WAR content)
cd /path/to/project
jar -cf mdc.war -C web .

# 2. Deploy to Tomcat
cp mdc.war $CATALINA_HOME/webapps/

# 3. Access at http://server:8080/mdc/counter.html
```

Or copy directly into Tomcat's webapps:

```bash
cp -r web/ $CATALINA_HOME/webapps/mdc/
```

### Option 3: Docker

```dockerfile
FROM nginx:alpine
COPY web/ /usr/share/nginx/html/
EXPOSE 80
```

```bash
docker build -t mdc .
docker run -d -p 8089:80 mdc
# Open http://localhost:8089/counter.html
```

### Option 4: GitHub Pages / Netlify / Vercel

Simply point the deployment to the `web/` directory. The application is 100% static — no build step required.

---

## Configuration

All cell types, keyboard mappings, output templates, and minimum counts are defined in:

```
web/settings/templates.json
```

### Adding a New Output Template

Add a new object to the `templates` array for any specimen type:

```json
{
    "tplCode": "mylab",
    "tplName": "My Laboratory",
    "outSentence": "A {{total}}-cell count: {{blast}}% blasts, {{pro}}% promyelocytes..."
}
```

Available placeholders: `{{total}}`, `{{caseNumber}}`, `{{comments}}`, and any cell type name from `outCodes`.

### Changing the Minimum Cell Count

```json
{
    "specimenType": "bm",
    "minCellCount": 500,
    ...
}
```

### Changing Keyboard Mappings

```json
"outCodes": {
    "A": "blast",
    "S": "pro",
    ...
}
```

Keys must be single uppercase letters. Values must be unique within a specimen type.

---

## File Structure

```
project/
├── web/                          # Application root (deploy this folder)
│   ├── counter.html              # Main application (NEW - modern UI)
│   ├── index.jsp                 # Legacy application (preserved)
│   ├── scripts/
│   │   ├── mdc-app.js            # Modern application logic (32 KB)
│   │   ├── app.js                # Legacy business logic
│   │   ├── views.js              # Legacy Backbone views
│   │   ├── models.js             # Legacy Backbone models
│   │   ├── collections.js        # Legacy Backbone collections
│   │   ├── routes.js             # Legacy Backbone router
│   │   └── defines.js            # Legacy namespace
│   ├── settings/
│   │   └── templates.json        # Configuration (cell types, templates)
│   ├── styles/                   # Legacy CSS
│   ├── images/                   # Favicons and textures
│   └── WEB-INF/
│       └── web.xml               # Java EE descriptor
├── tests/                        # Automated test suite
│   ├── 01-calculation-engine.test.js
│   ├── 02-configuration.test.js
│   ├── 03-html-structure.test.js
│   ├── 04-javascript-integrity.test.js
│   └── 05-end-to-end-data-integrity.test.js
├── QMS/                          # Quality Management System
│   └── DHF/                      # Design History File
│       ├── DHF-001-DesignHistoryFile-Index.md
│       ├── URS-001-UserRequirementsSpecification.md
│       ├── SRS-001-SystemRequirementsSpecification.md
│       ├── SAD-001-SystemArchitectureDesign.md
│       ├── SDD-001-SoftwareDetailedDesign.md
│       ├── RA-001-RiskAnalysis-FMEA.md
│       ├── TP-001-TestPlan.md
│       ├── VV-001-VerificationValidationProtocol.md
│       ├── RTM-001-RequirementsTraceabilityMatrix.md
│       ├── SOP-001-StandardOperatingProcedure.md
│       ├── TR-001-TestResults.md
│       └── test-output-raw.txt
├── package.json
└── README.md
```

---

## Testing

### Running the Tests

The test suite uses Node.js built-in test runner. **No npm install required.**

```bash
# Run all tests (using npm script — recommended)
npm test

# Or run directly with node
node --test 'tests/*.test.js'
```

### Test Suite Overview

| Suite | File | Tests | What It Verifies |
|-------|------|-------|-----------------|
| 01 | `01-calculation-engine.test.js` | 31 | Percentage calculation (15 VV-CALC vectors), increment/decrement logic, output JSON generation |
| 02 | `02-configuration.test.js` | 27 | templates.json schema, key mappings, template placeholders, min cell counts |
| 03 | `03-html-structure.test.js` | 36 | All required HTML elements, phases, modals, accessibility labels |
| 04 | `04-javascript-integrity.test.js` | 37 | Safety mechanisms (keyboard guards, division-by-zero, XSS escape, clipboard), state management |
| 05 | `05-end-to-end-data-integrity.test.js` | 15 | Full BM/PB counting workflows, undo/correction, edge cases, output rendering |
| **Total** | | **146** | |

### Test Traceability

Every test traces to:
- **SRS requirements** (SYS-xxx) — what system behavior is being verified
- **FMEA hazards** (HA-xxx) — what risk mitigation is being confirmed
- **VV protocol** (VV-CALC-xxx, VV-TPL-xxx, VV-E2E-xxx) — formal verification vectors

Full traceability is documented in `QMS/DHF/TR-001-TestResults.md`.

### Current Results

```
# tests 146
# suites 36
# pass 146
# fail 0
# pass rate 100.00%
# duration 78ms
```

---

## QMS / Design History File

The `QMS/DHF/` directory contains the complete Design History File per 21 CFR Part 820 and IEC 62304:

| Document | Purpose |
|----------|---------|
| **DHF-001** | Design History File index and intended use statement |
| **URS-001** | 47 user requirements with priority and clinical rationale |
| **SRS-001** | 88 testable system requirements derived from URS |
| **SAD-001** | System architecture, component diagram, data flows, state machine |
| **SDD-001** | Detailed software design with pseudocode for all algorithms |
| **RA-001** | FMEA risk analysis: 22 hazards, severity/occurrence/detectability scoring |
| **TP-001** | Test plan with 68 test cases across 11 categories |
| **VV-001** | Verification & validation protocol with 15 calculation vectors and 4 clinical validation scenarios |
| **RTM-001** | Bidirectional requirements traceability matrix (100% coverage) |
| **SOP-001** | Standard operating procedure for clinical use |
| **TR-001** | Test execution results: 146/146 pass |

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Google Chrome | Latest 2 major | Supported |
| Mozilla Firefox | Latest 2 major | Supported |
| Microsoft Edge | Latest 2 major | Supported |
| Safari | Latest | Expected to work (not formally tested) |

The application works offline after initial page load (all assets served locally except Tailwind CSS CDN and Google Fonts).

---

## Security & Privacy

- **No patient data is transmitted** to any server. All processing is client-side.
- **No cookies** or localStorage are used for patient data.
- **sessionStorage** is used only for session history (auto-cleared on tab close).
- **Input sanitization** via HTML entity escaping prevents XSS.
- The case/accession number is the only specimen identifier entered.

---

## Limitations

1. **This is a counting aid, not a diagnostic system.** All cell identification is performed by the human operator.
2. **Session data is temporary.** It is lost when the browser tab or window is closed.
3. **The application does not replace the LIS.** Always copy results to the system of record.
4. **No multi-user or collaborative features.** It is a single-operator tool.
5. **Tailwind CSS is loaded from CDN.** For fully air-gapped deployment, download Tailwind CSS and serve it locally.

---

## Contributing

1. All changes must update the corresponding QMS documents.
2. All new features must have test coverage traceable to SRS requirements.
3. Run `npm test` and ensure 100% pass rate before submitting changes.
4. Follow the existing code style: vanilla JS, no framework dependencies, functions over classes.

---

## License

ISC
