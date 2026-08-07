# TR-001: Test Execution Results

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | TR-001 |
| **Version** | 4.2 |
| **Product** | WBC ΔΣ v2.21.0 |
| **Date Executed** | 2026-08-06 (10:26:56 UTC) |
| **Status** | **PASS** (test outcome) |
| **Approval State** | **Approved** 2026-08-05 |
| **Parent Document** | DHF-001 |
| **Input Documents** | TP-001, VV-001, SRS-001 v2.1, RTM-001 v3.0 |
| **Change Record** | DCR-004 |
| **Evidence Folder** | `QMS/DHF/TestEvidence/2026-08-06_073300_review-p0-remediation/` — first bundle carrying a verified code identity (`56a68f2`, clean tree) |
| **Runners** | Node.js v26.5.0 built-in test runner; Playwright 1.62.1 / Chromium, Firefox, WebKit |
| **Platform** | macOS (darwin, arm64), Node.js v26.5.0, npm 11.17.0 |

---

## 1. Executive Summary

**<!-- qms:fact tests_total -->1104<!-- /qms:fact --> tests ran across 3 verification layers and 3 browser engines, with 0 failures and <!-- qms:fact tests_skipped -->7<!-- /qms:fact --> documented skips.**

| Metric | Value |
|--------|-------|
| Unit, static and behavioural tests | **<!-- qms:fact tests_node -->678<!-- /qms:fact -->** |
| System (browser) tests | **<!-- qms:fact tests_browser -->426<!-- /qms:fact -->** (chromium, firefox, webkit) |
| **Total** | **<!-- qms:fact tests_total -->1104<!-- /qms:fact -->** |
| Passed | all but the documented skips |
| Failed | **0** |
| Skipped (documented, §6) | **<!-- qms:fact tests_skipped -->7<!-- /qms:fact -->** |
| Pass Rate | **100.00%** |
| Suites | Node and Playwright; see the bundle's raw output |
| Skipped / Cancelled / Todo | 0 |
| Exit code | 0 |

Command: see `command.txt` in the evidence bundle this reports —
`<!-- qms:fact evidence_run_id -->2026-08-07_111531_run<!-- /qms:fact -->`.
Regenerate this evidence with `npm run test:qms`. The figures above are written
by that run and must not be edited by hand.

### 1.1 Comparison with the v2.0 baseline

| | v2.0 (2026-02-24) | v2.1.0 (this run) |
|---|---|---|
| Tests recorded | 191 | 768 |
| Tests executing shipped application code | **0** | 768 |
| Layers | Mirrored logic + static text assertions | Unit (shipped engine) + jsdom behaviour + browser system |
| Browser engines | none | Chromium, Firefox, WebKit |

This is not a like-for-like comparison. As recorded in DCR-004 §1, no test in
the v2.0 baseline executed the application: the calculation suites
re-implemented the algorithms locally and verified the copy, the remaining
suites asserted on file text, and the two that called `new Function(jsCode)`
performed a syntax check only. This run is the first in which a defect in the
shipped code can cause a test to fail.

---

## 2. Verification Layers

| Layer | Runner | What it executes | Suites |
|-------|--------|------------------|--------|
| **Unit** | `node --test` | `web/scripts/wbc-core.js` called directly — the shipped calculation, template, sanitisation, serialisation and configuration engine | 01, 02, 05, 08, 09 |
| **Behaviour** | `node --test` + jsdom 30 | Real `counter.html` + `wbc-core.js` + `mdc-app.js` executed in a DOM via `tests/helpers/app-harness.js` | 11 |
| **Static** | `node --test` | Structure and integrity assertions on the shipped HTML/JS/JSON artefacts | 03, 04, 06, 07, 10 |
| **System** | Playwright + Chromium / Firefox / WebKit | The application served by `serve.js` over HTTP in real browsers | `tests-e2e/` |

---

## 3. Node Suite Results (595 tests, 117 suites, 0 failures)

### Suite 01 — Calculation Engine

Executes `wbc-core.js` directly. Safety-critical arithmetic.

| Group | SRS Trace | FMEA Trace | Result |
|-------|-----------|------------|--------|
| Percentage Computation | SYS-040 to SYS-045 | HA-020, HA-021 | PASS |
| Sum to 100% | SYS-044 | HA-022 | PASS |
| Display Formatting | SYS-041 | — | PASS |
| Increment / Decrement | SYS-031 to SYS-033 | HA-013 | PASS |
| M:E Ratio | SYS-046, SYS-047 | HA-070, HA-072 | PASS |
| Absolute Counts | SYS-150 to SYS-153 | HA-024 | PASS |
| Low Count Advisory | SYS-052, SYS-053 | HA-030 | PASS |

Key verification vectors:

| VV ID | Description | Result |
|-------|------------|--------|
| VV-CALC-001 | All zeros — division-by-zero guard, no NaN/Infinity | **PASS** |
| VV-CALC-002 | Single cell = 100.00% | **PASS** |
| VV-CALC-003 | Two equal cells = 50.00% each | **PASS** |
| VV-CALC-004 | Fourteen equal cells — raw value 7.142857…% | **PASS** |
| VV-CALC-005 | One dominant cell 95/5 | **PASS** |
| VV-CALC-008 | Acute leukaemia pattern — 45% blasts | **PASS** |
| VV-CALC-011 | Repeating thirds sum to exactly 100.00 | **PASS** |
| VV-CALC-012 | Repeating sixths sum to exactly 100.00 | **PASS** |
| VV-CALC-014 | Maximum capacity 9 999 cells, no degradation | **PASS** |
| VV-CALC-016 | Fourteen equal cells sum to exactly 100.00 at 2 dp | **PASS** |
| VV-CALC-017 | Integer report percentages sum to exactly 100 | **PASS** |
| VV-CALC-018 | Zero total yields all zeros, not a forced 100 | **PASS** |
| VV-CALC-019 | No category deviates from its true value by more than one unit of the last decimal place | **PASS** |
| VV-CALC-020 | Property test — 2 000 randomised differentials × 2 precisions all sum to exactly 100 | **PASS** |
| VV-CALC-021 | Adjustment is deterministic for identical input | **PASS** |
| VV-CALC-022/023 | 2-decimal precision retained for low-percentage categories | **PASS** |
| VV-ME-001 to 006 | M:E ratio; configured precision; zero-denominator "N/A"; absent formula; all numerator members contribute | **PASS** |
| VV-ABS-001/002 | Absolute count arithmetic; non-positive WBC yields null, not NaN | **PASS** |
| VV-LOW-001 to 003 | Sub-target advisory raised, suppressed at target, suppressed with no target configured | **PASS** |

