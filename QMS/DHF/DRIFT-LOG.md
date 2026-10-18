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

**Counted here rather than described:** 53 incidents, of which 43 are now
prevented by an automated check. QC-027 checks both figures against the rows
below, so this sentence cannot be the next thing to drift.

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
| 24 | 2026-08-07 | "It records 21 occasions … Sixteen were introduced by sessions doing correct work" | `CLAUDE.md` preamble | `DRIFT-LOG.md`, which had 23 rows | The document that forbids stating a measured fact from memory stated one from memory. DCR-030 appended rows 22–23 and did not sweep it: the closure sweep in `CLAUDE.md` §3 ends at "update DRIFT-LOG" and nothing pointed back at `CLAUDE.md` itself | Manuscript preparation | DCR-031 | QC-027; and the count is removed rather than corrected — a number that drifted once will drift again |
| 25 | 2026-08-07 | "Preset Profiles — … frequency-ergonomic, right-hand" | `USER-GUIDE.md` §Configuration | `web/settings/presets/index.json`; both were withdrawn under DCR-020 and HA-104 | The catalogue is generated from `index.json`; the guide's copy of it was typed once and never swept. A reader looking for a profile by the name the guide gives it finds nothing and concludes the tool cannot do it | Adding `legacy-mdc` (DCR-032) | DCR-032 | UD-095 |
| 26 | 2026-08-07 | Two definitions of "admissible evidence": clean tree AND passing, versus clean tree alone | `qms-run-tests.js` (writer) vs `qms-facts.js` (reader) | Each other — a FAILING run on a clean tree became the reference QC-022 held the documents to | The two were written hours apart in the same change record (DCR-029) and the second copied only half the condition | The release gate refusing to write, during DCR-033 | DCR-033 | QC-028 |
| 27 | 2026-08-07 | "Harmonized 10-Part", id `harmonized-9`, description "Modern consensus 9-part differential" listing nine categories | `harmonized-9.json` profileId, profileName and description | The profile tallies ten | Three writers for one fact, and two were wrong. A profile name that asserts ("consensus", "harmonized") cannot be checked; a name that counts can | Naming review | DCR-035 | VV-PRE-030, VV-PRE-031 |
| 28 | 2026-08-07 | "Bone marrow categories and M:E ratio follow ICSH 2008 §2.6" | `minimal-5` and `body-fluid` `provenance.notes` | Neither profile has a `bm` specimen or an M:E formula | Copy-pasted provenance. It was intended for the report's method statement under "Basis:" — see row 30 for why it never got there, and for the correction to this row's first wording | Naming review | DCR-035 | VV-PRE-032, VV-SYS-221 |
| 29 | 2026-08-07 | Catalogue said "Custom (Blank Template)"; the file said "Custom (Template)" | `index.json` vs `custom.json` | Each other | The catalogue keeps its own copy of each profile's display name | Writing the VV-PRE-031 guard | DCR-035 | VV-PRE-031 |
| 30 | 2026-08-07 | The report's method statement was designed to carry a "Basis:" line from `provenance.notes`, and never did | `buildMethodStatement` in `wbc-core.js` | `prepareConfig` built its meta as `{version, profileId, profileName}`, dropping provenance before the statement was built | A designed report element with no wiring. Unit tests constructed the meta by hand and passed, so nothing failed; the element was absent, not wrong, and absence is what tests written against the engine cannot see | Verifying a claim made in DCR-035 §3 against the running application instead of the engine | DCR-035 | VV-SYS-220 |
| 31 | 2026-08-08 | "You pressed 'A' (blast) but meant 'V' (lymph)" | `SOP-001` §5.5, the miscount-correction procedure | The shipped default: A = monocytes, V = myelocytes, blasts = X, lymphocytes = S | Written against a key layout that predates the shipped one and never re-checked. The SOP is the document a validator rehearses, so a wrong key there is a wrong clinical instruction | Pre-validation review | DCR-038 | UD-098 |
| 32 | 2026-08-08 | Validation scenario V6: "Press 'R' x 100 (nrbc)", "Press 'P' x 300", "Press 'L' x 50" | `VV-001` §5.4 | R = pro; P and L are unmapped in every shipped profile | The validation script itself was never executed against the profile it tests. Scenario V6 fails at step 2 | Pre-validation review | DCR-038 | UD-098 |
| 33 | 2026-08-08 | Monthly QC enters `gran` and `eryth` and cites test VV-CALC-007 | `SOP-001` §6.2 | Neither category exists in the default profile; VV-CALC-007 exists in no test file | A QC procedure that cannot be performed, mandated monthly | Pre-validation review | DCR-038 | UD-098 |
| 34 | 2026-08-08 | "No data is stored in permanent browser storage" | `SOP-001` §8 data-handling attestation | Autosave writes the accession number, counts and morphology text to localStorage | The attestation a deploying laboratory's privacy review relies on. Same false-privacy class as incident 5, on a different document | Pre-validation review | DCR-038 | — |
| 35 | 2026-08-08 | "'Start Count' button is visible but disabled … becomes enabled once a valid case number is entered" | `SOP-001` §5.1, §5.2 | `requireCaseNumber` is false in all eight profiles; the button is enabled and the field optional | Described a software control that was never built, so the procedural control it replaced was never written down either | Pre-validation review | DCR-038 | — |
| 36 | 2026-08-08 | In-app help listed seven profiles: "full 14-part consensus, harmonized 9-part, legacy 9-part, minimal 5-part … frequency-ergonomic, right-hand" | `web/help.html` §Profiles | Every one withdrawn by DCR-035 or never shipped | Incident 25's class recurring on a page its guard (UD-095) did not cover — and `help.html` is precached for offline use | Pre-validation review | DCR-038 | UD-097 |
| 37 | 2026-08-08 | "Keyboard key assignment is **fixed** per specimen type … contact the laboratory director" | `SOP-001` §7 item 6 | The Configuration Editor is linked from the case-entry screen, and §4.1 four pages earlier says keys are configurable | The SOP contradicted itself. A limitations list is where a reader looks to learn what the tool cannot do, so a false limit there is believed | Pre-validation review, second pass | DCR-039 | — |
| 38 | 2026-08-08 | "Generated from the shipped profile `ndc-14` **v2.5**" | `SOP-001` §4.1 key-table stamp | The shipped profile is v2.6 | The table content was still correct, so nothing was wrong — but a provenance stamp that nothing checks is one version bump from being a lie | Pre-validation review, second pass | DCR-039 | UD-100 |
| 39 | 2026-08-08 | "Warning dialog when completing below threshold with explicit override" | `README.md` features table | Completion is never blocked; the report carries a quantified advisory note | Described a modal that was never built. The real behaviour is better than the claim, which is why nobody noticed | Pre-validation review, second pass | DCR-039 | — |
| 40 | 2026-08-08 | §5.9 Method 1: "Clear the current case number … a confirmation dialog will appear" | `SOP-001` §5.9 | The case field exists only on the case-entry screen; during counting the case is a read-only badge. There is no such dialog | A procedure for a flow that never existed, in the document validators follow | Pre-validation review, second pass | DCR-039 | — |
| 41 | 2026-08-08 | A 200-cell CLSI rationale printed on a 100-cell report | `analyzer-5` `targetCountBasis` | The profile targets 100 | `targetCountBasis` prints into the report method statement, so every analyzer-5 report stated a basis for a target it does not use | Pre-validation review, second pass | DCR-039 | UD-101 |
| 42 | 2026-08-08 | "Do NOT count into this category: … macrophages … metastatic tumour cells" | `body-fluid` `categoryNotes.other` | This panel has `malignant` and `mono_macro` keys for exactly those cells | The bone-marrow note copied onto a panel whose purpose is counting what the marrow excludes. It instructed operators to discard the panel's own findings | Pre-validation review, second pass | DCR-039 | — |
| 43 | 2026-08-08 | A key captured with Shift (`:` for `;`) validated cleanly | `validateConfig`, and the editor's key capture | Shift+key is the decrement, so such a cell could be un-counted but never counted | Validation checked that keys were unique and mapped, not that they were typeable. No shipped preset was affected; the editor could produce one | Pre-validation review, second pass | DCR-039 | `isCountableKey` in validateConfig; rejected at capture |
| 44 | 2026-08-23 | "The minimums and report templates are the predecessor's" — a fidelity claim covering the target counts | `VV-PRE-023`, `mdc-2015-9` `targetCount` 200/100, USER-GUIDE "still targets 200 cells" | The predecessor declared `minCellCount` in its configuration and its code never read it; the identifier appears nowhere in `legacy/`. It displayed no target, no progress bar and no advisory | The profile was reconstructed from the predecessor's **configuration file** without checking which fields its code consumed. A declared setting was read as a behaviour | Reviewing haematopathologists, who asked why a target was shown at all | DCR-040 | `VV-PRE-023` now greps `legacy/` for the identifier rather than restating the claim |
| 45 | 2026-08-23 | Document header version fields, stale against their own revision histories: RA-001 "2.9" with rows to v3.8, URS-001 v2.0 "Rev L" with rows to N, SAD-001 "3.0" with rows to 3.2 | `RA-001`, `URS-001_…_v2.0.md`, `SAD-001` §headers | The revision-history tables in the same three files | Appending a revision row is the visible act; the header field two hundred lines above it is not in view while doing so | DCR-040 sweep | DCR-040 | — (see §3) |
| 46 | 2026-08-23 | A malformed target count was silently replaced with 500 | `normalizeConfig` | `validateConfig`, which never saw the value it was meant to reject: `!spec.targetCount` had already substituted the default for `0`, `NaN` and `''` | A default-filling branch written as a truthiness test, which conflates "absent" with "wrong" | Writing VV-TGT-001 for the new `null` case | DCR-040 | `VV-TGT-001` |
| 47 | 2026-08-23 | Scenario V2 told the validator the progress row reads `50 / 200 (200)` | `VV-001` §5.4 V2 | The application renders `50 / 200 (target)` | A scripted expected-result written from memory of the format rather than from the screen; the same class as incident 32, in the same section of the same document | DCR-040 sweep | DCR-040 | — (see §3) |
| 48 | 2026-08-23 | A test reported "no Load button in the preset catalogue" | `VV-SYS-215` helper, `counting-workflow.spec.js` | The button exists; the list is rendered asynchronously and the helper used `page.evaluate`, which does not auto-wait as a locator does. Measured: `#preset-list button` counted immediately after the click gave `[6,6,0,0,0,6,0,0]` on one engine | Three races have now been removed from this one test, and each earlier fix guarded the step *after* the one that raced. The first attempt at THIS fix also missed: the same click-then-evaluate block existed three times in the file and the wait was added to one of them, so the gate failed again on a different test | The release gate, on a second evidence run under load | DCR-040 | The three blocks are now one `loadPresetFromCatalogue` helper, so the wait exists once |
| 49 | 2026-08-23 | "Fonts | Inter + JetBrains Mono | **Google Fonts (CDN)**" | `README.md` stack table | The three families ship at `web/vendor/fonts/`, and no page in `web/` references `fonts.googleapis.com` or `fonts.gstatic.com` — SC-060 has forbidden it since DCR-030 | **§3 of this log predicted it.** Row 21's entry says the fact is guarded and the prose is not: "a stack table could name the wrong delivery mechanism for a local asset and no test would notice". Same table, one row down | A question about where to start the application, which sent someone into the README | DCR-041 | QC-025 gains a claims row anchored on the tree rather than on a Core export |
| 50 | 2026-08-23 | The counter displayed `0 / 500 (target)` for a profile that states no target, and a sub-target advisory beneath the result | The running application on a pilot workstation | `mdc-2015-9` v2.3, which states none — and whose old target was 200, so 500 came from neither the profile nor its predecessor but from the default an older build substitutes | `sw.js` fetches configuration network-first and the shell cache-first. Both are correct alone; together they let the newest profile be read by the previous release's code. Pre-DCR-040 code tested `!spec.targetCount`, and `!null` is true | **Use.** The first defect this project found by someone operating it rather than by audit or review | DCR-042 | SYS-259 (a profile declares the oldest build that can read it), SYS-260/261 (the shell updates itself, never mid-count); VV-VER-001/002, TC-B139..142, VV-PRE-028/029 |
| 51 | 2026-08-23 | `prepareConfig` built the profile metadata from a field list, so a field added to the engine reached the application and stopped | `mdc-app.js` `prepareConfig` | `normalizeConfig`, which had already carried `minAppVersion` | **The comment directly above that literal records the same structure losing `provenance` under DCR-035.** The instance was fixed and the shape kept | Writing TC-B140, which asserts the refusal rather than the acceptance | DCR-042 | The meta is copied wholesale; only the field this layer adds is named. TC-B140 |
| 52 | 2026-08-23 | `TC-B061: Reset to Default confirms, clears the cache **and reloads**` | `tests/11-application-behavior.test.js` | The test asserts the cache is cleared and nothing else; jsdom's `window.location` is unforgeable, so the harness's `reload` stub never takes and `reloads.count` stays 0 however many times the application reloads | A test named for the behaviour it was written to cover rather than the assertions it makes. Dead instrumentation nobody had cause to check | Trying to use `reloads.count` in a new test | DCR-042 | — (see §3) |
| 53 | 2026-10-18 | "379 passing tests, 100% pass rate" at the v2.0 baseline; "Tests recorded: 191" for the same baseline | DCR-004 §1; TR-001 §1.1; the manuscript draft, which repeated 379 | `52e2a4c`, the newest commit on or before the baseline date TR-001 states, runs **156** tests; the February evidence bundles record 153; no commit and no bundle produces 191 or 379 | A baseline figure recorded without the commit it measured, then carried forward by documents that each took the previous one as its source — row 10's class, one layer up. The figure was quoted for two months by every document about the baseline and checked by none, because nothing could check a number with no commit under it | Manuscript preparation: the facts generator built for the paper measured the baseline at its commit instead of reading it from DCR-004 | DCR-043 | QC-032 (TR-001 §1.1 states the measured figure and names the commit); QC-031 (the manuscript reads it by marker); DCR-004 keeps its figure as a dated record |

