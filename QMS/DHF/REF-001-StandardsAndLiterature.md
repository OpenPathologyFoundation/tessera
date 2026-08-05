# REF-001: Standards and Literature Basis

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | REF-001 |
| **Version** | 1.0 |
| **Product** | WBC ΔΣ v2.1.0 |
| **Date Created** | 2026-08-05 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Change Record** | DCR-005 |

---

## 1. Purpose

This document is the controlled bibliography for WBC ΔΣ. It records the
standards and peer-reviewed literature that the counting model, the default
configuration profiles, the target cell counts and the derived formulas are
based on, and states for each source whether it was read in full text or
summarised.

It exists because the product's central design claim — that institutional
variation in differential counting practice is accommodated through
configuration rather than code — is only defensible if the *defaults* shipped
in that configuration are themselves traceable to a recognised standard. A
configurable system with unsourced defaults moves the problem rather than
solving it.

## 2. Source Register

| Ref | Source | Access status | Used for |
|-----|--------|---------------|----------|
| **[S1]** | Lee S-H, Erber WN, Porwit A, Tomonaga M, Peterson LC, for the International Council for Standardization in Hematology. **ICSH guidelines for the standardization of bone marrow specimens and reports.** *Int J Lab Hematol* 2008;30(5):349–364. doi:10.1111/j.1751-553X.2008.01100.x | **Full text held** (`sources/`) | BM cell categories, target counts, M:E ratio definition, NDC exclusions, near-threshold recount |
| **[S2]** | CLSI **H20-A2**: *Reference Leukocyte (WBC) Differential Count (Proportional) and Evaluation of Instrumental Methods*, 2nd ed. Wayne PA: Clinical and Laboratory Standards Institute; 2007. | **Not held (paid standard).** Its specification is quoted in [S8] and its scope described in [S9], both open access and both held in full text. | PB target count (200), reference method |
| **[S3]** | CLSI **H56-A**: *Body Fluid Analysis for Cellular Composition; Approved Guideline*. Wayne PA: CLSI; 2006. | **Not held — summaries only** | Body fluid categories, reporting when <100 cells counted |
| **[S4]** | Rümke CL. The imprecision of the ratio of two percentages observed in differential white blood cell counts: a warning. *Blood Cells* 1985;11(1):137–140. PMID 4074888 | **Not held — abstract only** | Binomial confidence intervals for differential percentages |
| **[S5]** | Is a 500-Cell Count Necessary for Bone Marrow Differentials? *Am J Clin Pathol* 2018;150(1):84–89. | Summary read | Evidence that 300-cell counts are diagnostically non-inferior |
| **[S6]** | WHO Classification of Haematolymphoid Tumours, 5th ed. (2022) and International Consensus Classification (2022). | Secondary sources | Blast percentage denominator; diagnostic thresholds |
| **[S7]** | Brown LD, Cai TT, DasGupta A. **Interval estimation for a binomial proportion.** *Statist Sci* 2001;16(2):101–133. | Summary read | Choice of the Wilson score interval over the Wald approximation |
| **[S8]** | Hedley BD, Keeney M, Gambell P, Qu C, Mao J, Davis BH, Wood BL. **White Blood Cell Enumeration and Differential by Flow Cytometry: The ICSH WBC Reference Method.** *Int J Lab Hematol* 2026;48(1):93–101. doi:10.1111/ijlh.14553. **Open access.** | **Full text held** (`sources/`) | The CLSI H20-A2 reference method specification; quantified limitations of manual differential counting |
| **[S9]** | Comar SR, Malvezzi M, Pasquini R. **To follow or not to follow the recommendations regarding microscopic analysis of the CLSI H20-A2 to validate the criteria for blood smear review?** *Rev Bras Hematol Hemoter* 2015;37(1):69–70. **Open access.** | **Full text held** (`sources/`) | Scope of CLSI H20-A2; laboratory-specific criteria |

**Sources not held in full text are marked as such deliberately.** Where a
requirement rests on [S3], [S4] or [S6], the citation in URS-001 or SRS-001
carries the same qualification.

### 2.1 CLSI H20-A2: resolved without purchase

H20-A2 is a paid standard and was previously recorded as a blocking open item.
It is no longer one. The specification this project depends on is stated
verbatim in [S8], an open-access ICSH paper whose authors include the ICSH
Board's working group:

> "The current reference method is manual smear review performed by two
> reviewers counting 200 cells each, as outlined in CLSI H20-A2, first approved
> in 1992 and revised in 2007 with a 2023 revision recently reviewed." — [S8] §1

