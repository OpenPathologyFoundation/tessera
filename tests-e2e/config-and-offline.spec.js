/**
 * E2E SUITE: Configuration, Export and Offline Operation
 * =======================================================
 * Traces to: URS-051, URS-053, URS-054, URS-080..URS-085, URS-094,
 *            URS-100..URS-107
 * VV Protocol: VV-SYS-050 onward
 *
 * Covers the areas that only a real browser can verify: file downloads, the
 * system clipboard, the service worker, and the configuration editor
 * round-trip into the counter.
 *
 * The three configuration controls exercised here (Export / Import / Reset)
 * were entirely inert before DCR-004 — they were bound by an inline script to
 * functions private to the application IIFE, so every handler silently did
 * nothing. No test in the project executed them.
 */
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

// Read from the shipped profile rather than pinning a literal (see above).
const SHIPPED = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'web', 'settings', 'templates.json'), 'utf-8'));

async function startAndCount(page, caseNumber, key, n) {
    await page.goto('/counter.html');
    await expect(page.locator('#phase-case-entry')).toBeVisible();
    if (caseNumber) await page.fill('#caseNumber', caseNumber);
    await page.click('#btnStartCount');
    for (let i = 0; i < n; i++) await page.keyboard.press(key);
}

async function readDownload(download) {
    const p = await download.path();
    return fs.readFileSync(p, 'utf-8');
}

/**
 * Wait until the application has finished resolving its configuration.
 * Reading localStorage straight after a reload can otherwise race the async
 * config load and observe the cache mid-rewrite.
 */
async function waitForAppReady(page) {
    await page.waitForFunction(
        () => !!(window.__wbcTestHooks && window.__wbcTestHooks.state.configMeta));
}

// ================================================================
test.describe('Configuration controls (URS-103)', () => {

    test('VV-SYS-050: Export Config downloads the active profile', async ({ page }) => {
        await page.goto('/counter.html');
        await expect(page.locator('#btnExportConfig')).toBeVisible();

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#btnExportConfig')
        ]);
        expect(download.suggestedFilename()).toMatch(/^wbcds-config-ndc-14-.*\.json$/);

        const profile = JSON.parse(await readDownload(download));
        expect(profile.profileId).toBe('ndc-14');
        expect(profile.version).toBe(SHIPPED.version);
        expect(Array.isArray(profile.specimenTypes)).toBe(true);
    });

    test('VV-SYS-051: Import Config applies a profile and re-renders the counter', async ({ page }) => {
        await page.goto('/counter.html');

        const custom = {
            version: '3.0',
            profileId: 'e2e-lab',
            profileName: 'E2E Lab Profile',
            specimenTypes: [{
                specimenType: 'bm',
                specimenLabel: 'E2E Marrow',
                targetCount: 25,
                categories: { upper: ['blasts'], lower: ['poly'] },
                outCodes: { X: 'blasts', F: 'poly' },
                templates: [{ tplCode: 'e2e', tplName: 'E2E', outSentence: '{{total}} cells: {{blasts}}% blasts' }]
            }]
        };

        await page.setInputFiles('#configFileInput', {
            name: 'e2e-profile.json',
            mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(custom))
        });

        await expect(page.locator('#modal-title')).toHaveText('Configuration Imported');
        await page.click('#modal-confirm');

        // The counter must now be driven by the imported profile.
        const options = await page.locator('#specimenType option').allTextContents();
        expect(options).toEqual(['E2E Marrow']);

        await page.click('#btnStartCount');
        await expect(page.locator('#progress-label')).toHaveText('0 / 25 (target)');
        await page.keyboard.press('x');
        await expect(page.locator('#val-blasts')).toHaveText('1');
    });

    test('VV-SYS-052: Import rejects an invalid profile and keeps the current one', async ({ page }) => {
        await page.goto('/counter.html');
        const bad = {
            version: '1.0', profileId: 'broken',
            specimenTypes: [{
                specimenType: 'bm',
                categories: { upper: ['blasts'], lower: [] },
                // 'ghost' is key-mapped but never displayed: it would be counted
                // into the total and every denominator while remaining invisible.
                outCodes: { X: 'blasts', J: 'ghost' },
                templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }]
            }]
        };
        await page.setInputFiles('#configFileInput', {
            name: 'bad.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(bad))
        });

        await expect(page.locator('#modal-title')).toHaveText('Import Error');
        await expect(page.locator('#modal-message')).toContainText('ghost');
        await page.click('#modal-confirm');

        const options = await page.locator('#specimenType option').allTextContents();
        expect(options).toContain('Bone Marrow');
    });

    test('VV-SYS-053: Reset to Default confirms, clears the cache and restores the built-in profile', async ({ page }) => {
        await page.goto('/counter.html');
        // Seed a custom cached profile, then reset.
        await page.evaluate(() => {
            localStorage.setItem('wbcds_config', JSON.stringify({
                version: '1.0', profileId: 'stale-lab', profileName: 'Stale',
                specimenTypes: [{
                    specimenType: 'bm', specimenLabel: 'Stale Marrow', targetCount: 7,
                    categories: { upper: ['blasts'], lower: ['poly'] },
                    outCodes: { X: 'blasts', F: 'poly' },
                    templates: [{ tplCode: 't', tplName: 'T', outSentence: '{{total}}' }]
                }]
            }));
        });
        await page.reload();
        // The app boots asynchronously — it fetches templates.json before
        // resolving which profile wins. Asserting on the selector before that
        // resolves reads the previous render, which is why this failed only
        // under full-suite load.
        await waitForAppReady(page);
        await expect(page.locator('#specimenType option')).toHaveText(['Stale Marrow']);

        await page.click('#btnResetConfig');
        await expect(page.locator('#modal-title')).toHaveText('Reset Configuration');
        await page.click('#modal-confirm');

        await waitForAppReady(page);
        await expect(page.locator('#specimenType option')).toHaveText(['Bone Marrow', 'Peripheral Blood']);
        expect(await page.evaluate(() => window.__wbcTestHooks.state.configMeta.profileId))
            .toBe('ndc-14');
        expect(await page.evaluate(() => localStorage.getItem('wbcds_config'))).not.toContain('stale-lab');
    });

    test('VV-SYS-054: A newer built-in profile supersedes a cached copy of the same profile', async ({ page }) => {
        await page.goto('/counter.html');
        await page.evaluate(() => {
            const stale = JSON.parse(localStorage.getItem('wbcds_config'));
            stale.version = '1.0';
            stale.specimenTypes[0].targetCount = 42;
            localStorage.setItem('wbcds_config', JSON.stringify(stale));
        });
        await page.reload();

        await expect(page.locator('#modal-title')).toHaveText('Configuration Updated');
        await page.click('#modal-confirm');
        await page.click('#btnStartCount');
        await expect(page.locator('#progress-label')).toHaveText('0 / 500 (target)');
    });
});

