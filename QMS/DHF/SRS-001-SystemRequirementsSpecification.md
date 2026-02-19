# SRS-001: System Requirements Specification

## Manual Differential Counter

| Field | Value |
|-------|-------|
| **Document ID** | SRS-001 |
| **Version** | 1.0 |
| **Product** | Manual Differential Counter (MDC) |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 |

---

## 1. Purpose

This document translates the User Requirements (URS-001) into specific, measurable, and testable system requirements. Each system requirement traces to one or more user requirements and serves as the basis for design, implementation, and verification.

## 2. Scope

This SRS covers the functional, performance, interface, data, and security requirements of the MDC application.

## 3. Reference Standards

| Standard | Title | Applicability |
|----------|-------|---------------|
| IEC 62304 | Medical Device Software - Software Life Cycle Processes | Software development lifecycle |
| ISO 14971 | Application of Risk Management to Medical Devices | Risk-based requirements |
| 21 CFR 820 | Quality System Regulation | Design controls |
| CLSI H20-A2 | Reference Leukocyte (WBC) Differential Count | Clinical counting standards |
| CAP Checklist | HEM.30550-30600 | Manual differential requirements |

---

## 4. System Requirements

### 4.1 Case Identification Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-001 | The system SHALL render a text input field labeled "Case / Accession #" in the header area, visible on initial page load. | URS-001 | Inspection |
| SYS-002 | The case number input field SHALL accept alphanumeric characters, hyphens, and forward slashes with a maximum length of 30 characters. | URS-005 | Test |
| SYS-003 | The "Start Count" button SHALL be disabled (grayed out, non-clickable) when the case number field is empty or contains only whitespace. | URS-004 | Test |
| SYS-004 | The system SHALL display the case number in a fixed-position header element with a minimum font size of 16px, visible during scrolling. | URS-002 | Inspection |
| SYS-005 | When a case number is entered and counting has not started, the system SHALL enable the "Start Count" button within 100ms of valid input. | URS-001 | Test |
| SYS-006 | When the case number field value changes after a count session has been completed or is in progress, the system SHALL: (a) display a confirmation dialog, (b) upon confirmation, clear all cell counts to zero, (c) clear all percentages to 0.00%, (d) clear the total to zero, (e) clear all output text, (f) reset the UI to pre-count state. | URS-003, URS-062 | Test |
| SYS-007 | The confirmation dialog for case change SHALL display the text: "Changing the case number will clear all current count data. Continue?" with "OK" and "Cancel" options. | URS-003 | Inspection |
| SYS-008 | If the user cancels the case change confirmation, the system SHALL restore the previous case number value and make no changes to count data. | URS-003 | Test |

### 4.2 Specimen Type Selection Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-010 | The system SHALL render a dropdown selector with options "Bone Marrow" and "Peripheral Blood". | URS-010, URS-011 | Inspection |
| SYS-011 | The default specimen type selection SHALL be "Bone Marrow". | URS-010 | Inspection |
| SYS-012 | Upon specimen type selection change, the system SHALL display the counting table corresponding to the selected specimen type and hide the other. | URS-012 | Test |
| SYS-013 | The system SHALL load cell type definitions from `settings/templates.json` for each specimen type. | URS-100 | Test |
| SYS-014 | For Bone Marrow, the system SHALL display exactly 9 cell type columns: blast, pro, gran, eryth, baso, eos, plasma, lymph, mono. | URS-012 | Inspection |
| SYS-015 | For Peripheral Blood, the system SHALL display exactly 9 cell type columns: poly, band, lymph, mono, eos, baso, pro, blast, other. | URS-012 | Inspection |
| SYS-016 | The specimen type selector SHALL be disabled after "Start Count" is pressed. | URS-013 | Test |
| SYS-017 | The specimen type selector SHALL be re-enabled after a reset or new case entry. | URS-013 | Test |

### 4.3 Counting Table Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-020 | The counting table SHALL contain exactly 4 rows: header row (cell type names), count row (numeric values), percentage row, and key mapping row. | URS-022, URS-023 | Inspection |
| SYS-021 | The counting table SHALL contain N+1 columns where N is the number of cell types, plus a "Total" column. | URS-024 | Inspection |
| SYS-022 | Each count cell SHALL display a numeric input field initialized to 0. | URS-023 | Test |
| SYS-023 | The key mapping row SHALL display the single-character keyboard key assigned to each cell type. | URS-022 | Inspection |
| SYS-024 | Count cells SHALL display integer values only (no decimals). | URS-023 | Test |
| SYS-025 | The Total column SHALL display the arithmetic sum of all individual cell counts. | URS-024 | Test |
| SYS-026 | Count values SHALL be rendered with a minimum font size of 14px. | URS-091 | Inspection |

