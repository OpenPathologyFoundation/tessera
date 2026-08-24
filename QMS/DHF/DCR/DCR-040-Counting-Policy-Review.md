# DCR-040: Design Change Record — Two Counting-Policy Changes from Clinical Review

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-040 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-23 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Review comments from the reviewing haematopathologists |
| **Profile Affected** | `mdc-2015-9` (9-Type — 2015 Counter Layout) |

---

## 1. What This Is

Three review comments from the haematopathologists piloting the tool, and the
two changes they amount to:

1. **Blasts take no part in the M:E ratio** of the profile they count in.
2. **No target cell count is displayed** — with, as a consequence, no sub-target
   advisory and no ICSH basis text beneath it (their third comment).

Both are decisions about counting policy, which belong to the laboratory. What
this record has to establish is that the software can hold each of them
*honestly* — that a profile which departs from ICSH says so where a reader of
the report will see it, and that removing an advisory does not remove the thing
the advisory was there to protect against.

`ndc-14` is untouched, and deliberately: its stated claim is literal ICSH
conformance and SC-010 pins its numerator to the ICSH set. A laboratory
comparing against it must find it behaving as its citation says.

---

## 2. Blasts and the M:E Ratio

### The comment

> Please do not include the blast count in the calculation of the M:E ratio.

### It is right, and for a more specific reason than a difference of convention

ICSH 2008 §2.6 defines the M:E numerator as "all granulocytes and monocytes and
their precursors (i.e. **myeloblasts**, promyelocytes, myelocytes,
metamyelocytes, band forms, segmented neutrophils, eosinophils, basophils,
promonocytes and monocytes)". Two sentences earlier, the same section lists what
the nucleated differential count comprises, and there the category is **"blast
cells"**. ICSH uses the narrower term in the ratio and the wider one in the
count.

This application has one lineage-agnostic `blasts` key. Putting it in the
numerator therefore asserts that every blast counted is a myeloblast — an
assumption that holds in the marrows where the ratio hardly moves, and fails in
the marrows where it moves most. The behaviour being removed was never "the ICSH
convention"; it was the ICSH convention applied to a category that does not
match it.

**None of that is new here, and it should not be presented as a finding.**
REF-001 §3.5 has recorded the wording discrepancy since its initial issue, and
RA-001 carries it as **HA-091** — "lymphoid blasts are included in the M:E ratio
numerator" — with the mitigation "a laboratory requiring the distinction
configures separate myeloid and lymphoid blast categories". What the reviewers
have supplied is the *other* mitigation, the one nobody had proposed: rather
than asking the operator for a lineage call the morphology may not support, the
profile declines to attribute blasts to either lineage. It is cheaper, it needs
no extra key, and it is what a laboratory can actually do at the scope.

What this record adds to HA-091 is the magnitude. The hazard was scored with
severity 2 on the reasoning that "the M:E ratio is secondary to the differential
and is interpreted with cellularity, flow cytometry and immunophenotype", which
is true and which the table below does not contradict — but the table shows the
error is not small, and the score predates anyone measuring it. The re-score is
the Clinical Reviewer's, not this document's.

Practice outside ICSH varies in the same region of the formula. Bain (*Bone
Marrow Pathology*): "it is simplest to include in the myeloid component all
granulocytes and their precursors and any monocytes and their precursors.
However, some haematologists exclude mature neutrophils and others include
neutrophils but exclude eosinophils, basophils and monocytes." The peer manual
counter `cellcounter` excludes blasts outright, and its issue #204 records the
unresolved reason exactly: myeloblasts belong, lymphoblasts do not, and a
morphological count often cannot say which it has.

### What it costs and what it buys

Computed with this application's engine on 500-cell counts (VV-PRE-027 holds the
last row):

| Marrow | Blasts in | Blasts out |
|---|---|---|
| Normal, 2% blasts | 3.7:1 | 3.6:1 |
| AML, 40% blasts | 3.8:1 | **1.7:1** |
| B-ALL, 70% blasts | 6.6:1 | **0.8:1** |
| Erythroid-predominant, 5% blasts | 0.4:1 | 0.3:1 |

Where the ratio is read routinely the exclusion moves it by less than its own
confidence interval. In the B-ALL row the previous figure reported 6.6:1 —
marked myeloid expansion — about a marrow whose granulopoiesis is suppressed.

### Monocytes stay in

The reviewers left this to the Design Engineer, on the predecessor's logic. The
predecessor supplies no answer directly: its Precipio DX template reserved an
M:E field and printed a literal underscore, so the ratio was never computed
(DCR-032). Its template did state an expected range of 2–4:1, which is the range
of the inclusive convention, and monocytes at their stated 0–1% cannot move a
ratio across it either way. Nothing in the predecessor decides it.

