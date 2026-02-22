# RA-001: Risk Analysis - Failure Mode and Effects Analysis (FMEA)

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | RA-001 |
| **Version** | 1.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001, SRS-001, SAD-001, SDD-001 |
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
| HA-001 | Count performed without case/accession number | Results cannot be traced to patient; result applied to wrong patient | 5 | User forgets to enter case number; UI does not enforce | 4 | **None (current design)** | 5 | **100** | **Critical** | SYS-003: Disable Start Count when case field is empty. SYS-004: Prominent case display. | 5x1x1 = **5** (Low) |
| HA-002 | Wrong case number entered | Results attributed to wrong patient | 5 | Operator transcription error | 3 | Human verification against slide label | 3 | **45** | **Medium** | SYS-004: Persistent case number display for continuous verification. SOP instruction to verify against slide label. | 5x3x2 = **30** (Medium) |
| HA-003 | Data from previous case carries over to new case | Contaminated result: percentages reflect two different patients | 5 | Application does not clear data on case change | 3 | **None (current design - page reload is the only reset)** | 4 | **60** | **High** | SYS-006: Automatic data clear on case number change with confirmation. SYS-082: Complete state reset. | 5x1x1 = **5** (Low) |
| HA-004 | Case number not included in output | Printed/pasted result not traceable to patient | 4 | Output templates do not include case number placeholder | 3 | **None (current design)** | 3 | **36** | **Medium** | SYS-067: Case number is first element in all output text. Template schema requires {{caseNumber}}. | 4x1x1 = **4** (Low) |

### 4.2 Counting Accuracy Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-010 | Keypress registers to wrong cell type | Incorrect differential percentages | 4 | Key mapping error in configuration; key mapping display mismatch | 2 | Configuration loaded from verified JSON file | 3 | **24** | **Medium** | SYS-038/039: Verified key mappings. TP-TC-030: Key mapping verification tests for every key. | 4x1x1 = **4** (Low) |
| HA-011 | Keypress not registered (missed count) | Undercounting of a cell type; skewed percentages | 3 | Rapid typing outpacing event loop; key debounce issue | 3 | **None (no feedback for missed keys)** | 4 | **36** | **Medium** | SYS-037: Visual flash feedback on each keypress. SYS-P02: <50ms keypress-to-update latency requirement. | 3x2x2 = **12** (Low) |
| HA-012 | Double keypress registers (extra count) | Overcounting of a cell type; skewed percentages | 3 | Key repeat from held key; bounce on mechanical keyboard | 3 | None | 3 | **27** | **Medium** | SYS-032: Shift+key decrement allows correction. Keyboard repeat is OS-controlled; documented in SOP. | 3x2x2 = **12** (Low) |
| HA-013 | Unable to correct a miscount (no undo) | Operator must restart count or accept inaccurate result | 4 | **No decrement function exists in current design** | 5 | **None** | 1 | **20** | **Medium** | SYS-032: Shift+key decrement. SYS-033: Floor at zero. | 4x1x1 = **4** (Low) |
| HA-014 | Count performed on wrong specimen type (BM vs PB) | Completely invalid differential with wrong cell categories | 5 | Operator selects wrong specimen type; specimen type changes mid-count | 2 | Dropdown selector visible on screen | 3 | **30** | **Medium** | SYS-016: Lock specimen selector after Start Count. SYS-004: Display specimen type alongside case number. | 5x1x2 = **10** (Low) |
| HA-015 | Counting continues after operator intends to stop | Extra cells counted, changing percentages | 3 | Accidental keypresses after mentally completing count | 4 | None | 3 | **36** | **Medium** | SYS-054: Detach keydown listener on Count Done. SYS-055: Lock inputs to readonly. | 3x1x2 = **6** (Low) |

### 4.3 Calculation Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-020 | Percentage calculation error | Incorrect differential percentages reported | 5 | Software bug in calcPercent(); floating point error | 2 | Algorithm is straightforward division | 2 | **20** | **Medium** | SYS-040-045: Defined calculation algorithm. VV-001: Comprehensive calculation verification with known inputs/outputs. | 5x1x1 = **5** (Low) |
| HA-021 | Division by zero (total = 0) | Application crash; NaN/Infinity displayed | 3 | calcPercent called before any cells counted | 3 | **Current code does not guard against this** | 2 | **18** | **Medium** | SYS-042: Explicit guard - return 0.00 when total is 0. TP-TC-040: Boundary test case. | 3x1x1 = **3** (Low) |
| HA-022 | Percentages do not sum to 100% | Loss of clinical confidence; appears to be a calculation error | 2 | Floating point rounding accumulation | 4 | None | 2 | **16** | **Medium** | SYS-044: Sum validation within +/- 0.10% tolerance. SYS-045: Defined rounding method. | 2x2x2 = **8** (Low) |
| HA-023 | Total count is incorrect | All percentages based on wrong denominator | 5 | Sum logic error; DOM query returns wrong elements | 1 | Total is visible and intuitive to verify | 2 | **10** | **Low** | SYS-025: Total defined as arithmetic sum. TP-TC-034: Total calculation tests. | 5x1x1 = **5** (Low) |
| HA-024 | Output percentages differ from table percentages | Discrepancy between what operator sees and what is reported | 4 | mkOutTplJson uses separate calculation from calcPercent | 2 | Operator can visually compare table and output | 3 | **24** | **Medium** | SDD: Both functions use same formula. VV-001: Cross-verification test comparing table and output values. | 4x1x2 = **8** (Low) |