// ================================================================
test.describe('Preset profile catalogue (URS-101)', () => {

    test('VV-SYS-055: The catalogue lists the built-in profiles', async ({ page }) => {
        await page.goto('/counter.html');
        await page.click('#btnPresetCatalog');
        await expect(page.locator('#preset-modal')).toBeVisible();

        const names = await page.locator('#preset-list .text-sm').allTextContents();
        expect(names.join('|')).toContain('14-Type Nucleated Differential');
        expect(names.join('|')).toContain('5-Type — Analyzer Categories');
        expect(names.join('|')).toContain('Body Fluid');

        // The blank editor template is not a countable profile and must not be
        // offered here.
        expect(names.join('|')).not.toContain('Blank Template');

        // The profile currently in use is marked.
        await expect(page.locator('#preset-list')).toContainText('active');
    });

    test('VV-SYS-056: Loading a preset applies it and it is usable for counting', async ({ page }) => {
        await page.goto('/counter.html');
        await page.click('#btnPresetCatalog');
        await page.locator('#preset-list button[data-preset-name="5-Type — Analyzer Categories"]').click();

        await expect(page.locator('#modal-title')).toHaveText('Preset Loaded');
        await page.click('#modal-confirm');

        await waitForAppReady(page);
        expect(await page.evaluate(() => window.__wbcTestHooks.state.configMeta.profileId))
            .toBe('analyzer-5');

        await page.click('#btnStartCount');
        await expect(page.locator('#progress-label')).toHaveText('0 / 100 (target)');
        // Five categories in this profile, so exactly five key legends.
        expect(await page.locator('#counter-table-area kbd').count()).toBe(5);
    });

    test('VV-SYS-057: The body fluid preset provides a non-blood specimen panel (URS-011)', async ({ page }) => {
        await page.goto('/counter.html');
        await page.click('#btnPresetCatalog');
        await page.locator('#preset-list button[data-preset-name="Body Fluid — 7 Types"]').click();
        await expect(page.locator('#modal-title')).toHaveText('Preset Loaded');
        await page.click('#modal-confirm');

        await waitForAppReady(page);
        const options = await page.locator('#specimenType option').allTextContents();
        expect(options.join('|')).toMatch(/Body Fluid/i);

        await page.click('#btnStartCount');
        await expect(page.locator('#phase-counting')).toBeVisible();
    });
});

// ================================================================
test.describe('Subset percentage formulas (URS-039)', () => {

    test('VV-SYS-125: The bands-and-segs preset reports blasts against both denominators', async ({ page }) => {
        await page.goto('/counter.html');
        await page.click('#btnPresetCatalog');
        await page.locator('#preset-list button[data-preset-name="10-Type — Bands & Segs Separate"]').click();
        await expect(page.locator('#modal-title')).toHaveText('Preset Loaded');
        await page.click('#modal-confirm');
        await waitForAppReady(page);

        await page.fill('#caseNumber', 'S25-ERY');
        await page.click('#btnStartCount');

        // Erythroid-rich marrow: the two conventions disagree across the
        // 20% line, which is what the pre-2022 WHO rule existed to catch.
        const keys = await page.evaluate(() => {
            const oc = window.__wbcTestHooks.getSpecConfig().outCodes;
            const inv = {};
            Object.keys(oc).forEach(k => { inv[oc[k]] = k; });
            return inv;
        });
        for (let i = 0; i < 45; i++) await page.keyboard.press(keys.blasts.toLowerCase());
        for (let i = 0; i < 300; i++) await page.keyboard.press(keys.nrbc.toLowerCase());
        for (let i = 0; i < 155; i++) await page.keyboard.press(keys.segs.toLowerCase());

        // 45 of 500 all-nucleated = 9%; 45 of 200 non-erythroid = 22.5%.
        await expect(page.locator('#val-formula-blasts_non_erythroid')).toHaveText('22.5%');
        await expect(page.locator('#pct-blasts')).toHaveText('9.00%');

        await page.click('#btnCountDone');
        // innerText returns CSS-transformed text and the label carries
        // `uppercase`, so match case-insensitively.
        const summary = await page.locator('#results-summary').innerText();
        expect(summary).toMatch(/blasts \(% non-erythroid\)/i);
        expect(summary).toContain('22.5%');

        // Only the legacy rule straddles its threshold.
        const body = await page.locator('#threshold-note-body').innerText();
        expect(body).toMatch(/non-erythroid/i);
    });
});

