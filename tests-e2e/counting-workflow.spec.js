/**
 * E2E SUITE: Clinical Counting Workflow
 * ======================================
 * Traces to: URS-001..URS-006, URS-020..URS-028, URS-030..URS-036,
 *            URS-040..URS-042, URS-050..URS-054, URS-060..URS-063
 * VV Protocol: VV-SYS-001 onward
 *
 * System-level verification against the deployed application in a real
 * browser. Validation scenario V1 (a complete bone marrow differential) is
 * executed end to end.
 */
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

// Read from the shipped profile rather than pinning a literal: the version is
// what drives the supersede check that delivers a corrected profile to an
// installed browser, so it is expected to change.
const SHIPPED = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'web', 'settings', 'templates.json'), 'utf-8'));

/** Fresh browser state for every test — no carry-over between "patients". */
// Playwright gives every test a fresh browser context, so localStorage and
// sessionStorage already start empty. An addInitScript that clears them would
// re-run on every navigation and wipe state the reload-based tests depend on.
test.beforeEach(async ({ page }) => {
    await page.goto('/counter.html');
    await expect(page.locator('#phase-case-entry')).toBeVisible();
});

async function startCount(page, caseNumber = 'S25-1234') {
    if (caseNumber) await page.fill('#caseNumber', caseNumber);
    await page.click('#btnStartCount');
    await expect(page.locator('#phase-counting')).toBeVisible();
}

/** Press a counting key n times against the document. */
async function count(page, key, n) {
    for (let i = 0; i < n; i++) await page.keyboard.press(key);
}

// ================================================================
test.describe('Case entry and start', () => {

    test('VV-SYS-001: Application loads and presents the case entry phase', async ({ page }) => {
        await expect(page.locator('#caseNumber')).toBeVisible();
        await expect(page.locator('#specimenType')).toBeVisible();
        await expect(page.locator('#btnStartCount')).toBeVisible();
        await expect(page.locator('#state-label')).toHaveText('Ready');
    });

    test('VV-SYS-002: Specimen selector is populated from the configuration profile', async ({ page }) => {
        const options = await page.locator('#specimenType option').allTextContents();
        expect(options).toContain('Bone Marrow');
        expect(options).toContain('Peripheral Blood');
    });

    test('VV-SYS-003: Enter in the case field starts counting (barcode workflow, URS-006)', async ({ page }) => {
        await page.fill('#caseNumber', 'S25-9999');
        await page.press('#caseNumber', 'Enter');
        await expect(page.locator('#phase-counting')).toBeVisible();

        // The scanner leaves focus in the case field; counting must still work.
        await count(page, 'x', 3);
        await expect(page.locator('#val-grand-total')).toHaveText('3');
    });

    test('VV-SYS-004: Counting may begin without a case number (URS-004)', async ({ page }) => {
        await page.click('#btnStartCount');
        await expect(page.locator('#phase-counting')).toBeVisible();
    });

    test('VV-SYS-005: Active case number is displayed throughout counting (URS-002)', async ({ page }) => {
        await startCount(page, 'S25-1234');
        await expect(page.locator('#case-badge-number')).toHaveText('S25-1234');
        await expect(page.locator('#case-badge-spec')).toHaveText('Bone Marrow');
    });
});