---

## 3. What is not yet prevented

Honesty about the guards matters as much as the guards.

- **Row 21 is guarded only in part — and the unguarded half then failed.** The
  paragraph below stood here unchanged while the thing it describes happened:
  `SC-060` makes the underlying fact enforceable — no page may reference another
  origin — so the README's "no external request" claim cannot silently become
  false, but *"a stack table could name the wrong delivery mechanism for a local
  asset and no test would notice"*. That is incident 49, in the same table, one
  row down. QC-025 now carries a claims row for it, anchored on the tree rather
  than on a Core export. What remains unguarded is narrower and still real: the
  row knows one delivery mechanism for one asset class, so a future vendored
  dependency described as remote would still pass. **A predicted drift with no
  guard built is a decision to accept it**, and this one names the cost of
  writing the prediction down instead.
- **Row 23 is guarded for the fonts, not for Tailwind.** `SC-063` requires each
  bundled font family to ship its licence and appear in `NOTICE`. The vendored
  Tailwind bundle is now declared there, but nothing fails if a future vendored
  dependency arrives undeclared. That check is worth building the next time
  something is vendored.
- **Rows 5–8 are guarded for SAD-001 specifically** (UD-070…UD-074), not as a
  class. A different architecture document drifting the same way would not be
  caught.
