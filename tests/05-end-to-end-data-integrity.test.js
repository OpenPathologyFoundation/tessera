/**
 * TEST SUITE 05: End-to-End Data Integrity
 * =========================================
 * Traces to: SRS SYS-030..SYS-047, SYS-060..SYS-067, SYS-096, SYS-097
 * FMEA: HA-011, HA-020, HA-024 (output/table mismatch), HA-050, HA-052
 * VV Protocol: VV-E2E-001 onward
 *
 * Drives a complete count through the SHIPPED engine (web/scripts/wbc-core.js)
 * using the SHIPPED configuration profile, and verifies that the value chain
 *
 *     keypresses -> counts -> percentages -> report -> export
 *
 * stays consistent at every hop. Only the keystroke dispatch loop is modelled
 * here (its DOM half is covered by suite 11); every arithmetic, template and
 * serialization step calls the real application code. See DCR-004.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));

const CONFIG_PATH = path.join(__dirname, '..', 'web', 'settings', 'templates.json');
const rawConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const normalized = Core.normalizeConfig(rawConfig);
const config = normalized.specimenTypes;

function specFor(type) {
    const s = config.find(s => s.specimenType === type);
    assert.ok(s, `specimen type ${type} must exist in the shipped profile`);
    return s;
}

/**
 * Dispatch keystrokes exactly as onKeyDown does: uppercase the key, ignore
 * unmapped keys, shift decrements but never below zero.
 */
function applyKeystrokes(spec, keypresses) {
    const counts = {};
    Object.keys(spec.outCodes).forEach(k => { counts[spec.outCodes[k]] = 0; });
    for (const kp of keypresses) {
        const key = String(kp.key).toUpperCase();
        if (!Object.prototype.hasOwnProperty.call(spec.outCodes, key)) continue;
        const ct = spec.outCodes[key];
        if (kp.shift) {
            if (counts[ct] > 0) counts[ct]--;
        } else {
            counts[ct]++;
        }
    }
    return counts;
}

/**
 * Reproduces mdc-app.js buildSession() using the same Core calls, so the
 * session record under test is assembled by shipped code.
 */
function buildSession(specimenType, counts, caseNumber, comments) {
    const spec = specFor(specimenType);
    const total = Core.getTotal(counts);
    // Mirrors mdc-app.js buildSession: categories the profile places outside
    // the differential are excluded from the denominator and reported per 100
    // of it instead.
    const exclude = spec.denominatorExcludes || [];
    const differentialTotal = Core.getDenominator(counts, exclude);
    const per100 = {};
    Object.keys(spec.per100Reporting || {}).forEach(ct => {
        per100[ct] = Core.computePer100(counts, ct, exclude,
            spec.per100Reporting[ct].precision);
    });
    const session = {
        differentialTotal,
        per100,
        denominatorExcludes: exclude.slice(),
        caseNumber: caseNumber || '',
        specimenType: specimenType,
        specimenLabel: spec.specimenLabel,
        timestamp: '2026-02-24T10:00:00.000Z',
        configProfileId: normalized.profileId,
        configProfileName: normalized.profileName,
        configVersion: normalized.version,
        targetCount: spec.targetCount,
        totalCount: total,
        counts: counts,
        percentages: Core.percentagesSummingTo100(counts, 2, { exclude }),
        meRatio: spec.formulas && spec.formulas.ME_ratio
            ? Core.computeRatio(counts, spec.formulas.ME_ratio) : null,
        morphologyComments: comments || '',
        lowCountNote: Core.buildLowCountNote(differentialTotal, spec.targetCount),
        outputs: {}
    };
    const intPcts = Core.percentagesSummingTo100(counts, 0, { exclude });
    const values = Core.buildTemplateValues(session, intPcts);
    spec.templates.forEach(tpl => {
        session.outputs[tpl.tplCode] = Core.renderTemplate(tpl.outSentence, values);
    });
    return session;
}

function press(key, n) {
    return Array.from({ length: n }, () => ({ key: key, shift: false }));
}

const sumOf = o => Number(Object.values(o).reduce((s, v) => s + v, 0).toFixed(6));

