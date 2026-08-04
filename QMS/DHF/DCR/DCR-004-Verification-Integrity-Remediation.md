# DCR-004: Design Change Record — Verification Integrity Remediation

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-004 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-04 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Related PR** | N/A |
| **Product Version** | 2.0 → 2.1.0 |

---

## 1. Change Summary

A design review of the v2.0 baseline found that the verification evidence did
not support the claims made for it, and that a number of implemented
requirements were either non-functional or absent. This change record covers
the remediation.

The review found two systemic problems and fourteen specific defects. The
systemic problems are the significant ones:

1. **The test suite did not execute the application.** Suite 01 stated in its
   own header that it "mirrors mdc-app.js" and re-implemented the percentage,
   increment/decrement and M:E algorithms locally; suite 05 did the same for the
   end-to-end pipeline. The remaining suites asserted on file *text* using
   `readFileSync` plus substring matching, and the two that called
   `new Function(jsCode)` were performing a syntax check only. No test loaded a
   DOM or ran a single application code path. A "379 passing tests, 100% pass
   rate" result therefore carried essentially no behavioural assurance, which is
   why every defect listed in §4 below survived it.

2. **RTM-001 v2.0 traced to URS-001 v1.0.** Both documents were dated
   2026-02-24 and both were marked v2.0, and DHF-001 controlled URS v2.0, but
   every URS identifier in the RTM matched the v1.0 text. The matrix asserted
   "Full" coverage for URS-043, which URS v2.0 had explicitly withdrawn; it
   described URS-013 as "prevent specimen type change mid-count" when v2.0
   requires the opposite; it cited URS-055, URS-056 and URS-110, which do not
   exist in v2.0; and it listed the visual configuration editor as a deferred
   Phase 2 item when v2.0 makes it URS-102, P0-Critical. Bidirectional
   traceability was therefore not established, and the 87% / 100% coverage
   figures in RTM §6 were not supportable.

Affected areas: Logic, UI, Tests, QMS Docs, Build/Config.

---

## 2. Rationale

Under IEC 62304 §5.7 and 21 CFR 820.30(f)–(g), design verification must
demonstrate that the design output meets the design input, and the records must
be traceable to the requirements they verify. Verification performed against a
copy of the implementation does not demonstrate anything about the implementation
that is shipped, and a traceability matrix keyed to a superseded requirement
baseline cannot establish coverage. Both conditions had to be corrected before
any statement about the validation status of this product could be made.

The specific defects were remediated at the same time because several of them —
notably the three inert configuration controls and the absent
percentage-normalisation — are the direct consequence of the missing behavioural
coverage, and fixing the tests without fixing what they now detect would leave
the baseline red.

---

## 3. Scope and Impact

**Impacted Components**

- Logic: `web/scripts/wbc-core.js` (new), `web/scripts/mdc-app.js`,
  `web/scripts/config-editor.js`, `web/sw.js` (new), `serve.js`
- UI: `web/counter.html`, `web/editor.html`, `web/help.html`,
  `web/vendor/tailwind.js` (new), `web/settings/presets/index.json` (new)
- Tests: `tests/01`, `tests/03`, `tests/04`, `tests/05`, `tests/08`,
  `tests/10`, `tests/11-application-behavior.test.js` (new),
  `tests/helpers/app-harness.js` (new), `tests-e2e/` (new),
  `playwright.config.js` (new)
- QMS Docs: DHF-001, RTM-001, SRS-001, TR-001, URS-001 v1.0 (superseded),
  DCR-004 (this record)
- Build/Config: `package.json`, `.gitignore`, `legacy/` (relocated)

**Out of Scope**

- No change to the counting model, the cell-type taxonomy, the keyboard
  mappings, or the wording of any institutional output template.
- No change to the regulatory position stated in URS-001 v2.0 §8.
- The legacy Backbone/JSP application was relocated, not modified.

---

## 4. Defects Corrected

