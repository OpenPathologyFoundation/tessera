# DCR-016: Design Change Record — Corrected WBC for Nucleated Red Cells

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-016 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; **clinical approval required before use** |
| **Parent Document** | DHF-001 |
| **Closes** | DCR-015 §5 first item; `REF-001` §5 open gap G-1 |
| **Hazard** | RA-001 HA-105 (new, pre-RPN 75) |
| **Requirements added** | SRS-001 SYS-248 to SYS-250 |

---

## 1. The Gap

Impedance analysers count nucleated red cells as leucocytes: NRBC resist the
lysing reagent and are registered in the white cell channel. A reported WBC is
therefore inflated whenever nucleated red cells circulate.

The application already:

- excluded NRBC from the peripheral blood differential denominator (DCR-006);
- computed and reported NRBC **per 100 WBC**, the form the correction requires;
- printed the correction formula in `calculation-reference.html`.

And then multiplied the percentages by the **uncorrected** WBC.

```
corrected WBC = reported WBC × 100 ÷ (100 + NRBC per 100 WBC)
```

At 20 NRBC per 100 WBC every absolute count was overstated by 20%.

**Why it matters clinically.** The absolute neutrophil count drives neutropenia
grading and chemotherapy holds. A 20% overstatement moves values across the 1.5
and 0.5 ×10⁹/L boundaries — a reported 1.8 is truly 1.5. And the population in
which nucleated red cells circulate — neonates, severe haemolysis, marrow
infiltration — is exactly the population in which that decision is being made.

Excluding NRBC from the denominator and correcting the WBC are two halves of one
convention. Implementing the first half alone is what produced the error.

---

## 2. What Was Built

`Core.correctWbcForNrbc(reported, nrbcPer100)` — pure, DOM-free, returns the
input unchanged when no correction applies and `null` for an unusable WBC, so a
caller can always multiply the result.

On the results screen:

| Before | Now |
|--------|-----|
| "Total WBC (×10⁹/L)" | **"Analyser WBC (×10⁹/L)"** — it is the analyser's figure, not the leucocyte count |
| — | A checkbox: **"Value is already corrected for NRBC"**, unchecked by default |
| Absolute counts from the entered value | Absolute counts from the corrected value, with the arithmetic displayed |

### The correction is shown, never applied silently

> 10.00 × 100 ÷ (100 + 20.0) = **8.33** ×10⁹/L

with the reason and the magnitude beneath it. Two arguments drove this:

1. **Only the operator knows the provenance of the number.** Many analysers
   report a corrected WBC already. Correcting a corrected value would introduce
   the error in the opposite direction.
2. **Silently changing a number the operator typed is its own hazard.** A figure
   whose basis is unstated cannot be checked by whoever reads it next.

Ticking the checkbox uses the entered value unchanged and says so.

### The control appears only where the correction applies

It is shown only when a category is both counted **and** excluded from the
differential denominator with per-100 reporting — the condition under which an
analyser WBC is inflated. Bone marrow is therefore unaffected: ICSH 2008 §2.6
places erythroblasts inside the nucleated differential count, so no correction
is owed and none is offered. Offering it elsewhere would invite its use where it
is wrong.

---

## 3. Verification

| ID | Layer | Verifies |
|----|-------|----------|
| VV-ABS-020 | Unit | The published formula is implemented exactly, to four decimal places |
| VV-ABS-021 | Unit | A reported 1.8 with 20 NRBC/100 is truly 1.50 — the neutropenia boundary — and the uncorrected figure overstates by exactly 1.200× |
| VV-ABS-022 | Unit | No nucleated red cells means no correction |
| VV-ABS-023 | Unit | An unusable WBC yields `null`, never a silent zero |
| VV-ABS-024 | Unit | The correction is monotonic in the per-100 value and never reaches zero |
| VV-SYS-186 | System | The entered WBC is corrected before any absolute count: ANC 5.00, not 6.00 |
| VV-SYS-187 | System | The value entered, the arithmetic and the result are all displayed |
| VV-SYS-188 | System | An already-corrected value is used as entered, and unticking restores the correction |
| VV-SYS-189 | System | With no nucleated red cells the control is not offered |
| VV-SYS-190 | System | Bone marrow gets no correction |

**Regression detection confirmed** by reverting to the uncorrected WBC:
VV-SYS-186 then reports an ANC of 6.00 where 5.00 is correct — the exact 20%
overstatement this change removes.

**600 Node + 359 system = 959 passing, 0 failures, 7 documented skips.**

---

## 4. Clinical Approval Is Required Before Use

This change alters a number a clinician acts on. The engineering position is
that the formula, its condition of application and its presentation are correct,
and the arithmetic is verified against the published identity. It has **not**
been reviewed by a haematopathologist.

Specifically for clinical review:

- that the correction should default to **applied**, with the operator
  declaring an already-corrected value, rather than the reverse;
- that restricting it to categories excluded from the denominator is the right
  trigger, and that no other counted population warrants it;
- whether the basis should also appear in the report text, which currently
  carries no absolute counts at all.

---

## 5. What This Change Does Not Address

- Absolute counts remain a results-screen aid and do not enter the report
  templates, the clipboard text or the CSV export. The correction is therefore
  visible only to the operator who entered the WBC.
- The correction assumes the analyser counts **all** nucleated red cells as
  leucocytes. Modern analysers with dedicated NRBC channels may report a WBC
  already free of them; that is what the checkbox is for, but the application
  cannot detect it.
- No warning is raised when an entered WBC is implausible for the differential
  observed.

---

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. `correctWbcForNrbc`, the results-screen interface, SYS-248–250, HA-105, VV-ABS-020–024 and VV-SYS-186–190. |

---

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **required before use — see §4** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
