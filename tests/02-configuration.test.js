/**
 * TEST SUITE 02: Configuration Validation
 * =========================================
 * Traces to: SRS SYS-100 through SYS-103
 * FMEA: HA-060 (config load), HA-061 (invalid config), HA-062 (duplicate keys)
 *
 * Validates the templates.json configuration file structure, data integrity,
 * and conformance to the schema defined in SDD-001 Section 3.8.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', 'web', 'settings', 'templates.json');

// Load config once — supports both legacy array and v2 object format
let config;
let rawConfig;

function normalizeConfig(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.specimenTypes)) return raw.specimenTypes;
    throw new Error('Invalid config format');
}

describe('Configuration — File Loading (SYS-100, SYS-101)', () => {

    it('VV-CFG-001: templates.json exists and is readable', () => {
        assert.ok(fs.existsSync(CONFIG_PATH), 'templates.json must exist at web/settings/templates.json');
    });

    it('VV-CFG-002: templates.json contains valid JSON', () => {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        assert.doesNotThrow(() => {
            rawConfig = JSON.parse(raw);
            config = normalizeConfig(rawConfig);
        }, 'templates.json must be valid JSON');
    });

    it('VV-CFG-003: Configuration has at least 1 specimen type (SYS-102)', () => {
        assert.ok(Array.isArray(config), 'Normalized config must be an array');
        assert.ok(config.length >= 1, 'Must have at least 1 specimen type');
    });

    it('VV-CFG-004: V2 config has version and profileId fields', () => {
        if (!Array.isArray(rawConfig)) {
            assert.ok(typeof rawConfig.version === 'string', 'V2 config must have version');
            assert.ok(typeof rawConfig.profileId === 'string', 'V2 config must have profileId');
            assert.ok(typeof rawConfig.profileName === 'string', 'V2 config must have profileName');
        }
    });
});

describe('Configuration — Schema Validation (SYS-102, SYS-103)', () => {

    it('VV-CFG-005: Each entry has required fields: specimenType, targetCount, categories, outCodes, templates', () => {
        for (const entry of config) {
            assert.ok(typeof entry.specimenType === 'string', 'specimenType must be a string');
            assert.ok(entry.specimenType.length > 0, 'specimenType must not be empty');
            assert.ok(typeof entry.targetCount === 'number', `${entry.specimenType}: targetCount must be a number`);
            assert.ok(typeof entry.categories === 'object', `${entry.specimenType}: categories must be an object`);
            assert.ok(typeof entry.outCodes === 'object', `${entry.specimenType}: outCodes must be an object`);
            assert.ok(Array.isArray(entry.templates), `${entry.specimenType}: templates must be an array`);
            assert.ok(entry.templates.length >= 1, `${entry.specimenType} must have at least 1 template`);
            assert.ok(typeof entry.upperRowAbnormal === 'boolean',
                `${entry.specimenType}: upperRowAbnormal must be a boolean`);
        }
    });

    it('VV-CFG-006: specimenType values are unique (no duplicates)', () => {
        const types = config.map(e => e.specimenType);
        const unique = new Set(types);
        assert.equal(unique.size, types.length, 'Duplicate specimenType values found: ' + types.join(', '));
    });

    it('VV-CFG-007: Bone Marrow (bm) specimen type is configured', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.ok(bm, 'Must have a "bm" specimen type');
    });

    it('VV-CFG-008: Peripheral Blood (pb) specimen type is configured', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.ok(pb, 'Must have a "pb" specimen type');
    });
});

describe('Configuration — Categories Validation (SYS-102)', () => {

    it('VV-CFG-009: Each entry has categories with upper and lower arrays', () => {
        for (const entry of config) {
            assert.ok(Array.isArray(entry.categories.upper),
                `${entry.specimenType}: categories.upper must be an array`);
            assert.ok(Array.isArray(entry.categories.lower),
                `${entry.specimenType}: categories.lower must be an array`);
            assert.ok(entry.categories.upper.length > 0,
                `${entry.specimenType}: categories.upper must not be empty`);
            assert.ok(entry.categories.lower.length > 0,
                `${entry.specimenType}: categories.lower must not be empty`);
        }
    });

    it('VV-CFG-010: All category cell types exist in outCodes values', () => {
        for (const entry of config) {
            const outValues = new Set(Object.values(entry.outCodes));
            const allCats = [...entry.categories.upper, ...entry.categories.lower];
            for (const ct of allCats) {
                assert.ok(outValues.has(ct),
                    `${entry.specimenType}: category cell type "${ct}" not found in outCodes values`);
            }
        }
    });

    it('VV-CFG-011: Categories cover all outCodes values (no orphaned cell types)', () => {
        for (const entry of config) {
            const catSet = new Set([...entry.categories.upper, ...entry.categories.lower]);
            for (const val of Object.values(entry.outCodes)) {
                assert.ok(catSet.has(val),
                    `${entry.specimenType}: outCodes cell type "${val}" not in any category`);
            }
        }
    });

    it('VV-CFG-012: BM categories: 7 upper, 7 lower', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.equal(bm.categories.upper.length, 7, 'BM must have 7 upper row cell types');
        assert.equal(bm.categories.lower.length, 7, 'BM must have 7 lower row cell types');
    });

    it('VV-CFG-013: PB categories: 7 upper, 7 lower', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.equal(pb.categories.upper.length, 7, 'PB must have 7 upper row cell types');
        assert.equal(pb.categories.lower.length, 7, 'PB must have 7 lower row cell types');
    });

    it('VV-CFG-014: BM upperRowAbnormal is false', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.equal(bm.upperRowAbnormal, false, 'BM upperRowAbnormal must be false');
    });

    it('VV-CFG-015: PB upperRowAbnormal is true', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.equal(pb.upperRowAbnormal, true, 'PB upperRowAbnormal must be true');
    });
});

describe('Configuration — Formulas Validation (SYS-102)', () => {

    it('VV-CFG-016: BM has a formulas object with ME_ratio', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.ok(typeof bm.formulas === 'object', 'BM must have a formulas object');
        assert.ok(typeof bm.formulas.ME_ratio === 'object', 'BM must have ME_ratio formula');
    });

    it('VV-CFG-017: ME_ratio has required fields: label, numerator, denominator, precision', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const me = bm.formulas.ME_ratio;
        assert.ok(typeof me.label === 'string' && me.label.length > 0, 'ME_ratio must have a label');
        assert.ok(Array.isArray(me.numerator) && me.numerator.length > 0, 'ME_ratio must have numerator array');
        assert.ok(Array.isArray(me.denominator) && me.denominator.length > 0, 'ME_ratio must have denominator array');
        assert.ok(typeof me.precision === 'number' && Number.isInteger(me.precision),
            'ME_ratio precision must be an integer');
    });

    it('VV-CFG-018: ME_ratio numerator and denominator reference valid outCodes cell types', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const me = bm.formulas.ME_ratio;
        const outValues = new Set(Object.values(bm.outCodes));
        for (const ct of me.numerator) {
            assert.ok(outValues.has(ct), `ME_ratio numerator cell type "${ct}" not in outCodes`);
        }
        for (const ct of me.denominator) {
            assert.ok(outValues.has(ct), `ME_ratio denominator cell type "${ct}" not in outCodes`);
        }
    });

    it('VV-CFG-019: ME_ratio numerator contains myeloid lineage cells', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const me = bm.formulas.ME_ratio;
        const expected = ['blasts', 'pro', 'myelo', 'meta', 'bands', 'poly', 'baso', 'eos', 'mono'];
        assert.deepEqual(me.numerator.sort(), expected.sort(),
            'ME_ratio numerator must contain the 9 myeloid lineage cell types');
    });

    it('VV-CFG-020: ME_ratio denominator contains erythroid precursors', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const me = bm.formulas.ME_ratio;
        assert.deepEqual(me.denominator, ['nrbc'],
            'ME_ratio denominator must be ["nrbc"]');
    });

    it('VV-CFG-021: PB does not have formulas (or formulas is absent)', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.ok(pb.formulas === undefined || pb.formulas === null ||
            Object.keys(pb.formulas || {}).length === 0,
            'PB should not have formulas defined');
    });
});

describe('Configuration — outCodes Validation (SYS-038, SYS-039, HA-062)', () => {

    it('VV-CFG-022: outCodes keys are single characters (letters or punctuation)', () => {
        for (const entry of config) {
            for (const key of Object.keys(entry.outCodes)) {
                assert.ok(key.length === 1,
                    `${entry.specimenType}: outCode key "${key}" must be a single character`);
            }
        }
    });

    it('VV-CFG-023: outCodes values are non-empty strings', () => {
        for (const entry of config) {
            for (const [key, val] of Object.entries(entry.outCodes)) {
                assert.ok(typeof val === 'string' && val.length > 0,
                    `${entry.specimenType}: outCode "${key}" value must be a non-empty string, got "${val}"`);
            }
        }
    });

    it('VV-CFG-024: No duplicate keys within a specimen type (HA-062)', () => {
        for (const entry of config) {
            const keys = Object.keys(entry.outCodes);
            const unique = new Set(keys);
            assert.equal(unique.size, keys.length,
                `${entry.specimenType}: Duplicate outCode keys found`);
        }
    });

    it('VV-CFG-025: No duplicate cell type values within a specimen type', () => {
        for (const entry of config) {
            const values = Object.values(entry.outCodes);
            const unique = new Set(values);
            assert.equal(unique.size, values.length,
                `${entry.specimenType}: Duplicate cell type values: ${values.join(', ')}`);
        }
    });

    it('VV-CFG-026: BM has exactly 14 cell types mapped to ergonomic left-hand keys (SYS-014, SYS-038)', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const codes = bm.outCodes;

        assert.equal(Object.keys(codes).length, 14, 'BM must have 14 key mappings');
        assert.equal(codes.B, 'nrbc');
        assert.equal(codes.X, 'blasts');
        assert.equal(codes.R, 'pro');
        assert.equal(codes.V, 'myelo');
        assert.equal(codes.C, 'meta');
        assert.equal(codes.E, 'plasma');
        assert.equal(codes.W, 'mast');
        assert.equal(codes.D, 'bands');
        assert.equal(codes.F, 'poly');
        assert.equal(codes.Z, 'baso');
        assert.equal(codes.G, 'eos');
        assert.equal(codes.A, 'mono');
        assert.equal(codes.S, 'lymph');
        assert.equal(codes.Q, 'other');
    });

    it('VV-CFG-027: PB has exactly 14 cell types mapped to ergonomic left-hand keys (SYS-015, SYS-039)', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        const codes = pb.outCodes;

        assert.equal(Object.keys(codes).length, 14, 'PB must have 14 key mappings');
        assert.equal(codes.B, 'nrbc');
        assert.equal(codes.X, 'blasts');
        assert.equal(codes.R, 'pro');
        assert.equal(codes.V, 'myelo');
        assert.equal(codes.C, 'meta');
        assert.equal(codes.E, 'plasma');
        assert.equal(codes.W, 'mast');
        assert.equal(codes.D, 'bands');
        assert.equal(codes.F, 'poly');
        assert.equal(codes.Z, 'baso');
        assert.equal(codes.G, 'eos');
        assert.equal(codes.A, 'mono');
        assert.equal(codes.S, 'lymph');
        assert.equal(codes.Q, 'other');
    });

    it('VV-CFG-028: BM and PB outCodes are identical', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const pb = config.find(e => e.specimenType === 'pb');
        assert.deepEqual(bm.outCodes, pb.outCodes,
            'BM and PB must have identical outCodes mappings');
    });
});

describe('Configuration — Template Validation (SYS-060, HA-050)', () => {

    it('VV-CFG-029: Each template has tplCode, tplName, and outSentence', () => {
        for (const entry of config) {
            for (const tpl of entry.templates) {
                assert.ok(typeof tpl.tplCode === 'string' && tpl.tplCode.length > 0,
                    `${entry.specimenType}: template missing tplCode`);
                assert.ok(typeof tpl.tplName === 'string' && tpl.tplName.length > 0,
                    `${entry.specimenType}: template missing tplName`);
                assert.ok(typeof tpl.outSentence === 'string' && tpl.outSentence.length > 0,
                    `${entry.specimenType}: template missing outSentence`);
            }
        }
    });

    it('VV-CFG-030: Every template contains {{total}} placeholder', () => {
        for (const entry of config) {
            for (const tpl of entry.templates) {
                assert.ok(tpl.outSentence.includes('{{total}}'),
                    `${entry.specimenType}/${tpl.tplCode}: template must contain {{total}}`);
            }
        }
    });

    it('VV-CFG-031: Every template reports every cell type, in its correct form', () => {
        // A category inside the differential is reported as a percentage,
        // {{ct}}. A category the profile excludes from the denominator has no
        // percentage of the differential and is reported per 100 of it,
        // {{ct_per100}} — the NRBC convention in peripheral blood.
        for (const entry of config) {
            const excluded = entry.denominatorExcludes || [];
            for (const tpl of entry.templates) {
                for (const ct of Object.values(entry.outCodes)) {
                    const token = excluded.includes(ct) ? `{{${ct}_per100}}` : `{{${ct}}}`;
                    assert.ok(tpl.outSentence.includes(token),
                        `${entry.specimenType}/${tpl.tplCode}: missing placeholder ${token}`);
                }
            }
        }
    });

    it('VV-CFG-032: A category outside the differential is not also reported as a percentage', () => {
        for (const entry of config) {
            for (const ct of (entry.denominatorExcludes || [])) {
                for (const tpl of entry.templates) {
                    assert.ok(!tpl.outSentence.includes(`{{${ct}}}`),
                        `${entry.specimenType}/${tpl.tplCode}: {{${ct}}} is outside the ` +
                        `differential and must not be reported as a percentage of it`);
                }
            }
        }
    });

    it('VV-CFG-033: BM templates contain {{ME_ratio}} placeholder', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        for (const tpl of bm.templates) {
            assert.ok(tpl.outSentence.includes('{{ME_ratio}}'),
                `bm/${tpl.tplCode}: BM template must contain {{ME_ratio}} placeholder`);
        }
    });

    it('VV-CFG-034: PB templates do not contain {{ME_ratio}} placeholder', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        for (const tpl of pb.templates) {
            assert.ok(!tpl.outSentence.includes('{{ME_ratio}}'),
                `pb/${tpl.tplCode}: PB template must not contain {{ME_ratio}} placeholder`);
        }
    });

    it('VV-CFG-035: BM has 3 templates (Yale SOM, Precipio DX, MGH)', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.equal(bm.templates.length, 3);
        assert.ok(bm.templates.some(t => t.tplCode === 'ysm'), 'Missing Yale SOM template');
        assert.ok(bm.templates.some(t => t.tplCode === 'pdx'), 'Missing Precipio DX template');
        assert.ok(bm.templates.some(t => t.tplCode === 'mgh'), 'Missing MGH template');
    });

    it('VV-CFG-036: PB has 1 template (MGH)', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.equal(pb.templates.length, 1);
        assert.equal(pb.templates[0].tplCode, 'mgh');
    });
});

describe('Configuration — Target Count (SYS-052, SYS-103)', () => {

    it('VV-CFG-037: BM targetCount is 500', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.equal(bm.targetCount, 500);
    });

    it('VV-CFG-038: PB targetCount is 200', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.equal(pb.targetCount, 200);
    });

    it('VV-CFG-039: targetCount values are positive integers', () => {
        for (const entry of config) {
            assert.ok(Number.isInteger(entry.targetCount),
                `${entry.specimenType}: targetCount must be integer`);
            assert.ok(entry.targetCount > 0,
                `${entry.specimenType}: targetCount must be positive`);
        }
    });
});

describe('Configuration — Template Rendering (VV-TPL-001 to VV-TPL-004)', () => {

    /**
     * Helper: resolve all placeholders in a template outSentence.
     * Substitutes {{total}}, all 14 cell type placeholders, and any formula
     * placeholders (e.g., {{ME_ratio}}) for the given specimen entry.
     */
    function resolveTemplate(entry, tpl) {
        let text = tpl.outSentence;

        // Substitute {{total}}
        text = text.replace(/\{\{total\}\}/g, '500');

        // Substitute all cell type placeholders, in whichever form the profile
        // reports them
        Object.values(entry.outCodes).forEach(ct => {
            text = text.replace(new RegExp('\\{\\{' + ct + '_per100\\}\\}', 'g'), '11.1');
            text = text.replace(new RegExp('\\{\\{' + ct + '\\}\\}', 'g'), '7');
        });

        // Substitute formula placeholders (e.g., {{ME_ratio}})
        if (entry.formulas) {
            for (const formulaKey of Object.keys(entry.formulas)) {
                text = text.replace(new RegExp('\\{\\{' + formulaKey + '\\}\\}', 'g'), '3.5');
            }
        }

        return text;
    }

    it('VV-TPL-001: Yale SOM template renders with no unresolved placeholders', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const tpl = bm.templates.find(t => t.tplCode === 'ysm');
        const text = resolveTemplate(bm, tpl);

        const unresolved = text.match(/\{\{[^}]+\}\}/g);
        assert.equal(unresolved, null, 'Unresolved placeholders: ' + JSON.stringify(unresolved));
    });

    it('VV-TPL-002: Precipio DX template renders with no unresolved placeholders', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const tpl = bm.templates.find(t => t.tplCode === 'pdx');
        const text = resolveTemplate(bm, tpl);

        const unresolved = text.match(/\{\{[^}]+\}\}/g);
        assert.equal(unresolved, null, 'Unresolved placeholders: ' + JSON.stringify(unresolved));
    });

    it('VV-TPL-003: MGH BM template renders with no unresolved placeholders', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const tpl = bm.templates.find(t => t.tplCode === 'mgh');
        const text = resolveTemplate(bm, tpl);

        const unresolved = text.match(/\{\{[^}]+\}\}/g);
        assert.equal(unresolved, null, 'Unresolved placeholders: ' + JSON.stringify(unresolved));
    });

    it('VV-TPL-004: MGH PB template renders with no unresolved placeholders', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        const tpl = pb.templates.find(t => t.tplCode === 'mgh');
        const text = resolveTemplate(pb, tpl);

        const unresolved = text.match(/\{\{[^}]+\}\}/g);
        assert.equal(unresolved, null, 'Unresolved placeholders: ' + JSON.stringify(unresolved));
    });

    it('VV-TPL-005: BM template {{ME_ratio}} placeholder is resolved by formula key', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        for (const tpl of bm.templates) {
            // Verify the raw template contains {{ME_ratio}}
            assert.ok(tpl.outSentence.includes('{{ME_ratio}}'),
                `bm/${tpl.tplCode}: raw template must contain {{ME_ratio}}`);

            // Verify it resolves cleanly
            const text = resolveTemplate(bm, tpl);
            assert.ok(!text.includes('{{ME_ratio}}'),
                `bm/${tpl.tplCode}: {{ME_ratio}} must be resolved after substitution`);
        }
    });
});
