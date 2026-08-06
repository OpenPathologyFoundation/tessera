# WBC ΔΣ — Calculation Reference

**Every number this tool produces: how it is calculated, why, what the
alternatives are, where the controversy lies, and how to change it.**

Peter Gershkovich, M.D., M.H.A. · info@openpathology.tech
Version 1.0 · 2026-08-05 · Applies to product v2.7.0

---

## Who this is for

A pathologist who is not a haematopathologist, and who wants to know exactly
what the arithmetic is doing before trusting it or before deciding what their
laboratory should configure. Every abbreviation is expanded on first use. No
software knowledge is assumed.

**The governing principle of this tool:** where haematology practice genuinely
disagrees, the tool does not pick a winner. It ships a documented default, makes
the alternative selectable, and states in every report which one produced the
numbers. Where you see a **Configurable** box below, that is a decision your
laboratory owns, not one the software has made for you.

---

## Abbreviations used

| Short form | Expansion |
|---|---|
| **WBC** | White blood cell (leucocyte) |
| **RBC** | Red blood cell (erythrocyte) |
| **NRBC** | Nucleated red blood cell — an immature red cell that still has a nucleus, normally confined to marrow but appearing in blood in certain conditions |
| **M:E ratio** | Myeloid-to-erythroid ratio |
| **NDC** | Nucleated differential count — the marrow differential, as defined by ICSH |
| **BM** | Bone marrow |
| **PB** | Peripheral blood |
| **CBC** | Complete blood count |
| **LIS** | Laboratory information system |
| **ICSH** | International Council for Standardization in Haematology |
| **CLSI** | Clinical and Laboratory Standards Institute |
| **CAP** | College of American Pathologists |
| **WHO** | World Health Organization (here, its tumour classification) |
| **ICC** | International Consensus Classification (of myeloid neoplasms, 2022) |
| **AML** | Acute myeloid leukaemia |
| **MDS** | Myelodysplastic syndrome |
| **CI** | Confidence interval |
| **CV** | Coefficient of variation — a measure of reproducibility |

---

## 1. The differential percentage — the core calculation

### What it is

You classify cells one at a time. The tool tallies them and expresses each
category as a proportion of a total.

```
percentage of category X  =  (cells counted as X ÷ denominator) × 100
```

Everything else in this document is a consequence of two questions: **what goes
in the denominator**, and **how the result is rounded**.

### 1.1 What goes in the denominator

This is not a trivial question and it is the source of the most clinically
consequential difference between laboratories.

**Bone marrow.** The denominator is every nucleated cell you counted, including
erythroid precursors (developing red cells). This is the ICSH definition of the
nucleated differential count. Erythroid cells belong in a marrow differential
because assessing the balance between red-cell production and white-cell
production is a large part of why the marrow is being examined at all — that
balance is the M:E ratio, discussed in §3.

**Peripheral blood.** The denominator is the leucocytes only. Nucleated red
cells are counted, but they are **excluded from the denominator** and reported
separately as *NRBC per 100 WBC*.

#### Why NRBC are handled differently in blood

In a healthy adult, nucleated red cells do not circulate: they lose their
nucleus before leaving the marrow. When they appear in blood it is a pathological
finding — severe haemolysis, marrow infiltration by tumour, severe hypoxia, or
normally in the newborn.

They are not leucocytes. A leucocyte differential is a statement about the
composition of the white cell population, and putting a red cell precursor into
that denominator dilutes every leucocyte percentage.

There is a second, practical reason. Automated haematology analysers historically
counted NRBC as white cells, so the reported white count needed correcting:

```
corrected WBC = uncorrected WBC × 100 ÷ (100 + NRBC per 100 WBC)
```

That correction formula requires NRBC expressed *per 100 WBC*, not as a
percentage of all nucleated cells. Reporting them the other way makes the
correction arithmetic wrong.

#### What the difference looks like

A blood film where you count 180 leucocytes and 20 nucleated red cells:

