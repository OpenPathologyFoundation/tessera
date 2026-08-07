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
 *   - Cross-origin: nothing. The webfonts were the only external request and
 *     are self-hosted since v2.17.0, so an air-gapped workstation renders
 *     identically to a connected one. SC-060 fails the build if a page
 *     acquires a new one.
 *
 * Bump CACHE_VERSION on every release so stale assets cannot survive.
 */
'use strict';

// v2.3.0 — the shared dialog widget, plus the shared visual primitives it
// depends on moving into theme.css. Both are shell assets, so an installed
// browser keeps serving the old ones until this string changes: without the
// bump the editor would load a cached page that still calls prompt().
//
// v2.2.0 — shared theme stylesheet and the move of data-theme onto <html>.
// v2.18.0 — Inter's greek subset, for the Δ and Σ in the product's own name.
//
// v2.17.0 — webfonts self-hosted. The cache key MUST change: an installed
// browser would otherwise keep serving pages that still <link> to Google's
// CDN, so the very workstation the change is for would not receive it.
const CACHE_VERSION = 'wbcds-v2.19.1';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const DATA_CACHE = CACHE_VERSION + '-data';

const SHELL_ASSETS = [
    './',
    './counter.html',
    './editor.html',
    './help.html',
    './methods.html',
    './calculation-reference.html',
    './vendor/tailwind.js',
    // Self-hosted webfonts. Precached rather than cached on demand: a
    // workstation that has never reached the network is the case URS-094
    // exists for, and it must get the real typeface on first load.
    './vendor/fonts/fonts.css',
    './vendor/fonts/inter-latin.woff2',
    './vendor/fonts/inter-greek.woff2',
    './vendor/fonts/inter-latin-ext.woff2',
    './vendor/fonts/jetbrains-mono-latin.woff2',
    './vendor/fonts/jetbrains-mono-latin-ext.woff2',
    './vendor/fonts/libre-franklin-latin.woff2',
    './vendor/fonts/libre-franklin-latin-ext.woff2',
    './styles/theme.css',
    './scripts/wbc-core.js',
    './scripts/wbc-dialog.js',
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

    // Cross-origin: not handled, because there is none. The webfonts were the
    // only external request and are served from ./vendor/fonts since v2.17.0.
    // Anything cross-origin that appears here is unintended, so it is left to
    // the network rather than quietly cached into the offline shell — a
    // silently cached third-party request is how an air-gap claim stops being
    // true without anyone noticing.
    if (url.origin !== self.location.origin) {
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
