# DCR-035: Design Change Record — Profile Names State Contents

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-035 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | **In Review** — engineering approvals complete; **clinical review invited, see §7** |
| **Parent Document** | DHF-001 |
| **Input** | `PROFILE-NAMING-PROPOSAL.md`, endorsed by the Document Owner |
| **Creates** | RA-001 HA-107 |
| **Closes** | DRIFT-LOG incidents 27, 28, 29 |

---

## 1. The Rule

**A profile name states what the profile IS** — its tallied category count and
its defining trait. Provenance, endorsement and rationale live in `description`
and `provenance.notes`, as facts with citations.

Value and status words are not used in names: *legacy, consensus, harmonized,
modern, classic, full, minimal, standard*. They are the part of a name a reader
cannot check. `consensus-14` asserted a consensus no body ratified; `legacy-9`
said only that something was old, and was not the older of the two 10-type
panels.

The count in a name is the number of **tallied categories** — what the operator
sees as rows and presses keys for. Where the differential denominator is
smaller, the description says so: NRBC are tallied in blood but excluded from
the denominator, so a 14-category panel yields a 13-category leukocyte
differential.

---

## 2. The Renames

| Old id | New id | New name |
|---|---|---|
| `consensus-14` | `ndc-14` | 14-Type Nucleated Differential |
| `harmonized-9` | `gran-combined-10` | 10-Type — Bands+Segs Combined |
| `legacy-9` | `bands-segs-10` | 10-Type — Bands & Segs Separate |
| `minimal-5` | `analyzer-5` | 5-Type — Analyzer Categories |
| `legacy-mdc` | `mdc-2015-9` | 9-Type — 2015 Counter Layout |
| `body-fluid` | *(kept)* | Body Fluid — 7 Types |
| `custom` | *(kept)* | Custom (Blank Template) |

**`legacy-mdc` was not in the proposal's table and is renamed anyway.** It was
added five change records earlier (DCR-032) and carries the proposal's own
banned word. Its count is 9 and its defining trait is the 2015 counter's
layout — a fact about a specific artefact, not a value judgement, which is why
the year may stand in the name. Leaving it would have meant shipping a rule
with an exception the guard would immediately have caught.

Ids are renamed, not only display names: an id prints in the report footer
(URS-052) and travels in every export. There are no deployed users yet, and
after the first pilot the old ids would be in archived records permanently.
Preset files are renamed to match their ids; `index.json` and `templates.json`
follow; each profile's `version` is bumped.

---

## 3. Two Defects the Naming Review Found

### The self-contradiction

`harmonized-9` had **three writers for one fact**: the id said 9, the
`profileName` said "10-Part", the description said "Modern consensus 9-part
differential" and listed nine categories. It tallies **ten**. Two of the three
were wrong, and nothing could tell which — that is the argument for a name that
counts rather than asserts. Drift incident 27.

### The provenance that printed a false basis

`minimal-5` and `body-fluid` both carried

> "Bone marrow categories and M:E ratio follow ICSH 2008 §2.6"

with **no `bm` specimen and no M:E formula between them.** The 10-type profiles'
identical note also overclaimed — their bone marrow categories are an aggregated
subset of the ICSH list, not the list.

**A correction to this record.** It first stated that those notes printed into
the report's method statement under *Basis:*, and that the reports therefore
carried a basis that did not exist. Checking the running application rather than
the engine showed otherwise: `buildMethodStatement` does emit a `Basis` entry
from `provenance.notes`, but `prepareConfig` built its meta as
`{version, profileId, profileName}` and dropped provenance before the statement
was ever constructed. **No shipped report has ever carried a basis line at all.**
The entry appeared only in unit tests that built a meta by hand.

So two defects cancelled. The false provenance was harmless because a second
defect hid it, and neither was safe alone: correcting the notes without noticing
the wiring would have left a designed report element permanently blank, and
fixing the wiring without correcting the notes would have put "Bone marrow
categories and M:E ratio follow ICSH 2008 §2.6" into the report of a profile
with neither.

Both are fixed. `provenance` now travels with the meta, the `Basis` line
renders, and VV-SYS-220 and VV-SYS-221 assert it **from the rendered report**
rather than from the file — because the file was never the thing at risk.

Every note now claims only what its profile implements. Drift incidents 28
and 30.

A third was found while writing the guard: the catalogue said "Custom (Blank
Template)" and the file said "Custom (Template)". Incident 29.

---

## 4. The Plasma-Cell Question (proposal §5)

Both 10-type bone marrow panels have **no plasma-cell, mast-cell or `other`
category**, and `bands-segs-10` has no promyelocyte category. A marrow
containing those cells gives the operator no key at all.

This is a different hazard from anything recorded. `HA-090` covers a cell that
should *not* have been counted being tallied into a general bucket; `HA-092`
covers a non-differential category entering the denominator. Neither covers a
legitimate member of the differential with nowhere to go. **`HA-107` is added.**

The disposition, and where it is stated, is the substantive decision:

> Plasma cells and mast cells cannot be tallied in these profiles. They are
> recorded in the morphology comment. If they need quantifying, `ndc-14` has
> both categories.

That guidance is placed **on the lymphocyte and basophil rows** — not in a
general note — because that is where the substitution would happen. A plasma
cell looks like the lymphocyte category's business; a mast cell looks like the
basophil's. Counting one there overstates that category and depresses every
other percentage, since the denominator grows by a cell that does not belong to
it. The guidance opens on screen where the operator is counting, and the
profile description says the same before the profile is loaded.

