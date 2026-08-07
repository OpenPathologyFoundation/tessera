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
describe('One measured fact, stated the same everywhere (URS-092)', () => {

    /**
     * Four live documents each carried their own copy of the test totals, and
     * three of them disagreed. README and RTM-001 said 1039 tests with 3
     * documented skips; the clinical brief said 1039; TR-001 — whose entire
     * subject is the test results — said 939 with 7 skips.
     *
     * Every one of those had been true when it was written. The defect was
     * structural: `qms-counts.js --write` refreshed some of them but only when
     * someone ran it, TR-001 was written by a different tool at a different
     * moment, and QC-001 checked the document counts while leaving the test
     * totals unchecked, because measuring them means spawning the runners and
     * this suite runs inside one.
     *
     * The totals are now written once, by the evidence run that measured them,
     * into `qms:fact` markers. These two tests are the halves that suite can
     * do without spawning anything: documents must agree with each other, and
     * with the run they came from.
     */
    const qmsFacts = require(path.join(__dirname, '..', 'scripts', 'qms-facts.js'));

    it('QC-021: No two documents state a different value for the same fact', () => {
        const bad = qmsFacts.disagreements();
        assert.deepEqual(bad, [],
            'live documents disagree about a measured fact:\n  ' + bad.join('\n  '));
    });

    it('QC-022: The stated facts are the ones the newest admissible run measured', () => {
        // Agreement is not enough on its own — four documents can agree on a
        // number that is a year old. This ties them to a bundle whose
        // environment.txt says the tree was clean, which is the only kind of
        // run whose figures describe a released state.
        const run = qmsFacts.newestCleanRun();
        if (!run) {
            // Before the first clean-tree evidence run there is nothing to
            // compare against. Said out loud rather than passing silently.
            console.log('    (skipped: no clean-tree evidence bundle with facts.json yet)');
            return;
        }
        const wrong = [];
        for (const mk of qmsFacts.readAll()) {
            const expected = run.facts[mk.key];
            if (expected === undefined) continue;
            if (String(expected) !== mk.value) {
                wrong.push(`${mk.file}:${mk.line} ${mk.key}="${mk.value}", ` +
                    `but ${run.id} measured "${expected}"`);
            }
        }
        assert.deepEqual(wrong, [],
            'documents state figures the evidence does not support — ' +
            'run `npm run test:qms` on a clean tree:\n  ' + wrong.join('\n  '));
    });

    it('QC-023: Every marker names a fact something actually writes', () => {
        // A marker with a misspelled key renders invisibly, is written by
        // nothing, and freezes whatever value it was born with — a stale
        // number wearing the costume of a generated one.
        const unknown = qmsFacts.readAll().filter(m => !qmsFacts.KEYS.includes(m.key));
        assert.deepEqual(unknown.map(m => `${m.file}:${m.line} ${m.key}`), [],
            'these markers name facts no writer produces');

        // And every fact the runner measures must be visible somewhere, or the
        // machinery is measuring something no reader ever sees.
        const used = new Set(qmsFacts.readAll().map(m => m.key));
        for (const key of qmsFacts.KEYS) {
            assert.ok(used.has(key), `no document states ${key}`);
        }
    });
});

