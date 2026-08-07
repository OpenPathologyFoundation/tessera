# DCR-029: Design Change Record — Drift Consistency

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-029 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | `CLAUDE-CODE-DRIFT-REMEDIATION.md` — drift remediation review |
| **Closes** | Seven live drift items (D1–D7) |
| **Creates** | `QMS/DHF/DRIFT-LOG.md`, `CLAUDE.md`, `scripts/qms-facts.js` |

---

## 1. What This Is

Seven claims in live documents had stopped being true. None of them was
introduced carelessly: each was written when it was accurate, by a session doing
correct work on the document in front of it.

That is worth stating precisely because it determines the remedy. If the cause
were carelessness the fix would be more care. It is not. The cause is that a
claim in one document has no connection to the thing it describes, so nothing
notices when they part company — and the reader who most needs the claim to be
true is the one least able to check it.

So this record does two things: it fixes the seven, and it makes each *class*
fail the build.

---

## 2. The Seven

### D1 — Four documents, one fact, three answers

| Document | Said |
|---|---|
| `README.md` | 1039 tests, 3 documented skips |
| `RTM-001` §8 | 1039 tests, 3 documented skips |
| `CLINICAL-REVIEW-BRIEF.md` | 1039 automated tests |
| `TR-001` — *the test results document* | 939 executed, 7 documented skips |

Every figure had been true once. The cause was structural, in three parts:
`qms-counts.js --write` refreshed some of them but only on demand; TR-001 was
written by a different tool at a different moment; and **QC-001 checked the
document counts while leaving the test totals unchecked**, because measuring
them means spawning the runners and suite 14 runs inside one.

### D2 — A hazard closed in one document, open in another

`RA-001` marks HA-093 **Closed 2026-08-06 (DCR-026)** — the M:E ratio carries an
interval. `DHF-001` §7.4 item 4 still listed "No interval is computed for the
M:E ratio" as work outstanding for a released baseline.

### D3 — A document contradicting itself, ten lines apart

`REF-001` §3.8 ends "**RA-001 HA-093 is closed.**" Its §5 gap table carried
"**Open** — needs Fieller or bootstrap". The row also cited `[S4]`, withdrawn
under DCR-027; so did the row above it. Both are recited to `[S7]`/`[S8]`,
consistently with how §3.8 now derives the claim.

### D4 — A correct rule with a reason that had become false

Thresholds cannot target a ratio formula. True, and it should stay. The stated
reason — "no confidence interval is computed for a ratio" — has been false since
DCR-026, in three live places: the comment above `evaluateThresholds`, the
validation message an operator reads, and SYS-205's rationale.

The real reason is scale: a threshold is a value on the 0–100 percentage scale
(`validateConfig` bounds `t.value` to it) and a ratio does not live there. 2.3:1
is not 2.3 per cent. The message now says so and tells the operator to express
the subset as a `percentage` formula — which is more useful than the reason it
replaced, and was already available.

### D5 — DHF-001 doing what DCR-027 forbade the brief doing

§7.2 enumerated "DCR-004 to DCR-009" when there were 28 change records; §7.4
said "the eleven documents listed as In Review" when 29 clinical signatures were
outstanding. DCR-027 had established that the register owns this fact and
QC-015 forbids the brief restating it. DHF-001 was doing the same thing and was
not swept — which is incident 20 in the drift log, and an instance of the very
pattern DCR-027 was written about.

Both now point at `SIGNOFF-REGISTER.md` and state no count.

### D6 — README describing an asset architecture that no longer exists

Verified by grep before editing: Tailwind is vendored at
`web/vendor/tailwind.js`; Google Fonts genuinely do load from a CDN and the
service worker caches them opportunistically. Three claims corrected, including
Limitation 5, which named the wrong dependency as the air-gap blocker.

Self-hosting the three font families would close the limitation entirely and is
**not done here** — it requires downloading binary assets from an external
source, which is a decision for the Document Owner rather than a remediation
step. The limitation now names the fonts as the remaining blocker.

### D7 — TR-001 regenerated, not patched

TR-001's totals are now `qms:fact` markers written by the evidence run. Its §1
command line no longer names a command from memory; it names the bundle, whose
`command.txt` records what actually ran.

---

## 3. One Writer, One Moment

