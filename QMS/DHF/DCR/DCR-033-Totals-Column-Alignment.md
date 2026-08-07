# DCR-033: Design Change Record — One Totals Column

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-033 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Document Owner — observed on the counting screen |
| **Traces** | URS-055 (results presentation) |

---

## 1. The Defect

Every figure that reports a total sat in a different column.

Each category row is rendered as its own `<table class="w-full">`, and a table
sized to fill its container divides that width by **its own** column count. A
row of four categories and a row of five therefore put their `Sub` column in
different places. The grand total and the derived formulas were not in a table
at all — `flex justify-between` pinned them to the container edge — so they
landed in a third position.

Measured on the shipped default at 1440 px before the change, the three centres
were roughly 40 px apart. The eye reads a column of totals as a column; three
near-misses read as a mistake, and on a screen whose whole job is to let an
operator glance at a number mid-count, that is not cosmetic.

**This is the normal case, not an edge case.** Most shipped profiles split
their categories unevenly — Legacy MDC is 4 and 5, Minimal 5-Part is 3 and 2 —
so the misalignment was visible in ordinary use, and grew with how uneven the
split was.

---

## 2. The Fix

One width, `TOTALS_COL = 8rem`, used by all three:

- Each row table gains a `<colgroup>` whose last `<col>` is fixed at that
  width, with `table-layout: fixed` so the category columns share what remains
  equally. The `Sub` column then lands in the same place whatever the row
  length.
- The grand total and every derived formula render their value into a
  `shrink-0` span of the same width, centred, with the label taking the
  remaining space — so they sit under `Sub` rather than against the container
  edge.

`min-width: 32rem` on the row tables preserves the horizontal scroll that
`overflow-x-auto` provides on a narrow viewport; `table-layout: fixed` would
otherwise clip rather than scroll.

The change is presentational. No count, percentage, ratio or report string is
affected.

---

## 3. Verification

| Case | What it holds |
|---|---|
| **VV-SYS-213** | The two subtotal centres and the grand-total centre coincide within 1 px, at 1440, 1024 and 820 px |
| **VV-SYS-214** | The same holds for an uneven 4/5 split (Legacy MDC), and the derived formula reports in the same column |

Measured from `boundingBox()` centres rather than eyeballed, with one pixel of
tolerance for sub-pixel rounding — the defect being caught was tens of pixels.
Confirmed at zero spread across three profiles (14, 9 and 5 categories) and two
viewport widths, on Chromium, Firefox and WebKit.

Revert-checked: with the `colgroup` and the fixed-width spans removed, all four
Chromium cases fail.

**A measurement error of my own, worth recording.** The first sweep across
profiles reported perfect alignment for all three — but its row selector was
`page.locator('div', { hasText: name }).locator('button:has-text("Load")').last()`,
and `hasText` matches every ancestor including the dialog itself, so `.last()`
clicked the bottom row every time. All three "profiles" were Legacy MDC. The
column counts in the corrected run (16, 11, 7) are what proved the profiles had
actually changed. This is the second time in two records that a `.last()` on a
`hasText` locator has silently tested the wrong thing; the assertion that the
confirmation dialog names the expected profile is now part of the helper.

---

## 4. Risk

No change to any calculation or to the shipped configuration. `HA-097` is not
engaged — no document claim changes.

The residual consideration is the fixed `min-width: 32rem`: a profile with very
many categories on a very narrow viewport now scrolls horizontally where it
previously compressed. That is the better failure — a compressed column of
two-digit counts is harder to read mid-count than a scroll — and it is what
`overflow-x-auto` was already there to provide.

No preset, schema field, rounding method or CI level was removed.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. `TOTALS_COL` shared by the row tables' last column, the grand total and every derived formula; `table-layout: fixed` with `min-width` to keep the narrow-viewport scroll. VV-SYS-213, VV-SYS-214. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
