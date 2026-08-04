/**
 * TEST SUITE 11: Application Behaviour (jsdom)
 * =============================================
 * Traces to: SRS SYS-001..SYS-017, SYS-030..SYS-039, SYS-050..SYS-058,
 *            SYS-070..SYS-074, SYS-080..SYS-084, SYS-100..SYS-107, SYS-130..SYS-134
 * FMEA: HA-003, HA-011, HA-013, HA-014, HA-015, HA-031, HA-041, HA-060, HA-061, HA-071
 *
 * Executes the real counter.html + wbc-core.js + mdc-app.js inside jsdom and
 * drives them through the clinical workflow. Before DCR-004 no test in this
 * project executed the application at all — every suite either re-implemented
 * the logic or asserted on file text — so defects such as the inert
 * configuration buttons and the lost morphology selections passed a fully
 * green suite.
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { boot, tick, DEFAULT_CONFIG } = require('./helpers/app-harness.js');

const clone = o => JSON.parse(JSON.stringify(o));

/** Boot straight into the counting phase. */
async function counting(opts = {}) {
    const h = await boot(opts);
    if (opts.caseNumber !== undefined) h.el('caseNumber').value = opts.caseNumber;
    h.click('btnStartCount');
    return h;
}

// ================================================================
describe('Behaviour — Boot and Phase Machine (SYS-001, SYS-130)', () => {

    it('TC-B001: Boots into case-entry with the shipped profile applied', async () => {
        const h = await boot();
        assert.equal(h.hooks.state.phase, 'case-entry');
        assert.equal(h.hooks.state.configMeta.profileId, 'consensus-14');
        assert.equal(h.hooks.state.configMeta.version, '2.0');
        assert.ok(h.visible('phase-case-entry'));
        assert.ok(!h.visible('phase-counting'));
        assert.ok(!h.visible('phase-results'));
        h.close();
    });

    it('TC-B002: Specimen selector is populated from the profile, not the static HTML', async () => {
        const cfg = clone(DEFAULT_CONFIG);
        cfg.specimenTypes[0].specimenLabel = 'Marrow Aspirate';
        const h = await boot({ config: cfg });
        const labels = [...h.el('specimenType').options].map(o => o.textContent);
        assert.ok(labels.includes('Marrow Aspirate'));
        h.close();
    });

    it('TC-B003: Start Count transitions to counting and renders the grid', async () => {
        const h = await counting({ caseNumber: 'S25-1234' });
        assert.equal(h.hooks.state.phase, 'counting');
        assert.ok(h.visible('phase-counting'));
        assert.ok(h.el('val-blasts'), 'cell cells rendered');
        assert.ok(h.el('progress-bar'));
        assert.equal(h.text('val-grand-total'), '0');
        h.close();
    });

    it('TC-B004: Case badge shows the active case throughout counting (URS-002)', async () => {
        const h = await counting({ caseNumber: 'S25-1234' });
        assert.ok(h.visible('case-badge'));
        assert.equal(h.text('case-badge-number'), 'S25-1234');
        assert.equal(h.text('case-badge-spec'), 'Bone Marrow');
        h.close();
    });

    it('TC-B005: Counting starts without a case number by default (URS-004)', async () => {
        const h = await counting({ caseNumber: '' });
        assert.equal(h.hooks.state.phase, 'counting');
        h.close();
    });
});

