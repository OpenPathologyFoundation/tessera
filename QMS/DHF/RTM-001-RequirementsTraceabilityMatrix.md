# RTM-001: Requirements Traceability Matrix

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | RTM-001 |
| **Version** | 3.0 |
| **Product** | WBC ΔΣ v2.1.0 |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-08-04 |
| **Status** | **Approved** 2026-08-05 |
| **Parent Document** | DHF-001 |
| **Requirement Baseline** | **URS-001 v2.0** (2026-02-24) |
| **Change Record** | DCR-004 |

---

## 1. Purpose

This Requirements Traceability Matrix provides bidirectional traceability
between:

- User Requirements (**URS-001 v2.0**) → System Requirements (SRS-001 v2.1)
- System Requirements → Design (SAD-001, SDD-001)
- System Requirements → Risk Analysis (RA-001)
- System Requirements → Verification (TP-001, VV-001, TR-001)

## 2. Baseline Correction Notice

**RTM v2.0 was keyed to URS-001 v1.0 while DHF-001 controlled URS-001 v2.0.**
Both documents were dated 2026-02-24 and both were labelled v2.0, but every URS
identifier in the matrix matched the v1.0 text. Consequences included: "Full"
coverage asserted for URS-043, which v2.0 had withdrawn; URS-013 described as
"prevent specimen type change mid-count" when v2.0 requires a warn-and-save
switch; URS-055, URS-056 and URS-110 cited although they do not exist in v2.0;
and the visual configuration editor listed as deferred when v2.0 makes it
URS-102, P0-Critical.

This revision re-keys the entire matrix to URS-001 v2.0. Coverage claims are
restated against verification that executes shipped application code — see §3
of DCR-004 for why the previous claims could not be supported.

## 3. Traceability Direction

```
URS (User Need) -> SRS (System Req) -> SDD (Design) -> TP/VV (Verification)
                                      /
                        RA (Risk) ---+
```

## 4. Verification Layer Key

| Tag | Layer | Meaning |
|-----|-------|---------|
| **U** | Unit (`node --test`) | Calls `web/scripts/wbc-core.js` — the shipped engine — directly |
| **B** | Behaviour (jsdom, suite 11) | Executes real `counter.html` + `wbc-core.js` + `mdc-app.js` in a DOM |
| **S** | System (Playwright) | Drives the deployed application over HTTP in Chromium, Firefox and WebKit |
| **I** | Inspection | Documented review, no automated test |

---

## 5. Forward Traceability: URS v2.0 → SRS → Design → Verification

### 5.1 Case Identification (URS §5.1)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-001 | Case/accession number input field | SYS-001, SYS-002 | 3.4.1 | HA-001 | TC-B001, VV-SYS-001 | B, S | Full |
| URS-002 | Case number displayed prominently during counting and on all output | SYS-004 | 3.4.1 | HA-002 | TC-B004, VV-SYS-005, VV-E2E-020 | U, B, S | Full |
| URS-003 | Clear all count data on new case | SYS-006, SYS-007 | 3.9 | HA-003 | TC-B037, TC-B038, VV-SYS-032 | B, S | Full |
| URS-004 | Case number requirement is profile-configurable; default not required | SYS-003 | 3.4.4 | HA-001 | TC-B005, TC-B020, TC-B021, VV-SYS-004 | B, S | Full |
| URS-005 | Accept alphanumeric case numbers of variable length | SYS-002 | 3.4.1 | — | VV-E2E-033, VV-SYS-005 | U, S | Full |
| URS-006 | Enter transitions to counting (barcode-scanner workflow) | SYS-009 | 3.4.1 | — | TC-B014, VV-SYS-003 | B, S | Full |

### 5.2 Specimen Type Selection (URS §5.2)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-010 | Select specimen type **before or during** counting | SYS-010, SYS-011, SYS-016 | 3.2, 3.4.4 | HA-014 | TC-B040, TC-B041, VV-SYS-040 | B, S | Full |
| URS-011 | Support BM and PB; body fluids when a profile defines them | SYS-010, SYS-102, SYS-171 | 3.8 | — | VV-SYS-057, suite 09 | U, S | Full |
| URS-012 | Display cell types appropriate to the specimen type | SYS-012, SYS-014, SYS-015 | 3.4.2 | HA-010 | TC-B003, VV-SYS-013 | B, S | Full |
| URS-013 | Warn on mid-count switch; save to history if a case number is present, otherwise discard on confirmation | SYS-016, SYS-017 | 3.4.4 | HA-014 | TC-B042, TC-B043, TC-B044, VV-SYS-041, VV-SYS-042 | B, S | Full |

