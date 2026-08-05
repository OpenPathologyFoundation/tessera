# Legacy Application (not part of the validated product)

This directory holds the original Backbone.js/JSP implementation that preceded
the current WBC ΔΣ counter. It is retained for reference and historical
traceability only.

**It is not served, not built, not tested, and not part of the Design History
File baseline.** It was moved out of `web/` under DCR-004 because `serve.js`
serves everything beneath `web/`, which meant unvalidated legacy code was being
published alongside the validated application — a configuration-management
defect under IEC 62304 §5.1 and 21 CFR 820.70(i).

Contents moved on 2026-08-04:

| Path | Description |
|------|-------------|
| `web/backbone-min.js` | Backbone.js runtime |
| `web/index.jsp` | Original JSP entry point |
| `web/WEB-INF/web.xml` | Servlet deployment descriptor |
| `web/library/handlebars-v3.0.3.js` | Handlebars templating runtime |
| `web/libraries/jquery-ui-1.11.4/` | jQuery UI stylesheet |
| `web/settings/findroot.php` | PHP path helper |
| `web/scripts/app.js`, `collections.js`, `counter.js`, `defines.js`, `keypress.js`, `models.js`, `routes.js`, `views.js` | Backbone application modules |
| `web/styles/landing-style.css`, `masthead.html` | Legacy presentation assets |

Nothing in `web/counter.html`, `web/editor.html` or `web/help.html` references
any of these files; this was verified before the move.

If this code is confirmed to be of no further value, the directory can be
deleted outright — git history preserves it either way.
