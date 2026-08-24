# DCR-042: Design Change Record — Code and Configuration From Different Releases

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-042 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-23 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | A pilot workstation displaying a target for a profile that states none |
| **Opens** | HA-111, URS-109, SYS-259 to SYS-261 |

---

## 1. What Happened

DCR-040 removed the target from `mdc-2015-9` and shipped it. On a pilot
workstation the counter then displayed **`0 / 500 (target)`** for that profile,
and a sub-target advisory beneath the result.

Nothing was wrong with what shipped. The browser was running **the current
profile and a release-old application shell**, and the two disagreed about what
one field means.

`sw.js` is the reason, and both halves of it are deliberate:

- **Configuration is network-first** — "so a corrected profile is seen". That is
  the control for HA-063, a superseded profile staying in use.
- **The application shell is cache-first** — that is what makes the tool work on
  a laboratory network that is down, which is URS-094.

Each is right on its own. Together they permit a window in which the newest
profile is read by the previous release's code.

### Why it was invisible

Pre-DCR-040 code resolved a missing target with `if (!spec.targetCount)`, and
`!null` is true, so it substituted the 500-cell default. What the operator saw:

- a target of **500**, which that profile has never had — its old value was 200,
  so the number itself was evidence, had anyone known to look;
- the M:E ratio already computed **without blasts**, because the profile was
  current;
- the report footer naming **mdc-2015-9 v2.3**, correctly;
- every percentage and interval correct.

So each traceability field on screen was accurate while the code and the
configuration disagreed. That is what makes this class dangerous, and it is why
it is a Medium pre-RPN with **detection 5**: there was nothing to detect it by.
Here the misread field was advisory. The class is not: any field whose *meaning*
changes between releases is read by whatever code the browser happens to hold.

---

## 2. What Now Prevents It

**A profile declares the oldest build that can read it** — `minAppVersion`
(SYS-259). Where the running application is older, the profile is **not
applied**. The refusal is stated, naming both versions and what to do, and
counting continues on a profile this build *can* interpret. Where there is
none, the application refuses to start, which is the correct outcome: counting
with a profile whose fields this build reads differently is the failure being
prevented, not an inconvenience to work around.

The declaration is made **only where the semantics actually changed**. A blanket
`minAppVersion` on every profile would refuse profiles that are in fact
interpretable, which is its own harm on a workstation that cannot update today.
`mdc-2015-9` declares 2.23.0 and is the only shipped profile that needs to.

**The window closes on its own** (SYS-260). `sw.js` already calls `skipWaiting()`
and `clients.claim()`, so a new worker controls the page as soon as it activates
— but the scripts already running stay old until a navigation. The application
now reloads when that happens.

**Except during a count** (SYS-261). Reloading with the operator's eyes at the
microscope would be a worse defect than the one being fixed; autosave would
offer the tally back, which is not the same as not having interrupted them. The
reload waits for the case-entry screen, where it is indistinguishable from
arriving there normally, and `showPhase` takes it when the operator finishes.
A first-ever service worker registration also fires `controllerchange`, and is
excluded: that is an installation, not an update.

---

## 3. Two Defects Found While Building It

**`prepareConfig` rebuilt the profile metadata field by field**, so
`minAppVersion` reached the engine and stopped there. The comment directly above
that literal records the same structure losing `provenance` under DCR-035 — the
defect was fixed, the *shape* that caused it was kept, and it was ready to do it
again. It now copies the normalized meta wholesale and names only the field this
layer adds. Caught by TC-B140 before it shipped, which is the value of writing
the test that asserts the refusal rather than only the acceptance.

**The test harness's `location.reload` stub does not work.** jsdom's
`window.location` is unforgeable, `defineProperty` throws, and the harness
catches and carries on — so `reloads.count` stays 0 however many times the
application reloads. `TC-B061` was named "confirms, clears the cache **and
reloads**" and has never checked the third clause. The test is renamed to what
it verifies, the limitation is documented in the harness where the next author
will read it, and TC-B142 asserts the *decision* and the one-shot flag instead
of the navigation.

---

## 4. Scope

**Logic** — `wbc-core.js`: `minAppVersion` carried through `normalizeConfig`,
and `profileRequiresNewerApp` decides. `mdc-app.js`: the resolution gate in
`loadConfig`, `prepareConfig`'s meta copy, `watchForShellUpdate`,
`reloadIfIdle`, and the `showPhase` hook.

**Configuration** — `mdc-2015-9` to v2.4, declaring 2.23.0.

**Out of scope** — `sw.js` itself. Both of its strategies are correct and
neither changes; what changes is that the state they permit is now detected and
closed rather than silently occupied.

---

## 5. Verification

| Case | What it holds |
|---|---|
| **VV-VER-001** | Older build blocked, equal and newer allowed, comparison numeric not lexicographic, malformed declaration ignored, unknown app version blocks |
| **VV-VER-002** | The declaration survives normalization, and absence stays absence |
| **TC-B139** | A profile needing a newer build is refused, the cached one is kept, and the operator is told both versions |
| **TC-B140** | With nothing readable, the application refuses to start |
| **TC-B141** | A satisfiable declaration applies silently |
| **TC-B142** | A deferred update is not taken during a count or on the results screen, is taken at New Case, and is not taken twice |
| **VV-PRE-028** | No shipped profile declares a version its own release does not meet |
| **VV-PRE-029** | The profile whose semantics changed actually declares it, and the declaration refuses the build that misread it |

Each revert-checked: removing the resolution gate fails TC-B139 and TC-B140;
removing the idle condition fails TC-B142; restoring `prepareConfig`'s field
list fails TC-B140; making an unknown application version permissive fails
VV-VER-001.

The service worker's own behaviour — that a new shell takes control and fires
`controllerchange` — is **not** covered by a test. jsdom has no service worker
and Playwright's would test the browser's implementation rather than ours. What
is tested is every decision the application makes once that event arrives.

---

## 6. Risk

`HA-111` added, pre-RPN 45 (Medium), residual 3 (Low). No existing hazard is
re-scored. `HA-063` — a superseded profile staying in use — is the mirror image
of this one and is unaffected: its control is the network-first fetch that
creates this window, and both remain correct.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-23 | QMS | Initial issue. `minAppVersion` added to the profile schema, with refusal and fallback in configuration resolution; the application adopts a newer shell by reloading at case-entry only; `mdc-2015-9` to v2.4 declaring 2.23.0. `prepareConfig` no longer re-lists meta fields. TC-B061 renamed to what it checks. HA-111, URS-109, SYS-259 to SYS-261. Drift incidents 50 to 52. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **invited — §1 is the first defect this project found through use rather than review** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-23 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-23 |
| Regulatory Affairs | | | |
