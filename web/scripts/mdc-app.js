/**
 * WBC ΔΣ — Manual Differential Counter
 * =====================================
 * Implements: URS-001 v2.0, SRS-001, SDD-001
 * Keyboard-driven differential WBC counting tool for hematology.
 *
 * Architecture: vanilla JS, no framework dependencies. All safety-critical
 * arithmetic, template rendering, sanitization and configuration validation
 * live in wbc-core.js so that the shipped logic — not a copy of it — is what
 * the verification suite executes. This file owns state and DOM only.
 *
 * All state in memory; session history in sessionStorage.
 */

(function () {
    'use strict';

    var Core = (typeof window !== 'undefined' && window.WBCCore) || null;

    // ================================================================
    // STATE
    // ================================================================
    const state = {
        phase: 'case-entry',       // case-entry | counting | results
        caseNumber: '',
        specimenType: 'bm',
        isCountingActive: false,
        commentFieldFocused: false,
        config: null,              // normalized specimenTypes array
        configMeta: null,          // { version, profileId, profileName, provenance }
        counts: {},                // { cellType: number }
        morphChecked: [],          // checked morphology checklist values (URS-073)
        sessionHistory: [],        // array of completed sessions
        activeTab: 0,
        theme: 'dark',
        audioEnabled: true,
        autosaveEnabled: true,
        targetReachedNotified: false
    };

    // Storage keys
    const THEME_KEY = 'wbcds_theme';
    /**
     * The shipped build. Stated in the method statement so a reader — a
     * clinical reviewer using the hosted application above all — can tell
     * which version produced a report. QC-016 holds it equal to
     * package.json, DHF-001 and the service-worker cache key.
     */
    const APP_VERSION = '2.22.3';

    const AUDIO_KEY = 'wbcds_audio';
    const CONFIG_CACHE_KEY = 'wbcds_config';
    const AUTOSAVE_KEY = 'wbcds_autosave';
    const HISTORY_KEY = 'wbcds_history';

    const THEMES = { dark: 'dark', light: 'light' };

    function getPreferredTheme() {
        let saved = null;
        try {
            saved = sessionStorage.getItem(THEME_KEY);
        } catch (e) { /* graceful degradation */ }
        if (saved === THEMES.dark || saved === THEMES.light) return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return THEMES.light;
        }
        return THEMES.dark;
    }

    function applyTheme(theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeToggle();
    }

    function setTheme(theme, persist) {
        applyTheme(theme);
        if (persist) {
            try {
                sessionStorage.setItem(THEME_KEY, theme);
            } catch (e) { /* graceful degradation */ }
        }
    }

    function toggleTheme() {
        const next = state.theme === THEMES.dark ? THEMES.light : THEMES.dark;
        setTheme(next, true);
    }

    function updateThemeToggle() {
        const btn = el('btnToggleTheme');
        const label = el('themeLabel');
        if (!btn || !label) return;
        const isLight = state.theme === THEMES.light;
        label.textContent = isLight ? 'Dark Mode' : 'Light Mode';
        btn.setAttribute('aria-pressed', String(isLight));
    }

    applyTheme(getPreferredTheme());

    // ================================================================
    // AUDIO ENGINE (URS-027, URS-097)
    // ================================================================
    var AudioEngine = {
        ctx: null,
        enabled: true,

        /**
         * Two sources, in order: the profile's default, then any choice the
         * operator has made this session.
         *
         * The profile default was previously ignored entirely. Every preset
         * carried an `audio` object and the configuration editor offered an
         * Audio checkbox that wrote it, and the counter never read either — so
         * a laboratory that set audio off in its profile got sound anyway. A
         * control that does nothing is worse than no control, because the
         * operator believes the setting took effect.
         */
        init: function (specConfig) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { /* no audio support */ }

            var audio = (specConfig && specConfig.audio) || {};
            this.mode = audio.enabled === false ? 'off'
                : (audio.mode === 'tones' ? 'tones' : 'click');

            // A session choice overrides the profile default, in both
            // directions — the operator at the bench has the last word.
            // `on` is the value written before there were three modes; it
            // means the click, which is what those sessions were hearing.
            try {
                var saved = sessionStorage.getItem(AUDIO_KEY);
                if (saved === 'off') this.mode = 'off';
                else if (saved === 'on' || saved === 'click') this.mode = 'click';
                else if (saved === 'tones') this.mode = 'tones';
            } catch (e) { /* graceful degradation */ }

            this.enabled = this.mode !== 'off';
            state.audioEnabled = this.enabled;
            state.audioMode = this.mode;
        },

        /** Modes in cycle order. */
        MODES: ['off', 'click', 'tones'],

        _playTone: function (freq, type, duration) {
            if (!this.enabled || !this.ctx) return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                var osc = this.ctx.createOscillator();
                var gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                gain.gain.value = 0.15;
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration / 1000);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration / 1000);
            } catch (e) { /* best-effort */ }
        },

        playClick: function () {
            this._playTone(800, 'square', 5);
        },

        playUndo: function () {
            this._playTone(400, 'sine', 10);
        },

        /**
         * A counted cell. In `tones` mode the pitch identifies WHICH category,
         * which is the bit the click cannot carry; in `click` mode nothing
         * changes.
         *
         * `k` is 1-indexed position in the displayed order, `n` the number of
         * tallied categories. A profile the mapping cannot place (no
         * categories, index out of range) falls back to the click rather than
         * going silent — silence would read as a missed keypress.
         */
        playCount: function (k, n) {
            if (this.mode !== 'tones') { this.playClick(); return; }
            var freq = WBCTones.frequencyFor(k, n);
            if (freq === null) { this.playClick(); return; }
            this._playShaped(freq, WBCTones.humanize(WBCTones.toneParams('increment'), this.rng));
        },

        /** An undone cell, at its own pitch — the operator hears what went back. */
        playUndoAt: function (k, n) {
            if (this.mode !== 'tones') { this.playUndo(); return; }
            var freq = WBCTones.frequencyFor(k, n);
            if (freq === null) { this.playUndo(); return; }
            this._playShaped(freq, WBCTones.humanize(WBCTones.toneParams('undo'), this.rng));
        },

        /** Injectable so a test can pin the humanisation. */
        rng: null,

        /**
         * A shaped tone: real attack, exponential decay, optional glide.
         *
         * The attack matters. `_playTone` sets its gain directly and ramps
         * down, so every note begins with a step discontinuity — an onset
         * click on top of the waveform, and a large part of why the square
         * wave is tiring at several hundred repetitions.
         */
        _playShaped: function (freq, p) {
            if (this.mode === 'off' || !this.ctx) return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                var now = this.ctx.currentTime;
                var attack = p.attackMs / 1000;
                var end = p.durationMs / 1000;

                var osc = this.ctx.createOscillator();
                var gain = this.ctx.createGain();
                osc.type = p.type;
                osc.frequency.setValueAtTime(freq * WBCTones.centsToRatio(p.detuneCents || 0), now);
                if (p.glideCents) {
                    osc.frequency.exponentialRampToValueAtTime(
                        freq * WBCTones.centsToRatio((p.detuneCents || 0) + p.glideCents),
                        now + end);
                }
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(p.peakGain, now + attack);
                gain.gain.exponentialRampToValueAtTime(0.001, now + end);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + end);
                osc.onended = function () {
                    try { osc.disconnect(); gain.disconnect(); } catch (e) { /* already gone */ }
                };
            } catch (e) { /* best-effort */ }
        },

        playChime: function () {
            if (!this.enabled || !this.ctx) return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                var notes = [523, 659, 784]; // C5, E5, G5
                var self = this;
                notes.forEach(function (freq, i) {
                    var osc = self.ctx.createOscillator();
                    var gain = self.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.value = 0.12;
                    gain.gain.exponentialRampToValueAtTime(0.001, self.ctx.currentTime + (i * 0.15) + 0.3);
                    osc.connect(gain);
                    gain.connect(self.ctx.destination);
                    osc.start(self.ctx.currentTime + i * 0.15);
                    osc.stop(self.ctx.currentTime + (i * 0.15) + 0.3);
                });
            } catch (e) { /* best-effort */ }
        },

        playTypewriter: function () {
            this._playTone(600, 'triangle', 3);
        },

        toggle: function () {
            var at = this.MODES.indexOf(this.mode);
            this.mode = this.MODES[(at + 1) % this.MODES.length];
            this.enabled = this.mode !== 'off';
            state.audioEnabled = this.enabled;
            state.audioMode = this.mode;
            try {
                sessionStorage.setItem(AUDIO_KEY, this.mode);
            } catch (e) { /* graceful degradation */ }
            updateAudioToggle();
        }
    };

    function updateAudioToggle() {
        var label = el('audioLabel');
        var btn = el('btnToggleAudio');
        if (!label || !btn) return;
        var LABELS = { off: 'Sound Off', click: 'Click', tones: 'Tones' };
        label.textContent = LABELS[AudioEngine.mode] || 'Sound Off';
        btn.setAttribute('aria-pressed', String(AudioEngine.enabled));
        btn.setAttribute('title', 'Audio feedback: ' + (LABELS[AudioEngine.mode] || 'Sound Off') +
            ' — click to cycle Off, Click, Tones');
    }

    // ================================================================
    // CONFIG LOADER (URS-100, URS-106)
    // ================================================================

    function cacheConfig(raw) {
        try {
            localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(raw));
        } catch (e) { /* graceful degradation */ }
    }

    function loadCachedConfig() {
        try {
            var data = localStorage.getItem(CONFIG_CACHE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) { /* graceful degradation */ }
        return null;
    }

    function clearCachedConfig() {
        try {
            localStorage.removeItem(CONFIG_CACHE_KEY);
        } catch (e) { /* ignore */ }
    }

    /**
     * Normalize + validate one candidate config.
     * @returns {{ok: boolean, meta: Object, specimenTypes: Array, errors: string[]}}
     */
    function prepareConfig(raw) {
        try {
            var norm = Core.normalizeConfig(raw);
            var errors = Core.validateConfig(norm.specimenTypes);
            return {
                ok: errors.length === 0,
                // `provenance` travels with the meta because the method
                // statement reports it as "Basis" (URS-055). It was omitted,
                // so `buildMethodStatement` emitted that entry only in unit
                // tests that constructed the meta themselves — the shipped
                // report never carried a basis at all. See DCR-035 §3.
                meta: {
                    version: norm.version, profileId: norm.profileId,
                    profileName: norm.profileName, provenance: norm.provenance,
                    appVersion: APP_VERSION
                },
                specimenTypes: norm.specimenTypes,
                errors: errors
            };
        } catch (e) {
            return { ok: false, meta: null, specimenTypes: null, errors: [e.message] };
        }
    }

    /**
     * Resolve the active configuration.
     *
     * The cached profile normally wins so that counting works offline
     * (URS-094/URS-106). It is overridden in exactly two cases:
     *   - the shipped file carries the SAME profileId at a NEWER version, which
     *     is how a corrected default profile reaches an installed browser;
     *   - the cached profile fails validation, in which case falling back to
     *     the shipped default is preferable to refusing to start.
     * A user's own custom profile (different profileId) is never overwritten.
     */
    async function loadConfig() {
        if (!Core) {
            showFatalConfigError('wbc-core.js failed to load', [
                'The calculation engine script could not be loaded. Check that scripts/wbc-core.js is present and served before scripts/mdc-app.js.'
            ], false);
            return;
        }

        var cachedRaw = loadCachedConfig();
        var shippedRaw = null;
        try {
            var resp = await fetch('settings/templates.json', { cache: 'no-cache' });
            if (resp.ok) shippedRaw = await resp.json();
        } catch (e) { /* offline: the cache must carry us */ }

        var cached = cachedRaw ? prepareConfig(cachedRaw) : null;
        var shipped = shippedRaw ? prepareConfig(shippedRaw) : null;

        var chosen = null;
        var chosenRaw = null;
        var notice = null;

        if (cached && cached.ok && shipped && shipped.ok &&
            Core.isCacheSuperseded(cached.meta, shipped.meta)) {
            chosen = shipped;
            chosenRaw = shippedRaw;
            notice = 'Configuration profile "' + shipped.meta.profileName + '" was updated to version ' +
                shipped.meta.version + '. The newer built-in profile has been applied.';
            cacheConfig(shippedRaw);
        } else if (cached && cached.ok) {
            chosen = cached;
            chosenRaw = cachedRaw;
        } else if (shipped && shipped.ok) {
            chosen = shipped;
            chosenRaw = shippedRaw;
            if (cached && !cached.ok) {
                notice = 'The saved configuration was invalid and has been replaced by the built-in default. ' +
                    'Details: ' + cached.errors.slice(0, 3).join('; ');
                clearCachedConfig();
            }
            cacheConfig(shippedRaw);
        }

        if (!chosen) {
            var errs = [];
            if (cached && !cached.ok) errs.push('Saved profile: ' + cached.errors.join('; '));
            if (shipped && !shipped.ok) errs.push('Built-in profile: ' + shipped.errors.join('; '));
            if (!cached && !shipped) errs.push('Could not load settings/templates.json and no saved profile exists.');
            showFatalConfigError('Configuration Error', errs, !!cachedRaw);
            return;
        }

        state.config = chosen.specimenTypes;
        state.configMeta = chosen.meta;
        loadSessionHistory();
        init();

        // A cached profile whose id was renamed (DCR-035) is still perfectly
        // usable, so it is NOT replaced: the operator may have adapted it, and
        // discarding that to correct a label would be the worse trade. But the
        // id prints in the report footer and travels in every export, so
        // carrying on silently under a name the catalogue no longer knows is
        // not acceptable either. Offered, once, and only when nothing else is
        // already claiming the modal.
        var successor = (!notice && chosen === cached)
            ? Core.renamedSuccessor(chosen.meta) : null;

        // Both of these raise a modal, and the modal is a single shared
        // element: showing them in parallel would replace the recovery prompt
        // with the notice and silently cost the operator an interrupted count.
        // They are therefore sequenced.
        if (notice) {
            showAlert('Configuration Updated', notice, checkAutosaveRecovery);
        } else if (successor) {
            offerRenamedProfile(chosen.meta, successor, checkAutosaveRecovery);
        } else {
            checkAutosaveRecovery();
        }
    }

    /**
     * Tell the operator their profile was renamed, and offer the successor.
     *
     * Declining is the default: Escape and Cancel both keep the active
     * configuration. Accepting loads the renamed built-in, which replaces the
     * active one — the same consequence as loading any preset from the
     * catalogue, and stated as such rather than described as an update.
     *
     * The successor's file and display name are read from the catalogue rather
     * than assumed, so a later rename needs no second place to update. If the
     * catalogue cannot be fetched — an offline workstation — the offer is
     * skipped silently: there is nothing to load, and a dialog offering an
     * action that cannot be performed is worse than no dialog.
     */
    async function offerRenamedProfile(cachedMeta, successorId, done) {
        var entry = null;
        try {
            var resp = await fetch('settings/presets/index.json', { cache: 'no-cache' });
            if (resp.ok) {
                var catalogue = await resp.json();
                (catalogue.presets || []).forEach(function (p) {
                    if (p.profileId === successorId) entry = p;
                });
            }
        } catch (e) { /* offline: no successor to offer */ }

        if (!entry) { done(); return; }

        WBCDialog.confirm(
            'Profile renamed',
            'Your active configuration is "' + (cachedMeta.profileName || cachedMeta.profileId) +
            '" (' + cachedMeta.profileId + '), which has been renamed to "' + entry.name +
            '" (' + successorId + '). Names now state what a profile contains rather than asserting ' +
            'endorsement. Your configuration still works, and reports will keep citing the old id. ' +
            'Load the renamed built-in profile instead? This replaces the active configuration and ' +
            'clears any count in progress.',
            'Load ' + entry.name,
            function () { loadPreset(entry.file, entry.name); },
            'Keep mine',
            done);
    }

    /**
     * Terminal config failure screen.
     *
     * Always offers a recovery path when a cached profile exists — without it a
     * single bad saved profile would leave the application permanently
     * unusable, since every other control lives behind this screen.
     */
    function showFatalConfigError(title, messages, offerReset) {
        var html = '<div id="config-error" class="flex items-center justify-center min-h-screen p-4">' +
            '<div class="max-w-lg text-center">' +
            '<p class="text-red-400 text-lg font-semibold">' + Core.escapeHtml(title) + '</p>' +
            '<div class="text-slate-500 mt-3 text-sm space-y-1">';
        messages.forEach(function (m) {
            html += '<p>' + Core.escapeHtml(m) + '</p>';
        });
        html += '</div>';
        if (offerReset) {
            html += '<button id="btnFatalReset" class="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 ' +
                'text-white rounded-lg text-sm font-medium">Reset to Built-in Default</button>';
        }
        html += '</div></div>';
        document.body.innerHTML = html;
        var btn = document.getElementById('btnFatalReset');
        if (btn) {
            btn.addEventListener('click', function () {
                clearCachedConfig();
                location.reload();
            });
        }
    }

    function resetConfigToDefault() {
        clearCachedConfig();
        location.reload();
    }

    // ================================================================
    // CLIPBOARD SAFETY
    // ================================================================
    function clearClipboard() {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText('').catch(function () { /* best-effort */ });
            }
        } catch (e) { /* best-effort */ }
    }

    // ================================================================
    // SESSION HISTORY (SYS-090 to SYS-095)
    // ================================================================
    function loadSessionHistory() {
        try {
            var data = sessionStorage.getItem(HISTORY_KEY);
            if (data) state.sessionHistory = JSON.parse(data);
        } catch (e) { /* graceful degradation */ }
    }

    function saveSessionHistory() {
        try {
            sessionStorage.setItem(HISTORY_KEY, JSON.stringify(state.sessionHistory));
        } catch (e) { /* graceful degradation */ }
    }

    function addToHistory(session) {
        state.sessionHistory.push(session);
        saveSessionHistory();
        renderHistoryList();
    }

    // ================================================================
    // AUTOSAVE / CRASH RECOVERY (URS-085)
    // ================================================================
    function autosaveIsEnabled() {
        var spec = getSpecConfig();
        if (spec && spec.autosave === false) return false;
        return state.autosaveEnabled;
    }

    function saveAutosaveState() {
        try {
            var data = {
                caseNumber: state.caseNumber,
                specimenType: state.specimenType,
                counts: Object.assign({}, state.counts),
                morphologyComments: el('morphComments') ? el('morphComments').value : '',
                morphChecked: state.morphChecked.slice(),
                configProfileId: state.configMeta ? state.configMeta.profileId : '',
                timestamp: new Date().toISOString(),
                phase: 'counting'
            };
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
        } catch (e) { /* graceful degradation */ }
    }

    // A recovery snapshot is for an interruption, not an archive. Beyond this
    // it is more likely to resurrect a stale case than to save work, and it is
    // patient data at rest on a possibly shared workstation.
    var AUTOSAVE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

    function loadAutosaveState() {
        try {
            var raw = localStorage.getItem(AUTOSAVE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            var age = Date.now() - Date.parse(data && data.timestamp);
            if (isFinite(age) && age > AUTOSAVE_MAX_AGE_MS) {
                clearAutosaveState();
                return null;
            }
            return data;
        } catch (e) { /* graceful degradation */ }
        return null;
    }

    function clearAutosaveState() {
        try {
            localStorage.removeItem(AUTOSAVE_KEY);
        } catch (e) { /* graceful degradation */ }
    }

    function showRecoveryModal(saved) {
        var caseDisplay = saved.caseNumber || '(no case #)';
        var total = 0;
        if (saved.counts) {
            Object.keys(saved.counts).forEach(function (k) { total += saved.counts[k]; });
        }
        var time = new Date(saved.timestamp).toLocaleTimeString();

        showModal(
            'Recover Interrupted Count',
            'Found interrupted count: ' + caseDisplay + ' — ' + total + ' cells counted at ' + time + '. Restore or discard?',
            'Restore Count',
            function () {
                restoreAutosaveState(saved);
            },
            'Discard',
            function () {
                clearAutosaveState();
                el('caseNumber').focus();
            },
            // Both branches are consequential: Discard throws away a recovered
            // count. Escape must not choose one of them by accident.
            { dismissible: false }
        );
    }

    function restoreAutosaveState(saved) {
        // The saved specimen type may no longer exist if the profile changed
        // between sessions; recovering into an undefined config would crash.
        if (!getSpecConfigForType(saved.specimenType)) {
            clearAutosaveState();
            showAlert(
                'Cannot Restore Count',
                'The interrupted count used specimen type "' + (saved.specimenType || '(unknown)') +
                '", which is not defined in the current configuration profile. The saved count has been discarded.',
                function () { el('caseNumber').focus(); }
            );
            return;
        }

        state.caseNumber = saved.caseNumber || '';
        state.specimenType = saved.specimenType;
        state.isCountingActive = true;
        state.targetReachedNotified = false;
        state.morphChecked = Array.isArray(saved.morphChecked) ? saved.morphChecked.slice() : [];

        // Restore counts. The record has left the protection of the keyboard
        // handler's guards, so every value is coerced back to a non-negative
        // integer and unknown cell types are dropped.
        var specConfig = getSpecConfig();
        var allowed = Object.keys(specConfig.outCodes).map(function (k) {
            return specConfig.outCodes[k];
        });
        state.counts = Core.sanitizeCounts(saved.counts, allowed);

        // Update UI
        var caseInput = el('caseNumber');
        caseInput.value = state.caseNumber;
        caseInput.blur();
        setSpecimenSelectValue(state.specimenType);

        showPhase('counting');
        renderCounterTable();
        updateCounterDisplay();
        updateCaseBadge();
        setStateLabel('Counting');

        caseInput.readOnly = true;

        // Restore morphology free text
        if (saved.morphologyComments && el('morphComments')) {
            el('morphComments').value = saved.morphologyComments;
            el('commentCharCount').textContent = saved.morphologyComments.length + ' / 500';
        }

        document.addEventListener('keydown', onKeyDown);
    }

    // ================================================================
    // INITIALIZATION
    // ================================================================
    function init() {
        // Initialize audio engine with this profile's default (URS-097)
        AudioEngine.init(getSpecConfig());
        updateAudioToggle();

        // Populate specimen type selects from config
        populateSpecimenSelect();

        // DOM references
        var caseInput = el('caseNumber');
        var specSelect = el('specimenType');
        var specSelectCounting = el('specimenTypeCounting');
        var btnStart = el('btnStartCount');
        var btnDone = el('btnCountDone');
        var btnReset = el('btnCountReset');
        var btnCopy = el('btnCopyOutput');
        var btnNewCase = el('btnNewCase');
        var btnResume = el('btnResumeCounting');
        var btnToggleTheme = el('btnToggleTheme');
        var btnToggleAudio = el('btnToggleAudio');
        var btnExportCsv = el('btnExportCsv');
        var btnExportJson = el('btnExportJson');
        var morphField = el('morphComments');

        // Enter key in case input starts count (SYS-009)
        caseInput.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                btnStart.click();
            }
        });

        // Specimen type change before counting
        specSelect.addEventListener('change', function () {
            state.specimenType = specSelect.value;
        });

        // Specimen type change DURING counting (URS-010, URS-013)
        if (specSelectCounting) {
            specSelectCounting.addEventListener('change', function () {
                var newType = specSelectCounting.value;
                if (newType === state.specimenType) return;
                if (state.isCountingActive && state.phase === 'counting') {
                    switchSpecimenType(newType);
                } else {
                    state.specimenType = newType;
                    setSpecimenSelectValue(newType);
                }
            });
        }

        // Start Count (SYS-030, SYS-016)
        btnStart.addEventListener('click', function () {
            state.specimenType = specSelect.value;
            var specConfig = getSpecConfig();
            if (!specConfig) {
                showAlert('Configuration Error',
                    'No configuration is defined for the selected specimen type.');
                return;
            }

            var enteredCase = caseInput.value.trim();

            // URS-004: case number requirement is profile-configurable
            if (specConfig.requireCaseNumber && !enteredCase) {
                showAlert(
                    'Case Number Required',
                    'This configuration profile requires a case/accession number before counting can begin.',
                    function () { caseInput.focus(); }
                );
                return;
            }

            clearClipboard();

            state.caseNumber = enteredCase;
            state.isCountingActive = true;
            state.targetReachedNotified = false;
            state.morphChecked = [];

            // Initialize counts to zero for this specimen type
            state.counts = {};
            Object.keys(specConfig.outCodes).forEach(function (k) {
                state.counts[specConfig.outCodes[k]] = 0;
            });

            // Update UI
            showPhase('counting');
            renderCounterTable();
            updateCounterDisplay();
            updateCaseBadge();
            setStateLabel('Counting');

            caseInput.readOnly = true;
            setSpecimenSelectValue(state.specimenType);

            // Focus must leave the case field or the counting keystrokes would
            // be treated as text entry — the barcode workflow (URS-006) ends
            // with Enter pressed while this input still holds focus.
            caseInput.blur();

            // Attach keyboard listener
            document.addEventListener('keydown', onKeyDown);
        });

        // Count Done — no blocking modal, directly finalize
        btnDone.addEventListener('click', function () {
            finalizeCount();
        });

        // Reset (SYS-080 to SYS-084)
        btnReset.addEventListener('click', function () {
            var total = getTotal();
            if (total > 0) {
                showModal(
                    'Reset Count',
                    'This will clear all count data for case ' + (state.caseNumber || '(no case #)') + '. Continue?',
                    'Reset',
                    function () { resetToStart(); }
                );
            } else {
                resetToStart();
            }
        });

        // Copy to Clipboard (SYS-064 to SYS-066)
        btnCopy.addEventListener('click', function () {
            var activePanel = document.querySelector('#tab-panels .tab-panel:not(.hidden)');
            if (!activePanel) return;
            var text = activePanel.innerText;
            var done = function () {
                var btn = el('copyBtnText');
                btn.textContent = 'Copied!';
                setTimeout(function () { btn.textContent = 'Copy to Clipboard'; }, 2000);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(function () {
                    legacyCopy(activePanel);
                    done();
                });
            } else {
                legacyCopy(activePanel);
                done();
            }
        });

        // Resume Counting (from results phase)
        btnResume.addEventListener('click', function () {
            resumeCounting();
        });

        // New Case (from results phase)
        btnNewCase.addEventListener('click', function () {
            resetToStart();
        });

        // Theme toggle
        if (btnToggleTheme) {
            btnToggleTheme.addEventListener('click', function () {
                toggleTheme();
            });
        }

        // Audio toggle
        if (btnToggleAudio) {
            btnToggleAudio.addEventListener('click', function () {
                AudioEngine.toggle();
            });
        }

        // Export session data (CSV/JSON)
        if (btnExportCsv) {
            btnExportCsv.addEventListener('click', function () {
                exportSessionCsv();
            });
        }
        if (btnExportJson) {
            btnExportJson.addEventListener('click', function () {
                exportSessionJson();
            });
        }

        // Config export / import / reset (URS-103)
        wireConfigControls();

        // Print (URS-054)
        var btnPrint = el('btnPrintResults');
        if (btnPrint) {
            btnPrint.addEventListener('click', function () { window.print(); });
        }

        // Keyboard shortcut: Ctrl/Cmd + Shift + L
        document.addEventListener('keydown', function (ev) {
            if (ev.repeat) return;
            if (!ev.shiftKey) return;
            if (!ev.ctrlKey && !ev.metaKey) return;
            if (String(ev.key).toUpperCase() !== 'L') return;
            ev.preventDefault();
            toggleTheme();
        });

        // Morphology comments — keyboard isolation (SYS-073) + typewriter sound
        morphField.addEventListener('focus', function () {
            state.commentFieldFocused = true;
        });
        morphField.addEventListener('blur', function () {
            state.commentFieldFocused = false;
        });
        morphField.addEventListener('input', function () {
            el('commentCharCount').textContent = morphField.value.length + ' / 500';
            AudioEngine.playTypewriter();
        });

        // History modal close
        el('history-modal-close').addEventListener('click', function () {
            el('history-modal').classList.add('hidden');
        });

        // Render initial history
        renderHistoryList();

        // Sync theme toggle label
        updateThemeToggle();

    }

    /**
     * Offer to restore an interrupted count, if one was recorded.
     * Called by loadConfig after init(), sequenced behind any configuration
     * notice so the two cannot compete for the shared modal.
     */
    function checkAutosaveRecovery() {
        var saved = loadAutosaveState();
        if (saved && saved.phase === 'counting') {
            showRecoveryModal(saved);
        } else {
            el('caseNumber').focus();
        }
    }

    function legacyCopy(node) {
        try {
            var range = document.createRange();
            range.selectNodeContents(node);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('copy');
            sel.removeAllRanges();
        } catch (e) { /* best-effort */ }
    }

    /**
     * Config import/export/reset wiring.
     *
     * These handlers previously lived in an inline <script> in counter.html and
     * referenced functions declared inside this IIFE, so their `typeof fn ===
     * "function"` guards were always false and all three controls were inert.
     * Wiring them here keeps the functions module-private and working.
     */
    function wireConfigControls() {
        var btnExport = el('btnExportConfig');
        if (btnExport) {
            btnExport.addEventListener('click', function () { exportConfig(); });
        }
        var fileInput = el('configFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', function (ev) {
                if (ev.target.files && ev.target.files.length > 0) {
                    importConfig(ev.target.files[0]);
                    ev.target.value = '';
                }
            });
        }
        var btnReset = el('btnResetConfig');
        if (btnReset) {
            btnReset.addEventListener('click', function () {
                showModal(
                    'Reset Configuration',
                    'Reset configuration to the built-in default? Custom key mappings and output templates will be lost.',
                    'Reset',
                    function () { resetConfigToDefault(); }
                );
            });
        }
        var btnPresets = el('btnPresetCatalog');
        if (btnPresets) {
            btnPresets.addEventListener('click', function () { openPresetCatalog(); });
        }
        var presetClose = el('preset-modal-close');
        if (presetClose) {
            presetClose.addEventListener('click', function () {
                el('preset-modal').classList.add('hidden');
            });
        }
    }

    // ================================================================
    // PRESET CATALOGUE (URS-101)
    // ================================================================
    async function openPresetCatalog() {
        var modal = el('preset-modal');
        var list = el('preset-list');
        modal.classList.remove('hidden');
        list.innerHTML = '<p class="text-xs text-slate-500">Loading profiles…</p>';

        var catalogue;
        try {
            var resp = await fetch('settings/presets/index.json', { cache: 'no-cache' });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            catalogue = await resp.json();
        } catch (e) {
            list.innerHTML = '<p class="text-xs text-amber-400">Preset catalogue unavailable offline. ' +
                'Use Import Config to load a saved profile instead.</p>';
            return;
        }

        // Blank editor templates are not countable profiles; offering them here
        // would hand the operator a configuration the counter must reject.
        var usable = (catalogue.presets || []).filter(function (p) { return !p.editorOnly; });

        var html = '';
        usable.forEach(function (p) {
            var active = state.configMeta && state.configMeta.profileId === p.profileId;
            html += '<div class="flex items-center justify-between gap-3 px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg">';
            html += '<div class="min-w-0">';
            html += '<div class="text-sm font-medium text-slate-200">' + Core.escapeHtml(p.name) +
                (active ? ' <span class="text-[10px] text-emerald-400 uppercase tracking-wider">active</span>' : '') + '</div>';
            html += '<div class="text-[11px] text-slate-500">' + Core.escapeHtml(p.summary) + '</div>';
            html += '<div class="text-[10px] text-slate-600 font-mono mt-0.5">' + Core.escapeHtml(p.specimens) + '</div>';
            html += '</div>';
            html += '<button class="preset-load shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium" ' +
                'data-preset-file="' + Core.escapeAttr(p.file) + '" data-preset-name="' + Core.escapeAttr(p.name) + '">Load</button>';
            html += '</div>';
        });
        list.innerHTML = html || '<p class="text-xs text-slate-500">No preset profiles are available.</p>';

        list.querySelectorAll('.preset-load').forEach(function (btn) {
            btn.addEventListener('click', function () {
                loadPreset(btn.getAttribute('data-preset-file'), btn.getAttribute('data-preset-name'));
            });
        });
    }

    async function loadPreset(file, name) {
        el('preset-modal').classList.add('hidden');
        var raw;
        try {
            var resp = await fetch('settings/presets/' + file, { cache: 'no-cache' });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            raw = await resp.json();
        } catch (e) {
            showAlert('Preset Unavailable', 'Could not load "' + name + '": ' + e.message);
            return;
        }

        var prepared = prepareConfig(raw);
        if (!prepared.ok) {
            showAlert('Preset Invalid',
                'The preset "' + name + '" failed validation: ' + prepared.errors.slice(0, 4).join('; '));
            return;
        }

        state.config = prepared.specimenTypes;
        state.configMeta = prepared.meta;
        cacheConfig(raw);
        populateSpecimenSelect();
        resetToStart();
        showAlert('Preset Loaded',
            'Profile "' + prepared.meta.profileName + '" (v' + prepared.meta.version + ') is now active.');
    }

    // ================================================================
    // SPECIMEN TYPE SWITCHING (URS-010, URS-013)
    // ================================================================
    function switchSpecimenType(newType) {
        var total = getTotal();

        if (total === 0) {
            applySpecimenSwitch(newType);
            return;
        }

        if (state.caseNumber) {
            showModal(
                'Switch Specimen Type',
                'Current count for ' + state.caseNumber + ' (' + getSpecLabel() + ', ' + total +
                ' cells) will be saved to history. Switch to ' + getSpecLabelForType(newType) + '?',
                'Save & Switch',
                function () {
                    addToHistory(buildSession({ switchedToSpecimen: newType }));
                    applySpecimenSwitch(newType);
                },
                'Cancel',
                function () { setSpecimenSelectValue(state.specimenType); }
            );
        } else {
            showModal(
                'Switch Specimen Type',
                'Discard current count (' + total + ' cells) and switch to ' + getSpecLabelForType(newType) + '?',
                'Discard & Switch',
                function () { applySpecimenSwitch(newType); },
                'Cancel',
                function () { setSpecimenSelectValue(state.specimenType); }
            );
        }
    }

    function applySpecimenSwitch(newType) {
        state.specimenType = newType;
        state.targetReachedNotified = false;
        state.morphChecked = [];
        state.counts = {};
        var specConfig = getSpecConfig();
        Object.keys(specConfig.outCodes).forEach(function (k) {
            state.counts[specConfig.outCodes[k]] = 0;
        });
        if (el('morphComments')) {
            el('morphComments').value = '';
            el('commentCharCount').textContent = '0 / 500';
        }
        setSpecimenSelectValue(newType);
        renderCounterTable();
        updateCounterDisplay();
        updateCaseBadge();
        clearAutosaveState();
    }

    // ================================================================
    // DYNAMIC SPECIMEN SELECTS
    // ================================================================
    function populateSpecimenSelect() {
        if (!state.config) return;
        ['specimenType', 'specimenTypeCounting'].forEach(function (id) {
            var select = el(id);
            if (!select) return;
            select.innerHTML = '';
            state.config.forEach(function (spec) {
                var opt = document.createElement('option');
                opt.value = spec.specimenType;
                opt.textContent = spec.specimenLabel || String(spec.specimenType).toUpperCase();
                select.appendChild(opt);
            });
        });
        if (state.config.length > 0) {
            state.specimenType = state.config[0].specimenType;
            setSpecimenSelectValue(state.specimenType);
        }
    }

    function setSpecimenSelectValue(type) {
        ['specimenType', 'specimenTypeCounting'].forEach(function (id) {
            var select = el(id);
            if (select) select.value = type;
        });
    }

    /**
     * The configured key this event refers to, or null.
     *
     * The character a key produces changes under Shift: on a US layout Shift+"."
     * is ">", Shift+"," is "<", Shift+"/" is "?" and Shift+";" is ":". Since
     * Shift is how a miscount is corrected, a profile that maps punctuation had
     * working increment and SILENTLY BROKEN undo — the shipped `right-hand`
     * preset maps ".", ",", "/" and ";" to blasts, metamyelocytes, basophils
     * and monocytes, none of which could be un-counted at all. Blasts are the
     * category most likely to need correcting.
     *
     * The printed character is tried first, so a laboratory on AZERTY or QWERTZ
     * gets the key its keyboard is labelled with. Only if that does not match a
     * mapping does the physical position decide, which Shift does not change.
     */
    var PHYSICAL_KEY = {
        Period: '.', Comma: ',', Slash: '/', Semicolon: ';', Quote: "'",
        BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=',
        Backslash: '\\', Backquote: '`'
    };

    function physicalChar(code) {
        if (!code) return '';
        if (Object.prototype.hasOwnProperty.call(PHYSICAL_KEY, code)) return PHYSICAL_KEY[code];
        var m = /^Key([A-Z])$/.exec(code);
        if (m) return m[1];
        m = /^Digit([0-9])$/.exec(code);
        return m ? m[1] : '';
    }

    function resolveCountingKey(ev, outCodes) {
        var printed = String(ev.key).toUpperCase();
        if (Object.prototype.hasOwnProperty.call(outCodes, printed)) return printed;
        var physical = physicalChar(ev.code).toUpperCase();
        if (physical && Object.prototype.hasOwnProperty.call(outCodes, physical)) return physical;
        return null;
    }

    // ================================================================
    // KEYBOARD HANDLER (SYS-030 to SYS-039)
    // ================================================================
    function onKeyDown(ev) {
        if (!state.isCountingActive) return;
        if (state.commentFieldFocused) return;

        // A dialog is modal: while one is open the keyboard belongs to it.
        // Form controls were already excluded below, but the Reset
        // confirmation opens during counting with focus on a button, so a
        // counting key pressed over it was still tallied.
        if (window.WBCDialog && WBCDialog.isOpen()) return;

        // Ignore modifier combos except Shift (SYS-036)
        if (ev.ctrlKey || ev.altKey || ev.metaKey) return;

        // A tally records deliberate acts, and operating-system auto-repeat is
        // not one. A held, sticky or bouncing key would add cells at roughly
        // 30 per second, each with its own confirmation sound, and nothing in
        // the interface distinguishes that from fast counting. At a 200-500
        // cell target a two-second stuck key is a material, undetectable
        // miscount. The theme shortcut already guarded against this; the
        // counting path — the one place it changes a clinical number — did not.
        if (ev.repeat) return;
        // An input method editor emits key events while a candidate window is
        // open; those keystrokes belong to the editor, not the tally.
        if (ev.isComposing) return;

        // Never swallow keystrokes aimed at a form control
        var tag = ev.target && ev.target.tagName ? ev.target.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        var specConfig = getSpecConfig();
        if (!specConfig) return;
        var outCodes = specConfig.outCodes;

        var key = resolveCountingKey(ev, outCodes);
        if (key === null) return;

        ev.preventDefault();

        var cellType = outCodes[key];
        var isDecrement = ev.shiftKey;

        // Position in the displayed order, which is what the tone is derived
        // from (SYS-254). Computed here rather than stored, so it cannot
        // disagree with the profile.
        var order = specConfig.categories.upper.concat(specConfig.categories.lower);
        var k = order.indexOf(cellType) + 1;   // 0 -> not displayed -> falls back
        var n = order.length;

        if (isDecrement) {
            // Decrement (SYS-032, SYS-033) — never below zero
            if (state.counts[cellType] > 0) {
                state.counts[cellType]--;
                flashCell(cellType, 'decrement');
                AudioEngine.playUndoAt(k, n);
            }
        } else {
            // Increment (SYS-031)
            state.counts[cellType]++;
            flashCell(cellType, 'increment');
            AudioEngine.playCount(k, n);
        }

        updateCounterDisplay();

        // Target reached chime — measured against the differential, since the
        // target is a number of classified cells.
        var total = getDifferentialTotal();
        if (total >= specConfig.targetCount && !state.targetReachedNotified) {
            state.targetReachedNotified = true;
            AudioEngine.playChime();
        }

        if (autosaveIsEnabled()) {
            saveAutosaveState();
        }
    }

    // ================================================================
    // DERIVED VALUES
    // ================================================================
    function computeMERatio(specConfig) {
        if (!specConfig || !specConfig.formulas || !specConfig.formulas.ME_ratio) return null;
        return Core.computeRatio(state.counts, specConfig.formulas.ME_ratio);
    }

    // A ratio of two counted proportions carries the sampling error of both
    // (REF-001 §3.8). The interval displayed beside it quantifies that; this
    // note covers what an interval cannot — cells are not distributed at random
    // across a smear, so the real uncertainty is at least this wide.
    //
    // The attribution to Rümke 1985 was removed when that source was withdrawn
    // as unobtainable. The claim is derived, not borrowed.
    /**
     * Width of the totals column, shared by everything that reports a total.
     *
     * The two category rows are separate tables, and a table sized `w-full`
     * divides its width by its own column count — so a four-cell row and a
     * five-cell row put their Sub column in different places, and the grand
     * total, pinned to the container edge, landed in a third. Three columns of
     * totals, none of them above another.
     *
     * Fixing the last column at one width and letting the category columns
     * share what is left puts all three in the same vertical strip, whatever
     * the profile's row lengths are. `min-width` on the table keeps the
     * horizontal scroll on a narrow viewport, which `table-layout: fixed`
     * would otherwise remove by clipping instead.
     */
    var TOTALS_COL = '8rem';
    var ROW_TABLE_STYLE = 'table-layout:fixed;min-width:32rem';

    var RATIO_IMPRECISION_NOTE = 'A ratio of two counted proportions carries the ' +
        'sampling error of both, and is therefore substantially less precise than ' +
        'either percentage alone. Interpret alongside cellularity and the trephine ' +
        'biopsy; treat small differences between successive ratios with caution.';

    /** Every configured formula evaluated against the current counts. */
    function computeFormulaResults(specConfig) {
        var defs = (specConfig && specConfig.formulas) || {};
        var out = {};
        var ciCfg = (specConfig && specConfig.confidenceIntervals) || {};
        var wantCi = ciCfg.enabled !== false;
        Object.keys(defs).forEach(function (fname) {
            var r = Core.computeFormula(state.counts, defs[fname]);
            if (!r) return;
            out[fname] = { label: defs[fname].label || fname, type: r.type, display: r.display, value: r.value };
            // The imprecision quantified rather than only asserted (REF-001
            // §3.8, HA-093). Governed by the same setting as the percentage
            // intervals: a profile that suppresses one suppresses both.
            if (wantCi && r.type === 'ratio') {
                var ci = Core.ratioInterval(state.counts, defs[fname], ciCfg.level || 0.95);
                if (ci) {
                    out[fname].interval = ci;
                    out[fname].intervalText = Core.formatRatioInterval(
                        ci, typeof defs[fname].precision === 'number' ? defs[fname].precision : 1);
                }
            }
        });
        return out;
    }

    /** DOM id for a configured formula's value element. */
    function formulaElId(name) {
        return 'val-formula-' + String(name).replace(/[^A-Za-z0-9_-]/g, '-');
    }

    /** Categories counted but outside the differential denominator (URS-030). */
    function denominatorExcludes() {
        var sc = getSpecConfig();
        return (sc && sc.denominatorExcludes) || [];
    }

    /** The number of cells the percentages are computed over. */
    function getDifferentialTotal() {
        return Core.getDenominator(state.counts, denominatorExcludes());
    }

    /** The rounding policy and decimal precision this profile has chosen. */
    function roundingMethod() {
        var sc = getSpecConfig();
        return (sc && sc.rounding) || 'largest-remainder';
    }

    function precisionFor(which) {
        var sc = getSpecConfig();
        var p = (sc && sc.precision) || {};
        if (typeof p[which] === 'number') return p[which];
        return which === 'report' ? 0 : 2;
    }

    /** Displayed percentages, at the profile's precision and policy (URS-032, URS-034). */
    function displayPercentages() {
        return Core.percentagesSummingTo100(state.counts, precisionFor('display'), {
            exclude: denominatorExcludes(),
            method: roundingMethod()
        });
    }

    /**
     * Binomial confidence intervals for each category in the differential
     * (URS-037). Computed from the raw counts and the differential denominator,
     * never from the rounded percentage.
     */
    function computeIntervals() {
        var sc = getSpecConfig();
        var cfg = (sc && sc.confidenceIntervals) || {};
        if (cfg.enabled === false) return null;
        var excl = denominatorExcludes();
        var n = Core.getDenominator(state.counts, excl);
        if (n === 0) return null;
        var out = {};
        Object.keys(sc.outCodes).forEach(function (k) {
            var ct = sc.outCodes[k];
            if (excl.indexOf(ct) !== -1) return;
            out[ct] = Core.wilsonInterval(state.counts[ct] || 0, n, cfg.level);
        });
        return out;
    }

    /** Per-100 values for categories reported against the differential. */
    function computePer100Values() {
        var sc = getSpecConfig();
        var cfg = (sc && sc.per100Reporting) || {};
        var out = {};
        Object.keys(cfg).forEach(function (ct) {
            out[ct] = Core.computePer100(state.counts, ct, denominatorExcludes(),
                typeof cfg[ct].precision === 'number' ? cfg[ct].precision : 1);
        });
        return out;
    }

    // ================================================================
    // COUNTER TABLE RENDERING (Two-Row Layout)
    // ================================================================
    function renderCounterTable() {
        var specConfig = getSpecConfig();
        var outCodes = specConfig.outCodes;
        var categories = specConfig.categories;
        var area = el('counter-table-area');

        // Build reverse map: cellType -> key
        var cellToKey = {};
        Object.keys(outCodes).forEach(function (k) {
            cellToKey[outCodes[k]] = k;
        });

        var upperLabel = categories.upperLabel || 'Precursors';
        var lowerLabel = categories.lowerLabel || 'Mature';

        var html = '';
        html += '<div class="max-w-4xl mx-auto">';

        // When the profile's keys run along two adjacent keyboard rows, both
        // display rows share one column grid so each cell sits above the key
        // that counts it. Otherwise each row fills the width — see
        // Core.keyboardGrid for why that is usually the right default.
        var grid = Core.keyboardGrid(specConfig);

        html += renderRowGroup('upper', upperLabel, grid ? grid.upper : categories.upper,
            cellToKey, specConfig.upperRowAbnormal, specConfig);

        html += '<div class="mt-4">';
        html += renderRowGroup('lower', lowerLabel, grid ? grid.lower : categories.lower,
            cellToKey, false, specConfig);
        html += '</div>';

        // --- GRAND TOTAL ---
        html += '<div class="mt-4 flex items-center">';
        html += '<span class="flex-1 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Grand Total</span>';
        html += '<span class="text-2xl font-mono font-bold text-accent text-center shrink-0" ' +
            'style="width:' + TOTALS_COL + '" id="val-grand-total">0</span>';
        html += '</div>';

        // --- DERIVED FORMULAS ---
        // Every formula the profile defines is rendered, not just M:E. The
        // configuration is the element that carries institutional practice, so
        // the display must follow it rather than a fixed list.
        var formulas = specConfig.formulas || {};
        Object.keys(formulas).forEach(function (fname) {
            var f = formulas[fname];
            var isRatio = (f.type || 'ratio') === 'ratio';
            var tip = isRatio ? RATIO_IMPRECISION_NOTE : (f.basis || '');
            html += '<div class="mt-2 flex items-center">';
            html += '<span class="flex-1 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider"' +
                (tip ? ' title="' + Core.escapeAttr(tip) + '"' : '') + '>' +
                Core.escapeHtml(f.label || fname) +
                (tip ? ' <span class="text-[9px] text-slate-500">&#9662;</span>' : '') + '</span>';
            html += '<span class="text-lg font-mono font-semibold text-slate-300 text-center shrink-0" ' +
                'style="width:' + TOTALS_COL + '" id="' + formulaElId(fname) + '">N/A</span>';
            html += '</div>';
        });

        // --- PROGRESS BAR (toward target count) ---
        html += '<div class="mt-4">';
        html += '<div class="flex justify-between text-[11px] text-slate-500 mb-1">';
        html += '<span>Progress</span>';
        html += '<span id="progress-label">0 / ' + specConfig.targetCount + ' (target)</span>';
        html += '</div>';
        html += '<div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">';
        html += '<div id="progress-bar" class="h-full bg-blue-600 rounded-full transition-all duration-150" style="width: 0%"></div>';
        html += '</div>';
        html += '</div>';

        html += '</div>'; // max-w container

        area.innerHTML = html;

        renderMorphologyChecklist(specConfig);
    }

    function renderRowGroup(slot, label, cells, cellToKey, flagAbnormal, specConfig) {
        var html = '';
        var borderClass = flagAbnormal ? ' border border-dashed border-amber-500/50' : '';

        html += '<div class="overflow-x-auto' + borderClass + ' rounded-lg">';
        if (flagAbnormal) {
            var abnormalLabel = specConfig.upperRowAbnormalLabel || 'Abnormal in PB';
            html += '<div class="px-2 py-0.5 text-[10px] text-amber-400 font-medium uppercase tracking-wider">' +
                Core.escapeHtml(abnormalLabel) + '</div>';
        }
        html += '<table class="w-full border-collapse" style="' + ROW_TABLE_STYLE + '">';
        // The category columns take an equal share of what is left after the
        // totals column, which is what makes Sub land in the same place in
        // every row regardless of how many categories precede it.
        html += '<colgroup>';
        cells.forEach(function () { html += '<col>'; });
        html += '<col style="width:' + TOTALS_COL + '">';
        html += '</colgroup>';

        // Row 1: Cell type names (with tooltip for aggregated constituents)
        html += '<thead><tr>';
        cells.forEach(function (ct) {
            // A null slot is a key position this row does not use. It renders
            // as absence — no rule, no label, nothing to read — rather than as
            // an empty cell, which would look like a category that failed to
            // load.
            if (!ct) { html += '<th class="px-2 py-2"></th>'; return; }
            var titleAttr = '';
            var indicator = '';
            var tips = [];
            if (specConfig && specConfig.constituents && specConfig.constituents[ct]) {
                var constInfo = specConfig.constituents[ct];
                tips.push(constInfo.label + ': ' + constInfo.members.join(', '));
            }
            // Scope guidance for a category (URS-012). The bone marrow NDC
            // excludes specific cell types (ICSH 2008 §2.6); a general-purpose
            // category invites counting them, which would silently depress
            // every reported percentage. See RA-001 HA-090.
            if (specConfig && specConfig.categoryNotes && specConfig.categoryNotes[ct]) {
                tips.push(specConfig.categoryNotes[ct]);
            }
            if (tips.length) {
                titleAttr = ' title="' + Core.escapeAttr(tips.join(' — ')) + '"';
                indicator = ' <span class="text-[9px] text-slate-500">&#9662;</span>';
            }
            html += '<th class="px-2 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center border-b border-slate-700/50"' + titleAttr + '>' +
                Core.escapeHtml(ct) + indicator + '</th>';
        });
        html += '<th class="px-2 py-2 text-[11px] font-semibold text-accent uppercase tracking-wider text-center border-b border-slate-700/50 border-l border-slate-600">Sub</th>';
        html += '</tr></thead>';

        // Row 2: Count values
        html += '<tbody>';
        html += '<tr>';
        cells.forEach(function (ct) {
            if (!ct) { html += '<td></td>'; return; }
            html += '<td class="text-center border-b border-slate-800" id="cell-' + Core.escapeAttr(ct) + '">' +
                '<div class="py-3 mx-1 rounded-md transition-colors">' +
                '<span class="text-2xl font-mono font-bold text-slate-100" id="val-' + Core.escapeAttr(ct) + '">0</span>' +
                '</div></td>';
        });
        html += '<td class="text-center border-b border-slate-800 border-l border-slate-600 bg-slate-800/30">' +
            '<div class="py-3">' +
            '<span class="text-2xl font-mono font-bold text-accent" id="val-sub-' + slot + '">0</span>' +
            '</div></td>';
        html += '</tr>';

        // Row 3: Percentages
        html += '<tr>';
        cells.forEach(function (ct) {
            if (!ct) { html += '<td></td>'; return; }
            html += '<td class="text-center border-b border-slate-800/50">' +
                '<span class="text-xs font-mono text-slate-500" id="pct-' + Core.escapeAttr(ct) + '">0.00%</span>' +
                '</td>';
        });
        html += '<td class="text-center border-b border-slate-800/50 border-l border-slate-600">' +
            '<span class="text-xs font-mono text-slate-500" id="pct-sub-' + slot + '">&mdash;</span>' +
            '</td>';
        html += '</tr>';

        // Row 4: Key labels
        html += '<tr>';
        cells.forEach(function (ct) {
            if (!ct) { html += '<td></td>'; return; }
            var k = cellToKey[ct] || '?';
            html += '<td class="text-center py-1.5">' +
                '<kbd class="inline-block px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-semibold text-slate-400">' +
                Core.escapeHtml(k) + '</kbd></td>';
        });
        html += '<td class="text-center py-1.5 border-l border-slate-600">' +
            '<span class="text-xs text-slate-600">&mdash;</span></td>';
        html += '</tr>';

        html += '</tbody></table>';
        html += '</div>';

        // Row group caption
        html = '<div class="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 mb-1">' +
            Core.escapeHtml(label) + '</div>' + html;

        return html;
    }

    // ================================================================
    // MORPHOLOGY CHECKLIST (URS-072, URS-073)
    // ================================================================
    function renderMorphologyChecklist(specConfig) {
        var container = el('morphChecklistArea');
        if (!container) return;

        var checklist = specConfig.morphologyChecklist;
        if (!checklist || checklist.length === 0) {
            container.innerHTML = '';
            return;
        }

        var html = '<div class="flex flex-wrap gap-2 mb-2">';
        checklist.forEach(function (item, idx) {
            // Re-rendering the checklist (Continue Counting, specimen switch)
            // must not silently drop selections already made — URS-073.
            var checked = state.morphChecked.indexOf(item) !== -1 ? ' checked' : '';
            html += '<label class="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-400 cursor-pointer hover:bg-slate-800">';
            html += '<input type="checkbox" class="morph-check accent-accent" data-morph-idx="' + idx +
                '" value="' + Core.escapeAttr(item) + '"' + checked + '>';
            html += Core.escapeHtml(item);
            html += '</label>';
        });
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
            cb.addEventListener('focus', function () { state.commentFieldFocused = true; });
            cb.addEventListener('blur', function () { state.commentFieldFocused = false; });
            cb.addEventListener('change', function () { syncMorphChecked(); });
        });
    }

    function syncMorphChecked() {
        var items = [];
        document.querySelectorAll('.morph-check:checked').forEach(function (cb) {
            items.push(cb.value);
        });
        state.morphChecked = items;
        if (state.isCountingActive && autosaveIsEnabled()) saveAutosaveState();
    }

    function buildMorphologyOutput() {
        var freeText = el('morphComments') ? el('morphComments').value.trim() : '';
        if (state.morphChecked.length === 0) return freeText;
        var prefix = '[' + state.morphChecked.join(', ') + ']';
        return freeText ? prefix + ' ' + freeText : prefix;
    }

    function updateCounterDisplay() {
        var specConfig = getSpecConfig();
        if (!specConfig) return;
        var outCodes = specConfig.outCodes;
        var categories = specConfig.categories;
        var total = getDifferentialTotal();
        var totalCounted = getTotal();
        var pcts = displayPercentages();
        var per100 = computePer100Values();
        var per100Cfg = specConfig.per100Reporting || {};

        // Update each cell value and percentage
        Object.keys(outCodes).forEach(function (k) {
            var ct = outCodes[k];
            var count = state.counts[ct] || 0;

            var valEl = el('val-' + ct);
            if (valEl) valEl.textContent = count;

            var pctEl = el('pct-' + ct);
            if (!pctEl) return;
            if (pcts[ct] === null) {
                // Outside the differential: report per 100 of it, not as a
                // percentage of a denominator this category is not part of.
                if (Object.prototype.hasOwnProperty.call(per100Cfg, ct)) {
                    var v = per100[ct];
                    pctEl.textContent = (v === null ? 'N/A' : v + '/100');
                    pctEl.title = per100Cfg[ct].label || (ct + ' per 100');
                } else {
                    pctEl.textContent = '—';
                }
            } else {
                pctEl.textContent = Core.formatPercent(pcts[ct] || 0, precisionFor('display'));
            }
        });

        // Subtotals
        var upperSub = 0;
        categories.upper.forEach(function (ct) { upperSub += (state.counts[ct] || 0); });
        var lowerSub = 0;
        categories.lower.forEach(function (ct) { lowerSub += (state.counts[ct] || 0); });

        var upperSubEl = el('val-sub-upper');
        if (upperSubEl) upperSubEl.textContent = upperSub;
        var lowerSubEl = el('val-sub-lower');
        if (lowerSubEl) lowerSubEl.textContent = lowerSub;

        // Subtotal percentages are the SUM OF THE DISPLAYED CELL PERCENTAGES,
        // not an independent calculation over the raw counts.
        //
        // They used to be computed as (rowTotal / denominator) * 100 and
        // rounded on their own, while the cells above them went through the
        // profile's rounding policy. At `precision.display: 0` the two
        // disagree visibly — a row of 33/33/34 under a subtotal reading 99 —
        // and a reader who adds up the column is right and the footer is
        // wrong. The invariant that matters here is that the row reconciles.
        //
        // A category outside the differential has no percentage and simply
        // does not contribute; its count is reported per 100 instead.
        var excl = denominatorExcludes();
        var displayed = displayPercentages();
        var sumRow = function (row) {
            var sum = 0;
            row.forEach(function (ct) {
                var v = displayed[ct];
                if (typeof v === 'number') sum += v;
            });
            return sum;
        };

        var upperPctEl = el('pct-sub-upper');
        if (upperPctEl) {
            upperPctEl.textContent = total > 0
                ? Core.formatPercent(sumRow(categories.upper), precisionFor('display')) : '—';
        }
        var lowerPctEl = el('pct-sub-lower');
        if (lowerPctEl) {
            lowerPctEl.textContent = total > 0
                ? Core.formatPercent(sumRow(categories.lower), precisionFor('display')) : '—';
        }

        // Grand total — shows the differential denominator, and the overall
        // tally alongside it when the two differ.
        var grandTotalEl = el('val-grand-total');
        if (grandTotalEl) {
            grandTotalEl.textContent = total === totalCounted
                ? String(total)
                : total + ' + ' + (totalCounted - total);
            grandTotalEl.title = total === totalCounted ? ''
                : total + ' in the differential, ' + (totalCounted - total) +
                  ' counted outside it (' + excl.join(', ') + ')';
        }

        // Derived formulas
        var formulaDefs = specConfig.formulas || {};
        Object.keys(formulaDefs).forEach(function (fname) {
            var node = el(formulaElId(fname));
            if (!node) return;
            var r = Core.computeFormula(state.counts, formulaDefs[fname]);
            node.textContent = (r && r.display) || 'N/A';
        });

        // Progress bar — against the differential, matching the target's meaning
        var targetCount = specConfig.targetCount;
        var pctProgress = Math.min((total / targetCount) * 100, 100);
        var bar = el('progress-bar');
        if (bar) {
            bar.style.width = pctProgress + '%';
            bar.className = total >= targetCount
                ? 'h-full bg-emerald-500 rounded-full transition-all duration-150'
                : 'h-full bg-blue-600 rounded-full transition-all duration-150';
        }
        var progressLabel = el('progress-label');
        if (progressLabel) {
            progressLabel.textContent = total + ' / ' + targetCount + ' (target)';
            // Must revert when Shift+key takes the count back below target.
            if (total >= targetCount) {
                progressLabel.classList.add('text-emerald-400');
                progressLabel.classList.remove('text-slate-500');
            } else {
                progressLabel.classList.remove('text-emerald-400');
                progressLabel.classList.add('text-slate-500');
            }
        }
    }

    function flashCell(cellType, direction) {
        var cellEl = el('cell-' + cellType);
        if (!cellEl) return;
        var inner = cellEl.querySelector('div');
        if (!inner) return;
        var cls = direction === 'increment' ? 'flash-increment' : 'flash-decrement';
        inner.classList.remove('flash-increment', 'flash-decrement');
        void inner.offsetWidth; // force reflow
        inner.classList.add(cls);
        setTimeout(function () { inner.classList.remove(cls); }, 250);
    }

    // ================================================================
    // SESSION CONSTRUCTION (URS-052)
    // ================================================================
    /**
     * Build the immutable record of a count.
     * Carries the full traceability set required by URS-052: profile id, name
     * and version, target count, and timestamp — so any reported result can be
     * audited back to the counting parameters that produced it.
     */
    function buildSession(extra) {
        var specConfig = getSpecConfig();
        var excl = denominatorExcludes();
        var totalCounted = getTotal();
        var differentialTotal = getDifferentialTotal();
        var percentages = displayPercentages();
        var meta = state.configMeta || {};
        var roundingPolicy = roundingMethod();

        var session = {
            caseNumber: state.caseNumber,
            specimenType: state.specimenType,
            specimenLabel: getSpecLabel(),
            timestamp: new Date().toISOString(),
            configProfileId: meta.profileId || '',
            configProfileName: meta.profileName || '',
            configVersion: meta.version || '',
            targetCount: specConfig.targetCount,
            rounding: roundingPolicy,
            displayPrecision: precisionFor('display'),
            reportPrecision: precisionFor('report'),
            totalCount: totalCounted,
            differentialTotal: differentialTotal,
            denominatorExcludes: excl.slice(),
            per100: computePer100Values(),
            confidenceIntervals: computeIntervals(),
            confidenceLevel: (specConfig.confidenceIntervals &&
                specConfig.confidenceIntervals.level) || 0.95,
            counts: Object.assign({}, state.counts),
            percentages: percentages,
            meRatio: computeMERatio(specConfig),
            formulaResults: computeFormulaResults(specConfig),
            methodEntries: Core.buildMethodStatement(specConfig, state.configMeta),
            methodNotes: Core.formatMethodStatement(
                Core.buildMethodStatement(specConfig, state.configMeta), ' '),
            thresholds: Core.evaluateThresholds(state.counts, specConfig,
                (specConfig.confidenceIntervals && specConfig.confidenceIntervals.level) || 0.95),
            morphologyComments: buildMorphologyOutput(),
            // The advisory target counts classified cells, so it is measured
            // against the differential rather than the overall tally.
            lowCountNote: Core.buildLowCountNote(differentialTotal, specConfig.targetCount,
                (specConfig.confidenceIntervals && specConfig.confidenceIntervals.level) || 0.95,
                specConfig.targetCountBasis),
            outputs: {}
        };

        // Rendered institutional outputs (integer percentages, summing to 100)
        var intPcts = Core.percentagesSummingTo100(state.counts, precisionFor('report'),
            { exclude: excl, method: roundingPolicy });
        var values = Core.buildTemplateValues(session, intPcts);
        specConfig.templates.forEach(function (tpl) {
            session.outputs[tpl.tplCode] = Core.renderTemplate(tpl.outSentence, values);
        });

        if (extra) {
            Object.keys(extra).forEach(function (k) { session[k] = extra[k]; });
        }
        return session;
    }

    // ================================================================
    // COUNT FINALIZATION (SYS-054 to SYS-056)
    // ================================================================
    function finalizeCount() {
        state.isCountingActive = false;
        document.removeEventListener('keydown', onKeyDown);
        clearAutosaveState();

        var session = buildSession();
        addToHistory(session);

        showPhase('results');
        renderResults(session);
        setStateLabel('Complete');
    }

    // ================================================================
    // RESUME COUNTING (URS-042)
    // ================================================================
    function resumeCounting() {
        state.isCountingActive = true;
        state.targetReachedNotified = false;

        showPhase('counting');
        renderCounterTable();     // restores morphology checkboxes from state
        updateCounterDisplay();
        updateCaseBadge();
        setStateLabel('Counting');

        var caseInput = el('caseNumber');
        caseInput.readOnly = true;
        caseInput.blur();
        setSpecimenSelectValue(state.specimenType);

        document.addEventListener('keydown', onKeyDown);
    }

    // ================================================================
    // RESULTS RENDERING
    // ================================================================
    /**
     * The contents of one output panel — the text the clipboard copies.
     *
     * Extracted so that re-rendering after an analyser WBC is entered produces
     * byte-identical output to the original render. Rebuilding it separately
     * is how the provenance stamp or the morphology line quietly goes missing
     * from one path and not the other.
     */
    function buildOutputPanelHtml(session, tpl) {
        var out = '';
        if (session.caseNumber) {
            out += '<strong>Case: ' + Core.escapeHtml(session.caseNumber) + '</strong><br><br>';
        }
        out += session.outputs[tpl.tplCode] || '';
        if (session.morphologyComments) {
            out += '<br><br><em>Morphology: ' + Core.escapeHtml(session.morphologyComments) + '</em>';
        }
        // URS-052 requires the configuration profile and version in ALL output.
        // The clipboard copies this panel, and it is the primary route into the
        // LIS, so the attribution must live here rather than only on the
        // surrounding screen.
        out += '<br><br>[' + Core.escapeHtml(session.configProfileId) +
            ' v' + Core.escapeHtml(session.configVersion) + ' &middot; ' +
            Core.escapeHtml(new Date(session.timestamp).toLocaleString()) + ']';
        return out;
    }

    function renderResults(session) {
        var specConfig = getSpecConfigForType(session.specimenType) || getSpecConfig();
        var categories = specConfig.categories;
        var allCells = categories.upper.concat(categories.lower);

        // --- Summary ---
        var summaryHtml = '<div class="flex items-center justify-between mb-3">';
        summaryHtml += '<div>';
        if (session.caseNumber) {
            summaryHtml += '<span class="text-xs text-slate-500 uppercase tracking-wider">Case</span> ';
            summaryHtml += '<span class="font-mono font-semibold text-accent text-sm">' + Core.escapeHtml(session.caseNumber) + '</span>';
            summaryHtml += '<span class="mx-2 text-slate-600">|</span>';
        }
        summaryHtml += '<span class="text-xs text-slate-400">' + Core.escapeHtml(session.specimenLabel) + '</span>';
        summaryHtml += '</div>';
        var diffTotal = typeof session.differentialTotal === 'number'
            ? session.differentialTotal : session.totalCount;
        summaryHtml += '<span class="text-xs font-mono text-slate-400">' + diffTotal + ' cells';
        if (diffTotal !== session.totalCount) {
            summaryHtml += ' <span class="text-slate-500">(+' + (session.totalCount - diffTotal) +
                ' outside differential)</span>';
        }
        summaryHtml += '</span>';
        summaryHtml += '</div>';

        // Compact cell summary
        summaryHtml += '<div class="flex flex-wrap gap-2">';
        allCells.forEach(function (ct) {
            var pct = session.percentages[ct];
            var per100 = session.per100 && session.per100[ct];
            summaryHtml += '<div class="flex items-baseline gap-1 px-2 py-1 bg-slate-800 rounded text-xs">';
            summaryHtml += '<span class="text-slate-500 uppercase">' + Core.escapeHtml(ct) + '</span>';
            if (pct === null) {
                summaryHtml += '<span class="font-mono font-semibold text-amber-300">' +
                    (per100 === null || per100 === undefined ? 'N/A' : per100 + '/100') + '</span>';
            } else {
                var dp = typeof session.displayPrecision === 'number' ? session.displayPrecision : 2;
                summaryHtml += '<span class="font-mono font-semibold text-slate-300">' +
                    (typeof pct === 'number' ? pct.toFixed(dp) : (0).toFixed(dp)) + '%</span>';
                // The count is a sample; the interval states how much of the
                // reported figure is sampling error (URS-037).
                var ci = session.confidenceIntervals && session.confidenceIntervals[ct];
                if (ci) {
                    summaryHtml += '<span class="font-mono text-[10px] text-slate-500" ' +
                        'title="' + Core.escapeAttr(Math.round((session.confidenceLevel || 0.95) * 100) +
                        '% confidence interval from ' + ci.n + ' cells counted') + '">' +
                        Core.escapeHtml(Core.formatInterval(ci, 1)) + '</span>';
                }
            }
            summaryHtml += '</div>';
        });
        summaryHtml += '</div>';

        var fr = session.formulaResults || {};
        var frNames = Object.keys(fr);
        if (frNames.length) {
            summaryHtml += '<div class="mt-3 text-sm text-slate-300 border-t border-slate-700/50 pt-2 ' +
                'flex flex-wrap gap-x-5 gap-y-1">';
            frNames.forEach(function (fname) {
                var r = fr[fname];
                var tip = r.type === 'ratio' ? RATIO_IMPRECISION_NOTE : '';
                summaryHtml += '<span>';
                summaryHtml += '<span class="text-slate-500 text-xs font-medium uppercase"' +
                    (tip ? ' title="' + Core.escapeAttr(tip) + '"' : '') + '>' +
                    Core.escapeHtml(r.label) + ':</span> ';
                summaryHtml += '<span class="font-mono font-semibold">' +
                    Core.escapeHtml(r.display) + '</span>';
                if (r.intervalText) {
                    var lvl = Math.round((r.interval.level || 0.95) * 100);
                    summaryHtml += '<span class="font-mono text-xs text-slate-500 ml-1"' +
                        ' title="' + Core.escapeAttr(lvl + '% confidence interval, from ' +
                            r.interval.n + ' cells in the ratio') + '">' +
                        Core.escapeHtml(r.intervalText) + '</span>';
                }
                summaryHtml += '</span>';
            });
            summaryHtml += '</div>';
        }

        if (session.morphologyComments) {
            summaryHtml += '<div class="mt-3 text-xs text-slate-400 italic border-t border-slate-700/50 pt-2">';
            summaryHtml += '<span class="text-slate-500 not-italic font-medium">Morphology:</span> ' +
                Core.escapeHtml(session.morphologyComments);
            summaryHtml += '</div>';
        }

        // Traceability footer (URS-052) and method provenance (URS-055).
        // The identifier says which profile; the method statement says what
        // that profile does, which is what a reader needs to compare this
        // result against another.
        summaryHtml += '<div class="mt-3 pt-2 border-t border-slate-700/50 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">';
        summaryHtml += '<span>Profile: ' + Core.escapeHtml(session.configProfileName || session.configProfileId) +
            ' (' + Core.escapeHtml(session.configProfileId) + ' v' + Core.escapeHtml(session.configVersion) + ')</span>';
        summaryHtml += '<span>Counted: ' + Core.escapeHtml(new Date(session.timestamp).toLocaleString()) + '</span>';
        summaryHtml += '</div>';

        var method = session.methodEntries || [];
        if (method.length) {
            summaryHtml += '<details class="mt-2 group">';
            summaryHtml += '<summary class="cursor-pointer text-[11px] text-slate-500 hover:text-slate-400 ' +
                'uppercase tracking-wider">Method</summary>';
            summaryHtml += '<dl class="mt-1 text-[11px] text-slate-500 space-y-0.5">';
            method.forEach(function (e) {
                summaryHtml += '<div><dt class="inline font-medium text-slate-400">' +
                    Core.escapeHtml(e.label) + ':</dt> <dd class="inline">' +
                    Core.escapeHtml(e.text) + '</dd></div>';
            });
            summaryHtml += '</dl>';
            summaryHtml += '<p class="mt-2"><a href="methods.html" target="_blank" rel="noopener" ' +
                'class="text-accent hover:underline">How these figures are calculated, and their limitations &rarr;</a>';
            summaryHtml += ' <span class="text-slate-600">&middot;</span> ';
            summaryHtml += '<a href="calculation-reference.html" target="_blank" rel="noopener" ' +
                'class="text-accent hover:underline">Full calculation reference &rarr;</a></p>';
            summaryHtml += '</details>';
        }

        el('results-summary').innerHTML = summaryHtml;

        // --- Low count advisory (URS-041) — informational, never blocking ---
        var noteEl = el('low-count-note');
        if (noteEl) {
            if (session.lowCountNote) {
                noteEl.textContent = session.lowCountNote;
                noteEl.classList.remove('hidden');
            } else {
                noteEl.textContent = '';
                noteEl.classList.add('hidden');
            }
        }

        // --- Near-threshold advisory (URS-038) ---
        renderThresholdNote(session);

        // --- Absolute Counts (URS-036) ---
        renderAbsoluteCountsSection(session);

        // --- Output Tabs ---
        var templates = specConfig.templates;
        var tabNavHtml = '';
        var tabPanelsHtml = '';

        templates.forEach(function (tpl, idx) {
            var isActive = idx === 0;
            tabNavHtml += '<button class="tab-btn px-4 py-2 text-sm font-medium transition-colors ' +
                (isActive ? 'tab-active text-accent' : 'text-slate-500 hover:text-slate-300') +
                '" data-tab-idx="' + idx + '">' +
                Core.escapeHtml(tpl.tplName) + '</button>';

            var outputContent = buildOutputPanelHtml(session, tpl);

            tabPanelsHtml += '<div class="tab-panel ' + (isActive ? '' : 'hidden') + '" data-tab-idx="' + idx + '">';
            tabPanelsHtml += '<div class="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 leading-relaxed font-mono">';
            tabPanelsHtml += outputContent;
            tabPanelsHtml += '</div></div>';
        });

        el('tab-nav').innerHTML = tabNavHtml;
        el('tab-panels').innerHTML = tabPanelsHtml;

        document.querySelectorAll('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = btn.getAttribute('data-tab-idx');
                document.querySelectorAll('.tab-btn').forEach(function (b) {
                    b.classList.remove('tab-active', 'text-accent');
                    b.classList.add('text-slate-500');
                });
                btn.classList.add('tab-active', 'text-accent');
                btn.classList.remove('text-slate-500');
                document.querySelectorAll('.tab-panel').forEach(function (p) {
                    p.classList.add('hidden');
                });
                var panel = document.querySelector('.tab-panel[data-tab-idx="' + idx + '"]');
                if (panel) panel.classList.remove('hidden');
            });
        });
    }

    // ================================================================
    // NEAR-THRESHOLD ADVISORY (URS-038, ICSH 2008 §2.6)
    // ================================================================

    /**
     * Warn when the count does not settle a question it is being used to
     * answer: the confidence interval for a category spans a configured
     * diagnostic threshold, so the observed value sits on one side while the
     * count does not establish which side the true value lies on.
     *
     * Advisory only. URS-041 establishes that this application does not block
     * completion, and the same reasoning applies here — a paucicellular
     * aspirate may make an extended count impossible, and the operator is the
     * one who knows that.
     */
    function renderThresholdNote(session) {
        var box = el('threshold-note');
        var body = el('threshold-note-body');
        if (!box || !body) return;

        var spanning = (session.thresholds || []).filter(function (t) { return t.spans; });
        if (spanning.length === 0) {
            box.classList.add('hidden');
            body.innerHTML = '';
            return;
        }

        var html = '';
        spanning.forEach(function (t) {
            html += '<p>';
            html += 'The ' + Math.round((session.confidenceLevel || 0.95) * 100) +
                '% interval for <strong>' + Core.escapeHtml(t.targetLabel) + '</strong> (' +
                Core.escapeHtml(Core.formatInterval(t.interval, 1)) + ', observed ' +
                t.observed.toFixed(1) + '% of ' + t.interval.n + ' cells) spans the ' +
                t.value + '% ' + Core.escapeHtml(t.label || 'threshold') + '.';
            if (t.basis) {
                html += ' <span class="text-amber-200/60">' + Core.escapeHtml(t.basis) + '</span>';
            }
            html += '</p>';
        });
        body.innerHTML = html;
        box.classList.remove('hidden');
    }

    // ================================================================
    // ABSOLUTE COUNTS (URS-036)
    // ================================================================
    function renderAbsoluteCountsSection(session) {
        var specConfig = getSpecConfigForType(session.specimenType) || getSpecConfig();
        var absSetting = specConfig.absoluteCounts || 'optional';
        var container = el('absolute-count-section');
        if (!container) return;

        if (absSetting === 'disabled') {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');

        var wbcInput = el('wbcTotal');
        if (!wbcInput) return;

        wbcInput.value = '';
        wbcInput.removeEventListener('input', onWbcTotalInput);
        wbcInput.addEventListener('input', onWbcTotalInput);
        wbcInput._session = session;

        // The NRBC correction only applies where nucleated red cells were
        // actually counted and kept out of the leucocyte denominator. Offering
        // the control otherwise would invite it to be used where it is wrong.
        var corrected = el('wbcAlreadyCorrected');
        var wrap = el('wbc-corrected-wrap');
        if (corrected && wrap) {
            corrected.checked = false;
            corrected.removeEventListener('change', onWbcTotalInput);
            corrected.addEventListener('change', onWbcTotalInput);
            wrap.classList.toggle('hidden', !(nrbcPer100For(session) > 0));
            wrap.classList.toggle('flex', nrbcPer100For(session) > 0);
        }

        var note = el('wbc-correction-note');
        if (note) { note.innerHTML = ''; note.classList.add('hidden'); }

        var absResults = el('abs-results');
        if (absResults) absResults.innerHTML = '';
    }

    /**
     * Nucleated red cells per 100 leucocytes for this session, or 0.
     *
     * Only a category that is counted but held OUTSIDE the differential
     * denominator inflates an analyser WBC in the way the correction assumes.
     * In a marrow profile erythroblasts sit inside the nucleated differential
     * count and no such correction applies.
     */
    function nrbcPer100For(session) {
        if (!session || !session.per100) return 0;
        var excl = session.denominatorExcludes || [];
        if (excl.indexOf('nrbc') === -1) return 0;
        var v = session.per100.nrbc;
        return (typeof v === 'number' && isFinite(v) && v > 0) ? v : 0;
    }

    function onWbcTotalInput() {
        var wbcInput = el('wbcTotal');
        var absResults = el('abs-results');
        if (!wbcInput || !absResults) return;

        var session = wbcInput._session;
        if (!session) return;

        var wbc = parseFloat(wbcInput.value);
        if (isNaN(wbc) || wbc <= 0) {
            absResults.innerHTML = '';
            return;
        }

        var specConfig = getSpecConfigForType(session.specimenType) || getSpecConfig();
        var allCells = specConfig.categories.upper.concat(specConfig.categories.lower);

        // An analyser counts nucleated red cells as leucocytes, so its WBC is
        // inflated whenever they circulate and every absolute count derived
        // from it is overstated by the same factor. The correction is SHOWN,
        // never applied silently: changing a number the operator typed without
        // saying so is its own hazard, and only the operator knows whether the
        // analyser already corrected it.
        var nrbcPer100 = nrbcPer100For(session);
        var alreadyCorrected = !!(el('wbcAlreadyCorrected') && el('wbcAlreadyCorrected').checked);
        var applyCorrection = nrbcPer100 > 0 && !alreadyCorrected;
        var leucocyteWbc = applyCorrection ? Core.correctWbcForNrbc(wbc, nrbcPer100) : wbc;

        renderWbcCorrectionNote(wbc, leucocyteWbc, nrbcPer100, alreadyCorrected);

        var html = '<div class="flex flex-wrap gap-2 mt-2">';
        allCells.forEach(function (ct) {
            // A category outside the differential has no percentage of the WBC
            // population, so no absolute count can be derived from a WBC.
            if (session.percentages[ct] === null) return;
            // Derived from the same displayed percentages as the table and the
            // report, so the three can never disagree (FMEA HA-024).
            var abs = Core.computeAbsolute(leucocyteWbc, session.percentages[ct] || 0);
            html += '<div class="flex items-baseline gap-1 px-2 py-1 bg-slate-800 rounded text-xs">';
            html += '<span class="text-slate-500 uppercase">' + Core.escapeHtml(ct) + '</span>';
            html += '<span class="font-mono font-semibold text-emerald-400">' + abs.toFixed(2) + '</span>';
            html += '</div>';
        });
        html += '</div>';
        absResults.innerHTML = html;

        // The report is rendered at Count Done, before the analyser WBC exists.
        // A profile that asks for absolute counts in the report therefore needs
        // it re-rendered once the WBC is known.
        if (specConfig.absoluteCountsInReport) {
            session.wbcEntered = wbc;
            session.wbcUsed = leucocyteWbc;
            session.wbcBasis = applyCorrection
                ? ('corrected for ' + nrbcPer100.toFixed(1) + ' NRBC per 100 WBC (entered ' +
                   wbc.toFixed(2) + ')')
                : (nrbcPer100 > 0
                    ? 'entered as an already-corrected leucocyte count'
                    : 'as entered; no nucleated red cells counted');
            session.absolutes = {};
            allCells.forEach(function (ct) {
                if (session.percentages[ct] === null) return;
                session.absolutes[ct] = Core.computeAbsolute(leucocyteWbc, session.percentages[ct] || 0);
            });
            rerenderOutputs(session, specConfig);
        }
    }

    /**
     * Re-render the institutional outputs for a session whose absolute counts
     * have just become available, and refresh what is on screen.
     *
     * Only the derived absolute figures change; the counts, the percentages and
     * the provenance stamp are the same count they always were.
     */
    function rerenderOutputs(session, specConfig) {
        var excl = session.denominatorExcludes || [];
        var intPcts = Core.percentagesSummingTo100(state.counts, precisionFor('report'),
            { exclude: excl, method: specConfig.rounding || 'largest-remainder' });
        var values = Core.buildTemplateValues(session, intPcts);
        specConfig.templates.forEach(function (tpl) {
            session.outputs[tpl.tplCode] = Core.renderTemplate(tpl.outSentence, values);
        });

        // Replace only the panel contents. Re-running renderResults would
        // rebuild the WBC field and wipe the value the operator just typed.
        var panels = document.querySelectorAll('#tab-panels .tab-panel');
        specConfig.templates.forEach(function (tpl, idx) {
            var panel = panels[idx];
            if (!panel) return;
            var box = panel.firstElementChild;
            if (box) box.innerHTML = buildOutputPanelHtml(session, tpl);
        });
    }

    /**
     * State the basis of the absolute counts, always — including when no
     * correction was applied. A figure whose basis is unstated cannot be
     * checked by whoever reads it next.
     */
    function renderWbcCorrectionNote(entered, used, nrbcPer100, alreadyCorrected) {
        var note = el('wbc-correction-note');
        if (!note) return;

        if (!(nrbcPer100 > 0)) {
            note.innerHTML = '';
            note.classList.add('hidden');
            return;
        }

        var html = '';
        if (alreadyCorrected) {
            html += '<p class="text-amber-200/90"><strong>Taken as a corrected leucocyte count.</strong></p>';
            html += '<p class="mt-1 text-amber-200/70">' +
                nrbcPer100.toFixed(1) + ' NRBC per 100 WBC were counted. You have indicated the ' +
                'entered value already excludes them, so it is used as it stands.</p>';
        } else {
            var factor = 100 / (100 + nrbcPer100);
            html += '<p class="text-amber-200/90"><strong>Corrected for nucleated red cells.</strong></p>';
            html += '<p class="mt-1 font-mono text-amber-200/90">' +
                entered.toFixed(2) + ' &times; 100 &divide; (100 + ' + nrbcPer100.toFixed(1) + ') = ' +
                '<strong>' + used.toFixed(2) + '</strong> &times;10&#8313;/L';
            html += '</p>';
            html += '<p class="mt-1 text-amber-200/70">Analysers count NRBC as leucocytes, so the ' +
                'reported WBC is inflated when they circulate. Absolute counts below use the ' +
                'corrected value &mdash; ' + Math.round((1 - factor) * 100) + '% lower than the ' +
                'figure entered. If your analyser already corrected it, tick the box above.</p>';
        }
        note.innerHTML = html;
        note.classList.remove('hidden');
    }

    // ================================================================
    // SESSION HISTORY RENDERING (SYS-092, SYS-093)
    // ================================================================
    function renderHistoryList() {
        var section = el('session-history-section');
        var list = el('history-list');
        var countEl = el('history-count');
        if (!section || !list) return;

        if (state.sessionHistory.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        countEl.textContent = '(' + state.sessionHistory.length + ')';

        var html = '';
        state.sessionHistory.slice().reverse().forEach(function (session, revIdx) {
            var idx = state.sessionHistory.length - 1 - revIdx;
            var time = new Date(session.timestamp).toLocaleTimeString();
            var caseDisplay = session.caseNumber || '(no case #)';
            html += '<button class="history-entry w-full text-left flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors" data-hist-idx="' + idx + '">';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="font-mono text-sm text-accent">' + Core.escapeHtml(caseDisplay) + '</span>';
            html += '<span class="text-xs text-slate-500 uppercase">' + Core.escapeHtml(session.specimenLabel) + '</span>';
            html += '</div>';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="text-xs font-mono text-slate-400">' + session.totalCount + ' cells</span>';
            html += '<span class="text-xs text-slate-600">' + Core.escapeHtml(time) + '</span>';
            html += '</div>';
            html += '</button>';
        });

        list.innerHTML = html;

        document.querySelectorAll('.history-entry').forEach(function (entry) {
            entry.addEventListener('click', function () {
                var idx = parseInt(entry.getAttribute('data-hist-idx'), 10);
                showHistoryDetail(state.sessionHistory[idx]);
            });
        });
    }

    function showHistoryDetail(session) {
        var modal = el('history-modal');
        var title = el('history-modal-title');
        var content = el('history-modal-content');

        title.textContent = session.caseNumber ? 'Case ' + session.caseNumber : '(no case #)';

        var html = '';
        html += '<div class="space-y-3">';
        html += '<div class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">';
        html += '<span><strong>Specimen:</strong> ' + Core.escapeHtml(session.specimenLabel) + '</span>';
        html += '<span><strong>Total:</strong> ' + session.totalCount + ' cells</span>';
        html += '<span><strong>Time:</strong> ' + Core.escapeHtml(new Date(session.timestamp).toLocaleString()) + '</span>';
        if (session.meRatio) {
            html += '<span><strong>M:E Ratio:</strong> ' + Core.escapeHtml(session.meRatio) + '</span>';
        }
        if (session.configProfileId) {
            html += '<span><strong>Profile:</strong> ' + Core.escapeHtml(session.configProfileId) +
                ' v' + Core.escapeHtml(session.configVersion) + '</span>';
        }
        html += '</div>';

        // Counts table
        var cellKeys = Object.keys(session.counts || {});
        html += '<div class="overflow-x-auto mt-2">';
        html += '<table class="w-full text-xs">';
        html += '<tr class="border-b border-slate-700">';
        cellKeys.forEach(function (ct) {
            html += '<th class="px-2 py-1 text-slate-500 uppercase font-medium text-center">' + Core.escapeHtml(ct) + '</th>';
        });
        html += '</tr><tr>';
        cellKeys.forEach(function (ct) {
            html += '<td class="px-2 py-1 font-mono text-center text-slate-300">' + session.counts[ct] + '</td>';
        });
        html += '</tr><tr>';
        cellKeys.forEach(function (ct) {
            var p = session.percentages ? session.percentages[ct] : undefined;
            var pc = session.per100 && session.per100[ct];
            // The precision the session was counted at, not a hard-coded 2.
            // A profile set to whole numbers showed 33.00% in history and 33%
            // everywhere else, for the same count.
            var hdp = typeof session.displayPrecision === 'number' ? session.displayPrecision : 2;
            html += '<td class="px-2 py-1 font-mono text-center text-slate-500">' +
                (p === null
                    ? (pc === null || pc === undefined ? 'N/A' : pc + '/100')
                    : (typeof p === 'number' ? p.toFixed(hdp) + '%' : (0).toFixed(hdp) + '%')) + '</td>';
        });
        html += '</tr></table></div>';

        if (session.lowCountNote) {
            html += '<div class="text-xs text-amber-400/80 mt-2">' + Core.escapeHtml(session.lowCountNote) + '</div>';
        }
        if (session.morphologyComments) {
            html += '<div class="text-xs text-slate-400 italic mt-2">Morphology: ' +
                Core.escapeHtml(session.morphologyComments) + '</div>';
        }

        var specConfig = getSpecConfigForType(session.specimenType);
        if (specConfig) {
            specConfig.templates.forEach(function (tpl) {
                if (session.outputs && session.outputs[tpl.tplCode]) {
                    html += '<div class="mt-3">';
                    html += '<div class="text-xs font-medium text-slate-500 mb-1">' + Core.escapeHtml(tpl.tplName) + ':</div>';
                    html += '<div class="p-3 bg-slate-900 rounded border border-slate-700 text-xs font-mono text-slate-400 leading-relaxed">';
                    html += session.outputs[tpl.tplCode];  // already sanitized at build time
                    html += '</div></div>';
                }
            });
        }

        html += '</div>';
        content.innerHTML = html;
        modal.classList.remove('hidden');
    }

    // ================================================================
    // SESSION EXPORT (CSV / JSON) — URS-084
    // ================================================================
    function exportSessionJson() {
        if (!state.sessionHistory.length) return;
        downloadFile(Core.buildSessionJson(state.sessionHistory), 'application/json', buildExportFilename('json'));
    }

    function exportSessionCsv() {
        if (!state.sessionHistory.length) return;
        downloadFile(Core.buildSessionCsv(state.sessionHistory), 'text/csv', buildExportFilename('csv'));
    }

    function downloadFile(content, mimeType, filename) {
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(function () {
            URL.revokeObjectURL(url);
            link.remove();
        }, 0);
    }

    function buildExportFilename(ext) {
        var stamp = new Date().toISOString().replace(/[:.]/g, '-');
        return 'wbcds-session-' + stamp + '.' + ext;
    }

    // ================================================================
    // CONFIG IMPORT/EXPORT (URS-103)
    // ================================================================
    function exportConfig() {
        try {
            var meta = state.configMeta || {};
            var raw = loadCachedConfig() || {
                version: meta.version || '2.0',
                profileId: meta.profileId || 'custom',
                profileName: meta.profileName || 'Custom Profile',
                specimenTypes: state.config
            };
            var stamp = new Date().toISOString().replace(/[:.]/g, '-');
            downloadFile(JSON.stringify(raw, null, 2), 'application/json',
                'wbcds-config-' + (raw.profileId || 'custom') + '-' + stamp + '.json');
        } catch (e) {
            showAlert('Export Failed', 'Could not export the configuration: ' + e.message);
        }
    }

    function importConfig(file) {
        var reader = new FileReader();
        reader.onload = function (ev) {
            var raw;
            try {
                raw = JSON.parse(ev.target.result);
            } catch (e) {
                showAlert('Import Error', 'Could not parse JSON: ' + e.message);
                return;
            }
            var prepared = prepareConfig(raw);
            if (!prepared.ok) {
                showAlert('Import Error',
                    'Invalid configuration: ' + prepared.errors.slice(0, 4).join('; '));
                return;
            }
            state.config = prepared.specimenTypes;
            state.configMeta = prepared.meta;
            cacheConfig(raw);
            populateSpecimenSelect();
            resetToStart();
            showAlert('Configuration Imported',
                'Profile "' + prepared.meta.profileName + '" (v' + prepared.meta.version + ') loaded successfully.');
        };
        reader.onerror = function () {
            showAlert('Import Error', 'Could not read the selected file.');
        };
        reader.readAsText(file);
    }

    // ================================================================
    // RESET (SYS-080 to SYS-084)
    // ================================================================
    function resetToStart() {
        state.isCountingActive = false;
        document.removeEventListener('keydown', onKeyDown);

        state.counts = {};
        state.caseNumber = '';
        state.commentFieldFocused = false;
        state.targetReachedNotified = false;
        state.morphChecked = [];

        clearAutosaveState();

        var caseInput = el('caseNumber');
        caseInput.value = '';
        caseInput.readOnly = false;

        if (el('morphComments')) {
            el('morphComments').value = '';
            el('commentCharCount').textContent = '0 / 500';
        }

        var area = el('counter-table-area');
        if (area) area.innerHTML = '';

        // URS-063: specimen type is preserved across reset
        setSpecimenSelectValue(state.specimenType);

        showPhase('case-entry');
        hideCaseBadge();
        setStateLabel('Ready');

        setTimeout(function () { caseInput.focus(); }, 100);
    }

    // ================================================================
    // MODAL (confirmation dialogs)
    // ================================================================
    function showModal(title, message, confirmText, onConfirm, cancelText, onCancel, opts) {
        // One dialog implementation for the whole product (wbc-dialog.js).
        // The counter and the configuration editor previously disagreed: this
        // one was styled and modal, the editor used the browser's prompt().
        //
        // Cancel is always offered on a confirmation. Only showAlert()
        // suppresses it, and it does so explicitly — inferring "no cancel
        // handler means no cancel button" would strip the escape route from
        // destructive confirmations such as Reset (URS-061).
        WBCDialog.confirm(title, message, confirmText, onConfirm,
            cancelText || 'Cancel', onCancel, opts || {});
    }

    /**
     * Single-action acknowledgement dialog. Used where there is nothing to
     * decide — an error to read, or a result to confirm.
     */
    function showAlert(title, message, onOk) {
        WBCDialog.alert(title, message, onOk);
    }

    // ================================================================
    // PHASE MANAGEMENT
    // ================================================================
    function showPhase(phase) {
        state.phase = phase;
        el('phase-case-entry').classList.add('hidden');
        el('phase-counting').classList.add('hidden');
        el('phase-results').classList.add('hidden');

        var target = el('phase-' + phase);
        if (target) target.classList.remove('hidden');

        // Header logo appears only while working
        var headerLogo = el('header-logo');
        if (headerLogo) headerLogo.classList.toggle('hidden', phase === 'case-entry');

        // Specimen switcher is live only during counting (URS-010, URS-013)
        var specWrap = el('specimen-switch-wrap');
        if (specWrap) specWrap.classList.toggle('hidden', phase !== 'counting');

        document.body.classList.toggle('counting-active', phase === 'counting');
    }

    // ================================================================
    // UTILITIES
    // ================================================================
    function el(id) {
        return document.getElementById(id);
    }

    function getSpecConfig() {
        return getSpecConfigForType(state.specimenType);
    }

    function getSpecConfigForType(type) {
        if (!state.config) return null;
        for (var i = 0; i < state.config.length; i++) {
            if (state.config[i].specimenType === type) return state.config[i];
        }
        return null;
    }

    function getSpecLabel() {
        var sc = getSpecConfig();
        return (sc && sc.specimenLabel) || String(state.specimenType).toUpperCase();
    }

    function getSpecLabelForType(type) {
        var sc = getSpecConfigForType(type);
        return (sc && sc.specimenLabel) || String(type).toUpperCase();
    }

    function getTotal() {
        return Core.getTotal(state.counts);
    }

    function updateCaseBadge() {
        var badge = el('case-badge');
        badge.classList.remove('hidden');
        badge.classList.add('flex');
        el('case-badge-number').textContent = state.caseNumber || '';
        el('case-badge-spec').textContent = getSpecLabel();
    }

    function hideCaseBadge() {
        var badge = el('case-badge');
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }

    function setStateLabel(text) {
        el('state-label').textContent = text;
    }

    // ================================================================
    // TEST SEAM
    // ================================================================
    // Exposed so the verification suite can drive the real application code
    // rather than a re-implementation of it. Not used by the UI.
    if (typeof window !== 'undefined') {
        window.__wbcTestHooks = {
            state: state,
            getSpecConfig: getSpecConfig,
            onKeyDown: onKeyDown,
            buildSession: buildSession,
            finalizeCount: finalizeCount,
            resumeCounting: resumeCounting,
            resetToStart: resetToStart,
            switchSpecimenType: switchSpecimenType,
            restoreAutosaveState: restoreAutosaveState,
            renderResults: renderResults,
            updateCounterDisplay: updateCounterDisplay,
            buildMorphologyOutput: buildMorphologyOutput,
            exportConfig: exportConfig,
            importConfig: importConfig,
            resetConfigToDefault: resetConfigToDefault,
            openPresetCatalog: openPresetCatalog,
            loadPreset: loadPreset
        };
    }

    // ================================================================
    // BOOT
    // ================================================================
    loadConfig();

})();
