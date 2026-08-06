# SRS-001: System Requirements Specification

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | SRS-001 |
| **Version** | 3.2 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Date Revised** | 2026-02-24 |
| **Status** | **Approved** 2026-08-05 |
| **Parent Document** | DHF-001 |
| **Input Documents** | URS-001 v2.0, SPC-001 v1.2 |

---

## 1. Purpose

This document translates the User Requirements (URS-001 v2.0) and Use Case Specification (SPC-001 v1.2) into specific, measurable, and testable system requirements. Each system requirement traces to one or more user requirements and serves as the basis for design, implementation, and verification.

## 2. Scope

This SRS covers the functional, performance, interface, data, and security requirements of the WBC ΔΣ application v2.0, including the unified 14-cell counting layout, advisory target counts, derived formula computation, and count resumption.

## 3. Reference Standards

| Standard | Title | Applicability |
|----------|-------|---------------|
| IEC 62304 | Medical Device Software - Software Life Cycle Processes | Software development lifecycle |
| ISO 14971 | Application of Risk Management to Medical Devices | Risk-based requirements |
| 21 CFR 820 | Quality System Regulation | Design controls |
| CLSI H20-A2 | Reference Leukocyte (WBC) Differential Count | Clinical counting standards (PB: 200 cells) |
| CAP Checklist | HEM.30550-30600 | Manual differential requirements (BM: 500 cells) |

---

## 4. System Requirements

### 4.1 Case Identification Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-001 | The system SHALL render a text input field labeled "Case / Accession # (optional)" in the case-entry phase, visible on initial page load. | URS-001, URS-004 | Inspection |
| SYS-002 | The case number input field SHALL accept alphanumeric characters, hyphens, and forward slashes with a maximum length of 30 characters. | URS-005 | Test |
| SYS-003 | The "Start Count" button SHALL be enabled by default regardless of whether the case number field is empty, consistent with the default configuration where case number entry is not required before counting. _Amended from v1.0: Case number was previously mandatory._ | URS-004 | Test |
| SYS-004 | The system SHALL display the case number (if entered) in a fixed-position header element with a minimum font size of 16px, visible during counting and results phases. | URS-002 | Inspection |
| SYS-005 | _Reserved — merged into SYS-003._ | — | — |
| SYS-006 | When the case number field value changes after a count session has been completed or is in progress, the system SHALL: (a) display a confirmation dialog, (b) upon confirmation, clear all cell counts to zero, (c) clear all percentages to 0.00%, (d) clear the total to zero, (e) clear all output text, (f) reset the UI to pre-count state. | URS-003, URS-062 | Test |
| SYS-007 | The confirmation dialog for case change SHALL display the text: "Changing the case number will clear all current count data. Continue?" with "OK" and "Cancel" options. | URS-003 | Inspection |
| SYS-008 | If the user cancels the case change confirmation, the system SHALL restore the previous case number value and make no changes to count data. | URS-003 | Test |
| SYS-009 | When the case number input field is focused and the user presses Enter, the system SHALL trigger the "Start Count" action regardless of whether the case number field is empty or populated, supporting barcode-scanner workflows. _Amended from v1.0: previously required non-empty value._ | URS-006, URS-028 | Test |

### 4.2 Specimen Type Selection Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-010 | The system SHALL render a selector with options "Bone Marrow" and "Peripheral Blood". Additional specimen types (e.g., Body Fluid) SHALL be supported when defined in the configuration profile. | URS-010, URS-011 | Inspection |
| SYS-011 | The default specimen type selection SHALL be "Bone Marrow". | URS-010 | Inspection |
| SYS-012 | Upon specimen type selection change, the system SHALL display the counting layout corresponding to the selected specimen type as defined in the active configuration profile. | URS-012 | Test |
| SYS-013 | The system SHALL load cell type definitions, categories, keyboard mappings, target counts, and derived formulas from `settings/templates.json` for each specimen type. | URS-100 | Test |
| SYS-014 | For each specimen type, the system SHALL display cell types organized in two row groups as defined by the configuration `categories.upper` and `categories.lower` arrays. For the default BM configuration, the upper row (precursors) SHALL contain: nrbc, blasts, pro, myelo, meta, plasma, mast; the lower row (mature) SHALL contain: bands, poly, baso, eos, mono, lymph, other — 14 cell types total. _Amended from v1.0: was 9 cell types in a single row._ | URS-012 | Inspection |
| SYS-015 | For Peripheral Blood, the system SHALL display the same 14 cell types in the same two-row layout as Bone Marrow, using the unified keyboard mapping. _Amended from v1.0: PB previously had a different set of 9 cell types and different key assignments._ | URS-012 | Inspection |
| SYS-016 | The specimen type selector SHALL be disabled after "Start Count" is pressed. | URS-013 | Test |
| SYS-017 | The specimen type selector SHALL be re-enabled after a reset or new case entry. | URS-013 | Test |

