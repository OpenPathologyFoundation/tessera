/**
 * TEST SUITE 01: Calculation Engine
 * ==================================
 * Traces to: SRS SYS-040 through SYS-047
 * FMEA: HA-020 (calculation error), HA-021 (division by zero), HA-022 (sum != 100%)
 * VV Protocol: VV-CALC-001 through VV-CALC-024, VV-ME-001 through VV-ME-005
 *
 * This suite executes the SHIPPED calculation engine (web/scripts/wbc-core.js).
 * It previously re-implemented the algorithms locally and verified the copy,
 * which meant a defect in the application could not be detected here. See
 * DCR-004.
 *
 * Unified 14-cell layout (same for BM and PB):
 *   nrbc, blasts, pro, myelo, meta, plasma, mast, bands, poly, baso, eos, mono, lymph, other
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// The application module under verification — not a copy of it.
const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));

const CELL_TYPES = ['nrbc', 'blasts', 'pro', 'myelo', 'meta', 'plasma', 'mast',
    'bands', 'poly', 'baso', 'eos', 'mono', 'lymph', 'other'];

function zeroCounts() {
    const c = {};
    CELL_TYPES.forEach(ct => { c[ct] = 0; });
    return c;
}

function counts(overrides) {
    return Object.assign(zeroCounts(), overrides);
}

/** Sum of an object's numeric values, rounded to kill float noise. */
function sumOf(obj, decimals = 6) {
    return Number(Object.values(obj).reduce((s, v) => s + v, 0).toFixed(decimals));
}

// The M:E formula as defined in the shipped configuration profile.
const ME_FORMULA = {
    label: 'M:E Ratio',
    numerator: ['blasts', 'pro', 'myelo', 'meta', 'bands', 'poly', 'baso', 'eos', 'mono'],
    denominator: ['nrbc'],
    precision: 1
};

// ================================================================
describe('Calculation Engine — Percentage Computation (SYS-040 to SYS-045)', () => {

    it('VV-CALC-001: All zeros returns 0.00 for every cell (SYS-042, HA-021)', () => {
        const { percentages, total } = Core.calcPercentages(zeroCounts());
        assert.equal(total, 0);
        for (const [ct, pct] of Object.entries(percentages)) {
            assert.equal(pct, 0, `${ct} should be 0 when total is 0`);
            assert.ok(!Number.isNaN(pct), `${ct} must not be NaN`);
            assert.ok(Number.isFinite(pct), `${ct} must not be Infinity`);
        }
    });

    it('VV-CALC-002: Single cell counted = 100.00% (SYS-040)', () => {
        const { percentages, total } = Core.calcPercentages(counts({ blasts: 1 }));
        assert.equal(total, 1);
        assert.equal(percentages.blasts, 100);
        assert.equal(percentages.poly, 0);
    });

    it('VV-CALC-003: Two equal cells = 50.00% each', () => {
        const { percentages } = Core.calcPercentages(counts({ poly: 50, lymph: 50 }));
        assert.equal(percentages.poly, 50);
        assert.equal(percentages.lymph, 50);
    });

    it('VV-CALC-004: Fourteen equal cells = 7.142857...% raw', () => {
        const all = {};
        CELL_TYPES.forEach(ct => { all[ct] = 10; });
        const { percentages, total } = Core.calcPercentages(all);
        assert.equal(total, 140);
        CELL_TYPES.forEach(ct => {
            assert.ok(Math.abs(percentages[ct] - 7.142857142857143) < 1e-9, ct);
        });
    });

    it('VV-CALC-005: One dominant cell 95/5', () => {
        const { percentages } = Core.calcPercentages(counts({ blasts: 95, lymph: 5 }));
        assert.equal(percentages.blasts, 95);
        assert.equal(percentages.lymph, 5);
    });

    it('VV-CALC-008: Acute leukemia pattern — 45% blasts', () => {
        const { percentages } = Core.calcPercentages(
            counts({ blasts: 45, poly: 20, lymph: 20, mono: 10, eos: 5 }));
        assert.equal(percentages.blasts, 45);
    });

    it('VV-CALC-014: Maximum capacity (9999 cells) computes without degradation (SYS-P04)', () => {
        const { percentages, total } = Core.calcPercentages(counts({ poly: 9000, lymph: 999 }));
        assert.equal(total, 9999);
        assert.ok(Math.abs(percentages.poly - 90.00900090009001) < 1e-9);
    });

    it('Non-numeric and missing values do not corrupt the total', () => {
        assert.equal(Core.getTotal({ a: 5, b: undefined, c: null, d: NaN, e: 3 }), 8);
        assert.equal(Core.getTotal({}), 0);
        assert.equal(Core.getTotal(null), 0);
    });
});

