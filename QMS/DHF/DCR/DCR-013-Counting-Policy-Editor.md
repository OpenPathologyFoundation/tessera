# DCR-013: Design Change Record — Counting Policy Editor

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-013 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Closes** | DCR-012 §9 first item; URS-102 clause (g) |
| **Requirements added** | SRS-001 SYS-240 to SYS-243 |
| **Verification** | VV-SYS-065 to VV-SYS-069, UD-039 |

---

## 1. What This Completes

DCR-010 made the rounding method, the decimal precision and the
myeloid-to-erythroid convention selectable rather than fixed, on the principle
the Document Owner set out:

> "these choices should not be you know forced on them but rather selectable
> like everything else in this tool"

DCR-012 then found that "selectable" meant *selectable in a JSON file*. The
Configuration Editor had no control for any of it, and §9 of that record left
the gap open. This closes it.

> "build the editor controls"

---

## 2. Also Closes a Requirement That Was Never Implemented

URS-102 clause **(g)** requires the editor to let the operator *"define derived
formulas"*. It never did — `buildConfigJSON()` wrote `formulas: {}`. RTM-001
nonetheless recorded URS-102 as **Full** coverage.

That is a traceability defect, not merely a missing feature: the matrix
asserted verification of something no test exercised and no code performed. The
row now traces to SYS-240–243 and to VV-SYS-065–069, and records that clause
(g) was previously unimplemented.

---

## 3. The Counting Policy Panel

A new panel in the editor, applying to the specimen type selected at the top,
so a laboratory can hold different conventions for marrow and blood — which is
the normal case, since NRBC belong in the marrow differential and not in the
blood one.

| Group | Controls | Field |
|-------|----------|-------|
| **Percentages** | Rounding policy, with the consequence of each stated; decimals on screen; decimals in the report; confidence interval on/off and level | `rounding`, `precision`, `confidenceIntervals` |
| **Differential denominator** | One row per displayed category: exclude from the denominator, and when excluded, the per-100 label and its precision | `denominatorExcludes`, `per100Reporting` |
| **Diagnostic thresholds** | Repeatable: target, percentage, name, and the citation shown to the operator | `thresholds` |
| **Derived figures** | Repeatable: identifier, label, ratio or percentage, precision, numerator and denominator membership, citation | `formulas` |

The M:E ratio is therefore no longer a fixed property of the profile a
laboratory happened to start from. Its numerator membership is a set of
checkboxes, and the ICSH question — whether monocytes belong in it — is
answered by ticking a box rather than by choosing a different preset.

---

## 4. Safe by Construction

`Core.validateConfig` rejects several combinations. Rather than let the
operator compose one and fail on save, the controls prevent them:

| Rule in the schema | How the panel enforces it |
|---|---|
| The denominator cannot be emptied of every category | The last remaining category's checkbox is disabled |
| A category reported per 100 must be outside the denominator | One checkbox drives both; excluding a category creates its per-100 entry, unexcluding removes it |
| A threshold target must have a percentage to test | Targets are drawn from the categories still inside the denominator, plus percentage formulas. Excluding a category deletes any threshold on it |
| Formula members must be key-mapped cell types | Membership is chosen from displayed categories, which the schema already requires to be mapped |
| Precision is a whole number 0–4 | Inputs clamp on change |
| The confidence level must be one the engine holds a z-score for | A select of 90 / 95 / 99% |

SYS-243 states this as a requirement; VV-SYS-069 verifies it.

---

## 5. Verification

Each test drives the control and then checks **the counter**, not the saved
file. A control that writes correct JSON but does not change the count would
pass a round-trip test and still be useless.

| ID | Drives | Verifies |
|----|--------|----------|
| **VV-SYS-065** | Excluding NRBC from the peripheral blood denominator | 180 segmented + 20 NRBC reports 180 cells, segmented at 100.00%, NRBC per 100 — instead of 200 cells and dilution |
| **VV-SYS-066** | Rounding to independent, precision to 0 | Three equal categories report 33/33/33, not 33/33/34 |
| **VV-SYS-067** | Adding a threshold on segmented neutrophils at 50% | The results screen raises the advisory, naming the label typed into the editor |
| **VV-SYS-068** | Removing monocytes from the M:E numerator | 150 segmented + 60 monocytes over 90 erythroid reports **1.7**, not 2.3 |
| **VV-SYS-069** | Excluding a category that carries thresholds | The thresholds are removed, the category disappears from the target list, and the counter accepts the profile |
| **UD-039** | — | The Calculation Reference's account of where each setting lives matches the editor source, in both directions |

**Regression detection confirmed** by removing each write-back in turn rather
than assumed:

| Removed | Detected by |
|---------|-------------|
| `rounding` write-back | VV-SYS-066 |
| `denominatorExcludes` write-back | VV-SYS-065, VV-SYS-069 |
| `thresholds` write-back | VV-SYS-067, VV-SYS-069 |
| `formulas` write-back | VV-SYS-068 |
| The threshold-clearing guard on exclusion | VV-SYS-069 |

UD-039 is worth noting on its own. Written under DCR-012 to assert the editor
had **no** such controls, it failed the moment they were added — which is what
it was for. It now asserts the opposite, in both directions, so the page cannot
drift from the editor again in either.

**Totals: 585 Node + 266 system = 851 passing, 0 failures, 7 documented skips.**

Contrast on the new panel is covered by the existing full-surface sweep
(VV-SYS-168) and passes in both themes.

---

## 6. What This Change Does Not Address

- Five descriptive fields remain reachable only by editing the exported JSON:
  `constituents`, `categoryNotes`, `targetCountBasis`, `requireCaseNumber` and
  `provenance`. None of them changes a reported number; the Calculation
  Reference names them and says where they are set.
- Adding a derived figure prompts for an identifier. A laboratory that invents
  one will not find it referenced by any shipped report template until the
  template is edited to use it.
- The panel constrains its inputs, but a profile imported as JSON can still
  express a policy the panel would not have produced. That profile is validated
  on import, and the panel renders it faithfully, including a threshold target
  it would not itself offer — shown as "(not available)" rather than silently
  dropped.
- Whether a vendor profile correction should override local clinical
  configuration remains the open question recorded in DCR-012 §9.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. Counting Policy panel; SYS-240–243; VV-SYS-065–069; UD-039 inverted; URS-102 clause (g) closed and its traceability corrected. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
