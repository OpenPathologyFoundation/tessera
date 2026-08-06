# VV-001: Verification & Validation Protocol

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | VV-001 |
| **Version** | 3.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-02-24 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 v2.0, SRS-001 v2.0, SDD-001 v2.0, TP-001 v2.0, RA-001 v2.0 |

---

## 1. Purpose

This document defines the verification and validation (V&V) approach for WBC ΔΣ v2.0. Verification demonstrates that the software was built correctly (meets system requirements). Validation demonstrates that the correct software was built (meets user needs in the intended use environment). This version covers the unified 14-cell type model, advisory target counts, M:E ratio computation, Continue Counting workflow, and two-row table layout.

## 2. V&V Framework

### 2.1 Verification vs. Validation

| Activity | Question Answered | Method | Reference |
|----------|------------------|--------|-----------|
| **Verification** | "Was the product built correctly?" | Testing, inspection, analysis against SRS-001 v2.0 | IEC 62304 Section 5.7 |
| **Validation** | "Was the correct product built?" | Clinical user acceptance testing against URS-001 v2.0 | IEC 62304 Section 5.8 |

### 2.2 V-Model Mapping

```
USER REQUIREMENTS (URS-001 v2.0)  <----------->  VALIDATION (Section 5)
        |                                              ^
SYSTEM REQUIREMENTS (SRS-001 v2.0) <----------->  SYSTEM VERIFICATION (Section 4)
        |                                              ^
ARCHITECTURE DESIGN (SAD-001) <---------------->  INTEGRATION VERIFICATION (Section 3)
        |                                              ^
DETAILED DESIGN (SDD-001 v2.0)    <----------->  UNIT VERIFICATION (Section 3)
        |                                              ^
        +---> IMPLEMENTATION ---------------------------+
```

---

## 3. Verification Register

Sections 3 and 4 previously listed verification vectors and a system
verification table maintained by hand. They had drifted so far from the suites
that **98 of the 111 identifiers cited by RTM-001 and TR-001 existed in no
protocol document**, and the gap was widening with every suite added.

A traceability matrix citing identifiers that do not exist is worse than no
matrix, because it manufactures the appearance of coverage. The register below
is therefore **generated from the runners** — the only artefact that cannot
misdescribe what it verifies — and the build fails if it goes stale or if any
cited identifier is absent from it (suite 14, QC-004 and QC-005).

The former §4 system verification table mapped SRS identifiers to `TC-0xx`
numbers that were never implemented. Requirement-to-verification tracing now
lives in **RTM-001 §5**, which cites the identifiers registered here.

<!-- BEGIN GENERATED: verification-index -->

> **Generated. Do not edit by hand.**  
> `node scripts/qms-verification-index.js --write` regenerates this section from
> the test files. Suite 14 fails the build if it is stale, and if any identifier
> cited by RTM-001 or TR-001 does not exist here.

**705 verification cases** across 26 series and 4 layers, run as 762 tests.  Every test carries an identifier; a case running more than once is parametrised — one per shipped preset, per theme, or per surface.

