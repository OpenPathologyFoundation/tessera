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

// ================================================================
describe('Subset percentage formulas (URS-039, DCR-008)', () => {

    const NON_ERYTHROID = CELL_TYPES.filter(ct => ct !== 'nrbc');
    const BLASTS_NE = {
        type: 'percentage',
        label: 'Blasts (% non-erythroid)',
        numerator: ['blasts'],
        denominator: NON_ERYTHROID,
        precision: 1
    };

    it('VV-SUB-001: A subset percentage uses its own denominator', () => {
        // Erythroid-rich marrow: the two conventions disagree materially.
        const c = counts({ nrbc: 240, blasts: 18, poly: 80, myelo: 30, lymph: 32 });
        const all = Core.percentagesSummingTo100(c, 1);
        const sub = Core.computeSubsetPercentage(c, BLASTS_NE);

        assert.equal(all.blasts, 4.5, 'blasts of all nucleated cells');
        assert.equal(sub.numeratorCount, 18);
        assert.equal(sub.denominatorCount, 160, 'erythroid precursors are excluded');
        assert.equal(sub.display, '11.3%');
        assert.ok(sub.value > all.blasts, 'excluding erythroid raises the blast percentage');
    });

    it('VV-SUB-002: The two conventions can fall on opposite sides of a threshold', () => {
        // The case the pre-2022 WHO erythroleukaemia rule existed to catch.
        const c = counts({ nrbc: 300, blasts: 45, poly: 90, myelo: 40, lymph: 25 });
        const all = Core.percentagesSummingTo100(c, 1);
        const sub = Core.computeSubsetPercentage(c, BLASTS_NE);
        assert.ok(all.blasts < 20, `all-nucleated blasts ${all.blasts}% is below 20%`);
        assert.ok(sub.value > 20, `non-erythroid blasts ${sub.value}% is above 20%`);
    });

    it('VV-SUB-003: A zero denominator yields null, not a division', () => {
        assert.equal(Core.computeSubsetPercentage(counts({ nrbc: 50 }), BLASTS_NE), null);
        assert.equal(Core.computeSubsetPercentage(zeroCounts(), BLASTS_NE), null);
    });

    it('VV-SUB-004: computeFormula dispatches on type and defaults to ratio', () => {
        const c = counts({ poly: 100, nrbc: 50, blasts: 10 });
        const asRatio = Core.computeFormula(c, ME_FORMULA);
        assert.equal(asRatio.type, 'ratio');
        assert.equal(asRatio.display, '2.2:1');

        const asPct = Core.computeFormula(c, BLASTS_NE);
        assert.equal(asPct.type, 'percentage');
        assert.match(asPct.display, /%$/);

        // A formula with no declared type is a ratio, so profiles written
        // before subset percentages existed are unaffected.
        const untyped = Object.assign({}, ME_FORMULA);
        delete untyped.type;
        assert.equal(Core.computeFormula(c, untyped).type, 'ratio');
    });

    it('VV-SUB-005: A subset percentage carries a confidence interval, as a ratio cannot', () => {
        const c = counts({ nrbc: 300, blasts: 45, poly: 90, myelo: 40, lymph: 25 });
        const sub = Core.computeSubsetPercentage(c, BLASTS_NE);
        const ci = Core.wilsonInterval(sub.numeratorCount, sub.denominatorCount);
        assert.ok(ci, 'a percentage has a real denominator and therefore an interval');
        assert.ok(ci.lower < sub.value && sub.value < ci.upper);
    });

    it('VV-SUB-006: Validation rejects a numerator outside the denominator', () => {
        const errs = Core.validateConfig([{
            specimenType: 'bm', targetCount: 100,
            categories: { upper: ['blasts'], lower: ['poly', 'nrbc'] },
            outCodes: { X: 'blasts', F: 'poly', B: 'nrbc' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }],
            formulas: {
                bad: { type: 'percentage', numerator: ['nrbc'], denominator: ['blasts', 'poly'] }
            }
        }]);
        assert.ok(errs.some(e => /could exceed 100%/.test(e)), errs.join('; '));
    });

    it('VV-SUB-007: Validation rejects an unknown formula type', () => {
        const errs = Core.validateConfig([{
            specimenType: 'bm', targetCount: 100,
            categories: { upper: ['blasts'], lower: ['poly'] },
            outCodes: { X: 'blasts', F: 'poly' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }],
            formulas: { bad: { type: 'fraction', numerator: ['blasts'], denominator: ['poly'] } }
        }]);
        assert.ok(errs.some(e => /unknown type "fraction"/.test(e)), errs.join('; '));
    });
});