[S9] independently describes its scope: "The CLSI H20-A2 ... is a reference
document to evaluate hematology analyzers that perform automated leukocyte
differential counts and consider the visual leukocyte differential count as the
gold standard."

**Assessment.** The 200-cell peripheral blood target (URS-105) now rests on a
held, open-access, peer-reviewed primary citation rather than on general
secondary summaries. H20-A2's own scope is the evaluation of analysers, with
the manual differential as the reference method it is measured against; this
application is a manual counting aid and is not an instrument H20-A2 governs.

**Purchasing H20-A2 is therefore not required for the current requirement set.**
It would become necessary if the project were to claim conformance to the
reference method itself — for example if the two-observer workflow deferred in
URS §6 were implemented — because the procedural detail of that method is not
reproduced in [S8].

**One item remains genuinely unresolved:** the NRBC reporting convention
implemented under DCR-006 is not stated in either [S8] or [S9]. It rests on
laboratory haematology practice literature. [S8] supports the underlying
principle — nucleated red cells are identified as a population distinct from
leucocytes, by absence of CD45 and low forward scatter — but does not state the
reporting rule. See §3.9.

---

## 3. What [S1] Establishes (full text verified)

### 3.1 The nucleated differential count — cell categories

ICSH §2.6 states the NDC "should comprise blast cells, promyelocytes,
myelocytes, metamyelocytes, band forms, segmented neutrophils, eosinophils,
basophils, mast cells, promonocytes and monocytes, lymphocytes, plasma cells
and erythroblasts."

The shipped `consensus-14` profile implements this list exactly:

| ICSH category | Profile cell type |
|---------------|-------------------|
| blast cells | `blasts` |
| promyelocytes | `pro` |
| myelocytes | `myelo` |
| metamyelocytes | `meta` |
| band forms | `bands` |
| segmented neutrophils | `poly` |
| eosinophils | `eos` |
| basophils | `baso` |
| mast cells | `mast` |
| promonocytes and monocytes | `mono` |
| lymphocytes | `lymph` |
| plasma cells | `plasma` |
| erythroblasts | `nrbc` |

Verified programmatically; see test suite 12.

### 3.2 Cells that must be EXCLUDED from the NDC

ICSH §2.6: "The NDC should **not** include megakaryocytes, macrophages,
osteoblasts, osteoclasts, stromal cells, smudged cells or non-haemopoietic
cells such as metastatic tumour cells. Lymphoid aggregates, if present, should
not be included in the NDC, but their presence should be commented upon."

**Design consequence.** The `other` category in the shipped profile is the only
category with no ICSH counterpart. It carries a real risk of being used to
tally exactly the cells ICSH excludes, which would silently make the
differential non-conformant — the counted cell enters the denominator and
depresses every reported percentage. See RA-001 HA-090.

The mitigation is documentary and interface-level, not arithmetic: the category
carries guidance stating what must not be counted into it, and the excluded
cell types are named in the operator guide. Findings such as metastatic tumour
cells or lymphoid aggregates belong in the morphology comment, which is
reproduced in the report.

### 3.3 Target cell counts — a conditional rule, not a single number

ICSH §2.6:

> "At least **500 cells** should be counted in at least **two smears** when a
> precise percentage of an abnormal cell type is required for diagnosis and
> disease. At least **300 cells** should be counted if the NDC is not essential
> to the diagnosis."

This corrects an attribution error in URS-105, which cited "CAP recommendation"
for the 500-cell default. The source is [S1], and the recommendation is
conditional on diagnostic intent. [S5] independently found 300-cell counts
diagnostically non-inferior to 500 across 165 cases, including 100% sensitivity
for AML at the 20% myeloblast threshold — consistent with the ICSH 300-cell
provision.

The "at least two smears" element is a specimen-handling instruction and is
outside the scope of a counting aid; it belongs in SOP-001.

### 3.4 Increasing the count near a diagnostic threshold

ICSH §2.6:

> "To reduce imprecision from sampling error, the total number of cells counted
> in the NDC should be increased, by counting in another smear, or counted by a
> second observer, if the abnormal cell count is very close to a critical
> threshold for disease stratification or to a low threshold (e.g. 5%) or when
> the appearance suggests a patchy involvement of the BM with abnormal cells."

**Implemented under DCR-008 (URS-038).** This is the clinical need behind the
stakeholder request that produced URS-042 (Continue Counting): *"an option,
AFTER getting to the result tab, to have a button that allows us to go back to
counting if we realize that the resulting percentages are borderline."*

Continue Counting supplied the mechanism; the system now also identifies when it
should be used. A profile defines diagnostic thresholds, and where the
confidence interval for a quantity spans one, the results screen states so and
points at the control. "Very close to a critical threshold" is given an
operational meaning: the interval straddles it, so the count does not establish
which side the true value lies on.

