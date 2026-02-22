# Tessera – Manual Differential Counter

A keyboard-driven manual differential white blood cell counting tool for hematology laboratory personnel. Built for speed, accuracy, and clinical safety.

**Branding note:** The software is Apache-2.0 licensed, but the Tessera logo (`assets/card.png`) is reserved for project-identifying use and is not licensed for reuse as branding.

## Overview

Tessera enables medical technologists and pathologists to perform manual differential WBC counts while looking through the microscope. Each cell type is assigned a single keyboard key. Press the key, the count increments. Real-time percentages update automatically. When done, formatted output is ready to copy into your LIS/EMR.

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
| **Session Export** | Export session history to CSV/JSON for local records |
| **Reset Protection** | Confirmation dialog prevents accidental data loss |
| **Theme Toggle** | Light/Dark modes for ergonomic use in varying lighting |
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
    server_name tessera.yourlab.org;
    root /var/www/tessera/web;
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
scp -r web/ user@server:/var/www/tessera/web/
sudo systemctl restart nginx
```

#### Using Apache

```apache
<VirtualHost *:80>
    ServerName tessera.yourlab.org
    DocumentRoot /var/www/tessera/web
    DirectoryIndex counter.html

    <Directory /var/www/tessera/web>
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
jar -cf tessera.war -C web .

# 2. Deploy to Tomcat
cp tessera.war $CATALINA_HOME/webapps/

# 3. Access at http://server:8080/tessera/counter.html
```

Or copy directly into Tomcat's webapps:

```bash
cp -r web/ $CATALINA_HOME/webapps/tessera/
```

### Option 3: Docker

```dockerfile
FROM nginx:alpine
COPY web/ /usr/share/nginx/html/
EXPOSE 80
```

```bash
docker build -t tessera .
docker run -d -p 8089:80 tessera
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
.
├── CONTRIBUTING.md
├── LICENSE
├── QMS/                 # Quality Management System
├── README.md
├── SECURITY.md
├── SUPPORT.md
├── assets/              # Branding assets (logo is restricted; see License section)
│   └── card.png
├── package-lock.json
├── package.json
├── scripts/
├── serve.js
├── TRADEMARKS.md
├── tests/
└── web/                 # Static app (deploy this folder)
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

### QMS Test Evidence (Required for Release)

To capture auditable evidence (raw output + environment metadata), use the QMS runner:

```bash
npm run test:qms
# Optional label for the evidence folder
npm run test:qms -- theme-toggle
```

This writes evidence to `QMS/DHF/TestEvidence/<timestamp>_run/` and:
- updates `QMS/DHF/TR-001-TestResults.md` with a run log entry
- updates the single Draft DCR (if exactly one exists)

If multiple Draft DCRs exist, specify which to update:

```bash
npm run test:qms -- --dcr DCR-001-Theme-Export-Clipboard-QMS
```

### CI / GitHub Actions (Optional)

CI can run `npm test` for quick feedback, but **QMS evidence requires `npm run test:qms`** so the run is archived under `QMS/DHF/TestEvidence/`. If you later add CI artifacts, ensure the evidence bundle is preserved and referenced in TR-001.

### Test Suite Overview

| Suite | File | Tests | What It Verifies |
|-------|------|-------|-----------------|
| 01 | `01-calculation-engine.test.js` | 30 | Percentage calculation (15 VV-CALC vectors), increment/decrement logic, output JSON generation |
| 02 | `02-configuration.test.js` | 25 | templates.json schema, key mappings, template placeholders, min cell counts |
| 03 | `03-html-structure.test.js` | 39 | All required HTML elements, phases, modals, accessibility labels |
| 04 | `04-javascript-integrity.test.js` | 42 | Safety mechanisms (keyboard guards, division-by-zero, XSS escape, clipboard), state management |
| 05 | `05-end-to-end-data-integrity.test.js` | 17 | Full BM/PB counting workflows, undo/correction, edge cases, output rendering |
| **Total** | | **153** | |

### Test Traceability

Every test traces to:
- **SRS requirements** (SYS-xxx) — what system behavior is being verified
- **FMEA hazards** (HA-xxx) — what risk mitigation is being confirmed
- **VV protocol** (VV-CALC-xxx, VV-TPL-xxx, VV-E2E-xxx) — formal verification vectors

Full traceability is documented in `QMS/DHF/TR-001-TestResults.md`.

### Latest Recorded Results

See `QMS/DHF/TR-001-TestResults.md` for the most recent executed run. Run `npm run test:qms` to update evidence and results.

---

## QMS / Design History File

The `QMS/DHF/` directory contains the complete Design History File per 21 CFR Part 820 and IEC 62304:

| Document | Purpose |
|----------|---------|
| **DHF-001** | Design History File index and intended use statement |
| **URS-001** | 49 user requirements with priority and clinical rationale |
| **SRS-001** | 93 testable system requirements derived from URS |
| **SAD-001** | System architecture, component diagram, data flows, state machine |
| **SDD-001** | Detailed software design with pseudocode for all algorithms |
| **RA-001** | FMEA risk analysis: 22 hazards, severity/occurrence/detectability scoring |
| **TP-001** | Test plan with 84 test cases across 12 categories |
| **VV-001** | Verification & validation protocol with 15 calculation vectors and 4 clinical validation scenarios |
| **RTM-001** | Bidirectional requirements traceability matrix (100% coverage) |
| **SOP-001** | Standard operating procedure for clinical use |
| **SOP-002** | Deployment procedure |
| **SOP-003** | Operations / maintenance procedure |
| **TR-001** | Test execution results (see latest run) |
| **DCR-001** | Design change record (per change set) |
| **TE-001** | Test evidence archive (`QMS/DHF/TestEvidence/`) |

For detailed quality checks and release steps, see `QMS/DHF/TP-001-TestPlan.md`, `QMS/DHF/TR-001-TestResults.md`, `QMS/DHF/SOP-002-Deployment.md`, and `QMS/DHF/SOP-003-Operations.md`.

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
3. Create/update a DCR entry in `QMS/DHF/DCR/` for each change set.
4. Run `npm run test:qms` to capture evidence and update TR/DCR records.
5. Follow the existing code style: vanilla JS, no framework dependencies, functions over classes.

---

## License

- **Source code**: Apache License 2.0 — see `LICENSE`.
- **Branding / logo assets**: Not licensed under Apache-2.0. The Tessera logo at `assets/card.png` is reserved for project-identifying use and may not be reused to brand derivative products/services or to imply endorsement.
