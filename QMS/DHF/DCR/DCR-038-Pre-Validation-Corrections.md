# DCR-038: Design Change Record — Pre-Validation Corrections

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-038 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-08 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Pre-validation review, `VALIDATION-READINESS-REVIEW.md` |
| **Closes** | DRIFT-LOG incidents 31–36 |

---

## 1. Why

Seven blockers stood between the software and a pathologist validation study.
**Every one was in a document a validator reads or follows; none was in the
software.** The code layer passed its audit — keyboard round-trip verified for
every key of all eight profiles, tonal feedback to spec, rename migration
declining by default, every published numeric example reproducing against the
engine.

That distribution is the finding. The guards built over the preceding ten change
records check *generated figures* and *profile names*. Nothing checked the body
of a procedure, so the two documents a validator actually executes — the SOP and
the validation protocol — drifted furthest.

---

## 2. What Was Wrong, and What It Now Says

### The wrong clinical instruction (SOP-001 §5.5)

> ~~"You pressed 'A' (blast) but meant 'V' (lymph). Press Shift+A…"~~

In the shipped default **A is monocytes and V is myelocytes**; blasts are X,
lymphocytes S. A validator rehearsing the correction procedure would delete a
monocyte and add a myelocyte — a silent two-category miscount, in the one
procedure written to *prevent* miscounts.

Now uses the real keys, and adds the instruction that matters more than any
particular key: **read the key from the cell's own tile**, because a laboratory
may have loaded a different profile.

### The unexecutable validation scenario (VV-001 V6)

> ~~"Press 'R' x 100 (nrbc)" · "Press 'P' x 300" · "Press 'L' x 50"~~

R is `pro`; **P and L are unmapped in every shipped profile**. The scenario
failed at step 2. The validation script had never been executed against the
profile it validates.

Corrected to B / F / X, with the expectations recomputed from the engine —
including the interval the original omitted, and the fact that blasts join the
M:E numerator per ICSH §2.6, which changes step 4's answer from "updated" to
**3.5:1 (2.8–4.4)**.

### The unperformable QC (SOP-001 §6.2)

> ~~"Perform the VV-CALC-007 standard differential test: blast=2, pro=5,
> **gran**=60, **eryth**=10…"~~

`gran` and `eryth` exist in no default category; `VV-CALC-007` exists in no test
file. Replaced with a 100-cell vector in real categories, each with its key,
expected percentage, the sum-to-100 check, and the M:E figure — all computed
from the engine, not composed by hand.

### The false privacy attestation (SOP-001 §8)

> ~~"No data is stored in permanent browser storage."~~

Autosave writes the accession number, counts and morphology text to
localStorage. This is the line a deploying laboratory's privacy review relies
on. It now states what persists, for how long, and what to do about it on a
shared workstation.

### A software control that was never built (SOP-001 §5.1, §5.2)

> ~~"'Start Count' is visible but disabled … becomes enabled once a valid case
> number is entered."~~

`requireCaseNumber` is **false in all eight profiles**. Worse than a wrong
description: because the SOP believed the software enforced identification, the
procedural control was never written down. It now says the check is
**procedural, owned by this SOP**, and names the profile field a laboratory sets
to make it a software control.

### The offline help page (help.html §Profiles)

Listed seven profiles, every one withdrawn by DCR-035 or never shipped. This is
drift incident 25's class recurring on a page **UD-095 did not cover** — and
`help.html` is precached, so it reaches validators on a restricted network.

### The guide's own remediation advice (USER-GUIDE)

Pointed operators away from the coarse 2015 profile toward "Full 14-Part
Consensus", a name withdrawn three change records earlier. That sentence is the
documented control for HA-107, so it failed where it mattered.

Swept with it, same class: README's withdrawn profile name, the `{{blast}}`
placeholder (the id is `blasts`), `minCellCount` (v1 field, now `targetCount`),
"Mandatory case/accession number", the 200/100 targets (those are the 2015
profile's; the default is 500/200), the right-hand "preset", and the
calculation reference's claim that an `ndc-14-me-alt` preset ships.

---

## 3. The Guards

Three, each catching a blocker above.

| Case | What it holds |
|---|---|
| **UD-097** | No operator-facing page names a profile the catalogue does not offer — README, USER-GUIDE, help, methods, calculation reference, counter |
| **UD-098** | Every key a procedure names maps to the category it claims, in SOP-001 and VV-001, against `templates.json` |
| **UD-099** | The monthly QC enters only categories a shipped specimen has, and every verification id it cites exists in a test file |

All revert-checked against the original defects: restoring `'A' (blast)`,
restoring `Press 'R'`, and restoring `gran` each fail their guard.

**UD-097 was vacuous when first written, and the revert-check caught it.** It
skipped any line that also named a live profile — which exempted the catalogue
*list*, the one line the guard exists for and the exact line that was wrong. The
exemption existed to avoid a false positive that cannot occur: no live name
contains a withdrawn one. It is gone, and an assertion now fails if a future
catalogue name would reintroduce the ambiguity.

UD-097 also caught a sentence of mine *denying* the right-hand preset exists. A
substring guard cannot distinguish assertion from negation; the sentence was
reworded rather than the guard taught to parse English.

---

## 4. Risk

No change to any calculation, configuration, key mapping or counting behaviour.
Documentation and test-only.

`HA-097` is the hazard throughout, in its most consequential form: a procedure
that cannot be followed, or that instructs a wrong keystroke, in front of a
clinician who has no way to know. Detection improves from *review* to *build*
for the key mappings, the QC vector and the profile names.

**What remains unguarded**, stated rather than implied: UD-098 reads
parenthesised key/category pairs, so a procedure that names a key in some other
prose form is not covered. UD-099 checks §6.2 only. Neither guards the
*sequence* of a procedure — that it describes steps the application actually
performs in that order — and no automated check can. That is what the validation
study is for.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-08 | QMS | Initial issue. Seven pre-validation blockers corrected across SOP-001, VV-001, help.html, USER-GUIDE, README and the calculation reference; UD-097/098/099 added; drift incidents 31–36 logged. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **SOP-001 and VV-001 changed — re-read before the study** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-08 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-08 |
