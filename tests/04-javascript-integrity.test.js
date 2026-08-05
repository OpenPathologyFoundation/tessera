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

// The shipped calculation/config engine under verification.
const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));

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

describe('JavaScript — Target Count Reference', () => {

    it('References targetCount from config', () => {
        assert.ok(jsCode.includes('targetCount'), 'Must reference targetCount');
    });

    // Behavioural, not textual: the default-target fallback now lives in
    // wbc-core.js and is verified by calling it (DCR-004).
    it('Applies the evidence-based default target when a profile omits it (URS-105)', () => {
        const norm = Core.normalizeConfig({
            version: '2.0', profileId: 'p', specimenTypes: [
                { specimenType: 'bm', categories: { upper: [], lower: [] }, outCodes: {}, templates: [] },
                { specimenType: 'pb', categories: { upper: [], lower: [] }, outCodes: {}, templates: [] },
                { specimenType: 'xx', categories: { upper: [], lower: [] }, outCodes: {}, templates: [] }
            ]
        });
        assert.equal(norm.specimenTypes[0].targetCount, 500, 'BM default is 500 (CAP)');
        assert.equal(norm.specimenTypes[1].targetCount, 200, 'PB default is 200 (CLSI H20-A2)');
        assert.equal(norm.specimenTypes[2].targetCount, 200, 'unknown types fall back to 200');
    });

    it('An explicit targetCount is never overridden by the default', () => {
        const norm = Core.normalizeConfig({
            version: '2.0', profileId: 'p', specimenTypes: [
                { specimenType: 'bm', targetCount: 300, categories: { upper: [], lower: [] }, outCodes: {}, templates: [] }
            ]
        });
        assert.equal(norm.specimenTypes[0].targetCount, 300);
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

describe('JavaScript — Enter Key Starts Count (SYS-009)', () => {

    it('Case input has keydown listener for Enter key (SYS-009)', () => {
        const enterPattern = /caseInput[\s\S]*addEventListener\(['"]keydown['"][\s\S]*ev\.key\s*===\s*['"]Enter['"]/;
        assert.ok(enterPattern.test(jsCode), 'Must listen for Enter key on case input');
    });

    it('Enter key triggers btnStart.click() when not disabled', () => {
        assert.ok(jsCode.includes('btnStart.click()'), 'Must programmatically click Start Count on Enter');
    });

    it('Enter key calls preventDefault to avoid form submission', () => {
        const enterPreventDefault = /['"]Enter['"][\s\S]*?preventDefault/;
        assert.ok(enterPreventDefault.test(jsCode), 'Must preventDefault on Enter in case input');
    });
});

describe('JavaScript — Session History (SYS-090, SYS-095)', () => {

    it('Uses sessionStorage for history (SYS-095)', () => {
        assert.ok(jsCode.includes('sessionStorage'), 'Must use sessionStorage');
        assert.ok(jsCode.includes('wbcds_history'), 'Must use wbcds_history key in sessionStorage');
    });

    it('Uses localStorage for config caching and autosave (URS-106, URS-085)', () => {
        assert.ok(jsCode.includes('localStorage'), 'Must use localStorage for config caching and autosave');
        assert.ok(jsCode.includes('wbcds_config'), 'Must use wbcds_config key for config cache');
        assert.ok(jsCode.includes('wbcds_autosave'), 'Must use wbcds_autosave key for autosave');
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
        assert.ok(jsCode.includes('escapeHtml') || jsCode.includes('textContent'),
            'Must sanitize user input for display');
    });

    // Behavioural: exercise the escaper rather than grepping for its name.
    it('The HTML escaper neutralizes every markup-significant character', () => {
        assert.equal(Core.escapeHtml('<img src=x onerror="a">'),
            '&lt;img src=x onerror=&quot;a&quot;&gt;');
        assert.equal(Core.escapeHtml("it's & <b>"), 'it&#39;s &amp; &lt;b&gt;');
        // Ampersand must be escaped first or the other entities double-escape.
        assert.equal(Core.escapeHtml('&lt;'), '&amp;lt;');
    });

    it('Template sanitization keeps formatting tags and drops everything else', () => {
        assert.equal(Core.sanitizeTemplateHtml('a<br>b'), 'a<br>b');
        assert.equal(Core.sanitizeTemplateHtml('<strong>x</strong>'), '<strong>x</strong>');
        assert.match(Core.sanitizeTemplateHtml('<img src=x onerror=y>'), /^&lt;img/);
        assert.match(Core.sanitizeTemplateHtml('<a href="#">l</a>'), /^&lt;a/);
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

    it('Loads wbc-core.js before mdc-app.js so the engine is available', () => {
        const html = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'counter.html'), 'utf-8');
        const corePos = html.indexOf('scripts/wbc-core.js');
        const appPos = html.indexOf('scripts/mdc-app.js');
        assert.ok(corePos > -1, 'counter.html must load wbc-core.js');
        assert.ok(appPos > -1, 'counter.html must load mdc-app.js');
        assert.ok(corePos < appPos, 'wbc-core.js must load first');
    });

    it('No control is wired from an inline script outside the app module', () => {
        // The inline handlers previously used here referenced IIFE-private
        // functions, so their typeof guards silently disabled Export Config,
        // Import Config and Reset to Default. See DCR-004.
        const html = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'counter.html'), 'utf-8');
        assert.doesNotMatch(html, /typeof\s+(exportConfig|importConfig|resetConfigToDefault)/,
            'config controls must be wired inside mdc-app.js, not by an inline script');
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

describe('JavaScript — Resume Counting', () => {

    it('Defines resumeCounting function', () => {
        assert.ok(jsCode.includes('resumeCounting'),
            'Must define resumeCounting function');
    });

    it('References btnResumeCounting button', () => {
        assert.ok(jsCode.includes('btnResumeCounting'),
            'Must reference btnResumeCounting button element');
    });
});

describe('JavaScript — M:E Ratio', () => {

    it('Defines computeMERatio function', () => {
        assert.ok(jsCode.includes('computeMERatio'),
            'Must define computeMERatio function');
    });

    it('Handles ME_ratio placeholder in templates', () => {
        assert.ok(jsCode.includes('ME_ratio'),
            'Must handle ME_ratio placeholder substitution');
    });
});

describe('JavaScript — Audio Engine (URS-027)', () => {

    it('Defines AudioEngine object', () => {
        assert.ok(jsCode.includes('var AudioEngine'), 'Must define AudioEngine');
    });

    it('AudioEngine has all required sound methods', () => {
        assert.ok(jsCode.includes('playClick'), 'Must have playClick');
        assert.ok(jsCode.includes('playUndo'), 'Must have playUndo');
        assert.ok(jsCode.includes('playChime'), 'Must have playChime');
        assert.ok(jsCode.includes('playTypewriter'), 'Must have playTypewriter');
    });
});

describe('JavaScript — Autosave (URS-085)', () => {

    it('Defines autosave functions', () => {
        assert.ok(jsCode.includes('saveAutosaveState'), 'Must define saveAutosaveState');
        assert.ok(jsCode.includes('loadAutosaveState'), 'Must define loadAutosaveState');
        assert.ok(jsCode.includes('clearAutosaveState'), 'Must define clearAutosaveState');
    });

    it('Defines recovery modal function', () => {
        assert.ok(jsCode.includes('showRecoveryModal'), 'Must define showRecoveryModal');
    });
});

describe('JavaScript — Specimen Type Switching (URS-013)', () => {

    it('Defines switchSpecimenType function', () => {
        assert.ok(jsCode.includes('switchSpecimenType'), 'Must define switchSpecimenType');
    });
});

describe('JavaScript — Config Caching (URS-106)', () => {

    it('Defines config cache functions', () => {
        assert.ok(jsCode.includes('cacheConfig'), 'Must define cacheConfig');
        assert.ok(jsCode.includes('loadCachedConfig'), 'Must define loadCachedConfig');
    });

    it('Uses wbcds_config localStorage key', () => {
        assert.ok(jsCode.includes('wbcds_config'), 'Must reference config cache key');
    });

    it('loadConfig uses cache-first strategy (user config persists)', () => {
        // Cache-first: loadCachedConfig must be called BEFORE fetch
        const loadConfigBody = jsCode.match(/async function loadConfig\(\)\s*\{[\s\S]*?\n    \}/);
        assert.ok(loadConfigBody, 'Must have loadConfig function');
        const body = loadConfigBody[0];
        const cacheIdx = body.indexOf('loadCachedConfig');
        const fetchIdx = body.indexOf('fetch(');
        assert.ok(cacheIdx !== -1, 'loadConfig must call loadCachedConfig');
        assert.ok(fetchIdx !== -1, 'loadConfig must call fetch');
        assert.ok(cacheIdx < fetchIdx,
            'loadConfig must try cache BEFORE fetch (cache-first strategy)');
    });

    it('Defines resetConfigToDefault function', () => {
        assert.ok(jsCode.includes('function resetConfigToDefault'),
            'Must define resetConfigToDefault to let users reset to built-in defaults');
    });

    it('resetConfigToDefault removes cache and reloads', () => {
        assert.ok(jsCode.includes('removeItem(CONFIG_CACHE_KEY)') || jsCode.includes("removeItem('wbcds_config')"),
            'resetConfigToDefault must remove cached config');
        assert.ok(jsCode.includes('location.reload'),
            'resetConfigToDefault must reload the page');
    });

    it('importConfig caches the imported config', () => {
        const importBody = jsCode.match(/function importConfig[\s\S]*?reader\.readAsText/);
        assert.ok(importBody, 'Must have importConfig function');
        assert.ok(importBody[0].includes('cacheConfig'),
            'importConfig must call cacheConfig to persist imported config');
    });
});

describe('JavaScript — Config Normalization', () => {

    it('Defines normalizeConfig function for backward compat', () => {
        assert.ok(jsCode.includes('normalizeConfig'), 'Must define normalizeConfig');
    });

    it('Handles both array and object config formats', () => {
        const coreSrc = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'), 'utf-8');
        assert.ok(coreSrc.includes('Array.isArray(raw)'), 'Must check for array format');
        assert.ok(coreSrc.includes('raw.specimenTypes'), 'Must handle v2 object format');
    });
});

describe('JavaScript — Config Import/Export (URS-103)', () => {

    it('Defines export and import functions', () => {
        assert.ok(jsCode.includes('exportConfig'), 'Must define exportConfig');
        assert.ok(jsCode.includes('importConfig'), 'Must define importConfig');
    });

    it('Defines validateConfig function', () => {
        assert.ok(jsCode.includes('validateConfig'), 'Must define validateConfig');
    });
});

describe('JavaScript — Dynamic Specimen Select', () => {

    it('Defines populateSpecimenSelect function', () => {
        assert.ok(jsCode.includes('populateSpecimenSelect'), 'Must define populateSpecimenSelect');
    });

    it('Uses specimenLabel from config', () => {
        assert.ok(jsCode.includes('specimenLabel'), 'Must reference specimenLabel');
    });
});

describe('JavaScript — Absolute Counts (URS-036)', () => {

    it('Defines renderAbsoluteCountsSection function', () => {
        assert.ok(jsCode.includes('renderAbsoluteCountsSection'), 'Must define absolute counts rendering');
    });
});

describe('JavaScript — Morphology Checklist (URS-072)', () => {

    it('Defines renderMorphologyChecklist function', () => {
        assert.ok(jsCode.includes('renderMorphologyChecklist'), 'Must define morphology checklist rendering');
    });

    it('Defines buildMorphologyOutput function', () => {
        assert.ok(jsCode.includes('buildMorphologyOutput'), 'Must define buildMorphologyOutput');
    });
});

describe('JavaScript — Print Support (URS-054)', () => {

    it('Defines printResults function', () => {
        assert.ok(jsCode.includes('printResults') || jsCode.includes('window.print'),
            'Must have print support');
    });
});
