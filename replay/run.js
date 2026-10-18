#!/usr/bin/env node
/**
 * Replay — re-introduce every logged drift incident and see whether the build
 * still goes red.
 *
 * `QMS/DHF/DRIFT-LOG.md` names, for each incident, the check that now prevents
 * it. That column was written by hand, once, when the guard was built. This
 * runner turns it into a measurement: for each row it applies two patches to a
 * fresh worktree of a fixed commit — the row's own contradiction, and a
 * different contradiction of the same class — runs the build, and records which
 * checks fired. See `replay/README.md` for the protocol and the outcome table.
 *
 *     node replay/run.js                   full run at HEAD, clean tree required
 *     node replay/run.js --ref v2.25.0     at a tag
 *     node replay/run.js --only 17,18      a subset of incidents
 *     node replay/run.js --kind class      instance | class
 *     node replay/run.js --dry-run         apply and revert; run nothing
 *     node replay/run.js --provisional     allow a dirty tree (result so marked)
 *     node replay/run.js --keep            leave the worktree in place
 *
 * No dependency beyond Node and git. The worktree lives in the OS temp dir and
 * borrows this checkout's node_modules by symlink.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const HERE = __dirname;
const PATCHES = path.join(HERE, 'patches');
const RESULTS = path.join(HERE, 'results.json');
const LOGS = path.join(HERE, 'logs');
const MANIFEST = path.join(HERE, 'incidents.json');

// A verification identifier as the runners print it: QC-016, VV-SYS-220,
// TC-B140, UD-098, SC-061. A describe block titled after a DOCUMENT —
// "SOP-001 …", "SAD-001 …" — prints the same way when it fails, so the series
// filter from qms-verification-index.js is applied: a verification identifier
// has a series segment, a document number does not.
const ID = /^([A-Z]{2,4}(?:-[A-Z0-9]+)*?-[A-Z]?\d+)\b/;
const SERIES = /^(VV-[A-Z0-9]+|TC-B|UD|QC|SC)$/;
function verificationId(text) {
    const m = ID.exec(text);
    if (!m) return null;
    // Strip the digits only: TC-B140 fuses its letter to the digits and the
    // letter is part of the series name (qms-verification-index.js does the same).
    const prefix = m[1].replace(/-?\d+$/, '');
    return SERIES.test(prefix) ? m[1] : null;
}

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
    const a = { ref: 'HEAD', only: null, kind: null, dryRun: false, provisional: false,
        keep: false, out: RESULTS };
    for (let i = 0; i < argv.length; i++) {
        const x = argv[i];
        if (x === '--ref') a.ref = argv[++i];
        else if (x.startsWith('--ref=')) a.ref = x.slice(6);
        else if (x === '--only') a.only = argv[++i].split(',').map(Number);
        else if (x.startsWith('--only=')) a.only = x.slice(7).split(',').map(Number);
        else if (x === '--kind') a.kind = argv[++i];
        else if (x.startsWith('--kind=')) a.kind = x.slice(7);
        else if (x === '--dry-run') a.dryRun = true;
        else if (x === '--provisional') a.provisional = true;
        else if (x === '--keep') a.keep = true;
        else if (x === '--out') a.out = path.resolve(argv[++i]);
        else { console.error(`unknown argument ${x}`); process.exit(2); }
    }
    return a;
}

// ---------------------------------------------------------------- git

function git(args, cwd = ROOT) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
    return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

function identity(ref) {
    const commit = git(['rev-parse', '--verify', `${ref}^{commit}`]);
    if (!commit.ok) throw new Error(`cannot resolve ${ref}: ${commit.err}`);
    const tag = git(['describe', '--exact-match', '--tags', commit.out]);
    const dirty = git(['status', '--porcelain']).out;
    return { commit: commit.out, tag: tag.ok ? tag.out : null, treeClean: dirty === '', dirty };
}

// ---------------------------------------------------------------- patches

function loadManifest() {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

function loadPatches(filter) {
    if (!fs.existsSync(PATCHES)) return [];
    const out = [];
    for (const name of fs.readdirSync(PATCHES).sort()) {
        const m = /^(\d+)-(instance|class)\.json$/.exec(name);
        if (!m) continue;
        const p = JSON.parse(fs.readFileSync(path.join(PATCHES, name), 'utf8'));
        p._file = `replay/patches/${name}`;
        p.incident = Number(m[1]);
        p.kind = m[2];
        if (filter.only && !filter.only.includes(p.incident)) continue;
        if (filter.kind && p.kind !== filter.kind) continue;
        out.push(p);
    }
    return out;
}

/**
 * Apply one patch to the worktree. Returns {ok, touched:[{file, lines}], why}.
 *
 * A `find` that does not occur exactly once is a patch that no longer applies
 * at R — reported, never guessed around.
 */
