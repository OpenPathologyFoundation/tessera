# Drift Log

## WBC ΔΣ — every claim this file made that had stopped being true

| Field | Value |
|-------|-------|
| **Document ID** | DRIFT-LOG |
| **Purpose** | The dataset behind the drift-control machinery. One row per incident: what was claimed, where it was contradicted, why it happened, and what now prevents it. |
| **Parent Document** | DHF-001 |
| **Convention** | **Append-only.** A row is never edited except to fill in `Prevented by` when a guard is built. Correcting history here would be the same error the log exists to record. |

---

## 1. Why this exists

Every incident below has the same shape. A session changed something real,
updated the document it happened to be looking at, and left the other five
saying what used to be true. None of it was careless in the ordinary sense —
the fix was right, the reasoning was sound, the tests passed. The failure was
that **nothing connected the claim to the thing it described.**

That pattern is worth recording rather than merely fixing, for two reasons.
It is the argument for why a QMS earns its cost in AI-assisted development,
where an individual session is capable and thorough and has no memory of the
other five documents. And it is the evidence base for the guards: each `QC-`
identifier in the last column exists because of a specific row above it.

**Counted here rather than described:** 23 incidents, of which 20 are now
prevented by an automated check.

---

## 2. The log

| # | Detected | Claim that had stopped being true | Where stated | Where contradicted | Root cause | Detected by | Fixed in | Prevented by |
|---|----------|-----------------------------------|--------------|--------------------|------------|-------------|----------|--------------|
| 1 | 2026-08-05 | "49 user requirements", "22 hazards", "579 executed" | README, RTM-001 §8 | URS-001 (69 rows), RA-001 (51 rows), the runners | Counted quantities maintained by hand | Independent review (nine wrong figures in one pass) | DCR-017 | QC-001, QC-002, QC-003 |
| 2 | 2026-08-06 | 61 verification identifiers cited by RTM-001 and TR-001 | RTM-001, TR-001 | No protocol document defined them | Traceability written toward a plan, not from the suite | Independent review | DCR-018 | QC-004, QC-005, QC-006 |
| 3 | 2026-08-06 | 106 `TC-0xx` numbers in TP-001 | TP-001 | No test file carried them | Test plan numbering never reconciled with implementation | Independent review | DCR-018 | QC-004 |
| 4 | 2026-08-06 | 328 tests existed but could be cited by nothing | — | RTM-001 could not express their coverage | A citation needs an identifier to point at | DCR-024 work | DCR-024 | QC-011 |
| 5 | 2026-08-06 | "sessionStorage only … No localStorage" | SAD-001 §7.1 | The crash-recovery snapshot holds accession number and comments in localStorage | Corrected in README under DCR-015, **not propagated** | DCR-021 review | DCR-021 | UD-070…UD-074 |
| 6 | 2026-08-06 | Tailwind "CDN-delivered", in three places | SAD-001 | `web/vendor/tailwind.js` | Same correction, same failure to propagate | DCR-021 review | DCR-021 | UD-070…UD-074 |
| 7 | 2026-08-06 | A file listed in SAD-001 §5.2 | SAD-001 §5.2 | The file does not exist | Architecture document written ahead of the code | DCR-021 review | DCR-021 | UD-070…UD-074 |
| 8 | 2026-08-06 | The v1.0 key mapping, withdrawn at v2.0 | SAD-001 §3.2.3, §7.2 | `templates.json` | Withdrawn in one document, retained in another | DCR-021 review | DCR-021 | UD-070…UD-074 |
| 9 | 2026-08-06 | SOP-001 instructed operators in a keyboard layout that no longer ships | SOP-001 | `templates.json` | Operator documentation not swept on a config change | Independent review | DCR-015 | UD-004…UD-016 |
| 10 | 2026-08-06 | Test evidence recorded no commit hash; one "Approved" bundle came from a tree in no commit | TestEvidence bundles | git | Evidence captured without provenance | Independent review | DCR-017 | `qms-run-tests.js` git stamping; QC-026 |
| 11 | 2026-08-06 | TR-001 named `npm run test:all` against a Node-only bundle | TR-001 §1 | `command.txt` | Command recorded before the layers were known | Independent review | DCR-017 | QC-026 |
| 12 | 2026-08-06 | The clinical brief listed eleven documents needing signature | CLINICAL-REVIEW-BRIEF §5 | 32 signature rows were open | A list of what someone must review, maintained by hand, read by the one person who cannot check it | DCR-027 work | DCR-027 | QC-012, QC-013, QC-015 |
| 13 | 2026-08-06 | The brief listed the M:E interval as an open limitation | CLINICAL-REVIEW-BRIEF §6 | DCR-026 had closed it that week | Closure not swept into the brief | DCR-027 work | DCR-027 | QC-015 |
| 14 | 2026-08-06 | REF-001 [S4] (Rümke 1985) cited as live support | REF-001, URS-037 | The paper could not be obtained by anyone on the project | "Primary text not held" carried as non-blocking since DCR-005 | Document Owner | DCR-027 | SC-054…SC-057 |
| 15 | 2026-08-06 | Three product versions live at once: 2.7.1, v2.14.0, cache key v2.3.0 | `package.json`, DHF-001, `web/sw.js` | Each other | Revision history advanced with each DCR; the version did not | DCR-027 work | DCR-027 | QC-016 |
| 16 | 2026-08-07 | "1039 tests, 3 documented skips" vs "939, 7 skips" | README, RTM-001, CLINICAL-REVIEW-BRIEF vs TR-001 | Each other, and the runners | Four copies of one fact, written by two tools at different moments; QC-001 checked document counts but not test totals | Drift remediation review | DCR-029 | QC-021, QC-022, QC-023 |
| 17 | 2026-08-07 | "No interval is computed for the M:E ratio (HA-093)" | DHF-001 §7.4 item 4 | RA-001 marks HA-093 **Closed 2026-08-06** | Closure swept into RA-001 only | Drift remediation review | DCR-029 | QC-024 |
| 18 | 2026-08-07 | "Open — needs Fieller or bootstrap" | REF-001 §5 gap table | REF-001 §3.8, ten lines above, says the hazard is closed | Same document contradicted itself | Drift remediation review | DCR-029 | QC-024 |
| 19 | 2026-08-07 | A threshold cannot target a ratio "because no confidence interval is computed for a ratio" | `wbc-core.js` comment, its validation message, SRS-001 SYS-205 | `ratioInterval` has existed since DCR-026 | A correct rule whose stated reason had become false | Drift remediation review | DCR-029 | QC-025 |
| 20 | 2026-08-07 | "the eleven documents listed as In Review"; "DCR-004 to DCR-009" | DHF-001 §7.2, §7.4 | 29 clinical signatures outstanding across 28 change records | DCR-027 forbade the brief restating the register; DHF-001 was doing the same thing and was not swept | Drift remediation review | DCR-029 | QC-012 (register is generated); pointer, not a count |
| 21 | 2026-08-07 | "Tailwind CSS (CDN)"; "all assets served locally except Tailwind CSS CDN" | README stack table, offline note, Limitation 5 | `web/vendor/tailwind.js`; the fonts are the actual external request | Vendoring changed the code, not the description | Drift remediation review | DCR-029 | — (see §3) |
| 22 | 2026-08-07 | "works offline after initial page load" — with an exception that defeated the case it was for | README offline note, Limitation 5 | The service worker cached fonts only after a successful fetch, so an air-gapped workstation never got them | An exception stated accurately, whose consequence was not followed through | Document Owner | DCR-030 | SC-060, SC-061, SC-062 |
| 23 | 2026-08-07 | The vendored Tailwind bundle was redistributed with no licence declaration | `NOTICE` | Tailwind is MIT and requires attribution | Vendoring added the file without adding the notice | DCR-030 work | DCR-030 | SC-063 (fonts); Tailwind declared, unguarded |

