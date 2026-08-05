# DCR-006: Design Change Record — Denominator Policy (module M1)

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-006 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-05 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Module** | M1 of the standards-review plan |
| **Profile Version** | consensus-14 2.0 → 2.1 |

---

## 1. Change Summary

The shipped peripheral blood profile counted nucleated red cells into the
percentage denominator of the leucocyte differential. NRBC are enumerated
alongside the leucocytes but are not leucocytes: convention is to report them
as a count per 100 WBC and to correct the WBC count for them.

The effect is a systematic understatement of every reported leucocyte
percentage, in proportion to how many NRBC are present:

| 180 leucocytes + 20 NRBC | Before | After |
|---|---|---|
| Segmented neutrophils | 60.00% | **66.67%** |
| Lymphocytes | 20.00% | **22.22%** |
| Nucleated RBC | 10.00% *of all cells* | **11.1 per 100 WBC** |
| Report opening | "A 200-cell differential count" | "A 180-cell differential count" |

The error was invisible: the percentages remained internally consistent and
summed to 100, so nothing in the output gave a reviewer cause to question them.
It was largest in precisely the conditions that produce nucleated red cells —
haemolysis, myelophthisis, marrow infiltration, neonatal samples.

Recorded as **HA-092**, pre-mitigation RPN 64 (High).

**Bone marrow is unaffected and was already correct.** ICSH 2008 §2.6 places
erythroblasts inside the nucleated differential count, so they belong in the
marrow denominator. This is why the fix is a per-profile policy and never a
global rule.

---

## 2. Approach

The schema gains two optional fields per specimen type, rather than a
hard-coded NRBC rule:

```json
"denominatorExcludes": ["nrbc"],
"per100Reporting": { "nrbc": { "label": "NRBC per 100 WBC", "precision": 1 } }
```

This keeps the design commitment that institutional variation is expressed in
configuration. A laboratory that reports NRBC differently, or that has another
category outside its differential, can say so without a code change.

### 2.1 Engine

| Function | Behaviour |
|----------|-----------|
| `getTotal(counts)` | unchanged — all cells tallied |
| `getDenominator(counts, exclude)` | **new** — the population percentages are computed over |
| `percentagesSummingTo100(counts, decimals, {exclude})` | excluded categories return `null`; the remainder still sum to exactly 100 |
| `computePer100(counts, ct, exclude, precision)` | **new** — returns `null` on a zero denominator so the caller renders N/A rather than dividing by nothing |

### 2.2 Reporting

`{{total}}` is now the differential denominator, because "a 200-cell
differential count" means 200 cells were classified into the percentages being
reported. `{{totalCounted}}` gives the overall tally, and
`{{<cellType>_per100}}` carries an excluded category. With no exclusions the
two totals are equal, so no existing profile changes behaviour.

The target count, progress indicator and low-count advisory now measure the
differential rather than the tally — the target expresses a number of
classified cells (SYS-183).

Absolute counts are not derived for an excluded category: NRBC are not a
fraction of the WBC population, so no absolute count follows from a WBC.

### 2.3 Interface

The counting grid shows an excluded category as `11.1/100` rather than a
percentage, and the grand total reads `180 + 20` with a tooltip naming what sits
outside the differential — so the operator can see that both numbers exist and
which is which.

---

## 3. Profile Version

`consensus-14` is bumped **2.0 → 2.1**. This is deliberate and load-bearing:
the version comparison added under DCR-004 (SYS-108) is what carries the
corrected profile to a browser holding the old one. A laboratory running its own
profile with a different `profileId` is not touched, and must apply the same
change itself — see §6.

Tests that pinned the literal `'2.0'` now read the shipped value instead, since
the version is expected to change whenever a default is corrected.

---

## 4. Verification

477 unit and behavioural tests, 138 system tests across Chromium, Firefox and
WebKit. 0 failures, 3 documented engine-specific skips.

| Layer | Tests |
|-------|-------|
| Unit | VV-DEN-001 to VV-DEN-006 — exclusion arithmetic, per-100 reporting, report text, marrow unaffected, advisory measured against the differential, zero-denominator guard |
| Behaviour | TC-B100 to TC-B107 — grid percentages, per-100 display, split grand total, progress, sum-to-100 with an exclusion, finalized report, absolute-count suppression, marrow unchanged |
| System | VV-SYS-100 to VV-SYS-102 — the corrected differential in three real browsers |

---

## 5. Standards Position

The bone marrow behaviour is verified against ICSH 2008 full text (REF-001
[S1], suite 12).

**The peripheral blood convention rests on secondary sources.** CLSI H20-A2
governs the reference leucocyte differential and is not held (REF-001 [S2]).
The change implements the convention as described in laboratory haematology
references and analyser documentation, and is clinically well established, but
**this requirement should be re-verified against H20-A2 when the standard is
obtained.** It is recorded as an open item in DCR-005 §5 and REF-001 §2.

---

## 6. Deployment Note

A laboratory running a customised profile keeps its own `profileId` and will
therefore **not** receive this correction automatically. Such profiles should be
reviewed: any peripheral blood profile that lists a nucleated red cell category
among its counted types, without `denominatorExcludes`, is reporting diluted
leucocyte percentages. This belongs in the release notes and in SOP-001.

---

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
