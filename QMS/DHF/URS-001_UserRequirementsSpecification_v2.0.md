# URS-001: User Requirements Specification

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | URS-001 |
| **Version** | 2.0 (Rev H) |
| **Product** | WBC ΔΣ (Eukrasia) |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-08-05 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Companion Document** | SPC-001 (Use Case Specification v1.2) |
| **Standards Basis** | REF-001 (Standards and Literature) |

---

## 1. Purpose

This document defines the user requirements for the WBC ΔΣ software application (a manual differential counter). Requirements are derived from clinical workflow analysis, regulatory standards, laboratory best practices, and direct stakeholder feedback from practicing hematopathologists. Each requirement is assigned a unique identifier, priority, and rationale.

## 2. Scope

This URS covers all user-facing functionality of WBC ΔΣ including specimen identification, cell counting, calculation, output generation, data integrity, usability, configuration, and sensory feedback requirements.

## 3. Users and Stakeholders

| Stakeholder | Role | Needs |
|-------------|------|-------|
| Medical Technologist (MT/MLS) | Primary user — performs the differential count | Fast, accurate keyboard-driven counting; clear results |
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
| Body Fluid (BF) | CSF, pleural, peritoneal, pericardial, synovial, or BAL specimen |
| Case/Accession Number | Unique identifier assigned to a patient specimen in the Laboratory Information System |
| Cell Type | A morphologic classification category (e.g., blast, neutrophil, lymphocyte) |
| Aggregated Category | A single counting category that combines multiple cell types (e.g., GRAN = myelocytes + metamyelocytes + bands + segmented neutrophils) |
| Configuration Profile | A JSON file defining cell categories, keyboard mappings, count targets, derived formulas, and display preferences for a specific institutional practice |

---

## 5. User Requirements

### 5.1 Case Identification

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-001 | The system SHALL provide a case/accession number input field. | **P0 – Critical** | Every count should be traceable to a specimen. The field ensures traceability is available. |
| URS-002 | The system SHALL display the active case number prominently at all times during counting and on all output. | **P0 – Critical** | Prevents transcription errors and ensures the operator always knows which case is active. |
| URS-003 | The system SHALL completely clear all count data, percentages, and output when a new case number is entered. | **P0 – Critical** | Prevents carryover of data between patients. |
| URS-004 | Whether the case number is required before counting begins SHALL be configurable per institutional profile. The default is **not required**. | **P0 – Critical** | _Amended from v1.0._ Stakeholder feedback: "We don't get confused by what case is in front of us" at the microscope. Physical context identifies the specimen. Forcing case entry before counting kills adoption at institutions where the counter replaces a mechanical device. Institutions requiring traceability can set `requireCaseNumber: true` in their configuration profile. |
| URS-005 | The system SHALL accept alphanumeric case/accession numbers of variable length consistent with common LIS formats. | **P1 – High** | Different institutions use different accession number formats (e.g., S25-1234, H25-00567, 25-A-12345). |
| URS-006 | The system SHALL allow the user to transition from case number entry to counting by pressing Enter, supporting barcode-scanner workflows where the scanner appends an Enter keystroke after input. | **P1 – High** | Barcode scanners typically emit a carriage return after scanning. |

### 5.2 Specimen Type Selection

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-010 | The system SHALL allow the user to select a specimen type before or during counting. | **P0 – Critical** | Bone marrow, peripheral blood, and body fluids have different cell type categories. |
| URS-011 | The system SHALL support at minimum Bone Marrow (BM) and Peripheral Blood (PB) specimen types. Body Fluid (BF) types SHALL be supported when a configuration profile defines them. | **P0 – Critical** | _Amended from v1.0._ BM and PB are primary types. Body fluids (CSF, pleural, peritoneal) have distinct category sets (lymphocytes, monocytes/macrophages, mesothelial cells, neutrophils, eosinophils, malignant cells) and are a documented clinical workflow (CLSI H56-A). |
| URS-012 | The system SHALL display cell type categories appropriate to the selected specimen type, as defined in the active configuration profile. For bone marrow, the shipped profile SHALL implement the ICSH 2008 §2.6 nucleated differential count [S1]. Categories that ICSH excludes from the NDC — megakaryocytes, macrophages, osteoblasts, osteoclasts, stromal cells, smudged cells and non-haemopoietic cells such as metastatic tumour cells — SHALL NOT be counted into the differential, and the interface SHALL make this explicit wherever a general-purpose category is offered. | **P0 – Critical** | _Expanded 2026-08-05 (Rev F)._ Categories vary by specimen type and institution. A cell counted into a general "other" category that ICSH excludes enters the denominator and depresses every reported percentage — see RA-001 HA-090. |
| URS-013 | The system SHALL warn the user when switching specimen type if a count is in progress (total > 0). If a case number is present, the in-progress count SHALL be saved to session history before the switch. If no case number is present, the count SHALL be discarded after confirmation. | **P1 – High** | _Amended from v1.0._ Original requirement demanded a full reset. Saving to session history preserves work. |