### Suite 05 — End-to-End Data Integrity

Drives keypresses → counts → percentages → report → export through the shipped
engine using the shipped configuration profile.

| VV ID | Description | Result |
|-------|------------|--------|
| VV-E2E-001 | Every mapped key increments exactly one category by one | **PASS** |
| VV-E2E-002 | Lowercase and uppercase count identically | **PASS** |
| VV-E2E-003 | Unmapped keys ignored | **PASS** |
| VV-E2E-004 | Shift+key undo; undo at zero is a no-op | **PASS** |
| VV-E2E-005 | 500-keystroke bone marrow count totals exactly 500 | **PASS** |
| VV-E2E-010 | Report percentages track displayed percentages within one point (HA-024) | **PASS** |
| VV-E2E-011 | Displayed and reported differentials both sum to 100 | **PASS** |
| VV-E2E-012 | No unresolved `{{token}}` survives rendering | **PASS** |
| VV-E2E-013 | Every specimen type renders every template | **PASS** |
| VV-E2E-014 | Reported M:E ratio matches the computed ratio | **PASS** |
| VV-E2E-015 | PB profile defines no M:E ratio and reports none | **PASS** |
| VV-E2E-020 | Session carries profile ID, name, version, target, timestamp | **PASS** |
| VV-E2E-021 | CSV export carries every traceability column | **PASS** |
| VV-E2E-022 | JSON export round-trips; report exported as plain text | **PASS** |
| VV-E2E-023 | Low-count advisory recorded on the session | **PASS** |
| VV-E2E-030 | Markup in the case number cannot escape into the report | **PASS** |
| VV-E2E-031 | Replacement-pattern characters inserted literally | **PASS** |
| VV-E2E-032 | Spreadsheet formula injection neutralised in CSV | **PASS** |
| VV-E2E-033 | Ordinary accession formats not mangled by the CSV guard | **PASS** |
| VV-E2E-034 | Event-handler attributes in a template are stripped | **PASS** |
| VV-E2E-040/041 | Comments reach the report; survive CSV round-trip with commas and quotes | **PASS** |
| VV-E2E-050 | Continue Counting extends rather than restarts the count | **PASS** |

### Suite 11 — Application Behaviour (jsdom)

**New in v2.1.** 62 tests executing the real application in a DOM. This layer
had no predecessor in any prior baseline.

| Group | Trace | Tests | Result |
|-------|-------|-------|--------|
| Boot and Phase Machine | SYS-001, SYS-130 | 5 | PASS |
| Keyboard Counting | SYS-030 to SYS-039 | 10 | PASS |
| Required Case Number | SYS-003 | 2 | PASS |
| Completion, Continue Counting, Reset | SYS-050 to SYS-058, SYS-080 to SYS-084 | 9 | PASS |
| Specimen Type Switching | SYS-016, SYS-017 | 5 | PASS |
| Autosave and Crash Recovery | SYS-145 to SYS-149 | 6 | PASS |
| Configuration Controls | SYS-105, SYS-106 | 5 | PASS |
| Config Resolution and Offline | SYS-107 to SYS-109 | 7 | PASS |
| Results, Export and Absolute Counts | SYS-060 to SYS-067, SYS-150 to SYS-163 | 9 | PASS |
| Theme and Audio | SYS-110 to SYS-112, SYS-140 to SYS-144 | 4 | PASS |

Regressions this layer now guards against:

| Test | Defect it detects |
|------|-------------------|
| TC-B014 | Counting keystrokes lost when focus stays in the case field after the barcode Enter |
| TC-B019 | Target styling not reverting when undo drops the count below target |
| TC-B034 | Structured morphology selections cleared by Continue Counting (D-06) |
| TC-B053 | Crash restoring an autosave whose specimen type is absent from the profile (D-10) |
| TC-B060 to B064 | Configuration controls silently inert (D-01) |
| TC-B063 | Profile accepted with a key-mapped but undisplayed category (D-11) |
| TC-B070 | Corrected built-in profile unable to reach an installed browser (D-02) |
| TC-B074 | Bad cached profile leaving the application unusable with no recovery (D-02) |

### Suites 02, 03, 04, 06, 07, 08, 09, 10 — Configuration and Artefact Integrity

| Suite | Scope | Result |
|-------|-------|--------|
| 02 | Configuration loading, schema, categories, formulas, outCodes, templates, target counts, template rendering | PASS |
| 03 | HTML structure, phase layout, controls, accessibility, local-asset and service-worker requirements | PASS |
| 04 | Application JS integrity, keyboard-handler safety, decrement guard, escaping behaviour, script load order, absence of inline control wiring | PASS |
| 06 | Audio engine structure, toggle state, integration points | PASS |
| 07 | Autosave function presence, storage key, state shape, integration | PASS |
| 08 | v2 schema fields; `normalizeConfig` behavioural round-trip for both legacy and v2 formats | PASS |
| 09 | Preset catalogue — file existence, JSON validity, schema conformance, ergonomic zones | PASS |
| 10 | Configuration editor structure, JS integrity, key assignment controls | PASS |

