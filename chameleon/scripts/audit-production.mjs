import { spawnSync } from 'node:child_process';

const allowedAdvisories = new Set(['https://github.com/advisories/GHSA-qwww-vcr4-c8h2']);
const allowedPackages = new Set(['react-router', 'react-router-dom']);
const npmCli = process.env.npm_execpath;

if (!npmCli) {
  process.stderr.write('Run this audit through `npm run audit:production`.\n');
  process.exit(1);
}

const result = spawnSync(process.execPath, [npmCli, 'audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
  shell: false,
});

if (!result.stdout) {
  process.stderr.write(
    result.error?.message || result.stderr || 'npm audit produced no JSON output.\n',
  );
  process.exit(result.status || 1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  process.stderr.write('npm audit returned invalid JSON.\n');
  process.stderr.write(result.stdout);
  process.exit(1);
}

if (report.error || !report.metadata?.vulnerabilities) {
  process.stderr.write('npm audit failed before producing a vulnerability report.\n');
  process.stderr.write(result.stdout);
  process.exit(1);
}

const vulnerabilities = Object.entries(report.vulnerabilities || {});
if (vulnerabilities.length === 0) {
  if (result.status !== 0) {
    process.stderr.write('npm audit exited unsuccessfully without vulnerability findings.\n');
    process.stderr.write(result.stdout);
    process.exit(1);
  }
  console.log('Production dependency audit passed with no known vulnerabilities.');
  process.exit(0);
}

const packageNames = new Set(vulnerabilities.map(([name]) => name));
const advisoryUrls = new Set();
let hasUnresolvedReference = false;

for (const [, vulnerability] of vulnerabilities) {
  for (const finding of vulnerability.via || []) {
    if (typeof finding === 'string') {
      if (!packageNames.has(finding)) hasUnresolvedReference = true;
    } else if (finding?.url) {
      advisoryUrls.add(finding.url);
    }
  }
}

const unexpectedPackages = [...packageNames].filter((name) => !allowedPackages.has(name));
const unexpectedAdvisories = [...advisoryUrls].filter((url) => !allowedAdvisories.has(url));
const criticalCount = report.metadata?.vulnerabilities?.critical || 0;

if (
  hasUnresolvedReference ||
  unexpectedPackages.length > 0 ||
  unexpectedAdvisories.length > 0 ||
  criticalCount > 0
) {
  process.stderr.write('Production dependency audit found an unreviewed vulnerability.\n');
  process.stderr.write(result.stdout);
  process.exit(1);
}

console.log(
  'Production dependency audit passed with one reviewed exception: ' +
    'GHSA-qwww-vcr4-c8h2 affects React Router RSC action handling; ' +
    'PIIcasso uses BrowserRouter SPA mode only.',
);
