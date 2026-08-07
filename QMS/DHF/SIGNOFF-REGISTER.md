# Sign-off Register

## WBC ΔΣ — what is still unsigned, and what signing it means

| Field | Value |
|-------|-------|
| **Document ID** | SIGNOFF-REGISTER |
| **Purpose** | The single place that states which approvals are outstanding. Generated from the signature tables themselves, so it cannot drift from them. |
| **Parent Document** | DHF-001 |
| **Companion** | `CLINICAL-REVIEW-BRIEF.md` — the invitation and the questions. This is the checklist. |

---

## 1. Read this first

**Nothing in this file is a formality.** Four change records ask specific
questions that an engineer cannot answer, and they are listed in §2 before the
bulk list, because they are the ones that matter.

The rest are documents whose clinical content has been written and verified but
not independently reviewed. Signing one attests that its clinical reasoning is
sound — not that its arithmetic is correct, which is what the automated
verification suite is for.

**Please do not sign anything you have not formed a view on.** A partial
signature set that is honest is worth more than a complete one that is not.

---

## 2. The four that carry a specific question

These are not "please review at your convenience". Each names a decision that
was made on engineering grounds and needs a clinician to accept or reject it.

### DCR-016 §4 — the corrected white cell count · **blocks use of the feature**

Absolute counts are now derived from an analyser WBC corrected for nucleated red
cells. At 20 NRBC per 100 WBC an uncorrected value overstates every absolute
count by 20%, and the absolute neutrophil count drives neutropenia grading.

**What needs your judgement:**

1. That the correction should **default to applied**, with the operator
   declaring an already-corrected value — rather than the reverse.
2. That exclusion from the differential denominator is the right **trigger**,
   and no other counted population warrants it.
3. Whether the basis belongs in the **report text**, not only on screen.

Until this is signed, the corrected-WBC feature should not be relied on
clinically.

### DCR-022 §5 — device status · **blocks any regulatory reliance**

An analysis of whether this software is a medical device at all, under FD&C Act
§520(o)(1)(E) and FDA's 2022 Clinical Decision Support guidance. It concludes
all four criteria are met.

**It was not written by a regulatory professional and must not be relied on
until one confirms it.** IEC 62304 Class A (DHF-001 §3.1) remains the operative
position meanwhile. This needs a **regulatory** reviewer, not a clinical one.

### DCR-026 §6 — the M:E confidence interval · **invited, not blocking**

The M:E ratio now carries a confidence interval, computed as the odds transform
of a Wilson interval on the conditional binomial.

**What needs your judgement:**

1. Whether **conditioning on M + E** is the right model, as against treating the
   two counts as independent Poisson variables.
2. Whether displaying a **wide interval** beside a familiar figure invites
   appropriate caution or unwarranted doubt.

### DCR-027 §6 — a withdrawn citation · **comment invited, not blocking**

Rümke 1985 is cited throughout the haematology literature for the imprecision of
a ratio of two counted proportions. It could not be obtained from any library
available to this project, so it has been withdrawn and the claim derived from
the binomial model instead (REF-001 §3.8).

**What would help:** if you know the paper, does the derivation miss anything it
says? Nothing in the software depends on the answer — but if it makes a point
the model does not capture, that is worth knowing. No tabulated value from it
should be quoted until someone holds the paper.

---

## 3. Everything outstanding

<!-- BEGIN GENERATED: signoff-register -->

> **Generated. Do not edit by hand.**  
> `node scripts/qms-signoffs.js --write` rebuilds this from the signature
> tables in every document. Suite 14 fails the build if it goes stale.

**34 signature(s) outstanding across 3 role(s).** 15 document(s) are fully signed.

### Clinical Reviewer — 31 outstanding

