/**
 * TEST SUITE 05: End-to-End Data Integrity
 * ==========================================
 * Traces to: VV-001 Section 3.2.1 — End-to-End Data Integrity Test
 * FMEA: HA-020 (calculation error), HA-024 (output/table mismatch)
 *
 * Simulates a complete counting workflow from start to output and verifies
 * that data flows correctly through every stage.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Load config
const CONFIG_PATH = path.join(__dirname, '..', 'web', 'settings', 'templates.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// Mirror the application's calculation logic exactly
function simulateCount(specimenType, keypresses, caseNumber, comments) {
    const specConfig = config.find(s => s.specimenType === specimenType);
    const outCodes = specConfig.outCodes;

    // Initialize counts to zero
    const counts = {};
    Object.values(outCodes).forEach(ct => { counts[ct] = 0; });

    // Process keypresses
    for (const kp of keypresses) {
        const key = kp.key.toUpperCase();
        if (!outCodes[key]) continue;
        const cellType = outCodes[key];
        if (kp.shift) {
            if (counts[cellType] > 0) counts[cellType]--;
        } else {
            counts[cellType]++;
        }
    }

    // Calculate total
    const total = Object.values(counts).reduce((s, v) => s + v, 0);

    // Calculate percentages (same algorithm as mdc-app.js)
    const percentages = {};
    for (const [ct, count] of Object.entries(counts)) {
        if (total === 0) {
            percentages[ct] = 0.00;
        } else {
            percentages[ct] = parseFloat(((count / total) * 100).toFixed(2));
        }
    }

    // Generate output for each template (same as mdc-app.js finalizeCount)
    const outputs = {};
    specConfig.templates.forEach(tpl => {
        let text = tpl.outSentence;
        text = text.replace(/\{\{total\}\}/g, String(total));
        text = text.replace(/\{\{caseNumber\}\}/g, caseNumber);
        text = text.replace(/\{\{comments\}\}/g, comments || '');
        Object.keys(outCodes).forEach(k => {
            const ct = outCodes[k];
            const rounded = Math.round(percentages[ct]);
            text = text.replace(new RegExp('\\{\\{' + ct + '\\}\\}', 'g'), String(rounded));
        });
        outputs[tpl.tplCode] = text;
    });

    return { counts, total, percentages, outputs };
}

describe('End-to-End — VV-E2E-001: Standard BM 100-Cell Differential', () => {

    const keypresses = [];
    // Simulate: blast=3, pro=8, gran=55, eryth=12, baso=2, eos=4, plasma=3, lymph=10, mono=3
    for (let i = 0; i < 3; i++) keypresses.push({ key: 'A', shift: false });
    for (let i = 0; i < 8; i++) keypresses.push({ key: 'S', shift: false });
    for (let i = 0; i < 55; i++) keypresses.push({ key: 'D', shift: false });
    for (let i = 0; i < 12; i++) keypresses.push({ key: 'F', shift: false });
    for (let i = 0; i < 2; i++) keypresses.push({ key: 'Z', shift: false });
    for (let i = 0; i < 4; i++) keypresses.push({ key: 'X', shift: false });
    for (let i = 0; i < 3; i++) keypresses.push({ key: 'C', shift: false });
    for (let i = 0; i < 10; i++) keypresses.push({ key: 'V', shift: false });
    for (let i = 0; i < 3; i++) keypresses.push({ key: 'B', shift: false });

    const result = simulateCount('bm', keypresses, 'VV-E2E-001', 'Toxic granulation noted.');

    it('Checkpoint 1: All counts correct', () => {
        assert.equal(result.counts.blast, 3);
        assert.equal(result.counts.pro, 8);
        assert.equal(result.counts.gran, 55);
        assert.equal(result.counts.eryth, 12);
        assert.equal(result.counts.baso, 2);
        assert.equal(result.counts.eos, 4);
        assert.equal(result.counts.plasma, 3);
        assert.equal(result.counts.lymph, 10);
        assert.equal(result.counts.mono, 3);
    });

    it('Checkpoint 1: Total = 100', () => {
        assert.equal(result.total, 100);
    });

    it('Checkpoint 1: Percentages are correct', () => {
        assert.equal(result.percentages.blast, 3.00);
        assert.equal(result.percentages.pro, 8.00);
        assert.equal(result.percentages.gran, 55.00);
        assert.equal(result.percentages.eryth, 12.00);
        assert.equal(result.percentages.baso, 2.00);
        assert.equal(result.percentages.eos, 4.00);
        assert.equal(result.percentages.plasma, 3.00);
        assert.equal(result.percentages.lymph, 10.00);
        assert.equal(result.percentages.mono, 3.00);
    });

    it('Checkpoint 1: Percentage sum = 100.00', () => {
        const sum = Object.values(result.percentages).reduce((s, v) => s + v, 0);
        assert.equal(sum, 100.00);
    });

    it('Checkpoint 2: Yale SOM output contains total', () => {
        assert.ok(result.outputs.ysm.includes('100'), 'Yale SOM must contain total');
    });

    it('Checkpoint 2: Yale SOM output contains cell percentages', () => {
        assert.ok(result.outputs.ysm.includes('3% blasts'), 'Must contain blast %');
        assert.ok(result.outputs.ysm.includes('55% maturing'), 'Must contain gran %');
    });

    it('Checkpoint 2: Precipio DX output is populated', () => {
        assert.ok(result.outputs.pdx.includes('100'), 'PDX must contain total');
        assert.ok(result.outputs.pdx.length > 100, 'PDX output must be substantive');
    });

    it('Checkpoint 2: MGH output is populated', () => {
        assert.ok(result.outputs.mgh.includes('100'), 'MGH must contain total');
    });

    it('Checkpoint 2: No unresolved placeholders in any output', () => {
        for (const [code, text] of Object.entries(result.outputs)) {
            const unresolved = text.match(/\{\{[^}]+\}\}/g);
            assert.equal(unresolved, null, `${code}: has unresolved: ${JSON.stringify(unresolved)}`);
        }
    });
});

describe('End-to-End — Undo/Correction Flow', () => {

    it('Shift+key correctly decrements and recalculates', () => {
        const keypresses = [];
        // Count 10 blasts
        for (let i = 0; i < 10; i++) keypresses.push({ key: 'A', shift: false });
        // Count 10 pros
        for (let i = 0; i < 10; i++) keypresses.push({ key: 'S', shift: false });
        // Oops, undo 5 blasts
        for (let i = 0; i < 5; i++) keypresses.push({ key: 'A', shift: true });

        const result = simulateCount('bm', keypresses, 'UNDO-TEST', '');

        assert.equal(result.counts.blast, 5, 'blast should be 10-5=5');
        assert.equal(result.counts.pro, 10, 'pro should be unchanged');
        assert.equal(result.total, 15);
        assert.equal(result.percentages.blast, 33.33);
        assert.equal(result.percentages.pro, 66.67);
    });

    it('Cannot undo below zero', () => {
        const keypresses = [];
        // Count 2 blasts
        keypresses.push({ key: 'A', shift: false });
        keypresses.push({ key: 'A', shift: false });
        // Try to undo 5 times
        for (let i = 0; i < 5; i++) keypresses.push({ key: 'A', shift: true });

        const result = simulateCount('bm', keypresses, 'FLOOR-TEST', '');

        assert.equal(result.counts.blast, 0, 'blast must floor at 0');
        assert.equal(result.total, 0);
    });

    it('Undo then re-count returns to correct state', () => {
        const keypresses = [];
        // Count blast=5, pro=5 (total=10)
        for (let i = 0; i < 5; i++) keypresses.push({ key: 'A', shift: false });
        for (let i = 0; i < 5; i++) keypresses.push({ key: 'S', shift: false });
        // Undo all blasts
        for (let i = 0; i < 5; i++) keypresses.push({ key: 'A', shift: true });
        // Re-count 5 blasts
        for (let i = 0; i < 5; i++) keypresses.push({ key: 'A', shift: false });

        const result = simulateCount('bm', keypresses, 'RECOUNT-TEST', '');

        assert.equal(result.counts.blast, 5);
        assert.equal(result.counts.pro, 5);
        assert.equal(result.total, 10);
        assert.equal(result.percentages.blast, 50.00);
        assert.equal(result.percentages.pro, 50.00);
    });
});

describe('End-to-End — Peripheral Blood Workflow', () => {

    it('PB differential produces correct output', () => {
        const keypresses = [];
        // poly=60, band=5, lymph=25, mono=5, eos=3, baso=1, pro=0, blast=0, other=1
        for (let i = 0; i < 60; i++) keypresses.push({ key: 'A', shift: false });
        for (let i = 0; i < 5; i++) keypresses.push({ key: 'S', shift: false });
        for (let i = 0; i < 25; i++) keypresses.push({ key: 'D', shift: false });
        for (let i = 0; i < 5; i++) keypresses.push({ key: 'F', shift: false });
        for (let i = 0; i < 3; i++) keypresses.push({ key: 'Z', shift: false });
        for (let i = 0; i < 1; i++) keypresses.push({ key: 'X', shift: false });
        for (let i = 0; i < 1; i++) keypresses.push({ key: 'B', shift: false });

        const result = simulateCount('pb', keypresses, 'PB-E2E-001', '');

        assert.equal(result.total, 100);
        assert.equal(result.counts.poly, 60);
        assert.equal(result.counts.band, 5);
        assert.equal(result.counts.lymph, 25);
        assert.equal(result.percentages.poly, 60.00);

        // Check MGH PB output
        assert.ok(result.outputs.mgh.includes('100-cell'), 'Must contain total');
        assert.ok(result.outputs.mgh.includes('60% mature neutrophils'), 'Must contain poly %');
        assert.ok(result.outputs.mgh.includes('peripheral blood'), 'Must mention peripheral blood');
    });
});

describe('End-to-End — Unmapped Key Handling (SYS-035)', () => {

    it('Unmapped keys are silently ignored', () => {
        const keypresses = [
            { key: 'A', shift: false },  // mapped
            { key: 'E', shift: false },  // NOT mapped
            { key: 'G', shift: false },  // NOT mapped
            { key: 'A', shift: false },  // mapped
        ];

        const result = simulateCount('bm', keypresses, 'UNMAPPED-TEST', '');

        assert.equal(result.counts.blast, 2, 'Only mapped keys should count');
        assert.equal(result.total, 2);
    });
});

describe('End-to-End — Edge Cases', () => {

    it('Single cell count produces 100%', () => {
        const result = simulateCount('bm', [{ key: 'A', shift: false }], 'SINGLE', '');
        assert.equal(result.total, 1);
        assert.equal(result.percentages.blast, 100.00);
    });

    it('Large count (500 cells) produces correct percentages', () => {
        const keypresses = [];
        for (let i = 0; i < 300; i++) keypresses.push({ key: 'D', shift: false }); // gran
        for (let i = 0; i < 100; i++) keypresses.push({ key: 'F', shift: false }); // eryth
        for (let i = 0; i < 50; i++) keypresses.push({ key: 'V', shift: false });  // lymph
        for (let i = 0; i < 50; i++) keypresses.push({ key: 'S', shift: false });  // pro

        const result = simulateCount('bm', keypresses, 'LARGE-500', '');

        assert.equal(result.total, 500);
        assert.equal(result.percentages.gran, 60.00);
        assert.equal(result.percentages.eryth, 20.00);
        assert.equal(result.percentages.lymph, 10.00);
        assert.equal(result.percentages.pro, 10.00);
    });

    it('All zeros with undo attempts produces safe output', () => {
        const keypresses = [
            { key: 'A', shift: true },
            { key: 'S', shift: true },
        ];

        const result = simulateCount('bm', keypresses, 'ZERO-UNDO', '');

        assert.equal(result.total, 0);
        for (const pct of Object.values(result.percentages)) {
            assert.equal(pct, 0.00);
            assert.ok(!isNaN(pct));
            assert.ok(isFinite(pct));
        }
    });
});