---

## 4. System Suite Results — Playwright (117 specs x 3 engines = 351, 7 skipped, 0 failures)

Each spec runs on Chromium, Firefox and WebKit. URS-093 names Chrome, Firefox
and Edge; Edge shares the Chromium engine and is covered by the chromium
project. WebKit is executed as additional assurance and is not a stated target.

### 4.1 `counting-workflow.spec.js` (22 tests)

| Group | VV IDs | Result |
|-------|--------|--------|
| Case entry and start | VV-SYS-001 to 005 | PASS |
| Keyboard counting | VV-SYS-010 to 017 | PASS |
| Validation scenario V1 | VV-SYS-020, 021 | PASS |
| Continue Counting and reset | VV-SYS-030 to 033 | PASS |
| Specimen type switching | VV-SYS-040 to 042 | PASS |

**VV-SYS-020 — Validation Scenario V1 (complete bone marrow differential)**

A 500-cell differential entered by keyboard in a real browser:

| Check | Expected | Result |
|-------|----------|--------|
| Total after 500 keystrokes | 500 | **PASS** |
| Progress indicator | 500 / 500 (target) | **PASS** |
| M:E ratio (312 myeloid / 150 erythroid) | 2.1:1 | **PASS** |
| Low-count advisory | absent at target | **PASS** |
| Traceability footer | `ndc-14 (formerly consensus-14)`, `v2.0` | **PASS** |
| Reported percentages | sum to exactly 100 | **PASS** |

### 4.2 `config-and-offline.spec.js` (22 tests)

| Group | VV IDs | Result |
|-------|--------|--------|
| Configuration controls | VV-SYS-050 to 054 | PASS |
| Preset profile catalogue | VV-SYS-055 to 057 | PASS |
| Configuration editor round-trip | VV-SYS-060 to 062 | PASS |
| Output, export and printing | VV-SYS-070 to 075 | PASS |
| Autosave and crash recovery | VV-SYS-080 to 082 | PASS |
| Offline operation | VV-SYS-090, 091 | PASS |

Capabilities verifiable only at this layer (real browser APIs):

| VV ID | Capability |
|-------|-----------|
| VV-SYS-070 | Report placed on the real system clipboard and read back |
| VV-SYS-071/072 | CSV and JSON downloads captured from disk and parsed |
| VV-SYS-073 | Injected markup does not execute — `window.__pwned` remains undefined |
| VV-SYS-080 | Interrupted count recovered across a genuine browser reload |
| VV-SYS-090 | Application loads, counts and reports with the network disconnected |
| VV-SYS-091 | No request is made to a third-party CDN |

---

### 4.9 Calculation reference as a served page (added v2.7.1)

| Suite | Scope | Result |
|-------|-------|--------|
| E2E VV-SYS-150..155 | Reachable from the counter, the Methods page and the results screen; renders all ten sections; states both what is configurable and what is fixed; available offline; loads no third-party script | PASS |
| 13 UD-030..038 | Repointed at `web/calculation-reference.html`, the controlled artefact | PASS |

---

### 4.8 Selectable reporting policy (added v2.7)

| Suite | Scope | Result |
|-------|-------|--------|
| 01 VV-RND-001..007 | All three rounding policies: default selection, the spread each produces at integer precision, exclusion still honoured, validation of unknown policies and out-of-range precision, policy declared in the method statement | PASS |
| 12 SC-040..043 | Both M:E conventions ship, are catalogued, give different ratios from identical counts, and each declares its basis | PASS |
| 13 UD-030..038 | Every worked example, comparison table and interval in the Calculation Reference recomputed from the engine; every choice it calls configurable verified as configurable | PASS |

**A defect was found**: the `ndc-14` preset never received the provenance
fields added to `templates.json` under DCR-009. A laboratory loading that preset
would have lost the standard citation and the M:E basis. All presets are now
synchronised.

UD-036 is the notable test — it asserts that every choice the reference document
*calls* configurable really is, since a reference promising configurability the
software does not offer would be worse than one promising nothing.

---

### 4.7 Operator documentation (added v2.6)

| Suite | Scope | Result |
|-------|-------|--------|
| 13 UD-001..004 | USER-GUIDE.md keys, target counts and cross-references verified against the shipped profile | PASS |
| 13 UD-010..019 | Every confidence interval, worked example and convention quoted in `methods.html` recomputed from the shipped engine; ICSH exclusion list complete; limitations cited; page reachable and free of third-party scripts | PASS |
| E2E VV-SYS-140..143 | Page renders and is reachable from the counter, its worked figures reproduced by counting them in the application, results-screen link, offline availability | PASS |

**A live documentation defect was found**: `USER-GUIDE.md` described a
nine-category layout with keyboard keys and target counts that no longer
existed. An operator following it would have pressed keys mapped to different
cell types than documented. Recorded as HA-097 (pre-RPN 36, residual 4) and
closed; suite 13 now fails the build if documentation and configuration
diverge.

UD-011 deserves note: rather than checking that quoted intervals *look* right,
it recomputes every interval the engine can produce at realistic counts and
asserts each quoted figure is among them — so a hand-edited plausible-but-wrong
number fails.

---

### 4.6 Method provenance (added v2.5)

