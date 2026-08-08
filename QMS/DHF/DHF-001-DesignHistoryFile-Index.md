# DHF-001: Design History File Index

## WBC ΔΣ

| Field | Value                                                                                                                   |
|-------|-------------------------------------------------------------------------------------------------------------------------|
| **Document ID** | DHF-001                                                                                                                 |
| **Product Name** | WBC ΔΣ                                                                                                                 |
| **Product Version** | 2.22.0                                                                                                                     |
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

## 3.0 Device Status Analysis (FD&C Act §520(o)(1)(E))

> **This is not regulatory advice.** It is an engineering reading of published
> FDA guidance, prepared so that a qualified regulatory reviewer has something
> concrete to confirm or reject. **No regulatory position should be taken on it
> until that review has happened.** It is recorded here because the question was
> never asked, and §3.1 answers a question that only arises if the answer here is
> "device".

### 3.0.1 The prior question

The remainder of this file assumes the software is a medical device and reasons
carefully about its IEC 62304 safety class. It never asks whether the device
definition is met at all.

**21 CFR 864.5220** classifies an *automated differential cell counter* — a
device that **identifies** formed elements — as Class II. This software
explicitly does not do that, and §3 says so twice. It records classifications a
pathologist has already made at a microscope.

That does not by itself put it outside the device definition: software
"intended for use in the diagnosis of disease" is a device under §201(h)
regardless of how much of the work a human does. The exclusion, if it applies,
comes from **§520(o)(1)(E)**, added by the 21st Century Cures Act and
interpreted in FDA's final guidance ***Clinical Decision Support Software*
(September 2022)**.

### 3.0.2 The four criteria

All four must be met. Each is assessed below against the intended use in §3.

| # | Criterion (paraphrased from §520(o)(1)(E)) | Assessment |
|---|---|---|
| (i) | Not intended to acquire, process or analyse a medical image, a signal from an IVD device, or a pattern or signal from a signal acquisition system | **Met, with a qualification — see §3.0.3** |
| (ii) | Intended to display, analyse or print medical information about a patient | **Met.** It displays and analyses a differential count |
| (iii) | Intended to support or provide recommendations to a health care professional about prevention, diagnosis or treatment | **Met.** The user is a qualified professional, never a patient or caregiver |
| (iv) | Intended to enable that professional to independently review the basis, so that they are not expected to rely primarily on the software | **Met, and unusually strongly — see §3.0.4** |

### 3.0.3 Criterion (i) is the weakest, and where a reviewer should look first

The inputs are keystrokes. The operator looks down a microscope, decides what
each cell is, and presses a key. Nothing is acquired from an instrument: there
is no image, no waveform, no continuous data stream, and no connection to an
analyser. On the ordinary reading of "signal", and on the examples FDA's
guidance uses, this is not signal processing.

**The qualification.** The absolute-count feature (§URS-036, DCR-016) accepts a
white cell concentration that the operator **types in**, having read it from a
haematology analyser — an IVD device. The software then corrects it for
nucleated red cells and multiplies it by the differential percentages.

Two readings are possible, and a reviewer should decide between them rather than
be told:

- **A number transcribed by a human is not a "signal from an IVD device."** The
  statute and the guidance are concerned with software that *acquires* or
  *processes* signals and patterns. A discrete result re-entered by a
  professional who has read and judged it is medical information, which is
  criterion (ii) territory, not signal acquisition.
- **The value nonetheless originates from an IVD**, and the software performs
  arithmetic on it that changes a clinically actionable number — the absolute
  neutrophil count.

The first reading is, in our view, the better one. Two design choices support it
and were made for other reasons: the correction is **displayed rather than
applied silently**, with the entered value, the arithmetic and the result all
shown; and the feature is **optional** and off by default in the report
(`absoluteCountsInReport`). The professional sees the input they supplied, the
operation performed on it, and the output.

If a reviewer takes the second reading, the conclusion of this section does not
survive for the configuration with absolute counts enabled. That is a bounded
outcome: the feature is separable.