The advisory is informational. ICSH describes extending the count as a
recommendation, and URS-041 already established that this application does not
block completion — a paucicellular aspirate may make an extended count
impossible, and the operator is the one who knows that.

### 3.5 The M:E ratio definition

ICSH §2.6:

> "The myeloid:erythroid (M:E) ratio should be calculated by expressing the
> ratio of all granulocytes and monocytes and their precursors (i.e.
> myeloblasts, promyelocytes, myelocytes, metamyelocytes, band forms, segmented
> neutrophils, eosinophils, basophils, promonocytes and monocytes) to
> erythroblasts (at all stages of differentiation)."

The shipped formula matches this set exactly (verified programmatically).
Lymphocytes, plasma cells, mast cells and `other` are correctly excluded.

**This settles a genuine ambiguity.** A widely taught alternative convention
excludes monocytes from the numerator. Both are in use. The shipped profile
follows ICSH; a laboratory using the alternative can express it in
configuration. Because the two produce materially different ratios from the
same counts, the convention in force must be visible rather than implied — the
formula therefore carries a `basis` citation surfaced in the report (module M2).

**Known limitation.** ICSH's NDC list says "blast cells" but its M:E numerator
says "*myeloblasts*". The profile has a single generic `blasts` category, so in
a case with lymphoid blasts those blasts are included in the M:E numerator
where ICSH would exclude them. A laboratory needing that distinction should
configure separate myeloid and lymphoid blast categories. Recorded in RA-001 as
HA-091.

### 3.6 Report content

ICSH §2.6 requires that "the total number of cells counted in the NDC should be
stated in the report" — implemented; every output template resolves `{{total}}`
and the count is carried in every export.

ICSH Table 3 lists the full BM aspirate report contents. Most of it (patient
demographics, requesting physician, iron stain, cellularity, conclusion) is
outside the scope of a counting aid and belongs to the laboratory's reporting
system. The elements within scope — specimen identifier, nucleated differential
cell count, total cells counted, M:E ratio — are all present in output.

---

## 4. Software Safety Classification Basis

ICSH §1 states that "a comprehensive diagnosis of a BM disorder often requires
the integration of various diagnostic approaches", listing PB counts and smear
evaluation, aspirate smear, particle clot section, trephine biopsy and imprint
morphology, cytochemistry, immunophenotyping, cytogenetics, molecular genetics,
biochemistry and microbiology, and states that "the final interpretation should
be in the context of clinical and preliminary diagnostic findings."

This is the documented, citable basis for the IEC 62304 software safety
classification recorded in DHF-001 §3.1: the differential count produced by
this tool is one input among many and is never the sole determinant of a
diagnosis.

---

## 5. Requirement Gaps Identified From the Literature

### 3.7 Sampling precision (module M4)

A differential count is a sample. The observed percentage carries binomial
sampling error that is large at the counts used in practice, and proportionally
largest for the rare populations that carry the most diagnostic weight.

The application reports a **Wilson score interval** for each percentage. The
obvious alternative, the Wald normal approximation, is rejected: its coverage is
poor precisely where this application needs it — small denominators and
proportions near zero — and it produces impossible negative lower bounds. Two
blasts in 200 cells gives a Wald lower bound below zero, which would be worse
than reporting nothing. [S7] documents this and recommends Wilson, which is
bounded within [0,1] by construction. Verified in suite 01, VV-CI-002.

Two consequences are worth stating plainly, because both are visible in the
shipped behaviour:

- **A zero count bounds rather than excludes.** Zero blasts in 200 cells gives
  an upper bound near 1.9%. That is a real statement about what the count has
  ruled out, and the application now makes it.
- **A 200-cell count does not resolve the 20% blast threshold.** An observed 20%
  at 200 cells carries a 95% interval of 15.0–26.1%, which spans the cutoff. At
  500 cells it is 16.7–23.7% — narrower, and still spanning. This is not a
  defect in the tool; it is the statistical reality that ICSH §2.6 addresses by
  directing that the count be extended near a critical threshold. The
  `intervalSpans()` primitive added in this module is the test for that
  condition, and is the foundation for the near-threshold prompt deferred to
  module M5.

### 3.8 What [S4] actually warns about

Rümke's 1985 title is *"The imprecision of the ratio of two percentages observed
in differential white blood cell counts: a warning."* The subject is **ratios**,
not single percentages — and the M:E ratio this application computes is exactly
such a ratio.

