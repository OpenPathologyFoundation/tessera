/**
 * TEST SUITE 12: Standards Conformance
 * =====================================
 * Traces to: URS-012, URS-035, URS-105; REF-001 [S1]
 * FMEA: HA-090, HA-091
 *
 * Verifies that the shipped bone marrow profile implements the nucleated
 * differential count defined in ICSH 2008 §2.6, and that the M:E ratio follows
 * the definition given in the same section. These assertions exist so that a
 * future configuration change cannot silently drift away from the standard the
 * default profile claims to implement.
 *
 * Source (full text held in sources/):
 *   Lee S-H, Erber WN, Porwit A, Tomonaga M, Peterson LC, for the ICSH.
 *   ICSH guidelines for the standardization of bone marrow specimens and
 *   reports. Int J Lab Hematol 2008;30(5):349-364.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));

const CONFIG_PATH = path.join(__dirname, '..', 'web', 'settings', 'templates.json');
const config = Core.normalizeConfig(JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')));
const bm = config.specimenTypes.find(s => s.specimenType === 'bm');

/**
 * ICSH 2008 §2.6: "The NDC should comprise blast cells, promyelocytes,
 * myelocytes, metamyelocytes, band forms, segmented neutrophils, eosinophils,
 * basophils, mast cells, promonocytes and monocytes, lymphocytes, plasma cells
 * and erythroblasts."
 */
const ICSH_NDC = {
    blasts: 'blast cells',
    pro: 'promyelocytes',
    myelo: 'myelocytes',
    meta: 'metamyelocytes',
    bands: 'band forms',
    poly: 'segmented neutrophils',
    eos: 'eosinophils',
    baso: 'basophils',
    mast: 'mast cells',
    mono: 'promonocytes and monocytes',
    lymph: 'lymphocytes',
    plasma: 'plasma cells',
    nrbc: 'erythroblasts'
};

/**
 * ICSH 2008 §2.6: the M:E ratio expresses "all granulocytes and monocytes and
 * their precursors (i.e. myeloblasts, promyelocytes, myelocytes,
 * metamyelocytes, band forms, segmented neutrophils, eosinophils, basophils,
 * promonocytes and monocytes) to erythroblasts (at all stages of
 * differentiation)."
 */
const ICSH_ME_NUMERATOR = ['blasts', 'pro', 'myelo', 'meta', 'bands', 'poly', 'eos', 'baso', 'mono'];
const ICSH_ME_DENOMINATOR = ['nrbc'];

/** ICSH 2008 §2.6 explicitly excludes these from the NDC. */
const ICSH_NDC_EXCLUDED = [
    'megakaryocytes', 'macrophages', 'osteoblasts', 'osteoclasts',
    'stromal cells', 'smudged cells', 'metastatic tumour cells'
];

const bmCells = () => bm.categories.upper.concat(bm.categories.lower);

// ================================================================
describe('ICSH conformance — nucleated differential count (§2.6)', () => {

    it('SC-001: Every ICSH NDC category is present in the bone marrow profile', () => {
        const present = bmCells();
        for (const [id, name] of Object.entries(ICSH_NDC)) {
            assert.ok(present.includes(id),
                `ICSH NDC category "${name}" (${id}) is missing from the shipped profile`);
        }
    });

    it('SC-002: Every ICSH NDC category has a keyboard key', () => {
        const mapped = new Set(Object.values(bm.outCodes));
        for (const [id, name] of Object.entries(ICSH_NDC)) {
            assert.ok(mapped.has(id), `"${name}" (${id}) has no key and cannot be counted`);
        }
    });

    it('SC-003: Any category beyond the ICSH list carries scope guidance', () => {
        // ICSH excludes specific cell types from the NDC. A general-purpose
        // category invites counting them, which would enter the denominator
        // and depress every reported percentage (HA-090).
        const extra = bmCells().filter(ct => !Object.prototype.hasOwnProperty.call(ICSH_NDC, ct));
        for (const ct of extra) {
            assert.ok(bm.categoryNotes && bm.categoryNotes[ct],
                `category "${ct}" is not in the ICSH NDC and has no categoryNotes guidance`);
        }
    });

    it('SC-004: The guidance names the cell types ICSH excludes', () => {
        const note = (bm.categoryNotes && bm.categoryNotes.other) || '';
        for (const excluded of ICSH_NDC_EXCLUDED) {
            const stem = excluded.split(' ')[0].replace(/s$/, '');
            assert.ok(note.toLowerCase().includes(stem.toLowerCase()),
                `guidance for "other" does not mention ICSH-excluded "${excluded}"`);
        }
        assert.match(note, /ICSH/, 'guidance should cite its source');
    });
});