### 5.3 Cell Counting

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-020 | The system SHALL allow the user to increment a cell type count by pressing a single keyboard key. | **P0 – Critical** | Operator's eyes must remain on the microscope; keyboard-only input is essential for accuracy and speed. |
| URS-021 | The system SHALL assign a unique keyboard key to each cell type within a specimen type, as defined in the active configuration profile. No two categories may share a key within the same specimen type. | **P0 – Critical** | Ambiguous mappings would cause miscounts. |
| URS-022 | The system SHALL display the keyboard key mapping for each cell type at all times during counting. | **P0 – Critical** | Operator must be able to quickly verify which key maps to which cell type. |
| URS-023 | The system SHALL display the current count for each cell type in real time as keys are pressed. | **P0 – Critical** | Immediate feedback confirms the keypress was registered. |
| URS-024 | The system SHALL maintain and display a running total of all cells counted and a progress indicator toward the configured target count. | **P0 – Critical** | Operator must know when the target is reached. |
| URS-025 | The system SHALL allow the user to decrement (undo) a cell type count via Shift+key (or a configurable modifier). A count of zero SHALL NOT be decremented further. | **P0 – Critical** | Miscounts occur frequently during rapid counting. |
| URS-026 | The system SHALL silently ignore keypresses for keys not assigned to any cell category. | **P1 – High** | Prevents confusion from accidental key presses on unmapped keys. |
| URS-027 | The system SHALL provide configurable audio feedback for valid keypresses to confirm registration, with distinct sounds for: (a) successful cell count increment, (b) successful undo/decrement, (c) keypresses while focus is not on the counting grid (e.g., in comments field). Audio feedback SHALL be independently enabled/disabled by the user. | **P1 – High** | _Expanded from v1.0._ During rapid counting with eyes on the microscope, audio confirmation is the primary feedback channel. Different sounds for counting vs. text entry prevent confusion about where keystrokes are going. |
| URS-028 | The system SHALL provide a "Start Count" control (button and/or keyboard shortcut) that transitions from the case-entry/specimen-selection state to the active counting state. When activated, the system SHALL begin accepting mapped keystrokes for cell counting. | **P1 – High** | _New._ Present in both legacy systems. Provides a clear boundary between setup and counting phases. Enables timestamping of count start for audit purposes. |