| Series | Cases | Layer(s) | Covers |
|--------|-------|----------|--------|
| `QC-*` | 8 (001–011) | Static | QMS counted quantities |
| `SC-*` | 24 (001–053) | Unit | Standards conformance (ICSH) |
| `TC-B*` | 91 (001–135) | Behaviour | Application behaviour in a DOM |
| `UD-*` | 50 (001–094) | Static | User-facing documentation |
| `VV-ABS-*` | 7 (001–024) | Unit | Absolute counts and the analyser WBC |
| `VV-AUD-*` | 19 (001–019) | Static | Audio engine structure |
| `VV-CALC-*` | 24 (001–030) | Unit | Calculation engine vectors |
| `VV-CFG-*` | 39 (001–039) | Unit | Configuration profile integrity |
| `VV-CI-*` | 12 (001–012) | Unit | Wilson confidence intervals |
| `VV-DEN-*` | 6 (001–006) | Unit | Denominator policy |
| `VV-DOM-*` | 51 (001–051) | Static | Counter markup and required elements |
| `VV-E2E-*` | 23 (001–050) | Unit | End-to-end data integrity |
| `VV-EDT-*` | 40 (001–040) | Static | Configuration editor structure |
| `VV-INC-*` | 3 (001–006) | Unit | Increment and decrement |
| `VV-LOW-*` | 6 (001–006) | Unit | Sub-target advisory |
| `VV-ME-*` | 13 (001–016) | Unit | Myeloid-to-erythroid ratio |
| `VV-PRE-*` | 20 (001–020) | Unit | Preset catalogue integrity |
| `VV-PROV-*` | 8 (001–008) | Unit | Method provenance |
| `VV-RND-*` | 7 (001–007) | Unit | Rounding policy |
| `VV-SAV-*` | 18 (001–018) | Static | Autosave and crash recovery (static) |
| `VV-SCH-*` | 23 (001–023) | Unit | v2 configuration schema |
| `VV-SRC-*` | 76 (001–076) | Static | Application source integrity (static) |
| `VV-SUB-*` | 7 (001–007) | Unit | Subset percentages |
| `VV-SYS-*` | 117 (001–203) | System | System verification in a real browser |
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
| QC-010 | No asset under web/ is referenced by nothing | Static | `tests/14-qms-counts.test.js` |
| QC-011 | Every test carries a verification identifier | Static | `tests/14-qms-counts.test.js` |

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
| SC-040 | The alternative convention is composable and valid | Unit | `tests/12-standards-conformance.test.js` |
| SC-041 | The editor exposes the formula composition (URS-035) | Unit | `tests/12-standards-conformance.test.js` |
| SC-042 | The two conventions give different ratios from identical counts | Unit | `tests/12-standards-conformance.test.js` |
| SC-043 | The convention in force is stated, so a report is interpretable | Unit | `tests/12-standards-conformance.test.js` |
| SC-050 | The 200-cell target is not presented as the CLSI reference method | Unit | `tests/12-standards-conformance.test.js` |
| SC-051 | The 500-cell marrow target is attributed to ICSH, not CAP | Unit | `tests/12-standards-conformance.test.js` |
| SC-052 | The marrow target basis states the ICSH condition | Unit | `tests/12-standards-conformance.test.js` |
| SC-053 | A sub-target advisory carries the basis for the target | Unit | `tests/12-standards-conformance.test.js` |

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
| UD-070 | The architecture names every shipped module | Static | `tests/13-user-documentation.test.js` |
| UD-071 | It does not deny the data at rest that the product holds | Static | `tests/13-user-documentation.test.js` |
| UD-072 | It does not describe a CDN dependency the product removed | Static | `tests/13-user-documentation.test.js` |
| UD-073 | Every file it lists in the layout actually exists | Static | `tests/13-user-documentation.test.js` |
| UD-074 | It does not fix the key mapping that configuration owns | Static | `tests/13-user-documentation.test.js` |
| UD-075 | The component diagram shows every layer that exists | Static | `tests/13-user-documentation.test.js` |
| UD-076 | The counting flow shows the guards that protect the tally | Static | `tests/13-user-documentation.test.js` |
| UD-077 | The completion flow shows what the results screen computes | Static | `tests/13-user-documentation.test.js` |
| UD-078 | The reset flow does not claim behaviour the code does not have | Static | `tests/13-user-documentation.test.js` |
| UD-079 | §6 documents every field of the real state object | Static | `tests/13-user-documentation.test.js` |
| UD-080 | §6 documents every storage key, and which hold patient data | Static | `tests/13-user-documentation.test.js` |
| UD-081 | §6 does not claim the tally is lost on page close | Static | `tests/13-user-documentation.test.js` |
| UD-090 | All four statutory criteria are assessed, not just the easy ones | Static | `tests/13-user-documentation.test.js` |
| UD-091 | The features the argument depends on still exist | Static | `tests/13-user-documentation.test.js` |
| UD-092 | It is labelled unreviewed until a qualified reviewer signs it | Static | `tests/13-user-documentation.test.js` |
| UD-093 | The precision table is engine-produced (C-3) | Static | `tests/13-user-documentation.test.js` |
| UD-094 | The ratio-interval table is engine-produced (G-2) | Static | `tests/13-user-documentation.test.js` |

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

#### VV-AUD-* — Audio engine structure

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-AUD-001 | AudioEngine object is defined | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-002 | AudioEngine has init method | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-003 | AudioEngine has playClick method for count increment | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-004 | AudioEngine has playUndo method for decrement | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-005 | AudioEngine has playChime method for target reached | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-006 | AudioEngine has playTypewriter method for comments | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-007 | AudioEngine has toggle method | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-008 | AudioEngine uses Web Audio API (AudioContext) | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-009 | AudioEngine uses OscillatorNode for sound generation | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-010 | AudioEngine uses GainNode for volume control | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-011 | Audio state is persisted via sessionStorage | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-012 | AudioEngine.enabled property exists | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-013 | Toggle updates the audio label | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-014 | Audio toggle button is referenced in HTML | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-015 | playClick is called on increment in onKeyDown | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-016 | playUndo is called on decrement in onKeyDown | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-017 | playChime is called when target is first reached | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-018 | playTypewriter is called on morphology comment input | Static | `tests/06-audio-engine.test.js` |
| VV-AUD-019 | Sound frequency values are defined for each sound type | Static | `tests/06-audio-engine.test.js` |

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
| VV-CALC-029 | The live path honours the denominator, which the deleted one did not | Unit | `tests/01-calculation-engine.test.js` |
| VV-CALC-030 | Non-numeric and missing values do not corrupt the total | Unit | `tests/01-calculation-engine.test.js` |

