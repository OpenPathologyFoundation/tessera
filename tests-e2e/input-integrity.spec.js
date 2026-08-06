/**
 * E2E SUITE: Counting Input Integrity
 * ====================================
 * Traces to: URS-021, URS-022, SRS-001 SYS-030..SYS-039
 * VV Protocol: VV-SYS-180 onward
 * Hazards: RA-001 HA-103 (auto-repeat), HA-104 (undo unreachable)
 *
 * Both defects here were found by independent review, not by this suite, and
 * both are in the INPUT path — which is more likely to produce a wrong
 * clinical number than anything the arithmetic can do.
 *
 * The suite had 7,500 lines of tests, three selectable rounding methods, and
 * no check that a shipped preset could un-count what it counted.
 */
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test.use({ serviceWorkers: 'block' });

const PRESET_DIR = path.join(__dirname, '..', 'web', 'settings', 'presets');

/** Every preset a laboratory can actually select and count with. */
function selectablePresets() {
    return fs.readdirSync(PRESET_DIR)
        .filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'custom.json')
        .map(f => ({ file: f, config: JSON.parse(fs.readFileSync(path.join(PRESET_DIR, f), 'utf-8')) }));
}

/**
 * The character a US keyboard actually produces with Shift held.
 *
 * Playwright's `keyboard.press('Shift+.')` sends key="." with shiftKey=true —
 * it does not apply the layout's shift transformation. A real browser sends
 * key=">". Pressing through Playwright therefore could NOT reproduce this
 * defect: the first version of this test passed against the broken code.
 * These events are dispatched directly so the assertion means something.
 */
const SHIFTED = {
    '.': ['>', 'Period'], ',': ['<', 'Comma'], '/': ['?', 'Slash'], ';': [':', 'Semicolon'],
    "'": ['"', 'Quote'], '[': ['{', 'BracketLeft'], ']': ['}', 'BracketRight'],
    '-': ['_', 'Minus'], '=': ['+', 'Equal'], '`': ['~', 'Backquote'],
    '1': ['!', 'Digit1'], '2': ['@', 'Digit2'], '3': ['#', 'Digit3'], '4': ['$', 'Digit4'],
    '5': ['%', 'Digit5'], '6': ['^', 'Digit6'], '7': ['&', 'Digit7'], '8': ['*', 'Digit8'],
    '9': ['(', 'Digit9'], '0': [')', 'Digit0']
};

/** Press `key` with Shift, as the operator's own keyboard would report it. */
async function shiftPress(page, key) {
    const mapped = SHIFTED[key];
    const shiftedKey = mapped ? mapped[0] : key.toUpperCase();
    const code = mapped ? mapped[1] : (/^[A-Za-z]$/.test(key) ? 'Key' + key.toUpperCase() : '');
    await page.evaluate(([k, c]) => {
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: k, code: c, shiftKey: true, bubbles: true, cancelable: true
        }));
    }, [shiftedKey, code]);
}

async function loadProfile(page, config) {
    await page.goto('/counter.html');
    await page.waitForFunction(() => !!(window.__wbcTestHooks && window.__wbcTestHooks.state.configMeta));
    await page.evaluate(cfg => {
        sessionStorage.clear();
        localStorage.setItem('wbcds_config', JSON.stringify(cfg));
    }, config);
    await page.goto('/counter.html');
    await page.waitForFunction(() => !!(window.__wbcTestHooks && window.__wbcTestHooks.state.configMeta));
}

// ================================================================
test.describe('Every shipped preset can un-count what it counts (SYS-032)', () => {

    /**
     * The `right-hand` preset maps ".", ",", "/" and ";" to blasts,
     * metamyelocytes, basophils and monocytes. Undo is Shift+key, and on a US
     * layout Shift+"." produces ">", which is in no mapping — so the handler
     * returned before decrementing and those four categories could not be
     * corrected at all. Blasts are the category most likely to need it.
     *
     * There is no error and no sound; the count simply does not change.
     */
    for (const { file, config } of selectablePresets()) {
        test(`VV-SYS-180 (${file}): every mapped key increments and decrements`, async ({ page }) => {
            await loadProfile(page, config);

            for (const spec of config.specimenTypes) {
                const options = await page.locator('#specimenType option').evaluateAll(
                    els => els.map(e => e.value));
                if (!options.includes(spec.specimenType)) continue;
                await page.selectOption('#specimenType', spec.specimenType);
                await page.click('#btnStartCount');

                for (const [key, cellType] of Object.entries(spec.outCodes)) {
                    await page.keyboard.press(key);
                    const afterUp = await page.evaluate(
                        ct => window.__wbcTestHooks.state.counts[ct], cellType);
                    expect(afterUp,
                        `${file} (${spec.specimenType}): "${key}" did not increment ${cellType}`
                    ).toBe(1);

                    // Undo is Shift+key. This is the assertion that was missing.
                    await shiftPress(page, key);
                    const afterDown = await page.evaluate(
                        ct => window.__wbcTestHooks.state.counts[ct], cellType);
                    expect(afterDown,
                        `${file} (${spec.specimenType}): Shift+"${key}" did not decrement ` +
                        `${cellType} — the operator cannot correct this category`
                    ).toBe(0);
                }

                await page.evaluate(() => window.__wbcTestHooks.resetToStart());
                await expect(page.locator('#phase-case-entry')).toBeVisible();
            }
        });
    }
});

