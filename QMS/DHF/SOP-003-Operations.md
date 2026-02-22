# SOP-003: Operations

## Purpose
Define standard operating procedures for day-to-day operation, monitoring, and controlled change management of the Tessera application.

## Scope
Applies to all operational use of Tessera in laboratory or clinical environments.

## Roles and Responsibilities
- **Operator**: Uses the application for counting tasks.
- **Supervisor**: Oversees adherence to SOP and clinical workflow.
- **IT/Support**: Maintains hosting environment and responds to incidents.
- **Quality/Reviewer**: Ensures QMS compliance for changes.

## Operational Use
1) Verify the correct environment and version.
2) Enter case/accession number before counting.
3) Use keyboard mappings as configured in the template.
4) Use the comments field for morphology notes.
5) Copy the formatted output into the LIS/EMR.

## Data Handling
- No patient identifiers or PHI should be stored by the application.
- Session data is temporary and cleared when the browser tab is closed.

## Monitoring
- Confirm application loads and counts correctly at the start of each shift.
- Periodically verify keyboard mappings and template outputs match local SOP.

## Incident Handling
1) Stop using the application if incorrect behavior is observed.
2) Record the issue: time, case identifier (de-identified), steps to reproduce.
3) Notify supervisor and IT/support.
4) Do not resume use until the issue is triaged and resolved.

## Change Management
1) Create a Design Change Record (DCR) entry in `QMS/DHF/DCR/` with scope and rationale.
2) Assess impact to requirements, design, and risk.
3) Update QMS documents as needed.
4) Implement change with tests and traceability.
5) Capture verification evidence using `npm run test:qms` (archives raw output under `QMS/DHF/TestEvidence/` and updates TR-001/DCR).
6) Deploy only after verification and approval.

## Training
- New operators must be trained on keyboard mappings and output interpretation.
- Refresher training is required after material workflow changes.

## Records
- Training records
- Incident reports
- Change logs and approvals
- Test evidence archive (`QMS/DHF/TestEvidence/`)
