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

### 5.1 Case Identification Tests (TC-001 through TC-009)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-001 | Start Count enabled by default with empty case field | SYS-003 | HA-001 | **P1** | 1. Load application. 2. Leave case number field empty. 3. Observe Start Count button. | Start Count button is enabled and clickable. Case number is optional. | |
| TC-002 | Start Count still enabled with whitespace-only case | SYS-003 | HA-001 | **P1** | 1. Enter "   " (spaces) in case field. 2. Observe Start Count button. | Button remains enabled. Start Count is always available. | |
| TC-003 | Start Count enabled immediately on page load regardless of case field | SYS-003, SYS-005 | HA-001 | **P1** | 1. Load application fresh. 2. Observe Start Count button immediately. | Button is enabled on page load without any user interaction. | |
| TC-004 | Case number displayed persistently during counting | SYS-004 | HA-002 | P2 | 1. Enter "H25-00567". 2. Click Start Count. 3. Scroll down if applicable. | Case number "H25-00567" visible in fixed header at all times. | |
| TC-005 | Data cleared on case number change during active session | SYS-006 | HA-003 | **P1** | 1. Enter "CASE-A". 2. Start Count. 3. Count 10 cells. 4. Change case number to "CASE-B". 5. Confirm the dialog. | All counts = 0, percentages = 0.00, output cleared, total = 0. | |
| TC-006 | Confirmation dialog shown on case change with data | SYS-007 | HA-003 | **P1** | 1. Enter case, start count, count cells. 2. Change case number. | Confirmation dialog appears with message about clearing data. | |
| TC-007 | Cancel case change preserves data | SYS-008 | HA-003 | **P1** | 1. Enter "CASE-A", count 15 cells. 2. Change case number. 3. Click Cancel. | Case number reverts to "CASE-A". All counts preserved. | |
| TC-008 | Case number accepts alphanumeric, hyphens, slashes | SYS-002 | - | P3 | 1. Enter "25-A/12345". 2. Observe acceptance. | Value accepted; Start Count remains enabled. | |
| TC-009 | Enter key starts counting even with empty case field | SYS-009 | - | P3 | 1. Leave case field empty. 2. Press Enter. | Counting phase begins. Keyboard listener activated. | |

### 5.2 Specimen Type Tests (TC-010 through TC-017)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-010 | Default specimen type is Bone Marrow | SYS-011 | - | P3 | 1. Load application. | Dropdown shows "Bone Marrow". BM table visible. | |
| TC-011 | Switching to PB shows PB table | SYS-012 | HA-014 | P2 | 1. Select "Peripheral Blood". | PB table shown with same 14 cell types as BM in two-row layout. | |
| TC-012 | BM displays 14 cell types in two rows | SYS-014, SYS-015 | HA-010 | P2 | 1. Observe BM table layout. | Upper row: nrbc, blasts, pro, myelo, meta, plasma, mast. Lower row: bands, poly, baso, eos, mono, lymph, other. Subtotals for each row. | |
| TC-013 | PB displays same 14 cell types as BM | SYS-014, SYS-015, SYS-039 | HA-010 | P2 | 1. Select PB. 2. Observe table layout. | Same 14 cell types in same two-row layout as BM. Unified mapping. | |
| TC-014 | Specimen selector locked after Start Count | SYS-016 | HA-014 | P2 | 1. Click Start Count. 2. Try to change specimen type. | Dropdown is disabled. | |
| TC-015 | Specimen selector re-enabled after reset | SYS-017 | - | P3 | 1. Start count. 2. Reset. 3. Observe dropdown. | Dropdown is enabled. | |
| TC-016 | Upper row visual flagging in PB mode | SYS-027 | - | P2 | 1. Select PB. 2. Start Count. 3. Press 'L' (blasts) to increment. | Non-zero upper row cells display amber border in PB mode. | |
| TC-017 | Subtotals display correctly for each row group | SYS-028 | - | P2 | 1. Start Count. 2. Count cells across both rows. | Upper row subtotal = sum of upper row cells. Lower row subtotal = sum of lower row cells. Grand total = upper + lower. | |