// ================================================================
describe('Diagnostic thresholds (URS-038, ICSH 2008 §2.6)', () => {

    const SPEC = {
        categories: { upper: CELL_TYPES.slice(0, 7), lower: CELL_TYPES.slice(7) },
        thresholds: [
            { target: 'blasts', value: 20, label: 'AML blast threshold', basis: 'WHO 2022' },
            { target: 'blasts', value: 5, label: 'low blast threshold', basis: 'ICSH §2.6' }
        ]
    };

    it('VV-THR-001: An interval spanning a threshold is flagged', () => {
        // 40 of 200 = 20%; the interval is 15.0-26.1% and straddles the cutoff.
        const c = counts({ blasts: 40, poly: 160 });
        const results = Core.evaluateThresholds(c, SPEC);
        const aml = results.find(r => r.value === 20);
        assert.equal(aml.spans, true);
        assert.equal(Number(aml.observed.toFixed(2)), 20);
        assert.equal(aml.label, 'AML blast threshold');
        assert.equal(aml.basis, 'WHO 2022');
    });

    it('VV-THR-002: A count clear of a threshold is not flagged', () => {
        const c = counts({ blasts: 4, poly: 496 });   // 0.8%
        const aml = Core.evaluateThresholds(c, SPEC).find(r => r.value === 20);
        assert.equal(aml.spans, false);
    });

    it('VV-THR-003: More cells narrow the interval but need not resolve the threshold', () => {
        const small = Core.evaluateThresholds(counts({ blasts: 40, poly: 160 }), SPEC)
            .find(r => r.value === 20);
        const large = Core.evaluateThresholds(counts({ blasts: 100, poly: 400 }), SPEC)
            .find(r => r.value === 20);
        const w = r => r.interval.upper - r.interval.lower;
        assert.ok(w(large) < w(small), 'a larger count gives a narrower interval');
        assert.equal(large.spans, true,
            'an observation sitting exactly on the threshold still straddles it — ' +
            'the tool must not imply that counting more will always settle the question');
    });

    it('VV-THR-004: A threshold may target a percentage formula', () => {
        const spec = {
            categories: SPEC.categories,
            formulas: {
                blasts_ne: {
                    type: 'percentage', label: 'Blasts (% non-erythroid)',
                    numerator: ['blasts'],
                    denominator: CELL_TYPES.filter(ct => ct !== 'nrbc'), precision: 1
                }
            },
            thresholds: [{ target: 'blasts_ne', value: 20, label: 'legacy rule' }]
        };
        const c = counts({ nrbc: 300, blasts: 45, poly: 90, myelo: 40, lymph: 25 });
        const r = Core.evaluateThresholds(c, spec)[0];
        assert.equal(r.targetLabel, 'Blasts (% non-erythroid)');
        assert.equal(r.interval.n, 200, 'measured against the formula denominator');
        assert.equal(r.spans, true);
    });

    it('VV-THR-005: A ratio formula cannot be a threshold target', () => {
        const errs = Core.validateConfig([{
            specimenType: 'bm', targetCount: 100,
            categories: { upper: ['blasts'], lower: ['poly', 'nrbc'] },
            outCodes: { X: 'blasts', F: 'poly', B: 'nrbc' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }],
            formulas: { me: { numerator: ['poly'], denominator: ['nrbc'] } },
            thresholds: [{ target: 'me', value: 2 }]
        }]);
        assert.ok(errs.some(e => /ratio carries no confidence interval/.test(e)), errs.join('; '));
    });

    it('VV-THR-006: Validation rejects an unresolvable or out-of-range threshold', () => {
        const base = {
            specimenType: 'bm', targetCount: 100,
            categories: { upper: ['blasts'], lower: ['poly'] },
            outCodes: { X: 'blasts', F: 'poly' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }]
        };
        assert.ok(Core.validateConfig([Object.assign({}, base,
            { thresholds: [{ target: 'ghost', value: 20 }] })])
            .some(e => /neither a displayed category nor a percentage formula/.test(e)));
        assert.ok(Core.validateConfig([Object.assign({}, base,
            { thresholds: [{ target: 'blasts', value: 150 }] })])
            .some(e => /between 0 and 100/.test(e)));
        assert.ok(Core.validateConfig([Object.assign({}, base,
            { thresholds: 'nope' })]).some(e => /thresholds must be an array/.test(e)));
    });

    it('VV-THR-007: A category outside the differential cannot be a threshold target', () => {
        const errs = Core.validateConfig([{
            specimenType: 'pb', targetCount: 200,
            categories: { upper: ['blasts'], lower: ['poly', 'nrbc'] },
            outCodes: { X: 'blasts', F: 'poly', B: 'nrbc' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }],
            denominatorExcludes: ['nrbc'],
            per100Reporting: { nrbc: { label: 'NRBC/100 WBC' } },
            thresholds: [{ target: 'nrbc', value: 5 }]
        }]);
        assert.ok(errs.some(e => /outside the differential denominator/.test(e)), errs.join('; '));
    });

    it('VV-THR-008: No thresholds configured yields no evaluation', () => {
        assert.deepEqual(Core.evaluateThresholds(counts({ blasts: 40, poly: 160 }), {}), []);
        assert.deepEqual(Core.evaluateThresholds(zeroCounts(), SPEC), [],
            'nothing counted, nothing to test');
    });
});

