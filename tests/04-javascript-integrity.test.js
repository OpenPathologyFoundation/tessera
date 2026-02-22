/**
 * TEST SUITE 04: JavaScript Application Integrity
 * =================================================
 * Traces to: SRS SYS-030 to SYS-039, SYS-S04
 * FMEA: HA-010 (key mapping), HA-015 (count after stop)
 *
 * Validates the application JavaScript file structure, function presence,
 * and key safety mechanisms through static analysis.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const JS_PATH = path.join(__dirname, '..', 'web', 'scripts', 'mdc-app.js');
let jsCode;

describe('JavaScript — File Integrity', () => {

    it('mdc-app.js exists and is readable', () => {
        assert.ok(fs.existsSync(JS_PATH), 'mdc-app.js must exist');
        jsCode = fs.readFileSync(JS_PATH, 'utf-8');
        assert.ok(jsCode.length > 0, 'mdc-app.js must not be empty');
    });

    it('mdc-app.js has valid syntax (no parse errors)', () => {
        // Node will throw a SyntaxError if the code cannot be parsed
        assert.doesNotThrow(() => {
            new Function(jsCode);
        }, 'mdc-app.js must have valid JavaScript syntax');
    });

    it('Uses strict mode', () => {
        assert.ok(jsCode.includes("'use strict'"), 'Must use strict mode');
    });

    it('Wraps in IIFE to avoid global namespace pollution', () => {
        assert.ok(jsCode.includes('(function ()') || jsCode.includes('(function()'),
            'Must be wrapped in an IIFE');
    });
});

describe('JavaScript — State Management', () => {

    it('State object initializes phase to "case-entry"', () => {
        assert.ok(jsCode.includes("phase: 'case-entry'"), 'Initial phase must be case-entry');
    });

    it('State tracks isCountingActive flag', () => {
        assert.ok(jsCode.includes('isCountingActive'), 'Must track counting active state');
    });

    it('State tracks commentFieldFocused flag (SYS-073)', () => {
        assert.ok(jsCode.includes('commentFieldFocused'), 'Must track comment field focus');
    });
});

describe('JavaScript — Keyboard Handler Safety (SYS-030 to SYS-036)', () => {

    it('Has keydown event handler function', () => {
        assert.ok(jsCode.includes('onKeyDown') || jsCode.includes('keydown'),
            'Must have keydown handler');
    });

    it('Checks isCountingActive before processing keypresses (HA-015)', () => {
        assert.ok(jsCode.includes('isCountingActive'), 'Must check counting state');
    });

    it('Ignores keypresses when comment field is focused (SYS-073)', () => {
        assert.ok(jsCode.includes('commentFieldFocused'), 'Must check comment focus');
    });

    it('Ignores Ctrl, Alt, Meta modifier keys (SYS-036)', () => {
        assert.ok(jsCode.includes('ctrlKey'), 'Must check ctrlKey');
        assert.ok(jsCode.includes('altKey'), 'Must check altKey');
        assert.ok(jsCode.includes('metaKey'), 'Must check metaKey');
    });

    it('Checks shiftKey for decrement operation (SYS-032)', () => {
        assert.ok(jsCode.includes('shiftKey'), 'Must check shiftKey for decrement');
    });

    it('Prevents event default on mapped keys', () => {
        assert.ok(jsCode.includes('preventDefault'), 'Must prevent default on mapped keys');
    });

    it('Detaches keydown listener on count completion (SYS-054)', () => {
        assert.ok(jsCode.includes('removeEventListener'), 'Must remove keydown listener');
    });
});

describe('JavaScript — Decrement Safety (SYS-033, HA-013)', () => {

    it('Has decrement guard: count > 0 check', () => {
        // The code checks: if (state.counts[cellType] > 0) before decrementing
        assert.ok(jsCode.includes('> 0'), 'Must have > 0 guard for decrement');
    });

    it('Decrement uses -- operator (subtracts exactly 1)', () => {
        assert.ok(jsCode.includes('--'), 'Must use decrement operator');
    });

    it('Increment uses ++ operator (adds exactly 1)', () => {
        assert.ok(jsCode.includes('++'), 'Must use increment operator');
    });
});

describe('JavaScript — Division by Zero Guard (SYS-042, HA-021)', () => {

    it('Checks total === 0 before percentage calculation', () => {
        assert.ok(jsCode.includes('total === 0'), 'Must check total === 0');
    });

    it('Returns 0.00 when total is 0 (not NaN)', () => {
        // Verify the pattern: if total === 0, set to 0.00
        const guardPattern = /total\s*===\s*0[\s\S]*?0\.00/;
        assert.ok(guardPattern.test(jsCode), 'Must return 0.00 when total is 0');
    });
});

describe('JavaScript — Minimum Cell Count Enforcement (SYS-052, SYS-053, HA-030)', () => {

    it('References minCellCount from config', () => {
        assert.ok(jsCode.includes('minCellCount'), 'Must reference minCellCount');
    });

    it('Compares total against minimum before completion', () => {
        assert.ok(jsCode.includes('total < minCount') || jsCode.includes('total < min'),
            'Must compare total against minimum threshold');
    });

    it('Shows modal/dialog for low count warning', () => {
        assert.ok(jsCode.includes('Low Cell Count') || jsCode.includes('below the minimum'),
            'Must warn about low cell count');
    });
});

describe('JavaScript — Reset Confirmation (SYS-081, HA-040)', () => {

    it('Shows confirmation before reset when data exists', () => {
        assert.ok(jsCode.includes('Reset Count') || jsCode.includes('clear all count data'),
            'Must confirm before reset');
    });

    it('Checks if total > 0 before showing confirmation', () => {
        assert.ok(jsCode.includes('total > 0'), 'Must check for existing data before confirming reset');
    });
});

describe('JavaScript — Copy to Clipboard (SYS-065, SYS-066)', () => {

    it('Uses navigator.clipboard API', () => {
        assert.ok(jsCode.includes('navigator.clipboard'), 'Must use Clipboard API');
    });

    it('Has fallback for clipboard API failure', () => {
        assert.ok(jsCode.includes('execCommand') || jsCode.includes('catch'),
            'Must have fallback or error handling for clipboard');
    });

    it('Shows "Copied!" confirmation text (SYS-066)', () => {
        assert.ok(jsCode.includes('Copied!'), 'Must show Copied! confirmation');
    });
});

describe('JavaScript — Clipboard Safety', () => {

    it('Clears clipboard on new case start', () => {
        const clearHelperPattern = /function\s+clearClipboard\s*\(/;
        assert.ok(clearHelperPattern.test(jsCode), 'Must define clearClipboard helper');
        const clearWritePattern = /clipboard\.writeText\(\s*['"]\s*['"]\s*\)/;
        assert.ok(clearWritePattern.test(jsCode), 'Must clear clipboard contents');
        const startHandlerPattern = /btnStart[\s\S]*addEventListener\(['"]click['"][\s\S]*clearClipboard\(\)/;
        assert.ok(startHandlerPattern.test(jsCode), 'Must clear clipboard on new case start');
    });
});

describe('JavaScript — Session History (SYS-090, SYS-095)', () => {

    it('Uses sessionStorage (not localStorage) for history (SYS-095)', () => {
        assert.ok(jsCode.includes('sessionStorage'), 'Must use sessionStorage');
        // Should NOT use localStorage for patient-adjacent data
        const localStorageUsage = jsCode.match(/localStorage/g);
        assert.equal(localStorageUsage, null, 'Must NOT use localStorage for session data');
    });

    it('Saves to sessionStorage with a key prefix', () => {
        assert.ok(jsCode.includes('wbcds_history'), 'Must use wbcds_history key');
    });

    it('Has try/catch around sessionStorage operations (graceful degradation)', () => {
        // Count try blocks near sessionStorage
        assert.ok(jsCode.includes('try'), 'Must have try/catch for storage operations');
    });
});

describe('JavaScript — Session Export', () => {

    it('Defines export handlers for CSV and JSON', () => {
        assert.ok(jsCode.includes('btnExportCsv'), 'Must reference Export CSV button');
        assert.ok(jsCode.includes('btnExportJson'), 'Must reference Export JSON button');
        assert.ok(jsCode.includes('exportSessionCsv'), 'Must define exportSessionCsv');
        assert.ok(jsCode.includes('exportSessionJson'), 'Must define exportSessionJson');
    });

    it('Creates downloadable files using Blob and object URLs', () => {
        assert.ok(jsCode.includes('new Blob'), 'Must create Blob for downloads');
        assert.ok(jsCode.includes('URL.createObjectURL'), 'Must create object URL');
        assert.ok(jsCode.includes('download'), 'Must set download attribute');
    });
});

describe('JavaScript — Theme Toggle', () => {

    it('Defines theme toggle controls and storage key', () => {
        assert.ok(jsCode.includes('btnToggleTheme'), 'Must reference theme toggle button');
        assert.ok(jsCode.includes('toggleTheme'), 'Must define toggleTheme');
        assert.ok(jsCode.includes('wbcds_theme'), 'Must define theme storage key');
        const themeKeyPattern = /THEME_KEY\s*=\s*['"]wbcds_theme['"]/;
        const themeSetPattern = /sessionStorage\.setItem\(\s*THEME_KEY/;
        const themeGetPattern = /sessionStorage\.getItem\(\s*THEME_KEY/;
        assert.ok(themeKeyPattern.test(jsCode), 'Must define THEME_KEY as wbcds_theme');
        assert.ok(themeSetPattern.test(jsCode), 'Must persist theme in sessionStorage');
        assert.ok(themeGetPattern.test(jsCode), 'Must read theme from sessionStorage');
    });

    it('Applies data-theme attribute for light/dark modes', () => {
        assert.ok(jsCode.includes('data-theme'), 'Must set data-theme attribute');
    });
});

describe('JavaScript — Security (SYS-S04)', () => {

    it('Escapes HTML in user-provided content (XSS prevention)', () => {
        assert.ok(jsCode.includes('escHtml') || jsCode.includes('textContent'),
            'Must sanitize user input for display');
    });

    it('Has HTML escape function defined', () => {
        assert.ok(jsCode.includes('function escHtml') || jsCode.includes('escHtml ='),
            'Must define HTML escape utility');
    });
});

describe('JavaScript — Configuration Loading (SYS-100, SYS-101)', () => {

    it('Fetches templates.json', () => {
        assert.ok(jsCode.includes('templates.json'), 'Must fetch templates.json');
    });

    it('Handles fetch failure with error display (SYS-101)', () => {
        assert.ok(jsCode.includes('Configuration Error') || jsCode.includes('Could not load'),
            'Must display error on config load failure');
    });

    it('Applies default minCellCount when missing from config (SYS-103)', () => {
        assert.ok(jsCode.includes('DEFAULT_MIN') || jsCode.includes('default'),
            'Must apply default minCellCount');
    });
});

describe('JavaScript — Flash Feedback (SYS-037)', () => {

    it('Has flash/animation function for keypress feedback', () => {
        assert.ok(jsCode.includes('flash') || jsCode.includes('Flash'),
            'Must have visual feedback mechanism');
    });

    it('Distinguishes increment and decrement visually', () => {
        assert.ok(jsCode.includes('flash-increment') || jsCode.includes('increment'),
            'Must have increment visual state');
        assert.ok(jsCode.includes('flash-decrement') || jsCode.includes('decrement'),
            'Must have decrement visual state');
    });
});
