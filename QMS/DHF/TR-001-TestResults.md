# TR-001: Test Execution Results

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | TR-001 |
| **Version** | 1.0 |
| **Product** | WBC ΔΣ v1.0 |
| **Date Executed** | 2026-02-18 |
| **Status** | **PASS** |
| **Parent Document** | DHF-001 |
| **Input Documents** | TP-001, VV-001, SRS-001 |
| **Test Runner** | Node.js v22.22.0 built-in test runner |
| **Platform** | macOS, Node.js v22.22.0 |

---

## 1. Executive Summary

**All 146 tests passed across 36 test suites with 0 failures.**

**Note**: This report reflects the test run executed on 2026-02-18. After code or test changes, execute `npm run test:qms` to capture updated evidence and results.

| Metric | Value |
|--------|-------|
| Total Tests | **146** |
| Passed | **146** |
| Failed | **0** |
| Pass Rate | **100.00%** |
| Total Suites | 36 |
| Execution Time | 77.86 ms |
| Skipped | 0 |
| Cancelled | 0 |

---

## 2. Test Suite Breakdown

### Suite 01: Calculation Engine (01-calculation-engine.test.js)

**Purpose**: Verifies the core percentage calculation algorithm — the single most safety-critical computation in the application.

| Category | Tests | Passed | Failed | SRS Trace | FMEA Trace |
|----------|-------|--------|--------|-----------|------------|
| Percentage Computation | 18 | 18 | 0 | SYS-040 to SYS-045 | HA-020, HA-021, HA-022 |
| Increment / Decrement | 10 | 10 | 0 | SYS-031 to SYS-033 | HA-013 |
| Output Template JSON | 3 | 3 | 0 | SYS-061 | HA-024 |
| **Subtotal** | **31** | **31** | **0** | | |

**Key Verification Vectors (VV-CALC series):**

| VV ID | Description | Input Total | Result | Status |
|-------|------------|-------------|--------|--------|
| VV-CALC-001 | All zeros (division by zero) | 0 | All 0.00%, no NaN/Infinity | **PASS** |
| VV-CALC-002 | Single cell | 1 | 100.00% | **PASS** |
| VV-CALC-003 | Two equal cells | 100 | 50.00% each | **PASS** |
| VV-CALC-004 | Nine equal cells | 90 | 11.11% each | **PASS** |
| VV-CALC-005 | One dominant cell | 100 | 95.00% / 5.00% | **PASS** |
| VV-CALC-006 | Minimum multitype | 9 | 11.11% each | **PASS** |
| VV-CALC-007 | Standard BM differential | 100 | All correct, sum=100.00 | **PASS** |
| VV-CALC-008 | Acute leukemia pattern | 100 | blast=45.00% | **PASS** |
| VV-CALC-009 | Small count (N=10) | 10 | Correct to 2 decimal | **PASS** |
| VV-CALC-010 | Large count (N=500) | 500 | All correct, sum=100.00 | **PASS** |
| VV-CALC-011 | Repeating thirds | 3 | 33.33% each, sum within tolerance | **PASS** |
| VV-CALC-012 | Repeating sixths | 6 | 16.67% each, sum within tolerance | **PASS** |
| VV-CALC-013 | Near-even distribution | 10 | 20.00% / 10.00% | **PASS** |
| VV-CALC-014 | Maximum capacity (9999) | 9999 | No degradation | **PASS** |
| VV-CALC-015 | Standard PB differential | 100 | All correct | **PASS** |

**Key Safety Verifications:**
- VV-INC-005: Decrement from zero stays at 0 (100 iterations tested) — **PASS**
- SYS-044: Percentage sum within ±0.10% of 100% across 10 distributions — **PASS**
- SYS-041: 2-decimal-place precision confirmed — **PASS**

---

### Suite 02: Configuration Validation (02-configuration.test.js)

**Purpose**: Validates templates.json schema, data integrity, key mappings, and template completeness.

| Category | Tests | Passed | Failed | SRS Trace | FMEA Trace |
|----------|-------|--------|--------|-----------|------------|
| File Loading | 3 | 3 | 0 | SYS-100, SYS-101 | HA-060 |
| Schema Validation | 4 | 4 | 0 | SYS-102, SYS-103 | HA-061 |
| outCodes Validation | 6 | 6 | 0 | SYS-038, SYS-039 | HA-062 |
| Template Validation | 7 | 7 | 0 | SYS-060 | HA-050 |
| Minimum Cell Count | 3 | 3 | 0 | SYS-052, SYS-103 | HA-030 |
| Template Rendering | 4 | 4 | 0 | VV-TPL-001 to 004 | HA-050 |
| **Subtotal** | **27** | **27** | **0** | | |

