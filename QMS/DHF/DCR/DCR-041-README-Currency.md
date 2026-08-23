# DCR-041: Design Change Record — The README's Start Instructions, and a Predicted Drift

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-041 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-23 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | A question: which directory does `npm run serve` run in? |
| **Closes** | DRIFT-LOG incident 49; part of the §3 gap left open at incident 21 |

---

## 1. What This Is

Someone who had the repository in front of them could not tell from the README
where to start the application. Fixing that surfaced three claims in the same
file that had stopped being true, one of which the drift log had already
predicted would happen.

---

## 2. The Question That Started It

`npm run serve` appeared once, on line 97, inside **Deployment → Option 1**,
below Features, Keyboard Mappings and Technology Stack — and it did not say
which directory. That matters here more than it usually would: `serve.js`
resolves its document root as `__dirname/web`, so it must run from the
repository root, and running it from inside `web/` fails for a second reason —
there is no `package.json` there for npm to find.

There is now a **Run it locally** section directly after the Overview, naming
the directory, the URL, and the fact that no install step is needed to run the
application at all. The deployment section says the same thing where it repeats
the command, rather than assuming the reader arrived from the top.

---

## 3. Three Stale Claims in the Same File

**The fonts.** The stack table said *"Inter + JetBrains Mono — Google Fonts
(CDN)"*. They ship at `web/vendor/fonts/`, in three families rather than two —
Libre Franklin is the third — and no page in `web/` references
`fonts.googleapis.com` or `fonts.gstatic.com`. SC-060 has forbidden such a
reference since DCR-030, so the row contradicted an enforced rule.

**A heading naming a field the schema does not have.** *"Changing the Minimum
Cell Count"*, above a paragraph whose first sentence is "`minCellCount` was the
v1 field name and no longer exists". The section corrected itself and left its
own title uncorrected.

**The file structure.** It omitted `tests-e2e/`, `NOTICE`, `USER-GUIDE.md`,
`evidence/`, `legacy/` and `playwright.config.js` — including the entire system
test layer, which the Testing section two screens below describes in detail.

---

## 4. The Part Worth Recording

The fonts row is **incident 49, and the drift log predicted it**. Row 21 —
Tailwind described as CDN-delivered after it was vendored — is listed in §3 as
guarded only in part:

> `SC-060` now makes the underlying fact enforceable — no page may reference
> another origin — so the README's "no external request" claim cannot silently
> become false. What is still unguarded is the *prose*: a stack table could name
> the wrong delivery mechanism for a local asset and no test would notice.

That is exactly what happened, in the same table, one row down, and it went
unnoticed for as long as the fonts have been vendored. The prediction was
written and the guard was not built, so the log recorded the risk and the
repository ran it anyway.

It is built now. QC-025's claims table gains a row for it, and two mechanical
changes make that possible:

- **`export` becomes optional.** The capability here is a property of the tree —
  no file under `web/` references an external font host — rather than a Core
  function. A row may now anchor on `holds()` alone.
- **Historical records are out of scope**, as `QMS/DHF/DCR/` already was. The
  first run of the check flagged `REVIEW-2026-08-06.md` and
  `CLAUDE-CODE-DRIFT-REMEDIATION.md`, both of which state the false claim
  *because they are the records of it being found*. Editing either to satisfy a
  check would falsify the record.

The residual gap is narrower but real, and is stated in §3 of the log rather
than left implied: the guard knows one delivery mechanism for one asset class.
A future vendored dependency described as remote would still pass.

---

## 5. Verification

| Case | What it holds |
|---|---|
| **QC-025** | A vendored asset is not described as remote — anchored on the tree, not on a symbol |

Revert-checked: restoring the "Google Fonts (CDN)" row fails QC-025 naming the
file and line. The three prose corrections carry no guard beyond that one, and
none is proposed — a heading and a directory listing are checked by reading.

---

## 6. Risk

No hazard is affected. Nothing in the application changes; `web/` is untouched.
The failure mode being closed is HA-097's — operator documentation describing
software that no longer exists — one instance of which was live in the README's
stack table.

---

## 7. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-23 | QMS | Initial issue. README gains a Run it locally section naming the directory; the fonts row, the minCellCount heading and the file structure corrected; QC-025 gains a claims row for a vendored asset described as remote, an optional `export`, and an exemption for dated historical records. Drift incident 49. |

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
