# DCR-043: Design Change Record — The Drift Log Replayed, and the Paper About It Reads Only Measured Facts

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-043 |
| **Version** | 1.0 |
| **Date Created** | 2026-10-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | The methods paragraph, replay protocol and facts-file specification written for the manuscript about this machinery on 2026-10-01 |
| **Opens** | QC-029 to QC-032; drift incident 53 |

---

## 1. What This Is

The manuscript that describes this repository's drift control makes three
kinds of claim a reviewer can attack: incidents it never defined, guards it
asserts, and counts it typed. This change record builds the three mechanisms
that make each one checkable by someone who did not write the code, in the
order the 2026-10-01 plan gives — the facts script, the classification, the
replay, and the lint — and leaves the prose for last, because every number
upstream of it may still move.

Nothing about the product changes. The version moves from 2.24.0 to 2.24.1 so
that the design history names the state in which the replay was first run.

---

## 2. The Replay

`DRIFT-LOG.md` names, for every incident, the check that now prevents it. The
column was written by hand, once per row, when the guard was built, and nothing
has asked since whether the guard still catches the incident — or whether it
catches the *class*, which is what the manuscript claims the gates are written
as. `replay/` asks both questions of every row.

**The protocol** is in `replay/README.md` and is not repeated here. In short:
every row has an instance patch that re-creates its own contradiction as
literally as the tree allows, and a class patch that introduces a different
contradiction of the same class. `npm run replay` applies each to a fresh
worktree of a fixed commit, runs the build — `npm test`, plus the register
check when a patch touches a test or a register, plus a targeted browser run
where the guard lives in the browser layer — and classifies the outcome:
caught (a guard the row names fired), caught incidentally (a check the row does
not name fired), caught unattributed (the row names no check that could be
expected), or escaped. A negative and a positive control run first; the runner
refuses a dirty tree; results are stamped with the commit they measured; a
guard that caught its incident in the committed results and no longer does
fails the run.

**Who built what.** The instance patches were built by the session that built
this change record, from each log row and the artifact's current text. The
class patches were built by nine fresh sessions, each given one class
definition and its rows and forbidden to read `tests/`, `scripts/` or any
change record — the protocol's own requirement that the builder of a class
patch has not seen the gates. Each patch file names its builder. One instance
(row 48, a load-dependent race) is recorded as not replayable with the reason.

**Mode.** Every patch is a hand edit of the stale artifact rather than a revert
of the fix commit, because each fix in this repository is a change-set commit
that also carries the guard it introduced; reverting one would remove the gate
with the incident.

### 2.1 Results

Measured at `7d649a7` on a clean tree, 106 patches, both controls as expected
(the positive control fired QC-016 and VV-PRE-028). The table is a dated record
of that run; `replay/results.json` holds every run and `replay/facts.json` is
the live source the manuscript reads.

