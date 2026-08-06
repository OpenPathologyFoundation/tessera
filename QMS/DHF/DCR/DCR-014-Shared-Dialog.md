# DCR-014: Design Change Record — Shared Dialog

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-014 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-06 |
| **Status** | **In Review** — engineering approvals complete; clinical approval outstanding |
| **Parent Document** | DHF-001 |
| **Hazards** | RA-001 HA-101, HA-102 (new); HA-098 control widened |
| **Requirements added** | SRS-001 SYS-244 to SYS-247; SYS-113 extended |
| **New artefact** | `web/scripts/wbc-dialog.js` |
| **Service worker** | `wbcds-v2.2.0` → `wbcds-v2.3.0` |

---

## 1. What Prompted This

> "I don't like + Add specimen type control and any other control that uses
> browser input. Make a more elegant design where a question is asked using
> proper DOM widgets with the elegant style of the current app. Make sure it is
> across the entire app where the elegance of the tool is preserved."

Three `prompt()` calls, all in the configuration editor: the specimen type
identifier, its display label, and the identifier for a derived figure.

---

## 2. Why a Native Prompt Was the Wrong Instrument

Not merely unstyled. A `prompt()`:

- ignores the selected theme, so a laboratory working in the light theme got a
  system dialog in the system's colours;
- cannot state a rule, and two of the three asked for identifiers with rules —
  lower case, no spaces, not already in use;
- cannot show what is already taken;
- cannot refuse input except by discarding it and reopening, so a corrected
  entry meant retyping;
- suspends the page while open, and is unreachable by the automation the
  verification suite depends on.

The consequences were real: `Body Fluid` was accepted as an identifier and
produced a profile that behaved oddly later, and a duplicate identifier
silently shadowed an existing specimen. Recorded as **HA-101**.

The two specimen prompts were also *chained*: cancelling the second discarded
the first, with no way back.

---

## 3. One Widget, Not Two

The counter already had a styled modal; the editor had none. Rather than give
the editor a second appearance, `web/scripts/wbc-dialog.js` now serves both:

| Form | Used for |
|------|----------|
| `WBCDialog.alert` | An error to read or a result to acknowledge |
| `WBCDialog.confirm` | A two-way choice — Reset, Discard, Restore |
| `WBCDialog.form` | Short input, with hints and per-field validation |

The counter carries the markup in its own HTML, which SYS-070 asserts is there;
where it is absent — the editor — the module builds the identical structure.
The element identifiers are unchanged, so the ten existing tests that drive
`#modal-confirm` and `#modal-title` continue to hold.

`mdc-app.js` keeps `showModal()` and `showAlert()` as thin delegations, so no
call site changed.

### Shared visual primitives

`animate-in`, the focus ring, the scrollbar and the tab indicator were declared
in `counter.html` only. A dialog injected into the editor would therefore have
appeared without the entry animation and with a different focus ring — the same
per-page drift that produced HA-098. They now live in `theme.css`, with a
`prefers-reduced-motion` case.

While doing this, an **orphaned CSS fragment** left in `counter.html` by the
DCR-011 theme strip was found and removed: two declarations without a selector,
skipped by the browser but debris nonetheless.

---

## 4. Modality Was Missing, Not Just Style

Replacing the prompts exposed two defects in what "modal" meant, recorded as
**HA-102**:

**A counting key pressed over an open dialog was still tallied.** The counter
binds counting keys to the document and skipped only keystrokes aimed at form
controls. The Reset confirmation opens *during counting* with focus on a
button, so `f` pressed over it kept incrementing segmented neutrophils behind
the dialog. Now `onKeyDown` returns while any dialog is open.

**Escape would have discarded a recovered count.** The interrupted-count prompt
offers Restore and Discard; Cancel is Discard. A dialog that closes on Escape
would have thrown away a recovered count on a stray keypress. Escape now
cancels *except* where both branches are consequential, and that dialog is
opened `dismissible: false`.

Focus is also handled properly for the first time: it moves into the dialog,
is confined to it, and returns to the element that opened it.

---

## 5. Two Engine Differences Worth Recording

Both were found by running the new tests on all three engines, and neither was
a defect in the product:

- **WebKit does not put buttons in the tab order** unless full keyboard access
  is enabled. The first focus trap wrapped only at the last *button*, so on
  WebKit focus left the dialog from the last *field*. The trap now drives the
  cycle explicitly, which is deterministic on every engine.