| Suite | Scope | Result |
|-------|-------|--------|
| 01 VV-PROV-001..008 | Method statement assembly: profile identity, formula convention, declared denominator, silence when there is nothing to declare, confidence level, empty profile, flattening, reserved placeholders | PASS |
| 12 SC-030..033 | The shipped profile declares ICSH as its basis, records that a competing M:E convention exists, and states the conditional target-count rule | PASS |
| 11 TC-B130..B135 | Results statement, clipboard attribution, session and CSV, inline `{{methodNotes}}`, peripheral blood denominator declaration, graceful absence | PASS |
| E2E VV-SYS-130..131 | Attribution read back from the real system clipboard; conventions stated on the results screen | PASS |

**A URS-052 gap was found while wiring this**: the clipboard path — the primary
route into the LIS — carried no profile ID, version or timestamp, while file
export did. The record reaching the patient file was the one output that could
not be traced to its counting parameters. Recorded as HA-096 and closed; see
DCR-009 §3.

---

### 4.5 Derived quantities and thresholds (added v2.4)

| Suite | Scope | Result |
|-------|-------|--------|
| 01 VV-SUB-001..007 | Subset percentages: own denominator, the two blast conventions falling on opposite sides of 20%, zero-denominator guard, type dispatch and ratio default, interval eligibility, validation of numerator containment and unknown types | PASS |
| 01 VV-THR-001..008 | Threshold evaluation: spanning detected, clear counts not flagged, larger counts narrow but need not resolve, formula targets, ratio targets rejected, unresolvable and out-of-range targets rejected | PASS |
| 11 TC-B120..B127 | Advisory in the DOM, never blocking, cleared when the count moves clear, Continue Counting preserved, all formulas rendered, formula-target thresholds, session archival | PASS |
| E2E VV-SYS-120..123, 125 | Advisory in three real browsers; the `bands-segs-10` preset reporting blasts against both denominators | PASS |

**A test-suite defect was found by the layers disagreeing.** The E2E assertions
compared `innerText` against source-case label text; a real browser applies the
`uppercase` CSS transform to `innerText` while jsdom does not, so the same
assertion passed at the behaviour layer and failed at the system layer. Fixed in
the tests. Having both layers is what surfaced it.

---

### 4.4 Sampling precision coverage (added v2.3)

| Suite | Scope | Result |
|-------|-------|--------|
| 01 VV-CI-001..012 | Wilson interval: known values, rejection of Wald (negative bound reproduced as a precondition), zero and saturated counts, monotonic narrowing, level scaling, degenerate input, threshold straddling | PASS |
| 01 VV-LOW-004..006 | Sub-target advisory states a computed interval matching the engine, at the configured level | PASS |
| 11 TC-B110..B116 | Intervals in the results DOM, computed over the differential denominator, disable switch, level, CSV archive, bounded zero count | PASS |
| E2E VV-SYS-110..112 | Intervals in the report, quantified advisory, bounded zero count — three engines | PASS |

Two defects were found by this suite while writing it: the CSV export omitted
`differentialTotal` and `per100` (added under DCR-006 but never archived,
contrary to URS-052), and a saturated count produced a bound of
`99.99999999999999` through accumulated floating-point error. Both corrected;
see DCR-007 §5.1 and §5.2.

---

### 4.3 Standards and denominator coverage (added v2.2)

| Suite | Scope | Result |
|-------|-------|--------|
| 12 | ICSH 2008 §2.6 conformance — NDC categories, M:E definition, target counts, exclusion guidance | PASS |
| 05 VV-DEN-001..006 | Denominator policy: NRBC excluded from the PB differential, per-100 reporting, marrow unaffected, zero-denominator guard | PASS |
| 11 TC-B100..B107 | Denominator policy in the DOM: grid, split grand total, progress, absolute-count suppression | PASS |
| E2E VV-SYS-100..102 | The corrected peripheral blood differential in three real browsers | PASS |

---

### 4.10 Full-surface contrast sweep (added v2.7.2)

`tests-e2e/contrast-sweep.spec.js` — 14 specs x 3 engines.

| VV ID | Surface | Result |
|-------|---------|--------|
| VV-SYS-162 | Counter, case entry | PASS |
| VV-SYS-163 | Counter, counting phase | PASS |
| VV-SYS-164 | Counter, results with both advisories raised | PASS |
| VV-SYS-165 | Methods and Limitations (MAL-001) | PASS |
| VV-SYS-166 | Calculation Reference (CAL-001) | PASS |
| VV-SYS-167 | Quick Start guide | PASS |
| VV-SYS-168 | Configuration editor | PASS |

Each runs in both themes. Unlike VV-SYS-160/161, which measure named regions,
this walks **every** text-bearing leaf element on the page, composites
semi-transparent backgrounds down the ancestor chain, and applies the WCAG AA
threshold appropriate to each element's computed font size and weight. Service
workers are blocked so it measures the served files rather than the offline
cache.

**What it found on first execution: 330 failures**, on surfaces no
content-based or region-scoped test could reach:

| Defect | Measured | Cause |
|--------|----------|-------|
| Keyboard-map labels, help page | 1.93:1 | `help.html` carried no theme overrides at all |
| Documentation body text | below 4.5:1 | `methods.html` and `calculation-reference.html` each maintained their own partial copy |
| Configuration editor, 28 elements | 3.66–4.07:1 | tones calibrated against the panel colour, not the lighter chip colour also in use |
| **Continue Counting button** | **3.19:1 in *both* themes** | white on `amber-600`; a light-theme-only check could never have seen it |
| **Count Done button** | **3.77:1 in *both* themes** | white on `emerald-600` |
| Every page during theme application | transient, below AA | the theme was applied at the end of `<body>`, so the page painted dark and then transitioned |

Root cause of the first three: five pages each hand-maintaining their own theme
block (39, 20, 22, 12 and 0 overrides respectively). Corrected by consolidating
into `web/styles/theme.css`, which reduced 330 failures to 35; the remaining 35
were the two buttons and the editor tones, corrected by recomputing every muted
tone against the **lightest** dark surface rather than the darkest.