| | Instance patches (the row's own contradiction) | Class patches (a different one of its class) |
|---|---|---|
| Caught by a guard the row names | **32** of 53 | **6** of 53 |
| Caught by a check the row does not name | 4 (rows 3, 9, 33, 46) | 1 (row 8) |
| Caught, row names no check to expect | 1 (row 52) | 2 (rows 43, 52) |
| Escaped | 15 | 44 |
| Not replayable | 1 (row 48, a race) | 0 |

**Of the 43 rows the log marks as guarded**, 32 were caught by the guard the
row names, 4 by a different check, and **6 escaped**: rows 6 and 8 (SAD-001's
UD-070 to UD-074 cover the sentences DCR-021 corrected, not the claims), 11
(QC-026 checks that a bundle records a command, not that TR-001 states the one
it ran), 20 (QC-012 regenerates the register and does not look at DHF-001
§7.2), 23 (SC-063 covers the fonts; the row says so), and 43 (the guard is a
code path no test exercises). Row 48 cannot be replayed deterministically. The
nine other escapes are rows the log already marks unguarded; the replay agrees
with the log about every one of them.

**Attribution.** Where the row names one guard and another fired — 3 (QC-006
and the register check, not QC-004), 9 (UD-050, not UD-004 to UD-016), 33
(UD-099, not UD-098), 46 (VV-TGT-003 and three behaviour tests, not VV-TGT-001)
— the row's column is what is imprecise. The log's rows are not edited (the
convention forbids it); `results.json` carries the check that fired, and the
manuscript's table is generated from it.

**The class result is the finding the plan said to expect.** Six class patches
were caught by the gate the row names: the version-coherence gate (rows 15 and
50), the fact-marker gates (16), the font-licence gate (23), the target-basis
gate (41) and the profile-compatibility gate (51). Three more went red under
other checks. Forty-four escaped — a different document restating a count, a
different hazard-like item left open, a different profile describing software
that does not ship, a different evidence bundle with no identity. The gates
that catch a class are the ones anchored on a generated artifact or a shipped
export; the gates that catch an instance are anchored on the sentence that
drifted. That is the limitation the manuscript's §6 admits in prose, now with
a number under it, and it is the number the paper should report rather than
"twenty of twenty-three guarded".

**Nothing regressed**: this is the first admissible run, so there was no
earlier result to regress from; from here on a guard that stops catching its
incident fails `npm run replay`.

---

## 3. The Facts File and the Lint

`scripts/qms-paper-facts.js` generates `replay/facts.json`: every number the
manuscript may state, each with a definition and a pointer. Rows of the log are
counted from the log; classes, detection and dates come from
`replay/incidents.json`; the replay figures from `replay/results.json`; the
current test totals from the newest admissible evidence bundle; signatures
from the generated register; the baseline from a measurement (§4). A key the
generator does not produce cannot appear in the paper; a key it cannot measure
is absent and the paper must say "not counted" — `sessions.total` and
`revert_check.tests_found_wrong` are absent for that reason.

The manuscript carries the repository's existing `qms:fact` marker, extended
with a dotted key and an optional `words` rendering so that "sixteen of the
first twenty-one" is two markers and not a typed phrase. `--write` rewrites the
markers from the facts and vendors the file into the private manuscript
directory with its hash, so the paper's numbers are pinned to a public artifact
while the text is not.

`scripts/qms-manuscript-lint.js` is the submission gate: every integer in the
manuscript must sit in a marker or on a short allowlist (years, reference and
standard numbers, identifiers, section numbers, file names, release labels),
and a spelled-out number that equals a measured fact is reported. Run against
the draft of 2026-08-07 it lists 32 typed numbers and 12 words — the work list
the plan said it would be.

**What the build checks and what the release step checks.** QC-031 holds the
manuscript's markers to `facts.json`. `facts.json` itself is held to the tree
by `node scripts/qms-paper-facts.js --check`, run at the tag rather than by
the build: the generator refuses a dirty tree, so a build-time check would go
red after every evidence run until the file was rewritten in a further commit.
DRIFT-LOG §3 records the gap.

**How the manuscript joins the suite.** QC-031 holds the manuscript to the
facts file wherever a clone has one. A manuscript with no marker has not yet
joined: its typed numbers are reported and nothing fails, so a private draft
cannot hold the product's release evidence hostage. From the first marker on it
is held to all of it. That is a decision this record makes and the 2026-10-01
plan did not: the plan says "let the build fail", and a build that fails on
the author's machine alone, for a document the clone cannot see, is not a
gate but a nuisance.

---

## 4. What Building It Found

**Incident 53.** The facts file needs the v2.0 baseline test count, and the
plan says to measure it with a classifier at the baseline commit rather than
read it. Measured at `52e2a4c`, the newest commit on or before the baseline
date TR-001 §1.1 states, the suite runs **156** tests, all passing, none
executing the application — thirty in a file that says it mirrors the
application, forty-five asserting on source text, and eighty-one in files the
classifier calls "other" because they read configuration and HTML rather than
code. DCR-004 §1 says 379. TR-001 §1.1 said 191. The February evidence bundles
record 153. No commit and no bundle produces 191 or 379, and the manuscript
draft, the clinical review brief's ancestry and a grand-rounds deck have all
repeated 379 from DCR-004. TR-001 §1.1 is corrected and now names the commit;
QC-032 holds it there; DCR-004 keeps its figure because a change record is a
dated record of what was believed when it was written. The figure the
manuscript's opening vignette turns on was wrong in the one place a reviewer
would check first, and it was found by building the instrument that would have
caught it.

**The taxonomy grew.** The manuscript's Table 1 has seven root-cause classes,
written when the log had 23 rows. Classifying 53 took twelve: the original
seven and five the later rows forced — documentation describing software that
does not ship, text copied into a context where its facts are false,
traceability identifiers that point at nothing, a test that claims more than it
verifies, and original defects that were never drift. The seven appear in the
twelve under their original names, so the paper's table can be regenerated
rather than rewritten.

**Three things the methods paragraph does not yet say.** Row 50 was found by
*use*, a fourth detection class beside the three the paragraph names. Rows 43
and 48 name a code path rather than a test identifier as their guard, so a red
build there is recorded as caught but unattributed, which is a smaller claim
than "guarded". And the paragraph's commit-verified criterion for "introduced
by correct work" has not been applied row by row: `replay/incidents.json`
carries the author's own statement (DRIFT-LOG §4) and, for nineteen rows, the
introducing commit that criterion would need.

---

## 5. Open for the Document Owner

1. **Confirm the classification.** `replay/incidents.json` is marked
   *proposed*. Every row's class, detection and correct-work flag was assigned
   by the session that built this record; `facts.json` carries that status
   and DHF-001 §7.4 lists it as outstanding. The blind second rating the
   methods paragraph offers can be done from the rows and their pointers alone.
2. **Apply the Methods criterion** for "introduced by correct work" where an
   introducing commit is identified, or delete that clause from the paragraph.
3. **Mark up the manuscript.** `npm run lint:manuscript` is the work list.
   The draft's "379", its "23 incidents", its "20 of 23 guarded" and its Table
   1 are all superseded by `replay/facts.json`.
4. **Tag, then re-run.** The replay and the facts file describe the commit
   they were run on. The paper must describe a tag with a DOI, so the last
   step is `npm run replay` and `--write` on that tag's clean tree.

---

## 6. Scope

**Added** — `replay/` (`README.md`, `incidents.json`, `run.js`, `run.sh`,
`patches/` with 106 files, `results.json`, `facts.json`, `baseline.json`);
`scripts/qms-paper-facts.js`; `scripts/qms-manuscript-lint.js`; QC-029 to
QC-032 in suite 14; three npm scripts (`replay`, `paper:facts`,
`lint:manuscript`); `replay/logs/` git-ignored.

**Changed** — `TR-001` §1.1 (incident 53); `DRIFT-LOG.md` (row 53, §3, rev L);
`DHF-001` (§5 RPL-001, §7.4 item 5, rev AS, product version); `CLAUDE.md`
(principle 4, the closure sweep's step 8, the generator table, before-you-
finish); `README.md` (file structure, a Replay section under Testing);
`VALIDATION-PLAYBOOK.md` step 20; the verification registers and count tables,
regenerated; product version 2.24.1 in `package.json`, `mdc-app.js`, `sw.js`.

**Out of scope** — the manuscript's prose; `RA-001` (no hazard is added or
re-scored: the replay strengthens the controls behind HA-097's class without
changing any row); the application's behaviour.

