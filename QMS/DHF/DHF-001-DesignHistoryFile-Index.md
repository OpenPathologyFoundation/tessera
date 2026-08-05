# DHF-001: Design History File Index

## WBC ΔΣ

| Field | Value                                                                                                                   |
|-------|-------------------------------------------------------------------------------------------------------------------------|
| **Document ID** | DHF-001                                                                                                                 |
| **Product Name** | WBC ΔΣ                                                                                                                 |
| **Product Version** | 2.2.0                                                                                                                     |
| **Classification** | Clinical Laboratory Aid - Software                                                                                      |
| **Intended Use** | Keyboard-driven manual differential white blood cell counting tool for hematology laboratory personnel                  |
| **Software Safety Class** | **Class A** (IEC 62304 §4.3) — see §3.1; requires sign-off |
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

## 3.1 Software Safety Classification (IEC 62304 §4.3)

**Classification: Class A** — no injury or damage to health is possible.

### 3.1.1 Basis

IEC 62304 §4.3 permits the software safety class to be assigned after taking
into account risk control measures **external to the software**, including
other diagnostic procedures and health care practice. The classification below
rests on such measures and is not a claim that the software cannot produce a
wrong number.

A differential count produced by this tool is never the sole determinant of a
clinical decision. ICSH 2008 §1 (REF-001 [S1]) states that "a comprehensive
diagnosis of a BM disorder often requires the integration of various diagnostic
approaches", listing peripheral blood counts and smear evaluation, aspirate
smear, particle clot section, trephine biopsy and imprint morphology,
cytochemistry, immunophenotyping, cytogenetic and molecular genetic techniques,
and biochemical and microbiological results — and that "the final
interpretation should be in the context of clinical and preliminary diagnostic
findings."

The external risk control measures relied upon are therefore:

| # | Measure | Effect |
|---|---------|--------|
| E1 | The differential is interpreted alongside the trephine biopsy, flow cytometry, cytogenetics, molecular studies and the clinical picture | A single erroneous percentage does not by itself establish a diagnosis |
| E2 | Morphological review is performed by a qualified operator who has identified every cell counted | The tool tallies operator decisions; it performs no cell recognition |
| E3 | Results are reviewed and released by a pathologist under the laboratory's QMS | An implausible differential is subject to professional review before it reaches the record |
| E4 | Operators are trained and competency-assessed under CLIA/CAP/ISO 15189 | Misuse of the counting interface is addressed by training and supervision |
| E5 | The count is transcribed into the LIS by an operator who sees the values | A grossly wrong value has a further opportunity for detection |

### 3.1.2 Boundary conditions

This classification is **conditional on the intended use in §3 holding**. It
would not be supportable if the software were:

- used as the sole basis for a diagnostic decision without corroborating
  investigations or professional review;
- operated by untrained personnel, or outside a laboratory quality system;
- extended to perform automated cell recognition or classification, which would
  remove measure E2 and make the software a determinant of the result rather
  than a recorder of the operator's determination.

Any such change requires the classification to be reassessed before release.

### 3.1.3 Consequences of Class A

Under IEC 62304, Class A does not require the software architecture to be
decomposed into SOUP-isolated items (§5.3.3–5.3.6), nor detailed design of
software units (§5.4), nor unit-level verification (§5.5.2–5.5.5).

**Those activities have nonetheless been performed.** The verification
architecture established under DCR-004 provides unit, behavioural and system
level testing with full requirement traceability. This exceeds what Class A
requires and is retained deliberately: the classification depends on external
measures E1–E5 that the manufacturer does not control, and the software's own
verification is the one control that is under the manufacturer's control.

### 3.1.4 Status

**This classification requires clinical and regulatory sign-off before the DHF
leaves Draft.** It is an engineering assessment resting on clinical judgments
about measures E1–E5. It is recorded here so that it is explicit and reviewable
rather than assumed — no software safety class was stated in any prior revision
of this DHF, despite IEC 62304 being cited as a governing framework.

---

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
| SRS-001 | System Requirements Specification v2.2 | Requirements | Draft |
| SAD-001 | System Architecture Design v2.0 | Design | Draft |
| SDD-001 | Software Detailed Design v2.0 | Design | Draft |
| RA-001 | Risk Analysis (FMEA) v2.3 | Risk Management | Draft |
| TP-001 | Test Plan v2.0 | Verification | Draft |
| VV-001 | Verification & Validation Protocol v2.0 | V&V | Draft |
| RTM-001 | Requirements Traceability Matrix v3.0 | Traceability | Draft |
| **REF-001** | **Standards and Literature Basis v1.0** | Reference | Draft |
| TR-001 | Test Execution Results v3.1 | Evidence | Draft |
| SOP-001 | Standard Operating Procedure | Procedure | Draft |
| SOP-002 | Deployment Procedure | Procedure | Draft |
| SOP-003 | Operations Procedure | Procedure | Draft |
| TE-001 | Test Evidence Archive (`QMS/DHF/TestEvidence/`) | Evidence | Draft |
| DCR-001 | Design Change Record — Theme/Export/Clipboard/QMS Evidence | Change Control | Draft |
| DCR-002 | Design Change Record — Rename, Logo, License | Change Control | Draft |
| DCR-003 | Design Change Record — Test Automation | Change Control | Draft |
| DCR-004 | Design Change Record — Verification Integrity Remediation | Change Control | Draft |
| DCR-005 | Design Change Record — Standards Grounding (module M3) | Change Control | Draft |
| DCR-006 | Design Change Record — Denominator Policy (module M1) | Change Control | Draft |

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
| G | 2026-08-05 | QMS | v2.2.0 (DCR-006): differential denominator policy. Nucleated red cells are excluded from the peripheral blood percentage denominator and reported per 100 WBC — they were diluting every reported leucocyte percentage (HA-092, pre-RPN 64). Bone marrow unchanged: ICSH places erythroblasts inside the nucleated differential count. consensus-14 profile 2.0 → 2.1 so installed browsers receive the correction. |
| F | 2026-08-05 | QMS | v2.1.0 (DCR-005): standards grounding. ICSH 2008 verified against full text; IEC 62304 Class A declared with justification; REF-001 bibliography issued; HA-090/091 added. |
| E | 2026-08-04 | QMS | v2.1.0 (DCR-004): verification integrity remediation. Test suite re-pointed at shipped code (unit + jsdom behaviour + Playwright system layers across Chromium/Firefox/WebKit, 579 tests). RTM-001 re-keyed to URS-001 v2.0. SRS-001 extended with SYS-140–SYS-179. URS-034 amended to the largest-remainder method (URS Rev E). URS-001 v1.0 marked superseded. RA-001 re-scored: 5 hazards added, 4 residual RPNs corrected. DCR-002/003/004 and SOP-002/003 added to this index. |

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | | | |
| Quality Assurance | | | |
| Clinical Reviewer | | | |
| Regulatory Affairs | | | |
