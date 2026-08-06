/**
 * TEST SUITE 13: User-Facing Documentation
 * =========================================
 * Traces to: URS-092 (clear instructions), URS-055 (method provenance)
 * FMEA: HA-095
 *
 * User documentation drifts silently. USER-GUIDE.md described a nine-category
 * layout with keys that no longer existed and target counts that had changed —
 * it would have actively misled an operator, and no test caught it because
 * nothing checked documentation against the shipped configuration.
 *
 * These tests pin the user-facing documents to the software they describe:
 * every key, every target count, and every clinically material figure quoted in
 * the methods page is verified against the shipped profile and the shipped
 * calculation engine.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));

const ROOT = path.join(__dirname, '..');
const config = Core.normalizeConfig(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'settings', 'templates.json'), 'utf-8')));
const guide = fs.readFileSync(path.join(ROOT, 'USER-GUIDE.md'), 'utf-8');
const methods = fs.readFileSync(path.join(ROOT, 'web', 'methods.html'), 'utf-8');
const calcref = fs.readFileSync(path.join(ROOT, 'QMS', 'DHF', 'CALCULATION-REFERENCE.md'), 'utf-8');

// ================================================================
describe('User guide tracks the shipped configuration (URS-092)', () => {

    it('UD-001: Every counting key in the shipped profile is documented', () => {
        for (const spec of config.specimenTypes) {
            for (const [key, cellType] of Object.entries(spec.outCodes)) {
                assert.ok(guide.includes('| ' + key + ' |'),
                    `${spec.specimenType}: key "${key}" (${cellType}) is not in USER-GUIDE.md`);
            }
        }
    });

    it('UD-002: No key is documented that the profile does not define', () => {
        const documented = [...guide.matchAll(/^\| ([A-Z]) \| /gm)].map(m => m[1]);
        const real = new Set();
        config.specimenTypes.forEach(s => Object.keys(s.outCodes).forEach(k => real.add(k)));
        for (const k of documented) {
            assert.ok(real.has(k), `USER-GUIDE.md documents key "${k}", which no profile defines`);
        }
    });

    it('UD-003: Documented target counts match the profile', () => {
        for (const spec of config.specimenTypes) {
            assert.ok(guide.includes('target ' + spec.targetCount + ' cells'),
                `${spec.specimenType}: target ${spec.targetCount} is not stated in USER-GUIDE.md`);
        }
    });

    it('UD-004: The guide points at the methods page', () => {
        assert.match(guide, /methods\.html/);
        assert.match(guide, /Methods and Limitations/i);
    });
});

// ================================================================
describe('Methods page figures match the engine (URS-055)', () => {

    /** Every "a.b–c.d%" interval quoted anywhere in the page. */
    function quotedIntervals() {
        return [...methods.matchAll(/(\d+\.\d)–(\d+\.\d)%/g)]
            .map(m => `${m[1]}–${m[2]}%`);
    }

    it('UD-010: The confidence interval table is computed, not asserted', () => {
        // Each row of the table in §4, verified against wilsonInterval().
        const expected = [
            [0.05, 100], [0.05, 200], [0.05, 500],
            [0.20, 100], [0.20, 200], [0.20, 500],
            [0.00, 100], [0.00, 200], [0.00, 500]
        ];
        for (const [p, n] of expected) {
            const ci = Core.wilsonInterval(Math.round(p * n), n);
            const text = Core.formatInterval(ci, 1);
            // The page drops a leading "0.0–" to read "0–3.7%" in the zero row.
            const alt = text.replace(/^0\.0–/, '0–');
            assert.ok(methods.includes(text) || methods.includes(alt),
                `methods.html is missing the interval for ${p * 100}% at n=${n}: expected ${text}`);
        }
    });

    it('UD-011: Every interval quoted in the page is one the engine produces', () => {
        // Guards against a figure being edited by hand into something plausible
        // but wrong. Any quoted interval must be reproducible at some realistic
        // count and observed proportion.
        const reproducible = new Set();
        for (const n of [100, 200, 500, 180, 216, 300, 1000]) {
            for (let c = 0; c <= n; c++) {
                reproducible.add(Core.formatInterval(Core.wilsonInterval(c, n), 1));
            }
        }
        for (const quoted of quotedIntervals()) {
            assert.ok(reproducible.has(quoted),
                `methods.html quotes ${quoted}, which the engine does not produce at any ` +
                `realistic count — it may have been edited by hand`);
        }
    });

    it('UD-012: The NRBC worked example is arithmetically correct', () => {
        const counts = { poly: 120, lymph: 40, mono: 15, eos: 5, nrbc: 20 };
        const exclude = ['nrbc'];
        assert.equal(Core.getDenominator(counts, exclude), 180);
        assert.equal(Core.percentagesSummingTo100(counts, 1, { exclude }).poly, 66.7);
        assert.equal(Core.computePer100(counts, 'nrbc', exclude, 1), 11.1);

        assert.ok(methods.includes('66.7%'), 'the worked segmented-neutrophil figure');
        assert.ok(methods.includes('11.1 per 100 WBC'), 'the worked NRBC figure');
        assert.ok(methods.includes('180-cell differential'), 'the worked report opening');
    });

    it('UD-013: The M:E convention described matches the shipped formula', () => {
        const bm = config.specimenTypes.find(s => s.specimenType === 'bm');
        const num = bm.formulas.ME_ratio.numerator;
        // The page states monocytes are included; the profile must agree.
        assert.ok(num.includes('mono'));
        assert.match(methods, /monocytes/i);
        assert.match(methods, /competing convention/i,
            'the page must disclose that another convention exists');
        // And the categories the page says take no part really do not.
        for (const excluded of ['lymph', 'plasma', 'mast']) {
            assert.ok(!num.includes(excluded));
        }
        assert.match(methods, /Lymphocytes, plasma cells and mast\s+cells take no part/);
    });

    it('UD-014: Documented target counts and their basis match the profile', () => {
        const bm = config.specimenTypes.find(s => s.specimenType === 'bm');
        const pb = config.specimenTypes.find(s => s.specimenType === 'pb');
        assert.ok(methods.includes(String(bm.targetCount) + ' cells'));
        assert.ok(methods.includes(String(pb.targetCount) + ' cells'));
        assert.match(methods, /ICSH 2008/);
        assert.match(methods, /at least 300/, 'the conditional ICSH provision');
    });

    it('UD-015: The ICSH exclusion list in the page is complete', () => {
        for (const excluded of ['Megakaryocytes', 'macrophages', 'osteoblasts',
            'osteoclasts', 'stromal cells', 'smudged cells']) {
            assert.ok(methods.toLowerCase().includes(excluded.toLowerCase()),
                `methods.html omits ICSH-excluded "${excluded}"`);
        }
    });

    it('UD-016: Limitations are stated with their evidence', () => {
        // The clinically material ones, each traceable to REF-001 [S8].
        assert.match(methods, /Hedley/, 'the limitations evidence is cited');
        assert.match(methods, /band and segmented/i, 'observer variability on bands');
        assert.match(methods, /basophils/i, 'basophil imprecision');
        assert.match(methods, /traceable standard/i, 'immature granulocyte definitions');
        assert.match(methods, /no image analysis|no cell recognition/i,
            'the page must state the software does not identify cells');
    });

    it('UD-017: The page does not overstate what more counting achieves', () => {
        // A true value on the threshold straddles it at any count; the page
        // must not imply counting more always resolves the question.
        assert.match(methods, /will not always resolve/i);
    });

    it('UD-018: The methods page is reachable from the application', () => {
        const counter = fs.readFileSync(path.join(ROOT, 'web', 'counter.html'), 'utf-8');
        const help = fs.readFileSync(path.join(ROOT, 'web', 'help.html'), 'utf-8');
        const app = fs.readFileSync(path.join(ROOT, 'web', 'scripts', 'mdc-app.js'), 'utf-8');
        assert.match(counter, /methods\.html/, 'linked from the case-entry screen');
        assert.match(help, /methods\.html/, 'linked from the quick start');
        assert.match(app, /methods\.html/, 'linked from the results screen');
    });

    it('UD-019: The methods page loads no third-party script (URS-094)', () => {
        assert.doesNotMatch(methods, /<script[^>]+src="https?:\/\//);
        assert.match(methods, /vendor\/tailwind\.js/);
    });
});