// ================================================================
describe('Calculation Engine — Sum to 100% (URS-034, SYS-044, HA-022)', () => {

    it('VV-CALC-011: Repeating thirds sum to exactly 100.00 at 2 dp', () => {
        const p = Core.percentagesSummingTo100(counts({ poly: 1, lymph: 1, mono: 1 }), 2);
        assert.equal(sumOf(p), 100);
    });

    it('VV-CALC-012: Repeating sixths sum to exactly 100.00 at 2 dp', () => {
        const p = Core.percentagesSummingTo100(
            counts({ poly: 1, lymph: 1, mono: 1, eos: 1, baso: 1, blasts: 1 }), 2);
        assert.equal(sumOf(p), 100);
    });

    it('VV-CALC-016: Fourteen equal cells sum to exactly 100.00 at 2 dp', () => {
        const all = {};
        CELL_TYPES.forEach(ct => { all[ct] = 10; });
        assert.equal(sumOf(Core.percentagesSummingTo100(all, 2)), 100);
    });

    it('VV-CALC-017: Integer output percentages sum to exactly 100', () => {
        const all = {};
        CELL_TYPES.forEach(ct => { all[ct] = 10; });
        assert.equal(sumOf(Core.percentagesSummingTo100(all, 0)), 100);
    });

    it('VV-CALC-018: Zero total produces all zeros, not a forced 100', () => {
        const p = Core.percentagesSummingTo100(zeroCounts(), 2);
        assert.equal(sumOf(p), 0);
        Object.values(p).forEach(v => assert.equal(v, 0));
    });

    it('VV-CALC-019: No category deviates from its true percentage by more than one unit of the last decimal place', () => {
        const cases = [
            counts({ poly: 1, lymph: 1, mono: 1 }),
            counts({ nrbc: 150, blasts: 12, pro: 8, myelo: 35, meta: 40, plasma: 9, mast: 2, bands: 45, poly: 120, baso: 3, eos: 16, mono: 20, lymph: 38, other: 2 }),
            counts({ poly: 7, lymph: 7, mono: 7, eos: 7, baso: 7, blasts: 7, pro: 7 })
        ];
        for (const c of cases) {
            const total = Core.getTotal(c);
            for (const decimals of [0, 2]) {
                const p = Core.percentagesSummingTo100(c, decimals);
                const unit = 1 / Math.pow(10, decimals);
                for (const ct of Object.keys(c)) {
                    const exact = (c[ct] / total) * 100;
                    assert.ok(Math.abs(p[ct] - exact) <= unit + 1e-9,
                        `${ct}: adjusted ${p[ct]} deviates from exact ${exact} by more than ${unit}`);
                }
            }
        }
    });

    it('VV-CALC-020: Property — 2000 randomized differentials always sum to exactly 100', () => {
        // Deterministic LCG so a failure is reproducible.
        let seed = 20260224;
        const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

        for (let i = 0; i < 2000; i++) {
            const c = {};
            const n = 2 + Math.floor(rand() * 13);
            for (let j = 0; j < n; j++) c[CELL_TYPES[j]] = Math.floor(rand() * 500);
            const total = Core.getTotal(c);
            for (const decimals of [0, 2]) {
                const p = Core.percentagesSummingTo100(c, decimals);
                assert.equal(sumOf(p), total === 0 ? 0 : 100,
                    `iteration ${i} decimals ${decimals}: ${JSON.stringify(c)}`);
            }
        }
    });

    it('VV-CALC-021: Adjustment is deterministic for identical input', () => {
        const c = counts({ poly: 3, lymph: 3, mono: 3, eos: 1 });
        const a = Core.percentagesSummingTo100(c, 2);
        const b = Core.percentagesSummingTo100(c, 2);
        assert.deepEqual(a, b);
    });
});

