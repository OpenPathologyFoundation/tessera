# Profile Naming — Instructions for Claude Code

Task: rename the shipped configuration profiles so that names state contents rather than
assertions, fix two defects found during the naming review, and add the guards that make
the naming rule permanent. One change set, one DCR (next free number).

Read `CLAUDE.md` first and follow it: this closes items and touches user-facing strings,
so the closure sweep applies. Log the two defects below in `DRIFT-LOG.md` (next incident
numbers). Historical records (closed DCRs, revision histories, TestEvidence, `evidence/`)
are never edited — the old names inside them are facts.

## 1. The naming rule

A profile name states what the profile IS: tallied category count and the defining
trait. Provenance, endorsement and rationale live in `description` and
`provenance.notes`, stated as facts with citations. Banned in names: value and status
words — legacy, consensus, harmonized, modern, classic, full, minimal, standard.

The count in a name is the number of **tallied categories** (what the operator sees as
rows/keys). Where the differential denominator is smaller (NRBC excluded in PB), the
description states it: "10 tallied categories; NRBC reported per 100 WBC, leaving a
9-category leukocyte differential."

## 2. The renames

Rename ids as well as display names — ids print in report footers (URS-052) and exports,
there are no deployed users yet, and after the first pilot the old ids are in archived
records permanently. Rename the preset files to match their ids; update
`index.json` (`profileId`, `file`, `name`, `summary`) and `templates.json` (which embeds
the default profile's `profileId`/`profileName`).

| Old id | New id | New profileName |
|---|---|---|
| `consensus-14` | `ndc-14` | 14-Type Nucleated Differential |
| `harmonized-9` | `gran-combined-10` | 10-Type — Bands+Segs Combined |
| `legacy-9` | `bands-segs-10` | 10-Type — Bands & Segs Separate |
| `minimal-5` | `analyzer-5` | 5-Type — Analyzer Categories |
| `body-fluid` | `body-fluid` (keep) | Body Fluid — 7 Types |
| `custom` | `custom` (keep) | Custom (Blank Template) |

Bump each renamed profile's `version`. Verify what the app does when
`localStorage.wbcds_config` holds a cached profile whose `profileId` no longer exists in
the catalog (`isCacheSuperseded` matches on identical id only). If the cached profile
would silently persist, add a one-time notice offering to load the renamed successor —
do not silently replace an operator's active configuration.

## 3. New descriptions (draft — adjust wording, keep every factual claim)

- **ndc-14**: "The 13 categories of the ICSH 2008 §2.6 nucleated differential count,
  plus an `other` category that has no ICSH counterpart (see its guidance for what must
  not be counted there — RA-001 HA-090). Bone marrow target 500, peripheral blood 200.
  In blood, NRBC are tallied but excluded from the differential denominator and reported
  per 100 WBC."
- **gran-combined-10**: "Ten tallied categories. Band and segmented neutrophils are
  counted as one granulocyte category: the band/seg split is the least reproducible
  distinction between observers (REF-001 [S8]). Promyelocytes counted separately. In
  blood, NRBC are reported per 100 WBC, leaving a 9-category leukocyte differential."
- **bands-segs-10**: "Ten tallied categories matching mechanical bench-counter layouts
  in current use: bands and segmented neutrophils counted separately. No separate
  promyelocyte, plasma-cell or mast-cell rows — see category guidance for where those
  cells are recorded. Includes the blasts-of-non-erythroid-cells formula for comparison
  against pre-2016 reports (withdrawn by WHO 2016; see calculation reference)."
- **analyzer-5**: "The five categories automated analyzers report (the '5-part
  differential'): neutrophils, lymphocytes, monocytes, eosinophils, basophils.
  Peripheral blood only; target 100."
- **body-fluid**: "Seven categories for CSF, serous and synovial fluid differentials,
  including mesothelial and malignant cells. Basis: laboratory practice informed by
  CLSI H56; H56 is not held in full text (REF-001 [S3])."

## 4. Two defects to fix and log as drift incidents

1. **`harmonized-9` self-contradiction.** The id says 9, `profileName` says "10-Part",
   the description says "Modern consensus 9-part differential" and lists nine categories
   while the profile tallies ten. Resolved by the rename + new description. Log it: the
   name, the id and the description were three writers for one fact.
2. **Copy-pasted provenance reaching clinical reports.** `minimal-5` and `body-fluid`
   carry `provenance.notes` = "Bone marrow categories and M:E ratio follow ICSH 2008
   §2.6" with no `bm` specimen and no M:E formula; the note prints in the report method
   statement ("Basis:"), so those reports state a false basis. The 10-type profiles'
   identical note also overclaims: their BM categories are aggregations, not the ICSH
   list. Rewrite each `provenance.notes` to claim only what that profile implements:
   - ndc-14: keep (it is true there).
   - gran-combined-10 / bands-segs-10: "M:E ratio composition follows ICSH 2008 §2.6.
     Categories are an aggregated subset of the ICSH nucleated differential count."
   - analyzer-5: "Categories match the automated analyzer 5-part differential."
   - body-fluid: "Practice-based body fluid panel; see CLSI H56 (REF-001 [S3])."

## 5. The plasma-cell question (resolve, do not skip)

`bands-segs-10` (and `gran-combined-10`) BM panels have no plasma-cell or mast-cell
category. A marrow containing them gives the operator no key. Decide and document —
in the profile's category guidance and in the description — where such cells go
(morphology comment is the existing HA-090 pattern for excluded cells). If the answer
is "this profile is unsuitable for marrows where plasma cells matter," say exactly
that. Add or extend an RA-001 hazard row if the risk analysis does not already cover
an aggregated profile receiving cells it has no category for.

## 6. Guards (suite 09, continue the VV-PRE series)

1. Any integer appearing in `profileName` or the `index.json` `name` equals the tallied
   category count of every specimen in that profile.
2. `index.json` `name` equals the preset file's `profileName`; `profileId` equals the
   filename stem.
3. If `provenance.notes` mentions bone marrow or M:E, the profile contains a `bm`
   specimen; if it mentions M:E, an `ME_ratio` formula exists.
4. Name denylist: profileName and index name contain none of the banned words in §1.
5. Follow the repo rule: revert-check each guard (restore one old name, confirm the
   guard fails with the expected message).

## 7. Sweep (live documents and tests that name the profiles)

`README.md`, `USER-GUIDE.md`, `web/help.html`, `web/calculation-reference.html`,
`web/methods.html` if it names profiles, and the live QMS documents that reference
`consensus-14` by name (`REF-001` §3.1, `URS-001 v2.0`, `SDD-001`, `VV-001`, `TP-001`,
`DHF-001` live sections — reference as "ndc-14 (formerly consensus-14)" on first
mention so the historical record still connects). Update test expectations in suites
01, 05, 08, 09, 11, 12, 13 — run the suite and let the failures enumerate the rest.
Then the full gate: `npm test`, clean tree, `npm run test:qms` re-baseline.

## Acceptance

- [ ] No banned word in any shipped profile name or index entry; guard enforces.
- [ ] Every number in every profile name equals its tallied category count; guard enforces.
- [ ] Every `provenance.notes` claims only what its profile implements; guard enforces the bm/M:E class.
- [ ] Plasma-cell/mast-cell disposition documented in both 10-type profiles.
- [ ] Cached-config behavior on renamed ids verified and handled.
- [ ] Two incidents appended to `DRIFT-LOG.md`; DCR complete; clean-tree evidence run.
- [ ] No category, formula, threshold, CI level or other configuration surface removed.
