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

function getDefaultBranch() {
    try {
        const ref = spawnSync('git', ['symbolic-ref', 'refs/remotes/origin/HEAD'], {
            cwd: repoRoot, encoding: 'utf8'
        });
        if (ref.status === 0) {
            const match = ref.stdout.trim().match(/refs\/remotes\/origin\/(.+)/);
            if (match) return match[1];
        }
    } catch (e) { /* ignore */ }
    for (const candidate of ['main', 'master']) {
        const check = spawnSync('git', ['rev-parse', '--verify', candidate], {
            cwd: repoRoot, encoding: 'utf8'
        });
        if (check.status === 0) return candidate;
    }
    return 'main';
}

function getChangedFiles() {
    const base = getDefaultBranch();
    const sets = [];
    // Uncommitted (staged + unstaged)
    const uncommitted = spawnSync('git', ['diff', 'HEAD', '--name-only'], {
        cwd: repoRoot, encoding: 'utf8'
    });
    if (uncommitted.status === 0) sets.push(uncommitted.stdout);
    // Branch diff vs base
    const branch = spawnSync('git', ['diff', `${base}..HEAD`, '--name-only'], {
        cwd: repoRoot, encoding: 'utf8'
    });
    if (branch.status === 0) sets.push(branch.stdout);
    // Untracked
    const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], {
        cwd: repoRoot, encoding: 'utf8'
    });
    if (untracked.status === 0) sets.push(untracked.stdout);
    const all = sets.join('\n').split('\n').map(l => l.trim()).filter(Boolean);
    return [...new Set(all)].sort();
}

function getCommitMessages() {
    const base = getDefaultBranch();
    const log = spawnSync('git', ['log', `${base}..HEAD`, '--format=%s'], {
        cwd: repoRoot, encoding: 'utf8'
    });
    if (log.status !== 0) return [];
    return log.stdout.split('\n').map(l => l.trim()).filter(Boolean);
}