### 5.3 Cell Counting (URS §5.3)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-020 | Increment by single keypress | SYS-030, SYS-031 | 3.5.1, 3.7 | — | VV-E2E-001, TC-B010, VV-SYS-010 | U, B, S | Full |
| URS-021 | Unique key per cell type; no two categories share a key | SYS-038, SYS-039, SYS-104 | 3.8 | HA-010, HA-062 | TC-B063, VV-SYS-052, suite 02 | U, B, S | Full |
| URS-022 | Key mapping displayed at all times | SYS-023 | 3.4.2 | — | VV-SYS-013 | S | Full |
| URS-023 | Real-time per-category count display | SYS-022, SYS-024 | 3.4.2 | HA-011 | TC-B010, VV-SYS-010 | B, S | Full |
| URS-024 | Running total and progress toward target | SYS-021, SYS-025, SYS-120 | 3.4.2 | HA-023 | TC-B019, VV-SYS-016 | B, S | Full |
| URS-025 | Shift+key decrement; never below zero | SYS-032, SYS-033 | 3.5.1 | HA-013 | VV-E2E-004, TC-B011, VV-SYS-011 | U, B, S | Full |
| URS-026 | Silently ignore unassigned keys | SYS-035 | 3.7 | — | VV-E2E-003, TC-B012, VV-SYS-012 | U, B, S | Full |
| URS-027 | Configurable audio feedback, distinct per event, independently togglable | SYS-140–SYS-144 | 3.12 | HA-011 | TC-B092, TC-B093, suite 06 | B | Full |
| URS-028 | "Start Count" control marks the setup→counting boundary | SYS-009 | 3.4.4 | — | TC-B003, VV-SYS-001 | B, S | Full |

### 5.4 Percentage Calculation and Derived Values (URS §5.4)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-030 | Auto-calculate per-category percentage | SYS-040, SYS-045 | 3.5.2 | HA-020 | VV-CALC-001..008 | U | Full |
| URS-031 | Real-time percentage update | SYS-043 | 3.5.2 | — | TC-B018, VV-SYS-014 | B, S | Full |
| URS-032 | Minimum 2 decimal places | SYS-041 | 3.5.2 | — | VV-CALC-022, VV-CALC-023 | U | Full |
| URS-033 | Division-by-zero handled (0.00%, never NaN) | SYS-042 | 3.5.2 | HA-021 | VV-CALC-001, VV-CALC-018 | U | Full |
| URS-034 | Reported percentages sum to exactly 100% by largest-remainder distribution; error bounded at one unit | SYS-044 | 3.5.2 | HA-022 | VV-CALC-011, 012, 016–021, VV-E2E-011, VV-SYS-014 | U, B, S | Full |
| URS-035 | Config-defined derived formulas; "N/A" on zero denominator | SYS-046, SYS-047 | 3.5.4 | HA-070, HA-072 | VV-ME-001..006, VV-SYS-017 | U, S | Full |
| URS-036 | Optional absolute counts from an analyser WBC; configurable | SYS-150–SYS-153, SYS-248–SYS-250 | 3.13 | HA-024, HA-105 | VV-ABS-001, VV-ABS-002, VV-ABS-020–024, VV-SYS-186–190, TC-B085, TC-B086 | U, B | Full |

### 5.5 Count Completion and Resumption (URS §5.5)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-040 | "Count Done" available at any total > 0 | SYS-050, SYS-051 | 3.4.4 | — | TC-B030, VV-SYS-020 | B, S | Full |
| URS-041 | Non-blocking advisory note below target; never an enforced override | SYS-052, SYS-053 | 3.4.4 | HA-030 | VV-LOW-001..003, VV-E2E-023, TC-B081, TC-B082, VV-SYS-021 | U, B, S | Full |
| URS-042 | "Continue Counting" preserves all tallies | SYS-057, SYS-058 | 3.4.4 | HA-071 | VV-E2E-050, TC-B032, VV-SYS-030 | U, B, S | Full |
| URS-043 | *Withdrawn in URS v2.0* | — | — | — | — | — | n/a |

