#!/usr/bin/env node
/**
 * Verification index — the register of what is actually verified.
 *
 * `RTM-001` and `TR-001` cite verification identifiers. `VV-001` and `TP-001`
 * are supposed to define them. They had drifted into two unrelated universes:
 * an independent review found 61 cited identifiers that existed in no protocol
 * document, and TP-001's own 106 `TC-0xx` numbers appeared in no test file at
 * all — zero matches across the entire suite.
 *
 * A traceability matrix citing identifiers that do not exist is worse than no
 * matrix, because it manufactures the appearance of coverage.
 *
 * The gap was also widening, not closing: every suite added while responding to
 * that review cited new identifiers into RTM-001 and TR-001 without touching
 * the protocol, taking it from 61 to 98.
 *
 * So the register is no longer written by hand. It is extracted from the test
 * files, which are the only artefact that cannot lie about what it verifies.
 *
 *     node scripts/qms-verification-index.js           report
 *     node scripts/qms-verification-index.js --write   regenerate the registers
 *     node scripts/qms-verification-index.js --check   exit 1 on any divergence
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf-8');

const START = '<!-- BEGIN GENERATED: verification-index -->';
const END = '<!-- END GENERATED: verification-index -->';

/** Which layer a file belongs to, for the register's Layer column. */
const LAYER = {
    '01': 'Unit', '02': 'Unit', '05': 'Unit', '08': 'Unit', '09': 'Unit',
    '12': 'Unit', '13': 'Static', '14': 'Static',
    '03': 'Static', '04': 'Static', '06': 'Static', '07': 'Static', '10': 'Static',
    '11': 'Behaviour'
};

function layerOf(file) {
    if (file.startsWith('tests-e2e/')) return 'System';
    const m = /tests\/(\d+)-/.exec(file);
    return (m && LAYER[m[1]]) || 'Unit';
}

// ---------------------------------------------------------------- extract

/**
 * Every identified test, taken from the runners.
 *
 * Source regex is not enough. Whole families of cases are generated in loops —
 * one per shipped preset, per theme, per contrast surface — and their titles
 * are template literals whose identifier is a variable. A regex over the source
 * reported VV-SYS-162 through 169, 177 and 178 as "cited but not implemented"
 * when all eleven exist and pass. The runners resolve them; nothing else does.
 *
 * This spawns both runners, so it is CLI-only. The committed register is what
 * the build checks against (see parseRegister).
 */
