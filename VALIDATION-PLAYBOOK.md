# Validation Playbook — for Peter

Step-by-step from today's tree (v2.22.3, DCR-039) through executed validation,
signatures, and the release baseline. Each step says *where*, *what*, and *why*.
Hand nothing here to Claude Code except where marked — this is your checklist.

## The map — where everything lives

| File | What it is |
|---|---|
| `web/counter.html` | The application validators use (serve `web/`; `npm run serve` → http://localhost:8089) |
| `QMS/DHF/VV-001-VerificationValidationProtocol.md` **§5** | The validation protocol: §5.2 participants, §5.3 environment, §5.4 scenarios V1–V6, §5.4.1 tones A/B, §5.5 acceptance criteria, §5.6 report template |
| `QMS/DHF/SOP-001-StandardOperatingProcedure.md` | Operator SOP — print fresh copies; its own header withdraws v1.0 prints |
| `QMS/DHF/SOP-002-Deployment.md` | How to deploy for the sessions |
| `QMS/DHF/CLINICAL-REVIEW-BRIEF.md` | The reading packet for your clinical reviewer |
| `QMS/DHF/SIGNOFF-REGISTER.md` | **Generated** — every outstanding signature (34 Clinical Reviewer, 2 Clinical User Rep) and, in §2, the four DCRs carrying a specific question |
| `QMS/DHF/DRIFT-LOG.md` | The incident dataset (paper 1's Table 1 source) |
| `CLAUDE.md` | Standing rules for any future Claude Code session |
| `VALIDATION-READINESS-REVIEW.md` | The go/no-go review and its 08-08 re-check |
| `manuscript/` (gitignored) | `PAPER-1-OUTLINE.md`, `PAPER-1-DRAFT.md` |
| `REVIEW-2026-08-06.md`, `*-PROPOSAL.md`, `CLAUDE-CODE-DRIFT-REMEDIATION.md` | Executed work orders — historical; consider moving to `archive/` so the repo root is clean for validators |

## Phase 0 — Confirm the baseline (10 minutes, today)

1. `cd` to the repo; run `git status` → must be clean; `npm test` → all pass.
   *Why:* validation evidence must tie to one commit; a dirty tree makes the
   run inadmissible by your own gate (`qms-facts.js` enforces this).
2. Run `npm run test:qms` and confirm the new bundle in
   `QMS/DHF/TestEvidence/` says `tree_state=clean` and TR-001 cites it.
   *Why:* TR-001 is part of what the clinical reviewer signs; it must report
   the exact code validators will touch.
3. Tag it: `git tag v2.22.3-validation && git push --tags`.
   *Why:* SOP-002 requires a tagged release, and the validation report names
   the version; "whatever main was that week" is not a validated artifact.

## Phase 1 — Deploy for the sessions (30 minutes)

4. Follow `SOP-002`: simplest is `npm run serve` on the validation
   workstation, or copy `web/` to your institutional static host.
   *Why serve, not file://:* the service worker and clipboard need an origin.
5. On the actual machine validators will use: load the app, then kill the
   network and reload.
   *Why:* offline behavior is a shipped claim (self-hosted fonts, DCR-030);
   verify it where it matters, not on your laptop.
6. Confirm the browser is on the supported list (Chrome/Firefox/Edge current)
   and the default profile loads as **14-Type Nucleated Differential**.

## Phase 2 — People and paperwork (before any slide is counted)

7. Recruit per **VV-001 §5.2**: two medical technologists, one
   hematopathologist, one hematology fellow.
   *Why these:* the protocol pre-specified them; deviating means amending
   VV-001 first, not explaining later.
8. **IRB/QI determination in writing now** if observer ratings might appear in
   paper 3. It will likely be exempt QI — but the determination must predate
   data collection, because you cannot get it retroactively.
9. Slides: de-identified or teaching-set slides. Case IDs: non-PHI references
   (e.g. `VAL-01`).
   *Why:* autosave persists case IDs and comments in browser localStorage on
   the workstation — SOP-001 §7 now discloses exactly this; behave as it says.
10. Print fresh **SOP-001** copies; collect and discard any older print.
    *Why:* SOP-001's own status line withdraws v1.0; a validator following a
    stale print recreates incident 9.
11. Give the hematopathologist `CLINICAL-REVIEW-BRIEF.md` plus
    `SIGNOFF-REGISTER.md` §2 in advance. §2 contains the four decisions that
    need an actual opinion, not just a signature:
    - **DCR-016 §4 — corrected WBC.** *This one gates a feature:* absolute
      counts stay formally blocked until it is signed.
    - **DCR-022 §5 — device status** (non-device CDS analysis).
    - **DCR-026 §6 — the M:E interval model** (comment invited).
    - **DCR-027 §6 — the withdrawn Rümke citation** (comment invited).
    *Why in advance:* these are reading decisions; session time is for slides.

## Phase 3 — Run the sessions (~60 minutes per participant)

12. Scenarios **V1–V6** from VV-001 §5.4, in order, exactly as scripted — the
    keystrokes were verified against the shipped profile (B=nrbc, X=blasts,
    F=poly; that verification is what fixed incident-class "V6 unexecutable").
    Record pass/fail and observations per the tables as you go, not after.
    *Why each scenario exists:* V1 happy path (the tool does the basic job);
    V2 sub-target advisory (advisory, never blocking — URS-041); V3 reset
    protection (data loss); V4 comments isolation (typing must not count
    cells); V5 Continue Counting (the near-threshold workflow ICSH §2.6
    motivated); V6 M:E with its confidence interval (DCR-026's clinical
    question, exercised live).
13. **§5.4.1 tones comparison**: two practice slides per participant, one in
    Click, one in Tones; alternate which mode each participant starts with.
    Collect the four measures in the table.
    *Why the order alternation:* order effects otherwise masquerade as mode
    preference. *Why you cannot adjust the adoption call afterward:* the
    decision rule is pre-registered in §5.4.1 — majority preference AND not
    rated more annoying. That pre-registration is the point; honor it.
14. Anything unexpected a validator hits: write it down verbatim, keep going.
    Defects found in session go to the drift-log/DCR pipeline afterward —
    do not fix anything mid-study, or the participants validated different
    software.

## Phase 4 — Signatures and closure (the week after)

15. Fill **VV-001 §5.6** (the report template) from the session sheets.
16. Signatures go into the signature tables **of the source documents**
    (each QMS doc's Approval section), never into `SIGNOFF-REGISTER.md` —
    then regenerate: `node scripts/qms-signoffs.js --write`.
    *Why:* the register is generated; hand-editing it is the two-writers
    defect (incident 16's class) inside the signature system.
17. Open one DCR for the validation results; attach the report; if §5.5
    acceptance criteria are met, update DHF-001 status to a released
    baseline. Clean tree, `npm run test:qms`, done.
    *Why one DCR:* the validation is one event; its record should be one
    change set the way DCR-004 is one story.
18. If the tones rule was met, flip the profile default in the same DCR and
    cite §5.4.1. If not met, record that too — a pre-registered negative
    result is a result.

## Phase 5 — The papers (any time after Phase 4)

19. Tag the post-validation release; mint a Zenodo DOI for it.
20. Reconcile `manuscript/PAPER-1-DRAFT.md` against that tag. On the clean
    tree at the tag: `npm run replay`, then
    `node scripts/qms-paper-facts.js --write` (regenerates `replay/facts.json`
    and rewrites the manuscript's `qms:fact` markers), then
    `npm run lint:manuscript` — every number it lists is one the draft still
    types instead of reading. Numbers that have certainly moved: incident
    count, DCR count, test totals, and the baseline test count (incident 53).
    *Why at the tag and not at submission:* the paper must describe a commit
    a reviewer can check out, or the paper about drift has drifted.
21. Fill the two TODO citations, venue author guidelines, AI-assistance
    disclosure, submit per the venue order in `PAPER-1-OUTLINE.md` §4.
22. Paper 3 (tool validation) now has its dataset: the §5.6 report and the
    tones A/B table.

## If something goes wrong on session day

- App won't load / SW weirdness: hard-reload once (Shift+reload); if
  persistent, `npm run serve` on a different port — do not debug live in
  front of validators.
- A validator finds a real defect: note it, finish the scenario list anyway
  if usable, and decide afterward whether it invalidates the session — that
  decision goes in the report, not in the moment.
- A scenario step doesn't match the screen: stop that scenario, mark it
  failed-as-written, continue with the next. A protocol/product mismatch is
  a finding, not an embarrassment — you have a log that exists precisely
  because those are worth recording.
