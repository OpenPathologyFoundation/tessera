# TP-001: Test Plan

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | TP-001 |
| **Version** | 2.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-02-24 |
| **Status** | **Approved** 2026-08-05 |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 v2.0, SRS-001 v2.0, SDD-001 v2.0, RA-001 v2.0 |

---

## 1. Purpose

This document defines the test strategy, test cases, acceptance criteria, and pass/fail criteria for verifying WBC ΔΣ v2.0 against the System Requirements Specification (SRS-001 v2.0). Testing shall demonstrate that the software meets all functional, performance, and safety requirements including the unified 14-cell type model, advisory target counts, M:E ratio computation, Continue Counting workflow, and two-row table layout.

## 2. Scope

### 2.1 In Scope
- Functional testing of all system requirements (SYS-xxx)
- Boundary value testing for calculations
- M:E ratio computation and display verification
- Continue Counting workflow verification
- Two-row table layout and subtotal verification
- Upper row flagging verification (PB mode)
- Advisory target count (non-blocking) verification
- UI/UX verification
- Cross-browser compatibility testing
- Performance testing (response time requirements)
- Risk-based testing (all FMEA mitigations)

### 2.2 Out of Scope
- Penetration testing / security audit
- Load testing (single-user application)
- Accessibility testing (WCAG compliance)
- Server infrastructure testing
- Phase 2 features (audio feedback, auto-save, visual config editor, body fluid panels, absolute counts)

## 3. Test Environment

| Component | Specification |
|-----------|--------------|
| **Test Machine** | Standard laboratory workstation (Intel i5+, 8GB+ RAM) |
| **Operating Systems** | Windows 10/11, macOS 12+ |
| **Browsers** | Google Chrome (latest 2 versions), Mozilla Firefox (latest 2 versions), Microsoft Edge (latest 2 versions) |
| **Application Server** | Node.js static server (serve.js) on port 8089 |
| **Test Runner** | Node.js v22+ built-in test runner (`npm test`) |
| **Network** | Standard LAN connection; offline testing for SYS-I04 |
| **Test Data** | Predefined test scenarios with known expected results |

## 4. Test Strategy

### 4.1 Test Levels

| Level | Description | Responsibility |
|-------|-------------|---------------|
| Unit Tests | Individual function testing (calcPercent, addToCell, mkOutTplJson, computeFormulas) | Developer |
| Integration Tests | Module interaction (keyboard input -> count -> percentage -> M:E ratio -> output) | Developer/QA |
| System Tests | End-to-end workflow testing against SRS requirements | QA |
| Acceptance Tests | Clinical user validation against URS requirements | Clinical User + QA |

### 4.2 Risk-Based Test Priority

Tests addressing FMEA-identified hazards with pre-mitigation RPN >= 50 are **Priority 1** (must pass before release).
Tests addressing hazards with RPN 16-49 are **Priority 2**.
All other tests are **Priority 3**.

---

## 5. Test Cases

### 5.1 The TC-0xx numbering is withdrawn

Sections 5.1 to 5.12 previously specified 106 test cases numbered `TC-001` to
`TC-127`. **None of those identifiers appears in any test file.** They were a
plan that the implemented suites never adopted, and no mapping between the two
schemes was ever recorded — so none is invented here. Fabricating one after the
fact would be the same defect in a new form.

The numbering is withdrawn. What the suites actually verify is registered
below, generated from the runners, and traced to requirements by RTM-001 §5.

The withdrawn specifications remain in version 1.x of this document for anyone
auditing how the plan changed.

### 5.2 Register of implemented test cases

<!-- BEGIN GENERATED: verification-index -->

> **Generated. Do not edit by hand.**  
> `node scripts/qms-verification-index.js --write` regenerates this section from
> the test files. Suite 14 fails the build if it is stale, and if any identifier
> cited by RTM-001 or TR-001 does not exist here.

**377 identified verification cases** across 18 series and 4 layers.  359 further tests carry no identifier and are not registered.

| Series | Cases | Layer(s) | Covers |
|--------|-------|----------|--------|
| `QC-*` | 6 (001–006) | Static | QMS counted quantities |
| `SC-*` | 20 (001–043) | Unit | Standards conformance (ICSH) |
| `TC-B*` | 91 (001–135) | Behaviour | Application behaviour in a DOM |
| `UD-*` | 33 (001–063) | Static | User-facing documentation |
| `VV-ABS-*` | 7 (001–024) | Unit | Absolute counts and the analyser WBC |
| `VV-CALC-*` | 22 (001–028) | Unit | Calculation engine vectors |
| `VV-CI-*` | 12 (001–012) | Unit | Wilson confidence intervals |
| `VV-DEN-*` | 6 (001–006) | Unit | Denominator policy |
| `VV-E2E-*` | 23 (001–050) | Unit | End-to-end data integrity |
| `VV-INC-*` | 3 (001–006) | Unit | Increment and decrement |
| `VV-LOW-*` | 6 (001–006) | Unit | Sub-target advisory |
| `VV-ME-*` | 6 (001–006) | Unit | Myeloid-to-erythroid ratio |
| `VV-PROV-*` | 8 (001–008) | Unit | Method provenance |
| `VV-RND-*` | 7 (001–007) | Unit | Rounding policy |
| `VV-SUB-*` | 7 (001–007) | Unit | Subset percentages |
| `VV-SYS-*` | 107 (001–193) | System | System verification in a real browser |
| `VV-THR-*` | 8 (001–008) | Unit | Diagnostic thresholds |
| `VV-TPL-*` | 5 (001–005) | Unit | Output templates |

