# DHF-001: Design History File Index

## WBC ΔΣ

| Field | Value                                                                                                                   |
|-------|-------------------------------------------------------------------------------------------------------------------------|
| **Document ID** | DHF-001                                                                                                                 |
| **Product Name** | WBC ΔΣ                                                                                                                 |
| **Product Version** | 2.7.1                                                                                                                     |
| **Classification** | Clinical Laboratory Aid - Software                                                                                      |
| **Intended Use** | Keyboard-driven manual differential white blood cell counting tool for hematology laboratory personnel                  |
| **Software Safety Class** | **Class A** (IEC 62304 §4.3) — confirmed 2026-08-05, see §3.1 |
| **Regulatory Framework** | 21 CFR Part 820 (Quality System Regulation), IEC 62304 (Medical Device Software Lifecycle), ISO 14971 (Risk Management) |
| **Date Created** | 2026-02-18                                                                                                              |
| **Document Owner** | Quality Management                                                                                                      |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding (§7) |

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

**Signed off 2026-08-05 by the Document Owner: Class A, on the basis stated in §3.1.1.**

The classification was proposed as an engineering assessment resting on clinical
judgements about the external risk control measures E1–E5. Those judgements have
been reviewed and accepted: the differential count produced by this tool is one
input among several, is interpreted by a qualified operator who has identified
every cell counted, and is reviewed before release under the laboratory's
quality system.

The boundary conditions in §3.1.2 remain binding. In particular, extending the
software to perform automated cell recognition would remove measure E2 and
requires the classification to be reassessed before release.

