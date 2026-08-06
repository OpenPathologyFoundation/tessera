# DCR-025: Design Change Record — Scientific Framing

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-025 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` C-2, C-3, C-4 |
| **Amends** | URS-032, SRS-001 SYS-041, REF-001 §2.1 |

---

## 1. C-2 — Two Target Counts Were Mis-attributed

Both readings claimed more than the sources support.

### The 200-cell peripheral blood target

`wbc-core.js` stated *"PB: 200 per CLSI H20-A2"*, and every profile's
`targetCountBasis` said *"CLSI H20-A2: 200 leucocytes for a reference
differential."* That reads as a conformance claim.

**CLSI H20-A2's reference method is two reviewers counting 200 cells each —
400 in total**, quoted verbatim in REF-001 [S8]. 200 is *one observer's share*
of it. This application implements a single-observer workflow and therefore does
not perform that method.

200 remains a good default: it is what routine single-observer practice does,
and REF-001 §2.1 already recorded that H20-A2's own scope is the evaluation of
analysers rather than the governance of a manual counting aid. What changed is
that the documentation no longer implies conformance to a method the software
does not implement.

### The 500-cell marrow target

The same comment said *"BM: 500 per CAP recommendation"*. REF-001 §3.3 had
already recorded that attribution as an error — the source is **ICSH 2008 §2.6**
— but the correction had not reached the engine.

---

## 2. C-4 — The Marrow Target Was Presented as Unconditional

ICSH 2008 §2.6 makes 500 conditional: **at least 500 cells when a precise
percentage of an abnormal cell type is required for the diagnosis; at least 300
when the differential is not essential to it.**

The shipped profile's `targetCountBasis` stated that condition correctly — and
**nothing ever showed it to the operator**. The sub-target advisory read:

> 300-cell count (target 500). At this count an observed 5% carries a 95%
> confidence interval of 3.1–8.1%.

Accurate, and over-warning. A marrow examined for staging, where the
differential is not essential to the diagnosis, reads as deficient at 300 cells
when the standard would not require more.

The advisory now carries the basis:

> …**Basis for the target:** ICSH 2008 §2.6: at least 500 cells when a precise
> percentage of an abnormal cell type is required for diagnosis; at least 300
> when the differential is not essential to it.

**The basis is stated, not acted on.** The software does not decide whether the
differential is essential to a diagnosis; the operator knows what the count is
for. A case-level toggle selecting 300 against 500 was considered and not built:
it would put a clinical judgement behind a control with no record of who made
it, where the present design records the reasoning in the report itself.

---

## 3. C-3 — Two Decimal Places on a 200-Cell Count

### A requirement that contradicted another requirement

`URS-032` required "at minimum 2 decimal places". `SYS-041` required "exactly 2
decimal places". `SYS-232`, added by DCR-010, made precision "independently
selectable, 0 to 4". These could not all hold, and the code implements the last.

URS-032 is amended to state configurability; SYS-041 is **superseded by
SYS-232** and marked as such rather than deleted, so the change is visible.

### The scientific point, and what was done about it

A 200-cell differential can only produce percentages in steps of 0.5 points.
Displaying `66.67%` shows two digits no possible count could have moved
independently, beside an interval roughly twelve points wide.

**The Document Owner declined the review's proposed remedy** — deriving
precision from the denominator and removing the configuration field — on the
principle that a contested presentation decision belongs to the laboratory. That
decision stands, and this record does not reopen it.

What the tool does instead is **explain what the digits mean**. The Calculation
Reference gains §1.2a, with the attainable step and the 95% interval at 100, 200
and 500 cells, and states plainly that two decimals are a display convention
rather than a statement of precision — retained because low-frequency categories
read better with them and because a laboratory may need to match an existing
report format. A laboratory that finds them misleading can set
`precision.display` to 0 or 1.

The interval displayed beside every percentage is the figure that states the
real precision. That is why the tool shows one.

---

## 4. Verification

| ID | Verifies |
|----|----------|
| SC-050 | The 200-cell target is not presented as the CLSI reference method; the engine records that the method is two observers totalling 400 |
| SC-051 | The 500-cell marrow target is attributed to ICSH 2008, not to a CAP recommendation |
| SC-052 | The marrow basis states the 300-cell condition |
| **SC-053** | **A sub-target advisory carries the basis for the target**, and omits it where a profile states none rather than inventing one |
| UD-093 | Every figure in the precision table is engine-produced |

UD-093 caught one of its own: the interval at n=200 was written as 43.2–56.8%
and the engine gives **43.1–56.9%**. A section arguing that displayed digits
overstate precision cannot itself carry a digit that is wrong.

Revert-checked: restoring the CLSI/CAP attribution fails SC-050 and SC-051;
removing the basis from the advisory fails SC-053.

**622 Node + 380 system = 1002 passing, 0 failures, 7 documented skips.**

---

## 5. Two Malformed Identifiers, Found by the Register

Naming work in DCR-024 established that every test carries an identifier ending
in digits. Two written during this session did not — `UD-039a` and
`VV-SYS-070b` — and the register reported them as unidentified. They are now
`UD-093` and `VV-SYS-200`, and DCR-023's citations of the old number were
updated with them.

The counting was also unstable: `unidentified` was derived by subtracting one
measurement from another and oscillated between 0 and 1 across identical runs.
It is now counted directly from indented test lines, which is deterministic
across repeated runs.

---

## 6. What This Does Not Address

- **G-2**, an interval on the M:E ratio, remains deferred. REF-001 §3.8 shows an
  advisory instead, and the review's own position is that this is adequate
  unless a clinical reviewer asks for more.
- The two-observer workflow that would let the project claim conformance to the
  CLSI reference method remains deferred in URS §6. Claiming it would require
  purchasing H20-A2 for the procedural detail, which REF-001 §2.1 records.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. C-2 attribution corrected in the engine and six profiles; C-4 basis surfaced in the sub-target advisory; C-3 requirement contradiction resolved and the precision caveat published. SC-050–053, UD-093. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