### 5.4 Percentage Calculation and Derived Values

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-030 | The system SHALL automatically calculate and display the percentage of each cell type relative to **the differential denominator**, which the configuration profile defines. A profile SHALL be able to designate categories that are counted but excluded from that denominator and reported per 100 of it instead. | **P0 – Critical** | _Amended 2026-08-05 (Rev G, DCR-006)._ The differential percentage is the primary clinical result. Nucleated red cells in peripheral blood are the governing case: they are enumerated alongside the leucocytes but are not leucocytes, and are conventionally reported per 100 WBC with the WBC count corrected. Including them in the denominator depresses every reported leucocyte percentage — with 20 NRBC among 200 cells a true 66.7% neutrophil count reports as 60.0%, which is clinically material in haemolysis, myelophthisis and neonatal samples. Bone marrow is the opposite case: erythroblasts belong in the nucleated differential count (ICSH 2008 §2.6 [S1]) and stay in the denominator. The behaviour is therefore per-profile, never global. |
| URS-031 | The system SHALL update percentages in real time as counts change. | **P0 – Critical** | Allows operator to monitor the differential as it develops. |
| URS-032 | The system SHALL display percentages with at minimum 2 decimal places precision. | **P1 – High** | _Amended from v1.0 (was 1 decimal)._ Low-percentage cell types (e.g., basophils at 0.50%) benefit from additional precision. Consistent with observed system behavior. |
| URS-033 | The system SHALL handle division by zero gracefully when total count is zero (display 0.00%, not NaN or error). | **P0 – Critical** | Application must not crash before counting begins or after reset. |
| URS-034 | The system SHALL ensure that reported percentages sum to exactly 100% at the precision displayed, by distributing the rounding residual using the largest-remainder method: each value is truncated to the displayed precision and the remaining units are allocated one at a time to the categories with the largest truncated remainders. Ties SHALL be broken deterministically. No category SHALL deviate from its true percentage by more than one unit of the last displayed decimal place. | **P1 – High** | _Amended 2026-08-04 (Rev E, DCR-004)._ Percentages that do not sum to 100% undermine clinical confidence. The original wording required the residual to be applied "to the largest-count category", which concentrates the whole residual in one cell type. At the integer precision used by report templates this is clinically misleading: fourteen equal categories (true value 7.14% each) each round to 7%, leaving a residual of 2 that would be reported as **9%** for one category — a 1.9-point overstatement printed in the patient report. The largest-remainder method achieves the same sum-to-100 guarantee while bounding every category's error at one unit. |
| URS-035 | The system SHALL compute and display derived formulas defined in the configuration profile (e.g., M:E ratio) in real time as counts change. If a formula denominator is zero, it SHALL display "N/A." The shipped M:E formula SHALL follow ICSH 2008 §2.6 [S1]: all granulocytes and monocytes and their precursors (myeloblasts, promyelocytes, myelocytes, metamyelocytes, band forms, segmented neutrophils, eosinophils, basophils, promonocytes, monocytes) over erythroblasts at all stages of differentiation. | **P1 – High** | _New; citation added 2026-08-05 (Rev F)._ A widely taught alternative convention excludes monocytes from the numerator, producing a materially different ratio from identical counts. Both are in use. The shipped default follows ICSH; laboratories using the alternative express it in configuration. Because the two disagree, the convention in force must be visible in the report rather than implied. **Limitation:** ICSH's numerator specifies *myeloblasts*, but the profile has a single generic `blasts` category, so lymphoid blasts are included where ICSH would exclude them (RA-001 HA-091). |
| URS-037 | The system SHALL report the statistical uncertainty of each differential percentage arising from the finite number of cells counted, as a confidence interval whose level is configurable. A zero count SHALL be reported as a bounded interval rather than as certainty. | **P1 – High** | _New 2026-08-05 (Rev H, DCR-007)._ A differential count is a sample, and the observed percentage carries sampling error that is large at the counts used in practice and proportionally largest for the rare populations carrying the most diagnostic weight — the imprecision Rümke warned of [S4]. An observed 20% blasts at 200 cells has a 95% interval of 15.0–26.1%, which spans the 20% AML threshold; at 500 cells it is 16.7–23.7% and still spans it. Reporting the point estimate alone presents a precision the count does not support. Stating the interval also gives ICSH §2.6's direction to extend the count near a critical threshold [S1] an operational test. |
| URS-036 | The system SHALL optionally accept a total WBC count (from the hematology analyzer) and compute absolute cell counts (WBC × percentage / 100) for each category. This capability SHALL be configurable (always show, optional checkbox, or disabled). | **P2 – Medium** | _New._ Absolute counts (e.g., absolute neutrophil count) are clinically significant and frequently reported alongside the differential. |

### 5.5 Count Completion and Resumption

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-040 | The system SHALL allow the user to indicate that counting is complete ("Count Done") at any total count greater than zero. | **P0 – Critical** | _Amended from v1.0._ Marks the transition from counting to result review. Available at any count — not blocked by minimum threshold. |
| URS-041 | If the total count at completion is below the configured target, the system SHALL display a non-blocking informational note (e.g., "216-cell count; statistical confidence reduced for populations <5%") and SHALL NOT require explicit override. | **P1 – High** | _Amended from v1.0 (was P0 enforced threshold with override)._ Stakeholder feedback: "Let us get to the finish line without asking about low count." Pathologists know when an aspirate is paucicellular. Blocking dialogs for low counts drives users away. The target count is advisory, not enforced. |
| URS-042 | The system SHALL display a "Continue Counting →" option on the results screen that returns the user to the counting interface with all tallies preserved, allowing additional cells to be added to the existing count. | **P0 – Critical** | _New. Replaces v1.0 URS-043 (lock counting after Count Done)._ Stakeholder requirement: "One function that would be nice is an option, AFTER getting to the result tab, to have a button that allows us to go back to counting if we realize that the resulting percentages are borderline." This supports the clinical workflow of counting near a diagnostic cutoff (e.g., 20% blasts for AML diagnosis), reviewing, deciding more cells are needed, and continuing without losing prior work. |
| URS-043 | _Withdrawn._ | — | _Original requirement locked counting after "Count Done." Replaced by URS-042 (Continue Counting) which better serves the clinical workflow._ |

