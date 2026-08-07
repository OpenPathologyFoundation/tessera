# DCR-028: Design Change Record — Licence Statement and Reservation of the Name and Mark

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-028 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Document Owner |
| **Supersedes** | Nothing. Extends DCR-002 (rename, logo, licence). |

---

## 1. Two Grants, One Repository

The project makes two different offers and they must not blur into one.

**The code is Apache-2.0.** Anyone may use, modify, distribute and sell it,
including inside a commercial product. That is what the licence is for and it is
not qualified here.

**The name "WBC ΔΣ" and the logo are reserved.** Apache-2.0 §6 grants no rights
in the licensor's trade names, trademarks or product names, so the reservation
already holds by default. What was missing was the machinery that makes it
*travel* and makes it *findable*.

This distinction is worth stating precisely because it is easy to state wrongly.
The marks are reserved; **commercial use of the software is not restricted**. A
company may build a product on this engine. It may not call that product WBC ΔΣ,
carry its mark, or imply endorsement.

---

## 2. What Was Missing

`LICENSE` and `TRADEMARKS.md` were both present and both correct. Three gaps
sat around them:

| Gap | Why it matters |
|---|---|
| **No `NOTICE` file** | Apache-2.0 §4(d) obliges a redistributor to carry the NOTICE. It is the only clause that makes the reservation follow the code downstream. Without one, a fork carries the licence but no statement of what the licence does not grant. |
| **`README.md` never pointed at `TRADEMARKS.md`** | The policy existed and appeared only as a filename in the directory listing. A reader looking for the terms found four lines under *License* and no route to the rest. |
| **The logo was unmarked where it actually lives** | It is not an asset file. It is SVG inlined into `counter.html`, `help.html`, `editor.html` and `logo-showcase.html` — ten occurrences. Someone copying a page copies the mark with it, and a notice three directories away does not travel with a copied page. |

---

## 3. What Changed

**`NOTICE` added.** It restates the licence, then reserves the name and the
logo — naming the inlined-SVG form explicitly — states that commercial use of
the *software* is permitted, permits nominative use, and asks a fork intended for
distribution to adopt its own name and mark while keeping the NOTICE. It also
carries the intended-use and no-warranty statement, so a redistribution cannot
shed it.

**`README.md` §License rewritten** from four bullets to a statement of both
grants, linking `LICENSE`, `TRADEMARKS.md` and `NOTICE`, and saying *why* the
marks are reserved (§6) rather than only that they are.

**Ten inlined logos annotated**, each with a comment naming the reservation and
telling a forker to replace the mark.

---

## 4. Verification

| Case | What it holds |
|---|---|
| **QC-017** | `LICENSE` is Apache-2.0 with the body and the §6 trademark clause; `package.json` and `README.md` agree with it |
| **QC-018** | `NOTICE` exists, reserves the name and the logo, points at the full policy, and states that commercial use of the code is permitted — a NOTICE that blurred that would misdescribe the licence actually chosen |
| **QC-019** | `README.md` points at all three files and states the basis for the reservation |
| **QC-020** | Every inlined logo carries its own reservation, counted from the pages rather than from a list someone maintains |

Each revert-checked. QC-018's first revert-check *passed* when it should have
failed — the mutation lower-cased only some occurrences of "logo" and the
assertion matched a surviving uppercase one. The test was sound; the check was
not. Re-run case-insensitively, it fails as required.

QC-020 counts occurrences rather than asserting a known number, so a logo added
to a new page is caught without anyone remembering to update a total.

---

## 5. Risk

No change to any calculation, page behaviour or shipped configuration; the
annotations are HTML comments. No new hazard. `HA-097` is the relevant hazard —
documentation describing something that is no longer true — and its detection
improves, since the licence statement is now measured rather than remembered.

**Not a legal opinion.** This records what the project intends and makes it
consistently stated. Registration, enforcement and jurisdiction are outside the
scope of this file and outside the competence of its author.

---

## 6. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. `NOTICE` added as the Apache §4(d) carrier for the mark reservation; README §License rewritten to state both grants and link all three files; ten inlined logo occurrences annotated. QC-017–020. |

---

## 7. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
