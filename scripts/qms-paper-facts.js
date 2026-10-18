#!/usr/bin/env node
/**
 * Paper facts — every number the manuscript may state, generated from the tree.
 *
 * The manuscript about this repository's drift-control machinery is a document
 * like any other here, and it drifts like any other: it said "23 incidents"
 * when the log held 52. The rule this script enforces is the one the
 * repository already applies to README and TR-001 — a number is written by a
 * generator into a marker, never typed — extended to the paper.
 *
 *     node scripts/qms-paper-facts.js              report
 *     node scripts/qms-paper-facts.js --write      write replay/facts.json (clean tree, or --provisional)
 *                                                  and rewrite the markers in manuscript/, if present
 *     node scripts/qms-paper-facts.js --check      exit 1 if replay/facts.json disagrees with the tree
 *     node scripts/qms-paper-facts.js --baseline   measure the v2.0 baseline at its commit → replay/baseline.json
 *
 * Markers in the manuscript carry a dotted key and an optional rendering:
 *
 *     <!-- qms:fact incidents.total -->52<!-- /qms:fact -->
 *     <!-- qms:fact incidents.correct_work words -->forty-nine<!-- /qms:fact -->
 *
 * A key that this script does not produce cannot appear in the paper; a key
 * whose value cannot be measured is absent, and the paper says "not counted".
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const DHF = path.join(ROOT, 'QMS', 'DHF');
const REPLAY = path.join(ROOT, 'replay');
const FACTS = path.join(REPLAY, 'facts.json');
const BASELINE = path.join(REPLAY, 'baseline.json');
const RESULTS = path.join(REPLAY, 'results.json');
const MANIFEST = path.join(REPLAY, 'incidents.json');
const MANUSCRIPT = path.join(ROOT, 'manuscript', 'PAPER-1-DRAFT.md');
const SCRIPT_VERSION = '1.0';

const read = f => fs.readFileSync(f, 'utf8');
const exists = f => fs.existsSync(f);
const git = (args, cwd = ROOT) => {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
    return r.status === 0 ? r.stdout.trim() : null;
};

// ---------------------------------------------------------------- helpers

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0..999 as English words, the way a manuscript spells a count. */
function words(n) {
    if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
    if (n < 20) return WORDS[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '');
    return WORDS[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + words(n % 100) : '');
}

/** The number an English word denotes, or null. */
function unword(s) {
    const t = String(s).trim().toLowerCase().replace(/\s+and\s+/g, ' ');
    const i = WORDS.indexOf(t);
    if (i >= 0) return i;
    const m = /^([a-z]+)(?:-([a-z]+))?$/.exec(t);
    if (m) {
        const ti = TENS.indexOf(m[1]);
        if (ti >= 2) return ti * 10 + (m[2] ? WORDS.indexOf(m[2]) : 0);
    }
    const h = /^([a-z]+) hundred(?: ([a-z-]+))?$/.exec(t);
    if (h) return WORDS.indexOf(h[1]) * 100 + (h[2] ? unword(h[2]) : 0);
    return null;
}

