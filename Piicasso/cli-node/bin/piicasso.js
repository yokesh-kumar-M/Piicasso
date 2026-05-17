#!/usr/bin/env node
/**
 * piicasso — CLI entrypoint.
 *
 * Thin shim that delegates to src/index.js. Kept tiny so global installs and
 * `npm link` resolutions are fast.
 */
'use strict';

require('../src/index');
