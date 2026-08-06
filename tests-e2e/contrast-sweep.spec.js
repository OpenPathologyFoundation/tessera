/**
 * E2E SUITE: Full-Surface Contrast Sweep
 * =======================================
 * Traces to: URS-095 (light and dark presentation themes)
 * VV Protocol: VV-SYS-162 onward
 * Hazard: RA-001 HA-098 (a clinical advisory displayed but not readable)
 *
 * WHY THIS EXISTS SEPARATELY FROM VV-SYS-160/161
 *
 * VV-SYS-160 and 161 measure named regions — the threshold advisory, the
 * low-count note, the counting grid. They were written after a real defect in
 * exactly those places and they do catch it. But a selector list only ever
 * checks what somebody thought to list, and the theme rules live in one
 * stylesheet shared by every page. When that stylesheet was first consolidated
 * this sweep found 330 further failures on surfaces nobody had listed:
 * keyboard-map labels at 1.93:1, documentation-page body text, the whole
 * configuration editor, and both primary action buttons — whose white-on-amber
 * and white-on-emerald labels failed in *both* themes and so would never have
 * been caught by a light-theme-only check.
 *
 * So this walks every text node on every page in every phase, in both themes,
 * and asserts WCAG AA. Adding a page or a control cannot quietly opt out.
 *
 * WHAT IT MEASURES
 *
 * The rendered result, not the source. Semi-transparent backgrounds are
 * composited down the ancestor chain to the page colour, because the advisory
 * panels are a 10% tint over the body — reading the declared colour alone
 * reports a passing ratio for text that is in fact illegible.
 *
 * Thresholds are the WCAG AA values: 4.5:1 for body text, 3:1 for large text
 * (>=24px, or >=18.66px bold), selected per element from its computed style.
 *
 * SERVICE WORKER
 *
 * Blocked. The application caches its own shell for offline use (URS-090), so
 * a run against a warm cache measures whatever CSS was cached rather than what
 * is on disk. That is not hypothetical: during development this sweep reported
 * 28 stale failures in the configuration editor that did not exist in the
 * served files.
 */
const { test, expect } = require('@playwright/test');

/**
 * Every text-bearing leaf element on the page, with its contrast ratio against
 * its effective (composited) background and the AA threshold that applies to
 * it. Returns only the failures.
 */
async function sweep(page) {
    return page.evaluate(() => {
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
        // Composite every background in the ancestor chain onto white.
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
            return (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);
        };

        const bad = [];
        for (const el of document.querySelectorAll('body *')) {
            // Leaf elements only: a container's colour is not what renders.
            if (el.children.length) continue;
            const t = (el.textContent || '').trim();
            if (!t) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
            const box = el.getBoundingClientRect();
            if (box.width < 1 || box.height < 1) continue;
            const fg = px(cs.color);
            if (!fg || fg.a === 0) continue;

            const size = parseFloat(cs.fontSize);
            const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
            const need = large ? 3.0 : 4.5;
            const r = ratio(fg, effBg(el));
            if (r < need) {
                bad.push({
                    text: t.slice(0, 45), ratio: Number(r.toFixed(2)), need,
                    color: cs.color, className: String(el.className).slice(0, 60)
                });
            }
        }
        return bad;
    });
}

const press = async (page, key, n) => { for (let i = 0; i < n; i++) await page.keyboard.press(key); };

/**
 * A count that puts the results screen into its most decorated state: plasma
 * cells straddling the 10% threshold (amber advisory) on a 300-cell total
 * (amber sub-target note). Those are the two panels that failed for real.
 */
async function countToAdvisories(page) {
    await page.fill('#caseNumber', 'S25-CONTRAST');
    await page.click('#btnStartCount');
    await expect(page.locator('#phase-counting')).toBeVisible();
    await press(page, 'e', 26);
    await press(page, 'f', 274);
}

const SURFACES = [
    { id: 'VV-SYS-162', page: 'counter.html', name: 'counter — case entry' },
    {
        id: 'VV-SYS-163', page: 'counter.html', name: 'counter — counting',
        setup: countToAdvisories
    },
    {
        id: 'VV-SYS-164', page: 'counter.html', name: 'counter — results',
        setup: async page => {
            await countToAdvisories(page);
            await page.click('#btnCountDone');
            await expect(page.locator('#threshold-note')).toBeVisible();
            await expect(page.locator('#low-count-note')).toBeVisible();
        }
    },
    { id: 'VV-SYS-165', page: 'methods.html', name: 'methods and limitations' },
    { id: 'VV-SYS-166', page: 'calculation-reference.html', name: 'calculation reference' },
    { id: 'VV-SYS-167', page: 'help.html', name: 'quick start guide' },
    { id: 'VV-SYS-168', page: 'editor.html', name: 'configuration editor' },
    {
        id: 'VV-SYS-169', page: 'editor.html', name: 'dialog, with validation errors shown',
        setup: async page => {
            // The dialog is a surface in its own right — its own panel colour,
            // its own hint and error tones — and none of it is on screen until
            // something opens it. Errors are provoked deliberately: red-on-panel
            // is the pairing most likely to fail, and it only ever renders here.
            await page.click('#btnAddSpecimen');
            await expect(page.locator('#modal-box')).toBeVisible();
            await page.fill('#modal-field-0', 'Not An Id');
            await page.click('#modal-confirm');
            await expect(page.locator('#modal-field-error-0')).toBeVisible();

            // Take the pointer off the button that was just clicked. This
            // sweep measures RESTING colours; leaving the mouse on the confirm
            // button caught it mid-hover-transition and reported an
            // intermediate 4.15:1 that is neither state. Hover is measured
            // deliberately, and settled, by VV-SYS-177/178.
            await page.mouse.move(0, 0);

            // The panel fades in over 300ms, and the hover transition needs to
            // unwind. Measuring either mid-flight reads a composited value
            // rather than the settled colour.
            await page.waitForFunction(() =>
                getComputedStyle(document.getElementById('modal-box')).opacity === '1');
            await page.waitForFunction(() =>
                getComputedStyle(document.getElementById('modal-confirm')).backgroundColor
                    === 'rgb(37, 99, 235)');
        }
    }
];

// Service workers off: measure the files on disk, not the offline cache.
test.use({ serviceWorkers: 'block' });

for (const theme of ['dark', 'light']) {
    test.describe(`Full-surface contrast — ${theme} theme (URS-095)`, () => {
        for (const surface of SURFACES) {
            test(`${surface.id} (${theme}): ${surface.name} meets WCAG AA`, async ({ page }) => {
                // The theme is read from sessionStorage at load, so it must be
                // set on the origin before the page under test is fetched.
                await page.goto('/counter.html');
                await page.evaluate(t => sessionStorage.setItem('wbcds_theme', t), theme);

                await page.goto('/' + surface.page);
                // Pages that run the app wait for the profile; static pages do not.
                await page.waitForFunction(() =>
                    !window.__wbcTestHooks ||
                    window.__wbcTestHooks.state.configMeta ||
                    document.getElementById('config-error'));

                if (surface.setup) await surface.setup(page);

                const bad = await sweep(page);
                expect(bad,
                    `${bad.length} element(s) below WCAG AA on ${surface.page} ` +
                    `(${theme} theme):\n` + JSON.stringify(bad, null, 1)
                ).toEqual([]);
            });
        }
    });
}