**Key Findings:**
- BM key mapping verified: A=blast, S=pro, D=gran, F=eryth, Z=baso, X=eos, C=plasma, V=lymph, B=mono
- PB key mapping verified: A=poly, S=band, D=lymph, F=mono, Z=eos, X=baso, C=pro, V=blast, B=other
- No duplicate keys or cell type values detected
- All 4 templates render with zero unresolved placeholders
- BM minCellCount = 200, PB minCellCount = 100

---

### Suite 03: HTML Structure & UI Elements (03-html-structure.test.js)

**Purpose**: Verifies all required UI elements exist in the HTML for the application to function.

| Category | Tests | Passed | Failed | SRS Trace | FMEA Trace |
|----------|-------|--------|--------|-----------|------------|
| File Integrity | 5 | 5 | 0 | - | - |
| Case Identification | 4 | 4 | 0 | SYS-001 to SYS-004 | HA-001 |
| Specimen Type | 3 | 3 | 0 | SYS-010 | HA-014 |
| Control Buttons | 5 | 5 | 0 | SYS-050, SYS-080 | - |
| Three-Phase Layout | 4 | 4 | 0 | - | - |
| Morphology Comments | 3 | 3 | 0 | SYS-070, SYS-071 | - |
| Output Area | 3 | 3 | 0 | SYS-062 | - |
| Session History | 4 | 4 | 0 | SYS-092, SYS-094 | - |
| Modal Dialogs | 2 | 2 | 0 | SYS-007, SYS-053, SYS-081 | - |
| Accessibility | 3 | 3 | 0 | - | - |
| **Subtotal** | **36** | **36** | **0** | | |

---

### Suite 04: JavaScript Application Integrity (04-javascript-integrity.test.js)

**Purpose**: Static analysis of mdc-app.js to verify safety mechanisms, state management, and security.

| Category | Tests | Passed | Failed | SRS Trace | FMEA Trace |
|----------|-------|--------|--------|-----------|------------|
| File Integrity | 4 | 4 | 0 | - | - |
| State Management | 3 | 3 | 0 | - | - |
| Keyboard Safety | 7 | 7 | 0 | SYS-030 to SYS-036 | HA-010, HA-015 |
| Decrement Safety | 3 | 3 | 0 | SYS-033 | HA-013 |
| Division by Zero | 2 | 2 | 0 | SYS-042 | HA-021 |
| Min Count Enforcement | 3 | 3 | 0 | SYS-052, SYS-053 | HA-030 |
| Reset Confirmation | 2 | 2 | 0 | SYS-081 | HA-040 |
| Copy to Clipboard | 3 | 3 | 0 | SYS-065, SYS-066 | HA-042 |
| Session History | 3 | 3 | 0 | SYS-090, SYS-095 | - |
| Security | 2 | 2 | 0 | SYS-S04 | - |
| Config Loading | 3 | 3 | 0 | SYS-100, SYS-101, SYS-103 | HA-060 |
| Flash Feedback | 2 | 2 | 0 | SYS-037 | HA-011 |
| **Subtotal** | **37** | **37** | **0** | | |

---

### Suite 05: End-to-End Data Integrity (05-end-to-end-data-integrity.test.js)

**Purpose**: Simulates complete counting workflows and verifies data integrity from input through output.

| Category | Tests | Passed | Failed | SRS Trace | FMEA Trace |
|----------|-------|--------|--------|-----------|------------|
| VV-E2E-001: Standard BM 100-cell | 8 | 8 | 0 | All | HA-020, HA-024 |
| Undo/Correction Flow | 3 | 3 | 0 | SYS-032, SYS-033 | HA-013 |
| PB Workflow | 1 | 1 | 0 | SYS-039 | - |
| Unmapped Key Handling | 1 | 1 | 0 | SYS-035 | - |
| Edge Cases | 3 | 3 | 0 | SYS-042, SYS-P04 | HA-021 |
| **Subtotal** | **16** (incl. sub-assertions) | **16** | **0** | | |

**VV-E2E-001 Checkpoint Results:**
- Checkpoint 1 (counts): All 9 cell types correct — **PASS**
- Checkpoint 1 (total): 100 — **PASS**
- Checkpoint 1 (percentages): All 9 match expected — **PASS**
- Checkpoint 1 (sum): 100.00% — **PASS**
- Checkpoint 2 (Yale SOM output): Total present, percentages present — **PASS**
- Checkpoint 2 (Precipio DX output): Populated, substantive — **PASS**
- Checkpoint 2 (MGH output): Populated — **PASS**
- Checkpoint 2 (no unresolved placeholders): All 3 templates clean — **PASS**

