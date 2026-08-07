# DCR-031: Design Change Record — Greek Subset for the Product Name, and a Self-Referential Drift

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-031 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Document Owner; drift found during preparation of a manuscript about this machinery |
| **Closes** | DRIFT-LOG incident 24 |

---

## 1. The Product Cannot Set Its Own Name

`WBC ΔΣ` contains U+0394 and U+03A3. Both are Greek.

DCR-030 bundled the `latin` and `latin-ext` subsets and recorded the exclusion
of Greek as a deliberate, cosmetic trade-off affecting free-text comments. That
reasoning was sound for comments and wrong about one thing it did not consider:
**the product's own name**. Any rendered `WBC ΔΣ` would take its two most
distinctive characters from whatever face the workstation happened to have.

Investigating produced a finding that changes the shape of the fix:

> **Libre Franklin — the wordmark face — has no Greek subset at all.** Google
> serves `latin`, `latin-ext`, `cyrillic`, `cyrillic-ext` and `vietnamese` for
> it, and no Greek exists upstream. The mark cannot be set in its own typeface.

So "add the Greek subset to the wordmark font" is not available. What is
available, and is what was done:

1. **`inter-greek.woff2` is bundled** (19 KB). Inter does carry Greek, covering
   U+0384–U+03FF, which includes both characters.
2. **The wordmark stack names Inter explicitly**, in all four places it appears:
   `'Libre Franklin', 'Inter', sans-serif`. The Latin letters still come from
   Libre Franklin; only the two Greek characters fall through, and they now fall
   through to a font that ships with the application rather than to the system.

`greek-ext` (U+1F00–1FFF) is polytonic and ancient Greek and is not bundled.

Verified in Chromium: with `WBC ΔΣ` in the wordmark, the browser requests
`inter-greek.woff2` from the local origin and nothing else, and the mark renders
complete.

---

## 2. The Drift-Control System's Own Summary Had Drifted

`CLAUDE.md` opened with:

> "It records **21** occasions on which this file claimed something that had
> stopped being true. **Sixteen** were introduced by sessions doing correct
> work."

`DRIFT-LOG.md` had twenty-three rows. DCR-030 appended rows 22 and 23 and did
not sweep `CLAUDE.md`.

This is incident 24, and it is the sharpest one in the file, because
`CLAUDE.md` principle 2 is *no live document may state a measured fact from
memory* and the paragraph stating it did exactly that. The closure sweep in its
own §3 ended at "update `DRIFT-LOG.md`" — nothing pointed back at the document
giving the instruction.

It was found during preparation of a manuscript about this machinery, which
would otherwise have described a drift-control system from a summary that had
drifted — on the claim a reader is most likely to check.

### What was done

**The counts are removed from `CLAUDE.md`, not corrected.** A number that
drifted once will drift again; the remedy principle 2 prescribes is to point at
the source. The paragraph now says so explicitly, and names the incident.

**`DRIFT-LOG.md` §4 names the exceptions instead of counting the majority.** It
said "Sixteen of the twenty-one"; it now says "all but three — rows 10, 11 and
14". That form does not go stale when a row is appended, which is the property
the previous wording lacked.

**`DRIFT-LOG.md` §1 keeps its totals**, because they are now checked against its
own rows rather than remembered.

**The closure sweep gains a ninth step: `CLAUDE.md` itself.** It is swept last
and is the step easiest to skip, because by then it has stopped feeling like a
document.

---

## 3. Verification

| Case | What it holds |
|---|---|
| **SC-064** | A bundled face covers Greek, its `unicode-range` includes U+0394 and U+03A3, and every wordmark stack routes to that family before reaching the system |
| **QC-027** | `DRIFT-LOG.md` states its own totals correctly against its rows; incident numbering is sequential with no gap or duplicate; and no other live document states a drift-incident count at all |

Both revert-checked, QC-027 three ways: restoring the stale count to
`CLAUDE.md`, staling the log's own total, and duplicating an incident number.

**Two of this record's own tests were wrong before the code was**, and the
revert-check found both.

`SC-063` derived a family name by stripping `-latin(-ext).woff2`, so
`inter-greek.woff2` invented a family called "inter-greek" and demanded a
licence file for it. It now matches against an explicit list of subsets and
fails loudly on a filename that ends in none of them, rather than inventing a
family or silently skipping one.

`SC-064` excluded `'` from the character class scanning the font stack, so it
read `'Libre Franklin',` and reported a fall-through that was not there. That is
the fifth occasion in this file where removing a fix proved the test wrong
before it proved the code wrong, and the argument for doing it every time.

---

## 4. Risk

No change to any calculation, counted value or workflow.

`CACHE_VERSION` → `wbcds-v2.18.0`, and the Greek face is precached: a
workstation that has never been online must receive it with everything else.

One observation worth recording rather than acting on: **no rendered text in the
application currently contains Δ or Σ.** They appear in `<title>` elements,
which browser chrome renders in a system font regardless, and in source
comments. The visible mark is the SVG lockup. This change is therefore
anticipatory — it makes the product name *settable* in text without a
typographic surprise. That is the honest description of its value.

No preset, schema field, rounding method or CI level was removed.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. `inter-greek.woff2` bundled and precached; wordmark stack in counter/editor/help routed through Inter; Libre Franklin confirmed to have no Greek upstream. Incident 24 logged; counts removed from `CLAUDE.md`; DRIFT-LOG §4 restated to name exceptions; closure sweep gains step 9. SC-064, QC-027. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
