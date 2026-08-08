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
        await expect(page.locator('#results-summary')).toContainText('ndc-14');
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
        expect(clip).toContain('ndc-14');
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

// ================================================================
test.describe('Legibility of clinical advisories (URS-095)', () => {

    /**
     * WCAG contrast, measured on the rendered page.
     *
     * The amber palette used for warnings is chosen for a dark background. On
     * the light theme it rendered near-white: the near-threshold advisory, the
     * sub-target note and the abnormal-row flag were all effectively invisible,
     * and no test noticed because every one of them asserted only on text
     * content. An advisory that cannot be read is worse than none, because the
     * system has recorded that it warned.
     *
     * Semi-transparent layers are composited down to the page background, since
     * the panels use a 10% amber tint over the body colour.
     */
    async function contrastFailures(page, selectors) {
        return page.evaluate((sels) => {
            const px = s => {
                const m = String(s).match(/rgba?\(([^)]+)\)/);
                if (!m) return null;
                const a = m[1].split(',').map(parseFloat);
                return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 };
            };
            const over = (f, b) => ({
                r: f.r * f.a + b.r * (1 - f.a),
                g: f.g * f.a + b.g * (1 - f.a),
                b: f.b * f.a + b.b * (1 - f.a), a: 1
            });
            const effBg = el => {
                const stack = [];
                for (let e = el; e; e = e.parentElement) {
                    const c = px(getComputedStyle(e).backgroundColor);
                    if (c && c.a > 0) stack.push(c);
                }
                let base = { r: 255, g: 255, b: 255, a: 1 };
                for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
                return base;
            };
            const lum = c => {
                const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
                return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
            };
            const ratio = (f, b) => {
                const a = lum(f), c = lum(b);
                const hi = Math.max(a, c), lo = Math.min(a, c);
                return (hi + 0.05) / (lo + 0.05);
            };
            const bad = [];
            for (const sel of sels) {
                const root = document.querySelector(sel);
                if (!root || root.classList.contains('hidden')) continue;
                const nodes = root.children.length ? [...root.querySelectorAll('*')] : [root];
                for (const el of nodes) {
                    const t = (el.textContent || '').trim();
                    if (!t || el.children.length) continue;
                    const fg = px(getComputedStyle(el).color);
                    if (!fg) continue;
                    const r = ratio(fg, effBg(el));
                    if (r < 4.5) bad.push({ sel, text: t.slice(0, 50), ratio: Number(r.toFixed(2)) });
                }
            }
            return bad;
        }, selectors);
    }

    for (const theme of ['light', 'dark']) {
        test(`VV-SYS-160 (${theme}): advisories are legible in the ${theme} theme`, async ({ page }) => {
            await page.evaluate(t => sessionStorage.setItem('wbcds_theme', t), theme);
            await page.reload();
            await expect(page.locator('#phase-case-entry')).toBeVisible();

            // A count that trips both advisories: plasma straddling 10%,
            // and a total below the 500-cell bone marrow target.
            await page.fill('#caseNumber', 'S25-CONTRAST');
            await page.click('#btnStartCount');
            await count(page, 'e', 26);    // plasma
            await count(page, 'f', 274);   // segs -> 300 cells, plasma 8.7%
            await page.click('#btnCountDone');

            await expect(page.locator('#threshold-note')).toBeVisible();
            await expect(page.locator('#low-count-note')).toBeVisible();

            const bad = await contrastFailures(page, ['#threshold-note', '#low-count-note']);
            expect(bad, `text below WCAG AA 4.5:1 in the ${theme} theme: ` +
                JSON.stringify(bad, null, 1)).toEqual([]);
        });
    }

    test('VV-SYS-161: The counting grid stays legible in the light theme', async ({ page }) => {
        await page.evaluate(() => sessionStorage.setItem('wbcds_theme', 'light'));
        await page.reload();
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await page.selectOption('#specimenType', 'pb');
        await page.click('#btnStartCount');
        await count(page, 'f', 180);
        await count(page, 'b', 20);   // NRBC renders in amber as "11.1/100"

        const bad = await contrastFailures(page, ['#counter-table-area']);
        expect(bad, 'counting grid text below WCAG AA: ' + JSON.stringify(bad, null, 1)).toEqual([]);
    });
});

