/**
 * E2E SUITE: Hover-State Contrast
 * ================================
 * Traces to: URS-095, SRS-001 SYS-113
 * VV Protocol: VV-SYS-177 onward
 *
 * The full-surface sweep (VV-SYS-162..169) measures every text node in its
 * RESTING state. It found and closed 330 defects there, but a control changes
 * colour under the pointer and nothing measured that.
 *
 * It matters: every primary button in the product is `bg-blue-600` with
 * `hover:bg-blue-500` and white text. At rest that is 5.17:1 and passes; under
 * the pointer it becomes 3.68:1 and does not. This was found only because the
 * dialog sweep caught the button mid-transition at 4.15:1 and the intermediate
 * value was traced back.
 *
 * Rather than model what a hover rule resolves to — which would have to
 * re-implement the cascade, and got the theme pairings wrong when attempted by
 * hand — this hovers each control for real and reads the settled colour.
 * `transition-colors` means the value is only true once it stops moving, so
 * each measurement waits for two consecutive identical reads.
 */
const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

const CONTRAST = `(el) => {
    const px = s => {
        const m = String(s).match(/rgba?\\(([^)]+)\\)/);
        if (!m) return null;
        const a = m[1].split(',').map(parseFloat);
        return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 };
    };
    const over = (f, b) => ({
        r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a),
        b: f.b * f.a + b.b * (1 - f.a), a: 1
    });
    const effBg = node => {
        const stack = [];
        for (let e = node; e; e = e.parentElement) {
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

    // The label may be the control itself or a child (icon + span).
    const carriers = el.children.length
        ? [...el.querySelectorAll('*')].filter(n => !n.children.length && (n.textContent || '').trim())
        : [el];
    const out = [];
    for (const node of carriers) {
        const cs = getComputedStyle(node);
        const text = (node.textContent || '').trim();
        if (!text) continue;
        const fg = px(cs.color);
        if (!fg || fg.a === 0) continue;
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
        out.push({
            text: text.slice(0, 40), need: large ? 3.0 : 4.5,
            ratio: Number(ratio(fg, effBg(node)).toFixed(2)),
            fg: cs.color, bg: getComputedStyle(el).backgroundColor
        });
    }
    return out;
}`;

/** Hover, then wait until the background stops moving (transition-colors). */
async function hoverSettled(page, handle) {
    await handle.hover();
    let last = null;
    for (let i = 0; i < 25; i++) {
        const now = await handle.evaluate(el => getComputedStyle(el).backgroundColor);
        if (now === last) return;
        last = now;
        await page.waitForTimeout(40);
    }
}

async function checkHoverStates(page) {
    const controls = await page.$$('[class*="hover:bg-"]');
    const failures = [];
    for (const handle of controls) {
        if (!(await handle.isVisible())) continue;
        const box = await handle.boundingBox();
        if (!box || box.width < 2 || box.height < 2) continue;
        await hoverSettled(page, handle);
        const results = await handle.evaluate(eval(`(${CONTRAST})`));
        for (const r of results) {
            if (r.ratio < r.need) failures.push(r);
        }
    }
    // The same control class appears many times; report each distinct pairing.
    const seen = new Set();
    return failures.filter(f => {
        const key = `${f.text}|${f.fg}|${f.bg}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

const PAGES = [
    { id: 'VV-SYS-177', page: 'counter.html', name: 'counter' },
    { id: 'VV-SYS-178', page: 'editor.html', name: 'configuration editor' }
];

for (const theme of ['dark', 'light']) {
    test.describe(`Hover-state contrast — ${theme} theme (SYS-113)`, () => {
        for (const surface of PAGES) {
            test(`${surface.id} (${theme}): ${surface.name} controls meet AA under the pointer`, async ({ page }) => {
                await page.goto('/counter.html');
                await page.evaluate(t => sessionStorage.setItem('wbcds_theme', t), theme);
                await page.goto('/' + surface.page);
                await page.waitForFunction(() =>
                    !window.__wbcTestHooks || window.__wbcTestHooks.state.configMeta
                    || document.getElementById('config-error'));
                await page.waitForTimeout(300);

                const bad = await checkHoverStates(page);
                expect(bad,
                    `${bad.length} hovered control(s) below WCAG AA on ${surface.page} ` +
                    `(${theme} theme):\n` + JSON.stringify(bad, null, 1)
                ).toEqual([]);
            });
        }
    });
}
