/**
 * WBC ΔΣ — Configuration Editor
 * ===============================
 * Visual editor for creating and modifying differential counter configurations.
 * Supports drag-and-drop cell layout, key assignment, template editing, and live preview.
 */

(function () {
    'use strict';

    // ================================================================
    // CELL REFERENCE — all known cell types
    // ================================================================
    var CELL_REFERENCE = [
        { id: 'nrbc', label: 'NRBC (Erythroid)' },
        { id: 'blasts', label: 'Blasts' },
        { id: 'pro', label: 'Promyelocytes' },
        { id: 'myelo', label: 'Myelocytes' },
        { id: 'meta', label: 'Metamyelocytes' },
        { id: 'plasma', label: 'Plasma Cells' },
        { id: 'mast', label: 'Mast Cells' },
        { id: 'bands', label: 'Bands' },
        { id: 'poly', label: 'Seg. Neutrophils' },
        { id: 'segs', label: 'Segmented (alt)' },
        { id: 'baso', label: 'Basophils' },
        { id: 'eos', label: 'Eosinophils' },
        { id: 'mono', label: 'Monocytes' },
        { id: 'lymph', label: 'Lymphocytes' },
        { id: 'other', label: 'Other' },
        { id: 'gran', label: 'Granulocytes (agg)' },
        { id: 'neut', label: 'Neutrophils (agg)' },
        { id: 'mono_macro', label: 'Mono/Macrophages' },
        { id: 'mesothelial', label: 'Mesothelial Cells' },
        { id: 'malignant', label: 'Malignant Cells' },
        { id: 'neutrophils', label: 'Neutrophils (BF)' }
    ];

    // ================================================================
    // ERGONOMIC KEY ZONES
    // ================================================================
    var ERGO_ZONES = {
        left:  ['F','D','S','A','G','V','C','X','Z','B','R','E','W','Q','T'],
        right: ['J','K','L',';','H','M',',','.','/','N','O','I','U','Y','P']
    };

    var listeningCell = null;  // Track which cell is in listening mode

    // ================================================================
    // EDITOR STATE
    // ================================================================
    var editorState = {
        profileId: 'custom',
        profileName: 'Custom',
        activeSpecimenIdx: 0,
        specimenTypes: [
            {
                specimenType: 'bm',
                specimenLabel: 'Bone Marrow',
                targetCount: 500,
                upperRowAbnormal: false,
                upper: [],
                lower: [],
                outCodes: {},
                templates: [{ tplCode: 'std', tplName: 'Standard', outSentence: '' }],
                morphologyChecklist: [],
                handedness: 'left',
                absoluteCounts: 'optional',
                audioEnabled: true,
                autosaveEnabled: true,
                absoluteCountsInReport: false,
                rounding: 'largest-remainder',
                precisionDisplay: 2,
                precisionReport: 0,
                ciEnabled: true,
                ciLevel: 0.95,
                denominatorExcludes: [],
                per100Reporting: {},
                thresholds: [],
                formulas: {}
            }
        ]
    };


    /**
     * The counting-policy fields, with the defaults the engine itself applies.
     *
     * These decide what the reported numbers ARE, not how they look: which
     * categories sit in the percentage denominator, how percentages are
     * rounded, whether a confidence interval is shown, which diagnostic
     * thresholds raise an advisory, and how a derived ratio is composed.
     * Until DCR-013 they could only be set by hand-editing the exported JSON.
     */
    function policyDefaults(spec) {
        spec = spec || {};
        var prec = spec.precision || {};
        var ci = spec.confidenceIntervals || {};
        return {
            absoluteCountsInReport: spec.absoluteCountsInReport === true,
            rounding: spec.rounding || 'largest-remainder',
            precisionDisplay: prec.display === undefined ? 2 : prec.display,
            precisionReport: prec.report === undefined ? 0 : prec.report,
            ciEnabled: ci.enabled !== false,
            ciLevel: ci.level === undefined ? 0.95 : ci.level,
            denominatorExcludes: (spec.denominatorExcludes || []).slice(),
            per100Reporting: clone(spec.per100Reporting || {}),
            thresholds: clone(spec.thresholds || []),
            formulas: clone(spec.formulas || {})
        };
    }

    function clone(v) { return JSON.parse(JSON.stringify(v)); }

    // ================================================================
    // INITIALIZATION
    // ================================================================
    function initEditor() {
        // Apply theme from sessionStorage
        try {
            var theme = sessionStorage.getItem('wbcds_theme');
            if (theme) document.documentElement.setAttribute('data-theme', theme);
        } catch (e) { /* ignore */ }

        // Try to load existing config from localStorage
        loadExistingConfig();

        renderCellReference();
        renderSpecimenTabs();
        renderLayout();
        renderKeyAssignment();
        renderSettings();
        renderPolicyEditor();
        renderTemplateEditor();
        renderMorphChecklist();
        updatePlaceholderList();
        updatePreview();

        // Wire up events
        wireDropZones();
        wireButtons();
        wireSettings();
        wirePolicyEditor();
    }

    function loadExistingConfig() {
        try {
            var raw = localStorage.getItem('wbcds_config');
            if (!raw) return;
            var config = JSON.parse(raw);
            var specimenTypes = Array.isArray(config) ? config : (config.specimenTypes || []);
            if (specimenTypes.length === 0) return;

            editorState.profileId = config.profileId || 'custom';
            editorState.profileName = config.profileName || 'Custom';

            // Everything the editor does not model is kept verbatim and merged
            // back on save. The editor edits layout, keys, templates and a few
            // settings; a profile also carries the denominator policy, the
            // thresholds, the M:E formula, the rounding and precision policy
            // and its provenance. Rebuilding a profile from the editor's own
            // fields silently discarded all of it — a peripheral blood profile
            // that lost denominatorExcludes counts NRBC into the leucocyte
            // differential, which is HA-092.
            editorState.rawConfig = config;

            editorState.specimenTypes = specimenTypes.map(function (spec) {
                var outCodes = spec.outCodes || {};
                var modelled = {
                    raw: spec,
                    specimenType: spec.specimenType,
                    specimenLabel: spec.specimenLabel || spec.specimenType.toUpperCase(),
                    targetCount: spec.targetCount || 200,
                    upperRowAbnormal: spec.upperRowAbnormal || false,
                    upper: (spec.categories && spec.categories.upper) || [],
                    lower: (spec.categories && spec.categories.lower) || [],
                    outCodes: outCodes,
                    templates: spec.templates || [{ tplCode: 'std', tplName: 'Standard', outSentence: '' }],
                    morphologyChecklist: spec.morphologyChecklist || [],
                    handedness: spec.handedness || 'left',
                    absoluteCounts: spec.absoluteCounts || 'optional',
                    audioEnabled: spec.audio ? spec.audio.enabled : true,
                    autosaveEnabled: spec.autosave !== false
                };
                Object.keys(policyDefaults(spec)).forEach(function (k) {
                    modelled[k] = policyDefaults(spec)[k];
                });
                return modelled;
            });
        } catch (e) { /* ignore */ }
    }

    // ================================================================
    // CELL REFERENCE PANEL
    // ================================================================
    function renderCellReference() {
        var container = document.getElementById('cell-reference');
        var html = '';
        CELL_REFERENCE.forEach(function (cell) {
            html += '<div class="cell-chip flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md text-xs cursor-grab hover:bg-slate-700 transition-colors" draggable="true" data-cell-id="' + cell.id + '">';
            html += '<span class="font-mono font-semibold text-accent">' + cell.id + '</span>';
            html += '<span class="text-slate-500">' + cell.label + '</span>';
            html += '</div>';
        });
        container.innerHTML = html;

        // Wire up drag start
        container.querySelectorAll('.cell-chip').forEach(function (chip) {
            chip.addEventListener('dragstart', function (ev) {
                ev.dataTransfer.setData('text/plain', chip.getAttribute('data-cell-id'));
                ev.dataTransfer.effectAllowed = 'copy';
                chip.classList.add('dragging');
            });
            chip.addEventListener('dragend', function () {
                chip.classList.remove('dragging');
            });
        });
    }

    // ================================================================
    // SPECIMEN TABS
    // ================================================================
    function renderSpecimenTabs() {
        var container = document.getElementById('specimen-tabs');
        var html = '';
        editorState.specimenTypes.forEach(function (spec, idx) {
            var isActive = idx === editorState.activeSpecimenIdx;
            html += '<button class="spec-tab px-4 py-2 text-sm font-medium rounded-lg transition-colors ' +
                (isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700') +
                '" data-spec-idx="' + idx + '">' +
                escHtml(spec.specimenLabel || spec.specimenType) + '</button>';
        });
        container.innerHTML = html;

        container.querySelectorAll('.spec-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                editorState.activeSpecimenIdx = parseInt(btn.getAttribute('data-spec-idx'));
                renderSpecimenTabs();
                renderLayout();
                renderKeyAssignment();
                renderSettings();
                renderPolicyEditor();
                renderTemplateEditor();
                renderMorphChecklist();
                updatePlaceholderList();
                updatePreview();
            });
        });
    }

    function getActiveSpec() {
        return editorState.specimenTypes[editorState.activeSpecimenIdx];
    }

    // ================================================================
    // LAYOUT PANELS (drop zones)
    // ================================================================
    function renderLayout() {
        var spec = getActiveSpec();

        renderDropZone('drop-upper', spec.upper);
        renderDropZone('drop-lower', spec.lower);
    }

    function renderDropZone(zoneId, cells) {
        var zone = document.getElementById(zoneId);
        var html = '';
        cells.forEach(function (ct, idx) {
            html += '<div class="cell-chip inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-md text-xs" draggable="true" data-cell-id="' + ct + '" data-zone="' + zoneId + '" data-idx="' + idx + '">';
            html += '<span class="font-mono font-semibold text-accent">' + escHtml(ct) + '</span>';
            html += '<button class="remove-cell text-slate-500 hover:text-red-400 ml-1" data-cell-id="' + ct + '" data-zone="' + zoneId + '">&times;</button>';
            html += '</div>';
        });
        if (cells.length === 0) {
            html = '<span class="text-xs text-slate-600 italic">Drop cells here</span>';
        }
        zone.innerHTML = html;

        // Wire remove buttons
        zone.querySelectorAll('.remove-cell').forEach(function (btn) {
            btn.addEventListener('click', function (ev) {
                ev.stopPropagation();
                var cellId = btn.getAttribute('data-cell-id');
                var zId = btn.getAttribute('data-zone');
                var spec = getActiveSpec();
                var arr = zId === 'drop-upper' ? spec.upper : spec.lower;
                var i = arr.indexOf(cellId);
                if (i !== -1) arr.splice(i, 1);
                // Remove from outCodes
                Object.keys(spec.outCodes).forEach(function (k) {
                    if (spec.outCodes[k] === cellId) delete spec.outCodes[k];
                });
                renderLayout();
                renderKeyAssignment();
                updatePlaceholderList();
                updatePreview();
            });
        });

        // Wire drag within zone (reorder)
        zone.querySelectorAll('.cell-chip').forEach(function (chip) {
            chip.addEventListener('dragstart', function (ev) {
                ev.dataTransfer.setData('text/plain', chip.getAttribute('data-cell-id'));
                ev.dataTransfer.setData('source-zone', chip.getAttribute('data-zone'));
                ev.dataTransfer.effectAllowed = 'move';
                chip.classList.add('dragging');
            });
            chip.addEventListener('dragend', function () {
                chip.classList.remove('dragging');
            });
        });
    }

    function wireDropZones() {
        ['drop-upper', 'drop-lower'].forEach(function (zoneId) {
            var zone = document.getElementById(zoneId);

            zone.addEventListener('dragover', function (ev) {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'copy';
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', function () {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', function (ev) {
                ev.preventDefault();
                zone.classList.remove('drag-over');
                var cellId = ev.dataTransfer.getData('text/plain');
                var sourceZone = ev.dataTransfer.getData('source-zone');
                if (!cellId) return;

                var spec = getActiveSpec();
                var targetArr = zoneId === 'drop-upper' ? spec.upper : spec.lower;

                // If moving from another zone, remove from source
                if (sourceZone && sourceZone !== zoneId) {
                    var srcArr = sourceZone === 'drop-upper' ? spec.upper : spec.lower;
                    var srcIdx = srcArr.indexOf(cellId);
                    if (srcIdx !== -1) srcArr.splice(srcIdx, 1);
                }

                // Don't duplicate in same zone
                if (targetArr.indexOf(cellId) === -1) {
                    targetArr.push(cellId);
                }

                renderLayout();
                renderKeyAssignment();
                updatePlaceholderList();
                updatePreview();
            });
        });
    }

    // ================================================================
    // KEY ASSIGNMENT (click-to-assign)
    // ================================================================
    function renderKeyAssignment() {
        var spec = getActiveSpec();
        var allCells = spec.upper.concat(spec.lower);
        var container = document.getElementById('key-assignment');

        // Reverse map: cellType -> key
        var cellToKey = {};
        Object.keys(spec.outCodes).forEach(function (k) {
            cellToKey[spec.outCodes[k]] = k;
        });

        var html = '';
        allCells.forEach(function (ct) {
            var key = cellToKey[ct] || '';
            var hasKey = key.length > 0;
            var zone = ERGO_ZONES[spec.handedness || 'left'] || ERGO_ZONES.left;
            var outsideZone = hasKey && !isInErgoZone(key, spec.handedness || 'left');
            var isDuplicate = hasKey && isDuplicateKey(key, ct, spec);

            var cardClasses = 'key-card flex items-center justify-between gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all select-none';
            cardClasses += ' bg-slate-800 hover:bg-slate-700';
            if (outsideZone) {
                cardClasses += ' border-amber-500/60 border-dashed';
            } else if (isDuplicate) {
                cardClasses += ' border-amber-500';
            } else {
                cardClasses += ' border-slate-600';
            }

            html += '<div class="' + cardClasses + '" data-cell="' + ct + '" role="button" tabindex="0">';
            html += '<span class="text-xs font-mono font-semibold text-accent">' + escHtml(ct) + '</span>';
            if (hasKey) {
                html += '<kbd class="key-badge px-2 py-0.5 bg-slate-700 border border-slate-500 rounded text-sm font-mono font-bold text-slate-100">' + escHtml(key) + '</kbd>';
            } else {
                html += '<span class="key-badge text-xs text-slate-600 italic">?</span>';
            }
            if (outsideZone) {
                html += '<span class="text-[10px] text-amber-400" title="Key outside ergonomic zone">!</span>';
            }
            html += '</div>';
        });

        if (allCells.length === 0) {
            html = '<p class="text-xs text-slate-600 italic col-span-2">Add cells to the layout first.</p>';
        }

        container.innerHTML = html;

        // Wire click-to-assign on each card
        container.querySelectorAll('.key-card').forEach(function (card) {
            card.addEventListener('click', function () {
                startListening(card.getAttribute('data-cell'), card);
            });
        });
    }

    /**
     * Whether this cell type is reachable from more than one key.
     *
     * This counted `Object.keys(outCodes)` equal to `key`. Object keys are
     * unique, so the count was never above one and the warning branch was
     * unreachable — the amber border it controls had never once been drawn.
     *
     * The condition that genuinely confuses an operator is the reverse:
     * outCodes maps key -> cell, so two keys CAN address the same cell. The
     * card shows only the last of them, while the other key silently counts
     * into the same category.
     */
    function isDuplicateKey(key, cellType, spec) {
        var count = 0;
        Object.keys(spec.outCodes).forEach(function (k) {
            if (spec.outCodes[k] === cellType) count++;
        });
        return count > 1;
    }

    function isInErgoZone(key, handedness) {
        var zone = ERGO_ZONES[handedness || 'left'] || ERGO_ZONES.left;
        return zone.indexOf(key.toUpperCase ? key.toUpperCase() : key) !== -1 ||
               zone.indexOf(key) !== -1;
    }

    function startListening(cellType, cardEl) {
        // Cancel any previous listening
        stopListening();
        listeningCell = cellType;

        // Highlight the card
        cardEl.classList.add('key-listening');
        var badge = cardEl.querySelector('.key-badge');
        if (badge) {
            badge.textContent = '...';
            badge.classList.add('animate-pulse');
        }

        // Attach global keydown handler
        document.addEventListener('keydown', onKeyAssignKeyDown);
        // Click elsewhere cancels
        document.addEventListener('click', onKeyAssignClickAway);
    }

    function stopListening() {
        listeningCell = null;
        document.removeEventListener('keydown', onKeyAssignKeyDown);
        document.removeEventListener('click', onKeyAssignClickAway);
        // Remove listening class from all cards
        var cards = document.querySelectorAll('.key-listening');
        cards.forEach(function (c) { c.classList.remove('key-listening'); });
    }

    function onKeyAssignKeyDown(ev) {
        if (!listeningCell) return;

        // Escape cancels
        if (ev.key === 'Escape') {
            ev.preventDefault();
            stopListening();
            renderKeyAssignment();
            return;
        }

        // Ignore modifier-only keys
        if (['Shift', 'Control', 'Alt', 'Meta', 'Tab'].indexOf(ev.key) !== -1) return;

        ev.preventDefault();
        ev.stopPropagation();

        var spec = getActiveSpec();
        var key = ev.key.length === 1 ? ev.key.toUpperCase() : ev.key;

        // For punctuation keys, use the raw key
        if (ev.key === ';' || ev.key === ',' || ev.key === '.' || ev.key === '/') {
            key = ev.key;
        }

        // Remove old mapping for this cell
        Object.keys(spec.outCodes).forEach(function (k) {
            if (spec.outCodes[k] === listeningCell) delete spec.outCodes[k];
        });

        // Assign new key (allow conflict — warn but don't block)
        spec.outCodes[key] = listeningCell;

        stopListening();
        renderKeyAssignment();
        updatePreview();
    }

    function onKeyAssignClickAway(ev) {
        // If click is on a key-card, startListening handles it
        if (ev.target.closest && ev.target.closest('.key-card')) return;
        stopListening();
        renderKeyAssignment();
    }

    function autoAssignKeys(hand) {
        var spec = getActiveSpec();
        var allCells = spec.upper.concat(spec.lower);
        var zone = ERGO_ZONES[hand] || ERGO_ZONES.left;

        // Clear existing outCodes
        spec.outCodes = {};

        // Assign keys from zone in order
        allCells.forEach(function (ct, idx) {
            if (idx < zone.length) {
                spec.outCodes[zone[idx]] = ct;
            }
        });

        spec.handedness = hand;
        document.getElementById('handedness').value = hand;
        renderKeyAssignment();
        updatePreview();
    }

    function resetAllKeys() {
        var spec = getActiveSpec();
        spec.outCodes = {};
        renderKeyAssignment();
        updatePreview();
    }

    // ================================================================
    // SETTINGS
    // ================================================================
    function renderSettings() {
        var spec = getActiveSpec();
        document.getElementById('profileName').value = editorState.profileName;
        document.getElementById('profileId').value = editorState.profileId;

        // Find BM/PB specific targets, or use current spec
        var bmSpec = editorState.specimenTypes.find(function (s) { return s.specimenType === 'bm'; });
        var pbSpec = editorState.specimenTypes.find(function (s) { return s.specimenType === 'pb'; });
        document.getElementById('targetBm').value = bmSpec ? bmSpec.targetCount : spec.targetCount;
        document.getElementById('targetPb').value = pbSpec ? pbSpec.targetCount : spec.targetCount;

        document.getElementById('handedness').value = spec.handedness || 'left';
        document.getElementById('absoluteCounts').value = spec.absoluteCounts || 'optional';
        document.getElementById('audioEnabled').checked = spec.audioEnabled !== false;
        document.getElementById('autosaveEnabled').checked = spec.autosaveEnabled !== false;
    }

    function wireSettings() {
        document.getElementById('profileName').addEventListener('input', function () {
            editorState.profileName = this.value;
        });
        document.getElementById('profileId').addEventListener('input', function () {
            editorState.profileId = this.value;
        });
        document.getElementById('targetBm').addEventListener('input', function () {
            var bmSpec = editorState.specimenTypes.find(function (s) { return s.specimenType === 'bm'; });
            if (bmSpec) bmSpec.targetCount = parseInt(this.value) || 500;
        });
        document.getElementById('targetPb').addEventListener('input', function () {
            var pbSpec = editorState.specimenTypes.find(function (s) { return s.specimenType === 'pb'; });
            if (pbSpec) pbSpec.targetCount = parseInt(this.value) || 200;
        });
        document.getElementById('handedness').addEventListener('change', function () {
            getActiveSpec().handedness = this.value;
        });
        document.getElementById('absoluteCounts').addEventListener('change', function () {
            getActiveSpec().absoluteCounts = this.value;
        });
        document.getElementById('audioEnabled').addEventListener('change', function () {
            getActiveSpec().audioEnabled = this.checked;
        });
        document.getElementById('autosaveEnabled').addEventListener('change', function () {
            getActiveSpec().autosaveEnabled = this.checked;
        });
    }


    // ================================================================
    // COUNTING POLICY EDITOR (DCR-013)
    //
    // Every control here is constrained so it cannot produce a profile that
    // Core.validateConfig would reject:
    //   - the denominator cannot be emptied of every category
    //   - a category reported per 100 must be outside the denominator, so the
    //     two are edited as one control rather than two that can disagree
    //   - a threshold target is chosen from the categories that actually have
    //     a percentage to test, which excludes those outside the denominator
    //   - formula members are chosen from displayed categories, which the
    //     schema already requires to be key-mapped
    // ================================================================

    var ROUNDING_CHOICES = [
        ['largest-remainder', 'Largest remainder (default)', 'Totals 100% with the least distortion of any single figure.'],
        ['largest-count', 'Largest count', 'Gives the whole residual to the biggest category; totals 100%.'],
        ['independent', 'Independent', 'Each figure rounded alone. Honest, but the total may not be 100%.']
    ];
    var CI_LEVELS = [[0.9, '90%'], [0.95, '95% (default)'], [0.99, '99%']];

    function displayedCells(spec) { return spec.upper.concat(spec.lower); }

    function cellLabel(id) {
        var ref = CELL_REFERENCE.filter(function (c) { return c.id === id; })[0];
        return ref ? ref.label : id;
    }

    function fieldsetOpen(title, hint) {
        return '<div class="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">' +
            '<p class="text-xs font-semibold text-slate-200">' + escHtml(title) + '</p>' +
            (hint ? '<p class="text-[11px] text-slate-500 mt-0.5">' + hint + '</p>' : '');
    }

    function renderPolicyEditor() {
        var spec = getActiveSpec();
        var shown = displayedCells(spec);
        var html = '';

        // ---- rounding + precision + intervals ----
        html += fieldsetOpen('Percentages',
            'How each figure is rounded, to how many places, and whether it carries a sampling interval.');
        html += '<div class="grid grid-cols-2 gap-3 mt-2">';
        html += '<div class="col-span-2"><label class="block text-[11px] text-slate-500 mb-1">Rounding policy</label>' +
            '<select id="pol-rounding" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100">';
        ROUNDING_CHOICES.forEach(function (c) {
            html += '<option value="' + c[0] + '"' + (spec.rounding === c[0] ? ' selected' : '') + '>' +
                escHtml(c[1]) + '</option>';
        });
        html += '</select>';
        ROUNDING_CHOICES.forEach(function (c) {
            if (spec.rounding === c[0]) {
                html += '<p class="text-[11px] text-slate-500 mt-1">' + escHtml(c[2]) + '</p>';
            }
        });
        html += '</div>';
        html += '<div><label class="block text-[11px] text-slate-500 mb-1">Decimals on screen</label>' +
            '<input type="number" id="pol-prec-display" min="0" max="4" value="' + spec.precisionDisplay +
            '" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 font-mono"></div>';
        html += '<div><label class="block text-[11px] text-slate-500 mb-1">Decimals in the report</label>' +
            '<input type="number" id="pol-prec-report" min="0" max="4" value="' + spec.precisionReport +
            '" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 font-mono"></div>';
        html += '<div class="col-span-2 flex items-center gap-3">' +
            '<label class="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">' +
            '<input type="checkbox" id="pol-ci-enabled" class="accent-accent"' + (spec.ciEnabled ? ' checked' : '') + '>' +
            'Show a confidence interval</label>' +
            '<select id="pol-ci-level" class="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100"' +
            (spec.ciEnabled ? '' : ' disabled') + '>';
        CI_LEVELS.forEach(function (l) {
            html += '<option value="' + l[0] + '"' + (Number(spec.ciLevel) === l[0] ? ' selected' : '') + '>' +
                l[1] + '</option>';
        });
        html += '</select></div>';
        html += '<div class="col-span-2 flex items-start gap-2">' +
            '<label class="inline-flex items-start gap-2 text-sm text-slate-300 cursor-pointer">' +
            '<input type="checkbox" id="pol-abs-report" class="accent-accent mt-0.5"' +
            (spec.absoluteCountsInReport ? ' checked' : '') + '>' +
            '<span>Include absolute counts in the report' +
            '<span class="block text-[11px] text-slate-500">Adds {{&lt;cell&gt;_abs}}, {{wbcUsed}} and ' +
            '{{wbcBasis}} to the templates below. The report is re-rendered once an analyser WBC is ' +
            'entered; until then those tokens read &ldquo;not provided&rdquo;.</span></span></label></div>';
        html += '</div></div>';

        // ---- denominator policy ----
        html += fieldsetOpen('Differential denominator',
            'A ticked category is still counted, but sits outside the percentage denominator and is ' +
            'reported per 100 of it instead. Nucleated red cells in peripheral blood are the standard case.');
        if (shown.length === 0) {
            html += '<p class="text-[11px] text-slate-500 mt-2">Add categories to the layout first.</p>';
        } else {
            html += '<div class="mt-2 space-y-1">';
            shown.forEach(function (id) {
                var excluded = spec.denominatorExcludes.indexOf(id) !== -1;
                var lastOne = !excluded && shown.length - spec.denominatorExcludes.length <= 1;
                var per = spec.per100Reporting[id] || {};
                html += '<div class="flex flex-wrap items-center gap-2">';
                html += '<label class="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer w-44">' +
                    '<input type="checkbox" class="pol-excl accent-accent" data-cell="' + escHtml(id) + '"' +
                    (excluded ? ' checked' : '') + (lastOne ? ' disabled' : '') + '>' +
                    '<span class="font-mono text-accent">' + escHtml(id) + '</span>' +
                    '<span class="text-slate-500">' + escHtml(cellLabel(id)) + '</span></label>';
                if (excluded) {
                    html += '<input type="text" class="pol-per100-label flex-1 min-w-40 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100" ' +
                        'data-cell="' + escHtml(id) + '" value="' + escHtml(per.label || '') +
                        '" placeholder="Reported as, e.g. NRBC per 100 WBC">';
                    html += '<input type="number" class="pol-per100-precision w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100 font-mono" ' +
                        'data-cell="' + escHtml(id) + '" min="0" max="4" value="' +
                        (per.precision === undefined ? 1 : per.precision) + '" title="Decimal places">';
                }
                html += '</div>';
            });
            html += '</div>';
            html += '<p class="text-[11px] text-slate-500 mt-2">At least one category must remain in the denominator.</p>';
        }
        html += '</div>';

        // ---- thresholds ----
        var targets = shown.filter(function (id) { return spec.denominatorExcludes.indexOf(id) === -1; });
        Object.keys(spec.formulas).forEach(function (fname) {
            if ((spec.formulas[fname].type || 'ratio') === 'percentage') targets.push(fname);
        });
        html += fieldsetOpen('Diagnostic thresholds',
            'When a confidence interval spans one of these, the results screen says so. It never blocks ' +
            'or alters the count.');
        html += '<div class="mt-2 space-y-2">';
        spec.thresholds.forEach(function (t, idx) {
            html += '<div class="p-2 bg-slate-800 border border-slate-700 rounded space-y-1" data-thr-idx="' + idx + '">';
            html += '<div class="flex flex-wrap items-center gap-2">';
            html += '<select class="pol-thr-target px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100 font-mono" data-thr-idx="' + idx + '">';
            if (targets.indexOf(t.target) === -1) {
                html += '<option value="' + escHtml(t.target) + '" selected>' + escHtml(t.target) + ' (not available)</option>';
            }
            targets.forEach(function (id) {
                html += '<option value="' + escHtml(id) + '"' + (t.target === id ? ' selected' : '') + '>' + escHtml(id) + '</option>';
            });
            html += '</select>';
            html += '<input type="number" class="pol-thr-value w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100 font-mono" ' +
                'data-thr-idx="' + idx + '" min="0" max="100" step="0.1" value="' + escHtml(String(t.value)) + '" title="Percent">';
            html += '<span class="text-[11px] text-slate-500">%</span>';
            html += '<input type="text" class="pol-thr-label flex-1 min-w-40 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100" ' +
                'data-thr-idx="' + idx + '" value="' + escHtml(t.label || '') + '" placeholder="Name, e.g. AML blast threshold">';
            html += '<button class="pol-thr-remove text-slate-500 hover:text-red-400 text-xs" data-thr-idx="' + idx + '">&times; Remove</button>';
            html += '</div>';
            html += '<input type="text" class="pol-thr-basis w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] text-slate-400" ' +
                'data-thr-idx="' + idx + '" value="' + escHtml(t.basis || '') + '" placeholder="Citation shown to the operator, e.g. WHO 2022 / ICC 2022">';
            html += '</div>';
        });
        html += '</div>';
        html += '<button id="pol-thr-add" class="mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"' +
            (targets.length ? '' : ' disabled') + '>+ Add threshold</button>';
        html += '</div>';

        // ---- derived formulas ----
        html += fieldsetOpen('Derived figures',
            'A ratio (such as myeloid-to-erythroid) or a percentage of a subset. Both conventions for ' +
            'M:E are in use and disagree, so the composition is stated here rather than assumed.');
        html += '<div class="mt-2 space-y-3">';
        Object.keys(spec.formulas).forEach(function (fname) {
            var f = spec.formulas[fname];
            var type = f.type || 'ratio';
            html += '<div class="p-2 bg-slate-800 border border-slate-700 rounded space-y-2" data-formula="' + escHtml(fname) + '">';
            html += '<div class="flex flex-wrap items-center gap-2">';
            html += '<span class="font-mono text-accent text-xs">' + escHtml(fname) + '</span>';
            html += '<input type="text" class="pol-f-label flex-1 min-w-32 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100" ' +
                'data-formula="' + escHtml(fname) + '" value="' + escHtml(f.label || '') + '" placeholder="Label in the report">';
            html += '<select class="pol-f-type px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100" data-formula="' + escHtml(fname) + '">' +
                '<option value="ratio"' + (type === 'ratio' ? ' selected' : '') + '>Ratio</option>' +
                '<option value="percentage"' + (type === 'percentage' ? ' selected' : '') + '>Percentage</option></select>';
            html += '<input type="number" class="pol-f-precision w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-100 font-mono" ' +
                'data-formula="' + escHtml(fname) + '" min="0" max="4" value="' + (f.precision === undefined ? 1 : f.precision) + '" title="Decimal places">';
            html += '<button class="pol-f-remove text-slate-500 hover:text-red-400 text-xs" data-formula="' + escHtml(fname) + '">&times; Remove</button>';
            html += '</div>';
            ['numerator', 'denominator'].forEach(function (side) {
                html += '<div><p class="text-[11px] text-slate-500 mb-1">' +
                    (side === 'numerator' ? 'Numerator' : 'Denominator') + '</p>';
                html += '<div class="flex flex-wrap gap-x-3 gap-y-1">';
                shown.forEach(function (id) {
                    var on = (f[side] || []).indexOf(id) !== -1;
                    html += '<label class="inline-flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">' +
                        '<input type="checkbox" class="pol-f-member accent-accent" data-formula="' + escHtml(fname) +
                        '" data-side="' + side + '" data-cell="' + escHtml(id) + '"' + (on ? ' checked' : '') + '>' +
                        '<span class="font-mono">' + escHtml(id) + '</span></label>';
                });
                html += '</div></div>';
            });
            if (type === 'percentage') {
                html += '<p class="text-[11px] text-slate-500">Every numerator category must also be in the denominator, ' +
                    'or the percentage could exceed 100%.</p>';
            }
            html += '<input type="text" class="pol-f-basis w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] text-slate-400" ' +
                'data-formula="' + escHtml(fname) + '" value="' + escHtml(f.basis || '') + '" placeholder="Citation, shown with the method statement">';
            html += '</div>';
        });
        html += '</div>';
        html += '<button id="pol-f-add" class="mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors">+ Add derived figure</button>';
        html += '</div>';

        document.getElementById('policy-editor').innerHTML = html;
    }


    /**
     * One delegated listener set on the container, because the panel re-renders
     * itself whenever a change alters what the other controls may offer —
     * excluding a category from the denominator removes it from the threshold
     * targets, and adding a percentage formula adds one.
     */
    function wirePolicyEditor() {
        var root = document.getElementById('policy-editor');

        function refresh() {
            renderPolicyEditor();
            updatePreview();
        }

        root.addEventListener('change', function (ev) {
            var spec = getActiveSpec();
            var el = ev.target;

            if (el.id === 'pol-rounding') { spec.rounding = el.value; return refresh(); }
            if (el.id === 'pol-ci-enabled') { spec.ciEnabled = el.checked; return refresh(); }
            if (el.id === 'pol-abs-report') { spec.absoluteCountsInReport = el.checked; return refresh(); }
            if (el.id === 'pol-ci-level') { spec.ciLevel = parseFloat(el.value); return; }

            if (el.id === 'pol-prec-display' || el.id === 'pol-prec-report') {
                var v = clampInt(el.value, 0, 4, el.id === 'pol-prec-display' ? 2 : 0);
                el.value = v;
                if (el.id === 'pol-prec-display') spec.precisionDisplay = v; else spec.precisionReport = v;
                return updatePreview();
            }

            // Excluding a category from the denominator and reporting it per
            // 100 are the same decision: the schema rejects one without the
            // other, so the checkbox drives both.
            if (el.classList.contains('pol-excl')) {
                var cell = el.getAttribute('data-cell');
                var at = spec.denominatorExcludes.indexOf(cell);
                if (el.checked && at === -1) {
                    spec.denominatorExcludes.push(cell);
                    if (!spec.per100Reporting[cell]) {
                        spec.per100Reporting[cell] = {
                            label: cellLabel(cell) + ' per 100 counted',
                            precision: 1
                        };
                    }
                    // A threshold on a category with no percentage left to test
                    // is not merely useless, it fails validation.
                    spec.thresholds = spec.thresholds.filter(function (t) { return t.target !== cell; });
                } else if (!el.checked && at !== -1) {
                    spec.denominatorExcludes.splice(at, 1);
                    delete spec.per100Reporting[cell];
                }
                return refresh();
            }

            if (el.classList.contains('pol-thr-target')) {
                spec.thresholds[+el.getAttribute('data-thr-idx')].target = el.value;
                return updatePreview();
            }
            if (el.classList.contains('pol-thr-value')) {
                var pct = parseFloat(el.value);
                if (!isFinite(pct)) pct = 0;
                pct = Math.min(100, Math.max(0, pct));
                el.value = pct;
                spec.thresholds[+el.getAttribute('data-thr-idx')].value = pct;
                return updatePreview();
            }

            if (el.classList.contains('pol-f-type')) {
                spec.formulas[el.getAttribute('data-formula')].type = el.value;
                return refresh();
            }
            if (el.classList.contains('pol-f-precision')) {
                el.value = clampInt(el.value, 0, 4, 1);
                spec.formulas[el.getAttribute('data-formula')].precision = +el.value;
                return updatePreview();
            }
            if (el.classList.contains('pol-f-member')) {
                var f = spec.formulas[el.getAttribute('data-formula')];
                var side = el.getAttribute('data-side');
                var id = el.getAttribute('data-cell');
                f[side] = f[side] || [];
                var i = f[side].indexOf(id);
                if (el.checked && i === -1) f[side].push(id);
                if (!el.checked && i !== -1) f[side].splice(i, 1);
                return updatePreview();
            }
            if (el.classList.contains('pol-per100-precision')) {
                el.value = clampInt(el.value, 0, 4, 1);
                spec.per100Reporting[el.getAttribute('data-cell')].precision = +el.value;
                return updatePreview();
            }
        });

        root.addEventListener('input', function (ev) {
            var spec = getActiveSpec();
            var el = ev.target;
            if (el.classList.contains('pol-per100-label')) {
                spec.per100Reporting[el.getAttribute('data-cell')].label = el.value;
            } else if (el.classList.contains('pol-thr-label')) {
                spec.thresholds[+el.getAttribute('data-thr-idx')].label = el.value;
            } else if (el.classList.contains('pol-thr-basis')) {
                spec.thresholds[+el.getAttribute('data-thr-idx')].basis = el.value;
            } else if (el.classList.contains('pol-f-label')) {
                spec.formulas[el.getAttribute('data-formula')].label = el.value;
            } else if (el.classList.contains('pol-f-basis')) {
                spec.formulas[el.getAttribute('data-formula')].basis = el.value;
            } else {
                return;
            }
            updatePreview();
        });

        root.addEventListener('click', function (ev) {
            var spec = getActiveSpec();
            var el = ev.target;

            if (el.id === 'pol-thr-add') {
                var shown = displayedCells(spec).filter(function (id) {
                    return spec.denominatorExcludes.indexOf(id) === -1;
                });
                if (!shown.length) return;
                spec.thresholds.push({ target: shown[0], value: 20, label: '', basis: '' });
                return refresh();
            }
            if (el.classList.contains('pol-thr-remove')) {
                spec.thresholds.splice(+el.getAttribute('data-thr-idx'), 1);
                return refresh();
            }
            if (el.id === 'pol-f-add') {
                var used = Object.keys(spec.formulas);
                WBCDialog.form({
                    title: 'Add Derived Figure',
                    message: 'A ratio or a percentage of a subset, computed from the categories you ' +
                        'choose next and reported alongside the differential.',
                    confirmText: 'Add Figure',
                    fields: [
                        {
                            name: 'key',
                            label: 'Identifier',
                            hint: 'Used as a template placeholder, so no spaces. ' +
                                (used.length ? 'Already defined: ' + used.join(', ') : ''),
                            placeholder: 'ME_ratio',
                            mono: true,
                            required: true,
                            transform: function (v) { return v.trim(); },
                            validate: function (v) {
                                if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(v)) {
                                    return 'Start with a letter, then letters, digits or underscores.';
                                }
                                if (used.indexOf(v) !== -1) return 'That identifier is already defined.';
                                // A formula named after a reserved placeholder
                                // would shadow it in every report template.
                                var reserved = window.WBCCore && window.WBCCore.RESERVED_PLACEHOLDERS;
                                if (reserved && reserved.indexOf(v) !== -1) {
                                    return '"' + v + '" is a reserved placeholder name.';
                                }
                                return null;
                            }
                        },
                        {
                            name: 'label',
                            label: 'Label in the report',
                            placeholder: 'M:E Ratio',
                            required: true
                        }
                    ],
                    onSubmit: function (values) {
                        getActiveSpec().formulas[values.key] = {
                            label: values.label, type: 'ratio',
                            numerator: [], denominator: [], precision: 1, basis: ''
                        };
                        refresh();
                    }
                });
                return;
            }
            if (el.classList.contains('pol-f-remove')) {
                delete spec.formulas[el.getAttribute('data-formula')];
                return refresh();
            }
        });
    }

    function clampInt(value, lo, hi, fallback) {
        var n = parseInt(value, 10);
        if (!isFinite(n)) n = fallback;
        return Math.min(hi, Math.max(lo, n));
    }

    // ================================================================
    // TEMPLATE EDITOR
    // ================================================================
    function renderTemplateEditor() {
        var spec = getActiveSpec();
        var container = document.getElementById('template-editor');
        var html = '';

        spec.templates.forEach(function (tpl, idx) {
            html += '<div class="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">';
            html += '<div class="flex items-center gap-2 mb-2">';
            html += '<input type="text" class="tpl-name px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100" data-tpl-idx="' + idx + '" value="' + escHtml(tpl.tplName) + '" placeholder="Template name">';
            html += '<input type="text" class="tpl-code px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-400 w-20" data-tpl-idx="' + idx + '" value="' + escHtml(tpl.tplCode) + '" placeholder="code">';
            if (spec.templates.length > 1) {
                html += '<button class="remove-tpl text-slate-500 hover:text-red-400 text-xs" data-tpl-idx="' + idx + '">&times; Remove</button>';
            }
            html += '</div>';
            html += '<textarea class="tpl-sentence w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs font-mono text-slate-300 resize-y" data-tpl-idx="' + idx + '" rows="3" placeholder="Output sentence with {{placeholders}}">' + escHtml(tpl.outSentence) + '</textarea>';
            html += '</div>';
        });

        container.innerHTML = html;

        // Wire events
        container.querySelectorAll('.tpl-name').forEach(function (input) {
            input.addEventListener('input', function () {
                spec.templates[parseInt(this.getAttribute('data-tpl-idx'))].tplName = this.value;
            });
        });
        container.querySelectorAll('.tpl-code').forEach(function (input) {
            input.addEventListener('input', function () {
                spec.templates[parseInt(this.getAttribute('data-tpl-idx'))].tplCode = this.value;
            });
        });
        container.querySelectorAll('.tpl-sentence').forEach(function (ta) {
            ta.addEventListener('input', function () {
                spec.templates[parseInt(this.getAttribute('data-tpl-idx'))].outSentence = this.value;
                updatePreview();
            });
        });
        container.querySelectorAll('.remove-tpl').forEach(function (btn) {
            btn.addEventListener('click', function () {
                spec.templates.splice(parseInt(this.getAttribute('data-tpl-idx')), 1);
                renderTemplateEditor();
            });
        });
    }

    /**
     * Every placeholder this profile actually resolves.
     *
     * This advertised four kinds of token while the engine supported the full
     * reserved set plus a per-100 form per excluded category. A laboratory
     * building a peripheral blood profile therefore could not discover
     * `{{nrbc_per100}}` — the one token that makes the denominator policy
     * reportable — from the editor that exists to build the report.
     */
    function updatePlaceholderList() {
        var spec = getActiveSpec();
        var allCells = spec.upper.concat(spec.lower);
        var groups = [];

        groups.push(['Counts', ['{{total}}', '{{totalCounted}}', '{{denominator}}']]);
        groups.push(['Percentages', allCells.map(function (ct) { return '{{' + ct + '}}'; })]);

        var per100 = (spec.denominatorExcludes || []).filter(function (ct) {
            return allCells.indexOf(ct) !== -1;
        }).map(function (ct) { return '{{' + ct + '_per100}}'; });
        if (per100.length) groups.push(['Per 100 (outside the denominator)', per100]);

        var derived = Object.keys(spec.formulas || {}).map(function (f) { return '{{' + f + '}}'; });
        if (derived.length) groups.push(['Derived figures', derived]);

        if (spec.absoluteCountsInReport) {
            groups.push(['Absolute counts (need an analyser WBC)',
                allCells.map(function (ct) { return '{{' + ct + '_abs}}'; })
                    .concat(['{{wbcEntered}}', '{{wbcUsed}}', '{{wbcBasis}}'])]);
        }

        groups.push(['Case and provenance', [
            '{{caseNumber}}', '{{comments}}', '{{specimenLabel}}', '{{specimenType}}',
            '{{profileId}}', '{{profileName}}', '{{configVersion}}', '{{timestamp}}', '{{methodNotes}}'
        ]]);

        var html = '';
        groups.forEach(function (g) {
            html += '<div class="mb-1"><span class="text-slate-500">' + escHtml(g[0]) + ':</span> ' +
                '<span class="font-mono text-slate-400">' + escHtml(g[1].join('  ')) + '</span></div>';
        });
        document.getElementById('placeholderList').innerHTML = html;
    }

    // ================================================================
    // MORPHOLOGY CHECKLIST EDITOR
    // ================================================================
    function renderMorphChecklist() {
        var spec = getActiveSpec();
        var container = document.getElementById('morph-checklist-editor');
        var html = '';

        spec.morphologyChecklist.forEach(function (item, idx) {
            html += '<div class="flex items-center gap-2">';
            html += '<input type="text" class="morph-item flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300" data-morph-idx="' + idx + '" value="' + escHtml(item) + '">';
            html += '<button class="remove-morph text-slate-500 hover:text-red-400 text-xs" data-morph-idx="' + idx + '">&times;</button>';
            html += '</div>';
        });

        if (spec.morphologyChecklist.length === 0) {
            html = '<p class="text-xs text-slate-600 italic">No checklist items defined.</p>';
        }

        container.innerHTML = html;

        container.querySelectorAll('.morph-item').forEach(function (input) {
            input.addEventListener('input', function () {
                spec.morphologyChecklist[parseInt(this.getAttribute('data-morph-idx'))] = this.value;
            });
        });
        container.querySelectorAll('.remove-morph').forEach(function (btn) {
            btn.addEventListener('click', function () {
                spec.morphologyChecklist.splice(parseInt(this.getAttribute('data-morph-idx')), 1);
                renderMorphChecklist();
            });
        });
    }

    // ================================================================
    // LIVE PREVIEW
    // ================================================================
    function updatePreview() {
        var spec = getActiveSpec();
        var allCells = spec.upper.concat(spec.lower);
        var container = document.getElementById('live-preview');

        if (allCells.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-500 italic">Add cells to the layout to see a preview.</p>';
            return;
        }

        // Build reverse map
        var cellToKey = {};
        Object.keys(spec.outCodes).forEach(function (k) {
            cellToKey[spec.outCodes[k]] = k;
        });

        var html = '<div class="overflow-x-auto">';
        html += '<table class="w-full border-collapse text-xs">';

        // Headers
        html += '<tr>';
        allCells.forEach(function (ct) {
            html += '<th class="px-2 py-1 text-slate-400 uppercase font-semibold text-center border-b border-slate-700/50">' + escHtml(ct) + '</th>';
        });
        html += '</tr>';

        // Sample values (all show "—")
        html += '<tr>';
        allCells.forEach(function (ct) {
            html += '<td class="px-2 py-2 text-center text-lg font-mono font-bold text-slate-300">0</td>';
        });
        html += '</tr>';

        // Keys
        html += '<tr>';
        allCells.forEach(function (ct) {
            var k = cellToKey[ct] || '?';
            html += '<td class="px-2 py-1 text-center"><kbd class="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-[10px] font-mono font-semibold text-slate-400">' + escHtml(k) + '</kbd></td>';
        });
        html += '</tr>';

        html += '</table></div>';

        container.innerHTML = html;
    }

    // ================================================================
    // SAVE FEEDBACK
    // ================================================================

    /**
     * Non-blocking status line. Replaces alert(), which suspends the page and
     * gives no room to list validation errors.
     */
    function setSaveStatus(kind, message) {
        var box = document.getElementById('save-status');
        if (!box) return;
        box.textContent = message;
        box.setAttribute('data-status', kind);
        box.className = kind === 'ok'
            ? 'mt-3 px-3 py-2 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            : 'mt-3 px-3 py-2 rounded-lg text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300';
    }

    function downloadProfile(json) {
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        var stamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = 'wbcds-config-' + editorState.profileId + '-' + stamp + '.json';
        document.body.appendChild(link);
        link.click();
        setTimeout(function () { URL.revokeObjectURL(url); link.remove(); }, 0);
    }

    // ================================================================
    // BUTTONS
    // ================================================================
    function wireButtons() {
        // Save profile
        document.getElementById('btnSaveProfile').addEventListener('click', function () {
            var config = buildConfigJSON();
            var json = JSON.stringify(config, null, 2);

            // Validate with the same engine the counter uses. A profile with no
            // cells, an unkeyed category, or a key mapped to a cell that is
            // never displayed cannot be counted with; caching it would report
            // success here while the counter silently kept the previous
            // profile. The draft is still downloadable as work in progress.
            var errors = [];
            if (window.WBCCore) {
                try {
                    errors = window.WBCCore.validateConfig(
                        window.WBCCore.normalizeConfig(JSON.parse(json)).specimenTypes);
                } catch (e) {
                    errors = [e.message];
                }
            }

            if (errors.length === 0) {
                try {
                    localStorage.setItem('wbcds_config', json);
                } catch (e) { /* ignore */ }
            }

            downloadProfile(json);

            if (errors.length === 0) {
                setSaveStatus('ok', 'Profile saved and made active. The counter will use it on next load.');
            } else {
                setSaveStatus('error',
                    'Downloaded as a draft, but NOT made active — this profile cannot be counted with: '
                    + errors.slice(0, 4).join('; '));
            }
        });

        // Load profile
        document.getElementById('btnLoadProfile').addEventListener('click', function () {
            document.getElementById('profileFileInput').click();
        });

        document.getElementById('profileFileInput').addEventListener('change', function (ev) {
            if (ev.target.files.length === 0) return;
            var reader = new FileReader();
            reader.onload = function (e) {
                try {
                    var raw = JSON.parse(e.target.result);
                    // Cache to localStorage too
                    localStorage.setItem('wbcds_config', JSON.stringify(raw));
                    loadExistingConfig();
                    renderSpecimenTabs();
                    renderLayout();
                    renderKeyAssignment();
                    renderSettings();
                    renderPolicyEditor();
                    renderTemplateEditor();
                    renderMorphChecklist();
                    updatePlaceholderList();
                    updatePreview();
                    setSaveStatus('ok', 'Profile loaded into the editor.');
                } catch (err) {
                    setSaveStatus('error', 'Invalid JSON file: ' + err.message);
                }
            };
            reader.readAsText(ev.target.files[0]);
            ev.target.value = '';
        });

        // Add specimen type
        //
        // Two chained prompt() dialogs previously asked for these. A prompt
        // cannot state the rules, cannot show which identifiers are taken, and
        // cannot refuse bad input except by reopening itself — so an identifier
        // with a space or a capital in it was accepted and produced a profile
        // that behaved oddly later. Both values are now asked for at once, in
        // the product's own dialog, and validated before anything is created.
        document.getElementById('btnAddSpecimen').addEventListener('click', function () {
            var taken = editorState.specimenTypes.map(function (sp) { return sp.specimenType; });
            WBCDialog.form({
                title: 'Add Specimen Type',
                message: 'A specimen type has its own layout, keys, target count and counting policy.',
                confirmText: 'Add Specimen Type',
                fields: [
                    {
                        name: 'id',
                        label: 'Identifier',
                        hint: 'Lower case, no spaces. Used in exports and in the profile file. ' +
                            (taken.length ? 'Already in use: ' + taken.join(', ') : ''),
                        placeholder: 'bf',
                        mono: true,
                        required: true,
                        transform: function (v) { return v.trim().toLowerCase(); },
                        validate: function (v) {
                            if (!/^[a-z][a-z0-9_-]*$/.test(v)) {
                                return 'Start with a letter, then letters, digits, hyphen or underscore.';
                            }
                            if (taken.indexOf(v) !== -1) return 'That identifier is already in use.';
                            return null;
                        }
                    },
                    {
                        name: 'label',
                        label: 'Display name',
                        hint: 'Shown on the specimen selector in the counter.',
                        placeholder: 'Body Fluid',
                        required: true
                    }
                ],
                onSubmit: function (values) { addSpecimenType(values.id, values.label); }
            });
        });

        function addSpecimenType(name, label) {
            editorState.specimenTypes.push({
                specimenType: name,
                specimenLabel: label || name.toUpperCase(),
                targetCount: 200,
                upperRowAbnormal: false,
                upper: [],
                lower: [],
                outCodes: {},
                templates: [{ tplCode: 'std', tplName: 'Standard', outSentence: '' }],
                morphologyChecklist: [],
                handedness: 'left',
                absoluteCounts: 'optional',
                audioEnabled: true,
                autosaveEnabled: true,
                absoluteCountsInReport: false,
                rounding: 'largest-remainder',
                precisionDisplay: 2,
                precisionReport: 0,
                ciEnabled: true,
                ciLevel: 0.95,
                denominatorExcludes: [],
                per100Reporting: {},
                thresholds: [],
                formulas: {}
            });
            editorState.activeSpecimenIdx = editorState.specimenTypes.length - 1;
            renderSpecimenTabs();
            renderLayout();
            renderKeyAssignment();
            renderSettings();
            renderPolicyEditor();
            renderTemplateEditor();
            renderMorphChecklist();
            updatePlaceholderList();
            updatePreview();
        }

        // Key assignment buttons
        document.getElementById('btnResetKeys').addEventListener('click', function () {
            resetAllKeys();
        });
        document.getElementById('btnAutoLeft').addEventListener('click', function () {
            autoAssignKeys('left');
        });
        document.getElementById('btnAutoRight').addEventListener('click', function () {
            autoAssignKeys('right');
        });

        // Add template
        document.getElementById('btnAddTemplate').addEventListener('click', function () {
            var spec = getActiveSpec();
            spec.templates.push({ tplCode: 'tpl' + spec.templates.length, tplName: 'New Template', outSentence: '' });
            renderTemplateEditor();
        });

        // Add morph item
        document.getElementById('btnAddMorphItem').addEventListener('click', function () {
            var spec = getActiveSpec();
            spec.morphologyChecklist.push('New finding');
            renderMorphChecklist();
        });
    }

    // ================================================================
    // BUILD CONFIG JSON
    // ================================================================
    /**
     * The version this profile should be saved under.
     *
     * It used to be hard-coded to '2.0'. The counter discards a cached profile
     * whose profileId matches a built-in one at a HIGHER version
     * (Core.isCacheSuperseded) — the mechanism that delivers corrected
     * profiles to an installed browser. With the built-in profile at 2.5,
     * every edit saved from this editor was therefore thrown away on the next
     * load while the editor reported "saved and made active".
     *
     * Editing a profile produces a newer revision of it, so the version is
     * carried forward from the source and its last component incremented.
     */
    function nextVersion() {
        var src = (editorState.rawConfig && editorState.rawConfig.version) || '2.0';
        var parts = String(src).split('.').map(function (n) { return parseInt(n, 10) || 0; });
        if (!parts.length) parts = [2, 0];
        parts[parts.length - 1] += 1;
        return parts.join('.');
    }

    function buildConfigJSON() {
        // Start from whatever was loaded so unmodelled top-level fields
        // (provenance above all) survive the round trip.
        var out = Object.assign({}, editorState.rawConfig || {});
        out.version = nextVersion();
        out.profileId = editorState.profileId;
        out.profileName = editorState.profileName;
        out.specimenTypes = editorState.specimenTypes.map(function (spec) {
            // Same principle per specimen: keep the source, override only what
            // this editor actually edits. denominatorExcludes, per100Reporting,
            // thresholds, confidenceIntervals, rounding, precision, formulas,
            // constituents, categoryNotes and targetCountBasis all ride along.
            var merged = Object.assign({}, spec.raw || {});
            merged.specimenType = spec.specimenType;
            merged.specimenLabel = spec.specimenLabel;
            merged.targetCount = spec.targetCount;
            merged.upperRowAbnormal = spec.upperRowAbnormal;
            merged.categories = {
                upper: spec.upper.slice(),
                lower: spec.lower.slice()
            };
            merged.outCodes = Object.assign({}, spec.outCodes);
            merged.templates = spec.templates.map(function (tpl) {
                return { tplCode: tpl.tplCode, tplName: tpl.tplName, outSentence: tpl.outSentence };
            });
            merged.audio = Object.assign(
                {
                    countSound: 'click',
                    undoSound: 'undo',
                    targetSound: 'chime',
                    typewriterSound: 'typewriter'
                },
                (spec.raw && spec.raw.audio) || {},
                { enabled: spec.audioEnabled !== false });
            merged.autosave = spec.autosaveEnabled !== false;
            merged.absoluteCounts = spec.absoluteCounts || 'optional';
            merged.handedness = spec.handedness || 'left';
            merged.morphologyChecklist = spec.morphologyChecklist.slice();
            if (merged.requireCaseNumber === undefined) merged.requireCaseNumber = false;
            if (merged.constituents === undefined) merged.constituents = {};

            // Counting policy (DCR-013). These are now edited, so they are
            // written from the editor rather than carried through. Empty
            // collections are omitted rather than written as empty ones, so a
            // profile states only the policy it actually sets.
            merged.absoluteCountsInReport = spec.absoluteCountsInReport === true;
            merged.rounding = spec.rounding || 'largest-remainder';
            merged.precision = { display: spec.precisionDisplay, report: spec.precisionReport };
            merged.confidenceIntervals = { enabled: spec.ciEnabled !== false, level: Number(spec.ciLevel) };
            merged.formulas = clone(spec.formulas || {});

            if (spec.denominatorExcludes && spec.denominatorExcludes.length) {
                merged.denominatorExcludes = spec.denominatorExcludes.slice();
            } else {
                delete merged.denominatorExcludes;
            }
            if (spec.per100Reporting && Object.keys(spec.per100Reporting).length) {
                merged.per100Reporting = clone(spec.per100Reporting);
            } else {
                delete merged.per100Reporting;
            }
            if (spec.thresholds && spec.thresholds.length) {
                merged.thresholds = clone(spec.thresholds);
            } else {
                delete merged.thresholds;
            }
            return merged;
        });
        return out;
    }

    // ================================================================
    // UTILITIES
    // ================================================================
    /**
     * Escape for interpolation into markup, INCLUDING attribute values.
     *
     * This used to round-trip through `div.textContent` -> `div.innerHTML`,
     * which escapes & < > but NOT " or '. It is used in roughly thirty
     * attribute positions — `value="' + escHtml(tpl.tplName) + '"` and the
     * like — so a profile field containing a double quote closed the attribute
     * and anything after it became markup. Profiles are JSON files shared
     * between institutions and loaded from disk, which is exactly why
     * wbc-core.js bothers with template sanitisation.
     *
     * Core.escapeAttr escapes all five characters. The fallback exists only so
     * the editor still renders if the engine failed to load.
     */
    function escHtml(str) {
        if (window.WBCCore && window.WBCCore.escapeAttr) {
            return window.WBCCore.escapeAttr(str);
        }
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ================================================================
    // BOOT
    // ================================================================
    initEditor();

})();