// ================================================================
test.describe('Keyboard counting', () => {

    test('VV-SYS-010: Every configured key increments its own category (URS-020, URS-021)', async ({ page }) => {
        await startCount(page);
        const mapping = { x: 'blasts', f: 'poly', s: 'lymph', b: 'nrbc', a: 'mono' };
        let expected = 0;
        for (const [key, cell] of Object.entries(mapping)) {
            await page.keyboard.press(key);
            expected++;
            await expect(page.locator(`#val-${cell}`)).toHaveText('1');
        }
        await expect(page.locator('#val-grand-total')).toHaveText(String(expected));
    });

    test('VV-SYS-011: Shift+key undoes and never passes zero (URS-025)', async ({ page }) => {
        await startCount(page);
        await count(page, 'x', 3);
        await expect(page.locator('#val-blasts')).toHaveText('3');
        await page.keyboard.press('Shift+X');
        await expect(page.locator('#val-blasts')).toHaveText('2');
        for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+X');
        await expect(page.locator('#val-blasts')).toHaveText('0');
        await expect(page.locator('#val-grand-total')).toHaveText('0');
    });

    test('VV-SYS-012: Unmapped keys are ignored (URS-026)', async ({ page }) => {
        await startCount(page);
        for (const k of ['1', '9', '/', 'Tab', 'ArrowLeft']) await page.keyboard.press(k);
        await expect(page.locator('#val-grand-total')).toHaveText('0');
    });

    test('VV-SYS-013: Key mapping is displayed for every category (URS-022)', async ({ page }) => {
        await startCount(page);
        const kbds = await page.locator('#counter-table-area kbd').allTextContents();
        expect(kbds).toContain('X');
        expect(kbds).toContain('F');
        expect(kbds.filter(k => k === '?')).toHaveLength(0);
    });

    test('VV-SYS-014: Percentages update live and sum to 100.00 (URS-031, URS-034)', async ({ page }) => {
        await startCount(page);
        for (const k of ['x', 'f', 's', 'a', 'b', 'd', 'g']) await count(page, k, 7);

        const pcts = await page.locator('#counter-table-area [id^="pct-"]:not([id^="pct-sub"])').allTextContents();
        const sum = pcts.reduce((s, t) => s + parseFloat(t), 0);
        expect(Number(sum.toFixed(2))).toBe(100);
    });

    test('VV-SYS-015: Typing in the comment field never counts (URS-070)', async ({ page }) => {
        await startCount(page);
        await page.locator('#phase-counting details summary').click();
        await page.fill('#morphComments', 'xxxx ffff ssss');
        await expect(page.locator('#val-grand-total')).toHaveText('0');
        await expect(page.locator('#commentCharCount')).toContainText('14 / 500');
    });

    test('VV-SYS-016: Progress indicator tracks the target count (URS-024)', async ({ page }) => {
        await startCount(page);
        await expect(page.locator('#progress-label')).toHaveText('0 / 500 (target)');
        await count(page, 'x', 10);
        await expect(page.locator('#progress-label')).toHaveText('10 / 500 (target)');
    });

    test('VV-SYS-017: M:E ratio computes live and shows N/A with a zero denominator (URS-035)', async ({ page }) => {
        await startCount(page);
        await expect(page.locator('#val-formula-ME_ratio')).toHaveText('N/A');
        await count(page, 'f', 100);
        await expect(page.locator('#val-formula-ME_ratio')).toHaveText('N/A');  // no erythroid yet
        await count(page, 'b', 50);
        await expect(page.locator('#val-formula-ME_ratio')).toHaveText('2.0:1');
    });
});

// ================================================================
test.describe('Validation scenario V1 — complete bone marrow differential', () => {

    test('VV-SYS-020: 500-cell differential counts, reports and exports consistently', async ({ page }) => {
        await startCount(page, 'S25-0500');

        const plan = { b: 150, f: 120, x: 45, d: 45, c: 40, s: 38, v: 35, a: 20, g: 7 };
        let total = 0;
        for (const [key, n] of Object.entries(plan)) {
            await count(page, key, n);
            total += n;
        }
        expect(total).toBe(500);
        await expect(page.locator('#val-grand-total')).toHaveText('500');
        await expect(page.locator('#progress-label')).toHaveText('500 / 500 (target)');

        // M:E = (45+0+35+40+45+120+0+7+20) / 150 = 312/150 = 2.1
        await expect(page.locator('#val-formula-ME_ratio')).toHaveText('2.1:1');

        await page.click('#btnCountDone');
        await expect(page.locator('#phase-results')).toBeVisible();

        // Target reached: no low-count advisory
        await expect(page.locator('#low-count-note')).toBeHidden();

        // Traceability footer present (URS-052)
        await expect(page.locator('#results-summary')).toContainText('consensus-14');
        await expect(page.locator('#results-summary')).toContainText('v' + SHIPPED.version);

        // The report percentages must sum to 100
        const panel = await page.locator('.tab-panel:not(.hidden)').innerText();
        const reported = [...panel.matchAll(/(\d+)%/g)].map(m => Number(m[1]));
        expect(reported.reduce((a, b) => a + b, 0)).toBe(100);
    });

    test('VV-SYS-021: Sub-target count completes with an advisory, never a block (URS-041)', async ({ page }) => {
        await startCount(page, 'S25-0216');
        await count(page, 'x', 216);
        await page.click('#btnCountDone');
        await expect(page.locator('#phase-results')).toBeVisible();
        await expect(page.locator('#low-count-note')).toBeVisible();
        await expect(page.locator('#low-count-note')).toContainText('216-cell count');
    });
});