| | NRBC in the denominator | NRBC excluded (this tool) |
|---|---|---|
| Denominator used | 200 | **180** |
| Segmented neutrophils (120 counted) | 60.0% | **66.7%** |
| Lymphocytes (40 counted) | 20.0% | **22.2%** |
| Monocytes (15 counted) | 7.5% | **8.3%** |
| Nucleated red cells | 10.0% | **11.1 per 100 WBC** |
| Report opens | "A 200-cell differential" | **"A 180-cell differential count"** |

Every leucocyte percentage is understated by about 10% relative when NRBC sit in
the denominator, and the error grows with the NRBC count. In a newborn or a
patient with marrow infiltration, where NRBC can exceed the leucocytes, the
distortion becomes severe.

> **Controversy and honesty about the evidence.** The convention itself is not
> seriously disputed in laboratory haematology. What I can and cannot cite is:
> the CLSI H20-A2 reference method specifies two observers counting 200 cells
> each, which is quoted verbatim in an open-access ICSH paper I hold. The ICSH
> flow cytometry reference method treats nucleated red cells as a population
> distinct from leucocytes, identified by absence of the CD45 antigen. Neither
> source states the *reporting rule* in words. **This is the weakest citation in
> the whole design file, and it is flagged for clinical corroboration.**

> **Configurable.** `denominatorExcludes` — any category can be counted but kept
> out of the denominator. `per100Reporting` sets how it is then expressed. A
> laboratory that wants NRBC inside the denominator simply omits both.

### 1.2 How the result is rounded

Percentages rarely divide evenly. Three cells out of nine is 33.333…%. Report
that to the nearest whole number for three equal categories and you get 33 + 33 +
33 = 99%, not 100%.

This bothers people, and laboratories resolve it differently. **The tool offers
all three approaches** because each has a defensible rationale, and because
forcing one would be exactly the kind of hidden decision this document exists to
eliminate.

Take fourteen categories with ten cells each — every category truly 7.14%:

| Policy | Result | Total | Worst single-category error |
|---|---|---|---|
| **Largest remainder** *(default)* | twelve at 7%, two at 8% | **100%** | 0.86 points |
| **Largest count** | thirteen at 7%, one at **9%** | **100%** | **1.86 points** |
| **Independent** | all at 7% | **98%** | 0.14 points |

**Largest remainder** (also called the Hare method, from its use in allocating
parliamentary seats): every value is rounded down, then the leftover units are
handed out one at a time to whichever categories were closest to rounding up. It
totals 100% and no category is ever displaced by more than one unit of the last
decimal shown. This is the default.

**Largest count**: the entire rounding difference is added to whichever category
has the most cells. It also totals 100%, and it is simple to describe — which is
why some laboratory procedures specify it. Its weakness is visible above: one
category reads 9% when its true value is 7.14%. In a report where a single
percentage is compared against a diagnostic cut-off, that matters.

**Independent**: each percentage is rounded on its own merits and the total is
whatever it is. Individually this is the most faithful; its cost is a report
that visibly does not sum to 100%, which some clinicians read as an error.

> **Controversy.** There is no standard that dictates this. It is a reporting
> policy. My own view — and the reason for the default — is that a forced 100%
> is what readers expect, and largest remainder achieves it with the least
> distortion of any individual number. But a laboratory whose procedure specifies
> otherwise should be able to follow its own procedure.

> **Configurable.** `rounding`: `"largest-remainder"` | `"largest-count"` |
> `"independent"`. Whichever is chosen is stated in the report's method note, so
> a reader can tell why the figures total what they do.

### 1.3 How many decimal places

Displayed percentages default to two decimal places; the generated report
defaults to whole numbers, because that is how most institutional report
templates are written.

> **Configurable.** `precision`: `{ "display": 2, "report": 0 }`, each 0 to 4.

---

## 2. How many cells to count

### The trade-off

Counting more cells gives a more precise answer and takes more time. Because
counting is sampling, the precision improves only with the square root of the
number counted: quadrupling the count halves the uncertainty.

### The published guidance