---

## 3. What is not yet prevented

Honesty about the guards matters as much as the guards.

- **Row 21 is guarded only in part.** `SC-060` now makes the underlying fact
  enforceable — no page may reference another origin — so the README's "no
  external request" claim cannot silently become false. What is still
  unguarded is the *prose*: a stack table could name the wrong delivery
  mechanism for a local asset and no test would notice. Asserting phrasing
  against `<script>` tags would test the wording rather than the fact.
- **Row 23 is guarded for the fonts, not for Tailwind.** `SC-063` requires each
  bundled font family to ship its licence and appear in `NOTICE`. The vendored
  Tailwind bundle is now declared there, but nothing fails if a future vendored
  dependency arrives undeclared. That check is worth building the next time
  something is vendored.
- **Rows 5–8 are guarded for SAD-001 specifically** (UD-070…UD-074), not as a
  class. A different architecture document drifting the same way would not be
  caught.
- **QC-022 is inert until a clean-tree evidence bundle exists.** It reports the
  skip rather than passing silently, but a repository that never runs
  `npm run test:qms` on a clean tree gets agreement between documents without
  agreement with reality.

---

## 4. What the pattern says

Sixteen of the twenty-one incidents were introduced by a session that was doing
correct work. The engine changes were right. The reasoning recorded alongside
them was sound and often better than what it replaced. In several cases the
same session wrote tests that passed and would still pass today.

What none of them did was ask *what else says this*. That question is the whole
of the closure sweep in `CLAUDE.md` §3, and it is the reason the guards are
written as classes — QC-024 does not know about HA-093, it knows that a hazard
closed in one document must not be open in another.

The three incidents that were **not** introduced this way — rows 10, 11 and 14 —
are the ones about evidence provenance and an unobtainable citation. Those were
not drift at all but original defects, and they are recorded here because the
same machinery now prevents their recurrence.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| B | 2026-08-07 | QMS | Rows 22–23 added (DCR-030): the offline claim whose exception defeated the case it was written for, and the undeclared Tailwind licence found while declaring the fonts. |
| A | 2026-08-07 | QMS | Initial issue (DCR-029). Seeded with 21 incidents: the seven found in the drift remediation review, the four propagation failures DCR-022 §4 counts, the two DCR-027 records, and the earlier findings from the independent review of 2026-08-06 and the DCR-021 architecture review. |