// ================================================================
describe('Behaviour — Keyboard Counting (SYS-030 to SYS-039)', () => {

    it('TC-B010: Mapped key increments its category and the DOM updates', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 5);
        assert.equal(h.hooks.state.counts.blasts, 5);
        assert.equal(h.text('val-blasts'), '5');
        assert.equal(h.text('val-grand-total'), '5');
        h.close();
    });

    it('TC-B011: Shift+key decrements and never goes below zero (URS-025, HA-013)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 3);
        h.key('X', { shift: true });
        assert.equal(h.hooks.state.counts.blasts, 2);
        h.press('X', 10, { shift: true });
        assert.equal(h.hooks.state.counts.blasts, 0);
        assert.equal(h.text('val-grand-total'), '0');
        h.close();
    });

    it('TC-B012: Unmapped keys are ignored and do not preventDefault (URS-026)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        const ev = h.key('1');
        assert.equal(h.text('val-grand-total'), '0');
        assert.equal(ev.defaultPrevented, false);
        h.close();
    });

    it('TC-B013: Ctrl/Alt/Meta combinations never count (SYS-036)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.key('X', { ctrl: true });
        h.key('X', { alt: true });
        h.key('X', { meta: true });
        assert.equal(h.text('val-grand-total'), '0');
        h.close();
    });

    it('TC-B014: Barcode workflow — Enter in the case field starts counting and keys still count (URS-006)', async () => {
        const h = await boot();
        const input = h.el('caseNumber');
        input.focus();
        input.value = 'S25-9999';
        input.dispatchEvent(new h.window.KeyboardEvent('keydown',
            { key: 'Enter', bubbles: true, cancelable: true }));
        assert.equal(h.hooks.state.phase, 'counting');
        // Focus must have left the (now readOnly) case field, or every
        // subsequent keystroke would be swallowed as text entry.
        assert.notEqual(h.document.activeElement, input);
        h.press('X', 4);
        assert.equal(h.text('val-grand-total'), '4');
        h.close();
    });

    it('TC-B015: Keystrokes in the comment field do not count (URS-070, SYS-073)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        const ta = h.el('morphComments');
        ta.focus();
        h.key('X', { target: ta });
        h.key('F', { target: ta });
        assert.equal(h.text('val-grand-total'), '0');
        ta.blur();
        h.press('X', 2);
        assert.equal(h.text('val-grand-total'), '2');
        h.close();
    });

    it('TC-B016: Keystrokes aimed at the specimen selector do not count', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.key('X', { target: 'specimenTypeCounting' });
        assert.equal(h.text('val-grand-total'), '0');
        h.close();
    });

    it('TC-B017: No keystroke counts before Start Count', async () => {
        const h = await boot();
        h.press('X', 5);
        assert.equal(Object.keys(h.hooks.state.counts).length, 0);
        h.close();
    });

    it('TC-B018: Percentages displayed during counting sum to 100.00 (URS-034)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        ['X', 'F', 'S', 'A', 'B', 'D', 'G'].forEach(k => h.press(k, 7));
        const spec = h.hooks.getSpecConfig();
        const cells = spec.categories.upper.concat(spec.categories.lower);
        const sum = cells.reduce((s, ct) => s + parseFloat(h.text('pct-' + ct)), 0);
        assert.equal(Number(sum.toFixed(2)), 100);
        h.close();
    });

    it('TC-B019: Progress label reverts when undo drops the count below target', async () => {
        const cfg = clone(DEFAULT_CONFIG);
        cfg.specimenTypes[0].targetCount = 3;
        const h = await counting({ config: cfg, caseNumber: 'C1' });
        h.press('X', 3);
        assert.ok(h.el('progress-label').classList.contains('text-emerald-400'));
        h.key('X', { shift: true });
        assert.ok(!h.el('progress-label').classList.contains('text-emerald-400'),
            'target styling must clear once the count falls back below target');
        h.close();
    });
});

// ================================================================
describe('Behaviour — Required Case Number (URS-004)', () => {

    it('TC-B020: A profile requiring a case number blocks Start Count when empty', async () => {
        const cfg = clone(DEFAULT_CONFIG);
        cfg.specimenTypes.forEach(s => { s.requireCaseNumber = true; });
        const h = await boot({ config: cfg });
        h.el('caseNumber').value = '';
        h.click('btnStartCount');
        assert.equal(h.hooks.state.phase, 'case-entry');
        assert.ok(h.modal().open);
        assert.match(h.modal().title, /Case Number Required/);
        h.close();
    });

    it('TC-B021: The same profile starts normally once a case number is present', async () => {
        const cfg = clone(DEFAULT_CONFIG);
        cfg.specimenTypes.forEach(s => { s.requireCaseNumber = true; });
        const h = await boot({ config: cfg });
        h.el('caseNumber').value = 'S25-1';
        h.click('btnStartCount');
        assert.equal(h.hooks.state.phase, 'counting');
        h.close();
    });
});