**Bone marrow — 500 cells.** ICSH 2008 §2.6 states: *"At least 500 cells should
be counted in at least two smears when a precise percentage of an abnormal cell
type is required for diagnosis and disease. At least 300 cells should be counted
if the NDC is not essential to the diagnosis."*

Note that the guidance is **conditional**, which is often lost when it is quoted.
The 500-cell figure applies when a precise abnormal percentage matters — for
example when the blast count will be compared against the 20% threshold. When
the differential is supporting information rather than the diagnostic question,
300 is explicitly sufficient.

An *American Journal of Clinical Pathology* study in 2018 compared 300-cell
against 500-cell counts across 165 cases and five technologists. It found no
statistically significant difference for any cell type, and 100% sensitivity for
acute myeloid leukaemia at the 20% blast threshold. This supports the ICSH
300-cell provision rather than contradicting the 500.

**Peripheral blood — 200 cells.** The CLSI H20-A2 reference method is two
independent observers counting 200 cells each.

> **Controversy.** The two-observer element of the reference method is almost
> never done in routine practice — it is a reference procedure for evaluating
> analysers, not a clinical workflow. This tool implements the single-observer
> count. A two-observer mode with comparison of independent counts is a
> documented future item, not a current capability.

> **Configurable.** `targetCount` per specimen type. The target is **advisory
> and never enforced**: you can finish at any count above zero. Finishing below
> target produces a note stating the precision your count actually achieved
> rather than blocking you, on the reasoning that a paucicellular aspirate may
> make a longer count impossible and the operator is the one who knows that.

---

## 3. The myeloid-to-erythroid ratio

### What it is

The ratio of white-cell precursors to red-cell precursors in the marrow. It
answers: is this marrow making proportionally too much of one lineage? A ratio
of 2:1 to 4:1 is conventionally normal. A raised ratio suggests myeloid
expansion or erythroid failure; a lowered ratio suggests the reverse.

It is always interpreted alongside overall cellularity, because a ratio is a
proportion and says nothing about absolute quantity. A marrow can have a normal
M:E ratio and be profoundly hypocellular.

### How this tool calculates it

Following ICSH 2008 §2.6 exactly:

```
        myeloblasts + promyelocytes + myelocytes + metamyelocytes
        + band forms + segmented neutrophils + eosinophils
        + basophils + promonocytes + monocytes
M:E =  ─────────────────────────────────────────────────────────────
        erythroblasts at all stages of differentiation
```

Lymphocytes, plasma cells and mast cells take no part in either the numerator or
the denominator. They are neither myeloid nor erythroid.

### The controversy — and it is a real one

**ICSH includes monocytes and their precursors in the numerator. A widely taught
alternative excludes them.**

The argument for exclusion is developmental purity: some hold that "myeloid" in
this ratio should mean the granulocytic series specifically, and that monocytes,
though myeloid in lineage, are a separate line of development. The argument for
inclusion — ICSH's position — is that monocytes are myeloid by derivation and
that the ratio is meant to capture total granulocytic-plus-monocytic production
against red-cell production.

Both conventions are taught. Both appear in textbooks. They give different
numbers from identical counts:

| Marrow: 150 segmented neutrophils, 60 monocytes, 90 erythroblasts | M:E |
|---|---|
| ICSH convention (monocytes included) | **2.3:1** |
| Alternative convention (monocytes excluded) | **1.7:1** |

That difference can move a marrow across the boundary of what a reader considers
normal. Comparing an M:E ratio against another laboratory's, or against your own
from before a change of convention, is meaningless unless both used the same
rule.

> **Configurable.** Both conventions ship as selectable presets:
> `consensus-14` (ICSH, the default) and `consensus-14-me-alt` (excluding
> monocytes). The numerator and denominator are simply lists of categories, so
> any other convention can be expressed. **Every report states which convention
> produced its ratio**, precisely because the two are not comparable.

### A precision warning specific to ratios

A ratio of two counted proportions carries the sampling error of **both**, and is
therefore substantially less precise than either percentage alone. This is the
subject of Rümke's 1985 paper, titled — pointedly — *"The imprecision of the
ratio of two percentages observed in differential white blood cell counts: a
warning."*

