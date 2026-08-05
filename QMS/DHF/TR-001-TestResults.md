# TR-001: Test Execution Results

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | TR-001 |
| **Version** | 3.4 |
| **Product** | WBC ΔΣ v2.5.0 |
| **Date Executed** | 2026-08-05 (18:54:31 UTC) |
| **Status** | **PASS** |
| **Parent Document** | DHF-001 |
| **Input Documents** | TP-001, VV-001, SRS-001 v2.1, RTM-001 v3.0 |
| **Change Record** | DCR-004 |
| **Evidence Folder** | `QMS/DHF/TestEvidence/2026-08-05_145431_run/` |
| **Runners** | Node.js v26.5.0 built-in test runner; Playwright 1.62.1 / Chromium, Firefox, WebKit |
| **Platform** | macOS (darwin, arm64), Node.js v26.5.0, npm 11.17.0 |

---

## 1. Executive Summary

**706 tests passed across 3 verification layers and 3 browser engines, with 0 failures and 5 documented skips.**

| Metric | Value |
|--------|-------|
| Unit, static and behavioural tests | **540** |
| System (browser) tests | **166** (57 specs x chromium, firefox, webkit, less 5 skips) |
| **Total executed** | **706** |
| Passed | **706** |
| Failed | **0** |
| Skipped (documented, §6) | **5** |
| Pass Rate | **100.00%** |
| Suites | 95 (Node) + 11 describe blocks x 3 engines (Playwright) |
| Skipped / Cancelled / Todo | 0 |
| Exit code | 0 |

Command: `npm run test:all` (`npm test && npm run test:e2e`).
Regenerate this evidence with `npm run test:qms`.

### 1.1 Comparison with the v2.0 baseline

| | v2.0 (2026-02-24) | v2.1.0 (this run) |
|---|---|---|
| Tests recorded | 191 | 706 |
| Tests executing shipped application code | **0** | 706 |
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

## 3. Node Suite Results (540 tests, 106 suites, 0 failures)

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

## 4. System Suite Results — Playwright (44 tests x 3 engines = 132, 0 failures)

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
| Traceability footer | `consensus-14`, `v2.0` | **PASS** |
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
| E2E VV-SYS-120..123, 125 | Advisory in three real browsers; the `legacy-9` preset reporting blasts against both denominators | PASS |

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

All 706 executed automated tests pass with no failures, across three browser
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
| Test Engineer | | | |
| Quality Assurance | | | |
| Design Engineer | | | |

---

## 9. Automated Run Log
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