// ================================================================
describe('Behaviour — Completion, Continue Counting, Reset', () => {

    it('TC-B030: Count Done finalizes, records history and shows the report (URS-040)', async () => {
        const h = await counting({ caseNumber: 'S25-1234' });
        h.press('X', 20);
        h.click('btnCountDone');
        assert.equal(h.hooks.state.phase, 'results');
        assert.equal(h.hooks.state.sessionHistory.length, 1);
        assert.equal(h.hooks.state.sessionHistory[0].totalCount, 20);
        assert.ok(h.document.querySelector('.tab-panel'));
        h.close();
    });

    it('TC-B031: Keystrokes after Count Done do not alter the count (HA-015, HA-031)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 10);
        h.click('btnCountDone');
        h.press('X', 5);
        assert.equal(h.hooks.state.counts.blasts, 10);
        h.close();
    });

    it('TC-B032: Continue Counting resumes with the tally intact (URS-042, HA-071)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 40);
        h.press('F', 160);
        h.click('btnCountDone');
        h.click('btnResumeCounting');
        assert.equal(h.hooks.state.phase, 'counting');
        assert.equal(h.text('val-grand-total'), '200');
        h.press('X', 10);
        assert.equal(h.hooks.state.counts.blasts, 50);
        assert.equal(h.text('val-grand-total'), '210');
        h.close();
    });

    it('TC-B033: Free-text comments survive Count Done -> Continue Counting (URS-073)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 5);
        h.setInput('morphComments', 'Auer rods present');
        h.click('btnCountDone');
        h.click('btnResumeCounting');
        assert.equal(h.el('morphComments').value, 'Auer rods present');
        h.close();
    });

    it('TC-B034: Structured morphology selections survive Continue Counting (URS-073)', async () => {
        const cfg = clone(DEFAULT_CONFIG);
        cfg.specimenTypes[0].morphologyChecklist = ['Auer rods', 'Toxic granulation', 'Dysplasia'];
        const h = await counting({ config: cfg, caseNumber: 'C1' });
        h.press('X', 5);

        const boxes = [...h.document.querySelectorAll('.morph-check')];
        assert.equal(boxes.length, 3, 'checklist rendered');
        boxes[0].checked = true;
        boxes[0].dispatchEvent(new h.window.Event('change', { bubbles: true }));
        boxes[2].checked = true;
        boxes[2].dispatchEvent(new h.window.Event('change', { bubbles: true }));
        // Array.from: state.morphChecked is constructed inside the jsdom realm,
        // so its prototype is not Node's Array.prototype.
        assert.deepEqual(Array.from(h.hooks.state.morphChecked), ['Auer rods', 'Dysplasia']);

        h.click('btnCountDone');
        h.click('btnResumeCounting');

        const after = [...h.document.querySelectorAll('.morph-check')];
        assert.equal(after[0].checked, true, 'Auer rods must still be selected after resuming');
        assert.equal(after[1].checked, false);
        assert.equal(after[2].checked, true, 'Dysplasia must still be selected after resuming');
        h.close();
    });

    it('TC-B035: Morphology selections appear in the finalized report (URS-071)', async () => {
        const cfg = clone(DEFAULT_CONFIG);
        cfg.specimenTypes[0].morphologyChecklist = ['Auer rods'];
        const h = await counting({ config: cfg, caseNumber: 'C1' });
        h.press('X', 5);
        const box = h.document.querySelector('.morph-check');
        box.checked = true;
        box.dispatchEvent(new h.window.Event('change', { bubbles: true }));
        h.setInput('morphComments', 'marked dysplasia');
        h.click('btnCountDone');
        const session = h.hooks.state.sessionHistory[0];
        assert.equal(session.morphologyComments, '[Auer rods] marked dysplasia');
        assert.match(h.el('results-summary').textContent, /Auer rods/);
        h.close();
    });

    it('TC-B036: Reset asks for confirmation when data exists (URS-061)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 5);
        h.click('btnCountReset');
        assert.ok(h.modal().open);
        h.cancelModal();
        assert.equal(h.hooks.state.counts.blasts, 5, 'cancel must preserve the count');
        h.click('btnCountReset');
        h.confirmModal();
        assert.equal(h.hooks.state.phase, 'case-entry');
        h.close();
    });

    it('TC-B037: Reset clears data but preserves specimen type (URS-062, URS-063)', async () => {
        const h = await counting({ caseNumber: 'S25-1' });
        h.hooks.state.specimenType = 'pb';
        h.press('X', 5);
        h.click('btnCountReset');
        h.confirmModal();
        assert.equal(h.el('caseNumber').value, '');
        assert.equal(h.el('caseNumber').readOnly, false);
        assert.equal(h.hooks.state.caseNumber, '');
        assert.equal(h.hooks.state.specimenType, 'pb', 'specimen type is preserved across reset');
        h.close();
    });

    it('TC-B038: New Case from the results screen returns to a clean case-entry', async () => {
        const h = await counting({ caseNumber: 'S25-1' });
        h.press('X', 5);
        h.click('btnCountDone');
        h.click('btnNewCase');
        assert.equal(h.hooks.state.phase, 'case-entry');
        assert.equal(h.el('caseNumber').value, '');
        assert.equal(h.hooks.state.sessionHistory.length, 1, 'history is retained (URS-080)');
        h.close();
    });
});