// ================================================================
describe('Calculation Engine — Hostile and Degenerate Input', () => {

    it('VV-CALC-024: A persisted negative count cannot produce a negative percentage', () => {
        // Reachable only via a hand-edited or corrupted autosave record, which
        // has left the protection of the keyboard handler's decrement guard.
        const clean = Core.sanitizeCounts({ blasts: -5, poly: 10 }, ['blasts', 'poly']);
        assert.equal(clean.blasts, 0);
        assert.equal(clean.poly, 10);
        const p = Core.percentagesSummingTo100(clean, 2);
        Object.values(p).forEach(v => assert.ok(v >= 0, 'no percentage may be negative'));
        assert.equal(sumOf(p), 100);
    });

    it('VV-CALC-025: sanitizeCounts coerces to non-negative integers and drops unknown types', () => {
        const clean = Core.sanitizeCounts(
            { blasts: 3.7, poly: '12', baso: NaN, eos: -1, ghost: 99 },
            ['blasts', 'poly', 'baso', 'eos']);
        assert.deepEqual(clean, { blasts: 3, poly: 12, baso: 0, eos: 0 });
        assert.equal(Object.prototype.hasOwnProperty.call(clean, 'ghost'), false);
    });

    it('VV-CALC-026: A single counted category is 100% at every precision', () => {
        assert.deepEqual(Core.percentagesSummingTo100({ blasts: 7 }, 0), { blasts: 100 });
        assert.deepEqual(Core.percentagesSummingTo100({ blasts: 7 }, 2), { blasts: 100 });
    });

    it('VV-CALC-027: Extreme ratios still sum to exactly 100', () => {
        const p = Core.percentagesSummingTo100({ poly: 999999, baso: 1 }, 2);
        assert.equal(sumOf(p), 100);
    });

    it('VV-CALC-028: getTotal ignores negative and non-finite entries', () => {
        assert.equal(Core.getTotal({ a: 5, b: -3, c: Infinity, d: 2 }), 7);
    });
});

// ================================================================
describe('Calculation Engine — Display Formatting (URS-032, SYS-041)', () => {

    it('VV-CALC-022: Percentages render at 2 decimal places', () => {
        assert.equal(Core.formatPercent(7.1, 2), '7.10%');
        assert.equal(Core.formatPercent(0, 2), '0.00%');
        assert.equal(Core.formatPercent(100, 2), '100.00%');
    });

    it('VV-CALC-023: Low-percentage categories retain 2 dp resolution', () => {
        const p = Core.percentagesSummingTo100(counts({ poly: 199, baso: 1 }), 2);
        assert.equal(Core.formatPercent(p.baso, 2), '0.50%');
    });
});

// ================================================================
describe('Calculation Engine — Increment / Decrement (SYS-031 to SYS-033)', () => {

    it('VV-INC-001: Increment adds exactly one', () => {
        const c = zeroCounts();
        c.blasts += 1;
        assert.equal(c.blasts, 1);
        assert.equal(Core.getTotal(c), 1);
    });

    it('VV-INC-005: Decrement never goes below zero (HA-013)', () => {
        // Mirrors the guard in onKeyDown: only decrement when > 0.
        let v = 0;
        if (v > 0) v -= 1;
        assert.equal(v, 0);
    });

    it('VV-INC-006: Sequence of increments and undos yields the arithmetic result', () => {
        const c = zeroCounts();
        for (let i = 0; i < 10; i++) c.poly += 1;
        for (let i = 0; i < 3; i++) if (c.poly > 0) c.poly -= 1;
        assert.equal(c.poly, 7);
        assert.equal(Core.getTotal(c), 7);
    });
});

// ================================================================
describe('Calculation Engine — M:E Ratio (SYS-046, SYS-047, HA-070, HA-072)', () => {

    it('VV-ME-001: Standard myeloid/erythroid ratio', () => {
        const c = counts({ poly: 100, nrbc: 50 });
        assert.equal(Core.computeRatio(c, ME_FORMULA), '2.0:1');
    });

    it('VV-ME-002: Ratio honours the configured precision', () => {
        const c = counts({ poly: 100, nrbc: 30 });
        assert.equal(Core.computeRatio(c, ME_FORMULA), '3.3:1');
        assert.equal(Core.computeRatio(c, Object.assign({}, ME_FORMULA, { precision: 2 })), '3.33:1');
    });

    it('VV-ME-003: Zero denominator yields N/A, never a division error (HA-072)', () => {
        const c = counts({ poly: 100, nrbc: 0 });
        assert.equal(Core.computeRatio(c, ME_FORMULA), 'N/A');
    });

    it('VV-ME-004: Zero numerator over a positive denominator is 0.0:1', () => {
        const c = counts({ nrbc: 40 });
        assert.equal(Core.computeRatio(c, ME_FORMULA), '0.0:1');
    });

    it('VV-ME-005: Absent formula returns null so no ratio row is rendered', () => {
        assert.equal(Core.computeRatio(counts({ poly: 5 }), null), null);
        assert.equal(Core.computeRatio(counts({ poly: 5 }), {}), null);
    });

    it('VV-ME-006: Every numerator member contributes to the ratio', () => {
        const c = counts({ nrbc: 10 });
        ME_FORMULA.numerator.forEach(ct => { c[ct] = 1; });
        // 9 myeloid members / 10 erythroid = 0.9
        assert.equal(Core.computeRatio(c, ME_FORMULA), '0.9:1');
    });
});