### 4.4 Count Validity Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-030 | Count finalized with too few cells | Statistically invalid differential; misleading percentages | 4 | Operator clicks Count Done prematurely; inadequate specimen | 4 | **None (current design has no minimum check)** | 4 | **64** | **High** | SYS-052/053: Configurable minimum threshold. Warning dialog with explicit override. Total count displayed at all times. | 4x2x2 = **16** (Medium) |
| HA-031 | Count modified after finalization | Reported result no longer matches output | 4 | Inputs remain editable after Count Done | 3 | **None (current design does not lock inputs)** | 4 | **48** | **Medium** | SYS-055: Set all inputs to readonly after Count Done. SYS-054: Detach keydown listener. | 4x1x2 = **8** (Low) |

### 4.5 Data Loss Hazards

| # | Failure Mode | Potential Effect | S | Cause | O | Current Controls | D | RPN | Risk Level | Mitigation / Design Control | Residual RPN |
|---|-------------|-----------------|---|-------|---|-----------------|---|-----|-----------|----------------------------|-------------|
| HA-040 | Accidental reset destroys active count | Complete loss of counting work | 3 | User accidentally clicks Reset; no confirmation | 4 | **None (current design - page reload with no warning)** | 1 | **12** | **Low** | SYS-081: Confirmation dialog before reset. | 3x1x1 = **3** (Low) |
| HA-041 | Browser tab/window closed during counting | Loss of in-progress count | 3 | Accidental close; system crash; browser update | 3 | None (no autosave) | 1 | **9** | **Low** | SYS-095: Session history provides backup for completed counts. In-progress counts are transient by design (documented in SOP). | 3x3x1 = **9** (Low) |
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
| HA-060 | templates.json fails to load | Application non-functional | 3 | Server error; file missing; network issue | 2 | Backbone fetch error callback exists | 2 | **12** | **Low** | SYS-101: Error message displayed; counting disabled. | 3x2x1 = **6** (Low) |
| HA-061 | templates.json contains invalid data | Unexpected behavior; wrong cell types; crashes | 4 | Manual edit error; file corruption | 2 | None (no schema validation) | 3 | **24** | **Medium** | SYS-102/103: Schema validation on load. Reject and display error for invalid config. | 4x1x2 = **8** (Low) |
| HA-062 | Key mapping in config conflicts (two cells same key) | One cell type overwritten; never counted | 5 | Configuration editing error | 1 | None | 3 | **15** | **Low** | Schema validation: check for duplicate keys. TP-TC-100: Config validation test. | 5x1x1 = **5** (Low) |

---

## 5. Risk Summary

### 5.1 Pre-Mitigation Risk Distribution

| Risk Level | Count | Hazard IDs |
|-----------|-------|-----------|
| Critical (75-125) | 1 | HA-001 |
| High (50-74) | 2 | HA-003, HA-030 |
| Medium (16-49) | 13 | HA-002, HA-004, HA-010, HA-011, HA-012, HA-013, HA-014, HA-015, HA-020, HA-022, HA-024, HA-031, HA-042, HA-052, HA-061 |
| Low (1-15) | 6 | HA-021, HA-023, HA-040, HA-041, HA-050, HA-051, HA-060, HA-062 |

### 5.2 Post-Mitigation Risk Distribution

| Risk Level | Count |
|-----------|-------|
| Critical (75-125) | **0** |
| High (50-74) | **0** |
| Medium (16-49) | **2** (HA-002, HA-030) |
| Low (1-15) | **20** |

### 5.3 Residual Risk Assessment

After implementation of all defined mitigations:
- **HA-002** (wrong case number entered) remains Medium (RPN=30) because this is fundamentally a human transcription error that cannot be fully prevented by software. Mitigation reduces probability through persistent display but cannot eliminate the root cause. **Accepted** with SOP mitigation (verification against slide label).
- **HA-030** (insufficient cell count) remains Medium (RPN=16) because the override mechanism intentionally allows subthreshold counts for hypocellular specimens. **Accepted** as clinically necessary with warning dialog providing informed override.

**Overall residual risk is acceptable** when combined with trained operator use per SOP-001.

---

## 6. Risk Management Summary

### 6.1 Design Changes Required (from this analysis)

| Change | Addresses | Priority |
|--------|----------|----------|
| Add mandatory case number input with validation | HA-001, HA-004 | P0 |
| Add auto-clear on case number change | HA-003 | P0 |
| Add Shift+key decrement (undo) | HA-013 | P0 |
| Add minimum cell count threshold check | HA-030 | P0 |
| Add post-completion input locking | HA-015, HA-031 | P1 |
| Add reset confirmation dialog | HA-040 | P1 |
| Add copy-to-clipboard function | HA-042 | P1 |
| Add visual keypress feedback | HA-011 | P1 |
| Add morphology comments field with output integration | HA-052 | P1 |
| Add configuration schema validation | HA-061, HA-062 | P2 |

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - complete FMEA |

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Risk Manager | | | |
| Clinical Reviewer | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