// ================================================================
describe('Behaviour — Specimen Type Switching (URS-010, URS-013)', () => {

    it('TC-B040: The specimen switcher is reachable during counting', async () => {
        const h = await counting({ caseNumber: 'C1' });
        assert.ok(h.visible('specimen-switch-wrap'), 'switcher must be visible while counting');
        const sel = h.el('specimenTypeCounting');
        assert.equal(sel.disabled, false);
        assert.equal(sel.value, 'bm');
        h.close();
    });

    it('TC-B041: Switching with zero cells switches immediately', async () => {
        const h = await counting({ caseNumber: 'C1' });
        const sel = h.el('specimenTypeCounting');
        sel.value = 'pb';
        sel.dispatchEvent(new h.window.Event('change', { bubbles: true }));
        assert.equal(h.hooks.state.specimenType, 'pb');
        assert.ok(!h.modal().open);
        h.close();
    });

    it('TC-B042: Switching mid-count with a case number saves to history first (URS-013)', async () => {
        const h = await counting({ caseNumber: 'S25-1234' });
        h.press('X', 25);
        const sel = h.el('specimenTypeCounting');
        sel.value = 'pb';
        sel.dispatchEvent(new h.window.Event('change', { bubbles: true }));
        assert.ok(h.modal().open);
        assert.match(h.modal().message, /saved to history/);
        h.confirmModal();
        assert.equal(h.hooks.state.specimenType, 'pb');
        assert.equal(h.hooks.state.sessionHistory.length, 1);
        assert.equal(h.hooks.state.sessionHistory[0].totalCount, 25);
        assert.equal(h.hooks.state.sessionHistory[0].switchedToSpecimen, 'pb');
        assert.equal(h.text('val-grand-total'), '0', 'new specimen starts from zero');
        h.close();
    });

    it('TC-B043: Cancelling a mid-count switch restores the selector and the count', async () => {
        const h = await counting({ caseNumber: 'S25-1234' });
        h.press('X', 25);
        const sel = h.el('specimenTypeCounting');
        sel.value = 'pb';
        sel.dispatchEvent(new h.window.Event('change', { bubbles: true }));
        h.cancelModal();
        assert.equal(h.hooks.state.specimenType, 'bm');
        assert.equal(sel.value, 'bm', 'selector must snap back');
        assert.equal(h.hooks.state.counts.blasts, 25);
        h.close();
    });

    it('TC-B044: Switching without a case number confirms a discard', async () => {
        const h = await counting({ caseNumber: '' });
        h.press('X', 10);
        const sel = h.el('specimenTypeCounting');
        sel.value = 'pb';
        sel.dispatchEvent(new h.window.Event('change', { bubbles: true }));
        assert.match(h.modal().message, /Discard/);
        h.confirmModal();
        assert.equal(h.hooks.state.sessionHistory.length, 0);
        assert.equal(h.hooks.state.specimenType, 'pb');
        h.close();
    });
});