function extract() {
    const { spawnSync } = require('node:child_process');
    const seen = new Map();
    const entries = [];
    // Counted as instances-with-an-id, then subtracted from the runners' own
    // totals. Counting "lines without an id" directly does not work: the Node
    // reporter prints a line with a duration for every `describe` block too,
    // and those were being reported as unidentified tests.
    // Counted directly from test lines, not derived by subtracting from a
    // separately-measured total. Subtraction proved unstable — it oscillated
    // between 0 and 1 across identical runs — because the two measurements
    // come from different passes over the runner output.
    //
    // Test lines are indented under their describe block; a top-level describe
    // prints at column 0 with a duration and would otherwise be counted.
    let noId = 0;
    // Unique test titles. Playwright lists each case once per engine, so
    // counting raw lines would report 375 where 125 cases exist and make the
    // unidentified figure meaningless.
    const distinct = new Set();

    const add = (id, title, file) => {
        if (seen.has(id)) {
            const first = seen.get(id);
            if (first.file !== file && !first.duplicates.includes(file)) first.duplicates.push(file);
            return;
        }
        if (/^SYS-/.test(id)) return;   // requirement namespace, not a series
        const entry = { id, title, file, layer: layerOf(file), duplicates: [] };
        seen.set(id, entry);
        entries.push(entry);
    };

    // --- Node layer ---
    //
    // The denominator comes from the runner's own summary, not from counting
    // the printed lines: the default reporter prints a line with a duration for
    // every `describe` block as well as every test, which inflated the total by
    // roughly a hundred.
    const suiteFiles = fs.readdirSync(path.join(ROOT, 'tests'))
        .filter(n => n.endsWith('.test.js')).sort()
        .map(n => path.join('tests', n));
    let nodeTotal = 0;
    for (const file of suiteFiles) {
        const run = spawnSync('node', ['--test', file], { cwd: ROOT, encoding: 'utf-8' });
        const out = run.stdout || '';
        const summary = out.match(/^\u2139 tests (\d+)$/m);
        if (summary) nodeTotal += Number(summary[1]);
        for (const line of out.split('\n')) {
            const m = /^\s{2,}[✔✖]\s+(.+?)\s+\([\d.]+m?s\)\s*$/.exec(line);
            if (!m) continue;
            const idm = /^([A-Z]{2,4}(?:-[A-Z0-9]+)*?-[A-Z]?\d+)\s*(?:\([^)]*\))?\s*:\s*(.*)$/.exec(m[1]);
            if (idm) add(idm[1], idm[2].trim(), file); else noId++;
        }
    }

    // --- System layer: --list resolves the template literals ---
    const pw = spawnSync('npx', ['playwright', 'test', '--list'], { cwd: ROOT, encoding: 'utf-8' });
    for (const line of (pw.stdout || '').split('\n')) {
        const m = /^\s*\[[^\]]+\]\s+›\s+([^\s:]+\.spec\.js):\d+:\d+\s+›\s+(.*)$/.exec(line);
        if (!m) continue;
        const file = 'tests-e2e/' + m[1];
        const title = m[2].split(' › ').pop();
        distinct.add(file + '::' + title);
        const idm = /^([A-Z]{2,4}(?:-[A-Z0-9]+)*?-[A-Z]?\d+)\s*(?:\([^)]*\))?\s*:\s*(.*)$/.exec(title);
        if (idm) add(idm[1], idm[2].trim(), file); else noId++;
    }

    entries.sort((a, b) => {
        const pa = a.id.replace(/-?\d+$/, ''), pb = b.id.replace(/-?\d+$/, '');
        if (pa !== pb) return pa.localeCompare(pb);
        return Number(a.id.match(/\d+$/)[0]) - Number(b.id.match(/\d+$/)[0]);
    });
    // A parametrised case — one per shipped preset, per theme, per contrast
    // surface — is ONE verification case run several times. Counting those
    // extra runs as "unidentified" misdescribed them; `noId` counts only
    // tests whose title carries no identifier.
    const total = nodeTotal + distinct.size;
    return { entries, unidentified: noId, instances: total, total };
}

/** Identifiers cited by the traceability documents. */
function citations() {
    const cited = new Map();
    for (const file of ['QMS/DHF/RTM-001-RequirementsTraceabilityMatrix.md',
        'QMS/DHF/TR-001-TestResults.md']) {
        const src = read(file);
        // Ranges such as "VV-SYS-160–168" cite every identifier between.
        for (const m of src.matchAll(/\b([A-Z]{2,4}(?:-[A-Z0-9]+)*?)-([A-Z]?\d+)\s*(?:[–—-]{1,2}\s*(?:\1-)?([A-Z]?\d+))?/g)) {
            const prefix = m[1];
            // A verification identifier has a series segment: VV-SYS, TC-B,
            // UD, QC, SC. Bare "VV-001" and "TP-001" are DOCUMENT numbers and
            // were being reported as missing tests.
            if (!/^(VV-[A-Z0-9]+|TC-B|UD|QC|SC)$/.test(prefix)) continue;
            const from = Number(m[2]);
            const to = m[3] ? Number(m[3]) : from;
            if (to < from || to - from > 60) { addCite(cited, `${prefix}-${m[2]}`, file); continue; }
            for (let n = from; n <= to; n++) {
                addCite(cited, `${prefix}-${String(n).padStart(m[2].length, '0')}`, file);
            }
        }
    }
    return cited;
}

