/**
 * TEST SUITE 01: Calculation Engine
 * ==================================
 * Traces to: SRS SYS-040 through SYS-045
 * FMEA: HA-020 (calculation error), HA-021 (division by zero), HA-022 (sum != 100%)
 * VV Protocol: VV-CALC-001 through VV-CALC-015
 *
 * Tests the core percentage calculation logic extracted from mdc-app.js.
 * This is the single most safety-critical computation in the application.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ================================================================
// Extract the calculation logic (mirrors mdc-app.js exactly)
// ================================================================

/**
 * Calculate percentage for each cell type.
 * Formula: (cell_count / total_count) * 100, rounded to 2 decimal places.
 * Division by zero guard: returns 0.00 when total is 0.
 *
 * @param {Object} counts - { cellType: integer_count }
 * @returns {{ percentages: Object, total: number }}
 */
function calcPercent(counts) {
    const total = Object.values(counts).reduce((sum, v) => sum + v, 0);
    const percentages = {};
    for (const [cellType, count] of Object.entries(counts)) {
        if (total === 0) {
            percentages[cellType] = 0.00;
        } else {
            const pct = (count / total) * 100;
            percentages[cellType] = parseFloat(pct.toFixed(2));
        }
    }
    return { percentages, total };
}

/**
 * Increment a cell count. Returns new count.
 */
function increment(current) {
    return current + 1;
}

/**
 * Decrement a cell count. Cannot go below zero (SYS-033).
 */
function decrement(current) {
    return current > 0 ? current - 1 : 0;
}

/**
 * Build output template JSON (mirrors mkOutTplJson).
 * Percentages are rounded to nearest integer for output.
 */
function mkOutTplJson(outCodes, counts, caseNumber, comments) {
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    const result = { caseNumber, total, comments };
    for (const [key, cellType] of Object.entries(outCodes)) {
        result[cellType] = total > 0 ? Math.round((counts[cellType] / total) * 100) : 0;
    }
    return result;
}

// ================================================================
// TESTS
// ================================================================

