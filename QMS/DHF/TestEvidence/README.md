# Test Evidence Archive

This folder stores raw test execution evidence captured by the QMS test runner.

## How to capture evidence

Run:

```
npm run test:qms
```

This creates a dated subfolder under `QMS/DHF/TestEvidence/` containing:
- `command.txt` — command used to execute tests
- `environment.txt` — Node/npm version, platform, and runtime info
- `test-output-raw.txt` — full console output from the test run
- `test-summary.md` — run metadata and result status

## Optional label

```
npm run test:qms -- theme-toggle
```

This adds the label to the evidence folder name.

## DCR and TR automation

By default, the runner will:
- Update **TR-001** with an automated run log entry.
- Update the **single Draft DCR** (if exactly one exists) with the evidence path.

If multiple Draft DCRs exist, specify which to update:

```
npm run test:qms -- --dcr DCR-001-Theme-Export-Clipboard-QMS
```

To skip updates:

```
npm run test:qms -- --no-dcr --no-tr
```
