# DCR-044: Design Change Record — A Citation File, and the Archive That Will Give It a DOI

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-044 |
| **Version** | 1.0 |
| **Date Created** | 2026-11-27 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | A request: make the repository citable, with a Zenodo DOI |
| **Closes** | — |

---

## 1. What This Is

The counter has no paper yet, and work that cannot be cited cannot be credited.
This change set makes the repository citable as software, in two stages.

**Now:** `CITATION.cff` at the repository root, in Citation File Format 1.2.0.
GitHub reads it and shows a *Cite this repository* control with APA and BibTeX
forms; Zenodo reads it for the archive record's metadata.

**Pending, and not done by this change set:** a DOI. Zenodo mints one only when
it archives a GitHub *release* of a repository whose owner has switched the
integration on. That requires the owner's Zenodo login, and a release this
repository does not yet have: the tags end at `v2.22.3`, there are no GitHub
releases, and `package.json` is at 2.24.1.

---

## 2. Why the DOI Is Not Written Anywhere Yet

A DOI typed into `README.md` or `CITATION.cff` before it exists would be a live
document stating something that is not true — the class of drift this
repository's log exists to record. The DOI is added by a later change set, from
the Zenodo record, after the release that creates it.

The order is therefore:

1. The owner enables `OpenPathologyFoundation/tessera` in Zenodo's GitHub
   settings (zenodo.org → GitHub, signed in with the organization's GitHub
   account).
2. A clean tree, the gates in `CLAUDE.md` §*Before you finish*, then a tag and a
   GitHub release for the current version. Zenodo archives the release and
   issues two DOIs: one for this version, and a concept DOI that always resolves
   to the latest.
3. A follow-up change set adds the **concept** DOI to `CITATION.cff`
   (`identifiers`, `doi`) and a *How to cite* section to `README.md`.

---

## 3. Scope and Impact

**Added**
- `CITATION.cff` — title, abstract, author, repository, licence (Apache-2.0, as
  `LICENSE` states), version, keywords. No DOI, no release date: neither exists.

**Changed**
- `DHF-001` §5 index: rows for DCR-043 and DCR-044. DCR-043 did not add its own
  row; that is a drift in a live document, fixed here and stated rather than
  silently.
- `DHF-001` §6 revision history: row AT.

**Out of scope**
- Product behaviour, requirements, hazards, tests: none change.
- The version: not moved, because no product state changes and the release that
  fixes a version for the archive is step 2 above, not this change set.
- `LICENSE`, `NOTICE`, `TRADEMARKS.md`: unchanged.

---

## 4. Requirements Impact

**URS Impacted**: none. **SRS Impacted**: none.

---

## 5. Design / Documentation Updates

`CITATION.cff` (new); `DHF-001` (§5, §6).

---

## 6. Risk Assessment

RA-001 does not require update. A metadata file changes nothing the operator
sees or the engine computes.

---

## 7. Verification / Testing

`npm test`, including suite 14, the document gate.

**Execution Evidence**: the run recorded with the commit of this change set.

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
