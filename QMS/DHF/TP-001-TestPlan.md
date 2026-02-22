# TP-001: Test Plan

## Tessera

| Field | Value |
|-------|-------|
| **Document ID** | TP-001 |
| **Version** | 1.0 |
| **Product** | Tessera |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001, SRS-001, SDD-001, RA-001 |

---

## 1. Purpose

This document defines the test strategy, test cases, acceptance criteria, and pass/fail criteria for verifying Tessera against the System Requirements Specification (SRS-001). Testing shall demonstrate that the software meets all functional, performance, and safety requirements.

## 2. Scope

### 2.1 In Scope
- Functional testing of all system requirements (SYS-xxx)
- Boundary value testing for calculations
- UI/UX verification
- Cross-browser compatibility testing
- Performance testing (response time requirements)
- Risk-based testing (all FMEA mitigations)

### 2.2 Out of Scope
- Penetration testing / security audit
- Load testing (single-user application)
- Accessibility testing (WCAG compliance)
- Server infrastructure testing

## 3. Test Environment

| Component | Specification |
|-----------|--------------|
| **Test Machine** | Standard laboratory workstation (Intel i5+, 8GB+ RAM) |
| **Operating Systems** | Windows 10/11, macOS 12+ |
| **Browsers** | Google Chrome (latest 2 versions), Mozilla Firefox (latest 2 versions), Microsoft Edge (latest 2 versions) |
| **Application Server** | Apache Tomcat 9.x or equivalent Servlet 3.1+ container |
| **Network** | Standard LAN connection; offline testing for SYS-I04 |
| **Test Data** | Predefined test scenarios with known expected results |

## 4. Test Strategy

### 4.1 Test Levels

| Level | Description | Responsibility |
|-------|-------------|---------------|
| Unit Tests | Individual function testing (calcPercent, addToCell, mkOutTplJson) | Developer |
| Integration Tests | Module interaction (keyboard input -> count -> percentage -> output) | Developer/QA |
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
| TC-001 | Start Count disabled when case number is empty | SYS-003 | HA-001 | **P1** | 1. Load application. 2. Leave case number field empty. 3. Click Start Count. | Start Count button is grayed out and non-clickable. | |
| TC-002 | Start Count disabled when case number is whitespace only | SYS-003 | HA-001 | **P1** | 1. Enter "   " (spaces) in case field. 2. Observe Start Count button. | Button remains disabled. | |
| TC-003 | Start Count enabled when valid case number entered | SYS-003, SYS-005 | HA-001 | **P1** | 1. Enter "S25-1234" in case field. 2. Observe Start Count button. | Button becomes enabled within 100ms. | |
| TC-004 | Case number displayed persistently during counting | SYS-004 | HA-002 | P2 | 1. Enter "H25-00567". 2. Click Start Count. 3. Scroll down if applicable. | Case number "H25-00567" visible in fixed header at all times. | |
| TC-005 | Data cleared on case number change during active session | SYS-006 | HA-003 | **P1** | 1. Enter "CASE-A". 2. Start Count. 3. Count 10 cells. 4. Change case number to "CASE-B". 5. Confirm the dialog. | All counts = 0, percentages = 0.00, output cleared, total = 0. | |
| TC-006 | Confirmation dialog shown on case change with data | SYS-007 | HA-003 | **P1** | 1. Enter case, start count, count cells. 2. Change case number. | Confirmation dialog appears with message about clearing data. | |
| TC-007 | Cancel case change preserves data | SYS-008 | HA-003 | **P1** | 1. Enter "CASE-A", count 15 cells. 2. Change case number. 3. Click Cancel. | Case number reverts to "CASE-A". All counts preserved. | |
| TC-008 | Case number accepts alphanumeric, hyphens, slashes | SYS-002 | - | P3 | 1. Enter "25-A/12345". 2. Observe acceptance. | Value accepted; Start Count enabled. | |
| TC-009 | Case number rejects at >30 characters | SYS-002 | - | P3 | 1. Enter 31-character string. | Input truncated or rejected at 30 characters. | |

