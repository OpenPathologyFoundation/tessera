#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const evidenceRoot = path.join(repoRoot, 'QMS', 'DHF', 'TestEvidence');
const dcrRoot = path.join(repoRoot, 'QMS', 'DHF', 'DCR');
const trPath = path.join(repoRoot, 'QMS', 'DHF', 'TR-001-TestResults.md');

function parseArgs(argv) {
    const parsed = {
        labelParts: [],
        dcr: null,
        updateTr: true,
        updateDcr: true
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--dcr' && argv[i + 1]) {
            parsed.dcr = argv[i + 1];
            i++;
            continue;
        }
        if (arg.startsWith('--dcr=')) {
            parsed.dcr = arg.split('=')[1] || null;
            continue;
        }
        if (arg === '--no-tr') {
            parsed.updateTr = false;
            continue;
        }
        if (arg === '--no-dcr') {
            parsed.updateDcr = false;
            continue;
        }
        parsed.labelParts.push(arg);
    }
    return parsed;
}

function safeLabel(label) {
    return label.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function formatStamp(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}_${hh}${mi}${ss}`;
}

const now = new Date();
const stamp = formatStamp(now);
const cliArgs = parseArgs(process.argv.slice(2));
const labelArg = safeLabel(cliArgs.labelParts.join('-'));
const runDirName = labelArg ? `${stamp}_${labelArg}` : `${stamp}_run`;
const runDir = path.join(evidenceRoot, runDirName);

ensureDir(runDir);

const command = process.env.QMS_TEST_CMD || 'npm';
const testArgs = process.env.QMS_TEST_ARGS
    ? process.env.QMS_TEST_ARGS.split(' ').filter(Boolean)
    : ['test'];

const commandText = `${command} ${testArgs.join(' ')}`.trim();

const envLines = [
    `date_utc=${now.toISOString()}`,
    `node=${process.version}`,
    `platform=${process.platform}`,
    `arch=${process.arch}`,
    `cwd=${repoRoot}`
];

try {
    const npmVersion = spawnSync('npm', ['--version'], { encoding: 'utf8' });
    if (npmVersion.status === 0) {
        envLines.push(`npm=${npmVersion.stdout.trim()}`);
    }
} catch (e) {
    // Ignore npm version lookup failures
}

fs.writeFileSync(path.join(runDir, 'command.txt'), commandText + '\n', 'utf8');
fs.writeFileSync(path.join(runDir, 'environment.txt'), envLines.join('\n') + '\n', 'utf8');

const result = spawnSync(command, testArgs, {
    cwd: repoRoot,
    encoding: 'utf8'
});

const output = [
    result.stdout || '',
    result.stderr || ''
].join('');

fs.writeFileSync(path.join(runDir, 'test-output-raw.txt'), output, 'utf8');

const status = result.status === 0 ? 'PASS' : 'FAIL';
const summaryLines = [
    '# Test Run Summary',
    '',
    `- Date (UTC): ${now.toISOString()}`,
    `- Command: \`${commandText}\``,
    `- Exit Code: ${result.status === null ? 'null' : result.status}`,
    `- Result: **${status}**`,
    `- Evidence Folder: \`${path.relative(repoRoot, runDir)}\``,
    '',
    '## Files',
    `- \`command.txt\``,
    `- \`environment.txt\``,
    `- \`test-output-raw.txt\``
];

fs.writeFileSync(path.join(runDir, 'test-summary.md'), summaryLines.join('\n') + '\n', 'utf8');

function normalizeDcrPath(dcrArg) {
    if (!dcrArg) return null;
    if (dcrArg.endsWith('.md')) {
        return path.isAbsolute(dcrArg) ? dcrArg : path.join(dcrRoot, dcrArg);
    }
    const prefixed = dcrArg.startsWith('DCR-') ? dcrArg : `DCR-${dcrArg}`;
    return path.join(dcrRoot, `${prefixed}.md`);
}

function findSingleDraftDcr() {
    if (!fs.existsSync(dcrRoot)) return null;
    const files = fs.readdirSync(dcrRoot).filter(name => {
        return name.endsWith('.md') && name !== 'DCR-TEMPLATE.md';
    });
    const draftFiles = files.filter(name => {
        const content = fs.readFileSync(path.join(dcrRoot, name), 'utf8');
        return /Status\s*\|\s*Draft/i.test(content);
    });
    if (draftFiles.length === 1) {
        return path.join(dcrRoot, draftFiles[0]);
    }
    return null;
}

function updateDcrEvidence(dcrFile, relativeEvidencePath) {
    if (!dcrFile || !fs.existsSync(dcrFile)) return false;
    const content = fs.readFileSync(dcrFile, 'utf8');
    const evidenceLine = `- ${relativeEvidencePath}/`;
    let updated = content;
    const execBlockPattern = /(\*\*Execution Evidence\*\*:\s*\n)([\s\S]*?)(\n---|\n## |\n\*\*|\s*$)/;
    if (execBlockPattern.test(content)) {
        updated = content.replace(execBlockPattern, (match, header, body, tail) => {
            const bodyLines = body.split('\n').filter(line => line.trim().length > 0);
            const filtered = bodyLines.filter(line => !line.trim().startsWith('- QMS/DHF/TestEvidence/'));
            filtered.unshift(evidenceLine);
            return `${header}${filtered.join('\n')}\n${tail}`;
        });
    } else if (content.includes('Execution Evidence')) {
        updated = content.replace(/(\*\*Execution Evidence\*\*:[^\n]*\n)/, `$1${evidenceLine}\n`);
    } else {
        updated += `\n\n**Execution Evidence**:\n${evidenceLine}\n`;
    }
    if (updated !== content) {
        fs.writeFileSync(dcrFile, updated, 'utf8');
        return true;
    }
    return false;
}

function appendTrRunLog(relativeEvidencePath, statusText, exitCode, cmdText) {
    if (!fs.existsSync(trPath)) return false;
    const content = fs.readFileSync(trPath, 'utf8');
    const logHeader = '## 8. Automated Run Log';
    const entry = [
        '',
        `- Date (UTC): ${now.toISOString()}`,
        `- Command: \`${cmdText}\``,
        `- Exit Code: ${exitCode}`,
        `- Result: **${statusText}**`,
        `- Evidence: \`${relativeEvidencePath}/\``
    ].join('\n');
    let updated = content;
    if (content.includes(logHeader)) {
        updated = content.replace(logHeader, `${logHeader}${entry}\n`);
    } else {
        updated = `${content.trim()}\n\n${logHeader}${entry}\n`;
    }
    if (updated !== content) {
        fs.writeFileSync(trPath, updated, 'utf8');
        return true;
    }
    return false;
}

const relativeEvidencePath = path.relative(repoRoot, runDir);
if (cliArgs.updateDcr) {
    const resolvedDcr = normalizeDcrPath(cliArgs.dcr) || findSingleDraftDcr();
    updateDcrEvidence(resolvedDcr, relativeEvidencePath);
}
if (cliArgs.updateTr) {
    appendTrRunLog(relativeEvidencePath, status, result.status === null ? 'null' : result.status, commandText);
}

process.stdout.write(output);
process.exit(result.status === null ? 1 : result.status);
