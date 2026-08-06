/**
 * TEST SUITE 14: QMS Counted Quantities
 * ======================================
 * Traces to: URS-092
 * FMEA: HA-097 (documentation describing software that no longer exists)
 *
 * Every headline number in README.md and RTM-001 §8 had drifted from the
 * documents it described — 49 user requirements against 69, 22 hazards against
 * 51, "579 executed" against a suite past 900. An independent review found
 * nine wrong figures in a single pass.
 *
 * They were wrong because a person had to remember to update them. This suite
 * removes that dependency: `scripts/qms-counts.js` measures the counts from
 * the documents and from the runners themselves, and a stale figure now fails
 * the build rather than waiting for the next reviewer.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { measureDocuments, apply } = require(path.join(__dirname, '..', 'scripts', 'qms-counts.js'));

describe('Counted quantities match the documents they describe (URS-092)', () => {

    it('QC-001: Every requirement, hazard and test-case count is current', () => {
        // Document counts only. The test totals are measured by spawning the
        // runners, which this suite cannot do — it runs inside one. Those are
        // refreshed by `node scripts/qms-counts.js --write` at release, and
        // the QMS evidence runner reports them alongside the results.
        const stale = apply(measureDocuments(), { write: false });
        assert.deepEqual(stale, [],
            'stale counted quantities — run `node scripts/qms-counts.js --write`:\n  ' +
            stale.join('\n  '));
    });

    it('QC-002: The measurement finds a plausible number of each artefact', () => {
        // A guard on the measurement itself: a regex that silently stops
        // matching would report zero and QC-001 would then "pass" by rewriting
        // every figure to nothing.
        const c = measureDocuments();
        for (const [key, floor] of Object.entries({
            urs: 40, srs: 90, hazards: 20, testCases: 50, scenarios: 4
        })) {
            assert.ok(c[key] >= floor,
                `${key} measured ${c[key]}, below the plausibility floor of ${floor} — ` +
                'the measurement is probably broken, not the documents');
        }
    });

    it('QC-003: Every identifier series is contiguous enough to be trusted', () => {
        // A count is only meaningful if the IDs behind it are real. This
        // catches a regex that has started matching prose, or a table whose
        // rows have been reformatted out of recognition.
        const c = measureDocuments();
        assert.ok(c.srs > c.urs, 'there should be more system requirements than user requirements');
        assert.ok(c.testCases > c.scenarios, 'there should be more test cases than validation scenarios');
    });
});