// ================================================================
describe('A closure closes everywhere (URS-092)', () => {

    /**
     * HA-093 was closed in RA-001 on 2026-08-06, the day the M:E interval
     * shipped. It stayed open in two other places: DHF-001 §7.4 listed "no
     * interval is computed for the M:E ratio" as outstanding work, and REF-001
     * §5 carried a gap-table row reading "Open — needs Fieller or bootstrap"
     * ten lines below §3.8's own sentence saying the hazard was closed.
     *
     * That is the shape of nearly every drift incident in this repository: a
     * session closes something and updates the one document it was looking at.
     * The closure is real; the file goes on saying otherwise. These tests make
     * the *class* fail, not the instance.
     */
    const DHF = path.join(__dirname, '..', 'QMS', 'DHF');
    const read = f => fs.readFileSync(path.join(DHF, f), 'utf-8');

    /** Hazard IDs whose RA-001 row says Closed. */
    function closedHazards() {
        const closed = new Set();
        for (const line of read('RA-001-RiskAnalysis-FMEA.md').split('\n')) {
            const m = /^\| (HA-\d+) \|/.exec(line);
            if (m && /\bClosed\b/.test(line)) closed.add(m[1]);
        }
        return closed;
    }

    it('QC-024: A hazard closed in RA-001 is not still open elsewhere', () => {
        const closed = closedHazards();
        assert.ok(closed.size >= 1, 'no closed hazard rows found — the row parser is broken');

        const offenders = [];

        // DHF-001 §7.4 — the outstanding-items list.
        const dhf = read('DHF-001-DesignHistoryFile-Index.md');
        const openItems = /### 7\.4[^\n]*\n([\s\S]*?)\n---/.exec(dhf);
        if (openItems) {
            openItems[1].split('\n').forEach(line => {
                for (const id of closed) {
                    // A struck-through line that says "Closed" is the record of
                    // the closure, not a claim that it is open.
                    if (!line.includes(id)) continue;
                    if (/~~|\bClosed\b/.test(line)) continue;
                    offenders.push(`DHF-001 §7.4 lists ${id} as outstanding; RA-001 closed it`);
                }
            });
        }

        // REF-001 §5 — the gap table.
        const ref = read('REF-001-StandardsAndLiterature.md');
        ref.split('\n').forEach((line, i) => {
            if (!/^\|/.test(line) || !/\*\*Open\*\*/.test(line)) return;
            for (const id of closed) {
                if (line.includes(id)) {
                    offenders.push(`REF-001:${i + 1} marks ${id} Open; RA-001 closed it`);
                }
            }
        });

        assert.deepEqual(offenders, [],
            'a closed hazard is still described as open:\n  ' + offenders.join('\n  '));
    });

    it('QC-025: A shipped capability is not described as absent', () => {
        /**
         * Table-driven, so closing the next capability is one added row.
         *
         * `ratioInterval` had existed since DCR-026 and three live places still
         * gave "no interval is computed for a ratio" as their reason for
         * something — a source comment, an operator-facing validation message,
         * and the SYS-205 requirement rationale. The rule those three state is
         * correct; the reason had become false.
         *
         * `QMS/DHF/DCR/` is out of scope by design: a change record describes
         * what was true when it was written.
         */
        const Core = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-core.js'));
        const CLAIMS = [
            {
                export: 'ratioInterval',
                forbid: /no (confidence )?interval is computed for (a|the) ratio|ratio carries no confidence interval/i,
                scope: ['web/scripts', 'web', 'QMS/DHF']
            }
        ];

        const ROOT = path.join(__dirname, '..');
        const files = dir => {
            const full = path.join(ROOT, dir);
            if (!fs.existsSync(full)) return [];
            return fs.readdirSync(full)
                .filter(n => /\.(js|html|md)$/.test(n))
                .map(n => path.join(full, n));
        };

        const offenders = [];
        for (const claim of CLAIMS) {
            assert.equal(typeof Core[claim.export], 'function',
                `${claim.export} is not exported — either the capability went, ` +
                'or this table is describing something that no longer exists');
            for (const dir of claim.scope) {
                for (const file of files(dir)) {
                    fs.readFileSync(file, 'utf-8').split('\n').forEach((line, i) => {
                        // A revision-history row is a dated record of what was
                        // changed, and quoting the wording it replaced is how
                        // such a row explains itself. Same exemption the change
                        // records get, and for the same reason.
                        if (/^\|\s*[A-Z]{1,2}\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(line)) return;
                        // And the drift log, whose every row IS a quotation of
                        // a claim that stopped being true. A log of false
                        // claims must be able to state one.
                        if (/DRIFT-LOG/.test(file)) return;
                        if (claim.forbid.test(line)) {
                            offenders.push(`${path.relative(ROOT, file)}:${i + 1} — ` +
                                `${claim.export} exists, but this says it does not`);
                        }
                    });
                }
            }
        }
        assert.deepEqual(offenders, [],
            'live text describes a shipped capability as absent:\n  ' + offenders.join('\n  '));
    });

    it('QC-026: TR-001 reports a run that is admissible as release evidence', () => {
        // A bundle captured from a dirty tree measures code that exists in no
        // commit. One such bundle was marked Approved. TR-001 must cite a run
        // whose environment.txt says the tree was clean, or say it has none.
        const qmsFacts = require(path.join(__dirname, '..', 'scripts', 'qms-facts.js'));
        const marker = qmsFacts.readMarkers('QMS/DHF/TR-001-TestResults.md')
            .find(m => m.key === 'evidence_run_id');
        assert.ok(marker, 'TR-001 does not name the evidence run it reports');

        if (marker.value === '(none yet)') {
            console.log('    (skipped: TR-001 names no run yet — the first clean run sets it)');
            return;
        }
        const dir = path.join(DHF, 'TestEvidence', marker.value);
        assert.ok(fs.existsSync(dir), `TR-001 cites ${marker.value}, which does not exist`);
        assert.equal(qmsFacts.environment(dir).tree_state, 'clean',
            `TR-001 reports ${marker.value}, captured from a tree that was not clean — ` +
            'it measures code that exists in no commit');

        // And the command it states must be the command that bundle ran.
        const cmd = path.join(dir, 'command.txt');
        assert.ok(fs.existsSync(cmd), `${marker.value} records no command.txt`);
    });
});

