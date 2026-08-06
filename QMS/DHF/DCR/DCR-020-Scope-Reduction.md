# DCR-020: Design Change Record — Scope Reduction

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-020 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` §4 |
| **Decisions** | Document Owner, 2026-08-06: merge duplicate presets; wire up the audio default; **keep all three clinical options selectable** |

---

## 1. What Was Cut, and What Was Not

The review proposed cuts in three categories. Only one of them was
overengineering; the others were debris and a defect wearing a feature's
costume. One proposed cut was **declined**.

### 1.1 Debris — 1.2 MB removed from every installation

| Removed | Why |
|---------|-----|
| 8 unreferenced images, 1 font | Referenced by nothing |
| `retina_wood.png`, `brass.jpg`, `Satisfy-Regular.ttf` | Referenced **only** by `counter.css` |
| `web/styles/counter.css` | Loaded by no page |
| `Core.calcPercentages` | Called nowhere in `web/` |

`web/` falls from **2.1 MB to 868 KB**. All of it was precached by the service
worker, on laboratory machines chosen partly for restricted networks.

`calcPercentages` was not merely dead. It divided by `getTotal`, **ignoring
`denominatorExcludes`** — wiring it into the interface would have made the
displayed percentages silently disagree with the report for any profile that
excludes a category. It carried seven assertions of coverage on a function no
user path reached.

**Its seven cases were kept, not deleted**, and re-pointed at
`percentagesSummingTo100`, which is what `displayPercentages()` actually calls.
The coverage moved from a dead function onto shipped code. A new case,
**VV-CALC-029**, pins the distinction that made the old function dangerous: on
120 segmented neutrophils, 60 lymphocytes and 20 NRBC it is 60% over the raw
total and 66.7% over the differential denominator.

### 1.2 A control that lied

Every preset carried an `audio` object, the configuration editor offered an
Audio checkbox that wrote it, and **the counter read neither**. Turning audio
off in a profile did nothing.

That is not overengineering; it is a defect. A control that does nothing is
worse than no control, because the operator believes the setting took effect.

`AudioEngine.init(specConfig)` now takes the profile default, and a session
choice overrides it **in both directions** — the bench has the last word.
VV-SYS-194 to 196.

**`handedness` was NOT removed**, against the review's recommendation. It is not
dead: it selects the ergonomic zone that drives the editor's "key outside the
ergonomic zone" warning. Editor-scoped is not the same as unused.

### 1.3 The actual overengineering — preset forks

Nine files held six distinct layouts. **Eight of fifteen specimen definitions
were the identical 14-category panel**, differing only in key assignment or M:E
composition — both of which are *fields inside a profile*.

The forking had already cost correctness twice: `right-hand` shipped with four
categories that could not be un-counted (HA-104), and six of eight presets
silently omitted `confidenceIntervals` (P0-9). A fork is a place for a defect to
hide from the profile it was copied from.

| Removed | Where its value now lives |
|---------|---------------------------|
| `right-hand.json` | *Auto-Assign: Right Hand* in the editor; `handedness` in Settings |
| `frequency-ergo.json` | Category order and keys are drag-and-drop |
| `consensus-14-me-alt.json` | M:E numerator membership is a checkbox (§1.4) |

Also corrected: **`harmonized-9` and `legacy-9` both contained ten categories**
while calling themselves "9-Part". Renamed to *10-Part*.

Every surviving preset now carries `confidenceIntervals`, and where applicable
`thresholds` and `categoryNotes` — closing P0-9.

### 1.4 Standards conformance was re-pointed, not weakened

Removing `consensus-14-me-alt` broke SC-040 to SC-043 and UD-032, which
verified that the alternative M:E convention **ships as a preset file**.

That was a DCR-010 implementation choice, not what URS-035 requires. The
requirement is that both conventions are available, give different answers, and
that each report says which produced its number. Those tests now verify exactly
that — against the engine and the editor control — rather than against the
existence of a file. SC-042 still pins 2.3:1 against 1.7:1 from identical
counts.

### 1.5 Declined: the clinical options

The review recommended removing `largest-count` rounding, fixing the confidence
level at 0.95, and deriving precision from the denominator.

**Declined by the Document Owner.** These are the choices DCR-010 made
selectable on the stated principle that a contested clinical decision belongs to
the laboratory, not to this tool. The review's argument for cutting
`largest-count` — that the engine's own documentation calls it misleading — is
noted in that documentation and remains visible to anyone selecting it.

---

## 2. Verification

Every deletion was proven not to change behaviour before it was made: the
coverage was moved first, then the code removed, then the suite re-run.

| ID | Verifies |
|----|----------|
| **QC-010** | No asset under `web/` is referenced by nothing |
| VV-CALC-001..014, 029 | Percentage computation, now against the live path |
| VV-SYS-194..196 | The profile audio default is honoured, and overridable |
| Suite 09 | No two presets share a layout and key set; every preset configures confidence intervals |
| SC-040..043, UD-032 | Both M:E conventions available, distinguishable and stated |

Revert-checked: reintroducing an orphan asset fails QC-010 by name; restoring
`right-hand.json` fails the no-redundant-forks check; ignoring the profile audio
default fails VV-SYS-194.

**601 Node + 368 system = 969 passing, 0 failures, 7 documented skips.**

---

## 3. Migration

A laboratory already using `right-hand`, `frequency-ergo` or
`consensus-14-me-alt` is **not affected**: the active profile is cached under
its own `profileId`, and `isCacheSuperseded` compares only against a built-in of
the *same* id. Their profile keeps working; it simply no longer appears in the
catalogue. Re-selecting it is not possible, so a laboratory wanting to rebuild
one starts from `consensus-14` and applies the layout or formula change in the
editor.

---

## 4. What This Does Not Address

- The configuration editor (1,400 lines) is **kept**. The review called it the
  largest over-build and proposed replacing the policy panel with a JSON
  textarea; those controls were built two changes ago at the Owner's request,
  are constrained so they cannot compose an invalid profile, and reverting them
  would be churn.
- 359 tests still carry no verification identifier (DCR-018 §4).
- `SAD-001` has not been reviewed against the current design.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. 1.2 MB of dead assets and `calcPercentages` removed; the audio default wired up; three duplicate presets merged and two mislabelled names corrected; P0-9 closed. Clinical options retained by decision. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