A ratio of two counted proportions inherits the sampling error of both, and is
materially less precise than either. The application displays the M:E ratio to
one decimal place, which implies a precision the underlying count does not
support. An interval for a ratio requires Fieller's theorem or a bootstrap and
is **not** computed in this module; the display instead carries an advisory
stating that the ratio is less precise than the percentages it derives from.
Recorded as RA-001 HA-093 and deferred to a future module.

The primary text of [S4] is not held. The statistical claim above is standard
and does not rest on it, but the specific tabulated values Rümke published
should be checked against the paper before any of them are quoted.

---

### 3.9 Quantified limitations of manual differential counting ([S8])

[S8] compared manual morphology against flow cytometry and hematology
analysers across four institutions and 616 samples. Its findings are the
strongest evidence base available to this project for what a manual
differential can and cannot resolve, and they are the substance of the
user-facing limitations documentation (`web/methods.html`).

| Finding | Quotation |
|---------|-----------|
| Rare populations are imprecise by morphology | "Blasts or progenitors correlated well by both morphology and flow cytometry when large populations were present (> 10% or > 1 cell/μL), but **below this level suffer from the large degree of imprecision primarily with morphology due to the small number of cells counted**." |
| Blast reproducibility | "blast cells showing the largest value at just over 15%" coefficient of variation |
| Immature granulocytes are definitionally unstable | "Immature granulocytes showed greatest variability between all three methods... and **the lack of a traceable standard for what are arbitrary morphologic features**." |
| Band vs segmented is observer-dependent | "the relatively small number of immature granulocytes counted by morphology and possibly the **high variation between morphologists in differentiating band and segmented neutrophils**" |
| Basophils correlate poorly | "very poor correlation, in part due to the relatively small number of basophils counted by morphology" |
| Manual review remains the clinical method | The flow reference method's "intended use... is not that of clinical practice, as it presents significant cost barriers." |

These are limitations of *manual differential counting as a method*, not of this
application. The application's contribution is to make them visible — the
confidence intervals added under DCR-007 quantify precisely the imprecision
[S8] describes for low-frequency populations, and the near-threshold advisory
added under DCR-008 flags when that imprecision leaves a diagnostic question
unresolved.

**Design consequence.** [S8] confirms that the band/segmented distinction and
the immature granulocyte categories carry observer-dependent variability that no
counting aid can remove. This is stated to the user rather than left implicit,
and it is an argument for the aggregated-category support already in the schema:
a laboratory that does not trust the band/segmented split can configure a single
combined category and count what it can reliably distinguish.

---

| Gap | Source | Status |
|-----|--------|--------|
| No prompt to extend the count when an abnormal percentage sits near a diagnostic threshold | [S1] §2.6 | **Closed** — URS-038, module M5, DCR-008 |
| Target count rule is unconditional; ICSH makes 500 vs 300 depend on diagnostic intent | [S1] §2.6 | **Open** — profiles should offer both with the rule stated |
| `other` category has no ICSH counterpart and may capture cells ICSH excludes | [S1] §2.6 | **Partially addressed** — guidance added; see RA-001 HA-090 |
| Generic `blasts` category cannot distinguish myeloblasts for M:E purposes | [S1] §2.6 | **Documented limitation** — RA-001 HA-091 |
| No confidence interval on reported percentages | [S4] | **Closed** — module M4, DCR-007 |
| No interval on the M:E **ratio**, which is what [S4] actually warns about | [S4] | **Open** — needs Fieller or bootstrap; advisory shown meanwhile (HA-093) |
| No comparison against published normal ranges for the NDC | [S1] §2.6 | Out of scope — requires age-stratified reference data |
| Reference method is two observers × 200 cells | [S2] | Out of scope (URS §6, Phase 2) |

---

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| D | 2026-08-05 | QMS | Added [S8] (Hedley 2025, ICSH WBC reference method) and [S9], both open access and held in full text. §2.1 added: CLSI H20-A2 resolved without purchase — its specification is quoted in [S8]. §3.9 added: quantified limitations of manual differential counting, for user-facing documentation. |
| C | 2026-08-05 | QMS | §3.4 updated: the ICSH §2.6 near-threshold direction is implemented under URS-038 (DCR-008) and the gap is closed. §5 revised. |
| B | 2026-08-05 | QMS | Added [S7] (Brown, Cai & DasGupta) as the basis for choosing Wilson over Wald. Added §3.7 sampling precision and §3.8 on what Rümke's warning actually concerns — ratios, not single percentages, which makes the M:E display the affected element. |
| A | 2026-08-05 | QMS | Initial issue. ICSH 2008 [S1] verified against full text; counting model, M:E definition and target counts traced to source. Sources not held in full text explicitly marked. |

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
