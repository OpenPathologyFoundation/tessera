/**
 * TEST SUITE 10: Configuration Editor
 * =====================================
 * Validates the editor HTML structure and JS integrity.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const EDITOR_HTML_PATH = path.join(__dirname, '..', 'web', 'editor.html');
const EDITOR_JS_PATH = path.join(__dirname, '..', 'web', 'scripts', 'config-editor.js');

describe('Config Editor — File Existence', () => {

    it('editor.html exists', () => {
        assert.ok(fs.existsSync(EDITOR_HTML_PATH), 'editor.html must exist');
    });

    it('config-editor.js exists', () => {
        assert.ok(fs.existsSync(EDITOR_JS_PATH), 'config-editor.js must exist');
    });
});

describe('Config Editor — HTML Structure', () => {

    let html;

    it('editor.html is readable and non-empty', () => {
        html = fs.readFileSync(EDITOR_HTML_PATH, 'utf-8');
        assert.ok(html.length > 0, 'editor.html must not be empty');
    });

    it('Has correct doctype and lang', () => {
        assert.ok(html.includes('<!DOCTYPE html>'), 'Must have doctype');
        assert.ok(html.includes('lang="en"'), 'Must have lang');
    });

    it('Includes Tailwind CSS from a local asset (URS-094)', () => {
        assert.ok(html.includes('vendor/tailwind.js'), 'Must include the vendored Tailwind build');
        assert.doesNotMatch(html, /cdn\.tailwindcss\.com/, 'Tailwind must not be loaded from the CDN');
    });

    it('References config-editor.js', () => {
        assert.ok(html.includes('config-editor.js'), 'Must reference config-editor.js');
    });

    it('Has cell reference panel', () => {
        assert.ok(html.includes('id="cell-reference"'), 'Must have cell-reference');
    });

    it('Has drop zones for upper and lower rows', () => {
        assert.ok(html.includes('id="drop-upper"'), 'Must have drop-upper zone');
        assert.ok(html.includes('id="drop-lower"'), 'Must have drop-lower zone');
    });

    it('Has key assignment area', () => {
        assert.ok(html.includes('id="key-assignment"'), 'Must have key-assignment area');
    });

    it('Has settings inputs', () => {
        assert.ok(html.includes('id="profileName"'), 'Must have profileName input');
        assert.ok(html.includes('id="profileId"'), 'Must have profileId input');
        assert.ok(html.includes('id="targetBm"'), 'Must have targetBm input');
        assert.ok(html.includes('id="targetPb"'), 'Must have targetPb input');
        assert.ok(html.includes('id="handedness"'), 'Must have handedness select');
        assert.ok(html.includes('id="absoluteCounts"'), 'Must have absoluteCounts select');
    });

    it('Has template editor', () => {
        assert.ok(html.includes('id="template-editor"'), 'Must have template editor');
    });

    it('Has live preview', () => {
        assert.ok(html.includes('id="live-preview"'), 'Must have live preview');
    });

    it('Has save/load buttons', () => {
        assert.ok(html.includes('id="btnSaveProfile"'), 'Must have save button');
        assert.ok(html.includes('id="btnLoadProfile"'), 'Must have load button');
    });

    it('Has back link to counter', () => {
        assert.ok(html.includes('counter.html'), 'Must link back to counter');
    });

    it('Has specimen tabs area', () => {
        assert.ok(html.includes('id="specimen-tabs"'), 'Must have specimen tabs');
    });

    it('Has morphology checklist editor', () => {
        assert.ok(html.includes('id="morph-checklist-editor"'), 'Must have morph checklist editor');
    });
});

describe('Config Editor — JavaScript Integrity', () => {

    let jsCode;

    it('config-editor.js has valid syntax', () => {
        jsCode = fs.readFileSync(EDITOR_JS_PATH, 'utf-8');
        assert.doesNotThrow(() => {
            new Function(jsCode);
        }, 'config-editor.js must have valid JavaScript syntax');
    });

    it('Uses strict mode', () => {
        assert.ok(jsCode.includes("'use strict'"), 'Must use strict mode');
    });

    it('Wraps in IIFE', () => {
        assert.ok(jsCode.includes('(function ()') || jsCode.includes('(function()'),
            'Must be wrapped in IIFE');
    });

    it('Defines CELL_REFERENCE array', () => {
        assert.ok(jsCode.includes('CELL_REFERENCE'), 'Must define CELL_REFERENCE');
    });

    it('Defines editorState object', () => {
        assert.ok(jsCode.includes('editorState'), 'Must define editorState');
    });

    it('Has drag-and-drop support', () => {
        assert.ok(jsCode.includes('dragstart'), 'Must handle dragstart');
        assert.ok(jsCode.includes('dragover'), 'Must handle dragover');
        assert.ok(jsCode.includes('drop'), 'Must handle drop');
    });

    it('Has buildConfigJSON function', () => {
        assert.ok(jsCode.includes('function buildConfigJSON'), 'Must define buildConfigJSON');
    });

    it('Has renderCellReference function', () => {
        assert.ok(jsCode.includes('function renderCellReference'), 'Must define renderCellReference');
    });

    it('Has renderLayout function', () => {
        assert.ok(jsCode.includes('function renderLayout'), 'Must define renderLayout');
    });

    it('Has renderKeyAssignment function', () => {
        assert.ok(jsCode.includes('function renderKeyAssignment'), 'Must define renderKeyAssignment');
    });

    it('Has updatePreview function', () => {
        assert.ok(jsCode.includes('function updatePreview'), 'Must define updatePreview');
    });

    it('Has loadExistingConfig function', () => {
        assert.ok(jsCode.includes('function loadExistingConfig'), 'Must define loadExistingConfig');
    });

    it('Escapes HTML in output', () => {
        assert.ok(jsCode.includes('escHtml') || jsCode.includes('textContent'), 'Must sanitize output');
    });

    it('Defines ERGO_ZONES constant', () => {
        assert.ok(jsCode.includes('ERGO_ZONES'), 'Must define ERGO_ZONES');
        assert.ok(jsCode.includes("left:") || jsCode.includes('left :'), 'ERGO_ZONES must have left zone');
        assert.ok(jsCode.includes("right:") || jsCode.includes('right :'), 'ERGO_ZONES must have right zone');
    });

    it('Defines autoAssignKeys function', () => {
        assert.ok(jsCode.includes('function autoAssignKeys'), 'Must define autoAssignKeys');
    });

    it('Defines resetAllKeys function', () => {
        assert.ok(jsCode.includes('function resetAllKeys'), 'Must define resetAllKeys');
    });

    it('Defines isInErgoZone function', () => {
        assert.ok(jsCode.includes('function isInErgoZone'), 'Must define isInErgoZone');
    });

    it('Has listeningCell state for click-to-assign', () => {
        assert.ok(jsCode.includes('listeningCell'), 'Must track listeningCell for key assignment');
    });

    it('Has keydown listener for key assignment', () => {
        assert.ok(jsCode.includes('onKeyAssignKeyDown'), 'Must have onKeyAssignKeyDown handler');
    });

    it('Defines startListening and stopListening functions', () => {
        assert.ok(jsCode.includes('function startListening'), 'Must define startListening');
        assert.ok(jsCode.includes('function stopListening'), 'Must define stopListening');
    });
});

describe('Config Editor — Key Assignment Buttons', () => {

    let html;

    it('Has Reset All Keys button', () => {
        html = fs.readFileSync(EDITOR_HTML_PATH, 'utf-8');
        assert.ok(html.includes('id="btnResetKeys"'), 'Must have Reset All Keys button');
    });

    it('Has Auto-Assign Left Hand button', () => {
        assert.ok(html.includes('id="btnAutoLeft"'), 'Must have Auto-Assign Left Hand button');
    });

    it('Has Auto-Assign Right Hand button', () => {
        assert.ok(html.includes('id="btnAutoRight"'), 'Must have Auto-Assign Right Hand button');
    });

    it('Has CSS for listening state animation', () => {
        assert.ok(html.includes('key-listening'), 'Must have key-listening CSS class');
        assert.ok(html.includes('pulse-ring'), 'Must have pulse-ring animation');
    });
});