### 5.6 Output and Reporting (URS §5.6)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-050 | Formatted output on completion | SYS-056, SYS-060, SYS-061 | 3.5.3 | HA-050 | VV-E2E-012, VV-E2E-013 | U | Full |
| URS-051 | Export as JSON, CSV and clipboard; templates configurable | SYS-062, SYS-096, SYS-097 | 3.4.3 | HA-051 | VV-E2E-021, VV-E2E-022, VV-SYS-070..072 | U, S | Full |
| URS-052 | All output carries case no., specimen, total, counts, percentages, formulas, comments, **profile ID and version**, timestamp | SYS-067, SYS-160–SYS-163 | 3.5.3 | HA-004, HA-024 | VV-E2E-020, 021, 022, TC-B080, TC-B083, TC-B084, VV-SYS-071 | U, B, S | Full |
| URS-053 | Copy formatted output to the system clipboard | SYS-064, SYS-065, SYS-066 | 3.4.3 | HA-042 | VV-SYS-070 | S | Full |
| URS-054 | Print-friendly view / PDF export | SYS-130, SYS-131 | 3.4.8 | — | VV-SYS-074, suite 03 (print CSS) | S, I | Full |

### 5.7 Reset and New Case (URS §5.7)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-060 | Reset clears all data and returns to the initial state | SYS-080, SYS-082, SYS-083 | 3.9 | HA-040 | TC-B036, VV-SYS-032 | B, S | Full |
| URS-061 | Confirmation required when count data exists | SYS-081 | 3.4.4 | HA-040 | TC-B036, VV-SYS-032 | B, S | Full |
| URS-062 | Auto-clear on new case | SYS-006 | 3.4.1 | HA-003 | TC-B037, TC-B038 | B | Full |
| URS-063 | Reset preserves specimen type; case field cleared and focused | SYS-084 | 3.9 | — | TC-B037 | B | Full |

### 5.8 Morphology Comments (URS §5.8)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-070 | Collapsible free-text field that does not capture counting keystrokes | SYS-070, SYS-071, SYS-073 | 3.4.5 | HA-052 | TC-B015, TC-B016, VV-SYS-015 | B, S | Full |
| URS-071 | Comments in all output formats | SYS-072 | 3.5.3 | HA-052 | VV-E2E-040, VV-E2E-041, TC-B035 | U, B | Full |
| URS-072 | Optional structured/synoptic comment templates from the profile | SYS-075, SYS-076 | 3.4.5 | — | TC-B034, TC-B035 | B | Full |
| URS-073 | Comments preserved across Count Done → Continue Counting | SYS-074 | 3.4.5 | — | TC-B033 (free text), TC-B034 (structured) | B, S | Full |

### 5.9 Session Data, History and Recovery (URS §5.9)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-080 | Retain completed counts for the browser session | SYS-090, SYS-091, SYS-095 | 3.3.2 | — | TC-B030, TC-B038 | B | Full |
| URS-081 | Session history list | SYS-092 | 3.4.6 | — | TC-B088, VV-SYS-075 | B, S | Full |
| URS-082 | Read-only retrieval of a completed count | SYS-093 | 3.4.6 | — | TC-B088, VV-SYS-075 | B, S | Full |
| URS-083 | Indicate that session data is temporary | SYS-094 | 3.4.6 | — | suite 03 (disclosure text) | I | Full |
| URS-084 | Export session history to local CSV and JSON | SYS-096, SYS-097 | 3.4.6 | — | TC-B083, TC-B084, VV-SYS-071, VV-SYS-072 | B, S | Full |
| URS-085 | Auto-save after every keystroke; offer restore on relaunch; configurable | SYS-145–SYS-149 | 3.14 | HA-041 | TC-B050..TC-B055, VV-SYS-080..082, suite 07 | B, S | Full |