The tool displays the ratio to one decimal place because that is conventional,
but it carries an advisory that small differences between successive ratios
should not be over-read. **A confidence interval for the ratio is not computed**:
doing so correctly requires Fieller's theorem or a bootstrap procedure, which is
documented as outstanding work rather than approximated badly.

---

## 4. Confidence intervals — what the range beside each percentage means

### The idea

You counted 200 cells from a film containing millions. Had you counted a
different 200 cells from the same film, you would have obtained a somewhat
different answer. That variation is not error in the sense of mistake — it would
occur for a perfect observer — it is the arithmetic consequence of sampling.

A confidence interval expresses it. When the tool shows **15.0–26.1%** beside an
observed 20%, it means: given 40 blasts in 200 cells, true values across roughly
that range are consistent with what was observed.

**It is not** a measure of whether you identified the cells correctly. It cannot
detect a misclassification.

### The numbers, and why the blast threshold matters

95% confidence intervals at the counts used in practice:

| Observed | 100 cells | 200 cells | 500 cells |
|---|---|---|---|
| 20% | 13.3–28.9% | **15.0–26.1%** | 16.7–23.7% |
| 5% | 2.2–11.2% | 2.7–9.0% | 3.4–7.3% |
| 1% | 0.2–5.4% | 0.3–3.6% | 0.4–2.3% |
| 0% | 0–3.7% | 0–1.9% | 0–0.8% |

Two rows deserve attention.

**The 20% row.** The 20% blast figure separates acute myeloid leukaemia from
myelodysplastic syndrome in the classifications that use it. At 200 cells an
observed 20% carries an interval from 15.0% to 26.1% — it *spans the threshold*.
The count does not establish which side of that line the true value falls on. At
500 cells the interval narrows to 16.7–23.7% and still spans it. This is not a
deficiency of this software; it is the statistical reality of counting cells, and
it is why ICSH directs that the count be extended near a critical threshold.

**The 0% row.** Counting zero blasts in 200 cells does **not** exclude blasts. It
places them below roughly 1.9%. Reporting a bare "0%" overstates what was
established.

### Why this method and not the obvious one

The textbook formula for a proportion's confidence interval is the **Wald
interval**: `p ± 1.96 × √(p(1−p)/n)`. This tool does not use it, deliberately.

The Wald interval performs badly exactly where haematology needs it — small
counts, and proportions near zero, which is to say rare populations near
diagnostic cut-offs. For 2 blasts in 200 cells it returns:

```
Wald:    −0.38%  to  2.38%
```

A negative lower bound for a blast percentage is not a rounding artefact; it is a
result that cannot be put in front of a clinician. The tool uses the **Wilson
score interval**, which is bounded within 0–100% by construction and behaves
sensibly at zero counts. For the same 2 blasts in 200 cells it returns 0.3% to
3.6%.

This is not a fringe view: Brown, Cai and DasGupta's review in *Statistical
Science* (2001) documents the Wald interval's coverage failures at length and
recommends Wilson for exactly these conditions.

> **Not configurable, and why.** The interval method is fixed at Wilson. Offering
> Wald as an option would be offering a method that produces impossible values
> in this tool's characteristic case. The *confidence level* is configurable —
> 90%, 95% or 99% — and interval display can be switched off entirely.

> **Configurable.** `confidenceIntervals`: `{ "enabled": true, "level": 0.95 }`.

---

## 5. The near-threshold advisory

When a confidence interval spans a diagnostic threshold your laboratory has
configured, the results screen says so, names the threshold and its basis, and
points at the Continue Counting control.

The reasoning is the ICSH direction quoted earlier: *extend the count when an
abnormal percentage is very close to a critical threshold.* "Very close" had no
operational definition until the interval supplied one — **an interval that
straddles the threshold means the count has not settled the question.**

Two deliberate limits on this behaviour:

- **It never blocks you.** It is advisory, for the same reason the target count
  is advisory.
- **It does not promise resolution.** Counting more narrows the interval but
  need not resolve the threshold: a true value sitting exactly on the line
  straddles it at any count. The advisory states the situation; it does not claim
  that more counting will settle it.

