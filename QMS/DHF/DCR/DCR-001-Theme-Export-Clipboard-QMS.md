# DCR-001: Design Change Record — Theme Toggle, Session Export, Clipboard Safety, QMS Evidence

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-001 |
| **Version** | 1.0 |
| **Date Created** | 2026-02-20 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Related PR** | N/A |

---

## 1. Change Summary

Added Light/Dark theme support with UI toggle and keyboard shortcut, session export to CSV/JSON, clipboard clear on new case start, and a standardized QMS test-evidence capture workflow.

---

## 2. Rationale

Improve ergonomics in bright lab environments (light mode), provide local records of session history (export), reduce clipboard carryover risk on new sessions, and ensure test evidence is captured in a consistent, auditable format.

---

## 3. Scope and Impact

**Impacted Components**
- UI: Theme toggle control; light-mode styling overrides; export buttons in session history.
- Logic: Theme persistence in sessionStorage; export file generation; clipboard clear on new case.
- Tests: Static integrity checks for theme/export/clipboard.
- QMS Docs: URS/SRS/SDD/RTM/TP/TR/DHF index updates; test evidence archive.
- Policy Docs: Branding/trademark guidance for logo usage.

**Out of Scope**
- No changes to counting algorithms or calculation logic.
- No changes to backend (application is client-only).

---

## 4. Requirements Impact

**URS Impacted**:
- URS-084 (session export to CSV/JSON)
- URS-095 (Light/Dark theme toggle for ergonomic presentation)

**SRS Impacted**:
- SYS-096, SYS-097 (session export controls + content)
- SYS-110, SYS-111, SYS-112 (theme toggle control, shortcut, persistence)

---

## 5. Design / Documentation Updates

- URS-001: added theme toggle requirement (URS-095).
- SRS-001: added theme requirements (SYS-110 to SYS-112).
- SDD-001: theme toggle design notes.
- RTM-001: traceability updates for URS-095.
- TP-001: added theme toggle test cases.
- TR-001: test evidence capture reference.
- DHF-001: added Test Evidence archive entry.
- Added trademark/branding policy and assets README.

---

## 6. Risk Assessment

No new hazards identified. RA-001 update not required for this change set.

---

## 7. Verification / Testing

**Test Plan Trace**:
- TP-001 (Theme tests TC-120–TC-122; export tests TC-095–TC-096)

**Execution Evidence**:
- QMS/DHF/TestEvidence/2026-02-20_162310_run/

---

## 8. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Design Engineer | | | |
| Quality Assurance | | | |
| Regulatory Affairs | | | |
