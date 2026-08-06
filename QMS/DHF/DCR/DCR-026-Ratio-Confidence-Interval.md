# DCR-026: Design Change Record — Confidence Interval for a Derived Ratio

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-026 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; **clinical review invited, see §6** |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` G-2 |
| **Closes** | RA-001 HA-093; REF-001 §3.8 open gap |

---

## 1. What Was Missing

Rümke's 1985 paper is titled *"The imprecision of the ratio of two percentages
observed in differential white blood cell counts: **a warning**."* Its subject is
ratios, not single percentages — and the M:E ratio is exactly such a ratio.

The application displayed it to one decimal place with a prose advisory saying
it was imprecise. `REF-001` §3.8 identified this precisely, recorded it as
`HA-093`, and deferred it on the grounds that an interval "requires Fieller's
theorem or a bootstrap".

Every percentage on the results screen carried an interval. The one figure
Rümke actually warned about did not.

---

## 2. The Framing Is What Makes This Exact

The ratio uses two disjoint groups drawn from a single count. Conditioning on
the number of cells that fall in **either** group removes the rest of the
differential as a nuisance parameter, and what remains is one binomial:

> m = M + E — cells in the ratio at all
> p = M / m — the proportion of those that are myeloid
> **M:E = M / E = p / (1 − p)** — the **odds** of p

So an interval for the ratio is the **odds transform of an interval for a
proportion**, and the proportion interval is the Wilson score interval this
engine already computes and `REF-001` §3.7 already defends on the basis of [S7].
The transform is monotonic, so the bounds map directly. No new statistical
machinery, and no new method to justify.

### Why not the two methods the review suggested

| Method | Why rejected |
|--------|--------------|
| **Fieller's theorem** | Degenerates when the denominator is not significantly different from zero, producing an unbounded or complement interval that cannot be displayed sensibly. A marrow with no erythroid cells is precisely the case a clinician most wants bounded |
| **Parametric bootstrap** | Stochastic. The same count would give a slightly different interval on each run. That is not acceptable for a figure entering a patient record, and it would make the reproducibility of a report depend on a random seed |

The review proposed the bootstrap as "the cheapest correct route". The odds
framing is cheaper, deterministic, and exact under the conditional model.

---

## 3. What the Reader Now Sees

The same count, scaled:

| Cells in the ratio | M:E displayed | 95% interval |
|---|---|---|
| 300 | 2.3:1 | 1.8–3.0 |
| 30 | 2.3:1 | 1.1–5.0 |
| 10 | 2.3:1 | 0.7–8.3 |

An identical displayed ratio in all three rows. At 30 cells it is compatible with
anything from mild erythroid predominance to marked myeloid predominance.

That is Rümke's warning made legible rather than asserted. The prose advisory is
**retained alongside** it, because the interval quantifies sampling error and the
advisory also covers the non-random distribution of cells on a smear, which no
interval addresses.

### Boundaries

- **No erythroid cells.** The upper bound is reported as ∞, which is true — the
  ratio is unbounded above — while the lower bound stays finite and informative.
  This is the case Fieller handles worst.
- **No myeloid cells.** The lower bound is 0 and the upper is small but non-zero.
  It is shown to two significant figures rather than rounded to `0.0`, because
  "0.0–0.0" would assert a certainty the count does not have.
- **Nothing counted.** Returns null; nothing is displayed.

The interval is governed by the same `confidenceIntervals` setting as the
percentages: a profile that suppresses one suppresses both.

---

## 4. Verification

| ID | Verifies |
|----|----------|
| VV-ME-010 | The interval is exactly the odds transform of the Wilson interval, and rests on the cells *in* the ratio rather than the total |
| **VV-ME-011** | **The same ratio is far less precise at a smaller count** — Rümke's warning, as an assertion |
| VV-ME-012 | The ratio is relatively less precise than the percentages behind it |
| VV-ME-013 | With no erythroid cells the upper bound is ∞ and the lower stays finite |
| VV-ME-014 | With no myeloid cells the bound is shown, not rounded to zero |
| VV-ME-015 | Undefined and non-ratio cases return null rather than throwing |
| VV-ME-016 | The interval narrows monotonically as the count grows |
| VV-SYS-201/202 | The interval appears beside the ratio, and widens at a tenth of the count |
| VV-SYS-203 | A profile with intervals disabled shows none |
| UD-094 | Every figure in the published table is engine-produced |

Revert-checked: removing the display fails VV-SYS-201 and 202; breaking the odds
transform fails VV-ME-010 and 011.

**630 Node + 389 system = 1019 passing, 0 failures, 7 documented skips.**

---

## 5. Documents Updated

- `REF-001` §3.8 — the deferral replaced by the derivation, with the table above
  and the reasoning for rejecting Fieller and the bootstrap.
- `RA-001` HA-093 — **closed**, residual 3.
- `calculation-reference.html` §3 — the operator-facing explanation, including
  what ∞ means and why the same ratio can be reported with very different
  precision.

---

## 6. For Clinical Review

The engineering position is that the conditional-binomial framing is standard
and the arithmetic is verified against the Wilson interval already in use. Two
points are for a haematopathologist rather than an engineer:

1. **Whether conditioning on M + E is the right model** for this ratio, as
   against treating the two counts as independent Poisson variables. The
   conditional model is the usual treatment for a ratio of two cells of one
   multinomial and is what makes the interval exact; a reviewer may still prefer
   the alternative.
2. **Whether displaying the interval changes how the ratio is read** in a way
   that is helpful. It is wide — that is the point — and a wide interval beside a
   familiar figure may invite either appropriate caution or unwarranted doubt.

The primary text of [S4] (Rümke) is still not held. The statistical claim does
not rest on it, but the specific tabulated values Rümke published should be
checked against the paper before any are quoted.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. `ratioInterval` via the odds transform of the Wilson interval; displayed beside each ratio; HA-093 closed; REF-001 §3.8 and the Calculation Reference updated. VV-ME-010–016, VV-SYS-201–203, UD-094. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **invited — see §6** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
