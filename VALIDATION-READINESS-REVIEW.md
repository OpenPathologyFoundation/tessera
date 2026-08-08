# Validation Readiness Review — 2026-08-07

> **Re-check 2026-08-08 (v2.22.2, HEAD 530eb82, suite 703/703, clean-tree
> bundle at DCR-038):** all six blockers are fixed — SOP correction example,
> VV-001 V6 keys (now B/F/X with correct interval expectations), monthly QC,
> storage claim (now a model §7 disclosure), case-number gating, help.html
> catalogue (guard extended to help.html in suite 13). V7 (Click-vs-Tones A/B)
> is in VV-001 with the pre-specified decision rule. USER-GUIDE,
> calculation-reference, and most of README are clean. **Verdict upgraded to
> CONDITIONAL GO** for BM/PB validation on ndc-14. Remaining punch list, none
> of it in the validators' critical path:
>
> - **README:24** still claims a blocking "warning dialog with explicit
>   override" below threshold; completion is advisory. (MAJOR — last survivor
>   of the README cluster.)
> - **SOP-001 §5.9 (~line 232)** still quotes a case-number-change dialog that
>   does not exist; **§7 item 6 (~line 338)** still says keys are fixed and
>   only the director can change them; **revision history still ends at
>   Rev A** while the header claims v2.0/DCR-015. (MAJOR ×3 — SOP stragglers.)
> - **analyzer-5 `targetCountBasis`** still explains a 200-cell default on a
>   100-cell profile, and prints in that profile's report method statement.
>   **body-fluid `categoryNotes.other`** gained a correct first sentence but
>   still tells operators to record metastatic tumour cells in the morphology
>   comment — this panel has a `malignant` category for them. (MAJOR ×2 —
>   matter only if those profiles are exercised; they are not in the BM/PB
>   pilot.)
> - **Editor typeability rule** (shifted-character keys that can never
>   increment) not yet added to `validateConfig`/editor. (MAJOR — cannot
>   affect shipped presets; affects only locally built profiles.)
> - Minors unchanged: click/chime node disconnect, QC-025 rows for
>   DCR-035/036 capabilities, `provenance.standard` on analyzer-5/body-fluid,
>   README features table still silent on the three audio modes.
>
> Condition for the GO: validators use ndc-14 on BM/PB slides and are told to
> ignore SOP §5.9 Method 1 (use the New Case button, which §5.9 Method 2 —
> and the app — actually provide). Land the punch list in the next DCR; none
> of it blocks scheduling sessions.

Reviewed at HEAD `3fb1d52` (v2.22.0), Node suite executed (700 pass / 0 fail),
newest evidence bundle clean-tree and cited by TR-001 (1147 total: 700 Node +
447 browser, 7 skips). A concurrent session was preparing DCR-037 during this
review; nothing below overlaps its visible diff except where noted.

## Verdict

**NO-GO for pathologist hand-off today. GO after one corrective documentation
DCR — roughly a day of work.** Every blocker is in what validators will read or
follow, not in what the software does. The code layer passed: keyboard
increment/decrement verified for every key of all seven presets, tonal feedback
implemented to spec, the rename migration is decline-by-default, the Basis line
now renders, and every numeric example published in the reference pages
reproduces exactly against the shipped engine.

## Blockers — fix before any validator touches the tool

1. **SOP-001:162** — the miscount-correction example says "You pressed 'A'
   (blast) but meant 'V' (lymph)." Shipped default: A = **monocytes**,
   V = myelocytes, X = blasts, S = lymph. Wrong clinical instruction in the
   exact procedure validators will rehearse.
2. **VV-001 Scenario V6 (~lines 1134–1136)** — the validation script itself
   instructs "Press 'R' ×100 (nrbc)", "Press 'P' ×300 (poly)", "Press 'L' ×50
   (blasts)". R = pro; P and L are unmapped. **The scenario cannot be executed
   as written.** Sweep all six scenarios (V1–V6) against ndc-14 keys before
   sessions are scheduled.
3. **SOP-001:257–258** — the mandated monthly QC procedure enters categories
   (`gran`, `eryth`) that do not exist in the default profile and cites
   VV-CALC-007, which is not in the current suite. Unexecutable as written.
4. **SOP-001:276** — "No data is stored in permanent browser storage." False:
   autosave writes accession number, counts and morphology text to
   localStorage. The privacy attestation a validating lab signs must be true.
5. **SOP-001:68, 79 (+§5.2)** — describes a disabled Start button gated on a
   validated case number. No such gating exists; the field is optional in every
   shipped profile.
