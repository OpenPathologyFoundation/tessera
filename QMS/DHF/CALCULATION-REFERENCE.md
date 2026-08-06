# CAL-001: Calculation Reference

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | CAL-001 |
| **Version** | 1.1 |
| **Type** | Instructions for Use |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Controlled artefact** | **`web/calculation-reference.html`** |

---

## Purpose

CAL-001 explains every number the application produces, for a pathologist who is
not a haematopathologist: what is calculated, how, why, what the alternatives
are, where the professional controversy lies, the citations, and which choices a
laboratory can configure. Every abbreviation is expanded.

## The controlled artefact is the served page

**The document itself is `web/calculation-reference.html`.** It is not
reproduced here.

That page ships with the product, is reachable from the case-entry screen, the
Methods and Limitations page and the results screen, and is cached for offline
use. Keeping the text in one place is deliberate: a second copy in this
directory would drift from the served page, and drift in a document that quotes
worked clinical figures is precisely the failure mode recorded as HA-097.

This is the same arrangement as MAL-001 (`web/methods.html`).

## How it is verified

The page is not proofread; it is checked against the software. Test suite 13
(`tests/13-user-documentation.test.js`) recomputes from the shipped calculation
engine every worked example, comparison table and confidence interval the page
quotes:

| Test | Verifies |
|------|----------|
| UD-030 | The NRBC denominator comparison, both columns |
| UD-031 | All three rounding policies and the totals they produce |
| UD-032 | Both M:E conventions and the ratios stated |
| UD-033 | Every confidence interval in the table |
| UD-034 | The Wald-versus-Wilson comparison |
| UD-035 | The blast-denominator example and its scenario |
| UD-036 | **That every choice the page calls configurable really is** |
| UD-037 | That what it calls fixed is stated as fixed |
| UD-038 | That every abbreviation used is expanded |

UD-036 is the load-bearing one: a reference promising configurability the
software does not offer would be worse than one promising nothing.

## Relationship to the other operator documents

| Document | Audience | Depth |
|----------|----------|-------|
| `USER-GUIDE.md` | New operator | How to run a count |
| **MAL-001** `web/methods.html` | Operator and report reader | What each figure means, and the limits of the method |
| **CAL-001** `web/calculation-reference.html` | Pathologist evaluating or configuring the tool | The full derivation, alternatives, controversies and citations |

## Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-05 | QMS | Issued as a Markdown document under DCR-010. |
| B | 2026-08-05 | QMS | Content moved to `web/calculation-reference.html` so that it is reachable from the application, available offline, and held in one place. This record retains the document control fields and the verification mapping. |

## Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-05 |
