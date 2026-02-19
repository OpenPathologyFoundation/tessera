/**
 * Manual Differential Counter (MDC) — Modern Implementation
 * =========================================================
 * Implements: URS-001, SRS-001, SDD-001
 * Keyboard-driven differential WBC counting tool for hematology.
 *
 * Architecture: Single vanilla-JS module, no framework dependencies.
 * All state in memory; session history in sessionStorage.
 */

(function () {
    'use strict';

    // ================================================================
    // STATE
    // ================================================================
    const state = {
        phase: 'case-entry',       // case-entry | counting | results
        caseNumber: '',
        specimenType: 'bm',
        isCountingActive: false,
        commentFieldFocused: false,
        config: null,              // loaded from templates.json
        counts: {},                // { cellType: number }
        sessionHistory: [],        // array of completed sessions
        activeTab: 0
    };

    // Default minimum cell counts per specimen type (SYS-052)
    const DEFAULT_MIN = { bm: 200, pb: 100 };

    // ================================================================
    // CONFIG LOADER
    // ================================================================
    async function loadConfig() {
        try {
            const resp = await fetch('settings/templates.json');
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            state.config = await resp.json();
            // Add minCellCount defaults if missing (SYS-103)
            state.config.forEach(function (spec) {
                if (!spec.minCellCount) {
                    spec.minCellCount = DEFAULT_MIN[spec.specimenType] || 100;
                }
            });
            loadSessionHistory();
            init();
        } catch (e) {
            document.body.innerHTML =
                '<div class="flex items-center justify-center min-h-screen">' +
                '<div class="text-center"><p class="text-red-400 text-lg font-semibold">Configuration Error</p>' +
                '<p class="text-slate-500 mt-2 text-sm">Could not load settings/templates.json</p>' +
                '<p class="text-slate-600 mt-1 text-xs">' + e.message + '</p></div></div>';
        }
    }

    // ================================================================
    // SESSION HISTORY (SYS-090 to SYS-095)
    // ================================================================
    function loadSessionHistory() {
        try {
            const data = sessionStorage.getItem('mdc_history');
            if (data) state.sessionHistory = JSON.parse(data);
        } catch (e) { /* graceful degradation */ }
    }

    function saveSessionHistory() {
        try {
            sessionStorage.setItem('mdc_history', JSON.stringify(state.sessionHistory));
        } catch (e) { /* graceful degradation */ }
    }

    function addToHistory(session) {
        state.sessionHistory.push(session);
        saveSessionHistory();
        renderHistoryList();
    }

    // ================================================================
    // INITIALIZATION
    // ================================================================
    function init() {
        // DOM references
        const caseInput = el('caseNumber');
        const specSelect = el('specimenType');
        const btnStart = el('btnStartCount');
        const btnDone = el('btnCountDone');
        const btnReset = el('btnCountReset');
        const btnCopy = el('btnCopyOutput');
        const btnNewCase = el('btnNewCase');
        const morphField = el('morphComments');

        // Case input validation (SYS-003, SYS-005)
        caseInput.addEventListener('input', function () {
            const val = caseInput.value.trim();
            btnStart.disabled = val.length === 0;
        });

        // Specimen type change
        specSelect.addEventListener('change', function () {
            state.specimenType = specSelect.value;
        });

        // Start Count (SYS-030, SYS-016)
        btnStart.addEventListener('click', function () {
            const caseVal = caseInput.value.trim();
            if (!caseVal) return;

            state.caseNumber = caseVal;
            state.specimenType = specSelect.value;
            state.isCountingActive = true;

            // Initialize counts to zero for this specimen type
            const specConfig = getSpecConfig();
            state.counts = {};
            Object.values(specConfig.outCodes).forEach(function (cellType) {
                state.counts[cellType] = 0;
            });

            // Update UI
            showPhase('counting');
            renderCounterTable();
            updateCaseBadge();
            setStateLabel('Counting');
            setStatusDot('animate-pulse', 'bg-emerald-400');

            // Lock specimen selector and case input
            specSelect.disabled = true;
            caseInput.readOnly = true;

            // Attach keyboard listener
            document.addEventListener('keydown', onKeyDown);
        });

        // Count Done (SYS-050 to SYS-056)
        btnDone.addEventListener('click', function () {
            const specConfig = getSpecConfig();
            const total = getTotal();
            const minCount = specConfig.minCellCount;

            // Check minimum threshold (SYS-053)
            if (total < minCount) {
                showModal(
                    'Low Cell Count',
                    'Total count (' + total + ') is below the minimum (' + minCount + ') for ' +
                    getSpecLabel() + '. Continue anyway?',
                    'Continue',
                    function () { finalizeCount(); }
                );
            } else {
                finalizeCount();
            }
        });

        // Reset (SYS-080 to SYS-084)
        btnReset.addEventListener('click', function () {
            const total = getTotal();
            if (total > 0) {
                showModal(
                    'Reset Count',
                    'This will clear all count data for case ' + state.caseNumber + '. Continue?',
                    'Reset',
                    function () { resetToStart(); }
                );
            } else {
                resetToStart();
            }
        });

        // Copy to Clipboard (SYS-064 to SYS-066)
        btnCopy.addEventListener('click', function () {
            const activePanel = document.querySelector('#tab-panels .tab-panel:not(.hidden)');
            if (!activePanel) return;
            const text = activePanel.innerText;
            navigator.clipboard.writeText(text).then(function () {
                const btn = el('copyBtnText');
                btn.textContent = 'Copied!';
                setTimeout(function () { btn.textContent = 'Copy to Clipboard'; }, 2000);
            }).catch(function () {
                // Fallback
                const range = document.createRange();
                range.selectNodeContents(activePanel);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand('copy');
                sel.removeAllRanges();
                const btn = el('copyBtnText');
                btn.textContent = 'Copied!';
                setTimeout(function () { btn.textContent = 'Copy to Clipboard'; }, 2000);
            });
        });

        // New Case (from results phase)
        btnNewCase.addEventListener('click', function () {
            resetToStart();
        });

        // Morphology comments — keyboard isolation (SYS-073)
        morphField.addEventListener('focus', function () {
            state.commentFieldFocused = true;
        });
        morphField.addEventListener('blur', function () {
            state.commentFieldFocused = false;
        });
        morphField.addEventListener('input', function () {
            el('commentCharCount').textContent = morphField.value.length + ' / 500';
        });

        // History modal close
        el('history-modal-close').addEventListener('click', function () {
            el('history-modal').classList.add('hidden');
        });

        // Render initial history
        renderHistoryList();

        // Focus case number input
        caseInput.focus();
    }

    // ================================================================
    // KEYBOARD HANDLER (SYS-030 to SYS-039)
    // ================================================================
    function onKeyDown(ev) {
        if (!state.isCountingActive) return;
        if (state.commentFieldFocused) return;

        // Ignore modifier combos except Shift (SYS-036)
        if (ev.ctrlKey || ev.altKey || ev.metaKey) return;

        const key = ev.key.toUpperCase();
        const specConfig = getSpecConfig();
        const outCodes = specConfig.outCodes;

        if (!outCodes.hasOwnProperty(key)) return;

        ev.preventDefault();

        const cellType = outCodes[key];
        const isDecrement = ev.shiftKey;

        if (isDecrement) {
            // Decrement (SYS-032, SYS-033)
            if (state.counts[cellType] > 0) {
                state.counts[cellType]--;
                flashCell(cellType, 'decrement');
            }
        } else {
            // Increment (SYS-031)
            state.counts[cellType]++;
            flashCell(cellType, 'increment');
        }

        updateCounterDisplay();
    }

    // ================================================================
    // COUNTER TABLE RENDERING
    // ================================================================
    function renderCounterTable() {
        const specConfig = getSpecConfig();
        const outCodes = specConfig.outCodes;
        const keys = Object.keys(outCodes);
        const area = el('counter-table-area');

        // Build the grid: N cells + 1 total
        const colCount = keys.length + 1;

        let html = '';

        // Container
        html += '<div class="max-w-4xl mx-auto">';

        // --- GRID TABLE ---
        html += '<div class="overflow-x-auto">';
        html += '<table class="w-full border-collapse">';

        // Row 1: Cell type names
        html += '<thead><tr>';
        keys.forEach(function (k) {
            html += '<th class="px-2 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center border-b border-slate-700/50">' +
                escHtml(outCodes[k]) + '</th>';
        });
        html += '<th class="px-2 py-2 text-[11px] font-semibold text-accent uppercase tracking-wider text-center border-b border-slate-700/50 border-l border-slate-600">Total</th>';
        html += '</tr></thead>';

        // Row 2: Count values
        html += '<tbody>';
        html += '<tr id="count-row">';
        keys.forEach(function (k) {
            const ct = outCodes[k];
            html += '<td class="text-center border-b border-slate-800" id="cell-' + ct + '">' +
                '<div class="py-3 mx-1 rounded-md transition-colors">' +
                '<span class="text-2xl font-mono font-bold text-slate-100" id="val-' + ct + '">0</span>' +
                '</div></td>';
        });
        html += '<td class="text-center border-b border-slate-800 border-l border-slate-600 bg-slate-800/30">' +
            '<div class="py-3">' +
            '<span class="text-2xl font-mono font-bold text-accent" id="val-total">0</span>' +
            '</div></td>';
        html += '</tr>';

        // Row 3: Percentages
        html += '<tr id="pct-row">';
        keys.forEach(function (k) {
            const ct = outCodes[k];
            html += '<td class="text-center border-b border-slate-800/50">' +
                '<span class="text-xs font-mono text-slate-500" id="pct-' + ct + '">0.00%</span>' +
                '</td>';
        });
        html += '<td class="text-center border-b border-slate-800/50 border-l border-slate-600">' +
            '<span class="text-xs font-mono text-slate-500" id="pct-total">&mdash;</span>' +
            '</td>';
        html += '</tr>';

        // Row 4: Key labels
        html += '<tr id="key-row">';
        keys.forEach(function (k) {
            html += '<td class="text-center py-1.5">' +
                '<kbd class="inline-block px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-semibold text-slate-400">' +
                k + '</kbd></td>';
        });
        html += '<td class="text-center py-1.5 border-l border-slate-600">' +
            '<span class="text-xs text-slate-600">&mdash;</span></td>';
        html += '</tr>';

        html += '</tbody></table>';
        html += '</div>'; // overflow wrapper

        // --- PROGRESS BAR (toward minimum count) ---
        const minCount = specConfig.minCellCount;
        html += '<div class="mt-4">';
        html += '<div class="flex justify-between text-[11px] text-slate-500 mb-1">';
        html += '<span>Progress</span>';
        html += '<span id="progress-label">0 / ' + minCount + ' cells</span>';
        html += '</div>';
        html += '<div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">';
        html += '<div id="progress-bar" class="h-full bg-blue-600 rounded-full transition-all duration-150" style="width: 0%"></div>';
        html += '</div>';
        html += '</div>';

        html += '</div>'; // max-w container

        area.innerHTML = html;
    }

    function updateCounterDisplay() {
        const specConfig = getSpecConfig();
        const outCodes = specConfig.outCodes;
        const keys = Object.keys(outCodes);
        const total = getTotal();

        // Update each cell value and percentage (SYS-040 to SYS-044)
        keys.forEach(function (k) {
            const ct = outCodes[k];
            const count = state.counts[ct] || 0;

            // Value
            const valEl = el('val-' + ct);
            if (valEl) valEl.textContent = count;

            // Percentage (SYS-042: division by zero guard)
            const pctEl = el('pct-' + ct);
            if (pctEl) {
                if (total === 0) {
                    pctEl.textContent = '0.00%';
                } else {
                    const pct = (count / total) * 100;
                    pctEl.textContent = pct.toFixed(2) + '%';
                }
            }
        });

        // Total
        const totalEl = el('val-total');
        if (totalEl) totalEl.textContent = total;

        // Progress bar
        const minCount = specConfig.minCellCount;
        const pctProgress = Math.min((total / minCount) * 100, 100);
        const bar = el('progress-bar');
        if (bar) {
            bar.style.width = pctProgress + '%';
            // Color shift: blue -> emerald when target met
            if (total >= minCount) {
                bar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-150';
            } else {
                bar.className = 'h-full bg-blue-600 rounded-full transition-all duration-150';
            }
        }
        const progressLabel = el('progress-label');
        if (progressLabel) {
            progressLabel.textContent = total + ' / ' + minCount + ' cells';
            if (total >= minCount) {
                progressLabel.classList.add('text-emerald-400');
                progressLabel.classList.remove('text-slate-500');
            }
        }
    }

    function flashCell(cellType, direction) {
        const cellEl = el('cell-' + cellType);
        if (!cellEl) return;
        const inner = cellEl.querySelector('div');
        if (!inner) return;
        const cls = direction === 'increment' ? 'flash-increment' : 'flash-decrement';
        inner.classList.remove('flash-increment', 'flash-decrement');
        // Force reflow
        void inner.offsetWidth;
        inner.classList.add(cls);
        setTimeout(function () { inner.classList.remove(cls); }, 250);
    }

    // ================================================================
    // COUNT FINALIZATION (SYS-054 to SYS-056)
    // ================================================================
    function finalizeCount() {
        state.isCountingActive = false;
        document.removeEventListener('keydown', onKeyDown);

        // Generate output
        const specConfig = getSpecConfig();
        const total = getTotal();
        const percentages = {};
        const outCodes = specConfig.outCodes;

        Object.values(outCodes).forEach(function (ct) {
            percentages[ct] = total > 0 ? (state.counts[ct] / total * 100) : 0;
        });

        // Build output for each template
        const outputs = {};
        specConfig.templates.forEach(function (tpl) {
            let text = tpl.outSentence;
            // Replace {{caseNumber}}
            text = text.replace(/\{\{caseNumber\}\}/g, state.caseNumber);
            // Replace {{total}}
            text = text.replace(/\{\{total\}\}/g, String(total));
            // Replace {{comments}}
            const comments = el('morphComments') ? el('morphComments').value.trim() : '';
            text = text.replace(/\{\{comments\}\}/g, comments);
            // Replace each cell type placeholder
            Object.keys(outCodes).forEach(function (k) {
                const ct = outCodes[k];
                const rounded = Math.round(percentages[ct]);
                text = text.replace(new RegExp('\\{\\{' + ct + '\\}\\}', 'g'), String(rounded));
            });
            // Handle <br> -> newline for plain text, but keep HTML for display
            outputs[tpl.tplCode] = text;
        });

        // Save to session history (SYS-090, SYS-091)
        const session = {
            caseNumber: state.caseNumber,
            specimenType: state.specimenType,
            specimenLabel: getSpecLabel(),
            timestamp: new Date().toISOString(),
            totalCount: total,
            counts: Object.assign({}, state.counts),
            percentages: percentages,
            morphologyComments: el('morphComments') ? el('morphComments').value.trim() : '',
            outputs: outputs
        };
        addToHistory(session);

        // Transition to results phase
        showPhase('results');
        renderResults(session);
        setStateLabel('Complete');
        setStatusDot('', 'bg-emerald-400');
    }

    // ================================================================
    // RESULTS RENDERING
    // ================================================================
    function renderResults(session) {
        const specConfig = getSpecConfig();
        const outCodes = specConfig.outCodes;
        const keys = Object.keys(outCodes);

        // --- Summary Table (read-only) ---
        let summaryHtml = '<div class="flex items-center justify-between mb-3">';
        summaryHtml += '<div>';
        summaryHtml += '<span class="text-xs text-slate-500 uppercase tracking-wider">Case</span> ';
        summaryHtml += '<span class="font-mono font-semibold text-accent text-sm">' + escHtml(session.caseNumber) + '</span>';
        summaryHtml += '<span class="mx-2 text-slate-600">|</span>';
        summaryHtml += '<span class="text-xs text-slate-400">' + escHtml(session.specimenLabel) + '</span>';
        summaryHtml += '</div>';
        summaryHtml += '<span class="text-xs font-mono text-slate-400">' + session.totalCount + ' cells</span>';
        summaryHtml += '</div>';

        // Compact cell summary
        summaryHtml += '<div class="flex flex-wrap gap-2">';
        keys.forEach(function (k) {
            const ct = outCodes[k];
            const count = session.counts[ct] || 0;
            const pct = session.totalCount > 0 ? (count / session.totalCount * 100).toFixed(1) : '0.0';
            summaryHtml += '<div class="flex items-baseline gap-1 px-2 py-1 bg-slate-800 rounded text-xs">';
            summaryHtml += '<span class="text-slate-500 uppercase">' + ct + '</span>';
            summaryHtml += '<span class="font-mono font-semibold text-slate-300">' + pct + '%</span>';
            summaryHtml += '</div>';
        });
        summaryHtml += '</div>';

        // Morphology comments
        if (session.morphologyComments) {
            summaryHtml += '<div class="mt-3 text-xs text-slate-400 italic border-t border-slate-700/50 pt-2">';
            summaryHtml += '<span class="text-slate-500 not-italic font-medium">Morphology:</span> ' + escHtml(session.morphologyComments);
            summaryHtml += '</div>';
        }

        el('results-summary').innerHTML = summaryHtml;

        // --- Output Tabs ---
        const templates = specConfig.templates;
        let tabNavHtml = '';
        let tabPanelsHtml = '';

        templates.forEach(function (tpl, idx) {
            const isActive = idx === 0;
            tabNavHtml += '<button class="tab-btn px-4 py-2 text-sm font-medium transition-colors ' +
                (isActive ? 'tab-active text-accent' : 'text-slate-500 hover:text-slate-300') +
                '" data-tab-idx="' + idx + '">' +
                escHtml(tpl.tplName) + '</button>';

            // Prepend case number to output (SYS-067)
            let outputContent = '<strong>Case: ' + escHtml(session.caseNumber) + '</strong><br><br>';
            outputContent += session.outputs[tpl.tplCode];
            // Append morphology if present
            if (session.morphologyComments) {
                outputContent += '<br><br><em>Morphology: ' + escHtml(session.morphologyComments) + '</em>';
            }

            tabPanelsHtml += '<div class="tab-panel ' + (isActive ? '' : 'hidden') + '" data-tab-idx="' + idx + '">';
            tabPanelsHtml += '<div class="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 leading-relaxed font-mono">';
            tabPanelsHtml += outputContent;
            tabPanelsHtml += '</div></div>';
        });

        el('tab-nav').innerHTML = tabNavHtml;
        el('tab-panels').innerHTML = tabPanelsHtml;

        // Tab click handling
        document.querySelectorAll('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const idx = btn.getAttribute('data-tab-idx');
                // Update nav
                document.querySelectorAll('.tab-btn').forEach(function (b) {
                    b.classList.remove('tab-active', 'text-accent');
                    b.classList.add('text-slate-500');
                });
                btn.classList.add('tab-active', 'text-accent');
                btn.classList.remove('text-slate-500');
                // Update panels
                document.querySelectorAll('.tab-panel').forEach(function (p) {
                    p.classList.add('hidden');
                });
                document.querySelector('.tab-panel[data-tab-idx="' + idx + '"]').classList.remove('hidden');
            });
        });
    }

    // ================================================================
    // SESSION HISTORY RENDERING (SYS-092, SYS-093)
    // ================================================================
    function renderHistoryList() {
        const section = el('session-history-section');
        const list = el('history-list');
        const countEl = el('history-count');

        if (state.sessionHistory.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        countEl.textContent = '(' + state.sessionHistory.length + ')';

        let html = '';
        state.sessionHistory.slice().reverse().forEach(function (session, revIdx) {
            const idx = state.sessionHistory.length - 1 - revIdx;
            const time = new Date(session.timestamp).toLocaleTimeString();
            html += '<button class="history-entry w-full text-left flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors" data-hist-idx="' + idx + '">';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="font-mono text-sm text-accent">' + escHtml(session.caseNumber) + '</span>';
            html += '<span class="text-xs text-slate-500 uppercase">' + escHtml(session.specimenLabel) + '</span>';
            html += '</div>';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="text-xs font-mono text-slate-400">' + session.totalCount + ' cells</span>';
            html += '<span class="text-xs text-slate-600">' + time + '</span>';
            html += '</div>';
            html += '</button>';
        });

        list.innerHTML = html;

        // Attach click handlers
        document.querySelectorAll('.history-entry').forEach(function (entry) {
            entry.addEventListener('click', function () {
                const idx = parseInt(entry.getAttribute('data-hist-idx'));
                showHistoryDetail(state.sessionHistory[idx]);
            });
        });
    }

    function showHistoryDetail(session) {
        const modal = el('history-modal');
        const title = el('history-modal-title');
        const content = el('history-modal-content');

        title.textContent = 'Case ' + session.caseNumber;

        let html = '';
        html += '<div class="space-y-3">';
        html += '<div class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">';
        html += '<span><strong>Specimen:</strong> ' + escHtml(session.specimenLabel) + '</span>';
        html += '<span><strong>Total:</strong> ' + session.totalCount + ' cells</span>';
        html += '<span><strong>Time:</strong> ' + new Date(session.timestamp).toLocaleString() + '</span>';
        html += '</div>';

        // Counts table
        html += '<div class="overflow-x-auto mt-2">';
        html += '<table class="w-full text-xs">';
        html += '<tr class="border-b border-slate-700">';
        Object.keys(session.counts).forEach(function (ct) {
            html += '<th class="px-2 py-1 text-slate-500 uppercase font-medium text-center">' + ct + '</th>';
        });
        html += '</tr><tr>';
        Object.keys(session.counts).forEach(function (ct) {
            html += '<td class="px-2 py-1 font-mono text-center text-slate-300">' + session.counts[ct] + '</td>';
        });
        html += '</tr><tr>';
        Object.keys(session.percentages).forEach(function (ct) {
            html += '<td class="px-2 py-1 font-mono text-center text-slate-500">' + session.percentages[ct].toFixed(1) + '%</td>';
        });
        html += '</tr></table></div>';

        if (session.morphologyComments) {
            html += '<div class="text-xs text-slate-400 italic mt-2">Morphology: ' + escHtml(session.morphologyComments) + '</div>';
        }

        // Outputs
        const specConfig = state.config.find(function (s) { return s.specimenType === session.specimenType; });
        if (specConfig) {
            specConfig.templates.forEach(function (tpl) {
                if (session.outputs[tpl.tplCode]) {
                    html += '<div class="mt-3">';
                    html += '<div class="text-xs font-medium text-slate-500 mb-1">' + escHtml(tpl.tplName) + ':</div>';
                    html += '<div class="p-3 bg-slate-900 rounded border border-slate-700 text-xs font-mono text-slate-400 leading-relaxed">';
                    html += session.outputs[tpl.tplCode];
                    html += '</div></div>';
                }
            });
        }

        html += '</div>';
        content.innerHTML = html;
        modal.classList.remove('hidden');
    }

    // ================================================================
    // RESET (SYS-080 to SYS-084)
    // ================================================================
    function resetToStart() {
        // Detach keyboard
        state.isCountingActive = false;
        document.removeEventListener('keydown', onKeyDown);

        // Clear state
        state.counts = {};
        state.caseNumber = '';
        state.commentFieldFocused = false;

        // Reset UI
        const caseInput = el('caseNumber');
        caseInput.value = '';
        caseInput.readOnly = false;
        el('specimenType').disabled = false;
        el('btnStartCount').disabled = true;

        if (el('morphComments')) {
            el('morphComments').value = '';
            el('commentCharCount').textContent = '0 / 500';
        }

        el('counter-table-area').innerHTML = '';

        showPhase('case-entry');
        hideCaseBadge();
        setStateLabel('Ready');
        setStatusDot('', 'bg-accent');

        // Focus case input (SYS-084)
        setTimeout(function () { caseInput.focus(); }, 100);
    }

    // ================================================================
    // MODAL (confirmation dialogs)
    // ================================================================
    function showModal(title, message, confirmText, onConfirm) {
        const overlay = el('modal-overlay');
        el('modal-title').textContent = title;
        el('modal-message').textContent = message;
        el('modal-confirm').textContent = confirmText;

        overlay.classList.remove('hidden');

        // Clean up old listeners
        const confirmBtn = el('modal-confirm');
        const cancelBtn = el('modal-cancel');
        const newConfirm = confirmBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

        newConfirm.addEventListener('click', function () {
            overlay.classList.add('hidden');
            onConfirm();
        });
        newCancel.addEventListener('click', function () {
            overlay.classList.add('hidden');
        });
    }

    // ================================================================
    // PHASE MANAGEMENT
    // ================================================================
    function showPhase(phase) {
        state.phase = phase;
        el('phase-case-entry').classList.add('hidden');
        el('phase-counting').classList.add('hidden');
        el('phase-results').classList.add('hidden');

        const target = el('phase-' + (phase === 'case-entry' ? 'case-entry' : phase));
        target.classList.remove('hidden');

        // Add counting-active class to body during counting
        if (phase === 'counting') {
            document.body.classList.add('counting-active');
        } else {
            document.body.classList.remove('counting-active');
        }
    }

    // ================================================================
    // UTILITIES
    // ================================================================
    function el(id) {
        return document.getElementById(id);
    }

    function escHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getSpecConfig() {
        return state.config.find(function (s) { return s.specimenType === state.specimenType; });
    }

    function getSpecLabel() {
        return state.specimenType === 'bm' ? 'Bone Marrow' : 'Peripheral Blood';
    }

    function getTotal() {
        let sum = 0;
        Object.values(state.counts).forEach(function (v) { sum += v; });
        return sum;
    }

    function updateCaseBadge() {
        const badge = el('case-badge');
        badge.classList.remove('hidden');
        badge.classList.add('flex');
        el('case-badge-number').textContent = state.caseNumber;
        el('case-badge-spec').textContent = getSpecLabel();
    }

    function hideCaseBadge() {
        const badge = el('case-badge');
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }

    function setStateLabel(text) {
        el('state-label').textContent = text;
    }

    function setStatusDot(animClass, colorClass) {
        const dot = el('status-dot');
        dot.className = 'w-2 h-2 rounded-full ' + colorClass + (animClass ? ' ' + animClass : '');
    }

    // ================================================================
    // BOOT
    // ================================================================
    loadConfig();

})();