> **Configurable.** `thresholds`: a list, each with a target category, a
> percentage value, a label and a citable basis. The shipped defaults are the
> 20% blast threshold (WHO 2022 / ICC 2022), a 5% low blast threshold (the value
> ICSH names as an example), and 10% plasma cells. **These are defaults, not
> clinical instruction** — a laboratory should review them against its own
> reporting practice. Configuring no thresholds disables the advisory.

---

## 6. Blast percentage: of what, exactly?

A subtlety that has changed within the last few years and still causes confusion.

Historically, in marrows with heavily expanded erythropoiesis, blasts were
expressed as a percentage of **non-erythroid** cells — the erythroid precursors
were removed from the denominator. This was the WHO erythroleukaemia rule.

**WHO 2022 withdrew that rule.** Blasts are now counted as a percentage of all
nucleated cells.

The two can differ enormously. Take a marrow of 500 nucleated cells: 300
erythroid precursors, and 200 non-erythroid cells of which 45 are blasts.

| Convention | Blast percentage |
|---|---|
| Of all nucleated cells (WHO 2022, current) | **9.0%** |
| Of non-erythroid cells (pre-2022) | **22.5%** |

The same slide falls on opposite sides of the 20% boundary depending on which
rule is applied. This tool reports blasts as a percentage of all nucleated cells,
matching current practice.

> **Configurable.** A subset percentage can be defined as an additional reported
> figure — a numerator group over a denominator group of your choosing. The
> `legacy-9` preset demonstrates it, reporting both figures side by side for
> comparison against historical results. Because a subset percentage has a real
> denominator count, it also carries a confidence interval, and it can be given a
> diagnostic threshold of its own.

---

## 7. Which cells belong in the count at all

ICSH 2008 §2.6 defines the marrow nucleated differential count as: blast cells,
promyelocytes, myelocytes, metamyelocytes, band forms, segmented neutrophils,
eosinophils, basophils, mast cells, promonocytes and monocytes, lymphocytes,
plasma cells, and erythroblasts. The shipped default implements exactly this
list, and an automated test holds it there.

**ICSH explicitly excludes** from the count: megakaryocytes, macrophages,
osteoblasts, osteoclasts, stromal cells, smudged (lysed) cells, and
non-haemopoietic cells such as metastatic tumour cells. Lymphoid aggregates
should be commented on but not tallied.

The reason matters: a cell counted into any category enters the denominator. Tally
a smudged cell or a tumour cell and every reported percentage falls slightly —
including the blast percentage being compared against a threshold. Because the
totals remain internally consistent, nothing on the screen reveals the error.

The default profile offers an "other" category, which invites exactly this
mistake. Its mitigation is guidance on hover naming the excluded cell types, and
direction to record such findings in the morphology comment, which is reproduced
in the report.

> **Configurable.** The category list is entirely yours. A laboratory that
> considers "other" too risky can remove it. `categoryNotes` attaches scope
> guidance to any category.

---

## 8. Known limitations of manual differential counting

These are limitations of the method, not of this software. They are stated
because a number on a screen looks equally confident whether or not it is
reliable. The quantified findings come from a four-institution ICSH study of 616
samples comparing manual morphology against flow cytometry and analysers
(Hedley et al., 2026).

| Limitation | The evidence |
|---|---|
| **Rare populations are the least reliable** | Blasts correlated well above roughly 10%, but below that suffered *"a large degree of imprecision primarily with morphology due to the small number of cells counted"*. Blasts showed the largest reproducibility variation of any category, a coefficient of variation just over 15%. This is exactly the range where diagnostic thresholds sit. |
| **Band versus segmented neutrophil is observer-dependent** | Variability is attributed partly to *"high variation between morphologists in differentiating band and segmented neutrophils"*. |
| **Immature granulocyte categories lack a standard** | *"The lack of a traceable standard for what are arbitrary morphologic features."* Two competent morphologists may legitimately disagree. |
| **Basophils are counted in numbers too small to be precise** | Poor correlation between methods, *"in part due to the relatively small number of basophils counted by morphology"*. |
| **The smear itself introduces error** | Non-uniform cell distribution, staining quality, and dysplastic features affecting identification all act before counting begins. ICSH recommends counting across at least two smears where a precise abnormal percentage matters. |

