# DCR-023: Design Change Record — Display Consistency and Editor Cascade

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-023 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` P0-7, P0-10 |
| **Closes** | The last two P0 defects from that review |

---

## 1. P0-7 — Removing a Category Left the Policy Pointing At It

Dragging a chip out of the layout removed it from `categories` and `outCodes`
and nothing else. `denominatorExcludes`, `per100Reporting`, `thresholds` and the
membership of `formulas` all kept naming it.

`validateConfig` then refused the profile on save, correctly, with:

> `denominatorExcludes names 'nrbc', which is not a displayed category`

The validator was right. The **editor** had left the profile inconsistent and
made the operator work out why a category they had just deleted was being
complained about.

`forgetCategory()` now removes what depended on the category in the same action:
the denominator exclusion, the per-100 entry, any threshold targeting it, and its
membership in every formula's numerator and denominator.

This is the same cascade already applied when a category is *excluded* from the
denominator (DCR-013), which deletes thresholds that would then have nothing to
test. The two are the same principle: the editor keeps the profile consistent
rather than leaving validation to explain the wreckage.

---

## 2. P0-10 — Displayed Figures Did Not Reconcile

### 2.1 Subtotals were an independent calculation

Row subtotals were computed as `(rowTotal / denominator) × 100` and rounded on
their own, while the cells above them went through the profile's rounding
policy. Two approximations of the same quantity, rounded separately.

They usually agree, which is why this survived. When they do not, **the reader
who adds up the column is right and the footer is wrong**:

> 1 plasma, 2 segmented neutrophils, 5 lymphocytes at whole-number precision.
> Plasma displays **12%**, so the upper row is 12%.
> One eighth computed independently is 12.5%, which rounds to **13%**.

The subtotal is now the **sum of the displayed cell percentages**. The invariant
that matters on a differential is that the row reconciles with the cells in it
and the two rows account for the whole count; a subtotal that is separately
"more accurate" but visibly inconsistent is worth less than one that adds up.

A category outside the differential has no percentage and simply does not
contribute; its count is reported per 100 instead.

### 2.2 Session history ignored the precision the count used

The history modal hard-coded `toFixed(2)` while the session already carried
`displayPrecision`, which the results screen honoured. A profile set to whole
numbers therefore showed `33.00%` in history and `33%` everywhere else, for the
same count.

---

## 3. Verification

| ID | Verifies |
|----|----------|
| VV-SYS-200 | Removing a category removes its denominator exclusion, per-100 entry, thresholds and formula membership — and the profile still saves |
| **VV-SYS-197** | Each row subtotal equals the sum of the cells displayed in it, at whole-number precision |
| VV-SYS-198 | The same at two decimal places |
| VV-SYS-199 | Session history reports at the precision the count used |

### The first version of VV-SYS-197 did not discriminate

It used three categories with one cell each — 33 / 33 / 34 — and **passed
against the broken code**. The extra unit happened to land in the upper row, so
the sum of the cells and the independent calculation coincided at 67%.

That is the normal case, not the exception: both methods approximate the same
quantity and differ only where the accumulated remainder crosses a boundary. An
arbitrary count proves nothing here.

The engine was searched for counts where the two genuinely disagree — **353 of
them** among small counts at 0 and 2 decimal places — and the test now uses one.
With the fix reverted it reports `Expected: 12, Received: 13`, which is the
defect exactly.

Revert-checked: dropping `forgetCategory` makes VV-SYS-200 fail with the
original validation message; restoring the independent subtotal calculation
fails VV-SYS-197; restoring `toFixed(2)` fails VV-SYS-199.

**616 Node + 380 system = 996 passing, 0 failures, 7 documented skips.**

---

## 4. What This Does Not Address

- Subtotals now reconcile with the cells shown. They are therefore the sum of
  rounded values, which can differ by a fraction of the last displayed place
  from the true row proportion. That is the deliberate trade: a differential is
  read by adding a column.
- The independent review is now closed on all ten P0 items. What remains from it
  is scientific framing (C-2, C-3, C-4), the M:E interval (G-2), and the 359
  tests carrying no verification identifier.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. `forgetCategory` cascade; subtotals as the sum of displayed cells; history honours session precision. VV-SYS-200, 197, 198, 199. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
