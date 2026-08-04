This is a really rich set of requirements tensions. Let me work through them systematically, because I think there's actually a coherent architecture hiding underneath what looks like contradictory demands.

## The Configuration Problem

The literature review basically proves that there's no single "right" configuration — it's institutionally determined. Your instinct about a local-first approach with a central configuration catalog is correct, and here's why the alternatives fail:

**Database + logins** — Dead on arrival. These are people standing at a microscope clicking keys. Authentication friction kills adoption instantly. You'd be building infrastructure nobody asked for to solve a problem nobody has.

**Pure local install** — Works but creates a distribution and update headache. Every time you refine a preset or add a new institution's config, everyone has to manually update.

**The right answer is what you described** — a static web app that on first launch (or on demand) pulls from a lightweight configuration catalog. No login. The config gets cached in `localStorage` or `IndexedDB`. The "configuration site" is just a JSON endpoint — could literally be a GitHub Pages URL serving institution-specific JSON files. The flow is:

1. First launch → "Choose your configuration" → pick from catalog (Yale, UMass, CAP consensus, custom)
2. Config persists in browser storage
3. Settings gear icon → swap config, customize, or reset
4. No server, no auth, no accounts

The preset catalog structure would be something like:

```
configs/
  cap-consensus.json      ← bands grouped with segs, 200-cell PB, 500-cell BM
  yale-hemepath.json       ← your group's preferences
  umass.json
  minimal-5part.json       ← just the 5 standard populations
  extended-marrow.json     ← full precursor spectrum
```

Each config defines: specimen types available, cell categories per specimen type, keyboard mappings, target cell counts, whether case number is required, derived formulas, and display preferences.

## Addressing the Three User Requirements

These three points are gold because they reveal what experienced hematopathologists actually care about, and they're surprisingly consistent:

### 1. "Is it possible not to have case# to begin with?"

Yes, absolutely, and the config should control this. The user's reasoning is sound — when you're sitting at a scope with a slide in front of you, you know what case it is. The physical context *is* the identifier. Forcing case number entry before you can start clicking keys is exactly the kind of thing that makes people abandon software and go back to the mechanical counter.

**Design:** Case number field is *present* but *optional by default*. The config has a `requireCaseNumber: false` flag. If an institution's compliance requires it, they flip it to `true` in their config. The field is always visible (for people who want to use it), but the app never blocks you from counting.

This also elegantly resolves the session/continuation tension you identified: if someone *did* enter a case number, they can resume. If they didn't, they can't — and that's their choice. No nagging.

### 2. "Peripheral blood keystrokes completely different from marrow — marrow is what everyone is used to"

This is a critical insight that cuts against naive UI design. Most developers would think "standardize the keyboard mappings across specimen types." But the users are telling you the opposite — their *muscle memory* is specimen-type-specific, and the marrow mappings are the ones burned into their fingers. So the PB mappings should mirror marrow as closely as possible, with the understanding that marrow has more cell categories.

**Design:** The keyboard mapping is defined per specimen type in the config, but with an explicit inheritance model. The marrow config is the "base," and the PB config maps its smaller set of categories to the same keys where the cell types overlap. So if `N` = segmented neutrophil in marrow, `N` = neutrophil in PB. If `B` = blast in marrow, `B` = blast in PB (when enabled). The cells that exist only in marrow (promyelocytes, myelocytes, etc.) simply have no PB binding, but the shared cells sit on identical keys.

### 3. "Let us get to the finish line without asking about low count" + "button to go back to counting"

This is the most architecturally interesting one. They're asking for two things simultaneously:

**a)** Don't gatekeep completion. If I've counted 216 cells on a paucicellular aspirate and that's all there is, let me finish. Don't pop up "Warning: you have not reached 500 cells" and make me click through it. The pathologist knows the aspirate is garbage — the software shouldn't second-guess them.

**b)** But *after* seeing the results, let me go back. This is the "borderline result" scenario: you see 25% blasts and think "that's right at the AML cutoff, I should count more cells to narrow the confidence interval." You need a "Resume Counting" button on the results screen that takes you back to exactly where you left off.

**Design:** The target cell count is advisory, not enforced. A progress indicator shows "216 / 500" without blocking. The "Done" button is always available. On the results screen, display the count and percentages, and include a prominent "Continue Counting →" button that returns to the counting interface with all tallies preserved. When they finish again, the results update. This creates a natural loop: count → review → optionally count more → review again.

The low-count warning, if it exists at all, should be configurable and should be a subtle inline note ("Note: 216-cell count; statistical confidence is reduced for populations <5%"), not a modal dialog.

## On HL7/LIS Integration

Your instinct that it's "quite silly not to do that" is correct in principle, but I think your "scope creep / phase two" framing is also right. Here's why:

The moment you add HL7 outbound, you need: institutional interface engine configuration, message format negotiation (HL7v2 OBX segments, result codes mapped to local LOINC), network connectivity from the browser (which means either a local agent/service or a middleware proxy), and IT department involvement at every site. You've just gone from "pathologist downloads a web app" to "six-month IT project with committee meetings."

That said, the architecture should *anticipate* it. The export-to-JSON that's already planned produces a structured result object. A future HL7 module just transforms that JSON into an OBR/OBX message. The abstraction boundary is clean: the counting app produces a result document, and a separate integration layer consumes it. Phase one exports CSV/JSON. Phase two could add a local HL7 sender or a copy-to-clipboard formatted for LIS paste.

## Summary Architecture

What emerges from all this is:

- **Config-first design** — institution-specific JSON configs pulled from a catalog, cached locally, no auth
- **Specimen-type-aware keyboard** — marrow-first key assignments, PB inherits where possible
- **Optional everything** — case number optional, count target advisory, warnings informational not blocking
- **Reversible completion** — "Done" is never final; "Resume Counting" is always available from results
- **Export-ready structure** — JSON result objects that can feed CSV export now and HL7 later
- **Zero infrastructure** — static web app, no server, no database, no login

The users are essentially asking you to build a tool that stays out of their way while they do expert work, which is exactly your "automate what we do rather than do what is automated" philosophy applied to interface design.