// ================================================================
test.describe('Auto-repeat does not inflate a count (SYS-030)', () => {

    test('VV-SYS-181: A held key adds one cell, not one per repeat', async ({ page }) => {
        await page.goto('/counter.html');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await page.fill('#caseNumber', 'S25-REPEAT');
        await page.click('#btnStartCount');

        // A real held key: one keydown, then repeats. Nothing in the interface
        // distinguishes ~30 repeats a second from deliberate counting, and at a
        // 200-500 cell target a two-second stuck key is a material miscount.
        await page.evaluate(() => {
            const fire = repeat => document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'f', code: 'KeyF', repeat: repeat, bubbles: true, cancelable: true
            }));
            fire(false);
            for (let i = 0; i < 40; i++) fire(true);
        });

        expect(await page.evaluate(() => window.__wbcTestHooks.state.counts.poly),
            'auto-repeat was counted as deliberate keystrokes').toBe(1);
    });

    test('VV-SYS-182: Keystrokes composed by an input method do not count', async ({ page }) => {
        await page.goto('/counter.html');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await page.click('#btnStartCount');
        await page.evaluate(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'f', code: 'KeyF', isComposing: true, bubbles: true, cancelable: true
            }));
        });
        expect(await page.evaluate(() => window.__wbcTestHooks.state.counts.poly)).toBe(0);
    });
});

// ================================================================
test.describe('An acknowledgement runs however it is dismissed (SYS-247)', () => {

    test('VV-SYS-183: Escape on an alert still runs its continuation', async ({ page }) => {
        // The "Configuration Updated" alert chains to interrupted-count
        // recovery. Escape closed the alert without running the continuation,
        // so the offer to restore a count was silently skipped. An alert has
        // one outcome — it has been read — so both paths must do the same.
        await page.goto('/counter.html');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await page.fill('#caseNumber', 'S25-CHAIN');
        await page.click('#btnStartCount');
        for (let i = 0; i < 9; i++) await page.keyboard.press('f');
        await page.waitForTimeout(400);

        // Force the supersede path so the alert fires ahead of recovery.
        await page.evaluate(() => {
            const c = JSON.parse(localStorage.getItem('wbcds_config'));
            c.version = '0.1';
            localStorage.setItem('wbcds_config', JSON.stringify(c));
        });
        await page.reload();
        await expect(page.locator('#modal-title')).toHaveText('Configuration Updated');

        await page.keyboard.press('Escape');
        await expect(page.locator('#modal-title')).toHaveText('Recover Interrupted Count');
        await page.click('#modal-confirm');
        await expect(page.locator('#val-poly')).toHaveText('9');
    });
});

// ================================================================
test.describe('Crash-recovery snapshot is bounded (URS-080)', () => {

    test('VV-SYS-184: A stale autosave is discarded rather than resurrected', async ({ page }) => {
        // The snapshot carries the accession number and the morphology
        // comments, so it is patient data at rest on a possibly shared
        // workstation. It exists to survive an interruption, not to persist.
        await page.goto('/counter.html');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await page.fill('#caseNumber', 'S25-STALE');
        await page.click('#btnStartCount');
        for (let i = 0; i < 5; i++) await page.keyboard.press('f');
        await page.waitForTimeout(400);

        // Age it past the limit.
        await page.evaluate(() => {
            const d = JSON.parse(localStorage.getItem('wbcds_autosave'));
            d.timestamp = new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString();
            localStorage.setItem('wbcds_autosave', JSON.stringify(d));
        });
        await page.reload();
        await expect(page.locator('#phase-case-entry')).toBeVisible();

        const modalShown = await page.evaluate(() => {
            const o = document.getElementById('modal-overlay');
            return !!(o && !o.classList.contains('hidden'));
        });
        expect(modalShown, 'a 13-hour-old count was offered for recovery').toBe(false);
        expect(await page.evaluate(() => localStorage.getItem('wbcds_autosave')),
            'the stale snapshot was left on the workstation').toBeNull();
    });

    test('VV-SYS-185: A recent autosave is still offered', async ({ page }) => {
        await page.goto('/counter.html');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await page.fill('#caseNumber', 'S25-FRESH');
        await page.click('#btnStartCount');
        for (let i = 0; i < 5; i++) await page.keyboard.press('f');
        await page.waitForTimeout(400);
        await page.reload();
        await expect(page.locator('#modal-title')).toHaveText('Recover Interrupted Count');
    });
});
