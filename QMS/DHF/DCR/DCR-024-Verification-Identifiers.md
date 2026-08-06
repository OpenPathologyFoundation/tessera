# DCR-024: Design Change Record — Verification Identifiers

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-024 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` §3.3; DCR-018 §4 |
| **Closes** | The last structural gap in the traceability chain |

---

## 1. The Gap

DCR-018 rebuilt `VV-001` and `TP-001` around a register generated from the
runners, and recorded in §4 that **328 tests carried no identifier** — the whole
static structural layer, plus the configuration, schema and preset suites.

They ran. They passed. They could not be cited, because a traceability document
needs an identifier to point at. `RTM-001` could claim coverage only for the
tests that happened to be numbered, which meant the coverage claim was shaped by
a naming convention rather than by what is verified.

---

## 2. What Was Done

Every unnamed test now carries an identifier, in a series that says what the
suite verifies:

| Series | Cases | Suite |
|--------|-------|-------|
| `VV-CFG-*` | 39 | Configuration profile integrity |
| `VV-DOM-*` | 51 | Counter markup and required elements |
| `VV-SRC-*` | 76 | Application source integrity (static) |
| `VV-AUD-*` | 19 | Audio engine structure |
| `VV-SAV-*` | 18 | Autosave and crash recovery (static) |
| `VV-SCH-*` | 23 | v2 configuration schema |
| `VV-PRE-*` | 20 | Preset catalogue integrity |
| `VV-EDT-*` | 40 | Configuration editor structure |
| `VV-CALC-030` | 1 | One stray in the calculation suite |

Applied by a transformer over the source rather than by hand, so 285 call sites
were renamed consistently and none was missed. Titles are otherwise unchanged.

Two tests in suite 03 opened with `SYS-001:` and `SYS-004:` — the **requirement**
namespace, which the register deliberately excludes. They are now `VV-DOM-050`
and `VV-DOM-051`, tracing to those requirements in their titles instead.

The register: **688 verification cases across 26 series, run as 746 tests, none
without an identifier.**

---

## 3. Two Counting Errors Found in the Register Itself

Naming the tests exposed two defects in the tooling that reports on them.

**The register under-counted by 91.** `parseRegister` matched row identifiers
with `-\d+`, requiring a hyphen before the digits. `TC-B012` fuses its letter to
them, so **all 91 behaviour cases were invisible** to every check that read the
committed register — including QC-005, which verifies that cited identifiers
exist. This is the third instance of the same regex assumption in this codebase,
after the citation parser and the file-layout parser.

**"Unidentified" was measuring the wrong thing.** The figure counted
`total − distinct identifiers`, which treats a parametrised case — one per
shipped preset, per theme, per contrast surface — as an unidentified test. It
also counted `describe` blocks, which the Node reporter prints with a duration
like a test. The register now distinguishes **cases** from **test instances**,
and derives "carries no identifier" from the runners' own totals.

---

## 4. Guarded

**QC-011** reads the committed register and fails if it reports any test without
an identifier, or if its headline disagrees with the rows beneath it. A new test
added without one is now a coverage gap the build refuses, rather than one
`RTM-001` silently cannot express.

Revert-checked: stripping the identifier from a single test and regenerating
makes QC-011 fail.

**617 Node + 380 system = 997 passing, 0 failures, 7 documented skips.**

---

## 5. What This Does Not Address

- An identifier makes a test **citable**, not **traced**. `RTM-001` cites the
  series it always did; wiring the 286 newly named cases to specific
  requirements is a separate exercise, and the honest position is that most of
  them verify structure rather than a requirement directly.
- The static suites remain static: they assert on source text, not behaviour.
  Naming them does not change what they prove, and `README.md` still labels
  them as such.

---

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. 285 call sites named across eight suites; two requirement-namespaced titles corrected; `parseRegister` under-count and the cases-versus-instances error fixed; QC-011 added. |

---

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