### 4.3 Counting Table Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-020 | The counting table SHALL be rendered as two row groups: an upper row group (precursors) and a lower row group (mature cells), each containing a header label, per-cell columns with key label, cell name, count, and percentage, and a group subtotal column. A grand total SHALL be displayed below both groups. _Amended from v1.0: was a single flat table with 4 rows._ | URS-022, URS-023 | Inspection |
| SYS-021 | Each row group SHALL contain N columns (one per cell type in that group) plus a subtotal column. | URS-024 | Inspection |
| SYS-022 | Each count cell SHALL display a numeric value initialized to 0. | URS-023 | Test |
| SYS-023 | Each cell column SHALL display the keyboard key assigned to that cell type. | URS-022 | Inspection |
| SYS-024 | Count values SHALL be displayed as integer values only (no decimals). | URS-023 | Test |
| SYS-025 | The grand total SHALL display the arithmetic sum of all individual cell counts across both row groups. | URS-024 | Test |
| SYS-026 | Count values SHALL be rendered with a minimum font size of 14px. | URS-091 | Inspection |
| SYS-027 | When the active specimen type configuration has `upperRowAbnormal: true` (e.g., Peripheral Blood), the system SHALL visually flag non-zero upper row (precursor) cells with a distinct visual indicator (amber/dashed border) to alert the operator that precursors are abnormal in that specimen type. _New in v2.0._ | URS-012, URS-096 | Inspection |
| SYS-028 | Each row group SHALL display a subtotal that is the sum of all cell counts within that group, updating in real time. _New in v2.0._ | URS-024 | Test |

### 4.4 Keyboard Input Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-030 | After "Start Count" is pressed, the system SHALL attach a document-level keydown event listener for cell counting. | URS-020 | Test |
| SYS-031 | When a mapped key is pressed (without modifier keys), the system SHALL increment the corresponding cell count by exactly 1. | URS-020, URS-021 | Test |
| SYS-032 | When a mapped key is pressed while the Shift key is held, the system SHALL decrement the corresponding cell count by exactly 1. | URS-025 | Test |
| SYS-033 | The system SHALL NOT decrement a cell count below zero. If a Shift+key would reduce the count below 0, the count SHALL remain at 0. | URS-025 | Test |
| SYS-034 | The system SHALL update the subtotals and grand total within 50ms of any count change. | URS-024 | Test |
| SYS-035 | The system SHALL ignore keypresses for keys not mapped to any cell type. | URS-026 | Test |
| SYS-036 | The system SHALL ignore keypresses when modifier keys other than Shift are held (Ctrl, Alt, Cmd/Meta). | URS-020 | Test |
| SYS-037 | The system SHALL provide a visual flash (background color change, 150ms duration) on the affected cell when a key is pressed. | URS-027 | Inspection |
| SYS-038 | The keyboard mapping SHALL be unified across all specimen types. The default mapping SHALL be: R=nrbc, L=blasts, O=pro, M=myelo, T=meta, C=plasma, S=mast (upper row); B=bands, P=poly, A=baso, E=eos, N=mono, Y=lymph, X=other (lower row) — 14 keys total. _Amended from v1.0: was 9 keys with different mappings per specimen type._ | URS-021 | Test |
| SYS-039 | The Peripheral Blood keyboard mapping SHALL be identical to the Bone Marrow mapping, enabling consistent muscle memory across specimen types. _Amended from v1.0: PB previously had a different mapping._ | URS-021 | Test |

### 4.5 Percentage Calculation and Derived Values Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-040 | The system SHALL calculate each cell percentage as: `(cell_count / total_count) * 100`. | URS-030 | Test |
| SYS-041 | ~~Percentages SHALL be displayed with exactly 2 decimal places.~~ **Superseded by SYS-232** (DCR-010 made precision selectable). The two requirements directly contradicted one another: this one mandated exactly 2 places while SYS-232 allows 0 to 4. **2 remains the default.** | URS-032 | Superseded |
| SYS-042 | When total count is 0, all percentage cells SHALL display "0.00" (not NaN, Infinity, or error). | URS-033 | Test |
| SYS-043 | Percentage recalculation SHALL occur within 50ms of any count value change. | URS-031 | Test |
| SYS-044 | The sum of all displayed percentages SHALL equal 100.00% +/- 0.10% (rounding tolerance) when total count > 0. | URS-034 | Test |
| SYS-045 | The percentage calculation SHALL use IEEE 754 double-precision floating point arithmetic with rounding to 2 decimal places using banker's rounding (round half to even). | URS-030 | Test |
| SYS-046 | The system SHALL compute and display derived formulas defined in the configuration profile (e.g., M:E ratio). The formula engine SHALL evaluate `numerator_sum / denominator_sum` using the cell type arrays specified in the formula definition. If the denominator sum is zero, the system SHALL display "N/A". _New in v2.0._ | URS-035 | Test |
| SYS-047 | Derived formula values (e.g., M:E ratio) SHALL be displayed in real time during counting, updating on every keypress, and SHALL be included in output templates via the `{{formula_name}}` placeholder (e.g., `{{ME_ratio}}`). _New in v2.0._ | URS-035 | Test |

