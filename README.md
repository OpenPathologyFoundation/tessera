# WBC ΔΣ – Manual Differential Counter

A keyboard-driven manual differential white blood cell counting tool for hematology laboratory personnel. Built for speed, accuracy, and clinical safety.

## Overview

WBC ΔΣ enables medical technologists and pathologists to perform manual differential WBC counts while looking through the microscope. Each cell type is assigned a single keyboard key. Press the key, the count increments. Real-time percentages update automatically. When done, formatted output is ready to copy into your LIS/EMR.

**Key design principles**: Bauhaus-inspired (form follows function), keyboard-first operation, zero server-side patient data, clinically-validated calculation engine.

---

## Run it locally

From the **repository root** — the directory holding `package.json`, not `web/`:

```bash
cd /path/to/tessera
npm run serve
```

Then open **<http://localhost:8089/>**. The root URL serves `counter.html`, so
there is no filename to type. Stop the server with Ctrl-C.

No install step and no dependencies are needed to run it: `serve.js` uses Node's
own `http` module, and the application is static files. `npm install` is only
needed to run the tests. To use a different port, `PORT=3000 npm run serve`.

---

## Features

| Feature | Description |
|---------|-------------|
| **Case Identification** | Optional case/accession number, displayed persistently once entered. Every shipped profile sets `requireCaseNumber: false`; a laboratory can make it mandatory in its own profile. |
| **Two Specimen Types** | Bone Marrow and Peripheral Blood (14 cell types each, configurable) |
| **Keyboard Counting** | Single-key increment, ergonomic left-hand zone: home row ASDFG, bottom ZXCVB, top QWERT |
| **Undo/Correction** | Shift + key decrements by 1 (cannot go below zero) |
| **Real-Time Percentages** | Auto-calculated with 2 decimal precision as you count |
| **Visual Feedback** | Green flash on increment, amber flash on decrement |
| **Progress Bar** | Tracks count toward the profile's target (default 500 BM / 200 PB). Reaching it is advisory, never blocking. A profile may state no target, and then no progress bar is shown — the grand total is the count. |
| **Sub-target advisory** | Completing below the target is **never blocked**. The report carries a note stating the count, the target, and the confidence interval that count supports — so the imprecision is quantified rather than merely flagged. Where a profile states no target the note does not arise; the per-percentage intervals do not depend on it, and a profile may not give up both. |
| **Morphology Comments** | Free-text field, keyboard-isolated (typing doesn't trigger counts) |
| **Institutional Templates** | Yale SOM, Precipio DX, MGH for BM; MGH for PB |
| **Copy to Clipboard** | One-click copy of formatted output for LIS/EMR |
| **Session History** | Completed counts stored in browser session for review |
| **Session Export** | Export session history to CSV/JSON for local records |
| **Reset Protection** | Confirmation dialog prevents accidental data loss |
| **Theme Toggle** | Light/Dark modes for ergonomic use in varying lighting |
| **Data Privacy** | All data stays in the browser. Nothing transmitted to any server. |

---

## Keyboard Mappings — Ergonomic Left-Hand Layout

The default **14-Type Nucleated Differential** profile (`ndc-14`) maps all 14 cell types to the **left-hand ergonomic zone** (ASDFG / ZXCVB / QWERT). The same keys are used for both Bone Marrow and Peripheral Blood.

### Home Row (most common cells)

| Key | Cell Type | Description |
|-----|-----------|-------------|
| F | poly | Segmented neutrophils |
| D | bands | Band neutrophils |
| S | lymph | Lymphocytes |
| A | mono | Monocytes |
| G | eos | Eosinophils |

### Bottom Row (precursors & less common)

| Key | Cell Type | Description |
|-----|-----------|-------------|
| V | myelo | Myelocytes |
| C | meta | Metamyelocytes |
| X | blasts | Blasts |
| Z | baso | Basophils |
| B | nrbc | Nucleated RBCs / Erythroid precursors |

### Top Row (rare / reach keys)

| Key | Cell Type | Description |
|-----|-----------|-------------|
| R | pro | Promyelocytes |
| E | plasma | Plasma cells |
| W | mast | Mast cells |
| Q | other | Other cells |

**Shift + key** = undo (decrement by 1)

A right-hand layout (HJKL; / NM,./ / YUIOP) is one click in the [Configuration Editor](web/editor.html) — *auto-assign right-hand keys*. It is a key assignment, not a separate profile. Key mappings are fully customizable there or by editing `templates.json`.

---

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Vanilla JavaScript (ES5+) | Zero framework dependencies |
| Styling | Tailwind CSS (vendored, `web/vendor/tailwind.js`) | Utility-first, Bauhaus-minimal design |
| Fonts | Inter, JetBrains Mono, Libre Franklin | Self-hosted in `web/vendor/fonts/`; no external request (URS-094). Licences in `NOTICE` |
| Server | Any static file server | No backend logic required |
| Config | `settings/templates.json` | Cell types, keys, templates are all configurable |
| Tests | Node.js built-in test runner | Zero npm dependencies for testing |

---

## Deployment

### Option 1: Static File Server (Simplest)

The application is entirely client-side. Any web server that can serve static files will work.

#### Using npm (recommended — zero dependencies)

```bash
cd /path/to/tessera        # the repository root, where package.json is
npm run serve
# Open http://localhost:8089/
```

The built-in `serve.js` uses Node's native `http` module — no extra packages needed. It serves the `web/` directory, so run it from the repository root rather than from inside `web/`. To change the port: `PORT=3000 npm run serve`

#### Using Nginx

```nginx
server {
    listen 80;
    server_name wbcds.yourlab.org;
    root /var/www/wbcds/web;
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
scp -r web/ user@server:/var/www/wbcds/web/
sudo systemctl restart nginx
```

#### Using Apache

```apache
<VirtualHost *:80>
    ServerName wbcds.yourlab.org
    DocumentRoot /var/www/wbcds/web
    DirectoryIndex counter.html

    <Directory /var/www/wbcds/web>
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
jar -cf wbcds.war -C web .

# 2. Deploy to Tomcat
cp wbcds.war $CATALINA_HOME/webapps/

# 3. Access at http://server:8080/wbcds/counter.html
```

Or copy directly into Tomcat's webapps:

```bash
cp -r web/ $CATALINA_HOME/webapps/wbcds/
```

### Option 3: Docker

```dockerfile
FROM nginx:alpine
COPY web/ /usr/share/nginx/html/
EXPOSE 80
```

```bash
docker build -t wbcds .
docker run -d -p 8089:80 wbcds
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
    "outSentence": "A {{total}}-cell count: {{blasts}}% blasts, {{pro}}% promyelocytes..."
}
```

Available placeholders: `{{total}}`, `{{caseNumber}}`, `{{comments}}`, and any cell type name from `outCodes`.

### Changing the Target Cell Count

```json
{
    "specimenType": "bm",
    "targetCount": 500,
    ...
}
```

`minCellCount` was the v1 field name and no longer exists; the v2 schema calls
it `targetCount`, and reaching it is advisory rather than blocking. Set it to
`null` for a laboratory that counts to no target: omitting the field takes the
default instead, so the absence has to be stated rather than implied.

A profile that relies on a field whose meaning changed in a particular release
declares that release at the top level, as `"minAppVersion": "2.23.0"`. An older
application refuses such a profile and says so rather than reading it by the
older rules — the service worker fetches configuration network-first and the
application shell cache-first, so a browser can hold a newer profile than the
code running in it (DCR-042). Declare it only where the semantics actually
changed; a profile that needs nothing should claim nothing.

### Changing Keyboard Mappings

```json
"outCodes": {
    "F": "poly",
    "D": "bands",
    "S": "lymph",
    ...
}
```

Keys must be single characters (letters or punctuation like `;`, `,`, `.`, `/`). Values must be unique within a specimen type. Use the [Configuration Editor](web/editor.html) for a visual click-to-assign experience.

---

## File Structure

```
.
├── CONTRIBUTING.md
├── LICENSE
├── NOTICE               # Third-party attributions and the reserved marks
├── QMS/                 # Quality Management System (Design History File)
├── README.md
├── SECURITY.md
├── SUPPORT.md
├── TRADEMARKS.md
├── USER-GUIDE.md        # Operator documentation
├── assets/              # Branding assets (logo is restricted; see License section)
│   └── card.png
├── evidence/            # Background research behind the design decisions
├── legacy/              # The 2015 predecessor, retained for the mdc-2015-9 profile
├── package-lock.json
├── package.json
├── playwright.config.js
├── scripts/             # QMS drift-control generators (counts, facts, registers)
├── serve.js             # Static server for local use; serves web/
├── tests/               # Unit and behavioural suites (node --test)
├── tests-e2e/           # System suites (Playwright, three engines)
└── web/                 # Static app (deploy this folder)
```

---

## Testing

### Running the Tests

Verification runs in three layers. The governing rule is that **no layer
verifies a copy of the implementation** — every test executes shipped code.

```bash
npm install          # jsdom + Playwright (dev dependencies only)
npx playwright install chromium firefox webkit

npm test             # unit + behavioural (Node runner + jsdom)
npm run test:e2e     # system tests in a real browser (Playwright)
npm run test:all     # both
```

| Layer | Runner | What it executes |
|-------|--------|------------------|
| **Unit** | `node --test` | `web/scripts/wbc-core.js` called directly — the shipped calculation, template, sanitisation and configuration engine |
| **Behaviour** | `node --test` + jsdom | The real `counter.html` + `wbc-core.js` + `mdc-app.js` in a DOM: phase machine, keyboard handler, autosave, Continue Counting, configuration controls |
| **System** | Playwright + Chromium / Firefox / WebKit | The deployed application over HTTP: downloads, system clipboard, service worker and offline reload, printing, editor round-trip |

The application ships with no runtime dependencies; jsdom and Playwright are
development dependencies used only by the test suite.

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

| Suite | File | Layer | What It Verifies |
|-------|------|-------|-----------------|
| 01 | `tests/01-calculation-engine.test.js` | Unit | Percentages, sum-to-100 (URS-034) incl. a 2 000-case property test, M:E ratio, absolute counts, low-count advisory, hostile input |
| 02 | `tests/02-configuration.test.js` | Unit | templates.json schema, key mappings, template placeholders, target counts |
| 03 | `tests/03-html-structure.test.js` | Static | Required elements, phases, modals, accessibility, local-asset and service-worker requirements |
| 04 | `tests/04-javascript-integrity.test.js` | Static + Unit | Keyboard guards, division-by-zero, escaping behaviour, script load order, no inline control wiring |
| 05 | `tests/05-end-to-end-data-integrity.test.js` | Unit | Keypresses → counts → percentages → report → export, through the shipped engine |
| 06 | `tests/06-audio-engine.test.js` | Static | Audio engine structure and integration points |
| 07 | `tests/07-autosave.test.js` | Static | Autosave function presence, storage key, state shape |
| 08 | `tests/08-config-schema-v2.test.js` | Unit | v2 schema; `normalizeConfig` round-trip; reserved placeholder names |
| 09 | `tests/09-preset-catalog.test.js` | Unit | Preset catalogue integrity and ergonomic zones |
| 10 | `tests/10-config-editor.test.js` | Static | Editor structure, JS integrity, key assignment controls |
| 11 | `tests/11-application-behavior.test.js` | **Behaviour** | The application executed in jsdom — 103 tests |
| E2E | `tests-e2e/*.spec.js` | **System** | The deployed application in Chromium, Firefox and WebKit — 150 specs x 3 engines |
| **Total** | | | **<!-- qms:fact tests_total -->1164<!-- /qms:fact --> tests** (<!-- qms:fact tests_node -->714<!-- /qms:fact --> Node + <!-- qms:fact tests_browser -->450<!-- /qms:fact --> browser), of which <!-- qms:fact tests_skipped -->7<!-- /qms:fact --> are documented skips |

See `QMS/DHF/DCR/DCR-004-Verification-Integrity-Remediation.md` for why the
suite was restructured: prior to it, no test executed the application at all.

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
| **URS-001** | 71 user requirements with priority and clinical rationale |
| **SRS-001** | 207 testable system requirements derived from URS |
| **SAD-001** | System architecture, component diagram, data flows, state machine |
| **SDD-001** | Detailed software design with pseudocode for all algorithms |
| **RA-001** | FMEA risk analysis: 56 hazards, severity/occurrence/detectability scoring |
| **TP-001** | Test plan; register of 803 implemented verification cases, generated from the runners |
| **VV-001** | Verification & validation protocol with 15 calculation vectors and 6 clinical validation scenarios |
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

The application makes **no external request**. Every asset — scripts, styles, Tailwind and the three
typefaces — is served from the same origin and precached by the service worker, so a workstation that
has never reached the internet renders identically to one that has. This is verified rather than
asserted: `SC-060` fails the build if any page acquires a cross-origin reference.

---

## Security & Privacy

- **No patient data is transmitted** to any server. All processing is client-side.
- **No cookies** are used.
- **sessionStorage** holds the session history and the theme, and is cleared when
  the tab closes.
- **localStorage holds two things**: the active configuration profile, and — while
  a count is in progress — a crash-recovery snapshot under `wbcds_autosave`.
  **That snapshot includes the accession number and the free-text morphology
  comments**, so it survives a browser restart on that workstation. It is written
  so an interrupted count can be recovered rather than recounted, is discarded
  when the count is completed or reset, and is discarded on load if it is more
  than 12 hours old.
  On a shared workstation this is data at rest: the residual exposure is recorded
  in `RA-001` and the control is local policy — a per-user profile, or clearing
  browsing data between operators.
- **Input sanitization** via HTML entity escaping prevents XSS.
- The case/accession number is the only specimen identifier entered.

---

## Limitations

1. **This is a counting aid, not a diagnostic system.** All cell identification is performed by the human operator.
2. **Session data is temporary.** It is lost when the browser tab or window is closed.
3. **The application does not replace the LIS.** Always copy results to the system of record.
4. **No multi-user or collaborative features.** It is a single-operator tool.
5. **Latin scripts only, for the bundled typefaces.** The self-hosted fonts carry the `latin` and `latin-ext` subsets. Text in Cyrillic, Greek or Vietnamese renders in a system fallback font rather than failing — a cosmetic difference in free-text comments, not a functional limit.

---

## Contributing

1. All changes must update the corresponding QMS documents.
2. All new features must have test coverage traceable to SRS requirements.
3. Create/update a DCR entry in `QMS/DHF/DCR/` for each change set.
4. Run `npm run test:qms` to capture evidence and update TR/DCR records.
5. Follow the existing code style: vanilla JS, no framework dependencies, functions over classes.

---

## License

**The code is open. The name and the logo are not.**

- **Source code** — Apache License 2.0. See [`LICENSE`](LICENSE). Use it, modify
  it, distribute it, sell it, build a commercial product on it. That is what the
  licence is for.
- **The name "WBC ΔΣ" and the logo** — reserved, and **not** granted by
  Apache-2.0, which withholds trademark rights at §6. See
  [`TRADEMARKS.md`](TRADEMARKS.md) for the full policy and
  [`NOTICE`](NOTICE), which redistributions must carry.

In practice: a commercial product may be built on this software, but it must not
be *called* WBC ΔΣ or carry its logo, and must not imply endorsement. A fork
meant for distribution should give itself its own name and mark. Saying
truthfully that your product is derived from WBC ΔΣ is fine and needs no
permission.

Requests to use the name or mark beyond that: `info@openpathology.tech`.
