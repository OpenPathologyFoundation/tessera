/**
 * TEST SUITE 09: Preset Catalog
 * ===============================
 * Validates all preset JSON files in web/settings/presets/.
 * Each preset must be valid JSON, follow the v2 schema, and have valid cell/key mappings.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PRESETS_DIR = path.join(__dirname, '..', 'web', 'settings', 'presets');

const expectedPresets = [
    'ndc-14.json',
    'gran-combined-10.json',
    'bands-segs-10.json',
    'analyzer-5.json',
    'body-fluid.json',
    'mdc-2015-9.json',
    'custom.json'
];

describe('Preset Catalog — File Existence', () => {

    it('VV-PRE-001: Presets directory exists', () => {
        assert.ok(fs.existsSync(PRESETS_DIR), 'web/settings/presets/ must exist');
    });

    expectedPresets.forEach(function (filename) {
        it('VV-PRE-002: Preset file exists: ' + filename, () => {
            const fp = path.join(PRESETS_DIR, filename);
            assert.ok(fs.existsSync(fp), filename + ' must exist in presets directory');
        });
    });
});

describe('Preset Catalog — JSON Validity', () => {

    expectedPresets.forEach(function (filename) {
        it('VV-PRE-003: ' + filename + ' is valid JSON', () => {
            const fp = path.join(PRESETS_DIR, filename);
            const raw = fs.readFileSync(fp, 'utf-8');
            assert.doesNotThrow(() => JSON.parse(raw), filename + ' must be valid JSON');
        });
    });
});

describe('Preset Catalog — Schema Conformance', () => {

    expectedPresets.forEach(function (filename) {
        it('VV-PRE-004: ' + filename + ' has required v2 wrapper fields', () => {
            const fp = path.join(PRESETS_DIR, filename);
            const config = JSON.parse(fs.readFileSync(fp, 'utf-8'));

            assert.ok(typeof config.version === 'string', filename + ': must have version');
            assert.ok(typeof config.profileId === 'string', filename + ': must have profileId');
            assert.ok(typeof config.profileName === 'string', filename + ': must have profileName');
            assert.ok(Array.isArray(config.specimenTypes), filename + ': must have specimenTypes array');
            assert.ok(config.specimenTypes.length >= 1, filename + ': must have at least 1 specimen type');
        });

        it('VV-PRE-005: ' + filename + ' specimen types have required fields', () => {
            const fp = path.join(PRESETS_DIR, filename);
            const config = JSON.parse(fs.readFileSync(fp, 'utf-8'));

            for (const spec of config.specimenTypes) {
                assert.ok(typeof spec.specimenType === 'string' && spec.specimenType.length > 0,
                    filename + '/' + spec.specimenType + ': must have specimenType');
                assert.ok(typeof spec.targetCount === 'number' && spec.targetCount > 0,
                    filename + '/' + spec.specimenType + ': targetCount must be positive number');
                assert.ok(typeof spec.categories === 'object',
                    filename + '/' + spec.specimenType + ': must have categories');
                assert.ok(Array.isArray(spec.categories.upper),
                    filename + '/' + spec.specimenType + ': categories.upper must be array');
                assert.ok(Array.isArray(spec.categories.lower),
                    filename + '/' + spec.specimenType + ': categories.lower must be array');
                assert.ok(typeof spec.outCodes === 'object',
                    filename + '/' + spec.specimenType + ': must have outCodes');
                assert.ok(Array.isArray(spec.templates),
                    filename + '/' + spec.specimenType + ': must have templates array');
            }
        });

        it('VV-PRE-006: ' + filename + ' outCodes values match category cell types (except custom)', () => {
            if (filename === 'custom.json') return; // Custom template is empty by design
            const fp = path.join(PRESETS_DIR, filename);
            const config = JSON.parse(fs.readFileSync(fp, 'utf-8'));

            for (const spec of config.specimenTypes) {
                if (Object.keys(spec.outCodes).length === 0) continue; // Empty outCodes (custom)
                const outValues = new Set(Object.values(spec.outCodes));
                const allCats = [...spec.categories.upper, ...spec.categories.lower];
                for (const ct of allCats) {
                    assert.ok(outValues.has(ct),
                        filename + '/' + spec.specimenType + ': category "' + ct + '" not in outCodes');
                }
            }
        });

        it('VV-PRE-007: ' + filename + ' has no duplicate outCode keys per specimen', () => {
            const fp = path.join(PRESETS_DIR, filename);
            const config = JSON.parse(fs.readFileSync(fp, 'utf-8'));

            for (const spec of config.specimenTypes) {
                const keys = Object.keys(spec.outCodes);
                const unique = new Set(keys);
                assert.equal(unique.size, keys.length,
                    filename + '/' + spec.specimenType + ': duplicate outCode keys');
            }
        });
    });
});

const ERGO_ZONES = {
    left:  ['F','D','S','A','G','V','C','X','Z','B','R','E','W','Q','T'],
    right: ['J','K','L',';','H','M',',','.','/','N','O','I','U','Y','P']
};

describe('Preset Catalog — Ergonomic Zone Validation', () => {

    const leftPresets = ['ndc-14.json', 'gran-combined-10.json', 'bands-segs-10.json', 'analyzer-5.json',
        'body-fluid.json', 'mdc-2015-9.json'];

    leftPresets.forEach(function (filename) {
        it('VV-PRE-008: ' + filename + ' left-hand preset keys are within left ergonomic zone', () => {
            const fp = path.join(PRESETS_DIR, filename);
            const config = JSON.parse(fs.readFileSync(fp, 'utf-8'));
            for (const spec of config.specimenTypes) {
                const keys = Object.keys(spec.outCodes);
                for (const key of keys) {
                    assert.ok(ERGO_ZONES.left.indexOf(key) !== -1,
                        filename + '/' + spec.specimenType + ': key "' + key + '" is outside left ergonomic zone');
                }
            }
        });
    });

    it('VV-PRE-009: The right-hand key layout is still reachable, as an editor action', () => {
        // The `right-hand` preset was a fork of ndc-14 differing only in
        // key assignment — and it shipped with four categories that could not
        // be un-counted (HA-104), because a forked file is a place for a defect
        // to hide from the profile it was copied from. The layout is not lost:
        // the editor assigns it.
        const editor = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'scripts', 'config-editor.js'), 'utf-8');
        assert.match(editor, /btnAutoRight/,
            'the right-hand auto-assignment must remain available in the editor');
        assert.match(editor, /right:\s*\[/,
            'the right-hand ergonomic zone must still be defined');
    });
});

describe('Preset Catalog — Specific Presets', () => {

    it('VV-PRE-010: ndc-14 has 14 cell types per specimen', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'ndc-14.json'), 'utf-8'));
        for (const spec of config.specimenTypes) {
            assert.equal(Object.keys(spec.outCodes).length, 14,
                spec.specimenType + ': must have 14 key mappings');
        }
    });

    it('VV-PRE-011: analyzer-5 has 5 cell types', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'analyzer-5.json'), 'utf-8'));
        const spec = config.specimenTypes[0];
        assert.equal(Object.keys(spec.outCodes).length, 5, 'Must have 5 key mappings');
    });

    it('VV-PRE-012: Handedness remains a per-profile field', () => {
        // Not dead schema: it drives the editor's "key outside the ergonomic
        // zone" warning. It is editor-scoped, which is not the same as unused.
        const editor = fs.readFileSync(
            path.join(__dirname, '..', 'web', 'scripts', 'config-editor.js'), 'utf-8');
        assert.match(editor, /isInErgoZone\(key, spec\.handedness/,
            'handedness must still select the ergonomic zone');
    });

    it('VV-PRE-013: body-fluid has bf specimen type', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'body-fluid.json'), 'utf-8'));
        assert.ok(config.specimenTypes.some(s => s.specimenType === 'bf'), 'Must have bf specimen');
    });

    it('VV-PRE-014: body-fluid has morphology checklist items', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'body-fluid.json'), 'utf-8'));
        const bf = config.specimenTypes.find(s => s.specimenType === 'bf');
        assert.ok(bf.morphologyChecklist.length > 0, 'Body fluid must have morph checklist items');
    });

    it('VV-PRE-015: gran-combined-10 has constituents defined', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'gran-combined-10.json'), 'utf-8'));
        const bm = config.specimenTypes.find(s => s.specimenType === 'bm');
        assert.ok(bm.constituents && bm.constituents.gran, 'Harmonized-9 BM must have gran constituent');
        assert.ok(Array.isArray(bm.constituents.gran.members), 'Gran constituent must have members array');
    });

    it('VV-PRE-016: custom preset has empty categories', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'custom.json'), 'utf-8'));
        const spec = config.specimenTypes[0];
        assert.equal(spec.categories.upper.length, 0, 'Custom upper must be empty');
        assert.equal(spec.categories.lower.length, 0, 'Custom lower must be empty');
        assert.equal(Object.keys(spec.outCodes).length, 0, 'Custom outCodes must be empty');
    });
});

// ================================================================
describe('Preset Catalog — Denominator Policy (URS-030, HA-092)', () => {

    /**
     * A preset changes the layout, the keys and the wording. It must not
     * silently change the counting convention.
     *
     * Every shipped preset that displayed NRBC in a peripheral blood specimen
     * omitted `denominatorExcludes`. Loading one therefore counted NRBC into
     * the leucocyte differential — the exact hazard DCR-006 exists to prevent.
     * Measured on 180 granulocytes + 20 NRBC: 100.0% granulocytes with the
     * built-in profile, 90.0% after choosing the gran-combined-10 preset.
     *
     * The catalogue is a set of starting points, so the safe convention has to
     * be the one they start from.
     */
    const BUILTIN = JSON.parse(fs.readFileSync(
        path.join(__dirname, '..', 'web', 'settings', 'templates.json'), 'utf-8'));

    /** Specimens that display NRBC but are not marrow, where NRBC belong in the count. */
    function nucleatedRedInNonMarrow(config) {
        return (config.specimenTypes || []).filter(spec => {
            if (spec.specimenType === 'bm') return false;
            const cats = spec.categories || {};
            return [].concat(cats.upper || [], cats.lower || []).indexOf('nrbc') !== -1;
        });
    }

    expectedPresets.forEach(function (filename) {
        it('VV-PRE-017: ' + filename + ' excludes NRBC from any non-marrow differential', () => {
            const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, filename), 'utf-8'));
            for (const spec of nucleatedRedInNonMarrow(config)) {
                assert.ok(Array.isArray(spec.denominatorExcludes) &&
                    spec.denominatorExcludes.indexOf('nrbc') !== -1,
                    `${filename} (${spec.specimenType}) counts NRBC but leaves them in the ` +
                    'denominator, understating every leucocyte percentage (HA-092)');
                assert.ok(spec.per100Reporting && spec.per100Reporting.nrbc,
                    `${filename} (${spec.specimenType}) excludes NRBC from the denominator but ` +
                    'never reports them per 100 WBC, so the count is simply lost');
            }
        });
    });

    it('VV-PRE-018: A preset sharing the built-in profileId is the built-in profile', () => {
        // isCacheSuperseded discards a cached profile when a built-in one with
        // the SAME profileId carries a higher version. ndc-14.json was
        // v2.0 against the built-in v2.5, so choosing it from the catalogue
        // was undone on the next load. It was also missing thresholds,
        // confidenceIntervals, categoryNotes and the denominator policy.
        const twins = expectedPresets
            .map(f => ({ f, c: JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, f), 'utf-8')) }))
            .filter(x => x.c.profileId === BUILTIN.profileId);
        assert.ok(twins.length > 0, 'the catalogue must offer the built-in profile');

        for (const { f, c } of twins) {
            const cmp = (a, b) => {
                const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
                for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
                    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
                }
                return 0;
            };
            assert.ok(cmp(c.version, BUILTIN.version) >= 0,
                `${f} is version ${c.version} against the built-in ${BUILTIN.version}; the counter ` +
                'would discard it as superseded on the next load');

            for (const shipped of BUILTIN.specimenTypes) {
                const preset = c.specimenTypes.find(s => s.specimenType === shipped.specimenType);
                assert.ok(preset, `${f} is missing the ${shipped.specimenType} specimen`);
                for (const key of Object.keys(shipped)) {
                    assert.deepEqual(preset[key], shipped[key],
                        `${f} (${shipped.specimenType}) differs from the built-in profile in "${key}", ` +
                        'yet claims the same profileId');
                }
            }
        }
    });
});

