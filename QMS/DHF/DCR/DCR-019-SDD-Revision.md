# DCR-019: Design Change Record — SDD-001 Revision

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-019 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Input** | `REVIEW-2026-08-06.md` §3.4 |
| **Re-issued** | SDD-001 → v3.0 |

---

## 1. The Defect

`SDD-001` described different software than the one shipped.

- **Zero occurrences** of Wilson, confidence, threshold, `denominatorExcludes`,
  `per100` or rounding. DCR-006 through DCR-018 were entirely undesigned.
- **§3.5.2 gave the wrong algorithm**: `percentage = counts[ct] / total × 100`
  then `toFixed(2)`. Every clause of that is wrong — the denominator may exclude
  categories, rounding is a selectable policy, and display and report precision
  are separate.
- **§3.8's schema** documented a nine-category layout with key mappings (`L` for
  blasts) that has not shipped since v2.0, and omitted every policy field.
- **§5 stated that Tailwind loads from a CDN.** It is vendored and precached —
  and a CDN dependency would defeat URS-094, the requirement that counting works
  without an internet connection.
- **RTM-001 cited §3.9 and §3.11 to §3.17, and §5.1.** The document ended at
  §3.8. Nine of the requirement rows in the traceability matrix pointed at
  design sections that did not exist.

A design document is what a reviewer reads to decide whether an implementation
is sound. One that describes different software is not merely stale.

---

## 2. What Was Written

`SDD-001` v3.0. §3.9 to §3.18 added, each closing a citation that pointed
nowhere:

| § | Covers | Closes |
|---|--------|--------|
| 3.9 | Reset and state lifecycle | URS-003, 060, 063 |
| **3.10** | **The calculation engine** — module boundary, denominator policy, rounding, Wilson intervals, thresholds, derived figures, validation, method provenance | DCR-006 to DCR-010 |
| 3.11 | Configuration lifecycle: resolution order, import/export, supersede | URS-103, 106 |
| 3.12 | Audio feedback | URS-027, 097 |
| 3.13 | Absolute counts and the NRBC correction | URS-036, DCR-016 |
| 3.14 | Autosave and crash recovery | URS-085 |
| 3.15 | Offline operation | URS-094 |
| 3.16 | Preset catalogue | URS-101 |
| 3.17 | Configuration editor | URS-102, 104 |
| 3.18 | The shared dialog | DCR-014 |

§3.10 is the substantial one. It states the denominator identity and why the
two expressions are the same; why a category outside the denominator returns
`null` rather than zero; the three rounding policies and the worked
fourteen-category case that separates them; why Wald was rejected and Wilson
chosen; that thresholds advise and never block; that both M:E conventions are
expressible; and that one validation function gates every route a profile can
enter by.

§5 rewritten as *Presentation and Delivery*, recording that Tailwind is
vendored, that there is no build step — which is what allows the unit layer to
execute the shipped engine — and the theming rules with the reasoning behind
them.

**§3.5.2 is marked superseded rather than deleted**, so a reader of an earlier
revision can see what changed and why. §3.8's schema is replaced with the v2
profile, annotated with which fields change a reported number.

---

## 3. Guarded

Prose cannot be checked the way arithmetic can, but three properties can:

| ID | Verifies |
|----|----------|
| UD-060 | **Every SDD section RTM-001 cites exists** |
| UD-061 | The design mentions each calculation that changes a reported number |
| UD-062 | The superseded formula is marked as superseded, not left standing |
| UD-063 | The design does not describe the CDN dependency the product removed |

Revert-checked, each reproducing its defect: removing §3.13 fails UD-060 naming
the section; removing the Wilson description fails UD-061 naming the topic;
restoring the CDN sentence fails UD-063.

One revert-check was itself wrong first — a case-sensitive substitution left
`wilsonInterval` in place, so UD-061 correctly did not fire. The test was right
and the check was wrong; it was redone case-insensitively before being believed.

---

## 4. What This Does Not Address

- UD-061 checks that a topic is *mentioned*, not that what is said about it is
  true. Nothing can check prose against code automatically. The section-existence
  and worked-example guards are the strongest available.
- `SAD-001` (architecture) has not been reviewed against the current design and
  may carry the same class of drift.
- §4 (DOM element reference) and §6 (error handling) were not revised; both
  describe structures that still exist, but neither was audited.
- 359 tests still carry no verification identifier (DCR-018 §4).

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. SDD-001 v3.0: §3.9–3.18 added, §3.5.2 superseded, §3.8 schema replaced, §5 rewritten. UD-060 to UD-063 added. |

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
