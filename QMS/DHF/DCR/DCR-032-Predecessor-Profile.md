# DCR-032: Design Change Record — The Predecessor Profile

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-032 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Document Owner |
| **Closes** | DRIFT-LOG incident 25 |
| **Traces** | URS-101 (preset catalogue) |

---

## 1. Why

The 2015 Backbone.js/JSP counter that preceded this application is retained at
`legacy/` under DCR-004, unserved and untested. Operators trained on it have
nine keys in muscle memory. Nothing in this application matched that layout, so
switching meant relearning the keyboard — the kind of friction that keeps a
superseded tool in use.

`legacy-mdc` is that layout, available from the preset catalogue.

---

## 2. The Configuration Was Measured, Not Transcribed

The predecessor's configuration file had not survived in `legacy/`: only
`findroot.php` remained under `settings/`. It was recovered from
`web/settings/templates.json` at commit **aa88da4** — the initial upload, before
the v2 schema replaced it.

Recovery from git is not verification, so the application was then **executed**.
`legacy/web/index.jsp` proved to contain no JSP tags beyond a page directive, so
it was served as HTML with its three CDN libraries vendored locally, and driven
under Playwright.

That mattered. Reading the source alone would have got it wrong: `counter.js`
looks like the counting engine and is **commented out** in `index.jsp`. The live
path is `app.js`/`views.js`, and the two differ — `counter.js` substitutes `<1`
for a zero percentage and the live code does not.

### What the running predecessor does

Nine keys, `A S D F Z X C V B`, on both specimen types:

| Key | Bone marrow (min 200) | Peripheral blood (min 100) |
|---|---|---|
| A | blast | poly |
| S | pro *(promyelocytes/myelocytes)* | band |
| D | gran *(maturing granulocyte forms)* | lymph |
| F | eryth | mono |
| Z | baso *(basophils/mast cells)* | eos |
| X | eos | baso |
| C | plasma | pro |
| V | lymph | blast |
| B | mono | other |

Report templates: **Yale SOM**, **Precipio DX**, **MGH** for marrow; **MGH** for
blood.

Driven with 1 blast, 99 gran, 50 eryth, 25 lymph, 26 mono — 201 cells — it
displayed two decimals and reported whole numbers:

```
on screen   0.50%  0.00%  49.25%  24.88%  0.00%  0.00%  0.00%  12.44%  12.93%
reported    0%     0%     49%     25%     0%     0%     0%     12%     13%   = 99
```

**A blast that was counted reported as 0% blasts**, and the nine figures summed
to 99. The Precipio DX template reserved `M:E ratio | _ | 2 - 4:1` and printed
the underscore literally; the ratio was never implemented.

This engine reproduces that output exactly under `independent` rounding at zero
decimals, which is how the reading of the predecessor's arithmetic was
confirmed rather than assumed. VV-PRE-024 holds both halves of the comparison.

---

## 3. What Ships

**Layout, keys, minimums and report wording are the predecessor's. The
arithmetic is this application's.** Decided by the Document Owner from three
options; the alternatives were bit-for-bit fidelity, and shipping both variants.

| | Predecessor | `legacy-mdc` |
|---|---|---|
| On-screen percentages | 2 dp | 2 dp — **identical** |
| Report | independent rounding, 0 dp | largest-remainder, 1 dp |
| 1 blast in 201 | `0% blasts` | `0.5% blasts` |
| Nine figures sum to | 99 | 100.0 |
| M:E ratio | `_` | computed, with its interval |
| Confidence intervals | none | 95%, as elsewhere |

The Yale SOM sentence, as it now reads:

> A 201-cell count reveals **0.5%** blasts, 0% promyelocytes/myelocytes, 49.3%
> maturing granulocyte forms, 24.9% erythroid forms, 12.4% lymphocytes, 0%
> eosinophils, 0% plasma cells, 0% basophils/mast cells, and 12.9% monocytes.