// ================================================================
describe('Preset Catalog — No Redundant Forks', () => {

    /**
     * Nine files held six distinct layouts. Eight of fifteen specimen
     * definitions were the identical 14-category panel, differing only in key
     * assignment or M:E composition — both FIELDS inside a profile, editable
     * in the Configuration Editor.
     *
     * The forking cost correctness twice: `right-hand` shipped with four
     * categories that could not be un-counted (HA-104), and six of eight
     * presets silently omitted `confidenceIntervals` (P0-9).
     */
    it('VV-PRE-019: No two presets are the same layout with the same keys', () => {
        // Compared ACROSS files, not within one. A profile deliberately uses
        // the same keys for bone marrow and peripheral blood — an operator
        // should not relearn the keyboard when the specimen changes.
        const shapeOf = (config) => JSON.stringify((config.specimenTypes || [])
            .filter(s => (s.categories || {}).upper && s.categories.upper.length)
            .map(s => [
                s.specimenType,
                s.categories.upper.slice().sort(),
                (s.categories.lower || []).slice().sort(),
                Object.entries(s.outCodes || {}).sort()
            ]));

        const seen = new Map();
        for (const filename of expectedPresets) {
            const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, filename), 'utf-8'));
            const shape = shapeOf(config);
            if (shape === '[]') continue;                 // custom.json is blank
            if (seen.has(shape)) {
                assert.fail(`${filename} is identical in layout and keys to ${seen.get(shape)} — ` +
                    'it is the same profile under two names. Key assignment and M:E composition ' +
                    'are fields, editable in the Configuration Editor, not reasons to fork a file');
            }
            seen.set(shape, filename);
        }
    });

    it('VV-PRE-020: Every selectable preset configures confidence intervals (P0-9)', () => {
        // Intervals displayed at the 0.95 default while the method statement
        // omitted the disclosure, because only one preset set the field.
        for (const filename of expectedPresets) {
            if (filename === 'custom.json') continue;   // deliberately blank
            const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, filename), 'utf-8'));
            for (const spec of config.specimenTypes || []) {
                if (!(spec.categories && spec.categories.upper.length)) continue;
                assert.ok(spec.confidenceIntervals,
                    `${filename} (${spec.specimenType}) does not configure confidenceIntervals, ` +
                    'so intervals display at a default level the report never states');
            }
        }
    });
});