// ================================================================
describe('ICSH conformance — M:E ratio definition (§2.6)', () => {

    it('SC-010: The M:E numerator is exactly the ICSH set', () => {
        const f = bm.formulas.ME_ratio;
        assert.deepEqual([...f.numerator].sort(), [...ICSH_ME_NUMERATOR].sort());
    });

    it('SC-011: The M:E denominator is erythroblasts at all stages', () => {
        assert.deepEqual([...bm.formulas.ME_ratio.denominator].sort(), [...ICSH_ME_DENOMINATOR].sort());
    });

    it('SC-012: Lymphocytes, plasma cells, mast cells and other are excluded from M:E', () => {
        const f = bm.formulas.ME_ratio;
        const all = f.numerator.concat(f.denominator);
        for (const excluded of ['lymph', 'plasma', 'mast', 'other']) {
            assert.ok(!all.includes(excluded),
                `"${excluded}" must not participate in the M:E ratio per ICSH §2.6`);
        }
    });

    it('SC-013: A worked ICSH example computes correctly', () => {
        // 300 myeloid-lineage cells over 100 erythroblasts = 3.0:1,
        // within the 2:1-4:1 range ICSH describes as normal.
        const counts = {};
        bmCells().forEach(ct => { counts[ct] = 0; });
        ICSH_ME_NUMERATOR.forEach((ct, i) => { counts[ct] = i === 0 ? 300 - 8 * 1 : 1; });
        counts.nrbc = 100;
        assert.equal(Core.getTotal(counts) - counts.nrbc, 300);
        assert.equal(Core.computeRatio(counts, bm.formulas.ME_ratio), '3.0:1');
    });

    it('SC-014: Monocytes contribute to the numerator, as ICSH specifies', () => {
        // The competing convention excludes them; this test pins the shipped
        // default to ICSH so a silent change is caught.
        const counts = {};
        bmCells().forEach(ct => { counts[ct] = 0; });
        counts.mono = 50;
        counts.nrbc = 50;
        assert.equal(Core.computeRatio(counts, bm.formulas.ME_ratio), '1.0:1',
            'monocytes must be included in the M:E numerator per ICSH §2.6');
    });
});

// ================================================================
describe('ICSH conformance — target cell counts (§2.6)', () => {

    it('SC-020: The bone marrow default target is the ICSH 500-cell figure', () => {
        assert.equal(bm.targetCount, 500);
    });

    it('SC-021: The schema can express the ICSH 300-cell provision', () => {
        // "At least 300 cells should be counted if the NDC is not essential to
        // the diagnosis." A profile must be able to say this.
        const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        raw.specimenTypes[0].targetCount = 300;
        const norm = Core.normalizeConfig(raw);
        assert.equal(Core.validateConfig(norm.specimenTypes).length, 0);
        assert.equal(norm.specimenTypes[0].targetCount, 300);
        assert.ok(Core.buildLowCountNote(299, 300), 'advisory still applies at the lower target');
        assert.equal(Core.buildLowCountNote(300, 300), null);
    });

    it('SC-022: The total number of cells counted is reportable (§2.6)', () => {
        // ICSH: "The total number of cells counted in the NDC should be stated
        // in the report."
        for (const tpl of bm.templates) {
            assert.match(tpl.outSentence, /\{\{total\}\}/,
                `template "${tpl.tplCode}" must state the total cells counted`);
        }
    });
});

