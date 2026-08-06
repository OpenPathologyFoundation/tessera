# RA-001: Risk Analysis - Failure Mode and Effects Analysis (FMEA)

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | RA-001 |
| **Version** | 2.9 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-08-04 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 v2.0 Rev E, SRS-001 v2.1, SAD-001 v2.0, SDD-001 v2.0 |
| **Change Record** | DCR-004 |
| **Risk Standard** | ISO 14971:2019 - Application of Risk Management to Medical Devices |

---

## 1. Purpose

This document identifies potential failure modes of WBC ΔΣ, assesses their effects on patient safety and clinical workflow, evaluates risk levels, and defines mitigation controls. The analysis covers software hazards, user interaction hazards, and data integrity hazards.

## 2. Scope

This FMEA covers all software functionality described in the SRS and SDD, focusing on hazards that could lead to:
- Incorrect differential count results
- Misidentification of patient/specimen
- Loss of count data
- Reporting errors

## 3. Risk Assessment Methodology

### 3.1 Severity Rating (S)

| Rating | Level | Definition | Clinical Impact |
|--------|-------|------------|-----------------|
| 1 | Negligible | No impact on patient care | Minor inconvenience only |
| 2 | Minor | Minimal impact, easily detected and corrected | Delays in reporting, no treatment impact |
| 3 | Moderate | Could affect clinical decisions if undetected | Incorrect differential requiring repeat count |
| 4 | Serious | Direct impact on clinical decisions | Incorrect diagnosis or treatment plan |
| 5 | Critical | Potential for patient harm | Misdiagnosis leading to inappropriate therapy or missed malignancy |

### 3.2 Probability of Occurrence (O)

| Rating | Level | Definition |
|--------|-------|------------|
| 1 | Remote | < 1 in 100,000 uses |
| 2 | Unlikely | 1 in 10,000 to 1 in 100,000 |
| 3 | Occasional | 1 in 1,000 to 1 in 10,000 |
| 4 | Probable | 1 in 100 to 1 in 1,000 |
| 5 | Frequent | > 1 in 100 uses |

### 3.3 Detectability (D)

| Rating | Level | Definition |
|--------|-------|------------|
| 1 | Certain | Error will always be detected before harm |
| 2 | High | Error is very likely to be detected |
| 3 | Moderate | Error may or may not be detected |
| 4 | Low | Error is unlikely to be detected |
| 5 | None | Error cannot be detected by normal means |

### 3.4 Risk Priority Number (RPN)

**RPN = S x O x D**

| RPN Range | Risk Level | Action Required |
|-----------|-----------|-----------------|
| 1-15 | Low | Monitor, no immediate action required |
| 16-49 | Medium | Implement risk reduction if reasonably practicable |
| 50-74 | High | Risk reduction required before release |
| 75-125 | Critical | Risk reduction mandatory; design change required |

---

## 4. FMEA Table

### 4.1 Patient/Specimen Identification Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-001 | Count performed without case/accession number | Results cannot be traced to patient; result applied to wrong patient | 5 | User does not enter case number; case number not required by default configuration | 4 | **None (current design)** | 5 | **100** | **Critical** | URS-004/SYS-003: Case number is configurable per institutional profile (default: not required). Physical context at the microscope identifies the specimen. Institutions requiring traceability can set `requireCaseNumber: true`. SYS-004: Prominent case display when entered. SYS-067: Output handles absent case number gracefully. | 5x3x3 = **45** (Medium). **Accepted** by design — stakeholder feedback confirms physical context identifies specimen; forcing case number kills adoption. |
| HA-002 | Wrong case number entered | Results attributed to wrong patient | 5 | Operator transcription error | 3 | Human verification against slide label | 3 | **45** | **Medium** | SYS-004: Persistent case number display for continuous verification. SOP instruction to verify against slide label. | 5x3x2 = **30** (Medium) |
| HA-003 | Data from previous case carries over to new case | Contaminated result: percentages reflect two different patients | 5 | Application does not clear data on case change | 3 | **None (current design - page reload is the only reset)** | 4 | **60** | **High** | SYS-006: Automatic data clear on case number change with confirmation. SYS-082: Complete state reset (including case number field clear). | 5x1x1 = **5** (Low) |
| HA-004 | Case number not included in output | Printed/pasted result not traceable to patient | 4 | Output templates do not include case number placeholder | 3 | **None (current design)** | 3 | **36** | **Medium** | SYS-067: Case number is first element in all output text when present. Template schema requires {{caseNumber}}. Output handles absent case number gracefully. | 4x1x1 = **4** (Low) |

