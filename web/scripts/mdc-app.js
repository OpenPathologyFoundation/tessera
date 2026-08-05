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
        configMeta: null,          // { version, profileId, profileName }
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
        document.body.setAttribute('data-theme', theme);
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

        init: function () {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { /* no audio support */ }
            // Restore saved preference
            try {
                var saved = sessionStorage.getItem(AUDIO_KEY);
                if (saved === 'off') {
                    this.enabled = false;
                    state.audioEnabled = false;
                }
            } catch (e) { /* graceful degradation */ }
        },

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
            this.enabled = !this.enabled;
            state.audioEnabled = this.enabled;
            try {
                sessionStorage.setItem(AUDIO_KEY, this.enabled ? 'on' : 'off');
            } catch (e) { /* graceful degradation */ }
            updateAudioToggle();
        }
    };

    function updateAudioToggle() {
        var label = el('audioLabel');
        var btn = el('btnToggleAudio');
        if (!label || !btn) return;
        label.textContent = AudioEngine.enabled ? 'Sound On' : 'Sound Off';
        btn.setAttribute('aria-pressed', String(AudioEngine.enabled));
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
                meta: { version: norm.version, profileId: norm.profileId, profileName: norm.profileName },
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

        // Both of these raise a modal, and the modal is a single shared
        // element: showing them in parallel would replace the recovery prompt
        // with the notice and silently cost the operator an interrupted count.
        // They are therefore sequenced.
        if (notice) {
            showAlert('Configuration Updated', notice, checkAutosaveRecovery);
        } else {
            checkAutosaveRecovery();
        }
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

    function loadAutosaveState() {
        try {
            var data = localStorage.getItem(AUTOSAVE_KEY);
            if (data) return JSON.parse(data);
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
            }
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
        // Initialize audio engine
        AudioEngine.init();
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

    // ================================================================
    // KEYBOARD HANDLER (SYS-030 to SYS-039)
    // ================================================================
    function onKeyDown(ev) {
        if (!state.isCountingActive) return;
        if (state.commentFieldFocused) return;

        // Ignore modifier combos except Shift (SYS-036)
        if (ev.ctrlKey || ev.altKey || ev.metaKey) return;

        // Never swallow keystrokes aimed at a form control
        var tag = ev.target && ev.target.tagName ? ev.target.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        var key = String(ev.key).toUpperCase();
        var specConfig = getSpecConfig();
        if (!specConfig) return;
        var outCodes = specConfig.outCodes;

        if (!Object.prototype.hasOwnProperty.call(outCodes, key)) return;

        ev.preventDefault();

        var cellType = outCodes[key];
        var isDecrement = ev.shiftKey;

        if (isDecrement) {
            // Decrement (SYS-032, SYS-033) — never below zero
            if (state.counts[cellType] > 0) {
                state.counts[cellType]--;
                flashCell(cellType, 'decrement');
                AudioEngine.playUndo();
            }
        } else {
            // Increment (SYS-031)
            state.counts[cellType]++;
            flashCell(cellType, 'increment');
            AudioEngine.playClick();
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

    // Rümke's warning (REF-001 §3.8) concerns ratios specifically: a ratio of
    // two counted proportions carries the sampling error of both.
    var RATIO_IMPRECISION_NOTE = 'A ratio of two counted proportions carries the ' +
        'sampling error of both, and is therefore substantially less precise than ' +
        'either percentage alone (Rumke 1985). Interpret alongside cellularity and ' +
        'the trephine biopsy; treat small differences between successive ratios with caution.';

    /** Every configured formula evaluated against the current counts. */
    function computeFormulaResults(specConfig) {
        var defs = (specConfig && specConfig.formulas) || {};
        var out = {};
        Object.keys(defs).forEach(function (fname) {
            var r = Core.computeFormula(state.counts, defs[fname]);
            if (r) out[fname] = { label: defs[fname].label || fname, type: r.type, display: r.display, value: r.value };
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

    /** Displayed percentages: 2 dp, summing to exactly 100.00 (URS-032, URS-034). */
    function displayPercentages() {
        return Core.percentagesSummingTo100(state.counts, 2, { exclude: denominatorExcludes() });
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

        html += renderRowGroup('upper', upperLabel, categories.upper, cellToKey,
            specConfig.upperRowAbnormal, specConfig);

        html += '<div class="mt-4">';
        html += renderRowGroup('lower', lowerLabel, categories.lower, cellToKey, false, specConfig);
        html += '</div>';

        // --- GRAND TOTAL ---
        html += '<div class="mt-4 flex items-center justify-between px-2">';
        html += '<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grand Total</span>';
        html += '<span class="text-2xl font-mono font-bold text-accent" id="val-grand-total">0</span>';
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
            html += '<div class="mt-2 flex items-center justify-between px-2">';
            html += '<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider"' +
                (tip ? ' title="' + Core.escapeAttr(tip) + '"' : '') + '>' +
                Core.escapeHtml(f.label || fname) +
                (tip ? ' <span class="text-[9px] text-slate-500">&#9662;</span>' : '') + '</span>';
            html += '<span class="text-lg font-mono font-semibold text-slate-300" id="' +
                formulaElId(fname) + '">N/A</span>';
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
        html += '<table class="w-full border-collapse">';

        // Row 1: Cell type names (with tooltip for aggregated constituents)
        html += '<thead><tr>';
        cells.forEach(function (ct) {
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
                pctEl.textContent = Core.formatPercent(pcts[ct] || 0, 2);
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

        // Subtotal percentages exclude non-differential categories from both
        // numerator and denominator, so a row containing one still sums correctly.
        var excl = denominatorExcludes();
        var upperIn = 0;
        categories.upper.forEach(function (ct) {
            if (excl.indexOf(ct) === -1) upperIn += (state.counts[ct] || 0);
        });
        var lowerIn = 0;
        categories.lower.forEach(function (ct) {
            if (excl.indexOf(ct) === -1) lowerIn += (state.counts[ct] || 0);
        });

        var upperPctEl = el('pct-sub-upper');
        if (upperPctEl) {
            upperPctEl.textContent = total > 0 ? Core.formatPercent((upperIn / total) * 100, 2) : '—';
        }
        var lowerPctEl = el('pct-sub-lower');
        if (lowerPctEl) {
            lowerPctEl.textContent = total > 0 ? Core.formatPercent((lowerIn / total) * 100, 2) : '—';
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

        var session = {
            caseNumber: state.caseNumber,
            specimenType: state.specimenType,
            specimenLabel: getSpecLabel(),
            timestamp: new Date().toISOString(),
            configProfileId: meta.profileId || '',
            configProfileName: meta.profileName || '',
            configVersion: meta.version || '',
            targetCount: specConfig.targetCount,
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
            thresholds: Core.evaluateThresholds(state.counts, specConfig,
                (specConfig.confidenceIntervals && specConfig.confidenceIntervals.level) || 0.95),
            morphologyComments: buildMorphologyOutput(),
            // The advisory target counts classified cells, so it is measured
            // against the differential rather than the overall tally.
            lowCountNote: Core.buildLowCountNote(differentialTotal, specConfig.targetCount,
                (specConfig.confidenceIntervals && specConfig.confidenceIntervals.level) || 0.95),
            outputs: {}
        };

        // Rendered institutional outputs (integer percentages, summing to 100)
        var intPcts = Core.percentagesSummingTo100(state.counts, 0, { exclude: excl });
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
                summaryHtml += '<span class="font-mono font-semibold text-slate-300">' +
                    (typeof pct === 'number' ? pct.toFixed(2) : '0.00') + '%</span>';
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

        // Traceability footer (URS-052)
        summaryHtml += '<div class="mt-3 pt-2 border-t border-slate-700/50 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">';
        summaryHtml += '<span>Profile: ' + Core.escapeHtml(session.configProfileName || session.configProfileId) +
            ' (' + Core.escapeHtml(session.configProfileId) + ' v' + Core.escapeHtml(session.configVersion) + ')</span>';
        summaryHtml += '<span>Counted: ' + Core.escapeHtml(new Date(session.timestamp).toLocaleString()) + '</span>';
        summaryHtml += '</div>';

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

            var outputContent = '';
            if (session.caseNumber) {
                outputContent += '<strong>Case: ' + Core.escapeHtml(session.caseNumber) + '</strong><br><br>';
            }
            outputContent += session.outputs[tpl.tplCode] || '';
            if (session.morphologyComments) {
                outputContent += '<br><br><em>Morphology: ' + Core.escapeHtml(session.morphologyComments) + '</em>';
            }

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

        var absResults = el('abs-results');
        if (absResults) absResults.innerHTML = '';
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

        var html = '<div class="flex flex-wrap gap-2 mt-2">';
        allCells.forEach(function (ct) {
            // A category outside the differential has no percentage of the WBC
            // population, so no absolute count can be derived from a WBC.
            if (session.percentages[ct] === null) return;
            // Derived from the same displayed percentages as the table and the
            // report, so the three can never disagree (FMEA HA-024).
            var abs = Core.computeAbsolute(wbc, session.percentages[ct] || 0);
            html += '<div class="flex items-baseline gap-1 px-2 py-1 bg-slate-800 rounded text-xs">';
            html += '<span class="text-slate-500 uppercase">' + Core.escapeHtml(ct) + '</span>';
            html += '<span class="font-mono font-semibold text-emerald-400">' + abs.toFixed(2) + '</span>';
            html += '</div>';
        });
        html += '</div>';
        absResults.innerHTML = html;
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
            html += '<td class="px-2 py-1 font-mono text-center text-slate-500">' +
                (p === null
                    ? (pc === null || pc === undefined ? 'N/A' : pc + '/100')
                    : (typeof p === 'number' ? p.toFixed(2) + '%' : '0.00%')) + '</td>';
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
    function showModal(title, message, confirmText, onConfirm, cancelText, onCancel) {
        var overlay = el('modal-overlay');
        el('modal-title').textContent = title;
        el('modal-message').textContent = message;

        var confirmBtn = el('modal-confirm');
        var cancelBtn = el('modal-cancel');

        // Replace nodes to drop listeners from any previous invocation
        var newConfirm = confirmBtn.cloneNode(true);
        var newCancel = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

        newConfirm.textContent = confirmText;
        newCancel.textContent = cancelText || 'Cancel';
        // Cancel is always offered on a confirmation dialog. Only showAlert()
        // suppresses it, and it does so explicitly — inferring "no cancel
        // handler means no cancel button" would strip the escape route from
        // destructive confirmations such as Reset (URS-061).
        newCancel.classList.remove('hidden');

        overlay.classList.remove('hidden');

        newConfirm.addEventListener('click', function () {
            overlay.classList.add('hidden');
            if (onConfirm) onConfirm();
        });
        newCancel.addEventListener('click', function () {
            overlay.classList.add('hidden');
            if (onCancel) onCancel();
        });
    }

    /**
     * Single-action acknowledgement dialog. Used where there is nothing to
     * decide — an error to read, or a result to confirm.
     */
    function showAlert(title, message, onOk) {
        showModal(title, message, 'OK', onOk);
        el('modal-cancel').classList.add('hidden');
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
