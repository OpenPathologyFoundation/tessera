# VV-001: Verification & Validation Protocol

## Manual Differential Counter

| Field | Value |
|-------|-------|
| **Document ID** | VV-001 |
| **Version** | 1.0 |
| **Product** | Manual Differential Counter (MDC) |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001, SRS-001, SDD-001, TP-001, RA-001 |

---

## 1. Purpose

This document defines the verification and validation (V&V) approach for the Manual Differential Counter. Verification demonstrates that the software was built correctly (meets system requirements). Validation demonstrates that the correct software was built (meets user needs in the intended use environment).

## 2. V&V Framework

### 2.1 Verification vs. Validation

| Activity | Question Answered | Method | Reference |
|----------|------------------|--------|-----------|
| **Verification** | "Was the product built correctly?" | Testing, inspection, analysis against SRS-001 | IEC 62304 Section 5.7 |
| **Validation** | "Was the correct product built?" | Clinical user acceptance testing against URS-001 | IEC 62304 Section 5.8 |

### 2.2 V-Model Mapping

```
USER REQUIREMENTS (URS-001)  ←——————————————→  VALIDATION (Section 5)
        |                                              ↑
SYSTEM REQUIREMENTS (SRS-001) ←————————————→  SYSTEM VERIFICATION (Section 4)
        |                                              ↑
ARCHITECTURE DESIGN (SAD-001) ←————————————→  INTEGRATION VERIFICATION (Section 3)
        |                                              ↑
DETAILED DESIGN (SDD-001)    ←————————————→  UNIT VERIFICATION (Section 3)
        |                                              ↑
        └———→ IMPLEMENTATION ——————————————————————————┘
```

---

## 3. Verification Protocol

### 3.1 Unit Verification — Calculation Engine

The percentage calculation is the single most safety-critical computation in the system. It must be verified exhaustively with known inputs and expected outputs.

#### 3.1.1 Percentage Calculation Verification Table

Each row represents a test vector. The function under test is `calcPercent()` which computes `(cell_count / total) * 100` rounded to 2 decimal places.

| VV-ID | Test Vector | Cell Counts (blast,pro,gran,eryth,baso,eos,plasma,lymph,mono) | Total | Expected Percentages | Pct Sum | Purpose |
|-------|------------|---------------------------------------------------------------|-------|---------------------|---------|---------|
| VV-CALC-001 | All zeros | 0,0,0,0,0,0,0,0,0 | 0 | 0.00 for all | 0.00 | Division by zero |
| VV-CALC-002 | Single cell | 1,0,0,0,0,0,0,0,0 | 1 | 100.00,0,0,0,0,0,0,0,0 | 100.00 | Single cell = 100% |
| VV-CALC-003 | Two equal | 50,50,0,0,0,0,0,0,0 | 100 | 50.00,50.00,0,... | 100.00 | Even split |
| VV-CALC-004 | All equal | 10,10,10,10,10,10,10,10,10 | 90 | 11.11 each | ~100.00 | Nine-way split, repeating decimal |
| VV-CALC-005 | One dominant | 0,0,95,0,0,0,0,5,0 | 100 | 0,0,95.00,0,0,0,0,5.00,0 | 100.00 | Dominant cell type |
| VV-CALC-006 | All ones | 1,1,1,1,1,1,1,1,1 | 9 | 11.11 each | ~100.00 | Minimum multitype |
| VV-CALC-007 | Standard BM diff | 2,5,60,10,1,3,2,12,5 | 100 | 2.00,5.00,60.00,10.00,1.00,3.00,2.00,12.00,5.00 | 100.00 | Normal bone marrow |
| VV-CALC-008 | Abnormal BM diff | 45,15,10,5,0,1,2,20,2 | 100 | 45.00,15.00,10.00,5.00,0.00,1.00,2.00,20.00,2.00 | 100.00 | Acute leukemia pattern |
| VV-CALC-009 | Small count (N=10) | 3,0,4,0,0,0,0,2,1 | 10 | 30.00,0,40.00,0,0,0,0,20.00,10.00 | 100.00 | Low count scenario |
| VV-CALC-010 | Large count (N=500) | 10,25,300,50,5,15,10,60,25 | 500 | 2.00,5.00,60.00,10.00,1.00,3.00,2.00,12.00,5.00 | 100.00 | Large count validation |
| VV-CALC-011 | Repeating thirds | 1,1,1,0,0,0,0,0,0 | 3 | 33.33,33.33,33.33,0,... | 99.99 | Rounding edge case |
| VV-CALC-012 | Repeating sixths | 1,1,1,1,1,1,0,0,0 | 6 | 16.67 each (6 cells) | ~100.02 | Rounding accumulation |
| VV-CALC-013 | One of each + extra | 2,1,1,1,1,1,1,1,1 | 10 | 20.00,10.00,10.00,10.00,10.00,10.00,10.00,10.00,10.00 | 100.00 | Near-even distribution |
| VV-CALC-014 | Max capacity | 1111,1111,1111,1111,1111,1111,1111,1111,1111 | 9999 | 11.11 each | ~100.00 | Upper boundary |
| VV-CALC-015 | Standard PB diff | 60,5,25,5,2,1,0,0,2 | 100 | 60.00,5.00,25.00,5.00,2.00,1.00,0.00,0.00,2.00 | 100.00 | Normal peripheral blood |