| # | Defect | Requirement | Severity |
|---|--------|-------------|----------|
| D-01 | Export Config, Import Config and Reset to Default were all inert. `counter.html` bound them from an inline `<script>` to functions declared inside the `mdc-app.js` IIFE, so each `typeof fn === 'function'` guard evaluated false and every handler silently did nothing. | URS-103 | High |
| D-02 | The cached profile always won over the shipped one, with no version comparison, so a corrected default profile could never reach an installed browser. Combined with D-01 there was no in-application recovery path from a bad cached profile. | URS-106 | High |
| D-03 | Percentages were never normalised to sum to 100. No rounding adjustment existed anywhere in the code, so a 14-category differential routinely reported 99% or 101%. RTM claimed "Full" coverage via VV-CALC-011/012, which only assert "within tolerance". | URS-034 | High |
| D-04 | Output carried no configuration profile ID or version. `normalizeConfig` discarded the envelope, so no session record, CSV, JSON or clipboard output could be audited back to the counting parameters that produced it. | URS-052 (P0) | High |
| D-05 | No advisory was shown when a count finished below target. | URS-041 | Medium |
| D-06 | Structured morphology selections were silently lost on Continue Counting: `renderMorphologyChecklist` rewrote `innerHTML`, clearing every checkbox. | URS-073 | Medium |
| D-07 | `requireCaseNumber`, per-specimen `autosave` and `handedness` were present in the configuration schema and never read by the application. | URS-004 (P0), URS-085, URS-104 | Medium |
| D-08 | Mid-count specimen switching was unreachable. The selector was disabled on Start Count and lived inside the hidden case-entry section, leaving ~100 lines of `switchSpecimenType` as dead code. | URS-010 (P0), URS-013 | Medium |
| D-09 | The visual configuration editor was reachable only from a link inside `help.html`. | URS-102 (P0) | Medium |
| D-10 | `getSpecConfig()` could return `undefined` and was dereferenced without a guard, crashing autosave recovery when the saved specimen type was absent from the current profile. | — (robustness) | Medium |
| D-11 | Configuration validation did not detect a key mapped to a cell type absent from `categories`. Such a cell is counted into the grand total and every percentage denominator while never appearing on screen — an undetectable miscount. Duplicate and unkeyed categories were likewise unchecked. | URS-021, URS-022 | High |
| D-12 | `{{caseNumber}}` and `{{comments}}` were substituted into report templates unescaped and the result was written with `innerHTML`. Not reachable with the shipped templates, which use neither placeholder, but the configuration editor allows both to be added. `String.replace` was also called with a raw replacement string, so `$&` in operator input was reinterpreted. | SYS-S04 | Medium |
| D-13 | CSV export did not neutralise leading `=`, `+`, `-` or `@`, permitting formula injection in an exported record. | SYS-S04 | Low |
| D-14 | The application could not run offline: Tailwind was loaded from `cdn.tailwindcss.com` with no service worker, so a workstation without internet access rendered the counter unstyled and unusable. | URS-094 | Medium |

Two further items were found during remediation and are recorded here for
completeness:

| # | Defect | Notes |
|---|--------|-------|
| D-15 | The configuration editor cached a profile that failed validation and reported "Profile saved and cached to localStorage", while the counter silently continued using the previous profile. The editor now validates with the same engine as the counter, downloads the draft, and states plainly that it was not made active. | Found by VV-SYS-061 |
| D-16 | `serve.js` guarded path traversal with `file.startsWith(ROOT)`, which also admits a sibling directory whose name merely begins with the root path. The separator is now part of the prefix comparison. | Development server only |

### 4.1 Defects found by adversarial review of the remediation itself

The changes above were then reviewed against hostile and degenerate input.
Three further defects were found — two of them introduced by this change record
— and are recorded here rather than quietly fixed, because they are the direct
evidence that the new verification layers do their job.

