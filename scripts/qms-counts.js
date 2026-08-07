#!/usr/bin/env node
/**
 * QMS counted quantities — measured, not maintained by hand.
 *
 * Every headline number in README.md and RTM-001 §8 had drifted from the
 * documents it described: 49 user requirements against 68, 22 hazards against
 * 56, "579 executed" against a suite that had grown past 900. An independent
 * review found nine wrong figures in one pass, and they were wrong because a
 * human had to remember to update them whenever anything was added.
 *
 *     node scripts/qms-counts.js            report the measured counts
 *     node scripts/qms-counts.js --write    rewrite the count tables
 *     node scripts/qms-counts.js --check    exit 1 if a document disagrees
 *
 * --check is what makes this durable: suite 14 runs it, so a stale figure
 * fails the build rather than waiting for the next review.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf-8');
const uniq = (text, re) => new Set((text.match(re) || []));

// ---------------------------------------------------------------- measure

function measureDocuments() {
    const urs = read('QMS', 'DHF', 'URS-001_UserRequirementsSpecification_v2.0.md');
    const srs = read('QMS', 'DHF', 'SRS-001-SystemRequirementsSpecification.md');
    const ra = read('QMS', 'DHF', 'RA-001-RiskAnalysis-FMEA.md');
    // TP-001's TC-0xx numbering was withdrawn (DCR-018): none of those
    // identifiers appeared in any test file. The countable quantity is now the
    // register of implemented verification cases, which both TP-001 and VV-001
    // carry and which is generated from the runners.
    const { parseRegister, TARGETS } =
        require(path.join(__dirname, 'qms-verification-index.js'));
    const vv = read('QMS', 'DHF', 'VV-001-VerificationValidationProtocol.md');

    // Requirement and hazard IDs are counted from their table rows, so prose
    // that merely mentions an ID does not inflate the total.
    const ursIds = uniq(urs, /^\| URS-\d+ \|/gm);
    const srsIds = uniq(srs, /^\| SYS-[\w-]+ \|/gm);
    const hazards = uniq(ra, /^\| HA-\d+ \|/gm);
    const registered = parseRegister(TARGETS[0]);
    const scenarios = uniq(vv, /\bV[1-9]\d?\b(?=[ :.—-])/g);

    return {
        urs: ursIds.size,
        srs: srsIds.size,
        hazards: hazards.size,
        testCases: registered ? registered.size : 0,
        scenarios: scenarios.size
    };
}

/**
 * Test totals, by asking the runners.
 *
 * Kept separate from the document counts because it spawns them: suite 14
 * verifies the document counts, and if that measurement lived here the suite
 * would launch the whole Node runner from inside the Node runner.
 */
function measureTests() {
    // Test counts are taken from the runners, not from grepping for `it(`.
    //
    // Counting call sites undercounts badly: whole families of tests are
    // generated in loops — one per shipped preset, one per theme, one per
    // contrast surface. A grep reported 545 Node tests against an actual 601
    // and 99 browser specs against 125. Measuring the thing by eye is the
    // failure this script exists to end, so it does not do it here either.
    const { spawnSync } = require('node:child_process');

    // The files are listed explicitly rather than passing the directory:
    // `node --test tests/` reports the directory as a single test, which is
    // how this first measured 1 where the true figure was 601.
    const suiteFiles = fs.readdirSync(path.join(ROOT, 'tests'))
        .filter(n => n.endsWith('.test.js'))
        .map(n => path.join('tests', n));
    const node = spawnSync('node', ['--test', ...suiteFiles], { cwd: ROOT, encoding: 'utf-8' });
    const nodeMatch = (node.stdout || '').match(/^\u2139 tests (\d+)$/m);
    if (!nodeMatch) throw new Error('could not read the Node test total from the runner');
    const nodeTests = Number(nodeMatch[1]);

    const pw = spawnSync('npx', ['playwright', 'test', '--list'], { cwd: ROOT, encoding: 'utf-8' });
    const pwMatch = (pw.stdout || '').match(/Total:\s*(\d+)\s*tests/);
    if (!pwMatch) throw new Error('could not read the Playwright total from --list');
    const e2eTotal = Number(pwMatch[1]);

    const engines = (read('playwright.config.js').match(/name:\s*'(chromium|firefox|webkit)'/g) || []).length;
    const e2eSpecs = engines ? e2eTotal / engines : e2eTotal;

    // Suite 11 is quoted on its own line in the README.
    const suite11Run = spawnSync('node', ['--test', 'tests/11-application-behavior.test.js'],
        { cwd: ROOT, encoding: 'utf-8' });
    const s11 = (suite11Run.stdout || '').match(/^\u2139 tests (\d+)$/m);
    const suite11 = s11 ? Number(s11[1]) : null;

    return { nodeTests, suite11, e2eSpecs, engines, e2eTotal };
}