#### VV-CFG-* — Configuration profile integrity

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-CFG-001 | templates.json exists and is readable | Unit | `tests/02-configuration.test.js` |
| VV-CFG-002 | templates.json contains valid JSON | Unit | `tests/02-configuration.test.js` |
| VV-CFG-003 | Configuration has at least 1 specimen type (SYS-102) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-004 | V2 config has version and profileId fields | Unit | `tests/02-configuration.test.js` |
| VV-CFG-005 | Each entry has required fields: specimenType, targetCount, categories, outCodes, templates | Unit | `tests/02-configuration.test.js` |
| VV-CFG-006 | specimenType values are unique (no duplicates) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-007 | Bone Marrow (bm) specimen type is configured | Unit | `tests/02-configuration.test.js` |
| VV-CFG-008 | Peripheral Blood (pb) specimen type is configured | Unit | `tests/02-configuration.test.js` |
| VV-CFG-009 | Each entry has categories with upper and lower arrays | Unit | `tests/02-configuration.test.js` |
| VV-CFG-010 | All category cell types exist in outCodes values | Unit | `tests/02-configuration.test.js` |
| VV-CFG-011 | Categories cover all outCodes values (no orphaned cell types) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-012 | BM categories: 7 upper, 7 lower | Unit | `tests/02-configuration.test.js` |
| VV-CFG-013 | PB categories: 7 upper, 7 lower | Unit | `tests/02-configuration.test.js` |
| VV-CFG-014 | BM upperRowAbnormal is false | Unit | `tests/02-configuration.test.js` |
| VV-CFG-015 | PB upperRowAbnormal is true | Unit | `tests/02-configuration.test.js` |
| VV-CFG-016 | BM has a formulas object with ME_ratio | Unit | `tests/02-configuration.test.js` |
| VV-CFG-017 | ME_ratio has required fields: label, numerator, denominator, precision | Unit | `tests/02-configuration.test.js` |
| VV-CFG-018 | ME_ratio numerator and denominator reference valid outCodes cell types | Unit | `tests/02-configuration.test.js` |
| VV-CFG-019 | ME_ratio numerator contains myeloid lineage cells | Unit | `tests/02-configuration.test.js` |
| VV-CFG-020 | ME_ratio denominator contains erythroid precursors | Unit | `tests/02-configuration.test.js` |
| VV-CFG-021 | PB does not have formulas (or formulas is absent) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-022 | outCodes keys are single characters (letters or punctuation) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-023 | outCodes values are non-empty strings | Unit | `tests/02-configuration.test.js` |
| VV-CFG-024 | No duplicate keys within a specimen type (HA-062) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-025 | No duplicate cell type values within a specimen type | Unit | `tests/02-configuration.test.js` |
| VV-CFG-026 | BM has exactly 14 cell types mapped to ergonomic left-hand keys (SYS-014, SYS-038) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-027 | PB has exactly 14 cell types mapped to ergonomic left-hand keys (SYS-015, SYS-039) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-028 | BM and PB outCodes are identical | Unit | `tests/02-configuration.test.js` |
| VV-CFG-029 | Each template has tplCode, tplName, and outSentence | Unit | `tests/02-configuration.test.js` |
| VV-CFG-030 | Every template contains {{total}} placeholder | Unit | `tests/02-configuration.test.js` |
| VV-CFG-031 | Every template reports every cell type, in its correct form | Unit | `tests/02-configuration.test.js` |
| VV-CFG-032 | A category outside the differential is not also reported as a percentage | Unit | `tests/02-configuration.test.js` |
| VV-CFG-033 | BM templates contain {{ME_ratio}} placeholder | Unit | `tests/02-configuration.test.js` |
| VV-CFG-034 | PB templates do not contain {{ME_ratio}} placeholder | Unit | `tests/02-configuration.test.js` |
| VV-CFG-035 | BM has 3 templates (Yale SOM, Precipio DX, MGH) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-036 | PB has 1 template (MGH) | Unit | `tests/02-configuration.test.js` |
| VV-CFG-037 | BM targetCount is 500 | Unit | `tests/02-configuration.test.js` |
| VV-CFG-038 | PB targetCount is 200 | Unit | `tests/02-configuration.test.js` |
| VV-CFG-039 | targetCount values are positive integers | Unit | `tests/02-configuration.test.js` |

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

