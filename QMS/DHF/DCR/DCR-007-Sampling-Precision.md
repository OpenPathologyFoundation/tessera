# DCR-007: Design Change Record — Sampling Precision (module M4)

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-007 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-05 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Module** | M4 of the standards-review plan |
| **Profile Version** | consensus-14 2.1 → 2.2 |

---

## 1. Change Summary

The sub-target advisory introduced under DCR-004 read:

> *"216-cell count (target 500); statistical confidence reduced for populations
> <5%."*

It alluded to imprecision without stating any. A reader could not tell from it
whether the count was adequate for the question in front of them. This change
replaces the allusion with computed binomial confidence intervals, reported for
every differential percentage.

The same advisory now reads:

> *"216-cell count (target 500). At this count an observed 5% carries a 95%
> confidence interval of 2.8–8.8%."*

---

## 2. Why This Matters Clinically

Two results from the shipped implementation, both verified by test:

**A 200-cell count does not resolve the 20% blast threshold.** An observed 20%
carries a 95% interval of **15.0–26.1%**, which spans the AML diagnostic cutoff.
At 500 cells it narrows to 16.7–23.7% — and still spans it. This is not a defect
in the tool; it is the statistical reality that ICSH 2008 §2.6 addresses by
directing that the count be extended when an abnormal percentage sits near a
critical threshold. Until now the application gave the operator no way to see
that condition. (VV-CI-009)

**A zero count bounds rather than excludes.** Zero blasts in 200 cells yields an
upper bound near 1.9%. Reporting "0%" alone overstates what the count
established. (VV-CI-003)

---

## 3. Method

The **Wilson score interval** is used. The obvious alternative — the Wald normal
approximation, `p ± z·sqrt(p(1−p)/n)` — is rejected on the following grounds,
and the rejection is itself verified by test (VV-CI-002):

| | Wald | Wilson |
|---|---|---|
| 2 blasts in 200 cells | **−0.38% to 2.38%** | 0.3% to 3.6% |
| Coverage at small *p* | poor | good |
| Bounded within 0–100% | no | by construction |

A negative lower bound on a blast percentage is not a rounding artefact; it is a
result that cannot be shown to a clinician. Brown, Cai & DasGupta (*Statist Sci*
2001, REF-001 [S7]) document the Wald interval's coverage failures and recommend
Wilson. This application's characteristic case — small denominators, proportions
near zero — is exactly where the difference bites.

Intervals are computed from the raw count and the differential denominator
established under DCR-006, never from the rounded percentage.

---

## 4. What Rümke's Warning Actually Concerns

[S4] is titled *"The imprecision of the ratio of two percentages observed in
differential white blood cell counts: a warning."* The subject is **ratios**.

The M:E ratio this application computes is such a ratio, and it inherits the
sampling error of both proportions. Displaying "2.1:1" implies a resolution the
counts do not support, and invites comparison between successive marrow
examinations at that resolution.

An interval for a ratio requires Fieller's theorem or a bootstrap and is **not**
implemented here. The M:E display instead carries an advisory stating that the
ratio is less precise than the percentages it derives from and should be read
alongside cellularity and the trephine biopsy. Recorded as **HA-093**
(pre-RPN 18, residual 12) and deferred.

This is a case where reading the citation changed what the module needed to do:
the finding was not in the summaries.

---

## 5. Scope

- **Engine**: `wilsonInterval()`, `formatInterval()`, `intervalSpans()`,
  `cellsForPrecision()`; `buildLowCountNote()` now quantified.
- **Config**: `confidenceIntervals: { enabled, level }` per specimen type,
  validated against the supported levels.
- **Interface**: interval shown beside each percentage on the results screen —
  not during counting, where the operator's attention is on the microscope.
- **Export**: intervals, confidence level, differential denominator and
  exclusion list added to CSV.

### 5.1 Defect found while implementing

`differentialTotal` and `per100`, added to the session record under DCR-006,
**never reached the CSV export**. An archived peripheral blood record showed
`totalCount: 200` with no way to determine that the percentages were computed
over 180. The archive could not be reconstructed, contrary to URS-052. Corrected
here; `differentialTotal` and `denominatorExcludes` are now archived columns.

### 5.2 Boundary defect

A saturated count produced an upper bound of `99.99999999999999` through
accumulated floating-point error, which would have been displayed verbatim.
Bounds are now snapped to exact 0 and 100 within 1e-9. Found by VV-CI-004.

---

## 6. Risk Position

| Hazard | Change |
|--------|--------|
| **HA-030** insufficient cell count | Residual **24 → 12**. Occurrence unchanged — the target remains advisory by design (URS-041) — but detection improves from Low to Certain: the imprecision is printed beside each percentage rather than left to be inferred from the cell count. Residual Medium risks across the FMEA fall from 3 to 2. |
| **HA-093** ratio precision | **New.** Pre-RPN 18, residual 12, accepted pending a ratio interval. |

---

## 7. Verification

499 unit and behavioural tests, 147 system tests across Chromium, Firefox and
WebKit. 0 failures, 3 documented engine-specific skips.

| Layer | Tests |
|-------|-------|
| Unit | VV-CI-001 to 012 — known values, Wald comparison, zero and saturated counts, monotonic narrowing, level scaling, degenerate input, threshold straddling; VV-LOW-004 to 006 |
| Behaviour | TC-B110 to B116 — results display, differential denominator, quantified advisory, disable, level, CSV archive, zero count |
| System | VV-SYS-110 to 112 — intervals in the report, quantified advisory, bounded zero count |

---

## 8. Open Items

| Item | Note |
|------|------|
| **Rümke primary text not held** | The statistical method does not depend on it, but the tabulated values Rümke published should be checked before any are quoted. REF-001 [S4]. |
| Interval for the M:E ratio | Needs Fieller or bootstrap. HA-093 accepted meanwhile. |
| Near-threshold prompt | `intervalSpans()` is the primitive; the prompt itself is module M5, and would close the ICSH §2.6 gap recorded in REF-001 §5. |

---

## 9. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
