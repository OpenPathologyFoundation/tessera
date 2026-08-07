# Drift Remediation — Instructions for Claude Code

Task: eliminate the documentation drift currently live in this repository, and extend the
existing QMS machinery so the same class of drift fails the build instead of waiting for a
reviewer. Work as one change set under a single new DCR (next free number, likely
`DCR-029-Drift-Consistency`).

## Governing principles — read before touching anything

1. **Live documents vs historical records.** Fix drift only in *live* documents: `README.md`,
   `USER-GUIDE.md`, `RTM-001`, `TR-001`, `DHF-001`, `REF-001`, `SRS-001`, `RA-001`,
   `CLINICAL-REVIEW-BRIEF.md`, source comments, and shipped strings. Never retro-edit closed
   DCRs or revision-history rows — DCR-027 states the rule: "rewriting the record of a
   decision falsifies it." Stale numbers inside DCR-022/023 are historical facts; leave them.
2. **One source of truth per fact.** Test totals come from the newest *admissible* evidence
   bundle. Requirement/hazard/test-case counts come from `scripts/qms-counts.js`. Signature
   status comes from `SIGNOFF-REGISTER.md` (generated). Product version comes from
   `package.json` (QC-016 already enforces this). No live document may state one of these
   facts from memory.
3. **Configurability is a design goal, not a defect.** The value of this tool is total
   configurability of counting policy. Do not remove presets, schema fields, rounding
   methods, or CI levels as part of this work. Where configurability creates consistency
   obligations, add the *check*, not the cut.
4. **Extend the machinery that exists.** `scripts/qms-counts.js`, `scripts/qms-signoffs.js`,
   `scripts/qms-verification-index.js`, and `tests/14-qms-counts.test.js` (QC-001…QC-018)
   are the drift-control system. Add to them. Do not introduce a new framework, dependency,
   or parallel script.
5. **Every claim you write must be measured first.** Do not copy any number from this file —
   several are illustrative. Run the tools, use what they output.

## Phase 0 — Preflight

1. `git status` must be clean before the final evidence run. Commit or stash the current
   modifications first (`.gitignore` is modified; `.claude/` is untracked — add `.claude/`
   to `.gitignore` if not already there).
2. Run `npm test` and confirm green before changing anything. Record the Node totals.
3. Read: `QMS/DHF/DCR/DCR-TEMPLATE.md`, `QMS/DHF/DCR/DCR-027-*.md` (the pattern this work
   follows), `scripts/qms-counts.js` in full, `tests/14-qms-counts.test.js` in full,
   `scripts/qms-run-tests.js` (evidence + TR writing), `SIGNOFF-REGISTER.md`.
4. Open DCR-029 from the template. Every edit below is recorded in it.

## Phase 1 — Fix the seven live drift items

For each item: locate by the quoted search string (line numbers shift; strings are current
as of v2.15.0), fix, and note the file in DCR-029.

### D1. Test totals disagree across five live documents

- `README.md` — search `1039 executed` (currently "**1039 executed** (643 Node + 396
  browser, 3 documented skips)").
- `QMS/DHF/RTM-001-RequirementsTraceabilityMatrix.md` — search `1039 executed` (§8:
  "643 unit + behavioural, 396 system … 1039 executed, 0 failures, 3 documented skips").
- `QMS/DHF/CLINICAL-REVIEW-BRIEF.md` — search `1039 automated tests`.
- `QMS/DHF/TR-001-TestResults.md` — states 939 / 595 Node / 344 browser / 7 skips.

Truth: whatever the Phase 4 clean evidence run measures. Do not reconcile these by hand now;
convert them to generated values (Phase 2) and let the Phase 4 run populate them. The skip
count is part of the fact (3 vs 7 is one of the current contradictions).

### D2. HA-093 is closed in RA-001 but still listed as outstanding in DHF-001

- `QMS/DHF/DHF-001-DesignHistoryFile-Index.md` — search `No interval is computed for the
  M:E ratio` (§7.4 open-items list, item 4). RA-001 marks HA-093 **Closed 2026-08-06
  (DCR-026)**. Remove the item or restate it as closed with the DCR-026 reference,
  whichever the surrounding list structure implies.

### D3. REF-001 contradicts itself on the same hazard

- `QMS/DHF/REF-001-StandardsAndLiterature.md` — search `**Open** — needs Fieller or
  bootstrap` (§5 gap table). Ten lines up, §3.8 says "RA-001 HA-093 is closed." Update the
  gap-table row to **Closed** — DCR-026, conditional-binomial odds transform of the Wilson
  interval; Fieller rejected (degenerates with zero erythroid cells), bootstrap rejected
  (stochastic in a reported figure). Note: the row cites [S4], which DCR-027 withdrew —
  recite to [S7]/[S8] consistently with how §3.8 now derives the claim.

### D4. Stale rationale: "no confidence interval is computed for a ratio"

`ratioInterval` has existed in `web/scripts/wbc-core.js` since DCR-026, so this reason is
false in three places. The *rule* (thresholds cannot target ratio formulas) stands — its
correct rationale is that a threshold is a value on a 0–100 percentage scale and a ratio is
not on that scale (and `validateConfig` bounds `t.value` to 0–100).