### 5.2 Specimen Type Tests (TC-010 through TC-017)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-010 | Default specimen type is Bone Marrow | SYS-011 | - | P3 | 1. Load application. | Dropdown shows "Bone Marrow". BM table visible. | |
| TC-011 | Switching to PB shows PB table, hides BM | SYS-012 | HA-014 | P2 | 1. Select "Peripheral Blood". | BM table hidden. PB table visible with PB cell types. | |
| TC-012 | BM displays correct 9 cell types | SYS-014 | HA-010 | P2 | 1. Observe BM table headers. | blast, pro, gran, eryth, baso, eos, plasma, lymph, mono, tot. | |
| TC-013 | PB displays correct 9 cell types | SYS-015 | HA-010 | P2 | 1. Select PB. 2. Observe table headers. | poly, band, lymph, mono, eos, baso, pro, blast, other, tot. | |
| TC-014 | Specimen selector locked after Start Count | SYS-016 | HA-014 | P2 | 1. Enter case. 2. Click Start Count. 3. Try to change specimen type. | Dropdown is disabled. | |
| TC-015 | Specimen selector re-enabled after reset | SYS-017 | - | P3 | 1. Start count. 2. Reset. 3. Observe dropdown. | Dropdown is enabled. | |

### 5.3 Counting Tests (TC-020 through TC-039)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-020 | Pressing 'A' increments blast by 1 (BM) | SYS-031, SYS-038 | HA-010 | **P1** | 1. BM selected. 2. Start Count. 3. Press 'A'. | blast count = 1, total = 1. | |
| TC-021 | All 9 BM keys map correctly | SYS-038 | HA-010 | **P1** | 1. BM selected. 2. Start Count. 3. Press A, S, D, F, Z, X, C, V, B once each. | blast=1, pro=1, gran=1, eryth=1, baso=1, eos=1, plasma=1, lymph=1, mono=1, total=9. | |
| TC-022 | All 9 PB keys map correctly | SYS-039 | HA-010 | **P1** | 1. PB selected. 2. Start Count. 3. Press A, S, D, F, Z, X, C, V, B once each. | poly=1, band=1, lymph=1, mono=1, eos=1, baso=1, pro=1, blast=1, other=1, total=9. | |
| TC-023 | Unmapped key is ignored | SYS-035 | - | P3 | 1. Start Count. 2. Press 'E' (not mapped). | No count changes. Total unchanged. | |
| TC-024 | Modifier key (Ctrl+A) is ignored | SYS-036 | - | P3 | 1. Start Count. 2. Press Ctrl+A. | No count changes. No browser "select all" action during counting. | |
| TC-025 | Rapid sequential keypresses all register | SYS-031, SYS-P02 | HA-011 | P2 | 1. Start Count. 2. Press 'A' rapidly 20 times. | blast = 20, total = 20. Each press <50ms response. | |
| TC-026 | Shift+A decrements blast by 1 | SYS-032 | HA-013 | **P1** | 1. Start Count. 2. Press 'A' 5 times (blast=5). 3. Press Shift+A. | blast = 4, total = 4. | |
| TC-027 | Shift+key does not go below zero | SYS-033 | HA-013 | **P1** | 1. Start Count (all counts = 0). 2. Press Shift+A. | blast = 0, total = 0. No negative values. | |
| TC-028 | Total updates correctly with increment | SYS-034 | HA-023 | **P1** | 1. Press A (blast=1, total=1). 2. Press S (pro=1, total=2). 3. Press A (blast=2, total=3). | Total = 3. | |
| TC-029 | Total updates correctly with decrement | SYS-034 | HA-023 | **P1** | 1. Counts: blast=5, pro=3, total=8. 2. Press Shift+A. | blast=4, total=7. | |
| TC-030 | Visual feedback on keypress | SYS-037 | HA-011 | P2 | 1. Press 'A'. 2. Observe blast cell. | Brief color flash (green/highlight) for ~150ms. | |
| TC-031 | Multiple cells counted to high values | SYS-P04 | - | P3 | 1. Count to total = 500. | All counts display correctly. No slowdown. Percentages correct. | |
| TC-032 | Count input fields initialized to 0 | SYS-022 | - | P3 | 1. Load application. | All count fields show 0. Total shows 0. | |