So the decision falls back on the citation: ICSH names monocytes and their
precursors in the numerator, and they stay. One departure from the standard,
argued and disclosed, is a profile a reader can reason about; two, one of them
unrequested, is a profile nobody can compare to anything. The competing
convention is named in the formula's basis, which prints with the report.

---

## 3. The Target Count

### The comments

> Please remove the "target" cell number. Even though the current target does
> not need to be reached, it would be better not to display a target, similar to
> the currently used diff counter.
>
> Related to #2, please also remove the verbiage "Basis for the target: ICSH
> 2008 §2.6: …"

### The comparator is exact, and this profile had it wrong

The predecessor's configuration declared `minCellCount` — 200 for marrow, 100
for blood — and **its JavaScript never read it**. The identifier appears nowhere
in the source retained at `legacy/`. No progress bar, no target, no advisory: a
running total was all it ever displayed.

`mdc-2015-9` carried those two numbers forward as displayed targets, which
reproduced the predecessor's *configuration* rather than its *behaviour*. The
reviewers asked for the counter they use, and this is a defect in the profile's
fidelity as much as a change of preference. VV-PRE-023 now checks the claim
rather than restating it: it greps `legacy/` for the identifier and fails if the
retained source is ever found to read it.

### What no target must not take with it

`RA-001` scores **HA-030** — a count finalized with too few cells — residual Low,
and the DCR-007 re-score attributes that to the confidence intervals, not to the
target: "the imprecision is no longer something the operator must infer from the
cell count, it is printed beside each percentage." The target's own contribution
was to *name* a number; the interval states the consequence.

So the following stay, and their staying is the argument for accepting the
change:

- the running count, on screen as the Grand Total (which shows the differential
  denominator — the number the progress row displayed);
- the total counted in every report, which ICSH §2.6 requires explicitly;
- the binomial confidence interval beside every percentage;
- the near-threshold advisory (HA-094), which is about the diagnostic boundary
  and not about the target.

**A gap closed while here.** `confidenceIntervals.enabled: false` is already
configurable. A profile could therefore have stated no target *and* suppressed
the intervals, stripping both of HA-030's controls with nothing to notice.
`validateConfig` now refuses that combination (VV-TGT-002). Either alone remains
available — this adds the check rather than removing the configurability, per
the governing principle.

### The basis text

DCR-025 §2 added "Basis for the target: …" deliberately: without ICSH's
condition in view the advisory over-warned, and a 300-cell staging marrow read
as deficient against a 500-cell target. Removing the target removes the problem
that text was solving, so it goes with it — and it goes *because* the target
goes, not on its own. Displaying a target while deleting its justification would
restore precisely the over-warning DCR-025 fixed, and is the one combination
this change does not make available: the basis is now printed only where there
is a target for it to justify (VV-PROV-009).

---

## 4. How the Option Is Expressed

`targetCount: null` — the profile states that it has no target.

This is deliberately not a separate `showTarget: false` flag. A flag would leave
`targetCount: 500` in every export of a profile that has no target, which is a
false record of how the count was taken.

The distinction that makes it work is **absent versus null**. An absent field
still takes the evidence-based default of URS-105 (BM 500, PB 200); `null` is a
stated policy and survives normalization. `normalizeConfig` previously read
`!spec.targetCount`, which conflated the two — and, incidentally, swallowed a
`NaN` by replacing it with 500. Letting `null` through means the rest must now
be checked, so `validateConfig` rejects `NaN`, infinities, zero and negatives
explicitly (VV-TGT-001). That is a defect this change surfaced rather than
created: a malformed target was previously silently replaced with a figure the
laboratory had not chosen.

| Component | Behaviour with no target |
|---|---|
| Counting screen | Progress row omitted entirely. The Grand Total above it already showed the count. |
| Audio | No chime. (`total >= null` is `total >= 0`; without the type check it would have sounded on the first cell — TC-B137.) |
| Results | No sub-target advisory. |
| Method statement and exports | No "Target count" line; `targetCount` exports as `null`. |
| Configuration Editor | The target field is blank, with a "blank for none" hint. A non-empty but unusable entry still falls back to the default, so a half-typed number cannot become a policy. |

The editor does not clear `targetCountBasis` when the target is cleared. That is
intentional: HA-099 is what happens when the editor destroys fields it does not
own. The basis is inert instead — the method statement will not print a basis
with no target to justify.

---

## 5. Scope and Impact

**UI** — `web/scripts/mdc-app.js` (progress row, chime, update guard);
`web/editor.html`, `web/scripts/config-editor.js` (blank means none).