### 4.4 Keyboard Input Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-030 | After "Start Count" is pressed, the system SHALL attach a document-level keydown event listener. | URS-020 | Test |
| SYS-031 | When a mapped key is pressed (without modifier keys), the system SHALL increment the corresponding cell count by exactly 1. | URS-020, URS-021 | Test |
| SYS-032 | When a mapped key is pressed while the Shift key is held, the system SHALL decrement the corresponding cell count by exactly 1. | URS-025 | Test |
| SYS-033 | The system SHALL NOT decrement a cell count below zero. If a Shift+key would reduce the count below 0, the count SHALL remain at 0. | URS-026 | Test |
| SYS-034 | The system SHALL update the Total column value within 50ms of any count change. | URS-024 | Test |
| SYS-035 | The system SHALL ignore keypresses for keys not mapped to any cell type. | URS-021 | Test |
| SYS-036 | The system SHALL ignore keypresses when modifier keys other than Shift are held (Ctrl, Alt, Cmd/Meta). | URS-020 | Test |
| SYS-037 | The system SHALL provide a visual flash (background color change, 150ms duration) on the affected cell when a key is pressed. | URS-027 | Inspection |
| SYS-038 | The Bone Marrow keyboard mapping SHALL be: A=blast, S=pro, D=gran, F=eryth, Z=baso, X=eos, C=plasma, V=lymph, B=mono. | URS-021 | Test |
| SYS-039 | The Peripheral Blood keyboard mapping SHALL be: A=poly, S=band, D=lymph, F=mono, Z=eos, X=baso, C=pro, V=blast, B=other. | URS-021 | Test |

### 4.5 Percentage Calculation Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-040 | The system SHALL calculate each cell percentage as: `(cell_count / total_count) * 100`. | URS-030 | Test |
| SYS-041 | Percentages SHALL be displayed with exactly 2 decimal places (e.g., "12.50%"). | URS-032 | Test |
| SYS-042 | When total count is 0, all percentage cells SHALL display "0.00" (not NaN, Infinity, or error). | URS-033 | Test |
| SYS-043 | Percentage recalculation SHALL occur within 50ms of any count value change. | URS-031 | Test |
| SYS-044 | The sum of all displayed percentages SHALL equal 100.00% +/- 0.10% (rounding tolerance) when total count > 0. | URS-034 | Test |
| SYS-045 | The percentage calculation SHALL use IEEE 754 double-precision floating point arithmetic with rounding to 2 decimal places using banker's rounding (round half to even). | URS-030 | Test |

### 4.6 Count Completion Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-050 | The system SHALL render a "Count Done" button. | URS-040 | Inspection |
| SYS-051 | The "Count Done" button SHALL be disabled until "Start Count" has been pressed. | URS-040 | Test |
| SYS-052 | The system SHALL define a minimum cell count threshold per specimen type, loaded from configuration. Default values: BM = 200, PB = 100. | URS-041, URS-102 | Test |
| SYS-053 | When "Count Done" is clicked and total count < minimum threshold, the system SHALL display a warning: "Total count ({actual}) is below the minimum ({minimum}) for {specimen type}. Continue anyway?" with "Continue" and "Cancel" options. | URS-042 | Test |
| SYS-054 | After "Count Done" is confirmed, the system SHALL detach the keydown event listener. | URS-043 | Test |
| SYS-055 | After "Count Done" is confirmed, the system SHALL set all count input fields to read-only. | URS-043 | Test |
| SYS-056 | After "Count Done" is confirmed, the system SHALL generate output for all configured templates. | URS-050 | Test |

### 4.7 Output Generation Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-060 | The system SHALL load output templates from `settings/templates.json`. | URS-101 | Test |
| SYS-061 | For each configured template, the system SHALL compile a Handlebars template with the following data: case number, total count, and per-cell-type percentage (rounded to nearest integer for output). | URS-050, URS-052, URS-053, URS-054 | Test |
| SYS-062 | The system SHALL render output in a tabbed interface with one tab per template. | URS-056 | Inspection |
| SYS-063 | Each tab SHALL display the institutional name and a favicon image (if configured). | URS-056 | Inspection |
| SYS-064 | Each output panel SHALL include a "Copy to Clipboard" button. | URS-055 | Inspection |
| SYS-065 | The "Copy to Clipboard" button SHALL copy the plain-text content of the active output tab to the system clipboard using the Clipboard API. | URS-055 | Test |
| SYS-066 | The system SHALL display a brief visual confirmation (e.g., "Copied!") for 2 seconds after successful clipboard copy. | URS-055 | Inspection |
| SYS-067 | The case/accession number SHALL appear as the first element in all generated output text. | URS-052 | Test |

### 4.8 Morphology Comments Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-070 | The system SHALL render a multi-line text area labeled "Morphology Comments" below the counting table. | URS-070 | Inspection |
| SYS-071 | The morphology comment field SHALL support a minimum of 500 characters. | URS-070 | Test |
| SYS-072 | The morphology comment text SHALL be appended to the generated output for each template. | URS-071 | Test |
| SYS-073 | The morphology comment field SHALL NOT capture keyboard input intended for counting (i.e., when the comment field is focused, keydown events SHALL NOT trigger cell counting). | URS-070 | Test |

