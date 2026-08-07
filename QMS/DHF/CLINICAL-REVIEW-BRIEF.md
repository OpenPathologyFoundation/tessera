# WBC ΔΣ — Invitation to Clinical Review

**A manual differential counter for haematology.**
Peter Gershkovich, M.D., M.H.A. · info@openpathology.tech · 2026-08-05

---

## What I am asking

I have built a keyboard-driven manual differential counter — the digital
equivalent of a mechanical tally counter, with the arithmetic and report
formatting attached. The software is finished and verified. **What it needs now
is haematopathology judgement, which I cannot supply on my own.**

I am asking for about an hour: twenty minutes counting a case with it, fifteen
reading the methods page, and the rest on the specific questions in §3 below.
If you are willing, there are documents to sign at the end; if you are not
willing to sign, the answers alone are still valuable to me.

**I am specifically not asking you to review software.** Every question below is
a clinical one.

---

## 1. What the tool does

You enter a case number, choose a specimen type, and count with the keyboard
while your eyes stay on the microscope. Each key maps to a cell type. Shift +
key undoes a miscount. It shows running percentages, the M:E ratio, and progress
toward a target; when you finish, it produces a formatted report for the LIS.

**It performs no cell recognition and makes no diagnostic decision.** Every
classification is yours. If you press the wrong key it will faithfully record
the wrong cell, and nothing in it can detect that.

Everything clinical is configurable without changing the software — categories,
keys, target counts, derived formulas, diagnostic thresholds, report wording.
That is the central design decision, made because differential counting practice
varies legitimately between institutions and a tool that hard-codes one practice
is wrong everywhere else.

---

## 2. What has been done to it

The counting model was checked against **ICSH 2008 §2.6** line by line. The
shipped bone marrow profile implements the nucleated differential count exactly
— all thirteen categories — and the M:E formula matches the ICSH definition term
for term. Automated tests now hold it there, so a future configuration change
cannot drift off the standard without failing the build.

Along the way the review found two errors that were live in the software and
would have affected reported values. Both are described below because they are
the things I most want a second opinion on.

The software carries <!-- qms:fact tests_total -->1124<!-- /qms:fact --> automated tests across three browsers. It is classified
**IEC 62304 Class A** on the basis that a differential count is one input among
several, is produced by a qualified operator who has identified every cell, and
is reviewed before release under the laboratory's quality system. If you think
that reasoning is wrong, I need to know.

---

## 3. The questions I need your judgement on

### 3.1 Nucleated red cells in the peripheral blood differential

**This is the one that changed reported patient values.**

The tool previously counted NRBC into the denominator of the peripheral blood
leucocyte differential. It no longer does: NRBC are counted, excluded from the
denominator, and reported as NRBC per 100 WBC.

For a slide with 180 leucocytes and 20 NRBC:

| | Before | Now |
|---|---|---|
| Segmented neutrophils | 60.0% | **66.7%** |
| Lymphocytes | 20.0% | **22.2%** |
| Nucleated red cells | 10.0% *of all cells* | **11.1 per 100 WBC** |
| Report opens | "A 200-cell differential" | **"A 180-cell differential count"** |

Bone marrow is unchanged — erythroid precursors belong in the marrow
differential per ICSH.

> **Q1.** Is this the correct convention for your laboratory, and is the report
> wording right? I could not find this stated in a primary standard I hold —
> CLSI H20-A2 is behind a paywall and the ICSH flow cytometry paper supports the
> principle but not the reporting rule. **This is the weakest citation in the
> whole file and the one I would most like corroborated.**

### 3.2 The M:E ratio convention

The tool follows ICSH 2008 §2.6: all granulocytes and monocytes **and their
precursors** over erythroblasts at all stages. Lymphocytes, plasma cells and
mast cells take no part.

A widely taught alternative **excludes monocytes** from the numerator, and gives
a different ratio from identical counts.

> **Q2.** Is ICSH the right default? Should the alternative ship as an
> option? Every report states which convention produced it, which I did because
> the two are not comparable — is that sufficient, or does it need to be more
> prominent?

The ratio now also carries a confidence interval, added after this brief was
first written (DCR-026). It is the odds transform of a Wilson interval on the
conditional binomial — the model treats M + E as fixed and asks what fraction of
those cells were myeloid. At 30 cells a 2.3:1 ratio reads **1.1–5.0**, which is
the honest width and a startling one.

> **Q2a.** Is conditioning on M + E the right model, as against treating the two
> counts as independent Poisson variables? And does a wide interval beside a
> familiar figure invite appropriate caution, or unwarranted doubt?

### 3.3 Confidence intervals on every percentage

The results screen shows an interval beside each percentage. A differential is a
sample: had you counted a different 200 cells from the same slide you would have
got a somewhat different answer.

| Observed | At 200 cells | At 500 cells |
|---|---|---|
| 20% blasts | **15.0–26.1%** | 16.7–23.7% |
| 5% | 2.7–9.0% | 3.4–7.3% |
| 0% | 0–1.9% | 0–0.8% |

> **Q3.** Is this useful at the bench, or is it noise? I judged that a
> percentage looks equally confident whether it came from 500 cells or 50, and
> that stating the precision is more honest than implying certainty. But you are
> the one who has to read these reports.

### 3.4 The near-threshold advisory — the one I am least sure about

When an interval spans a configured diagnostic threshold, the results screen
says so. An observed 20% blasts at 200 cells straddles the 20% AML boundary, so
the count does not establish which side of it the true value lies on. ICSH §2.6
recommends extending the count in that situation, and the tool offers Continue
Counting.

It is **advisory and never blocks** finishing — a paucicellular aspirate may make
a longer count impossible, and you are the one who knows that.