- **Row 45 is unguarded.** Nothing compares a document's header version field
  with the newest row of its own revision history, and both were wrong in the
  same way in two documents at once — which is the signature of a class, not an
  accident. The check is cheap and worth building; it is not built here because
  the revision tables are not uniformly ordered (RA-001's runs A, B, K…P, T, S,
  R, Q, then J…C), so "the newest row" is not yet a thing a script can read.
  Ordering them would mean rewriting historical rows, which the convention
  above forbids.
- **Row 52 is unguarded, and the class it belongs to is the uncomfortable one.** A test's name is a claim about what it checks, and nothing compares the two. `TC-B061` claimed a reload it never asserted, on instrumentation that has never worked. The repository's answer to this has been the revert-check — remove the fix, watch the test fail — which does catch it, but only for tests someone revert-checks. No check is proposed here: matching names to assertions mechanically would test wording. What is written down instead is where the exposure lives.
- **QC-022 is inert until a clean-tree evidence bundle exists.** It reports the
  skip rather than passing silently, but a repository that never runs
  `npm run test:qms` on a clean tree gets agreement between documents without
  agreement with reality.
- **The "Prevented by" column is now measured, and the measurement is not the
  column.** `replay/` (DCR-043) re-introduces every row above against a fixed
  commit — the row's own contradiction, and a different one of the same class
  — and `replay/results.json` records which checks fired. Where the column
  names a guard that did not fire, the column is what is wrong, and the
  manuscript's taxonomy table is generated from the results rather than from
  this file. Two limits, stated here so they are not inferred: the replay is
  inert until `npm run replay` is run on a clean tree, as QC-022 is until an
  evidence bundle exists, and QC-030 says so rather than passing; and a row
  whose guard is a code path rather than a test identifier (rows 43 and 48)
  cannot be attributed by name, so a red build there is recorded as caught but
  unattributed, which is a smaller claim than "guarded".