The theme attribute was moved from `<body>` to `<html>` and is now applied by a
script in `<head>`, before first paint.

**Regression detection confirmed** by reverting each fix in turn:

| Reverted | Detected by |
|----------|-------------|
| Accent blue to `#60a5fa` | VV-SYS-168 (dark) |
| Amber and emerald button backgrounds | VV-SYS-163, 164 (both themes) |
| Theme applied at end of `<body>` | VV-SYS-168 (light) |

---

### 4.11 Configuration fidelity (added v2.7.3)

Prompted by a reviewer asking where `denominatorExcludes` is configured. The
answer was nowhere — and verifying the configuration user interface found three
defects that produced wrong clinical numbers.

| VV ID / Suite | Verifies | Result |
|---------------|----------|--------|
| VV-SYS-063 | The shipped profile saved untouched through the editor returns unchanged, every field deep-equal | PASS |
| VV-SYS-064 | An edit to a built-in profile is honoured by the counter, keeping the built-in `profileId` | PASS |
| 09 (per preset) | Any non-marrow specimen displaying NRBC excludes them from the denominator and reports per 100 WBC | PASS |
| 09 | A preset sharing the built-in `profileId` matches it field-for-field and is not at a lower version | PASS |
| UD-039 | The reference states where each setting is reached, and its claim about what the editor does not expose matches the editor source | PASS |

**What was found:**

| Defect | Effect |
|--------|--------|
| The editor rebuilt each profile from its own form fields | Saving the shipped profile untouched dropped `denominatorExcludes`, `per100Reporting`, `thresholds`, `confidenceIntervals`, `rounding`, `precision`, `categoryNotes`, `targetCountBasis`, `provenance`, and emptied `formulas` — **deleting the M:E ratio** — while reporting success |
| The editor hard-coded `version: '2.0'` | The counter discarded every edit to a built-in profile as superseded. Measured: BM target changed 500 → 400, saved, counter still used 500 |
| No shipped preset carried `denominatorExcludes` | Choosing a preset re-introduced HA-092. Measured on 180 granulocytes + 20 NRBC in peripheral blood: **100.0% granulocytes** with the built-in profile, **90.0%** after choosing `gran-combined-10` |

The first two masked one another: the version defect meant the field loss never
reached the counter for `ndc-14`. Renaming the profile — which VV-SYS-062
does — removes that masking and the field loss applies in full.

**Regression detection confirmed** by reverting each fix:

| Reverted | Detected by |
|----------|-------------|
| `version` hard-coded back to `'2.0'` | VV-SYS-064 |
| Source profile no longer merged on save | VV-SYS-063 |
| `denominatorExcludes` removed from one preset | Suite 09 (that preset) |

Recorded in DCR-012; hazards HA-099 and HA-100 added to RA-001.

---

### 4.12 Counting policy editor (added v2.7.4)

DCR-013 built editor controls for the fields DCR-012 could only preserve. Each
test drives the control and then checks the **counter** — a control that writes
correct JSON but does not change the count would pass a round-trip test and
still be useless.

| VV ID | Drives | Verifies | Result |
|-------|--------|----------|--------|
| VV-SYS-065 | Excluding NRBC from the peripheral blood denominator | 180 segmented + 20 NRBC gives 180 cells, segmented 100.00%, NRBC per 100 | PASS |
| VV-SYS-066 | Rounding to independent, precision to 0 | Three equal categories report 33/33/33, not 33/33/34 | PASS |
| VV-SYS-067 | Adding a threshold at 50% | The advisory appears, naming the label typed in the editor | PASS |
| VV-SYS-068 | Removing monocytes from the M:E numerator | 150 segmented + 60 monocytes over 90 erythroid gives **1.7**, not 2.3 | PASS |
| VV-SYS-069 | Excluding a category carrying thresholds | Those thresholds are cleared, the target list updates, and the counter accepts the profile | PASS |
| UD-039 | — | The Calculation Reference's account of where each setting lives matches the editor source, in both directions | PASS |

This also closes **URS-102 clause (g)** — "define derived formulas" — which was
never implemented: `buildConfigJSON()` wrote `formulas: {}`. RTM-001 recorded
URS-102 as Full coverage regardless. The row now traces to SYS-240–243 and
VV-SYS-065–069 and records the correction.

**Regression detection confirmed** by removing each write-back in turn:

| Removed | Detected by |
|---------|-------------|
| `rounding` | VV-SYS-066 |
| `denominatorExcludes` | VV-SYS-065, VV-SYS-069 |
| `thresholds` | VV-SYS-067, VV-SYS-069 |
| `formulas` | VV-SYS-068 |
| The threshold-clearing guard on exclusion | VV-SYS-069 |

UD-039 deserves its own note. Written under DCR-012 to assert the editor had
**no** controls for these fields, it failed the moment they were added — which
is what it was for. It now asserts the opposite, in both directions.

---

### 4.13 Dialogs and hover contrast (added v2.7.5)

The configuration editor asked three questions with the browser's `prompt()`.
Replacing them with the product's own dialog exposed two modality defects and,
indirectly, a contrast defect in every primary button.