- `web/scripts/wbc-core.js` — search `Ratios are not eligible: no interval is computed`
  (comment above `evaluateThresholds`). Restate: thresholds are percentage-scale; ratios
  are not percentages; use a `percentage`-type formula to threshold a subset.
- `web/scripts/wbc-core.js` — search `'A ratio carries no confidence interval, so it
  cannot be tested '` (validation error string). Replace with the percentage-scale
  rationale. **Then grep `tests/` for the old phrase** — at least one test asserts this
  string — and update the expectation. Also check `web/editor.html` / `config-editor.js`
  for the same wording.
- `QMS/DHF/SRS-001-SystemRequirementsSpecification.md` — search `because no confidence
  interval is computed for a ratio` (SYS-205). Restate the SHALL with the corrected
  rationale; keep the requirement ID and the URS-038 trace; bump SRS revision history.

### D5. DHF-001 hardcodes sign-off facts the register owns

DCR-027 fixed exactly this in the clinical brief (QC-015 now forbids the brief restating
the register). DHF-001 still does both:

- Search `Clinical signatures on the eleven documents listed as In Review` (§7.4 item 1) —
  the register counts 31 documents / 29 clinical signatures. Replace the number with a
  pointer: "Clinical signatures on the documents listed in `SIGNOFF-REGISTER.md`."
- Search `DCR-004 to DCR-009` (§7.2 In Review row) — there are 28 DCRs. Replace the
  enumeration with a pointer to the register (or to `ls QMS/DHF/DCR/`), not a longer list
  that will drift again.

### D6. README describes an asset architecture that no longer exists

Verify first (`grep -rn "cdn.tailwind\|fonts.googleapis" web/*.html`): Tailwind is vendored
at `web/vendor/tailwind.js`; Google Fonts do load from CDN and the service worker caches
them opportunistically.

- Search `Tailwind CSS (CDN)` (stack table) → "Tailwind CSS (vendored, `web/vendor/`)".
- Search `all assets served locally except Tailwind CSS CDN and Google Fonts` → all assets
  are local except Google Fonts, which are cached by the service worker after first load.
- Search `**Tailwind CSS is loaded from CDN.**` (Limitation 5) → the limitation is now only
  the fonts; either restate it for fonts or self-host the three font families and delete
  the limitation (self-hosting is the better fix; it is also the last blocker to a true
  air-gap claim — optional, and if done, update `sw.js` precache and bump `CACHE_VERSION`).

### D7. TR-001 must be regenerated, not patched

Do not hand-edit TR-001's totals. It is rewritten by the Phase 4 clean run. Confirm while
there: §1 "Command:" must match the evidence bundle's `command.txt` (a prior review found
them disagreeing).

## Phase 2 — Make the fixed facts generated

The gap that caused D1: QC-001 checks only `measureDocuments()`; test totals are written
only when someone runs `--write`, and TR-001 is written by a different tool at a different
time. Close it so totals have one source and disagreement fails the suite.

1. **Marker syntax.** In the live documents from D1, wrap each generated figure:
   `<!-- qms:fact tests_total -->939<!-- /qms:fact -->`. Facts to define:
   `tests_total`, `tests_node`, `tests_browser`, `tests_skipped`, `evidence_run_id`.
   Markdown comments render invisibly; keep the visible text exactly as it was.
2. **Writer.** Extend `scripts/qms-run-tests.js`: after a successful run it already writes
   the evidence bundle and TR-001 — add a step that rewrites every `qms:fact` marker in the
   live documents from the run it just recorded. One writer, one moment, one source.
   Also write the same facts as `QMS/DHF/TestEvidence/<run>/facts.json`.
3. **Checker.** Add to `tests/14-qms-counts.test.js` (continue numbering from QC-019):
   - **QC-019:** every `qms:fact` marker with the same key carries the same value across
     all live documents (pure cross-document comparison — no spawning needed, so it can
     run inside the suite).
   - **QC-020:** the marker values equal `facts.json` in the newest evidence bundle whose
     `environment.txt` says `tree_state=clean`. Skip with a message if no clean bundle
     exists yet — but Phase 4 creates one, so in the final state this executes.
   - Keep both tests dependency-free and fast, matching the style of QC-012…QC-016.

## Phase 3 — Prevent the next recurrence class

Each of these is one small test in suite 14, in the existing style (targeted reads +
regexes, no new infrastructure):

1. **QC-021 — closure coherence.** Parse RA-001 for hazard rows whose status column
   contains `Closed`. Assert none of those hazard IDs appears in DHF-001 §7.4 (open
   items) or in a REF-001 §5 gap-table row marked `Open`. This is D2/D3 as an invariant.