**Pass Criteria**:
- Each individual percentage matches expected value to 2 decimal places
- Sum of percentages is within +/- 0.10% of 100.00% (when total > 0)
- No NaN, Infinity, or undefined values displayed
- No JavaScript errors in console

#### 3.1.2 Increment/Decrement Verification Table

| VV-ID | Scenario | Initial Count | Action | Expected Count | Expected Total |
|-------|----------|---------------|--------|----------------|----------------|
| VV-INC-001 | Increment from zero | blast=0, total=0 | Press 'A' | blast=1, total=1 | 1 |
| VV-INC-002 | Increment existing | blast=5, total=10 | Press 'A' | blast=6, total=11 | 11 |
| VV-INC-003 | Decrement from positive | blast=5, total=10 | Shift+'A' | blast=4, total=9 | 9 |
| VV-INC-004 | Decrement from 1 | blast=1, total=5 | Shift+'A' | blast=0, total=4 | 4 |
| VV-INC-005 | Decrement from zero (boundary) | blast=0, total=5 | Shift+'A' | blast=0, total=5 | 5 |
| VV-INC-006 | Decrement only cell | blast=1, total=1 | Shift+'A' | blast=0, total=0 | 0 |
| VV-INC-007 | Increment after decrement to zero | blast=0 (was 1) | Press 'A' | blast=1, total=1 | 1 |
| VV-INC-008 | Rapid increment (20x) | blast=0, total=0 | Press 'A' x20 | blast=20, total=20 | 20 |

#### 3.1.3 Output Template Verification

| VV-ID | Template | Input Data | Verification |
|-------|----------|-----------|--------------|
| VV-TPL-001 | Yale SOM (BM) | Case: TEST-001, blast=2, pro=5, gran=60, eryth=10, baso=1, eos=3, plasma=2, lymph=12, mono=5, total=100 | Output contains "TEST-001". Output contains "100" (total). All percentages present as integers. Handlebars placeholders resolved. |
| VV-TPL-002 | Precipio DX (BM) | Same as VV-TPL-001 | Output contains "TEST-001". Table format rendered. All cell types present. |
| VV-TPL-003 | MGH BM | Same as VV-TPL-001 | Output contains "TEST-001". All percentages present. |
| VV-TPL-004 | MGH PB | Case: TEST-002, poly=60, band=5, lymph=25, mono=5, eos=2, baso=1, pro=0, blast=0, other=2, total=100 | Output contains "TEST-002". PB cell types present. |
| VV-TPL-005 | Morphology comments | Case: TEST-003, comments: "Toxic granulation present in neutrophils." | Comments text appears in all output templates. |

### 3.2 Integration Verification

#### 3.2.1 End-to-End Data Integrity Test

This test verifies that data flows correctly from keyboard input through calculation to output.

**Test Procedure:**

1. **Setup**: Load application. Enter case "VV-E2E-001". Select Bone Marrow. Click Start Count.