#### VV-DOM-* — Counter markup and required elements

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-DOM-001 | counter.html exists and is readable | Static | `tests/03-html-structure.test.js` |
| VV-DOM-002 | HTML has correct doctype and lang attribute | Static | `tests/03-html-structure.test.js` |
| VV-DOM-003 | HTML includes Tailwind CSS from a local asset (URS-094) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-004 | No render-blocking asset is loaded from a third-party CDN (URS-094) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-005 | Registers a service worker for offline operation (URS-094) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-006 | HTML includes the application script mdc-app.js | Static | `tests/03-html-structure.test.js` |
| VV-DOM-007 | HTML does not include old Backbone/jQuery dependencies | Static | `tests/03-html-structure.test.js` |
| VV-DOM-008 | Case number input has maxlength="30" (SYS-002) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-009 | Case number input has autocomplete="off" (prevents browser autofill) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-010 | Specimen type select element exists with id="specimenType" | Static | `tests/03-html-structure.test.js` |
| VV-DOM-011 | Bone Marrow option with value="bm" exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-012 | Peripheral Blood option with value="pb" exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-013 | Start Count button exists and is enabled by default | Static | `tests/03-html-structure.test.js` |
| VV-DOM-014 | Count Done button exists (SYS-050) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-015 | Reset button exists (SYS-080) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-016 | Copy to Clipboard button exists (SYS-064) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-017 | New Case button exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-018 | Resume Counting button exists (btnResumeCounting) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-019 | Phase 1: Case entry section exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-020 | Phase 2: Counting section exists (hidden initially) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-021 | Phase 3: Results section exists (hidden initially) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-022 | Counter table rendering area exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-023 | Morphology comments textarea exists with id="morphComments" | Static | `tests/03-html-structure.test.js` |
| VV-DOM-024 | Comments textarea has maxlength="500" (SYS-071) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-025 | Character counter exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-026 | Tab navigation area exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-027 | Tab panels area exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-028 | Results summary area exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-029 | Session history section exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-030 | History list container exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-031 | History count badge exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-032 | Export session buttons exist | Static | `tests/03-html-structure.test.js` |
| VV-DOM-033 | Temporary data notice is present (SYS-094) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-034 | Confirmation modal overlay exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-035 | Modal has title, message, confirm, and cancel elements | Static | `tests/03-html-structure.test.js` |
| VV-DOM-036 | History detail modal exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-037 | Labels are associated with inputs via "for" attribute | Static | `tests/03-html-structure.test.js` |
| VV-DOM-038 | Status indicator elements exist | Static | `tests/03-html-structure.test.js` |
| VV-DOM-039 | Theme toggle button exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-040 | Keyboard hint text is present for users | Static | `tests/03-html-structure.test.js` |
| VV-DOM-041 | Audio toggle button exists (URS-027) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-042 | Print button exists in results phase (URS-054) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-043 | Absolute count section exists in results phase (URS-036) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-044 | Morphology checklist area exists (URS-072) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-045 | Config export button exists (URS-103) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-046 | Config import file input exists (URS-103) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-047 | Reset to Default Config button exists | Static | `tests/03-html-structure.test.js` |
| VV-DOM-048 | Print media styles are defined (URS-054) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-049 | The theme is applied before first paint, on the root element (URS-095) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-050 | Case number input field exists with id="caseNumber" (SYS-001) | Static | `tests/03-html-structure.test.js` |
| VV-DOM-051 | Case badge display element exists (SYS-004) | Static | `tests/03-html-structure.test.js` |

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

#### VV-EDT-* — Configuration editor structure

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-EDT-001 | editor.html exists | Static | `tests/10-config-editor.test.js` |
| VV-EDT-002 | config-editor.js exists | Static | `tests/10-config-editor.test.js` |
| VV-EDT-003 | editor.html is readable and non-empty | Static | `tests/10-config-editor.test.js` |
| VV-EDT-004 | Has correct doctype and lang | Static | `tests/10-config-editor.test.js` |
| VV-EDT-005 | Includes Tailwind CSS from a local asset (URS-094) | Static | `tests/10-config-editor.test.js` |
| VV-EDT-006 | References config-editor.js | Static | `tests/10-config-editor.test.js` |
| VV-EDT-007 | Has cell reference panel | Static | `tests/10-config-editor.test.js` |
| VV-EDT-008 | Has drop zones for upper and lower rows | Static | `tests/10-config-editor.test.js` |
| VV-EDT-009 | Has key assignment area | Static | `tests/10-config-editor.test.js` |
| VV-EDT-010 | Has settings inputs | Static | `tests/10-config-editor.test.js` |
| VV-EDT-011 | Has template editor | Static | `tests/10-config-editor.test.js` |
| VV-EDT-012 | Has live preview | Static | `tests/10-config-editor.test.js` |
| VV-EDT-013 | Has save/load buttons | Static | `tests/10-config-editor.test.js` |
| VV-EDT-014 | Has back link to counter | Static | `tests/10-config-editor.test.js` |
| VV-EDT-015 | Has specimen tabs area | Static | `tests/10-config-editor.test.js` |
| VV-EDT-016 | Has morphology checklist editor | Static | `tests/10-config-editor.test.js` |
| VV-EDT-017 | config-editor.js has valid syntax | Static | `tests/10-config-editor.test.js` |
| VV-EDT-018 | Uses strict mode | Static | `tests/10-config-editor.test.js` |
| VV-EDT-019 | Wraps in IIFE | Static | `tests/10-config-editor.test.js` |
| VV-EDT-020 | Defines CELL_REFERENCE array | Static | `tests/10-config-editor.test.js` |
| VV-EDT-021 | Defines editorState object | Static | `tests/10-config-editor.test.js` |
| VV-EDT-022 | Has drag-and-drop support | Static | `tests/10-config-editor.test.js` |
| VV-EDT-023 | Has buildConfigJSON function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-024 | Has renderCellReference function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-025 | Has renderLayout function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-026 | Has renderKeyAssignment function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-027 | Has updatePreview function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-028 | Has loadExistingConfig function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-029 | Escapes HTML in output | Static | `tests/10-config-editor.test.js` |
| VV-EDT-030 | Defines ERGO_ZONES constant | Static | `tests/10-config-editor.test.js` |
| VV-EDT-031 | Defines autoAssignKeys function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-032 | Defines resetAllKeys function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-033 | Defines isInErgoZone function | Static | `tests/10-config-editor.test.js` |
| VV-EDT-034 | Has listeningCell state for click-to-assign | Static | `tests/10-config-editor.test.js` |
| VV-EDT-035 | Has keydown listener for key assignment | Static | `tests/10-config-editor.test.js` |
| VV-EDT-036 | Defines startListening and stopListening functions | Static | `tests/10-config-editor.test.js` |
| VV-EDT-037 | Has Reset All Keys button | Static | `tests/10-config-editor.test.js` |
| VV-EDT-038 | Has Auto-Assign Left Hand button | Static | `tests/10-config-editor.test.js` |
| VV-EDT-039 | Has Auto-Assign Right Hand button | Static | `tests/10-config-editor.test.js` |
| VV-EDT-040 | Has CSS for listening state animation | Static | `tests/10-config-editor.test.js` |

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
| VV-ME-010 | The interval is the odds transform of the Wilson interval | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-011 | The same ratio is far less precise at a smaller count | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-012 | A ratio is much less precise than the percentages behind it | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-013 | With no erythroid cells the upper bound is unbounded, not an error | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-014 | With no myeloid cells the bound is shown, not rounded to zero | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-015 | Undefined and non-ratio cases return null rather than throwing | Unit | `tests/01-calculation-engine.test.js` |
| VV-ME-016 | The interval narrows monotonically as the count grows | Unit | `tests/01-calculation-engine.test.js` |

