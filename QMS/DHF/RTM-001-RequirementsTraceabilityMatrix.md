# RTM-001: Requirements Traceability Matrix

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | RTM-001 |
| **Version** | 1.0 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |

---

## 1. Purpose

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between:
- User Requirements (URS-001) → System Requirements (SRS-001)
- System Requirements (SRS-001) → Design (SAD-001, SDD-001)
- System Requirements (SRS-001) → Risk Analysis (RA-001)
- System Requirements (SRS-001) → Verification/Test Cases (TP-001, VV-001)

This ensures that every user need is addressed by system requirements, every system requirement is implemented in the design, every risk is mitigated, and every requirement is verified by testing.

## 2. Traceability Direction

```
URS (User Need) → SRS (System Req) → SDD (Design) → TP/VV (Verification)
                                    ↗
                        RA (Risk) ──┘
```

---

## 3. Forward Traceability: URS → SRS → Design → Test

### 3.1 Case Identification

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-001 | Mandatory case number before counting | SYS-001, SYS-003, SYS-005 | 3.4.1 CaseInputView | HA-001 | TC-001, TC-002, TC-003 | Full |
| URS-002 | Case number displayed prominently | SYS-004 | 3.4.1 CaseInputView | HA-002 | TC-004 | Full |
| URS-003 | Clear all data on new case entry | SYS-006, SYS-007, SYS-008 | 3.4.1, 3.9 Reset | HA-003 | TC-005, TC-006, TC-007 | Full |
| URS-004 | Prevent counting without case number | SYS-003 | 3.4.1, 3.4.4 Buttons | HA-001 | TC-001, TC-002 | Full |
| URS-005 | Accept alphanumeric case numbers | SYS-002 | 3.4.1 CaseInputView | - | TC-008, TC-009 | Full |

### 3.2 Specimen Type Selection

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-010 | Select specimen type before counting | SYS-010, SYS-011 | 3.2 Specimen Type Controller | HA-014 | TC-010 | Full |
| URS-011 | Support BM and PB | SYS-010, SYS-014, SYS-015 | 3.8 templates.json | - | TC-012, TC-013 | Full |
| URS-012 | Display appropriate cell types | SYS-012, SYS-014, SYS-015 | 3.4.2 MakeTable, 3.8 | HA-010 | TC-011, TC-012, TC-013 | Full |
| URS-013 | Prevent specimen type change mid-count | SYS-016, SYS-017 | 3.4.4 Buttons | HA-014 | TC-014, TC-015 | Full |

### 3.3 Cell Counting

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-020 | Increment via keyboard key | SYS-030, SYS-031 | 3.5.1 addToCell, 3.7 keydown | - | TC-020, TC-025 | Full |
| URS-021 | Unique key per cell type | SYS-038, SYS-039 | 3.8 templates.json | HA-010 | TC-021, TC-022 | Full |
| URS-022 | Display key mapping | SYS-023 | 3.4.2 MakeTable.mkKeyRow | - | TC-012, TC-013 | Full |
| URS-023 | Real-time count display | SYS-022, SYS-024 | 3.4.2, 3.5.1 | HA-011 | TC-020, TC-032 | Full |
| URS-024 | Running total displayed | SYS-021, SYS-025, SYS-034 | 3.4.2, 3.5.1 | HA-023 | TC-028, TC-029 | Full |
| URS-025 | Undo/decrement mechanism | SYS-032 | 3.5.1, 3.7 | HA-013 | TC-026, TC-027 | Full |
| URS-026 | No count below zero | SYS-033 | 3.5.1, 3.2.2 CellCount | - | TC-027, VV-INC-005 | Full |
| URS-027 | Feedback on keypress | SYS-037 | 3.5.1 (flash) | HA-011 | TC-030 | Full |

### 3.4 Percentage Calculation

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-030 | Auto-calculate percentages | SYS-040, SYS-045 | 3.5.2 calcPercent | HA-020 | VV-CALC-001 to 015, TC-043 | Full |
| URS-031 | Real-time percentage updates | SYS-043 | 3.5.2 | - | TC-111 | Full |
| URS-032 | Minimum 1 decimal precision | SYS-041 | 3.5.2 | - | TC-045 | Full |
| URS-033 | Division by zero handling | SYS-042 | 3.5.2 | HA-021 | TC-040, VV-CALC-001 | Full |
| URS-034 | Percentages sum to 100% | SYS-044 | 3.5.2 | HA-022 | TC-046, VV-CALC-011/012 | Full |