### 4.2 Counting Accuracy Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-010 | Keypress registers to wrong cell type | Incorrect differential percentages | 4 | Key mapping error in configuration; key mapping display mismatch | 2 | Configuration loaded from verified JSON file | 3 | **24** | **Medium** | SYS-038: Unified verified key mappings (same keys for BM and PB). TP-TC-030: Key mapping verification tests for every key. Note: unified mapping across specimen types reduces risk of mode-dependent confusion. | 4x1x1 = **4** (Low) |
| HA-011 | Keypress not registered (missed count) | Undercounting of a cell type; skewed percentages | 3 | Rapid typing outpacing event loop; key debounce issue | 3 | **None (no feedback for missed keys)** | 4 | **36** | **Medium** | SYS-037: Visual flash feedback on each keypress. SYS-P02: <50ms keypress-to-update latency requirement. | 3x2x2 = **12** (Low) |
| HA-012 | Double keypress registers (extra count) | Overcounting of a cell type; skewed percentages | 3 | Key repeat from held key; bounce on mechanical keyboard | 3 | None | 3 | **27** | **Medium** | SYS-032: Shift+key decrement allows correction. Keyboard repeat is OS-controlled; documented in SOP. | 3x2x2 = **12** (Low) |
| HA-013 | Unable to correct a miscount (no undo) | Operator must restart count or accept inaccurate result | 4 | **No decrement function exists in current design** | 5 | **None** | 1 | **20** | **Medium** | SYS-032: Shift+key decrement. SYS-033: Floor at zero. | 4x1x1 = **4** (Low) |
| HA-014 | Count performed on wrong specimen type (BM vs PB) | Wrong specimen type selection has lower impact since unified keyboard mapping means the same 14 cell types are counted regardless of specimen type | 5 | Operator selects wrong specimen type; specimen type changes mid-count | 2 | Dropdown selector visible on screen | 3 | **30** | **Medium** | SYS-016/017 (revised v2.1): the selector is no longer locked — URS-010 requires selection *during* counting — but a mid-count change raises a confirmation naming both specimen types, and the in-progress count is saved to session history rather than discarded. SYS-004: specimen type displayed alongside the case number at all times. SYS-027: upper-row flagging cues PB mode. Unified cell types limit downstream impact: percentages remain valid for the cells actually counted. | 5x1x2 = **10** (Low). Control changed, rating unchanged: the new path is deliberate and confirmed, and it removes the data-loss branch the lock created. |
| HA-015 | Counting continues after operator intends to stop | Extra cells counted, changing percentages | 3 | Accidental keypresses after mentally completing count | 4 | None | 3 | **36** | **Medium** | SYS-054: Detach keydown listener on Count Done. SYS-055: Lock inputs to readonly. | 3x1x2 = **6** (Low) |

### 4.3 Calculation Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-020 | Percentage calculation error | Incorrect differential percentages reported | 5 | Software bug in calcPercent(); floating point error | 2 | Algorithm is straightforward division | 2 | **20** | **Medium** | SYS-040-045: Defined calculation algorithm. VV-001: Comprehensive calculation verification with known inputs/outputs. | 5x1x1 = **5** (Low) |
| HA-021 | Division by zero (total = 0) | Application crash; NaN/Infinity displayed | 3 | calcPercent called before any cells counted | 3 | **Current code does not guard against this** | 2 | **18** | **Medium** | SYS-042: Explicit guard - return 0.00 when total is 0. TP-TC-040: Boundary test case. | 3x1x1 = **3** (Low) |
| HA-022 | Percentages do not sum to 100% | Loss of clinical confidence; appears to be a calculation error | 2 | Floating point rounding accumulation | 4 | None | 2 | **16** | **Medium** | SYS-044 (implemented v2.1): largest-remainder distribution makes the displayed and reported differentials sum to **exactly** 100 at their own precision, with every category held within one unit of the last decimal place. | 2x1x2 = **4** (Low). **Corrected from v2.0.** The v2.0 residual of 8 assumed a rounding adjustment that did not exist in the code (DCR-004 D-03); the true v2.0 residual was the unmitigated 16. O reduced to Remote on the strength of an exact-sum mathematical guarantee verified over 2 000 randomised differentials at both precisions (VV-CALC-019/020). |
| HA-023 | Total count is incorrect | All percentages based on wrong denominator | 5 | Sum logic error; DOM query returns wrong elements | 1 | Total is visible and intuitive to verify | 2 | **10** | **Low** | SYS-025: Total defined as arithmetic sum. TP-TC-034: Total calculation tests. | 5x1x1 = **5** (Low) |
| HA-024 | Output percentages differ from table percentages | Discrepancy between what operator sees and what is reported | 4 | mkOutTplJson uses separate calculation from calcPercent | 2 | Operator can visually compare table and output | 3 | **24** | **Medium** | SDD: Both functions use same formula. VV-001: Cross-verification test comparing table and output values. | 4x1x2 = **8** (Low) |

### 4.4 Count Validity Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-030 | Count finalized with too few cells | Statistically invalid differential; misleading percentages | 4 | Operator clicks Count Done prematurely; inadequate specimen | 4 | **None (current design has no minimum check)** | 4 | **64** | **High** | SYS-052/053: advisory target count displayed via progress indicator, non-blocking note below target. SYS-120/121: progress shown in real time. SYS-057/058: Continue Counting adds cells after reviewing interim results. **SYS-190–195 (v2.3):** every reported percentage now carries a binomial confidence interval, and the sub-target advisory states a computed interval rather than a general caution. | 4x3x1 = **12** (Low). **Re-scored under DCR-007.** Detection improves from Low to Certain: the imprecision is no longer something the operator must infer from the cell count, it is printed beside each percentage. Occurrence is unchanged — the target remains advisory by design, per URS-041. |
| HA-031 | Count modified after finalization | Reported result no longer matches output | 4 | Inputs remain editable after Count Done | 3 | **None (current design does not lock inputs)** | 4 | **48** | **Medium** | SYS-055: Set all inputs to readonly after Count Done. SYS-054: Detach keydown listener. | 4x1x2 = **8** (Low) |