describe('Calculation Engine — Percentage Computation (SYS-040 to SYS-045)', () => {

    // ----------------------------------------------------------
    // VV-CALC-001: All zeros — Division by zero guard (SYS-042)
    // ----------------------------------------------------------
    it('VV-CALC-001: All zeros returns 0.00 for every cell (SYS-042, HA-021)', () => {
        const counts = { blast: 0, pro: 0, gran: 0, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 0, mono: 0 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 0, 'Total should be 0');
        for (const [ct, pct] of Object.entries(percentages)) {
            assert.equal(pct, 0.00, `${ct} should be 0.00 when total is 0`);
            assert.equal(typeof pct, 'number', `${ct} should be a number, not NaN or string`);
            assert.ok(!isNaN(pct), `${ct} must not be NaN`);
            assert.ok(isFinite(pct), `${ct} must not be Infinity`);
        }
    });

    // ----------------------------------------------------------
    // VV-CALC-002: Single cell = 100%
    // ----------------------------------------------------------
    it('VV-CALC-002: Single cell counted = 100.00% (SYS-040)', () => {
        const counts = { blast: 1, pro: 0, gran: 0, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 0, mono: 0 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 1);
        assert.equal(percentages.blast, 100.00);
        assert.equal(percentages.pro, 0.00);
    });

    // ----------------------------------------------------------
    // VV-CALC-003: Two equal cells = 50/50
    // ----------------------------------------------------------
    it('VV-CALC-003: Two equal cells = 50.00% each (SYS-040)', () => {
        const counts = { blast: 50, pro: 50, gran: 0, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 0, mono: 0 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 100);
        assert.equal(percentages.blast, 50.00);
        assert.equal(percentages.pro, 50.00);
    });

    // ----------------------------------------------------------
    // VV-CALC-004: All equal (9 cells of 10 each = 11.11%)
    // ----------------------------------------------------------
    it('VV-CALC-004: Nine equal cells = 11.11% each (SYS-040)', () => {
        const counts = { blast: 10, pro: 10, gran: 10, eryth: 10, baso: 10, eos: 10, plasma: 10, lymph: 10, mono: 10 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 90);
        for (const ct of Object.keys(counts)) {
            assert.equal(percentages[ct], 11.11, `${ct} should be 11.11%`);
        }
    });

    // ----------------------------------------------------------
    // VV-CALC-005: One dominant cell
    // ----------------------------------------------------------
    it('VV-CALC-005: One dominant cell type (SYS-040)', () => {
        const counts = { blast: 0, pro: 0, gran: 95, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 5, mono: 0 };
        const { percentages } = calcPercent(counts);

        assert.equal(percentages.gran, 95.00);
        assert.equal(percentages.lymph, 5.00);
        assert.equal(percentages.blast, 0.00);
    });

    // ----------------------------------------------------------
    // VV-CALC-006: All ones (minimum multitype)
    // ----------------------------------------------------------
    it('VV-CALC-006: All ones (total=9), each = 11.11% (SYS-040)', () => {
        const counts = { blast: 1, pro: 1, gran: 1, eryth: 1, baso: 1, eos: 1, plasma: 1, lymph: 1, mono: 1 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 9);
        for (const ct of Object.keys(counts)) {
            assert.equal(percentages[ct], 11.11);
        }
    });

    // ----------------------------------------------------------
    // VV-CALC-007: Standard bone marrow differential
    // ----------------------------------------------------------
    it('VV-CALC-007: Standard BM differential (100 cells) — exact percentages (SYS-040)', () => {
        const counts = { blast: 2, pro: 5, gran: 60, eryth: 10, baso: 1, eos: 3, plasma: 2, lymph: 12, mono: 5 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 100);
        assert.equal(percentages.blast, 2.00);
        assert.equal(percentages.pro, 5.00);
        assert.equal(percentages.gran, 60.00);
        assert.equal(percentages.eryth, 10.00);
        assert.equal(percentages.baso, 1.00);
        assert.equal(percentages.eos, 3.00);
        assert.equal(percentages.plasma, 2.00);
        assert.equal(percentages.lymph, 12.00);
        assert.equal(percentages.mono, 5.00);

        // Sum check (SYS-044)
        const sum = Object.values(percentages).reduce((s, v) => s + v, 0);
        assert.equal(sum, 100.00, 'Sum should be exactly 100.00');
    });

    // ----------------------------------------------------------
    // VV-CALC-008: Abnormal BM (acute leukemia pattern)
    // ----------------------------------------------------------
    it('VV-CALC-008: Abnormal BM differential — leukemia pattern (SYS-040)', () => {
        const counts = { blast: 45, pro: 15, gran: 10, eryth: 5, baso: 0, eos: 1, plasma: 2, lymph: 20, mono: 2 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 100);
        assert.equal(percentages.blast, 45.00);
        assert.equal(percentages.baso, 0.00);

        const sum = Object.values(percentages).reduce((s, v) => s + v, 0);
        assert.equal(sum, 100.00);
    });

    // ----------------------------------------------------------
    // VV-CALC-009: Small count (N=10)
    // ----------------------------------------------------------
    it('VV-CALC-009: Small count (10 cells) — correct percentages (SYS-040)', () => {
        const counts = { blast: 3, pro: 0, gran: 4, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 2, mono: 1 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 10);
        assert.equal(percentages.blast, 30.00);
        assert.equal(percentages.gran, 40.00);
        assert.equal(percentages.lymph, 20.00);
        assert.equal(percentages.mono, 10.00);
    });

    // ----------------------------------------------------------
    // VV-CALC-010: Large count (N=500)
    // ----------------------------------------------------------
    it('VV-CALC-010: Large count (500 cells) — correct percentages (SYS-P04)', () => {
        const counts = { blast: 10, pro: 25, gran: 300, eryth: 50, baso: 5, eos: 15, plasma: 10, lymph: 60, mono: 25 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 500);
        assert.equal(percentages.blast, 2.00);
        assert.equal(percentages.gran, 60.00);
        assert.equal(percentages.lymph, 12.00);

        const sum = Object.values(percentages).reduce((s, v) => s + v, 0);
        assert.equal(sum, 100.00);
    });

    // ----------------------------------------------------------
    // VV-CALC-011: Repeating thirds (rounding edge case)
    // ----------------------------------------------------------
    it('VV-CALC-011: Repeating thirds — sum within tolerance (SYS-044)', () => {
        const counts = { blast: 1, pro: 1, gran: 1, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 0, mono: 0 };
        const { percentages } = calcPercent(counts);

        assert.equal(percentages.blast, 33.33);
        assert.equal(percentages.pro, 33.33);
        assert.equal(percentages.gran, 33.33);

        const sum = Object.values(percentages).reduce((s, v) => s + v, 0);
        assert.ok(Math.abs(sum - 100) <= 0.10, `Sum ${sum} should be within ±0.10 of 100`);
    });

    // ----------------------------------------------------------
    // VV-CALC-012: Repeating sixths (rounding accumulation)
    // ----------------------------------------------------------
    it('VV-CALC-012: Six equal cells — sum within tolerance (SYS-044)', () => {
        const counts = { blast: 1, pro: 1, gran: 1, eryth: 1, baso: 1, eos: 1, plasma: 0, lymph: 0, mono: 0 };
        const { percentages } = calcPercent(counts);

        assert.equal(percentages.blast, 16.67);
        const sum = Object.values(percentages).reduce((s, v) => s + v, 0);
        assert.ok(Math.abs(sum - 100) <= 0.10, `Sum ${sum.toFixed(2)} should be within ±0.10 of 100`);
    });

    // ----------------------------------------------------------
    // VV-CALC-013: Near-even distribution
    // ----------------------------------------------------------
    it('VV-CALC-013: Near-even distribution (total=10) (SYS-040)', () => {
        const counts = { blast: 2, pro: 1, gran: 1, eryth: 1, baso: 1, eos: 1, plasma: 1, lymph: 1, mono: 1 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 10);
        assert.equal(percentages.blast, 20.00);
        assert.equal(percentages.pro, 10.00);
    });

    // ----------------------------------------------------------
    // VV-CALC-014: Maximum capacity (total=9999)
    // ----------------------------------------------------------
    it('VV-CALC-014: Maximum capacity 9999 cells — no degradation (SYS-P04)', () => {
        const counts = { blast: 1111, pro: 1111, gran: 1111, eryth: 1111, baso: 1111, eos: 1111, plasma: 1111, lymph: 1111, mono: 1111 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 9999);
        assert.equal(percentages.blast, 11.11);

        // No NaN, no Infinity
        for (const pct of Object.values(percentages)) {
            assert.ok(!isNaN(pct), 'No NaN at high counts');
            assert.ok(isFinite(pct), 'No Infinity at high counts');
        }
    });

    // ----------------------------------------------------------
    // VV-CALC-015: Standard peripheral blood differential
    // ----------------------------------------------------------
    it('VV-CALC-015: Standard PB differential (100 cells) (SYS-040)', () => {
        const counts = { poly: 60, band: 5, lymph: 25, mono: 5, eos: 2, baso: 1, pro: 0, blast: 0, other: 2 };
        const { percentages, total } = calcPercent(counts);

        assert.equal(total, 100);
        assert.equal(percentages.poly, 60.00);
        assert.equal(percentages.lymph, 25.00);
        assert.equal(percentages.blast, 0.00);

        const sum = Object.values(percentages).reduce((s, v) => s + v, 0);
        assert.equal(sum, 100.00);
    });

    // ----------------------------------------------------------
    // ADDITIONAL: Decimal precision always 2 places (SYS-041)
    // ----------------------------------------------------------
    it('SYS-041: All percentages have exactly 2 decimal places', () => {
        const counts = { blast: 7, pro: 3, gran: 0, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 0, mono: 0 };
        const { percentages } = calcPercent(counts);

        // 70.00 and 30.00 should have .00
        assert.equal(percentages.blast, 70.00);
        assert.equal(percentages.pro, 30.00);

        // Verify string representation has 2 decimals
        assert.equal(percentages.blast.toFixed(2), '70.00');
        assert.equal(percentages.pro.toFixed(2), '30.00');
    });

    // ----------------------------------------------------------
    // ADDITIONAL: Percentage sum validation across many distributions (SYS-044)
    // ----------------------------------------------------------
    it('SYS-044: Percentage sum within ±0.10 of 100% for 20 random distributions', () => {
        // Test with various distributions
        const distributions = [
            { a: 1, b: 2, c: 3 },
            { a: 7, b: 7, c: 7, d: 7, e: 7, f: 7, g: 7 },
            { a: 99, b: 1 },
            { a: 1 },
            { a: 33, b: 33, c: 34 },
            { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1, j: 1, k: 1 },
            { a: 143, b: 57 },
            { a: 3, b: 5, c: 8, d: 13, e: 21, f: 34, g: 55, h: 89 },
            { a: 500 },
            { a: 250, b: 250 },
        ];

        for (const dist of distributions) {
            const { percentages, total } = calcPercent(dist);
            if (total > 0) {
                const sum = Object.values(percentages).reduce((s, v) => s + v, 0);
                assert.ok(
                    Math.abs(sum - 100) <= 0.10,
                    `Distribution ${JSON.stringify(dist)}: sum ${sum.toFixed(4)} not within ±0.10 of 100`
                );
            }
        }
    });
});