### 4.6 Count Completion and Resumption Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-050 | The system SHALL render a "Count Done" button. | URS-040 | Inspection |
| SYS-051 | The "Count Done" button SHALL be disabled until "Start Count" has been pressed and at least one cell has been counted (total > 0). | URS-040 | Test |
| SYS-052 | The system SHALL define an advisory target cell count per specimen type, loaded from the `targetCount` field in the configuration. Default values: BM = 500, PB = 200. The target is informational and does not block count completion. _Amended from v1.0: was `minCellCount` with BM=200, PB=100 as enforced minimums._ | URS-041, URS-105 | Test |
| SYS-053 | When "Count Done" is clicked and total count is below the configured `targetCount`, the system SHALL display a non-blocking informational note (e.g., "216-cell count; statistical confidence reduced for populations <5%") within the results view. The system SHALL NOT display a modal dialog or require explicit override. _Amended from v1.0: was a blocking warning dialog with Continue/Cancel._ | URS-041 | Test |
| SYS-054 | After "Count Done" is confirmed, the system SHALL detach the keydown event listener. The listener may be re-attached if the user invokes "Continue Counting." _Amended from v1.0: was permanently detached._ | URS-040 | Test |
| SYS-055 | After "Count Done" is confirmed, the system SHALL set all count displays to a read-only presentation. Inputs may be re-enabled if the user invokes "Continue Counting." _Amended from v1.0: was permanently locked._ | URS-040 | Test |
| SYS-056 | After "Count Done" is confirmed, the system SHALL generate output for all configured templates, substituting cell percentages, totals, derived formula values, and morphology comments. | URS-050 | Test |
| SYS-057 | The system SHALL render a "Continue Counting" button on the results screen. When clicked, the system SHALL return the user to the counting interface with all tallies, comments, and case metadata preserved, re-attach the keydown listener, and resume accepting keypresses. _New in v2.0._ | URS-042 | Test |
| SYS-058 | After "Continue Counting" is invoked, the progress indicator SHALL resume from the preserved total and continue toward the configured target count. _New in v2.0._ | URS-042 | Test |

### 4.7 Output Generation Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-060 | The system SHALL load output templates from `settings/templates.json`. | URS-107 | Test |
| SYS-061 | For each configured template, the system SHALL compile the template string with the following data: case number (if entered), total count, per-cell-type percentage (rounded to nearest integer for output), derived formula values (e.g., M:E ratio), and morphology comments. | URS-050, URS-052 | Test |
| SYS-062 | The system SHALL render output in a tabbed interface with one tab per template. | URS-051 | Inspection |
| SYS-063 | Each tab SHALL display the institutional name. | URS-051 | Inspection |
| SYS-064 | Each output panel SHALL include a "Copy to Clipboard" button. | URS-053 | Inspection |
| SYS-065 | The "Copy to Clipboard" button SHALL copy the plain-text content of the active output tab to the system clipboard using the Clipboard API. | URS-053 | Test |
| SYS-066 | The system SHALL display a brief visual confirmation (e.g., "Copied!") for 2 seconds after successful clipboard copy. | URS-053 | Inspection |
| SYS-067 | The case/accession number (if entered) SHALL appear as the first element in all generated output text. If no case number was entered, the output SHALL begin with the specimen type and total count. | URS-052 | Test |

### 4.8 Morphology Comments Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-070 | The system SHALL render a collapsible multi-line text area labeled "Morphology Comments" accessible during counting. | URS-070 | Inspection |
| SYS-071 | The morphology comment field SHALL support a minimum of 500 characters. | URS-070 | Test |
| SYS-072 | The morphology comment text SHALL be appended to the generated output for each template. | URS-071 | Test |
| SYS-073 | The morphology comment field SHALL NOT capture keyboard input intended for counting (i.e., when the comment field is focused, keydown events SHALL NOT trigger cell counting). | URS-070 | Test |
| SYS-074 | Morphology comments SHALL be preserved across Count Done → Continue Counting cycles. _New in v2.0._ | URS-073 | Test |

### 4.9 Reset Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-080 | The system SHALL render a "New Case" / reset button. | URS-060 | Inspection |
| SYS-081 | When reset is clicked and any cell count > 0, the system SHALL display a confirmation dialog: "This will clear all count data. Continue?" with "OK" and "Cancel" options. | URS-061 | Test |
| SYS-082 | Upon reset confirmation, the system SHALL: (a) set all cell counts to 0, (b) set all percentages to 0.00%, (c) set total to 0, (d) clear all output text, (e) clear morphology comments, (f) clear the case number field, (g) enable specimen type selector, (h) return to the case-entry phase. _Amended from v1.0: removed "disable Start Count button" since Start is always enabled._ | URS-060, URS-063 | Test |
| SYS-083 | If no count data exists (all counts = 0), the system SHALL execute reset without a confirmation dialog. | URS-060 | Test |
| SYS-084 | After reset, keyboard focus SHALL be placed on the case number input field. | URS-063 | Test |

### 4.10 Session History Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-090 | The system SHALL maintain an in-memory array of completed count sessions for the current browser session. | URS-080 | Test |
| SYS-091 | Each session history entry SHALL contain: case number (if entered), specimen type, timestamp of completion, total count, per-cell-type counts, per-cell-type percentages, derived formula values, morphology comments, and generated output text. | URS-080 | Test |
| SYS-092 | The system SHALL render a collapsible "Session History" panel listing completed cases by case number (or "No case #") and timestamp. | URS-081 | Inspection |
| SYS-093 | Clicking a session history entry SHALL display the completed count data in a read-only overlay without affecting the current active session. | URS-082 | Test |
| SYS-094 | The system SHALL display a notice in the session history panel: "Session data is temporary and will be lost when the browser is closed." | URS-083 | Inspection |
| SYS-095 | Session history SHALL be stored in browser sessionStorage to ensure automatic cleanup on tab/window close. | URS-080 | Test |
| SYS-096 | The system SHALL provide controls to export the current session history as local files in CSV and JSON formats. | URS-084 | Test |
| SYS-097 | The exported files SHALL include, for each completed session: case number, specimen type, timestamp, total count, per-cell-type counts, per-cell-type percentages, derived formula values, morphology comments, and output text. | URS-084 | Test |