// ================================================================
describe('Behaviour — Autosave and Crash Recovery (URS-085, HA-041)', () => {

    it('TC-B050: Counting writes an autosave record after each keystroke', async () => {
        const h = await counting({ caseNumber: 'S25-1' });
        h.press('X', 3);
        const saved = JSON.parse(h.window.localStorage.getItem('wbcds_autosave'));
        assert.equal(saved.counts.blasts, 3);
        assert.equal(saved.caseNumber, 'S25-1');
        assert.equal(saved.phase, 'counting');
        h.close();
    });

    it('TC-B051: An interrupted count is offered for recovery and restores fully', async () => {
        const h = await boot({
            localStorage: {
                wbcds_autosave: {
                    caseNumber: 'S25-7777', specimenType: 'bm',
                    counts: { blasts: 42, poly: 8 },
                    morphologyComments: 'partial review',
                    morphChecked: [],
                    timestamp: new Date().toISOString(), phase: 'counting'
                }
            }
        });
        assert.ok(h.modal().open);
        assert.match(h.modal().title, /Recover Interrupted Count/);
        h.confirmModal();
        assert.equal(h.hooks.state.phase, 'counting');
        assert.equal(h.hooks.state.counts.blasts, 42);
        assert.equal(h.text('val-grand-total'), '50');
        assert.equal(h.el('morphComments').value, 'partial review');
        assert.equal(h.el('caseNumber').value, 'S25-7777');
        h.close();
    });

    it('TC-B052: Discarding a recovery clears the record', async () => {
        const h = await boot({
            localStorage: {
                wbcds_autosave: {
                    caseNumber: 'X', specimenType: 'bm', counts: { blasts: 1 },
                    timestamp: new Date().toISOString(), phase: 'counting'
                }
            }
        });
        h.cancelModal();
        assert.equal(h.window.localStorage.getItem('wbcds_autosave'), null);
        assert.equal(h.hooks.state.phase, 'case-entry');
        h.close();
    });

    it('TC-B053: Recovery of a specimen type absent from the profile fails safe, not with a crash', async () => {
        const h = await boot({
            localStorage: {
                wbcds_autosave: {
                    caseNumber: 'S25-8', specimenType: 'csf-legacy',
                    counts: { blasts: 5 },
                    timestamp: new Date().toISOString(), phase: 'counting'
                }
            }
        });
        h.confirmModal();   // "Restore Count"
        assert.equal(h.hooks.state.phase, 'case-entry', 'must not enter counting with no config');
        assert.match(h.modal().title, /Cannot Restore Count/);
        assert.equal(h.window.localStorage.getItem('wbcds_autosave'), null);
        h.close();
    });

    it('TC-B054: Finalizing a count clears the autosave record', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 3);
        assert.ok(h.window.localStorage.getItem('wbcds_autosave'));
        h.click('btnCountDone');
        assert.equal(h.window.localStorage.getItem('wbcds_autosave'), null);
        h.close();
    });

    it('TC-B055: A profile with autosave:false writes no record', async () => {
        const cfg = clone(DEFAULT_CONFIG);
        cfg.specimenTypes.forEach(s => { s.autosave = false; });
        const h = await counting({ config: cfg, caseNumber: 'C1' });
        h.press('X', 3);
        assert.equal(h.window.localStorage.getItem('wbcds_autosave'), null);
        h.close();
    });
});