- **WebKit blurs a button on mousedown**, so after a mouse click "where focus
  was" is genuinely `<body>` — restoring to it is correct. The test now opens
  the dialog from the keyboard, which is the case where restoration actually
  matters.

Separately, restoring focus **synchronously** on close did not survive on
WebKit: hiding the overlay releases focus after the call returns, overwriting
it. Restoration now happens on the next tick.

---

## 6. A Real Defect Found by Accident: Hover Contrast

The dialog's contrast case failed intermittently at **4.15:1** — a value that
matches no resting colour. Tracing it: the pointer rests on the confirm button
after a click, and `transition-colors` was animating toward `hover:bg-blue-500`.

That led to a genuine finding. **Every primary button in the product** — Start
Count, Save Profile, and every dialog's confirming action — is `bg-blue-600`
with white text and `hover:bg-blue-500`:

| State | Colour | Contrast with white |
|-------|--------|---------------------|
| At rest | `blue-600` `#2563eb` | 5.17:1 — passes |
| **Under the pointer** | `blue-500` `#3b82f6` | **3.68:1 — fails** |

The control fell below AA at exactly the moment the operator was pointing at
it. The full-surface sweep could not see this: it measures resting state only.

**Fix.** Buttons now darken on hover rather than lightening — `#1d4ed8`,
6.70:1 — which is also the clearer signal on a dark interface, and consistent
with the amber and emerald buttons corrected under DCR-011.

**VV-SYS-177/178** now hover every control carrying a `hover:bg-` class, wait
for the transition to settle, and measure. An earlier attempt to compute the
hover colours by hand produced a table that mixed dark-theme backgrounds with
light-theme foregrounds and was discarded; the test measures the rendered
result instead. SYS-113 is extended to cover interaction states.

---

## 7. Verification

| ID | Verifies |
|----|----------|
| **VV-SYS-170** | Adding a specimen type uses the product dialog; both values asked at once; identifiers in use are shown; no native dialog is raised |
| **VV-SYS-171** | Adding a derived figure likewise |
| **VV-SYS-172** | Invalid input is refused with a reason, both fields reported at once, the dialog stays open, nothing is created |
| **VV-SYS-173** | Focus enters the dialog, Escape cancels, Enter confirms, focus returns to the opener |
| **VV-SYS-174** | Tab is confined to the dialog |
| **VV-SYS-175** | A counting key pressed while a dialog is open does not count |
| **VV-SYS-176** | Escape cannot discard an interrupted count |
| **VV-SYS-169** | The dialog, with validation errors shown, meets AA in both themes |
| **VV-SYS-177/178** | Every hoverable control meets AA under the pointer, both themes |
| Suite 04 | No shipped script calls `prompt()`, `confirm()` or `alert()`; both pages load the module; it is a cached shell asset |

The `page.on('dialog')` guard in VV-SYS-170/171 is load-bearing: Playwright
auto-dismisses native dialogs, so a returning `prompt()` would silently yield
null and the feature would quietly do nothing rather than fail.

**Regression detection confirmed** by reverting each change:

| Reverted | Detected by |
|----------|-------------|
| `prompt()` restored for Add Specimen Type | VV-SYS-170, 172, 173 |
| The counter's keyboard guard removed | VV-SYS-175 |
| The recovery prompt made dismissible | VV-SYS-176 |
| The dialog's error tone set below AA | VV-SYS-169 (caught it at 1.41:1) |

**Totals: 591 Node + 305 system = 896 passing, 0 failures, 7 documented skips.**
Three consecutive full runs across Chromium, Firefox and WebKit.

---

## 8. What This Change Does Not Address

- **The file picker for Load Profile is still the operating system's.** It is
  the only way to read a file the user chooses, and it is not a browser dialog
  in the sense this change is about.
- Hover states are measured on the counter and the editor. The documentation
  pages carry links rather than controls and are not swept for hover.
- Focus-visible and active states are not measured; only rest and hover.
- One unrelated test, VV-SYS-066, failed once under full parallel load during
  this work and could not be reproduced in twenty subsequent runs, including
  three full-suite runs. It is recorded here rather than dismissed, and is not
  known to be fixed.

---

## 9. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-06 | QMS | Initial issue. Shared dialog widget; native prompts removed; keyboard modality; hover contrast; SYS-244–247; HA-101, HA-102. |

---

## 10. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinical Reviewer | | | |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-06 |
