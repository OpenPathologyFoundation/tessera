# URS-001: User Requirements Specification

## Tessera

| Field | Value |
|-------|-------|
| **Document ID** | URS-001 |
| **Version** | 1.0 |
| **Product** | Tessera |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |

---

## 1. Purpose

This document defines the user requirements for the Tessera software application (a manual differential counter). Requirements are derived from clinical workflow analysis, regulatory standards, and laboratory best practices. Each requirement is assigned a unique identifier, priority, and rationale.

## 2. Scope

This URS covers all user-facing functionality of Tessera including specimen identification, cell counting, calculation, output generation, data integrity, and usability requirements.

## 3. Users and Stakeholders

| Stakeholder | Role | Needs |
|-------------|------|-------|
| Medical Technologist (MT/MLS) | Primary user - performs the differential count | Fast, accurate keyboard-driven counting; clear results |
| Pathologist / Hematopathologist | Reviews results, performs verification counts | Accurate percentages; formatted output for documentation |
| Hematology Fellow / Resident | Performs counts under supervision | Intuitive interface; clear cell type labels |
| Laboratory Director | Responsible for result quality | Audit capability; compliance with standards |
| Quality Manager | Ensures QMS compliance | Validation evidence; traceability |

## 4. Definitions

| Term | Definition |
|------|-----------|
| Differential Count | The classification and enumeration of white blood cells by morphologic type on a stained smear |
| Bone Marrow (BM) | Aspirate smear from bone marrow biopsy procedure |
| Peripheral Blood (PB) | Smear prepared from venipuncture or capillary blood sample |
| Case/Accession Number | Unique identifier assigned to a patient specimen in the Laboratory Information System |
| Cell Type | A morphologic classification category (e.g., blast, neutrophil, lymphocyte) |

---

## 5. User Requirements

### 5.1 Case Identification

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-001 | The system SHALL provide a case/accession number input field that must be populated before counting can begin. | **P0 - Critical** | Patient safety: every count must be traceable to a specific specimen. Prevents unidentified results. |
| URS-002 | The system SHALL display the active case number prominently at all times during counting and on all output. | **P0 - Critical** | Prevents transcription errors and ensures the operator always knows which case is active. |
| URS-003 | The system SHALL completely clear all count data, percentages, and output when a new case number is entered. | **P0 - Critical** | Prevents carryover of data between patients, which would result in erroneous results and potential misdiagnosis. |
| URS-004 | The system SHALL prevent counting from starting if the case number field is empty. | **P0 - Critical** | Enforces mandatory identification before data entry. |
| URS-005 | The system SHALL accept alphanumeric case/accession numbers of variable length consistent with common LIS formats. | **P1 - High** | Different institutions use different accession number formats (e.g., S25-1234, H25-00567, 25-A-12345). |

### 5.2 Specimen Type Selection

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-010 | The system SHALL allow the user to select a specimen type before counting begins. | **P0 - Critical** | Bone marrow and peripheral blood have different cell type categories; incorrect mapping would produce clinically invalid results. |
| URS-011 | The system SHALL support at minimum Bone Marrow (BM) and Peripheral Blood (PB) specimen types. | **P0 - Critical** | These are the two primary specimen types requiring manual differential counting. |
| URS-012 | The system SHALL display cell type categories appropriate to the selected specimen type. | **P0 - Critical** | BM includes erythroid precursors and plasma cells; PB includes polymorphonuclear neutrophils and band forms. Using wrong categories would invalidate the count. |
| URS-013 | The system SHALL prevent changing specimen type after counting has started without a full reset. | **P1 - High** | Switching specimen types mid-count would produce meaningless hybrid data. |

### 5.3 Cell Counting

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-020 | The system SHALL allow the user to increment a cell type count by pressing a single keyboard key. | **P0 - Critical** | Operator's eyes must remain on the microscope; keyboard-only input is essential for accuracy and speed. |
| URS-021 | The system SHALL assign a unique keyboard key to each cell type within a specimen type. | **P0 - Critical** | Ambiguous mappings would cause miscounts. |
| URS-022 | The system SHALL display the keyboard key mapping for each cell type at all times during counting. | **P0 - Critical** | Operator must be able to quickly verify which key maps to which cell type, especially when learning the system. |
| URS-023 | The system SHALL display the current count for each cell type in real time as keys are pressed. | **P0 - Critical** | Immediate feedback confirms the keypress was registered and attributed to the correct cell type. |
| URS-024 | The system SHALL maintain and display a running total of all cells counted. | **P0 - Critical** | Laboratories require a minimum cell count (typically 100, 200, or 500) for statistical validity. The operator must know when the target is reached. |
| URS-025 | The system SHALL allow the user to decrement (undo) a cell type count by a defined mechanism (e.g., Shift+key). | **P0 - Critical** | **Currently missing.** Miscounts occur frequently during rapid counting. Without undo, the operator must either restart or accept an inaccurate count, both of which compromise result integrity. |
| URS-026 | The system SHALL not allow any cell count to go below zero when decrementing. | **P1 - High** | Negative cell counts are biologically and mathematically meaningless. |
| URS-027 | The system SHALL provide audible or visual feedback on each keypress to confirm registration. | **P1 - High** | **Currently missing.** During rapid counting, missed keypresses can go unnoticed without feedback, leading to undercounting. |