// ================================================================
describe('Provenance of the shipped profile (URS-055)', () => {

    it('SC-030: The profile declares the standard it implements', () => {
        assert.ok(config.provenance, 'the shipped profile must declare its basis');
        assert.match(config.provenance.citation, /ICSH/);
        assert.match(config.provenance.citation, /2008/);
        assert.match(config.provenance.citation, /Int J Lab Hematol/);
    });

    it('SC-031: The M:E formula records the convention it follows', () => {
        const basis = bm.formulas.ME_ratio.basis;
        assert.ok(basis, 'a formula with a competing convention must state which it uses');
        assert.match(basis, /ICSH 2008/);
        // The disagreement itself is recorded, so a reader is not left to
        // assume there is only one convention.
        assert.match(basis, /competing convention/i);
    });

    it('SC-032: The target count records the conditional ICSH rule', () => {
        assert.match(bm.targetCountBasis, /500/);
        assert.match(bm.targetCountBasis, /300/);
        assert.match(bm.targetCountBasis, /ICSH 2008/);
    });

    it('SC-033: Every specimen type produces a usable method statement', () => {
        for (const spec of config.specimenTypes) {
            const entries = Core.buildMethodStatement(spec, config);
            assert.ok(entries.length >= 2, `${spec.specimenType}: statement too thin`);
            const text = Core.formatMethodStatement(entries, ' ');
            assert.ok(text.length > 40);
            assert.doesNotMatch(text, /undefined|\[object/);
        }
    });
});

// ================================================================
describe('Both M:E conventions are offered (URS-035)', () => {

    const presetDir = path.join(__dirname, '..', 'web', 'settings', 'presets');
    const load = f => Core.normalizeConfig(
        JSON.parse(fs.readFileSync(path.join(presetDir, f), 'utf-8')));

    /**
     * The alternative M:E convention used to ship as its own preset file. That
     * file was a fork of consensus-14 differing in one field, and the forking
     * pattern had already cost correctness twice (HA-104; six presets missing
     * confidenceIntervals). It was removed under DCR-020.
     *
     * The requirement is not that a FILE exists — it is that both conventions
     * are available, give different answers, and each says which produced a
     * number. That is what these now verify, against the engine and the
     * editor control that composes the formula.
     */
    it('SC-040: The alternative convention is composable and valid', () => {
        const base = load('consensus-14.json');
        const bm = base.specimenTypes.find(s => s.specimenType === 'bm');
        assert.ok(bm.formulas.ME_ratio.numerator.includes('mono'),
            'the shipped default follows ICSH 2008 §2.6 and includes monocytes');

        // The alternative is the same profile with monocytes removed from the
        // numerator — one checkbox in the Counting Policy panel.
        const alt = JSON.parse(JSON.stringify(base));
        const altBm = alt.specimenTypes.find(s => s.specimenType === 'bm');
        altBm.formulas.ME_ratio.numerator =
            altBm.formulas.ME_ratio.numerator.filter(ct => ct !== 'mono');
        assert.equal(Core.validateConfig(alt.specimenTypes).length, 0,
            'the alternative convention must be a valid profile');
    });

    it('SC-041: The editor exposes the formula composition (URS-035)', () => {
        // An alternative a laboratory cannot reach is not an option. It is
        // reached through the Counting Policy panel rather than a preset.
        const editor = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'scripts', 'config-editor.js'), 'utf-8');
        assert.match(editor, /pol-f-member/,
            'the editor must expose numerator and denominator membership');
        assert.match(editor, /merged\.formulas = /,
            'and must write the composition back into the saved profile');
    });

    it('SC-042: The two conventions give different ratios from identical counts', () => {
        const bm = load('consensus-14.json').specimenTypes.find(s => s.specimenType === 'bm');
        const icsh = bm.formulas.ME_ratio;
        const alt = Object.assign({}, icsh,
            { numerator: icsh.numerator.filter(ct => ct !== 'mono') });

        const c = {};
        Object.values(bm.outCodes).forEach(ct => { c[ct] = 0; });
        c.poly = 150; c.mono = 60; c.nrbc = 90;

        const a = Core.computeRatio(c, icsh);
        const b = Core.computeRatio(c, alt);
        assert.notEqual(a, b, 'if they agreed there would be no choice to make');
        assert.equal(a, '2.3:1');
        assert.equal(b, '1.7:1');
    });

    it('SC-043: The convention in force is stated, so a report is interpretable', () => {
        const cfg = load('consensus-14.json');
        const bm = cfg.specimenTypes.find(s => s.specimenType === 'bm');
        assert.ok(bm.formulas.ME_ratio.basis, 'no stated basis for the M:E ratio');
        assert.match(bm.formulas.ME_ratio.basis, /monocytes/i,
            'the basis must name the contested element');
        const text = Core.formatMethodStatement(Core.buildMethodStatement(bm, cfg), ' ');
        assert.match(text, /M:E|myeloid/i,
            'the method statement must carry the convention into the report');
    });
});