---

## 7. Verification

| Case | What it holds |
|---|---|
| **QC-029** | Every drift-log row has a classification in a known class and detection class, an instance patch and a class patch that parse, carry a mode, edits or a reason, and a builder; no patch replays a row the log lacks |
| **QC-030** | The committed `results.json` is not provisional or a dry run, names a commit this repository contains, passed both controls, covers every incident in both kinds, and its summary is the runs counted, with no patch left unapplied |
| **QC-031** | Where a manuscript exists and carries a marker, every marker names a fact and agrees with it and no integer is typed; a manuscript with no marker is reported, not failed |
| **QC-032** | TR-001 §1.1 states the baseline count `replay/baseline.json` measured and names the commit |

Revert-checked: QC-032 failed with the original symptom (191 against 156)
before TR-001 was corrected, which is how incident 53 was confirmed; QC-029
fails when one patch file is removed; QC-031 fails when the draft carries a
marker whose value disagrees with the facts file; QC-030 fails against the
provisional results the shakedown run wrote on a dirty tree.

The replay itself is verified by its controls on every run: an unmodified
commit must build green and a hand-edited version must build red with QC-016
named, or the run stops.

**Execution Evidence**:
- QMS/DHF/TestEvidence/2026-10-18_130730_run/

---

## 8. Risk

No change to RA-001. The replay and the facts file are quality records about
the verification system; the application they describe is unchanged.

---

## 9. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-10-18 | QMS | Initial issue. Replay protocol, runner, classification manifest and 106 patches; paper facts generator with baseline measurement; manuscript lint; QC-029 to QC-032; incident 53 (the v2.0 baseline test count). Product version 2.24.1. |

---

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Document Owner** | | | **the classification in `replay/incidents.json` is proposed, not confirmed — §5** |
| Design Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
