/**
 * E2E SUITE: Dialogs
 * ===================
 * Traces to: URS-102, URS-092
 * VV Protocol: VV-SYS-170 onward
 * Requirements: SYS-244 to SYS-247 (DCR-014)
 *
 * The configuration editor asked for a specimen type identifier and a
 * derived-figure name with the browser's own `prompt()`. A native dialog
 * ignores the selected theme, cannot show a hint or a validation message,
 * cannot refuse bad input except by reopening itself, and suspends the page
 * while it is open. Two of the three prompts asked for identifiers with rules
 * — lower case, no spaces, not already taken — that a prompt cannot express.
 *
 * Every one is now the product's own dialog, shared with the counter.
 *
 * The load-bearing assertion in this file is the `page.on('dialog')` guard:
 * Playwright auto-dismisses native dialogs, so a `prompt()` that crept back in
 * would silently return null and the feature would simply do nothing rather
 * than fail visibly. Registering a listener that fails the test is the only
 * way to catch it.
 */
const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

/** Fail loudly if any native browser dialog is raised. */
function forbidNativeDialogs(page, seen) {
    page.on('dialog', async (dialog) => {
        seen.push(`${dialog.type()}: ${dialog.message()}`);
        await dialog.dismiss();
    });
}

async function openEditor(page) {
    await page.goto('/counter.html');
    await page.waitForFunction(() => !!(window.__wbcTestHooks && window.__wbcTestHooks.state.configMeta));
    await page.goto('/editor.html');
    await expect(page.locator('#policy-editor')).toBeVisible();
}

// ================================================================
test.describe('Dialogs replace native browser prompts (SYS-244)', () => {

    test('VV-SYS-170: Adding a specimen type uses the product dialog, not a browser prompt', async ({ page }) => {
        const native = [];
        forbidNativeDialogs(page, native);
        await openEditor(page);

        await page.click('#btnAddSpecimen');

        const box = page.locator('#modal-box');
        await expect(box).toBeVisible();
        await expect(page.locator('#modal-title')).toHaveText('Add Specimen Type');
        // Both values are asked for at once. The prompts were chained, so
        // cancelling the second left the first already typed and discarded.
        await expect(page.locator('#modal-field-0')).toBeVisible();
        await expect(page.locator('#modal-field-1')).toBeVisible();
        // The rules and the identifiers already in use are stated, which a
        // prompt has no way to show.
        await expect(page.locator('#modal-fields')).toContainText('Already in use: bm, pb');

        await page.fill('#modal-field-0', 'bf');
        await page.fill('#modal-field-1', 'Body Fluid');
        await page.click('#modal-confirm');

        await expect(box).toBeHidden();
        await expect(page.locator('#specimen-tabs')).toContainText('Body Fluid');
        expect(native, 'a native browser dialog was raised').toEqual([]);
    });

    test('VV-SYS-171: Adding a derived figure uses the product dialog', async ({ page }) => {
        const native = [];
        forbidNativeDialogs(page, native);
        await openEditor(page);

        await page.click('#pol-f-add');
        await expect(page.locator('#modal-title')).toHaveText('Add Derived Figure');
        await expect(page.locator('#modal-fields')).toContainText('Already defined: ME_ratio');

        await page.fill('#modal-field-0', 'blast_pct');
        await page.fill('#modal-field-1', 'Blasts of non-erythroid');
        await page.click('#modal-confirm');

        await expect(page.locator('#modal-box')).toBeHidden();
        await expect(page.locator('#policy-editor')).toContainText('blast_pct');
        expect(native).toEqual([]);
    });

    test('VV-SYS-172: Invalid input is refused with a reason, and the dialog stays open', async ({ page }) => {
        await openEditor(page);
        await page.click('#btnAddSpecimen');

        // A prompt accepted this and produced a profile that misbehaved later.
        await page.fill('#modal-field-0', 'Body Fluid');
        await page.click('#modal-confirm');

        await expect(page.locator('#modal-box')).toBeVisible();
        await expect(page.locator('#modal-field-error-0')).toBeVisible();
        await expect(page.locator('#modal-field-error-0')).toContainText('Start with a letter');
        await expect(page.locator('#modal-field-0')).toHaveAttribute('aria-invalid', 'true');
        // The empty second field is reported at the same time, not one at a time.
        await expect(page.locator('#modal-field-error-1')).toContainText('required');
        // Nothing was created.
        await expect(page.locator('#specimen-tabs')).not.toContainText('Body Fluid');

        // An identifier already in use is refused too.
        await page.fill('#modal-field-0', 'bm');
        await page.fill('#modal-field-1', 'Duplicate');
        await page.click('#modal-confirm');
        await expect(page.locator('#modal-field-error-0')).toContainText('already in use');

        // Correcting it clears the error and proceeds.
        await page.fill('#modal-field-0', 'bf');
        await page.click('#modal-confirm');
        await expect(page.locator('#modal-box')).toBeHidden();
        await expect(page.locator('#specimen-tabs')).toContainText('Duplicate');
    });

    test('VV-SYS-173: Enter confirms, Escape cancels, focus is placed and restored', async ({ page }) => {
        await openEditor(page);
        const trigger = page.locator('#btnAddSpecimen');
        // Opened from the keyboard, which is the case where restoring focus
        // matters: a keyboard user who cancels must land back where they were
        // rather than at the top of the document. Opening by mouse is not
        // equivalent — WebKit blurs a button on mousedown, so "where focus
        // was" is genuinely <body> there, and restoring to it is correct.
        await trigger.focus();
        await trigger.press('Enter');

        // Focus lands on the first field without the operator reaching for it.
        await expect(page.locator('#modal-field-0')).toBeFocused();

        // Escape cancels, and focus returns to the control that opened it.
        await page.keyboard.press('Escape');
        await expect(page.locator('#modal-box')).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(page.locator('#specimen-tabs')).not.toContainText('Body Fluid');

        // Enter from a field confirms.
        await trigger.press('Enter');
        await page.fill('#modal-field-0', 'bf');
        await page.fill('#modal-field-1', 'Body Fluid');
        await page.locator('#modal-field-1').press('Enter');
        await expect(page.locator('#modal-box')).toBeHidden();
        await expect(page.locator('#specimen-tabs')).toContainText('Body Fluid');
    });

    test('VV-SYS-174: Tab is trapped inside the dialog', async ({ page }) => {
        await openEditor(page);
        await page.click('#btnAddSpecimen');
        await expect(page.locator('#modal-field-0')).toBeFocused();

        // Walk forward past the last control; focus must wrap, not escape to
        // the page behind — where Tab would otherwise land on editor controls
        // the operator cannot see.
        const ids = [];
        for (let i = 0; i < 6; i++) {
            await page.keyboard.press('Tab');
            ids.push(await page.evaluate(() => document.activeElement.id || document.activeElement.tagName));
        }
        const inDialog = await page.evaluate(() =>
            document.getElementById('modal-box').contains(document.activeElement));
        expect(inDialog, `focus left the dialog: ${ids.join(' -> ')}`).toBe(true);
    });
});

