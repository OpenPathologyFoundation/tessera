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
                autosaveEnabled: true
            }
        ]
    };

    // ================================================================
    // INITIALIZATION
    // ================================================================
    function initEditor() {
        // Apply theme from sessionStorage
        try {
            var theme = sessionStorage.getItem('wbcds_theme');
            if (theme) document.body.setAttribute('data-theme', theme);
        } catch (e) { /* ignore */ }

        // Try to load existing config from localStorage
        loadExistingConfig();

        renderCellReference();
        renderSpecimenTabs();
        renderLayout();
        renderKeyAssignment();
        renderSettings();
        renderTemplateEditor();
        renderMorphChecklist();
        updatePlaceholderList();
        updatePreview();

        // Wire up events
        wireDropZones();
        wireButtons();
        wireSettings();
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
            editorState.specimenTypes = specimenTypes.map(function (spec) {
                var outCodes = spec.outCodes || {};
                return {
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

    function isDuplicateKey(key, cellType, spec) {
        var count = 0;
        Object.keys(spec.outCodes).forEach(function (k) {
            if (k === key) count++;
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

    function updatePlaceholderList() {
        var spec = getActiveSpec();
        var allCells = spec.upper.concat(spec.lower);
        var placeholders = ['{{total}}'].concat(allCells.map(function (ct) { return '{{' + ct + '}}'; }));
        placeholders.push('{{ME_ratio}}', '{{caseNumber}}', '{{comments}}');
        document.getElementById('placeholderList').textContent = placeholders.join('  ');
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
        document.getElementById('btnAddSpecimen').addEventListener('click', function () {
            var name = prompt('Specimen type ID (e.g., "bf" for body fluid):');
            if (!name) return;
            var label = prompt('Display label (e.g., "Body Fluid"):');
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
                autosaveEnabled: true
            });
            editorState.activeSpecimenIdx = editorState.specimenTypes.length - 1;
            renderSpecimenTabs();
            renderLayout();
            renderKeyAssignment();
            renderSettings();
            renderTemplateEditor();
            renderMorphChecklist();
            updatePlaceholderList();
            updatePreview();
        });

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
    function buildConfigJSON() {
        return {
            version: '2.0',
            profileId: editorState.profileId,
            profileName: editorState.profileName,
            specimenTypes: editorState.specimenTypes.map(function (spec) {
                return {
                    specimenType: spec.specimenType,
                    specimenLabel: spec.specimenLabel,
                    targetCount: spec.targetCount,
                    requireCaseNumber: false,
                    upperRowAbnormal: spec.upperRowAbnormal,
                    categories: {
                        upper: spec.upper.slice(),
                        lower: spec.lower.slice()
                    },
                    outCodes: Object.assign({}, spec.outCodes),
                    formulas: {},
                    templates: spec.templates.map(function (tpl) {
                        return { tplCode: tpl.tplCode, tplName: tpl.tplName, outSentence: tpl.outSentence };
                    }),
                    constituents: {},
                    audio: {
                        enabled: spec.audioEnabled !== false,
                        countSound: 'click',
                        undoSound: 'undo',
                        targetSound: 'chime',
                        typewriterSound: 'typewriter'
                    },
                    autosave: spec.autosaveEnabled !== false,
                    absoluteCounts: spec.absoluteCounts || 'optional',
                    handedness: spec.handedness || 'left',
                    morphologyChecklist: spec.morphologyChecklist.slice()
                };
            })
        };
    }

    // ================================================================
    // UTILITIES
    // ================================================================
    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    // ================================================================
    // BOOT
    // ================================================================
    initEditor();

})();