`scripts/qms-facts.js` defines five measured facts — `tests_total`,
`tests_node`, `tests_browser`, `tests_skipped`, `evidence_run_id` — and the
documents carry them as markers that render invisibly:

```
<!-- qms:fact tests_total -->1039<!-- /qms:fact -->
```

`scripts/qms-run-tests.js` writes them, at the one moment both layers have just
finished, and writes the same figures as `facts.json` in the bundle. A document
can therefore be checked against **the run that produced it** rather than
against another document that may be equally stale.

**`qms-counts.js` no longer writes test totals.** This is the substantive part.
Two writers for one fact is the defect, and for a while this script was one of
the two — so its four run-outcome edits were removed. It keeps what is measured
from the tree: requirement rows, hazard rows, register size, scenario count,
spec inventory. Everything about how a run *turned out* belongs to the run.

**On principle 4 (extend, do not add).** `qms-facts.js` is a fourth script in an
existing family of one-script-per-fact, not a parallel system: no new dependency,
no new framework, the same module shape, consumed by the same suite. The marker
logic cannot live inside `qms-run-tests.js`, because suite 14 must read it
without spawning the runners.

---

## 4. Verification

Numbering continues from QC-020; QC-019 and QC-020 were taken by DCR-028.

| Case | What it holds |
|---|---|
| **QC-021** | No two live documents state a different value for the same fact — pure cross-document comparison, spawns nothing |
| **QC-022** | The stated facts are the ones the newest **clean-tree** bundle measured. Reports a skip out loud when no such bundle exists, rather than passing silently |
| **QC-023** | Every marker names a fact a writer produces, and every measured fact appears in some document |
| **QC-024** | A hazard closed in `RA-001` is not listed open in `DHF-001` §7.4 or `REF-001` §5 — D2 and D3 as an invariant, knowing nothing about HA-093 |
| **QC-025** | A shipped capability is not described as absent. Table-driven: one row today (`ratioInterval`), one added row per future closure. Change records and revision-history rows exempt as historical |
| **QC-026** | TR-001 reports a bundle whose `environment.txt` says `tree_state=clean`, and that bundle records a `command.txt` |

And in the runner: a run from a dirty tree, or a failing run, **refuses to write
the documents**. The bundle is still written and still marked PROVISIONAL —
`--provisional` overrides, deliberately awkwardly.

Each revert-checked. QC-025's first run failed on a revision-history row in
SRS-001 that quotes the wording it replaced; that is a dated record of a change
explaining itself, so the same exemption change records get was extended to it.
The test found a real ambiguity in its own scope before it found a defect.

---

## 5. The Drift Log

`QMS/DHF/DRIFT-LOG.md` records 21 incidents — the seven above, the four
propagation failures DCR-022 §4 counts, the two DCR-027 records, and the earlier
findings of the 2026-08-06 independent review and the DCR-021 architecture
review. Append-only; one row per incident; the last column names the guard.

§3 of that file states what is **not** guarded, which matters as much: the README
asset claims have no automated check (asserting prose against `<script>` tags
would test phrasing rather than fact), the SAD-001 guards are document-specific
rather than a class, and QC-022 is inert until a clean-tree bundle exists.

Sixteen of the twenty-one were introduced by sessions doing correct work. That
finding is the argument for `CLAUDE.md`.

---

## 6. `CLAUDE.md`

A standing contract at the repository root: the five governing principles, the
closure sweep as an ordered list of the eight places a closure must reach, the
table of generated content that must never be hand-edited, the pre-commit gate,
and the changes that require their own DCR.

Its first instruction is to read the drift log, because the argument for the
sweep is empirical rather than procedural.

---

## 7. Risk

No change to any calculation, counted value, or shipped behaviour. Two
operator-visible changes, both improvements in accuracy: the threshold
validation message now explains the real constraint and names the remedy, and
README Limitation 5 names the correct remaining dependency.

`HA-097` — documentation describing software that no longer exists — is the
hazard this record addresses throughout. Detection improves from *review* to
*build*: six new classes of drift now fail `npm test`.

No preset, schema field, rounding method or CI level was removed.

---

## 8. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. D1–D7 fixed; `qms-facts.js` added and `qms-counts.js` relieved of run outcomes; QC-021–026; `DRIFT-LOG.md` and `CLAUDE.md` created; SRS-001 to v3.3 Rev L. |

---

## 9. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