### 5.6 Output and Reporting

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-050 | The system SHALL generate formatted output upon count completion. | **P0 – Critical** | Output is the primary deliverable. |
| URS-051 | The system SHALL support export in JSON, CSV, and clipboard (plain text) formats. Institutional output templates SHALL be configurable. | **P1 – High** | _Amended from v1.0._ Specific export formats defined. |
| URS-052 | The system SHALL include in all output: case/accession number (if entered), specimen type, total cell count, per-cell-type counts and percentages, derived formula values, morphology comments, configuration profile ID and version, and timestamp. | **P0 – Critical** | _Expanded from v1.0._ Complete traceability data in every export. |
| URS-053 | The system SHALL provide a mechanism to copy the formatted output text to the system clipboard for pasting into LIS/EMR. | **P1 – High** | Operators need to paste results into the LIS. Manual retyping introduces transcription errors. |
| URS-054 | The system SHALL provide a print-friendly view or PDF export of the completed count results. | **P2 – Medium** | _New._ Many labs attach printed results to physical case folders or worksheets. |

### 5.7 Reset and New Case

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-060 | The system SHALL provide a reset function to clear all count data and return to the initial state. | **P0 – Critical** | Operator must be able to start fresh. |
| URS-061 | The system SHALL require confirmation before executing a reset if any count data exists (total > 0). | **P0 – Critical** | Prevents accidental destruction of count work. |
| URS-062 | The system SHALL automatically clear all count data when a new case number is entered. | **P0 – Critical** | Prevents data carryover between patients. |
| URS-063 | After reset, the system SHALL preserve the selected specimen type and configuration profile. The case number field SHALL be cleared and focused for the next case. | **P1 – High** | _Amended from v1.0._ Preserving specimen type matches the common workflow of counting multiple cases of the same type during a session. |

### 5.8 Morphology Comments

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-070 | The system SHALL provide a collapsible free-text comment field for morphology observations that does not interfere with keyboard counting when collapsed. | **P1 – High** | _Amended from v1.0._ Cell morphology findings (toxic granulation, Auer rods, Döhle bodies, hypersegmentation, dysplasia) are clinically significant. The field must not capture counting keystrokes when not actively being edited. |
| URS-071 | The system SHALL include morphology comments in all output formats. | **P1 – High** | Comments are part of the complete differential report. |
| URS-072 | The system SHALL support optional structured/synoptic morphology comment templates (e.g., checkboxes for common findings) when defined in the configuration profile, in addition to the free-text field. | **P2 – Medium** | _New._ Structured comments improve reporting consistency. Possible future integration with speech-to-text input. |
| URS-073 | Comments SHALL be preserved across Count Done → Continue Counting cycles. | **P1 – High** | _New._ Morphological observations should not be lost when resuming counting. |

### 5.9 Session Data, History, and Recovery

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-080 | The system SHALL retain completed count data for the duration of the browser session. | **P1 – High** | Allows review of previous counts during a work session. |
| URS-081 | The system SHALL provide a session history showing case numbers, specimen types, and completion status. | **P2 – Medium** | Helps operator track which cases have been counted during a shift. |
| URS-082 | The system SHALL allow retrieval of a completed count from session history for review (read-only). | **P2 – Medium** | Enables review without risk of modification. |
| URS-083 | The system SHALL clearly indicate that session data does not persist beyond the browser session unless explicitly exported. | **P1 – High** | Manages user expectations. |
| URS-084 | The system SHALL allow export of session history to local files in CSV and JSON formats. | **P1 – High** | Provides local record for QC review and documentation. |
| URS-085 | The system SHALL auto-save the current count state to browser localStorage after every keystroke (or configurable interval) to enable recovery after accidental tab closure or browser crash. On relaunch, the system SHALL offer to restore the interrupted count. This feature SHALL be configurable (`autosave: true/false`). | **P1 – High** | _New._ Loss of a 400-cell bone marrow count due to accidental browser closure is clinically significant. Auto-recovery prevents rework. |

