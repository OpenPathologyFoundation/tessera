#!/usr/bin/env node
/**
 * Measured facts, written into the documents that state them.
 *
 * Four live documents each carried their own copy of the test totals and three
 * of them disagreed: README and RTM-001 said 1039 executed with 3 documented
 * skips, the clinical brief said 1039, and TR-001 — the document whose whole
 * subject is the test results — said 939 with 7 skips. All four had been true
 * at some point. None of them was measured.
 *
 * The cause was structural rather than careless. `qms-counts.js --write`
 * refreshed the totals, but only when someone ran it; TR-001 was written by a
 * different tool at a different moment; and QC-001 checked the document counts
 * without checking the test totals at all, because measuring them means
 * spawning the runners and the suite runs inside one.
 *
 * So the totals are now written from one place at one moment — the evidence
 * run that measured them — into markers the documents carry:
 *
 *     <!-- qms:fact tests_total -->1039<!-- /qms:fact -->
 *
 * The markers render invisibly; the visible text is unchanged. `facts.json` in
 * the evidence bundle records the same numbers, so a document can be checked
 * against the run that produced it rather than against another document that
 * might be equally stale.
 *
 *     node scripts/qms-facts.js            report what the documents state
 *     node scripts/qms-facts.js --write    rewrite the markers from a fact set
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const EVIDENCE = path.join(ROOT, 'QMS', 'DHF', 'TestEvidence');

/** Documents that state a measured test fact. */
const LIVE_DOCUMENTS = [
    'README.md',
    'QMS/DHF/RTM-001-RequirementsTraceabilityMatrix.md',
    'QMS/DHF/CLINICAL-REVIEW-BRIEF.md',
    'QMS/DHF/TR-001-TestResults.md'
];

/** The facts a run measures. Anything not in here must not be marked. */
const KEYS = ['tests_total', 'tests_node', 'tests_browser', 'tests_skipped', 'evidence_run_id'];

const marker = key =>
    new RegExp(`(<!-- qms:fact ${key} -->)([\\s\\S]*?)(<!-- /qms:fact -->)`, 'g');

/**
 * Every marker in a document, as {key, value, line}.
 *
 * An unknown key is returned too rather than ignored, so a typo surfaces as a
 * failure instead of as a marker nothing ever writes.
 */
function readMarkers(file) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf-8');
    const out = [];
    const re = /<!-- qms:fact ([a-z_]+) -->([\s\S]*?)<!-- \/qms:fact -->/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        out.push({
            key: m[1],
            value: m[2],
            line: src.slice(0, m.index).split('\n').length
        });
    }
    return out;
}

/** Every marker across every live document. */
function readAll() {
    const out = [];
    for (const file of LIVE_DOCUMENTS) {
        if (!fs.existsSync(path.join(ROOT, file))) continue;
        readMarkers(file).forEach(mk => out.push(Object.assign({ file }, mk)));
    }
    return out;
}

/**
 * Disagreements between documents about the same fact.
 *
 * This is the check that D1 needed and did not have. It compares documents
 * against each other and needs nothing spawned, so it runs inside the suite.
 */
function disagreements() {
    const byKey = new Map();
    for (const mk of readAll()) {
        if (!byKey.has(mk.key)) byKey.set(mk.key, []);
        byKey.get(mk.key).push(mk);
    }
    const bad = [];
    for (const [key, list] of byKey) {
        if (!KEYS.includes(key)) {
            bad.push(`${key}: not a measured fact — ${list.map(l => l.file).join(', ')}`);
            continue;
        }
        const values = new Set(list.map(l => l.value));
        if (values.size > 1) {
            bad.push(`${key}: ${list.map(l => `${l.file}:${l.line} says "${l.value}"`).join('; ')}`);
        }
    }
    return bad;
}

/** Write a fact set into every marker that names one of its keys. */
function write(facts) {
    const touched = [];
    for (const file of LIVE_DOCUMENTS) {
        const full = path.join(ROOT, file);
        if (!fs.existsSync(full)) continue;
        const before = fs.readFileSync(full, 'utf-8');
        let after = before;
        for (const key of KEYS) {
            if (facts[key] === undefined || facts[key] === null) continue;
            after = after.replace(marker(key), `$1${facts[key]}$3`);
        }
        if (after !== before) {
            fs.writeFileSync(full, after, 'utf-8');
            touched.push(file);
        }
    }
    return touched;
}

// ---------------------------------------------------------------- evidence

/** environment.txt as a key=value map. */
function environment(dir) {
    const file = path.join(dir, 'environment.txt');
    if (!fs.existsSync(file)) return {};
    const env = {};
    for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
        const at = line.indexOf('=');
        if (at > 0 && !line.startsWith(' ')) env[line.slice(0, at)] = line.slice(at + 1);
    }
    return env;
}

/**
 * The newest evidence bundle admissible as release evidence.
 *
 * A bundle captured from a dirty tree records a result but not what produced
 * it, so it cannot be the source of a published figure. The runner already
 * marks those PROVISIONAL; this is the other half — nothing reads them.
 */
function newestCleanRun() {
    if (!fs.existsSync(EVIDENCE)) return null;
    const runs = fs.readdirSync(EVIDENCE)
        .filter(n => fs.statSync(path.join(EVIDENCE, n)).isDirectory())
        .sort()
        .reverse();
    for (const name of runs) {
        const dir = path.join(EVIDENCE, name);
        if (environment(dir).tree_state !== 'clean') continue;
        const facts = path.join(dir, 'facts.json');
        if (!fs.existsSync(facts)) continue;
        return { id: name, dir, facts: JSON.parse(fs.readFileSync(facts, 'utf-8')) };
    }
    return null;
}

module.exports = {
    LIVE_DOCUMENTS, KEYS, readMarkers, readAll, disagreements, write,
    environment, newestCleanRun
};

if (require.main === module) {
    const bad = disagreements();
    const all = readAll();
    console.log(`${all.length} marker(s) across ${new Set(all.map(m => m.file)).size} document(s).`);
    const byKey = new Map();
    all.forEach(m => byKey.set(m.key, m.value));
    for (const [k, v] of [...byKey].sort()) console.log(`  ${k.padEnd(18)} ${v}`);

    const run = newestCleanRun();
    console.log(run
        ? `\nNewest admissible evidence: ${run.id}`
        : '\nNo admissible (clean-tree) evidence bundle with facts.json yet.');

    if (bad.length) {
        console.error('\nDocuments disagree:');
        bad.forEach(b => console.error('  ' + b));
        process.exit(1);
    }
    console.log('\nAll documents agree.');
}