A practical consequence worth acting on: if your laboratory does not rely on the
band/segmented distinction, **configure a single combined granulocyte category**.
Counting what can be distinguished reliably is better than splitting what cannot.

---

## 9. What the software does not do

- **No cell recognition.** Every classification is yours. Press the wrong key and
  it records the wrong cell; nothing in it can detect that.
- **No diagnostic decision.** It reports thresholds your laboratory configured;
  it does not interpret them.
- **No confidence interval for the M:E ratio** (§3).
- **No two-observer reference workflow** (§2).
- **No absolute counts without your input** — absolute counts are computed only
  when you supply a white cell count from the analyser, and are not derived for
  categories outside the differential.

---

## 10. Summary: what is chosen versus what is fixed

| Decision | Status | Default |
|---|---|---|
| Cell categories | **Configurable** | ICSH 2008 §2.6, fourteen categories |
| Keyboard mapping | **Configurable** | Left-hand ergonomic |
| Target cell count | **Configurable** | BM 500, PB 200 |
| Denominator: which categories count | **Configurable** | BM all; PB excludes NRBC |
| Per-100 reporting | **Configurable** | NRBC per 100 WBC in blood |
| Rounding policy | **Configurable** | Largest remainder |
| Decimal precision | **Configurable** | Display 2, report 0 |
| M:E numerator and denominator | **Configurable** | ICSH, monocytes included |
| Additional subset percentages | **Configurable** | None by default |
| Diagnostic thresholds | **Configurable** | 20% and 5% blasts, 10% plasma cells |
| Confidence level, and whether shown | **Configurable** | 95%, shown |
| Report wording | **Configurable** | Three institutional templates |
| **Confidence interval method** | **Fixed** | Wilson score — §4 |
| **That percentages derive from counted cells** | **Fixed** | — |

---

## References

1. Lee S-H, Erber WN, Porwit A, Tomonaga M, Peterson LC, for the International
   Council for Standardization in Haematology. **ICSH guidelines for the
   standardization of bone marrow specimens and reports.** *International Journal
   of Laboratory Hematology* 2008;30(5):349–364.
2. Hedley BD, Keeney M, Gambell P, Qu C, Mao J, Davis BH, Wood BL. **White Blood
   Cell Enumeration and Differential by Flow Cytometry: The ICSH WBC Reference
   Method.** *International Journal of Laboratory Hematology* 2026;48(1):93–101.
   Open access.
3. Clinical and Laboratory Standards Institute. **H20-A2: Reference Leukocyte
   (WBC) Differential Count (Proportional) and Evaluation of Instrumental
   Methods**, 2nd edition. Wayne, PA: CLSI; 2007.
4. Rümke CL. **The imprecision of the ratio of two percentages observed in
   differential white blood cell counts: a warning.** *Blood Cells*
   1985;11(1):137–140.
5. Brown LD, Cai TT, DasGupta A. **Interval estimation for a binomial
   proportion.** *Statistical Science* 2001;16(2):101–133.
6. **Is a 500-Cell Count Necessary for Bone Marrow Differentials?** *American
   Journal of Clinical Pathology* 2018;150(1):84–89.
7. **WHO Classification of Haematolymphoid Tumours**, 5th edition, 2022; and the
   **International Consensus Classification**, 2022.
8. Comar SR, Malvezzi M, Pasquini R. **To follow or not to follow the
   recommendations regarding microscopic analysis of the CLSI H20-A2 to validate
   the criteria for blood smear review?** *Revista Brasileira de Hematologia e
   Hemoterapia* 2015;37(1):69–70. Open access.

---

*WBC ΔΣ is a counting and calculation aid for trained laboratory personnel. It
performs no cell identification and makes no diagnostic decision. Any laboratory
deploying it should validate it locally under its own quality management system.*