// ================================================================
test.describe('Continue Counting and reset', () => {

    test('VV-SYS-030: Continue Counting preserves the tally and extends it (URS-042)', async ({ page }) => {
        await startCount(page, 'S25-1');
        await count(page, 'x', 40);
        await count(page, 'f', 160);
        await page.click('#btnCountDone');
        await expect(page.locator('#phase-results')).toBeVisible();

        await page.click('#btnResumeCounting');
        await expect(page.locator('#phase-counting')).toBeVisible();
        await expect(page.locator('#val-grand-total')).toHaveText('200');

        await count(page, 'x', 10);
        await expect(page.locator('#val-blasts')).toHaveText('50');
        await expect(page.locator('#val-grand-total')).toHaveText('210');
    });

    test('VV-SYS-031: Comments survive Count Done then Continue Counting (URS-073)', async ({ page }) => {
        await startCount(page, 'S25-1');
        await count(page, 'x', 5);
        await page.locator('#phase-counting details summary').click();
        await page.fill('#morphComments', 'Auer rods identified');
        await page.click('#btnCountDone');
        await page.click('#btnResumeCounting');
        await expect(page.locator('#morphComments')).toHaveValue('Auer rods identified');
    });

    test('VV-SYS-032: Reset requires confirmation and then clears the count (URS-060, URS-061)', async ({ page }) => {
        await startCount(page, 'S25-1');
        await count(page, 'x', 12);
        await page.click('#btnCountReset');
        await expect(page.locator('#modal-overlay')).toBeVisible();

        await page.click('#modal-cancel');
        await expect(page.locator('#val-blasts')).toHaveText('12');

        await page.click('#btnCountReset');
        await page.click('#modal-confirm');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await expect(page.locator('#caseNumber')).toHaveValue('');
    });

    test('VV-SYS-033: Keystrokes after completion cannot alter the count (HA-015)', async ({ page }) => {
        await startCount(page, 'S25-1');
        await count(page, 'x', 10);
        await page.click('#btnCountDone');
        await count(page, 'x', 5);
        await page.click('#btnResumeCounting');
        await expect(page.locator('#val-blasts')).toHaveText('10');
    });
});

// ================================================================
test.describe('Specimen type switching (URS-010, URS-013)', () => {

    test('VV-SYS-040: The specimen switcher is available during counting', async ({ page }) => {
        await startCount(page, 'S25-1');
        await expect(page.locator('#specimen-switch-wrap')).toBeVisible();
        await expect(page.locator('#specimenTypeCounting')).toBeEnabled();
    });

    test('VV-SYS-041: Switching mid-count saves the work to history first', async ({ page }) => {
        await startCount(page, 'S25-1');
        await count(page, 'x', 25);
        await page.selectOption('#specimenTypeCounting', 'pb');
        await expect(page.locator('#modal-overlay')).toBeVisible();
        await expect(page.locator('#modal-message')).toContainText('saved to history');
        await page.click('#modal-confirm');

        await expect(page.locator('#val-grand-total')).toHaveText('0');
        await expect(page.locator('#case-badge-spec')).toHaveText('Peripheral Blood');
        await expect(page.locator('#history-count')).toHaveText('(1)');
    });

    test('VV-SYS-042: Cancelling a switch restores both the selector and the count', async ({ page }) => {
        await startCount(page, 'S25-1');
        await count(page, 'x', 25);
        await page.selectOption('#specimenTypeCounting', 'pb');
        await page.click('#modal-cancel');
        await expect(page.locator('#specimenTypeCounting')).toHaveValue('bm');
        await expect(page.locator('#val-blasts')).toHaveText('25');
    });
});

