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

// Load config once
let config;

describe('Configuration — File Loading (SYS-100, SYS-101)', () => {

    it('templates.json exists and is readable', () => {
        assert.ok(fs.existsSync(CONFIG_PATH), 'templates.json must exist at web/settings/templates.json');
    });

    it('templates.json contains valid JSON', () => {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        assert.doesNotThrow(() => {
            config = JSON.parse(raw);
        }, 'templates.json must be valid JSON');
    });

    it('Configuration is an array with at least 1 specimen type (SYS-102)', () => {
        assert.ok(Array.isArray(config), 'Root must be an array');
        assert.ok(config.length >= 1, 'Must have at least 1 specimen type');
    });
});

describe('Configuration — Schema Validation (SYS-102, SYS-103)', () => {

    it('Each entry has required fields: specimenType, outCodes, templates', () => {
        for (const entry of config) {
            assert.ok(typeof entry.specimenType === 'string', 'specimenType must be a string');
            assert.ok(entry.specimenType.length > 0, 'specimenType must not be empty');
            assert.ok(typeof entry.outCodes === 'object', 'outCodes must be an object');
            assert.ok(Array.isArray(entry.templates), 'templates must be an array');
            assert.ok(entry.templates.length >= 1, `${entry.specimenType} must have at least 1 template`);
        }
    });

    it('specimenType values are unique (no duplicates)', () => {
        const types = config.map(e => e.specimenType);
        const unique = new Set(types);
        assert.equal(unique.size, types.length, 'Duplicate specimenType values found: ' + types.join(', '));
    });

    it('Bone Marrow (bm) specimen type is configured', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.ok(bm, 'Must have a "bm" specimen type');
    });

    it('Peripheral Blood (pb) specimen type is configured', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.ok(pb, 'Must have a "pb" specimen type');
    });
});

describe('Configuration — outCodes Validation (SYS-038, SYS-039, HA-062)', () => {

    it('outCodes keys are single uppercase letters', () => {
        for (const entry of config) {
            for (const key of Object.keys(entry.outCodes)) {
                assert.ok(/^[A-Z]$/.test(key),
                    `${entry.specimenType}: outCode key "${key}" must be a single uppercase letter`);
            }
        }
    });

    it('outCodes values are non-empty strings', () => {
        for (const entry of config) {
            for (const [key, val] of Object.entries(entry.outCodes)) {
                assert.ok(typeof val === 'string' && val.length > 0,
                    `${entry.specimenType}: outCode "${key}" value must be a non-empty string, got "${val}"`);
            }
        }
    });

    it('No duplicate keys within a specimen type (HA-062)', () => {
        for (const entry of config) {
            const keys = Object.keys(entry.outCodes);
            const unique = new Set(keys);
            assert.equal(unique.size, keys.length,
                `${entry.specimenType}: Duplicate outCode keys found`);
        }
    });

    it('No duplicate cell type values within a specimen type', () => {
        for (const entry of config) {
            const values = Object.values(entry.outCodes);
            const unique = new Set(values);
            assert.equal(unique.size, values.length,
                `${entry.specimenType}: Duplicate cell type values: ${values.join(', ')}`);
        }
    });

    it('BM has exactly 9 cell types mapped to correct keys (SYS-014, SYS-038)', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const codes = bm.outCodes;

        assert.equal(Object.keys(codes).length, 9, 'BM must have 9 key mappings');
        assert.equal(codes.A, 'blast');
        assert.equal(codes.S, 'pro');
        assert.equal(codes.D, 'gran');
        assert.equal(codes.F, 'eryth');
        assert.equal(codes.Z, 'baso');
        assert.equal(codes.X, 'eos');
        assert.equal(codes.C, 'plasma');
        assert.equal(codes.V, 'lymph');
        assert.equal(codes.B, 'mono');
    });

    it('PB has exactly 9 cell types mapped to correct keys (SYS-015, SYS-039)', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        const codes = pb.outCodes;

        assert.equal(Object.keys(codes).length, 9, 'PB must have 9 key mappings');
        assert.equal(codes.A, 'poly');
        assert.equal(codes.S, 'band');
        assert.equal(codes.D, 'lymph');
        assert.equal(codes.F, 'mono');
        assert.equal(codes.Z, 'eos');
        assert.equal(codes.X, 'baso');
        assert.equal(codes.C, 'pro');
        assert.equal(codes.V, 'blast');
        assert.equal(codes.B, 'other');
    });
});