### 3.5 Count Completion and Validation

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-040 | "Count Done" function | SYS-050, SYS-051 | 3.4.4 Buttons.countDone | - | TC-050, TC-057 | Full |
| URS-041 | Minimum cell count threshold | SYS-052, SYS-053 | 3.4.4, 3.11 config | HA-030 | TC-050, TC-051, TC-054 | Full |
| URS-042 | Warning with override for low count | SYS-053 | 3.4.4 | HA-030 | TC-051, TC-052, TC-053 | Full |
| URS-043 | Lock inputs after completion | SYS-054, SYS-055 | 3.4.2, 3.4.4 | HA-031 | TC-055, TC-056 | Full |

### 3.6 Output and Reporting

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-050 | Generate formatted output | SYS-056, SYS-060, SYS-061 | 3.4.3, 3.5.3 | HA-050 | TC-060, TC-061 | Full |
| URS-051 | Multiple institutional templates | SYS-060, SYS-062 | 3.4.3, 3.8 | HA-051 | TC-060, TC-067 | Full |
| URS-052 | Case number in all output | SYS-067 | 3.5.3 | HA-004 | TC-062, VV-TPL-001 to 004 | Full |
| URS-053 | Total count in output | SYS-061 | 3.5.3 | - | TC-063 | Full |
| URS-054 | Percentages in output | SYS-061 | 3.5.3 | HA-024 | TC-064 | Full |
| URS-055 | Copy to clipboard | SYS-064, SYS-065, SYS-066 | 3.4.3 | HA-042 | TC-065, TC-066 | Full |
| URS-056 | Tabbed output interface | SYS-062, SYS-063 | 3.4.3 | - | TC-060, TC-067 | Full |

### 3.7 Reset and New Case

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-060 | Reset function | SYS-080, SYS-082, SYS-083 | 3.4.4, 3.9 | HA-040 | TC-082, TC-084 | Full |
| URS-061 | Confirmation before reset | SYS-081 | 3.4.4 | HA-040 | TC-080, TC-081 | Full |
| URS-062 | Auto-clear on new case | SYS-006 | 3.4.1 | HA-003 | TC-005 | Full |
| URS-063 | Return to case input after reset | SYS-084 | 3.4.4, 3.9 | - | TC-083 | Full |

### 3.8 Morphology Comments

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-070 | Morphology comment field | SYS-070, SYS-071, SYS-073 | 3.4.5 MorphologyCommentsView | HA-052 | TC-070, TC-071, TC-072 | Full |
| URS-071 | Comments in output | SYS-072 | 3.4.5, 3.5.3 | HA-052 | TC-068, VV-TPL-005 | Full |

### 3.9 Session History

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-080 | Retain completed counts in session | SYS-090, SYS-091, SYS-095 | 3.3.2, 3.4.6 | - | TC-090, TC-093 | Full |
| URS-081 | Session history list | SYS-092 | 3.4.6 | - | TC-090 | Full |
| URS-082 | Read-only history review | SYS-093 | 3.4.6 | - | TC-091 | Full |
| URS-083 | Indicate temporary nature of data | SYS-094 | 3.4.6 | - | TC-094 | Full |
| URS-084 | Export session history to local files | SYS-096, SYS-097 | 3.4.6 | - | TC-095, TC-096 | Full |

### 3.10 Usability

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-090 | Keyboard-only operation during counting | SYS-030, SYS-031, SYS-032 | 3.7 | - | TC-020 to TC-031 | Full |
| URS-091 | Readable font size | SYS-026 | 3.5 CSS | - | Inspection | Full |
| URS-092 | Clear instructions | SYS-070 (instructions) | 3.4.4 | - | Validation V1 | Full |
| URS-093 | Cross-browser support | SYS-I01, SYS-I02, SYS-I03 | 5.1 Tech Stack | - | TC-100, TC-101, TC-102 | Full |
| URS-094 | Offline operation after load | SYS-I04 | 5.1 | - | TC-103 | Full |
| URS-095 | Theme toggle for ergonomic presentation | SYS-110, SYS-111, SYS-112 | 3.4.7 | - | TC-120, TC-121, TC-122 | Full |

### 3.11 Configuration

| URS ID | URS Description | SRS ID(s) | SDD Section | FMEA ID | Test Case(s) | Coverage |
|--------|----------------|-----------|-------------|---------|--------------|----------|
| URS-100 | Cell types from config file | SYS-100, SYS-102 | 3.8 templates.json | HA-060, HA-061 | TC-060 | Full |
| URS-101 | Templates from config file | SYS-100, SYS-102 | 3.8 | HA-061 | TC-060 | Full |
| URS-102 | Configurable minimum count | SYS-103 | 3.8 | - | TC-050, TC-054 | Full |

---

## 4. Reverse Traceability: Orphan Check

### 4.1 SRS Requirements Without URS Parent (Orphans)

