/**
 * theme.js — mode-aware chalk helpers.
 *
 * Matches the palette of frontend/src/components/Terminal.js:
 *   user      → cyan/blue
 *   security  → red/crimson
 *
 * Errors are always red regardless of mode.
 */
'use strict';

const chalk = require('chalk');
const { getMode } = require('../config/store');

function palette(mode) {
  const m = mode || getMode();
  if (m === 'security') {
    return {
      name: 'security',
      prompt: 'sec@piicasso:~#',
      accent: chalk.red,
      accentSoft: chalk.redBright,
      banner: chalk.redBright,
    };
  }
  return {
    name: 'user',
    prompt: 'user@piicasso:~$',
    accent: chalk.cyan,
    accentSoft: chalk.cyanBright,
    banner: chalk.cyanBright,
  };
}

const err = chalk.red;
const ok = chalk.green;
const dim = chalk.gray;
const out = chalk.whiteBright;
const label = chalk.yellow;

function banner(mode) {
  const p = palette(mode);
  const lines = [
    '╔══════════════════════════════════════════════════════════╗',
    '║              PIIcasso Interactive Terminal               ║',
    `║                Mode: ${p.name.toUpperCase().padEnd(8)}                          ║`,
    '╚══════════════════════════════════════════════════════════╝',
  ];
  return lines.map(l => p.banner(l)).concat([dim("Type 'help' to list available commands."), '']);
}

module.exports = { palette, banner, err, ok, dim, out, label };