### 4.5 Data Loss Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-040 | Accidental reset destroys active count | Complete loss of counting work | 3 | User accidentally clicks Reset; no confirmation | 4 | **None (current design - page reload with no warning)** | 1 | **12** | **Low** | SYS-081: Confirmation dialog before reset. | 3x1x1 = **3** (Low) |
| HA-041 | Browser tab/window closed during counting | Loss of in-progress count | 3 | Accidental close; system crash; browser update | 3 | None (no autosave) | 1 | **9** | **Low** | SYS-145–SYS-149 (specified v2.1): the in-progress count is written to localStorage after every keystroke and offered for restore on relaunch. SYS-095: session history backs up completed counts. | 3x1x1 = **3** (Low). O reduced from Occasional to Remote: an interrupted count is now recoverable rather than lost. Autosave was shipping in v2.0 but carried no system requirement and no verification; it is now specified and verified behaviourally and through a real browser reload (TC-B050–B055, VV-SYS-080–082). |
| HA-043 | Corrupted or hand-edited autosave record restored | Counts silently wrong: a negative value inverts a category and corrupts every percentage denominator | 5 | localStorage corruption; manual edit; a profile change between sessions leaving an unknown specimen type | 1 | **None** — restored counts bypass the keyboard handler's decrement guard | 4 | **20** | **Medium** | SYS-149: restore is refused when the saved specimen type is not defined in the active profile. Restored counts are coerced to non-negative integers and unknown cell types dropped before use. | 5x1x1 = **5** (Low). Verified by VV-CALC-024/025/028 and TC-B053/B076. |
| HA-042 | Output not copied before starting new case | Previous result lost before documentation | 3 | User forgets to copy/paste output | 3 | **None (no copy button exists in current design)** | 3 | **27** | **Medium** | SYS-064/065: Copy to Clipboard button. SYS-090: Session history retains completed outputs. | 3x2x2 = **12** (Low) |

### 4.6 Output/Reporting Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-050 | Output template renders incorrectly | Garbled or missing data in report | 3 | Handlebars template syntax error; placeholder mismatch | 2 | Templates tested during development | 2 | **12** | **Low** | SYS-100-102: Schema validation. TP-TC-060: Template rendering tests. | 3x1x1 = **3** (Low) |
| HA-051 | Wrong template output copied to LIS | Result in wrong institutional format | 2 | Operator copies from wrong tab | 3 | Tabs are labeled; operator should verify | 2 | **12** | **Low** | SYS-063: Tab labels with favicons. Copy button is per-tab. | 2x3x2 = **12** (Low) |
| HA-052 | Morphology comments not included in output | Critical morphology findings omitted from report | 3 | Comments field not connected to output templates | 3 | **None (comments field does not exist in current design)** | 3 | **27** | **Medium** | SYS-072: Comments appended to output. TP-TC-070: Comments in output test. | 3x1x2 = **6** (Low) |

### 4.7 Configuration Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-060 | templates.json fails to load | Application non-functional | 3 | Server error; file missing; network issue | 2 | Backbone fetch error callback exists | 2 | **12** | **Low** | SYS-101/SYS-107/SYS-109: an invalid saved profile falls back to the built-in default automatically, and a total failure presents a recovery control that clears the cache. | 3x1x1 = **3** (Low). **Corrected from v2.0.** The v2.0 residual of 6 did not account for the cached-profile path: a corrupt saved profile produced a terminal error screen with no in-application escape, because the only recovery control was itself inert (DCR-004 D-01/D-02). Verified by TC-B073/B074. |
| HA-061 | templates.json contains invalid data | Unexpected behavior; wrong cell types; crashes | 4 | Manual edit error; file corruption | 2 | None (no schema validation) | 3 | **24** | **Medium** | SYS-102/103/SYS-104: structural validation now runs on load, on import and in the configuration editor, and names every reason for rejection. | 4x1x1 = **4** (Low). **Corrected from v2.0.** The v2.0 residual of 8 credited validation that ran only on import and checked presence of fields, not their consistency. D improves to Certain: an invalid profile is now refused with its reasons listed rather than silently applied (TC-B063, VV-SYS-052, VV-SYS-061). |
| HA-062 | Key mapping in config conflicts (two cells same key) | One cell type overwritten; never counted | 5 | Configuration editing error | 1 | None | 3 | **15** | **Low** | SYS-104 (implemented v2.1): validation rejects a cell type mapped to more than one key, a category with no key, and a duplicate category. The editor refuses to activate such a profile. | 5x1x1 = **5** (Low). Rating unchanged but **now supported** — the v2.0 residual credited a duplicate-key check that did not exist in the code (DCR-004 D-11). |

