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

    it('counter.html exists and is readable', () => {
        assert.ok(fs.existsSync(HTML_PATH), 'counter.html must exist');
        html = fs.readFileSync(HTML_PATH, 'utf-8');
        assert.ok(html.length > 0, 'counter.html must not be empty');
    });

    it('HTML has correct doctype and lang attribute', () => {
        assert.ok(html.includes('<!DOCTYPE html>'), 'Must have HTML5 doctype');
        assert.ok(html.includes('lang="en"'), 'Must have lang="en"');
    });

    it('HTML includes Tailwind CSS', () => {
        assert.ok(html.includes('tailwindcss') || html.includes('cdn.tailwindcss.com'),
            'Must include Tailwind CSS');
    });

    it('HTML includes the application script mdc-app.js', () => {
        assert.ok(html.includes('mdc-app.js'), 'Must reference mdc-app.js');
    });

    it('HTML does not include old Backbone/jQuery dependencies', () => {
        assert.ok(!html.includes('backbone'), 'Should not include Backbone.js');
        assert.ok(!html.includes('underscore.js'), 'Should not include Underscore.js');
        assert.ok(!html.includes('handlebars'), 'Should not include Handlebars.js');
    });
});

describe('HTML Structure — Case Identification Elements (SYS-001 to SYS-004)', () => {

    it('SYS-001: Case number input field exists with id="caseNumber"', () => {
        assert.ok(html.includes('id="caseNumber"'), 'Must have caseNumber input');
    });

    it('Case number input has maxlength="30" (SYS-002)', () => {
        assert.ok(html.includes('maxlength="30"'), 'caseNumber must have maxlength=30');
    });

    it('Case number input has autocomplete="off" (prevents browser autofill)', () => {
        assert.ok(html.includes('autocomplete="off"'), 'caseNumber should have autocomplete off');
    });

    it('SYS-004: Case badge display element exists', () => {
        assert.ok(html.includes('id="case-badge"'), 'Must have case-badge element');
        assert.ok(html.includes('id="case-badge-number"'), 'Must have case-badge-number element');
        assert.ok(html.includes('id="case-badge-spec"'), 'Must have case-badge-spec element');
    });
});

describe('HTML Structure — Specimen Type Selection (SYS-010)', () => {

    it('Specimen type select element exists with id="specimenType"', () => {
        assert.ok(html.includes('id="specimenType"'), 'Must have specimenType select');
    });

    it('Bone Marrow option with value="bm" exists', () => {
        assert.ok(html.includes('value="bm"'), 'Must have BM option');
        assert.ok(/Bone\s*Marrow/.test(html), 'Must display "Bone Marrow" text');
    });

    it('Peripheral Blood option with value="pb" exists', () => {
        assert.ok(html.includes('value="pb"'), 'Must have PB option');
        assert.ok(/Peripheral\s*Blood/.test(html), 'Must display "Peripheral Blood" text');
    });
});

describe('HTML Structure — Control Buttons (SYS-050, SYS-080)', () => {

    it('Start Count button exists and is initially disabled (SYS-003)', () => {
        assert.ok(html.includes('id="btnStartCount"'), 'Must have Start Count button');
        // Check that it has disabled attribute
        const btnMatch = html.match(/id="btnStartCount"[^>]*>/);
        assert.ok(btnMatch, 'Start Count button must be found');
        assert.ok(btnMatch[0].includes('disabled'), 'Start Count must be initially disabled');
    });

    it('Count Done button exists (SYS-050)', () => {
        assert.ok(html.includes('id="btnCountDone"'), 'Must have Count Done button');
    });

    it('Reset button exists (SYS-080)', () => {
        assert.ok(html.includes('id="btnCountReset"'), 'Must have Reset button');
    });

    it('Copy to Clipboard button exists (SYS-064)', () => {
        assert.ok(html.includes('id="btnCopyOutput"'), 'Must have Copy button');
    });

    it('New Case button exists', () => {
        assert.ok(html.includes('id="btnNewCase"'), 'Must have New Case button');
    });
});