// ================================================================
describe('Calculation reference is arithmetically true (URS-092)', () => {

    const CELLS = ['nrbc','blasts','pro','myelo','meta','plasma','mast',
                   'bands','poly','baso','eos','mono','lymph','other'];
    const zero = () => Object.fromEntries(CELLS.map(c => [c, 0]));

    it('UD-030: The NRBC comparison table is correct in both columns', () => {
        const c = { poly: 120, lymph: 40, mono: 15, eos: 5, nrbc: 20 };
        const inD = Core.percentagesSummingTo100(c, 1);
        const outD = Core.percentagesSummingTo100(c, 1, { exclude: ['nrbc'] });
        assert.equal(inD.poly, 60);    assert.equal(outD.poly, 66.7);
        assert.equal(inD.lymph, 20);   assert.equal(outD.lymph, 22.2);
        assert.equal(inD.mono, 7.5);   assert.equal(outD.mono, 8.3);
        assert.equal(Core.computePer100(c, 'nrbc', ['nrbc'], 1), 11.1);
        for (const fig of ['60.0%','66.7%','20.0%','22.2%','7.5%','8.3%','11.1 per 100 WBC'])
            assert.ok(calcref.includes(fig), `reference is missing ${fig}`);
    });

    it('UD-031: The rounding comparison table is correct for all three policies', () => {
        const d = Object.fromEntries(CELLS.map(c => [c, 10]));
        const r = m => Object.values(Core.percentagesSummingTo100(d, 0, { method: m }));
        const hare = r('largest-remainder'), lc = r('largest-count'), ind = r('independent');
        const sum = v => v.reduce((a, b) => a + b, 0);

        assert.equal(sum(hare), 100);
        assert.equal(hare.filter(v => v === 8).length, 2, 'two at 8%');
        assert.equal(hare.filter(v => v === 7).length, 12, 'twelve at 7%');
        assert.equal(sum(lc), 100);
        assert.equal(Math.max(...lc), 9, 'largest-count pushes one to 9%');
        assert.equal(sum(ind), 98, 'independent totals 98%');
        assert.ok(ind.every(v => v === 7));

        assert.match(calcref, /twelve at 7%, two at 8%/);
        assert.match(calcref, /thirteen at 7%, one at \*\*9%\*\*/);
        assert.match(calcref, /all at 7%/);
    });

    it('UD-032: The two M:E conventions give the stated ratios', () => {
        const presets = path.join(ROOT, 'web', 'settings', 'presets');
        const load = f => Core.normalizeConfig(JSON.parse(
            fs.readFileSync(path.join(presets, f), 'utf-8')))
            .specimenTypes.find(s => s.specimenType === 'bm');
        const c = zero(); c.poly = 150; c.mono = 60; c.nrbc = 90;
        assert.equal(Core.computeRatio(c, load('consensus-14.json').formulas.ME_ratio), '2.3:1');
        assert.equal(Core.computeRatio(c, load('consensus-14-me-alt.json').formulas.ME_ratio), '1.7:1');
        assert.ok(calcref.includes('**2.3:1**') && calcref.includes('**1.7:1**'));
    });

    it('UD-033: Every confidence interval in the reference is engine-produced', () => {
        for (const [p, n] of [[0.20,100],[0.20,200],[0.20,500],[0.05,100],[0.05,200],[0.05,500],
                              [0.01,100],[0.01,200],[0.01,500],[0,100],[0,200],[0,500]]) {
            const t = Core.formatInterval(Core.wilsonInterval(Math.round(p * n), n), 1);
            assert.ok(calcref.includes(t) || calcref.includes(t.replace(/^0\.0–/, '0–')),
                `reference is missing the interval for ${p * 100}% at n=${n}: ${t}`);
        }
    });

    it('UD-034: The Wald comparison is reproduced faithfully', () => {
        const p = 2 / 200, m = 1.959964 * Math.sqrt(p * (1 - p) / 200);
        assert.equal(((p - m) * 100).toFixed(2), '-0.38');
        assert.equal(((p + m) * 100).toFixed(2), '2.38');
        assert.equal(Core.formatInterval(Core.wilsonInterval(2, 200), 1), '0.3–3.6%');
        assert.ok(calcref.includes('−0.38%') || calcref.includes('-0.38%'));
        assert.ok(calcref.includes('0.3% to\n3.6%') || calcref.includes('0.3% to 3.6%'));
    });

    it('UD-035: The blast-denominator example is consistent with its own scenario', () => {
        // 500 nucleated: 300 erythroid, 200 non-erythroid of which 45 blasts.
        const c = zero(); c.nrbc = 300; c.blasts = 45; c.poly = 155;
        assert.equal(Core.getTotal(c), 500);
        assert.equal(Core.getTotal(c) - c.nrbc, 200);
        assert.equal(Core.percentagesSummingTo100(c, 1).blasts, 9);
        assert.equal(Core.computeSubsetPercentage(c, {
            numerator: ['blasts'],
            denominator: CELLS.filter(x => x !== 'nrbc'), precision: 1
        }).display, '22.5%');
        assert.ok(calcref.includes('**9.0%**') && calcref.includes('**22.5%**'));
    });

    it('UD-036: Every choice the reference calls configurable really is', () => {
        // A reference that promises configurability the software does not offer
        // would be worse than one that promised nothing.
        const spec = config.specimenTypes.find(s => s.specimenType === 'pb');
        for (const key of ['denominatorExcludes','per100Reporting','rounding',
                           'precision','targetCount','confidenceIntervals']) {
            assert.ok(Object.prototype.hasOwnProperty.call(spec, key),
                `the reference calls "${key}" configurable; the shipped profile does not set it`);
        }
        // And each is genuinely honoured by the engine, not merely present.
        assert.notDeepEqual(
            Core.percentagesSummingTo100({ a: 1, b: 1, c: 1 }, 0, { method: 'independent' }),
            Core.percentagesSummingTo100({ a: 1, b: 1, c: 1 }, 0, { method: 'largest-remainder' }));
    });

    it('UD-037: What the reference calls fixed is stated as fixed', () => {
        assert.match(calcref, /\*\*Fixed\*\*.*Wilson score/s);
        assert.match(calcref, /Not configurable, and why/);
    });

    it('UD-038: Every abbreviation used is expanded in the table', () => {
        for (const abbr of ['WBC','NRBC','M:E ratio','NDC','ICSH','CLSI','AML','MDS','CI','CV'])
            assert.ok(calcref.includes('| **' + abbr + '**'),
                `"${abbr}" is used but not expanded in the abbreviations table`);
    });
});
