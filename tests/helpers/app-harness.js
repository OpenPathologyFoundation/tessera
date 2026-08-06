/**
 * jsdom harness for the WBC ΔΣ application.
 * =========================================
 *
 * Boots the REAL counter.html together with the REAL wbc-core.js,
 * wbc-dialog.js and mdc-app.js inside jsdom, so behavioural tests exercise
 * shipped code paths —
 * the phase machine, keyboard handler, autosave and DOM rendering — rather
 * than a re-implementation of them. See DCR-004.
 *
 * External resources (Tailwind CDN, Google Fonts) are stripped: they are
 * presentation-only and must not make the verification suite depend on the
 * network.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const WEB = path.join(ROOT, 'web');

const HTML = fs.readFileSync(path.join(WEB, 'counter.html'), 'utf-8');
const CORE_JS = fs.readFileSync(path.join(WEB, 'scripts', 'wbc-core.js'), 'utf-8');
const DIALOG_JS = fs.readFileSync(path.join(WEB, 'scripts', 'wbc-dialog.js'), 'utf-8');
const APP_JS = fs.readFileSync(path.join(WEB, 'scripts', 'mdc-app.js'), 'utf-8');
const DEFAULT_CONFIG = JSON.parse(
    fs.readFileSync(path.join(WEB, 'settings', 'templates.json'), 'utf-8'));

/** Strip every <script> and external <link> so we control what executes. */
function stripScripts(html) {
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<link\b[^>]*>/gi, '');
}

function makeAudioStub(events) {
    function Ctx() {
        this.state = 'running';
        this.currentTime = 0;
    }
    Ctx.prototype.resume = function () {};
    Ctx.prototype.createOscillator = function () {
        return {
            type: '', frequency: { value: 0 },
            connect() {}, start() { events.push('tone'); }, stop() {}
        };
    };
    Ctx.prototype.createGain = function () {
        return {
            gain: { value: 0, exponentialRampToValueAtTime() {} },
            connect() {}
        };
    };
    return Ctx;
}

/**
 * Boot the application.
 *
 * @param {Object}  [opts]
 * @param {Object}  [opts.config]         config served by the mocked fetch
 * @param {boolean} [opts.offline]        make fetch reject (URS-094)
 * @param {Object}  [opts.localStorage]   seed entries before boot
 * @param {Object}  [opts.sessionStorage] seed entries before boot
 * @returns {Promise<Object>} harness
 */
async function boot(opts = {}) {
    const dom = new JSDOM(stripScripts(HTML), {
        runScripts: 'dangerously',
        url: 'http://localhost:8089/counter.html',
        pretendToBeVisual: true
    });

    const w = dom.window;
    const audioEvents = [];
    const downloads = [];
    const printed = { count: 0 };

    // --- environment stubs -------------------------------------------------
    w.AudioContext = makeAudioStub(audioEvents);
    w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
    w.print = () => { printed.count++; };
    w.URL.createObjectURL = (blob) => {
        downloads.push(blob);
        return 'blob:mock/' + downloads.length;
    };
    w.URL.revokeObjectURL = () => {};
    // jsdom does not implement navigation; keep reload observable instead.
    const reloads = { count: 0 };
    try {
        Object.defineProperty(w.location, 'reload', {
            configurable: true,
            value: () => { reloads.count++; }
        });
    } catch (e) { /* leave jsdom's own not-implemented stub in place */ }

    for (const [k, v] of Object.entries(opts.localStorage || {})) {
        w.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    for (const [k, v] of Object.entries(opts.sessionStorage || {})) {
        w.sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }

    const served = opts.config === undefined ? DEFAULT_CONFIG : opts.config;
    const fetchCalls = [];
    w.fetch = (url) => {
        fetchCalls.push(url);
        if (opts.offline) return Promise.reject(new Error('offline'));
        if (served === null) return Promise.resolve({ ok: false, status: 404 });
        return Promise.resolve({ ok: true, json: () => Promise.resolve(served) });
    };

    // --- inject application scripts in load order --------------------------
    // Appended to <head>, not <body>: a script element's source counts toward
    // body.textContent, which would pollute every text assertion in the suite.
    for (const src of [CORE_JS, DIALOG_JS, APP_JS]) {
        const s = w.document.createElement('script');
        s.textContent = src;
        w.document.head.appendChild(s);
    }

    // loadConfig() is async. The test hooks are published synchronously, so
    // waiting on them proves nothing — wait until the config has actually been
    // resolved, or until the failure screen has been rendered.
    await waitFor(() => (w.__wbcTestHooks && w.__wbcTestHooks.state.config)
        || w.document.getElementById('config-error'), 3000);

    const h = {
        dom,
        window: w,
        document: w.document,
        hooks: w.__wbcTestHooks,
        audioEvents,
        downloads,
        printed,
        reloads,
        fetchCalls,

        el: (id) => w.document.getElementById(id),
        text: (id) => {
            const n = w.document.getElementById(id);
            return n ? n.textContent.trim() : null;
        },
        visible: (id) => {
            const n = w.document.getElementById(id);
            return !!n && !n.classList.contains('hidden');
        },
        click: (id) => {
            const n = w.document.getElementById(id);
            if (!n) throw new Error('no element #' + id);
            n.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
        },
        /** Dispatch a keydown as the browser would, from the focused element. */
        key: (k, { shift = false, ctrl = false, alt = false, meta = false, target = null } = {}) => {
            const ev = new w.KeyboardEvent('keydown', {
                key: k, shiftKey: shift, ctrlKey: ctrl, altKey: alt, metaKey: meta,
                bubbles: true, cancelable: true
            });
            const node = target
                ? (typeof target === 'string' ? w.document.getElementById(target) : target)
                : (w.document.activeElement || w.document.body);
            node.dispatchEvent(ev);
            return ev;
        },
        press: (k, n, o) => { for (let i = 0; i < n; i++) h.key(k, o); },
        setInput: (id, value) => {
            const n = w.document.getElementById(id);
            n.value = value;
            n.dispatchEvent(new w.Event('input', { bubbles: true }));
        },
        modal: () => ({
            open: !w.document.getElementById('modal-overlay').classList.contains('hidden'),
            title: w.document.getElementById('modal-title').textContent,
            message: w.document.getElementById('modal-message').textContent
        }),
        confirmModal: () => h.click('modal-confirm'),
        cancelModal: () => h.click('modal-cancel'),
        /** Read a rendered download back as text. */
        downloadText: async (i = 0) => downloads[i] ? await downloads[i].text() : null,
        close: () => dom.window.close()
    };
    return h;
}

function waitFor(predicate, timeoutMs = 1000) {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        (function tick() {
            let ok = false;
            try { ok = predicate(); } catch (e) { /* keep waiting */ }
            if (ok) return resolve(true);
            if (Date.now() - started > timeoutMs) return reject(new Error('waitFor timed out'));
            setTimeout(tick, 5);
        }());
    });
}

/** Flush pending microtasks/timers so async UI settles. */
function tick(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}

module.exports = { boot, waitFor, tick, DEFAULT_CONFIG };