### 3.0.4 Criterion (iv) is the strongest

FDA's 2022 guidance treats criterion (iv) as the demanding one, and asks in
substance whether the professional can see and evaluate the basis for the output
rather than take it on trust. Four things this software already does bear
directly on it, none of them built for this purpose:

| Feature | Why it bears on (iv) |
|---|---|
| **The inputs are the professional's own decisions** | Every cell counted was identified by the operator. There is no hidden input to evaluate |
| **The method statement** (URS-055, DCR-009) | Every report states the profile, the denominator convention, the rounding policy, the precision, the interval level and the M:E composition, with citations |
| **`calculation-reference.html`** (CAL-001) | The full derivation of every number, its alternatives, the professional disagreement, and the citations — written for a pathologist who is not a haematopathologist |
| **Confidence intervals and the threshold advisory** (DCR-007, DCR-008) | The software states the *precision* of its own output, and says explicitly when a count does not resolve a diagnostic threshold. It reports uncertainty rather than concealing it |

The output is also not a directive. The software reports percentages, a ratio
and, where a threshold is nearby, that the count does not settle the question.
It does not state a diagnosis, does not recommend an action, and does not rank
possibilities. Nothing about the workflow is time-critical: the count is
reviewed and released under the laboratory's quality system before it reaches
the record.

The arithmetic is reproducible by hand. A pathologist who doubts a percentage
can divide two integers they can see on screen.

### 3.0.5 What would break this conclusion

The same boundary conditions as §3.1.2, plus two of its own. Any of these
requires the analysis to be redone **before** release:

- **Automated cell identification.** This ends the analysis immediately: it
  would remove risk control measure E2, defeat criterion (iv) — the professional
  could no longer review the basis of a classification the software made — and
  bring the software within 21 CFR 864.5220.
- **Direct instrument connection.** Reading a WBC from an analyser over an
  interface, rather than from an operator's keyboard, engages criterion (i)
  directly.
- **Any diagnostic output.** Stating or ranking a diagnosis, or issuing a
  recommendation to act, engages criterion (iv) and probably (iii).
- **Concealing the basis.** Removing the method statement, the calculation
  reference or the confidence intervals would weaken the strongest part of this
  analysis. They are load-bearing for it, not decorative.
- **Labelling and promotion.** FDA assesses intended use partly from what the
  manufacturer claims. Marketing this as diagnostic software could establish an
  intended use the code does not have.

### 3.0.6 Scope and limitations of this analysis

- **United States only.** It says nothing about the EU. Under Regulation (EU)
  2017/745 Annex VIII **Rule 11** and MDCG 2019-11, software providing
  information used to take decisions with diagnostic purposes is generally a
  device and frequently Class IIa. **The conclusion here does not travel**, and a
  laboratory outside the US should not rely on it.
- **Non-device is not enforcement discretion.** If the four criteria are met the
  software is not a device. Some CDS is a device that FDA does not actively
  regulate — a weaker position. This section claims the former, which is why it
  needs confirming rather than assuming.
- **Nothing here reduces liability**, or the obligations a laboratory has under
  CLIA, CAP or ISO 15189 for a test it reports.
- **It was not prepared by a regulatory professional.**

### 3.0.7 If the analysis holds, what changes

Very little, deliberately.

The verification architecture, the risk file, the traceability and the change
control **are retained regardless**. §3.1.3 already records that this project
performs activities Class A does not require, because the classification depends
on external measures the manufacturer does not control. The same reasoning
applies with more force here: if the software is not a device, the quality
system is the *only* control the manufacturer has, and the argument for keeping
it is stronger, not weaker.

What changes is the **framing**: the QMS becomes documented good practice
undertaken voluntarily, rather than a compliance obligation this project is at
risk of failing. That distinction matters for a public, Apache-2.0 project
maintained by a small number of people, and it is the honest answer to whether
the process around this software is disproportionate.

**§3.1 (IEC 62304 Class A) is retained as a voluntary secondary position** and
is not withdrawn by this section. If the device question is ever answered the
other way, the safety classification is already in place.