function addCite(map, id, file) {
    if (!map.has(id)) map.set(id, new Set());
    map.get(id).add(file);
}

// ---------------------------------------------------------------- render

function renderRegister({ entries, unidentified, instances }) {
    const byPrefix = new Map();
    for (const e of entries) {
        const prefix = e.id.replace(/-?\d+$/, '');
        if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
        byPrefix.get(prefix).push(e);
    }

    const lines = [];
    lines.push(START);
    lines.push('');
    lines.push('> **Generated. Do not edit by hand.**  ');
    lines.push('> `node scripts/qms-verification-index.js --write` regenerates this section from');
    lines.push('> the test files. Suite 14 fails the build if it is stale, and if any identifier');
    lines.push('> cited by RTM-001 or TR-001 does not exist here.');
    lines.push('');
    lines.push(`**${entries.length} verification cases** across ${byPrefix.size} series and 4 layers, ` +
        `run as ${instances} tests.` +
        (unidentified
            ? `  ${unidentified} tests carry no identifier and are not registered.`
            : '  Every test carries an identifier; a case running more than once is ' +
              'parametrised — one per shipped preset, per theme, or per surface.'));
    lines.push('');

    lines.push('| Series | Cases | Layer(s) | Covers |');
    lines.push('|--------|-------|----------|--------|');
    for (const [prefix, group] of [...byPrefix].sort()) {
        const layers = [...new Set(group.map(g => g.layer))].join(', ');
        const first = group[0].id.match(/\d+$/)[0];
        const last = group[group.length - 1].id.match(/\d+$/)[0];
        // TC-B012 fuses its letter to the digits; VV-SYS-107 does not.
        const sep = /\d/.test(group[0].id.charAt(prefix.length)) ? '' : '-';
        lines.push(`| \`${prefix}${sep}*\` | ${group.length} (${first}–${last}) | ${layers} | ${SERIES[prefix] || '—'} |`);
    }
    lines.push('');

    for (const [prefix, group] of [...byPrefix].sort()) {
        lines.push(`#### ${prefix}-* — ${SERIES[prefix] || 'verification cases'}`);
        lines.push('');
        lines.push('| ID | Verifies | Layer | File |');
        lines.push('|----|----------|-------|------|');
        for (const e of group) {
            const dup = e.duplicates.length ? ' **(DUPLICATE ID)**' : '';
            lines.push(`| ${e.id} | ${e.title.replace(/\|/g, '\\|')}${dup} | ${e.layer} | \`${e.file}\` |`);
        }
        lines.push('');
    }

    lines.push(END);
    return lines.join('\n');
}

const SERIES = {
    'VV-CALC': 'Calculation engine vectors',
    'VV-CI': 'Wilson confidence intervals',
    'VV-DEN': 'Denominator policy',
    'VV-E2E': 'End-to-end data integrity',
    'VV-INC': 'Increment and decrement',
    'VV-LOW': 'Sub-target advisory',
    'VV-ME': 'Myeloid-to-erythroid ratio',
    'VV-PROV': 'Method provenance',
    'VV-RND': 'Rounding policy',
    'VV-SUB': 'Subset percentages',
    'VV-SYS': 'System verification in a real browser',
    'VV-THR': 'Diagnostic thresholds',
    'VV-TPL': 'Output templates',
    'VV-ABS': 'Absolute counts and the analyser WBC',
    'TC-B': 'Application behaviour in a DOM',
    'UD': 'User-facing documentation',
    'QC': 'QMS counted quantities',
    'SC': 'Standards conformance (ICSH)',
    'VV-CFG': 'Configuration profile integrity',
    'VV-DOM': 'Counter markup and required elements',
    'VV-SRC': 'Application source integrity (static)',
    'VV-AUD': 'Audio engine structure',
    'VV-SAV': 'Autosave and crash recovery (static)',
    'VV-SCH': 'v2 configuration schema',
    'VV-PRE': 'Preset catalogue integrity',
    'VV-EDT': 'Configuration editor structure'
};