---

## 4. What the pattern says

**All but three of the incidents above were introduced by a session doing
correct work** — the exceptions are rows 10, 11 and 14, identified below. The
proportion is stated this way, by naming the exceptions rather than counting the
majority, because a count would go stale on the next appended row. It already
did once: §1 and `CLAUDE.md` both carried one, and incident 24 is what happened.

The engine changes were right. The reasoning recorded alongside them was sound
and often better than what it replaced. In several cases the same session wrote
tests that passed and would still pass today.

What none of them did was ask *what else says this*. That question is the whole
of the closure sweep in `CLAUDE.md` §3, and it is the reason the guards are
written as classes — QC-024 does not know about HA-093, it knows that a hazard
closed in one document must not be open in another.

The exceptions — rows 10, 11 and 14 — are the ones about evidence provenance
and an unobtainable citation. Those were not drift at all but original defects,
and they are recorded here because the same machinery now prevents their
recurrence.

---

## 5. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| L | 2026-10-18 | QMS | Row 53 added (DCR-043): the v2.0 baseline test count, quoted as 379 by DCR-004 and as 191 by TR-001 for two months, measures 156 at the only commit it could describe. Found by the facts generator built for the manuscript, which measures the baseline instead of reading it. §3 gains the replay: every row above now has an instance patch and a class patch under `replay/`, and the "Prevented by" column is checked against what actually fires rather than trusted. |
| I | 2026-08-08 | QMS | Rows 37–43 added (DCR-039): the majors left standing after the blockers were cleared. Four are SOP-001 describing behaviour that was never built — a fixed key assignment, a case-number dialog, a blocking completion warning — and two are profile text that prints into a clinical report. The seventh is the first CODE defect this file has recorded since the drift work began: a key that could be decremented but never incremented. |
| K | 2026-08-23 | QMS | Rows 50–52 added (DCR-042). Row 50 is the first incident in this log found through USE: a pilot workstation ran a current profile against a release-old application shell and displayed a target the laboratory had not set, with every traceability field on screen correct. Rows 51 and 52 were found while fixing it — a metadata field list that had already lost `provenance` once, and a test whose name claimed an assertion it does not make. |
| J | 2026-08-23 | QMS | Row 49 added (DCR-041): the fonts row of README's stack table, which §3 predicted and which went unnoticed for as long as the fonts have been vendored. §3 rewritten to record that the prediction came true and what the narrower residual gap now is. |
| I | 2026-08-23 | QMS | Rows 44–48 added (DCR-040). Row 44 is the first found by a clinical reviewer rather than by audit or by a session's own sweep, and it is the deepest: a profile was reconstructed from a predecessor's configuration file without checking which fields that predecessor's code read, so a declared setting shipped as a behaviour from DCR-032 (2026-08-07) until now. Rows 45 and 47 are ordinary sweep findings; row 46 is a code defect the new option surfaced. |
| H | 2026-08-08 | QMS | Rows 31–36 added (DCR-038): the pre-validation audit of every surface a validating pathologist reads. Five of the six are in SOP-001 and VV-001 — the documents a validator rehearses and executes — and none was covered by any guard, because the guards built so far check generated figures and profile names, not procedures. |
| G | 2026-08-07 | QMS | Row 30 added and row 28 corrected (DCR-035): the false provenance never reached a report, because a second defect dropped provenance before the method statement was built. Two defects that cancelled. |
| F | 2026-08-07 | QMS | Rows 27–29 added (DCR-035): profile names that asserted rather than described, a copy-pasted provenance note that printed a false basis into clinical reports, and a display name the catalogue and the file disagreed about. VV-PRE-030..034. |
| E | 2026-08-07 | QMS | Row 26 added (DCR-033): the drift-control machinery drifted from itself — the writer and the reader of the evidence bundles disagreed on what makes a run admissible. QC-028. |
| D | 2026-08-07 | QMS | Row 25 added (DCR-032): the user guide's preset list named two profiles withdrawn months earlier and omitted the one being added. UD-095 now checks it against the catalogue. |
| C | 2026-08-07 | QMS | Row 24 added (DCR-031): `CLAUDE.md` stated this log's totals from memory and they went stale one change record later. The count is removed there and QC-027 now checks §1 and the row numbering against the rows themselves. §4 names the exceptions instead of counting the majority, for the same reason. |
| B | 2026-08-07 | QMS | Rows 22–23 added (DCR-030): the offline claim whose exception defeated the case it was written for, and the undeclared Tailwind licence found while declaring the fonts. |
| A | 2026-08-07 | QMS | Initial issue (DCR-029). Seeded with 21 incidents: the seven found in the drift remediation review, the four propagation failures DCR-022 §4 counts, the two DCR-027 records, and the earlier findings from the independent review of 2026-08-06 and the DCR-021 architecture review. |
