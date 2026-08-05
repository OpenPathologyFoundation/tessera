// @ts-check
/**
 * Playwright configuration — WBC ΔΣ system-level verification.
 *
 * Runs the E2E specs against the application as actually deployed: served by
 * serve.js over HTTP in a real Chromium browser. This is the only layer that
 * exercises the genuine browser APIs the application depends on (Clipboard,
 * Web Audio, service worker, localStorage/sessionStorage, printing) and the
 * real network fetch of the configuration profile.
 *
 * Node's built-in runner (`npm test`) covers units and jsdom behaviour;
 * `npm run test:e2e` covers the deployed system.
 */
const { defineConfig, devices } = require('@playwright/test');

const PORT = process.env.WBCDS_E2E_PORT || 8390;
const BASE_URL = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
    testDir: './tests-e2e',
    // Counting is order-sensitive within a spec but specs are independent.
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    timeout: 30_000,
    expect: { timeout: 5_000 },

    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off'
    },

    // URS-093: Chrome, Firefox and Edge without plugins. Edge shares the
    // Chromium engine and is covered by the chromium project.
    //
    // Clipboard permissions are a Chromium-only capability in Playwright, so
    // the clipboard read-back assertion (VV-SYS-070) is guarded inside the spec
    // rather than granted here; the copy control itself is still exercised on
    // every engine.
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                permissions: ['clipboard-read', 'clipboard-write']
            }
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] }
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] }
        }
    ],

    webServer: {
        command: `node serve.js`,
        url: BASE_URL,
        env: { PORT: String(PORT) },
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
    }
});