#### VV-PRE-* — Preset catalogue integrity

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-PRE-001 | Presets directory exists | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-002 | Preset file exists: consensus-14.json | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-003 | consensus-14.json is valid JSON | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-004 | consensus-14.json has required v2 wrapper fields | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-005 | consensus-14.json specimen types have required fields | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-006 | consensus-14.json outCodes values match category cell types (except custom) | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-007 | consensus-14.json has no duplicate outCode keys per specimen | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-008 | consensus-14.json left-hand preset keys are within left ergonomic zone | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-009 | The right-hand key layout is still reachable, as an editor action | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-010 | consensus-14 has 14 cell types per specimen | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-011 | minimal-5 has 5 cell types | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-012 | Handedness remains a per-profile field | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-013 | body-fluid has bf specimen type | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-014 | body-fluid has morphology checklist items | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-015 | harmonized-9 has constituents defined | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-016 | custom preset has empty categories | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-017 | consensus-14.json excludes NRBC from any non-marrow differential | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-018 | A preset sharing the built-in profileId is the built-in profile | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-019 | No two presets are the same layout with the same keys | Unit | `tests/09-preset-catalog.test.js` |
| VV-PRE-020 | Every selectable preset configures confidence intervals (P0-9) | Unit | `tests/09-preset-catalog.test.js` |

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

#### VV-SAV-* — Autosave and crash recovery (static)

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-SAV-001 | saveAutosaveState function is defined | Static | `tests/07-autosave.test.js` |
| VV-SAV-002 | loadAutosaveState function is defined | Static | `tests/07-autosave.test.js` |
| VV-SAV-003 | clearAutosaveState function is defined | Static | `tests/07-autosave.test.js` |
| VV-SAV-004 | showRecoveryModal function is defined | Static | `tests/07-autosave.test.js` |
| VV-SAV-005 | restoreAutosaveState function is defined | Static | `tests/07-autosave.test.js` |
| VV-SAV-006 | Uses localStorage with wbcds_autosave key | Static | `tests/07-autosave.test.js` |
| VV-SAV-007 | Uses localStorage (not sessionStorage) for autosave | Static | `tests/07-autosave.test.js` |
| VV-SAV-008 | Saves caseNumber in autosave state | Static | `tests/07-autosave.test.js` |
| VV-SAV-009 | Saves specimenType in autosave state | Static | `tests/07-autosave.test.js` |
| VV-SAV-010 | Saves counts in autosave state | Static | `tests/07-autosave.test.js` |
| VV-SAV-011 | Saves timestamp in autosave state | Static | `tests/07-autosave.test.js` |
| VV-SAV-012 | Saves phase in autosave state | Static | `tests/07-autosave.test.js` |
| VV-SAV-013 | Saves morphologyComments in autosave state | Static | `tests/07-autosave.test.js` |
| VV-SAV-014 | Autosave is called after keypress in onKeyDown | Static | `tests/07-autosave.test.js` |
| VV-SAV-015 | Autosave is cleared on finalizeCount | Static | `tests/07-autosave.test.js` |
| VV-SAV-016 | Autosave is cleared on resetToStart | Static | `tests/07-autosave.test.js` |
| VV-SAV-017 | Recovery check happens during init | Static | `tests/07-autosave.test.js` |
| VV-SAV-018 | Recovery modal offers Restore and Discard options | Static | `tests/07-autosave.test.js` |

