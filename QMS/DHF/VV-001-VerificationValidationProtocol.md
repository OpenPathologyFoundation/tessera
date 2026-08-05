# VV-001: Verification & Validation Protocol

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | VV-001 |
| **Version** | 2.0 |
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

## 3. Verification Protocol

### 3.1 Unit Verification -- Calculation Engine

The percentage calculation and M:E ratio computation are the most safety-critical computations in the system. They must be verified exhaustively with known inputs and expected outputs.

#### 3.1.1 Percentage Calculation Verification Table

Each row represents a test vector. The function under test is `calcPercent()` which computes `(cell_count / total) * 100` rounded to 2 decimal places. Cell order: nrbc, blasts, pro, myelo, meta, plasma, mast, bands, poly, baso, eos, mono, lymph, other.

| VV-ID | Test Vector | Cell Counts (nrbc,blasts,pro,myelo,meta,plasma,mast,bands,poly,baso,eos,mono,lymph,other) | Total | Expected Percentages | Pct Sum | Purpose |
|-------|------------|-------------------------------------------------------------------------------------------|-------|---------------------|---------|---------|
| VV-CALC-001 | All zeros | 0,0,0,0,0,0,0,0,0,0,0,0,0,0 | 0 | 0.00 for all | 0.00 | Division by zero |
| VV-CALC-002 | Single cell | 1,0,0,0,0,0,0,0,0,0,0,0,0,0 | 1 | 100.00,0,0,0,0,0,0,0,0,0,0,0,0,0 | 100.00 | Single cell = 100% |
| VV-CALC-003 | Two equal | 50,50,0,0,0,0,0,0,0,0,0,0,0,0 | 100 | 50.00,50.00,0,... | 100.00 | Even split |
| VV-CALC-004 | Fourteen equal | 10,10,10,10,10,10,10,10,10,10,10,10,10,10 | 140 | 7.14 each | ~100.00 | Fourteen-way split, repeating decimal |
| VV-CALC-005 | One dominant | 0,0,0,0,0,0,0,0,95,0,0,0,5,0 | 100 | 0,0,0,0,0,0,0,0,95.00,0,0,0,5.00,0 | 100.00 | Dominant cell type |
| VV-CALC-006 | All ones | 1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 14 | 7.14 each | ~100.00 | Minimum multitype |
| VV-CALC-007 | Standard BM diff (500 cells) | 50,10,15,40,60,5,2,30,150,3,8,25,80,22 | 500 | 10.00,2.00,3.00,8.00,12.00,1.00,0.40,6.00,30.00,0.60,1.60,5.00,16.00,4.40 | 100.00 | Normal bone marrow |
| VV-CALC-008 | Abnormal BM diff | 5,45,15,10,5,2,0,3,5,0,1,2,5,2 | 100 | 5.00,45.00,15.00,10.00,5.00,2.00,0.00,3.00,5.00,0.00,1.00,2.00,5.00,2.00 | 100.00 | Acute leukemia pattern |
| VV-CALC-009 | Small count (N=14) | 1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 14 | 7.14 each | ~100.00 | Low count scenario |
| VV-CALC-010 | Large count (N=500) | 50,10,15,40,60,5,2,30,150,3,8,25,80,22 | 500 | Same as VV-CALC-007 | 100.00 | Large count validation |
| VV-CALC-011 | Repeating thirds | 1,1,1,0,0,0,0,0,0,0,0,0,0,0 | 3 | 33.33,33.33,33.33,0,... | 99.99 | Rounding edge case |
| VV-CALC-012 | Repeating sevenths | 1,1,1,1,1,1,1,0,0,0,0,0,0,0 | 7 | 14.29 each (7 cells) | ~100.03 | Rounding accumulation |
| VV-CALC-013 | One of each + extra | 2,1,1,1,1,1,1,1,1,1,1,1,1,1 | 15 | 13.33,6.67,6.67,6.67,6.67,6.67,6.67,6.67,6.67,6.67,6.67,6.67,6.67,6.67 | ~100.00 | Near-even distribution |
| VV-CALC-014 | Max capacity | 714,714,714,714,714,714,714,714,714,714,714,714,714,714 | 9996 | 7.14 each | ~100.00 | Upper boundary |
| VV-CALC-015 | Standard PB diff | 0,0,0,0,0,0,0,5,60,1,2,8,22,2 | 100 | 0,0,0,0,0,0,0,5.00,60.00,1.00,2.00,8.00,22.00,2.00 | 100.00 | Normal peripheral blood |