// ================================================================
test.describe('Configuration editor round-trip (URS-102)', () => {

    test('VV-SYS-060: The editor is reachable from the counter', async ({ page }) => {
        await page.goto('/counter.html');
        const link = page.locator('a[href="editor.html"]');
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(/editor\.html$/);
        await expect(page.locator('#cell-reference')).toBeVisible();
    });

    test('VV-SYS-061: An unusable draft is downloaded but never made active', async ({ page }) => {
        // The editor opens with an empty layout. Saving that would previously
        // cache a profile with no cells and report success, while the counter
        // silently fell back to the built-in profile.
        await page.goto('/editor.html');
        await expect(page.locator('#cell-reference')).toBeVisible();
        await page.fill('#profileId', 'empty-draft');

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#btnSaveProfile')
        ]);
        expect(download.suggestedFilename()).toContain('empty-draft');

        await expect(page.locator('#save-status')).toHaveAttribute('data-status', 'error');
        await expect(page.locator('#save-status')).toContainText('NOT made active');
        expect(await page.evaluate(() => localStorage.getItem('wbcds_config'))).toBeNull();
    });

    test('VV-SYS-062: A complete profile saved in the editor is picked up by the counter', async ({ page }) => {
        // Seed the editor from a valid profile, rename it, and save.
        await page.goto('/counter.html');
        await page.evaluate(() => {
            const cfg = JSON.parse(localStorage.getItem('wbcds_config'));
            cfg.profileId = 'editor-e2e';
            cfg.profileName = 'Editor E2E Profile';
            localStorage.setItem('wbcds_config', JSON.stringify(cfg));
        });

        await page.goto('/editor.html');
        await expect(page.locator('#cell-reference')).toBeVisible();
        await expect(page.locator('#profileId')).toHaveValue('editor-e2e');

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#btnSaveProfile')
        ]);
        expect(download.suggestedFilename()).toContain('editor-e2e');
        await expect(page.locator('#save-status')).toHaveAttribute('data-status', 'ok');

        await page.goto('/counter.html');
        await waitForAppReady(page);
        const meta = await page.evaluate(() => window.__wbcTestHooks.state.configMeta);
        expect(meta.profileId).toBe('editor-e2e');

        // And it must actually be usable for counting.
        await page.click('#btnStartCount');
        await page.keyboard.press('x');
        await expect(page.locator('#val-blasts')).toHaveText('1');
    });

    test('VV-SYS-063: The editor preserves every field it does not itself edit', async ({ page }) => {
        // The editor rebuilt the profile from its own form fields, so anything
        // it does not model was destroyed on save: denominatorExcludes,
        // per100Reporting, thresholds, confidenceIntervals, rounding,
        // precision, categoryNotes, targetCountBasis, provenance — and
        // `formulas` was overwritten with {}, deleting the M:E ratio.
        //
        // Saving a profile untouched must return it unchanged. VV-SYS-062 did
        // not catch this because it asserts only on profileId.
        await page.goto('/counter.html');
        await page.evaluate(cfg => localStorage.setItem('wbcds_config', JSON.stringify(cfg)), SHIPPED);

        await page.goto('/editor.html');
        await expect(page.locator('#cell-reference')).toBeVisible();
        await Promise.all([page.waitForEvent('download'), page.click('#btnSaveProfile')]);
        await expect(page.locator('#save-status')).toHaveAttribute('data-status', 'ok');

        const after = await page.evaluate(() => JSON.parse(localStorage.getItem('wbcds_config')));

        for (const key of Object.keys(SHIPPED)) {
            if (key === 'version') continue;   // deliberately advanced, see VV-SYS-064
            expect(after, `top-level "${key}" was lost`).toHaveProperty(key);
        }
        for (const shipped of SHIPPED.specimenTypes) {
            const saved = after.specimenTypes.find(s => s.specimenType === shipped.specimenType);
            expect(saved, `the ${shipped.specimenType} specimen was lost`).toBeTruthy();
            for (const [key, value] of Object.entries(shipped)) {
                expect(saved[key], `${shipped.specimenType}.${key} did not survive the round trip`)
                    .toEqual(value);
            }
        }
    });

    test('VV-SYS-064: An edit saved in the editor is honoured by the counter', async ({ page }) => {
        // The editor wrote a hard-coded version of '2.0'. Because the built-in
        // profile shares the profileId at a higher version, isCacheSuperseded
        // discarded the edit on the next load — while the editor reported
        // "Profile saved and made active" and the counter announced a routine
        // profile update. Every customisation of a built-in profile was lost.
        //
        // VV-SYS-062 renames the profile, which sidesteps the supersede path
        // entirely; this test deliberately keeps the built-in profileId.
        await page.goto('/counter.html');
        await waitForAppReady(page);
        const before = await page.evaluate(() => window.__wbcTestHooks.state.config
            .find(s => s.specimenType === 'bm').targetCount);
        expect(before).not.toBe(400);

        await page.goto('/editor.html');
        await expect(page.locator('#cell-reference')).toBeVisible();
        await expect(page.locator('#profileId')).toHaveValue(SHIPPED.profileId);
        await page.fill('#targetBm', '400');
        await page.dispatchEvent('#targetBm', 'change');
        await Promise.all([page.waitForEvent('download'), page.click('#btnSaveProfile')]);
        await expect(page.locator('#save-status')).toHaveAttribute('data-status', 'ok');

        await page.goto('/counter.html');
        await waitForAppReady(page);
        const after = await page.evaluate(() => window.__wbcTestHooks.state.config
            .find(s => s.specimenType === 'bm').targetCount);
        expect(after, 'the counter discarded the saved edit').toBe(400);

        // And the operator is not told the profile was "updated" when nothing
        // of the sort happened.
        const modal = page.locator('#modal-overlay');
        if (await modal.isVisible())
            await expect(page.locator('#modal-message')).not.toContainText('newer built-in profile');
    });