/** Everything, for the command line. */
function measure() {
    return Object.assign(measureDocuments(), measureTests());
}

// ---------------------------------------------------------------- rewrite

/** Each edit is a regex whose first capture group is the number to replace. */
function edits(c) {
    return [
        ['README.md', /(\*\*URS-001\*\* \| )\d+( user requirements)/, `$1${c.urs}$2`],
        ['README.md', /(\*\*SRS-001\*\* \| )\d+( testable system requirements)/, `$1${c.srs}$2`],
        ['README.md', /(FMEA risk analysis: )\d+( hazards)/, `$1${c.hazards}$2`],
        ['README.md', /(register of )\d+( implemented verification cases)/, `$1${c.testCases}$2`],
        ['README.md', /(protocol with 15 calculation vectors and )\d+( clinical validation scenarios)/,
            `$1${c.scenarios}$2`],
        ['README.md', /(jsdom &mdash; |jsdom — )\d+( tests)/, `$1${c.suite11}$2`],
        ['README.md', /(WebKit — )\d+( specs x 3 engines)/, `$1${c.e2eSpecs}$2`],
        ['README.md', /(\*\*)\d+( executed\*\* \()\d+( Node \+ )\d+( browser)/,
            `$1${c.nodeTests + c.e2eTotal}$2${c.nodeTests}$3${c.e2eTotal}$4`],
        // The brief goes to a clinician who has no way to check it.
        ['QMS/DHF/CLINICAL-REVIEW-BRIEF.md',
            /(The software carries )\d+( automated tests)/, `$1${c.nodeTests + c.e2eTotal}$2`],
        ['QMS/DHF/RTM-001-RequirementsTraceabilityMatrix.md',
            /(\| URS v2\.0 → SRS \| )\d+( active requirements)/, `$1${c.urs}$2`],
        ['QMS/DHF/RTM-001-RequirementsTraceabilityMatrix.md',
            /(\| SRS → Verification \| )\d+( requirements)/, `$1${c.srs}$2`],
        ['QMS/DHF/RTM-001-RequirementsTraceabilityMatrix.md',
            /(\| FMEA → Verification \| )\d+( hazards)/, `$1${c.hazards}$2`],
        ['QMS/DHF/RTM-001-RequirementsTraceabilityMatrix.md',
            /(\*\*Automated test totals\*\*: )\d+( unit \+ behavioural, )\d+( system \()\d+( x 3 browser)/,
            `$1${c.nodeTests}$2${c.e2eTotal}$3${c.e2eSpecs}$4`],
        ['QMS/DHF/RTM-001-RequirementsTraceabilityMatrix.md',
            /(engines\), \*\*)\d+( executed)/, `$1${c.nodeTests + c.e2eTotal}$2`]
    ];
}

function apply(counts, { write }) {
    const stale = [];
    const byFile = new Map();

    for (const [file, re, replacement] of edits(counts)) {
        // An edit whose figure was not measured in this pass is skipped rather
        // than written into the document. Suite 14 measures only the document
        // counts, so the test totals are not its business — and an arithmetic
        // edit over missing figures yields NaN rather than "undefined", which
        // is why both are tested for.
        if (/undefined|NaN/.test(replacement)) continue;
        if (!byFile.has(file)) byFile.set(file, read(file));
        const before = byFile.get(file);
        const found = before.match(re);
        if (!found) {
            stale.push(`${file}: pattern not found — ${re}`);
            continue;
        }
        const after = before.replace(re, replacement);
        if (after !== before) {
            const now = after.match(re);
            stale.push(`${file}: ${found[0].trim()}  ->  ${(now ? now[0] : replacement).trim()}`);
            byFile.set(file, after);
        }
    }

    if (write) {
        for (const [file, content] of byFile) {
            fs.writeFileSync(path.join(ROOT, file), content, 'utf-8');
        }
    }
    return stale;
}

// ---------------------------------------------------------------- main

module.exports = { measure, measureDocuments, measureTests, apply };

if (require.main === module) {
    const counts = measure();
    const args = process.argv.slice(2);
    const write = args.includes('--write');
    const check = args.includes('--check');

    if (!check) {
        console.log('Measured from the documents and the suites:');
        for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(12)} ${v}`);
        console.log('');
    }

    const stale = apply(counts, { write });

    if (write) {
        console.log(stale.length ? 'Updated:' : 'Already current.');
        stale.forEach(l => console.log('  ' + l));
    } else if (check) {
        if (stale.length) {
            console.error('Counted quantities are stale. Run `node scripts/qms-counts.js --write`.\n');
            stale.forEach(l => console.error('  ' + l));
            process.exit(1);
        }
    } else {
        console.log(stale.length ? 'STALE — run with --write:' : 'All counted quantities are current.');
        stale.forEach(l => console.log('  ' + l));
    }
}