### 5.4 Percentage Calculation

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-030 | The system SHALL automatically calculate and display the percentage of each cell type relative to the total count. | **P0 - Critical** | The differential percentage is the primary clinical result. Manual calculation is error-prone. |
| URS-031 | The system SHALL update percentages in real time as counts change. | **P0 - Critical** | Allows operator to monitor the differential as it develops, which aids in identifying abnormal patterns early. |
| URS-032 | The system SHALL display percentages with at minimum 1 decimal place precision. | **P1 - High** | Low-percentage cell types (e.g., basophils at 0.5%) require decimal precision to be clinically meaningful. |
| URS-033 | The system SHALL handle division by zero gracefully when total count is zero. | **P0 - Critical** | Application must not crash or display NaN/Infinity before counting begins or after a reset. |
| URS-034 | The system SHALL ensure that displayed percentages sum to 100% (within rounding tolerance). | **P1 - High** | Percentages that do not sum to 100% indicate a calculation error and undermine clinical confidence. |

### 5.5 Count Completion and Validation

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-040 | The system SHALL allow the user to indicate that counting is complete ("Count Done"). | **P0 - Critical** | Marks the transition from counting to result review/output. |
| URS-041 | The system SHALL enforce a configurable minimum cell count threshold before allowing count completion. | **P0 - Critical** | **Currently missing.** A 10-cell differential is statistically meaningless. CAP/CLIA standards require adequate cell counts. Default minimums: BM = 200, PB = 100. |
| URS-042 | The system SHALL warn the user if the total count is below the configured minimum and require explicit override to proceed. | **P0 - Critical** | Allows operator to proceed in cases of hypocellular specimens while documenting that the count is suboptimal. |
| URS-043 | The system SHALL lock the counting table after "Count Done" to prevent accidental modification of finalized results. | **P1 - High** | **Currently missing.** Post-finalization changes would create discrepancies between the counted data and the generated output. |

### 5.6 Output and Reporting

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-050 | The system SHALL generate formatted output reports upon count completion. | **P0 - Critical** | Output is the primary deliverable - the formatted differential for clinical documentation. |
| URS-051 | The system SHALL support multiple institutional output templates selectable by the user. | **P1 - High** | Different institutions have different reporting formats and conventions. |
| URS-052 | The system SHALL include the case/accession number in all output reports. | **P0 - Critical** | **Currently missing.** Output without case identification cannot be reliably matched to a patient. |
| URS-053 | The system SHALL include the total cell count in all output reports. | **P0 - Critical** | The total count is essential clinical context for interpreting the differential. |
| URS-054 | The system SHALL include per-cell-type percentages in all output reports. | **P0 - Critical** | The differential percentages are the primary clinical data. |
| URS-055 | The system SHALL provide a mechanism to copy the output text to the system clipboard. | **P1 - High** | **Currently missing.** Operators need to paste results into the LIS/EMR. Manual retyping introduces transcription errors. |
| URS-056 | The system SHALL display output in a tabbed interface when multiple templates are available. | **P2 - Medium** | Allows quick comparison between institutional formats without page navigation. |

### 5.7 Reset and New Case

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-060 | The system SHALL provide a reset function to clear all data and return to the initial state. | **P0 - Critical** | Operator must be able to start fresh for the next case. |
| URS-061 | The system SHALL require confirmation before executing a reset if any count data exists. | **P0 - Critical** | **Currently missing.** Accidental reset during an active count would destroy all work with no recovery possible. |
| URS-062 | The system SHALL automatically clear all data when a new case number is entered. | **P0 - Critical** | Prevents data carryover between cases. |
| URS-063 | The system SHALL return to the case number input state after reset. | **P1 - High** | Natural workflow: after completing one case, the operator should be prompted for the next case number. |

### 5.8 Morphology Comments

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-070 | The system SHALL provide a free-text comment field for morphology observations. | **P1 - High** | **Currently missing.** Cell morphology findings (toxic granulation, Auer rods, Dohle bodies, hypersegmentation, dysplasia) are clinically significant and must accompany the differential count. |
| URS-071 | The system SHALL include morphology comments in the generated output reports. | **P1 - High** | Comments are part of the complete differential report. |

