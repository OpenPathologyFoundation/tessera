# DCR-030: Design Change Record — Self-Hosted Webfonts

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-030 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Document Owner |
| **Closes** | README Limitation 5; the last open item under URS-094 |

---

## 1. The Last External Request

Every asset was served locally except three typefaces, which came from Google's
CDN. That single exception cost two things at once.

**An air-gapped workstation never received them.** URS-094 exists because these
are laboratory machines on restricted networks. The service worker cached the
fonts opportunistically once they had been fetched, which is no help at all to
the machine that has never reached the network — precisely the machine the
requirement is about. It rendered in a system fallback, and nothing said so.

**A connected workstation announced every page load to a third party.** Each
visit to the counter resolved `fonts.googleapis.com`, then `fonts.gstatic.com`.
For an application whose privacy posture is "no patient data leaves the browser",
a per-page-load request to an external service is an awkward thing to have to
explain, even carrying no patient data itself.

DCR-029 restated Limitation 5 accurately, naming the fonts rather than Tailwind
as the remaining blocker, and left closing it as a decision for the Document
Owner. This is that decision.

---

## 2. What Was Brought In

Six files, 236 KB in total, in `web/vendor/fonts/`:

| Family | Use | Subsets | Size |
|---|---|---|---|
| Inter | interface text, weights 300–700 | latin, latin-ext | 48 KB + 84 KB |
| JetBrains Mono | counts, tabular figures, exported text, 400–700 | latin, latin-ext | 31 KB + 12 KB |
| Libre Franklin | the WBC ΔΣ wordmark, 400–700 | latin, latin-ext | 29 KB + 25 KB |

All three are **variable** fonts, which is why there are six files rather than
twenty-four: one file per subset spans every weight the application uses.

**Cyrillic, Greek and Vietnamese are deliberately not bundled.** They would
roughly double the payload for glyph ranges this application does not use in
its own interface. Text in those scripts — a free-text morphology comment, say —
renders in a system fallback rather than failing. That is a cosmetic difference
and is recorded in README Limitation 5 so that it is a decision rather than a
surprise.

Each file was verified to be a real WOFF2 by its magic number, not merely by
having downloaded without error: a truncated file or an HTML error page saved
under a `.woff2` name looks fine in a directory listing.

---

## 3. Licensing

All three families are under the **SIL Open Font License 1.1**, which is not the
licence this project uses and which imposes obligations on redistribution. The
repository is public, so this is not academic.

- The full OFL text and the copyright line for each family ship beside the font
  files as `<family>-OFL.txt`.
- `NOTICE` — the file Apache-2.0 §4(d) obliges a redistributor to carry —
  declares all three, names their copyright holders and upstream projects, and
  states that they are **neither covered by the Apache grant nor part of the
  reserved WBC ΔΣ marks**. The same section now also declares the vendored
  Tailwind bundle, which was previously undeclared.
- The OFL reserves the font names: a modified font must be renamed. Nothing
  here modifies them.

`SC-063` fails the build if a bundled family loses its licence file, its
copyright line, or its entry in `NOTICE`.

---

## 4. The Claim Is Now Absolute, So It Is Tested Absolutely

README previously said the application "works offline after initial page load …
except". It now says it makes **no external request**, and that is the kind of
claim worth testing, because a single added `<link>` would make it false and
nobody re-reads the README after adding a `<link>`.

| Case | What it holds |
|---|---|
| **SC-060** | No page references any other origin, in any attribute that causes a fetch |
| **SC-061** | Every page loads the self-hosted stylesheet — as an actual `<link>` |
| **SC-062** | Every font the stylesheet references exists, begins with the `wOF2` magic number, and is precached by the service worker |
| **SC-063** | Each family ships its OFL licence and copyright, and is declared in `NOTICE` |

Verified in a real browser as well as statically: Chromium reports `Inter`,
`JetBrains Mono` and `Libre Franklin` all loaded, and zero requests to any
other origin.

**SC-061's first version was wrong, and the revert-check found it.** It searched
for the stylesheet path anywhere in the file; removing the actual `<link>` left
the test passing, because the comment explaining the path still contained it. It
now matches a `<link>` element. This is the third occasion in this file where
removing a fix proved the test wrong before it proved the code wrong, which is
the argument for doing it every time.

---

## 5. Service Worker

`CACHE_VERSION` → `wbcds-v2.17.0`. **This bump is load-bearing rather than
routine**: an installed browser would otherwise keep serving the cached pages
that still `<link>` to the CDN, so the very workstation this change exists for
would not receive it.

The fonts are added to `SHELL_ASSETS` and therefore **precached** rather than
cached on demand — again because the target case is a machine that has never
been online, which must get the real typeface on its first load.

The cross-origin fetch branch is removed. There is no cross-origin traffic now,
and anything that appears there in future is unintended, so it is left to the
network rather than quietly absorbed into the offline shell. A silently cached
third-party request is exactly how an air-gap claim stops being true without
anyone noticing.

---

## 6. Risk

No change to any calculation, counted value or workflow. The change is
presentational and architectural.

`HA-097` is unaffected. The relevant requirement is **URS-094**, whose last
qualification is removed: offline operation no longer depends on a prior online
visit.

One residual: a laboratory that has customised the interface font must now
place its font in `web/vendor/fonts/` rather than relying on a CDN. This is
recorded rather than mitigated; no such customisation is supported today.

No preset, schema field, rounding method or CI level was removed.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. Three families self-hosted as six variable-font WOFF2 files (236 KB), latin and latin-ext; CDN `<link>` and `preconnect` removed from all five pages; fonts precached and `CACHE_VERSION` bumped to v2.17.0; cross-origin fetch branch removed; OFL licences shipped and declared in `NOTICE` alongside Tailwind; README Limitation 5 replaced. SC-060–063. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