// ================================================================
test.describe('The totals column is one column (URS-055)', () => {

    /**
     * Each category row is its own table sized `w-full`, so it divided its
     * width by its OWN column count: a four-category row and a five-category
     * row put their Sub column in different places, and the grand total,
     * pinned to the container edge, landed in a third. Three columns of
     * totals, none above another, and the misalignment grew with how uneven
     * the two rows were.
     *
     * Rows are uneven in most shipped profiles, so this is the normal case
     * rather than an edge one. Measured rather than eyeballed: the centres of
     * the two subtotals and the grand total must coincide.
     */
    async function loadLegacyMdc(page) {
        await page.click('text=Preset Profiles');
        const ok = await page.evaluate(() => {
            for (const b of document.querySelectorAll('button')) {
                if (b.textContent.trim() !== 'Load') continue;
                let row = b.parentElement;
                while (row && !row.textContent.includes('9-Type — 2015 Counter Layout')) row = row.parentElement;
                if (row && row.querySelectorAll('button').length <= 2) { b.click(); return true; }
            }
            return false;
        });
        expect(ok).toBe(true);
        const overlay = page.locator('#modal-overlay');
        await expect(overlay).toContainText('9-Type — 2015 Counter Layout');
        await overlay.getByRole('button', { name: 'OK' }).click();
        await expect(overlay).toBeHidden();
    }

    async function countAcross(page) {
        await page.click('text=Start Count');
        for (const k of ['a', 's', 'd', 'f', 'g', 'h', 'z', 'x', 'c', 'v', 'b', 'n']) {
            for (let i = 0; i < 3; i++) await page.keyboard.press(k);
        }
    }

    // Absence is checked before measuring. `boundingBox()` on a locator that
    // matches nothing waits for it to appear and then times out the whole
    // test, which reads as a layout failure and is not one.
    const centre = async (page, sel) => {
        if (await page.locator(sel).count() === 0) return null;
        const box = await page.locator(sel).first().boundingBox();
        return box ? box.x + box.width / 2 : null;
    };

    for (const width of [1440, 1024, 820]) {
        test(`VV-SYS-213: Subtotals and the grand total share one axis at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto('/counter.html');
            await countAcross(page);

            // The shipped default splits 7/7, but the assertion must hold for
            // any split — an uneven one is what exposed the defect.
            const upper = await centre(page, '#val-sub-upper');
            const lower = await centre(page, '#val-sub-lower');
            const grand = await centre(page, '#val-grand-total');
            expect(upper).not.toBeNull();
            expect(lower).not.toBeNull();
            expect(grand).not.toBeNull();

            // One pixel of tolerance for sub-pixel layout rounding; the defect
            // this catches was tens of pixels.
            expect(Math.abs(upper - lower)).toBeLessThanOrEqual(1);
            expect(Math.abs(upper - grand)).toBeLessThanOrEqual(1);
        });
    }

    /** Centre x of every key badge, per display row. */
    async function keyColumns(page) {
        return page.evaluate(() => [...document.querySelectorAll('#phase-counting table')]
            .map(t => [...t.querySelectorAll('kbd')].map(k => {
                const r = k.getBoundingClientRect();
                return { key: k.textContent.trim(), x: Math.round(r.x + r.width / 2) };
            })));
    }

    test('VV-SYS-215: A keyboard-row profile puts each cell above its own key', async ({ page }) => {
        // mdc-2015-9 assigns A S D F over Z X C V B, so column N of each row is
        // the same finger and the screen mirrors the hand. Core.keyboardGrid
        // decides this; here it is confirmed to reach the rendered page.
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/counter.html');
        await loadLegacyMdc(page);
        await countAcross(page);

        const [upper, lower] = await keyColumns(page);
        expect(upper.map(k => k.key)).toEqual(['A', 'S', 'D', 'F']);
        expect(lower.map(k => k.key)).toEqual(['Z', 'X', 'C', 'V', 'B']);
        // A over Z, S over X, D over C, F over V.
        for (let i = 0; i < upper.length; i++) {
            expect(Math.abs(upper[i].x - lower[i].x),
                `${upper[i].key} should sit above ${lower[i].key}`).toBeLessThanOrEqual(1);
        }
        // B has no key above it, and the row does not stretch to close the gap.
        expect(lower[4].x).toBeGreaterThan(upper[3].x + 40);
    });

    test('VV-SYS-216: A frequency-assigned profile is not forced onto that grid', async ({ page }) => {
        /**
         * 10-Type — Bands & Segs Separate assigns keys by frequency, not by keyboard row, and
         * splits 4 above / 6 below — the case where forcing a shared grid
         * empties a third of the upper row and stops its rule mid-table.
         *
         * This profile, not the shipped default: the default splits 7/7, so a
         * "the rows differ" assertion is vacuous there. The first version of
         * this test used it and passed even with every profile forced onto the
         * grid, which is no test at all.
         */
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/counter.html');
        await page.click('text=Preset Profiles');
        const ok = await page.evaluate(() => {
            for (const b of document.querySelectorAll('button')) {
                if (b.textContent.trim() !== 'Load') continue;
                let row = b.parentElement;
                while (row && !row.textContent.includes('10-Type — Bands & Segs Separate')) row = row.parentElement;
                if (row && row.querySelectorAll('button').length <= 2) { b.click(); return true; }
            }
            return false;
        });
        expect(ok).toBe(true);
        const overlay = page.locator('#modal-overlay');
        await expect(overlay).toContainText('10-Type — Bands & Segs Separate');
        await overlay.getByRole('button', { name: 'OK' }).click();
        await expect(overlay).toBeHidden();
        await countAcross(page);

        const [upper, lower] = await keyColumns(page);
        expect(upper.length).toBe(4);
        expect(lower.length).toBe(6);
        // Each row fills the width on its own, so no key sits above another.
        for (const u of upper) {
            for (const l of lower) {
                expect(Math.abs(u.x - l.x),
                    `${u.key} and ${l.key} share a column, but this profile's keys ` +
                    'follow no keyboard row — the alignment would mean nothing').toBeGreaterThan(1);
            }
        }
        // The totals column stays aligned regardless — that is the column
        // whose alignment carries meaning.
        const su = await centre(page, '#val-sub-upper');
        const sl = await centre(page, '#val-sub-lower');
        expect(Math.abs(su - sl)).toBeLessThanOrEqual(1);
    });

    test('VV-SYS-214: An uneven split still shares the axis', async ({ page }) => {
        // The 2015 layout is 4 above and 5 below — the shape that made the
        // misalignment visible in the first place.
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/counter.html');
        await page.click('text=Preset Profiles');
        const clicked = await page.evaluate(() => {
            for (const btn of document.querySelectorAll('button')) {
                if (btn.textContent.trim() !== 'Load') continue;
                let row = btn.parentElement;
                while (row && !row.textContent.includes('9-Type — 2015 Counter Layout')) row = row.parentElement;
                if (row && row.querySelectorAll('button').length <= 2) { btn.click(); return true; }
            }
            return false;
        });
        expect(clicked).toBe(true);
        const overlay = page.locator('#modal-overlay');
        await expect(overlay).toContainText('9-Type — 2015 Counter Layout');
        await overlay.getByRole('button', { name: 'OK' }).click();
        await expect(overlay).toBeHidden();

        await countAcross(page);
        const upper = await centre(page, '#val-sub-upper');
        const lower = await centre(page, '#val-sub-lower');
        const grand = await centre(page, '#val-grand-total');
        expect(Math.abs(upper - lower)).toBeLessThanOrEqual(1);
        expect(Math.abs(upper - grand)).toBeLessThanOrEqual(1);

        // And the derived formula reports in the same column. The element is
        // `val-formula-<name>`; `[id^="formula-"]` matched nothing and the
        // measurement blocked until the test timed out.
        const me = await centre(page, '[id^="val-formula-"]');
        expect(me, 'The 2015 layout defines an M:E ratio, so it must be measurable').not.toBeNull();
        expect(Math.abs(upper - me)).toBeLessThanOrEqual(1);
    });
});