### 4.11 Presentation & Theme Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-110 | The system SHALL provide a visible control to toggle between Light and Dark themes without altering count data or session state. | URS-095 | Test |
| SYS-111 | The system SHALL provide a keyboard shortcut (Ctrl/Cmd+Shift+L) to toggle themes and SHALL NOT interfere with counting key inputs. | URS-095 | Test |
| SYS-112 | The system SHALL remember the selected theme for the duration of the browser session using sessionStorage. | URS-095 | Test |
| SYS-113 | All text rendered by the system SHALL meet WCAG 2.1 AA contrast against its effective background — 4.5:1 for body text, 3:1 for large text — in **both** themes, on every page, in every phase, and in every interaction state including hover. Semi-transparent backgrounds SHALL be composited to the underlying surface when this is assessed. | URS-095, URS-091 | Test |
| SYS-114 | The selected theme SHALL be applied before the first paint of any page, so that no page renders in a theme other than the selected one, however briefly. | URS-095 | Test |

### 4.12 Configuration Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-100 | The system SHALL fetch configuration data from `settings/templates.json` via HTTP GET on page load. | URS-100 | Test |
| SYS-101 | If the configuration file fails to load, the system SHALL display an error message and prevent counting from starting. | URS-100 | Test |
| SYS-102 | The configuration file SHALL define for each specimen type: (a) specimen type identifier (`specimenType`), (b) advisory target count (`targetCount`), (c) two-row category organization (`categories.upper`, `categories.lower`), (d) unified keyboard-to-cell-type mapping (`outCodes`), (e) derived formulas (`formulas`, optional), (f) upper-row abnormality flag (`upperRowAbnormal`), (g) one or more output templates with placeholder syntax. _Amended from v1.0: added categories, formulas, upperRowAbnormal, targetCount; removed minCellCount._ | URS-100, URS-105 | Inspection |
| SYS-103 | The configuration file SHALL support a `targetCount` property per specimen type. If absent, the system SHALL use default values (BM=500, PB=200). _Amended from v1.0: was `minCellCount` with defaults BM=200, PB=100._ | URS-105 | Test |

### 4.13 Progress Indicator Module

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-120 | The system SHALL display a progress indicator showing the current total count relative to the configured target count (e.g., "125 / 500 (target)"). _New in v2.0._ | URS-024 | Inspection |
| SYS-121 | The progress indicator SHALL update in real time as cells are counted. _New in v2.0._ | URS-024 | Test |

---

### 4.13a Differential Denominator Module (URS-030, URS-052)

Added in v2.2 under DCR-006.

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-180 | A configuration profile SHALL be able to designate cell categories that are counted but excluded from the percentage denominator (`denominatorExcludes`). | URS-030 |
| SYS-181 | Percentages SHALL be computed over the denominator excluding those categories, and the included categories SHALL still sum to exactly 100 (SYS-044). | URS-030, URS-034 |
| SYS-182 | An excluded category SHALL NOT be reported as a percentage of the differential. It SHALL be reported per 100 units of the denominator where the profile defines `per100Reporting`, and as "N/A" where the denominator is zero. | URS-030 |
| SYS-183 | The target count, the progress indicator and the low-count advisory SHALL be measured against the differential denominator, not the total cells tallied, because the target expresses a number of classified cells. | URS-024, URS-041 |
| SYS-184 | Output SHALL distinguish the differential denominator (`{{total}}`) from the total cells tallied (`{{totalCounted}}`), and SHALL provide `{{<cellType>_per100}}` for excluded categories. Absolute counts SHALL NOT be derived for an excluded category. | URS-036, URS-052 |
| SYS-185 | Configuration validation SHALL reject a profile that excludes every category from the denominator, that names an undisplayed category in `denominatorExcludes` or `per100Reporting`, or that requests per-100 reporting for a category still inside the denominator. | URS-100 |

### 4.13b Sampling Precision Module (URS-037, URS-041)

Added in v2.3 under DCR-007.

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-190 | The system SHALL compute a binomial confidence interval for each reported differential percentage, from the raw count and the differential denominator, never from the rounded percentage. | URS-037 |
| SYS-191 | The interval SHALL use the Wilson score method. The Wald normal approximation SHALL NOT be used: its coverage is inadequate for small denominators and proportions near zero, and it yields impossible negative bounds for rare categories (REF-001 [S7]). | URS-037 |
| SYS-192 | Interval bounds SHALL remain within 0–100% for every input, including zero and saturated counts. A zero count SHALL yield a bounding interval rather than no interval. | URS-037 |
| SYS-193 | The confidence level SHALL be configurable per specimen type (0.90, 0.95, 0.99; default 0.95), and interval display SHALL be disableable. Validation SHALL reject an unsupported level. | URS-037, URS-100 |
| SYS-194 | The sub-target advisory SHALL state a computed interval at a clinically meaningful proportion, rather than a general statement that confidence is reduced. | URS-041 |
| SYS-195 | Intervals, the confidence level, the differential denominator and the exclusion list SHALL be carried in the session record and in CSV and JSON export, so that an archived result can be reconstructed. | URS-052, URS-084 |
| SYS-196 | Where a derived ratio is displayed, the interface SHALL indicate that a ratio of two counted proportions is less precise than either (REF-001 §3.8). A computed interval for a ratio is not required by this revision. | URS-035 |

