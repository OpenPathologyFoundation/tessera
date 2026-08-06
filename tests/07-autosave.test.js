/**
 * TEST SUITE 07: Autosave / Crash Recovery
 * ==========================================
 * Traces to: URS-085
 * Validates autosave state shape, save/load/clear functions.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const JS_PATH = path.join(__dirname, '..', 'web', 'scripts', 'mdc-app.js');
const jsCode = fs.readFileSync(JS_PATH, 'utf-8');

describe('Autosave — Function Presence (URS-085)', () => {

    it('VV-SAV-001: saveAutosaveState function is defined', () => {
        assert.ok(jsCode.includes('function saveAutosaveState'), 'Must define saveAutosaveState');
    });

    it('VV-SAV-002: loadAutosaveState function is defined', () => {
        assert.ok(jsCode.includes('function loadAutosaveState'), 'Must define loadAutosaveState');
    });

    it('VV-SAV-003: clearAutosaveState function is defined', () => {
        assert.ok(jsCode.includes('function clearAutosaveState'), 'Must define clearAutosaveState');
    });

    it('VV-SAV-004: showRecoveryModal function is defined', () => {
        assert.ok(jsCode.includes('function showRecoveryModal'), 'Must define showRecoveryModal');
    });

    it('VV-SAV-005: restoreAutosaveState function is defined', () => {
        assert.ok(jsCode.includes('function restoreAutosaveState'), 'Must define restoreAutosaveState');
    });
});

describe('Autosave — Storage Key', () => {

    it('VV-SAV-006: Uses localStorage with wbcds_autosave key', () => {
        assert.ok(jsCode.includes("AUTOSAVE_KEY = 'wbcds_autosave'"), 'Must define AUTOSAVE_KEY constant');
    });

    it('VV-SAV-007: Uses localStorage (not sessionStorage) for autosave', () => {
        assert.ok(jsCode.includes('localStorage.setItem(AUTOSAVE_KEY'), 'Must write to localStorage');
        assert.ok(jsCode.includes('localStorage.getItem(AUTOSAVE_KEY'), 'Must read from localStorage');
        assert.ok(jsCode.includes('localStorage.removeItem(AUTOSAVE_KEY'), 'Must clear from localStorage');
    });
});

describe('Autosave — State Shape', () => {

    it('VV-SAV-008: Saves caseNumber in autosave state', () => {
        assert.ok(jsCode.includes('caseNumber: state.caseNumber'), 'Autosave must include caseNumber');
    });

    it('VV-SAV-009: Saves specimenType in autosave state', () => {
        assert.ok(jsCode.includes('specimenType: state.specimenType'), 'Autosave must include specimenType');
    });

    it('VV-SAV-010: Saves counts in autosave state', () => {
        // The pattern: counts: Object.assign({}, state.counts)
        const countsSave = /counts:\s*Object\.assign\(\{\},\s*state\.counts\)/;
        assert.ok(countsSave.test(jsCode), 'Autosave must include counts copy');
    });

    it('VV-SAV-011: Saves timestamp in autosave state', () => {
        assert.ok(jsCode.includes('timestamp:'), 'Autosave must include timestamp');
    });

    it('VV-SAV-012: Saves phase in autosave state', () => {
        assert.ok(jsCode.includes("phase: 'counting'"), 'Autosave must include phase');
    });

    it('VV-SAV-013: Saves morphologyComments in autosave state', () => {
        assert.ok(jsCode.includes('morphologyComments:'), 'Autosave must include morphologyComments');
    });
});

describe('Autosave — Integration', () => {

    it('VV-SAV-014: Autosave is called after keypress in onKeyDown', () => {
        assert.ok(jsCode.includes('saveAutosaveState()'), 'Must call saveAutosaveState after keypress');
    });

    it('VV-SAV-015: Autosave is cleared on finalizeCount', () => {
        const finalizePattern = /function finalizeCount[\s\S]*?clearAutosaveState/;
        assert.ok(finalizePattern.test(jsCode), 'Must clear autosave on finalize');
    });

    it('VV-SAV-016: Autosave is cleared on resetToStart', () => {
        const resetPattern = /function resetToStart[\s\S]*?clearAutosaveState/;
        assert.ok(resetPattern.test(jsCode), 'Must clear autosave on reset');
    });

    it('VV-SAV-017: Recovery check happens during init', () => {
        assert.ok(jsCode.includes('loadAutosaveState()'), 'Must check for autosave on init');
        assert.ok(jsCode.includes('showRecoveryModal'), 'Must show recovery modal if state found');
    });

    it('VV-SAV-018: Recovery modal offers Restore and Discard options', () => {
        assert.ok(jsCode.includes('Restore Count'), 'Must offer Restore option');
        assert.ok(jsCode.includes('Discard'), 'Must offer Discard option');
    });
});