### 5.10 Usability, Accessibility, and Sensory Feedback

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-090 | The system SHALL be operable entirely via keyboard during counting (no mouse required). | **P0 – Critical** | Operator's hands are on microscope controls and keyboard. |
| URS-091 | The system SHALL display cell type labels, counts, and percentages in a font size readable from normal working distance (~24 inches / 60 cm). | **P1 – High** | Operator glances at screen while looking through the microscope. |
| URS-092 | The system SHALL provide clear instructions guiding the user through the counting workflow. | **P1 – High** | Reduces training time and prevents procedural errors. |
| URS-093 | The system SHALL be compatible with standard web browsers (Chrome, Firefox, Edge) without plugins or installation. | **P1 – High** | Institutional IT policies restrict software installation. |
| URS-094 | The system SHALL not require an internet connection for counting operations after initial configuration load. | **P1 – High** | _Upgraded from P2._ Laboratory workstations often have restricted internet. Offline operation after config load is essential for reliability. |
| URS-095 | The system SHALL provide Light and Dark presentation themes switchable via on-screen control and a keyboard shortcut that does not interfere with counting. | **P1 – High** | Microscopy rooms often have controlled lighting. Theme switching improves ergonomics. |
| URS-096 | For aggregated categories (where multiple cell types are collapsed into a single counting button), the system SHALL display a tooltip or mouseover indicator listing the constituent cell types. | **P1 – High** | _New._ When a configuration aggregates cells (e.g., GRAN = myelocytes + metamyelocytes + bands + segmented), the user must be able to verify what the aggregation contains without consulting documentation. |
| URS-097 | The system SHALL provide configurable audio feedback for counting events. When enabled, valid keystrokes SHALL produce a distinct confirmation sound (optionally speaking the cell category name), undo keystrokes SHALL produce a different sound, and text entry in comments SHALL produce a typewriter-style keystroke sound. Audio SHALL be independently togglable. | **P1 – High** | _New._ Audio feedback is the primary confirmation channel when the operator's eyes are on the microscope. Distinct sounds for counting vs. text entry prevent confusion about keyboard focus state. |

### 5.11 Configuration and Personalization

| ID | Requirement | Priority | Rationale |
|----|------------|----------|-----------|
| URS-100 | The system SHALL load cell type definitions, keyboard mappings, count targets, derived formulas, and display preferences from a JSON configuration profile. | **P0 – Critical** | _Expanded from v1.0._ Configuration profiles are the central architectural element. Different laboratories require different categories, keys, targets, and formulas. |
| URS-101 | The system SHALL provide a catalog of preset configuration profiles representing common institutional practices (e.g., harmonized 9-part, legacy 9-part, full 14-part consensus, minimal 5-part). | **P1 – High** | _New._ Users need sensible starting points, not a blank configuration screen. |
| URS-102 | The system SHALL provide a visual configuration editor that allows the user to: (a) view all available cell types in a complete reference set, (b) select which cell types to include, (c) drag-and-drop to arrange cell order, (d) aggregate cell types by dragging one onto another (with a standard name for the aggregate), (e) assign keyboard keys to each category, (f) set target counts per specimen type, (g) define derived formulas, and (h) save the result as a reusable configuration profile (JSON file). | **P0 – Critical** | _New. Replaces v1.0 URS-102 (simple threshold config)._ The visual configuration editor is the mechanism by which the system accommodates unlimited institutional variation without requiring code changes or JSON editing. Users must be able to see, arrange, and customize their counting layout interactively. "The tool is in the hands of the user." |
| URS-103 | The system SHALL allow the user to import a previously saved configuration profile (JSON file) and to export the current configuration for backup or distribution. | **P1 – High** | _New._ Supports configuration sharing between workstations or colleagues without a central server. |
| URS-104 | The system SHALL provide default keyboard mapping presets for both left-hand-dominant and right-hand-dominant users, reflecting the ergonomic constraint that one hand operates the microscope while the other types. | **P1 – High** | _New._ Left-hand mapping uses QWERTY left zone (Q–T, A–G, Z–B). Right-hand mapping uses QWERTY right zone (Y–P, H–;, N–/). Users who operate the microscope with their left hand need right-hand key assignments. |
| URS-105 | The system SHALL allow configuration of the target cell count per specimen type. Default targets: **PB 200** (CLSI H20-A2 [S2]); **BM 500** (ICSH 2008 §2.6 [S1]). The BM figure is conditional in its source: ICSH specifies "at least 500 cells... in at least two smears when a precise percentage of an abnormal cell type is required for diagnosis and disease", and "at least 300 cells... if the NDC is not essential to the diagnosis". Profiles SHALL be able to express either target. | **P1 – High** | _Amended from v1.0 URS-102; citation corrected 2026-08-05 (Rev F, DCR-005)._ The 500-cell default was previously attributed to a "CAP recommendation"; the source is ICSH 2008 [S1] and the recommendation is conditional on diagnostic intent. AJCP 2018 [S5] independently found 300-cell counts diagnostically non-inferior across 165 cases, including 100% sensitivity for AML at the 20% myeloblast threshold. The "two smears" element is specimen handling and belongs to SOP-001. |
| URS-106 | The system SHALL cache the active configuration profile in browser localStorage. After initial configuration, no network connection SHALL be required. | **P1 – High** | _New._ Supports offline operation per URS-094. |
| URS-107 | The system SHALL allow configuration of output template definitions. | **P1 – High** | _Carried from v1.0 URS-101._ Institutions have different reporting formats. |

