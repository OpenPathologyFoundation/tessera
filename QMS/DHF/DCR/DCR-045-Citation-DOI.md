# DCR-045: Design Change Record — The DOI, Written Where Readers Look

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-045 |
| **Version** | 1.0 |
| **Date Created** | 2026-11-27 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | DCR-044 §2, step 3 |
| **Closes** | DCR-044's pending DOI |

---

## 1. What This Is

Zenodo archived release `v2.24.1` on 2026-11-27 and issued two DOIs:

| DOI | Resolves to |
|-----|-------------|
| `10.5281/zenodo.24606768` | the concept: always the latest archived version |
| `10.5281/zenodo.24606769` | v2.24.1 |

Both were read from the Zenodo record (`zenodo.org/records/24606769`) and both
resolve at `doi.org`. The record's title, creator, licence (Apache-2.0) and
version came from `CITATION.cff`, as DCR-044 intended.

The first publication of the release did not reach Zenodo: the integration had
been switched on before Zenodo was authorized for the organization, so the
repository had no webhook. Once authorized, the hook existed; the release was
deleted and re-created on the same tag, and Zenodo archived the re-created one.
The tag did not move.

---

## 2. Scope and Impact

**Changed**
- `CITATION.cff`: `doi` (the concept DOI) and `identifiers` (both DOIs).
- `README.md`: a *How to cite* section after the Overview, with the concept DOI,
  the v2.24.1 DOI, and a pointer to `CITATION.cff`.
- `DHF-001`: §5 index row; §6 revision row AU.

**Out of scope**
- Product behaviour, requirements, hazards, tests, version: unchanged. The
  citation file now names a DOI the next release will carry into its own
  archive record.

---

## 3. Requirements Impact

**URS Impacted**: none. **SRS Impacted**: none.

---

## 4. Risk Assessment

RA-001 does not require update.

---

## 5. Verification / Testing

`npm test`, including suite 14; both DOIs resolved at `doi.org` on 2026-11-27.

---

## 6. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