/**
 * The identifiers registered in a committed document.
 *
 * Reading the committed register rather than re-extracting is what lets the
 * build check this at all: extraction spawns both runners, and suite 14 runs
 * inside one of them.
 */
function parseRegister(file) {
    const src = read(file);
    const from = src.indexOf(START);
    const to = src.indexOf(END);
    if (from === -1 || to === -1) return null;
    const block = src.slice(from, to);
    const ids = new Set();
    // `-[A-Z]?\d+`: TC-B012 fuses its letter to the digits, and a pattern
    // requiring a hyphen before them silently dropped all 91 of them.
    for (const m of block.matchAll(/^\| ([A-Z]{2,4}(?:-[A-Z0-9]+)*?-[A-Z]?\d+) \|/gm)) ids.add(m[1]);
    return ids;
}

/** Cited identifiers that the committed register does not contain. */
function danglingCitations() {
    const registered = parseRegister(TARGETS[0]);
    if (!registered) return ['VV-001 carries no generated register'];
    const out = [];
    for (const [id, files] of citations()) {
        if (!registered.has(id)) {
            out.push(`${id} (cited by ${[...files].map(f => path.basename(f)).join(', ')})`);
        }
    }
    return out;
}

// ---------------------------------------------------------------- apply

const TARGETS = [
    'QMS/DHF/VV-001-VerificationValidationProtocol.md',
    'QMS/DHF/TP-001-TestPlan.md'
];

function apply({ write }) {
    const index = extract();
    const block = renderRegister(index);
    const problems = [];

    for (const file of TARGETS) {
        const src = read(file);
        const from = src.indexOf(START);
        const to = src.indexOf(END);
        if (from === -1 || to === -1) {
            problems.push(`${file}: no generated-register markers`);
            continue;
        }
        const current = src.slice(from, to + END.length);
        if (current !== block) {
            problems.push(`${file}: register is stale`);
            if (write) {
                fs.writeFileSync(path.join(ROOT, file),
                    src.slice(0, from) + block + src.slice(to + END.length), 'utf-8');
            }
        }
    }

    // Every identifier the traceability documents cite must exist.
    const known = new Set(index.entries.map(e => e.id));
    const dangling = [];
    for (const [id, files] of citations()) {
        if (!known.has(id)) dangling.push(`${id} (cited by ${[...files].map(f => path.basename(f)).join(', ')})`);
    }
    const dups = index.entries.filter(e => e.duplicates.length);

    return { problems, dangling, dups, index };
}

// ---------------------------------------------------------------- main

if (require.main === module) {
    const args = process.argv.slice(2);
    const write = args.includes('--write');
    const check = args.includes('--check');
    const { problems, dangling, dups, index } = apply({ write });

    if (!check) {
        console.log(`${index.entries.length} verification cases, run as ${index.instances} tests; ` +
            `${index.unidentified} carry no identifier.`);
    }
    if (write) {
        console.log(problems.length ? 'Regenerated:' : 'Registers already current.');
        problems.forEach(p => console.log('  ' + p));
    } else if (problems.length) {
        console.log('STALE registers — run with --write:');
        problems.forEach(p => console.log('  ' + p));
    }
    if (dups.length) {
        console.log(`\n${dups.length} DUPLICATE identifier(s):`);
        dups.forEach(d => console.log(`  ${d.id} in ${d.file} and ${d.duplicates.join(', ')}`));
    }
    if (dangling.length) {
        console.log(`\n${dangling.length} identifier(s) cited but not implemented:`);
        dangling.slice(0, 40).forEach(d => console.log('  ' + d));
        if (dangling.length > 40) console.log(`  … and ${dangling.length - 40} more`);
    }
    if (check && (problems.length || dangling.length || dups.length)) process.exit(1);
}

module.exports = { extract, citations, apply, renderRegister, parseRegister, danglingCitations, TARGETS, START, END };