// ================================================================
describe('Behaviour — Configuration Controls (URS-103, HA-060, HA-061)', () => {

    it('TC-B060: Export Config produces a downloadable profile', async () => {
        const h = await boot();
        h.click('btnExportConfig');
        assert.equal(h.downloads.length, 1, 'Export Config must actually produce a file');
        const text = await h.downloadText(0);
        assert.match(text, /"profileId": "consensus-14"/);
        h.close();
    });

    it('TC-B061: Reset to Default confirms, clears the cache and reloads', async () => {
        const h = await boot({ localStorage: { wbcds_config: clone(DEFAULT_CONFIG) } });
        h.click('btnResetConfig');
        assert.ok(h.modal().open, 'Reset to Default must prompt');
        h.confirmModal();
        assert.equal(h.window.localStorage.getItem('wbcds_config'), null);
        h.close();
    });

    it('TC-B062: Import Config applies a valid profile', async () => {
        const h = await boot();
        const custom = clone(DEFAULT_CONFIG);
        custom.profileId = 'my-lab';
        custom.profileName = 'My Lab';
        custom.version = '3.1';
        custom.specimenTypes = [custom.specimenTypes[0]];
        custom.specimenTypes[0].specimenLabel = 'Marrow';

        const file = new h.window.File([JSON.stringify(custom)], 'p.json', { type: 'application/json' });
        h.hooks.importConfig(file);
        await tick(60);

        assert.equal(h.hooks.state.configMeta.profileId, 'my-lab');
        assert.equal(h.hooks.state.configMeta.version, '3.1');
        assert.equal(h.el('specimenType').options.length, 1);
        assert.match(h.modal().title, /Configuration Imported/);
        h.close();
    });

    it('TC-B063: Import rejects a structurally invalid profile without applying it', async () => {
        const h = await boot();
        const bad = clone(DEFAULT_CONFIG);
        // A key mapped to a cell type that is never displayed would be counted
        // into the total but never shown — the silent-miscount case.
        bad.specimenTypes[0].outCodes.J = 'ghost';
        const file = new h.window.File([JSON.stringify(bad)], 'bad.json', { type: 'application/json' });
        h.hooks.importConfig(file);
        await tick(60);

        assert.equal(h.hooks.state.configMeta.profileId, 'consensus-14', 'bad profile must not be applied');
        assert.match(h.modal().title, /Import Error/);
        assert.match(h.modal().message, /ghost/);
        h.close();
    });

    it('TC-B064: Import rejects malformed JSON', async () => {
        const h = await boot();
        const file = new h.window.File(['{not json'], 'bad.json', { type: 'application/json' });
        h.hooks.importConfig(file);
        await tick(60);
        assert.match(h.modal().title, /Import Error/);
        h.close();
    });
});