// ================================================================
describe('E2E — Keystroke to Count (SYS-030 to SYS-039)', () => {

    it('VV-E2E-001: Each mapped keypress increments exactly one category by one', () => {
        const spec = specFor('bm');
        for (const [key, cellType] of Object.entries(spec.outCodes)) {
            const counts = applyKeystrokes(spec, [{ key, shift: false }]);
            assert.equal(counts[cellType], 1, `${key} should increment ${cellType}`);
            assert.equal(Core.getTotal(counts), 1, `${key} must not increment anything else`);
        }
    });

    it('VV-E2E-002: Lowercase keystrokes count identically to uppercase', () => {
        const spec = specFor('bm');
        assert.deepEqual(
            applyKeystrokes(spec, [{ key: 'X' }, { key: 'X' }]),
            applyKeystrokes(spec, [{ key: 'x' }, { key: 'x' }])
        );
    });

    it('VV-E2E-003: Unmapped keys are silently ignored (URS-026)', () => {
        const spec = specFor('bm');
        const counts = applyKeystrokes(spec, [
            { key: '1' }, { key: 'Enter' }, { key: 'ArrowLeft' }, { key: '/' }, { key: 'Tab' }
        ]);
        assert.equal(Core.getTotal(counts), 0);
    });

    it('VV-E2E-004: Shift+key undoes, and undo at zero is a no-op (URS-025)', () => {
        const spec = specFor('bm');
        const counts = applyKeystrokes(spec, [
            { key: 'X' }, { key: 'X' }, { key: 'X' },
            { key: 'X', shift: true },
            { key: 'F', shift: true }   // never counted; must stay at 0
        ]);
        assert.equal(counts.blasts, 2);
        assert.equal(counts.poly, 0);
        assert.equal(Core.getTotal(counts), 2);
    });

    it('VV-E2E-005: A 500-keystroke bone marrow count totals exactly 500', () => {
        const spec = specFor('bm');
        const mapped = Object.keys(spec.outCodes);
        const seq = [];
        for (let i = 0; i < 500; i++) seq.push({ key: mapped[i % mapped.length] });
        assert.equal(Core.getTotal(applyKeystrokes(spec, seq)), 500);
    });
});

