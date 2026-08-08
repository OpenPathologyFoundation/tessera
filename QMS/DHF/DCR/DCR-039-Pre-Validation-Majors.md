# DCR-039: Design Change Record — The Majors Behind the Blockers

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-039 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-08 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Pre-validation review, second pass |
| **Closes** | DRIFT-LOG incidents 37–43 |

---

## 1. What This Is

DCR-038 cleared seven blockers. This clears what stood behind them, found by
re-auditing the same surfaces after the fixes rather than trusting them.

Six are documentation. **The seventh is a code defect, and it is the first this
log has recorded since the drift work began** — which is worth noting, because
the pattern until now has been that the software was right and the documents
describing it were wrong.

---

## 2. SOP-001 Described Four Things That Do Not Exist

Each was written as though a control existed, and each is now stated as what the
software actually does.

**§7 item 6 — "Keyboard key assignment is fixed per specimen type."** The
Configuration Editor is linked from the case-entry screen, and §4.1 four pages
earlier says the opposite. The SOP contradicted itself, and it contradicted
itself in the **limitations list** — where a reader goes to learn what the tool
cannot do, and therefore believes what they find. It now says keys are
configurable and adds the control that matters: treat a configuration change as
a change to a controlled document, because every key in this procedure and every
figure in §6.2 assumes the shipped profile.

**§5.9 Method 1 — a case-number-change dialog.** The case field exists only on
the case-entry screen; during counting the case is a read-only badge. There is
no such dialog. Replaced with the real flow — **New Case** from the results
screen — and a plain statement that the number cannot be edited mid-count, with
what to do about a typo.

**§4.1 — "Generated from the shipped profile `ndc-14` v2.5."** Shipped is v2.6.
The table content was verified correct for v2.6, so nothing downstream was
wrong. A provenance stamp that nothing checks is one version bump from being a
lie, which is why it now has **UD-100**.

**Revision history ended at Rev A** while the header claimed v2.0. Two revisions
were added, including this one, so the document's own history accounts for its
version.

---

## 3. Two Profile Defects That Printed Into Reports

Both matter more than their severity suggests, because `targetCountBasis` and
`categoryNotes` are not internal metadata — one prints in the report method
statement and the other opens on screen while the operator counts.

**`analyzer-5` stated a 200-cell rationale on a 100-cell report.** The basis
described the CLSI H20-A2 reference method for a profile targeting 100. It now
describes its own target, and says what the operator should do about the
consequently wider intervals.

**`body-fluid` told operators not to count the cells it exists to count.** Its
`categoryNotes.other` was the bone-marrow note verbatim: *"Do NOT count into
this category: … macrophages … metastatic tumour cells."* This panel has
`malignant` and `mono_macro` keys for exactly those cells. An operator following
it would route a panel's primary findings to a free-text comment. It now names
the keys they belong on.

---

## 4. The Code Defect

A key captured with **Shift** — `:` for `;`, `?` for `/` — validated cleanly and
produced a category that **could be decremented but never incremented**. The
unshifted press does not match the mapping; the shifted press is the decrement
path.

Validation checked that keys were unique and mapped to a displayed category. It
never checked that a key could be *typed*, because nothing had ever produced one
that could not — no shipped preset is affected, and the defect is reachable only
through the Configuration Editor.

`Core.isCountableKey` now defines the countable set — letters, digits, and the
punctuation that needs no Shift — and:

- `validateConfig` rejects an untypeable key with a message that explains why:
  *"A cell on this key could be un-counted but never counted."*
- The editor rejects it **at capture**, where the operator simply presses
  another key, rather than at save — by then they have laid out a whole profile
  around it.

Verified that every punctuation key the counter's physical-key map resolves is
accepted, so the rule forbids nothing the application supports.

---

## 5. Verification

| Case | What it holds |
|---|---|
| **UD-100** | A document citing a shipped-profile version cites the one that ships |
| **UD-101** | A `targetCountBasis` names the target it belongs to — it prints in the report |

Both revert-checked: staling the stamp and replacing the basis with the old
200-cell text each fail their guard.

**UD-100 was too greedy on its first run** and flagged two false positives,
including this document's own revision-history row describing "the v2.0 layout
change". It now matches the stamp's actual shape — the version immediately
following the backticked profile name — and skips revision-history rows, the
same exemption the other document guards use.

The four SOP prose corrections and the `body-fluid` note carry **no guard**, and
none is proposed. Each is a statement about behaviour whose only check is
someone comparing prose to the application. That is what the validation study
is, and DCR-038 §4 already records the limit.

---

## 6. Risk

`isCountableKey` is the only behavioural change: a configuration that could
previously be saved is now rejected. That configuration was already broken —
it produced a category that could not be counted — so the rejection surfaces an
existing defect rather than creating a restriction. No shipped preset changes.

`HA-097` throughout. No calculation, count, key mapping or report figure
changes.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-08 | QMS | Initial issue. SOP-001 §7, §5.9, §4.1 stamp and revision history corrected; README completion behaviour; `analyzer-5` basis and `body-fluid` note; `isCountableKey` added to validation and to the editor's key capture. UD-100, UD-101. Drift incidents 37–43. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **SOP-001 changed again — §5.9 and §7 in particular** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-08 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-08 |
