# DCR-017: Design Change Record — Citation, Evidence Provenance and Counted Quantities

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-017 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` findings C-1, §3.1 (related), §3.2 |
| **Source added** | REF-001 [S10] — Arber et al., *Blood* 2016 |

---

## 1. C-1 — The Blast Denominator Was Withdrawn in 2016, Not 2022

The project stated in four places that WHO 2022 withdrew the non-erythroid-cell
blast denominator. It did not. The **2016 revision of the WHO 4th edition**
(Arber DA et al., *Blood* 2016;127(20):2391–2405) eliminated acute erythroid
leukaemia, erythroid/myeloid subtype, and with it the rule. WHO 2022 (5th ed.)
and the ICC 2022 both **retained** the all-nucleated-cells denominator; neither
introduced it.

This matters more than a date usually would. The rule decides whether a marrow
with expanded erythropoiesis is reported at 9.0% blasts or 22.5% — opposite
sides of the 20% boundary — and the project offers both conventions precisely
so a laboratory can compare against historical results. A reader checking that
claim against WHO 2022 would not find it, and would reasonably doubt the rest.

Corrected in `wbc-core.js`, `web/calculation-reference.html`,
`web/settings/presets/legacy-9.json` (operator-visible threshold basis text)
and `URS-001` URS-039, each now citing [S10].

`DCR-008`, which introduced the error, is left as written: it is a closed
record of what was decided at the time, and rewriting it would remove the
evidence that the correction happened.

**UD-040** pins the attribution across the engine, the reference page and every
shipped profile.

---

## 2. Evidence Now Covers the Layer It Claims

DCR-015 stamped the code identity into every bundle but left the larger half of
the finding open: the runner executed only the Node layer while `TR-001`
headlined a total spanning three browser engines and named `npm run test:all`
as the command. The 368 system results in an **Approved** record had been
appended by hand — nothing tied them to the same tree, the same moment or even
the same machine.

`scripts/qms-run-tests.js` now runs Playwright as part of the same capture:

```
- Node layer: PASS
- System layer (Playwright, 3 engines): PASS
- Command: `npm test && npx playwright test`
- Exit Code: node=0, playwright=0
- Result: **PASS**
```

A run is PASS only if every layer it claims to cover passed. The failure path
was verified deliberately, not assumed: a deliberately failing spec produced
`Node layer: PASS`, `System layer: FAIL`, `Result: FAIL`, and `TR-001` recorded
the failure. `QMS_SKIP_E2E=1` captures the Node layer alone and the bundle then
says so, rather than leaving the omission to be inferred.

The recorded command is written after execution, so a bundle can no longer name
a command it did not run.

---

## 3. Counted Quantities Are Measured, Not Maintained

Nine headline figures were wrong: 49 user requirements against 69, 93 system
requirements against 199, 22 hazards against 51, "579 executed" against 979.
They were wrong because a person had to remember to update them.

`scripts/qms-counts.js` measures them:

| Quantity | Source |
|----------|--------|
| URS, SYS, HA, TC, validation scenarios | Counted from the table rows of the documents themselves |
| Node tests, suite 11, browser specs, engines | **Taken from the runners**, not from grepping for `it(` |

The second row is the load-bearing one. A first version counted call sites and
reported 545 Node tests against an actual 601, and 99 browser specs against
125 — whole families of tests are generated in loops, one per shipped preset,
one per theme, one per contrast surface. Counting by eye is the failure this
script exists to end, so it does not do it either.

**Suite 14** makes it durable: a stale figure fails the build rather than
waiting for the next reviewer. It verifies the **document** counts only —
measuring the test totals would spawn the Node runner from inside the Node
runner. QC-002 guards the measurement itself against a regex that has quietly
stopped matching, which would otherwise report zero and let QC-001 "pass" by
rewriting every figure to nothing.

Both were revert-checked: a stale hazard count fails QC-001, and a broken
hazard regex fails QC-002 rather than silently succeeding.

Test totals are refreshed by `node scripts/qms-counts.js --write` at release.

---

## 4. What This Does Not Address

- **`VV-001` and `TP-001` still do not contain the identifiers that `RTM-001`
  and `TR-001` cite.** The review found 61 such IDs; it is now **98 of 111**,
  because every suite added since has cited new IDs into the traceability
  documents without touching the protocol. This work widened the gap it was
  responding to. It is the largest outstanding item in the file.
- `SDD-001` still describes none of what has been built since DCR-006 — zero
  occurrences of Wilson, confidence, threshold, `denominatorExcludes`, `per100`
  or rounding.
- The counts script covers README and RTM-001 §8. Other documents carry their
  own totals, which remain hand-maintained.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | C-1 corrected with [S10]; the evidence runner executes both layers; counted quantities measured by `scripts/qms-counts.js` and guarded by suite 14. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
