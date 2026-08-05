# DCR-009: Design Change Record — Method Provenance (module M2)

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-009 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-05 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Module** | M2 of the standards-review plan — the final module |
| **Profile Version** | consensus-14 2.3 → 2.4 |

---

## 1. Change Summary

A differential percentage is not self-explanatory. Identical counts give a
materially different M:E ratio depending on whether monocytes are in the
numerator, and a materially different blast percentage depending on whether
erythroid precursors are in the denominator. Both conventions are in current
use — the standards review under DCR-005 established that the shipped M:E
formula follows ICSH while a competing convention exists, and DCR-008 added the
ability to report blasts against either denominator.

URS-052 already required the configuration profile ID and version in every
export. That tells a reader **which** profile produced a result. It does not
tell them **what that profile does**.

This change makes a result self-describing: the profile and version, the
standard it follows, the basis of each derived formula, any category excluded
from the percentage denominator, the target count basis, and the confidence
level where intervals are reported.

---

## 2. Why It Matters

Two scenarios the previous behaviour did not serve:

**Comparison across laboratories.** A referring pathologist receives "M:E
2.1:1" from an outside laboratory and compares it against their own. If one
follows ICSH and the other excludes monocytes, the two numbers are not
comparable, and nothing in either report says so.

**Comparison across time.** A laboratory revises its profile — adopts the
harmonized panel, changes a target count, corrects the peripheral blood
denominator as under DCR-006. A trend read across that change may reflect the
change rather than the patient. The profile version was already recorded; the
*meaning* of the change was not.

Recorded as **HA-095**, pre-RPN 48, residual 12.

---

## 3. Defect Found: the Clipboard Carried No Attribution

URS-052 is P0-Critical and requires the profile ID and version in **all**
output. It was met for CSV and JSON export. It was **not** met for the
clipboard.

The copy control copies the rendered report panel, which contained the case
number, the template output and the morphology comment — and no profile, no
version, no timestamp. The clipboard is the primary route into the LIS, so the
record reaching the patient file was the one output that could not be traced
back to the counting parameters that produced it. This is precisely what
URS-052 exists to prevent.

Recorded as **HA-096**, pre-RPN 48, residual 8. The copied text now carries
`[profileId vX.Y · timestamp]` independently of the active template, so a
laboratory cannot lose attribution by editing its templates. URS-052 has been
amended to state the clipboard obligation explicitly rather than leaving it to
be inferred from "all output".

Verified by TC-B131 and by VV-SYS-130, which reads the real system clipboard.

---

## 4. Scope

- **Engine**: `buildMethodStatement()`, `formatMethodStatement()`.
  `normalizeConfig()` carries a new profile-level `provenance` block.
- **Schema**: `provenance` at profile level; `targetCountBasis` per specimen
  type; `basis` per formula (already present from DCR-008, now surfaced).
- **Interface**: a collapsible Method disclosure on the results screen;
  attribution appended inside the report panel so it travels with the copy.
- **Templates**: `{{methodNotes}}` available. Deliberately **not** added to the
  shipped templates — the full statement would bloat every pasted report, and
  the compact attribution line already satisfies URS-052. A laboratory that
  wants the full statement inline can place the placeholder.
- **Export**: `methodNotes` column added to CSV.

### 4.1 Reserved placeholders completed

`totalCounted` and `denominator`, introduced by DCR-006, were never added to the
reserved placeholder list, so a cell type with either name would have shadowed
them — the defect class recorded as HA-064. Both are now reserved, along with
`methodNotes`. Verified by VV-PROV-008.

---

## 5. Verification

540 unit and behavioural tests, 166 system tests across Chromium, Firefox and
WebKit. 0 failures, 5 documented engine-specific skips (the clipboard read-back
in VV-SYS-130 joins VV-SYS-070 as Chromium-only).

| Layer | Tests |
|-------|-------|
| Unit | VV-PROV-001 to 008; SC-030 to SC-033 pin the shipped profile's provenance |
| Behaviour | TC-B130 to B135 — results statement, clipboard attribution, session and CSV, inline placeholder, peripheral blood denominator declaration, graceful absence |
| System | VV-SYS-130 (real clipboard), VV-SYS-131 |

---

## 6. Standards-Review Plan: Closed

This completes the five modules opened after the literature review.

| Module | Change record | Outcome |
|--------|---------------|---------|
| M3 standards grounding | DCR-005 | ICSH 2008 verified against full text; IEC 62304 Class A declared; REF-001 issued |
| M1 denominator policy | DCR-006 | NRBC excluded from the peripheral blood differential (HA-092, pre-RPN 64) |
| M4 sampling precision | DCR-007 | Wilson confidence intervals; HA-030 residual 24 → 12 |
| M5 derived quantities | DCR-008 | Subset percentages; near-threshold advisory closing the ICSH §2.6 gap |
| M2 method provenance | DCR-009 | Results are self-describing; URS-052 clipboard gap closed |

---

## 7. Open Items Carried Forward

| Item | Note |
|------|------|
| **CLSI H20-A2 not held** | The peripheral blood denominator convention (DCR-006) rests on secondary sources. Should be re-verified when obtained. |
| **CLSI H56-A not held** | Body fluid profile rests on secondary sources. |
| **Rümke primary text not held** | The Wilson method does not depend on it; his tabulated values should not be quoted until read. |
| Interval for the M:E ratio | Needs Fieller or bootstrap. HA-093 accepted meanwhile. |
| Safety class sign-off | DHF-001 §3.1 is an engineering assessment resting on clinical judgements. |
| Severity ratings unreviewed | RA-001 §6.3 — S values are clinical judgements and are unchanged throughout. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