#### VV-SCH-* — v2 configuration schema

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-SCH-001 | Config is in v2 object format | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-002 | Has a dotted profile version | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-003 | Has profileId field | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-004 | Has profileName field | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-005 | Has specimenTypes array | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-006 | Each entry has specimenLabel | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-007 | BM specimenLabel is "Bone Marrow" | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-008 | PB specimenLabel is "Peripheral Blood" | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-009 | Each entry has audio object | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-010 | Audio config has enabled boolean | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-011 | Audio config has sound type strings | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-012 | Each entry has autosave boolean | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-013 | Each entry has absoluteCounts string | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-014 | Each entry has handedness string | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-015 | Each entry has constituents object (may be empty) | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-016 | Each entry has morphologyChecklist array (may be empty) | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-017 | normalizeConfig accepts the legacy bare-array format | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-018 | normalizeConfig accepts the v2 envelope and preserves its metadata | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-019 | validateConfig rejects a cell type that shadows a template placeholder | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-020 | Every reserved placeholder name is rejected as a cell type | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-021 | No shipped profile uses a reserved placeholder as a cell type | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-022 | normalizeConfig rejects a structure that is neither format | Unit | `tests/08-config-schema-v2.test.js` |
| VV-SCH-023 | JS loadConfig uses cache-first strategy | Unit | `tests/08-config-schema-v2.test.js` |

#### VV-SRC-* — Application source integrity (static)

| ID | Verifies | Layer | File |
|----|----------|-------|------|
| VV-SRC-001 | mdc-app.js exists and is readable | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-002 | mdc-app.js has valid syntax (no parse errors) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-003 | Uses strict mode | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-004 | Wraps in IIFE to avoid global namespace pollution | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-005 | State object initializes phase to "case-entry" | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-006 | State tracks isCountingActive flag | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-007 | State tracks commentFieldFocused flag (SYS-073) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-008 | Has keydown event handler function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-009 | Checks isCountingActive before processing keypresses (HA-015) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-010 | Ignores keypresses when comment field is focused (SYS-073) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-011 | Ignores Ctrl, Alt, Meta modifier keys (SYS-036) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-012 | Checks shiftKey for decrement operation (SYS-032) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-013 | Prevents event default on mapped keys | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-014 | Detaches keydown listener on count completion (SYS-054) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-015 | Has decrement guard: count > 0 check | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-016 | Decrement uses -- operator (subtracts exactly 1) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-017 | Increment uses ++ operator (adds exactly 1) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-018 | Checks total === 0 before percentage calculation | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-019 | Returns 0.00 when total is 0 (not NaN) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-020 | References targetCount from config | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-021 | Applies the evidence-based default target when a profile omits it (URS-105) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-022 | An explicit targetCount is never overridden by the default | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-023 | Shows confirmation before reset when data exists | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-024 | Checks if total > 0 before showing confirmation | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-025 | Uses navigator.clipboard API | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-026 | Has fallback for clipboard API failure | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-027 | Shows "Copied!" confirmation text (SYS-066) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-028 | Clears clipboard on new case start | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-029 | Case input has keydown listener for Enter key (SYS-009) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-030 | Enter key triggers btnStart.click() when not disabled | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-031 | Enter key calls preventDefault to avoid form submission | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-032 | Uses sessionStorage for history (SYS-095) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-033 | Uses localStorage for config caching and autosave (URS-106, URS-085) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-034 | Saves to sessionStorage with a key prefix | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-035 | Has try/catch around sessionStorage operations (graceful degradation) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-036 | Defines export handlers for CSV and JSON | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-037 | Creates downloadable files using Blob and object URLs | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-038 | Defines theme toggle controls and storage key | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-039 | Applies data-theme attribute for light/dark modes | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-040 | Escapes HTML in user-provided content (XSS prevention) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-041 | The HTML escaper neutralizes every markup-significant character | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-042 | Template sanitization keeps formatting tags and drops everything else | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-043 | Fetches templates.json | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-044 | Handles fetch failure with error display (SYS-101) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-045 | Loads wbc-core.js before mdc-app.js so the engine is available | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-046 | No control is wired from an inline script outside the app module | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-047 | Has flash/animation function for keypress feedback | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-048 | Distinguishes increment and decrement visually | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-049 | Defines resumeCounting function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-050 | References btnResumeCounting button | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-051 | Defines computeMERatio function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-052 | Handles ME_ratio placeholder in templates | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-053 | Defines AudioEngine object | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-054 | AudioEngine has all required sound methods | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-055 | Defines autosave functions | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-056 | Defines recovery modal function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-057 | Defines switchSpecimenType function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-058 | Defines config cache functions | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-059 | Uses wbcds_config localStorage key | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-060 | loadConfig uses cache-first strategy (user config persists) | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-061 | Defines resetConfigToDefault function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-062 | resetConfigToDefault removes cache and reloads | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-063 | importConfig caches the imported config | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-064 | Defines normalizeConfig function for backward compat | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-065 | Handles both array and object config formats | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-066 | Defines export and import functions | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-067 | Defines validateConfig function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-068 | Defines populateSpecimenSelect function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-069 | Uses specimenLabel from config | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-070 | Defines renderAbsoluteCountsSection function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-071 | Defines renderMorphologyChecklist function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-072 | Defines buildMorphologyOutput function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-073 | Defines printResults function | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-074 | mdc-app.js calls no native dialog | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-075 | Both pages load the shared dialog module | Static | `tests/04-javascript-integrity.test.js` |
| VV-SRC-076 | The dialog is a cached shell asset | Static | `tests/04-javascript-integrity.test.js` |

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
| VV-SYS-194 | A profile with audio disabled starts silent | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-195 | A profile with audio enabled starts with sound | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-196 | The operator overrides the profile, in both directions | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-197 | Each row subtotal equals the sum of the cells displayed in it | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-198 | The same holds at two decimal places | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-199 | Session history reports at the precision the count used | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-200 | Removing a category removes what depended on it | System | `tests-e2e/config-and-offline.spec.js` |
| VV-SYS-201 | The displayed ratio is accompanied by its interval | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-202 | The same ratio at a tenth of the count reads far less precisely | System | `tests-e2e/input-integrity.spec.js` |
| VV-SYS-203 | A profile with intervals disabled shows none | System | `tests-e2e/input-integrity.spec.js` |

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