// ================================================================
describe('Target counts are attributed to what the sources say (C-2, C-4)', () => {

    /**
     * Independent review, C-2 and C-4. Two target figures were mis-attributed,
     * and both readings claimed more than the sources support.
     */

    it('SC-050: The 200-cell target is not presented as the CLSI reference method', () => {
        // CLSI H20-A2's reference method is TWO reviewers counting 200 cells
        // each — 400 in total (REF-001 [S8], quoting it verbatim). 200 is one
        // observer's share, which is what routine single-observer practice
        // does. This application implements a single-observer workflow and
        // therefore does not perform that method; saying "200 per CLSI H20-A2"
        // reads as a conformance claim it cannot support.
        // Comment prose wraps, so line breaks and `//` markers are flattened
        // before matching — otherwise the assertion tests the formatter.
        const engine = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'), 'utf-8')
            .replace(/\n\s*\/\/\s*/g, ' ');
        assert.match(engine, /TWO\s+reviewers counting 200 cells each/i,
            'the engine must record that the reference method is two observers');
        assert.match(engine, /400 in total/,
            'and that the method totals 400 cells, not 200');
        assert.ok(!/PB: 200 per CLSI H20-A2/.test(engine),
            'the engine still attributes the 200-cell target to CLSI as though it were the method');

        for (const spec of config.specimenTypes) {
            const basis = spec.targetCountBasis || '';
            if (!/CLSI/.test(basis)) continue;
            assert.match(basis, /one observer|two reviewers/i,
                `${spec.specimenType}: the basis presents 200 as the reference method itself`);
        }
    });

    it('SC-051: The 500-cell marrow target is attributed to ICSH, not CAP', () => {
        // REF-001 §3.3 recorded the "CAP recommendation" attribution as an
        // error; the engine comment still carried it.
        const engine = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'), 'utf-8');
        assert.ok(!/500 per CAP recommendation/.test(engine),
            'the engine still attributes the 500-cell marrow target to a CAP recommendation');
        const bm = config.specimenTypes.find(s => s.specimenType === 'bm');
        assert.match(bm.targetCountBasis || '', /ICSH 2008/,
            'the marrow target must be attributed to ICSH 2008 §2.6');
    });

    it('SC-052: The marrow target basis states the ICSH condition', () => {
        // ICSH makes 500 conditional: at least 500 when a precise percentage of
        // an abnormal cell type is required for the diagnosis, at least 300
        // when the differential is not essential to it.
        const bm = config.specimenTypes.find(s => s.specimenType === 'bm');
        const basis = bm.targetCountBasis || '';
        assert.match(basis, /300/, 'the basis must state the lower conditional figure');
        assert.match(basis, /not essential/i, 'and the condition under which it applies');
    });

    it('SC-053: A sub-target advisory carries the basis for the target', () => {
        // Without the condition in view the advisory over-warns: a marrow
        // examined for staging reads as deficient at 300 cells when the
        // standard would not require more. The basis is stated, not acted on —
        // the operator knows what the count is for; the software does not.
        const bm = config.specimenTypes.find(s => s.specimenType === 'bm');
        const note = Core.buildLowCountNote(300, bm.targetCount, 0.95, bm.targetCountBasis);
        assert.ok(note, 'a 300-cell count against a 500 target must produce an advisory');
        assert.match(note, /300-cell count \(target 500\)/);
        assert.match(note, /confidence interval/, 'it must still quantify the imprecision');
        assert.match(note, /Basis for the target: .*ICSH 2008/,
            'and must state why 500 is the target, so the operator can judge');

        // Omitted where a profile states no basis, rather than inventing one.
        assert.ok(!/Basis for the target/.test(
            Core.buildLowCountNote(300, 500, 0.95, undefined) || ''));
    });
});