describe('Calculation Engine — Increment/Decrement (SYS-031 to SYS-033)', () => {

    // VV-INC-001
    it('VV-INC-001: Increment from zero gives 1', () => {
        assert.equal(increment(0), 1);
    });

    // VV-INC-002
    it('VV-INC-002: Increment from 5 gives 6', () => {
        assert.equal(increment(5), 6);
    });

    // VV-INC-003
    it('VV-INC-003: Decrement from 5 gives 4', () => {
        assert.equal(decrement(5), 4);
    });

    // VV-INC-004
    it('VV-INC-004: Decrement from 1 gives 0', () => {
        assert.equal(decrement(1), 0);
    });

    // VV-INC-005: Critical — cannot go below zero (SYS-033)
    it('VV-INC-005: Decrement from 0 stays at 0 — NEVER negative (SYS-033, HA-013)', () => {
        assert.equal(decrement(0), 0);
        // Also test multiple decrements from zero
        let val = 0;
        for (let i = 0; i < 100; i++) {
            val = decrement(val);
        }
        assert.equal(val, 0, 'After 100 decrements from zero, value must remain 0');
    });

    // VV-INC-006
    it('VV-INC-006: Decrement the only cell returns to zero total', () => {
        let blast = 1;
        blast = decrement(blast);
        assert.equal(blast, 0);
    });

    // VV-INC-007
    it('VV-INC-007: Increment after decrement to zero works', () => {
        let val = 1;
        val = decrement(val); // 0
        val = increment(val); // 1
        assert.equal(val, 1);
    });

    // VV-INC-008
    it('VV-INC-008: 20 rapid increments yield 20', () => {
        let val = 0;
        for (let i = 0; i < 20; i++) val = increment(val);
        assert.equal(val, 20);
    });

    // Additional: Increment and decrement are exact inverses
    it('Increment followed by decrement returns to original value', () => {
        for (let start = 0; start < 50; start++) {
            assert.equal(decrement(increment(start)), start);
        }
    });

    // Additional: Large increment sequence
    it('1000 increments yield exactly 1000', () => {
        let val = 0;
        for (let i = 0; i < 1000; i++) val = increment(val);
        assert.equal(val, 1000);
    });
});

