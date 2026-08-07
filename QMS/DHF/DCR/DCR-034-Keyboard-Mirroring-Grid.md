# DCR-034: Design Change Record — A Column Grid That Mirrors the Keyboard

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-034 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Document Owner — "should cells be aligned in general?" |
| **Traces** | URS-055 (results presentation) |
| **Extends** | DCR-033 (the totals column) |

---

## 1. The Question

DCR-033 aligned the totals column. It left the *category* columns ragged: the
upper and lower rows are separate tables, each filling the width, so a four-cell
row and a five-cell row place their cells differently. Should those align too,
with the shorter row padded at the end?

Both were built and looked at rather than argued about.

**In general, no.** The two rows hold different category sets. `BLASTS` above
`BASO` asserts a relationship that does not exist, and the cost is real: on the
worst shipped split — `legacy-9`, four above and six below — a shared grid
empties a third of the upper row and stops its rule in the middle of the table.
It reads as a table that failed to render, not as a deliberate gap. The cells
also narrow, and the counts are the largest, most glanceable element on a screen
built for glancing mid-count.

**In one case, yes,** and the case is not aesthetic. If a profile assigns its
keys along two **adjacent physical keyboard rows in left-to-right order**, then
column N of each display row is the same finger — A above Z, S above X, D above
C, F above V. The screen then mirrors the operator's hand, which is worth having
in a tool driven entirely by touch-typing.

---

## 2. What Decided the Scope

The first version of this argument was wrong, and checking it changed the
design.

The finger-mapping benefit was assumed to be general. Reading the shipped key
assignments showed it is not:

```
legacy-mdc     upper A S D F        lower Z X C V B     ← keyboard rows
consensus-14   upper B X R V C E W  lower D F Z G A S Q
harmonized-9   upper Z X B V C      lower F A G S D
body-fluid     upper D S G Z        lower F A X
```

**Only `legacy-mdc` qualifies** — it inherited its layout from the 2015
predecessor (DCR-032). Every other profile assigns keys by frequency
ergonomics, so its columns would line up with nothing. A rule applied to all of
them would have paid the cost everywhere and delivered the benefit once.

Hence the condition rather than a blanket change.

---

## 3. The Rule

`Core.keyboardGrid(spec)` returns a shared grid only when **all** hold:

1. Every category in each display row maps to a single-character key.
2. Each display row's keys lie on **one** physical keyboard row.
3. The lower row's physical row is **directly beneath** the upper's.
4. Within each row the keys run **left to right**.

Each condition exists to exclude a layout that would align cells to the wrong
finger — a row spanning two physical rows, a bottom row displayed above a home
row, or keys running right to left. When any fails it returns `null` and the
renderer falls back to filling the width.

The grid is indexed by **physical key position**, not by ordinal, so a profile
using A and F but not S or D leaves those slots empty rather than closing the
gap. Mirroring the keyboard means mirroring its holes too.

An unused slot renders as nothing — no rule, no border, no background — so it
reads as absence rather than as a category that failed to load.

The function lives in `wbc-core.js`, which is DOM-free, so the unit tests
exercise the shipped decision rather than a copy of it.

---

## 4. Verification

| Case | Layer | What it holds |
|---|---|---|
| **VV-KBD-001** | Unit | A S D F over Z X C V B qualifies, five columns, trailing slot empty |
| **VV-KBD-002** | Unit | Keys scattered across physical rows do not |
| **VV-KBD-003** | Unit | Same row, inverted rows, and two-rows-apart all rejected |
| **VV-KBD-004** | Unit | Right-to-left keys rejected — the fingers would not match |
| **VV-KBD-005** | Unit | An interior gap is preserved, not closed up |
| **VV-KBD-006** | Unit | A missing or multi-character key disqualifies |
| **VV-SYS-215** | System | On `legacy-mdc`, A sits above Z, S above X, D above C, F above V, and the row does not stretch to close the gap under B |
| **VV-SYS-216** | System | On `legacy-9` — frequency keys, 4/6 — no key sits above another, and the totals column stays aligned |

**VV-SYS-216 was vacuous when first written and the revert-check found it.** It
used the shipped default, which splits 7/7, so its "the rows differ" assertion
never executed: the test passed even with every profile forced onto a shared
grid. It now uses `legacy-9`, whose 4/6 split is the case the rule exists to
exclude, and asserts that **no** key in one row shares a column with any key in
the other. Forcing the grid on now fails it.

That is the second vacuous assertion this session — after a test that searched
for a stylesheet path and was satisfied by the comment explaining the path. Both
were found by removing the fix rather than by reading the test, which is the
argument for doing it every time, including for tests that assert an absence.
An absence needs the *inverse* check: not "does it fail without the fix" but
"does it fail when the wrong behaviour is forced".

---

## 5. Risk

No change to any calculation, count, percentage, ratio or report string. The
layout of eight of the nine shipped profile/specimen combinations is unchanged;
only `legacy-mdc` renders differently.

`HA-097` is not engaged — no document claim changes.

The consideration worth recording: a laboratory that edits `legacy-mdc`'s keys
in the Configuration Editor may cross the threshold in either direction, and the
layout will change under them without explanation. This is judged acceptable —
the change is a visual improvement in the direction of their own key choice, and
the alternative is a setting nobody would know to look for. It is the reason the
rule is a pure function of the configuration rather than a stored flag: there is
no state to get out of step with the keys.

No preset, schema field, rounding method or CI level was removed.

---

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. `Core.keyboardGrid` and its four conditions; the renderer shares a grid when a profile earns one and fills the width otherwise. VV-KBD-001..006, VV-SYS-215, VV-SYS-216. |

---

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
