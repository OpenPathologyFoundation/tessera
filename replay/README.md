# Replay — does the build still catch what the drift log records?

This directory is the public, generated evidence behind the manuscript about
this repository's drift-control machinery. It asks two questions of every row
in `QMS/DHF/DRIFT-LOG.md`:

1. **Instance.** If the exact contradiction that row records were re-introduced
   today, would the build go red?
2. **Class.** If a *different* contradiction of the same root-cause class were
   introduced, would the build go red?

The first replaces "N of M guarded" in the log with a measured number. The
second tests the manuscript's central mechanism claim — that the gates are
written as classes rather than instances — and measures the limitation the
log's §3 already admits.

Nothing here changes what the application does. The replay is a measurement of
the verification suite, and it is run against a fixed commit on a clean tree so
the result describes something a reader can check out.

## What is in here

| Path | What it is | Written by |
|---|---|---|
| `incidents.json` | One entry per drift-log row: root-cause class, detection class, dates where the row or its change record states them, the guard the log names, and whether the row was logged live or reconstructed. The classification is **proposed** by the session that built this directory and awaits the author's confirmation (DCR-043 §5). | Hand, once; checked by QC-029 |
| `patches/NN-instance.json` | The row's own contradiction, re-created as literally as the current tree allows | The DCR-043 session, from the log row and the artifact's current text |
| `patches/NN-class.json` | A different instance of the same class | A fresh AI session given only the log row and the class definition — never the consistency suite. The file records its builder. |
| `run.js`, `run.sh` | The runner. `run.sh` is the entry point the protocol names; it calls `run.js`. | — |
| `results.json` | The last run: every patch, its outcome, the checks that fired, the commit it ran against | `npm run replay` |
| `facts.json` | Every number the manuscript may state, generated from the tree, the log, the evidence bundles and `results.json` | `node scripts/qms-paper-facts.js --write` |
| `baseline.json` | The v2.0 baseline test suite, measured at its commit and classified by kind | `node scripts/qms-paper-facts.js --baseline` |
| `logs/` | Raw runner output per patch. Git-ignored. | `npm run replay` |

## The protocol

1. **Fixed point.** The run names a commit `R` (default `HEAD`; `--ref` for a
   tag). Every patch is applied in a fresh `git worktree` of `R`. The runner
   refuses a dirty tree unless `--provisional` is passed, and a provisional
   result is stamped as such and is not admissible as a fact.
2. **Controls first.** Negative: `R` unmodified must build green. Positive: a
   hand-edited `package.json` version must build red. If either fails the run
   stops; nothing downstream would mean anything.
3. **Instance patch, one per incident.** Mode `edit` re-creates the stale text
   in the artifact that carried it; mode `revert` reverts the fix commit where
   one is identifiable and applies cleanly (none of the first fifty-three uses
   it: each fix here is a change-set commit that also carries the guard it
   introduced, so reverting one would remove the gate with the incident); mode
   `none` records
   why the incident cannot be re-created deterministically. Every patch records
   the files and lines it touched.
4. **Class patch, one per incident.** Built from the log row and the class
   definition in `incidents.json` only, by a builder who has not read the
   consistency suite, and recorded as such. The repository's own subject tests
   the repository's claim.
5. **Run.** `npm test` on every branch — that is the build; suite 14 is the
   document gate and runs inside it. When a patch touches `tests/`,
   `tests-e2e/` or the two verification registers, the register check
   (`node scripts/qms-verification-index.js --check`) runs as well, because
   that is the one gate that must spawn the runners to see a change there. A
   patch may name an `extra_cmd` — a targeted Playwright run — when the guard
   the log names lives in the browser layer. `results.json` records which
   checks ran for each patch.
6. **Classify each run.**

   | Outcome | Build | Failing check | Counts toward coverage |
   |---|---|---|---|
   | `caught` | red | names the contradiction (one of the guards the log row names fired) | yes |
   | `caught_incidentally` | red | a check the row does not name | no — reported separately |
   | `caught_unattributed` | red | the row names no identifiable check, so none could be expected | no — reported separately; input to step 7 |
   | `escaped` | green | none | no — listed by name |
   | `unapplied` | — | the patch no longer applies at `R` | no — the patch needs rebuilding |

7. **Attribute.** `results.json` records, per class, every check that fired.
   Where that differs from what the log row names, the row is what is wrong,
   and the manuscript's Table 1 "now enforced by" column is generated from the
   results rather than written.
8. **Report.** `results.json` carries one row per patch and the summary lines:
   instance coverage k of N, class coverage m of N, incidental catches,
   escapes. `facts.json` carries them onward under `replay.*`.
9. **Keep it.** Patches and runner are committed; results are stamped with
   `R`'s hash. Re-run at every tag. A patch that was `caught` in the committed
   results and is `escaped` in a new run is a **regression**: the runner writes
   the new results and exits non-zero.

## Running it

```bash
npm run replay                      # full run at HEAD on a clean tree
npm run replay -- --ref v2.25.0     # at a tag
npm run replay -- --only 17,18      # two incidents
npm run replay -- --dry-run         # apply and revert every patch; run nothing
npm run replay -- --provisional     # allow a dirty tree; result marked provisional
```

Budget: about seven seconds per patch; a full run is a quarter of an hour.

## Patch file format

```json
{
  "incident": 17,
  "kind": "instance",
  "mode": "edit",
  "builder": "DCR-043 session (Claude), from the log row and the artifact's current text",
  "description": "DHF-001 §7.4 lists HA-093 as outstanding while RA-001 marks it Closed",
  "edits": [
    { "file": "QMS/DHF/DHF-001-DesignHistoryFile-Index.md",
      "find": "4. ~~No interval is computed for the M:E ratio (HA-093).~~ **Closed",
      "replace": "4. No interval is computed for the M:E ratio (HA-093). **Open" }
  ]
}
```

- `find` must occur **exactly once** in the file at `R`; otherwise the patch is
  `unapplied`. Use `"all": true` to replace every occurrence.
- `{"file": …, "create": "…"}` creates a file; `{"file": …, "append": "…"}`
  appends; `{"file": …, "delete": true}` removes one.
- `mode: "revert"` carries `"commit": "<sha>"` instead of `edits`.
- `mode: "none"` carries `"reason"` and is reported as `not_replayed`.
- `extra_cmd` (optional): an argv array run after `npm test`, e.g.
  `["npx", "playwright", "test", "--grep", "VV-SYS-220", "--project=chromium"]`.
- A class patch has `"kind": "class"` and `"same_class_because": "…"`, one
  sentence tying it to the class definition in `incidents.json`.