### 5.4 Percentage Calculation Tests (TC-040 through TC-049)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-040 | Division by zero: all counts = 0 | SYS-042 | HA-021 | **P1** | 1. Observe percentages before counting. | All percentages display "0.00". No NaN, no Infinity, no errors. | |
| TC-041 | Single cell counted: 1/1 = 100% | SYS-040 | HA-020 | **P1** | 1. Press 'A' once. | blast = 100.00%, all others = 0.00%, total pct = 100.00%. | |
| TC-042 | Two equal cells: 50/50 split | SYS-040 | HA-020 | **P1** | 1. Press 'A' 5 times, 'S' 5 times. | blast = 50.00%, pro = 50.00%, total = 10. | |
| TC-043 | Known differential: 100-cell standard | SYS-040 | HA-020 | **P1** | 1. Enter: blast=2, pro=5, gran=60, eryth=0, baso=1, eos=3, plasma=2, lymph=20, mono=7 (total=100). | blast=2.00, pro=5.00, gran=60.00, eryth=0.00, baso=1.00, eos=3.00, plasma=2.00, lymph=20.00, mono=7.00. Sum = 100.00. | |
| TC-044 | Repeating decimal: 1/3 | SYS-041 | HA-022 | P2 | 1. Count 3 cells, one each of A, S, D. | Each shows 33.33%. Sum within 0.10% of 100%. | |
| TC-045 | Percentage precision: 2 decimal places | SYS-041 | - | P2 | 1. Count 7 cells of one type, 3 of another (total=10). | 70.00% and 30.00% (exactly 2 decimal places shown). | |
| TC-046 | Percentage sum validation | SYS-044 | HA-022 | P2 | 1. Count various cells to total=200. 2. Sum all displayed percentages. | Sum is between 99.90% and 100.10%. | |
| TC-047 | Percentage after decrement | SYS-031, SYS-040 | HA-020 | **P1** | 1. A=5, S=5 (total=10, each 50%). 2. Shift+A. | blast=4/9=44.44%, pro=5/9=55.56%, total=9. | |
| TC-048 | All cells equal (9-way split) | SYS-040 | HA-022 | P2 | 1. Press each key once (total=9). | Each cell = 11.11%. Sum within tolerance. | |
| TC-049 | Large count percentage accuracy | SYS-040, SYS-P04 | - | P3 | 1. Count to total=1000 with known distribution. | All percentages match expected to 2 decimal places. | |