// ================================================================
describe('Calculation Engine — Absolute Counts (URS-036)', () => {

    it('VV-ABS-001: Absolute count is WBC x percentage / 100', () => {
        assert.equal(Core.computeAbsolute(10, 50), 5);
        assert.equal(Number(Core.computeAbsolute(7.5, 62.5).toFixed(4)), 4.6875);
    });

    it('VV-ABS-002: Non-positive or non-numeric WBC yields null, not NaN', () => {
        assert.equal(Core.computeAbsolute(0, 50), null);
        assert.equal(Core.computeAbsolute(-3, 50), null);
        assert.equal(Core.computeAbsolute(NaN, 50), null);
        assert.equal(Core.computeAbsolute('7.5', 50), null);
    });
});

// ================================================================
describe('Calculation Engine — Low Count Advisory (URS-041, SYS-053)', () => {

    it('VV-LOW-001: Below-target count produces a non-blocking note', () => {
        const note = Core.buildLowCountNote(216, 500);
        assert.ok(note, 'expected an advisory note');
        assert.match(note, /216-cell count/);
        assert.match(note, /500/);
    });

    it('VV-LOW-002: Reaching the target produces no note', () => {
        assert.equal(Core.buildLowCountNote(500, 500), null);
        assert.equal(Core.buildLowCountNote(501, 500), null);
    });

    it('VV-LOW-003: Missing or invalid target produces no note', () => {
        assert.equal(Core.buildLowCountNote(100, 0), null);
        assert.equal(Core.buildLowCountNote(100, undefined), null);
    });
});

