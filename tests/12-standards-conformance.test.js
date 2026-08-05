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