| Role | Decision | Date |
|------|----------|------|
| Document Owner | **Class A confirmed** | 2026-08-05 |
| Clinical Reviewer | | |
| Regulatory Affairs | | |

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
| SRS-001 | System Requirements Specification v2.7 | Requirements | Draft |
| SAD-001 | System Architecture Design v2.0 | Design | Draft |
| SDD-001 | Software Detailed Design v2.0 | Design | Draft |
| RA-001 | Risk Analysis (FMEA) v2.8 | Risk Management | Draft |
| TP-001 | Test Plan v2.0 | Verification | Draft |
| VV-001 | Verification & Validation Protocol v2.0 | V&V | Draft |
| RTM-001 | Requirements Traceability Matrix v3.0 | Traceability | Draft |
| **REF-001** | **Standards and Literature Basis v1.0 (Rev D)** | Reference | Draft |
| MAL-001 | Methods and Limitations, operator-facing (`web/methods.html`) | Instructions for Use | Draft |
| CAL-001 | Calculation Reference (`web/calculation-reference.html`; control record `CALCULATION-REFERENCE.md`) — every calculation explained, with alternatives, controversies and what is configurable | Instructions for Use | In Review |
| CRB-001 | Clinical Review Brief (`CLINICAL-REVIEW-BRIEF.md`) — the request put to reviewing haematopathologists | Review Record | Issued |
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
| DCR-007 | Design Change Record — Sampling Precision (module M4) | Change Control | Draft |
| DCR-008 | Design Change Record — Derived Quantities and Thresholds (module M5) | Change Control | Draft |
| DCR-009 | Design Change Record — Method Provenance (module M2) | Change Control | Draft |
| DCR-010 | Design Change Record — Selectable Reporting Policy | Change Control | Draft |
| DCR-011 | Design Change Record — Presentation Legibility | Change Control | Draft |
| DCR-012 | Design Change Record — Configuration Fidelity | Change Control | Draft |
| DCR-013 | Design Change Record — Counting Policy Editor | Change Control | Draft |
| DCR-014 | Design Change Record — Shared Dialog | Change Control | Draft |

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
| M | 2026-08-05 | QMS | v2.7.1: CAL-001 moved from a Markdown file in this directory to `web/calculation-reference.html`, so that it ships with the product, is reachable from the case-entry screen, the Methods page and the results screen, and is available offline. The Markdown file is retained as the document control record. Held in one place to avoid the drift recorded as HA-097. |
| P | 2026-08-06 | QMS | v2.7.5 (DCR-014): one dialog widget for the whole product. The configuration editor's three browser `prompt()` calls are replaced by the product's own themed dialog with stated rules and per-field validation; the shared visual primitives move into `theme.css`. Replacing them exposed two modality defects — a counting key pressed over an open dialog was tallied, and Escape would have discarded a recovered count — and a mid-transition contrast reading led to the finding that every primary button was 3.68:1 under the pointer. SYS-244 to SYS-247 added, SYS-113 extended to interaction states; HA-101 and HA-102 recorded. |
| O | 2026-08-06 | QMS | v2.7.4 (DCR-013): the Counting Policy panel. The denominator, rounding, precision, confidence interval, diagnostic thresholds and the composition of derived figures are now set in the configuration editor rather than only by hand-editing JSON, completing the DCR-010 principle that a contested choice is the laboratory's to make. Closes URS-102 clause (g), which was never implemented although RTM-001 recorded the requirement as fully covered. SYS-240 to SYS-243 added; VV-SYS-065 to 069. |
| N | 2026-08-06 | QMS | v2.7.3 (DCR-012): configuration fidelity. A reviewer asked where `denominatorExcludes` is configured; the answer was nowhere, and verifying the configuration UI found that the editor destroyed every profile field it did not model (including the denominator policy and the M:E formula) while reporting success, that its output was then discarded as superseded, and that no shipped preset carried the denominator policy — making HA-092 reachable from the catalogue. HA-099 and HA-100 added. |
| M | 2026-08-06 | QMS | v2.7.2 (DCR-011): presentation legibility. Five per-page theme blocks consolidated into one stylesheet; every muted tone recalibrated against the lightest surface it is used on; both primary action buttons corrected (they failed WCAG AA in **both** themes); the theme moved to `<html>` and applied before first paint. SYS-113 and SYS-114 added — HA-098 previously had mitigations but no requirement behind them. Verified by VV-SYS-162..168, a full-surface sweep that found 330 failures the region-scoped checks could not see. |
| L | 2026-08-05 | QMS | v2.7.0 (DCR-010): rounding policy, decimal precision and the M:E convention become selections rather than fixed behaviour — three choices the tool had been making on the laboratory's behalf. Calculation Reference issued. |
| K | 2026-08-05 | QMS | v2.6.0: **IEC 62304 Class A confirmed** and **RA-001 severity ratings reviewed and accepted** by the Document Owner, closing the two open sign-offs. CLSI H20-A2 resolved without purchase — its specification is quoted in Hedley 2025 (REF-001 §2.1). Operator-facing Methods and Limitations page added and pinned to the shipped configuration by test suite 13. HA-097 added: USER-GUIDE.md was found describing a superseded nine-category layout. |
| J | 2026-08-05 | QMS | v2.5.0 (DCR-009): method provenance. A result now states the conventions that produced it, not only which profile did. Closes a URS-052 gap — the clipboard path, the primary route into the LIS, carried no profile attribution while file export did (HA-096). Completes the five-module standards-review plan. |
| I | 2026-08-05 | QMS | v2.4.0 (DCR-008): subset-percentage formulas and the near-threshold advisory. Closes the ICSH §2.6 gap recorded under DCR-005: where a confidence interval spans a configured diagnostic threshold, the count does not settle the question and the system now says so. HA-094 added. |
| H | 2026-08-05 | QMS | v2.3.0 (DCR-007): sampling precision. Every reported percentage carries a Wilson confidence interval and the sub-target advisory is quantified. HA-030 residual 24 → 12. HA-093 added — the M:E ratio implies a precision the count does not support, which is what Rümke's paper actually warns about. |
| G | 2026-08-05 | QMS | v2.2.0 (DCR-006): differential denominator policy. Nucleated red cells are excluded from the peripheral blood percentage denominator and reported per 100 WBC — they were diluting every reported leucocyte percentage (HA-092, pre-RPN 64). Bone marrow unchanged: ICSH places erythroblasts inside the nucleated differential count. consensus-14 profile 2.0 → 2.1 so installed browsers receive the correction. |
| F | 2026-08-05 | QMS | v2.1.0 (DCR-005): standards grounding. ICSH 2008 verified against full text; IEC 62304 Class A declared with justification; REF-001 bibliography issued; HA-090/091 added. |
| E | 2026-08-04 | QMS | v2.1.0 (DCR-004): verification integrity remediation. Test suite re-pointed at shipped code (unit + jsdom behaviour + Playwright system layers across Chromium/Firefox/WebKit, 579 tests). RTM-001 re-keyed to URS-001 v2.0. SRS-001 extended with SYS-140–SYS-179. URS-034 amended to the largest-remainder method (URS Rev E). URS-001 v1.0 marked superseded. RA-001 re-scored: 5 hazards added, 4 residual RPNs corrected. DCR-002/003/004 and SOP-002/003 added to this index. |