// ================================================================
// Counting policy controls (DCR-013)
//
// Until DCR-013 the fields that decide what the reported numbers ARE — the
// denominator, the rounding, the precision, the thresholds and the derived
// ratio — could only be set by hand-editing the exported JSON. These tests
// drive the new controls and then verify the COUNTER, not the saved file:
// a control that writes the right JSON but does not change the count would
// pass a round-trip test and still be useless.

    /** Save the open editor and return to a counter that has picked it up. */
    async function saveAndReturn(page) {
        await Promise.all([page.waitForEvent('download'), page.click('#btnSaveProfile')]);
        await expect(page.locator('#save-status')).toHaveAttribute('data-status', 'ok');
        await page.goto('/counter.html');
        await waitForAppReady(page);
    }

    async function openEditorOn(page, specimenLabel) {
        await page.goto('/editor.html');
        await expect(page.locator('#policy-editor')).toBeVisible();
        if (specimenLabel) {
            await page.locator('#specimen-tabs button', { hasText: specimenLabel }).click();
        }
    }

    test('VV-SYS-065: The denominator policy can be set in the editor and changes the count', async ({ page }) => {
        // The question that started DCR-012: where is denominatorExcludes set?
        // Seed a profile that does NOT exclude NRBC, then exclude them here.
        await page.goto('/counter.html');
        await page.evaluate(cfg => {
            const c = JSON.parse(JSON.stringify(cfg));
            const pb = c.specimenTypes.find(s => s.specimenType === 'pb');
            delete pb.denominatorExcludes;
            delete pb.per100Reporting;
            localStorage.setItem('wbcds_config', JSON.stringify(c));
        }, SHIPPED);

        await openEditorOn(page, 'Peripheral');
        await page.check('.pol-excl[data-cell="nrbc"]');
        // Excluding a category must also give it a per-100 line, or the count
        // is simply lost. The control does both.
        await expect(page.locator('.pol-per100-label[data-cell="nrbc"]')).toBeVisible();
        await saveAndReturn(page);

        await page.selectOption('#specimenType', 'pb');
        await page.click('#btnStartCount');
        for (let i = 0; i < 180; i++) await page.keyboard.press('f');   // segmented
        for (let i = 0; i < 20; i++) await page.keyboard.press('b');    // NRBC
        await page.click('#btnCountDone');

        const summary = page.locator('#results-summary');
        await expect(summary).toContainText('180 cells');          // not 200
        await expect(summary).toContainText('/100');               // NRBC per 100 WBC
        await expect(summary).toContainText('100.00%');            // segmented, undiluted
    });

    test('VV-SYS-066: Rounding and precision can be set in the editor and change the figures', async ({ page }) => {
        // Three equal categories at whole-number precision: largest remainder
        // gives 33/33/34 to reach 100%, independent gives 33/33/33 and a total
        // of 99%. DCR-010 made this a policy; this makes it reachable.
        await page.goto('/counter.html');
        await page.evaluate(cfg => localStorage.setItem('wbcds_config', JSON.stringify(cfg)), SHIPPED);

        await openEditorOn(page, 'Bone Marrow');
        await page.selectOption('#pol-rounding', 'independent');
        await page.fill('#pol-prec-display', '0');
        await page.dispatchEvent('#pol-prec-display', 'change');
        await saveAndReturn(page);

        await page.click('#btnStartCount');
        await page.keyboard.press('x');   // blasts
        await page.keyboard.press('e');   // plasma
        await page.keyboard.press('f');   // segmented
        await page.click('#btnCountDone');

        const text = await page.locator('#results-summary').innerText();
        expect(text).toContain('33%');
        expect(text, 'independent rounding must not top a category up to reach 100%')
            .not.toContain('34%');
    });

    test('VV-SYS-067: A threshold added in the editor raises the advisory', async ({ page }) => {
        await page.goto('/counter.html');
        await page.evaluate(cfg => localStorage.setItem('wbcds_config', JSON.stringify(cfg)), SHIPPED);

        await openEditorOn(page, 'Bone Marrow');
        await page.click('#pol-thr-add');
        const added = page.locator('[data-thr-idx]').last();
        await page.locator('.pol-thr-target').last().selectOption('poly');
        await page.locator('.pol-thr-value').last().fill('50');
        await page.locator('.pol-thr-value').last().dispatchEvent('change');
        await page.locator('.pol-thr-label').last().fill('editor poly threshold');
        await saveAndReturn(page);

        await page.click('#btnStartCount');
        await page.keyboard.press('f');   // 1 segmented
        await page.keyboard.press('x');   // 1 blast -> poly 50%, interval spans 50
        await page.click('#btnCountDone');

        await expect(page.locator('#threshold-note')).toBeVisible();
        await expect(page.locator('#threshold-note')).toContainText('editor poly threshold');
    });

    test('VV-SYS-068: The M:E composition can be changed in the editor', async ({ page }) => {
        // ICSH 2008 includes monocytes in the myeloid numerator; a widely
        // taught alternative excludes them, and the two disagree. 150
        // segmented + 60 monocytes over 90 erythroid: 2.3 with monocytes,
        // 1.7 without. DCR-010 shipped both as presets; this makes the
        // composition itself editable.
        await page.goto('/counter.html');
        await page.evaluate(cfg => localStorage.setItem('wbcds_config', JSON.stringify(cfg)), SHIPPED);

        await openEditorOn(page, 'Bone Marrow');
        await page.uncheck('.pol-f-member[data-formula="ME_ratio"][data-side="numerator"][data-cell="mono"]');
        await saveAndReturn(page);

        await page.click('#btnStartCount');
        for (let i = 0; i < 150; i++) await page.keyboard.press('f');   // segmented
        for (let i = 0; i < 60; i++) await page.keyboard.press('a');    // monocytes
        for (let i = 0; i < 90; i++) await page.keyboard.press('b');    // erythroid
        await page.click('#btnCountDone');

        // Asserted on the M:E element, not the whole panel. A panel-wide
        // `not.toContainText('2.3')` collided with the application version
        // string the method statement gained in DCR-037 — "WBC ΔΣ v2.22.3"
        // contains "2.3", so a correct 1.7:1 failed on an unrelated number.
        const me = page.locator('[id^="val-formula-"]').first();
        await expect(me).toContainText('1.7');
        await expect(me).not.toContainText('2.3');
    });

    test('VV-SYS-069: The policy controls cannot produce a profile the counter rejects', async ({ page }) => {
        // The schema refuses a threshold on a category that has no percentage
        // left to test, and refuses per-100 reporting for a category still
        // inside the denominator. Rather than let the operator build that and
        // fail on save, excluding a category clears any threshold on it.
        await page.goto('/counter.html');
        await page.evaluate(cfg => localStorage.setItem('wbcds_config', JSON.stringify(cfg)), SHIPPED);

        await openEditorOn(page, 'Bone Marrow');
        await expect(page.locator('.pol-thr-target').first()).toHaveValue('blasts');
        await page.check('.pol-excl[data-cell="blasts"]');

        // Both blast thresholds are gone, and blasts is no longer offered as a target.
        const targets = await page.locator('.pol-thr-target').evaluateAll(
            els => els.flatMap(e => [...e.options].map(o => o.value)));
        expect(targets).not.toContain('blasts');

        await Promise.all([page.waitForEvent('download'), page.click('#btnSaveProfile')]);
        await expect(page.locator('#save-status')).toHaveAttribute('data-status', 'ok');

        // And the counter accepts it.
        await page.goto('/counter.html');
        await waitForAppReady(page);
        expect(await page.evaluate(() => window.__wbcTestHooks.state.configMeta.profileId))
            .toBe(SHIPPED.profileId);
    });
});

