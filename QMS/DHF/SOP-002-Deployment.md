# SOP-002: Deployment

## Purpose
Define a controlled, repeatable process to package, verify, and deploy the WBC ΔΣ application.

## Scope
Applies to all releases of WBC ΔΣ, including internal staging and production environments.

## Roles and Responsibilities
- **Release Owner**: Prepares the release, runs verification, and documents results.
- **Quality/Reviewer**: Confirms required QMS updates and approves release.
- **Operator/IT**: Executes the deployment steps in the target environment.

## Preconditions
- Requirements, design, risk, and test artifacts are updated as needed.
- All automated tests pass.
- Release is versioned and tagged.
- A Design Change Record (DCR) exists for the change set.

## Inputs
- `web/` directory (deployable artifact)
- Test results (e.g., `TR-001-TestResults.md`)
- Release notes / change summary

## Procedure
1) **Prepare release**
   - Verify working tree is clean.
   - Confirm `web/` contains the intended assets.
   - Ensure configuration (`web/settings/templates.json`) is validated and approved.

2) **Run verification**
   - Execute `npm run test:qms` to capture evidence and update TR/DCR.
   - `npm test` may be used for quick checks, but does not capture QMS evidence.

3) **Package**
   - For static hosting: copy `web/` as-is.
   - For servlet containers: create a WAR from `web/` (optional).

4) **Deploy**
   - Upload or sync files to the target web root.
   - Ensure the entry point is `counter.html`.
   - If using a custom port, document it.

5) **Post-deploy checks**
   - Open the app and perform a quick functional smoke check:
     - Case number entry required.
     - Keyboard counting increments/decrements.
     - Percentages update correctly.
     - Copy-to-clipboard produces expected output.

6) **Document**
   - Capture deployment date/time, environment, and responsible personnel.
   - Record any deviations and approvals.

## Controls
- Only deploy from verified artifacts.
- No patient data is stored on the server.
- Maintain full traceability to QMS artifacts.

## Records
- `QMS/DHF/TR-001-TestResults.md`
- `QMS/DHF/TestEvidence/`
- Release notes (if applicable)
- Deployment log (date/time/environment)
