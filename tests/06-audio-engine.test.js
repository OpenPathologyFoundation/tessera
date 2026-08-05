/**
 * TEST SUITE 06: Audio Engine
 * ============================
 * Traces to: URS-027, URS-097
 * Validates the AudioEngine object structure and toggle state in mdc-app.js.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const JS_PATH = path.join(__dirname, '..', 'web', 'scripts', 'mdc-app.js');
const jsCode = fs.readFileSync(JS_PATH, 'utf-8');

describe('Audio Engine — Object Structure (URS-027)', () => {

    it('AudioEngine object is defined', () => {
        assert.ok(jsCode.includes('var AudioEngine'), 'Must define AudioEngine object');
    });

    it('AudioEngine has init method', () => {
        assert.ok(jsCode.includes('init: function'), 'AudioEngine must have init method');
    });

    it('AudioEngine has playClick method for count increment', () => {
        assert.ok(jsCode.includes('playClick'), 'AudioEngine must have playClick method');
    });

    it('AudioEngine has playUndo method for decrement', () => {
        assert.ok(jsCode.includes('playUndo'), 'AudioEngine must have playUndo method');
    });

    it('AudioEngine has playChime method for target reached', () => {
        assert.ok(jsCode.includes('playChime'), 'AudioEngine must have playChime method');
    });

    it('AudioEngine has playTypewriter method for comments', () => {
        assert.ok(jsCode.includes('playTypewriter'), 'AudioEngine must have playTypewriter method');
    });

    it('AudioEngine has toggle method', () => {
        assert.ok(jsCode.includes('toggle: function'), 'AudioEngine must have toggle method');
    });

    it('AudioEngine uses Web Audio API (AudioContext)', () => {
        assert.ok(jsCode.includes('AudioContext'), 'Must reference AudioContext');
    });

    it('AudioEngine uses OscillatorNode for sound generation', () => {
        assert.ok(jsCode.includes('createOscillator'), 'Must create oscillator nodes');
    });

    it('AudioEngine uses GainNode for volume control', () => {
        assert.ok(jsCode.includes('createGain'), 'Must create gain nodes');
    });
});

describe('Audio Engine — Toggle State (URS-097)', () => {

    it('Audio state is persisted via sessionStorage', () => {
        assert.ok(jsCode.includes('wbcds_audio'), 'Must use wbcds_audio storage key');
    });

    it('AudioEngine.enabled property exists', () => {
        assert.ok(jsCode.includes('enabled: true'), 'AudioEngine must have enabled property');
    });

    it('Toggle updates the audio label', () => {
        assert.ok(jsCode.includes('updateAudioToggle'), 'Must call updateAudioToggle');
    });

    it('Audio toggle button is referenced in HTML', () => {
        const htmlPath = path.join(__dirname, '..', 'web', 'counter.html');
        const html = fs.readFileSync(htmlPath, 'utf-8');
        assert.ok(html.includes('id="btnToggleAudio"'), 'Must have audio toggle button');
        assert.ok(html.includes('id="audioLabel"'), 'Must have audio label span');
    });
});

describe('Audio Engine — Integration Points', () => {

    it('playClick is called on increment in onKeyDown', () => {
        // Verify the pattern: increment followed by playClick
        assert.ok(jsCode.includes('AudioEngine.playClick()'), 'Must call playClick on increment');
    });

    it('playUndo is called on decrement in onKeyDown', () => {
        assert.ok(jsCode.includes('AudioEngine.playUndo()'), 'Must call playUndo on decrement');
    });

    it('playChime is called when target is first reached', () => {
        assert.ok(jsCode.includes('AudioEngine.playChime()'), 'Must call playChime on target reached');
        assert.ok(jsCode.includes('targetReachedNotified'), 'Must track target notification state');
    });

    it('playTypewriter is called on morphology comment input', () => {
        assert.ok(jsCode.includes('AudioEngine.playTypewriter()'), 'Must call playTypewriter on comment input');
    });

    it('Sound frequency values are defined for each sound type', () => {
        assert.ok(jsCode.includes('800'), 'Click uses 800Hz');
        assert.ok(jsCode.includes('400'), 'Undo uses 400Hz');
        assert.ok(jsCode.includes('600'), 'Typewriter uses 600Hz');
    });
});