// ================================================================
test.describe('Denominator policy — NRBC in peripheral blood (URS-030, DCR-006)', () => {

    async function startPB(page, caseNumber = 'S25-PB') {
        await page.fill('#caseNumber', caseNumber);
        await page.selectOption('#specimenType', 'pb');
        await page.click('#btnStartCount');
        await expect(page.locator('#phase-counting')).toBeVisible();
    }

    test('VV-SYS-100: NRBC counted in PB do not dilute the leucocyte percentages', async ({ page }) => {
        await startPB(page);
        await count(page, 'f', 120);   // segs
        await count(page, 's', 40);    // lymphs
        await count(page, 'a', 15);    // monos
        await count(page, 'g', 5);     // eos
        await count(page, 'b', 20);    // NRBC

        // 120/180 = 66.67%. Before this change the same slide reported 60.00%,
        // because the 20 NRBC sat in the denominator.
        await expect(page.locator('#pct-poly')).toHaveText('66.67%');
        await expect(page.locator('#pct-lymph')).toHaveText('22.22%');
        await expect(page.locator('#pct-nrbc')).toHaveText('11.1/100');
        await expect(page.locator('#val-grand-total')).toHaveText('180 + 20');
    });

    test('VV-SYS-101: The report states the leucocyte differential and NRBC per 100 WBC', async ({ page }) => {
        await startPB(page, 'S25-NRBC');
        await count(page, 'f', 180);
        await count(page, 'b', 20);
        await page.click('#btnCountDone');

        const panel = await page.locator('.tab-panel:not(.hidden)').innerText();
        expect(panel).toContain('180-cell differential');
        expect(panel).toContain('11.1 per 100 WBC');
        expect(panel).not.toContain('{{');

        // The reported leucocyte percentages still sum to 100.
        const reported = [...panel.matchAll(/(\d+)% /g)].map(m => Number(m[1]));
        expect(reported.reduce((a, b) => a + b, 0)).toBe(100);
    });

    test('VV-SYS-102: Bone marrow keeps erythroblasts in the differential', async ({ page }) => {
        await startCount(page, 'S25-BM');
        await count(page, 'f', 180);
        await count(page, 'b', 20);
        // ICSH 2008 includes erythroblasts in the nucleated differential count.
        await expect(page.locator('#pct-nrbc')).toHaveText('10.00%');
        await expect(page.locator('#val-grand-total')).toHaveText('200');
    });
});

// ================================================================
test.describe('Sampling precision (URS-037, HA-030)', () => {

    test('VV-SYS-110: The report states a confidence interval for each percentage', async ({ page }) => {
        await startCount(page, 'S25-CI');
        await count(page, 'x', 40);    // blasts
        await count(page, 'f', 160);   // segs
        await page.click('#btnCountDone');

        const summary = await page.locator('#results-summary').innerText();
        expect(summary).toContain('20.00%');
        // 40 of 200 = 20%; Wilson 95% interval 15.0-26.1%
        expect(summary).toContain('15.0–26.1%');
    });

    test('VV-SYS-111: A sub-target count carries a quantified advisory', async ({ page }) => {
        await startCount(page, 'S25-LOW');
        await count(page, 'x', 100);
        await page.click('#btnCountDone');

        await expect(page.locator('#low-count-note')).toBeVisible();
        const note = await page.locator('#low-count-note').innerText();
        expect(note).toContain('100-cell count');
        expect(note).toContain('95% confidence interval');
        // The vague wording it replaced said only "confidence reduced".
        expect(note).toMatch(/\d+\.\d–\d+\.\d%/);
    });

    test('VV-SYS-112: A zero count is reported as bounded, not absent', async ({ page }) => {
        await startCount(page, 'S25-ZERO');
        await count(page, 'f', 200);   // no blasts counted
        await page.click('#btnCountDone');

        const ci = await page.evaluate(() =>
            window.__wbcTestHooks.state.sessionHistory[0].confidenceIntervals.blasts);
        expect(ci.point).toBe(0);
        expect(ci.lower).toBe(0);
        expect(ci.upper).toBeGreaterThan(0);
        expect(ci.upper).toBeLessThan(2.5);
    });
});