describe('HTML Structure — Three-Phase Layout', () => {

    it('Phase 1: Case entry section exists', () => {
        assert.ok(html.includes('id="phase-case-entry"'), 'Must have case-entry phase');
    });

    it('Phase 2: Counting section exists (hidden initially)', () => {
        assert.ok(html.includes('id="phase-counting"'), 'Must have counting phase');
        // Should start hidden
        const match = html.match(/id="phase-counting"[^>]*class="([^"]*)"/);
        assert.ok(match && match[1].includes('hidden'), 'Counting phase must start hidden');
    });

    it('Phase 3: Results section exists (hidden initially)', () => {
        assert.ok(html.includes('id="phase-results"'), 'Must have results phase');
        const match = html.match(/id="phase-results"[^>]*class="([^"]*)"/);
        assert.ok(match && match[1].includes('hidden'), 'Results phase must start hidden');
    });

    it('Counter table rendering area exists', () => {
        assert.ok(html.includes('id="counter-table-area"'), 'Must have counter-table-area div');
    });
});

describe('HTML Structure — Morphology Comments (SYS-070)', () => {

    it('Morphology comments textarea exists with id="morphComments"', () => {
        assert.ok(html.includes('id="morphComments"'), 'Must have morphComments textarea');
    });

    it('Comments textarea has maxlength="500" (SYS-071)', () => {
        assert.ok(html.includes('maxlength="500"'), 'morphComments must have maxlength=500');
    });

    it('Character counter exists', () => {
        assert.ok(html.includes('id="commentCharCount"'), 'Must have character counter');
    });
});

describe('HTML Structure — Output Area (SYS-062)', () => {

    it('Tab navigation area exists', () => {
        assert.ok(html.includes('id="tab-nav"'), 'Must have tab-nav');
    });

    it('Tab panels area exists', () => {
        assert.ok(html.includes('id="tab-panels"'), 'Must have tab-panels');
    });

    it('Results summary area exists', () => {
        assert.ok(html.includes('id="results-summary"'), 'Must have results-summary');
    });
});

describe('HTML Structure — Session History (SYS-092, SYS-094)', () => {

    it('Session history section exists', () => {
        assert.ok(html.includes('id="session-history-section"'), 'Must have session history section');
    });

    it('History list container exists', () => {
        assert.ok(html.includes('id="history-list"'), 'Must have history-list');
    });

    it('History count badge exists', () => {
        assert.ok(html.includes('id="history-count"'), 'Must have history-count');
    });

    it('Export session buttons exist', () => {
        assert.ok(html.includes('id="btnExportCsv"'), 'Must have Export CSV button');
        assert.ok(html.includes('id="btnExportJson"'), 'Must have Export JSON button');
    });

    it('Temporary data notice is present (SYS-094)', () => {
        assert.ok(html.includes('temporary') && html.includes('lost'),
            'Must contain notice about temporary data');
    });
});

describe('HTML Structure — Modal Dialogs (SYS-007, SYS-053, SYS-081)', () => {

    it('Confirmation modal overlay exists', () => {
        assert.ok(html.includes('id="modal-overlay"'), 'Must have modal-overlay');
    });

    it('Modal has title, message, confirm, and cancel elements', () => {
        assert.ok(html.includes('id="modal-title"'), 'Must have modal-title');
        assert.ok(html.includes('id="modal-message"'), 'Must have modal-message');
        assert.ok(html.includes('id="modal-confirm"'), 'Must have modal-confirm');
        assert.ok(html.includes('id="modal-cancel"'), 'Must have modal-cancel');
    });

    it('History detail modal exists', () => {
        assert.ok(html.includes('id="history-modal"'), 'Must have history-modal');
        assert.ok(html.includes('id="history-modal-title"'), 'Must have history-modal-title');
        assert.ok(html.includes('id="history-modal-content"'), 'Must have history-modal-content');
        assert.ok(html.includes('id="history-modal-close"'), 'Must have history-modal-close');
    });
});

describe('HTML Structure — Accessibility & Usability', () => {

    it('Labels are associated with inputs via "for" attribute', () => {
        assert.ok(html.includes('for="caseNumber"'), 'caseNumber must have a label');
        assert.ok(html.includes('for="specimenType"'), 'specimenType must have a label');
    });

    it('Status indicator elements exist', () => {
        assert.ok(html.includes('id="state-label"'), 'Must have state-label');
    });

    it('Theme toggle button exists', () => {
        assert.ok(html.includes('id="btnToggleTheme"'), 'Must have theme toggle button');
    });

    it('Keyboard hint text is present for users', () => {
        assert.ok(html.includes('Shift'), 'Must mention Shift key for undo');
        assert.ok(html.includes('undo'), 'Must mention undo functionality');
    });
});
