# DCR-005: Design Change Record — Standards Grounding (module M3)

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-005 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-05 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Module** | M3 of the standards-review plan |

---

## 1. Change Summary

The design review that produced DCR-004 verified that the software does what its
specification says. It did not ask whether the specification itself is correct —
that is, whether the shipped counting model, target counts and derived formulas
match the standards the product claims to follow.

This change record answers that question against primary sources. The full text
of ICSH 2008 was obtained and read; the peripheral blood and body fluid
standards (CLSI H20-A2, H56-A) were not available and are recorded as
outstanding.

**The principal finding is favourable.** The shipped `consensus-14` bone marrow
profile implements the ICSH nucleated differential count exactly — all thirteen
categories of ICSH §2.6 are present, keyed and displayed — and the M:E ratio
formula matches the ICSH definition term for term, including the inclusion of
monocytes, on which a competing convention disagrees.

Three defects in the *documentation* were found, and two hazards that the
standard makes visible.

---

## 2. Findings

| # | Finding | Action |
|---|---------|--------|
| 1 | **URS-105 mis-attributed the 500-cell bone marrow target** to a "CAP recommendation". The source is ICSH 2008 §2.6, and the recommendation is *conditional*: at least 500 cells in at least two smears when a precise abnormal percentage is needed for diagnosis, at least 300 when the NDC is not essential to it. The unconditional form dropped clinically meaningful nuance. | URS-105 corrected and both provisions stated |
| 2 | **No IEC 62304 software safety class was declared** in any revision of the DHF, despite the standard being cited as a governing framework. Without it, the extent of the standard's applicability is undefined. | DHF-001 §3.1 added: Class A with justification, external risk control measures E1–E5, boundary conditions, and the note that verification exceeding Class A requirements has been retained deliberately |
| 3 | **The M:E convention was implied rather than stated.** Two conventions are in use and produce materially different ratios from identical counts. | URS-035 now states the ICSH definition and records the disagreement |
| 4 | **HA-090** — ICSH §2.6 excludes megakaryocytes, macrophages, osteoblasts, osteoclasts, stromal cells, smudged cells and non-haemopoietic cells from the NDC. The shipped profile offers an `other` category with no stated scope, inviting exactly those cells. A counted exclusion enters the denominator and depresses every reported percentage, including the blast percentage used at diagnostic thresholds. | New hazard; `categoryNotes` mechanism added and populated with the ICSH exclusion list, surfaced on hover; URS-012 expanded |
| 5 | **HA-091** — ICSH's NDC list says "blast cells" but its M:E numerator says *myeloblasts*. The profile has one generic `blasts` category, so lymphoid blasts enter the M:E numerator where ICSH would exclude them. | New hazard, documented limitation; a laboratory needing the distinction configures separate categories |

---

## 3. Scope

- **New**: `QMS/DHF/REF-001-StandardsAndLiterature.md` — controlled bibliography
  recording each source, whether it was read in full text, and what it is relied
  on for. Sources not held are marked as such, and every requirement resting on
  one carries the same qualification.
- **New**: `tests/12-standards-conformance.test.js` — 12 tests pinning the
  shipped profile to ICSH §2.6, so a future configuration change cannot silently
  drift from the standard the default claims to implement.
- **Code**: `categoryNotes` per-category scope guidance rendered on hover
  (`mdc-app.js`), populated in `templates.json`.
- **Documents**: DHF-001 §3.1 (safety class), URS-001 Rev F (URS-012, URS-035,
  URS-105), RA-001 §4.9 (HA-090, HA-091).

**Out of scope**: the peripheral blood denominator question, which is module M1
and DCR-006.

---

## 4. Verification

462 unit and behavioural tests, 129 system tests across three browser engines,
0 failures. Suite 12 is new and asserts ICSH conformance directly.

---

## 5. Open Items

| Item | Note |
|------|------|
| **CLSI H20-A2 not held** | Governs the peripheral blood differential and the NRBC convention on which module M1 depends. M1 proceeds on secondary sources and must be re-verified when the standard is obtained. |
| CLSI H56-A not held | Body fluid profile rests on secondary sources |
| Rümke primary text not held | Needed for module M4 (confidence intervals) |
| Safety class sign-off | DHF-001 §3.1 is an engineering assessment resting on clinical judgments; requires clinical and regulatory approval |
| Near-threshold recount prompt | ICSH §2.6 requires the count be extended when an abnormal percentage sits near a diagnostic threshold. Not implemented — recorded in REF-001 §5 as a candidate requirement |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Regulatory Affairs | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