// ================================================================
test.describe('Near-threshold advisory (URS-038, ICSH 2008 §2.6)', () => {

    test('VV-SYS-120: A count straddling the AML threshold raises the advisory', async ({ page }) => {
        await startCount(page, 'S25-THR');
        await count(page, 'x', 40);    // blasts
        await count(page, 'f', 160);   // segs -> 20% of 200
        await page.click('#btnCountDone');

        await expect(page.locator('#threshold-note')).toBeVisible();
        const body = await page.locator('#threshold-note-body').innerText();
        expect(body).toContain('blasts');
        expect(body).toContain('15.0–26.1%');
        expect(body).toContain('20% AML blast threshold');

        // ICSH is cited as the basis for the recommendation.
        const box = await page.locator('#threshold-note').innerText();
        expect(box).toContain('ICSH 2008');
        expect(box).toContain('Continue Counting');
    });

    test('VV-SYS-121: The advisory is informational and never blocks', async ({ page }) => {
        await startCount(page, 'S25-THR2');
        await count(page, 'x', 40);
        await count(page, 'f', 160);
        await page.click('#btnCountDone');

        await expect(page.locator('#phase-results')).toBeVisible();
        await expect(page.locator('#modal-overlay')).toBeHidden();
        // The report is fully available regardless.
        await expect(page.locator('.tab-panel:not(.hidden)')).toBeVisible();
    });

    test('VV-SYS-122: Extending the count re-evaluates the advisory', async ({ page }) => {
        await startCount(page, 'S25-EXT');
        await count(page, 'x', 40);
        await count(page, 'f', 160);
        await page.click('#btnCountDone');
        await expect(page.locator('#threshold-note')).toBeVisible();

        await page.click('#btnResumeCounting');
        await expect(page.locator('#val-grand-total')).toHaveText('200');
        await count(page, 'f', 300);
        await page.click('#btnCountDone');

        // 40 of 500 = 8%, clear of the 20% threshold.
        await expect(page.locator('#threshold-note')).toBeHidden();
    });

    test('VV-SYS-123: A clean count shows no advisory', async ({ page }) => {
        await startCount(page, 'S25-CLEAN');
        await count(page, 'f', 500);
        await page.click('#btnCountDone');
        await expect(page.locator('#threshold-note')).toBeHidden();
    });
});

// ================================================================
test.describe('Method provenance (URS-052, URS-055)', () => {

    test('VV-SYS-130: The pasted report carries profile attribution', async ({ page, browserName }) => {
        await startCount(page, 'S25-PROV');
        await count(page, 'x', 50);
        await page.click('#btnCountDone');
        await page.click('#btnCopyOutput');
        await expect(page.locator('#copyBtnText')).toHaveText('Copied!');

        test.skip(browserName !== 'chromium',
            'clipboard-read permission is Chromium-only in Playwright');

        // What actually lands in the LIS must identify the profile that
        // produced it — the report is otherwise not interpretable later.
        const clip = await page.evaluate(() => navigator.clipboard.readText());
        expect(clip).toContain('consensus-14');
        expect(clip).toMatch(/v\d+\.\d+/);
        expect(clip).toContain('S25-PROV');
    });

    test('VV-SYS-131: The results screen states the conventions used', async ({ page }) => {
        await startCount(page, 'S25-METHOD');
        await count(page, 'x', 50);
        await page.click('#btnCountDone');

        const summary = page.locator('#results-summary');
        await expect(summary).toContainText('Method');
        // Expand the disclosure and check the substance.
        await summary.locator('summary').click();
        const text = await summary.innerText();
        expect(text).toContain('ICSH 2008');
        expect(text).toMatch(/competing convention/i);
    });
});