#### QC-* — QMS counted quantities

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| QC-001 | Every requirement, hazard and test-case count is current | Static | `tests/14-qms-counts.test.js` |
| QC-002 | The measurement finds a plausible number of each artefact | Static | `tests/14-qms-counts.test.js` |
| QC-003 | Every identifier series is contiguous enough to be trusted | Static | `tests/14-qms-counts.test.js` |
| QC-004 | VV-001 and TP-001 carry a generated register | Static | `tests/14-qms-counts.test.js` |
| QC-005 | Every identifier cited by RTM-001 and TR-001 is registered | Static | `tests/14-qms-counts.test.js` |
| QC-006 | The two registers agree | Static | `tests/14-qms-counts.test.js` |

#### SC-* — Standards conformance (ICSH)

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| SC-001 | Every ICSH NDC category is present in the bone marrow profile | Unit | `tests/12-standards-conformance.test.js` |
| SC-002 | Every ICSH NDC category has a keyboard key | Unit | `tests/12-standards-conformance.test.js` |
| SC-003 | Any category beyond the ICSH list carries scope guidance | Unit | `tests/12-standards-conformance.test.js` |
| SC-004 | The guidance names the cell types ICSH excludes | Unit | `tests/12-standards-conformance.test.js` |
| SC-010 | The M:E numerator is exactly the ICSH set | Unit | `tests/12-standards-conformance.test.js` |
| SC-011 | The M:E denominator is erythroblasts at all stages | Unit | `tests/12-standards-conformance.test.js` |
| SC-012 | Lymphocytes, plasma cells, mast cells and other are excluded from M:E | Unit | `tests/12-standards-conformance.test.js` |
| SC-013 | A worked ICSH example computes correctly | Unit | `tests/12-standards-conformance.test.js` |
| SC-014 | Monocytes contribute to the numerator, as ICSH specifies | Unit | `tests/12-standards-conformance.test.js` |
| SC-020 | The bone marrow default target is the ICSH 500-cell figure | Unit | `tests/12-standards-conformance.test.js` |
| SC-021 | The schema can express the ICSH 300-cell provision | Unit | `tests/12-standards-conformance.test.js` |
| SC-022 | The total number of cells counted is reportable (§2.6) | Unit | `tests/12-standards-conformance.test.js` |
| SC-030 | The profile declares the standard it implements | Unit | `tests/12-standards-conformance.test.js` |
| SC-031 | The M:E formula records the convention it follows | Unit | `tests/12-standards-conformance.test.js` |
| SC-032 | The target count records the conditional ICSH rule | Unit | `tests/12-standards-conformance.test.js` |
| SC-033 | Every specimen type produces a usable method statement | Unit | `tests/12-standards-conformance.test.js` |
| SC-040 | The alternative convention ships as a selectable preset | Unit | `tests/12-standards-conformance.test.js` |
| SC-041 | It is listed in the preset catalogue | Unit | `tests/12-standards-conformance.test.js` |
| SC-042 | The two conventions give different ratios from identical counts | Unit | `tests/12-standards-conformance.test.js` |
| SC-043 | Each states its convention, so a report is interpretable | Unit | `tests/12-standards-conformance.test.js` |