| VV ID / Suite | Verifies | Result |
|---------------|----------|--------|
| VV-SYS-170 | Adding a specimen type uses the product dialog; both values at once; identifiers in use shown; **no native dialog raised** | PASS |
| VV-SYS-171 | Adding a derived figure likewise | PASS |
| VV-SYS-172 | Invalid input refused with a reason, both fields at once, dialog stays open, nothing created | PASS |
| VV-SYS-173 | Focus enters the dialog, Escape cancels, Enter confirms, focus returns to the opener | PASS |
| VV-SYS-174 | Tab is confined to the dialog | PASS |
| VV-SYS-175 | A counting key pressed while a dialog is open does not count | PASS |
| VV-SYS-176 | Escape cannot discard an interrupted count | PASS |
| VV-SYS-169 | The dialog, with validation errors shown, meets AA in both themes | PASS |
| VV-SYS-177/178 | Every hoverable control meets AA **under the pointer**, both themes | PASS |
| Suite 04 | No shipped script calls `prompt()`, `confirm()` or `alert()`; both pages load the module; it is a cached shell asset | PASS |

**What was found:**

| Defect | Effect |
|--------|--------|
| Two chained `prompt()` calls for a specimen type | `Body Fluid` accepted as an identifier; a duplicate silently shadowed an existing specimen; cancelling the second prompt discarded the first (HA-101) |
| A counting key pressed over an open dialog was still tallied | The Reset confirmation opens during counting with focus on a button, so the counter's "ignore form controls" guard did not apply and the tally moved behind the dialog (HA-102) |
| Escape on the interrupted-count prompt | Cancel there means Discard; a stray Escape would have thrown away a recovered count (HA-102) |
| **`hover:bg-blue-500` on every primary button** | White on `blue-500` is **3.68:1**. Start Count, Save Profile and every dialog's confirming action fell below AA at the moment the pointer was on them. The resting-state sweep could not see it |
| Orphaned CSS in `counter.html` | Two declarations without a selector, left by the DCR-011 theme strip |

The hover defect was found only because VV-SYS-169 caught the confirm button
mid-transition at 4.15:1 — a value matching neither state — and the
intermediate reading was traced rather than retried.

**Regression detection confirmed** by reverting each fix:

| Reverted | Detected by |
|----------|-------------|
| `prompt()` restored for Add Specimen Type | VV-SYS-170, 172, 173 |
| The counter's keyboard guard removed | VV-SYS-175 |
| The recovery prompt made dismissible | VV-SYS-176 |
| The dialog's error tone set below AA | VV-SYS-169, at 1.41:1 |

Two engine differences were characterised and are not product defects: WebKit
omits buttons from the tab order, and blurs a button on mousedown. Both are
recorded in DCR-014 §5.

---

### 4.14 Input-path integrity (added v2.7.6)

Five safety-relevant defects were found by independent review, not by this
suite. Each was verified against the code before being accepted. The two worst
are in the input path.

| VV ID / Suite | Verifies | Result |
|---------------|----------|--------|
| VV-SYS-180 | Every mapped key in **every selectable preset** increments AND decrements | PASS |
| VV-SYS-181 | One keydown followed by forty auto-repeats counts 1, not 41 | PASS |
| VV-SYS-182 | Keystrokes composed by an input method do not count | PASS |
| VV-SYS-183 | Escape on an alert still runs its continuation | PASS |
| VV-SYS-184/185 | A stale crash-recovery snapshot is discarded; a recent one is offered | PASS |
| UD-050..053 | SOP-001's key tables, targets and behaviour match the shipped profile | PASS |

| Defect | Effect |
|--------|--------|
| **HA-103** auto-repeat unguarded | A held key added ~30 cells/second, indistinguishable from counting. Pre-RPN **80**, the highest in RA-001 |
| **HA-104** undo unreachable | Shift changes the character punctuation keys emit, so four categories in `right-hand` — including **blasts** — could not be un-counted at all |
| `escHtml` did not escape quotes | Used in ~30 attribute positions; a profile field with a quote closed the attribute |
| `isDuplicateKey` always false | The duplicate-key warning had never been drawn |
| Escape skipped an alert's continuation | The interrupted-count recovery offer was silently discarded |
| README denied localStorage held patient data | `wbcds_autosave` holds the accession number and morphology comments |
| **SOP-001 documented a superseded key map** | An operator following the issued SOP would press A for a blast and record a **monocyte** — the HA-097 class, closed for USER-GUIDE.md and never propagated |

**Two of these tests initially passed against the broken code.** Playwright's
`keyboard.press('Shift+.')` sends `key="."`, not `">"`, so the undo test could
not reproduce the defect it was written for; and the first auto-repeat
revert-check removed the guard in the theme shortcut rather than the counting
path. Both were corrected until the revert-check reproduced the exact finding
— `right-hand.json (bm): Shift+"." did not decrement blasts`, and a count of 41.

**Evidence provenance.** From this run onward every bundle records the commit,
branch and tree state, and a dirty-tree run is stamped **PROVISIONAL — not
admissible as release evidence**. Bundles before this one name only a date and
a Node version; at least one "Approved" bundle was captured from a working tree
that exists in no commit.

---

## 5. Defect Detection Record