**Pass Criteria**:
- Each individual percentage matches expected value to 2 decimal places
- Sum of percentages is within +/- 0.10% of 100.00% (when total > 0)
- No NaN, Infinity, or undefined values displayed
- No JavaScript errors in console

#### 3.1.2 M:E Ratio Verification Table

The M:E ratio is computed from config-defined formulas. The numerator sums myeloid cell types; the denominator is nrbc count. Result formatted as ratio:1.

| VV-ID | Test Vector | Myeloid Sum | Erythroid (nrbc) | Expected M:E | Purpose |
|-------|------------|-------------|------------------|--------------|---------|
| VV-ME-001 | Standard BM | 300 | 100 | 3.0:1 | Normal M:E ratio |
| VV-ME-002 | All erythroid | 0 | 100 | 0.0:1 | Zero myeloid |
| VV-ME-003 | All myeloid (erythroid=0) | 300 | 0 | N/A | Division by zero -- denominator zero |
| VV-ME-004 | Equal | 100 | 100 | 1.0:1 | Even split |

**Pass Criteria**:
- M:E ratio matches expected value to 1 decimal place
- "N/A" displayed when denominator = 0
- No JavaScript errors in console
- Value updates within 50ms of count change

#### 3.1.3 Increment/Decrement Verification Table

| VV-ID | Scenario | Initial Count | Action | Expected Count | Expected Total |
|-------|----------|---------------|--------|----------------|----------------|
| VV-INC-001 | Increment from zero | blasts=0, total=0 | Press 'L' | blasts=1, total=1 | 1 |
| VV-INC-002 | Increment existing | blasts=5, total=10 | Press 'L' | blasts=6, total=11 | 11 |
| VV-INC-003 | Decrement from positive | blasts=5, total=10 | Shift+'L' | blasts=4, total=9 | 9 |
| VV-INC-004 | Decrement from 1 | blasts=1, total=5 | Shift+'L' | blasts=0, total=4 | 4 |
| VV-INC-005 | Decrement from zero (boundary) | blasts=0, total=5 | Shift+'L' | blasts=0, total=5 | 5 |
| VV-INC-006 | Decrement only cell | blasts=1, total=1 | Shift+'L' | blasts=0, total=0 | 0 |
| VV-INC-007 | Increment after decrement to zero | blasts=0 (was 1) | Press 'L' | blasts=1, total=1 | 1 |
| VV-INC-008 | Rapid increment (20x) | blasts=0, total=0 | Press 'L' x20 | blasts=20, total=20 | 20 |

#### 3.1.4 Output Template Verification

| VV-ID | Template | Input Data | Verification |
|-------|----------|-----------|--------------|
| VV-TPL-001 | BM Template 1 | Case: TEST-001, nrbc=50, blasts=10, pro=15, myelo=40, meta=60, plasma=5, mast=2, bands=30, poly=150, baso=3, eos=8, mono=25, lymph=80, other=22, total=500 | Output contains "TEST-001". Output contains "500" (total). All 14 cell type percentages present. Handlebars placeholders resolved. |
| VV-TPL-002 | BM Template 2 | Same as VV-TPL-001 | Output contains "TEST-001". Table format rendered. All 14 cell types present. |
| VV-TPL-003 | BM Template 3 | Same as VV-TPL-001 | Output contains "TEST-001". All 14 cell type percentages present. |
| VV-TPL-004 | PB Template | Case: TEST-002, nrbc=0, blasts=0, pro=0, myelo=0, meta=0, plasma=0, mast=0, bands=5, poly=60, baso=1, eos=2, mono=8, lymph=22, other=2, total=100 | Output contains "TEST-002". All 14 cell types present. PB-appropriate values. |
| VV-TPL-005 | Morphology comments | Case: TEST-003, comments: "Toxic granulation present in neutrophils." | Comments text appears in all output templates. |
| VV-TPL-006 | M:E ratio in output | Case: TEST-004, BM with myeloid=300, nrbc=100 | M:E ratio "3.0:1" appears in BM output template. |