#### TC-B-* — Application behaviour in a DOM

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| TC-B001 | Boots into case-entry with the shipped profile applied | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B002 | Specimen selector is populated from the profile, not the static HTML | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B003 | Start Count transitions to counting and renders the grid | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B004 | Case badge shows the active case throughout counting (URS-002) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B005 | Counting starts without a case number by default (URS-004) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B010 | Mapped key increments its category and the DOM updates | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B011 | Shift+key decrements and never goes below zero (URS-025, HA-013) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B012 | Unmapped keys are ignored and do not preventDefault (URS-026) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B013 | Ctrl/Alt/Meta combinations never count (SYS-036) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B014 | Barcode workflow — Enter in the case field starts counting and keys still count (URS-006) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B015 | Keystrokes in the comment field do not count (URS-070, SYS-073) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B016 | Keystrokes aimed at the specimen selector do not count | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B017 | No keystroke counts before Start Count | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B018 | Percentages displayed during counting sum to 100.00 (URS-034) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B019 | Progress label reverts when undo drops the count below target | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B020 | A profile requiring a case number blocks Start Count when empty | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B021 | The same profile starts normally once a case number is present | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B030 | Count Done finalizes, records history and shows the report (URS-040) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B031 | Keystrokes after Count Done do not alter the count (HA-015, HA-031) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B032 | Continue Counting resumes with the tally intact (URS-042, HA-071) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B033 | Free-text comments survive Count Done -> Continue Counting (URS-073) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B034 | Structured morphology selections survive Continue Counting (URS-073) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B035 | Morphology selections appear in the finalized report (URS-071) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B036 | Reset asks for confirmation when data exists (URS-061) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B037 | Reset clears data but preserves specimen type (URS-062, URS-063) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B038 | New Case from the results screen returns to a clean case-entry | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B040 | The specimen switcher is reachable during counting | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B041 | Switching with zero cells switches immediately | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B042 | Switching mid-count with a case number saves to history first (URS-013) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B043 | Cancelling a mid-count switch restores the selector and the count | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B044 | Switching without a case number confirms a discard | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B050 | Counting writes an autosave record after each keystroke | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B051 | An interrupted count is offered for recovery and restores fully | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B052 | Discarding a recovery clears the record | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B053 | Recovery of a specimen type absent from the profile fails safe, not with a crash | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B054 | Finalizing a count clears the autosave record | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B055 | A profile with autosave:false writes no record | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B060 | Export Config produces a downloadable profile | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B061 | Reset to Default confirms, clears the cache and reloads | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B062 | Import Config applies a valid profile | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B063 | Import rejects a structurally invalid profile without applying it | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B064 | Import rejects malformed JSON | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B070 | A newer shipped version of the same profile supersedes the cache | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B071 | A user custom profile is never overwritten by the shipped default | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B072 | Counting works offline from the cached profile (URS-094) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B073 | An invalid cached profile falls back to the shipped default | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B074 | Total config failure shows an error screen with a recovery control | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B075 | A config-update notice does not swallow the crash-recovery prompt | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B076 | A hand-edited autosave record cannot inject a negative count | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B080 | Report includes the configuration traceability footer (URS-052) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B081 | Low-count advisory appears but never blocks (URS-041) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B082 | Reaching target shows no advisory | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B083 | CSV export contains the traceability columns and the counted data | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B084 | JSON export parses and carries the session | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B085 | Absolute counts derive from the displayed percentages (URS-036, HA-024) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B086 | A non-numeric WBC clears the absolute counts rather than showing NaN | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B087 | A case number containing markup is rendered inert (SYS-S04) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B088 | Session history lists completed counts and opens read-only detail | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B090 | Theme toggles and persists to sessionStorage | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B091 | Ctrl+Shift+L toggles the theme without disturbing counting | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B092 | Audio toggle flips state and persists | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B093 | Counting emits audio feedback when enabled | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B100 | NRBC counted in PB do not dilute the leucocyte percentages | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B101 | NRBC display per 100 WBC rather than a percentage | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B102 | The grand total distinguishes the differential from the overall tally | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B103 | Progress tracks the differential, not the cells tallied | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B104 | Displayed percentages still sum to 100 with a category excluded | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B105 | The finalized PB report states leucocytes and NRBC per 100 WBC | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B106 | Absolute counts are not derived for a non-differential category | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B107 | Bone marrow is unaffected — erythroblasts remain a percentage | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B110 | The results screen states an interval beside each percentage | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B111 | Intervals are computed from the differential denominator | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B112 | The low-count advisory carries a computed interval | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B113 | A profile may disable intervals | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B114 | The configured confidence level is honoured | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B115 | Intervals reach the CSV archive | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B116 | A zero count still yields a bounding interval | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B120 | A count straddling a threshold raises the advisory | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B121 | The advisory never blocks completion (URS-041 philosophy) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B122 | A count clear of every threshold shows no advisory | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B123 | Continue Counting remains the offered remedy | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B124 | Extending the count re-evaluates the advisory | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B125 | All configured formulas render, not just M:E | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B126 | A threshold on a subset formula is evaluated against its own denominator | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B127 | Threshold results are archived on the session | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B130 | The results screen carries a method statement | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B131 | The copied report carries the profile and version (URS-052) | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B132 | The method statement reaches the session and the CSV | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B133 | A template may place the method statement inline | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B134 | The peripheral blood method statement declares the denominator | Behaviour | `tests/11-application-behavior.test.js` |
| TC-B135 | A profile with no provenance still produces valid output | Behaviour | `tests/11-application-behavior.test.js` |

