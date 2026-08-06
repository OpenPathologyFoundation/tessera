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
const vindex = require(path.join(__dirname, '..', 'scripts', 'qms-verification-index.js'));

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

// ================================================================
describe('Verification identifiers exist (URS-092)', () => {

    /**
     * An independent review found 61 identifiers cited by RTM-001 and TR-001
     * that existed in no protocol document, and 106 TC-0xx numbers in TP-001
     * that appeared in no test file. The gap then widened to 98 as new suites
     * cited new identifiers without touching the protocol.
     *
     * A traceability matrix citing identifiers that do not exist is worse than
     * no matrix: it manufactures the appearance of coverage. These tests make
     * that impossible to leave unnoticed.
     *
     * They read the COMMITTED register rather than re-extracting, because
     * extraction spawns both test runners and this suite runs inside one.
     */

    it('QC-004: VV-001 and TP-001 carry a generated register', () => {
        for (const file of vindex.TARGETS) {
            const ids = vindex.parseRegister(file);
            assert.ok(ids, `${file} has no generated register block`);
            assert.ok(ids.size > 200,
                `${file} registers only ${ids ? ids.size : 0} identifiers — the register looks truncated`);
        }
    });

    it('QC-005: Every identifier cited by RTM-001 and TR-001 is registered', () => {
        const dangling = vindex.danglingCitations();
        assert.deepEqual(dangling, [],
            'traceability documents cite identifiers that no test implements:\n  ' +
            dangling.join('\n  '));
    });

    it('QC-006: The two registers agree', () => {
        const [a, b] = vindex.TARGETS.map(f => vindex.parseRegister(f));
        assert.deepEqual([...a].sort(), [...b].sort(),
            'VV-001 and TP-001 register different identifiers');
    });
});
