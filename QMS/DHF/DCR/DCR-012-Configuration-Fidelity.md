# DCR-012: Design Change Record — Configuration Fidelity

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-012 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Hazards** | RA-001 HA-092 (new reachable path), HA-099 (new), HA-100 (new) |
| **Preset versions** | `consensus-14` 2.0 → 2.5; five presets gain the denominator policy |

---

## 1. What Prompted This

The Document Owner, reading the Calculation Reference, asked:

> "where do users will configure denominatorExcludes? The documentaton states
> it but I don't see where the change can be made. Verify the configuration
> UI/UX"

The answer was: nowhere. Verifying the configuration user interface then found
three further defects, two of which silently produced wrong clinical numbers.
All were present before this change record and none were caught by the existing
suite.

---

## 2. Finding 1 — The Editor Destroyed Fields It Did Not Model

`buildConfigJSON()` rebuilt the profile from a fixed object literal. Any field
the editor does not have a control for was discarded on save, and `formulas`
and `constituents` were overwritten with `{}`.

Loading the shipped profile and pressing Save **without changing anything**:

| Specimen | Lost |
|----------|------|
| bm | `categoryNotes`, `confidenceIntervals`, `thresholds`, `targetCountBasis`, `rounding`, `precision`; `formulas` emptied — **the M:E ratio deleted** |
| pb | the above **plus `denominatorExcludes` and `per100Reporting`** |
| top level | `provenance` |

The editor reported *"Profile saved and made active."*

`validateConfig` cannot catch this. A peripheral blood profile without
`denominatorExcludes` is perfectly valid — it simply counts nucleated red cells
into the leucocyte differential, which is **HA-092**, the hazard DCR-006 exists
to prevent.

**Fix.** The source profile is retained on load (`editorState.rawConfig`, and
`raw` per specimen) and merged on save. The editor overrides only what it
actually edits; everything else rides along unchanged.

---

## 3. Finding 2 — The Editor's Output Was Then Discarded

`buildConfigJSON()` wrote a hard-coded `version: '2.0'`. The counter discards a
cached profile when a built-in profile with the **same `profileId`** carries a
higher version (`Core.isCacheSuperseded`) — the mechanism that delivers
corrected profiles to an installed browser. The built-in profile is at 2.5.

Every edit to a built-in profile was therefore thrown away on the next load:

```
Editor  : "Profile saved and made active. The counter will use it on next load."
Storage : profileId=consensus-14  version=2.0  targetCount=400
Counter : "Configuration profile ... was updated to version 2.5.
           The newer built-in profile has been applied."
In use  : targetCount=500          (the operator asked for 400)
```

The operator is not left in silence — a modal appears — but it describes a
routine vendor update while flatly contradicting what the editor just said.

**Fix.** The version is carried forward from the source profile and its last
component incremented (2.5 → 2.6), so an edit is a newer revision of the
profile it came from and is not superseded by its own parent.

Findings 1 and 2 masked one another: because of Finding 2 the field loss never
reached the counter for `consensus-14`. Rename the profile — which is exactly
what VV-SYS-062 does — and Finding 1 bites in full.

---

## 4. Finding 3 — No Shipped Preset Carried the Denominator Policy

Not one preset in the catalogue set `denominatorExcludes`, including
`presets/consensus-14.json`, which claims the same `profileId` as the built-in
profile. Choosing any of them re-introduced HA-092.

Measured in a real browser, same specimen, same cells — 180 granulocytes and 20
nucleated red cells in peripheral blood:

| Active profile | Header | Granulocytes | NRBC |
|---|---|---|---|
| Built-in (`templates.json`) | 180 cells (+20 outside differential) | **100.0%** | 11.1 / 100 WBC |
| `harmonized-9` preset | 200 cells | **90.0%** | 10.0% |

A ten-point error in the neutrophil percentage, determined solely by which
starting point the laboratory picked from a catalogue that presents itself as a
choice of *layout*.

`presets/consensus-14.json` was additionally version 2.0 against the built-in
2.5, so selecting it was undone on the next load, and it was missing
`thresholds`, `confidenceIntervals` and `categoryNotes`.

**Fix.**
- Five presets gain `denominatorExcludes: ["nrbc"]` and `per100Reporting`.
  A preset changes layout, keys and wording — not the counting convention.