### 5.3 Counting Tests (TC-020 through TC-039)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-020 | Pressing 'L' increments blasts by 1 | SYS-031, SYS-038 | HA-010 | **P1** | 1. BM selected. 2. Start Count. 3. Press 'L'. | blasts count = 1, total = 1. | |
| TC-021 | All 14 keys map correctly | SYS-038 | HA-010 | **P1** | 1. Start Count. 2. Press R, L, O, M, T, C, S, B, P, A, E, N, Y, X once each. | nrbc=1, blasts=1, pro=1, myelo=1, meta=1, plasma=1, mast=1, bands=1, poly=1, baso=1, eos=1, mono=1, lymph=1, other=1, total=14. | |
| TC-022 | PB uses same 14 keys as BM | SYS-038, SYS-039 | HA-010 | **P1** | 1. PB selected. 2. Start Count. 3. Press R, L, O, M, T, C, S, B, P, A, E, N, Y, X once each. | Same 14 cell types incremented: nrbc=1, blasts=1, pro=1, myelo=1, meta=1, plasma=1, mast=1, bands=1, poly=1, baso=1, eos=1, mono=1, lymph=1, other=1, total=14. | |
| TC-023 | Unmapped key is ignored | SYS-035 | - | P3 | 1. Start Count. 2. Press 'W' (not mapped). | No count changes. Total unchanged. | |
| TC-024 | Modifier key (Ctrl+A) is ignored | SYS-036 | - | P3 | 1. Start Count. 2. Press Ctrl+A. | No count changes. No browser "select all" action during counting. | |
| TC-025 | Rapid sequential keypresses all register | SYS-031, SYS-P02 | HA-011 | P2 | 1. Start Count. 2. Press 'L' rapidly 20 times. | blasts = 20, total = 20. Each press <50ms response. | |
| TC-026 | Shift+L decrements blasts by 1 | SYS-032 | HA-013 | **P1** | 1. Start Count. 2. Press 'L' 5 times (blasts=5). 3. Press Shift+L. | blasts = 4, total = 4. | |
| TC-027 | Shift+key does not go below zero | SYS-033 | HA-013 | **P1** | 1. Start Count (all counts = 0). 2. Press Shift+L. | blasts = 0, total = 0. No negative values. | |
| TC-028 | Total updates correctly with increment | SYS-034 | HA-023 | **P1** | 1. Press L (blasts=1, total=1). 2. Press O (pro=1, total=2). 3. Press L (blasts=2, total=3). | Total = 3. | |
| TC-029 | Total updates correctly with decrement | SYS-034 | HA-023 | **P1** | 1. Counts: blasts=5, pro=3, total=8. 2. Press Shift+L. | blasts=4, total=7. | |
| TC-030 | Visual feedback on keypress | SYS-037 | HA-011 | P2 | 1. Press 'L'. 2. Observe blasts cell. | Brief color flash (green/highlight) for ~150ms. | |
| TC-031 | Multiple cells counted to high values | SYS-P04 | - | P3 | 1. Count to total = 500. | All counts display correctly. No slowdown. Percentages correct. | |
| TC-032 | Count input fields initialized to 0 | SYS-022 | - | P3 | 1. Load application. | All 14 count fields show 0. Total shows 0. | |

