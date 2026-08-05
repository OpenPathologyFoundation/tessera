/**
 * TEST SUITE 08: Config Schema V2
 * =================================
 * Validates the extended v2 schema fields in templates.json
 * (specimenLabel, audio, autosave, constituents, absoluteCounts, etc.)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// The shipped calculation/config engine under verification.
const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));

const CONFIG_PATH = path.join(__dirname, '..', 'web', 'settings', 'templates.json');
const rawConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const isV2 = !Array.isArray(rawConfig);
const specimenTypes = isV2 ? rawConfig.specimenTypes : rawConfig;

describe('Config Schema V2 — Wrapper Fields', () => {

    it('Config is in v2 object format', () => {
        assert.ok(isV2, 'Config must be v2 object format');
    });

    it('Has a dotted profile version', () => {
        // Pinned to a shape, not a literal: the version is what drives the
        // supersede check that delivers a corrected profile to an installed
        // browser, so it is expected to change.
        assert.match(String(rawConfig.version), /^\d+\.\d+(\.\d+)?$/);
        assert.ok(Core.compareVersions(rawConfig.version, '2.0') >= 0,
            'shipped profile must not regress below the 2.0 baseline');
    });

    it('Has profileId field', () => {
        assert.ok(typeof rawConfig.profileId === 'string' && rawConfig.profileId.length > 0, 'Must have profileId');
    });

    it('Has profileName field', () => {
        assert.ok(typeof rawConfig.profileName === 'string' && rawConfig.profileName.length > 0, 'Must have profileName');
    });

    it('Has specimenTypes array', () => {
        assert.ok(Array.isArray(rawConfig.specimenTypes), 'Must have specimenTypes array');
        assert.ok(rawConfig.specimenTypes.length >= 1, 'Must have at least 1 specimen type');
    });
});

describe('Config Schema V2 — specimenLabel Field', () => {

    it('Each entry has specimenLabel', () => {
        for (const spec of specimenTypes) {
            assert.ok(typeof spec.specimenLabel === 'string' && spec.specimenLabel.length > 0,
                `${spec.specimenType}: must have specimenLabel`);
        }
    });

    it('BM specimenLabel is "Bone Marrow"', () => {
        const bm = specimenTypes.find(s => s.specimenType === 'bm');
        assert.equal(bm.specimenLabel, 'Bone Marrow');
    });

    it('PB specimenLabel is "Peripheral Blood"', () => {
        const pb = specimenTypes.find(s => s.specimenType === 'pb');
        assert.equal(pb.specimenLabel, 'Peripheral Blood');
    });
});

describe('Config Schema V2 — Audio Config', () => {

    it('Each entry has audio object', () => {
        for (const spec of specimenTypes) {
            assert.ok(typeof spec.audio === 'object' && spec.audio !== null,
                `${spec.specimenType}: must have audio object`);
        }
    });

    it('Audio config has enabled boolean', () => {
        for (const spec of specimenTypes) {
            assert.ok(typeof spec.audio.enabled === 'boolean',
                `${spec.specimenType}: audio.enabled must be boolean`);
        }
    });

    it('Audio config has sound type strings', () => {
        for (const spec of specimenTypes) {
            assert.ok(typeof spec.audio.countSound === 'string',
                `${spec.specimenType}: audio.countSound must be string`);
            assert.ok(typeof spec.audio.undoSound === 'string',
                `${spec.specimenType}: audio.undoSound must be string`);
            assert.ok(typeof spec.audio.targetSound === 'string',
                `${spec.specimenType}: audio.targetSound must be string`);
        }
    });
});

describe('Config Schema V2 — Autosave Field', () => {

    it('Each entry has autosave boolean', () => {
        for (const spec of specimenTypes) {
            assert.ok(typeof spec.autosave === 'boolean',
                `${spec.specimenType}: autosave must be boolean`);
        }
    });
});

describe('Config Schema V2 — absoluteCounts Field', () => {

    it('Each entry has absoluteCounts string', () => {
        for (const spec of specimenTypes) {
            assert.ok(typeof spec.absoluteCounts === 'string',
                `${spec.specimenType}: absoluteCounts must be string`);
            assert.ok(['always', 'optional', 'disabled'].includes(spec.absoluteCounts),
                `${spec.specimenType}: absoluteCounts must be "always", "optional", or "disabled"`);
        }
    });
});

describe('Config Schema V2 — Handedness Field', () => {

    it('Each entry has handedness string', () => {
        for (const spec of specimenTypes) {
            assert.ok(typeof spec.handedness === 'string',
                `${spec.specimenType}: handedness must be string`);
            assert.ok(['left', 'right'].includes(spec.handedness),
                `${spec.specimenType}: handedness must be "left" or "right"`);
        }
    });
});

describe('Config Schema V2 — Constituents Field', () => {

    it('Each entry has constituents object (may be empty)', () => {
        for (const spec of specimenTypes) {
            assert.ok(typeof spec.constituents === 'object' && spec.constituents !== null,
                `${spec.specimenType}: constituents must be an object`);
        }
    });
});

describe('Config Schema V2 — Morphology Checklist Field', () => {

    it('Each entry has morphologyChecklist array (may be empty)', () => {
        for (const spec of specimenTypes) {
            assert.ok(Array.isArray(spec.morphologyChecklist),
                `${spec.specimenType}: morphologyChecklist must be an array`);
        }
    });
});

describe('Config Schema V2 — Backward Compatibility', () => {

    // Behavioural: normalizeConfig now lives in wbc-core.js and is called
    // directly rather than grepped for (DCR-004).
    it('normalizeConfig accepts the legacy bare-array format', () => {
        const legacy = [{
            specimenType: 'bm',
            categories: { upper: ['blasts'], lower: ['poly'] },
            outCodes: { X: 'blasts', F: 'poly' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }]
        }];
        const norm = Core.normalizeConfig(legacy);
        assert.equal(norm.specimenTypes.length, 1);
        assert.equal(norm.specimenTypes[0].specimenLabel, 'Bone Marrow');
        assert.equal(norm.specimenTypes[0].targetCount, 500);
        assert.equal(norm.version, '1.0');
        assert.equal(norm.profileId, 'legacy');
        assert.equal(Core.validateConfig(norm.specimenTypes).length, 0);
    });

    it('normalizeConfig accepts the v2 envelope and preserves its metadata', () => {
        const norm = Core.normalizeConfig({
            version: '2.0', profileId: 'consensus-14', profileName: 'Full 14-Part Consensus',
            specimenTypes: [{
                specimenType: 'pb',
                categories: { upper: ['blasts'], lower: ['poly'] },
                outCodes: { X: 'blasts', F: 'poly' },
                templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }]
            }]
        });
        assert.equal(norm.profileId, 'consensus-14');
        assert.equal(norm.profileName, 'Full 14-Part Consensus');
        assert.equal(norm.version, '2.0');
        assert.equal(norm.specimenTypes[0].specimenLabel, 'Peripheral Blood');
        assert.equal(norm.specimenTypes[0].targetCount, 200);
    });

    it('validateConfig rejects a cell type that shadows a template placeholder', () => {
        // A category literally named "total" would make {{total}} render that
        // category's percentage instead of the cell count, silently corrupting
        // every report produced from the profile.
        const errs = Core.validateConfig([{
            specimenType: 'bm', targetCount: 100,
            categories: { upper: ['total'], lower: ['blasts'] },
            outCodes: { T: 'total', X: 'blasts' },
            templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }]
        }]);
        assert.equal(errs.length, 1);
        assert.match(errs[0], /reserved template placeholder/);
    });

    it('Every reserved placeholder name is rejected as a cell type', () => {
        for (const reserved of Core.RESERVED_PLACEHOLDERS) {
            const errs = Core.validateConfig([{
                specimenType: 'bm', targetCount: 100,
                categories: { upper: [reserved], lower: ['blasts'] },
                outCodes: { T: reserved, X: 'blasts' },
                templates: [{ tplCode: 't', tplName: 'T', outSentence: 'x' }]
            }]);
            assert.ok(errs.some(e => /reserved template placeholder/.test(e)),
                `"${reserved}" must be rejected as a cell type`);
        }
    });

    it('No shipped profile uses a reserved placeholder as a cell type', () => {
        const presetDir = path.join(__dirname, '..', 'web', 'settings', 'presets');
        const files = [CONFIG_PATH].concat(
            fs.readdirSync(presetDir)
                .filter(f => f.endsWith('.json') && f !== 'index.json')
                .map(f => path.join(presetDir, f)));
        for (const f of files) {
            const norm = Core.normalizeConfig(JSON.parse(fs.readFileSync(f, 'utf-8')));
            for (const spec of norm.specimenTypes) {
                const cells = spec.categories.upper.concat(spec.categories.lower);
                for (const ct of cells) {
                    assert.ok(!Core.RESERVED_PLACEHOLDERS.includes(ct),
                        `${path.basename(f)} uses reserved name "${ct}"`);
                }
            }
        }
    });

    it('normalizeConfig rejects a structure that is neither format', () => {
        assert.throws(() => Core.normalizeConfig({ nope: true }), /Invalid config format/);
        assert.throws(() => Core.normalizeConfig(null), /Invalid config format/);
        assert.throws(() => Core.normalizeConfig('a string'), /Invalid config format/);
    });

    it('JS loadConfig uses cache-first strategy', () => {
        const jsPath = path.join(__dirname, '..', 'web', 'scripts', 'mdc-app.js');
        const jsCode = fs.readFileSync(jsPath, 'utf-8');
        assert.ok(jsCode.includes('loadCachedConfig'), 'Must have cache loading function');
        assert.ok(jsCode.includes('cacheConfig'), 'Must have cache writing function');
    });
});