#### UD-* — User-facing documentation

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| UD-001 | Every counting key in the shipped profile is documented | Static | `tests/13-user-documentation.test.js` |
| UD-002 | No key is documented that the profile does not define | Static | `tests/13-user-documentation.test.js` |
| UD-003 | Documented target counts match the profile | Static | `tests/13-user-documentation.test.js` |
| UD-004 | The guide points at the methods page | Static | `tests/13-user-documentation.test.js` |
| UD-010 | The confidence interval table is computed, not asserted | Static | `tests/13-user-documentation.test.js` |
| UD-011 | Every interval quoted in the page is one the engine produces | Static | `tests/13-user-documentation.test.js` |
| UD-012 | The NRBC worked example is arithmetically correct | Static | `tests/13-user-documentation.test.js` |
| UD-013 | The M:E convention described matches the shipped formula | Static | `tests/13-user-documentation.test.js` |
| UD-014 | Documented target counts and their basis match the profile | Static | `tests/13-user-documentation.test.js` |
| UD-015 | The ICSH exclusion list in the page is complete | Static | `tests/13-user-documentation.test.js` |
| UD-016 | Limitations are stated with their evidence | Static | `tests/13-user-documentation.test.js` |
| UD-017 | The page does not overstate what more counting achieves | Static | `tests/13-user-documentation.test.js` |
| UD-018 | The methods page is reachable from the application | Static | `tests/13-user-documentation.test.js` |
| UD-019 | The methods page loads no third-party script (URS-094) | Static | `tests/13-user-documentation.test.js` |
| UD-030 | The NRBC comparison table is correct in both columns | Static | `tests/13-user-documentation.test.js` |
| UD-031 | The rounding comparison table is correct for all three policies | Static | `tests/13-user-documentation.test.js` |
| UD-032 | The two M:E conventions give the stated ratios | Static | `tests/13-user-documentation.test.js` |
| UD-033 | Every confidence interval in the reference is engine-produced | Static | `tests/13-user-documentation.test.js` |
| UD-034 | The Wald comparison is reproduced faithfully | Static | `tests/13-user-documentation.test.js` |
| UD-035 | The blast-denominator example is consistent with its own scenario | Static | `tests/13-user-documentation.test.js` |
| UD-036 | Every choice the reference calls configurable really is | Static | `tests/13-user-documentation.test.js` |
| UD-037 | What the reference calls fixed is stated as fixed | Static | `tests/13-user-documentation.test.js` |
| UD-038 | Every abbreviation used is expanded in the table | Static | `tests/13-user-documentation.test.js` |
| UD-039 | The reference says where each setting is actually reached | Static | `tests/13-user-documentation.test.js` |
| UD-040 | The blast-denominator change is attributed to WHO 2016, not 2022 | Static | `tests/13-user-documentation.test.js` |
| UD-050 | Every counting key in the shipped profile is documented correctly | Static | `tests/13-user-documentation.test.js` |
| UD-051 | SOP-001 documents no key the profile does not define | Static | `tests/13-user-documentation.test.js` |
| UD-052 | SOP-001 states the shipped target counts | Static | `tests/13-user-documentation.test.js` |
| UD-053 | SOP-001 does not describe withdrawn behaviour | Static | `tests/13-user-documentation.test.js` |
| UD-060 | Every section RTM-001 cites in SDD-001 exists | Static | `tests/13-user-documentation.test.js` |
| UD-061 | The design covers the calculations the engine performs | Static | `tests/13-user-documentation.test.js` |
| UD-062 | The superseded percentage formula is marked, not left standing | Static | `tests/13-user-documentation.test.js` |
| UD-063 | The design does not describe a CDN dependency the product removed | Static | `tests/13-user-documentation.test.js` |

#### VV-ABS-* — Absolute counts and the analyser WBC

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-ABS-001 | Absolute count is WBC x percentage / 100 | Unit | `tests/01-calculation-engine.test.js` |
| VV-ABS-002 | Non-positive or non-numeric WBC yields null, not NaN | Unit | `tests/01-calculation-engine.test.js` |
| VV-ABS-020 | The published formula is implemented exactly | Unit | `tests/01-calculation-engine.test.js` |
| VV-ABS-021 | A 20% overstatement is removed, at the ANC thresholds that matter | Unit | `tests/01-calculation-engine.test.js` |
| VV-ABS-022 | No nucleated red cells means no correction | Unit | `tests/01-calculation-engine.test.js` |
| VV-ABS-023 | An unusable WBC yields null, never a silent zero | Unit | `tests/01-calculation-engine.test.js` |
| VV-ABS-024 | The correction is monotonic and bounded | Unit | `tests/01-calculation-engine.test.js` |