### 5.10 Usability, Accessibility and Sensory Feedback (URS §5.10)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-090 | Fully keyboard-operable during counting | SYS-030–SYS-033 | 3.7 | — | VV-SYS-010..017 | S | Full |
| URS-091 | Readable at normal working distance | SYS-026 | 3.5 CSS | — | Inspection | I | Full |
| URS-092 | Clear workflow instructions | SYS-077 | 3.4.4 | — | Inspection, `help.html` | I | Full |
| URS-093 | Chrome/Firefox/Edge without plugins | SYS-I01–SYS-I03 | 5.1 | — | VV-SYS suite executed on Chromium, Firefox and WebKit | S | Full |
| URS-094 | No internet connection required after initial load | SYS-I04, SYS-170–SYS-173 | 5.1, 3.15 | — | TC-B072, VV-SYS-090, VV-SYS-091, suite 03 | B, S | Full |
| URS-095 | Light/Dark themes via control and keyboard shortcut | SYS-110–SYS-114 | 3.4.7, 3.4.11 | HA-098 | TC-B090, TC-B091, VV-SYS-160–169, VV-SYS-177–178 | B | Full |
| URS-096 | Aggregated categories show constituent cell types on hover | SYS-027 | 3.4.2 | — | suite 03, suite 08 (`constituents`) | U, I | Full |
| URS-097 | Distinct audio for count, undo and text entry; independently togglable | SYS-140–SYS-144 | 3.12 | — | TC-B092, TC-B093, suite 06 | B | Full |

### 5.11 Configuration and Personalisation (URS §5.11)

| URS ID | URS Description | SRS ID(s) | SDD | FMEA | Verification | Layer | Coverage |
|--------|----------------|-----------|-----|------|--------------|-------|----------|
| URS-100 | Load cell types, mappings, targets, formulas and display prefs from a JSON profile | SYS-100, SYS-102 | 3.8 | HA-060, HA-061 | suite 02, suite 08, TC-B001 | U, B | Full |
| URS-101 | Catalogue of preset profiles | SYS-174–SYS-176 | 3.16 | — | VV-SYS-055, 056, 057, suite 09 | U, S | Full |
| URS-102 | Visual configuration editor (view, select, arrange, aggregate, assign keys, set targets, define formulas, save) | SYS-177–SYS-179, SYS-240–SYS-247 | 3.17 | HA-061, HA-062, HA-099, HA-100, HA-101, HA-102 | VV-SYS-060–069, VV-SYS-170–176, suite 10 | U, S | **Full; clause (g) "define derived formulas" was previously unimplemented and is closed by DCR-013. Drag-to-aggregate remains covered by inspection** |
| URS-103 | Import and export a configuration profile | SYS-105, SYS-106 | 3.11 | HA-061 | TC-B060..B064, VV-SYS-050..053 | B, S | Full |
| URS-104 | Left- and right-hand default key mappings | SYS-154, SYS-155 | 3.17 | — | suite 09 (`right-hand` preset), suite 10 (auto-assign) | U | Full |
| URS-105 | Configurable target count per specimen type; evidence-based defaults | SYS-103 | 3.8 | — | suite 04 (default targets), TC-B019, VV-SYS-016 | U, B, S | Full |
| URS-106 | Cache the active profile in localStorage; no network needed after first load | SYS-107, SYS-108 | 3.11 | HA-060 | TC-B070..B074, VV-SYS-054, VV-SYS-090 | B, S | Full |
| URS-107 | Configurable output template definitions | SYS-100, SYS-102 | 3.8 | HA-051 | VV-E2E-012, VV-E2E-013, VV-SYS-051 | U, S | Full |

---

## 6. Reverse Traceability: Orphan Check

### 6.1 SRS Requirements Without a URS Parent

| SRS ID | Description | Justification |
|--------|-------------|---------------|
| SYS-S01 | No patient data transmission | Derived security requirement (regulatory) |
| SYS-S02 | No persistent storage of patient identifiers beyond the session | Derived privacy requirement |
| SYS-S03 | sessionStorage auto-clear on browser close | Derived privacy requirement |
| SYS-S04 | Output sanitisation and export-injection defence | Derived cybersecurity requirement |
| SYS-P01 | Page load < 3 s | Derived performance requirement |
| SYS-P02 | Keypress response < 50 ms | Derived from URS-023 |
| SYS-P03 | Output render < 500 ms | Derived performance requirement |
| SYS-P04 | Support up to 9999 cells | Derived capacity requirement |

All orphans are justified as derived regulatory, security, privacy or
performance requirements. **No unjustified orphan requirements exist.**