---

## 6. Requirements Not Addressed (Out of Scope for v1.0)

| Area | Description | Rationale for Exclusion | Phase |
|------|-------------|------------------------|-------|
| LIS/EMR Integration | Direct electronic transmission via HL7/FHIR | Requires institution-specific interface development; copy-to-clipboard provides interim solution. Architecture anticipates via JSON export. | 2 |
| User Authentication | Login/password for operator identification | Application is a personal counting aid. Operator ID may be captured as optional metadata. | 2 |
| Long-term Data Persistence | Server/database storage of historical counts | Requires server infrastructure. Auto-save to localStorage provides crash recovery. Export provides archival. | 2 |
| Automated Cell Recognition | AI/ML-based cell identification from images | Fundamentally different product. WBC ΔΣ is a manual counting aid. | — |
| Reference Range Flagging | Automatic flagging of abnormal percentages | Requires institution-specific reference range configuration. | 2 |
| Electronic Signatures | 21 CFR Part 11 compliant digital signatures | Requires identity management infrastructure. | 2 |
| Multi-examiner Workflow | Two-examiner counts per CLSI H20-A2 reference method, with merge/comparison of independent counts | Different operational mode requiring examiner identity, paired-count data model, and statistical comparison. The Phase 1 CountSession data model reserves an `examiner` field. | 2 |
| Companion Device Input | iPhone/iPad as wireless keypad with cell morphology images, connected via WebSocket or BLE | Counting engine accepts category-level input events (not raw keycodes), so companion input requires no architectural change — only a communication layer. | 2+ |

---

## 7. Acceptance Criteria Summary

1. Configuration profile loads successfully and displays correct cell categories, keyboard mappings, and target counts
2. Case number field is present; whether it is required before counting is determined by the configuration profile
3. Every valid keypress correctly increments exactly one cell type by exactly one count with audible/visual confirmation (if enabled)
4. Undo (Shift+key) correctly decrements without going below zero
5. Percentages are mathematically correct to 2 decimal places and sum to exactly 100.00%, with no category deviating from its true value by more than one unit of the last decimal place
6. Derived formulas compute correctly; denominator-zero cases display "N/A"
7. Target count is advisory: "Count Done" is available at any total > 0 with informational note for sub-target counts
8. "Continue Counting" returns to counting with all tallies preserved
9. All output includes case number (if entered), specimen type, total count, per-cell percentages, formulas, comments, config ID, and timestamp
10. Reset requires confirmation when count data exists
11. Aggregated categories display constituent cell types on mouseover
12. Visual configuration editor allows interactive cell arrangement, aggregation, key assignment, and profile save/load
13. Auto-save recovers interrupted counts after accidental browser closure (when enabled)
14. Light and Dark themes switch without disrupting counting
15. The application functions without error in Chrome, Firefox, and Edge

---

## 8. Regulatory Position

WBC ΔΣ is a general-purpose manual counting tool — the digital equivalent of a mechanical differential counter (a tally device, not a diagnostic instrument). It does not perform automated cell recognition, does not make diagnostic decisions, and does not replace clinical judgment.

The application is most likely **excluded** from FDA device classification under 21 CFR 864.2260 (automated differential cell counter) because it performs no automated analysis. However, the design and documentation follow the principles of IEC 62304 (medical device software lifecycle) and 21 CFR 820 (Quality System Regulation) to ensure traceability, reproducibility, and quality:

