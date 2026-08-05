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
     * This is the total number of cells tallied, including any category that
     * the profile excludes from the percentage denominator.
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
     * The denominator the differential percentages are computed over.
     *
     * Some categories are counted but do not belong in the denominator. The
     * governing case is nucleated red cells in a peripheral blood differential:
     * NRBC are enumerated alongside the leucocytes but are conventionally
     * reported as a count per 100 WBC, and the WBC count is corrected for them,
     * because they are not leucocytes. Including them in the denominator
     * depresses every reported leucocyte percentage — with 20 NRBC among 200
     * cells, a true 66.7% neutrophil count reports as 60.0%.
     *
     * Bone marrow is the opposite case: erythroblasts are a legitimate part of
     * the nucleated differential count (ICSH 2008 §2.6) and belong in the
     * denominator. The behaviour is therefore per-profile, never global.
     *
     * @param {Object}   counts
     * @param {string[]} [exclude] cell types counted but not part of the denominator
     */
    function getDenominator(counts, exclude) {
        if (!exclude || exclude.length === 0) return getTotal(counts);
        var skip = {};
        exclude.forEach(function (ct) { skip[ct] = true; });
        var sum = 0;
        Object.keys(counts || {}).forEach(function (ct) {
            if (skip[ct]) return;
            var v = counts[ct];
            if (typeof v === 'number' && isFinite(v) && v > 0) sum += v;
        });
        return sum;
    }

    /**
     * A category expressed per 100 units of the differential denominator —
     * the conventional reporting form for NRBC in peripheral blood.
     *
     * @returns {number|null} null when the denominator is zero, so that the
     *   caller renders "N/A" rather than dividing by nothing.
     */
    function computePer100(counts, cellType, exclude, precision) {
        var denom = getDenominator(counts, exclude);
        if (denom === 0) return null;
        var n = (counts && counts[cellType]) || 0;
        var p = typeof precision === 'number' ? precision : 1;
        var factor = Math.pow(10, p);
        return Math.round((n / denom) * 100 * factor) / factor;
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
     * Categories named in `options.exclude` are not part of the differential:
     * they receive `null` rather than a percentage, and they are absent from
     * the denominator. The remaining categories still sum to exactly 100.
     * Report them with computePer100 instead.
     *
     * @param {Object}   counts   { cellType: integer }
     * @param {number}   decimals decimal places (0 for output templates, 2 for display)
     * @param {Object}   [options]
     * @param {string[]} [options.exclude] categories outside the differential
     * @returns {Object} { cellType: number|null } included values sum to exactly 100
     */
    function percentagesSummingTo100(counts, decimals, options) {
        var allTypes = Object.keys(counts || {});
        var exclude = (options && options.exclude) || [];
        var skip = {};
        exclude.forEach(function (ct) { skip[ct] = true; });

        var cellTypes = allTypes.filter(function (ct) { return !skip[ct]; });
        var total = getDenominator(counts, exclude);
        var out = {};
        allTypes.forEach(function (ct) { if (skip[ct]) out[ct] = null; });

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

    // ================================================================
    // SAMPLING PRECISION (URS-037, SYS-190 to SYS-195)
    // ================================================================

    // Two-sided normal quantiles for the supported confidence levels.
    var Z_SCORES = { 0.90: 1.644854, 0.95: 1.959964, 0.99: 2.575829 };

    /**
     * Binomial confidence interval for an observed differential proportion,
     * by the Wilson score method.
     *
     * A differential count is a sample: 200 cells drawn from a smear containing
     * far more. The observed percentage therefore carries sampling error that
     * is large at the counts used in practice and largest for the rare
     * populations that matter most diagnostically. Rümke's warning (REF-001
     * [S4]) is the classic statement of this for differential counting.
     *
     * METHOD CHOICE. The obvious implementation is the Wald interval,
     * p ± z·sqrt(p(1−p)/n). It is rejected here: its coverage is poor precisely
     * where this application needs it — small n, and proportions near zero —
     * and it produces impossible negative lower bounds for rare categories. A
     * count of 2 blasts in 200 cells yields a Wald lower bound below zero,
     * which would be worse than showing nothing at all. Brown, Cai & DasGupta
     * (Statist. Sci. 2001;16(2):101–133) document this and recommend Wilson,
     * which is bounded within [0,1] by construction and behaves sensibly at
     * zero counts. See REF-001 [S7].
     *
     * A zero count is informative rather than degenerate: 0 blasts in 200 cells
     * gives an upper bound near 1.9%, which is a real statement about what the
     * count has excluded.
     *
     * @param {number} count       cells observed in this category
     * @param {number} n           the differential denominator
     * @param {number} [level]     confidence level (0.90, 0.95, 0.99); default 0.95
     * @returns {{lower:number, upper:number, point:number, n:number, level:number}|null}
     *          bounds as percentages, or null when n is 0
     */
    function wilsonInterval(count, n, level) {
        if (typeof n !== 'number' || !isFinite(n) || n <= 0) return null;
        if (typeof count !== 'number' || !isFinite(count) || count < 0) return null;
        if (count > n) return null;

        var lvl = typeof level === 'number' ? level : 0.95;
        var z = Z_SCORES[lvl] || Z_SCORES[0.95];

        var p = count / n;
        var z2 = z * z;
        var denom = 1 + z2 / n;
        var centre = (p + z2 / (2 * n)) / denom;
        var margin = (z / denom) * Math.sqrt((p * (1 - p) / n) + (z2 / (4 * n * n)));

        var lower = centre - margin;
        var upper = centre + margin;
        // Clamp: the arithmetic can leave a bound a hair outside [0,1].
        if (lower < 0) lower = 0;
        if (upper > 1) upper = 1;
        // Snap float noise at the boundaries, so a saturated count reads
        // "100.0%" rather than "99.99999999999999%".
        if (Math.abs(lower) < 1e-9) lower = 0;
        if (Math.abs(upper - 1) < 1e-9) upper = 1;

        return {
            point: p * 100,
            lower: lower * 100,
            upper: upper * 100,
            n: n,
            level: lvl
        };
    }

    /**
     * Render an interval for display, e.g. "2.7-9.0%".
     */
    function formatInterval(ci, decimals) {
        if (!ci) return 'N/A';
        var d = typeof decimals === 'number' ? decimals : 1;
        return ci.lower.toFixed(d) + '–' + ci.upper.toFixed(d) + '%';
    }

    /**
     * Whether an interval spans a value — the test for "this count does not
     * resolve the question".
     *
     * ICSH 2008 §2.6 directs that the count be extended when an abnormal
     * percentage sits "very close to a critical threshold for disease
     * stratification". An interval straddling that threshold is the precise
     * form of that condition: the observed percentage is on one side, but the
     * count does not establish which side the true value lies on.
     */
    function intervalSpans(ci, threshold) {
        if (!ci || typeof threshold !== 'number') return false;
        return ci.lower <= threshold && ci.upper >= threshold;
    }

    /**
     * Cells needed for a given absolute half-width at an observed proportion —
     * answers "how many more cells would settle this?".
     *
     * Uses the Wald sample-size form, which is the standard planning
     * approximation. It is used only to suggest additional counting effort, and
     * never to state a result.
     *
     * @param {number} p          observed proportion (0-1)
     * @param {number} halfWidth  desired half-width in percentage points
     * @param {number} [level]
     * @returns {number|null} cells required, rounded up
     */
    function cellsForPrecision(p, halfWidth, level) {
        if (typeof p !== 'number' || p < 0 || p > 1) return null;
        if (typeof halfWidth !== 'number' || halfWidth <= 0) return null;
        var z = Z_SCORES[typeof level === 'number' ? level : 0.95] || Z_SCORES[0.95];
        var d = halfWidth / 100;
        // A zero observed proportion gives no width to work from; fall back to
        // the most conservative case, p = 0.5.
        var pp = (p === 0 || p === 1) ? 0.5 : p;
        return Math.ceil((z * z * pp * (1 - pp)) / (d * d));
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
     * One group of categories expressed as a percentage of another.
     *
     * The governing case is "blasts as a percentage of non-erythroid cells" —
     * the pre-2022 WHO erythroleukaemia rule. WHO 2022 withdrew it in favour of
     * counting blasts against all nucleated cells, but laboratories still
     * report it when comparing against historical results, and the two figures
     * can differ enough to move a case across a diagnostic boundary in a marrow
     * with expanded erythropoiesis.
     *
     * Unlike a ratio, this has a real denominator count, so it carries a
     * binomial confidence interval in the way a ratio cannot (REF-001 §3.8).
     *
     * @returns {{value:number, numeratorCount:number, denominatorCount:number,
     *            display:string}|null} null when the denominator is zero
     */
    function computeSubsetPercentage(counts, formula) {
        if (!formula || !Array.isArray(formula.numerator) || !Array.isArray(formula.denominator)) {
            return null;
        }
        var num = 0;
        formula.numerator.forEach(function (ct) { num += ((counts && counts[ct]) || 0); });
        var den = 0;
        formula.denominator.forEach(function (ct) { den += ((counts && counts[ct]) || 0); });
        if (den === 0) return null;

        var precision = typeof formula.precision === 'number' ? formula.precision : 1;
        var value = (num / den) * 100;
        return {
            value: value,
            numeratorCount: num,
            denominatorCount: den,
            display: value.toFixed(precision) + '%'
        };
    }

    /**
     * Evaluate a configured formula, dispatching on its type.
     * Absent `type` means "ratio", so profiles written before subset
     * percentages existed behave exactly as before.
     */
    function computeFormula(counts, formula) {
        if (!formula) return null;
        var type = formula.type || 'ratio';

        if (type === 'percentage') {
            var r = computeSubsetPercentage(counts, formula);
            if (!r) {
                return {
                    type: 'percentage', display: 'N/A', value: null,
                    numeratorCount: 0, denominatorCount: 0
                };
            }
            r.type = 'percentage';
            return r;
        }

        var display = computeRatio(counts, formula);
        if (display === null) return null;
        return { type: 'ratio', display: display, value: null };
    }

    /**
     * Test each configured diagnostic threshold against the count.
     *
     * ICSH 2008 §2.6 directs that the count be extended "if the abnormal cell
     * count is very close to a critical threshold for disease stratification or
     * to a low threshold (e.g. 5%)". A confidence interval straddling the
     * threshold is the operational form of that condition: the observed value
     * sits on one side, but the count does not establish which side the true
     * value lies on.
     *
     * A threshold may target a cell type — measured against the differential
     * denominator — or a percentage formula, measured against that formula's
     * own denominator. Ratios are not eligible: no interval is computed for
     * them (REF-001 §3.8, HA-093).
     *
     * @returns {Array} one entry per evaluable threshold, each carrying its
     *          interval and whether it straddles the threshold
     */
    function evaluateThresholds(counts, spec, level) {
        var list = (spec && spec.thresholds) || [];
        if (!Array.isArray(list) || list.length === 0) return [];

        var exclude = (spec && spec.denominatorExcludes) || [];
        var diffTotal = getDenominator(counts, exclude);
        var formulas = (spec && spec.formulas) || {};
        var out = [];

        list.forEach(function (t) {
            if (!t || !t.target || typeof t.value !== 'number') return;

            var num, den, targetLabel;
            if (hasOwn(formulas, t.target)) {
                var f = formulas[t.target];
                if ((f.type || 'ratio') !== 'percentage') return;
                var r = computeSubsetPercentage(counts, f);
                if (!r) return;
                num = r.numeratorCount;
                den = r.denominatorCount;
                targetLabel = f.label || t.target;
            } else {
                // A category outside the differential has no percentage of it.
                if (exclude.indexOf(t.target) !== -1) return;
                num = (counts && counts[t.target]) || 0;
                den = diffTotal;
                targetLabel = t.target;
            }
            if (den === 0) return;

            var ci = wilsonInterval(num, den, level);
            if (!ci) return;

            out.push({
                target: t.target,
                targetLabel: targetLabel,
                label: t.label || '',
                basis: t.basis || '',
                value: t.value,
                observed: ci.point,
                interval: ci,
                spans: intervalSpans(ci, t.value)
            });
        });
        return out;
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
        // {{total}} is the differential denominator, because "a 200-cell
        // differential count" means 200 cells were classified into the
        // percentages being reported. Where a profile excludes a category from
        // the denominator, {{totalCounted}} gives the number of cells tallied
        // overall. With no exclusions the two are equal.
        var differentialTotal = typeof session.differentialTotal === 'number'
            ? session.differentialTotal : session.totalCount;
        var values = {
            caseNumber: session.caseNumber || '',
            total: differentialTotal,
            totalCounted: session.totalCount,
            denominator: differentialTotal,
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
            // A category outside the differential has no percentage; leaving
            // the token unresolved would print "{{nrbc}}" in a clinical report,
            // so it renders as N/A and the per-100 form carries the value.
            values[ct] = roundedPercentages[ct] === null ? 'N/A' : roundedPercentages[ct];
        });
        // {{<cellType>_per100}} — the conventional form for a category counted
        // alongside the differential but reported against it (e.g. NRBC/100 WBC).
        Object.keys(session.per100 || {}).forEach(function (ct) {
            var v = session.per100[ct];
            values[ct + '_per100'] = (v === null || v === undefined) ? 'N/A' : v;
        });
        return values;
    }

    /**
     * Advisory note shown when a count finishes below the configured target
     * (URS-041 / SYS-053). Returns null when the target has been met.
     * Non-blocking by design: the target is advisory, never enforced.
     */
    function buildLowCountNote(total, targetCount, level) {
        if (typeof targetCount !== 'number' || targetCount <= 0) return null;
        if (total >= targetCount) return null;

        var note = total + '-cell count (target ' + targetCount + ').';

        // State the imprecision rather than alluding to it. A worked interval
        // at a clinically meaningful proportion says more than "confidence is
        // reduced": it lets the reader see how wide the uncertainty actually
        // is at the count achieved.
        var ci = wilsonInterval(0.05 * total, total, level);
        if (ci) {
            var pct = Math.round((ci.level || 0.95) * 100);
            note += ' At this count an observed 5% carries a ' + pct +
                '% confidence interval of ' + formatInterval(ci, 1) + '.';
        }
        return note;
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
        'differentialTotal',
        'denominatorExcludes',
        'meRatio',
        'morphologyComments',
        'counts',
        'percentages',
        'per100',
        'confidenceLevel',
        'confidenceIntervals',
        'outputs'
    ];

    /**
     * Reduce intervals to [lower, upper] pairs for archiving — the point
     * estimate and denominator are already carried in their own columns.
     */
    function compactIntervals(intervals) {
        if (!intervals) return {};
        var out = {};
        Object.keys(intervals).forEach(function (ct) {
            var ci = intervals[ct];
            if (ci) out[ct] = [Number(ci.lower.toFixed(2)), Number(ci.upper.toFixed(2))];
        });
        return out;
    }

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
                // The denominator the percentages were computed over, and what
                // was excluded from it — without these the archived record
                // cannot be reconstructed (URS-052).
                typeof session.differentialTotal === 'number'
                    ? session.differentialTotal : session.totalCount,
                JSON.stringify(session.denominatorExcludes || []),
                session.meRatio,
                session.morphologyComments || '',
                JSON.stringify(session.counts || {}),
                JSON.stringify(session.percentages || {}),
                JSON.stringify(session.per100 || {}),
                session.confidenceLevel || '',
                JSON.stringify(compactIntervals(session.confidenceIntervals)),
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

            // Denominator policy (URS-030). A category may be counted without
            // belonging to the differential, but it must be a real displayed
            // category, and excluding every category would leave nothing to
            // compute percentages over.
            if (spec.denominatorExcludes !== undefined) {
                if (!Array.isArray(spec.denominatorExcludes)) {
                    errors.push(name + ': denominatorExcludes must be an array');
                } else {
                    spec.denominatorExcludes.forEach(function (ct) {
                        if (!displayedSet[ct]) {
                            errors.push(name + ': denominatorExcludes names "' + ct +
                                '", which is not a displayed category');
                        }
                    });
                    var remaining = displayed.filter(function (ct) {
                        return spec.denominatorExcludes.indexOf(ct) === -1;
                    });
                    if (displayed.length > 0 && remaining.length === 0) {
                        errors.push(name + ': denominatorExcludes removes every category, ' +
                            'leaving no denominator for the differential');
                    }
                }
            }

            if (spec.confidenceIntervals !== undefined) {
                var ciCfg = spec.confidenceIntervals;
                if (typeof ciCfg !== 'object' || ciCfg === null) {
                    errors.push(name + ': confidenceIntervals must be an object');
                } else if (ciCfg.level !== undefined && !hasOwn(Z_SCORES, ciCfg.level)) {
                    errors.push(name + ': confidenceIntervals.level must be one of ' +
                        Object.keys(Z_SCORES).join(', '));
                }
            }

            if (spec.per100Reporting !== undefined) {
                if (typeof spec.per100Reporting !== 'object' || spec.per100Reporting === null) {
                    errors.push(name + ': per100Reporting must be an object');
                } else {
                    Object.keys(spec.per100Reporting).forEach(function (ct) {
                        if (!displayedSet[ct]) {
                            errors.push(name + ': per100Reporting names "' + ct +
                                '", which is not a displayed category');
                        } else if (!spec.denominatorExcludes ||
                            spec.denominatorExcludes.indexOf(ct) === -1) {
                            // Reporting a category both as a percentage of the
                            // differential and per 100 of it would state the
                            // same quantity two different ways.
                            errors.push(name + ': per100Reporting names "' + ct +
                                '", which is still inside the differential denominator; ' +
                                'add it to denominatorExcludes as well');
                        }
                    });
                }
            }

            var formulaNames = {};
            if (spec.formulas) {
                Object.keys(spec.formulas).forEach(function (fname) {
                    formulaNames[fname] = spec.formulas[fname];
                    var f = spec.formulas[fname];
                    if (!f || !Array.isArray(f.numerator) || !Array.isArray(f.denominator)) {
                        errors.push(name + ': formula "' + fname + '" needs numerator and denominator arrays');
                        return;
                    }
                    var ftype = f.type || 'ratio';
                    if (ftype !== 'ratio' && ftype !== 'percentage') {
                        errors.push(name + ': formula "' + fname + '" has unknown type "' + ftype +
                            '" (expected "ratio" or "percentage")');
                    }
                    f.numerator.concat(f.denominator).forEach(function (ct) {
                        if (!mappedSet[ct]) {
                            errors.push(name + ': formula "' + fname + '" references unknown cell type "' + ct + '"');
                        }
                    });
                    if (ftype === 'percentage') {
                        if (f.denominator.length === 0) {
                            errors.push(name + ': percentage formula "' + fname + '" has an empty denominator');
                        }
                        // A percentage of a subset requires the numerator to be
                        // part of that subset; otherwise it can exceed 100%.
                        f.numerator.forEach(function (ct) {
                            if (f.denominator.indexOf(ct) === -1) {
                                errors.push(name + ': percentage formula "' + fname + '" has "' + ct +
                                    '" in the numerator but not the denominator, so it could exceed 100%');
                            }
                        });
                    }
                });
            }

            // Diagnostic thresholds (URS-038).
            if (spec.thresholds !== undefined) {
                if (!Array.isArray(spec.thresholds)) {
                    errors.push(name + ': thresholds must be an array');
                } else {
                    spec.thresholds.forEach(function (t, tIdx) {
                        var where = name + ': threshold ' + tIdx;
                        if (!t || typeof t !== 'object') {
                            errors.push(where + ' is not an object');
                            return;
                        }
                        if (typeof t.value !== 'number' || t.value < 0 || t.value > 100) {
                            errors.push(where + ': value must be a percentage between 0 and 100');
                        }
                        if (!t.target) {
                            errors.push(where + ': missing target');
                            return;
                        }
                        if (hasOwn(formulaNames, t.target)) {
                            var tf = formulaNames[t.target];
                            if ((tf.type || 'ratio') !== 'percentage') {
                                errors.push(where + ': target "' + t.target + '" is a ratio formula. ' +
                                    'A ratio carries no confidence interval, so it cannot be tested ' +
                                    'against a threshold');
                            }
                        } else if (!displayedSet[t.target]) {
                            errors.push(where + ': target "' + t.target +
                                '" is neither a displayed category nor a percentage formula');
                        } else if (spec.denominatorExcludes &&
                                   spec.denominatorExcludes.indexOf(t.target) !== -1) {
                            errors.push(where + ': target "' + t.target + '" is outside the differential ' +
                                'denominator and has no percentage to test');
                        }
                    });
                }
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
        getDenominator: getDenominator,
        computePer100: computePer100,
        calcPercentages: calcPercentages,
        percentagesSummingTo100: percentagesSummingTo100,
        formatPercent: formatPercent,
        wilsonInterval: wilsonInterval,
        formatInterval: formatInterval,
        intervalSpans: intervalSpans,
        cellsForPrecision: cellsForPrecision,
        computeRatio: computeRatio,
        computeSubsetPercentage: computeSubsetPercentage,
        computeFormula: computeFormula,
        evaluateThresholds: evaluateThresholds,
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
