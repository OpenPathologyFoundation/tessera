This is an excellent wireframe. Really clean thinking. Let me decode what he's laid out and why it's architecturally significant.

## Igor's Layout

**Top row** — precursors and unusual/abnormal cells:

| NRBC | BLASTS | PRO | MYELO | META | PLASMA | MAST |
|------|--------|-----|-------|------|--------|------|

**Bottom row** — mature circulating cells + catch-all:

| BANDS | POLY | BASO | EOS | MONO | LYMPH | OTHER |
|-------|------|------|-----|------|-------|-------|

**M:E Ratio formula** (written at the bottom):

```
         Blasts + Pro + Myelo + Meta + Bands + Poly
M:E  =  + Baso + Eos + Mono
         ─────────────────────────────────────────────
                          NRBC
```

## Why This Is Elegant

Your colleague has done something really smart here — he's encoded clinical semantics *into the physical layout*. The two rows aren't just an arbitrary grid; they're a diagnostic partition:

**Bone marrow count:** Both rows active (all 14 categories). Everything is expected to be present.

**Peripheral blood count:** Bottom row is "normal." If you find yourself clicking anything in the top row, that's clinically abnormal by definition — NRBC, blasts, promyelocytes, myelocytes, metamyelocytes, plasma cells, or mast cells in peripheral blood all mean something is wrong.

This means the UI can do something visually with this. When the specimen type is set to "peripheral blood," the top row could be rendered differently — dimmed, outlined instead of filled, or with a subtle warning color — so that clicking a top-row button is still easy but carries a visual signal: "you are recording an abnormal finding."

## The M:E Ratio Formula

Note what's included in the numerator and what's excluded:

**Numerator (myeloid):** Blasts + Pro + Myelo + Meta + Bands + Poly + Baso + Eos + Mono — that's the entire myeloid lineage from blast to mature, including monocytes (which are myeloid-derived)

**Denominator (erythroid):** NRBC only

**Excluded from M:E entirely:** Plasma, Mast, Lymph, Other — these are lymphoid lineage or unclassifiable, so they don't belong in the myeloid:erythroid calculation

This matches the literature (reference [^12] in the review) — the M:E ratio is granulocytic+monocytic precursors divided by erythroid, with lymphoid elements excluded. Igor's formula is textbook-correct and self-documenting.

## How This Maps to the Configuration Architecture

Your colleague has essentially defined the **consensus configuration** we were discussing. In JSON terms:

```jsonc
{
  "id": "consensus-full",
  "name": "Standard Bone Marrow + Peripheral Blood",
  "author": "I. Rozenvald",
  "specimenTypes": {
    "boneMarrow": {
      "targetCount": 500,         // advisory, not enforced
      "categories": {
        "upper": ["NRBC","BLASTS","PRO","MYELO","META","PLASMA","MAST"],
        "lower": ["BANDS","POLY","BASO","EOS","MONO","LYMPH","OTHER"]
      },
      "allActive": true
    },
    "peripheralBlood": {
      "targetCount": 200,
      "categories": {
        "upper": ["NRBC","BLASTS","PRO","MYELO","META","PLASMA","MAST"],
        "lower": ["BANDS","POLY","BASO","EOS","MONO","LYMPH","OTHER"]
      },
      "upperRowAbnormal": true    // visual flag when clicked
    }
  },
  "formulas": {
    "ME_ratio": {
      "label": "M:E Ratio",
      "numerator": ["BLASTS","PRO","MYELO","META","BANDS","POLY",
                     "BASO","EOS","MONO"],
      "denominator": ["NRBC"],
      "precision": 1
    }
  }
}
```

Then an institution like Yale that follows the ICSH recommendation to merge bands with segs would use a config that collapses BANDS + POLY into a single "NEUT" category, and the M:E formula adjusts automatically because it references category names.

## Mapping to the Three User Requirements

This layout actually resolves requirement #2 from the earlier feedback — "peripheral blood keystrokes should be as identical as possible to marrow." With his design, the *same 14 buttons* exist for both specimen types. You don't remap keys at all. The only thing that changes is the visual treatment of the top row (normal vs. flagged-as-abnormal) and the target count. Muscle memory is perfectly preserved.

This also makes keyboard assignment straightforward. With 14 categories, a natural mapping might be:

| Key | Category | Key | Category |
|-----|----------|-----|----------|
| R | NRBC | B | BANDS |
| L | BLASTS | P | POLY |
| O | PRO | A | BASO |
| M | MYELO | E | EOS |
| T | META | N | MONO |
| C | PLASMA | Y | LYMPH |
| S | MAST | X | OTHER |

Though the exact mapping should be whatever matches what "everyone is used to" at the scope — and that's precisely what the config file controls.