// ================================================================
describe('Behaviour — Config Resolution and Offline (URS-094, URS-106)', () => {

    it('TC-B070: A newer shipped version of the same profile supersedes the cache', async () => {
        const cached = clone(DEFAULT_CONFIG);
        cached.version = '1.0';
        cached.specimenTypes[0].targetCount = 111;
        const shipped = clone(DEFAULT_CONFIG);
        shipped.version = '2.0';

        const h = await boot({ config: shipped, localStorage: { wbcds_config: cached } });
        assert.equal(h.hooks.state.configMeta.version, '2.0');
        assert.equal(h.hooks.getSpecConfig().targetCount, 500,
            'the corrected shipped profile must reach an installed browser');
        h.close();
    });

    it('TC-B071: A user custom profile is never overwritten by the shipped default', async () => {
        const cached = clone(DEFAULT_CONFIG);
        cached.profileId = 'my-lab';
        cached.version = '1.0';
        cached.specimenTypes[0].targetCount = 300;

        const h = await boot({ config: clone(DEFAULT_CONFIG), localStorage: { wbcds_config: cached } });
        assert.equal(h.hooks.state.configMeta.profileId, 'my-lab');
        assert.equal(h.hooks.getSpecConfig().targetCount, 300);
        h.close();
    });

    it('TC-B072: Counting works offline from the cached profile (URS-094)', async () => {
        const h = await boot({ offline: true, localStorage: { wbcds_config: clone(DEFAULT_CONFIG) } });
        assert.ok(h.hooks.state.config, 'must boot from cache with no network');
        h.el('caseNumber').value = 'C1';
        h.click('btnStartCount');
        h.press('X', 3);
        assert.equal(h.text('val-grand-total'), '3');
        h.close();
    });

    it('TC-B073: An invalid cached profile falls back to the shipped default', async () => {
        const broken = clone(DEFAULT_CONFIG);
        delete broken.specimenTypes[0].outCodes;
        const h = await boot({ config: clone(DEFAULT_CONFIG), localStorage: { wbcds_config: broken } });
        assert.ok(h.hooks.state.config, 'must not be bricked by a bad saved profile');
        assert.equal(h.hooks.state.configMeta.profileId, 'consensus-14');
        h.close();
    });

    it('TC-B075: A config-update notice does not swallow the crash-recovery prompt', async () => {
        // Both raise the same shared modal element. Shown in parallel, the
        // notice would replace the recovery prompt and the operator would
        // silently lose an interrupted count.
        const cached = clone(DEFAULT_CONFIG);
        cached.version = '1.0';
        const h = await boot({
            config: clone(DEFAULT_CONFIG),   // v2.0 supersedes the cached v1.0
            localStorage: {
                wbcds_config: cached,
                wbcds_autosave: {
                    caseNumber: 'S25-BOTH', specimenType: 'bm',
                    counts: { blasts: 33 },
                    timestamp: new Date().toISOString(), phase: 'counting'
                }
            }
        });

        assert.match(h.modal().title, /Configuration Updated/);
        h.confirmModal();

        // The recovery prompt must follow, not be lost.
        assert.ok(h.modal().open, 'recovery prompt must still be offered');
        assert.match(h.modal().title, /Recover Interrupted Count/);
        h.confirmModal();
        assert.equal(h.hooks.state.counts.blasts, 33);
        h.close();
    });

    it('TC-B076: A hand-edited autosave record cannot inject a negative count', async () => {
        const h = await boot({
            localStorage: {
                wbcds_autosave: {
                    caseNumber: 'S25-BAD', specimenType: 'bm',
                    counts: { blasts: -50, poly: 10, ghost: 5 },
                    timestamp: new Date().toISOString(), phase: 'counting'
                }
            }
        });
        h.confirmModal();
        assert.equal(h.hooks.state.counts.blasts, 0, 'negative count must be discarded');
        assert.equal(h.hooks.state.counts.poly, 10);
        assert.equal(h.hooks.state.counts.ghost, undefined, 'unknown cell type must be dropped');
        assert.equal(h.text('val-grand-total'), '10');
        h.close();
    });

    it('TC-B074: Total config failure shows an error screen with a recovery control', async () => {
        const h = await boot({ offline: true, localStorage: { wbcds_config: { garbage: true } } });
        assert.ok(h.el('config-error'), 'error screen rendered');
        assert.ok(h.el('btnFatalReset'), 'a bad cache must always be escapable from the error screen');
        h.click('btnFatalReset');
        assert.equal(h.window.localStorage.getItem('wbcds_config'), null);
        h.close();
    });
});