// ================================================================
test.describe('Audio modes (URS-108)', () => {

    /**
     * Three modes, cycled from one control and persisted for the session.
     * jsdom covers what each mode requests; only a real browser covers the
     * control, the label and sessionStorage surviving a reload.
     */
    test('VV-SYS-222: The control cycles three modes and the choice survives a reload', async ({ page }) => {
        await page.goto('/counter.html');
        const label = page.locator('#audioLabel');

        // The shipped default is the click, so nothing changes for an
        // operator who never touches the control.
        await expect(label).toHaveText('Click');

        await page.click('#btnToggleAudio');
        await expect(label).toHaveText('Tones');

        await page.reload();
        await expect(label).toHaveText('Tones');

        await page.click('#btnToggleAudio');
        await expect(label).toHaveText('Sound Off');
        await page.reload();
        await expect(label).toHaveText('Sound Off');

        // Back round to the start.
        await page.click('#btnToggleAudio');
        await expect(label).toHaveText('Click');
    });

    test('VV-SYS-223: Counting is unaffected by the audio mode', async ({ page }) => {
        // HA-108: audio is supplementary. Whatever the mode, the count is the
        // count — so an operator who loses audio loses nothing they relied on.
        const totals = [];
        for (const mode of ['off', 'click', 'tones']) {
            // The mode is seeded rather than cycled with the control: counting
            // and then reloading raises the interrupted-count recovery prompt,
            // which covers the toggle and made this time out rather than fail.
            await page.addInitScript(m => {
                sessionStorage.setItem('wbcds_audio', m);
                localStorage.removeItem('wbcds_autosave');
            }, mode);
            await page.goto('/counter.html');
            await page.click('#btnStartCount');
            for (const k of ['a', 's', 'd']) {
                for (let i = 0; i < 4; i++) await page.keyboard.press(k);
            }
            totals.push(await page.locator('#val-grand-total').innerText());
        }
        expect(new Set(totals).size).toBe(1);
        expect(totals[0]).toBe('12');
    });
});