## 7. Approval State and Roles

### 7.1 Combined roles

In this organisation the **Design Engineer, Quality Assurance, Regulatory
Affairs, Systems Engineer, Software Architect, Software Engineer, Test Lead,
V&V Lead and Risk Manager** functions are all discharged by the same
individual, Peter Gershkovich, M.D., M.H.A.

Roles are recorded separately throughout this DHF to identify **which function
is being discharged**, not to imply that independent reviewers examined the
work. This is stated explicitly so that the signature blocks are read
correctly.

### 7.2 What is approved, and what is not

| State | Documents | Meaning |
|-------|-----------|---------|
| **Approved** | RTM-001, SAD-001, SDD-001, SRS-001, TP-001, TR-001, DCR-001, DCR-002, DCR-003 | Every required signatory has signed. These are engineering and verification artefacts with no clinical signatory. |
| **In Review** | DHF-001 (this document), URS-001 v2.0, RA-001, REF-001, VV-001, DCR-004 to DCR-009 | Engineering approvals complete. **A clinical signature is outstanding** and these are not a released baseline until it is obtained. |
| **Issued for local adoption** | SOP-001 | Signatories are the adopting laboratory's Laboratory Director, Quality Manager and Clinical User Representative, not the manufacturer's. |
| **Superseded** | URS-001 v1.0 | Retained for design history only. Not to be signed. |

### 7.3 Brief for clinical reviewers

Clinical sign-off is sought from practising haematopathologists after
hands-on evaluation. A reviewer signing as **Clinical Reviewer** or **Clinical
User Representative** is attesting to the clinical content, not the software
engineering. Specifically:

| Document | What the clinical signature attests to |
|----------|----------------------------------------|
| **URS-001 v2.0** | That the user requirements describe what a haematopathologist actually needs, and that the workflow decisions — optional case number, advisory rather than enforced target counts, Continue Counting — match clinical practice. |
| **RA-001** | That the **Severity** ratings correctly express the clinical consequence of each failure, and that the residual risks accepted in §5.3 are acceptable. §6.4 records that these were reviewed by the Document Owner; an independent clinical view is the point of this signature. |
| **REF-001** | That the standards are interpreted correctly — in particular the ICSH §2.6 nucleated differential count, the M:E convention including monocytes, and the limitations stated in §3.9. |
| **DCR-006** | **The change with the most direct effect on reported patient values.** Nucleated red cells were removed from the peripheral blood percentage denominator. Every leucocyte percentage this tool reports for peripheral blood changed as a result. |
| **DCR-007** | That reporting confidence intervals alongside percentages is appropriate, and that the interval shown is interpreted correctly by a reader. |
| **DCR-008** | That the shipped diagnostic thresholds and the near-threshold advisory are clinically sound, and that advisory-not-blocking is the right behaviour. |
| **DCR-004, DCR-005, DCR-009** | Supporting: verification approach, standards grounding, and method provenance in reports. |

Reviewers should also read `web/methods.html`, the operator-facing Methods and
Limitations page, since that is what end users will rely on to interpret the
numbers.

### 7.4 Outstanding items for a released baseline

1. Clinical signatures on the eleven documents listed as In Review.
2. The NRBC reporting convention (DCR-006) is not stated in a held primary
   source — see REF-001 §2.1.
3. CLSI H56-A is not held; affects the `body-fluid` preset only.
4. No interval is computed for the M:E ratio (HA-093).

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Clinical Reviewer | | | |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
