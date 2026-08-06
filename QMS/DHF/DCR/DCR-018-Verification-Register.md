# DCR-018: Design Change Record — Verification Register

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-018 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` §3.3 |
| **Re-issued** | VV-001 → v3.0; TP-001 → v2.0 |

---

## 1. The Defect

`RTM-001` and `TR-001` cite verification identifiers. `VV-001` and `TP-001` are
supposed to define them. They had become two unrelated universes:

- **98 of the 111 identifiers** cited by the traceability documents existed in
  no protocol document.
- **None of TP-001's 106 `TC-0xx` numbers** appeared in any test file. Zero
  matches across the entire suite.

A traceability matrix citing identifiers that do not exist is worse than no
matrix, because it manufactures the appearance of coverage. `RTM-001` §8 claimed
100%.

**The gap was widening as it was being reported.** The review found 61. By the
time it was addressed it was 98, because every suite added in response cited new
identifiers into `RTM-001` and `TR-001` without touching the protocol. Hand
maintenance had already failed; adding discipline to it would have failed again.

---

## 2. What Was Done

### The register is generated, not written

`scripts/qms-verification-index.js` extracts every identified case **from the
runners** and writes it into both documents between generated-content markers.

Source regex was tried first and was not sufficient. Whole families of cases are
generated in loops — one per shipped preset, per theme, per contrast surface —
and their titles are template literals whose identifier is a variable. A regex
over the source reported `VV-SYS-162` through `169`, `177` and `178` as *cited
but not implemented* when all eleven exist and pass. It also missed the entire
`TC-B` series — 91 behaviour cases — because those numbers fuse a letter to the
digits. The runners resolve both; nothing static does.

**373 identified verification cases across 18 series and 4 layers.** A further
359 tests carry no identifier; the register says so rather than implying
coverage it cannot show.

### TP-001's numbering is withdrawn, not mapped

The `TC-001`–`TC-127` specifications describe a plan the suites never adopted,
and no mapping between the two schemes was ever recorded. **None is invented
here.** Fabricating one after the fact would be the same defect in a new form —
a mapping that looks like traceability and is not. The numbering is withdrawn
and the withdrawn specifications remain in version 1.x for anyone auditing how
the plan changed.

### VV-001 §3 and §4 are replaced

The hand-maintained vector tables and the SRS-to-`TC-0xx` system verification
table are withdrawn for the same reason. Requirement-to-verification tracing
lives in `RTM-001` §5, which cites identifiers that now demonstrably exist.

---

## 3. Guarded

| ID | Verifies |
|----|----------|
| QC-004 | Both documents carry a generated register of plausible size |
| QC-005 | **Every identifier cited by RTM-001 and TR-001 is registered** |
| QC-006 | The two registers agree with each other |

These read the **committed** register rather than re-extracting, because
extraction spawns both runners and suite 14 runs inside one of them.

Revert-checked, each reproducing its defect:

| Introduced | Detected by |
|------------|-------------|
| A citation of `VV-SYS-999` | QC-005, naming the identifier |
| A truncated register | QC-004 and QC-006 |
| A stale hazard count | QC-001 |
| A broken measurement regex | QC-002 — so a silent zero cannot pass as agreement |

`qms-counts.js` now measures its test-case figure from the register rather than
from TP-001's withdrawn numbering.

---

## 4. What This Does Not Address

- **359 tests carry no identifier**, mostly the static structural suites (03,
  04, 06, 07, 10). They run and they pass, but they cannot be cited by a
  traceability document. Giving them identifiers is mechanical and worth doing;
  it is not done here.
- Two legacy titles in suite 03 open with `SYS-001` and `SYS-004` — the
  *requirement* namespace. They are excluded from the register rather than
  renamed, so the register lists verification cases only.
- `SDD-001` still describes none of what has been built since DCR-006.
- Regenerating is a release step: `qms-verification-index.js --write` then
  `qms-counts.js --write`, in that order, since the counts read the register.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. VV-001 v3.0 and TP-001 v2.0 re-issued around a generated register; TC-0xx withdrawn; QC-004 to QC-006 added. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