// ================================================================
describe('The predecessor profile reproduces the predecessor (URS-101)', () => {

    /**
     * `mdc-2015-9` exists so an operator who used the 2015 Backbone/JSP counter
     * — retained at `legacy/`, described in DCR-004 — can switch without
     * relearning the keyboard.
     *
     * Its configuration was not transcribed from memory or from the old source
     * by eye. It was recovered from `web/settings/templates.json` at commit
     * aa88da4 and then confirmed by executing that application under Playwright
     * and reading what it produced (DCR-032). The constants below are what the
     * running predecessor was measured to do, and they are the specification
     * this preset is held to.
     *
     * NOTE the deliberate divergence, decided by the Document Owner: the
     * layout, keys, minimums and report sentences are the predecessor's; the
     * arithmetic is this application's. VV-PRE-024 states why in the one case
     * where it changes a reported value.
     */
    const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));
    const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'mdc-2015-9.json'), 'utf-8'));
    const cfg = Core.normalizeConfig(raw);
    const spec = t => cfg.specimenTypes.find(s => s.specimenType === t);

    /** Measured from the running predecessor, 2026-08-07. */
    const PREDECESSOR = {
        bm: {
            minCellCount: 200,
            outCodes: { A: 'blast', S: 'pro', D: 'gran', F: 'eryth', Z: 'baso',
                        X: 'eos', C: 'plasma', V: 'lymph', B: 'mono' },
            templates: ['ysm', 'pdx', 'mgh']
        },
        pb: {
            minCellCount: 100,
            outCodes: { A: 'poly', S: 'band', D: 'lymph', F: 'mono', Z: 'eos',
                        X: 'baso', C: 'pro', V: 'blast', B: 'other' },
            templates: ['mgh']
        }
    };

    /** Predecessor cell id -> this application's vocabulary. */
    const RENAMED = { blast: 'blasts', eryth: 'nrbc', band: 'bands' };
    const canonical = id => RENAMED[id] || id;

    it('VV-PRE-021: Every key maps to the category the predecessor mapped it to', () => {
        for (const [type, want] of Object.entries(PREDECESSOR)) {
            const got = spec(type).outCodes;
            const expected = {};
            for (const [k, v] of Object.entries(want.outCodes)) expected[k] = canonical(v);
            assert.deepEqual(got, expected,
                `${type}: the key layout differs from the predecessor's, so a returning ` +
                'operator would be counting the wrong cell type on a familiar key');
        }
    });

    it('VV-PRE-022: The keys are the predecessor\'s nine, in its order', () => {
        for (const type of Object.keys(PREDECESSOR)) {
            const s = spec(type);
            assert.deepEqual(Object.keys(s.outCodes), ['A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V', 'B']);
            // The row split follows the physical keyboard rows the predecessor
            // used: ASDF above, ZXCVB below.
            assert.deepEqual(s.categories.upper.length, 4, `${type}: upper row is not ASDF`);
            assert.deepEqual(s.categories.lower.length, 5, `${type}: lower row is not ZXCVB`);
        }
    });

    it('VV-PRE-023: The minimums and report templates are the predecessor\'s', () => {
        for (const [type, want] of Object.entries(PREDECESSOR)) {
            const s = spec(type);
            assert.equal(s.targetCount, want.minCellCount,
                `${type}: target differs from the predecessor's minimum`);
            assert.deepEqual(s.templates.map(t => t.tplCode), want.templates,
                `${type}: the institutional report templates differ`);
        }
    });

    it('VV-PRE-024: A counted cell is never reported as absent', () => {
        /**
         * The predecessor rounded each category independently to a whole
         * number. Driven through it, a marrow with ONE blast in 201 cells
         * printed "0% blasts", and its nine figures summed to 99.
         *
         * Both behaviours are reproducible by this engine — `independent`
         * rounding at zero decimals gives exactly what the old tool printed,
         * which is how the reading of its arithmetic was confirmed. The
         * shipped profile deliberately does not use it.
         */
        const counts = { blasts: 1, pro: 0, gran: 99, nrbc: 50, baso: 0,
                         eos: 0, plasma: 0, lymph: 25, mono: 26 };
        const order = ['blasts', 'pro', 'gran', 'nrbc', 'baso', 'eos', 'plasma', 'lymph', 'mono'];

        // What the predecessor printed, reproduced.
        const old = Core.percentagesSummingTo100(counts, 0, { method: 'independent' });
        assert.equal(old.blasts, 0, 'the predecessor reported the blast as 0% — if this ' +
            'no longer reproduces, the comparison below is meaningless');
        assert.equal(order.reduce((a, k) => a + old[k], 0), 99);

        // What this profile reports.
        const bm = spec('bm');
        const now = Core.percentagesSummingTo100(counts, bm.precision.report, { method: bm.rounding });
        assert.ok(now.blasts > 0,
            'a blast that was counted is reported as 0% — the defect this profile exists not to inherit');
        assert.equal(order.reduce((a, k) => a + now[k], 0).toFixed(1), '100.0',
            'the reported percentages must sum to 100');
    });

    it('VV-PRE-025: The M:E field the predecessor left blank is computed', () => {
        // Its Precipio DX template reserved "M:E ratio | _ | 2 - 4:1" and
        // printed the underscore literally; the ratio was never implemented.
        const bm = spec('bm');
        const pdx = bm.templates.find(t => t.tplCode === 'pdx');
        assert.ok(pdx, 'the Precipio DX template is missing');
        assert.ok(!/M:E ratio \| _ \|/.test(pdx.outSentence),
            'the M:E field is still the predecessor\'s literal underscore');
        assert.match(pdx.outSentence, /\{\{ME_ratio\}\}/, 'the M:E field is not bound to the formula');

        const counts = { blasts: 1, pro: 0, gran: 99, nrbc: 50, baso: 0,
                         eos: 0, plasma: 0, lymph: 25, mono: 26 };
        assert.match(Core.computeRatio(counts, bm.formulas.ME_ratio), /^\d+\.\d:1$/);
        // Lymphocytes and plasma cells take no part, per ICSH §2.6.
        for (const excluded of ['lymph', 'plasma']) {
            assert.ok(!bm.formulas.ME_ratio.numerator.includes(excluded) &&
                      !bm.formulas.ME_ratio.denominator.includes(excluded),
                `${excluded} must not participate in the M:E ratio`);
        }
    });

    it('VV-PRE-026: The profile declares that it is coarser than ICSH', () => {
        // `gran` is one key for myelocytes, metamyelocytes, bands and segs. A
        // count taken here cannot be reported against the ICSH nucleated
        // differential without re-counting, and an operator choosing this
        // profile for its familiarity must be told so.
        assert.match(raw.provenance.notes, /COARSER|coarser/,
            'the provenance does not warn that the categories are aggregated');
        assert.match(raw.provenance.notes, /ndc-14/,
            'the provenance does not name the profile to prefer for new work');
        const bm = spec('bm');
        assert.ok(bm.categoryNotes && bm.categoryNotes.gran,
            'the aggregated granulocyte category carries no guidance');
        assert.match(bm.categoryNotes.gran, /ICSH/);
        // Peripheral blood has no NRBC key at all, which the ICSH denominator
        // convention (DCR-006) depends on.
        assert.ok(!Object.values(spec('pb').outCodes).includes('nrbc'));
        assert.match(spec('pb').categoryNotes.other, /NRBC|nucleated red/i,
            'nothing tells the operator this profile cannot report NRBC per 100 WBC');
    });
});

