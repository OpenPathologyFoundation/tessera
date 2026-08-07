# DCR-027: Design Change Record — Withdrawal of an Unobtainable Citation, and a Generated Sign-off Register

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-027 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical comment invited, see §6 |
| **Parent Document** | DHF-001 |
| **Input** | Document Owner; the reviewer could not obtain REF-001 [S4] |
| **Closes** | REF-001 [S4] "primary text not held", open since DCR-005 |

---

## 1. Two Problems, One Cause

Both of these are the same failure in different clothes: **a statement that
someone else has to trust and cannot check.**

**[S4] could not be read.** Rümke's 1985 paper — *"The imprecision of the ratio
of two percentages observed in differential white blood cell counts: a
warning"* — is cited widely and secondarily for a proposition this file relies
on. Every attempt to obtain the primary text failed, including through the Yale
library. It has been listed as "primary text not held" since DCR-005, carried
forward through DCR-007, DCR-009 and DCR-026 as open and non-blocking.

Non-blocking is not the same as harmless. A design file that cites a paper
nobody involved has read is asserting an authority it cannot produce on request.

**The list of outstanding signatures was wrong.** `CLINICAL-REVIEW-BRIEF.md` §5
named eleven documents needing a clinical signature. The true figure was
thirty-one, because the file kept growing after the brief was written — sixteen
change records since — and nothing made the list follow it. Worse, §6 item 3
listed the missing M:E confidence interval as an open limitation. DCR-026 had
closed it the same week.

A reviewer handed a stale checklist has no way to know it is stale. That is the
one reader who cannot check.

---

## 2. The Citation Is Withdrawn, and the Claim Is Derived Instead

[S4] is struck through in REF-001 and marked **WITHDRAWN 2026-08-06 — not
obtainable**. Its "What It Supports" column now reads: *nothing.*

That is affordable because the proposition is not exotic. A ratio of two counted
proportions is materially less precise than either, and REF-001 §3.8 now derives
this from the binomial model the software already implements rather than
borrowing it:

> Conditioning on m = M + E leaves a single binomial with p = M/m, and
> M:E = p/(1 − p) is the odds of p. The interval is the odds transform of the
> Wilson interval, which [S7] (held) supports.

What supports §3.8 now: **the derivation**, **[S7]** Brown, Cai & DasGupta (held)
for the choice of interval, and **[S8]** Hedley et al. (held, open access) for
the quantified limitations of manual differential counting.

**Nothing was removed from the design history.** The revision histories of
RA-001 and DHF-001, and DCR-005/007/009/026, still name the paper, because they
record what was decided and why at the time. Rewriting those would falsify the
record. What changed is that no live requirement, specification or operator-facing
page cites it any longer:

| Where | Before | Now |
|---|---|---|
| `REF-001` [S4] | Held as a citation, primary text not obtained | Struck through, withdrawn, supports nothing |
| `REF-001` §3.8 | "Rümke's warning made legible" | "the imprecision made legible" — the derivation |
| `URS-001` URS-037 | "the imprecision Rümke warned of [S4]" | "the sampling variability quantified in [S8]" |
| `calculation-reference.html`, `methods.html` | Named the paper to the operator | No mention |
| `wbc-core.js`, `mdc-app.js` | Attributed the advisory to it | Two comments recording *why* it went |

URS-037 is worth noting separately: it cited [S4] for the imprecision of a
**single percentage**, which is not what the paper is about. The citation was
wrong on its own terms before it was unobtainable.

---

## 3. The Sign-off List Is Now Measured

`scripts/qms-signoffs.js` reads the *Approval Signatures* table of every
document in `QMS/DHF/` and `QMS/DHF/DCR/`, treats a row with an empty Name as
outstanding, and generates `SIGNOFF-REGISTER.md` §3 from what it finds.

Three classes of row are excluded, each for a stated reason:

| Excluded | Why |
|---|---|
| Laboratory Director, Quality Manager, Medical Director | The adopting laboratory's signatures, not this project's |
| `DCR-TEMPLATE.md` | A blank template; its rows are empty by design |
| Any document marked `SUPERSEDED` | Retained for design history — URS-001 v1.0 |

Without the last two the first run reported outstanding **Design Engineer** and
**Quality Assurance** signatures, roles that are in fact signed throughout. A
measurement that reports work nobody should do is as misleading as one that
hides work somebody must.

**Result: 31 outstanding across 3 roles; 9 documents fully signed.**

The register is not merely a longer list. §2 states in full the **three change
records that carry a specific question** — DCR-016 §4 (the corrected white cell
count, which blocks clinical use of that feature), DCR-022 §5 (device status,
which needs a *regulatory* reviewer), and DCR-026 §6 (the M:E interval, invited
rather than blocking) — so that a reviewer meets the three that matter before
the twenty-eight that are routine.

`CLINICAL-REVIEW-BRIEF.md` §5 no longer holds a copy of the list. It points at
the register, which is the only version that will still be right when it is
read.

---

## 4. Verification

| Case | What it holds |
|---|---|
| **SC-054** | REF-001 records [S4] as withdrawn, struck through, with the reason, and supporting nothing |
| **SC-055** | No operator-facing page cites it |
| **SC-056** | The scripts name it only inside a comment that says it was withdrawn |
| **SC-057** | No live requirement or specification cites [S4] — change records and revision histories exempt |
| **QC-012** | The register matches the signature tables it was generated from |
| **QC-013** | The measurement reads real tables: ≥5 documents signed, clinical rows outstanding, no laboratory-local role, every cited document exists |
| **QC-014** | The three documents singled out in §2 are still unsigned — a signed one means that section is answering a question nobody has |
| **QC-015** | The brief points at the register, and no longer lists the M:E interval as outstanding |

Each was revert-checked: the guarded change was undone and the test confirmed to
fail. QC-013 exists because QC-012 alone would pass most reassuringly of all if
the parser broke — an empty register matches an empty measurement.

`CLINICAL-REVIEW-BRIEF.md`'s test total is now written by
`scripts/qms-counts.js`, for the same reason: it is the one document whose
reader has no way to check the figure.

---

## 5. Risk

No change to any calculation, and no new hazard. `HA-097` (documentation
describing software that no longer exists) is the hazard both halves of this
record address, and its detection improves: the sign-off list and the brief's
test total are now measured rather than remembered.

The residual risk of the withdrawal is that Rümke 1985 says something the
derivation misses. It is accepted: the proposition is standard, no tabulated
value from the paper was ever used, and §6 puts the question to a reviewer who
may know the paper.

---

## 6. What a Clinical Reviewer Is Asked

This record is **not blocking**. Comment is invited on one point:

If you know Rümke 1985, does the derivation in REF-001 §3.8 miss anything it
says? No calculation depends on the answer — the interval is derived, not
borrowed — but if the paper makes a point the model does not capture, that is
worth knowing.

If any tabulated value from that paper is ever wanted, the paper must be
obtained first. None should be quoted secondhand.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. [S4] withdrawn as unobtainable and REF-001 §3.8 re-grounded on the derivation plus [S7]/[S8]; URS-037 recited to [S8]; operator-facing mentions removed. `SIGNOFF-REGISTER.md` added and generated by `scripts/qms-signoffs.js`; CLINICAL-REVIEW-BRIEF §5 points at it and §6 items 3–4 corrected. SC-054–057, QC-012–015. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **comment invited — see §6** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
