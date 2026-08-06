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
const sop = fs.readFileSync(
    path.join(ROOT, 'QMS', 'DHF', 'SOP-001-StandardOperatingProcedure.md'), 'utf-8');
const methods = fs.readFileSync(path.join(ROOT, 'web', 'methods.html'), 'utf-8');
// The controlled artefact is the served page; the QMS Markdown file is a
// control record that points at it (CAL-001 Rev B).
const calcref = fs.readFileSync(path.join(ROOT, 'web', 'calculation-reference.html'), 'utf-8');

// ================================================================
describe('SDD-001 describes the software that exists (URS-092)', () => {

    /**
     * SDD-001 contained zero occurrences of Wilson, confidence, threshold,
     * denominatorExcludes, per100 or rounding — it described none of what had
     * been built since DCR-006, while RTM-001 cited sections §3.9 and §3.11 to
     * §3.17 that did not exist and §3.5.2 gave a percentage formula the product
     * had not used for months.
     *
     * A design document that describes different software than the one shipped
     * is not merely stale; it is what a reviewer reads to decide whether the
     * implementation is sound.
     */
    const sdd = fs.readFileSync(
        path.join(ROOT, 'QMS', 'DHF', 'SDD-001-SoftwareDetailedDesign.md'), 'utf-8');

    it('UD-060: Every section RTM-001 cites in SDD-001 exists', () => {
        const rtm = fs.readFileSync(
            path.join(ROOT, 'QMS', 'DHF', 'RTM-001-RequirementsTraceabilityMatrix.md'), 'utf-8');
        const cited = new Set();
        for (const line of rtm.split('\n')) {
            if (!line.startsWith('| URS-')) continue;
            const cols = line.split('|').map(c => c.trim());
            if (cols.length <= 5) continue;
            for (const ref of cols[4].match(/\d+\.\d+(?:\.\d+)?/g) || []) cited.add(ref);
        }
        assert.ok(cited.size > 10, 'no design references found in RTM-001 — the parse is wrong');

        const missing = [...cited].filter(ref => {
            const top = ref.split('.').slice(0, 2).join('.');
            return !new RegExp('^#{2,4} ' + top.replace('.', '\\.') + '[ .]', 'm').test(sdd);
        });
        assert.deepEqual(missing, [],
            'RTM-001 cites SDD-001 sections that do not exist: ' + missing.join(', '));
    });

    it('UD-061: The design covers the calculations the engine performs', () => {
        // Each of these decides a reported number. A design document silent on
        // them cannot be used to review the implementation.
        for (const topic of ['Wilson', 'confidence interval', 'threshold',
                             'denominatorExcludes', 'per100', 'rounding',
                             'largest-remainder', 'method statement']) {
            assert.ok(new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(sdd),
                `SDD-001 does not mention "${topic}", which changes a reported number`);
        }
    });

    it('UD-062: The superseded percentage formula is marked, not left standing', () => {
        assert.ok(!/percentage = \(state\.counts\[cellType\] \/ total\) \* 100\s*```/.test(sdd),
            'SDD-001 still presents the pre-DCR-006 percentage formula as current');
        assert.match(sdd, /Superseded by/i,
            'the withdrawn description must say so rather than be silently deleted');
    });

    it('UD-063: The design does not describe a CDN dependency the product removed', () => {
        // URS-094 requires counting without an internet connection. Tailwind is
        // vendored and precached; saying otherwise would mislead a reviewer
        // assessing that requirement.
        assert.ok(!/Tailwind CSS\*\* \(loaded via CDN\)/.test(sdd),
            'SDD-001 still describes Tailwind as loaded from a CDN');
        assert.match(sdd, /vendor\/tailwind\.js/,
            'SDD-001 must record that Tailwind is vendored');
    });
});

// ================================================================
describe('The device-status analysis stays tied to the product (DHF-001 §3.0)', () => {

    /**
     * DHF-001 §3.0 argues the software is not a device under FD&C Act
     * §520(o)(1)(E), and rests that argument on four things the product does:
     * the operator identifies every cell, every report states the conventions
     * that produced it, the calculation reference publishes the full
     * derivation, and the software states the precision of its own output.
     *
     * §3.0.5 records those as load-bearing rather than decorative. These tests
     * make that literal: remove one and the regulatory argument fails here,
     * rather than silently becoming untrue.
     *
     * None of this validates the analysis. It is unreviewed, and UD-092 keeps
     * it labelled that way.
     */
    const dhf = fs.readFileSync(
        path.join(ROOT, 'QMS', 'DHF', 'DHF-001-DesignHistoryFile-Index.md'), 'utf-8');
    const section = dhf.slice(dhf.indexOf('## 3.0 Device Status Analysis'),
                              dhf.indexOf('## 3.1 Software Safety'));

    it('UD-090: All four statutory criteria are assessed, not just the easy ones', () => {
        assert.ok(section.length > 2000, 'the device-status analysis is missing or truncated');
        for (const marker of ['520(o)(1)(E)', '864.5220', 'Clinical Decision Support']) {
            assert.ok(section.includes(marker), `§3.0 does not cite ${marker}`);
        }
        for (const criterion of ['(i)', '(ii)', '(iii)', '(iv)']) {
            assert.ok(section.includes(criterion), `§3.0 does not address criterion ${criterion}`);
        }
        // The two the analysis singles out must each have their own treatment.
        assert.match(section, /Criterion \(i\) is the weakest/,
            'the analysis must say which criterion is most open to challenge');
        assert.match(section, /Criterion \(iv\) is the strongest/);
    });

    it('UD-091: The features the argument depends on still exist', () => {
        // Each of these is cited in §3.0.4 as evidence that a professional can
        // independently review the basis for the output.
        const core = fs.readFileSync(path.join(ROOT, 'web', 'scripts', 'wbc-core.js'), 'utf-8');
        assert.match(core, /function buildMethodStatement/,
            'the method statement is load-bearing for criterion (iv) and has been removed');
        assert.match(core, /function wilsonInterval/,
            'the confidence interval is load-bearing for criterion (iv) and has been removed');
        assert.match(core, /function evaluateThresholds/,
            'the near-threshold advisory is load-bearing for criterion (iv) and has been removed');
        assert.ok(fs.existsSync(path.join(ROOT, 'web', 'calculation-reference.html')),
            'the calculation reference is load-bearing for criterion (iv) and has been removed');

        // And the claim the whole analysis rests on: no cell identification.
        assert.match(dhf, /does not perform autonomous cell identification/i,
            'the intended-use statement no longer disclaims cell identification');
    });

    it('UD-092: It is labelled unreviewed until a qualified reviewer signs it', () => {
        assert.match(section, /not regulatory advice/i,
            'the analysis must disclaim being regulatory advice');
        assert.match(section, /Not reviewed\. Not relied upon\./,
            'the analysis must carry its unreviewed status');
        assert.match(section, /Outstanding/,
            'the reviewer actions must remain open until they are closed');
        // It is a US reading only; the EU position differs and must be flagged.
        assert.match(section, /Rule 11|2017\/745/,
            'the analysis must record that it does not travel to the EU');
    });
});

// ================================================================
describe('SAD-001 describes the architecture that exists (URS-092)', () => {

    /**
     * SAD-001 carried the same drift as SDD-001 and one defect neither the
     * README nor SDD-001 had reached: §7.1 stated "sessionStorage only … No
     * localStorage, no cookies, no IndexedDB". Four sites write to
     * localStorage, one of them a crash-recovery snapshot holding the
     * accession number and the free-text morphology comments.
     *
     * That is the claim a privacy officer reads. The identical false claim was
     * found in README.md by independent review and corrected under DCR-015 —
     * and not propagated here, which is HA-097 applied to the architecture.
     */
    const sad = fs.readFileSync(
        path.join(ROOT, 'QMS', 'DHF', 'SAD-001-SystemArchitectureDesign.md'), 'utf-8');

    it('UD-070: The architecture names every shipped module', () => {
        const scripts = fs.readdirSync(path.join(ROOT, 'web', 'scripts'));
        for (const file of scripts) {
            assert.ok(sad.includes(file),
                `SAD-001 does not mention ${file}, which ships`);
        }
        for (const file of ['sw.js', 'theme.css']) {
            assert.ok(sad.includes(file), `SAD-001 does not mention ${file}`);
        }
    });

    it('UD-071: It does not deny the data at rest that the product holds', () => {
        // Only assertions the document makes in its own voice. A correction
        // note and a revision-history row both QUOTE the withdrawn claim, and
        // must be allowed to — erasing the quotation would remove the evidence
        // that the correction happened.
        const claims = sad.split('\n')
            .filter(line => !line.trimStart().startsWith('>'))     // block quotes
            .filter(line => !/^\|\s*\d+\.\d+\s*\|/.test(line))      // revision rows
            .join('\n');

        assert.ok(!/sessionStorage only/i.test(claims),
            'SAD-001 still claims sessionStorage is the only storage used');
        assert.ok(!/No localStorage/i.test(claims),
            'SAD-001 still denies using localStorage; four sites write to it');
        assert.match(sad, /wbcds_autosave/,
            'the crash-recovery snapshot holds patient data and must be named');
        assert.match(sad, /accession number/i,
            'and what it holds must be stated, not implied');
    });

    it('UD-072: It does not describe a CDN dependency the product removed', () => {
        assert.ok(!/Tailwind CSS via CDN/i.test(sad),
            'SAD-001 still describes Tailwind as CDN-delivered, which would defeat URS-094');
        assert.match(sad, /vendor\/tailwind\.js/,
            'SAD-001 must record that Tailwind is vendored');
    });

    it('UD-073: Every file it lists in the layout actually exists', () => {
        // It listed `logo-showcase.html`, which does not exist.
        // `json` before `js`: regex alternation is ordered, so `js` otherwise
        // matches inside `templates.json` and the test looks for `templates.js`.
        const listed = [...sad.matchAll(/^\s*[├└]──\s+([A-Za-z0-9._-]+\.(?:html|json|js|css))\b/gm)]
            .map(m => m[1]);
        assert.ok(listed.length > 5, 'no file layout found in SAD-001 — the parse is wrong');
        const present = new Set();
        for (const dir of ['', 'scripts', 'styles', 'vendor', 'settings']) {
            const full = path.join(ROOT, 'web', dir);
            if (fs.existsSync(full)) for (const f of fs.readdirSync(full)) present.add(f);
        }
        const missing = listed.filter(f => !present.has(f));
        assert.deepEqual(missing, [],
            'SAD-001 lists files that do not exist: ' + missing.join(', '));
    });

    it('UD-075: The component diagram shows every layer that exists', () => {
        // The previous diagram drew a flat grid of counter features and omitted
        // every module added since DCR-006 — including the engine that computes
        // every number in it.
        const diagram = sad.slice(sad.indexOf('### 3.1'), sad.indexOf('### 3.2'));
        for (const part of ['wbc-core.js', 'wbc-dialog.js', 'config-editor.js',
                            'mdc-app.js', 'sw.js', 'validateConfig',
                            'wbcds_autosave', 'wbcds_config']) {
            assert.ok(diagram.includes(part),
                `the component diagram does not show ${part}`);
        }
    });

    it('UD-076: The counting flow shows the guards that protect the tally', () => {
        const flow = sad.slice(sad.indexOf('### 4.1'), sad.indexOf('### 4.2'));
        // Each of these rejects a keystroke that would otherwise change a
        // clinical number, and each was a recorded hazard.
        for (const [needle, hazard] of [['ev.repeat', 'HA-103 auto-repeat'],
                                        ['isComposing', 'input-method composition'],
                                        ['dialog', 'HA-102 dialog owns the keyboard'],
                                        ['physical key', 'HA-104 Shift-decrement']]) {
            assert.ok(new RegExp(needle, 'i').test(flow),
                `the counting flow does not show ${hazard}`);
        }
        // And the arithmetic it actually performs.
        for (const needle of ['getDenominator', 'percentagesSummingTo100', 'autosave']) {
            assert.ok(new RegExp(needle, 'i').test(flow),
                `the counting flow does not show ${needle}`);
        }
    });

    it('UD-077: The completion flow shows what the results screen computes', () => {
        const flow = sad.slice(sad.indexOf('### 4.2'), sad.indexOf('### 4.3'));
        for (const needle of ['wilsonInterval', 'evaluateThresholds',
                              'buildMethodStatement', 'correctWbcForNrbc']) {
            assert.ok(flow.includes(needle),
                `the completion flow does not show ${needle}`);
        }
        assert.match(flow, /advisory, never blocking/i,
            'the flow must record that the advisories do not block (URS-041)');
    });

    it('UD-078: The reset flow does not claim behaviour the code does not have', () => {
        const flow = sad.slice(sad.indexOf('### 4.4'), sad.indexOf('### 4.5'));
        // resetToStart preserves the specimen type and clears the autosave.
        // Nothing locks the specimen selector, so nothing re-enables it.
        assert.match(flow, /PRESERVE the specimen type/i,
            'the reset flow must record that the specimen type survives (URS-063)');
        assert.match(flow, /autosave/i,
            'the reset flow must record that the recovery snapshot is discarded');
        assert.ok(!/Enable specimen type selector/i.test(flow),
            'the reset flow still claims it re-enables a selector that is never disabled');
    });

    it('UD-079: §6 documents every field of the real state object', () => {
        // Extracted from the source, so a field added to `state` without being
        // documented fails here rather than at the next review.
        const app = fs.readFileSync(path.join(ROOT, 'web', 'scripts', 'mdc-app.js'), 'utf-8');
        const block = app.slice(app.indexOf('const state = {'));
        const fields = [...block.slice(0, block.indexOf('};')).matchAll(/^\s{8}(\w+):/gm)]
            .map(m => m[1]);
        assert.ok(fields.length > 10, `only ${fields.length} state fields parsed — the parse is wrong`);

        const section = sad.slice(sad.indexOf('### 6.2'), sad.indexOf('### 6.4'));
        const missing = fields.filter(f => !section.includes(f));
        assert.deepEqual(missing, [],
            'SAD-001 §6.2 does not document these state fields: ' + missing.join(', '));
    });

    it('UD-080: §6 documents every storage key, and which hold patient data', () => {
        const app = fs.readFileSync(path.join(ROOT, 'web', 'scripts', 'mdc-app.js'), 'utf-8');
        const keys = [...app.matchAll(/const \w+_KEY = '(wbcds_\w+)'/g)].map(m => m[1]);
        assert.ok(keys.length >= 5, `only ${keys.length} storage keys parsed`);

        const section = sad.slice(sad.indexOf('### 6.3'), sad.indexOf('### 6.4'));
        const missing = keys.filter(k => !section.includes(k));
        assert.deepEqual(missing, [],
            'SAD-001 §6.3 does not document these storage keys: ' + missing.join(', '));

        // The two that carry patient data must be marked as such.
        for (const key of ['wbcds_autosave', 'wbcds_history']) {
            const row = section.split('\n').find(l => l.includes(key));
            assert.match(row, /\*\*Yes\*\*/,
                `${key} holds patient data; §6.3 does not say so`);
        }
    });

    it('UD-081: §6 does not claim the tally is lost on page close', () => {
        // It said "closure state, lost on page close". Autosave persists an
        // interrupted count across a browser restart — that is the feature.
        const section = sad.slice(sad.indexOf('## 6. State Management'),
                                  sad.indexOf('## 7. Security'));
        const claims = section.split('\n').filter(l => !l.trimStart().startsWith('>')).join('\n');
        assert.ok(!/lost on page close/i.test(claims),
            'SAD-001 §6 still claims the tally is lost when the page closes');
        assert.match(section, /12 hours/i,
            'the bound on the recovery snapshot must be stated where it is described');
    });

    it('UD-074: It does not fix the key mapping that configuration owns', () => {
        assert.ok(!/R=nrbc, L=blasts/.test(sad),
            'SAD-001 still states a literal key mapping withdrawn at v2.0');
        assert.ok(!/\(R, L, O, M, T, C, S, B, P, A, E, N, Y, X\)/.test(sad),
            'SAD-001 still lists the withdrawn key set as the accepted input');
    });
});

// ================================================================
describe('SOP-001 tracks the shipped configuration (HA-097)', () => {

    /**
     * HA-097 was raised because USER-GUIDE.md documented a superseded
     * nine-category layout. The control was added for that file and not
     * propagated: SOP-001 — a document marked "Issued for local adoption",
     * i.e. the one a laboratory prints and follows — still documented
     * A=blast, F=eryth, X=eos with targets of 200 and 100.
     *
     * The shipped profile maps A=mono, F=poly and X=blasts. An operator
     * following the issued SOP would have pressed A for a blast and recorded
     * a monocyte, and F for an erythroid precursor and recorded a segmented
     * neutrophil — a systematically wrong differential with no error shown.
     */

    it('UD-050: Every counting key in the shipped profile is documented correctly', () => {
        for (const spec of config.specimenTypes) {
            for (const [key, cellType] of Object.entries(spec.outCodes)) {
                const row = new RegExp('\\|\\s*\\*\\*' + key + '\\*\\*\\s*\\|\\s*' + cellType + '\\s*\\|');
                assert.match(sop, row,
                    `SOP-001 does not map "${key}" to "${cellType}" for ${spec.specimenType}; ` +
                    'an operator following it would record the wrong cell type');
            }
        }
    });

    it('UD-051: SOP-001 documents no key the profile does not define', () => {
        const defined = new Set();
        for (const spec of config.specimenTypes) {
            for (const key of Object.keys(spec.outCodes)) defined.add(key);
        }
        const documented = [...sop.matchAll(/\|\s*\*\*([A-Z])\*\*\s*\|/g)].map(m => m[1]);
        assert.ok(documented.length > 0, 'SOP-001 must document the key mapping');
        for (const key of documented) {
            assert.ok(defined.has(key),
                `SOP-001 documents key "${key}", which the shipped profile does not map`);
        }
    });

    it('UD-052: SOP-001 states the shipped target counts', () => {
        for (const spec of config.specimenTypes) {
            assert.ok(sop.includes(String(spec.targetCount)),
                `SOP-001 does not state the ${spec.specimenType} target of ${spec.targetCount}`);
        }
    });

    it('UD-053: SOP-001 does not describe withdrawn behaviour', () => {
        // URS-041 makes the target advisory and URS-043 (locking after
        // completion) was withdrawn in favour of Continue Counting.
        assert.ok(!/warning dialog will appear/i.test(sop),
            'SOP-001 still describes a blocking below-target dialog; the advisory does not block');
        assert.ok(!/counting table locks/i.test(sop),
            'SOP-001 still says the table locks after completion; Continue Counting replaced that');
        assert.ok(!/selector will be locked/i.test(sop),
            'SOP-001 still says the specimen selector locks; it can be changed during counting');
    });
});

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
        assert.match(calcref, /thirteen at 7%, one at .*?9%/s);
        assert.match(calcref, /all at 7%/);
    });

    it('UD-032: The two M:E conventions give the stated ratios', () => {
        // The alternative is the shipped formula with monocytes removed from
        // the numerator — one checkbox in the editor, not a separate preset
        // (DCR-020).
        const presets = path.join(ROOT, 'web', 'settings', 'presets');
        const bm = Core.normalizeConfig(JSON.parse(
            fs.readFileSync(path.join(presets, 'consensus-14.json'), 'utf-8')))
            .specimenTypes.find(s => s.specimenType === 'bm');
        const icsh = bm.formulas.ME_ratio;
        const alt = Object.assign({}, icsh,
            { numerator: icsh.numerator.filter(ct => ct !== 'mono') });

        const c = zero(); c.poly = 150; c.mono = 60; c.nrbc = 90;
        assert.equal(Core.computeRatio(c, icsh), '2.3:1');
        assert.equal(Core.computeRatio(c, alt), '1.7:1');
        assert.ok(calcref.includes('2.3:1') && calcref.includes('1.7:1'));
    });

    it('UD-093: The precision table is engine-produced (C-3)', () => {
        // The resolution column and every interval in §1.2a, recomputed. One
        // was written as 43.2-56.8% and the engine gives 43.1-56.9%; a section
        // arguing that displayed digits overstate precision cannot itself
        // carry a digit that is wrong.
        for (const [n, step] of [[100, '1.0'], [200, '0.5'], [500, '0.2']]) {
            assert.equal((100 / n).toFixed(1), step, `resolution at n=${n}`);
            const ci = Core.wilsonInterval(Math.round(0.5 * n), n, 0.95);
            const text = Core.formatInterval(ci, 1);
            assert.ok(calcref.includes(text.replace('–', '&ndash;')) || calcref.includes(text),
                `the reference does not carry the engine's interval for n=${n}: ${text}`);
        }
        assert.match(calcref, /display convention, not a statement of precision/,
            'the section must say plainly what the extra digits are');
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
        assert.ok(calcref.includes('9.0%') && calcref.includes('22.5%'));
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
        assert.ok(calcref.includes('Fixed</td><td>Wilson score'),
            'the summary table must list the interval method as Fixed');
        assert.match(calcref, /Not configurable, and why/,
            'and the page must explain why, rather than staying silent');
    });

    it('UD-039: The reference says where each setting is actually reached', () => {
        // UD-036 checks the field exists in the profile and that the engine
        // honours it. That is not the same as a reader being able to find it.
        // "denominatorExcludes is configurable" sent a reviewer looking for a
        // control that did not exist (DCR-012); DCR-013 built the controls.
        // This pins the page's account of where they are to the editor source,
        // in both directions — it failed, correctly, the moment the controls
        // were added and the page still said there were none.
        assert.match(calcref, /Where these settings live/,
            'the reference must tell the reader where a setting is changed, not only that it can be');
        assert.match(calcref, /Counting Policy/,
            'and must name the panel that holds the calculation policy');

        const editorHtml = fs.readFileSync(path.join(ROOT, 'web', 'editor.html'), 'utf-8');
        const editorJs = fs.readFileSync(path.join(ROOT, 'web', 'scripts', 'config-editor.js'), 'utf-8');

        assert.ok(editorHtml.includes('id="policy-editor"'),
            'the reference describes a Counting Policy panel; the editor has no container for it');

        // Every field the page says the editor now sets must have a control
        // that writes it back into the saved profile.
        const controls = {
            denominatorExcludes: 'pol-excl',
            per100Reporting: 'pol-per100-label',
            rounding: 'pol-rounding',
            precision: 'pol-prec-display',
            confidenceIntervals: 'pol-ci-enabled',
            thresholds: 'pol-thr-add',
            formulas: 'pol-f-member'
        };
        for (const [field, control] of Object.entries(controls)) {
            assert.ok(editorJs.includes(control),
                `the reference says the editor sets "${field}", but control "${control}" does not exist`);
            assert.ok(new RegExp('merged\\.' + field + '\\s*=').test(editorJs),
                `"${field}" has a control but is never written back into the saved profile`);
        }

        // And the fields it says are JSON-only must really have no control.
        for (const field of ['constituents', 'categoryNotes', 'targetCountBasis', 'provenance']) {
            assert.ok(calcref.includes('<code>' + field + '</code>'),
                `the reference must list "${field}" among the fields reached by editing the JSON`);
            assert.ok(!new RegExp('id="[^"]*' + field + '[^"]*"', 'i').test(editorHtml),
                `the editor now has a control for "${field}"; the reference still says it has none`);
        }
    });

    it('UD-040: The blast-denominator change is attributed to WHO 2016, not 2022', () => {
        // Independent review finding C-1. The non-erythroid-cell blast
        // denominator was withdrawn by the 2016 revision of the WHO 4th
        // edition (Arber et al., Blood 2016;127(20):2391-2405), which
        // eliminated acute erythroid leukaemia, erythroid/myeloid subtype.
        // WHO 2022 (5th ed.) and the ICC 2022 both RETAINED the
        // all-nucleated-cells denominator; neither made the change.
        //
        // The error appeared in the engine comment, the calculation reference,
        // a shipped preset and URS-001 — a wrong date on the citation for a
        // rule that moves a case across the 20% blast boundary.
        assert.match(calcref, /2016/,
            'the reference must attribute the change to the 2016 revision');
        assert.match(calcref, /Arber/,
            'and must cite it, since the date alone is the thing that was wrong');
        assert.ok(!/WHO 2022 withdrew/i.test(calcref),
            'the reference still attributes the withdrawal to WHO 2022');

        const engine = fs.readFileSync(
            path.join(ROOT, 'web', 'scripts', 'wbc-core.js'), 'utf-8');
        assert.ok(!/WHO 2022 withdrew/i.test(engine),
            'wbc-core.js still attributes the withdrawal to WHO 2022');
        assert.match(engine, /2016/,
            'wbc-core.js must name the 2016 revision');

        // No shipped profile may carry the wrong attribution either — the
        // threshold basis text is shown to the operator in the advisory.
        const presetDir = path.join(ROOT, 'web', 'settings', 'presets');
        for (const file of fs.readdirSync(presetDir).filter(f => f.endsWith('.json'))) {
            const raw = fs.readFileSync(path.join(presetDir, file), 'utf-8');
            assert.ok(!/WHO 2022 withdrew/i.test(raw),
                `${file} attributes the blast-denominator change to WHO 2022`);
        }
    });

    it('UD-038: Every abbreviation used is expanded in the table', () => {
        for (const abbr of ['WBC','NRBC','M:E ratio','NDC','ICSH','CLSI','AML','MDS','CI','CV'])
            assert.ok(calcref.includes('text-slate-200">' + abbr + '</td>'),
                `"${abbr}" is used but not expanded in the abbreviations table`);
    });
});