### 5.4 Percentage Calculation Tests (TC-040 through TC-049)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-040 | Division by zero: all counts = 0 | SYS-042 | HA-021 | **P1** | 1. Observe percentages before counting. | All 14 percentages display "0.00". No NaN, no Infinity, no errors. | |
| TC-041 | Single cell counted: 1/1 = 100% | SYS-040 | HA-020 | **P1** | 1. Press 'L' once. | blasts = 100.00%, all others = 0.00%, total pct = 100.00%. | |
| TC-042 | Two equal cells: 50/50 split | SYS-040 | HA-020 | **P1** | 1. Press 'L' 5 times, 'O' 5 times. | blasts = 50.00%, pro = 50.00%, total = 10. | |
| TC-043 | Known differential: 100-cell standard (14 types) | SYS-040 | HA-020 | **P1** | 1. Enter: nrbc=5, blasts=2, pro=3, myelo=8, meta=12, plasma=1, mast=0, bands=10, poly=35, baso=1, eos=3, mono=5, lymph=12, other=3 (total=100). | nrbc=5.00, blasts=2.00, pro=3.00, myelo=8.00, meta=12.00, plasma=1.00, mast=0.00, bands=10.00, poly=35.00, baso=1.00, eos=3.00, mono=5.00, lymph=12.00, other=3.00. Sum=100.00. | |
| TC-044 | Repeating decimal: 1/3 | SYS-041 | HA-022 | P2 | 1. Count 3 cells, one each of L, O, M. | Each shows 33.33%. Sum within 0.10% of 100%. | |
| TC-045 | Percentage precision: 2 decimal places | SYS-041 | - | P2 | 1. Count 7 cells of one type, 3 of another (total=10). | 70.00% and 30.00% (exactly 2 decimal places shown). | |
| TC-046 | Percentage sum validation | SYS-044 | HA-022 | P2 | 1. Count various cells to total=200. 2. Sum all displayed percentages. | Sum is between 99.90% and 100.10%. | |
| TC-047 | Percentage after decrement | SYS-031, SYS-040 | HA-020 | **P1** | 1. L=5, O=5 (total=10, each 50%). 2. Shift+L. | blasts=4/9=44.44%, pro=5/9=55.56%, total=9. | |
| TC-048 | All cells equal (14-way split) | SYS-040 | HA-022 | P2 | 1. Press each of 14 keys once (total=14). | Each cell = 7.14%. Sum within tolerance. | |
| TC-048a | M:E ratio computation (BM) | SYS-046, SYS-047 | HA-070 | **P1** | 1. BM selected. 2. Count: nrbc=100, blasts=10, pro=20, myelo=30, meta=40, bands=50, poly=150 (myeloid sum via formula). | M:E ratio computed from config formula. Myeloid numerator / nrbc denominator displayed as ratio:1. | |
| TC-048b | M:E ratio N/A when no erythroid cells | SYS-046, SYS-047 | HA-072 | **P1** | 1. BM selected. 2. Count cells with nrbc=0. | M:E ratio displays "N/A". No division by zero error. | |
| TC-049 | Large count percentage accuracy | SYS-040, SYS-P04 | - | P3 | 1. Count to total=1000 with known distribution across 14 types. | All percentages match expected to 2 decimal places. | |