function applyPatch(wt, patch) {
    const touched = [];
    if (patch.mode === 'none') return { ok: false, why: `mode none: ${patch.reason || 'no reason given'}`, touched };
    if (patch.mode === 'revert') {
        const r = git(['revert', '--no-commit', '--no-edit', patch.commit], wt);
        if (!r.ok) return { ok: false, why: `revert of ${patch.commit} did not apply cleanly: ${r.err.split('\n')[0]}`, touched };
        const files = git(['diff', '--cached', '--numstat'], wt).out.split('\n').filter(Boolean);
        files.forEach(l => { const [add, del, file] = l.split('\t'); touched.push({ file, lines: Number(add) + Number(del) }); });
        git(['reset', '-q'], wt);
        return { ok: true, touched };
    }
    for (const e of patch.edits || []) {
        const full = path.join(wt, e.file);
        if (e.create !== undefined) {
            fs.mkdirSync(path.dirname(full), { recursive: true });
            fs.writeFileSync(full, e.create, 'utf8');
            touched.push({ file: e.file, lines: e.create.split('\n').length, op: 'create' });
            continue;
        }
        if (!fs.existsSync(full)) return { ok: false, why: `${e.file} does not exist at R`, touched };
        if (e.delete) {
            fs.unlinkSync(full);
            touched.push({ file: e.file, lines: 0, op: 'delete' });
            continue;
        }
        const before = fs.readFileSync(full, 'utf8');
        if (e.append !== undefined) {
            fs.writeFileSync(full, before + e.append, 'utf8');
            touched.push({ file: e.file, lines: e.append.split('\n').length, op: 'append' });
            continue;
        }
        if (typeof e.find !== 'string' || typeof e.replace !== 'string') {
            return { ok: false, why: `${e.file}: an edit needs find and replace`, touched };
        }
        const n = before.split(e.find).length - 1;
        if (n === 0) return { ok: false, why: `${e.file}: find text not present at R — ${JSON.stringify(e.find.slice(0, 60))}`, touched };
        if (n > 1 && !e.all) return { ok: false, why: `${e.file}: find text occurs ${n} times; add "all": true or narrow it`, touched };
        const after = e.all ? before.split(e.find).join(e.replace) : before.replace(e.find, () => e.replace);
        if (after === before) return { ok: false, why: `${e.file}: edit changes nothing`, touched };
        fs.writeFileSync(full, after, 'utf8');
        touched.push({ file: e.file, lines: Math.max(e.find.split('\n').length, e.replace.split('\n').length) * n, op: 'edit' });
    }
    if (!touched.length) return { ok: false, why: 'patch carries no edits', touched };
    return { ok: true, touched };
}

function resetWorktree(wt) {
    git(['checkout', '-q', '--', '.'], wt);
    git(['clean', '-fdq', '-e', 'node_modules'], wt);
}

// ---------------------------------------------------------------- build

/** Which checks a patch obliges, beyond `npm test`. */
function registerCheckNeeded(touched) {
    return touched.some(t => /^(tests|tests-e2e)\//.test(t.file) ||
        /^QMS\/DHF\/(VV-001|TP-001)/.test(t.file));
}

