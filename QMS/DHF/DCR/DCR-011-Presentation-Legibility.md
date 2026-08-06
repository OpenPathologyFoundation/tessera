# DCR-011: Design Change Record — Presentation Legibility

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-011 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Hazard** | RA-001 HA-098 |
| **Requirements added** | SRS-001 SYS-113, SYS-114 |
| **Service worker** | `wbcds-v2.1.0` → `wbcds-v2.2.0` |

---

## 1. Change Summary

The Document Owner reported that one advisory was unreadable:

> "looks great but check the fonts this warning is invisible: Near a diagnostic
> threshold / The 95% interval for plasma (6.4–11.3%, observed 8.6% of 502
> cells) spans the 10% plasma cell threshold…"

and then, after that was fixed, asked the question that made this a design
change rather than a patch:

> "check the dark mode too"

The reported defect was real and was corrected. The instruction to check the
other theme is what exposed the actual problem, which was neither a colour nor
a theme but an **architecture**: five pages each maintaining their own copy of
the theme rules.

---

## 2. What Was Actually Wrong

Contrast had only ever been asserted on named regions — the advisory panels,
the counting grid. Those assertions were added after HA-098 and they work. But
a selector list only covers what somebody thought to list.

Sweeping **every text node on every page in both themes** reported **330
failures**:

| Page | Theme overrides it maintained | Consequence |
|------|------------------------------|-------------|
| `counter.html` | 39 | the baseline the others drifted from |
| `calculation-reference.html` | 22 | partial; body text failed |
| `methods.html` | 20 | partial; body text failed |
| `editor.html` | 12 | partial; 28 elements failed |
| `help.html` | **0** | keyboard-map labels at **1.93:1** |

Two findings could not have been caught by any light-theme check, because they
failed in **both** themes:

| Control | Foreground | Background | Ratio |
|---------|-----------|-----------|-------|
| **Continue Counting** | white | `amber-600` `#d97706` | **3.19:1** |
| **Count Done** | white | `emerald-600` `#059669` | **3.77:1** |

These are the two buttons that advance and conclude a differential count.

A third finding was not a colour at all. The stored theme was applied by a
script at the **end of `<body>`**. Every page therefore painted in the dark
theme and then transitioned to the selected one — a visible flash, and, because
many controls carry `transition-colors`, a window of roughly 150 ms in which
text was genuinely below AA. The sweep caught it as a mid-transition
measurement of `rgb(101,112,127)` on a button whose settled colour is fine.

---

## 3. The Changes

1. **One stylesheet.** All five per-page blocks were removed and replaced by
   `web/styles/theme.css`, linked from every page and cached by the service
   worker. 330 failures → 35.

2. **Tones recalibrated against the lightest surface they are used on**, not
   the darkest. This is what the remaining 35 were: values that cleared AA on
   the page (`#0c1220`) and panel (`#1e293b`) but not on the editor's chips
   (`#334155`).

   | Class | Was | Now | page / panel / chip |
   |-------|-----|-----|---------------------|
   | `.text-slate-400` | `#94a3b8` | `#b6c2d2` | 10.36 / 8.11 / 5.74 |
   | `.text-slate-500` | `#8c9bb0` | `#adbaca` | 9.49 / 7.42 / 5.25 |
   | `.text-slate-600` | `#8695ab` | `#a4b2c4` | 8.68 / 6.79 / 4.80 |
   | `.text-accent` | `#60a5fa` | `#93c5fd` | 10.37 / 8.11 / 5.74 |

3. **Button backgrounds darkened one step in both themes**: `amber-600` →
   `#b45309` (5.02:1), `emerald-600` → `#047857` (5.48:1).

4. **The theme attribute moved from `<body>` to `<html>`** and is set by an
   inline script in `<head>`, before the body is parsed. `applyTheme()` in
   `mdc-app.js` and the editor's equivalent were updated to match.

5. **Service worker cache bumped to `wbcds-v2.2.0`.** The stylesheet and the
   pages are shell assets; without the bump an installed browser would keep
   serving the unfixed versions. Omitting this would have made the entire
   change invisible to exactly the users who already have the product.

---

## 4. Requirements Added

HA-098 previously had mitigations but no requirement specifying them — a
hazard control resting on nothing. Two requirements now carry it:

| ID | Requirement |
|----|-------------|
| **SYS-113** | All rendered text SHALL meet WCAG 2.1 AA against its effective background, in both themes, on every page and in every phase. Semi-transparent backgrounds SHALL be composited when assessed. |
| **SYS-114** | The selected theme SHALL be applied before first paint. |

RTM-001 URS-095 now traces to SYS-110–114, HA-098 and VV-SYS-160–168.

---

## 5. Verification

`tests-e2e/contrast-sweep.spec.js` — VV-SYS-162..168, 14 specs × 3 engines.
Every text-bearing leaf element, both themes, seven page/phase combinations,
service workers blocked so it measures the served files rather than the cache.

Regression detection was confirmed by reverting each fix in turn rather than
assumed:

| Reverted | Detected by | Result |
|----------|-------------|--------|
| Accent blue to `#60a5fa` | VV-SYS-168 (dark) | FAIL as expected |
| Amber and emerald button backgrounds | VV-SYS-163, 164 (both themes) | FAIL as expected |
| Theme applied at end of `<body>` | VV-SYS-168 (light) | FAIL as expected |

Suite 03 additionally asserts, on the shipped HTML, that the theme is applied
from `<head>` on the root element and never on `<body>`.

**Totals: 575 Node + 245 system = 820 passing, 0 failures, 7 documented skips.**

---

## 6. A Defect Found in the Test Suite Itself

Capturing evidence for this change surfaced an unrelated flake. VV-SYS-155
("loads no third-party script") compared each request's origin against
`page.url()`, which on Firefox can still be `about:blank` when the request
event fires — origin `null`. It intermittently reported the **locally
vendored** Tailwind build as third-party.

The comparison now uses Playwright's `baseURL`. The repaired test was confirmed
to still fail on all three engines when a genuine CDN script is injected, so
the fix removed a false positive without removing the check.

---

## 7. What This Change Does Not Address

- Contrast is verified at the two theme settings the product ships. It is not
  verified under operating-system high-contrast or forced-colours modes.
- The sweep measures the seven page/phase combinations listed in §5. Transient
  states reachable only through specific interaction — an open modal, a
  drag-in-progress in the editor, a focus ring — are not individually swept.
- WCAG AA is the target. AAA (7:1) is not claimed.

---

## 8. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. Theme consolidation, contrast recalibration, paint-order fix, SYS-113/114, VV-SYS-162..168. |

---

## 9. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