### 4.13c Derived Quantities and Thresholds Module (URS-038, URS-039)

Added in v2.4 under DCR-008.

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-200 | A formula SHALL declare a type of either `ratio` or `percentage`. Absent a type it SHALL be treated as a ratio, so profiles written before this revision are unaffected. | URS-039 |
| SYS-201 | A `percentage` formula SHALL express its numerator categories as a percentage of its denominator categories, using that denominator rather than the differential denominator. | URS-039 |
| SYS-202 | Validation SHALL reject a percentage formula whose numerator is not contained in its denominator, since the result could exceed 100%. | URS-039, URS-100 |
| SYS-203 | The interface SHALL render every formula the profile defines, not a fixed set. | URS-039, URS-107 |
| SYS-204 | A profile SHALL be able to define diagnostic thresholds, each naming a target, a percentage value, a label and a citable basis. A target SHALL be either a displayed category or a percentage formula. | URS-038 |
| SYS-205 | A threshold SHALL NOT target a ratio formula, because no confidence interval is computed for a ratio (REF-001 §3.8, HA-093). Validation SHALL reject such a configuration. | URS-038 |
| SYS-206 | Where a confidence interval spans a configured threshold, the system SHALL state which quantity, its interval, the threshold, and the basis; and SHALL direct the operator to the Continue Counting control. | URS-038, URS-042 |
| SYS-207 | The near-threshold indication SHALL be informational and SHALL NOT prevent count completion. | URS-038, URS-041 |
| SYS-208 | Threshold evaluations and all formula results SHALL be carried in the session record. | URS-052 |

### 4.13d Method Provenance Module (URS-052, URS-055)

Added in v2.5 under DCR-009.

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-210 | A configuration profile SHALL be able to declare its provenance: the standard it implements, a full citation, and a short note suitable for inclusion in a report. | URS-055 |
| SYS-211 | A specimen type SHALL be able to declare the basis of its target count, and each formula the basis of its convention. | URS-055, URS-105 |
| SYS-212 | The system SHALL assemble these into a method statement covering the profile and version, the declared basis, any category excluded from the percentage denominator, the target count basis, each formula's convention, and the confidence level where intervals are reported. Absent declarations SHALL be omitted rather than rendered as empty entries. | URS-055 |
| SYS-213 | The method statement SHALL be available to output templates as `{{methodNotes}}`, presented on the results screen, and carried in the session record and CSV/JSON export. | URS-055, URS-084 |
| SYS-214 | Text copied to the clipboard SHALL carry the configuration profile ID, version and timestamp, independently of whether the active template references them. | URS-052 |

### 4.13e Operator Documentation Module (URS-092)

Added in v2.6.

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-220 | The application SHALL provide an operator-facing Methods and Limitations page covering: the percentage denominator per specimen type, the rounding method, the derived formula conventions, the meaning of the confidence interval, the near-threshold advisory, the cell types excluded from the differential, and the target counts with their basis. | URS-092, URS-055 |
| SYS-221 | The page SHALL state the limitations of manual differential counting with their evidence, including the imprecision of low-frequency populations, observer variability in the band/segmented distinction and immature granulocyte definitions, and basophil imprecision. | URS-092 |
| SYS-222 | The page SHALL state that the software performs no cell identification and makes no diagnostic decision. | URS-092, DHF-001 §3.1 |
| SYS-223 | The page SHALL be reachable from the case-entry screen, the quick start guide and the results screen, and SHALL be available offline. | URS-092, URS-094 |
| SYS-224 | Operator documentation SHALL be verified against the shipped configuration and the shipped calculation engine, so that a configuration change cannot leave it stating figures the software does not produce. | URS-092 |

### 4.13f Reporting Policy Module (URS-034, URS-032)

Added in v2.7 under DCR-010.

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-230 | The rounding policy SHALL be selectable per specimen type from `largest-remainder`, `largest-count` and `independent`, defaulting to `largest-remainder`. | URS-034 |
| SYS-231 | Under `largest-remainder` and `largest-count` the included percentages SHALL total exactly 100 at the precision reported. Under `independent` they need not, and the profile is understood to have elected that. | URS-034 |
| SYS-232 | Displayed and reported decimal precision SHALL be independently selectable, 0 to 4 places, defaulting to 2 and 0. | URS-032 |
| SYS-233 | Validation SHALL reject an unrecognised rounding policy or an out-of-range precision. | URS-100 |
| SYS-234 | The method statement SHALL declare the rounding policy in force, since it changes the reported figures. | URS-055 |
| SYS-235 | Both M:E conventions — including and excluding monocytes — SHALL ship as selectable presets, each declaring its basis. | URS-035 |

### 4.14 Audio Feedback Module (URS-027, URS-097)