function failingIdsFromNode(out) {
    const ids = new Set();
    for (const line of out.split('\n')) {
        const m = /^\s*[✖✗]\s+(.+?)(?:\s+\([\d.]+m?s\))?\s*$/.exec(line);
        if (!m) continue;
        const id = verificationId(m[1].trim());
        if (id) ids.add(id);
    }
    return [...ids];
}

function failingIdsFromPlaywright(out) {
    const ids = new Set();
    for (const line of out.split('\n')) {
        if (!/^\s*[✘✗×]\s+\d+\s+\[/.test(line) && !/^\s+\d+\)\s+\[/.test(line)) continue;
        for (const part of line.split('›')) {
            const id = verificationId(part.trim());
            if (id) ids.add(id);
        }
    }
    return [...ids];
}

function runBuild(wt, patch, touched, logFile) {
    const log = [];
    const checks = [];
    let red = false;
    const failing = new Set();

    const node = spawnSync('npm', ['test'], { cwd: wt, encoding: 'utf8', env: Object.assign({}, process.env, { CI: '1' }) });
    const nodeOut = (node.stdout || '') + (node.stderr || '');
    log.push('$ npm test', nodeOut);
    checks.push({ cmd: 'npm test', exit: node.status });
    if (node.status !== 0) {
        red = true;
        failingIdsFromNode(nodeOut).forEach(i => failing.add(i));
        if (!/^ℹ fail \d+/m.test(nodeOut) || /^ℹ fail 0$/m.test(nodeOut)) failing.add('BUILD-ERROR');
    }

    if (registerCheckNeeded(touched)) {
        const vi = spawnSync('node', ['scripts/qms-verification-index.js', '--check'], { cwd: wt, encoding: 'utf8' });
        const viOut = (vi.stdout || '') + (vi.stderr || '');
        log.push('$ node scripts/qms-verification-index.js --check', viOut);
        checks.push({ cmd: 'node scripts/qms-verification-index.js --check', exit: vi.status });
        if (vi.status !== 0) { red = true; failing.add('VINDEX-CHECK'); }
    }

    if (Array.isArray(patch.extra_cmd) && patch.extra_cmd.length) {
        const [cmd, ...args] = patch.extra_cmd;
        const ex = spawnSync(cmd, args, { cwd: wt, encoding: 'utf8', env: Object.assign({}, process.env, { CI: '1' }) });
        const exOut = (ex.stdout || '') + (ex.stderr || '');
        log.push('$ ' + patch.extra_cmd.join(' '), exOut);
        checks.push({ cmd: patch.extra_cmd.join(' '), exit: ex.status });
        if (ex.status !== 0) {
            red = true;
            failingIdsFromPlaywright(exOut).forEach(i => failing.add(i));
            failingIdsFromNode(exOut).forEach(i => failing.add(i));
        }
    }

    fs.writeFileSync(logFile, log.join('\n'), 'utf8');
    return { red, failing: [...failing].sort(), checks };
}

// ---------------------------------------------------------------- classify

function classify(red, failing, expected) {
    if (!red) return 'escaped';
    if (!expected.length) return 'caught_unattributed';
    return failing.some(f => expected.includes(f)) ? 'caught' : 'caught_incidentally';
}

// ---------------------------------------------------------------- main

function main() {
    const args = parseArgs(process.argv.slice(2));
    const manifest = loadManifest();
    const byId = new Map(manifest.incidents.map(i => [i.id, i]));
    const id = identity(args.ref);

    if (!id.treeClean && !args.provisional && !args.dryRun) {
        console.error('The working tree is not clean. A replay measures a commit; this tree is not one.\n' +
            'Commit first, or pass --provisional to run anyway with the result so marked.\n' + id.dirty);
        process.exit(2);
    }

    const patches = loadPatches(args);
    if (!patches.length) { console.error('no patches selected'); process.exit(2); }

    const started = new Date();
    const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'wbcds-replay-'));
    fs.rmSync(wt, { recursive: true, force: true });
    const add = git(['worktree', 'add', '--detach', '-q', wt, id.commit]);
    if (!add.ok) { console.error(`worktree failed: ${add.err}`); process.exit(2); }
    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(wt, 'node_modules'), 'dir');
    fs.mkdirSync(LOGS, { recursive: true });

    const cleanup = () => {
        if (args.keep) { console.log(`worktree kept at ${wt}`); return; }
        git(['worktree', 'remove', '--force', wt]);
        git(['worktree', 'prune']);
    };
    process.on('SIGINT', () => { cleanup(); process.exit(130); });

    console.log(`Replay at ${id.commit.slice(0, 7)}${id.tag ? ` (${id.tag})` : ''}` +
        `${id.treeClean ? '' : ' — PROVISIONAL, dirty tree'}; ${patches.length} patch(es)${args.dryRun ? ', dry run' : ''}`);

    const controls = { negative: null, positive: null };
    if (!args.dryRun) {
        // Negative control: R unmodified must be green.
        let r = runBuild(wt, {}, [], path.join(LOGS, 'control-negative.txt'));
        controls.negative = { expected: 'green', got: r.red ? 'red' : 'green', failing: r.failing };
        console.log(`  control negative: ${controls.negative.got} (expected green)`);
        // Positive control: a hand-edited version string must be red, and the
        // version-coherence gate must be what names it.
        const pos = { mode: 'edit', edits: [{ file: 'package.json', find: `"version": "`, replace: `"version": "0.0.` }] };
        const ap = applyPatch(wt, pos);
        r = ap.ok ? runBuild(wt, pos, ap.touched, path.join(LOGS, 'control-positive.txt')) : { red: false, failing: [] };
        resetWorktree(wt);
        controls.positive = { expected: 'red', got: r.red ? 'red' : 'green', failing: r.failing, applied: ap.ok };
        console.log(`  control positive: ${controls.positive.got} (expected red; fired ${r.failing.join(', ') || 'nothing'})`);
        if (controls.negative.got !== 'green' || controls.positive.got !== 'red' || !r.failing.includes('QC-016')) {
            console.error('A control failed. Nothing downstream means anything; stopping.');
            cleanup();
            process.exit(3);
        }
    }

    const runs = [];
    for (const p of patches) {
        const inc = byId.get(p.incident);
        if (!inc) { console.error(`  ${p._file}: incident ${p.incident} is not in incidents.json`); continue; }
        const expected = [...(inc.guards || []), ...(inc.extra_expected || []), ...(p.expected || [])];
        const row = { incident: p.incident, kind: p.kind, class: inc.class, mode: p.mode,
            builder: p.builder || null, file: p._file, description: p.description || '',
            expected, guarded_in_log: inc.guarded_in_log };

        if (p.mode === 'none') {
            row.status = 'not_replayed';
            row.reason = p.reason || null;
            runs.push(row);
            console.log(`  ${String(p.incident).padStart(2)} ${p.kind.padEnd(8)} not_replayed — ${row.reason}`);
            continue;
        }
        const ap = applyPatch(wt, p);
        if (!ap.ok) {
            resetWorktree(wt);
            row.status = 'unapplied';
            row.reason = ap.why;
            runs.push(row);
            console.log(`  ${String(p.incident).padStart(2)} ${p.kind.padEnd(8)} UNAPPLIED — ${ap.why}`);
            continue;
        }
        row.touched = ap.touched;
        if (args.dryRun) {
            resetWorktree(wt);
            row.status = 'applies';
            runs.push(row);
            console.log(`  ${String(p.incident).padStart(2)} ${p.kind.padEnd(8)} applies (${ap.touched.map(t => t.file).join(', ')})`);
            continue;
        }
        const logFile = path.join(LOGS, `${String(p.incident).padStart(2, '0')}-${p.kind}.txt`);
        const r = runBuild(wt, p, ap.touched, logFile);
        resetWorktree(wt);
        row.build = r.red ? 'red' : 'green';
        row.failing = r.failing;
        row.checks = r.checks;
        row.status = classify(r.red, r.failing, expected);
        row.matched = r.failing.filter(f => expected.includes(f));
        runs.push(row);
        console.log(`  ${String(p.incident).padStart(2)} ${p.kind.padEnd(8)} ${row.status.padEnd(20)} ${r.failing.join(', ')}`);
    }
    cleanup();

    // ---- summary
    const count = (kind, status) => runs.filter(r => r.kind === kind && r.status === status).length;
    const n = kind => runs.filter(r => r.kind === kind).length;
    const summary = {};
    for (const kind of ['instance', 'class']) {
        if (!n(kind)) continue;
        summary[kind] = { n: n(kind), caught: count(kind, 'caught'), caught_incidentally: count(kind, 'caught_incidentally'),
            caught_unattributed: count(kind, 'caught_unattributed'), escaped: count(kind, 'escaped'),
            unapplied: count(kind, 'unapplied'), not_replayed: count(kind, 'not_replayed'),
            escaped_ids: runs.filter(r => r.kind === kind && r.status === 'escaped').map(r => r.incident),
            unattributed_ids: runs.filter(r => r.kind === kind && r.status === 'caught_unattributed').map(r => r.incident) };
    }
    // Per class: which checks fired, for the attribution step.
    const byClass = {};
    for (const r of runs) {
        const c = byClass[r.class] || (byClass[r.class] = { instance: {}, class: {}, fired: new Set() });
        c[r.kind][r.status] = (c[r.kind][r.status] || 0) + 1;
        (r.failing || []).forEach(f => c.fired.add(f));
    }
    for (const c of Object.values(byClass)) c.fired = [...c.fired].sort();

    // ---- regression against the committed results
    let regressions = [];
    if (fs.existsSync(args.out) && !args.dryRun) {
        try {
            const prev = JSON.parse(fs.readFileSync(args.out, 'utf8'));
            if (prev && !prev.provisional && Array.isArray(prev.runs)) {
                for (const r of runs) {
                    const was = prev.runs.find(q => q.incident === r.incident && q.kind === r.kind);
                    if (was && was.status === 'caught' && r.status === 'escaped') {
                        regressions.push(`${r.incident} ${r.kind}: was caught by ${(was.matched || []).join(', ')} at ${(prev.commit || '').slice(0, 7)}, now escaped`);
                    }
                }
            }
        } catch (e) { /* unreadable previous results: no regression check */ }
    }

    const results = {
        protocol: 'replay/README.md',
        ref: args.ref, commit: id.commit, tag: id.tag, tree_clean: id.treeClean,
        provisional: !id.treeClean, dry_run: args.dryRun,
        generated_at: started.toISOString(),
        duration_s: Math.round((Date.now() - started.getTime()) / 1000),
        build: 'npm test; plus node scripts/qms-verification-index.js --check when a patch touches tests/ or a register; plus the patch\'s extra_cmd',
        classification_status: manifest.classification && manifest.classification.status,
        controls, summary, by_class: byClass, regressions, runs
    };
    if (!args.dryRun) {
        fs.writeFileSync(args.out, JSON.stringify(results, null, 2) + '\n', 'utf8');
        console.log(`\nwritten ${path.relative(ROOT, args.out)}`);
    }
    for (const [kind, s] of Object.entries(summary)) {
        console.log(`${kind}: caught ${s.caught}/${s.n}, incidental ${s.caught_incidentally}, unattributed ${s.caught_unattributed}, ` +
            `escaped ${s.escaped}${s.escaped_ids.length ? ` [${s.escaped_ids.join(', ')}]` : ''}, unapplied ${s.unapplied}, not replayed ${s.not_replayed}`);
    }
    if (regressions.length) {
        console.error('\nREGRESSION — a guard that caught its incident no longer does:\n  ' + regressions.join('\n  '));
        process.exit(1);
    }
}

if (require.main === module) main();

module.exports = { applyPatch, classify, failingIdsFromNode, failingIdsFromPlaywright, loadPatches, loadManifest, registerCheckNeeded, verificationId };