#### VV-CALC-* — Calculation engine vectors

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-CALC-001 | All zeros returns 0.00 for every cell (SYS-042, HA-021) | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-002 | Single cell counted = 100.00% (SYS-040) | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-003 | Two equal cells = 50.00% each | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-004 | Fourteen equal cells = 7.142857...% raw | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-005 | One dominant cell 95/5 | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-008 | Acute leukemia pattern — 45% blasts | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-011 | Repeating thirds sum to exactly 100.00 at 2 dp | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-012 | Repeating sixths sum to exactly 100.00 at 2 dp | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-014 | Maximum capacity (9999 cells) computes without degradation (SYS-P04) | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-016 | Fourteen equal cells sum to exactly 100.00 at 2 dp | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-017 | Integer output percentages sum to exactly 100 | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-018 | Zero total produces all zeros, not a forced 100 | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-019 | No category deviates from its true percentage by more than one unit of the last decimal place | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-020 | Property — 2000 randomized differentials always sum to exactly 100 | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-021 | Adjustment is deterministic for identical input | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-022 | Percentages render at 2 decimal places | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-023 | Low-percentage categories retain 2 dp resolution | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-024 | A persisted negative count cannot produce a negative percentage | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-025 | sanitizeCounts coerces to non-negative integers and drops unknown types | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-026 | A single counted category is 100% at every precision | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-027 | Extreme ratios still sum to exactly 100 | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-028 | getTotal ignores negative and non-finite entries | Unit | `tests/01-calculation-engine.test.js` |

#### VV-CI-* — Wilson confidence intervals

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-CI-001 | Known Wilson values are reproduced | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-002 | Bounds are never impossible, where Wald would be | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-003 | A zero count still says something | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-004 | A saturated count is bounded at 100 | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-005 | Intervals narrow as the count grows | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-006 | Higher confidence gives a wider interval | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-007 | The interval always contains the point estimate | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-008 | Degenerate input yields null, not a bogus interval | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-009 | The AML blast threshold is not resolved by a 200-cell count | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-010 | A count far from a threshold does not straddle it | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-011 | Interval formatting is stable | Unit | `tests/01-calculation-engine.test.js` |
| VV-CI-012 | Cells-for-precision answers the "how many more" question | Unit | `tests/01-calculation-engine.test.js` |

#### VV-DEN-* — Denominator policy

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-DEN-001 | NRBC are excluded from the peripheral blood denominator | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-DEN-002 | NRBC are reported per 100 WBC | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-DEN-003 | The PB report states the leucocyte count and NRBC per 100 WBC | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-DEN-004 | Bone marrow is unaffected — erythroblasts stay in the denominator | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-DEN-005 | The advisory measures the differential, not the overall tally | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-DEN-006 | A zero denominator does not divide by zero | Unit | `tests/05-end-to-end-data-integrity.test.js` |

#### VV-E2E-* — End-to-end data integrity

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-E2E-001 | Each mapped keypress increments exactly one category by one | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-002 | Lowercase keystrokes count identically to uppercase | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-003 | Unmapped keys are silently ignored (URS-026) | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-004 | Shift+key undoes, and undo at zero is a no-op (URS-025) | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-005 | A 500-keystroke bone marrow count totals exactly 500 | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-010 | Report percentages track the displayed percentages within one point | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-011 | Both the displayed and the reported differential sum to 100 | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-012 | Every template placeholder is resolved — no {{token}} survives | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-013 | Every specimen type in the profile renders every template | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-014 | M:E ratio in the report matches the ratio computed from counts | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-015 | Peripheral blood profile defines no M:E ratio and reports none | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-020 | Session carries profile id, name, version, target and timestamp | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-021 | CSV export carries every traceability column | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-022 | JSON export round-trips and carries traceability | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-023 | Low-count advisory is recorded on the session (URS-041) | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-030 | Markup in the case number cannot escape into the report | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-031 | Replacement-pattern characters are inserted literally | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-032 | Spreadsheet formula injection is neutralized in CSV | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-033 | Ordinary case numbers are not mangled by the CSV guard | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-034 | Event-handler attributes in a template are stripped, not rendered | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-040 | Comments reach the report when the template references them | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-041 | Comments survive CSV round-trip including commas and quotes | Unit | `tests/05-end-to-end-data-integrity.test.js` |
| VV-E2E-050 | Resuming and adding cells extends rather than restarts the count | Unit | `tests/05-end-to-end-data-integrity.test.js` |

#### VV-INC-* — Increment and decrement

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-INC-001 | Increment adds exactly one | Unit | `tests/01-calculation-engine.test.js` |
| VV-INC-005 | Decrement never goes below zero (HA-013) | Unit | `tests/01-calculation-engine.test.js` |
| VV-INC-006 | Sequence of increments and undos yields the arithmetic result | Unit | `tests/01-calculation-engine.test.js` |

#### VV-LOW-* — Sub-target advisory

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-LOW-001 | Below-target count produces a non-blocking note | Unit | `tests/01-calculation-engine.test.js` |
| VV-LOW-002 | Reaching the target produces no note | Unit | `tests/01-calculation-engine.test.js` |
| VV-LOW-003 | Missing or invalid target produces no note | Unit | `tests/01-calculation-engine.test.js` |
| VV-LOW-004 | The advisory states an actual interval, not a vague warning | Unit | `tests/01-calculation-engine.test.js` |
| VV-LOW-005 | The stated interval matches the engine | Unit | `tests/01-calculation-engine.test.js` |
| VV-LOW-006 | The advisory honours the configured confidence level | Unit | `tests/01-calculation-engine.test.js` |

