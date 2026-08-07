#!/usr/bin/env node
/**
 * Sign-off register — who still has to sign what, measured from the documents.
 *
 * The clinical review brief listed eleven documents needing a signature. There
 * were twenty-six, and one of the items it described as outstanding had since
 * been closed. A list of what someone must review is exactly the kind of thing
 * that goes stale silently, and the reviewer is the last person able to notice.
 *
 *     node scripts/qms-signoffs.js            report
 *     node scripts/qms-signoffs.js --write    regenerate the register
 *     node scripts/qms-signoffs.js --check    exit 1 if the register is stale
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DHF = path.join(ROOT, 'QMS', 'DHF');
const REGISTER = path.join(DHF, 'SIGNOFF-REGISTER.md');

const START = '<!-- BEGIN GENERATED: signoff-register -->';
const END = '<!-- END GENERATED: signoff-register -->';

/** Roles whose signature is the adopting laboratory's, not this project's. */
const LOCAL_ROLES = /Laboratory Director|Quality Manager|Medical Director/i;

function docs() {
    const out = [];
    for (const dir of [DHF, path.join(DHF, 'DCR')]) {
        if (!fs.existsSync(dir)) continue;
        for (const name of fs.readdirSync(dir).sort()) {
            if (name.endsWith('.md')) out.push(path.join(dir, name));
        }
    }
    return out;
}

/**
 * Signature rows in a document's Approval Signatures table.
 * A row counts as SIGNED when its Name column is non-empty.
 */
function signatures(file) {
    const src = fs.readFileSync(file, 'utf-8');
    const at = src.search(/^#+\s*\d*\.?\s*Approval Signatures/m);
    if (at === -1) return null;
    const rows = [];
    for (const line of src.slice(at).split('\n')) {
        const m = /^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*$/.exec(line);
        if (!m) continue;
        const role = m[1].replace(/\*\*/g, '').trim();
        if (!role || /^-+$/.test(role) || role === 'Role') continue;
        rows.push({ role, name: m[2].replace(/\*\*/g, '').trim(), note: m[4].trim() });
    }
    return rows;
}

/**
 * Documents whose blank signature rows are not outstanding work.
 *
 * A template's rows are blank by design, and a superseded document is retained
 * for design history — asking a reviewer to sign either would waste their time
 * and inflate the count they are being asked to work through.
 */
function excluded(file) {
    const name = path.basename(file);
    if (/TEMPLATE/i.test(name)) return 'template';
    const head = fs.readFileSync(file, 'utf-8').slice(0, 1500);
    if (/\*\*Status\*\*\s*\|\s*\*{0,2}SUPERSEDED/i.test(head)) return 'superseded';
    return null;
}

function collect() {
    const outstanding = new Map();   // role -> [{doc, note}]
    const signedDocs = [];
    const skipped = [];
    for (const file of docs()) {
        const why = excluded(file);
        if (why) { skipped.push({ doc: path.relative(DHF, file), why }); continue; }
        const rows = signatures(file);
        if (!rows) continue;
        const rel = path.relative(DHF, file);
        const open = rows.filter(r => !r.name && !LOCAL_ROLES.test(r.role));
        if (!open.length) { signedDocs.push(rel); continue; }
        for (const r of open) {
            if (!outstanding.has(r.role)) outstanding.set(r.role, []);
            outstanding.get(r.role).push({ doc: rel, note: r.note });
        }
    }
    return { outstanding, signedDocs, skipped };
}

function render({ outstanding, signedDocs, skipped }) {
    const lines = [START, ''];
    lines.push('> **Generated. Do not edit by hand.**  ');
    lines.push('> `node scripts/qms-signoffs.js --write` rebuilds this from the signature');
    lines.push('> tables in every document. Suite 14 fails the build if it goes stale.');
    lines.push('');

    const total = [...outstanding.values()].reduce((a, v) => a + v.length, 0);
    lines.push(`**${total} signature(s) outstanding across ${outstanding.size} role(s).** ` +
        `${signedDocs.length} document(s) are fully signed.`);
    lines.push('');

    for (const [role, items] of [...outstanding].sort()) {
        lines.push(`### ${role} — ${items.length} outstanding`);
        lines.push('');
        lines.push('| Document | Note |');
        lines.push('|----------|------|');
        for (const it of items.sort((a, b) => a.doc.localeCompare(b.doc))) {
            lines.push(`| \`${it.doc}\` | ${it.note || '—'} |`);
        }
        lines.push('');
    }
    if (skipped.length) {
        lines.push('### Not for signature');
        lines.push('');
        lines.push('| Document | Why |');
        lines.push('|----------|-----|');
        skipped.forEach(sk => lines.push(`| \`${sk.doc}\` | ${sk.why === 'template' ?
            'A blank template; its rows are empty by design' :
            'Superseded, retained for design history'} |`));
        lines.push('');
    }
    lines.push(END);
    return lines.join('\n');
}

function apply({ write }) {
    const block = render(collect());
    if (!fs.existsSync(REGISTER)) return ['SIGNOFF-REGISTER.md does not exist'];
    const src = fs.readFileSync(REGISTER, 'utf-8');
    const from = src.indexOf(START);
    const to = src.indexOf(END);
    if (from === -1 || to === -1) return ['SIGNOFF-REGISTER.md has no generated markers'];
    if (src.slice(from, to + END.length) === block) return [];
    if (write) {
        fs.writeFileSync(REGISTER, src.slice(0, from) + block + src.slice(to + END.length), 'utf-8');
    }
    return ['SIGNOFF-REGISTER.md is stale'];
}

if (require.main === module) {
    const write = process.argv.includes('--write');
    const check = process.argv.includes('--check');
    const { outstanding, signedDocs } = collect();
    if (!check) {
        console.log(`${signedDocs.length} document(s) fully signed.`);
        for (const [role, items] of [...outstanding].sort()) {
            console.log(`  ${role}: ${items.length} outstanding`);
        }
    }
    const stale = apply({ write });
    if (write) console.log(stale.length ? 'Regenerated.' : 'Already current.');
    if (check && stale.length) { console.error(stale.join('\n')); process.exit(1); }
}

module.exports = { collect, render, apply, signatures, START, END };
