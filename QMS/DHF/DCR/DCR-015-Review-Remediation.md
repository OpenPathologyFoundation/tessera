# DCR-015: Design Change Record — Independent Review Remediation

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-015 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` (independent review, whole repository) |
| **Hazards** | RA-001 HA-103, HA-104 (new); HA-097 control propagated |
| **Scope of this record** | The five P0 code defects, SOP-001, and evidence provenance. Findings deferred to a later record are listed in §5. |

---

## 1. Method

Every finding was verified against the code before being accepted. Two claims
were partly stale by the time they were checked and are recorded as such in §4.
Nothing was taken on the review's authority.

---

## 2. Defects Corrected

### HA-103 — Key auto-repeat inflated the count (pre-RPN 80)

`onKeyDown` never checked `ev.repeat`. A held, sticky or bouncing key added
cells at the operating system's auto-repeat rate — roughly thirty per second,
each with its own confirmation sound — and nothing in the interface
distinguished that from fast deliberate counting. At a 200–500 cell target a
two-second stuck key is a material, undetectable miscount.

The flag was already used by the theme shortcut. It had never been applied to
the counting path, the one place it changes a clinical number. `ev.repeat` and
`ev.isComposing` now return early. This is the highest pre-mitigation RPN
recorded in RA-001.

### HA-104 — Four categories could not be un-counted (pre-RPN 48)

Undo is Shift+key, and the handler resolved the mapping from the character
produced. Shift changes that character for punctuation: on a US layout Shift+`.`
is `>`, Shift+`,` is `<`, Shift+`/` is `?`, Shift+`;` is `:`. The shipped
`right-hand` preset maps those four keys to blasts, metamyelocytes, basophils
and monocytes, so **none of the four could be corrected at all** — including
blasts, the category most likely to be misidentified and most consequential
when wrong. There is no error, no sound and no visual change; the count simply
does not move.

The printed character is now tried first, so a laboratory on AZERTY or QWERTZ
keeps the key its keyboard is labelled with; only if that does not match a
mapping does the physical key position decide, which Shift does not change.

### Attribute escaping in the configuration editor

`escHtml()` round-tripped through `textContent` → `innerHTML`, which escapes
`&`, `<` and `>` but not `"` or `'`. It is used in roughly thirty attribute
positions, so a profile field containing a double quote closed the attribute.
Profiles are JSON files shared between institutions and loaded from disk, which
is the same threat model that justifies template sanitisation in the engine. It
now delegates to `Core.escapeAttr`, which escapes all five characters.

### An unreachable duplicate-key warning

`isDuplicateKey` counted `Object.keys(outCodes)` equal to the key. Object keys
are unique, so the count was never above one and the amber warning it controls
had never once been drawn. The condition that genuinely confuses an operator is
the reverse — `outCodes` maps key → cell, so two keys *can* address the same
cell, with the card showing only the last of them. That is what it now detects.

### Escape skipped an acknowledgement's continuation

`WBCDialog.alert` passed its callback as `onConfirm` only. The "Configuration
Updated" alert chains to interrupted-count recovery, so Escape closed the alert
and silently discarded the offer to restore a count. **This was a regression
introduced by DCR-014 the previous day**, with Escape support itself — before
that there was no way to dismiss an alert. An alert has one outcome, that it
has been read, so both paths now run the continuation.

### The README denied holding patient data at rest

`README.md` stated that no localStorage is used for patient data.
`wbcds_autosave` holds the accession number and the free-text morphology
comments, and survives a browser restart. `USER-GUIDE.md` and `help.html`
described this honestly; only the README — the document a privacy officer reads
— was wrong. Corrected, with the residual data-at-rest exposure named. Snapshots
older than twelve hours are now discarded on load rather than resurrected.

---

## 3. SOP-001 — The Operator-Facing One

`SOP-001` is marked **Issued for local adoption**: it is the document a
laboratory prints and follows. It documented:

| SOP-001 v1.0 said | The shipped profile does |
|---|---|
| `A` = blast | `A` = **mono** |
| `F` = eryth | `F` = **poly** (segmented neutrophils) |
| `X` = eos | `X` = **blasts** |
| Targets 200 BM / 100 PB | 500 / 200 |
| A blocking warning dialog below minimum | A non-blocking advisory |
| The table locks after Count Done | Continue Counting (URS-043 withdrawn) |
| The specimen selector locks | It can be changed mid-count (URS-013) |