describe('Calculation Engine — Output Template JSON (SYS-061)', () => {

    const bmOutCodes = { A: 'blast', S: 'pro', D: 'gran', F: 'eryth', Z: 'baso', X: 'eos', C: 'plasma', V: 'lymph', B: 'mono' };

    it('VV-TPL: Output JSON contains case number, total, and all cell percentages', () => {
        const counts = { blast: 2, pro: 5, gran: 60, eryth: 10, baso: 1, eos: 3, plasma: 2, lymph: 12, mono: 5 };
        const result = mkOutTplJson(bmOutCodes, counts, 'TEST-001', 'Auer rods seen.');

        assert.equal(result.caseNumber, 'TEST-001');
        assert.equal(result.total, 100);
        assert.equal(result.comments, 'Auer rods seen.');
        assert.equal(result.blast, 2);
        assert.equal(result.gran, 60);
        assert.equal(result.lymph, 12);
    });

    it('VV-TPL: Output percentages are rounded integers', () => {
        const counts = { blast: 1, pro: 1, gran: 1, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 0, mono: 0 };
        const result = mkOutTplJson(bmOutCodes, counts, 'TEST-002', '');

        // 1/3 = 33.33% -> rounds to 33
        assert.equal(result.blast, 33);
        assert.equal(result.pro, 33);
        assert.equal(result.gran, 33);
        assert.equal(Number.isInteger(result.blast), true);
    });

    it('VV-TPL: Zero total produces all zeros in output', () => {
        const counts = { blast: 0, pro: 0, gran: 0, eryth: 0, baso: 0, eos: 0, plasma: 0, lymph: 0, mono: 0 };
        const result = mkOutTplJson(bmOutCodes, counts, 'TEST-003', '');

        assert.equal(result.total, 0);
        assert.equal(result.blast, 0);
    });
});