| Defect | Found by | Now guarded by |
|--------|----------|----------------|
| D-01 inert configuration controls | Design review | TC-B060 to B064, VV-SYS-050 to 053 |
| D-03 percentages not summing to 100 | Design review | VV-CALC-016 to 021 |
| D-04 no profile traceability in output | Design review | VV-E2E-020 to 022, TC-B080 |
| D-06 morphology selections lost on resume | Design review | TC-B034 |
| D-11 undisplayed key-mapped category accepted | Design review | TC-B063, VV-SYS-052 |
| Cancel button hidden on the Reset confirmation | **VV-SYS-032 (Playwright)** | VV-SYS-032, TC-B036 |
| Counting keystrokes lost after the barcode Enter workflow | **TC-B014 (jsdom)** | TC-B014, VV-SYS-003 |
| D-15 editor caching an unusable profile while reporting success | **VV-SYS-061 (Playwright)** | VV-SYS-061, VV-SYS-062 |
| D-17 cell type shadowing a reserved template placeholder | Adversarial review | Suite 08 reserved-name tests |
| D-18 config notice clobbering the crash-recovery prompt | Adversarial review | TC-B075 |
| D-19 negative count restored from a corrupted autosave record | Adversarial review | VV-CALC-024/025/028, TC-B076 |
| HA-090 ICSH-excluded cells countable into a general category | **Standards review (DCR-005)** | Suite 12 SC-003/004 |
| HA-092 NRBC diluting the peripheral blood differential | **Standards review (DCR-006)** | VV-DEN-001..006, TC-B100..107, VV-SYS-100..102 |
| CSV omitted the differential denominator (URS-052) | **Writing VV-CI tests (DCR-007)** | TC-B115 |
| Saturated interval bound showed float noise | **VV-CI-004 (DCR-007)** | VV-CI-004 |
| HA-094 count accepted as settling a question it cannot settle | **Standards review (DCR-008)** | VV-THR-001..008, TC-B120..127, VV-SYS-120..123 |
| E2E assertions ignored CSS text-transform in innerText | **Layer disagreement (DCR-008)** | VV-SYS-125 |
| HA-096 clipboard output carried no profile attribution (URS-052) | **Wiring provenance (DCR-009)** | TC-B131, VV-SYS-130 |
| `totalCounted` / `denominator` placeholders were never reserved | **VV-PROV-008 (DCR-009)** | VV-PROV-008 |
| HA-097 USER-GUIDE.md documented a superseded nine-category layout | **Writing operator documentation** | UD-001, UD-002, UD-003 |
| HA-098 clinical advisories unreadable in the light theme (1.28:1) | **Operator report** | VV-SYS-160, VV-SYS-161 |
| 330 further contrast failures across every page, incl. two action buttons failing in *both* themes | **VV-SYS-162..168 (full-surface sweep)** | VV-SYS-162 to 168 |
| Theme applied after first paint — flash of wrong theme, text transiently below AA | **VV-SYS-168 (Playwright)** | VV-SYS-162 to 168, suite 03 |
| VV-SYS-155 misreported the vendored Tailwind build as third-party on Firefox | **Evidence capture run** | VV-SYS-155 (now compares against `baseURL`) |
| HA-099 the editor destroyed every profile field it did not model, incl. the denominator policy and the M:E formula | **Reviewer question: "where do users configure denominatorExcludes?"** | VV-SYS-063 |
| HA-100 the editor's saved profile was discarded as superseded while reporting success | **Verifying the configuration UI (DCR-012)** | VV-SYS-064 |
| No shipped preset carried the denominator policy — HA-092 reachable from the catalogue | **Verifying the configuration UI (DCR-012)** | Suite 09 denominator policy tests |
| The Calculation Reference said "configurable" without saying where | **Reviewer question (DCR-012)** | UD-039 |
| URS-102 clause (g) "define derived formulas" was never implemented, yet RTM-001 recorded URS-102 as Full coverage | **Building the editor controls (DCR-013)** | VV-SYS-068, SYS-240 |
| The Calculation Reference still said the editor had no policy controls after they were built | **UD-039 (as designed)** | UD-039 |
| HA-101 native prompts accepted invalid and duplicate identifiers with no way to say why | **Reviewer request to remove browser input controls** | VV-SYS-170, 172; suite 04 |
| HA-102 a counting key pressed over an open dialog was tallied | **Writing the dialog suite (DCR-014)** | VV-SYS-175 |
| HA-102 Escape would have discarded a recovered count | **Writing the dialog suite (DCR-014)** | VV-SYS-176 |
| Every primary button was 3.68:1 under the pointer | **A mid-transition reading in VV-SYS-169, traced rather than retried** | VV-SYS-177, VV-SYS-178 |

The last three were introduced or exposed during remediation and were caught by
the new layers before release — the behaviour the previous suite could not
provide.

---

## 6. Deviations and Qualifications

1. **URS-034 has been amended to match the implementation.** URS-001 v2.0
   Rev E (2026-08-04) now specifies the largest-remainder method. No deviation
   remains between requirement and implementation.