2. **Input Phase**: Enter the following keystrokes:
   - 'A' x 3 (blast = 3)
   - 'S' x 8 (pro = 8)
   - 'D' x 55 (gran = 55)
   - 'F' x 12 (eryth = 12)
   - 'Z' x 2 (baso = 2)
   - 'X' x 4 (eos = 4)
   - 'C' x 3 (plasma = 3)
   - 'V' x 10 (lymph = 10)
   - 'B' x 3 (mono = 3)
   - **Total: 100**

3. **Checkpoint 1 — Table Verification**:
   - [ ] blast count = 3
   - [ ] pro count = 8
   - [ ] gran count = 55
   - [ ] eryth count = 12
   - [ ] baso count = 2
   - [ ] eos count = 4
   - [ ] plasma count = 3
   - [ ] lymph count = 10
   - [ ] mono count = 3
   - [ ] total = 100
   - [ ] blast % = 3.00
   - [ ] pro % = 8.00
   - [ ] gran % = 55.00
   - [ ] eryth % = 12.00
   - [ ] baso % = 2.00
   - [ ] eos % = 4.00
   - [ ] plasma % = 3.00
   - [ ] lymph % = 10.00
   - [ ] mono % = 3.00

4. **Undo/Correction Phase**:
   - Press Shift+'D' x 5 (gran reduces from 55 to 50, total = 95)
   - [ ] gran count = 50
   - [ ] total = 95
   - [ ] gran % = 52.63
   - [ ] blast % = 3.16
   - Press 'D' x 5 (gran back to 55, total = 100)
   - [ ] Values return to Checkpoint 1 values

5. **Click Count Done**:
   - [ ] No minimum count warning (100 >= threshold)
   - [ ] Count inputs become readonly
   - [ ] Keyboard presses no longer change counts
   - [ ] Output tabs appear

6. **Checkpoint 2 — Output Verification**:
   - [ ] "VV-E2E-001" appears in Yale SOM output
   - [ ] "VV-E2E-001" appears in Precipio DX output
   - [ ] "VV-E2E-001" appears in MGH output
   - [ ] Total "100" appears in all outputs
   - [ ] All percentages present in all outputs
   - [ ] Percentages in output match table display (within rounding for integer output)

7. **Copy to Clipboard**:
   - [ ] Click Copy button on active tab
   - [ ] "Copied!" confirmation appears
   - [ ] Paste in text editor — content matches displayed output

**Pass Criteria**: All checkboxes checked. No JavaScript console errors.

---

## 4. System Verification Summary

System verification confirms that each SRS requirement is met. The following table maps each SYS requirement to its verification evidence.