| Document | Note |
|----------|------|
| `CALCULATION-REFERENCE.md` | — |
| `DCR/DCR-004-Verification-Integrity-Remediation.md` | — |
| `DCR/DCR-005-Standards-Grounding.md` | — |
| `DCR/DCR-006-Denominator-Policy.md` | — |
| `DCR/DCR-007-Sampling-Precision.md` | — |
| `DCR/DCR-008-Thresholds-And-Subset-Formulas.md` | — |
| `DCR/DCR-009-Method-Provenance.md` | — |
| `DCR/DCR-010-Selectable-Reporting-Policy.md` | — |
| `DCR/DCR-011-Presentation-Legibility.md` | — |
| `DCR/DCR-012-Configuration-Fidelity.md` | — |
| `DCR/DCR-013-Counting-Policy-Editor.md` | — |
| `DCR/DCR-014-Shared-Dialog.md` | — |
| `DCR/DCR-015-Review-Remediation.md` | — |
| `DCR/DCR-016-Corrected-WBC.md` | **required before use — see §4** |
| `DCR/DCR-017-Citation-Evidence-Counts.md` | — |
| `DCR/DCR-018-Verification-Register.md` | — |
| `DCR/DCR-019-SDD-Revision.md` | — |
| `DCR/DCR-020-Scope-Reduction.md` | — |
| `DCR/DCR-021-SAD-Revision.md` | — |
| `DCR/DCR-022-Device-Status-Analysis.md` | — |
| `DCR/DCR-023-Display-Consistency.md` | — |
| `DCR/DCR-024-Verification-Identifiers.md` | — |
| `DCR/DCR-025-Scientific-Framing.md` | — |
| `DCR/DCR-026-Ratio-Confidence-Interval.md` | **invited — see §6** |
| `DCR/DCR-027-Citation-Withdrawal-And-Signoff-Register.md` | **comment invited — see §6** |
| `DCR/DCR-032-Predecessor-Profile.md` | **invited — §3 aggregation and the missing NRBC key** |
| `DCR/DCR-035-Profile-Naming.md` | **invited — see §7** |
| `DHF-001-DesignHistoryFile-Index.md` | — |
| `RA-001-RiskAnalysis-FMEA.md` | — |
| `REF-001-StandardsAndLiterature.md` | — |
| `VV-001-VerificationValidationProtocol.md` | — |

### Clinical User Representative — 2 outstanding

| Document | Note |
|----------|------|
| `SOP-001-StandardOperatingProcedure.md` | — |
| `URS-001_UserRequirementsSpecification_v2.0.md` | — |

### Regulatory Reviewer — 1 outstanding

| Document | Note |
|----------|------|
| `DCR/DCR-022-Device-Status-Analysis.md` | **required before any reliance — see §5** |

### Not for signature

| Document | Why |
|----------|-----|
| `URS-001-UserRequirementsSpecification.md` | Superseded, retained for design history |
| `DCR/DCR-TEMPLATE.md` | A blank template; its rows are empty by design |

<!-- END GENERATED: signoff-register -->

---

## 4. What each signature attests

| Role | Attests |
|------|---------|
| **Clinical Reviewer** | The clinical reasoning is sound: the conventions chosen, the severity ratings, the interpretation of the standards, and the acceptability of the residual risks |
| **Clinical User Representative** | The workflow matches how a differential is actually performed at a bench |
| **Regulatory Reviewer** | Only DCR-022, and only the device-status analysis in it |
| Design Engineer, Quality Assurance | Already signed throughout. Both are the same person, which is itself a limitation — see §5 |

Name and date are sufficient. These are not 21 CFR Part 11 electronic
signatures; version control provides the audit trail.

**Not for a clinical reviewer:** `SOP-001`, whose signatories are the adopting
laboratory's own Director and Quality Manager, and any superseded document
retained for design history.

---

## 5. What is still open, stated plainly

1. **The NRBC reporting convention is not backed by a primary source held in
   full.** CLSI H20-A2 is paid; its 200-cell specification is quoted verbatim in
   an open-access ICSH paper, but the NRBC reporting rule is not. REF-001 §2.1.
2. **CLSI H56-A is not held**, so the body fluid profile rests on secondary
   sources. It affects that preset only.
3. **Rümke 1985 has been withdrawn as a citation** (REF-001 [S4]). It is widely
   cited for the imprecision of a ratio of two proportions, and it could not be
   obtained. The claim is now derived from the binomial model in the software
   rather than borrowed, so nothing rests on it — but if you know the paper and
   think the derivation misses something it says, that is worth knowing.
4. **One person built and verified this.** The engineering roles are all held by
   the Document Owner. An independent review was commissioned in August 2026 and
   its findings are closed (DCR-015 through DCR-027), which is a second pair of
   eyes on the code — but not a second engineer on the project.

---

## 6. If you would rather not sign

Answers without signatures are genuinely useful, and so is "I disagree with the
premise of that question". The purpose is to find out whether the clinical
judgements embedded in this tool are sound.