## 5. Validation Protocol

### 5.1 Validation Objective

Demonstrate that WBC ΔΣ v2.0 meets user needs as defined in URS-001 v2.0 when used by representative clinical users in a simulated clinical environment.

### 5.2 Validation Participants

| Role | Count | Qualification |
|------|-------|--------------|
| Medical Technologist (MLS/MT) | 2 | ASCP certified, >1 year differential counting experience |
| Pathologist / Hematopathologist | 1 | Board certified, performs differential review |
| Hematology Fellow | 1 | PGY-1+ in hematopathology |

### 5.3 Validation Environment

- Standard laboratory workstation
- Microscope with WBC smear slide (or simulated via predefined count script)
- Chrome browser (current version)
- Application deployed on Node.js static server (serve.js) on port 8089

### 5.4 Validation Scenarios

#### Scenario V1: Normal Bone Marrow Differential (Happy Path)

**Objective**: Validate complete BM counting workflow from case entry to output copy with 14-cell unified model.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Enter case number "BM25-00100" | Case field accepts input. Start Count already enabled. | URS-001, URS-004 |
| 2 | Verify specimen type is Bone Marrow | BM selected by default. 14 cell types in two-row layout displayed. | URS-010, URS-012 |
| 3 | Click Start Count | Instructions update. Keyboard active. Progress indicator shows "0 / 500 (500)". | URS-020, URS-028 |
| 4 | Count 500 cells using 14 keyboard keys (R,L,O,M,T,C,S,B,P,A,E,N,Y,X) | Counts and percentages update in real time. Total reaches 500. M:E ratio displays live. Subtotals update. | URS-020-024, URS-030-031, URS-035 |
| 5 | Intentionally miscount: press wrong key, then Shift+key to correct | Decrement works. Count adjusts. M:E ratio updates. | URS-025-026 |
| 6 | Click Count Done | No informational note (500 >= 500 advisory target). Output appears with M:E ratio. | URS-040-041, URS-050 |
| 7 | Verify case number in output | "BM25-00100" in all tabs. | URS-052 |
| 8 | Copy output to clipboard and paste | Output text matches display. M:E ratio included. | URS-055 |
| 9 | Enter new case number | Confirmation dialog. Data cleared. | URS-003 |

**User Assessment Questions (post-scenario)**:
1. Was the counting workflow intuitive? (1-5 scale)
2. Were the 14 keyboard mappings easy to learn? (1-5)
3. Was the two-row layout (precursors/mature) helpful? (1-5)
4. Was the M:E ratio display useful? (1-5)
5. Was the undo (Shift+key) mechanism intuitive? (1-5)
6. Was the output format useful for your workflow? (1-5)
7. Any features missing that you would need? (free text)

#### Scenario V2: Peripheral Blood with Suboptimal Count

**Objective**: Validate PB workflow and advisory target non-blocking note.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Enter case "PB25-00050" | Case accepted. Start Count enabled. | URS-001 |
| 2 | Select Peripheral Blood | PB table shown. Same 14 cell types as BM. Upper row flagging active. | URS-010, URS-012 |
| 3 | Count 50 cells | Counts/percentages update. Progress shows "50 / 200 (200)". | URS-020-024 |
| 4 | Click Count Done | Non-blocking informational note: count below 200 advisory target. Output generated directly. | URS-041 |
| 5 | Verify upper row flagging | Any non-zero precursor cells in PB display amber border. | URS-096 |
| 6 | Verify output includes case number and total | "PB25-00050" and "50" in output. | URS-052-053 |

#### Scenario V3: Accidental Reset Protection

**Objective**: Validate data protection during reset.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Enter case. Count 100 cells. | Active count in progress. | |
| 2 | Click Reset | Confirmation dialog appears. | URS-061 |
| 3 | Click Cancel | All data preserved. | URS-061 |
| 4 | Click Reset again, confirm OK | All data cleared. Focus on case input. Start Count remains enabled. | URS-060, URS-063 |