| # | Defect | Origin | Verification |
|---|--------|--------|--------------|
| D-17 | A cell type named `total`, `comments`, `caseNumber` or any other template placeholder name would shadow that placeholder, so `{{total}}` in a report would render that category's percentage instead of the cell count — corrupting every report produced from the profile, silently. `validateConfig` now rejects reserved names. | Pre-existing, latent | Suite 08: reserved-name rejection, plus a check that no shipped profile uses one |
| D-18 | A configuration-update notice and the crash-recovery prompt both raise the single shared modal element. Shown in parallel the notice replaced the recovery prompt, so an operator whose profile had just been updated would silently lose an interrupted count. The two are now sequenced. | **Introduced by D-02** | TC-B075 |
| D-19 | Counts restored from `localStorage` bypassed the keyboard handler's decrement guard. A corrupted or hand-edited autosave record carrying a negative count produced negative percentages and a corrupted denominator. Restored counts are now coerced to non-negative integers and unknown cell types are dropped. | Pre-existing, latent | VV-CALC-024, VV-CALC-025, VV-CALC-028, TC-B076 |

Two further defects were introduced during remediation and caught by the new
layers before release:

| Defect | Caught by |
|--------|-----------|
| The Cancel button was hidden on the Reset confirmation, removing the escape route from a destructive action (URS-061). Caused by inferring "no cancel handler means no cancel button"; replaced with an explicit `showAlert()` for acknowledgements. | **VV-SYS-032** (Playwright) |
| Counting keystrokes were swallowed after the barcode workflow, because a new guard ignored keystrokes targeted at form controls and Enter leaves focus in the case field. Focus now leaves the field on Start Count. | **TC-B014** (jsdom) |

---

## 5. Requirements Impact

**URS Impacted**: URS-004, URS-010, URS-013, URS-021, URS-022, URS-034,
URS-041, URS-052, URS-073, URS-085, URS-094, URS-101, URS-102, URS-103,
URS-104, URS-106

**SRS Impacted**: SYS-003, SYS-016, SYS-017, SYS-044, SYS-053, SYS-067,
SYS-074, SYS-S04, and the new SYS-140 through SYS-179 series added under §7.

### 5.1 Deviation from URS-034 as written

URS-034 states that percentages shall be made to sum to 100 "by applying a
rounding adjustment to the largest-count category". Implemented literally, that
concentrates the entire rounding residual in a single cell type. At the integer
precision used by the report templates the residual can reach several
percentage points: fourteen equal categories (true value 7.14% each) each round
to 7%, leaving a residual of 2 that would be reported as 9% for one category —
a 1.9-point overstatement of a clinical value, printed in the patient report.

The implementation therefore uses the **largest-remainder (Hare) method**: every
value is floored and the remaining units are distributed one at a time to the
categories with the largest truncated remainders, ties broken by raw count and
then by configuration order. This satisfies the stated intent of URS-034 — the
displayed and reported differentials sum to exactly 100 at both 2-decimal and
integer precision — while holding every category within one unit of the last
decimal place of its true value. Verified by VV-CALC-019 (deviation bound) and
VV-CALC-020 (2 000 randomised differentials at both precisions).

### 5.2 Documented verification skips

| Skip | Engines | Reason |
|------|---------|--------|
| VV-SYS-070 clipboard read-back | Firefox, WebKit | The `clipboard-read` permission is Chromium-only in Playwright. The copy control and its confirmation are still exercised on all three engines; only reading the clipboard back is skipped. |
| VV-SYS-090 offline reload | WebKit | Playwright's WebKit build crashes its driver on a navigation performed while offline. A harness limitation, not an application finding. URS-093 names Chrome, Firefox and Edge; Safari is not a stated target. |

---

**Resolution**: URS-034 was amended on 2026-08-04 (URS-001 v2.0 Rev E) to
specify the largest-remainder method and to record this rationale. Requirement
and implementation are now aligned and RTM-001 marks URS-034 as Full with no
outstanding deviation.

---

## 6. Verification Architecture Change

The verification strategy is restructured into three layers. The governing
principle is that **no layer may verify a copy of the implementation.**

