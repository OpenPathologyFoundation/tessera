# DCR-021: Design Change Record — SAD-001 Revision

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-021 |
| **Version** | 1.1 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Re-issued** | SAD-001 → v3.0 |
| **Prompted by** | Checking SAD-001 for the drift found in SDD-001 (DCR-019 §4) |

---

## 1. The Drift Was Worse Than SDD-001's

`SDD-001` was silent about what had been built. `SAD-001` was silent **and
wrong**, including about a property a privacy officer would rely on.

### 1.1 The serious one — §7.1 denied holding patient data

> "Data at rest | sessionStorage only; cleared on tab/window close. **No
> localStorage**, no cookies, no IndexedDB."

Four sites write to `localStorage`. One of them, `wbcds_autosave`, holds the
**accession number and the free-text morphology comments**, and survives a
browser restart.

This is the same false claim independent review found in `README.md` and that
was corrected under DCR-015 — **not propagated here**. It is exactly the HA-097
failure mode (a document describing software that no longer exists), applied to
the document an auditor reads for data handling.

The table now states what is held, where, for how long, and what the residual
exposure on a shared workstation is.

§7.1 also claimed output avoided `innerHTML`. It does not — there are 23 uses in
`mdc-app.js`. The real control is **sanitisation**: `sanitizeTemplateHtml`
escapes rendered templates before insertion and `escapeHtml`/`escapeAttr`
escape interpolated values. That is a better answer than the one claimed, but
the claim as written was false.

### 1.2 Five of six shipped modules were absent

`wbc-core.js`, `wbc-dialog.js`, `config-editor.js`, `sw.js` and `theme.css`
appeared **zero times**. So did Wilson intervals, thresholds, per-100 reporting,
method provenance, offline operation and the preset catalogue.

An architecture document that names one of six components is not describing the
system.

### 1.3 A CDN dependency that would defeat URS-094

Tailwind was described as CDN-delivered in three places. It is vendored and
precached — and a CDN dependency would break the requirement that counting works
with no internet connection, on the laboratory machines that requirement exists
for. Same defect corrected in `SDD-001` under DCR-019.

### 1.4 A file layout describing a different repository

§5.2 listed **`logo-showcase.html`, which does not exist**, and omitted the
editor, both documentation pages, the service worker, the stylesheet, the
vendored bundle, the preset catalogue and three of the four scripts.

§5.3 described "a single `<script>` tag" loading `mdc-app.js`. There are three,
in a fixed order that matters.

### 1.5 The withdrawn key mapping, twice

§3.2.3 and §7.2 both stated the literal v1 mapping (`R=nrbc, L=blasts, …`),
withdrawn at v2.0 — the same defect class as SOP-001 (DCR-015 §3). §7.2 framed
it as an input-validation control: *"Only mapped keys (R, L, O, …) are
processed"*. The key set is configuration, not a constant.

---

## 2. What Was Written

- **§3.2.9 to §3.2.13** added: the calculation engine, the configuration
  lifecycle, the dialog, the editor and the offline shell — each stating its
  *architectural* significance rather than repeating SDD-001. The DOM-free
  boundary of `wbc-core.js` is why the unit layer executes shipped code;
  `validateConfig` is the single gate every profile passes through; the editor
  merges rather than rebuilds; `CACHE_VERSION` is why a fix can fail to reach an
  installed browser.
- **§5.2, §5.3 replaced**; **§5.4 Offline Delivery** added.
- **§7.1, §7.2 corrected**, with the withdrawn claims quoted rather than erased.
- §2.2, §5.1 corrected on the vendored Tailwind.

---

## 3. Guarded

| ID | Verifies |
|----|----------|
| UD-070 | Every shipped script, plus `sw.js` and `theme.css`, is named |
| **UD-071** | **The document does not deny the data at rest it holds**, and names the snapshot and its contents |
| UD-072 | It does not describe the removed CDN dependency |
| UD-073 | Every file in the layout actually exists |
| UD-074 | It does not state a literal key mapping that configuration owns |

UD-071 checks only what the document asserts **in its own voice** — block quotes
and revision-history rows may quote the withdrawn claim, and must, or the
evidence that a correction happened would be erased.

Revert-checked: restoring "No localStorage" fails UD-071; listing
`logo-showcase.html` fails UD-073; removing `wbc-dialog.js` fails UD-070.

Two of these tests were wrong before the document was. UD-071 initially matched
the quoted claim in the correction note; UD-073 matched `templates.js` inside
`templates.json`, because regex alternation is ordered and `js` was listed
before `json`. Both were fixed until they failed for the right reason.

**606 Node + 368 system = 974 passing, 0 failures, 7 documented skips.**

---

## 4. Rev B — §3.1 and §4 Completed

Rev A left the component diagram and the data flows unrevised, and said so.
Both are now done.

**§3.1 is redrawn by layer.** The previous diagram was a flat grid of counter
features — case identification, counting engine, output generator — that omitted
every module added since DCR-006, including the calculation engine that produces
every number in it. Layering is the architecturally significant fact: the engine
sits below both applications and touches no DOM, which is what allows the
verification suite to execute shipped code rather than a copy of it. The diagram
now shows pages, the two applications, the shared engine and dialog,
configuration and storage, and delivery.

**§4 flows stopped at "recalculate percentages" and "compile the template".**
Everything DCR-006 onward added was absent: the denominator policy, the rounding
policy, the Wilson intervals, the threshold advisory, the method statement,
autosave, and every guard on the keyboard.

§4.1 now shows the six conditions under which a keystroke is rejected before it
reaches the tally — three of them recorded hazards (HA-102, HA-103, HA-104) —
and the engine calls made per keystroke. §4.2 shows what the results screen
computes, that the advisories never block, and the analyser-WBC correction.

**§4.4 described a reset the code does not perform.** It cleared the specimen
type and re-enabled a locked selector. `resetToStart()` preserves the specimen
type (URS-063) and discards the autosave snapshot, and nothing locks the
selector — the specimen type is switchable mid-count, which saves the count in
progress to history first (URS-013).

**§4.5 Configuration Resolution** added; it was absent entirely, though it is
the flow that decides which profile produces every number.

| ID | Verifies |
|----|----------|
| UD-075 | The diagram shows every module, the validation gate and both storage keys |
| UD-076 | The counting flow shows the guards that protect the tally, and the arithmetic |
| UD-077 | The completion flow shows the intervals, thresholds, provenance and WBC correction, and that advisories never block |
| UD-078 | The reset flow does not claim behaviour the code does not have |

Revert-checked: removing the engine from the diagram fails UD-075; removing the
auto-repeat guard from the flow fails UD-076; restoring "Enable specimen type
selector" fails UD-078.

---

## 4a. What This Still Does Not Address

- **§6 (state management)** was read but not revised.
- UD-070 and UD-075 check a module is *named* and *drawn*, not that what is said
  about it is true. No test can check prose against code.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. SAD-001 v3.0: §7.1 privacy claims corrected, five components added, file layout and script loading replaced, CDN and key-mapping claims withdrawn. UD-070 to UD-074 added. |
| B | 2026-08-06 | QMS | SAD-001 Rev 3.1: §3.1 redrawn by layer, §4 flows rewritten, §4.4 reset corrected, §4.5 added. UD-075 to UD-078. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