// ================================================================
test.describe('Output, export and printing', () => {

    test('VV-SYS-070: Copy to Clipboard places the report on the system clipboard (URS-053)', async ({ page, browserName }) => {
        await startAndCount(page, 'S25-CLIP', 'x', 10);
        await page.click('#btnCountDone');
        await page.click('#btnCopyOutput');

        // The control confirms on every engine.
        await expect(page.locator('#copyBtnText')).toHaveText('Copied!');

        // Reading the clipboard back requires the clipboard-read permission,
        // which Playwright grants on Chromium only. On Firefox and WebKit the
        // copy path is still exercised above; only the read-back is skipped.
        test.skip(browserName !== 'chromium',
            'clipboard-read permission is Chromium-only in Playwright');

        const clip = await page.evaluate(() => navigator.clipboard.readText());
        expect(clip).toContain('S25-CLIP');
        expect(clip).toContain('10-cell count');
        expect(clip).not.toContain('{{');
    });

    test('VV-SYS-071: Session CSV export downloads with traceability columns (URS-084)', async ({ page }) => {
        await startAndCount(page, 'S25-CSV', 'x', 12);
        await page.click('#btnCountDone');
        await page.locator('#session-history-section summary').click();

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#btnExportCsv')
        ]);
        expect(download.suggestedFilename()).toMatch(/^wbcds-session-.*\.csv$/);

        const csv = await readDownload(download);
        const header = csv.split('\n')[0];
        for (const col of ['caseNumber', 'configProfileId', 'configVersion', 'targetCount', 'timestamp']) {
            expect(header).toContain(col);
        }
        expect(csv).toContain('S25-CSV');
        expect(csv).toContain('ndc-14');
    });

    test('VV-SYS-072: Session JSON export downloads and parses (URS-084)', async ({ page }) => {
        await startAndCount(page, 'S25-JSON', 'x', 5);
        await page.click('#btnCountDone');
        await page.locator('#session-history-section summary').click();

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#btnExportJson')
        ]);
        const sessions = JSON.parse(await readDownload(download));
        expect(sessions).toHaveLength(1);
        expect(sessions[0].caseNumber).toBe('S25-JSON');
        expect(sessions[0].counts.blasts).toBe(5);
        expect(sessions[0].configProfileId).toBe('ndc-14');
        expect(sessions[0].totalCount).toBe(5);
    });

    test('VV-SYS-073: A case number containing markup is rendered as inert text (SYS-S04)', async ({ page }) => {
        await startAndCount(page, '<img src=x onerror=window.__pwned=1>', 'x', 3);
        await page.click('#btnCountDone');

        expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
        expect(await page.locator('#results-summary img').count()).toBe(0);
        expect(await page.locator('#tab-panels img').count()).toBe(0);
        await expect(page.locator('#results-summary')).toContainText('<img');
    });

    test('VV-SYS-074: The print control is available on the results screen (URS-054)', async ({ page }) => {
        await startAndCount(page, 'S25-PRINT', 'x', 5);
        await page.click('#btnCountDone');
        await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
        await page.click('#btnPrintResults');
        expect(await page.evaluate(() => window.__printed)).toBe(1);
    });

    test('VV-SYS-075: Session history opens a read-only record (URS-082)', async ({ page }) => {
        await startAndCount(page, 'S25-HIST', 'x', 8);
        await page.click('#btnCountDone');
        await page.locator('#session-history-section summary').click();
        await expect(page.locator('#history-count')).toHaveText('(1)');
        await page.locator('.history-entry').first().click();
        await expect(page.locator('#history-modal')).toBeVisible();
        await expect(page.locator('#history-modal-content')).toContainText('ndc-14');
        await page.click('#history-modal-close');
        await expect(page.locator('#history-modal')).toBeHidden();
    });
});

// ================================================================
test.describe('Autosave and crash recovery (URS-085)', () => {

    test('VV-SYS-080: An interrupted count is recovered after a browser restart', async ({ page }) => {
        await startAndCount(page, 'S25-CRASH', 'x', 37);
        await page.keyboard.press('f');
        await expect(page.locator('#val-grand-total')).toHaveText('38');

        // Simulate the tab being closed and reopened: the count is never
        // finalized, so only the autosave record survives.
        await page.reload();

        await expect(page.locator('#modal-title')).toHaveText('Recover Interrupted Count');
        await expect(page.locator('#modal-message')).toContainText('38 cells counted');
        await page.click('#modal-confirm');

        await expect(page.locator('#phase-counting')).toBeVisible();
        await expect(page.locator('#val-blasts')).toHaveText('37');
        await expect(page.locator('#val-grand-total')).toHaveText('38');
        await expect(page.locator('#caseNumber')).toHaveValue('S25-CRASH');

        // Counting must continue to work after recovery.
        await page.keyboard.press('x');
        await expect(page.locator('#val-blasts')).toHaveText('38');
    });

    test('VV-SYS-081: Discarding the recovery starts clean', async ({ page }) => {
        await startAndCount(page, 'S25-DISCARD', 'x', 5);
        await page.reload();
        await expect(page.locator('#modal-title')).toHaveText('Recover Interrupted Count');
        await page.click('#modal-cancel');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem('wbcds_autosave'))).toBeNull();
    });

    test('VV-SYS-082: A finalized count leaves no recovery prompt behind', async ({ page }) => {
        await startAndCount(page, 'S25-DONE', 'x', 5);
        await page.click('#btnCountDone');
        await page.reload();
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await expect(page.locator('#modal-overlay')).toBeHidden();
    });
});

// ================================================================
test.describe('Offline operation (URS-094)', () => {

    test('VV-SYS-090: The application loads and counts with the network disconnected', async ({ page, context, browserName }) => {
        // Playwright's WebKit build crashes its driver on a navigation made
        // while offline ("WebKit encountered an internal error"), so the
        // scenario cannot be driven there. This is a harness limitation, not an
        // application finding. URS-093 names Chrome, Firefox and Edge as the
        // target browsers, all of which are covered by the chromium and firefox
        // projects; Safari is not a stated target.
        test.skip(browserName === 'webkit',
            'Playwright WebKit cannot navigate while offline');

        // Prime the service worker and the config cache.
        await page.goto('/counter.html');
        await page.evaluate(async () => {
            if (navigator.serviceWorker) await navigator.serviceWorker.ready;
        });
        await expect(page.locator('#phase-case-entry')).toBeVisible();

        await context.setOffline(true);
        await page.reload();

        // Styling and behaviour must both survive the loss of the network.
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await expect(page.locator('#btnStartCount')).toBeVisible();

        await page.fill('#caseNumber', 'S25-OFFLINE');
        await page.click('#btnStartCount');
        await expect(page.locator('#phase-counting')).toBeVisible();
        for (let i = 0; i < 6; i++) await page.keyboard.press('x');
        await expect(page.locator('#val-grand-total')).toHaveText('6');

        await page.click('#btnCountDone');
        await expect(page.locator('#phase-results')).toBeVisible();
        await expect(page.locator('#results-summary')).toContainText('ndc-14');

        await context.setOffline(false);
    });

    test('VV-SYS-091: Tailwind is served from the local origin, not a CDN', async ({ page }) => {
        const remote = [];
        page.on('request', (req) => {
            const u = new URL(req.url());
            if (u.hostname.includes('tailwindcss.com')) remote.push(req.url());
        });
        await page.goto('/counter.html');
        await expect(page.locator('#btnStartCount')).toBeVisible();
        expect(remote).toHaveLength(0);
    });
});

