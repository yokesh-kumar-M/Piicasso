/**
 * repl.js — interactive terminal that mirrors frontend/src/components/Terminal.js.
 *
 * Same command surface as the browser terminal plus all CLI subcommands.
 * Prompt color follows the local mode setting (cyan/user, red/security).
 */
'use strict';

const readline = require('readline');
const { palette, banner, err, ok, dim, out, label } = require('./ui/theme');
const store = require('./config/store');

const ALL_COMMANDS = [
  'help', 'clear', 'mode', 'switch', 'whoami', 'routes', 'echo', 'about', 'exit', 'quit',
  'analyze', 'redact', 'score', 'wordgen', 'submit', 'history', 'darkweb', 'risk',
  'inbox', 'login', 'logout', 'config',
];

const HELP_LINES = [
  ['help',                  'show this help text'],
  ['clear',                 'wipe the terminal'],
  ['mode',                  'print the current mode'],
  ['switch <user|security>', 'change the active mode'],
  ['whoami',                'show the authenticated user'],
  ['routes',                'list known CLI commands'],
  ['analyze <text>',        'detect PII in text (local)'],
  ['redact <text>',         'print text with PII masked (local)'],
  ['score <pw>',            'score a password (local)'],
  ['wordgen -p k=v',        'generate a wordlist (local)'],
  ['submit <file>',         'upload a file for AI analysis (API)'],
  ['history',               'list recent analyses (API)'],
  ['darkweb <q>',           'breach-search (API)'],
  ['risk <target>',         'financial-risk score (API)'],
  ['inbox',                 'list messages (API)'],
  ['login | logout',        'manage credentials'],
  ['config get|set <k>',    'inspect / mutate config'],
  ['echo <text>',           'echo back text'],
  ['about',                 'short blurb about PIIcasso'],
  ['exit | quit',           'leave the terminal'],
];

const ABOUT = [
  'PIIcasso — PII exposure intelligence & adversarial wordlist platform.',
  'Two modes: user (defensive) and security (offensive ops).',
  'This is the local CLI shell. Local commands run instantly; API commands need `piicasso login`.',
];

/** Run a single subcommand by name with already-parsed argv. */
async function dispatch(name, argv) {
  switch (name) {
    case 'analyze':
      return require('./commands/analyze').run(parseFlags(argv, { positional: 'text' }));
    case 'redact':
      return require('./commands/redact').run(parseFlags(argv, { positional: 'text' }));
    case 'score':
      return require('./commands/score').run(parseFlags(argv, { positional: 'password' }));
    case 'wordgen':
      return require('./commands/wordgen').run(parseFlags(argv, { profileFlag: true, limitFlag: true }));
    case 'submit':
      return require('./commands/submit').run({ file: argv[0] });
    case 'history':
      return require('./commands/history').run(parseFlags(argv, { limitFlag: true }));
    case 'darkweb':
      return require('./commands/darkweb').run({ query: argv.join(' ') });
    case 'risk':
      return require('./commands/risk').run({ target: argv.join(' ') });
    case 'inbox':
      return require('./commands/inbox').run({});
    case 'login':
      return require('./commands/login').run();
    case 'logout':
      store.clearAuth();
      console.log(ok('signed out.'));
      return;
    case 'config': {
      const [action, key, ...rest] = argv;
      return require('./commands/config').run({ action, key, value: rest.join(' ') || undefined });
    }
    case 'whoami':
      return require('./commands/whoami').run();
    default:
      throw new Error(`command not found: ${name}`);
  }
}

/** Parse REPL-style argv into a shape the command handlers expect. */
function parseFlags(argv, { positional, profileFlag, limitFlag } = {}) {
  const opts = {};
  const positionals = [];
  const profiles = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if ((a === '-p' || a === '--profile') && argv[i + 1]) { profiles.push(argv[++i]); continue; }
    if ((a === '-l' || a === '--limit') && argv[i + 1])   { opts.limit = parseInt(argv[++i], 10); continue; }
    if (a === '-f' || a === '--file') { opts.file = argv[++i]; continue; }
    if (a === '--json') { opts.json = true; continue; }
    positionals.push(a);
  }
  if (profileFlag) opts.profile = profiles;
  if (positional && positionals.length) opts[positional] = positionals.join(' ');
  if (!limitFlag && positional !== 'text' && positional !== 'password' && positionals.length) {
    opts._ = positionals;
  }
  return opts;
}

function printHelp(p) {
  console.log(label('commands:'));
  for (const [cmd, desc] of HELP_LINES) {
    console.log(`  ${out(cmd.padEnd(24))} ${dim(desc)}`);
  }
}

function printRoutes() {
  console.log(label('CLI commands:'));
  for (const c of ALL_COMMANDS) console.log('  ' + out(c));
}

/** Tokenise a line, honoring "double quotes" for multi-word args. */
function tokenize(line) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  }
  return out;
}

function makePrompt() {
  const p = palette();
  return p.accent(p.prompt) + ' ';
}

function start() {
  for (const line of banner()) console.log(line);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    historySize: 200,
    completer(line) {
      const hits = ALL_COMMANDS.filter(c => c.startsWith(line));
      return [hits.length ? hits : ALL_COMMANDS, line];
    },
    prompt: makePrompt(),
  });

  rl.prompt();
  rl.on('line', async (raw) => {
    const line = raw.trim();
    if (!line) { rl.setPrompt(makePrompt()); return rl.prompt(); }
    const argv = tokenize(line);
    const cmd = (argv.shift() || '').toLowerCase();

    try {
      switch (cmd) {
        case 'help':
        case '?':
          printHelp();
          break;
        case 'clear':
          process.stdout.write('\x1b[2J\x1b[0f');
          break;
        case 'mode':
          console.log(dim('current mode: ') + ok(store.getMode()));
          break;
        case 'switch': {
          const next = (argv[0] || '').toLowerCase();
          if (next !== 'user' && next !== 'security') {
            console.error(err('usage: switch user|security'));
            break;
          }
          store.update({ mode: next });
          console.log(ok(`mode -> ${next}`));
          rl.setPrompt(makePrompt());
          break;
        }
        case 'routes':
          printRoutes();
          break;
        case 'about':
          for (const l of ABOUT) console.log(out(l));
          break;
        case 'echo':
          console.log(argv.join(' '));
          break;
        case 'exit':
        case 'quit':
          rl.close();
          return;
        default:
          if (!ALL_COMMANDS.includes(cmd)) {
            console.error(err(`command not found: ${cmd}`));
            break;
          }
          // Wrap dispatch so a single bad call doesn't process.exit() us.
          await runGuarded(() => dispatch(cmd, argv));
      }
    } catch (e) {
      console.error(err(`error: ${e && e.message ? e.message : e}`));
    }
    rl.setPrompt(makePrompt());
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(dim('\nbye.'));
    process.exit(0);
  });
}

/** Run `fn` but swallow process.exit calls so the REPL survives a single command failure. */
function runGuarded(fn) {
  return new Promise((resolve) => {
    const realExit = process.exit;
    let exited = false;
    process.exit = (code) => { exited = true; resolve(code); };
    Promise.resolve()
      .then(fn)
      .catch((e) => {
        if (!exited) console.error(err(`error: ${e && e.message ? e.message : e}`));
        resolve();
      })
      .finally(() => {
        process.exit = realExit;
        resolve();
      });
  });
}

module.exports = { start };