> **Q4.** **Does this read as helpful or as presumptuous?** It is a piece of
> software telling a pathologist their count has not settled a question. I think
> it is defensible because it states a statistical fact rather than a clinical
> opinion, but tone matters and I may have it wrong. This is the single most
> opinionated thing in the system.

### 3.5 Target cell counts

Bone marrow defaults to 500 cells, peripheral blood to 200. ICSH makes the
marrow figure conditional — at least 500 across two smears when a precise
abnormal percentage is needed for diagnosis, at least 300 when the differential
is not essential to it. A 2018 AJCP study of 165 cases found 300-cell counts
diagnostically equivalent to 500, including 100% sensitivity at the 20% blast
threshold.

The target is advisory. You can finish at any count, and finishing below target
produces a note stating the precision your count achieved.

> **Q5.** Are the defaults right? Should a 300-cell marrow profile ship
> alongside the 500-cell one?

### 3.6 The "other" category

ICSH excludes megakaryocytes, macrophages, osteoblasts, osteoclasts, stromal
cells, smudged cells and metastatic tumour cells from the differential. The tool
offers an "other" category, which invites exactly those. Counting one into it
puts it in the denominator and lowers every reported percentage.

The mitigation is guidance on hover and in the documentation, directing such
findings to the morphology comment instead.

> **Q6.** Is that enough, or should "other" be removed from the default profile?

### 3.7 Risk ratings

The risk file rates 42 hazards on Severity × Occurrence × Detection. I have
reviewed and accepted the **Severity** values, but Severity is a clinical
judgement about consequence to a patient and it is the column I am least
qualified to set alone.

> **Q7.** Are the Severity ratings right, and are the accepted residual risks
> acceptable? Two remain at Medium: counting without a case number (optional by
> design, on the stakeholder view that physical context identifies the specimen
> at the microscope) and a wrong case number transcribed by hand.

---

## 4. How to try it

The application runs in a browser with no installation and works offline.
Nothing is transmitted anywhere; counts stay in your browser and are lost when
it closes unless exported.

Suggested twenty minutes:

1. Count a routine marrow to about 200 cells and click **Count Done**. Look at
   what the report says and whether you would paste it into your LIS unchanged.
2. Click **Continue Counting**, add cells, finish again. This is the workflow a
   colleague asked for — a way back to counting when percentages look borderline.
3. Switch to peripheral blood and count a case with NRBC. Check §3.1 against
   what you see.
4. Count a case that lands near 20% blasts and see how the threshold advisory
   reads in practice (§3.4).
5. Read **Methods and Limitations**, linked from the opening screen. That is
   what your staff would rely on to interpret the numbers, so it deserves as
   much scrutiny as the tool itself.

---

## 5. What I would ask you to sign

**The list lives in [`SIGNOFF-REGISTER.md`](SIGNOFF-REGISTER.md), not here.**

This section used to name eleven documents. There are now thirty-one
outstanding signatures, because the file kept growing after the brief was
written and nothing made this list follow it. The register is generated from the
*Approval Signatures* table of every document in the file, and a test fails the
build if it falls out of step — so it is the one that will still be right when
you read it.

What it will tell you:

- **Three change records carry a specific question**, and the register states
  each one in full rather than asking you to find it. DCR-016 §4 (the corrected
  white cell count — this one blocks clinical use of the feature), DCR-022 §5
  (device status, which needs a **regulatory** reviewer, not you), and DCR-026 §6
  (the M:E interval, Q2a above — invited, not blocking).
- **The rest**, whose clinical content has been written and verified but not
  independently reviewed. Signing one attests that its clinical reasoning is
  sound — not that its arithmetic is correct, which is what the verification
  suite is for.
- **What is not for you**: `SOP-001`, whose signatories are the adopting
  laboratory's own Director and Quality Manager, and any superseded document
  retained for design history.

Name and date is sufficient — these are not 21 CFR Part 11 electronic
signatures, and the version control system provides the audit trail.

**Please do not sign anything you have not formed a view on.** A partial
signature set that is honest is worth more to me than a complete one that is
not.

---

## 6. What is still open, stated plainly

1. **The NRBC convention (§3.1) is not backed by a primary source I hold.**
   CLSI H20-A2 is a paid standard. Its 200-cell specification is quoted in an
   open-access ICSH paper, but the NRBC reporting rule is not.
2. **CLSI H56-A is not held**, so the body fluid profile rests on secondary
   sources. It affects that preset only.
3. **The M:E interval is derived here, not borrowed.** This brief originally
   said no interval was computed and pointed at Rümke 1985 for the underlying
   claim. The interval now exists (§3.2, DCR-026). The citation does not: Rümke
   is widely cited for the imprecision of a ratio of two proportions and could
   not be obtained from any library available to me, so it has been **withdrawn**
   (REF-001 [S4]) and the claim now rests on the binomial model in the software.
   Nothing depends on the paper — but if you know it and think the derivation
   misses something it says, that is worth knowing.
4. **One person built and verified this.** The engineering roles in the file are
   all mine. An independent review was commissioned in August 2026 and its
   findings are closed (DCR-015 through DCR-026), which is a second pair of eyes
   on the code — but not a second engineer on the project, and the quality
   assurance signature still attests to process followed rather than to
   independent judgement.

---

## 7. If you would rather not sign

Answers to §3 without signatures are genuinely useful, and so is "I disagree
with the premise of question N". The purpose of this review is to find out
whether the clinical judgements embedded in this tool are sound. A reviewer who
tells me Q4 reads as presumptuous, or that the NRBC change is wrong for their
laboratory, has given me the thing I asked for.

---

*WBC ΔΣ is a counting and calculation aid for trained laboratory personnel. It
performs no cell identification and makes no diagnostic decision. Any laboratory
deploying it should validate it locally under its own quality management system.*