- `presets/consensus-14.json` is regenerated from `templates.json`, keeping only
  its catalogue description. A preset that claims the built-in `profileId` must
  *be* the built-in profile.

---

## 5. Finding 4 — The Documentation Said "Configurable" Without Saying Where

The Calculation Reference promised "how to change it" and marked
`denominatorExcludes` **Configurable**, but never stated the route. It is set by
exporting the profile, editing the JSON and importing it — the Configuration
Editor has no control for it, nor for `per100Reporting`, `rounding`,
`precision`, `thresholds`, `confidenceIntervals` or the M:E `formulas`.

**Fix.** A "Where these settings live" section now distinguishes the three
routes and states plainly which fields the editor does *not* expose. UD-039
pins that statement to the editor source, so the claim cannot outlive the
condition it describes.

**This is documented, not resolved.** The DCR-010 selections — rounding,
precision and the M:E convention — remain reachable only by editing JSON.
See §9.

---

## 6. Why the Existing Tests Passed

| Test | Why it missed the defect |
|------|--------------------------|
| **UD-036** "every choice the reference calls configurable really is" | Asserts the key is present in the shipped JSON and that the engine honours rounding. Never checks a user can reach it. |
| **VV-SYS-062** "a profile saved in the editor is picked up by the counter" | Renames the profile to `editor-e2e`, which changes the `profileId` and so sidesteps the supersede path entirely; then asserts only `profileId` and one keystroke. It passed precisely because it avoided both failure conditions. |
| **Suite 09** preset catalogue | Checked schema conformance, key ergonomics and cell counts. Nothing checked counting **policy**. |

---

## 7. Verification Added

| ID | Layer | Checks |
|----|-------|--------|
| **VV-SYS-063** | Playwright | The shipped profile saved untouched returns unchanged — every top-level and per-specimen field deep-equal |
| **VV-SYS-064** | Playwright | An edit to a built-in profile is honoured by the counter, keeping the built-in `profileId`, and no spurious "updated" notice |
| Suite 09 (per preset) | Node | Any non-marrow specimen displaying NRBC excludes them from the denominator and reports them per 100 WBC |
| Suite 09 | Node | A preset sharing the built-in `profileId` matches it field-for-field and is not at a lower version |
| **UD-039** | Node | The reference states where each setting is reached, and its claim about what the editor does *not* expose matches the editor source |

Regression detection confirmed by reverting each fix rather than assumed:

| Reverted | Detected by |
|----------|-------------|
| `version` hard-coded back to `'2.0'` | VV-SYS-064 |
| Source profile no longer merged on save | VV-SYS-063 |
| `denominatorExcludes` removed from one preset | Suite 09 (that preset) |

**Totals: 585 Node + 251 system = 836 passing, 0 failures, 7 documented skips.**

---

## 8. Hazards

| ID | Hazard | Note |
|----|--------|------|
| HA-092 | NRBC diluting the peripheral blood differential | Existing hazard; **two new reachable paths** found — saving through the editor, and choosing any preset. Both closed. |
| **HA-099** | A configuration tool silently discards the clinical policy of the profile it is editing | New. The operator sees a success message; the counting convention has changed underneath them. Detection was Low: the result is a valid profile that counts differently. |
| **HA-100** | A saved configuration is not the configuration in use | New. The editor reported success; the counter used the built-in profile. A laboratory could believe its local policy was active when it was not. |

---

## 9. What This Change Does Not Address

- **The Configuration Editor still exposes no controls for the calculation
  policy.** `denominatorExcludes`, `per100Reporting`, `rounding`, `precision`,
  `thresholds`, `confidenceIntervals` and the M:E `formulas` are set by editing
  the exported JSON. They are now *preserved* rather than destroyed, and the
  documentation says so, but the DCR-010 intent — that these be selectable the
  way everything else in the tool is — is only half met.
- Version handling on save increments the source version. If a future built-in
  profile is published at a higher version than a laboratory's edit, the
  supersede mechanism will still replace it, with a notice. Whether a vendor
  correction should override local clinical configuration is a policy question
  this change does not settle.
- `presets/consensus-14-me-alt.json` remains at version 1.0. It carries its own
  `profileId`, so it is not superseded, but its version does not track the
  profile it is derived from.

---

## 10. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. Editor round-trip fidelity, save-version handling, preset denominator policy, documentation of where settings are reached. VV-SYS-063/064, UD-039, suite 09 additions. |

---

## 11. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
