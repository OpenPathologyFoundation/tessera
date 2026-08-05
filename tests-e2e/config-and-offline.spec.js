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
        expect(download.suggestedFilename()).toMatch(/^wbcds-config-consensus-14-.*\.json$/);

        const profile = JSON.parse(await readDownload(download));
        expect(profile.profileId).toBe('consensus-14');
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
        await expect(page.locator('#specimenType option')).toHaveText(['Stale Marrow']);

        await page.click('#btnResetConfig');
        await expect(page.locator('#modal-title')).toHaveText('Reset Configuration');
        await page.click('#modal-confirm');

        await waitForAppReady(page);
        await expect(page.locator('#specimenType option')).toHaveText(['Bone Marrow', 'Peripheral Blood']);
        expect(await page.evaluate(() => window.__wbcTestHooks.state.configMeta.profileId))
            .toBe('consensus-14');
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
        expect(names.join('|')).toContain('Full 14-Part Consensus');
        expect(names.join('|')).toContain('Minimal 5-Part');
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
        await page.locator('#preset-list button[data-preset-name="Minimal 5-Part"]').click();

        await expect(page.locator('#modal-title')).toHaveText('Preset Loaded');
        await page.click('#modal-confirm');

        await waitForAppReady(page);
        expect(await page.evaluate(() => window.__wbcTestHooks.state.configMeta.profileId))
            .toBe('minimal-5');

        await page.click('#btnStartCount');
        await expect(page.locator('#progress-label')).toHaveText('0 / 100 (target)');
        // Five categories in this profile, so exactly five key legends.
        expect(await page.locator('#counter-table-area kbd').count()).toBe(5);
    });

    test('VV-SYS-057: The body fluid preset provides a non-blood specimen panel (URS-011)', async ({ page }) => {
        await page.goto('/counter.html');
        await page.click('#btnPresetCatalog');
        await page.locator('#preset-list button[data-preset-name="Body Fluid"]').click();
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

    test('VV-SYS-125: The legacy preset reports blasts against both denominators', async ({ page }) => {
        await page.goto('/counter.html');
        await page.click('#btnPresetCatalog');
        await page.locator('#preset-list button[data-preset-name="Legacy 9-Part"]').click();
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
        expect(csv).toContain('consensus-14');
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
        expect(sessions[0].configProfileId).toBe('consensus-14');
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
        await expect(page.locator('#history-modal-content')).toContainText('consensus-14');
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
        await expect(page.locator('#results-summary')).toContainText('consensus-14');

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