#### VV-ME-* — Myeloid-to-erythroid ratio

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-ME-001 | Standard myeloid/erythroid ratio | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-002 | Ratio honours the configured precision | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-003 | Zero denominator yields N/A, never a division error (HA-072) | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-004 | Zero numerator over a positive denominator is 0.0:1 | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-005 | Absent formula returns null so no ratio row is rendered | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-006 | Every numerator member contributes to the ratio | Unit | `tests/01-calculation-engine.test.js` |

#### VV-PROV-* — Method provenance

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-PROV-001 | The statement names the profile and its version | Unit | `tests/01-calculation-engine.test.js` |
| VV-PROV-002 | A derived formula states the convention it follows | Unit | `tests/01-calculation-engine.test.js` |
| VV-PROV-003 | A non-standard denominator is declared | Unit | `tests/01-calculation-engine.test.js` |
| VV-PROV-004 | A plain profile makes no denominator claim | Unit | `tests/01-calculation-engine.test.js` |
| VV-PROV-005 | The confidence level is stated when intervals are shown | Unit | `tests/01-calculation-engine.test.js` |
| VV-PROV-006 | An empty profile yields an empty statement, not a stub | Unit | `tests/01-calculation-engine.test.js` |
| VV-PROV-007 | The statement flattens for template substitution | Unit | `tests/01-calculation-engine.test.js` |
| VV-PROV-008 | methodNotes is available to templates and cannot be shadowed | Unit | `tests/01-calculation-engine.test.js` |

#### VV-RND-* — Rounding policy

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-RND-001 | largest-remainder is the default and totals exactly 100 | Unit | `tests/01-calculation-engine.test.js` |
| VV-RND-002 | largest-count totals 100 but displaces one category further | Unit | `tests/01-calculation-engine.test.js` |
| VV-RND-003 | independent rounding is faithful per category but need not total 100 | Unit | `tests/01-calculation-engine.test.js` |
| VV-RND-004 | Every policy still respects the denominator exclusion | Unit | `tests/01-calculation-engine.test.js` |
| VV-RND-005 | Validation rejects an unknown policy | Unit | `tests/01-calculation-engine.test.js` |
| VV-RND-006 | Validation rejects an impossible precision | Unit | `tests/01-calculation-engine.test.js` |
| VV-RND-007 | The method statement declares which policy is in force | Unit | `tests/01-calculation-engine.test.js` |

#### VV-SUB-* — Subset percentages

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-SUB-001 | A subset percentage uses its own denominator | Unit | `tests/01-calculation-engine.test.js` |
| VV-SUB-002 | The two conventions can fall on opposite sides of a threshold | Unit | `tests/01-calculation-engine.test.js` |
| VV-SUB-003 | A zero denominator yields null, not a division | Unit | `tests/01-calculation-engine.test.js` |
| VV-SUB-004 | computeFormula dispatches on type and defaults to ratio | Unit | `tests/01-calculation-engine.test.js` |
| VV-SUB-005 | A subset percentage carries a confidence interval, as a ratio cannot | Unit | `tests/01-calculation-engine.test.js` |
| VV-SUB-006 | Validation rejects a numerator outside the denominator | Unit | `tests/01-calculation-engine.test.js` |
| VV-SUB-007 | Validation rejects an unknown formula type | Unit | `tests/01-calculation-engine.test.js` |

