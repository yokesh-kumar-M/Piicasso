/**
 * index.js — main CLI router.
 *
 * Wires commander subcommands to their handler modules. If invoked with no
 * arguments at all, drops into the interactive REPL instead of printing help,
 * matching the in-browser terminal UX.
 */
'use strict';

const { Command, Option } = require('commander');
const pkg = require('../package.json');
const { err } = require('./ui/theme');

function build() {
  const program = new Command();

  program
    .name('piicasso')
    .description('Command-line interface for the PIIcasso platform — local PII analysis + API client for AI features.')
    .version(pkg.version, '-v, --version', 'print version and exit')
    .helpOption('-h, --help', 'show help for a command');

  // ─── auth ──────────────────────────────────────────────────────────────
  program
    .command('login')
    .description('sign in to the PIIcasso backend and store a JWT pair')
    .action(() => require('./commands/login').run());

  program
    .command('logout')
    .description('clear stored credentials from ~/.piicasso/config.json')
    .action(() => {
      const store = require('./config/store');
      const { ok } = require('./ui/theme');
      store.clearAuth();
      console.log(ok('signed out.'));
    });

  program
    .command('whoami')
    .description('show the currently authenticated user')
    .action(() => require('./commands/whoami').run());

  // ─── local engine ──────────────────────────────────────────────────────
  program
    .command('analyze [text]')
    .description('detect PII entities in text (local, no network)')
    .option('-f, --file <path>', 'read input from a file instead of an argument')
    .option('--json', 'emit raw JSON instead of a table')
    .action((text, opts) => require('./commands/analyze').run({ text, ...opts }));

  program
    .command('redact [text]')
    .description('print text with PII replaced by [TYPE] placeholders')
    .option('-f, --file <path>', 'read input from a file instead of an argument')
    .option('--json', 'emit raw JSON instead of redacted text')
    .action((text, opts) => require('./commands/redact').run({ text, ...opts }));

  program
    .command('score <password>')
    .description('score password strength against an optional profile')
    .option('-p, --profile <kv...>', 'profile pairs (key=value), pass multiple')
    .option('--json', 'emit raw JSON')
    .action((password, opts) => require('./commands/score').run({ password, ...opts }));

  program
    .command('wordgen')
    .description('generate an adversarial wordlist from a profile')
    .option('-p, --profile <kv...>', 'profile pairs (key=value), pass multiple')
    .option('-l, --limit <n>', 'cap the candidate count', v => parseInt(v, 10), 40)
    .option('--json', 'emit raw JSON instead of one-per-line')
    .action(opts => require('./commands/wordgen').run(opts));

  // ─── API-backed ────────────────────────────────────────────────────────
  program
    .command('submit <file>')
    .description('upload a file to the backend for AI-backed PII analysis')
    .option('--json', 'emit raw JSON')
    .action((file, opts) => require('./commands/submit').run({ file, ...opts }));

  program
    .command('history')
    .description('list recent analyses')
    .option('-l, --limit <n>', 'rows to show', v => parseInt(v, 10), 20)
    .option('--json', 'emit raw JSON')
    .action(opts => require('./commands/history').run(opts));

  program
    .command('darkweb <query>')
    .description('breach-search the configured dark-web sources')
    .option('--json', 'emit raw JSON')
    .action((query, opts) => require('./commands/darkweb').run({ query, ...opts }));

  program
    .command('risk <target>')
    .description('compute a financial-risk score for the named target')
    .option('--json', 'emit raw JSON')
    .action((target, opts) => require('./commands/risk').run({ target, ...opts }));

  program
    .command('inbox')
    .description('list messages from the operations inbox')
    .option('--json', 'emit raw JSON')
    .action(opts => require('./commands/inbox').run(opts));

  // ─── local config + mode ───────────────────────────────────────────────
  program
    .command('mode [value]')
    .description('show or set the local mode (controls prompt color)')
    .action((value) => require('./commands/mode').run({ value }));

  program
    .command('config <action> [key] [value]')
    .description('inspect or mutate ~/.piicasso/config.json (list|get|set|unset)')
    .action((action, key, value) => require('./commands/config').run({ action, key, value }));

  // ─── REPL ──────────────────────────────────────────────────────────────
  program
    .command('repl')
    .description('start the interactive terminal (default when no args are given)')
    .action(() => require('./repl').start());

  return program;
}

function main(argv) {
  const args = (argv || process.argv).slice(2);
  // No args at all → enter REPL. Matches the in-browser terminal UX where
  // typing `piicasso` lands you in a prompt instead of a help screen.
  if (args.length === 0) {
    return require('./repl').start();
  }
  const program = build();
  program.parseAsync(argv || process.argv).catch(e => {
    console.error(err(`error: ${e && e.message ? e.message : e}`));
    process.exit(1);
  });
}

if (require.main === module || require.main === require('module')) {
  main();
} else {
  main();
}

module.exports = { build, main };