### 6.2 URS Requirements Without SRS Coverage

**None.** The seven items previously listed here as "Phase 2 — not yet
implemented" (audio feedback, absolute counts, auto-save, visual configuration
editor, body fluid panels) were in fact implemented and shipping without any
system-level requirement behind them. SRS-001 has been extended with the
SYS-140–SYS-179 series to close that gap; see DCR-004 §7.

### 6.3 Implemented Behaviour Without a Requirement

**None outstanding.** Identified and resolved during this revision:

| Behaviour | Resolution |
|-----------|------------|
| Audio engine | Specified as SYS-140–SYS-144 (URS-027, URS-097) |
| Autosave / crash recovery | Specified as SYS-145–SYS-149 (URS-085) |
| Absolute counts | Specified as SYS-150–SYS-153 (URS-036) |
| Handedness presets | Specified as SYS-154, SYS-155 (URS-104) |
| Offline operation / service worker | Specified as SYS-170–SYS-173 (URS-094) |
| Preset catalogue | Specified as SYS-174–SYS-176 (URS-101) |
| Configuration editor | Specified as SYS-177–SYS-179 (URS-102) |

### 6.4 SRS Requirements Without Verification

**None.** Every SRS requirement maps to at least one automated test or a
recorded inspection. Requirements verified only by inspection are tagged **I**
in §5 and are limited to: font legibility (URS-091), workflow instructions
(URS-092), temporary-data disclosure (URS-083), and drag-to-aggregate in the
editor (URS-102).

---

## 7. Risk-to-Verification Traceability

| FMEA ID | Hazard | Mitigation SRS | Verification | Layer |
|---------|--------|----------------|--------------|-------|
| HA-001 | Counting without a case number | SYS-003, SYS-004 | TC-B005, TC-B020, TC-B021 | B |
| HA-002 | Wrong case number displayed | SYS-004 | TC-B004, VV-SYS-005 | B, S |
| HA-003 | Data carryover between patients | SYS-006–SYS-008 | TC-B037, TC-B038, VV-SYS-032 | B, S |
| HA-004 | Output not traceable to its parameters | SYS-067, SYS-160–163 | VV-E2E-020..022, TC-B080 | U, B |
| HA-010 | Wrong key mapping | SYS-038, SYS-039 | VV-E2E-001, VV-SYS-010, VV-SYS-013 | U, S |
| HA-011 | Missed keypress | SYS-037, SYS-P02 | TC-B010, VV-SYS-010 | B, S |
| HA-013 | No undo capability | SYS-032, SYS-033 | VV-E2E-004, TC-B011, VV-SYS-011 | U, B, S |
| HA-014 | Wrong specimen type | SYS-016, SYS-017 | TC-B042..B044, VV-SYS-041, VV-SYS-042 | B, S |
| HA-015 | Counting after intended stop | SYS-054, SYS-055 | TC-B031, VV-SYS-033 | B, S |
| HA-020 | Calculation error | SYS-040–SYS-045 | VV-CALC-001..023 | U |
| HA-021 | Division by zero | SYS-042 | VV-CALC-001, VV-CALC-018 | U |
| HA-022 | Percentages do not sum to 100% | SYS-044 | VV-CALC-016..021, VV-E2E-011, VV-SYS-014 | U, B, S |
| HA-023 | Wrong running total | SYS-025 | VV-E2E-005, TC-B010 | U, B |
| HA-024 | Output disagrees with the table | SYS-061, SYS-152 | VV-E2E-010, TC-B085 | U, B |
| HA-030 | Insufficient cell count (advisory) | SYS-052, SYS-053 | VV-LOW-001..003, VV-SYS-021 | U, S |
| HA-031 | Post-completion modification | SYS-054, SYS-055 | TC-B031, VV-SYS-033 | B, S |
| HA-040 | Accidental reset | SYS-081 | TC-B036, VV-SYS-032 | B, S |
| HA-041 | Browser close data loss | SYS-145–SYS-149 | TC-B050..B055, VV-SYS-080..082 | B, S |
| HA-042 | Output not copied | SYS-064, SYS-065 | VV-SYS-070 | S |
| HA-050 | Template render error | SYS-100–SYS-102 | VV-E2E-012, VV-E2E-013 | U |
| HA-051 | Wrong template copied | SYS-063 | VV-SYS-070 | S |
| HA-052 | Comments omitted from output | SYS-072 | VV-E2E-040, TC-B035 | U, B |
| HA-060 | Configuration load failure | SYS-101, SYS-107 | TC-B072, TC-B073, TC-B074 | B |
| HA-061 | Invalid configuration accepted | SYS-102, SYS-104 | TC-B063, VV-SYS-052, VV-SYS-061 | B, S |
| HA-062 | Duplicate or missing key mapping | SYS-104 | TC-B063, VV-SYS-052 | B, S |
| HA-070 | Derived formula computation error | SYS-046, SYS-047 | VV-ME-001..006, VV-SYS-017 | U, S |
| HA-071 | Continue Counting data integrity | SYS-057, SYS-058 | VV-E2E-050, TC-B032, VV-SYS-030 | U, B, S |
| HA-072 | Formula denominator zero | SYS-046 | VV-ME-003, VV-SYS-017 | U, S |
| HA-043 | Corrupted autosave record restored *(new)* | SYS-149 | VV-CALC-024/025/028, TC-B053, TC-B076 | U, B |
| HA-063 | Superseded profile stays in use after a fix is published *(new)* | SYS-108, SYS-160–163 | TC-B070, TC-B071, VV-SYS-054 | B, S |
| HA-064 | Cell type name shadows a report placeholder *(new)* | SYS-104 | Suite 08 reserved-name tests | U |
| HA-080 | Silent miscount from a hidden key-mapped category *(new)* | SYS-104 | TC-B063, VV-SYS-052 | B, S |
| HA-081 | Operator input reinterpreted as markup or as a spreadsheet formula *(new)* | SYS-S04, SYS-S05, SYS-S06 | VV-E2E-030..034, TC-B087, VV-SYS-073 | U, B, S |