An operator following the issued SOP would press `A` for a blast and record a
monocyte, and `F` for an erythroid precursor and record a segmented neutrophil —
a systematically wrong differential, with nothing on screen contradicting them.

This is the **HA-097 defect class**, raised and closed for `USER-GUIDE.md` and
never propagated to the other operator-facing document. The key tables are now
generated from the shipped profile, the withdrawn behaviours are corrected, and
UD-050 to UD-053 pin the document to the profile so it cannot drift again. Any
locally printed copy of v1.0 must be withdrawn.

---

## 4. Evidence Provenance

Bundles recorded date, Node version, platform, architecture, working directory
and npm version — and no code identity. There was no commit, no branch and no
dirty-tree flag. At least one bundle referenced by an **Approved** `TR-001` was
captured from a working tree that exists in no commit, and nothing in it said so.

A Design History File whose evidence cannot be tied to a code state does not do
the one job it has. `qms-run-tests.js` now records the commit, branch and tree
state in every bundle and in the `TR-001` run log, and stamps a dirty-tree run
**PROVISIONAL — not admissible as release evidence**. Verified by running it on
a dirty tree, then on a clean one.

A dangling `TR-001` run-log entry pointing at a deleted bundle was removed —
the same class of defect the review flagged elsewhere.

### Two claims that had already moved

- The review reported that only `consensus-14` configures confidence intervals.
  DCR-012 regenerated `presets/consensus-14.json` from the shipped profile, so
  it now carries them; **six of the other seven presets still do not**. The
  substance stands and is deferred to §5.
- The review reported `wbc-dialog.js` as untracked, breaking a fresh clone. It
  was committed in DCR-014 before this remediation began.

---

## 5. Deferred, Not Dismissed

These findings were verified as real and are **not** addressed here. Each needs
either a clinical decision or a scope decision.

| Finding | Why deferred |
|---------|--------------|
| **P0-3 corrected WBC for NRBC** | The application holds `nrbc_per100` and its own reference document states the correction formula, but absolute counts use the entered WBC uncorrected. At 20 NRBC/100 WBC every absolute count is overstated by 20%, and the ANC drives neutropenia grading. The review is right that it must **not** be corrected silently — that is a clinical interface decision, not an implementation one. |
| P0-7 removing a category orphans its policy references | Bounded work; the validator already rejects the result, so the failure is visible rather than silent. |
| P0-9 six presets omit `confidenceIntervals` | Intervals display at the 0.95 default while the method statement omits the disclosure line. |
| P0-10 subtotals bypass the rounding policy | Cosmetic disagreement at `precision.display: 0`. |
| C-1 "WHO 2022 withdrew it" should be WHO 2016 | Verified: Arber et al., *Blood* 2016;127(20):2391–2405. A comment and a citation. |
| C-2, C-3, C-4 | Scientific framing: the CLSI 400-cell reference method, two-decimal false precision, and the conditional 500-cell target. |
| §3.2–3.5 documentation drift | Counted quantities, traceability IDs, `SDD-001`, the README's test-suite claim. Large and mechanical. |
| §4 overengineering | Preset reduction, dropping `largest-count`, dead schema (`audio`, `handedness`), dead files, `calcPercentages`. A product scope decision. |
| G-3 CDS non-device analysis | Potentially reframes the whole compliance burden; needs qualified review. |

---

## 6. Verification

**595 Node + 344 system = 939 passing, 0 failures, 7 documented skips**, across
Chromium, Firefox and WebKit.

Two of the new tests initially passed against the broken code and were corrected
until they failed for the right reason:

- `keyboard.press('Shift+.')` in Playwright sends `key="."`, not `">"`. The
  undo test therefore could not reproduce the defect it was written for. The
  shifted character is now dispatched as a real keyboard reports it.
- The first auto-repeat revert-check removed the `ev.repeat` guard in the theme
  shortcut rather than the counting path.

With the correct guards removed, the revert-checks reproduce the exact findings:
`right-hand.json (bm): Shift+"." did not decrement blasts`, and a count of 41.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. Five P0 code defects, SOP-001 correction, evidence provenance. HA-103 and HA-104 recorded. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