| SRS ID | Description | Justification |
|--------|-------------|---------------|
| SYS-S01 | No patient data transmission | Derived security requirement (regulatory) |
| SYS-S02 | No cookies/localStorage for patient data | Derived security requirement (regulatory) |
| SYS-S03 | sessionStorage auto-clear | Derived security requirement (privacy) |
| SYS-S04 | Input sanitization for XSS | Derived security requirement (cybersecurity) |
| SYS-P01 | Page load < 3 seconds | Derived performance requirement (usability) |
| SYS-P02 | Keypress response < 50ms | Derived from URS-023 (real-time) |
| SYS-P03 | Output render < 500ms | Derived performance requirement |
| SYS-P04 | Support up to 9999 cells | Derived capacity requirement |

All orphan SRS requirements are justified as derived requirements from regulatory, security, or performance considerations. **No unjustified orphan requirements exist.**

### 4.2 URS Requirements Without SRS Coverage (Gaps)

**None identified.** All 49 URS requirements have at least one corresponding SRS requirement.

### 4.3 SRS Requirements Without Test Coverage (Untested)

**None identified.** All SRS requirements are mapped to at least one test case or inspection activity.

---

## 5. Risk-to-Test Traceability

| FMEA ID | Hazard | Pre-RPN | Mitigation SRS | Verification Test | Post-RPN |
|---------|--------|---------|----------------|-------------------|----------|
| HA-001 | No case number | 100 | SYS-003, SYS-004 | TC-001, TC-002, TC-003 | 5 |
| HA-002 | Wrong case number | 45 | SYS-004 | TC-004 | 30 |
| HA-003 | Data carryover | 60 | SYS-006, SYS-007, SYS-008 | TC-005, TC-006, TC-007 | 5 |
| HA-004 | No case in output | 36 | SYS-067 | TC-062 | 4 |
| HA-010 | Wrong key mapping | 24 | SYS-038, SYS-039 | TC-021, TC-022 | 4 |
| HA-011 | Missed keypress | 36 | SYS-037, SYS-P02 | TC-030, TC-111 | 12 |
| HA-012 | Double keypress | 27 | SYS-032 | TC-026 | 12 |
| HA-013 | No undo capability | 20 | SYS-032, SYS-033 | TC-026, TC-027 | 4 |
| HA-014 | Wrong specimen type | 30 | SYS-016 | TC-014 | 10 |
| HA-015 | Count after intended stop | 36 | SYS-054, SYS-055 | TC-055, TC-056 | 6 |
| HA-020 | Calculation error | 20 | SYS-040-045 | VV-CALC-001 to 015 | 5 |
| HA-021 | Division by zero | 18 | SYS-042 | TC-040, VV-CALC-001 | 3 |
| HA-022 | Pct sum != 100% | 16 | SYS-044, SYS-045 | TC-046, VV-CALC-011/012 | 8 |
| HA-023 | Wrong total | 10 | SYS-025 | TC-028, TC-029 | 5 |
| HA-024 | Output/table mismatch | 24 | SDD: same formula | VV-E2E Checkpoint 2 | 8 |
| HA-030 | Insufficient cell count | 64 | SYS-052, SYS-053 | TC-050-054 | 16 |
| HA-031 | Post-completion modification | 48 | SYS-054, SYS-055 | TC-055, TC-056 | 8 |
| HA-040 | Accidental reset | 12 | SYS-081 | TC-080, TC-081 | 3 |
| HA-041 | Browser close data loss | 9 | SYS-095 | TC-093 | 9 |
| HA-042 | Output not copied | 27 | SYS-064, SYS-065 | TC-065 | 12 |
| HA-050 | Template render error | 12 | SYS-100-102 | VV-TPL-001 to 004 | 3 |
| HA-051 | Wrong template copied | 12 | SYS-063 | TC-067 | 12 |
| HA-052 | Comments omitted | 27 | SYS-072 | TC-068, VV-TPL-005 | 6 |
| HA-060 | Config load failure | 12 | SYS-101 | Manual test | 6 |
| HA-061 | Invalid config data | 24 | SYS-102, SYS-103 | SDD review | 8 |
| HA-062 | Duplicate key mapping | 15 | Schema validation | Config validation test | 5 |

---

## 6. Coverage Summary

| Dimension | Items | Covered | Coverage |
|-----------|-------|---------|----------|
| URS → SRS | 49 URS requirements | 49 | **100%** |
| SRS → Test | 93 SRS requirements | 93 | **100%** |
| FMEA → Test | 22 hazards | 22 | **100%** |
| URS → Validation | 49 URS requirements | 49 (via validation scenarios + system tests) | **100%** |

**Conclusion**: Full bidirectional traceability is established. No gaps, no orphans without justification, no untested requirements.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - complete RTM |
| B | 2026-02-19 | QMS | Added session export traceability |
| C | 2026-02-20 | QMS | Added theme toggle traceability |

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Systems Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