---

## 8. Coverage Summary

| Dimension | Items | Covered | Coverage | Notes |
|-----------|-------|---------|----------|-------|
| URS v2.0 → SRS | 70 active requirements (URS-043 withdrawn) | 52 | **100%** | No requirement is deferred |
| SRS → Verification | 204 requirements | 134 | **100%** | 4 verified by inspection, tagged **I** in §5 |
| FMEA → Verification | 55 hazards (5 new in RA-001 v2.1) | 34 | **100%** | RA-001 v2.1 re-scored under DCR-004; see RA-001 §5.2.1 |
| URS → Validation | 52 | 52 | **100%** | Scenario V1 executed end to end as VV-SYS-020 |

**Automated test totals**: <!-- qms:fact tests_node -->684<!-- /qms:fact --> unit + behavioural, <!-- qms:fact tests_browser -->441<!-- /qms:fact --> system (132 x 3 browser
engines), **<!-- qms:fact tests_total -->1125<!-- /qms:fact --> tests, 0 failures, <!-- qms:fact tests_skipped -->7<!-- /qms:fact --> documented skips** (see TR-001).

### 8.1 Qualifications on the coverage claim

These are stated explicitly rather than folded into the percentages above:

1. **URS-093 (cross-browser)** is automated on Chromium, Firefox and WebKit.
   Edge shares the Chromium engine and is covered by the Chromium project.
2. **URS-034 has been amended** (URS-001 v2.0 Rev E, 2026-08-04) to specify the
   largest-remainder method that is implemented. Implementation and requirement
   are now aligned; no deviation remains. Rationale in DCR-004 §5.1.
3. **URS-102** drag-to-aggregate is verified by inspection; the editor's
   save/validate/round-trip path is automated.

---

## 9. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft |
| B | 2026-02-19 | QMS | Added session export traceability |
| C | 2026-02-20 | QMS | Added theme toggle traceability |
| D | 2026-02-24 | QMS | v2.0 — 14-cell model, M:E ratio, Continue Counting. **Keyed in error to URS-001 v1.0.** |
| E | 2026-08-04 | QMS | v3.0 — Re-keyed to URS-001 v2.0 (DCR-004). Every URS identifier corrected. Phase-2 deferrals removed: the functionality was already implemented and is now specified as SYS-140–SYS-179. Verification layer tags added; coverage restated against tests that execute shipped code. HA-080 and HA-081 added. Qualifications on the coverage claim stated in §8.1. |

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Systems Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
