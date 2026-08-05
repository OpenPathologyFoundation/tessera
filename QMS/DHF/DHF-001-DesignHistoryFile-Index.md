# DHF-001: Design History File Index

## WBC ΔΣ

| Field | Value                                                                                                                   |
|-------|-------------------------------------------------------------------------------------------------------------------------|
| **Document ID** | DHF-001                                                                                                                 |
| **Product Name** | WBC ΔΣ                                                                                                                 |
| **Product Version** | 2.1.0                                                                                                                     |
| **Classification** | Clinical Laboratory Aid - Software                                                                                      |
| **Intended Use** | Keyboard-driven manual differential white blood cell counting tool for hematology laboratory personnel                  |
| **Regulatory Framework** | 21 CFR Part 820 (Quality System Regulation), IEC 62304 (Medical Device Software Lifecycle), ISO 14971 (Risk Management) |
| **Date Created** | 2026-02-18                                                                                                              |
| **Document Owner** | Quality Management                                                                                                      |
| **Status** | Draft                                                                                                                   |

---

## 1. Purpose

This Design History File (DHF) documents the complete design and development lifecycle of the WBC ΔΣ application. It provides objective evidence that the device was developed in accordance with applicable regulatory requirements and the organization's quality management system.

## 2. Product Description

WBC ΔΣ is a web-based clinical laboratory software tool that enables hematology laboratory personnel to perform manual differential white blood cell counts on bone marrow aspirate and peripheral blood specimens. The tool uses keyboard input to tally cell types, automatically calculates percentages, and generates formatted output reports in institutional templates.

## 3. Intended Use Statement

WBC ΔΣ is intended to be used by trained clinical laboratory personnel (medical technologists, pathologists, and hematology fellows) as a counting and calculation aid during manual microscopic review of bone marrow aspirate and peripheral blood smears. The software tallies operator-entered cell classifications and computes differential percentages. **The software does not perform autonomous cell identification or classification.** All cell identification decisions are made by the operator.

## 4. Indications for Use

- Manual differential cell counting on bone marrow aspirate smears
- Manual differential cell counting on peripheral blood smears
- Calculation of differential percentages
- Generation of formatted count reports for clinical documentation

## 5. Design History File Contents

| Doc ID | Document Title | Type | Status |
|--------|---------------|------|--------|
| DHF-001 | Design History File Index | Index | Draft |
| **URS-001** | **User Requirements Specification v2.0** (`URS-001_UserRequirementsSpecification_v2.0.md`) — **controlled requirement baseline** | Requirements | Draft |
| URS-001 | User Requirements Specification v1.0 (`URS-001-UserRequirementsSpecification.md`) | Requirements | **Superseded by v2.0** |
| SPC-001 | Use Case Specification v1.2 (`SPC-001_UseCase_Specification_v1.2.docx`) | Requirements | Draft |
| SRS-001 | System Requirements Specification v2.1 | Requirements | Draft |
| SAD-001 | System Architecture Design v2.0 | Design | Draft |
| SDD-001 | Software Detailed Design v2.0 | Design | Draft |
| RA-001 | Risk Analysis (FMEA) v2.1 | Risk Management | Draft |
| TP-001 | Test Plan v2.0 | Verification | Draft |
| VV-001 | Verification & Validation Protocol v2.0 | V&V | Draft |
| RTM-001 | Requirements Traceability Matrix v3.0 | Traceability | Draft |
| TR-001 | Test Execution Results | Evidence | Draft |
| SOP-001 | Standard Operating Procedure | Procedure | Draft |
| SOP-002 | Deployment Procedure | Procedure | Draft |
| SOP-003 | Operations Procedure | Procedure | Draft |
| TE-001 | Test Evidence Archive (`QMS/DHF/TestEvidence/`) | Evidence | Draft |
| DCR-001 | Design Change Record — Theme/Export/Clipboard/QMS Evidence | Change Control | Draft |
| DCR-002 | Design Change Record — Rename, Logo, License | Change Control | Draft |
| DCR-003 | Design Change Record — Test Automation | Change Control | Draft |
| DCR-004 | Design Change Record — Verification Integrity Remediation | Change Control | Draft |

**Document control note (DCR-004)**: two files previously carried Document ID
URS-001 with neither marked as superseded, and RTM-001 v2.0 was keyed to the
v1.0 numbering while this index controlled v2.0. The v1.0 file now carries a
superseded banner and RTM-001 v3.0 is re-keyed to v2.0.

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - DHF established |
| B | 2026-02-20 | QMS | Added test evidence archive entry |
| C | 2026-02-20 | QMS | Added design change record entry |
| D | 2026-02-24 | QMS | Updated to v2.0: 14-cell unified layout, advisory targets, M:E ratio, Continue Counting |
| E | 2026-08-04 | QMS | v2.1.0 (DCR-004): verification integrity remediation. Test suite re-pointed at shipped code (unit + jsdom behaviour + Playwright system layers across Chromium/Firefox/WebKit, 579 tests). RTM-001 re-keyed to URS-001 v2.0. SRS-001 extended with SYS-140–SYS-179. URS-034 amended to the largest-remainder method (URS Rev E). URS-001 v1.0 marked superseded. RA-001 re-scored: 5 hazards added, 4 residual RPNs corrected. DCR-002/003/004 and SOP-002/003 added to this index. |

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | | | |
| Quality Assurance | | | |
| Clinical Reviewer | | | |
| Regulatory Affairs | | | |