// ================================================================
describe('Behaviour — Results, Export and Absolute Counts', () => {

    it('TC-B080: Report includes the configuration traceability footer (URS-052)', async () => {
        const h = await counting({ caseNumber: 'S25-1234' });
        h.press('X', 10);
        h.click('btnCountDone');
        const summary = h.el('results-summary').textContent;
        assert.match(summary, /consensus-14/);
        assert.match(summary, /v2\.0/);
        assert.match(summary, /Counted:/);
        h.close();
    });

    it('TC-B081: Low-count advisory appears but never blocks (URS-041)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 216);
        h.click('btnCountDone');
        assert.equal(h.hooks.state.phase, 'results', 'completion must not be blocked');
        assert.ok(h.visible('low-count-note'));
        assert.match(h.text('low-count-note'), /216-cell count/);
        h.close();
    });

    it('TC-B082: Reaching target shows no advisory', async () => {
        const cfg = clone(DEFAULT_CONFIG);
        cfg.specimenTypes[0].targetCount = 10;
        const h = await counting({ config: cfg, caseNumber: 'C1' });
        h.press('X', 10);
        h.click('btnCountDone');
        assert.ok(!h.visible('low-count-note'));
        h.close();
    });

    it('TC-B083: CSV export contains the traceability columns and the counted data', async () => {
        const h = await counting({ caseNumber: 'S25-1234' });
        h.press('X', 10);
        h.click('btnCountDone');
        h.click('btnExportCsv');
        const csv = await h.downloadText(0);
        assert.match(csv.split('\n')[0], /configProfileId/);
        assert.match(csv, /S25-1234/);
        assert.match(csv, /consensus-14/);
        h.close();
    });

    it('TC-B084: JSON export parses and carries the session', async () => {
        const h = await counting({ caseNumber: 'S25-1234' });
        h.press('X', 10);
        h.click('btnCountDone');
        h.click('btnExportJson');
        const parsed = JSON.parse(await h.downloadText(0));
        assert.equal(parsed.length, 1);
        assert.equal(parsed[0].counts.blasts, 10);
        assert.equal(parsed[0].configProfileId, 'consensus-14');
        h.close();
    });

    it('TC-B085: Absolute counts derive from the displayed percentages (URS-036, HA-024)', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 50);
        h.press('F', 50);
        h.click('btnCountDone');
        assert.ok(h.visible('absolute-count-section'));
        h.setInput('wbcTotal', '10');
        const text = h.el('abs-results').textContent;
        // 50% of a WBC of 10 is 5.00 for each of the two counted categories
        assert.match(text, /5\.00/);
        h.close();
    });

    it('TC-B086: A non-numeric WBC clears the absolute counts rather than showing NaN', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 10);
        h.click('btnCountDone');
        h.setInput('wbcTotal', '10');
        assert.ok(h.el('abs-results').textContent.length > 0);
        h.setInput('wbcTotal', 'abc');
        assert.equal(h.el('abs-results').textContent, '');
        h.close();
    });

    it('TC-B087: A case number containing markup is rendered inert (SYS-S04)', async () => {
        const h = await counting({ caseNumber: '<img src=x onerror=alert(1)>' });
        h.press('X', 5);
        h.click('btnCountDone');
        assert.equal(h.document.querySelectorAll('#results-summary img').length, 0);
        assert.equal(h.document.querySelectorAll('#tab-panels img').length, 0);
        assert.match(h.el('results-summary').textContent, /<img/);   // shown as text
        h.close();
    });

    it('TC-B088: Session history lists completed counts and opens read-only detail', async () => {
        const h = await counting({ caseNumber: 'S25-1' });
        h.press('X', 10);
        h.click('btnCountDone');
        assert.ok(h.visible('session-history-section'));
        assert.equal(h.text('history-count'), '(1)');
        h.document.querySelector('.history-entry').dispatchEvent(
            new h.window.MouseEvent('click', { bubbles: true }));
        assert.ok(!h.el('history-modal').classList.contains('hidden'));
        assert.match(h.el('history-modal-content').textContent, /consensus-14/);
        h.close();
    });
});

// ================================================================
describe('Behaviour — Theme and Audio (URS-095, URS-097)', () => {

    it('TC-B090: Theme toggles and persists to sessionStorage', async () => {
        const h = await boot();
        const before = h.document.body.getAttribute('data-theme');
        h.click('btnToggleTheme');
        const after = h.document.body.getAttribute('data-theme');
        assert.notEqual(before, after);
        assert.equal(h.window.sessionStorage.getItem('wbcds_theme'), after);
        h.close();
    });

    it('TC-B091: Ctrl+Shift+L toggles the theme without disturbing counting', async () => {
        const h = await counting({ caseNumber: 'C1' });
        h.press('X', 3);
        const before = h.document.body.getAttribute('data-theme');
        h.key('L', { ctrl: true, shift: true });
        assert.notEqual(h.document.body.getAttribute('data-theme'), before);
        assert.equal(h.hooks.state.counts.blasts, 3, 'the shortcut must not alter the count');
        h.close();
    });

    it('TC-B092: Audio toggle flips state and persists', async () => {
        const h = await boot();
        assert.equal(h.text('audioLabel'), 'Sound On');
        h.click('btnToggleAudio');
        assert.equal(h.text('audioLabel'), 'Sound Off');
        assert.equal(h.window.sessionStorage.getItem('wbcds_audio'), 'off');
        h.close();
    });

    it('TC-B093: Counting emits audio feedback when enabled', async () => {
        const h = await counting({ caseNumber: 'C1' });
        const before = h.audioEvents.length;
        h.press('X', 3);
        assert.ok(h.audioEvents.length > before, 'each counted keystroke should produce a tone');
        h.close();
    });
});
