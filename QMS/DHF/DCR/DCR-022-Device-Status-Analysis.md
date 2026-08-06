# DCR-022: Design Change Record — Device Status Analysis

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-022 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **PREPARED — NOT REVIEWED.** Requires a qualified regulatory reviewer before any reliance |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` §2.3 G-3 |
| **Adds** | DHF-001 §3.0 |

---

## 1. Why This Was Written

The Design History File asserts 21 CFR Part 820, IEC 62304 and ISO 14971, and
reasons carefully about software safety class in §3.1. It never asked the prior
question: **is this software a device at all?**

Independent review raised it, and identified it as the single highest-leverage
document in the file — because if the four criteria of **FD&C Act
§520(o)(1)(E)** are met, the entire quality apparatus becomes documented good
practice undertaken voluntarily rather than a compliance obligation this project
is at risk of failing.

That is also the honest answer to whether the process around this software is
disproportionate, which has been an open question since the first review.

---

## 2. What §3.0 Says

The four criteria are walked individually against the intended use. The
assessment is that all four are met, with the analysis singling out one as weak
and one as strong rather than presenting a uniform case.

**Criterion (i) — no signal from an IVD — is the weakest.** The inputs are
keystrokes: the operator looks down a microscope, decides what a cell is, and
presses a key. Nothing is acquired from an instrument.

But the absolute-count feature accepts a white cell concentration the operator
**types in**, having read it from a haematology analyser, and performs
arithmetic on it that changes the absolute neutrophil count. §3.0.3 sets out
both readings — that a number transcribed by a professional is medical
information rather than a signal, versus that the value originates from an IVD —
and asks a reviewer to decide rather than asserting the favourable one.

Two design choices support the first reading, and both were made for other
reasons: the correction is **displayed rather than applied silently**, and the
feature is **optional and off by default in the report**. If a reviewer takes the
second reading, the conclusion fails only for the configuration with absolute
counts enabled, which is separable.

**Criterion (iv) — independent review of the basis — is the strongest.** FDA's
2022 guidance treats this as the demanding one. Four things already in the
product bear on it, none built for this purpose: the inputs are the
professional's own classifications; every report states the conventions that
produced it; `calculation-reference.html` publishes the full derivation with its
controversies and citations; and the software states the precision of its own
output, saying explicitly when a count does not resolve a threshold. The output
is not a directive, nothing is time-critical, and the arithmetic is reproducible
by hand.

---

## 3. What It Deliberately Does Not Do

- **It does not claim a regulatory position.** §3.0 opens by saying it is not
  regulatory advice, and §3.0.8 records the status as *"Prepared. Not reviewed.
  Not relied upon."* with three outstanding reviewer actions.
- **It does not withdraw §3.1.** The IEC 62304 Class A analysis is retained as a
  voluntary secondary position. If the device question is answered the other
  way, the safety classification is already in place.
- **It does not reduce the quality system.** §3.0.7 argues the opposite: if the
  software is not a device, the QMS is the *only* control the manufacturer has,
  so the case for keeping it is stronger. The verification architecture, risk
  file, traceability and change control are retained regardless.
- **It does not travel outside the United States.** §3.0.6 records that under EU
  MDR Annex VIII Rule 11 and MDCG 2019-11, software providing information used
  for diagnostic decisions is generally a device and frequently Class IIa. The
  conclusion here says nothing about that.
- **It does not reduce liability**, or anything owed under CLIA, CAP or
  ISO 15189.
- **It was not prepared by a regulatory professional**, and says so.

---

## 4. The Argument Is Tied to the Code

§3.0.4 rests on four product features, and §3.0.5 records them as load-bearing
rather than decorative. Three tests make that literal, so that removing one
fails the build instead of quietly making the regulatory argument untrue:

| ID | Verifies |
|----|----------|
| UD-090 | All four criteria are assessed, the statute and guidance are cited, and the analysis names which criterion is weakest and which strongest |
| **UD-091** | **`buildMethodStatement`, `wilsonInterval`, `evaluateThresholds` and `calculation-reference.html` all still exist**, and the intended-use statement still disclaims cell identification |
| UD-092 | The analysis stays labelled unreviewed, keeps its reviewer actions open, disclaims being regulatory advice, and records that it does not travel to the EU |

Revert-checked, each reproducing its defect: removing the method statement fails
UD-091; deleting the cell-identification disclaimer fails UD-091; marking the
analysis "Confirmed — non-device" without a reviewer fails UD-092.

UD-092 is the one that matters most. An unreviewed regulatory conclusion that
quietly loses its caveats is worse than no analysis, and this file has now
produced four separate instances of a corrected claim failing to propagate.

**616 Node + 368 system = 984 passing, 0 failures, 7 documented skips.**

---

## 5. Outstanding

| Action | Owner | Status |
|--------|-------|--------|
| Confirm or reject the §3.0.2 assessment of all four criteria | Qualified regulatory reviewer | **Outstanding** |
| Decide criterion (i) on the transcribed analyser WBC (§3.0.3) | Qualified regulatory reviewer | **Outstanding** |
| Confirm the EU position separately if distribution is contemplated | Qualified regulatory reviewer | **Outstanding** |

Until the first two are closed, **§3.1 (IEC 62304 Class A) remains the operative
position** and this project continues to be run as though the software were a
device.

---

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. DHF-001 §3.0 added: device status under FD&C Act §520(o)(1)(E) and FDA's 2022 CDS guidance, with criterion (i) flagged as the weakest and the analysis tied to the code by UD-090 to UD-092. |

---

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Regulatory Reviewer** | | | **required before any reliance — see §5** |
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