### 5.5 Count Completion Tests (TC-050 through TC-059)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-050 | Count Done with BM >= 500 (advisory target) | SYS-052, SYS-056 | HA-030 | **P1** | 1. BM selected. 2. Count 500 cells. 3. Click Count Done. | Output generated. No blocking dialog. Advisory target met. | |
| TC-051 | Count Done with count below BM advisory target | SYS-052, SYS-053 | HA-030 | **P1** | 1. BM selected. 2. Count 50 cells. 3. Click Count Done. | Non-blocking informational note displayed indicating count is below 500 advisory target. Count finalizes directly. | |
| TC-053 | Count finalized directly with informational note | SYS-053 | HA-030 | **P1** | 1. Below-target count. 2. Click Count Done. | Informational note displayed. Output generated immediately. No modal dialog to cancel or override. | |
| TC-054 | PB advisory target check (>= 200) | SYS-052 | HA-030 | **P1** | 1. PB selected. 2. Count 50 cells. 3. Click Count Done. | Non-blocking informational note referencing PB advisory target of 200. Output generated. | |
| TC-055 | Inputs locked after Count Done | SYS-055 | HA-031 | P2 | 1. Count Done. 2. Try to change a count field manually. | All count inputs are readonly. | |
| TC-056 | Keydown listener removed after Count Done | SYS-054 | HA-015 | P2 | 1. Count Done. 2. Press mapped key. | No count changes. | |
| TC-057 | Count Done button disabled before Start Count | SYS-051 | - | P3 | 1. Page loaded (don't click Start Count). 2. Observe Count Done button. | Count Done button is disabled. | |
| TC-058 | Continue Counting preserves all tallies | SYS-057, SYS-058 | HA-071 | **P1** | 1. Count 200 cells. 2. Click Count Done. 3. Click Continue Counting. | Returns to counting phase. All 14 cell tallies preserved. Total preserved. Keyboard listener reactivated. | |
| TC-059 | Continue Counting allows adding more cells and re-finalizing | SYS-057, SYS-058 | HA-071 | **P1** | 1. After Continue Counting, press additional keys. 2. Click Count Done again. | New cells added to existing tallies. Updated output generated with new totals and percentages. | |

### 5.6 Output Generation Tests (TC-060 through TC-069)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-060 | BM output: all tabs generated | SYS-062 | HA-050 | P2 | 1. Complete BM count. 2. Click Count Done. | Output tabs generated per config. Each contains output text with 14 cell types. | |
| TC-061 | PB output: tabs generated | SYS-062 | HA-050 | P2 | 1. Complete PB count. 2. Click Count Done. | Output tabs generated per config. Contains output text with 14 cell types. | |
| TC-062 | Case number appears in all output | SYS-067 | HA-004 | **P1** | 1. Case "S25-1234". 2. Complete count. 3. Check each output tab. | "S25-1234" is the first element in each output. | |
| TC-063 | Total count appears in output | SYS-061 | - | P2 | 1. Count 500 cells. 2. Check output. | "500" appears in output text. | |
| TC-064 | Percentages in output match table | SYS-061 | HA-024 | P2 | 1. Known count: blasts=10 of 100 total. 2. Check output. | Output shows blasts as 10% (rounded integer). Table shows 10.00%. | |
| TC-065 | Copy to Clipboard works | SYS-065 | HA-042 | P2 | 1. Complete count. 2. Click Copy to Clipboard on first tab. 3. Paste in text editor. | Pasted text matches output content including case number. | |
| TC-066 | Copy confirmation displayed | SYS-066 | - | P3 | 1. Click Copy to Clipboard. | "Copied!" message appears for ~2 seconds. | |
| TC-067 | Tab switching works | SYS-062 | HA-051 | P3 | 1. Click each tab. | Correct content displayed for each tab. Active tab highlighted. | |
| TC-068 | Morphology comments included in output | SYS-072 | HA-052 | P2 | 1. Enter "Toxic granulation noted." 2. Complete count. 3. Check output. | "Toxic granulation noted." appears in output. | |
| TC-069 | M:E ratio appears in BM output templates | SYS-047 | HA-070 | P2 | 1. Complete BM count with known myeloid/erythroid distribution. 2. Check output. | M:E ratio value present in BM output. Matches live display during counting. | |

### 5.7 Morphology Comments Tests (TC-070 through TC-075)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-070 | Comments field does not trigger counting | SYS-073 | - | P2 | 1. Start Count. 2. Click in morphology comments field. 3. Type "abc". | No cell counts change. "abc" appears in text area. | |
| TC-071 | Counting resumes after leaving comments field | SYS-073 | - | P2 | 1. Type in comments field. 2. Click elsewhere. 3. Press 'L'. | blasts increments. | |
| TC-072 | Comments accept 500 characters | SYS-071 | - | P3 | 1. Enter 500-character string. | All characters accepted. | |
| TC-073 | Comments cleared on reset | SYS-082 | - | P3 | 1. Enter comment. 2. Reset. | Comment field is empty. | |

### 5.8 Reset Tests (TC-080 through TC-089)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-080 | Reset with active count data shows confirmation | SYS-081 | HA-040 | P2 | 1. Count 10 cells. 2. Click Reset. | Confirmation dialog: "This will clear all count data for case {X}. Continue?" | |
| TC-081 | Reset confirmation - cancel preserves data | SYS-081 | HA-040 | P2 | 1. Count 10 cells. 2. Click Reset. 3. Click Cancel. | All data preserved. Counting can continue. | |
| TC-082 | Reset confirmation - OK clears all data | SYS-082 | - | P2 | 1. Count 10 cells. 2. Click Reset. 3. Click OK. | All counts = 0, percentages = 0.00, case number cleared, output cleared, comments cleared. Start Count remains enabled. | |
| TC-083 | After reset, focus on case number input | SYS-084 | - | P3 | 1. Complete reset. | Cursor is in case number input field. | |
| TC-084 | Reset with no data skips confirmation | SYS-083 | - | P3 | 1. No counting done. 2. Click Reset. | Immediate reset, no dialog. | |
| TC-085 | Specimen selector re-enabled after reset | SYS-017 | - | P3 | 1. Start Count (selector locked). 2. Reset. | Specimen selector dropdown enabled. | |

### 5.9 Session History Tests (TC-090 through TC-096)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-090 | Completed count saved to session history | SYS-090 | - | P3 | 1. Complete a count. 2. Open session history. | Entry shows case number, specimen type, timestamp, total. | |
| TC-091 | History entry is read-only | SYS-093 | - | P3 | 1. Click on history entry. | Read-only overlay with full data. No editing possible. | |
| TC-092 | Multiple sessions in history | SYS-090 | - | P3 | 1. Complete 3 different cases. 2. Check history. | All 3 entries present in order. | |
| TC-093 | Session history persists on page reload | SYS-095 | - | P3 | 1. Complete a count. 2. Reload page. 3. Check history. | Previous session(s) still in history (from sessionStorage). | |
| TC-094 | Temporary data notice displayed | SYS-094 | - | P3 | 1. Open session history. | Notice about data being temporary visible. | |
| TC-095 | Export session history to JSON | SYS-096, SYS-097 | - | P3 | 1. Complete a count. 2. Click Export JSON. 3. Open downloaded file. | JSON file downloads and contains session fields (case number, specimen, timestamp, totals, counts, percentages, comments, outputs). | |
| TC-096 | Export session history to CSV | SYS-096, SYS-097 | - | P3 | 1. Complete a count. 2. Click Export CSV. 3. Open downloaded file. | CSV file downloads and contains session fields for each case. | |

### 5.10 Cross-Browser Tests (TC-100 through TC-105)

| TC ID | Test Case | SRS Trace | Browsers | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|----------|-------|-----------------|-----------|
| TC-100 | Full workflow in Chrome | SYS-I01 | Chrome | Execute TC-003, TC-021, TC-043, TC-050, TC-062, TC-065, TC-058 | All pass. | |
| TC-101 | Full workflow in Firefox | SYS-I02 | Firefox | Execute TC-003, TC-021, TC-043, TC-050, TC-062, TC-065, TC-058 | All pass. | |
| TC-102 | Full workflow in Edge | SYS-I03 | Edge | Execute TC-003, TC-021, TC-043, TC-050, TC-062, TC-065, TC-058 | All pass. | |
| TC-103 | Offline operation after initial load | SYS-I04 | All | 1. Load page. 2. Disconnect network. 3. Complete a count. | Full workflow completes without errors. | |

### 5.11 Performance Tests (TC-110 through TC-113)

| TC ID | Test Case | SRS Trace | Method | Expected Result | Pass/Fail |
|-------|----------|-----------|--------|-----------------|-----------|
| TC-110 | Page load time < 3 seconds | SYS-P01 | Browser dev tools Performance tab | Time to interactive < 3s. | |
| TC-111 | Keypress response < 50ms | SYS-P02 | console.time() around addToCell | Display update < 50ms from keydown event. | |
| TC-112 | Output rendering < 500ms | SYS-P03 | console.time() around countDone | All templates rendered within 500ms. | |
| TC-113 | 9999-cell count without degradation | SYS-P04 | Automated key injection | Application responsive. All calculations correct. | |

### 5.12 Presentation & Theme Tests (TC-120 through TC-122)

| TC ID | Test Case | SRS Trace | Method | Expected Result | Pass/Fail |
|-------|----------|-----------|--------|-----------------|-----------|
| TC-120 | Theme toggle control switches between light and dark | SYS-110 | UI | Clicking the theme button changes the UI palette without altering counts or session data. | |
| TC-121 | Theme toggle shortcut (Ctrl/Cmd+Shift+L) works | SYS-111 | UI | Shortcut toggles theme and does not interfere with counting keys. | |
| TC-122 | Theme persists for session | SYS-112 | UI | Refreshing the page retains the selected theme within the same browser session. | |

### 5.13 Progress Indicator Tests (TC-125 through TC-127)

| TC ID | Test Case | SRS Trace | Method | Expected Result | Pass/Fail |
|-------|----------|-----------|--------|-----------------|-----------|
| TC-125 | Progress indicator displays "N / target (target)" format | SYS-120, SYS-121 | UI | During counting, progress shows current count / advisory target in correct format. | |
| TC-126 | Progress indicator updates on each keypress | SYS-120 | UI | Each increment/decrement updates the progress display immediately. | |
| TC-127 | Progress indicator reflects correct target per specimen type | SYS-121 | UI | BM shows target=500, PB shows target=200. | |

### 5.14 Continue Counting Tests (TC-130 through TC-133)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-130 | Continue Counting button visible on results screen | SYS-057 | HA-071 | **P1** | 1. Complete count. 2. Click Count Done. 3. Observe results screen. | Continue Counting button is visible and clickable. | |
| TC-131 | Clicking Continue Counting returns to counting with tallies preserved | SYS-057, SYS-058 | HA-071 | **P1** | 1. Count 200 cells across multiple types. 2. Click Count Done. 3. Click Continue Counting. | Returns to counting phase. All 14 cell tallies match pre-finalization values. Total preserved. Keyboard active. | |
| TC-132 | Adding cells after Continue Counting updates totals correctly | SYS-058 | HA-071 | **P1** | 1. After Continue Counting, press 'L' 10 times. | blasts increases by 10. Total increases by 10. Percentages recalculated. | |
| TC-133 | Re-clicking Count Done generates updated output | SYS-058 | HA-071 | **P1** | 1. After Continue Counting and adding cells. 2. Click Count Done. | Output regenerated with updated totals and percentages. | |

### 5.15 M:E Ratio Tests (TC-140 through TC-144)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-140 | M:E ratio displayed during BM counting | SYS-046, SYS-047 | HA-070 | **P1** | 1. BM selected. 2. Start Count. 3. Count myeloid and erythroid cells. | M:E ratio displayed and updates in real time. | |
| TC-141 | M:E ratio not displayed for PB | SYS-046, SYS-047 | - | P2 | 1. PB selected. 2. Start Count. 3. Count cells. | M:E ratio field is not shown or is hidden for PB. | |
| TC-142 | M:E ratio = N/A when nrbc = 0 | SYS-046 | HA-072 | **P1** | 1. BM selected. 2. Count only myeloid cells (nrbc=0). | M:E ratio displays "N/A". No errors. | |
| TC-143 | M:E ratio updates in real time | SYS-047 | HA-070 | **P1** | 1. BM selected. 2. Press 'R' (nrbc) then 'L' (blasts). 3. Observe M:E display after each keypress. | M:E ratio recalculates and displays updated value within 50ms of each keypress. | |
| TC-144 | M:E ratio appears in BM output templates | SYS-047 | HA-070 | P2 | 1. Complete BM count. 2. Click Count Done. 3. Inspect output. | M:E ratio value included in BM output. | |

### 5.16 Comments Preservation Tests (TC-074 through TC-075)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-074 | Comments preserved across Continue Counting | SYS-074 | - | P2 | 1. Enter "Auer rods seen." in comments. 2. Click Count Done. 3. Click Continue Counting. | Comments field still contains "Auer rods seen." | |
| TC-075 | Comments editable after Continue Counting | SYS-074 | - | P2 | 1. After Continue Counting. 2. Add text to comments field. | Additional text can be appended. Original text preserved. | |

---

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