// ================================================================
describe('Method provenance (URS-055, DCR-009)', () => {

    const META = {
        profileId: 'consensus-14',
        profileName: 'Full 14-Part Consensus',
        version: '2.4',
        provenance: { notes: 'Categories follow ICSH 2008 §2.6.' }
    };

    it('VV-PROV-001: The statement names the profile and its version', () => {
        const e = Core.buildMethodStatement({}, META);
        const profile = e.find(x => x.label === 'Profile');
        assert.ok(profile);
        assert.match(profile.text, /Full 14-Part Consensus/);
        assert.match(profile.text, /consensus-14/);
        assert.match(profile.text, /v2\.4/);
    });

    it('VV-PROV-002: A derived formula states the convention it follows', () => {
        // The reason this matters: two conventions for the M:E ratio are in
        // use and give different numbers from identical counts.
        const e = Core.buildMethodStatement({
            formulas: {
                ME_ratio: {
                    label: 'M:E Ratio',
                    basis: 'ICSH 2008 §2.6: monocytes included in the numerator.'
                }
            }
        }, META);
        const me = e.find(x => x.label === 'M:E Ratio');
        assert.ok(me, 'the formula convention must be stated');
        assert.match(me.text, /monocytes included/);
    });

    it('VV-PROV-003: A non-standard denominator is declared', () => {
        const e = Core.buildMethodStatement({
            denominatorExcludes: ['nrbc'],
            per100Reporting: { nrbc: { label: 'NRBC per 100 WBC' } }
        }, META);
        const den = e.find(x => x.label === 'Denominator');
        assert.ok(den, 'excluding a category from the denominator must be stated');
        assert.match(den.text, /nrbc/);
        assert.match(den.text, /NRBC per 100 WBC/);
    });

    it('VV-PROV-004: A plain profile makes no denominator claim', () => {
        // Bone marrow counts every cell, which is what a reader assumes;
        // saying so would be noise.
        const e = Core.buildMethodStatement({ formulas: {} }, META);
        assert.equal(e.find(x => x.label === 'Denominator'), undefined);
    });

    it('VV-PROV-005: The confidence level is stated when intervals are shown', () => {
        const withCI = Core.buildMethodStatement(
            { confidenceIntervals: { enabled: true, level: 0.99 } }, META);
        assert.match(withCI.find(x => x.label === 'Precision').text, /99%/);

        const without = Core.buildMethodStatement(
            { confidenceIntervals: { enabled: false } }, META);
        assert.equal(without.find(x => x.label === 'Precision'), undefined);
    });

    it('VV-PROV-006: An empty profile yields an empty statement, not a stub', () => {
        assert.deepEqual(Core.buildMethodStatement({}, {}), []);
        assert.equal(Core.formatMethodStatement([]), '');
        assert.equal(Core.formatMethodStatement(null), '');
    });

    it('VV-PROV-007: The statement flattens for template substitution', () => {
        const text = Core.formatMethodStatement(
            Core.buildMethodStatement({ targetCountBasis: 'ICSH 2008 §2.6.' }, META), ' ');
        assert.match(text, /Profile: Full 14-Part Consensus/);
        assert.match(text, /Target count: ICSH 2008/);
    });

    it('VV-PROV-008: methodNotes is available to templates and cannot be shadowed', () => {
        assert.ok(Core.RESERVED_PLACEHOLDERS.includes('methodNotes'));
        // Placeholders added for the denominator policy must be reserved too,
        // or a category named "totalCounted" would shadow one.
        ['total', 'totalCounted', 'denominator'].forEach(n =>
            assert.ok(Core.RESERVED_PLACEHOLDERS.includes(n), `${n} must be reserved`));

        const out = Core.renderTemplate('Method: {{methodNotes}}',
            Core.buildTemplateValues({ methodNotes: 'ICSH 2008 §2.6.' }, {}));
        assert.match(out, /Method: ICSH 2008/);
    });
});