### 4.9 Reset Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-080 | The system SHALL render a "Reset" button. | URS-060 | Inspection |
| SYS-081 | When "Reset" is clicked and any cell count > 0, the system SHALL display a confirmation dialog: "This will clear all count data for case {case_number}. Continue?" with "OK" and "Cancel" options. | URS-061 | Test |
| SYS-082 | Upon reset confirmation, the system SHALL: (a) set all cell counts to 0, (b) set all percentages to 0.00%, (c) set total to 0, (d) clear all output text, (e) clear morphology comments, (f) clear the case number field, (g) disable "Start Count" button, (h) enable specimen type selector. | URS-060, URS-063 | Test |
| SYS-083 | If no count data exists (all counts = 0), the system SHALL execute reset without a confirmation dialog. | URS-060 | Test |
| SYS-084 | After reset, keyboard focus SHALL be placed on the case number input field. | URS-063 | Test |

### 4.10 Session History Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-090 | The system SHALL maintain an in-memory array of completed count sessions for the current browser session. | URS-080 | Test |
| SYS-091 | Each session history entry SHALL contain: case number, specimen type, timestamp of completion, total count, per-cell-type counts, per-cell-type percentages, morphology comments, and generated output text. | URS-080 | Test |
| SYS-092 | The system SHALL render a collapsible "Session History" panel listing completed cases by case number and timestamp. | URS-081 | Inspection |
| SYS-093 | Clicking a session history entry SHALL display the completed count data in a read-only overlay without affecting the current active session. | URS-082 | Test |
| SYS-094 | The system SHALL display a notice in the session history panel: "Session data is temporary and will be lost when the browser is closed." | URS-083 | Inspection |
| SYS-095 | Session history SHALL be stored in browser sessionStorage (not localStorage) to ensure automatic cleanup. | URS-080 | Test |

### 4.11 Configuration Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-100 | The system SHALL fetch configuration data from `settings/templates.json` via HTTP GET on page load. | URS-100, URS-101 | Test |
| SYS-101 | If the configuration file fails to load, the system SHALL display an error message and prevent counting from starting. | URS-100 | Test |
| SYS-102 | The configuration file SHALL define for each specimen type: (a) specimen type identifier, (b) keyboard-to-cell-type mapping (outCodes), (c) one or more output templates with Handlebars syntax. | URS-100, URS-101 | Inspection |
| SYS-103 | The configuration file SHALL support a `minCellCount` property per specimen type. If absent, the system SHALL use default values (BM=200, PB=100). | URS-102 | Test |

---

## 5. Performance Requirements

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-P01 | Page load time (from request to interactive) SHALL be < 3 seconds on a standard laboratory workstation with broadband connection. | URS-093 | Test |
| SYS-P02 | Keypress-to-display-update latency SHALL be < 50ms. | URS-023, URS-031 | Test |
| SYS-P03 | Output template rendering SHALL complete within 500ms of clicking "Count Done". | URS-050 | Test |
| SYS-P04 | The application SHALL function correctly for counts up to 9,999 total cells without performance degradation. | URS-024 | Test |

## 6. Interface Requirements

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-I01 | The system SHALL render correctly in Google Chrome (latest 2 major versions). | URS-093 | Test |
| SYS-I02 | The system SHALL render correctly in Mozilla Firefox (latest 2 major versions). | URS-093 | Test |
| SYS-I03 | The system SHALL render correctly in Microsoft Edge (latest 2 major versions). | URS-093 | Test |
| SYS-I04 | The system SHALL function without an internet connection after the initial page load (all assets served locally or cached). | URS-094 | Test |
| SYS-I05 | The system SHALL use the system clipboard API for copy-to-clipboard functionality. | URS-055 | Test |

## 7. Data Requirements

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-D01 | Cell count values SHALL be stored as non-negative integers (0 to 9999). | URS-023, URS-026 | Test |
| SYS-D02 | Percentage values SHALL be stored as floating-point numbers with 2 decimal places. | URS-032 | Test |
| SYS-D03 | Case number SHALL be stored as a string, trimmed of leading/trailing whitespace. | URS-005 | Test |
| SYS-D04 | All in-session data SHALL be stored in JavaScript memory (no server-side persistence). | URS-080 | Inspection |
| SYS-D05 | Session history data SHALL be serialized to JSON for sessionStorage. | URS-080 | Test |

## 8. Security Requirements

| ID | Requirement | Verification Method |
|----|------------|-------------------|
| SYS-S01 | The system SHALL NOT transmit any patient or case data to external servers. | Inspection / Network audit |
| SYS-S02 | The system SHALL NOT store any patient data in cookies or localStorage. | Inspection |
| SYS-S03 | Session history in sessionStorage SHALL be automatically cleared when the browser tab/window is closed. | Test |
| SYS-S04 | The system SHALL sanitize all user input to prevent XSS attacks (case number, comments). | Test |

---

## 9. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - system requirements derived from URS-001 |

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Systems Engineer | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