### 5.9 Session Data and History

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-080 | The system SHALL retain completed count data for the duration of the browser session. | **P1 - High** | **Currently missing.** Allows the operator to review previous counts during a work session (e.g., for QC review or to compare with a re-count). |
| URS-081 | The system SHALL provide a session history showing case numbers and completion status. | **P2 - Medium** | Helps operator track which cases have been counted during a shift. |
| URS-082 | The system SHALL allow retrieval of a completed count from session history for review (read-only). | **P2 - Medium** | Enables review without risk of modification. |
| URS-083 | The system SHALL clearly indicate that session data does not persist beyond the browser session. | **P1 - High** | Manages user expectations; makes it clear that this is a counting aid, not a permanent record system. |
| URS-084 | The system SHALL allow the user to export the current session history to local files in CSV and JSON formats. | **P1 - High** | Provides a local record for QC review, documentation, and continuity when the session ends. |

### 5.10 Usability and Accessibility

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-090 | The system SHALL be operable entirely via keyboard during counting (no mouse required). | **P0 - Critical** | Operator's hands are on the microscope focus/stage controls and keyboard. Mouse interaction breaks workflow and increases count time. |
| URS-091 | The system SHALL display cell type labels, counts, and percentages in a font size readable from normal working distance (approximately 24 inches). | **P1 - High** | Operator glances at the screen while looking through the microscope. Text must be legible at a distance. |
| URS-092 | The system SHALL display clear instructions guiding the user through the counting workflow. | **P1 - High** | Reduces training time and prevents procedural errors, especially for infrequent users. |
| URS-093 | The system SHALL be compatible with standard web browsers (Chrome, Firefox, Edge) without plugins. | **P1 - High** | Institutional IT policies often restrict software installation. Browser-based deployment minimizes IT friction. |
| URS-094 | The system SHALL not require an internet connection for counting operations after initial page load. | **P2 - Medium** | Laboratory workstations may have restricted or unreliable internet access. |
| URS-095 | The system SHALL provide both Light and Dark presentation themes and allow the user to switch between them via an on-screen control and a keyboard shortcut that does not interfere with counting. | **P1 - High** | Bright laboratory lighting can make dark UIs fatiguing; fast theme switching improves ergonomics without disrupting workflow. |

### 5.11 Configuration

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-100 | The system SHALL load cell type definitions and keyboard mappings from a configuration file. | **P1 - High** | Different laboratories may require different cell categories or key assignments. Configuration without code changes supports site customization. |
| URS-101 | The system SHALL load output template definitions from a configuration file. | **P1 - High** | Institutions have different reporting formats that change over time. |
| URS-102 | The system SHALL allow configuration of the minimum cell count threshold per specimen type. | **P1 - High** | BM aspirate differentials typically require 200 or 500 cells; PB differentials typically require 100 cells. These vary by institution. |

---

## 6. Requirements Not Addressed (Out of Scope for v1.0)

The following capabilities were considered but are explicitly out of scope for the initial release. They are documented here for future design input consideration.

| Area | Description | Rationale for Exclusion |
|------|-------------|------------------------|
| LIS/EMR Integration | Direct electronic transmission of results to LIS via HL7/FHIR | Requires institution-specific interface development; copy-to-clipboard provides interim solution |
| User Authentication | Login/password for operator identification | Application is a personal aid; operator ID can be captured without full auth system |
| Long-term Data Persistence | Database storage of historical counts | Requires server infrastructure; session storage provides adequate short-term history |
| Automated Cell Recognition | AI/ML-based cell identification | Fundamentally different product; Tessera is a manual counting aid |
| Reference Range Flagging | Automatic flagging of abnormal percentages | Deferred to v2.0; requires institution-specific reference range configuration |
| Electronic Signatures | 21 CFR Part 11 compliant digital signatures | Requires identity management infrastructure |
| Multi-user Collaboration | Simultaneous access to the same case | Not consistent with manual counting workflow |

---

## 7. Acceptance Criteria Summary

A summary of the key acceptance criteria that must be met for the system to be considered compliant with this URS:

1. No counting session can begin without a case/accession number entered
2. All count data is completely cleared when a new case is entered
3. Every keypress correctly increments exactly one cell type by exactly one count
4. Percentages are mathematically correct to the stated precision at all times
5. Division by zero produces a safe display (0% or blank), not an error
6. Undo/decrement correctly reduces the count without going below zero
7. Minimum cell count threshold is enforced before output generation
8. All output reports include case number, total count, and per-cell percentages
9. Reset requires confirmation when count data exists
10. The application functions without error in Chrome, Firefox, and Edge
11. User can switch between light and dark themes via control or shortcut without disrupting counting

---

## 8. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - complete user requirements defined |
| B | 2026-02-19 | QMS | Added session export requirement for local record |
| C | 2026-02-20 | QMS | Added theme switch requirement for ergonomic presentation |

## 9. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical User Representative | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