// ================================================================
test.describe('Methods and limitations documentation (URS-092, URS-055)', () => {

    test('VV-SYS-140: The methods page is reachable and renders', async ({ page }) => {
        await page.goto('/counter.html');
        await page.locator('a[href="methods.html"]').first().click();
        await expect(page).toHaveURL(/methods\.html$/);
        await expect(page.locator('h1')).toContainText('calculates');

        // The sections a user needs in order to interpret a report.
        const body = await page.locator('main').innerText();
        for (const heading of ['How percentages are calculated', 'The M:E ratio',
            'What the confidence interval means', 'Limitations of manual differential counting',
            'Which cells belong in the count', 'How many cells to count']) {
            expect(body).toContain(heading);
        }
    });

    test('VV-SYS-141: The worked figures on the page match what the counter produces', async ({ page }) => {
        // Count the page's own peripheral blood example and confirm the
        // application reproduces the numbers the documentation claims.
        await page.goto('/counter.html');
        await page.fill('#caseNumber', 'S25-DOC');
        await page.selectOption('#specimenType', 'pb');
        await page.click('#btnStartCount');
        for (let i = 0; i < 120; i++) await page.keyboard.press('f');
        for (let i = 0; i < 40; i++) await page.keyboard.press('s');
        for (let i = 0; i < 15; i++) await page.keyboard.press('a');
        for (let i = 0; i < 5; i++) await page.keyboard.press('g');
        for (let i = 0; i < 20; i++) await page.keyboard.press('b');

        await expect(page.locator('#val-grand-total')).toHaveText('180 + 20');
        await expect(page.locator('#pct-nrbc')).toHaveText('11.1/100');
        await page.click('#btnCountDone');
        const panel = await page.locator('.tab-panel:not(.hidden)').innerText();
        expect(panel).toContain('180-cell differential');
        expect(panel).toContain('11.1 per 100 WBC');
    });

    test('VV-SYS-142: The results screen links to the methods page', async ({ page }) => {
        await page.goto('/counter.html');
        await page.fill('#caseNumber', 'S25-LINK');
        await page.click('#btnStartCount');
        for (let i = 0; i < 20; i++) await page.keyboard.press('x');
        await page.click('#btnCountDone');

        await page.locator('#results-summary summary').click();
        const link = page.locator('#results-summary a[href="methods.html"]');
        await expect(link).toBeVisible();
        await expect(link).toContainText('limitations');
    });

    test('VV-SYS-143: The methods page works offline', async ({ page, context, browserName }) => {
        test.skip(browserName === 'webkit',
            'Playwright WebKit cannot navigate while offline');
        await page.goto('/counter.html');
        await page.evaluate(async () => {
            if (navigator.serviceWorker) await navigator.serviceWorker.ready;
        });
        await page.goto('/methods.html');
        await expect(page.locator('h1')).toBeVisible();

        await context.setOffline(true);
        await page.reload();
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('main')).toContainText('Limitations');
        await context.setOffline(false);
    });
});

// ================================================================
test.describe('Calculation reference (CAL-001)', () => {

    test('VV-SYS-150: Reachable from the counter and renders', async ({ page }) => {
        await page.goto('/counter.html');
        await page.locator('a[href="calculation-reference.html"]').first().click();
        await expect(page).toHaveURL(/calculation-reference\.html$/);
        await expect(page.locator('h1')).toContainText('Every number this tool produces');

        const body = await page.locator('main').innerText();
        for (const heading of [
            'The differential percentage', 'How many cells to count',
            'The myeloid-to-erythroid ratio', 'Confidence intervals',
            'The near-threshold advisory', 'Blast percentage',
            'Which cells belong in the count', 'Known limitations',
            'What the software does not do', 'Chosen versus fixed'
        ]) {
            expect(body).toContain(heading);
        }
    });

    test('VV-SYS-151: Reachable from the methods page and links back', async ({ page }) => {
        await page.goto('/methods.html');
        await page.locator('main a[href="calculation-reference.html"]').first().click();
        await expect(page).toHaveURL(/calculation-reference\.html$/);
        await page.locator('a[href="methods.html"]').first().click();
        await expect(page).toHaveURL(/methods\.html$/);
    });

    test('VV-SYS-152: Reachable from the results screen', async ({ page }) => {
        await page.goto('/counter.html');
        await page.fill('#caseNumber', 'S25-REF');
        await page.click('#btnStartCount');
        for (let i = 0; i < 20; i++) await page.keyboard.press('x');
        await page.click('#btnCountDone');
        await page.locator('#results-summary summary').click();
        const link = page.locator('#results-summary a[href="calculation-reference.html"]');
        await expect(link).toBeVisible();
        await expect(link).toContainText('calculation reference');
    });

    test('VV-SYS-153: States both what is configurable and what is fixed', async ({ page }) => {
        await page.goto('/calculation-reference.html');
        const body = await page.locator('main').innerText();
        // The page's central claim, verifiable by reading it.
        expect(body).toContain('Not configurable, and why');
        expect(body).toMatch(/Wilson score/);
        expect(body).toMatch(/largest-remainder/);
        expect(body).toMatch(/2\.3:1/);
        expect(body).toMatch(/1\.7:1/);
        // Configurable markers appear for the choices a laboratory owns.
        expect(await page.locator('.cfg').count()).toBeGreaterThanOrEqual(6);
    });

    test('VV-SYS-154: Available offline', async ({ page, context, browserName }) => {
        test.skip(browserName === 'webkit',
            'Playwright WebKit cannot navigate while offline');
        await page.goto('/counter.html');
        await page.evaluate(async () => {
            if (navigator.serviceWorker) await navigator.serviceWorker.ready;
        });
        await page.goto('/calculation-reference.html');
        await expect(page.locator('h1')).toBeVisible();

        await context.setOffline(true);
        await page.reload();
        await expect(page.locator('h1')).toContainText('Every number this tool produces');
        await context.setOffline(false);
    });

    test('VV-SYS-155: Loads no third-party script (URS-094)', async ({ page, baseURL }) => {
        // Compare against baseURL, not page.url(). The request event can fire
        // while the page is still about:blank — origin "null" — which made
        // Firefox report the locally vendored Tailwind build as third-party.
        const local = new URL(baseURL).origin;
        const remote = [];
        page.on('request', r => {
            if (r.resourceType() !== 'script') return;
            if (new URL(r.url()).origin !== local) remote.push(r.url());
        });
        await page.goto('/calculation-reference.html');
        await expect(page.locator('h1')).toBeVisible();
        expect(remote, 'third-party scripts: ' + remote.join(', ')).toHaveLength(0);
    });
});