#### VV-SYS-* — System verification in a real browser

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-SYS-001 | Application loads and presents the case entry phase | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-002 | Specimen selector is populated from the configuration profile | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-003 | Enter in the case field starts counting (barcode workflow, URS-006) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-004 | Counting may begin without a case number (URS-004) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-005 | Active case number is displayed throughout counting (URS-002) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-010 | Every configured key increments its own category (URS-020, URS-021) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-011 | Shift+key undoes and never passes zero (URS-025) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-012 | Unmapped keys are ignored (URS-026) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-013 | Key mapping is displayed for every category (URS-022) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-014 | Percentages update live and sum to 100.00 (URS-031, URS-034) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-015 | Typing in the comment field never counts (URS-070) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-016 | Progress indicator tracks the target count (URS-024) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-017 | M:E ratio computes live and shows N/A with a zero denominator (URS-035) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-020 | 500-cell differential counts, reports and exports consistently | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-021 | Sub-target count completes with an advisory, never a block (URS-041) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-030 | Continue Counting preserves the tally and extends it (URS-042) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-031 | Comments survive Count Done then Continue Counting (URS-073) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-032 | Reset requires confirmation and then clears the count (URS-060, URS-061) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-033 | Keystrokes after completion cannot alter the count (HA-015) | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-040 | The specimen switcher is available during counting | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-041 | Switching mid-count saves the work to history first | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-042 | Cancelling a switch restores both the selector and the count | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-050 | Export Config downloads the active profile | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-051 | Import Config applies a profile and re-renders the counter | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-052 | Import rejects an invalid profile and keeps the current one | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-053 | Reset to Default confirms, clears the cache and restores the built-in profile | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-054 | A newer built-in profile supersedes a cached copy of the same profile | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-055 | The catalogue lists the built-in profiles | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-056 | Loading a preset applies it and it is usable for counting | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-057 | The body fluid preset provides a non-blood specimen panel (URS-011) | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-060 | The editor is reachable from the counter | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-061 | An unusable draft is downloaded but never made active | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-062 | A complete profile saved in the editor is picked up by the counter | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-063 | The editor preserves every field it does not itself edit | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-064 | An edit saved in the editor is honoured by the counter | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-065 | The denominator policy can be set in the editor and changes the count | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-066 | Rounding and precision can be set in the editor and change the figures | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-067 | A threshold added in the editor raises the advisory | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-068 | The M:E composition can be changed in the editor | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-069 | The policy controls cannot produce a profile the counter rejects | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-070 | Copy to Clipboard places the report on the system clipboard (URS-053) | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-071 | Session CSV export downloads with traceability columns (URS-084) | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-072 | Session JSON export downloads and parses (URS-084) | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-073 | A case number containing markup is rendered as inert text (SYS-S04) | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-074 | The print control is available on the results screen (URS-054) | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-075 | Session history opens a read-only record (URS-082) | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-080 | An interrupted count is recovered after a browser restart | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-081 | Discarding the recovery starts clean | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-082 | A finalized count leaves no recovery prompt behind | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-090 | The application loads and counts with the network disconnected | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-091 | Tailwind is served from the local origin, not a CDN | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-100 | NRBC counted in PB do not dilute the leucocyte percentages | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-101 | The report states the leucocyte differential and NRBC per 100 WBC | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-102 | Bone marrow keeps erythroblasts in the differential | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-110 | The report states a confidence interval for each percentage | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-111 | A sub-target count carries a quantified advisory | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-112 | A zero count is reported as bounded, not absent | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-120 | A count straddling the AML threshold raises the advisory | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-121 | The advisory is informational and never blocks | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-122 | Extending the count re-evaluates the advisory | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-123 | A clean count shows no advisory | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-125 | The legacy preset reports blasts against both denominators | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-130 | The pasted report carries profile attribution | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-131 | The results screen states the conventions used | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-140 | The methods page is reachable and renders | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-141 | The worked figures on the page match what the counter produces | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-142 | The results screen links to the methods page | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-143 | The methods page works offline | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-150 | Reachable from the counter and renders | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-151 | Reachable from the methods page and links back | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-152 | Reachable from the results screen | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-153 | States both what is configurable and what is fixed | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-154 | Available offline | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-155 | Loads no third-party script (URS-094) | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-160 | advisories are legible in the light theme | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-161 | The counting grid stays legible in the light theme | System | `tests-e2e/counting-workflow.spec.js` |
| VV-SYS-162 | counter — case entry meets WCAG AA | System | `tests-e2e/contrast-sweep.spec.js` |
| VV-SYS-163 | counter — counting meets WCAG AA | System | `tests-e2e/contrast-sweep.spec.js` |
| VV-SYS-164 | counter — results meets WCAG AA | System | `tests-e2e/contrast-sweep.spec.js` |
| VV-SYS-165 | methods and limitations meets WCAG AA | System | `tests-e2e/contrast-sweep.spec.js` |
| VV-SYS-166 | calculation reference meets WCAG AA | System | `tests-e2e/contrast-sweep.spec.js` |
| VV-SYS-167 | quick start guide meets WCAG AA | System | `tests-e2e/contrast-sweep.spec.js` |
| VV-SYS-168 | configuration editor meets WCAG AA | System | `tests-e2e/contrast-sweep.spec.js` |
| VV-SYS-169 | dialog, with validation errors shown meets WCAG AA | System | `tests-e2e/contrast-sweep.spec.js` |
| VV-SYS-170 | Adding a specimen type uses the product dialog, not a browser prompt | System | `tests-e2e/dialog.spec.js` |
| VV-SYS-171 | Adding a derived figure uses the product dialog | System | `tests-e2e/dialog.spec.js` |
| VV-SYS-172 | Invalid input is refused with a reason, and the dialog stays open | System | `tests-e2e/dialog.spec.js` |
| VV-SYS-173 | Enter confirms, Escape cancels, focus is placed and restored | System | `tests-e2e/dialog.spec.js` |
| VV-SYS-174 | Tab is trapped inside the dialog | System | `tests-e2e/dialog.spec.js` |
| VV-SYS-175 | A counting key pressed while a dialog is open does not count | System | `tests-e2e/dialog.spec.js` |
| VV-SYS-176 | Escape cannot discard an interrupted count | System | `tests-e2e/dialog.spec.js` |
| VV-SYS-177 | counter controls meet AA under the pointer | System | `tests-e2e/hover-contrast.spec.js` |
| VV-SYS-178 | configuration editor controls meet AA under the pointer | System | `tests-e2e/hover-contrast.spec.js` |
| VV-SYS-180 | every mapped key increments and decrements | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-181 | A held key adds one cell, not one per repeat | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-182 | Keystrokes composed by an input method do not count | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-183 | Escape on an alert still runs its continuation | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-184 | A stale autosave is discarded rather than resurrected | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-185 | A recent autosave is still offered | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-186 | The entered WBC is corrected before any absolute count | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-187 | The correction is shown, not applied silently | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-188 | An already-corrected value is used as entered | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-189 | With no nucleated red cells the control is not offered | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-190 | Bone marrow gets no correction — erythroblasts belong in the count | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-191 | When enabled, the report carries the corrected ANC and its basis | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-192 | When disabled, the report is unchanged by a WBC | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-193 | Declaring the WBC already corrected changes the reported figure and says so | System | `tests-e2e/input-integrity.spec.js` |