2. **Five system tests are skipped on specific engines**, each documented in
   DCR-004 §5.2: the two clipboard read-backs on Firefox and WebKit (the
   `clipboard-read` permission is Chromium-only in Playwright — the copy
   control itself is still exercised on all engines), and the offline reload on
   WebKit (Playwright's WebKit build crashes its driver on offline navigation).
   Neither is an application finding.
3. **Four requirements are verified by inspection only** — URS-083, URS-091,
   URS-092, and drag-to-aggregate within URS-102. These are tagged **I** in
   RTM-001 §5.

---

## 7. Conclusion

All <!-- qms:fact tests_total -->1104<!-- /qms:fact --> automated tests pass with no failures, across three browser
engines. For the first time in this
product's design history the verification evidence exercises the shipped
application: the calculation engine is called directly, the application is
executed in a DOM, and the deployed system is driven in a real browser.

Subject to the three qualifications in §6, the v2.1.0 baseline meets its
specified requirements as traced in RTM-001 v3.0.

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |

---

## 9. Automated Run Log
- Date (UTC): 2026-08-07T15:15:31.824Z
- Command: `npm test && npx playwright test`
- Exit Code: 0
- Result: **PASS**
- Code identity: `472977e83475244cfc0bc7b5dd54af5395acf395` (clean tree)
- Evidence: `QMS/DHF/TestEvidence/2026-08-07_111531_run/`

- Date (UTC): 2026-08-07T14:34:30.879Z
- Command: `npm test && npx playwright test`
- Exit Code: 0
- Result: **PASS**
- Code identity: `bfeeb454f81abb7e8e824e94fd41cef1c5f59881` (clean tree)
- Evidence: `QMS/DHF/TestEvidence/2026-08-07_103430_run/`

- Date (UTC): 2026-08-07T14:23:36.960Z
- Command: `npm test && npx playwright test`
- Exit Code: 1
- Result: **FAIL**
- Code identity: `b58e1fde22f4f203fdaafad858c5015b6ac3041b` (clean tree)
- Evidence: `QMS/DHF/TestEvidence/2026-08-07_102336_run/`

- Date (UTC): 2026-08-07T12:54:40.457Z
- Command: `npm test && npx playwright test`
- Exit Code: 0
- Result: **PASS**
- Code identity: `eb71098f174e3c98f75733739d7deddad48961d0` (clean tree)
- Evidence: `QMS/DHF/TestEvidence/2026-08-07_085440_run/`

- Date (UTC): 2026-08-07T12:15:31.835Z
- Command: `npm test && npx playwright test`
- Exit Code: 0
- Result: **PASS**
- Code identity: `8f8b7b50430de3725ac06fd940350e3dae393dc1` (clean tree)
- Evidence: `QMS/DHF/TestEvidence/2026-08-07_081531_run/`

- Date (UTC): 2026-08-07T10:48:52.734Z
- Command: `npm test && npx playwright test`
- Exit Code: 0
- Result: **PASS**
- Code identity: `1b8f2e4dd703add30e3f1cd56c9cda357ddf7715` (clean tree)
- Evidence: `QMS/DHF/TestEvidence/2026-08-07_064852_run/`

- Date (UTC): 2026-08-07T10:26:04.725Z
- Command: `npm test && npx playwright test`
- Exit Code: 0
- Result: **PASS**
- Code identity: `3a3a084272cd5476fb58ecc55196eb174860b014` (clean tree)
- Evidence: `QMS/DHF/TestEvidence/2026-08-07_062604_run/`

- Date (UTC): 2026-08-07T10:21:24.423Z
- Command: `npm test && npx playwright test`
- Exit Code: 1
- Result: **FAIL**
- Code identity: **PROVISIONAL — DIRTY TREE.** Nearest commit `a55c5618228ca7cb40e0e7942de26533d7e54b37`, but the code measured is not that commit. Not admissible as release evidence.
- Evidence: `QMS/DHF/TestEvidence/2026-08-07_062124_run/`

- Date (UTC): 2026-08-07T00:34:18.306Z
- Command: `npm test && npx playwright test`
- Exit Code: 0
- Result: **PASS**
- Code identity: **PROVISIONAL — DIRTY TREE.** Nearest commit `8296abecaaf9b0384475105ed8cad5f842305102`, but the code measured is not that commit. Not admissible as release evidence.
- Evidence: `QMS/DHF/TestEvidence/2026-08-06_203418_run/`

- Date (UTC): 2026-08-07T00:17:41.625Z
- Command: `npm test && npx playwright test`
- Exit Code: 0
- Result: **PASS**
- Code identity: **PROVISIONAL — DIRTY TREE.** Nearest commit `e14b36334f2e34e60c8ea704539b57fee2e85b1b`, but the code measured is not that commit. Not admissible as release evidence.
- Evidence: `QMS/DHF/TestEvidence/2026-08-06_201741_run/`



- Date (UTC): 2026-08-06T11:33:00.137Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Code identity: `56a68f2d5ad94cfc4df7a6ad7dcf15cd0f7a3465` (clean tree)
- Evidence: `QMS/DHF/TestEvidence/2026-08-06_073300_review-p0-remediation/`

- Date (UTC): 2026-08-06T10:26:56.634Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-06_062656_shared-dialog-and-hover-contrast/`

- Date (UTC): 2026-08-06T09:27:33.630Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-06_052733_counting-policy-editor/`

- Date (UTC): 2026-08-06T09:10:48.240Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-06_051048_config-fidelity-and-preset-denominator/`

- Date (UTC): 2026-08-06T02:38:03.528Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_223803_theme-consolidation-and-contrast-sweep/`

- Date (UTC): 2026-08-06T02:35:22.148Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_223522_theme-consolidation-and-contrast-sweep/`

- Date (UTC): 2026-08-06T01:11:04.922Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_211104_run/`

- Date (UTC): 2026-08-06T00:25:44.395Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_202544_run/`

- Date (UTC): 2026-08-05T20:42:45.861Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_164245_run/`

- Date (UTC): 2026-08-05T18:54:31.403Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_145431_run/`

- Date (UTC): 2026-08-05T17:28:30.653Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_132830_run/`

- Date (UTC): 2026-08-05T14:54:02.430Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_105402_run/`

- Date (UTC): 2026-08-05T11:01:33.246Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-05_070133_run/`

- Date (UTC): 2026-08-04T19:03:29.161Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-04_150329_run/`

- Date (UTC): 2026-08-04T18:45:36.637Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-04_144536_run/`


Appended by `npm run test:qms`; newest first.

- Date (UTC): 2026-08-04T18:36:42.778Z
- Command: `npm run test:all`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-08-04_143642_run/`

- Date (UTC): 2026-02-22T14:57:42.658Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-02-22_095742_run/`

- Date (UTC): 2026-02-22T14:55:17.397Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-02-22_095517_run/`

- Date (UTC): 2026-02-22T14:55:01.105Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-02-22_095501_run/`

- Date (UTC): 2026-02-22T14:54:32.180Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-02-22_095432_run/`

- Date (UTC): 2026-02-22T14:38:26.031Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-02-22_093826_run/`

- Date (UTC): 2026-02-20T21:23:10.020Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-02-20_162310_run/`

- Date (UTC): 2026-02-20T15:23:13.464Z
- Command: `npm test`
- Exit Code: 0
- Result: **PASS**
- Evidence: `QMS/DHF/TestEvidence/2026-02-20_102313_run/`