### 3.0.8 Status

**Prepared 2026-08-06 (DCR-022). Not reviewed. Not relied upon.**

| Action | Owner | Status |
|--------|-------|--------|
| Confirm or reject the §3.0.2 assessment | Qualified regulatory reviewer | **Outstanding** |
| Decide criterion (i) on the transcribed analyser WBC (§3.0.3) | Qualified regulatory reviewer | **Outstanding** |
| Confirm the EU position separately if distribution is contemplated | Qualified regulatory reviewer | **Outstanding** |

---

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
| SGR-001 | Sign-off Register (`SIGNOFF-REGISTER.md`) — which approvals are outstanding, generated from the signature tables themselves | Review Record | Generated |
| DRL-001 | Drift Log (`DRIFT-LOG.md`) — every claim this file made that had stopped being true, with the guard that now prevents it | Quality Record | Append-only |
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
| DCR-015 | Design Change Record — Independent Review Remediation | Change Control | Draft |
| DCR-016 | Design Change Record — Corrected WBC for Nucleated Red Cells | Change Control | Draft |
| DCR-017 | Design Change Record — Citation, Evidence Provenance and Counted Quantities | Change Control | Draft |
| DCR-018 | Design Change Record — Verification Register | Change Control | Draft |
| DCR-019 | Design Change Record — SDD-001 Revision | Change Control | Draft |
| DCR-020 | Design Change Record — Scope Reduction | Change Control | Draft |
| DCR-021 | Design Change Record — SAD-001 Revision | Change Control | Draft |
| DCR-022 | Design Change Record — Device Status Analysis | Change Control | **Prepared, not reviewed** |
| DCR-023 | Design Change Record — Display Consistency and Editor Cascade | Change Control | Draft |
| DCR-024 | Design Change Record — Verification Identifiers | Change Control | Draft |
| DCR-025 | Design Change Record — Scientific Framing | Change Control | Draft |
| DCR-026 | Design Change Record — Confidence Interval for a Derived Ratio | Change Control | Draft |
| DCR-027 | Design Change Record — Citation Withdrawal and Sign-off Register | Change Control | Draft |
| DCR-028 | Design Change Record — Licence Statement and Reservation of the Name and Mark | Change Control | Draft |
| DCR-029 | Design Change Record — Drift Consistency | Change Control | Draft |
| DCR-030 | Design Change Record — Self-Hosted Webfonts | Change Control | Draft |
| DCR-031 | Design Change Record — Greek Subset for the Product Name, and a Self-Referential Drift | Change Control | Draft |
| DCR-032 | Design Change Record — The Predecessor Profile | Change Control | Draft |
| DCR-033 | Design Change Record — One Totals Column | Change Control | Draft |
| DCR-034 | Design Change Record — A Column Grid That Mirrors the Keyboard | Change Control | Draft |
| DCR-035 | Design Change Record — Profile Names State Contents | Change Control | **In Review** |
| DCR-036 | Design Change Record — Tonal Feedback | Change Control | **In Review** |

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
| AL | 2026-08-07 | QMS | v2.22.0 (DCR-036): tonal feedback. The operator's eyes are on the microscope, so audio is the only free feedback channel; the click carries one bit — *a* key registered — and a per-category tone carries the bit that matters, *which* key. Minor pentatonic from C3, derived from the profile's category order and not configurable, so no tone can disagree with the layout. Three modes, default unchanged at Click. **A defect in the endorsed formula was found before implementation:** the centring offset, unclamped, drives the scale index negative for profiles larger than fourteen categories, and JavaScript's negative modulo made the frequency NaN — silently, on the erythroid, blast and precursor rows, which is where the feedback matters most. **And a hazard the proposal did not carry: HA-110.** Pitch follows category order, so the count acquires a texture that correlates with the emerging picture while the operator is classifying ambiguous cells — a detection aid has an error model, this influences judgement and has none. Detection scored 5. Controlled by not defaulting to tones and by keeping the texture out of operator documentation, since naming it would prime it; residual 27, accepted pending clinical review, which DCR-036 §7 invites specifically. Pilot decision rule pre-registered in VV-001 §5.4.1 before any data exists. |
| AK | 2026-08-07 | QMS | v2.21.0 (DCR-035): profile names now state what a profile IS — tallied category count and defining trait — rather than asserting endorsement. `consensus-14` claimed a consensus no body ratified; `harmonized-9` contradicted itself three ways (id said 9, name said 10-Part, description said 9-part, profile tallies ten); `legacy-9` said only that something was old, and was not the older of the two 10-type panels. Ids renamed too, because an id prints in the report footer and travels in every export. `legacy-mdc` renamed as well though the proposal omitted it — it carried the proposal's own banned word. **Two defects found:** `minimal-5` and `body-fluid` carried a copy-pasted provenance note claiming a bone marrow and M:E basis with neither a `bm` specimen nor an M:E formula, and that note prints into the report method statement under "Basis:" — those reports stated a basis that did not exist. And the catalogue and the file disagreed about the blank template's name. **HA-107 added:** the aggregated 10-type panels have no plasma-cell or mast-cell category, so a marrow containing them offers no key; guidance is placed on the lymphocyte and basophil rows, where the substitution would be made, not in a general note. Cached configs under renamed ids are offered the successor and decline by default, never replaced silently. VV-PRE-030..034; drift incidents 27–29. |
| AJ | 2026-08-07 | QMS | v2.20.0 (DCR-034): should the category cells align between rows too? Both were built and looked at. In general no — the rows hold different category sets, BLASTS above BASO asserts a relationship that does not exist, and on the worst shipped split (legacy-9, 4 above 6 below) a shared grid empties a third of the upper row and stops its rule mid-table. But where a profile assigns keys along two adjacent physical keyboard rows in left-to-right order, column N of each row is the same finger — A above Z, S above X, D above C, F above V — and the screen mirrors the operator's hand. Reading the shipped assignments showed only legacy-mdc qualifies, which is why the rule is conditional rather than blanket: applied to all it would pay the cost everywhere and deliver the benefit once. `Core.keyboardGrid` decides it from the configuration alone, indexed by physical key position so an unused key leaves a hole rather than closing up. VV-KBD-001..006, VV-SYS-215, VV-SYS-216. |
| AI | 2026-08-07 | QMS | v2.19.1 (DCR-033): every figure reporting a total sat in a different column. Each category row is its own `w-full` table, so it divided the width by its OWN column count — a four-category row and a five-category row put `Sub` in different places — and the grand total, pinned to the container edge by `flex justify-between`, landed in a third, about 40px away. Most shipped profiles split unevenly, so this was the ordinary case rather than an edge one. One shared width now governs the row tables' last column, the grand total and every derived formula. VV-SYS-213 and VV-SYS-214 measure the centres rather than eyeballing them, at three widths and on an uneven 4/5 split. |
| AH | 2026-08-07 | QMS | v2.19.0 (DCR-032): `legacy-mdc` added to the preset catalogue — the 2015 predecessor counter's layout key-for-key, so an operator trained on it switches without relearning the keyboard. Its configuration was recovered from commit aa88da4 and then confirmed by **executing** that application under Playwright, which mattered: `counter.js` looks like its engine and is commented out of `index.jsp`, and the live path behaves differently. Driven with one blast in 201 cells the predecessor reported "0% blasts" and its nine figures summed to 99; this engine reproduces that exactly under independent rounding, which is how the reading was confirmed rather than assumed. The shipped profile keeps the predecessor's keys, minimums and report wording and uses this application's arithmetic, so the blast reports as 0.5% and the figures sum to 100. The Precipio DX template's M:E field, which printed a literal underscore for eleven years, is computed. The profile declares in provenance, in on-screen category notes and in the user guide that it is coarser than ICSH and cannot report NRBC per 100 WBC in peripheral blood. Default unchanged. VV-PRE-021..026, VV-SYS-210..212, UD-095, UD-096. |
| AG | 2026-08-07 | QMS | v2.18.0 (DCR-031): the product could not set its own name. `WBC ΔΣ` contains two Greek characters, and DCR-030 excluded the Greek subset as a cosmetic trade-off affecting free-text comments — sound for comments, and it did not consider the mark. The wordmark face cannot help: Libre Franklin has no Greek subset upstream at all. So Inter's is bundled and the wordmark stack routes through it, putting the two characters of the product's name in a font that ships with the application rather than one the workstation happens to have. Separately, and more sharply: `CLAUDE.md` opened by stating this file's drift-log totals from memory — the document whose principle 2 forbids exactly that — and they went stale one change record later, found while preparing a manuscript that would have described a drift-control system from a summary that had drifted. The counts are removed rather than corrected, DRIFT-LOG §4 now names its exceptions instead of counting its majority, QC-027 checks the log against its own rows, and the closure sweep gains a ninth step: `CLAUDE.md` itself. SC-064, QC-027. |
| AF | 2026-08-07 | QMS | v2.17.0 (DCR-030): the three webfonts are self-hosted, closing the last external request and README Limitation 5. The exception cost two things at once: an air-gapped workstation never received the fonts at all — the service worker cached them only after a successful fetch, which is no help to the machine URS-094 is actually about — and a connected one resolved two Google domains on every page load. Six variable-font WOFF2 files, 236 KB, latin and latin-ext; Cyrillic, Greek and Vietnamese deliberately not bundled and the fallback recorded as a limitation rather than left to be discovered. All three are SIL OFL 1.1, so the licences ship beside them and NOTICE declares them — together with the vendored Tailwind bundle, which had been undeclared. CACHE_VERSION bumped because without it an installed browser keeps serving pages that still link to the CDN. The offline claim is now absolute and SC-060–063 test it absolutely, in a real browser as well as statically. |
| AE | 2026-08-07 | QMS | v2.16.0 (DCR-029): seven live claims had stopped being true, and none was introduced carelessly — each was written when it was accurate, by a session doing correct work on the document in front of it. Four documents held four copies of the test totals and three disagreed; TR-001, whose subject is the test results, was the furthest out. HA-093 was closed in RA-001 and open in DHF-001 §7.4 and REF-001 §5, the latter ten lines below §3.8's own statement that it was closed. Thresholds still refused ratios "because no confidence interval is computed" — false since DCR-026; the rule stands, its reason is now the percentage scale. DHF-001 restated the sign-off register DCR-027 had made authoritative. README described Tailwind as CDN-delivered after it was vendored. Test totals are now written once by the evidence run into `qms:fact` markers and `qms-counts.js` no longer competes for them; a dirty or failing run refuses to write documents at all. QC-021–026 make six classes of drift fail the build. `DRIFT-LOG.md` records all 21 incidents to date — sixteen introduced by capable sessions — and `CLAUDE.md` states the closure sweep they each missed. |
| AD | 2026-08-06 | QMS | v2.15.0 (DCR-028): the repository makes two offers and they must not blur. The code is Apache-2.0 — commercial use included, unqualified. The name and the logo are reserved under Apache-2.0 §6, which grants no trademark rights. `LICENSE` and `TRADEMARKS.md` were both already correct; what was missing was the machinery that makes the reservation travel and be found. `NOTICE` added as the §4(d) carrier a redistributor must keep; README §License rewritten to state both grants and link all three files; the logo annotated at all ten places it is inlined as SVG, because a notice in the repository root does not travel with a copied page. QC-017–020. |
| AC | 2026-08-06 | QMS | v2.14.0 (DCR-027): two statements a reader had to take on trust. **REF-001 [S4] (Rümke 1985) is withdrawn** — open as "primary text not held" since DCR-005, it could not be obtained from any library available to this project, including Yale's. A design file should not rest on a citation nobody involved has read. Nothing is lost: §3.8 now derives the imprecision of a ratio from the binomial model the software implements, supported by [S7] and [S8], both held. URS-037 is recited to [S8] — it had cited [S4] for the imprecision of a single percentage, which is not what that paper concerns. The design history still names it, because rewriting the record of a decision falsifies it. **`SIGNOFF-REGISTER.md` added**, generated from the signature tables themselves: the clinical brief named eleven documents needing a signature against a true thirty-one, and listed the M:E interval as outstanding a week after DCR-026 closed it. A reviewer handed a stale checklist cannot tell. SC-054–057, QC-012–015. |
| AB | 2026-08-06 | QMS | v2.13.0 (DCR-026): the M:E ratio carries a confidence interval, closing HA-093 and the REF-001 §3.8 gap — the imprecision Rümke's 1985 paper actually concerns, and the one figure on the results screen that lacked one. Exact rather than approximate: conditioning on the cells in the ratio leaves a single binomial, so M:E is an odds and the interval is the odds transform of the Wilson interval already adopted. Fieller was rejected for degenerating with no erythroid cells; a bootstrap for being stochastic in a figure that enters a patient record. Clinical review invited on the choice of model. |
| AA | 2026-08-06 | QMS | v2.12.0 (DCR-025): scientific framing. The 200-cell peripheral blood target is no longer presented as the CLSI H20-A2 reference method — that method is two reviewers counting 200 cells each, and this application implements a single-observer workflow. The 500-cell marrow target is attributed to ICSH 2008 rather than a CAP recommendation, and the sub-target advisory now carries the ICSH condition under which 300 cells suffice, so it informs rather than over-warns. URS-032 amended and SYS-041 superseded by SYS-232, resolving a direct contradiction over decimal precision; the Calculation Reference now states what precision a count of a given size actually supports. |
| Z | 2026-08-06 | QMS | v2.11.0 (DCR-024): every test now carries a verification identifier. 328 tests — the whole static structural layer plus the configuration, schema and preset suites — ran and passed but could not be cited, because a traceability document needs an identifier to point at. 285 call sites named across eight suites by a transformer rather than by hand. Naming them exposed two defects in the register tooling: it under-counted by 91 because its row pattern required a hyphen before the digits and TC-B012 fuses its letter to them, and its "unidentified" figure counted parametrised runs and describe blocks as unidentified tests. Guarded by QC-011. |
| Y | 2026-08-06 | QMS | v2.10.1 (DCR-023): the last two P0 defects from independent review. Removing a category from the layout now removes what depended on it, rather than leaving the profile to fail validation with a message about a category the operator had just deleted. Row subtotals are the sum of the displayed cells rather than an independent calculation that could differ from them by a whole point, and session history reports at the precision the count used rather than a hard-coded two places. All ten P0 items are now closed. |
| X | 2026-08-06 | QMS | v2.10.0 (DCR-022): §3.0 added — the prior question this file never asked. Whether the software is a device at all under FD&C Act §520(o)(1)(E) and FDA's 2022 Clinical Decision Support guidance. All four criteria assessed; criterion (i) flagged as the weakest, because the absolute-count feature accepts an analyser WBC the operator transcribes; criterion (iv) as the strongest, resting on the method statement, the calculation reference and the confidence intervals. **Prepared, not reviewed, not relied upon** — §3.1 Class A remains the operative position until a qualified regulatory reviewer closes §3.0.8. UD-090 to UD-092 tie the argument to the code. |
| W | 2026-08-06 | QMS | v2.9.1 (DCR-021): SAD-001 re-issued at v3.0. Its drift was worse than SDD-001's: §7.1 stated "sessionStorage only … No localStorage", denying the crash-recovery snapshot that holds the accession number and morphology comments — the same false privacy claim corrected in README.md under DCR-015 and not propagated. Five of six shipped modules appeared zero times; Tailwind was described as CDN-delivered in three places; §5.2 listed a file that does not exist; §3.2.3 and §7.2 carried the key mapping withdrawn at v2.0. Guarded by UD-070 to UD-074. |
| V | 2026-08-06 | QMS | v2.9.0 (DCR-020): scope reduction. 1.2 MB of assets referenced by nothing removed (web/ falls from 2.1 MB to 868 KB), along with calcPercentages — dead, and dangerous because it ignored denominatorExcludes; its seven test cases were re-pointed at the live path rather than deleted. The profile audio default is now honoured; it had been written by the editor and read by nothing. Three duplicate presets merged, two mislabelled 9-Part names corrected to 10-Part, and P0-9 closed. The three selectable clinical options are retained by decision of the Document Owner. |
| U | 2026-08-06 | QMS | v2.8.0 (DCR-019): SDD-001 re-issued at v3.0. It contained zero occurrences of Wilson, confidence, threshold, denominatorExcludes, per100 or rounding — DCR-006 to DCR-018 were entirely undesigned — gave a percentage formula the product had not used since DCR-006, documented a key mapping withdrawn at v2.0, and stated that Tailwind loads from a CDN, which would defeat URS-094. RTM-001 cited nine design sections that did not exist. §3.9 to §3.18 added, including §3.10 on the calculation engine. Guarded by UD-060 to UD-063. |
| T | 2026-08-06 | QMS | v2.7.9 (DCR-018): VV-001 re-issued at v3.0 and TP-001 at v2.0 around a register generated from the test runners. 98 of 111 identifiers cited by RTM-001 and TR-001 existed in no protocol document, and none of TP-001's 106 TC-0xx numbers appeared in any test file; the gap had widened from the 61 the review found, because every new suite cited new identifiers without touching the protocol. The TC-0xx numbering is withdrawn rather than retrofitted with a mapping that never existed. Guarded by QC-004 to QC-006. |
| S | 2026-08-06 | QMS | v2.7.8 (DCR-017): the blast-denominator change is attributed to the WHO 2016 revision, not WHO 2022, with Arber et al. added as [S10] — a wrong date on the citation for a rule that moves a case across the 20% boundary. The evidence runner now executes and captures the browser layer it always claimed, with the failure path verified deliberately. Counted quantities are measured from the documents and the runners by  and guarded by suite 14; nine headline figures were wrong, including 22 hazards against 51 and 579 tests against 979. |
| R | 2026-08-06 | QMS | v2.7.7 (DCR-016): absolute counts are corrected for nucleated red cells. The application held the NRBC per-100 figure and printed the correction formula in its own reference document, then derived absolute counts from the uncorrected analyser WBC — overstating every one by 20% at 20 NRBC/100 WBC, where the absolute neutrophil count drives neutropenia grading. The correction is applied before any absolute count and displayed rather than performed silently. HA-105 (pre-RPN 75). **Clinical approval required before use.** |
| Q | 2026-08-06 | QMS | v2.7.6 (DCR-015): independent review remediation. Five P0 code defects corrected, two of them in the input path and carrying the highest pre-mitigation RPNs in the file: key auto-repeat was unguarded (HA-103, RPN 80) and four categories in a shipped preset could not be un-counted (HA-104, RPN 48). SOP-001, marked Issued for local adoption, documented a superseded key map under which an operator would record monocytes as blasts — the HA-097 class, never propagated. Evidence bundles now carry a verified code identity and a dirty-tree run is stamped PROVISIONAL. Findings deferred rather than dismissed are listed in DCR-015 §5. |
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
| **In Review** | Enumerated in `SIGNOFF-REGISTER.md`, which is generated from the signature tables themselves | Engineering approvals complete. **A clinical signature is outstanding** and these are not a released baseline until it is obtained. The list is not repeated here: this row named six change records when there were twenty-eight. |
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

1. Clinical signatures on the documents listed in `SIGNOFF-REGISTER.md`. The
   count is not stated here — the register measures it, and this line said
   eleven when the true figure was twenty-nine.
2. The NRBC reporting convention (DCR-006) is not stated in a held primary
   source — see REF-001 §2.1.
3. CLSI H56-A is not held; affects the `body-fluid` preset only.
4. ~~No interval is computed for the M:E ratio (HA-093).~~ **Closed
   2026-08-06 (DCR-026)** — the ratio carries a confidence interval, computed as
   the odds transform of a Wilson interval on the conditional binomial.

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Clinical Reviewer | | | |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