| SRS ID | Requirement Summary | Verification Method | Test Case(s) | Result |
|--------|-------------------|-------------------|--------------|--------|
| SYS-001 | Case number input field rendered | Inspection | TC-001 | |
| SYS-002 | Case number format validation | Test | TC-008, TC-009 | |
| SYS-003 | Start Count disabled when empty | Test | TC-001, TC-002 | |
| SYS-004 | Case number displayed persistently | Inspection | TC-004 | |
| SYS-005 | Start Count enabled within 100ms | Test | TC-003 | |
| SYS-006 | Data cleared on case change | Test | TC-005 | |
| SYS-007 | Confirmation dialog on case change | Inspection | TC-006 | |
| SYS-008 | Cancel restores previous case | Test | TC-007 | |
| SYS-010 | Specimen type dropdown | Inspection | TC-010 | |
| SYS-011 | Default is Bone Marrow | Inspection | TC-010 | |
| SYS-012 | Table switches with specimen type | Test | TC-011 | |
| SYS-013 | Cell types from templates.json | Test | TC-012, TC-013 | |
| SYS-014 | BM 9 cell types correct | Inspection | TC-012 | |
| SYS-015 | PB 9 cell types correct | Inspection | TC-013 | |
| SYS-016 | Selector locked after Start Count | Test | TC-014 | |
| SYS-017 | Selector re-enabled after reset | Test | TC-015 | |
| SYS-020 | Table has 4 rows | Inspection | TC-012 | |
| SYS-021 | Table has N+1 columns | Inspection | TC-012 | |
| SYS-022 | Count cells initialized to 0 | Test | TC-032 | |
| SYS-023 | Key mapping row displayed | Inspection | TC-012 | |
| SYS-024 | Integer counts only | Test | TC-020 | |
| SYS-025 | Total = sum of counts | Test | TC-028, TC-029 | |
| SYS-030 | Keydown listener attached | Test | TC-020 | |
| SYS-031 | Mapped key increments by 1 | Test | TC-020, TC-021 | |
| SYS-032 | Shift+key decrements by 1 | Test | TC-026 | |
| SYS-033 | No decrement below zero | Test | TC-027 | |
| SYS-034 | Total updates within 50ms | Test | TC-028 | |
| SYS-035 | Unmapped keys ignored | Test | TC-023 | |
| SYS-036 | Modifier keys ignored | Test | TC-024 | |
| SYS-037 | Visual flash on keypress | Inspection | TC-030 | |
| SYS-038 | BM key mapping verified | Test | TC-021 | |
| SYS-039 | PB key mapping verified | Test | TC-022 | |
| SYS-040 | Percentage formula correct | Test | VV-CALC-001 to 015 | |
| SYS-041 | 2 decimal place precision | Test | TC-045 | |
| SYS-042 | Division by zero handled | Test | TC-040, VV-CALC-001 | |
| SYS-043 | Recalculation within 50ms | Test | TC-111 | |
| SYS-044 | Sum within +/- 0.10% | Test | TC-046, VV-CALC-011/012 | |
| SYS-045 | Rounding method defined | Analysis | VV-CALC series | |
| SYS-050 | Count Done button rendered | Inspection | TC-050 | |
| SYS-051 | Count Done disabled before Start | Test | TC-057 | |
| SYS-052 | Minimum threshold defined | Test | TC-050, TC-054 | |
| SYS-053 | Below-minimum warning | Test | TC-051, TC-052, TC-053 | |
| SYS-054 | Keydown detached after Done | Test | TC-056 | |
| SYS-055 | Inputs locked after Done | Test | TC-055 | |
| SYS-056 | Output generated after Done | Test | TC-060, TC-061 | |
| SYS-060 | Templates from JSON | Test | TC-060 | |
| SYS-061 | Template data includes all fields | Test | TC-063, TC-064 | |
| SYS-062 | Tabbed output interface | Inspection | TC-060, TC-067 | |
| SYS-063 | Tab labels with favicons | Inspection | TC-060 | |
| SYS-064 | Copy to Clipboard button | Inspection | TC-065 | |
| SYS-065 | Clipboard API copy works | Test | TC-065 | |
| SYS-066 | Copy confirmation shown | Inspection | TC-066 | |
| SYS-067 | Case number in all output | Test | TC-062 | |
| SYS-070 | Morphology textarea rendered | Inspection | TC-070 | |
| SYS-071 | 500 character minimum | Test | TC-072 | |
| SYS-072 | Comments in output | Test | TC-068 | |
| SYS-073 | Comments field isolates keyboard | Test | TC-070, TC-071 | |
| SYS-080 | Reset button rendered | Inspection | TC-080 | |
| SYS-081 | Reset confirmation dialog | Test | TC-080 | |
| SYS-082 | Full state clear on reset | Test | TC-082 | |
| SYS-083 | No dialog when no data | Test | TC-084 | |
| SYS-084 | Focus on case input after reset | Test | TC-083 | |
| SYS-090 | Session history maintained | Test | TC-090 | |
| SYS-091 | History entry content | Test | TC-090 | |
| SYS-092 | Collapsible history panel | Inspection | TC-090 | |
| SYS-093 | Read-only history view | Test | TC-091 | |
| SYS-094 | Temporary data notice | Inspection | TC-094 | |
| SYS-095 | sessionStorage used | Test | TC-093 | |
| SYS-100 | Config fetched on load | Test | TC-060 | |
| SYS-101 | Config load error handling | Test | (manual test) | |
| SYS-102 | Config schema requirements | Inspection | SDD review | |
| SYS-103 | minCellCount from config | Test | TC-050, TC-054 | |