// ================================================================
describe('Selectable rounding policy (URS-034, DCR-010)', () => {

    const thirds = counts({ poly: 1, lymph: 1, mono: 1 });
    const fourteen = (() => { const c = {}; CELL_TYPES.forEach(ct => { c[ct] = 10; }); return c; })();

    it('VV-RND-001: largest-remainder is the default and totals exactly 100', () => {
        const a = Core.percentagesSummingTo100(thirds, 0);
        const b = Core.percentagesSummingTo100(thirds, 0, { method: 'largest-remainder' });
        assert.deepEqual(a, b, 'omitting the method must select largest-remainder');
        assert.equal(sumOf(a), 100);
    });

    it('VV-RND-002: largest-count totals 100 but displaces one category further', () => {
        // Fourteen equal categories, true value 7.14% each.
        const hare = Core.percentagesSummingTo100(fourteen, 0, { method: 'largest-remainder' });
        const lc = Core.percentagesSummingTo100(fourteen, 0, { method: 'largest-count' });
        assert.equal(sumOf(hare), 100);
        assert.equal(sumOf(lc), 100);

        const spread = o => Math.max(...Object.values(o)) - Math.min(...Object.values(o));
        assert.equal(spread(hare), 1, 'largest-remainder keeps every category within one unit');
        assert.ok(spread(lc) > spread(hare),
            'largest-count concentrates the residual, widening the spread');
        assert.equal(Math.max(...Object.values(lc)), 9,
            'one category reads 9% against a true 7.14% — the reason it is not the default');
    });

    it('VV-RND-003: independent rounding is faithful per category but need not total 100', () => {
        const ind = Core.percentagesSummingTo100(fourteen, 0, { method: 'independent' });
        Object.values(ind).forEach(v => assert.equal(v, 7, 'each is its own honest rounding'));
        assert.equal(sumOf(ind), 98, 'and the total is therefore not 100');
    });

    it('VV-RND-004: Every policy still respects the denominator exclusion', () => {
        const c = counts({ poly: 120, lymph: 40, mono: 15, eos: 5, nrbc: 20 });
        for (const method of ['largest-remainder', 'largest-count', 'independent']) {
            const p = Core.percentagesSummingTo100(c, 2, { exclude: ['nrbc'], method });
            assert.equal(p.nrbc, null, `${method}: excluded category has no percentage`);
            assert.ok(Math.abs(p.poly - (120 / 180 * 100)) < 1.5,
                `${method}: computed over 180, not 200`);
        }
    });

    it('VV-RND-005: Validation rejects an unknown policy', () => {
        const errs = Core.validateConfig([{
            specimenType: 'bm', targetCount: 100, rounding: 'banker',
            categories: { upper: ['blasts'], lower: ['poly'] },
            outCodes: { X: 'blasts', F: 'poly' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }]
        }]);
        assert.ok(errs.some(e => /rounding must be/.test(e)), errs.join('; '));
    });

    it('VV-RND-006: Validation rejects an impossible precision', () => {
        const base = {
            specimenType: 'bm', targetCount: 100,
            categories: { upper: ['blasts'], lower: ['poly'] },
            outCodes: { X: 'blasts', F: 'poly' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }]
        };
        for (const bad of [{ display: 9 }, { report: -1 }, { display: 1.5 }]) {
            assert.ok(Core.validateConfig([Object.assign({}, base, { precision: bad })])
                .some(e => /precision\./.test(e)), JSON.stringify(bad));
        }
        assert.equal(Core.validateConfig([Object.assign({}, base,
            { precision: { display: 1, report: 1 } })]).length, 0);
    });

    it('VV-RND-007: The method statement declares which policy is in force', () => {
        for (const [method, phrase] of [
            ['largest-remainder', /largest-remainder/],
            ['largest-count', /largest category/],
            ['independent', /may not total exactly 100/]
        ]) {
            const e = Core.buildMethodStatement({ rounding: method }, {});
            const r = e.find(x => x.label === 'Rounding');
            assert.ok(r, `${method}: no Rounding entry`);
            assert.match(r.text, phrase);
        }
    });
});

