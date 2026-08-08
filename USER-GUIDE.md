# WBC ΔΣ — User Guide

A keyboard-driven manual differential counter for haematology. Counting happens
entirely in your browser; no patient data leaves the machine.

> **Before relying on the numbers**, read
> [Methods and Limitations](web/methods.html) — how percentages, the M:E ratio
> and confidence intervals are calculated, which published standards they
> follow, and what a manual differential count can and cannot establish.

---

## Quick start

1. **Open the counter** in Chrome, Firefox or Edge. No installation.
2. **Enter the case/accession number** — type it or scan a barcode. The scanner's
   Enter keystroke starts the count. The field is optional by default; a profile
   may require it.
3. **Choose the specimen type.**
4. **Press keys to count.** Each key maps to a cell type; the mapping is shown
   under every column on screen. Counts and percentages update as you go.
5. **Shift + key** removes a cell if you miscount. It will not go below zero.
6. **Count Done** when you are finished — at any count, not only at target.
7. **Copy to Clipboard** pastes the formatted report into your LIS.

**Continue Counting** on the results screen returns you to counting with the
tally intact, so you can add cells after seeing the result. Use it when the
counter warns that a confidence interval spans a diagnostic threshold.

---

## Keyboard map

The mapping below is the shipped default profile. **Keys are configurable**, so
if your laboratory uses its own profile these may differ — the authoritative
mapping is always the one displayed beneath each column while counting.


### Bone Marrow — target 500 cells

| Key | Cell type |
|-----|-----------|
| B | Erythroid precursors (NRBC) |
| X | Blasts |
| R | Promyelocytes |
| V | Myelocytes |
| C | Metamyelocytes |
| E | Plasma cells |
| W | Mast cells |
| D | Band forms |
| F | Segmented neutrophils |
| Z | Basophils |
| G | Eosinophils |
| A | Monocytes |
| S | Lymphocytes |
| Q | Other (see note) |

### Peripheral Blood — target 200 cells

| Key | Cell type |
|-----|-----------|
| B | Erythroid precursors (NRBC) |
| X | Blasts |
| R | Promyelocytes |
| V | Myelocytes |
| C | Metamyelocytes |
| E | Plasma cells |
| W | Mast cells |
| D | Band forms |
| F | Segmented neutrophils |
| Z | Basophils |
| G | Eosinophils |
| A | Monocytes |
| S | Lymphocytes |
| Q | Other (see note) |

Left-handed by default, so the right hand stays on the microscope. A right-hand
mapping is one click in the Configuration Editor (*auto-assign right-hand
keys*); it is a key assignment rather than a separate profile.

**On "Other":** count only unclassifiable haemopoietic cells here. Megakaryocytes,
macrophages, osteoblasts, osteoclasts, stromal cells, smudged cells and
metastatic tumour cells are excluded from the differential by ICSH 2008 §2.6 —
counting them in lowers every reported percentage. Record them in the morphology
comment instead.

---

## Sound

The control in the header cycles three settings:

| Setting | What you hear |
|---|---|
| **Sound Off** | Nothing |
| **Click** | One short click per counted cell — the default |
| **Tones** | A distinct pitch for each category |

**Tones exist so you can hear *which* key registered without looking up.** A
click tells you a key was pressed; a tone tells you which one, so a hand that
has drifted one key across is audible immediately. You are not expected to learn
the pitches — only to notice when a press does not sound like the last fifty.

The pitch comes from the category's position in your profile, so it needs no
setting and cannot disagree with the layout on screen. Your choice lasts for the
session; a profile can set the default in the Configuration Editor.

Sound is always supplementary. The count and the on-screen flash are identical
in all three settings, so nothing is lost if audio is unavailable.

---

## What you will see on screen

| Element | Meaning |
|---------|---------|
| **Grand total** | Cells in the differential. Peripheral blood shows `180 + 20` when cells are counted outside it, such as NRBC. |
| **Progress bar** | Toward the configured target. Advisory — never blocks finishing. |
| **M:E ratio** | Live, per ICSH 2008 §2.6. Hover for the convention and its caveat. |
| **Percentage under each cell** | Of the differential denominator. Peripheral blood NRBC show as `11.1/100` — per 100 WBC, not a percentage. |
| **Interval on the results screen** | 95% confidence interval, e.g. `15.0–26.1%`. The precision your cell count achieved. |
| **Amber threshold warning** | The interval spans a diagnostic threshold: the count does not establish which side the true value is on. |

---

## Configuration

Everything clinical is configurable without touching the software: cell
categories, keys, target counts, derived formulas, diagnostic thresholds and
report wording.

- **Preset Profiles** — 14-Type Nucleated Differential, 10-Type — Bands+Segs Combined, 10-Type — Bands & Segs Separate, 5-Type — Analyzer Categories, Body Fluid — 7 Types, 9-Type — 2015 Counter Layout.
- **Configuration Editor** — build or adapt a profile visually.
- **Export / Import Config** — share a profile between workstations or colleagues.

A profile that cannot be counted with is rejected with the reason given, rather
than silently accepted.

Every report names the profile and version that produced it. If two reports
disagree, check that first.

### If you used the 2015 counter

**Preset Profiles → 9-Type — 2015 Counter Layout → Load.**

Your keys are unchanged: `A S D F` across the top, `Z X C V B` below, mapped to
the same cell types in the same order. Bone marrow still targets 200 cells and
peripheral blood 100, and the Yale SOM, Precipio DX and MGH report wordings are
the ones you know.

Three things are deliberately different, all of them corrections:

| | Old counter | Here |
|---|---|---|
| A cell seen once in 201 | reported `0%` | reported `0.5%` |
| The nine percentages | summed to 99 | sum to 100 |
| M:E ratio in the Precipio report | printed `_` | computed, with its interval |

**Read the profile's provenance before relying on it.** Its nine categories are
coarser than the ICSH standard the other profiles follow: one key covers
myelocytes, metamyelocytes, bands and segmented neutrophils together, another
covers promyelocytes and myelocytes, another basophils and mast cells. Peripheral
blood has no key for nucleated red cells at all, so this profile cannot report
NRBC per 100 WBC. A count taken here cannot be re-expressed against ICSH
categories without counting again. For new work, prefer **14-Type Nucleated
Differential**.

**To make it your laboratory's default**, load it, adjust anything you want in
the Configuration Editor, then **Export Config** and deploy that file as
`web/settings/templates.json` on your workstations. The shipped default stays
the 14-part consensus profile.

---

## Data and privacy

- Counting is local to your browser. Nothing is transmitted.
- Completed counts last for the browser session only, unless exported to CSV or JSON.
- An in-progress count is saved locally and offered for recovery if the browser
  closes unexpectedly; it is cleared when you finish or reset.
- Works offline once loaded.

---

## Scope

This is a counting and calculation aid for trained laboratory personnel. It
performs no cell identification and makes no diagnostic decision — every
classification is yours. Results should be reviewed and released under your
laboratory's quality management system.
