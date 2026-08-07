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
const fs = require('node:fs');
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

    it('QC-011: Every test carries a verification identifier', () => {
        // 328 tests — the entire static structural layer — ran and passed but
        // could not be cited by a traceability document, because a citation
        // needs an identifier to point at. They are named now, and this keeps
        // it that way: a new test without one is a coverage gap that RTM-001
        // cannot express.
        //
        // Reads the committed register rather than re-extracting; extraction
        // spawns both runners and this suite runs inside one.
        const registered = vindex.parseRegister(vindex.TARGETS[0]);
        assert.ok(registered && registered.size > 600,
            `the register holds only ${registered ? registered.size : 0} cases — it looks truncated`);

        const src = fs.readFileSync(vindex.TARGETS[0], 'utf-8');
        const claim = /\*\*(\d+) verification cases\*\*.*?run as (\d+) tests\.\s*(.*?)$/m.exec(src);
        assert.ok(claim, 'the register does not state its own totals');
        assert.equal(Number(claim[1]), registered.size,
            'the register headline disagrees with the rows beneath it');
        assert.match(claim[3], /Every test carries an identifier/,
            'the register reports tests with no identifier — name them, or the ' +
            'traceability matrix cannot cite them');
    });

    it('QC-006: The two registers agree', () => {
        const [a, b] = vindex.TARGETS.map(f => vindex.parseRegister(f));
        assert.deepEqual([...a].sort(), [...b].sort(),
            'VV-001 and TP-001 register different identifiers');
    });
});