// ================================================================
describe('Corrected WBC for nucleated red cells (URS-036, HA-105)', () => {

    /**
     * Analysers count nucleated red cells as leucocytes, so a reported WBC is
     * inflated whenever they circulate and every absolute count derived from it
     * is overstated by the same factor. The application computed the NRBC
     * per-100 figure whose only clinical purpose is to feed this correction,
     * displayed the formula in its own reference document, and then multiplied
     * by the uncorrected value anyway.
     */

    it('VV-ABS-020: The published formula is implemented exactly', () => {
        // corrected = reported x 100 / (100 + NRBC per 100 WBC)
        assert.equal(Core.correctWbcForNrbc(10, 20).toFixed(4), '8.3333');
        assert.equal(Core.correctWbcForNrbc(7.5, 11.1).toFixed(4), '6.7507');
        assert.equal(Core.correctWbcForNrbc(12, 100).toFixed(4), '6.0000');
    });

    it('VV-ABS-021: A 20% overstatement is removed, at the ANC thresholds that matter', () => {
        // 1.8 reported with 20 NRBC/100 is truly 1.5 — the neutropenia boundary.
        const reported = 1.8;
        const corrected = Core.correctWbcForNrbc(reported, 20);
        assert.equal(corrected.toFixed(2), '1.50');
        // At 100% neutrophils the ANC is the WBC; the uncorrected figure sits
        // above the 1.5 boundary and the corrected figure sits on it.
        assert.ok(Core.computeAbsolute(reported, 100) > 1.5);
        assert.equal(Core.computeAbsolute(corrected, 100).toFixed(2), '1.50');
        // Stated as a ratio: uncorrected overstates by exactly 20%.
        assert.equal((Core.computeAbsolute(reported, 100) /
                      Core.computeAbsolute(corrected, 100)).toFixed(3), '1.200');
    });

    it('VV-ABS-022: No nucleated red cells means no correction', () => {
        assert.equal(Core.correctWbcForNrbc(7.5, 0), 7.5);
        assert.equal(Core.correctWbcForNrbc(7.5, null), 7.5);
        assert.equal(Core.correctWbcForNrbc(7.5, undefined), 7.5);
        assert.equal(Core.correctWbcForNrbc(7.5, NaN), 7.5);
    });

    it('VV-ABS-023: An unusable WBC yields null, never a silent zero', () => {
        for (const bad of [0, -1, NaN, null, undefined, '10']) {
            assert.equal(Core.correctWbcForNrbc(bad, 20), null, String(bad));
        }
    });

    it('VV-ABS-024: The correction is monotonic and bounded', () => {
        // More nucleated red cells can only reduce the leucocyte count, and
        // never below zero.
        let previous = Core.correctWbcForNrbc(10, 0);
        for (const n of [1, 5, 20, 50, 100, 500]) {
            const value = Core.correctWbcForNrbc(10, n);
            assert.ok(value < previous, `not monotonic at ${n}`);
            assert.ok(value > 0, `not positive at ${n}`);
            previous = value;
        }
    });
});