#### Scenario V4: Morphology Comments

**Objective**: Validate comments do not interfere with counting and appear in output.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Start counting | Keyboard active for counting. | |
| 2 | Click in morphology comments field | Focus moves to textarea. | URS-070 |
| 3 | Type "Auer rods seen in blasts." | Text appears in field. No cell counts change. | URS-070 |
| 4 | Click outside comments field | Keyboard counting resumes. | |
| 5 | Complete count and generate output | Comments included in output text. | URS-071 |

#### Scenario V5: Continue Counting Workflow

**Objective**: Validate that a completed count can be resumed with tallies preserved and additional cells counted.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Enter case "BM25-00200". Select BM. Start Count. | Counting phase begins. | URS-001, URS-020 |
| 2 | Count 400 cells across 14 types. | Tallies update. Progress "400 / 500 (500)". | URS-020-024 |
| 3 | Click Count Done. | Informational note (400 < 500 advisory). Output generated. | URS-041 |
| 4 | Review output. Note M:E ratio. | Output correct for 400 cells. | URS-050 |
| 5 | Click Continue Counting. | Returns to counting. All tallies preserved (400 cells). Keyboard active. | URS-042 |
| 6 | Count 100 more cells. | Total reaches 500. Progress "500 / 500 (500)". | URS-020 |
| 7 | Click Count Done again. | No informational note (500 >= 500). Updated output with 500 cells. | URS-041 |
| 8 | Verify output totals and percentages reflect all 500 cells. | Correct cumulative output. M:E ratio updated. | URS-050, URS-035 |
| 9 | Verify comments preserved throughout. | Comments entered before first finalization still present. | URS-073 |

#### Scenario V6: M:E Ratio Verification

**Objective**: Validate M:E ratio computation and display for clinical accuracy.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Select BM. Start Count. | M:E ratio display present (N/A initially). | URS-035 |
| 2 | Press 'R' x 100 (nrbc=100). | M:E ratio = "0.0:1" (no myeloid cells). | URS-035 |
| 3 | Press 'P' x 300 (poly=300). | M:E ratio updates to reflect myeloid/erythroid = 300/100 = 3.0:1. | URS-035 |
| 4 | Press 'L' x 50 (blasts=50). | M:E ratio updated to reflect new myeloid total. | URS-035 |
| 5 | Click Count Done. Check output. | M:E ratio in output matches live display. | URS-035, URS-050 |
| 6 | Select PB. Start new count. | M:E ratio not displayed for PB. | URS-035 |

### 5.5 Validation Acceptance Criteria

| Criterion | Threshold | Method |
|-----------|-----------|--------|
| All critical workflow steps complete without error | 100% | Observation |
| User satisfaction ratings average >= 3.5 / 5 | >= 3.5 | Questionnaire |
| No data integrity errors observed | Zero | Observation + output review |
| All safety features function as designed | 100% | Observation |
| Output is usable for clinical documentation | Unanimous agreement | Clinical user judgment |
| M:E ratio matches manual calculation | 100% | Cross-check |
| Continue Counting preserves data integrity | 100% | Observation |

### 5.6 Validation Report Template

| Section | Content |
|---------|---------|
| Participants | Names, roles, qualifications |
| Environment | Hardware, software, browser versions |
| Scenarios Executed | List with pass/fail per step (V1-V6) |
| Observations | Notable findings, user feedback |
| Deviations | Any departures from protocol |
| Questionnaire Results | Aggregated ratings and comments |
| Conclusion | Accept / Conditional Accept / Reject |
| Signatures | All participants + QA |

---

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - V&V protocol |
| D | 2026-08-06 | QMS | **v3.0 — re-issued.** Sections 3 and 4 replaced by a register generated from the test runners. The hand-maintained vector tables and the SRS-to-TC-0xx system verification table are withdrawn: 98 of 111 identifiers cited by RTM-001 and TR-001 existed in no protocol document, and none of TP-001's TC-0xx numbers appeared in any test file. Requirement tracing lives in RTM-001 §5. Guarded by suite 14 (QC-004, QC-005). See DCR-018. |
| C | 2026-08-06 | QMS | SYS-113 and SYS-114 added to the system verification table, covering rendered contrast in both themes and theme application before first paint. Verified by VV-SYS-160..168 (`tests-e2e/contrast-sweep.spec.js`). See DCR-011 and RA-001 HA-098. |
| B | 2026-02-24 | QMS | v2.0 - Major update: 14-cell vectors (nrbc,blasts,pro,myelo,meta,plasma,mast,bands,poly,baso,eos,mono,lymph,other), M:E ratio verification (VV-ME-001 to 004), updated key references ('L' for blasts), 14-key E2E test, Continue Counting checkpoint, VV-TPL-006 for M:E in output, advisory target (non-blocking), validation scenarios V5 (Continue Counting) and V6 (M:E ratio), updated system verification table with new SYS IDs, Node.js test environment |

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| V&V Lead | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Clinical Reviewer | | | |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