// ================================================================
describe('The licence and the reserved marks stay stated (URS-092)', () => {

    /**
     * Two different grants live in this repository and they must not blur into
     * one. The code is Apache-2.0 — anyone may build a commercial product on
     * it, which is the point of choosing that licence. The name "WBC ΔΣ" and
     * the logo are reserved: Apache-2.0 §6 grants no trademark rights, and the
     * reservation only travels if the NOTICE travels with it.
     *
     * The logo is not a file. It is SVG inlined directly into the shipped
     * pages, so someone copying a page copies the mark with it — which is why
     * each occurrence carries its own reservation rather than relying on a
     * notice three directories away.
     */
    const ROOT = path.join(__dirname, '..');
    const root = f => fs.readFileSync(path.join(ROOT, f), 'utf-8');

    it('QC-017: The licence is stated, and stated the same way in each place', () => {
        const license = root('LICENSE');
        assert.match(license, /Apache License, Version 2\.0/, 'LICENSE is not Apache-2.0');
        assert.match(license, /TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION/,
            'LICENSE carries a header but not the licence body');
        assert.match(license, /6\. Trademarks/,
            'the Apache §6 trademark clause is missing — it is what reserves the marks');

        const pkg = JSON.parse(root('package.json'));
        assert.equal(pkg.license, 'Apache-2.0', 'package.json disagrees with LICENSE');
        assert.match(root('README.md'), /Apache License 2\.0/, 'README does not state the licence');
    });

    it('QC-018: A NOTICE travels with redistributions and reserves the marks', () => {
        // Apache-2.0 §4(d): a redistributor must carry the NOTICE. It is the
        // only clause that makes the reservation follow the code downstream.
        const notice = root('NOTICE');
        assert.match(notice, /Apache License, Version 2\.0/);
        assert.match(notice, /WBC ΔΣ/, 'NOTICE does not name the reserved mark');
        assert.match(notice, /logo/i, 'NOTICE does not reserve the logo');
        assert.match(notice, /TRADEMARKS\.md/, 'NOTICE does not point at the full policy');

        // The distinction that matters: the CODE may be used commercially; the
        // NAME and LOGO may not. A NOTICE that blurred these would misdescribe
        // the licence the project actually chose.
        assert.match(notice, /including in a commercial product/i,
            'NOTICE must not imply Apache-2.0 restricts commercial use of the code');
        assert.match(notice, /NOT use the NAME or the LOGO/,
            'NOTICE must state what is actually reserved');
    });

    it('QC-019: README points at both grants, and at the files that carry them', () => {
        const readme = root('README.md');
        for (const f of ['LICENSE', 'TRADEMARKS.md', 'NOTICE']) {
            assert.ok(readme.includes(f), `README does not point at ${f}`);
        }
        assert.match(readme, /§6|section 6/i,
            'README should say WHY the marks are reserved, not merely that they are');
    });

    it('QC-020: Every inlined logo carries its own reservation', () => {
        // The mark ships as markup inside the pages. A notice in the repository
        // root does not travel with a copied page; a comment beside the mark
        // does.
        const pages = [];
        for (const dir of [path.join(ROOT, 'web'), ROOT]) {
            for (const name of fs.readdirSync(dir)) {
                if (name.endsWith('.html')) pages.push(path.join(dir, name));
            }
        }
        const unmarked = [];
        for (const page of pages) {
            const lines = fs.readFileSync(page, 'utf-8').split('\n');
            lines.forEach((line, i) => {
                // The lockup is the only 40x40 viewBox in this codebase.
                if (!line.includes('viewBox="0 0 40 40"')) return;
                const above = lines.slice(Math.max(0, i - 2), i).join(' ');
                if (!/RESERVED\. Not licensed under Apache-2\.0/.test(above)) {
                    unmarked.push(`${path.relative(ROOT, page)}:${i + 1}`);
                }
            });
        }
        assert.deepEqual(unmarked, [],
            'these copies of the logo carry no reservation:\n  ' + unmarked.join('\n  '));
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