---

## 5. Validation Protocol

### 5.1 Validation Objective

Demonstrate that the MDC meets user needs as defined in URS-001 when used by representative clinical users in a simulated clinical environment.

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
- Application deployed on local Tomcat server

### 5.4 Validation Scenarios

#### Scenario V1: Normal Bone Marrow Differential (Happy Path)

**Objective**: Validate complete BM counting workflow from case entry to output copy.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Enter case number "BM25-00100" | Case field accepts input. Start Count enables. | URS-001, URS-004 |
| 2 | Verify specimen type is Bone Marrow | BM selected by default. BM cell types displayed. | URS-010, URS-012 |
| 3 | Click Start Count | Instructions update. Keyboard active. | URS-020 |
| 4 | Count 200 cells using keyboard keys | Counts and percentages update in real time. Total reaches 200. | URS-020-024, URS-030-031 |
| 5 | Intentionally miscount: press wrong key, then Shift+key to correct | Decrement works. Count adjusts. | URS-025-026 |
| 6 | Click Count Done | No minimum warning (200 >= 200). Output appears. | URS-040-041, URS-050 |
| 7 | Verify case number in output | "BM25-00100" in all tabs. | URS-052 |
| 8 | Copy output to clipboard and paste | Output text matches display. | URS-055 |
| 9 | Enter new case number | Confirmation dialog. Data cleared. | URS-003 |

**User Assessment Questions (post-scenario)**:
1. Was the counting workflow intuitive? (1-5 scale)
2. Were the keyboard mappings easy to learn? (1-5)
3. Was the undo (Shift+key) mechanism intuitive? (1-5)
4. Was the output format useful for your workflow? (1-5)
5. Any features missing that you would need? (free text)

#### Scenario V2: Peripheral Blood with Suboptimal Count

**Objective**: Validate PB workflow and minimum count warning.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Enter case "PB25-00050" | Case accepted. | URS-001 |
| 2 | Select Peripheral Blood | PB table shown. PB cell types. | URS-010, URS-012 |
| 3 | Count 50 cells | Counts/percentages update. | URS-020-024 |
| 4 | Click Count Done | Warning: count below 100 minimum. | URS-041-042 |
| 5 | Override warning (Continue) | Output generated despite low count. | URS-042 |
| 6 | Verify output includes case number and total | "PB25-00050" and "50" in output. | URS-052-053 |

#### Scenario V3: Accidental Reset Protection

**Objective**: Validate data protection during reset.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Enter case. Count 100 cells. | Active count in progress. | |
| 2 | Click Reset | Confirmation dialog appears. | URS-061 |
| 3 | Click Cancel | All data preserved. | URS-061 |
| 4 | Click Reset again, confirm OK | All data cleared. Focus on case input. | URS-060, URS-063 |

#### Scenario V4: Morphology Comments

**Objective**: Validate comments do not interfere with counting and appear in output.

| Step | User Action | Expected System Behavior | URS Trace |
|------|------------|-------------------------|-----------|
| 1 | Start counting | Keyboard active for counting. | |
| 2 | Click in morphology comments field | Focus moves to textarea. | URS-070 |
| 3 | Type "Auer rods seen in blasts." | Text appears in field. No cell counts change. | URS-070 |
| 4 | Click outside comments field | Keyboard counting resumes. | |
| 5 | Complete count and generate output | Comments included in output text. | URS-071 |

### 5.5 Validation Acceptance Criteria

| Criterion | Threshold | Method |
|-----------|-----------|--------|
| All critical workflow steps complete without error | 100% | Observation |
| User satisfaction ratings average >= 3.5 / 5 | >= 3.5 | Questionnaire |
| No data integrity errors observed | Zero | Observation + output review |
| All safety features function as designed | 100% | Observation |
| Output is usable for clinical documentation | Unanimous agreement | Clinical user judgment |

### 5.6 Validation Report Template

| Section | Content |
|---------|---------|
| Participants | Names, roles, qualifications |
| Environment | Hardware, software, browser versions |
| Scenarios Executed | List with pass/fail per step |
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

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| V&V Lead | | | |
| Clinical Reviewer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
