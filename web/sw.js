/**
 * WBC ΔΣ — Service Worker
 * ========================
 * Implements: URS-093, URS-094 (no internet connection required for counting
 * operations after the initial load), SYS-I04.
 *
 * Strategy
 *   - App shell (HTML, scripts, vendored Tailwind): cache-first. These are
 *     versioned with the cache name, so a deployment bump replaces them
 *     wholesale.
 *   - Configuration profiles (templates.json, presets): network-first with a
 *     cache fallback. The application's own version check needs to see a newer
 *     shipped profile when the network is available, but must still boot from
 *     the last known copy when it is not.
 *   - Anything cross-origin (webfonts): cached opportunistically, never
 *     required. A miss degrades to the local font stack.
 *
 * Bump CACHE_VERSION on every release so stale assets cannot survive.
 */
'use strict';

const CACHE_VERSION = 'wbcds-v2.1.0';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const DATA_CACHE = CACHE_VERSION + '-data';

const SHELL_ASSETS = [
    './',
    './counter.html',
    './editor.html',
    './help.html',
    './vendor/tailwind.js',
    './scripts/wbc-core.js',
    './scripts/mdc-app.js',
    './scripts/config-editor.js'
];

// Profiles are data, not shell: always try the network first.
function isConfigRequest(url) {
    return url.pathname.includes('/settings/');
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            // addAll is atomic; a single 404 would leave the app uncached, so
            // each asset is added independently and best-effort.
            .then((cache) => Promise.all(
                SHELL_ASSETS.map((asset) => cache.add(asset).catch(() => null))
            ))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names
                    .filter((n) => n.indexOf(CACHE_VERSION) !== 0)
                    .map((n) => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    let url;
    try {
        url = new URL(req.url);
    } catch (e) {
        return;
    }

    // Cross-origin (webfonts): opportunistic cache, never blocking.
    if (url.origin !== self.location.origin) {
        event.respondWith(
            caches.match(req).then((hit) => hit || fetch(req).then((resp) => {
                if (resp && resp.ok) {
                    const copy = resp.clone();
                    caches.open(DATA_CACHE).then((c) => c.put(req, copy));
                }
                return resp;
            }).catch(() => hit))
        );
        return;
    }

    // Configuration profiles: network-first so a corrected profile is seen.
    if (isConfigRequest(url)) {
        event.respondWith(
            fetch(req).then((resp) => {
                if (resp && resp.ok) {
                    const copy = resp.clone();
                    caches.open(DATA_CACHE).then((c) => c.put(req, copy));
                }
                return resp;
            }).catch(() => caches.match(req))
        );
        return;
    }

    // App shell: cache-first, refresh in the background.
    event.respondWith(
        caches.match(req).then((hit) => {
            const network = fetch(req).then((resp) => {
                if (resp && resp.ok) {
                    const copy = resp.clone();
                    caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
                }
                return resp;
            }).catch(() => hit);
            return hit || network;
        })
    );
});