Added in v2.1 under DCR-004. This functionality was implemented and shipping in
v2.0 with no system requirement behind it; RTM v2.0 recorded it as a deferred
Phase 2 item.

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-140 | The system SHALL emit a short confirmation tone on each accepted counting keystroke. | URS-027, URS-097 |
| SYS-141 | The system SHALL emit a tone distinct from SYS-140 on each accepted decrement (undo) keystroke. | URS-027, URS-097 |
| SYS-142 | The system SHALL emit a typewriter-style tone, distinct from SYS-140 and SYS-141, for keystrokes entered in the morphology comment field, so the operator can hear that keyboard focus is not on the counting grid. | URS-027, URS-097 |
| SYS-143 | The system SHALL emit a distinct chime once when the running total first reaches the configured target count. | URS-024, URS-027 |
| SYS-144 | The system SHALL provide an on-screen control to enable and disable all audio feedback independently of every other setting, and SHALL persist that choice for the browser session. Absence of Web Audio support SHALL degrade silently and SHALL NOT impair counting. | URS-027, URS-097 |

### 4.15 Autosave and Crash Recovery Module (URS-085)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-145 | The system SHALL persist the in-progress count to browser localStorage after every counting keystroke. | URS-085 |
| SYS-146 | The autosave record SHALL contain the case number, specimen type, per-category counts, free-text and structured morphology comments, the active profile ID, and a timestamp. | URS-085, URS-052 |
| SYS-147 | On launch, if an unfinalized autosave record exists, the system SHALL offer the operator the choice to restore or discard it, and SHALL NOT restore without an explicit choice. | URS-085 |
| SYS-148 | The system SHALL clear the autosave record on count finalization, on reset, and on discard. | URS-085 |
| SYS-149 | If the saved specimen type is not defined in the active configuration profile, the system SHALL decline the restore, explain why, discard the record, and return to case entry without error. | URS-085 |

### 4.16 Absolute Count Module (URS-036)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-150 | The system SHALL optionally accept a total WBC concentration on the results screen. | URS-036 |
| SYS-151 | The system SHALL compute each absolute count as WBC x percentage / 100. | URS-036 |
| SYS-152 | Absolute counts SHALL be derived from the same adjusted percentages presented in the counting table and the report, so that the three can never disagree. | URS-036, HA-024 |
| SYS-153 | A non-numeric or non-positive WBC entry SHALL clear the absolute count display rather than render NaN. Availability SHALL follow the profile's `absoluteCounts` setting (`always`, `optional`, `disabled`). | URS-036 |

### 4.17 Handedness Module (URS-104)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-154 | The system SHALL provide default keyboard mappings for both left-hand-dominant and right-hand-dominant operation, reflecting that one hand operates the microscope. | URS-104 |
| SYS-155 | The configuration editor SHALL provide one-action assignment of all categories to the left-hand (Q-T, A-G, Z-B) or right-hand (Y-P, H-;, N-/) QWERTY zone. | URS-104 |

### 4.18 Output Traceability Module (URS-052)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-160 | Every completed count record SHALL carry the configuration profile ID, profile name and profile version in force when it was counted. | URS-052 |
| SYS-161 | Every completed count record SHALL carry the configured target count and an ISO-8601 timestamp. | URS-052 |
| SYS-162 | CSV and JSON exports SHALL include every field named in SYS-160 and SYS-161 as distinct columns or keys. | URS-052, URS-084 |
| SYS-163 | The results screen SHALL display the active profile identifier and version alongside the count. | URS-052 |

### 4.19 Offline Operation Module (URS-094)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-170 | No render-blocking script or stylesheet SHALL be loaded from a third-party origin. | URS-094 |
| SYS-171 | The system SHALL register a service worker that caches the application shell so the counter loads with no network connection. | URS-093, URS-094 |
| SYS-172 | Configuration profiles SHALL be fetched network-first with a cache fallback, so that a corrected profile is seen when the network is available and the last known profile is used when it is not. | URS-094, URS-106 |
| SYS-173 | Webfonts SHALL be a progressive enhancement only; their absence SHALL NOT affect layout, legibility or behaviour. | URS-091, URS-094 |

### 4.20 Preset Catalogue Module (URS-101)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-174 | The system SHALL present a catalogue of built-in configuration profiles from within the application. | URS-101 |
| SYS-175 | Selecting a preset SHALL validate it, make it the active profile, cache it, and return the application to a clean case-entry state. | URS-101, URS-106 |
| SYS-176 | Profiles that cannot be counted with (blank editor templates) SHALL be excluded from the catalogue offered to the operator. | URS-101 |

### 4.21 Configuration Editor Module (URS-102)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-177 | The configuration editor SHALL allow the operator to view the full cell-type reference set, select categories, arrange their order, assign keyboard keys, set per-specimen target counts, edit output templates, and save the result as a JSON profile. | URS-102 |
| SYS-178 | The editor SHALL validate a profile with the same engine the counter uses before making it active, and SHALL NOT activate a profile the counter would reject. | URS-102, HA-061 |
| SYS-179 | When a profile fails validation the editor SHALL state that it was not made active and SHALL list the reasons; the draft MAY still be downloaded as work in progress. | URS-102 |
| SYS-240 | The configuration editor SHALL allow the operator to set, per specimen type, the counting policy that determines the reported figures: the categories excluded from the percentage denominator and how each is then reported per 100, the rounding method, the display and report precision, whether a confidence interval is shown and at what level, the diagnostic thresholds, and the composition of derived figures. | URS-102, URS-030, URS-034, URS-037, URS-038 |
| SYS-241 | The editor SHALL preserve every field of the profile it loads that it does not itself edit. | URS-102, HA-099 |
| SYS-242 | A profile saved in the editor SHALL be the profile the counter uses; the editor SHALL NOT report a profile as active if the counter would discard it. | URS-102, HA-100 |
| SYS-243 | The editor's counting-policy controls SHALL constrain their own inputs so that they cannot compose a profile the counter would reject. | URS-102, HA-061 |

