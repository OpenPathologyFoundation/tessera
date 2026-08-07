# CLAUDE.md — working agreement for this repository

WBC ΔΣ is a keyboard-driven manual differential counter for haematology. It is a
**controlled QMS repository**: `QMS/DHF/` is a Design History File under IEC
62304 Class A, and every change set gets a change record from
`QMS/DHF/DCR/DCR-TEMPLATE.md`.

Read `QMS/DHF/DRIFT-LOG.md` before your first substantive change. It records
every occasion on which this file claimed something that had stopped being true.
**All but three were introduced by sessions doing correct work** — the log's §4
names the three exceptions, which is how it states the proportion without
carrying a number that goes stale. That is the failure
mode this document exists to prevent, and it is not a failure of care: it is
what happens when a capable session updates the one document in front of it.

*No count appears in this paragraph on purpose.* It used to say "21 occasions …
Sixteen", and both figures went stale one change record later — in the file that
tells you not to state a measured fact from memory. That is incident 24 in the
log, and the remedy is the one principle 2 gives: point at the source instead of
copying from it.

## Governing principles

1. **Live documents vs historical records.** Fix drift in live documents:
   `README.md`, `RTM-001`, `TR-001`, `DHF-001`, `REF-001`, `SRS-001`, `RA-001`,
   `CLINICAL-REVIEW-BRIEF.md`, source comments, shipped strings. **Never**
   retro-edit a closed DCR or a revision-history row. DCR-027: rewriting the
   record of a decision falsifies it. A stale number inside DCR-022 is a
   historical fact.
2. **One source of truth per fact.** Test totals → the evidence run, via
   `qms:fact` markers. Requirement/hazard/register counts → `qms-counts.js`.
   Signature status → `SIGNOFF-REGISTER.md`. Product version → `package.json`.
   No live document states one of these from memory. Two writers for one fact is
   itself the defect — `qms-counts.js` was one of two for a while, and that is
   incident 16.
3. **Configurability is the product, not overhead.** Total configurability of
   counting policy is the point of this tool. Do not remove presets, schema
   fields, rounding methods or CI levels to simplify something. Where
   configurability creates a consistency obligation, add the **check**, not the
   cut.
4. **Extend the machinery that exists.** `scripts/qms-counts.js`,
   `qms-facts.js`, `qms-signoffs.js`, `qms-verification-index.js` and
   `tests/14-qms-counts.test.js` are the drift-control system. Add to them. No
   new framework, no new dependency, no parallel script.
5. **Measure every number you write.** Never copy a figure from a document,
   an issue, or an earlier session. Run the tool and use its output.

## The closure sweep — the core rule

When you close **any** hazard, gap, limitation or open item, the same session
sweeps all of these before it finishes:

1. `RA-001` — the hazard row **and** its revision history
2. `DHF-001` §7.4 — outstanding items
3. `REF-001` §5 — the gap table
4. `SRS-001` — the requirement's stated rationale, not just its text
5. Shipped source comments and operator-facing strings
6. `web/methods.html`, `web/calculation-reference.html`
7. The QC-025 claims table in suite 14 — add a row for the new capability
8. `QMS/DHF/DRIFT-LOG.md` — if the closure revealed a stale claim, log it
9. **This file.** The sweep used to end at step 8, and that omission is
   incident 24: DCR-030 appended two rows to the log and left `CLAUDE.md`'s
   opening paragraph describing a smaller one. The document that tells you to
   sweep is itself swept last, and it is the step easiest to skip because you
   have stopped thinking of it as a document by then.

Closing without sweeping is how nearly every incident in the drift log happened.
The tests that catch the *class* are QC-024 (a hazard closed in one document is
not open in another) and QC-025 (a shipped capability is not described as
absent). They do not know about any particular hazard, which is the point.

## Never hand-edit generated content

Run the generator instead:

| Content | Generator |
|---|---|
| `qms:fact` markers, `facts.json` | `npm run test:qms` (clean tree) |
| Count tables in README, RTM-001 | `node scripts/qms-counts.js --write` |
| `SIGNOFF-REGISTER.md` §3 | `node scripts/qms-signoffs.js --write` |
| Verification registers in VV-001, TP-001 | `node scripts/qms-verification-index.js --write` |
| TR-001 totals and run log | `npm run test:qms` |

## Before you finish

- `npm test` — suite 14 is the document gate; it fails on stale figures,
  disagreeing documents, unswept closures and missing licence notices.
- Before claiming release evidence: **clean tree**, then `npm run test:qms`. A
  bundle from a dirty tree measures code that exists in no commit and is marked
  PROVISIONAL; it will not write the documents without `--provisional`.
- Revert-check every new test: remove the fix, confirm the test fails with the
  original symptom. More than once in this repository a test has passed against
  broken code, and twice the revert-check found the test wrong before the code.

## Requires an explicit DCR stating why

Reducing the configuration surface · renumbering requirement or hazard IDs ·
editing a closed DCR or a revision-history row · adding a runtime dependency ·
changing the licence or the reserved marks (`LICENSE`, `NOTICE`,
`TRADEMARKS.md`).

## Not your call

`sources/` holds copyrighted journal PDFs and is git-ignored — never commit it.
The repository is public. Clinical conventions where practice legitimately
disagrees ship as **selectable options**, not as a default imposed by whoever
implemented them.
