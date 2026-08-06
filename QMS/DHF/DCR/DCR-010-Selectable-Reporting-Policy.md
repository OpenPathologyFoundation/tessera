# DCR-010: Design Change Record — Selectable Reporting Policy

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-010 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-05 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Profile Version** | consensus-14 2.4 → 2.5 |

---

## 1. Change Summary

An audit prompted by the Document Owner asked a simple question of the design:
**which calculation choices does this tool make on the laboratory's behalf
without telling it?**

The design claim is that institutional variation in differential counting lives
in configuration rather than in code. That claim held for cell categories, keys,
target counts, the M:E formula, the denominator policy, thresholds and report
wording. It did **not** hold for three things:

| Choice | Was | Now |
|--------|-----|-----|
| Rounding policy | Fixed at largest-remainder | Selectable: `largest-remainder`, `largest-count`, `independent` |
| Decimal precision | Hard-coded 2 display / 0 report | `precision: { display, report }`, 0–4 places |
| M:E convention | Every shipped preset included monocytes | Both conventions ship as selectable presets |

Each was a defensible engineering default silently imposed as a clinical
decision. That is the pattern this change record exists to correct.

---

## 2. Why Rounding Is a Policy, Not a Fact

Fourteen categories of ten cells each — every one truly 7.14%:

| Policy | Result | Total | Worst single-category error |
|---|---|---|---|
| Largest remainder | twelve at 7%, two at 8% | 100% | 0.86 points |
| Largest count | thirteen at 7%, one at **9%** | 100% | **1.86 points** |
| Independent | all at 7% | **98%** | 0.14 points |

No standard dictates the choice. Largest remainder remains the default because
it totals 100% — which readers expect — with the least distortion of any
individual figure. But a laboratory whose procedure specifies the largest-count
rule should be able to follow its own procedure, and a laboratory that prefers
honest independent rounding should be able to accept a 98% total as the price.

**URS-034 has been amended for the second time.** Rev E replaced the original
largest-count wording with largest-remainder on clinical grounds; that reasoning
stands. Rev L makes the method selectable, because mandating any single one
contradicts the design principle.

---

## 3. Why Both M:E Conventions Now Ship

ICSH 2008 §2.6 includes monocytes and their precursors in the myeloid numerator.
A widely taught alternative excludes them. Both are in use, and they disagree:

| 150 segmented neutrophils, 60 monocytes, 90 erythroblasts | M:E |
|---|---|
| ICSH (monocytes included) | **2.3:1** |
| Alternative (monocytes excluded) | **1.7:1** |

The formula was always configurable, but every shipped preset used ICSH, so the
alternative required hand-editing JSON. An option a laboratory cannot find is
not an option. `consensus-14-me-alt` now ships and appears in the preset
catalogue, and both presets declare their convention in the method statement.

---

## 4. What Remains Fixed, and Why

The confidence interval method is **not** configurable. The obvious alternative,
the Wald interval, returns −0.38% to 2.38% for 2 blasts in 200 cells. A negative
blast percentage cannot be put in front of a clinician, and offering a method
that produces impossible values in this tool's characteristic case would be
offering a worse instrument, not a choice. The confidence *level* is selectable,
and interval display can be switched off.

This is stated explicitly in the calculation reference under "Not configurable,
and why", rather than left as silence.

---

## 5. Scope

- **Engine**: `percentagesSummingTo100` takes a `method` option; validation for
  `rounding` and `precision`; the method statement declares the policy.
- **Profiles**: all eight presets synchronised with `rounding`, `precision`,
  `targetCountBasis` and formula `basis` — several had drifted from the shipped
  default and lost their provenance.
- **New preset**: `consensus-14-me-alt`.
- **New document**: `CALCULATION-REFERENCE.md` — see §6.

### 5.1 Defect found

The `consensus-14` **preset** never received the provenance fields added to the
shipped `templates.json` under DCR-009. A laboratory loading that preset would
have lost the standard citation, the M:E basis and the target-count basis. All
presets are now synchronised and a test holds them there.

---

## 6. The Calculation Reference

`QMS/DHF/CALCULATION-REFERENCE.md` documents every number the tool produces for
a pathologist who is not a haematopathologist: what is calculated, how, why,
what the alternatives are, where the controversy lies, the references, and how
to change it. Every abbreviation is expanded.

It is pinned by tests. Every worked example, comparison table and confidence
interval it quotes is recomputed from the shipped engine (UD-030 to UD-038), and
UD-036 asserts that every choice the document calls configurable really is —
because a reference promising configurability the software does not offer would
be worse than one promising nothing.

**Writing it found an error in itself**: the blast-denominator example stated a
scenario whose arithmetic did not match the figures quoted. Caught by
verification before publication.

---

## 7. Verification

574 unit and behavioural tests, 177 system tests across three browser engines.
0 failures, 6 documented engine-specific skips.

New: VV-RND-001 to 007 (rounding policies), SC-040 to 043 (both M:E
conventions), UD-030 to 038 (the reference document).

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