// ================================================================
test.describe('Removing a category cleans up after itself (P0-7)', () => {

    test('VV-SYS-200: Removing a category removes what depended on it', async ({ page }) => {
        // Dragging a chip out of the layout removed it from `categories` and
        // `outCodes` and nothing else. The counting policy kept pointing at it,
        // and the profile then failed validation on save with a message about a
        // category the operator had just deleted:
        //
        //   "denominatorExcludes names 'nrbc', which is not a displayed category"
        //
        // The validator was right. The editor had left the profile inconsistent
        // and made the operator work out why.
        await page.goto('/counter.html');
        await page.evaluate(cfg => localStorage.setItem('wbcds_config', JSON.stringify(cfg)), SHIPPED);
        await page.goto('/editor.html');
        await expect(page.locator('#policy-editor')).toBeVisible();
        await page.locator('#specimen-tabs button', { hasText: 'Peripheral' }).click();

        // Peripheral blood excludes nrbc from the denominator, reports it per
        // 100, and the shipped profile carries a blasts threshold.
        await expect(page.locator('.pol-excl[data-cell="nrbc"]')).toBeChecked();

        // Remove both categories from the layout.
        await page.locator('.remove-cell[data-cell-id="nrbc"]').first().click();
        await page.locator('.remove-cell[data-cell-id="blasts"]').first().click();

        // Saving must succeed: nothing should still reference the removed
        // categories.
        await Promise.all([page.waitForEvent('download'), page.click('#btnSaveProfile')]);
        await expect(page.locator('#save-status')).toHaveAttribute('data-status', 'ok');

        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('wbcds_config')));
        const pb = saved.specimenTypes.find(s => s.specimenType === 'pb');
        expect(pb.denominatorExcludes || [], 'the removed category is still excluded').not.toContain('nrbc');
        expect(Object.keys(pb.per100Reporting || {}), 'it is still reported per 100').not.toContain('nrbc');
        for (const t of pb.thresholds || []) {
            expect(t.target, 'a threshold still targets a removed category').not.toBe('blasts');
        }
        for (const f of Object.values(pb.formulas || {})) {
            expect([...(f.numerator || []), ...(f.denominator || [])])
                .not.toContain('nrbc');
        }
    });
});

// ================================================================
test.describe('The predecessor profile is reachable and countable (URS-101)', () => {

    /**
     * `mdc-2015-9` reproduces the 2015 Backbone/JSP counter kept at `legacy/`,
     * so an operator who used it can switch without relearning the keyboard.
     * The unit layer holds the configuration to what that application was
     * measured to do (VV-PRE-021..026, DCR-032). What only a browser can show
     * is that the preset actually loads from the catalogue and that the
     * familiar keys then count the familiar cells.
     */
    async function loadLegacyMdc(page) {
        await page.goto('/counter.html');
        await page.click('text=Preset Profiles');
        await page.locator('div', { hasText: /^9-Type — 2015 Counter Layout/ })
            .locator('button:has-text("Load")').last().click();
        // A "Preset Loaded" confirmation follows, in #modal-overlay. It must
        // be dismissed before anything else is clicked: while visible the
        // overlay intercepts pointer events, so a later click waits out its
        // own timeout without reporting anything about the dialog in the way.
        // (The catalogue itself is NOT in this overlay — the overlay is
        // hidden while the catalogue is open, which is why waiting on it
        // earlier proved nothing.)
        const overlay = page.locator('#modal-overlay');
        await expect(overlay).toBeVisible();
        await expect(overlay).toContainText('9-Type — 2015 Counter Layout');
        await overlay.getByRole('button', { name: 'OK' }).click();
        await expect(overlay).toBeHidden();
    }

    test('VV-SYS-210: The preset loads from the catalogue', async ({ page }) => {
        await loadLegacyMdc(page);
        await page.click('text=Start Count');
        // The predecessor's nine categories, on the predecessor's nine keys.
        // Read from the counting grid rather than asserted one label at a
        // time: `text=PRO` is a substring match and finds hidden nodes on
        // other phases, which says nothing about what the operator sees.
        const shown = await page.locator('#phase-counting').innerText();
        for (const label of ['BLASTS', 'PRO', 'GRAN', 'NRBC', 'BASO',
            'EOS', 'PLASMA', 'LYMPH', 'MONO']) {
            expect(shown).toContain(label);
        }
        // And not the categories this profile deliberately does not have.
        for (const absent of ['META', 'MAST', 'BANDS']) {
            expect(shown).not.toContain(absent);
        }
    });

    test('VV-SYS-211: The predecessor keys count the predecessor cells', async ({ page }) => {
        await loadLegacyMdc(page);
        await page.click('text=Start Count');
        // A→blasts, D→gran, F→nrbc, V→lymph, B→mono — the same count driven
        // through the running predecessor when this profile was written.
        const press = async (k, n) => { for (let i = 0; i < n; i++) await page.keyboard.press(k); };
        await press('a', 1); await press('d', 99); await press('f', 50);
        await press('v', 25); await press('b', 26);

        const body = await page.locator('body').innerText();
        expect(body).toContain('201');
        // On-screen percentages match the predecessor's two-decimal display
        // exactly — this is the continuity the profile exists to provide.
        for (const pct of ['0.50%', '49.25%', '24.88%', '12.44%', '12.93%']) {
            expect(body).toContain(pct);
        }
    });

    test('VV-SYS-212: The report keeps a counted cell, and fills the M:E field', async ({ page }) => {
        await loadLegacyMdc(page);
        await page.click('text=Start Count');
        const press = async (k, n) => { for (let i = 0; i < n; i++) await page.keyboard.press(k); };
        await press('a', 1); await press('d', 99); await press('f', 50);
        await press('v', 25); await press('b', 26);
        await page.click('text=Count Done');

        // The predecessor printed "0% blasts" here, and its figures summed to
        // 99. Both are corrected; the wording is otherwise its own.
        const report = await page.locator('body').innerText();
        expect(report).toContain('0.5% blasts');
        expect(report).not.toContain('0% blasts');
        expect(report).toContain('maturing granulocyte forms');

        // The three institutional templates it shipped.
        for (const tab of ['Yale SOM', 'Precipio DX', 'MGH']) {
            expect(report).toContain(tab);
        }
        // Its Precipio DX template reserved an M:E field and never filled it.
        await page.getByRole('button', { name: 'Precipio DX' }).click();
        const pdx = await page.locator('body').innerText();
        expect(pdx).toMatch(/M:E ratio \| \d+\.\d:1/);
        expect(pdx).not.toMatch(/M:E ratio \| _ \|/);
    });
});