6. **web/help.html:161, 164** — the in-app help lists the preset catalogue as
   "full 14-part consensus, harmonized 9-part, legacy 9-part, minimal 5-part…
   frequency-ergonomic, right-hand." Every name is withdrawn or nonexistent,
   and the page is precached offline. This is drift incident 25 recurring on a
   page its guard (UD-095) does not cover.

## Major — should land in the same DCR

- **README.md** features/configuration sections: "Mandatory case/accession
  number" (false), targets "200 BM / 100 PB" (those are mdc-2015-9's; default
  is 500/200), "warning dialog with explicit override" (completion is
  advisory), `minCellCount` instructions (field does not exist — flagged in the
  2026-08-06 review and never fixed), right-hand preset, "Consensus-14",
  `{{blast}}` placeholder example, fonts row contradicting the self-hosted
  reality, and no mention of the three audio modes.
- **USER-GUIDE.md:77–78, 164–170** — recommends "Full 14-Part Consensus" and a
  right-hand preset; neither name exists post-DCR-035.
- **calculation-reference.html:372–374** — claims an `ndc-14-me-alt` preset
  ships; it does not (the convention lives in the editor).
- **analyzer-5.json** — `targetCountBasis` text describes a 200-cell basis for
  a 100-cell target, and it prints in the report method statement.
- **body-fluid.json** — `categoryNotes.other` is the bone-marrow note verbatim,
  telling operators not to count macrophages and malignant cells — categories
  this panel exists to count.
- **VV-001** — the tones Click-vs-Tones A/B comparison and its pre-specified
  decision rule (required by the tonal-feedback DCR's acceptance criteria) are
  not in the validation scenarios. Add as V7 before sessions, or the pilot
  can't collect it.
- **Editor** — a key captured with Shift (e.g. `:` for `;`) validates cleanly
  but can never increment (unshifted press doesn't match; shifted press is the
  decrement path). Add a typeability rule to `validateConfig` and filter in the
  editor. No shipped preset is affected.
- **SOP-001** — additionally: "Save & Switch" described as unconditional (it is
  Discard when no case number), a case-number-change flow that doesn't exist
  (§5.9), "keys are fixed, contact the director" contradicting the editor
  (§303), and a revision history that ends at Rev A while the header claims
  v2.0/DCR-015.

## Minor — batch when convenient

mdc-2015-9 assigns myelocytes to two categories in its operator-facing notes
(`pro` note vs `gran` provenance — fold into the already-invited clinical
review of DCR-032 §3); stale "shipped right-hand preset" comment at
mdc-app.js:~1128; click/chime paths never disconnect audio nodes (tones path
does — copy the pattern); the admissibility predicate is duplicated between
qms-facts.js and qms-run-tests.js (two writers, agreeing today); QC-025 claims
table gained no rows for DCR-035/036 capabilities; `provenance.standard` still
cites the ICSH BM guideline on analyzer-5/body-fluid (the rendered `notes` are
correct); SOP-001:110 says profile v2.5, shipped is v2.6.

## Process observation (drift-log material)

Three of the README blockers/majors were flagged in the original 2026-08-06
independent review and survived six DCRs of remediation — because no incident
row or guard was ever created for them. The lesson already encoded elsewhere in
this repo applies: an external finding that does not become a drift-log row
with a guard does not stay fixed. Log the help.html recurrence (incident 25's
class on an unguarded page) and extend the UD-095-style catalogue check to
every operator-facing page (help.html, README, USER-GUIDE, calculation
reference) by grepping them against `index.json` names — guard the class, not
the file.

## Hand-off checklist once the DCR lands

- [ ] All six VV-001 scenarios executable keystroke-by-keystroke against ndc-14; V7 (tones A/B, decision rule) added.
- [ ] SOP-001 corrected end-to-end, revision history updated, reprinted copies distributed (v1.0/v2.0 withdrawal noted).
- [ ] help.html / README / USER-GUIDE / calculation-reference swept; catalogue guard covers all operator pages.
- [ ] Drift-log rows appended; clean-tree `npm run test:qms` re-baseline; suite green.
- [ ] Validation logistics: de-identified or practice slides; instruct validators to use non-PHI case identifiers on shared workstations (autosave persists them locally); supported browsers on the validation machines; offline/service-worker behavior spot-checked on the actual deployment host (SOP-002 itself audited clean).
- [ ] SIGNOFF-REGISTER and CLINICAL-REVIEW-BRIEF regenerated after the DCR (in flight as DCR-037) so validators sign a current document set.