### 5.5 Count Completion Tests (TC-050 through TC-059)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-050 | Count Done with adequate count (BM >= 200) | SYS-056 | HA-030 | **P1** | 1. BM selected. 2. Count 200 cells. 3. Click Count Done. | Output generated. No warning dialog. | |
| TC-051 | Count Done with count below BM minimum | SYS-053 | HA-030 | **P1** | 1. BM selected. 2. Count 50 cells. 3. Click Count Done. | Warning: "Total count (50) is below the minimum (200) for Bone Marrow. Continue anyway?" | |
| TC-052 | Count Done warning - user cancels | SYS-053 | HA-030 | **P1** | 1. Below-minimum count. 2. Click Count Done. 3. Click Cancel on warning. | Return to counting state. Keydown listener still active. | |
| TC-053 | Count Done warning - user overrides | SYS-053 | HA-030 | **P1** | 1. Below-minimum count. 2. Click Count Done. 3. Click Continue on warning. | Output generated with suboptimal count. | |
| TC-054 | PB minimum threshold check (>= 100) | SYS-052 | HA-030 | **P1** | 1. PB selected. 2. Count 50 cells. 3. Click Count Done. | Warning referencing PB minimum of 100. | |
| TC-055 | Inputs locked after Count Done | SYS-055 | HA-031 | P2 | 1. Count Done. 2. Try to change a count field manually. | All count inputs are readonly. | |
| TC-056 | Keydown listener removed after Count Done | SYS-054 | HA-015 | P2 | 1. Count Done. 2. Press mapped key. | No count changes. | |
| TC-057 | Count Done button disabled before Start Count | SYS-051 | - | P3 | 1. Enter case number only (don't click Start Count). 2. Observe Count Done button. | Count Done button is disabled. | |

### 5.6 Output Generation Tests (TC-060 through TC-069)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-060 | BM output: all 3 tabs generated | SYS-062 | HA-050 | P2 | 1. Complete BM count. 2. Click Count Done. | Three tabs: Yale SOM, Precipio DX, MGH. Each contains output text. | |
| TC-061 | PB output: MGH tab generated | SYS-062 | HA-050 | P2 | 1. Complete PB count. 2. Click Count Done. | One tab: MGH. Contains output text. | |
| TC-062 | Case number appears in all output | SYS-067 | HA-004 | **P1** | 1. Case "S25-1234". 2. Complete count. 3. Check each output tab. | "S25-1234" is the first element in each output. | |
| TC-063 | Total count appears in output | SYS-061 | - | P2 | 1. Count 200 cells. 2. Check output. | "200" appears in output text. | |
| TC-064 | Percentages in output match table | SYS-061 | HA-024 | P2 | 1. Known count: blast=10 of 100 total. 2. Check output. | Output shows blast as 10% (rounded integer). Table shows 10.00%. | |
| TC-065 | Copy to Clipboard works | SYS-065 | HA-042 | P2 | 1. Complete count. 2. Click Copy to Clipboard on first tab. 3. Paste in text editor. | Pasted text matches output content including case number. | |
| TC-066 | Copy confirmation displayed | SYS-066 | - | P3 | 1. Click Copy to Clipboard. | "Copied!" message appears for ~2 seconds. | |
| TC-067 | Tab switching works | SYS-062 | HA-051 | P3 | 1. Click each tab. | Correct content displayed for each tab. Active tab highlighted. | |
| TC-068 | Morphology comments included in output | SYS-072 | HA-052 | P2 | 1. Enter "Toxic granulation noted." 2. Complete count. 3. Check output. | "Toxic granulation noted." appears in output. | |

### 5.7 Reset Tests (TC-080 through TC-089)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-080 | Reset with active count data shows confirmation | SYS-081 | HA-040 | P2 | 1. Count 10 cells. 2. Click Reset. | Confirmation dialog: "This will clear all count data for case {X}. Continue?" | |
| TC-081 | Reset confirmation - cancel preserves data | SYS-081 | HA-040 | P2 | 1. Count 10 cells. 2. Click Reset. 3. Click Cancel. | All data preserved. Counting can continue. | |
| TC-082 | Reset confirmation - OK clears all data | SYS-082 | - | P2 | 1. Count 10 cells. 2. Click Reset. 3. Click OK. | All counts = 0, percentages = 0.00, case number cleared, output cleared, comments cleared. | |
| TC-083 | After reset, focus on case number input | SYS-084 | - | P3 | 1. Complete reset. | Cursor is in case number input field. | |
| TC-084 | Reset with no data skips confirmation | SYS-083 | - | P3 | 1. No counting done. 2. Click Reset. | Immediate reset, no dialog. | |
| TC-085 | Specimen selector re-enabled after reset | SYS-017 | - | P3 | 1. Start Count (selector locked). 2. Reset. | Specimen selector dropdown enabled. | |
| TC-086 | Start Count disabled after reset | SYS-082 | - | P3 | 1. Complete reset. | Start Count is disabled until case number entered. | |

### 5.8 Morphology Comments Tests (TC-070 through TC-075)

| TC ID | Test Case | SRS Trace | FMEA Trace | Priority | Steps | Expected Result | Pass/Fail |
|-------|----------|-----------|------------|----------|-------|-----------------|-----------|
| TC-070 | Comments field does not trigger counting | SYS-073 | - | P2 | 1. Start Count. 2. Click in morphology comments field. 3. Type "abc". | No cell counts change. "abc" appears in text area. | |
| TC-071 | Counting resumes after leaving comments field | SYS-073 | - | P2 | 1. Type in comments field. 2. Click elsewhere. 3. Press 'A'. | blast increments. | |
| TC-072 | Comments accept 500 characters | SYS-071 | - | P3 | 1. Enter 500-character string. | All characters accepted. | |
| TC-073 | Comments cleared on reset | SYS-082 | - | P3 | 1. Enter comment. 2. Reset. | Comment field is empty. | |

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
| TC-100 | Full workflow in Chrome | SYS-I01 | Chrome | Execute TC-003, TC-021, TC-043, TC-050, TC-062, TC-065 | All pass. | |
| TC-101 | Full workflow in Firefox | SYS-I02 | Firefox | Execute TC-003, TC-021, TC-043, TC-050, TC-062, TC-065 | All pass. | |
| TC-102 | Full workflow in Edge | SYS-I03 | Edge | Execute TC-003, TC-021, TC-043, TC-050, TC-062, TC-065 | All pass. | |
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
| P1 (Safety-critical) | 24 | 100% |
| P2 (Important) | 24 | 95% |
| P3 (Standard) | 25 | 90% |
| Informational (no priority assigned) | 11 | N/A |
| **Total** | **84** | |

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

## 9. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Lead | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