`bands-segs-10` carries the equivalent note on its myelocyte row for
promyelocytes.

Residual risk 18, accepted: a smaller panel is a legitimate choice a laboratory
makes, and guidance cannot stop an operator who ignores it. What is controlled
is that the omission is stated where the mistake would be made rather than left
to be discovered.

---

## 5. Renamed Ids and Cached Configurations

`isCacheSuperseded` compares profile ids for **equality**, so a browser holding
a cached `consensus-14` would have reported "not superseded" and carried on
silently under an id the catalogue no longer contains — printing it in every
report footer.

`Core.RENAMED_PROFILES` maps old id to new, and `renamedSuccessor` reports the
successor. It deliberately does **not** mark the cached profile superseded: an
operator may have adapted their configuration since loading it, and replacing
it to correct a label would discard that work. The application **offers**:

> Your active configuration is "Full 14-Part Consensus" (`consensus-14`), which
> has been renamed to "14-Type Nucleated Differential" (`ndc-14`) … Load the
> renamed built-in profile instead? This replaces the active configuration and
> clears any count in progress.

Declining is the default — Escape and Cancel both keep the active
configuration. The offer is skipped silently when the catalogue cannot be
fetched, because a dialog offering an action that cannot be performed is worse
than none. The map is data, not logic, so the next rename is one line, and it
is append-only: removing an entry restores the silence it exists to prevent.

---

## 6. Verification

| Case | What it holds |
|---|---|
| **VV-PRE-030** | Every number in a `profileName` or catalogue name equals the tallied category count of every specimen in that profile (a four-digit year is a date, not a count) |
| **VV-PRE-031** | Catalogue name equals the file's `profileName`, catalogue id equals its `profileId`, and the filename is the id |
| **VV-PRE-032** | A `provenance.notes` mentioning bone marrow requires a `bm` specimen; mentioning M:E requires an `ME_ratio` formula |
| **VV-PRE-033** | No name in a file or the catalogue contains a value or status word |
| **VV-PRE-034** | A bone marrow panel without a plasma-cell or mast-cell category carries guidance naming it on the row where it would be miscounted |
| **VV-SYS-217** | A cached profile under a renamed id raises the offer, and declining leaves the configuration untouched |
| **VV-SYS-218** | Accepting loads the renamed built-in |
| **VV-SYS-219** | A cached profile whose id is current raises no offer |
| **VV-SYS-220** | The rendered report states a `Basis`, and it is the shipped profile's own |
| **VV-SYS-221** | A profile with no bone marrow specimen states no bone marrow or M:E basis **in the report** |

`VV-SYS-219` asserts an absence, so removing the offer cannot fail it; the
inverse check applies — forcing `renamedSuccessor` to return a successor for
every profile must fail it. It did not at first, because the test used a fresh
browser: with no cached configuration the offer cannot fire for a structural
reason, and the test would have passed however wrong the rename map was. It now
seeds a *current* cached profile. This is the discipline DCR-034 §4 committed
to, applied and paying immediately.

All five revert-checked: restoring one old name, one contradictory count, one
copy-pasted note, one catalogue mismatch and one removed note each fails its
guard with the message that names the defect.

**683 Node tests pass.** The rename was applied by sweeping and then letting the
suite enumerate what remained, which found what a search would not: a Playwright
selector keyed on `data-preset-name="Body Fluid"`, an export-filename assertion
matching `wbcds-config-consensus-14-`, a variant id in the calculation reference
(`consensus-14-me-alt`), and a test whose regex escaped its parentheses
(`/Legacy MDC \(2015\)/`) so no literal substitution could match it.

One of my own edits was wrong in a way worth recording: the replacement string
`\1` immediately followed by `4-Type` parsed as backreference `\14`, which
silently ate the line prefix and left the guide reading "L-Type Nucleated
Differential". `UD-095` caught it.

---

## 7. What a Clinical Reviewer Is Asked

Two points, neither blocking:

1. **The disposition in §4.** Plasma cells and mast cells recorded in the
   morphology comment rather than tallied, when an aggregated profile is in
   use — is that the right instruction, and is the guidance in the right place?
2. **`bands-segs-10`'s description** states it matches "mechanical bench-counter
   layouts in current use". That is an empirical claim about practice, and it
   is the one sentence in this record that rests on nothing held.

---

## 8. Risk

No change to any calculation, count, percentage, ratio or category. The
configuration surface is unchanged: no category, formula, threshold or CI level
was removed, and the two 10-type profiles gained guidance without gaining or
losing a row.

`HA-097` is engaged and controlled — the sweep is verified by the suite rather
than by inspection. `HA-107` is new, and its control is documentary.

The residual consideration is stated in §5: an operator carrying an adapted
configuration under an old id keeps it, by design, and their reports keep citing
that id. That is correct — the id names what produced the report — but it means
old and new ids will both appear in records from this period.

---

## 9. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. Five profiles renamed in id, file and display name; descriptions and provenance rewritten to claim only what each implements; HA-107 added with guidance on the rows where a missing category would be miscounted; `RENAMED_PROFILES` and a decline-by-default offer for cached configurations. VV-PRE-030..034. Drift incidents 27–29. |

---

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **invited — see §7** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