// ================================================================
describe('The sign-off register describes the file as it stands (URS-092)', () => {

    /**
     * The clinical review brief named eleven documents needing a signature.
     * There were thirty-one, and one of the items it listed as outstanding had
     * since been closed — the M:E interval, which now exists.
     *
     * A reviewer is the last person able to notice that the list they were
     * handed is out of date. `scripts/qms-signoffs.js` generates it from the
     * signature tables themselves; these tests keep the generated block, the
     * hand-written sections around it, and the brief that points at it from
     * drifting apart again.
     */
    const signoffs = require(path.join(__dirname, '..', 'scripts', 'qms-signoffs.js'));
    const DHF = path.join(__dirname, '..', 'QMS', 'DHF');
    const register = () => fs.readFileSync(path.join(DHF, 'SIGNOFF-REGISTER.md'), 'utf-8');

    it('QC-012: The register matches the signature tables it was generated from', () => {
        const stale = signoffs.apply({ write: false });
        assert.deepEqual(stale, [],
            'the sign-off register is out of date — run `node scripts/qms-signoffs.js --write`:\n  ' +
            stale.join('\n  '));
    });

    it('QC-013: The measurement reads real signature tables', () => {
        // A guard on the measurement: a regex that stopped matching would
        // report nothing outstanding, and QC-012 would then pass by writing an
        // empty register — the most reassuring possible failure.
        const { outstanding, signedDocs } = signoffs.collect();
        assert.ok(signedDocs.length >= 5,
            `only ${signedDocs.length} documents read as fully signed — the parser is probably broken`);
        assert.ok(outstanding.has('Clinical Reviewer'),
            'no clinical signatures read as outstanding, which is not the state of this file');
        for (const [role, items] of outstanding) {
            assert.ok(!/Laboratory Director|Quality Manager/i.test(role),
                `${role} is the adopting laboratory's signature, not this project's`);
            for (const it of items) {
                assert.ok(fs.existsSync(path.join(DHF, it.doc)), `${it.doc} does not exist`);
            }
        }
    });

    it('QC-014: The three documents singled out for a question are still unsigned', () => {
        // §2 states three specific asks in full rather than making the reviewer
        // find them. If one gets signed, that section is answering a question
        // nobody still has; if one is renamed, it points at nothing.
        const src = register();
        const asks = [...src.matchAll(/^### (DCR-\d+) §\d+/gm)].map(m => m[1]);
        assert.ok(asks.length >= 3, 'the register no longer states its specific asks');

        const open = new Set();
        for (const items of signoffs.collect().outstanding.values()) {
            items.forEach(i => open.add(i.doc));
        }
        for (const id of asks) {
            const cited = [...open].filter(d => d.includes(id));
            assert.ok(cited.length,
                `${id} carries a specific question in §2 but is not outstanding — ` +
                'either it has been signed and the section should say so, or it has been renamed');
        }
    });

    it('QC-016: One product version, stated the same everywhere', () => {
        // Four places carried three different answers: package.json and DHF-001
        // said 2.7.1, the DHF revision history had reached v2.14.0 through
        // eleven change records, and the service worker cache key was still on
        // v2.3.0 — eleven releases of assets that could survive on a laboratory
        // workstation, since the key is what invalidates them.
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
        const v = pkg.version;
        assert.match(v, /^\d+\.\d+\.\d+$/, 'package.json carries no usable version');

        const dhf = fs.readFileSync(path.join(DHF, 'DHF-001-DesignHistoryFile-Index.md'), 'utf-8');
        const header = /\|\s*\*\*Product Version\*\*\s*\|\s*([\d.]+)/.exec(dhf);
        assert.ok(header, 'DHF-001 states no product version');
        assert.equal(header[1], v, 'DHF-001 disagrees with package.json');

        const sw = fs.readFileSync(path.join(__dirname, '..', 'web', 'sw.js'), 'utf-8');
        const cache = /CACHE_VERSION\s*=\s*'wbcds-v([\d.]+)'/.exec(sw);
        assert.ok(cache, 'the service worker states no cache version');
        assert.equal(cache[1], v,
            'the service worker cache key is stale — cached assets from an older ' +
            'release will survive on machines that already have it');

        // The revision history must not have run ahead of the version again.
        const latest = [...dhf.matchAll(/\|\s*v(\d+\.\d+\.\d+)\s*\(DCR-\d+\)/g)]
            .map(m => m[1].split('.').map(Number));
        if (latest.length) {
            const top = latest.sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0];
            const cur = v.split('.').map(Number);
            const ahead = top[0] > cur[0] || (top[0] === cur[0] &&
                (top[1] > cur[1] || (top[1] === cur[1] && top[2] > cur[2])));
            assert.ok(!ahead,
                `the revision history records v${top.join('.')} but the product is v${v}`);
        }
    });

    it('QC-015: The clinical brief points at the register rather than restating it', () => {
        // The brief is the invitation; the register is the checklist. The brief
        // held its own copy of the list once, and that copy is what went stale.
        const brief = fs.readFileSync(path.join(DHF, 'CLINICAL-REVIEW-BRIEF.md'), 'utf-8');
        assert.match(brief, /SIGNOFF-REGISTER\.md/,
            'the clinical review brief does not point at the sign-off register');
        assert.ok(!/No confidence interval is computed for the M:E ratio/.test(brief),
            'the brief still lists the M:E interval as outstanding — it was closed by DCR-026');
    });
});

// ================================================================
describe('Shipped assets are all reachable (URS-094)', () => {

    /**
     * `web/` carried 1.3 MB of files no page referenced — decorative textures,
     * three institutional favicons, a script font, and a stylesheet
     * (`counter.css`) that nothing loaded but which was the only thing keeping
     * three of the images alive. All of it was precached for offline use and
     * shipped to every workstation.
     *
     * Dead weight is not merely untidy here: URS-094 exists because these are
     * laboratory machines with restricted networks, and the service worker
     * fetches the shell on first load.
     */
    const fs2 = require('node:fs');
    const WEB = path.join(__dirname, '..', 'web');

    /** Every file under web/, excluding the vendored bundle. */
    function walk(dir, out = []) {
        for (const name of fs2.readdirSync(dir)) {
            const full = path.join(dir, name);
            if (fs2.statSync(full).isDirectory()) {
                if (name !== 'vendor') walk(full, out);
            } else {
                out.push(full);
            }
        }
        return out;
    }

    it('QC-010: No asset under web/ is referenced by nothing', () => {
        const files = walk(WEB);
        const ASSET = /\.(png|jpe?g|gif|svg|ico|ttf|woff2?|css)$/i;
        // Text the references could live in: pages, scripts, styles, profiles,
        // the service worker, and the QMS documents.
        const haystack = files
            .filter(f => /\.(html|js|css|json|md)$/i.test(f))
            .map(f => fs2.readFileSync(f, 'utf-8'))
            .join('\n');

        const orphans = [];
        for (const file of files.filter(f => ASSET.test(f))) {
            const base = path.basename(file);
            // Count references from OTHER files only.
            const self = fs2.readFileSync(file, 'utf-8').length;
            const occurrences = haystack.split(base).length - 1;
            const inSelf = /\.(css)$/i.test(file) ? 0 : 0;
            if (occurrences - inSelf === 0) {
                orphans.push(path.relative(path.join(__dirname, '..'), file) +
                    ` (${Math.round(self / 1024)} KB)`);
            }
        }
        assert.deepEqual(orphans, [],
            'these are shipped and precached but referenced by nothing:\n  ' +
            orphans.join('\n  '));
    });
});