2. **QC-022 — capability claims match exports.** Table-driven: for each pair of
   (export present in `WBCCore`, forbidden claim regex), assert no live document or
   shipped source comment states the claim. Seed with one row:
   `ratioInterval` ⇒ forbid `/no (confidence )?interval is computed for a ratio|ratio carries no confidence interval/i`
   in `web/scripts/*.js`, `QMS/DHF/SRS-001*.md`, `QMS/DHF/REF-001*.md`, `web/*.html`.
   Scope excludes `QMS/DHF/DCR/` (historical). Structure it so the next closed capability
   is one added row.
3. **QC-023 — release-evidence gate.** In `scripts/qms-run-tests.js`: when
   `tree_state=DIRTY`, keep stamping the bundle PROVISIONAL (already implemented) but
   **refuse to update TR-001 or the fact markers** unless `--provisional` is passed
   explicitly, and never mark such a bundle as the reporting run. Add a QC test that the
   newest bundle TR-001 cites has `tree_state=clean`.
4. **Drift ledger.** Create `QMS/DHF/DRIFT-LOG.md`: one table — incident id, date detected,
   claim, where stated, where contradicted, root cause, detected by (review / QC id),
   fixed in (DCR), prevented by (QC id). Seed with the seven items above (D1–D7) plus the
   four propagation failures DCR-022 §4 records and the two DCR-027 records (stale brief
   checklist; withdrawn citation). Append-only; one line per incident. This file is the
   dataset for any future write-up of the QMS-as-drift-control method — keep entries
   factual and dated.

## Phase 4 — Re-baseline on a clean tree

1. Commit everything from Phases 1–3 (with DCR-029) so the tree is clean.
2. `npm run test:qms` (ensure it runs both layers — Node and Playwright — and that
   `command.txt` records what actually ran; browsers must be installed:
   `npx playwright install chromium firefox webkit`).
3. Confirm: new bundle has `tree_state=clean`; TR-001 regenerated from it; fact markers
   rewritten; `node scripts/qms-counts.js --check` passes; full suite green including the
   new QC-019…023.
4. Fresh-clone sanity: `git clone . /tmp/tessera-clone && cd /tmp/tessera-clone && npm
   install && npm test` — a prior review found an untracked file breaking clean clones;
   verify that stays fixed.
5. Update DCR-029 status, `DHF-001` revision history, and regenerate
   `SIGNOFF-REGISTER.md` (`node scripts/qms-signoffs.js --write` or as the script
   documents).

## Phase 5 — Write `CLAUDE.md` (the standing contract for AI-assisted sessions)

Create `CLAUDE.md` at the repo root. This encodes the QMS as the drift-control mechanism
for AI-assisted development — the reason this file matters is that most of the drift fixed
above was introduced by capable sessions editing one document and not sweeping the others.
Content, in this order, kept under ~80 lines:

1. **What this project is** (two sentences) and that it is a controlled QMS repository:
   every change set gets a DCR from `QMS/DHF/DCR/DCR-TEMPLATE.md`.
2. **The five governing principles** from the top of this file, restated briefly.
3. **The closure sweep** — the core rule. When any hazard, gap, limitation, or "open item"
   is closed, the same session must sweep, in order: `RA-001` (hazard row + revision
   history), `DHF-001` §7.4 open items, `REF-001` §5 gap table, `SRS-001` rationale text,
   shipped source comments and user-facing strings, `web/methods.html` /
   `calculation-reference.html`, and the QC-022 claims table (add a row for the new
   capability). Closing without sweeping is how every recurrence in `DRIFT-LOG.md`
   happened.
4. **Never hand-edit generated content:** fact markers, count tables (`qms-counts.js
   --write`), `SIGNOFF-REGISTER.md`, TR-001, `VERIFICATION-INDEX` registers. Run the
   generator instead.
5. **Before every commit:** `npm test` (suite 14 is the document gate); before claiming
   release evidence: clean tree + `npm run test:qms`.
6. **Do not** reduce the configuration surface, renumber requirement/hazard IDs, edit
   closed DCRs or revision-history rows, or add runtime dependencies — any of these
   requires an explicit DCR stating why.
7. **When documenting a number, measure it** — point at the scripts that measure.

## Acceptance criteria

- [ ] `grep -rn "1039" README.md QMS/DHF/RTM-001* QMS/DHF/CLINICAL-REVIEW-BRIEF.md` → no matches (values now generated and current).
- [ ] One test total, one skip count, everywhere; QC-019/020 enforce it.
- [ ] `grep -rn "no confidence interval is computed for a ratio\|carries no confidence interval" web/ QMS/DHF/SRS-001* QMS/DHF/REF-001*` → no matches; QC-022 enforces it.
- [ ] HA-093 consistent everywhere outside `DCR/`; QC-021 enforces the class.
- [ ] DHF-001 §7 contains no hardcoded document counts or DCR enumerations.
- [ ] README asset claims match `grep` reality.
- [ ] Newest evidence bundle: `tree_state=clean`; TR-001 cites it; `command.txt` matches TR-001's stated command.
- [ ] `DRIFT-LOG.md` seeded; `CLAUDE.md` exists; DCR-029 complete; fresh clone passes `npm test`.
- [ ] No preset, schema field, rounding method, or CI level was removed.
