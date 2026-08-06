/**
 * WBC ΔΣ — Dialog
 * ================
 * Implements: SYS-244..SYS-247 (see DCR-014)
 *
 * One dialog widget for the whole product: acknowledgement, confirmation and
 * short forms. It replaces the browser's own `prompt()`, `confirm()` and
 * `alert()`, which the configuration editor used to ask for a specimen type
 * identifier and a derived-figure name.
 *
 * WHY THAT MATTERED
 *
 * A native dialog is not merely unstyled. It ignores the selected theme, it
 * cannot show a hint or a validation message, it offers no way to reject bad
 * input except to reopen itself, it cannot be reached by the automation the
 * verification suite depends on, and it suspends the page while it is open.
 * Two of the three prompts asked for an identifier with rules — lower case,
 * no spaces, not already in use — that the prompt had no way to express or
 * enforce.
 *
 * MARKUP
 *
 * The counter carries the dialog markup in its own HTML (SYS-070 asserts it is
 * there). Where the markup is absent — the configuration editor — this module
 * builds the identical structure and appends it. Either way there is one
 * implementation and one appearance, and the element ids are the same, so the
 * behaviour the existing verification depends on is unchanged.
 *
 * KEYBOARD AND FOCUS
 *
 * Focus moves to the first field, or to the confirming button when there is
 * none, and returns to whatever held it when the dialog closes. Tab is trapped
 * inside the dialog. Enter confirms from any single-line field. Escape cancels,
 * EXCEPT where both branches are consequential — the interrupted-count prompt
 * offers Restore and Discard, and a stray Escape must not discard a count. That
 * dialog is opened with `dismissible: false`.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WBCDialog = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var OVERLAY_CLASS = 'hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm ' +
        'flex items-center justify-center p-4';
    var BOX_CLASS = 'bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full p-6 animate-in';
    var CONFIRM_CLASS = 'px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg ' +
        'text-sm font-medium transition-colors';
    var CANCEL_CLASS = 'px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg ' +
        'text-sm font-medium transition-colors';

    var active = null;         // the open dialog's state, or null
    var previousFocus = null;

    function byId(id) { return document.getElementById(id); }

    /**
     * The overlay, built once if the page does not already carry it.
     * `#modal-fields` is added to pages whose markup predates form dialogs.
     */
    function ensureMarkup() {
        var overlay = byId('modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            overlay.className = OVERLAY_CLASS;
            overlay.innerHTML =
                '<div id="modal-box" class="' + BOX_CLASS + ' max-w-sm" role="dialog" aria-modal="true" ' +
                'aria-labelledby="modal-title">' +
                '<h3 id="modal-title" class="text-lg font-semibold text-slate-200 mb-2"></h3>' +
                '<p id="modal-message" class="text-sm text-slate-400 mb-6"></p>' +
                '<div id="modal-fields" class="hidden space-y-4 mb-6"></div>' +
                '<div class="flex justify-end gap-3">' +
                '<button id="modal-cancel" type="button" class="' + CANCEL_CLASS + '">Cancel</button>' +
                '<button id="modal-confirm" type="button" class="' + CONFIRM_CLASS + '"></button>' +
                '</div></div>';
            document.body.appendChild(overlay);
        }
        var box = byId('modal-box');
        if (box && !box.getAttribute('role')) {
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            box.setAttribute('aria-labelledby', 'modal-title');
        }
        if (!byId('modal-fields')) {
            var fields = document.createElement('div');
            fields.id = 'modal-fields';
            fields.className = 'hidden space-y-4 mb-6';
            byId('modal-message').insertAdjacentElement('afterend', fields);
        }
        return overlay;
    }

    function focusable(box) {
        return Array.prototype.filter.call(
            box.querySelectorAll('button, [href], input, select, textarea, [tabindex]'),
            function (elm) {
                // getClientRects rather than offsetParent: the overlay is
                // position:fixed, where offsetParent is unreliable.
                return !elm.disabled && elm.tabIndex !== -1 && elm.getClientRects().length > 0;
            });
    }

    function renderFields(container, fields) {
        container.innerHTML = '';
        fields.forEach(function (f, i) {
            var wrap = document.createElement('div');

            var label = document.createElement('label');
            label.className = 'block text-[11px] text-slate-500 mb-1';
            label.setAttribute('for', 'modal-field-' + i);
            label.textContent = f.label;
            wrap.appendChild(label);

            var input = document.createElement('input');
            input.type = 'text';
            input.id = 'modal-field-' + i;
            input.name = f.name;
            // bg-slate-900 rather than the box's slate-800, so the field reads
            // as an input rather than as part of the panel, in both themes.
            input.className = 'modal-field w-full px-3 py-2 bg-slate-900 border border-slate-600 ' +
                'rounded-lg text-sm text-slate-100' + (f.mono ? ' font-mono' : '');
            input.value = f.value || '';
            if (f.placeholder) input.placeholder = f.placeholder;
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('data-field-index', String(i));
            wrap.appendChild(input);

            if (f.hint) {
                var hint = document.createElement('p');
                hint.className = 'text-[11px] text-slate-500 mt-1';
                hint.textContent = f.hint;
                wrap.appendChild(hint);
            }

            var error = document.createElement('p');
            error.className = 'modal-field-error hidden text-[11px] text-red-400 mt-1';
            error.id = 'modal-field-error-' + i;
            error.setAttribute('role', 'alert');
            wrap.appendChild(error);

            container.appendChild(wrap);
        });
    }

    function readValues(fields) {
        var values = {};
        fields.forEach(function (f, i) {
            var raw = byId('modal-field-' + i).value;
            values[f.name] = f.transform ? f.transform(raw) : raw.trim();
        });
        return values;
    }

    /**
     * Validate on submit and show the reason beneath the offending field.
     * A native prompt could only discard the input and ask again.
     */
    function validate(fields) {
        var values = readValues(fields);
        var firstBad = -1;
        fields.forEach(function (f, i) {
            var error = byId('modal-field-error-' + i);
            var input = byId('modal-field-' + i);
            var message = null;
            if (f.required && !values[f.name]) {
                message = (f.label || 'This') + ' is required.';
            } else if (f.validate) {
                message = f.validate(values[f.name], values) || null;
            }
            error.textContent = message || '';
            error.classList.toggle('hidden', !message);
            input.classList.toggle('border-red-400', !!message);
            input.classList.toggle('border-slate-600', !message);
            input.setAttribute('aria-invalid', message ? 'true' : 'false');
            if (message && firstBad === -1) firstBad = i;
        });
        if (firstBad !== -1) {
            byId('modal-field-' + firstBad).focus();
            return null;
        }
        return values;
    }

    function close() {
        if (!active) return;
        var overlay = byId('modal-overlay');
        overlay.classList.add('hidden');
        document.removeEventListener('keydown', active.onKeyDown, true);
        active = null;

        // Restore on the next tick, not synchronously. Hiding the overlay
        // takes focus away from whatever inside it held it, and WebKit
        // performs that reset AFTER this call returns — so a synchronous
        // focus() was immediately overwritten and focus landed on <body>.
        var restore = previousFocus;
        previousFocus = null;
        if (restore && restore.focus) {
            setTimeout(function () {
                try { restore.focus(); } catch (e) { /* element may be gone */ }
            }, 0);
        }
    }

    /**
     * @param {object} opts
     *   title, message, fields[], confirmText, cancelText (null hides Cancel),
     *   onConfirm(values), onCancel, dismissible (default true), width
     */
    function open(opts) {
        close();
        var overlay = ensureMarkup();
        var box = byId('modal-box');
        var fields = opts.fields || [];

        byId('modal-title').textContent = opts.title || '';

        var message = byId('modal-message');
        message.textContent = opts.message || '';
        message.classList.toggle('hidden', !opts.message);
        // Without a message the title would otherwise sit flush against the
        // first field.
        message.className = 'text-sm text-slate-400 ' + (fields.length ? 'mb-4' : 'mb-6') +
            (opts.message ? '' : ' hidden');

        box.className = BOX_CLASS + ' ' + (opts.width || (fields.length ? 'max-w-md' : 'max-w-sm'));

        var fieldWrap = byId('modal-fields');
        fieldWrap.classList.toggle('hidden', fields.length === 0);
        renderFields(fieldWrap, fields);

        // Replace both buttons so no listener from a previous dialog survives.
        var confirmBtn = byId('modal-confirm').cloneNode(false);
        var cancelBtn = byId('modal-cancel').cloneNode(false);
        confirmBtn.id = 'modal-confirm';
        cancelBtn.id = 'modal-cancel';
        confirmBtn.type = 'button';
        cancelBtn.type = 'button';
        confirmBtn.className = CONFIRM_CLASS;
        cancelBtn.className = CANCEL_CLASS;
        confirmBtn.textContent = opts.confirmText || 'OK';
        cancelBtn.textContent = opts.cancelText || 'Cancel';
        byId('modal-confirm').replaceWith(confirmBtn);
        byId('modal-cancel').replaceWith(cancelBtn);
        cancelBtn.classList.toggle('hidden', opts.cancelText === null);

        function doConfirm() {
            var values = fields.length ? validate(fields) : {};
            if (values === null) return;          // invalid: stay open
            var cb = opts.onConfirm;
            close();
            if (cb) cb(values);
        }
        function doCancel() {
            var cb = opts.onCancel;
            close();
            if (cb) cb();
        }

        confirmBtn.addEventListener('click', doConfirm);
        cancelBtn.addEventListener('click', doCancel);

        // Escape cancels unless the caller says both branches are consequential.
        var dismissible = opts.dismissible !== false;

        function onKeyDown(ev) {
            if (ev.key === 'Escape') {
                if (dismissible) { ev.preventDefault(); ev.stopPropagation(); doCancel(); }
                return;
            }
            if (ev.key === 'Enter' && ev.target && ev.target.classList &&
                ev.target.classList.contains('modal-field')) {
                ev.preventDefault();
                ev.stopPropagation();
                doConfirm();
                return;
            }
            if (ev.key === 'Tab') {
                // Move focus explicitly rather than only wrapping at the ends.
                //
                // Wrapping assumed the engine's own tab order matches this
                // list. WebKit does not put buttons in the tab order unless
                // full keyboard access is switched on, so from the last FIELD
                // it tabbed straight out of the dialog and the guard, which was
                // watching for the last BUTTON, never fired. Driving the cycle
                // here makes it identical on every engine.
                var items = focusable(byId('modal-box'));
                if (!items.length) return;
                ev.preventDefault();
                var at = items.indexOf(document.activeElement);
                var step = ev.shiftKey ? -1 : 1;
                var next = at === -1
                    ? (ev.shiftKey ? items.length - 1 : 0)
                    : (at + step + items.length) % items.length;
                items[next].focus();
                return;
            }
            // The counter binds counting keys to the document. While a dialog
            // is open those keystrokes belong to the dialog, not the tally.
            if (ev.target && ev.target.classList && ev.target.classList.contains('modal-field')) {
                ev.stopPropagation();
            }
        }

        previousFocus = document.activeElement;
        active = { onKeyDown: onKeyDown };
        document.addEventListener('keydown', onKeyDown, true);

        overlay.classList.remove('hidden');
        var target = fields.length ? byId('modal-field-0') : confirmBtn;
        if (target) { target.focus(); if (target.select) target.select(); }
    }

    /**
     * Acknowledgement: nothing to decide. No Cancel.
     *
     * `onOk` runs on BOTH paths. An alert has one outcome — it has been read —
     * so dismissing it with Escape must do what pressing OK does. It did not:
     * the "Configuration Updated" alert chains to interrupted-count recovery,
     * and Escape silently skipped it, losing the offer to restore a count.
     * That was introduced with Escape support itself; there was no way to
     * dismiss an alert before.
     */
    function showAlert(title, message, onOk) {
        open({
            title: title, message: message,
            confirmText: 'OK', cancelText: null,
            onConfirm: onOk, onCancel: onOk
        });
    }

    /** Two-way choice. Cancel is always offered. */
    function showConfirm(title, message, confirmText, onConfirm, cancelText, onCancel, opts) {
        opts = opts || {};
        open({
            title: title, message: message,
            confirmText: confirmText, cancelText: cancelText || 'Cancel',
            onConfirm: onConfirm, onCancel: onCancel,
            dismissible: opts.dismissible
        });
    }

    /** Short form. `onSubmit` receives an object keyed by field name. */
    function showForm(opts) {
        open({
            title: opts.title, message: opts.message, fields: opts.fields,
            confirmText: opts.confirmText || 'Add', cancelText: opts.cancelText || 'Cancel',
            onConfirm: opts.onSubmit, onCancel: opts.onCancel
        });
    }

    return {
        open: open,
        alert: showAlert,
        confirm: showConfirm,
        form: showForm,
        close: close,
        isOpen: function () { return active !== null; }
    };
}));