### 3.2 Integration Verification

#### 3.2.1 End-to-End Data Integrity Test

This test verifies that data flows correctly from keyboard input through calculation to output, including Continue Counting.

**Test Procedure:**

1. **Setup**: Load application. Enter case "VV-E2E-001". Select Bone Marrow. Click Start Count.

2. **Input Phase**: Enter the following keystrokes (14 cell types):
   - 'R' x 50 (nrbc = 50)
   - 'L' x 10 (blasts = 10)
   - 'O' x 15 (pro = 15)
   - 'M' x 40 (myelo = 40)
   - 'T' x 60 (meta = 60)
   - 'C' x 5 (plasma = 5)
   - 'S' x 2 (mast = 2)
   - 'B' x 30 (bands = 30)
   - 'P' x 150 (poly = 150)
   - 'A' x 3 (baso = 3)
   - 'E' x 8 (eos = 8)
   - 'N' x 25 (mono = 25)
   - 'Y' x 80 (lymph = 80)
   - 'X' x 22 (other = 22)
   - **Total: 500**

3. **Checkpoint 1 -- Table Verification**:
   - [ ] nrbc count = 50
   - [ ] blasts count = 10
   - [ ] pro count = 15
   - [ ] myelo count = 40
   - [ ] meta count = 60
   - [ ] plasma count = 5
   - [ ] mast count = 2
   - [ ] bands count = 30
   - [ ] poly count = 150
   - [ ] baso count = 3
   - [ ] eos count = 8
   - [ ] mono count = 25
   - [ ] lymph count = 80
   - [ ] other count = 22
   - [ ] total = 500
   - [ ] nrbc % = 10.00
   - [ ] blasts % = 2.00
   - [ ] pro % = 3.00
   - [ ] myelo % = 8.00
   - [ ] meta % = 12.00
   - [ ] plasma % = 1.00
   - [ ] mast % = 0.40
   - [ ] bands % = 6.00
   - [ ] poly % = 30.00
   - [ ] baso % = 0.60
   - [ ] eos % = 1.60
   - [ ] mono % = 5.00
   - [ ] lymph % = 16.00
   - [ ] other % = 4.40
   - [ ] Upper row subtotal = 182 (nrbc+blasts+pro+myelo+meta+plasma+mast)
   - [ ] Lower row subtotal = 318 (bands+poly+baso+eos+mono+lymph+other)
   - [ ] M:E ratio displayed (myeloid cells / nrbc)

4. **Undo/Correction Phase**:
   - Press Shift+'P' x 5 (poly reduces from 150 to 145, total = 495)
   - [ ] poly count = 145
   - [ ] total = 495
   - [ ] poly % = 29.29
   - [ ] blasts % = 2.02
   - [ ] M:E ratio updated
   - Press 'P' x 5 (poly back to 150, total = 500)
   - [ ] Values return to Checkpoint 1 values

5. **Click Count Done**:
   - [ ] No blocking dialog (500 >= 500 advisory target)
   - [ ] Count inputs become readonly
   - [ ] Keyboard presses no longer change counts
   - [ ] Output tabs appear
   - [ ] M:E ratio appears in output

6. **Checkpoint 2 -- Output Verification**:
   - [ ] "VV-E2E-001" appears in all output tabs
   - [ ] Total "500" appears in all outputs
   - [ ] All 14 cell type percentages present in all outputs
   - [ ] Percentages in output match table display (within rounding for integer output)
   - [ ] M:E ratio present in BM output