---

## 3. FMEA Mitigation Verification

Every FMEA hazard mitigation is covered by at least one passing test:

| FMEA ID | Hazard | Pre-RPN | Mitigation Tested | Test Result |
|---------|--------|---------|-------------------|-------------|
| HA-001 | No case number | 100 | Start Count disabled when empty | **PASS** (TC-001 in Suite 03) |
| HA-003 | Data carryover | 60 | Case badge, phase management | **PASS** (Suite 03, 04) |
| HA-010 | Wrong key mapping | 24 | BM+PB key mapping verified | **PASS** (Suite 02) |
| HA-011 | Missed keypress | 36 | Flash feedback present | **PASS** (Suite 04) |
| HA-013 | No undo | 20 | Shift+key decrement, floor at 0 | **PASS** (Suite 01, 05) |
| HA-015 | Count after stop | 36 | Keydown removal verified | **PASS** (Suite 04) |
| HA-020 | Calculation error | 20 | 15 VV-CALC vectors pass | **PASS** (Suite 01) |
| HA-021 | Division by zero | 18 | Zero-guard verified | **PASS** (Suite 01, 04, 05) |
| HA-022 | Sum != 100% | 16 | ±0.10% tolerance verified | **PASS** (Suite 01) |
| HA-024 | Output/table mismatch | 24 | E2E cross-check | **PASS** (Suite 05) |
| HA-030 | Insufficient count | 64 | minCellCount enforcement | **PASS** (Suite 02, 04) |
| HA-040 | Accidental reset | 12 | Confirmation dialog verified | **PASS** (Suite 04) |
| HA-042 | Output not copied | 27 | Clipboard API + fallback | **PASS** (Suite 04) |
| HA-050 | Template render error | 12 | All 4 templates verified | **PASS** (Suite 02) |
| HA-052 | Comments omitted | 27 | Comments textarea verified | **PASS** (Suite 03) |
| HA-060 | Config load failure | 12 | Error handling verified | **PASS** (Suite 04) |
| HA-061 | Invalid config | 24 | Schema validated | **PASS** (Suite 02) |
| HA-062 | Duplicate keys | 15 | Duplicate check passes | **PASS** (Suite 02) |

---

## 4. Test Coverage by SRS Requirement

| Coverage Area | SRS Requirements Covered | Test Count |
|---------------|-------------------------|-----------|
| Case Identification (SYS-001 to SYS-008) | 8 | 11 |
| Specimen Type (SYS-010 to SYS-017) | 5 | 9 |
| Keyboard Input (SYS-030 to SYS-039) | 10 | 18 |
| Calculation (SYS-040 to SYS-045) | 6 | 20 |
| Count Completion (SYS-050 to SYS-056) | 5 | 6 |
| Output (SYS-060 to SYS-067) | 6 | 11 |
| Morphology (SYS-070 to SYS-073) | 3 | 3 |
| Reset (SYS-080 to SYS-084) | 4 | 5 |
| Session History (SYS-090 to SYS-095) | 5 | 7 |
| Configuration (SYS-100 to SYS-103) | 4 | 10 |
| Performance (SYS-P01 to SYS-P04) | 2 | 2 |
| Security (SYS-S01 to SYS-S04) | 2 | 5 |
| **Total** | **60** | **107 unique assertions** |

---

## 5. Conclusion

**WBC ΔΣ v1.0 PASSES all automated verification tests.**

- All 146 tests pass with 0 failures
- All 15 VV-CALC calculation vectors verified
- All FMEA hazard mitigations confirmed by tests
- Configuration schema validated
- HTML structure verified for all required UI elements
- JavaScript safety mechanisms confirmed via static analysis
- End-to-end data integrity verified for BM and PB workflows

**Recommendation**: The software is ready for user acceptance testing (validation) per VV-001 Section 5.

---

## 6. Raw Test Output

Full TAP output is archived in `test-output-raw.txt` in this directory.

**Future runs**: Use `npm run test:qms` to capture raw output and environment metadata under `QMS/DHF/TestEvidence/<timestamp>_run/`.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial test execution — 146/146 pass |
| B | 2026-02-20 | QMS | Added test evidence capture reference |
| C | 2026-02-20 | QMS | Clarified run date scope and update procedure |

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Lead | | | |
| Quality Assurance | | | |

## 8. Automated Run Log
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