// ================================================================
describe('E2E — Count to Report (HA-024: table and report must agree)', () => {

    it('VV-E2E-010: Report percentages track the displayed percentages within one point', () => {
        const spec = specFor('bm');
        const counts = applyKeystrokes(spec, [
            ...press('X', 45), ...press('F', 120), ...press('S', 38),
            ...press('A', 20), ...press('B', 150), ...press('D', 45),
            ...press('G', 16), ...press('V', 35), ...press('C', 40)
        ]);
        const display = Core.percentagesSummingTo100(counts, 2);
        const report = Core.percentagesSummingTo100(counts, 0);
        for (const ct of Object.keys(counts)) {
            assert.ok(Math.abs(report[ct] - display[ct]) <= 1,
                `${ct}: report ${report[ct]} vs display ${display[ct]} differ by more than one point`);
        }
    });

    it('VV-E2E-011: Both the displayed and the reported differential sum to 100', () => {
        const spec = specFor('bm');
        const counts = applyKeystrokes(spec, [
            ...press('X', 7), ...press('F', 7), ...press('S', 7),
            ...press('A', 7), ...press('B', 7), ...press('D', 7), ...press('G', 7)
        ]);
        assert.equal(sumOf(Core.percentagesSummingTo100(counts, 2)), 100);
        assert.equal(sumOf(Core.percentagesSummingTo100(counts, 0)), 100);
    });

    it('VV-E2E-012: Every template placeholder is resolved — no {{token}} survives', () => {
        const spec = specFor('bm');
        const counts = applyKeystrokes(spec, [...press('X', 50), ...press('B', 50)]);
        const session = buildSession('bm', counts, 'S25-1234', 'Auer rods seen');
        for (const tpl of spec.templates) {
            const out = session.outputs[tpl.tplCode];
            assert.ok(out && out.length > 0, `${tpl.tplCode} produced no output`);
            assert.doesNotMatch(out, /\{\{/, `${tpl.tplCode} left an unresolved placeholder`);
        }
    });

    it('VV-E2E-013: Every specimen type in the profile renders every template', () => {
        for (const spec of config) {
            const counts = applyKeystrokes(spec, [{ key: Object.keys(spec.outCodes)[0] }]);
            const session = buildSession(spec.specimenType, counts, 'S25-9', '');
            assert.equal(Object.keys(session.outputs).length, spec.templates.length);
            spec.templates.forEach(tpl => {
                assert.ok(session.outputs[tpl.tplCode], `${spec.specimenType}/${tpl.tplCode} missing`);
            });
        }
    });

    it('VV-E2E-014: M:E ratio in the report matches the ratio computed from counts', () => {
        const spec = specFor('bm');
        const counts = applyKeystrokes(spec, [...press('F', 100), ...press('B', 50)]);
        const session = buildSession('bm', counts, '', '');
        assert.equal(session.meRatio, '2.0:1');
        assert.match(session.outputs.ysm, /2\.0:1/);
    });

    it('VV-E2E-015: Peripheral blood profile defines no M:E ratio and reports none', () => {
        const spec = specFor('pb');
        const counts = applyKeystrokes(spec, press('F', 100));
        const session = buildSession('pb', counts, '', '');
        assert.equal(session.meRatio, null);
        assert.doesNotMatch(session.outputs.mgh, /M:E/);
    });
});

// ================================================================
describe('E2E — Traceability Fields in Output (URS-052)', () => {

    it('VV-E2E-020: Session carries profile id, name, version, target and timestamp', () => {
        const spec = specFor('bm');
        const session = buildSession('bm', applyKeystrokes(spec, press('X', 10)), 'S25-1234', '');
        assert.equal(session.configProfileId, 'consensus-14');
        assert.equal(session.configVersion, normalized.version,
            'the session must record the version of the profile actually in force');
        assert.ok(session.configProfileName);
        assert.equal(session.targetCount, 500);
        assert.ok(session.timestamp);
        assert.equal(session.specimenLabel, 'Bone Marrow');
    });

    it('VV-E2E-021: CSV export carries every traceability column', () => {
        const spec = specFor('bm');
        const csv = Core.buildSessionCsv([
            buildSession('bm', applyKeystrokes(spec, press('X', 10)), 'S25-1234', 'note')
        ]);
        const header = csv.split('\n')[0].split(',');
        ['caseNumber', 'specimenType', 'timestamp', 'configProfileId', 'configVersion',
            'targetCount', 'totalCount', 'meRatio', 'morphologyComments', 'counts',
            'percentages', 'outputs'].forEach(col => {
            assert.ok(header.includes(col), `CSV header missing ${col}`);
        });
        const row = csv.split('\n')[1];
        assert.match(row, /consensus-14/);
        assert.match(row, /S25-1234/);
    });

    it('VV-E2E-022: JSON export round-trips and carries traceability', () => {
        const spec = specFor('bm');
        const parsed = JSON.parse(Core.buildSessionJson([
            buildSession('bm', applyKeystrokes(spec, press('X', 10)), 'S25-1234', '')
        ]));
        assert.equal(parsed.length, 1);
        assert.equal(parsed[0].configProfileId, 'consensus-14');
        assert.equal(parsed[0].counts.blasts, 10);
        // Report text is exported as plain text, not markup
        assert.doesNotMatch(parsed[0].outputs.pdx, /<br>/);
        assert.match(parsed[0].outputs.pdx, /\n/);
    });

    it('VV-E2E-023: Low-count advisory is recorded on the session (URS-041)', () => {
        const spec = specFor('bm');
        const short = buildSession('bm', applyKeystrokes(spec, press('X', 216)), '', '');
        assert.ok(short.lowCountNote, 'a 216-cell BM count is below the 500 target');
        assert.match(short.lowCountNote, /216-cell count/);
        const full = buildSession('bm', applyKeystrokes(spec, press('X', 500)), '', '');
        assert.equal(full.lowCountNote, null);
    });
});

// ================================================================
describe('E2E — Output Safety (SYS-S04)', () => {

    it('VV-E2E-030: Markup in the case number cannot escape into the report', () => {
        const spec = specFor('bm');
        const counts = applyKeystrokes(spec, press('X', 10));
        const session = buildSession('bm', counts, '<img src=x onerror="alert(1)">', '<script>steal()</script>');
        const out = Core.renderTemplate(
            'Case {{caseNumber}} — {{comments}}<br>{{total}} cells',
            Core.buildTemplateValues(session, Core.percentagesSummingTo100(counts, 0))
        );

        // The only live markup permitted in rendered output is the formatting
        // allowlist. Anything else the operator typed must survive as inert
        // escaped text, never as a tag.
        const liveTags = out.match(/<[^>]*>/g) || [];
        liveTags.forEach(tag => {
            assert.match(tag, /^<\/?(br|b|i|em|strong|u|p)>$/,
                `unexpected live markup in rendered output: ${tag}`);
        });
        assert.ok(!/<img/i.test(out) && !/<script/i.test(out));
        assert.match(out, /&lt;img/);          // escaped, inert
        assert.match(out, /&lt;script&gt;/);   // escaped, inert
        assert.match(out, /<br>/);             // legitimate template markup survives
    });

    it('VV-E2E-034: Event-handler attributes in a template are stripped, not rendered', () => {
        // A hostile imported profile cannot smuggle script through a template.
        const out = Core.renderTemplate('<img src=x onerror="alert(1)">Report<br>ok', {});
        const liveTags = out.match(/<[^>]*>/g) || [];
        liveTags.forEach(tag => {
            assert.match(tag, /^<\/?(br|b|i|em|strong|u|p)>$/,
                `template markup escaped the allowlist: ${tag}`);
        });
    });

    it('VV-E2E-031: Replacement-pattern characters are inserted literally', () => {
        const out = Core.renderTemplate('X={{caseNumber}}', { caseNumber: "$&$`$'" });
        assert.match(out, /\$&amp;\$`\$&#39;/);
    });

    it('VV-E2E-032: Spreadsheet formula injection is neutralized in CSV', () => {
        const spec = specFor('bm');
        const csv = Core.buildSessionCsv([
            buildSession('bm', applyKeystrokes(spec, press('X', 1)), '=HYPERLINK("http://evil","x")', '')
        ]);
        assert.doesNotMatch(csv, /(^|,)=HYPERLINK/m);
        assert.match(csv, /'=HYPERLINK/);
    });

    it('VV-E2E-033: Ordinary case numbers are not mangled by the CSV guard', () => {
        assert.equal(Core.escapeCsv('S25-1234'), 'S25-1234');
        assert.equal(Core.escapeCsv('H25-00567'), 'H25-00567');
        assert.equal(Core.escapeCsv('25-A-12345'), '25-A-12345');
    });
});

// ================================================================
describe('E2E — Morphology Comments (URS-071, HA-052)', () => {

    it('VV-E2E-040: Comments reach the report when the template references them', () => {
        const spec = specFor('bm');
        const counts = applyKeystrokes(spec, press('X', 10));
        const session = buildSession('bm', counts, '', 'Toxic granulation, Dohle bodies');
        const out = Core.renderTemplate('Findings: {{comments}}',
            Core.buildTemplateValues(session, Core.percentagesSummingTo100(counts, 0)));
        assert.match(out, /Toxic granulation, Dohle bodies/);
    });

    it('VV-E2E-041: Comments survive CSV round-trip including commas and quotes', () => {
        const spec = specFor('bm');
        const csv = Core.buildSessionCsv([
            buildSession('bm', applyKeystrokes(spec, press('X', 1)), 'C1', 'Auer rods, "rare"; dysplasia')
        ]);
        assert.match(csv, /"Auer rods, ""rare""; dysplasia"/);
    });
});

// ================================================================
describe('E2E — Continue Counting preserves the tally (URS-042, HA-071)', () => {

    it('VV-E2E-050: Resuming and adding cells extends rather than restarts the count', () => {
        const spec = specFor('bm');
        const first = applyKeystrokes(spec, [...press('X', 40), ...press('F', 160)]);
        assert.equal(Core.getTotal(first), 200);

        // Continue Counting keeps state.counts and simply reattaches the handler.
        const resumed = Object.assign({}, first);
        for (const kp of press('X', 10)) {
            resumed[spec.outCodes[kp.key]]++;
        }
        assert.equal(resumed.blasts, 50);
        assert.equal(Core.getTotal(resumed), 210);

        // Percentages must reflect the extended denominator, not the original.
        const p = Core.percentagesSummingTo100(resumed, 2);
        assert.ok(Math.abs(p.blasts - (50 / 210 * 100)) <= 0.01);
        assert.equal(sumOf(p), 100);
    });
});

// ================================================================
describe('E2E — Denominator policy (URS-030, DCR-006)', () => {

    it('VV-DEN-001: NRBC are excluded from the peripheral blood denominator', () => {
        const spec = specFor('pb');
        assert.deepEqual(spec.denominatorExcludes, ['nrbc'],
            'the shipped PB profile must place NRBC outside the differential');

        const counts = applyKeystrokes(spec, [
            ...press('F', 120), ...press('S', 40), ...press('A', 15),
            ...press('G', 5), ...press('B', 20)   // B = nrbc
        ]);
        assert.equal(Core.getTotal(counts), 200, '200 cells were tallied');
        assert.equal(Core.getDenominator(counts, ['nrbc']), 180,
            'but only 180 of them are leucocytes');

        const p = Core.percentagesSummingTo100(counts, 2, { exclude: ['nrbc'] });
        // 120/180 = 66.67%, not 120/200 = 60%
        assert.equal(p.poly, 66.67);
        assert.equal(p.lymph, 22.22);
        assert.equal(p.nrbc, null, 'NRBC has no percentage of the differential');
        assert.equal(sumOf(p), 100);
    });

    it('VV-DEN-002: NRBC are reported per 100 WBC', () => {
        const spec = specFor('pb');
        const counts = applyKeystrokes(spec, [...press('F', 180), ...press('B', 20)]);
        assert.equal(Core.computePer100(counts, 'nrbc', ['nrbc'], 1), 11.1);
        const session = buildSession('pb', counts, 'S25-1', '');
        assert.equal(session.per100.nrbc, 11.1);
        assert.equal(session.differentialTotal, 180);
        assert.equal(session.totalCount, 200);
    });

    it('VV-DEN-003: The PB report states the leucocyte count and NRBC per 100 WBC', () => {
        const spec = specFor('pb');
        const counts = applyKeystrokes(spec, [...press('F', 180), ...press('B', 20)]);
        const session = buildSession('pb', counts, 'S25-1', '');
        const text = Core.htmlToText(session.outputs.mgh);
        assert.match(text, /180-cell differential/,
            'the differential is of the 180 leucocytes, not all 200 cells counted');
        assert.match(text, /100% segmented neutrophils/);
        assert.match(text, /11\.1 per 100 WBC/);
        assert.doesNotMatch(text, /\{\{/);
    });

    it('VV-DEN-004: Bone marrow is unaffected — erythroblasts stay in the denominator', () => {
        const spec = specFor('bm');
        assert.ok(!spec.denominatorExcludes || spec.denominatorExcludes.length === 0,
            'ICSH 2008 includes erythroblasts in the nucleated differential count');
        const counts = applyKeystrokes(spec, [...press('F', 180), ...press('B', 20)]);
        const p = Core.percentagesSummingTo100(counts, 2);
        assert.equal(Core.getDenominator(counts, spec.denominatorExcludes), 200);
        assert.equal(p.poly, 90);
        assert.equal(p.nrbc, 10, 'erythroblasts are a reported percentage in marrow');
    });

    it('VV-DEN-005: The advisory measures the differential, not the overall tally', () => {
        const spec = specFor('pb');
        // 190 WBC + 20 NRBC = 210 cells tallied, but only 190 in the differential
        const counts = applyKeystrokes(spec, [...press('F', 190), ...press('B', 20)]);
        const session = buildSession('pb', counts, '', '');
        assert.equal(session.totalCount, 210);
        assert.equal(session.differentialTotal, 190);
        assert.ok(session.lowCountNote, 'a 190-leucocyte differential is below the 200 target');
        assert.match(session.lowCountNote, /190-cell count/);
    });

    it('VV-DEN-006: A zero denominator does not divide by zero', () => {
        const spec = specFor('pb');
        const counts = applyKeystrokes(spec, press('B', 5));   // NRBC only
        assert.equal(Core.getDenominator(counts, ['nrbc']), 0);
        assert.equal(Core.computePer100(counts, 'nrbc', ['nrbc'], 1), null);
        const p = Core.percentagesSummingTo100(counts, 2, { exclude: ['nrbc'] });
        assert.equal(p.nrbc, null);
        Object.entries(p).forEach(([ct, v]) => {
            if (v !== null) assert.equal(v, 0, `${ct} must be 0, not NaN`);
        });
        const session = buildSession('pb', counts, '', '');
        assert.doesNotMatch(Core.htmlToText(session.outputs.mgh), /NaN|Infinity|\{\{/);
    });
});