function categorizeFiles(files) {
    const categories = {
        'UI': [],
        'Logic': [],
        'Tests': [],
        'QMS Docs': [],
        'Project Docs': [],
        'Build/Config': []
    };
    const rules = [
        [/^web\/.*\.html$/, 'UI'],
        [/^web\/images\//, 'UI'],
        [/^web\/styles\//, 'UI'],
        [/^web\/scripts\/.*\.js$/, 'Logic'],
        [/^serve\.js$/, 'Logic'],
        [/^tests\//, 'Tests'],
        [/^QMS\//, 'QMS Docs'],
        [/^(README|CONTRIBUTING|LICENSE|NOTICE|CHANGELOG|instructions)/, 'Project Docs'],
        [/^package\.json$/, 'Build/Config'],
        [/^scripts\//, 'Build/Config']
    ];
    for (const f of files) {
        let matched = false;
        for (const [re, cat] of rules) {
            if (re.test(f)) {
                categories[cat].push(f);
                matched = true;
                break;
            }
        }
        if (!matched) categories['Build/Config'].push(f);
    }
    return categories;
}

function scanRequirementIds(files) {
    const base = getDefaultBranch();
    const ids = new Set();
    const patterns = ['tests/', 'QMS/'];
    const relevantFiles = files.filter(f => patterns.some(p => f.startsWith(p)));
    for (const f of relevantFiles) {
        const diff = spawnSync('git', ['diff', `${base}..HEAD`, '--', f], {
            cwd: repoRoot, encoding: 'utf8'
        });
        if (diff.status === 0) {
            const added = diff.stdout.split('\n').filter(l => l.startsWith('+'));
            for (const line of added) {
                const matches = line.matchAll(/(SYS-\d+|URS-\d+|HA-\d+)/g);
                for (const m of matches) ids.add(m[1]);
            }
        }
    }
    return [...ids].sort();
}

function generateChangeSummary(commitMessages, categories) {
    const parts = [];
    if (commitMessages.length > 0) {
        parts.push(commitMessages.map(m => `- ${m}`).join('\n'));
    }
    const active = Object.entries(categories)
        .filter(([, files]) => files.length > 0)
        .map(([cat]) => cat);
    if (active.length > 0) {
        parts.push(`\nAffected areas: ${active.join(', ')}.`);
    }
    return parts.join('\n') || 'No commit history available on this branch.';
}

function generateDcrFromGit(dcrFilePath) {
    const templatePath = path.join(dcrRoot, 'DCR-TEMPLATE.md');
    if (!fs.existsSync(templatePath)) {
        console.error(`DCR template not found: ${templatePath}`);
        return false;
    }
    const template = fs.readFileSync(templatePath, 'utf8');

    const basename = path.basename(dcrFilePath, '.md');
    const idMatch = basename.match(/^(DCR-\d+)/);
    const dcrId = idMatch ? idMatch[1] : basename;
    const slugPart = basename.replace(/^DCR-\d+-?/, '');
    const title = slugPart
        ? slugPart.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : dcrId;

    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const changedFiles = getChangedFiles();
    const commits = getCommitMessages();
    const categories = categorizeFiles(changedFiles);
    const reqIds = scanRequirementIds(changedFiles);

    const changeSummary = generateChangeSummary(commits, categories);

    // Scope lines
    const scopeLines = Object.entries(categories).map(([cat, files]) => {
        if (files.length === 0) return `- ${cat}: (none)`;
        return `- ${cat}: ${files.join(', ')}`;
    }).join('\n');

    // Requirements
    const ursIds = reqIds.filter(id => id.startsWith('URS-'));
    const sysIds = reqIds.filter(id => id.startsWith('SYS-'));
    const ursText = ursIds.length > 0 ? ursIds.map(id => `- ${id}`).join('\n') : '- (none detected — review manually)';
    const sysText = sysIds.length > 0 ? sysIds.map(id => `- ${id}`).join('\n') : '- (none detected — review manually)';

    // Design/Doc updates — only top-level QMS DHF documents, not test evidence artifacts
    const qmsDocFiles = categories['QMS Docs'].filter(f =>
        !f.includes('TestEvidence/') && f.endsWith('.md')
    );
    const docUpdates = qmsDocFiles.length > 0
        ? qmsDocFiles.map(f => `- ${path.basename(f, '.md')}`).join('\n')
        : '- (none detected — review manually)';

    let content = template;

    // Title line
    content = content.replace(
        /^# DCR-XXX: Design Change Record$/m,
        `# ${dcrId}: Design Change Record — ${title}`
    );

    // Document ID in table
    content = content.replace(
        /\| \*\*Document ID\*\* \| DCR-XXX \|/,
        `| **Document ID** | ${dcrId} |`
    );

    // Date
    content = content.replace(
        /\| \*\*Date Created\*\* \| YYYY-MM-DD \|/,
        `| **Date Created** | ${dateStr} |`
    );

    // Change Summary
    content = content.replace(
        /Brief, plain-language summary of the change\./,
        changeSummary
    );

    // Scope — replace the impacted components block
    content = content.replace(
        /\*\*Impacted Components\*\*\n- UI:\n- Logic:\n- Tests:\n- QMS Docs:/,
        `**Impacted Components**\n${scopeLines}`
    );

    // Requirements — URS
    content = content.replace(
        /\*\*URS Impacted\*\*:\n- URS-XXX/,
        `**URS Impacted**:\n${ursText}`
    );

    // Requirements — SRS
    content = content.replace(
        /\*\*SRS Impacted\*\*:\n- SYS-XXX/,
        `**SRS Impacted**:\n${sysText}`
    );

    // Design/Documentation updates
    content = content.replace(
        /List updated documents or design notes\./,
        docUpdates
    );

    // Risk Assessment
    content = content.replace(
        /State whether RA-001 requires update and why\./,
        'No new hazards identified. Review RA-001 if scope changes.'
    );

    // Test Plan Trace
    content = content.replace(
        /- TP-XXX/,
        '- TP-001'
    );

    ensureDir(path.dirname(dcrFilePath));
    fs.writeFileSync(dcrFilePath, content, 'utf8');
    console.log(`Created DCR: ${path.relative(repoRoot, dcrFilePath)}`);
    return true;
}

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
    if (resolvedDcr && !fs.existsSync(resolvedDcr) && cliArgs.dcr) {
        generateDcrFromGit(resolvedDcr);
    }
    updateDcrEvidence(resolvedDcr, relativeEvidencePath);
}
if (cliArgs.updateTr) {
    appendTrRunLog(relativeEvidencePath, status, result.status === null ? 'null' : result.status, commandText);
}

process.stdout.write(output);
process.exit(result.status === null ? 1 : result.status);