### 4.24 Dialogs (URS-092, URS-102)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-244 | The system SHALL NOT use the browser's native `prompt()`, `confirm()` or `alert()`. Every question SHALL be asked in the product's own dialog, in the selected theme. | URS-092, URS-095 |
| SYS-245 | A dialog that collects input SHALL state the rules for each field, validate on submission, and report the reason beneath the offending field without discarding what was typed. | URS-092, HA-101 |
| SYS-246 | A dialog SHALL be modal for the keyboard: focus SHALL move into it, SHALL be confined to it, and SHALL return to the element that opened it on close. Keystrokes SHALL NOT reach the counting tally while a dialog is open. | URS-092, HA-015 |
| SYS-247 | Escape SHALL cancel a dialog, EXCEPT where both branches are consequential; such a dialog SHALL require an explicit choice. | URS-061, HA-102 |

### 4.25 Absolute Counts and the Analyser WBC (URS-036)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-248 | Where a category is counted but excluded from the differential denominator and reported per 100, the system SHALL correct the entered analyser WBC by `WBC x 100 / (100 + per-100 value)` before deriving any absolute count. | URS-036, URS-030, HA-105 |
| SYS-249 | The system SHALL NOT apply that correction silently: it SHALL display the value entered, the arithmetic and the result, and SHALL allow the operator to declare the entered value already corrected, in which case it is used unchanged. | URS-036, HA-105 |
| SYS-250 | The correction control SHALL be offered only where the correction applies, and the basis of the absolute counts SHALL be stated whenever it does. | URS-036 |
| SYS-251 | A profile SHALL be able to select whether absolute counts appear in the report (`absoluteCountsInReport`), defaulting to **off**. When selected, `{{<cellType>_abs}}`, `{{wbcEntered}}`, `{{wbcUsed}}` and `{{wbcBasis}}` SHALL resolve, and the report SHALL be re-rendered once an analyser WBC is entered. | URS-036, URS-102 |
| SYS-252 | Where no analyser WBC has been entered, an absolute-count placeholder SHALL resolve to an explicit statement that it was not provided, and SHALL NOT render as blank or as zero. | URS-036, HA-106 |
| SYS-253 | The configuration editor SHALL list every placeholder the active profile resolves, including the per-100 and absolute-count forms. | URS-102 |