The predecessor's nine cell ids map onto this application's vocabulary without
inventing any: `blast→blasts`, `eryth→nrbc`, `band→bands`, and `gran` already
existed as the aggregate granulocyte category.

### What the profile declares about itself

It is **coarser than ICSH 2008 §2.6** and says so, in its provenance and in
per-category notes the operator can open on screen: one key covers myelocytes,
metamyelocytes, bands and segmented neutrophils; another promyelocytes and
myelocytes; another basophils and mast cells. Peripheral blood has **no NRBC
key**, so this profile cannot apply the ICSH denominator convention of DCR-006
or report NRBC per 100 WBC.

A count taken in this profile cannot be re-expressed against ICSH categories
without counting again. The provenance names `consensus-14` as the profile to
prefer for new work.

The shipped default is unchanged. `USER-GUIDE.md` documents the switch and how
a laboratory makes it its own default by exporting the profile.

---

## 4. Verification

| Case | Layer | What it holds |
|---|---|---|
| **VV-PRE-021** | Unit | Every key maps to the category the predecessor mapped it to |
| **VV-PRE-022** | Unit | The nine keys, in the predecessor's order, split on its physical rows |
| **VV-PRE-023** | Unit | Its minimums (200/100) and its three institutional templates |
| **VV-PRE-024** | Unit | The predecessor's output is reproduced under `independent` rounding, **and** the shipped profile does not report a counted cell as absent |
| **VV-PRE-025** | Unit | The M:E field is bound to the formula, and lymphocytes and plasma cells take no part in it |
| **VV-PRE-026** | Unit | The profile declares its coarseness, names `consensus-14`, and warns that peripheral blood cannot report NRBC |
| **VV-SYS-210** | System | The preset loads from the catalogue and shows the nine categories — and not `META`, `MAST` or `BANDS` |
| **VV-SYS-211** | System | The predecessor's keys count its cells, at percentages identical to what it displayed |
| **VV-SYS-212** | System | The report keeps the counted blast at 0.5%, carries all three templates, and fills the M:E field |
| **UD-095** | Unit | The user guide lists the presets the catalogue offers, and only those |
| **UD-096** | Unit | The guide documents the profile's divergences and how to make it a default |

All eleven revert-checked. The system tests pass on Chromium, Firefox and
WebKit.

**Three attempts at the system-test helper failed before it was instrumented
rather than guessed at.** The preset catalogue is not inside `#modal-overlay` —
the overlay is *hidden* while the catalogue is open and carries only the
confirmation afterwards — so every assertion written against the overlay proved
nothing, and the subsequent click waited out its own timeout with the dialog
still intercepting. One diagnostic run that printed the actual DOM state ended
it. Guessing at a selector twice is the point at which to stop and measure.

---

## 5. Risk

No change to the shipped default profile, to the engine, or to any existing
profile.

The new hazard is **`legacy-mdc` being chosen for familiarity and its
limitations not being read**. Its categories are aggregated, and a peripheral
blood count taken in it silently lacks the NRBC handling that DCR-006 exists to
provide. The controls are: the provenance states it, the category notes state it
on screen where the operator is counting, the user guide states it under a
heading a returning operator will read, and VV-PRE-026 and UD-096 fail the build
if any of that is removed. Residual risk accepted — the profile is opt-in, the
default is unchanged, and every report names the profile that produced it.

Incidentally found and logged as **drift incident 25**: `USER-GUIDE.md` listed
`frequency-ergonomic` and `right-hand`, both withdrawn under DCR-020 and
HA-104. UD-095 now checks the guide against the catalogue.

No preset, schema field, rounding method or CI level was removed.

---

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. `legacy-mdc` added to the preset catalogue, recovered from commit aa88da4 and confirmed by executing the predecessor under Playwright. Legacy layout with this application's arithmetic; M:E computed where the predecessor left a blank. USER-GUIDE documents the switch. VV-PRE-021..026, VV-SYS-210..212, UD-095, UD-096. |

---

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **invited — §3 aggregation and the missing NRBC key** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