**Logic** — `web/scripts/wbc-core.js`: `normalizeConfig`, `validateConfig`,
`buildMethodStatement`, and the documented contract of `buildLowCountNote`.

**Configuration** — `web/settings/presets/mdc-2015-9.json` to v2.3, and its
catalogue entry. The version bump matters operationally: `isCacheSuperseded`
compares versions, so a pilot workstation holding v2.2 is offered the change
rather than silently keeping the old policy.

**Out of scope** — `ndc-14` and every other shipped profile; the arithmetic of
the ratio; the near-threshold advisory; the confidence intervals.

---

## 6. Requirements Impact

**URS** — URS-041 (the advisory is now conditional on a profile stating a
target), URS-105 (a profile may state none).

**SRS** — SYS-052, SYS-053, SYS-183.

---

## 7. Verification

| Case | What it holds |
|---|---|
| **VV-TGT-001** | `null` is accepted; 0, negative, `NaN`, a string and absent are not |
| **VV-TGT-002** | No target *and* no intervals is refused (HA-030) |
| **VV-TGT-003** | Absent takes the default; `null` survives normalization |
| **VV-LOW-004** | No target, no advisory |
| **VV-PROV-009** | A basis with no target to justify is not stated |
| **VV-PRE-005** | The schema accepts `null` from a preset file |
| **VV-PRE-023** | `legacy/` never reads `minCellCount`, so the profile displays no target |
| **VV-PRE-027** | Blasts are out of the numerator, monocytes in, and it still changes the number |
| **TC-B136** | No progress row, and the running count survives it |
| **TC-B137** | No chime — including on the first cell |
| **TC-B138** | No advisory and no basis text anywhere in the results |
| **VV-SYS-224** | The same, in three browsers, through the catalogue |

Every one revert-checked. Restoring each guard in turn — the normalization
check, the method-statement guard, the chime type check, the progress-row
condition, the interval rule, the `isFinite` check, and the profile itself —
fails the named case with the symptom it describes, and nothing else.

**A third race in VV-SYS-215, found by the release gate.** The first evidence
run passed clean; a second run, made while the first had left the tree dirty,
failed that test on WebKit alone. Its helper clicked "Preset Profiles" and then
used `page.evaluate` to find the Load button — and `page.evaluate` does not
auto-wait the way a locator does, so under load it scanned an empty list and
reported *no Load button*, which reads as a missing control rather than a slow
one.

Not revert-checked, because the failure is load-dependent and a revert proves
nothing on an idle machine. The cause was measured instead: clicking and
counting `#preset-list button` immediately, eight times per engine, gave
`[6,6,0,0,0,6,0,0]` on one engine and eight sixes on the others. The list is
populated asynchronously and the helper was reading it synchronously. It now
waits for the list before scanning.

Worth recording as a pattern rather than a fix: this is the **third** race
removed from this one test, and each previous fix guarded the step *after* the
one that actually raced — DCR-039 added a wait for the active profile, having
earlier added waits for the render. The wait now sits at the first asynchronous
step, which is where it should have been.

**And the first attempt at this fix was itself incomplete**, which is the part
worth keeping. Adding the wait to the helper left the release gate still
failing, on a *different* test: the same click-then-evaluate block existed three
times in the file, only one of them in the helper, and each earlier fix had
reached one copy. That is why this race has outlived three corrections — not
because the diagnosis was wrong each time, but because the fix was applied to an
instance of a duplicated block. The three are now one
`loadPresetFromCatalogue(page, name)`, and the wait exists once.

---

## 8. Risk

`HA-030` is amended rather than re-scored. Its residual score already rested on
the confidence intervals; the target advisory becomes one of two controls a
profile may select, and VV-TGT-002 makes it impossible to have neither. The
occurrence and detection figures are unchanged, and the reason they are
unchanged is now stated in the row.

No other hazard is affected. `HA-095` (a result interpreted without knowing the
convention that produced it) is what makes the M:E change safe to ship at all:
the departure is stated in the formula's basis, which travels in the method
statement and in every export.

---

## 9. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-23 | QMS | Initial issue. Blasts removed from the `mdc-2015-9` M:E numerator; monocytes retained with the reasoning recorded; `targetCount: null` added to the schema and adopted by both specimens of that profile; the no-target/no-intervals combination refused; `NaN` target rejected. VV-TGT-001..003, VV-LOW-004, VV-PROV-009, VV-PRE-027, TC-B136..138, VV-SYS-224. |

---

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **required — this is their change; §2 monocytes decision is the Design Engineer's and invites comment** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-23 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-23 |
| Regulatory Affairs | | | |