### 4.22 Configuration Validation Requirements (URS-021, URS-022)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-104 | Configuration validation SHALL reject a profile in which: any category is displayed without a keyboard key; any cell type is mapped to more than one key; any cell type appears more than once in the category rows; or **any key-mapped cell type is absent from the displayed categories**. The last case would otherwise be counted into the grand total and every percentage denominator while never appearing on screen. | URS-021, URS-022, HA-080 |
| SYS-105 | The system SHALL export the active configuration profile as a JSON file. | URS-103 |
| SYS-106 | The system SHALL import a JSON configuration profile, validate it per SYS-104, and reject it without applying it if validation fails. | URS-103 |
| SYS-107 | The system SHALL cache the active profile in localStorage and boot from that cache when the network is unavailable. | URS-106, URS-094 |
| SYS-108 | Where a built-in profile carries the same profile ID as the cached profile at a newer version, the system SHALL adopt the built-in profile and inform the operator. A profile with a different ID (an operator's own profile) SHALL NOT be overwritten. | URS-106 |
| SYS-109 | If no valid configuration can be resolved, the system SHALL present an error state that offers recovery to the built-in default whenever a cached profile exists. | URS-106, HA-060 |

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
| SYS-I05 | The system SHALL use the system clipboard API for copy-to-clipboard functionality. | URS-053 | Test |

## 7. Data Requirements

| ID | Requirement | URS Trace | Verification Method |
|----|------------|-----------|-------------------|
| SYS-D01 | Cell count values SHALL be stored as non-negative integers (0 to 9999). | URS-023, URS-025 | Test |
| SYS-D02 | Percentage values SHALL be stored as floating-point numbers with 2 decimal places. | URS-032 | Test |
| SYS-D03 | Case number SHALL be stored as a string, trimmed of leading/trailing whitespace. An empty string is valid. | URS-005, URS-004 | Test |
| SYS-D04 | All in-session data SHALL be stored in JavaScript memory (no server-side persistence). | URS-080 | Inspection |
| SYS-D05 | Session history data SHALL be serialized to JSON for sessionStorage. | URS-080 | Test |

## 8. Security Requirements

| ID | Requirement | Verification Method |
|----|------------|-------------------|
| SYS-S01 | The system SHALL NOT transmit any patient or case data to external servers. | Inspection / Network audit |
| SYS-S02 | The system SHALL NOT store any patient data in cookies or localStorage (sessionStorage only for session history and theme preference). | Inspection |
| SYS-S03 | Session history in sessionStorage SHALL be automatically cleared when the browser tab/window is closed. | Test |
| SYS-S04 | The system SHALL sanitize all user input to prevent XSS attacks (case number, comments). | Test |

---

### 8.1 Output and Export Safety (added v2.1, DCR-004)

| ID | Requirement | Trace |
|----|------------|-------|
| SYS-S04 | Operator-supplied text (case number, morphology comments) substituted into an output template SHALL be rendered as inert text. Rendered output SHALL permit only a fixed allowlist of formatting tags (`br`, `b`, `i`, `em`, `strong`, `u`, `p`); no attribute SHALL survive rendering. | HA-081 |
| SYS-S05 | Template placeholder substitution SHALL insert values literally, so that replacement-pattern characters (`$&`, `` $` ``, `$'`) in operator input are not reinterpreted. | HA-081 |
| SYS-S06 | CSV export SHALL neutralize fields beginning with a spreadsheet formula character (`=`, `+`, `-`, `@`, tab, CR) so that an exported record cannot execute on open. Ordinary accession formats SHALL be exported unchanged. | HA-081 |
| SYS-S07 | The development server SHALL confine all file access to the served root, including against sibling paths that share its prefix. | — |

---

## 9. v1.0 → v2.0 Change Summary

| SRS ID | Change | Rationale (URS Trace) |
|--------|--------|----------------------|
| SYS-001 | Label updated to "(optional)" | URS-004: case number configurable, default not required |
| SYS-003 | Start Count enabled by default (was disabled when case# empty) | URS-004: case number not required by default |
| SYS-005 | Reserved (merged into SYS-003) | Simplification |
| SYS-009 | Enter starts counting regardless of case# | URS-006, URS-004 |
| SYS-010 | Added extensibility for body fluid types | URS-011 |
| SYS-014 | 14 cell types in two rows (was 9 in flat table) | URS-012, SPC-001 consensus layout |
| SYS-015 | PB same 14 cells as BM (was different 9 cells) | URS-012, unified muscle memory |
| SYS-020 | Two-row layout with subtotals | SPC-001 two-row clinical semantics |
| SYS-027 | NEW: upper row visual flagging for PB | URS-096, precursors abnormal in PB |
| SYS-028 | NEW: row group subtotals | URS-024 |
| SYS-038 | Unified 14-key mapping (was 9 per type) | URS-021, muscle memory |
| SYS-039 | PB = BM mapping (was different) | URS-021, muscle memory |
| SYS-046 | NEW: derived formula computation (M:E ratio) | URS-035 |
| SYS-047 | NEW: live formula display + template placeholder | URS-035 |
| SYS-052 | targetCount (advisory) replaces minCellCount (enforced) | URS-041, URS-105 |
| SYS-053 | Non-blocking note replaces blocking dialog | URS-041 |
| SYS-054 | Listener detach is reversible via Continue Counting | URS-042 |
| SYS-055 | Input lock is reversible via Continue Counting | URS-042 |
| SYS-057 | NEW: Continue Counting button | URS-042 |
| SYS-058 | NEW: Continue Counting preserves tallies | URS-042 |
| SYS-067 | Output handles absent case number gracefully | URS-004, URS-052 |
| SYS-074 | NEW: comments preserved across resume cycles | URS-073 |
| SYS-082 | Removed "disable Start Count" from reset | URS-004 |
| SYS-102 | Config schema expanded (categories, formulas, etc.) | URS-100, URS-105 |
| SYS-103 | targetCount replaces minCellCount with new defaults | URS-105 |
| SYS-120/121 | NEW: progress indicator | URS-024 |

---

## 10. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - system requirements derived from URS-001 |
| B | 2026-02-19 | QMS | Added session export requirements (CSV/JSON) |
| C | 2026-02-20 | QMS | Added theme toggle requirements |
| K | 2026-08-05 | QMS | v2.7 (DCR-010): added SYS-230–SYS-235, reporting policy. Rounding method, decimal precision and the M:E convention are now selections rather than fixed behaviour. |
| J | 2026-08-05 | QMS | v2.6: added SYS-220–SYS-224, operator documentation, verified against the shipped configuration and engine (suite 13). |
| I | 2026-08-05 | QMS | v2.5 (DCR-009): added SYS-210–SYS-214, method provenance. SYS-214 closes a URS-052 gap: the clipboard path carried no profile attribution. |
| H | 2026-08-05 | QMS | v2.4 (DCR-008): added SYS-200–SYS-208, derived quantities and thresholds. Formula rendering generalized from the hardcoded M:E ratio to every formula the profile defines. |
| G | 2026-08-05 | QMS | v2.3 (DCR-007): added SYS-190–SYS-196, the sampling precision module. Every reported percentage carries a Wilson confidence interval; the sub-target advisory is quantified; a derived ratio carries an imprecision advisory. |
| F | 2026-08-05 | QMS | v2.2 (DCR-006): added SYS-180–SYS-185, the differential denominator module. A category may be counted without belonging to the percentage denominator, and is reported per 100 of it instead — the peripheral blood NRBC convention. |
| E | 2026-08-04 | QMS | v2.1 (DCR-004): added SYS-140–SYS-179 for audio feedback, autosave/recovery, absolute counts, handedness, output traceability, offline operation, preset catalogue and the configuration editor — all implemented and shipping in v2.0 with no system requirement behind them. Added SYS-104–SYS-109 for configuration validation and resolution, and SYS-S04–SYS-S07 for output/export safety. |
| D | 2026-02-24 | QMS | Major revision v2.0: unified 14-cell layout, advisory target counts, M:E ratio, Continue Counting, two-row categories, optional case number, non-blocking count completion. Traced to URS-001 v2.0 and SPC-001 v1.2. See Section 9 for full change summary. |

## 11. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Systems Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