| HA-063 | A superseded configuration profile stays in use after a corrected one is published | Laboratory continues counting with a profile known to be defective — wrong key mapping, wrong target, wrong template — with no indication anything is stale | 4 | Cached profile always takes precedence; no version comparison; nothing surfaces the active version | 3 | **None** | 4 | **48** | **Medium** | SYS-108: a built-in profile carrying the same profileId at a newer version supersedes the cache and the operator is told. A profile with a different ID (an institution's own) is never overwritten. SYS-160–163: profile ID and version appear on the results screen and in every export, so the version in force is auditable after the fact. | 4x1x2 = **8** (Low). Verified by TC-B070/B071 and VV-SYS-054. |
| HA-064 | A cell type is named the same as a report placeholder | The placeholder is shadowed: `{{total}}` renders that category's percentage instead of the cell count, so every report from the profile carries a wrong number that looks plausible | 4 | Configuration author names a category `total`, `comments`, `caseNumber`, etc. | 1 | **None** | 4 | **16** | **Medium** | SYS-104: validation rejects any cell type matching a reserved placeholder name and lists the reserved set. | 4x1x1 = **4** (Low). Verified by suite 08 reserved-name tests, including a check that no shipped profile uses one. |

### 4.8 M:E Ratio and Continue Counting Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-070 | M:E ratio displays incorrect value | Incorrect myeloid-to-erythroid ratio reported in output; could affect interpretation of marrow cellularity | 3 | Software bug in formula engine; incorrect config formula definition | 2 | M:E ratio is secondary to differential percentages; pathologist reviews in context | 2 | **12** | **Low** | SYS-046: Formula engine defined. VV tests verify M:E computation with known inputs. Config schema validates formula definition. "N/A" displayed when denominator is zero. | 3x1x1 = **3** (Low) |
| HA-071 | Counts altered or lost when resuming from results to counting | Final differential percentages differ from what operator verified in results | 4 | Software bug in resume function; state serialization error | 2 | Resume function preserves counts in memory; no serialization boundary | 2 | **16** | **Medium** | SYS-057/058: Continue Counting preserves all tallies. Test VV-E2E verifies count preservation across resume cycle. UI displays restored counts for operator verification. | 4x1x2 = **8** (Low) |
| HA-072 | M:E ratio displays error/crash when no erythroid cells counted | Application error or confusing display | 2 | Denominator zero when no erythroid cells counted; common in PB counts and early BM counts | 3 | Always detected: "N/A" or error is visible | 1 | **6** | **Low** | SYS-046: Denominator-zero guard displays "N/A". PB config has no M:E formula. | 2x1x1 = **2** (Low) |

### 4.9 Hazards Identified From the Standards Review (DCR-005)

Both arise from ICSH 2008 §2.6 (REF-001 [S1]) and were found by reading the
primary text against the shipped configuration.

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-090 | Cells that ICSH excludes from the nucleated differential count are tallied into a general-purpose category | The excluded cell enters the denominator and depresses every reported percentage. ICSH §2.6 excludes megakaryocytes, macrophages, osteoblasts, osteoclasts, stromal cells, smudged cells and non-haemopoietic cells such as metastatic tumour cells. A marrow with numerous smudged cells or tumour infiltrate could have every lineage percentage understated, including the blast percentage used for diagnostic thresholds | 4 | The shipped profile offers an `other` category with no ICSH counterpart and no stated scope; operators reasonably use it for anything unclassifiable | 3 | **None** — the count remains internally consistent and the error is invisible in the output | 4 | **48** | **Medium** | REF-001 §3.2 records the ICSH exclusion list. The `other` category carries interface guidance naming what must not be counted into it, and SOP-001 directs that excluded findings be recorded in the morphology comment rather than tallied. A profile may omit the category entirely. | 4x2x2 = **16** (Medium). **Residual risk accepted with documentation and training.** This cannot be reduced further in software: the tool records the operator's classification and cannot know which cell was placed in `other`. Detection improves from Low to High because the reported morphology comment gives the reviewing pathologist a cross-check. |
| HA-091 | Lymphoid blasts are included in the M:E ratio numerator | ICSH §2.6 specifies *myeloblasts* in the M:E numerator, but the shipped profile has a single generic `blasts` category. In a lymphoblastic marrow the M:E ratio is overstated | 2 | Profile does not distinguish myeloid from lymphoid blasts | 2 | M:E ratio is secondary to the differential and is interpreted with cellularity, flow cytometry and immunophenotype | 3 | **12** | **Low** | Documented limitation in URS-035 and REF-001 §3.5. A laboratory requiring the distinction configures separate myeloid and lymphoid blast categories, which the schema already supports. | 2x2x2 = **8** (Low) |

| HA-092 | A category that is not part of the differential is included in its percentage denominator | Every reported percentage in that differential is depressed. In peripheral blood, nucleated red cells are enumerated with the leucocytes but are not leucocytes; counting them into the denominator understates every leucocyte percentage in proportion to how many are present. With 20 NRBC among 200 cells a true 66.7% neutrophil proportion reports as 60.0%. The error is largest in exactly the conditions that produce NRBC — haemolysis, myelophthisis, marrow infiltration, neonatal samples — and is invisible in the output, since the percentages remain internally consistent and sum to 100 | 4 | The profile schema had no way to express that a counted category sits outside the differential; every counted cell entered the denominator | 4 | **None** — the differential is self-consistent and gives the reviewer nothing to notice | 4 | **64** | **High** | SYS-180–SYS-185: a profile designates categories excluded from the denominator and reports them per 100 of it. The shipped peripheral blood profile excludes NRBC and reports NRBC per 100 WBC. Bone marrow is unchanged: ICSH 2008 §2.6 places erythroblasts inside the nucleated differential count. Validation rejects a profile that excludes every category or that reports a category both ways. | 4x1x2 = **8** (Low). Verified at all three layers: VV-DEN-001 to 006, TC-B100 to B107, VV-SYS-100 to 102. Detection improves because the counting grid and the report now state the differential denominator and the overall tally separately, so a discrepancy is visible. |

| HA-093 | The M:E ratio is displayed to a precision the count does not support | A ratio of two counted proportions carries the sampling error of both and is substantially less precise than either. Displaying "2.1:1" invites comparison between successive marrow examinations at a resolution the counts cannot sustain, potentially reading a change in disease where only sampling noise exists | 2 | The ratio is rendered at the precision the configuration specifies, with nothing stated about its uncertainty | 3 | **None** | 3 | **18** | **Medium** | The M:E display carries an advisory that the ratio inherits the imprecision of both percentages (Rümke 1985, REF-001 [S4] and §3.8), directing that it be read alongside cellularity and the trephine biopsy. A computed interval for a ratio requires Fieller's theorem or a bootstrap and is deferred. | 2x3x2 = **12** (Low). **Residual accepted pending a ratio interval.** The M:E ratio is a secondary parameter interpreted in context, never a threshold test, which bounds the consequence. |

| HA-094 | A count is accepted as settling a diagnostic question it cannot settle | The observed percentage sits on one side of a diagnostic threshold while the count leaves the true value genuinely uncertain. An observed 20% blasts at 200 cells carries a 95% interval of 15.0–26.1%: the case may be reported as meeting the AML threshold on a count that does not establish it. The consequence is a classification the count does not support, in either direction | 4 | The point estimate is reported without reference to any threshold; the operator must recognise the situation unaided and recall the ICSH guidance | 3 | **None** — the reported figure looks equally definite whether the interval is narrow or wide | 4 | **48** | **Medium** | SYS-204–208: profiles define diagnostic thresholds with a citable basis, and where the confidence interval spans one the results screen names the quantity, its interval, the threshold and the basis, and directs the operator to Continue Counting. Implements the ICSH 2008 §2.6 direction to extend the count near a critical threshold. Informational only, per URS-041. | 4x3x1 = **12** (Low). Occurrence is unchanged — whether to extend the count remains a clinical judgement, and a paucicellular aspirate may make it impossible — but detection improves from Low to Certain: the condition is now stated rather than left to be recognised. Verified by VV-THR-001 to 008, TC-B120 to B127, VV-SYS-120 to 123. |

| HA-095 | A result is interpreted without knowing the convention that produced it | Differential figures are compared across laboratories, or against the same laboratory's earlier results, when the underlying conventions differ. Identical counts give a materially different M:E ratio depending on whether monocytes are in the numerator, and a materially different blast percentage depending on whether erythroid precursors are in the denominator; both conventions are in current use. A trend read across a profile change may reflect the change rather than the patient | 3 | The report states figures without stating the conventions behind them; the reader has no way to know a competing convention exists | 4 | **None** | 4 | **48** | **Medium** | SYS-210–213: profiles declare their provenance, formulas their convention and target counts their basis; the system assembles a method statement presented with the result, available to templates, and carried in every export. The shipped profile records that a competing M:E convention exists rather than implying there is only one. | 3x2x2 = **12** (Low). Occurrence falls because the convention travels with the result; detection improves because a reader who sees two differing figures can now identify why. Residual reflects that a reader may still not consult the statement. |
| HA-096 | The record reaching the LIS cannot be traced to its counting parameters | Clipboard text is the primary route into the patient record. It previously carried the rendered template alone — no profile, no version, no timestamp — so the reported differential could not be tied to the configuration that produced it. URS-052 exists to prevent exactly this, and was met for file export but not for the path most used | 4 | The copy control copies the rendered report panel, which did not include attribution | 4 | **None** | 3 | **48** | **Medium** | SYS-214: the copied text carries profile ID, version and timestamp independently of the active template, so a laboratory cannot lose attribution by editing its templates. | 4x1x2 = **8** (Low). Verified by TC-B131 and VV-SYS-130, the latter reading the real system clipboard. |

| HA-097 | Operator documentation describes software that no longer exists | An operator follows a documented key mapping or target count that the configuration has since changed. USER-GUIDE.md described a nine-category layout with keys and targets that had been superseded; an operator relying on it would have pressed keys mapped to different cell types than the document stated | 4 | Documentation is maintained by hand and nothing verified it against the configuration | 3 | **None** | 3 | **36** | **Medium** | SYS-224: test suite 13 verifies every documented key, target count and quoted figure against the shipped profile and the shipped calculation engine, so documentation drift fails the build. The guide also directs the operator to the on-screen key display as authoritative, since keys are configurable. | 4x1x1 = **4** (Low). Verified by UD-001 to UD-003 (keys and targets), UD-010 to UD-014 (quoted figures recomputed from the engine). |

| HA-098 | A clinical advisory is displayed but cannot be read | The near-threshold advisory, the sub-target note, the abnormal-row flag and the peripheral blood per-100 value all used an amber palette chosen for a dark background. In the light theme they rendered at a contrast ratio of **1.28:1** against their panel — effectively invisible. The system recorded that it had warned; the operator saw nothing. Worse than issuing no advisory, because the count carries a note in its record that the operator never read | 4 | The light theme defined overrides for every slate tone but none for amber or red; every test asserted on advisory *text content*, which was present and correct | 3 | **None** — the element is in the DOM, populated, and reported visible by any content-based check | 5 | **60** | **High** | Light-theme overrides added for the full amber and red scales, chosen to clear WCAG AA (worst measured 4.51:1 light, 11.22:1 dark). VV-SYS-160 and VV-SYS-161 measure rendered contrast in both themes, compositing semi-transparent layers down to the page background, and fail below 4.5:1. | 4x1x1 = **4** (Low). The regression test was confirmed to detect the original defect: with the fix reverted it reports 1.28:1 and fails. |

### 4.10 Hazards Identified in the v2.1 Design Review (DCR-004)

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-080 | A key-mapped cell type is absent from the displayed categories | **Silent miscount.** The category is counted into the grand total and into every percentage denominator while never appearing on screen. Every reported percentage is depressed by an amount the operator cannot see or reconstruct — capable of moving a blast percentage across a diagnostic cutoff | 5 | Configuration editor or hand-edited profile maps a key to a cell type that is not listed in `categories.upper` or `categories.lower` | 2 | **None** — the defect is invisible by construction; the totals remain internally consistent | 5 | **50** | **High** | SYS-104: validation rejects any profile in which a key-mapped cell type is not displayed, naming the offending key and cell type. Enforced on load, on import, and in the configuration editor before a profile can be made active. | 5x1x1 = **5** (Low). Verified by TC-B063 and VV-SYS-052. |
| HA-081 | Operator input is reinterpreted as markup or as a spreadsheet formula | A case number or morphology comment containing markup alters the rendered report; a value beginning `=`, `+`, `-` or `@` executes when an exported CSV is opened in a spreadsheet | 3 | Values substituted into report templates were inserted unescaped and written with `innerHTML`; CSV fields were quoted but not neutralised | 2 | **None** | 3 | **18** | **Medium** | SYS-S04: rendered output permits only an allowlist of formatting tags and carries no attributes. SYS-S05: placeholder substitution inserts values literally, so replacement patterns such as `$&` are not reinterpreted. SYS-S06: CSV fields beginning with a formula character are neutralised while ordinary accession formats pass through unchanged. | 3x1x1 = **3** (Low). Verified by VV-E2E-030–034, TC-B087 and VV-SYS-073. |

---

## 5. Risk Summary

### 5.1 Pre-Mitigation Risk Distribution

| Risk Level | Count | Hazard IDs |
|-----------|-------|-----------|
| Critical (75-125) | 1 | HA-001 |
| High (50-74) | 5 | HA-003, HA-030, HA-080, HA-092, HA-098 |
| Medium (16-49) | 28 | HA-002, HA-004, HA-010, HA-011, HA-012, HA-013, HA-014, HA-015, HA-020, HA-021, HA-022, HA-024, HA-031, HA-042, HA-043, HA-052, HA-061, HA-063, HA-064, HA-071, HA-081 |
| Low (1-15) | 9 | HA-023, HA-040, HA-041, HA-050, HA-051, HA-060, HA-062, HA-070, HA-072 |

Total: **43** hazards (29 carried from v2.0, 5 added by the v2.1 design review, 2 by the standards review, 1 by the denominator review).

_Two counting errors in the v2.0 table are corrected here: the Medium row was
labelled 14 against a list of 16 entries and the Low row 8 against a list of 10,
and HA-021 (pre-RPN 18) was filed under Low when its own row states Medium.
Every RPN in section 4 has been recomputed from its S, O and D values._

### 5.2 Post-Mitigation Risk Distribution

| Risk Level | Count |
|-----------|-------|
| Critical (75-125) | **0** |
| High (50-74) | **0** |
| Medium (16-49) | **2** (HA-001 RPN=45, HA-002 RPN=30) |
| Low (1-15) | **41** |

All three residual Medium risks are accepted by design and unchanged from v2.0;
their rationale is in section 5.3. No residual risk sits above Medium.

### 5.2.1 Residual RPNs revised in v2.1

Four v2.0 residual scores credited mitigations that were not present in the
code. They are corrected here rather than carried forward, because a residual
risk claimed against a control that does not exist is not a residual risk.

| Hazard | v2.0 residual | v2.1 residual | Basis for the change |
|--------|---------------|---------------|----------------------|
| HA-022 percentages do not sum to 100% | 8 *(claimed)* | **4** | The v2.0 score credited "sum validation within ±0.10% tolerance" and a "defined rounding method". Neither existed in the code (DCR-004 D-03), so the true v2.0 residual was the unmitigated 16. Largest-remainder distribution is now implemented and gives an exact sum, verified over 2 000 randomised differentials at both precisions. O: Unlikely → Remote. |
| HA-041 browser close during counting | 9 | **3** | Autosave and restore were shipping in v2.0 but carried no system requirement and no verification. Now specified as SYS-145–149 and verified behaviourally and across a real browser reload. O of permanent loss: Occasional → Remote. |
| HA-060 configuration fails to load | 6 | **3** | The v2.0 score did not account for the cached-profile path, in which a corrupt saved profile produced a terminal error screen whose only recovery control was itself inert (D-01/D-02). Automatic fallback to the built-in profile plus a working recovery control. O: Unlikely → Remote. |
| HA-061 configuration contains invalid data | 8 | **4** | The v2.0 score credited schema validation that ran only on import and checked field presence, not consistency. Validation now runs on load, on import and in the editor, and names every reason for rejection. D: High → Certain. |

HA-062 keeps its residual of 5, but that score was previously unsupported for
the same reason — the duplicate-key check it credited did not exist. It is now
implemented and verified.

### 5.2.2 Hazards added by the v2.1 design review

| Hazard | Pre-RPN | Residual | Source defect |
|--------|---------|----------|---------------|
| HA-080 hidden key-mapped category causes a silent miscount | **50** (High) | 5 (Low) | DCR-004 D-11 |
| HA-063 superseded profile stays in use after a fix is published | 48 (Medium) | 8 (Low) | DCR-004 D-02 |
| HA-043 corrupted autosave record restored | 20 (Medium) | 5 (Low) | DCR-004 D-19 |
| HA-081 operator input reinterpreted as markup or formula | 18 (Medium) | 3 (Low) | DCR-004 D-12/D-13 |
| HA-064 cell type name shadows a report placeholder | 16 (Medium) | 4 (Low) | DCR-004 D-17 |

HA-080 is the most significant addition. It is the only new hazard rated High
before mitigation, because the failure is undetectable in use by construction:
the totals stay internally consistent while every reported percentage is
depressed by a hidden category. It was reachable through the configuration
editor and was not caught by any validation.

### 5.3 Residual Risk Assessment

After implementation of all defined mitigations:
- **HA-001** (count without case number) remains Medium (RPN=45) because case number is optional by design. Physical context at the microscope identifies the specimen. Institutions requiring traceability can enable `requireCaseNumber: true` in their profile. **Accepted** by design — stakeholder feedback confirms physical context identifies specimen; forcing case number kills adoption.
- **HA-002** (wrong case number entered) remains Medium (RPN=30) because this is fundamentally a human transcription error that cannot be fully prevented by software. Mitigation reduces probability through persistent display but cannot eliminate the root cause. **Accepted** with SOP mitigation (verification against slide label).
- **HA-030** (insufficient cell count) is reduced to Low (RPN=12) under DCR-007. The advisory approach still intentionally allows subthreshold counts for paucicellular specimens, so occurrence is unchanged; but the consequence is now visible rather than inferred, because each reported percentage carries a confidence interval and the sub-target note states a computed one. **Accepted** — pathologists know when specimens are paucicellular, and the interval tells them what that costs in precision.

### 5.4 Verification of mitigations

Every mitigation claimed in section 4 now maps to at least one automated test
that executes the shipped application. The hazard-to-verification mapping is
maintained in RTM-001 v3.0 section 7.

This is a change in kind, not degree. Before DCR-004 no test in this project
executed the application: the calculation suites re-implemented the algorithms
and verified the copy, and the remaining suites asserted on file text. A
mitigation could therefore be recorded as effective in this document while
being absent from the code — which is exactly what happened to HA-022, HA-060,
HA-061 and HA-062. The verification layers added in v2.1 are what allow the
residual scores above to be treated as evidence rather than intent.

**Overall residual risk is acceptable** when combined with trained operator use per SOP-001.

---

## 6. Risk Management Summary

### 6.1 Design Changes Required (from this analysis)

| Change | Addresses | Priority |
|--------|----------|----------|
| Configurable case number with institutional profile support (default: not required) | HA-001, HA-004 | P0 |
| Add auto-clear on case number change | HA-003 | P0 |
| Add Shift+key decrement (undo) | HA-013 | P0 |
| Advisory target count with progress indicator and non-blocking note | HA-030 | P0 |
| Add post-completion input locking | HA-015, HA-031 | P1 |
| Add reset confirmation dialog | HA-040 | P1 |
| Add copy-to-clipboard function | HA-042 | P1 |
| Add visual keypress feedback | HA-011 | P1 |
| Add morphology comments field with output integration | HA-052 | P1 |
| Implement M:E ratio with denominator-zero guard | HA-070, HA-072 | P1 |
| Implement Continue Counting with tally preservation | HA-071 | P1 |
| Add configuration schema validation | HA-061, HA-062 | P2 |

### 6.2 Design Changes Required (from the v2.1 review, DCR-004)

| Change | Addresses | Priority | Status |
|--------|----------|----------|--------|
| Reject profiles with a key-mapped but undisplayed category | HA-080 | P0 | Implemented |
| Reject cell type names that shadow report placeholders | HA-064 | P0 | Implemented |
| Version comparison so a corrected built-in profile supersedes a stale cache | HA-063 | P0 | Implemented |
| Profile ID and version in every output and export | HA-004, HA-063 | P0 | Implemented |
| Largest-remainder percentage normalisation | HA-022 | P0 | Implemented |
| Working configuration export / import / reset controls | HA-060, HA-061 | P0 | Implemented |
| Recovery control on the configuration failure screen | HA-060 | P0 | Implemented |
| Sanitise rendered output; neutralise CSV formula injection | HA-081 | P1 | Implemented |
| Coerce restored autosave counts; refuse an unknown specimen type | HA-043 | P1 | Implemented |
| Specify autosave and restore as system requirements | HA-041 | P1 | Implemented |
| Preserve structured morphology selections across Continue Counting | HA-052, HA-071 | P1 | Implemented |
| Confirmed mid-count specimen switch with save-to-history | HA-014 | P1 | Implemented |

### 6.3 Open Risk Management Actions

| Action | Owner | Status |
|--------|-------|--------|
| Clinical review and sign-off of the S/O/D ratings | Document Owner | **Closed 2026-08-05.** Reviewed and accepted as they stand. See §6.4. |
| Confirm acceptance of the residual Medium risks | Document Owner | **Closed 2026-08-05.** HA-001 and HA-002 accepted by design; rationale in §5.3. |
| Approve this document | All signatories | Open — RA-001 remains in Draft pending the signature block in §8 |

### 6.4 Severity Rating Review (2026-08-05)

The Severity values throughout §4 are clinical judgements about the consequence
of a failure reaching a patient. They were carried unchanged through revisions
B to H so that the engineering changes to Occurrence and Detection could be
reviewed against a stable baseline.

**They have now been reviewed by the Document Owner and are accepted as they
stand.** No Severity value is revised. The basis is the same reasoning that
supports the IEC 62304 Class A classification recorded in DHF-001 §3.1: the
differential count is one input among several, it is produced by a qualified
operator who has identified every cell counted, and it is reviewed before
release under the laboratory's quality system. Those external controls bound
the consequence of any single failure of this software, which is what the
Severity column expresses.

This closes the open action recorded in revisions D through H. The Occurrence
and Detection values, which were revised on engineering grounds across DCR-004
to DCR-009, are unaffected by this review.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - complete FMEA |
| B | 2026-02-24 | QMS | v2.0 update: optional case number (HA-001), advisory target count replacing blocking dialog (HA-030), unified key mappings (HA-010), new hazards for M:E ratio (HA-070, HA-072) and Continue Counting (HA-071), updated risk summary |
| K | 2026-08-05 | QMS | v2.9: HA-098 added — a clinical advisory displayed but unreadable. Found live: every warning in the product rendered at 1.28:1 in the light theme. Pre-RPN 60 (High), residual 4. Detection was Low because content-based tests cannot see it. |
| J | 2026-08-05 | QMS | v2.8: HA-097 added — operator documentation describing superseded software. Found live: USER-GUIDE.md documented a nine-category layout with keys and targets that no longer existed. Pre-RPN 36, residual 4. |
| I | 2026-08-05 | QMS | v2.7: Severity ratings reviewed by the Document Owner and accepted unchanged; the open action carried since revision D is closed (§6.4). Residual Medium risks HA-001 and HA-002 accepted by design. |
| H | 2026-08-05 | QMS | v2.6 (DCR-009): HA-095 (a result interpreted without its convention) and HA-096 (the LIS record untraceable to its counting parameters) added, both pre-RPN 48. HA-096 was a live URS-052 gap — the clipboard path carried no profile attribution while file export did. |
| G | 2026-08-05 | QMS | v2.5 (DCR-008): HA-094 added — a count accepted as settling a diagnostic question it cannot settle. Pre-RPN 48, residual 12. Mitigated by the near-threshold advisory, which implements the ICSH §2.6 direction the design review had recorded as an open gap. |
| F | 2026-08-05 | QMS | v2.4 (DCR-007): HA-093 added — the M:E ratio is displayed at a precision the count does not support, which is the imprecision Rümke's paper actually concerns. HA-030 re-scored 24 → 12: the sub-target advisory now states a computed confidence interval rather than a general caution, so detection improves from Low to Certain. Residual Medium risks reduce from 3 to 2. |
| E | 2026-08-05 | QMS | v2.3 (DCR-006): HA-092 added — a category outside the differential included in its percentage denominator. Pre-RPN 64 (High), residual 8. This was live in the shipped peripheral blood profile: NRBC sat in the denominator, understating every leucocyte percentage. |
| D | 2026-08-05 | QMS | v2.2 (DCR-005): HA-090 and HA-091 added from the ICSH standards review. |
| C | 2026-08-04 | QMS | v2.1 update (DCR-004). Five hazards added from the design review: HA-080 (hidden key-mapped category, pre-RPN 50 High), HA-063, HA-043, HA-081, HA-064. Four residual RPNs corrected where the v2.0 score credited a control absent from the code: HA-022 (8→4), HA-041 (9→3), HA-060 (6→3), HA-061 (8→4); HA-062 unchanged at 5 but now supported. HA-014 mitigation revised — the specimen selector is no longer locked, per URS-010. Section 5.1 counting errors corrected (Medium 14→21, Low 8→9, HA-021 refiled). Section 5.4 added: every mitigation now maps to a test that executes shipped code. Sections 6.2 and 6.3 added. Severity ratings unchanged throughout and require clinical sign-off. |

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Risk Manager | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