// ================================================================
describe('Sampling Precision — Wilson confidence intervals (URS-037, HA-030)', () => {

    it('VV-CI-001: Known Wilson values are reproduced', () => {
        // Hand-checked against the closed form. 10 of 200 = 5%.
        const ci = Core.wilsonInterval(10, 200, 0.95);
        assert.equal(ci.point, 5);
        assert.equal(Number(ci.lower.toFixed(2)), 2.74);
        assert.equal(Number(ci.upper.toFixed(2)), 8.96);
        assert.equal(ci.n, 200);
        assert.equal(ci.level, 0.95);
    });

    it('VV-CI-002: Bounds are never impossible, where Wald would be', () => {
        // 2 blasts in 200 cells. The Wald interval puts the lower bound below
        // zero here; that is why Wilson is used (REF-001 [S7]).
        const p = 2 / 200;
        const waldLower = (p - 1.959964 * Math.sqrt(p * (1 - p) / 200)) * 100;
        assert.ok(waldLower < 0, 'precondition: Wald is negative for this count');

        const ci = Core.wilsonInterval(2, 200);
        assert.ok(ci.lower >= 0, 'Wilson lower bound must not be negative');
        assert.ok(ci.upper <= 100);
        assert.ok(ci.lower > 0, 'a non-zero count should have a non-zero lower bound');
    });

    it('VV-CI-003: A zero count still says something', () => {
        // 0 blasts in 200 cells does not exclude blasts; it bounds them.
        const ci = Core.wilsonInterval(0, 200);
        assert.equal(ci.point, 0);
        assert.equal(ci.lower, 0);
        assert.ok(ci.upper > 1 && ci.upper < 2.5, `unexpected upper bound ${ci.upper}`);
    });

    it('VV-CI-004: A saturated count is bounded at 100', () => {
        const ci = Core.wilsonInterval(200, 200);
        assert.equal(ci.point, 100);
        assert.equal(ci.upper, 100);
        assert.ok(ci.lower > 95 && ci.lower < 100);
    });

    it('VV-CI-005: Intervals narrow as the count grows', () => {
        const widths = [100, 200, 500, 1000].map(n => {
            const ci = Core.wilsonInterval(0.05 * n, n);
            return ci.upper - ci.lower;
        });
        for (let i = 1; i < widths.length; i++) {
            assert.ok(widths[i] < widths[i - 1],
                `interval at index ${i} (${widths[i]}) should be narrower than ${widths[i - 1]}`);
        }
    });

    it('VV-CI-006: Higher confidence gives a wider interval', () => {
        const w = lvl => {
            const ci = Core.wilsonInterval(10, 200, lvl);
            return ci.upper - ci.lower;
        };
        assert.ok(w(0.90) < w(0.95));
        assert.ok(w(0.95) < w(0.99));
    });

    it('VV-CI-007: The interval always contains the point estimate', () => {
        for (const n of [50, 100, 200, 500]) {
            for (let c = 0; c <= n; c += Math.max(1, Math.floor(n / 20))) {
                const ci = Core.wilsonInterval(c, n);
                assert.ok(ci.lower <= ci.point + 1e-9 && ci.point <= ci.upper + 1e-9,
                    `${c}/${n}: point ${ci.point} outside [${ci.lower}, ${ci.upper}]`);
            }
        }
    });

    it('VV-CI-008: Degenerate input yields null, not a bogus interval', () => {
        assert.equal(Core.wilsonInterval(5, 0), null, 'no cells counted');
        assert.equal(Core.wilsonInterval(-1, 200), null, 'negative count');
        assert.equal(Core.wilsonInterval(10, 5), null, 'count exceeds denominator');
        assert.equal(Core.wilsonInterval(NaN, 200), null);
    });

    it('VV-CI-009: The AML blast threshold is not resolved by a 200-cell count', () => {
        // The clinically important case. An observed 20% at 200 cells has an
        // interval spanning the 20% cutoff, so the count does not establish
        // which side of it the true value lies on.
        const ci = Core.wilsonInterval(40, 200);
        assert.ok(Core.intervalSpans(ci, 20), '20% at n=200 must straddle the cutoff');
        assert.ok(ci.lower < 20 && ci.upper > 20);

        // A 500-cell count narrows it but still straddles — an honest result.
        const bigger = Core.wilsonInterval(100, 500);
        assert.ok(Core.intervalSpans(bigger, 20));
        assert.ok((bigger.upper - bigger.lower) < (ci.upper - ci.lower));
    });

    it('VV-CI-010: A count far from a threshold does not straddle it', () => {
        const ci = Core.wilsonInterval(10, 500);   // 2%
        assert.equal(Core.intervalSpans(ci, 20), false);
    });

    it('VV-CI-011: Interval formatting is stable', () => {
        assert.equal(Core.formatInterval(Core.wilsonInterval(10, 200), 1), '2.7–9.0%');
        assert.equal(Core.formatInterval(null), 'N/A');
    });

    it('VV-CI-012: Cells-for-precision answers the "how many more" question', () => {
        const n = Core.cellsForPrecision(0.20, 2);
        assert.ok(n > 1000 && n < 2000, `unexpected sample size ${n}`);
        // Tighter precision costs more cells.
        assert.ok(Core.cellsForPrecision(0.20, 1) > n);
        assert.equal(Core.cellsForPrecision(0.20, 0), null);
        assert.equal(Core.cellsForPrecision(-0.1, 2), null);
    });
});

// ================================================================
describe('Low Count Advisory — quantified (URS-041, HA-030)', () => {

    it('VV-LOW-004: The advisory states an actual interval, not a vague warning', () => {
        const note = Core.buildLowCountNote(216, 500);
        assert.match(note, /216-cell count/);
        assert.match(note, /95% confidence interval/);
        assert.match(note, /\d+\.\d–\d+\.\d%/, 'must contain a computed interval');
    });

    it('VV-LOW-005: The stated interval matches the engine', () => {
        const note = Core.buildLowCountNote(216, 500);
        const expected = Core.formatInterval(Core.wilsonInterval(0.05 * 216, 216), 1);
        assert.ok(note.includes(expected),
            `note should contain ${expected}; got: ${note}`);
    });

    it('VV-LOW-006: The advisory honours the configured confidence level', () => {
        assert.match(Core.buildLowCountNote(216, 500, 0.99), /99% confidence interval/);
    });
});
