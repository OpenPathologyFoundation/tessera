# DCR-037: Design Change Record — The Review Package Names Its Version

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-037 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Input** | Document Owner, preparing to send the brief to a reviewer |

---

## 1. What Was Wrong

The clinical review package was about to be sent and could not be acted on.

**It named no version.** `CLINICAL-REVIEW-BRIEF.md` and `SIGNOFF-REGISTER.md`
described the software as it stood on the day each was written, and `main`
moves. A reviewer forming a judgement over several days would have been
reviewing a moving target, and a signature would have attached to no particular
state of the file. That is the same defect as any other unpinned claim in this
project, applied to the review itself.

**It did not say how to run anything.** §4 opened "The application runs in a
browser with no installation" and then went straight to a suggested twenty
minutes of counting — with no repository link, no command, and no URL. A
reviewer receiving that document had no route from reading it to opening the
tool.

Neither is a subtle defect. Both survived because the brief was written by
someone who already had the application running.

---

## 2. What Changed

`v2.22.1` is a documentation-only release. No product behaviour changes.

- Both documents state **the version under review** in their header, with a
  link to the tagged tree, and the brief says plainly that the tag is fixed
  while `main` will move — and that a mismatch is itself worth reporting.
- §4 gains the four commands that get the application running, the URL, and the
  statement that nothing is fetched at runtime so the network can be
  disconnected.
- §4 also offers an alternative for a reviewer who would rather not run
  anything, and says explicitly that **the setup must not be the reason the
  review does not happen** — the questions in §3 can be answered from the
  document alone, and an answer without a signature is worth more than neither.

### The application did not state its own version

The package is now sent with a hosted URL — https://mdc.openpathology.org/ —
which removes the setup barrier entirely and is how the reviewer will actually
reach the tool.

That made a third gap load-bearing. **The application displayed the profile
version and not its own.** A results card read `Profile: 14-Type Nucleated
Differential (ndc-14 v2.6)`, and a reviewer could reasonably have taken v2.6 to
be the version under review. Those numbers are unrelated: a profile at v2.6 can
be served by any build. On a hosted site with no checkout to inspect, there was
no way at all to tell which version produced a report.

`buildMethodStatement` now emits an `Application` entry, so the card reads:

> Profile: 14-Type Nucleated Differential (ndc-14 v2.6)
> **Application: WBC ΔΣ v2.22.1**

QC-016 is extended to hold `APP_VERSION` equal to `package.json`, `DHF-001` and
the service-worker cache key — four places, one number. The brief tells the
reviewer to check that line before signing, and to report a mismatch rather than
work around it.

This also improves every exported report: the build that produced a count is now
stated on it, which URS-052 wanted and did not have.

### Why this is a patch release rather than a re-tag

`v2.22.0` was tagged and pushed before this gap was noticed. Moving a published
tag would have made the pin unverifiable — a reviewer told to review `v2.22.0`
would fetch a tag whose content had changed since it was announced, which is
precisely the failure mode the pin exists to prevent. The tag stands; the
corrected package is `v2.22.1`.

---

## 3. Risk

No change to any calculation, configuration, or shipped behaviour. `CACHE_VERSION`
is bumped for coherence, which QC-016 enforces.

The hazard addressed is `HA-097` in its most consequential form: documentation
that cannot be acted on by the reader it was written for. There is no automated
guard for "a document tells its reader how to reach the thing it describes", and
none is proposed — it would test phrasing. It is recorded here instead.

---

## 4. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. Hosted URL (https://mdc.openpathology.org/) given as the primary route; `Application: WBC ΔΣ vX` added to the method statement, since the card previously showed only the PROFILE version and a reviewer on a hosted site had no way to identify the build; QC-016 extended to cover it. Version pin and source link added to the clinical review brief and the sign-off register; instructions for running the application added to §4, with an offer for reviewers who would rather not. |

---

## 5. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
