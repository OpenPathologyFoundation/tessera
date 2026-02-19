# Contributing

Thanks for improving the Manual Differential Counter (MDC). This is a safety‑critical, clinical workflow tool, so changes must be careful, testable, and traceable.

## Principles
- Keep the product **keyboard‑first**, **fast**, and **offline‑capable**.
- Do not introduce server‑side patient data handling.
- Preserve calculation correctness and safety guards.
- Avoid adding new dependencies unless there is a clear, documented need.

## Development Setup
- Node.js (LTS recommended).
- No install step is required for tests; the suite uses Node’s built‑in test runner.

## Run Locally
```bash
npm run serve
# http://localhost:8089/
```

## Tests
```bash
npm test
```

## QMS / DHF Updates (Required)
This project maintains a Design History File under `QMS/DHF/`. Any functional change must be accompanied by the appropriate documentation updates and test traceability:
- Update requirements/specs if behavior changes (URS/SRS).
- Update design documents if structure or algorithms change (SAD/SDD).
- Update risk analysis if hazards or mitigations change (RA‑001).
- Add/update tests and ensure traceability in TR‑001 and RTM‑001.

## Code Style
- Vanilla JavaScript (no framework dependencies).
- Prefer clear functions over complex abstractions.
- Keep keyboard mappings and templates consistent with `web/settings/templates.json`.

## Submitting Changes
- Ensure `npm test` is green.
- Include a concise description of the clinical impact and the QMS files updated.
- Do not include patient data in commits, issues, or logs.
