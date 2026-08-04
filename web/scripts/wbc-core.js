/**
 * WBC ΔΣ — Core Calculation and Configuration Engine
 * ===================================================
 * Implements: SRS SYS-040..SYS-047, SYS-100..SYS-103, SYS-S04
 *
 * This module contains every safety-critical computation in the application.
 * It is deliberately free of DOM access so that the SHIPPED code — not a copy
 * of it — can be executed directly by the verification test suite.
 *
 * Loaded as a plain <script> in the browser (sets window.WBCCore) and via
 * require() in Node. No build step, no runtime dependencies.
 */
(function (root, factory) {
    'use strict';
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WBCCore = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Default target cell counts per specimen type (URS-105).
    // PB: 200 per CLSI H20-A2. BM: 500 per CAP recommendation.
    var DEFAULT_TARGET = { bm: 500, pb: 200 };
    var FALLBACK_TARGET = 200;

    // Tags permitted in rendered output templates. Everything else is escaped.
    var ALLOWED_TAGS = 'br|b|i|em|strong|u|p';

    // Placeholder names the template engine owns. A cell type sharing one of
    // these would shadow it — a category named "total" would make {{total}}
    // render that category's percentage instead of the cell count, silently
    // corrupting every report built from the profile.
    var RESERVED_PLACEHOLDERS = [
        'total', 'caseNumber', 'comments', 'ME_ratio', 'specimenType',
        'specimenLabel', 'profileId', 'profileName', 'configVersion', 'timestamp'
    ];

    function hasOwn(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    // ================================================================
    // ESCAPING / SANITIZATION (SYS-S04)
    // ================================================================

    /**
     * HTML-escape a string. Ampersand must be replaced first.
     */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Escape a string for use inside an HTML attribute value.
     */
    function escapeAttr(str) {
        return escapeHtml(str);
    }

    /**
     * Sanitize rendered template output for innerHTML insertion.
     *
     * Output templates are institution-authored and legitimately contain simple
     * formatting markup (notably <br> in the tabular templates), so the result
     * cannot simply be escaped wholesale. Instead everything is escaped and then
     * only the allowlisted tags are restored. Attributes are never restored, so
     * event-handler payloads such as <img onerror=...> cannot survive.
     */
    function sanitizeTemplateHtml(text) {
        var escaped = escapeHtml(text);
        var re = new RegExp('&lt;(\\/?)(' + ALLOWED_TAGS + ')\\s*\\/?&gt;', 'gi');
        return escaped.replace(re, function (match, slash, tag) {
            return '<' + slash + tag.toLowerCase() + '>';
        });
    }

    /**
     * Convert sanitized template HTML back to plain text for clipboard,
     * CSV and JSON export.
     */
    function htmlToText(html) {
        return String(html)
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&');
    }

    // ================================================================
    // COUNT ARITHMETIC (SYS-040 to SYS-045)
    // ================================================================

    /**
     * Coerce a persisted count to a valid tally: a non-negative integer.
     *
     * Counts reaching the application from localStorage (crash recovery) have
     * left the protection of the keyboard handler's decrement guard and may
     * have been edited by hand. A negative value would produce a negative
     * percentage and corrupt every denominator, so it is rejected here rather
     * than propagated.
     */
    function sanitizeCount(value) {
        var n = Number(value);
        if (!isFinite(n) || n < 0) return 0;
        return Math.floor(n);
    }

    /**
     * Apply sanitizeCount across a counts object, keeping only the cell types
     * the active profile actually defines.
     */
    function sanitizeCounts(saved, allowedTypes) {
        var out = {};
        (allowedTypes || []).forEach(function (ct) { out[ct] = 0; });
        Object.keys(saved || {}).forEach(function (ct) {
            if (Object.prototype.hasOwnProperty.call(out, ct)) {
                out[ct] = sanitizeCount(saved[ct]);
            }
        });
        return out;
    }

    /**
     * Sum every count. Non-numeric and negative entries contribute zero.
     */
    function getTotal(counts) {
        var sum = 0;
        Object.keys(counts || {}).forEach(function (ct) {
            var v = counts[ct];
            if (typeof v === 'number' && isFinite(v) && v > 0) sum += v;
        });
        return sum;
    }

    /**
     * Raw (unrounded) percentage of each cell type.
     * Division-by-zero guard: every value is 0 when total is 0 (SYS-042).
     */
    function calcPercentages(counts) {
        var total = getTotal(counts);
        var percentages = {};
        Object.keys(counts || {}).forEach(function (ct) {
            percentages[ct] = total === 0 ? 0 : (counts[ct] / total) * 100;
        });
        return { percentages: percentages, total: total };
    }

    /**
     * Percentages rounded to `decimals` places and forced to sum to exactly
     * 100 (URS-034 / SYS-044).
     *
     * Uses the largest-remainder (Hare) method: every value is floored, then
     * the units left over are handed one at a time to the categories with the
     * largest truncated remainders.
     *
     * DEVIATION FROM URS-034 AS WRITTEN (see DCR-004). The requirement text
     * says to apply the rounding residual "to the largest-count category".
     * Doing so concentrates the entire residual in one cell type, and at the
     * integer precision used by the report templates that residual can reach
     * several percentage points: a 14-category differential of equal counts
     * (true value 7.14% each) rounds to 7% each, leaving a residual of 2 that
     * would be reported as 9% for one category — a clinically misleading 1.9
     * point overstatement. The largest-remainder method holds every category
     * within one unit of its true value while still summing to exactly 100,
     * so it satisfies the intent of URS-034 with strictly less distortion.
     *
     * Ties are broken by larger raw count, then by config order, so the result
     * is fully deterministic for a given counts object.
     *
     * When the total is zero every value is 0 and no adjustment is made —
     * there is nothing counted to distribute.
     *
     * @param {Object} counts   { cellType: integer }
     * @param {number} decimals decimal places (0 for output templates, 2 for display)
     * @returns {Object} { cellType: number } summing to exactly 100 (or all 0)
     */
    function percentagesSummingTo100(counts, decimals) {
        var cellTypes = Object.keys(counts || {});
        var total = getTotal(counts);
        var out = {};

        if (total === 0) {
            cellTypes.forEach(function (ct) { out[ct] = 0; });
            return out;
        }

        var factor = Math.pow(10, decimals);
        var target = Math.round(100 * factor);
        var entries = [];
        var floorSum = 0;

        cellTypes.forEach(function (ct, idx) {
            var exact = (counts[ct] / total) * 100 * factor;
            // Guard against binary representations that sit a hair below an
            // exact integer (e.g. 2499.9999999999995 for a true 2500).
            var snapped = Math.abs(exact - Math.round(exact)) < 1e-9 ? Math.round(exact) : exact;
            var floored = Math.floor(snapped);
            floorSum += floored;
            entries.push({
                ct: ct,
                floored: floored,
                remainder: snapped - floored,
                count: counts[ct],
                idx: idx
            });
        });

        var deficit = target - floorSum;
        if (deficit < 0) deficit = 0;
        if (deficit > entries.length) deficit = entries.length;

        entries.slice()
            .sort(function (a, b) {
                if (b.remainder !== a.remainder) return b.remainder - a.remainder;
                if (b.count !== a.count) return b.count - a.count;
                return a.idx - b.idx;
            })
            .slice(0, deficit)
            .forEach(function (e) { e.floored += 1; });

        entries.forEach(function (e) {
            out[e.ct] = e.floored / factor;
        });
        return out;
    }

    /**
     * Format a percentage for display at a fixed precision (URS-032: 2 dp).
     */
    function formatPercent(value, decimals) {
        var d = typeof decimals === 'number' ? decimals : 2;
        return Number(value).toFixed(d) + '%';
    }

    /**
     * Compute a config-defined derived ratio, e.g. M:E (SYS-046, SYS-047).
     * Returns 'N/A' when the denominator is zero, or null when no formula
     * is defined for the specimen type.
     */
    function computeRatio(counts, formula) {
        if (!formula || !Array.isArray(formula.numerator) || !Array.isArray(formula.denominator)) {
            return null;
        }
        var numSum = 0;
        formula.numerator.forEach(function (ct) { numSum += (counts[ct] || 0); });
        var denSum = 0;
        formula.denominator.forEach(function (ct) { denSum += (counts[ct] || 0); });
        if (denSum === 0) return 'N/A';
        var precision = typeof formula.precision === 'number' ? formula.precision : 1;
        return (numSum / denSum).toFixed(precision) + ':1';
    }

    /**
     * Absolute count for a cell type given an analyser WBC (URS-036).
     * WBC x percentage / 100.
     */
    function computeAbsolute(wbcTotal, percentage) {
        if (typeof wbcTotal !== 'number' || !isFinite(wbcTotal) || wbcTotal <= 0) return null;
        return (wbcTotal * percentage) / 100;
    }

    // ================================================================
    // OUTPUT TEMPLATES (SYS-060 to SYS-067)
    // ================================================================

    /**
     * Substitute {{placeholder}} tokens then sanitize the result.
     *
     * A replacer function is used rather than repeated String.replace calls so
     * that values containing '$&' or '$`' are inserted literally, and so that
     * every token is resolved in a single pass. Unknown placeholders are left
     * intact, making a template typo visible to the author instead of silently
     * producing an empty field.
     */
    function renderTemplate(tplText, values) {
        var vals = values || {};
        var raw = String(tplText).replace(/\{\{\s*(\w+)\s*\}\}/g, function (match, key) {
            if (!hasOwn(vals, key)) return match;
            var v = vals[key];
            return (v === null || v === undefined) ? '' : String(v);
        });
        return sanitizeTemplateHtml(raw);
    }

    /**
     * Build the full substitution map for one finalized count.
     * Includes the traceability fields required by URS-052.
     */
    function buildTemplateValues(session, roundedPercentages) {
        var values = {
            caseNumber: session.caseNumber || '',
            total: session.totalCount,
            comments: session.morphologyComments || '',
            ME_ratio: session.meRatio || 'N/A',
            specimenType: session.specimenType || '',
            specimenLabel: session.specimenLabel || '',
            profileId: session.configProfileId || '',
            profileName: session.configProfileName || '',
            configVersion: session.configVersion || '',
            timestamp: session.timestamp || ''
        };
        Object.keys(roundedPercentages || {}).forEach(function (ct) {
            values[ct] = roundedPercentages[ct];
        });
        return values;
    }

    /**
     * Advisory note shown when a count finishes below the configured target
     * (URS-041 / SYS-053). Returns null when the target has been met.
     * Non-blocking by design: the target is advisory, never enforced.
     */
    function buildLowCountNote(total, targetCount) {
        if (typeof targetCount !== 'number' || targetCount <= 0) return null;
        if (total >= targetCount) return null;
        return total + '-cell count (target ' + targetCount + '); statistical ' +
            'confidence reduced for populations <5%.';
    }

    // ================================================================
    // EXPORT SERIALIZATION (SYS-096, SYS-097)
    // ================================================================

    /**
     * Escape one CSV field.
     *
     * Values beginning with a spreadsheet formula character are prefixed with a
     * single quote so that a case number or comment cannot execute on open in
     * Excel / Sheets. JSON export preserves the value verbatim and is the
     * fidelity-preserving path.
     */
    function escapeCsv(value) {
        if (value === null || value === undefined) return '';
        var str = String(value);
        if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
        if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
        return str;
    }

    var CSV_HEADERS = [
        'caseNumber',
        'specimenType',
        'specimenLabel',
        'timestamp',
        'configProfileId',
        'configProfileName',
        'configVersion',
        'targetCount',
        'totalCount',
        'meRatio',
        'morphologyComments',
        'counts',
        'percentages',
        'outputs'
    ];

    /**
     * Serialize session history to CSV. Every row carries the traceability
     * fields required by URS-052.
     */
    function buildSessionCsv(sessions) {
        var lines = [CSV_HEADERS.join(',')];
        (sessions || []).forEach(function (session) {
            var outputsText = {};
            Object.keys(session.outputs || {}).forEach(function (code) {
                outputsText[code] = htmlToText(session.outputs[code]);
            });
            var row = [
                session.caseNumber,
                session.specimenType,
                session.specimenLabel,
                session.timestamp,
                session.configProfileId,
                session.configProfileName,
                session.configVersion,
                session.targetCount,
                session.totalCount,
                session.meRatio,
                session.morphologyComments || '',
                JSON.stringify(session.counts || {}),
                JSON.stringify(session.percentages || {}),
                JSON.stringify(outputsText)
            ].map(escapeCsv);
            lines.push(row.join(','));
        });
        return lines.join('\n');
    }

    /**
     * Serialize session history to JSON, converting rendered output HTML back
     * to plain text so the archive is presentation-independent.
     */
    function buildSessionJson(sessions) {
        var plain = (sessions || []).map(function (session) {
            var copy = {};
            Object.keys(session).forEach(function (k) { copy[k] = session[k]; });
            var outputsText = {};
            Object.keys(session.outputs || {}).forEach(function (code) {
                outputsText[code] = htmlToText(session.outputs[code]);
            });
            copy.outputs = outputsText;
            return copy;
        });
        return JSON.stringify(plain, null, 2);
    }

    // ================================================================
    // CONFIGURATION (SYS-100 to SYS-103)
    // ================================================================

    /**
     * Accept either the legacy bare array or the v2 object envelope and return
     * a normalized structure that retains the profile metadata needed for
     * output traceability (URS-052).
     */
    function normalizeConfig(raw) {
        var specimenTypes;
        var meta;

        if (Array.isArray(raw)) {
            specimenTypes = raw;
            meta = { version: '1.0', profileId: 'legacy', profileName: 'Legacy Profile' };
        } else if (raw && Array.isArray(raw.specimenTypes)) {
            specimenTypes = raw.specimenTypes;
            meta = {
                version: raw.version || '2.0',
                profileId: raw.profileId || 'custom',
                profileName: raw.profileName || 'Custom Profile'
            };
        } else {
            throw new Error('Invalid config format: expected an array or an object with a specimenTypes array');
        }

        specimenTypes.forEach(function (spec) {
            if (!spec || typeof spec !== 'object') return;
            if (!spec.targetCount) {
                spec.targetCount = DEFAULT_TARGET[spec.specimenType] || FALLBACK_TARGET;
            }
            if (!spec.specimenLabel) {
                if (spec.specimenType === 'bm') spec.specimenLabel = 'Bone Marrow';
                else if (spec.specimenType === 'pb') spec.specimenLabel = 'Peripheral Blood';
                else if (spec.specimenType === 'bf') spec.specimenLabel = 'Body Fluid';
                else spec.specimenLabel = String(spec.specimenType || '').toUpperCase();
            }
        });

        return {
            version: meta.version,
            profileId: meta.profileId,
            profileName: meta.profileName,
            specimenTypes: specimenTypes
        };
    }

    /**
     * Structural validation of a specimen type list.
     *
     * Beyond the presence checks, this enforces the two invariants whose
     * violation causes silent clinical error:
     *
     *   1. Every key-mapped cell type must be displayed. A cell present in
     *      outCodes but absent from categories would be counted into the grand
     *      total and every percentage denominator while never appearing on
     *      screen — an undetectable miscount.
     *   2. Every displayed cell type must have a key (URS-021, URS-022), and no
     *      cell type may appear twice, which would double it into subtotals.
     *
     * @returns {string[]} human-readable errors; empty when valid
     */
    function validateConfig(specimenTypes) {
        var errors = [];

        if (!Array.isArray(specimenTypes) || specimenTypes.length === 0) {
            errors.push('Configuration must define at least one specimen type');
            return errors;
        }

        var seenSpecimen = {};

        specimenTypes.forEach(function (spec, idx) {
            var name = (spec && spec.specimenType) ? spec.specimenType : 'entry ' + idx;

            if (!spec || typeof spec !== 'object') {
                errors.push(name + ': not an object');
                return;
            }
            if (!spec.specimenType) {
                errors.push('Entry ' + idx + ': missing specimenType');
            } else if (seenSpecimen[spec.specimenType]) {
                errors.push(name + ': duplicate specimenType');
            } else {
                seenSpecimen[spec.specimenType] = true;
            }

            var cats = spec.categories;
            if (!cats || !Array.isArray(cats.upper) || !Array.isArray(cats.lower)) {
                errors.push(name + ': missing categories.upper / categories.lower arrays');
                return;
            }

            var outCodes = spec.outCodes;
            if (!outCodes || typeof outCodes !== 'object' || Object.keys(outCodes).length === 0) {
                errors.push(name + ': missing or empty outCodes');
                return;
            }

            var displayed = cats.upper.concat(cats.lower);
            var displayedSet = {};
            displayed.forEach(function (ct) {
                if (displayedSet[ct]) {
                    errors.push(name + ': cell type "' + ct + '" appears more than once in categories');
                }
                displayedSet[ct] = true;
            });

            displayed.forEach(function (ct) {
                if (RESERVED_PLACEHOLDERS.indexOf(ct) !== -1) {
                    errors.push(name + ': cell type "' + ct + '" is a reserved template placeholder name (' +
                        RESERVED_PLACEHOLDERS.join(', ') + ') and would corrupt report output');
                }
            });

            var mappedSet = {};
            Object.keys(outCodes).forEach(function (key) {
                var ct = outCodes[key];
                if (mappedSet[ct]) {
                    errors.push(name + ': cell type "' + ct + '" is mapped to more than one key');
                }
                mappedSet[ct] = true;
                if (!displayedSet[ct]) {
                    errors.push(name + ': key "' + key + '" maps to "' + ct +
                        '" which is not displayed in any category row (would be counted but never shown)');
                }
            });

            displayed.forEach(function (ct) {
                if (!mappedSet[ct]) {
                    errors.push(name + ': cell type "' + ct + '" has no keyboard key assigned');
                }
            });

            if (!Array.isArray(spec.templates) || spec.templates.length === 0) {
                errors.push(name + ': missing output templates');
            } else {
                spec.templates.forEach(function (tpl, tplIdx) {
                    if (!tpl || !tpl.tplCode) errors.push(name + ': template ' + tplIdx + ' missing tplCode');
                    if (!tpl || typeof tpl.outSentence !== 'string') {
                        errors.push(name + ': template ' + tplIdx + ' missing outSentence');
                    }
                });
            }

            if (typeof spec.targetCount !== 'number' || spec.targetCount <= 0) {
                errors.push(name + ': targetCount must be a positive number');
            }

            if (spec.formulas) {
                Object.keys(spec.formulas).forEach(function (fname) {
                    var f = spec.formulas[fname];
                    if (!f || !Array.isArray(f.numerator) || !Array.isArray(f.denominator)) {
                        errors.push(name + ': formula "' + fname + '" needs numerator and denominator arrays');
                        return;
                    }
                    f.numerator.concat(f.denominator).forEach(function (ct) {
                        if (!mappedSet[ct]) {
                            errors.push(name + ': formula "' + fname + '" references unknown cell type "' + ct + '"');
                        }
                    });
                });
            }
        });

        return errors;
    }

    /**
     * Whether a cached config may be used in place of the shipped one.
     * A cached profile is superseded when the shipped file carries the same
     * profileId at a newer version, which is what allows a corrected default
     * profile to reach an installed browser (see SDD 3.11).
     */
    function isCacheSuperseded(cachedMeta, shippedMeta) {
        if (!cachedMeta || !shippedMeta) return false;
        if (cachedMeta.profileId !== shippedMeta.profileId) return false;
        return compareVersions(String(shippedMeta.version), String(cachedMeta.version)) > 0;
    }

    /**
     * Numeric dotted-version comparison. Returns >0 when a is newer than b.
     */
    function compareVersions(a, b) {
        var pa = String(a).split('.');
        var pb = String(b).split('.');
        var len = Math.max(pa.length, pb.length);
        for (var i = 0; i < len; i++) {
            var na = parseInt(pa[i], 10) || 0;
            var nb = parseInt(pb[i], 10) || 0;
            if (na !== nb) return na - nb;
        }
        return 0;
    }

    return {
        DEFAULT_TARGET: DEFAULT_TARGET,
        RESERVED_PLACEHOLDERS: RESERVED_PLACEHOLDERS,
        escapeHtml: escapeHtml,
        escapeAttr: escapeAttr,
        sanitizeTemplateHtml: sanitizeTemplateHtml,
        htmlToText: htmlToText,
        sanitizeCount: sanitizeCount,
        sanitizeCounts: sanitizeCounts,
        getTotal: getTotal,
        calcPercentages: calcPercentages,
        percentagesSummingTo100: percentagesSummingTo100,
        formatPercent: formatPercent,
        computeRatio: computeRatio,
        computeAbsolute: computeAbsolute,
        renderTemplate: renderTemplate,
        buildTemplateValues: buildTemplateValues,
        buildLowCountNote: buildLowCountNote,
        escapeCsv: escapeCsv,
        CSV_HEADERS: CSV_HEADERS,
        buildSessionCsv: buildSessionCsv,
        buildSessionJson: buildSessionJson,
        normalizeConfig: normalizeConfig,
        validateConfig: validateConfig,
        isCacheSuperseded: isCacheSuperseded,
        compareVersions: compareVersions
    };
}));
