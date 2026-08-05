# DCR-008: Design Change Record — Derived Quantities and Thresholds (module M5)

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-008 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-05 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Module** | M5 of the standards-review plan |
| **Profile Version** | consensus-14 2.2 → 2.3; legacy-9 2.0 → 2.1 |

---

## 1. Change Summary

Two related capabilities, both about expressing clinical convention in
configuration rather than in code.

**Subset percentages.** The formula engine could express only ratios. It can now
express one group of categories as a percentage of another — principally blasts
as a percentage of non-erythroid cells, the pre-2022 WHO erythroleukaemia rule.

**Diagnostic thresholds.** A profile can declare thresholds with a citable
basis. Where the confidence interval for a quantity spans one, the results
screen says so. This closes the ICSH §2.6 gap that the standards review recorded
as open under DCR-005.

---

## 2. Why Subset Percentages Matter

The two blast conventions disagree, and the disagreement is largest exactly
where it matters. From the shipped `legacy-9` preset, a marrow with expanded
erythropoiesis — 300 erythroid precursors, 45 blasts, 200 other cells:

| Convention | Result |
|------------|--------|
| Blasts of **all nucleated cells** (WHO 2022) | **9.0%** |
| Blasts of **non-erythroid cells** (pre-2022 WHO) | **22.5%** |

The same slide falls on opposite sides of the 20% AML boundary depending on the
rule applied. WHO 2022 withdrew the non-erythroid rule, but laboratories still
report it when comparing against historical results — and a system whose central
design claim is that institutional variation lives in configuration must be able
to express both. Verified by VV-SUB-002 and VV-SYS-125.

A subset percentage has a real denominator count, so unlike a ratio it carries a
confidence interval (REF-001 §3.8). That is what makes it eligible as a
threshold target.

---

## 3. Why the Threshold Advisory Matters

ICSH 2008 §2.6:

> "To reduce imprecision from sampling error, the total number of cells counted
> in the NDC should be increased... if the abnormal cell count is very close to
> a critical threshold for disease stratification or to a low threshold
> (e.g. 5%)."

DCR-005 recorded this as implemented nowhere. The obstacle was that "very close"
had no operational definition. The confidence intervals added under DCR-007
supply one: **an interval that spans the threshold means the count does not
establish which side of it the true value lies on.**

The results screen now states, for each such case, the quantity, its interval,
the threshold, the basis, and points at Continue Counting.

This closes a loop that began with a stakeholder request. URS-042 exists because
a pathologist asked for *"an option, AFTER getting to the result tab, to have a
button that allows us to go back to counting if we realize that the resulting
percentages are borderline."* Continue Counting supplied the mechanism; the
system can now also say **when** the percentages are borderline, and on what
basis.

### 3.1 Deliberately non-blocking

Consistent with URS-041 and the stakeholder feedback behind it. A paucicellular
aspirate may make an extended count impossible, and the operator is the one who
knows that. VV-SYS-121 and TC-B121 assert that completion is never prevented.

### 3.2 What the advisory does not promise

VV-THR-003 pins an important honesty property: extending the count narrows the
interval but need not resolve the threshold. An observed value sitting exactly
on the threshold straddles it at any count. The advisory therefore states the
situation and offers the control; it never claims that counting more will settle
the question.

---

## 4. Scope

- **Engine**: `computeSubsetPercentage()`, `computeFormula()` (type dispatch),
  `evaluateThresholds()`. Validation extended for formula types, numerator
  containment, and threshold targets.
- **Interface**: formula rendering generalized from the hardcoded M:E ratio to
  every formula the profile defines — the previous behaviour contradicted the
  design claim that configuration carries institutional practice. New
  near-threshold advisory on the results screen.
- **Profiles**: `consensus-14` gains thresholds (AML 20%, low blast 5%, plasma
  cell 10%). `legacy-9` gains the non-erythroid blast formula and both blast
  thresholds — its natural home, being the profile for legacy conventions.
- **Session**: `formulaResults` and `thresholds` archived.

### 4.1 Backward compatibility

A formula with no declared `type` is a ratio, so every profile written before
this revision behaves exactly as before (VV-SUB-004). The DOM id for a formula
value changed from `val-me-ratio` to the general `val-formula-<name>`; four test
references were updated.

---

## 5. Risk Position

| Hazard | Change |
|--------|--------|
| **HA-094** count accepted as settling a question it cannot settle | **New.** Pre-RPN 48, residual 12. Occurrence unchanged — extending a count remains a clinical judgement — but detection improves from Low to Certain. |

---

## 6. Verification

522 unit and behavioural tests, 162 system tests across Chromium, Firefox and
WebKit. 0 failures, 3 documented engine-specific skips.

| Layer | Tests |
|-------|-------|
| Unit | VV-SUB-001 to 007, VV-THR-001 to 008 |
| Behaviour | TC-B120 to B127 |
| System | VV-SYS-120 to 123, VV-SYS-125 |

**A defect in the E2E suite was found and fixed while writing it**: assertions
compared `innerText` against source-case label text, but a real browser applies
the `uppercase` CSS transform to `innerText` while jsdom does not. The tests
passed at the behaviour layer and failed at the system layer — the layers
disagreeing is the point of having both.

---

## 7. Open Items

| Item | Note |
|------|------|
| Thresholds are evaluated at results only | Not during counting, where the operator's attention is on the microscope. A live indication may be worth offering as a configurable option; deferred pending user feedback. |
| Ratios cannot be threshold targets | No interval is computed for a ratio (HA-093). Validation rejects the configuration rather than failing silently. |
| Shipped thresholds are defaults, not clinical instruction | The values in `consensus-14` carry a basis field naming their source. A laboratory is expected to review them against its own reporting practice. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