// ================================================================
test.describe('A dialog is modal for the keyboard too (SYS-246)', () => {

    test('VV-SYS-175: A counting key pressed while a dialog is open does not count', async ({ page }) => {
        await page.goto('/counter.html');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await page.fill('#caseNumber', 'S25-MODAL');
        await page.click('#btnStartCount');
        for (let i = 0; i < 5; i++) await page.keyboard.press('f');
        await expect(page.locator('#val-poly')).toHaveText('5');

        // Reset opens a confirmation during counting, with focus on a button
        // rather than a field — so the counter's "ignore keys aimed at form
        // controls" guard did not apply and the tally kept moving underneath.
        await page.click('#btnCountReset');
        await expect(page.locator('#modal-title')).toHaveText('Reset Count');
        for (let i = 0; i < 7; i++) await page.keyboard.press('f');
        await expect(page.locator('#val-poly')).toHaveText('5');

        await page.click('#modal-cancel');
        await expect(page.locator('#val-poly')).toHaveText('5');
        // And counting resumes normally once the dialog is gone.
        await page.keyboard.press('f');
        await expect(page.locator('#val-poly')).toHaveText('6');
    });

    test('VV-SYS-176: Escape cannot discard an interrupted count', async ({ page }) => {
        await page.goto('/counter.html');
        await expect(page.locator('#phase-case-entry')).toBeVisible();
        await page.fill('#caseNumber', 'S25-RECOVER');
        await page.click('#btnStartCount');
        for (let i = 0; i < 12; i++) await page.keyboard.press('f');
        await page.waitForTimeout(400);       // let autosave settle

        await page.reload();
        await expect(page.locator('#modal-title')).toHaveText('Recover Interrupted Count');

        // Cancel here means Discard. Escape must not choose it: both branches
        // are consequential, so this dialog is opened non-dismissible.
        await page.keyboard.press('Escape');
        await expect(page.locator('#modal-box')).toBeVisible();
        await expect(page.locator('#modal-title')).toHaveText('Recover Interrupted Count');

        await page.click('#modal-confirm');   // Restore
        await expect(page.locator('#val-poly')).toHaveText('12');
    });
});