| Layer | Runner | Scope | Count |
|-------|--------|-------|-------|
| Unit | `node --test` | `wbc-core.js` called directly — percentages, sum-to-100, M:E, absolute counts, template rendering and sanitisation, CSV/JSON serialisation, config normalisation and validation | suites 01, 02, 05, 08, 09 |
| Behaviour | `node --test` + jsdom | The real `counter.html` + `wbc-core.js` + `mdc-app.js` executed in a DOM: phase machine, keyboard handler, autosave and recovery, Continue Counting, specimen switching, configuration controls, offline resolution | suite 11 |
| System | Playwright + Chromium / Firefox / WebKit | The deployed application over HTTP in real browsers: downloads, system clipboard, service worker and offline reload, printing, configuration editor round-trip | `tests-e2e/` |

`web/scripts/wbc-core.js` is new. It holds every safety-critical computation and
has no DOM access, which is what makes the unit layer able to call shipped code
rather than a transcription of it. `mdc-app.js` consumes it as `window.WBCCore`
and retains state and DOM responsibilities only.

Totals: **450 unit and behavioural tests, 132 system tests (44 specs x
Chromium/Firefox/WebKit), 579 executed, 0 failures, 3 documented skips.** The
v2.0 baseline recorded 191, none of which executed the application.

---

## 7. Design and Documentation Updates

- **RTM-001** rewritten against URS-001 v2.0. Every URS identifier now matches
  the controlled requirement baseline. Coverage claims restated against
  verification that executes shipped code.
- **SRS-001** extended with SYS-140 through SYS-179 covering audio feedback,
  autosave and recovery, absolute counts, the configuration editor, the preset
  catalogue, handedness, offline operation and output traceability — all
  functionality that was implemented and shipping with no system-level
  requirement behind it.
- **URS-001 v1.0** marked *Superseded by v2.0*. Two files previously carried
  Document ID URS-001 with neither marked as superseded.
- **DHF-001** index updated: product version, document list, DCR-002/003/004 and
  SPC-001 added.
- **TR-001** regenerated from an actual run via `npm run test:qms`.

---

## 8. Risk Assessment

RA-001 requires review but no new hazard classes are introduced. The change
lowers residual risk against existing hazards:

| FMEA ID | Effect of this change |
|---------|----------------------|
| HA-022 (percentage sum ≠ 100%) | Mitigation now exists and is verified. Previously claimed as mitigated with no implementation. |
| HA-024 (output/table mismatch) | Table, report, absolute counts and exports now derive from one adjusted percentage set. |
| HA-060 / HA-061 (config load failure, invalid config) | Validation extended to the silent-miscount case; a failed load now offers recovery instead of a terminal error screen. |
| HA-062 (duplicate key mapping) | Detected by `validateConfig` and by the editor before a profile can be made active. |
| HA-041 (browser close data loss) | Autosave verified behaviourally and through a real browser reload. |
| HA-004 (no case in output) | Superseded by full profile/version traceability in every export. |

RA-001 should be updated to reflect the revised residual RPNs at the next
revision.

---

## 9. Test Plan Trace

- TP-001 (suite structure and coverage targets)
- VV-001 (verification protocol — VV-CALC, VV-ME, VV-E2E, VV-SYS series)

**Execution Evidence**:
- `QMS/DHF/TestEvidence/2026-08-04_150329_run/` — `npm run test:all`, exit 0,
  450 unit/behavioural + 132 system tests across Chromium, Firefox and WebKit,
  0 failures, 3 documented skips (§5.2).

Note: `npm run test:qms` updates a Draft DCR automatically only when exactly one
exists. Four are now Draft, so this entry was recorded manually. Use
`npm run test:qms -- --dcr DCR-004-Verification-Integrity-Remediation` to target
this record on future runs.

---

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | | | |
| Quality Assurance | | | |
| Clinical Reviewer | | | |
| Regulatory Affairs | | | |
