#!/usr/bin/env node
/**
 * Manuscript lint — no number in the paper may be typed.
 *
 * Every integer in the manuscript must sit inside a `qms:fact` marker written
 * by `scripts/qms-paper-facts.js`, or on the short allowlist below: years,
 * reference numbers, standard numbers, section and identifier numbers. A
 * spelled-out number whose value equals some fact is reported too, because
 * "sixteen of the first twenty-one" is two facts, not a phrase.
 *
 * This closes, for the manuscript, the class the drift log lists as not yet
 * prevented — unguarded prose counts — and it is the work list: the first run
 * against the draft lists every typed number in it.
 *
 *     node scripts/qms-manuscript-lint.js                 lint manuscript/PAPER-1-DRAFT.md against replay/facts.json
 *     node scripts/qms-manuscript-lint.js --file F        lint another file
 *
 * Exit 1 on any error. A missing manuscript is not an error: the manuscript is
 * private until the preprint, so a clean clone has nothing to lint.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const paper = require(path.join(__dirname, 'qms-paper-facts.js'));

/** Tokens that carry digits but are not measured facts. Keep this list short and literal. */
const ALLOW = [
    /^(19|20)\d{2}$/,                          // a year
    /^(19|20)\d{2}[–-](19|20)?\d{2}$/,         // a year range
    /^\[\d+(?:[,–-]\d+)*\]$/,                  // a bracketed reference number
    /^[¹²³⁴⁵⁶⁷⁸⁹⁰]+$/,                       // a superscript reference
    /^(DCR|HA|URS|SYS|QC|UD|SC|TC-B|VV-[A-Z]+)-?\d+$/,  // an identifier
    /^§\d+(\.\d+)*$/,                           // a section reference
    /^\d+(\.\d+)*\.$/,                          // a numbered list item or section number at line start
    /^62304$|^820$|^820\.30$|^H20-A2$|^H56-A$|^21$|^CFR$/, // standard numbers named in the draft
    /^Amd$|^1:2015$|^2006\/Amd$/,               // IEC 62304:2006/Amd 1:2015
    /^v\d+\.\d+$/,                              // a release label such as v2.0 or v0.1
    /\.(md|js|json|html|txt)\.?$/               // a file name
];

/** Phrases whose digits are labels or conventions, not measured facts; masked before the scan. */
const CONTEXT = [
    /\b(Table|Box|Figure|Fig\.|Section|Step|Phase|Paper)\s+\d+\b/g,   // "Table 1", "Paper 1"
    /\bper\s+100\s+(leukocytes|white|WBC)\b/g,                         // the NRBC reporting convention
    /\b(sum|summed|summing|add|adding|added|normali[sz]ed?)\s+(up\s+)?to\s+100\b/g, // percentages sum to 100
    /`[^`\n]*`/g                                                       // inline code is quoted source, not a count
];

const REFERENCE_HEADING = /^#+\s+References\s*$/m;

function lint(file, facts) {
    const src = fs.readFileSync(file, 'utf8');
    const flat = paper.flatten(facts);
    const factValues = new Set(Object.values(flat).filter(v => Number.isInteger(v)));
    const errors = [];
    const warnings = [];

    // Markers first: a marker that names no fact, or disagrees with it, is an error.
    paper.manuscriptDisagreements(facts, file).forEach(d => errors.push(`marker — ${d}`));

    // Mask marked values so the integer scan does not see them; mask the References section and code fences.
    let masked = src.replace(paper.MARKER, (w, key, how, val) => `<!-- qms:fact ${key}${how} -->${'#'.repeat(val.length)}<!-- /qms:fact -->`);
    const refAt = masked.search(REFERENCE_HEADING);
    const body = refAt >= 0 ? masked.slice(0, refAt) : masked;
    const lines = body.split('\n');
    let inFence = false;
    lines.forEach((raw0, i) => {
        if (/^```/.test(raw0.trim())) { inFence = !inFence; return; }
        if (inFence) return;
        let line = raw0;
        for (const re of CONTEXT) line = line.replace(re, m => m.replace(/\d/g, '#'));
        // Tokens: runs of non-space characters that contain a digit, trimmed of punctuation at the edges.
        for (const raw of line.split(/\s+/)) {
            if (!/\d/.test(raw)) continue;
            const tok = raw.replace(/^[("'“‘*_]+|[)"'”’*_,;:]+$/g, '');
            if (!tok || !/\d/.test(tok)) continue;
            if (/#/.test(tok)) continue;                                   // inside a marker
            if (ALLOW.some(re => re.test(tok))) continue;
            if (/^\d+(\.\d+)*\.$/.test(raw) && line.trimStart().startsWith(raw)) continue;  // list numbering
            errors.push(`line ${i + 1}: typed number "${tok}" — ${line.trim().slice(0, 80)}`);
        }
        // Spelled-out numbers that equal a fact value.
        for (const m of line.matchAll(/\b([A-Za-z]+(?:-[a-z]+)?(?: hundred(?: and [a-z-]+)?)?)\b/g)) {
            const n = paper.unword(m[1]);
            // Small numbers are prose ("two properties"); the facts a paper
            // spells out are the larger counts — sixteen, twenty-one, thirty-one.
            if (n === null || n < 5) continue;
            if (!factValues.has(n)) continue;
            if (line.includes('qms:fact') && /#/.test(line)) { /* marked line may still carry typed words elsewhere; report */ }
            warnings.push(`line ${i + 1}: "${m[1]}" equals fact value ${n} — if it is that fact, mark it (words rendering)`);
        }
    });
    return { errors, warnings, lines: lines.length };
}

module.exports = { lint, ALLOW, CONTEXT };

if (require.main === module) {
    const args = process.argv.slice(2);
    const at = args.indexOf('--file');
    const file = at >= 0 ? path.resolve(args[at + 1]) : paper.MANUSCRIPT;
    if (!fs.existsSync(file)) {
        console.log(`no manuscript at ${path.relative(ROOT, file)} — nothing to lint (the manuscript is private until the preprint)`);
        process.exit(0);
    }
    if (!fs.existsSync(paper.FACTS)) {
        console.error('replay/facts.json is absent — run `node scripts/qms-paper-facts.js --write` first');
        process.exit(1);
    }
    const facts = JSON.parse(fs.readFileSync(paper.FACTS, 'utf8'));
    const { errors, warnings } = lint(file, facts);
    const markers = paper.readManuscriptMarkers(file).length;
    console.log(`${path.relative(ROOT, file)}: ${markers} marker(s), ${errors.length} error(s), ${warnings.length} warning(s)`);
    if (errors.length) { console.log('\nErrors — every one is a number the paper types instead of reading:'); errors.forEach(e => console.log('  ' + e)); }
    if (warnings.length) { console.log('\nWarnings — spelled-out numbers that equal a measured fact:'); warnings.forEach(w => console.log('  ' + w)); }
    process.exit(errors.length ? 1 : 0);
}