// ================================================================
test.describe('A renamed profile id is offered, never imposed (URS-101)', () => {

    /**
     * DCR-035 renamed five profile ids. An id is not private — it prints in
     * the report footer (URS-052) and travels in every export — and
     * `isCacheSuperseded` compares ids for equality, so a browser holding a
     * cached `consensus-14` would have reported "not superseded" and carried
     * on silently under a name the catalogue no longer contains.
     *
     * The remedy must not overcorrect. An operator may have adapted their
     * configuration since loading it, and replacing it to fix a label would
     * discard that work. So: offered, declining by default.
     */
    async function seedOldProfile(page) {
        const old = JSON.parse(fs.readFileSync(
            path.join(__dirname, '..', 'web', 'settings', 'presets', 'ndc-14.json'), 'utf-8'));
        old.profileId = 'consensus-14';
        old.profileName = 'Full 14-Part Consensus';
        old.version = '2.5';
        await page.addInitScript(cfg => {
            localStorage.setItem('wbcds_config', JSON.stringify(cfg));
        }, old);
    }

    test('VV-SYS-217: The operator is told, and keeping their profile is the default', async ({ page }) => {
        await seedOldProfile(page);
        await page.goto('/counter.html');

        const overlay = page.locator('#modal-overlay');
        await expect(overlay).toBeVisible();
        await expect(overlay).toContainText('consensus-14');
        await expect(overlay).toContainText('ndc-14');

        await overlay.getByRole('button', { name: 'Keep mine' }).click();
        await expect(overlay).toBeHidden();

        // The configuration is untouched — this is the assertion that matters.
        const kept = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('wbcds_config')).profileId);
        expect(kept).toBe('consensus-14');
    });

    test('VV-SYS-218: Accepting loads the renamed built-in', async ({ page }) => {
        await seedOldProfile(page);
        await page.goto('/counter.html');

        const overlay = page.locator('#modal-overlay');
        await expect(overlay).toBeVisible();
        await overlay.getByRole('button', { name: /^Load / }).click();

        // "Preset Loaded" confirms; dismiss it, then check what is cached.
        await expect(overlay).toContainText('14-Type Nucleated Differential');
        await overlay.locator('#modal-confirm').click();
        await expect(overlay).toBeHidden();

        const now = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('wbcds_config')).profileId);
        expect(now).toBe('ndc-14');
    });

    test('VV-SYS-219: A current profile raises no offer', async ({ page }) => {
        // Seeds a CACHED profile whose id is current. A fresh browser would
        // prove nothing: with no cache the offer cannot fire for a structural
        // reason, so the test would pass however wrong the rename map was —
        // which it did, until the inverse check exposed it.
        const current = JSON.parse(fs.readFileSync(
            path.join(__dirname, '..', 'web', 'settings', 'presets', 'ndc-14.json'), 'utf-8'));
        await page.addInitScript(cfg => {
            localStorage.setItem('wbcds_config', JSON.stringify(cfg));
        }, current);

        await page.goto('/counter.html');
        await waitForAppReady(page);
        await expect(page.locator('#modal-overlay')).toBeHidden();
        const kept = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('wbcds_config')).profileId);
        expect(kept).toBe('ndc-14');
    });
});

// ================================================================
test.describe('The method statement reports its basis (URS-055)', () => {

    /**
     * `buildMethodStatement` emits a "Basis" entry from `provenance.notes`,
     * and `prepareConfig` built its meta as {version, profileId, profileName} —
     * dropping provenance before the statement was ever built. The entry
     * therefore appeared only in unit tests that constructed a meta by hand;
     * no shipped report has ever carried a basis.
     *
     * That is why the false provenance corrected in DCR-035 never reached a
     * patient record: two defects cancelled. Neither was safe on its own, and
     * the one that hid the other is fixed here.
     */
    test('VV-SYS-220: The rendered report states the profile\'s basis', async ({ page }) => {
        await page.goto('/counter.html');
        await page.click('#btnStartCount');
        for (const k of ['a', 's', 'd']) {
            for (let i = 0; i < 10; i++) await page.keyboard.press(k);
        }
        await page.click('text=Count Done');
        await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));

        const text = await page.locator('body').innerText();
        expect(text).toMatch(/Basis:/);

        // And it is the SHIPPED profile's basis, not a leftover string.
        const shipped = await page.evaluate(async () => {
            const r = await fetch('settings/templates.json', { cache: 'no-cache' });
            return (await r.json()).provenance.notes;
        });
        expect(shipped).toBeTruthy();
        expect(text).toContain(shipped.slice(0, 60));
    });

    test('VV-SYS-221: A profile with no bone marrow states no bone marrow basis', async ({ page }) => {
        // The defect this pair exists for: analyzer-5 claimed a bone marrow and
        // M:E basis with neither. Now that the basis actually prints, a wrong
        // note would reach the report — so the assertion is on the report, not
        // only on the file.
        await page.goto('/counter.html');
        await page.click('#btnPresetCatalog');
        await page.locator('#preset-list button[data-preset-name="5-Type — Analyzer Categories"]').click();
        await expect(page.locator('#modal-title')).toHaveText('Preset Loaded');
        await page.click('#modal-confirm');
        await page.click('#btnStartCount');
        for (const k of ['f', 'd', 's']) {
            for (let i = 0; i < 10; i++) await page.keyboard.press(k);
        }
        await page.click('text=Count Done');
        await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));

        const basis = await page.evaluate(() => {
            const m = document.body.innerText.match(/Basis:[^\n]*/);
            return m ? m[0] : '';
        });
        expect(basis).toBeTruthy();
        expect(basis).not.toMatch(/bone marrow/i);
        expect(basis).not.toMatch(/M:E/);
    });
});
