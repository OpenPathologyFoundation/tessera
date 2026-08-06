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
    'consensus-14.json',
    'harmonized-9.json',
    'legacy-9.json',
    'minimal-5.json',
    'frequency-ergo.json',
    'right-hand.json',
    'body-fluid.json',
    'custom.json'
];

describe('Preset Catalog — File Existence', () => {

    it('Presets directory exists', () => {
        assert.ok(fs.existsSync(PRESETS_DIR), 'web/settings/presets/ must exist');
    });

    expectedPresets.forEach(function (filename) {
        it('Preset file exists: ' + filename, () => {
            const fp = path.join(PRESETS_DIR, filename);
            assert.ok(fs.existsSync(fp), filename + ' must exist in presets directory');
        });
    });
});

describe('Preset Catalog — JSON Validity', () => {

    expectedPresets.forEach(function (filename) {
        it(filename + ' is valid JSON', () => {
            const fp = path.join(PRESETS_DIR, filename);
            const raw = fs.readFileSync(fp, 'utf-8');
            assert.doesNotThrow(() => JSON.parse(raw), filename + ' must be valid JSON');
        });
    });
});

describe('Preset Catalog — Schema Conformance', () => {

    expectedPresets.forEach(function (filename) {
        it(filename + ' has required v2 wrapper fields', () => {
            const fp = path.join(PRESETS_DIR, filename);
            const config = JSON.parse(fs.readFileSync(fp, 'utf-8'));

            assert.ok(typeof config.version === 'string', filename + ': must have version');
            assert.ok(typeof config.profileId === 'string', filename + ': must have profileId');
            assert.ok(typeof config.profileName === 'string', filename + ': must have profileName');
            assert.ok(Array.isArray(config.specimenTypes), filename + ': must have specimenTypes array');
            assert.ok(config.specimenTypes.length >= 1, filename + ': must have at least 1 specimen type');
        });

        it(filename + ' specimen types have required fields', () => {
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

        it(filename + ' outCodes values match category cell types (except custom)', () => {
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

        it(filename + ' has no duplicate outCode keys per specimen', () => {
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

    const leftPresets = ['consensus-14.json', 'harmonized-9.json', 'legacy-9.json', 'minimal-5.json', 'body-fluid.json'];

    leftPresets.forEach(function (filename) {
        it(filename + ' left-hand preset keys are within left ergonomic zone', () => {
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

    it('right-hand.json keys are within right ergonomic zone', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'right-hand.json'), 'utf-8'));
        for (const spec of config.specimenTypes) {
            const keys = Object.keys(spec.outCodes);
            for (const key of keys) {
                assert.ok(ERGO_ZONES.right.indexOf(key) !== -1,
                    'right-hand/' + spec.specimenType + ': key "' + key + '" is outside right ergonomic zone');
            }
        }
    });
});

describe('Preset Catalog — Specific Presets', () => {

    it('consensus-14 has 14 cell types per specimen', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'consensus-14.json'), 'utf-8'));
        for (const spec of config.specimenTypes) {
            assert.equal(Object.keys(spec.outCodes).length, 14,
                spec.specimenType + ': must have 14 key mappings');
        }
    });

    it('minimal-5 has 5 cell types', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'minimal-5.json'), 'utf-8'));
        const spec = config.specimenTypes[0];
        assert.equal(Object.keys(spec.outCodes).length, 5, 'Must have 5 key mappings');
    });

    it('right-hand preset has handedness "right"', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'right-hand.json'), 'utf-8'));
        for (const spec of config.specimenTypes) {
            assert.equal(spec.handedness, 'right', spec.specimenType + ': handedness must be right');
        }
    });

    it('body-fluid has bf specimen type', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'body-fluid.json'), 'utf-8'));
        assert.ok(config.specimenTypes.some(s => s.specimenType === 'bf'), 'Must have bf specimen');
    });

    it('body-fluid has morphology checklist items', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'body-fluid.json'), 'utf-8'));
        const bf = config.specimenTypes.find(s => s.specimenType === 'bf');
        assert.ok(bf.morphologyChecklist.length > 0, 'Body fluid must have morph checklist items');
    });

    it('harmonized-9 has constituents defined', () => {
        const config = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'harmonized-9.json'), 'utf-8'));
        const bm = config.specimenTypes.find(s => s.specimenType === 'bm');
        assert.ok(bm.constituents && bm.constituents.gran, 'Harmonized-9 BM must have gran constituent');
        assert.ok(Array.isArray(bm.constituents.gran.members), 'Gran constituent must have members array');
    });

    it('custom preset has empty categories', () => {
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
     * built-in profile, 90.0% after choosing the harmonized-9 preset.
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
        it(filename + ' excludes NRBC from any non-marrow differential', () => {
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

    it('A preset sharing the built-in profileId is the built-in profile', () => {
        // isCacheSuperseded discards a cached profile when a built-in one with
        // the SAME profileId carries a higher version. consensus-14.json was
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