#### VV-THR-* — Diagnostic thresholds

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-THR-001 | An interval spanning a threshold is flagged | Unit | `tests/01-calculation-engine.test.js` |
| VV-THR-002 | A count clear of a threshold is not flagged | Unit | `tests/01-calculation-engine.test.js` |
| VV-THR-003 | More cells narrow the interval but need not resolve the threshold | Unit | `tests/01-calculation-engine.test.js` |
| VV-THR-004 | A threshold may target a percentage formula | Unit | `tests/01-calculation-engine.test.js` |
| VV-THR-005 | A ratio formula cannot be a threshold target | Unit | `tests/01-calculation-engine.test.js` |
| VV-THR-006 | Validation rejects an unresolvable or out-of-range threshold | Unit | `tests/01-calculation-engine.test.js` |
| VV-THR-007 | A category outside the differential cannot be a threshold target | Unit | `tests/01-calculation-engine.test.js` |
| VV-THR-008 | No thresholds configured yields no evaluation | Unit | `tests/01-calculation-engine.test.js` |

#### VV-TPL-* — Output templates

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-TPL-001 | Yale SOM template renders with no unresolved placeholders | Unit | `tests/02-configuration.test.js` |
| VV-TPL-002 | Precipio DX template renders with no unresolved placeholders | Unit | `tests/02-configuration.test.js` |
| VV-TPL-003 | MGH BM template renders with no unresolved placeholders | Unit | `tests/02-configuration.test.js` |
| VV-TPL-004 | MGH PB template renders with no unresolved placeholders | Unit | `tests/02-configuration.test.js` |
| VV-TPL-005 | BM template {{ME_ratio}} placeholder is resolved by formula key | Unit | `tests/02-configuration.test.js` |

<!-- END GENERATED: verification-index -->

## 6. Pass/Fail Criteria

### 6.1 Individual Test Case
- **Pass**: All expected results are observed exactly as specified
- **Fail**: Any deviation from expected results

### 6.2 Overall Test Execution
- **Release criteria**: ALL Priority 1 tests MUST pass
- **Advisory**: Priority 2 tests SHOULD pass; failures require documented risk acceptance
- **Informational**: Priority 3 failures logged as known issues

### 6.3 Test Coverage Summary

| Priority | Count | Required Pass Rate |
|----------|-------|-------------------|
| P1 (Safety-critical) | 32 | 100% |
| P2 (Important) | 30 | 95% |
| P3 (Standard) | 28 | 90% |
| **Total** | **90** | |

---

## 7. Test Execution Log Template

| TC ID | Tester | Date | Browser | Build | Result | Notes |
|-------|--------|------|---------|-------|--------|-------|
| | | | | | Pass / Fail | |

---

## 8. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| C | 2026-08-06 | QMS | **v2.0 — re-issued.** The TC-001..TC-127 numbering is withdrawn: none of those identifiers appeared in any test file, and no mapping to the implemented scheme ever existed. Replaced by a register generated from the test runners. See DCR-018. |
| A | 2026-02-18 | QMS | Initial draft - complete test plan |
| B | 2026-02-19 | QMS | Added session export test cases |
| C | 2026-02-20 | QMS | Added theme toggle test cases |
| D | 2026-02-20 | QMS | Updated test counts and prioritization summary |
| E | 2026-02-24 | QMS | v2.0 - Major update: 14 unified cell types, advisory targets (BM=500, PB=200), M:E ratio tests, Continue Counting tests, two-row layout tests, upper row flagging tests, progress indicator tests, unified keyboard mapping (R,L,O,M,T,C,S,B,P,A,E,N,Y,X), optional case number (Start Count always enabled), non-blocking informational notes, removed TC-052/TC-086, updated test environment to Node.js |

## 9. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Lead | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