describe('Configuration — Template Validation (SYS-060, HA-050)', () => {

    it('Each template has tplCode, tplName, and outSentence', () => {
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

    it('Every template contains {{total}} placeholder', () => {
        for (const entry of config) {
            for (const tpl of entry.templates) {
                assert.ok(tpl.outSentence.includes('{{total}}'),
                    `${entry.specimenType}/${tpl.tplCode}: template must contain {{total}}`);
            }
        }
    });

    it('Every template contains all cell type placeholders for its specimen type', () => {
        for (const entry of config) {
            const cellTypes = Object.values(entry.outCodes);
            for (const tpl of entry.templates) {
                for (const ct of cellTypes) {
                    assert.ok(tpl.outSentence.includes('{{' + ct + '}}'),
                        `${entry.specimenType}/${tpl.tplCode}: missing placeholder {{${ct}}}`);
                }
            }
        }
    });

    it('BM has 3 templates (Yale SOM, Precipio DX, MGH)', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.equal(bm.templates.length, 3);
        assert.ok(bm.templates.some(t => t.tplCode === 'ysm'), 'Missing Yale SOM template');
        assert.ok(bm.templates.some(t => t.tplCode === 'pdx'), 'Missing Precipio DX template');
        assert.ok(bm.templates.some(t => t.tplCode === 'mgh'), 'Missing MGH template');
    });

    it('PB has 1 template (MGH)', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.equal(pb.templates.length, 1);
        assert.equal(pb.templates[0].tplCode, 'mgh');
    });
});

describe('Configuration — Minimum Cell Count (SYS-052, SYS-103)', () => {

    it('BM minCellCount is 200', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        assert.equal(bm.minCellCount, 200);
    });

    it('PB minCellCount is 100', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        assert.equal(pb.minCellCount, 100);
    });

    it('minCellCount values are positive integers', () => {
        for (const entry of config) {
            if (entry.minCellCount !== undefined) {
                assert.ok(Number.isInteger(entry.minCellCount), `${entry.specimenType}: minCellCount must be integer`);
                assert.ok(entry.minCellCount > 0, `${entry.specimenType}: minCellCount must be positive`);
            }
        }
    });
});

describe('Configuration — Template Rendering (VV-TPL-001 to VV-TPL-004)', () => {

    it('VV-TPL-001: Yale SOM template renders with no unresolved placeholders', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const tpl = bm.templates.find(t => t.tplCode === 'ysm');
        let text = tpl.outSentence;

        // Substitute all
        text = text.replace(/\{\{total\}\}/g, '100');
        Object.values(bm.outCodes).forEach(ct => {
            text = text.replace(new RegExp('\\{\\{' + ct + '\\}\\}', 'g'), '10');
        });

        const unresolved = text.match(/\{\{[^}]+\}\}/g);
        assert.equal(unresolved, null, 'Unresolved placeholders: ' + JSON.stringify(unresolved));
    });

    it('VV-TPL-002: Precipio DX template renders with no unresolved placeholders', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const tpl = bm.templates.find(t => t.tplCode === 'pdx');
        let text = tpl.outSentence;

        text = text.replace(/\{\{total\}\}/g, '100');
        Object.values(bm.outCodes).forEach(ct => {
            text = text.replace(new RegExp('\\{\\{' + ct + '\\}\\}', 'g'), '10');
        });

        const unresolved = text.match(/\{\{[^}]+\}\}/g);
        assert.equal(unresolved, null, 'Unresolved placeholders: ' + JSON.stringify(unresolved));
    });

    it('VV-TPL-003: MGH BM template renders with no unresolved placeholders', () => {
        const bm = config.find(e => e.specimenType === 'bm');
        const tpl = bm.templates.find(t => t.tplCode === 'mgh');
        let text = tpl.outSentence;

        text = text.replace(/\{\{total\}\}/g, '100');
        Object.values(bm.outCodes).forEach(ct => {
            text = text.replace(new RegExp('\\{\\{' + ct + '\\}\\}', 'g'), '10');
        });

        const unresolved = text.match(/\{\{[^}]+\}\}/g);
        assert.equal(unresolved, null, 'Unresolved placeholders: ' + JSON.stringify(unresolved));
    });

    it('VV-TPL-004: MGH PB template renders with no unresolved placeholders', () => {
        const pb = config.find(e => e.specimenType === 'pb');
        const tpl = pb.templates.find(t => t.tplCode === 'mgh');
        let text = tpl.outSentence;

        text = text.replace(/\{\{total\}\}/g, '100');
        Object.values(pb.outCodes).forEach(ct => {
            text = text.replace(new RegExp('\\{\\{' + ct + '\\}\\}', 'g'), '10');
        });

        const unresolved = text.match(/\{\{[^}]+\}\}/g);
        assert.equal(unresolved, null, 'Unresolved placeholders: ' + JSON.stringify(unresolved));
    });
});