// ================================================================
describe('Profile names state contents, not assertions (URS-101)', () => {

    /**
     * A profile name used to make a claim. `consensus-14` asserted a consensus
     * no body ratified; `harmonized-9` asserted harmonisation and contradicted
     * itself three ways — the id said 9, the name said "10-Part", the
     * description said "9-part differential", and the profile tallied ten;
     * `legacy-9` said only that it was old.
     *
     * A name now states what the profile IS: the tallied category count and
     * the defining trait. Provenance, endorsement and rationale live in
     * `description` and `provenance.notes`, as facts with citations.
     *
     * These four guards are the rule made permanent, and each exists because
     * of a specific defect found while applying it.
     */
    const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));
    const catalogue = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'index.json'), 'utf-8'));
    const entries = catalogue.presets.filter(p => !p.editorOnly);
    const read = file => JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, file), 'utf-8'));

    /** Categories the operator sees as rows and counts on keys. */
    function tallied(spec) {
        return (spec.categories.upper || []).length + (spec.categories.lower || []).length;
    }

    it('VV-PRE-030: Every number in a name is that profile\'s tallied category count', () => {
        // harmonized-9 tallied ten. The id, the name and the description were
        // three writers for one fact, and two of them were wrong.
        for (const entry of entries) {
            const cfg = Core.normalizeConfig(read(entry.file));
            const counts = cfg.specimenTypes.map(tallied);
            for (const [where, text] of [['profileName', cfg.profileName], ['index name', entry.name]]) {
                for (const n of (String(text).match(/\d+/g) || [])) {
                    // A year is a date, not a count — "2015 Counter Layout".
                    if (Number(n) > 1900) continue;
                    assert.ok(counts.every(c => c === Number(n)),
                        `${entry.profileId} ${where} "${text}" says ${n}, but its specimens ` +
                        `tally ${counts.join('/')}`);
                }
            }
        }
    });

    it('VV-PRE-031: The catalogue, the file and its contents agree', () => {
        // The catalogue said "Custom (Blank Template)" while the file said
        // "Custom (Template)" — a second writer for the same fact.
        for (const entry of catalogue.presets) {
            const cfg = read(entry.file);
            assert.equal(entry.name, cfg.profileName,
                `${entry.profileId}: the catalogue name and the file's profileName differ`);
            assert.equal(entry.profileId, cfg.profileId,
                `${entry.file}: the catalogue id and the file's profileId differ`);
            assert.equal(entry.file, entry.profileId + '.json',
                `${entry.profileId}: the filename does not match the id`);
        }
    });

    it('VV-PRE-032: Provenance claims only what the profile implements', () => {
        /**
         * `provenance.notes` prints into the report's method statement under
         * "Basis:". Two profiles carried a copy-pasted note claiming their
         * bone marrow categories and M:E ratio followed ICSH 2008 §2.6 — with
         * no bm specimen and no M:E formula between them. Those reports stated
         * a basis that did not exist, to a reader who cannot check it.
         */
        for (const entry of entries) {
            const cfg = Core.normalizeConfig(read(entry.file));
            const notes = (cfg.provenance && cfg.provenance.notes) || '';
            if (!notes) continue;
            const types = cfg.specimenTypes.map(s => s.specimenType);

            if (/bone marrow/i.test(notes)) {
                assert.ok(types.includes('bm'),
                    `${entry.profileId}: provenance claims a bone marrow basis, but the ` +
                    `profile has no bm specimen (${types.join(', ')})`);
            }
            if (/M:E/.test(notes)) {
                const hasME = cfg.specimenTypes.some(s =>
                    s.formulas && Object.keys(s.formulas).some(k => /ME_ratio/i.test(k)));
                assert.ok(hasME,
                    `${entry.profileId}: provenance claims an M:E basis, but no specimen ` +
                    'defines an ME_ratio formula');
            }
        }
    });

    it('VV-PRE-033: No name asserts value or status', () => {
        // A name that says "full", "minimal" or "consensus" is arguing, not
        // describing — and the argument is the one part nobody can check.
        const BANNED = ['legacy', 'consensus', 'harmonized', 'harmonised',
            'modern', 'classic', 'full', 'minimal', 'standard'];
        for (const entry of catalogue.presets) {
            const cfg = read(entry.file);
            for (const [where, text] of [['profileName', cfg.profileName], ['index name', entry.name]]) {
                for (const word of BANNED) {
                    assert.ok(!new RegExp('\\b' + word + '\\b', 'i').test(String(text)),
                        `${entry.profileId} ${where} "${text}" contains the value word "${word}" — ` +
                        'a name states what the profile contains; the claim belongs in description');
                }
            }
        }
    });

    it('VV-PRE-034: A profile omitting an ICSH category says so where it matters', () => {
        // RA-001 HA-107. An aggregated panel gives the operator no key for a
        // cell that is a legitimate member of the differential, and the
        // likeliest substitutions are plasma cells as lymphocytes and mast
        // cells as basophils. The guidance belongs on those rows, not in a
        // general note the operator reads once.
        for (const entry of entries) {
            const cfg = Core.normalizeConfig(read(entry.file));
            for (const spec of cfg.specimenTypes) {
                if (spec.specimenType !== 'bm') continue;
                const have = new Set(spec.categories.upper.concat(spec.categories.lower));
                const notes = spec.categoryNotes || {};
                for (const [missing, host] of [['plasma', 'lymph'], ['mast', 'baso']]) {
                    if (have.has(missing) || !have.has(host)) continue;
                    assert.ok(notes[host],
                        `${entry.profileId}/bm has no "${missing}" category and no guidance on ` +
                        `"${host}", which is where it would be miscounted`);
                    assert.match(notes[host], new RegExp(missing, 'i'),
                        `${entry.profileId}/bm: the guidance on "${host}" does not mention ${missing}`);
                }
            }
        }
    });
});