- **Design History File (DHF)**: This URS, the companion Use Case Specification (SPC-001), and design verification records constitute a traceable design history.
- **Configuration traceability**: Every export includes the configuration profile ID and version, enabling audit of the counting parameters used for any reported result.
- **Local validation**: Each laboratory deploying WBC ΔΣ should perform local validation per their quality management system, verifying that their configuration profile produces correct counts and percentages.

The tool is given into the hands of the user. Governance of configuration profiles, operational procedures, and result review is the responsibility of the deploying laboratory, consistent with their CLIA/CAP/ISO 15189 quality management obligations.

---

## 9. URS v1.0 → v2.0 Change Summary

| ID | Change | Rationale |
|----|--------|-----------|
| URS-004 | Case number changed from mandatory to **configurable** (default: not required) | Stakeholder feedback: physical context identifies specimen at microscope |
| URS-011 | Added body fluid specimen type support | Clinical workflow exists (CLSI H56-A); config schema supports it |
| URS-013 | Specimen type switch saves to session history instead of requiring full reset | Preserves work |
| URS-027 | Expanded audio feedback specification with distinct sounds | Eyes-on-microscope workflow needs audio confirmation |
| URS-028 | Added "Start Count" control | Present in both legacy systems; timestamps count start |
| URS-032 | Changed from 1 to 2 decimal places | Consistent with system behavior |
| URS-034 | Rounding method changed from "apply residual to the largest-count category" to the largest-remainder method (Rev E) | Original wording concentrated the whole residual in one category, overstating it by up to ~2 points at integer precision |
| URS-035 | Added derived formula computation (M:E ratio) | Standard clinical output for BM |
| URS-036 | Added optional absolute count computation | Clinically significant; requires WBC input |
| URS-041 | Changed from enforced minimum with override to **advisory with informational note** | Stakeholder: "Let us get to finish line without asking" |
| URS-042 | Added "Continue Counting" resumption | Stakeholder: borderline results need more cells |
| URS-043 | **Withdrawn** (lock after Count Done) | Replaced by Continue Counting |
| URS-054 | Added print/PDF export | Labs attach printed results to physical folders |
| URS-063 | Reset preserves specimen type, clears case number | Matches multi-case-same-type workflow |
| URS-072 | Added structured morphology comment templates | Consistency; future speech integration |
| URS-073 | Comments preserved across resume cycles | Prevent loss of observations |
| URS-085 | Added auto-save and crash recovery | Prevent loss of long counts |
| URS-094 | Upgraded from P2 to P1 | Offline operation essential |
| URS-096 | Added aggregated category tooltips | Users must verify what's grouped |
| URS-097 | Added detailed audio feedback specification | Primary feedback channel at microscope |
| URS-100–107 | Comprehensive configuration and personalization requirements | Configuration is central architecture |

---

## 10. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft — complete user requirements defined |
| B | 2026-02-19 | QMS | Added session export requirement |
| C | 2026-02-20 | QMS | Added theme switch requirement |
| H | 2026-08-05 | QMS | URS-037 added: report the sampling uncertainty of each differential percentage as a configurable confidence interval. Quantifies what URS-041's advisory previously only alluded to. |
| G | 2026-08-05 | QMS | URS-030 amended: percentages are computed over a profile-defined differential denominator, and a category may be counted but excluded from it and reported per 100 instead. Corrects the peripheral blood NRBC convention. |
| F | 2026-08-05 | QMS | Citations verified against ICSH 2008 full text (REF-001 [S1]). URS-105 attribution corrected — the 500-cell BM target is ICSH, not CAP, and is conditional on diagnostic intent; the 300-cell provision added. URS-035 states the ICSH M:E definition, records the competing convention, and notes the generic-blasts limitation. URS-012 expanded with the ICSH NDC exclusion list. |
| E | 2026-08-04 | QMS | URS-034 amended: rounding residual distributed by the largest-remainder method rather than applied wholly to the largest-count category. Rationale and worked example in DCR-004 §5.1. Acceptance criterion 5 updated to match. |
| D | 2026-02-24 | QMS | Major revision: harmonized with SPC-001 v1.2. Amended case number, count completion, configuration, and audio feedback requirements per stakeholder review. Added body fluid, absolute count, auto-save, visual config editor, handedness, and structured comments requirements. See Section 9 for full change summary. |

## 11. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical User Representative | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
