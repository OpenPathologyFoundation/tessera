/**
 * TEST SUITE 03: HTML Structure & UI Element Verification
 * ========================================================
 * Traces to: SRS SYS-001 through SYS-004, SYS-010, SYS-050, SYS-064, SYS-070, SYS-080, SYS-096, SYS-110
 * FMEA: HA-001 (no case input), HA-004 (no case in output)
 *
 * Verifies that all required UI elements exist in the HTML file and
 * are correctly structured for the application to function.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const HTML_PATH = path.join(__dirname, '..', 'web', 'counter.html');
let html;

describe('HTML Structure — File Integrity', () => {

    it('VV-DOM-001: counter.html exists and is readable', () => {
        assert.ok(fs.existsSync(HTML_PATH), 'counter.html must exist');
        html = fs.readFileSync(HTML_PATH, 'utf-8');
        assert.ok(html.length > 0, 'counter.html must not be empty');
    });

    it('VV-DOM-002: HTML has correct doctype and lang attribute', () => {
        assert.ok(html.includes('<!DOCTYPE html>'), 'Must have HTML5 doctype');
        assert.ok(html.includes('lang="en"'), 'Must have lang="en"');
    });

    it('VV-DOM-003: HTML includes Tailwind CSS from a local asset (URS-094)', () => {
        assert.ok(html.includes('vendor/tailwind.js'), 'Must include the vendored Tailwind build');
        assert.ok(fs.existsSync(path.join(__dirname, '..', 'web', 'vendor', 'tailwind.js')),
            'the vendored Tailwind asset must be present in the repository');
    });

    it('VV-DOM-004: No render-blocking asset is loaded from a third-party CDN (URS-094)', () => {
        // Counting must work on a workstation with no internet access. Webfonts
        // remain a progressive enhancement (the local font stack covers them),
        // but stylesheet and script dependencies must be served locally.
        assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//,
            'no script may be loaded from a remote origin');
        assert.doesNotMatch(html, /cdn\.tailwindcss\.com/,
            'Tailwind must not be loaded from the CDN');
    });

    it('VV-DOM-005: Registers a service worker for offline operation (URS-094)', () => {
        assert.ok(html.includes('serviceWorker'), 'must register a service worker');
        assert.ok(fs.existsSync(path.join(__dirname, '..', 'web', 'sw.js')),
            'sw.js must be present');
    });

    it('VV-DOM-006: HTML includes the application script mdc-app.js', () => {
        assert.ok(html.includes('mdc-app.js'), 'Must reference mdc-app.js');
    });

    it('VV-DOM-007: HTML does not include old Backbone/jQuery dependencies', () => {
        assert.ok(!html.includes('backbone'), 'Should not include Backbone.js');
        assert.ok(!html.includes('underscore.js'), 'Should not include Underscore.js');
        assert.ok(!html.includes('handlebars'), 'Should not include Handlebars.js');
    });
});

describe('HTML Structure — Case Identification Elements (SYS-001 to SYS-004)', () => {

    it('VV-DOM-050: Case number input field exists with id="caseNumber" (SYS-001)', () => {
        assert.ok(html.includes('id="caseNumber"'), 'Must have caseNumber input');
    });

    it('VV-DOM-008: Case number input has maxlength="30" (SYS-002)', () => {
        assert.ok(html.includes('maxlength="30"'), 'caseNumber must have maxlength=30');
    });

    it('VV-DOM-009: Case number input has autocomplete="off" (prevents browser autofill)', () => {
        assert.ok(html.includes('autocomplete="off"'), 'caseNumber should have autocomplete off');
    });

    it('VV-DOM-051: Case badge display element exists (SYS-004)', () => {
        assert.ok(html.includes('id="case-badge"'), 'Must have case-badge element');
        assert.ok(html.includes('id="case-badge-number"'), 'Must have case-badge-number element');
        assert.ok(html.includes('id="case-badge-spec"'), 'Must have case-badge-spec element');
    });
});

describe('HTML Structure — Specimen Type Selection (SYS-010)', () => {

    it('VV-DOM-010: Specimen type select element exists with id="specimenType"', () => {
        assert.ok(html.includes('id="specimenType"'), 'Must have specimenType select');
    });

    it('VV-DOM-011: Bone Marrow option with value="bm" exists', () => {
        assert.ok(html.includes('value="bm"'), 'Must have BM option');
        assert.ok(/Bone\s*Marrow/.test(html), 'Must display "Bone Marrow" text');
    });

    it('VV-DOM-012: Peripheral Blood option with value="pb" exists', () => {
        assert.ok(html.includes('value="pb"'), 'Must have PB option');
        assert.ok(/Peripheral\s*Blood/.test(html), 'Must display "Peripheral Blood" text');
    });
});

describe('HTML Structure — Control Buttons (SYS-050, SYS-080)', () => {

    it('VV-DOM-013: Start Count button exists and is enabled by default', () => {
        assert.ok(html.includes('id="btnStartCount"'), 'Must have Start Count button');
        // Start button should NOT have disabled attribute (case # is optional)
        const btnMatch = html.match(/id="btnStartCount"[^>]*>/);
        assert.ok(btnMatch, 'Start Count button must be found');
        assert.ok(!btnMatch[0].includes('disabled'), 'Start Count must NOT be initially disabled');
    });

    it('VV-DOM-014: Count Done button exists (SYS-050)', () => {
        assert.ok(html.includes('id="btnCountDone"'), 'Must have Count Done button');
    });

    it('VV-DOM-015: Reset button exists (SYS-080)', () => {
        assert.ok(html.includes('id="btnCountReset"'), 'Must have Reset button');
    });

    it('VV-DOM-016: Copy to Clipboard button exists (SYS-064)', () => {
        assert.ok(html.includes('id="btnCopyOutput"'), 'Must have Copy button');
    });

    it('VV-DOM-017: New Case button exists', () => {
        assert.ok(html.includes('id="btnNewCase"'), 'Must have New Case button');
    });

    it('VV-DOM-018: Resume Counting button exists (btnResumeCounting)', () => {
        assert.ok(html.includes('id="btnResumeCounting"'), 'Must have Resume Counting button');
    });
});

describe('HTML Structure — Three-Phase Layout', () => {

    it('VV-DOM-019: Phase 1: Case entry section exists', () => {
        assert.ok(html.includes('id="phase-case-entry"'), 'Must have case-entry phase');
    });

    it('VV-DOM-020: Phase 2: Counting section exists (hidden initially)', () => {
        assert.ok(html.includes('id="phase-counting"'), 'Must have counting phase');
        // Should start hidden
        const match = html.match(/id="phase-counting"[^>]*class="([^"]*)"/);
        assert.ok(match && match[1].includes('hidden'), 'Counting phase must start hidden');
    });

    it('VV-DOM-021: Phase 3: Results section exists (hidden initially)', () => {
        assert.ok(html.includes('id="phase-results"'), 'Must have results phase');
        const match = html.match(/id="phase-results"[^>]*class="([^"]*)"/);
        assert.ok(match && match[1].includes('hidden'), 'Results phase must start hidden');
    });

    it('VV-DOM-022: Counter table rendering area exists', () => {
        assert.ok(html.includes('id="counter-table-area"'), 'Must have counter-table-area div');
    });
});

describe('HTML Structure — Morphology Comments (SYS-070)', () => {

    it('VV-DOM-023: Morphology comments textarea exists with id="morphComments"', () => {
        assert.ok(html.includes('id="morphComments"'), 'Must have morphComments textarea');
    });

    it('VV-DOM-024: Comments textarea has maxlength="500" (SYS-071)', () => {
        assert.ok(html.includes('maxlength="500"'), 'morphComments must have maxlength=500');
    });

    it('VV-DOM-025: Character counter exists', () => {
        assert.ok(html.includes('id="commentCharCount"'), 'Must have character counter');
    });
});

describe('HTML Structure — Output Area (SYS-062)', () => {

    it('VV-DOM-026: Tab navigation area exists', () => {
        assert.ok(html.includes('id="tab-nav"'), 'Must have tab-nav');
    });

    it('VV-DOM-027: Tab panels area exists', () => {
        assert.ok(html.includes('id="tab-panels"'), 'Must have tab-panels');
    });

    it('VV-DOM-028: Results summary area exists', () => {
        assert.ok(html.includes('id="results-summary"'), 'Must have results-summary');
    });
});

describe('HTML Structure — Session History (SYS-092, SYS-094)', () => {

    it('VV-DOM-029: Session history section exists', () => {
        assert.ok(html.includes('id="session-history-section"'), 'Must have session history section');
    });

    it('VV-DOM-030: History list container exists', () => {
        assert.ok(html.includes('id="history-list"'), 'Must have history-list');
    });

    it('VV-DOM-031: History count badge exists', () => {
        assert.ok(html.includes('id="history-count"'), 'Must have history-count');
    });

    it('VV-DOM-032: Export session buttons exist', () => {
        assert.ok(html.includes('id="btnExportCsv"'), 'Must have Export CSV button');
        assert.ok(html.includes('id="btnExportJson"'), 'Must have Export JSON button');
    });

    it('VV-DOM-033: Temporary data notice is present (SYS-094)', () => {
        assert.ok(html.includes('temporary') && html.includes('lost'),
            'Must contain notice about temporary data');
    });
});

describe('HTML Structure — Modal Dialogs (SYS-007, SYS-053, SYS-081)', () => {

    it('VV-DOM-034: Confirmation modal overlay exists', () => {
        assert.ok(html.includes('id="modal-overlay"'), 'Must have modal-overlay');
    });

    it('VV-DOM-035: Modal has title, message, confirm, and cancel elements', () => {
        assert.ok(html.includes('id="modal-title"'), 'Must have modal-title');
        assert.ok(html.includes('id="modal-message"'), 'Must have modal-message');
        assert.ok(html.includes('id="modal-confirm"'), 'Must have modal-confirm');
        assert.ok(html.includes('id="modal-cancel"'), 'Must have modal-cancel');
    });

    it('VV-DOM-036: History detail modal exists', () => {
        assert.ok(html.includes('id="history-modal"'), 'Must have history-modal');
        assert.ok(html.includes('id="history-modal-title"'), 'Must have history-modal-title');
        assert.ok(html.includes('id="history-modal-content"'), 'Must have history-modal-content');
        assert.ok(html.includes('id="history-modal-close"'), 'Must have history-modal-close');
    });
});

describe('HTML Structure — Accessibility & Usability', () => {

    it('VV-DOM-037: Labels are associated with inputs via "for" attribute', () => {
        assert.ok(html.includes('for="caseNumber"'), 'caseNumber must have a label');
        assert.ok(html.includes('for="specimenType"'), 'specimenType must have a label');
    });

    it('VV-DOM-038: Status indicator elements exist', () => {
        assert.ok(html.includes('id="state-label"'), 'Must have state-label');
    });

    it('VV-DOM-039: Theme toggle button exists', () => {
        assert.ok(html.includes('id="btnToggleTheme"'), 'Must have theme toggle button');
    });

    it('VV-DOM-040: Keyboard hint text is present for users', () => {
        assert.ok(html.includes('Shift'), 'Must mention Shift key for undo');
        assert.ok(html.includes('undo'), 'Must mention undo functionality');
    });

    it('VV-DOM-041: Audio toggle button exists (URS-027)', () => {
        assert.ok(html.includes('id="btnToggleAudio"'), 'Must have audio toggle button');
        assert.ok(html.includes('id="audioLabel"'), 'Must have audio label');
    });

    it('VV-DOM-042: Print button exists in results phase (URS-054)', () => {
        assert.ok(html.includes('id="btnPrintResults"'), 'Must have Print button');
    });

    it('VV-DOM-043: Absolute count section exists in results phase (URS-036)', () => {
        assert.ok(html.includes('id="absolute-count-section"'), 'Must have absolute count section');
        assert.ok(html.includes('id="wbcTotal"'), 'Must have WBC total input');
        assert.ok(html.includes('id="abs-results"'), 'Must have absolute results container');
    });

    it('VV-DOM-044: Morphology checklist area exists (URS-072)', () => {
        assert.ok(html.includes('id="morphChecklistArea"'), 'Must have morphology checklist area');
    });

    it('VV-DOM-045: Config export button exists (URS-103)', () => {
        assert.ok(html.includes('id="btnExportConfig"'), 'Must have config export button');
    });

    it('VV-DOM-046: Config import file input exists (URS-103)', () => {
        assert.ok(html.includes('id="configFileInput"'), 'Must have config file input');
    });

    it('VV-DOM-047: Reset to Default Config button exists', () => {
        assert.ok(html.includes('id="btnResetConfig"'), 'Must have reset config button');
    });

    it('VV-DOM-048: Print media styles are defined (URS-054)', () => {
        // Print rules live in the shared stylesheet rather than inline: they
        // were previously duplicated per page and drifted. What matters for
        // URS-054 is that the page actually reaches them, so assert the link
        // and the rules, not their location.
        assert.ok(html.includes('styles/theme.css'),
            'counter.html must link the shared stylesheet');
        const theme = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'styles', 'theme.css'), 'utf-8');
        assert.ok(theme.includes('@media print'),
            'the shared stylesheet must define print media styles');
    });

    it('VV-DOM-049: The theme is applied before first paint, on the root element (URS-095)', () => {
        // Applying it at the end of <body> painted the wrong theme first and
        // then transitioned, which put text below WCAG AA mid-transition
        // (RA-001 HA-098; caught by VV-SYS-162..168).
        const head = html.slice(0, html.indexOf('</head>'));
        assert.ok(head.includes("document.documentElement.setAttribute('data-theme'"),
            'the stored theme must be applied to <html> from within <head>');
        assert.ok(!html.includes("document.body.setAttribute('data-theme'"),
            'the theme must not be applied to <body> — the root element carries it');
    });
});