7. **Continue Counting Phase**:
   - [ ] Continue Counting button visible on results screen
   - Click Continue Counting
   - [ ] Returns to counting phase
   - [ ] All 14 tallies preserved (nrbc=50, blasts=10, pro=15, etc.)
   - [ ] Total = 500
   - [ ] Keyboard listener active
   - Press 'P' x 50 (poly = 200, total = 550)
   - [ ] poly count = 200
   - [ ] total = 550
   - [ ] Percentages recalculated
   - [ ] M:E ratio updated

8. **Re-Finalize**:
   - Click Count Done
   - [ ] Output regenerated with total = 550
   - [ ] Updated percentages in output
   - [ ] M:E ratio updated in output

9. **Copy to Clipboard**:
   - [ ] Click Copy button on active tab
   - [ ] "Copied!" confirmation appears
   - [ ] Paste in text editor -- content matches displayed output

**Pass Criteria**: All checkboxes checked. No JavaScript console errors.

---

## 4. System Verification Summary

System verification confirms that each SRS requirement is met. The following table maps each SYS requirement to its verification evidence.

| SRS ID | Requirement Summary | Verification Method | Test Case(s) | Result |
|--------|-------------------|-------------------|--------------|--------|
| SYS-001 | Case number input field rendered | Inspection | TC-001 | |
| SYS-002 | Case number format validation | Test | TC-008 | |
| SYS-003 | Start Count enabled by default (case# optional) | Test | TC-001, TC-002, TC-003 | |
| SYS-004 | Case number displayed persistently | Inspection | TC-004 | |
| SYS-005 | Start Count enabled on page load | Test | TC-003 | |
| SYS-006 | Data cleared on case change | Test | TC-005 | |
| SYS-007 | Confirmation dialog on case change | Inspection | TC-006 | |
| SYS-008 | Cancel restores previous case | Test | TC-007 | |
| SYS-009 | Enter key starts counting | Test | TC-009 | |
| SYS-010 | Specimen type dropdown | Inspection | TC-010 | |
| SYS-011 | Default is Bone Marrow | Inspection | TC-010 | |
| SYS-012 | Table switches with specimen type | Test | TC-011 | |
| SYS-013 | Cell types from templates.json | Test | TC-012, TC-013 | |
| SYS-014 | 14 cell types in upper row | Inspection | TC-012 | |
| SYS-015 | 14 cell types in lower row | Inspection | TC-012 | |
| SYS-016 | Selector locked after Start Count | Test | TC-014 | |
| SYS-017 | Selector re-enabled after reset | Test | TC-015 | |
| SYS-020 | Two-row table layout | Inspection | TC-012, TC-017 | |
| SYS-021 | Table has N+1 columns per row | Inspection | TC-012 | |
| SYS-022 | Count cells initialized to 0 | Test | TC-032 | |
| SYS-023 | Key mapping row displayed | Inspection | TC-012 | |
| SYS-024 | Integer counts only | Test | TC-020 | |
| SYS-025 | Total = sum of counts | Test | TC-028, TC-029 | |
| SYS-027 | Upper row visual flagging (PB) | Test | TC-016 | |
| SYS-028 | Subtotal rows | Test | TC-017 | |
| SYS-030 | Keydown listener attached | Test | TC-020 | |
| SYS-031 | Mapped key increments by 1 | Test | TC-020, TC-021 | |
| SYS-032 | Shift+key decrements by 1 | Test | TC-026 | |
| SYS-033 | No decrement below zero | Test | TC-027 | |
| SYS-034 | Total updates within 50ms | Test | TC-028 | |
| SYS-035 | Unmapped keys ignored | Test | TC-023 | |
| SYS-036 | Modifier keys ignored | Test | TC-024 | |
| SYS-037 | Visual flash on keypress | Inspection | TC-030 | |
| SYS-038 | Unified 14-key mapping | Test | TC-021 | |
| SYS-039 | PB = BM mapping (same keys) | Test | TC-022 | |
| SYS-040 | Percentage formula correct | Test | VV-CALC-001 to 015 | |
| SYS-041 | 2 decimal place precision | Test | TC-045 | |
| SYS-042 | Division by zero handled | Test | TC-040, VV-CALC-001 | |
| SYS-043 | Recalculation within 50ms | Test | TC-111 | |
| SYS-044 | Sum within +/- 0.10% | Test | TC-046, VV-CALC-011/012 | |
| SYS-045 | Rounding method defined | Analysis | VV-CALC series | |
| SYS-046 | Derived formula computation (M:E ratio) | Test | TC-048a, TC-140, TC-142, VV-ME-001 to 004 | |
| SYS-047 | Live formula display (M:E ratio) | Test | TC-143, TC-144, VV-ME-001 to 004 | |
| SYS-050 | Count Done button rendered | Inspection | TC-050 | |
| SYS-051 | Count Done disabled before Start | Test | TC-057 | |
| SYS-052 | Advisory target count (BM=500, PB=200) | Test | TC-050, TC-054 | |
| SYS-053 | Non-blocking informational note | Test | TC-051, TC-053 | |
| SYS-054 | Keydown detached after Done | Test | TC-056 | |
| SYS-055 | Inputs locked after Done | Test | TC-055 | |
| SYS-056 | Output generated after Done | Test | TC-060, TC-061 | |
| SYS-057 | Continue Counting button | Test | TC-130, TC-131 | |
| SYS-058 | Continue Counting preserves tallies | Test | TC-058, TC-059, TC-131, TC-132, TC-133 | |
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
| SYS-074 | Comments preserved across resume | Test | TC-074, TC-075 | |
| SYS-080 | Reset button rendered | Inspection | TC-080 | |
| SYS-081 | Reset confirmation dialog | Test | TC-080 | |
| SYS-082 | Full state clear on reset (Start Count remains enabled) | Test | TC-082 | |
| SYS-083 | No dialog when no data | Test | TC-084 | |
| SYS-084 | Focus on case input after reset | Test | TC-083 | |
| SYS-090 | Session history maintained | Test | TC-090 | |
| SYS-091 | History entry content | Test | TC-090 | |
| SYS-092 | Collapsible history panel | Inspection | TC-090 | |
| SYS-093 | Read-only history view | Test | TC-091 | |
| SYS-094 | Temporary data notice | Inspection | TC-094 | |
| SYS-095 | sessionStorage used | Test | TC-093 | |
| SYS-096 | Export to JSON | Test | TC-095 | |
| SYS-097 | Export to CSV | Test | TC-096 | |
| SYS-100 | Config fetched on load | Test | TC-060 | |
| SYS-101 | Config load error handling | Test | (manual test) | |
| SYS-102 | Config schema (targetCount, categories, formulas) | Inspection | SDD review | |
| SYS-103 | targetCount from config | Test | TC-050, TC-054, TC-127 | |
| SYS-110 | Theme toggle control | Test | TC-120 | |
| SYS-111 | Theme toggle shortcut | Test | TC-121 | |
| SYS-112 | Theme persists for session | Test | TC-122 | |
| SYS-120 | Progress indicator display | Test | TC-125, TC-126 | |
| SYS-121 | Progress indicator target per specimen | Test | TC-127 | |

---

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
| B | 2026-02-24 | QMS | v2.0 - Major update: 14-cell vectors (nrbc,blasts,pro,myelo,meta,plasma,mast,bands,poly,baso,eos,mono,lymph,other), M:E ratio verification (VV-ME-001 to 004), updated key references ('L' for blasts), 14-key E2E test, Continue Counting checkpoint, VV-TPL-006 for M:E in output, advisory target (non-blocking), validation scenarios V5 (Continue Counting) and V6 (M:E ratio), updated system verification table with new SYS IDs, Node.js test environment |

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| V&V Lead | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Clinical Reviewer | | | |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