function median(xs) {
    if (!xs.length) return null;
    const s = xs.slice().sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function daysBetween(a, b) {
    return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** Flatten {a:{b:1}} to {'a.b':1}; arrays and nulls are leaves. */
function flatten(obj, prefix = '', out = {}) {
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
        else out[key] = v;
    }
    return out;
}

// ---------------------------------------------------------------- the drift log

/** The log's rows, as {id, detected, claim, stated, contradicted, cause, detectedBy, fixedIn, preventedBy}. */
function logRows() {
    const src = read(path.join(DHF, 'DRIFT-LOG.md'));
    const rows = [];
    for (const line of src.split('\n')) {
        if (!/^\| \d+ \| \d{4}-\d{2}-\d{2} \|/.test(line)) continue;
        const c = line.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
        rows.push({ id: Number(c[0]), detected: c[1], claim: c[2], stated: c[3], contradicted: c[4],
            cause: c[5], detectedBy: c[6], fixedIn: c[7], preventedBy: c[8] || '' });
    }
    return rows;
}

const guardedRow = r => r.preventedBy && !r.preventedBy.startsWith('—');

// ---------------------------------------------------------------- measure

function measure() {
    const rows = logRows();
    const manifest = exists(MANIFEST) ? JSON.parse(read(MANIFEST)) : null;
    const byId = new Map((manifest ? manifest.incidents : []).map(i => [i.id, i]));
    const commit = git(['rev-parse', 'HEAD']);
    const tag = git(['describe', '--exact-match', '--tags', 'HEAD']);
    const dirty = git(['status', '--porcelain']);

    // --- incidents: the log is the dataset; the manifest is the classification.
    const incidents = {
        total: rows.length,
        guarded_in_log: rows.filter(guardedRow).length,
        log_states: (() => {
            const m = /\*\*Counted here rather than described:\*\* (\d+) incidents, of which (\d+) are now/.exec(read(path.join(DHF, 'DRIFT-LOG.md')));
            return m ? { total: Number(m[1]), prevented: Number(m[2]) } : null;
        })(),
        classified: byId.size,
        correct_work: [...byId.values()].filter(i => i.correct_work).length,
        correct_work_exceptions: [...byId.values()].filter(i => !i.correct_work).map(i => i.id),
        correct_work_criterion: manifest ? manifest.classification.correct_work_criterion : null,
        by_class: {}, by_detection: {},
        retrospective: [...byId.values()].filter(i => i.retrospective).length,
        logged_live: [...byId.values()].filter(i => !i.retrospective).length,
        with_introduced_date: [...byId.values()].filter(i => i.introduced).length,
        with_introducing_commit: [...byId.values()].filter(i => i.introducing_commit).length,
        latency: null, recurrence_after_review: null,
        live_catches: rows.filter(r => byId.get(r.id) && byId.get(r.id).detection === 'automated_gate')
            .map(r => ({ id: r.id, date: r.detected, found_by: r.detectedBy, gate: (byId.get(r.id).guards || []).join(', ') || r.preventedBy })),
        found_in_use: rows.filter(r => byId.get(r.id) && byId.get(r.id).detection === 'use').map(r => r.id)
    };
    for (const i of byId.values()) {
        incidents.by_class[i.class] = (incidents.by_class[i.class] || 0) + 1;
        incidents.by_detection[i.detection] = (incidents.by_detection[i.detection] || 0) + 1;
    }
    const dated = [...byId.values()].filter(i => i.introduced).map(i => ({ id: i.id, days: daysBetween(i.introduced, rows.find(r => r.id === i.id).detected), retrospective: i.retrospective }));
    incidents.latency = {
        definition: 'days from the introducing change (where the row or its change record states one) to the log row; pre_gate = rows reconstructed when the log was created (DCR-029, 2026-08-07), post_gate = rows logged live after it',
        pre_gate: { n: dated.filter(d => d.retrospective).length, median_days: median(dated.filter(d => d.retrospective).map(d => d.days)) },
        post_gate: { n: dated.filter(d => !d.retrospective).length, median_days: median(dated.filter(d => !d.retrospective).map(d => d.days)) }
    };
    // Recurrence after the independent review's remediation (DCR-015, dated by its own header).
    const dcr015 = (() => { const f = fs.readdirSync(path.join(DHF, 'DCR')).find(n => n.startsWith('DCR-015')); const m = f && /\*\*Date Created\*\* \| (\d{4}-\d{2}-\d{2})/.exec(read(path.join(DHF, 'DCR', f))); return m ? m[1] : null; })();
    if (dcr015) {
        const N = 7;
        const rec = [...byId.values()].filter(i => i.introduced && daysBetween(dcr015, i.introduced) >= 0 && daysBetween(dcr015, i.introduced) <= N);
        incidents.recurrence_after_review = { remediation_date: dcr015, within_days: N, n: rec.length, ids: rec.map(i => i.id) };
    }

    // --- replay results
    let replay = { status: 'not run', note: 'replay/results.json absent — run `npm run replay` on a clean tree' };
    if (exists(RESULTS)) {
        const r = JSON.parse(read(RESULTS));
        replay = r.provisional
            ? { status: 'provisional', note: `results at ${r.commit} were measured on a dirty tree and are not admissible`, commit: r.commit }
            : { status: 'measured', commit: r.commit, tag: r.tag, generated_at: r.generated_at, summary: r.summary, by_class: r.by_class,
                controls: r.controls, regressions: r.regressions };
        if (replay.summary) {
            for (const kind of Object.keys(replay.summary)) {
                const s = replay.summary[kind];
                s.coverage_of_guarded_rows = (() => {
                    const guardedIds = rows.filter(guardedRow).map(x => x.id);
                    const caught = (r.runs || []).filter(x => x.kind === kind && x.status === 'caught' && guardedIds.includes(x.incident)).length;
                    return { caught, n: guardedIds.length };
                })();
            }
        }
    }

    // --- the independent review's wrong figures: rows of REVIEW-2026-08-06.md §3.2
    let review = { independent: { wrong_figures: null, pointer: 'REVIEW-2026-08-06.md §3.2' } };
    const reviewFile = path.join(ROOT, 'REVIEW-2026-08-06.md');
    if (exists(reviewFile)) {
        const sec = /### 3\.2 Counted quantities([\s\S]*?)### 3\.3/.exec(read(reviewFile));
        if (sec) review.independent.wrong_figures = sec[1].split('\n').filter(l => /^\| "/.test(l) || /^\| `/.test(l)).length;
    }

    // --- baseline: the recorded figures, by regex from the documents, and the measurement
    const dcr004 = fs.readdirSync(path.join(DHF, 'DCR')).find(n => n.startsWith('DCR-004'));
    const dcr004Src = dcr004 ? read(path.join(DHF, 'DCR', dcr004)) : '';
    const tr = read(path.join(DHF, 'TR-001-TestResults.md'));
    const baseline = {
        recorded: {
            dcr004_passing_tests: (m => m ? Number(m[1]) : null)(/"(\d+) passing tests, 100% pass/.exec(dcr004Src)),
            dcr004_pointer: dcr004 ? `QMS/DHF/DCR/${dcr004} §1` : null,
            tr001_section_1_1_tests_recorded: (m => m ? Number(m[1]) : null)(/\| Tests recorded \| (\d+) \|/.exec(tr)),
            tr001_pointer: 'QMS/DHF/TR-001-TestResults.md §1.1'
        },
        defects_behind_green: (() => {
            const sec = /## 4\. Defects Corrected([\s\S]*?)Two further items/.exec(dcr004Src);
            return sec ? sec[1].split('\n').filter(l => /^\| D-\d+ \|/.test(l)).length : null;
        })(),
        defects_pointer: dcr004 ? `QMS/DHF/DCR/${dcr004} §4, rows D-01 onward` : null,
        measured: exists(BASELINE) ? JSON.parse(read(BASELINE)) : { status: 'not measured', note: 'run `node scripts/qms-paper-facts.js --baseline`' }
    };

    // --- current tests, from the newest admissible evidence bundle
    const qmsFacts = require(path.join(__dirname, 'qms-facts.js'));
    const run = qmsFacts.newestCleanRun();
    const tests = run ? {
        current: { total: run.facts.tests_total, node: run.facts.tests_node, browser: run.facts.tests_browser,
            skips: run.facts.tests_skipped, evidence_run_id: run.id, commit: run.facts.git_commit, layers: run.facts.layers }
    } : { current: { status: 'no admissible evidence bundle' } };

    // --- the incidents the paper tells in full, parsed from their rows
    const row = id => rows.find(r => r.id === id) || {};
    const nums = s => (String(s).match(/\d+(?:\.\d+)*/g) || []);
    const versions_incident = { row: 15, values: nums(row(15).claim), pointer: 'DRIFT-LOG row 15' };
    const test_totals_incident = { row: 16, claimed: nums(row(16).claim), pointer: 'DRIFT-LOG row 16' };
    const counts = require(path.join(__dirname, 'qms-counts.js')).measureDocuments();
    // "URS-001 (69 rows), RA-001 (51 rows)": the figures are the parenthesised row counts, not the document numbers.
    const counts_incident = { row: 1, claimed: nums(row(1).claim),
        true_at_detection: [...String(row(1).contradicted || '').matchAll(/\((\d+) rows\)/g)].map(m => Number(m[1])),
        true_now: { urs: counts.urs, hazards: counts.hazards, test_cases: counts.testCases }, pointer: 'DRIFT-LOG row 1' };
    const brief = (() => {
        const r12 = row(12);
        const claimed = /listed ([a-z-]+) documents/.exec(r12.claim || '');
        const truth = /(\d+) signature rows/.exec(r12.contradicted || '');
        return { row: 12, documents_claimed: claimed ? unword(claimed[1]) : null, signatures_open_at_detection: truth ? Number(truth[1]) : null, pointer: 'DRIFT-LOG row 12' };
    })();

    // --- signatures, from the generated register's own source
    const signoffs = require(path.join(__dirname, 'qms-signoffs.js')).collect();
    const outstanding = {};
    let sigTotal = 0, sigClinical = 0;
    for (const [role, items] of signoffs.outstanding) {
        outstanding[role] = items.length; sigTotal += items.length;
        if (/Clinical/i.test(role)) sigClinical += items.length;
    }

    // --- change records
    const dcrs = fs.readdirSync(path.join(DHF, 'DCR')).filter(n => /^DCR-\d+/.test(n) && !/TEMPLATE/.test(n));

    const facts = {
        _about: 'Generated by scripts/qms-paper-facts.js. Every number the manuscript states must be read from here by marker. Keys absent here cannot appear in the paper.',
        repo: { commit, tag, tree_clean: dirty === '', doi: null, doi_note: 'minted at the tagged release; null until then',
            generated_at: new Date().toISOString(), script_version: SCRIPT_VERSION },
        classification: manifest ? manifest.classification : null,
        incidents, replay, review, baseline, tests,
        revert_check: { tests_found_wrong: null, note: 'not counted: the two revert-check findings are recorded in prose (CLAUDE.md, the manuscript), not in a machine-readable record' },
        versions_incident, test_totals_incident, counts_incident, brief,
        signatures: { outstanding: { total: sigTotal, clinical: sigClinical, by_role: outstanding }, pointer: 'QMS/DHF/SIGNOFF-REGISTER.md (generated)' },
        change_records: { total: dcrs.length, newest: dcrs.sort().pop() },
        sessions: { total: null, note: 'not counted: sessions were not logged' },
        drift_log: { classes_in_taxonomy: manifest ? Object.keys(manifest.classes).length : null }
    };
    return facts;
}

// ---------------------------------------------------------------- baseline measurement

/** Which kind of test a baseline file is, from how it reaches the code. */
function classifyTestFile(src) {
    const signals = [];
    if (/require\(['"][^'"]*web\/scripts/.test(src) || /JSDOM|runInContext|runInNewContext/.test(src)) signals.push('requires-shipped-module');
    if (/readFileSync\([^)]*(web|\.html|\.js|\.json)/.test(src) && /\.includes\(|\.match\(|\.test\(|indexOf\(/.test(src)) signals.push('asserts-on-source-text');
    if (/mirrors|re-?implement|extract(ed|s)? the .*logic|copied from/i.test(src)) signals.push('states-it-mirrors-the-app');
    if (/new Function\(/.test(src)) signals.push('syntax-check-only');
    let kind = 'other';
    if (signals.includes('requires-shipped-module')) kind = 'shipped_module';
    else if (signals.includes('states-it-mirrors-the-app')) kind = 'reimplementation';
    else if (signals.includes('asserts-on-source-text') || signals.includes('syntax-check-only')) kind = 'source_text';
    return { kind, signals };
}

function measureBaseline() {
    const tr = read(path.join(DHF, 'TR-001-TestResults.md'));
    const dateM = /\| v2\.0 \((\d{4}-\d{2}-\d{2})\) \|/.exec(tr);
    if (!dateM) throw new Error('TR-001 §1.1 no longer states the v2.0 baseline date');
    const date = dateM[1];
    const commit = git(['rev-list', '-1', `--before=${date}T23:59:59`, 'HEAD']);
    if (!commit) throw new Error(`no commit on or before ${date}`);
    const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'wbcds-baseline-'));
    fs.rmSync(wt, { recursive: true, force: true });
    if (git(['worktree', 'add', '--detach', '-q', wt, commit]) === null) throw new Error('worktree failed');
    try {
        const files = fs.readdirSync(path.join(wt, 'tests')).filter(n => n.endsWith('.test.js')).sort();
        const perFile = [];
        let total = 0, pass = 0, fail = 0;
        for (const f of files) {
            const r = spawnSync('node', ['--test', path.join('tests', f)], { cwd: wt, encoding: 'utf8' });
            const out = (r.stdout || '') + (r.stderr || '');
            const n = k => { const m = new RegExp(`^ℹ ${k} (\\d+)$`, 'm').exec(out); return m ? Number(m[1]) : 0; };
            const c = classifyTestFile(read(path.join(wt, 'tests', f)));
            perFile.push({ file: `tests/${f}`, tests: n('tests'), pass: n('pass'), fail: n('fail'), kind: c.kind, signals: c.signals });
            total += n('tests'); pass += n('pass'); fail += n('fail');
        }
        const byKind = {};
        for (const p of perFile) {
            byKind[p.kind] = byKind[p.kind] || { files: 0, tests: 0 };
            byKind[p.kind].files++; byKind[p.kind].tests += p.tests;
        }
        const result = {
            _about: 'The v2.0 baseline test suite, measured at the newest commit on or before the baseline date TR-001 §1.1 states, and classified by how each file reaches the code. Generated by scripts/qms-paper-facts.js --baseline.',
            baseline_date: date, commit, commit_date: git(['log', '-1', '--format=%ad', '--date=short', commit]),
            tests: { total, pass, fail, pass_rate: total ? Math.round(1000 * pass / total) / 10 : null },
            by_kind: byKind, executing_shipped_code: byKind.shipped_module ? byKind.shipped_module.tests : 0,
            files: perFile, measured_at: new Date().toISOString(), script_version: SCRIPT_VERSION
        };
        fs.writeFileSync(BASELINE, JSON.stringify(result, null, 2) + '\n', 'utf8');
        return result;
    } finally {
        git(['worktree', 'remove', '--force', wt]);
        git(['worktree', 'prune']);
    }
}

// ---------------------------------------------------------------- manuscript markers

const MARKER = /<!-- qms:fact ([a-z0-9_.]+)((?: words)?) -->([\s\S]*?)<!-- \/qms:fact -->/g;

function readManuscriptMarkers(file = MANUSCRIPT) {
    if (!exists(file)) return [];
    const src = read(file);
    const out = [];
    let m;
    while ((m = MARKER.exec(src)) !== null) {
        out.push({ key: m[1], render: m[2].trim() || 'digits', value: m[3], line: src.slice(0, m.index).split('\n').length });
    }
    return out;
}

function render(value, how) {
    if (how === 'words' && Number.isInteger(value)) return words(value);
    return Array.isArray(value) ? value.join(', ') : String(value);
}

/** Rewrite every marker in the manuscript from a fact set. Returns {touched, unknown}. */
function writeManuscript(facts, file = MANUSCRIPT) {
    if (!exists(file)) return { touched: false, unknown: [] };
    const flat = flatten(facts);
    const before = read(file);
    const unknown = [];
    const after = before.replace(MARKER, (whole, key, how, old) => {
        if (!(key in flat) || flat[key] === null || flat[key] === undefined) { unknown.push(key); return whole; }
        return `<!-- qms:fact ${key}${how} -->${render(flat[key], how.trim())}<!-- /qms:fact -->`;
    });
    if (after !== before) fs.writeFileSync(file, after, 'utf8');
    return { touched: after !== before, unknown };
}

/** Markers whose value disagrees with a fact set, and markers naming no fact. */
function manuscriptDisagreements(facts, file = MANUSCRIPT) {
    const flat = flatten(facts);
    const bad = [];
    for (const mk of readManuscriptMarkers(file)) {
        if (!(mk.key in flat)) { bad.push(`line ${mk.line}: ${mk.key} is not a fact this generator produces`); continue; }
        if (flat[mk.key] === null || flat[mk.key] === undefined) { bad.push(`line ${mk.line}: ${mk.key} is not measured (the paper must say "not counted")`); continue; }
        const want = render(flat[mk.key], mk.render);
        if (want !== mk.value) bad.push(`line ${mk.line}: ${mk.key} says "${mk.value}", facts say "${want}"`);
    }
    return bad;
}

// ---------------------------------------------------------------- main

module.exports = { measure, measureBaseline, classifyTestFile, flatten, words, unword, readManuscriptMarkers,
    writeManuscript, manuscriptDisagreements, FACTS, BASELINE, MANUSCRIPT, MARKER };

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--baseline')) {
        const b = measureBaseline();
        console.log(`v2.0 baseline at ${b.commit.slice(0, 7)} (${b.commit_date}): ${b.tests.total} tests, ${b.tests.pass} pass; ` +
            Object.entries(b.by_kind).map(([k, v]) => `${k} ${v.tests}`).join(', ') + `\nwritten replay/baseline.json`);
        process.exit(0);
    }
    const facts = measure();
    const write = args.includes('--write');
    const check = args.includes('--check');
    const provisional = args.includes('--provisional');

    if (write) {
        if (!facts.repo.tree_clean && !provisional) {
            console.error('The tree is not clean. facts.json describes a commit; pass --provisional to write it anyway, so marked.');
            process.exit(2);
        }
        facts.repo.provisional = !facts.repo.tree_clean;
        fs.writeFileSync(FACTS, JSON.stringify(facts, null, 2) + '\n', 'utf8');
        console.log(`written replay/facts.json at ${facts.repo.commit.slice(0, 7)}${facts.repo.provisional ? ' (PROVISIONAL)' : ''}`);
        if (exists(MANUSCRIPT)) {
            const { touched, unknown } = writeManuscript(facts);
            console.log(touched ? 'manuscript markers rewritten' : 'manuscript markers already current');
            if (unknown.length) console.log('markers naming no fact: ' + [...new Set(unknown)].join(', '));
            // The private manuscript vendors the public file and records its hash.
            const dir = path.join(ROOT, 'manuscript', 'facts');
            fs.mkdirSync(dir, { recursive: true });
            const name = `${facts.repo.tag || facts.repo.commit.slice(0, 12)}.json`;
            fs.copyFileSync(FACTS, path.join(dir, name));
            const sha = crypto.createHash('sha256').update(read(FACTS)).digest('hex');
            fs.writeFileSync(path.join(dir, `${name}.sha256`), `${sha}  replay/facts.json @ ${facts.repo.commit}\n`, 'utf8');
            console.log(`vendored to manuscript/facts/${name} (sha256 ${sha.slice(0, 12)}…)`);
        }
        process.exit(0);
    }
    if (check) {
        if (!exists(FACTS)) { console.error('replay/facts.json is absent'); process.exit(1); }
        const committed = JSON.parse(read(FACTS));
        const a = flatten(committed), b = flatten(facts);
        const volatile = /^repo\.(generated_at|tree_clean|provisional|commit|tag)$|^replay\.generated_at$|^baseline\.measured\.measured_at$|^classification\./;
        const diff = [];
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (volatile.test(k) || k.startsWith('_')) continue;
            if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) diff.push(`${k}: committed ${JSON.stringify(a[k])}, tree ${JSON.stringify(b[k])}`);
        }
        if (diff.length) { console.error('replay/facts.json is stale — run `node scripts/qms-paper-facts.js --write`:\n  ' + diff.join('\n  ')); process.exit(1); }
        console.log('replay/facts.json agrees with the tree.');
        process.exit(0);
    }
    const flat = flatten(facts);
    for (const [k, v] of Object.entries(flat)) if (!k.startsWith('_')) console.log(`  ${k.padEnd(48)} ${JSON.stringify(v)}`);
}
